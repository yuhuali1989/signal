---
title: "Iceberg + Ray Data + MLflow + vLLM 离线多模态处理优化全书 - 第5章: vLLM 离线推理参数优化"
book: "Iceberg + Ray Data + MLflow + vLLM 离线多模态处理优化全书"
chapter: "5"
chapterTitle: "vLLM 离线推理参数优化：把 GPU 塞满的正确姿势"
description: "针对本场景（PyFunc 内 vLLM 引擎），系统讲解引擎参数、采样参数、多模态专属参数的调优，说明 batch_size 与 max_num_seqs 的配合关系、离线下投机解码为何该关、量化取舍，并给出效果参考"
date: "2026-09-18"
updatedAt: "2026-09-18"
agent: "研究员→编辑→审校员"
tags:
  - "vLLM"
  - "参数调优"
  - "离线推理"
  - "多模态"
  - "量化"
  - "吞吐"
type: "book"
---

## 5.1 本场景的参数落点（三层）

本场景（第 4 章的 `map_batches` + PyFunc）里，参数分布在三处，别调错地方：

| 层 | 参数在哪 | 例子 |
|---|---|---|
| **Ray Data 调度层** | `map_batches` 的参数 | `batch_size`、`ActorPoolStrategy(size=)`、`num_gpus` |
| **vLLM 引擎层** | PyFunc `load_context` 里的 `LLM(...)` | `max_num_seqs`、`max_num_batched_tokens`、`gpu_memory_utilization` |
| **采样参数层** | `SamplingParams` | `temperature`、`max_tokens`、`seed` |

**引擎参数（第二层）是性能主战场**，本章重点。

## 5.2 vLLM 引擎核心参数（离线批处理建议）

| 参数 | 默认 | 离线建议 | 作用与说明 |
|---|---|---|---|
| `max_num_seqs` | 128 | **256+** | 并发序列数，决定 KV cache 预分配；太小 → GPU 吃不饱 |
| `max_num_batched_tokens` | 8192 | **16384+** | 单步处理的 token 上限，**离线最大杠杆之一**，直接决定能否把 GPU 塞满 |
| `gpu_memory_utilization` | 0.90 | **0.95**（专用硬件） | 更多显存 → 更大 KV cache → 更高并发 → 更高吞吐 |
| `enable_prefix_caching` | True | 保持开 | caption 模板共享 system prompt / 相同前缀，命中率很高 |
| `enable_chunked_prefill` | True | 保持开 | 消除长 prompt 的队头阻塞（Head-of-Line Blocking） |
| `max_model_len` | 模型默认 | **按实际收紧** | 见 5.4，多模态场景它是"显存杀手" |
| `tensor_parallel_size` | 1 | 大模型按需 | 单卡放不下时用；配合 `num_gpus` |
| `quantization` | None | FP8 / AWQ 等（看显卡与模型） | 省显存换吞吐，注意质量回退（5.5） |
| 投机解码 | 关 | **离线高 batch 建议关** | 见 5.6 |

**最常用的"三板斧"**：把 `max_num_batched_tokens` 提到 16384+、`gpu_memory_utilization` 提到 0.95、`max_num_seqs` 提到 256+——这三条通常就能把默认配置的吞吐拉起来一大截。

## 5.3 采样参数：不只影响质量，也影响吞吐与可复现

| 参数 | 建议 | 说明 |
|---|---|---|
| `temperature` | caption 任务建议 **0–0.3** | 低温度输出稳定、可复现；高温度会让同一张图两次结果不同，不利于数据一致性 |
| `max_tokens` | **按实际收紧**（如 512） | 直接决定单请求最长占用时间；放太大 = 单条慢请求占着并发槽位 |
| `seed` | 固定值 | 保证可复现；数据生产场景强烈建议固定 |
| `top_p` | 视任务 | 与 temperature 配合 |

**离线数据生产的特殊要求**：caption 是要进训练集的，同一份数据**必须可复现**。所以温度要低、`seed` 要固定——否则模型版本没变，两次跑出来的 caption 不一样，下游无法 diff。

## 5.4 多模态专属参数（和纯文本最大的不同）

**① `max_model_len` 是显存杀手**

VLM 的输入不只是文本 token，**图像会被编码成大量 visual token**：

```text
一张 448×448 的图 → 可能上千个 visual token
一条 prompt 里多张图 → visual token 线性叠加
视频多帧 → 更容易直接打爆
```

因此：

- `max_model_len` 必须**按"文本 token + 视觉 token"的实际上限**设置，不能照抄纯文本模型的配置
- 设太小 → 长输入被截断/报错；设太大 → KV cache 按最大值预分配，**显存被白白吃掉，并发数下降**

**对策**：先收紧输入（第 3 章的 resize / 抽帧上限），再据此设一个**刚好够用**的 `max_model_len`。

**② `limit_mm_per_prompt`（限制每条 prompt 的媒体数）**

显式限制每条请求最多几张图/几段视频，防止异常数据（一条带 50 张图）把显存打爆：

```python
LLM(..., limit_mm_per_prompt={"image": 4, "video": 1})
```

**③ encoder-output caching（一图多问的大杀器）**

vLLM 2026 的多模态支持里，同一份媒体输入被多次提问时，**视觉编码结果可以缓存复用**。本场景若做"一图多问"（同时生成描述 / OCR / 属性标签），收益非常明显——省掉最贵的视觉编码器重算。

## 5.5 量化：吞吐与质量的取舍

| 方案 | 收益 | 代价 / 注意 |
|---|---|---|
| FP8 | 显存减半、吞吐提升明显 | 需硬件支持（如 Hopper/Blackwell）；VLM 上要验证质量 |
| AWQ / GPTQ | 显存显著下降 | 有校准成本；VLM 量化支持不如纯 LLM 成熟 |
| KV Cache 量化（FP8 KV） | 进一步省 KV 显存 | 长上下文收益大；注意精度影响 |

**本场景的关键提醒**：caption 是要喂给下游训练的，**质量下降会污染训练集**。所以量化必须做 A/B：

- 同一批样本，分别跑 FP16 与量化版本
- 对比**质量指标**（caption 的评分/有效率）与**吞吐**
- 只有"质量掉得可接受 + 吞吐涨得够多"才上线，并把结论记进 MLflow（第 8 章）

## 5.6 投机解码：离线高 batch 建议关

这是一个常见误区。投机解码（speculative decoding）的本质是**用小的 draft 模型猜、大模型验**，它优化的是**单请求延迟**，不是吞吐。

在离线批处理里：

- batch 已经很大 → GPU 已经**计算瓶颈（compute-bound）**
- 此时投机解码的额外 draft/verify 开销**是净损失**
- 实测通常"打平最好，多数更差"

**建议**：离线高 batch 场景**关闭**投机解码。vLLM 提供了按 batch 自动关闭的开关（如 `-speculative-disable-by-batch-size` 一类参数），小 batch 低延迟场景才开。

## 5.7 batch_size 与 max_num_seqs 的配合（本场景版"黄金约束"）

在 `ray.data.llm` 的 `vLLMEngineProcessorConfig` 里，Anyscale 官方给的黄金约束是：

```text
batch_size × max_concurrent_batches ≥ max_num_seqs
```

本场景走的是 `map_batches` + PyFunc，**没有 `max_concurrent_batches` 这个参数**，但原理等价，可以这么理解：

> **每个 actor 一次 `generate` 送进去的条数（≈ `batch_size`）要足够大，让 vLLM 调度器能吃满 `max_num_seqs`；同时 actor 池要有足够多的排队任务，避免 GPU 空转。**

实践建议：

| 参数 | 建议 |
|---|---|
| `batch_size`（`map_batches`） | 从 **`≈ max_num_seqs`** 起步压测；太小 → 引擎调度不饱和；太大 → 内存峰值高、单批失败重试代价大 |
| `ActorPoolStrategy(size=)` | = 可用 GPU 数（每 actor 一卡） |
| 排队 | Ray Data 会自动把块排队给空闲 actor；确保 **块数远多于 actor 数**（第 6 章的 `repartition`） |

**验证方法**：看 GPU 利用率。若利用率低且 CPU 不是瓶颈（第 3 章已排除），优先调大 `batch_size` 和 `max_num_seqs`。

## 5.8 效果参考

| 项 | 量级 / 结论 | 来源 |
|---|---|---|
| vLLM V1 vs V0 | 官方称最高 **1.7×** 吞吐提升，**VLM 增益更大** | vLLM V1 官方博客 |
| 三板斧（塞满 GPU） | 相比默认配置通常 **2–3×**（视模型/硬件/数据） | 工程实践综合 |
| 重排序（按前缀/长度分桶） | 研究系统（BlendServe / BatchLLM）比原生快 **1.1–1.44×** | 研究文献 |
| 量化 | 吞吐显著提升，但**必须验证质量**（见 5.5） | 工程实践 |
| 引擎横评 | TensorRT-LLM 稳定 NVIDIA 部署峰值吞吐高 10–20%（代价数十分钟编译）；SGLang 共享前缀场景更优；**vLLM 通用默认** | 行业评测 |

**期望管理**：不要指望某一个参数带来数量级提升。真正的杠杆是"**把 GPU 塞满 + 排除 CPU 瓶颈 + 参数匹配**"这三条同时做对。

## 5.9 本章小结

- 参数分三层：Ray Data 调度（`batch_size` / actor 数）、vLLM 引擎（`LLM(...)`）、采样（`SamplingParams`）。**性能主战场在引擎层。**
- 三板斧：`max_num_batched_tokens` ≥ 16384、`gpu_memory_utilization` ≈ 0.95、`max_num_seqs` ≥ 256。
- **多模态专属**：`max_model_len` 要算上 visual token（显存杀手）；用 `limit_mm_per_prompt` 防异常输入；一图多问开 encoder caching。
- **采样参数**：caption 进训练集要可复现 → 低 temperature + 固定 seed + 收紧 `max_tokens`。
- **量化必须 A/B 验证质量**，不能只看吞吐。
- **离线高 batch 关投机解码**（它是延迟工具不是吞吐工具）。
- `batch_size` 与 `max_num_seqs` 要匹配：让调度器始终有活干。
