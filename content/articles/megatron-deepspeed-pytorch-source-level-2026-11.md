---
title: "Megatron / DeepSpeed / PyTorch：三个框架在哪些代码层握手"
description: "把三者拆成「运行时 + 结构改写 + 状态改写」三层，逐条给出 PyTorch 的七个扩展点、真实源码路径与方法签名。含张量并行的前向反向通信对偶、ZeRO 三阶段显存公式与可算数字、ZeRO-3 的 hook 时序、FSDP2 分野与叠用约束。"
date: "2026-11-14"
updatedAt: "2026-11-14"
agent: "研究员→编辑→审校员"
tags:
  - "训练与对齐"
  - "AI Infra"
  - "模型架构"
  - "Megatron-LM"
  - "DeepSpeed"
type: "article"
---

# Megatron / DeepSpeed / PyTorch：三个框架在哪些代码层握手

> 结论先行：这三者不是同一层的东西，**也不互相调用**。PyTorch 提供运行时与扩展点；**Megatron 改写模型结构**（在 `nn.Module` 里切权重、在 `autograd.Function` 里补通信）；**DeepSpeed 改写训练状态**（在 `Parameter.data` 里换存储、在模块 hooks 里调度 gather/partition）。它们的唯一交集是同一批 `torch.distributed.ProcessGroup`、同一个 autograd 引擎、同一套 CUDA caching allocator。

本文基于 NVIDIA/Megatron-LM main 与 microsoft/DeepSpeed master 源码整理。★一个容易踩的检索陷阱：DeepSpeed 的 ZeRO-3 文件名是 `deepspeed/runtime/zero/stage3.py`（**无下划线**），`stage_3.py` 会 404。

---

## 一、先定层次

| | 改的是什么 | 主要手段 | 是否依赖对方 |
|---|---|---|---|
| **PyTorch** | 运行时本身 | Tensor / autograd / c10d / allocator / hooks | — |
| **Megatron-LM** | 模型结构 | `ColumnParallelLinear` / `RowParallelLinear`、自定义 `autograd.Function`、PP schedule | 否 |
| **DeepSpeed** | 训练状态 | ZeRO 分片 optimizer states / grad / param、Module hooks、CPU/NVMe offload | 否 |

一句话记忆：**Megatron 动「算子怎么算」，DeepSpeed 动「参数放在哪、梯度什么时候归约」，PyTorch 只负责提供可以让它们动手的地方。**

---

## 二、七个 PyTorch 扩展点，逐条对号入座

| # | PyTorch 扩展点 | Megatron 用在哪 | DeepSpeed 用在哪 |
|---|---|---|---|
| ① | `torch.autograd.Function` | 4 个 region Function，在 `forward`/`backward` 里插 all-reduce / all-gather | 不主用，改用 grad hooks |
| ② | `nn.Module` forward/backward hooks | PP schedule 手动编排层间激活 | ZeRO-3 的 fetch / release 生命周期、梯度归约入口 |
| ③ | `nn.Parameter` / `Tensor.data` 替换 | 权重按轴切分后直接存本地 `Parameter` | `param.ds_tensor`；`p.data = flat_group.narrow(...)` |
| ④ | `torch.distributed.ProcessGroup` | `new_group` 手工造 tp/pp/dp/cp/ep 组 | `from deepspeed import comm as dist` 包一层 |
| ⑤ | `torch.utils.checkpoint` | 选择性激活重算 | checkpointing + `reenter_backward_if_needed()` 处理重入 |
| ⑥ | CUDA allocator / stream / event | 异步 all-reduce 与 wgrad 的发射顺序 | IPG bucket 双缓冲、`record_stream`、`ready_events` |
| ⑦ | `torch.compile` / DTensor / DeviceMesh | ★当前未用，正迁移到显式 `ProcessGroupCollection` | FSDP2 是 ZeRO-3 的 PyTorch 原生等价，分片下沉到 dispatch 层 |

第 ⑦ 条是判断「新旧方案」的分水岭：`megatron/core/parallel_state.py` 文件头已标注 **deprecated**，明确要求「New features must use explicit process groups」，getter 的 docstring 都写着「Use the caller-provided pg_collection.tp group」。但当前实现仍是手工 `new_group`，**没有用 DeviceMesh 或 DTensor**。

---

## 三、扩展点①：Megatron 的四个 region Function

全部在 `megatron/core/tensor_parallel/mappings.py`。最经典的一对是**前向恒等、反向归约**与它的镜像：

```python
class _CopyToModelParallelRegion(torch.autograd.Function):
    @staticmethod
    def forward(ctx, input_, group):
        ctx.group = group
        return input_                              # 前向什么都不做
    @staticmethod
    def backward(ctx, grad_output):
        return _reduce(grad_output, ctx.group), None   # 反向 all_reduce

class _ReduceFromModelParallelRegion(torch.autograd.Function):
    @staticmethod
    def forward(ctx, input_, group):
        return _reduce(input_, group)              # 前向 all_reduce
    @staticmethod
    def backward(ctx, grad_output):
        return grad_output, None                   # 反向恒等

def _reduce(input_, group):
    if group.size() == 1:
        return input_
    input_ = input_.contiguous()
    torch.distributed.all_reduce(input_, group=group)
    return input_
```

这解释了 TP 的关键性质：**一次 all-reduce 被拆到「前向」或「反向」中的一侧，靠 autograd 图自动补齐另一侧**。用户写的 `model(x)` 里看不到任何 `dist` 调用。

另外两个是 `_GatherFromModelParallelRegion`（forward `all_gather_into_tensor` + `torch.cat(dim=-1)`、backward 本地 split）与 `_ScatterToModelParallelRegion`（forward 本地 split、backward all-gather）。★注意源码里 `scatter_to_tensor_model_parallel_region` 的 docstring 写的是「forward: RS, backward: AG」，但**实际 forward 没有调用 `reduce_scatter_tensor`**，只是本地 split——别被注释带偏。

---

## 四、扩展点④：进程组怎么造出来

```python
# megatron/core/parallel_state.py
def create_group(ranks=None, timeout=None, backend=None, pg_options=None,
                 use_local_synchronization=False, group_desc=None):
    kwargs = {...}
    group = torch.distributed.new_group(**kwargs)
    ...

token_rank_generator = RankGenerator(
    tp=tensor_model_parallel_size, ep=1, dp=data_parallel_size,
    pp=pipeline_model_parallel_size, cp=context_parallel_size,
    order="tp-cp-ep-dp-pp")            # 默认值，决定 rank 拓扑

for ranks in token_rank_generator.get_ranks("tp"):
    group = create_group(ranks, pg_options=get_nccl_options("tp", ...),
                         group_desc="TENSOR_MODEL_PARALLEL_GROUP")
```

`RankGenerator.get_ranks(token)` 用 `generate_masked_orthogonal_rank_groups()` 按 mask 生成正交 rank 列表，再逐个 `new_group`。`order` 决定哪些并行度落在同一节点内——**TP 必须排在内侧走 NVLink，PP/DP 才能跨机**。NCCL 侧还能直接配 `torch.distributed.ProcessGroupNCCL.Options(is_high_priority_stream=..., config.max_ctas=...)`。

DeepSpeed 则统一走 `deepspeed/comm/`，本质是对 `torch.distributed` 的薄封装，因此两边可以共用一组 `ProcessGroup` 句柄，这也是 Megatron-DeepSpeed 能缝合的技术前提。

---

## 五、Megatron 的 TP：shape 与每层 4 次 all-reduce

`megatron/core/tensor_parallel/layers.py`：

```python
# ColumnParallelLinear：按输出维切，partition_dim=0
self.output_size_per_partition = divide(output_size, world_size)
weight = torch.empty(self.output_size_per_partition, self.input_size, ...)

# RowParallelLinear：按输入维切，partition_dim=1，bias 不分片
self.input_size_per_partition = divide(input_size, world_size)
weight = torch.empty(self.output_size, self.input_size_per_partition, ...)
```

以 `hidden=4096`、`ffn=11008`、`TP=4` 为例：每卡 `Column.weight = [2752, 4096]`，`Row.weight = [4096, 2752]`。`RowParallelLinear.forward()` 的收尾分支：

```python
if self.sequence_parallel:
    output_ = reduce_scatter_to_sequence_parallel_region(output_parallel, group=self.tp_group)
else:
    output_ = reduce_from_tensor_model_parallel_region(output_parallel, group=self.tp_group)
```

一个 Transformer 层（attention 的 QKV/out proj + MLP 的 up/down proj）在 TP 下共 **4 次 all-reduce**：前向 2 次（两个 RowParallel 输出）、反向 2 次（两个 ColumnParallel 的 dgrad）。通信量正比于 `batch × seq × hidden`，所以 TP 只能放在 NVLink 域内。

开启 **Sequence Parallel** 后，这对 all-reduce 被换成 `reduce_scatter`（Row 输出）+ `all_gather`（Column 输入），激活按 sequence 维切分，LayerNorm / Dropout 部分的显存也跟着降到 1/TP。底层 `LinearWithGradAccumulationAndAsyncCommunication` 还会用 `async_op=True` 把 dgrad all-reduce 与 wgrad GEMM 重叠——★这依赖 `CUDA_DEVICE_MAX_CONNECTIONS=1` 保证 NCCL 通信先于计算发射，源码里专门有 warning。

PP 侧则是另一套：`megatron/core/pipeline_parallel/schedules.py` 的 `forward_backward_pipelining_without_interleaving()` 做 1F1B，`p2p_communication.py` 用 `torch.distributed.send/recv`（或 `isend/irecv`）在 PP 组传 `[seq, batch, hidden]` 激活张量；`virtual_pipeline_model_parallel_size` 用 interleaved schedule 压 bubble。

---

## 六、DeepSpeed ZeRO：显存公式与可算数字

混合精度 Adam 下每个参数的模型状态：fp16 参数 2Ψ + fp16 梯度 2Ψ + fp32 master 4Ψ + momentum 4Ψ + variance 4Ψ = **16Ψ**。DP 度为 N 时：

| 阶段 | 分片对象 | 每卡模型状态显存 |
|---|---|---|
| baseline | 无 | `16Ψ` |
| ZeRO-1 (`P_os`) | optimizer states | `4Ψ + 12Ψ/N` |
| ZeRO-2 (`P_os+g`) | + 梯度 | `2Ψ + 14Ψ/N` |
| ZeRO-3 (`P_os+g+p`) | + 参数 | `16Ψ/N` |

**Ψ = 7.5B、N = 64** 时：120 GB → 31.4 GB → 16.6 GB → **1.875 GB**（仅模型状态，不含激活与通信缓冲）。这就是 7.5B 模型能从「单卡装不下」变成「单卡 barely 装得下」的原因。

### ZeRO-1/2 的代码真相

`stage_1_and_2.py` 里最关键的一行是**把 optimizer 的 param_group 换成本地分片**：

```python
weights_partition = self.parallel_partitioned_bit16_groups[i][partition_id] \
    .detach().clone().to(device=self.device, dtype=self.master_weights_and_grads_dtype)
self.single_partition_of_fp32_groups.append(weights_partition)
self.single_partition_of_fp32_groups[i].requires_grad = True
param_group['params'] = [self.single_partition_of_fp32_groups[i]]
# 此后本地 optimizer 只为这一片保存 momentum / variance
```

模型参数本身则指向 flat buffer 的 view：`p.data = flat_group.narrow(0, offset, meta.numel()).view(meta.shape).data`。梯度走 `create_gradient_handling_hooks()` → `process_gradients()` → IPG bucket → `average_tensor()`：

- `reduce_scatter=False`：`gradient_reduction_w_predivide()` 里 `dist.all_reduce(tensor_to_allreduce, group=self.dp_process_group)`；
- `reduce_scatter=True`：按 `partition_id` 把梯度 slice 分组，调 `allreduce_no_retain(..., rank=dst)` 或 `allreduce_and_scatter(...)`。

★**这里有个反直觉点**：ZeRO-1/2 的 `reduce_scatter` 配置名并不等于真的调用 NCCL `ReduceScatter`，实际是「把 all-reduce 结果只保留到目标 rank」。真正用 `reduce_scatter_coalesced()` 的是 ZeRO-3。

IPG bucket 还做了通信与计算的细粒度重叠：`bucket.index = 1 - bucket.index` 双缓冲、`ready_events` / `reuse_events` 事件追踪、`copy_streams` 记录生产流。后者注释明确写着是为了 `torch.compile`——编译后 gradient hooks 会跑在不同 autograd stream 上，归约前必须等齐所有流。

---

## 七、ZeRO-3：参数的权威存储在 `ds_tensor`

`deepspeed/runtime/zero/stage3.py` + `partition_parameters.py`：

```python
param.ds_tensor          # 本 rank 的 1/N 分片，持久存在，是权威数据
param.ds_numel           # 完整参数元素数
param.partition_numel()  # 本卡分片数（含对齐 padding）
param.ds_status          # ZeroParamStatus: NOT_AVAILABLE / INFLIGHT / AVAILABLE
param.ds_tensor.status   # PartitionedParamStatus: CPU/NVMe offload 层状态（★另一层次）

# 所有分片按 dtype 合并成连续 flat buffer，便于一次通信 / 一次 optimizer.step
self.lp_param_buffers[dtype] = defragment(
    [t for t in self._get_parameter_partitions() if t.dtype == dtype])
```

一次 step 的时序完全由 PyTorch 模块 hooks 驱动：

| 阶段 | hook / 方法 | 动作 |
|---|---|---|
| 1 | `register_forward_pre_hook` → `PartitionedParameterCoordinator.fetch_sub_module()` | `params[0].all_gather(param_list=..., async_op=True)`，状态 NOT_AVAILABLE → INFLIGHT → AVAILABLE |
| 2 | `module.forward()` | 算子看到的是普通 `nn.Linear`，autograd 正常建图 |
| 3 | `register_forward_hook` → `release_sub_module()` | `param.partition(has_been_updated=False)`，状态回 NOT_AVAILABLE |
| 4 | `register_grad_hook` / `register_full_backward_hook` | IPG bucket → `reduce_scatter_coalesced()` → 写入 `__param_id_to_grad_partition[param.ds_id]`，`param.grad = None` |
| 5 | `optimizer.step()` | 只更新本地 `ds_tensor` + fp32 master，`all_gather_dp_groups()` 把各卡分片拼回完整模型参数 |

`PartitionedParameterCoordinator` 的四个旋钮决定性能：`prefetch_bucket_size`、`max_reuse_distance`、`max_live_parameters`、`param_persistence_threshold`（小参数常驻不反复 gather/partition）。显式取回完整参数用上下文管理器：

```python
with GatheredParameters(model.parameters(), modifier_rank=0):
    ...   # __enter__: all_gather；__exit__: partition(has_been_updated=...)
```

★生成场景必须 `unwrap_model_for_generation()`：它会**摘掉所有 optimizer hooks 并一次性 gather 全模型**，否则逐层 gather/partition 会把推理拖垮。这和 vLLM 推理侧「只做一次权重加载」是同一笔账（见《vLLM V1 源码级拆解》）。

最上层 `DeepSpeedEngine`（`deepspeed/runtime/engine.py`）接管训练循环：`engine.backward(loss)` 处理 loss scaling 与梯度累加边界，`engine.step()` 处理 clip、ZeRO epilogue、offload，用户代码里看不到 `optimizer.zero_grad()` / `step()`。

---

## 八、FSDP2 分野与三者叠用约束

| 组合 | 分工 | 代码层约束 |
|---|---|---|
| **Megatron-DeepSpeed**（历史缝合版） | Megatron 管 TP/PP/EP，DeepSpeed 管 ZeRO + pipeline engine | 把 Megatron 的 `mpu` 传进 config，让 ZeRO 的 `dp_process_group` **排除 TP ranks**；否则对 TP 内本就复制的权重再切一次 |
| **Megatron-Core 单栈**（现在更常见） | TP/PP/CP/EP + 自带 `DistributedOptimizer`（ZeRO-1 等价） | 不需要 DeepSpeed，少一层 hooks，与 `torch.compile` 更亲和 |
| **PyTorch FSDP2 单栈** | `fully_shard()` + `DTensor` + `DeviceMesh` = 原生 ZeRO-3 | 分片语义下沉到 `__torch_dispatch__`，**不用 Python 模块 hooks** |

★最容易搞混的一点：DeepSpeed 的 `PipelineModule` 和 Megatron 的 PP 是两套互不兼容的流水线实现，不能同时开。ZeRO-3 与 TP 组合同理——ZeRO 分的是「数据并行副本」，TP 组内 rank 持有的是同一份权重的不同切片而非副本，必须从 ZeRO 的 DP 组里排除。

和推理侧正好对上：**训练侧 Megatron 的 TP all-reduce 与推理侧 vLLM 的 TP all-reduce，底层都是同一个 `torch.distributed.ProcessGroup` + NCCL**，区别只在训练要在 `autograd.Function.backward()` 里补一次对称通信。

---

## 九、代码级最小骨架

```python
import torch, torch.distributed as dist
from megatron.core.parallel_state import initialize_model_parallel
from megatron.core.tensor_parallel import ColumnParallelLinear, RowParallelLinear
from deepspeed.zero import GatheredParameters

dist.init_process_group("nccl")                       # ① PyTorch 建默认组
initialize_model_parallel(tensor_model_parallel_size=4,
                          pipeline_model_parallel_size=2,
                          context_parallel_size=1)   # ② new_group 造 tp/pp/dp 子组

up   = ColumnParallelLinear(4096, 11008, gather_output=False)   # weight [2752,4096]
down = RowParallelLinear(11008, 4096, input_is_parallel=True)   # weight [4096,2752]
# ③ 两层之间没有任何显式 dist 调用，通信由 autograd.Function 的 f/b 自动插入

with GatheredParameters(list(down.parameters())):   # ④ 临时取回完整权重
    print(down.weight.shape)                        # [4096, 11008]，退出即 partition

loss = model(batch).sum()
engine.backward(loss)                              # ⑤ DeepSpeed 接管 scaler / grad hooks
engine.step()                                      # ⑥ 只更新本地分片 + all-gather 回写
```

---

## 十、真会踩的坑

1. **`CUDA_DEVICE_MAX_CONNECTIONS=1`**：Megatron 异步 all-reduce 与 wgrad GEMM 的重叠依赖 CUDA stream 发射顺序，源码里有专门 warning。
2. **`torch.compile` × DeepSpeed hooks**：`IPGBucket.copy_streams` 就是为编译后 grad hooks 跑在不同 autograd stream 而加的，归约前必须等齐所有生产流。
3. **activation checkpointing 的重入反向**：会让 ZeRO 的 grad hook 触发多次，DeepSpeed 用 `reenter_backward_if_needed()` 与 `_max_expected_hooks_seen` 计数对齐。
4. **ZeRO-3 直接 generate 极慢**：必须 `unwrap_model_for_generation()` 或一次性 `GatheredParameters`。
5. **rank order 配错**：`order="tp-cp-ep-dp-pp"` 决定 rank 拓扑，把 TP 排到跨机会让每层 4 次 all-reduce 走 IB。
6. **两层状态别混**：`param.ds_status` 管「完整参数是否 gather」，`param.ds_tensor.status` 管「分片是否在 CPU/NVMe」，offload 问题查后者。
7. **MoE / EP 下的 ZeRO-3**：需用 `z3_leaf_module` 标记专家模块，否则 leaf module 的延迟归约不生效，未参与本次迭代的专家梯度会丢。

---

## 十一、结语

PyTorch 给的是「Tensor + autograd + ProcessGroup + allocator + hooks」这五件原语；Megatron 把它们用成**结构改写**，DeepSpeed 把它们用成**状态改写**。二者的交集恰好是同一个 `torch.distributed.ProcessGroup`——所以能叠，但必须约定谁负责哪个通信域，否则会在同一份梯度上做两次归约。

判断一个新框架该往哪放，只需问两句话：**它改的是 `nn.Module` 的计算图，还是 `Parameter` 的存储？** 前者是 Megatron 类，后者是 DeepSpeed / FSDP 类，而 PyTorch 永远是它们共同落地的那一层。

> 延伸阅读：站内《vLLM V1 源码级拆解：从 EngineCore 到 block_table》（`content/articles/vllm-v1-source-code-architecture-2026-11.md`）、《多模态基础模型预训练数据格式与 Megatron/DeepSpeed 框架适配》（`content/articles/multimodal-pretraining-data-format-megatron-deepspeed.md`，讲数据管线，与本文的分布式控制面互补）、《模型架构半年观察》ch03（激活比与稀疏化）、`content/books/gpu-book-ch07.md`（NCCL collective 原语）。

> 数据边界：源码取自 Megatron-LM main 与 DeepSpeed master（2026-11 抓取）；`parallel_state.py` 的 deprecation 提示来自文件头原文。显存公式为理论模型状态，不含激活、通信 buffer 与碎片。
