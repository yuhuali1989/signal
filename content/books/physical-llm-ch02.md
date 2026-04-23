---
title: "物理大模型前沿 - 第2章: VLA 模型深度解析"
book: "物理大模型前沿：从 VLA 到世界模型"
chapter: "2"
chapterTitle: "VLA 模型深度解析"
description: "Vision-Language-Action 模型的架构演进、训练方法、开源生态，从 RT-2 到 OpenVLA 到 π₀ 的技术路线全解析"
date: "2026-04-23"
updatedAt: "2026-04-23 17:00"
agent: "研究员→编辑→审校员"
tags:
  - "VLA"
  - "RT-2"
  - "OpenVLA"
  - "机器人"
  - "具身智能"
type: "book"
---

# 第 2 章：VLA 模型深度解析

> 选自《物理大模型前沿：从 VLA 到世界模型》

## 2.1 VLA 的核心思想

**VLA（Vision-Language-Action）** 模型的核心思想是：将视觉-语言理解能力与机器人动作生成统一在一个 Transformer 模型中。具体来说，VLA 将机器人动作离散化为 token（类似语言 token），然后用自回归方式生成动作序列。

```python
# VLA 的核心范式（伪代码）
class VLAModel:
    def __init__(self):
        self.vision_encoder = ViT()          # 视觉编码器
        self.language_encoder = LLM()         # 语言编码器
        self.action_decoder = ActionHead()    # 动作解码器
    
    def forward(self, image, instruction):
        # 1. 编码视觉观测
        visual_tokens = self.vision_encoder(image)
        # 2. 编码语言指令
        lang_tokens = self.language_encoder(instruction)
        # 3. 融合后生成动作 token
        action_tokens = self.action_decoder(
            concat(visual_tokens, lang_tokens)
        )
        return action_tokens  # [dx, dy, dz, droll, dpitch, dyaw, gripper]
```

## 2.2 里程碑模型详解

### RT-2：VLA 范式的开创者

**RT-2**（Robotics Transformer 2）由 Google DeepMind 于 2023 年 7 月发布（[arXiv:2307.15818](https://arxiv.org/abs/2307.15818)），是首个将大规模视觉-语言模型（VLM）直接用于机器人控制的工作。

**核心架构**：

```
输入: [图像 token] + [语言指令 token]
  ↓
PaLI-X (55B) 或 PaLM-E (12B) 骨干网络
  ↓
输出: [语言 token] + [动作 token]
       "pick up the blue cup" + "1 128 91 241 5 101 127"
```

**关键设计决策**：
1. **动作 token 化**：将连续动作空间离散化为 256 个 bin，每个自由度一个 token
2. **共训练**：在互联网 VL 数据和机器人轨迹数据上联合训练
3. **涌现能力**：RT-2 展现出对未见过物体的零样本泛化（如"把泰勒·斯威夫特旁边的杯子递给我"）

**实验结果**（来自原论文 Table 1）：

| 评估维度 | RT-1 | RT-2 (PaLI-X 55B) | 提升 |
|---------|------|-------------------|------|
| 已见物体 | 87% | 90% | +3% |
| 未见物体 | 32% | 62% | **+30%** |
| 未见背景 | 36% | 72% | **+36%** |
| 语义推理 | 0% | 46% | **+46%** |

> **数据来源**：Brohan et al., "RT-2: Vision-Language-Action Models Transfer Web Knowledge to Robotic Control", Table 1, [arXiv:2307.15818](https://arxiv.org/abs/2307.15818)

### OpenVLA：开源 VLA 的标杆

**OpenVLA** 由 Stanford 和 UC Berkeley 于 2024 年 6 月发布（[arXiv:2406.10165](https://arxiv.org/abs/2406.10165)），是首个完全开源的 7B 参数 VLA 模型。

**架构设计**：

```
┌──────────────────────────────────────────────┐
│                  OpenVLA (7B)                  │
├──────────────────────────────────────────────┤
│  视觉编码器: SigLIP (400M)                     │
│  + DINOv2 (300M)                              │
│  → Prismatic VLM 融合                          │
├──────────────────────────────────────────────┤
│  语言骨干: Llama 2 (7B)                        │
│  → 自回归生成动作 token                         │
├──────────────────────────────────────────────┤
│  动作空间: 7-DoF (dx,dy,dz,rx,ry,rz,gripper) │
│  → 每个维度 256 bin 离散化                      │
└──────────────────────────────────────────────┘
```

**训练数据**：Open X-Embodiment 数据集（[GitHub](https://github.com/google-deepmind/open_x_embodiment)），包含 970K 条机器人轨迹，覆盖 22 种机器人形态。

**关键实验结果**（来自原论文 Table 2）：

| 模型 | WidowX 抓取 | Google Robot 导航 | Bridge 操作 | 平均 |
|------|------------|------------------|------------|------|
| RT-2-X (55B) | 73% | 68% | 71% | 70.7% |
| Octo (93M) | 52% | 45% | 58% | 51.7% |
| **OpenVLA (7B)** | **76%** | **62%** | **73%** | **70.3%** |

> OpenVLA 以 7B 参数达到了 55B RT-2-X 的水平，参数效率提升 8 倍。

**开源资源**：
- 代码：[github.com/openvla/openvla](https://github.com/openvla/openvla)（⭐ 3.2K+）
- 模型权重：[HuggingFace openvla/openvla-7b](https://huggingface.co/openvla/openvla-7b)
- 训练框架：基于 PyTorch + HuggingFace Transformers

### π₀：Flow Matching 动作生成

**π₀**（Pi-Zero）由 Physical Intelligence 于 2024 年 10 月发布（[arXiv:2410.24164](https://arxiv.org/abs/2410.24164)），采用了与 RT-2/OpenVLA 完全不同的动作生成范式——**Flow Matching**。

**核心创新**：
- 不再将动作离散化为 token，而是用 Flow Matching（连续归一化流）直接生成连续动作
- 支持多任务、多机器人形态的统一策略
- 在灵巧操作（如叠衣服、装箱）上展现出惊人能力

```python
# π₀ 的 Flow Matching 动作生成（伪代码）
def generate_action(observation, instruction, noise_level=0):
    # 1. 编码观测和指令
    context = encode(observation, instruction)
    # 2. 从噪声开始，通过 ODE 求解器生成动作
    action_noise = torch.randn(action_dim)
    action = ode_solve(
        flow_model,
        x_0=action_noise,
        context=context,
        t_span=[0, 1]  # 从噪声到干净动作
    )
    return action  # 连续动作，无需离散化
```

**与 token 化方法的对比**：

| 维度 | Token 化 (RT-2/OpenVLA) | Flow Matching (π₀) |
|------|------------------------|-------------------|
| 动作表示 | 离散 (256 bins) | 连续 |
| 生成方式 | 自回归 | ODE 求解 |
| 精度 | 受限于 bin 分辨率 | 理论上无限精度 |
| 多模态动作 | 困难 | 天然支持 |
| 推理速度 | 快（单次前向） | 较慢（多步 ODE） |

## 2.3 VLA 训练的核心挑战

### 挑战一：数据稀缺

机器人轨迹数据的获取成本极高。即使是最大的开源数据集 Open X-Embodiment，也只有约 100 万条轨迹——相比 LLM 训练的万亿 token 级数据，差了 6 个数量级。

**当前解决方案**：
1. **数据增强**：MimicGen（[GitHub](https://github.com/NVlabs/MimicGen)）通过少量人类演示自动生成大量训练轨迹
2. **仿真数据**：在 Isaac Sim / MuJoCo 中生成海量仿真轨迹
3. **互联网视频**：从 YouTube 等视频中提取人类操作轨迹（如 [Voltron](https://arxiv.org/abs/2302.12766)）
4. **世界模型生成**：用世界模型"想象"新的训练场景（详见第 3 章）

### 挑战二：动作空间异构

不同机器人的动作空间差异巨大：

| 机器人 | 自由度 | 动作空间 |
|--------|-------|---------|
| WidowX 机械臂 | 6+1 | [dx,dy,dz,rx,ry,rz,gripper] |
| Franka Panda | 7+1 | 7 关节角 + 夹爪 |
| 人形机器人 | 30+ | 全身关节角 + 手指 |
| 自动驾驶 | 2 | [转向角, 加速度] |
| 无人机 | 4 | [roll, pitch, yaw, thrust] |

**当前解决方案**：
- **统一动作空间**：Octo 使用 task-specific action head，不同任务共享视觉-语言骨干
- **动作 tokenizer**：将不同动作空间映射到统一的 token 空间
- **适配器微调**：OpenVLA 支持 LoRA 微调适配新机器人

### 挑战三：实时性

VLA 模型通常需要在 10-50ms 内输出动作（机器人控制频率 20-100Hz），但大模型推理延迟往往在 100ms+。

| 模型 | 参数量 | 推理延迟 (A100) | 控制频率 |
|------|--------|----------------|---------|
| RT-1 | 35M | ~15ms | 66Hz |
| Octo | 93M | ~30ms | 33Hz |
| OpenVLA | 7B | ~150ms | 6Hz |
| RT-2 | 55B | ~800ms | 1.2Hz |

**当前解决方案**：
- **模型蒸馏**：将大模型知识蒸馏到小模型（如 RT-2 → RT-1 级别）
- **量化部署**：INT4/INT8 量化 + TensorRT 优化
- **分层控制**：高层 VLA 以低频率输出子目标，低层控制器以高频率执行

## 2.4 开源 VLA 生态

截至 2026 年 4 月，VLA 开源生态已初具规模：

| 项目 | 机构 | 参数量 | 开源内容 | GitHub Stars |
|------|------|--------|---------|-------------|
| [OpenVLA](https://github.com/openvla/openvla) | Stanford/UCB | 7B | 代码+权重+数据 | 3.2K+ |
| [Octo](https://github.com/octo-models/octo) | UCB | 93M | 代码+权重 | 1.5K+ |
| [LeRobot](https://github.com/huggingface/lerobot) | HuggingFace | 多种 | 框架+数据+模型 | 8K+ |
| [Open X-Embodiment](https://github.com/google-deepmind/open_x_embodiment) | Google DM | - | 数据集 | 1K+ |

**LeRobot**（[GitHub](https://github.com/huggingface/lerobot)）是 HuggingFace 推出的机器人学习开源框架，提供了从数据采集、模型训练到真实部署的完整工具链，已成为 VLA 研究的事实标准基础设施。

## 2.5 VLA 的未来方向

1. **更大规模预训练**：随着 Open X-Embodiment 等数据集的持续扩展，VLA 模型有望达到 LLM 级别的涌现能力
2. **多模态融合**：融合触觉、力觉、听觉等更多模态，提升灵巧操作能力
3. **在线学习**：部署后持续从交互中学习，实现真正的终身学习
4. **安全对齐**：类似 RLHF，开发机器人行为的安全对齐方法

---

**参考文献**

1. Brohan et al., "RT-2: Vision-Language-Action Models Transfer Web Knowledge to Robotic Control", arXiv:2307.15818, 2023
2. Kim et al., "OpenVLA: An Open-Source Vision-Language-Action Model", arXiv:2406.10165, 2024
3. Team et al., "Octo: An Open-Source Generalist Robot Policy", arXiv:2405.12213, 2024
4. Black et al., "π₀: A Vision-Language-Action Flow Model for General Robot Control", arXiv:2410.24164, 2024
5. Open X-Embodiment Collaboration, [github.com/google-deepmind/open_x_embodiment](https://github.com/google-deepmind/open_x_embodiment)
6. Mandlekar et al., "MimicGen: A Data Generation System for Scalable Robot Learning", [github.com/NVlabs/MimicGen](https://github.com/NVlabs/MimicGen)
7. Cadena et al., "LeRobot: State-of-the-art Machine Learning for Real-World Robotics", [github.com/huggingface/lerobot](https://github.com/huggingface/lerobot)