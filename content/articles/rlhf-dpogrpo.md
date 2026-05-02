---
title: "RLHF 的终结？DPO、GRPO 与强化学习新范式"
description: "从 PPO 到 DPO 到 GRPO，对齐技术的演进链和未来方向"
date: "2026-05-02"
updatedAt: "2026-05-02 11:54"
agent: "研究员→编辑→审校员"
tags:
  - "RLHF"
  - "DPO"
  - "GRPO"
  - "对齐"
type: "article"
category: "训练与对齐"
---

# RLHF 的终结？DPO、GRPO 与强化学习新范式

## 引言：一场关于"对齐"的范式革命

2017 年，OpenAI 将人类反馈强化学习（RLHF）引入语言模型训练，此后它长期占据大模型对齐技术的核心地位。然而，随着 2023 年 DPO 论文横空出世、2025 年 DeepSeek-R1 以 GRPO 撼动推理模型格局，一个问题开始在研究社区蔓延：**RLHF 的时代，真的结束了吗？**

答案远比标题更复杂。与其说是"终结"，不如说是一场深刻的**范式分裂**——对齐任务走向了"无 RM 偏好学习"的轻量路线，而推理能力涌现则呼唤着"回归强化学习本质"的重型路线。理解这两条路线背后的数学逻辑，是把握当前大模型训练技术格局的关键。

---

## 一、RLHF 的辉煌与代价

经典 RLHF 流程分为三个阶段：

```
1. SFT  →  在高质量示范数据上做监督微调
2. RM   →  训练奖励模型，拟合人类偏好标注 (y_w ≻ y_l)
3. PPO  →  用 PPO 算法最大化奖励，同时施加 KL 惩罚防止偏离参考策略
```

奖励模型的训练目标是 Bradley-Terry 偏好模型的对数似然：

$$\mathcal{L}_{\text{RM}} = -\mathbb{E}_{(x, y_w, y_l) \sim \mathcal{D}} \left[\log \sigma\left(r_\phi(x, y_w) - r_\phi(x, y_l)\right)\right]$$

PPO 阶段在最大化期望奖励的同时，用 KL 散度约束策略偏移：

$$\max_{\pi_\theta} \mathbb{E}_{x \sim \mathcal{D},\, y \sim \pi_\theta} \left[r_\phi(x, y)\right] - \beta\, \mathbb{D}_{\text{KL}}\!\left[\pi_\theta \,\|\, \pi_{\text{ref}}\right]$$

这套框架确实有效，但工程代价极高：

| 痛点 | 具体表现 |
|------|----------|
| 训练不稳定 | PPO 需要精细调参，Actor/Critic 协同难度大 |
| 显存开销巨大 | 同时维护 4 个模型（策略、参考、奖励、Critic） |
| 奖励黑客 | 模型学会钻 RM 漏洞而非真正对齐人类意图 |
| 数据效率低 | 需要大量在线采样，标注成本高昂 |

---

## 二、DPO：把 RLHF 压缩成一个损失函数

2023 年，斯坦福团队在论文 *Direct Preference Optimization: Your Language Model is Secretly a Reward Model* 中提出了一个优雅的观察：**RLHF 的最优解存在闭合形式**。

在 KL 约束下，最优策略满足：

$$\pi^*(y \mid x) = \frac{1}{Z(x)}\, \pi_{\text{ref}}(y \mid x) \exp\!\left(\frac{r(x, y)}{\beta}\right)$$

对上式取对数变换，可以反解出奖励的隐式表达：

$$r(x, y) = \beta \log \frac{\pi^*(y \mid x)}{\pi_{\text{ref}}(y \mid x)} + \beta \log Z(x)$$

将此代入 Bradley-Terry 偏好模型（配分函数 $Z(x)$ 在做差时恰好消去），得到 **DPO 损失函数**：

$$\boxed{\mathcal{L}_{\text{DPO}} = -\mathbb{E}_{(x,\, y_w,\, y_l)} \left[\log \sigma\!\left(\beta \log \frac{\pi_\theta(y_w \mid x)}{\pi_{\text{ref}}(y_w \mid x)} - \beta \log \frac{\pi_\theta(y_l \mid x)}{\pi_{\text{ref}}(y_l \mid x)}\right)\right]}$$

这个推导的精妙之处在于：**奖励模型被隐式地编码进了策略模型本身**，整个训练流程从三阶段坍缩成一次监督学习。

```python
# DPO 损失的 PyTorch 实现示意
def dpo_loss(pi_logps_w, pi_logps_l, ref_logps_w, ref_logps_l, beta=0.1):
    """
    pi_logps_w:  当前策略在 chosen 回复上的对数概率之和
    pi_logps_l:  当前策略在 rejected 回复上的对数概率之和
    ref_logps_*: 参考模型对应的对数概率
    """
    log_ratio_w = pi_logps_w - ref_logps_w   # implicit reward for chosen
    log_ratio_l = pi_logps_l - ref_logps_l   # implicit reward for rejected
    
    logits = beta * (log_ratio_w - log_ratio_l)
    loss = -F.logsigmoid(logits).mean()
    return loss
```

### DPO 的局限性

DPO 并非银弹，它的弱点同样源自其设计假设：

1. **离线数据依赖**：DPO 在固定的偏好对上训练，无法利用策略迭代带来的在线探索增益。
2. **长度偏差**：模型倾向于通过拉伸 chosen 回复长度来放大对数概率差，而非真正提升质量。
3. **分布偏移脆弱**：当参考策略与当前策略差异过大时，隐式奖励估计失真。
4. **无法用于推理任务**：数学/代码等任务缺乏成对偏好数据，且正确性难以用人工标注的偏好对表达。

为解决长度偏差，**SimPO** 对对数概率做了长度归一化，并引入 margin $\gamma$：

$$\mathcal{L}_{\text{SimPO}} = -\mathbb{E}\!\left[\log \sigma\!\left(\frac{\beta}{|y_w|}\log\pi_\theta(y_w|x) - \frac{\beta}{|y_l|}\log\pi_\theta(y_l|x) - \gamma\right)\right]$$

---

## 三、GRPO：DeepSeek 的"去 Critic"强化学习

DPO 系列方法在对话对齐上表现优异，但对于需要**长链条推理**的任务（数学证明、代码生成、复杂问答），它们都面临根本性的局限——这类任务的奖励信号是稀疏的、结果导向的，无法简单表达为成对偏好。

DeepSeek 在训练 DeepSeek-R1 时，选择了回归强化学习本质，但对 PPO 的架构进行了关键简化，提出了 **GRPO（Group Relative Policy Optimization）**。

### 核心思想：用"组内相对排名"替代 Critic

PPO 的核心难题之一是 Critic 模型（价值函数）的训练——它需要一个与策略模型同等规模的神经网络来估计基线值，开销巨大且不稳定。

GRPO 的解法是：**对同一个问题 $q$，从旧策略采样 $G$ 个输出 $\{o_1, o_2, \ldots, o_G\}$，用组内奖励的均值作为基线**。

优势估计（Advantage）定义为：

$$\hat{A}_{i} = \frac{r_i - \text{mean}(\{r_1,\ldots,r_G\})}{\text{std}(\{r_1,\ldots,r_G\})}$$

完整的 GRPO 目标函数为：

$$\mathcal{L}_{\text{GRPO}} = -\frac{1}{G}\sum_{i=1}^{G} \frac{1}{|o_i|}\sum_{t=1}^{|o_i|} \left[\min\!\left(\rho_{i,t}\,\hat{A}_i,\; \text{clip}(\rho_{i,t}, 1\!-\!\epsilon, 1\!+\!\epsilon)\,\hat{A}_i\right) - \beta\,\mathbb{D}_{\text{KL}}[\pi_\theta \| \pi_{\text{ref}}]\right]$$

其中 $\rho_{i,t} = \dfrac{\pi_\theta(o_{i,t} \mid q, o_{i,<t})}{\pi_{\theta_{\text{old}}}(o_{i,t} \mid q, o_{i,<t})}$ 是重要性采样比率。

```python
# GRPO 优势计算的伪代码
def compute_grpo_advantages(rewards: list[float]) -> list[float]:
    """
    rewards: 同一 prompt 下 G 个采样输出的奖励列表
    返回归一化后的组内相对优势
    """
    rewards_tensor = torch.tensor(rewards, dtype=torch.float32)
    mean_r = rewards_tensor.mean()
    std_r  = rewards_tensor.std() + 1e-8   # 防止除零
    advantages = (rewards_tensor - mean_r) / std_r
    return advantages.tolist()
```

### GRPO 在推理任务中的关键设计

DeepSeek-R1 的奖励函数设计极为简洁，主要包含两类信号：

| 奖励类型 | 描述 | 实现方式 |
|----------|------|----------|
| **准确性奖励** | 答案是否正确 | 数学题用规则匹配；代码题用编译/测试执行 |
| **格式奖励** | 是否正确使用 `<think>` 标签 | 正则规则检查 |
| **长度惩罚**（可选）| 防止无效冗长思考 | 对超长输出施加负奖励 |

这种基于**可验证奖励（Verifiable Reward）**的设计，是 GRPO 能在推理任务上成功的核心——它完全绕开了奖励模型的训练，让"正确性"这一客观标准直接指导策略优化。

---

## 四、三大范式的横向对比

| 维度 | RLHF (PPO) | DPO 系列 | GRPO |
|------|-----------|---------|------|
| **核心思路** | 在线 RL + 奖励模型 | 偏好对监督学习 | 在线 RL + 组内基线 |
| **是否需要奖励模型** | ✅ 必须 | ❌ 不需要 | ⚠️ 可规则替代 |
| **是否需要 Critic** | ✅ 必须 | ❌ 不需要 | ❌ 不需要 |
| **数据形式** | 在线采样 + 人工标注 | 离线偏好对 `(y_w, y_l)` | 在线采样 + 可验证奖励 |
| **训练稳定性** | 较差，依赖调参 | 好 | 较好 |
| **适用任务** | 通用对话对齐 | 通用对话对齐 | 推理、数学、代码 |
| **显存开销** | 极高（4 模型） | 低（2 模型） | 中（2 模型 + 多次采样） |
| **代表模型** | InstructGPT, Claude 早期 | Llama-3 Instruct, Zephyr | DeepSeek-R1, Qwen3 |

---

## 五、当前格局：分裂，而非终结

站在 2025 年中期回望，大模型训练的后训练格局已经清晰地分化为**两个赛道**：

**赛道一：对话对齐（Alignment Track）**

DPO 及其变体（SimPO、ORPO、KTO）在此领域占据主导。数据飞轮逻辑是：收集人类偏好 → 离线训练 → 迭代发布。这里 RLHF 确实被大幅简化，但其背后的偏好建模哲学并未消亡。

**赛道二：推理能力（Reasoning Track）**

以 OpenAI o1/o3、DeepSeek-R1、Qwen-QwQ 为代表的推理模型，反而让强化学习**卷土重来**。GRPO、RLOO（REINFORCE Leave-One-Out）等算法重新成为前沿。这里的核心洞察是：

> **涌现式推理（emergent reasoning）需要探索，而探索是监督学习本质上无法提供的。**

模型必须通过在"错误尝试—获得惩罚—修正策略"的循环中，自主习得"先思考再回答"的元认知能力，这是任何离线数据集都无法直接教会的行为模式。

---

## 结语：强化学习的复兴

"RLHF 的终结"这一命题，本质上混淆了两个层面的讨论：**流程工程**上，三阶段的复杂管线确实被更简洁的方案取代；但**范式哲学**上，用奖励信号驱动策略优化这一 RL 内核，正在以 GRPO 等新形态迎来最强势的回归。

DPO 是一把剃刀，优雅地削去了对齐任务中的冗余；GRPO 是一台发动机，粗粝而有力地驱动着推理能力的涌现。**它们并非替代关系，而是针对不同问题的最优解**。

真正值得关注的下一个问题是：当推理能力足够强大之后，模型是否能够自我生成高质量的偏好数据，从而将这两条赛道重新合并？这或许才是"后 RLHF 时代"真正的终局命题。

---

*参考文献：Ziegler et al. (2019) · Christiano et al. (2017) · Rafailov et al. (2023) DPO · Meng et al. (2024) SimPO · DeepSeek-AI (2025) DeepSeek-R1 · Shao et al. (2024) DeepSeekMath/GRPO*