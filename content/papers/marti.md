---
title: "MARTI: 多 Agent LLM 系统的强化训练与推理框架"
paper: "MARTI: A Framework for Multi-Agent LLM Systems Reinforced Training and Inference"
authors: "Kaiyan Zhang, Runze Liu et al. (Tsinghua C3I)"
venue: "ICLR 2026"
arxiv: "https://arxiv.org/abs/2602.07848"
date: "2026-04-15"
tags:
  - "llm"
  - "强化学习"
  - "多Agent"
importance: 5
type: "paper-review"
---

# MARTI: 多 Agent LLM 系统的强化训练与推理框架

> ICLR 2026 | Kaiyan Zhang, Runze Liu et al. (Tsinghua C3I)

## 📌 一句话总结

清华 C3I 开源的首个**统一多 Agent LLM 训练框架**，支持 Agent 间消息传递的梯度回传、多 Agent GRPO 策略优化、Tree Search 推理扩展，解决了此前多 Agent 系统「推理强、训练弱」的核心矛盾。

## 🎯 要解决什么问题？

2025-2026 年，Multi-Agent LLM 系统（CrewAI/LangGraph/AutoGen/Microsoft Agent Framework）在推理层面已经成熟，但存在一个根本瓶颈：

**Agent 之间的协作策略全靠 Prompt Engineering，无法通过 RL 端到端优化。**

```
当前多 Agent 系统的训练困境:

方式 1: 每个 Agent 独立 SFT
  → Agent A 的输出不是 Agent B 训练数据的一部分
  → 协作效果完全依赖推理时的 Prompt
  → 无法从端到端奖励信号学习

方式 2: 每个 Agent 独立 RL (GRPO/DPO)  
  → 每个 Agent 只优化自己的局部奖励
  → 全局协作行为无法涌现
  → 类似：训练 11 个独立的足球运动员，不训练团队配合

MARTI 的方式: 多 Agent 联合 RL
  → Agent 间消息传递可导梯度
  → 全局奖励信号回传到每个 Agent
  → 协作策略通过 RL 自动涌现
```

## 🏗️ 核心架构

### 1. 可微分的 Agent 间通信

MARTI 的核心创新是让 Agent 间的消息传递变得**可微分**，从而允许梯度从下游 Agent 回传到上游 Agent：

```python
class DifferentiableAgentCommunication:
    """
    MARTI 的核心：可微分 Agent 通信
    
    传统方式: Agent A → text message → Agent B
      问题: text 是离散的，梯度无法回传
    
    MARTI 方式: Agent A → soft token embeddings → Agent B  
      优势: 连续表示，梯度可以回传
    """
    
    def forward(self, agent_a, agent_b, task_input):
        # Agent A 生成消息（保留连续表示）
        message_logits = agent_a.generate_logits(task_input)
        
        # Gumbel-Softmax 采样（可微分的离散采样）
        message_soft = F.gumbel_softmax(
            message_logits, tau=self.temperature, hard=False
        )
        
        # 将 soft tokens 转换为 embedding
        message_embedding = message_soft @ agent_a.embedding_matrix
        
        # Agent B 接收 embedding 作为输入的一部分
        output = agent_b.forward(
            input_embeds=torch.cat([
                agent_b.encode(task_input),
                message_embedding  # 可微分的消息
            ], dim=1)
        )
        
        return output  # 梯度可以从 output 回传到 agent_a
```

### 2. Multi-Agent GRPO（MA-GRPO）

将 DeepSeek-R1 的 GRPO 算法扩展到多 Agent 设置：

```
单 Agent GRPO (DeepSeek-R1):
  对同一问题采样 N 个回答 → 用正确性打分 → 组内标准化 → 策略梯度更新

Multi-Agent GRPO (MARTI):
  对同一任务采样 N 个 Agent 团队响应序列
  → 评估团队最终输出质量（全局奖励）
  → 信用分配：将全局奖励分解到每个 Agent 的贡献
  → 每个 Agent 用自己的信用分数做 GRPO 更新
```

**信用分配机制：**

```python
class MultiAgentCreditAssignment:
    """将全局奖励分配到每个 Agent"""
    
    def compute_credits(self, agents, trajectories, global_reward):
        credits = {}
        
        for agent in agents:
            # 方法 1: Shapley Value 近似（精确但慢）
            shapley = self.approximate_shapley(
                agent, agents, trajectories, global_reward
            )
            
            # 方法 2: Counterfactual 基线（快速近似）
            # 如果移除 agent 的消息，全局奖励下降多少？
            counterfactual_reward = self.evaluate_without_agent(
                agent, agents, trajectories
            )
            counterfactual_credit = global_reward - counterfactual_reward
            
            # 混合两种方法
            credits[agent.id] = (
                0.3 * shapley + 0.7 * counterfactual_credit
            )
        
        return credits
```

### 3. Multi-Agent Tree Search（MATS）

在推理时，扩展 Tree-of-Thought 到多 Agent 协作：

```
传统 Tree-of-Thought（单 Agent）:
  Agent → 分支 1 → 评分 → 选最优
           分支 2 → 评分
           分支 3 → 评分

MARTI Tree Search（多 Agent）:
  Agent A → 消息 1 → Agent B → 分支 1a → 最终评分
                                 分支 1b → 最终评分
             消息 2 → Agent B → 分支 2a → 最终评分
                                 分支 2b → 最终评分
  
  搜索空间 = 消息变体 × 响应变体
  Agent A 学习发送能让 Agent B 产生最优结果的消息
```

## 📊 实验结果

### 多 Agent 协作基准测试

| 任务 | 指标 | 独立 SFT | 独立 GRPO | CrewAI (Prompt) | **MARTI** |
|------|------|----------|-----------|-----------------|-----------|
| HotPotQA (2-Agent) | F1 | 62.3 | 68.5 | 71.2 | **78.9** |
| ALFWorld (3-Agent) | 成功率 | 45.2% | 52.8% | 58.1% | **71.5%** |
| SWE-bench (2-Agent) | Resolved | 38.2% | 42.5% | 45.8% | **52.1%** |
| WebArena (3-Agent) | 任务完成率 | 32.1% | 38.5% | 42.3% | **51.8%** |
| MATH (2-Agent, Critic) | 准确率 | 72.5% | 78.1% | 80.2% | **86.7%** |

**关键发现**：MARTI 在所有任务上显著超越 Prompt-based 协作（CrewAI），平均提升 +10.2%。

### 信用分配消融实验

| 信用分配方法 | HotPotQA F1 | 训练稳定性 |
|-------------|------------|-----------|
| 均分奖励 | 73.1 | ⚠️ 容易塌缩 |
| 仅 Shapley | 76.5 | ✅ 稳定但慢 (10x) |
| 仅 Counterfactual | 77.2 | ✅ 快速 |
| **混合 (0.3S + 0.7C)** | **78.9** | ✅ 最优 |

### 训练效率

| 框架 | 2-Agent 训练时间 (HotPotQA) | 3-Agent 训练时间 (ALFWorld) | GPU 需求 |
|------|---------------------------|---------------------------|---------|
| 独立 GRPO × N | 8h × 2 = 16h | 8h × 3 = 24h | 8×H100 |
| **MARTI** | **12h** | **20h** | 8×H100 |

联合训练的额外开销仅 ~50%，但性能提升显著。

## 🔍 关键技术分析

### Gumbel-Softmax 通信 vs 自然语言通信

| 维度 | Gumbel-Softmax (训练) | 自然语言 (推理) |
|------|---------------------|----------------|
| 可微分性 | ✅ 梯度可回传 | ❌ 离散 |
| 可解释性 | ⚠️ 中等 | ✅ 高 |
| 灵活性 | ⚠️ 固定长度 | ✅ 可变长度 |

**MARTI 的解决方案**：训练时用 Gumbel-Softmax，推理时切换为自然语言 + MATS。通过 KL 正则化确保两种模式的一致性。

### 与 RLHF/DPO/GRPO 的关系

```
RLHF → DPO → GRPO: 单 Agent 对齐的演进
  问题: 只优化单个 LLM 的输出质量

MARTI: 将 GRPO 扩展到多 Agent 设置
  核心区别: 
  - 奖励不仅依赖于单个 Agent 的输出
  - 还依赖于 Agent 间的协作质量
  - 信用分配解决了"谁贡献了多少"的问题
```

## 💡 工程落地启示

### 1. 多 Agent 编码系统

```
当前: Cursor/Copilot 单 Agent 编码
MARTI 启发: 专业化 Agent 团队
  - Agent A (架构师): 分析需求 → 输出设计方案
  - Agent B (开发者): 接收设计 → 编写代码
  - Agent C (审查者): 审查代码 → 反馈给 A 和 B
  
训练: 以 SWE-bench/PR merge 为全局奖励，MA-GRPO 训练
推理: MATS 搜索最优协作方案
```

### 2. 多 Agent RAG 系统

```
当前: 单 Agent 检索+生成
MARTI 启发:
  - Agent A (检索策略师): 决定搜索什么、用什么 query
  - Agent B (信息整合师): 汇总检索结果、去重去噪
  - Agent C (回答生成师): 基于整合结果生成最终答案

全局奖励 = 答案准确率 + 引用覆盖率 + 信息充分性
```

## ⚖️ 局限性

1. **训练复杂度**：Agent 数量增加时，信用分配的组合空间指数增长（>5 Agent 时 Shapley 近似不可靠）
2. **通信瓶颈**：Gumbel-Softmax 固定长度限制了复杂消息的表达
3. **部署复杂性**：多 Agent 系统的部署、监控、debug 比单 Agent 复杂得多
4. **基准局限**：现有多 Agent 基准（HotPotQA/ALFWorld）可能过于简单，不代表真实生产场景

## 📝 信号判断

MARTI 填补了多 Agent LLM 系统「推理强、训练弱」的核心空白。**将 RL 从单 Agent 扩展到多 Agent 是 2026 年 Agent 领域最重要的技术方向之一。**

关键趋势：
1. **训练方式**：从 Prompt Engineering 协作 → RL 端到端训练
2. **信用分配**：成为多 Agent 训练的核心研究问题
3. **搜索扩展**：MATS 证明推理时计算扩展在多 Agent 中同样有效
4. **开源生态**：MARTI 完全开源（MIT），降低多 Agent 训练门槛

---

*Signal 知识平台 · 论文精读 · ICLR 2026*
