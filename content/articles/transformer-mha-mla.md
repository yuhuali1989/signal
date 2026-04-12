---
title: "Transformer 注意力机制的未来：从 MHA 到 GQA 再到 MLA"
description: "深入解读多头注意力机制的演进路线，MHA → MQA → GQA → MLA 的设计权衡与工程实践"
date: "2026-04-11"
updatedAt: "2026-04-11 15:46"
agent: "研究员→编辑"
tags:
  - "模型架构"
type: "article"
---

# Transformer 注意力机制的未来：从 MHA 到 GQA 再到 MLA

> 注意力机制的演进史，就是一部 KV Cache 的压缩史

## 核心问题

LLM 推理时，KV Cache 是最大的显存消费者。注意力机制的设计直接决定 KV Cache 的大小：

```
KV Cache 大小 = 2 × num_kv_heads × head_dim × seq_len × num_layers

→ 注意力机制的核心演进目标：减少 num_kv_heads，同时不降低模型质量
```

## 四代注意力机制对比

### 1️⃣ MHA (Multi-Head Attention)

```
Q heads: [h1, h2, h3, h4, h5, h6, h7, h8]
K heads: [h1, h2, h3, h4, h5, h6, h7, h8]  ← 每个 Q head 有独立 KV
V heads: [h1, h2, h3, h4, h5, h6, h7, h8]

KV Cache = 8 × head_dim × 2  per token per layer
代表: GPT-3, BERT
```

### 2️⃣ MQA (Multi-Query Attention)

```
Q heads: [h1, h2, h3, h4, h5, h6, h7, h8]
K heads: [h1]  ← 所有 Q heads 共享 1 组 KV！
V heads: [h1]

KV Cache = 1 × head_dim × 2  per token per layer  (压缩 8x)
代表: PaLM, Falcon
问题: 过度共享导致质量下降
```

### 3️⃣ GQA (Grouped-Query Attention)

```
Q heads: [h1, h2, h3, h4, h5, h6, h7, h8]
K heads: [g1,     g1,     g2,     g2    ]  ← 每 4 个 Q 共享 1 组 KV
V heads: [g1,     g1,     g2,     g2    ]

KV Cache = 2 × head_dim × 2  per token per layer  (压缩 4x)
代表: Llama 2/3, Mistral, Qwen
平衡: 质量接近 MHA，显存大幅降低
```

**GQA 的 PyTorch 实现**：

```python
class GroupedQueryAttention(nn.Module):
    def __init__(self, d_model=4096, n_q_heads=32, n_kv_heads=8):
        super().__init__()
        self.n_q_heads = n_q_heads
        self.n_kv_heads = n_kv_heads
        self.n_rep = n_q_heads // n_kv_heads  # 每组 4 个 Q head
        self.head_dim = d_model // n_q_heads

        self.W_q = nn.Linear(d_model, n_q_heads * self.head_dim)
        self.W_k = nn.Linear(d_model, n_kv_heads * self.head_dim)  # 更小！
        self.W_v = nn.Linear(d_model, n_kv_heads * self.head_dim)  # 更小！

    def forward(self, x):
        Q = self.W_q(x)  # [B, L, 32*128]
        K = self.W_k(x)  # [B, L,  8*128]  ← 只有 1/4 的参数
        V = self.W_v(x)  # [B, L,  8*128]

        # 将 K, V 复制扩展到匹配 Q 的 head 数
        K = K.repeat_interleave(self.n_rep, dim=-1)
        V = V.repeat_interleave(self.n_rep, dim=-1)

        # 正常做 attention
        return attention(Q, K, V)
```

### 4️⃣ MLA (Multi-Latent Attention) — DeepSeek 独创

```
传统: 缓存完整的 K, V 向量
MLA:  缓存压缩后的潜变量 c = Down(K, V)
推理: K, V = Up(c)  (用时恢复)

KV Cache = latent_dim × 1  per token per layer
DeepSeek-V3 latent_dim=512 vs MHA=8192 → 压缩 16x!

代表: DeepSeek-V2, DeepSeek-V3
```

## 演进总结

```
MHA  ──→  MQA  ──→  GQA  ──→  MLA
(1:1)    (N:1)    (N:G)    (投影压缩)

KV Cache:  100%    12.5%    25%     6%
质量损失:   0      明显     极小     极小
```

| 方案 | 压缩率 | 质量 | 采用度 | 适用 |
|------|--------|------|--------|------|
| MHA | 1x | 最好 | 旧模型 | 训练，小模型 |
| MQA | 8x+ | 损失较大 | 少 | 推理速度极端优先 |
| **GQA** | **4-8x** | **接近 MHA** | **主流** | **大多数场景** |
| **MLA** | **16x+** | **接近 MHA** | **DeepSeek** | **极长上下文** |

## 展望

GQA 已成为 2024-2026 年的事实标准（Llama 3、Qwen、Mistral 都用它）。MLA 代表了更激进的压缩方向，DeepSeek 已经验证了它在 671B 模型上的可行性。未来可能出现更多基于低秩投影或混合策略的注意力变体。

---

*本文由 Signal 知识平台 AI 智能体自动生成。最后更新: 2026-04-11*
