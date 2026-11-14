---
title: "大模型训练与推理框架源码全书 - 第12章: KV cache 物理布局：block_table 与 slot_mapping"
book: "大模型训练与推理框架源码全书：从 PyTorch 原语到 Megatron、DeepSpeed 与 vLLM"
chapter: "12"
chapterTitle: "KV cache 物理布局：block_table 与 slot_mapping"
description: "展开 kv_cache 张量的真实 shape、写 KV 与读 KV 分离的两段代码、slot 索引的可算例子、前缀缓存的 sha256 哈希链与双向链表 LRU，并说明 V1 为何不再调用手写 PagedAttention kernel"
date: "2026-11-14"
updatedAt: "2026-11-14"
agent: "研究员→编辑→审校员"
tags:
  - "vLLM"
  - "KV Cache"
  - "前缀缓存"
  - "FlashAttention"
  - "源码拆解"
type: "book"
part: "篇四 · 推理引擎"
---

# 第 12 章 · KV cache 物理布局：`block_table` 与 `slot_mapping`

## 12.1 结论：PagedAttention 在 V1 里是内存布局，不是 kernel

第 1 章给过这个反直觉结论，本章把它落到代码。V0 的 `paged_attention_v1/v2` 是手写 CUDA kernel，负责「根据块表读出分页 KV 并算注意力」；V1 把这件事**上移到了 metadata 层**：KV 仍分页存放，但读 KV 的是通用的 `flash_attn_varlen_func`，块表只是它的一个参数。

因此换 FA2 / FA3 / FA4 / FlashInfer backend 变得相对容易——分页逻辑不再绑在某个 kernel 实现里。

## 12.2 `kv_cache` 的真实 shape

【源码】`vllm/v1/attention/backends/flash_attn.py` 及 `gpu_worker` 的 cache 初始化：

```python
# 每层的 KV cache 张量
kv_cache = torch.empty(num_blocks, num_kv_heads, block_size, 2 * head_size,
                       dtype=..., device="cuda")

# forward 里把它拆成 K / V 两个视图
key_cache, value_cache = kv_cache.transpose(1, 2).split(self.head_size, dim=-1)
# key_cache / value_cache : [num_blocks, block_size, num_kv_heads, head_size]
```

为什么要 `transpose(1,2)`：初始化时按 `[blocks, heads, block_size, 2*head_size]` 布局便于按层分配；而 FlashAttention 的 paged 接口期望「块内 token 维在 heads 之前」，所以做一个**视图变换**（不复制数据）再 `split`。

> 【推算】贯穿拓扑 I：Llama-70B 级模型 `80 层`、`kv_heads=8`、`TP=8` → 每卡 `num_kv_heads_per_gpu = 1`、`head_size=128`、`block_size=16`、bf16。
> ```
> bytes_per_block_per_layer = 2 × 1 × 16 × 128 × 2 B = 8 192 B = 8 KiB
> bytes_per_block_all_layers = 8 KiB × 80 = 640 KiB
> ```
> 这正是 ch13 显存公式里的 `bytes_per_block`。注意 `2` 的第一个 2 是 K 与 V 两份——所以「640 KiB/块」已经包含了全部 80 层。

## 12.3 写与读是两段独立代码

```python
# 【源码】flash_attn.py
class FlashAttentionBackend:
    forward_includes_kv_cache_update = False     # ★ 声明：写 KV 不在 forward 里

    def do_kv_cache_update(self, layer, key, value, kv_cache, slot_mapping):
        key_cache, value_cache = kv_cache.transpose(1, 2).split(self.head_size, dim=-1)
        reshape_and_cache_flash(
            key, value, key_cache, value_cache,
            slot_mapping, self.kv_cache_dtype, layer._k_scale, layer._v_scale)

    def forward(self, layer, query, key, value, kv_cache, attn_metadata, output, ...):
        key_cache, value_cache = kv_cache.transpose(1, 2).split(self.head_size, dim=-1)
        block_table = attn_metadata.block_table
        _FA4_DENSE_ATTENTION_KERNEL(
            q=query[:num_actual_tokens],
            k=key_cache, v=value_cache,
            cu_seqlens_q=attn_metadata.query_start_loc,
            seqused_k=attn_metadata.seq_lens,
            max_seqlen_k=attn_metadata.max_seq_len,
            block_table=block_table, causal=..., ...)
        # 内部最终落到 flash_attn_varlen_func(*args, **kwargs)
```

| | 写 KV | 读 KV |
|---|---|---|
| 函数 | `reshape_and_cache_flash` | `flash_attn_varlen_func` |
| 索引张量 | **`slot_mapping`**（每个 token 一个物理槽位） | **`block_table`**（每个请求一行逻辑→物理块映射） |
| 粒度 | token 级 scatter | 请求级 gather |
| dtype | 可 FP8（`_k_scale/_v_scale`） | 对应 descale |

**两个张量的分工是本章最关键的一句**：`slot_mapping` 决定「这一步新算出的 K/V 写到哪」，`block_table` 决定「算注意力时从哪读历史 K/V」。前者是写入地址，后者是读取页表。

## 12.4 slot 索引的可算例子

请求 R 已缓存 2048 token（ch11 命中 128 块），本步要算 952 个新 token。设它分到的物理块是 `[7, 15, 203, ...]`：

> 【推算】`block_size = 16`，第 k 个逻辑块对应 `block_table[req][k]` 个物理块。
> - 逻辑块 128（第 2049~2064 个 token）→ 假设物理块 7 → `slot = 7×16 + offset = 112..127`
> - 逻辑块 129 → 物理块 15 → `slot = 240..255`
> - 逻辑块 130 → 物理块 203 → `slot = 3248..3263`
>
> 于是 `slot_mapping` 里这 952 个 token 的地址**完全不连续**——这正是「分页」的含义。物理块可以从 free queue 任意位置取，无需连续显存；换个请求释放的块马上能被复用。`kv_cache[block_id, :, offset, :]` 就是最终落点。

`block_table` 是 `[num_reqs, max_blocks_per_req]` 的 padded 2D tensor，ch11 的四个请求对应 `[4, max_blocks]`。V1 里它是 **append-only** 的：发现重复缓存块时不改写旧映射，重复块等请求 free 时才消除（本章 12.6）。这个取舍是为了让 CUDA Graph replay 时的 metadata 更新足够简单。

## 12.5 V0 与 V1 的代码差异

| | V0（v0.6 之前） | V1（本书） |
|---|---|---|
| KV 管理 | `BlockSpaceManager` | `KVCacheManager` + `BlockPool` |
| 注意力 kernel | 手写 `paged_attention_v1/v2` | `flash_attn_varlen_func`（通用） |
| 调度 | 有 prefill/decode 两阶段 | token 预算单循环（ch11） |
| 抢占 | 支持 swap 到 CPU | recompute |
| 块表 | 可变、可去重 | append-only |

> 【版本】网上教程里的 `vllm/core/scheduler.py`、`BlockSpaceManager`、`paged_attention_v1` 都属于 V0。概念（分页、块表、连续批处理）完全可迁移，但源码路径、类名、metadata 字段都对不上。站内 `inference-ch02.md` 讲的是 V0 时代的原理层，本书补的是 V1 实现层。

## 12.6 前缀缓存：哈希链 + 双向链表 LRU

【源码】`vllm/v1/core/kv_cache_manager.py` 与 `block_pool.py`：

```python
@dataclass
class KVCacheBlock:
    block_id: int                              # 不可变
    block_hash: BlockHash                      # 块满时才赋值，驱逐时清空
    ref_cnt: int                               # >0 不能被驱逐
    prev_free_block: KVCacheBlock | None = None    # 双向链表，直接嵌在对象里
    next_free_block: KVCacheBlock | None = None    # O(1) 摘除
```

设计要点逐条：

1. **初始化时一次性创建全部 `KVCacheBlock` 对象**，free queue 只存 head/tail 指针，避免运行时 Python 对象分配开销。
2. **哈希链**：`hash = sha256(parent_hash, block_tokens, extra_hashes)`。【版本】v0.11 起默认 sha256，可选 `sha256_cbor` / `xxhash`。`extra_hashes` 里放 LoRA id、多模态图像 hash、`cache_salt`。**只缓存满块**（不满 16 token 的尾块不进缓存）。
3. **命中路径**：`get_computed_blocks()` 按 token 逐块算 hash 查表 → `allocate_slots()` 对命中块 `ref_cnt += 1` 并从 free queue 摘除（touch）→ 再从队头弹新块。队头若是已缓存块，顺带做 LRU 驱逐。
4. **请求结束时按逆序放回队尾**：最后一个块哈希了最多 token、最不可能被复用，应该最先被驱逐。
5. **`cache_salt`**：多租户场景防止通过响应延迟差推断「别人是否命中过某段缓存」的时序侧信道。
6. **append-only block table**：V1 发现重复缓存块时不像 V0 那样把 `[0,3]` 改成 `[0,1]`，重复块留到 free 时消除。

> 【推算】请求 R 的 2048 token 共享前缀 → `2048/16 = 128` 个满块。若 8 个并发请求共享同一系统提示，命中块的 `ref_cnt` 可达 8，KV 显存节省 `128 × 640 KiB = 80 MiB`，且 ch11 算过这 2048 token 不占 token_budget。**前缀缓存的收益是「省显存 + 省预算」双份**，不是单纯省计算。

**与 SGLang 的分野**：vLLM 用固定大小的哈希块 + LRU free queue，实现简单、与 CUDA Graph 友好；SGLang 的 RadixAttention 用基数树表示任意深度前缀，在多层共享前缀（多轮对话、Agent 树搜索）上命中更高，代价是树维护与驱逐更复杂。站内 `content/papers/sglang-radix-attention.md` 有专门拆解。

## 12.7 与训练侧 KV / 激活的对照

| | 训练 | 推理 |
|---|---|---|
| 中间状态 | 激活（每层前向的临时 Tensor） | KV cache（跨 step 常驻） |
| 生命周期 | 反向用完即释放 / checkpoint 重算 | 请求结束才 free |
| 显存策略 | 激活重算换显存 | 分页 + 前缀复用 |
| 分配方式 | allocator 缓存池反复复用 | 初始化一次性申请、终身持有 |
| 共享 | 无 | `ref_cnt` 让多请求共享同一物理块 |

两边都用了第 2 章的「原语① allocator」，但策略相反：训练追求**频繁复用小块**，推理追求**一次申请大块、运行中零分配**。这直接决定了 ch13 的显存公式为什么与 ch07 的 ZeRO 公式长得完全不一样。

## 12.8 本章小结与坑

- `kv_cache` shape `[num_blocks, num_kv_heads, block_size, 2*head_size]`，经 `transpose(1,2).split` 变成 K/V 视图。
- 写用 `reshape_and_cache_flash(slot_mapping)`，读用 `flash_attn_varlen_func(block_table)`；`forward_includes_kv_cache_update=False` 是二者的分界标志。
- `slot = physical_block_id × block_size + offset`，地址不连续正是分页的意义。
- 前缀缓存 = sha256 哈希链 + 满块缓存 + 双向链表 LRU + `ref_cnt` + 逆序放回 + `cache_salt`。
- V1 block table append-only；V0 手写 paged kernel 不在主路径。
- **坑 1**：把 `slot_mapping` 与 `block_table` 混用——一个是写地址、一个是读页表。
- **坑 2**：`new_block_ids_to_zero` 没处理，读到上一请求残留 KV。
- **坑 3**：GQA 下 `TP > num_kv_heads` 无法整除，需要 KV head 复制，别硬除。
- **坑 4**：FP8 KV 在 SM90 + `head_size=512` 等组合会走特殊 kernel block size（64），改 `block_size` 前查 `get_supported_kernel_block_sizes()`。
- **坑 5**：多租户不加 `cache_salt` 有时序侧信道风险。
- **坑 6**：轮询负载均衡让本地前缀缓存失效，必须按 `session_id` 一致性哈希（ch14）。

> 下一章：把 `gpu_memory_utilization` 一路追到 `num_blocks`，算出贯穿拓扑能缓存多少 token，并把 CUDA Graph、投机解码、结构化输出、PD 分离、FP8 KV 五个子系统挂回 ch10 的六步链路。
