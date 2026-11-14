---
title: "大模型训练与推理框架源码全书 - 第1章: 一张地图钉死全书：70B 模型从 64 卡训练到 8 卡上线"
book: "大模型训练与推理框架源码全书：从 PyTorch 原语到 Megatron、DeepSpeed 与 vLLM"
chapter: "1"
chapterTitle: "一张地图钉死全书：70B 模型从 64 卡训练到 8 卡上线"
description: "给出全书唯一的贯穿配置与请求、四级证据标注纪律、版本边界与十五章地图，并用三个反直觉结论说明为什么训练框架与推理框架必须放在同一套 PyTorch 原语上理解"
date: "2026-11-14"
updatedAt: "2026-11-14"
agent: "研究员→编辑→审校员"
tags:
  - "训练框架"
  - "推理框架"
  - "PyTorch"
  - "源码拆解"
  - "方法论"
type: "book"
part: "篇一 · 全景与底座"
---

# 第 1 章 · 一张地图钉死全书：70B 模型从 64 卡训练到 8 卡上线

## 1.1 先摆正三者的位置

大多数把 Megatron、DeepSpeed、vLLM 摆成三列对比的文章，第一句话就错了。它们不是同一层的东西：

| 层 | 是谁 | 改的是什么 | 用户代码感知 |
|---|---|---|---|
| 底座 | **PyTorch** | 什么都不改，提供 Tensor / autograd / ProcessGroup / allocator / Module hook 五件原语 | 直接用 |
| 训练 · 结构 | **Megatron-LM** | 改 `nn.Module` 的**权重形状**与 `autograd.Function` 的前反向通信 | 模型定义换成 `ColumnParallelLinear` 等 |
| 训练 · 状态 | **DeepSpeed** | 改 `Parameter.data` 的**存储位置**与 `Module hooks` 的 gather/partition 时机 | 训练循环换成 `engine.backward/step` |
| 推理 · 状态 | **vLLM V1** | 改**请求调度**与 KV cache 的物理块布局，权重只读不改 | 起服务或调 `LLM.generate()` |

一句话：**Megatron 和 DeepSpeed 互不调用，vLLM 与两者都不调用；它们只在 `torch.distributed.ProcessGroup`、autograd 引擎、CUDA caching allocator 这三处握手。** 这正是全书的主线——不是背 API，而是看四个项目如何在 PyTorch 的同一批接缝上各自施工。

## 1.2 贯穿全书的唯一配置（后面每章都回到它）

怕抽象，就先把数字钉死。全书只用一套模型、一套训练拓扑、一套推理拓扑、一个请求。

**模型 M**（对标 Llama-3-70B 量级，数值取整便于手算）：

| 项 | 值 | 记号 |
|---|---|---|
| 参数量 | 70 B | Ψ |
| 层数 | 80 | L |
| hidden | 8192 | h |
| FFN 中间维 | 28672 | f |
| 注意力头 / KV 头 | 64 / 8（GQA） | — |
| head_size | 128 | d |
| 权重/激活 dtype | bf16（2 B） | — |
| 优化器 | 混合精度 Adam（fp32 master + m + v） | — |

**训练拓扑 T**：8 节点 × 8 卡 = **64 卡**，`TP=4 / PP=2 / DP=8`，micro_batch=1，global_batch=512，seq=4096，梯度累积 64 步。校验：`TP × PP × DP = 4 × 2 × 8 = 64` ✅。

**推理拓扑 I**：单机 8 卡，`TP=8`，vLLM V1，`block_size=16`、`max_num_batched_tokens=8192`、`max_num_seqs=256`、`gpu_memory_utilization=0.95`、`enable_prefix_caching=True`。

**请求 R**：prompt 3000 token，其中前 2048 token 是一段所有请求共享的系统提示；生成上限 512 token。全书会反复算它的通信量、显存、命中块数。

> 【推算】单层权重规模：`ColumnParallelLinear` 的 up/gate 各 `[28672, 8192]`、down `[8192, 28672]`，三项合计 `3×28672×8192 = 704 643 072 ≈ 7.05 亿` 参数；`TP=4` 时每卡 `1.76 亿`，bf16 约 `352 MB`。加上 attention 的 q/k/v/o，80 层总量与 70B 量级自洽。所有后续 shape 都从这张表推，不另设数字。

## 1.3 四级证据标注（全书纪律）

这本书讲的是真实源码，不是设计稿。为了避免把「本版本的取舍」写成「业界定律」，全书用四个标签：

| 标签 | 含义 | 书写要求 |
|---|---|---|
| **【源码】** | 能在指定仓库路径里逐行核对的类名 / 方法名 / 变量名 | 必须写清 `仓库/路径::类.方法` |
| **【文档】** | 官方文档明确写出的设计意图 | 给文档名与日期 |
| **【推算】** | 由源码里的公式或官方数字手算出来的量 | **必须给算式**，例如 `2×16×1×128×2×80 = 655 360 B` |
| **【版本】** | 只在特定版本成立、随时可能变 | 标明分支与日期，不进通用结论 |

凡推论一律带算式；凡官方没公布的（例如某产品的 MoE expert 数、端到端延迟）一律写「未公开」，绝不填一个看起来合理的数。这条纪律来自 2026-11 那两次全书校准的教训：把教学基准写成事实，后面要花一整章对账。

**版本边界**：Megatron-LM 取 `main`（2026-11）、DeepSpeed 取 `master`（2026-11）、vLLM 取 `main`（2026-11），vLLM 官方设计文档日期 2026-10-29。三者都在快速迭代，凡涉及目录结构的断言都标【版本】。

## 1.4 三个反直觉结论（先给，后面逐章证）

**① vLLM V1 的调度器里没有 prefill 阶段，也没有 decode 阶段。** 【源码】`vllm/v1/core/sched/scheduler.py::Scheduler.schedule` 的注释原文是 `There's no "decoding phase" nor "prefill phase" in the scheduler`。它只有一个不变量：`num_computed_tokens` 追赶 `num_tokens_with_spec`，每步按 `token_budget` 分配 token。chunked prefill、prefix caching、投机解码都是这一个循环的特例。

**② PagedAttention 在 V1 里已经不是一个 CUDA kernel，而是一种内存布局 + 两个 metadata 张量。** 【源码】`v1/attention/backends/flash_attn.py` 里 `forward_includes_kv_cache_update = False`：写 KV 用 `reshape_and_cache_flash(..., slot_mapping)`，读 KV 把 `block_table` 直接交给 `flash_attn_varlen_func`。V0 那个手写 `paged_attention_v1/v2` kernel 不在主路径上。

**③ DeepSpeed 配置里的 `reduce_scatter` 与 NCCL 的 `ReduceScatter` 不是一回事。** 【源码】`stage_1_and_2.py` 中 `reduce_scatter=True` 走的是按 `partition_id` 分组后的 `allreduce_no_retain(..., rank=dst)`；真正调 `reduce_scatter_coalesced(...)` 的是 ZeRO-3。名字相同，集合通信不同，性能模型也不同。

这三条有一个共同的思考方式：**框架真正的架构决策，往往藏在「哪一层承担这个语义」里，而不是藏在 API 名字里。**

## 1.5 全书地图：五篇十五章

| 篇 | 章 | 回答的问题 | 主要源码 |
|---|---|---|---|
| 一 · 全景与底座 | 1–3 | 四个框架在哪几层握手？PyTorch 提供了什么？源码怎么读？ | `torch/distributed`、`torch/_C` |
| 二 · 训练结构 | 4–6 | 权重怎么切、通信插在哪、进程组怎么造？ | `megatron/core/tensor_parallel/*`、`parallel_state.py`、`pipeline_parallel/*` |
| 三 · 训练状态 | 7–9 | 优化器状态/梯度/参数存在哪？何时 gather？三栈怎么叠？ | `deepspeed/runtime/zero/*`、FSDP2 |
| 四 · 推理引擎 | 10–13 | 一次 step 干了什么？token 怎么分配？KV 块怎么映射？显存怎么算？ | `vllm/v1/engine/*`、`core/sched/*`、`attention/backends/*` |
| 五 · 贯通 | 14–15 | 训练产物怎么变成推理权重？部署时两笔账怎么合并？ | checkpoint / Ray Serve / 诊断手册 |

每章固定六件套：**结论先行 → 源码路径 → 代码片段 → shape 或通信量的可算数字 → 落点表 → 坑与小结**。第 15 章把所有章的可算数字收成一张总账。

## 1.6 一个最小对照：同一个 `all_reduce`，三种身份

用贯穿配置里的 `h=8192` 举一个能一路算到底的例子，先看三者如何用同一个 NCCL 原语：

```python
import torch.distributed as dist

# ① Megatron 训练前向：RowParallelLinear 离开 TP 区，4 卡各持部分和 → 求和
# 【源码】mappings.py::_ReduceFromModelParallelRegion.forward
out = _reduce(output_parallel, tp_group)       # dist.all_reduce(tensor, group=tp_group)

# ② Megatron 训练反向：进入 TP 区的梯度要按 TP 度求和（对偶，见 ch05）
# 【源码】mappings.py::_CopyToModelParallelRegion.backward
grad_in = _reduce(grad_output, tp_group)

# ③ vLLM 推理前向：TP=8 的 all-reduce 语义相同，但没有反向
# 【源码】vllm/model_executor/layers/linear.py::RowParallelLinear.forward
if self.tp_size > 1:
    dist.all_reduce(output, group=self.tp_group)
```

差别只在**要不要在 autograd 图里补一次对称通信**。所以第 5 章会讲「前向 all-reduce ↔ 反向恒等」和「前向恒等 ↔ 反向 all-reduce」这对偶，第 12 章会讲推理侧为什么只需要其中一半。

> 【推算】一次 all-reduce 的通信量（ring 算法、N 卡、张量 n 字节）约为 `2n(N-1)/N`。训练 M 的一层 Row 输出 `[batch×seq, h] = [4096, 8192]`，bf16 = `67 108 864 B = 64 MiB`；`TP=4` 时单层单次 `2×64×3/4 = 96 MiB`，每层前向 2 次 + 反向 2 次 = `384 MiB`，80 层 ≈ **30 GiB / micro-batch**。这个数就是 TP 必须放在 NVLink 内的原因，ch05 会把它和 IB 带宽对照。

## 1.7 阅读方式与边界

- **不要按顺序背 API**。建议先读 ch02（七个接缝）与 ch11（调度单循环），其余章都是往这两张骨架上挂模块。
- **源码片段是精简过的**：删掉了日志、profiler、断言与分支，保留了真实类名、方法名、变量名。凡标 `...` 的地方都是省略，不是伪代码占位。
- **本书不覆盖**：CUDA kernel 的 warp 级实现（站内 `gpu-book` 与 `vllm-kernel-dev-book` 已讲）、参数调优的实测表（`ray-vllm-optimization-book` 已讲）、多模态数据 pipeline（`iceberg-raydata-vllm-book` 已讲）。本书只做一件事：**把四个框架的控制流和数据流，落到源码行与可算数字上。**
- 【版本】网上大量教程引用 `vllm/v1/worker/gpu_model_runner.py` 与 `deepspeed/runtime/zero/stage_3.py`，前者已拆进 `v1/worker/gpu/`，后者实际文件名是 `stage3.py`（无下划线）——两个路径在 2026-11 都会 404。

## 1.8 本章小结

- 四个框架的关系是「一层底座 + 三种改写」：PyTorch 给原语，Megatron 改结构，DeepSpeed 改状态，vLLM 改请求与 KV 布局。
- 全书配置钉死为 70B / 训练 TP4-PP2-DP8 共 64 卡 / 推理单机 TP8 / 请求 R 的 3000+512 token。
- 四级证据标注：【源码】给路径、【文档】给日期、【推算】给算式、【版本】给分支。
- 三个反直觉：调度器无 prefill/decode 阶段、PagedAttention 退化成内存布局、ZeRO-1/2 的 `reduce_scatter` 名不副实。
- 一处可算数字：TP=4 时单层 4 次 all-reduce 共 384 MiB、80 层约 30 GiB per micro-batch。

> 下一章：把 PyTorch 的五件原语与七个接缝逐个拆开，看 NCCL 集合通信、autograd 图、allocator 与 Module hook 分别在哪一层被这四个框架接管。
