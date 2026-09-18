---
title: "Iceberg + Ray Data + MLflow + vLLM 离线多模态处理优化全书 - 第6章: Ray Data 调度、批处理与容错优化"
book: "Iceberg + Ray Data + MLflow + vLLM 离线多模态处理优化全书"
chapter: "6"
chapterTitle: "Ray Data 调度、批处理与容错优化：让每张卡都别闲着"
description: "讲解 Ray Data 侧的任务粒度控制（repartition）、batch_size 与 actor 数的选择、CPU/GPU 混合编排、batch 级容错重试代价、object store 内存压力与落后者（straggler）治理"
date: "2026-09-18"
updatedAt: "2026-09-18"
agent: "研究员→编辑→审校员"
tags:
  - "Ray Data"
  - "任务粒度"
  - "repartition"
  - "容错"
  - "ActorPool"
  - "调度"
type: "book"
---

## 6.1 任务粒度：一切调度问题的根源

Ray Data 把数据切成 **block（块）**，推理任务由块派生。粒度不对会导致两类问题：

| 问题 | 成因 | 表现 |
|---|---|---|
| **块太大** | 读少量大文件 / 没 repartition | 任务太少 → 负载不均、有的 worker 闲着、失败要重跑整个大块 |
| **块太小** | repartition 过度 | 任务太多 → 调度开销、object store 元数据压力 |

**核心公式**：

```text
推理任务数 ≈ dataset_size / batch_size
每个 worker 分到的任务数 ≈ 任务数 / actor 数
```

**要求**：每个 worker 手上要**有多个任务**（经验上 ≥ 几个到十几个），才能保证负载均衡和持续忙碌。

## 6.2 repartition：控制粒度的主手段

从 Iceberg / Parquet 读出来的块大小由上游决定，**往往不适合直接进推理**。所以读进来后第一件事通常是 repartition：

```python
ds = read_from_iceberg(...)          # 块大小由 Iceberg 文件布局决定
ds = ds.repartition(num_blocks=256)  # 主动切块，控制下游任务粒度
```

**怎么选 `num_blocks`**：

```text
num_blocks 的参考：让「每块行数」与 batch_size 匹配，且块数 >> actor 数

例：100 万行，batch_size=128，actor 数=8
  希望每 worker 有 ~10+ 个任务 → 总任务数 ≥ 80
  任务数 ≈ 1_000_000 / 128 ≈ 7800 → 已经足够
  此时 repartition 主要作用是「打散上游的大块」，取 num_blocks = actor数 × 几十 即可
```

**实践口诀**：

- 块数 **远大于** actor 数（保证负载均衡）
- 单块 **别太大**（避免单块内存峰值与重试代价）
- 单块也**别太小**（避免调度开销）

通常取 `num_blocks = actor 数 × 20 ~ 50` 起步压测。

## 6.3 batch_size：在"引擎饱和"与"重试代价"之间平衡

`map_batches(batch_size=N)` 决定一次给模型多少行。权衡：

| 太小 | 太大 |
|---|---|
| vLLM 调度器不饱和 → GPU 空转 | 内存峰值高（尤其视频解码后） |
| 单位时间请求多，调度开销占比高 | **单批失败重试代价大**（整批重跑） |
| 引擎连续批处理优势发挥不出来 | 单个慢请求拖住整批（尾延迟） |

**建议**：

1. 从 **`batch_size ≈ max_num_seqs`**（第 5 章）起步
2. 压测：逐步调大，看吞吐是否继续涨、GPU 利用率是否上升
3. 到达拐点后**回调一档**——换取更好的容错与更稳的内存

## 6.4 actor 数与并发：让 GPU 不闲置

```python
pred = ds.map_batches(
    CaptionActor,
    batch_format="pandas",
    batch_size=128,
    compute=ray.data.ActorPoolStrategy(size=ACTOR_COUNT),
    num_gpus=1,
)
```

| 参数 | 建议 |
|---|---|
| `ACTOR_COUNT` | = 可用 GPU 数（每 actor 一张卡）；若模型需 TP=2，则 `num_gpus=2` 且 actor 数减半 |
| `num_gpus` | 每 actor 占用的 GPU 数，**必须与 PyFunc 内 vLLM 的 `tensor_parallel_size` 一致** |
| CPU 配比 | 第 3 章：按解码成本给每 GPU 配 4–16 个 CPU（视频场景更多） |

**注意**：`size=` 是**固定** actor 数；Ray Data 也支持弹性范围（`min,max` 形式，具体以版本文档为准），让集群能按负载伸缩。

## 6.5 失败重试：batch 级容错与代价

Ray Data 的容错是 **batch 级**：某个 batch 失败，**只重试那个 batch**，而不是整个任务重跑。这对 12 小时的长任务至关重要。

但代价与 `batch_size` 直接相关：

```text
batch_size = 32   → 失败重跑 32 行，代价小
batch_size = 1024 → 失败重跑 1024 行，代价大
```

**配套策略**：

1. **逐条兜底**（第 4 章）：单条脏数据异常要在 `predict` 内捕获，不要让异常冒到 batch 级触发重试
2. **超时控制**：单批设置合理超时，避免一个卡死任务拖住整个作业
3. **长任务 checkpoint**：对超长作业，考虑分阶段 materialize 中间结果（写回 Iceberg 或对象存储），避免从头重跑
4. **失败样本单独收集**：失败行写入一张"死信表"，后续单独处理，不阻塞主流程

## 6.6 内存与背压：object store 的压力

Ray Data 用 **object store** 在 stage 间传递数据块。多模态场景尤其要注意——**解码后的图片/帧比原始字节大得多**：

| 风险 | 表现 | 对策 |
|---|---|---|
| 块太大导致 object store 打满 | 任务被 spilling 到磁盘，性能骤降 | 减小块（repartition）、降低 batch_size |
| 视频帧驻留内存 | 内存 OOM | 抽帧上限（第 3 章）、及时释放、控制并发 |
| 预处理产出远大于输入 | 下游 stage 压力大 | 预处理后立即 resize / 压缩 |

**监控**：Ray Dashboard 里看 object store 使用率与 **spilling** 指标；一旦频繁 spilling，优先调小粒度。

## 6.7 惰性执行与触发

Ray Data 是**惰性（lazy）**的：定义流水线不会立即执行，直到触发 action：

```python
# 定义（不执行）
pred = ds.map_batches(...)

# 触发执行
pred.write_iceberg(...)        # 或 write_parquet / materialize / count
```

**实践提示**：

- 一次 `write_*` 会把整条流水线跑完并落盘，**避免重复触发**（否则会跑两遍）
- 调试时可用 `ds.take(n)` 或 `materialize()` 小样本验证
- 正式任务通常**一次 write 到底**，中间不做多余的 action

## 6.8 监控与落后者（straggler）

跑批时打开 **Ray Dashboard**，重点看：

| 指标 | 看什么 |
|---|---|
| Actor 数 / GPU 预留 | 是否按预期起了 actor、GPU 是否都被占上 |
| 任务进度 | 是否均衡；有没有个别 worker 明显落后 |
| **Straggler（落后者）** | 少数慢任务拖尾——常由个别超大视频/坏数据导致 |
| GPU 利用率 | 判断 CPU/GPU 谁瓶颈（第 3 章） |
| Object store / spilling | 内存压力（6.6） |

**Straggler 治理**：找出最慢的那几块（往往是超大视频），在源表侧提前过滤或单独降分辨率处理（第 2 章的 `size_bytes` / `duration` 过滤）。

## 6.9 本章小结

- **粒度是调度之本**：块数要远多于 actor 数，单块别太大也别太小；用 `repartition` 主动控制。
- **任务数公式**：`≈ dataset_size / batch_size`；保证每个 worker 有多个任务。
- **`batch_size` 平衡两端**：引擎饱和（别太小）vs 重试代价与内存（别太大），从 `≈ max_num_seqs` 起步压测。
- **actor 数 = GPU 数**，`num_gpus` 必须与 vLLM 的 `tensor_parallel_size` 一致。
- **容错是 batch 级**：逐条兜底避免整批重试；长任务要 checkpoint 或分阶段落盘。
- **盯住 object store 与 straggler**：spilling 与落后者是性能黑洞的主要来源。
- 用 `stats()`（第 3 章）+ Ray Dashboard 持续观测。
