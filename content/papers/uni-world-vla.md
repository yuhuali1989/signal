---
title: "Uni-World VLA: Interleaved World Modeling and Planning for Autonomous Driving"
description: "将世界模型预测和 VLA 规划交替执行（Interleaved），实现比串行方案更高效的端到端自动驾驶"
date: "2026-04-18"
updatedAt: "2026-04-18 12:00"
agent: "研究员→编辑→审校员"
tags:
  - "自动驾驶"
  - "VLA"
  - "世界模型"
  - "交替推理"
type: "paper"
paper: "Uni-World VLA"
arxivUrl: "https://arxiv.org/abs/2603.27287"
---

# Uni-World VLA: Interleaved World Modeling and Planning for Autonomous Driving

> **论文信息**: arXiv 2603.27287, March 2026
> **作者**: 多机构联合
> **核心贡献**: 提出世界模型与 VLA 交替（Interleaved）执行的新范式，每步规划前先想象一步未来，比串行（先全想象再规划）方案更高效

## 一、问题定义

现有方法处理世界模型 + VLA 有两种范式：

1. **串行方案**（如 VLA-World）: 先用世界模型想象 N 步未来 → 再用 VLA 基于全部想象结果规划
2. **并行方案**: 世界模型和 VLA 独立运行，输出融合

两者都有局限：串行方案延迟高（需要等待完整想象），并行方案缺乏交互。

Uni-World VLA 提出第三种范式：**交替执行**（Interleaved）。

```
串行方案:  WM→WM→WM→WM → VLA→VLA→VLA→VLA
           想象 4 步         规划 4 步

交替方案:  WM→VLA → WM→VLA → WM→VLA → WM→VLA
           每步想象后立即规划，形成反馈闭环
```

## 二、核心方法

### 2.1 交替执行架构

Uni-World VLA 的核心创新是将世界模型预测和动作规划作为 **交替的 token 序列** 在同一个 Transformer 中执行：

```
Token 序列:
  [视觉] [语言指令] [WM_t+1] [Action_t+1] [WM_t+2] [Action_t+2] ...
                     ↑                      ↑
                     想象下一步               想象再下一步
                              ↑                       ↑
                              基于想象规划              基于新想象更新规划
```

关键设计决策：
- 世界模型和规划器**共享同一个 Transformer backbone**，而非两个独立模型
- 想象在**潜在空间**进行（不生成像素），延迟仅 8ms/step
- 每步想象的结果作为**下一步规划的条件输入**

### 2.2 统一 Token 表示

将三种不同模态统一为 token：

| 模态 | Token 化方法 | Token 数量 |
|------|------------|-----------|
| 视觉 | ViT + VQ-VAE | 256 tokens/帧 |
| 世界模型预测 | Latent Diffusion | 64 tokens/步 |
| 动作轨迹 | 离散化 waypoints | 12 tokens/步 |

### 2.3 训练策略

三阶段训练：

1. **Stage 1: 视觉预训练**（OpenDV-2K，50K 步）
   - 目标：学习驾驶场景的视觉表示
   
2. **Stage 2: 世界模型预训练**（nuScenes + nuPlan）
   - 目标：学习场景动态和物理规律
   - 损失：Latent MSE + Perceptual Loss

3. **Stage 3: 交替规划微调**（nuScenes-GR-20K）
   - 目标：学习交替执行的 WM→Action 模式
   - 损失：L2 轨迹误差 + 碰撞惩罚 + 世界模型一致性

## 三、实验结果

### nuScenes Planning Benchmark

| 模型 | L2 (1s)↓ | L2 (2s)↓ | L2 (3s)↓ | Col.↓ |
|------|---------|---------|---------|-------|
| UniAD | 0.48 | 0.96 | 1.65 | 0.64% |
| VAD | 0.41 | 0.70 | 1.05 | 0.31% |
| SparseDrive | 0.29 | 0.45 | 0.67 | 0.22% |
| VLA-World | 0.32 | 0.55 | 0.82 | 0.24% |
| **Uni-World VLA** | **0.28** | **0.43** | **0.63** | **0.18%** |

### 关键消融实验

| 配置 | L2(3s) | 延迟 |
|------|--------|------|
| 纯 VLA（无世界模型） | 0.87 | 45ms |
| 串行 WM→VLA | 0.82 | 180ms |
| **交替 WM↔VLA** | **0.63** | **95ms** |

交替方案在精度和延迟之间取得了最佳平衡：比串行方案快 47%，精度高 23%。

## 四、与 VLA-World 的对比

| 维度 | VLA-World | Uni-World VLA |
|------|-----------|---------------|
| 范式 | 串行（先想后做） | 交替（边想边做） |
| 延迟 | ~180ms | ~95ms |
| L2(3s) | 0.82m | 0.63m |
| 碰撞率 | 0.24% | 0.18% |
| 可解释性 | 可视化想象帧 | 可视化每步想象+规划 |
| 计算开销 | 2x VLA | 1.4x VLA |

## 五、意义与局限

### 意义

1. **交替范式的优越性**：证明了「边想边做」比「先想后做」更高效
2. **统一架构**：一个 Transformer 同时完成世界模型和规划，参数共享效率高
3. **实时可行性**：95ms 延迟满足 10Hz 规划要求

### 局限

1. 仅在 nuScenes 验证，未在 Waymo Open/CARLA 等更大规模基准测试
2. 潜在空间想象的可解释性不如 VLA-World 的帧级可视化
3. 长时序（>5s）的交替预测误差累积问题

## 六、在自动驾驶 VLA 演进中的位置

```
DriveWorld-VLA (2026.02)     VLA-World (2026.04)      Uni-World VLA (2026.03)
  ↓                            ↓                          ↓
  世界模型 + VLA               串行想象→反思               交替想象↔规划
  潜在空间统一                  先想后做                    边想边做
  碰撞率 -36%                  L2 0.82m / 0.24%           L2 0.63m / 0.18%
```

三种范式代表了 VLA + 世界模型融合的三个方向，**交替执行是当前精度-延迟 Pareto 最优**。

---

*当世界模型从「预处理器」变为「推理伙伴」，自动驾驶的决策质量将持续跃升。*
