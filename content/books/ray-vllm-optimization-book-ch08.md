---
title: "Ray+vLLM 参数优化深度全书 - 第8章: Prefix Caching 与数据预处理优化"
book: "Ray+vLLM 离线推理参数优化深度全书"
chapter: "8"
chapterTitle: "Prefix Caching 与数据预处理优化：离线推理的独有优势"
description: "深入解析 Prefix Caching 的 Block 级哈希机制，以及离线场景下通过数据排序、分桶、预 tokenize 等预处理策略最大化缓存命中率和吞吐"
date: "2026-08-01"
updatedAt: "2026-08-01"
agent: "研究员→编辑→审校员"
tags:
  - "vLLM"
  - "Prefix Caching"
  - "数据预处理"
  - "缓存命中"
  - "离线优化"
type: "book"
---

# 第 8 章：Prefix Caching 与数据预处理优化

> **学习目标**：理解 Prefix Caching 的底层机制和参数配置，掌握离线场景下通过数据预处理最大化缓存命中率的策略，学会设计数据管线来配合 Prefix Caching。

---

## 8.1 Prefix Caching 原理

### 8.1.1 问题：重复 Prefill 计算

在 LLM 推理中，Prefill 阶段（处理 prompt）是最计算密集的部分。如果有大量请求共享相同的 prompt 前缀（如 system prompt），传统方式下每个请求都会重新计算这部分 KV Cache：

```
请求 1: [System Prompt 500t] + [User Query A 50t]
请求 2: [System Prompt 500t] + [User Query B 80t]
请求 3: [System Prompt 500t] + [User Query C 30t]

无缓存: 每个请求都计算 500 token 的 prefill = 1500 次 attention 计算
有缓存: 只计算第一次的 500 token，后续 2 次直接复用 = 580 次 attention 计算
省掉 61% 的 prefill 计算
```

### 8.1.2 Block 级哈希缓存

vLLM 的 Prefix Caching 以 Block 为粒度（默认 16 token）：

```
Prompt: [System Prompt 500 tokens] [User Query 50 tokens]

Block 0: tokens 0-15   → KV Cache Block #A → 哈希 = hash(tokens[0:16])
Block 1: tokens 16-31  → KV Cache Block #B → 哈希 = hash(tokens[16:32], hash(#A))
Block 2: tokens 32-47  → KV Cache Block #C → 哈希 = hash(tokens[32:48], hash(#B))
...
Block 31: tokens 496-511 → KV Cache Block #Z
Block 32: tokens 512-527 → 新内容，需要计算
Block 33: tokens 528-543 → 新内容，需要计算
```

**关键设计**：每个 Block 的哈希包含**前一个 Block 的哈希**，形成哈希链。这意味着只有完全相同前缀的 Block 才能命中缓存。

### 8.1.3 缓存查找流程

```
新请求到达:
  1. 将 prompt 分成 Block 大小的块
  2. 计算每个 Block 的哈希 (含前序哈希)
  3. 查找缓存:
     Block 0 → 命中 ✅ (复用 KV Cache)
     Block 1 → 命中 ✅
     ...
     Block 31 → 命中 ✅
     Block 32 → 未命中 ❌ (从这里开始需要计算)
  4. 只对未命中的 Block 做 prefill
  5. 计算完成后，新 Block 的 KV Cache 加入缓存
```

---

## 8.2 enable_prefix_caching 参数

### 8.2.1 参数定义

```python
LLM(
    model="...",
    enable_prefix_caching=True,  # vLLM 0.5+ 默认 True
)
```

### 8.2.2 开启 vs 不开启

| 场景 | 不开启 | 开启 | 提升 |
|------|--------|------|------|
| 所有请求相同 system prompt (500t) | baseline | prefill 时间减少 90% | **5-10x** |
| 部分请求共享 few-shot (200t) | baseline | prefill 时间减少 40% | 1.5-2x |
| 请求之间无共同前缀 | baseline | 无变化（但有微小查表开销） | ~0% |
| 混合场景 | baseline | 平均减少 30-50% prefill | 1.3-1.5x |

### 8.2.3 缓存淘汰策略

vLLM 的 Prefix Cache 使用 LRU (Least Recently Used) 淘汰策略。当 KV Cache 显存不足时，最久未使用的缓存 Block 会被驱逐。

```python
# 缓存大小受 gpu_memory_utilization 和 max_model_len 共同决定
# 总 KV Cache 空间 = gpu_memory_utilization × total_mem - weights - activations
# 缓存 Block 和运行中序列的 Block 共享这个空间

# 如果运行中序列占满了 KV Cache，缓存 Block 会被驱逐
# 这就是为什么 max_num_seqs 不能设太大——会挤压缓存空间
```

### 8.2.4 缓存命中率监控

```python
# vLLM 0.6+ 提供缓存统计
from vllm import LLM

llm = LLM(model="...", enable_prefix_caching=True, disable_log_stats=False)
outputs = llm.generate(prompts, sampling_params)

# 查看统计信息
# vLLM 会在日志中输出:
# "Avg preemption: 0, Avg swapped_in: 0, Avg cached tokens: 450"
# cached_tokens 越高，命中率越好
```

---

## 8.3 离线场景的 Prefix Caching 最大化策略

### 8.3.1 策略 1: 统一 System Prompt

```python
# ❌ 每个请求用不同的 system prompt
prompts = [
    f"<|system|>\nYou are a helpful assistant #{i}\n<|user|>\n{q}\n<|assistant|>\n"
    for i, q in enumerate(questions)
]
# 缓存命中率: 0%

# ✅ 所有请求用完全相同的 system prompt
SYSTEM = "<|system|>\nYou are a helpful assistant. Answer concisely.\n"
prompts = [
    f"{SYSTEM}<|user|>\n{q}\n<|assistant|>\n"
    for q in questions
]
# 缓存命中率: ~100% (system prompt 部分)
```

### 8.3.2 策略 2: 共享 Few-shot 示例

```python
# few-shot 示例放在最前面，所有请求共享
FEW_SHOT = """
Examples:
Input: The movie was great!
Output: Positive

Input: Terrible service.
Output: Negative

Input: It was okay, nothing special.
Output: Neutral
"""

prompts = [
    f"{FEW_SHOT}\nInput: {q}\nOutput: "
    for q in questions
]
# few-shot 部分 (约 100 token) 缓存命中率 ~100%
# 只有最后的 Input 部分需要计算
```

### 8.3.3 策略 3: 按前缀相似度排序

```python
# 如果请求有部分相同前缀（如相同任务不同参数），排序后提交
# 让相似前缀的请求在时间上靠近，提高缓存命中

# 假设任务是文档问答，每个请求有文档 ID + 问题
# 同一文档的多个问题共享文档前缀

from collections import defaultdict

# 按文档 ID 分组
doc_groups = defaultdict(list)
for doc_id, question in dataset:
    doc_groups[doc_id].append(question)

# 同一文档的问题连续提交
sorted_prompts = []
for doc_id, questions in doc_groups.items():
    doc_text = load_document(doc_id)
    for q in questions:
        sorted_prompts.append(f"{doc_text}\n\nQuestion: {q}\nAnswer: ")

# 效果：同一文档的第二个及以后请求命中文档前缀缓存
# 文档 5000 token，问题 50 token
# 第一个请求: 5050 token 全部 prefill
# 后续请求: 50 token prefill (5000 token 命中缓存)
# 10 个问题/文档: 5050 + 9×50 = 5500 token (vs 无缓存 50500 token)
```

### 8.3.4 策略 4: 长度排序

```python
# 按 prompt 长度排序，短 prompt 先处理
# 短 prompt 快速完成，释放 KV Cache 空间给长 prompt
# 同时短 prompt 之间的共同前缀更容易匹配

prompts_sorted = sorted(prompts, key=lambda x: len(tokenizer.encode(x)))
outputs = llm.generate(prompts_sorted, sampling_params)
```

### 8.3.5 命中率量化

| 策略 | 典型命中率 | prefill 加速 |
|------|-----------|-------------|
| 无优化（随机顺序） | 10-30% | 1.1-1.3x |
| 统一 system prompt | 80-100% | 5-10x (system 部分) |
| 共享 few-shot | 70-90% | 3-5x (few-shot 部分) |
| 文档分组排序 | 60-80% | 2-4x |
| 长度排序 | +10-15% | 额外 1.1x |
| **全部组合** | **85-95%** | **3-5x 整体** |

---

## 8.4 数据预处理优化

### 8.4.1 预 Tokenize

```python
from vllm import LLM, TokensPrompt

# ❌ 运行时 tokenize，CPU 可能成为瓶颈
prompts = [f"System: {SYSTEM}\nUser: {q}\nAssistant:" for q in questions]
outputs = llm.generate(prompts, sampling_params)
# vLLM 内部用 Python tokenizer，高并发时 CPU 瓶颈

# ✅ 提前 tokenize
tokenized_prompts = [
    TokensPrompt(prompt_tokens=tokenizer.encode(f"System: {SYSTEM}\nUser: {q}\nAssistant:"))
    for q in questions
]
outputs = llm.generate(tokenized_prompts, sampling_params)
# 省掉运行时 tokenize 开销
# 10,000 条请求节省 ~30-60 秒
```

### 8.4.2 分桶处理

```python
from collections import defaultdict
import numpy as np

# 按 token 长度分桶
bucket_size = 256  # 每 256 token 一个桶
buckets = defaultdict(list)

for prompt_tokens in all_tokenized_prompts:
    length = len(prompt_tokens["prompt_tokens"])
    bucket_key = (length // bucket_size) * bucket_size
    buckets[bucket_key].append(prompt_tokens)

# 逐桶推理
all_outputs = []
for bucket_start in sorted(buckets.keys()):
    bucket_prompts = buckets[bucket_start]
    outputs = llm.generate(bucket_prompts, sampling_params)
    all_outputs.extend(outputs)
    print(f"Bucket {bucket_start}-{bucket_start+bucket_size}: {len(bucket_prompts)} prompts")
```

**分桶的效果**：

| 指标 | 不分桶 | 分桶 | 提升 |
|------|--------|------|------|
| padding 浪费 | 30-40% | <5% | batch 利用率 +35% |
| GPU 利用率 | ~70% | ~90% | +20% |
| 总吞吐 | baseline | +25-35% | — |

### 8.4.3 为什么分桶有效

vLLM 的 Continuous Batching 在 prefill 阶段会将多个请求的 token 拼接成一个 batch。如果请求长度差异大，短请求会等待长请求完成 prefill（即使有 chunked prefill，长度差异也会影响调度效率）。

分桶后，同桶内请求长度接近，batch 填充率高，GPU 算力利用率最大化。

### 8.4.4 批次大小优化

```python
# 离线推理可以控制每次提交的 batch 大小
# 不是越大越好——取决于 KV Cache 容量和 GPU 算力

# 测试不同 batch 大小的最优值
for batch_size in [64, 128, 256, 512, 1024]:
    t0 = time.time()
    for i in range(0, len(prompts), batch_size):
        batch = prompts[i:i+batch_size]
        outputs = llm.generate(batch, sampling_params)
    elapsed = time.time() - t0
    throughput = len(prompts) / elapsed
    print(f"batch_size={batch_size}: {throughput:.0f} req/s")
```

---

## 8.5 Prefix Caching 的陷阱

### 8.5.1 陷阱 1: 缓存污染

```python
# 如果有大量不同前缀的请求，缓存会被频繁驱逐
# 例子: 10,000 个不同的文档问答，每个文档不同
# 文档前缀: 5000 token × 10,000 个 = 50M token 的 KV Cache
# A100 80GB 的 KV Cache 容量: ~200K token
# 缓存只能容纳 ~40 个文档的前缀

# 解决: 按文档分组，处理完一组再处理下一组
for doc_id, questions in doc_groups.items():
    # 这组请求共享同一文档前缀
    prompts = [build_prompt(doc_id, q) for q in questions]
    outputs = llm.generate(prompts, sampling_params)
    # 处理完后，这组文档的缓存自然被下一组驱逐
```

### 8.5.2 陷阱 2: Block 边界对齐

```python
# Prefix Caching 以 Block (16 token) 为粒度
# 如果共同前缀不是 16 的倍数，最后一个 Block 不会命中

# ❌ 共同前缀 505 token
# Block 0-30 (480 token) 命中
# Block 31 (token 480-495) 命中
# Block 32 (token 496-511) 只有 496-504 命中 (9/16)，不完整 → 不命中
# 实际省掉 496 token 的计算，不是 505

# ✅ 共同前缀 512 token (16 的倍数)
# Block 0-31 全部命中，省掉 512 token 的计算

# 优化: 尽量让 system prompt / few-shot 长度为 16 的倍数
# 或者在 system prompt 后加 padding token 对齐
```

### 8.5.3 陷阱 3: 与量化的交互

```python
# KV Cache 量化后的 Block 也可以缓存
# 但如果切换量化配置，旧缓存不可用

# 第一次运行: FP8 KV Cache
llm1 = LLM(model="...", kv_cache_dtype="fp8", enable_prefix_caching=True)
llm1.generate(prompts)  # 缓存 FP8 的 KV Block

# 第二次运行 (新进程): FP16 KV Cache
llm2 = LLM(model="...", kv_cache_dtype="auto", enable_prefix_caching=True)
llm2.generate(prompts)  # 缓存为空 (不同进程，缓存不共享)
# 注意: 同一进程内切换 kv_cache_dtype 不支持
```

### 8.5.4 陷阱 4: 多模态输入

```python
# 多模态模型 (如 LLaVA) 的 image token 不参与 prefix hashing
# 只有文本部分的前缀可以被缓存
# 如果 prompt 结构是 [image] [text]，text 部分的前缀缓存可能不生效

# 解决: 将共同文本放在 image 之前
# ✅ [System Prompt] [Image] [Question]
# ❌ [Image] [System Prompt] [Question]
```

---

## 8.6 完整优化管线

```python
import ray
from vllm import LLM, SamplingParams, TokensPrompt
from collections import defaultdict
from transformers import AutoTokenizer

# 1. 初始化
tokenizer = AutoTokenizer.from_pretrained("meta-llama/Llama-3-70B")
llm = LLM(
    model="meta-llama/Llama-3-70B",
    quantization="fp8",
    kv_cache_dtype="fp8",
    tensor_parallel_size=8,
    enable_prefix_caching=True,
    gpu_memory_utilization=0.95,
    max_model_len=8192,
    max_num_seqs=256,
    enable_chunked_prefill=True,
    enforce_eager=False,
)

# 2. 统一 system prompt (长度对齐到 16 的倍数)
SYSTEM = "You are a helpful assistant. " * 6  # ~144 token, 接近 16 的倍数

# 3. 预 tokenize + 分桶
buckets = defaultdict(list)
for question in all_questions:
    prompt = f"{SYSTEM}\n\nUser: {question}\nAssistant:"
    tokens = tokenizer.encode(prompt)
    bucket_key = (len(tokens) // 256) * 256
    buckets[bucket_key].append(TokensPrompt(prompt_tokens=tokens))

# 4. 按桶大小排序 (小桶先处理，快速释放 KV Cache)
sorted_buckets = sorted(buckets.items(), key=lambda x: len(x[1]))

# 5. 逐桶推理
params = SamplingParams(temperature=0.3, top_p=0.9, max_tokens=512)
all_outputs = []
for bucket_key, bucket_prompts in sorted_buckets:
    outputs = llm.generate(bucket_prompts, params)
    all_outputs.extend(outputs)

print(f"Total: {len(all_outputs)} outputs")
# 预期: 比无优化快 3-5x
```

---

## 8.7 本章小结

| 优化策略 | 原理 | 离线收益 |
|---------|------|---------|
| `enable_prefix_caching=True` | Block 级哈希缓存 KV Cache | prefill 加速 2-10x |
| 统一 system prompt | 最大化前缀匹配 | 命中率 80-100% |
| 按前缀相似度排序 | 相似请求连续提交 | 命中率 +20-30% |
| 按长度排序 | 短请求先完成释放资源 | 吞吐 +10-15% |
| 分桶处理 | 同桶内 padding 最小化 | GPU 利用率 +20% |
| 预 tokenize | 避免运行时 CPU 瓶颈 | 节省 30-60s/万条 |
| Block 对齐 | 前缀长度为 16 的倍数 | 避免最后 Block 不命中 |

**核心洞察**：Prefix Caching 是离线推理最独特的优势——在线服务无法控制请求顺序，但离线可以。通过精心设计数据管线，将缓存命中率从 20% 提升到 90%+，等效于 3-5 倍的 prefill 加速，这是任何参数调优都无法比拟的收益。
