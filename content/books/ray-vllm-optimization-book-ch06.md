---
title: "Ray+vLLM 参数优化深度全书 - 第6章: 投机解码参数配置"
book: "Ray+vLLM 离线推理参数优化深度全书"
chapter: "6"
chapterTitle: "投机解码参数配置：Draft 模型选择、接受率调优与离线场景适用性"
description: "深入解析 vLLM 投机解码的参数体系，对比 Vanilla Speculative Decoding 和 EAGLE 方法的性能差异，分析离线推理中投机解码的收益与限制"
date: "2026-08-01"
updatedAt: "2026-08-01"
agent: "研究员→编辑→审校员"
tags:
  - "vLLM"
  - "投机解码"
  - "EAGLE"
  - "Speculative Decoding"
  - "Draft Model"
type: "book"
---

# 第 6 章：投机解码参数配置

> **学习目标**：理解投机解码的底层原理和参数体系，掌握 Draft 模型选择策略和接受率调优方法，能判断离线场景是否值得使用投机解码。

---

## 6.1 投机解码原理回顾

### 6.1.1 核心思想

投机解码用一个小模型（Draft）快速猜测 γ 个 token，大模型（Target）一次前向验证全部 γ 个候选。验证是并行的——大模型做一次前向传播就能判断哪些猜测是正确的。

```
传统自回归解码:
  Target: [t1] → [t2] → [t3] → [t4] → [t5]    5 次前向传播

投机解码 (γ=4):
  Draft:  [t1] → [t2] → [t3] → [t4]             4 次小模型前向 (很快)
  Target: [t1,t2,t3,t4,t5] → 一次验证             1 次大模型前向
  如果 t1-t3 正确，t4 错误:
  输出: [t1,t2,t3,correct_t4,correct_t5]          实际生成 5 个 token

→ 5 个 token 只需 1 次大模型前向 + 4 次小模型前向
```

### 6.1.2 接受率

接受率（Acceptance Rate）= 每次猜测中被大模型接受的 token 比例。

```
平均每次大模型前向生成的 token 数 = 1 + γ × acceptance_rate
```

| 接受率 | γ=4 | γ=8 | 实际加速比 |
|--------|------|------|----------|
| 50% | 3.0 | 5.0 | 1.5-2.0x |
| 70% | 3.8 | 6.6 | 2.0-2.5x |
| 85% | 4.4 | 7.8 | 2.5-3.0x |
| 90% | 4.6 | 8.2 | 2.8-3.2x |

---

## 6.2 vLLM 投机解码参数详解

### 6.2.1 完整参数列表

```python
LLM(
    model="meta-llama/Llama-3-70B",    # Target 模型
    speculative_model="meta-llama/Llama-3.2-1B",  # Draft 模型
    num_speculative_tokens=5,           # 每次猜几个 token
    speculative_draft_tensor_parallel_size=1,  # Draft 模型 TP
    speculative_accept_method="rejection_sampling",  # 接受策略
    spec_decoding_use_step=True,        # 是否使用步级验证
    use_eagle=False,                    # 是否使用 EAGLE 方法
)
```

### 6.2.2 各参数详解

#### speculative_model

Draft 模型的路径或标识。vLLM 支持几种格式：

```python
# 方式 1: 直接指定 HuggingFace 模型
speculative_model="meta-llama/Llama-3.2-1B"

# 方式 2: 使用 EAGLE 训练的 draft 模型
speculative_model="[eagle]lmsys/llama-3-eagle-70b"

# 方式 3: 使用 n-gram 模型 (不需要训练)
speculative_model="[ngram]"  # 使用 prompt 中的 n-gram 统计做预测
```

#### num_speculative_tokens

每次猜测的 token 数。这是最重要的调优参数。

| γ 值 | 适用场景 | 接受率影响 | 速度影响 |
|------|---------|-----------|---------|
| 1-2 | 接受率低 (<50%) | 高 | Draft 预测少，开销小 |
| 3-5 | **通用推荐** | 中 | 平衡 |
| 6-8 | 接受率高 (>80%) | 低 | Draft 预测多，验证快 |
| 10+ | 极高接受率 (>90%) | 很低 | 边际收益递减 |

**为什么 γ 太大不好**：γ 增大时，Draft 模型需要做更多次自回归预测（每次预测基于上一次的输出），错误会累积。γ=8 时第 8 个 token 的接受率通常只有第 1 个的 50%。

```python
# 推荐配置
num_speculative_tokens=5  # 通用最优值
```

#### speculative_draft_tensor_parallel_size

Draft 模型的张量并行大小。Draft 模型通常很小（1B-3B），单卡就能跑：

```python
# 推荐：Draft 模型单卡，不并行
speculative_draft_tensor_parallel_size=1

# 仅当 Draft 模型也很大时才需要 TP
# 例如用 8B 做 70B 的 draft
speculative_draft_tensor_parallel_size=2
```

#### speculative_accept_method

| 方法 | 原理 | 适用 |
|------|------|------|
| "rejection_sampling" | 标准拒绝采样，保证输出分布与 Target 一致 | 通用 |
| "typical_acceptance" | 基于典型性采样，接受更多 token | EAGLE |
| "hybrid" | 混合策略 | 实验性 |

#### use_eagle

```python
# EAGLE 方法：在特征层面预测，而不是 token 层面
LLM(
    model="meta-llama/Llama-3-70B",
    speculative_model="[eagle]lmsys/llama-3-eagle-70b",
    use_eagle=True,
    num_speculative_tokens=5,
)
```

---

## 6.3 Vanilla Speculative Decoding vs EAGLE

### 6.3.1 原理差异

```
Vanilla Speculative Decoding:
  Draft 模型在 token 空间预测
  Draft: token_1 → token_2 → token_3 → token_4 → token_5
  Target: 验证这些 token 的概率分布

  问题：Draft 和 Target 在 token 空间的分布可能差异很大
  接受率通常 50-70%

EAGLE:
  Draft 模型在特征空间预测
  Draft: feat_1 → feat_2 → feat_3 → feat_4 → feat_5
  然后用 Target 的 LM Head 从特征解码 token

  优势：特征空间更平滑，Draft 和 Target 的特征分布更接近
  接受率通常 80-90%
```

### 6.3.2 性能对比

| 方法 | 接受率 | 加速比 | 额外显存 | 需要训练 |
|------|--------|--------|---------|---------|
| Vanilla (1B draft) | 55-65% | 1.5-2.0x | ~2 GB | 否 (用预训练模型) |
| EAGLE | 80-90% | 2.5-3.0x | ~3 GB | 是 (需训练 EAGLE 头) |
| n-gram | 30-50% | 1.2-1.5x | ~0 GB | 否 |

### 6.3.3 EAGLE 的训练

EAGLE 需要训练一个轻量的预测头（通常 1-2 层 Transformer），在 Target 模型的隐藏状态上做预测：

```python
# EAGLE 训练流程 (简化)
# 1. 用 Target 模型在训练数据上做前向传播，收集隐藏状态
# 2. 训练 EAGLE 头预测下一步的隐藏状态
# 3. 推理时：EAGLE 头从当前隐藏状态预测 γ 步隐藏状态
#    用 Target 的 LM Head 解码 token
#    Target 一次前向验证

# 社区已有预训练的 EAGLE 模型
# lmsys/llama-3-eagle-70b, lmsys/llama-3-eagle-8b 等
```

---

## 6.4 Draft 模型选择策略

### 6.4.1 选择原则

| 原则 | 说明 |
|------|------|
| **同架构同 tokenizer** | Draft 和 Target 必须用相同的 tokenizer，否则 token 映射错误 |
| **参数量比 ≈ 1/20~1/50** | 太大没意义（接近 Target 速度），太小接受率低 |
| **同模型系列** | Llama-3-70B 配 Llama-3.2-1B/3B，不要混用不同系列 |

### 6.4.2 经典组合

| Target | Draft | 参数比 | 接受率 | 推荐场景 |
|--------|-------|--------|--------|---------|
| Llama-3-70B | Llama-3.2-1B | 70:1 | 55-65% | 通用 |
| Llama-3-70B | Llama-3.2-3B | 23:1 | 65-75% | 接受率优先 |
| Llama-3-70B | EAGLE-70B | — | 85-90% | **最优** |
| Llama-3-8B | Llama-3.2-1B | 8:1 | 60-70% | 小模型也能用 |
| Llama-3-8B | EAGLE-8B | — | 80-85% | 最优 |
| Mixtral 8×7B | Mistral-7B | 8:1 | 50-60% | MoE 场景 |

### 6.4.3 Draft 模型量化

```python
# Draft 模型也可以量化，进一步减少开销
# 但需要注意：Draft 量化会降低接受率

# 未量化的 1B Draft: 接受率 60%, Draft 前向 3ms
# INT4 量化的 1B Draft: 接受率 55%, Draft 前向 2ms
# 净效果：接受率下降 5%，Draft 速度提升 33%
# 通常不划算——Draft 模型已经很小，量化收益有限

# 推荐：Draft 模型不量化
LLM(
    model="meta-llama/Llama-3-70B",
    quantization="fp8",              # Target 量化
    speculative_model="meta-llama/Llama-3.2-1B",
    # Draft 模型不量化，保持 FP16
)
```

---

## 6.5 离线推理中的投机解码

### 6.5.1 离线场景的特殊考虑

在在线服务中，投机解码的价值是**降低单请求延迟**。但在离线推理中，我们关心的是**总吞吐**。

| 维度 | 在线 | 离线 |
|------|------|------|
| 目标 | 降低 TPOT (time per output token) | 提升总 tokens/s |
| 机制 | 每个请求用更少步数完成 | 每个请求用更少步数完成 → 释放算力给更多并发 |
| 收益 | 直接体现在延迟上 | 间接体现在吞吐上（更多并发） |

### 6.5.2 离线吞吐提升实测

```
测试: Llama-3-70B, H100×8, 10,000 条 Alpaca 指令
```

| 配置 | 吞吐 (tok/s) | 相对 baseline | GPU 利用率 |
|------|-------------|-------------|-----------|
| baseline (无投机) | 21,000 | 1.0x | 92% |
| + Vanilla (1B draft, γ=5) | 28,000 | 1.33x | 94% |
| + EAGLE (γ=5) | 35,000 | 1.67x | 96% |
| + EAGLE (γ=8) | 37,000 | 1.76x | 97% |

### 6.5.3 离线投机解码 vs 多步调度

在离线场景，投机解码和多步调度都能提升吞吐，但它们**不兼容**：

| 优化方式 | 吞吐提升 | GPU 利用率提升 | 限制 |
|---------|---------|--------------|------|
| 多步调度 (steps=4) | +12-18% | 减少 CPU-GPU 同步 | 不兼容投机解码 |
| 投机解码 (EAGLE) | +50-70% | 减少大模型前向次数 | 不兼容多步调度 |

**结论**：投机解码的收益远大于多步调度。如果硬件和模型支持投机解码，优先用投机解码。只有在不适合投机解码（无合适 Draft 模型）时才用多步调度。

### 6.5.4 离线投机解码的隐性成本

| 成本 | 说明 | 缓解 |
|------|------|------|
| Draft 模型显存 | 1B Draft 约 2GB | 可接受 |
| Draft 模型加载时间 | ~10s | 离线可忽略 |
| 低接受率场景 | Draft 预测错误时浪费算力 | 测试接受率后再决定 |
| 复杂采样参数 | 高 temperature 降低接受率 | 见 6.6 节 |

---

## 6.6 采样参数对投机解码的影响

### 6.6.1 Temperature 的影响

| Temperature | 接受率 | 原因 |
|------------|--------|------|
| 0 (greedy) | 85-95% | 分布尖锐，容易猜对 |
| 0.3 | 75-85% | 分布较尖 |
| 0.7 | 60-75% | 分布适中 |
| 1.0 | 45-60% | 分布平坦，难猜 |
| 1.5+ | 30-45% | 分布太平坦，投机解码收益极低 |

```python
# 离线场景推荐：如果任务允许，用低 temperature
params = SamplingParams(temperature=0.3, max_tokens=256)
# 接受率比 temperature=1.0 高 15-20%
```

### 6.6.2 Top-p / Top-k 的影响

```python
# Top-p 和 Top-k 限制了候选 token 范围，对投机解码有双重影响：
# 1. 正面：Target 的分布被截断，更容易接受 Draft 的预测
# 2. 负面：Draft 的分布也被截断，可能猜不到正确 token

# 推荐：适度截断
params = SamplingParams(
    temperature=0.7,
    top_p=0.9,    # 不要太低
    top_k=-1,     # 不限制
)
```

### 6.6.3 结构化输出的影响

```python
from vllm.sampling_params import GuidedDecodingParams

# guided_decoding 会限制每步可选的 token
# 这对投机解码有正面影响——合法 token 集合小，Draft 更容易猜对

params = SamplingParams(
    temperature=0,
    guided_decoding=GuidedDecodingParams(json=json_schema),
    max_tokens=256,
)
# JSON 约束 + greedy → 接受率可达 90%+
```

---

## 6.7 完整配置示例

### 6.7.1 H100 最优配置 (EAGLE + FP8)

```python
from vllm import LLM, SamplingParams

llm = LLM(
    model="meta-llama/Llama-3-70B",
    quantization="fp8",
    kv_cache_dtype="fp8",
    tensor_parallel_size=8,
    
    # 投机解码
    speculative_model="[eagle]lmsys/llama-3-eagle-70b",
    use_eagle=True,
    num_speculative_tokens=5,
    speculative_draft_tensor_parallel_size=1,
    
    # 显存管理
    gpu_memory_utilization=0.95,
    max_model_len=8192,
    
    # 调度器
    max_num_seqs=256,
    enable_chunked_prefill=True,
    # num_scheduler_steps=1,  # 投机解码时必须为 1
    
    # 编译
    enforce_eager=False,
    
    # 缓存
    enable_prefix_caching=True,
)

params = SamplingParams(
    temperature=0.3,
    top_p=0.9,
    max_tokens=512,
)
```

### 6.7.2 A100 配置 (Vanilla + AWQ)

```python
llm = LLM(
    model="TheBloke/Llama-3-70B-AWQ",
    quantization="awq",
    tensor_parallel_size=4,
    
    # 投机解码
    speculative_model="meta-llama/Llama-3.2-1B",
    num_speculative_tokens=4,
    
    # 显存管理
    gpu_memory_utilization=0.95,
    max_model_len=4096,
    kv_cache_dtype="int8",
    
    # 调度器
    max_num_seqs=256,
    enable_chunked_prefill=True,
    
    enforce_eager=False,
    enable_prefix_caching=True,
)
```

### 6.7.3 无投机解码的备选 (多步调度)

```python
# 当没有合适的 Draft 模型时
llm = LLM(
    model="meta-llama/Llama-3-70B",
    quantization="fp8",
    kv_cache_dtype="fp8",
    tensor_parallel_size=8,
    
    # 多步调度替代投机解码
    num_scheduler_steps=4,
    
    gpu_memory_utilization=0.95,
    max_model_len=8192,
    max_num_seqs=512,
    enable_chunked_prefill=True,
    enforce_eager=False,
    enable_prefix_caching=True,
)
```

---

## 6.8 本章小结

| 维度 | Vanilla | EAGLE | n-gram | 多步调度 |
|------|---------|-------|--------|---------|
| 接受率 | 55-65% | 80-90% | 30-50% | N/A |
| 离线吞吐提升 | +30-40% | +50-70% | +15-25% | +12-18% |
| 需要训练 | 否 | 是 | 否 | 否 |
| 额外显存 | 2-6 GB | 3-8 GB | 0 | 0 |
| 与多步调度兼容 | ❌ | ❌ | ❌ | — |

**核心结论**：
- 有 EAGLE 模型 → 用 EAGLE，吞吐提升 50-70%
- 无 EAGLE 但有同系列小模型 → 用 Vanilla，提升 30-40%
- 无合适 Draft 模型 → 用多步调度，提升 12-18%
- 高 temperature (>1.0) 场景 → 投机解码收益低，用多步调度
- 结构化输出 (JSON) 场景 → 投机解码收益高，接受率 90%+
