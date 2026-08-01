---
title: "Physical AI 多模态大模型：平台设计与技术关键点 - 第12章: 技术栈选型、开源边界与演进路线"
book: "Physical AI 多模态大模型：平台设计与技术关键点"
chapter: "12"
chapterTitle: "技术栈选型、开源边界与演进路线"
description: "5层技术栈分层架构、25项技术选型推荐、开源vs自研决策和18个月演进路线图"
date: "2026-07-31"
updatedAt: "2026-07-31"
agent: "研究员→编辑→审校员"
tags:
  - "技术栈"
  - "开源自研"
  - "KPI"
  - "演进路线"
type: "book"
---

## 12.1 五层技术栈分层架构

```
┌─────────────────────────────────────────────────────┐
│  产品层    Web 控制台 · SDK · 文档 · 3D 可视化        │
├─────────────────────────────────────────────────────┤
│  运维层    CI/CD · 实验追踪 · 安全审计 · 可观测性     │
├─────────────────────────────────────────────────────┤
│  推理层    vLLM/SGLang · TensorRT · 量化 · 边缘部署    │
├─────────────────────────────────────────────────────┤
│  训练层    PyTorch · Megatron · DeepSpeed · 仿真       │
├─────────────────────────────────────────────────────┤
│  数据层    数据湖(Iceberg) · 标注 · 去重 · 特征存储    │
├─────────────────────────────────────────────────────┤
│  基础设施   K8s+Volcano · GPU集群 · NVLink/IB · 存储    │
└─────────────────────────────────────────────────────┘
```

## 12.2 技术栈选型推荐表

| 层级 | 领域 | 推荐方案 | 备选 | 选择理由 |
|---|---|---|---|---|
| 基础设施 | GPU 集群 | K8s + Volcano | Slurm | K8s 生态丰富，Volcano 支持 GPU 抢占 |
| 基础设施 | GPU 调度 | Kueue + HAMi | K8s Device Plugin | Kueue 管控排队，HAMi 支持 MPS/MIG |
| 基础设施 | 存储 | MinIO + NFS | Ceph | MinIO S3 兼容，NFS 做 checkpoint |
| 基础设施 | 网络 | InfiniBand 400Gb | RoCE | IB 延迟更低，TP/PP 通信需 |
| 数据 | 数据湖 | Iceberg | Delta Lake | Iceberg upsert 原生（Ray 2.52+） |
| 数据 | 消息队列 | Kafka | Pulsar | Kafka 生态成熟，传感器数据流 |
| 数据 | ETL | Airflow + Dagster | Prefect | Airflow 成熟，Dagster 数据资产 |
| 数据 | 批处理 | Spark | Ray Data | 大规模 ETL，Ray Data 做训练摄取 |
| 数据 | 版本管理 | DVC + LakeFS | Git LFS | DVC 数据版本，LakeFS 湖仓版本 |
| 标注 | 3D 标注 | CVAT + SUSTechPOINTS | LabelBox | CVAT 开源，SUSTechPOINTS 点云专精 |
| 仿真 | 仿真平台 | Isaac Lab + ManiSkill3 | Genesis/MuJoCo | Isaac 高保真，ManiSkill3 任务丰富 |
| 训练 | 框架 | PyTorch 2.x | JAX | PyTorch 生态最大 |
| 训练 | 分布式 | Megatron-LM + DeepSpeed | FSDP2 | Megatron TP/PP，DeepSpeed ZeRO |
| 训练 | 实验 | MLflow 3.x | W&B | MLflow 开源自托管，3x Tracing |
| 训练 | 数据 | WebDataset + Ray Data | tf.data | WebDataset tar 流式，Ray Data 摄取 |
| 推理 | 引擎 | vLLM + TensorRT-LLM | SGLang | vLLM 研发，TensorRT 生产 |
| 推理 | 服务 | Triton Inference Server | BentoML | Triton 多模型多框架 |
| 推理 | 边缘 | JetPack + TensorRT | TVM/ONNX | Jetson 官方栈 |
| 运维 | CI/CD | Argo Workflows + GitHub Actions | Jenkins | Argo DAG 编排，GH Actions 代码 CI |
| 运维 | 追踪 | OpenTelemetry | Jaeger | OTel 标准化，全链路 |
| 运维 | 指标 | Prometheus + DCGM | Datadog | 开源+GPU 级监控 |
| 运维 | 日志 | Loki | ELK | Loki 轻量，与 Grafana 一体 |
| 运维 | 部署 | Helm + Terraform | Argo CD | Helm 打包，Terraform 基础设施 |
| 产品 | 前端 | Next.js 14 | SvelteKit | 与 signal 站点一致 |
| 产品 | 后端 | FastAPI | gRPC | 多模态 API，自动文档 |
| 产品 | 文档 | Mintlify | Docusaurus | API 文档体验好 |

## 12.3 开源 vs 自研决策

| 组件 | 决策 | 理由 |
|---|---|---|
| 数据湖 | 开源（Iceberg） | 成熟，社区活跃 |
| 标注 UI | **自研** | 多传感器融合标注+机器人轨迹标注无开源方案 |
| 去重算法 | 开源（DINOv2）+ 自研评分 | DINOv2 开源，物理场景评分需自研 |
| 仿真平台 | 开源（Isaac Lab/ManiSkill3） | 不重复造轮子 |
| 训练框架 | 开源（Megatron/DeepSpeed） | 成熟 |
| VLA 训练配方 | **自研** | 业务特定，无通用方案 |
| Sim2Real 编排 | **自研** | Argo DAG + 门禁逻辑需自研 |
| 推理引擎 | 开源（vLLM/TensorRT） | 成熟 |
| 量化工具 | 开源（TensorRT/TVM） | 成熟 |
| 安全审计 | **自研** | 物理安全监控无开源方案 |
| 遥操作 SDK | **自研** | 业务特定，硬件绑定 |
| Web 控制台 | **自研** | 平台差异化 |
| OTA 更新 | **自研** | 机器人安全 OTA 无开源方案 |

**自研重点**（4 个核心差异化组件）：
1. **多传感器融合标注 UI**——Physical AI 标注无通用方案
2. **Sim2Real 编排引擎**——物理安全门禁逻辑
3. **物理安全审计系统**——碰撞/接管/异常行为监控
4. **遥操作 SDK**——硬件绑定，业务特定

## 12.4 平台关键指标（KPI）

| 类别 | 指标 | 目标 |
|---|---|---|
| 数据 | 数据采集吞吐量 | ≥10TB/日 |
| 数据 | 标注效率（自动标注率） | ≥60% |
| 数据 | 去重率 | ≥15% |
| 数据 | 数据飞轮周期 | <7 天 |
| 训练 | GPU 利用率 | ≥75% |
| 训练 | Checkpoint 保存耗时 | <30s |
| 训练 | 故障恢复时间 | <10min |
| 训练 | Sim2Real Gap | <15pp |
| 推理 | P99 控制延迟 | <50ms |
| 推理 | 推理成功率 | >99.5% |
| 推理 | 模型量化精度损失 | <3pp |
| 推理 | OTA 更新成功率 | >99% |
| MLOps | CI/CD 流水线耗时 | <4h |
| MLOps | 灰度→全量通过率 | >80% |
| MLOps | 事故 MTTR（P0） | <2h |
| MLOps | 碰撞率 | <3% |
| MLOps | 接管率 | <10% |
| 产品 | API 文档覆盖率 | >90% |
| 产品 | SDK 用户上手时间 | <1h |
| 产品 | 平台日活用户 | >30 |

## 12.5 18 个月演进路线

| 阶段 | 时间 | 目标 | 关键交付 |
|---|---|---|---|
| **Phase 1: 基础** | Month 1-6 | 搭建基础 ML 平台 | K8s+GPU 集群、数据湖、训练框架、vLLM 推理、基础 CI/CD |
| **Phase 2: Physical AI 特化** | Month 7-12 | 注入 Physical AI 能力 | 多传感器标注、Sim2Real 管道、VLA 训练配方、Jetson 部署、物理安全监控 |
| **Phase 3: 规模化** | Month 13-18 | 规模化 + 闭环优化 | 数据飞轮自动化、世界模型合成数据、弹性训练、多机器人集群管理、平台 SaaS 化 |

**Phase 1 详细**：
- Month 1-2: K8s+Volcano GPU 集群、MinIO 存储、Iceberg 数据湖
- Month 3-4: Megatron/DeepSpeed 训练框架、MLflow 实验追踪
- Month 5-6: vLLM 推理服务、基础 CI/CD（Argo Workflows）、Web 控制台 MVP

**Phase 2 详细**：
- Month 7-8: 多传感器融合标注 UI、遥操作 SDK
- Month 9-10: Sim2Real 管道（Isaac Lab 集成 + DR 参数管理）
- Month 11-12: Jetson 边缘部署 + 量化 + OTA、物理安全监控 V1

**Phase 3 详细**：
- Month 13-14: 数据飞轮闭环自动化（自动标注→质量评分→补充训练）
- Month 15-16: 世界模型合成数据管道（Cosmos/Genie 变体生成）
- Month 17-18: 多机器人集群管理、平台 SaaS 化（多租户、API 开放）

> **交叉引用**：技术栈选型与站点书籍《GPU 工作原理与并发模型》（GPU 调度/MPS/MIG）、《Ray Data 引擎》（训练数据摄取/Iceberg upsert）形成完整的技术体系闭环。本章的技术决策直接映射到第 3 章的 10 大模块和第 11 章的 6 团队职责。
