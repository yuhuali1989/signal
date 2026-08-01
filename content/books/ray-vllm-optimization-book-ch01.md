---
title: "Ray+vLLM 参数优化深度全书 - 第1章: vLLM 参数全景地图"
book: "Ray+vLLM 离线推理参数优化深度全书"
chapter: "1"
chapterTitle: "vLLM 参数全景地图：从初始化到推理的完整参数体系"
description: "系统梳理 vLLM LLM 类初始化参数和 SamplingParams 的完整参数体系，建立全局视角，为后续逐类深度调优奠定基础"
date: "2026-08-01"
updatedAt: "2026-08-01"
agent: "研究员→编辑→审校员"
tags:
  - "vLLM"
  - "Ray"
  - "参数调优"
  - "离线推理"
  - "性能优化"
type: "book"
---

# 第 1 章：vLLM 参数全景地图

> **学习目标**：建立 vLLM 参数体系的完整全局视角，理解每个参数所属的类别和作用域，掌握参数之间的依赖关系和冲突约束，为后续逐章深度调优做好准备。

---

## 1.1 为什么需要一本专门讲参数的书

vLLM 是当前最流行的开源 LLM 推理框架，但它的参数数量庞大——仅 `LLM()` 初始化就有 80+ 个参数，`SamplingParams` 另有 20+ 个。大多数用户只用到了其中 5-6 个核心参数，剩下的大量参数要么被忽略，要么使用了不恰当的默认值。

在离线推理场景下，参数调优的收益极其显著。同样的硬件、同样的模型，仅靠参数优化就能实现 **3-10 倍** 的吞吐差异。这不是夸张——一个 `gpu_memory_utilization=0.5` + `enforce_eager=True` + `max_num_seqs=8` 的配置，和一个 `gpu_memory_utilization=0.95` + `enforce_eager=False` + `max_num_seqs=256` + `enable_chunked_prefill=True` + FP8 量化的配置，吞吐可以差一个数量级。

本章的目标不是逐个解释参数（那是后续章节的工作），而是给你一张**地图**——让你知道有哪些参数、它们属于哪个类别、彼此如何影响。

---

## 1.2 参数体系总览

vLLM 的参数可以分为 **七大类别**：

```
┌─────────────────────────────────────────────────────────────┐
│                   vLLM 参数体系全景                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─── 1. 显存管理 ──────────────────────────────────────┐   │
│  │ gpu_memory_utilization    max_model_len              │   │
│  │ block_size                swap_space                 │   │
│  │ cpu_offload_gb            KV Cache dtype             │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─── 2. 调度器 ────────────────────────────────────────┐   │
│  │ max_num_seqs              max_num_batched_tokens     │   │
│  │ enable_chunked_prefill    num_scheduler_steps        │   │
│  │ preemption_mode           long_prefill_token_threshold│  │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─── 3. 量化 ──────────────────────────────────────────┐   │
│  │ quantization              fp8 / awq / gptq           │   │
│  │ kv_cache_dtype            quantization_param_path    │   │
│  │ sparsity_profile          marlin                     │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─── 4. 并行策略 ──────────────────────────────────────┐   │
│  │ tensor_parallel_size      pipeline_parallel_size     │   │
│  │ expert_parallel_size      distributed_executor_backend│  │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─── 5. 投机解码 ──────────────────────────────────────┐   │
│  │ speculative_model         num_speculative_tokens     │   │
│  │ speculative_draft_tp_size  use_eagle                 │   │
│  │ speculative_accept_method  spec_decoding_use_step    │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─── 6. 缓存与编译 ────────────────────────────────────┐   │
│  │ enable_prefix_caching    enforce_eager               │   │
│  │ use_cached_outputs       compilation_config          │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─── 7. 采样参数 (SamplingParams) ─────────────────────┐   │
│  │ temperature              top_p / top_k               │   │
│  │ max_tokens               n                           │   │
│  │ guided_decoding          best_of / beam_search       │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 1.3 参数分类详解

### 1.3.1 显存管理参数

这组参数决定了 vLLM 如何分配和使用 GPU 显存。它们之间有严格的依赖关系。

| 参数 | 类型 | 默认值 | 作用域 | 依赖关系 |
|------|------|--------|--------|---------|
| `gpu_memory_utilization` | float | 0.9 | 全局 | 决定 KV Cache 可用显存上限 |
| `max_model_len` | int | 模型配置值 | 全局 | 影响单个序列的 KV Cache 大小 |
| `block_size` | int | 16 | KV Cache | 必须是 2 的幂，16/32/64 |
| `swap_space` | int (GB) | 4 | 全局 | CPU offload 空间 |
| `cpu_offload_gb` | int | 0 | 全局 | 权重 offload 到 CPU |
| `kv_cache_dtype` | str | "auto" | KV Cache | "auto"/"fp8"/"int8" |

**核心公式**：

```
可用显存 = total_gpu_memory × gpu_memory_utilization - model_weights - activations - KV Cache_overhead

KV Cache 可容纳的 token 数 = (可用显存) / (2 × num_layers × num_kv_heads × head_dim × dtype_size × block_size) × block_size

最大并发序列数 = min(max_num_seqs, KV Cache 可容纳 token 数 / max_model_len)
```

### 1.3.2 调度器参数

调度器决定了如何将请求组织成 batch 提交给 GPU 执行。

| 参数 | 类型 | 默认值 | 作用 |
|------|------|--------|------|
| `max_num_seqs` | int | 256 | 最大并发序列数 |
| `max_num_batched_tokens` | int | max_model_len | 单步最多处理的 token 数 |
| `enable_chunked_prefill` | bool | False | 长 prompt 分块处理 |
| `num_scheduler_steps` | int | 1 | 多步调度步数 |
| `preemption_mode` | str | "swap" | 显存不足时的抢占策略 |
| `long_prefill_token_threshold` | int | 0 | 长 prefill 分块阈值 |

**调度器参数是离线吞吐优化的主战场**。在线服务受延迟约束，`max_num_seqs` 通常只有 32-64；离线场景可以拉到 256 甚至 512，吞吐差距巨大。

### 1.3.3 量化参数

| 参数 | 可选值 | 作用 |
|------|--------|------|
| `quantization` | None / "fp8" / "awq" / "gptq" / "bitsandbytes" / "compressed-tensors" / "experts_int8" | 权重量化方法 |
| `kv_cache_dtype` | "auto" / "fp8" / "int8" | KV Cache 量化 |
| `quantization_param_path` | str | 自定义量化参数路径 |
| `sparsity_profile` | None / "dense" / "semi_structured" | 稀疏化 |

量化参数的核心问题不是"怎么配"（通常模型本身就是量化版），而是**"值不值得用"**——这取决于硬件架构、模型大小和精度要求。第 4 章会用实测数据回答这个问题。

### 1.3.4 并行策略参数

| 参数 | 默认值 | 适用场景 |
|------|--------|---------|
| `tensor_parallel_size` | 1 | 单机多卡 |
| `pipeline_parallel_size` | 1 | 跨节点 |
| `expert_parallel_size` | 1 | MoE 模型 |
| `distributed_executor_backend` | "ray" | 分布式后端 |

在 Ray+vLLM 组合中，`distributed_executor_backend="ray"` 是关键——它让 vLLM 的张量并行进程跑在 Ray 管理的 worker 上。第 7 章详细讲解 Ray Placement Group 如何与此参数协同。

### 1.3.5 投机解码参数

| 参数 | 默认值 | 作用 |
|------|--------|------|
| `speculative_model` | None | Draft 模型路径 |
| `num_speculative_tokens` | 0 | 每次猜测的 token 数 |
| `speculative_draft_tensor_parallel_size` | 1 | Draft 模型 TP 大小 |
| `speculative_accept_method` | "rejection_sampling" | 接受策略 |
| `use_eagle` | False | 是否使用 EAGLE 方法 |

### 1.3.6 缓存与编译参数

| 参数 | 默认值 | 作用 |
|------|--------|------|
| `enable_prefix_caching` | True (v0.5+) | 前缀 KV Cache 复用 |
| `enforce_eager` | True | 是否禁用 CUDA Graph |
| `use_cached_outputs` | False | 缓存 torch.compile 结果 |
| `compilation_config` | None | torch.compile 详细配置 |

### 1.3.7 采样参数 (SamplingParams)

| 参数 | 默认值 | 作用 |
|------|--------|------|
| `temperature` | 1.0 | 温度 |
| `top_p` | 1.0 | 核采样 |
| `top_k` | -1 | Top-K 采样 |
| `max_tokens` | 16 | 最大生成 token 数 |
| `n` | 1 | 每个 prompt 生成几个 |
| `guided_decoding` | None | 结构化输出约束 |
| `best_of` | None | best-of-n 采样 |
| `use_beam_search` | False | 束搜索 |

---

## 1.4 参数之间的依赖与冲突关系

理解参数不能孤立看。下面是最重要的依赖和冲突关系图：

```
gpu_memory_utilization ──┬──→ 决定 KV Cache 容量
                         │
max_model_len ───────────┘    ↓
                         最大并发 = KV容量 / max_model_len
                              ↓
                    min(最大并发, max_num_seqs) → 实际并发
                              ↓
max_num_batched_tokens ──→ 每步处理量 → GPU 利用率
                              ↓
enable_chunked_prefill ──→ 长 prompt 是否阻塞
                              ↓
num_scheduler_steps ─────→ CPU-GPU 同步频率
                              ↓
enforce_eager ───────────→ CUDA Graph 开/关
                              ↓
quantization ────────────→ 显存占用 → 反馈到 KV Cache 容量
                              ↓
kv_cache_dtype ──────────→ KV Cache 单 token 大小 → 反馈到并发数
                              ↓
tensor_parallel_size ────→ 跨卡通信开销 → 影响单步延迟
```

**关键冲突**：

1. `enforce_eager=True` + `enable_chunked_prefill=True`：CUDA Graph 被禁用时，chunked prefill 的每步 kernel launch 开销更大，收益打折
2. `num_scheduler_steps > 1` + 投机解码：多步调度会让投机解码的接受验证延迟，通常不兼容
3. `kv_cache_dtype="fp8"` + 某些量化模型：权重 FP8 + KV FP8 在非 H100 硬件上可能精度严重下降
4. `max_model_len` 过大 + `max_num_seqs` 过大：KV Cache 可能不够分配，vLLM 会自动降低并发数

---

## 1.5 Ray 层面的参数

在 Ray+vLLM 组合中，Ray 本身也有参数需要调优：

```python
import ray
from vllm import LLM

# Ray 初始化参数
ray.init(
    num_cpus=64,                    # 可用 CPU 核数
    object_store_memory=50_000_000_000,  # 50GB 对象存储
    _system_config={
        "automatic_object_spilling_enabled": True,
        "max_io_workers": 4,
    }
)

# Actor 资源配置
@ray.remote(
    num_gpus=1,                     # 每个 Actor 1 张 GPU
    num_cpus=8,                     # 配套 CPU 资源
    resources={"custom_memory": 64} # 自定义资源标签
)
class vLLMActor:
    ...
```

Ray 层面的参数优化会在第 8 章和第 10 章详细讲解。

---

## 1.6 本章小结

本章建立了 vLLM 参数的完整全景地图：

- **7 大类别**：显存管理、调度器、量化、并行策略、投机解码、缓存与编译、采样参数
- **参数之间有严格的依赖关系**：显存参数决定并发上限，调度器参数决定 GPU 利用率，量化参数反向影响显存可用量
- **离线场景的核心调优方向**：拉满 `gpu_memory_utilization`、拉大 `max_num_seqs`、开启 `chunked_prefill`、启用 CUDA Graph、合理选择量化方案

后续章节将逐一深入每个类别，给出具体的调优策略、代码示例和性能数据。
