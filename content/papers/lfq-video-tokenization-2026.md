---
title: "LFQ 视频 tokenizer 精读：有 ID 空间，却没有一张可查的表"
authors: "Google DeepMind / CofeAI（O2-MAGVIT2 开源实现）"
venue: "arXiv 2026"
date: "2026-11-14"
tags:
  - "视频 tokenizer"
  - "LFQ"
  - "码本坍缩"
  - "因果卷积"
  - "统一词表"
tldr: "传统 VQ 的最近邻查表 + 直通估计器让 8192 个码里大半变成死码，逐帧 argmin 还会让同一物理高光在相邻帧跳到不同码上造成闪烁。LFQ 把量化改成按通道二值化，18 bit 直接给出 262144 个 ID 空间且没有可学习的码本表；配合 3D 因果时空 CNN，Kinetics-600 帧预测 FVD 从 11.6 降到 5.2。★代价是统一词表装不下：26 万视觉 ID 塞进 7.5 万级表会让输出头涨到约 2.6GB。"
importance: 5
---

# LFQ 视频 tokenizer 精读：有 ID 空间，却没有一张可查的表

## TL;DR

「视频有没有词表」这个问题，在 2026 年被证明是个**歧义问题**：得先问是哪一种词表。LFQ（Lookup-Free Quantization）给出的答案最反直觉——**它有 `2^18 = 262144` 个 ID 空间，却压根没有一张 `nn.Embedding` 可查**。

本文拆三件事：

1. 为 2D 单帧重建训出来的 VQ-GAN 码本，为什么原样搬到视频会翻车（五个硬伤）；
2. LFQ + 3D 因果时空 tokenizer 怎么同时解决死码、闪烁与因果泄漏；
3. 为什么「解决了码本」反而制造了一个更大的工程冲突：**输出头参数账**。

---

## 一、背景：先把「词表」这个词拆成三种

| | 长什么样 | 谁在用 |
|---|---|---|
| ① **主干 embedding 表** | `nn.Embedding(V, d)`，ID 进 Transformer | 文本必有；**Emu3 的视频也有** |
| ② **量化码本 codebook** | VQ / FSQ / LFQ 的整数集，主要喂 decoder 重建 | MAGVIT、Cosmos DV、C-ViViT |
| ③ **连续投影的「无限词表」** | `Conv2d` 把任意 patch 映射成 `[d]` 浮点向量 | ViT + projector（LLaVA / Qwen-VL） |

`transformers` 官方 Emu3 文档是最硬的证据：`Emu3VQVAEConfig(codebook_size=32768, embed_dim=4, temporal_downsample_factor=4)` 与 `Emu3TextConfig(vocab_size=184622)`，**4×512×512 视频 → 4096 个离散 token，直接进 `input_ids` 查主干表**。所以「视频输入不查表」只是**一条路线的设计选择**，不是普适定律。

> ★正确判据不是「这个模态要被采样吗」，而是两问：**token 离散还是连续？ID 查主干还是只喂 decoder？** 由此得到 A 连续投影 / B 统一离散 / C 离散只给 decoder / D 连续 latent + DiT 四种组合。

---

## 二、原版 VQ-GAN 词表搬去视频的五个硬伤

### 2.1 二维的，没有时间维 → 闪烁

VQ-GAN 每帧独立做 `argmin`。用站内《全双工全模态工程全书》那个金属保温杯例子：

```
t=3200 帧　杯身高光 → ID 67102
t=3280 帧　反光角变了 2° → ID 67441   ← 最近邻跳到另一个码
t=3360 帧　又转回来   → ID 67102
```

同一个物理高光在三个码之间来回跳，重建出来就是忽明忽暗的 flicker / color jitter。Phenaki 的对照实验给了量化结果：**逐帧 VQGAN 重建 FVD 306.1，时序感知的 C-ViViT 是 65.78，差 4.7 倍**——注意这不是生成模型不行，是 tokenizer 本身在重建指标上就输了。

> 关键判断：**平滑是「码空间里轨迹」的性质，不是「单个码」的性质**。单帧重建得再像，也保证不了连续帧走在一条平滑轨迹上。

### 2.2 码本坍缩：8192 里大半是死码

最近邻查找 + 直通估计器（STE）导致只有被选中的少数码收到梯度，其余永远不更新。搬进统一词表后果很直接：

- `logits[75840]` 里 8192 个视觉位置大半永远采不到，白白占着 softmax 维度与输出头参数；
- 有效词表只有几百级 → 语义粒度太粗，「金属拉丝」和「镜面抛光」被迫共用一个码。

把词表做大呢？传统 VQ **越大越坍缩**，这就是死循环。

### 2.3 非因果：双向 CNN 偷看未来帧

普通 VQ-GAN 是 2D 双向卷积；即便改成 3D，非因果感受野仍会把「被 mask 的真值」泄进条件帧的 token，破坏掩码预测训练（MAGVIT 得专门加 COMMIT 打补丁）。换成**因果 3D 卷积**后，Kinetics-600 帧预测 FVD 从 **11.6±0.6 降到 5.2±0.2，误差降 2.2×**。对流式/全双工这是硬门槛：latent 里只要混进未来帧，边看边说就无从谈起。

### 2.4 token 预算直接爆掉

```
VQ-GAN：32×32 = 1024 token/帧
24 fps → 24576 token/秒
全双工一片 160ms 只有约 7 个槽位（Higgs 口径）
```

一片连两帧都装不下。3D 时空 tokenizer 用**时间 4× + 空间 8×8** 压缩（81 帧 → 21 个 latent 帧）才把量级压到能进时间片。

### 2.5 训练目标错配：为重建优化 ≠ 为预测优化

VQ-GAN 码本被 `L1 + 感知 loss + 对抗 loss` 训出来，目标是「解码回去像原图」。但统一词表里的视觉 ID 是被 LLM 做 next-token 预测的，需要的是「码与码之间有可学的语义结构、可预测」。解法与音频侧 Mimi 用 WavLM 蒸馏第一层语义码一模一样：**给视觉码本加语义监督 / 与 LLM 联合训练**，或者让码本身自带结构。

---

## 三、核心方法：LFQ 把「查表」这件事删掉

### 3.1 从 argmin 到按通道二值化

```python
# 传统 VQ：最近邻查一张可学习的表
def vq_quantize(z_e, codebook):                 # codebook: [K, D] 可学习参数
    dist = (z_e.unsqueeze(-2) - codebook).pow(2).sum(-1)
    ids = dist.argmin(-1)                       # 只有被选中的 code 收到梯度
    z_q = codebook[ids]
    return ids, z_q                             # 查表 + STE → 死码

# LFQ：没有表，18 个通道各出一个 bit
def lfq_quantize(z):                            # z: [..., 18]
    bits = (z > 0).long()                       # 每通道二值化
    ids = sum(b << i for i, b in enumerate(bits))   # 0 .. 2^18-1 = 262143
    z_q = (bits.float() * 2 - 1)                # 重建值由 bit 直接给出
    return ids, z_q                             # ★无 nn.Embedding，无 codebook
```

三个直接后果：

1. **没有死码**：每个 bit 都由对应通道的符号决定，不存在「永远不被选中」的条目；
2. **词表可以很大**：18 bit 天然是 `2^18 = 262144`，扩展只需加通道，不会加剧坍缩；
3. **梯度路径干净**：不需要 STE 绕过不可导的 argmin，二值化的梯度可用常规近似处理。

FSQ（有限标量量化）、IBQ、Infinity 的 bitwise 路线同理，能稳定做到 10 万~26 万级 ID 空间且保持高利用率。Cosmos Tokenizer 则同时提供**离散版 FSQ ~64K** 与**连续版 `C=16`** 两种配置，`CV4×8×8 / CV8×8×8 / DV8×16×16` 覆盖不同压缩比，720×1280 编码耗时 34.8ms。

### 3.2 3D 因果时空压缩

```python
# 原样 VQ-GAN：逐帧、2D、非因果
ids = vqgan.encode(frame)              # [1024] 每帧独立 argmin
# 24 帧 → [24, 1024] = 24576 个 ID

# LFQ + 3D 因果 tokenizer
z   = causal_conv3d_encoder(video)     # [21, 56, 56, 16]   T 81→21，空间 /8
ids = lfq_quantize(z[..., :18])        # [21, 56, 56]      每个是 0..262143 的整数
# 掩码：t 只 attend t-1 及更早

# 连续 latent 路线（Wan / Sora）：根本没有 ID
z = causal_vae.encode(video)           # [21, 56, 56, 16] 浮点
frames = dit_flow_matching(z, text)    # 流匹配采样，没有 softmax
```

「有 ID 空间但没有表」还有个容易被忽略的好处：**ID 本身携带结构**。bit 位与语义属性可以有对应关系，next-token 预测比「随机编号的 8192 个码」好学。

---

## 四、关键实验结果

| 对照 | 指标 | 数值 |
|---|---|---|
| 逐帧 VQGAN（重建） | FVD | **306.1** |
| C-ViViT（时序感知） | FVD | **65.78**（4.7× 差距） |
| 非因果 3D tokenizer（K600 帧预测） | FVD | 11.6±0.6 |
| **因果 3D tokenizer（K600 帧预测）** | FVD | **5.2±0.2**（误差降 2.2×） |
| MAGVIT-v1 码本 | 规模 | 1024 |
| C-ViViT | 规模 | 8192 / dim 32 |
| **MAGVIT-v2 / O2-MAGVIT2（LFQ）** | 规模 | **262144（无查表）** |
| Cosmos Tokenizer 离散版 | 规模 | FSQ ~64K |

`CofeAI/O2-MAGVIT2-preview`（Apache-2.0，0.4B）是这条路线在 Hugging Face 上可直接核查的开源实现。

---

## 五、工程冲突：词表变大了，输出头装不下

这是全文最该带走的账。统一词表路线的输出头是 `Linear(d, V)`：

| 方案 | 视觉 ID 数 | 统一词表 V | 输出头参数（bf16） |
|---|---|---|---|
| 站内教学基准 | 8192 | 75840 | `75840 × 4096 × 2B ≈ 621 MB` |
| MAGVIT-v2 / LFQ | **262144** | 约 32 万 | **约 2.6 GB**，仅一个 head |

把 262144 个视觉 ID 塞进 75840 的统一表，逻辑上就不成立。三条出路：

1. **分区扩容**：把 V 扩到 30 万+，head 与 embedding 都涨约 4 倍，训练成本显著上升；
2. **独立输出头**：视觉走单独一个 262144 分类头 + 路由，主干词表保持 75840（牺牲跨模态分数可比性）；
3. **RVQ / 分层码本折中**：像音频那样用几层小码本叠出大组合空间，ID 数不变但表达力上去。

> 这也解释了为什么量产全双工（Higgs、Qwen3.9-Omni）在**输出侧走连续 latent + 独立 decoder**：不是离散做不了，是统一 softmax 的规模账算不过来。

---

## 六、创新点与局限

**创新点**

- 把「扩词表」与「码本坍缩」解耦：不再靠更大的可学习表，而是靠无表的组合编码空间；
- 量化与因果性一起设计：3D 因果卷积保证 latent 不含未来帧，流式生成才成立；
- 时间与空间联合压缩，把 24fps × 1024 token 压到能进实时时间片的量级。

**局限**

- **LFQ 只解决码本，不解决训练目标错配**：码仍为重建优化，若要做统一 next-token 预测仍需语义蒸馏或联合训练；
- **262144 的 ID 空间对统一词表不友好**，需要额外的架构妥协；
- **理解侧根本不需要它**：视频作为输入时用 ViT 连续向量更保真，量化纯亏（丢细节 + 白训码本）。站内《全双工全模态工程全书》ch12 已就这一点做过全书校准；
- 音频侧 Mimi 的 split-RVQ（1 语义 + 7 声学）说明「分层」还有另一条路，LFQ 不是唯一解。

---

## 七、工程选型表

| 场景 | 推荐 | 理由 |
|---|---|---|
| 静态图 / 半双工异步出图 | 原样 VQ-GAN 够用 | 无时序一致性问题，8192 码本成熟 |
| 长视频生成 / 流式 / 全双工 | **3D 因果 + LFQ（或 FSQ）** | 无死码、无未来泄漏、时间压缩到位 |
| 画质优先、不与文本统一采样 | **连续 latent + DiT**（Wan2.6 / Sora） | 无量化误差，流匹配采样 |
| 多模态理解（视频是输入） | **连续 embedding + 绝对时间 ID** | 不需要词表，不量化 |
| 统一自回归（文本图像视频同空间） | Emu3 式统一离散 + 分区扩容 / 独立头 | 必须解决 head 膨胀 |

**一句话**：LFQ 的价值不是「把词表做大」，而是**把「词表」从一张必须训练的表，变成一个可以自由组合的编码空间**。它顺带证明了「视频有没有词表」问错了方向——该问的是：**要不要一个统一的离散符号空间，以及这个空间由谁来付 softmax 的账**。

---

## 参考资源

- 站内《全双工全模态工程全书》ch08（VQ decoder 出画面）、ch12（词表再校准：三种含义与 A/B/C/D 四种组合）
- 站内文章 `content/articles/trillion-scale-clip-vector-retrieval-2026-09.md`（理解侧连续向量）
- Hugging Face：`transformers` Emu3 model doc（184622）、`CofeAI/O2-MAGVIT2-preview`（Apache-2.0）、NVIDIA Cosmos Tokenizer
- 相关系统：MAGVIT-v1/v2、C-ViViT、Phenaki、Chameleon、Emu3、Wan2.6
