# Signal 数据 schema 与内容约定

数据以 2026-10-06 快照为准。所有路径相对仓库根 `E:/workbuddy/signal/signal`。

## 一、JSON 数据文件

### content/news/news-feed.json — AI 声浪（新闻）
数组，按 `date` **正序**保存。

| 字段 | 说明 |
|---|---|
| `id` | `news-YYYY-MM-DD-N`，必须唯一，追加前查重 |
| `title` | 标题 |
| `summary` | 摘要 |
| `whyMatters` | 为什么重要 |
| `importance` | 重要度 |
| `source` | 来源名 |
| `url` | 原文链接 |
| `date` | `YYYY-MM-DD` |
| `tags` | 数组 |
| `category` | 分类 |

> 注意：现存 11 个历史重复 id（2026-05 / 06 数据），属遗留技术债，本轮新增不受影响。

### content/papers/papers-index.json — 论文库（10 字段）

```
id / title / authors / venue / category / importance / tags / hasReview / date / summary
```

| 字段 | 说明 |
|---|---|
| `id` | 小写连字符，建议带年份后缀（`rho-vla-foundation-2026`），必须唯一 |
| `title` | 论文原标题（英文） |
| `authors` | 作者串，多人用 `et al.` 省略 |
| `venue` | 发表处（`arXiv 2609.38164` / `ICLR 2026` / `CVPR 2026 Findings`） |
| `category` | ★**必须是 `categories.json` 中存在的 id** |
| `importance` | ★**只取 4 或 5**（5 最高） |
| `tags` | 数组 |
| `hasReview` | 是否有解读文章（无则 `false`） |
| `date` | `YYYY-MM` |
| `summary` | ★中文摘要，**必须写出关键数字与方法名** |

**合法 category**（`content/papers/categories.json`）：

| id | 名称 |
|---|---|
| `arch` | 模型架构 |
| `alignment` | 训练与对齐 |
| `inference` | 推理优化 |
| `data` | 数据与合成 |
| `autonomous-driving` | 自动驾驶 |
| `agent` | AI Agent |
| `hf-picks` | HF 精选 |

> ⚠️ 历史遗留：部分旧论文用了 `ad` 与 `reasoning`（不在分类表中）。**新增时不要用这两个值**。
> ⚠️ 部分早期经典论文（如 `attention-is-all-you-need`）**没有 `date` 字段**，按日期排序时会显示为 undefined，属历史遗留。

### content/papers/papers-index.json — 论文库（10 字段）

```
id / title / authors / venue / category / importance / tags / hasReview / date / summary
```

| 字段 | 说明 |
|---|---|
| `id` | 小写连字符，建议带年份后缀（`rho-vla-foundation-2026`），必须唯一 |
| `title` | 论文原标题（英文） |
| `authors` | 作者串，多人用 `et al.` 省略 |
| `venue` | 发表处（`arXiv 2609.38164` / `ICLR 2026` / `CVPR 2026 Findings`） |
| `category` | ★**必须取 `categories.json` 中存在的 id** |
| `importance` | ★**只取 4 或 5**（5 最高） |
| `hasReview` | 是否有解读文章（无则 `false`） |
| `date` | `YYYY-MM` |
| `summary` | ★中文摘要，**必须写出关键数字与方法名** |

**合法 category**（`content/papers/categories.json`）：`arch` 模型架构 ／ `alignment` 训练与对齐 ／ `inference` 推理优化 ／ `data` 数据与合成 ／ `autonomous-driving` 自动驾驶 ／ `agent` AI Agent ／ `hf-picks` HF 精选

> ⚠️ 历史遗留：部分旧论文用了 `ad` 与 `reasoning`（**不在分类表中，新增时不要用**）；部分早期经典论文（如 `attention-is-all-you-need`）**没有 `date` 字段**，按日期排序显示为 undefined。
>
> 📌 **论文库特点**：`date` 为 `YYYY-MM` 粒度（比新闻粗），且存在「有解读文章」与「仅收录」两种状态，用 `hasReview` 区分。新增时若暂无解读文章，保持 `hasReview: false`，后续补解读再翻转。

### content/gallery/models.json — 模型库（16 字段）

```
id / name / org / type / typeLabel / typeIcon / open / params
date / context / attention / factSheet / tags / keyInnovation / highlights / description
```

- **新增前先按 `id` 查重**：已存在则校正 `date` 或增强 `keyInnovation` / `highlights`，**不要重复插入**。
- `type` 有固定枚举，且配套 `typeLabel` / `typeIcon` / `attention`。新增时先复制同类条目的这几个字段，避免风格不一致。
- 现存 29 个旧 schema 条目缺字段（历史遗留，非本轮引入）。

### content/benchmarks/benchmarks.json — 排行榜（8 榜）

分类固定：`coding` / `reasoning` / `overall` / `agent` / `cost` / `autonomous-driving` / `video` / `3d`

每榜字段：`id` / `title` / `description` / `category` / `categoryName` / `categoryIcon` / `date` / `models[]`

`models[]` 每项：`rank` / `name` / `provider` / `score` / `change` / `benchmark` / `sweBenchNote`

- **刷新要点**：整榜 `date` 改成今天 → 按新分数重排 → **`rank` 必须严格 1..N 连续** → 新登顶模型要进 `overall` / `coding` 等对应榜。

### content/evolution-log.json — 进化日志

字段：`id` / `date` / `agent` / `type` / `emoji` / `title` / `detail`

- 每轮通常追加多条（`news` / `models` / `bench` / `book` / `article` 各一条），`id` 唯一。
- 现存 9 个历史重复 id（2026-04 数据，遗留）。

## 二、Markdown 内容

### 书籍
- 命名：`content/books/<slug>-book-chNN.md`（ch01 … chNN）
- 惯例 **8 章**；每个章节文件各自带完整 frontmatter
- 现有书籍（10 本）：

| slug | 主题 |
|---|---|
| `ai-native-notebook-book` | AI Native Notebook 平台架构与选型 |
| `diffusion-book` | 扩散模型 |
| `gpu-book` | GPU |
| `iceberg-raydata-vllm-book` | Iceberg + Ray Data + MLflow + vLLM 离线多模态处理优化 |
| `physical-ai-platform-book` | Physical AI 平台 |
| `ray-data-book` | Ray Data |
| `ray-triton-vs-vllm-book` | Ray Triton vs vLLM |
| `ray-vllm-optimization-book` | Ray + vLLM 参数优化深度 |
| `vector-search-sr-vs-milvus-book` | Iceberg 向量检索：StarRocks 直查内积 vs Milvus |
| `vla-world-model-training-book` | VLA 世界模型训练 |

### 文章
- `content/articles/*.md`（143 篇）

### frontmatter 模板（书籍章节）

```yaml
---
title: "第N章 · 章节名"
book: "<slug>-book"
chapter: N
description: "章节摘要——★内部禁用英文双引号，用中文「」"
date: "YYYY-MM-DD"
updatedAt: "YYYY-MM-DD"
agent: "研究员→编辑→审校员"
tags:
  - "标签1"
  - "标签2"
type: "book"
---
```

- 更新已有书章节时，同步改 `updatedAt` 并补新 tag。

## 三、编辑约定（硬性）

- **description / title 内部一律不用英文双引号 `"`**，用中文「」或全角引号。否则 YAML 解析失败 → `getAllContent` 抛错 → **首页 500**。
- commit message 惯用格式：
  - 迭代：`迭代第N轮(YYYY-MM-DD): 新闻X(+n)/模型Y(+m)/8类榜单刷新至MM-DD/进化日志Z(+k)`
  - 建书：`新建全书(YYYY-MM-DD): 书名（全8章 N行）`
  - 修复：`修复(YYYY-MM-DD): 现象与根因简述`
