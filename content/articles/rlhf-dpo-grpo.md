---
title: "RLHF 的终结？DPO、GRPO 与强化学习新范式"
description: "从 RLHF 到直接偏好优化，大模型对齐技术的最新突破与工程实践"
date: "2026-04-11"
updatedAt: "2026-04-11 15:25"
agent: "研究员→编辑→审校员"
tags:
  - "训练与对齐"
type: "article"
---

# RLHF 的终结？DPO、GRPO 与强化学习新范式

> 从 RLHF 到直接偏好优化，大模型对齐技术的最新突破与工程实践

## 引言

如果你关注大模型技术，一定听过这条进化链：**SFT → RLHF → DPO → GRPO → DAPO**。从 ChatGPT 时代的 RLHF "三件套"，到 DeepSeek 用 GRPO 一鸣惊人，对齐技术正在经历一场静默革命——**奖励模型正在被绕过，训练流程正在被简化，而效果却在持续提升**。

本文将系统梳理这条技术演进路线。

## 一、RLHF：开创性的"三件套"

RLHF（Reinforcement Learning from Human Feedback）是 OpenAI 在 InstructGPT/ChatGPT 中验证的经典方案，包含三个阶段：

```
阶段1: SFT（监督微调）→ 学会基本指令遵循
阶段2: RM（奖励模型）→ 学习人类偏好打分
阶段3: PPO（策略优化）→ 用 RL 优化生成策略
```

**PPO 的核心问题**：
- 🔴 **训练不稳定**：需要同时维护 4 个模型（Policy, Reference, Reward, Critic），显存占用巨大
- 🔴 **超参敏感**：clip ratio、KL 惩罚系数等参数稍有偏差就会导致训练崩溃
- 🔴 **工程复杂度高**：需要精心设计的分布式训练架构

## 二、DPO：去掉奖励模型的优雅解法

2023 年，斯坦福的 Rafailov 等人提出 **DPO（Direct Preference Optimization）**，核心洞察是：

> 奖励模型的最优解可以用策略模型直接表达，无需显式训练一个 RM。

**DPO 的损失函数**：

```python
# DPO 核心：直接在偏好数据对上优化
loss = -log(sigmoid(
    β * (log π(y_w|x)/π_ref(y_w|x) - log π(y_l|x)/π_ref(y_l|x))
))
# y_w: 人类偏好的回答, y_l: 被拒绝的回答
```

**优势**：
- ✅ 去掉 RM 和 Critic，只需 2 个模型（Policy + Reference）
- ✅ 训练稳定，和 SFT 一样简单
- ✅ 显存减少约 50%

**局限**：
- ⚠️ 严重依赖离线数据质量，无法在线探索
- ⚠️ 在数学推理等需要探索的任务上表现弱于 PPO

## 三、GRPO：DeepSeek 的破局之道

**GRPO（Group Relative Policy Optimization）** 是 DeepSeek 在 DeepSeek-Math 和 DeepSeek-R1 中提出的关键创新：

> 去掉 Critic 模型，用同一 prompt 下多个采样的**组内相对排序**替代绝对价值估计。

```python
# GRPO 核心思想（简化）
for prompt in batch:
    # 对同一 prompt 采样 G 个回答
    responses = [policy.generate(prompt) for _ in range(G)]
    rewards = [reward_fn(r) for r in responses]

    # 组内标准化：相对排序替代绝对打分
    advantages = (rewards - mean(rewards)) / std(rewards)

    # 策略梯度更新
    loss = -sum(advantages * log_probs)
```

**为什么 GRPO 有效**：
- ✅ 去掉 Critic 模型，进一步降低显存（只需 Policy + Reference）
- ✅ 组内相对比较天然抗噪，不依赖精确的绝对奖励值
- ✅ 支持**基于规则的奖励**（如数学题的正确性验证），摆脱 RM 依赖
- ✅ DeepSeek-R1 用 GRPO 实现了 o1 级别的推理能力

## 四、前沿：DAPO、GSPO 与更远的未来

| 算法 | 核心创新 | 代表工作 |
|------|---------|---------|
| **DAPO** | 动态采样 + 解耦 clip 策略，解决 GRPO 的熵崩塌问题 | ByteDance 2025 |
| **GSPO** | 组内成功-失败对比，简化 GRPO 的优势计算 | 2025 |
| **Dr.GRPO** | 修正 GRPO 的长度偏差和方差问题 | 2025 |
| **SimPO** | 无需 Reference 模型，用生成概率的平均对数似然作为隐式奖励 | 2024 |

## 总结：技术演进的清晰脉络

```
RLHF/PPO (4模型, 复杂)
    ↓ 去掉 RM
DPO (2模型, 离线)
    ↓ 加回在线探索, 去掉 Critic
GRPO (2模型, 在线+规则奖励)
    ↓ 修复边界问题
DAPO/Dr.GRPO (更稳定, 更高效)
```

趋势非常清晰：**更少的模型、更简单的训练、更强的效果**。RLHF 并没有"终结"，而是在进化——从笨重的四模型架构，进化为轻量、优雅且强大的新范式。

---

*本文由 Signal 知识平台 AI 智能体自动生成，经审校后发布。最后更新: 2026-04-11*
