---
title: "大模型训练与推理框架源码全书 - 第11章: 调度器只有一个 token 预算循环"
book: "大模型训练与推理框架源码全书：从 PyTorch 原语到 Megatron、DeepSpeed 与 vLLM"
chapter: "11"
chapterTitle: "调度器只有一个 token 预算循环"
description: "用源码注释证明 V1 调度器不存在 prefill 与 decode 阶段，展开 token_budget 单循环、SchedulerOutput 全部字段、8192 预算的四个请求算例、抢占重算语义与关键参数在源码里的落点"
date: "2026-11-14"
updatedAt: "2026-11-14"
agent: "研究员→编辑→审校员"
tags:
  - "vLLM"
  - "调度器"
  - "连续批处理"
  - "token预算"
  - "源码拆解"
type: "book"
part: "篇四 · 推理引擎"
---

# 第 11 章 · 调度器只有一个 token 预算循环

## 11.1 结论：连续批处理不是「策略」，是一个循环不变量

【源码】`vllm/v1/core/sched/scheduler.py::Scheduler.schedule` 的注释原文（woosuk）：

```python
# NOTE(woosuk) on the scheduling algorithm:
# There's no "decoding phase" nor "prefill phase" in the scheduler.
# Each request just has the num_computed_tokens and num_tokens_with_spec.
# num_tokens_with_spec = len(prompt_token_ids) + len(output_token_ids) + len(spec_token_ids).
# At each step, the scheduler tries to assign tokens to the requests
# so that each request's num_computed_tokens can catch up its num_tokens_with_spec.
```

V0 时代调度器有 `waiting / running / swapped` 三队列加 prefill/decode 两套逻辑；V1 把它们压成一句话：**每个请求有两个数——已算到哪（`num_computed_tokens`）、需要算到哪（`num_tokens_with_spec`）——每步按预算把前者往后推**。

这条不变量一口气解释了三件事：

| 现象 | 为什么自然成立 |
|---|---|
| **chunked prefill** | 长 prompt 的 `num_tokens_with_spec` 很大，预算不够就只推一部分，剩下的下一步接着推 |
| **decode 与 prefill 混批** | 两者只是「差额不同」的请求，在同一个循环里争同一份 `token_budget` |
| **投机解码** | `spec_token_ids` 计入 `num_tokens_with_spec`，差额变大；拒绝后 `update_from_output()` 回调修正 |

## 11.2 `schedule()` 骨架

```python
# 【源码】scheduler.py（精简，变量名保留）
token_budget = self.max_num_scheduled_tokens      # 未设则回退 max_num_batched_tokens
input_budget = self.scheduler_config.max_num_batched_tokens

# ① 先扫 running：decode 与「未做完的 prefill chunk」都在这里
for request in self.running:
    num_new_tokens = min(
        request.num_tokens_with_spec - request.num_computed_tokens,
        token_budget,
        input_budget - draft_slots,                    # 给投机解码留槽
        self.max_model_len - request.num_computed_tokens - 1,
    )
    new_blocks = self.kv_cache_manager.allocate_slots(request, num_new_tokens, ...)
    if new_blocks is None:                             # KV 不够 → 抢占
        preempted_req = self.running[-1]               # FCFS：抢占最后 admitted 的
        self._preempt_request(preempted_req, ...)
        continue
    num_scheduled_tokens[request.request_id] = num_new_tokens
    token_budget -= num_new_tokens
    input_budget -= num_new_tokens + draft_slots

# ② 本步无抢占才扫 waiting（新请求）：先 get_computed_blocks 查前缀，再 allocate_slots
# ③ 末尾 _update_after_schedule() 统一推进
for req_id, n in scheduler_output.num_scheduled_tokens.items():
    self.requests[req_id].num_computed_tokens += n
```

**顺序很重要**：先 `running` 后 `waiting`，且只有「本步没发生抢占」才接纳新请求。这是防止新请求把正在 decode 的老请求挤掉的保护逻辑。

`allocate_slots()` 返回 `None` 是唯一触发抢占的信号——调度器不直接看显存余量，而是问 KV manager 要块，要不到就抢。这个接口把「显存管理」与「请求调度」干净地分开了（ch12 展开）。

## 11.3 `SchedulerOutput`：CPU 交给 GPU 的完整契约

| 字段 | 含义 | 谁消费 |
|---|---|---|
| `scheduled_new_reqs` | 本步新接纳请求（含 prompt token ids） | model runner 组 `input_ids` |
| `scheduled_cached_reqs` | 老请求本步要算的 token 与块表增量 | 同上 |
| `num_scheduled_tokens` | `dict[req_id, n]` ★核心 | 组 `query_start_loc` |
| `total_num_scheduled_tokens` | 本步总 token 数 | `EngineCore.step()` 判断是否下发 |
| `scheduled_spec_decode_tokens` | 投机解码的 draft token | spec decode 模块 |
| `scheduled_encoder_inputs` | 多模态编码器输入 | 视觉 encoder |
| `finished_req_ids` | 已完成，可回收块 | KV manager |
| `new_block_ids_to_zero` | 新分配需清零的块 | worker 初始化 |
| `kv_connector_metadata` | PD 分离的 KV 传输元数据 | `KVConnector` |

★注意 `new_block_ids_to_zero`：新块必须清零，否则可能读到上一请求的残留 KV——这是「前缀缓存 + 块复用」组合下最容易出安全/正确性问题的地方。

## 11.4 8192 预算的四个请求（可算）

贯穿拓扑 I：`max_num_batched_tokens = 8192`。设某一步队列里有：

| 请求 | 状态 | 差额 | 本步分到 | 说明 |
|---|---|---|---|---|
| A | 长 prompt 12000，已算 0 | 12000 | **4096** | chunked prefill，剩余下一步继续 |
| B | decode | 1 | **1** | 只算新 token |
| C | 新请求 3000（就是请求 R） | 3000 | **3000** | 一次做完 |
| D | decode | 1 | **1** | |
| | | **合计** | **7098 ≤ 8192** | 剩余 1094 不够再塞 A 的一个完整 chunk |

A 为什么只拿 4096 而不是 8192？源码里 `long_prefill_token_threshold` 会给一个自适应下限 `input_budget // num_eligible_reqs`，防止一条长 prompt 独占预算饿死其他请求。这里 `8192 / 4 = 2048` 起步，按 chunk 对齐后得到 4096。

送进 GPU 的元数据（**这就是 continuous batching 的物理形态**）：

```python
input_ids       = cat(A[4096], B[1], C[3000], D[1])      # [7098]
query_start_loc = [0, 4096, 4097, 7097, 7098]             # 变长拼接的切分点
seq_lens        = [4096, 2048, 3000, 512]                 # 各请求已缓存长度
block_table     = padded 2D tensor [4, max_blocks]        # 逻辑块 → 物理块
slot_mapping    = [7098]                                  # 每个 token 的物理 slot
```

> 【推算】`query_start_loc` 长度必须是 `batch+1 = 5`，且末元素等于 `total_num_scheduled_tokens = 7098` ✅。`input_ids` 是一维拼接、没有 `[batch, seq]` 的规整形状——这是 FlashAttention varlen 接口的要求，也是为什么下一步可以任意重组批次：没有 padding 浪费，组批只是重新 `cat` 一遍。

**新请求在任意一步抢到剩余预算就能插进来；做完的请求立刻退出，空出的槽下一步被填。** 这就是「连续」二字的全部实现，不是一个独立的 batching 模块。

## 11.5 前缀命中怎么进这个循环

贯穿请求 R 的 prompt 3000 token 中有 2048 token 共享前缀，`block_size=16`：

> 【推算】`2048 / 16 = 128` 个满块可被前缀缓存命中。请求 R 进入 `waiting` 时，`kv_cache_manager.get_computed_blocks()` 按 token 逐块算 hash 查表，命中这 128 块后 `allocate_slots()` 只需为剩余 `3000 - 2048 = 952` token 分配约 `⌈952/16⌉ = 60` 个新块；同时 `num_computed_tokens` 初始值直接设为 2048，**这 2048 个 token 不占本步 token_budget**。所以在 11.4 的表里，C 若命中前缀，实际只需 952 token，省下的预算能再塞一个请求。前缀缓存的收益不是「算得更快」，而是「预算里少占一份」——这点在评估命中率时最容易被忽略。

## 11.6 抢占是 recompute，不是 swap

```python
# 【源码】scheduler.py::_preempt_request
def _preempt_request(self, request, ...):
    self.kv_cache_manager.free(request)              # 释放全部块
    request.num_computed_tokens = 0                 # ★归零，不是保存进度
    self.waiting.appendleft(request)                # 回队首，重算
```

V0 支持把 KV swap 到 CPU 再换回；V1 简化成**释放 + 从头重算**。代价是显存紧张时长会话被抢占后要重算整段 prompt，收益是省掉 swap 逻辑、与 CUDA Graph / metadata 更友好。

> 【推算】一个已生成 4096 token 的请求被抢占，重算 4096 token 按 8192 预算只需 1 步 prefill，但在高并发下这 1 步会挤掉同批所有 decode 请求，造成 TTFT 尖刺。所以 `max_num_seqs` 调太大不是「提高并发」，是「提高抢占概率」。

## 11.7 参数落点表（把调优口诀还原成源码字段）

| 启动参数 | 源码字段 | 影响 | 调错的症状 |
|---|---|---|---|
| `--max-num-batched-tokens` | `token_budget` / `input_budget` | 每步总算力上界 | 太小 → chunked prefill 步数多、TTFT 差；太大 → 激活显存涨（ch13） |
| `--max-num-scheduled-tokens` | 独立新字段，未设回退前者 | 与 input_budget 分离限流 | 设错会让两者互相牵制 |
| `--max-num-seqs` | `max_num_running_reqs` / model-runner slot | 同时在跑的请求数 | 太大 → 抢占频繁、KV 抖动 |
| `--enable-chunked-prefill` | 关闭时 `num_new_tokens > request_token_budget` 直接 `break` | 长 prompt 能否与 decode 混批 | 关掉后长请求独占整步 |
| `--long-prefill-token-threshold` | 自适应下限 `input_budget // num_eligible_reqs` | 防长 prompt 饿死其他请求 | 太小 → decode 延迟抖动 |
| `--scheduling-policy priority` | victim = `max(running, key=(priority, arrival_time))` | 抢占谁 | 默认 FCFS 抢最后 admitted 的 |
| `--enable-prefix-caching` | `get_computed_blocks` / `block_hash` | 命中块不占预算 | 轮询负载均衡下命中率暴跌（ch14） |

## 11.8 与训练侧调度的对照

| | 训练（ch06 PP） | 推理（vLLM） |
|---|---|---|
| 批的组成 | 启动时固定的 m 个 micro-batch | **每步重新组批** |
| 调度目标 | 填满流水线、最小化气泡 | 填满 `token_budget`、最小化 TTFT |
| 请求长度 | 全部相同（定长 seq） | 每请求不同（差额驱动） |
| 抢占 | 无 | KV 不足即 recompute |
| 状态推进 | `micro_batch` 计数 | `num_computed_tokens` 追赶 `num_tokens_with_spec` |

两种调度共用同一个底层事实：**GPU 喜欢大而规整的 GEMM**，所以训练把它做成静态定长、推理把它做成变长拼接 + `query_start_loc`。差别来自「能不能等」——训练可以等一整批凑齐，推理必须每一步都立刻决定。

## 11.9 本章小结与坑

- V1 调度器无 prefill/decode 阶段，只有 `num_computed_tokens` 追赶 `num_tokens_with_spec` 的 token 预算单循环。
- 顺序：先 `running`、无抢占再 `waiting`、末尾统一推进状态。
- `SchedulerOutput` 十余个字段是 CPU→GPU 的完整契约，其中 `new_block_ids_to_zero` 关乎正确性。
- 8192 预算算例：4096 + 1 + 3000 + 1 = 7098；`query_start_loc = [0,4096,4097,7097,7098]`。
- 前缀缓存命中 128 块，让请求 R 的 2048 token 不占预算——收益是「少占预算」而非「算得更快」。
- 抢占是 `free + num_computed_tokens=0` 的 recompute，不是 swap。
- **坑 1**：`max_num_batched_tokens` 调太大，profile 峰值上涨、KV 反而变少（ch13）。
- **坑 2**：`max_num_seqs` 过大导致抢占尖刺，表现为 P99 TTFT 抖动而非平均变慢。
- **坑 3**：开了前缀缓存却用轮询负载均衡，命中率从 82% 掉到 24%（第 75 轮 LMArena 会话亲和子项）。
- **坑 4**：`query_start_loc` 末元素必须等于 `total_num_scheduled_tokens`，改调度器时先验这个断言。
- **坑 5**：PD 分离下远端 KV 未就绪的请求进 `WAITING_FOR_REMOTE_KVS` 且 `num_new_tokens=0`，不占预算，别按普通 waiting 逻辑推断。

> 下一章：`allocate_slots()` 到底分配了什么——`block_table` 与 `slot_mapping` 如何把逻辑块映射到物理显存，以及 V1 为什么不再用手写 PagedAttention kernel。
