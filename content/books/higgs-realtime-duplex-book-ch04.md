---
title: "Higgs Realtime Duplex 深度拆解 - 第4章: 每分钟 2.6K、五分钟 13K~25K：预算与上下文账本"
book: "Higgs Realtime Duplex 深度拆解：从 160ms 时间片到因果 DiT"
chapter: "4"
chapterTitle: "每分钟 2.6K、五分钟 13K~25K：预算与上下文账本"
description: "核对官方图注的四条每分钟预算与含思考工具的 2.6 至 5K 区间，拆解五分钟窗口 13K 至 25K 的构成、渐进 compaction 与旧历史留文本，给出 GQA 假设下的 KV cache 显存估算与压缩优先级"
date: "2026-11-08"
updatedAt: "2026-11-08"
agent: "研究员→编辑→审校员"
tags:
  - "token预算"
  - "渐进compaction"
  - "KV cache"
  - "上下文窗口"
  - "成本"
type: "book"
part: "篇二 · 时间片与 token 预算"
---

# 第 4 章 · 每分钟 2.6K、五分钟 13K~25K

第 3 章算的是一片。这一章把镜头拉到一分钟、五分钟，看系统怎么不被上下文撑爆。

## 4.1 官方图注的四条数字

博客配图（经中文解读转引）给的是一分钟里四条流各占多少：

| 流 | 每分钟 token | 折算 | 本书第 3 章复算 |
|---|---|---|---|
| audio in | **375**【图注】 | 6.25 tok/s | 1 × 375 片 = 375 |
| audio out | **750**【图注】 | 12.5 /s | 2 × 375 = 750 |
| video in | **750**【图注】 | 12.5 /s | (12/6) × 375 = 750 |
| face out | **750**【图注】 | 12.5 /s | 2 × 375 = 750 |
| **合计** | **2 625 ≈ 2.6K** | | 7 × 375 = 2625 |

官方正文同时写：`The audio and visual streams use about 2.6K tokens per minute`【官方】。两处完全对得上——说明图注不是估算，是按每片槽位算出来的账。

**为什么这个数字值得单独记一笔**：《全双工全模态工程全书》的教学基准是每片 87 槽位 × 12.5 片/秒 ≈ 1087 token/s ≈ 65K token/分钟。Higgs 是 2.6K/分钟，**差约 25 倍**。这不是调参调出来的，是从源头把「每片给多少 token」砍到个位数。

## 4.2 2.6K → 2.6~5K：文本是弹性的

官方：`With optional thinking, tool calls, and their results, the total is roughly 2.6–5K tokens per minute, depending on the workload`【官方】。

注意区间的下界**仍是 2.6K**——什么都没想、没调工具时，就是纯音视频流的刚性预算；上界 5K 是多出来的文本。图注把这块画成**虚线**并注明：

> `Dashed sections show variable text usage, not a fixed cap.`

这句话信息量很大，三层意思：

1. **没有固定每片文本配额**。工具结果作为 payload 进入某个输入 chunk，可能这一片塞进来几百 token，下一片一个字没有。官方原话：`Each arriving tool result enters its input chunk as a payload, without a fixed per-chunk text-token quota`。
2. **思考与工具调用的生成跨多个 chunk**，拼接起来才恢复完整输出流。所以文本不是「每片固定几个槽」，而是一条独立的、变速的流。
3. **成本的不确定性全在这一块**。音视频流是确定的 2.6K，能不能控住账单，看的是思考线程多长、工具返回多大、compaction 压得狠不狠。

回到贯穿例子：`t=3840ms` 工具结果 part1 到达，那一片的文本量突增；`t=4000ms` part2；`t=4160ms` part3。三片里文本分布完全不同，但音视频那 7 个槽位一片没变。

## 4.3 五分钟窗口 13K~25K 是怎么构成的

官方：`In production, the model usually retains the last five minutes of audio and visual streams alongside this compacted text—roughly 13K–25K tokens for this recent window`【官方】；`The model usually retains the last five minutes... Older history is retained as text in addition to this budget`。

```python
RIGID_5MIN = 2625 * 5          # = 13 125 ≈ 13K（下界）
UPPER_5MIN = 25_000            # 【官方】上界
TEXT_HEADROOM = UPPER_5MIN - RIGID_5MIN   # ≈ 11.9K 给压缩后文本
```

所以 **13K 是纯音视频的地板，25K 是加上压缩后文本的天花板**，中间约 12K 是文本区。这个区间随「活动强度与压缩程度」变化——会话越忙、工具越多、compaction 越松，越靠近 25K。

一句话记住结构：

```
最近 5 分钟窗口（13K~25K）
├── 音视频流：刚性 13K（不压缩，逐片保留）
└── 文本：压缩后 0~12K（思考轨迹 + 工具结果 + 对话文字）
更老的历史：只保留文本，不在这个预算里【官方】
```

**为什么音视频流不压缩、只压文本？** 因为音视频 token 已经压到每片 7 个，再压就要丢时间结构；而文本（尤其思考轨迹和工具 trace）是冗余大户，且天然可摘要。这是典型的「先压高冗余、保时间轴」策略。

## 4.4 渐进 compaction 压的是什么

官方：`That estimate already assumes progressive compaction of intermediate reasoning and tool traces, with the information needed for ongoing work carried forward`【官方】。

三个要点：

| 要点 | 含义 |
|---|---|
| **progressive（渐进）** | 边产生边压，不是等窗口满了再一次性摘要。避免某片突然出现超大压缩计算量，破坏每片恒定算力 |
| **压中间产物** | 中间推理步骤、工具调用与返回的完整 trace |
| **保留 ongoing work 所需信息** | 关键：不是「保留摘要」，是「保留还在做的事继续做下去所需的状态」 |

第三条决定了压缩质量怎么评。回到贯穿例子：工程师中途说「先别看价格，重点比维护成本」，随后又说「第二份里的旧报价不用算」。如果 compaction 把「旧报价已作废」这条状态压没了，后面的工具结果会被当成有效数据，答出来的质量数值就是错的。**压缩的正确性标准是任务状态不丢，不是文本读起来通顺。**

## 4.5 KV cache 显存估算【推断】

官方没给层数、头数、hidden size，所以这里只能给量级，并明确标注假设：

```python
# 【推断】按典型 45B 级 MoE 的 GQA 配置估，非官方规格
L_LAYERS   = 32
N_KV_HEADS = 8          # GQA，若用 MHA 则 ×4
HEAD_DIM   = 128
BYTES      = 2          # bf16

kv_bytes_per_token_per_layer = 2 * N_KV_HEADS * HEAD_DIM * BYTES   # K + V = 4096 B
kv_bytes_per_token = kv_bytes_per_token_per_layer * L_LAYERS         # 131 072 B = 128 KB

for L in (13_000, 25_000):
    print(L, "token →", round(kv_bytes_per_token * L / 1024**3, 2), "GB")
# 13 000 → 1.59 GB
# 25 000 → 3.05 GB
```

**约 1.6~3.1 GB 量级**。这个数字本身不重要，重要的是和教学基准的对比：

| | 教学基准书（80ms/87 槽位） | Higgs（160ms/7 槽位） |
|---|---|---|
| 5 分钟 token | 约 32.6 万 | **1.3~2.5 万** |
| 假设 | 32 层 / 32 KV heads / d=4096 | 32 层 / 8 KV heads（GQA） |
| KV cache | 约 171 GB | **约 3 GB** |

差约 50 倍，来自两处：**token 预算 ×25**、**GQA 把 KV 头数 ×4 降下来**。两者都是架构决策，不是靠「事后剪枝」补的。

> ⚠️ 本书不声称 Higgs 用了 32 层或 8 个 KV head——那是【未公开】。这里的价值只在于说明：**极紧预算 + GQA，让长会话的 KV 从「必须专门优化」变成「顺带就够用」**。

## 4.6 压缩优先级：把教学基准书的顺序倒过来

《全双工全模态工程全书》第 9 章原先把 KV cache 压缩排在第一位。按 Higgs 的账本，正确顺序是：

```
① 从源头压每片 token 预算    ← 收益最大，25 倍，且一次性生效
② 渐进 compaction 文本        ← 处理弹性的那一半
③ 最后才是 KV cache 剪枝/滑窗 ← 前两步做完，这块已不成瓶颈
```

理由很直接：KV 是结果，token 是原因。在每片 87 槽位的设定下再怎么剪 KV，也追不上把每片砍到 7 个槽位。**先定预算，再谈压缩**——这是本书从 Higgs 账本里拿到的最可迁移的一条。

## 4.7 成本目标与账单的距离

官方目标是 `an hour with the model costs at most one-tenth as much as an hour of a person's time`【官方】，博客另有定价页入口但**未公布具体费率**。

按本章账本，一小时纯音视频流约 `2.6K × 60 ≈ 157K token`；开思考与工具则到 300K 量级。但真实账单还要算：

- 视频输入是否开启、持续多久；
- 工具调用次数与返回体大小；
- **委派给更大 backend 模型的调用**（这部分完全不在 2.6K 预算里）；
- 两个 decoder 每片都要跑的算力（音频 + 面部渲染）。

所以「2.6K token/分钟」是**主干上下文**的账，不是全部推理成本。持续连接的语音/视频助手，评估成本时不能只看一句回答用了多少 token。

## 4.8 本章小结

- 【图注】四条分项 375/750/750/750 = 2625 ≈ 2.6K/分钟，与【官方】正文一致，可由「7 槽位 × 375 片」复算。
- 文本是虚线区：2.6~5K/分钟，无固定每片配额，工具结果以 payload 落进输入 chunk；成本不确定性全在这里。
- 5 分钟窗口 13K~25K：13K 是刚性音视频地板，约 12K 是压缩后文本余量；更老历史只留文本。
- 渐进 compaction 压中间推理与工具 trace，正确性标准是**进行中任务的状态不丢**。
- 【推断】GQA 假设下 KV 约 1.6~3.1GB；压缩优先级应为「压预算 → compaction → KV 剪枝」。
- 2.6K/分钟只是主干上下文账，后台模型与双 decoder 另算；1/10 人工是设计目标不是账单。

> 下一章：把这 7 个槽位真正排成一条序列——谁在前、谁在后、时间怎么标、工具 payload 塞在哪里，以及一段可跑的 chunk builder。
