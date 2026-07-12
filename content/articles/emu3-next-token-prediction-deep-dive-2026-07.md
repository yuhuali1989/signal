---
title: "Emu3 论文深度解读：Next-Token Prediction 一统文本、图像与视频生成"
category: "paper"
paper: "Emu3: Next-Token Prediction is All You Need"
arxiv: "2409.18869"
authors: "Xinlong Wang, Xiaosong Zhang, Tiejun Huang, Zhongyuan Wang, et al. (BAAI 智源研究院)"
date: "2026-07-12"
tags:
  - "多模态生成"
  - "世界模型"
  - "基础模型"
  - "Next-Token"
  - "统一token化"
  - "智源"
  - "论文解读"
type: "article"
---

# Emu3 论文深度解读：Next-Token Prediction 一统文本、图像与视频生成

> 选自《Signal 论文解读》系列 · 多模态生成基模方向
> 论文：Emu3: Next-Token Prediction is All You Need, arXiv:2409.18869（BAAI 智源研究院, 2024-09）
> 一句话概括：把图像、文本、视频全都变成 token，一个 Transformer 从头预测下一个 token，就够了

## 一、一场关于「多模态该用什么范式」的豪赌

2024 年，多模态生成的天下由两类方法瓜分：
- **Diffusion 模型**（Stable Diffusion、SDXL）统治图像生成；
- **组合式方法**（CLIP + LLM，如 LLaVA）统治多模态理解。

Next-Token Prediction（NTP）——这个把 LLM 推上 AGI 之路的范式——在多模态领域却一直「打不过」。Emu3 的标题就是一句宣战：**Next-Token Prediction is All You Need**。

它的赌注是：**只要把图像、文本、视频都 tokenize 成离散 token，用一个从头训练的 Transformer 做纯粹的 next-token 预测，就能在生成和感知两端同时超越 SDXL 和 LLaVA-1.6**——不需要 Diffusion，不需要 CLIP 组合，甚至不需要 Diffusion 的 U-Net。

结果：**赌赢了**。Emu3 在图像生成上超过 SDXL，在多模态理解上超过 LLaVA-1.6，还能通过预测视频序列的下一个 token 生成高保真视频。

---

## 二、核心思想：万物皆 token

Emu3 把复杂的多模态模型设计，收敛到一个极简的焦点上——**token**。

### 2.1 视觉 Tokenizer

- 把图像和视频**在时空维度上 tokenize 成离散空间**。
- 训练一个专用的视觉 tokenizer，将视觉信号压缩为离散 ID，和文本 token 拼进同一个词表空间。
- 这样，一段「文本 + 图像 + 视频」的多模态数据，就变成了一条**单一的离散 token 序列**。

### 2.2 单一 Transformer，从头训练

- **不复用现成 LLM**，而是在多模态 token 序列的混合上**从头（from scratch）训练一个 Transformer**。
- 训练目标只有一个：**预测下一个 token**（标准的交叉熵损失）。
- 无论是「文本→图像」（生成）还是「图像→文本」（理解），本质都是同一件事：给定前缀 token，预测后续 token。

```
文生图:   [文本tokens] → [图像tokens]        (预测图像token)
图生文:   [图像tokens] → [文本tokens]        (预测文本token)
文生视频: [文本tokens] → [视频帧token序列]    (逐帧预测下一token)
```

这种统一的优雅在于：**训练和推理的扩展性（scaling）完全对齐 LLM 的成熟经验**——同一套并行策略、同一套 KV Cache、同一套 scaling law，都能直接迁移过来。

---

## 三、为什么这件事以前做不好，Emu3 做成了

NTP 在多模态上长期落后，核心难点有三，Emu3 逐一破解：

| 难点 | 传统问题 | Emu3 的解法 |
|------|---------|-------------|
| **视觉离散化损失** | VQ 压缩丢细节，生成糊 | 高质量视觉 tokenizer，重建保真度足够高 |
| **序列过长** | 图像/视频 token 太多，训不动 | 合理的时空压缩率，控制序列长度 |
| **理解生成难兼顾** | 一个范式两头难平衡 | 统一 token 序列 + 数据混合配比 |

关键在于：**当视觉 tokenizer 足够好、数据混合足够合理时，NTP 的简洁性就从劣势变成了压倒性优势**——因为它能无缝继承 LLM 十年积累的全部工程红利。

---

## 四、数据管道：多模态序列的混合训练

Emu3 的训练数据是**文本、图像、视频三种模态的 token 序列混合**。数据管道的核心是：

1. **各模态独立 tokenize**：文本用 BPE，图像/视频用视觉 tokenizer，映射到统一词表。
2. **构造混合序列**：把不同模态、不同任务（生成/理解）的样本编织成统一格式的 token 流。
3. **配比控制**：通过调整文本/图像/视频数据的比例，平衡模型的语言能力、生成能力和感知能力——这与 Janus-Pro 的「数据配比即性能」异曲同工。

对视频而言，一段视频被 tokenize 成「按时间展开的 token 序列」，生成视频 = **逐 token 预测下一帧内容**。这让 Emu3 天然具备了「世界模型」的雏形：它在学习「给定过去的视觉 token，未来的视觉 token 会是什么」——这正是世界模型的核心命题。

---

## 五、评测结果：一个范式，两端超越

| 任务 | Emu3 表现 |
|------|-----------|
| 图像生成 | **超越 SDXL**（专用扩散模型） |
| 多模态理解 | **超越 LLaVA-1.6**（CLIP + LLM 组合） |
| 视频生成 | 可通过 next-token 预测生成高保真视频 |

一个从头训练的纯 NTP 模型，同时打赢了图像生成和多模态理解两个赛道的旗舰专用模型——这在 2024 年是相当震撼的结论，它为「统一多模态基模」提供了最激进也最干净的答案。

---

## 六、Emu3 vs Janus-Pro vs Cosmos：三种统一范式对照

结合本系列的另外两篇解读，可以看清「多模态生成/世界基模」的三种代表性路线：

| 模型 | 范式 | 视觉表示 | 定位 |
|------|------|---------|------|
| **Emu3** | 纯 Next-Token（AR） | 单一离散 token | 极简统一，一个词表打天下 |
| **Janus-Pro** | 解耦编码（AR） | 理解 SigLIP + 生成 VQ | 理解生成解耦，两端都强 |
| **Cosmos** | Diffusion + AR 双路线 | 连续 CV + 离散 DV | 物理世界基模，服务具身智能 |

- **Emu3** 押注「简洁性 × 可扩展性」，相信 scaling 能解决一切；
- **Janus-Pro** 押注「解耦」化解表示冲突；
- **Cosmos** 押注「物理真实性」，把世界模型作为 Physical AI 的数字孪生地基。

三者共享一个底层信念：**多模态的未来，是把一切压成 token / latent，交给一个统一模型去建模世界的分布**。

---

## 七、对工程团队的启示

1. **万物皆 token 是最省心的统一范式**：一旦视觉被离散化，LLM 的全套工程基建（并行、KV Cache、scaling law）可直接复用。
2. **视觉 tokenizer 决定上限**：NTP 能否成功，重建保真度和压缩率是命门——这与 Cosmos 的结论完全一致。
3. **数据配比即能力配比**：文本/图像/视频的混合比例，直接决定模型偏语言还是偏生成。
4. **视频 NTP = 世界模型雏形**：逐 token 预测未来帧，本质就是在学习世界的时序动态。
5. **简洁的架构更利于 scaling**：越少的特殊设计，越容易随算力和数据规模持续变强。

---

*本文由 Signal 知识平台 AI 智能体自动生成并持续修订。最后更新：2026-07-12*
