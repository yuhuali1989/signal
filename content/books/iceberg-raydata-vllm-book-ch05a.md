---
title: "Iceberg + Ray Data + MLflow + vLLM 离线多模态处理优化全书 - 第5章(下): 多模态、量化、投机解码、并行与调优实战"
book: "Iceberg + Ray Data + MLflow + vLLM 离线多模态处理优化全书"
chapter: "5a"
chapterTitle: "vLLM 参数深度展开（下）：多模态、量化、投机解码、并行与调优实战"
description: "继续展开 vLLM 进阶参数：多模态视觉 token 与 encoder caching、量化（权重与 KV cache）及质量 A/B、投机解码为何离线该关、并行策略与 Ray 协同、Prefix Caching 与重排序、采样参数与可复现，并给出参数组合配方、调优 SOP、压测模板与症状排障表"
date: "2026-09-18"
updatedAt: "2026-09-18"
agent: "研究员→编辑→审校员"
tags:
  - "vLLM"
  - "多模态"
  - "量化"
  - "投机解码"
  - "并行策略"
  - "prefix caching"
  - "调优实战"
type: "book"
---

## 5a.1 多模态专属参数：视觉 token 是核心变量

VLM 与纯 LLM 最大的参数差异在于：**输入 token 数不再由文本决定，而是"文本 + 视觉"**。

### 视觉 token 从哪来

不同模型的视觉编码方式不同（动态分辨率、tile 切分、patch 划分等），但共同规律是：

```text
视觉 token 数 ∝ 图像分辨率（像素数）
视觉 token 数 ∝ 视频帧数 × 每帧 token
```

**实践做法**：

1. **实测**：用你的真实图片/视频跑一批，打印每条 prompt 的实际 token 数（vLLM 的 tokenizer/processor 可拿到）
2. **取 P99**：按 P99 设 `max_model_len`（上册 5.3）
3. **先收紧输入**：resize、抽帧上限（第 3 章）——这是降低 token 的根本手段

### limit_mm_per_prompt：防止异常输入打爆显存

```python
LLM(..., limit_mm_per_prompt={"image": 4, "video": 1})
```

显式限制每条请求最多几张图/几段视频。**必做**——生产数据里一定会有"一条带几十张图"的异常行，不限制会直接 OOM 或让单请求拖垮整个 batch。

### encoder-output caching：一图多问的大杀器

vLLM 2026 的多模态能力里，同一份媒体输入被多次提问时，**视觉编码结果可缓存复用**。

**适用场景**：本场景常见的"一图多问"——同一张图同时生成描述、OCR、属性标签：

```text
不开缓存：问 3 个问题 → 视觉编码器跑 3 次（最贵的部分重复计算）
开缓存：  问 3 个问题 → 视觉编码器只跑 1 次
```

**收益**：省掉最昂贵的视觉编码重算，对"多任务标注"型 caption 收益极大。

### 动态分辨率的取舍

部分 VLM 支持动态分辨率（按原图分辨率自适应 token 数）。它的两面性：

| | 说明 |
|---|---|
| 优点 | 高分辨率图 → 更多 token → 细节更好（OCR 类任务需要） |
| 代价 | **token 数不可控** → `max_model_len` 与显存难以预估；batch 内 padding 不均 |

**离线批处理建议**：**统一 resize 到固定分辨率**（第 3 章），让 token 数可预测、batch 紧凑、显存可控。除非你的任务强依赖细节（如密集文字识别），再考虑动态分辨率并留足显存。

## 5a.2 量化：省显存换吞吐，但必须 A/B 验质量

量化分两类，可叠加：

| 类型 | 参数 | 作用 | 代价 |
|---|---|---|---|
| **权重量化** | `quantization="fp8"` / `"awq"` / `"gptq"` | 模型权重显存下降 → 省下的显存给 KV cache → 更高并发 | 精度回退；需硬件/格式支持 |
| **KV cache 量化** | `kv_cache_dtype="fp8"` | KV 显存减半 → 并发再提 | 长上下文场景精度影响更明显 |

### 为什么离线批处理特别在意量化

因为**显存 = 并发 = 吞吐**（上册显存三角）。量化省下的显存可以直接换成并发度，进而换成吞吐。

### 但必须做质量 A/B（caption 场景的铁律）

本场景的 caption 是要**喂给下游训练**的。质量下降会污染训练集，而且这种污染**很难事后发现**。

**A/B 流程**：

```text
① 取同一批固定样本（如 1000 条，覆盖各类场景）
② 分别用 FP16（基线）和量化版本生成 caption
③ 对比质量指标：有效率、拒答率、长度分布、CLIPScore、抽样人工/judge 评分
④ 同时对比吞吐（rows/s）与显存
⑤ 决策：只有当"质量掉得可接受 + 吞吐涨得够多"才上线
⑥ 把 A/B 结论记进 MLflow（第 8 章），作为后续回归基线
```

**关键提醒**：VLM 的量化成熟度**不如纯 LLM**。视觉编码器对量化更敏感，务必实测，不要照搬纯文本模型的量化结论。

## 5a.3 投机解码：离线高 batch 建议关（展开原理）

### 原理

用一个小的 draft 模型快速"猜"若干 token，再用大模型一次性"验证"：

```text
猜对了 → 一次 forward 产出多个 token（省时间）
猜错了 → 回退重算（浪费）
```

### 为什么它是"延迟工具"而非"吞吐工具"

离线批处理里：

- batch 很大 → GPU 已经**计算瓶颈（compute-bound）**，计算单元排得满满的
- 此时投机解码引入的 **draft 前向 + verify 前向** 都是**额外的计算**
- 猜对的收益（省几次 decode step）在 compute-bound 下**抵不过额外开销**

**结论**：**高 batch 下它是净损失**。实测通常是"打平最好，多数更差"。

### 参数与建议

| 参数 | 说明 |
|---|---|
| `num_speculative_tokens` | 一次猜几个 token |
| draft 模型相关配置 | 指定 draft 模型 |
| `-speculative-disable-by-batch-size`（按 batch 自动关闭一类开关） | vLLM 提供，让小 batch 用、大 batch 自动关 |

**离线建议**：**直接关掉**。把算力留给真正的吞吐杠杆（`max_num_batched_tokens` / `max_num_seqs`）。

**例外**：只有当你的离线任务是"单条延迟敏感"（如批量但要求每条快速返回）时才考虑——但这与离线批处理的初衷相悖。

## 5a.4 并行策略：TP / PP / EP 与 Ray 协同

模型一张卡放不下时的切分方式：

| 策略 | 参数 | 切分方式 | 适用 |
|---|---|---|---|
| **TP（张量并行）** | `tensor_parallel_size` | 层内横向切，多卡算同一层 | **单节点内**（NVLink 带宽高），最常用 |
| **PP（流水并行）** | `pipeline_parallel_size` | 层间纵向切，不同节点算不同层 | **跨节点**（避免 TP 跨节点通信瓶颈） |
| **EP（专家并行）** | MoE 模型相关 | 专家分布到不同卡 | MoE 模型 |

### distributed_executor_backend：跨节点必须设 ray

```python
LLM(
    model=...,
    tensor_parallel_size=8,           # 单节点 8 卡
    pipeline_parallel_size=2,         # 跨 2 节点
    distributed_executor_backend="ray",  # 跨节点必设
)
```

| 值 | 适用 |
|---|---|
| `"mp"`（默认） | 单节点多卡 |
| `"ray"` | **跨节点**（Ray 负责跨节点编排） |

### 与 Ray Data actor 的配合（本场景）

第 4 章的 `map_batches` 里：

```python
pred = ds.map_batches(
    CaptionActor,
    batch_size=128,
    compute=ray.data.ActorPoolStrategy(size=ACTOR_COUNT),
    num_gpus=TP_SIZE,          # ← 必须等于 PyFunc 内的 tensor_parallel_size
)
```

**关键一致性**：`num_gpus` 必须与 vLLM 的 `tensor_parallel_size`（× `pipeline_parallel_size`）一致，否则 actor 拿到的 GPU 数与引擎期望的不符，会启动失败或资源浪费。

## 5a.5 Prefix Caching 与重排序：离线白捡的收益

### Prefix Caching

```python
LLM(..., enable_prefix_caching=True)
```

**原理**：如果多条 prompt 共享相同前缀（如相同的 system prompt / 指令模板），这部分 KV 可以**只算一次、复用**。

**本场景天然适配**：caption 任务的 prompt 通常是"固定指令 + 图片"，固定指令部分就是共享前缀——命中率很高。**默认开启，保持即可**。

### 重排序（离线专属特权）

离线能先看到全量数据，这是在线服务没有的优势：

| 做法 | 收益 |
|---|---|
| **按共享前缀排序** | 提高 prefix cache / RadixAttention 命中率 |
| **按长度分桶** | 减少 padding 与调度抖动 |

**效果**：围绕这个思路的研究系统（BlendServe、BatchLLM）比原生 vLLM/SGLang 快 **1.1–1.44×**。

**落地**：在 `write_*` 之前对 dataset 按 prompt 模板/长度做一次排序或分桶（Ray Data 可用 `sort` 或在读取阶段按 key 组织）。成本很低，收益确定。

## 5a.6 采样参数与可复现（数据生产场景的硬要求）

| 参数 | 建议 | 说明 |
|---|---|---|
| `temperature` | **0–0.3** | 越低越确定；caption 进训练集要稳定 |
| `top_p` / `top_k` | 配合 temperature | 低温度时可放宽 |
| `max_tokens` | **按实际收紧** | 直接决定单请求最长占用；放太大会让慢请求占着并发槽位 |
| `seed` | **固定值** | 保证可复现 |
| `repetition_penalty` | 视情况 | caption 出现重复啰嗦时可微调 |

**为什么可复现是硬要求**：

> caption 要进训练集。如果同一份数据两次跑出来不一样（模型版本没变），下游就无法 diff、无法回归、无法定位问题。

**做到可复现的三要素**：低 temperature + 固定 seed + **记录引擎版本与参数到 MLflow**（第 8 章）。

## 5a.7 参数组合配方（可直接抄的起点）

| 场景 | 配方要点 |
|---|---|
| **小模型（7B）+ 图片 caption** | `gpu_mem=0.95`、`max_num_seqs=256`、`max_num_batched_tokens=16384`、`max_model_len` 按图算（如 4096）、prefix caching 开、投机解码关 |
| **大模型（70B）+ TP** | 上面基础上加 `tensor_parallel_size=8`、`distributed_executor_backend="ray"`（跨节点）；`max_num_seqs` 受显存限制可能降到 64–128 |
| **视频抽帧 caption** | **先收紧帧数**（第 3 章）；`max_model_len` 按帧数×每帧 token 留足；`limit_mm_per_prompt={"video":1}`；CPU 配比加大 |
| **显存紧张** | `quantization=fp8` + `kv_cache_dtype=fp8`（先做质量 A/B）；收紧 `max_model_len`；适当降 `max_num_seqs` |
| **极致吞吐（专用卡）** | 三板斧拉满 + prefix caching + **重排序** + 投机解码关 + 输入统一 resize |

## 5a.8 调优 SOP（八步）

```text
① 排除 CPU 瓶颈：看 GPU 利用率；若低，先按第 3 章处理（resize/抽帧/并发拉取/CPU 配比）
② 收紧输入：统一分辨率、限制帧数与媒体数（limit_mm_per_prompt）
③ 定 max_model_len：实测 P99 token × 1.2
④ 给显存：gpu_memory_utilization = 0.95（专用卡）
⑤ 提并发：max_num_seqs 128 → 256 → ...（直到吞吐不涨或显存告警）
⑥ 塞满 GPU：max_num_batched_tokens 8192 → 16384+
⑦ 开缓存 + 重排序：prefix caching 开；数据按前缀/长度排序
⑧ 固化 + 记账：最优组合写进配置模板，参数与效果记进 MLflow（第 8 章）
```

**每一步都要量**（吞吐 + GPU 利用率 + 显存），一次只改一个参数。

## 5a.9 压测模板

```python
import time, itertools, mlflow

CONFIGS = [
    {"max_num_seqs": 128, "max_num_batched_tokens": 8192},   # 基线
    {"max_num_seqs": 256, "max_num_batched_tokens": 8192},
    {"max_num_seqs": 256, "max_num_batched_tokens": 16384},
    {"max_num_seqs": 512, "max_num_batched_tokens": 16384},
]

for cfg in CONFIGS:
    with mlflow.start_run(run_name=f"tune-{cfg}", log_system_metrics=True) as run:
        mlflow.log_params(cfg)
        # 用同一批固定样本（保证可比）
        t0 = time.perf_counter()
        out = run_batch(sample_ds, cfg)      # 内部重建引擎或复用 actor
        dur = time.perf_counter() - t0
        n = len(out)
        mlflow.log_metrics({
            "rows": n, "duration_s": dur,
            "rows_per_s": n / dur,
            "gpu_mem_gb": peak_gpu_mem(),    # 需要自己采集
        })
        # 质量：同一批样本的 caption 质量分（可选）
        mlflow.log_metrics({"valid_rate": eval_quality(out)})
```

**压测纪律**：

- 固定样本集、固定 TopK/维度/并发
- 每组配置至少跑 2–3 次取稳定值（冷启动会污染第一次）
- 记录显存峰值（判断是否接近 OOM）
- 质量指标与吞吐一起记

## 5a.10 症状 → 参数排障表

| 症状 | 可能原因 | 先看/调什么 |
|---|---|---|
| GPU 利用率低（<60%） | 瓶颈在 CPU 侧（拉取/解码） | **别调 vLLM**，回去看第 3 章；确认后再调 `max_num_seqs` |
| 吞吐上不去，显存还剩很多 | 并发不够 | 调大 `max_num_seqs`、`max_num_batched_tokens` |
| OOM（初始化阶段） | `gpu_memory_utilization` 太高 / 模型太大 | 降到 0.85–0.9；或上量化；或加 TP |
| OOM（运行期，长输入） | 视觉 token 超预期 / 异常输入 | 收紧输入；设 `limit_mm_per_prompt`；调大 `max_model_len`（若截断） |
| 长 prompt 导致延迟尖刺 | 队头阻塞 | 确认 `enable_chunked_prefill=True`；调 `max_num_batched_tokens` |
| 单条特别慢拖住整批 | 超大视频/巨图（straggler） | 源表侧过滤（第 2 章）；抽帧上限；单独处理 |
| 换了配置结果不一致 | 没固定 seed / temperature 高 | 固定 `seed`、降 `temperature`、记录版本 |
| 吞吐涨了但质量掉了 | 量化或参数过激进 | 回到 5a.2 做质量 A/B；把质量指标纳入决策 |
| 并发调大反而变慢 | 调度开销 / 显存压力 /抢占 | 回调一档；看是否触发抢占（preemption） |

## 5a.11 本章小结（下）

- **多模态核心变量是视觉 token**：先收紧输入（resize/抽帧），再定 `max_model_len`；必设 `limit_mm_per_prompt`；一图多问用 encoder caching。
- **量化省显存换并发换吞吐**，但 VLM 量化更敏感，**caption 场景必须做质量 A/B**。
- **投机解码是延迟工具**：离线高 batch 下是净损失，**关掉**。
- **并行**：单节点用 TP、跨节点用 PP，且 `distributed_executor_backend="ray"`；`num_gpus` 必须与 TP×PP 一致。
- **Prefix Caching + 重排序**是离线白捡的收益（1.1–1.44×）。
- **可复现是硬要求**：低 temperature + 固定 seed + 参数记账。
- 给了**组合配方、八步 SOP、压测模板、症状排障表**——照着做就能把参数调到位。

> 至此 vLLM 参数部分完整展开：**上册（第 5 章）**讲显存/并发/调度核心参数与显存三角；**下册（第 5a 章）**讲多模态/量化/投机解码/并行/缓存与调优实战。
