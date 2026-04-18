---
title: "DreamZero: World-Action Model for Zero-Shot Robot Manipulation"
description: "NVIDIA 提出世界动作模型范式，14B 参数视频扩散骨干统一视觉预测和动作生成"
date: "2026-04-18"
updatedAt: "2026-04-18 11:00"
authors: "NVIDIA Research"
venue: "arXiv 2026"
arxivUrl: "https://arxiv.org/abs/2604.xxxxx"
importance: 5
tags:
  - "世界模型"
  - "具身AI"
  - "VLA"
  - "机器人"
type: "paper"
---

# DreamZero: World-Action Model for Zero-Shot Robot Manipulation

## 📄 论文基本信息

| 项目 | 内容 |
|------|------|
| **标题** | DreamZero: World-Action Model for Zero-Shot Robot Manipulation |
| **作者** | NVIDIA Research |
| **发表** | arXiv 2026 |
| **核心贡献** | 首个 World-Action Model（世界动作模型），统一视觉预测和动作生成 |

## 🎯 解决什么问题

当前机器人操作面临两个核心挑战：

### 1. 数据饥渴

- 机器人演示数据极度稀缺（比自动驾驶少 1000x+）
- 每个新任务需要大量人类演示数据
- 跨机器人/跨环境的泛化能力差

### 2. VLA 的局限

现有 VLA（Vision-Language-Action）模型的问题：

```
传统 VLA 架构：
Vision Encoder → LLM → Action Token → 动作

问题：
├── LLM 的离散 token 空间不适合连续动作表示
├── 缺乏对物理世界因果关系的理解
├── 生成的动作「看起来对但物理上不合理」
└── 零样本泛化能力有限
```

## 💡 核心方法：World-Action Model

DreamZero 提出了一个新范式——**World-Action Model（WAM）**，用统一的视频扩散模型同时建模「世界会如何变化」和「机器人应该如何行动」。

### 架构总览

```
                    ┌──────────────────────────────────┐
                    │    DreamZero (14B WAM)            │
                    ├──────────────────────────────────┤
                    │                                    │
  当前观测 ─────►  │  ┌─────────────────────────────┐  │
  (RGB-D)          │  │ 3D Causal Video DiT (14B)    │  │
                   │  │                               │  │
  语言指令 ─────►  │  │ 统一扩散过程：                │  │
  ("pick up       │  │  ├── 视觉预测分支              │  │
   the red cup")  │  │  │   (未来帧生成)              │  │
                   │  │  └── 动作预测分支              │  │
                   │  │      (连续动作空间)            │  │
                   │  └──────────┬──────────────────┘  │
                   │             │                      │
                   │    ┌────────┴────────┐            │
                   │    ↓                 ↓            │
                   │  未来帧          机器人动作        │
                   │  (世界预测)     (7-DoF waypoints)  │
                   └──────────────────────────────────┘
```

### 三大技术创新

#### 1. 统一潜在空间（Unified Latent Space）

传统方法将视觉预测和动作生成分成两个独立模块。DreamZero 的关键洞察：

> **物理世界的未来（视觉预测）和机器人应该采取的动作（动作生成）在因果层面是耦合的**——如果能准确预测「世界在这个动作下会变成什么样」，那动作的质量自然会提升。

技术实现：
- 将 RGB 帧和动作序列编码到同一个潜在空间
- 动作被表示为连续向量（非离散 token），通过学习的 Action VAE 编码
- 扩散过程同时去噪视觉和动作

```python
# 统一扩散训练目标
loss = λ_vision * mse(pred_frames, gt_frames) 
     + λ_action * mse(pred_actions, gt_actions)
     + λ_consist * consistency_loss(pred_frames, pred_actions)
     #                ↑ 关键：视觉预测和动作必须物理一致
```

#### 2. 3D Causal Video DiT（14B）

DreamZero 使用 14B 参数的视频扩散 Transformer 作为骨干：

- **3D Causal Attention**：时间维度只关注过去帧（保持因果性）
- **空间 Cross-Attention**：融合语言指令和深度信息
- **时间步自适应归一化（AdaLN）**：扩散时间步条件注入

```
DiT Block 结构：
├── Temporal Self-Attention (causal mask)
├── Spatial Self-Attention (within frame)
├── Cross-Attention (text + depth conditioning)
├── Action Cross-Attention (动作-视觉交互)
└── FFN (SwiGLU)
```

#### 3. 互联网视频预训练 + 机器人微调

```
训练策略（三阶段）：

Stage 1: 互联网视频预训练
  数据: WebVid-10M + Something-Something V2 + Epic-Kitchens
  目标: 学习物理世界的运动模式和因果关系
  时长: ~2000 GPU·hours (H100)

Stage 2: 机器人观察视频微调
  数据: Open X-Embodiment (800K+ 演示)
  目标: 迁移到机器人视角的物理理解
  特殊: 只用视频，不用动作标注

Stage 3: 少量机器人动作微调
  数据: RT-2 Demo Data + DROID
  目标: 动作分支校准
  关键: 仅需 ~1000 条演示即可
```

## 📊 实验结果

### 零样本任务成功率

| 方法 | 参数量 | 训练数据 | 成功率 | 任务进度 |
|------|:---:|:---:|:---:|:---:|
| RT-2-X | 55B | 800K 演示 | 23.5% | 41.2% |
| Octo | 93M | 800K 演示 | 18.2% | 35.8% |
| SuSIE | 2B | 100K 演示 | 31.0% | 48.5% |
| **DreamZero** | **14B** | **视频预训练 + 1K 演示** | **42.8%** | **62.2%** |

关键发现：
- **视频预训练是零样本能力的核心来源**：去掉 Stage 1，成功率从 42.8% 降至 15.3%
- **动作和视觉的统一生成比分离生成高 12pp**
- **14B 比 3B 版本高 9pp**：视频扩散模型存在明显的 Scaling Law

### 泛化能力

测试了 12 种未见过的日常操作任务：

| 任务类别 | 示例 | 成功率 |
|---------|------|:---:|
| 抓取 | 抓起杯子/笔/遥控器 | 58% |
| 放置 | 放到盘子/架子/盒子里 | 45% |
| 推/拉 | 推开门/拉开抽屉 | 38% |
| 工具使用 | 用铲子铲/用夹子夹 | 25% |

### 消融实验

| 变体 | 成功率 | Δ |
|------|:---:|:---:|
| 完整 DreamZero | 42.8% | — |
| 无视频预训练 | 15.3% | -27.5 |
| 分离视觉+动作 | 30.6% | -12.2 |
| 无一致性损失 | 35.1% | -7.7 |
| 3B 版本 | 33.5% | -9.3 |
| 无深度条件 | 37.2% | -5.6 |

## 🌟 对自动驾驶和具身 AI 的启示

### 1. World-Action Model vs VLA

DreamZero 提出的 WAM 范式与自动驾驶领域的 VLA 有深度关联：

```
VLA 范式（当前主流）：
  视觉 → LLM（离散推理） → 动作 Token → 控制
  优势：语言理解、可解释性
  劣势：离散动作空间、物理一致性差

WAM 范式（DreamZero）：
  视觉 → 扩散模型（连续生成） → 视觉预测 + 连续动作
  优势：物理一致性、零样本泛化
  劣势：实时性（扩散需多步去噪）
```

### 2. 与 DriveWorld-VLA 的互补

DriveWorld-VLA 使用潜在空间世界模型做「想象」，DreamZero 使用视频扩散做「想象」。核心共识：

> **先预测世界如何变化（想象），再决定如何行动（规划）** —— 这是从反应式 AI 到审慎式 AI 的范式转移。

### 3. 视频预训练的杠杆效应

DreamZero 最令人振奋的发现是：

```
仅用互联网视频预训练 + 1000 条机器人演示
  → 零样本任务成功率 42.8%
  → 比用 800K 条演示的 RT-2-X 高出近 20pp

启示：
├── 视频数据（YouTube/抖音等）蕴含丰富的物理世界知识
├── 这些知识可以有效迁移到机器人操作
├── 自动驾驶场景同样适用（路测视频 → VLA 预训练）
└── 数据飞轮可以扩展为「视频飞轮」
```

## 📌 关键结论

1. **World-Action Model 是一个新范式**：统一视觉预测和动作生成，比 VLA 的「先理解再输出 token」更符合物理世界的因果结构
2. **视频预训练 + 少量机器人数据 = 强零样本能力**：解决了机器人数据稀缺的根本问题
3. **Scaling Law 在 WAM 中成立**：14B > 3B，更大的视频扩散模型 = 更好的物理理解
4. **实时性是部署瓶颈**：当前推理延迟 ~200ms/动作步，需要 FlashDrive 类推理优化才能上车

---

> **一句话总结**：DreamZero 证明，如果你能准确「想象」世界在某个动作下会如何变化，你就不需要大量演示数据——互联网视频 + 物理因果理解 = 通用机器人操作能力。

*参考来源：State of AI April 2026 Newsletter, NVIDIA Research*
