---
title: "大模型训练与推理框架源码全书 - 第8章: ZeRO-3 源码级：ds_tensor、两层状态与五步 hook 时序"
book: "大模型训练与推理框架源码全书：从 PyTorch 原语到 Megatron、DeepSpeed 与 vLLM"
chapter: "8"
chapterTitle: "ZeRO-3 源码级：ds_tensor、两层状态与五步 hook 时序"
description: "说明 param.data 只是临时窗口而 ds_tensor 才是权威存储，展开 NOT_AVAILABLE 到 AVAILABLE 的两层状态机、一次 step 的五个 hook 步骤、协调器四个旋钮与梯度 reduce_scatter 路径"
date: "2026-11-14"
updatedAt: "2026-11-14"
agent: "研究员→编辑→审校员"
tags:
  - "DeepSpeed"
  - "ZeRO-3"
  - "Module Hook"
  - "参数分片"
  - "源码拆解"
type: "book"
part: "篇三 · 训练状态改写"
---

# 第 8 章 · ZeRO-3 源码级：`ds_tensor`、两层状态与五步 hook 时序

## 8.1 结论：`param.data` 不是权威数据

理解 ZeRO-3 只需要接受一个反直觉事实：**`nn.Parameter.data` 在大部分时间是空的或无效的，真正的参数存在 `param.ds_tensor` 里**。

```python
# 【源码】deepspeed/runtime/zero/partition_parameters.py
param.ds_tensor           # 本 rank 的 1/N 分片，持久存在
param.ds_numel            # 完整参数的元素数
param.partition_numel()   # 本卡分片元素数（含对齐 padding）
param.ds_id               # 分片注册表里的唯一 id
param.ds_status           # ZeroParamStatus: NOT_AVAILABLE / INFLIGHT / AVAILABLE
```

而 `param.data` 只在 `ds_status == AVAILABLE` 的窗口内指向完整参数。窗口一关，`partition()` 会把它缩回 1/N 或直接置空。所以任何直接读 `model.layer.weight.data` 的第三方代码，在 ZeRO-3 下拿到的可能是一个被切过的或根本不正确的张量——这是所有「保存 checkpoint 结果不对」「算 norm 得到奇怪值」问题的共同根因。

## 8.2 两层状态别混

源码里有两个名字很像但语义完全不同的状态机：

| 状态 | 类型 | 管什么 | 排查什么问题 |
|---|---|---|---|
| `param.ds_status` | `ZeroParamStatus` | **完整参数**是否已 gather：`NOT_AVAILABLE` / `INFLIGHT` / `AVAILABLE` | 参数窗口、hook 时序、死锁 |
| `param.ds_tensor.status` | `PartitionedParamStatus` | **分片**放在 GPU / CPU / NVMe（offload 层） | offload 卡顿、PCIe 搬运、显存没降 |

一个常犯的错：看到显存没降就查 `ds_status`，其实该查 `ds_tensor.status`；看到「参数读出来是空的」去查 offload 配置，其实该查 `ds_status`。

## 8.3 权威存储的合并：一次通信一个 buffer

```python
# 【源码】deepspeed/runtime/zero/stage3.py
# 把所有同 dtype 的分片合并成连续 flat buffer
self.lp_param_buffers[dtype] = defragment(
    [t for t in self._get_parameter_partitions() if t.dtype == dtype])
```

目的与 ch07 的 flatten 一样：**让一次 all-gather 只对一个连续 Tensor 发起，让 `optimizer.step()` 只遍历一个 buffer**。否则 80 层 × 每层若干个参数会变成上千次小通信，NCCL 启动开销吃掉全部收益。

## 8.4 一次 step 的五步 hook 时序

【源码】`stage3.py::FP16_DeepSpeedZeroOptimizer_Stage3.__init__` 注册钩子，`partitioned_param_coordinator.py::PartitionedParameterCoordinator` 生成 fetch/release trace。

```python
# 注册（概念骨架，方法名保留）
self._create_param_coordinator()
for m in self.module.modules():
    if is_leaf_module(m):
        m.register_forward_pre_hook(self._coordinator.fetch_sub_module)
        m.register_forward_hook(self._coordinator.release_sub_module)
        m.register_full_backward_hook(self._coordinator ... )   # 反向再取一次
for p in self.module.parameters():
    p.register_grad_hook(self._grad_hook)                       # 梯度入 bucket
```

五步展开（以一个 `ColumnParallelLinear` 子模块为例）：

| 步 | 触发 | 动作 | 参数状态 |
|---|---|---|---|
| ① pre-forward | `fetch_sub_module` | 按 trace 发起 `all_gather`，必要时预取后续模块 | `INFLIGHT → AVAILABLE` |
| ② forward | 模块计算 | 用完整 `param.data` 做 GEMM | `AVAILABLE` |
| ③ post-forward | `release_sub_module` | `partition()`，释放完整参数显存 | `→ NOT_AVAILABLE` |
| ④ backward pre | 反向 hook | **再 gather 一次**（前向已释放） | `→ AVAILABLE` |
| ⑤ grad hook | 梯度产生 | 进 `IPGBucketZ3`，攒满后 reduce-scatter | `→ NOT_AVAILABLE` |

> ★步骤 ④ 是 ZeRO-3 最贵的部分：**每个参数在一次迭代里至少被 gather 两次（前向 + 反向）**。开启 activation checkpointing 后还会更多。所以 `max_live_parameters` 与 `param_persistence_threshold` 这两个旋钮，本质上是在「多留几个完整参数在显存里」与「少几次 all-gather」之间做权衡。

## 8.5 协调器的四个旋钮

【源码】`partitioned_param_coordinator.py`，四个参数直接决定吞吐：

| 旋钮 | 作用 | 调错的症状 |
|---|---|---|
| `prefetch_bucket_size` | 一次预取多少参数的 all-gather | 太小 → 通信次数多；太大 → 显存峰值高 |
| `max_reuse_distance` | 短期内会复用的参数不立刻 partition | 太小 → 重复 gather；太大 → 显存不降 |
| `max_live_parameters` | 同时最多保留多少个完整参数 | 触发强制 partition，可能造成 INFLIGHT 等待 |
| `param_persistence_threshold` | 小于该阈值的参数常驻不 partition | 设太小 → 大量小参数反复 gather，收益全被开销吃掉 |

> 【推算】贯穿配置 Ψ_local=8.75 B、N=8，每卡分片 `8.75e9/8 ≈ 1.09e9` 参数 × 2 B ≈ **2.19 GB** 常驻；一次完整 gather 需要额外 `8.75e9 × 2 B = 17.5 GB` 的临时窗口。若 `max_live_parameters` 允许 2 个模块同时在场，峰值约 `2.19 + 2×(单模块大小)`；单模块按 ch05 的 `[7168,8192]` bf16 = `112 MiB` 计，峰值约 `2.4 GB`。**这说明 ZeRO-3 的显存瓶颈不是「全模型 gather」，而是「同时在场的窗口数」**——把整个模型 gather 起来是 `17.5 GB`，训练中并不会发生。

## 8.6 `GatheredParameters`：显式窗口

需要读/改完整参数时（算 norm、手工改权重、保存 checkpoint、做权重转换），用上下文管理器：

```python
from deepspeed.zero import GatheredParameters

with GatheredParameters(list(model.parameters()), modifier_rank=0):
    # __enter__ : params[0].all_gather(param_list=...)   → ds_status AVAILABLE
    if dist.get_rank() == 0:
        model.layer.weight.data.clamp_(-1, 1)
    # __exit__  : params[0].partition(param_list=..., has_been_updated=True)
```

`modifier_rank` 指定哪个 rank 的修改会被保留；`has_been_updated=False` 时退出不写回分片，能省一次通信。ch14 讲训练 checkpoint 转 vLLM 权重时，这一步是必经之路。

## 8.7 梯度路径：真正的 `reduce_scatter_coalesced`

```python
# 【源码】stage3.py 梯度归约骨架
# ① grad hook 把梯度塞进按通信 dtype 分组的 IPGBucketZ3
# ② 桶满 → __reduce_and_partition_ipg_grads() → __avg_scatter_grads()
reduce_scatter_coalesced(full_grads_for_rank, process_group=self.dp_process_group)
# ③ 结果按 param.ds_id 写入分片注册表
self.__param_id_to_grad_partition[param.ds_id] = ...
param.grad = None        # 完整梯度立即释放
```

与 ch07 对照：**ZeRO-3 才真正把每卡梯度输出降到 `n/N`**，ZeRO-1/2 的 `reduce_scatter=True` 只是「all-reduce 后只由 owner 保留」的近似。这是三个 stage 在通信量上的实质分界，而不只是显存公式里的 2 B 差别。

## 8.8 生成时必须摘掉 hooks

```python
# 【源码】deepspeed/runtime/zero/partition_parameters.py
with unwrap_model_for_generation(model) as unwrapped:
    outputs = unwrapped.generate(...)
```

原因很直白：自回归解码每生成一个 token 都要过一遍全部模块，ZeRO-3 的默认策略会让它**逐 token、逐模块 gather/partition**，通信次数放大几百倍。`unwrap_model_for_generation` 一次性 gather 全模型并摘掉 hooks，用完再恢复。

> 这条与站内 vLLM 那侧的结论正好互为镜像：**推理引擎把权重一次性加载、终身常驻；训练引擎把权重按需 gather、用完释放**。同一份 140 GB 权重，在两种系统中的生命周期完全相反——这就是 ch14 要处理的「训练产物 → 推理权重」落点差异。

## 8.9 MoE / EP 下的 `z3_leaf_module`

【源码】MoE 场景需要把专家模块标记为 leaf：

```python
from deepspeed.zero import register_external_parameter  # 或配置 z3_leaf_module
# 未参与本次迭代的专家不会产生梯度，
# 若用 register_full_backward_hook 且未标记 leaf，延迟归约逻辑会漏掉它们
```

这与 ch06 的 EP all-to-all 直接相关：token 被分发到不同 rank，某个专家本卡可能一个 token 都没收到，此时它的 grad hook 不会触发；`z3_leaf_module` 让协调器按「模块」而非「参数」管理 fetch/release，避免状态不一致。

## 8.10 本章小结与坑

- 权威存储在 `param.ds_tensor`；`param.data` 只是 `AVAILABLE` 窗口内的临时视图。
- 两层状态：`ds_status` 管完整参数是否 gather，`ds_tensor.status` 管分片所在存储层级。
- 一次 step 五步：pre-forward fetch → forward → release → backward re-gather → grad reduce-scatter。
- 每个参数每迭代至少 gather 两次；四旋钮都在权衡「多留显存」与「少通信」。
- 梯度侧 ZeRO-3 才用 `reduce_scatter_coalesced`，真正把输出降到 `n/N`。
- `unwrap_model_for_generation` 是推理前必做的一步。
- **坑 1**：第三方代码直接读 `.data` 得到分片或空值，必须走 `GatheredParameters`。
- **坑 2**：保存 checkpoint 没 gather 或没设 `has_been_updated`，权重写错且无报错。
- **坑 3**：reentrant activation checkpointing 重复触发 backward hook，需 `reenter_backward_if_needed()`。
- **坑 4**：`torch.compile` 多 autograd stream 下 bucket 要用 `copy_streams` + `record_stream` 对齐。
- **坑 5**：`max_live_parameters` 太小会让 `INFLIGHT` 状态堆积，表现为周期性卡顿而非 OOM。
- **坑 6**：MoE 未标 `z3_leaf_module`，空闲专家的梯度与状态会错。

> 下一章：把 Megatron-DeepSpeed 缝合版、Megatron-Core 单栈、PyTorch FSDP2 三条路线放在一张表上，重点讲 `dp_process_group` 为什么必须排除 TP/PP rank，以及 FSDP2 把分片下沉到 dispatch 层意味着什么。
