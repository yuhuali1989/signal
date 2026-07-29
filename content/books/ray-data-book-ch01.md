---
title: "Ray Data 引擎：从 2.10 到 2.5x - 第1章: 为什么需要 Ray Data"
book: "Ray Data 引擎：从 2.10 到 2.5x"
chapter: "1"
chapterTitle: "为什么需要 Ray Data：AI 数据流水线的专用引擎"
description: "从训练摄取与批推理的瓶颈出发，理解 Ray Data 的定位、与传统数据系统的差异、2.10 GA 的意义，以及它在多模态/异构集群场景中的不可替代性"
date: "2026-07-29"
updatedAt: "2026-07-29"
agent: "研究员→编辑→审校员"
tags:
  - "Ray Data"
  - "数据流水线"
  - "训练摄取"
  - "批推理"
  - "流式执行"
type: "book"
---

# 第 1 章：为什么需要 Ray Data——AI 数据流水线的专用引擎

> **学习目标**：搞清楚 Ray Data 解决什么问题、为什么 Spark / tf.data / WebDataset 不够用、Ray 2.10 把它推到 GA 意味着什么，以及它最适合哪类负载。

---

## 1.1 一个被长期忽视的瓶颈

大模型时代，大家把注意力都放在「模型」上：参数规模、注意力机制、显存优化。但工业界很早意识到一个残酷事实：

> **训练/推理的 GPU 经常饿着——瓶颈在数据源，不在算力。**

一套典型的 LLM 训练流水线，GPU 在等数据：读取 Parquet → 解码 → tokenize → 组 batch → 搬到显存。如果预处理在单机上串行，再强的 GPU 也在空转。问题不是「算得慢」，而是「喂不饱」。

这正是 Ray Data 诞生的动机：**为 AI 工作负载（预处理、训练摄取、批推理）专门设计的可扩展数据引擎**，构建在 Ray 分布式运行时之上。

---

## 1.2 Ray Data 是什么

官方定义（Ray 2.10 文档）：

> Ray Data is a scalable data processing library for AI workloads built on Ray. It provides flexible and performant APIs for batch inference, data preprocessing, and data loading for ML training.

三个关键词：
1. **Scalable**：构建在 Ray 之上，自动跨异构集群扩缩（1 台机器 → 数百节点，处理数百 TB）。
2. **AI-native**：把 GPU 当一等公民——流式地在 CPU 预处理与 GPU 计算之间搬运数据，让 GPU 尽量不闲。
3. **Streaming execution**：流式执行引擎，能处理远超集群内存的数据集，且保持高利用率。

---

## 1.3 和传统数据系统的差异

| 维度 | Spark / Flink | tf.data | WebDataset | **Ray Data** |
|---|---|---|---|---|
| 设计目标 | 通用 ETL / 流批 | 单进程 TF 输入 | 图像/多模态 tar 流 | **AI 训练+推理摄取** |
| GPU 友好 | 弱（面向 CPU） | 中（单卡） | 中 | **强（原生异构调度）** |
| 与训练框架 | 需胶水 | 紧耦合 TF | 需自己接 | **PyTorch/TF/vLLM/SGLang 一等公民** |
| 执行模型 | 微批/算子 | 流水线 | 流式 | **流式 + 算子融合 + 背压** |
| 集群调度 | YARN/K8s | 单机 | 单机/手动 | **Ray 调度（SPREAD/ locality）** |

**核心区别**：Spark 为「通用数据」优化，对 GPU 语义（少内存、不同调度、昂贵）支持差；tf.data 强但被 TF 绑定且主要单节点；WebDataset 轻量但只是「格式+读取」，没有调度与执行引擎。Ray Data 把「**分布式执行 + GPU 感知 + 框架无关**」三者合在一起。

---

## 1.4 Ray 2.10：Ray Data 正式 GA

时间回到 **2026-07-29 回看**：Ray 2.10.0 于 2024-03-22 发布，最重要的信号之一是 **Ray Data 正式 GA（Generally Available）**。GA 前的 Ray Data（曾叫 Ray Datasets）已能用，但 GA 带来一批「可用于生产」的稳定性与可观测性增强：

- **流式执行稳定性**：逐算子资源预留（per-operator resource reservation）、流式生成器输出缓冲管理、更准的运行时资源估计——直接缓解内存爆炸。
- **读取/写入稳定性**：元数据读取在 AWS 瞬时错误时重试、任务跨节点分散、可配重试间隔。
- **并发控制**：read / map / write 均可配置任务并发上限，避免把集群打爆。
- **可观测性**：每个算子的运行时指标进入 Dashboard，日志与指标可视化。

> 为什么「从 2.10 开始」讲这本书？因为 2.10 是 Ray Data 从「实验特性」走向「生产基座」的拐点——后续的 2.44（Ray Data LLM）、2.45（SGLang）、2.51（多模态/张量/MCAP）都是在这套稳定内核上长出来的。

---

## 1.5 典型适用场景

Ray Data 自己总结的四大类（并有 Pinterest、DoorDash、Instacart、ByteDance、Spotify 等生产案例）：

1. **训练摄取（Training ingest）**：把「读取+预处理」变成分布式管线，喂给 Ray Train / PyTorch DDP / DeepSpeed，避免数据成为瓶颈（Pinterest 用它做训练的 last-mile 处理）。
2. **批推理（Batch inference）**：大规模离线推理，如 ByteDance 用多模态 LLM 在 Ray Data 上处理 200TB 数据、Spotify 新 ML 平台用它做批推理。
3. **数据预处理（Preprocessing）**：特征工程、图像增广（Predibase 用它加速图像增广 3×）。
4. **多模态处理**：图片/视频/音频/embedding，支持 Lance、MCAP 等专用格式（Sewer AI 用 Ray Data 做视频目标检测提速 3×）。

---

## 1.6 一句话定位

> **Ray Data = 在异构 CPU/GPU 集群上，为「训练摄取 + 批推理 + 预处理」提供流式、融合、背压可控的分布式数据引擎。** 它不试图取代 Spark 做通用数仓，而是补齐 AI 流水线里那块「没人愿意重复造轮子」的数据层。

下一章，我们钻进它的核心抽象：**Dataset 与 Block**——理解数据在 Ray Data 里「长什么样、怎么切、怎么存」。

---

## 参考与延伸

- Ray 2.10.0 Release Highlights（Ray Data GA）
- Ray Docs: *Ray Data: Scalable Data Processing for AI Workloads*
- Anyscale Blog: *Ray Data: Scalable Data Processing for AI workloads*（多模态/结构化/可靠性三大方向）
