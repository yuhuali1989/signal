---
title: "多模态评测体系从入门到精通 - 第4章: 自动评测指标"
book: "多模态评测体系从入门到精通"
chapter: "4"
chapterTitle: "自动评测指标"
description: "文本生成指标(BLEU/ROUGE/METEOR/CIDEr/SPICE)、图像质量指标(FID/CLIP Score/Aesthetic)、视频指标(FVD/VBench)、评测指标的选择与陷阱"
date: "2026-06-19"
updatedAt: "2026-06-19 09:30"
agent: "研究员→编辑→审校员"
tags:
  - "自动指标"
  - "BLEU"
  - "FID"
  - "CLIP Score"
  - "FVD"
type: "book"
---

# 第 4 章：自动评测指标

> 选自《多模态评测体系从入门到精通》

## 4.1 文本生成指标

用于评测 VLM 文本输出（图像描述、VQA 回答、对话回复）与参考答案之间的匹配度。

### 4.1.1 n-gram 匹配类指标

| 指标 | 原理 | 评分范围 | 优点 | 致命缺陷 |
|------|------|---------|------|---------|
| **BLEU** | n-gram 精确率（n=1-4） | 0-100 | 实现简单，与人类判断中等相关 | 惩罚同义表达，偏向短n-gram |
| **ROUGE-L** | 最长公共子序列F1 | 0-100 | 关注召回率，适合摘要 | 不处理同义词 |
| **METEOR** | 显式同义词匹配+词干 | 0-100 | 处理同义表达，更高的人类相关性 | 依赖词库 |
| **CIDEr** | TF-IDF 加权的 n-gram | 0-∞ | 降低高频词权重，区分度更好 | 计算复杂度高 |
| **SPICE** | 场景图语义匹配 | 0-100 | 关注语义而非字词 | 依赖场景图解析器 |

```python
# COCO Caption 标准评测
# 核心：用 5 个参考描述综合评判
def coco_eval(model_caption, reference_captions):
    """
    COCO Caption 评测器
    
    reference_captions 包含 5 个人工标注的参考描述
    这是多模态评测中"真值多样性"的经典设计
    """
    # BLEU-4
    bleu4 = nltk.translate.bleu_score.sentence_bleu(
        reference_captions, model_caption,
        weights=(0.25, 0.25, 0.25, 0.25)
    )
    
    # CIDEr（推荐，与人类判断相关性最高）
    cider = compute_cider(model_caption, reference_captions)
    
    # SPICE（语义匹配）
    spice = compute_spice(model_caption, reference_captions)
    
    return {"BLEU-4": bleu4, "CIDEr": cider, "SPICE": spice}
```

**指标间对比**：
| 指标 | 与人类相关性 | 对语义同义容忍度 | 对语法错误敏感度 |
|------|------------|----------------|----------------|
| BLEU-4 | 0.25-0.35 | 低 | 中 |
| ROUGE-L | 0.30-0.40 | 低 | 低 |
| METEOR | 0.40-0.50 | 中 | 中 |
| CIDEr | 0.45-0.55 | 低 | 中 |
| SPICE | 0.40-0.50 | **高** | 低 |

### 4.1.2 基于嵌入的语义指标

n-gram 指标的局限催生了基于语义嵌入的指标：

```python
# CLIPScore（图文相关性）
from transformers import CLIPModel, CLIPProcessor

def clip_score(image, caption):
    """
    图文相关性评分（0-100）
    不需要参考真值！完全基于模型输出与图像的匹配度
    """
    model = CLIPModel.from_pretrained("openai/clip-vit-large-patch14")
    processor = CLIPProcessor.from_pretrained("openai/clip-vit-large-patch14")
    
    inputs = processor(text=caption, images=image, return_tensors="pt")
    outputs = model(**inputs)
    logits = outputs.logits_per_image.item()  # 越大越匹配
    
    return logits

# RefCLIPScore（带参考的版本）
def refclip_score(caption, reference_caption, image):
    """
    结合图文相似度和文本相似度
    """
    clip_sim = image_caption_similarity(image, caption)
    text_sim = text_similarity(caption, reference_caption)
    return 0.5 * clip_sim + 0.5 * text_sim
```

## 4.2 图像生成指标

### 4.2.1 FID (Fréchet Inception Distance)

FID 是图像生成领域最核心的评测指标：

```
原理：在 Inception 特征空间中，
      比较真实图像分布和生成图像分布的 Frechet 距离

公式：FID = ||μ_r - μ_g||² + Tr(Σ_r + Σ_g - 2(Σ_r·Σ_g)^(1/2))

其中 μ_r, Σ_r = 真实图像的特征均值和协方差
     μ_g, Σ_g = 生成图像的特征均值和协方差

FID 越低越好（分布越接近）
```

**FID 的真值依赖**：
```
FID 的"真值"不是单张图的参考图像，而是：
    真实图像集合的 统计分布参数（μ_r, Σ_r）

这意味着：FID 需要大量真实图像作为参考集合，而不是单张参考图

典型计算方式：
┌─────────────┐     ┌─────────────┐
│ 50K 真实图像  │     │ 50K 生成图像  │
│ ↓ Inception  │     │ ↓ Inception  │
│ μ_r, Σ_r     │ ←── │ μ_g, Σ_g     │
└─────────────┘     └─────────────┘
        → FID = distance(μ_r, Σ_r, μ_g, Σ_g)
```

**FID 的陷阱**：

| 问题 | 原因 | 影响 |
|------|------|------|
| **采样不足** | FID 在 <10K 样本时方差大 | 不可靠的排行榜 |
| **作弊** | 生成图像可以过拟合 FID | 指标刷榜 |
| **领域差异** | ImageNet Inception 统计≠所有领域 | 跨领域比较无意义 |
| **分辨率不匹配** | Inception 输入 299×299 | 下采样丢失细节 |

### 4.2.2 CLIP Score（文生图）

```python
def text_to_image_clip_score(prompts, generated_images):
    """
    文生图评测：生成图像与 prompt 的语义匹配度
    
    注意：这不需要参考图像！真值就是 prompt 本身
    """
    model = CLIPModel.from_pretrained("openai/clip-vit-large-patch14")
    scores = []
    
    for prompt, image in zip(prompts, generated_images):
        inputs = processor(
            text=prompt, images=image, 
            return_tensors="pt", padding=True
        )
        outputs = model(**inputs)
        # logits_per_image: 图文匹配度
        scores.append(outputs.logits_per_image.item())
    
    return np.mean(scores)

# 常见问题：CLIP Score 容易被"好看但不准确"的图像欺骗
# 高色彩饱和度 + 清晰构图 → CLIP Score 虚高
```

### 4.2.3 Aesthetic Score（美学评分）

```python
# LAION Aesthetic Predictor
# 真值来源：人类对图像的美学偏好打分（1-10）
# 训练一个回归模型来预测美学分数

def aesthetic_score(image):
    """
    基于 LAION 美学预测器
    真值：5K 人类标注的美学偏好分数
    """
    # 使用预训练的美学预测模型
    score = aesthetic_model.predict(image)
    # 分数范围 1.0 (最丑) ~ 10.0 (最美)
    return score
```

## 4.3 视频生成指标

### 4.3.1 FVD (Fréchet Video Distance)

FVD 是 FID 的视频扩展版：

| 维度 | FID | FVD |
|------|-----|-----|
| 输入 | 单帧图像 | 视频片段 (16帧) |
| 特征提取器 | Inception v3 | I3D (3D Conv) |
| 比较方式 | 分布距离 | 时空分布距离 |
| 计算量 | 低 | 高（16×计算量） |

### 4.3.2 VBench 指标体系

VBench 将视频生成质量分解为 16 个自动指标：

| 指标类别 | 具体指标 | 真值来源 |
|---------|---------|---------|
| **技术质量** | 帧一致性、运动平滑度、清晰度 | 无参考（内置算法） |
| **语义质量** | 文本跟随、场景连贯性 | prompt 对照 |
| **人类偏好** | 整体质量、偏好度 | 人类评分→评分模型 |

```python
# VBench 的"伪真值"设计
class VBenchEvaluator:
    """
    VBench 的独特之处：真值是隐式的
    
    1. 技术质量（如帧一致性）→ 纯算法计算，不需要真值
    2. 语义质量 → 用 CLIP 比较每帧和 prompt 的匹配度
    3. 人类偏好 → 预训练的评分模型（基于人类标注）
    """
    def evaluate_consistency(self, video_frames):
        """
        帧一致性：相邻帧的光流相似度
        不需要任何真值
        """
        consistency_scores = []
        for i in range(len(video_frames) - 1):
            flow = compute_optical_flow(video_frames[i], video_frames[i+1])
            consistency_scores.append(flow_magnitude_variance(flow))
        return np.mean(consistency_scores)
```

## 4.4 指标选择指南

### 指标间相关性矩阵（与人类判断的相关性）

```
          BLEU ROUGE METEOR CIDEr SPICE CLIPScore FID
BLEU      1.00  0.85   0.78  0.82  0.65   0.30    -0.20
ROUGE     0.85  1.00   0.82  0.80  0.70   0.35    -0.22
METEOR    0.78  0.82   1.00  0.76  0.75   0.40    -0.25
CIDEr     0.82  0.80   0.76  1.00  0.78   0.38    -0.23
SPICE     0.65  0.70   0.75  0.78  1.00   0.50    -0.30
CLIPScore 0.30  0.35   0.40  0.38  0.50   1.00    -0.45
FID      -0.20 -0.22  -0.25 -0.23 -0.30  -0.45     1.00
```

### 选型决策树

```
评测任务是什么？
    │
    ├── 文本生成（图像描述/VQA）
    │       ├── 有 5 个参考描述 → CIDEr + SPICE
    │       └── 只有 1 个参考  → CLIPScore + METEOR
    │
    ├── 图像生成
    │       ├── 有真实图像集合 → FID (需要50K+样本)
    │       ├── 无参考图像     → CLIP Score + Aesthetic
    │       └── 细粒度组合性    → T2I-CompBench 指标
    │
    └── 视频生成
            ├── 有真实视频  → FVD + CLIP Temporal
            └── 无参考      → VBench 全指标
```

---

*本章由 Signal 知识平台 AI 智能体自动生成并持续修订。最后更新：2026-06-19*
