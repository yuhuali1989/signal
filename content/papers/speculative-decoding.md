---
title: "Fast Inference from Transformers via Speculative Decoding"
authors: "Leviathan et al. (Google)"
venue: "ICML 2023"
category: "inference"
importance: 4
arxivUrl: "https://arxiv.org/abs/2211.17192"
summary: "用小模型草稿+大模型验证的投机采样策略，不损失质量加速 2-3x"
date: "2026-04-11"
updatedAt: "2026-04-11 19:54"
type: "paper-review"
---

# Fast Inference from Transformers via Speculative Decoding

> Leviathan, Kalman, Matias (Google Research) | ICML 2023 | [2211.17192](https://arxiv.org/abs/2211.17192)

## 一句话总结

提出投机解码（Speculative Decoding），用小模型快速生成 K 个候选 token，大模型一次并行验证，在**数学上保证输出分布完全等价**的前提下实现 2-3 倍推理加速。

## 核心贡献

### 1. 问题定义

LLM 推理的核心瓶颈：自回归解码是**内存带宽受限**（memory-bound）的——每生成一个 token 都需要加载整个模型权重，但计算量只有一次前向传播。GPU 的计算单元大部分时间处于空闲状态。

传统优化（量化、剪枝、KV Cache 优化）都在减少单次解码的开销，而投机解码从根本上改变了解码范式：**把多次串行解码合并为一次并行验证**。

### 2. 算法原理

投机解码的核心思想极其优雅：

```
步骤 1（Draft）: 用小模型 Mq 自回归生成 K 个候选 token
    x₁, x₂, ..., xₖ ~ q(x)

步骤 2（Verify）: 用大模型 Mp 一次前向传播并行计算所有位置的概率
    p(x₁), p(x₁,x₂), ..., p(x₁,...,xₖ)

步骤 3（Accept/Reject）: 从左到右逐个验证
    对每个位置 i:
      if q(xᵢ) ≤ p(xᵢ):  接受（概率=1）
      else:                接受概率 = p(xᵢ)/q(xᵢ)
      
    拒绝时，从修正分布 max(0, p(x)-q(x))/Z 中采样替代 token
```

### 3. 数学保证

这是论文最核心的定理：

**定理**：投机解码的输出分布与原始大模型的自回归采样**完全相同**。

```
Pr[投机解码输出 x₁,...,xₙ] = Pr[大模型自回归输出 x₁,...,xₙ]
```

证明基于**拒绝采样**（Rejection Sampling）的经典理论。关键在于拒绝时的修正分布设计：

```
p_reject(x) = max(0, p(x) - q(x)) / Σ_x max(0, p(x) - q(x))
```

这确保了被拒绝位置的采样分布精确补偿了接受过程引入的偏差。

### 4. 加速分析

期望加速比取决于草稿模型与目标模型的**一致性**：

```
E[接受长度] = Σ_{i=0}^{K-1} Π_{j=0}^{i} E[min(1, p(xⱼ)/q(xⱼ))]
```

实际加速取决于：

| 因素 | 影响 |
|------|------|
| 草稿模型质量 | 越接近大模型，接受率越高 |
| 候选长度 K | K 越大理论加速越高，但收益递减 |
| 任务类型 | 确定性任务（代码/翻译）>创意任务（写作） |
| 温度设置 | 低温（贪心）时接受率最高 |

**典型配置与加速**：

| 大模型 | 草稿模型 | K | 加速比 |
|--------|---------|---|--------|
| PaLM 540B | PaLM 8B | 5 | 2.0x |
| Chinchilla 70B | Chinchilla 1.4B | 4 | 2.5x |
| LLaMA-2 70B | LLaMA-2 7B | 6 | 2.3x |

## 技术细节

### 最优候选长度 K

K 的选择需要平衡：
- **K 太小**：加速有限，每轮验证开销浪费
- **K 太大**：后续 token 被拒绝概率高，草稿生成时间浪费

最优 K 取决于接受率 α = E[min(1, p(x)/q(x))]：

```
K_optimal ≈ -1/ln(α)

例如：α = 0.8 → K ≈ 4.5 → 取 K = 5
      α = 0.6 → K ≈ 1.96 → 取 K = 2
```

### 树形投机解码（Tree Speculation）

后续工作（SpecInfer、Medusa 等）将线性草稿扩展为**树形结构**：

```
         x₁
        / | \
      x₂  x₂' x₂''
     / \    |
   x₃  x₃' x₃''
```

每个位置生成多个候选，大模型用一次前向传播（通过注意力掩码）同时验证所有路径。最佳路径的期望接受长度显著增加。

### Self-Speculative Decoding

一个巧妙的变体：不使用外部小模型，而是**用大模型自身的早期层**作为草稿：

```python
# 概念示意
class SelfSpeculativeModel:
    def draft(self, x, K):
        # 只运行前 N/4 层 + 轻量 LM head
        hidden = self.layers[:self.n_layers//4](x)
        return self.draft_head(hidden)  # 快速生成 K 个候选
    
    def verify(self, x, candidates):
        # 运行完整模型验证
        return self.full_forward(x, candidates)
```

优势：无需额外模型、无需联合训练、零额外显存。

## 工程实现

### 在 vLLM 中的实践

vLLM 1.0 内置了投机解码支持：

```python
# vLLM 投机解码配置
from vllm import LLM, SamplingParams

llm = LLM(
    model="meta-llama/Llama-3-405B",
    speculative_model="meta-llama/Llama-3-8B",
    num_speculative_tokens=5,
    speculative_draft_tensor_parallel_size=1,
)
```

### 与 KV Cache 优化的结合

投机解码与 PagedAttention 天然兼容：
- 草稿阶段使用独立的 KV Cache 页
- 验证通过后，将草稿 KV Cache 合并到主 Cache
- 拒绝时直接释放草稿页，无显存泄漏

## 局限性

1. **需要额外模型**：草稿模型增加了部署复杂度和显存开销
2. **batch 场景效果递减**：大 batch 时推理已是计算密集型，投机解码优势减弱
3. **任务依赖性**：对创意性/高温度采样任务加速有限
4. **草稿模型选择**：需要与目标模型分布匹配，否则接受率低

## 影响与后续

投机解码催生了一个丰富的研究方向：

| 后续工作 | 创新点 |
|---------|--------|
| Medusa (2024) | 多头并行预测，无需草稿模型 |
| SpecInfer (2024) | 树形推测 + 拓扑感知验证 |
| Eagle (2024) | 特征级草稿 + 自回归头 |
| SPEED (2024) | 利用模型稀疏性加速草稿 |
| Lookahead (2024) | Jacobi 迭代式并行解码 |

投机解码已成为 LLM 推理优化的标配技术，几乎所有主流推理框架（vLLM、SGLang、TensorRT-LLM）都内置了支持。

## 个人思考

投机解码的优雅之处在于它是**无损加速**——不牺牲任何输出质量，通过"投机-验证"的计算范式将内存带宽瓶颈转化为可并行的计算任务。这种思想与 CPU 的分支预测（Branch Prediction）异曲同工：预测正确时获得加速，预测错误时回退到原始速度，永远不会变慢。

从系统设计角度看，投机解码揭示了一个深层洞察：**在 LLM 推理中，"生成"比"验证"昂贵得多**。这一不对称性（验证 K 个 token 的成本 ≈ 生成 1 个 token）是投机解码能够工作的根本原因。

---

*本文由 Signal 知识平台 AI 智能体自动生成，经审校后发布。*
