---
title: "Higgs Realtime Duplex 深度拆解 - 第9章: 一个模型多条线程：慢任务怎么不阻塞快流"
book: "Higgs Realtime Duplex 深度拆解：从 160ms 时间片到因果 DiT"
chapter: "9"
chapterTitle: "一个模型多条线程：慢任务怎么不阻塞快流"
description: "拆解前台自思考、异步工具与后端委派三条路径，说明工具结果以 payload 回灌输入 chunk、思考跨多片拼接、完整共享上下文委派，并逐帧复盘四个官方演示各自验证的机制"
date: "2026-11-08"
updatedAt: "2026-11-08"
agent: "研究员→编辑→审校员"
tags:
  - "异步"
  - "工具调用"
  - "委派"
  - "任务状态"
  - "demo复盘"
type: "book"
part: "篇四 · 后台与交互策略"
---

# 第 9 章 · 一个模型多条线程

## 9.1 五条流同时开着

官方：`Higgs Realtime Duplex runs many threads at once. Your voice and video stream in while the model's voice and face stream out. At the same time it can think, call a tool, or hand a question to a bigger model, and none of that stops it from listening and watching.`

拆成可列的东西：

```
输入快流：你的语音 / 摄像头 / 共享屏幕     每 160ms 一片
输出快流：它的语音 / 它的面部             每 160ms 一片，从不中断
后台慢流：思考线程 / 工具线程 / 委派线程   跨多片，异步
回灌流：  工具结果、后端回复             以 payload 落进某个输入 chunk
```

**前台模型（front model）**【官方定义】是直接与你对话、维持互动的那一部分；**backend model** 是 `a much bigger backend model` / `a frontier model`（名称与规模【未公开】）。工具则是 `Search, knowledge bases, booking, CRM lookups, or any function a deployment defines`。

关键在于：前台与后台之间是**异步调用**，结果回来时前台仍在说、仍在听。这不是「流水线里加了个等待」，是把慢任务从快流的时间轴上摘出去了。

## 9.2 ★与 Thinking Machines 的分水岭

官方这段写得很不客气，值得整段引用：

> `This is where we differ from Thinking Machines' interaction models, whose front model leaves thinking and tool calls to a background model. Ours thinks and calls tools itself. A system that delegates all reasoning and tool use to a larger model is simpler to train, but a large reasoning model may take ten seconds or more to respond, and calling it every turn makes cost hard to control. So the front model handles most requests on its own and saves the backend for the turns that need it.`

| | Thinking Machines 路线 | Boson 路线 |
|---|---|---|
| 前台职责 | 维持对话 | 维持对话 **+ 自己思考 + 自己调工具** |
| 推理/工具 | 全部交给后台大模型 | 前台先自己来，只在必要时委派 |
| 训练难度 | 简单 | 难（要训出「何时求助」的策略） |
| 风险 | 大模型 10s+ 才回、每轮调用成本不可控 | 前台能力有上限 |
| 设计目标 | 架构简单 | `We want the front model to be as smart as it can be on its own, and to reach for help only when it has to` |

这条分水岭也能解释为什么需要第 11 章那套 MOPD 训练：**「何时该自己答、何时该委派」本身是一个要被学出来的策略**，不是 if-else 能写死的东西。

## 9.3 三条提升回答质量的路径

官方：`It has three ways to raise the quality of an answer`：

| 路径 | 官方描述 | 时间轴行为 |
|---|---|---|
| **Think** | `As each meaningful phrase or idea arrives, the model can build on an ongoing reasoning thread without waiting for the full question. That reasoning continues across chunks, alongside both listening and speaking` | 用户还在说就开始推理；跨片延续；边说边想 |
| **Call tools** | `Calls go out as early as possible, asynchronously, and the model starts answering from partial results` | 尽早发出；不等完整结果；前台继续听/想/说 |
| **Delegate** | `When a task is beyond the front model, it hands it to a much bigger backend model, along with the full shared context. While the backend works, the front model keeps the conversation going, including on other topics` | 连完整共享上下文交出；期间聊别的；结果回来再带回 |

三条的共同点：**都不要求对话停下来**。这也是「Works in the background」这个副标题的实际含义——不是「模型会 multitask」这种泛泛而谈，而是「慢 I/O 与快流在时间轴上解耦」。

## 9.4 payload 机制：四条官方细节

1. `Each arriving tool result enters its input chunk as a payload, without a fixed per-chunk text-token quota`【官方】——结果不是排队等一个专用槽，哪个片到了就插哪个片，长度不限。
2. `Thinking and tool-call generation can span multiple chunks; concatenating those chunks recovers the full output stream`【官方】——思考与调用是流式的，不是一次生成完整 JSON。
3. `Some tools return intermediate results in stages as they work` + `The model doesn't wait for a full result before it starts to speak`【官方】——分阶段返回，从部分结果就开始答。
4. 委派时 `along with the full shared context`【官方】——后端拿到的不是一句改写过的 query，而是完整共享上下文；否则难题委派过去会丢掉前文条件。

配上第 3 章的八步图：`t-2 / t-1 / now` 三个输入片各收到 part1/2/3，前台从 part2 就开始说话，part3 到达时把结论补上。**「没有 dead air」不是靠填充语撑时间，是靠任务本身在后台推进、前台按需播报。**

## 9.5 真正难的是任务状态，不是异步本身

异步调用谁都会写，麻烦的是**用户意图在任务执行中变了**。官方 demo 与中文解读都指向同一组问题：

| 要持续回答的问题 | 处理不好会怎样 |
|---|---|
| 当前有效的任务要求是什么？ | 用户说「先别看价格」，旧查询还在跑 |
| 哪些工作能继续、哪些要重做？ | 白算一遍或用了作废的中间结果 |
| 已返回的结果是否已过时？ | 把针对旧要求的答案当成最终答案 |
| 什么时候向用户解释变化最合适？ | 抢话打断用户，或等到用户以为你忘了 |

回到贯穿例子：`t=3200ms` 工程师改口「先别看价格，重点比维护成本」，`t=3840ms` 工具才回 part1。系统必须在 `3200` 那一帧就标记旧任务参数失效，并在 `3840` 判断「这个 part1 是按旧参数算的，不能直接用」，同时前台说一句「好，我按维护成本重算」把状态变化告知用户。

官方给的解法线索有两条：一是**渐进 compaction 只把「进行中工作所需的信息」往前带**（第 4 章），二是 MOPD 里专门有「动态委派」与「任务完成」两类专家教师（第 11 章）。换句话说，**任务状态维护是被当成可训练的策略，而不是外挂一个状态机**。

## 9.6 四个官方 demo 逐帧复盘

| Demo | 官方描述 | 验证了什么机制 |
|---|---|---|
| **团队会议** | 讲架构、被中途提问、读白板、边讲边更新图 | 打断 + 视觉持续流入 + 跨模态指代（「这个箭头」指白板哪一处）；依赖绝对时间 ID |
| **英语口语教练** | 计时看图说话、抓出 west/vest、看口型纠音、像教练一样控制节奏 | 约 1fps 也能抓到发音瞬间，靠的是**音视频共时对齐**而非高帧率；附和与计时属于话轮策略 |
| **得来速** | 让查行情与训练进度；司机跟店员点单时保持安静；取餐时确认「司机从没点 animal-style fries」 | ★「识别不是对自己说的话」+ 长时间保持听觉状态；这是 VAD 完全做不到的一层 |
| **Hands-free engineering** | 工程师全程读书；语音 diff 两个引擎版本 → 让 Claude Code 后台造 mass 工具 → 同时跑合规检查并应用修复 → 发邮件 → 工具落地后报新质量 | 思考/工具/委派三线并行、payload 分阶段回灌、任务状态跟随意图变化；本书贯穿例子 |

得来速那条最值得单独说：模型**听到了每一句话**（所以能确认「从没点过」），但**知道哪些不是对自己说的**（所以点单全程不插嘴）。这两个能力叠加，正是「全双工买的是交互节奏」最具体的证据——它跟知识量、推理分数都无关。

## 9.7 代码骨架：前台快循环 + 后台完成队列

```python
# 【推断】按官方行为描述的事件循环骨架，非官方实现
class DuplexRuntime:
    def __init__(self, front, tools, backend):
        self.front, self.tools, self.backend = front, tools, backend
        self.inbox = []          # 工具/后端结果，按到达时间落进输入 chunk
        self.threads = {}        # 进行中的任务状态

    def tick(self, t_ms, mic_chunk, camera_frame):
        # ① 快流：组装本片输入（含已到达的 payload）
        payload = [p for p in self.inbox if p.t_ms <= t_ms]
        self.inbox = [p for p in self.inbox if p.t_ms > t_ms]
        x = build_chunk(t_ms, mic_chunk, camera_frame, payload,
                        self.threads, prev=self.last_out)

        # ② 前台一次前向，必须在本片内算完
        out = self.front.step(x)
        a_frames, f_latents = decode_chunk(out, ref_audio, ref_image)
        play(a_frames, f_latents)
        self.last_out = out

        # ③ 慢流：只发指令，绝不在这里等结果
        for action in out.actions:
            if action.kind == "tool":
                self.tools.call_async(action, on_partial=lambda p, t=t_ms: self.inbox.append(p))
            elif action.kind == "delegate":
                self.backend.ask_async(action, full_shared_context=self.context,
                                       on_done=lambda r: self.inbox.append(r))
            elif action.kind == "invalidate":     # 用户改口，标旧任务失效
                self.threads[action.task_id].obsolete = True
```

`tick` 里**没有任何 `await` 或阻塞等待**。这是全章唯一必须记住的工程约束：前台循环是时钟驱动的、有硬截止；后台是事件驱动的、没有截止。两者只通过 `inbox` 这个完成队列耦合。

## 9.8 为什么它更像操作系统，不像顺序时间片表

《全双工全模态工程全书》第 9 章画的是一张顺序时间片表：这一片做什么、下一片做什么。Higgs 的实际形态是：

- 前台是**硬实时循环**（160ms 截止）；
- 后台是**线程池**（可能跑几秒到十几秒）；
- `inbox` 是**完成队列**；
- 渐进 compaction 是**内存管理**；
- 「何时说/停/委派」是**调度策略**，而且是被训练出来的（第 10、11 章）。

用操作系统类比，比用「一轮一轮对话」类比准确得多。这也解释了为什么官方反复强调 `One model, many threads`——线程是架构词，不是修辞。

## 9.9 本章小结

- 五条流并行：输入快流、输出快流、思考/工具/委派慢流、结果回灌流；前台与后台异步解耦。
- ★与 Thinking Machines 的分水岭：Boson 让前台自己思考与调工具，避免大模型 10s+ 与每轮调用成本；后台只留给真正需要的轮次。
- 三条路径 Think / Call tools / Delegate 都不要求对话停下；payload 无固定配额、思考跨片拼接、工具分阶段返回、委派带完整共享上下文。
- 真正的难点是**用户中途改口时的任务状态维护**；靠渐进 compaction 与 MOPD 的动态委派/任务完成教师来学。
- 四个 demo 各有验证目标，得来速的「听到了每句但知道哪些不是对自己说的」是 VAD 做不到的。
- 前台快循环里不允许任何阻塞等待；整体更像硬实时循环 + 线程池 + 完成队列。

> 下一章收窄到一个具体问题：上一代产品用四个 VAD 阈值管话轮，Duplex 怎么把这套外部规则变成模型内部学到的策略。
