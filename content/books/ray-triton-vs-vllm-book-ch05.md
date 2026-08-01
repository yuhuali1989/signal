---
title: "Ray+Triton vs Ray+vLLM 离线推理架构对比 - 第5章: 资源调度与GPU隔离"
book: "Ray+Triton vs Ray+vLLM：离线推理架构对比"
chapter: "5"
chapterTitle: "资源调度与 GPU 隔离"
description: "对比两种架构下 GPU 所有权、显存分配、CPU 调度、Placement Group 的使用方式，以及多模型并存的资源管理策略"
date: "2026-08-01"
updatedAt: "2026-08-01"
agent: "研究员→编辑→审校员"
tags:
  - "GPU 隔离"
  - "资源调度"
  - "Placement Group"
  - "显存管理"
  - "Ray"
type: "book"
---

# 第 5 章：资源调度与 GPU 隔离

> **学习目标**：理解两种架构下 GPU 所有权、显存分配、CPU 资源调度的差异，掌握多模型共存场景下的资源管理策略。

---

## 5.1 GPU 所有权：谁控制 GPU

**架构 A（Ray + Triton）**：

```
GPU 所有权：Triton 独占

Ray 集群视角：
  - Worker 1: CPU=16, GPU=0  (num_gpus=0)
  - Worker 2: CPU=16, GPU=0  (num_gpus=0)
  - Worker 3: CPU=16, GPU=0  (num_gpus=0)
  ...
  GPU 被 Triton 进程占用，Ray 看不到

Triton 视角：
  - GPU 0: 模型 llama-3-8b (gpu_memory_fraction=0.9)
  - Triton 完全控制 GPU 的显存分配和调度
```

Ray 在这个架构中**完全不管 GPU**。GPU 资源由 Triton 独占管理，Ray Worker 只处理 CPU 任务。这带来两个后果：

1. **Ray 的 GPU 调度能力被浪费**：Ray 的 Placement Group、`num_gpus` 参数对 GPU 无效
2. **GPU 争抢防护缺失**：如果误配了一个 `num_gpus=1` 的 Ray Task，它会和 Triton 争抢 GPU，导致 OOM

**架构 B（Ray + vLLM Actor）**：

```
GPU 所有权：Ray Actor 持有

Ray 集群视角：
  - Actor 1: CPU=8, GPU=1  (num_gpus=1)
    └── vLLM LLM Engine (gpu_memory_utilization=0.95)
  - Worker 1: CPU=4, GPU=0  (num_gpus=0)
  - Worker 2: CPU=4, GPU=0  (num_gpus=0)
  ...
  Ray 完全控制 GPU 分配

Actor 视角：
  - GPU 0: 独占，vLLM 管理显存
```

Ray 通过 `num_gpus=1` 把 GPU 分配给 Actor，其他 Task/Actor 无法使用这张 GPU。**GPU 调度与数据流水线统一在 Ray 框架内管理**。

---

## 5.2 显存分配对比

**架构 A 的显存分配链**：

```
物理 GPU (80GB)
  └── Triton 进程
        ├── 模型权重 (e.g. 16GB for 8B FP16)
        ├── KV Cache 池 (TensorRT-LLM 管理)
        │     └── gpu_memory_fraction=0.9 → 72GB 可用
        │         ├── 权重: 16GB
        │         └── KV Cache: 56GB
        └── 临时激活缓冲区 (剩余 8GB)

Ray Worker: 不分配任何 GPU 显存
```

Triton 的 `gpu_memory_fraction` 是模型级的，多个模型可以按比例分配：

```
模型 A: gpu_memory_fraction=0.5  → 40GB
模型 B: gpu_memory_fraction=0.4  → 32GB
剩余 8GB: Triton 运行时
```

**架构 B 的显存分配链**：

```
物理 GPU (80GB)
  └── Ray Actor 进程 (num_gpus=1)
        └── vLLM LLM Engine
              ├── gpu_memory_utilization=0.95
              │   → 76GB 可用
              │     ├── 权重: 16GB
              │     └── KV Cache: 60GB
              └── 4GB 留给 PyTorch runtime + activations
```

vLLM 的 `gpu_memory_utilization` 是全局的，一个 Actor 只跑一个模型，独占整张 GPU。

---

## 5.3 多模型场景的资源管理

单机多模型是两种架构差异最大的场景之一。

**场景**：一台 4×A100 机器，同时运行 Llama-3-8B 和 Mistral-7B。

**架构 A 方案**：

```
Triton Server (1个进程，4张GPU)
├── GPU 0,1: Llama-3-8B (TP=2)
│     instance_group: { gpus: [0,1], count: 1 }
│     gpu_memory_fraction: 0.45
├── GPU 2,3: Mistral-7B (TP=2)
│     instance_group: { gpus: [2,3], count: 1 }
│     gpu_memory_fraction: 0.45
└── 多个 Ray Worker 通过 gRPC 访问两个模型

优点：
  - 一个 Triton 进程管理所有模型
  - 模型可以热更新
  - 统一的监控端点
缺点：
  - 两个模型共享 Triton 的 CPU 线程池
  - 一个模型的 Dynamic Batcher 可能影响另一个
```

**架构 B 方案**：

```
Ray 集群
├── Actor A (Llama-3-8B)
│     num_gpus=2, tensor_parallel_size=2
│     Placement Group bundle: {GPU:2, CPU:16}
│     vLLM: gpu_memory_utilization=0.95
├── Actor B (Mistral-7B)
│     num_gpus=2, tensor_parallel_size=2
│     Placement Group bundle: {GPU:2, CPU:16}
└── 多个 CPU Worker 做数据预处理

优点：
  - 两个 Actor 完全隔离（进程级隔离）
  - 各自独立管理 GPU 显存
  - 可以分别重启/更新
缺点：
  - 模型加载在 Actor 内，重启需要重新加载
  - 需要手动设计 Placement Group
```

---

## 5.4 CPU 资源调度

CPU 资源在两种架构中的角色不同：

**架构 A**：Ray Worker 需要 CPU 做 tokenize 和 protobuf 序列化，CPU 是**数据管道的执行者**。

```
CPU 分配 (16核机器):
  - Ray Worker 1: num_cpus=4  (tokenize + gRPC client)
  - Ray Worker 2: num_cpus=4
  - Ray Worker 3: num_cpus=4
  - Triton Server: 使用剩余 CPU (不通过 Ray 管理)
  → 可以启动 3-4 个并行 Worker 喂数据给 Triton
```

**架构 B**：Actor 需要 CPU 做 tokenize，但同时 Actor 也要持有 GPU。CPU 是**推理流水线的一部分**。

```
CPU 分配 (16核机器):
  - vLLM Actor: num_cpus=8, num_gpus=1
    ├── CPU 线程: tokenize + 后处理 + Ray RPC
    └── GPU: vLLM 推理
  - 数据预取 Worker: num_cpus=4
    └── 从磁盘/网络读取数据，发给 Actor
  - 结果写入 Worker: num_cpus=4
    └── 接收 Actor 结果，写入存储
  → CPU 在 Actor 和 Worker 之间分工
```

---

## 5.5 Placement Group 实战

**架构 A**：Placement Group 只能管 CPU 资源，GPU 不受控。

```python
# 架构 A 的 Placement Group（仅 CPU）
pg = placement_group(
    bundles=[
        {"CPU": 4},  # Worker 1
        {"CPU": 4},  # Worker 2
        {"CPU": 4},  # Worker 3
        {"CPU": 4},  # Worker 4
    ],
    strategy="PACK"
)
# GPU 由 Triton 独立管理，Ray 无法约束
```

**架构 B**：Placement Group 精确控制 CPU+GPU。

```python
# 架构 B 的 Placement Group（CPU + GPU）
pg = placement_group(
    bundles=[
        {"GPU": 1, "CPU": 8},   # 推理 Actor
        {"CPU": 4},              # 数据预取
        {"CPU": 4},              # 结果写入
    ],
    strategy="PACK"  # 全部放在同一台机器
)
ray.get(pg.ready())

actor = vLLMActor.options(
    placement_group=pg,
    placement_group_bundle_index=0,
).remote("model-name", gpu_memory_utilization=0.95)

prefetcher = DataPrefetcher.options(
    placement_group=pg,
    placement_group_bundle_index=1,
).remote()

writer = ResultWriter.options(
    placement_group=pg,
    placement_group_bundle_index=2,
).remote()
```

---

## 5.6 显存碎片化问题

**架构 A**：Triton 的显存管理由 TensorRT-LLM backend 负责。TensorRT-LLM 有自己的 KV Cache 管理（类似 PagedAttention），但 Triton 层面的多模型共存可能导致显存碎片化——模型 A 释放后，模型 B 可能无法利用其碎片化的空间。

**架构 B**：每个 Actor 独占 GPU，vLLM 的 PagedAttention 完全管理 KV Cache。不存在跨模型碎片化问题。但如果 Actor 死亡后重启，GPU 显存会被完全释放再重新分配，这个过程中如果有其他进程在用同一 GPU（不应该发生，因为 Ray 的 `num_gpus` 隔离），可能导致冲突。

---

## 5.7 资源利用率对比

| 资源 | 架构 A (Ray+Triton) | 架构 B (Ray+vLLM Actor) |
|------|---------------------|------------------------|
| GPU 计算 | Triton 管理，利用率高 | vLLM 管理，利用率高 |
| GPU 显存 | `gpu_memory_fraction` 模型级分配 | `gpu_memory_utilization` 全局分配 |
| CPU (序列化) | 高（protobuf 编解码） | 低（无序列化） |
| CPU (tokenize) | Ray Worker 并行 | Actor 内串行（可用多线程） |
| 内存 (RAM) | 两套进程，开销大 | 单进程，开销小 |
| 网络 (IPC) | localhost TCP | 无 |
| Ray 调度 | 仅 CPU | CPU + GPU 统一调度 |

---

## 5.8 本章小结

**架构 A 的资源管理特点**：
- GPU 由 Triton 独占，Ray 无法干预
- 多模型共享 Triton 进程，通过 `gpu_memory_fraction` 分配
- CPU 和 GPU 资源分属两个进程，需要手动协调
- 适合已有 Triton 基础设施、需要多模型复用的场景

**架构 B 的资源管理特点**：
- GPU 由 Ray 通过 `num_gpus` 分配给 Actor
- 一个 Actor 一个模型，完全隔离
- CPU 和 GPU 在同一进程内，Ray 统一调度
- 适合 LLM 专用推理、需要精确资源控制的场景

**核心权衡**：架构 A 的多模型复用能力 vs 架构 B 的资源调度精确性。
