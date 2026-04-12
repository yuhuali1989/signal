---
title: "FlashAttention"
paperTitle: "FlashAttention: Fast and Memory-Efficient Exact Attention with IO-Awareness"
authors: "Dao et al. (Stanford)"
venue: "NeurIPS 2022"
category: "inference"
date: "2026-04-11"
---

# 论文解读：FlashAttention — 让 Attention 快 4 倍的 IO 感知算法

> 不是近似注意力，而是精确注意力 —— 只是计算顺序变了

## 一句话总结

FlashAttention 通过**分块计算 + 在线 softmax + IO 感知调度**，在不改变注意力计算结果的前提下，将显存从 O(n²) 降至 O(n)，速度提升 2-4x。

## 问题：标准 Attention 的 IO 灾难

GPU 有两级存储：
- **SRAM (片上缓存)**: 20MB，带宽 19TB/s，极快但极小
- **HBM (高带宽显存)**: 80GB，带宽 2TB/s，大但慢

标准 Attention 的计算：

```
Step 1: S = QK^T        写 L×L 矩阵到 HBM  ← IO 瓶颈！
Step 2: P = softmax(S)   从 HBM 读 L×L，计算后写回 ← IO 瓶颈！
Step 3: O = PV           从 HBM 读 L×L ← IO 瓶颈！
```

当 L=128K 时，S 矩阵 = 128K × 128K × 2 bytes = **32GB**，远超 SRAM，必须反复读写 HBM。

## FlashAttention 的核心思想

**不存储 L×L 的注意力矩阵！**

```
关键洞察: softmax 可以分块增量计算（在线 softmax）

标准做法:
  1. 算完所有 QK^T
  2. 整体做 softmax
  3. 乘以 V

FlashAttention:
  1. 将 Q, K, V 分成 [B_r × B_c] 大小的块
  2. 每次只加载一小块到 SRAM
  3. 在 SRAM 中计算局部注意力
  4. 用 running max + running sum 增量更新 softmax
  5. 直接输出结果到 HBM，从不存储完整的 L×L 矩阵
```

### 在线 Softmax (Online Softmax)

关键数学技巧——softmax 可以分块增量计算：

```python
# 标准 softmax: 需要看完所有值才能算
softmax(x) = exp(x_i) / sum(exp(x_j))

# 在线 softmax: 可以一块一块处理
# 维护: m (当前最大值), l (当前指数和)
# 每处理一个新块:
#   m_new = max(m_old, max(block))
#   l_new = l_old * exp(m_old - m_new) + sum(exp(block - m_new))
#   O_new = O_old * (l_old/l_new) * exp(m_old-m_new) + softmax(block) @ V_block
```

## 效果

| 指标 | 标准 Attention | FlashAttention |
|------|:---:|:---:|
| 显存 (L=4K) | 64MB | ~1MB |
| 显存 (L=128K) | 32GB | ~8MB |
| 速度 (A100) | 1x | 2-4x |
| 精度 | 精确 | **精确** (不是近似！) |

## 版本演进

| 版本 | 年份 | 改进 |
|------|------|------|
| FlashAttention-1 | 2022 | 分块 + IO 感知，显存 O(n) |
| FlashAttention-2 | 2023 | 优化 warp 并行，速度再翻倍 |
| FlashAttention-3 | 2024 | Hopper 异步 + FP8，接近硬件理论上限 |

## 影响力

FlashAttention 不是一个学术玩具——它是**整个 LLM 推理生态的基础设施**：

- vLLM、SGLang、TensorRT-LLM 全部内置
- PyTorch 2.0+ 原生集成 (`torch.nn.functional.scaled_dot_product_attention`)
- 使得 128K+ 长上下文模型成为可能

没有 FlashAttention，就没有今天的长上下文 LLM。

---

*本文由 Signal 知识平台 AI 智能体解读整理*
