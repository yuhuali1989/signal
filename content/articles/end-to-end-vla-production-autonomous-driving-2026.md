---
title: "端到端 VLA 量产落地：从 SuperDrive 2.0 看自动驾驶的范式跃迁"
description: "地平线 SuperDrive 2.0 首个量产 L3 城市 NOA 系统，基于端到端 VLA 架构实现 0.3 次/百公里接管率，本文全景拆解技术方案"
date: "2026-04-14"
tags:
  - "自动驾驶"
  - "VLA"
  - "端到端"
  - "量产"
type: "article"
---

# 端到端 VLA 量产落地：从 SuperDrive 2.0 看自动驾驶的范式跃迁

> 2026 年 4 月，地平线 SuperDrive 2.0 在理想 L9 Max 和蔚来 ET9 上量产交付，成为全球首个基于端到端 VLA 架构的量产 L3 城市 NOA 系统。本文从技术架构、训练数据、车端部署和安全验证四个维度全景拆解。

## 一、为什么端到端是自动驾驶的必然方向

### 模块化 vs 端到端：核心矛盾

传统模块化自动驾驶系统（Apollo/Autoware 架构）的根本问题：

```
模块化架构的信息损失:

  感知 → [3D Box + 置信度]  → 预测 → [轨迹 + 概率] → 规划
         ↑ 信息压缩               ↑ 信息再压缩
         丢失：纹理、遮挡、        丢失：场景语义、
         不确定性分布              交互关系

  每个 → 都是一次信息瓶颈
  错误在模块间累积放大 (Error Cascading)
```

端到端架构的核心优势：
1. **全局梯度优化**：一个 loss 函数端到端反向传播，所有模块协同
2. **隐式特征传递**：高维特征直接流动，无信息瓶颈
3. **数据驱动**：更多数据 → 更好性能，天然 Scaling Law

### 量产里程碑时间线

| 时间 | 事件 | 意义 |
|------|------|------|
| 2023.03 | UniAD (CVPR Best Paper) | 首个统一感知-预测-规划的端到端框架 |
| 2023.08 | Tesla FSD v12 Beta | 首个量产端到端系统（北美 highway） |
| 2024.10 | 华为 ADS 3.0 | 国内首个端到端城区 NOA（城市+高速） |
| 2025.06 | Tesla FSD v13 | 感知到控制全端到端，北美城区 NOA |
| **2026.04** | **SuperDrive 2.0** | **首个量产 L3 + VLA 架构 + 全国城区** |

## 二、SuperDrive 2.0 技术架构

### 整体流水线

```
SuperDrive 2.0 端到端 VLA 架构:

  传感器输入                    VLA-Drive 3B                    控制输出
  ┌─────────┐   ┌────────────────────────────────────┐   ┌─────────┐
  │ 11 相机  │→ │  ViT-L Vision Encoder              │   │ 轨迹点   │
  │ 1 LiDAR │→ │    ↓                               │→ │ 10Hz    │
  │ 5 Radar │→ │  BEV Fusion (空间 + 时序)            │   │ 30 点   │
  │ IMU/GPS │→ │    ↓                               │   │ 3s 预测  │
  └─────────┘  │  LLM 3B (场景理解 + 决策推理)        │   └─────────┘
               │    ↓                               │       ↓
               │  Diffusion Action Head (轨迹生成)    │   ┌─────────┐
               │    ↓                               │   │ RSS 安全 │
               │  Safety Verifier (安全校验)          │   │ 包络检查 │
               └────────────────────────────────────┘   └─────────┘
```

### VLA-Drive 3B 核心模块

**1. 多传感器 BEV 融合**

```python
class MultiSensorBEVFusion(nn.Module):
    """多传感器 BEV 融合 —— 相机 + LiDAR + Radar"""
    
    def __init__(self):
        self.cam_encoder = ViT_L(pretrained="dinov2")
        self.lidar_encoder = VoxelNet(voxel_size=0.1)
        self.radar_encoder = RadarPillarNet()
        
        # 跨模态注意力融合
        self.cross_modal_attn = DeformableAttention(
            d_model=256, n_heads=8, n_levels=4
        )
        # 时序 BEV 融合 (4 历史帧)
        self.temporal_fusion = TemporalBEVFormer(n_frames=4)
    
    def forward(self, cameras, lidar, radar, ego_motion):
        # 1. 各模态独立编码
        cam_bev = self.cam_to_bev(self.cam_encoder(cameras))
        lid_bev = self.lidar_encoder(lidar)
        rad_bev = self.radar_encoder(radar)
        
        # 2. 跨模态注意力融合
        fused_bev = self.cross_modal_attn(
            query=cam_bev,
            key=torch.cat([lid_bev, rad_bev], dim=1),
            reference_points=self.generate_bev_points()
        )
        
        # 3. 时序融合 (利用 ego_motion 对齐历史帧)
        temporal_bev = self.temporal_fusion(fused_bev, ego_motion)
        
        return temporal_bev  # [B, 256, 200, 200]
```

**2. LLM 场景理解与决策推理**

```python
class SceneReasoningLLM(nn.Module):
    """3B LLM 用于场景理解和高层决策"""
    
    def __init__(self):
        self.llm = Qwen2_3B(
            attn_type="GQA",      # 16Q / 4KV
            ffn_type="SwiGLU",
            vocab_size=32768 + 1024,  # 文本 + 驾驶 action token
        )
        self.bev_projector = MLPProjector(256, 2048)  # BEV → LLM 空间
        self.nav_encoder = NavigationEncoder()         # 导航指令编码
    
    def forward(self, bev_features, navigation, ego_state):
        # 1. BEV 特征投射到 LLM token 空间
        bev_tokens = self.bev_projector(bev_features)  # [B, 400, 2048]
        
        # 2. 导航意图编码
        nav_tokens = self.nav_encoder(navigation)       # "左转进入长安街"
        
        # 3. LLM 场景推理
        input_seq = torch.cat([bev_tokens, nav_tokens, ego_state], dim=1)
        reasoning_output = self.llm(input_seq)
        
        # 4. 输出：场景理解 + 决策 token
        scene_understanding = reasoning_output[:, :100]  # 隐式场景表示
        decision_tokens = reasoning_output[:, -10:]       # 高层决策
        
        return scene_understanding, decision_tokens
```

**3. Diffusion Action Head**

```python
class DiffusionActionHead(nn.Module):
    """扩散模型生成多模态轨迹"""
    
    def __init__(self, n_waypoints=30, horizon=3.0):
        self.denoiser = UNet1D(
            in_channels=4,        # (x, y, heading, speed)
            out_channels=4,
            cond_channels=2048,   # LLM 条件向量
            n_steps=10            # 扩散步数（推理时 DDIM 加速）
        )
        self.n_waypoints = n_waypoints
        self.horizon = horizon
    
    def forward(self, condition, n_samples=8):
        """生成多条候选轨迹，选择最优"""
        # 1. 从噪声采样 n_samples 条轨迹
        noise = torch.randn(n_samples, self.n_waypoints, 4)
        
        # 2. DDIM 去噪 (10 步，~15ms)
        trajectories = self.ddim_sample(noise, condition, steps=10)
        
        # 3. 轨迹评分 + 选择
        scores = self.trajectory_scorer(trajectories, condition)
        best_idx = scores.argmax()
        
        return trajectories[best_idx]  # [30, 4] —— 3 秒内 30 个路径点
```

## 三、训练数据工程

### 数据规模与构成

| 数据类型 | 规模 | 来源 | 用途 |
|---------|------|------|------|
| 真实驾驶 | 2000 万公里 | 车队采集 | 基础训练 |
| 世界模型合成 | 5000 万帧 | UniSim 2 | 场景多样性 |
| 对抗长尾 | 100 万场景 | GAN 生成 | 安全边界 |
| 语言标注 | 500 万对 | 自动+人工 | 场景理解 |

### 三阶段训练策略

```
Stage 1: 视觉预训练 (100K GPU-hours)
  - DINOv2 预训练 ViT-L（2 亿张驾驶图片）
  - BEV 预训练（lidar 监督）

Stage 2: VLA 联合训练 (200K GPU-hours)
  - 真实数据: 2000 万公里
  - 合成数据: 5000 万帧
  - Loss: BEV 重建 + 轨迹 L2 + 语言对齐

Stage 3: RL 后训练 (50K GPU-hours)
  - 世界模型在线 RL
  - 奖励: 安全性(碰撞) + 舒适度(jerk) + 效率(完成时间)
  - PPO + 重要性采样
```

## 四、车端部署方案

### Journey 6E 算力分配

```
Journey 6E SoC (560 TOPS, 45W):

  BPU (AI 加速器):     420 TOPS
    ViT-L 编码:         120 TOPS (INT8)
    BEV 融合:           80 TOPS (INT8)
    LLM 3B:            180 TOPS (INT4)
    Action Head:        40 TOPS (FP16)

  CPU (A78AE 8核):      通用计算
    RSS 安全检查:        2 核
    传感器预处理:        2 核
    系统控制:           4 核

  推理延迟分解:
    传感器预处理:  5ms
    ViT 编码:     12ms
    BEV 融合:     10ms
    LLM 推理:     25ms
    轨迹生成:     10ms
    安全检查:     6ms
    ─────────────────
    端到端:       68ms (< 100ms 目标 ✅)
```

## 五、安全与监管

### L3 责任切换

SuperDrive 2.0 的 L3 认证意味着**系统承担驾驶责任**：

```
ODD (运行设计域):
  ✅ 城区道路 (限速 ≤ 80km/h)
  ✅ 高速公路
  ✅ 晴天/阴天/小雨
  ❌ 暴雨/大雪/浓雾 (能见度 < 50m)
  ❌ 施工区域 (无地图标注)

MRM (最小风险策略):
  当超出 ODD → 10s 接管提醒
  无人接管 → 自动减速靠边停车
  碰撞不可避免 → RSS 安全包络 + 最小伤害策略
```

## 六、展望

SuperDrive 2.0 证明了端到端 VLA 已经从论文走入量产。但仍有关键挑战：

1. **全天候能力**：暴雨/大雪场景仍需降级到 L2
2. **无图城区**：纯 VLA 在无高精地图区域的可靠性
3. **成本下降**：当前方案成本 ~¥15,000，需降至 ¥5,000 以下才能进入 20 万级车型
4. **监管跟进**：国内 L3 法规仍在试点阶段

端到端 VLA 不是终点，而是自动驾驶走向 L4/L5 的必经之路。

---

*本文由 Signal 知识平台 AI 智能体自动生成。*
