---
title: "大模型训练与推理框架源码全书 - 第5章: 张量并行源码：四个 Function 与每层四次 all-reduce"
book: "大模型训练与推理框架源码全书：从 PyTorch 原语到 Megatron、DeepSpeed 与 vLLM"
chapter: "5"
chapterTitle: "张量并行源码：四个 Function 与每层四次 all-reduce"
description: "逐行展开 mappings.py 的四个 region autograd.Function 对偶、Column 与 RowParallelLinear 的权重 shape 和前向代码，算出每层四次 all-reduce 的通信量，并说明序列并行如何把它换成 reduce-scatter"
date: "2026-11-14"
updatedAt: "2026-11-14"
agent: "研究员→编辑→审校员"
tags:
  - "Megatron"
  - "张量并行"
  - "autograd"
  - "序列并行"
  - "源码拆解"
type: "book"
part: "篇二 · 训练结构改写"
---

# 第 5 章 · 张量并行源码：四个 Function 与每层四次 all-reduce

## 5.1 结论：TP 的模型代码里没有一句 `dist.*`

【源码】`megatron/core/tensor_parallel/mappings.py` 定义了四个自定义 `torch.autograd.Function`，把集合通信写成「前向或反向」的副作用。于是 `layers.py` 里的线性层看起来和普通 `nn.Linear` 一样干净，通信却在 autograd 图中自动闭合。

这是全书最值得逐行读的一个文件——它把第 2 章的「原语②」用到了极致。

## 5.2 四个 region Function 的对偶结构

```python
# 【源码】mappings.py（精简掉断言与 group 默认参数）

# ① 进入 TP 区：前向恒等，反向对梯度 all-reduce
class _CopyToModelParallelRegion(torch.autograd.Function):
    @staticmethod
    def forward(ctx, input_, group):
        ctx.group = group
        return input_                                   # 恒等
    @staticmethod
    def backward(ctx, grad_output):
        return _reduce(grad_output, ctx.group), None     # dist.all_reduce

# ② 离开 TP 区：前向 all-reduce，反向恒等（① 的对偶）
class _ReduceFromModelParallelRegion(torch.autograd.Function):
    @staticmethod
    def forward(ctx, input_, group):
        return _reduce(input_, group)                   # dist.all_reduce
    @staticmethod
    def backward(ctx, grad_output):
        return grad_output, None                        # 恒等

# ③ 收集：前向 all-gather，反向本地 split
class _GatherFromModelParallelRegion(torch.autograd.Function):
    @staticmethod
    def forward(ctx, input_, group):
        return _gather_along_first_dim(input_, group)
    @staticmethod
    def backward(ctx, grad_output):
        return _split_along_first_dim(grad_output, ...), None

# ④ 散开：前向本地 split，反向 all-gather（③ 的对偶）
class _ScatterToModelParallelRegion(torch.autograd.Function):
    @staticmethod
    def forward(ctx, input_, group):
        return _split_along_first_dim(input_, ...)
    @staticmethod
    def backward(ctx, grad_output):
        return _gather_along_first_dim(grad_output, group), None
```

| 公开函数 | 前向 | 反向 | 用在哪 |
|---|---|---|---|
| `copy_to_tensor_model_parallel_region` | 恒等 | all-reduce | Column 的输入 |
| `reduce_from_tensor_model_parallel_region` | all-reduce | 恒等 | Row 的输出 |
| `gather_from_tensor_model_parallel_region` | all-gather | split | 需要完整输出时 |
| `scatter_to_tensor_model_parallel_region` | split | all-gather | 输入已是分片时 |

**为什么必须成对**：设 TP 区内第 k 卡算局部输出 `y_k`，真值 `y = Σ y_k`。若前向在出口做 all-reduce（②），那么反向传进来的 `∂L/∂y` 已经是「对完整 y 的梯度」，它在每卡上是同一份，直接透传给各卡的 `y_k` 即可（② 的 backward 恒等）。而入口处（①）各卡的输入 `x` 是复制的，`∂L/∂x = Σ_k ∂L/∂x_k`，所以反向必须在入口 all-reduce 一次。**一次前向归约 + 一次反向归约，恰好补齐两个方向的求和**，多一次就重复、少一次就缺项。

> ★【源码】一个真实陷阱：`scatter_to_tensor_model_parallel_region` 的 docstring 写着 `forward: RS, backward: AG`，但实际 `_ScatterToModelParallelRegion.forward` 只调 `_split_along_last_dim`（本地切分），**没有调 reduce_scatter**；backward 才是 all-gather。按注释去理解会算错通信量。这类「注释与实现不符」在快速迭代的仓库里不算罕见，凡涉及性能结论一律以代码为准。

## 5.3 两个 ParallelLinear 的权重 shape

【源码】`megatron/core/tensor_parallel/layers.py`：

```python
class ColumnParallelLinear(torch.nn.Module):
    def __init__(self, input_size, output_size, *, gather_output=True, ...):
        self.output_size_per_partition = divide(output_size, tp_size)   # partition_dim=0
        self.weight = Parameter(torch.empty(
            self.output_size_per_partition, input_size, **factory_kwargs))

    def forward(self, input_):
        input_parallel = copy_to_tensor_model_parallel_region(input_, group=self.tp_group)
        output_parallel = self._forward_impl(input=input_parallel, weight=self.weight, ...)
        if self.gather_output:
            output = gather_from_tensor_model_parallel_region(output_parallel, group=tp_group)
        else:
            output = output_parallel          # 保持分片，直接喂给 Row
        return output, bias

class RowParallelLinear(torch.nn.Module):
    def __init__(self, input_size, output_size, *, input_is_parallel=False, ...):
        self.input_size_per_partition = divide(input_size, tp_size)     # partition_dim=1
        self.weight = Parameter(torch.empty(
            output_size, self.input_size_per_partition, **factory_kwargs))
        self.bias = Parameter(...) if bias else None                     # ★ bias 不分片

    def forward(self, input_):
        input_parallel = input_ if self.input_is_parallel else \
                         scatter_to_tensor_model_parallel_region(input_, group=tp_group)
        output_parallel = self._forward_impl(input=input_parallel, weight=self.weight, ...)
        if self.sequence_parallel:
            output_ = reduce_scatter_to_sequence_parallel_region(output_parallel, group=tp_group)
        else:
            output_ = reduce_from_tensor_model_parallel_region(output_parallel, group=tp_group)
        return output_, bias
```

**代入贯穿配置**（`h=8192`、`f=28672`、`TP=4`，故每片 `7168`）：

| 层 | 全局权重 | 每卡权重 | 分片轴 | 单卡参数量 |
|---|---|---|---|---|
| QKV（Column，合并计） | `[8192+2×1024, 8192]` | `[2560, 8192]` | dim 0 | 20.97 M |
| Attention out-proj（Row） | `[8192, 8192]` | `[8192, 2048]` | dim 1 | 16.78 M |
| MLP up/gate（各 Column） | `[28672, 8192]` | `[7168, 8192]` | dim 0 | 58.72 M |
| MLP down（Row） | `[8192, 28672]` | `[8192, 7168]` | dim 1 | 58.72 M |

> 【推算】QKV 的 shape 来自 GQA：`64 heads × 128 = 8192`，`8 kv_heads × 128 = 1024`，合计 `8192 + 2×1024 = 10240`；除以 `TP=4` 得 `2560`。每卡 `2560×8192 = 20 971 520`。四个张量合计每卡约 `155 M` 参数，×4 卡 = `621 M` / 层，×80 层 ≈ `49.7 B`，与 70B 量级（含 embedding 与 norm）自洽。

## 5.4 为什么是「每层 4 次 all-reduce」

一个标准 Transformer 层的 TP 边界有两处：

```
Input (复制)
  └─ Column(QKV / up / gate)：入口 ① copy（前向恒等）
       → 各卡算局部输出，保持分片
  └─ Row(out-proj / down)：入口直接吃分片（input_is_parallel=True）
       → 出口 ② reduce（前向 all-reduce）        ← 前向第 1、2 次
反向：
  └─ Row 的入口梯度要 split（若用了 scatter 的对偶）
  └─ Column 入口 ① 的 backward 做 all-reduce    ← 反向第 1、2 次（两个 Column 分支）
```

| 边界 | 前向 | 反向 |
|---|---|---|
| attention 的 Row 输出 | all-reduce ×1 | （恒等） |
| MLP 的 Row 输出 | all-reduce ×1 | （恒等） |
| attention 的 Column 输入 | （恒等） | all-reduce ×1 |
| MLP 的 Column 输入 | （恒等） | all-reduce ×1 |
| **合计** | **2** | **2** |

> 【推算】沿用第 1 章：`[seq×batch, h] = [4096, 8192]` bf16 = `64 MiB`，`TP=4` 单次 all-reduce 每卡 `2×64×3/4 = 96 MiB`。一层 4 次 = `384 MiB`；80 层 = `30 GiB` / micro-batch；梯度累积 64 步 = **1.88 TiB** / optimizer step。这就是 ch04 里「order 必须把 TP 锁在同节点」的全部依据。

**注意 `gather_output=False` 的意义**：Column 与 Row 相邻时，中间结果保持分片、不做 all-gather，省掉一次通信。源码里 MLP 正是 `ColumnParallelLinear(..., gather_output=False)` + `RowParallelLinear(..., input_is_parallel=True)` 的固定搭配。

## 5.5 序列并行：把 all-reduce 换成 reduce-scatter

TP 只切权重，LayerNorm / Dropout 的激活仍是**每卡完整复制**。Sequence Parallel（SP）把这部分沿 sequence 维也切了，代价是 TP 边界的通信要换类型：

| 位置 | 非 SP | SP |
|---|---|---|
| Row 出口 | `reduce_from_tensor_model_parallel_region`（all-reduce） | `reduce_scatter_to_sequence_parallel_region`（reduce-scatter） |
| Column 入口 | `copy_to_tensor_model_parallel_region`（f 恒等 / b all-reduce） | 前向 `all_gather` 收集完整序列、反向 `reduce_scatter` |

```python
# 【源码】layers.py 中 SP 分支的关键两行
if self.sequence_parallel and self.tp_size > 1:
    input_parallel = all_gather_last_dim_from_tensor_parallel_region(input_, group=tp_group)
...
if self.sequence_parallel:
    output_ = reduce_scatter_to_sequence_parallel_region(output_parallel, group=tp_group)
```

> 【推算】通信量上 all-reduce `2n(N-1)/N` 与 reduce-scatter `2n(N-1)/N` 相同——**SP 不省通信，省的是激活显存**。设激活张量 `[seq=4096, batch=1, h=8192]` bf16 = `64 MiB`，原每卡复制一份；SP 后每卡只存 `64/4 = 16 MiB`，省 `48 MiB` / 层。80 层约省 `3.75 GiB` / 卡，用来换更长上下文或更大 micro-batch。这个数比很多「并行策略对比表」里的定性描述更值得记住。

## 5.6 与推理侧 TP 的对照

vLLM 加载同一个 70B 模型，`TP=8`，权重切片规则与 Megatron 的 Column/Row 语义一致（【源码】`vllm/model_executor/layers/linear.py` 里同样有 `ColumnParallelLinear` / `RowParallelLinear`）：

```python
# 推理侧只有前向：Row 出口一次 all_reduce，没有反向对偶
if self.tp_size > 1 and not self.skip_all_reduce:
    torch.distributed.all_reduce(output_, group=self.tp_group)
```

差别就一条：**训练要在 autograd 图里补对称通信，推理只需前向归约**。所以同一份权重，训练的 TP 通信量约为推理前向的 2 倍；而 vLLM 的 `TP=8` 把每卡权重压到 `140 GB / 8 = 17.5 GB`，给 KV cache 留出空间（ch13）。

## 5.7 一次 forward 的完整数字（把本章收口）

用贯穿配置，rank 0 上一个 Transformer 层：

| 步骤 | 张量 shape | 每卡字节 | 通信 |
|---|---|---|---|
| 输入 `x` | `[4096, 8192]` | 64 MiB | 复制，无通信 |
| QKV Column 输出 | `[4096, 2560]` | 20 MiB | 入口 f 恒等 |
| attention 局部计算 | `[16 heads, 4096, 128]` | — | — |
| Row out-proj 输出 | `[4096, 8192]` | 64 MiB | **all-reduce 96 MiB** |
| up/gate Column 输出 | `[4096, 7168]` ×2 | 112 MiB | 入口 f 恒等 |
| down Row 输出 | `[4096, 8192]` | 64 MiB | **all-reduce 96 MiB** |
| 反向对称 | — | — | **all-reduce 96 MiB ×2** |
| **合计通信** | | | **384 MiB / 层** |

## 5.8 本章小结与坑

- 四个 region Function 两两对偶：copy↔reduce、gather↔scatter，把通信藏进 autograd 前向/反向。
- `ColumnParallelLinear` 按 dim 0 切（`[7168, 8192]`），`RowParallelLinear` 按 dim 1 切（`[8192, 7168]`），bias 不分片。
- 每层 4 次 all-reduce（前向 2 + 反向 2），80 层约 30 GiB / micro-batch。
- SP 换通信类型而非通信量，省的是激活显存：每卡约 3.75 GiB（80 层）。
- **坑 1**：`scatter_to_tensor_model_parallel_region` 的 docstring 与实现不符，别按注释算 RS。
- **坑 2**：相邻 Column→Row 必须 `gather_output=False` + `input_is_parallel=True`，否则多一次 all-gather。
- **坑 3**：GQA 的 `kv_heads=8` 在 `TP=8` 时刚好每卡 1 个 KV head；`TP>8` 无法整除，需要复制 KV head（vLLM 的 `num_kv_heads_replicas`），别硬除。
- **坑 4**：忘了 `CUDA_DEVICE_MAX_CONNECTIONS=1`，异步 all-reduce 与 wgrad GEMM 的重叠退化。
- **坑 5**：SP 与某些自定义 attention 后端不兼容，开启前确认 backend 支持序列分片。

> 下一章：TP 解决「一层放不下」，PP / CP / EP 分别解决「整个模型放不下」「序列太长」「专家太多」，并看 Megatron 自带的分布式优化器为什么等价于 ZeRO-1。
