---
title: "GPU 工作原理与并发模型 - 第7章: 多进程之间的协作机制"
book: "GPU 工作原理与并发模型"
chapter: "7"
chapterTitle: "进程协作：多进程如何在同一 GPU 上协同计算"
description: "剖析多进程协作的两种形态，CUDA IPC 跨进程共享显存、生产者-消费者/流水线范式、NCCL 集合通信、GPU 原子与锁、跨进程同步与故障隔离"
date: "2026-07-27"
updatedAt: "2026-07-27"
agent: "研究员→编辑→审校员"
tags:
  - "CUDA IPC"
  - "NCCL"
  - "原子操作"
  - "进程协作"
  - "故障隔离"
type: "book"
---

# 第 7 章：进程协作——多进程如何在同一 GPU 上协同计算

> **学习目标**：理解多进程共享 GPU 时「协作」的两条路径——共享同一上下文（MPS）vs 各自独立上下文（IPC/NCCL）；掌握 CUDA IPC 共享显存、CUDA 跨进程事件同步、NCCL 集合通信，以及崩溃如何传播。

---

## 7.1 协作的两种形态

多进程在 GPU 上协作，先要分清它们 **是否共享 CUDA 上下文**：

1. **共享上下文（MPS）**：进程经 MPS 汇入同一上下文，彼此的显存其实在同一地址空间，**直接就能互相读对方的 device 指针**（前提是约定好谁分配、谁使用）。
2. **独立上下文（默认 / MIG）**：每个进程有自己独立的页表，**不能直接解引用对方的指针**。要协作，必须走 **显式的跨进程机制**：CUDA IPC 或 NCCL。

本章主要讲第 2 种（更通用、更需要机制），并补充第 1 种的便利与风险。

---

## 7.2 CUDA IPC：跨进程共享显存句柄

CUDA 提供 **进程间通信（IPC）**，把一个进程在 GPU 上分配的显存「导出成句柄」，另一个进程「打开句柄」映射到自己的地址空间，从而 **共享同一块物理显存**。

```cuda
// 进程 A：分配并导出
float* d_buf;
cudaMalloc(&d_buf, bytes);
cudaIpcMemHandle_t handle;
cudaIpcGetMemHandle(&handle, d_buf);     // 导出句柄
// 通过共享内存 / 文件 / socket 把 handle 发给进程 B

// 进程 B：打开句柄，映射到自己的地址空间
float* d_buf_remote;
cudaIpcOpenMemHandle(&d_buf_remote, handle, cudaIpcMemLazyEnablePeerAccess);
// 之后 B 可直接读写 d_buf_remote（指向同一块物理显存）
```

要点：
- 共享的是 **全局内存（HBM）层面** 的物理页，**不是** 寄存器或共享内存（那些是 SM/block 私有的）。
- 句柄传递需走「带外通道」（共享内存、Unix socket、文件），CUDA 不管传输。
- 适用：生产者-消费者（一个进程算完把结果 buf 交给另一个进程继续处理）、共享大模型权重（多推理进程加载一次权重，省显存）。
- **限制**：同一块 IPC 显存通常要求两进程在 **同一块 GPU、同一驱动上下文族**；MIG 不同实例间一般不能 IPC。

> 注意：MPS 场景下其实「不需要」IPC——大家同上下文，直接传 device 指针即可；IPC 主要解决「默认/独立上下文」的协作。

---

## 7.3 协作范式：生产者-消费者、参数服务器、流水线

### 7.3.1 生产者-消费者（共享 buffer）
进程 A 负责「前处理 + 计算」，把结果写入 IPC 共享 buffer；进程 B 等待事件后读取并做「后处理」。配合 **跨进程事件**（见 7.6）实现就绪通知。

### 7.3.2 参数服务器 / 权重共享
多个推理进程通过 IPC 或 MPS 共享同一份模型权重显存，避免每进程各加载一份（省下大量 HBM，是大模型多实例部署的常见技巧）。

### 7.3.3 流水线（Prefill/Decode 分离）
大模型推理里，**prefill（处理 prompt，计算密集）** 与 **decode（逐 token 生成，访存密集）** 特性迥异。先进框架（如 DistServe / Splitwise 思想）把它们拆成 **两个进程组 / 两个 GPU 池**，用 **KV Cache 传输（NCCL 或 IPC）** 衔接：

```
[Prefill 进程组] --(KV Cache 传给)--> [Decode 进程组]
       ↑ 各自独立调度，互不阻塞
```

这种「进程级协作」能显著提升整体吞吐（第 8 章展开）。

---

## 7.4 NCCL：集合通信的事实标准

当协作涉及 **多进程 + 多 GPU**（甚至多机），用的是 **NCCL（NVIDIA Collective Communications Library）**。它不只是「跨进程」，更是「跨设备」的集合通信库。

核心原语：
- `ncclAllReduce`：所有 rank 的 tensor 求和/平均（数据并行的梯度同步）。
- `ncclBroadcast` / `ncclReduce`：一对多 / 多对一。
- `ncclAllGather` / `ncclReduceScatter`：张量并行、流水并行的通信模式。

```c
// 每个进程（rank）持有自己的 tensor，做 all-reduce
ncclAllReduce(d_send, d_recv, count, ncclFloat, ncclSum, comm, stream);
```

NCCL 的聪明之处：自动选择 **最快的物理通道**——
- 同卡多进程 → 走共享显存 / NVLink 内部通路；
- 同机多卡 → NVLink / PCIe；
- 跨机 → InfiniBand / 以太网（经 GPUDirect RDMA，数据不绕 CPU）。

> PyTorch 的 `DistributedDataParallel` / `FSDP` 底层就是 NCCL。多进程训练「如何协作」的答案，几乎总是 NCCL。

---

## 7.5 并发控制原语：GPU 上的原子与锁

多进程/多线程协作免不了「抢同一份数据」。GPU 提供 **原子操作（atomic）**：

```cuda
// 全局内存上的原子加：多 warp/多进程并发累加安全
atomicAdd(&counter, 1);
atomicCAS(&lock, 0, 1);   // 用 CAS 实现自旋锁
```

- **全局内存原子**：跨线程/跨 warp 安全，但 **慢**（需要序列化访问，易成瓶颈）。跨进程时，只要指向同一块 IPC 共享内存，全局原子同样生效。
- **共享内存原子**：仅 block 内，快得多（第 5 章）。
- **无锁算法**：优先用「每线程写各自独立位置 + 最后归约」，避免全局原子风暴；实在要协调，用 `atomicCAS` 做细粒度锁，并注意 **warp 内线程同时抢锁会串行**。

> 反模式：在 kernel 里对同一个全局计数器做百万次 `atomicAdd`，会变成严重瓶颈。正确做法是用 **局部计数 + 归约**。

---

## 7.6 同步与屏障：跨进程如何「等」

进程间不能像 block 内那样 `__syncthreads`，但有替代：

- **CUDA 事件（Event）跨进程**：`cudaEventCreate` + `cudaIpcGetEventHandle` 可把事件句柄传给另一进程，`cudaStreamWaitEvent` 实现「等对方某 stream 完成」。
- **Host 端协调**：进程各自把结果写回 Host（或经 IPC/NCCL 汇总），Host 用信号量/文件锁决定下一步，再触发各自的下一阶段 kernel。最简单也最可控。
- **NCCL 集体同步**：`ncclAllReduce` 等本身隐含屏障——所有 rank 到齐才返回，天然实现「多进程步调一致」。

> 设计建议：**能放在 Host 端用普通 IPC（共享内存/管道）协调的，就别在 GPU 上做复杂跨进程屏障**——后者脆弱且难调试。

---

## 7.7 故障隔离与崩溃传播

这是「多进程共享 GPU」最容易被忽视、也最致命的一点：

| 共享方式 | 一个进程崩溃的影响 |
|---|---|
| 默认（独立上下文） | 仅自己受影响；驱动回收其显存；**他人基本无感**（但整卡时间片会被短暂占用做清理） |
| MPS（共享上下文） | **可能拖垮整个 MPS 上下文**，同卡所有进程一起失败（共享页表/状态被破坏） |
| MIG（硬件隔离） | **完全不影响**其他实例（物理隔离） |

因此：
- 对 **不可信 / 易崩** 的多任务，优先 MIG 或默认上下文，避开 MPS。
- MPS 适合 **同一可信代码库内的多 worker**（如单个训练作业的数据并行进程），它本就「同生共死」。

> 监控上：`nvidia-smi` / DCGM 能观察到 XID 错误（GPU 硬件错误码）；MPS 下出现 XID 错误要警惕「连带雪崩」，日志里常能看到多个进程同时报同号错误。

---

## 7.8 本章小结

- 多进程协作先分「共享上下文（MPS，直接传指针）」与「独立上下文（需 IPC/NCCL）」。
- **CUDA IPC** 用内存句柄跨进程共享 HBM；适合生产者-消费者、权重共享、KV Cache 传输。
- **NCCL** 是跨进程/跨卡集合通信标准，自动选 NVLink/PCIe/RDMA，是多进程训练协作的基石。
- 并发控制用 **原子/CAS 锁**，但要避免全局原子风暴；同步优先放 Host 端。
- **故障隔离强度**：MIG > 默认 > MPS。选错共享方式，一个崩全盘崩。

最后一章，我们把所有知识落到真实战场：大模型时代的多进程 GPU 共享与协作实战。
