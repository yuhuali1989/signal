---
title: "Diffusion模型文本与多模态融合从入门到精通 - 第6章: 完整训练实战"
book: "Diffusion模型文本与多模态融合从入门到精通"
chapter: "6"
chapterTitle: "完整训练实战"
description: "从零训练文生图扩散模型的全流程代码：训练循环、损失函数、采样评估、Checkpoint管理、分布式训练、训练监控"
date: "2026-06-21"
updatedAt: "2026-06-21 12:00"
agent: "研究员→编辑→审校员"
tags:
  - "训练实战"
  - "训练循环"
  - "分布式训练"
  - "Checkpoint"
  - "监控"
type: "book"
---

# 第 6 章：完整训练实战

> 选自《Diffusion模型文本与多模态融合从入门到精通》

## 6.1 完整训练脚本

```python
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from torch.utils.tensorboard import SummaryWriter
from torch.cuda.amp import autocast, GradScaler
import torch.distributed as dist
from torch.nn.parallel import DistributedDataParallel as DDP

class DiffusionTrainer:
    """
    完整的文生图扩散模型训练器
    支持：单卡 / DDP 分布式 / FP16混合精度
    """
    def __init__(self, config):
        self.config = config
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        
        # 模型
        self.unet = TextConditionedUNet(
            in_channels=4,
            model_channels=config.model_channels,
            text_dim=768,
        ).to(self.device)
        
        self.vae = VAEEncoder().to(self.device)
        self.vae_decoder = VAEDecoder().to(self.device)
        self.text_encoder = CLIPTextEncoder().to(self.device)
        
        # 冻结 VAE 和文本编码器
        for model in [self.vae, self.vae_decoder, self.text_encoder]:
            for param in model.parameters():
                param.requires_grad = False
        
        # 优化器
        self.optimizer = optim.AdamW(
            self.unet.parameters(),
            lr=config.learning_rate,
            weight_decay=config.weight_decay,
        )
        
        # 学习率调度器
        self.scheduler = optim.lr_scheduler.CosineAnnealingLR(
            self.optimizer, T_max=config.num_epochs
        )
        
        # 噪声调度器
        self.betas = cosine_beta_schedule(config.num_timesteps).to(self.device)
        self.alphas = 1 - self.betas
        self.alphas_cumprod = torch.cumprod(self.alphas, dim=0)
        self.sqrt_alphas_cumprod = self.alphas_cumprod ** 0.5
        self.sqrt_one_minus_alphas_cumprod = (1 - self.alphas_cumprod) ** 0.5
        
        # FP16 混合精度
        self.scaler = GradScaler()
        
        # 日志
        self.writer = SummaryWriter(config.log_dir)
        self.global_step = 0
    
    def train_step(self, batch):
        """单步训练"""
        images, captions = batch
        batch_size = images.shape[0]
        
        # 1. VAE 编码：像素 → 潜空间
        with torch.no_grad():
            latents, _, _ = self.vae(images.to(self.device))
        
        # 2. CLIP 文本编码
        with torch.no_grad():
            text_emb = self.text_encoder(captions)["token_embeddings"]
        
        # 3. 随机时间步
        t = torch.randint(0, self.config.num_timesteps, 
                          (batch_size,), device=self.device)
        
        # 4. 前向扩散
        noise = torch.randn_like(latents)
        noisy_latents = (self.sqrt_alphas_cumprod[t][:, None, None, None] * latents +
                         self.sqrt_one_minus_alphas_cumprod[t][:, None, None, None] * noise)
        
        # 5. 预测噪声
        with autocast():
            predicted_noise = self.unet(noisy_latents, t, text_emb)
            loss = nn.functional.mse_loss(predicted_noise, noise)
        
        # 6. 反向传播
        self.optimizer.zero_grad()
        self.scaler.scale(loss).backward()
        self.scaler.step(self.optimizer)
        self.scaler.update()
        
        return loss.item()
    
    def train_epoch(self, dataloader, epoch):
        """训练一个 epoch"""
        self.unet.train()
        epoch_loss = 0
        
        for step, batch in enumerate(dataloader):
            loss = self.train_step(batch)
            epoch_loss += loss
            self.global_step += 1
            
            # 日志
            if step % 100 == 0:
                lr = self.optimizer.param_groups[0]['lr']
                self.writer.add_scalar('train/loss', loss, self.global_step)
                self.writer.add_scalar('train/lr', lr, self.global_step)
                print(f"Epoch {epoch} Step {step}/{len(dataloader)} "
                      f"Loss: {loss:.6f} LR: {lr:.2e}")
            
            # 定期采样评估
            if self.global_step % 1000 == 0:
                self.sample_and_eval(epoch)
        
        self.scheduler.step()
        return epoch_loss / len(dataloader)
    
    def train(self, train_dataloader, val_dataloader=None):
        """完整训练循环"""
        print(f"Training on {self.device}")
        print(f"Model params: {sum(p.numel() for p in self.unet.parameters()):,}")
        
        for epoch in range(self.config.num_epochs):
            train_loss = self.train_epoch(train_dataloader, epoch)
            
            # 每个 epoch 保存 checkpoint
            self.save_checkpoint(epoch, train_loss)
            
            print(f"Epoch {epoch} complete. Avg loss: {train_loss:.6f}")
    
    @torch.no_grad()
    def sample_and_eval(self, epoch):
        """采样评估"""
        self.unet.eval()
        
        # CFG 采样
        prompts = ["a cute cat", "a beautiful sunset", "a futuristic city"]
        text_emb = self.text_encoder(prompts)["token_embeddings"]
        empty_emb = self.text_encoder([""])["token_embeddings"]
        
        # 从随机噪声开始
        latent = torch.randn(len(prompts), 4, 64, 64, device=self.device)
        
        for t in reversed(range(self.config.num_timesteps)):
            t_tensor = torch.full((len(prompts),), t, device=self.device)
            
            # CFG 预测
            emb = torch.cat([empty_emb.expand(len(prompts), -1, -1), text_emb])
            latent_double = torch.cat([latent, latent])
            
            noise_pred = self.unet(latent_double, t_tensor, emb)
            noise_uncond, noise_cond = noise_pred.chunk(2)
            noise_pred = noise_uncond + 7.5 * (noise_cond - noise_uncond)
            
            # DDPM 去噪步
            alpha = self.alphas[t]
            sqrt_alpha = alpha ** 0.5
            beta = self.betas[t]
            latent = (1 / sqrt_alpha) * (latent - beta / (1 - self.alphas_cumprod[t]) ** 0.5 * noise_pred)
            if t > 0:
                latent = latent + beta ** 0.5 * torch.randn_like(latent)
        
        # VAE 解码
        images = self.vae_decoder(latent)
        images = (images + 1) / 2  # [-1, 1] → [0, 1]
        
        # 保存到 TensorBoard
        self.writer.add_images(f'samples/epoch_{epoch}', images, epoch)
        self.unet.train()
    
    def save_checkpoint(self, epoch, loss):
        """保存 checkpoint"""
        ckpt = {
            'epoch': epoch,
            'unet_state_dict': self.unet.state_dict(),
            'optimizer_state_dict': self.optimizer.state_dict(),
            'scheduler_state_dict': self.scheduler.state_dict(),
            'scaler_state_dict': self.scaler.state_dict(),
            'loss': loss,
            'config': self.config,
        }
        path = f"{self.config.ckpt_dir}/epoch_{epoch}.pt"
        torch.save(ckpt, path)
        print(f"Checkpoint saved: {path}")
```

## 6.2 分布式训练配置

```python
# DDP 启动脚本
# torchrun --nproc_per_node=8 train_distributed.py

def setup_ddp(rank, world_size):
    """初始化分布式训练"""
    dist.init_process_group("nccl", rank=rank, world_size=world_size)
    torch.cuda.set_device(rank)

def train_distributed(rank, world_size, config):
    """分布式训练入口"""
    setup_ddp(rank, world_size)
    
    model = TextConditionedUNet(...).to(rank)
    model = DDP(model, device_ids=[rank])
    
    # 每个进程使用不同的数据子集
    dataset = DiffusionDataset(...)
    sampler = DistributedSampler(dataset, num_replicas=world_size, rank=rank)
    dataloader = DataLoader(dataset, sampler=sampler, batch_size=config.batch_size)
    
    trainer = DiffusionTrainer(config)
    trainer.unet = model
    
    for epoch in range(config.num_epochs):
        sampler.set_epoch(epoch)  # 确保每个 epoch shuffle 不同
        trainer.train_epoch(dataloader, epoch)
    
    dist.destroy_process_group()

# ZeRO-3 + DeepSpeed 配置示例
# ds_config.json
DS_CONFIG = {
    "train_batch_size": 2048,
    "gradient_accumulation_steps": 4,
    "fp16": {"enabled": True},
    "zero_optimization": {
        "stage": 3,                    # ZeRO-3 分片
        "offload_optimizer": {
            "device": "cpu",           # 优化器卸载到CPU
            "pin_memory": True,
        },
        "offload_param": {
            "device": "cpu",           # 参数卸载到CPU
        },
        "overlap_comm": True,
        "contiguous_gradients": True,
    },
    "optimizer": {
        "type": "AdamW",
        "params": {"lr": 1e-4, "weight_decay": 0.01},
    },
    "scheduler": {
        "type": "WarmupDecayLR",
        "params": {
            "warmup_min_lr": 0,
            "warmup_max_lr": 1e-4,
            "warmup_num_steps": 10000,
            "total_num_steps": 500000,
        }
    }
}
```

## 6.3 训练监控与可视化

```python
class TrainingMonitor:
    """
    训练监控：损失曲线、学习率、梯度范数、采样展示
    """
    def __init__(self, log_dir):
        self.writer = SummaryWriter(log_dir)
        self.losses = []
        self.grad_norms = []
    
    def log_loss(self, loss, step):
        self.writer.add_scalar('loss/train', loss, step)
        self.losses.append(loss)
    
    def log_lr(self, lr, step):
        self.writer.add_scalar('hyperparams/lr', lr, step)
    
    def log_grad_norm(self, model, step):
        total_norm = 0
        for p in model.parameters():
            if p.grad is not None:
                total_norm += p.grad.norm().item() ** 2
        grad_norm = total_norm ** 0.5
        self.writer.add_scalar('gradients/norm', grad_norm, step)
        self.grad_norms.append(grad_norm)
    
    def log_images(self, tag, images, step):
        """记录生成样本"""
        self.writer.add_images(tag, images, step)
    
    def log_histogram(self, tag, values, step):
        """记录参数分布"""
        self.writer.add_histogram(tag, values, step)
    
    def close(self):
        self.writer.close()
```

## 6.4 训练配置示例

```python
@dataclass
class TrainingConfig:
    """训练配置参数"""
    # 模型
    model_channels: int = 320          # UNet 基础通道数
    num_timesteps: int = 1000          # 扩散步数
    
    # 数据
    data_path: str = "data/train.jsonl"
    resolution: int = 512
    batch_size: int = 16
    num_workers: int = 8
    
    # 训练
    num_epochs: int = 100
    learning_rate: float = 1e-4
    weight_decay: float = 0.01
    gradient_clip: float = 1.0
    
    # 输出
    ckpt_dir: str = "checkpoints"
    log_dir: str = "logs"
    save_every: int = 5                 # 每 N 个 epoch 保存
    sample_every: int = 1000            # 每 N 步采样
    
    # 分布式
    distributed: bool = False
    num_gpus: int = 8

# 启动训练
if __name__ == "__main__":
    config = TrainingConfig()
    
    # 数据
    dataset = DiffusionDataset(config.data_path, config.vae, config.text_encoder)
    dataloader = DataLoader(
        dataset, batch_size=config.batch_size,
        shuffle=True, num_workers=config.num_workers,
    )
    
    # 训练
    trainer = DiffusionTrainer(config)
    trainer.train(dataloader)
```

---

*本章由 Signal 知识平台 AI 智能体自动生成并持续修订。最后更新：2026-06-21*
