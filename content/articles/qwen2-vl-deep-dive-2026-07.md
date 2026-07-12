---
title: "Qwen2-VL 论文深度解读：任意分辨率感知与多模态旋转位置编码"
category: "paper"
paper: "Qwen2-VL: Enhancing Vision-Language Model's Perception of the World at Any Resolution"
arxiv: "2409.12191"
authors: "Peng Wang, Shuai Bai, et al. (阿里巴巴 Qwen 团队)"
date: "2026-07-12"
tags:
  - "多模态"
  - "VLM"
  - "动态分辨率"
  - "M-RoPE"
  - "视频理解"
  - "论文解读"
type: "article"
---

# Qwen2-VL 论文深度解读：任意分辨率感知与多模态旋转位置编码

> 选自《Signal 论文解读》系列 · 多模态方向
> 论文：Qwen2-VL, arXiv:2409.12191（阿里 Qwen 团队，2024-09）

## 一、论文基本信息

| 项目 | 内容 |
|------|------|
| 标题 | Qwen2-VL: Enhancing Vision-Language Model's Perception of the World at Any Resolution |
| 团队 | 阿里巴巴 Qwen 团队（通义千问） |
| 发表 | 2024-09-18 初版，2024-10-03 修订 |
| 模型尺寸 | **2B / 8B / 72B** 三档 |
| 代码 | https://github.com/QwenLM/Qwen2-VL |
| 核心贡献 | Naive Dynamic Resolution（任意分辨率动态处理）+ Multimodal RoPE（M-RoPE）+ 图文视频统一范式 |

Qwen2-VL 是开源 VLM 中首个系统性解决 **"固定分辨率导致的信息损失"** 的模型。在此之前，绝大多数 VLM（包括早期 LLaVA、Qwen-VL v1）都先把图像 resize 到固定栅格（如 224/336/448），这会带来：小字被抹平、长图被压扁、文档/表格失真。Qwen2-VL 提出"**朴素动态分辨率**"，让模型直接吃原生分辨率，并配合统一的 M-RoPE 把文本/图像/视频的位置信息融合进同一个旋转编码空间。

## 二、动机：固定分辨率的代价

传统 VLM 的处理链路：

```
任意尺寸图像 → resize/crop 到固定网格(如 24×24 patch) → ViT → 固定数量 visual token
```

问题：
- **高分辨率文档**里的小字在 resize 后无法识别。
- **超宽/超长图**（如网页截图、表格）被强行压成方形，结构破坏。
- 视觉 token 数量固定，**信息密度不可调**，浪费算力或损失细节。

Qwen2-VL 的答案是：丢掉"固定网格"，让 token 数量随图像内容动态变化。

## 三、Naive Dynamic Resolution（重点 - 数据/特征管道）

### 3.1 核心机制

Qwen2-VL 不使用任何复杂的裁切/拼接策略（故称 "Naive"），而是：

1. **原生分辨率输入**：图像以其原始尺寸送进 ViT。
2. **2×2 像素混洗（pixel shuffle）**：ViT 输出的 patch 特征（每 14×14 像素一个 patch）按 2×2 邻域合并，token 数量降至 1/4。
3. **动态 token 数**：图像越大、细节越多 → 视觉 token 越多，模型自动分配更多容量。

```
原始图像 (H×W)
   │  ViT (patch_size=14)
   ▼
patch 特征图 (h=H/14, w=W/14, C)
   │  2×2 pixel shuffle (合并 4 个相邻 patch)
   ▼
视觉 token 序列 (h/2 × w/2, C')   ← 数量随分辨率动态变化
```

> 例：一张 1120×1120 的图 → ViT 输出 80×80=6400 patch → pixel shuffle 后 40×40=**1600** 视觉 token；一张 448×448 的图 → 仅 **256** token。两者信息密度自适应。

### 3.2 训练数据的分辨率分布

为了使动态分辨率真正生效，训练语料必须**覆盖从极低到极高分辨率**的图像。Qwen2-VL 在预训练阶段混合了：
- 网络图文对（自然分辨率）
- 文档/图表/网页（高分辨率，强化 OCR 与结构理解）
- 多语言文本图像（中英日韩等）

这正是"数据管道"层面的关键：光有架构不够，**训练数据的分辨率多样性决定了动态分辨率能力的上限**。

### 3.3 与 LLaVA-NeXT "任切" 的对比

| 方案 | 思路 | 优缺点 |
|------|------|--------|
| **固定分辨率**（旧 Qwen-VL / LLaVA v1） | resize 到固定网格 | 简单，但信息损失大 |
| **切片/任切**（LLaVA-NeXT, InternVL） | 大图切块 + 缩略图 | 保留细节，但 token 爆炸、拼图逻辑复杂 |
| **Naive Dynamic Res.（Qwen2-VL）** | 原生分辨率 + 2×2 shuffle | 简洁、token 自适应、无拼图负担 |

## 四、Multimodal RoPE（M-RoPE，重点）

### 4.1 为什么需要 M-RoPE

标准 RoPE（Rotary Position Embedding）只编码**一维序列位置**，适合文本。但图像是 2D、视频是 3D（时间×高×宽）。Qwen2-VL 提出 **M-RoPE**，把位置拆成三个分量分别旋转：

```
M-RoPE 位置 = (t, h, w)  三维坐标
  - 文本 token：    (t=seq_pos, h=0, w=0)   ← 退化为 1D RoPE
  - 图像 token：    (t=0,       h, w)       ← 2D 空间位置
  - 视频 token：    (t=帧号,   h, w)        ← 3D 时空位置
```

三个分量分别做旋转后相加，使**同一套位置编码能统一表达文本/图像/视频的时空结构**。

### 4.2 统一范式（图像=视频的特例）

因为 M-RoPE 天然支持 3D 位置，Qwen2-VL **用完全相同的架构处理图像和视频**：视频只是"多帧图像"，帧号填入 `t` 维度即可。无需为视频单独设计时序模块。

```python
# M-RoPE 位置构造示意
def build_mrope_positions(text_ids, image_grid, video_frames):
    pos = []
    # 文本：1D
    for i in range(len(text_ids)):
        pos.append((i, 0, 0))
    # 图像：2D (h, w)
    for (h, w) in image_grid:
        pos.append((0, h, w))
    # 视频：3D (t, h, w)
    for t in range(video_frames):
        for (h, w) in image_grid:
            pos.append((t, h, w))
    return pos   # 每维独立旋转后融合
```

## 五、模型架构

```
输入: 图像 / 视频 / 文本 (统一)
   │
   ├─ 视觉: ViT (动态分辨率 + 2×2 shuffle) → 视觉 token
   ├─ 文本: Qwen2 tokenizer → text token
   │
   ▼
M-RoPE 注入位置 (t,h,w)
   │
   ▼
Qwen2 LLM (2B/8B/72B, 因果注意力) → 输出
```

| 组件 | 说明 |
|------|------|
| 视觉编码器 | ViT（cls token 去掉，仅用 patch token），动态分辨率 |
| 位置编码 | M-RoPE（文本/图像/视频统一） |
| 语言模型 | Qwen2（2B/8B/72B），因果语言建模 |
| 训练目标 | 下一 token 预测（图文交错、视频文本交错） |

## 六、训练数据规模与组成

Qwen2-VL 在预训练阶段使用了**大规模、多语言、多分辨率**的图文数据，并在后训练阶段加入：
- **图像理解/问答**：自然图像、文档、图表、OCR
- **视频理解**：长视频（支持数小时级上下文）、视频字幕、时序推理
- **Agent / UI 操作**：屏幕截图、GUI 元素定位与操作（为后续 Qwen2-VL-72B 的"电脑操作 Agent"能力奠基）
- **多语言能力**：覆盖多种语言的图文对，强调低资源语言

论文强调通过**缩放定律（scaling law）**探索 LVLM：同时放大模型尺寸（2B→8B→72B）与训练数据量，72B 版本在多项基准上逼近 GPT-4o、Claude-3.5-Sonnet。

## 七、实验与结果

| 维度 | 结论 |
|------|------|
| **综合多模态基准** | Qwen2-VL-72B 与 GPT-4o、Claude-3.5-Sonnet 相当，超越其他通用 VLM |
| **文档/图表 OCR** | 动态分辨率带来显著长文档、小字识别优势 |
| **视频理解** | 统一范式使视频问答/字幕/长视频推理领先开源 |
| **Agent 能力** | 支持屏幕截图理解与 UI 操作，开启 GUI Agent |

## 八、与同类 VLM 对比

| 模型 | 分辨率策略 | 位置编码 | 视频 | 尺寸 |
|------|-----------|---------|------|------|
| LLaVA-1.5 | 固定 336 | 无（学习嵌入） | 有限 | 7B/13B |
| InternVL-1.5 | 切片动态 | 学习 | 支持 | 18B+ |
| **Qwen2-VL** | **Naive 动态** | **M-RoPE** | **统一3D** | **2B/8B/72B** |
| GPT-4o | 未知 | 未知 | 支持 | 闭源 |

Qwen2-VL 的差异化优势：**架构最简（无拼图）、位置编码最统一（M-RoPE 一招通吃图文视频）、尺寸最全（端侧 2B 到云端 72B）**。

## 九、局限性

1. **极高分辨率仍受限**：动态 token 数虽自适应，但超长图（如大幅工程图纸）仍可能超出上下文预算。
2. **视频帧采样策略**：长视频依赖帧采样，连续动作/高速运动可能丢帧。
3. **2B 端侧版能力**：小模型在复杂推理上仍弱于 72B。

## 十、总结

Qwen2-VL 用两个"朴素但有效"的设计——**Naive Dynamic Resolution** 与 **M-RoPE**——解决了 VLM 长期受困的"分辨率-信息损失"和"模态位置编码分裂"问题。它的工程启示是：在数据管道层面，**让训练数据自然覆盖分辨率长尾**，比在架构上做复杂裁切更本质。这与我们在《多模态数据处理》中强调的"数据多样性优先于管道复杂度"完全一致。

---

**参考资料**
- Wang et al., *Qwen2-VL: Enhancing Vision-Language Model's Perception of the World at Any Resolution*, arXiv:2409.12191.
- Qwen2-VL 代码库：https://github.com/QwenLM/Qwen2-VL
- RoPE 原始论文：Su et al., arXiv:2104.09864
