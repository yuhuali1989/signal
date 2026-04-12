---
title: "Scaling LLM Test-Time Compute Optimally Can Be More Effective Than Scaling Model Parameters"
description: "推理时计算缩放的开创性研究：证明合理分配 Test-Time Compute 可以让小模型超越大 14 倍的模型"
date: "2026-04-11"
updatedAt: "2026-04-12 00:00"
tags:
  - "Test-Time Compute"
  - "推理优化"
  - "Scaling Law"
  - "DeepMind"
type: "paper"
---

# Scaling LLM Test-Time Compute Optimally

> **论文信息**
> - 作者: Snell, Lee, Xu, Kumar (Google DeepMind)
> - 会议: ICML 2025 (Oral)
> - arXiv: [2408.03314](https://arxiv.org/abs/2408.03314)
> - 重要度: ⭐⭐⭐⭐⭐

## 一、核心洞察：推理时间花在刀刃上

过去的 Scaling Law 关注的是**训练时**的计算：模型更大、数据更多、训练更久 → 性能更好。但这篇论文提出了一个关键问题：

> **在推理时增加计算量，能否替代训练时的模型扩大？**

答案是：**是的，但关键在于如何分配推理计算。**

```
传统 Scaling Law (Chinchilla):
  Performance ∝ f(Training Compute)
  → 更大的模型 + 更多的数据 = 更好的性能
  → 但训练成本固定（训练一次几百万美元）

Test-Time Compute Scaling:
  Performance ∝ f(Training Compute × Test-Time Compute)
  → 小模型 + 更多推理计算 > 大模型 + 少量推理计算
  → 推理计算可以按需分配（简单问题少算，难问题多算）
```

## 二、两种推理计算策略

论文系统性地比较了两种增加推理计算的方式：

### 策略 1: Verifier-Based (生成 + 验证)

```
思路: 生成 N 个候选答案，用 Verifier 选最好的

Pipeline:
  问题 → LLM 生成 N 个答案 → Verifier 打分 → 选最高分
  
  生成方式:
  a) Best-of-N: 独立采样 N 次
     计算量: O(N × 生成长度)
     问题: 候选答案之间没有信息交换
     
  b) Beam Search + Verifier:
     每步生成 K 个 token，Verifier 评估局部分数
     保留 Top-B 条路径继续扩展
     计算量: O(B × K × 生成长度)
     优势: 局部信息指导搜索方向

Verifier 类型:
  Process Reward Model (PRM): 每步给分 → 更精确但训练成本高
  Outcome Reward Model (ORM): 只对最终答案给分 → 简单但信号稀疏
```

### 策略 2: Revision-Based (修改 + 迭代)

```
思路: 让模型生成初始答案后，反复修改

Pipeline:
  问题 → 初始答案 → "检查并改进" → 修改后答案 → 再检查 → ...
  
  方法:
  a) Sequential Revision:
     Round 1: 生成初始答案
     Round 2: "请检查上面的答案是否正确并修改"
     Round 3: "请再次检查..."
     ...
     计算量: O(R × 生成长度)  (R 轮修改)
     
  b) Chain-of-Thought Revision:
     强制模型在修改前先分析错误原因
     "你之前的答案是 X。请分析可能的错误，然后给出修改后的答案。"
```

## 三、核心发现：最优分配策略

论文最重要的发现是：**最优的推理计算分配策略取决于问题难度和基础模型能力**：

```
发现 1: 问题难度决定最优策略

  简单问题 (模型已知领域):
    → Verifier-Based 效率更高
    → Best-of-5 就足够
    → 计算量: 5x
    
  中等问题 (模型有时出错):
    → Beam Search + PRM 最优
    → 计算量: 10-50x
    
  困难问题 (模型经常出错):
    → Revision + Beam Search 组合
    → 计算量: 50-200x
    → 但收益递减明显

发现 2: 小模型 + 最优推理 > 大模型 + 基础推理

  Llama 8B + 最优 Test-Time Compute (200x 推理计算)
  vs
  Llama 70B + 直接推理 (1x 推理计算)
  
  在 MATH 数据集上:
    Llama 8B + 200x:  82.3% ← 胜出
    Llama 70B + 1x:   76.5%
    
  意义: 花 $20 推理计算 > 花 $2M 训练更大模型
  前提: 需要好的 Verifier (PRM)
```

### 计算-性能曲线

```
性能
  ↑
  │           ╭─── Beam Search + PRM (最佳)
  │        ╭──╯
  │     ╭──╯
  │  ╭──╯
  │╭─╯                    ╭─── Best-of-N
  │╱                   ╭──╯
  │                 ╭──╯
  │              ╭──╯
  │           ╭──╯          ╭─── Sequential Revision
  │        ╭──╯          ╭──╯
  │     ╭──╯          ╭──╯
  ├──╯─╯──────────╯──────────→ 推理计算量 (FLOPs)
  1x    5x    10x    50x    200x
  
关键观察:
  - Beam Search + PRM 在所有计算预算下都最优
  - Best-of-N 简单但效率低（线性增长）
  - Revision 在低计算量时效果差（需要足够多轮才有效）
  - 所有方法都有收益递减（> 200x 后增益很小）
```

## 四、Process Reward Model (PRM) 的关键作用

PRM 是整个框架中最重要的组件——它决定了推理计算能否被有效利用：

```python
# PRM vs ORM 对比

# ORM (Outcome Reward Model):
#   输入: 完整的问题 + 完整的答案
#   输出: 一个分数 (这个答案正确的概率)
#   问题: 无法指导搜索过程（只能事后评判）

# PRM (Process Reward Model):
#   输入: 问题 + 部分推理过程 (到第 k 步)
#   输出: 一个分数 (到这一步为止推理正确的概率)
#   优势: 可以在每一步指导 Beam Search 的方向

class ProcessRewardModel:
    def score_step(self, question, reasoning_so_far, next_step):
        """
        评估下一步推理的质量
        
        示例:
          question: "求 2^10 的值"
          reasoning_so_far: "2^10 = 2 × 2^9 = 2 × 512"
          next_step: "= 1024"
          → score: 0.95 (正确的推理步骤)
          
          next_step: "= 1048"
          → score: 0.05 (错误的推理步骤)
        """
        return self.model(question, reasoning_so_far, next_step)

# PRM 训练数据:
# 需要细粒度的步骤级标注（比 ORM 贵得多）
# OpenAI PRM800K: 80 万道数学题的步骤级正确性标注
# 替代方案: Monte Carlo rollout 自动标注
#   每步做 N 次 rollout → 最终正确率作为该步分数
```

## 五、与 o1/o3 的联系

这篇论文直接启发了 OpenAI o1/o3 系列模型的设计：

```
论文发现 → o1/o3 的实现:

1. "推理时多思考" → o1 的长 Chain-of-Thought
   论文: Revision 可以改进答案
   o1:   在回答前先进行长时间内部推理

2. "Verifier 指导搜索" → o1 的内部 reward model
   论文: PRM 指导 Beam Search
   o1:   训练时 RLHF 强化 "good reasoning"

3. "计算量按难度分配" → o3 的 compute levels
   论文: 简单问题少算，难问题多算
   o3:   Low/Medium/High 三档推理强度

4. "小模型+多推理 > 大模型+少推理"
   → DeepSeek R1 的设计哲学
   R1:   中等大小模型 + GRPO 强化推理能力
```

## 六、实验细节

### 数据集与模型

```
数据集:
  - MATH (竞赛级数学, 5000 题)
  - GSM8K (小学数学, 8500 题)
  - MMLU-STEM (理科选择题)

模型:
  - PaLM 2-S (小模型, ~8B)
  - PaLM 2-L (大模型, ~70B)

Verifier:
  - PRM: 在 PRM800K 上微调 PaLM 2
  - ORM: 在最终答案标签上微调
```

### 关键实验结果

```
MATH 数据集 (5-shot):

| 方法 | PaLM 2-S | PaLM 2-L |
|------|----------|----------|
| Greedy (1x) | 52.3% | 76.5% |
| Best-of-64 + ORM | 68.1% | 81.2% |
| Best-of-64 + PRM | 73.5% | 83.8% |
| Beam Search + PRM | 78.2% | 85.1% |
| **Optimal Allocation** | **82.3%** | **86.7%** |

关键对比:
  PaLM 2-S + Optimal (200x compute): 82.3%
  PaLM 2-L + Greedy (1x compute):    76.5%
  
  → 小模型 + 最优推理 超越 14x 大的模型 + 基础推理
  → 但注意: 推理成本是 200x（对于 8B 模型仍然可接受）
```

## 七、实践意义

```
对工程师的启示:

1. 不要盲目选最大的模型
   如果场景允许更多推理时间（非实时），小模型+多推理更划算
   
2. 投资训练 PRM
   PRM 是杠杆效应最大的组件
   好的 PRM 让所有推理策略都更有效
   
3. 根据问题难度调整
   简单问题: 直接回答 (1x)
   中等问题: Best-of-8 + PRM (8x)
   困难问题: Beam Search + PRM (64x)
   
4. 推理成本的新思考
   传统: 成本 = 模型大小 × 请求数
   新: 成本 = 模型大小 × 推理强度 × 请求数
   → 需要动态推理预算管理
```

## 八、论文贡献总结

1. **首次系统性研究** Test-Time Compute 的最优分配策略
2. **证明** 推理时计算在某些条件下可以替代模型参数扩大
3. **量化** 不同策略在不同问题难度下的效率差异
4. **提出** difficulty-aware 的自适应推理计算分配框架
5. **直接启发** o1/o3、DeepSeek R1 等推理增强模型的设计

---

*Signal 知识平台 · 论文精读 · 推理优化*
