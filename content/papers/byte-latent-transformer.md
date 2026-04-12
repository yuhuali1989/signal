---
title: "论文精读：Byte Latent Transformer — 无 Tokenizer 的字节级大模型"
description: "Meta FAIR 提出 BLT 架构，用动态 patch 替代固定 tokenizer，在字节级别直接建模语言，消除 tokenization 偏差"
date: "2026-04-12"
updatedAt: "2026-04-12 02:20"
agent: "研究员→编辑→审校员"
tags:
  - "论文精读"
  - "Tokenizer-Free"
  - "BLT"
  - "Meta"
  - "架构创新"
type: "paper"
paperTitle: "Byte Latent Transformer: Patches Scale Better Than Tokens"
paperAuthors: "Pagnoni, Ram et al. (Meta FAIR)"
paperVenue: "arXiv 2024 / ICML 2025"
paperUrl: "https://arxiv.org/abs/2412.09871"
---

# 论文精读：Byte Latent Transformer — 无 Tokenizer 的字节级大模型

## 1. 研究动机

### Tokenizer 的根本问题

现有 LLM 都依赖 Tokenizer（BPE/SentencePiece），但 tokenizer 引入了多重偏差：

1. **语言偏差**：英语 1 个单词 ≈ 1-2 个 token，但中文/日文可能 1 个字 = 2-3 个 token，计费和处理效率不公平
2. **拼写脆弱性**："ChatGPT" → ["Chat", "G", "PT"]，微小拼写变化可能导致完全不同的 token 序列
3. **格式敏感**：空格、缩进、换行的 tokenization 不一致
4. **闭源耦合**：tokenizer 一旦训练完成就不能改变，模型终身绑定
5. **稀有词表示差**：不在词表中的词被拆成字节级 token，效率极低

### 之前的尝试

| 方法 | 问题 |
|------|------|
| MegaByte (2023) | 固定 patch 大小，无法适应信息密度变化 |
| 字节级 Transformer | 序列长度爆炸（比 token 长 4-5×），计算量不可接受 |
| 字符级模型 | 效果差，无法捕获长距离依赖 |

BLT 的核心创新：**动态分组字节为 patch，让 Transformer 在 patch（潜在表示）级别工作**。

## 2. 核心方法

### 2.1 架构总览

```
┌─── Byte Latent Transformer (BLT) ───────────────────┐
│                                                       │
│  输入字节序列: [72, 101, 108, 108, 111, 32, 87, ...] │
│  ("Hello W...")                                       │
│                                                       │
│  ┌──── Local Encoder ────┐                            │
│  │  小型 Transformer      │ ← 字节→patch 编码         │
│  │  (6 层, d=512)         │                            │
│  │  动态 Patch 边界检测    │                            │
│  └────────┬──────────────┘                            │
│           │ patch embeddings                          │
│  ┌────────┴──────────────┐                            │
│  │  Latent Transformer    │ ← 核心：patch 级别建模    │
│  │  (主 Transformer)      │                            │
│  │  (32-48 层, d=4096)    │                            │
│  └────────┬──────────────┘                            │
│           │ latent representations                    │
│  ┌────────┴──────────────┐                            │
│  │  Local Decoder         │ ← patch→字节 解码         │
│  │  小型 Transformer      │                            │
│  │  (6 层, d=512)         │                            │
│  └────────┬──────────────┘                            │
│           │                                           │
│  输出字节序列（逐字节生成）                              │
└───────────────────────────────────────────────────────┘
```

### 2.2 动态 Patch 分组

BLT 的关键创新是**基于熵的动态 patch 边界检测**：

```python
def dynamic_patching(byte_sequence, entropy_model, threshold=2.5):
    """基于信息熵动态分割字节序列为 patch"""
    patches = []
    current_patch = []
    
    for i, byte in enumerate(byte_sequence):
        current_patch.append(byte)
        
        # 计算下一个字节的预测熵
        entropy = entropy_model.predict_entropy(byte_sequence[:i+1])
        
        if entropy > threshold or len(current_patch) >= max_patch_size:
            # 高熵 = 信息密度高 = 需要细粒度处理
            # → 在此处切割 patch
            patches.append(current_patch)
            current_patch = []
    
    if current_patch:
        patches.append(current_patch)
    
    return patches

# 示例：
# "Hello World" → bytes [72,101,108,108,111,32,87,111,114,108,100]
# 熵分析：
#   "Hello" → 低熵（常见词），合为 1 个 patch
#   " " → 高熵（空格后什么都可能出现），切割
#   "World" → 低熵，合为 1 个 patch
# 结果：2 个 patch（而非 11 个字节独立处理）
```

**动态分组的核心直觉**：
- 可预测的字节序列（如常见单词内部）→ 合并为大 patch → 减少 Transformer 序列长度
- 不可预测的字节（如单词边界、罕见字符）→ 小 patch → 精细处理

### 2.3 训练目标

BLT 的训练目标仍然是 Next Byte Prediction，但在两个层次上：

1. **Patch 级别**：Latent Transformer 预测下一个 patch 的表示
2. **字节级别**：Local Decoder 从 patch 表示生成具体的字节序列

$$\mathcal{L}_{BLT} = \sum_{p=1}^{P} \sum_{b \in \text{patch}_p} -\log P(b | b_{<}, \text{latent}_p)$$

## 3. 核心实验结果

### 3.1 Scaling 对比

在相同 FLOPS 预算下（6×10²² FLOPS，约等于 Llama 3 8B 训练量）：

| 模型 | 参数量 | 有效序列长度 | HellaSwag | ARC-C | MMLU |
|------|:---:|:---:|:---:|:---:|:---:|
| Llama 3 (BPE) | 8B | 2048 tokens | 79.1 | 53.4 | 65.2 |
| BLT-Entropy | 8.2B | 1200 patches | **80.3** | **55.1** | **66.8** |
| BLT-Fixed (对照) | 8.0B | 1600 patches | 78.5 | 52.8 | 64.9 |

**关键发现**：
- BLT 在相同计算量下超越了传统 tokenizer 方案
- 动态 patch（BLT-Entropy）显著优于固定大小 patch
- 优势主要来自对罕见词和跨语言场景的更好处理

### 3.2 Patch 效率分析

```
不同文本类型的平均 patch 大小（字节/patch）：

文本类型          BPE 等效    BLT 动态 patch   效率比
────────────────────────────────────────────────
英语散文           3.8          4.2            1.1×
中文文本           2.1          3.5            1.67× ← 中文显著受益
Python 代码        3.2          5.1            1.59× ← 代码显著受益
数学公式           1.8          2.8            1.56×
混合语言           2.5          3.8            1.52×
```

**BLT 对中文和代码的效率提升尤为显著**，因为这些场景下传统 BPE 的 tokenization 效率较低。

### 3.3 鲁棒性测试

BLT 对拼写变化的鲁棒性：

```
测试：将输入中的随机字符替换/删除/插入

准确率保持率（原始准确率的 %）:
  Llama 3 (BPE):  67.2%  ← 拼写变化导致 token 完全不同
  BLT:            89.5%  ← 字节级建模天然抗噪
```

## 4. 技术深度分析

### 4.1 计算效率的关键

BLT 的计算效率优势来自**序列压缩**：

```
原始字节序列长度：L_bytes
BLT patch 数：L_patches ≈ L_bytes / avg_patch_size

Transformer 注意力复杂度：
  字节级 Transformer: O(L_bytes²) ← 不可接受
  BLT Latent:          O(L_patches²) ≈ O((L_bytes/4)²) = O(L_bytes²/16)
  Local Encoder/Decoder: O(patch_size²) × L_patches ← 线性

总计算量 ≈ Latent Transformer + 2 × Local
        ≈ O(L_bytes²/16) + O(L_bytes)
        ≈ O(L_bytes²/16)  ← 比字节级节省 16×！
```

### 4.2 与 MegaByte 的区别

| 特性 | MegaByte | BLT |
|------|:---:|:---:|
| Patch 大小 | 固定（如 8 字节） | **动态（基于熵）** |
| 分组依据 | 位置（每 8 字节切一次） | **信息密度** |
| 常见词处理 | 可能把一个词切成多个 patch | **整词通常合为 1 个 patch** |
| Scaling | Patch 级 Transformer 已不够高效 | **Latent Transformer + 局部编解码** |
| 效果 | 弱于 BPE baseline | **超越 BPE baseline** |

### 4.3 推理速度分析

```
推理延迟分解（生成 100 个字节，8B 模型，1×H100）:

Llama 3 (BPE):
  ~25 个 token × 15ms/token = 375ms

BLT:
  ~20 个 patch × 18ms/patch (Latent Transformer)
  + 100 个字节 × 1ms/byte (Local Decoder)
  = 360ms + 100ms = 460ms

BLT 推理速度略慢（~1.2×），但可通过以下优化补偿：
  - Local Decoder 可以并行解码（已知 patch 表示）
  - Speculative Decoding 对字节级更有效
  - 优化后实际差距 <10%
```

## 5. 影响与展望

### 5.1 Tokenizer-Free 的时代

BLT 是第一个在主流基准上**超越 tokenizer 方案**的字节级模型。这标志着：
- 未来模型可能不再需要 tokenizer 训练这一步骤
- 跨语言公平性得到根本性改善
- 模型对输入格式更加鲁棒

### 5.2 对 Token 经济学的影响

如果 BLT 架构被广泛采用，API 计费模式需要改变：
- 当前：按 token 数计费（不同语言费率不公平）
- 未来：按 patch 数或字节数计费（更公平）

### 5.3 局限性

1. **推理开销**：Local Encoder/Decoder 增加了固定开销
2. **训练复杂性**：需要预训练熵模型来决定 patch 边界
3. **生态兼容**：现有工具链都基于 token，迁移成本高

## 6. 论文信息

- **标题**：Byte Latent Transformer: Patches Scale Better Than Tokens
- **作者**：Artidoro Pagnoni, Ram Pasunuru et al.
- **机构**：Meta FAIR
- **发表**：arXiv 2024.12 → ICML 2025
- **代码**：https://github.com/facebookresearch/blt

---

*Signal 知识平台 · 论文精读系列*
