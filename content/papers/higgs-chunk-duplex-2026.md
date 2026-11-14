---
title: "Higgs Realtime Duplex 技术报告精读：160ms 时间片上的预算账本"
authors: "Boson AI（技术贡献者含 Mu Li、Alexander Smola）"
venue: "Boson AI Technical Blog 2026-11-05"
date: "2026-11-14"
tags:
  - "全双工"
  - "160ms chunk"
  - "因果流匹配"
  - "因果 DiT"
  - "MOPD"
  - "token 预算"
tldr: "把全双工从「按话轮切分」改成「按 160ms 时间片组织」：六条泳道并行、静音占格、慢任务跨 chunk 异步回灌；每分钟音视觉 token 压到 2.6K~5K，5 分钟窗口 13K~25K 靠渐进 compaction。输出侧每片 2 audio frames + 2 image latents 分别进因果流匹配解码器与因果 DiT，参考条件只进 decoder。★160ms 是 chunk 长度、200ms 是人类话轮统计，端到端响应延迟官方从未公布。"
importance: 5
---

# Higgs Realtime Duplex 技术报告精读：160ms 时间片上的预算账本

## TL;DR

Boson AI 2026-11-05 发布的 **Higgs Realtime Duplex**（45B MoE，技术贡献者含李沐 Mu Li、Alexander Smola）不是又一个「更快的语音模型」。它公开的是一份**实时系统的预算账本**：一条时间轴、六条泳道、每片算力恒定、慢任务不阻塞快流。

三个最该记住的数字：

| 数字 | 含义 |
|---|---|
| **160ms** | chunk 长度，系统组织输入输出的时间粒度（**不是响应延迟**） |
| **2.6K~5K** | 每分钟音视觉 token 预算（含思考与工具的可变文本） |
| **13K~25K** | 5 分钟窗口 token 数，靠渐进 compaction 维持 |

> ★**口径订正（本文最重要的一条）**：blog 里出现的 **200ms 是人类对话中响应落地的统计值**，**160ms 是 chunk 长度**，二者都不是模型的端到端响应延迟——**官方从未公布端到端延迟**。大量二手解读把「AI 只需 160ms 就能回答」当标题，是错的。站内《全双工全模态工程全书》ch07/ch09/ch10/ch11 已于 2026-11-14 统一订正。

---

## 一、证据分级：读这份报告前先立规矩

因为官方只披露了部分数字，本文沿用站内《Higgs Realtime Duplex 深度拆解》第 1 章的四级标注：

| 标签 | 规矩 |
|---|---|
| **【官方】** | blog / docs 正文明确写出 |
| **【图注】** | 配图里的数字，正文未复述 |
| **【推断】** | 由官方数字反推，**必须给算式** |
| **【未公开】** | 列进清单，绝不写进配置表 |

**官方明确没给的**：MoE expert 数 / active 参数 / routing、层数头数、base model 与 backend 模型名称、主干词表结构、**端到端响应延迟**、具体定价、API 上线日期、权重开源状态、真实网络条件下的失败率。产品状态是 research preview，Duplex API 仅 waitlist，在售的是上一代 `higgs-realtime`。

---

## 二、核心方法：切时间，不切轮次

### 2.1 一条时间轴，六条泳道

传统全双工系统按「话轮」组织：VAD 判停 → ASR → LLM → TTS → 播放。Higgs 改成按固定时间片推进，每片同时处理：

```
t-7   t-6   t-5   t-4   t-3   t-2   t-1   now    ← 每格 160ms
音频入  ●     ●     ●     ●     ●     ●     ●     ●
视频入  ○                 ○                 ○       ← 每 6 片 1 帧
音频出  ●     ●     ●     ●     ●     ●     ●     ●
面部出  ●     ●     ●     ●     ●     ●     ●     ●
思考    ════════════════ 跨 chunk 线程 ═══════════════
工具    ══════════ 异步发出 → 结果分 3 个 input chunk 回灌 ═══
```

两处最反直觉：

1. **静音也占格**：模型没有 VAD 触发的空闲态，7×24 一直在跑 decode。用户不说话不等于没信息——他在看白板、皱眉、把杯子转个面，这些都是后续回答的依据。
2. **每一步都在渲染面部**：输出侧不是「有内容才出画面」，而是每片固定产出。这逼出了「每片算力恒定」这条硬约束。

所以整套架构的第一优先级不是效果，是**把每一片要处理的 token 压到不能再压**。

### 2.2 一个 chunk 里到底装了什么（可复算）

官方 docs 确认内部处理恒为 24kHz / 16-bit / mono PCM【官方】，于是：

```
一片输入波形 = 24 000 × 0.16 = 3 840 samples   【推断】
```

blog 图注给出四条分项【图注】，配上每分钟 375 个 chunk【推断：`60 / 0.16 = 375`】：

| 流 | 每分钟 | 每片 | 底层含义 |
|---|---|---|---|
| audio in | 375 | **1 token** | 6.25 tok/s，3840 samples → 1 token，**3840:1 压缩**；只编码「说了什么」，音色留给 decoder |
| audio out | 750 | **2 frames** | 12.5 tok/s，每 frame 覆盖 80ms = 1920 samples；输出帧率是输入 token 率的 2 倍 |
| video in | 750 | 12 token / 6 片 | 每 6 片取 1 帧 ≈ **1.04 fps**，摊薄 2 token/片 |
| face out | 750 | **2 latents** | 连续 latent，不是离散 ID |
| 合计 | **2625** | **7 槽位** | `7 × 375 = 2625 ≈ 2.6K` |

```python
SR, CHUNK_MS = 24_000, 160
chunks_per_min = 60_000 / CHUNK_MS          # 375
per_chunk = 1 + 2 + 2 + 12 / 6             # 7：音频入 + 音频出 + 面部出 + 视频摊薄
assert chunks_per_min * per_chunk == 2625  # 与图注 375/750/750/750 全对上
```

**「7 槽位/片」是这份报告最漂亮的可验算结论**，也是全双工与离线模型的分水岭：后者一片可以塞 1024 个视觉 token，前者不行。文本（思考、工具结果）是**虚线区，没有固定每片配额**【官方】，所以真实预算在 2.6K~5K 之间浮动。

### 2.3 输入/输出速率刻意不对称

音频入 6.25 Hz、音频出 12.5 Hz。这不是妥协，是设计：**还原波形比理解语义贵**。输入只编码语义（说什么、何时说），音色、韵律、身份全部推给 decoder 的参考音频条件。这个不对称是整套预算能压到 2.6K 的关键。

---

## 三、主干与两个 decoder

### 3.1 45B MoE 与前后台多线程

MoE 每层 FFN 换成一组专家、router 对每个 token 选 top-k，只有被选中的专家参与计算。所以 **45B 是总参数，不等于单 token 激活参数**——全双工每 160ms 必须跑完一次前向，真正决定墙钟的是激活量【未公开】。

为什么恰好 45B？blog 给的是成本账【官方】：更大的模型分数确实更高，但跑起来更贵；既然最难的题可以异步甩给更大的后端模型，中等尺寸前台 + 够用的智能才是最优平衡点。对比 Thinking Machines 的 TML Interaction Small **276B**（约 6 倍），七项 benchmark 打平。

**与 Thinking Machines 的分水岭**在职责划分：TML 前台把 thinking 与工具调用都留给后台，而 Boson 前台**自己思考、自己调工具**【官方】。理由是大的推理模型可能 10 秒以上才回，每轮都调成本失控。三种提质手段：

- **Think**：用户还在说就起推理线程，跨 chunk 延续，边说边想；
- **Call tools**：异步尽早发出，从**部分结果**就开始答，工具可分阶段返回；
- **Delegate**：连 **full shared context** 交给更大的 backend/frontier model，期间继续聊别的话题。

实现细节很关键：工具结果作为 **payload 落进某个输入 chunk，没有固定的每片文本 token 配额**；思考与工具调用的生成可跨多个 chunk，拼接起来才恢复完整输出流。Hands-free engineering 那个 demo 是完整注脚——工程师全程读书，纯语音让它 diff 两个引擎版本 → 让 Claude Code 在后台造缺失的 mass 工具 → 工具造着的同时跑合规检查并应用修复 → 发邮件 → 工具落地后报新质量。**这更像操作系统多线程，不是顺序时间片表**。

### 3.2 双因果 decoder

| | 音频 | 视频（面部） |
|---|---|---|
| 类型 | **因果流匹配** decoder | **因果 DiT**（扩散 decoder） |
| 每片输入 | 2 audio frames | 2 image latents |
| 条件 | 短参考音频 → conditioning vector | 单张参考图 + **前两个 latent** |
| 输出 | 24kHz 波形 | 面部帧 |
| 为什么 | 步数少、能锁进 160ms | blog 原话「Video needs more detail」；前两个 latent 保证长会话里脸不漂 |

**关键在「每片算力恒定」**：任何一片突然要跑 100 步扩散，就会错过下一个 160ms 片，双流立刻失步。★这纠正了站内《全双工全模态工程全书》ch07 初版「全双工必选 codec 直接重建」的判断——**判据不是重建 vs 生成，而是逐 chunk 因果 + 每片算力恒定**。

**零样本换音色换脸**是这套分工最漂亮的一处：默认音色和脸不烘进模型，部署时用几秒参考音频 + 一张参考图加载，**参考条件只进两个 decoder，不进主干**。换音色换脸无需微调，主干语义能力完全不受影响。

### 3.3 基座与语言能力保护

从一个**文本预训练模型**起步，续训约 **2T token** 的文本 / 音频 / 视觉数据【官方】。blog 明说文本训练是为了「保留模型从语言学到的通用智能」——这正是站内反复讨论的「多模态拖累文本」的结构性解法，IFEval **94.1** 是它的验证。

---

## 四、话轮策略：把 VAD 阈值训成策略

上一代在售 `higgs-realtime`（OpenAI Realtime 协议兼容、`wss://api.boson.ai/v1/realtime`、24kHz PCM16 mono）靠外挂 VAD：

| `server_vad` 参数 | 默认【官方 docs】 |
|---|---|
| `threshold` | 0.85 |
| `prefix_padding_ms` | 300 |
| `silence_duration_ms` | 500 |
| `min_speech_duration` | 0.125 s |

`semantic_vad` 再加一层语义判停；barge-in 时服务端**估算**截断音频项，客户端还得发 `conversation.item.truncate` 补校正。

Duplex 把这些阈值工程整个搬进模型：**「It decides for itself when to speak and recognizes when a remark is not addressed to it」**【官方】。VAD 天然判不了两件事——**什么时候该附和/抢话**，以及**这句话不是对我说的**。Drive-thru demo 专门验证后者：司机跟店员点单时它全程安静，取餐窗口还能确认「司机从没点 animal-style fries」——每句都听见了，但知道哪些是给自己的。

**训练栈**（对应站内 RSI 全书 L0–L3 尺子）：

- **MOPD 多教师 on-policy 蒸馏**：`on-policy` 指教师数据来自学生当前策略的交互轨迹，避免分布漂移；`GRPO` 用一组采样的相对优势替代 value model，适合「何时开口、何时让步」这种给不出绝对奖励的判断。
- **四类专家教师**：自然对话 / 交互行为 / 动态委派 / 任务完成。学到的不是知识，是**「说什么 + 何时行动」**。
- **RSI 闭环**：Agent 与模拟环境交互 → 复盘失败 → 合成定向数据 → 训练 → 重复。仿真必须重现 **interruptions / overlapping speech / side conversations / background noise**。官方那句最该记住的是：「The engineering target is the whole harness of simulators, tools, and judges, not an isolated model」。

用 RSI 全书的尺子量：这是典型的 **L1 有界自精化 + 验证器**，改进的是 learner（交互策略），harness 并未被模型自己改写，**不是 L2 点火**。

---

## 五、效果与边界：七项 benchmark 的诚实读法

| 评测 | Higgs 45B MoE | 最强对手 |
|---|---|---|
| Big Bench Audio | **98.9（唯一第一）** | Gemini 3.8 Live Ext. 98 |
| Audio MultiChallenge | 44.9（第二） | RT-2 xHigh 48.5 |
| **Full-Duplex-Bench v1.5** | **75.5** | **GPT-Live-1 80.1 / TML 77.8** |
| QIVD | 56.0 | RT-2 xHigh 58.2 |
| ProactiveVideoQA | 31.9（第二） | TML 33.5 |
| τ-Voice | 69.8（第二） | GPT-Live-1 Astra 74.5 |
| IFEval | 94.1（第二） | RT-2 xHigh 95.2 |

七项里 **1 项第一、4 项官方标注第二**，最能代表「边听边说」的那一项反而输了。45B 对 276B 打平，Boson 自己的解读是「领域还早，数据、架构、训练方法比参数量更重要」；另外 GPT/Gemini 通常要开 `thinking=high` 才拿到最高分，他们复现了超过一半的对手分数以校验评测管线。

**结论必须收紧**：架构跑通 ≠ 交互智能解决。这套系统买到的是**交互节奏**，不是智能水平；成本目标「1 小时模型时间 ≤ 1 小时人工的 1/10」是**设计目标**，不是账单。

---

## 六、工程启示：可迁移的七条原则

1. **输入/输出 token 率不必对称**：6.25 Hz 入（理解语义）vs 12.5 Hz 出（还原波形），理解与生成的带宽需求本就不同。
2. **每片算力恒定 > 单步最优**：实时系统的第一约束是「能否在片长内算完」，这决定了能用几步扩散、能不能用迭代解码。
3. **条件注入 decoder 而非主干**：把「内容」与「身份/风格」解耦，零样本换音色换脸才成立，主干语言能力也不被污染。
4. **绝对时间 ID + chunk-causal**：静音占格、跳帧、工具结果乱序到达，位置编码都不能靠序号。
5. **外部 heuristic → 可学习策略**：VAD 的四个阈值换成 MOPD 训出来的话轮策略，是两代产品最本质的差异。
6. **上下文优先级**：先压每片预算 → 再渐进 compaction → 最后 KV 剪枝；反过来做，省不下几个 GB。
7. **慢任务不阻塞快流**：思考/工具/委派跨 chunk 异步，结果以 payload 回灌输入 chunk，且不给文本固定配额。

---

## 七、结语

把教学基准与真实产品并排看：

| 维度 | 《全双工全模态工程全书》教学基准 | Higgs 真实 |
|---|---|---|
| 时间片 | 80ms | **160ms** |
| 一片槽位 | 87 | **约 7** |
| 一分钟 | 约 65K token | **2.6K~5K** |
| 5 分钟窗口 | 32.6 万 / KV ≈171GB | **13K~25K** |
| 输出 | 离散 ID + codec 直接重建 | **连续 latent + 双因果 decoder** |
| 词表 | 75840 四段分区 | **官方未公开** |

**token 预算差约 25 倍**。Higgs 真正公开的不是一个更强的模型，而是「六条泳道在一条时间轴上并行、且慢任务不阻塞快流」的预算账本——以及一句必须反复强调的提醒：**160ms 是 chunk，200ms 是人类，端到端延迟没人公布过**。

---

## 参考资源

- 站内《Higgs Realtime Duplex 深度拆解：从 160ms 时间片到因果 DiT》全 12 章（ch01 四级证据、ch03 预算精算、ch07 双 decoder、ch09 后台多线程、ch11 训练栈、ch12 benchmark 全表）
- 站内《全双工全模态工程全书》ch11 真实产品逐条对账、ch12 词表再校准
- 站内文章 `content/articles/ray-serve-multi-replica-deployment-2026-11.md`（KV 显存账与副本调度）
- 官方：`https://www.boson.ai/blog/higgs-realtime-duplex`、`https://docs.boson.ai/models/higgs-realtime`
