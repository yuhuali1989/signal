---
title: "DistServe: Disaggregating Prefill and Decoding for Goodput-optimized LLM Serving"
description: "OSDI 2024 最佳论文候选：Prefill-Decode 分离架构的开创性工作，2.5x 吞吐提升 + 3x P99 延迟降低"
date: "2026-04-11"
updatedAt: "2026-04-12 00:00"
tags:
  - "推理优化"
  - "Disaggregated Serving"
  - "PD分离"
  - "OSDI"
type: "paper"
---

# DistServe: Disaggregating Prefill and Decoding for Goodput-optimized LLM Serving

> **论文信息**
> - 作者: Zhong et al. (UC San Diego / PKU)
> - 会议: OSDI 2024
> - arXiv: [2401.09670](https://arxiv.org/abs/2401.09670)
> - 重要度: ⭐⭐⭐⭐⭐

## 一、核心问题：Prefill 和 Decode 的资源冲突

当前主流 LLM 推理系统（如 vLLM、TensorRT-LLM）将 Prefill 和 Decode 混合在同一组 GPU 上执行。论文指出，这种混合调度导致了严重的性能问题：

```
混合调度的三大问题:

1. Prefill 抢占 Decode
   Prefill 是 Compute-Bound（大矩阵乘法），单次耗时 100ms-10s
   Decode 是 Memory-Bound（矩阵-向量乘），单步耗时 5-30ms
   
   当 Prefill 在执行时，同批次的 Decode 请求被阻塞
   → Decode 延迟飙升（TPOT 违反 SLO）

2. GPU 利用率低
   Decode 阶段 GPU 利用率仅 5-15%
   但 Prefill 阶段需要大量算力
   混合后: 两者都得不到最优资源配比

3. Batch 策略冲突
   Prefill 需要: 小 batch（减少 TTFT）
   Decode 需要: 大 batch（提高吞吐）
   混合: 两者互相制约
```

## 二、核心方案：Prefill-Decode 分离

DistServe 的核心思想极其简洁——将 Prefill 和 Decode 物理隔离到不同的 GPU 池：

```
┌─────────────────────────────────────────────┐
│                  DistServe                   │
│                                              │
│  ┌──────────┐   KV Transfer   ┌──────────┐  │
│  │ Prefill  │ ──────────────→ │  Decode  │  │
│  │  Pool    │    (RDMA)       │   Pool   │  │
│  │          │                 │          │  │
│  │ 优化:     │                │ 优化:     │  │
│  │ - 大 GEMM │                │ - 大 batch│  │
│  │ - 少并发  │                │ - 多并发  │  │
│  │ - TP=4   │                │ - TP=2   │  │
│  └──────────┘                └──────────┘  │
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │         Goodput Optimizer            │   │
│  │  (基于 SLO 的资源分配优化器)          │   │
│  └──────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

### 关键设计 1: 异构资源配比

```
传统 (混合): 8 × H100 统一处理所有请求
  → 实际: Prefill 用不完算力，Decode 并发不够

DistServe: 根据工作负载特征动态分配
  
  短 prompt + 长输出 (代码生成):
    Prefill: 2 × H100 (TP=2)
    Decode:  6 × H100 (TP=2, DP=3)
    
  长 prompt + 短输出 (RAG):
    Prefill: 4 × H100 (TP=4)
    Decode:  4 × H100 (TP=2, DP=2)
```

### 关键设计 2: Goodput Optimizer

不是简单地最大化吞吐量（throughput），而是最大化**有效吞吐量（goodput）**——满足 SLO 的请求占比：

```python
# Goodput 定义
def goodput(requests, slo_ttft, slo_tpot):
    """
    Goodput = 满足 SLO 的请求数 / 总请求数
    
    SLO 通常定义:
      TTFT (Time To First Token) < 2s (P99)
      TPOT (Time Per Output Token) < 50ms (P99)
    """
    good = sum(1 for r in requests 
               if r.ttft < slo_ttft and r.tpot_p99 < slo_tpot)
    return good / len(requests)

# Goodput Optimizer: 搜索最优的资源分配
# 输入: 总 GPU 数, 请求到达率, prompt/output 长度分布, SLO
# 输出: Prefill GPU 数, Decode GPU 数, 各自的 TP 度
# 方法: 离线 profiling + 排队论模型 + grid search
```

### 关键设计 3: KV Cache Transfer Pipeline

```
朴素传输: Prefill 完成 → 传输全部 KV → Decode 开始
  延迟: Prefill_time + Transfer_time + Decode_start
  
流水线传输: 边 Prefill 边传输已完成层的 KV
  Layer 0 Prefill 完成 → 立即传输 Layer 0 KV
  Layer 1 Prefill 中    → 同时传输 Layer 0 KV
  ...
  Layer N Prefill 完成 → Layer 0-N/2 的 KV 已经传完
  
  延迟: Prefill_time + max(0, Transfer_remaining)
  实际: Transfer 时间几乎被 Prefill 完全隐藏
```

## 三、实验结果

### 性能对比

```
基准: vLLM (混合调度)
模型: Llama 2 70B, 8 × A100 80GB

工作负载 1: ShareGPT (短 prompt, 短输出)
  vLLM Goodput:     78% (at SLO: TTFT<2s, TPOT<50ms)
  DistServe Goodput: 98% (+25.6%)
  
工作负载 2: 长 prompt (RAG 场景, 4K prompt)
  vLLM Goodput:     52%
  DistServe Goodput: 95% (+82.7%)
  
工作负载 3: 混合流量
  vLLM 吞吐: 1.0x baseline
  DistServe:  2.0-2.5x (Prefill 和 Decode 都能充分利用各自资源)
  
P99 延迟:
  TTFT: DistServe 降低 40-60%
  TPOT: DistServe 降低 50-70%
```

### 关键发现

```
1. 分离比例不是固定的——取决于工作负载
   短 prompt 流量: Prefill 需要少量 GPU
   长 prompt 流量: Prefill 需要更多 GPU
   → 需要自适应/弹性资源分配
   
2. KV Transfer 开销可接受
   RDMA: 1-5% 的总延迟
   TCP:  5-15% 的总延迟（仍然值得分离）
   
3. Goodput 比 Throughput 更重要
   纯吞吐优化可能导致 P99 延迟不可控
   Goodput 优化同时保证吞吐和延迟
```

## 四、论文贡献与影响

1. **首次系统性论证** Prefill-Decode 分离的必要性和可行性
2. **提出 Goodput** 作为 LLM serving 的优化目标（vs 单纯 throughput）
3. **开源实现** 成为后续系统（Mooncake、Splitwise）的基础
4. **工业影响** — 字节跳动、月之暗面等已在生产中采用 PD 分离架构

## 五、局限性与未来方向

```
局限:
1. 假设 RDMA 网络可用（不适用于所有环境）
2. 未考虑 MoE 模型的特殊调度需求
3. Goodput Optimizer 依赖离线 profiling（不够动态）

未来方向:
1. PD 分离 + MoE Expert Parallelism 联合优化
2. 在线自适应资源分配（基于实时流量）
3. 跨区域/跨云的分布式推理
```

---

*Signal 知识平台 · 论文精读 · 推理优化*
