---
title: "Higgs Realtime Duplex 深度拆解 - 第10章: 从四个 VAD 阈值到模型内的话轮策略"
book: "Higgs Realtime Duplex 深度拆解：从 160ms 时间片到因果 DiT"
chapter: "10"
chapterTitle: "从四个 VAD 阈值到模型内的话轮策略"
description: "列出上一代 higgs-realtime 的 server_vad 参数、semantic_vad 与 barge-in 截断协议，说明 VAD 做不到的三类判断，并用官方能力描述与得来速演示解释 Duplex 如何把外部规则变成可学习策略"
date: "2026-11-08"
updatedAt: "2026-11-08"
agent: "研究员→编辑→审校员"
tags:
  - "VAD"
  - "话轮"
  - "barge-in"
  - "打断"
  - "评测口径"
type: "book"
part: "篇四 · 后台与交互策略"
---

# 第 10 章 · 从四个 VAD 阈值到模型内的话轮策略

## 10.1 上一代是怎么管话轮的

官方文档（`docs.boson.ai/models/higgs-realtime/guides/turn-detection-and-interruptions`）给了一套非常传统的工程方案，参数全部公开：

| `server_vad` 参数 | 默认值 | 作用 |
|---|---|---|
| `threshold` | `0.85` | VAD 语音概率阈值，越高越只认清晰响亮的语音，越能忽略背景噪声 |
| `prefix_padding_ms` | `300` | 检测到的语音之前要包含多少毫秒音频 |
| `silence_duration_ms` | `500` | 静音多久判为一轮结束 |
| `min_speech_duration` | `0.125` | 触发一个语音段的最短时长（秒） |

另有 `semantic_vad`：在 `server_vad` 之上加一层「用户是不是真的说完了」的语义判断，减少自然停顿被误判成结束。设为 `null` 则由客户端手动 `input_audio_buffer.commit`。

**打断（barge-in）的处理也能看出工程味**：用户说话会取消正在播放的回复，服务端还会**估算**截断助手的对话项——因为服务端看不到客户端实际播到哪了，只能假设音频从第一个 `response.output_audio.delta` 起一直在实时播放。网络延迟、播放缓冲、暂停都会让估算偏移，所以客户端要补一条：

```json
{
  "type": "conversation.item.truncate",
  "item_id": "item_abc123",
  "content_index": 0,
  "audio_end_ms": 1840
}
```

服务端据此重新截断，并回 `conversation.item.truncated`。**这是一整套外部规则 + 事件协议**：阈值、计时器、估算、校正，全在模型之外。

## 10.2 上一代的完整规格（作为对照基线）

| 项 | 值【官方 docs】 |
|---|---|
| 端点 | `wss://api.boson.ai/v1/realtime`（WebRTC 在开发中） |
| 模型名 | `higgs-realtime` |
| 内部音频 | **24 kHz / 16-bit / mono PCM**，恒定 |
| 对外格式 | `audio/pcm`（8/16/24/48kHz，默认 24k）、`audio/pcmu`（G.711 μ-law，8k 固定）、`audio/opus`（内部 24k，frame 2.5/5/10/20/40/60ms，默认 20） |
| 传输 | base64 编码塞在 JSON 事件里 |
| 输入转写 | `higgs-stt-3.1` |
| 音色 | `default` / 预设 / 自建 `voice_<id>` |
| 工具 | `function` 工具，JSON-schema 参数，对话中调用 |
| 协议 | 兼容 OpenAI GA Realtime API |
| 文本模式 | `output_modalities: ["text"]` |

> ⚠️ 官方文档也把上一代称作 `Full-duplex voice`（一个持久会话双向流式）。那 blog 为什么说 Duplex 是 `Boson's first full-duplex interactive **omni** model`？差别在 **omni**：加上摄像头/共享屏幕输入、实时面部输出、以及后台异步工作。别把「上一代是回合制」当事实——它也是全双工语音，只是没有全模态与后台线程。

## 10.3 VAD 做不到的三件事

| 判断 | 为什么阈值做不到 |
|---|---|
| **什么时候附和** | `silence_duration_ms=500` 只能判「说完了」，判不了「这里该说一声 mm-hm」。附和常发生在对方还在说话时 |
| **这句话是不是对我说的** | VAD 只测「有没有人声」，不测语义指向。旁人聊天、自言自语、背景电视都会被当成输入 |
| **静音意味着什么** | 静音可能是「我在想」「我在看屏幕」「我在等你说」，也可能是「轮到你了」。四个标量区分不了 |

还有一条结构性缺陷：**VAD 判停后才开始推理**。哪怕阈值调到最优，`silence_duration_ms=500` 本身就先花掉半秒——而人类话轮间隔典型只有 200ms【官方】。所以「用 VAD + 更强 LLM」这条路在物理上就追不上人类节奏。

## 10.4 Duplex 把规则搬进了模型

官方对能力的描述，句句对应上面三件事：

> `It decides for itself when to speak and recognizes when a remark is not addressed to it.`
> `Says "mm-hm," answers before you finish, and stops when you cut in, while ignoring background noise and remarks meant for someone else.`

于是话轮不再是「VAD 检测到静音 → 触发 LLM」，而是**模型在每个 160ms 片里都在做一个策略决策**：继续听、附和、开口、停下、忽略、重新规划。这些决策和上文的文本生成在同一个主干里发生，没有外部状态机。

得来速 demo 是最好的验证：司机与店员点单的全程，模型**保持安静**（判断「不是对我说的」），但**听到了每一句**（所以取餐时能确认「司机从没点 animal-style fries」）。这是「听懂」与「判断该不该响应」被解耦之后的产物——VAD 只有「有人声/没人声」一个比特，做不出这个区分。

再看第 8 章那条：官方从没公开词表与控制符设计，所以本书**不声称**这里有一个 `BARGE_IN` 之类的特殊 token。能确定的只是行为层面的结果：打断与附和是模型生成的行为，不是外挂信号。

## 10.5 策略从哪来：MOPD 的「交互行为」教师

这套策略不是 prompt 写出来的。官方在后训练里专门设了一类专家教师：

> `we train specialist teachers with reinforcement learning, including GRPO, on groups of related tasks: natural conversation, interactive behavior, dynamic delegation, and task completion. Through interaction, the teachers learn what to say and when to act—when to speak or yield, begin or extend a reasoning thread, call a tool, or delegate.`

`interactive behavior` 这一类，学到的正是上一代那四个 VAD 参数想编码的东西：何时开口、何时让步。区别是：

| | VAD 规则 | 学到的策略 |
|---|---|---|
| 输入 | 音频能量/概率 + 计时器 | 语音 + 视觉 + 上下文 + 任务状态 |
| 输出 | 布尔（说完了/没说完） | 开口 / 附和 / 停下 / 忽略 / 重规划 |
| 适应 | 改阈值 | 改训练数据与奖励 |
| 能识别旁人对话 | 否 | 是 |

**交互节奏是被训练出来的，不是架构附赠的**——这也是第 11 章要展开的训练栈的核心动机。

## 10.6 该用什么口径评测

第 2 章说过三个时间尺度，这里补成可操作的评测表（口径参考《全双工全模态工程全书》第 10 章的六类评测，并加上 Higgs 官方实际用的基准）：

| 类别 | 该测什么 | 官方对应基准 |
|---|---|---|
| 语音理解 | 听懂内容 | Big Bench Audio 98.9 |
| 语音鲁棒 | 噪声、口音、多人 | Audio MultiChallenge 44.9 |
| **全双工交互** | 打断、附和、重叠、话轮 | **Full-Duplex-Bench v1.5 75.5** |
| 流式音视频理解 | 边看边听的共时判断 | QIVD 56.0 |
| 主动交互 | 看视频时该不该开口、何时开口 | ProactiveVideoQA 31.9 |
| Agent 任务 | 后台执行是否跟随最新意图 | τ-Voice 69.8 |
| 语言能力不退化 | 多模态训练后文本能力 | IFEval 94.1 |
| 时间尺度 | 打断后多久停 / 多久开始有意义回应 / 多久办完 | 【官方未公布实测】 |
| 长会话 | 延迟、上下文保持、费用随会话时长 | 【官方未公布】 |

三点提醒：

1. **Big Bench Audio 拿第一 ≠ 全双工做好了**。语音问答准确率与话轮交互是两件事，Full-Duplex-Bench 那一项反而输给 GPT-Live-1（第 12 章）。
2. **「能及时停下」≠「任务做对」**。τ-Voice 才测后者。
3. **单次演示顺畅 ≠ 长时间稳定**。网络波动、嘈杂环境、用户改口后已启动的任务能否调整，都得靠部署数据回答。

## 10.7 本章小结

- 上一代 `higgs-realtime` 用 `server_vad` 四个阈值（0.85 / 300ms / 500ms / 0.125s）+ `semantic_vad` + 客户端 `conversation.item.truncate` 校正来管理话轮与打断。
- 官方 docs 也把上一代称作 full-duplex voice；Duplex 的「first」指的是 **omni**（视觉输入、面部输出、后台异步）。
- VAD 判不了附和时机、话语指向、静音含义；500ms 判停本身就超过人类 200ms 节奏。
- Duplex 把话轮变成每片一次的模型内策略决策；MOPD 的 `interactive behavior` 专家教师负责把它训出来。
- 评测必须分七类能力 + 三个时间尺度 + 长会话；Big Bench Audio 第一不代表全双工解决。

> 下一章讲这套策略具体怎么训：2T token 续训、MOPD、GRPO、四类专家教师，以及那个把 edge case 变成训练数据的 RSI 闭环。
