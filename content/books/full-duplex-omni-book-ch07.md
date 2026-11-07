---
title: "全双工全模态工程全书 - 第7章: 怎么生成文本与语音：从 75840 个 logits 到 1920 个波形采样点"
book: "全双工全模态工程全书：一个例子讲透词表、Embedding 与生成"
chapter: "7"
chapterTitle: "怎么生成文本与语音：从 75840 个 logits 到 1920 个波形采样点"
description: "给出输出头、logits mask 状态机、逐片采样 ID 序列、8 层 RVQ 与 codec 解码的完整代码，解释 Inner Monologue 不播放的原因与首包延迟四段账"
date: "2026-11-07"
updatedAt: "2026-11-07"
agent: "研究员→编辑→审校员"
tags:
  - "生成"
  - "logits mask"
  - "状态机"
  - "codec"
  - "首包延迟"
type: "book"
part: "篇四 · 生成与时序"
---

# 第 7 章 · 怎么生成文本与语音：从 75840 个 logits 到 1920 个波形采样点

第 6 章结束时，我们手上有 `hidden[86]`（4096 维）。这一章把它变成用户真正听见的「不能，金属…」。

## 7.1 一个 head，75840 个 logits

```python
logits = head(hidden[86])        # Linear(4096, 75840) → [75840]
# 例如 [0.3, 1.2, -0.8, …, 9.7, …]，第 12847 维是「不」的分数
```

**所有模态共用一个 softmax**。这是统一词表路线最省的地方：不需要为文本、音频、图像各配一个分类头，也不需要路由网络先决定「这次该说还是该画」。一个 75840 维向量，各区间的分数直接可比。

训练目标也是同一个 Cross-Entropy：

```python
loss = F.cross_entropy(logits.view(-1, V), labels.view(-1))
# labels 每个位置是 0..75839 的整数，不管是文本、音频还是控制符
```

输入侧的连续向量位置（64 个视觉 token）在 `labels` 里填 `-100`，告诉 loss「这些是条件，不是预测目标」。

## 7.2 状态机 + logits mask：不让图片中间串出文字

光有区间不够。模型连续输出 8 个音频 token 时，中间若采出一个文本 ID，波形就坏了。工程上用状态机锁区间：

```python
def apply_mask(logits, state):
    m = torch.full_like(logits, -float('inf'))
    if state == "text":
        m[0:65536] = 0                       # 文本区放行
        m[BOA] = m[BOV] = m[EOS] = 0         # 允许切到音频/视觉/结束
    elif state == "audio":
        m[73728:75776] = 0                   # 只准采音频码
        m[EOA] = 0                           # 外加允许结束
    elif state == "image":
        m[65536:73728] = 0
        m[EOV] = 0
    return logits + m
```

这一步是**硬约束**。纯数据驱动（不加 mask，靠海量数据让模型自己学会边界）只有超大规模预训练才撑得住，普通团队复现不了。

## 7.3 完整生成循环

```python
state, a_buf, v_buf = "text", [], []
emitted = []

for step in range(N):
    idx = sample(apply_mask(head(h_last), state))   # → 一个整数 ID
    emitted.append(idx)
    h_last = model.step(h_last, E(torch.tensor([idx])))

    if   idx == BOA: state, a_buf = "audio", []
    elif idx == BOV: state, v_buf = "image", []
    elif state == "audio":
        a_buf.append(idx)
        if len(a_buf) == 8:                        # 攒满 8 层 RVQ
            pcm = codec.decode(a_buf)              # [1920] 出声 80ms
            speaker.write(pcm)
            a_buf = []
    elif state == "image":
        v_buf.append(idx)
        if len(v_buf) == 1024:                     # 第 8 章
            pixels = vq_decoder.decode(v_buf)
            v_buf = []
    elif idx == EOA: state = "text"
    elif idx == EOV: state = "text"
```

注意 `h_last = model.step(...)` 这一行：采出的 ID 立刻查 `E` 变成 4096 维向量，作为下一步输入回灌。这就是自回归——**生成的 token 和输入的 token 查的是同一张表**。

## 7.4 本例实际采出的 ID 序列

`t=3200ms` 起（示意，两片压在一起展示）：

| step | ID | 区间 | 含义 | 播放？ |
|---|---|---|---|---|
| 1 | `12847` | 文本 | 「不」 | ❌ Inner Monologue |
| 2 | `20311` | 文本 | 「能」 | ❌ Inner Monologue |
| 3 | `75778` | 控制 | `BOA` | ❌ 状态切换 |
| 4 | `74012` | 音频 | `/bu/` 语义层 | 攒着 |
| 5 | `74105` | 音频 | 音色层 | 攒着 |
| 6–10 | `74208 … 74381` | 音频 | 韵律…气息层 | 攒着 |
| 11 | `74390` | 音频 | 第 8 层 | 攒满 → 解码 |
| 12 | `75779` | 控制 | `EOA` | ❌ 状态切回 text |

**用户一个字都没看到**：文本 ID 只在内部当锚，真正出声的是 8 个音频 ID 解码出的波形。严格说 Moshi 的时间对齐是每片 1 个文本前缀 + 8 个音频 ID（「不」配第一片，「能」配第二片），上表为紧凑把两片并排了。

## 7.5 codec 解码：整数怎么变成波形

```python
def codec_decode(ids):                          # 8 个整数
    # ① 区间偏移 → 声学码本下标
    z = sum(codec.codebook[i - 73728] for i in ids)   # [128] 8 层残差相加
    # ② 因果转置卷积上采样：12.5Hz → 24kHz（1920×）
    return codec.decoder(z)                            # [1920] 波形
```

这里用的就是第 2 章那第二套向量：`74012 - 73728 = 284`，取 `codec.codebook[284]`，128 维。8 层相加得到这一帧的完整 latent，再上采样回 1920 个采样点。

三条解码路线对比：

| 路线 | 做法 | 延迟 | 音质 | 代表 |
|---|---|---|---|---|
| A 直接重建 | 转置卷积镜像 encoder | 几 ms，最快 | 受限于码本 | Mimi / Moshi（本书） |
| B 生成式解码 | token 作条件 → DiT/流匹配生成 mel → 声码器 | 首包约 234~640ms | 更好 | Qwen2.5-Omni / Qwen3-Omni |
| C 两段式 | 语义 token → 流匹配 → HiFi-GAN | 中 | 好 | CosyVoice 2 |

全双工必选 A：延迟预算只有 160~230ms，多一次迭代采样就超标。B 适合对音质要求高、能接受首包慢的半双工场景。

## 7.6 首包延迟四段账

```
① 分帧等待     80 ms   （等这一片 1920 samples 收齐）
② 编码器+主干  约 40 ms（7B 时间维模型一步）
③ codec 解码   几 ms   （转置卷积，确定性）
④ 语义决策     0 ms    （全双工每帧都在判，无额外等待）
                 ────
              约 120~200 ms
```

人类话轮间隔约 230ms（跨 10 语言统计），所以 200ms 是能做的、1~3 秒的级联管线是完全不及格的。这段账也解释了为什么 12.5Hz 是甜点：分帧 80ms 是里面唯一能被架构直接压缩的一段，降到 25Hz（40ms/帧）会省 40ms，但序列长度翻倍、KV cache 翻倍，不划算。

## 7.7 Inner Monologue 的三重作用（回顾）

1. **保语言能力**：文本流按 next-token 一直跑，主干不被语音 token 分布拉扯。这是「多模态拖累文本」的结构解法，不靠冻结也不靠数据配比。
2. **给音频规划锚**：先定「不」，codec 才知道合成 `/bu/` 而不是别的音节。
3. **审计轨迹**：文本流可单独 dump，比读 8 层声学码友好得多，也方便做内容安全复检。

Qwen2.5-Omni 的 Thinker-Talker 与之等价：Thinker 只出文本和隐状态，Talker 独立小模型从隐状态出语音 token，文本能力完全不被语音训练触碰。

## 7.8 输出侧常见坑

| 坑 | 后果 |
|---|---|
| 状态机忘了放 `EOA` | 音频段永远出不来，无限采音频码 |
| 用「采到一个字」当出声 | 实际每 80ms 必须攒满 8 个音频 ID 才解码一次，少一层都不出声 |
| 把 `E[id]` 直接送给 codec | 拿到 4096 维语义向量，解码器要的是 128 维声学码，必须用 `id - 73728` 查另一张表 |
| 文本 ID 也送去播放 | 用户会同时看到文字和听到声音，且文本流是「心里想的」，内容未必适合展示 |
| 输出头按模态拆成多个 | 需要额外路由头，且失去跨模态分数可比性；除非刻意做结构隔离 |

## 7.9 本章小结

- 一个 `Linear(4096, 75840)` 出全部模态 logits，一个 CE loss 训练。
- `apply_mask` 状态机锁区间，`BOA/EOA/BOV/EOV` 触发切换，是硬约束不是训练习惯。
- 每片先采 1 个文本 ID（不播放）＋ 8 个音频 ID（攒满解码）＋ 控制符。
- codec 用 `id - 73728` 查第二套码本，8 层相加 → 1920 samples 波形；全双工只选直接重建路线。
- 首包延迟 80 + 40 + 几 + 0 ≈ 120~200ms，人类话轮间隔约 230ms。

> 下一章：如果用户说「画一下这个杯子」，模型怎么输出画面——`BOV` + 1024 个视觉 ID、3D 因果 VAE、时空注意力，以及为什么全双工产品里很少真的出画面。
