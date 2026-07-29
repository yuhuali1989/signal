---
title: "Ray Data 引擎：从 2.10 到 2.5x - 第4章: 执行引擎实现细节"
book: "Ray Data 引擎：从 2.10 到 2.5x"
chapter: "4"
chapterTitle: "执行引擎实现细节：调度循环、物理算子与 SPREAD 策略"
description: "深入 StreamingExecutor 的调度循环（等输出→移动队列→选算子，条件：有输入/有资源/未反压，最小输出队列优先）；物理算子家族 MapOperator/TaskPool/ActorPool/OutputSplitter/Limit；SPREAD vs DEFAULT 调度策略；训练场景的 SplitCoordinator"
date: "2026-07-29"
updatedAt: "2026-07-29"
agent: "研究员→编辑→审校员"
tags:
  - "StreamingExecutor"
  - "调度循环"
  - "背压"
  - "SPREAD"
  - "SplitCoordinator"
type: "book"
---

# 第 4 章：执行引擎实现细节——调度循环、物理算子与 SPREAD 策略

> **学习目标**：理解 StreamingExecutor 每一步在干什么、物理算子有哪几类、Ray Data 如何用 Ray Core 做调度（SPREAD/DEFAULT），以及训练场景下为什么有个特殊的 SplitCoordinator Actor。

---

## 4.1 Executor 与 Operator 在哪运行

先厘清「谁在哪」：

- **Executor（执行器）** 和 **物理算子** 位于「数据集执行启动的进程」：
  - 批推理任务 → 通常在 **driver**。
  - 训练任务 → 跑在一个叫 **SplitCoordinator** 的特殊 Actor 上（负责 `streaming_split()`，见 4.5）。
- **算子启动的 Ray Task / Actor** 被调度到 **整个集群**，输出存在 Ray 分布式 Object Store。
- 关键点：Executor **只操作 ObjectRef（引用）**，从不上拉底层数据到自身——数据始终留在 Object Store，靠引用在算子间流动。

> 每个物理算子都有一个 **out queue（输出队列）**。算子产出 Block 引用后，Executor 把它移到该算子的 out queue，下游再取走。

---

## 4.2 调度循环：StreamingExecutor 的核心

Executor 跑一个循环，每一步：

1. **等**：等待正在跑的 Task / Actor 有新输出。
2. **移**：把新输出移到对应算子的 out queue。
3. **选**：挑若干算子，给它们分配新输入（启动新 Task 或只操作元数据）。

一个算子能被调度，必须同时满足三条件：

- 有输入（in queue 非空）；
- 有足够可用资源；
- **没有被反压（backpressure）**。

当有多个「可行算子」时，Executor 选 **out queue 最小** 的那个——这是背压感知的核心：谁的产出最少、最「饿」，就先喂谁，避免下游积压。

> 这套「最小输出队列优先 + 反压门控」的循环，是 Ray Data 能在异构、不可预测负载下保持稳定的关键。它和 GPU 的 warp 调度器「选就绪 warp 发射」思想异曲同工（见《GPU》第 4 章）——都是「就绪即调度、靠切换隐藏等待」。

---

## 4.3 物理算子家族

| 物理算子 | 作用 | 是否启动 Task/Actor |
|---|---|---|
| `InputDataBuffer` | 占位输入源 | 否 |
| `TaskPoolMapOperator` | 用 **Ray Task 池** 跑 map（无状态函数） | 是（Task） |
| `ActorPoolMapOperator` | 用 **Ray Actor 池** 跑 map（有状态 worker，如加载好的模型） | 是（Actor） |
| `OutputSplitter` | 把输出拆给多个消费者（训练多 worker） | 否（只搬引用） |
| `LimitOperator` | `limit()` 截断 | 否（只搬引用） |

**MapOperator 是绝对主力**：所有 read / transform / write 都用它实现，区别只在底层用 Task 还是 Actor。

- `compute=ray.data.ActorPoolStrategy(size=2)` → `ActorPoolMapOperator`（适合要常驻状态的，如加载大模型做批推理）。
- 默认无状态函数 → `TaskPoolMapOperator`（任务粒度轻、可弹性扩缩）。

```python
# 用 Actor 池跑批分类（模型常驻，避免每 batch 重载）
ds = ds.map_batches(
    ClassificationModel,
    compute=ray.data.ActorPoolStrategy(size=2),
    batch_size=64, batch_format="pandas", num_gpus=1
)
```

---

## 4.4 底层调度：SPREAD vs DEFAULT

Ray Data 用 Ray Core 调度。策略摘要（来自官方内部原理）：

- **SPREAD 策略**：把 Block 与 map 任务 **均匀打散到集群**，保证负载均衡。
  - **读取操作一律用 SPREAD**。
  - map 操作：若「总参数大小 < 50 MB」→ SPREAD；否则 → DEFAULT。
- **DEFAULT 策略**：尊重 placement group / 默认 placement。
- 数据集任务 **默认忽略 placement groups**（除非显式指定）；split/sort/shuffle 用 DEFAULT。

> 含义：小的 map 闭包（参数 < 50MB）会被 SPREAD 均匀铺开，避免热点；大的（如传了大模型权重引用）则走默认放置，减少跨节点传参。这是「数据本地性」与「负载均衡」的权衡。

---

## 4.5 训练场景：SplitCoordinator

训练时，Ray Data 要把一份数据 **流式地、均匀地分给多个训练 worker**（如 FSDP/DDP 的 N 个 rank）。这靠 `streaming_split()` 实现，而执行器不在 driver，而在 **SplitCoordinator Actor**：

- SplitCoordinator 持有流式执行，把 Block 流 **切片** 分发给各训练 worker。
- 每个 worker 像消费普通迭代器一样拿到自己的那份 batch，且是「边产边消费」，训练与数据预处理重叠。

```python
# Ray Train 中的典型用法（概念示意）
def train_fn(config):
    ds = ray.data.read_parquet("s3://bucket/train/") \
            .map_batches(preprocess)
    for batch in ds.streaming_split(n=config["num_workers"],
                                    equal=True):
        train_one_step(batch)   # 每个 worker 拿到自己那份
```

这解决了分布式训练最经典的痛点：**数据摄取跟不上训练**，GPU 饿死。Ray Data 把摄取变成与训练并行的流。

---

## 4.6 本章小结

- Executor 只搬引用、不上拉数据；真正的 Task/Actor 跑在集群，数据留 Object Store。
- 调度循环三步骤 + 三条件（输入/资源/反压）+「最小 out queue 优先」= 背压感知的流式调度。
- 物理算子家族：`TaskPoolMapOperator`（无状态）/ `ActorPoolMapOperator`（有状态模型）/ `OutputSplitter` / `LimitOperator`。
- 调度策略：读必 SPREAD；小 map（<50MB）SPREAD，大 map DEFAULT。
- 训练用 `SplitCoordinator` + `streaming_split` 把数据流式均分给 worker，摄取与训练重叠。

下一章讲「稳定性」：内存怎么管、背压怎么防止 OOM、2.10 的逐算子资源预留与 2.51 的块大小爆炸治理。

---

## 参考与延伸

- Ray Docs: *Ray Data Internals*（Execution / Scheduling / Memory Management）
- Ray Docs: *Key Concepts*（Streaming execution model）
