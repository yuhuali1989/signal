---
title: "大模型训练与推理框架源码全书 - 第2章: PyTorch 的五件原语与七个接缝"
book: "大模型训练与推理框架源码全书：从 PyTorch 原语到 Megatron、DeepSpeed 与 vLLM"
chapter: "2"
chapterTitle: "PyTorch 的五件原语与七个接缝"
description: "逐个拆开 Tensor 与 allocator、autograd 引擎、ProcessGroup 与 NCCL 集合通信、CUDA stream 与 event、Module 与 Parameter 五件原语，给出四个框架接管它们的七个接缝与可算的通信量公式"
date: "2026-11-14"
updatedAt: "2026-11-14"
agent: "研究员→编辑→审校员"
tags:
  - "PyTorch"
  - "NCCL"
  - "autograd"
  - "分布式训练"
  - "源码拆解"
type: "book"
part: "篇一 · 全景与底座"
---

# 第 2 章 · PyTorch 的五件原语与七个接缝

## 2.1 结论：四个框架都没有另造运行时

一个常见误解是「Megatron / DeepSpeed / vLLM 各自实现了一套分布式运行时」。实际上它们全部跑在 PyTorch 上，只是在**五个原语提供的接缝**上插入自己的逻辑。理解这五件原语，后面十三章的源码都能对号入座。

| 原语 | PyTorch 提供什么 | 谁最依赖它 |
|---|---|---|
| ① `Tensor` + CUDA caching allocator | 显存池、异步释放、`record_stream` | DeepSpeed（分片缓冲区）、vLLM（KV cache 大块常驻） |
| ② `torch.autograd` 引擎 | 计算图、`Function`、backward hook、自定义梯度 | Megatron（通信写进 `backward`） |
| ③ `torch.distributed.ProcessGroup` | 进程组 + NCCL 集合通信 | 全部 |
| ④ CUDA `stream` / `event` | 异步执行、跨流依赖 | Megatron（通信与 GEMM 重叠）、DeepSpeed（bucket 双缓冲） |
| ⑤ `nn.Module` / `nn.Parameter` | 模块树、参数注册、forward/backward hooks | DeepSpeed（ZeRO-3 的 fetch/release） |

## 2.2 原语①：Tensor 与 caching allocator

PyTorch 不直接 `cudaMalloc` 每一块 Tensor，而是维护一个按大小分桶的**缓存分配器**：Tensor 被释放后显存不还给驱动，留给后续同尺寸的分配复用。这一点决定了两个框架行为：

- **DeepSpeed ZeRO-3** 把所有同 dtype 的参数分片 `defragment()` 成一个连续 flat buffer。【源码】`deepspeed/runtime/zero/stage3.py` 里 `self.lp_param_buffers[dtype] = defragment([...])`。目的不只是省显存，更是让一次 all-gather 只对一个连续 Tensor 发起、让一次 `optimizer.step()` 只遍历一个 buffer——分配器复用与 NCCL 调用次数同时受益。
- **vLLM** 反过来，初始化时**一次性**申请整个 KV cache 大张量并终身持有，运行中不做任何 KV 显存分配。这是 continuous batching 能做到每步重新组批而不抖动的前提。

跨流使用时必须显式登记，否则分配器可能把还在被别的流读的显存复用出去：

```python
# 【源码】deepspeed IPG bucket 双缓冲的典型写法
buf = torch.empty(n, dtype=dtype, device="cuda")
buf.record_stream(compute_stream)      # 告诉 allocator：这条流还在用
compute_stream.wait_stream(comm_stream)  # 归约流等计算流写完
```

> 【推算】贯穿配置 M 的 bf16 权重总量 `70e9 × 2 B = 140 GB`。训练 `TP=4/PP=2` 后每卡只持有 `140 / 8 = 17.5 GB` 权重切片；但混合精度 Adam 的 fp32 master + m + v 是 `70e9 × 12 B = 840 GB`，按 `DP=8` 分片后每卡 `105 GB`——**优化器状态是权重的 6 倍**，这就是第 7 章 ZeRO 全部文章的起点。

## 2.3 原语②：autograd 引擎与自定义 Function

PyTorch 允许用 `torch.autograd.Function` 覆盖一个算子的前反向。Megatron 把**通信算子**做成 Function，于是模型代码里可以完全不出现 `dist.*`：

```python
class ScaledIdentity(torch.autograd.Function):
    @staticmethod
    def forward(ctx, x, group):
        ctx.group = group
        return x                          # 前向：什么也不做
    @staticmethod
    def backward(ctx, grad_output):
        torch.distributed.all_reduce(grad_output, group=ctx.group)
        return grad_output, None          # 反向：补一次集合通信
```

这段就是 ch05 要讲的 `_CopyToModelParallelRegion` 的骨架：**「前向恒等、反向归约」与「前向归约、反向恒等」成对出现**，构成 TP 区域的边界。它们的作用不是计算，而是让 autograd 图在正确位置插入通信。

DeepSpeed 几乎不用自定义 Function，它用 `nn.Module.register_forward_pre_hook` / `register_full_backward_hook` 在模块边界挂 gather/partition 逻辑（ch08）。**这是两个训练框架最本质的分工差异**：一个改计算图，一个改模块生命周期。

autograd 还有一处容易踩：`torch.utils.checkpoint`（激活重算）用 reentrant backward 时，同一个 backward hook 可能被触发多次。DeepSpeed 为此专门写了 `reenter_backward_if_needed()` 与 `_max_expected_hooks_seen` 计数来对齐。

## 2.4 原语③：ProcessGroup 与 NCCL 集合通信

`torch.distributed.new_group(ranks=[...])` 是唯一入口，返回一个 `ProcessGroup`，底层在 NCCL 后端下对应一个 communicator。四个原语里，这一件是四个框架真正的交汇点。

| 集合通信 | 语义 | 训练侧用在哪 | 推理侧用在哪 |
|---|---|---|---|
| `all_reduce` | 每卡都拿到全量求和 | TP 出入口、ZeRO-1 梯度 | vLLM TP 前向 |
| `all_gather` | 每卡都拿到全量拼接 | SP 进入 TP 区、ZeRO-3 取参数 | TP 的 `gather_output` |
| `reduce_scatter` | 求和后每卡只拿一片 | SP 离开 TP 区、ZeRO-3 梯度 | 少见 |
| `all_to_all` | 互相交换不同分片 | MoE/EP 分发 token | EP 推理 |
| `send` / `recv` | 点对点 | PP stage 间传激活 | PD 分离传 KV（走 KVConnector，非裸 send） |

**通信量的可算公式**（ring 算法，N 卡，每卡数据 n 字节）：

```
all_reduce / reduce_scatter : 每卡收发 2n(N-1)/N
all_gather                  : 每卡收发  n(N-1)/N
```

> 【推算】把第 1 章的 64 MiB 张量放进 8 卡推理拓扑：`all_reduce` 每卡 `2 × 64 MiB × 7/8 = 112 MiB`。若 NVLink 单向 300 GB/s，理想耗时 `112 MiB / 300 GB/s ≈ 0.39 ms`；换成 25 GbE（约 3 GB/s 有效）则 `≈ 39 ms`，**100 倍差距**。所以 `rank order` 必须把 TP 排在同一节点内（ch04），而 vLLM 的 `TP=8` 单机部署不是偏好而是硬约束。

一个常被忽略的事实：`ProcessGroup` 是**按 rank 列表手工构造**的，PyTorch 不理解「哪些 rank 是 TP、哪些是 DP」这种语义。【源码】Megatron `parallel_state.py::initialize_model_parallel` 用 `RankGenerator` 在纯 Python 里算出各组 rank 列表，再逐个 `create_group(ranks)`；vLLM 则在 `vllm/distributed/parallel_state.py` 里另建一套同名的组。**两套组互不认识**，只是碰巧建在同一个默认 group 之上——这也是为什么「Megatron 训练完、vLLM 加载」需要显式的 checkpoint 转换（ch14），而不是进程组能直接复用。

## 2.5 原语④：CUDA stream 与 event

GPU 上的计算与通信默认落在不同的流，重叠靠**发射顺序**与 `event` 等待实现。这层没有 Python API 之外的魔法，但决定了两个真实性能陷阱：

```python
# 【源码】Megatron linear_with_grad_accumulation_and_async_allreduce 的约束
# 文档明确建议：CUDA_DEVICE_MAX_CONNECTIONS=1
# 理由：保证 NCCL 的异步 all-reduce 与 wgrad GEMM 按发射顺序进入同一硬件队列，
# 否则多条硬件连接会让二者乱序，重叠退化为串行。
```

```python
# 【源码】DeepSpeed stage_1_and_2.py 的 IPG bucket 双缓冲
bucket.index = 1 - bucket.index        # 前后两个 buffer 交替
# 一个在 reduce，另一个继续接收新梯度
```

vLLM 的 `EngineCore` 也有同构思想，但用的是 `step_with_batch_queue()` 把「调度」与「消费输出」解耦、让多批在 GPU 在途（ch10）。**三者是同一个模式在三个层次的应用：让慢的一方不必等快的一方。**

## 2.6 原语⑤：nn.Module 与 nn.Parameter

`nn.Module` 的模块树与 hook 是 DeepSpeed 的全部舞台；`nn.Parameter` 的 `.data` 可替换则是 ZeRO 分片的实现基础：

```python
# 【源码】DeepSpeed stage_1_and_2.py（ZeRO-1/2 的核心一行）
p.data = flat_group.narrow(0, offset, meta.numel()).view(meta.shape).data
# 参数 p 仍是 nn.Parameter，autograd 与 optimizer 都无感；
# 但它的真实存储是 flat buffer 的一个 view，物理上已被按 DP 切分。
```

Megatron 不改 `.data`，而是**直接按切片后的形状创建 Parameter**：

```python
# 【源码】megatron/core/tensor_parallel/layers.py::ColumnParallelLinear.__init__
self.weight = Parameter(torch.empty(output_size_per_partition, input_size))
# TP=4 时 output_size_per_partition = 28672/4 = 7168
```

两种写法对应两种哲学：**DeepSpeed 保留「完整参数」的逻辑视图、只换存储；Megatron 连逻辑视图一起改小。** 前者能兼容任意现成模型，后者必须改模型定义，但省掉了所有 gather/partition 开销。

## 2.7 七个接缝总表（全书的索引）

| # | 接缝 | Megatron-LM | DeepSpeed | vLLM V1 |
|---|---|---|---|---|
| 1 | `torch.autograd.Function` | 4 个 region Function 把通信写进 `backward()` | 基本不用 | 不用（推理无反向） |
| 2 | `nn.Module` hooks | PP schedule 手动排 micro-batch | ZeRO-3 fetch/release + grad hook | 不用 |
| 3 | `nn.Parameter` / `.data` 替换 | 按切片形状新建 Parameter | `ds_tensor`、`p.data = view` | 权重只读加载 |
| 4 | `ProcessGroup` | `new_group` + `RankGenerator` | `deepspeed.comm as dist` 包一层 | 自建同名组 |
| 5 | `torch.utils.checkpoint` | 选择性重算、GTP weight remat | `reenter_backward_if_needed()` | 不涉及 |
| 6 | allocator / stream / event | `CUDA_DEVICE_MAX_CONNECTIONS=1` | IPG 双缓冲 + `record_stream` | KV cache 一次性常驻 + CUDA Graph |
| 7 | `torch.compile` / DTensor / DeviceMesh | 迁往显式 `ProcessGroupCollection`（当前仍手工建组） | 对照物 FSDP2 | `compilation_config.cudagraph_mode` |

第 7 行是分野：**PyTorch 原生 FSDP2 把 ZeRO-3 的分片语义下沉到 `__torch_dispatch__` / `DTensor`，不再依赖 Python 层 hooks**；而 DeepSpeed 的实现是纯 Python 层的参数窗口调度。ch09 会展开。

## 2.8 用一次通信把五件原语串起来

以训练 M 的一次 `RowParallelLinear` 前向为例，五个原语依次登场：

| 步 | 原语 | 发生什么 |
|---|---|---|
| 1 | ③ ProcessGroup | 从 `get_tensor_model_parallel_group()` 取到 `tp_group`（rank 0-3） |
| 2 | ① allocator | `output_parallel` 复用缓存池里 `[4096, 8192]` bf16 的 64 MiB 块 |
| 3 | ② autograd | `_ReduceFromModelParallelRegion.apply(x, tp_group)` 在图上挂一个 Function 节点 |
| 4 | ③ NCCL | 该 Function 的 `forward` 调 `dist.all_reduce(x, group=tp_group)`，4 卡求和 |
| 5 | ④ stream | 通信在 NCCL 流上异步发射，后续 GEMM 通过 event 等待 |
| 6 | ② autograd | 反向时这个节点的 `backward` 是恒等，梯度直接透传（对偶见 ch05） |
| 7 | ⑤ Module | 若叠了 ZeRO-3，外层 pre-forward hook 早已把本层参数 gather 到位 |

> 【推算】这一层前向 all-reduce 的 4 卡通信量 `2 × 64 MiB × 3/4 = 96 MiB`；一层有 attention out-proj 与 MLP down-proj 两次，反向因对偶再来两次 → `384 MiB`。80 层、梯度累积 64 micro-batch：仅 TP 通信约 `30 GiB × 64 = 1.88 TiB` per optimizer step。这个数字解释了为什么「把 TP 放到跨机」不是变慢一点，而是整个训练不可用。

## 2.9 本章小结与坑

- 五件原语：allocator / autograd / ProcessGroup / stream-event / Module-Parameter；四个框架全部跑在它们之上，没有另造运行时。
- 七个接缝里，#1 与 #5 是理解「Megatron 改结构、DeepSpeed 改状态」的钥匙。
- NCCL 通信量公式 `all_reduce = 2n(N-1)/N`；同一 64 MiB 张量在 NVLink 与 25GbE 上差约 100 倍。
- **坑 1**：改了 `.data` 却忘了 `record_stream`，跨流下可能读到被复用的显存。
- **坑 2**：`ProcessGroup` 只是 rank 列表，框架之间的组互不认识，不要假设训练与推理能共享。
- **坑 3**：`CUDA_DEVICE_MAX_CONNECTIONS≠1` 会让 Megatron 的通信-GEMM 重叠失效。
- **坑 4**：reentrant activation checkpointing 会重复触发 backward hook，DeepSpeed 需要专门计数对齐。

> 下一章：给出三个仓库的真实目录树、从用户入口反向追踪功能的四条路径，以及 2026-11 版本下会 404 的路径清单。
