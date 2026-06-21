---
title: "Diffusion模型文本与多模态融合从入门到精通 - 第7章: 推理优化与部署"
book: "Diffusion模型文本与多模态融合从入门到精通"
chapter: "7"
chapterTitle: "推理优化与部署"
description: "加速采样(DDIM/DPM-Solver)、模型量化和导出(ONNX/TensorRT)、完整推理Pipeline实现、多模态条件推理部署"
date: "2026-06-21"
updatedAt: "2026-06-21 12:00"
agent: "研究员→编辑→审校员"
tags:
  - "推理优化"
  - "DDIM"
  - "DPM-Solver"
  - "TensorRT"
  - "部署"
type: "book"
---

# 第 7 章：推理优化与部署

> 选自《Diffusion模型文本与多模态融合从入门到精通》

## 7.1 加速采样算法

DDPM 需要 1000 步推理，通过改进的采样器可以将步数降到 10-50 步。

### 7.1.1 DDIM

```python
@torch.no_grad()
def ddim_sample(model, shape, num_steps=50, device='cuda'):
    """
    DDIM 采样：50 步即可达到 DDPM 1000 步质量
    """
    timesteps = torch.linspace(999, 0, num_steps, device=device).long()
    betas = cosine_beta_schedule(1000).to(device)
    alphas = 1 - betas
    alphas_cumprod = torch.cumprod(alphas, dim=0)
    
    x = torch.randn(shape, device=device)
    for i in range(len(timesteps)):
        t = timesteps[i]
        t_prev = timesteps[i-1] if i > 0 else -1
        t_tensor = torch.full((shape[0],), t, device=device)
        noise_pred = model(x, t_tensor)
        
        alpha_bar_t = alphas_cumprod[t]
        alpha_bar_t_prev = alphas_cumprod[t_prev] if t_prev >= 0 else 1.0
        
        x0_pred = (x - (1 - alpha_bar_t) ** 0.5 * noise_pred) / alpha_bar_t ** 0.5
        x0_pred = torch.clamp(x0_pred, -1, 1)
        
        x = alpha_bar_t_prev ** 0.5 * x0_pred + \
            (1 - alpha_bar_t_prev) ** 0.5 * noise_pred
    return x

## 7.2 模型量化

```python
# FP16 量化（无损，2×显存节省）
unet_fp16 = unet.half()

# 导出 ONNX
def export_to_onnx(unet, path="unet.onnx"):
    dummy_input = torch.randn(1, 4, 64, 64)
    dummy_t = torch.randint(0, 1000, (1,))
    torch.onnx.export(
        unet, (dummy_input, dummy_t), path,
        input_names=["latent", "timestep"],
        output_names=["noise_pred"],
        opset_version=17,
    )
```

## 7.3 完整推理 Pipeline

```python
class DiffusionPipeline:
    """
    完整文生图推理：文本编码 + CFG采样 + VAE解码
    支持 ControlNet + IP-Adapter 多模态条件
    """
    def __init__(self, unet, vae_decoder, text_encoder,
                 controlnet=None, ip_adapter=None):
        self.unet = unet
        self.vae_decoder = vae_decoder
        self.text_encoder = text_encoder
        self.controlnet = controlnet
        self.ip_adapter = ip_adapter
    
    @torch.no_grad()
    def __call__(self, prompt, negative_prompt="", steps=20,
                 guidance_scale=7.5, control_image=None, seed=None):
        if seed: torch.manual_seed(seed)
        
        # 文本编码
        text_emb = self.text_encoder([prompt])["token_embeddings"]
        empty_emb = self.text_encoder([negative_prompt])["token_embeddings"]
        
        # 初始噪声
        latent = torch.randn(1, 4, 64, 64)
        
        # DDIM 采样（含 CFG）
        timesteps = torch.linspace(999, 0, steps).long()
        for t in timesteps:
            t_tensor = torch.full((1,), t)
            
            # CFG 预测
            emb = torch.cat([empty_emb, text_emb])
            noise_pred = self.unet(
                torch.cat([latent, latent]), t_tensor, emb
            )
            noise_uncond, noise_cond = noise_pred.chunk(2)
            noise_pred = noise_uncond + guidance_scale * (noise_cond - noise_uncond)
            
            # 去噪
            alpha_bar_t = alphas_cumprod[t]
            alpha_bar_t_prev = alphas_cumprod[t-1] if t > 0 else 1.0
            x0_pred = (latent - (1-alpha_bar_t)**0.5*noise_pred) / alpha_bar_t**0.5
            latent = alpha_bar_t_prev**0.5 * x0_pred + \
                     (1-alpha_bar_t_prev)**0.5 * noise_pred
        
        # VAE 解码
        image = self.vae_decoder(latent)
        return (image + 1) / 2  # [-1,1] → [0,1]

# 使用示例
pipe = DiffusionPipeline(unet, vae_decoder, text_encoder)
image = pipe("a cute cat", steps=20, guidance_scale=7.5)
```

## 7.4 多模态条件推理数据流

```
文本 Prompt ──► CLIP Text Encoder ──► text_emb
                                            │
参考图 ──► IP-Adapter ──► image_emb ────────┤
                                            │
边缘图 ──► ControlNet ──► control_features ──► UNet ──► noise
                                            │
随机噪声 ──► latent ──► CFG采样(DDIM/DPM) ──┘
                                            │
                                            ▼
                                       VAE Decoder ──► 最终图像
```
