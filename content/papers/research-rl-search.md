---
title: "ReSearch: 用强化学习教会 LLM 推理时搜索"
description: "ReSearch 提出用 RL 训练 LLM 在推理过程中主动调用搜索引擎，无需监督数据，QA 准确率超越 RAG 和 CoT 基线"
date: "2026-04-12"
tags: ["强化学习", "推理", "搜索", "RLVR", "Agent"]
type: "paper"
---

# ReSearch: Learning to Reason with Search for LLMs via Reinforcement Learning

## 论文基本信息

| 字段 | 内容 |
|------|------|
| **标题** | ReSearch: Learning to Reason with Search for LLMs via Reinforcement Learning |
| **作者** | Mingyang Chen, Tianpei Gu, Haoze Sun et al. |
| **机构** | 清华大学 / DAMO Academy |
| **发表** | arXiv 2503.19470, 2025.03 |
| **核心贡献** | 用 RL 训练 LLM 在推理过程中主动发起搜索查询，无需人工标注的搜索步骤数据 |

## 1. 问题与动机

现有的 RAG（Retrieval-Augmented Generation）系统存在根本性局限：

- **被动检索**：在用户提问后一次性检索，无法根据推理过程动态调整搜索策略
- **检索-推理割裂**：检索和推理是两个独立步骤，缺乏交互
- **复杂问题力不从心**：多跳推理（multi-hop）问题需要多次检索，传统 RAG 难以应对

ReSearch 的核心洞察：**让模型自己学会在推理过程中"何时搜索、搜什么"**，而不是人工设计检索策略。

## 2. 方法：RL 驱动的推理-搜索交织

### 2.1 训练框架

```
                    ┌──────────────────────────┐
                    │     RL 训练循环           │
                    │                          │
问题 q ─→ LLM 推理 ─→ 产生 <search>query</search> ─→ 搜索引擎返回结果
                    │          ↓               │
                    │   继续推理 + 可能再次搜索  │
                    │          ↓               │
                    │   产生最终答案            │
                    │          ↓               │
                    │   与 ground truth 对比    │
                    │          ↓               │
                    │   奖励信号 r ∈ {0, 1}     │
                    └──────────────────────────┘
```

关键设计：

1. **无监督搜索策略**：不提供"正确的搜索步骤"标注，只用最终答案正确性作为奖励
2. **特殊 token 标记**：用 `<search>...</search>` 标记搜索查询，`<result>...</result>` 包裹搜索结果
3. **多轮交互**：模型可以在一次推理中发起多次搜索

### 2.2 RL 训练细节

使用 GRPO（Group Relative Policy Optimization）作为 RL 算法：

$$\mathcal{L}_{\text{GRPO}} = -\mathbb{E}_{q \sim \mathcal{D}} \left[ \frac{1}{G} \sum_{i=1}^{G} \hat{A}_i \log \pi_\theta(o_i | q) \right]$$

奖励设计：

$$r(q, a) = \begin{cases} 1 & \text{if } a \text{ matches ground truth} \\ 0 & \text{otherwise} \end{cases}$$

$$\hat{A}_i = \frac{r_i - \text{mean}(r_{1:G})}{\text{std}(r_{1:G}) + \varepsilon}$$

**不对搜索行为本身给予奖励**——让模型自己学会搜索策略是 RL 的自发优化结果。

### 2.3 推理时的搜索行为

训练后，模型涌现出多种搜索策略：

```
问题: "谁发明了Transformer架构中使用的注意力机制？"

<think>
这个问题需要找到 Transformer 的发明者...
<search>Transformer attention mechanism inventor paper</search>
<result>
"Attention Is All You Need" was published in 2017 by Vaswani et al. at Google Brain...
</result>
好的，是 Ashish Vaswani 等人在 2017 年的论文中提出的。
但问题问的是注意力机制本身，而不是 Transformer...
注意力机制在 Transformer 之前就存在了。
<search>attention mechanism neural network first proposed</search>
<result>
Bahdanau et al. (2014) first proposed the attention mechanism for neural machine translation...
</result>
注意力机制最早由 Bahdanau 等人在 2014 年提出用于机器翻译。
</think>

注意力机制由 Bahdanau 等人在 2014 年首次提出。
```

模型学会了：
1. **分解复杂问题**：先搜索 Transformer，发现答案不够准确，再精细化搜索
2. **验证与修正**：搜索结果不完全匹配时，主动发起补充搜索
3. **适时停止**：信息足够时不再搜索，直接给出答案

## 3. 实验结果

### 3.1 多跳问答基准

| 方法 | HotpotQA (F1) | 2WikiMultiHop (F1) | MuSiQue (F1) |
|------|:---:|:---:|:---:|
| CoT (无搜索) | 38.2 | 32.1 | 18.7 |
| RAG (单次检索) | 52.4 | 48.3 | 31.2 |
| Self-RAG | 55.1 | 51.7 | 34.5 |
| IRCoT (交替推理-检索) | 57.8 | 54.2 | 36.1 |
| **ReSearch (RL)** | **63.7** | **60.5** | **42.3** |

ReSearch 在所有多跳 QA 基准上显著超越所有基线。

### 3.2 搜索行为分析

| 指标 | 简单问题 | 多跳问题 | 开放域问题 |
|------|---------|---------|-----------|
| 平均搜索次数 | 0.8 | 2.4 | 1.6 |
| 搜索查询质量 (NDCG) | 0.72 | 0.68 | 0.65 |
| 搜索对准确率的贡献 | +12% | +31% | +22% |

关键发现：模型自动学会了**按需搜索**——简单问题几乎不搜索，复杂多跳问题会发起多次搜索。

## 4. 对 AI Agent 的启示

ReSearch 的意义远超 QA 任务：

1. **工具使用的通用范式**：RL 可以教会模型"何时用工具、用什么工具"，不只是搜索
2. **与 MCP 的结合**：ReSearch 的 `<search>` 标签可以推广为任意 MCP 工具调用
3. **Agent 自主性**：不需要人工设计 Agent 的工具调用策略，RL 自动优化

## 5. 局限性与展望

- **训练成本**：RL 训练需要在线搜索交互，比纯 SFT 贵 5-10×
- **搜索引擎依赖**：训练和推理都需要搜索引擎 API
- **可扩展性**：可以推广到代码执行、数据库查询等其他工具

ReSearch 为"LLM 学会使用工具"提供了一个优雅的 RL 框架——不需要标注"正确的工具使用步骤"，只需要最终结果的正确性信号。
