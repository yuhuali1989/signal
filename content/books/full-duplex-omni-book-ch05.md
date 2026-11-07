---
title: "全双工全模态工程全书 - 第5章: 怎么混合：87 个槽位、四层身份标签与 TMRoPE"
book: "全双工全模态工程全书：一个例子讲透词表、Embedding 与生成"
chapter: "5"
chapterTitle: "怎么混合：87 个槽位、四层身份标签与 TMRoPE"
description: "给出把三路 embedding 拼成 x[1,87,4096] 的完整可运行代码，逐一解释 type_id、stream_id、边界符、(t,h,w) 四层标签，以及为什么必须用绝对毫秒时间而非 token 序号"
date: "2026-11-07"
updatedAt: "2026-11-07"
agent: "研究员→编辑→审校员"
tags:
  - "混合"
  - "TMRoPE"
  - "位置编码"
  - "stream_id"
  - "因果掩码"
type: "book"
part: "篇三 · 混合与主干"
---

# 第 5 章 · 怎么混合：87 个槽位、四层身份标签与 TMRoPE

前面三章分别产出了文本 1 个、用户音频 8 个、模型音频 8 个、视觉 64 个 4096 维向量。这一章把它们拼成主干的那一个张量，并把「模态区分」这件事彻底落地。

## 5.1 「混合」到底是哪一步

严格说混合有两层含义，别混：

| | 在哪 | 有没有跨模态交互 |
|---|---|---|
| **拼接（combine）** | 本章，进主干之前 | ❌ 只是放进同一条序列 |
| **融合（fusion）** | 第 6 章，主干自注意力 | ✅ `Q·K` 真正产生交互 |

`cat` 之后 `x[1, 87, 4096]` 里没有任何跨模态计算发生。它只是让后面的注意力**有机会**看到别的模态。这是早融合架构的必要条件，不是充分条件。

## 5.2 完整可运行代码

```python
import torch
import torch.nn as nn

V, d = 75840, 4096
BOV, EOV, BOA, EOA = 75776, 75777, 75778, 75779
SIL, HMM, BARGE_IN = 75780, 75781, 75782

class OmniInputBuilder(nn.Module):
    def __init__(self):
        super().__init__()
        self.E          = nn.Embedding(V, d)          # 唯一一张词表
        self.visual_prj = Resampler(1152, d, 64)      # 第 4 章
        self.codec      = MimiCodec()                 # 第 3 章
        self.type_emb   = nn.Embedding(4, d)         # 0文 1音 2视 3控制
        self.stream_emb = nn.Embedding(2, d)         # 0用户流 1模型流

    def ctrl(self, i):
        return self.E(torch.tensor([i]))              # [1, 4096]

    def build(self, wav_user, frame, wav_model_prev, t_ms=3200):
        # ① 三路 embedding
        a_user  = self.E(self.codec.encode(wav_user))          # [8, 4096]
        a_model = self.E(torch.tensor(wav_model_prev))         # [8, 4096]
        v       = self.visual_prj(vit(frame))                 # [64, 4096]
        txt     = self.E(torch.tensor([5821]))                 # [1, 4096]「这个」

        # ② 按时间片交错拼接
        parts = [
            self.ctrl(BOV), v, self.ctrl(EOV),           # 1 + 64 + 1 = 66
            self.ctrl(BOA), a_user,  self.ctrl(EOA),     # 1 +  8 + 1 = 10
            self.ctrl(BOA), a_model, self.ctrl(EOA),     # 1 +  8 + 1 = 10
            txt,                                          # 1
        ]
        x = torch.cat(parts, dim=0)                       # [87, 4096]

        # ③ 四层身份标签（逐元素相加，不要 concat）
        type_ids = torch.tensor(
            [3] + [2]*64 + [3] +
            [3] + [1]*8  + [3] +
            [3] + [1]*8  + [3] + [0]
        )
        stream_ids = torch.tensor(
            [0] + [0]*64 + [0] +
            [0] + [0]*8  + [0] +
            [1] + [1]*8  + [1] + [1]
        )
        x = x + self.type_emb(type_ids) + self.stream_emb(stream_ids)

        # ④ 三维绝对时间位置
        pos_ids = []
        pos_ids += [(t_ms, 0, 0)]
        pos_ids += [(t_ms, h, w) for h in range(8) for w in range(8)]
        pos_ids += [(t_ms, 0, 0)]
        pos_ids += [(t_ms, 0, 0)] + [(t_ms, 0, 0)]*8 + [(t_ms, 0, 0)]
        pos_ids += [(t_ms, 0, 0)] + [(t_ms + i*10, 0, 0) for i in range(8)] + [(t_ms, 0, 0)]
        pos_ids += [(t_ms, 0, 0)]
        assert x.shape == (87, 4096) and len(pos_ids) == 87

        # ⑤ 分块因果掩码
        mask = build_chunk_causal_mask(pos_ids)
        return x.unsqueeze(0), pos_ids, mask               # [1,87,4096]
```

`assert` 那行不是装饰：87 这个数错一位，后面所有位置编码和缓存都会静默错位。

## 5.3 四层身份标签分别回答什么

| 层 | 回答问题 | 本例取值 | 漏了会怎样 |
|---|---|---|---|
| ① `type_id` | 这是什么模态 | V段=2 / A段=1 / T=0 / 控制符=3 | 投影到同一 4096 维后数值分布不足以自证来源，V[29] 和 A[67] 会混淆 |
| ② `stream_id` | 是谁说的 | V、A_user、边界符=0；A_model、T=1 | 模型把自己的输出当成用户新输入 → 无限自打断 |
| ③ 边界符 | 这一段从哪到哪 | BOV/EOV 包视觉，BOA/EOA 包两段音频 | 知道「每个向量是什么」，但不知道「一段到哪结束」，生成时切不回文本 |
| ④ `(t,h,w)` | 何时、画面哪个位置 | `pos29=(3200,3,5)`、`A=(3200,0,0)` | 动态跳帧时序号漂移，「盖子」被绑到上一帧的杯身 |

四层互不替代。这是回答「音视频怎么区分」的完整答案，而**不是**「加个 type embedding 就行」。

## 5.4 为什么 `t` 必须是绝对毫秒

Qwen2.5-Omni 的 TMRoPE 每 40ms 分配一个时间 ID；本书按 80ms 片取 `t_ms`，原理一致。三维 RoPE 把 128 维 head_dim 切成三段分别旋转：

```python
def apply_3d_rope(q, k, pos_ids, head_dim=128):
    # 分段：t 用 48 维，h/w 各 40 维（示意切法）
    t_ids = torch.tensor([p[0] // 40 for p in pos_ids])
    h_ids = torch.tensor([p[1] for p in pos_ids])
    w_ids = torch.tensor([p[2] for p in pos_ids])
    cos_t, sin_t = rope_cos_sin(t_ids, 48)
    cos_h, sin_h = rope_cos_sin(h_ids, 40)
    cos_w, sin_w = rope_cos_sin(w_ids, 40)
    q = rotate(q, torch.cat([cos_t, cos_h, cos_w], -1),
                  torch.cat([sin_t, sin_h, sin_w], -1))
    k = rotate(k, ...)
    return q, k
```

**关键：音频和文本的 `h/w` 置 0，但共享同一个 `t`**。于是「第 3 秒的画面」和「第 3 秒的音素」在位置编码上被标为同一物理瞬间，模型才知道这声「这个」配的是哪帧画面。

为什么不能用 token 序号？回到第 4 章：`t=3280ms` 画面没变化，视觉片整片跳过。此时「第 5 个视觉 token」根本不等于「第 5 个音频片」，序号随跳帧漂移，共时关系直接错乱。**绝对时间 ID 不随跳帧改变**，这是全双工里音视频对齐唯一的可靠锚。

文本与音频的 `(t,0,0)` 会撞车，靠两件事分开：`type_id` 明确不同，且文本的 `t` 用「与音频帧对齐的时间片序号」口径、音频用绝对毫秒，实现里通常再给文本单独一套位置基准。

## 5.5 分块因果掩码

```python
def build_chunk_causal_mask(pos_ids):
    L = len(pos_ids)
    t = torch.tensor([p[0] for p in pos_ids])
    mask = torch.zeros(L, L, dtype=torch.bool)
    for i in range(L):
        for j in range(L):
            if t[j] > t[i]:        # 未来片全屏蔽
                mask[i, j] = True
    return mask                    # True = 屏蔽
```

片内全互通（`t` 相同），片间只看过去。片内互通是硬要求：如果同一片里「这个」不能 attend 到 `pos29` 的金属高光，指代消解就不可能发生。

第五层隐含区分也在这里：**attention mask 决定「谁能看谁」**，是比 `type_emb` 更硬的约束。训练时 `labels` 再把输入侧连续向量位置填 `-100`，告诉 loss「这些是条件不是目标」。

## 5.6 混合方式的三条路线（选型）

| 路线 | 做法 | 融合点 | 代表 | 适合本例吗 |
|---|---|---|---|---|
| **早融合** | 投影到同一 d、拼一条序列 | 主干全部层的自注意力 | Chameleon / Qwen-Omni / 本书 | ✅ 指代消解需要深层交互 |
| **中融合** | 冻结 LLM，插 gated cross-attention | 明确的插入层 | Flamingo / LLaVA 早期 | ⚠️ 交互深度受限于插几层 |
| **晚融合** | 各编码后只在决策层拼 | 几乎无 | 简单分类/检索 | ❌ 解不开「这个」 |

早融合参数最省、上限最高，但需要海量混合数据才学得会，而且**共享参数会被多模态梯度拉扯**——这正是「文本 token 占比低于 50% 语言能力即退化」那条经验红线的架构根源。解法是结构隔离：Thinker-Talker（文本头与语音头分离）、Inner Monologue（文本流不被语音训练触碰），或 Freeze-Omni（连主干都冻结，只训适配器）。

## 5.7 四个实现坑

1. **`type_emb` 用 concat** → `[1,L,4100]` 破坏 RMSNorm 尺度与残差流，必须逐元素加。
2. **边界符靠字符串拼接** → 推理时拼个 `"<video>"` 无效，它必须是词表里有 ID、参与过训练的真 token。
3. **`h/w` 维度忘了置 0** → 音频 token 拿到随机空间坐标，跨模态旋转角不再对齐。
4. **跳帧后沿用序号位置** → 共时关系错乱，且不会报错，只会静默掉效果。

## 5.8 本章小结

- 混合 = 拼接（本章，`cat` 到 87 槽位）+ 融合（第 6 章，`Q·K`）。
- 四层标签 `type_id / stream_id / 边界符 / (t,h,w)` 缺一不可，四问互不替代。
- `t` 必须绝对毫秒；动态跳帧下序号会漂移，这是全双工唯一可靠的对齐锚。
- chunk-causal：片内全互通、片间只看过去；片内互通是指代消解的前提。
- 早/中/晚融合三选一，本例必须早融合；用结构隔离缓解文本能力退化。

> 下一章：把 `x[1,87,4096]` 送进 32 层主干，逐层写出 shape，并定位融合到底发生在 `scores[1,32,87,87]` 的哪个格子。
