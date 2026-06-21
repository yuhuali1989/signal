---
title: "VLM 视觉语言模型深度解析：CLIP 对齐、ViT 编码与多模态融合技术"
date: "2026-06-21"
author: "Signal AI 编辑"
tags:
  - "VLM"
  - "CLIP"
  - "ViT"
  - "多模态"
  - "视觉语言模型"
  - "图文对齐"
category: "llm"
summary: "深入解析 VLM（视觉语言模型）的核心技术栈：CLIP 对比学习如何对齐图文语义空间、ViT 如何将图像分割为 Patch 序列、图文融合架构的演进（从拼接 Cross-Attention 到统一序列），以及 VLM 的训练策略与数据流水线。"
---

# VLM 视觉语言模型深度解析：CLIP 对齐、ViT 编码与多模态融合技术

> 视觉语言模型（VLM）是当前 AI 发展的核心方向之一。本文从 CLIP、ViT 技术栈出发，系统梳理 VLM 的核心原理、架构设计和训练方法。

## 1. VLM 技术栈全景

VLM 的核心能力是**理解图像内容并用自然语言表达**。当前 VLM 的技术栈可以分为四个层级：

```
┌─────────────────────────────────────────┐
│    应用层：图像描述、VQA、OCR、图文检索     │
├─────────────────────────────────────────┤
│    融合层：Cross-Attention / Q-Former   │
├─────────────────────────────────────────┤
│    编码器层：ViT (图像) + Transformer (文本)│
├─────────────────────────────────────────┤
│    对齐层：CLIP 对比学习（图文语义空间统一） │
└─────────────────────────────────────────┘
```

### 1.1 VLM 的两大流派

| 流派 | 代表模型 | 图像编码 | 融合方式 | 训练方式 |
|------|---------|---------|---------|---------|
| **CLIP 类** | CLIP, SigLIP | ViT | 对比学习（双塔） | 图文对比 |
| **LLaVA 类** | LLaVA, Qwen-VL, InternVL | ViT + 投影层 | Cross-Attention 拼接 | VLM SFT |
| **统一序列类** | Chameleon, CM3Leon | VQ-VAE 离散化 | 统一自回归序列 | Next Token Prediction |
| **双流融合类** | BLIP-2, InstructBLIP | ViT + Q-Former | 可学习Query桥接 | 两阶段训练 |

## 2. CLIP：图文语义对齐的基石

CLIP（Contrastive Language-Image Pre-training）是 OpenAI 于 2021 年提出的核心方法，其影响力贯穿整个 VLM 技术栈。

### 2.1 CLIP 对比学习原理

```
图像编码器（ViT）                    文本编码器（Transformer）
    │                                      │
    ▼                                      ▼
图像嵌入 f_i ∈ R^d                   文本嵌入 g_i ∈ R^d
    │                                      │
    └──────────── 相似度矩阵 ────────────┘
                        │
                   S_{ij} = f_i · g_j^T / τ
                        │
                   ┌────┴────┐
                   │ 对称CE损失 │
                   │ L = (L_i2t + L_t2i)/2 │
                   └─────────┘
```

**关键设计**：
- **Batch 内对比**：一个 batch 的 N 个图文对构成 N×N 相似度矩阵
- **对角元为正样本**：第 i 张图配第 i 段文本
- **非对角元为负样本**：第 i 张图配第 j 段文本（i≠j）
- **温度参数 τ**：控制 softmax 分布的锐利度（CLIP 默认 0.07）

```python
# CLIP 对比损失核心实现
def clip_loss(image_embeds, text_embeds, temperature=0.07):
    """
    image_embeds: [B, D] 图像嵌入
    text_embeds: [B, D] 文本嵌入
    """
    # L2 归一化
    image_embeds = F.normalize(image_embeds, dim=-1)
    text_embeds = F.normalize(text_embeds, dim=-1)
    
    # 相似度矩阵 [B, B]
    logits = image_embeds @ text_embeds.t() / temperature
    
    # 对角元为正样本
    labels = torch.arange(logits.shape[0], device=logits.device)
    
    # 双向对比损失
    loss_i = F.cross_entropy(logits, labels)         # 图像→文本
    loss_t = F.cross_entropy(logits.t(), labels)     # 文本→图像
    
    return (loss_i + loss_t) / 2
```

### 2.2 CLIP 训练的关键参数

| 参数 | CLIP 原始配置 | 调优方向 |
|------|-------------|---------|
| Batch Size | 32,768 | 越大负样本越丰富 |
| 温度 τ | 0.07（可学习） | 小→对比更强 |
| 图像编码器 | ViT-L/14 | ViT-H/14 更优 |
| 文本编码器 | 12层 Transformer | 63M 参数 |
| 训练数据 | 4亿图文对（WIT） | 数据质量比数量重要 |
| 优化器 | AdamW | β2=0.98 |

### 2.3 SigLIP：CLIP 的改进版

SigLIP 使用 **Sigmoid 损失** 替代 Softmax 交叉熵，Batch Size 依赖更小：

```
CLIP Loss:    L = -1/N Σ log(exp(S_ii/τ) / Σ_j exp(S_ij/τ))
SigLIP Loss:  L = -1/N Σ Σ log σ(y_ij · (S_ij/τ - b))
              其中 y_ij = +1 (i=j), -1 (i≠j)

优势：不需要大 Batch 就有好效果，与 Batch Size 无关
```

## 3. ViT：图像编码的核心引擎

ViT（Vision Transformer）是 CLIP 和几乎所有现代 VLM 的图像编码器。

### 3.1 ViT 工作原理

```
输入图像 [B, 3, 224, 224]
    │
    ▼
┌─────────────────────────┐
│   Patch Embedding       │
│   图像分割为 16×16 块     │
│   每块展平 + 线性投影     │
│   输出: [B, 196, 768]   │
└──────────┬──────────────┘
           ▼
┌─────────────────────────┐
│   Position Embedding     │
│   加上位置编码（学习式）   │
└──────────┬──────────────┘
           ▼
┌─────────────────────────┐
│   [CLS] Token + Encoder │
│   12-24层 Transformer   │
│   Self-Attention + FFN  │
└──────────┬──────────────┘
           ▼
┌─────────────────────────┐
│   输出:                  │
│   · [CLS] token → 全局特征│
│   · Patch tokens → 细粒度│
└──────────────────────────┘
```

```python
# ViT Patch Embedding 核心代码
class ViTPatchEmbed(nn.Module):
    """
    将图像分割为 Patch 并投影到嵌入空间
    
    关键参数：
    - patch_size: 每个 Patch 的大小（CLIP: 14, ViT-B: 16, ViT-L: 14）
    - img_size: 输入图像大小（CLIP: 224, SigLIP: 336）
    - in_chans: 输入通道数（RGB: 3）
    - embed_dim: 嵌入维度（ViT-B: 768, ViT-L: 1024, ViT-H: 1280）
    """
    def __init__(self, img_size=224, patch_size=16, in_chans=3, embed_dim=768):
        super().__init__()
        self.img_size = img_size
        self.patch_size = patch_size
        self.num_patches = (img_size // patch_size) ** 2
        
        # 用卷积实现 Patch 分割 + 线性投影
        # kernel_size = stride = patch_size
        self.proj = nn.Conv2d(
            in_chans, embed_dim,
            kernel_size=patch_size, stride=patch_size
        )
    
    def forward(self, x):
        """
        x: [B, 3, 224, 224] 输入图像
        返回: [B, 196, 768] Patch 嵌入序列
        """
        x = self.proj(x)                    # [B, 768, 14, 14] (224/16=14)
        x = x.flatten(2)                    # [B, 768, 196]
        x = x.transpose(1, 2)               # [B, 196, 768]
        return x
```

### 3.2 ViT 参数速查表

| 模型 | Patch | 层数 | 头数 | 维度 | 参数量 | 输入尺寸 |
|------|-------|------|------|------|--------|---------|
| ViT-B/16 | 16 | 12 | 12 | 768 | 86M | 224 |
| ViT-L/14 | 14 | 24 | 16 | 1024 | 307M | 224 |
| ViT-H/14 | 14 | 32 | 16 | 1280 | 632M | 224 |
| ViT-G/14 | 14 | 48 | 16 | 1664 | 1.8B | 224 |
| SigLIP ViT-SO | 14 | 27 | 16 | 1152 | ~500M | 384 |

### 3.3 ViT 在 VLM 中的角色演变

```
第一代（CLIP 时代）：ViT = 图像编码器，双塔结构
    图像 → ViT → [CLS] embedding → 对比学习
    文本 → Transformer → [EOS] embedding → 对比学习

第二代（LLaVA 时代）：ViT = 图像特征提取器，融合结构
    图像 → ViT → patch embeddings [196, 1024] → 投影层
       → 注入 LLM（Cross-Attention 或 Prepend Token）

第三代（Gemini 时代）：ViT 原生多分辨率
    图像 → ViT（动态分辨率）→ 混合分辨率 Patch 序列
       → 与文本 Token 统一序列建模（DiT/Transformer）
```

## 4. 图文融合架构

CLIP 对齐了图文语义空间，但 VLM 需要进一步的**细粒度图文融合**。

### 4.1 LLaVA 的简洁融合

LLaVA 的设计理念：**最简路径，最大效果**。

```
图像 → ViT → 图像嵌入 [576, 1024]
                  │
            投影层 MLP (ViT_dim → LLM_dim)
                  │
                  ▼
图像 Token [576, 4096]  ← 直接拼接到文本 Token 序列前面

最终序列： [图像Token_1...576, 文本Token_1...N]
                │
           LLM 自回归处理
                │
           生成文本回复
```

```python
# LLaVA 的图像投影层（核心融合点）
class LLaVAProjector(nn.Module):
    """
    将 ViT 图像嵌入映射到 LLM 的输入空间
    
    架构：两层 MLP + GELU（简洁有效）
    """
    def __init__(self, vit_dim=1024, llm_dim=4096):
        super().__init__()
        self.projector = nn.Sequential(
            nn.Linear(vit_dim, llm_dim),
            nn.GELU(),
            nn.Linear(llm_dim, llm_dim),
        )
    
    def forward(self, vit_output):
        """
        vit_output: [B, N_patches, vit_dim] 
                    例如 LLaVA-1.5: [1, 576, 1024]
        """
        return self.projector(vit_output)  # [B, 576, 4096]
```

### 4.2 Q-Former 交互式融合

BLIP-2 的 Q-Former 使用可学习 Query Token 作为图文桥梁：

```
图像 → ViT → 图像特征 → Q-Former
                            │
                    ┌───────┴───────┐
                    │ Learnable     │ ← 32 个可学习 Query Token
                    │ Transformer   │ 参与 Cross-Attention
                    └───────┬───────┘
                            │
                    文本 Token → Q-Former → 融合后的 Query
                    与图像特征双向 Cross-Attention

优势：Q-Former 可以压缩图像信息到固定数量 Query Token
       通常 32 个 Query 就够用
```

### 4.3 统一序列（Chameleon 方案）

Chameleon 将图像**量化**为离散 Token，与文本 Token 在同一个序列中：

```
序列示例: [SOH, token_1, ..., <IMG>, img_tok_1, ..., img_tok_1024, 继续输出...]
                     ↑          ↑
                文本 Token    图像 Token (VQ-VAE 量化, 编码本大小 8192)

训练方式：标准的 Next Token Prediction
          图像 Token 也参与预测
```

| 融合方案 | 信息完整性 | 计算效率 | 灵活度 | 典型模型 |
|---------|-----------|---------|--------|---------|
| **Pre-token 拼接** | 高 | 高 | 低 | LLaVA |
| **Cross-Attention** | 极高 | 中 | 高 | Flamingo |
| **Q-Former** | 中（压缩） | 高 | 中 | BLIP-2 |
| **统一序列** | 极高 | 低 | 极高 | Chameleon |
| **双流交替** | 高 | 中 | 高 | CM3Leon |

## 5. VLM 训练流程

完整的 VLM 训练分为三个阶段：

### 5.1 阶段一：CLIP 预训练（图文对齐）

```
目标：对齐图文语义空间
数据：4亿+ 图文对
训练：对比学习（CLIP Loss）
产出：ViT 权重 + 文本编码器权重
```

### 5.2 阶段二：VLM 预训练（融合训练）

```
做法：冻结 ViT 和 LLM，只训练连接层（Projector / Q-Former）

LLaVA 做法：
├── 冻结 ViT（CLIP 预训练权重）
├── 冻结 LLM（Vicuna/Mistral 权重）
├── 训练投影层 MLP
└── 数据：LLaVA-Pretrain (558K 图文对)
    每对 = 图像 + 简单描述
```

### 5.3 阶段三：指令微调（SFT）

```
做法：全量训练或 LoRA 微调

LLaVA-SFT 数据格式：
{
    "id": "1",
    "image": "cat.jpg",
    "conversations": [
        {"from": "human", "value": "<image>\n图中有几只猫？"},
        {"from": "gpt", "value": "图中有 1 只橘猫。"}
    ]
}

关键训练策略：
├── 多轮对话（逐步推理）
├── 图文交错输入
└── 冻结 ViT 或全参数微调
```

### 5.4 VLM 数据流水线

```python
# VLM 训练数据加载
class VLMDataset(Dataset):
    """
    VLM 数据集：图像 + 多轮对话
    """
    def __init__(self, data_path, image_dir, 
                 image_processor=None, tokenizer=None):
        with open(data_path) as f:
            self.data = json.load(f)
        self.image_dir = image_dir
        self.image_processor = image_processor
        self.tokenizer = tokenizer
    
    def __getitem__(self, idx):
        item = self.data[idx]
        
        # 加载图像
        image = Image.open(f"{self.image_dir}/{item['image']}")
        image = self.image_processor(image)
        
        # 构建对话文本
        # format: "<image>\nHuman: 问题\nAssistant: 回答"
        text = self._build_conversation(item['conversations'])
        
        return {
            "image": image,
            "text": text,
        }
```

## 6. VLM 年度演进速览

| 时间 | 模型 | 核心创新 | ViT 方案 | 融合方式 |
|------|------|---------|---------|---------|
| 2021 | CLIP | 对比学习对齐图文 | ViT-L/14 | 双塔对比 |
| 2022 | Flamingo | Perceiver Resampler | NFNet-F6 | Gated Cross-Attn |
| 2023 | LLaVA | 最简融合路径 | CLIP ViT-L | 投影层拼接 |
| 2023 | BLIP-2 | Q-Former 桥接 | ViT-G | 32个Query |
| 2024 | LLaVA-1.6 | 动态高分辨率 | CLIP ViT-L | AnyRes 分图 |
| 2024 | InternVL | ViT-LLM 统一 | 6B ViT | 全参数对齐 |
| 2025 | Chameleon | 统一序列建模 | VQ-VAE 离散化 | Next Token Pred |
| 2026 | Gemma 3 | 原生多模态 | SigLIP ViT | 统一Transformer |

## 7. 总结

VLM 的核心技术栈围绕 CLIP + ViT 展开：

- **CLIP** 解决"图文语义空间对齐"问题——通过对比学习将图像和文本映射到同一向量空间
- **ViT** 解决"图像怎么变成序列"问题——通过 Patch 分割 + 线性投影，让图像也能被 Transformer 理解
- **融合架构** 解决"图文信息怎么交互"问题——从 LLaVA 的简洁拼接，到 Q-Former 的可学习桥接，再到 Chameleon 的统一序列

CLIP + ViT 的组合已经成为 VLM 的事实标准，就像 BERT 对 NLP 一样的基础性贡献。

> 参考来源：CLIP 论文、ViT 论文、LLaVA 论文、BLIP-2 论文、Chameleon 论文
