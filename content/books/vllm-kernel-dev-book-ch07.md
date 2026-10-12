---
title: "vLLM 算子开发全书 - 第7章: 硬约束：连续批处理与 CUDA graph 下写 kernel 必须知道的事"
book: "vLLM 算子开发全书：新增架构何时开刀、何时白嫖，以及算子融合怎么落地"
chapter: "7"
chapterTitle: "硬约束：连续批处理与 CUDA graph 下写 kernel 必须知道的事"
description: "讲透 vLLM 分页 KV cache 给自定义 kernel 带来的硬约束：slot_mapping 与 block table、展平的 query 形状与 cu_seqlens、chunked prefill 混合批、无动态形状与 CUDA graph 分桶捕获，以及写错时的静默破坏风险"
date: "2026-10-12"
updatedAt: "2026-10-12"
agent: "研究员→编辑→审校员"
tags:
  - "vLLM"
  - "PagedAttention"
  - "CUDA Graph"
  - "连续批处理"
  - "算子开发"
  - "GPU 内核"
type: "book"
---

# 第 7 章 · 硬约束：连续批处理与 CUDA graph

## 7.1 为什么这一章是"必读"而不是"选读"

前面几章的 bug 大多是**报错型**的：加载失败、shape 不匹配、编译错误——都好查。

这一章的 bug 是**静默型**的：

> 一个假设 KV cache 连续的 kernel，会**静默破坏其他请求的 cache slot**——不崩溃、不报错，只是某些请求的输出突然变错。

这类 bug 可能上线几周才被发现。所以写任何**读写 K/V 的 kernel** 之前，必须理解 vLLM 的内存模型。

## 7.2 约束一：KV cache 是分页的，不是连续的

vLLM 的核心是把 KV cache 切成块（block）按需分配。物理布局大致是：

```
block_table：每个序列一个 block 索引列表
slot_mapping：每个 token 一个「写到哪个物理 slot」
```

**对 kernel 的要求**：

| 要求 | 说明 |
|---|---|
| ✅ 接受 `[num_blocks, block_size, num_kv_heads, head_dim]` | 按 block 索引访问 |
| ✅ 或接受 `slot_mapping` | 按 token 目标 slot 做 gather/scatter |
| ❌ 不能用 token position 直接索引连续缓冲 | 会越界到别的请求 |
| ❌ 不能假设 K/V 在显存里连续 | vLLM 根本不是这么存的 |

**写法要点**：写 K/V 时必须**通过 `slot_mapping` 做 gather/scatter**，而不是按序列长度算偏移。

**必读的参考实现**：`reshape_and_cache_flash`（`csrc/cache_kernels.cu`）及其 Triton 版本。**在动手设计任何触碰 K/V 的 kernel 之前先读它。**

**另一个要求**：在文档里写清楚你的 kernel 期望的 KV layout（FlashAttention 风格 vs xFormers 风格），或确认它与当前配置的 attention backend 一致。

## 7.3 约束二：batch 是展平的，不是 [B, H, S, D]

连续批处理下，**同一个 batch 里每个请求处在生成的不同位置**。所以 kernel 看到的不是整齐的四维张量，而是展平表示：

```
query 形状：[num_total_query_tokens, num_heads, head_dim]
             ↑ 不是 [batch, heads, seq, head_dim]
```

请求之间的边界由 metadata 描述：

| metadata | 含义 |
|---|---|
| `cu_seqlens_q` | query 的累积序列长度（前缀和），给出每个请求的起止 |
| `seq_lens` | 每个请求的 KV 长度 |

**kernel 必须用 `cu_seqlens_q` / `seq_lens` 来定位请求边界**，不能假设等长、不能假设 batch 维度在第一维。

## 7.4 约束三：chunked prefill 下 prefill 与 decode 共存

开启 chunked prefill 后，**同一个 batch 里既有 prefill token 又有 decode token**。

这对 kernel 提出两种选择：

| 选择 | 后果 |
|---|---|
| ✅ **同时处理两种阶段**（推荐） | kernel 复杂一些，但保留 chunked prefill 的全部收益 |
| ⚠️ 只支持 decode，要求调度器分阶段 | ★**放弃 chunked prefill 这一重要特性**，吞吐会明显下降 |

**诚实标注原则**：如果你的 kernel 只支持 decode，必须明确说明——它只能在调度器跑纯 decode batch 时被选中，且引擎仍需保留 prefill 路径。

## 7.5 约束四：没有动态形状 —— CUDA graph 是分桶捕获的

vLLM 默认（非 `enforce_eager`）会**对一组分桶的 batch size 捕获 CUDA graph**（典型如 1, 2, 5, 7, 16, 24, 32, …），运行期由 dispatcher 按当前 batch 形状选择重放哪个图。

对 kernel 的要求：

| 要求 | 说明 |
|---|---|
| ❌ 不能有依赖数据（data-dependent）的控制流 | 会导致图捕获失败或回退到 eager |
| ❌ 不能在 kernel 里做 host 同步 | 图内不允许 |
| ✅ 形状必须由外部 metadata 给出 | 通过 `cu_seqlens_q`、`slot_mapping` 等张量传入 |
| ✅ 所有中间分配的形状必须是捕获时可确定的 | 动态分配会破坏图 |

**运行期选择逻辑**：`vllm/v1/cudagraph_dispatcher.py` 每一步根据当前 batch 形状、attention metadata、活跃 LoRA 决定重放哪个已捕获的图；长尾形状走 piecewise 路径。

## 7.6 约束五：LoRA 会改变算子的调用形态

多 LoRA 场景下，同一 batch 内不同请求可能用不同适配器。这影响：

- 权重的加载与切换（punica 相关 kernel）
- `batched_rotary_embedding` 之所以存在（支持多 LoRA），就是这个原因
- CUDA graph 的选择（dispatcher 会把"活跃 LoRA"纳入决策）

**如果你的算子要支持 LoRA**，必须有对应的 batched 版本，而不是只写单适配器路径。

## 7.7 一张自检清单：kernel 上线前逐条核对

```
□ KV 访问是否全部走 slot_mapping / block_table，而非连续偏移？
□ 是否已在文档里写明期望的 KV layout？
□ query 是否按 [num_total_tokens, heads, head_dim] 展平形状处理？
□ 请求边界是否用 cu_seqlens_q / seq_lens 定位，而非假设等长？
□ chunked prefill 下是否仍能正确工作？（若否，是否已明确标注并保留 prefill 路径）
□ 是否存在 data-dependent 控制流？（若有，CUDA graph 会失败）
□ 是否存在 host 同步？（图内禁止）
□ 是否支持多 LoRA（如需）？
□ 是否有 meta function（@register_fake）供 shape propagation？
□ ROCm / CPU 路径是否注册？
□ 与 forward_native 对拍是否通过？
```

## 7.8 一个正面例子：为什么 PagedAttention 要写 V1 和 V2

`paged_attention_v1` 与 `paged_attention_v2` 的存在本身就是这些约束的产物：

- **V1**：一份 kernel 处理一个 query token 对应多个 KV block 的情况，适合序列较长、block 多的场景
- **V2**：拆分了 reduction 阶段，适合 block 数量多到 V1 的并行度不够时用

它们不是"两个版本"，而是**针对不同 block 数量/序列长度分布的两条路径**——这正说明在分页 + 变长 + 批处理的环境下，kernel 必须按数据分布分路，而不是写一个通用版本硬扛。

**另一个佐证**：`merge_attn_states`、`convert_vertical_slash_indexes` 这些算子的存在，说明连"注意力状态合并"都有专门算子——因为它们在图里是高频出现的模式。

## 7.9 本章小结

- ★**最重要的风险**：假设 KV 连续的 kernel 会**静默破坏其他请求**，不报错。
- 五条硬约束：分页 cache（走 slot_mapping/block_table）、展平 query（用 cu_seqlens_q/seq_lens）、chunked prefill 混合批、无动态形状（分桶 CUDA graph）、多 LoRA。
- **动手前必读 `reshape_and_cache_flash`**。
- 只支持 decode 的 kernel 必须诚实标注，否则会连累 chunked prefill 被关掉。
- 上线前过一遍**十一条自检清单**。

**下一章（终章）**讲怎么验证算子真的对、真的快：正确性对拍流程、性能剖析方法、贡献上游的路径，以及一份完整的开发 Checklist。
