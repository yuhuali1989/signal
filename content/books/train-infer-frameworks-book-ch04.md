---
title: "大模型训练与推理框架源码全书 - 第4章: 64 卡的 rank 网格：进程组是怎么被造出来的"
book: "大模型训练与推理框架源码全书：从 PyTorch 原语到 Megatron、DeepSpeed 与 vLLM"
chapter: "4"
chapterTitle: "64 卡的 rank 网格：进程组是怎么被造出来的"
description: "用贯穿配置的 64 卡拓扑逐格算出 tp/pp/dp 三组 rank 列表，解释 RankGenerator 与 order 字符串如何决定通信落在 NVLink 还是 IB，并对照 vLLM 自建的并行组"
date: "2026-11-14"
updatedAt: "2026-11-14"
agent: "研究员→编辑→审校员"
tags:
  - "Megatron"
  - "进程组"
  - "并行拓扑"
  - "RankGenerator"
  - "源码拆解"
type: "book"
part: "篇二 · 训练结构改写"
---

# 第 4 章 · 64 卡的 rank 网格：进程组是怎么被造出来的

## 4.1 结论：一个 order 字符串决定了 30 GiB 通信走 NVLink 还是 IB

回到贯穿配置：8 节点 × 8 卡 = 64 卡，`TP=4 / PP=2 / DP=8`。第 1 章算过，一次 micro-batch 仅 TP 通信就约 **30 GiB**。这 30 GiB 是走机内 NVLink（~300 GB/s）还是跨机 IB（~25 GB/s 有效），不取决于硬件，取决于 `initialize_model_parallel()` 里那行 `order="tp-cp-ep-dp-pp"` 如何把 64 个 rank 排进网格。

**PyTorch 完全不知道 TP/DP 的语义**，它只接收一个 rank 列表然后 `new_group(ranks)`。把语义映射成列表，是 Megatron 在纯 Python 里算的。

## 4.2 从 order 到 rank 列表

【源码】`megatron/core/parallel_state.py::initialize_model_parallel`：

```python
token_rank_generator = RankGenerator(
    tp=tensor_model_parallel_size,      # 4
    ep=expert_model_parallel_size,      # 1（稠密模型）
    dp=data_parallel_size,              # 8
    pp=pipeline_model_parallel_size,    # 2
    cp=context_parallel_size,           # 1
    order="tp-cp-ep-dp-pp",
    rank_offset=0,
)
for ranks in token_rank_generator.get_ranks("tp"):
    group = create_group(ranks, group_desc="TENSOR_MODEL_PARALLEL_GROUP")
```

`RankGenerator` 把五个维度按 `order` 排成一条**从最内到最外**的轴，再用 `generate_masked_orthogonal_rank_groups()` 生成正交分组：对某个目标维度（如 `tp`），把该轴的 mask 设为全选，其余轴设为「固定」，枚举所有组合。

> 【推算】`order="tp-cp-ep-dp-pp"` 且 `cp=ep=1` 时，有效轴顺序为 `tp(4) → dp(8) → pp(2)`，步长（stride）：
> - `tp` 步长 = 1 → 连续 4 个 rank 构成一个 TP 组
> - `dp` 步长 = `tp = 4` → 同 DP 位置的 rank 相隔 4
> - `pp` 步长 = `tp × dp = 32` → 两个 stage 相隔 32
>
> 于是 rank 0 所在的三个组：
> ```
> TP 组  = [0, 1, 2, 3]
> DP 组  = [0, 4, 8, 12, 16, 20, 24, 28]
> PP 组  = [0, 32]
> ```
> 校验：`0 + 1×3 + 4×7 + 32×1 = 63` 是最后一个 rank ✅；三组大小分别 4/8/2，乘积 64 ✅。

把前 8 个 rank 摊开看拓扑含义：

| rank | 节点 | TP 位置 | PP stage | DP 位置 |
|---|---|---|---|---|
| 0 | 0 | 0 | 0 | 0 |
| 1 | 0 | 1 | 0 | 0 |
| 2 | 0 | 2 | 0 | 0 |
| 3 | 0 | 3 | 0 | 0 |
| 4 | 0 | 0 | 0 | 1 |
| 5 | 0 | 1 | 0 | 1 |
| 6 | 0 | 2 | 0 | 1 |
| 7 | 0 | 3 | 0 | 1 |

**rank 0-3 在同一节点**，于是每层 4 次 TP all-reduce 全部走 NVLink。这正是 order 把 `tp` 放最内侧的效果。若误配成 `order="dp-tp-pp..."`，TP 组会变成 `[0, 8, 16, 24]`——四张卡分属四个节点，30 GiB 通信全部跨机，吞吐直接崩掉。

> 【推算】按第 2 章公式，`TP=4` 单层单次 all-reduce 每卡 `96 MiB`，80 层 × 4 次 = `30 GiB`。NVLink 300 GB/s 下约 `0.10 s`；跨机 25 GB/s 下约 `1.2 s`。一个 micro-batch 的计算时间通常在百毫秒量级——**跨机 TP 会让通信变成主导项**，这不是调参能救的。

## 4.3 `create_group` 与 getter：唯一入口与全局状态

```python
# 【源码】parallel_state.py
def create_group(ranks, timeout=None, pg_options=None, group_desc=None, ...):
    return torch.distributed.new_group(ranks=ranks, **kwargs)   # ← 唯一底层入口

# 全局字典保存建好的组
_TENSOR_MODEL_PARALLEL_GROUP = None
_DATA_PARALLEL_GROUP = None
_PIPELINE_MODEL_PARALLEL_GROUP = None
...
def get_tensor_model_parallel_group(check_initialized=True):
    return _TENSOR_MODEL_PARALLEL_GROUP
```

模型的每一层通过 `get_tensor_model_parallel_group()` 取组，再传给 `mappings.py` 的 Function（ch05）。所以「通信发生在哪」这件事，本质是**初始化时建好的全局字典**，运行期不再决策。

【版本】这个模块开头已写明 `This module is being deprecated`：新代码要求显式传入 `ProcessGroupCollection` 对象，而不是依赖模块级全局状态。原因是全局状态在多实例（如同一进程里跑两个模型）、单元测试、以及与 `torch.compile` 组合时会互相污染。**当前 main 实现仍用手工 `new_group`，没有启用 `DeviceMesh` / `DTensor`**——这一点常被误传，ch09 会与 FSDP2 对照。

## 4.4 DP 组才是 ZeRO 的舞台

注意 `DP 组 = [0, 4, 8, ..., 28]`：这 8 个 rank 持有**完全相同的权重副本**（同一 TP 位置、同一 PP stage），只是吃不同的数据分片。因此：

- ZeRO 的优化器状态/梯度/参数分片，必须且只能在 DP 组内做；
- TP 组内的 4 个 rank 持有的是**同一份权重的不同切片**，不是副本，绝不能被 ZeRO 再切一次；
- PP 组内的 2 个 rank 持有的是**不同层**，也不能一起切。

这就是 Megatron-DeepSpeed 叠用时必须把 `mpu.get_data_parallel_group()` 传给 DeepSpeed 的原因（ch09）：如果不传，DeepSpeed 会用默认 group（含全部 64 卡）去做分片，相当于把 TP 切片和 PP 不同层混在一个「数据并行副本」里，梯度归约结果直接错。

> 【推算】贯穿配置下，一个 DP 组的 8 个 rank 合计持有完整权重 `140 GB / (TP×PP) = 17.5 GB` 的 8 份副本。ZeRO-1 只把 `840 GB` 的 fp32 优化器状态按 8 份切 → 每卡 `105 GB`；这一刀完全不动 TP/PP 的布局。ch07 会把这个数展开成完整公式。

## 4.5 vLLM 侧：同名概念、另一套组

推理拓扑 I 是单机 8 卡 `TP=8`。【源码】`vllm/distributed/parallel_state.py` 自建一组同名的全局变量：

```python
# vLLM 侧建组（概念对照，变量名按官方文档）
_TP = init_model_parallel_group(group_ranks, local_rank, backend, ...)
# 对外：get_tp_group().all_reduce / all_gather / ...
```

区别有三点，读代码时要分清：

| | Megatron 训练 | vLLM 推理 |
|---|---|---|
| 组的作用 | 前向 + **反向**都要通信 | 只有前向 |
| 是否含 PP/CP/EP | 五维齐全 | 主要 TP/PP/DP，EP 用于 MoE |
| 谁持有全局状态 | `parallel_state.py`（deprecated 中） | `parallel_state.py`（当前仍全局） |
| rank 列表来源 | `RankGenerator` + order | `initialize_model_parallel(tp, pp)` 直接枚举 |

**两套组互不认识**。训练的 checkpoint 里只存了「第 k 个 TP 切片」的权重张量，vLLM 加载时按自己的 `TP=8` 重新切分或合并——这是 ch14 的主线，不是进程组能直接复用的。

## 4.6 一条可复算的分组脚本

把 4.2 的推算写成能跑的代码，换任何拓扑都能验：

```python
def make_groups(tp=4, pp=2, dp=8, order="tp-cp-ep-dp-pp"):
    # 只处理 cp=ep=1 的稠密情形；轴顺序由 order 决定
    dims = {"tp": tp, "dp": dp, "pp": pp}
    axes = [a for a in order.split("-") if a in dims]
    stride, groups = 1, {}
    for a in axes:
        groups[a] = stride
        stride *= dims[a]
    assert stride == tp * dp * pp == 64

    def ranks_of(kind, r0=0):
        s, n = groups[kind], dims[kind]
        return [r0 + i * s for i in range(n)]

    return {k: ranks_of(k, 0) for k in axes}, groups

groups, strides = make_groups()
print(strides)      # {'tp': 1, 'dp': 4, 'pp': 32}
print(groups)       # {'tp': [0,1,2,3], 'dp': [0,4,8,...,28], 'pp': [0,32]}
assert ranks_all_covered(groups)   # 见下方说明：三组正交且并集覆盖 64 rank
```

> 校验方式：对任意 `a∈[0,4), b∈[0,8), c∈[0,2)`，`rank = a×1 + b×4 + c×32` 双射到 `0..63`。这就是 `generate_masked_orthogonal_rank_groups()` 在源码里做的事情，只是它用 `prefix_product` 与 `decompose` 支持任意维数与 mask。

## 4.7 本章小结与坑

- `order="tp-cp-ep-dp-pp"` 把 TP 放在最内轴 → `TP 组 = [0,1,2,3]` 同节点；DP 步长 4、PP 步长 32。
- PyTorch 只执行 `new_group(ranks)`，语义分组全由 `RankGenerator` 在 Python 层算出。
- DP 组是 ZeRO 唯一合法的分片域；TP/PP 组内 rank 不是副本。
- vLLM 自建同名组，与训练组不共享，checkpoint 转换必须显式处理。
- **坑 1**：`order` 配错让 TP 跨机，30 GiB 通信从 0.10s 变 1.2s，且没有任何报错。
- **坑 2**：多实例共用进程时，`parallel_state.py` 的模块级全局组会互相覆盖。
- **坑 3**：叠 DeepSpeed 时不传 `mpu` 的 DP 组，梯度归约域会包含 TP ranks，结果静默错误。
- **坑 4**：`TP × PP × DP ≠ world_size` 时初始化报错，但 `TP × PP × DP × CP × EP` 的层级关系更容易在加 CP 后算错。

> 下一章：拿着刚建好的 `tp_group`，看 `mappings.py` 那四个 Function 怎么用「前向恒等 ↔ 反向归约」的对偶，把通信插进 autograd 图。
