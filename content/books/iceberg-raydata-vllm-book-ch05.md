---
title: "Iceberg + Ray Data + MLflow + vLLM 离线多模态处理优化全书 - 第5章(上): vLLM 参数深度展开——显存、并发与调度"
book: "Iceberg + Ray Data + MLflow + vLLM 离线多模态处理优化全书"
chapter: "5"
chapterTitle: "vLLM 参数深度展开（上）：显存、并发与调度核心参数"
description: "逐个展开 vLLM 最核心的参数：gpu_memory_utilization、max_model_len、max_num_seqs、max_num_batched_tokens、enable_chunked_prefill 及调度抢占相关参数，讲清每个参数的原理、调大调小的影响、调优方法与典型坑，并给出显存三角依赖关系的完整推导"
date: "2026-09-18"
updatedAt: "2026-09-18"
agent: "研究员→编辑→审校员"
tags:
  - "vLLM"
  - "参数调优"
  - "显存"
  - "max_num_seqs"
  - "chunked prefill"
  - "并发"
type: "book"
---

## 5.1 调优方法论：先量，再改，一次只改一个

在展开参数前，先定方法论——**参数调优最容易犯的错是"同时改五个参数然后看总数"**，结果不知道哪个起了作用。

**正确姿势**：

```text
① 建立基线：用默认配置跑一批固定样本，记录吞吐（rows/s）、GPU 利用率、显存占用、耗时
② 一次只改一个参数，其他固定
③ 记录变化：吞吐涨了多少？显存升了多少？质量掉没掉？
④ 找到单参数的最优区间后，再组合验证
⑤ 固化：把最优组合写进配置模板，并把这次实验记进 MLflow（第 8 章）
```

**必须监控的三个量**：

| 量 | 怎么看 | 作用 |
|---|---|---|
| **吞吐** | rows/s（或 tokens/s） | 最终目标 |
| **GPU 利用率** | Ray Dashboard / `nvidia-smi` / MLflow 系统指标 | 判断瓶颈在 CPU 还是 GPU（第 3 章） |
| **显存占用** | `nvidia-smi` | 判断是否接近 OOM、KV cache 够不够 |

> **如果 GPU 利用率还很低，先别急着调 vLLM 参数**——先按第 3 章排除 CPU 侧（拉取/解码）瓶颈。否则调了半天参数，瓶颈根本不在这。

## 5.2 gpu_memory_utilization：显存总闸门

```python
LLM(model=..., gpu_memory_utilization=0.95)
```

**是什么**：vLLM 允许自己占用的 GPU 显存比例（权重 + KV cache + 激活）。

**为什么关键**：这是**所有其他显存相关参数的上限**。它决定了 KV cache 能有多大，而 KV cache 大小直接决定**能同时处理多少个序列**（并发度），并发度又决定吞吐。

**调大（0.90 → 0.95）**：

- ✅ KV cache 更大 → 更多并发序列 → 更高吞吐
- ⚠️ 风险：留给其他进程（如你的解码/预处理、其他模型）的显存变少，可能 OOM

**调小**：

- 更安全，但 KV cache 小 → 并发低 → 吞吐低
- 只在"这张卡还要跑别的任务"时才调小

**典型值**：

| 场景 | 建议 |
|---|---|
| **专用推理卡**（离线批处理的常态） | **0.95** |
| 与其他任务共享一张卡 | 0.5–0.8（按实际分配） |
| 调试/不确定时 | 0.85 起步，逐步上调 |

**坑**：设得太高（如 0.98）时，如果模型加载阶段有其他显存开销（CUDA context、NCCL buffer），可能在初始化就 OOM。**离线专用卡用 0.95 是比较稳的经验值**。

**与其他参数的关系**：它和 `max_model_len`、`max_num_seqs` 构成"显存三角"（见 5.9）。

## 5.3 max_model_len：被忽视的显存杀手（多模态尤甚）

```python
LLM(model=..., max_model_len=8192)
```

**是什么**：单个序列支持的最大 token 数（上下文上限）。

**为什么关键**：vLLM 会**按这个上限预留 KV cache 的槽位**。设得过大 = 每个序列预留过多 = 并发数下降 = 吞吐下降。

**多模态场景的特殊性**（重要）：

VLM 的输入 token 数 = **文本 token + 视觉 token**。而视觉 token 数量由图像分辨率/视频帧数决定：

```text
例：Qwen2.5-VL 类模型
一张 448×448 图 → 数百~上千 visual token
一条 prompt 带 4 张图 → 数千 token
一段视频抽 32 帧 → 上万 token
```

所以 `max_model_len` **必须覆盖"文本 + 视觉 token"的最坏情况**，而不是照抄纯文本模型的配置（如 4096/8192）。

**调优步骤**：

1. **先收紧输入**（第 3 章）：图片 resize、视频抽帧上限——这是根本
2. **统计实际最大 token 数**：跑一批样本，看 prompt 的实际 token 分布（取 P99 或最大值）
3. **设一个"刚好够用"的值**：`max_model_len = P99 token 数 × 1.2`（留 20% 余量）
4. **验证**：不能出现截断/报错；也不能设得明显过大

**典型坑**：

| 坑 | 后果 |
|---|---|
| 设太小 | 长输入被截断或报错（多图/视频场景常见） |
| 设太大 | 显存被白白吃掉 → 并发下降 → **吞吐变慢**（很多人不知道这个反向影响） |
| 照抄纯文本配置 | 多模态场景下要么截断、要么浪费 |

## 5.4 max_num_seqs：并发序列数

```python
LLM(model=..., max_num_seqs=256)
```

**是什么**：vLLM 调度器**同时处理的最大序列数**（即"并发槽位"）。

**为什么关键**：它直接决定 GPU 一次能吃多少活。太小 → GPU 吃不饱（利用率低）；太大 → 显存不够（KV cache 放不下）或调度开销上升。

**与显存的关系**：

```text
需要的 KV cache ≈ max_num_seqs × max_model_len × 每 token KV 大小
```

所以三者互相制约（显存三角，见 5.9）。

**调优**：

- 从 **128（默认）起步**，离线批处理通常上调到 **256 / 512**
- 上调的前提：显存够（先确认 `gpu_memory_utilization` 已给足、`max_model_len` 已收紧）
- 验证：看 GPU 利用率是否上升、吞吐是否上涨；若显存告警或 OOM 就回调

**典型值**：

| 场景 | 建议 |
|---|---|
| 小模型 + 短输入 | 256–512 |
| 大模型（70B+）或长输入 | 64–256（显存受限） |
| 离线批处理（显存给足） | **尽量大**，直到吞吐不再涨 |

## 5.5 max_num_batched_tokens：单步 token 上限（离线最大杠杆）

```python
LLM(model=..., max_num_batched_tokens=16384)
```

**是什么**：调度器**单步（一次 forward）最多处理多少 token**（含 prefill 与 decode）。

**为什么关键**：它决定一次 forward 能吃多少计算量。太小 → 每个 step 只处理一点 token，GPU 计算单元闲置（尤其 prefill 阶段）；太大 → 单步延迟变长、激活显存峰值上升。

**离线批处理为什么要调大**：

- 离线不在乎单请求延迟，只在乎**总吞吐**
- 把 `max_num_batched_tokens` 从 8192 提到 **16384 甚至更高**，能让 GPU 每步都吃得饱 → **吞吐显著提升**
- 这是业界公认的"离线最大杠杆之一"

**与 chunked prefill 的关系**：开启 chunked prefill 后，长 prompt 会被切成不超过 `max_num_batched_tokens` 的块分批处理——所以这个值也是**分块大小**。

**调优**：

- 默认通常 8192；离线提到 **16384+** 起步
- 若显存允许、模型较大，可继续上调（如 32768）
- 验证：吞吐是否继续涨；单步耗时是否可接受；是否 OOM

**坑**：设得过大时，单步激活显存峰值上升，可能在大模型上触发 OOM——**大值要配合显存余量**。

## 5.6 enable_chunked_prefill：消除队头阻塞

```python
LLM(model=..., enable_chunked_prefill=True)
```

**是什么**：把长 prompt 的 prefill 阶段**切块**，与 decode 混合调度。

**为什么需要**（原理）：

```text
不开启时：一个超长 prompt 的 prefill 要独占若干 step
→ 其他已经在进行 decode 的请求被"卡住"（队头阻塞 Head-of-Line Blocking）
→ 表现为：部分请求延迟尖刺，GPU 有时在等

开启后：长 prompt 被切成小块，与 decode 请求混合进同一个 batch
→ 调度更平滑、GPU 更满
```

**离线场景**：**保持开启**（默认通常也开）。它与 `max_num_batched_tokens` 配合——后者决定分块大小。

**调优**：

- 保持 `True`
- 调 `max_num_batched_tokens` 控制块大小
- 若输入都很短（如短 caption prompt），收益不明显，但也无害

## 5.7 调度与抢占相关参数

| 参数 | 作用 | 离线建议 |
|---|---|---|
| `num_scheduler_steps` | 一次调度决策执行多少个 step（多步调度），减少调度开销 | 可调大（如 10+）以降低 CPU 调度开销；太大则可能降低响应性（离线可接受） |
| `preemption_mode` | 显存不足时抢占策略（`RECOMPUTE` / `SWAP`） | vLLM V1 默认改成了 **RECOMPUTE**（重算而非换出），离线场景保持默认即可 |
| `long_prefill_token_threshold` | 超过该 token 数的 prompt 才走分块 prefill | 配合 chunked prefill；可按 prompt 长度分布微调 |

**离线场景的一般原则**：这些参数**默认值通常够用**，优先级低于 `max_num_batched_tokens` / `max_num_seqs` / `gpu_memory_utilization` 三板斧。只有在三板斧调完、且确认调度是瓶颈时才深挖。

## 5.8 显存相关的其他参数

| 参数 | 作用 | 说明 |
|---|---|---|
| `block_size` | PagedAttention 的页大小（默认通常 16 或 32） | 影响 KV cache 的碎片与利用率；一般不动，除非有明确理由 |
| `swap_space` | CPU 内存兜底（V1 已移除相关旧行为） | 离线显存给足时不需要；V1 默认 preemption 改为 RECOMPUTE |
| `cpu_offload_gb` | 把部分权重 offload 到 CPU | 显存实在不够时的下策，会显著变慢，**离线批处理不推荐** |
| `kv_cache_dtype` | KV cache 的数据类型（如 `fp8`） | 显存紧张时的有效手段：KV 显存减半，可换更高并发；注意精度影响（见下册量化章节） |

## 5.9 显存三角：三个参数如何互相制约

这是理解 vLLM 显存参数的关键模型：

```text
        gpu_memory_utilization（总闸门，决定显存池大小）
                    │
        ┌───────────┴───────────┐
        │                       │
   max_model_len          max_num_seqs
（单序列多长）          （多少条并发）
        └───────────┬───────────┘
                    │
        两者相乘 ≈ 需要的 KV cache 总量
        （再 × 每 token KV 大小 × 层数 × 头数等模型相关因子）
```

**推论**（非常重要）：

1. **`max_model_len` 设越大 → 同样显存下能并发的序列越少** → 吞吐可能反而下降
2. **想提高 `max_num_seqs` → 要么加大 `gpu_memory_utilization`，要么收紧 `max_model_len`**
3. **多模态场景尤其要先收紧输入**（resize/抽帧），因为视觉 token 会撑大 `max_model_len`

**调优顺序建议**：

```text
① 先收紧输入（resize / 抽帧上限）——把 max_model_len 的实际需求压下来
② 设 max_model_len = 实际需求 × 1.2
③ 给足 gpu_memory_utilization（专用卡 0.95）
④ 尽量调大 max_num_seqs（直到吞吐不涨或显存告警）
⑤ 调大 max_num_batched_tokens（塞满 GPU）
```

## 5.10 本章小结（上）

- **方法论先于参数**：先量（吞吐/GPU 利用率/显存），一次只改一个，先排除 CPU 瓶颈。
- **`gpu_memory_utilization`** 是显存总闸门；离线专用卡给 **0.95**。
- **`max_model_len`** 是隐性杀手：多模态要算上视觉 token；设太大会**反向拖慢吞吐**（并发下降）。
- **`max_num_seqs`** 决定并发槽位；离线从 128 上调到 256/512。
- **`max_num_batched_tokens`** 是离线最大杠杆：8192 → **16384+**，让 GPU 每步吃饱。
- **`enable_chunked_prefill`** 保持开启，消除长 prompt 的队头阻塞。
- **显存三角**：`gpu_memory_utilization` × `max_model_len` × `max_num_seqs` 互相制约，调优有先后顺序。
- 调度/抢占参数默认够用，优先级低于三板斧。

> **下册（第 5a 章）继续展开**：多模态专属参数、量化、投机解码、并行策略、Prefix Caching 与重排序、参数组合矩阵、调优 SOP 与压测模板。
