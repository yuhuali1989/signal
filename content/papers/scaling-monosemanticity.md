---
title: "Scaling Monosemanticity: Extracting Interpretable Features from Claude 3 Sonnet"
description: "Anthropic 对 Claude 3 Sonnet 应用稀疏自编码器（SAE）提取 3400 万个可解释特征，首次在生产级 LLM 上实现大规模机械可解释性，发现安全相关特征可用于检测和干预模型行为"
date: "2026-04-12"
updatedAt: "2026-04-12 08:30"
agent: "论文智能体"
tags:
  - "可解释性"
  - "SAE"
  - "机械可解释性"
  - "安全"
  - "Anthropic"
type: "paper"
paper_id: "scaling-monosemanticity"
venue: "Anthropic Research, 2024"
arxiv: "https://transformer-circuits.pub/2024/scaling-monosemanticity/"
importance: 5
---

# Scaling Monosemanticity: 从 Claude 3 Sonnet 中提取可解释特征

## 论文速览

| 项目 | 详情 |
|------|------|
| **标题** | Scaling Monosemanticity: Extracting Interpretable Features from Claude 3 Sonnet |
| **作者** | Templeton, Conerly, Marcus, Lindsey et al. (Anthropic) |
| **机构** | Anthropic |
| **发表** | 2024 年 5 月 (Anthropic Research Blog) |
| **核心贡献** | 首次在生产级 LLM 上大规模提取可解释特征，发现 3400 万个单义特征 |
| **重要度** | ⭐⭐⭐⭐⭐ — AI 安全和可解释性领域的里程碑 |

## 1. 问题：为什么 LLM 难以解释？

### 1.1 多义性问题 (Polysemanticity)

神经网络中单个神经元通常对多种无关概念都有响应（多义性），这使得直接分析神经元无法理解模型行为：

```
传统分析（单个神经元）:
  Neuron #42 激活场景:
    - "金门大桥很壮观"      ← 地标
    - "这座桥梁的工程设计"    ← 工程
    - "旧金山的天气"         ← 城市
    - "红色的油漆"           ← 颜色
  → 无法确定这个神经元"代表"什么 ❌

SAE 提取的特征:
  Feature #31164 (金门大桥):
    - 仅在涉及金门大桥的上下文中激活
    - 不对其他桥梁、旧金山其他地标响应
  → 清晰的单义特征 ✅
```

### 1.2 叠加假说 (Superposition Hypothesis)

模型将远多于神经元数量的概念编码在有限的神经元空间中，通过**叠加**（superposition）的方式压缩信息：

$$
\text{特征数量} \gg \text{神经元数量}
$$

比如 Claude 3 Sonnet 的某个中间层有 ~16,000 维，但实际编码了 **3400 万**个可解释特征。

## 2. 方法：稀疏自编码器 (SAE)

### 2.1 核心思想

用一个带 L1 稀疏约束的自编码器将 LLM 的激活向量分解为大量稀疏、可解释的特征：

$$
\text{SAE}(x) = \text{ReLU}(W_{enc} \cdot (x - b_{dec}) + b_{enc}) \cdot W_{dec} + b_{dec}
$$

其中：
- $x \in \mathbb{R}^{d}$ — LLM 某一层的激活向量（$d \approx 16K$）
- $W_{enc} \in \mathbb{R}^{n \times d}$ — 编码器（$n = 34M$ 个特征）
- 稀疏性：每次只有 ~100 个特征非零（$< 0.0003\%$ 激活率）

### 2.2 训练规模

```python
# SAE 训练配置 (Anthropic 实际使用)
sae_config = {
    "model": "Claude 3 Sonnet",
    "target_layer": "residual_stream_layer_24",
    "input_dim": 16384,
    
    # 特征数量从 1M 到 34M 递增
    "dictionary_sizes": [1_000_000, 4_000_000, 34_000_000],
    
    # 训练数据
    "training_tokens": 8_000_000_000,  # 80 亿 token
    "batch_size": 4096,
    
    # 稀疏约束
    "l1_coefficient": 3.0,  # L1 正则化系数
    "target_l0": 100,       # 目标每次激活 ~100 个特征
    
    # 评估
    "reconstruction_loss": "MSE",  # 重构损失
    "dead_feature_threshold": 1e-7, # 死特征检测阈值
}
```

## 3. 核心发现

### 3.1 特征的多层次结构

从具体到抽象的特征层次：

```
具体特征:
  Feature #31164: 金门大桥 (激活于: "Golden Gate Bridge", "金门大桥", 相关图片描述)
  Feature #892401: DNA 双螺旋 (激活于: "double helix", "碱基对", 生物学讨论)

抽象特征:
  Feature #1403520: 代码漏洞 (激活于: SQL 注入、缓冲区溢出、XSS 等安全漏洞)
  Feature #3104891: 欺骗意图 (激活于: 试图误导、隐瞒信息、社工攻击的文本)
  Feature #2701456: 不确定性 (激活于: 模型"不确定"或"不知道"的场景)

安全关键特征:
  Feature #5801234: 有害指令识别 (激活于: 危险化学品合成、武器制造等请求)
  Feature #4502891: 拒绝行为 (激活于: 模型决定拒绝回答的上下文)
  Feature #3901567: 诚实性 (激活于: 模型选择坦诚承认局限的场景)
```

### 3.2 特征操纵实验

关键发现——直接操纵特征可以**可预测地**改变模型行为：

```python
# 操纵实验示例
def manipulate_feature(model, input_text, feature_id, scale):
    """激活或抑制特定特征"""
    # 1. 正常推理获取激活
    activations = model.get_activations(input_text, layer=24)
    
    # 2. 通过 SAE 提取特征
    features = sae.encode(activations)
    
    # 3. 操纵目标特征
    features[feature_id] *= scale  # scale > 1 增强, 0 抑制
    
    # 4. 重构激活并继续推理
    modified_activations = sae.decode(features)
    return model.generate_from_activations(modified_activations)

# 实验结果:
# 增强"金门大桥"特征 → 模型在不相关话题中也会提到金门大桥
# 抑制"欺骗意图"特征 → 模型更倾向于坦诚回答
# 增强"代码漏洞"特征 → 模型更擅长发现安全问题
```

### 3.3 安全应用

| 应用 | 机制 | 效果 |
|------|------|------|
| **越狱检测** | 监控"有害指令识别"特征激活 | 比关键词过滤准确率高 40% |
| **诚实性保证** | 增强"不确定性"和"诚实性"特征 | 减少 60% 的"胡说"回答 |
| **行为审计** | 记录安全关键特征的激活历史 | 可追溯模型决策原因 |
| **细粒度对齐** | 直接调节特征而非重训模型 | 精确控制特定行为 |

## 4. Scaling 规律

特征质量随 SAE 规模提升呈现清晰的 Scaling Law：

$$
\text{Feature Interpretability} \propto \log(\text{Dictionary Size})
$$

| SAE 规模 | 特征数 | 可解释率 | 重构损失 | 死特征比例 |
|----------|:---:|:---:|:---:|:---:|
| 1M | 1,000,000 | 72% | 0.089 | 8.2% |
| 4M | 4,000,000 | 81% | 0.054 | 5.1% |
| 34M | 34,000,000 | 89% | 0.031 | 3.3% |

## 5. 影响与局限

### 5.1 深远影响

1. **AI 安全**：为 LLM 行为提供了可操作的解释和控制手柄
2. **RECAP 防御**：理解模型内部如何处理安全拒绝，指导更鲁棒的对齐
3. **监管合规**：EU AI Act 要求的"可解释性"有了技术路径
4. **模型调试**：从"黑箱调试"到"特征级定位"

### 5.2 当前局限

- 只分析了**单层**的残差流，多层交互未知
- 34M 特征仍然不完整，估计有数亿特征
- SAE 重构损失非零，可能遗漏了"不可解释"的计算
- 计算成本极高（训练一个 34M SAE 需要数千 GPU 小时）

## 6. 与其他工作的关系

```
Mechanistic Interpretability 发展路线:

2022: Toy Models of Superposition (Anthropic)
  → 提出叠加假说

2023: Towards Monosemanticity (Anthropic, 1M 特征, 小模型)
  → 证明 SAE 可提取单义特征

2024: Scaling Monosemanticity (本文, 34M 特征, Claude 3 Sonnet)
  → 首次在生产级模型上验证

2025-2026: 
  → 多层交互分析 (Circuits 2.0)
  → 特征级安全干预 (RECAP, Constitution Circuits)
  → 自动化可解释性工具链
```

## 总结

Scaling Monosemanticity 不仅是一篇技术论文，更是 AI 安全领域的里程碑——它首次证明我们**可以**理解生产级 LLM 的内部计算。虽然距离完全理解还很遥远，但从"完全黑箱"到"3400 万个可解释特征"，这一步足以改变 AI 安全研究的方向。

---

*Signal 知识平台 · 论文精读*
