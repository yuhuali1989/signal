---
title: "Higgs Realtime Duplex 深度拆解 - 第12章: 效果、边界与七条可迁移原则（全书结论）"
book: "Higgs Realtime Duplex 深度拆解：从 160ms 时间片到因果 DiT"
chapter: "12"
chapterTitle: "效果、边界与七条可迁移原则（全书结论）"
description: "给出七项官方 benchmark 的完整对照与诚实解读，汇总全书未公开清单与产品状态，逐条对账教学基准书，并收束为七条基础架构原则与全书十条结论"
date: "2026-11-08"
updatedAt: "2026-11-08"
agent: "研究员→编辑→审校员"
tags:
  - "benchmark"
  - "未公开清单"
  - "产品状态"
  - "逐条对账"
  - "全书结论"
type: "book"
part: "篇六 · 评测与判断"
---

# 第 12 章 · 效果、边界与七条可迁移原则

## 12.1 七项 benchmark 完整对照

官方说明：对手分数取自公开报告与榜单（TML、Artificial Analysis、Scale AudioMC、OpenAI 社区），`We reproduced more than half of them to confirm that our evaluation pipeline matches theirs`【官方】；`-` 表示未运行或不提供该能力。

| 基准 | Higgs 45B MoE | TML 276B MoE | GPT Realtime & Live | Gemini Live |
|---|---|---|---|---|
| Big Bench Audio ↑ | **98.9 最高分** | 96.5 | RT-2 Min 72 / High 97 / GPT-Live-1 Astra 90 | 3.1 Min 71 / High 97 / 3.8 Ext High 98 |
| Audio MultiChallenge APR ↑ | 44.9 第二 | 43.4 | RT-2 Min 37.6 / **xHigh 48.5** | 3.1 Min 26.8 / High 36.1 |
| **Full-Duplex-Bench v1.5** ↑ | **75.5** | **77.8** | RT-2 Min 46.8 / xHigh 47.8 / **GPT-Live-1 80.1** | 3.1 Min 54.3 / High 45.5 |
| QIVD 流式准确性 ↑ | 56.0 | 54.0 | RT-2 Min 57.5 / **xHigh 58.2** | 3.1 Min 54.7 / High 56.1 |
| ProactiveVideoQA PAUC ↑ | 31.9 第二 | **33.5** | RT-2 Min 25.0 | 未运行 |
| τ-Voice pass@1 ↑ | 69.8 第二 | 未运行 | RT-2 Min 30.8 / High 39.8 / **GPT-Live-1 Astra 74.5** | 3.1 Min 26.2 / High 37.7 / 3.8 Ext High 68.6 |
| IFEval ↑ | 94.1 第二 | 89.7 | RT-2 Min 89.6 / **xHigh 95.2** | 3.1 Min 85.8 / High 90.0 |

另：官方明确 `we don't report voice-cloning or avatar-cloning results, since the other models don't support them`——零样本换音色/换脸没有可比数据。

## 12.2 怎么读这张表

**四条必须一起读的**：

1. **七项里只有一项第一**（Big Bench Audio 98.9），另有四项官方标注「2nd highest score」。**最核心的全双工交互项 Full-Duplex-Bench v1.5 得 75.5，输给 GPT-Live-1 80.1 和 TML 77.8**。把「全双工已解决」当成结论，与这张表不符。
2. **45B 对 276B 打平**（约六倍参数差）。官方自己的解读是 `the field is still early: data, architecture, and training methods matter more than raw scale`【官方】。这对第 6 章「为什么不是更大」是最直接的支撑。
3. `GPT and Gemini models usually reach their best scores with thinking set high`【官方】——对手的高分往往开高思考档，与「每片 160ms 硬实时」不是同一成本口径。
4. **复现了超过一半的对手分数**来验证评测管线，这个做法比多报两个百分点更值得记；但仍有一半未复现，跨榜单比较要留余地。

再加上第 2 章那条：**官方没公布端到端响应延迟**。所以「效果好不好」目前只能用这七项静态分数 + 四个 demo 回答，不能用「160ms 响应」回答。

## 12.3 【未公开】总清单（全书汇总）

| 类别 | 未公开项 |
|---|---|
| 主干 | expert 数 / `top_k` / routing / active 参数 / 层数 / hidden size / 注意力与 KV 头数 / base model 名称 |
| 表示 | 词表大小与结构、tokenizer 类型、输入音频 token 是离散还是连续、latent 维度、位置编码形式 |
| 后台 | backend 模型名称与规模、工具清单、payload 编码方式 |
| 训练 | 2T token 三模态配比、课程、GRPO 超参、蒸馏损失、仿真环境数量、裁判是否冻结、RSI 轮数与增益 |
| 系统 | 端到端响应延迟实测、长会话稳定性、网络波动/噪声下的失败率、像素分辨率、decoder 步数 |
| 商业 | 具体定价、Duplex API 上线日期、权重/开源状态 |

**这份清单本身就是本书的一个结论**：一个公开了如此多工程细节的产品，最核心的符号系统与实测延迟仍然缺席。因此任何「Higgs 架构详解」里出现具体词表或层数，都应先问出处。

## 12.4 产品状态（别把两代混为一谈）

| | Higgs Realtime（在售） | **Higgs Realtime Duplex** |
|---|---|---|
| 状态 | 可用，有文档与定价页 | **research preview** |
| 接口 | `wss://api.boson.ai/v1/realtime`，OpenAI Realtime 兼容 | **API coming soon，仅 waitlist**（`boson.ai/api-waitlist`） |
| 形态 | 全双工语音 + 文本 + 转写 + 工具，已有 avatar 输出 | 加视觉输入、实时面部、后台异步工作，首个 omni |
| 权重/定价 | 定价页可查 | **权重未开、无定价** |

李沐那条 44 分钟视频的转发文案也直说「这个模型好像不开源」【②号来源】。所以本书通篇对齐的是**已公开的架构事实与预算账本**，不是可复现的开源实现。

成本目标 `1 小时模型时间 ≤ 1 小时人工的 1/10`【官方】是设计目标，不是账单；按第 4 章，一小时纯音视频流约 157K token，开思考/工具到 300K 量级，但**后台模型调用与两个 decoder 的算力都不在这笔账里**。

## 12.5 逐条对账：与《全双工全模态工程全书》

| 维度 | 教学基准（前 10 章） | Higgs【官方】 | 判定 |
|---|---|---|---|
| 片长 | 80 ms | **160 ms** | 改 |
| 主干 | 7B dense / 32 层 / d=4096 | **45B MoE**，配置未公开 | 改 |
| 每片 token | 87 | 约 **7 + 可变文本** | 改（差约 12 倍） |
| 音频入 | 8 层 RVQ ID / 片 | **1 token / 片**（6.25/s） | 改 |
| 音频出 | 8 个离散 ID / 片 | **2 frames / 片**（连续） | 改 |
| 视频入 | 每片 64 token | 每 6 片 1 帧、约 12 token | 改 |
| 面部输出 | 无 | **2 latent / 片，每片渲染** | 缺 |
| 词表 | 75840 四段分区 | **【未公开】** | 改 |
| 一分钟 | 约 65K | **2.6K~5K** | 改（差约 25 倍） |
| 5 分钟窗口 | 32.6 万 / KV≈171GB | **13K~25K / KV 约 3GB 量级**【推断】 | 改 |
| 语音解码 | codec 直接重建 | **因果流匹配** | 改 |
| 画面解码 | VQ decoder | **2 latent → 因果 DiT** | 改 |
| 静音 | `SIL` 符，视觉片可跳 | 静音即 chunk，视频帧持续流入 | 收紧 |
| 后台工作 | 一句带过 | **多线程异步是核心架构** | 缺 |
| 压缩优先级 | KV 压缩第一 | **压预算 → compaction → KV 剪枝** | 改 |

**八条保持不变的结论**：区分在两端融合在中间、双流只建模不采样、静音/附和/打断应是模型生成的行为、绝对时间锚、因果性、文本能力需保护（IFEval 94.1）、指代消解依赖深层跨模态融合、配置即 prompt（参考条件只进 decoder）。

## 12.6 七条可迁移的基础架构原则

1. **输入/输出 token 率可以不对称**：6.25 Hz 入（理解语义）vs 12.5 Hz 出（还原波形），别硬让两侧同频。
2. **每片算力恒定 > 单步最优**：实时系统第一约束是「能否在片长内算完」，它决定主干规模、decoder 步数、能否用迭代生成。
3. **条件注入 decoder 而非主干**：把「内容」与「身份/风格」解耦，零样本换音色换脸成立，主干能力不被污染。
4. **绝对时间 ID + chunk-causal**：静音占格、跳帧、payload 突增时，序号都会漂移；位置编码必须锚物理时间。
5. **外部 heuristic → 可学习策略**：VAD 的四个阈值换成 MOPD 训出来的话轮策略，是两代产品最本质的差异。
6. **上下文优先级**：压每片预算 → 渐进 compaction → KV 剪枝；KV 是结果，token 是原因。
7. **慢任务不阻塞快流**：硬实时循环 + 线程池 + 完成队列，前台循环里不允许任何 `await`。

## 12.7 全书十条结论

1. Higgs 公开的是**预算账本与架构事实**，不是可复现实现；五个来源里只有官方博客是一手规格。
2. **160ms 是分片粒度、200ms 是人类统计、端到端延迟未公布**；三个时间尺度必须分开量。
3. 一片 = 3840 samples【推断】→ 1 音频 token 入（3840:1）、2 frames 出；视频每 6 片 1 帧，面部每片 2 latent。
4. **7 槽位/片 × 375 片 = 2625 ≈ 2.6K token/分钟**，四条分项 375/750/750/750 可脚本复算。
5. 文本是弹性虚线区（2.6~5K/分钟），5 分钟窗口 13K~25K；渐进 compaction 的正确性标准是**任务状态不丢**。
6. 45B MoE 是总参、被 160ms 墙钟倒逼的中等规模；2T token 续训里文本是语言能力的压舱石。
7. 输出侧是**连续 latent（D 类表示）**，配因果流匹配 + 因果 DiT；参考条件只进 decoder；**词表【未公开】**。
8. 真正判据是「逐 chunk 因果 + 每片算力恒定」，不是「重建 vs 生成」——这条修正了教学基准书。
9. 话轮策略与「何时求助」是被 MOPD/GRPO 训出来的，不是 VAD 阈值或状态机；RSI 闭环停在 **L1 有界自精化**。
10. 七项 benchmark 只一项第一、Full-Duplex-Bench 输给 GPT-Live-1；**买到的是交互节奏，不是智能水平**。

## 12.8 一句话收尾

> **别问「这个模型有多强」，先问「六条泳道怎么在一条 160ms 时间轴上不互相拖垮」——Higgs 的答案不是更大的模型，是把每片压到 7 个 token、把慢任务摘出快流、把话轮交给训练而不是阈值。**

---

> **全书完（12 章）。**
> 站内延伸：
> - `content/books/full-duplex-omni-book-ch11.md` —— 第一次 Higgs 校准（九条断言修正）
> - `content/books/full-duplex-omni-book-ch12.md` —— 词表再校准（三种词表 / 四种组合）
> - `content/books/rsi-engineering-book-ch07.md` —— L0–L3 证据阶梯与点火判据
> - `content/articles/ray-serve-multi-replica-deployment-2026-11.md` —— 在线服务的副本与 KV 账
