---
title: "VAD: Vectorized Scene Representation for Efficient Autonomous Driving"
description: "VAD 论文精读：用向量化场景表示替代密集 BEV 栅格，将端到端自动驾驶推理速度提升 2.5x，同时在 nuScenes 上超越 UniAD"
date: "2026-04-13"
updatedAt: "2026-04-13 14:00"
agent: "研究员→编辑→审校员"
tags:
  - "自动驾驶"
  - "端到端"
  - "向量化表示"
  - "高效推理"
type: "paper"
---

# VAD: Vectorized Scene Representation for Efficient Autonomous Driving

> **论文**: VAD: Vectorized Scene Representation for Efficient Autonomous Driving  
> **作者**: Bo Jiang, Shaoyu Chen, Qing Xu, Bencheng Liao, Jiajie Chen, Helong Zhou, Qian Zhang, Wenyu Liu, Chang Huang, Xinggang Wang  
> **机构**: Huazhong University of Science and Technology / Horizon Robotics  
> **发表**: ICCV 2023  
> **领域**: 自动驾驶 · 端到端规划  
> **重要度**: ⭐⭐⭐⭐⭐ (5/5) — 向量化端到端驾驶的奠基工作，超越 UniAD 且快 2.5x  
> **arXiv**: https://arxiv.org/abs/2303.12077  
> **GitHub**: https://github.com/hustvl/VAD

## 一句话总结

VAD 用**向量化场景表示**替代 UniAD 的密集 BEV 栅格，将 Agent 轨迹和地图元素都表示为向量序列，通过向量化约束直接指导规划——在 nuScenes 上超越 UniAD 的同时，推理速度提升 **2.5x**。

## 核心问题：密集 BEV 的效率瓶颈

### UniAD 的效率问题

```
UniAD 的密集 BEV 表示:
  BEV 特征图: 200×200×256 = 10,240,000 个特征值
  
  问题:
  1. 内存占用大: 200×200 BEV 特征 → 大量 GPU 内存
  2. 计算量大: 在密集 BEV 上做 Attention → O(N²) 复杂度
  3. 冗余信息多: 大部分 BEV 格子是空的（无物体）
  4. 推理慢: UniAD 端到端推理 ~500ms，无法实时
  
  核心矛盾:
  自动驾驶真正关心的是:
  - 附近有哪些车/人？（稀疏的 Agent）
  - 道路结构是什么？（稀疏的地图元素）
  
  而不是:
  - 每个 0.5m×0.5m 格子里有什么？（密集栅格）
```

### VAD 的核心洞察

> **场景是稀疏的。** 用向量表示稀疏的 Agent 和地图元素，比密集栅格更高效、更自然。

```
VAD 的向量化表示:

  Agent 表示:
  每个 Agent → 一条轨迹向量序列
  [p_0, p_1, ..., p_T] ∈ R^{T×2}
  
  地图表示:
  每个地图元素（车道线/人行道/路口）→ 一条折线向量
  [v_0, v_1, ..., v_K] ∈ R^{K×2}
  
  对比:
  UniAD: 200×200 密集栅格 → 40,000 个格子
  VAD:   ~50 个 Agent + ~100 个地图元素 → 150 个向量
  
  稀疏度: 150 vs 40,000 → 267x 更稀疏！
```

## 架构设计

### 整体架构

```
输入: 多相机图像
  ↓
BEV 编码器 (BEVFormer)
  ↓ BEV 特征
  ┌──────────────────────────────────────┐
  │           VAD 核心模块               │
  │                                      │
  │  ┌─────────────┐  ┌───────────────┐  │
  │  │ Agent 感知   │  │  地图感知      │  │
  │  │ (检测+跟踪)  │  │ (在线建图)    │  │
  │  │             │  │               │  │
  │  │ 输出:        │  │ 输出:          │  │
  │  │ Agent 轨迹   │  │ 地图折线向量   │  │
  │  │ 向量序列     │  │               │  │
  │  └──────┬──────┘  └───────┬───────┘  │
  │         │                 │          │
  │         └────────┬────────┘          │
  │                  ↓                   │
  │         向量化场景表示                │
  │    (Agent 轨迹 + 地图折线)            │
  │                  ↓                   │
  │         ┌────────────────┐           │
  │         │  规划模块       │           │
  │         │ + 向量化约束    │           │
  │         └────────────────┘           │
  └──────────────────────────────────────┘
  ↓
规划轨迹
```

### 向量化场景表示

```python
# VAD 的向量化表示

class VectorizedScene:
    # Agent 表示: 每个 Agent 的历史+预测轨迹
    agent_trajectories: Tensor  # [N_agents, T, 2]
    agent_types: Tensor         # [N_agents] 车/人/自行车
    agent_scores: Tensor        # [N_agents] 置信度
    
    # 地图表示: 每个地图元素的折线
    map_polylines: Tensor       # [N_map, K, 2]
    map_types: Tensor           # [N_map] 车道/人行道/路口
    map_scores: Tensor          # [N_map] 置信度

# 向量化的优势:
# 1. 自然表示: 轨迹本来就是点序列
# 2. 可微分: 可以直接对轨迹点求梯度
# 3. 高效: 只处理有意义的元素，忽略空白区域
```

### 向量化约束规划

```
VAD 的规划约束设计:

  传统方法: 规划器输出轨迹，用碰撞检测后处理
  VAD 方法: 将约束直接编码到规划损失中

  约束 1: Agent 避碰约束
  ┌─────────────────────────────────────┐
  │ 对每个 Agent 轨迹 τ_i:              │
  │ 计算 ego 轨迹与 τ_i 的最近距离      │
  │ 如果距离 < 安全阈值 d_safe:          │
  │   添加排斥力 (repulsion loss)        │
  └─────────────────────────────────────┘
  
  约束 2: 地图约束
  ┌─────────────────────────────────────┐
  │ 对每个地图折线 m_j:                  │
  │ 计算 ego 轨迹与 m_j 的距离           │
  │ 如果 m_j 是道路边界:                 │
  │   ego 轨迹不能越过 m_j               │
  │ 如果 m_j 是车道中心线:               │
  │   ego 轨迹应该沿 m_j 行驶            │
  └─────────────────────────────────────┘

  损失函数:
  L_plan = L_L2 + λ_agent * L_agent + λ_map * L_map
  
  其中:
  L_L2: 规划轨迹与 GT 的 L2 距离
  L_agent: Agent 避碰约束损失
  L_map: 地图约束损失
```

### 运动预测：向量化 Transformer

```
VAD 的运动预测模块:

  输入: Agent Query (来自检测/跟踪)
        地图 Query (来自在线建图)
  
  1. Agent-Agent Attention
     每个 Agent 关注其他 Agent
     → 建模社会交互（跟车/超车/避让）
  
  2. Agent-Map Attention
     每个 Agent 关注地图元素
     → 建模道路约束（不能逆行/不能穿越路口）
  
  3. 多模态预测
     每个 Agent 预测 K=6 条轨迹
     每条轨迹有置信度分数
  
  关键: 所有操作都在向量空间进行
        无需在密集 BEV 上做 Attention
        → 计算量大幅降低
```

## 实验结果

### nuScenes 规划任务

| 方法 | L2 (1s) ↓ | L2 (2s) ↓ | L2 (3s) ↓ | Col. Rate ↓ | FPS ↑ |
|------|:---:|:---:|:---:|:---:|:---:|
| ST-P3 | 1.33 | 2.11 | 3.10 | 0.23% | 1.6 |
| UniAD | 0.48 | 0.96 | 1.65 | 0.05% | 1.8 |
| **VAD** | **0.41** | **0.70** | **1.05** | **0.07%** | **4.5** |

**VAD 在 L2(3s) 上超越 UniAD（1.05 vs 1.65），同时推理速度快 2.5x（4.5 vs 1.8 FPS）**

### 消融实验

```
向量化约束的贡献 (L2 @ 3s):

基础规划器 (无约束):              1.52m
+ Agent 避碰约束:                 1.28m  (↓16%)
+ 地图约束:                       1.12m  (↓12%)
+ 向量化运动预测:                  1.05m  (↓6%)

速度消融:
  密集 BEV 规划 (类 UniAD):       1.8 FPS
  向量化规划 (VAD):               4.5 FPS  (2.5x 提速)
```

### 与 UniAD 的对比分析

```
VAD vs UniAD 的核心差异:

                UniAD           VAD
表示方式:       密集 BEV 栅格    向量化序列
规划约束:       占用预测代价图   向量化约束损失
运动预测:       OccFormer       向量化 Transformer
推理速度:       1.8 FPS         4.5 FPS
L2 (3s):       1.65m           1.05m
碰撞率:         0.05%           0.07%

结论:
  VAD 在规划精度上更好（L2 更低）
  UniAD 在碰撞率上略好（0.05% vs 0.07%）
  VAD 在速度上明显更好（2.5x）
  
  两者各有侧重，VAD 更适合实际部署
```

## 核心创新点

### 1. 向量化场景表示的范式转变

VAD 开创了**向量化端到端驾驶**的研究方向：
- 将稀疏的 Agent 和地图元素用向量表示
- 避免了密集 BEV 的计算冗余
- 为后续 SparseDrive、StreamPETR 等工作奠定基础

### 2. 可微分向量化约束

```
传统规划约束: 后处理（不可微分）
  规划输出轨迹 → 碰撞检测 → 如果碰撞则重新规划
  问题: 梯度无法传播，规划器无法学习避碰

VAD 的向量化约束: 训练时可微分
  约束损失直接参与反向传播
  规划器学会"主动避碰"而非"被动修正"
```

### 3. 对后续工作的影响

```
VAD 之后的向量化驾驶研究:

VAD (2023) → 向量化场景表示
    ↓
SparseDrive (2024) → 稀疏化 + 并行解码
    ↓
VADv2 (2024) → 更大规模，更多数据
    ↓
OpenDriveVLA (2025) → 向量化 + LLM
    ↓
DriveWorld-VLA (2026) → 向量化 + 世界模型
```

---

*Signal 知识平台 · 论文精读系列 · 模型架构方向*
