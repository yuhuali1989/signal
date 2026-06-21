---
title: "Diffusion模型文本与多模态融合从入门到精通 - 第2章: 文本条件注入"
book: "Diffusion模型文本与多模态融合从入门到精通"
chapter: "2"
chapterTitle: "文本条件注入"
description: "CLIP文本编码、Cross-Attention机制、Classifier-Free Guidance、文本条件UNet架构、完整代码实现"
date: "2026-06-21"
updatedAt: "2026-06-21 12:00"
agent: "研究员→编辑→审校员"
tags:
  - "文本条件"
  - "Cross-Attention"
  - "CFG"
  - "CLIP"
  - "条件生成"
type: "book"
---

# 第 2 章：文本条件注入

> 选自《Diffusion模型文本与多模态融合从入门到精通》

## 2.1 文本编码：CLIP 文本模型

文本注入的第一步是将自然语言文本转换为稠密向量表示。Stable Diffusion 使用 **CLIP 文本编码器**。

### 2.1.1 CLIP 文本编码流程

```
"一只橘猫在窗台上晒太阳"
        │
        ▼
┌──────────────────────┐
│  Tokenizer (BPE)      │  → [49406, 330, 2368, ..., 49407]
│  vocab_size=49408     │     77 tokens (padding/truncation)
└──────────┬───────────┘
           ▼
┌──────────────────────┐
│  CLIP Text           │
│  Transformer          │  → [77, 768]  (CLIP ViT-L/14)
│  12 layers, 512 dim   │    [77, 1280] (CLIP ViT-H/14)
└──────────┬───────────┘
           ▼
┌──────────────────────┐
│  输出：              │
│  · token_embeddings:  │  → 完整序列 [77, 768]
│  · pooled_output:     │  → [EOS] token [768]
└──────────────────────┘
```

```python
# CLIP 文本编码完整实现
from transformers import CLIPTextModel, CLIPTokenizer

class CLIPTextEncoder(nn.Module):
    """
    Stable Diffusion 文本编码器
    输出：text_embeddings [B, 77, 768] + pooled [B, 768]
    """
    def __init__(self, model_id="openai/clip-vit-large-patch14"):
        super().__init__()
        self.tokenizer = CLIPTokenizer.from_pretrained(model_id)
        self.text_encoder = CLIPTextModel.from_pretrained(model_id)
        # 冻结文本编码器（不参与训练）
        for param in self.text_encoder.parameters():
            param.requires_grad = False
    
    def forward(self, prompts: list[str]) -> dict:
        """
        prompts: ["一只橘猫", "a cute cat"]
        """
        tokens = self.tokenizer(
            prompts,
            max_length=77,
            padding="max_length",
            truncation=True,
            return_tensors="pt"
        )
        outputs = self.text_encoder(
            input_ids=tokens.input_ids,
            attention_mask=tokens.attention_mask,
            output_hidden_states=False
        )
        return {
            "token_embeddings": outputs.last_hidden_state,  # [B, 77, 768]
            "pooled": outputs.pooler_output,                # [B, 768]
        }

# 多语言文本编码（中文场景）
# 使用 mCLIP / Chinese-CLIP 等
class MultilingualTextEncoder(nn.Module):
    """支持中英文的文本编码器"""
    def __init__(self):
        super().__init__()
        # 使用 Chinese-CLIP 或多语言 CLIP
        self.encoder = CLIPTextModel.from_pretrained(
            "BAAI/Chinese-CLIP-vit-large-patch14"
        )
```

## 2.2 Cross-Attention 机制

文本条件注入扩散模型的核心是 **Cross-Attention**：将文本嵌入注入到 UNet 的每一层。

### 2.2.1 数学原理

```
Cross-Attention(Q, K, V) = softmax(Q · K^T / √d) · V

其中：
Q = W_Q · z          (图像特征，来自 UNet)
K = W_K · c          (文本条件，来自 CLIP)
V = W_V · c          (文本条件，来自 CLIP)

输出：文本条件增强后的图像特征
```

### 2.2.2 UNet 中的 Cross-Attention 注入位置

```
UNet 架构（含文本条件注入）：

               xt + time_embedding
                       │
               ┌───────┴───────┐
               │   ResBlock     │ ← 时间步控制
               └───────┬───────┘
                       │
               ┌───────┴───────┐
               │  CrossAttn    │ ← ★ 文本条件注入
               │  Q=图像, K=文本 │   核心融合点
               └───────┬───────┘
                       │
               ┌───────┴───────┐
               │   FeedForward  │
               └───────┬───────┘
                       │
              (重复上述结构)
```

```python
# Cross-Attention 模块实现
class CrossAttention(nn.Module):
    """
    文本-图像交叉注意力
    - q: 来自图像特征 (UNet hidden states)
    - k, v: 来自文本特征 (CLIP embeddings)
    """
    def __init__(self, query_dim, context_dim=768, heads=8, dim_head=64):
        super().__init__()
        inner_dim = heads * dim_head
        self.heads = heads
        self.scale = dim_head ** -0.5
        
        self.to_q = nn.Linear(query_dim, inner_dim, bias=False)
        self.to_k = nn.Linear(context_dim, inner_dim, bias=False)
        self.to_v = nn.Linear(context_dim, inner_dim, bias=False)
        self.to_out = nn.Linear(inner_dim, query_dim)
    
    def forward(self, x, context=None):
        """
        x: [B, H*W, D] 图像特征展平序列
        context: [B, 77, 768] CLIP 文本嵌入
        """
        h = self.heads
        q = self.to_q(x)
        
        # 如果没有提供 context，使用 x 自身做 Self-Attention
        k = self.to_k(context) if context is not None else self.to_k(x)
        v = self.to_v(context) if context is not None else self.to_v(x)
        
        # 多头切分
        q = q.view(*q.shape[:-1], h, -1).transpose(-2, -3)
        k = k.view(*k.shape[:-1], h, -1).transpose(-2, -3)
        v = v.view(*v.shape[:-1], h, -1).transpose(-2, -3)
        
        # 注意力计算
        sim = torch.einsum("b h i d, b h j d -> b h i j", q, k) * self.scale
        attn = sim.softmax(dim=-1)
        
        out = torch.einsum("b h i j, b h j d -> b h i d", attn, v)
        out = out.transpose(-2, -3).contiguous().view(*x.shape[:-1], -1)
        return self.to_out(out)
```

### 2.2.3 完整的条件 UNet Block

```python
class ConditionalResBlock(nn.Module):
    """
    带文本条件注入的UNet残差块
    
    融合点：
    1. 时间嵌入 → AdaGN (Adaptive Group Norm)
    2. 文本嵌入 → Cross-Attention
    """
    def __init__(self, in_ch, out_ch, time_emb_dim, text_dim=768):
        super().__init__()
        
        # 时间步条件（AdaGN）
        self.time_mlp = nn.Sequential(
            nn.SiLU(),
            nn.Linear(time_emb_dim, out_ch * 2),
        )
        
        # 卷积层
        self.conv1 = nn.Conv2d(in_ch, out_ch, 3, padding=1)
        self.conv2 = nn.Conv2d(out_ch, out_ch, 3, padding=1)
        
        # AdaGN：自适应归一化（时间步控制）
        self.norm1 = nn.GroupNorm(32, out_ch)
        self.norm2 = nn.GroupNorm(32, out_ch)
        
        # Cross-Attention：文本条件注入
        self.cross_attn = CrossAttention(
            query_dim=out_ch,           # 图像特征
            context_dim=text_dim,       # CLIP 文本特征
            heads=8, dim_head=64
        )
        
        self.skip = nn.Conv2d(in_ch, out_ch, 1) if in_ch != out_ch else nn.Identity()
    
    def forward(self, x, t_emb, text_emb):
        """
        x: [B, C, H, W] 图像特征
        t_emb: [B, D] 时间步嵌入
        text_emb: [B, 77, 768] CLIP 文本嵌入
        """
        # 时间步条件
        time_params = self.time_mlp(t_emb)[:, :, None, None]
        scale, shift = time_params.chunk(2, dim=1)
        
        # 卷积 + AdaGN（时间步控制）
        h = self.conv1(x)
        h = self.norm1(h) * (1 + scale) + shift
        h = torch.nn.functional.silu(h)
        h = self.conv2(h)
        
        # Cross-Attention 文本条件注入
        b, c, hw, ww = h.shape
        h_flat = h.view(b, c, -1).transpose(1, 2)  # [B, H*W, C]
        h_flat = self.cross_attn(h_flat, text_emb)   # ★ 融合点
        h = h_flat.transpose(1, 2).view(b, c, hw, ww)
        
        h = self.norm2(h) * (1 + scale) + shift
        h = torch.nn.functional.silu(h)
        
        return h + self.skip(x)
```

## 2.3 Classifier-Free Guidance (CFG)

CFG 是文本条件扩散模型中最关键的采样技术，控制生成结果**遵循提示词的程度**。

### 2.3.1 核心公式

训练时随机以一定概率（通常 10%）丢弃文本条件，让模型同时学习**条件预测**和**无条件预测**两种模式：

```python
def training_step(batch, text_encoder, unet):
    """
    CFG 训练：随机丢弃文本条件
    """
    images, texts = batch
    text_emb = text_encoder(texts)
    
    # 以 10% 概率丢弃文本条件（unconditional training）
    if random.random() < 0.1:
        text_emb = torch.zeros_like(text_emb)  # 空条件
    
    # 正常扩散训练
    loss = compute_diffusion_loss(unet, images, text_emb)
    return loss
```

采样时，CFG **外推**条件和非条件预测方向：

```python
@torch.no_grad()
def cfg_sampling(unet, latent, text_emb, empty_emb, guidance_scale=7.5):
    """
    CFG 采样：conditioning 和 unconditional 的外推
    
    guidance_scale 越大 → 越严格遵循提示词
      1.0: 无 CFG（纯条件采样）
      3.0: 弱引导
      7.5: SD 默认（效果平衡）
     15.0: 强引导
    """
    # 拼接条件和空条件，一次 forward 同时计算
    emb = torch.cat([empty_emb, text_emb], dim=0)
    latent_double = torch.cat([latent, latent], dim=0)
    
    noise_pred = unet(latent_double, emb)
    
    # 拆分为无条件 + 条件预测
    noise_uncond, noise_cond = noise_pred.chunk(2, dim=0)
    
    # CFG 外推公式
    noise_pred = noise_uncond + guidance_scale * (noise_cond - noise_uncond)
    
    return noise_pred
```

### 2.3.2 CFG 参数的影响

| guidance_scale | 效果 | 适用场景 |
|---------------|------|---------|
| 1.0-2.0 | 自由度极高，多样性好 | 艺术创作、抽象概念 |
| 3.0-5.0 | 中等跟随，保留多样性 | 通用图像生成 |
| 7.0-9.0 | 强跟随，质量稳定 | SD 默认（推荐） |
| 12.0-20.0 | 过饱和、伪影 | 不推荐（除特殊需求） |

## 2.4 完整的文本条件扩散模型

```python
class TextConditionedUNet(nn.Module):
    """
    完整的文生图 UNet
    融合所有文本条件注入技术
    """
    def __init__(self, in_channels=4, model_channels=320, text_dim=768):
        super().__init__()
        self.time_embed = TimeEmbedding(model_channels * 4)
        self.text_encoder = CLIPTextEncoder()
        
        # 输入卷积
        self.input_conv = nn.Conv2d(in_channels, model_channels, 3, padding=1)
        
        # Down blocks (带文本条件)
        self.down_blocks = nn.ModuleList([
            ConditionalResBlock(model_channels, model_channels, model_channels*4, text_dim),
            ConditionalResBlock(model_channels, model_channels*2, model_channels*4, text_dim),
        ])
        
        # Middle block (带 Self-Attention + Cross-Attention)
        self.mid_block = nn.ModuleList([
            ConditionalResBlock(model_channels*2, model_channels*2, model_channels*4, text_dim),
            CrossAttention(model_channels*2, text_dim, heads=8, dim_head=64),
            ConditionalResBlock(model_channels*2, model_channels*2, model_channels*4, text_dim),
        ])
        
        # Up blocks
        self.up_blocks = nn.ModuleList([
            ConditionalResBlock(model_channels*4, model_channels, model_channels*4, text_dim),
            ConditionalResBlock(model_channels*2, model_channels, model_channels*4, text_dim),
        ])
        
        self.output_conv = nn.Sequential(
            nn.GroupNorm(32, model_channels),
            nn.SiLU(),
            nn.Conv2d(model_channels, in_channels, 3, padding=1),
        )
    
    def forward(self, x, t, text_prompts=None):
        """
        x: [B, 4, H, W] 潜空间图像
        t: [B] 时间步
        text_prompts: list[str] 文本提示词
        """
        t_emb = self.time_embed(t)
        
        # 文本编码
        if text_prompts is not None:
            text_emb = self.text_encoder(text_prompts)["token_embeddings"]
        else:
            text_emb = None
        
        # UNet 前向
        h = self.input_conv(x)
        skips = []
        
        for block in self.down_blocks:
            h = block(h, t_emb, text_emb)
            skips.append(h)
        
        for block in self.mid_block:
            if isinstance(block, CrossAttention):
                b, c, hw, ww = h.shape
                h_flat = h.view(b, c, -1).transpose(1, 2)
                h_flat = block(h_flat, text_emb)
                h = h_flat.transpose(1, 2).view(b, c, hw, ww)
            else:
                h = block(h, t_emb, text_emb)
        
        for block in self.up_blocks:
            h = torch.cat([h, skips.pop()], dim=1)
            h = block(h, t_emb, text_emb)
        
        return self.output_conv(h)
```

## 2.5 中文 Prompt 的特殊处理

中文文本条件注入与英文的关键差异：

| 维度 | 英文 | 中文 |
|------|------|------|
| Tokenizer | BPE (CLIP原生) | 需用多语言/中文 CLIP |
| Token长度 | 77 tokens | 相同长度，表达力不同 |
| 语义粒度 | 词级 | 字/词混合 |
| 开源方案 | CLIP 标准 | Chinese-CLIP / AltCLIP |

```python
# 中文 Prompt 的处理方案
class ChinesePromptProcessor:
    """
    中文 Prompt 编码方案一：使用 Chinese-CLIP
    方案二：先翻译为英文再使用标准 CLIP
    """
    def __init__(self, strategy="bilingual"):
        self.strategy = strategy
        if strategy == "chinese_clip":
            self.encoder = CLIPTextModel.from_pretrained(
                "BAAI/Chinese-CLIP-vit-large-patch14"
            )
        elif strategy == "translate":
            from transformers import M2M100Translator
            self.translator = M2M100Translator.from_pretrained(
                "facebook/m2m100_418M"
            )
    
    def encode(self, prompts: list[str]):
        if self.strategy == "translate":
            # 中文 → 英文翻译
            english_prompts = self.translator.translate(
                prompts, src_lang="zh", tgt_lang="en"
            )
            return standard_clip_encode(english_prompts)
        else:
            return chinese_clip_encode(prompts)
```

---

*本章由 Signal 知识平台 AI 智能体自动生成并持续修订。最后更新：2026-06-21*
