---
title: "物理大模型前沿 - 第1章: 从语言智能到物理智能"
book: "物理大模型前沿：从 VLA 到世界模型"
chapter: "1"
chapterTitle: "从语言智能到物理智能"
description: "物理大模型的定义、发展脉络、核心技术栈，以及 VLA/世界模型/强化学习三大支柱的全景概览"
date: "2026-04-23"
updatedAt: "2026-04-23 17:00"
agent: "研究员→编辑→审校员"
tags:
  - "物理大模型"
  - "VLA"
  - "世界模型"
  - "强化学习"
  - "具身智能"
type: "book"
---

# 第 1 章：从语言智能到物理智能

> 选自《物理大模型前沿：从 VLA 到世界模型》

## 1.1 什么是物理大模型

**物理大模型（Physical Foundation Model）** 是指能够理解物理世界的三维结构、动力学规律和因果关系，并据此做出决策和执行动作的大规模预训练模型。与纯语言大模型（LLM）处理文本 token 不同，物理大模型的输入是多模态感知数据（视觉、激光雷达、触觉、本体感觉），输出是连续的物理动作（关节角度、速度、力矩）。

| 维度 | 语言大模型 (LLM) | 物理大模型 (Physical FM) |
|------|-----------------|------------------------|
| 输入 | 文本 token | 图像/点云/触觉/本体感觉 |
| 输出 | 文本 token | 连续动作（关节角/速度/力矩） |
| 训练数据 | 互联网文本（15T+ tokens） | 机器人轨迹 + 仿真数据（稀缺） |
| 评估 | MMLU / HumanEval | 真实世界任务成功率 |
| 核心挑战 | 幻觉、推理 | 泛化、安全、sim-to-real |
| 代表工作 | GPT-4 / Claude / Gemini | RT-2 / OpenVLA / GAIA-1 |

> **关键洞察**：语言大模型的成功源于互联网文本的海量供给（Common Crawl 15T+ tokens），而物理大模型面临的根本瓶颈是**真实世界交互数据的极度稀缺**——全球所有机器人实验室的轨迹数据加起来，可能不到 GPT-4 训练数据的 0.001%。

## 1.2 发展脉络：三次范式跃迁

### 第一次跃迁：从手工特征到端到端学习（2015-2020）

传统机器人控制依赖手工设计的感知-规划-控制流水线。2016 年，Levine et al. 在 Google Brain 的工作 [*Learning Hand-Eye Coordination for Robotic Grasping*](https://arxiv.org/abs/2304.02643) 开创了端到端视觉运动策略学习的先河，直接从图像像素映射到机器人抓取动作。

```
传统流水线:  感知 → 建图 → 规划 → 控制 → 执行
端到端学习:  感知 ──────────────────────→ 执行
```

### 第二次跃迁：从单任务到基础模型（2022-2024）

2022 年，Google DeepMind 发布 **RT-1**（[arXiv:2212.06293](https://arxiv.org/abs/2212.06293)），首次证明大规模机器人数据（13 万条真实轨迹）可以训练出具有泛化能力的机器人基础模型。随后 **RT-2**（[arXiv:2307.15818](https://arxiv.org/abs/2307.15818)）将视觉-语言模型（VLM）与机器人动作空间融合，开创了 **VLA（Vision-Language-Action）** 范式。

| 模型 | 发布时间 | 参数量 | 训练数据 | 关键突破 |
|------|---------|--------|---------|---------|
| RT-1 | 2022.12 | 35M | 130K 真实轨迹 | 首个大规模机器人基础模型 |
| RT-2 | 2023.07 | 55B | RT-1 数据 + 互联网 VL 数据 | VLM→VLA，语言指令泛化 |
| Octo | 2024.05 | 93M | Open X-Embodiment 800K 轨迹 | 开源通用机器人策略 |
| OpenVLA | 2024.06 | 7B | Open X-Embodiment 970K 轨迹 | 开源 VLA，Prismatic VLM 骨干 |
| π₀ | 2024.10 | 3B | 10K+ 小时多任务数据 | Flow Matching 动作生成 |

> **数据来源**：Open X-Embodiment 数据集（[GitHub](https://github.com/google-deepmind/open_x_embodiment)）汇集了 22 个机器人形态、21 个机构的 100 万+轨迹，是当前最大的开源机器人数据集。

### 第三次跃迁：世界模型 + 强化学习闭环（2024-至今）

2024 年起，研究界开始探索**世界模型（World Model）**——一个能预测物理世界未来状态的生成模型——作为物理大模型的核心组件。世界模型可以在"想象"中生成无限训练数据，突破真实数据的瓶颈。

代表工作：
- **GAIA-1**（Wayve, 2023）：首个自动驾驶世界模型，生成逼真驾驶视频（[arXiv:2309.17080](https://arxiv.org/abs/2309.17080)）
- **UniSim**（Google DeepMind, 2023）：通用世界模拟器（[arXiv:2310.06114](https://arxiv.org/abs/2310.06114)）
- **Cosmos**（NVIDIA, 2024）：物理 AI 世界基础模型（[arXiv:2501.12399](https://arxiv.org/abs/2501.12399)）

## 1.3 三大技术支柱

物理大模型的技术栈可以分解为三大支柱：

```
┌─────────────────────────────────────────────────────────┐
│                    物理大模型技术栈                        │
├───────────────┬──────────────────┬──────────────────────┤
│   VLA 模型     │    世界模型       │    强化学习           │
│  (感知→动作)   │  (预测→想象)      │   (试错→优化)        │
├───────────────┼──────────────────┼──────────────────────┤
│ RT-2          │ GAIA-1           │ PPO / SAC            │
│ OpenVLA       │ Cosmos           │ RLHF for Robotics    │
│ π₀            │ UniSim           │ Sim-to-Real Transfer │
│ Octo          │ DayDreamer       │ Reward Shaping       │
├───────────────┴──────────────────┴──────────────────────┤
│              多模态感知层（视觉/激光雷达/触觉/IMU）         │
├─────────────────────────────────────────────────────────┤
│              物理仿真平台（Isaac Sim / MuJoCo / CARLA）   │
└─────────────────────────────────────────────────────────┘
```

### 支柱一：VLA（Vision-Language-Action）模型

VLA 模型将视觉-语言理解能力与机器人动作生成统一在一个模型中。核心思路是将机器人动作离散化为 token（类似语言 token），然后用 Transformer 自回归生成。

**关键论文**：
- RT-2: [arXiv:2307.15818](https://arxiv.org/abs/2307.15818) — Google DeepMind
- OpenVLA: [arXiv:2406.09246](https://arxiv.org/abs/2406.10165) — Stanford / UC Berkeley（[GitHub](https://github.com/openvla/openvla)）
- Octo: [arXiv:2405.12213](https://arxiv.org/abs/2405.12213) — UC Berkeley

### 支柱二：世界模型（World Model）

世界模型学习物理世界的动力学，能够预测"如果执行动作 A，世界会变成什么样"。这使得 Agent 可以在"想象"中规划和试错，而不需要真实世界交互。

**关键论文**：
- DayDreamer: [arXiv:2206.01121](https://arxiv.org/abs/2206.01121) — UC Berkeley
- GAIA-1: [arXiv:2309.17080](https://arxiv.org/abs/2309.17080) — Wayve
- Cosmos: [arXiv:2501.12399](https://arxiv.org/abs/2501.12399) — NVIDIA

### 支柱三：强化学习（Reinforcement Learning）

强化学习提供了从试错中学习最优策略的框架。在物理大模型中，RL 主要用于：
1. **策略微调**：在世界模型生成的"想象"轨迹上做 RL 优化
2. **Sim-to-Real**：在仿真中用 RL 训练，迁移到真实世界
3. **奖励塑造**：用 VLM 作为奖励函数，评估机器人行为质量

**关键论文**：
- DreamerV3: [arXiv:2301.04104](https://arxiv.org/abs/2301.04104) — Google DeepMind
- Eureka: [arXiv:2310.12931](https://arxiv.org/abs/2310.12931) — NVIDIA（LLM 自动生成奖励函数）

## 1.4 三大应用领域

| 领域 | 当前状态 | 核心挑战 | 代表公司/项目 |
|------|---------|---------|-------------|
| **自动驾驶** | L2+ 量产，L4 限定区域运营 | 长尾场景、安全验证 | Waymo / Tesla FSD / 小鹏 / 华为 |
| **机器人操作** | 实验室 demo 阶段 | 灵巧操作、泛化 | Figure / 1X / 宇树 / 智元 |
| **无人机自主飞行** | 军事/测绘已商用，城市物流试点 | 避障、法规、续航 | DJI / Skydio / Wing (Alphabet) |

本书将在后续章节中深入探讨每个支柱和每个应用领域的技术细节、当前进展和未来前景。

## 1.5 本书结构

| 章节 | 主题 | 核心内容 |
|------|------|---------|
| 第 1 章 | 从语言智能到物理智能 | 概论、发展脉络、三大支柱 |
| 第 2 章 | VLA 模型深度解析 | RT-2 / OpenVLA / π₀ 架构与训练 |
| 第 3 章 | 世界模型：在想象中学习 | GAIA-1 / Cosmos / UniSim 原理与应用 |
| 第 4 章 | 强化学习与物理世界 | Sim-to-Real / 奖励塑造 / DreamerV3 |
| 第 5 章 | 自动驾驶前沿 | 端到端方案 / VLA 上车 / 世界模型驱动 |
| 第 6 章 | 机器人操作与具身智能 | 灵巧操作 / 人形机器人 / 数据飞轮 |
| 第 7 章 | 无人机自主飞行与未来展望 | 视觉导航 / 城市物流 / 多机协同 |

---

**参考文献**

1. Brohan et al., "RT-2: Vision-Language-Action Models Transfer Web Knowledge to Robotic Control", arXiv:2307.15818, 2023
2. Kim et al., "OpenVLA: An Open-Source Vision-Language-Action Model", arXiv:2406.10165, 2024
3. Hu et al., "GAIA-1: A Generative World Model for Autonomous Driving", arXiv:2309.17080, 2023
4. NVIDIA, "Cosmos World Foundation Model Platform for Physical AI", arXiv:2501.12399, 2025
5. Open X-Embodiment Collaboration, "Open X-Embodiment: Robotic Learning Datasets and RT-X Models", 2023, [GitHub](https://github.com/google-deepmind/open_x_embodiment)
6. Hafner et al., "Mastering Diverse Domains through World Models (DreamerV3)", arXiv:2301.04104, 2023
7. Ma et al., "Eureka: Human-Level Reward Design via Coding Large Language Models", arXiv:2310.12931, 2023