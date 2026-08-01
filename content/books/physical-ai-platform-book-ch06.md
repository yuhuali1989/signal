---
title: "Physical AI 多模态大模型：平台设计与技术关键点 - 第6章: 推理部署与 MLOps 模块设计——服务引擎、边缘部署与治理"
book: "Physical AI 多模态大模型：平台设计与技术关键点"
chapter: "6"
chapterTitle: "推理部署与 MLOps 模块设计——服务引擎、边缘部署与治理"
description: "设计 ServeKit/EdgeDeploy/FlowOps 三个模块，覆盖云端推理、边缘部署和 Physical AI 治理"
date: "2026-07-31"
updatedAt: "2026-07-31"
agent: "研究员→编辑→审校员"
tags:
  - "推理服务"
  - "边缘部署"
  - "MLOps"
  - "AI 治理"
  - "物理安全"
type: "book"
---

## 6.1 ServeKit——推理服务引擎

**模块定位**：云端多模态推理服务，支持实时机器人控制、流式推理和弹性扩缩容。

**核心功能**：
- **实时控制推理**：传感器数据 → VLA 模型 → 动作输出，端到端延迟 <50ms（P99）
- **多模态流式推理**：视觉编码器（ViT/SigLIP）+ LLM 解码器分离部署，视觉编码器可预计算缓存
- **引擎集成**：vLLM（通用，连续批处理 + PagedAttention）/ SGLang（复杂推理，RadixAttention）/ TensorRT-LLM（极致延迟，INT8/FP8）
- **弹性扩缩容**：K8s HPA 基于 GPU 利用率和请求队列深度自动伸缩
- **KV Cache 跨请求共享**：同一场景的多帧推理共享视觉 KV Cache，减少重复计算

**Physical AI 适配**：
- 推理请求不是文本 prompt，而是 `(RGB_frame, depth_map, point_cloud, proprioception, instruction)` 五元组
- 延迟约束更严：机器人控制周期 20Hz（50ms/帧），远严于 LLM 的 200ms+ 首 token 延迟
- 安全兜底：推理超时或异常时，回退到安全行为策略（紧急停车 / 保持当前位姿）

**引擎选型决策**：

| 引擎 | 优势 | 劣势 | 场景 |
|---|---|---|---|
| vLLM | 通用性好，社区活跃，多模态支持 | 延迟不是最优 | 研发期 / 中等延迟容忍 |
| SGLang | 复杂推理快，结构化输出 | 多模态支持不如 vLLM | 需要推理链的任务 |
| TensorRT-LLM | 极致延迟，FP8/INT8 | 部署复杂，模型需转换 | 生产边缘部署 |

## 6.2 EdgeDeploy——边缘部署与优化

**模块定位**：将模型部署到 Jetson/NPU/ARM 等边缘设备，支持 OTA 更新和离线兜底。

**核心功能**：
- **端侧部署**：NVIDIA Jetson Orin（JetPack + TensorRT + DeepStream）/ 国产 NPU（华为昇腾 / 地平线）/ ARM 嵌入式
- **量化路径**：BF16 → FP8（H100 训练时）→ INT8（Jetson 部署时）→ INT4（极致压缩），精度-延迟权衡曲线
- **知识蒸馏**：大 VLA（7B）→ 小 VLA（1B），教师-学生架构，学生学习教师的动作分布
- **编译优化**：TensorRT 算子融合 / ONNX Runtime / TVM 自动调优
- **OTA 更新**：模型版本灰度发布（先 5% 机器人 → 50% → 100%），A/B 测试，自动回滚
- **离线兜底**：网络中断时，机器人执行本地缓存的安全行为策略（紧急停车 / 降速运行 / 返回充电桩）

**Physical AI 适配**：
- 边缘设备资源受限（Jetson Orin 64GB 显存 vs A100 80GB），必须量化+蒸馏
- 传感器融合边缘管线：RGB + 深度 + IMU 在 Jetson 上实时融合，延迟 <20ms
- OTA 更新需考虑物理安全——新模型可能导致行为变化，灰度期间密切监控碰撞率

**与已有内容交叉引用**：推理引擎选型参考 `inference-engine-vllm-sglang-tensorrt-h100-benchmark-2026-04-22.md`，量化/连续批处理参考 `oss-llm-serving-engineering-2026-07.md`。

## 6.3 FlowOps——MLOps 流水线与 AI 治理

**模块定位**：贯穿全链路的 CI/CD、实验追踪、安全审计和可观测性体系。

**核心功能**：
- **Physical AI CI/CD 全链路**：数据变更 → 训练 → 仿真验证 → 灰度部署 → 全量发布，每步有门禁
- **Sim2Real 管道编排**：Argo Workflows DAG，仿真成功率 <阈值 时阻断部署
- **机器人行为审计**：记录每次动作的决策链（传感器输入 → 模型输出 → 执行器动作），用于事后复盘
- **物理安全监控**：碰撞率（每 1000 次操作的碰撞次数）/ 接管率（人类手动接管频率）/ 异常行为检测（偏离预期轨迹的统计偏离）
- **模型卡与数据卡**：多模态模型卡模板（训练数据来源/传感器配置/场景覆盖/已知局限）
- **可观测性**：OpenTelemetry 分布式追踪 + Prometheus 指标 + DCGM GPU 监控 + Loki 日志

**Physical AI 安全门禁策略**：

| 门禁阶段 | 检查项 | 通过阈值 | 失败动作 |
|---|---|---|---|
| 仿真评估 | 仿真成功率 | ≥ 85% | 阻断部署 |
| 仿真评估 | 碰撞率 | < 0.5% | 阻断部署 |
| 真实验证 | 真实成功率 | ≥ 70% | 阻断全量发布 |
| 灰度监控 | 碰撞率增量 | < +1pp vs 旧模型 | 自动回滚 |
| 灰度监控 | 接管率增量 | < +5% vs 旧模型 | 自动回滚 |
| 全量发布 | 30 天稳定性 | 无 P0 事故 | 回滚至灰度 |

这套门禁体系是 Physical AI 平台与传统 MLOps 的本质差异——传统 CI/CD 的"门禁"是单元测试通过率，Physical AI 的"门禁"是**物理安全指标**。

## 6.4 三模块功能矩阵

| 模块 | 输入 | 输出 | 核心技术 | Physical AI 特化 |
|---|---|---|---|---|
| ServeKit | 传感器数据 | 动作指令 | vLLM/SGLang/TensorRT | <50ms 控制推理 + 安全兜底 |
| EdgeDeploy | 训练后模型 | 端侧模型 | 量化/蒸馏/编译优化 | Jetson 部署 + OTA 灰度 |
| FlowOps | 全链路事件 | 审计/告警 | Argo/OTel/Prometheus | 物理安全门禁 + 行为审计 |

> **交叉引用**：K8s GPU 调度参考 `kubernetes-ai-infra-gpu-ai.md` + `ai-infra-k8s-gpu-scheduling-mig.md`，MLOps 工具参考 `mlflow-3x-tracingai-gateway-genai.md`，GPU 并发模型参考书籍《GPU 工作原理与并发模型》Ch6-7。
