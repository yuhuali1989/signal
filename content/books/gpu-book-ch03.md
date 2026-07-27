---
title: "GPU 工作原理与并发模型 - 第3章: CUDA 执行模型"
book: "GPU 工作原理与并发模型"
chapter: "3"
chapterTitle: "CUDA 执行模型：线程是如何被组织的"
description: "理解 kernel / grid / block / thread 层次，warp 与 SIMT 执行、线程发散、线程同步与占用率，建立代码到硬件的映射"
date: "2026-07-27"
updatedAt: "2026-07-27"
agent: "研究员→编辑→审校员"
tags:
  - "CUDA"
  - "warp"
  - "SIMT"
  - "grid"
  - "block"
  - "occupancy"
type: "book"
---

# 第 3 章：CUDA 执行模型——线程是如何被组织的

> **学习目标**：把「一行 CUDA 代码」映射到「硬件上的 warp 执行」，理解 grid/block/thread 三层抽象、warp 的 lockstep 执行、分支发散的代价，以及占用率（occupancy）是什么。

---

## 3.1 三个层次的抽象

CUDA（Compute Unified Device Architecture）把并行组织成三层：

```
kernel 调用
 └─ Grid     （一次 kernel 启动 = 一个 grid）
     └─ Block × 若干   （block 是调度与协作的基本单位）
         └─ Thread × 若干  （单个线程，对应一个「线程逻辑」）
```

```cuda
dim3 gridDim(256);        // 256 个 block
dim3 blockDim(256);       // 每 block 256 个 thread
add<<<gridDim, blockDim>>>(d_a, d_b, d_c, N);
```

- **Thread**：执行 `add` 里那一段「只算一个元素」的代码，索引靠 `threadIdx` / `blockIdx` / `blockDim` 算出全局 `i`。
- **Block**：同一 block 内的线程 **共享共享内存、可以 `__syncthreads()` 同步**，且保证调度在同一个 SM 上。
- **Grid**：一次 kernel 启动的全部 block；block 之间 **默认不能同步**（除非用 Cooperative Groups，见 4.7）。

> 设计约束：**block 大小最好是 warp 大小（32）的整数倍**（如 128/256/512），否则最后一个 warp 不满，浪费算力。

---

## 3.2 Warp 与 SIMT 执行

硬件并不按「线程」调度，而是按 **warp**（NVIDIA = 32 线程，AMD = 64 = wavefront）调度。

- 一个 block 的线程被切成若干 warp（如 256 线程 = 8 个 warp）。
- **同一个 warp 的 32 个线程永远在执行同一条指令（lockstep）**，它们共享一个程序计数器。
- 这 32 个线程各有 **独立的寄存器**，所以数据可以不同；但 **指令必须一致**。

```cuda
// 每个 warp 内 32 个线程同步执行同一条指令
int i = blockIdx.x * blockDim.x + threadIdx.x;
c[i] = a[i] + b[i];   // warp 内 32 个 i 同时算
```

这就是第 1 章说的 SIMT：你写的是单线程逻辑，硬件聚合成 warp 同步跑。

---

## 3.3 分支发散（Divergence）

当 warp 内线程走向不同分支，问题来了：

```cuda
if (i % 2 == 0) {
    c[i] = a[i] + b[i];     // 偶数线程
} else {
    c[i] = a[i] * b[i];     // 奇数线程
}
```

因为一个 warp 只能执行 **一条** 指令流，硬件的做法是：
1. 用掩码（mask）让「偶数线程」执行 if 分支，奇数线程被屏蔽（空转）；
2. 再让「奇数线程」执行 else 分支，偶数线程被屏蔽。

**两条分支都被执行，总时间 ≈ 两者之和**。这就是发散（divergence）的代价。

> 优化铁律：**让同一个 warp 内的线程走相同分支**。典型技巧是用 `(i / 32)` 而不是 `i % 2` 决定分支，或重排数据使同质数据聚到一起。

---

## 3.4 线程索引与内存映射

写 CUDA 最常见的工作是「把线程索引映射到数据索引」：

```cuda
// 2D 例子：处理一个矩阵
int row = blockIdx.y * blockDim.y + threadIdx.y;
int col = blockIdx.x * blockDim.x + threadIdx.x;
if (row < H && col < W)
    C[row * W + col] = A[row * W + col] + B[row * W + col];
```

索引的正确性与「内存访问是否合并」（第 5 章）直接决定了性能上限。

---

## 3.5 线程同步原语

### 3.5.1 Block 内同步：`__syncthreads()`
同一 block 内所有线程在此屏障处汇合，确保前面的共享内存写入对后续线程可见。**跨 block 不能用它**（会死锁，因为 block 可能在不同的 SM 上、甚至还没被调度）。

### 3.5.2 Warp 级原语（无屏障、更快）
同一 warp 内线程可用 warp 级内建函数，无需同步开销：
- `__shfl_sync(mask, var, srcLane)`：线程间直接「传递」寄存器值（shuffle），避免走共享内存。
- `__ballot_sync(mask, pred)`：收集 warp 内各线程的布尔结果到位掩码。
- `__activemask()`：返回当前活跃线程掩码。

```cuda
// warp 内求和（树形 shuffle，无需共享内存）
float sum = val;
for (int offset = 16; offset > 0; offset >>= 1)
    sum += __shfl_down_sync(0xffffffff, sum, offset);
// sum[0] 得到 warp 内总和
```

---

## 3.6 占用率（Occupancy）

**占用率 = 每 SM 实际活跃 warp 数 / 每 SM 最大 warp 数**。

A100 每 SM 最多 64 个 warp（2048 线程）。实际能跑多少，受三件事约束，取最小值：
1. **寄存器**：65536 寄存器 ÷ 每线程寄存器数 ÷ 32 = 可容纳 warp 数。
2. **共享内存**：每 SM 上限 ÷ 每 block 用量 = 可共存 block 数。
3. **block 数上限**：每 SM 最多 32 个 block。

```cuda
// 用 launch_bounds 告诉编译器：每个 block 最多 128 线程、至少 2 个 block/SM
__global__ void __launch_bounds__(128, 2) myKernel(...) { ... }
```

为什么占用率重要？回到第 1 章的 **延迟隐藏**：只有当「就绪 warp 够多」，warp 调度器才能在某个 warp 等内存时切到另一个 warp。占用率低 → 可切换的 warp 少 → 计算单元空转 → 吞吐下降。

> 但 **占用率不是越高越好**：它挤占了寄存器/共享内存预算。高占用率适合「访存密集、易等待」的 kernel；对「计算密集、很少等内存」的 kernel，适度占用率反而让每线程有更多寄存器，更快。

---

## 3.7 本章小结

- CUDA 三层：`grid(一次启动) → block(同SM、可同步) → thread(单线程逻辑)`。
- 硬件按 **warp（32 线程）** 调度，lockstep 执行同一条指令 → SIMT。
- **分支发散让两条分支都跑**，浪费算力；尽量让 warp 内线程走同分支。
- **占用率** 决定延迟隐藏能力，受寄存器/共享内存/block 上限三者约束。

下一章进入全书核心之一：**并发模型**——硬件如何用 warp 调度器 + 多发射实现「同时推进成千上万线程」，以及软件层如何用 Streams / Hyper-Q 组织并发。
