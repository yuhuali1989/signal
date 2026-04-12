---
title: "Mamba: Linear-Time Sequence Modeling with Selective State Spaces"
paperTitle: "Mamba: Linear-Time Sequence Modeling with Selective State Spaces"
authors: "Gu & Dao (CMU/Princeton)"
venue: "ICLR 2024 (Oral)"
category: "arch"
date: "2026-04-11"
---

# 论文解读：Mamba —— 线性时间的序列建模

> 选择性状态空间模型，O(n) 复杂度挑战 Transformer 的 O(n²) 注意力

## 一句话总结

Mamba 提出了一种**选择性状态空间模型 (Selective SSM)**，通过让模型参数依赖于输入来实现信息选择性过滤，在保持线性时间复杂度 O(n) 的同时匹配甚至超越同规模 Transformer 的性能。

## 核心问题：Transformer 的效率瓶颈

Transformer 的 Self-Attention 机制虽然强大，但有一个根本性的效率问题：

```
Self-Attention 复杂度：O(n²)
其中 n = 序列长度

当 n = 1K   → 1M 次运算
当 n = 100K → 10B 次运算
当 n = 1M   → 1T 次运算  ← 不可接受
```

FlashAttention 通过 IO 优化缓解了常数因子，但 O(n²) 的渐近复杂度无法改变。

## 状态空间模型 (SSM) 的基本思路

### 连续时间 SSM

SSM 的灵感来自控制理论中的线性时不变 (LTI) 系统：

```
状态更新: h'(t) = A·h(t) + B·x(t)
输出:      y(t) = C·h(t) + D·x(t)

其中:
- x(t): 输入信号
- h(t): 隐状态（类似 RNN 的 hidden state）
- A, B, C, D: 系统参数矩阵
```

### 离散化

将连续系统离散化为序列模型：

```
h_k = Ā·h_{k-1} + B̄·x_k
y_k = C·h_k

其中 Ā, B̄ 是通过 ZOH 或双线性变换离散化的参数
```

### 为什么 SSM 是 O(n)？

关键性质：离散化后的 SSM 可以展开为**卷积**：

```
y = SSM(x) = x * K

其中 K = (CB̄, CĀB̄, CĀ²B̄, ...) 是因果卷积核
```

卷积可以用 FFT 在 O(n log n) 时间计算，实际工程实现中约等于 O(n)。

## Mamba 的核心创新：选择性 SSM

### 传统 SSM 的致命缺陷

传统 SSM 是**线性时不变 (LTI)** 的——参数 A, B, C 对所有输入时间步相同。这意味着：

```
LTI SSM 处理 "Hello World Hello World":
- 无法区分第一个 "Hello" 和第二个 "Hello"
- 因为它们经过相同的 A, B, C 变换
- 这就是为什么早期 SSM 在 in-context learning 上远弱于 Transformer
```

### 选择性机制

Mamba 的关键改进：**让 B, C, Δ 依赖于输入**：

```python
# 传统 SSM (LTI)
A = nn.Parameter(...)   # 固定参数
B = nn.Parameter(...)   # 固定参数
C = nn.Parameter(...)   # 固定参数

# Mamba (选择性 SSM)
B = nn.Linear(x)        # B 是 x 的函数！
C = nn.Linear(x)        # C 是 x 的函数！
delta = nn.Linear(x)    # 步长也是 x 的函数！
```

这意味着模型可以根据输入内容**选择性地**决定：
- **记住什么**（通过 B 控制信息写入）
- **输出什么**（通过 C 控制信息读取）
- **遗忘多快**（通过 Δ 控制时间尺度）

### 选择性机制的直觉

```
输入序列: "The capital of France is [MASK]"

在 "The capital of" 位置：
  → delta 小（慢遗忘），B 大（写入 "capital" 信息）
  → 模型保持 "France" + "capital" 的关联

在 "is" 位置：
  → delta 大（快速更新），准备输出
  → C 读取隐状态中的 "Paris" 答案
```

## 工程优化：硬件感知的并行扫描

### 问题

选择性 SSM 不再是 LTI，**不能用 FFT 卷积**。回到递归计算 h_k = f(h_{k-1}, x_k)，这是 O(n) 但**完全串行**——GPU 并行能力无法利用。

### 解决方案：并行扫描 (Parallel Scan)

```
传统递归（串行）:
h₁ = f(h₀, x₁) → h₂ = f(h₁, x₂) → h₃ = f(h₂, x₃) → ...
时间: O(n)，完全串行

并行扫描:
Step 1: 计算所有局部结果 (h₁, h₂), (h₃, h₄), (h₅, h₆), ...
Step 2: 合并相邻对
Step 3: 继续合并
时间: O(n) 总计算，O(log n) 时间步
```

### Kernel Fusion

Mamba 将选择性 SSM 的所有操作融合到一个 CUDA kernel 中：

| 操作 | 传统方案 | Mamba |
|------|---------|-------|
| 离散化 | 单独 kernel | ↓ |
| 并行扫描 | 单独 kernel | 融合为 |
| 乘以 C | 单独 kernel | 一个 kernel |
| **显存 IO** | **3 次全局读写** | **1 次** |

这直接将 Mamba 的实际吞吐量提升了 3-5x。

## 实验结果

### 语言建模

| 模型 | 参数 | 困惑度 (WikiText) | 推理吞吐 |
|------|------|-------------------|---------|
| Transformer++ (130M) | 130M | 29.5 | 1.0x |
| RetNet (130M) | 130M | 31.2 | 1.5x |
| H3 (130M) | 130M | 30.7 | 1.3x |
| **Mamba (130M)** | **130M** | **28.3** | **2.8x** |

### 长序列性能

Mamba 在长序列任务上的优势更加明显：

```
序列长度 vs 吞吐量 (tokens/sec):

    32K     64K     128K    256K
Trans:  1000    250     60      OOM
Mamba:  2800    2600    2400    2200    ← 几乎线性
```

### DNA/Audio 建模

Mamba 在非语言序列上也表现出色：
- DNA 序列分类：在 Human Genome 数据上超越所有 Transformer 基线
- 音频建模：在 SC10 语音命令识别上达到 SOTA

## Mamba 的局限性

1. **In-Context Learning 仍有差距**：虽然选择性机制缓解了 LTI 的问题，但在复杂的 ICL 任务上仍弱于同规模 Transformer
2. **注意力的可解释性缺失**：Transformer 的注意力权重提供了天然的可解释性，Mamba 缺少这个
3. **工程生态不成熟**：训练和部署的工具链远不如 Transformer 成熟
4. **混合架构更优**：2025-2026 年的实践表明，Mamba + Attention 的混合架构（如 Jamba）比纯 Mamba 更强

## 对后续工作的影响

| 后续工作 | 核心思路 |
|---------|---------|
| Mamba-2 | 将选择性 SSM 重新表述为结构化矩阵乘法，统一 SSM 和 Attention |
| Jamba (AI21) | Mamba + Transformer 混合架构，52B 参数生产级模型 |
| Griffin (Google) | 局部注意力 + 循环层的混合，用于 Gemma 系列 |
| RWKV-6 | 另一种线性注意力方案，社区驱动的开源替代 |

## 关键启示

1. **O(n²) 不是必须的**：注意力的二次复杂度可以被线性方案替代，至少在某些场景下
2. **硬件感知设计很重要**：Mamba 的性能优势很大程度来自 kernel fusion，而不只是算法本身
3. **选择性是关键**：让模型参数依赖于输入（打破 LTI 约束）是 SSM 能匹配 Transformer 的核心原因
4. **未来可能是混合架构**：纯 Transformer 和纯 SSM 各有优劣，最优解可能是两者的组合

---

*本文由 Signal 知识平台 AI 智能体解读整理*
