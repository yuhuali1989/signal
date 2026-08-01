---
title: "Ray+Triton vs Ray+vLLM 离线推理架构对比 - 第2章: Ray+Triton 架构详解"
book: "Ray+Triton vs Ray+vLLM：离线推理架构对比"
chapter: "2"
chapterTitle: "Ray + 远程 Triton 架构详解"
description: "深入解析 Triton Inference Server 的进程模型、模型仓库、Dynamic Batcher 机制，以及 Ray 如何编排数据流水线并通过 gRPC 与 Triton 交互"
date: "2026-08-01"
updatedAt: "2026-08-01"
agent: "研究员→编辑→审校员"
tags:
  - "Ray"
  - "Triton"
  - "gRPC"
  - "Dynamic Batching"
  - "离线推理"
type: "book"
---

# 第 2 章：Ray + 远程 Triton 架构详解

> **学习目标**：理解 Triton Inference Server 的进程模型、模型仓库结构和 Dynamic Batcher 工作原理，掌握 Ray 如何通过 gRPC 客户端与 Triton 交互完成离线推理流水线。

---

## 2.1 Triton Inference Server 是什么

NVIDIA Triton Inference Server 是一个开源的推理服务框架，专为生产环境设计。它的核心能力包括：

- **多框架支持**：TensorFlow、PyTorch、ONNX Runtime、TensorRT、Python backend
- **动态 Batching**：自动将多个请求聚合成一个 batch 执行
- **多模型管理**：一个 server 实例同时加载多个模型
- **模型热更新**：通过模型仓库轮询，无需重启即可加载新版本
- **并发执行**：多个模型实例在不同 CUDA Stream 上并行执行

在 LLM 推理场景中，Triton 通常搭配 **TensorRT-LLM backend** 或 **vLLM backend**（Triton 24.06+ 支持将 vLLM 作为 backend）来运行大模型。

---

## 2.2 进程模型：两个独立进程

架构 A 的关键特征是**两个独立进程**：

```
机器物理视图
┌─────────────────────────────────────────────────────┐
│                    物理机 (1台)                      │
│                                                       │
│  ┌──────────────┐         ┌──────────────────────┐  │
│  │  Ray Worker   │  gRPC   │  Triton Server       │  │
│  │  (Python)     │←──────→│  (C++ + Python)      │  │
│  │               │  :8001  │                       │  │
│  │  - 数据加载    │         │  - 模型加载           │  │
│  │  - Tokenize   │         │  - KV Cache 管理      │  │
│  │  - 后处理     │         │  - Dynamic Batching   │  │
│  │  - 结果写入    │         │  - GPU 推理           │  │
│  │               │         │                       │  │
│  │  CPU only     │         │  GPU (全部)           │  │
│  └──────────────┘         └──────────────────────┘  │
│       进程 1                    进程 2               │
└─────────────────────────────────────────────────────┘
```

**进程 1（Ray Worker）**：
- 运行在 CPU 上
- 负责数据加载、tokenize、结果后处理
- 通过 Triton 的 Python gRPC 客户端发送推理请求
- 可以启动多个 Ray Worker 并行处理数据

**进程 2（Triton Server）**：
- 运行在 GPU 上
- 独立管理模型加载、KV Cache、GPU 内存
- 接收 gRPC 请求，执行推理，返回结果
- 有自己的生命周期，独立于 Ray 启停

---

## 2.3 模型仓库（Model Repository）

Triton 通过模型仓库管理模型文件。一个典型的 TensorRT-LLM 模型仓库结构：

```
model_repository/
└── llama-3-8b/
    ├── 1/                          # 版本号
    │   └── model.plan              # TensorRT-LLM 编译后的 engine
    └── config.pbtxt                # 模型配置
```

`config.pbtxt` 的核心配置：

```
name: "llama-3-8b"
backend: "tensorrtllm"
max_batch_size: 256

input [
  {
    name: "input_ids"
    data_type: TYPE_INT32
    dims: [ -1 ]                    # 变长序列
  },
  {
    name: "input_lengths"
    data_type: TYPE_INT32
    dims: [ 1 ]
  }
]

output [
  {
    name: "output_ids"
    data_type: TYPE_INT32
    dims: [ -1, -1 ]
  }
]

dynamic_batching {
  preferred_batch_size: [ 4, 8, 16, 32, 64 ]
  max_queue_delay_microseconds: 1000
  preserve_ordering: true
}

instance_group [
  {
    kind: KIND_GPU
    count: 1
    gpus: [ 0 ]
  }
]

parameters: {
  key: "gpu_memory_fraction"
  value: { string_value: "0.9" }
}
```

**关键配置项**：

- `max_batch_size`：Triton 动态 batching 的最大 batch 大小
- `preferred_batch_size`：Dynamic Batcher 会尝试凑这些大小的 batch
- `max_queue_delay_microseconds`：请求最多在队列中等多久就强制执行
- `instance_group`：控制模型实例数和 GPU 分配

---

## 2.4 Dynamic Batcher 详解

Dynamic Batcher 是 Triton 的核心优势之一。它的工作流程：

```
时间线 ──────────────────────────────────────────→

t=0ms    请求 A 到达 (seq_len=128)
t=2ms    请求 B 到达 (seq_len=256)
t=5ms    请求 C 到达 (seq_len=64)
t=8ms    请求 D 到达 (seq_len=512)

         Dynamic Batcher 逻辑：
         - 检查队列：4 个请求
         - preferred_batch_size=[4,8,16,32,64]
         - 4 个请求 < preferred 8，但 max_queue_delay=1ms 已过
         - 决定：batch=4，立即执行

t=8ms    ┌──────────────────────────────────┐
         │  GPU 执行 batch=[A,B,C,D]        │
         │  padding 到 max_seq_len=512      │
         │  执行推理                         │
         └──────────────────────────────────┘
t=45ms   返回 4 个结果
```

**问题 1：Padding 浪费**

Triton 的 Dynamic Batcher 把不同长度的请求拼成一个 batch，需要 pad 到最长序列。上面的例子中，A(128) 和 C(64) 被 pad 到 512，浪费了 75%+ 的计算。

**问题 2：队列延迟 vs 吞吐的矛盾**

- `max_queue_delay_microseconds` 小 → 等不够时间凑不满 batch → GPU 利用率低
- `max_queue_delay_microseconds` 大 → 等够了 batch 但请求在排队 → 首延迟高

离线推理对延迟不敏感，可以把这个值设大（如 10000μs = 10ms）来凑更大的 batch。但即便如此，padding 浪费依然存在。

---

## 2.5 Ray 编排：数据流水线

Ray 在架构 A 中的角色是**数据编排器**。典型流水线：

```python
import ray
from tritonclient.http import InferenceServerClient

@ray.remote(num_cpus=2)
class DataProcessor:
    def __init__(self, triton_url="localhost:8000"):
        self.triton = InferenceServerClient(url=triton_url)
        self.tokenizer = AutoTokenizer.from_pretrained("...")

    def process_batch(self, texts):
        # 1. Tokenize
        inputs = self.tokenizer(texts, padding=True, return_tensors="pt")

        # 2. 发送到 Triton
        outputs = self.triton.infer(
            model_name="llama-3-8b",
            inputs=[...],
            outputs=[...]
        )

        # 3. Detokenize + 后处理
        results = self.tokenizer.batch_decode(outputs)
        return results

# 启动多个 DataProcessor
processors = [
    DataProcessor.remote()
    for _ in range(8)  # 8 个 CPU worker
]

# 分发数据
futures = []
for batch in data_batches:
    worker = processors[len(futures) % 8]
    futures.append(worker.process_batch.remote(batch))

results = ray.get(futures)
```

**注意**：在这个架构中，Ray Worker **不持有 GPU**。所有 GPU 计算发生在 Triton 进程中。Ray Worker 只负责「喂数据」和「收结果」。

---

## 2.6 gRPC 通信协议

Triton 支持两种通信协议：

| 协议 | 端口 | 序列化 | 延迟 | 适用场景 |
|------|------|--------|------|---------|
| HTTP | 8000 | JSON | 较高（~1ms） | 调试、低吞吐 |
| gRPC | 8001 | Protocol Buffers | 较低（~0.3ms） | 生产、高吞吐 |

离线推理应该**始终用 gRPC**。

gRPC 通信的数据流：

```
Ray Worker 进程                      Triton 进程
┌──────────────┐                    ┌──────────────┐
│ Python 对象   │                    │              │
│ input_ids    │                    │              │
│ (tensor)     │                    │              │
│      ↓       │                    │              │
│ 序列化        │                    │              │
│ tensor →     │  ──TCP socket──→  │ 反序列化      │
│ protobuf     │   localhost        │ protobuf →   │
│ bytes        │   :8001            │ tensor       │
│              │                    │      ↓       │
│              │                    │ GPU 推理     │
│              │                    │      ↓       │
│              │                    │ 序列化        │
│ 反序列化      │  ←─TCP socket───  │ tensor →     │
│ protobuf →   │   localhost        │ protobuf     │
│ tensor       │   :8001            │ bytes        │
│      ↓       │                    │              │
│ Python 对象   │                    │              │
│ output_ids   │                    │              │
└──────────────┘                    └──────────────┘
```

每次推理请求需要经历：
1. **Tensor → Protobuf 序列化**：将 int32 tensor 编码为 protobuf message
2. **TCP 传输**：通过 localhost socket 发送 bytes
3. **Protobuf → Tensor 反序列化**：Triton 解码 protobuf 为 GPU tensor
4. **GPU 推理**
5. **Tensor → Protobuf 序列化**：输出 tensor 编码
6. **TCP 传输**：返回结果
7. **Protobuf → Tensor 反序列化**：Ray Worker 解码

对于一个 batch_size=32、seq_len=512 的 INT32 tensor，序列化大小约 64KB。序列化+反序列化+传输的总开销约为 **0.5-2ms**（取决于 batch 大小和序列长度）。

---

## 2.7 Triton 的资源管理

Triton 通过 `instance_group` 控制 GPU 资源分配：

```
# 单模型独占 GPU
instance_group [
  { kind: KIND_GPU, count: 1, gpus: [0] }
]

# 多模型共享 GPU
instance_group [
  { kind: KIND_GPU, count: 1, gpus: [0] }
]
# model A 和 model B 都分配到 GPU 0
# Triton 通过 CUDA Stream 实现并发
```

`gpu_memory_fraction` 控制每个模型可以使用的显存比例：

```
# 模型 A 使用 50% 显存
parameters: {
  key: "gpu_memory_fraction"
  value: { string_value: "0.5" }
}
```

**关键问题**：Triton 独立管理 GPU 内存，Ray 无法感知 GPU 使用情况。如果 Ray 也试图在同一 GPU 上调度任务，会导致 OOM。因此在架构 A 中，**GPU 必须完全交给 Triton，Ray Worker 只用 CPU**。

---

## 2.8 生命周期管理

架构 A 的启动流程：

```bash
# Step 1: 启动 Triton Server
tritonserver \
  --model-repository=/models \
  --http-port=8000 \
  --grpc-port=8001 \
  --metrics-port=8002 \
  --cuda-memory-pool-size-bytes=0:8000000000  # GPU 0: 8GB pool

# Step 2: 等待模型加载完成（健康检查）
curl localhost:8000/v2/health/ready

# Step 3: 启动 Ray
ray start --head

# Step 4: 运行 Ray 数据流水线
python run_pipeline.py

# Step 5: Ray 结束后关闭 Triton
# (或 Triton 作为常驻服务，不被 Ray 生命周期管理)
```

这个启动顺序揭示了架构 A 的一个特点：**Triton 和 Ray 有独立的生命周期**。Triton 可以作为常驻服务一直运行，多个 Ray 作业可以复用同一个 Triton 实例。这是架构 A 的一个重要优势——**模型加载只需要一次**。

---

## 2.9 本章小结

架构 A（Ray + Triton）的核心特征：

1. **双进程模型**：Ray Worker（CPU）和 Triton Server（GPU）是独立进程，通过 gRPC 通信
2. **Dynamic Batcher**：Triton 在服务端自动聚合请求，但有 padding 浪费和队列延迟问题
3. **GPU 独占**：Triton 管理 GPU，Ray 无法干预 GPU 资源
4. **独立生命周期**：Triton 可以常驻，多个 Ray 作业复用
5. **序列化开销**：每次推理请求需要 protobuf 序列化 + localhost 传输

在下一章中，我们将看到架构 B 如何通过「把推理引擎嵌入 Ray Actor」来解决其中一些问题，同时引入新的权衡。
