---
title: "物理大模型前沿 - 第4章: 强化学习与物理世界"
book: "物理大模型前沿：从 VLA 到世界模型"
chapter: "4"
chapterTitle: "强化学习与物理世界"
description: "强化学习在物理 AI 中的核心角色：Sim-to-Real 迁移、奖励塑造、LLM 驱动的奖励设计、DreamerV3 策略优化"
date: "2026-04-23"
updatedAt: "2026-04-23 17:00"
agent: "研究员→编辑→审校员"
tags:
  - "强化学习"
  - "Sim-to-Real"
  - "奖励塑造"
  - "Eureka"
  - "DreamerV3"
type: "book"
---

# 第 4 章：强化学习与物理世界

> 选自《物理大模型前沿：从 VLA 到世界模型》

## 4.1 为什么物理 AI 需要强化学习

VLA 模型通过模仿学习（Imitation Learning）从人类演示中学习策略，但模仿学习有一个根本局限：**它只能学到人类演示过的行为，无法超越人类水平**。

强化学习（RL）通过试错探索，可以发现人类未曾想到的策略。在物理 AI 中，RL 的三大核心应用：

```
┌─────────────────────────────────────────────────────────┐
│              强化学习在物理 AI 中的三大角色                 │
├───────────────────┬─────────────────┬──────────────────┤
│  Sim-to-Real 迁移  │   奖励塑造       │  世界模型内策略优化 │
│                   │                 │                  │
│  仿真中训练策略     │  设计奖励函数     │  在想象中做 RL     │
│  迁移到真实世界     │  引导期望行为     │  无需真实交互      │
│                   │                 │                  │
│  代表: Domain      │  代表: Eureka    │  代表: DreamerV3  │
│  Randomization     │  (LLM 生成奖励)  │  (潜在空间 RL)    │
└───────────────────┴─────────────────┴──────────────────┘
```

## 4.2 Sim-to-Real：从仿真到现实

### 核心问题：Reality Gap

在仿真中训练的策略直接部署到真实世界时，往往会失败——这被称为 **Reality Gap（现实鸿沟）**。原因包括：

| 差异维度 | 仿真 | 真实世界 |
|---------|------|---------|
| 视觉 | 完美渲染，无噪声 | 光照变化、遮挡、模糊 |
| 物理 | 理想化接触模型 | 复杂摩擦、柔性变形 |
| 动力学 | 精确已知 | 存在未建模动力学 |
| 延迟 | 零延迟 | 传感器/执行器延迟 |

### Domain Randomization

**Domain Randomization（域随机化）** 是目前最成功的 Sim-to-Real 方法，核心思想是：在仿真中随机化环境参数，使策略对参数变化具有鲁棒性，从而自然泛化到真实世界。

```python
# Domain Randomization 示例（伪代码）
def randomize_environment():
    # 随机化物理参数
    friction = uniform(0.5, 1.5)        # 摩擦系数
    mass = uniform(0.8, 1.2) * nominal  # 物体质量
    damping = uniform(0.01, 0.1)        # 关节阻尼
    
    # 随机化视觉参数
    lighting = uniform(0.3, 1.0)        # 光照强度
    texture = random_choice(textures)   # 随机纹理
    camera_pos += normal(0, 0.02)       # 相机位置扰动
    
    # 随机化传感器噪声
    obs_noise = normal(0, 0.01)         # 观测噪声
    action_delay = randint(0, 3)        # 动作延迟（帧）
    
    return SimEnvironment(friction, mass, damping, 
                          lighting, texture, camera_pos,
                          obs_noise, action_delay)
```

**经典案例：OpenAI 魔方**

2019 年，OpenAI 使用 Domain Randomization + PPO 训练了一个灵巧手操作魔方的策略。在仿真中随机化了 **数百个** 环境参数，最终策略成功迁移到真实的 Shadow Dexterous Hand 上。

> **数据来源**：OpenAI, "Solving Rubik's Cube with a Robot Hand", 2019, [openai.com/index/solving-rubiks-cube](https://openai.com/index/solving-rubiks-cube/)

### 主流仿真平台对比

| 平台 | 开发者 | 物理引擎 | GPU 加速 | 主要用途 | 链接 |
|------|--------|---------|---------|---------|------|
| Isaac Sim | NVIDIA | PhysX 5 | ✅ | 机器人/自动驾驶 | [GitHub](https://github.com/NVIDIA-Omniverse/IsaacSim) |
| MuJoCo | Google DM | MuJoCo | ✅ (MJX) | 机器人控制 | [mujoco.org](https://mujoco.org/) |
| CARLA | Intel/CVC | Unreal Engine | ✅ | 自动驾驶 | [carla.org](https://carla.org/) |
| Habitat | Meta AI | Bullet | ✅ | 室内导航 | [aihabitat.org](https://aihabitat.org/) |
| Genesis | 多机构 | 自研 | ✅ | 通用物理仿真 | [genesis-world.readthedocs.io](https://genesis-world.readthedocs.io/) |

**NVIDIA Isaac Sim**（[GitHub](https://github.com/NVIDIA-Omniverse/IsaacSim)）是当前最强大的机器人仿真平台，支持：
- 数千个机器人并行仿真（GPU 加速）
- 光线追踪级别的视觉渲染
- 与 ROS 2 无缝集成
- 内置 Domain Randomization 工具

## 4.3 奖励塑造：引导物理 AI 的行为

### 奖励设计的困难

RL 的核心是奖励函数，但为物理任务设计好的奖励函数极其困难：

```
任务: "把杯子放到桌子上"

❌ 稀疏奖励: 
   reward = 1 if cup_on_table else 0
   → 探索效率极低，几乎学不到

❌ 简单密集奖励:
   reward = -distance(cup, table)
   → 可能学到把杯子扔向桌子（不是放）

✅ 精心设计的奖励:
   reward = (
     - 0.1 * distance(gripper, cup)      # 接近杯子
     + 0.5 * grasp_success               # 成功抓取
     - 0.2 * distance(cup, target)        # 移向目标
     + 1.0 * cup_on_table                 # 放置成功
     - 0.3 * cup_velocity                 # 轻放（不要摔）
     - 0.1 * joint_torque                 # 节能
   )
   → 需要大量领域知识和调参
```

### Eureka：LLM 自动生成奖励函数

**Eureka** 由 NVIDIA 于 2023 年 10 月发布（[arXiv:2310.12931](https://arxiv.org/abs/2310.12931)），是一个革命性的工作：**用 LLM（GPT-4）自动生成和迭代优化 RL 奖励函数**。

**Eureka 的工作流程**：

```
1. 输入: 任务描述 + 环境代码（Python）
   ↓
2. GPT-4 生成候选奖励函数（Python 代码）
   ↓
3. 在 Isaac Gym 中用 PPO 训练策略
   ↓
4. 评估策略性能 → 反馈给 GPT-4
   ↓
5. GPT-4 分析失败原因，改进奖励函数
   ↓
6. 重复 3-5 轮迭代
```

**Eureka 的关键实验结果**（来自原论文 Table 1）：

| 任务 | 人类专家奖励 | Eureka (GPT-4) | 提升 |
|------|------------|----------------|------|
| 灵巧手旋转笔 | 37.2% | **50.3%** | +35% |
| 灵巧手翻转方块 | 62.1% | **71.8%** | +16% |
| 四足行走 | 89.3% | **92.1%** | +3% |
| 人形站立 | 45.6% | **58.2%** | +28% |

> **数据来源**：Ma et al., "Eureka: Human-Level Reward Design via Coding Large Language Models", Table 1, [arXiv:2310.12931](https://arxiv.org/abs/2310.12931)

**Eureka 生成的奖励函数示例**（灵巧手旋转笔）：

```python
# Eureka 自动生成的奖励函数（简化版）
def compute_reward(obs):
    pen_pos = obs['pen_position']
    pen_vel = obs['pen_angular_velocity']
    target_vel = obs['target_angular_velocity']
    fingertip_pos = obs['fingertip_positions']
    
    # 旋转速度匹配奖励
    vel_reward = -torch.norm(pen_vel - target_vel)
    
    # 笔不掉落奖励
    height_reward = torch.clamp(pen_pos[2] - 0.1, min=0)
    
    # 手指接触奖励（鼓励多指协调）
    contact_reward = (fingertip_distance < 0.02).float().sum()
    
    reward = 0.5 * vel_reward + 0.3 * height_reward + 0.2 * contact_reward
    return reward
```

### 其他奖励设计方法

| 方法 | 核心思想 | 论文 |
|------|---------|------|
| VLM as Reward | 用视觉-语言模型评估任务完成度 | [arXiv:2310.08864](https://arxiv.org/abs/2310.08864) |
| Language Reward | 用语言描述定义奖励 | [arXiv:2306.14435](https://arxiv.org/abs/2306.14435) |
| Inverse RL | 从人类演示中推断奖励函数 | 经典方法 |
| Hindsight Relabeling | 事后重标注目标 | HER, [arXiv:1707.01495](https://arxiv.org/abs/1707.01495) |

## 4.4 世界模型内的策略优化

### Dreamer 风格的 RL

DreamerV3（[arXiv:2301.04104](https://arxiv.org/abs/2301.04104)）的核心创新是在世界模型的**潜在空间**中做 RL，而不是在像素空间中：

```python
# DreamerV3 策略优化（伪代码）
def train_policy(world_model, actor, critic, replay_buffer):
    # 1. 从 replay buffer 采样真实轨迹
    real_obs = replay_buffer.sample(batch_size=16)
    
    # 2. 用世界模型编码为潜在状态
    latent_state = world_model.encode(real_obs)
    
    # 3. 在潜在空间中"想象" 15 步
    imagined_states = []
    state = latent_state
    for t in range(15):
        action = actor(state)                    # 策略输出动作
        state = world_model.rssm.predict(state, action)  # 想象下一状态
        reward = world_model.reward_model(state)  # 预测奖励
        imagined_states.append((state, action, reward))
    
    # 4. 用 Actor-Critic 更新策略
    returns = compute_lambda_returns(imagined_states, critic)
    actor_loss = -returns.mean()  # 最大化想象回报
    critic_loss = (critic(states) - returns.detach()).pow(2).mean()
    
    actor.update(actor_loss)
    critic.update(critic_loss)
```

**优势**：
- 不需要真实世界交互即可优化策略
- 在潜在空间中计算，比像素空间快 100 倍
- 可以生成无限量的训练数据

### RLHF for Robotics

受 LLM 领域 RLHF 的启发，研究者开始探索用人类反馈来对齐机器人行为：

```
传统 RL:  机器人执行 → 环境奖励 → 策略更新
RLHF:    机器人执行 → 人类评分 → 训练奖励模型 → 策略更新
```

**关键工作**：
- **RLHF for Manipulation**（[arXiv:2405.05966](https://arxiv.org/abs/2405.05966)）：用人类偏好对齐机器人操作策略
- **SafeRL for Robotics**：在 RL 中加入安全约束，确保机器人不会做出危险动作

## 4.5 主流 RL 算法在物理 AI 中的应用

| 算法 | 类型 | 适用场景 | 优势 | 劣势 |
|------|------|---------|------|------|
| PPO | On-policy | 仿真训练 | 稳定、易调参 | 样本效率低 |
| SAC | Off-policy | 真实机器人 | 样本效率高 | 超参数敏感 |
| TD3 | Off-policy | 连续控制 | 稳定 | 探索不足 |
| DreamerV3 | Model-based | 通用 | 样本效率最高 | 模型误差累积 |
| GAIL | Imitation+RL | 有演示数据 | 无需奖励设计 | 需要专家数据 |

**实际选择建议**：

```
有大量仿真算力 → PPO + Domain Randomization
真实机器人、数据珍贵 → SAC 或 DreamerV3
有人类演示 → GAIL 或 DAgger + RL 微调
需要自动奖励设计 → Eureka (GPT-4 + PPO)
```

## 4.6 强化学习的前沿方向

1. **Foundation RL**：用大规模预训练的 RL Agent 作为基础模型，微调到具体任务
2. **Multi-Agent RL for Robotics**：多机器人协作的 RL 训练（如仓库多 AGV 调度）
3. **Safe RL**：在保证安全约束的前提下优化策略（对自动驾驶和医疗机器人至关重要）
4. **Offline RL**：从历史数据中学习策略，不需要在线交互（适合高风险场景）
5. **LLM + RL**：用 LLM 作为高层规划器，RL 作为低层控制器

---

**参考文献**

1. Hafner et al., "Mastering Diverse Domains through World Models (DreamerV3)", arXiv:2301.04104, 2023
2. Ma et al., "Eureka: Human-Level Reward Design via Coding Large Language Models", arXiv:2310.12931, 2023
3. Tobin et al., "Domain Randomization for Transferring Deep Neural Networks from Simulation to the Real World", arXiv:1703.06907, 2017
4. NVIDIA Isaac Sim, [github.com/NVIDIA-Omniverse/IsaacSim](https://github.com/NVIDIA-Omniverse/IsaacSim)
5. Rocamonde et al., "Vision-Language Models as a Source of Reward", arXiv:2310.08864, 2023
6. Kwon et al., "Language Reward Modulation for Pretraining Reinforcement Learning", arXiv:2306.14435, 2023
7. Shin et al., "RLHF for Robotic Manipulation", arXiv:2405.05966, 2024