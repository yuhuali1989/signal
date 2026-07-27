---
title: "GPU 工作原理与并发模型 - 第8章: 实战与最佳实践"
book: "GPU 工作原理与并发模型"
chapter: "8"
chapterTitle: "实战：大模型时代的多进程 GPU 共享与协作"
description: "落地到大模型推理与训练：连续批处理、prefill/decode 分离、数据/张量/流水并行中的多进程协作、显存超卖权衡、监控排障与最佳实践清单"
date: "2026-07-27"
updatedAt: "2026-07-27"
agent: "研究员→编辑→审校员"
tags:
  - "大模型推理"
  - "连续批处理"
  - "prefill-decode 分离"
  - "分布式训练"
  - "监控排障"
type: "book"
---

# 第 8 章：实战——大模型时代的多进程 GPU 共享与协作

> **学习目标**：把前七章的原理落到真实系统——大模型推理如何「多请求共享一卡」、prefill/decode 分离如何靠多进程协作提吞吐、分布式训练里多进程（rank）如何靠 NCCL 协作，以及监控与排障清单。

---

## 8.1 推理服务共享 GPU：连续批处理

单条请求往往只用满 GPU 一小会儿，剩下时间在等 KV Cache / 生成。若「一卡一请求」，利用率极低。

**连续批处理（Continuous Batching，Orca / vLLM / TGI 思想）**：把 **不同请求、不同进度的 decode step 动态拼进同一个 batch**，让 GPU 始终有活干。

```
时刻 t: 请求A 在 decode 第3步, 请求B 刚进来 prefill, 请求C decode 第1步
  → 三者合并成一个 batch 一次 kernel 推进
```

代价与协作点：
- 多个请求共享 **同一份 KV Cache 池**（一块大显存区），需要精细的 **显存分配器**（如 vLLM 的 PagedAttention，把 KV 切成固定页，像操作系统虚拟内存一样管理）。
- 这本质是「**单进程内多线程/多流**」协作，靠 CUDA Streams（4.5）与调度器把不同请求的 kernel 排到一起。
- 若还要「多推理进程共享一卡」省权重显存，则用 **IPC 共享权重**（7.2）+ MPS 合并提交。

---

## 8.2 Prefill 与 Decode 分离部署（进程协作典范）

prefill（算 prompt 的注意力，计算密集、一次性的）与 decode（逐 token，访存密集、长尾）混在同一 batch 会互相拖累：prefill 的大矩阵乘挤占 decode 的小步进。

**分离架构**（DistServe / Splitwise）：
- **Prefill 进程组**：独占一组 GPU，专吃大矩阵乘。
- **Decode 进程组**：独占另一组 GPU，专做小步进生成。
- 衔接靠 **KV Cache 传输**：prefill 算完把 KV 通过 **NCCL（跨卡）或 IPC（同卡多进程）** 发给 decode 进程组。

```
用户请求 → [Prefill 进程组] 算 KV → NCCL/IPC 传 KV → [Decode 进程组] 生成 token → 返回
```

收益：两侧各自按自己的最优 batch 策略调度，整体吞吐可提升数倍。这正是第 7 章「流水线范式」的真实落地。

---

## 8.3 训练场景：多进程（多 rank）协作

分布式训练里，「进程」通常对应一个 **rank（训练进程）**，它们之间靠 NCCL 协作：

- **数据并行（DP / DDP）**：每 rank 持完整模型副本、不同数据分片，前向/反向后 **AllReduce 梯度** 同步。最常用，通信量 = 模型大小。
- **张量并行（TP）**：单层权重切到多卡，前向每层都要 **AllReduce / AllGather** 拼回结果，通信频繁但单卡显存小。多进程在同一节点内用 NVLink 最快。
- **流水并行（PP）**：模型按层切段，不同 rank 算不同段，靠 **P2P / 激活值搬运** 衔接，形成「微批次流水线」。

```python
# PyTorch DDP：每个进程是一个 rank，NCCL 自动做梯度 AllReduce
import torch.distributed as dist
dist.init_process_group(backend="nccl")
model = torch.nn.parallel.DistributedDataParallel(model, device_ids=[local_rank])
```

> 关键协作事实：**训练「同步」靠 NCCL 集合通信的隐含屏障**——某 rank 慢（straggler）会拖慢整组（木桶效应）。所以集群里要尽量同构、同负载。

---

## 8.4 显存超卖与碎片：MPS vs MIG 的权衡

| 维度 | MPS（共享池） | MIG（固定切片） |
|---|---|---|
| 显存利用 | 高（池化，谁用谁占） | 低（预分配，空切片浪费） |
| 弹性 | 强（按需增长直到 OOM） | 弱（切片定死） |
| 隔离 | 弱（一崩俱崩） | 强（物理隔离） |
| 超卖风险 | 有（一个进程吃光拖垮他人） | 无（硬上限） |

实践建议：
- **推理多模型拼卡**：信任同栈 → MPS + 权重 IPC 共享；要 SLA → MIG。
- **训练**：几乎不用 MIG（要整卡算力），多进程靠 NCCL；单机多卡用 NVLink，跨机用 IB/RDMA。
- 显存碎片用 **PagedAttention / 显存池** 缓解；避免频繁 `cudaMalloc/cudaFree`（每次都触发驱动簿记与可能的同步）。

---

## 8.5 监控与排障

### 8.5.1 基础：`nvidia-smi`
```bash
nvidia-smi                                  # 看卡、显存、进程、温度、功耗
nvidia-smi dmon -s u -d 1                   # 实时利用率/显存采样
nvidia-smi -q -d MEMORY,UTIL,CLOCK,POWER     # 详情
```
- **util 高但吞吐低**：多半是 kernel 不合并 / bank conflict / 占用率低（回看 3、5 章）。
- **util 低且空转**：可能是 Host↔Device 拷贝瓶颈、或 CPU 端喂数据跟不上（流水线断流）。
- **显存占满**：OOM，检查是否有未释放的分配或权重重复加载。

### 8.5.2 进阶：DCGM / Nsight
- **DCGM（Data Center GPU Manager）**：后台采集成百上千指标（显存、ECC、NVLink 带宽、热节流），适合集群长期监控与告警。
- **Nsight Compute / Systems**：定位单 kernel 瓶颈（是否 memory-bound / compute-bound、占用率、L2 命中率）。

### 8.5.3 常见死锁与坑
- **跨 block 用 `__syncthreads`** → 死锁（block 未全调度）。
- **MPS 下某进程越界写** → 全上下文崩溃，日志出现相同 XID 错误。
- **NCCL 集合通信缺一个 rank**（某进程提前退出）→ 其余 rank 永久等屏障，任务挂死。
- **PCIe 拓扑不佳**（多卡跨 CPU socket）导致 P2P 走慢路 → 用 `nvidia-smi topo -m` 看 NVLink/PCIe 连接矩阵。

---

## 8.6 最佳实践清单

1. **先判断任务是否适合 GPU**（第 1 章）：强串行/分支多就别上。
2. **写 kernel 假设带宽是共享的**：合并访问、避 bank conflict、降寄存器压力（第 3、5 章）。
3. **用 Streams + Events 重叠计算与拷贝**；多源提交靠 Hyper-Q 避免虚假串行（第 4 章）。
4. **选对共享方式**：要隔离→MIG，要拼利用率且可信→MPS，轻量→默认时间片（第 6 章）。
5. **跨进程协作优先 IPC/NCCL**，崩溃传播风险牢记：MIG > 默认 > MPS（第 7 章）。
6. **推理用连续批处理 + 必要时 prefill/decode 分离**；训练用 NCCL 多进程并行（本章）。
7. **监控先行**：`nvidia-smi` 看表象，DCGM/Nsight 看根因；把「利用率低」当头等排查信号。

---

## 8.7 全书收束

我们从「为什么需要 GPU」出发，走过硬件解剖（SM/Tensor Core/HBM）、CUDA 执行模型（grid/block/warp/SIMT）、并发模型（warp 调度/占用率/Streams/Hyper-Q）、内存层次（合并/bank/UVM），最终落到 **多进程共享与协作** 这一实战核心：驱动用时间片与上下文切换把一卡分给多进程，MPS/MIG 提供从「最弱」到「最强」的隔离梯度，而 CUDA IPC 与 NCCL 让这些进程真正「协同计算」。

GPU 的魅力，正在于它把「海量并行」从硬件一路贯彻到系统：理解每一层如何分工与协作，你才能既写出快的程序，也设计出稳的多进程系统。

> **延伸阅读**：想深入某代架构细节，参考 NVIDIA 的 《CUDA C++ Programming Guide》《Ampere / Hopper Tuning Guide》，以及 AMD ROCm 文档；抽象编程可看 Triton / SYCL 教程。
