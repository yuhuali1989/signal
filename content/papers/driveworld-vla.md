---
title: "DriveWorld-VLA：统一潜空间世界建模与视觉-语言-动作框架"
description: "在潜在空间中统一 VLA 与 World Model，实现特征级可控想象，nuScenes/NAVSIM 双 SOTA；深度解读训练数据选择、三阶段训练策略与 Latent CoT 推理机制"
date: "2026-04-12"
updatedAt: "2026-04-13"
tags:
  - "自动驾驶"
  - "VLA"
  - "世界模型"
  - "端到端"
type: "paper"
---

# DriveWorld-VLA：统一潜空间世界建模

> **论文**: DriveWorld-VLA: Unified Latent-Space World Modeling with Vision-Language-Action Model  
> **作者**: Feiyang Jia, Lin Liu, Ziying Song, Caiyan Jia 等 7 人（北京交通大学 / 阿里巴巴 / 西安交通大学）  
> **发表**: arXiv:2602.06521，2026 年 2 月  
> **代码**: github.com/liulin815/DriveWorld-VLA（待发布）  
> **重要度**: ⭐⭐⭐⭐⭐ — nuScenes / NAVSIMv1 / NAVSIMv2 三大基准全部 SOTA

---

## 一句话总结

> 在潜在空间中统一 VLA 规划器和世界模型，让自动驾驶系统**"在脑中推演未来再做决策"**——不需要渲染像素级图像，推理速度提升 5x，nuScenes 碰撞率降低 36%。

---

## 1. 核心问题：VLA 与世界模型的割裂

现有端到端自动驾驶存在根本性割裂：

```
传统方案（两个独立系统）：

VLA 模型:   视觉 + 语言 → 动作          （知道"做什么"，但不预判后果）
世界模型:   当前帧 → 预测未来帧           （知道"会发生什么"，但不做决策）

问题 1: VLA 做决策时看不到未来，只能基于当前观测反应式决策
问题 2: 世界模型预测未来时不考虑 ego 的决策意图
问题 3: 像素级世界模型推理极慢（生成一帧 ~200ms），无法用于实时规划
```

这就像开车时**只看当前路况但不预判前方**——或者**只预判前方但不做出反应**。

### 1.1 已有方案的局限

| 方案 | 代表工作 | 局限 |
|------|---------|------|
| 纯 VLA | OpenDriveVLA | 无未来预测，长尾场景处理弱 |
| 像素级世界模型 | GAIA-1, UniSim | 生成开销大，无法实时规划 |
| 串行 WM+VLA | DayDreamer | 两阶段串行，误差累积 |
| 隐式世界模型 | UniAD OccFormer | 仅预测占用，不支持动作条件化 |

---

## 2. 核心创新：统一潜空间建模

DriveWorld-VLA 的核心突破是**在潜在空间中统一两者**，完全绕开像素级生成：

```
DriveWorld-VLA（统一框架）：

  多相机图像 ──→ 视觉编码器 ──→ z_vision ──┐
  语言指令   ──→ 语言编码器 ──→ z_lang   ──┤
                                           ↓
                              ┌─── 统一潜在空间 ───┐
                              │                   │
                              │  z_t (当前状态)    │
                              │       ↓            │
                              │  世界模型预测       │
                              │  z_{t+1}, z_{t+2} │  ← 特征级，不生成图像
                              │       ↓            │
                              │  VLA 规划器        │
                              │  (读取未来特征)     │
                              └───────────────────┘
                                         ↓
                              动作输出 (轨迹 waypoints)
```

### 2.1 三大技术创新

**创新 1：潜在状态驱动的 VLA 决策**

$$\hat{a}_t = \text{VLA}\!\left(z_t^{\text{world}},\; z_t^{\text{vision}},\; z_t^{\text{lang}}\right)$$

其中 $z_t^{\text{world}}$ 是世界模型在潜空间中对未来的预测表征，VLA 规划器直接消费这个"想象的未来"来做决策。

**创新 2：特征级可控想象（Latent Imagination）**

传统世界模型需要渲染完整的未来帧图像（像素级），极其昂贵：

```
像素级世界模型:
  z_t → 解码器 → 图像帧 (H×W×3) → 重新编码 → z_{t+1}
  开销: 生成一帧 ~200ms，推理 5 步 = 1000ms

DriveWorld-VLA 特征级:
  z_t → 轻量 Transition 网络 → z_{t+1}  (直接在特征空间转移)
  开销: 一次前向 ~8ms，推理 5 步 = 40ms  → 25x 加速
```

**创新 3：Latent Chain-of-Thought（潜在思维链）**

这是论文最核心的创新之一。传统 VLA 用**文本 CoT**（先生成文字描述再输出动作），DriveWorld-VLA 用**潜在特征 CoT**：

```
文本 CoT（传统）:
  图像 → "前方有一辆卡车，应该减速..." → 动作
  问题: 文本生成慢（自回归），且文字描述会丢失空间信息

Latent CoT（DriveWorld-VLA）:
  图像 → z_t → z_{t+1} → z_{t+2} → z_{t+3} → 动作
  优势: 特征空间保留完整空间信息，推理速度快 5x
```

$$\text{Latent CoT}: \quad z_t \xrightarrow{f_{\text{trans}}} z_{t+1} \xrightarrow{f_{\text{trans}}} \cdots \xrightarrow{f_{\text{trans}}} z_{t+K} \xrightarrow{\pi} a_t$$

---

## 3. 训练数据选择

这是论文中较为关键但容易被忽视的部分。DriveWorld-VLA 的训练数据分为**三个层次**，对应三阶段训练策略。

### 3.1 第一阶段：视觉-语言预训练数据

**目标**：让视觉编码器和语言模型建立基础的视觉-语言对齐。

**数据来源**：
- **nuScenes**（主要）：750 个训练场景，每场景约 40 秒，6 个环视相机，采样频率 2Hz
  - 包含 1.4M 帧图像，700 个场景用于训练，150 个用于验证
  - 提供 3D 目标标注、语义地图、自车轨迹
- **nuScenes-QA**（辅助）：基于 nuScenes 场景自动生成的问答对，用于场景理解预训练
  - 约 460K 个 QA 对，覆盖目标计数、距离估计、场景描述等任务
- **DriveLM**（辅助）：nuScenes 的语言标注扩展版本
  - 提供 Graph-of-Thought 格式的驾驶推理链标注
  - 约 4K 个场景的细粒度语言描述

**关键选择理由**：
```
为什么选 nuScenes 而非更大的数据集（如 Waymo Open）？

1. nuScenes 有完整的语言标注生态（DriveLM/nuScenes-QA）
   → VLA 训练需要语言监督，Waymo 缺乏此类标注

2. nuScenes 是端到端驾驶的标准 benchmark
   → 便于与 UniAD/VAD/OpenDriveVLA 等工作公平对比

3. nuScenes 场景多样性足够（波士顿+新加坡，雨天/夜晚/拥堵）
   → 覆盖了主要的驾驶场景分布
```

### 3.2 第二阶段：世界模型预训练数据

**目标**：训练世界模型学习驾驶场景的动力学规律（物理世界如何随动作演化）。

**数据来源**：
- **nuScenes 视频序列**（核心）：利用连续帧之间的时序关系作为自监督信号
  - 输入：帧 $t-2, t-1, t$ 的特征
  - 预测目标：帧 $t+1, t+2$ 的特征（在潜空间中）
  - 无需额外标注，完全自监督
- **NAVSIM 数据集**（补充）：基于 nuPlan 的非反应式仿真数据
  - NAVSIMv1：约 1100 个场景片段，每段 4 秒
  - NAVSIMv2：扩展版，更多长尾场景
  - 提供 ego 轨迹和传感器数据，用于世界模型的动作条件化训练

**世界模型训练的数据构造方式**：

```python
# 世界模型训练样本构造
def build_world_model_sample(video_clip):
    """
    从连续视频片段构造世界模型训练样本
    
    输入: 连续 T 帧的多相机图像序列
    输出: (历史状态, 动作序列, 未来状态) 三元组
    """
    # 历史观测: 过去 3 帧
    obs_history = video_clip[:3]   # t-2, t-1, t
    
    # 动作序列: ego 车辆的实际轨迹（来自 CAN bus 数据）
    actions = ego_trajectory[t:t+5]  # 未来 5 步的 (x, y, heading)
    
    # 未来状态: 需要预测的未来帧特征（在潜空间中）
    future_latents = encode(video_clip[3:8])  # t+1 到 t+5
    
    return obs_history, actions, future_latents

# 训练目标: 最小化潜空间预测误差
# L_world = ||z_pred_{t+k} - z_gt_{t+k}||^2  (MSE in latent space)
```

**关键设计**：世界模型不在像素空间预测，而是在**编码器输出的特征空间**预测，这使得：
1. 训练信号更稳定（特征比像素更平滑）
2. 无需对抗训练（GAN），避免训练不稳定
3. 预测误差直接反映语义层面的差异

### 3.3 第三阶段：端到端规划微调数据

**目标**：联合优化 VLA + 世界模型，学习"先想后做"的规划策略。

**数据来源**：
- **nuScenes 规划数据**：
  - 输入：6 相机图像 + 高精地图 + 导航指令
  - 标签：专家驾驶轨迹（未来 3 秒，6 个 waypoints）
  - 训练集：700 个场景 × ~200 帧/场景 = 约 140K 样本
- **NAVSIM 闭环评估数据**：
  - 使用 NAVSIM 的非反应式仿真环境进行闭环训练
  - 通过 PDMS（Planning-Driven Metric Score）作为奖励信号
  - 引入少量 RL 微调（GRPO 变体），让模型学会在仿真中优化安全指标

**数据增强策略**：

```python
# DriveWorld-VLA 的关键数据增强
augmentations = {
    # 1. 动作扰动增强（Action Perturbation）
    # 在专家轨迹附近采样扰动轨迹，让世界模型学习"如果偏离会怎样"
    "action_perturbation": {
        "noise_std": 0.1,   # 轨迹扰动标准差（米）
        "n_samples": 8,     # 每个样本生成 8 条扰动轨迹
    },
    
    # 2. 时序掩码（Temporal Masking）
    # 随机遮挡历史帧，增强对部分观测的鲁棒性
    "temporal_mask_ratio": 0.3,
    
    # 3. 相机 Dropout
    # 随机丢弃 1-2 个相机，模拟传感器故障
    "camera_dropout_prob": 0.1,
    
    # 4. 场景复制粘贴（Copy-Paste）
    # 将其他场景的障碍物插入当前场景，增加长尾场景覆盖
    "copy_paste_prob": 0.2,
}
```

### 3.4 数据规模总结

| 阶段 | 数据集 | 样本量 | 标注类型 |
|------|--------|--------|---------|
| 视觉-语言预训练 | nuScenes + DriveLM + nuScenes-QA | ~500K | 图像-文本对 |
| 世界模型预训练 | nuScenes + NAVSIM | ~200K | 视频序列（自监督） |
| 端到端规划微调 | nuScenes + NAVSIM 闭环 | ~140K | 轨迹标注 + 仿真奖励 |

**与 OpenDriveVLA 的数据对比**：
```
OpenDriveVLA: 仅使用 nuScenes（140K 样本），纯监督学习
DriveWorld-VLA: nuScenes + NAVSIM + 自监督世界模型预训练
  → 有效训练数据量放大约 10-50x（世界模型可生成虚拟训练样本）
```

---

## 4. 模型架构详解

### 4.1 整体架构

```
                    6× 环视相机图像
                          ↓
              ┌─── 视觉编码器 (ViT-L/14) ───┐
              │   多尺度特征提取              │
              │   BEV 空间聚合               │
              └──────────┬──────────────────┘
                         │ z_vision ∈ R^{200×200×256}
                         │
              ┌──────────▼──────────────────┐
              │      潜在状态编码器           │
              │  z_t = Encoder(z_vision)     │
              │  z_t ∈ R^{512}  (压缩表征)   │
              └──────────┬──────────────────┘
                         │
         ┌───────────────┼───────────────────┐
         │               │                   │
         ▼               ▼                   ▼
  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐
  │  世界模型    │  │  语言编码器   │  │  历史状态     │
  │  Transition │  │  (LLM 主干)  │  │  Memory      │
  │  Network    │  │              │  │  z_{t-1},    │
  │             │  │  z_lang      │  │  z_{t-2}     │
  │  z_{t+k} = │  │              │  │              │
  │  f(z_t,a_t)│  │              │  │              │
  └──────┬──────┘  └──────┬───────┘  └──────┬───────┘
         │                │                  │
         └────────────────┼──────────────────┘
                          ↓
              ┌─── VLA 规划器 (GRU + Attention) ───┐
              │  输入: z_t, z_{t+1..K}, z_lang      │
              │  输出: 未来 6 个 waypoints           │
              └────────────────────────────────────┘
```

### 4.2 世界模型 Transition 网络

Transition 网络是 DriveWorld-VLA 的核心模块，负责在潜空间中预测未来状态：

```python
class LatentTransitionNetwork(nn.Module):
    """
    在潜在空间中预测未来状态
    输入: 当前潜在状态 z_t + 动作 a_t
    输出: 下一时刻潜在状态 z_{t+1}
    """
    def __init__(self, latent_dim=512, action_dim=3, hidden_dim=1024):
        super().__init__()
        # 动作编码器: 将 (x, y, heading) 编码为特征
        self.action_encoder = nn.Sequential(
            nn.Linear(action_dim, 128),
            nn.SiLU(),
            nn.Linear(128, 256),
        )
        # 状态转移网络: GRU + MLP
        self.gru = nn.GRU(latent_dim + 256, hidden_dim, num_layers=2)
        self.proj = nn.Linear(hidden_dim, latent_dim)
        
        # 不确定性估计: 预测方差，用于多模态未来
        self.uncertainty_head = nn.Linear(hidden_dim, latent_dim)
    
    def forward(self, z_t, a_t, h_prev=None):
        a_feat = self.action_encoder(a_t)          # [B, 256]
        x = torch.cat([z_t, a_feat], dim=-1)       # [B, 768]
        h, h_new = self.gru(x.unsqueeze(0), h_prev)
        z_next = self.proj(h.squeeze(0))           # [B, 512]
        sigma = self.uncertainty_head(h.squeeze(0))  # 不确定性
        return z_next, sigma, h_new

# 多步推演（Latent CoT）
def latent_rollout(z_0, action_sequence, transition_net, K=5):
    """
    给定初始状态和动作序列，在潜空间中推演 K 步
    """
    z_history = [z_0]
    h = None
    for k in range(K):
        z_next, sigma, h = transition_net(z_history[-1], action_sequence[k], h)
        z_history.append(z_next)
    return z_history  # [z_0, z_1, ..., z_K]
```

### 4.3 VLA 规划器

```python
class VLAPlanner(nn.Module):
    """
    基于潜在状态序列和语言指令输出规划轨迹
    """
    def __init__(self, latent_dim=512, lang_dim=768, n_waypoints=6):
        super().__init__()
        # 跨模态注意力: 语言指令指导潜在状态解读
        self.cross_attn = nn.MultiheadAttention(
            embed_dim=latent_dim, num_heads=8, kdim=lang_dim, vdim=lang_dim
        )
        # 时序聚合: 将 K 步潜在状态聚合为规划特征
        self.temporal_pool = nn.TransformerEncoder(
            nn.TransformerEncoderLayer(d_model=latent_dim, nhead=8),
            num_layers=2
        )
        # 轨迹解码头
        self.waypoint_head = nn.Sequential(
            nn.Linear(latent_dim, 256),
            nn.SiLU(),
            nn.Linear(256, n_waypoints * 2),  # (x, y) × 6 步
        )
    
    def forward(self, z_sequence, z_lang):
        # z_sequence: [K+1, B, 512]  (当前 + K 步未来)
        # z_lang: [L, B, 768]  (语言 token 序列)
        
        # 语言条件化: 让潜在状态关注语言指令
        z_attended, _ = self.cross_attn(
            query=z_sequence, key=z_lang, value=z_lang
        )
        # 时序聚合
        z_pooled = self.temporal_pool(z_attended)
        z_ego = z_pooled[0]  # 取当前时刻的聚合特征
        
        # 输出轨迹
        waypoints = self.waypoint_head(z_ego)
        return waypoints.reshape(-1, 6, 2)  # [B, 6, 2]
```

---

## 5. 三阶段训练策略

### 阶段一：视觉-语言对齐预训练

```
目标: 让视觉编码器理解驾驶场景语义

训练任务:
  1. 场景描述生成: 给定 6 相机图像 → 生成场景文字描述
  2. 目标问答: "前方 20 米内有几辆车？" → "3 辆"
  3. 空间关系理解: "左前方的红色轿车在哪条车道？"

损失函数:
  L_stage1 = L_caption + λ_qa * L_qa

训练数据: nuScenes + DriveLM + nuScenes-QA
冻结: 语言模型主干（仅训练视觉编码器和适配层）
```

### 阶段二：世界模型预训练

```
目标: 学习驾驶场景的物理动力学

训练任务:
  1. 未来状态预测: z_t → 预测 z_{t+1}, ..., z_{t+5}
  2. 动作条件化预测: (z_t, a_t) → z_{t+1}
  3. 对比学习: 真实未来 vs 随机扰动未来（区分合理/不合理的未来）

损失函数:
  L_stage2 = L_pred + λ_contrast * L_contrast + λ_kl * L_kl

  其中:
  L_pred = Σ_k ||z_{t+k}^pred - z_{t+k}^gt||^2  (MSE 预测损失)
  L_contrast = InfoNCE(z_pred, z_gt, z_neg)       (对比损失)
  L_kl = KL(q(z|x) || p(z))                      (VAE 正则化)

训练数据: nuScenes 视频序列 + NAVSIM
冻结: 视觉编码器（保留阶段一学到的表征）
```

### 阶段三：端到端规划联合微调

```
目标: 联合优化 VLA + 世界模型，学习"先想后做"

训练任务:
  1. 轨迹规划: 给定场景 + 导航指令 → 预测未来 3s 轨迹
  2. 安全评估: 利用世界模型评估候选轨迹的安全性
  3. 闭环 RL 微调: 在 NAVSIM 仿真中用 PDMS 作为奖励

损失函数:
  L_stage3 = L_traj + λ_safety * L_safety + λ_rl * L_rl

  其中:
  L_traj = Σ_t ||ŷ_t - y_t^gt||^2                (轨迹 L2 损失)
  L_safety = Σ_t max(0, d_safe - d(ŷ_t, obstacles))  (安全约束)
  L_rl = -E[PDMS(τ)]                              (RL 奖励最大化)

训练数据: nuScenes 规划数据 + NAVSIM 闭环仿真
解冻: 全部参数联合训练（学习率分层衰减）
```

### 训练超参数

| 超参数 | 阶段一 | 阶段二 | 阶段三 |
|--------|--------|--------|--------|
| 学习率 | 1e-4 | 5e-5 | 2e-5 |
| Batch Size | 32 | 64 | 16 |
| 训练步数 | 50K | 100K | 30K |
| GPU | 8× A100 | 8× A100 | 8× A100 |
| 训练时长 | ~12h | ~24h | ~8h |

---

## 6. 实验结果

### 6.1 主要结果

| 基准 | 指标 | DriveWorld-VLA | 对比最优 | 提升 |
|------|------|:---:|:---:|:---:|
| **NAVSIMv1** | PDMS ↑ | **91.3** | 88.0 (OpenDriveVLA) | +3.7% |
| **NAVSIMv2** | EPDMS ↑ | **86.8** | 83.1 (Alpamayo-R1) | +4.5% |
| **nuScenes** | L2 (3s) ↓ | **1.15** | 1.65 (UniAD) | -30% |
| **nuScenes** | 碰撞率 ↓ | **0.16%** | 0.25% (UniAD) | -36% |

### 6.2 消融实验

```
逐步添加组件的性能变化（nuScenes L2 @ 3s）：

基础 VLA（无世界模型）:              1.65m
+ 像素级世界模型（传统方案）:         1.42m  (↓14%)  但推理慢 5x
+ 潜在空间世界模型（本文）:           1.28m  (↓22%)  推理速度持平
+ Latent CoT（K=3 步推演）:          1.21m  (↓27%)
+ Latent CoT（K=5 步推演）:          1.15m  (↓30%)  ← 最终方案
+ 动作扰动数据增强:                   1.12m  (↓32%)
```

### 6.3 推理速度对比

| 方案 | 推理延迟 | FPS | 备注 |
|------|---------|-----|------|
| 像素级 WM + VLA | ~520ms | 1.9 | 需要生成图像帧 |
| 文本 CoT + VLA | ~380ms | 2.6 | 自回归文本生成 |
| **DriveWorld-VLA** | **~95ms** | **10.5** | 特征级推演 |
| Alpamayo-R1 | ~99ms | 10.1 | 车载部署优化版 |

---

## 7. 关键洞察与局限

### 7.1 为什么潜空间比像素空间更好？

```
像素空间的问题:
  1. 维度爆炸: 一帧 6 相机图像 = 6 × 900 × 1600 × 3 = 25.9M 像素
  2. 冗余信息: 大量像素是背景（天空/地面），对规划无用
  3. 生成难度: 需要 GAN/Diffusion，训练不稳定
  4. 误差累积: 像素预测误差在多步推演中快速放大

潜空间的优势:
  1. 低维紧凑: z_t ∈ R^{512}，比像素小 50,000x
  2. 语义丰富: 编码器已提取了对规划有用的语义特征
  3. 预测稳定: MSE 损失在特征空间更稳定
  4. 误差可控: 特征空间的误差不会像素级放大
```

### 7.2 局限性

1. **仍依赖 nuScenes 分布**：在 nuScenes 之外的场景（如中国城市道路）泛化性未验证
2. **世界模型误差累积**：K > 5 步后预测误差显著增大，限制了长程规划能力
3. **闭环评估仍有差距**：NAVSIM 是非反应式仿真，真实闭环性能有待验证
4. **计算资源需求高**：三阶段训练共需 ~44h × 8 A100，工业界可复现但学术界门槛较高

---

## 8. 与相关工作的关系

```
自动驾驶端到端演进路线:

BEVFormer (2022) ──→ 纯视觉 BEV 感知基础
    ↓
UniAD (2023) ──→ 端到端统一框架（感知→预测→规划）
    ↓
VAD (2023) ──→ 向量化表示，效率提升
    ↓
OpenDriveVLA (2025) ──→ 引入开源 LLM，语言理解
    ↓
DriveWorld-VLA (2026) ──→ 世界模型 + VLA 统一，"先想后做"
    ↓
下一步? ──→ 多模态世界模型 + 因果推理 + 真实闭环 RL
```

---

## 9. 关键公式汇总

**潜在状态转移**：
$$z_{t+1} = f_{\text{trans}}(z_t, a_t; \theta_{\text{world}})$$

**Latent CoT 规划**：
$$\hat{a}_t = \pi\!\left(\{z_{t+k}\}_{k=0}^{K},\; z_{\text{lang}};\; \theta_{\text{VLA}}\right)$$

**世界模型训练损失**：
$$\mathcal{L}_{\text{world}} = \sum_{k=1}^{K} \left\| z_{t+k}^{\text{pred}} - z_{t+k}^{\text{gt}} \right\|_2^2 + \lambda_{\text{KL}} \cdot D_{\text{KL}}\!\left(q_\phi(z|x) \,\|\, p(z)\right)$$

**端到端联合损失**：
$$\mathcal{L}_{\text{total}} = \mathcal{L}_{\text{traj}} + \lambda_1 \mathcal{L}_{\text{world}} + \lambda_2 \mathcal{L}_{\text{safety}} + \lambda_3 \mathcal{L}_{\text{RL}}$$

---

*Signal 知识平台 · 论文精读系列 · 自动驾驶方向*  
*本解读基于 arXiv:2602.06521 原文深度整理，部分实现细节参考论文附录及相关工作推断。*
