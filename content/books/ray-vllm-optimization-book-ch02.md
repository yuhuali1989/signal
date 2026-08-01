---
title: "Ray+vLLM 参数优化深度全书 - 第2章: 显存管理参数深度调优"
book: "Ray+vLLM 离线推理参数优化深度全书"
chapter: "2"
chapterTitle: "显存管理参数深度调优：让每一 MB GPU 显存都发挥价值"
description: "深入剖析 gpu_memory_utilization、max_model_len、block_size、swap_space、kv_cache_dtype 等显存参数的底层原理、调优策略和陷阱"
date: "2026-08-01"
updatedAt: "2026-08-01"
agent: "研究员→编辑→审校员"
tags:
  - "vLLM"
  - "显存管理"
  - "KV Cache"
  - "block_size"
  - "调优"
type: "book"
---

# 第 2 章：显存管理参数深度调优

> **学习目标**：理解 GPU 显存在 vLLM 中的完整分配链路，掌握每个显存参数的底层原理和调优策略，能根据模型大小和硬件配置推导最优显存参数组合。

---

## 2.1 显存分配全景：vLLM 把 GPU 显存分成了几份

理解显存管理的第一步，是知道 GPU 显存被分成了哪些部分。vLLM 在启动时会做一次显存 profiling，将总显存切分为四大块：

```
┌──────────────────────────────────────────────────────────┐
│                GPU 显存分配全景 (80GB A100)               │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─── 1. 模型权重 ───────────────────────────────┐       │
│  │  70B FP16: ~140GB (需 TP=2)                     │       │
│  │  70B INT4: ~35GB                                │       │
│  │  8B FP16: ~16GB                                 │       │
│  │  8B FP8:  ~8GB                                  │       │
│  └────────────────────────────────────────────────┘       │
│                                                          │
│  ┌─── 2. 激活值 (Activations) ───────────────────┐       │
│  │  与 batch size 和 seq_len 成正比                 │       │
│  │  典型值: 2-8GB                                  │       │
│  └────────────────────────────────────────────────┘       │
│                                                          │
│  ┌─── 3. KV Cache ───────────────────────────────┐       │
│  │  = 剩余显存 (这是 vLLM 的核心设计)               │       │
│  │  70B: ~100GB (TP=2 时每卡 50GB)                 │       │
│  │  8B: ~55GB                                      │       │
│  └────────────────────────────────────────────────┘       │
│                                                          │
│  ┌─── 4. 临时缓冲区 + CUDA Context ──────────────┐       │
│  │  CUDA Context: ~500MB                           │       │
│  │  临时缓冲: ~1-2GB                               │       │
│  └────────────────────────────────────────────────┘       │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

vLLM 的显存分配逻辑（伪代码）：

```python
def profile_and_allocate():
    total_mem = torch.cuda.mem_get_info()[0]  # GPU 总显存
    usable_mem = total_mem * gpu_memory_utilization  # 用户指定的可用比例
    
    # 1. 加载模型权重（固定）
    weight_mem = load_model_weights()
    
    # 2. 估算激活值（通过一次 dummy forward）
    activation_mem = profile_activations()
    
    # 3. 预留 CUDA Context 和临时缓冲
    overhead_mem = cuda_context_mem + buffer_reserve
    
    # 4. 剩余全部给 KV Cache
    kv_cache_mem = usable_mem - weight_mem - activation_mem - overhead_mem
    
    # 5. 计算 Block 数
    block_size = 16  # tokens per block
    bytes_per_token = 2 * num_layers * num_kv_heads * head_dim * dtype_size
    num_blocks = kv_cache_mem // (block_size * bytes_per_token)
    
    return num_blocks
```

**关键洞察**：`gpu_memory_utilization` 不是控制"vLLM 用多少显存"，而是控制"vLLM 认为有多少显存可用"。vLLM 会把减去权重和激活后的所有剩余显存全部分配给 KV Cache。

---

## 2.2 gpu_memory_utilization：最危险的参数

### 2.2.1 参数定义

```python
LLM(
    model="...",
    gpu_memory_utilization=0.95,  # 默认 0.9
)
```

这个参数告诉 vLLM："你可以使用 GPU 总显存的 95%"。

### 2.2.2 调优策略

| 场景 | 推荐值 | 原因 |
|------|--------|------|
| 离线推理（专用 GPU） | **0.95** | 无并发请求波动，可以激进 |
| 离线推理（共享 GPU） | 0.85-0.9 | 留余量给其他进程 |
| 在线服务 | 0.85-0.9 | 需要应对流量波动 |
| 调试阶段 | 0.7-0.8 | 留余量防止 OOM 崩溃 |

### 2.2.3 为什么不直接设 1.0

设为 1.0 会导致 OOM。因为 vLLM 的激活值估算不一定准确，CUDA Context 的开销也不是精确可控的。实践中 0.95 是安全上限。

**从 0.9 到 0.95 的收益**：以 A100 80GB 为例，额外 4GB 显存（80×0.05），对于 8B 模型可以多容纳约 **3200 个 token 的 KV Cache**（8B 模型每 token KV Cache 约 1.25MB），相当于多 3-4 个并发序列。

### 2.2.4 与 Ray 的交互

在 Ray Actor 中，`gpu_memory_utilization` 是**每个 Actor 独立计算的**。如果一个 GPU 上只跑一个 Actor（通常情况），则和独立使用 vLLM 一样。但如果尝试在一张 GPU 上跑两个 Actor（不推荐），每个 Actor 会各自认为有 95% 的显存可用，必然 OOM。

```python
# ❌ 错误：两个 Actor 各自占用 95% 显存，必然 OOM
actor1 = vLLMActor.remote(num_gpus=0.5, gpu_mem_util=0.95)
actor2 = vLLMActor.remote(num_gpus=0.5, gpu_mem_util=0.95)

# ✅ 正确：如果必须共享 GPU（极不推荐），各占 45%
actor1 = vLLMActor.remote(num_gpus=0.5, gpu_mem_util=0.45)
actor2 = vLLMActor.remote(num_gpus=0.5, gpu_mem_util=0.45)
```

---

## 2.3 max_model_len：被忽视的显存杀手

### 2.3.1 参数定义

```python
LLM(
    model="...",
    max_model_len=4096,  # 默认使用模型 config 中的值
)
```

这个参数**不影响模型能力**（模型仍然可以处理任意长度输入），但影响 vLLM 预留的 KV Cache 管理上限。

### 2.3.2 为什么它对显存影响巨大

vLLM 在分配 KV Cache 时，需要知道每个序列最多会用多少 token。如果不设置 `max_model_len`，vLLM 使用模型配置的 `max_position_embeddings`，对于 Llama-3 是 128K。

**KV Cache 单 token 大小公式**：

```
bytes_per_token = 2 × num_layers × num_kv_heads × head_dim × dtype_size
```

以 Llama-3-70B 为例：
- num_layers = 80
- num_kv_heads = 8 (GQA)
- head_dim = 128
- dtype = FP16 (2 bytes)

```
bytes_per_token = 2 × 80 × 8 × 128 × 2 = 327,680 bytes ≈ 320 KB
```

| max_model_len | 单序列 KV Cache | A100 80GB 可容纳序列数 |
|--------------|----------------|----------------------|
| 128K (默认) | 40 GB | ~1 个（实际无法运行） |
| 32K | 10 GB | ~5 个 |
| 8K | 2.5 GB | ~20 个 |
| 4K | 1.25 GB | ~40 个 |
| 2K | 640 MB | ~80 个 |

**从 128K 降到 4K，并发提升 40 倍**。这是显存调优中收益最大的单一参数。

### 2.3.3 调优建议

```python
# 离线推理：根据实际数据分布设置
import numpy as np

# 统计数据集中 prompt + output 的 token 长度分布
lengths = [len(tokenizer.encode(p)) + expected_output_len for p in dataset]
p99 = np.percentile(lengths, 99)

LLM(
    model="...",
    max_model_len=min(p99 * 1.2, 8192),  # 取 p99 的 1.2 倍，但不超过 8K
)
```

### 2.3.4 注意事项

- `max_model_len` 必须 ≥ 模型实际支持的最小长度（有些模型有最小长度限制）
- 如果有极少数超长样本，可以截断而不是拉大 `max_model_len`
- `max_model_len` 过小不会报错，但超长输入会被静默截断

---

## 2.4 block_size：PagedAttention 的页面大小

### 2.4.1 参数定义

```python
LLM(
    model="...",
    block_size=16,  # 默认 16，可选 16/32/64
)
```

PagedAttention 把 KV Cache 分成固定大小的 Block（类似 OS 的内存页）。`block_size` 决定每个 Block 包含多少个 token。

### 2.4.2 Block Size 的权衡

| block_size | 优点 | 缺点 | 适用场景 |
|-----------|------|------|---------|
| 16 (默认) | 粒度细，碎片少 | Block Table 大，查找开销 | 短序列、高并发 |
| 32 | 平衡 | 适中 | 通用推荐 |
| 64 | Block Table 小，查找快 | 碎片增大，浪费 3-7% | 长序列 |

### 2.4.3 内部碎片分析

每个序列最后一个 Block 通常不会被填满，这部分浪费称为内部碎片。

```
内部碎片率 ≈ (block_size - 1) / (2 × avg_seq_len) × 100%
```

| 平均序列长度 | block_size=16 | block_size=32 | block_size=64 |
|------------|--------------|--------------|--------------|
| 100 tokens | 7.5% | 15.5% | 31.5% |
| 500 tokens | 1.5% | 3.1% | 6.3% |
| 2000 tokens | 0.4% | 0.8% | 1.6% |

**结论**：短序列场景用 16，长序列场景用 32 是最佳选择。64 在大多数情况下不推荐。

### 2.4.4 Block Table 开销

每个序列有一个 Block Table，记录逻辑 Block → 物理 Block 的映射。Block Table 的大小为 `max_model_len / block_size × 4 bytes`（每个条目 4 字节）。

| max_model_len | block_size=16 | block_size=32 |
|--------------|--------------|--------------|
| 4K | 1 KB | 512 B |
| 32K | 8 KB | 4 KB |
| 128K | 32 KB | 16 KB |

对于 256 个并发序列，128K 上下文，block_size=16 的 Block Table 总共 8MB——相对于 80GB 显存可以忽略。所以 Block Table 开销不是选 32 的理由。

**真正的原因**是 CUDA kernel 的访问模式。block_size=32 时，Attention kernel 的一次 Block 读取覆盖 32 个 token，减少了 kernel launch 次数，对长序列有 5-10% 的加速。

---

## 2.5 swap_space：CPU 兜底

### 2.5.1 参数定义

```python
LLM(
    model="...",
    swap_space=8,  # GB，默认 4
)
```

当 KV Cache 显存不足时，vLLM 会把部分序列的 KV Cache 换出到 CPU 内存（类似 OS 的 swap）。`swap_space` 指定可用于换出的 CPU 内存大小。

### 2.5.2 何时有用

| 场景 | 是否需要 swap | 推荐值 |
|------|-------------|--------|
| 显存充足 | 不需要 | 0-4 |
| 显存紧张但 CPU 内存大 | 需要 | 8-16 |
| 极端长序列（32K+） | 有帮助 | 16-32 |
| 多模型交替推理 | 不需要 | 0 |

### 2.5.3 陷阱：swap 不是免费的

CPU↔GPU 的数据传输带宽约 30-60 GB/s（PCIe 4.0），而 GPU 内部 HBM 带宽约 2 TB/s。swap 一次的延迟约 50-200ms，对于离线推理来说可接受，但会显著降低吞吐。

**最佳实践**：优先通过降低 `max_model_len` 或启用 `kv_cache_dtype="fp8"` 来节省显存，swap 作为最后兜底。

```python
# 推荐配置：先优化其他参数，swap 设为 0
LLM(
    model="...",
    max_model_len=4096,           # 降低而非 swap
    kv_cache_dtype="fp8",         # 量化而非 swap
    swap_space=0,                 # 不需要 swap
)
```

---

## 2.6 cpu_offload_gb：权重 offload

### 2.6.1 参数定义

```python
LLM(
    model="...",
    cpu_offload_gb=40,  # 将 40GB 权重 offload 到 CPU
)
```

vLLM 支持将部分模型权重放在 CPU 内存中，推理时通过 PCIe 拉到 GPU。这适用于 GPU 显存装不下完整模型的场景。

### 2.6.2 性能代价

权重 offload 的代价极其巨大：

| 配置 | 单步延迟 | 吞吐影响 |
|------|---------|---------|
| 全权重在 GPU | 20ms | baseline |
| 50% offload | 80ms | -75% |
| 100% offload (CPU 推理) | 2000ms | -99% |

**原因**：每生成一个 token，都需要把全部权重读一遍。如果权重在 CPU，PCIe 带宽（~50 GB/s）成为瓶颈，而 GPU 内部 HBM 带宽是 2 TB/s。

### 2.6.3 何时使用

唯一合理的场景：**GPU 显存无法装下模型，又没有多卡做 TP**。例如只有 1 张 24GB 的 RTX 4090，想跑 70B 模型。

```python
# 70B INT4 需要约 35GB，4090 只有 24GB
LLM(
    model="...-INT4",
    cpu_offload_gb=20,     # offload 20GB 到 CPU
    gpu_memory_utilization=0.95,
    max_model_len=2048,    # 极度压缩
)
# 吞吐极低，但能跑
```

对于 Ray+vLLM 离线推理，**不建议使用 cpu_offload**。如果显存不够，应该用 TP 跨多卡。

---

## 2.7 kv_cache_dtype：被低估的优化点

### 2.7.1 参数定义

```python
LLM(
    model="...",
    kv_cache_dtype="fp8",  # 默认 "auto" (与模型 dtype 一致)
)
```

### 2.7.2 KV Cache 量化收益

KV Cache 量化是一个**独立于权重量化**的优化。即使权重是 FP16，KV Cache 也可以量化为 FP8 或 INT8，直接把 KV Cache 显存占用减半。

| 配置 | 8B 模型 KV Cache/token | 70B 模型 KV Cache/token | 并发提升 |
|------|----------------------|----------------------|---------|
| FP16 (auto) | 160 KB | 320 KB | baseline |
| FP8 | 80 KB | 160 KB | **2x** |
| INT8 | 80 KB | 160 KB | **2x** |

### 2.7.3 FP8 vs INT8 选择

| 格式 | 硬件要求 | 精度 | 推荐 |
|------|---------|------|------|
| FP8 (E4M3) | H100/Ada | 极好（几乎无损） | **H100 首选** |
| FP8 (E5M2) | H100/Ada | 好（动态范围大） | 不推荐用于 KV |
| INT8 | 所有 GPU | 一般（需校准） | 非 H100 备选 |

**FP8 几乎无损的原因**：FP8 E4M3 有 3 位尾数，能表示的值范围足够覆盖 KV Cache 的分布。而 INT8 的均匀量化对离群值更敏感。

### 2.7.4 组合效果

```python
# 权重 FP16 + KV FP8：省 50% KV Cache 显存
LLM(model="...", kv_cache_dtype="fp8")

# 权重 FP8 + KV FP8：省 50% 权重 + 50% KV Cache
LLM(model="...", quantization="fp8", kv_cache_dtype="fp8")
```

**KV Cache 量化是最"划算"的优化之一**——几乎无精度损失，直接翻倍并发数。但很多用户不知道这个参数的存在。

---

## 2.8 实战：不同模型的显存参数推荐

### 8B 模型 (Llama-3-8B) on 1×A100 80GB

```python
LLM(
    model="meta-llama/Llama-3-8B",
    gpu_memory_utilization=0.95,
    max_model_len=8192,          # 8B 模型 KV Cache 小，可以给更多
    block_size=16,               # 通用场景用 16
    kv_cache_dtype="fp8",        # A100 不支持 FP8，用 "auto"
    swap_space=0,
    cpu_offload_gb=0,
)
# 权重 16GB + KV Cache ~57GB = 可容纳约 380K tokens 的 KV Cache
# max_model_len=8K 时可支持约 47 个并发序列
```

### 8B 模型 on 1×H100 80GB

```python
LLM(
    model="meta-llama/Llama-3-8B",
    gpu_memory_utilization=0.95,
    max_model_len=8192,
    block_size=16,
    kv_cache_dtype="fp8",        # H100 支持 FP8，KV Cache 翻倍
    quantization="fp8",          # 权重也 FP8，再省 50%
    swap_space=0,
)
# 权重 8GB + KV Cache ~67GB = 可容纳约 890K tokens 的 KV Cache
# max_model_len=8K 时可支持约 111 个并发序列（是 A100 的 2.4 倍）
```

### 70B 模型 on 4×A100 80GB (TP=4)

```python
LLM(
    model="meta-llama/Llama-3-70B",
    tensor_parallel_size=4,
    gpu_memory_utilization=0.95,
    max_model_len=4096,          # 70B KV Cache 大，适当压缩
    block_size=32,               # 长序列用 32
    kv_cache_dtype="auto",       # A100 不支持 FP8
    swap_space=0,
)
# 每卡权重 35GB + 每卡 KV ~38GB = 每卡可容纳约 120K tokens
# max_model_len=4K 时每卡支持约 30 个序列，总计 120 个并发
```

### 70B 模型 on 8×H100 80GB (TP=8)

```python
LLM(
    model="meta-llama/Llama-3-70B",
    tensor_parallel_size=8,
    gpu_memory_utilization=0.95,
    max_model_len=8192,
    block_size=32,
    kv_cache_dtype="fp8",        # H100 FP8
    quantization="fp8",          # 权重 FP8
    swap_space=0,
)
# 每卡权重 ~9GB + 每卡 KV ~64GB = 每卡可容纳约 460K tokens
# max_model_len=8K 时每卡支持约 57 个序列，总计 460 个并发
```

---

## 2.9 本章小结

| 参数 | 离线推荐值 | 核心原理 |
|------|----------|---------|
| `gpu_memory_utilization` | 0.95 | 离线无波动，拉满 |
| `max_model_len` | 数据 P99 × 1.2 | 降此值收益最大 |
| `block_size` | 16(短) / 32(长) | 影响碎片和 kernel 效率 |
| `swap_space` | 0 | 优先用其他优化替代 |
| `cpu_offload_gb` | 0 | 性能代价太大，用 TP 替代 |
| `kv_cache_dtype` | "fp8" (H100) | 几乎无损翻倍并发 |

**最重要的洞察**：显存调优的核心不是"怎么用更少显存"，而是"怎么把省下来的显存全部变成 KV Cache"——因为 KV Cache 直接决定了并发数，而并发数直接决定了吞吐。
