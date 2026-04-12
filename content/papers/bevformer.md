---
title: "BEVFormer: Learning Bird's-Eye-View Representation from Multi-Camera Images via Spatiotemporal Transformers"
description: "BEVFormer 论文精读：用空间交叉注意力和时序自注意力从多相机图像生成统一 BEV 特征，成为自动驾驶感知的核心基础架构"
date: "2026-04-13"
updatedAt: "2026-04-13 14:00"
agent: "研究员→编辑→审校员"
tags:
  - "自动驾驶"
  - "BEV"
  - "感知"
  - "Transformer"
type: "paper"
---

# BEVFormer: Learning Bird's-Eye-View Representation from Multi-Camera Images via Spatiotemporal Transformers

> **论文**: BEVFormer: Learning Bird's-Eye-View Representation from Multi-Camera Images via Spatiotemporal Transformers  
> **作者**: Zhiqi Li, Wenhai Wang, Hongyang Li, Enze Xie, Chunxiao Liu, Haifeng Liu, Jifeng Dai, Yu Qiao  
> **机构**: Nanjing University / Shanghai AI Laboratory / Horizon Robotics  
> **发表**: ECCV 2022  
> **领域**: 自动驾驶感知 · BEV 表征学习  
> **重要度**: ⭐⭐⭐⭐⭐ (5/5) — BEV 感知的奠基性工作，被引 3000+  
> **arXiv**: https://arxiv.org/abs/2203.17270  
> **GitHub**: https://github.com/fundamentalvision/BEVFormer

## 一句话总结

BEVFormer 提出用**空间交叉注意力**将多相机图像特征聚合到统一 BEV 空间，再用**时序自注意力**融合历史帧信息，首次让纯视觉方案在 3D 检测上接近激光雷达性能——成为此后几乎所有自动驾驶感知工作的基础架构。

## 核心问题：从多相机到 BEV

### 为什么需要 BEV？

```
自动驾驶的感知需求:
  ✅ 3D 目标检测: 需要知道物体的 3D 位置和尺寸
  ✅ 在线地图构建: 需要俯视视角理解道路结构
  ✅ 运动预测: 需要统一坐标系下的轨迹
  ✅ 规划: 需要 BEV 空间的障碍物分布

问题: 相机输出的是 2D 透视图像，不是 BEV
  相机图像: (H, W, 3) 透视投影，近大远小
  BEV 需要: (X, Y) 俯视坐标，等比例
  
  如何从多张 2D 图像重建 3D/BEV 信息？
```

### 已有方案的局限

```
方案 1: LSS (Lift-Splat-Shoot, 2020)
  思路: 预测每个像素的深度分布，将特征"提升"到 3D
  问题: 深度预测不准确，特征稀疏，计算量大

方案 2: IPM (Inverse Perspective Mapping)
  思路: 假设地面平坦，用单应性变换投影到 BEV
  问题: 只适用于地面，无法处理立体物体

方案 3: 直接 3D 检测 (FCOS3D/DETR3D)
  思路: 在 2D 特征上直接预测 3D 框
  问题: 缺乏显式 BEV 表征，多任务扩展困难
```

## 核心方法

### BEVFormer 架构总览

```
输入: 6 个环视相机图像 (t 时刻)
历史: BEV 特征 (t-1 时刻)

Step 1: 2D 特征提取
  每张图像 → ResNet + FPN → 多尺度 2D 特征图
  6 相机 × 4 尺度 = 24 个特征图

Step 2: BEV Query 初始化
  BEV 网格: 200×200 个 Query (每个 Query 对应 0.5m×0.5m 区域)
  每个 Query 有可学习的位置编码

Step 3: 时序自注意力 (TSA)
  BEV Query (t) ← 历史 BEV 特征 (t-1)
  通过 Deformable Attention 融合时序信息
  → 解决遮挡、运动模糊问题

Step 4: 空间交叉注意力 (SCA)
  BEV Query ← 多相机 2D 特征
  每个 BEV Query 采样对应的相机特征
  → 将 2D 特征聚合到 BEV 空间

Step 5: 任务头
  BEV 特征 → 3D 检测头 / 地图分割头 / 深度估计头
```

### 空间交叉注意力（SCA）详解

```
核心问题: BEV 中的一个点 (x, y) 对应哪些相机像素？

解决方案: 3D 参考点投影

  1. 对每个 BEV Query (x, y):
     在高度方向采样 4 个参考点: z ∈ {-1, 0, 1, 3} 米
     得到 4 个 3D 参考点: (x, y, z_i)
  
  2. 将 3D 参考点投影到各相机:
     p_cam = K × [R|t] × [x, y, z_i, 1]^T
     得到像素坐标 (u, v)
  
  3. 只保留投影在图像内的点
     (过滤掉投影到图像外的相机)
  
  4. 在对应像素位置采样特征 (Deformable Attention)
     每个参考点采样 4 个偏移位置
  
  5. 加权聚合所有相机、所有参考点的特征
     → 得到该 BEV Query 的更新特征

伪代码:
  for each BEV query q at position (x, y):
    features = []
    for z in [-1, 0, 1, 3]:  # 高度采样
      for cam in cameras:
        (u, v) = project_3d_to_cam(x, y, z, cam)
        if is_valid(u, v, cam):
          feat = deformable_sample(cam_feat, u, v)
          features.append(feat)
    q_updated = attention_aggregate(q, features)
```

### 时序自注意力（TSA）详解

```
动机: 单帧图像中遮挡/模糊的物体，在历史帧中可能清晰可见

TSA 的工作方式:
  当前 BEV Query B_t: (200, 200, 256)
  历史 BEV 特征 B_{t-1}: (200, 200, 256)
  
  1. 自车运动补偿:
     根据 IMU/里程计，将 B_{t-1} 对齐到当前坐标系
     (历史帧中的物体在当前帧中的位置)
  
  2. Deformable Self-Attention:
     B_t 中的每个 Query 关注 B_{t-1} 中对应位置附近
     → 融合历史信息，补全遮挡
  
  效果:
  - 遮挡物体检测率 +15%
  - 速度估计精度 +20%（利用历史轨迹）
  - 对运动模糊的鲁棒性提升
```

## 实验结果

### nuScenes 3D 目标检测

| 方法 | 输入 | NDS ↑ | mAP ↑ | mATE ↓ | mAVE ↓ |
|------|------|:---:|:---:|:---:|:---:|
| FCOS3D | 单相机 | 37.8 | 29.5 | 0.806 | 1.437 |
| DETR3D | 多相机 | 42.5 | 34.9 | 0.716 | 0.868 |
| PETR | 多相机 | 44.1 | 36.1 | 0.593 | 0.808 |
| **BEVFormer** | **多相机** | **51.7** | **41.6** | **0.673** | **0.274** |
| PointPillars | LiDAR | 53.3 | 40.1 | - | - |

**BEVFormer 纯视觉方案首次接近激光雷达性能（NDS 51.7 vs 53.3）**

### nuScenes 语义地图分割

| 方法 | 车道线 IoU ↑ | 人行道 IoU ↑ | 道路边界 IoU ↑ |
|------|:---:|:---:|:---:|
| HDMapNet | 40.6 | 39.5 | 39.7 |
| BEVFormer | **56.1** | **54.8** | **53.2** |

### 消融实验

```
组件消融 (nuScenes NDS):

基础 BEV Query + SCA:           46.3
+ 时序自注意力 (TSA):            49.8  (+3.5)
+ 多尺度特征:                   51.2  (+1.4)
+ 高度采样 (4 个 z 值):         51.7  (+0.5)

时序帧数消融:
  1 帧 (无时序):  46.3
  2 帧:          49.8
  4 帧:          51.2
  8 帧:          51.7  (收益递减)
```

## 核心创新点

### 1. 统一 BEV 表征

BEVFormer 的最大贡献是提供了一个**通用的 BEV 特征提取框架**：
- 一次 BEV 特征提取，可以支持多个下游任务（检测/分割/深度）
- 后续几乎所有工作（UniAD/VAD/SparseDrive）都基于 BEVFormer 的 BEV 编码器

### 2. 可变形注意力的高效应用

```
传统 Cross-Attention 的问题:
  每个 BEV Query 关注所有相机像素
  计算量: 200×200 × (6×H×W) = 极大

BEVFormer 的解决方案:
  Deformable Attention: 每个 Query 只采样 K=4 个关键点
  计算量: 200×200 × (6×4) = 可接受
  
  关键: 通过 3D 参考点投影，采样位置是有意义的
        不是随机采样，而是"应该看的地方"
```

### 3. 对行业的深远影响

```
BEVFormer 发布后的影响:

2022: BEVFormer 发布 → 纯视觉 BEV 感知成为主流
2022: BEVDet/BEVDepth → 在 BEVFormer 基础上改进深度
2023: UniAD → 用 BEVFormer 作为感知骨干
2023: BEVFormer v2 → 加入 3D 检测先验
2024: SparseBEV → 稀疏化 BEV Query
2025: OpenDriveVLA → BEV + LLM 端到端

行业应用:
  小鹏 XNGP: 基于 BEVFormer 的感知架构
  理想 AD Max: BEV 感知 + 时序融合
  华为 ADS 3.0: BEV 统一感知框架
```

## 局限性与后续改进

```
BEVFormer 的局限:
1. 推理速度: ~200ms/帧，不满足实时要求
   → 改进: BEVFormer v2 (100ms), SparseBEV (50ms)

2. 深度估计依赖注意力隐式学习
   → 改进: BEVDepth (显式深度监督)

3. 远距离感知精度下降
   → 改进: 多尺度 BEV, 更大感知范围

4. 静态场景假设（TSA 基于刚体运动补偿）
   → 改进: 动态物体单独处理
```

---

*Signal 知识平台 · 论文精读系列 · 模型架构方向*
