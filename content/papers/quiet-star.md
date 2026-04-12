---
title: "Quiet-STaR: Language Models Can Teach Themselves to Think Before Speaking"
description: "论文精读：Quiet-STaR——让语言模型在每个 token 前学会「内心独白」的推理方法"
date: "2026-04-12"
updatedAt: "2026-04-12 01:00"
agent: "研究员→编辑→审校员"
tags:
  - "推理"
  - "思维链"
  - "Self-Teaching"
  - "Test-Time Compute"
type: "paper"
paper: "quiet-star"
arxivUrl: "https://arxiv.org/abs/2403.09629"
---

# Quiet-STaR: Language Models Can Teach Themselves to Think Before Speaking

> **论文信息**
> - 作者：Eric Zelikman, Georges Harik, Yijia Shao, Varuna Jayasiri, Nick Haber, Noah D. Goodman (Stanford)
> - 发表：COLM 2024
> - arXiv：[2403.09629](https://arxiv.org/abs/2403.09629)

## 一、核心贡献

Quiet-STaR 提出了一种让语言模型学会**在每个 token 生成前进行内部推理**的训练方法。与 Chain-of-Thought (CoT) 需要显式的推理过程不同，Quiet-STaR 的推理是"安静的"——不输出给用户，只在模型内部发生。

**核心思想**：如果模型在生成下一个 token 之前先"想一想"，预测质量会更好。

### 与相关工作的对比

| 方法 | 推理时机 | 推理可见性 | 训练方式 | 适用范围 |
|------|---------|----------|---------|---------|
| CoT Prompting | 提示时 | 可见（输出） | 无需训练 | 特定问题 |
| STaR | 问答时 | 可见（输出） | 自我改进循环 | QA 数据集 |
| **Quiet-STaR** | **每个 token** | **不可见（内部）** | **REINFORCE** | **所有文本** |
| DeepSeek-R1 | 生成前 | 可见（<think>） | GRPO | 推理任务 |

## 二、方法详解

### 2.1 算法流程

```
输入序列: "The cat sat on the ___"

传统 LM:
  P("mat" | "The cat sat on the") → 直接预测

Quiet-STaR:
  对每个位置 i，生成内部 rationale:
  
  Position 1: "The" → [think] "这是一个句子的开头..." [/think]
  Position 2: "cat" → [think] "主语是猫..." [/think]
  Position 3: "sat" → [think] "猫坐在什么上面呢..." [/think]
  Position 4: "on"  → [think] "介词后面通常接名词..." [/think]
  Position 5: "the" → [think] "猫通常坐在垫子上..." [/think]
  
  最终: 结合 rationale 预测 "mat" → 更准确！
```

### 2.2 三大技术挑战与解决方案

**挑战 1：如何在每个 token 位置高效生成 rationale？**

朴素方法：对序列中每个位置串行生成 rationale → $O(N \times T)$ 复杂度，不可行。

解决方案：**并行 rationale 生成**

```python
class QuietSTaR(nn.Module):
    def parallel_rationale_generation(self, hidden_states):
        """并行在所有位置生成 rationale"""
        batch_size, seq_len, hidden_dim = hidden_states.shape
        
        # 在每个位置注入 <start_thought> token
        thought_start = self.thought_start_embedding.expand(batch_size, seq_len, -1)
        thought_input = hidden_states + thought_start
        
        # 并行生成固定长度的 rationale (T tokens)
        rationale_tokens = []
        current = thought_input
        for t in range(self.thought_length):  # T steps
            # 所有位置并行 decode
            logits = self.lm_head(current)  # [B, N, V]
            next_token = logits.argmax(-1)   # [B, N]
            current = self.embed(next_token) # [B, N, D]
            rationale_tokens.append(next_token)
        
        # 结果: 每个位置都有一个 T-token 的 rationale
        return torch.stack(rationale_tokens, dim=2)  # [B, N, T]
```

**挑战 2：如何让 rationale 影响后续 token 的预测？**

解决方案：**混合头 (Mixing Head)**

```python
class MixingHead(nn.Module):
    """学习混合 "有推理" 和 "无推理" 的隐状态"""
    
    def __init__(self, hidden_dim):
        self.mix_weight = nn.Linear(2 * hidden_dim, 1)
    
    def forward(self, h_base, h_thought):
        """
        h_base: 原始隐状态 (不经过思考)
        h_thought: 经过 rationale 后的隐状态
        """
        # 学习一个 [0,1] 的混合权重
        concat = torch.cat([h_base, h_thought], dim=-1)
        alpha = torch.sigmoid(self.mix_weight(concat))
        
        # 加权混合
        h_mixed = alpha * h_thought + (1 - alpha) * h_base
        return h_mixed
```

关键设计：mixing weight 初始化为偏向 h_base（即"不思考"），让模型**逐渐学会何时需要思考**。

**挑战 3：如何训练？没有 rationale 的标注数据**

解决方案：**REINFORCE with 自我评估**

```python
def quiet_star_loss(model, input_ids):
    """Quiet-STaR 训练损失"""
    # 1. 生成 rationale (不用梯度)
    with torch.no_grad():
        rationales = model.parallel_rationale_generation(input_ids)
    
    # 2. 计算两种情况下的 log-likelihood
    # 有 rationale 的预测
    logp_with_thought = model.forward_with_rationale(input_ids, rationales)
    # 无 rationale 的预测 (基线)
    logp_without_thought = model.forward_base(input_ids)
    
    # 3. REINFORCE: rationale 的奖励 = 预测改进
    reward = logp_with_thought - logp_without_thought  # 正=有帮助
    
    # 4. 策略梯度更新 rationale 生成
    rationale_loss = -reward.detach() * model.rationale_log_probs
    
    # 5. 语言建模损失 (使用混合后的预测)
    lm_loss = -logp_with_thought.mean()
    
    return lm_loss + 0.1 * rationale_loss.mean()
```

### 2.3 训练细节

| 超参数 | 值 | 说明 |
|--------|---|------|
| 基础模型 | Mistral 7B | 开源 LLM |
| Rationale 长度 T | 8 tokens | 固定长度内部推理 |
| 训练数据 | OpenWebMath + C4 | 通用文本 |
| 学习率 | 1e-6 | 极小 LR 避免遗忘 |
| Mixing Head 初始化 | bias → 0 (偏向 base) | 渐进学习思考 |

## 三、实验结果

### 3.1 推理基准提升

| 基准 | Mistral 7B (base) | Quiet-STaR | 提升 |
|------|:---:|:---:|:---:|
| GSM8K (数学推理) | 36.3% | **47.2%** | +10.9% |
| CommonsenseQA | 72.8% | **76.1%** | +3.3% |
| ARC-Challenge | 52.4% | **55.8%** | +3.4% |
| 困惑度 (PPL) | 8.92 | **8.45** | -5.3% |

### 3.2 关键发现

1. **通用性**：在通用文本（非推理数据）上训练，推理能力自然涌现
2. **可解释性**：rationale 虽然不输出，但可以提取出来分析，发现模型确实在"思考"
3. **效率**：推理时增加约 30% 的计算量（生成 8 token rationale），但准确率提升显著
4. **选择性思考**：mixing weight 显示模型在简单 token 上倾向"不思考"，在关键位置（如数学运算、逻辑推理）才"深入思考"

### 3.3 Mixing Weight 分析

```
句子: "The square root of 144 is ___"

Position:   The  square  root  of  144  is  ___
Mix Weight: 0.1   0.2    0.3  0.1  0.6  0.3  0.9
                                    ↑         ↑
                        关键数字位置  →  最终推理位置
                        
模型学会了在关键位置投入更多"思考"！
```

## 四、与后续工作的关系

Quiet-STaR 的核心思想——**在生成前进行内部推理**——直接影响了后续多项重要工作：

```
Quiet-STaR (2024.03)
    ↓
├── o1 / o3 (OpenAI, 2024-2025)
│   隐式推理 + Test-Time Compute Scaling
│
├── DeepSeek-R1 (2025.01)
│   显式 <think> 推理 + GRPO 训练
│
├── Llama 4 MoT (2026.04)
│   多条并行推理链 + 路由选择
│
└── Test-Time Compute Scaling (2025)
    "推理时计算越多，性能越好" 的理论基础
```

## 五、局限性与思考

1. **固定长度 rationale**：T=8 可能不够灵活，不同问题需要不同长度的思考
2. **训练不稳定**：REINFORCE 高方差，需要精心调参
3. **推理开销**：每个 token 多生成 8 个 rationale token，吞吐降 30%
4. **可扩展性**：只在 7B 模型验证，更大模型的效果未知

## 六、一句话总结

> **Quiet-STaR 证明了：语言模型可以学会"先想再说"，而且这种内部推理能力可以从通用文本中自然涌现。**

---

*Signal 知识平台 · 论文精读 · 最后更新：2026-04-12*
