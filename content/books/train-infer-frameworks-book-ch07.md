---
title: "大模型训练与推理框架源码全书 - 第7章: ZeRO 显存账与 stage_1_and_2.py 源码"
book: "大模型训练与推理框架源码全书：从 PyTorch 原语到 Megatron、DeepSpeed 与 vLLM"
chapter: "7"
chapterTitle: "ZeRO 显存账与 stage_1_and_2.py 源码"
description: "用统一符号推导 16Ψ 到 16Ψ/N 的四个阶段公式，展开 stage_1_and_2.py 里 flatten、param_group 替换与 IPG bucket 的关键代码，并指出 reduce_scatter 配置名与实际集合通信不一致"
date: "2026-11-14"
updatedAt: "2026-11-14"
agent: "研究员→编辑→审校员"
tags:
  - "DeepSpeed"
  - "ZeRO"
  - "显存优化"
  - "梯度归约"
  - "源码拆解"
type: "book"
part: "篇三 · 训练状态改写"
---

# 第 7 章 · ZeRO 显存账与 `stage_1_and_2.py` 源码

## 7.1 先把口径统一（第 2 章那笔账的完整版）

第 2 章与第 6 章都出现过 `840 GB / 8 = 105 GB`，容易被读成两个不同的量。这里用统一符号重推一次，全书后续只用这套记号：

| 记号 | 含义 | 贯穿配置的值 |
|---|---|---|
| Ψ | **全局**模型参数量 | 70 B |
| Ψ_local | **每卡实际持有**的参数量 = `Ψ / (TP×PP)` | `70/8 = 8.75 B` |
| N | ZeRO 分片度 = DP 度 | 8 |
| `K = TP×PP` | 模型并行度 | 8 |

混合精度 Adam 下每个参数的模型状态（**以每卡持有量 Ψ_local 为基准**）：

```
bf16 参数        2 B
bf16 梯度        2 B
fp32 master      4 B
fp32 momentum    4 B
fp32 variance    4 B
────────────────────
合计            16 B
```

> 【推算】每卡 baseline = `16 × Ψ_local = 16 × 8.75e9 = 140 GB`。其中 fp32 优化器状态占 `12 × Ψ_local = 105 GB`。第 2 章写的「全局 `70e9 × 12 B = 840 GB`，按 DP=8 分片后每卡 105 GB」是**全局口径的除法结果**，恰好与「每卡未分片优化器状态」数值相等，因为本例 `K = N = 8`。两者不是同一个量，只是数值巧合。以后一律用 Ψ_local。

## 7.2 四个阶段的公式与两个算例

| 阶段 | 分片对象 | 每卡模型状态 | 别称 |
|---|---|---|---|
| baseline | 无 | `16 Ψ_local` | DDP |
| **ZeRO-1** | optimizer states | `4 Ψ_local + 12 Ψ_local / N` | P_os |
| **ZeRO-2** | + 梯度 | `2 Ψ_local + 14 Ψ_local / N` | P_os+g |
| **ZeRO-3** | + 参数 | `16 Ψ_local / N` | P_os+g+p |

推导只看一件事：**哪一坨状态从「每卡一份」变成「每卡 1/N 份」**。ZeRO-1 把 12 B 的 fp32 状态除以 N；ZeRO-2 再把 2 B 的梯度除以 N；ZeRO-3 连 2 B 的参数也除以 N，于是全部 16 B 都除以 N。

**算例 A（经典论文口径，Ψ=7.5B、N=64、无 TP/PP 故 Ψ_local=Ψ）**：

| 阶段 | 算式 | 结果 |
|---|---|---|
| baseline | `16×7.5e9` | **120 GB** |
| ZeRO-1 | `4×7.5e9 + 12×7.5e9/64` | **31.4 GB** |
| ZeRO-2 | `2×7.5e9 + 14×7.5e9/64` | **16.6 GB** |
| ZeRO-3 | `16×7.5e9/64` | **1.875 GB** |

站内 `ai-interview-ch01.md` 里说的「4× / 8× / N× 显存节省」就是这张表的近似说法，用统一公式可以精确复算。

**算例 B（贯穿配置，Ψ_local=8.75B、N=8）**：

| 阶段 | 算式 | 每卡 |
|---|---|---|
| baseline | `16×8.75e9` | **140 GB** |
| ZeRO-1 | `4×8.75e9 + 12×8.75e9/8` = `35 + 13.1` | **48.1 GB** |
| ZeRO-2 | `2×8.75e9 + 14×8.75e9/8` = `17.5 + 15.3` | **32.8 GB** |
| ZeRO-3 | `16×8.75e9/8` | **17.5 GB** |

> ★注意：**这些数字不含激活显存**。ch06 算过 TP 通信与激活重算，ch13 会算推理侧 KV cache——训练与推理的显存账本要到第 14 章才合到一起。这是本书与「只讲某一个框架」的文章最大的不同。

## 7.3 ZeRO-1/2 的核心只有一行

【源码】`deepspeed/runtime/zero/stage_1_and_2.py::DeepSpeedZeroOptimizer`：

```python
# ① 把同一 dtype 的模型参数 flatten 成一个连续大 buffer
self.bit16_groups_flat.append(flatten_dense_tensors_aligned(
    [p for p in self.bit16_groups[i]]))

# ② 每个原始 Parameter 的 .data 只是这个 buffer 的一个 view
p.data = flat_group.narrow(0, offset, meta.numel()).view(meta.shape).data

# ③ 按 DP 度把 buffer 切成 N 份，只为本地那份建 fp32 状态
data_parallel_partitions = self.get_data_parallel_partitions(self.bit16_groups_flat[i], i)
single_partition_of_fp32_groups.append(weights_partition)

# ★④ 关键：把原生 optimizer 的 param_groups 换成本 rank 的 fp32 分片
param_group['params'] = [self.single_partition_of_fp32_groups[i]]
# 之后 optimizer.step() 只更新本卡 1/N 的参数，m/v 也只占 1/N
```

**为什么这一行是全部秘密**：PyTorch 的 `torch.optim.Adam` 只看 `param_group['params']` 里的 Tensor 来分配 `exp_avg` / `exp_avg_sq`。把列表换成本地分片后，**不需要改任何优化器代码**，显存自然降到 1/N。这是第 2 章「原语⑤：改 `.data` / 参数视图」最直接的应用。

`step()` 之后还要把更新后的分片广播回所有 DP rank，让每卡的 bf16 参数重新完整：

```python
# 【源码】step 末尾的回写（概念骨架）
dist.all_gather(self.bit16_groups_flat[i], self.single_partition_of_fp32_groups[i],
                group=self.dp_process_group)
```

## 7.4 梯度侧：IPG bucket 与 `average_tensor()`

ZeRO-2 还要把梯度也分片。它靠参数上的 grad hook 把梯度攒进 bucket，满了才归约：

```python
# 【源码】stage_1_and_2.py
self._register_grad_hook()                       # 每个参数挂 hook
def process_gradients(self, ...):
    ...
    if self.elements_in_ipg_bucket + param.numel() > self.reduce_bucket_size:
        self.__reduce_and_partition_ipg_grads()  # flush

def average_tensor(self, tensor_to_allreduce):
    if not self.reduce_scatter:
        dist.all_reduce(tensor_to_allreduce, group=self.dp_process_group)
    else:
        # 按 partition_id 把梯度切片归约到 owner rank
        self.allreduce_no_retain(grad_slices, ..., rank=dst,
                                 process_group=self.dp_process_group)
```

> ★【源码】第 1 章那个反直觉结论在这里落地：配置里的 `reduce_scatter=True` 在 ZeRO-1/2 **并不直接调 NCCL `reduce_scatter_tensor`**，而是按 `partition_id` 分组后调 `allreduce_no_retain(..., rank=dst)`——本质是「all-reduce 之后只有目标 rank 保留切片」。真正用 `reduce_scatter_coalesced(...)` 的是 ZeRO-3（ch08）。名字相同，通信量模型却不同：前者的总字节数仍是 all-reduce 级别的 `2n(N-1)/N`，后者才把每卡输出降到 `n/N`。

**双缓冲**是这里另一个关键实现（第 2 章原语④）：

```python
# 【源码】IPG bucket 交替
bucket.index = 1 - bucket.index
# 一个 buffer 正在 NCCL 流上归约，另一个继续接收新产生的梯度
# 配合 record_stream() 防止显存被提前复用
```

> 【推算】`reduce_bucket_size` 默认 5e8 元素（bf16 约 1 GB）。贯穿配置每卡梯度总量 `2 B × 8.75e9 = 17.5 GB`，会切成约 18 个 bucket 依次归约。bucket 太小 → NCCL 启动次数多、带宽利用率低；太大 → 归约开始得太晚，无法与反向计算重叠。**这个参数调优的本质是通信与计算的时间窗匹配**，不是显存大小。

## 7.5 ZeRO-1 与 ZeRO-2 的唯一区别

源码里两者共用同一个类，靠一个开关区分：

```python
# 【源码】stage_1_and_2.py
self.partition_gradients = ...        # ZeRO-2 = True，ZeRO-1 = False
# ZeRO-1：梯度仍每卡完整，all_reduce 后每卡都有
# ZeRO-2：梯度按 partition_id 归约到 owner，其余 rank 释放
```

所以从配置迁移时，`"stage": 1 → 2` 改变的只是 `partition_gradients` 这一支逻辑，参数 flatten 与 `param_group` 替换完全不变。这也解释了为什么 ZeRO-2 相比 ZeRO-1 的额外收益（2 B/参数）远小于 ZeRO-1 相比 baseline 的收益（12 B/参数）。

## 7.6 Offload：把公式里的 N 换成「存储层级」

`zero_optimization.offload_optimizer` / `offload_param` 把分片搬到 CPU NVMe，显存公式不变、只是分母变成 host 内存容量。代价是 PCIe 带宽（约 32 GB/s）远低于 HBM（约 3 TB/s），且需要 `param.ds_tensor.status` 这层独立状态机（ch08）。**offload 不是第三种分片，是把同一份分片换个地方放**——这一点在排查「显存够了但训练很慢」时特别有用：先看是不是每 step 都在 PCIe 上搬 13 GB 的 fp32 状态。

## 7.7 与 Megatron 自带优化器的等价性

| | ZeRO-1 | `DistributedOptimizer`（ch06） |
|---|---|---|
| 分片对象 | fp32 master + m + v | 同 |
| 分片域 | `dp_process_group` | `data_parallel_group` |
| 回写 | all-gather 回 bf16 参数 | all-gather 回 bf16 参数 |
| 梯度 | 每卡完整（ZeRO-1） | 每卡完整 |
| 实现层 | `param_group['params']` 替换 + Python hooks | Megatron 自定义 buffer + shard index map |

两者公式完全相同（`4Ψ + 12Ψ/N`），差别只在工程实现与生态。**这也是「Megatron-Core 单栈不需要 DeepSpeed」的定量依据**：想要的那一刀，Megatron 自己已经有了。

## 7.8 本章小结与坑

- 统一记号：Ψ 全局、Ψ_local = Ψ/(TP×PP)、N = DP；模型状态 16 B/参数（2+2+4+4+4）。
- 四阶段公式 `16Ψ / 4Ψ+12Ψ/N / 2Ψ+14Ψ/N / 16Ψ/N`；贯穿配置每卡 140 → 48.1 → 32.8 → 17.5 GB。
- ZeRO-1/2 核心是 `param_group['params'] = [本地 fp32 分片]`，一行代码让原生 Adam 只分配 1/N 状态。
- `reduce_scatter=True` 在 stage1/2 走 `allreduce_no_retain(rank=dst)`，不是 NCCL ReduceScatter。
- IPG bucket 双缓冲把归约与反向计算重叠，调优本质是时间窗匹配。
- **坑 1**：把全局 Ψ 与 Ψ_local 混用，显存估算会差 `TP×PP` 倍（本例 8 倍）。
- **坑 2**：公式不含激活、不含 KV cache，别拿它推算整卡占用。
- **坑 3**：叠 TP/PP 时 `dp_process_group` 必须排除模型并行 rank（ch09）。
- **坑 4**：`torch.compile` 下 grad hook 跑在不同 autograd stream，bucket 必须等所有生产流写完。
- **坑 5**：offload 后显存下降但 PCIe 成为瓶颈，先看 `ds_tensor.status` 再调显存参数。

> 下一章：ZeRO-3 把 `nn.Module` 的 forward/backward hooks 用到极致——参数在推理与训练中大部分时间只有 1/N 是「真实存在」的，本章把那个状态机与五步时序逐行展开。
