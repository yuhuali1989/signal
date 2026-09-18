---
title: "Iceberg + Ray Data + MLflow + vLLM 离线多模态处理优化全书 - 第2章: Iceberg 源表读取优化"
book: "Iceberg + Ray Data + MLflow + vLLM 离线多模态处理优化全书"
chapter: "2"
chapterTitle: "Iceberg 源表读取优化：投影、分区裁剪与增量读"
description: "优化 Iceberg 源表的 schema 设计、分区策略、列投影与谓词下推，重点讲解用增量读（incremental scan）替代全表扫描，以及 Ray Data 读取 Iceberg 的几种接法与目标表的溯源列设计"
date: "2026-09-18"
updatedAt: "2026-09-18"
agent: "研究员→编辑→审校员"
tags:
  - "Iceberg"
  - "分区裁剪"
  - "增量读"
  - "Ray Data"
  - "数据湖"
type: "book"
---

## 2.1 源表 schema：该有哪些列

源表是整条流水线的入口，schema 设计直接决定后面能剪掉多少 IO。典型设计：

| 列 | 类型 | 作用 | 是否必选 |
|---|---|---|---|
| `id` | string / bigint | 行唯一标识，用于 join 与去重 | ✅ |
| `oss_path` | string | **OSS 上图片/视频的路径**（核心指针列） | ✅ |
| `media_type` | string | `image` / `video`，决定解码分支 | ✅ |
| `source` / `biz_line` | string | 业务来源，常作分区或过滤条件 | 推荐 |
| `collect_date` | date / timestamp | 采集时间，**最常用的分区列** | ✅ |
| `width` / `height` / `duration` / `size_bytes` | int / long | 媒体元信息，用于预估解码成本与过滤坏文件 | 推荐 |
| `status` | string | 处理状态（pending / done / failed），幂等关键 | 推荐 |
| `extra_meta` | struct / map / json | 业务扩展字段 | 可选 |

**三条设计原则**：

1. **`oss_path` 用相对路径还是绝对 URI**：建议存**绝对 URI**（`oss://bucket/...`），简单直接；若未来有跨云迁移需求，可存相对路径 + 表级 base location（Iceberg v4 正在支持相对路径，届时"零重写搬迁"会更优雅）。
2. **把"能过滤的维度"提前成列**：不要全塞进 `extra_meta`——过滤字段必须是顶层列才能谓词下推。
3. **媒体元信息单独成列**：`size_bytes` / `duration` 让你在**解码前**就能过滤掉超大文件、坏文件，省掉最贵的那一步。

## 2.2 分区策略：按什么切

分区决定了"一次任务最少要扫多少数据"。本场景推荐：

| 分区方式 | 适用 | 说明 |
|---|---|---|
| `days(collect_date)` 或 `hours(...)` | **最常用** | 天然适配"按天/按小时增量处理" |
| `identity(source)` | 多业务线混表 | 只处理某个来源时裁剪效果好 |
| 分区 + **Z-order**（按 id / source） | 大表精修 | 提升非分区列的聚簇性，配合文件级 min-max 裁剪 |

**注意别过度分区**：分区太多会产生大量小文件，反过来拖慢 planning（元数据膨胀）。按天分区对绝大多数离线批处理够用；只有单天数据量极大时才下沉到小时。

## 2.3 读取优化三板斧

离线批处理里，读表本身常常占掉可观的时间。三件事必做：

**① 列投影（Projection）**——只读需要的列

```python
# 只投影必要列，不要 SELECT *
ds = read_iceberg(table, columns=["id", "oss_path", "media_type", "size_bytes"])
```

**为什么重要**：`oss_path` 是字符串列，通常压缩率高、体积小，但如果整表还有 embedding、原始 meta 等大列，全投影会让 IO 翻倍。只投需要的列 = 直接省 IO。

**② 谓词下推（Filter Pushdown）**——把过滤下推到文件级

```python
ds = read_iceberg(table,
                  columns=[...],
                  filter="media_type = 'image' AND size_bytes < 50000000")
```

Iceberg 的 manifest 里有每个文件的**列级 min-max 统计**，能在 planning 阶段就跳过整个文件，连 Parquet footer 都不用打开。

**③ 分区裁剪**——带上分区列条件

```python
filter="collect_date >= '2026-09-01' AND collect_date < '2026-09-18'"
```

三者叠加，实际扫描量通常能降到全表的百分之几。

## 2.4 增量读：本场景最大的一个优化点

**反面做法**：每次跑批都全量扫源表。十亿行表里新增了 100 万行，却要重扫十亿行——浪费 99.9% 的 IO 和算力。

**正确做法**：利用 Iceberg 的**增量扫描（incremental scan）**，只读两个快照之间新增/变化的行。

```text
上次处理到 snapshot S_prev
本次处理时表已推进到 snapshot S_curr
→ 只读 (S_prev, S_curr] 之间的新增行
```

实现方式（取决于所用引擎/库，概念一致）：

- **PyIceberg**：`table.incremental_scan(between=(S_prev, S_curr))` 类接口（具体 API 以版本文档为准）
- **Spark**：`spark.read.format("iceberg").option("start-snapshot-id", S_prev).option("end-snapshot-id", S_curr).load(...)`
- **Trino / Flink / Daft**：各有对应增量读语法

**配套动作（必须做）**：把本次处理到的 `S_curr` **持久化**下来（写进目标表的一张"水位表"，或作为 MLflow run 的 tag/param），下次从它继续。否则下次又得全量扫。

```python
mlflow.set_tags({
    "iceberg_start_snapshot": S_prev,
    "iceberg_end_snapshot": S_curr,     # ← 下次从这里继续
})
```

配合 `status` 列做幂等：处理完成的行标记 `done`，失败标记 `failed` 下轮重试，避免重复算。

## 2.5 Ray Data 怎么读 Iceberg（三种接法）

Ray Data 读 Iceberg 没有"唯一标准答案"，取决于你的 Ray 版本与生态组件。常见三种：

| 接法 | 做法 | 优点 | 注意 |
|---|---|---|---|
| **① 原生 / 生态库直读** | 若所用 Ray 版本提供 Iceberg 读取接口（或借助 Ray 生态的分布式 DataFrame，如 Daft 的 `read_iceberg`） | 一跳到位，直接产出 Ray Dataset | 以所用版本文档为准，确认是否支持增量读与谓词下推 |
| **② PyIceberg 读 → 转 Ray Dataset** | 先用 PyIceberg 扫描出 Arrow/Parquet，再 `ray.data.from_arrow(...)` | 最可控，能精确拿到 snapshot 语义 | 多一次转换；超大结果集注意别全量 collect 到 driver |
| **③ 导出 Parquet 再读** | 用 Spark/Trino 把增量导出成 Parquet，再 `ray.data.read_parquet()` | 兼容性最好 | **多一跳，多一份存储**，不推荐作为常态 |

**实践建议**：

- 优先试 ①（少一跳）；
- 需要精确控制 snapshot / 增量语义时用 ②；
- ③ 只作为临时兜底（比如引擎版本不支持时）。

无论哪种，**读进来第一件事通常是 `repartition`**——Iceberg 的规划块可能很大，直接进推理会产生超大任务（详见第 6 章）。

## 2.6 小文件与 compaction

源表如果由高频写入（流式入湖）产生，容易堆积大量小 Parquet 文件，后果：

- planning 变慢（要打开成百上千个 manifest）
- 每个小文件都要一次对象存储打开，IO 次数暴涨
- Ray Data 侧任务粒度失衡（一堆极小的块）

**对策**：

- 定期跑 Iceberg 的 **compaction / rewrite_data_files**，把小文件合并成目标大小（通常 128 MiB–512 MiB 一个文件）
- 对极高写入频率的表，控制 commit 间隔（别秒级提交）
- 监控"平均文件大小"和"文件数/快照数"，作为例行维护指标

## 2.7 目标表设计：结果列 + 溯源列

结果写回的目标表，除了业务结果，必须带**溯源列**——这是数据闭环能"闭环"的关键：

| 列 | 说明 |
|---|---|
| `id` | 关联源表 |
| `caption` | 推理结果（核心产出） |
| `valid` / `reject_reason` | 质量过滤结果 |
| **`model_name`** | 用的哪个模型 |
| **`model_version`** | 模型版本（来自 MLflow Registry） |
| **`mlflow_run_id`** | 本次 MLflow run（回溯参数与指标） |
| **`source_snapshot_id`** | 源表快照（数据版本） |
| `processed_at` | 处理时间 |

有了这几列，任何一条 caption 都能反查回去：**是哪个模型、哪次运行、基于哪份源数据生成的**。这正是第 8 章血缘治理的基础。

## 2.8 本章小结

- 源表 schema 要让"能过滤的维度"成为顶层列，媒体元信息（size/duration）单独成列以便解码前过滤。
- 读取三板斧：**列投影 + 谓词下推 + 分区裁剪**，叠加后通常只扫全表的百分之几。
- **增量读是本场景最大的优化点**：只读快照差量，并把水位（snapshot id）持久化。
- Ray Data 读 Iceberg 有三类接法，优先原生/生态直读，需精确快照语义时用 PyIceberg 转换。
- 源表要定期 compaction 控小文件；目标表必须带 **model_version / run_id / source_snapshot_id** 溯源列。
