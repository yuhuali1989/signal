---
title: "Physical AI 多模态大模型：平台设计与技术关键点 - 第10章: MLOps 与 AI 治理关键技术——CI/CD、可观测性与物理安全"
book: "Physical AI 多模态大模型：平台设计与技术关键点"
chapter: "10"
chapterTitle: "MLOps 与 AI 治理关键技术——CI/CD、可观测性与物理安全"
description: "Physical AI CI/CD 全链路、Sim2Real 管道编排、可观测性体系和物理安全监控的实现细节"
date: "2026-07-31"
updatedAt: "2026-07-31"
agent: "研究员→编辑→审校员"
tags:
  - "MLOps"
  - "CI/CD"
  - "可观测性"
  - "物理安全"
  - "模型卡"
  - "偏差检测"
type: "book"
---

## 10.1 Physical AI CI/CD 全链路

传统软件 CI/CD 的流水线是：代码 → 单元测试 → 集成测试 → 部署。Physical AI 的 CI/CD 在中间插入了两层关键门禁：

```
数据变更 → 训练 → 仿真验证 → 真实验证 → 灰度部署 → 全量发布
  │          │         │          │          │          │
  ▼          ▼         ▼          ▼          ▼          ▼
数据卡   Checkpoint  仿真成功率  真实成功率  碰撞率监控  30天稳定
检查     保存       ≥85%?      ≥70%?      <+1pp?     无P0?
```

与纯软件 CI/CD 的差异：

| 维度 | 传统 CI/CD | Physical AI CI/CD |
|---|---|---|
| 触发 | 代码 push | 数据变更 / 代码 push / 模型迭代 |
| 测试 | 单元/集成测试 | 仿真验证（1000+ 次任务） |
| 门禁 | 覆盖率 >80% | 仿真成功率 ≥85% + 碰撞率 <0.5% |
| 部署 | 滚动更新 | 灰度 → 监控物理安全 → 全量 |
| 回滚 | 代码回退 | 模型版本回退 + OTA 推送 |

## 10.2 Sim2Real 管道编排

用 Argo Workflows 定义 Sim2Real 全流程 DAG：

```yaml
# Sim2Real Pipeline DAG (伪配置)
apiVersion: argoproj.io/v1alpha1
kind: Workflow
metadata:
  generateName: sim2real-vla-
spec:
  entrypoint: main
  templates:
  - name: main
    steps:
    - - name: train              # 训练 VLA
        template: train-template
    - - name: sim-eval           # 仿真评估（1000次任务）
        template: sim-eval-template
        arguments:
          parameters:
          - name: min-success-rate
            value: "0.85"        # 门禁：成功率≥85%
          - name: max-collision-rate
            value: "0.005"       # 门禁：碰撞率<0.5%
    - - name: real-eval          # 真实验证（100次任务）
        template: real-eval-template
        when: "{{steps.sim-eval.outputs.parameters.passed}} == true"
        arguments:
          parameters:
          - name: min-success-rate
            value: "0.70"        # 门禁：真实成功率≥70%
    - - name: canary-deploy      # 灰度部署 5%
        template: canary-template
        when: "{{steps.real-eval.outputs.parameters.passed}} == true"
    - - name: full-deploy        # 全量部署
        template: full-deploy-template
        when: "{{steps.canary-deploy.outputs.parameters.safe}} == true"
```

**门禁策略**：每个 stage 的输出包含 `passed=true/false`，下个 stage 通过 `when` 条件决定是否执行。门禁失败时，Argo 自动发告警到 Slack/钉钉，阻断后续部署。

## 10.3 实验追踪与模型注册

| 工具 | 角色 | 集成方式 |
|---|---|---|
| MLflow | 实验追踪 + 模型注册 | Python SDK，训练脚本自动 log 参数/metrics |
| Weights & Biases | 可视化 + 超参搜索 | Sweeps API，多目标优化 |
| Argo Workflows | DAG 编排 | Sim2Real 管道 |
| ModelRegistry（自研） | Sim2Real Gap 看板 | MLflow 数据源 + 自定义指标计算 |

**Sim2Real 指标仪表盘**：自研看板从 MLflow 拉取仿真指标和真实指标，并排展示 Gap 值，Gap >阈值 时标红告警。

> **交叉引用**：MLflow 3x 的 Tracing 和 AI Gateway 能力参考 `mlflow-3x-tracingai-gateway-genai.md`。

## 10.4 可观测性体系

### 分布式追踪（OpenTelemetry）

Physical AI 的一个推理请求可能跨越：传感器 → 边缘设备 → 云端模型 → 回传动作。OpenTelemetry 追踪全链路：

```
Trace: robot_42_control_001
  ├─ span: sensor_capture        3ms   [Jetson]
  ├─ span: preprocess            5ms   [Jetson]
  ├─ span: network_upload       12ms  [Jetson→Cloud]
  ├─ span: vision_encoder       18ms  [Cloud A100]
  ├─ span: llm_decoder          8ms   [Cloud A100]
  ├─ span: action_head          2ms   [Cloud A100]
  ├─ span: network_download    10ms   [Cloud→Jetson]
  └─ span: actuator_execute     2ms   [Robot]
  Total: 60ms  ⚠️ 超过50ms SLO
```

### 指标采集（Prometheus + DCGM）

| 指标 | 采集源 | 告警条件 |
|---|---|---|
| GPU 利用率 | DCGM Exporter | >95% 持续 5min 或 <30% |
| GPU 显存 | DCGM Exporter | >90% |
| 推理延迟 P99 | 自定义 metrics | >60ms |
| 碰撞率 | 机器人行为日志 | >5% |
| 接管率 | 机器人行为日志 | >15% |
| 训练吞吐量 | PyTorch metrics | <预期 50% |

### 日志聚合（Loki/ELK）

机器人行为日志审计：记录每次动作的完整决策链（传感器输入 → 模型推理 → 动作输出 → 执行器状态 → 结果），用于事后复盘和安全事件溯源。

## 10.5 物理安全监控

Physical AI 独有的安全维度——模型不仅可能输出错误文本，还可能输出**危险动作**。

| 安全指标 | 定义 | 正常范围 | 危险阈值 | 响应 |
|---|---|---|---|---|
| 碰撞率 | 每 1000 次操作的碰撞次数 | <3 | >5 | 自动回滚 |
| 接管率 | 人类手动接管频率 | <10% | >15% | 告警+暂停部署 |
| 异常行为 | 偏离预期轨迹 >3σ | <1% | >5% | 紧急停车 |
| 安全停车率 | 触发安全停车机制频率 | <0.5% | >2% | 全量回滚 |
| 超时率 | 推理超时触发兜底频率 | <1% | >5% | 检查模型/网络 |

**安全停车机制**：当检测到异常行为（关节速度超限、碰撞力超限、偏离工作空间边界）时，硬件级紧急停车，不经过模型推理层，保证物理安全。

## 10.6 模型卡与数据卡

**多模态模型卡模板**：

| 字段 | 内容 |
|---|---|
| 模型名称 | OpenVLA-7B-v2.1 |
| 训练数据来源 | 真实采集 40% + 仿真生成 60% |
| 传感器配置 | RGB-D 相机 + 机械臂本体感觉 |
| 场景覆盖 | 抓取/放置/开门/推拉（4 类任务） |
| 已知局限 | 透明物体抓取成功率低（55%），强眩光环境退化 |
| Sim2Real Gap | -16.7pp（仿真 89.2% → 真实 72.5%） |
| 量化影响 | INT8 量化后 success rate -2.5pp |
| 安全评级 | B（碰撞率 3.2%，需人工监督） |

**数据卡**：记录每个数据批次来源（真实/仿真）、采集条件（传感器/场景/时间）、标注方式和已知偏差。

## 10.7 AI 治理框架矩阵

| 治理领域 | 治理项 | 责任团队 | 审核频率 | 工具 |
|---|---|---|---|---|
| 数据 | 数据来源合规 | 数据平台 | 每批次 | 数据卡 |
| 数据 | 偏差检测 | 数据处理 | 每月 | 自研偏差看板 |
| 训练 | 超参审计 | 训练基础设施 | 每实验 | MLflow |
| 训练 | 训练复现性 | 训练基础设施 | 每模型版本 | DVC + MLflow |
| 模型 | 模型卡完整 | MLOps | 每版本 | ModelRegistry |
| 模型 | Sim2Real Gap | 训练基础设施 | 每版本 | 自研看板 |
| 推理 | 延迟 SLO | 推理服务 | 实时 | Prometheus |
| 推理 | 安全兜底 | 推理服务 | 每部署 | 自动化测试 |
| 部署 | 灰度门禁 | MLOps | 每部署 | Argo Workflows |
| 部署 | OTA 安全 | 推理服务 | 每版本 | 灰度监控 |
| 安全 | 碰撞率 | MLOps | 实时 | 行为日志 |
| 安全 | 行为审计 | MLOps | 每事件 | Loki 日志 |
