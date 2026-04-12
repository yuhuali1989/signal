---
title: "Direct Preference Optimization (DPO)"
paperTitle: "Direct Preference Optimization: Your Language Model is Secretly a Reward Model"
authors: "Rafailov et al. (Stanford)"
venue: "NeurIPS 2023"
category: "alignment"
date: "2026-04-11"
---

# 论文解读：DPO — 你的语言模型本身就是奖励模型

> 一个公式，干掉了 RLHF 中最复杂的奖励模型和 PPO 训练

## 一句话总结

DPO 证明了：**RLHF 中的奖励模型可以被解析地消除**，直接在偏好数据对上优化策略模型即可，无需显式训练 RM 和运行 PPO。

## 背景：RLHF 太复杂了

标准 RLHF 需要维护 4 个模型：

```
1. Policy Model (策略模型) — 正在训练的目标
2. Reference Model (参考模型) — 防止偏离太远的锚点
3. Reward Model (奖励模型) — 学习人类偏好打分
4. Critic Model (价值函数) — PPO 所需的基线估计
```

训练不稳定、超参敏感、工程复杂。

## DPO 的核心推导

DPO 的核心洞察：在 KL 约束的奖励最大化问题中，最优策略可以用奖励函数解析表达：

```
r(x, y) = β × log[π(y|x) / π_ref(y|x)] + β × log Z(x)

其中：
  r = 奖励函数
  π = 当前策略
  π_ref = 参考策略
  β = KL 惩罚系数
  Z(x) = 配分函数（与 y 无关）
```

将这个关系代入 Bradley-Terry 偏好模型，得到 DPO 的损失函数：

```python
# DPO Loss (PyTorch 伪代码)
def dpo_loss(pi_logps_w, pi_logps_l, ref_logps_w, ref_logps_l, beta=0.1):
    """
    pi_logps_w:  策略模型对 chosen 回答的 log prob
    pi_logps_l:  策略模型对 rejected 回答的 log prob
    ref_logps_w: 参考模型对 chosen 回答的 log prob
    ref_logps_l: 参考模型对 rejected 回答的 log prob
    """
    # 计算 log-ratio
    pi_ratio = pi_logps_w - pi_logps_l
    ref_ratio = ref_logps_w - ref_logps_l

    # DPO 目标：让 chosen 的概率比 rejected 更高
    logits = beta * (pi_ratio - ref_ratio)
    loss = -F.logsigmoid(logits).mean()
    return loss
```

## 优势分析

| 维度 | RLHF/PPO | DPO |
|------|----------|-----|
| 模型数量 | 4 个 | 2 个（Policy + Reference） |
| 显存占用 | 极高 | 减少约 50% |
| 训练稳定性 | 不稳定，超参敏感 | 稳定，和 SFT 一样简单 |
| 在线探索 | ✅ 可在线采样 | ❌ 离线数据 |
| 工程复杂度 | 非常高 | 很低 |

## 局限性

1. **离线数据依赖**: DPO 只能在已有的偏好对上训练，无法像 PPO 一样在线探索
2. **数据质量敏感**: 偏好数据的质量直接决定效果，噪声标注影响大
3. **数学/代码任务**: 需要在线探索的任务（如数学推理）表现弱于 PPO/GRPO
4. **分布偏移**: 训练过程中策略模型偏离参考模型太远时效果下降

## 后续演进

DPO 开启了一个重要的研究方向——**无 RM 的偏好优化**：

```
DPO (2023)    → 离线偏好对，去掉 RM
  ↓
IPO (2023)    → 修正 DPO 的 overfitting 问题
  ↓
KTO (2024)    → 只需要 thumbs up/down，不需要成对数据
  ↓
SimPO (2024)  → 连 Reference Model 都去掉
  ↓
GRPO (2024)   → 在线采样 + 组内相对排序，兼顾探索和简洁
  ↓
DAPO (2025)   → 修复 GRPO 的熵崩塌问题
```

## 关键结论

DPO 是对齐技术从"工程驱动"走向"理论驱动"的转折点。它证明了复杂的 RL 训练流程可以被优雅的数学推导简化为一个简单的分类损失。虽然 DPO 本身已被 GRPO 等方案部分超越，但它奠定的"无 RM 对齐"范式影响深远。

---

*本文由 Signal 知识平台 AI 智能体解读整理*
