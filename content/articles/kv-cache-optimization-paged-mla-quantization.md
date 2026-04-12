---
title: "KV Cache 优化全景：从 PagedAttention 到 MLA 再到 1-bit 压缩"
description: "大模型推理的显存瓶颈与解决方案，系统梳理 KV Cache 优化的完整技术图谱"
date: "2026-04-11"
updatedAt: "2026-04-11 15:41"
agent: "研究员→编辑→审校员"
tags:
  - "推理优化"
  - "模型架构"
type: "article"
---

# KV Cache 优化全景：从 PagedAttention 到 MLA 再到 1-bit 压缩

> KV Cache 是 LLM 推理中最大的显存消费者。如何驯服这头"显存怪兽"？

## 为什么 KV Cache 是核心瓶颈

LLM 自回归生成中，每生成一个新 token，需要"看到"之前所有 token 的 Key 和 Value：

```
KV Cache 显存占用 = 2 × num_layers × num_heads × head_dim × seq_len × batch_size × dtype_size

以 Llama 3.1 70B 为例 (FP16):
= 2 × 80 × 64 × 128 × 4096 × 1 × 2 bytes
= 5.4 GB (单条 4K 序列!)
= 43 GB (单条 32K 序列!)
```

一张 A100 80GB，光 KV Cache 就能吃掉大半显存。所以 KV Cache 优化是推理提速的**必经之路**。

## 技术图谱

```
KV Cache 优化技术
├── 显存管理优化
│   ├── PagedAttention (vLLM) — 分页管理，消除碎片
│   └── RadixAttention (SGLang) — 前缀树共享
├── 压缩优化
│   ├── 量化: FP8 / INT4 / 1-bit KV Cache
│   ├── 稀疏: Eviction (驱逐不重要的 KV)
│   └── 合并: Token Merging (相似 KV 合并)
├── 架构级优化
│   ├── MQA (Multi-Query Attention) — 共享 KV Head
│   ├── GQA (Grouped-Query Attention) — 分组共享
│   └── MLA (Multi-Latent Attention) — 潜变量压缩
└── 系统级优化
    ├── Prefix Caching — 缓存公共前缀
    ├── Offloading — KV Cache 卸载到 CPU/NVMe
    └── Disaggregated Prefill — Prefill/Decode 分离
```

## 一、显存管理：PagedAttention

vLLM 的 **PagedAttention** 把 KV Cache 管理类比为操作系统虚拟内存：

| 传统方案 | PagedAttention |
|---------|---------------|
| 预分配最大长度的连续显存 | 按 Block (16 tokens) 动态分配 |
| 显存利用率 ~50% | 显存利用率 >95% |
| 无法共享 | 支持 Copy-on-Write 共享 |
| batch_size 受限 | 可服务更多并发请求 |

## 二、架构级压缩：从 MQA 到 MLA

这是效果最显著的优化 —— 在模型设计阶段就减少 KV Cache 的体积：

```
标准 MHA:  KV Cache = num_heads × head_dim × 2 × seq_len
           Llama-70B: 64 × 128 × 2 = 16,384 per token per layer

GQA:       KV Cache = num_kv_heads × head_dim × 2 × seq_len
           Llama-70B (8 KV heads): 8 × 128 × 2 = 2,048 (压缩 8x)

MLA:       KV Cache = latent_dim × seq_len
           DeepSeek-V3 (512 latent): 512 (压缩 32x!)
```

**DeepSeek-V3 的 MLA** 是目前最激进的方案：将 KV 投影到低维潜变量空间，推理时只缓存潜变量，用时再恢复。

## 三、量化压缩：FP8 / INT4 / 1-bit

```python
# KV Cache 量化效果
# FP16 → FP8:  显存减半，精度损失极小
# FP16 → INT4: 显存 1/4，需要校准
# FP16 → 1-bit: 显存 1/16，前沿研究

# Google TurboQuant (2026):
# 极坐标变换 + 1-bit 误差校正
# KV Cache 压缩 6x，推理加速 8x
# 让 128K 上下文在消费级 GPU 上可用
```

## 四、系统级优化：分离式推理

2025-2026 年最重要的系统级趋势 —— **Prefill/Decode 分离（Disaggregated Serving）**：

```
传统方案:
[GPU] Prefill + Decode 混合执行 → 互相干扰

分离方案:
[Prefill GPU] 专门处理输入 → 计算密集，用 H100
[Decode GPU]  专门生成输出 → 访存密集，用成本更低的 GPU
[KV Cache 传输] 通过 NVLink/RDMA 转移

优势: Prefill 不阻塞 Decode，TTFT 和 TPOT 同时优化
```

Mooncake (月饼) 、DistServe 等系统已经在生产中验证了这一架构。

## 总结：优化组合拳

实际生产中，往往需要多种优化叠加使用：

```
推荐组合 (2026):
1. 架构级: 使用 GQA/MLA 模型 (源头减量)
2. 量化:   FP8 KV Cache (几乎无损)
3. 管理:   PagedAttention (消除碎片)
4. 缓存:   Prefix Caching (多轮共享)
5. 系统:   Disaggregated Serving (极端场景)

效果叠加: 相比朴素实现，显存节省 10-30x，吞吐提升 5-10x
```

---

*本文由 Signal 知识平台 AI 智能体自动生成。最后更新: 2026-04-11*
