---
title: "Ray Data 引擎：从 2.10 到 2.5x - 第7章: 与训练/推理的深度集成"
book: "Ray Data 引擎：从 2.10 到 2.5x"
chapter: "7"
chapterTitle: "与训练/推理的深度集成"
description: "Ray Data 如何嵌入 Ray Train 训练摄取，2.44 Ray Data LLM 原生集成 vLLM、2.45 集成 SGLang、跨节点模型并行支持 Kimi K2/gpt-oss 120b、任意加速器与共享推理引擎池；并与 Megatron/DeepSpeed 数据管道对比"
date: "2026-07-29"
updatedAt: "2026-07-29"
agent: "研究员→编辑→审校员"
tags:
  - "Ray Train"
  - "Ray Data LLM"
  - "vLLM"
  - "SGLang"
  - "训练摄取"
  - "Megatron"
  - "DeepSpeed"
type: "book"
---

# 第 7 章：与训练/推理的深度集成

> **学习目标**：理解 Ray Data 如何成为 Ray Train 的数据摄取层，重点掌握 2.44/2.45/2.51 陆续落地的 Ray Data LLM（原生 vLLM/SGLang、跨节点模型并行），以及它和 Megatron-LM / DeepSpeed 数据管道（WebDataset/JSONL）的分工与对比。

---

## 7.1 训练摄取：让 GPU 不再挨饿

分布式训练最经典的浪费是：**GPU 算得飞快，却在等数据**。Ray Data 的解法是把「读取+预处理」变成与训练 **并行的流式管线**（第 4.5 的 `streaming_split`）：

```
Ray Data 流:  read → preprocess → (streaming_split 均分) → 各 rank 训练
训练循环:        ←—————— 边产边消费，重叠执行 ——————→
```

- 每个训练 worker 像消费普通 DataLoader 一样拿 batch，但底层是 **跨集群分布式、背压可控** 的摄取。
- 适用于 PyTorch DDP / FSDP / DeepSpeed / Megatron 等各种后端——Ray Data 只负责「把对的 batch 在对的时间给对的 rank」。

---

## 7.2 Ray Data LLM：把推理引擎变成算子（2.44 / 2.45）

2024→2025 年，多模态与 LLM 批推理爆发。Ray 2.44 宣布 **Ray Data LLM**，提供与 vLLM 的 **原生集成**；2.45 又集成 **SGLang**——用户可以在数据流里直接放一个「大模型算子」：

```python
config = vLLMEngineProcessorConfig(
    model_source="unsloth/Llama-3.1-8B-Instruct",
    engine_kwargs={
        "enable_chunked_prefill": True,
        "max_num_batched_tokens": 4096,
        "max_model_len": 16384,
        "pipeline_parallel_size": 4,
        "tensor_parallel_size": 4,
        "distributed_executor_backend": "ray",
    },
    batch_size=32,
    concurrency=4,
)
processor = build_llm_processor(config,
    preprocess=lambda row: {"messages": [{"role":"user","content":row["prompt"]}],
                            "sampling_params": {"temperature":0.7,"max_tokens":100}},
    postprocess=lambda row: {"prompt": row["prompt"], "response": row["generated_text"]})
ds = processor(ds)
```

含义：vLLM/SGLang 不再是「外部服务」，而是 **数据流里的一个 stage**，前面接读取/预处理、后面接后处理/落库，整条管线流式跑。

### 2.51 的能力补强（均已在 2.51 可用）
- **跨节点模型并行**：支持把最大的开源模型（如 Kimi K2、gpt-oss 120b）用多节点 TP/PP 跑在 Ray Data LLM 里。
- **任意加速器**：可在 TPU 等非 NVIDIA 加速器上跑 vLLM + Ray Data。
- **共享推理引擎池**：流水线的不同步骤 **复用同一个推理引擎池**，适合 agentic 推理链（多步调用同一模型）。

> 这与本站《GPU 工作原理与并发模型》第 7 章「多进程协作」呼应：vLLM 多实例、跨节点张量并行，底层就是 NCCL + CUDA IPC 在搬运 KV/激活。

---

## 7.3 与 Megatron / DeepSpeed 数据管道的对比

本项目多模态数据章节讲过的双写范式（Parquet 大脑 + WebDataset 肌肉）与 Ray Data 是 **互补而非竞争**：

| 关注点 | Megatron / DeepSpeed 数据侧 | Ray Data |
|---|---|---|
| 数据格式 | WebDataset(tar+json) / DeepSpeed JSONL | 任意 read_*（含 WebDataset/Lance） |
| 角色 | 消费端：怎么把样本喂给模型 | 生产端：怎么分布式读/预处理/分流 |
| 并行 | 依赖训练框架的 DataLoader/采样器 | 自己的流式执行 + 背压 + SplitCoordinator |
| 强项 | 与训练 step 紧耦合、显存/梯度友好 | 横向扩展、异构集群、GPU 感知调度、与推理引擎共置 |
| 典型搭配 | Ray Data 产流 → streaming_split → Megatron/DeepSpeed 消费 | 同左 |

**结论**：在实际大模型训练里，常见架构是 **Ray Data 做「分布式摄取 + 预处理 + 均分」的上游，Megatron/DeepSpeed 做「单步训练」的下游**。Ray Data 补的是「数据层横向扩展」，训练框架补的是「计算层纵向优化」。

---

## 7.4 批推理生产案例

- **ByteDance**：用多模态 LLM 在 Ray Data 上处理 **200TB** 数据做离线推理。
- **Spotify**：新 ML 平台基于 Ray Data 做批推理。
- **Sewer AI**：视频目标检测提速 3×。
- **Predibase**：图像增广提速。

说明 Ray Data 在「大规模、多模态、GPU 密集」的推理负载上已成事实标准之一。

---

## 7.5 本章小结

- 训练摄取：Ray Data 流 + `streaming_split` 让数据预处理与训练重叠，GPU 不饿。
- Ray Data LLM（2.44 vLLM / 2.45 SGLang）：把推理引擎变成数据流的一个 stage；2.51 支持跨节点模型并行、任意加速器、共享引擎池。
- 与 Megatron/DeepSpeed：**上下游互补**——Ray Data 管横向数据扩展，训练框架管纵向计算优化。
- 生产验证：ByteDance/Spotify/Sewer AI 等大规模案例。

最后一章，我们把版本线串起来（2.10 GA → 2.5x 最新），并给出性能调优清单，呼应全书与本项目其他书。

---

## 参考与延伸

- Anyscale Blog: *Ray Data Scalable Data Processing for AI workloads*（Ray Data LLM / 跨节点并行 / 任意加速器）
- Ray 2.44 / 2.45 / 2.51 Release Highlights
- 本站《多模态大模型数据处理流水线》《GPU 工作原理与并发模型》第 7 章
