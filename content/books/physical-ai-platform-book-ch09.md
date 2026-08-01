---
title: "Physical AI 多模态大模型：平台设计与技术关键点 - 第9章: 推理引擎与边缘优化关键技术——从云端到机器人端侧"
book: "Physical AI 多模态大模型：平台设计与技术关键点"
chapter: "9"
chapterTitle: "推理引擎与边缘优化关键技术——从云端到机器人端侧"
description: "推理引擎选型、多模态推理管线、连续批处理、Jetson 边缘部署、量化蒸馏和 OTA 更新"
date: "2026-07-31"
updatedAt: "2026-07-31"
agent: "研究员→编辑→审校员"
tags:
  - "vLLM"
  - "SGLang"
  - "TensorRT"
  - "边缘部署"
  - "量化"
  - "蒸馏"
  - "Jetson"
type: "book"
---

## 9.1 云端推理引擎选型

| 引擎 | 核心技术 | 吞吐量 | 延迟(P99) | 多模态支持 | 场景 |
|---|---|---|---|---|---|
| **vLLM** | PagedAttention + 连续批处理 | 高 | ~150ms | ✅ 强 | 研发期/通用 |
| **SGLang** | RadixAttention + 结构化输出 | 中高 | ~120ms | ✅ 中 | 需要推理链 |
| **TensorRT-LLM** | 算子融合 + INT8/FP8 | 极高 | ~50ms | ✅ 需转换 | 生产边缘部署 |

对于 Physical AI 的 <50ms 控制推理需求，vLLM/SGLang 适合云端辅助推理（如规划层），TensorRT-LLM 适合端侧控制推理（如执行层）。

## 9.2 多模态推理管线

VLA 模型的推理管线与传统 LLM 不同——输入不是文本，而是多模态传感器数据：

```
传感器数据 ──▶ 视觉编码器 ──▶ KV Cache ──▶ LLM 解码器 ──▶ Action Head ──▶ 动作
  (RGB+深度+      (ViT/SigLIP)     │           (Transformer)      (MLP)        (7-DoF)
   点云+IMU)                        │
                                    ▼
                        跨帧共享（同场景多帧复用）
```

**关键优化**：
- **视觉编码器预计算**：同一场景的多帧推理，视觉编码器输出可缓存复用，每帧只需跑 LLM 解码器
- **KV Cache 跨请求共享**：连续控制场景中，上下文（场景描述+指令）不变，只有传感器输入变化，KV Cache 可增量更新
- **Action Head 轻量化**：Action Head 是一个 MLP，参数量 <10M，可单独部署到边缘设备，视觉编码器和 LLM 留在云端

## 9.3 连续批处理与 prefill/decode 分离

**连续批处理**（Continuous Batching）：不同请求在不同时刻到达，不需要等待同批次全部完成。vLLM 的 PagedAttention 将 KV Cache 组织为非连续页，实现请求级动态拼批。

**Prefill/Decode 分离**：
- Prefill 阶段（处理 prompt + 传感器输入）：计算密集，GPU 利用率高
- Decode 阶段（逐 token/逐 action 生成）：访存密集，GPU 利用率低
- 分离部署：Prefill 在 A100 集群跑，Decode 在 Jetson 上跑，中间通过高速网络传输 KV Cache

Physical AI 适配：
- 机器人控制中，prefill = 处理当前帧传感器数据，decode = 生成 7-DoF 动作序列
- 动作序列可批量预生成（5-10 步 lookahead），减少 decode 频率

> **交叉引用**：连续批处理/prefill-decode 分离参考站点文章 `oss-llm-serving-engineering-2026-07.md` 和 `inference-engine-vllm-sglang-tensorrt-h100-benchmark-2026-04-22.md`。

## 9.4 机器人实时控制推理

Physical AI 推理的延迟约束远严于 LLM：

| 场景 | 推理周期 | 延迟预算 | 策略 |
|---|---|---|---|
| 高速运动控制 | 1kHz (1ms) | <0.5ms | 传统控制器（MPC/PID），不用 VLA |
| 抓取控制 | 20Hz (50ms) | <50ms | 端侧 VLA（INT8 量化） |
| 导航规划 | 5Hz (200ms) | <200ms | 云端 VLA（vLLM） |
| 任务规划 | 0.2Hz (5s) | <5s | 云端大 VLA（复杂推理链） |

**50ms 延迟保障策略**：
1. 视觉编码器预计算（上一帧结束时就开始计算下一帧的视觉特征）
2. Action Head 用 INT8 TensorRT 引擎（<5ms 推理）
3. 传感器→模型→执行器的管线用 CUDA Stream 并行化
4. 安全兜底：推理超时 → 回退到上一帧动作 + 紧急减速

## 9.5 边缘部署关键技术

### Jetson Orin 部署管线

```
训练后模型 (BF16)
     │
     ▼
导出 ONNX ──▶ TensorRT 构建 ──▶ INT8 校准 ──▶ 部署到 Jetson
     │              │                │
     │         算子融合         校准数据集
     │         (Conv+BN+ReLU)    (100 帧真实场景)
     │
     ▼
精度验证 (BF16 vs INT8 success rate delta < 3pp)
```

### 量化路径与精度-延迟权衡

| 精度 | 模型大小 | Jetson 延迟 | Success Rate | 可接受性 |
|---|---|---|---|---|
| BF16 | 14GB | ~120ms | 78.0% | ❌ 太慢 |
| FP8 | 7GB | ~80ms | 77.5% | ⚠️ 勉强 |
| INT8 | 7GB | ~45ms | 75.5% | ✅ 达标 |
| INT4 | 3.5GB | ~25ms | 68.0% | ❌ 精度太低 |

推荐路径：训练用 BF16/FP8 → 部署用 INT8（精度损失 <3pp，延迟达标）。INT4 仅在极端资源受限时考虑。

### 知识蒸馏

大 VLA（7B）蒸馏到小 VLA（1B）：
- **教师**：7B VLA，BF16 精度，输出 action 分布 `p_teacher(a|o)`
- **学生**：1B VLA，INT8 量化，学习匹配 `p_student(a|o) ≈ p_teacher(a|o)`
- **损失函数**：`L = α·MSE(a_student, a_teacher) + β·KL(p_student || p_teacher) + γ·TaskLoss`
- **蒸馏数据**：用教师在 10K 仿真场景上跑出的 (observation, action) 对

### OTA 更新与 A/B 测试

```
新模型发布 ──▶ 灰度 5% 机器人 ──▶ 监控 48h ──▶ 碰撞率 < +1pp?
     │                                        │
     │                                    YES │ NO → 自动回滚
     ▼                                        ▼
灰度 50% ──▶ 监控 72h ──▶ 全量发布          保持旧模型
```

- **版本管理**：每个机器人设备维护 `current_version` + `previous_version`，回滚 = 切回 previous
- **离线兜底**：OTA 失败或网络中断时，保持当前模型运行，不影响机器人基本功能

## 9.6 推理监控与 SLO

| SLO 指标 | 目标 | 告警阈值 | 响应 |
|---|---|---|---|
| P99 控制延迟 | <50ms | >60ms | 切换到安全兜底 |
| 推理成功率 | >99.5% | <98% | 检查模型版本 |
| GPU 利用率 | 60-80% | >95% 或 <30% | 扩缩容 |
| 碰撞率 | <3% | >5% | 自动回滚模型 |
| 接管率 | <10% | >15% | 告警 + 人工介入 |
