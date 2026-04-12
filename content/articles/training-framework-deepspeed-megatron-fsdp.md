---
title: "万卡训练全景：从并行策略到集群工程的硬核实战"
description: "深度拆解万卡 GPU 集群训练大模型的全链路：并行策略数学原理、DeepSpeed/Megatron/FSDP 源码级对比、通信拓扑设计、故障恢复、FP8 训练、MoE 负载均衡、Loss Spike 诊断"
date: "2026-04-11"
updatedAt: "2026-04-11 21:50"
agent: "研究员→编辑→审校员"
tags:
  - "训练与对齐"
  - "AI Infra"
type: "article"
---

# 万卡训练全景：从并行策略到集群工程的硬核实战

> 你以为训练大模型就是 `model.fit()`？在万卡集群上，每一步都是工程地狱。

训练一个 405B 的 Llama 3.1 需要 16,384 张 H100，持续运行 54 天。训练 DeepSeek-V3 需要 2048 张 H800，跑了 2 个月。这不是算法问题，这是**系统工程问题**。

本文从并行策略的数学原理出发，深入到框架源码层面的实现差异，再到真实万卡集群中的通信拓扑设计、故障恢复策略、FP8 训练实践。

---

## 一、并行策略的数学本质

### 1.1 为什么需要并行？

一个 70B 参数的模型，仅存储参数就需要：

$$\text{显存}_{params} = 70 \times 10^9 \times 2\text{B (BF16)} = 140\text{ GB}$$

但训练时还需要存储梯度、优化器状态：

$$\text{显存}_{total} = \text{Params} + \text{Gradients} + \text{Optimizer States}$$

用 AdamW 优化器，每个参数需要存储：
- 参数本身：2B (BF16)
- 梯度：2B (BF16)
- 一阶矩 (m)：4B (FP32)
- 二阶矩 (v)：4B (FP32)
- 主副本：4B (FP32)

$$\text{显存}_{total} = 70B \times (2 + 2 + 4 + 4 + 4) = 70B \times 16 = 1120\text{ GB}$$

**一张 H100 只有 80GB 显存，至少需要 14 张才能放下参数。** 加上激活值（Activation），实际需要更多。

### 1.2 四种并行策略

```
┌────────────────────────────────────────────────────────────┐
│                    混合并行 (3D/4D/5D)                       │
│                                                            │
│   ┌───────────────┐  ┌──────────────┐  ┌───────────────┐  │
│   │ 数据并行 (DP)  │  │ 张量并行 (TP) │  │ 流水线并行 (PP)│  │
│   │               │  │              │  │               │  │
│   │ 每张 GPU 完整 │  │ 一个矩阵乘法 │  │ 模型按层切割  │  │
│   │ 模型副本，    │  │ 拆到多 GPU   │  │ 分布到多 GPU  │  │
│   │ 不同数据切片  │  │ 并行计算     │  │ 流水线执行    │  │
│   │               │  │              │  │               │  │
│   │ 通信：AllReduce│  │ 通信：AllReduce│ │ 通信：P2P     │  │
│   │ 扩展性：★★★★ │  │ 扩展性：★★   │  │ 扩展性：★★★  │  │
│   └───────────────┘  └──────────────┘  └───────────────┘  │
│                                                            │
│   ┌───────────────┐  ┌──────────────┐                      │
│   │ 序列并行 (SP)  │  │ 专家并行 (EP) │ ← MoE 专用          │
│   │ 拆分长序列    │  │ 不同专家放不同│                      │
│   │ 到多 GPU      │  │ GPU 上       │                      │
│   └───────────────┘  └──────────────┘                      │
└────────────────────────────────────────────────────────────┘
```

### 1.3 数据并行的数学

$$g_i = \frac{1}{B_i}\sum_{j=1}^{B_i} \nabla_\theta L(x_j, \theta)$$

$$g_{global} = \frac{1}{N}\sum_{i=1}^{N} g_i$$

其中 $N$ 是 GPU 数量，$B_i$ 是每张 GPU 的 micro-batch。AllReduce 通信量：

$$\text{AllReduce 通信量} = 2 \times |\theta| \times \text{sizeof(dtype)}$$

70B 模型用 BF16：$2 \times 70B \times 2 = 280\text{ GB}$。用 Ring AllReduce 分 $N$ 步，每步 $\frac{280}{N}$ GB。

### 1.4 张量并行的矩阵拆分

以 MLP 层为例，$Y = \text{GeLU}(XA) \cdot B$：

**列并行 (Column Parallel)**：将 $A$ 按列拆分到 $N$ 个 GPU

$$A = [A_1, A_2, ..., A_N], \quad Y_i = XA_i$$

每个 GPU 独立计算 $\text{GeLU}(XA_i)$，无需通信。

**行并行 (Row Parallel)**：将 $B$ 按行拆分

$$B = \begin{bmatrix} B_1 \\ B_2 \\ ... \\ B_N \end{bmatrix}, \quad Y = \sum_{i=1}^{N} Z_i B_i$$

需要一次 AllReduce 求和。**一个 Transformer Block 只需 2 次 AllReduce**（Self-Attention 1 次 + MLP 1 次），这是 Megatron 的核心效率优势。

### 1.5 流水线并行的 Bubble 问题

$$\text{Bubble 率} = \frac{p - 1}{m + p - 1}$$

其中 $p$ 是流水线阶段数，$m$ 是 micro-batch 数。要让 Bubble < 5%，需要 $m \geq 20p$。

```
朴素流水线 (GPipe):
  GPU0: [F1][F2][F3][F4]............[B4][B3][B2][B1]  ← 大量空泡
  GPU1: ....[F1][F2][F3][F4]....[B4][B3][B2][B1]....
  GPU2: ........[F1][F2][F3][F4][B4][B3][B2][B1]
  
1F1B 调度 (Megatron-LM):
  GPU0: [F1][F2][F3][F4][B1][F5][B2][F6][B3][B4]  ← 空泡大幅减少
  GPU1: ..[F1][F2][F3][B1][F4][B2][F5][B3][F6][B4]
  GPU2: ....[F1][F2][B1][F3][B2][F4][B3][F5][B4][B5]

交错调度 (Interleaved 1F1B):
  每个 GPU 放多个不连续的层 → 进一步减少空泡到 ~3%
```

---

## 二、三大框架源码级对比

### 2.1 DeepSpeed：ZeRO 的三个阶段

ZeRO（Zero Redundancy Optimizer）的核心思想：**不是每张 GPU 都需要完整的优化器状态**。

```python
# ZeRO Stage 1: 分片 Optimizer States
# 每张 GPU 只维护 1/N 参数的 Adam m, v 状态
# 显存: Params(2) + Grad(2) + OptState(12/N) bytes/param
# N=64 时: 2 + 2 + 0.19 = 4.19 bytes/param (vs 原始 16 bytes)

# ZeRO Stage 2: + 分片 Gradients
# 梯度计算后立即 Reduce-Scatter，每 GPU 只保留 1/N 梯度
# 显存: Params(2) + Grad(2/N) + OptState(12/N) bytes/param

# ZeRO Stage 3: + 分片 Parameters
# 参数也按需分片，计算时临时 AllGather
# 显存: (Params + Grad + OptState) / N = 16/N bytes/param
# N=64 时: 仅 0.25 bytes/param → 70B 模型只需 ~17.5 GB / GPU
```

**DeepSpeed ZeRO-3 关键源码逻辑**：

```python
# 简化版 ZeRO-3 前向传播
class ZeRO3Module:
    def forward(self, input):
        # 1. AllGather: 从所有 GPU 收集完整参数
        full_params = all_gather(self.partitioned_params)
        
        # 2. 正常前向计算
        output = F.linear(input, full_params)
        
        # 3. 释放非本分片的参数（节省显存）
        del full_params  # 只保留自己负责的 1/N
        
        return output
    
    def backward(self, grad_output):
        # 1. 再次 AllGather 参数（前向时已释放）
        full_params = all_gather(self.partitioned_params)
        
        # 2. 计算梯度
        grad = compute_gradient(grad_output, full_params)
        
        # 3. Reduce-Scatter: 每 GPU 只保留 1/N 梯度
        partitioned_grad = reduce_scatter(grad)
        
        # 4. 用本地梯度更新本地 optimizer state
        self.optimizer.step(partitioned_grad)
```

**通信量分析**：
- ZeRO-1: $2\Phi$ (和 DP 一样的 AllReduce)
- ZeRO-2: $2\Phi$ (Reduce-Scatter + AllGather)
- ZeRO-3: $3\Phi$ (多了前向 AllGather)，但内存节省最大

$$\text{ZeRO-3 通信量} = \underbrace{\Phi}_{forward\ AllGather} + \underbrace{\Phi}_{backward\ AllGather} + \underbrace{\Phi}_{Reduce-Scatter} = 3\Phi$$

### 2.2 Megatron-LM：极致的张量并行

Megatron 的核心贡献是**高效的 Transformer 层内并行**：

```python
# Megatron 张量并行的 Self-Attention 实现
class ParallelSelfAttention:
    """
    将 Q, K, V 投影矩阵按 attention head 拆分
    TP=4 时，每张 GPU 处理 1/4 的 head
    """
    def __init__(self, hidden_size, num_heads, tp_size):
        self.num_heads_per_partition = num_heads // tp_size
        # 每张 GPU 只存 1/tp_size 的 QKV 投影矩阵
        self.qkv = ColumnParallelLinear(
            hidden_size,
            3 * hidden_size // tp_size,
            gather_output=False  # 不做 AllGather，保持分片
        )
        self.out_proj = RowParallelLinear(
            hidden_size // tp_size,
            hidden_size,
            input_is_parallel=True  # 输入是分片的
        )
    
    def forward(self, hidden_states):
        # 1. 列并行：每 GPU 计算自己负责的 head
        qkv = self.qkv(hidden_states)  # 无通信
        q, k, v = split_qkv(qkv)
        
        # 2. 独立的 Attention 计算（FlashAttention）
        attn_output = flash_attention(q, k, v)  # 无通信
        
        # 3. 行并行 + AllReduce
        output = self.out_proj(attn_output)  # 1 次 AllReduce
        
        return output
```

**Megatron vs DeepSpeed 通信效率对比**：

| 操作 | Megatron TP=8 | DeepSpeed ZeRO-3 |
|------|:---:|:---:|
| **通信类型** | AllReduce (小) | AllGather + ReduceScatter (大) |
| **每 Block 通信次数** | 4 次 | 2 次 (但每次数据量大) |
| **每 Block 通信量** | $4 \times \frac{2H^2}{T}$ | $3 \times \frac{12H^2}{N}$ |
| **通信发生位置** | 节点内 NVLink | 跨节点 InfiniBand |
| **延迟敏感度** | 高（同步通信） | 中（可流水线化） |

**关键洞察**：TP 应该放在节点内（NVLink 900 GB/s），PP 和 DP/ZeRO 放在节点间（IB 400 Gbps）。

### 2.3 FSDP2：PyTorch 原生方案

```python
# PyTorch 2.5+ FSDP2 — 按参数粒度分片
from torch.distributed._composable.fsdp import fully_shard, MixedPrecisionPolicy

mp_policy = MixedPrecisionPolicy(
    param_dtype=torch.bfloat16,
    reduce_dtype=torch.float32,  # 梯度用 FP32 归约保精度
)

# 逐层包裹，而不是整个模型
for layer in model.layers:
    fully_shard(layer, mp_policy=mp_policy)
fully_shard(model, mp_policy=mp_policy)

# 支持 torch.compile！
model = torch.compile(model)

# 训练循环和普通 PyTorch 一样
for batch in dataloader:
    loss = model(batch)
    loss.backward()
    optimizer.step()
```

**FSDP2 vs FSDP1 关键改进**：

| 特性 | FSDP1 | FSDP2 |
|------|:---:|:---:|
| 分片粒度 | FlatParameter（整层打包） | 逐参数（更灵活） |
| torch.compile | ❌ 不兼容 | ✅ 完全兼容 |
| 混合并行 | 需要手动配置 | DTensor 自动组合 |
| 状态管理 | 全局 ShardedStateDictLoader | 标准 state_dict |
| Activation Checkpointing | 单独的 wrapper | 原生 `torch.utils.checkpoint` |

---

## 三、万卡集群网络拓扑设计

### 3.1 集群分层架构

```
┌─────────────── GPU Cluster (10,000+ GPUs) ──────────────┐
│                                                          │
│  ┌─────────────────── SuperPod ───────────────────┐      │
│  │                                                 │      │
│  │  ┌──── Node (8×H100) ────┐  ┌──── Node ────┐  │      │
│  │  │                        │  │               │  │      │
│  │  │  GPU0 ←NVLink→ GPU1   │  │               │  │      │
│  │  │   ↕   NVSwitch   ↕    │  │               │  │      │
│  │  │  GPU2 ←NVLink→ GPU3   │  │  (同上)       │  │      │
│  │  │   ↕   900GB/s    ↕    │  │               │  │      │
│  │  │  GPU4 ←NVLink→ GPU5   │  │               │  │      │
│  │  │   ↕             ↕     │  │               │  │      │
│  │  │  GPU6 ←NVLink→ GPU7   │  │               │  │      │
│  │  └──────────┬─────────────┘  └───────┬───────┘  │      │
│  │             │ InfiniBand 400Gbps      │          │      │
│  │             └───────┬─────────────────┘          │      │
│  │                     │ Rail-Optimized Topology     │      │
│  └─────────────────────┼───────────────────────────┘      │
│                        │ Spine Switch (51.2 Tbps)         │
│                        │                                   │
│  ┌─── SuperPod 2 ──────┤──── SuperPod 3 ────┐             │
│  └──────────────────────┘────────────────────┘             │
└──────────────────────────────────────────────────────────┘
```

### 3.2 通信带宽层次

| 层级 | 连接方式 | 带宽 | 延迟 | 适合的并行策略 |
|------|---------|:---:|:---:|:---:|
| GPU 间 (节点内) | NVLink 4.0 + NVSwitch | 900 GB/s | ~1μs | **张量并行 (TP)** |
| 节点间 (机架内) | InfiniBand NDR400 | 400 Gbps (50 GB/s) | ~1-5μs | **流水线并行 (PP)** |
| 机架间 (SuperPod 内) | IB + Rail-Optimized | 400 Gbps | ~5-10μs | **数据并行 (DP/ZeRO)** |
| SuperPod 间 | Spine Switch | 400 Gbps | ~10-50μs | **数据并行 (DP)** |

**核心原则**：通信密集度高的并行策略放在带宽大的层级。

### 3.3 实际万卡配置示例

**训练 Llama 3.1 405B (Meta，16384×H100)**：

```yaml
# 并行策略
Tensor Parallel (TP): 8      # 节点内 NVLink
Pipeline Parallel (PP): 16   # 跨 16 个节点
Data Parallel (DP): 128      # 16384 / (8*16) = 128
Context Parallel (CP): 1     # 长序列时开启

# 换算
Total GPUs: 8 × 16 × 128 = 16,384
Micro Batch Size: 1
Global Batch Size: 128 × gradient_accumulation_steps

# 网络需求
节点内: NVLink 900 GB/s (TP 通信)
节点间: 8×400 Gbps IB (PP P2P + DP AllReduce)
```

**训练 DeepSeek-V3 671B MoE (DeepSeek，2048×H800)**：

```yaml
Tensor Parallel (TP): 1      # 不用 TP！MoE 模型用 EP 替代
Expert Parallel (EP): 64     # 256 个专家分到 64 组
Pipeline Parallel (PP): 16
Data Parallel (DP): 2        # 2048 / (1*64*16) ≈ 2

# MoE 的关键：All-to-All 通信
# 每个 token 被路由到不同专家所在的 GPU
# 通信模式：All-to-All (而非 AllReduce)
```

---

## 四、故障恢复：万卡集群的命脉

### 4.1 故障率计算

一张 GPU 的年故障率约 3-5%。10,000 张 GPU 集群：

$$P(\text{所有GPU正常运行1小时}) = (1 - \frac{0.04}{8760})^{10000} \approx 0.955$$

$$\text{平均无故障运行时间(MTBF)} \approx \frac{1}{N \times \lambda} = \frac{8760}{10000 \times 0.04} \approx 21.9 \text{ 小时}$$

**也就是说，万卡集群平均每 22 小时就会出一次故障。** 训练 70B 模型需要几周，意味着会遇到几十次故障。

### 4.2 Checkpoint 策略

```python
# 异步 Checkpoint（不阻塞训练）
class AsyncCheckpointer:
    """
    DeepSpeed / Megatron 的异步 checkpoint 机制
    训练线程继续前进，后台线程写 checkpoint
    """
    def __init__(self, interval_steps=100):
        self.interval = interval_steps
        self.writer_thread = None
        
    def save_if_needed(self, step, model, optimizer):
        if step % self.interval != 0:
            return
            
        # 1. 快照当前状态到 CPU 内存（~1 秒）
        snapshot = {
            'model': copy_to_cpu(model.state_dict()),
            'optimizer': copy_to_cpu(optimizer.state_dict()),
            'step': step,
            'rng_state': torch.cuda.get_rng_state_all(),
        }
        
        # 2. 后台线程异步写入存储（~几分钟，不阻塞训练）
        if self.writer_thread:
            self.writer_thread.join()  # 等上一个写完
        self.writer_thread = Thread(
            target=self._write_to_storage, args=(snapshot,)
        )
        self.writer_thread.start()
    
    def _write_to_storage(self, snapshot):
        # 写入分布式文件系统（GPFS / Lustre / S3）
        # ZeRO-3: 每个 rank 只写自己的分片
        # 10,000 GPU 同时写 → 需要 TB/s 级别的存储带宽
        torch.save(snapshot, f"ckpt/rank_{rank}.pt")
```

### 4.3 弹性训练

```python
# PyTorch Elastic (TorchElastic) 配置
# 当节点故障时自动缩减 world_size，恢复后自动扩展
#
# torchrun 启动参数
# --nnodes=900:1024     # 最少 900 节点，最多 1024 节点
# --max-restarts=100    # 最多重启 100 次
# --rdzv-backend=c10d   # 使用 c10d Rendezvous
# --rdzv-endpoint=master:29400

class ElasticTrainer:
    def on_node_failure(self, failed_ranks):
        """节点故障处理流程"""
        # 1. 检测故障（NCCL timeout，通常 5-30 分钟）
        # 2. 重新组网（剩余节点重新分配 rank）
        # 3. 加载最近的 checkpoint
        # 4. 调整 DP 并行度（减少的节点从 DP 维度扣除）
        # 5. 重新计算 global batch size
        # 6. 继续训练
        
        new_world_size = total_gpus - len(failed_ranks) * 8
        new_dp_size = new_world_size // (tp_size * pp_size)
        # Global batch size 可能变化 → 需要调整 learning rate
```

### 4.4 Loss Spike 诊断

训练中最头疼的问题之一是**突发的 Loss Spike**：

```
常见原因及排查清单：

1. 数据异常
   ✅ 检查当前 batch 是否包含异常样本（超长序列、乱码）
   ✅ 验证 data loader 的 shuffle seed 是否确定性
   
2. 梯度爆炸
   ✅ 检查 grad_norm：超过 10x 均值 → 梯度裁剪阈值太高
   ✅ 检查特定层的梯度分布（Embedding 层和最后一层最易爆炸）
   
3. 学习率问题
   ✅ Warmup 阶段太短 → 模型还没稳定就加大学习率
   ✅ 切换 LR Scheduler 阶段的跳变
   
4. 数值精度
   ✅ BF16 下 Loss Scale 不当
   ✅ FP8 激活值溢出（需要 per-tensor scaling）
   
5. 通信错误
   ✅ NCCL 版本 bug → AllReduce 结果不一致
   ✅ InfiniBand 链路抖动 → 梯度同步延迟

6. MoE 路由崩溃
   ✅ 专家负载严重不均 → 某些专家过载
   ✅ Router 的 Load Balancing Loss 权重太低
```

---

## 五、FP8 训练：40% 吞吐提升的工程实践

### 5.1 为什么 FP8？

$$\text{计算吞吐} \propto \frac{1}{\text{精度位数}}$$

| 精度 | 位宽 | H100 FLOPS | 相对 BF16 |
|------|:---:|:---:|:---:|
| FP32 | 32 bit | 67 TFLOPS | 0.1x |
| BF16 | 16 bit | 990 TFLOPS | 1.0x |
| FP8 (E4M3) | 8 bit | 1,979 TFLOPS | **2.0x** |
| INT8 | 8 bit | 1,979 TOPS | 2.0x |

理论上 FP8 比 BF16 快 2 倍。实际中由于 Scaling 开销和通信瓶颈，实测提升约 **35-45%**。

### 5.2 FP8 的两种格式

```
E4M3 (4位指数, 3位尾数):
  范围: ±448,  精度: ~0.125
  适合: 前向传播的权重和激活值

E5M2 (5位指数, 2位尾数):
  范围: ±57344, 精度: ~0.25
  适合: 反向传播的梯度（需要更大范围）

对比:
  BF16:  1 符号 + 8 指数 + 7 尾数 → 范围大, 精度适中
  E4M3:  1 符号 + 4 指数 + 3 尾数 → 范围小, 精度低 → 需要 Scaling
```

### 5.3 Per-Tensor Scaling 策略

FP8 的核心挑战是**动态范围太小**，需要 Scaling Factor 把数值映射到 FP8 可表示的范围：

```python
# DeepSeek-V3 的 FP8 训练实现（简化版）
def fp8_linear(x_bf16, w_bf16):
    """FP8 矩阵乘法，前后有 Scale/Descale"""
    
    # 1. 计算 Scaling Factor
    # 方法 A: 当前 tensor 的 amax（DeepSeek-V3 用这个）
    scale_x = torch.max(torch.abs(x_bf16)) / 448.0  # E4M3 max
    scale_w = torch.max(torch.abs(w_bf16)) / 448.0
    
    # 方法 B: 历史滑动平均（更稳定但有延迟）
    # scale_x = ema(amax_history, 0.99) / 448.0
    
    # 2. 量化到 FP8
    x_fp8 = (x_bf16 / scale_x).to(torch.float8_e4m3fn)
    w_fp8 = (w_bf16 / scale_w).to(torch.float8_e4m3fn)
    
    # 3. FP8 GEMM（在 Tensor Core 上 2x 速度）
    y_fp8 = torch._scaled_mm(x_fp8, w_fp8.t(),
                              scale_a=scale_x, scale_b=scale_w,
                              out_dtype=torch.bfloat16)
    
    return y_fp8

# 注意：梯度通信仍然用 BF16/FP32
# 只有 GEMM 计算用 FP8
```

**DeepSeek-V3 的 FP8 训练结果**：
- 训练 14.8T tokens，全程 FP8（业界首个如此大规模验证）
- 对比 BF16 基线，最终 Loss 差距 < 0.25%
- 吞吐提升约 **40%**，训练总成本 $5.57M（极其低廉）

---

## 六、MoE 负载均衡：最容易被忽视的训练难题

### 6.1 问题本质

MoE (Mixture of Experts) 模型用 Router 把每个 token 分配给 Top-K 个专家。问题是 Router 天然倾向于把 token 集中分配给少数"热门"专家：

$$\text{Load Imbalance} = \frac{\max_i(n_i)}{\text{mean}(n_i)}$$

其中 $n_i$ 是第 $i$ 个专家接收的 token 数。理想情况 = 1.0，实际经常 > 2.0。

### 6.2 负载均衡策略

```python
# 辅助负载均衡损失 (Auxiliary Load Balancing Loss)
def load_balancing_loss(router_probs, expert_indices, num_experts):
    """
    Switch Transformer 提出的辅助损失
    惩罚不均匀的专家分配
    """
    # f_i: 第 i 个专家被选中的频率
    # P_i: 路由到第 i 个专家的概率均值
    
    # 每个专家被选中的比例
    mask = F.one_hot(expert_indices, num_experts).float()
    f = mask.mean(dim=0)  # [num_experts]
    
    # 每个专家的路由概率均值
    P = router_probs.mean(dim=0)  # [num_experts]
    
    # 辅助损失: 最小化 f 和 P 的相关性
    # 当所有专家均匀分配时，loss 最小
    aux_loss = num_experts * torch.sum(f * P)
    
    return aux_loss  # 乘以一个小系数（如 0.01）加到总 loss

# DeepSeek-V3 的改进：无辅助损失的负载均衡
# 用 Bias 项替代辅助损失，动态调整每个专家的选择偏好
# 避免了辅助损失对模型性能的负面影响
```

### 6.3 All-to-All 通信

MoE 的通信模式和普通模型完全不同：

```
普通模型: AllReduce (所有 GPU 交换相同数据)
MoE 模型: All-to-All (每个 GPU 发送不同数据到不同目标)

All-to-All 通信示例 (4 GPU, 8 Experts):
  GPU0 有 tokens 路由到 Expert 0,1,2,3,4,5,6,7
  需要把对应的 token 发送到存放该 Expert 的 GPU
  
  GPU0 → GPU0: tokens for Expert 0,1  (本地)
  GPU0 → GPU1: tokens for Expert 2,3  (网络)
  GPU0 → GPU2: tokens for Expert 4,5  (网络)
  GPU0 → GPU3: tokens for Expert 6,7  (网络)
  
  通信量取决于路由分布，不可预测 → 很难优化
```

---

## 七、实战选型决策树

```
你要训练什么规模的模型？
│
├── < 7B (小模型)
│   └── FSDP + 4-8 GPU
│       配置简单，PyTorch 原生支持
│
├── 7B-70B (中等模型)
│   ├── 快速实验 → DeepSpeed ZeRO-2/3
│   │   和 HuggingFace Trainer 一行配置
│   └── 极致性能 → Megatron-LM (TP=8 + PP)
│       需要更多配置但训练更快
│
├── 70B-400B (大模型)
│   └── Megatron-LM + DeepSpeed 混合
│       TP=8 (节点内) + PP=8-32 (节点间) + ZeRO-1 (DP)
│       必须 InfiniBand 400G+
│
├── 400B+ (超大模型)
│   └── 全套 3D/4D 并行 + 弹性训练 + 异步 Checkpoint
│       需要专门的集群调度团队
│
└── MoE 模型 (任意规模)
    └── Expert Parallel + Pipeline Parallel
        All-to-All 通信需要特别优化
        参考 DeepSeek-V3 配置
```

---

## 八、2026 年趋势与展望

### 8.1 FP4 训练初露端倪

NVIDIA Blackwell B200 支持 FP4 Tensor Core，理论 FLOPS 再翻倍：

| 精度 | B200 FLOPS | 相对 H100 BF16 |
|------|:---:|:---:|
| BF16 | 2,250 TFLOPS | 2.3x |
| FP8 | 4,500 TFLOPS | 4.5x |
| FP4 | 9,000 TFLOPS | **9.1x** |

但 FP4 训练稳定性仍是开放问题，预计 2026-2027 年成熟。

### 8.2 自动并行越来越智能

- **Alpa**：自动搜索 DP/TP/PP 的最优组合
- **Galvatron**：考虑异构集群的自动并行
- **PyTorch DTensor**：统一的分布式张量抽象

### 8.3 训推一体化

传统：训练框架 → 导出模型 → 推理框架（转换开销大）

趋势：**训练完直接在同一框架上推理**
- vLLM + FSDP 集成
- TensorRT-LLM 支持从 Megatron checkpoint 直接加载

### 8.4 光互联与新型互联

- **CPO (Co-Packaged Optics)**：光互联直接集成在 GPU 封装上，带宽 1.6 Tbps
- **NVLink 5.0**：1.8 TB/s 双向带宽
- **Ultra Ethernet**：面向 AI 训练优化的新以太网标准

---

*本文由 Signal 知识平台 AI 智能体自动生成，融合研究员调研、编辑整理、审校员校验三角色流水线。最后更新: 2026-04-11*
