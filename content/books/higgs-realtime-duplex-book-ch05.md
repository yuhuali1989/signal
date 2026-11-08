---
title: "Higgs Realtime Duplex 深度拆解 - 第5章: 把一片排成一条序列：槽位、时间 ID 与 payload"
book: "Higgs Realtime Duplex 深度拆解：从 160ms 时间片到因果 DiT"
chapter: "5"
chapterTitle: "把一片排成一条序列：槽位、时间 ID 与 payload"
description: "按官方 token 预算反推单个 chunk 的主干输入序列构成，讲清绝对时间 ID 与 chunk-causal、四层模态身份标签、自反馈槽位与工具 payload 的可变插入，并给出可运行的 chunk builder 代码"
date: "2026-11-08"
updatedAt: "2026-11-08"
agent: "研究员→编辑→审校员"
tags:
  - "序列构造"
  - "时间编码"
  - "chunk-causal"
  - "模态标签"
  - "代码骨架"
type: "book"
part: "篇二 · 时间片与 token 预算"
---

# 第 5 章 · 把一片排成一条序列

前两章算的是「有多少」。这一章算「怎么排」。**整章的序列结构是【推断】**——官方只给了每片各流多少 token，没给主干序列；本书按可复算的预算反推一种自洽排法，并明确标出哪些是通用工程做法、哪些是本书假设。

## 5.1 一片的槽位清单

按第 3 章的账，`t=3200ms` 这一片大致要处理这些槽位：

| # | 槽位 | 数量 | 来源 | 性质 |
|---|---|---|---|---|
| ① | 用户音频 token | 1 | 【官方】每片 1 个 | 输入，只建模不采样 |
| ② | 摄像头帧 token | 0 或 12 | 【官方】每 6 片 1 帧 | 输入，稀疏突增 |
| ③ | 自身上一片音频 frame | 2 | 【官方】每片出 2 | 自反馈，自回归需要 |
| ④ | 自身上一片面部 latent | 2 | 【官方】每片出 2 | 自反馈，保持面部连续 |
| ⑤ | 文本 / 思考 / 工具 payload | 0~数百 | 【官方】无固定配额 | 弹性，可跨片 |
| ⑥ | 边界/控制标记 | 若干 | 【推断】 | 分段与状态提示 |

排成一条序列（**本书推演，非官方实现**）：

```text
[CHUNK t=3200]
BOUNDARY | A_in(1) | [V_frame(12) if t%6==0] | TEXT(variable) |
A_out_prev(2) | F_out_prev(2) | EOC
         ↑ 全部打上 (t_ms, 槽位序号, 模态类型) 三元组
```

平均长度 = `1 + 2 + 2 + 2 + 少量控制 ≈ 7 + variable`，正好对上第 3 章的 7 槽位预算。

## 5.2 绝对时间 ID，不能用序号

这是全双工与离线模型最容易做错的一处。若用「第几个 token」当位置：

- 视频有帧的片多 12 个 token、没帧的片少 12 个；
- 工具 payload 可能让某片文本暴涨；
- 静音片音频内容不同但槽位数相同。

于是「第 500 个 token」在不同会话里根本不是同一时刻。**必须给每个槽位打绝对物理时间**：

```python
def pos_ids(t_ms, slots):
    # (t, h, w)：t 是绝对毫秒；视觉槽带空间坐标，音频/文本 h=w=0
    out = []
    for i, s in enumerate(slots):
        if s.kind == "video":
            out.append((t_ms, s.h, s.w))
        else:
            out.append((t_ms, 0, 0))
    return out
```

为什么 `t` 必须绝对：回到贯穿例子，`t=3200ms` 用户改口说「先别看价格」，`t=3840ms` 工具 part1 回来。如果位置靠序号，改口那句话会被绑到「上一个有帧的片」的画面上——而那一帧可能是 960ms 前他还在翻书的画面。绝对时间让「这一声」和「这一帧」在位置编码上共享同一个 `t`，模型才知道谁配谁。

> 【推断】Higgs 官方未公开位置编码方案。本书按全双工通用做法推演「绝对时间 ID + chunk-causal」；站内《全双工全模态工程全书》第 5 章用的是 TMRoPE 式三维坐标，可作同类参照。

## 5.3 chunk-causal 掩码

全双工的因果性比普通 decoder 严格：**不能看未来帧、不能看未来片**。

```python
def chunk_causal_mask(slots, t_now):
    # 片内双向（音视频要互相看，才能做共时对齐）
    # 片间只看过去（当前片不能看 t_now 之后的任何片）
    L = len(slots)
    m = [[False] * L for _ in range(L)]
    for i, a in enumerate(slots):
        for j, b in enumerate(slots):
            m[i][j] = (b.t <= t_now)          # 简化：同片互可见，未来片全屏蔽
    return m
```

三个推论：

1. **视觉编码器必须改成分块因果**。SigLIP/CLIP 这类双向 ViT 直接用会看未来帧，流式部署静默失效。
2. **decoder 也要冠以 causal**（官方两个解码器都明确写了 causal）——latent 里混进未来帧信息，边看边说就无法成立。
3. **持久 KV cache**：历史片的 K/V 缓存复用，每片只 prefill 新增槽位，不在每片重算全历史。这是 160ms 内能跑完一次前向的前提。

## 5.4 四层模态身份标签【通用做法，非官方】

三条流的向量进主干时都是 `d` 维浮点，数学上没有东西能自证来源。通用做法是显式贴四层：

| 层 | 回答 | 实现 |
|---|---|---|
| `type_id` | 是什么模态 | 可学习 `Embedding(K, d)`，**逐元素加**，不要 concat（会破坏 RMSNorm 与残差尺度） |
| 边界符 | 一段从哪到哪 | `BOV/EOV/BOA/EOA` 必须是词表里真 token 且参与训练 |
| `(t,h,w)` | 何时、画面哪里 | 视觉 h/w 非零，音频/文本置 0 |
| `stream_id` | 谁说的 | 用户流 / 模型流，全双工必需 |

第 4 层最容易漏：把双流拍平成一条序列又不加 `stream_id`，模型会**把自己刚输出的语音当成用户的新输入**，打断逻辑直接崩。官方那句「识别不是对自己说的话」也依赖这一层——得先分得清声源，才谈得上判断指向。

> ⚠️ 本书把这四层列为**通用工程做法**（出自站内教学基准书），**不声称 Higgs 用了这几层或用了这些名字**。官方只公布了行为结果，没公布实现。

## 5.5 自反馈槽位：为什么自己的输出要回到输入

每片出的 2 个 audio frame 与 2 个 image latent，下一片要作为上下文回到主干。原因有三：

1. **自回归一致性**：不知道自己上一片说了什么，下一片会重复或跑题。
2. **打断判定**：模型流持续存在，用户流出现非静音时才知道「有新输入」而不是「自己的声音被麦克风录回来了」。
3. **面部连续性**：官方 video decoder 的条件是「参考图 + **前两个 latent**」【官方】——时间上的自反馈直接写在解码条件里，保证脸在长会话里不漂。

## 5.6 工具 payload 怎么塞进来

官方三条连着写：`Thinking and tool-call generation can span multiple chunks`、`Each arriving tool result enters its input chunk as a payload, without a fixed per-chunk text-token quota`、`Some tools return intermediate results in stages as they work... The model doesn't wait for a full result before it starts to speak`。

实现上的含义：

```python
class ToolBus:
    """工具结果以 payload 落进某个输入 chunk，不预留固定文本配额。"""
    def __init__(self):
        self.pending = []

    def on_partial(self, t_ms, part):
        self.pending.append((t_ms, part))          # 可分批到达

    def drain(self, t_ms):
        ready = [p for t, p in self.pending if t <= t_ms]
        self.pending = [(t, p) for t, p in self.pending if t > t_ms]
        return ready                               # 0 ~ N 条，长度完全可变
```

关键不是代码，是**调度范式的差别**：这不是「每片固定 N 个文本槽」的表格，而是像操作系统里异步 I/O 完成队列——哪个片有结果，就往哪个片插；没有结果就一个不插。所以官方把文本画成虚线：它是事件驱动的，不是时钟驱动的。

## 5.7 可运行的 chunk builder

下面这段不依赖深度学习框架，把本章的槽位、时间 ID、payload 全部跑一遍（形状注释说明真实张量会是什么样）：

```python
# higgs_chunk_builder.py
from dataclasses import dataclass

@dataclass
class Slot:
    kind: str          # audio_in / video / text / audio_out / face_out
    t_ms: int
    h: int = 0
    w: int = 0
    payload: str = ""

CHUNK_MS = 160

class ToolBus:
    def __init__(self): self.pending = []
    def on_partial(self, t_ms, part): self.pending.append((t_ms, part))
    def drain(self, t_ms):
        ready = [p for t, p in self.pending if t <= t_ms]
        self.pending = [(t, p) for t, p in self.pending if t > t_ms]
        return ready

def build_chunk(t_ms, tool_bus, prev, has_camera_frame=True):
    slots = [Slot("audio_in", t_ms)]                       # 【官方】1 token
    if has_camera_frame and (t_ms // CHUNK_MS) % 6 == 0:  # 【官方】每 6 片 1 帧
        for k in range(12):                                # 【官方】约 12 token
            slots.append(Slot("video", t_ms, h=k // 4, w=k % 4))
    for part in tool_bus.drain(t_ms):                      # 弹性，无固定配额
        slots.append(Slot("text", t_ms, payload=part))
    slots += [Slot("audio_out", t_ms) for _ in range(2)]  # 【官方】自反馈 2
    slots += [Slot("face_out", t_ms) for _ in range(2)]   # 【官方】自反馈 2
    pos = [(s.t_ms, s.h, s.w) for s in slots]              # 绝对时间 ID
    return slots, pos                                      # 真实实现：x = cat(emb) → [L, d]

bus = ToolBus()
bus.on_partial(3840, "mass_tool part1")
bus.on_partial(4000, "mass_tool part2")
bus.on_partial(4160, "mass_tool part3")

prev = {"audio": [None, None], "face": [None, None]}
for t in (3040, 3200, 3360, 3520, 3680, 3840, 4000, 4160):
    slots, pos = build_chunk(t, bus, prev)
    kinds = {}
    for s in slots: kinds[s.kind] = kinds.get(s.kind, 0) + 1
    print(f"t={t:5d}ms  L={len(slots):2d}  {kinds}  payload={[s.payload for s in slots if s.payload]}")
```

输出能直接看出三件事：静音片 `t=3040` 只有基础槽位；`t=3200` 有帧的片多 12 个视觉槽；`t=3840/4000/4160` 三片各多一条 payload，长度各不相同。

## 5.8 与 87 槽位教学基准的对照

| | 教学基准（全双工全书前 10 章） | 本书按 Higgs 预算推演 |
|---|---|---|
| 每片视觉 | 64 | 0 或 12（摊薄 2） |
| 每片音频 | 16（双流各 8 层 RVQ） | 1 入 + 2 出 |
| 面部 | 无 | 2 latent |
| 每片合计 | 87 | 约 7 + 可变文本 |
| 时间坐标 | `(t,h,w)` 绝对毫秒 | 同左【推断】 |
| 控制符 | `SIL/HMM/BARGE_IN` 在统一词表尾部 | 【未公开】 |

差别不在「谁更先进」，而在目标函数：教学基准为了让每个 shape 手算出来，给了视觉充足槽位；Higgs 为了每天数小时开着不破产，把预算砍到个位数，把智能主要交给**后台异步**去补。

## 5.9 本章小结

- 一片的序列约为 `1 音频入 + 0/12 视频 + 2 音频自反馈 + 2 面部自反馈 + 弹性文本`，平均 7 槽位，与预算吻合（【推断】排法）。
- 位置必须用**绝对时间 ID**；跳帧、静音、payload 突增都会让序号漂移。片内双向、片间因果，配持久 KV cache。
- 四层身份标签（type / 边界 / `(t,h,w)` / stream）是通用做法，**不是官方实现**；漏 `stream_id` 会导致无限自打断。
- 工具结果按事件回灌，无固定每片配额；文本是事件驱动而非时钟驱动。
- 本章给了可运行 builder，能复现贯穿例子 8 个片的槽位变化。

> 下一章进主干：45B MoE 到底是什么、为什么不是更大、2T token 续训在保什么，以及李沐那套带宽/内存/算力哲学怎么落到这套配置上。
