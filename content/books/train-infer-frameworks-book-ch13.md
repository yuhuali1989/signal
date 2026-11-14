---
title: "大模型训练与推理框架源码全书 - 第13章: gpu_memory_utilization 怎么变成 num_blocks"
book: "大模型训练与推理框架源码全书：从 PyTorch 原语到 Megatron、DeepSpeed 与 vLLM"
chapter: "13"
chapterTitle: "gpu_memory_utilization 怎么变成 num_blocks"
description: "逐行展开 determine_available_memory 的峰值 profiling 与减法公式，算出贯穿拓扑的 32768 个块和 52 万 token 容量，并把 CUDA Graph、投机解码、结构化输出、PD 分离与 FP8 KV 挂回六步链路"
date: "2026-11-14"
updatedAt: "2026-11-14"
agent: "研究员→编辑→审校员"
tags:
  - "vLLM"
  - "显存管理"
  - "CUDA Graph"
  - "PD分离"
  - "源码拆解"
type: "book"
part: "篇四 · 推理引擎"
---

# 第 13 章 · `gpu_memory_utilization` 怎么变成 `num_blocks`

## 13.1 结论：先跑一次 dummy forward 测峰值，再做减法

【源码】`vllm/v1/worker/gpu_worker.py::determine_available_memory()`：

```python
self.requested_memory = request_memory(init_snapshot, self.cache_config,
                                       external_weight_memory)
# 受 gpu_memory_utilization 约束，但按「初始空闲显存」而非「卡总显存」计

with memory_profiling(...) as profile_result:
    self.model_runner.profile_run()      # 用 max_num_batched_tokens 跑一次
                                         # 触发编译与峰值激活

self.available_kv_cache_memory_bytes = (
    self.requested_memory
    - profile_result.non_kv_cache_memory          # = total_consumed + transient_peak_headroom
    - cudagraph_memory_estimate                  # 【版本】v0.21 起默认计入
)
```

`num_blocks` 由 `KVCacheConfig` 按每层 spec 换算：

```python
bytes_per_block = 2 * block_size * num_kv_heads_per_gpu * head_size * dtype_bytes * num_layers
num_blocks      = available_kv_cache_memory_bytes // bytes_per_block
```

**这里最重要的认知**：`gpu_memory_utilization` 不是「KV cache 占卡的比例」，而是「允许 vLLM 总共用多少显存」。权重、激活、CUDA Graph、通信缓冲区都从这个额度里先扣，剩下的才归 KV。

## 13.2 贯穿拓扑的完整算例

沿用 ch12 的参数（80 层、每卡 1 个 KV head、`head_size=128`、`block_size=16`、bf16）：

> 【推算】
> ```
> bytes_per_block = 2 × 16 × 1 × 128 × 2 × 80
>                 = 655 360 B = 640 KiB
> ```
> 设 profile 后 `available_kv_cache_memory_bytes = 20 GiB`：
> ```
> num_blocks = 20 × 1024³ / 655 360 = 32 768
> 可缓存 token = 32 768 × 16 = 524 288
> ```
> 对照贯穿请求 R：单请求 `prompt 3000 + 输出 512 = 3512` token ≈ `⌈3512/16⌉ = 220` 块。理论并发上限 `32 768 / 220 ≈ 148` 个请求（忽略前缀共享）。若 8 个请求共享 2048 token 前缀，`ref_cnt` 让 128 块只存一份 → 每请求只需约 `92` 块，并发上限升到约 **356**。前缀缓存在这里从「省算力」变成了「直接换并发」。

## 13.3 三个反直觉推论

**① `gpu_memory_utilization` 0.90 → 0.95，KV 是线性变大的，但前提是 profile 峰值不变。** 一旦同时调大 `max_num_batched_tokens`，`profile_run()` 的峰值激活跟着涨，`non_kv_cache_memory` 增大，KV 反而可能变小。

**② 开 CUDA Graph 后，同样的 utilization 能分到的 KV 会变少。** 【版本】v0.21 起 `cudagraph_memory_estimate` 默认计入 profiling，日志会提示「equivalent utilization」。抓图要额外占每 batch shape 一份缓冲区，这是 `FULL` 与 `PIECEWISE` 模式取舍的一部分。

**③ `--kv-cache-memory-bytes` 可以完全绕过 utilization。** 【源码】注释明说 `This does not respect the gpu_memory_utilization config`。想要确定性部署（例如多实例严格分卡）时，直接指定字节数比调百分比可靠。

> 【推算】把 `max_num_batched_tokens` 从 8192 提到 16384，`profile_run()` 用更大的输入跑一次，峰值激活大约翻倍。若峰值 4 GiB → 8 GiB，`requested_memory` 固定 76 GiB（0.95×80）、`cudagraph` 2 GiB，则 KV 从 `76−4−2 = 70 GiB` 降到 `76−8−2 = 66 GiB`，`num_blocks` 从 114 688 降到 108 134（约 −5.8%）。**调大并发预算反而少了 3.3 万 token 容量**——这是第 11 章「不是越大越好」的定量版本。

## 13.4 子系统挂回 ch10 的六步链路

| 子系统 | 源码位置 | 挂在哪一步 | 与链路的接口 |
|---|---|---|---|
| **CUDA Graph** | `compilation_config.cudagraph_mode`（FULL / PIECEWISE）、`v1/worker/gpu/` | ③ execute_model | FA3/FA4 是 `AttentionCGSupport.ALWAYS`，FA2 只有 `UNIFORM_BATCH`；`update_block_table()` 允许 replay 时换块表 |
| **投机解码** | `v1/spec_decode/`、`scheduled_spec_decode_tokens` | ② schedule + ⑥ update | 调度时预留 `draft_slots`；拒绝后 `update_from_output()` 回调修正 `num_computed_tokens` |
| **结构化输出** | `v1/structured_output/` | ④ grammar bitmask + ⑤ sample | `get_grammar_bitmask()` → `sample_tokens(grammar_output)`；需等上一步 token 时走 deferred sampling |
| **PD 分离 / KV 传输** | `distributed/kv_transfer/`、`KVConnector` | ② schedule 之前 | `get_num_new_matched_tokens()` 命中远端 KV；异步加载时请求进 `WAITING_FOR_REMOTE_KVS` 且 `num_new_tokens=0`（不占预算） |
| **FP8 KV cache** | `flash_attn.py` | ③ 写/读 KV | `key_cache.view(fp8_dtype())` + `q_descale/k_descale/v_descale`；SM90 + head_size=512 + FA4 时 kernel block size 特殊变 64 |
| **多模态** | `scheduled_encoder_inputs` / `encoder_compute_budget` | ② schedule | 编码器输入单独有预算；图占位符 + image hash 进 block hash（ch12） |
| **DP / MoE** | `v1/engine/coordinator.py`、`DPEngineCoreProc` | ①~⑥ 全程 | wave 对齐 + dummy batch + `_has_global_unfinished_reqs()` all-reduce |

★结构化输出那一行解释 ch10 第 ④ 步为什么存在：grammar bitmask 必须在采样之前算好，而它被塞进 GPU 在途窗口，是这套六步链路里最典型的「CPU 活塞进 GPU 等待」。

★PD 分离那一行解释 ch11 坑 5：远端 KV 未就绪的请求 `num_new_tokens=0`，它不参与 token_budget 竞争，但也不能按普通 waiting 请求理解。

## 13.5 与训练侧显存账的并排（本书第一次合账）

| | 训练（ch07） | 推理（本章） |
|---|---|---|
| 主公式 | `4Ψ_local + 12Ψ_local/N` | `requested − non_kv − cudagraph` |
| 大头 | fp32 优化器状态（12 B/参数） | 权重（2 B/参数） + KV cache |
| 可调旋钮 | ZeRO stage、DP 度、offload | `gpu_memory_utilization`、`max_num_batched_tokens`、`block_size`、前缀缓存 |
| 分配时机 | 每 step 反复 flatten / gather / bucket | 初始化一次性申请 KV，运行期零分配 |
| 共享机制 | 无（DP 是副本） | `ref_cnt` 让多请求共享物理块 |
| 峰值来源 | 激活 + 梯度 bucket | `profile_run()` 的假输入 + CUDA Graph |

> 【推算】同一个 70B 模型，训练侧 ch07 算例 B 的 ZeRO-1 是每卡 `48.1 GB` 模型状态（不含激活）；推理侧 `TP=8` 时每卡权重 `140/8 = 17.5 GB`，加上 20 GiB KV 与约 6 GiB 权重外的运行时开销，总计约 `44 GB`。**两个数字量级接近但构成完全不同**：训练的大头是优化器状态，推理的大头是 KV cache。这解释了为什么训练卡看 HBM 容量、推理卡同时看 HBM 容量与带宽（KV 读取是访存密集型）。

## 13.6 调优与排错 checklist

按这个顺序查，比盲目调参快：

1. 日志里读 `non_kv_cache_memory` 与 `cudagraph_memory_estimate`，确认 KV 实际分到多少。
2. 用 `num_blocks × block_size` 算出可缓存 token 总量，对照并发目标。
3. 若 `num_blocks` 偏小：先确认 `max_num_batched_tokens` 是否过大（13.3），再考虑 `gpu_memory_utilization`。
4. 若前缀命中率低：查负载均衡是否按 `session_id` 一致性哈希（ch14），以及 `cache_salt` 是否把本该共享的块隔开了。
5. 若 P99 TTFT 抖动：查抢占次数（`_preempt_request`），不是查平均延迟。
6. 若开 FP8 KV 后精度掉：先查 `_k_scale/_v_scale` 的 per-tensor 校准，再查 backend 是否支持该 dtype。
7. 多实例部署：优先用 `--kv-cache-memory-bytes` 明确切分，别用百分比猜。

## 13.7 本章小结与坑

- 公式：`available = requested_memory − non_kv_cache_memory − cudagraph_memory_estimate`，`num_blocks = available / bytes_per_block`。
- 贯穿算例：`bytes_per_block = 640 KiB`，20 GiB → `32 768` 块 / `524 288` token；前缀共享能把并发上限从约 148 提到约 356。
- CUDA Graph 内存默认计入、KV 因而变少；`--kv-cache-memory-bytes` 可绕过 utilization。
- 七个子系统全部挂在 ch10 六步链路的某一步上，没有独立控制流。
- 训练与推理的显存大头分别是优化器状态与 KV cache，量级接近但构成不同。
- **坑 1**：把 utilization 理解成「KV 占比」，实际是总额度。
- **坑 2**：`max_num_batched_tokens` 调大 → profile 峰值涨 → `num_blocks` 反而少。
- **坑 3**：日志出现 OOM 先降 `max_num_seqs`？错，先看 `non_kv_cache_memory` 是谁吃掉的。
- **坑 4**：`FULL` CUDA Graph 与变长 batch 组合可能抓图爆炸，用 `PIECEWISE` 折中。
- **坑 5**：PD 分离下 `WAITING_FOR_REMOTE_KVS` 请求的 KV 不在本地 `num_blocks` 里，容量估算要单独算。
- **坑 6**：多租户 `cache_salt` 设得过细，共享前缀失效，等于白开前缀缓存。

> 下一篇把训练与推理真正接起来：第 14 章讲 checkpoint 从 `mp_rank_XX` 到 HuggingFace 的转换、TP 度从 4 变 8 时权重怎么重切、Ray Serve 多副本与前缀缓存亲和，以及一份合并两笔显存账的部署清单。
