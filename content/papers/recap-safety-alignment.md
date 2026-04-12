---
title: "RECAP: Robust Safety Alignment via Counter-Aligned Prefilling"
description: "详细解读 RECAP 论文：通过对抗预填充的鲁棒安全对齐方法，教会推理模型从有缺陷的推理中学习正确的安全行为"
date: "2026-04-12"
updatedAt: "2026-04-12"
paper: "RECAP: Robust Safety Alignment via Counter-Aligned Prefilling"
authors: "Qwen Team (Alibaba)"
venue: "arXiv 2025 / NeurIPS 2025 Under Review"
arxivUrl: "https://arxiv.org/abs/2510.00938"
tags:
  - "安全对齐"
  - "RLHF"
  - "推理模型"
  - "Prompt Injection"
type: "paper"
---

# RECAP: 通过对抗预填充的鲁棒安全对齐

## 论文信息

| 字段 | 信息 |
|------|------|
| **标题** | RECAP: Robust Safety Alignment via Counter-Aligned Prefilling |
| **作者** | Qwen Team (Alibaba) |
| **会议** | arXiv 2025 / NeurIPS 2025 Under Review |
| **链接** | [arxiv.org/abs/2510.00938](https://arxiv.org/abs/2510.00938) |
| **一句话** | 教会大型推理模型在遇到有缺陷的推理链时仍能做出安全的行为 |

## 核心问题

大型推理模型（Large Reasoning Models, LRMs）如 DeepSeek-R1、o1 等在思维链（CoT）推理中展现了强大能力，但也暴露了新的安全风险：

1. **攻击者可以在 CoT 中注入有害推理**：通过精心构造的 prompt 让模型"说服自己"执行有害操作
2. **传统安全对齐方法（SFT/DPO/PPO）不够鲁棒**：在 CoT 推理场景下，模型的安全行为容易被绕过
3. **推理能力与安全性存在张力**：增强推理能力可能削弱安全对齐

## RECAP 方法

### 核心思想

RECAP 的关键洞察是：**与其只训练模型避免有害输出，不如训练模型从错误的推理中恢复正确的行为**。

类比：不是只教小孩"不要碰火"，而是教他们"如果手已经接近火了，如何立刻收回来"。

### 技术路线

```
Step 1: 生成对抗预填充 (Counter-Aligned Prefilling)
  对于每个有害请求 q:
  ├── 生成"有缺陷的推理链" CoT_bad = LLM("Here's why I should help: ...")
  └── 这些推理链会引导模型走向不安全的回答

Step 2: 构造训练数据
  ├── 正例: (q, CoT_bad) → 安全拒绝回答
  └── 含义: 即使推理链暗示"应该回答"，模型仍学会拒绝

Step 3: RL 训练
  ├── 奖励函数: R = R_safety(response) + λ · R_helpfulness(response)
  └── 安全奖励权重 > 有用性奖励权重
```

### 数学形式化

$$\mathcal{L}_{\text{RECAP}} = -\mathbb{E}_{q \sim \mathcal{D}_{\text{harmful}}} \left[ \sum_{t} \log \pi_\theta(a_t^{\text{safe}} | q, \text{CoT}_{\text{bad}}, a_{<t}) \right]$$

其中 $\text{CoT}_{\text{bad}}$ 是对抗预填充生成的"有缺陷推理链"，$a_t^{\text{safe}}$ 是安全的回答 token。

### RL 奖励设计

$$R(q, r) = \begin{cases} 
+1 & \text{if } r \text{ 安全拒绝有害请求} \\
-1 & \text{if } r \text{ 服从有害请求} \\
+0.5 & \text{if } r \text{ 有用地回答无害请求} \\
-0.5 & \text{if } r \text{ 过度拒绝无害请求}
\end{cases}$$

## 实验结果

### 安全性评测

| 模型 | 方法 | 直接攻击拒绝率 | CoT 注入拒绝率 | 过度拒绝率 |
|------|------|:---:|:---:|:---:|
| Qwen-72B | SFT | 95.2% | 62.3% | 12.1% |
| Qwen-72B | DPO | 96.8% | 71.5% | 15.3% |
| Qwen-72B | PPO | 97.1% | 74.2% | 11.8% |
| Qwen-72B | **RECAP** | **98.3%** | **91.7%** | **8.2%** |

关键发现：
- **CoT 注入拒绝率**提升 17.5%（vs PPO），这是最重要的指标
- **过度拒绝率**反而降低了 3.6%，说明模型区分了"真正有害"和"看起来敏感但无害"

### 推理能力保持

| 基准 | PPO | RECAP | 差异 |
|------|:---:|:---:|:---:|
| MATH-500 | 78.2% | 77.8% | -0.4% |
| GSM8K | 91.5% | 91.2% | -0.3% |
| HumanEval | 82.3% | 81.9% | -0.4% |

> RECAP 在大幅提升安全性的同时，推理能力损失 < 0.5%。

## 核心贡献

1. **首次系统性研究推理模型的 CoT 安全漏洞**：揭示了 LRM 在思维链推理中的新攻击面
2. **对抗预填充训练方法**：通过让模型从错误中学习，而非简单回避，显著提升鲁棒性
3. **安全-能力双赢**：RECAP 证明安全对齐不需要以牺牲推理能力为代价

## 对后续工作的影响

- **推理模型安全**：RECAP 为 o1/R1 等推理模型的安全对齐提供了新方向
- **Red-teaming 方法论**：CoT 注入成为安全评测的新标准攻击向量
- **RL 对齐**：奖励函数设计的"安全优先"原则可能被广泛采用

## 局限性

- 对抗预填充的生成质量影响训练效果
- 只在 Qwen 模型上验证，其他架构需要进一步测试
- CoT 攻击本身可能进化出更复杂的形式

---

*Signal 知识平台 · 论文精读*
