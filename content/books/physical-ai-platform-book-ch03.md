---
title: "Physical AI 多模态大模型：平台设计与技术关键点 - 第3章: 平台架构总览——10 大模块与端到端流水线"
book: "Physical AI 多模态大模型：平台设计与技术关键点"
chapter: "3"
chapterTitle: "平台架构总览——10 大模块与端到端流水线"
description: "定义平台 10 大模块架构和 10 阶段端到端流水线，含模块依赖拓扑图和数据飞轮闭环"
date: "2026-07-31"
updatedAt: "2026-07-31"
agent: "研究员→编辑→审校员"
tags:
  - "平台架构"
  - "模块设计"
  - "流水线"
  - "数据飞轮"
type: "book"
---

## 3.1 设计原则

从 PAI 和 SageMaker 的模块分析中，我们提取两条设计原则：

1. **通用能力借鉴**：标注、训练、推理、MLOps 等通用流程，采用业界验证过的架构（PAI 的模块化 + SageMaker 的开放 API）
2. **Physical AI 特化注入**：在每个通用模块内，注入传感器数据、Sim2Real、VLA/世界模型、边缘控制、物理安全等特化逻辑

## 3.2 十大产品模块总览

| # | 模块名 | 定位 | PAI 对应 | SageMaker 对应 | Physical AI 特化 |
|---|---|---|---|---|---|
| 1 | **DataForge** | 采集与接入 | 无 | Data Wrangler | 传感器数据流/遥操作录制 |
| 2 | **LabelHub** | 标注平台 | iTAG | Ground Truth | 3D 点云/多传感器融合/轨迹标注 |
| 3 | **DataRefine** | 清洗增强 | 无 | 无 | DINOv2 去重/Domain Randomization |
| 4 | **FeatureVault** | 特征存储 | 无 | Feature Store | 传感器/场景/机器人状态特征 |
| 5 | **ModelLab** | 交互建模 | DSW | Studio | Isaac Lab/Genesis 仿真启动 |
| 6 | **TrainEngine** | 分布式训练 | DLC | Model Training | VLA/世界模型训练配方 |
| 7 | **ModelRegistry** | 模型仓库 | Model Gallery | JumpStart | Sim2Real 实验追踪 |
| 8 | **ServeKit** | 推理服务 | EAS | Model Deployment | 实时控制推理 <50ms |
| 9 | **EdgeDeploy** | 边缘部署 | 无 | Edge | Jetson/NPU/OTA/离线兜底 |
| 10 | **FlowOps** | MLOps 治理 | 无 | Pipelines+Governance | 物理安全审计/Sim2Real CI-CD |

## 3.3 模块依赖拓扑

```
                         ┌─────────────────────────────────────────────────┐
                         │              FlowOps (MLOps/治理)                 │
                         │    CI/CD · 实验追踪 · 安全审计 · 可观测性           │
                         └────────────────────┬────────────────────────────┘
                              监控/编排贯穿全链路 │
  ┌──────────┐    ┌──────────┐    ┌──────────┐  │  ┌──────────┐    ┌──────────┐
  │DataForge │───▶│LabelHub  │───▶│DataRefine│  │  │TrainEngine│───▶│ModelReg  │
  │  采集接入 │    │  标注平台 │    │ 清洗增强 │  │  │ 分布式训练│    │ 模型仓库 │
  └──────────┘    └──────────┘    └────┬─────┘  │  └────┬─────┘    └────┬─────┘
                                       │         │       │                 │
                              ┌────────▼─────────▼───────▼─────────────────▼──┐
                              │              FeatureVault (特征存储)           │
                              │    传感器特征 · 场景特征 · 机器人状态特征       │
                              └────────────────────┬─────────────────────────┘
                                                   │
  ┌──────────┐    ┌──────────┐                      │
  │EdgeDeploy│◀───│ServeKit  │◀─────────────────────┘
  │ 边缘部署  │    │ 推理服务  │
  └──────────┘    └──────────┘
         ▲
         │ OTA 更新 / 反馈数据
         └─────────────────── (数据飞轮回环)
```

## 3.4 端到端流水线十阶段

| 阶段 | 模块 | 关键活动 | Physical AI 特化 |
|---|---|---|---|
| ① 采集 | DataForge | 传感器录制/遥操作/仿真生成 | ROS bag2 + 仿真变体生成 |
| ② 预处理 | DataForge | 格式标准化/时间对齐 | 多传感器时间同步 |
| ③ 标注 | LabelHub | bbox/分割/轨迹/自动标注 | 3D 点云 + 机器人轨迹 |
| ④ 管理 | FeatureVault | 特征入库/版本/血缘 | 传感器特征在线离线一致 |
| ⑤ 实验 | ModelLab | 仿真环境/Notebook 建模 | Isaac Lab/Genesis 一键启动 |
| ⑥ 训练 | TrainEngine | 分布式训练/4D 并行 | VLA/世界模型训练配方 |
| ⑦ 评估 | ModelRegistry | Sim2Real 指标对比 | 仿真成功率 vs 真实成功率 |
| ⑧ 优化 | ServeKit | 量化/蒸馏/编译优化 | BF16→FP8→INT8 精度-延迟权衡 |
| ⑨ 部署 | EdgeDeploy | Jetson/NPU 端侧部署 | OTA 灰度/离线兜底 |
| ⑩ 监控 | FlowOps | 性能/安全/行为审计 | 碰撞率/接管率/异常行为 |

## 3.5 数据飞轮闭环

Physical AI 平台的核心价值在于**数据飞轮**：部署到真实机器人后，边缘端持续采集运行数据（成功案例 + 失败案例），数据回流到 DataForge，经过自动标注（LabelHub 主动学习）→ 质量评分（DataRefine）→ 补充训练集（FeatureVault），触发新一轮训练→仿真验证→灰度部署。每一轮飞轮转动，模型的物理世界覆盖率和成功率都应提升。

这个飞轮的关键加速器是**合成数据**——世界模型（Cosmos/Genie）可以生成无限变体场景填充长尾，将真实采集成本从 $50.50/帧降至 $0.005/帧。后续章节将逐模块展开设计细节。
