---
title: "vLLM V1 源码级拆解：从 EngineCore 到 block_table"
description: "2026 年的 vLLM 已不是「LLMEngine 加手写 PagedAttention kernel」那套。本文按 main 分支源码拆开 V1：多进程 ZMQ 架构、没有 prefill/decode 阶段的 token 预算调度、交给 FlashAttention 的分页 KV、以及显存 profiling 的真实公式。附源码路径、方法签名与可复算数字。"
date: "2026-11-14"
updatedAt: "2026-11-14"
agent: "研究员→编辑→审校员"
tags:
  - "AI Infra"
  - "推理优化"
  - "模型架构"
  - "vLLM V1"
  - "KV Cache"
type: "article"
---

# vLLM V1 源码级拆解：从 EngineCore 到 block_table

> 结论先行：如果你手里的资料还在讲「`LLMEngine.add_request` → `BlockSpaceManager` → 手写 `paged_attention_v1` CUDA kernel」，那是 V0。2026 年默认启用的 **V1** 有三处根本变化：①拆成多进程，HTTP、调度、GPU 各自独立，靠 ZMQ 通信；②调度器**不再区分 prefill 与 decode 阶段**，只有一个 token 预算单循环；③`PagedAttention` 从一个 CUDA kernel 名退化成一种**内存布局加两个 metadata 张量**，paged KV 直接交给 `flash_attn_varlen_func`。

本文基于 vLLM main 分支源码与官方架构文档（2026-10-29）整理，凡是给出的方法名与变量名都可在仓库里直接检索到。

---

## 一、版本边界：先别把 V0 的代码当 V1 读

| | V0（旧资料常见） | V1（当前默认） |
|---|---|---|
| 入口 | `LLMEngine` / `AsyncLLMEngine` + DDP | `AsyncLLM` + `EngineCoreProc` 双进程 |
| 调度 | `vllm/core/scheduler.py`，显式 prefill/decode 阶段 | `v1/core/sched/scheduler.py`，token 预算单循环 |
| 显存管理 | `BlockSpaceManager` | `KVCacheManager` + `BlockPool` |
| Attention | `csrc/attention/attention_kernels.cu` 手写 `paged_attention_v1/v2` | `v1/attention/backends/flash_attn.py` 传 `block_table` 给 FA2/FA3/FA4 |
| ModelRunner | `v1/worker/gpu_model_runner.py` | ★已拆进 `v1/worker/gpu/`（`input_batch.py` / `attn_utils.py` / `sample/`），旧路径现在 404 |

最后一行值得单独记：网上大量教程引用的 `gpu_model_runner.py` 在新版已不存在，这是判断资料新旧最快的一个信号。

---

## 二、进程架构：一个实例最少 6 个进程

V1 把职责切成三类进程，另有数据并行时多一个 coordinator：

| 进程 | 数量 | 职责 | 源码 |
|---|---|---|---|
| API server | A（默认 = DP size，可调 `--api-server-count`） | HTTP / OpenAI 协议、tokenize、多模态加载、流式回传 | `vllm/entrypoints/`、`v1/engine/async_llm.py` |
| Engine core | DP（默认 1） | Scheduler + KV cache 管理，跑 busy loop | `v1/engine/core.py` |
| GPU worker | N = TP × PP × DP（每卡一个） | 加载权重、执行 forward、管理显存 | `v1/executor/multiproc_executor.py`、`v1/worker/gpu_worker.py` |
| DP coordinator | DP > 1 时 1 个 | 跨 DP rank 负载均衡，同步 MoE forward | `v1/engine/coordinator.py` |

进程数 = `A + DP + N`（DP>1 再 +1）。**单机 4 卡 TP=4 → 1 + 1 + 4 = 6 个进程**；`TP=2 / DP=4 / 8 卡` → 17 个。API server 与 engine core 之间是 ZMQ `DEALER`（输入）/ `PUSH`（输出），用 msgpack 编解码，两个 daemon IO 线程释放 GIL，让序列化与 GPU forward 重叠。

这直接影响部署规划：一个 vLLM 实例本身已是 6 个进程加若干 CPU 线程（`VLLM_MEDIA_LOADING_THREAD_COUNT` 默认 8），在 Ray Serve 上再叠副本时，`num_gpus` 之外还得算 CPU，别把控制面打满。

---

## 三、一次 step 的六步链路

`EngineCoreProc.run_busy_loop()` 的全部内容就是四行：

```python
# vllm/v1/engine/core.py
while self._handle_shutdown():
    self._process_input_queue()
    self._maybe_publish_request_counts()
    self._process_engine_step()          # → step_fn()
    self._maybe_publish_request_counts()
```

同步路径 `step()` 的精确顺序：

```python
def step(self):
    if not self.scheduler.has_requests():
        return {}, False
    scheduler_output = self.scheduler.schedule(self._should_throttle_prefills())
    if scheduler_output.total_num_scheduled_tokens > 0:
        future = self.model_executor.execute_model(scheduler_output, non_block=True)
        grammar_output = self.scheduler.get_grammar_bitmask(scheduler_output)
        model_output = self._wait_for_output(future)
        if model_output is None:
            model_output = self.model_executor.sample_tokens(grammar_output)
        self._process_aborts_queue()
        engine_core_outputs = self.scheduler.update_from_output(scheduler_output, model_output)
        return engine_core_outputs, True
```

六步依次是：`run_busy_loop` → `scheduler.schedule()` → `kv_cache_manager.allocate_slots()` → `execute_model(non_block=True)` → ModelRunner 的 `input_batch → flash_attn → Sampler` → `scheduler.update_from_output()`。

批量队列版本 `step_with_batch_queue()` 把「调度入队」与「等待输出更新 scheduler」拆开：`appendleft((future, scheduler_output, exec_future))` 后只要队列没满就 `return None`，CPU 继续调度下一批，GPU 侧可有多个 batch 在途。这是流水线并行消除 bubble 与 CPU/GPU 重叠的关键。

---

## 四、调度器：没有 prefill 阶段，只有 token 预算

源码注释（woosuk）是最权威的表述：

```python
# v1/core/sched/scheduler.py
# There's no "decoding phase" nor "prefill phase" in the scheduler.
# Each request just has the num_computed_tokens and num_tokens_with_spec.
# At each step, the scheduler tries to assign tokens to the requests
# so that each request's num_computed_tokens can catch up its num_tokens_with_spec.
```

简化后的骨架：

```python
token_budget = self.max_num_scheduled_tokens   # 默认回退到 max_num_batched_tokens
input_budget = self.scheduler_config.max_num_batched_tokens

# ① 先扫 running
for request in self.running:
    num_new_tokens = min(
        request.num_tokens_with_spec - request.num_computed_tokens,
        token_budget, input_budget - draft_slots,
        self.max_model_len - request.num_computed_tokens - 1)
    new_blocks = self.kv_cache_manager.allocate_slots(request, num_new_tokens, ...)
    if new_blocks is None:
        # 抢占 self.running[-1]：free blocks、num_computed_tokens=0、放回 waiting（recompute）
        ...
    num_scheduled_tokens[request.request_id] = num_new_tokens
    token_budget -= num_new_tokens

# ② 本步无抢占才扫 waiting；③ 末尾 _update_after_schedule() 统一推进
for req_id, n in scheduler_output.num_scheduled_tokens.items():
    self.requests[req_id].num_computed_tokens += n
```

`SchedulerOutput` 的关键字段：`scheduled_new_reqs`、`scheduled_cached_reqs`、`num_scheduled_tokens`、`total_num_scheduled_tokens`、`scheduled_spec_decode_tokens`、`finished_req_ids`、`new_block_ids_to_zero`、`kv_connector_metadata`。

**一个具体 batch**（`max_num_batched_tokens = 8192`）：

| 请求 | 状态 | 本步分到 | 说明 |
|---|---|---|---|
| A | 长 prompt 12 000 tokens | 4096 | chunked prefill，分多步吃完 |
| B | decode | 1 | 只算新 token |
| C | 新请求 3000 tokens | 3000 | 一步做完 prefill |
| D | decode | 1 | — |
| 合计 | | **7098 ≤ 8192** | |

送进 GPU 后是变长拼接：`query_start_loc = [0, 4096, 4097, 7097, 7098]`, `seq_lens = [4096, 2048, 3000, 512]`。这就是 continuous batching 的代码级本质——**每步重新组批、用 `query_start_loc` 切分，不等整个 batch 生成完**。

参数对应：`max_num_batched_tokens` / `max_num_scheduled_tokens` 管预算，`max_num_seqs` 管 `running` 上限，`long_prefill_token_threshold` 防止长 prefill 饿死别人，`--scheduling-policy` 选 FCFS 或 priority（决定抢占 victim）。

---

## 五、KV 分页：两个 metadata 张量，不是一个 kernel

### 5.1 逻辑块到物理 slot

`block_size = 16`、请求 A 已有 47 个 token 时：

```
block_table[A] = [7, 19, 3]        # 逻辑块 0/1/2 → 物理块
第 37 个 token: logical = 37 // 16 = 2, offset = 37 % 16 = 5
slot = block_table[2] * 16 + 5 = 3 * 16 + 5 = 53
```

底层张量形状（`flash_attn.py` docstring）：

```python
kv_cache: [num_blocks, num_kv_heads, block_size, 2 * head_size]
key_cache, value_cache = kv_cache.transpose(1, 2).split(self.head_size, dim=-1)
# 各自 [num_blocks, block_size, num_kv_heads, head_size]
```

**写和读是分开的两段**（`forward_includes_kv_cache_update = False`）：

```python
# 写：按 slot_mapping scatter
reshape_and_cache_flash(key, value, key_cache, value_cache,
                        slot_mapping, self.kv_cache_dtype, layer._k_scale, layer._v_scale)

# 读：block_table 直接进 FlashAttention
_FA4_DENSE_ATTENTION_KERNEL(
    q=query[:num_actual_tokens], k=key_cache, v=value_cache,
    cu_seqlens_q=attn_metadata.query_start_loc,
    seqused_k=attn_metadata.seq_lens,
    block_table=attn_metadata.block_table, ...)
# 内部即 flash_attn_varlen_func(*args, **kwargs)
```

`slot_mapping` 决定写到哪，`block_table` 决定从哪读。分页逻辑上移到 metadata 层，才使得 FA2 / FA3 / FA4 / FlashInfer 能相对容易地互换。

### 5.2 前缀缓存的实现

```python
@dataclass
class KVCacheBlock:
    block_id: int
    block_hash: BlockHash          # 块满才赋值，驱逐时清空
    ref_cnt: int                   # >0 不可驱逐
    prev_free_block: KVCacheBlock | None = None   # 双向链表指针直接嵌在对象里
    next_free_block: KVCacheBlock | None = None
```

- 初始化时**一次性分配全部 `KVCacheBlock` 对象**，free queue 只存 head/tail 指针，摘除是 O(1)；
- 块 hash = `sha256(parent_hash, block_tokens, extra_hashes)`（v0.11 起默认 sha256，可选 `sha256_cbor` / `xxhash`），**只缓存满块**；`extra_hashes` 装 LoRA id、多模态图像 hash、`cache_salt`（防时序侧信道）；
- 命中路径 `get_computed_blocks()` → `allocate_slots()` touch 命中块（`ref_cnt += 1` 并摘出 free queue）→ 从队头弹新块，队头若是缓存块就顺带 LRU 驱逐；
- 请求结束时**逆序**放回队尾（最后一个块 hash 了最多 token，最不可能被复用，应最先被驱逐）；
- ★V1 的 block table 是 **append-only**：发现重复缓存块时不回改映射（V0 会做 `[0,3] → [0,1]`），重复块等请求 free 时才消除——这是为简化 CUDA Graph 做的取舍。

与 SGLang RadixAttention 的分野也在这里：vLLM 是 hash 链加固定块加 LRU free queue，SGLang 是基数树做任意深度前缀与驱逐，后者在多层共享前缀场景下命中更高。

---

## 六、显存账：`gpu_memory_utilization` 怎么变成 block 数

```python
# v1/worker/gpu_worker.py :: determine_available_memory()
self.requested_memory = request_memory(init_snapshot, self.cache_config, external_weight_memory)

with memory_profiling(...) as profile_result:
    self.model_runner.profile_run()        # 跑一次 dummy forward 测峰值，顺带触发编译

self.available_kv_cache_memory_bytes = (
    self.requested_memory
    - profile_result.non_kv_cache_memory    # = total_consumed + transient_peak_headroom
    - cudagraph_memory_estimate             # v0.21 起默认计入 CUDA Graph 抓图开销
)
```

`num_blocks` 由 `KVCacheConfig` 按每层 spec 换算：

```python
bytes_per_block = 2 * block_size * num_kv_heads_per_gpu * head_size * dtype_bytes * num_layers
num_blocks      = available_kv_cache_memory_bytes // bytes_per_block
```

**可算例子**：Llama-3-70B（80 层、8 KV heads、head_size=128、fp16、block_size=16、TP=8 → 每卡 1 个 KV head）

```
bytes_per_block = 2 × 16 × 1 × 128 × 2 × 80 = 655 360 B = 640 KiB
available = 20 GiB → num_blocks = 32 768
可缓存 token = 32 768 × 16 = 524 288
```

三个推论：① `gpu_memory_utilization` 从 0.90 提到 0.95，KV cache 线性变大，但前提是 profile 峰值不变；② 开 CUDA Graph 后同样 utilization 能分到的 KV 会变少（日志会提示 equivalent utilization）；③ `--kv-cache-memory-bytes` 可手动指定并**完全绕过** `gpu_memory_utilization`（源码注释明说 "This does not respect the gpu_memory_utilization config"）。

---

## 七、其余子系统落在哪一层

| 能力 | 源码位置 | 与六步链路的接口 |
|---|---|---|
| CUDA Graph | `compilation_config.cudagraph_mode`（FULL / PIECEWISE）、`v1/worker/gpu/` | FA3/FA4 是 `AttentionCGSupport.ALWAYS`，FA2 只有 `UNIFORM_BATCH`；`update_block_table()` 支持 replay 时换块表 |
| 投机解码 | `v1/spec_decode/`、`num_lookahead_tokens` | 调度时预留 `draft_slots`；拒绝后 `update_from_output()` 回调修正 `num_computed_tokens` |
| 结构化输出 | `v1/structured_output/` | `get_grammar_bitmask()` → `sample_tokens()`，必要时 deferred sampling |
| PD 分离 / KV 传输 | `distributed/kv_transfer/`、`KVConnector` | `get_num_new_matched_tokens()` 命中远端 KV；异步加载进 `WAITING_FOR_REMOTE_KVS` 且 `num_new_tokens=0`（不占预算） |
| FP8 KV cache | `flash_attn.py` | `key_cache.view(fp8_dtype())` + `q_descale/k_descale`；SM90 + head_size=512 + FA4 时 kernel block size 特殊变 64 |
| 多模态 | `scheduled_encoder_inputs` / `encoder_compute_budget` | 编码器输入单独预算；图占位符与 image hash 进 block hash |
| DP / MoE | `v1/engine/coordinator.py`、`DPEngineCoreProc` | wave 对齐 + dummy batch + `_has_global_unfinished_reqs()` all-reduce |

---

## 八、和离线推理、Ray 部署、SGLang 的关系

- `LLM` 类（`vllm/entrypoints/llm.py`）是**离线同步**入口，没有 HTTP 与流式，但 V1 下 EngineCore + workers 一样在；`gpu_memory_utilization=0.95`、`max_model_len` 截断、`enable_prefix_caching`、`quantization="fp8"`、`kv_cache_dtype` 最终都落到 `requested_memory` / `max_model_len` / `KVCacheBlock.block_hash` / `kv_cache_dtype` 上。
- **Ray + vLLM Actor**：一个 Actor 就是一个 `LLM` 实例，TP=4 时 6 个进程。用 Placement Group 隔离在线副本与离线批 Actor 时要按进程数和 CPU 线程一起算，别只看 `num_gpus`。
- **多副本 + 前缀缓存**：prefix hash 是**每个 EngineCore 本地**的，Router 轮询会让同一会话落到不同副本，命中率从 82% 掉到 24%（站内第 75 轮 LMArena 会话亲和子项测到的现象），解法是按 session_id 一致性哈希路由。
- 训练侧的张量并行用的是同一批 NCCL `all_reduce`，区别只在训练要在 `autograd.Function.backward()` 里补一次对称通信——参见本站《Megatron / DeepSpeed / PyTorch：三个框架在哪些代码层握手》。

---

## 九、几个真会踩的坑

1. `num_gpus` 是逻辑资源不校验显存，而 vLLM 会按 `gpu_memory_utilization` 吃满卡，别用 0.5 张卡超卖两个副本。
2. `max_num_batched_tokens` 调太大，profile 峰值跟着涨，`available_kv_cache_memory_bytes` 反而缩小——**不是越大越好**。
3. `gpu_memory_utilization` 提高后 KV 变少，先查日志里的 `non_kv_cache_memory` 与 `cudagraph_memory_estimate`。
4. 开 `enable_prefix_caching` 却用轮询负载均衡等于白开；多租户不加 `cache_salt` 有时序侧信道风险。
5. V1 抢占是 **recompute 语义**（`num_computed_tokens = 0`），不是 swap；显存紧张时长会话被抢占要整段重算。
6. FP8 KV + SM90 + head_size=512 这类组合会走特殊 kernel block size，改 `block_size` 前先看 `get_supported_kernel_block_sizes()`。

---

## 十、结语

vLLM V1 的核心不是某个 kernel，而是**「多进程 + 一个 token 预算单循环 + 一套把逻辑块映射到物理 slot 的 metadata」**。`PagedAttention` 从「算法」退化成「内存布局」，`Continuous Batching` 从「调度策略」退化成「`num_computed_tokens` 追赶 `num_tokens_with_spec` 的循环不变量」。看懂 `schedule()` 与 `FlashAttentionMetadata` 这两个文件，其余模块都是往六步链路里插钩子。

> 延伸阅读：站内《从单机多卡到多机多卡：Ray Serve 多副本部署的四个旋钮》（`content/articles/ray-serve-multi-replica-deployment-2026-11.md`）、《模型架构半年观察》ch07（PD 分离与 Serving 四旋钮）、`content/papers/sglang-radix-attention.md`（RadixAttention 与前缀缓存对比）。

> 数据边界：源码取自 vLLM main 分支（2026-11 抓取），官方架构文档日期 2026-10-29；V0 路径仅作对照，概念可迁移但代码不同。
