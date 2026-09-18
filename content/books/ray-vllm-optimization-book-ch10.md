---
title: "Ray+vLLM 参数优化深度全书 - 第10章: Ray 层优化与综合调优实战"
book: "Ray+vLLM 离线推理参数优化深度全书"
chapter: "10"
chapterTitle: "Ray 层优化与综合调优实战：从参数到架构的完整优化链路"
description: "讲解 Ray Actor 资源配置、并发控制、数据流转等 Ray 层优化，给出完整的调优 checklist 和不同场景的最优配置模板"
date: "2026-08-01"
updatedAt: "2026-09-18"
agent: "研究员→编辑→审校员"
tags:
  - "Ray"
  - "vLLM"
  - "综合调优"
  - "Actor"
  - "并发控制"
  - "Ray Data"
  - "多模态 caption"
  - "离线批处理"
type: "book"
---

# 第 10 章：Ray 层优化与综合调优实战

> **学习目标**：掌握 Ray Actor 层面的资源配置和并发控制策略，理解 Ray Object Store 在数据流转中的作用，能根据场景组合所有优化参数形成完整方案。

---

## 10.1 Ray Actor 资源配置

### 10.1.1 Actor 资源声明

在 Ray+vLLM 组合中，vLLM 的 `LLM` 实例通常包装在 Ray Actor 中。Actor 的资源配置直接影响 vLLM 的可用资源：

```python
import ray

@ray.remote(
    num_gpus=1,          # 分配 1 张 GPU
    num_cpus=12,         # 分配 12 个 CPU 核
    memory=64 * 1024**3, # 64GB 系统内存
)
class vLLMActor:
    def __init__(self, model_name, **kwargs):
        self.llm = LLM(
            model=model_name,
            tensor_parallel_size=1,  # 单卡
            **kwargs
        )
    
    def generate(self, prompts, sampling_params):
        return self.llm.generate(prompts, sampling_params)
```

### 10.1.2 CPU 资源的重要性

很多人只关注 GPU 资源，忽略了 CPU。vLLM 在推理过程中有大量 CPU 工作：

| CPU 任务 | 耗时 | 影响 |
|---------|------|------|
| Tokenization | ~0.5ms/100 token | 高并发时成为瓶颈 |
| Detokenization | ~0.3ms/100 token | 输出处理 |
| 调度器逻辑 | ~1-2ms/step | 影响单步延迟 |
| 采样计算 | ~0.5ms/step | temperature/top-p 计算 |
| Prefix Cache 查找 | ~0.5ms/step | Block 哈希计算 |

**推荐 CPU 配置**：

| GPU 数 | 推荐 CPU 核数 | 原因 |
|--------|-------------|------|
| 1 GPU | 8-12 核 | 调度器 + tokenize + 采样 |
| 2 GPU (TP=2) | 16-20 核 | 多一个 worker 进程 |
| 4 GPU (TP=4) | 24-32 核 | 4 个 worker 进程 |
| 8 GPU (TP=8) | 48-64 核 | 8 个 worker 进程 + 调度 |

```python
# ❌ CPU 不够：调度器饿死 GPU
@ray.remote(num_gpus=4, num_cpus=4)  # 4 GPU 只配 4 CPU
class vLLMActor: ...

# ✅ CPU 充足
@ray.remote(num_gpus=4, num_cpus=32)  # 每 GPU 配 8 核
class vLLMActor: ...
```

### 10.1.3 系统内存配置

```python
@ray.remote(
    num_gpus=4,
    num_cpus=32,
    memory=128 * 1024**3,  # 128GB 系统内存
)
class vLLMActor: ...
```

系统内存用于：
- Ray Object Store 的数据缓存
- vLLM 的 swap_space（如果启用）
- 模型加载的临时缓冲
- Python 运行时

**推荐**：每 GB GPU 显存配 1-2 GB 系统内存。80GB GPU → 80-160GB 系统内存。

---

## 10.2 Ray Object Store 与数据流转

### 10.2.1 Object Store 的作用

Ray Object Store 是 Ray 的分布式内存存储层，用于 Actor 之间的数据传递：

```
数据流转路径 (Ray + vLLM):

  Driver 进程
    │
    │ ray.put(prompts)  → Object Store (共享内存)
    │
    ▼
  vLLM Actor
    │
    │ ray.get(object_ref)  ← 从 Object Store 读取
    │
    │ llm.generate(prompts)
    │
    │ ray.put(outputs)  → Object Store
    │
    ▼
  Driver 进程
    │
    │ ray.get(output_ref)  ← 获取结果
```

### 10.2.2 Object Store 大小配置

```python
ray.init(
    object_store_memory=50 * 10**9,  # 50GB Object Store
    _system_config={
        "automatic_object_spilling_enabled": True,
        "max_io_workers": 8,
        "object_spilling_config": {
            "type": "filesystem",
            "params": {"directory_path": "/tmp/ray_spill"},
        },
    }
)
```

| 场景 | 推荐 Object Store 大小 | 原因 |
|------|----------------------|------|
| 小数据量 (<10K 条) | 10-20 GB | 足够缓存所有 prompt |
| 中等数据量 (10K-100K) | 30-50 GB | 缓存 prompt + 部分 output |
| 大数据量 (>100K) | 50-100 GB | 需要 spill 到磁盘 |
| 多模型场景 | 100+ GB | 多个 Actor 共享 |

### 10.2.3 数据传输优化

```python
# ❌ 每次调用传大量数据
for prompt in all_prompts:
    actor.generate.remote(prompt, params)  # 10K 次 RPC，每次传 1 条

# ✅ 批量传输
batch_size = 256
for i in range(0, len(all_prompts), batch_size):
    batch = all_prompts[i:i+batch_size]
    # 一次性传 256 条，减少 RPC 次数
    actor.generate.remote(batch, params)

# ✅✅ 使用 Object Store 引用
# 将数据放入 Object Store，只传引用
object_refs = ray.put(all_prompts)
actor.process_all.remote(object_refs)  # 只传引用，不传数据
```

---

## 10.3 并发控制

### 10.3.1 单 Actor 并发

```python
@ray.remote(num_gpus=1)
class vLLMActor:
    def __init__(self, model_name):
        self.llm = LLM(model=model_name, max_num_seqs=256)
        self.semaphore = asyncio.Semaphore(4)  # 限制并发调用数
    
    async def generate(self, prompts, params):
        async with self.semaphore:
            outputs = self.llm.generate(prompts, params)
            return outputs
```

### 10.3.2 多 Actor 并发

```python
# 创建多个 Actor，Round-Robin 分配请求
num_actors = 4
actors = [vLLMActor.remote(model_name) for _ in range(num_actors)]

# 提交请求
futures = []
for i, batch in enumerate(prompt_batches):
    actor = actors[i % num_actors]
    futures.append(actor.generate.remote(batch, params))

# 收集结果
results = ray.get(futures)
```

### 10.3.3 并发数的最优值

| 场景 | 最优并发数 | 原因 |
|------|----------|------|
| 单 Actor, TP=1 | 1 (batch 内部并发) | vLLM 内部已有 Continuous Batching |
| 单 Actor, TP=4 | 1 | 4 卡已被一个 Actor 占满 |
| 多模型场景 | N (每模型 1 Actor) | 不同模型独立推理 |
| 流式处理 | 2-4 per Actor | 流水线化数据加载和推理 |

**关键原则**：**不要在同一个 GPU 上跑多个 vLLM Actor**。vLLM 的 `gpu_memory_utilization` 设计为独占 GPU，多个 Actor 共享 GPU会导致显存竞争和 OOM。

---

## 10.4 完整调优 Checklist

### 10.4.1 显存管理

| 检查项 | 推荐值 | 验证方法 |
|--------|--------|---------|
| gpu_memory_utilization | 0.95 | `nvidia-smi` 确认显存使用率 |
| max_model_len | ≤ 数据 P99 × 1.2 | 统计 token 长度分布 |
| block_size | 16 (短) / 32 (长) | 基于平均序列长度 |
| kv_cache_dtype | "fp8" (H100) | 确认硬件支持 |
| swap_space | 0 | 不需要 swap |
| cpu_offload_gb | 0 | 用 TP 替代 |

### 10.4.2 调度器

| 检查项 | 推荐值 | 验证方法 |
|--------|--------|---------|
| max_num_seqs | 256-512 | GPU 利用率 >90% |
| max_num_batched_tokens | 8192-16384 | 单步时间 <100ms |
| enable_chunked_prefill | True | 长 prompt 无阻塞 |
| num_scheduler_steps | 4 (无投机) / 1 (有投机) | 不兼容投机解码 |
| preemption_mode | "recompute" | 不用 swap |

### 10.4.3 量化

| 检查项 | 推荐值 | 验证方法 |
|--------|--------|---------|
| quantization | "fp8" (H100) / "awq" (A100) | MMLU 损失 <1% |
| kv_cache_dtype | "fp8" (H100) / "int8" (A100) | 长上下文测试 |
| Draft 模型量化 | 不量化 | 接受率不下降 |

### 10.4.4 并行

| 检查项 | 推荐值 | 验证方法 |
|--------|--------|---------|
| tensor_parallel_size | ≤单机 GPU 数 | NVLink 通信 |
| pipeline_parallel_size | 跨节点时使用 | IB 通信延迟 |
| Placement Group | PACK 策略 | `ray status` 确认同节点 |

### 10.4.5 Kernel

| 检查项 | 推荐值 | 验证方法 |
|--------|--------|---------|
| enforce_eager | False | 日志确认 CUDA Graph 启用 |
| compilation_config.level | 3 | 编译缓存存在 |
| Flash Attention | FA3 (H100) | 环境变量确认 |
| use_v2_block_manager | True | 默认 |

### 10.4.6 数据

| 检查项 | 推荐值 | 验证方法 |
|--------|--------|---------|
| enable_prefix_caching | True | 日志查看 cached_tokens |
| 统一 system prompt | 是 | 命中率 >80% |
| 按长度排序 | 是 | 分桶处理 |
| 预 tokenize | 是 | TokensPrompt |

---

## 10.5 场景化最优配置模板

### 10.5.1 场景 1: H100×8, 70B, 大规模离线批处理

```python
import os
os.environ["VLLM_ATTENTION_BACKEND"] = "FLASH_ATTN_3"

import ray
from vllm import LLM, SamplingParams

ray.init(object_store_memory=50 * 10**9)

llm = LLM(
    model="meta-llama/Llama-3-70B",
    
    # 量化
    quantization="fp8",
    kv_cache_dtype="fp8",
    
    # 并行
    tensor_parallel_size=8,
    distributed_executor_backend="ray",
    
    # 显存
    gpu_memory_utilization=0.95,
    max_model_len=8192,
    block_size=32,
    swap_space=0,
    
    # 调度器
    max_num_seqs=512,
    max_num_batched_tokens=16384,
    enable_chunked_prefill=True,
    num_scheduler_steps=4,  # 无投机解码时用多步
    
    # Kernel
    enforce_eager=False,
    use_cached_outputs=True,
    compilation_config={
        "level": 3,
        "custom_ops": ["+rms_norm", "+rope", "+silu_and_mul", "+flash_attn"],
    },
    
    # 缓存
    enable_prefix_caching=True,
    use_v2_block_manager=True,
    enable_async_output_proc=True,
)

params = SamplingParams(temperature=0.3, top_p=0.9, max_tokens=512)
# 预期吞吐: ~25,000 tokens/s
```

### 10.5.2 场景 2: H100×8, 70B, 极致吞吐 (投机解码)

```python
os.environ["VLLM_ATTENTION_BACKEND"] = "FLASH_ATTN_3"

llm = LLM(
    model="meta-llama/Llama-3-70B",
    quantization="fp8",
    kv_cache_dtype="fp8",
    
    # 投机解码
    speculative_model="[eagle]lmsys/llama-3-eagle-70b",
    use_eagle=True,
    num_speculative_tokens=5,
    speculative_draft_tensor_parallel_size=1,
    
    tensor_parallel_size=8,
    distributed_executor_backend="ray",
    
    gpu_memory_utilization=0.95,
    max_model_len=8192,
    block_size=32,
    
    max_num_seqs=256,  # 投机解码时适当降低
    max_num_batched_tokens=8192,
    enable_chunked_prefill=True,
    num_scheduler_steps=1,  # 投机解码必须为 1
    
    enforce_eager=False,
    use_cached_outputs=True,
    compilation_config={"level": 3, "custom_ops": ["+rms_norm", "+rope", "+silu_and_mul"]},
    
    enable_prefix_caching=True,
)
# 预期吞吐: ~35,000 tokens/s (比场景1 +40%)
```

### 10.5.3 场景 3: A100×4, 70B AWQ, 成本优先

```python
os.environ["VLLM_ATTENTION_BACKEND"] = "FLASH_ATTN"

llm = LLM(
    model="TheBloke/Llama-3-70B-AWQ",
    quantization="awq",
    kv_cache_dtype="int8",  # A100 用 INT8 KV
    
    tensor_parallel_size=4,
    distributed_executor_backend="ray",
    
    gpu_memory_utilization=0.95,
    max_model_len=4096,
    block_size=32,
    
    max_num_seqs=256,
    max_num_batched_tokens=8192,
    enable_chunked_prefill=True,
    num_scheduler_steps=4,
    
    enforce_eager=False,
    compilation_config={"level": 2},
    
    enable_prefix_caching=True,
)
# 预期吞吐: ~8,000 tokens/s
```

### 10.5.4 场景 4: 单卡 H100, 8B, 快速推理

```python
llm = LLM(
    model="meta-llama/Llama-3-8B",
    quantization="fp8",
    kv_cache_dtype="fp8",
    
    gpu_memory_utilization=0.95,
    max_model_len=8192,
    block_size=16,
    
    max_num_seqs=256,
    enable_chunked_prefill=True,
    num_scheduler_steps=4,
    
    enforce_eager=False,
    compilation_config={"level": 3},
    enable_prefix_caching=True,
)
# 预期吞吐: ~9,000 tokens/s
```

### 10.5.5 场景 5: 多模型 Ray 集群

```python
import ray
from ray.util.placement_group import placement_group

ray.init()

# 8 卡服务器: 模型 A (70B, 4卡) + 模型 B (8B, 1卡) + 模型 C (8B, 1卡) + 2卡空闲

pg = placement_group(
    bundles=[
        {"GPU": 1, "CPU": 16},  # 0: 模型 A worker 0
        {"GPU": 1, "CPU": 16},  # 1: 模型 A worker 1
        {"GPU": 1, "CPU": 16},  # 2: 模型 A worker 2
        {"GPU": 1, "CPU": 16},  # 3: 模型 A worker 3
        {"GPU": 1, "CPU": 8},   # 4: 模型 B
        {"GPU": 1, "CPU": 8},   # 5: 模型 C
    ],
    strategy="PACK",
)
ray.get(pg.ready())

@ray.remote(num_gpus=4, num_cpus=64, placement_group=pg,
            placement_group_bundle_indices=[0,1,2,3])
class ModelAActor:
    def __init__(self):
        self.llm = LLM(
            model="meta-llama/Llama-3-70B",
            quantization="fp8",
            tensor_parallel_size=4,
            distributed_executor_backend="ray",
            gpu_memory_utilization=0.95,
            max_model_len=4096,
            max_num_seqs=128,
            enable_prefix_caching=True,
            enable_chunked_prefill=True,
        )

@ray.remote(num_gpus=1, num_cpus=8, placement_group=pg,
            placement_group_bundle_indices=[4])
class ModelBActor:
    def __init__(self):
        self.llm = LLM(
            model="meta-llama/Llama-3-8B",
            quantization="fp8",
            kv_cache_dtype="fp8",
            gpu_memory_utilization=0.95,
            max_model_len=8192,
            max_num_seqs=256,
            enable_prefix_caching=True,
        )

actor_a = ModelAActor.remote()
actor_b = ModelBActor.remote()

# 并发推理
fut_a = actor_a.generate.remote(prompts_a, params_a)
fut_b = actor_b.generate.remote(prompts_b, params_b)
results_a, results_b = ray.get([fut_a, fut_b])
```

### 10.5.6 场景 6: 离线多模态 caption 批量推理（Ray Data + vLLM actor）

前面五个场景都是**纯文本 + 原生 `vllm.LLM`**。当任务升级为**百万级图片 / 视频帧生成 caption**，范式要换成 **Ray Data + vLLM actor**：Ray Data 负责分片调度与 CPU 预处理，每个 worker 起一个 vLLM 引擎副本独占 GPU，靠连续批处理把 GPU 塞满。这一节把"参数在哪、调多少、效果如何"讲清楚。

#### 两种范式的区别

| | 原生 `vllm.LLM`（场景 1–5） | **Ray Data LLM（本节）** |
|---|---|---|
| 调度 | 自己写循环 / Ray actor 手工编排 | Ray Data 自动分片、调度、容错 |
| 数据 | 自己读 | Dataset 读写、`repartition` 切块 |
| 预处理 | 混在推理里 | 独立 Stage，可单独扩 CPU |
| 适用 | 单机 / 少量卡、纯文本 | 百万级以上、多模态、批处理管道 |

#### 架构与数据流转

```text
Ray Dataset（图片 / 视频帧块）
  ↓ repartition —— 切小块，避免超大任务与负载不均
预处理 Stage（解码 / resize —— CPU 密集，常是隐藏瓶颈）
  ↓
vLLMEngineStageUDF（每 worker 一个 vLLM 引擎副本，占 1+ GPU）
  ↓
后处理（解析结构化 caption / 落盘）
```

#### 参数分两层：第一层最容易漏

**第一层 · Ray Data LLM 调度（`vLLMEngineProcessorConfig`）**

| 参数 | 默认 | 作用 | caption 场景建议 |
|---|---|---|---|
| `batch_size` | 32 | 每批发给 vLLM 的行数 | 从 `= max_num_seqs` 起步；太小→调度欠饱和 GPU 空转，太大→过载且整批重试代价高 |
| `concurrency` | 1 | 模型副本 / worker 数（数据并行） | 从 GPU 数起步；**若 CPU 预处理是瓶颈，加副本无效** |
| `max_concurrent_batches` | 8 | 每 worker 队列可排队批数，重叠处理消尾延迟 | `batch_size ≥ 64` 时默认够用 |
| `has_image` | False | 输入是否含图像 | **必须设 True**（多模态最易漏的一条） |
| `accelerator_type` | None | 加速器类型 | 如 `"L4"` / `"A10G"` / `"H100"` |
| `engine_kwargs` | {} | 透传给 vLLM 引擎 | **核心调优点，见第二层** |
| `detokenize` | True | 是否反解 token | 批量落盘可设 False 省 CPU |

**第二层 · vLLM 引擎（`engine_kwargs`）**

| 参数 | 默认 | 离线 caption 建议 | 说明 |
|---|---|---|---|
| `max_num_seqs` | 128 | **256+** | 并发序列数，决定 KV cache 预分配；太小 GPU 吃不饱 |
| `max_num_batched_tokens` | 8192 | **16384+** | 离线最大杠杆之一，直接决定能否把 GPU 塞满 |
| `gpu_memory_utilization` | 0.90 | **0.95**（专用硬件） | 更多显存→更大 KV cache→更高并发→更高吞吐 |
| `enable_prefix_caching` | True | 保持开 | caption 模板共享 system prompt，命中率很高 |
| `enable_chunked_prefill` | True | 保持开 | 与连续批处理配合 |
| `tensor_parallel_size` / `pipeline_parallel_size` | 1 | 大模型按需 | 跨节点需 `distributed_executor_backend="ray"` |
| `quantization` | None | FP8 / INT8（看显卡） | 省显存换吞吐，注意质量回退 |
| 投机解码 | — | **离线高 batch 建议关** | 它是延迟工具不是吞吐工具；用 `-speculative-disable-by-batch-size` |

#### 黄金约束（Anyscale 官方，最易踩）

```text
batch_size × max_concurrent_batches ≥ max_num_seqs
```

Ray Data 会自动检测欠饱和并告警。例：`128 × 4 = 512 ≥ 256` ✅。

任务粒度也要算：推理任务数 ≈ `dataset_size / batch_size`。读少量大文件会产生超大预处理块，进而变成超大推理任务——负载不均、故障要整块重跑，务必用 `repartition(num_blocks=...)` 切小。

#### 多模态专属的三个坑（和纯文本最大的不同）

1. **`has_image=True` 必须显式打开**，否则图像不会被送进引擎。
2. **CPU 解码 / resize 常是真瓶颈**——图像比文本重得多。用 `ds.stats()` 看每个 operator 的吞吐；若预处理慢于推理，加 GPU 副本纯属浪费，要扩 CPU 并行或优化解码链路。
3. **预 resize 到一致尺寸**：降内存、提吞吐、减少 padding 浪费。此外 vLLM 2026 多模态已有 `encoder-output caching`（同一张图多次问不重算视觉编码）与 vision encoder 的 batch-level data parallelism，对"一图多问"型 caption（同时问描述 / OCR / 属性）收益尤其明显。

#### 重排序：离线白捡的收益

离线能先看到全量数据，这是在线服务没有的特权：按**共享前缀**排序提高 prefix cache 命中，按**长度分桶**减少 padding 与调度抖动。围绕这个思路的研究系统（BlendServe、BatchLLM）比原生 vLLM / SGLang 快 **1.1–1.44×**。

#### 效果参考

| 项 | 量级 | 来源 |
|---|---|---|
| Ray Data 视觉批推理吞吐 | ~2,500 rows/s（单节点估计 ~5,000 rows/s；Qwen2.5-VL，1 万张验证后扩展到 100 万） | Ray 官方示例 |
| vLLM V1 vs V0 | 官方称最高 **1.7×** 吞吐提升，**VLM 增益更大** | vLLM V1 博客 |
| 引擎横评 | TensorRT-LLM 稳定 NVIDIA 部署峰值吞吐高 10–20%（代价数十分钟编译）；SGLang 共享前缀场景更优；**vLLM 通用默认** | Parasail 2026 指南 |

组合起来看：把 GPU 塞满（`max_num_batched_tokens` + `gpu_memory_utilization`）+ 别让 CPU 预处理拖后腿 + 满足黄金约束，这三条做对，相比默认配置通常到 **2–3×**；再往上靠加卡线性扩。

#### 完整配置模板

```python
import ray
from ray.data.llm import vLLMEngineProcessorConfig, build_llm_processor

config = vLLMEngineProcessorConfig(
    model_source="Qwen/Qwen2.5-VL-7B-Instruct",
    accelerator_type="L4",
    has_image=True,               # 多模态必须
    concurrency=4,                # 4 个 vLLM 副本 → 需 4 张 GPU
    batch_size=128,
    max_concurrent_batches=4,
    engine_kwargs=dict(
        max_num_seqs=256,             # 128 × 4 = 512 ≥ 256 ✅ 黄金约束
        max_num_batched_tokens=16384, # 离线最大杠杆
        gpu_memory_utilization=0.95,
        enable_prefix_caching=True,
        enable_chunked_prefill=True,
        # 离线高 batch：不要开投机解码
        # --speculative-disable-by-batch-size
    ),
)

processor = build_llm_processor(
    config,
    preprocess=lambda row: dict(
        messages=[{"role": "user", "content": [
            {"type": "image", "image": row["image_path"]},
            {"type": "text", "text": "用中文写一段详尽的图像描述，包含主体、场景、文字内容与显著属性。"},
        ]}],
        sampling_params=dict(temperature=0.2, max_tokens=512),
    ),
    postprocess=lambda row: dict(caption=row["generated_text"]),
)

ds = ray.data.read_parquet("s3://.../images/").repartition(num_blocks=256)
ds = processor(ds).materialize()
print(ds.stats())   # 逐 operator 看吞吐，定位瓶颈
```

#### caption 场景调优顺序（SOP）

1. **`stats()` 先定位**：CPU 预处理慢还是 GPU 推理慢？不要凭感觉加卡。
2. **GPU 空转** → 调大 `max_num_seqs` / `batch_size`，并校验 `batch_size × max_concurrent_batches ≥ max_num_seqs`。
3. **预处理慢** → `repartition` 切块 + 扩 CPU 并行 + 预 resize。
4. **OOM** → 降 `max_num_seqs`、把 `max_model_len` 收到实际需要、或上量化。
5. **高 batch 关掉投机解码**：`--speculative-disable-by-batch-size`。
6. **模板固定** → 务必开 prefix caching，并按前缀排序喂数据。

---

## 10.6 调优方法论

### 10.6.1 调优顺序

```
Step 1: 基础配置 (能跑)
  ├── 正确的 TP 大小
  ├── 合理的 max_model_len
  └── enable_chunked_prefill=True

Step 2: 显存优化 (能跑更多)
  ├── gpu_memory_utilization=0.95
  ├── kv_cache_dtype="fp8" or "int8"
  └── 确认并发数提升

Step 3: 量化加速 (跑得更快)
  ├── quantization="fp8" or "awq"
  └── 验证精度可接受

Step 4: Kernel 优化 (榨干硬件)
  ├── enforce_eager=False
  ├── torch.compile level=3
  └── Flash Attention 3 (H100)

Step 5: 调度优化 (满载运行)
  ├── max_num_seqs 调到最大
  ├── num_scheduler_steps=4
  └── 验证 GPU 利用率 >90%

Step 6: 数据优化 (离线独有)
  ├── enable_prefix_caching=True
  ├── 统一 system prompt
  ├── 按长度排序分桶
  └── 预 tokenize

Step 7: 投机解码 (终极加速)
  ├── 选择 Draft 模型
  ├── EAGLE > Vanilla
  └── 验证接受率 >70%
```

### 10.6.2 性能监控

```python
# 监控 GPU 利用率
# nvidia-smi dmon -s u -c 60  # 每秒采样，持续 60 秒
# GPU 利用率应 >90%，如果 <80% 说明瓶颈在 CPU 或数据

# vLLM 内部统计
llm = LLM(model="...", disable_log_stats=False)
# 日志会输出:
# "GPU KV cache usage: 45.2%, CPU swap: 0, prefix cache hit: 82.3%"

# Ray 监控
# ray status  # 查看集群资源使用
# ray metrics  # Prometheus 指标
```

### 10.6.3 常见性能瓶颈诊断

| 症状 | 可能原因 | 解决方案 |
|------|---------|---------|
| GPU 利用率 <70% | CPU 瓶颈 | 增加 num_cpus, 预 tokenize |
| GPU 利用率 <70% | 数据喂入慢 | 用 Ray Data pipeline |
| 吞吐不随 max_num_seqs 增长 | KV Cache 不足 | 降 max_model_len 或开 KV 量化 |
| 首 token 延迟高 | 长 prompt 阻塞 | 开 chunked prefill |
| 间歇性卡顿 | 抢占/swap | 关 swap, 调 max_num_seqs |
| 编译后更慢 | 编译与模型不兼容 | 降 compilation level |

---

## 10.7 全书总结

### 参数优化收益总览

| 优化类别 | 典型收益 | 实现难度 |
|---------|---------|---------|
| 显存管理 | 2-5x (并发提升) | 低 |
| 调度器调优 | 1.5-2x (利用率提升) | 低 |
| 量化 (FP8/INT4) | 1.5-2x (速度+显存) | 低 |
| KV Cache 量化 | 2x (并发翻倍) | 极低 |
| 投机解码 | 1.5-2x (减少前向) | 中 |
| 并行策略 | 取决于模型 | 低 |
| Prefix Caching | 2-5x (prefill 加速) | 中 |
| Kernel 编译 | 1.3-1.5x | 低 |
| 数据预处理 | 1.2-1.5x | 中 |
| **全栈叠加** | **8-15x** | — |

### 核心原则

1. **显存是王道**：所有优化的终极目标是把省下来的显存变成 KV Cache，变成更多并发序列
2. **量化是免费的午餐**：FP8 几乎无损，KV 量化几乎无损，没有理由不用
3. **离线的独特优势是数据可控**：Prefix Caching + 数据排序是离线独有的杀手锏
4. **CUDA Graph 是基础**：不开 CUDA Graph，其他 Kernel 优化都打折
5. **投机解码是终极武器**：EAGLE 可以再叠加 50-70% 吞吐，但需要合适的 Draft 模型
6. **Ray 的角色是资源编排**：Placement Group 确保 TP worker 物理邻近，Object Store 优化数据流转

---

## 10.8 最终推荐配置速查

### H100 场景 (终极配置)

```python
LLM(
    model="...",
    quantization="fp8",          # FP8 权重
    kv_cache_dtype="fp8",        # FP8 KV Cache
    tensor_parallel_size=8,      # 8 卡 TP
    gpu_memory_utilization=0.95, # 拉满
    max_model_len=8192,          # 按需设置
    block_size=32,               # 长序列
    max_num_seqs=256,            # 高并发
    enable_chunked_prefill=True, # 必开
    enable_prefix_caching=True,  # 必开
    enforce_eager=False,         # CUDA Graph
    compilation_config={"level": 3},
    # 投机解码 (可选)
    # speculative_model="[eagle]...",
    # num_speculative_tokens=5,
    # num_scheduler_steps=1,  # 投机时必须 1
    # 或不用投机时
    num_scheduler_steps=4,
)
```

### A100 场景 (最优配置)

```python
LLM(
    model="...-AWQ",             # AWQ INT4 权重
    quantization="awq",
    kv_cache_dtype="int8",       # INT8 KV Cache
    tensor_parallel_size=4,      # 4 卡 TP
    gpu_memory_utilization=0.95,
    max_model_len=4096,
    block_size=32,
    max_num_seqs=256,
    enable_chunked_prefill=True,
    enable_prefix_caching=True,
    enforce_eager=False,
    compilation_config={"level": 2},
    num_scheduler_steps=4,
)
```

这两套配置覆盖了绝大多数离线推理场景。根据实际模型大小和硬件做微调即可。
