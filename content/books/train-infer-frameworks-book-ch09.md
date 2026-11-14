---
title: "大模型训练与推理框架源码全书 - 第9章: 三条训练栈怎么叠：dp_process_group 与 FSDP2 的分野"
book: "大模型训练与推理框架源码全书：从 PyTorch 原语到 Megatron、DeepSpeed 与 vLLM"
chapter: "9"
chapterTitle: "三条训练栈怎么叠：dp_process_group 与 FSDP2 的分野"
description: "对照 Megatron-DeepSpeed 缝合版、Megatron-Core 单栈与 PyTorch FSDP2 三条路线，说明数据并行组必须排除模型并行 rank 的通信域约束、两套流水线实现互不兼容，以及分片语义下沉到 dispatch 层的含义"
date: "2026-11-14"
updatedAt: "2026-11-14"
agent: "研究员→编辑→审校员"
tags:
  - "训练栈选型"
  - "FSDP2"
  - "DTensor"
  - "通信域"
  - "源码拆解"
type: "book"
part: "篇三 · 训练状态改写"
---

# 第 9 章 · 三条训练栈怎么叠：`dp_process_group` 与 FSDP2 的分野

## 9.1 结论：能叠的前提是「谁负责哪个通信域」

三个框架能组合，不是因为接口兼容，而是因为**通信域可以划分**。ch04 讲过：DP 组内的 rank 才是「同一份权重的副本」，TP/PP/EP 组内不是。ZeRO 分片与梯度归约必须且只能在 DP 组里做。一旦这个域划错，结果不是报错，而是**静默算错**——这是本章最要紧的一句话。

| 路线 | 谁管 TP/PP/EP/CP | 谁管 ZeRO | 是否需要额外胶水 |
|---|---|---|---|
| **A · Megatron-DeepSpeed 缝合版** | Megatron `mpu` | DeepSpeed ZeRO 1/2/3 | 必须把 `mpu` 传进 DeepSpeed config |
| **B · Megatron-Core 单栈** | Megatron Core | 自带 `DistributedOptimizer`（≈ZeRO-1） | 无，当前主流 |
| **C · PyTorch FSDP2 单栈** | `DeviceMesh` 多维 | `fully_shard()`（≈ZeRO-3） | 无，原生 |

## 9.2 路线 A：缝合版的那一根救命线

```python
# 历史缝合版的关键胶水：把 Megatron 的 model parallel unit 交给 DeepSpeed
deepspeed_config = {
    "zero_optimization": {"stage": 2, "reduce_bucket_size": 5e8},
    "train_micro_batch_size_per_gpu": 1,
    # ★关键：告诉 DeepSpeed 真正的数据并行组是什么
}
engine, optimizer, _, _ = deepspeed.initialize(
    model=model,
    config=deepspeed_config,
    model_parameters=[p for p in model.parameters()],
    mpu=mpu,                       # ← 老版本通过该参数传入
)
# 或者显式构造通信域后传入
# "data_parallel_group": mpu.get_data_parallel_group()
```

**不传会怎样**：DeepSpeed 默认用 `torch.distributed` 的全局组（全部 64 卡）当 `dp_process_group`。ch04 已经算过 64 卡里包含 4 个 TP 位置、2 个 PP stage、8 个 DP 副本。把全部 64 卡当成一个 DP 副本集合，等于把：

- 同一层被切成 4 份的不同切片（TP），
- 不同层的权重（PP），
- 真正的 8 份数据副本（DP），

混进同一个「按 rank 平均切分」的 ZeRO 分片里。梯度归约时不同层的梯度被加在一起，**数值完全错误且不会抛异常**。这类 bug 往往要到 loss 曲线明显不对才被发现。

> 【推算】正确的域：`DP 组 = [0,4,8,...,28]` 共 8 卡；错误的默认域：64 卡。分片度从 `N=8` 变成 `N=64`，ch07 的公式 `4Ψ + 12Ψ/N` 看起来「省了 8 倍」，实际是把不该切的权重视为同副本——**显存数字变漂亮、训练结果作废**。

**第二个硬冲突**：DeepSpeed 的 `deepspeed/runtime/pipe/` 里 `PipelineModule` 与 Megatron `pipeline_parallel/schedules.py` 是两套独立的 1F1B 实现，各自注册自己的 p2p 通信与 hook。**同时开必然冲突**。路线 A 里 PP 只能由其中一方负责，通常交给 Megatron。

**第三个**：MoE/EP 叠 ZeRO-3 需要 `z3_leaf_module` 标记专家（ch08），否则未激活专家的梯度与参数状态错乱。

## 9.3 路线 B：为什么现在更常见

ch06 已经给出定量依据：`DistributedOptimizer` 与 ZeRO-1 的公式完全相同（`4Ψ + 12Ψ/N`），而 ZeRO-2/3 相对 ZeRO-1 的额外收益只有 2 B/参数与 2 B/参数。为此付出的代价是：

- 一整套 Python 层 hooks（ch08 的五步时序、四旋钮、两层状态）；
- 与 `torch.compile`、activation checkpointing、自定义算子的兼容成本；
- 推理/生成前必须 `unwrap_model_for_generation()`；
- checkpoint 保存要 `GatheredParameters`。

**当 TP×PP 已经把 Ψ_local 压到 8.75 B 时，ZeRO-1 就够用了**：算例 B 里每卡 48.1 GB 模型状态，加上激活与碎片，在 80 GB 卡上是可接受的；硬上 ZeRO-3 换来的 17.5 GB 未必值得那套状态机。所以 Megatron-Core 单栈（少一层 hooks、与 `torch.compile` 更亲和）成了 2026 年主流大模型预训练的默认选择。

## 9.4 路线 C：FSDP2 把分片下沉到 dispatch 层

```python
import torch
from torch.distributed.device_mesh import init_device_mesh
from torch.distributed.fsdp import fully_shard

# ① 两维网格：8 卡 replicas（DP/FSDP）× ... 这里以纯 FSDP 为例
mesh = init_device_mesh("cuda", (8,))            # 8 卡做参数分片
for layer in model.layers:
    fully_shard(layer, mesh=mesh)                # ★ 每个模块自己声明分片策略
model = fully_shard(model, mesh=mesh)
# ② 之后训练循环就是原生 PyTorch，没有 engine.backward / engine.step
loss = model(batch).sum()
loss.backward()
optimizer.step()
```

与 DeepSpeed 的本质差异（全书最重要的一处架构对照）：

| | DeepSpeed ZeRO-3 | PyTorch FSDP2 |
|---|---|---|
| 分片语义在哪实现 | Python 层 `Module hooks` + `param.data` 窗口调度 | `DTensor` 的 `__torch_dispatch__` |
| 参数逻辑视图 | 仍是完整的 `nn.Parameter`，`.data` 临时替换 | 本身就是分片的 `DTensor`（`Shard` placement） |
| gather 触发 | forward pre-hook 显式 all-gather | dispatch 层按需 `redistribute(Shard → Replicate)` |
| 用户训练循环 | `engine.backward/step` 接管 | **原生** `loss.backward() / optimizer.step()` |
| 进程组 | 手工 `dp_process_group` | `DeviceMesh` 声明式多维网格 |
| 调试成本 | 需理解 `ds_status` 两层状态 | 只需理解 placement 转换 |

**一句话**：DeepSpeed 是「在 PyTorch 之上用 hooks 模拟一套分片状态机」，FSDP2 是「让 PyTorch 的 Tensor 本身就知道自己是分片的」。后者把 ch02 的第 7 个接缝（`DTensor` / `DeviceMesh`）真正用上了——而 ch04 说过，Megatron 的 `parallel_state.py` 至今仍是手工 `new_group`，没有迁移到 `DeviceMesh`。

`DeviceMesh` 的多维能力还解决了路线 A 那根救命线：

```python
# FSDP2 + TP 的混合并行：分片域由 mesh 维度自然隔离
mesh_2d = init_device_mesh("cuda", (2, 4), mesh_dim_names=("replicate", "shard"))
# replicate 维 = 真正的副本，shard 维 = 参数分片；TP 可再作为第三维
# 不再需要手工把 TP ranks 从 dp_process_group 里排除——它根本不在同一个维度上
```

## 9.5 Checkpoint 格式：三条路线互不相认

| 路线 | 产物 | 特征 |
|---|---|---|
| Megatron | `model_optim_rng.pt` + `mp_rank_XX/model_states.pt` | 每个 TP/PP rank 一个文件，含 TP 切片 |
| DeepSpeed ZeRO | `zero_pp_rank_X_mp_rank_00_model_states.pt` | 每个 DP rank 只存 1/N 分片，需合并 |
| FSDP2 / DCP | `torch.distributed.checkpoint` 的 sharded state_dict | 按 DTensor placement 存，可 reshard 加载 |

★这三个目录都不能直接被 vLLM `LLM(model=...)` 加载。vLLM 期望的是 HuggingFace 格式的完整权重（或已按推理 TP 切好的分片）。ch14 会给出训练产物 → 推理权重的完整转换链，包括 TP 度从 4 变 8 时怎么重新切。

## 9.6 选型决策表

| 条件 | 建议 | 理由 |
|---|---|---|
| 千卡级预训练、MoE、长上下文 CP | **B · Megatron-Core** | TP/PP/CP/EP 最完整，自带 ZeRO-1 够用 |
| 需要 ZeRO-3 / CPU offload、显存极紧 | **A** 或纯 DeepSpeed | 只有 ZeRO-3 能把参数本身分片 |
| 不想引入框架、追求与 `torch.compile` 亲和 | **C · FSDP2** | 原生训练循环，无 Python hooks |
| 已有 Megatron 代码但要 offload | A，且务必传 `mpu` | 通信域约束是硬前提 |
| 微调 / 中小规模 | C 或纯 DeepSpeed ZeRO-2 | 复杂度最低 |

## 9.7 本章小结与坑

- 三条路线能叠的前提是通信域划分；ZeRO 只分 DP 组，TP/PP 组内 rank 不是副本。
- 路线 A 的救命线是 `mpu` → `dp_process_group`；不传会导致梯度静默算错。
- 路线 B 已成主流，因为 `DistributedOptimizer` ≈ ZeRO-1 且 `TP×PP` 已把 Ψ_local 压小。
- FSDP2 用 `DTensor.__torch_dispatch__` + `DeviceMesh` 把分片下沉到 Tensor 层，训练循环回归原生 PyTorch。
- 三套 checkpoint 格式互不相认，都不能直接被 vLLM 加载。
- **坑 1**：默认全局组当 DP 组 → 显存数字变好、结果作废，无报错。
- **坑 2**：DeepSpeed `PipelineModule` 与 Megatron PP 同开必冲突。
- **坑 3**：MoE 叠 ZeRO-3 未标 `z3_leaf_module`。
- **坑 4**：把 `mpu.get_data_parallel_group()` 与 `get_tensor_model_parallel_group()` 传反。
- **坑 5**：以为 FSDP2 与 DeepSpeed hooks 能混用，实际上二者对 `param.data` 的假设相冲突。
- **坑 6**：跨路线迁移 checkpoint 时只合并了分片、没处理 TP 切片命名与 GQA 的 KV head 复制。

> 下一篇切换到推理侧。第 10 章把 vLLM V1 的多进程架构与 `EngineCore.step()` 六步链路逐行拆开，并解释为什么 ZMQ IO 线程能与 GPU forward 并行。
