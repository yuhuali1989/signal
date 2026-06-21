---
title: "Diffusion模型文本与多模态融合从入门到精通 - 第1章: 扩散模型基础原理"
book: "Diffusion模型文本与多模态融合从入门到精通"
chapter: "1"
chapterTitle: "扩散模型基础原理"
description: "DDPM数学原理、前向扩散与逆向去噪过程、UNet架构详解、噪声调度器设计、完整训练与采样代码"
date: "2026-06-21"
updatedAt: "2026-06-21 12:00"
agent: "研究员→编辑→审校员"
tags:
  - "Diffusion"
  - "DDPM"
  - "UNet"
  - "噪声调度"
  - "生成模型"
type: "book"
---

# 第 1 章：扩散模型基础原理

> 选自《Diffusion模型文本与多模态融合从入门到精通》

## 1.1 扩散模型的数学原理

扩散模型（Diffusion Models）的核心思想：**逐步向数据添加噪声（前向过程），然后学习逆向去噪（逆向过程）。**

### 1.1.1 前向扩散过程

给定真实数据分布 $x_0 \sim q(x)$，定义一个马尔可夫链逐步添加高斯噪声：

$$q(x_t|x_{t-1}) = \mathcal{N}(x_t; \sqrt{1-\beta_t}x_{t-1}, \beta_t\mathbf{I})$$

其中 $\beta_t$ 是噪声调度（noise schedule），控制每一步添加的噪声量。

**关键性质**：可以直接从 $x_0$ 计算任意 $t$ 步的 $x_t$，无需迭代：

$$x_t = \sqrt{\bar{\alpha}_t}x_0 + \sqrt{1-\bar{\alpha}_t}\epsilon, \quad \epsilon \sim \mathcal{N}(0, \mathbf{I})$$

其中 $\alpha_t = 1-\beta_t$, $\bar{\alpha}_t = \prod_{s=1}^t \alpha_s$。

```python
# 前向扩散：直接从 x0 跳到 xt
import torch
import numpy as np

def forward_diffusion(x0, t, sqrt_alphas_cumprod, sqrt_one_minus_alphas_cumprod):
    """
    x0: [B, C, H, W] 原始图像
    t: [B] 时间步
    返回: xt, noise
    """
    noise = torch.randn_like(x0)
    sqrt_alpha_bar = sqrt_alphas_cumprod[t].view(-1, 1, 1, 1)
    sqrt_one_minus = sqrt_one_minus_alphas_cumprod[t].view(-1, 1, 1, 1)
    xt = sqrt_alpha_bar * x0 + sqrt_one_minus * noise
    return xt, noise
```

### 1.1.2 逆向去噪过程

模型学习预测添加的噪声 $\epsilon_\theta(x_t, t)$，然后用预测的噪声重建 $x_0$：

$$p_\theta(x_{t-1}|x_t) = \mathcal{N}(x_{t-1}; \mu_\theta(x_t, t), \sigma_t^2\mathbf{I})$$

简化后的训练目标（DDPM）：

$$L_{\text{simple}} = \mathbb{E}_{t, x_0, \epsilon}\left[ \|\epsilon - \epsilon_\theta(x_t, t)\|^2 \right]$$

```python
# 训练损失
def diffusion_loss(model, x0, t, sqrt_alphas_cumprod, sqrt_one_minus_alphas_cumprod):
    xt, noise = forward_diffusion(x0, t, sqrt_alphas_cumprod, sqrt_one_minus_alphas_cumprod)
    predicted_noise = model(xt, t)  # UNet 预测噪声
    loss = torch.nn.functional.mse_loss(predicted_noise, noise)
    return loss
```

### 1.1.3 采样（逆向过程）

训练完成后，从随机噪声逐步去噪生成图像：

```python
@torch.no_grad()
def ddpm_sample(model, shape, num_steps=1000, betas, device='cuda'):
    """
    DDPM 采样：从纯噪声 x_T 逐步去噪到 x_0
    """
    x = torch.randn(shape, device=device)
    
    for t in reversed(range(num_steps)):
        t_tensor = torch.full((shape[0],), t, device=device, dtype=torch.long)
        
        # 预测噪声
        predicted_noise = model(x, t_tensor)
        
        # 计算 x_{t-1}
        alpha_t = 1 - betas[t]
        sqrt_alpha_t = alpha_t ** 0.5
        sqrt_one_minus_alpha_t = betas[t] ** 0.5
        
        # DDPM 更新公式
        x = (1 / sqrt_alpha_t) * (x - (1 - alpha_t) / sqrt_one_minus_alpha_t * predicted_noise)
        
        # 添加噪声（t > 0 时）
        if t > 0:
            noise = torch.randn_like(x) * (betas[t] ** 0.5)
            x = x + noise
    
    return x
```

## 1.2 噪声调度器（Noise Scheduler）

噪声调度是扩散模型的关键超参数，控制去噪过程的节奏。

| 调度器 | 公式 | 特点 | 适用模型 |
|-------|------|------|---------|
| **Linear** | $\beta_t = \text{linear}(1e^{-4}, 0.02)$ | 经典DDPM，噪声增长均匀 | DDPM |
| **Cosine** | $\bar{\alpha}_t = \cos^2(\frac{t/T + s}{1+s} \cdot \frac{\pi}{2})$ | 避免后期噪声过大，生成质量更高 | Improved DDPM |
| **Sigmoid** | $\beta_t = \text{sigmoid}(\text{linear})$ | 两端噪声变化慢中间快 | 自定义 |
| **Scaled Linear** | 线性 × 缩放因子 | SD 系列默认 | Stable Diffusion |

```python
# Cosine 噪声调度器（最常用）
def cosine_beta_schedule(timesteps=1000, s=0.008):
    """
    Cosine schedule: 在中间步长噪声增长最陡，两端平缓
    """
    steps = timesteps + 1
    t = torch.linspace(0, timesteps, steps) / timesteps
    alphas_cumprod = torch.cos((t + s) / (1 + s) * torch.pi * 0.5) ** 2
    alphas_cumprod = alphas_cumprod / alphas_cumprod[0]
    betas = 1 - alphas_cumprod[1:] / alphas_cumprod[:-1]
    return torch.clamp(betas, max=0.999)
```

## 1.3 UNet 架构

UNet 是扩散模型的核心网络架构，负责预测每个时间步的噪声。

```
输入: xt [B, C, H, W] + time embedding
              │
         ┌────┴────┐
         │  Conv2d │
         │  SiLU   │
         └────┬────┘
              │
    ┌─────────┴─────────┐
    │   Down Block 1     │  → 残差连接 → Up Block 1
    │   [B, 64, H, W]   │                 [B, 64, H, W]
    └─────────┬─────────┘
              │
    ┌─────────┴─────────┐
    │   Down Block 2     │  → 残差连接 → Up Block 2
    │   [B, 128, H/2, W/2]│                 [B, 128, H/2, W/2]
    └─────────┬─────────┘
              │
    ┌─────────┴─────────┐
    │   Middle Block     │
    │   Self-Attention   │
    └────────────────────┘
```

```python
# 简化的 UNet 实现（核心模块）
import torch.nn as nn

class TimeEmbedding(nn.Module):
    """Sinusoidal 时间步嵌入 + MLP 映射"""
    def __init__(self, dim):
        super().__init__()
        self.dim = dim
        self.mlp = nn.Sequential(
            nn.Linear(dim, dim * 4),
            nn.SiLU(),
            nn.Linear(dim * 4, dim),
        )
    
    def forward(self, t):
        half_dim = self.dim // 2
        emb = torch.log(torch.tensor(10000.)) / (half_dim - 1)
        emb = torch.exp(torch.arange(half_dim, device=t.device) * -emb)
        emb = t[:, None].float() * emb[None, :]
        emb = torch.cat([torch.sin(emb), torch.cos(emb)], dim=-1)
        return self.mlp(emb)

class ResBlock(nn.Module):
    """残差块：卷积 + 时间嵌入投影 + 跳跃连接"""
    def __init__(self, in_ch, out_ch, time_emb_dim):
        super().__init__()
        self.conv1 = nn.Conv2d(in_ch, out_ch, 3, padding=1)
        self.conv2 = nn.Conv2d(out_ch, out_ch, 3, padding=1)
        self.time_proj = nn.Linear(time_emb_dim, out_ch)
        self.skip = nn.Conv2d(in_ch, out_ch, 1) if in_ch != out_ch else nn.Identity()
    
    def forward(self, x, t_emb):
        h = torch.nn.functional.silu(self.conv1(x))
        h = h + self.time_proj(t_emb)[:, :, None, None]
        h = torch.nn.functional.silu(self.conv2(h))
        return h + self.skip(x)
```

## 1.4 完整训练脚本

```python
# 训练一个简单的 DDPM
def train_ddpm(model, dataloader, num_epochs=100, lr=1e-4):
    optimizer = torch.optim.AdamW(model.parameters(), lr=lr)
    betas = cosine_beta_schedule(timesteps=1000)
    alphas = 1 - betas
    alphas_cumprod = torch.cumprod(alphas, dim=0)
    sqrt_alphas_cumprod = alphas_cumprod ** 0.5
    sqrt_one_minus_alphas_cumprod = (1 - alphas_cumprod) ** 0.5
    
    for epoch in range(num_epochs):
        for batch in dataloader:
            x0 = batch.to('cuda')
            batch_size = x0.shape[0]
            t = torch.randint(0, 1000, (batch_size,), device='cuda')
            
            # 前向扩散
            xt, noise = forward_diffusion(x0, t, sqrt_alphas_cumprod, sqrt_one_minus_alphas_cumprod)
            
            # 预测噪声
            predicted_noise = model(xt, t)
            
            # 损失
            loss = torch.nn.functional.mse_loss(predicted_noise, noise)
            
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()
        
        if epoch % 10 == 0:
            print(f"Epoch {epoch}, Loss: {loss.item():.6f}")
```

---

*本章由 Signal 知识平台 AI 智能体自动生成并持续修订。最后更新：2026-06-21*
