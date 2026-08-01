---
title: "Ray+Triton vs Ray+vLLM 离线推理架构对比 - 第3章: Ray+vLLM Actor 架构详解"
book: "Ray+Triton vs Ray+vLLM：离线推理架构对比"
chapter: "3"
chapterTitle: "Ray + vLLM Actor 内离线推理架构详解"
description: "深入解析 Ray Actor 如何嵌入 vLLM LLM 引擎、Placement Group 如何分配 CPU/GPU 资源、以及进程内推理的数据流路径"
date: "2026-08-01"
updatedAt: "2026-08-01"
agent: "研究员→编辑→审校员"
tags:
  - "Ray"
  - "vLLM"
  - "Actor"
  - "Placement Group"
  - "离线推理"
type: "book"
---

# 第 3 章：Ray + vLLM Actor 内离线推理架构详解

> **学习目标**：理解 Ray Actor 如何嵌入 vLLM 的 LLM 引擎，掌握 Placement Group 的 GPU 资源分配机制，以及进程内推理的数据流路径和关键性能特性。

---

## 3.1 核心思想：推理引擎即 Actor

架构 B 的设计哲学是：**不要把推理引擎当作外部服务，而是当作 Ray 集群中的一个 Actor**。

```python
import ray
from vllm import LLM, SamplingParams

@ray.remote(num_gpus=1)
class vLLMActor:
    def __init__(self, model_name, **kwargs):
        # vLLM LLM 引擎直接在 Actor 进程内初始化
        self.llm = LLM(
            model=model_name,
            gpu_memory_utilization=0.95,
            enable_prefix_caching=True,
            **kwargs
        )

    def generate(self, prompts, sampling_params):
        # 进程内函数调用，无网络开销
        outputs = self.llm.generate(prompts, sampling_params)
        return outputs
```

这段代码体现了架构 B 的全部核心：vLLM 的 `LLM` 实例就是 Actor 的一个成员变量，推理调用就是一个普通的 Python 方法调用。

---

## 3.2 进程模型：单一进程

```
机器物理视图
┌─────────────────────────────────────────────────────┐
│                    物理机 (1台)                      │
│                                                       │
│  ┌──────────────────────────────────────────────────┐│
│  │              Ray Actor (GPU)                     ││
│  │                                                    ││
│  │  ┌─────────────┐    ┌──────────────────────┐    ││
│  │  │  CPU 线程    │    │  GPU (全部)          │    ││
│  │  │             │    │                      │    ││
│  │  │ • 数据加载   │    │ • vLLM Engine        │    ││
│  │  │ • Tokenize  │───→│ • KV Cache           │    ││
│  │  │ • 后处理    │    │ • CUDA Kernels       │    ││
│  │  │ • 结果写入   │←───│ • PagedAttention     │    ││
│  │  │             │    │                      │    ││
│  │  └─────────────┘    └──────────────────────┘    ││
│  │                                                    ││
│  │           同一个进程，同一地址空间                  ││
│  └──────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
```

**关键特征**：
- **单一进程**：数据加载、tokenize、推理、后处理都在同一个 Actor 进程内
- **同一地址空间**：CPU 代码和 GPU 代码可以直接共享 Python 对象
- **GPU 独占**：`num_gpus=1` 让 Ray 把整张 GPU 分配给这个 Actor

---

## 3.3 vLLM LLM 引擎的初始化

vLLM 的 `LLM` 类在初始化时会完成以下步骤：

```python
class vLLMActor:
    def __init__(self, model_name, **kwargs):
        # 1. 加载模型权重到 GPU
        # 2. 分配 KV Cache 内存池（gpu_memory_utilization 控制）
        # 3. 初始化 PagedAttention 的 Block Table
        # 4. 编译/加载 CUDA kernels
        # 5. 如果启用 CUDA Graph，捕获推理图
        self.llm = LLM(
            model=model_name,
            gpu_memory_utilization=0.95,      # 离线拉满
            enable_prefix_caching=True,       # 离线主动设计前缀
            enforce_eager=False,              # 启用 CUDA Graph
            max_model_len=4096,               # 截断不必要长度
            enable_chunked_prefill=True,      # 长 prompt 不阻塞
            **kwargs
        )
```

**初始化耗时**：7B 模型约 15-30 秒，70B INT4 模型约 60-120 秒。这是架构 B 的一个劣势——Actor 重启需要重新加载模型（详见第 7 章故障恢复）。

---

## 3.4 Placement Group：精确控制资源

当单机有多张 GPU 时，可以用 Placement Group 精确控制 Actor 的放置位置：

```python
import ray
from ray.util.placement_group import placement_group

# 场景：单机 4 张 A100，运行 2 个模型各占 2 张 GPU (TP=2)

pg = placement_group(
    bundles=[
        {"GPU": 2, "CPU": 16},  # bundle 0: 给模型 A
        {"GPU": 2, "CPU": 16},  # bundle 1: 给模型 B
    ],
    strategy="STRICT_SPREAD"     # 保证 bundle 在不同 GPU 上
)
ray.get(pg.ready())

# 模型 A 的 Actor
actor_a = vLLMActor.options(
    placement_group=pg,
    placement_group_bundle_index=0,
    num_gpus=2,
).remote("model-a", tensor_parallel_size=2)

# 模型 B 的 Actor
actor_b = vLLMActor.options(
    placement_group=pg,
    placement_group_bundle_index=1,
    num_gpus=2,
).remote("model-b", tensor_parallel_size=2)
```

**Placement Group 的作用**：
- 防止多个 Actor 争抢同一 GPU
- 保证 TP=2 的 Actor 拿到 2 张连续 GPU
- CPU 资源也同步隔离，避免 tokenize 竞争

---

## 3.5 数据流路径：进程内零拷贝

架构 B 的数据流完全没有序列化：

```
Actor 进程内部
┌─────────────────────────────────────────────────┐
│                                                   │
│  1. 数据加载 (CPU)                                │
│     dataset[i] → raw_text (str)                   │
│         ↓                                         │
│  2. Tokenize (CPU)                                │
│     tokenizer.encode(raw_text) → input_ids (list) │
│         ↓                                         │
│  3. 推理调用 (CPU → GPU)                          │
│     llm.generate(input_ids) ──────────┐          │
│                                        ↓          │
│  4. GPU 推理 (GPU)                    ┌────────┐  │
│     │ Prefill: QK^T → softmax → V   │ GPU    │  │
│     │ Decode: 自回归生成              │ HBM    │  │
│     │ KV Cache: PagedAttention       │ SRAM   │  │
│     └────────────────────────────────└────────┘  │
│         ↓                                         │
│  5. 结果返回 (GPU → CPU)                          │
│     output_ids (tensor on GPU)                    │
│     → .cpu() → output_ids (tensor on CPU)         │
│         ↓                                         │
│  6. Detokenize (CPU)                              │
│     tokenizer.decode(output_ids) → text (str)     │
│         ↓                                         │
│  7. 后处理 (CPU)                                  │
│     parse/validate/save                           │
│                                                   │
└─────────────────────────────────────────────────┘
```

**对比架构 A 的数据流**：

| 步骤 | 架构 A (Ray+Triton) | 架构 B (Ray+vLLM Actor) |
|------|---------------------|------------------------|
| 数据加载 | Ray Worker (CPU) | Actor (CPU) |
| Tokenize | Ray Worker (CPU) | Actor (CPU) |
| 序列化 | **protobuf 编码** | 无 |
| 传输 | **gRPC localhost** | 无 |
| 反序列化 | **Triton 解码** | 无 |
| 推理 | Triton (GPU) | Actor (GPU) |
| 结果传输 | **gRPC localhost** | 无 |
| 结果反序列化 | **protobuf 解码** | 无 |
| Detokenize | Ray Worker (CPU) | Actor (CPU) |
| 后处理 | Ray Worker (CPU) | Actor (CPU) |

架构 B 省掉了 6 个序列化/传输/反序列化步骤。

---

## 3.6 Continuous Batching：引擎内调度

vLLM 的 Continuous Batching 与 Triton 的 Dynamic Batcher 有本质区别：

```
vLLM Continuous Batching 工作流（Actor 内部）

Step 1: Actor 收到 3 个 prompt
  prompt A (len=128)  →  prefill
  prompt B (len=256)  →  prefill
  prompt C (len=64)   →  prefill

Step 2: 进入 decode 阶段，每个 step 生成 1 个 token
  A: [prefill done] → decode token 1
  B: [prefill done] → decode token 1
  C: [prefill done] → decode token 1

  → vLLM 把 A/B/C 放在同一个 batch 中 decode
  → 不需要 padding（PagedAttention 按 block 管理）

Step 3: prompt C 在 step 5 结束（只生成 5 个 token）
  C: done, 从 batch 中移除
  A: continue decode token 6
  B: continue decode token 6

  → 立即可以加入新请求 D
  D: prefill → 与 A/B 的 decode 同时进行（chunked prefill）
```

**关键差异**：
- **Triton Dynamic Batcher**：在请求入口处聚合，padding 到最长序列，整批执行
- **vLLM Continuous Batching**：在引擎内部逐 token 调度，PagedAttention 消除 padding，prefill/decode 交错

---

## 3.7 Ray 编排：Actor 池模式

架构 B 的典型编排方式：

```python
@ray.remote(num_gpus=1)
class vLLMActor:
    def __init__(self, model_name, **kwargs):
        self.llm = LLM(model=model_name, **kwargs)
        self.tokenizer = self.llm.get_tokenizer()

    def generate(self, prompts, **sampling_kwargs):
        params = SamplingParams(**sampling_kwargs)
        outputs = self.llm.generate(prompts, params)
        return [
            {"prompt": o.prompt, "text": o.outputs[0].text}
            for o in outputs
        ]

    def health_check(self):
        return True

# 启动 Actor 池
actors = [
    vLLMActor.remote(
        "meta-llama/Llama-3-8B",
        gpu_memory_utilization=0.95,
        enable_prefix_caching=True,
    )
    for _ in range(1)  # 单机推理：1 个 Actor 占 1 张 GPU
]

# 分发数据
from ray.util import ActorPool
pool = ActorPool(actors)

def submit_fn(actor, data_chunk):
    return actor.generate.remote(data_chunk, temperature=0.7, max_tokens=512)

results = list(pool.map_unordered(
    lambda actor, data: actor.generate.remote(data, max_tokens=512),
    data_chunks
))
```

**Actor 池模式的优势**：
- Ray 自动分配数据 chunk 给空闲的 Actor
- Actor 内部 vLLM 的 continuous batching 自动聚合
- 无需手动管理 batch 组装

---

## 3.8 生命周期管理

架构 B 的启动流程：

```python
# Step 1: 启动 Ray
ray.init()

# Step 2: 创建 Actor（自动加载模型）
actor = vLLMActor.remote("meta-llama/Llama-3-8B", ...)
# → 模型加载在 Actor.__init__ 中完成
# → 此时 GPU 被占用

# Step 3: 运行推理
results = ray.get(actor.generate.remote(prompts))

# Step 4: 销毁 Actor（自动释放 GPU）
ray.kill(actor)
# 或 actor.__ray_terminate__.remote()
```

**与架构 A 的关键差异**：
- 模型加载与 Actor 生命周期绑定——Actor 死了模型就没了
- 没有「常驻推理服务」的概念——每次 Ray 作业都要重新加载模型
- 但如果用 Ray Serve 部署 Actor，可以实现类似常驻的效果

---

## 3.9 vLLM 的资源管理

vLLM 通过 `gpu_memory_utilization` 控制显存使用：

```python
LLM(
    model="...",
    gpu_memory_utilization=0.95,
    # vLLM 会：
    # 1. 测量 GPU 总显存
    # 2. 预留 5% 给 activations 和临时变量
    # 3. 用剩余 95% 加载模型权重 + 分配 KV Cache 池
)
```

**与 Triton 的差异**：

| 资源管理 | Triton | vLLM |
|---------|--------|------|
| 显存分配 | `gpu_memory_fraction`（模型级） | `gpu_memory_utilization`（全局） |
| KV Cache | 由 backend 管理（如 TensorRT-LLM） | PagedAttention Block 池 |
| 多模型共享 | 支持，CUDA Stream 并发 | 不支持，一个 Actor 一个模型 |
| Ray 可见性 | Ray 看不到 GPU 使用 | Ray 通过 `num_gpus` 感知 |

---

## 3.10 本章小结

架构 B（Ray + vLLM Actor）的核心特征：

1. **单一进程**：数据加载、tokenize、推理、后处理全部在 Actor 进程内完成
2. **零序列化**：进程内函数调用，无 protobuf 编码/解码，无网络传输
3. **Continuous Batching**：vLLM 引擎内部逐 token 调度，PagedAttention 消除 padding
4. **Ray 原生**：通过 `num_gpus` 和 Placement Group 直接管理 GPU 资源
5. **生命周期耦合**：模型加载与 Actor 绑定，Actor 重启需要重新加载模型

两种架构都讲完了。接下来的章节将从通信开销、资源调度、批处理、故障恢复、性能等维度进行正面对比。
