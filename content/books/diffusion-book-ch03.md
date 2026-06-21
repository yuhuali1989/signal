---
title: "Diffusion模型文本与多模态融合从入门到精通 - 第3章: 多模态条件融合"
book: "Diffusion模型文本与多模态融合从入门到精通"
chapter: "3"
chapterTitle: "多模态条件融合"
description: "ControlNet（图像条件控制）、IP-Adapter（图像Prompt）、T2I-Adapter、多条件合并、条件特征对齐与融合代码实现"
date: "2026-06-21"
updatedAt: "2026-06-21 12:00"
agent: "研究员→编辑→审校员"
tags:
  - "ControlNet"
  - "IP-Adapter"
  - "T2I-Adapter"
  - "多条件融合"
  - "条件控制"
type: "book"
---

# 第 3 章：多模态条件融合

> 选自《Diffusion模型文本与多模态融合从入门到精通》

## 3.1 ControlNet：图像结构条件控制

ControlNet 通过在 UNet 的编码器层注入**可训练副本**来实现图像结构控制（边缘、深度、姿态等）。

### 3.1.1 架构设计

```
                    文本 Prompt
                        │
                        ▼
┌─────────────────────────────────┐
│       UNet (冻结)                │
│  ┌────────────────────────┐     │
│  │  Encoder Block 1 (冻结) │     │
│  └──────┬─────────────────┘     │
│         │ 特征                     │
│  ┌──────▼─────────────────┐     │
│  │  Encoder Block 2 (冻结) │     │  ← ControlNet 在此注入控制
│  └──────┬─────────────────┘     │        │
│         │                       │        │
│  ┌──────▼─────────────────┐     │  ┌─────┴──────────┐
│  │  Middle Block (冻结)     │     │  │ ControlNet      │
│  └──────┬─────────────────┘     │  │ (可训练副本)     │
│         │                       │  │                 │
│  ┌──────▼─────────────────┐     │  │ Canny/深度/骨架 │
│  │  Decoder Block (冻结)    │     │  │ → Zero Convolution│
│  └──────┬─────────────────┘     │  └─────┬──────────┘
│         │                       │        │
│         ▼                       │        ▼
│  预测噪声                       │  控制信号叠加
└─────────────────────────────────┘
```

```python
class ControlNetBlock(nn.Module):
    """
    ControlNet 的核心：可训练的条件编码分支
    
    关键设计：
    - Zero Convolution：初始化为零的 1×1 卷积
      使得 ControlNet 在训练开始时不影响原 UNet
    - 只训练 ControlNet 分支，UNet 主体冻结
    """
    def __init__(self, in_channels=4, model_channels=320):
        super().__init__()
        
        # 条件输入编码
        self.input_conv = nn.Conv2d(in_channels, model_channels, 3, padding=1)
        
        # 可训练的 UNet 副本（简化的残差块）
        self.blocks = nn.ModuleList([
            ResBlock(model_channels, model_channels, model_channels*4),
            ResBlock(model_channels, model_channels*2, model_channels*4),
            ResBlock(model_channels*2, model_channels*2, model_channels*4),
        ])
        
        # ★ Zero Convolution：初始化为 0 的 1×1 卷积
        # 确保 ControlNet 从零开始逐步学习
        self.zero_convs = nn.ModuleList([
            nn.Conv2d(model_channels, model_channels, 1),
            nn.Conv2d(model_channels*2, model_channels*2, 1),
            nn.Conv2d(model_channels*2, model_channels*2, 1),
        ])
        
        # 初始化 Zero Convolution 权重为 0
        for conv in self.zero_convs:
            nn.init.zeros_(conv.weight)
            nn.init.zeros_(conv.bias)
    
    def forward(self, control_image, t_emb):
        """
        control_image: 预处理后的条件图（Canny/深度/Mask）
                       [B, 3, H, W] (RGB) 或 [B, 1, H, W] (边缘)
        t_emb: 时间步嵌入（与原 UNet 共享）
        """
        h = self.input_conv(control_image)
        features = []
        
        for block, zero_conv in zip(self.blocks, self.zero_convs):
            h = block(h, t_emb)
            # ★ Zero Convolution：控制注入强度从 0 开始学习
            features.append(zero_conv(h))
        
        return features  # 返回多级特征，逐层注入 UNet
```

### 3.1.2 条件图像预处理

不同类型的 ControlNet 条件需要不同的预处理算子：

```python
class ControlNetPreprocessor:
    """
    ControlNet 条件图像预处理
    
    支持的输入类型：
    - canny: Canny边缘检测
    - depth: MiDaS 深度估计
    - hed: HED 软边缘
    - openpose: 人体骨架
    - mlsd: 线段检测
    - scribble: 涂鸦
    """
    def __init__(self, control_type="canny"):
        self.control_type = control_type
        self.preprocessors = {
            "canny": self._canny,
            "depth": self._depth,
            "hed": self._hed,
        }
    
    def _canny(self, image, low=100, high=200):
        """Canny 边缘检测"""
        gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        edges = cv2.Canny(blurred, low, high)
        return torch.from_numpy(edges).float() / 255.0
    
    def _depth(self, image):
        """深度估计（使用 MiDaS）"""
        import torchvision.transforms as T
        midas = torch.hub.load("intel-isl/MiDaS", "MiDaS_small")
        transform = T.Compose([
            T.ToTensor(),
            T.Resize((384, 384)),
            T.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ])
        return midas(transform(image).unsqueeze(0))
    
    def __call__(self, image):
        return self.preprocessors[self.control_type](image)
```

## 3.2 IP-Adapter：图像 Prompt 注入

IP-Adapter 实现了"以图生图"——直接将图像作为条件（而非文本）来控制生成。

### 3.2.1 核心设计

```
图像条件注入流程：

┌────────────┐
│ 参考图像    │
└──────┬─────┘
       │
┌──────▼─────┐
│ CLIP Vision │  → image_embedding [1, 257, 768]
│ Encoder     │
└──────┬─────┘
       │
┌──────▼─────┐
│ IP-Adapter  │  → decoupled cross-attention
│ (小型Transformer)  ← 可训练模块
└──────┬─────┘
       │
       ▼
    UNet Decoupled Cross-Attention:
    
    原始 Cross-Attn: Q=f_img, K=text, V=text
    IP-Adapter:     Q=f_img, K=image, V=image  (与文本并行！)
    
    最终: attn_combined = attn_text + attn_image * scale
```

```python
class IPAdapter(nn.Module):
    """
    IP-Adapter：图像条件注入器
    
    关键创新：解耦的 Cross-Attention
    - 文本 Cross-Attention 和 图像 Cross-Attention 并行
    - 最后相加融合
    - 只有 IP-Adapter 模块可训练，UNet 主体冻结
    """
    def __init__(self, unet_channels=320, image_emb_dim=768, heads=8):
        super().__init__()
        
        # 图像嵌入投影（将 CLIP ViT 输出映射到 UNet 通道）
        self.image_proj = nn.Sequential(
            nn.Linear(image_emb_dim, unet_channels * 4),
            nn.GELU(),
            nn.Linear(unet_channels * 4, unet_channels),
        )
        
        # 解耦的 Cross-Attention（只关注图像特征）
        self.cross_attn = CrossAttention(
            query_dim=unet_channels,
            context_dim=unet_channels,  # 投影后的图像嵌入维度
            heads=heads,
            dim_head=64,
        )
        
        # 图像条件缩放因子
        # scale=0 时 → 完全无IP-Adapter效果
        # scale=1.0 → 标准效果
        self.scale = nn.Parameter(torch.tensor(0.0))
    
    def forward(self, hidden_states, image_embeds, text_attn_out, scale=1.0):
        """
        hidden_states: UNet 中间特征 [B, C, H, W]
        image_embeds: CLIP 图像嵌入 [B, 257, 768]
        text_attn_out: 文本 Cross-Attention 的输出
        scale: 图像条件强度
        """
        # 投影图像嵌入
        img_context = self.image_proj(image_embeds)  # [B, 257, C]
        
        # 图像 Cross-Attention
        b, c, h, w = hidden_states.shape
        h_flat = hidden_states.view(b, c, -1).transpose(1, 2)  # [B, H*W, C]
        img_attn_out = self.cross_attn(h_flat, img_context)     # [B, H*W, C]
        
        # ★ 文本 + 图像 解耦融合
        # 文本CA的输出 + 图像CA的输出 × scale
        combined = text_attn_out + self.scale * scale * img_attn_out
        
        return combined.view(b, c, h, w).transpose(1, 2)
```

## 3.3 多条件融合策略

### 3.3.1 条件合并方式对比

| 方案 | 原理 | 优点 | 缺点 | 典型模型 |
|------|------|------|------|---------|
| **特征级联** | 在通道维度拼接多个条件特征 | 实现简单 | 维度爆炸 | ControlNet |
| **注意力合并** | 不同条件的 Attention 输出加权和 | 灵活控制强度 | 计算量大 | IP-Adapter |
| **交叉注意力组合** | 将文本和图像作为 K/V 同时注入 | 语义对齐好 | 训练复杂 | MIX-of-Show |
| **分步引导** | 不同条件分步/分区生��� | 精细控制 | 流程复杂 | Multi-ControlNet |

### 3.3.2 Multi-ControlNet 实现

```python
class MultiControlNet(nn.Module):
    """
    多条件 ControlNet：同时接受边缘、深度、姿态等条件
    每个条件有独立的 ControlNet 分支，最终特征求和
    """
    def __init__(self, control_types=["canny", "depth"], model_channels=320):
        super().__init__()
        self.control_nets = nn.ModuleList([
            ControlNetBlock(model_channels=model_channels)
            for _ in control_types
        ])
        self.control_types = control_types
        self.preprocessors = ControlNetPreprocessor()
    
    def forward(self, control_images: dict, t_emb):
        """
        control_images: {"canny": canny_img, "depth": depth_img}
        """
        all_features = []
        for ctrl_type, ctrl_net in zip(self.control_types, self.control_nets):
            if ctrl_type in control_images:
                features = ctrl_net(control_images[ctrl_type], t_emb)
                all_features.append(features)
        
        # ★ 逐层求和：同一层级的条件特征直接相加
        merged_features = []
        for layer_idx in range(len(all_features[0])):
            layer_sum = sum(f[layer_idx] for f in all_features)
            merged_features.append(layer_sum)
        
        return merged_features

# 使用示例
def multi_control_generate(
    model, prompt, canny_image, depth_image,
    guidance_scale=7.5, controlnet_scale=1.0
):
    """
    多条件文生图：同时使用 Canny 边缘 + 深度图
    """
    # 多条件 ControlNet
    control_images = {"canny": canny_image, "depth": depth_image}
    control_features = multi_control_net(control_images, t_emb)
    
    # 文本条件
    text_emb = text_encoder(prompt)
    
    # UNet 前向（同时注入文本 + 多控制条件）
    noise_pred = unet(
        latent, t_emb, text_emb,
        control_features=control_features,
        controlnet_scale=controlnet_scale
    )
    
    return noise_pred
```

## 3.4 条件特征对齐

多模态条件融合的核心挑战是不同的条件模态（文本、图像、边缘、深度）**语义空间不一致**。解决方案是**投影到统一空间**：

```python
class UnifiedConditionProjector(nn.Module):
    """
    统一条件投影：将所有条件映射到同一语义空间
    
    输入模态：
    - 文本: CLIP [B, 77, 768]
    - 图像: CLIP ViT [B, 257, 768]
    - 控制: ControlNet 特征 [B, C, H, W]
    """
    def __init__(self, unified_dim=768):
        super().__init__()
        
        # 各模态到统一空间的投影
        self.text_proj = nn.Linear(768, unified_dim)
        self.image_proj = nn.Linear(768, unified_dim)
        self.control_proj = nn.Conv2d(320, unified_dim, 1)
        
        # 跨模态注意力融合
        self.cross_fusion = CrossAttention(
            query_dim=unified_dim,
            context_dim=unified_dim * 3,  # 拼接所有模态
            heads=8, dim_head=64
        )
    
    def forward(self, text_emb, image_emb, control_feat):
        """
        对齐并融合多模态条件
        """
        # 统一投影
        text = self.text_proj(text_emb)      # [B, 77, U]
        image = self.image_proj(image_emb)    # [B, 257, U]
        control = self.control_proj(control_feat)  # [B, U, H, W]
        control_flat = control.flatten(2).transpose(1, 2)  # [B, H*W, U]
        
        # 拼接所有条件
        all_conditions = torch.cat([text, image, control_flat], dim=1)
        
        # 跨模态融合（以文本为 query）
        fused = self.cross_fusion(text, all_conditions)
        
        return fused  # 融合后的多模态条件
```

---

*本章由 Signal 知识平台 AI 智能体自动生成并持续修订。最后更新：2026-06-21*
