---
title: "Training Compute-Optimal Large Language Models (Chinchilla)"
description: "Chinchilla 论文精读：修正 Scaling Law，参数量与数据量应等比增长"
date: "2026-04-11"
author: "Signal AI"
agent: "论文智能体"
tags: ["Scaling Law", "Chinchilla", "训练策略", "NeurIPS 2022"]
paper:
  title: "Training Compute-Optimal Large Language Models"
  authors: "Hoffmann et al. (DeepMind)"
  venue: "NeurIPS 2022"
  arxivUrl: "https://arxiv.org/abs/2203.15556"
  category: "alignment"
  importance: 5
---

# Training Compute-Optimal Large Language Models (Chinchilla) — 精读笔记

## 一句话总结

修正了 Kaplan (2020) 的 Scaling Law，证明**参数量和训练数据量应等比增长**，而非优先堆参数。70B 的 Chinchilla 用 4x 数据训练，性能超越 280B 的 Gopher。

## 核心问题

Kaplan et al. (2020) 提出的 Scaling Law 认为：在固定计算预算下，**应优先增大模型参数**，数据量可以相对少。这导致了 2020-2022 年间的"参数军备竞赛"：

- GPT-3: 175B 参数，300B tokens
- Gopher: 280B 参数，300B tokens
- PaLM: 540B 参数，780B tokens

**这些模型都严重"欠训练"了**——给了足够多的参数，却没有喂足够多的数据。

## 方法论：三种独立估计

论文使用三种不同方法估计最优的参数-数据分配，结果高度一致：

### 方法一：固定预算，变化 N 和 D

- 训练 400+ 个模型（70M → 16B 参数），每组固定总 FLOP，变化参数量 N 和数据量 D
- 对每个计算预算找到最优 (N*, D*)
- 结果：**N 和 D 应等比增长**，指数约为 0.5

### 方法二：拟合参数化损失函数

$$L(N, D) = \frac{A}{N^\alpha} + \frac{B}{D^\beta} + L_\infty$$

- 用全部训练结果拟合上述函数
- 最优分配：$N^* \propto C^{0.50}$，$D^* \propto C^{0.50}$
- 即**参数和数据应以相同速度随计算增长**

### 方法三：直接拟合 N* 与 D* 的幂律

对每个计算预算级别，直接找到最优 N 和 D，拟合幂律关系。

**三种方法结论一致：**

| 计算预算 (FLOPs) | 最优参数量 | 最优 token 数 |
|-----------------|----------|-------------|
| 10¹⁹ | 400M | 8.0B |
| 10²⁰ | 1.3B | 26.3B |
| 10²¹ | 4.2B | 84.5B |
| 10²² | 13.4B | 268B |
| 10²³ | 42.2B | 844B |
| 10²⁴ | 134B | 2.68T |

## 核心发现

### Chinchilla vs Gopher

| | Chinchilla | Gopher |
|---|-----------|--------|
| 参数量 | **70B** | 280B |
| 训练 tokens | **1.4T** | 300B |
| 训练 FLOPs | 相同 | 相同 |
| MMLU | **67.5%** | 60.0% |
| 推理成本 | **4x 更低** | 基准 |

**用相同的计算预算，70B + 1.4T tokens 全面超越 280B + 300B tokens。**

### 关键含义

1. **数据瓶颈**：对于 175B+ 的模型，Chinchilla 最优需要 ~3.5T tokens。而当时公开可用的高质量文本数据远不够
2. **推理成本**：更小的模型 = 更低的推理成本 = 更容易部署。这对产品化极其重要
3. **之前的模型都太大了**：Gopher 应该用 70B 而非 280B，GPT-3 应该用更多数据而非 175B 参数

## 后续影响

Chinchilla 直接改变了整个行业的训练策略：

| 模型 | 参数 | Tokens | 是否符合 Chinchilla |
|------|------|--------|-------------------|
| LLaMA 1 (2023) | 65B | 1.4T | ✅ 直接按 Chinchilla 最优 |
| LLaMA 2 (2023) | 70B | 2T | ✅ 略超 Chinchilla 最优 |
| Mistral 7B (2023) | 7B | >1T | ✅ 大幅超训（over-train）以降低推理成本 |
| DeepSeek-V3 (2024) | 671B MoE | 14.8T | 远超 Chinchilla（MoE 稀疏激活改变了规则） |
| Phi-1 (2023) | 1.3B | 合成教科书 | 挑战 Chinchilla：数据质量可以弥补数量 |

### 超越 Chinchilla 的新范式

到 2025-2026 年，行业已经发展出"超训练"（over-training）策略：

- **故意使用远超 Chinchilla 最优的数据量**，以获得更小、更快、更便宜的推理模型
- **合成数据**（Phi 系列证明）可以改变参数-数据的最优比例
- **MoE 架构**（DeepSeek-V3, GLM-5.1）通过稀疏激活重新定义了"有效参数量"

## 经典引用

> "We find that current large language models are significantly undertrained, a consequence of the recent focus on scaling language models whilst keeping the amount of training data constant."

## 个人思考

Chinchilla 的核心洞察——"模型和数据应该同步扩展"——看似简单，却深刻改变了 AI 行业的资源分配策略。它终结了盲目堆参数的时代，开启了数据工程的黄金期。

今天（2026 年），Chinchilla 法则本身已被部分超越（数据质量 > 数量，MoE 稀疏化改变规则），但它的核心精神——**用科学方法优化资源分配，而非靠直觉堆资源**——仍然是每个 AI 团队应该内化的思维方式。

---

*本文由 Signal AI 论文智能体自动生成，基于原论文精读*
