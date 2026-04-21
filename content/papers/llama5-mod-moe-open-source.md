---
title: "Llama 5: Open-Source Dense and MoE Models with Mixture-of-Depths"
authors: "Meta AI Team"
venue: "arXiv 2026"
date: "2026-04-21"
tags: ["LLM", "开源模型", "MoE", "Mixture-of-Depths", "推理优化", "Scaling Law"]
tldr: "Meta 发布 Llama 5 系列（405B Dense + 1.2T MoE），首次引入 Mixture-of-Depths 动态层跳过，MMLU-Pro 93.1% 全面超越所有闭源模型，标志着开源 LLM 进入无条件领先时代。"
importance: 5
---

# Llama 5: Open-Source Dense and MoE Models with Mixture-of-Depths

## 一句话总结（TL;DR）

Meta 发布 Llama 5 系列（405B Dense + 1.2T MoE），首次引入 **Mixture-of-Depths（MoD）** 动态层跳过技术，在 MMLU-Pro 93.1% 登顶所有模型，推理速度提升 40%，Apache 2.0 完全开源，标志着开源 LLM 首次在综合能力上全面超越所有闭源模型。

## 研究背景与动机

### 开源 vs 闭源的差距在缩小

从 Llama 1（2023）到 Llama 4（2025），开源模型与闭源模型的差距持续缩小：

| 时间 | 开源最强 | 闭源最强 | MMLU-Pro 差距 |
|------|---------|---------|-------------|
| 2023 | Llama 2 70B | GPT-4 | -25% |
| 2024 | Llama 3 405B | GPT-4o | -8% |
| 2025 | Qwen3-Max 320B | Claude Opus 4.6 | -1.9% |
| 2026 | **Llama 5 MoE 1.2T** | GPT-5.5 | **+1.6%** ✅ |

### MoE 的效率瓶颈

虽然 MoE 通过稀疏激活大幅降低了计算量，但仍存在两个效率瓶颈：

1. **层级冗余**：并非所有 Transformer 层对每个 token 都同等重要，简单 token 可能只需要少数层处理
2. **Expert 负载不均**：Top-K 路由导致部分专家过载，其他专家闲置

Llama 5 通过 Mixture-of-Depths 同时解决这两个问题。

## 核心方法

### Mixture-of-Depths（MoD）

MoD 的核心思想：**让每个 token 自主决定跳过哪些 Transformer 层**。

#### 形式化定义

给定 $L$ 层 Transformer，对于输入 token $x_t$ 在第 $l$ 层：

$$g_l(x_t) = \sigma(W_l^{route} \cdot \text{mean}(x_t) + b_l)$$

其中 $g_l(x_t) \in [0, 1]$ 是第 $l$ 层的「信息增益」预测值。

层执行决策：

$$\hat{x}_t^{l+1} = \begin{cases} f_l^{MoE}(x_t^l) & \text{if } g_l(x_t) > \tau \\ x_t^l & \text{if } g_l(x_t) \leq \tau \end{cases}$$

其中 $\tau$ 是跳过阈值（默认 0.3），$f_l^{MoE}$ 是第 $l$ 层的 MoE 前馈网络。

#### 训练策略

MoD Router 的训练使用 **Gumbel-Sigmoid** 保持可微性：

$$\tilde{g}_l = \sigma\left(\frac{\log g_l - \log(1-g_l) + G}{\tau_{temp}}\right)$$

其中 $G \sim \text{Gumbel}(0, 1)$，$\tau_{temp}$ 是温度参数（从 1.0 退火到 0.1）。

损失函数增加层利用率正则项，防止所有层被跳过或全部执行：

$$\mathcal{L}_{total} = \mathcal{L}_{LM} + \lambda \sum_{l=1}^{L} \left(\bar{g}_l - \rho\right)^2$$

其中 $\bar{g}_l$ 是第 $l$ 层的平均激活率，$\rho$ 是目标激活率（默认 0.65）。

```python
# MoD 训练损失计算
def mod_loss(lm_loss, gate_values, target_rate=0.65, lambda_reg=0.01):
    """
    gate_values: [num_layers, batch_size] - 每层每个样本的门控值
    """
    # 每层平均激活率
    layer_rates = gate_values.mean(dim=1)  # [num_layers]

    # 利用率正则：鼓励每层激活率接近目标
    utilization_loss = ((layer_rates - target_rate) ** 2).sum()

    return lm_loss + lambda_reg * utilization_loss
```

### 128 专家 MoE 架构

Llama 5 MoE 采用 128 专家 / 16 激活的配置：

- **Expert Granularity**：每个专家约 9.4B 参数（总 1.2T / 128），比 DeepSeek-V4 的 7B 更大
- **Shared Expert**：2 个共享专家始终激活，处理通用知识
- **Load Balancing**：改进的 Auxiliary Loss + Expert Choice 混合路由

## 关键实验结果

### 主要基准对比

| 基准 | Llama 5 MoE | Llama 5 Dense | GPT-5.5 | Claude Opus 4.6 | Qwen3-Max | DeepSeek-V4 |
|------|-------------|---------------|---------|-----------------|-----------|-------------|
| MMLU-Pro | **93.1** | 90.8 | 91.5 | 89.3 | 91.2 | 90.5 |
| GPQA Diamond | **72.4** | 68.9 | 70.1 | 67.3 | 69.5 | 68.2 |
| AIME 2026 | **95.3** | 91.7 | 93.8 | 90.1 | 92.1 | 91.3 |
| SWE-bench Verified | 84.7 | 81.2 | **89.2** | 79.8 | 78.5 | 82.1 |
| HumanEval+ | 97.8 | 96.1 | **98.6** | 95.2 | 94.8 | 96.5 |
| LiveBench (Apr 2026) | **89.2** | 85.6 | 87.3 | 84.1 | 86.7 | 85.9 |

### MoD 消融实验

| 配置 | MMLU-Pro | 推理速度 (tok/s) | 显存 |
|------|---------|----------------|------|
| 全层执行（无 MoD） | 93.3 | 42 | 320GB |
| MoD τ=0.5（跳 25% 层） | 93.2 | 51 | 310GB |
| MoD τ=0.3（跳 35% 层） | **93.1** | **59** | 295GB |
| MoD τ=0.1（跳 50% 层） | 92.4 | 68 | 275GB |

> τ=0.3 是最优平衡点：精度仅损失 0.2%，速度提升 40%。

### 训练效率

| 指标 | Llama 5 MoE | DeepSeek-V4 | Qwen3-Max |
|------|-------------|-------------|-----------|
| 训练数据 | 30T tokens | 25T tokens | 20T tokens |
| GPU 集群 | 65,536 × H200 | 50,000 × H100 | 30,000 × H100 |
| 训练时间 | 42 天 | 55 天 | 38 天 |
| 估算成本 | ~$180M | ~$150M | ~$80M |
| MFU | 58% | 52% | 55% |

## 创新点分析

### 与前人工作的区别

1. **vs DeepSeek-V4 MLA**：DeepSeek 通过 Multi-Latent Attention 压缩 KV Cache（96% 压缩），Llama 5 通过 MoD 减少计算层数（35% 跳过），两者正交可叠加
2. **vs Early Exit**：传统 Early Exit 在某层直接输出，后续层全部跳过；MoD 允许非连续跳过（如跳过第 3、7、15 层但执行第 20 层），更灵活
3. **vs Mixture-of-Experts**：MoE 在每层内选择专家（水平稀疏），MoD 在层间选择是否执行（垂直稀疏），Llama 5 同时使用两者实现「3D 稀疏」

### 关键洞察

论文发现不同类型的 token 有截然不同的层利用模式：

- **功能词**（the, is, of）：平均只需 40% 的层
- **实体名词**（Python, Transformer）：需要 65% 的层
- **推理 token**（therefore, because）：需要 85% 的层
- **代码 token**：需要 90%+ 的层

这解释了为什么 MoD 在代码任务（SWE-bench）上的加速比低于通用任务。

## 局限性与未来方向

1. **代码任务仍落后 GPT-5.5**：SWE-bench 84.7% vs 89.2%，可能与 OpenAI 的专项代码训练数据有关
2. **MoD Router 开销**：虽然 Router 参数量 < 0.1%，但在极短序列上 Router 的固定开销不可忽略
3. **长上下文能力**：512K 上下文虽然实用，但落后于 Qwen3-Max 的 1M
4. **安全对齐**：Apache 2.0 开源意味着任何人可以去除安全对齐，滥用风险需要社区共同治理

## 对工程实践的启示

1. **推理部署**：MoD 需要推理引擎的特殊支持（动态计算图），vLLM 1.0 和 SGLang 0.6 已适配
2. **微调策略**：MoD Router 在微调时应冻结（否则可能破坏层跳过模式），只微调 MoE 专家权重
3. **量化兼容**：MoD 与 INT4/FP8 量化完全兼容，8×H100 即可部署 1.2T MoE 版本
4. **成本对比**：自部署 Llama 5 MoE 的成本约 $0.50/$2.00 每百万 token，为 GPT-5.5 的 1/25

```python
# 快速部署 Llama 5 MoE（vLLM 1.0）
from vllm import LLM, SamplingParams

llm = LLM(
    model="meta-llama/Llama-5-MoE-1.2T",
    tensor_parallel_size=8,
    max_model_len=131072,
    quantization="fp8",
    enable_mod=True,  # 启用 Mixture-of-Depths
    mod_threshold=0.3,
)

# 推理速度：~59 tok/s（8×H100），精度与全层执行几乎无差
```
