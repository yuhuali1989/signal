---
title: "UniAD: Planning-oriented Autonomous Driving"
description: "CVPR 2023 最佳论文精读：UniAD 用统一 Transformer 框架将感知、预测、规划串联为端到端系统，首次证明任务协同可大幅提升规划性能"
date: "2026-04-13"
updatedAt: "2026-04-13 14:00"
agent: "研究员→编辑→审校员"
tags:
  - "自动驾驶"
  - "端到端"
  - "感知规划"
  - "Transformer"
type: "paper"
---

# UniAD: Planning-oriented Autonomous Driving

> **论文**: Planning-oriented Autonomous Driving  
> **作者**: Yihan Hu, Jiazhi Yang, Li Chen, Keyu Li, Chonghao Sima, Xizhou Zhu, Siqi Chai, Senyao Du, Tianwei Lin, Wenhai Wang, Lewei Lu, Xiaosong Jia, Qiang Liu, Jifeng Dai, Yu Qiao, Hongyang Li  
> **机构**: Shanghai AI Laboratory / 上海人工智能实验室  
> **发表**: CVPR 2023 **Best Paper Award** 🏆  
> **领域**: 自动驾驶 · 端到端感知规划  
> **重要度**: ⭐⭐⭐⭐⭐ (5/5) — CVPR 2023 最佳论文，端到端自动驾驶里程碑  
> **arXiv**: https://arxiv.org/abs/2212.10156  
> **GitHub**: https://github.com/OpenDriveLab/UniAD

## 一句话总结

UniAD 提出以**规划为导向**的统一自动驾驶框架，将感知（跟踪/建图）、预测（运动/占用）、规划串联为一个端到端 Transformer，通过任务协同让规划性能大幅超越模块化方案——**CVPR 2023 最佳论文**。

## 核心问题：为什么要统一？

### 传统模块化 Pipeline 的问题

```
传统方案:
  感知 → 预测 → 规划 → 控制
  (各模块独立训练，接口传递中间结果)

问题 1: 信息损失
  感知输出 3D bbox → 预测只能用 bbox，丢失了视觉特征
  
问题 2: 误差级联
  感知错误 → 预测错误 → 规划错误 → 事故
  
问题 3: 优化目标不一致
  感知优化 mAP，规划优化 L2 误差
  感知 mAP 高 ≠ 规划性能好
  
问题 4: 缺乏全局推理
  规划时不知道"为什么"某辆车会这样运动
  无法利用场景语义进行推理
```

### UniAD 的核心洞察

> **规划是目标，感知和预测是手段。** 所有中间任务都应该服务于最终规划目标。

```
UniAD 的设计原则:
  1. 以规划为导向 (Planning-oriented)
     → 所有模块的特征都流向规划模块
     → 规划的梯度可以反向传播到感知
     
  2. 统一 Query 机制
     → 用 Agent Query 表示每个交通参与者
     → Query 在各模块间传递，携带完整语义
     
  3. 端到端训练
     → 所有模块联合优化
     → 规划损失可以指导感知学习"有用的特征"
```

## 架构设计

### 整体架构

```
                    多相机图像 (6×)
                         ↓
              ┌─── BEV 编码器 (BEVFormer) ───┐
              │   BEV 特征: (200×200×256)    │
              └──────────────┬───────────────┘
                             │
              ┌──────────────▼───────────────┐
              │      TrackFormer (跟踪)        │
              │  Agent Query ← BEV 特征       │
              │  输出: 每个 Agent 的 Query     │
              └──────────────┬───────────────┘
                             │ Agent Queries
              ┌──────────────▼───────────────┐
              │      MapFormer (建图)          │
              │  Map Query ← BEV + Agent      │
              │  输出: 矢量化地图元素           │
              └──────────────┬───────────────┘
                             │ Agent + Map Queries
              ┌──────────────▼───────────────┐
              │    MotionFormer (运动预测)      │
              │  预测每个 Agent 未来轨迹        │
              │  Agent-Agent 交互建模          │
              └──────────────┬───────────────┘
                             │ 运动预测结果
              ┌──────────────▼───────────────┐
              │     OccFormer (占用预测)        │
              │  预测未来 BEV 占用网格          │
              │  考虑所有 Agent 的运动          │
              └──────────────┬───────────────┘
                             │ 占用预测结果
              ┌──────────────▼───────────────┐
              │       Planner (规划)           │
              │  GRU + 占用感知代价函数         │
              │  输出: 未来 3s 规划轨迹         │
              └──────────────────────────────┘
```

### 关键设计：Agent Query

```python
# Agent Query 是 UniAD 的核心数据结构
# 每个 Query 代表一个交通参与者（车/人/自行车）

class AgentQuery:
    # 初始化: 从 BEV 特征中检测并初始化
    query_feat: Tensor  # [N_agents, D=256] 语义特征
    query_pos:  Tensor  # [N_agents, 2] BEV 坐标
    
    # 在各模块间传递，不断更新
    # TrackFormer: 更新跟踪状态
    # MotionFormer: 添加运动预测信息
    # 最终传给 Planner 用于规划
```

### MotionFormer：多模态运动预测

```
MotionFormer 的关键设计:

  输入: Agent Queries + Map Queries
  
  1. Scene-level Attention (场景级注意力)
     每个 Agent 关注所有其他 Agent 和地图元素
     → 建模 Agent-Agent 交互
     → 建模 Agent-Map 约束（不能穿越道路边界）
  
  2. 多模态预测
     每个 Agent 预测 K=6 条可能轨迹
     每条轨迹有对应的置信度分数
     → 捕捉行为不确定性（直行 vs 左转 vs 右转）
  
  3. 轨迹格式
     预测未来 3s，每 0.5s 一个 waypoint
     输出: (K=6, T=6, 2) 的轨迹集合
```

### Planner：占用感知规划

```python
# 规划器的核心：占用感知代价函数
def planning_cost(trajectory, occupancy_pred):
    """
    trajectory: (T, 2) 规划轨迹
    occupancy_pred: (T, H, W) 未来占用预测
    """
    cost = 0
    for t in range(T):
        # 1. 碰撞代价: 规划轨迹不能经过被占用的区域
        ego_pos = trajectory[t]  # (x, y)
        occ_at_ego = bilinear_sample(occupancy_pred[t], ego_pos)
        cost += collision_weight * occ_at_ego
        
        # 2. 舒适度代价: 避免急转弯和急刹车
        if t > 0:
            accel = trajectory[t] - 2*trajectory[t-1] + trajectory[t-2]
            cost += comfort_weight * accel.norm()
    
    return cost

# GRU 规划器: 迭代优化轨迹
# 初始轨迹 → GRU → 代价函数梯度 → 更新轨迹 → 循环
```

## 实验结果

### nuScenes 规划任务（主要结果）

| 方法 | L2 (1s) ↓ | L2 (2s) ↓ | L2 (3s) ↓ | Col. Rate ↓ |
|------|:---:|:---:|:---:|:---:|
| ST-P3 | 1.33 | 2.11 | 3.10 | 0.23% |
| BEV-Planner | 0.78 | 1.45 | 2.34 | 0.18% |
| **UniAD** | **0.48** | **0.96** | **1.65** | **0.05%** |

**UniAD 将 L2(3s) 从 3.10 降到 1.65（↓47%），碰撞率从 0.23% 降到 0.05%（↓78%）**

### 感知任务结果

| 任务 | 指标 | UniAD | 独立模型 |
|------|------|-------|---------|
| 3D 目标检测 | mAP | 38.5 | 35.2 |
| 多目标跟踪 | AMOTA | 35.9 | 32.1 |
| 在线建图 | mAP | 29.8 | 27.4 |
| 运动预测 | minADE | 0.71 | 0.84 |
| 占用预测 | IoU | 63.4 | 58.2 |

**关键发现：联合训练让所有感知任务都比独立训练更好！**

### 消融实验

```
逐步添加模块的规划性能 (L2 @ 3s):

仅 BEV 特征 + 规划器:          2.73m
+ TrackFormer (跟踪):          2.21m  (↓19%)
+ MapFormer (建图):            1.98m  (↓10%)
+ MotionFormer (运动预测):     1.82m  (↓8%)
+ OccFormer (占用预测):        1.65m  (↓9%)

结论: 每个中间任务都对规划有贡献，缺一不可
```

## 核心创新点

### 1. 规划导向的任务设计

UniAD 不是简单地把多个任务拼在一起，而是**以规划为目标重新设计了每个任务的输出格式**：
- 运动预测输出的是"对规划有用的轨迹"，而非仅仅是 mADE 最优的轨迹
- 占用预测输出的是"规划器可以直接使用的代价图"

### 2. 端到端梯度流

```
规划损失 → 反向传播 → OccFormer → MotionFormer → TrackFormer → BEV 编码器

这意味着:
- BEV 编码器学会提取"对规划有用的特征"
- 跟踪模块学会关注"对规划重要的 Agent"
- 整个系统协同优化，而非各自为政
```

### 3. 对后续工作的影响

```
UniAD 之后的自动驾驶研究路线:

UniAD (2023) → 证明端到端可行
    ↓
VAD (2023) → 向量化场景表示，更高效
    ↓
SparseDrive (2024) → 稀疏表示，进一步提速
    ↓
OpenDriveVLA (2025) → 引入 LLM，语言理解
    ↓
DriveWorld-VLA (2026) → 世界模型 + VLA，量产化
```

## 局限性

1. **推理速度慢**：多个 Transformer 模块串联，端到端推理 ~500ms，无法实时
2. **仅在 nuScenes 验证**：未在真实闭环场景测试
3. **规划仍是开环评估**：L2 误差不能完全反映真实驾驶性能

---

*Signal 知识平台 · 论文精读系列 · 模型架构方向*
