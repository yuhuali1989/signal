---
title: "Iceberg + Ray Data + MLflow + vLLM 离线多模态处理优化全书 - 第4章: MLflow PyFunc 模型封装与集成"
book: "Iceberg + Ray Data + MLflow + vLLM 离线多模态处理优化全书"
chapter: "4"
chapterTitle: "MLflow PyFunc 模型封装：把数据处理与 vLLM 推理打包成可版本化资产"
description: "讲解如何用 MLflow PyFunc 封装「OSS 拉取 + 解码预处理 + vLLM 离线推理」的完整逻辑，重点说明引擎只在 load_context 初始化一次、predict 的批式接口设计，以及 Ray Data 通过 map_batches + ActorPoolStrategy 加载 PyFunc 模型的集成方式与常见坑"
date: "2026-09-18"
updatedAt: "2026-09-18"
agent: "研究员→编辑→审校员"
tags:
  - "MLflow"
  - "PyFunc"
  - "模型封装"
  - "Ray Data"
  - "ActorPool"
  - "模型版本"
type: "book"
---

## 4.1 为什么本场景要用 PyFunc 而不是"纯 vLLM 管道"

Ray Data 提供了 `ray.data.llm`（`vLLMEngineProcessorConfig`），对**纯 LLM/VLM 推理**优化得很好（第 5 章详述）。但本场景有一个关键差异：

> **模型里封装了自定义的数据处理逻辑**（按 `oss_path` 拉 OSS、解码、resize），然后才交给 vLLM 推理。

这时有两种集成方式：

| 方式 | 适用 | 本场景是否合适 |
|---|---|---|
| **`ray.data.llm` 的 `vLLMEngineProcessorConfig`** | 数据已是文本/消息，引擎直接吃 | ❌ 不适合——它不负责"按路径拉 OSS 文件并解码"这段自定义逻辑 |
| **`map_batches` + `ActorPoolStrategy` 加载 PyFunc 模型** | 模型内含自定义处理逻辑 | ✅ **本场景的推荐做法** |

**结论**：本场景走 `map_batches` + 自定义 actor，actor 内加载 MLflow PyFunc 模型；vLLM 引擎由 PyFunc 的 `load_context` 拉起。

> 若你的预处理可以拆出来（先用 Ray Data 的 map 做解码，再把纯文本喂给 `ray.data.llm`），那也可以混合：预处理用 `map_batches`，推理用 `vLLMEngineProcessorConfig`。但把逻辑封在 PyFunc 里**更简单、更易版本化**——本书推荐后者。

## 4.2 PyFunc 模型内部结构

一个标准 PyFunc 模型包含：

| 组成 | 作用 |
|---|---|
| `PythonModel` 子类 | 定义 `load_context`（初始化）与 `predict`（推理） |
| `MLmodel` 文件 | 元信息：flavor、签名、依赖 |
| 依赖声明（`conda.yaml` / `pip_requirements`） | 固化 vLLM、torch、CUDA 相关版本 |
| `artifacts` | 随模型打包的文件（如本地权重、prompt 模板、配置文件） |

**签名（signature）建议显式声明**：输入输出列名与类型，MLflow 会做校验，也让模型更易被复用。

## 4.3 load_context：引擎只初始化一次（最关键的一条）

vLLM 引擎初始化**非常昂贵**：下载/加载权重、初始化 KV cache、编译/预热。它必须且只能在 `load_context` 里做一次。

```python
import mlflow, pandas as pd
from vllm import LLM, SamplingParams

class CaptionPyFunc(mlflow.pyfunc.PythonModel):

    def load_context(self, context):
        # ✅ 只在模型加载时执行一次（每个 actor 进程一次）
        self.llm = LLM(
            model=context.artifacts.get("vllm_model", "Qwen/Qwen2.5-VL-7B-Instruct"),
            max_num_seqs=256,
            max_num_batched_tokens=16384,
            gpu_memory_utilization=0.95,
            enable_prefix_caching=True,
            enable_chunked_prefill=True,
        )
        self.sp = SamplingParams(temperature=0.2, max_tokens=512)

    def predict(self, context, model_input: pd.DataFrame) -> pd.DataFrame:
        # 每个 batch 调用一次，复用上面已初始化好的 self.llm
        ...
```

**反例（致命）**：在 `predict` 里 `LLM(...)` —— 每个 batch 重建一次引擎，吞吐会掉到几乎为零。

## 4.4 predict：批式接口设计

`predict` 接收一个 **pandas DataFrame（一批行）**，返回 DataFrame。要遵守：

1. **一次处理整批**，内部批量送 vLLM，不要逐行 `generate`（那等于放弃连续批处理）
2. **返回行数与输入一致**，便于 Ray Data 对齐（失败行也要返回，标记 `valid=False`）
3. **带兜底**（第 3 章的坏文件处理）

```python
    def predict(self, context, model_input: pd.DataFrame) -> pd.DataFrame:
        ids = model_input["id"].tolist()
        paths = model_input["oss_path"].tolist()

        # ① 数据处理（CPU 密集）：批量拉 OSS + 解码 + resize
        medias, oks = [], []
        for p in paths:
            try:
                medias.append(fetch_decode_resize(p))
                oks.append(True)
            except Exception:
                medias.append(None)
                oks.append(False)

        # ② vLLM 推理（GPU 密集）：一次送整批
        caps = [None] * len(ids)
        valid_idx = [i for i, ok in enumerate(oks) if ok]
        if valid_idx:
            prompts = [build_prompt(medias[i]) for i in valid_idx]
            outs = self.llm.generate(prompts, self.sp)   # ← 整批，不是逐条
            for i, o in zip(valid_idx, outs):
                caps[i] = o.outputs[0].text.strip()

        return pd.DataFrame({
            "id": ids,
            "caption": caps,
            "valid": oks,
        })
```

## 4.5 Ray Data 集成：map_batches + ActorPoolStrategy

actor 内加载 PyFunc 模型，每 GPU 一个 actor，模型（含 vLLM 引擎）随 actor 初始化一次：

```python
import ray

class CaptionActor:
    def __init__(self):
        # 每个 actor 进程只加载一次 → 触发 load_context → 拉起 vLLM 引擎
        self.model = mlflow.pyfunc.load_model("models:/qwen25-vl-caption@champion")

    def __call__(self, batch: pd.DataFrame) -> pd.DataFrame:
        return self.model.predict(batch)   # 批式

ds = ray.data.read_...          # 第 2 章：从 Iceberg 读
ds = ds.repartition(256)        # 第 6 章：切块控制任务粒度

pred = ds.map_batches(
    CaptionActor,
    batch_format="pandas",
    batch_size=128,                                    # 每批行数
    compute=ray.data.ActorPoolStrategy(size=ACTOR_COUNT),  # actor 数 = GPU 数
    num_gpus=1,                                        # 每 actor 占 1 张 GPU
)
```

**要点**：

- `ACTOR_COUNT` 通常设为**可用 GPU 数**（每 actor 一张卡）；大模型需 TP 时按 `tensor_parallel_size` 调整 `num_gpus`
- `batch_size` 控制"一次给模型多少行"——太小 GPU 空转，太大单批失败重试代价高（第 6 章详述）
- 模型用 **Registry URI** 加载（`models:/name@champion`），而不是硬编码路径

## 4.6 版本管理与 Registry 别名

把模型注册到 MLflow Model Registry，用**别名（alias）**指向当前生产版本：

```python
# 注册并打别名
mlflow.register_model(model_uri=f"runs:/{run.info.run_id}/caption_model",
                      name="qwen25-vl-caption")
# 客户端设置别名 champion → version 7（MLflow 2.9+ 支持 alias）
client.set_registered_model_alias("qwen25-vl-caption", "champion", 7)
```

**收益**：

- 换模型/改 prompt → 注册新版本，把 `champion` 别名指过去，**无需改任务代码**
- 灰度：先切一部分任务用 `challenger` 别名跑，对比质量与吞吐后再全量
- 回滚：别名指回旧版本即可

这条配合第 7 章目标表的 `model_version` 溯源列，形成完整闭环。

## 4.7 依赖固化：vLLM/CUDA 的坑

PyFunc 模型在生产重建环境时，最常见的失败来自**依赖版本漂移**：

| 依赖项 | 注意 |
|---|---|
| vLLM 版本 | 与引擎参数相关（如 V1 引擎、chunked prefill 行为），要锁死 |
| torch / CUDA | 必须与运行环境的 GPU 驱动匹配，`pip_requirements` 里写清 |
| transformers / tokenizers | VLM 的 processor 依赖，版本不匹配会报奇怪的错 |
| 解码库（Pillow / decord / torchvision / ffmpeg） | 图片视频解码后端，视频场景必须有 |

**建议**：

- 用 `pip_requirements=[...]` 或 `conda_env` **显式锁定关键版本**
- 若运行环境是固定镜像（推荐），PyFunc 只声明业务依赖，重依赖交给镜像
- **在 CI 里做一次"干净环境加载模型 + 推理一条样本"的冒烟测试**，别等到生产才发现装不上

## 4.8 常见坑清单

| 坑 | 表现 | 对策 |
|---|---|---|
| 在 `predict` 里初始化引擎 | 吞吐极低，显存反复抖动 | 引擎放 `load_context`，只初始化一次 |
| 逐行 `generate` | GPU 利用率上不去 | 整批送 `llm.generate(prompts)` |
| 用硬编码 HF 路径 | 无法回答"这批结果谁生成的" | 用 `models:/name@champion` |
| 依赖没锁版本 | 换个环境就跑不起来 | `pip_requirements` 锁死关键版本 |
| 单条异常没兜底 | 整个 batch 失败重试，浪费巨大 | `try/except` 逐条兜底，失败行标记 |
| 返回行数与输入不一致 | Ray Data 对齐错乱 | 失败行也要返回（caption=None） |
| 视频解码占满 CPU | 加了 GPU 也不涨吞吐 | 第 3 章：抽帧 + 扩 CPU 配比 |

## 4.9 本章小结

- 本场景（模型内含自定义数据处理）**推荐 `map_batches` + `ActorPoolStrategy` 加载 PyFunc 模型**，而非纯 `ray.data.llm` 管道。
- **引擎只在 `load_context` 初始化一次**——这是性能的生命线。
- **`predict` 必须批式**：整批送 vLLM，逐条调用等于放弃连续批处理。
- **用 Registry 别名（`models:/name@champion`）加载**，换模型不改代码，支持灰度与回滚。
- **依赖要锁死**（vLLM/torch/CUDA/解码库），并在 CI 做干净环境冒烟。
- 失败行逐条兜底，保证返回行数与输入一致。
