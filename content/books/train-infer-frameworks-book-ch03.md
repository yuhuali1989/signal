---
title: "大模型训练与推理框架源码全书 - 第3章: 三座仓库的源码地图与版本边界"
book: "大模型训练与推理框架源码全书：从 PyTorch 原语到 Megatron、DeepSpeed 与 vLLM"
chapter: "3"
chapterTitle: "三座仓库的源码地图与版本边界"
description: "给出 Megatron-LM、DeepSpeed、vLLM 三座仓库的关键目录与类名地图，演示从用户入口反向追踪控制流的四条路径，并列出 2026-11 版本下已经失效的常见路径"
date: "2026-11-14"
updatedAt: "2026-11-14"
agent: "研究员→编辑→审校员"
tags:
  - "源码阅读"
  - "Megatron"
  - "DeepSpeed"
  - "vLLM"
  - "版本边界"
type: "book"
part: "篇一 · 全景与底座"
---

# 第 3 章 · 三座仓库的源码地图与版本边界

## 3.1 结论：读框架源码要从「入口」反推，不要从目录树正着翻

三座仓库都是数万行级，按目录顺序读必然迷路。有效做法是**先钉住一个用户可见的入口，沿调用链往里走三层，一直到出现 `torch.distributed.*` 或 `Tensor.data` 的那一行为止**——那一行就是框架真正做架构决策的地方。本章给出三条这样的链和一张可 grep 的锚点表。

【版本】以下路径核对时间 2026-11-14，分支分别为 Megatron-LM `main`、DeepSpeed `master`、vLLM `main`。

## 3.2 Megatron-LM：模型定义层即架构层

```
megatron/
├── core/
│   ├── parallel_state.py            ★ 进程组的唯一构造处（已标记 deprecated）
│   ├── tensor_parallel/
│   │   ├── mappings.py              ★ 4 个 region autograd.Function
│   │   ├── layers.py                ★ Column/RowParallelLinear、VocabParallelEmbedding
│   │   ├── random.py                 TP/DP 下的 RNG 状态管理
│   │   └── data.py                   broadcast_data / scatter 到 TP rank
│   ├── pipeline_parallel/
│   │   ├── schedules.py             ★ forward_backward_pipelining_without_interleaving (1F1B)
│   │   └── p2p_communication.py     ★ send/recv 传 [seq, batch, hidden]
│   ├── transformer/                  TransformerLayer / Attention / MLP（组合上面的并行层）
│   ├── optimizer/
│   │   └── distrib_optimizer.py     ★ 自带 ZeRO-1 等价实现
│   └── distributed/                  ProcessGroupCollection、最终化状态
├── training/
│   ├── arguments.py                  命令行参数 → config
│   ├── initialize.py                 initialize_megatron → dist.init + initialize_model_parallel
│   └── training.py                  ★ train_step / pretrain 主循环
└── pretrain_gpt.py                  用户入口：model_provider + forward_step
```

**追踪链 A（一个权重怎么被切成 4 份）**：

```
pretrain_gpt.py::model_provider
  → GPTModel(...).  → TransformerLayer → ParallelMLP
  → ColumnParallelLinear.__init__             【shape 决策】
       output_size_per_partition = divide(28672, tp_size=4) = 7168
       self.weight = Parameter(torch.empty(7168, 8192))
  → forward: copy_to_tensor_model_parallel_region(input_, group=tp_group)
       → mappings.py::_CopyToModelParallelRegion.apply   【通信决策】
  → forward: F.linear(input_parallel, weight)
  → 若 gather_output: gather_from_tensor_model_parallel_region
```

终点是 `mappings.py` 那四个 Function 与 `layers.py` 里的 `Parameter(torch.empty(...))`。**Megatron 的架构秘密全部在这两个文件里**，其余目录都是组合。

**追踪链 B（反向的通信在哪补）**：`torch.autograd.Function.backward` → `_reduce(grad_output, group)` → `torch.distributed.all_reduce`。注意梯度归约不是在 `optimizer.step()` 前统一做的，而是**散落在每个 TP 边界的 Function 里**；DP 维度的梯度归约另由 `DistributedOptimizer` / DDP 的 bucket 处理。两个维度、两套机制，别混。

## 3.3 DeepSpeed：入口是 Engine，核心是 hook 注册

```
deepspeed/
├── runtime/
│   ├── engine.py                   ★ DeepSpeedEngine：接管 backward / step
│   ├── zero/
│   │   ├── stage_1_and_2.py         ★ ZeRO-1/2（文件名有下划线）
│   │   ├── stage3.py                ★ ZeRO-3（★文件名没有下划线）
│   │   ├── partition_parameters.py  ★ zero.Init / GatheredParameters / ZeroParamStatus
│   │   ├── partitioned_param_coordinator.py  ★ fetch_sub_module / release_sub_module
│   │   └── offload_config.py          CPU/NVMe offload 的 DSZ3 状态
│   ├── activation_checkpointing/
│   │   └── checkpointing.py         reenter_backward_if_needed()
│   └── pipe/                        ★ 与 Megatron PP 不兼容的另一套流水线
├── ops/adam/                        fused_adam 等 CUDA 扩展
└── __init__.py::initialize           ★ 用户入口，返回 (engine, optimizer, ...)
```

**追踪链 C（一个参数什么时候能用）**：

```
deepspeed.initialize(model=...)
  → DeepSpeedEngine.__init__ → self._configure_zero_optimizer
  → stage3.py::FP16_DeepSpeedZeroOptimizer_Stage3.__init__
       → self._create_param_coordinator()
       → module.register_forward_pre_hook(fetch_sub_module)   【时机决策】
       → module.register_forward_hook(release_sub_module)
       → param.register_grad_hook(...)                        【梯度分片】
  → engine.forward → 每个子模块前 all-gather 参数，用完立即 partition
```

终点是 `partitioned_param_coordinator.py` 的 trace 生成与 `stage3.py` 的 hook 注册。**DeepSpeed 的架构秘密是「什么时候参数是完整的」这个状态机**，而不是任何 CUDA 代码。

> 【版本】`deepspeed/runtime/zero/stage_3.py` 是不存在的路径，`stage3.py` 才是；`stage_1_and_2.py` 反而有下划线。这个不对称每年都会坑一批人。同理 `deepspeed/runtime/pipe/` 的 `PipelineModule` 与 Megatron 的 `schedules.py` 是两套实现，**同时开必然冲突**（ch09）。

## 3.4 vLLM：V0 与 V1 是两套代码，别读错目录

```
vllm/
├── entrypoints/
│   ├── llm.py                       ★ 离线同步入口 LLM.generate()
│   └── openai/api_server.py         在线入口
├── v1/                             ★★ V1 全在这里；V0 在 vllm/core/、vllm/worker/
│   ├── engine/
│   │   ├── async_llm.py             AsyncLLM
│   │   ├── core.py                  ★ EngineCore / EngineCoreProc / run_busy_loop
│   │   ├── core_client.py           ZMQ 客户端
│   │   └── output_processor.py      detokenize / stop / stream
│   ├── core/
│   │   ├── sched/
│   │   │   ├── scheduler.py         ★ schedule() / SchedulerOutput
│   │   │   ├── async_scheduler.py   异步调度
│   │   │   └── output.py            ModelRunnerOutput
│   │   ├── kv_cache_manager.py      ★ get_computed_blocks / allocate_slots
│   │   └── block_pool.py            ★ KVCacheBlock / free_block_queue
│   ├── worker/
│   │   ├── gpu_worker.py            ★ determine_available_memory()
│   │   └── gpu/                     ★ 新版目录：input_batch.py / attn_utils.py / sample/
│   ├── attention/backends/
│   │   └── flash_attn.py            ★ block_table / slot_mapping / reshape_and_cache_flash
│   ├── spec_decode/                 投机解码
│   ├── structured_output/           grammar bitmask
│   └── kv_transfer/ 或 distributed/kv_transfer/  KVConnector（PD 分离）
└── distributed/parallel_state.py    自建 TP/PP/DP 组
```

**追踪链 D（一个请求怎么变成一次 GPU forward）**：

```
LLM.generate(prompts)
  → LLMEngine.add_request → EngineCoreClient.add_request_async
  → ZMQ DEALER → EngineCoreProc.process_input_sockets（IO 线程，释放 GIL）
  → MsgpackDecoder(EngineCoreRequest) → preprocess_add_request()
  → input_queue → EngineCore.run_busy_loop → EngineCore.step()
       → scheduler.schedule()            【token 预算决策】
       → model_executor.execute_model(scheduler_output, non_block=True)
            → GPUModelRunner.execute_model
                 → 组 input_ids / query_start_loc / seq_lens / block_table / slot_mapping
                 → FlashAttentionBackend.forward（写 KV + 读 KV）
       → scheduler.update_from_output() 【推进 num_computed_tokens】
  → ZMQ PUSH → OutputProcessor → 流式返回
```

终点是 `scheduler.py::schedule()` 与 `flash_attn.py::forward()`。前者决定「算多少」，后者决定「KV 从哪读、往哪写」。

> 【版本】`vllm/v1/worker/gpu_model_runner.py` 在 2026-11 的 main 上已 **404**，内容拆进了 `v1/worker/gpu/`。`vllm/core/scheduler.py`、`BlockSpaceManager`、手写 `paged_attention_v1/v2` CUDA kernel 属于 V0（v0.6 之前），概念可迁移但代码完全不是一回事。本书若无特别说明，一律指 V1。

## 3.5 四条「从现象反查源码」的 grep 锚点

| 现象 | 先 grep | 落在哪个文件 |
|---|---|---|
| 训练显存超了，怀疑优化器状态没分片 | `single_partition_of_fp32_groups` | `stage_1_and_2.py` |
| 训练某层通信量异常大 | `_reduce(` 或 `all_reduce(` | `mappings.py`、`layers.py` |
| 推理 TTFT 忽高忽低 | `num_scheduled_tokens`、`token_budget` | `scheduler.py::schedule` |
| 前缀缓存命中率低 | `get_computed_blocks`、`block_hash` | `kv_cache_manager.py`、`block_pool.py` |
| 抢占后重复计算 | `_preempt_request`、`num_computed_tokens = 0` | `scheduler.py` |
| 权重加载后 TP 维度对不上 | `output_size_per_partition`、`partition_dim` | `layers.py`、vLLM `model_executor/layers/linear.py` |
| KV 显存比预期少 | `non_kv_cache_memory`、`cudagraph_memory_estimate` | `gpu_worker.py` |

这张表比背诵目录树有用：**框架的可见行为几乎都能映射到一个唯一的变量名**，而变量名在仓库里是全局可搜的。

## 3.6 版本边界清单（本书所有【版本】断言汇总）

| 断言 | 成立版本 | 风险 |
|---|---|---|
| `parallel_state.py` 已 deprecated，新代码用 `ProcessGroupCollection` | Megatron main 2026-11 | 旧版只用全局 mpu |
| `stage3.py` 无下划线 / `stage_1_and_2.py` 有下划线 | DeepSpeed master 2026-11 | 路径 404 |
| `gpu_model_runner.py` 拆进 `v1/worker/gpu/` | vLLM main 2026-11 | 路径 404 |
| V1 主路径用 `flash_attn_varlen_func` 而非手写 paged kernel | vLLM V1 | V0 完全不同 |
| `cudagraph_memory_estimate` 默认计入显存 profiling | vLLM v0.21+ | 旧版 KV 会多分一些 |
| Prefix hash 默认 sha256 | vLLM v0.11+ | 旧版可选 python hash |
| `scatter_to_tensor_model_parallel_region` 的 docstring 与实现不符 | Megatron main | 见 ch05 |

## 3.7 与站内既有内容的分工

本书不重复站内已经写透的部分，而是补它们缺的那一层：

| 站内已有 | 覆盖 | 本书补什么 |
|---|---|---|
| `inference-ch02.md`（vLLM 原理） | PagedAttention / Continuous Batching 概念 | V1 多进程、EngineCore.step、真实 `SchedulerOutput` 字段 |
| `vllm-kernel-dev-book` | 算子接入与融合 | 调度与 KV 控制面 |
| `ray-vllm-optimization-book` | 参数调优实测 | 参数最终落到哪一行源码 |
| `gpu-book-ch07.md` | NCCL 与多进程协作 | 集合通信在 autograd 图里的插入位置 |
| `ai-interview-ch01.md` | ZeRO 4×/8× 概念 | `16Ψ → 4Ψ+12Ψ/N` 的源码推导 |
| 两篇 2026-11 源码级文章 | 单点拆解 | 训练↔推理贯通、统一显存账本、checkpoint 转换 |

## 3.8 本章小结

- 读法：从用户入口反推三层，找到 `torch.distributed.*` 或 `.data` 替换那一行，就是架构决策点。
- 三座仓库的核心文件各只有两个：Megatron `mappings.py` + `layers.py`，DeepSpeed `stage3.py` + `partitioned_param_coordinator.py`，vLLM `scheduler.py` + `flash_attn.py`。
- 四条追踪链 A/B/C/D 分别回答「权重怎么切 / 反向通信在哪 / 参数何时可用 / 请求怎么变成 forward」。
- 已 404 的路径：`v1/worker/gpu_model_runner.py`、`zero/stage_3.py`；V0 的 `core/scheduler.py`、`BlockSpaceManager` 不属于本书范围。
- 一张 grep 锚点表把可观测现象映射到唯一变量名。

> 下一篇进入训练侧。第 4 章先把 64 卡的 rank 网格算清楚：为什么 `order="tp-cp-ep-dp-pp"` 这一个字符串，能把 TP 通信锁在同一台机器内。
