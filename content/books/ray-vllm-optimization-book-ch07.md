---
title: "Ray+vLLM 参数优化深度全书 - 第7章: 并行策略参数与 Ray 协同"
book: "Ray+vLLM 离线推理参数优化深度全书"
chapter: "7"
chapterTitle: "并行策略参数与 Ray Placement Group 协同"
description: "深入解析 vLLM 张量并行/流水线并行/专家并行参数，以及 Ray Placement Group 如何与 vLLM 并行策略协同分配 GPU 资源"
date: "2026-08-01"
updatedAt: "2026-08-01"
agent: "研究员→编辑→审校员"
tags:
  - "vLLM"
  - "张量并行"
  - "Pipeline Parallel"
  - "Ray"
  - "Placement Group"
type: "book"
---

# 第 7 章：并行策略参数与 Ray 协同

> **学习目标**：理解 vLLM 三种并行策略的参数配置和适用场景，掌握 Ray Placement Group 如何精确分配 GPU 资源给 vLLM Actor，学会在多模型场景下规划资源。

---

## 7.1 vLLM 并行策略概览

### 7.1.1 三种并行策略

```
┌─────────────────────────────────────────────────────────┐
│                vLLM 并行策略全景                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Tensor Parallel (TP)                                   │
│  ├── 把每一层的权重切分到多张卡                            │
│  ├── 每步推理都需要 AllReduce 通信                        │
│  ├── 通信量大，适合 NVLink/NVSwitch 互联                  │
│  └── 推荐: 单机多卡 (≤8 GPU)                             │
│                                                         │
│  Pipeline Parallel (PP)                                 │
│  ├── 把不同层分到不同卡                                   │
│  ├── 只在层边界通信 (点对点)                              │
│  ├── 通信量小，适合跨节点                                 │
│  └── 推荐: 跨机场景 (>8 GPU)                             │
│                                                         │
│  Expert Parallel (EP) — MoE 专用                        │
│  ├── 把不同专家分到不同卡                                 │
│  ├── 需要 All-to-All 通信路由 token                      │
│  └── 推荐: MoE 模型多卡推理                              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 7.1.2 参数一览

```python
LLM(
    model="...",
    tensor_parallel_size=4,       # TP: 权重切分到 4 卡
    pipeline_parallel_size=2,     # PP: 层切分到 2 组 (共 8 卡)
    expert_parallel_size=4,       # EP: 专家切分 (MoE)
    distributed_executor_backend="ray",  # 用 Ray 管理分布式
)
```

---

## 7.2 Tensor Parallel 参数详解

### 7.2.1 参数定义

```python
LLM(
    model="meta-llama/Llama-3-70B",
    tensor_parallel_size=4,  # 4 张卡做张量并行
)
```

### 7.2.2 TP 的内部工作方式

vLLM 的 TP 基于 Megatron-LM 的方案：

```
一个 Transformer 层的 TP 切分:

原始 (单卡):
  ┌─── Attention ───┐  ┌─── MLP ─────┐
  │ Q_proj (d×d)    │  │ gate (d×4d) │
  │ K_proj (d×d)    │  │ up   (d×4d) │
  │ V_proj (d×d)    │  │ down (4d×d) │
  │ O_proj (d×d)    │  └─────────────┘
  └─────────────────┘

TP=4 (每卡持有 1/4):
  GPU 0: Q[0:d/4], K[0:d/4], V[0:d/4], O[0:d/4,:], gate[:,0:d], up[:,0:d], down[0:d,:]
  GPU 1: Q[d/4:d/2], ... 
  GPU 2: Q[d/2:3d/4], ...
  GPU 3: Q[3d/4:d], ...
  
  Attention: 每卡独立计算自己的 head → AllReduce 合并
  MLP: 每卡独立计算自己的列 → AllReduce 合并
  每层 2 次 AllReduce (Attention 后 + MLP 后)
```

### 7.2.3 TP 大小的选择

| TP 大小 | 通信开销 | 显存/卡 | 适用场景 |
|---------|---------|--------|---------|
| 1 | 0 | 全部 | 模型 < 显存 |
| 2 | 低 | 50% | 70B on A100×2 |
| 4 | 中 | 25% | 70B on A100×4 |
| 8 | 高 | 12.5% | 70B on H100×8 |
| 16+ | 很高 | — | 通常用 PP 替代 |

**关键约束**：TP 大小必须能整除模型的 attention heads 数。Llama-3-70B 有 64 个 attention heads，TP 可以是 1/2/4/8/16/32/64。

### 7.2.4 TP 通信开销分析

```
每次 AllReduce 数据量 = batch_size × seq_len × hidden_dim × dtype_size
```

| 模型 | hidden_dim | batch=32, seq=2048 | AllReduce 数据量 | NVLink 延迟 |
|------|-----------|--------------------|-----------------|-----------| 
| 8B | 4096 | 32×2048×4096×2 | 512 MB | ~0.3ms |
| 70B | 8192 | 32×2048×8192×2 | 1024 MB | ~0.6ms |

每层 2 次 AllReduce，70B 有 80 层 = 160 次 AllReduce。总通信延迟约 96ms，相对于单步 85ms 的计算时间，通信占比约 53%。

**为什么 TP 通常不超过 8**：TP=8 时通信开销已经接近计算时间的 50%。TP=16 时通信可能超过计算，吞吐反而下降。

### 7.2.5 互联方式对 TP 的影响

| 互联方式 | 带宽 | TP 延迟 | 推荐 TP |
|---------|------|--------|--------|
| NVLink 4.0 (H100) | 900 GB/s | 极低 | ≤8 |
| NVLink 3.0 (A100) | 600 GB/s | 低 | ≤4-8 |
| NVSwitch | 900 GB/s | 极低 | ≤8 |
| PCIe 4.0 | 64 GB/s | 高 | ≤2 |
| PCIe 5.0 | 128 GB/s | 中 | ≤4 |
| InfiniBand (跨节点) | 50-100 GB/s | 很高 | ❌ 不推荐 TP |

---

## 7.3 Pipeline Parallel 参数详解

### 7.3.1 参数定义

```python
LLM(
    model="meta-llama/Llama-3-405B",
    tensor_parallel_size=8,      # 每节点 8 卡 TP
    pipeline_parallel_size=2,    # 2 个节点，共 16 卡
    distributed_executor_backend="ray",
)
```

### 7.3.2 PP 的工作方式

```
PP=2 的 80 层模型:

节点 0 (GPU 0-7, TP=8):     节点 1 (GPU 8-15, TP=8):
  Layer 0-39                   Layer 40-79
  │                            │
  └──→ 产出一个隐藏状态 ──→─────┘ (P2P 通信)
                               │
                               └──→ 产出 logits
```

PP 的通信只在层边界发生（一次 P2P 传输），通信量 = `batch × seq × hidden_dim`，比 TP 的 AllReduce 少得多。

### 7.3.3 PP 的 Bubble 问题

传统 PP 有 "bubble"——当 GPU 0 在处理 batch 1 的 layer 0-39 时，GPU 1 空闲等待。vLLM 使用 micro-batching 来缓解：

```
传统 PP (无 micro-batch):
  GPU 0: [====batch1====][====batch2====]
  GPU 1:                [====batch1====][====batch2====]
  Bubble: ████████████                ████████████

Micro-batching (4 micro-batches):
  GPU 0: [b1][b2][b3][b4][b1][b2][b3][b4]
  GPU 1:    [b1][b2][b3][b4][b1][b2][b3][b4]
  Bubble: ██                    ██  (小得多)
```

### 7.3.4 何时用 PP

| GPU 总数 | 推荐策略 | 原因 |
|---------|---------|------|
| ≤8 (单机) | TP only | NVLink 通信足够快 |
| 16 (2机) | TP=8, PP=2 | 跨节点用 PP 减少通信 |
| 32+ (4机+) | TP=8, PP=N | TP 不超过单机 GPU 数 |

**黄金法则**：TP 不超过单机 GPU 数（通常 8），超过的部分用 PP。

---

## 7.4 Expert Parallel (MoE 模型)

### 7.4.1 参数定义

```python
LLM(
    model="mistralai/Mixtral-8x7B-v0.1",
    tensor_parallel_size=4,
    expert_parallel_size=4,  # 8 个专家分到 4 组
)
```

### 7.4.2 EP 的工作方式

```
Mixtral 8x7B: 8 个专家, 每层 Top-2 路由

EP=4 (4 组 GPU):
  GPU 0: Expert 0, Expert 4
  GPU 1: Expert 1, Expert 5
  GPU 2: Expert 2, Expert 6
  GPU 3: Expert 3, Expert 7

每个 token 根据路由结果被 All-to-All 发送到对应专家所在的 GPU
计算完后 All-to-All 返回
```

### 7.4.3 EP vs TP for MoE

| 维度 | TP for MoE | EP for MoE |
|------|-----------|-----------|
| 切分方式 | 每个专家的权重被切分 | 每个专家完整在一卡上 |
| 通信 | AllReduce (每层2次) | All-to-All (每层2次) |
| 通信量 | 大 (全部 token × hidden) | 小 (只路由 token × hidden) |
| 负载均衡 | 好 (每卡处理相同 token) | 差 (路由不均匀时某些卡过载) |
| 推荐 | 专家数少时 | 专家数多时 |

**推荐**：Mixtral 8×7B 用 TP=4 (不单独 EP)；DeepSeek-V3 (256 专家) 用 EP=8。

---

## 7.5 Ray Placement Group 协同

### 7.5.1 为什么需要 Placement Group

在 Ray+vLLM 组合中，可能有多个 vLLM Actor 同时运行（多模型场景）。如果不使用 Placement Group，Ray 会随机分配 GPU，导致：

- TP=4 的 Actor 的 4 个 worker 可能分布在不同的物理机上
- 跨节点 TP 通信开销极大
- 多个 Actor 争抢同一张 GPU

Placement Group 解决这个问题——它允许你**预先规划 GPU 的分配方式**。

### 7.5.2 创建 Placement Group

```python
import ray
from ray.util.placement_group import placement_group, placement_group_table

# 方案 1: 单模型 TP=4，确保 4 张卡在同一节点
pg_single = placement_group(
    bundles=[{"GPU": 1, "CPU": 8}] * 4,  # 4 个 bundle
    strategy="STRICT_SPREAD",  # 每个 bundle 在不同 GPU，但同一节点
)
ray.get(pg_single.ready())

# 方案 2: 多模型共存
# 模型 A: TP=2 (2 张卡)
# 模型 B: TP=2 (2 张卡)
pg_multi = placement_group(
    bundles=[
        {"GPU": 1, "CPU": 8},  # 模型 A worker 0
        {"GPU": 1, "CPU": 8},  # 模型 A worker 1
        {"GPU": 1, "CPU": 8},  # 模型 B worker 0
        {"GPU": 1, "CPU": 8},  # 模型 B worker 1
    ],
    strategy="PACK",  # 所有 bundle 尽量在同一节点
)
ray.get(pg_multi.ready())
```

### 7.5.3 Placement Group 策略

| 策略 | 行为 | 适用场景 |
|------|------|---------|
| "PACK" | 所有 bundle 放在同一节点 | 单机多卡，TP 需要低延迟 |
| "STRICT_SPREAD" | 每个 bundle 在不同节点 | 流水线并行，跨节点 |
| "SPREAD" | 尽量分散 | 可选，不如 PACK 精确 |
| "STRICT_PACK" | 严格同一节点 | 最严格，TP 必选 |

### 7.5.4 vLLM + Placement Group 完整示例

```python
import ray
from ray.util.placement_group import placement_group
from vllm import LLM

ray.init()

# 为 70B 模型创建 TP=4 的 Placement Group
pg = placement_group(
    bundles=[{"GPU": 1, "CPU": 12}] * 4,
    strategy="PACK",
)
ray.get(pg.ready())

# vLLM 使用 Ray 作为分布式后端
llm = LLM(
    model="meta-llama/Llama-3-70B",
    tensor_parallel_size=4,
    distributed_executor_backend="ray",
    
    # 通过环境变量让 vLLM 使用这个 PG
    # vLLM 内部会在 PG 内分配 worker
    placement_group=pg,
    
    gpu_memory_utilization=0.95,
    max_model_len=4096,
    enable_chunked_prefill=True,
    max_num_seqs=256,
    enforce_eager=False,
    enable_prefix_caching=True,
)
```

### 7.5.5 多模型 Placement Group 规划

```python
# 8 卡 H100 服务器，同时跑两个模型
# 模型 A: Llama-3-70B (FP8, TP=4, KV FP8) — 需要 4 卡
# 模型 B: Llama-3-8B (FP8, TP=1, KV FP8) — 需要 1 卡
# 剩余 3 卡做其他任务

# 创建包含所有 bundle 的 Placement Group
pg_all = placement_group(
    bundles=[
        # 模型 A: 4 卡
        {"GPU": 1, "CPU": 16},  # bundle 0
        {"GPU": 1, "CPU": 16},  # bundle 1
        {"GPU": 1, "CPU": 16},  # bundle 2
        {"GPU": 1, "CPU": 16},  # bundle 3
        # 模型 B: 1 卡
        {"GPU": 1, "CPU": 8},   # bundle 4
        # 剩余: 3 卡 (不分配)
    ],
    strategy="PACK",
)
ray.get(pg_all.ready())

# 模型 A 使用 bundle 0-3
pg_a = pg_all.get_child_placement_group([0, 1, 2, 3])
llm_a = LLM(
    model="meta-llama/Llama-3-70B",
    tensor_parallel_size=4,
    placement_group=pg_a,
    ...
)

# 模型 B 使用 bundle 4
pg_b = pg_all.get_child_placement_group([4])
llm_b = LLM(
    model="meta-llama/Llama-3-8B",
    tensor_parallel_size=1,
    placement_group=pg_b,
    ...
)
```

---

## 7.6 distributed_executor_backend

### 7.6.1 两种选择

```python
LLM(
    model="...",
    distributed_executor_backend="ray",   # 用 Ray 管理分布式 worker
    # 或
    distributed_executor_backend="mp",    # 用 Python multiprocessing
)
```

| 后端 | 优势 | 劣势 | 推荐 |
|------|------|------|------|
| "ray" | 集群管理、容错、多模型共存 | 额外依赖 | **Ray 场景必选** |
| "mp" | 简单、无额外依赖 | 单机限制、无容错 | 纯单机场景 |

### 7.6.2 Ray 后端的工作方式

```
vLLM 主进程 (Actor)
  ├── 创建 Ray Placement Group
  ├── 在 PG 中启动 N 个 Worker Actor (N = TP × PP)
  ├── 主进程: 调度、采样、tokenization
  └── Worker Actor: 执行 Attention + MLP 前向
      ├── Worker 0: Layer 0 的 1/TP 部分
      ├── Worker 1: Layer 0 的 1/TP 部分
      └── ...
      通信: Ray Actor 间通过 NCCL + NVLink
```

---

## 7.7 并行策略选型决策

```
                    GPU 总数
                   /         \
                ≤8           >8
                /             \
          模型放得下单卡?     TP=8 + PP=N
           /        \          (单机TP, 跨机PP)
          是         否
          /           \
       TP=1        TP=N
    (不并行)    (N = 能放下模型的最小卡数)
```

### 决策矩阵

| 模型 | GPU 配置 | 推荐策略 | 原因 |
|------|---------|---------|------|
| 8B FP8 | 1×H100 | TP=1 | 单卡够用 |
| 8B FP16 | 1×A100 40G | TP=1 | 单卡够用 |
| 70B FP8 | 1×H100 80G | TP=1 | FP8后9GB权重，单卡够 |
| 70B FP16 | 2×A100 80G | TP=2 | FP16需140GB |
| 70B FP16 | 4×A100 80G | TP=4 | 更大并发 |
| 70B FP16 | 8×H100 | TP=8 | 最大并发 |
| 405B FP8 | 8×H100 | TP=8 | FP8后~200GB |
| 405B FP16 | 16×H100 (2机) | TP=8, PP=2 | 跨机用PP |
| Mixtral 8×7B | 4×A100 | TP=4 | Dense部分TP |
| DeepSeek-V3 | 8×H100 | TP=4, EP=2 | MoE用EP |

---

## 7.8 本章小结

| 参数 | 核心原则 |
|------|---------|
| `tensor_parallel_size` | 不超过单机 GPU 数，NVLink 互联时 ≤8 |
| `pipeline_parallel_size` | 仅跨节点使用，单机不用 |
| `expert_parallel_size` | MoE 模型专家数多时使用 |
| `distributed_executor_backend` | Ray 场景必须用 "ray" |
| Placement Group | PACK 策略确保 TP worker 在同一节点 |

**核心洞察**：并行策略的选择决定了通信开销的基础线。TP 的 AllReduce 通信每层都有，PP 的 P2P 只在层边界。对于 Ray+vLLM 组合，Placement Group 是确保 TP worker 物理位置邻近的关键机制——没有 PG，Ray 可能把 TP worker 分布到不同节点，导致 NVLink 退化为 InfiniBand，通信延迟增加 10 倍。
