---
title: "Iceberg + Ray Data + MLflow + vLLM 离线多模态处理优化全书 - 第1章: 场景定义与整体架构"
book: "Iceberg + Ray Data + MLflow + vLLM 离线多模态处理优化全书"
chapter: "1"
chapterTitle: "场景定义与整体架构：从一张 Iceberg 表到另一张 Iceberg 表"
description: "定义「Iceberg 源表（OSS 路径列）→ Ray Data 调度 → MLflow PyFunc 模型（数据处理 + vLLM 离线推理）→ Iceberg 目标表」这一端到端生产场景，拆解四层职责与优化维度总览"
date: "2026-09-18"
updatedAt: "2026-09-18"
agent: "研究员→编辑→审校员"
tags:
  - "Iceberg"
  - "Ray Data"
  - "MLflow"
  - "vLLM"
  - "离线推理"
  - "多模态"
type: "book"
---

## 1.1 场景：一句话定义

有一张 **Iceberg 源表**，其中一列存放 **OSS（对象存储）上图片或视频的路径**；我们要用一个**离线批处理任务**把这些多模态数据读出来、跑一遍 **VLM 推理**（如生成 caption），再把结果**写回另一张 Iceberg 表**。

这个场景在 2026 年非常典型：

- 自动驾驶 / VLA 训练数据的**重标注（Re-captioning）**
- 电商商品图 / 短视频的**批量理解与打标**
- 物联网端侧回传图片/视频的**内容结构化**
- 多模态训练语料的**离线清洗与标注**

它的本质是**一条离线数据闭环**：结构化的"指针"存在表里，非结构化的"实体"存在对象存储上。

## 1.2 为什么是"指针表 + 对象存储"

Iceberg 是**表格式**，管的是结构化列存（Parquet）。把图片/视频原始字节塞进 Parquet 列是错的做法——没有剪枝、没有统计、没有压缩收益，还会拖垮整个表的扫描。

标准模式是 **pointer table**：

| 层 | 存什么 | 技术 |
|---|---|---|
| 元数据 + 路径 | 图片/视频的 URI、时间戳、来源、标签、业务 ID | **Iceberg 表**（可查询、可剪枝、可 join） |
| 实体文件 | 图片/视频原始字节 | **OSS / S3**（原生格式，成本最优） |

代价是**两者没有事务联动**：删表里的行不会删对象，搬对象不会改指针。这是可接受的——用"先写对象、再写表"的顺序 + 定期 GC 兜底即可。

## 1.3 整体架构与数据流

```text
┌─ Iceberg 源表 ──────────────┐
│ id | oss_path | meta...     │  ← 结构化指针 + 元数据
└──────────┬──────────────────┘
           │ Ray Data 读表（分片/调度/容错）
           ▼
┌─ Ray Data 流水线 ───────────┐
│ ① 读 Iceberg（投影/谓词下推）│
│ ② repartition 切块          │
│ ③ 调 MLflow PyFunc 模型     │──→ MLflow Tracking（参数/指标/血缘，旁路）
└──────────┬──────────────────┘
           ▼
┌─ MLflow PyFunc Model ───────┐
│ ・拉取 OSS 图片/视频        │  ← CPU 密集（解码/resize）
│ ・预处理（解码/归一化）     │
│ ・vLLM 离线推理（caption）  │  ← GPU 密集
└──────────┬──────────────────┘
           ▼
┌─ Iceberg 目标表 ────────────┐
│ id | caption | model_ver... │  ← 结果 + 溯源列
└─────────────────────────────┘
```

## 1.4 四层职责划分（优化前必须先看清边界）

| 层 | 组件 | 职责 | 优化关键词 |
|---|---|---|---|
| **存储/真源** | Iceberg（源表 + 目标表） | 存指针、存结果、快照隔离、schema 演进 | 分区、投影下推、增量读、小文件 |
| **调度/数据** | Ray Data | 分片、调度、CPU 预处理并行、容错重试 | `repartition`、任务粒度、批处理参数 |
| **模型/逻辑** | MLflow PyFunc Model | 封装"数据处理 + vLLM 推理"的完整逻辑 | 生命周期、batch 接口、模型版本治理 |
| **计算/GPU** | vLLM | 连续批处理 + PagedAttention 推理 | `max_num_seqs`、`max_num_batched_tokens`、显存 |

**关键点**：MLflow 在这一架构里承担**双重身份**——

1. **模型载体**（PyFunc Model）：把"OSS 拉取 + 预处理 + vLLM 推理"打包成一个可版本化、可注册的产物；
2. **观测与治理层**（Tracking）：记录参数、系统指标、质量指标、产物血缘。

而 Tracking 是**旁路**，不在数据通路上——MLflow 挂掉不影响推理跑完，只是丢记录。

## 1.5 为什么用 MLflow PyFunc 封装（而不是裸脚本）

很多团队的第一个版本是"一个 Python 脚本 + 一堆参数"，跑通就上线。但它撑不住生产：

| 裸脚本 | **MLflow PyFunc Model** |
|---|---|
| 逻辑散落在脚本里，无法版本化 | 逻辑 + 依赖打包成模型，有版本号 |
| 换模型/换 prompt 要改代码 | Registry 里切 `models:/name@champion` 即可 |
| 无法回答"这批结果是谁生成的" | run_id + 模型版本 + 数据集版本完整溯源 |
| 复用困难（换个任务要复制粘贴） | 同一模型可被不同 Ray Data 任务加载 |
| 依赖环境靠口述 | conda/pip 依赖随模型固化 |

**一句话**：PyFunc 把"处理逻辑"变成了一个**有版本、可注册、可复现的资产**，这正是数据闭环里最值钱的部分——你不仅要产出 caption，还要能回答"这批 caption 是哪个模型、哪个版本、什么参数生成的"。

## 1.6 PyFunc 模型内部结构（本书的核心对象）

一个适配本场景的 PyFunc 模型，内部要做三件事：

```python
class CaptionModel(mlflow.pyfunc.PythonModel):
    def load_context(self, context):
        # 1) 一次性初始化：拉起 vLLM 引擎（重，只做一次！）
        self.llm = LLM(model=..., max_num_seqs=..., gpu_memory_utilization=...)

    def predict(self, context, model_input):
        # 2) 数据处理：按 oss_path 批量拉 OSS 文件 + 解码 + resize（CPU 密集）
        images = [fetch_and_decode(p) for p in model_input["oss_path"]]
        # 3) vLLM 推理（GPU 密集）
        outputs = self.llm.generate(build_prompts(images), sampling_params)
        return pd.DataFrame({"caption": [...]})
```

**三个必须注意的点**（后续章节展开）：

1. **`load_context` 只跑一次**——vLLM 引擎初始化很贵（加载权重、预分配 KV cache），绝不能每个 batch 重建。
2. **`predict` 必须是批式的**——一次接一个 DataFrame，内部批量处理，否则 GPU 永远吃不饱。
3. **CPU（解码）和 GPU（推理）要能分别观测**——否则你不知道瓶颈在哪一侧。

## 1.7 优化维度总览（本书路线图）

| 章 | 优化维度 | 核心问题 |
|---|---|---|
| 第 2 章 | Iceberg 源表读取 | 怎么读得又快又省（只扫需要的列/分区） |
| 第 3 章 | OSS 多模态读取与预处理 | 解码/拉流为什么成了真瓶颈，怎么破 |
| 第 4 章 | MLflow PyFunc 封装 | 模型怎么打包、版本怎么管、batch 接口怎么设计 |
| 第 5 章 | vLLM 离线推理参数 | 两层参数怎么配，效果能到多少 |
| 第 6 章 | Ray Data 调度与容错 | 任务粒度、并发、失败重试怎么调 |
| 第 7 章 | 写回 Iceberg | 写入策略、小文件、幂等、schema 演进 |
| 第 8 章 | 可观测、血缘与 Checklist | 怎么度量、怎么溯源、上线前查什么 |

## 1.8 本章小结

- 本场景是**离线数据闭环**：Iceberg 存指针、OSS 存实体、Ray Data 调度、PyFunc 封装逻辑、vLLM 算、结果写回 Iceberg。
- **四层职责要分清**：存储（Iceberg）/ 调度（Ray Data）/ 逻辑（MLflow PyFunc）/ 计算（vLLM）。
- **MLflow 有双重身份**：既是模型载体（PyFunc），又是旁路观测治理层（Tracking）。
- **优化的前提是边界清晰**：先分清"CPU 解码瓶颈"和"GPU 推理瓶颈"，再谈参数——后面各章都围绕这条主线展开。
