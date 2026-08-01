---
title: "VLA 与世界模型：训练过程全解 - 第3章: 数据工程：从遥操作到 Open X-Embodiment"
book: "VLA 与世界模型：训练过程全解"
chapter: "3"
chapterTitle: "数据工程：从遥操作到 Open X-Embodiment"
description: "完整拆解 VLA 训练数据的采集、格式化、清洗、增强全流程，包括遥操作方案、Open X-Embodiment 数据集、动作表征三种范式"
date: "2026-08-01"
updatedAt: "2026-08-01"
agent: "研究员→编辑→审校员"
tags:
  - "数据工程"
  - "遥操作"
  - "Open X-Embodiment"
  - "动作表征"
  - "VLA"
type: "book"
---

# 第 3 章：数据工程——从遥操作到 Open X-Embodiment

## 3.1 VLA 数据的本质

VLA 训练数据是一条条**轨迹**（trajectory），每条轨迹是一系列时间同步的（图像, 指令, 动作）三元组：

```
轨迹 τ = [(I_0, ℓ, a_0), (I_1, ℓ, a_1), ..., (I_T, ℓ, a_T)]

其中:
  I_t = 第 t 步的摄像头图像（可多视角）
  ℓ   = 自然语言任务指令（整条轨迹共享或分段）
  a_t = 第 t 步的机器人动作（7维: Δxyz + Δrpy + gripper）
```

一条典型的桌面操作轨迹产生 500-2000 个时间步，每个时间步的完整数据包括：

| 数据流 | 频率 | 单步数据量 | 1 条轨迹(1000步) |
|--------|------|------------|-------------------|
| RGB 图像（1-2 个摄像头） | 5-30 fps | 224×224×3 = 150KB | 150-300 MB |
| 语言指令 | 1/轨迹 | ~50 token | — |
| 关节角度（本体状态） | 控制频率 | 7-20 float | ~80 KB |
| 末端执行器位姿 | 控制频率 | 7 float (xyz+rpy) | ~28 KB |
| 夹爪状态 | 控制频率 | 1 float | ~4 KB |

## 3.2 遥操作数据采集

### 3.2.1 采集方案对比

| 方案 | 原理 | 采集速率 | 数据质量 | 成本 |
|------|------|----------|----------|------|
| VR 手柄遥操作 | 操作员戴 VR 头盔看机器人视角，用手柄控制 | 12-25 条/小时 | 高 | 中（VR 设备+CloudXR） |
| 空间鼠标 | 6-DOF 鼠标直接控制末端执行器 | 15-30 条/小时 | 中 | 低 |
| 动觉教学（Kinesthetic） | 人手直接移动机器人关节 | 5-10 条/小时 | 最高 | 无额外设备 |
| Apple Vision Pro | 混合现实手部追踪 | 10-20 条/小时 | 高 | 高 |
| 3D 打印外骨骼 | 手指级灵巧操作 | 8-15 条/小时 | 高 | 中 |

NVIDIA GR00T 平台使用 VR 头盔 + CloudXR 串流方案，在 Isaac Lab 仿真环境中采集演示数据。一次典型的采集命令：

```bash
python isaaclab_arena/scripts/imitation_learning/record_demos.py \
  --viz kit \
  --enable_cameras \
  --dataset_file $DATASET_DIR/apple_dataset.hdf5 \
  --num_demos 400 \
  --num_success_steps 10 \
  galileo_g1_static_pick_and_place \
  --object apple_01 \
  --destination clay_plate \
  --teleop_device openxr
```

### 3.2.2 数据质量 > 数据数量

VLA 数据采集中，**质量比数量更重要**。 novice 操作员产生的次优轨迹会严重降低策略性能。关键质量指标：

| 指标 | 合格标准 | 检测方法 |
|------|----------|----------|
| 轨迹平滑度 | 加速度峰值 < 2× 专家均值 | 关节加速度分析 |
| 任务成功率 | 采集时 > 90% | 人工/自动判定 |
| 指令多样性 | 同一任务 ≥ 5 种表述 | 语言模型聚类 |
| 环境多样性 | 背景/光照/物体 ≥ 3 种变体 | 视觉特征聚类 |
| 接近方向多样性 | ≥ 3 种不同抓取角度 | 末端执行器轨迹分析 |

### 3.2.3 采集成本估算

| 规模 | 操作员小时 | 成本（$15/小时） | 时间 |
|------|------------|-------------------|------|
| 1,000 条 | 50-80 小时 | $750-1,200 | 1-2 周 |
| 10,000 条 | 500-800 小时 | $7,500-12,000 | 2-3 月 |
| 50,000 条 | 2,000-4,000 小时 | $30,000-60,000 | 6-12 月 |

GR00T Blueprint 的价值在于：11 小时计算 = 6500 小时人工演示等价数据，将成本压缩了 **590×**。

## 3.3 Open X-Embodiment 数据集

### 3.3.1 数据集概览

Open X-Embodiment（OXE）是 VLA 训练的"ImageNet 时刻"——由 22 个研究机构联合发布，包含 22 种不同机器人实体的 100 万+条轨迹。

| 维度 | 数值 |
|------|------|
| 参与机构 | 22（Google DeepMind、Stanford、UC Berkeley 等） |
| 机器人实体 | 22 种（Franka、WidowX、Google Robot、Kuka 等） |
| 轨迹总数 | ~100 万条 |
| 图像帧数 | ~数千万帧 |
| 任务类型 | 拾取、放置、推、倒、开抽屉等 |
| 控制频率 | 5-20 Hz（不同机器人不同） |
| 动作空间 | 4-7 维（不同实体不同） |

### 3.3.2 数据格式标准化

OXE 采用 RLDS（Reinforcement Learning Datasets）格式，每个数据集包含：

```
dataset/
  ├── episode_000001/
  │   ├── step_0:  {image, instruction, action, is_terminal}
  │   ├── step_1:  {image, instruction, action, is_terminal}
  │   └── ...
  ├── episode_000002/
  └── ...
```

GR00T 1.7 使用 LeRobot 格式（Hugging Face 兼容），转换配置：

```yaml
# g1_static_apple_config.yaml
data_root: /datasets/isaaclab_arena/static_apple_tutorial
hdf5_name: "arena_g1_static_apple_dataset_recorded.hdf5"
language_instruction: "move the apple to the plate"
state_name_sim: "robot_joint_pos"
action_name_sim: "processed_actions"
pov_cam_name_sim: "robot_head_cam_rgb"
fps: 50
chunks_size: 1000
```

### 3.3.3 跨具身数据混合策略

不同机器人的动作空间维度不同（Franka 7维、WidowX 4维、Google Robot 7维），直接混合训练会冲突。两种解决策略：

**策略1：统一动作空间（OpenVLA）**

将所有机器人的动作映射到统一的 7 维空间（Δxyz + Δrpy + gripper），不足的维度补零。优点是简单统一，缺点是丢失了关节级信息。

**策略2：实体特定 token化（Octo/π0）**

为每种机器人设计特定的输入/输出 token。Octo 使用任务特定的 tokenizer；π0 通过本体状态向量 q_t 自然区分不同实体，action expert 自适应不同维度的动作。

## 3.4 动作表征：三种范式

动作如何表示为模型可以输出的形式，是 VLA 架构设计的核心决策。

### 3.4.1 离散 token 化（RT-2 / OpenVLA）

将每个连续动作维度离散化为 256 个 bin，然后用文本 token 表示：

```python
# OpenVLA 的动作离散化
def discretize_action(action_7d, bins=256):
    # action_7d: [Δx, Δy, Δz, Δrx, Δry, Δrz, gripper]
    # 每个维度映射到 [0, 255] 的整数
    tokens = []
    for dim in action_7d:
        bin_idx = int((dim - min_val) / (max_val - min_val) * (bins - 1))
        tokens.append(str(bin_idx))  # "128", "91", "241", ...
    return " ".join(tokens)  # "1 128 91 241 5 101 127"
```

**优点**：直接复用 LLM 的 vocabulary 和 next-token prediction，无需额外模块。

**缺点**：
- 离散化损失精度（256 bins → 7维连续空间分辨率有限）
- 自回归生成 7 个 token 需 7 步前向传播，限制控制频率
- 无法表达多模态动作分布（同一观测下多种合理动作）

### 3.4.2 Diffusion 动作头（Octo / GR00T N1）

用去噪扩散过程生成连续动作：

```python
# Diffusion Policy 训练
def train_diffusion_step(model, obs, expert_action):
    # 1. 随机采样时间步 t
    t = random.uniform(0, 1)
    # 2. 给专家动作加噪
    noise = torch.randn_like(expert_action)
    noisy_action = t * expert_action + (1 - t) * noise
    # 3. 预测噪声
    predicted_noise = model(noisy_action, obs, t)
    # 4. MSE 损失
    loss = mse_loss(predicted_noise, noise)
```

**优点**：天然支持多模态分布、连续平滑、精度高。

**缺点**：推理需要多步迭代去噪（通常 10-50 步），延迟较高。

### 3.4.3 Flow Matching（π0）

π0 使用 flow matching——一种比标准 diffusion 更灵活的连续归一化流方法：

```python
# π0 的 Flow Matching 训练
def train_flow_matching(model, obs, expert_action_chunk):
    # expert_action_chunk: [a_t, a_{t+1}, ..., a_{t+H-1}], H=50
    t = random.uniform(0, 1)  # 或 Beta 采样
    noise = torch.randn_like(expert_action_chunk)
    # 线性插值路径
    noisy_chunk = t * expert_action_chunk + (1 - t) * noise
    # 预测速度场
    predicted_velocity = model(noisy_chunk, obs, t)
    # 目标速度场
    target_velocity = expert_action_chunk - noise
    loss = mse_loss(predicted_velocity, target_velocity)
```

**推理**（10 步 Euler 积分）：

```python
def infer_flow_matching(model, obs, steps=10):
    chunk = torch.randn(50, 7)  # 纯噪声
    delta = 1.0 / steps
    for i in range(steps):
        v = model(chunk, obs, i * delta)
        chunk = chunk + delta * v
    return chunk  # 50 步动作序列
```

**关键优势**：生成 50 步动作序列（action chunk）而非单步动作，确保了时序连贯性，是 π0 实现折叠衣物等长时序灵巧任务的关键。

### 3.4.4 三种范式对比

| 维度 | 离散 Token | Diffusion | Flow Matching |
|------|-----------|-----------|---------------|
| 代表模型 | RT-2, OpenVLA | Octo, GR00T N1 | π0 |
| 多模态分布 | ❌ | ✅ | ✅ |
| 动作精度 | 中（256 bins） | 高 | 高 |
| 推理步数 | 7步（自回归） | 10-50步（去噪） | 10步（Euler） |
| 控制频率 | 5-6 Hz (OpenVLA) | 10-20 Hz | 50 Hz (π0) |
| Action Chunk | ❌（单步） | ✅（可扩展） | ✅（H=50） |
| 实现复杂度 | 最低 | 中 | 中高 |

## 3.5 数据增强

### 3.5.1 视觉增强

GR00T 1.7 后训练使用 color jitter 增强视觉鲁棒性：

```bash
--color-jitter-params brightness 0.3 contrast 0.4 saturation 0.5 hue 0.08
```

### 3.5.2 语言增强

用 LLM 生成同一指令的多种表述：

```
原始: "pick up the red cup"
增强: "grab the red mug"
      "take the red container"
      "lift the red cup from the table"
      "could you get me that red cup?"
```

### 3.5.3 合成数据增强（GR00T Blueprint 四阶段）

```
Stage 1: 遥操作 → 少量种子演示（~50-200条）
Stage 2: MimicGen → 仿真中自动生成变体（~1000条）
Stage 3: Cosmos 神经轨迹生成 → 大规模合成（~78万条）
Stage 4: 混合训练 → 真实+合成
```

GR00T Blueprint 的关键数据：**11 小时计算 = 78 万条轨迹 = 6500 小时人工演示**，混合后性能提升 40%。

## 3.6 小结

VLA 数据工程的核心要点：

1. **质量 > 数量**：novice 数据会降低策略性能
2. **OXE 是基础**：100 万+条跨 22 种实体的公开数据
3. **动作表征决定架构**：离散 token → 自回归 VLA；Diffusion/Flow → 扩散 VLA
4. **合成数据是未来**：GR00T Blueprint 将数据采集成本压缩 590×
5. **Co-fine-tuning 防遗忘**：50% VLM + 50% 机器人数据是最佳配比

下一章将深入 VLA 的架构设计——视觉编码器、语言模型和动作头如何组装成完整的策略模型。
