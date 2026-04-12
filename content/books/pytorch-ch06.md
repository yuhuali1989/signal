---
title: "第 6 章：分布式训练原语——从 NCCL 到 FSDP"
description: "PyTorch 分布式通信原语：ProcessGroup、NCCL 后端、AllReduce/AllGather 实现、DDP 源码、FSDP 分片策略、FSDP2+DTensor、4D并行、Context Parallel"
date: "2026-04-11"
updatedAt: "2026-04-13 11:00"
book: "PyTorch 原理深度剖析"
chapter: 6
chapterTitle: "分布式训练原语——从 NCCL 到 FSDP"
tags: ["PyTorch", "分布式", "NCCL", "DDP", "FSDP", "4D并行", "Context Parallel"]
type: "book"
---

# 第 6 章：分布式训练原语——从 NCCL 到 FSDP

> 分布式训练是万亿参数模型的必经之路。本章从最底层的通信原语开始，逐层构建出 2026 年 LLM 训练的完整技术栈。

## 6.1 通信后端：NCCL 深度剖析

### 6.1.1 初始化与拓扑发现

```python
# PyTorch 分布式初始化
import torch.distributed as dist
import os

# 方式 1: 环境变量（最常用）
dist.init_process_group(
    backend='nccl',          # GPU 间通信用 NCCL
    init_method='env://',     # 从环境变量读取 MASTER_ADDR, MASTER_PORT
    world_size=int(os.environ['WORLD_SIZE']),
    rank=int(os.environ['RANK']),
)

# 方式 2: TCP store（适用于容器环境）
dist.init_process_group(
    backend='nccl',
    init_method='tcp://master-0:29500',
    world_size=32,
    rank=int(os.environ['LOCAL_RANK']),
)

# NCCL 启动时的拓扑发现过程：
# 1. 检测 NVLink/NVSwitch 连接（节点内 GPU 互联）
# 2. 检测 InfiniBand/RoCE 网卡（节点间通信）
# 3. 构建通信拓扑图（Ring/Tree/CollNet）
# 4. 选择最优通信算法
```

### 6.1.2 核心通信原语

```
AllReduce: 所有 GPU 的数据求和/均值，结果广播到所有 GPU
  GPU0: [1,2] ─┐
  GPU1: [3,4] ──┼── AllReduce(sum) ──→ 所有 GPU 得到 [4,6]
  GPU2: [0,0] ─┘

AllGather: 收集所有 GPU 的数据
  GPU0: [A] ─┐
  GPU1: [B] ──┼── AllGather ──→ 所有 GPU 得到 [A,B,C]
  GPU2: [C] ─┘

ReduceScatter: AllReduce + Scatter = 每个 GPU 得到 1/N 的结果
  GPU0: [1,2,3] ─┐
  GPU1: [4,5,6] ──┼── ReduceScatter ──→ GPU0:[5] GPU1:[7] GPU2:[9]
  GPU2: [0,0,0] ─┘
```

### 6.1.3 Ring AllReduce 实现细节

```
Ring AllReduce 的两个阶段 (N 个 GPU, 数据量 D):

阶段 1: ReduceScatter (N-1 步)
  数据被分成 N 个 chunk，每步：
  - GPU_i 发送 chunk[i] 给 GPU_{i+1}
  - GPU_{i+1} 接收并累加
  结果：每个 GPU 持有 1/N 数据的全局求和

阶段 2: AllGather (N-1 步)
  每步：
  - GPU_i 将已完成的 chunk 发送给 GPU_{i+1}
  结果：所有 GPU 得到完整的全局求和

关键指标:
  总通信量: 2 × D × (N-1)/N ≈ 2D （与 GPU 数量近似无关！）
  延迟: 2 × (N-1) × α + 2D/B （α=延迟，B=带宽）
  
  对比 朴素方案（所有 GPU 发给 GPU0 汇总再广播）:
  总通信量: 2 × D × (N-1) → 随 GPU 数线性增长
  瓶颈: GPU0 的网络带宽
```

### 6.1.4 NCCL Tree AllReduce

```
当 GPU 数量很大时（>32），Ring 延迟项 2(N-1)α 变得显著。
NCCL 自动切换到 Tree AllReduce：

Tree AllReduce (4 GPU 示例):
  
  阶段 1: Reduce（叶→根）
         GPU0
        ╱    ╲
     GPU1    GPU2
              │
            GPU3
  
  GPU3 → GPU2 (sum)
  GPU1 → GPU0 (sum)
  GPU2 → GPU0 (sum) → GPU0 持有全局和

  阶段 2: Broadcast（根→叶）
  GPU0 → GPU1, GPU2
  GPU2 → GPU3
  
延迟: 2 × log₂(N) × α   (vs Ring 的 2(N-1)α)
带宽: 2D               (与 Ring 相同)

NCCL 的自动选择策略:
  - 小消息(<256KB): Tree（延迟优势）
  - 大消息(>256KB): Ring（带宽利用率高）
  - NVSwitch 环境: CollNet（利用 NVSwitch 硬件 AllReduce）
```

## 6.2 DistributedDataParallel (DDP) 源码解析

### 6.2.1 基本使用与原理

```python
# DDP 使用
model = nn.Linear(100, 10).cuda(rank)
model = torch.nn.parallel.DistributedDataParallel(
    model, 
    device_ids=[rank],
    output_device=rank,
    find_unused_parameters=False,  # 性能优化：设为 False
)

# DDP 的核心机制：
# 1. 前向传播：每个 GPU 独立计算，无通信
# 2. 反向传播：梯度计算完成后 AllReduce 同步
# 3. 关键优化：梯度 Bucket 化 + 计算通信重叠
```

### 6.2.2 梯度 Bucket 优化与计算-通信重叠

```
不用 Bucket (朴素实现):
  Layer N 梯度 → AllReduce → 等待
  Layer N-1 梯度 → AllReduce → 等待
  ...
  = N 次 AllReduce，大量 kernel launch 开销 + 等待

DDP Bucket (PyTorch 实现):
  把多个小梯度打包成 Bucket (默认 25MB)
  Layer N + N-1 + ... 的梯度 → 1 次 AllReduce
  与下一批梯度计算重叠 (计算-通信重叠)
  
  时间线 (反向传播):
  ┌─────────────────────────────────────────────────────┐
  │ 计算: [grad_N~M] [grad_M-1~K]  [grad_K-1~1]        │
  │ 通信:            [AllReduce B1]  [AllReduce B2] [B3] │
  └─────────────────────────────────────────────────────┘
  通信被隐藏在计算背后 → 接近零开销通信

DDP Bucket 参数填充顺序:
  - 按照反向传播的逆序（后面的层先计算梯度，先填满 Bucket）
  - Bucket 满了就立即发起 AllReduce，不等其他 Bucket
  - 这就是为什么 DDP 的参数遍历顺序很重要
```

### 6.2.3 DDP 的静态图优化

```python
# PyTorch 2.0+ 静态图优化
model = DDP(model, static_graph=True)

# 当 static_graph=True 时:
# 1. 第一次前向/反向传播记录参数使用顺序
# 2. 后续迭代复用该顺序，跳过参数发现
# 3. 减少 ~10% 的 DDP 开销
# 4. 前提：每次迭代使用相同的参数子集
```

## 6.3 FSDP 的分片机制

### 6.3.1 ZeRO 三阶段回顾

```
模型参数 Φ, 梯度 G, 优化器状态 O (Adam: 2Φ)
                                       
ZeRO-0 (DDP):     每个 GPU 存 Φ + G + O = 4Φ (FP32 等价)
ZeRO-1 (Stage 1): 分片 O → 每 GPU 存 Φ + G + O/N = 2Φ + 2Φ/N
ZeRO-2 (Stage 2): 分片 O+G → 每 GPU 存 Φ + (G+O)/N = Φ + 3Φ/N
ZeRO-3 (Stage 3): 分片 Φ+G+O → 每 GPU 存 (Φ+G+O)/N = 4Φ/N

FSDP = PyTorch 原生的 ZeRO-3 实现

8 GPU 训练 7B 模型 (14GB FP16 参数):
  DDP:  每 GPU 需要 ~56 GB (Φ+G+O in FP32/FP16 mixed)
  FSDP: 每 GPU 需要 ~7 GB  (8x 节省)
```

### 6.3.2 FSDP 生命周期详解

```python
from torch.distributed.fsdp import FullyShardedDataParallel as FSDP

model = FSDP(
    model,
    sharding_strategy=ShardingStrategy.FULL_SHARD,  # ZeRO-3
    mixed_precision=MixedPrecision(
        param_dtype=torch.bfloat16,
        reduce_dtype=torch.float32,
        buffer_dtype=torch.bfloat16,
    ),
    auto_wrap_policy=transformer_auto_wrap_policy,
    limit_all_gathers=True,  # 限制同时 AllGather 的数量（减少峰值内存）
)

# FSDP 每一层的生命周期:
# 
# ┌─────────────────────────────────────────────────┐
# │ 1. 初始化: 参数分片，每个 GPU 只存 1/N            │
# │    GPU0: [p0_shard0]  GPU1: [p0_shard1]  ...    │
# ├─────────────────────────────────────────────────┤
# │ 2. 前向传播:                                      │
# │    AllGather 收集完整参数 → 计算 → 释放非本分片     │
# │    ⚠️ 峰值内存 = 本层完整参数 + 激活值              │
# ├─────────────────────────────────────────────────┤
# │ 3. 反向传播:                                      │
# │    AllGather 重新收集参数(如未缓存) → 计算梯度      │
# │    → ReduceScatter 分发梯度 → 每 GPU 得到本分片梯度 │
# ├─────────────────────────────────────────────────┤
# │ 4. 优化器更新: 每个 GPU 只更新自己的 1/N 参数       │
# └─────────────────────────────────────────────────┘
```

### 6.3.3 FSDP 分片策略选择

```python
from torch.distributed.fsdp import ShardingStrategy

# 三种分片策略对比:
# ┌────────────────┬─────────────┬──────────────┬───────────┐
# │ 策略            │ 显存节省     │ 通信量       │ 适用场景   │
# ├────────────────┼─────────────┼──────────────┼───────────┤
# │ FULL_SHARD     │ 最大 (N倍)  │ 最大 (3Φ)    │ 大模型    │
# │ SHARD_GRAD_OP  │ 中等        │ 中等 (Φ+G)   │ 中等模型  │
# │ NO_SHARD (DDP) │ 无          │ 最小 (2Φ)    │ 小模型    │
# │ HYBRID_SHARD   │ 节点内分片  │ 低           │ 多节点    │
# └────────────────┴─────────────┴──────────────┴───────────┘

# HYBRID_SHARD (HSDP): 2026 年的实践最优选择
model = FSDP(
    model,
    sharding_strategy=ShardingStrategy.HYBRID_SHARD,
    # 节点内 8 GPU 做 FSDP（NVLink 高带宽）
    # 节点间只做 DDP AllReduce（InfiniBand，通信量少）
)
```

## 6.4 DTensor 与 FSDP2：下一代分布式抽象

### 6.4.1 DTensor 核心概念

```python
# PyTorch 2.5+ DTensor: 分布式张量的统一抽象
from torch.distributed.tensor import DTensor, Shard, Replicate
from torch.distributed.device_mesh import DeviceMesh

# 声明 2D 设备拓扑: 4 节点 × 8 GPU
mesh = DeviceMesh("cuda", torch.arange(32).reshape(4, 8), 
                   mesh_dim_names=("dp", "tp"))

# Placement 语义:
# - Shard(dim): 沿 dim 维分片 → 每个 GPU 持有 1/N 的切片
# - Replicate(): 全量复制 → 每个 GPU 持有完整副本
# - Partial(reduce_op): 部分结果 → 需要 reduce 才完整

# DTensor 示例
dtensor = DTensor.from_local(
    local_tensor,           # 每个 GPU 的本地数据
    device_mesh=mesh,       # 设备拓扑
    placements=[Shard(1)],  # 按第 1 维分片
)

# 操作自动处理通信！
# matmul(Shard(1), Shard(0)) → 自动插入 AllReduce
# 用户无需手动管理通信，DTensor 自动推导
```

### 6.4.2 FSDP2: 基于 DTensor 的重写

```python
# FSDP2 使用 fully_shard API（不再包裹模型）
from torch.distributed.fsdp import fully_shard

# 逐层分片（更细粒度的控制）
for layer in model.transformer.layers:
    fully_shard(layer, mesh=mesh["dp"])
fully_shard(model, mesh=mesh["dp"])

# FSDP2 vs FSDP1 核心差异:
# ┌──────────────┬────────────────────┬────────────────────┐
# │ 特性          │ FSDP1              │ FSDP2              │
# ├──────────────┼────────────────────┼────────────────────┤
# │ 底层实现      │ FlatParameter      │ DTensor            │
# │ torch.compile │ 部分兼容           │ 完全兼容 ✅         │
# │ 2D 并行       │ 需手动组合         │ 原生支持 ✅         │
# │ 分片粒度      │ 模型级/层级        │ 参数级（更灵活）✅   │
# │ 调试          │ 难以理解内部状态    │ DTensor 语义清晰 ✅ │
# │ 激活检查点     │ 独立 API          │ 与 compile 集成 ✅  │
# │ 状态          │ 维护模式           │ 活跃开发 ✅         │
# └──────────────┴────────────────────┴────────────────────┘
```

### 6.4.3 2D 并行：FSDP2 + Tensor Parallel

```python
# 2026 年 LLM 训练的标准范式：FSDP + TP
from torch.distributed.tensor.parallel import (
    ColwiseParallel,
    RowwiseParallel,
    parallelize_module,
)

# Step 1: Tensor Parallel（节点内 NVLink 通信）
for layer in model.layers:
    parallelize_module(layer, mesh["tp"], {
        "attention.q_proj": ColwiseParallel(),
        "attention.k_proj": ColwiseParallel(),
        "attention.v_proj": ColwiseParallel(),
        "attention.o_proj": RowwiseParallel(),
        "mlp.gate_proj":    ColwiseParallel(),
        "mlp.up_proj":      ColwiseParallel(),
        "mlp.down_proj":    RowwiseParallel(),
    })

# Step 2: FSDP（跨节点 InfiniBand 通信）
for layer in model.layers:
    fully_shard(layer, mesh=mesh["dp"])
fully_shard(model, mesh=mesh["dp"])

# 通信拓扑:
# TP=8 (节点内, NVLink 900 GB/s) — 每层 2 次 AllReduce，小消息
# DP=4 (跨节点, IB 400 Gbps) — 前向 1 次 AllGather + 反向 1 次 ReduceScatter
# 32 GPU 可训练 400B+ 模型
```

## 6.5 Pipeline Parallel：流水线并行

### 6.5.1 朴素 Pipeline 与 GPipe

```
朴素 Pipeline (严重的 bubble):
  GPU0 (layers 0-23):  [F0]              [F1]              [F2]
  GPU1 (layers 24-47):      [F0]              [F1]
  GPU2 (layers 48-71):           [F0]
  GPU3 (layers 72-95):                [F0]
                        ←──── 大量 bubble ────→

GPipe (微批次切分):
  GPU0: [F0][F1][F2][F3]                        [B3][B2][B1][B0]
  GPU1:      [F0][F1][F2][F3]              [B3][B2][B1][B0]
  GPU2:           [F0][F1][F2][F3]    [B3][B2][B1][B0]
  GPU3:                [F0][F1][F2][F3][B3][B2][B1][B0]
  bubble 比例: (P-1)/(M+P-1)  （M=微批次数，P=流水线级数）
```

### 6.5.2 1F1B 调度

```
1F1B (One Forward One Backward):

  GPU0: [F0][F1][F2][F3][B0][F4][B1][F5][B2][F6][B3]
  GPU1:      [F0][F1][F2][B0][F3][B1][F4][B2][F5][B3]
  GPU2:           [F0][F1][B0][F2][B1][F3][B2][F4][B3]
  GPU3:                [F0][B0][F1][B1][F2][B2][F3][B3]

  优势:
  1. 内存峰值降低: 同一时刻最多缓存 P 个微批次的激活
  2. Bubble 比例不变但内存更优
  
  PyTorch PipelineSchedule:
```

```python
from torch.distributed.pipelining import (
    pipeline, SplitPoint, ScheduleGPipe, Schedule1F1B
)

# 声明切分点
pipe = pipeline(
    model,
    mb_args=(input,),
    split_spec={
        "layers.24": SplitPoint.BEGINNING,
        "layers.48": SplitPoint.BEGINNING,
        "layers.72": SplitPoint.BEGINNING,
    }
)

# 使用 1F1B 调度
schedule = Schedule1F1B(
    pipe,
    n_microbatches=8,
    loss_fn=loss_fn,
)
schedule.step(input)
```

## 6.6 Context Parallel：长序列并行

### 6.6.1 为什么需要 Context Parallel

```
问题：训练 2M 上下文模型时，注意力计算的内存 = O(seq_len²)

  seq_len=8K:   ~256 MB KV Cache
  seq_len=128K: ~64 GB KV Cache    ← 单 GPU 放不下
  seq_len=2M:   ~16 TB KV Cache    ← 需要分布式

Context Parallel (CP) = 将序列维度分片到多个 GPU

  Ring Attention 实现:
  GPU0: tokens[0:N/4]     → 计算本地 QKV
  GPU1: tokens[N/4:N/2]   → 计算本地 QKV
  GPU2: tokens[N/2:3N/4]  → 计算本地 QKV
  GPU3: tokens[3N/4:N]    → 计算本地 QKV
  
  然后以 Ring 方式传递 KV:
  Step 1: GPU_i 将 KV 发送给 GPU_{i+1}，接收 GPU_{i-1} 的 KV
  Step 2: 用接收到的 KV 计算注意力分数，累加
  Step 3: 重复 N-1 次，得到完整注意力输出
```

### 6.6.2 实现示例

```python
# PyTorch 2.6+ Context Parallel
from torch.distributed.tensor.parallel import (
    context_parallel,
)

# 在 Attention 层启用 Context Parallel
for layer in model.layers:
    context_parallel(
        layer.attention,
        mesh=mesh["cp"],
        cp_size=4,  # 将序列分成 4 份
    )

# 或者使用 Flash Attention + Ring Attention 组合
# flash_attn_func 支持 ring_attention=True 参数
```

## 6.7 4D 并行：终极组合

### 6.7.1 四维并行拓扑

```
2026 年训练万亿参数模型的标准范式: DP × TP × PP × CP

  ┌─────────────────────────────────────────────┐
  │             4D 并行拓扑 (2048 GPU)            │
  ├─────────────────────────────────────────────┤
  │                                              │
  │  DP=16  (跨 16 组, InfiniBand)               │
  │  ├─ TP=8  (节点内 8 GPU, NVLink 900GB/s)    │
  │  ├─ PP=4  (跨 4 节点, 流水线)                │
  │  └─ CP=4  (跨 4 GPU, 序列分片)              │
  │                                              │
  │  总计: 16 × 8 × 4 × 4 = 2048 GPU            │
  │                                              │
  │  通信带宽需求:                                │
  │  TP: 最高频, 每层 2 次通信 → NVLink           │
  │  CP: 高频, Ring Attention → NVLink/NVSwitch   │
  │  PP: 中频, 微批次间传递 → InfiniBand          │
  │  DP: 低频, 梯度同步 → InfiniBand              │
  └─────────────────────────────────────────────┘
```

### 6.7.2 PyTorch 完整配置

```python
from torch.distributed.device_mesh import DeviceMesh

# 创建 4D 设备网格
mesh = DeviceMesh(
    "cuda",
    torch.arange(2048).reshape(16, 4, 4, 8),
    mesh_dim_names=("dp", "pp", "cp", "tp")
)

# Step 1: Tensor Parallel (最内层, NVLink)
for layer in model.layers:
    parallelize_module(layer, mesh["tp"], {...})

# Step 2: Context Parallel (序列分片)
for layer in model.layers:
    context_parallel(layer.attention, mesh["cp"])

# Step 3: Pipeline Parallel (层间分片)
pipe = pipeline(model, split_spec={...})

# Step 4: FSDP (数据并行, 最外层)
for stage in pipe.stages:
    for layer in stage.layers:
        fully_shard(layer, mesh["dp"])
```

## 6.8 通信性能调优实战

### 6.8.1 NCCL 环境变量调优

```bash
# === NCCL 调优关键变量 ===

# 调试信息（排查通信问题必备）
export NCCL_DEBUG=INFO            # WARN/INFO/TRACE
export NCCL_DEBUG_SUBSYS=ALL      # INIT,COLL,P2P,SHM,NET

# InfiniBand 配置
export NCCL_IB_HCA=mlx5_0,mlx5_1  # 指定 IB 网卡
export NCCL_IB_GID_INDEX=3         # RoCE v2 的 GID index
export NCCL_IB_TC=106              # Traffic Class (DSCP)

# 算法选择
export NCCL_ALGO=Ring              # Ring/Tree/CollNetDirect/CollNetChain
export NCCL_PROTO=LL128            # LL/LL128/Simple

# 缓冲区调优
export NCCL_BUFFSIZE=16777216      # 16MB（默认 4MB）
export NCCL_NCHANNELS_PER_NET_PEER=4  # 每对 GPU 的通信通道数

# NVLink 优化
export NCCL_P2P_LEVEL=NVL          # NVLink P2P 传输
export NCCL_SHM_DISABLE=0          # 允许共享内存
```

### 6.8.2 通信瓶颈诊断

```python
# 方法 1: torch.profiler 通信分析
with torch.profiler.profile(
    activities=[
        torch.profiler.ProfilerActivity.CPU,
        torch.profiler.ProfilerActivity.CUDA,
    ],
    schedule=torch.profiler.schedule(wait=1, warmup=1, active=3),
    on_trace_ready=torch.profiler.tensorboard_trace_handler('./log'),
    record_shapes=True,
    with_stack=True,
) as prof:
    for step, batch in enumerate(dataloader):
        loss = model(batch)
        loss.backward()
        optimizer.step()
        prof.step()

# 方法 2: NCCL 内置计时
# 在 Trace 中查找: ncclKernel_AllReduce_*, ncclKernel_AllGather_*
# 理想状态: 通信时间 < 计算时间（完全隐藏）

# 方法 3: 通信带宽计算
# 实际带宽 = 数据量 / 通信时间
# 理论带宽: NVLink 900 GB/s, IB HDR 200 Gbps ≈ 25 GB/s
# 如果实际带宽 < 理论 50%，说明有问题

# 常见问题排查:
# 1. 通信无法与计算重叠 → 检查 Bucket 大小
# 2. NCCL 超时 → 检查网络连通性和防火墙
# 3. 带宽低 → 检查 IB 网卡是否正确绑定
```

### 6.8.3 DDP Gradient Bucket 调优

```python
# Bucket 大小直接影响通信-计算重叠效果
model = DDP(model, 
    bucket_cap_mb=100,              # 默认 25MB，大模型可调大
    gradient_as_bucket_view=True,   # 零拷贝梯度视图
    static_graph=True,              # 静态图优化
)

# 如何选择 bucket_cap_mb:
# - 太小: 通信次数多，kernel launch 开销大
# - 太大: 通信无法与计算重叠（等全部梯度算完才发通信）
# - 经验值: 模型总参数量 / 10 ~ 模型总参数量 / 5
```

## 6.9 分布式训练的常见陷阱

### 6.9.1 随机种子与确定性

```python
# 每个 rank 使用不同的数据种子，但相同的模型初始化种子
torch.manual_seed(42)  # 模型初始化：所有 rank 相同
torch.cuda.manual_seed(42 + rank)  # 数据增强：每个 rank 不同

# DataLoader 的 worker 种子
def seed_worker(worker_id):
    worker_seed = torch.initial_seed() % 2**32
    np.random.seed(worker_seed)
    random.seed(worker_seed)

dataloader = DataLoader(
    dataset,
    sampler=DistributedSampler(dataset, seed=42),
    worker_init_fn=seed_worker,
)
```

### 6.9.2 梯度累积与 FSDP

```python
# FSDP + 梯度累积需要特别处理
accumulation_steps = 4

for i, batch in enumerate(dataloader):
    # FSDP 的 no_sync() 跳过中间步的通信
    with model.no_sync() if (i + 1) % accumulation_steps != 0 else nullcontext():
        loss = model(batch) / accumulation_steps
        loss.backward()
    
    if (i + 1) % accumulation_steps == 0:
        # 只在累积完成时做通信和更新
        optimizer.step()
        optimizer.zero_grad()
```

## 6.10 本章小结

| 方案 | 显存节省 | 通信量 | 适用规模 | torch.compile | 推荐度 |
|------|:---:|:---:|:---:|:---:|:---:|
| DDP | 无 | $2\Phi$ | < 10B | ✅ | ⭐⭐⭐ |
| FSDP1 (ZeRO-3) | $N$ 倍 | $3\Phi$ | 10B-400B | 部分 | ⭐⭐ |
| **FSDP2** (ZeRO-3) | **$N$ 倍** | **$3\Phi$** | **10B-400B** | **✅** | **⭐⭐⭐⭐⭐** |
| HSDP (FSDP2) | 节点内N倍 | < $3\Phi$ | 多节点 | ✅ | ⭐⭐⭐⭐ |
| FSDP2 + TP | $N \times T$ 倍 | 最少 | 400B+ | ✅ | ⭐⭐⭐⭐⭐ |
| 4D 并行 | 最大 | 按需 | 1T+ | ✅ | ⭐⭐⭐⭐⭐ |

**2026 年建议**：
1. **< 10B 参数**：DDP + torch.compile，简单高效
2. **10B-100B**：FSDP2 + BF16 混合精度
3. **100B-400B**：FSDP2 + TP（2D 并行）
4. **400B+**：FSDP2 + TP + PP + CP（4D 并行）
5. **长序列（>128K）**：必须加 Context Parallel

---

*Signal 知识平台 · PyTorch 原理深度剖析 · 第 6 章*
