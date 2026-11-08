---
title: "Higgs Realtime Duplex 深度拆解 - 第3章: 一个 160ms 片里到底装了什么：3840 个采样点"
book: "Higgs Realtime Duplex 深度拆解：从 160ms 时间片到因果 DiT"
chapter: "3"
chapterTitle: "一个 160ms 片里到底装了什么：3840 个采样点"
description: "以 24kHz PCM 为基线逐条演算音频入 1 token 的 3840 比 1 压缩、音频出 2 frames、视频每 6 片一帧约 12 token、面部 2 latents，并用可运行脚本验证每片约 7 token 与每分钟 2625 token 的账"
date: "2026-11-08"
updatedAt: "2026-11-08"
agent: "研究员→编辑→审校员"
tags:
  - "token预算"
  - "采样率"
  - "音频codec"
  - "shape演算"
  - "可运行代码"
type: "book"
part: "篇二 · 时间片与 token 预算"
---

# 第 3 章 · 一个 160ms 片里到底装了什么

这一章只做一件事：把 `t=3200ms` 那一片，从采样点开始，逐项算到主干输入槽位。**所有【推断】都给算式。**

## 3.1 采样率基线

官方文档（上一代 `higgs-realtime`）写明：`Internal processing always runs at 24 kHz, 16-bit, mono PCM`；对外支持 8/16/24/48kHz PCM16、G.711 μ-law（8kHz 固定）、Opus（内部 24kHz，frame 2.5/5/10/20/40/60ms）。

> **【推断】** Duplex 的内部采样率官方未单独声明。本书按上一代 24kHz 基线推演；若实际不同，本章所有采样点数按比例缩放，但 **token 数与预算不受影响**（那些是【官方】给的）。

```python
SR        = 24_000                  # Hz，【官方 docs：上一代内部基线】
CHUNK_MS  = 160                    # 【官方】
SAMPLES   = SR * CHUNK_MS // 1000  # = 3 840
CHUNKS_PER_MIN = 60_000 // CHUNK_MS  # = 375
```

所以一片输入音频是 `[3840]` 个 int16 采样点，约 **7.5 KB** 裸数据；一分钟 375 片。

## 3.2 音频入：1 个 token，3840 : 1

官方：`one audio token per chunk in`，`Audio in runs at 6.25 tokens per second`。

```python
assert 1 / 0.160 == 6.25                 # 【官方】6.25 tok/s
assert 3840 / 1 == 3840                  # 【推断】压缩比 3840 : 1
```

这个压缩比比常见神经 codec 激进得多。做个对照：

| 编码器 | 帧率 | 每帧层数 | 每秒 token | 每片（160ms） |
|---|---|---|---|---|
| Mimi（Moshi） | 12.5 Hz | 8 层 RVQ | 100 | 16 |
| Whisper 特征 | 50 Hz | 连续 | 50 | 8 |
| **Higgs 音频入** | **6.25 Hz** | **1** | **6.25** | **1** |

**为什么一个 token 够用？** 因为它只需要承载「这一片说了什么语义」，不需要承载音色。音色由**参考音频在 decoder 侧**注入（第 7 章），主干根本不需要知道说话人是谁。这是把「内容」与「身份」拆开后拿到的最大一笔带宽节省，也是全双工能开长会话的前提。

反过来说，这也划出了能力边界：**输入侧不做高保真声学建模**。要克隆音色、评价格律细节，走的不是这条 token 流。

## 3.3 音频出：2 个 frame，每片

官方：`two out`、`audio out at 12.5`、`Each output chunk carries two audio frames`。

```python
FRAMES_PER_CHUNK = 2                       # 【官方】
SAMPLES_PER_FRAME = SAMPLES // FRAMES_PER_CHUNK   # = 1 920 → 80 ms
assert FRAMES_PER_CHUNK / 0.160 == 12.5   # 【官方】12.5 frame/s
```

**输入 6.25 / 输出 12.5 的不对称是全双工最关键的一处工程取舍**：

- 输入只需要「理解」，可以把 160ms 压成 1 个语义槽位；
- 输出要「还原波形」，一个槽位不足以重建 3840 个采样点，所以拆成 2 个 frame，每个负责 80ms。

理解与生成对带宽的需求本来就不同，硬让两侧同频，要么浪费输入、要么牺牲音质。这也是为什么第 7 章的因果流匹配解码器拿到的输入是 `[2, c]` 而不是一个向量。

## 3.4 视频入：每 6 片 1 帧，约 12 token

官方：`a camera frame only every six chunks`、`A camera frame, about a dozen tokens, comes once every six chunks`。

```python
FRAME_EVERY   = 6                     # 【官方】
FPS           = 1 / (6 * 0.160)      # ≈ 1.04 fps
TOK_PER_FRAME = 12                    # 【官方】about a dozen
VID_TOK_PER_CHUNK_AVG = TOK_PER_FRAME / FRAME_EVERY   # = 2
```

三个推论：

1. **约 1 fps**，不是 25/30fps。全双工里节奏主导者是语音（160ms 级），视频提供的是**场景证据**而非逐帧动作。口语教练 demo 能看口型纠音，靠的不是高帧率，是「这一帧恰好在发音时刻」加上绝对时间对齐。
2. **摊薄后每片只有 2 个视觉 token**——这是把 12 token 的帧均摊到 6 片上的平均值，实际是有帧的片 12 个、无帧的片 0 个。调度上必须允许这种「稀疏但突增」的输入，同时保证每片总算力仍可控（第 4 章）。
3. **静音期间帧照常流入**【官方】。回到贯穿例子：`t=3040ms` 工程师在读书，麦克风静音，但这一帧仍在进——所以 `t=3200ms` 他开口改条件时，模型知道他指的是书上哪一页。

## 3.5 面部出：2 个连续 latent，每片

官方：`two latents for the face`、`Each output chunk carries two audio frames and two image latents`。

```python
FACE_LATENTS_PER_CHUNK = 2            # 【官方】
assert FACE_LATENTS_PER_CHUNK / 0.160 == 12.5
```

注意用词是 **latent** 不是 token / ID：输出侧是**连续向量**交给因果 DiT 渲染像素，官方从未说这里有离散码本或词表（第 8 章专门处理这个坑）。每片都出，所以面部解码必须**每片算力恒定**。

## 3.6 ★每片 7 个 token：一个可以对上的账

把上面四条流的「摊薄后每片量」加起来：

```
音频入   1
视频入   12 / 6 = 2
音频出   2
面部出   2
─────────────
每片     7
```

乘上每分钟 375 片：

```python
CHUNKS_PER_MIN * 7   # = 2 625
```

**2625 ≈ 2.6K**，正好是官方与图注给的「音视频流约 2.6K token/分钟」。这不是巧合，而是说明官方那张预算图的四条数字（375 / 750 / 750 / 750）就是按「每片 7 槽位 × 375 片」算出来的。

> 【推断】这 7 个槽位里，输出侧的 4 个（2 audio + 2 face）是**本片生成的**，输入侧的 3 个（1 audio + 2 摊薄 video）是**本片读入的**。本书按「主干每片要处理的槽位数」口径相加；官方未公开主干是否把输出槽位也计入输入序列，此处只做预算对应，不声称是真实序列结构。

## 3.7 可运行验证脚本

下面这段不依赖任何第三方库，直接跑就能核对本章所有数字：

```python
# higgs_chunk_budget.py
SR, CHUNK_MS = 24_000, 160
SAMPLES = SR * CHUNK_MS // 1000                 # 3840
CHUNKS_PER_MIN = 60_000 // CHUNK_MS             # 375

A_IN_PER_CHUNK   = 1                            # 【官方】
A_OUT_PER_CHUNK  = 2                            # 【官方】
V_TOK_PER_FRAME  = 12                           # 【官方】about a dozen
FRAME_EVERY      = 6                            # 【官方】
F_OUT_PER_CHUNK  = 2                            # 【官方】

v_avg = V_TOK_PER_FRAME / FRAME_EVERY           # 2
per_chunk = A_IN_PER_CHUNK + v_avg + A_OUT_PER_CHUNK + F_OUT_PER_CHUNK

report = {
    "samples_per_chunk": SAMPLES,
    "samples_per_audio_frame": SAMPLES // A_OUT_PER_CHUNK,
    "audio_in_compression": f"{SAMPLES}:1",
    "camera_fps": round(1 / (FRAME_EVERY * CHUNK_MS / 1000), 3),
    "slots_per_chunk": per_chunk,
    "audio_in_per_min":  A_IN_PER_CHUNK  * CHUNKS_PER_MIN,   # 375
    "audio_out_per_min": A_OUT_PER_CHUNK * CHUNKS_PER_MIN,   # 750
    "video_in_per_min":  int(v_avg * CHUNKS_PER_MIN),        # 750
    "face_out_per_min":  F_OUT_PER_CHUNK * CHUNKS_PER_MIN,   # 750
    "total_per_min":     int(per_chunk * CHUNKS_PER_MIN),    # 2625
}
for k, v in report.items():
    print(f"{k:26s} {v}")

assert report["slots_per_chunk"] == 7
assert report["total_per_min"] == 2625
assert report["audio_in_per_min"] + report["audio_out_per_min"] \
     + report["video_in_per_min"] + report["face_out_per_min"] == 2625
print("all budgets reconcile with the official 2.6K token/min")
```

跑出来：

```
samples_per_chunk          3840
samples_per_audio_frame    1920
audio_in_compression       3840:1
camera_fps                 1.042
slots_per_chunk            7
audio_in_per_min           375
audio_out_per_min          750
video_in_per_min           750
face_out_per_min           750
total_per_min              2625
```

## 3.8 这一片里没有的东西

| 被省掉的 | 怎么做到的 | 代价 |
|---|---|---|
| 声学细节 / 音色 | 音色在 decoder 侧用参考音频注入 | 输入 token 流无法做声学级判断 |
| 高帧率视频 | 每 6 片 1 帧、约 12 token | 快速动作、细粒度时序理解受限 |
| 逐像素输出 | 每片只出 2 个 latent，像素交给 DiT | 画质依赖 decoder，与主干解耦 |
| 固定文本配额 | 思考/工具结果按 payload 可变 | 文本量不可预测，需渐进 compaction |

最后一行是下一章的主角：**7 个槽位是刚性的，文本是弹性的**。官方图注里把文本画成虚线区并注明 `Dashed sections show variable text usage, not a fixed cap`——这个「没有固定配额」的设计，既是灵活性的来源，也是长会话成本的主要不确定性。

## 3.9 本章小结

- 【推断基线】24kHz × 160ms = **3840 samples/片**，每分钟 **375 片**。
- 音频入 **1 token**（3840:1，6.25 tok/s），音频出 **2 frames**（每 frame 1920 samples / 80ms，12.5/s）——输入理解、输出还原，带宽需求不对称。
- 视频入每 6 片 1 帧（≈1.04fps、约 12 token、摊薄 2/片），静音期间持续流入；面部出每片 2 个连续 latent。
- ★**7 槽位/片 × 375 片 = 2625 ≈ 2.6K token/分钟**，四条分项 375/750/750/750 全部对得上，脚本可复算。
- 文本没有固定每片配额，是弹性的，也是长会话成本的主要变数。

> 下一章把账本拉长到一分钟、五分钟：2.6K 怎么变成 13K~25K，渐进 compaction 压的是什么，以及 KV cache 到底要多少显存。
