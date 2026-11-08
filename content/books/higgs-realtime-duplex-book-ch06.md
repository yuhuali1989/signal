---
title: "Higgs Realtime Duplex 深度拆解 - 第6章: 45B MoE 前台：为什么不是更大，以及 2T token 在保什么"
book: "Higgs Realtime Duplex 深度拆解：从 160ms 时间片到因果 DiT"
chapter: "6"
chapterTitle: "45B MoE 前台：为什么不是更大，以及 2T token 在保什么"
description: "从 dense FFN 讲到 MoE 路由与总参激活参数之别，解释 160ms 墙钟约束如何决定中等规模前台，拆解从文本基座续训约两万亿 token 的目的，并用李沐的带宽内存算力判断解释自建 H100 集群与 Megatron 栈"
date: "2026-11-08"
updatedAt: "2026-11-08"
agent: "研究员→编辑→审校员"
tags:
  - "MoE"
  - "45B"
  - "两万亿token"
  - "H100"
  - "Megatron"
type: "book"
part: "篇三 · 模型架构"
---

# 第 6 章 · 45B MoE 前台：为什么不是更大

## 6.1 MoE 基础：45B 不是「每片要算 45B」

先把这个最常见的误读写清楚。一个标准 Transformer 层里，注意力之后是一个前馈网络（FFN），dense 模型里每个 token 都要过整个 FFN。**MoE 把 FFN 换成一组并行的「专家」，加一个 router 决定每个 token 交给哪几个专家**：

```python
class MoELayer(nn.Module):
    def __init__(self, d, n_experts, top_k, hidden):
        self.router  = nn.Linear(d, n_experts)      # 打分
        self.experts = nn.ModuleList([FFN(d, hidden) for _ in range(n_experts)])

    def forward(self, x):                            # x: [L, d]
        logits = self.router(x)                      # [L, n_experts]
        idx = logits.topk(self.top_k, dim=-1).indices   # 每个 token 只选 top_k 个
        out = zeros_like(x)
        for e in range(self.n_experts):
            mask = (idx == e).any(-1)                # 被分到专家 e 的 token
            if mask.any():
                out[mask] += self.experts[e](x[mask])  # 只有这些 token 真跑计算
        return out
```

于是有两个参数量：

| 概念 | 含义 |
|---|---|
| **总参数量（45B【官方】）** | 所有专家 + 注意力 + embedding 加起来，决定显存与存储 |
| **激活参数量（【未公开】）** | 单个 token 实际经过的参数，决定**单步计算量与墙钟** |

MoE 的价值就在这个落差：用 45B 的知识容量，付接近小模型的单 token 计算量。**但落差具体多大，官方一个字没给**——`n_experts`、`top_k`、routing 策略、active 参数、层数、hidden size 全在【未公开】清单里。任何写「Higgs 激活 X B」的说法都是编的。

## 6.2 为什么是 45B：一句官方原话与一条物理约束

官方给的理由非常直白：

> `We tried larger models, and they do score higher, but they cost more to run. Since the hardest questions can go to a bigger backend model anyway, a mid-sized front model with solid intelligence gives the best balance.`

翻译过来是三句：

1. 大模型分数更高，但**跑起来更贵**；
2. 最难的问题反正可以异步委派给更大的后端模型；
3. 所以中等规模、智能够用的前台，是成本-性能曲线上的最优点。

但本书要补上第 4 句，也是全双工特有的硬约束：**每片必须在 160ms 内跑完一次前向**。MoE 的激活参数量直接决定单步墙钟；模型再大，哪怕分数更高，只要某片算超时，输入流就堆积、双流立刻失步。所以「45B」不是调参调出来的甜点，是**被片长倒逼出来的上限**。

对照系也很清楚：官方拿它对标 Thinking Machines 的 `TML Interaction Small 276B MoE`，明说「约六倍参数量」【官方】。45B 对 276B，七项 benchmark 互有胜负——这正是官方那句 `data, architecture, and training methods matter more than raw scale` 的实证。

## 6.3 从文本基座续训 2T token：文本在保什么

官方：`We start from a model pre-trained on text and continue training it on about 2 trillion tokens of text, audio, and visual data`【官方】；开头 bullet 写 `trained on about 2 trillion tokens of text, audio, and video`。

注意两个动词：**start from a model pre-trained on text**（不是从头训），**continue training**（续训）。官方自己给了理由：

> `Text training helps preserve the general intelligence the model learned from language. Training on audio and visual data teaches the model to process both modalities directly and connect what it hears, sees, and says.`

这正好接上站内前几轮反复讨论的那条线——**多模态训练会拖累文本能力**。这里的解法不是冻结语言部分，也不是靠 50% 文本占比硬扛，而是：

- 语言智能在**纯文本预训练阶段**已经形成；
- 多模态阶段是「续训」且**文本仍在混合语料里**，作为压舱石；
- 音视频数据负责让模型直接处理三路信号、建立跨模态对齐。

结果可核查：**IFEval 94.1**【官方】，仅次于 RT-2 xHigh 的 95.2，说明语言能力没被拖垮。这跟站内 Qwen VLM 训练配比报告（文本 token 占比低于 50% 出现不可逆语言退化）是同一件事的两种解法：一个靠配比红线，一个靠基座 + 续训结构。

> ⚠️ 2T token 的**三模态配比**官方未公开。别把「文本占比 ≥50%」从别家报告搬过来当 Higgs 的规格。

## 6.4 基础设施与设计哲学：为什么自己建机房

官方一句话：`We train it on our own NVIDIA H100 cluster, in a data center Boson built itself, using a training stack based in part on Megatron`【官方】。

三个词各有分量：

| 词 | 含义 |
|---|---|
| **own H100 cluster** | 自有训练集群，不是按需租云；全双工数据（重叠语音、附和、打断、共时音视频事件）需要长期反复迭代 |
| **data center Boson built itself** | 连机房都自建 |
| **based in part on Megatron** | 训练栈部分基于 Megatron——大规模 MoE 的专家并行、张量并行、流水线并行的成熟底座 |

李沐在交大讲座（公开报道，⑤号来源）讲过的判断，恰好能解释这些选择，**但那是个人行业观点，不是 Duplex 官方规格**：

- 大模型三要素是算力、数据、算法；分布式训练的瓶颈在**带宽**（机架间几纳秒延迟都不能忍），其次是**内存**（芯片 192GB 级别限制模型上限），再次才是算力；
- 自建数据中心时算过「自己造一个电厂比付电费更便宜」；
- 未来主流模型在 100B~500B，MoE 虽可做大，但**有效激活规模有限**；
- 各领域成熟度：语言约 80~85 分、音频 70~80 分、视频生成约 50 分。

把这几条和 Higgs 对起来看，逻辑是连贯的：视频生成最不成熟 → 不让主干逐像素生成，只出 2 个 latent 交给专用 decoder；MoE 有效激活有限 → 前台选中等规模，难题外包给后端；带宽/内存是瓶颈 → 每片 token 预算压到 7 个、上下文做渐进 compaction。

> 本节是**动机解释**，不是规格推断。请勿把讲座里的「100B~500B」当成 Higgs 的参数上限依据。

## 6.5 单步前向成本【推断】

官方没给层数与激活参数，所以只能给结构性的账，不给数：

```
每片墙钟 ≈ 主干一次前向(激活参数决定) + 两个 decoder(步数固定) + 调度/IO
约束：每片墙钟 < 160 ms
```

三个可迁移的结论：

1. **主干要稀疏激活**。MoE 让「容量」与「单步成本」解耦，这是全双工选 MoE 而非 dense 的根本原因。
2. **decoder 步数必须固定**。流匹配与 DiT 都是迭代式生成，若某片步数可变，片长就无法保证。官方把它们都冠以 `causal` 且每片只出 2 个 frame / 2 个 latent，本质是把生成成本锁死（第 7 章）。
3. **持续 decode 的瓶颈在 KV 显存而非算力**。全双工没人说话也在跑，多路会话要同拍 batch 才划算——这与站内 Ray Serve 多副本部署那篇的 KV 账是同一笔。

## 6.6 【未公开】清单（本章相关）

| 项 | 状态 | 为什么别猜 |
|---|---|---|
| expert 数量、`top_k`、routing 策略 | 【未公开】 | 决定激活参数，猜了就会误算单步成本 |
| active 参数量 | 【未公开】 | 45B 是总参 |
| 层数、hidden size、注意力头数、KV 头数 | 【未公开】 | 第 4 章的 KV 估算只作量级示意 |
| base model 名称 | 【未公开】 | 官方只说「文本预训练模型」 |
| backend / frontier 模型名称与规模 | 【未公开】 | 只说 `a much bigger backend model` |
| 2T token 的三模态配比 | 【未公开】 | 别套用别家的 50% 红线 |
| 端到端响应延迟实测 | 【未公开】 | 160ms 是片长、200ms 是人类统计 |

## 6.7 本章小结

- 45B 是**总参数量**；MoE 用 router + top-k 让单 token 只过少量专家，激活参数与层数头数全部【未公开】。
- 选中等规模的官方理由是「更大更贵、难题可委派」，本书补上全双工特有的物理约束：**每片必须在 160ms 内算完**，激活参数量决定墙钟。
- 从文本基座续训约 2T token（文本/音频/视觉），文本是保住语言智能的压舱石，IFEval 94.1 是结果；配比未公开。
- 自建 H100 集群 + 自建数据中心 + 部分 Megatron；李沐的带宽/内存/算力与「MoE 有效激活有限」判断可作动机解释，但不是规格。
- 稀疏激活 + 固定步数 decoder + 持久 KV，是每片恒定算力的三根支柱。

> 下一章看输出侧：2 个 audio frame 和 2 个 image latent 怎么变成声音和脸，以及为什么参考音频/参考图只进 decoder 不进主干。
