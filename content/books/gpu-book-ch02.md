---
title: "GPU 工作原理与并发模型 - 第2章: GPU 硬件解剖"
book: "GPU 工作原理与并发模型"
chapter: "2"
chapterTitle: "GPU 硬件解剖：从芯片到流式多处理器"
description: "以 NVIDIA 为例拆解 GPC→TPC→SM 的层级，深入 SM 内部的 CUDA Core / Tensor Core / 寄存器文件，以及从 HBM 到寄存器的内存层次"
date: "2026-07-27"
updatedAt: "2026-07-27"
agent: "研究员→编辑→审校员"
tags:
  - "GPU"
  - "SM"
  - "Tensor Core"
  - "HBM"
  - "硬件架构"
type: "book"
---

# 第 2 章：GPU 硬件解剖——从芯片到流式多处理器

> **学习目标**：建立 GPU 的硬件心智模型——SM 是什么、里面有哪些计算单元、寄存器/共享内存/HBM 各自干什么，以及 Tensor Core 为何是深度学习的「外挂」。

---

## 2.1 宏观层级：GPC → TPC → SM

以 NVIDIA 数据中心 GPU（Ampere A100 / Hopper H100）为例，芯片自顶向下分三层：

```
GPU 芯片
 └─ GPC (Graphics Processing Cluster) × 若干
     └─ TPC (Texture Processing Cluster) × 2
         └─ SM (Streaming Multiprocessor) × 1   ← 真正的计算引擎
```

- **GPC / TPC** 是「布线与管理」层级，负责光栅化、纹理、调度分区，对纯计算任务意义不大。
- **SM（流式多处理器）** 才是程序员真正要关心的计算单元。A100 有 108 个 SM，H100 有 132 个 SM（均为典型配置，具体随 SKU 裁剪）。

> 关键认知：**「GPU 有多少算力」≈「SM 数量 × 每 SM 算力」**。理解一个 SM，就理解了整张卡的并行本质。

---

## 2.2 解剖一个 SM：计算单元清单

以 Ampere（A100）SM 为例，一个 SM 包含（数量级）：

| 单元 | 数量（每 SM） | 作用 |
|---|---|---|
| FP32 CUDA Core | 64 | 单精度浮点 / 整数混合 |
| INT32 单元 | 64 | 整数运算、地址计算 |
| FP64 单元 | 32（HPC 配置） | 双精度（科学计算） |
| Tensor Core | 4 | 矩阵乘累加（深度学习核心） |
| Warp Scheduler | 4 | 每周期从就绪 warp 中选指令发射 |
| Dispatch 单元 | 4 | 把指令派发到执行单元 |
| 寄存器文件 | 65536 × 32-bit（256KB） | 线程私有寄存器 |
| 共享内存 / L1 | 可配置，最大 ~228KB | 块内线程高速共享 |

注意几个反直觉的点：
1. **一个 SM 有 4 个 warp 调度器**，意味着它每周期可以从 4 个不同的 warp 各取一条指令 —— 这就是「硬件级并发」的雏形（第 4 章展开）。
2. **Tensor Core 独立于 CUDA Core**：它不做普通算术，只做 `D = A×B + C` 这种矩阵乘累加，但速度快得离谱（单 SM 每周期可处理 256 个 FP16 MAC）。
3. **寄存器文件是「按 SM 全局」的**，不属于单个线程；线程只是从里面分到一段寄存器窗口。

---

## 2.3 寄存器文件与寄存器溢出

每个线程可用的寄存器是有限的（编译期由 `__launch_bounds__` 或默认策略决定）。当一个线程需要的寄存器超过 SM 能分给它的额度，就会发生 **寄存器溢出（register spilling）**：多余的变量被写到 **本地内存（local memory，实际落在 HBM 上）**，访问速度骤降一个数量级。

> 实践要点：kernel 里 **少定义大数组 / 少用递归 / 精简局部变量**，能显著降低寄存器压力、提高占用率（见 4.4）。

---

## 2.4 内存层次：从快到慢的五级

GPU 的内存层次比 CPU 陡峭得多，理解它才能写出快的程序：

```
┌─────────────────────────────────────────────────────────┐
│ Registers        每线程私有  最快(~数十TB/s)  容量极小    │
│   ├─ Shared Mem  每 SM 共享  ~19TB/s        可配置≤228KB │
│   │   ├─ L1      每 SM       ~19TB/s        与shared合并 │
│   │   │   ├─ L2  全卡共享    ~4-8TB/s       40-50MB      │
│   │   │   │   ├─ HBM(全局)  全卡共享   2-3.35TB/s  40-80GB│
│   │   │   │   │   └─ Host RAM  经 PCIe/NVLink  ~25-900GB/s│
└─────────────────────────────────────────────────────────┘
```

- **寄存器**：线程私有，编译器分配，无需手动管理。
- **共享内存（Shared Memory）**：程序员用 `__shared__` 显式声明，是「同一 block 内线程协作」的高速暂存区（第 3、5 章重点）。
- **L2 + HBM**：全局内存，所有线程可见，但延迟高、带宽虽大但「竞争激烈」。
- **Host（CPU 内存）**：通过 PCIe（~32GB/s 单向）或 NVLink（~900GB/s，H100）互联。

> 一个常被低估的事实：**HBM 带宽高达 3.35 TB/s，但「带宽大」不等于「你的 kernel 能用满」**。是否合并访问（第 5 章）决定了实际能用到多少。

---

## 2.5 Tensor Core 与混合精度

Tensor Core 是深度学习在 GPU 上爆发的根本。它专门执行矩阵乘累加（MMA）：

```
D = A × B + C      // A/B/C/D 是小数组，如 8×8 / 16×16
```

各代支持的精度：

| 架构 | 新增精度 | 典型场景 |
|---|---|---|
| Volta (V100) | FP16 | 早期混合精度训练 |
| Turing (T4) | INT8/INT4 | 推理量化 |
| Ampere (A100) | TF32 / BF16 / FP16 / INT8 | 主流训练与推理 |
| Hopper (H100) | **FP8** + Transformer Engine | 大模型训练/推理 |

**TF32** 是 Ampere 的巧思：用 19 位（1 符号 + 8 指数 + 10 尾数）表示 FP32 张量，无需改代码、累积仍用 FP32，直接把矩阵乘吞吐拉到 FP32 的 8 倍。

**Transformer Engine（Hopper）** 更进一步：在 FP8 与 FP16 之间按层动态切换，用「延迟缩放（delayed scaling）」保持数值稳定，让万亿参数模型训练显存与速度双赢。

---

## 2.6 AMD 对照：CU 与 wavefront

为避免「只懂一家」，对照一下 AMD CDNA 架构（MI250X / MI300X）：

- **CU（Compute Unit）** ≈ NVIDIA 的 SM。
- **wavefront = 64 线程** ≈ NVIDIA 的 warp（32）。 wavefront 更宽，发散代价更高但单宽吞吐更大。
- **Matrix Core** ≈ Tensor Core。
- 软件栈为 **ROCm / HIP**（HIP 语法几乎等价于 CUDA，可近乎平移）。

> 跨厂商编程的趋势：**SYCL / OpenCL / Triton** 等抽象层让你写一次、编译到多家后端。但理解底层 SM/warp 仍是性能调优的硬通货。

---

## 2.7 本章小结

- GPU 算力 = SM 数量 × 每 SM 算力；**SM 是并行的原子单位**。
- 一个 SM 内：CUDA Core 做通用算术，Tensor Core 做矩阵乘，4 个 warp 调度器实现硬件并发。
- 内存层次陡峭：寄存器 > 共享内存/L1 > L2 > HBM > Host，写程序就是「尽量把数据留在上层」。
- Tensor Core + 混合精度（TF32/BF16/FP8）是深度学习性能的来源。

下一步，我们把视角从「硬件有什么」切换到「我的代码如何映射到硬件」——这就是 CUDA 执行模型（第 3 章）。
