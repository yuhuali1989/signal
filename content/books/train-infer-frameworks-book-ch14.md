---
title: "大模型训练与推理框架源码全书 - 第14章: 从 checkpoint 到服务：训练与推理真正接上的那一层"
book: "大模型训练与推理框架源码全书：从 PyTorch 原语到 Megatron、DeepSpeed 与 vLLM"
chapter: "14"
chapterTitle: "从 checkpoint 到服务：训练与推理真正接上的那一层"
description: "给出 ZeRO 分片合并、TP 切片拼接与 TP 度从 4 变 8 的重切代码骨架、GQA 的 KV head 复制处理，以及 Ray Serve 多副本的进程数规划、会话亲和路由和训练推理统一显存账本"
date: "2026-11-14"
updatedAt: "2026-11-14"
agent: "研究员→编辑→审校员"
tags:
  - "Checkpoint转换"
  - "权重重切"
  - "Ray Serve"
  - "会话亲和"
  - "部署"
type: "book"
part: "篇五 · 贯通与结论"
---

# 第 14 章 · 从 checkpoint 到服务：训练与推理真正接上的那一层

## 14.1 结论：训练与推理之间没有一个「进程组」能复用

ch04 说过两套 `ProcessGroup` 互不认识，ch09 说过三种 checkpoint 格式互不相认。所以从训练产物到线上服务，中间必然有一段**离线的权重转换**：它不是格式转换那么简单，而是要在新的并行度下重新切分同一个数学张量。

用贯穿配置走完整链路：训练 `TP=4 / PP=2 / DP=8` + Megatron `DistributedOptimizer`，推理 `TP=8` 单机 vLLM。

```
训练侧产物
  mp_rank_00/model_states.pt ... mp_rank_03/       （4 个 TP 切片 × 2 个 PP stage）
  + zero 分片的 optimizer states                  （推理不需要）
        │
        ├─ ① 丢弃优化器状态（推理只读权重）
        ├─ ② 合并 PP stage：把 40 层 + 40 层按顺序拼回 80 层
        ├─ ③ 合并 TP=4 切片 → 得到完整权重
        ├─ ④ 权重名映射 Megatron → HuggingFace
        ├─ ⑤ 按推理 TP=8 重新切分（或交给 vLLM 加载时切）
        ├─ ⑥ GQA 的 KV head 复制 / 量化导出（可选）
        ▼
HuggingFace 格式目录（config.json + safetensors）
        ▼ vLLM LLM(model=...) 加载
推理服务
```

★若训练叠了 DeepSpeed ZeRO-3，还要在第 ① 步之前加一步 `GatheredParameters`（ch08）——否则磁盘上每个 DP rank 只有 1/N 分片，直接合并会得到残缺权重且不会报错。

## 14.2 TP 切片的合并规则（从 ch05 反推）

ch05 给过切分规则，合并就是它的逆运算：

| 层类型 | 训练 TP=4 每卡 shape | 合并轴 | 完整 shape |
|---|---|---|---|
| `ColumnParallelLinear`（QKV / up / gate） | `[2560, 8192]` / `[7168, 8192]` | **dim 0** `cat` | `[10240, 8192]` / `[28672, 8192]` |
| `RowParallelLinear`（out-proj / down） | `[8192, 2048]` / `[8192, 7168]` | **dim 1** `cat` | `[8192, 8192]` / `[8192, 28672]` |
| bias（不分片） | 每卡都有完整副本 | 取 rank 0 即可 | — |
| LayerNorm / Embedding | 视配置复制或按 vocab 切 | 按实际切法 | — |

```python
import torch
from collections import defaultdict

def merge_tp_shards(shards, layer_name, tp_size):
    """shards: list[dict[str, Tensor]]，按 tp_rank 排序"""
    keys = shards[0].keys()
    out = {}
    for k in keys:
        parts = [s[k] for s in shards]
        if is_column_parallel(k):          # QKV / up / gate
            out[k] = torch.cat(parts, dim=0)       # ★ dim 0
        elif is_row_parallel(k):           # out_proj / down
            out[k] = torch.cat(parts, dim=1)       # ★ dim 1
        else:                               # bias / norm：复制，取 rank 0
            out[k] = parts[0]
    return out

# 校验：合并后的 shape 必须等于 config 里的全局 shape
assert merged["mlp.up_proj.weight"].shape == (28672, 8192)
assert merged["mlp.down_proj.weight"].shape == (8192, 28672)
```

> 【推算】`4 × [7168, 8192]` 沿 dim 0 拼接得 `[28672, 8192]`，参数量 `234 881 024`；bf16 约 `448 MiB`。80 层里 MLP 三项合计约 `1.34 GiB`/层 × 80 ≈ `107 GiB`——与 70B 模型的 bf16 `140 GB` 量级自洽（差额是 attention/embedding/norm）。**校验拼接是否正确的唯一可靠方法是断言 shape 与参数总量**，肉眼比对数字很容易漏掉转置。

## 14.3 TP 度变化：4 → 8

两种做法：

**A · 导出完整权重，让 vLLM 加载时按 `TP=8` 自己切**（推荐，简单）。vLLM 的权重加载器按 `partition_dim` 与 `tp_rank` 从完整张量里 `narrow()` 出本卡分片。

**B · 离线重切成 8 份**，用于超大模型无法在单机内存里放下完整权重时：

```python
def reshard(weight, src_tp, dst_tp, dst_rank, partition_dim):
    # 先把 src_tp 份按原轴拼回全局，再按 dst_tp 重新 narrow
    full = torch.cat(src_shards, dim=partition_dim)
    per = full.shape[partition_dim] // dst_tp
    return full.narrow(partition_dim, dst_rank * per, per).contiguous()
```

**GQA 的坑在这里出现**：贯穿配置 `kv_heads=8`，训练 `TP=4` 时每卡 2 个 KV head，推理 `TP=8` 时每卡 1 个——刚好整除。若推理 `TP=16`，`8/16` 除不尽，vLLM 会**复制 KV head**（`num_kv_heads_replicas`）而不是报错；此时不同 TP rank 持有相同 KV 权重，ch05 的 all-reduce 语义仍然成立，但显存里多了副本，容量估算要单独加一份。

> 【推算】推理 `TP=8` 每卡权重 `140 GB / 8 = 17.5 GB`；若 `TP=16` 且 KV head 复制，KV 权重复制部分约 `2 × 8 × 128 × 8192 × 2 B × 80 层` 量级很小（约 `2.6 GiB` 分摊到 16 卡可忽略），但 attention 的 KV cache 也会因 `num_kv_heads_per_gpu` 不能小于 1 而不再减半——**多切 TP 不总是省显存**。

## 14.4 权重名映射与量化导出

Megatron 与 HuggingFace 的命名差异是转换脚本里最琐碎但最容易出错的一段：

| Megatron | HuggingFace | 注意 |
|---|---|---|
| `language_model.encoder.layers.N.self_attention.query_key_value.weight` | `model.layers.N.self_attn.q_proj / k_proj / v_proj.weight` | QKV 是**合并**张量，要按 GQA 比例拆三份 |
| `...dense.weight` | `...o_proj.weight` | Row 层 |
| `...mlp.dense_h_to_4h.weight` | `...gate_proj / up_proj.weight` | up 与 gate 交错存储，需按顺序切两半 |
| `...mlp.dense_4h_to_h.weight` | `...down_proj.weight` | Row 层 |
| `...input_layernorm.weight` | `...input_layernorm.weight` | 基本一致 |

★`dense_h_to_4h` 的 up/gate 拆分是历史上最经典的转换 bug：Megatron 为了一次 GEMM 算完两个门，把 gate 与 up 按行交错存成 `[2f, h]`，HuggingFace 是两张独立的 `[f, h]`。切错不会报 shape 错误（两者 shape 都对），但模型输出会明显变差。

量化导出（FP8 / AWQ / GPTQ）放在最后一步，因为量化需要按**完整张量的通道统计**算 scale；在分片上分别量化会导致各 TP rank 的 scale 不一致，推理时数值漂移。

## 14.5 Ray Serve 部署：把两笔资源账合并

ch10 算过一个 vLLM 实例在 `TP=8` 下是 **10 个进程**。叠 `num_replicas` 时：

> 【推算】单机 8 卡只能放 1 个 `TP=8` 副本；`num_replicas=2` 需要 16 卡（两机）。进程总数 `2 × 10 = 20`，CPU 侧还要为每个实例预留 IO 线程、媒体加载线程（`VLLM_MEDIA_LOADING_THREAD_COUNT` 默认 8）与 Router 线程。用 Placement Group 规划时，`num_gpus` 只是逻辑资源，**不校验显存**——`gpu_memory_utilization=0.95` 会吃满卡，所以一个副本必须独占 8 张卡，绝不能标 `num_gpus=0.5` 去超卖。

四个旋钮（第 75 轮那篇文章的结论，这里给源码依据）：

| 旋钮 | 值 | 依据 |
|---|---|---|
| `num_replicas` | 由卡数 / TP 决定 | ch10 进程数公式 |
| `ray_actor_options.num_gpus` | = `TP` | ch13 显存独占 |
| `tensor_parallel_size` | 8 | ch05 权重切片 |
| Placement Group strategy | `STRICT_PACK` | TP 组必须同节点（ch04 的 NVLink 论证在推理侧同样成立） |

**会话亲和是必须的，不是优化**。ch12 说前缀缓存是 EngineCore **本地**的，Router 默认轮询会让同一会话落到不同副本：

> 站内第 75 轮 LMArena 会话亲和子项实测：多副本轮询使前缀缓存命中率 **82% → 24%**、TTFT **×3.4**。解法是按 `session_id` / `user_id` 做一致性哈希路由。ch11 算过请求 R 命中 128 块能省 2048 token 的预算——轮询等于把这 128 块的收益直接丢掉。

**在线与离线隔离**：离线批（`ray.init()` + vLLM Actor）与在线 Serve 副本共享集群时，用 Placement Group 分开资源池，否则离线任务会抢掉常驻副本的卡。离线 Actor 跑完释放、Serve 副本常驻，两者生命周期不同但底层是同一个 `LLM` 实例（ch10）。

## 14.6 统一显存账本（把 ch07 与 ch13 合到一张表）

单机 8 卡、每卡 80 GiB，全部用于推理：

| 项 | 每卡 | 来源 |
|---|---|---|
| 权重（bf16，TP=8） | 17.5 GB | ch05 / 14.3 |
| `non_kv_cache_memory`（激活 + 运行时） | ~4 GiB | ch13 profile |
| `cudagraph_memory_estimate` | ~2 GiB | ch13 |
| KV cache | 20 GiB | ch13 `num_blocks=32768` |
| **合计** | **~43.5 GiB** | 对应 `gpu_memory_utilization≈0.55` 或显式 `--kv-cache-memory-bytes` |

若同一批卡改做训练（`TP=4/PP=2/DP=8` 的一小部分），ch07 的 ZeRO-1 每卡模型状态是 `48.1 GB`，再加激活与激活重算的取舍——**推理留 20 GiB 给 KV、训练留 0 给 KV**，两者的额度分配完全不同。所以「训练推理混布同一张卡」在实践中几乎总是错的，除非显式分时切分显存额度。

## 14.7 上线前 checklist

1. 转换后断言：参数总量、每层 shape、QKV 拆分顺序、up/gate 交错顺序。
2. 抽样对齐：用同一条 prompt 在训练框架 forward 与 vLLM 上比较 logits（允许量化误差）。
3. `TP` 整除检查：`num_attention_heads % TP == 0`，`kv_heads % TP` 或确认复制策略。
4. 显存：按 14.6 表填数，优先 `--kv-cache-memory-bytes`。
5. 路由：一致性哈希按 `session_id`，并验证扩容时已有会话不被重排。
6. 监控：`num_blocks` 使用率、抢占次数、前缀命中率、P99 TTFT（不是平均）。
7. 降级：准备 `max_num_seqs` 的保守值，避免高峰期抢占尖刺。

## 14.8 本章小结与坑

- 训练到推理必须经过离线权重转换：丢优化器状态 → 合并 PP → 合并 TP → 名映射 → 重切/量化。
- Column 沿 dim 0 合并、Row 沿 dim 1 合并、bias 取 rank 0；断言 shape 与参数总量是唯一可靠校验。
- `dense_h_to_4h` 的 up/gate 交错是最容易静默出错的一步。
- `TP=16` 时 GQA 的 KV head 需要复制，多切 TP 不一定继续省显存。
- Ray Serve：`TP=8` 单副本 = 10 进程，`num_gpus` 不可超卖，必须会话亲和路由。
- 统一显存账本：推理约 43.5 GiB/卡，其中 KV 20 GiB；训练 ZeRO-1 约 48.1 GB/卡且无 KV。
- **坑 1**：ZeRO-3 未 `GatheredParameters` 就合并分片，得到残缺权重且无报错。
- **坑 2**：量化在分片上分别做，各 rank scale 不一致。
- **坑 3**：轮询负载均衡毁掉本地前缀缓存。
- **坑 4**：Head 节点放重型 TP 副本，拖垮 GCS 与 Router 控制面。
- **坑 5**：训练与推理混布同卡，KV 额度与优化器状态互相挤压。

> 下一章是全书收束：把十五章的可算数字收成一张总账，给出十条结论、源码研究方法与排错速查表。
