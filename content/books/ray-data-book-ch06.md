---
title: "Ray Data 引擎：从 2.10 到 2.5x - 第6章: 数据格式与连接器"
book: "Ray Data 引擎：从 2.10 到 2.5x"
chapter: "6"
chapterTitle: "数据格式与连接器"
description: "盘点 Ray Data 的读取器：Parquet/CSV/JSON/Image/TFRecord/WebDataset/Lance/MCAP；列式与多模态支持；与 PyTorch/TF 的迭代器衔接（iter_batches/to_torch/to_tf）；数据加载不成为瓶颈的工程原则"
date: "2026-07-29"
updatedAt: "2026-07-29"
agent: "研究员→编辑→审校员"
tags:
  - "Parquet"
  - "WebDataset"
  - "Lance"
  - "MCAP"
  - "iter_batches"
  - "多模态"
type: "book"
---

# 第 6 章：数据格式与连接器

> **学习目标**：盘点 Ray Data 支持的数据格式与读取器（Parquet/CSV/JSON/Image/TFRecord/WebDataset/Lance/MCAP），理解它如何既服务结构化 ML 也服务多模态，以及如何无缝衔接 PyTorch / TensorFlow 训练循环。

---

## 6.1 读取器家族（reader）

Ray Data 用 `ray.data.read_*` 拉数据，底层是各类 **Datasource**：

| 格式 | API | 典型场景 |
|---|---|---|
| Parquet | `read_parquet` | 结构化训练数据（首选，列式、可裁剪列） |
| CSV | `read_csv` | 表格数据 |
| JSON / JSONL | `read_json` | 日志、对话、文本 |
| 图片 | `read_images` | 视觉预处理 |
| TFRecord | `read_tfrecord` | TF 生态、大规模图像 |
| 文本/二进制 | `read_text` / `read_binary` | 语料、自定义 |
| WebDataset | `read_webdataset` | 多模态 tar 流（图像+caption 同包） |
| Lance | `read_lance` | 多模态/向量、高性能列式 |
| MCAP | `read_mcap`（2.51+） | 机器人/自动驾驶传感器日志 |

> 2.51 起新增 **MCAP** 支持——机器人/自动驾驶公司用 MCAP 录传感器日志，又用 Ray Data 做多模态处理，正好打通（与 Foxglove 等可视化工具互操作）。

---

## 6.2 为什么 Parquet 是默认最爱

- **列式存储**：只读需要的列（如只要 `input_ids` 不要 `metadata`），省 IO。
- **谓词下推 / 行组裁剪**：跳过无关数据。
- **天然分块**：一个 Parquet 文件多由多个 row group 组成，直接映射成 Ray Data 的 Block，并行度天然。
- 和 Arrow 同源：Block 本就是 Arrow，读 Parquet → Arrow 几乎零拷贝。

```python
ds = ray.data.read_parquet(
    "s3://bucket/train/",
    # 只读需要的列，减少 IO 与内存
    columns=["input_ids", "labels"]
)
```

---

## 6.3 多模态：WebDataset / Lance / download 表达式

多模态样本（图+文、视频+字幕、音频+文本）常打包存储：

- **WebDataset**：把「key.json + key.jpg + key.txt」放进同一个 tar，按 key 聚类，流式读取不乱序。Ray Data 的 `read_webdataset` 直接消费。
- **Lance**：为多模态/向量设计的列式格式，支持 embedding 列、快速随机读，Ray Data 可 `read_lance`。
- **`download` 表达式（2.51）**：当样本只存了 URL（而非文件本体），用 `with_column("bytes", download("image_url"))` 声明式下载，引擎托管多线程与分区（第 5.5）。

```python
# 多模态：URL → 下载 → 解码 → 模型批推理
ds = (ray.data.read_parquet(INPUT)
        .with_column("bytes", download("image_url"))
        .map(deserialize_image)
        .map_batches(VisionModel, num_gpus=1, concurrency=NUM_GPU_NODES))
```

---

## 6.4 喂给训练框架：迭代器衔接

Ray Data 的核心价值之一是 **框架无关地对接 PyTorch / TF / 训练库**。几种消费方式：

### 6.4.1 `iter_batches()`：最通用
逐 batch 产出，可指定 `batch_format`（pandas / numpy / arrow）：

```python
for batch in ds.iter_batches(batch_size=1024, batch_format="numpy"):
    train_step(batch)
```

### 6.4.2 `to_torch()` / `to_tf()`：直接拿框架张量迭代器
```python
# PyTorch
for x, y in ds.to_torch(batch_size=64, label_column="label"):
    out = model(x); loss = crit(out, y); ...

# TensorFlow
for batch in ds.to_tf(feature_columns=["feat"], label_column="label"):
    ...
```
2.10 起还优化：若提供 `tf.TypeSpec` 可跳过 schema 推断（`to_tf` 更快）。

### 6.4.3 训练场景 `streaming_split()`
见第 4.5：多 worker 时把流均分，喂 Ray Train / DDP / FSDP。

---

## 6.5 工程原则：数据加载不能成瓶颈

Ray Data 自己的口号是 **「保证数据读取不会成为整个 graph 的瓶颈」**。做到这点依赖：

1. **并行读取**：reader 本身用 SPREAD 打散到多节点多任务。
2. **流式重叠**：读 → 预处理 → GPU 计算 流水线化（第 3.5）。
3. **算子融合**：减少中间落盘/序列化（第 3.3）。
4. **与推理引擎共置**：2.44+ 的 Ray Data LLM 让 vLLM/SGLang 直接作为算子跑在数据流里（第 7 章）。

> 与本站多模态数据章节（Tag 系统、双写范式）互补：Ray Data 解决「分布式读取与流式处理」，而上游「怎么打 tag、怎么存」由数据湖/WebDataset 负责。两者拼接成完整多模态训练数据管线。

---

## 6.6 本章小结

- 读取器覆盖结构化（Parquet/CSV/JSON）到多模态（Image/WebDataset/Lance/MCAP）。
- Parquet 因列式+Arrow 同源成为首选；多模态用 WebDataset/Lance + `download` 表达式。
- 三种消费：`iter_batches`（通用）、`to_torch/to_tf`（框架张量）、`streaming_split`（多 worker 训练）。
- 设计目标：读取永不成瓶颈——靠并行读、流式重叠、算子融合、引擎共置。

下一章进入「集成」高地：**Ray Data 如何深度嵌入训练与推理**，特别是 2.44/2.45/2.51 的 Ray Data LLM、跨节点模型并行，以及和 Megatron/DeepSpeed 数据管道的对比。

---

## 参考与延伸

- Ray Docs: *Loading Data*（read_* APIs）
- Ray Docs: *Inspecting Data* / *Saving Data*（iter_batches / to_torch / to_tf）
- Anyscale Blog: *Ray Data Scalable Data Processing for AI workloads*（多模态、MCAP、download 表达式）
