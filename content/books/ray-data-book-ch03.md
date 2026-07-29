---
title: "Ray Data 引擎：从 2.10 到 2.5x - 第3章: 执行模型"
book: "Ray Data 引擎：从 2.10 到 2.5x"
chapter: "3"
chapterTitle: "执行模型：逻辑计划 → 物理计划 → 流式执行"
description: "拆解 Ray Data 的两阶段规划：LogicalPlan 描述做什么、PhysicalPlan 描述怎么做；ReadOp 如何展开为 InputDataBuffer+TaskPoolMapOperator；OperatorFusionRule 融合 map 算子减少序列化；流式执行 vs 批量同步执行的差异"
date: "2026-07-29"
updatedAt: "2026-07-29"
agent: "研究员→编辑→审校员"
tags:
  - "LogicalPlan"
  - "PhysicalPlan"
  - "算子融合"
  - "流式执行"
  - "Planner"
type: "book"
---

# 第 3 章：执行模型——逻辑计划 → 物理计划 → 流式执行

> **学习目标**：理解 Ray Data 的「两阶段规划」——你写的代码先变成逻辑计划（做什么），执行时才变成物理计划（怎么做），其间经过算子融合等优化；并搞清「流式执行」与「批量同步执行」的本质区别。

---

## 3.1 两阶段规划：写代码 ≠ 跑计算

当你链式调用 `read_parquet().map().filter().map_batches()` 时，Ray Data 在背后维护两层计划：

```
你写的代码
   │  (构建期)
   ▼
LogicalPlan  ── 逻辑算子序列：ReadOp → MapOp → FilterOp → MapBatchesOp
   │  (执行开始，Planner 翻译 + 优化)
   ▼
PhysicalPlan ── 物理算子序列：InputDataBuffer → TaskPoolMapOperator → ...
   │  (StreamingExecutor 调度)
   ▼
在集群上真正跑起来的 Ray Task / Actor
```

- **LogicalPlan**：由「逻辑算子（Logical Operator）」组成，无状态，只描述 **做什么**（如 `ReadOp` 说「要读这些数据」）。
- **PhysicalPlan**：由「物理算子（Physical Operator）」组成，有状态，描述 **怎么做**（如 `TaskPoolMapOperator` 真正启动 Ray Task 去读）。

---

## 3.2 一个 ReadOp 展开成两个物理算子

规划器（Planner）把逻辑算子翻译成一个或多个物理算子。典型例子——**`ReadOp` → `InputDataBuffer` + `TaskPoolMapOperator`**：

- `InputDataBuffer`：占位，代表「输入数据的来源」（本身不启动任务）。
- `TaskPoolMapOperator`：真正启动 Ray Task，把数据读进来变成 Block 流。

这说明：**逻辑与物理不是一一对应**，一个逻辑算子可能展开成多个物理算子；反之多个逻辑 map 也可能被「融合」成一个物理算子（见 3.4）。

---

## 3.3 计划优化：算子融合（Operator Fusion）

Ray Data 对逻辑/物理计划都会跑优化 pass。最关键的一条规则是 **`OperatorFusionRule`**：把一串相邻的物理 map 算子合并成 **单个** map 算子。

为什么重要？

```
未融合：MapA ──(序列化 Block)──> MapB ──(序列化 Block)──> MapC
融合后：Fused(MapA+MapB+MapC)   ← 中间不再序列化/落 Object Store
```

- 融合后，**中间 Block 不写回 Object Store、不在算子间序列化**，直接在同一批 worker 内连续处理。
- 减少调度开销、减少对象存储压力、降低延迟。
- 融合通常对「上游 map-like 算子」有效；`shuffle` 类算子（sort/groupby/join）会打断融合。

> 调试技巧：看 Dataset stats，融合的算子会显示成 `Read->MapBatches` 连写形式；若想强制分开（比如要不同资源档位），用不同的 `compute`/`num_cpus` 参数即可阻止融合。

---

## 3.4 惰性执行的红利

因为一切都是惰性、计划化的，Ray Data 能在真正跑之前做全局优化：

1. **算子融合**（3.3）。
2. **激进的垃圾回收**：中间结果用过即释放，内存更稳。
3. **全局资源估计**：2.10 起强化「运行时资源估计」，为逐算子预留资源打基础（第 5 章）。

> 对比 eager 框架：如果每步都立即算，上面这些跨算子优化就不可能做——这正是 Ray Data 选惰性 + 计划的根本原因。

---

## 3.5 流式执行 vs 批量同步执行

这是 Ray Data 性能模型的基石。

**批量同步（Bulk / BSP）**：等算子 A 全部算完，再把整体结果交给算子 B。简单但：
- 必须能容下「整个数据集的中间结果」→ 大数据集 OOM。
- GPU 在 B 跑之前、A 收尾时可能空转。

**流式（Streaming）**：每个算子 **接收并输出「Block 流」**，上下游并发跑：

```
Read ──block──> Map(cpu) ──block──> Map(gpu) ──block──> Write
  (持续产出)      (边收边算)          (边收边算)        (边收边写)
```

好处：
- **处理远超内存的数据集**（Block 流过即弃）。
- **算子间重叠执行**：读数据的同时 GPU 在算、结果在写，GPU 利用率高。
- 对 **非 shuffle 算子** 特别有效；`sort/groupby/join` 这类需要全局重排的算子仍要物化（materialize），会暂停流式直到 shuffle 完成。

> 实际中 Ray Data 默认就是流式执行。想看每个算子的实时进度，设 `ctx.execution_options.verbose_progress = True`（或环境变量 `RAY_DATA_VERBOSE_PROGRESS=1`），日志会打印类似：
> `Executing DAG InputDataBuffer[Input] -> TaskPoolMapOperator[Read] -> ActorPoolMapOperator[MapBatches]`

---

## 3.6 本章小结

- 两阶段规划：LogicalPlan（做什么）→ PhysicalPlan（怎么做），Planner 翻译。
- `ReadOp = InputDataBuffer + TaskPoolMapOperator` 是「一对多展开」的典型。
- `OperatorFusionRule` 融合相邻 map 算子，省掉中间序列化与 Object Store 写入。
- 惰性 + 计划 = 全局优化空间；流式执行让超大数据集与高 GPU 利用率兼得。

下一章进到执行引擎的「心脏」：**StreamingExecutor 的调度循环、物理算子家族、SPREAD 调度策略与训练场景的 SplitCoordinator**。

---

## 参考与延伸

- Ray Docs: *Ray Data Internals*（Plans / Plan optimization / Streaming execution）
- Ray GitHub: `streaming_executor.py` 调度循环源码
