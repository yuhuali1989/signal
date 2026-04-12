---
title: "OpenDriveVLA: 基于开源 LLM 的端到端自动驾驶 VLA 模型"
description: "首个基于开源 LLM 构建的端到端自动驾驶 Vision-Language-Action 模型，统一感知、规划与控制，在 nuScenes 上实现 SOTA"
date: "2026-04-11"
tags:
  - "自动驾驶"
  - "VLA"
  - "端到端"
  - "视觉语言动作"
type: "paper"
---

# OpenDriveVLA: Towards End-to-end Autonomous Driving with Large Vision Language Action Model

**作者**: Xingcheng Zhou et al.
**机构**: 阿里巴巴、西安交通大学
**发表**: arXiv 2025/2026 | [Paper](https://arxiv.org/abs/2503.23463) | [GitHub](https://github.com/DriveVLA/OpenDriveVLA)
**重要度**: ⭐⭐⭐⭐⭐

---

## 一句话总结

> OpenDriveVLA 首次证明：**基于开源 LLM，通过统一的视觉-语言-动作架构，可以实现端到端自动驾驶并达到 SOTA 水平**——不需要独立的感知、预测、规划模块。

---

## 1. 问题背景

### 传统自动驾驶 pipeline

```
感知（检测/分割） → 预测（轨迹预测） → 规划（路径规划） → 控制（PID/MPC）
     ↓                  ↓                 ↓                ↓
   独立模块           独立模块          独立模块          独立模块
```

**核心问题**：
- 模块间信息损失（感知结果传递时丢失不确定性信息）
- 级联误差放大（上游错误传递到下游）
- 缺乏全局推理能力（各模块只看局部信息）
- 长尾场景处理困难（需要人工为每个模块设计规则）

### VLA 范式的愿景

```
多模态输入（相机/雷达/地图/语言指令）
          ↓
  统一 VLA 模型（一个模型做所有事）
          ↓
  直接输出控制信号（转向角/加速度/刹车）
```

但此前的 VLA 模型要么：
- 基于闭源 LLM（无法复现）
- 仅在简单仿真环境验证
- 没有在标准 benchmark 上评估

## 2. 核心方法

### 2.1 架构设计

```
                    ┌─────────────────────┐
                    │  Language Instruction│
                    │  "Turn left at the  │
                    │   intersection"     │
                    └─────────┬───────────┘
                              │
┌──────────────┐              │
│ Multi-Camera │   ┌──────────┴──────────┐
│ Images (6×)  │──→│   Visual Encoder    │
│              │   │   (ViT + Adapter)   │
└──────────────┘   └──────────┬──────────┘
                              │
                    ┌─────────┴──────────┐
                    │  Open-Source LLM    │
                    │  (Backbone)        │
                    │                    │
                    │  Cross-Attention   │
                    │  with visual tokens│
                    └─────────┬──────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
     ┌────────┴─────┐ ┌──────┴──────┐ ┌──────┴──────┐
     │ Scene Under- │ │  Trajectory │ │  Control    │
     │  standing    │ │  Planning   │ │  Actions    │
     │ (文本描述)    │ │ (waypoints) │ │ (steer/acc) │
     └──────────────┘ └─────────────┘ └─────────────┘
```

### 2.2 三阶段训练策略

```python
# 阶段 1: 场景理解预训练
# 任务：给定多相机图像，生成场景描述
# 数据：nuScenes + 自动标注描述
# 目标：学习视觉-语言对齐

# 阶段 2: 轨迹规划微调
# 任务：给定场景 + 导航指令，预测未来轨迹 waypoints
# 数据：nuScenes + 专家轨迹
# 目标：学习空间推理和规划能力

# 阶段 3: 端到端控制微调
# 任务：直接输出转向角、加速度
# 数据：nuScenes + 控制信号标注
# 目标：学习低级控制映射

# 关键设计：多任务联合训练
loss = (
    lambda_scene * loss_scene_understanding +
    lambda_traj  * loss_trajectory_planning +
    lambda_ctrl  * loss_control_prediction
)
```

### 2.3 视觉 Token 设计

```
传统方法：直接将 ViT 输出 flatten 为 token 序列
  → 6 个相机 × 576 tokens/相机 = 3,456 tokens
  → LLM 输入过长，推理慢

OpenDriveVLA 的 Token 压缩：
  1. ViT 提取多尺度特征 (多层 feature map)
  2. Cross-Attention Adapter 压缩到固定数量 queries
  3. BEV (Bird's Eye View) 空间聚合
  4. 最终 visual tokens << 3,456
  
  效果：减少 70% visual tokens，推理速度提升 3x
```

## 3. 实验结果

### 3.1 nuScenes 规划任务

| 方法 | L2 (1s) ↓ | L2 (2s) ↓ | L2 (3s) ↓ | Collision ↓ |
|------|:---:|:---:|:---:|:---:|
| UniAD | 0.48 | 0.96 | 1.65 | 0.05% |
| VAD | 0.41 | 0.70 | 1.05 | 0.07% |
| GenAD | 0.36 | 0.83 | 1.55 | 0.04% |
| **OpenDriveVLA** | **0.29** | **0.58** | **0.87** | **0.02%** |

### 3.2 端到端驾驶指标

| 方法 | NDS ↑ | 规划分数 ↑ | 语言理解 ↑ |
|------|:---:|:---:|:---:|
| DriveGPT4 | 54.2 | 0.68 | 0.72 |
| LMDrive | 60.1 | 0.74 | 0.81 |
| **OpenDriveVLA** | **68.5** | **0.82** | **0.89** |

### 3.3 消融实验

```
基础 LLM (无视觉)          → L2(3s) = 2.31
+ 视觉编码器（无压缩）      → L2(3s) = 1.12  (↓51%)
+ Token 压缩               → L2(3s) = 0.95  (↓15%, 速度↑3x)
+ 三阶段训练               → L2(3s) = 0.87  (↓8%)
+ 多任务联合               → L2(3s) = 0.87  (碰撞率↓60%)
```

## 4. 核心创新点

### 4.1 开源 LLM 作为基座

此前的驾驶 VLA 模型多基于闭源 LLM 或自研架构。OpenDriveVLA **首次证明开源 LLM 足以支撑端到端驾驶任务**，降低了研究门槛。

### 4.2 统一多任务输出

一个模型同时输出：
- **场景描述**（语言理解能力）
- **轨迹规划**（空间推理能力）
- **控制信号**（底层控制能力）

这种统一性让模型能在不同抽象层次之间共享表征。

### 4.3 与 DriveWorld-VLA 的关系

```
OpenDriveVLA (2025):
  开源 LLM + VLA → 端到端驾驶
  关注：可复现性、开源生态

DriveWorld-VLA (2026):
  在 OpenDriveVLA 基础上引入世界模型
  世界模型 = RL 训练环境
  进一步提升：安全性 + 长尾处理

关系: OpenDriveVLA 是基础，DriveWorld-VLA 是进化
```

## 5. 后续影响

### 5.1 VLA 成为 2026 自动驾驶核心范式

```
2024: BEV + Transformer → 感知 SOTA
2025: OpenDriveVLA → 证明 VLA 可行
2026: DriveWorld-VLA + Alpamayo → VLA 量产化

行业趋势:
  特斯拉: FSD v13 (疑似 VLA 内部)
  小鹏: FastDriveVLA (视觉 token 剪枝优化)
  蔚来: 世界模型 + 端到端
  NVIDIA: Alpamayo (开源推理 VLA)
```

### 5.2 对 Harris 研究的关联

OpenDriveVLA 的架构与 WM-SAID 的 OOD 检测工作高度互补：
- OpenDriveVLA 提供端到端驾驶基础
- WM-SAID 的世界模型 OOD 检测可嵌入 VLA 的安全层
- 结合方向：VLA + 世界模型 OOD Safety Monitor

---

## 6. 关键公式

### 轨迹预测损失

$$\mathcal{L}_{traj} = \sum_{t=1}^{T} \| \hat{p}_t - p_t^{gt} \|_2^2 + \lambda_{smooth} \sum_{t=2}^{T} \| (\hat{p}_t - \hat{p}_{t-1}) - (p_t^{gt} - p_{t-1}^{gt}) \|_2^2$$

### 碰撞损失

$$\mathcal{L}_{collision} = \sum_{t=1}^{T} \max(0, r_{ego} + r_{obj} - \| \hat{p}_t - p_{obj,t} \|_2)$$

---

*本解读由 Signal 平台 AI 智能体生成。原文请参考 [arXiv:2503.23463](https://arxiv.org/abs/2503.23463)。*
