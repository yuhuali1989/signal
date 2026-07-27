---
title: "GPU 工作原理与并发模型 - 第4章: GPU 并发模型"
book: "GPU 工作原理与并发模型"
chapter: "4"
chapterTitle: "GPU 并发模型：硬件如何同时推进成千上万线程"
description: "拆解 warp 调度器、双发射、延迟隐藏与占用率的关系，并讲解软件层并发：CUDA Streams、事件、Hyper-Q 与 Cooperative Groups"
date: "2026-07-27"
updatedAt: "2026-07-27"
agent: "研究员→编辑→审校员"
tags:
  - "并发模型"
  - "warp 调度器"
  - "延迟隐藏"
  - "CUDA Stream"
  - "Hyper-Q"
type: "book"
---

# 第 4 章：GPU 并发模型——硬件如何同时推进成千上万线程

> **学习目标**：理解 GPU 的并发是「硬件级延迟隐藏」与「软件级流并行」的两层叠加；掌握 warp 调度器如何选 warp、Streams 如何让多个 kernel 重叠执行、Hyper-Q 如何消除虚假串行。

---

## 4.1 并发的真相：不是「同时算」，而是「永不空转」

先澄清一个常见误解：**GPU 并不是让所有线程在同一纳秒「一起算」**。受 warp 限制，真正物理上同时执行的指令数受限于执行单元宽度。GPU 的「并发」本质是：

> **当一个 warp 因访存而停顿，调度器立刻切到另一个就绪 warp 发射指令，使执行单元尽量不空转。**

这种「用并行掩盖延迟」的机制，叫 **延迟隐藏（latency hiding）**，是 GPU 并发模型的核心。

---

## 4.2 Warp 调度器：每周期选谁上

回顾第 2 章：一个 SM 有 **4 个 warp 调度器**，每周期每个调度器可以 **发射 1~2 条指令**（dual-issue）到执行单元。

调度逻辑（简化）：
1. 维护一个「就绪 warp 池」（记分板 scoreboard 记录哪些 warp 在等依赖/内存）。
2. 每周期从就绪池挑选 warp，发射其下一条指令。
3. 若某 warp 的指令依赖未就绪（如内存未返回），标记为「停顿」，跳过它。

```text
周期: 1    2    3    4    5
W0 : LD   (等) (等) (等) ADD  ...   ← 访存停顿
W1 :      FMA  FMA  FMA  FMA  ...   ← 调度器切到这里
W2 :      FMA  FMA  (等) FMA  ...
```

只要就绪 warp 足够多，执行单元的流水线就一直满 —— 这就是「同时推进成千上万线程」的真实现象。

> 深度洞察：**GPU 的并发度是「warp 数量级」的，不是「线程数量级」的语义并发**。一个 SM 上可能驻留 64 个 warp（2048 线程），但每周期只发射其中少数几个的指令。

---

## 4.3 双发射与指令类型配对

Ampere/Hopper 的调度器支持 **dual-issue**：同一周期发射两条「类型互补」的指令（如一条 FP 运算 + 一条 Load/Store，或两条独立 FP）。这要求编译器把指令排成可配对的序列。

对程序员的启示：**kernel 里混合「计算」与「访存」的代码，更容易被双发射吃满**。纯计算或纯访存都会让一半发射槽浪费。

---

## 4.4 占用率与并发度的关系（再谈）

第 3 章讲了占用率定义。这里给出它和并发的直接联系：

- 设一次内存访问延迟 ≈ 200 周期（HBM 量级）。
- 要把这 200 周期「藏起来」，需要 **至少约 200 / 每 warp 指令数** 个就绪 warp 轮流上。
- 若每 warp 每周期发 1 条指令，约需 **数十个 warp** 才能掩盖；占用率低（如只有 4 个 warp/SM）必然空转。

> 经验法则：**对访存密集 kernel，追求高占用率；对计算密集 kernel，关注每线程寄存器/指令吞吐**。用 NVIDIA Nsight Compute 的 `Achieved Occupancy` 与 `Memory Bound` 指标定位瓶颈。

---

## 4.5 软件层并发：CUDA Streams

硬件并发之上，CUDA 提供 **Stream（流）** 来组织「任务序列」。

- **Stream** 是一条「按顺序执行」的 kernel/拷贝命令队列。
- **不同 Stream 之间默认可以并发**（在资源允许时重叠执行）。
- 两个 Stream 之间可用 **Event（事件）** 建立依赖。

```cuda
cudaStream_t s1, s2;
cudaStreamCreate(&s1); cudaStreamCreate(&s2);

kernelA<<<grid, blk, 0, s1>>>();   // 流 s1
kernelB<<<grid, blk, 0, s2>>>();   // 流 s2（可与 s1 重叠）

cudaEvent_t e;
cudaEventRecord(e, s1);
kernelC<<<grid, blk, 0, s2>>>(e);  // 等 s1 的 event 后再跑，跨流同步
```

**经典收益：计算与拷贝重叠（H2D/D2H 与 kernel 并发）**：

```cuda
// 边把下一块数据拷进 GPU，边算上一块
cudaMemcpyAsync(d_a+off, h_a+off, bytes, cudaMemcpyHostToDevice, s);
kernel<<<..., s>>>(d_a+off);
```

---

## 4.6 Hyper-Q：消除「虚假串行」

在 Kepler（2012）之前，GPU 只有 **1 个硬件工作队列**。即使你开了多个 Stream，它们也被「合并」进一个队列，**彼此被迫串行**——这就是 **虚假串行（false serialization）**：你以为并行，其实硬件在排队。

**Hyper-Q** 引入了 **多个（如 32 个）硬件工作队列**，让来自不同 Stream、不同 CPU 线程、甚至不同进程的提交可以真正并行进入 GPU，互不阻塞。

```text
旧： CPU线程A \                      / 单队列 → GPU
     CPU线程B  → 合并成 1 个队列 →
     CPU线程C /                      \

新(Hyper-Q)： CPU线程A ─→ 队列1 ┐
             CPU线程B ─→ 队列2 ──→ 并行进入 GPU
             CPU线程C ─→ 队列3 ┘
```

> Hyper-Q 是「多进程/多线程共享 GPU」能高效工作的前提之一（第 6、7 章大量用到）。

---

## 4.7 Cooperative Groups 与跨 Block 同步

默认情况下，一次 kernel 内 **block 之间不能同步**（因为 block 可能在还没启动的 SM 上，互相等会死锁）。

**Cooperative Groups** 打破了这个限制：
- `thread_block()`：等价 `__syncthreads` 的块内同步。
- `grid_group.sync()`：**整个 grid（所有 block）一起屏障同步**，需以 `cudaLaunchCooperativeKernel` 启动。

```cuda
extern __shared__ int scratch[];
__global__ void cooperativeKernel(...) {
    auto grid = cooperative_groups::this_grid();
    // ... 所有 block 都到齐后才继续
    grid.sync();
}
```

这在「全 grid 归约」「多 block 协同写同一结果」等场景很有用，也是后续多进程协作（第 7 章）的思想来源。

---

## 4.8 本章小结

- GPU 并发 = **硬件延迟隐藏**（warp 调度器切换就绪 warp）+ **软件流并行**（Streams / Hyper-Q）。
- 每 SM 4 个调度器、支持双发射，靠「就绪 warp 够多」让流水线不空转。
- **Streams + Events** 组织任务并行与依赖；**Hyper-Q** 让多源提交真正并行，消除虚假串行。
- **Cooperative Groups** 把同步从 block 级提升到 grid 级。

至此，我们讲完了「单进程内」的 GPU 工作原理与并发。真正有趣也最容易踩坑的，是 **多个进程共享同一块 GPU**——第 5 章先补完内存层次的并发细节，第 6、7 章进入多进程主题。
