---
title: "Diffusion模型文本与多模态融合从入门到精通 - 第4章: 潜空间扩散与VAE编解码"
book: "Diffusion模型文本与多模态融合从入门到精通"
chapter: "4"
chapterTitle: "潜空间扩散与VAE编解码"
description: "VAE图像压缩、潜空间文本-图像融合、多模态Token混合序列、双流到单流架构、完整编解码代码"
date: "2026-06-21"
updatedAt: "2026-06-21 12:00"
agent: "研究员→编辑→审校员"
tags:
  - "VAE"
  - "潜空间"
  - "图像编码"
  - "Token混合"
  - "扩散Transformer"
type: "book"
---

# 第 4 章：潜空间扩散与VAE编解码

> 选自《Diffusion模型文本与多模态融合从入门到精通》

## 4.1 VAE 图像压缩

Stable Diffusion 不是在像素空间而是在潜空间做扩散——这使得计算量大幅降低（SD 的潜空间是 512×512 → 64×64）。

### 4.1.1 VAE 架构

```
┌─────────────────────────────────┐
│             VAE Encoder          │
│  像素空间 → 潜空间（压缩比 48×）   │
│                                 │
│ 输入图像: [B, 3, 512, 512]      │
│         ↓                       │
│    Conv2d 下采样 ×3             │
│         ↓                       │
│    ResBlocks                    │
│         ↓                       │
│    Conv2d → mean, logvar        │
│         ↓                       │
│    reparameterize               │
│         ↓                       │
│ 输出 latent: [B, 4, 64, 64]     │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│             VAE Decoder          │
│  潜空间 → 像素空间               │
│                                 │
│ 输入 latent: [B, 4, 64, 64]     │
│         ↓                       │
│    ConvTranspose2d 上采样 ×3    │
│         ↓                       │
│    ResBlocks                    │
│         ↓                       │
│    Conv2d → RGB                 │
│         ↓                       │
│ 输出图像: [B, 3, 512, 512]      │
└─────────────────────────────────┘
```

```python
class VAEEncoder(nn.Module):
    """
    VAE 编码器：将像素图像压缩到潜空间
    
    关键参数：
    - latent_channels: 潜空间通道数（SD: 4, SDXL: 4, Flux: 16）
    - compression_factor: 压缩比（SD: 8, SDXL: 8, Flux: 8）
    """
    def __init__(self, in_channels=3, latent_channels=4, base_ch=128):
        super().__init__()
        
        # 下采样块：3×512 → 64
        self.down = nn.ModuleList([
            nn.Sequential(
                nn.Conv2d(in_channels, base_ch, 3, stride=1, padding=1),
                nn.GroupNorm(32, base_ch),
                nn.SiLU(),
                nn.Conv2d(base_ch, base_ch, 3, stride=2, padding=1),  # 256
            ),
            nn.Sequential(
                nn.Conv2d(base_ch, base_ch * 2, 3, stride=1, padding=1),
                nn.GroupNorm(32, base_ch * 2),
                nn.SiLU(),
                nn.Conv2d(base_ch * 2, base_ch * 2, 3, stride=2, padding=1),  # 128
            ),
            nn.Sequential(
                nn.Conv2d(base_ch * 2, base_ch * 4, 3, stride=1, padding=1),
                nn.GroupNorm(32, base_ch * 4),
                nn.SiLU(),
                nn.Conv2d(base_ch * 4, base_ch * 4, 3, stride=2, padding=1),  # 64
            ),
        ])
        
        # 潜空间输出
        self.final = nn.Sequential(
            nn.GroupNorm(32, base_ch * 4),
            nn.SiLU(),
            nn.Conv2d(base_ch * 4, latent_channels * 2, 3, padding=1),  # mean + logvar
        )
    
    def forward(self, x):
        """x: [B, 3, H, W] → latent: [B, 4, H/8, W/8]"""
        h = x
        for block in self.down:
            h = block(h)
        h = self.final(h)
        mean, logvar = h.chunk(2, dim=1)
        
        # 重参数化 (reparameterization trick)
        std = torch.exp(0.5 * logvar)
        eps = torch.randn_like(std)
        latent = mean + eps * std
        
        # ★ SD 潜空间缩放因子（稳定训练）
        latent = latent * 0.18215
        
        return latent, mean, logvar

class VAEDecoder(nn.Module):
    """VAE 解码器：潜空间 → 像素空间"""
    def __init__(self, latent_channels=4, out_channels=3, base_ch=128):
        super().__init__()
        
        self.input = nn.Conv2d(latent_channels, base_ch * 4, 3, padding=1)
        
        self.up = nn.ModuleList([
            nn.Sequential(
                nn.Upsample(scale_factor=2, mode='nearest'),  # 128
                nn.Conv2d(base_ch * 4, base_ch * 2, 3, padding=1),
                nn.GroupNorm(32, base_ch * 2),
                nn.SiLU(),
            ),
            nn.Sequential(
                nn.Upsample(scale_factor=2, mode='nearest'),  # 256
                nn.Conv2d(base_ch * 2, base_ch, 3, padding=1),
                nn.GroupNorm(32, base_ch),
                nn.SiLU(),
            ),
            nn.Sequential(
                nn.Upsample(scale_factor=2, mode='nearest'),  # 512
                nn.Conv2d(base_ch, base_ch, 3, padding=1),
                nn.GroupNorm(32, base_ch),
                nn.SiLU(),
            ),
        ])
        
        self.output = nn.Conv2d(base_ch, out_channels, 3, padding=1)
    
    def forward(self, latent):
        """latent: [B, 4, 64, 64] → [B, 3, 512, 512]"""
        h = self.input(latent / 0.18215)  # 反向缩放
        for block in self.up:
            h = block(h)
        return torch.tanh(self.output(h))

# 使用示例：图像编解码流水线
vae_encoder = VAEEncoder()
vae_decoder = VAEDecoder()

# 编码（图像 → 潜空间）
image = torch.randn(1, 3, 512, 512)
latent, _, _ = vae_encoder(image)  # [1, 4, 64, 64]

# 在潜空间做扩散（SD 的核心）
# ... (diffusion process on latent)

# 解码（潜空间 → 图像）
reconstructed = vae_decoder(latent)  # [1, 3, 512, 512]
```

## 4.2 潜空间文本-图像融合

在潜空间做扩散的根本优势：**文本条件和多模态特征可以直接在潜空间融合**。

### 4.2.1 SD 的潜空间融合架构

```
                潜空间图像: [B, 4, 64, 64]
                       │
                       ▼
         ┌───────────────────────────┐
         │     UNet (在潜空间做扩散)   │
         │                           │
         │  ┌─────────────────┐      │
         │  │  Cross-Attention │      │ ← 文本注入
         │  │  Q=图像 K=V=文本  │      │
         │  └─────────────────┘      │
         │                           │
         │  ┌─────────────────┐      │
         │  │  ControlNet     │      │ ← 图像结构注入
         │  │  条件特征相加     │      │
         │  └─────────────────┘      │
         │                           │
         │  ┌─────────────────┐      │
         │  │  IP-Adapter     │      │ ← 图像语义注入
         │  │  解耦Cross-Attn │      │
         │  └─────────────────┘      │
         └───────────────────────────┘
```

### 4.2.2 扩散 Transformer (DiT)

在最新的扩散模型中（如 SD3、Flux、Sora），UNet 被 **Diffusion Transformer (DiT)** 替代，多模态融合变为**统一的 Token 序列处理**：

```python
class DiTBlock(nn.Module):
    """
    Diffusion Transformer Block
    
    所有模态统一为 Token 序列，通过 Self-Attention 自然融合：
    输入序列: [text_tokens, image_tokens, control_tokens, ...]
              [77 tokens, 1024 tokens, 256 tokens, ...]
    
    输出：融合了所有模态信息的 Token 序列
    """
    def __init__(self, hidden_size=1024, num_heads=16):
        super().__init__()
        self.norm1 = nn.LayerNorm(hidden_size)
        self.attn = nn.MultiheadAttention(hidden_size, num_heads, batch_first=True)
        self.norm2 = nn.LayerNorm(hidden_size)
        self.mlp = nn.Sequential(
            nn.Linear(hidden_size, hidden_size * 4),
            nn.GELU(),
            nn.Linear(hidden_size * 4, hidden_size),
        )
        
        # 时间步调节（AdaIN）
        self.adaLN = nn.Sequential(
            nn.SiLU(),
            nn.Linear(hidden_size, hidden_size * 6),  # scale_shift for 3 norms
        )
    
    def forward(self, x, t_emb):
        """
        x: [B, N_total, D] 所有模态的混合 Token 序列
           N_total = N_text + N_image + N_control + ...
        t_emb: [B, D] 时间步嵌入
        """
        shift_msa, scale_msa, gate_msa, shift_mlp, scale_mlp, gate_mlp = \
            self.adaLN(t_emb).chunk(6, dim=1)
        
        # Self-Attention（处理所有模态）
        x = x + gate_msa.unsqueeze(1) * self.attn(
            modulate(self.norm1(x), shift_msa, scale_msa)
        )[0]
        
        # MLP
        x = x + gate_mlp.unsqueeze(1) * self.mlp(
            modulate(self.norm2(x), shift_mlp, scale_mlp)
        )
        
        return x

def modulate(x, shift, scale):
    return x * (1 + scale.unsqueeze(1)) + shift.unsqueeze(1)

class MultimodalTokenMixer(nn.Module):
    """
    多模态 Token 混合器：将不同模态的 Token 拼接为统一序列
    
    输入:
    - text_tokens: [B, 77, 768] CLIP文本嵌入
    - image_tokens: [B, 1024, 768] 图像Patch嵌入
    - control_tokens: [B, 512, 768] 控制条件嵌入
    
    输出:
    - mixed_sequence: [B, 77+1024+512, D]
    - modality_mask: [B, N_total] 用于标识每个Token所属模态
    """
    def __init__(self, token_dims={"text": 768, "image": 768, "control": 768},
                 hidden_size=1024):
        super().__init__()
        self.projectors = nn.ModuleDict({
            name: nn.Linear(dim, hidden_size)
            for name, dim in token_dims.items()
        })
    
    def forward(self, tokens_dict: dict, return_mask=True):
        """
        tokens_dict: {"text": [B, 77, 768], "image": [B, 1024, 768]}
        """
        projected = []
        for name, tokens in tokens_dict.items():
            proj = self.projectors[name](tokens)
            projected.append(proj)
        
        # 在序列维度拼接
        mixed = torch.cat(projected, dim=1)  # [B, N_total, D]
        
        if return_mask:
            # 生成模态掩码：0=text, 1=image, 2=control, ...
            lengths = [t.shape[1] for t in projected]
            mask = torch.cat([
                torch.full((1, l), i, device=mixed.device)
                for i, l in enumerate(lengths)
            ], dim=1)
            return mixed, mask
        
        return mixed
```

## 4.3 图文交错序列（Chameleon 方案）

Chameleon 采用完全不同的思路——将图像**量化为离散Token**，与文本Token拼成**统一序列**，用因果语言模型统一建模。

```
图文交错序列示例：
[文本Token: "A", "photo", "of", <IMG>, 图像Token: v1, v2, ..., v1024, <EOS>]

图像量化过程：

原始图像 [3, 512, 512]
        │
        ▼
┌────────────────────────────┐
│  VQ-VAE Encoder             │
│  下采样 + 离散化             │
│  编码本大小: 8192           │
└──────────┬─────────────────┘
           │
           ▼
输出: [1024] uint16 tokens  ← 每个 token 是编码本索引
                               范围 [0, 8191]
                               与文本 token 完全兼容！
```

```python
class VQVAETokenizer(nn.Module):
    """
    VQ-VAE：将图像量化为离散 Token
    
    输出的图像 Token 与文本 Token 共享同一序列空间
    两者合并后可以被统一的自回归模型处理
    """
    def __init__(self, vocab_size=8192, latent_dim=256):
        super().__init__()
        self.encoder = VAEEncoder(latent_channels=latent_dim)
        self.codebook = nn.Embedding(vocab_size, latent_dim)  # 可学习编码本
        self.decoder = VAEDecoder(latent_channels=latent_dim)
        
        # 编码本中的每个向量代表一个"视觉单词"
        # 训练时使用 straight-through estimator
    
    def encode_to_tokens(self, image):
        """图像 → 离散 Token 序列"""
        latent, _, _ = self.encoder(image)  # [B, 256, 16, 16]
        
        # 在编码本中查找最近邻
        flat = latent.flatten(2).transpose(1, 2)  # [B, 256, 256]
        codebook = self.codebook.weight  # [8192, 256]
        
        # 最近邻搜索
        distances = torch.cdist(flat, codebook)  # [B, 256, 8192]
        indices = distances.argmin(dim=-1)  # [B, 256]
        
        return indices  # 离散图像 Token
    
    def tokens_to_image(self, indices):
        """离散 Token → 图像"""
        vectors = self.codebook(indices)  # [B, 256, 256]
        latent = vectors.transpose(1, 2).view(-1, 256, 16, 16)
        return self.decoder(latent)

# 图文统一序列构建
def build_multimodal_sequence(text_tokens, image_tokens, num_image_tokens=256):
    """
    构建图文交错的统一 Token 序列
    
    序列格式：
    [text_token_1, ..., text_token_n, 
     <img_start>, image_token_1, ..., image_token_m, 
     text_token_n+1, ..., <eos>]
    """
    IMG_START_ID = 8192  # 特殊标记
    IMG_END_ID = 8193
    
    sequence = []
    for text, img_tokens in zip(text_tokens, image_tokens):
        seq = text.tolist()
        # 在第一个图像位置插入图像 Token
        img_pos = seq.index(IMG_START_ID) if IMG_START_ID in seq else len(seq)
        seq = seq[:img_pos] + [IMG_START_ID] + img_tokens.tolist() + \
              [IMG_END_ID] + seq[img_pos+1:]
        sequence.append(seq)
    
    return torch.tensor(sequence)
```

---

*本章由 Signal 知识平台 AI 智能体自动生成并持续修订。最后更新：2026-06-21*
