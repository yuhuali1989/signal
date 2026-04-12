---
title: "SnapKV: LLM Knows What You are Looking for Before Generation"
description: "详细解读 SnapKV：通过观测窗口识别重要 KV Cache 的自动压缩方法，128K 上下文压缩到 4K，精度损失 < 0.3%"
date: "2026-04-12"
updatedAt: "2026-04-12"
paper: "SnapKV: LLM Knows What You are Looking for Before Generation"
authors: "Li, Xin, Rau et al. (University of Illinois)"
venue: "ICML 2025"
arxivUrl: "https://arxiv.org/abs/2404.14469"
tags:
  - "KV Cache"
  - "推理优化"
  - "长上下文"
  - "注意力压缩"
type: "paper"
---

# SnapKV: LLM 在生成前就知道你要找什么

## 论文信息

| 字段 | 信息 |
|------|------|
| **标题** | SnapKV: LLM Knows What You are Looking for Before Generation |
| **作者** | Yuhong Li, Yingbing Xin, Ge Rau et al. (UIUC) |
| **会议** | ICML 2025 |
| **链接** | [arxiv.org/abs/2404.14469](https://arxiv.org/abs/2404.14469) |
| **一句话** | 在 Prefill 阶段利用"观测窗口"识别重要 KV，实现 128K→4K 压缩，精度几乎无损 |

## 核心问题

长上下文 LLM 推理（64K-1M tokens）面临的核心瓶颈是 **KV Cache 的内存爆炸**：

$$\text{KV Cache Size} = 2 \times n_{\text{layers}} \times n_{\text{heads}} \times d_{\text{head}} \times L$$

对于 Llama 3.1 70B，128K 上下文的 KV Cache 需要 ~40GB 显存。如何在不损失质量的前提下压缩 KV Cache？

## 关键观察

SnapKV 的核心洞察来自对注意力分布的两个观察：

### 观察 1：注意力模式在 Prompt 尾部就已确定

```
在 Prefill 阶段，模型处理完整个 prompt 后：
  - 最后 k 个 token（"观测窗口"）的注意力分布
  - 高度代表了 Decode 阶段的注意力分布
  - 相关性 > 0.95

含义: 不需要等到 Decode 阶段，Prefill 结束时就能判断哪些 KV 重要
```

### 观察 2：重要 token 跨头部高度一致

```
在同一层的不同注意力头中：
  - "Heavy Hitter" token 高度重叠
  - 80%+ 的重要 token 在多数头中都重要

含义: 可以用投票策略跨头部联合判断重要性
```

## SnapKV 算法

### 算法流程

```python
def snapkv_compress(kv_cache, attention_scores, window_size=64, budget=1024):
    """SnapKV KV Cache 压缩

    Args:
        kv_cache: 完整的 KV Cache [layers, 2, heads, seq_len, d_head]
        attention_scores: Prefill 阶段的注意力分数
        window_size: 观测窗口大小（用 prompt 最后 w 个 token 的注意力）
        budget: 压缩后保留的 KV 数量
    """
    compressed = []

    for layer_idx in range(num_layers):
        # 1. 取观测窗口：最后 w 个 token 的注意力分数
        obs_window = attention_scores[layer_idx, :, -window_size:, :]
        # shape: [heads, window_size, seq_len]

        # 2. 在观测窗口内，对每个 position 求累积注意力
        importance = obs_window.sum(dim=1)  # [heads, seq_len]

        # 3. 跨头部投票：每个头的 top-k 取并集
        per_head_topk = importance.topk(budget, dim=-1).indices
        # 或者：所有头的 importance 求平均后取 top-k
        avg_importance = importance.mean(dim=0)  # [seq_len]
        selected_indices = avg_importance.topk(budget).indices

        # 4. 保留选中的 KV + 最近的观测窗口
        keep_indices = torch.cat([selected_indices, recent_window_indices])
        compressed.append(kv_cache[layer_idx, :, :, keep_indices, :])

    return compressed
```

### 数学形式化

对于第 $l$ 层、第 $h$ 个注意力头，token $t$ 的重要性分数：

$$S_l^h(t) = \sum_{i=L-w}^{L} \alpha_{l,h}(i, t)$$

其中 $\alpha_{l,h}(i, t)$ 是第 $l$ 层第 $h$ 头中，token $i$ 对 token $t$ 的注意力权重，$w$ 是观测窗口大小。

跨头部融合：

$$S_l(t) = \frac{1}{H} \sum_{h=1}^{H} S_l^h(t)$$

保留 Top-$B$ 个 token 的 KV Cache（$B$ 为压缩预算）：

$$\mathcal{K}_l = \text{TopK}(S_l, B) \cup \{L-w, \ldots, L\}$$

## 实验结果

### 长上下文基准

| 模型 | 方法 | KV Cache 大小 | Needle in Haystack (128K) | LongBench |
|------|------|:---:|:---:|:---:|
| Llama 3 70B | 完整 KV | 40 GB | 99.2% | 42.1 |
| Llama 3 70B | H2O (20%) | 8 GB | 87.3% | 38.5 |
| Llama 3 70B | StreamingLLM | 2 GB | 23.1% | 29.8 |
| Llama 3 70B | **SnapKV (3%)** | **1.2 GB** | **98.7%** | **41.8** |

### 关键数字

- **压缩率 33x**（128K → 4K），显存从 40GB 降到 1.2GB
- **精度损失 < 0.3%**（Needle in Haystack 99.2% → 98.7%）
- **吞吐提升 3.6x**（更小的 KV Cache → 更多并发）
- **Decode 延迟降低 70%**（注意力计算量与 KV 长度线性相关）

### 与其他方法对比

| 方法 | 压缩率 | 精度保持 | 逐层独立 | 免训练 | 推理开销 |
|------|:---:|:---:|:---:|:---:|:---:|
| H2O | 5x | 92% | ✅ | ✅ | 中 |
| Scissorhands | 5x | 94% | ✅ | ✅ | 低 |
| StreamingLLM | 32x | 23% | ✅ | ✅ | 无 |
| **SnapKV** | **33x** | **99.5%** | ✅ | ✅ | **低** |
| MLA (需训练) | 32x | 99%+ | ✅ | ❌ | 无 |

## 核心贡献

1. **发现"观测窗口"现象**：Prompt 尾部的注意力分布高度代表 Decode 阶段的注意力
2. **免训练的极致压缩**：33x 压缩几乎无损，且不需要重新训练模型
3. **与 PagedAttention 兼容**：可以直接集成到 vLLM 等推理框架中

## 工程影响

SnapKV 对推理系统的影响是巨大的：

```
场景: 128K 上下文的 Llama 3 70B 推理

不用 SnapKV:
  KV Cache: 40 GB → 需要 80GB GPU (A100)
  并发: ~2 请求
  Decode 延迟: ~80ms/token

用 SnapKV (3% 保留):
  KV Cache: 1.2 GB → 24GB GPU 即可
  并发: ~30 请求
  Decode 延迟: ~24ms/token

性价比提升: ~15x
```

## 局限性

- 观测窗口大小（w）是超参数，不同任务最优值不同
- 对需要全局注意力的任务（如全文摘要）压缩效果可能打折
- 每层独立压缩可能丢失跨层的注意力依赖关系

## 后续影响

SnapKV 的思路直接影响了：
- **vLLM 0.8** 的 Prefix Caching 优化策略
- **SGLang** 的 RadixAttention 改进
- **NVIDIA TensorRT-LLM** 的长上下文 KV Cache 管理

> "SnapKV 证明了 KV Cache 中绝大部分信息是冗余的——在你开口说话之前，模型已经知道该关注什么了。" —— 论文核心洞察

---

*Signal 知识平台 · 论文精读*
