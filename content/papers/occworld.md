---
title: "OccWorld: Learning a 3D Occupancy World Model for Autonomous Driving"
paperTitle: "OccWorld: Learning a 3D Occupancy World Model for Autonomous Driving"
authors: "Wenzhao Zheng, Weiliang Chen, Yuanhui Huang et al. (UC Berkeley / PKU)"
venue: "ECCV 2024"
arxivUrl: "https://arxiv.org/abs/2311.16038"
importance: 5
category: "arch"
tags:
  - "自动驾驶"
  - "世界模型"
  - "占用网络"
type: "paper"
date: "2026-04-14"
---

# OccWorld: 3D 占用世界模型

> **论文**: OccWorld: Learning a 3D Occupancy World Model for Autonomous Driving  
> **作者**: Wenzhao Zheng, Weiliang Chen, Yuanhui Huang et al. (UC Berkeley / PKU)  
> **发表**: ECCV 2024  
> **链接**: [arXiv:2311.16038](https://arxiv.org/abs/2311.16038)

## 一句话总结

**OccWorld 提出首个基于 3D 占用表示的世界模型，通过 GPT-like 自回归方式预测未来占用场景，同时生成自车规划轨迹，在 nuScenes 上实现 SOTA 的场景预测与规划性能。**

## 核心问题

自动驾驶中的世界模型需要回答两个关键问题：
1. **场景会如何变化？**（预测）
2. **自车应该怎么走？**（规划）

现有方法的局限：
- 基于图像的世界模型（如 GAIA-1）缺乏 3D 几何理解
- 基于 BEV 的方法只有 2D 鸟瞰投影，丢失高度信息
- 传统规划器与预测模块分离，无法联合优化

## 方法

### 架构总览

```
OccWorld 架构:

  历史观测 (T-3 ~ T)
  ┌─────────────────┐
  │ 多相机图像序列   │
  │   ↓ BEVFormer   │
  │ 3D Occupancy    │ → 当前占用场景 O_t [200×200×16, 18类]
  └────────┬────────┘
           ↓
  ┌─────────────────────────────────────────┐
  │ 场景 Tokenizer (VQ-VAE)                  │
  │   O_t → 离散 Token 序列 z_t              │
  │   200×200×16 → 400 tokens (50×压缩)      │
  └────────┬────────────────────────────────┘
           ↓
  ┌─────────────────────────────────────────┐
  │ GPT-like World Model                     │
  │   Input: [z_{t-3}, ..., z_t, ego_t]    │
  │   Output: [z_{t+1}, ..., z_{t+K}]      │
  │          + [traj_{t+1}, ..., traj_{t+K}] │
  │   K = 4 (预测未来 2 秒)                  │
  └─────────────────────────────────────────┘
```

### 3D Occupancy Tokenizer

将高维 3D 占用场景压缩为离散 token 序列：

```python
class OccTokenizer(nn.Module):
    """3D 占用场景 VQ-VAE 编码"""
    
    def __init__(self, codebook_size=8192, token_dim=256):
        # 3D 卷积编码器: [200,200,16,18] → [50,50,4,256]
        self.encoder = nn.Sequential(
            Conv3d(18, 64, 4, stride=2),   # [100,100,8]
            Conv3d(64, 128, 4, stride=2),  # [50,50,4]
            Conv3d(128, token_dim, 1),     # [50,50,4,256]
        )
        # 向量量化码本
        self.codebook = VectorQuantize(
            dim=token_dim, 
            codebook_size=codebook_size,
            commitment_cost=0.25
        )
        # 3D 卷积解码器 (对称结构)
        self.decoder = nn.Sequential(
            ConvTranspose3d(token_dim, 128, 4, stride=2),
            ConvTranspose3d(128, 64, 4, stride=2),
            ConvTranspose3d(64, 18, 1),
        )
    
    def encode(self, occ):
        z_e = self.encoder(occ)        # 连续表示
        z_q, indices = self.codebook(z_e)  # 量化为离散 token
        return z_q, indices  # indices: [B, 50, 50, 4] = 10000 tokens
    
    def decode(self, z_q):
        return self.decoder(z_q)       # 重建占用场景
```

### GPT World Model

```python
class OccWorldGPT(nn.Module):
    """GPT-like 自回归世界模型"""
    
    def __init__(self, n_layers=12, d_model=512, n_heads=8):
        self.transformer = GPT(
            vocab_size=8192 + 256,  # 场景 token + 轨迹 token
            n_layers=n_layers,
            d_model=d_model,
            n_heads=n_heads,
            max_seq_len=50000,  # 5帧 × 10000 tokens
        )
        self.traj_head = TrajectoryDecoder(d_model, n_points=20)
    
    def forward(self, token_sequence, ego_states):
        """
        输入: 历史 K 帧的场景 token + ego 状态
        输出: 未来 K 帧的场景 token + 规划轨迹
        """
        # 1. 自回归预测未来场景 token
        future_tokens = self.transformer.generate(
            token_sequence, 
            max_new_tokens=10000 * 4  # 预测 4 帧
        )
        
        # 2. 同时解码规划轨迹
        trajectory = self.traj_head(
            self.transformer.last_hidden[:, -20:]  # 最后 20 个 hidden
        )
        
        return future_tokens, trajectory
```

## 实验结果

### 场景预测

| 方法 | IoU@1s | IoU@2s | mIoU | FPS |
|------|--------|--------|------|-----|
| Copy-Last | 42.1 | 28.3 | 35.2 | - |
| 4D-Occ (CVPR 2024) | 51.3 | 38.7 | 45.0 | 8.2 |
| **OccWorld** | **54.8** | **42.1** | **48.5** | 12.5 |

### 规划性能 (nuScenes)

| 方法 | L2 (1s) ↓ | L2 (2s) ↓ | L2 (3s) ↓ | 碰撞率 ↓ |
|------|----------|----------|----------|---------|
| UniAD | 0.48 | 0.96 | 1.65 | 0.71% |
| VAD | 0.41 | 0.70 | 1.05 | 0.37% |
| **OccWorld** | **0.38** | **0.65** | **0.98** | **0.29%** |

## Signal 评价

⭐⭐⭐⭐⭐ (5/5 重要性)

**创新点**：
1. 首次将 3D 占用表示引入世界模型，解决了图像级世界模型缺乏 3D 几何的问题
2. VQ-VAE tokenization 实现 50× 压缩，使 GPT-like 自回归在 3D 场景上可行
3. 联合预测与规划，证明世界模型可以直接服务决策

**局限性**：
- 当前仅在 nuScenes（小规模数据集）上验证
- 10000 tokens/帧的序列长度仍然偏长，限制实时性
- 无 LiDAR/Radar 融合，仅纯视觉

**对后续工作的影响**：
- 直接影响了 DriveWorld-VLA 的 Latent Space 世界模型设计
- 为 SuperDrive 2.0 等量产系统的世界模型模块提供了理论基础
- 与 UniSim 2 的物理仿真结合，有望实现更真实的场景生成

---

*本论文解读由 Signal 知识平台 AI 智能体自动生成。*
