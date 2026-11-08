---
title: "模型架构半年观察 - 第4章: 注意力与长上下文：1M 成标配，竞争转向尾部召回"
book: "模型架构半年观察：从稀疏化到数据引擎（2026-05→11）"
chapter: "4"
chapterTitle: "注意力与长上下文：1M 成标配，竞争转向尾部召回"
description: "梳理近半年 1M 上下文普及、稀疏注意力与跨层索引复用、KV cache 压缩论文簇、尾部召回成为新竞争点，给出 KV 显存的可运行估算与渐进 compaction 的优先级"
date: "2026-11-08"
updatedAt: "2026-11-08"
agent: "研究员→编辑→审校员"
tags:
  - "长上下文"
  - "稀疏注意力"
  - "KV cache"
  - "尾部召回"
  - "Mamba-3"
type: "book"
part: "篇二 · 架构主线"
---

# 第 4 章 · 注意力与长上下文：1M 成标配，竞争转向尾部召回

## 4.1 半年里 1M 从卖点变成基线

| 模型【站内】 | 时间 | 上下文 | 关键变化 |
|---|---|---|---|
| Hy4 preview | 08-28 | **1,000,000** | Gated DSA + IndexCache |
| MiMo-V2.6 系列 | 09-21 | 100 万 | 万亿 MoE + 100 万上下文 |
| GPT-6 Astra | 09-04 | 1M Tokens | 旗舰闭源 |
| Gemini 4 Ultra Preview | 11-04 | 1M | **尾部召回衰减修复 + 全深度测试公开** |
| GLM-5.4 | 10-28 | 300K+ needle | **97%（上代 82%）**，选择性错位位置编码 |
| Qwen3.9-VL | 11-06 | **2 小时视频输入** | 关键帧 CLIP 检索召回后进 LLM |

**竞争点已经换了。** 2025 年比的是「窗口标称多少」，2026 下半年比的是「窗口深处还能不能想起来」：Gemini 4 专门做长文档尾部召回专项训练并公开全深度测试，GLM-5.4 把 300K+ needle 从 82% 拉到 97%，Qwen3.9-VL 干脆不把两小时视频全灌进去，走 **CLIP 向量检索召回关键帧**。

> 【推断】标称窗口是位置编码的上限，有效窗口由「注意力是否稀疏化 + 中间信息是否被压缩掉」决定。所以下面两节（稀疏注意力、KV 压缩）才是这半年的真主线。

## 4.2 稀疏注意力：Hy4 的 Gated DSA + IndexCache

全注意力对长度是二次复杂度，1M 上下文不可能逐 token 全看。近半年公开的具体做法：

| 做法 | 出处 | 机制 |
|---|---|---|
| **Gated DSA + IndexCache 跨层稀疏索引复用** | Hy4 preview factSheet【站内】 | 用门控决定哪些位置值得 attend；索引在层间复用，避免每层重算稀疏选择 |
| **选择性错位位置编码** | GLM-5.4【站内】 | 改善超长上下文的位置表征，直接对应 needle 82%→97% |
| **MC-Sparse** | 论文（10 月）【站内 papers-index】 | 缩小扩散 Transformer 里稀疏与稠密注意力的差距 |
| **Mamba-3** | 论文（09 月） | 选择性状态空间，复数状态更新与 MIMO 形式，换一条复杂度路线 |

`IndexCache 跨层复用` 值得单独说：稀疏注意力的成本不只在 `Q·K`，还在**决定该看哪些 K** 的索引计算。若每层都重算一遍索引，省下的注意力 FLOPs 会被索引开销吃回去。跨层复用是典型的「优化第二段而不是第一段」——和第 6 章提到的并行 VAE 分段、第 7 章的 PD 分离是同一种工程直觉。

## 4.3 KV cache：半年里最密集的论文簇

`papers-index.json` 近半年 34 条里，KV 与上下文管理占了显眼的一块：

| 论文【站内】 | 方向 |
|---|---|
| `Persistent Context Graphs for Efficient Memory Compaction in LLM Agents (ReCAP)` | 用持久上下文图做记忆压缩 |
| `ATTUNER: Recomputation-Free KV Cache Reuse via Query-Side Adaptation` | 免重算的 KV 复用，改 query 侧适配 |
| `ActKV: Efficient LLM Agents through Action-Guided KV Cache Management` | 按 Agent 动作管理 KV |
| `KV-streams for Efficient Compaction in Agentic RL` | Agentic RL 里的 KV 流压缩 |
| `MemPilot: Curating Multimodal Memory on Demand for LLM Agents` | 多模态记忆按需策展 |
| `Distilling Sequential Computation in Transformer Language Models` | 把序列计算蒸馏掉 |

归纳成四类手法：

```
① 复用   ATTUNER：不重算，query 侧适配老 KV
② 压缩   ReCAP / KV-streams：把历史压成持久表示或流
③ 淘汰   ActKV：按动作决定哪些 KV 还留着
④ 外置   MemPilot / 上下文图：把记忆挪出 KV，按需取回
```

**共同前提**：Agent 与全双工都是「按墙钟持续 decode」的场景，KV 单调增长，是显存瓶颈而非算力瓶颈。站内《Ray Serve 多副本部署》那篇算过同一笔账：多路会话要同拍 batch 才划算，且会话亲和路由会直接影响 Prefix Caching 命中率（轮询让命中率 82%→24%、TTFT ×3.4）。

## 4.4 KV 显存：一个可复算的估算

```python
# 【推断】典型 GQA 配置，用于量级对比，非任何具体模型规格
def kv_gb(tokens, layers=32, kv_heads=8, head_dim=128, bytes_per=2):
    per_token_per_layer = 2 * kv_heads * head_dim * bytes_per  # K + V
    return per_token_per_layer * layers * tokens / 1024**3

for L in (13_000, 25_000, 300_000, 1_000_000):
    print(f"{L:>9,d} token → {kv_gb(L):6.2f} GB")
# 13K → 1.59 GB | 25K → 3.05 GB | 300K → 36.6 GB | 1M → 122 GB
```

所以「1M 上下文」在朴素实现下仅 KV 就要 **122GB 量级**【推断】，还不算激活与权重。这就是为什么这一章的三件事必须同时做：**稀疏注意力省计算、GQA 省 KV 头数、compaction 省有效长度**。单靠任何一个都不够。

对照站内《Higgs Realtime Duplex 深度拆解》第 4 章的真实账本：每片压到约 7 个 token、每分钟 2.6K、5 分钟窗口 13K~25K，KV 约 1.6~3.1GB——**极紧预算让长会话从「必须专门优化」变成「顺带就够用」**。本书据此把压缩优先级写死：

```
① 压每片 token 预算（原因侧）
② 渐进 compaction 文本（弹性侧）
③ KV 剪枝 / 滑窗 / 跨层复用（结果侧）
```

## 4.5 上下文工程的三个新口径

这半年评测与工程口径出现三个变化，都值得记进设计文档：

1. **全深度测试**：不再只测首尾，而是测窗口中每一段位置的召回（Gemini 4 公开全深度测试）。「1M」这个数字本身不再有说服力。
2. **会话亲和影响分数**：LMArena 新增子项承认「分数依赖部署架构」——多副本轮询破坏前缀缓存命中，同一个模型换个路由分数就变。
3. **压缩的正确性标准是任务状态不丢**：渐进 compaction 压掉中间推理与工具 trace，但必须把「进行中工作所需的信息」往前带；用户中途改口时，旧任务参数失效这条状态不能被压没（详见站内 Higgs 全书第 4 章）。

## 4.6 另一条复杂度路线：状态空间与去反向传播

稀疏注意力是「在 Transformer 内省」，Mamba-3 / 线性注意力是「换掉注意力的复杂度」，Dust（无反向传播预训练）则更彻底——把扰动从权重空间移到激活空间。它们近半年都出现在 `papers-index` 里，但**没有一个进入 93 个模型条目的主流规格**【站内】。

所以本书的判断是：**这些是值得跟踪的分叉，不是这半年的主线**。主线仍然是「MoE + 稀疏/复用注意力 + 压缩上下文」这套组合，因为它是唯一同时被开源权重、闭源旗舰、国产芯片训练栈共同验证过的路径（第 3 章的激活比表 + 本章的 1M 表交叉可证）。

## 4.7 回到 Hy4

锚点 Hy4 preview 的 `Gated DSA + IndexCache 跨层稀疏索引复用` + `1M 上下文` + `RMSNorm/RoPE`，正好是本章主线的完整样本：门控决定看哪、索引跨层复用省掉重算、1M 是标称窗口。它内置的 **10B/0.7B MTP 投机解码层**（站内新闻 08-28）则属于推理侧，下一章生成侧之后在第 7 章接上。

值得注意的是：Hy4 的 1M 与 Gemini 4 的「尾部召回修复」隔了两个月。**先有人把窗口开到 1M，才有人发现深处不好用，再去修**——这条顺序本身就是半年趋势的缩影：能力先到，可靠性后补。

## 4.8 本章小结

- 1M 上下文成基线（Hy4 / GPT-6 / Gemini 4 / MiMo），竞争点转向**尾部召回**：GLM 300K needle 82%→97%、Gemini 4 公开全深度测试、Qwen3.9-VL 用 CLIP 关键帧召回替代全帧灌入。
- 稀疏注意力具体做法：Gated DSA + IndexCache 跨层索引复用、选择性错位位置编码、MC-Sparse；优化重点是索引开销而非 `Q·K` 本身。
- KV 论文簇归四类：复用（ATTUNER）、压缩（ReCAP / KV-streams）、淘汰（ActKV）、外置（MemPilot）。
- 【推断】朴素 1M 上下文 KV 约 122GB，必须「稀疏注意力 + GQA + compaction」三者同时做；压缩优先级是压预算 → compaction → KV 剪枝。
- 新口径三条：全深度测试、会话亲和影响分数、压缩正确性看任务状态。
- Mamba-3 / Dust 是分叉不是主线；Hy4 的 1M 与 Gemini 4 的尾部修复相隔两月，体现「能力先到、可靠性后补」。

> 下一章：主干开始同时吃文本、音频、视频之后，架构怎么分叉成「统一序列」与「理解/生成解耦」，以及语言部分到底什么时候冻、什么时候放。
