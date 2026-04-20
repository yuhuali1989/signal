---
title: "Seed-AD: 70B 参数开源 VLA 模型，nuScenes 规划新 SOTA"
authors: "ByteDance Seed Team"
venue: "arXiv 2026"
date: "2026-04-19"
tags: ["VLA", "自动驾驶", "开源模型", "世界模型", "端到端"]
tldr: "字节 Seed-AD 开源 70B 参数 VLA 模型，首次把「想象-反思-行动」三阶段推理落地到大规模 VLA，nuScenes L2(3s) 0.54m / 碰撞率 0.11% 刷新 SOTA，车端 Orin X 推理 45ms。"
importance: 5
---

# Seed-AD: 70B 参数开源 VLA 模型，nuScenes 规划新 SOTA

## 一句话总结（TL;DR）

**Seed-AD** 是字节跳动 Seed 团队开源的 **70B 参数 VLA 自动驾驶大模型**，首次把 **VLA-World 的「想象-反思-行动」三阶段推理**工业级落地，nuScenes L2(3s) 规划误差 **0.54m**、碰撞率 **0.11%**，全面超越 VLA-World（0.58m / 0.15%）成为新 SOTA。配套开源完整训练管线、基于 UniSim 2.0 扩展的合成数据工具链，以及 Orin X 车端推理 45ms 延迟的优化实现。

## 研究背景与动机

### 为什么做这个：量产落地的 70B VLA

2026 年 Q1-Q2 出现了 VLA 领域的两大分水岭：
1. **VLA-World** 证明三阶段推理可以超越端到端二阶段范式
2. **小鹏 VLA 2.0** 证明 7B 参数 VLA 可以车端实时量产

但 7B 和三阶段推理之间存在一个鸿沟：**学术级的三阶段方法还没有 70B 规模的工业级实现**。Seed-AD 正是填补这一鸿沟：

```
VLA 发展的三个阶段：

2024：端到端 VLA（7B-13B）
├── 代表：OpenVLA、RT-2
└── 局限：简单 pattern matching，长尾场景差

2025：大规模 VLA（30B+）
├── 代表：DriveWorld-VLA 40B
└── 进展：涌现出物理推理能力

2026：三阶段 VLA（70B+）← Seed-AD 所在位置
├── 代表：VLA-World（研究）、Seed-AD（开源工业级）
└── 特点：想象→反思→行动的显式推理链路
```

### 三阶段推理的核心价值

传统端到端 VLA：
$$a_t = \pi_\theta(o_{1:t}, I)$$

其中 $o$ 是观察，$I$ 是指令，$a$ 是动作。这是一个黑盒映射，模型的决策过程对人类不可见。

三阶段 VLA（Seed-AD 采用）：
$$\tilde{s}_{t+1:t+H} = W_\phi(o_{1:t}, I) \quad (\text{想象})$$
$$r_t = R_\psi(\tilde{s}_{t+1:t+H}, I) \quad (\text{反思})$$
$$a_t = \pi_\theta(o_{1:t}, I, r_t) \quad (\text{行动})$$

其中 $W$ 是世界模型、$R$ 是反思模块、$\pi$ 是策略模块。显式的中间表示让模型的决策过程可解释、可干预。

## 核心方法

### 整体架构

```
Seed-AD 架构（70B 总参数）：

输入层
├── 多模态传感器：6 摄像头 + 5 激光雷达 + 5 毫米波
├── 车辆状态：速度/加速度/转角/档位
└── 导航指令：高精地图 + 路径 Token

        ↓

共享骨干（Shared Backbone, 40B）
├── 视觉编码器：Swin-T Ultra（12B）
├── 多模态融合：Cross-Attention × 8 层
├── 时空注意力：Temporal + Spatial（8B）
└── 统一 Latent 表示：2048 维

        ↓

三阶段推理头（各 10B）：

├── 想象模块（World Model Head, 10B）
│   ├── 预测未来 3 秒场景
│   ├── 输出：BEV 占用栅格 + 物体轨迹
│   └── 训练：自监督（未来帧重建）
│
├── 反思模块（Reflection Head, 10B）
│   ├── 输入：当前状态 + 想象的未来
│   ├── 输出：规划质量评分 + 风险等级
│   └── 训练：有监督（人类标注的风险）
│
└── 行动模块（Action Head, 10B）
    ├── 输入：当前状态 + 反思结果
    ├── 输出：轨迹点序列（10 Hz × 3s）
    └── 训练：模仿学习 + 安全奖励

        ↓

输出：未来 3 秒轨迹（30 个轨迹点）
```

### 想象模块的创新：物理一致性约束

Seed-AD 的想象模块继承了 UniSim 2.0 的物理一致性思想：

```python
class ImaginationHead(nn.Module):
    """
    想象模块：基于当前观察预测未来场景
    关键创新：引入物理一致性损失
    """
    def __init__(self, hidden_dim=2048):
        super().__init__()
        self.transformer = SpatiotemporalTransformer(...)
        self.bev_decoder = BEVDecoder(hidden_dim)
        self.traj_decoder = TrajectoryDecoder(hidden_dim)
    
    def forward(self, latent_features, num_future_steps=30):
        # 自回归预测未来 3 秒（10 Hz × 3s = 30 步）
        future_states = []
        current = latent_features
        
        for step in range(num_future_steps):
            # Transformer 预测下一时刻的 latent
            next_latent = self.transformer(current)
            
            # 解码为 BEV 占用栅格
            bev = self.bev_decoder(next_latent)
            
            # 解码为物体轨迹
            trajectories = self.traj_decoder(next_latent)
            
            future_states.append({
                'latent': next_latent,
                'bev': bev,
                'trajectories': trajectories
            })
            current = next_latent
        
        return future_states
    
    def physics_consistency_loss(self, imagined, ground_truth):
        """物理一致性损失"""
        # 1. 速度连续性：相邻帧速度变化 <= 物理加速度极限
        v_pred = self._compute_velocity(imagined)
        a_pred = self._compute_acceleration(v_pred)
        physics_loss = torch.relu(a_pred.abs() - self.max_acceleration).mean()
        
        # 2. 碰撞一致性：预测的物体位置不能重叠
        collision_loss = self._collision_penalty(imagined)
        
        # 3. 道路约束：车辆位置必须在道路范围内
        road_loss = self._off_road_penalty(imagined)
        
        return physics_loss + collision_loss + road_loss
```

### 反思模块的创新：多维度风险评分

反思模块不仅评估「这个规划好不好」，还明确指出「哪里有风险」：

```python
class ReflectionHead(nn.Module):
    """反思模块：对想象的未来进行多维度评估"""
    
    def forward(self, current_state, imagined_future, instruction):
        # 融合当前状态、想象未来、指令
        combined = self.cross_attention(
            query=current_state,
            key_value=torch.cat([imagined_future, instruction], dim=1)
        )
        
        # 多头输出：5 个维度的风险评分
        return {
            'collision_risk': self.collision_head(combined),
            'comfort_score': self.comfort_head(combined),
            'efficiency_score': self.efficiency_head(combined),
            'rule_compliance': self.compliance_head(combined),
            'overall_quality': self.quality_head(combined),
            'risky_timestep': self.timestep_attention(combined)  # 哪一帧最危险
        }
```

### 行动模块：条件式轨迹生成

行动模块在反思结果的条件下生成最终轨迹：

$$a_t = \pi_\theta(o_{1:t}, I, r_t)$$

关键设计：**当反思发现风险时，行动模块会触发「保守模式」**：

```python
def generate_action(self, state, instruction, reflection):
    if reflection['collision_risk'] > 0.3:
        # 触发保守模式：使用更稳健的策略
        action = self.conservative_policy(state, instruction)
    elif reflection['overall_quality'] < 0.5:
        # 重新规划
        alternative_imagined = self.imagination.replan(state, instruction)
        action = self.policy(state, instruction, alternative_imagined)
    else:
        # 正常模式
        action = self.policy(state, instruction, reflection)
    
    return action
```

## 关键实验结果

### 实验 1：nuScenes 规划任务 SOTA 刷新

| 方法 | L2(1s) ↓ | L2(2s) ↓ | L2(3s) ↓ | Collision(3s) ↓ | 参数量 |
|------|---------|---------|---------|----------------|--------|
| UniAD | 0.48 | 0.96 | 1.65 | 0.71% | — |
| VAD | 0.41 | 0.70 | 1.05 | 0.43% | — |
| SparseDrive | 0.30 | 0.58 | 0.95 | 0.32% | — |
| DriveWorld-VLA | 0.26 | 0.48 | 0.78 | 0.19% | 40B |
| VLA-World | 0.22 | 0.38 | **0.58** | 0.15% | 70B |
| **Seed-AD** | **0.20** | **0.35** | **0.54** | **0.11%** | **70B** |

**L2(3s) = 0.54m** 意味着 3 秒预测轨迹的平均误差仅 54 厘米，**碰撞率 0.11%** 是目前开源 VLA 中最低水平。

### 实验 2：想象模块的质量

Seed-AD 的想象模块在未来场景生成上的指标：

| 指标 | 数值 | 对比 |
|------|------|------|
| 未来 1s BEV IoU | 87.3% | UniSim 2.0: 83.1% |
| 未来 3s BEV IoU | 68.5% | UniSim 2.0: 64.2% |
| 物理违规率 | 0.3% | UniSim 2.0: 0.4% |
| 生成速度 | 22 帧/秒 | UniSim 2.0: 15 帧/秒 |

### 实验 3：车端推理性能

在 NVIDIA Orin X（254 TOPS @ INT8）上的部署数据：

| 配置 | 推理延迟 | 内存占用 | 能耗 |
|------|---------|---------|------|
| FP16 完整模型 | 180ms | 38GB | 55W |
| INT8 量化 | 72ms | 22GB | 42W |
| INT4 量化 + 蒸馏到 13B | **45ms** | **11GB** | **28W** |

**关键工程技术**：
1. **分层蒸馏**：70B → 35B → 13B（分两步，保留多步推理能力）
2. **推理加速**：KV Cache 共享 + Speculative Decoding（v3）
3. **三阶段并行**：想象/反思/行动在流水线上重叠

### 实验 4：极端场景稳健性

在闭环仿真测试（基于 CARLA）中，Seed-AD 在 12 类极端场景上的成功率：

| 场景 | 端到端 VLA | VLA-World | **Seed-AD** |
|------|-----------|-----------|-------------|
| 暴雨低可见度 | 62% | 71% | **85%** |
| 夜间强光干扰 | 55% | 68% | **82%** |
| 施工区域 | 71% | 78% | **90%** |
| 突发行人 | 81% | 89% | **94%** |
| 车辆异常变道 | 74% | 82% | **91%** |
| 隧道出入口 | 68% | 75% | **87%** |
| 平均 | 68% | 77% | **88%** |

三阶段推理在极端场景上的优势非常显著（+11pp），说明**显式的想象和反思机制确实提升了模型对未知场景的应对能力**。

## 创新点分析

### 与前人工作的区别

| 维度 | DriveWorld-VLA | VLA-World | **Seed-AD** |
|------|----------------|-----------|-------------|
| 参数量 | 40B | 70B | **70B** |
| 开源 | 部分 | 论文未开源 | **完整开源** |
| 训练管线 | 未公开 | 未公开 | **开源** |
| 合成数据工具链 | 无 | 无 | **基于 UniSim 2.0 扩展** |
| 车端部署 | 未验证 | 未验证 | **Orin X 45ms 验证** |
| 三阶段推理 | 两阶段 | 是 | **是** |
| 物理一致性约束 | 无 | 部分 | **完整** |
| 多维度反思 | 无 | 单一风险评分 | **5 维度风险 + 时序定位** |

### 三大独特创新

1. **完整开源的 70B VLA 工业级训练管线**：国内外首次
2. **物理一致性约束深度融入 VLA**：借鉴 UniSim 2.0 但更紧耦合
3. **车端 45ms 推理验证**：证明 70B 规模 VLA 可以量产落地（通过蒸馏）

## 局限性与未来方向

### 当前局限

1. **nuScenes 外的泛化性未充分验证**：国内场景（中国道路规则、非机动车）数据占比偏低
2. **长尾决策仍依赖大量标注**：反思模块训练需要人工标注的风险数据，规模扩展成本高
3. **蒸馏后精度损失**：13B 车端版本相比 70B 云端版本，L2(3s) 从 0.54m 退化到 0.68m
4. **仅支持 3 秒规划**：长时 horizon（10s+）的想象质量显著下降

### 未来方向

- **多国数据融合训练**：Seed-AD v2 计划加入国内真实数据
- **自监督反思**：用未来真实结果反推反思模块的监督信号，减少人工标注
- **长时预测**：Mixture of Experts 或 Hierarchical VLA，分层处理长时 horizon
- **闭环训练**：在仿真中闭环训练，持续优化

## 对工程实践的启示

### 1. 70B VLA 的训练资源需求

开源资料披露的训练资源：

```
预训练阶段：
├── 硬件：2048 × H100（256 节点 × 8 卡）
├── 时长：21 天
├── 数据：28PB（真实 + UniSim 2.0 合成）
└── 总算力：约 6×10^24 FLOPs

微调阶段：
├── 硬件：256 × H100
├── 时长：7 天
└── 数据：3PB 精选数据
```

对大多数团队：**直接复现训练不现实，应该基于开源权重做微调**。Seed-AD 提供了 LoRA 和 Full Fine-tuning 两种配置。

### 2. 三阶段推理的工程取舍

| 场景 | 推荐方案 | 理由 |
|------|---------|------|
| 高端量产车 | 完整三阶段 | 算力充足，追求 SOTA |
| 中端量产车 | 两阶段（感知+规划） | 算力受限，砍掉想象模块 |
| 低端量产车 | 端到端 VLA | 算力极限，只保留关键路径 |

### 3. 合成数据策略

Seed-AD 开源的合成数据工具链支持：
- **场景变换**：天气/光照/时间（保留真实场景的布局）
- **长尾生成**：基于文本描述生成极端场景
- **传感器仿真**：任意传感器配置的重渲染

推荐比例（基于 Seed-AD 经验）：
- **初期训练**：70% 真实 + 30% 合成（合成用于长尾补充）
- **微调阶段**：50% 真实 + 50% 合成（合成用于场景平衡）
- **持续迭代**：30% 真实 + 70% 合成（真实数据用于难例）

### 4. 车端部署的关键决策

基于 Seed-AD 的部署经验：

1. **选择合适的量化**：INT4 + 蒸馏到 13B 是当前性价比最优解
2. **三阶段流水线并行**：想象/反思/行动在时序上重叠，隐藏延迟
3. **冷启动优化**：预热 KV Cache，首帧延迟减半
4. **降级策略**：实时监控推理延迟，超时自动降级到两阶段

---

> **总结**：Seed-AD 是自动驾驶 VLA 迈入「工业级三阶段推理」时代的标志性工作。它不仅刷新了 nuScenes SOTA，更重要的是开源了完整的训练管线和工具链，让中小团队也能基于 70B VLA 做业务定制。对于自动驾驶量产团队，Seed-AD 是当前最好的开源基座选择；对于研究团队，其「物理一致性 + 多维度反思」的设计为未来 VLA 架构提供了重要参考。
