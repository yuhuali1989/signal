---
title: "GenAD: Generalized Predictive Model for Autonomous Driving"
paperTitle: "GenAD: Generalized Predictive Model for Autonomous Driving"
authors: "Zhiqi Li, Zhiding Yu et al. (NVIDIA / Shanghai AI Lab)"
venue: "CVPR 2025"
arxivUrl: "https://arxiv.org/abs/2402.11502"
importance: 5
category: "arch"
tags:
  - "自动驾驶"
  - "世界模型"
  - "生成式预测"
type: "paper"
date: "2026-04-14"
---

# GenAD: 通用预测式自动驾驶模型

> **论文**: GenAD: Generalized Predictive Model for Autonomous Driving  
> **作者**: Zhiqi Li, Zhiding Yu et al. (NVIDIA / Shanghai AI Lab)  
> **发表**: CVPR 2025  
> **链接**: [arXiv:2402.11502](https://arxiv.org/abs/2402.11502)

## 一句话总结

**GenAD 提出用一个统一的生成式预测框架同时完成场景预测和轨迹规划，通过 Instance-centric 场景表示 + Temporal Latent Diffusion 实现多模态不确定性建模，nuScenes 上 L2(3s) 降至 0.72m。**

## 核心问题

自动驾驶中的预测和规划面临多模态不确定性：一个行人可能直行、也可能突然横穿马路。传统方法的问题：

1. **确定性预测**：输出单一轨迹，无法建模不确定性
2. **分离式训练**：预测和规划分开训练，目标不一致
3. **Agent-centric 局限**：逐个预测每个目标，忽略交互关系

## 方法

### 架构总览

```
GenAD 端到端架构:

  多相机图像
      ↓
  BEVFormer v2 (BEV 特征提取)
      ↓
  ┌─────────────────────────────────────────┐
  │ Instance-centric 编码器                   │
  │   检测 + 跟踪 → N 个 Instance 特征       │
  │   每个 Instance: 位置/速度/历史/BEV局部   │
  │   交互注意力: Instance × Instance         │
  └─────────────┬───────────────────────────┘
                ↓
  ┌─────────────────────────────────────────┐
  │ Temporal Latent Diffusion                │
  │   条件: Instance 特征 + 地图特征          │
  │   输出: 多模态未来轨迹 (K=6 samples)      │
  │   同时预测所有 Agent + 自车              │
  └─────────────┬───────────────────────────┘
                ↓
  ┌─────────────────────────────────────────┐
  │ 联合规划                                  │
  │   评分: 安全性 + 舒适度 + 效率             │
  │   选择最优自车轨迹                         │
  └─────────────────────────────────────────┘
```

### Instance-centric 场景表示

GenAD 的核心创新之一是以每个交通参与者为中心建模：

```python
class InstanceEncoder(nn.Module):
    """实例中心编码器"""
    
    def __init__(self, d_model=256, n_heads=8):
        self.position_encoder = MLP(7, d_model)
        self.history_encoder = TemporalEncoder(d_model, n_frames=10)
        self.interaction_attn = nn.MultiheadAttention(d_model, n_heads)
        self.bev_sampler = DeformableSampler(d_model)
    
    def forward(self, instances, bev_features, history):
        pos_embed = self.position_encoder(instances.state)
        hist_embed = self.history_encoder(history)
        bev_embed = self.bev_sampler(bev_features, instances.position)
        
        instance_features = pos_embed + hist_embed + bev_embed
        interacted = self.interaction_attn(
            instance_features, instance_features, instance_features
        )
        return interacted  # [N, D]
```

### Temporal Latent Diffusion

```python
class TemporalLatentDiffusion(nn.Module):
    """时序潜在扩散模型"""
    
    def __init__(self, d_model=256, n_steps=100):
        self.traj_vae = TrajectoryVAE(
            input_dim=2, latent_dim=64, horizon=30
        )
        self.denoiser = ConditionedUNet1D(
            in_channels=64, cond_channels=d_model, n_steps=n_steps
        )
    
    def forward(self, instance_features, gt_trajectories=None):
        if self.training:
            # 编码 GT 轨迹到潜在空间
            z_0 = self.traj_vae.encode(gt_trajectories)
            # 加噪
            t = torch.randint(0, self.n_steps, (z_0.shape[0],))
            noise = torch.randn_like(z_0)
            z_t = self.scheduler.add_noise(z_0, noise, t)
            # 预测噪声
            pred_noise = self.denoiser(z_t, t, instance_features)
            return F.mse_loss(pred_noise, noise)
        else:
            # 推理: DDIM 采样 K 条候选轨迹
            trajectories = []
            for _ in range(6):  # K=6 多模态采样
                z = torch.randn(instance_features.shape[0], 64)
                for t in reversed(range(0, self.n_steps, 10)):  # DDIM 10步
                    z = self.ddim_step(z, t, instance_features)
                traj = self.traj_vae.decode(z)  # [N, 30, 2]
                trajectories.append(traj)
            return torch.stack(trajectories)  # [K, N, 30, 2]
```

### 联合预测与规划

```python
class JointPlanner(nn.Module):
    """联合规划器 —— 同时考虑所有 Agent 的多模态未来"""
    
    def score_trajectory(self, ego_traj, other_trajs):
        # 安全性: 与所有 Agent 的最小距离
        safety = self.collision_checker(ego_traj, other_trajs)
        
        # 舒适度: jerk + lateral acceleration
        comfort = self.comfort_evaluator(ego_traj)
        
        # 效率: 到达目标的时间
        efficiency = self.efficiency_evaluator(ego_traj)
        
        return 0.5 * safety + 0.3 * comfort + 0.2 * efficiency
```

## 实验结果

### 运动预测 (nuScenes)

| 方法 | minADE_5 ↓ | minFDE_5 ↓ | Miss Rate ↓ |
|------|-----------|-----------|-------------|
| HiVT | 1.17 | 1.85 | 0.132 |
| QCNet | 1.05 | 1.62 | 0.108 |
| MTR++ | 0.98 | 1.51 | 0.095 |
| **GenAD** | **0.89** | **1.38** | **0.082** |

### 规划性能

| 方法 | L2 (1s) ↓ | L2 (2s) ↓ | L2 (3s) ↓ | 碰撞率 ↓ |
|------|----------|----------|----------|---------|
| UniAD | 0.48 | 0.96 | 1.65 | 0.71% |
| VAD | 0.41 | 0.70 | 1.05 | 0.37% |
| SparseDrive | 0.30 | 0.45 | 0.67 | 0.12% |
| **GenAD** | **0.28** | **0.42** | **0.72** | **0.10%** |

### 多模态预测质量

GenAD 的扩散模型生成的多模态轨迹覆盖了真实未来分布：

```
行人横穿场景:
  GenAD: 6 条采样轨迹中 2 条预测横穿，4 条预测直行
  GT: 行人确实横穿 → GenAD 的横穿轨迹命中

  UniAD: 仅输出 1 条直行轨迹 → miss

交叉路口:
  GenAD: 左转/直行/右转 三种模态均有覆盖
  传统方法: 仅输出概率最高的直行
```

## Signal 评价

⭐⭐⭐⭐⭐ (5/5 重要性)

**核心贡献**：
1. **Instance-centric 表示**：比 BEV-centric 更高效，计算量与 Agent 数量而非空间分辨率成正比
2. **Latent Diffusion for Trajectories**：首次将潜在扩散模型用于交通参与者轨迹预测，天然支持多模态输出
3. **联合预测-规划**：在一个框架内同时完成所有 Agent 预测和自车规划

**关键洞察**：
- 扩散模型的多模态特性天然适合交通场景的不确定性建模
- Instance-centric 比 BEV-centric 在预测任务上更有优势（关注交互而非空间）

**对产业的影响**：
- GenAD 的设计思路已被 NVIDIA DriveFoundation 采纳
- Instance-centric + Diffusion 正在成为下一代规划系统的标准范式
- 为 SuperDrive 2.0 的 Diffusion Action Head 提供了理论基础

**局限性**：
- 依赖 GT 检测框进行 Instance 初始化，端到端程度不够
- 扩散采样 (即使 DDIM 10步) 仍有延迟开销 (~15ms)
- 未考虑交通信号灯和地图语义

---

*本论文解读由 Signal 知识平台 AI 智能体自动生成。*
