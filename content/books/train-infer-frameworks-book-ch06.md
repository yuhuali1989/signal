---
title: "大模型训练与推理框架源码全书 - 第6章: PP、CP、EP 与分布式优化器：TP 之外的四维"
book: "大模型训练与推理框架源码全书：从 PyTorch 原语到 Megatron、DeepSpeed 与 vLLM"
chapter: "6"
chapterTitle: "PP、CP、EP 与分布式优化器：TP 之外的四维"
description: "展开 1F1B 流水线调度的气泡公式与 p2p 张量 shape、上下文并行与序列并行的区别、专家并行的 all-to-all，并说明 Megatron 自带 DistributedOptimizer 为什么等价于 ZeRO-1"
date: "2026-11-14"
updatedAt: "2026-11-14"
agent: "研究员→编辑→审校员"
tags:
  - "Megatron"
  - "流水线并行"
  - "专家并行"
  - "分布式优化器"
  - "源码拆解"
type: "book"
part: "篇二 · 训练结构改写"
---

# 第 6 章 · PP、CP、EP 与分布式优化器：TP 之外的四维

## 6.1 结论：四个维度解决四件不同的事

| 维度 | 解决什么 | 切的对象 | 主通信原语 |
|---|---|---|---|
| TP（ch05） | 单层权重放不下 | 权重矩阵的行/列 | `all_reduce` |
| PP | 整个模型放不下 | 层（80 层切成 2 段） | `send` / `recv` |
| CP | 单条序列的注意力太长 | sequence 维（在 TP 之外再切） | `all_gather` / `reduce_scatter`（KV） |
| EP | MoE 专家太多 | 专家集合 | `all_to_all` |
| DP（ch07） | 吞吐不够 | 数据批次 | `all_reduce`（梯度） |

贯穿配置 T 里 `PP=2` 意味着 rank 0-31 拿第 1~40 层、rank 32-63 拿第 41~80 层（ch04 算过 `PP 组 = [0, 32]`）。

## 6.2 PP：1F1B 与气泡

【源码】`megatron/core/pipeline_parallel/schedules.py::forward_backward_pipelining_without_interleaving`（非交错 1F1B）。它把 `global_batch / micro_batch` 拆成 m 个 micro-batch，手动排三阶段：

```
warmup   : stage i 先做 (p - i - 1) 次前向，把流水线填满
steady   : 交替 1 次前向 + 1 次反向（One Forward One Backward）
cooldown : 把剩余反向做完，排空气泡
```

```python
# 【源码】schedules.py 主循环骨架（变量名保留）
num_warmup_microbatches = pipeline_world_size - pipeline_rank - 1
for i in range(num_microbatches):
    if is_forward_step(i):
        output_tensor = forward_step(...)          # 本 stage 计算
        if not is_last_stage:
            p2p_communication.send_forward(output_tensor, ...)
    if is_backward_step(i):
        input_tensor_grad = p2p_communication.recv_backward(...)
        output_tensor_grad = backward_step(...)
        p2p_communication.send_backward(output_tensor_grad, ...)
```

**p2p 传的是什么**：【源码】`p2p_communication.py` 里 stage 间传的张量 shape 是 `[seq, batch, hidden]`。代入贯穿配置：

> 【推算】`[4096, 1, 8192]` bf16 = `4096×8192×2 = 67 108 864 B = 64 MiB`。前向每 micro-batch 传一次、反向传同尺寸的梯度一次 = `128 MiB` / micro-batch / stage 边界。64 个 micro-batch、`PP=2` 只有一个边界 → `8 GiB` / optimizer step。对比 ch05 的 TP 通信 `1.88 TiB`：**PP 的通信量比 TP 小两个数量级**，这也是 PP 可以跨机、TP 不行的数据依据。

**气泡公式**（非交错 1F1B，p 个 stage、m 个 micro-batch）：

```
bubble_fraction = (p - 1) / (m + p - 1)
```

> 【推算】`p=2, m=64` → `1 / 65 ≈ 1.54%`。若把 micro_batch 调大导致 `m=8`，气泡升到 `1/9 ≈ 11.1%`。所以 PP 的效率高度依赖 **m 相对 p 足够大**；`m < p` 时流水线基本是空的。这条比任何调参口诀都实用。

`--num-layers-per-virtual-pipeline-stage` 开启交错（interleaved）调度后，每个物理 stage 承担多个不连续的 chunk，气泡进一步降到 `(p-1)/(v·m + p - 1)` 量级，代价是 p2p 通信次数增加与调度代码复杂度上升。

## 6.3 CP：与 SP 只差「注意力看不看全序列」

先分清两个都切 sequence 的维度，这是最常被混的一组概念：

| | Sequence Parallel（SP，ch05） | Context Parallel（CP） |
|---|---|---|
| 切在哪 | TP 组**内部**，配合 TP 使用 | 独立的 CP 组，与 TP 正交 |
| 切什么 | LayerNorm / Dropout 等 TP 无法切的部分的激活 | Q/K/V 的 sequence 维，注意力本身分片 |
| 通信 | all-gather + reduce-scatter | 注意力前对 KV 做 all-gather / ring-attention 式传递 |
| 目的 | 省激活显存 | 让单条超长序列（如 128K）能放得下 |
| 进程组 | 复用 `tp_group` | `cp_group`（ch04 的 `order` 里排在 tp 之后） |

【源码】Megatron 的 CP 实现在 `megatron/core/transformer/attention.py` 与 `context_parallel/` 相关路径，核心是把 `[seq, ...]` 切成 CP 份后，用通信把远端 KV 取到本地算局部注意力，再 `reduce_scatter` 回梯度。它不改变权重切分，所以与 TP 可叠加；ch04 的 `order="tp-cp-ep-dp-pp"` 正是把 CP 排在 TP 之后、保证二者都不跨机。

> 【推算】贯穿配置 `seq=4096` 其实用不上 CP；若换成 128K，单卡 Q/K/V 激活 `4 × 131072 × 8192 × 2 B ≈ 8.6 GiB`，`CP=8` 后每卡约 `1.07 GiB`。这也解释了为什么长上下文训练里 CP 与激活重算往往同时开。

## 6.4 EP：all-to-all 是唯一原语

MoE 层里，每个 token 由 router 选 top-k 个专家，而专家分布在不同 EP rank 上，所以必须先按「目标专家」重排 token：

```python
# 【源码】megatron/core/transformer/moe/ 里的分发骨架
# 1) 本地按 expert_id 排序、计数
local_tokens, counts = permute(tokens, topk_ids)
# 2) all_to_all：把属于别的 rank 专家的 token 发出去，同时收下属于自己的
dispatched = all_to_all(local_tokens, group=ep_group)     # torch.distributed.all_to_all_single
# 3) 本地专家 FFN
expert_out = experts(dispatched)
# 4) 反向 all_to_all 送回原 rank，再 unpermute 恢复顺序
out = unpermute(all_to_all(expert_out, group=ep_group), ...)
```

两点值得记：

- EP 的通信量随 **token 数 × top-k × hidden** 线性增长，且不随专家参数量增长——所以专家很多但每 token 只激活 2 个时，EP 反而比 TP 便宜；
- EP 与 TP 可以组合（TP 切专家内部的权重、EP 切专家集合），但进程组必须正交，ZeRO 的 DP 域仍需排除 EP 与 TP（ch09）。

> 【推算】`batch×seq = 4096` token、`top-2`、`h=8192` bf16：单次分发 `4096×2×8192×2 B = 128 MiB`，往返 `256 MiB` / MoE 层。若一层有 8 个专家分散在 8 卡，每卡实际只处理约 `4096×2/8 = 1024` 个 token 的专家计算——**通信换稀疏计算**，这是 MoE 的经济学本质。

## 6.5 自带的 DistributedOptimizer 就是 ZeRO-1

一个过时认知是「Megatron 必须叠 DeepSpeed 才能省优化器显存」。实际上【源码】`megatron/core/optimizer/distrib_optimizer.py::DistributedOptimizer` 已经把 fp32 master weights、momentum、variance 按 DP 组分片：

```python
# 【源码】distrib_optimizer.py 的分区骨架
# 1) 把本 rank 持有的 bf16 参数 flatten → 按 DP world size 切成 shard
self.model_float16_groups = ...
self.shard_float16_groups, self.shard_fp32_from_float16_groups = \
    _build_model_gbuf_param_shard_index_map(...)
# 2) Adam 的 exp_avg / exp_avg_sq 只在自己的 shard 上分配
# 3) step() 只更新 shard，随后把更新后的参数 all-gather 回各 DP rank
dist.all_gather(..., group=self.data_parallel_group)
```

它分片的对象与 DeepSpeed ZeRO-1 完全相同（12 B/参数的 fp32 状态），不分片 bf16 参数与梯度。所以：

| 组合 | 谁做 TP/PP | 谁做优化器分片 | 是否需要 DeepSpeed |
|---|---|---|---|
| Megatron-Core 单栈 | Megatron | `DistributedOptimizer`（ZeRO-1） | **不需要** |
| 历史缝合版 Megatron-DeepSpeed | Megatron | DeepSpeed ZeRO-1/2/3 | 需要，但要传 `mpu`（ch09） |

> 【推算】用贯穿配置核对第 2 章那个容易混的口径：全局 Ψ=70B，`TP×PP=8` 后**每卡持有 Ψ_local = 8.75 B 参数**；未分片时每卡模型状态 `16 B × 8.75e9 = 140 GB`，其中 fp32 master+m+v 占 `12 B × 8.75e9 = 105 GB`。`DistributedOptimizer` / ZeRO-1 按 `DP=8` 把这 105 GB 切成 `13.1 GB`，每卡总模型状态降到 `140 − 105 + 13.1 = 48.1 GB`。全局口径 `840 GB / 8 = 105 GB` 与「每卡未分片优化器状态 105 GB」数值相同纯属 `TP×PP = DP` 的巧合，别把两个口径混用——ch07 会用统一符号重新推一遍。

## 6.6 激活重算：与前面所有维度正交

【源码】`torch.utils.checkpoint` 在 Megatron 里由 `--recompute-activations` / `--recompute-granularity` 控制，只保存每个 Transformer 层的输入，反向时重算层内激活。DeepSpeed 侧则要处理 reentrant backward 导致的 hook 重复触发（第 2 章提过的 `reenter_backward_if_needed()`）。

> 【推算】不重算时 80 层激活按每层约 `64 MiB`（不含 attention 中间量）粗估 `5 GiB` 量级；全量重算可压到只存层输入约 `64 MiB/层 × 80` 的很小一部分，代价是约 **30% 额外前向计算**。它是长上下文训练里性价比最高的一刀，因为它和 TP/PP/CP/EP/DP 全部正交。

## 6.7 五维通信量总表（贯穿配置，一个 micro-batch）

| 维度 | 通信原语 | 每卡通信量 | 走哪 | 可否跨机 |
|---|---|---|---|---|
| TP=4 | all-reduce | 384 MiB × 80 层 = **30 GiB** | NVLink | ❌ |
| PP=2 | send/recv | 128 MiB | IB | ✅ |
| DP=8（无 ZeRO） | all-reduce 梯度 | `2×17.5 GB×7/8 ≈ 30.6 GB` | IB | ✅ |
| CP=1 | — | 0 | — | — |
| EP=1 | — | 0 | — | — |

这张表把「为什么 TP 必须机内、PP/DP 可以跨机」变成了可核对的数字，也是 ch04 那个 `order` 字符串的经济学解释。

## 6.8 本章小结与坑

- PP 用 1F1B 手动排 micro-batch，气泡 `(p-1)/(m+p-1)`；`p=2,m=64` 只有 1.54%。
- p2p 传 `[seq, batch, hidden]`，每个 micro-batch 往返 128 MiB，比 TP 小两个数量级。
- CP 切注意力的序列维、SP 切 TP 区内非权重部分的激活，两者正交且组不同。
- EP 靠 all-to-all 重排 token，通信量随 token 数而非专家参数量增长。
- `DistributedOptimizer` 就是 ZeRO-1，Megatron-Core 单栈不需要 DeepSpeed。
- **坑 1**：`m` 太小时 PP 气泡暴涨，调大 micro_batch 反而更慢。
- **坑 2**：DeepSpeed 的 `PipelineModule` 与 Megatron PP 是两套实现，不能同开。
- **坑 3**：加 CP 后 `TP×PP×DP×CP×EP` 必须仍等于 world_size，`order` 里 CP 位置决定它是否跨机。
- **坑 4**：MoE 下 ZeRO-3 需要用 `z3_leaf_module` 标记专家模块，否则未参与本次迭代的专家梯度会丢（ch08）。
- **坑 5**：全量激活重算约 +30% 计算，别在算力已饱和时盲目开。

> 下一篇换视角：Megatron 改的是模型结构，DeepSpeed 一行模型代码都不改，它改的是「参数和优化器状态存在哪、什么时候可用」。第 7 章从 `16Ψ` 这笔显存账开始。
