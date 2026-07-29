---
title: "Ray Data 引擎：从 2.10 到 2.5x - 第5章: 内存、背压与稳定性"
book: "Ray Data 引擎：从 2.10 到 2.5x"
chapter: "5"
chapterTitle: "内存、背压与稳定性"
description: "剖析执行内存（worker 堆 + Object Store 共享内存）、对象溢出/本地性调度/引用计数三大机制，背压如何防止 OOM，2.10 的逐算子资源预留，以及 2.51 治理块大小爆炸的 download 表达式"
date: "2026-07-29"
updatedAt: "2026-07-29"
agent: "研究员→编辑→审校员"
tags:
  - "内存管理"
  - "对象溢出"
  - "背压"
  - "ref-counting"
  - "块大小爆炸"
type: "book"
---

# 第 5 章：内存、背压与稳定性

> **学习目标**：搞清楚 Ray Data 执行时内存在哪、为什么会 OOM、Object Store 的三件套（溢出/本地性/引用计数）如何兜底，以及背压（backpressure）与逐算子资源预留怎么保证稳定。最后看 2.51 如何治理多模态下的「块大小爆炸」。

---

## 5.1 执行内存：两块账

执行中，一个 Task 可能读多个输入 Block、写多个输出 Block。这些 Block 占两类内存：

1. **Worker 堆内存（heap）**：Task 计算过程里的 Python 对象、反序列化等。
2. **Object Store 共享内存**：Block 作为 Ray 对象存放处（通过 `/dev/shm` 类共享内存）。

Ray 能 **把 Object Store 内存溢出（spill）到磁盘** 来限流；但 **worker 堆内存无法 spill**——堆用超了就是 OOM。所以「省内存」主要省堆。

> 实践铁律：**尽量让数据以 Arrow Block 待在 Object Store，别在 Python 层 unpack 成巨大 list/dict**。一旦进 Python 堆又大，OOM 风险陡增。

---

## 5.2 Object Store 的三大兜底机制

Ray Data 复用 Ray Object Store，因此白捡三个能力：

### 5.2.1 对象溢出（Object Spilling）
放不进 Object Store 内存的 Block **自动落盘**，下游需要时自动 reload。让「数据集 > 集群内存」成为可能（配合流式执行）。

### 5.2.2 本地性调度（Locality Scheduling）
Ray 优先把计算 Task 调度到 **已经持有该对象本地副本的节点**，减少跨节点搬数据。对「读一次、多处用」的 Block 尤其重要。

### 5.2.3 引用计数（Reference Counting）
只要还有 Dataset 引用某 Block，它就存活；**删掉所有 Python 引用 → 计数归零 → 立即释放**。所以「释放内存」= 删掉 Dataset 对象引用，而不是主动调 `free`。

```python
ds = ray.data.read_parquet(...)   # 持有引用，占内存
del ds                            # 引用归零，Block 可被回收
```

---

## 5.3 背压：流式的「刹车」

回顾第 4 章：Executor 调度循环里，算子若「被反压」就 **不再分配新输入**。背压来自哪？

- 某算子的 **out queue 满了**（下游消费不及）→ 它自己变成上游的瓶颈 → 上游被反压。
- 资源紧张（CPU/GPU/Object Store 内存不足）→ 无法再启 Task。

背压的好处：**自动把生产速率压到消费速率**，避免无限堆积把内存撑爆。代价是吞吐可能暂时下降——但比 OOM 崩溃强。

> 这与 GPU 并发模型里的「占用率受资源约束」同理：资源不够就不发射，系统稳而不崩。Ray Data 把这套思想搬到了数据层。

---

## 5.4 2.10 的逐算子资源预留

Ray 2.10 在 GA 时重点强化了 **per-operator resource reservation（逐算子资源预留）** 与 **运行时资源估计**：

- 给每个算子预留一部分执行资源，避免「某算子偷偷吃光资源、饿死其他算子」。
- 运行时更准地估计「这个 map 到底要多少内存/CPU」，提前做容量规划。

这正是 GA 能「用于生产」的底层保障：以前流式执行偶发内存爆炸，2.10 之后显著收敛。

---

## 5.5 2.51 治理「块大小爆炸」

多模态（图片/视频/embedding）场景有个经典坑：原本一行样本很小，但 **在 map 里下载大文件/解码大图后，单 Block 体积暴涨**（block size explosion），直接冲破 128MiB 窗口、甚至触发 192MiB 分裂，调度与内存全乱。

Ray 2.51 的解法：**`download` 表达式**（声明式下载），而不是让用户手写 `map(download_image)`：

```python
# 旧：手动 map 下载，需自己 repartition、易成瓶颈
ds = (ray.data.read_parquet(INPUT)
        .repartition(NUM_PARTITIONS)
        .map(fn=download_image)
        .map(fn=deserialize_image)
        .map_batches(ResNetActor, num_gpus=1, concurrency=NUM_GPU_NODES))

# 新（2.51）：download 表达式，多线程高效下载 + 智能 URI 分区
ds = (ray.data.read_parquet(INPUT)
        .with_column("bytes", download("image_url"))
        .map(fn=deserialize_image)
        .map_batches(ResNetActor, num_gpus=1.0, concurrency=NUM_GPU_NODES)
        .materialize())
```

收益：下载与分区由引擎托管，吞吐最大化、避免手动 repartition 出错，块大小更可控。

---

## 5.6 稳定性 checklist

- 块大小落在 1–128MiB；多模态用 `download` 表达式防爆炸（2.51+）。
- 控制并发：`map_batches` 的 `concurrency`、read/map/write 的任务并发上限（2.10+ 支持）。
- 监控 Object Store 内存；必要时降低 batch_size 或并行度。
- 留意 shuffle 类算子（sort/groupby/join）会物化数据、暂停流式、吃内存——尽量推到管线末端。
- 调试开 `verbose_progress` 看每算子进度与 object_store_memory 占用。

---

## 5.7 本章小结

- 内存两块账：worker 堆（不可 spill，易 OOM）+ Object Store 共享内存（可 spill）。
- Object Store 三件套：溢出、本地性调度、引用计数 → 自动兜底与释放。
- 背压 = 流式的刹车，靠「out queue 满 / 资源紧」触发，防堆积防 OOM。
- 2.10 逐算子资源预留让流式生产可用；2.51 `download` 表达式治理块大小爆炸。

下一章看「数据从哪来、到哪去」：Ray Data 的格式与连接器，以及它如何无缝喂给 PyTorch/TF。

---

## 参考与延伸

- Ray Docs: *Ray Data Internals* → Memory Management
- Ray 2.10 / 2.51 Release Highlights（资源预留 / download 表达式）
