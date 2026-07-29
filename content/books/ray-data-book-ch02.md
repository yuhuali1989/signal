---
title: "Ray Data 引擎：从 2.10 到 2.5x - 第2章: 核心抽象 Dataset 与 Block"
book: "Ray Data 引擎：从 2.10 到 2.5x"
chapter: "2"
chapterTitle: "核心抽象：Dataset 与 Block"
description: "理解 Ray Data 的用户面 Dataset（惰性 API）与底层 Block（Arrow/Pandas、1–128MiB 目标、192MiB 分裂），以及 Dataset 如何在 Object Store 中以 ObjectRef 流转"
date: "2026-07-29"
updatedAt: "2026-07-29"
agent: "研究员→编辑→审校员"
tags:
  - "Dataset"
  - "Block"
  - "Arrow"
  - "惰性执行"
  - "ObjectRef"
type: "book"
---

# 第 2 章：核心抽象——Dataset 与 Block

> **学习目标**：搞清楚用户面对的 `Dataset` 是什么（惰性、链式 API），底层真正传输与存储的单位 `Block` 长什么样（Arrow 表、目标 1–128MiB、超 192MiB 自动分裂），以及 Dataset 如何用 ObjectRef 在 Ray 的共享内存里流转。

---

## 2.1 Dataset：用户面的「惰性集合」

`ray.data.Dataset` 是面向用户的主要 API，代表一个 **分布式数据集合**。典型用法三步走：

```python
import ray
ds = ray.data.read_parquet("s3://bucket/train/")   # 1. 从外部存储创建
ds = ds.map_batches(transform, batch_size=1024)     # 2. 应用转换（惰性）
ds.write_parquet("s3://bucket/out/")                # 3. 落盘 / 喂给训练
```

两个关键性质：

1. **Lazy（惰性）**：`read_*` / `map_*` / `filter` 等只是「记录执行计划」，**不会真正算**。只有遇到 *sink* 操作才触发——`show()`、`iter_batches()`、`write_*`、`materialize()`。这点和 Java Stream API 一致。
2. **链式可优化**：因为计划是延迟执行的，Ray Data 有机会先做计划优化（如算子融合）再跑。

> 例外：`union()`、`limit()` 等少数 API 会立即触发执行；具体看每个方法的 API 文档注记。

---

## 2.2 Block：真正传输与存储的单位

`Block` 是 Ray Data 在对象存储中存储、在网络中传输的 **基本数据批量单元**。每个 Block 是数据集里「互不相交的一批行」。

- 一个 Dataset 被切成若干 Block，**并行、独立地处理每个 Block**。
- Block 底层是 **列式格式**：优先 Apache Arrow Table；当 Arrow 无法表示（如复杂嵌套对象）时退化为 pandas DataFrame。
- Dataset 的「目录信息」（有哪些 block、schema）留在触发执行的进程（通常是 driver），但 **每个 Block 的实际数据存在 Ray 的分布式共享内存 Object Store 里**，Dataset 只持有它们的 `ObjectRef`。

```
Dataset (driver 上的元数据)
  ├─ ObjectRef → Block0 (Arrow, 1000 rows)  [Object Store 节点A]
  ├─ ObjectRef → Block1 (Arrow, 1000 rows)  [Object Store 节点B]
  └─ ObjectRef → Block2 (Arrow, 1000 rows)  [Object Store 节点A]
```

> 这意味着 Dataset 对象本身很轻：driver 只握引用，数据散在集群。删除所有 Python 引用 → 引用计数归零 → 内存释放（见第 5 章）。

---

## 2.3 块大小：一门平衡艺术

块太大或太小都会出问题。Ray Data 对块大小有默认约束（来自官方内部原理文档）：

- **目标区间：1 MiB – 128 MiB**。
- **分裂阈值：超过 192 MiB（目标上限的 1.5 倍）时，动态把块切成更小的块**。

为什么有这样的窗口？

| 块大小 | 优点 | 缺点 |
|---|---|---|
| 小（< 几十 MiB） | 延迟低、流式更顺、OOM 风险小 | 调度/通信开销大 |
| 大（接近 128MiB） | 调度/通信开销小、吞吐高 | 延迟高、内存峰值大、流式卡顿 |

> 实践提示：传统 ML 任务（行式样本）这个窗口很舒服；但 **多模态（视频/大图/embedding）单条样本就很大**，老窗口会导致「块大小爆炸（block size explosion）」——这正是 Ray 2.51 引入 `download` 表达式（第 7 章）要解决的问题。

---

## 2.4 一个能跑的端到端例子

```python
import ray
import numpy as np

# 1. 读 CSV（惰性，只建计划）
ds = ray.data.read_csv("s3://anonymous@air-example-data/iris.csv")

# 2. 定义批次转换（map_batches 接收 pandas/Arrow batch）
def transform_batch(batch: dict) -> dict:
    vec_a = batch["petal length (cm)"]
    vec_b = batch["petal width (cm)"]
    batch["petal area (cm^2)"] = vec_a * vec_b
    return batch

transformed = ds.map_batches(transform_batch)

# 3. 触发执行（sink）
transformed.show(limit=1)
```

打印 `transformed` 能看到逻辑计划：
```
MapBatches(transform_batch)
+- Dataset(schema={...})
```
执行时才翻译成物理计划并流式跑。

---

## 2.5 为什么「列式 + 块」适合 AI

- **列式（Arrow）**：tokenize、归一化、特征提取往往按列操作，Arrow 零拷贝切片比逐行快得多；也能被 pandas/numpy 直接消费。
- **块级并行**：每块独立，天然映射到 Ray Task/Actor；失败重试以块为单位，粒度细。
- **与 GPU batch 对齐**：`map_batches` 直接产出定长 batch 喂给 GPU worker，避免「每样本一次 kernel 启动」的低效（呼应本站《GPU 工作原理与并发模型》第 3–4 章的占用率/并发思想）。

---

## 2.6 本章小结

- `Dataset` 是惰性、链式的用户面 API；真正计算延迟到 sink 才发生，给优化留空间。
- `Block` 是底层单位：Arrow 表为主、pandas 为辅，目标 1–128MiB，超 192MiB 自动分裂。
- Dataset 只持有 `ObjectRef`，数据在 Ray Object Store 分布式存储——轻目录、重数据。
- 块大小的平衡直接决定延迟/吞吐/OOM，是多模态场景的关键调优点。

下一章进入全书核心：**执行模型**——逻辑计划如何变成物理计划、流式执行如何运作、算子融合如何减少序列化。

---

## 参考与延伸

- Ray Docs: *Key Concepts*（Datasets and blocks）
- Ray Docs: *Ray Data Internals*（Plans, Operators, Streaming execution）
- CSDN《Ray Data 源码分析系列(13)》对 Block/ObjectRef 的中文图解
