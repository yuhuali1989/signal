---
title: "第 4 章：TensorRT-LLM——图编译与极致优化"
description: "NVIDIA TensorRT-LLM 的编译优化：算子融合、INT8/FP8/FP4 量化、CUDA Graph、In-Flight Batching、多 GPU 并行策略，以及 2026 年 NVIDIA Dynamo + LiteRT-LM 端侧推理新范式"
date: "2026-04-11"
updatedAt: "2026-04-16 12:00"
book: "LLM 推理框架：从原理到优化"
chapter: 4
chapterTitle: "TensorRT-LLM——图编译与极致优化"
tags: ["TensorRT-LLM", "NVIDIA", "Dynamo", "LiteRT-LM", "图编译", "量化", "FP4", "推理优化"]
type: "book"
---

# 第 4 章：TensorRT-LLM——图编译与极致优化

## 4.1 TensorRT 的编译理念

```
vLLM/SGLang: 动态图 (PyTorch)，灵活但有 Python 开销
TensorRT-LLM: 静态编译图，提前优化，运行时零开销

编译流程:
  PyTorch Model → TensorRT-LLM Model Definition
    → TensorRT Engine Builder
      → Layer Fusion (层融合)
      → Kernel Auto-Tuning (自动调优)
      → Precision Calibration (精度校准)
    → Serialized Engine (.engine 文件)
    → Runtime Execution (C++ Runtime)
```

## 4.2 核心优化技术

### 4.2.1 算子融合

```
未融合:
  LayerNorm → Q_proj → K_proj → V_proj → Attention → O_proj
  = 6 个独立 kernel，6 次 HBM 读写

TensorRT 融合后:
  [Fused_QKV_Projection]  → [Fused_MHA_Kernel] → O_proj
  = 3 个 kernel，减少 50% 的 HBM 访问
  
更激进的融合 (FP8):
  [Fused_LayerNorm_QKV_FP8] → [FP8_MHA] → [FP8_O_Proj_Residual]
  = 几乎所有操作融合在一起
```

### 4.2.2 INT8/FP8 量化

```python
# TensorRT-LLM 的 FP8 量化
from tensorrt_llm.quantization import QuantMode

quant_mode = QuantMode.from_description(
    quantize_weights=True,
    quantize_activations=True,  
    per_token=True,    # 每个 token 独立 scale
    per_channel=True,  # 每个 channel 独立 scale
)

# INT8 SmoothQuant:
# 将激活值的量化难度"转移"到权重上
# weight = weight × diag(s)
# activation = activation × diag(1/s)
# s 是平滑因子，让两者的量化误差更均衡
```

### 4.2.3 CUDA Graph

```
不用 CUDA Graph:
  每次推理: Python → 调度 Kernel 1 → 调度 Kernel 2 → ... → 同步
  调度开销: ~10μs × N kernels

用 CUDA Graph:
  首次: 录制所有 kernel 调用 → 保存为一个 Graph
  后续: 一次 launch 回放整个 Graph
  调度开销: ~10μs × 1 (不管有多少 kernel)
  
  对于 Decode 阶段（每步 ~50-100 个 kernel），加速 ~20%
```

## 4.3 In-Flight Batching

TensorRT-LLM 的 Continuous Batching 实现，称为 In-Flight Batching：

```
核心区别于 vLLM:
  - C++ 实现的调度器（无 Python GIL 开销）
  - 与 CUDA Graph 深度集成
  - Prefill 和 Decode 可以在同一 batch 内混合执行
  - 支持 Paged KV Cache（借鉴 vLLM）
```

## 4.4 多 GPU 推理

```
TensorRT-LLM 的并行策略:

Tensor Parallel (TP):
  模型按层内拆分，节点内 NVLink 通信
  适合: 延迟敏感场景（减小 per-request 延迟）

Pipeline Parallel (PP):
  模型按层间拆分，micro-batch 流水线
  适合: 吞吐敏感场景（增大 batch 效率）

混合: TP=8 (单节点) + PP=N (跨节点)
  例: 405B 模型 → TP=8, PP=4 → 32 GPU
```

## 4.5 FP4 量化与 B200 时代 (2026)

NVIDIA B200 / GB300 原生支持 FP4 数据格式，TensorRT-LLM 已跟进：

```python
# TensorRT-LLM FP4 量化配置 (2026)
from tensorrt_llm.quantization import QuantMode, FP4Config

fp4_config = FP4Config(
    quantize_weights=True,        # 权重 FP4
    quantize_activations=True,    # 激活 FP4  
    use_microscaling=True,        # MX-FP4 格式（共享指数）
    block_size=32,                # 每 32 个元素共享一个 scale
)

# FP4 vs FP8 vs INT8 性能对比 (Llama 70B, B200):
#
#   精度    | 模型大小 | 吞吐(tok/s) | 质量损失
#  ---------|---------|------------|--------
#   BF16    | 140 GB  | 基线        | 无
#   FP8     | 70 GB   | +45%       | <0.5%
#   INT8-SQ | 70 GB   | +40%       | <1%
#   FP4-MX  | 35 GB   | +90%       | <2%
#
# FP4 将 70B 模型压缩到 35GB，单卡 B200 (192GB) 可推理
```

### 4.5.1 Microscaling (MX) 格式

```
传统量化: 每个 tensor 一个 scale
  → 异常值会拉大 scale，大部分数值精度浪费

Per-Channel: 每个 channel 一个 scale
  → 更好，但还是粗粒度

MX-FP4 (NVIDIA 2026):
  每 32 个元素共享一个 8-bit 指数 (E8M0)
  每个元素用 4-bit 表示 (1 sign + 2 exponent + 1 mantissa)
  
  有效位: 2 个有效 bit (看起来很少)
  但 block-level 共享指数保证了动态范围
  实测 perplexity 损失 < 2% (配合校准)
  
  存储: 4.25 bit/element（4比特尾数 + 共享8比特缩放因子，等效约4.25比特/元素）
```

## 4.6 完整部署示例

```python
# TensorRT-LLM 端到端部署流程 (2026 风格)

# Step 1: 转换模型
# trtllm-build \
#   --model_dir ./llama-70b-hf/ \
#   --dtype bfloat16 \
#   --tp_size 4 \
#   --pp_size 1 \
#   --max_batch_size 64 \
#   --max_input_len 4096 \
#   --max_seq_len 8192 \
#   --use_paged_context_fmha enable \
#   --gpt_attention_plugin bfloat16 \
#   --gemm_plugin bfloat16 \
#   --output_dir ./engine_tp4/

# Step 2: 启动 Triton Inference Server
# tritonserver \
#   --model-repository=/models/tensorrtllm_backend \
#   --backend-config=python,shm-region-prefix-name=prefix0_ \
#   --http-port 8000 \
#   --grpc-port 8001

# Step 3: 使用 OpenAI 兼容 API 调用
import openai

client = openai.OpenAI(base_url="http://localhost:8000/v1")
response = client.chat.completions.create(
    model="llama-70b",
    messages=[{"role": "user", "content": "Explain KV Cache"}],
    stream=True,
    max_tokens=512,
)
```

## 4.7 TensorRT-LLM vs vLLM/SGLang

| 维度 | TensorRT-LLM | vLLM | SGLang |
|------|:---:|:---:|:---:|
| 性能 (延迟) | **最优** | 良好 | 良好 |
| 性能 (吞吐) | **最优** | 良好 | 场景依赖 |
| 部署复杂度 | **高** | 低 | 低 |
| 模型支持速度 | 慢 (需要适配) | **快** | 快 |
| 灵活性 | 低 (静态图) | **高** | **高** |
| 量化支持 | **最全 (FP4/FP8/INT8/INT4)** | 基本 | 基本 |
| 硬件锁定 | NVIDIA only | NVIDIA 为主 | NVIDIA 为主 |
| MoE 支持 | EP + Expert Offload | EP | EP |

**选型决策树**：
```
是否追求极致延迟？
  → Yes: TensorRT-LLM
  → No ↓

是否需要快速支持新模型？
  → Yes: vLLM（通常新模型发布 1-3 天即支持）
  → No ↓

是否需要结构化输出 / 复杂多轮？
  → Yes: SGLang（RadixAttention 对多轮有优势）
  → No: vLLM（最大社区 + 最稳定）
```

## 4.8 NVIDIA Dynamo：下一代推理编排框架（2026）

2026 年 GTC 大会上，NVIDIA 发布 Dynamo——面向超大规模推理集群的编排框架，弥补 TensorRT-LLM 在分布式调度层的空白：

```
TensorRT-LLM 定位: 单节点/少数 GPU 的模型编译与执行
NVIDIA Dynamo 定位: 跨集群的推理请求调度与资源编排

Dynamo 架构:
┌───────────────────────────────────────┐
│          Dynamo Router                │
│  ┌─────────────────────────────┐     │
│  │ 智能请求路由                 │     │
│  │  - Prefill/Decode 分离调度  │     │
│  │  - KV Cache 感知的亲和调度  │     │
│  │  - 负载均衡 + 热迁移       │     │
│  └─────────┬───────────────────┘     │
│            │                          │
│  ┌─────────▼───────────────────┐     │
│  │ Worker Pool (N 节点)        │     │
│  │  - Prefill Workers (计算密集)│     │
│  │  - Decode Workers (内存密集) │     │
│  │  - 动态伸缩                 │     │
│  └─────────────────────────────┘     │
└───────────────────────────────────────┘
```

### Prefill-Decode 分离

Dynamo 的核心创新——将 Prefill 和 Decode 调度到不同的 Worker 集群：

```python
# Dynamo 的 Prefill-Decode 分离策略

# Prefill 特点: Compute-Bound
#   - 大量 GEMM 计算 (处理完整输入序列)
#   - 高算力利用率
#   - 适合 FP8 量化 + 最大化 FLOPS

# Decode 特点: Memory-Bound
#   - 每步只处理 1 token
#   - KV Cache 读取密集
#   - 适合 FP4 量化 + 最大化带宽

# 收益:
#   - Prefill Worker 不被 Decode 的低利用率拖累
#   - Decode Worker 可以跑更大的 batch (更多 KV Cache)
#   - 整体吞吐提升 40-60%
```

## 4.9 LiteRT-LM：端侧 LLM 推理（2026）

Google 开源 LiteRT-LM（原 TensorFlow Lite 演进），专为移动端和边缘设备设计：

```
LiteRT-LM 核心特性:
┌─────────────────────────────────┐
│ 统一 API                        │
│  - ARM CPU / GPU / DSP / NPU   │
│  - Android / iOS / 嵌入式      │
├─────────────────────────────────┤
│ 量化支持                        │
│  - 4-bit / 8-bit 权重量化      │
│  - 动态 KV Cache 分页          │
│  - Speculative Decoding        │
├─────────────────────────────────┤
│ 性能目标 (Gemma 4 E2B, Pixel)  │
│  - 50+ tok/s 推理速度          │
│  - 首 token 延迟 < 200ms       │
│  - 内存占用 < 4GB              │
└─────────────────────────────────┘
```

### 端侧推理 vs 云端推理经济学

```
成本对比（单用户 1000 次/天推理）:

云端推理:
  - API 调用成本: $0.01/请求 × 1000 = $10/天
  - 网络延迟: 100-500ms
  - 隐私: 数据上传到云端

端侧推理 (LiteRT-LM):
  - 一次性设备成本: 已含在手机价格中
  - 推理成本: 仅电费（~$0.01/天）
  - 延迟: 20-50ms（本地）
  - 隐私: 数据不离设备

结论: 高频场景下端侧推理成本仅为云端的 1/1000
```

## 4.10 推理成本经济学全景（2026 Q1）

```
2026 推理成本光谱（每百万 output token）:

最贵                                              最便宜
├──────────────────────────────────────────────────┤
$125   $30    $15    $2.19   $0.10    ~$0
│      │      │      │       │        │
Mythos GPT-5.4 Opus  DSR2  Flash-Lite 端侧
(门控)                       (Free Tier)

成本压缩趋势:
  2023: GPT-4 ────── $60/M token
  2024: GPT-4o ───── $15/M token (4x↓)
  2025: GPT-4o-mini ─ $0.60/M token (25x↓)
  2026: DSR2 ─────── $2.19/M token (功能↑, 价格平)
  2026: 端侧 ──────── ~$0 (Gemma 4, 本地运行)

核心观点: 推理成本正在趋零，但最强模型的定价反而在升高
         → 两极分化: commodity AI (趋零) vs frontier AI (溢价)
```

## 4.11 本章小结

TensorRT-LLM 通过**编译时优化**（算子融合、量化、CUDA Graph）实现最高的推理性能，代价是部署复杂度和模型适配周期。2026 年 B200 时代，FP4 量化进一步将模型大小压缩 4x，使 70B 模型单卡可推理。

| 技术 | 加速来源 | 代价 |
|------|---------|------|
| 算子融合 | 减少 HBM 访问 ~50% | 编译时间 |
| FP8/FP4 | 压缩权重+激活 | 轻微精度损失 |
| CUDA Graph | 消除 kernel launch 开销 | 静态 batch 大小 |
| In-Flight Batching | 提升 GPU 利用率 | C++ 调度复杂度 |
| **Dynamo 分离调度** | **Prefill/Decode 独立优化** | **集群管理复杂度** |
| **LiteRT-LM 端侧** | **零网络延迟 + 零 API 成本** | **算力受限** |

### 2026 推理栈选型全景

```
场景                   推荐方案
─────────────────────  ──────────────────────
极致延迟 (实时对话)    TensorRT-LLM + CUDA Graph
超大规模服务          NVIDIA Dynamo + TRT-LLM
快速原型 / 新模型     vLLM (社区快 + 灵活)
复杂多轮 / Agent      SGLang (RadixAttention)
端侧 / 隐私场景       LiteRT-LM + Gemma 4
成本敏感              DeepSeek R2 API ($2.19/M)
自驾 / 机器人实时     TensorRT + 定制量化
```

---

*Signal 知识平台 · LLM 推理框架 · 第 4 章*
