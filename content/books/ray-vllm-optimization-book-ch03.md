---
title: "Ray+vLLM 参数优化深度全书 - 第3章: 调度器参数与批处理策略"
book: "Ray+vLLM 离线推理参数优化深度全书"
chapter: "3"
chapterTitle: "调度器参数与批处理策略：让 GPU 永远满载"
description: "深入解析 max_num_seqs、max_num_batched_tokens、chunked_prefill、num_scheduler_steps 等调度器参数的底层原理，以及离线场景的批处理最优策略"
date: "2026-08-01"
updatedAt: "2026-08-01"
agent: "研究员→编辑→审校员"
tags:
  - "vLLM"
  - "调度器"
  - "Continuous Batching"
  - "Chunked Prefill"
  - "批处理"
type: "book"
---

# 第 3 章：调度器参数与批处理策略

> **学习目标**：理解 vLLM 调度器的工作原理，掌握 Continuous Batching 的调度逻辑，学会通过调度器参数最大化 GPU 利用率和吞吐。

---

## 3.1 vLLM 调度器工作原理

vLLM 调度器是推理引擎的"交通指挥"。每一步推理时，它决定：哪些请求参与这一步的计算、哪些请求暂停、哪些请求可以新加入。

### 3.1.1 调度循环

```
┌─────────────────────────────────────────────────────────┐
│                  vLLM 调度器循环                          │
│                                                         │
│  while 有未完成的请求:                                    │
│    1. 检查 KV Cache 剩余空间                              │
│    2. 从等待队列选取请求加入 running 队列                   │
│       - 受 max_num_seqs 限制                              │
│       - 受 max_num_batched_tokens 限制                    │
│       - 受 KV Cache 容量限制                              │
│    3. 如果空间不足，执行抢占 (preemption)                   │
│       - swap: 换出到 CPU                                  │
│       - recompute: 丢弃 KV Cache，重算                    │
│    4. 执行一步推理 (prefill 或 decode)                     │
│    5. 检查哪些序列已结束 (EOS)，移出                       │
│    6. (可选) 每隔 num_scheduler_steps 步同步一次           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 3.1.2 Prefill 和 Decode 阶段

每个请求经历两个阶段：

```
请求到达
    │
    ▼
┌──────────┐     ┌──────────────────┐     ┌──────────┐
│  等待队列 │ ──→ │  Prefill (并行)   │ ──→ │ Decode   │
│ (waiting) │     │  处理全部 prompt  │     │ (逐token)│
└──────────┘     │  tokens           │     │ 生成     │
                 └──────────────────┘     └──────────┘
                                                 │
                                          生成 EOS 或
                                          达到 max_tokens
                                                 │
                                                 ▼
                                              完成
```

**Prefill 阶段**是计算密集型：一次性处理全部 prompt token，GPU 算力打满。
**Decode 阶段**是访存密集型：每步只生成 1 个 token，但要读取全部权重和 KV Cache，GPU 算力利用率低。

调度器的核心挑战：如何让 Prefill 和 Decode 混合执行，保持 GPU 持续满载。

---

## 3.2 max_num_seqs：并发序列数

### 3.2.1 参数定义

```python
LLM(
    model="...",
    max_num_seqs=256,  # 默认 256
)
```

这是调度器允许的最大并发序列数。它与 KV Cache 容量共同决定了实际并发数：`实际并发 = min(max_num_seqs, KV_Cache容量 / max_model_len)`。

### 3.2.2 离线 vs 在线的巨大差异

| 场景 | 推荐值 | 原因 |
|------|--------|------|
| 在线服务 (低延迟) | 32-64 | 每增加一个并发序列，所有序列的 decode 延迟都增加 |
| 在线服务 (高吞吐) | 128-256 | 牺牲延迟换吞吐 |
| **离线推理** | **256-512** | 不关心延迟，GPU 满载最重要 |
| 离线推理 (长序列) | 64-128 | 长序列 KV Cache 大，受显存限制 |

### 3.2.3 延迟与吞吐的数学关系

在 Decode 阶段，每个 step 处理所有并发序列各 1 个 token。step 延迟约：

```
step_latency = fixed_overhead + per_seq_cost × num_seqs
```

- `fixed_overhead`：kernel launch + 权重读取 ≈ 10-15ms
- `per_seq_cost`：每个序列的额外 KV Cache 读取 ≈ 0.1-0.5ms

| max_num_seqs | step_latency | 单序列 decode 延迟 | 总吞吐 (tokens/s) |
|-------------|-------------|------------------|------------------|
| 8 | 14ms | 14ms | 571 |
| 32 | 22ms | 22ms | 1,454 |
| 128 | 50ms | 50ms | 2,560 |
| 256 | 85ms | 85ms | 3,012 |
| 512 | 155ms | 155ms | 3,303 |

**关键洞察**：吞吐随 `max_num_seqs` 增长而增长，但边际收益递减。从 8→32 提升 2.5x，从 256→512 只提升 10%。因为 `per_seq_cost` 也在增长，更多序列意味着更多 KV Cache 读取。

### 3.2.4 如何确定最优值

```python
# 方法 1：基于 KV Cache 容量计算
num_blocks = get_num_blocks()  # vLLM profiling 后可知
max_seqs_by_kv = num_blocks * block_size / max_model_len
optimal = min(256, int(max_seqs_by_kv * 0.9))  # 留 10% 余量

# 方法 2：二分法实测
for max_seqs in [64, 128, 256, 512]:
    llm = LLM(model="...", max_num_seqs=max_seqs, ...)
    t0 = time.time()
    llm.generate(all_prompts, sampling_params)
    throughput = len(all_prompts) / (time.time() - t0)
    print(f"max_seqs={max_seqs}: {throughput:.0f} req/s")
```

---

## 3.3 max_num_batched_tokens：单步 token 上限

### 3.3.1 参数定义

```python
LLM(
    model="...",
    max_num_batched_tokens=8192,  # 默认 = max_model_len
)
```

这是调度器在**单步**中最多处理的 token 数（包括 prefill 和 decode 的所有 token）。

### 3.3.2 它如何影响调度

假设 `max_num_batched_tokens=8192`，当前有 100 个序列在 decode（各需 1 token = 100 token），同时有一个新请求的 prompt 有 4000 token 在 prefill：

```
单步 token 预算 = 8192
Decode 需要: 100 × 1 = 100 tokens
剩余预算: 8192 - 100 = 8092 tokens
Prefill 可以处理: min(4000, 8092) = 4000 tokens → 全部处理

→ 这一步同时做了 100 个 decode + 1 个 prefill
```

如果 `max_num_batched_tokens` 太小（如 2048）：
```
单步 token 预算 = 2048
Decode 需要: 100 × 1 = 100 tokens
剩余预算: 2048 - 100 = 1948 tokens
Prefill 只能处理: 1948 tokens（4000 的 prompt 被截断）

→ Prefill 被分块，需要多步才能完成
```

### 3.3.3 调优建议

| 模型大小 | GPU | 推荐值 | 原因 |
|---------|-----|--------|------|
| 8B | A100 80G | 8192-16384 | A100 HBM 带宽 2TB/s，能处理大 batch |
| 70B | A100 80G×4 | 4096-8192 | 70B 的单步计算量大，不宜过大 |
| 8B | H100 80G | 16384-32768 | H100 算力更强，可以更大 |
| 70B | H100 80G×8 | 8192-16384 | 平衡 prefill 和 decode |

**经验法则**：`max_num_batched_tokens = max_model_len` 是安全默认值。如果开启了 chunked prefill，可以设为 `max_model_len` 的 2-4 倍，让更多 decode 请求与 prefill 并行。

### 3.3.4 太大的风险

`max_num_batched_tokens` 过大（如 65536）会导致单步计算时间过长，可能触发 CUDA 超时或导致请求饥饿（新请求的 prefill 一直等不到调度）。

---

## 3.4 enable_chunked_prefill：消除 Head-of-Line Blocking

### 3.4.1 问题：Head-of-Line Blocking

在没有 chunked prefill 时，一个长 prompt（如 8000 token）的 prefill 会占用整个 GPU，其他所有 decode 请求必须等待：

```
时间线（无 chunked prefill）:
───┬──────────────────────┬─────────┬─────────┬─────────
   │ Prefill(8000 tokens) │ Decode  │ Decode  │ Decode
   │   ← 其他请求等待 →    │ 所有请求 │ 所有请求 │ 所有请求
   └──────────────────────┘

问题：prefill 期间所有 decode 停滞，GPU 利用率在 decode 间隙降低
```

### 3.4.2 Chunked Prefill 的解决方式

```python
LLM(
    model="...",
    enable_chunked_prefill=True,  # vLLM 0.5+ 默认 True
)
```

```
时间线（有 chunked prefill, max_num_batched_tokens=4096）:
───┬────────┬────────┬────────┬────────┬────────
   │Chunk1  │Chunk2  │Chunk3  │Chunk4  │ Done
   │(2048t) │(2048t) │(2048t) │(2048t) │
   │+Decode │+Decode │+Decode │+Decode │+Decode
   │所有请求 │所有请求 │所有请求 │所有请求 │所有请求
   └────────┘└────────┘└────────┘└────────┘

每一步：2048 prefill + N decode，GPU 持续满载
```

### 3.4.3 性能影响

| 场景 | 无 Chunked Prefill | 有 Chunked Prefill | 提升 |
|------|-------------------|-------------------|------|
| 短 prompt (100t) + 短输出 (100t) | 2,000 tok/s | 2,050 tok/s | +2.5% |
| 长 prompt (4K) + 短输出 (200t) | 1,200 tok/s | 1,800 tok/s | +50% |
| 混合长短 prompt | 1,500 tok/s | 2,200 tok/s | +47% |
| 全长 prompt (8K+) | 800 tok/s | 1,600 tok/s | +100% |

**结论**：只要数据中有长 prompt（>1024 token），就必须开 chunked prefill。短 prompt 场景收益小但无害。

### 3.4.4 与 CUDA Graph 的交互

vLLM 0.6+ 对 chunked prefill + CUDA Graph 做了优化兼容。但在某些旧版本中，两者可能冲突。如果遇到报错或性能异常，可以：

```python
# 方案 A：优先保证 chunked prefill
LLM(model="...", enable_chunked_prefill=True, enforce_eager=True)

# 方案 B：优先保证 CUDA Graph（vLLM 0.6+ 通常不需要）
LLM(model="...", enable_chunked_prefill=False, enforce_eager=False)
```

**推荐**：始终开启 chunked prefill，CUDA Graph 在 vLLM 0.6+ 默认兼容。

---

## 3.5 num_scheduler_steps：多步调度

### 3.5.1 参数定义

```python
LLM(
    model="...",
    num_scheduler_steps=4,  # 默认 1
)
```

传统模式下，调度器每生成 1 个 token 就要与 GPU 同步一次（检查 EOS、调度新请求）。`num_scheduler_steps=4` 意味着连续生成 4 个 token 才同步一次。

### 3.5.2 原理

```
传统模式 (num_scheduler_steps=1):
  CPU: [调度]→[等待GPU]→[调度]→[等待GPU]→[调度]→...
  GPU:    [计算]         [计算]         [计算]
  ↑ CPU 在等待 GPU 时空闲，每次同步 ~2-5ms 开销

多步调度 (num_scheduler_steps=4):
  CPU: [调度4步]→[等待GPU]  [调度4步]→[等待GPU]
  GPU:   [计算][计算][计算][计算]  [计算][计算][计算][计算]
  ↑ CPU 一次提交 4 步计算，减少 75% 同步开销
```

### 3.5.3 性能提升

| 配置 | 同步开销占比 | 吞吐提升 |
|------|------------|---------|
| num_steps=1 | ~15-20% | baseline |
| num_steps=4 | ~4-5% | +12-18% |
| num_steps=8 | ~2-3% | +15-20% |
| num_steps=16 | ~1-2% | +16-22% |

### 3.5.4 代价与限制

| 问题 | 影响 | 缓解方式 |
|------|------|---------|
| EOS 检测延迟 | 序列可能多生成 num_steps-1 个 token | 对离线无影响 |
| 请求调度延迟 | 新请求最多等 num_steps 步才加入 | 离线可忽略 |
| **与投机解码冲突** | 投机解码需要每步验证，多步会破坏验证逻辑 | 不要同时使用 |
| 与 chunked prefill | 部分版本不兼容 | vLLM 0.6+ 兼容 |

### 3.5.5 离线推荐

```python
# 离线推理推荐配置
LLM(
    model="...",
    num_scheduler_steps=4,     # 4 是性价比最高的选择
    enable_chunked_prefill=True,
    # speculative_model=None,  # 不要同时用投机解码
)
```

---

## 3.6 preemption_mode：显存不足时的策略

### 3.6.1 参数定义

```python
LLM(
    model="...",
    preemption_mode="recompute",  # 默认 "swap"
)
```

当 KV Cache 不足以容纳所有 running 序列时，调度器需要抢占部分序列。

### 3.6.2 两种模式对比

| 模式 | 工作方式 | 恢复时间 | 显存需求 |
|------|---------|---------|---------|
| swap | KV Cache 换出到 CPU 内存 | 快 (~50ms) | 需要 swap_space |
| recompute | 丢弃 KV Cache，重新 prefill | 慢 (~prefill 时间) | 不需要额外空间 |

### 3.6.3 离线场景推荐

离线场景下，如果正确设置了 `max_num_seqs` 和 `max_model_len`，理论上不会发生抢占。但作为安全网：

```python
LLM(
    model="...",
    preemption_mode="recompute",  # 离线推荐 recompute
    swap_space=0,                 # 不分配 swap 空间
)
```

**原因**：离线场景如果有 swap_space，vLLM 可能倾向于用 swap 而不是限制并发数，导致大量 CPU↔GPU 数据传输，反而降低吞吐。recompute 模式让调度器更倾向于控制并发数在合理范围内。

---

## 3.7 long_prefill_token_threshold：长 prompt 分块阈值

### 3.7.1 参数定义

```python
LLM(
    model="...",
    long_prefill_token_threshold=2048,  # 默认 0 (禁用)
)
```

当 prompt 长度超过此阈值时，即使没有开启 chunked prefill，也会对该 prompt 进行分块处理。

### 3.7.2 与 chunked prefill 的关系

| 配置 | 效果 |
|------|------|
| `chunked_prefill=False, threshold=0` | 所有 prompt 不分块 |
| `chunked_prefill=False, threshold=2048` | 仅 >2048 token 的 prompt 分块 |
| `chunked_prefill=True, threshold=0` | 所有 prompt 走 chunked 调度 |
| `chunked_prefill=True, threshold=2048` | 等效于 chunked_prefill=True |

### 3.7.3 推荐

通常直接用 `enable_chunked_prefill=True` 即可，不需要单独配置此参数。只有在想对短 prompt 不分块、长 prompt 分块时才有用。

---

## 3.8 离线批处理最优策略

### 3.8.1 数据预排序

离线推理独有的优势——可以提前组织数据：

```python
# 策略 1: 按长度排序
prompts_sorted = sorted(prompts, key=lambda x: len(tokenizer.encode(x)))

# 效果：相似长度的 prompt 在同一个 batch 中处理
# 减少短序列等待长序列完成的情况
# 吞吐提升 10-20%

# 策略 2: 分桶处理
bucket_size = 256
buckets = []
for i in range(0, len(prompts_sorted), bucket_size):
    buckets.append(prompts_sorted[i:i+bucket_size])

for bucket in buckets:
    outputs = llm.generate(bucket, sampling_params)
    # 每个 bucket 内长度接近，batch 利用率高
```

### 3.8.2 混合 prefill-decode 批处理

```python
# 将长 prompt 和短 prompt 交替提交，让调度器能混合 prefill 和 decode
# 而不是先处理所有长 prompt（全是 prefill），再处理短 prompt

interleaved = []
for i in range(max(len(long_prompts), len(short_prompts))):
    if i < len(long_prompts):
        interleaved.append(long_prompts[i])
    if i < len(short_prompts):
        interleaved.append(short_prompts[i])

outputs = llm.generate(interleaved, sampling_params)
```

### 3.8.3 控制 max_tokens

```python
from vllm import SamplingParams

# ❌ 所有请求统一 max_tokens=1024
params = SamplingParams(max_tokens=1024)
outputs = llm.generate(prompts, params)
# 短回答的请求也会等到 KV Cache 中的 slot 被释放

# ✅ 根据任务调整 max_tokens
params_map = {
    "classification": SamplingParams(max_tokens=10),
    "summary": SamplingParams(max_tokens=256),
    "generation": SamplingParams(max_tokens=1024),
}
# 分批处理不同任务
for task_type, task_prompts in grouped_prompts.items():
    outputs = llm.generate(task_prompts, params_map[task_type])
    # 短任务快速完成释放 KV Cache，长任务充分利用
```

---

## 3.9 本章小结

| 参数 | 离线推荐值 | 核心原理 |
|------|----------|---------|
| `max_num_seqs` | 256-512 | 拉大并发，吞吐随并发增长（边际递减） |
| `max_num_batched_tokens` | 8192-16384 | 控制 prefill+decode 混合步的 token 预算 |
| `enable_chunked_prefill` | True | 消除 prefill 阻塞 decode，长 prompt 必开 |
| `num_scheduler_steps` | 4 | 减少同步开销 75%，但不兼容投机解码 |
| `preemption_mode` | "recompute" | 离线不用 swap，让调度器控制并发 |
| 数据排序 | 按长度排序 | 离线独有优势，提升 10-20% |

**核心洞察**：调度器参数的调优目标是让 GPU **永远满载**——既有 prefill 请求喂满算力，又有 decode 请求保持流水线不空。chunked prefill + 大 max_num_seqs + 合理的 max_num_batched_tokens 是实现这个目标的三板斧。
