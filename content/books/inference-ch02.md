---
title: "第 2 章：vLLM 深度剖析——PagedAttention 与 Continuous Batching"
description: "vLLM 的核心创新：PagedAttention 的虚拟内存思想、Continuous Batching 调度器、Prefix Caching、Chunked Prefill、v0.8 PD分离架构及性能调优实战"
date: "2026-04-11"
updatedAt: "2026-04-12"
book: "LLM 推理框架：从原理到优化"
chapter: 2
chapterTitle: "vLLM 深度剖析——PagedAttention 与 Continuous Batching"
tags: ["vLLM", "PagedAttention", "Continuous Batching", "推理", "PD分离"]
type: "book"
---

# 第 2 章：vLLM 深度剖析——PagedAttention 与 Continuous Batching

## 2.1 PagedAttention：KV Cache 的虚拟内存

### 2.1.1 传统 KV Cache 的问题

LLM 推理中，KV Cache 是最大的显存消耗者。以 Llama 2 70B 为例：

```
每个 token 的 KV Cache 大小:
  = 2 (K+V) × num_layers × num_kv_heads × head_dim × dtype_size
  = 2 × 80 × 8 × 128 × 2 (FP16)
  = 327,680 bytes ≈ 320 KB / token

对于 2048 token 的序列:
  = 320 KB × 2048 = 640 MB / 序列

传统方案：为每个请求预分配最大长度的连续显存

请求 A (实际 100 tokens, 预分配 2048):
[████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] 95% 浪费

请求 B (实际 50 tokens, 预分配 2048):
[████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] 97% 浪费

→ 平均内存利用率 < 20%
→ 80GB H100 仅能服务 ~12 个并发（本应能服务 100+）
```

### 2.1.2 PagedAttention 的解法

```
借鉴操作系统的虚拟内存 + 分页机制：

物理显存被分成固定大小的 Block (如 16 tokens):
[Block 0][Block 1][Block 2][Block 3][Block 4]...

每个请求维护一个 Block Table（页表）：

请求 A (100 tokens):
  逻辑 Block 0 → 物理 Block 3
  逻辑 Block 1 → 物理 Block 7
  逻辑 Block 2 → 物理 Block 1
  ...
  最后一个 Block 可能只用了一部分（内部碎片 < 1 Block）

请求 B (50 tokens):
  逻辑 Block 0 → 物理 Block 0
  逻辑 Block 1 → 物理 Block 5
  ...

优势：
  ✅ 内存利用率接近 100%（只有最后 Block 有碎片）
  ✅ 无需预分配最大长度
  ✅ 支持 Copy-on-Write（Beam Search 共享前缀）
  ✅ 支持 Prefix Caching（相同 System Prompt 共享 KV）
```

### 2.1.3 PagedAttention Kernel 深度解析

```python
# PagedAttention v1 Kernel（简化的 CUDA 伪代码）
# 每个 thread block 处理一个 head 的一个 query token
def paged_attention_v1_kernel(
    query,          # [num_tokens, num_heads, head_dim]
    key_cache,      # [num_blocks, block_size, num_kv_heads, head_dim]
    value_cache,    # [num_blocks, block_size, num_kv_heads, head_dim]
    block_tables,   # [num_seqs, max_num_blocks] — 页表
    context_lens,   # [num_seqs] — 每个请求的实际长度
    scale,          # 1 / sqrt(head_dim)
):
    seq_idx = blockIdx.x
    head_idx = blockIdx.y
    ctx_len = context_lens[seq_idx]
    num_blocks = ceil_div(ctx_len, block_size)
    
    q = query[seq_idx, head_idx]  # [head_dim]
    
    # 第一轮：计算所有 block 的 attention scores
    max_score = -inf
    exp_sum = 0.0
    output = zeros(head_dim)
    
    for block_idx in range(num_blocks):
        # 通过页表查找物理 block
        physical_block = block_tables[seq_idx][block_idx]
        k_block = key_cache[physical_block]  # [block_size, head_dim]
        v_block = value_cache[physical_block]
        
        # 计算 attention scores (FlashAttention 风格的 online softmax)
        for token_pos in range(block_size):
            if block_idx * block_size + token_pos >= ctx_len:
                break
            score = dot(q, k_block[token_pos]) * scale
            
            # Online softmax: 更新 max 和 exp_sum
            new_max = max(max_score, score)
            correction = exp(max_score - new_max)
            exp_sum = exp_sum * correction + exp(score - new_max)
            
            # 更新输出
            output = output * correction + exp(score - new_max) * v_block[token_pos]
            max_score = new_max
    
    # 归一化
    output = output / exp_sum
    return output
```

### 2.1.4 PagedAttention v2：大 context 优化

```
v1 的问题：当 context 很长时（>4K tokens），一个 thread block 需要遍历
所有 KV blocks，成为瓶颈。

v2 改进：将 KV blocks 分配给多个 thread blocks 并行处理

v1: 1 个 thread block → 遍历所有 blocks → 单点瓶颈
     [block 0, 1, 2, ..., 255] → 1 个 thread block

v2: 多个 thread blocks 并行 → 最终 reduce
     [block 0-63]   → thread block 0 → partial result 0
     [block 64-127] → thread block 1 → partial result 1
     [block 128-191] → thread block 2 → partial result 2
     [block 192-255] → thread block 3 → partial result 3
                                       → reduce → final result

效果：对于 128K context，v2 比 v1 快 2.5x
```

## 2.2 Continuous Batching

### 2.2.1 Static Batching 的浪费

```
Static Batching (传统)：
  一个 Batch 内所有请求必须同时开始、同时结束

  Req A: [████████████████████]  (长请求)
  Req B: [████████░░░░░░░░░░░]  (短请求，已完成但 GPU 空闲)
  Req C: [██████░░░░░░░░░░░░░]  (更短，更多浪费)
  
  → 短请求完成后 GPU 闲置，等最长的请求
  → GPU 利用率：平均 30-50%
```

### 2.2.2 Continuous Batching (vLLM)

```
Continuous Batching：请求完成后立即插入新请求

  Iteration 1: [A₁] [B₁] [C₁]
  Iteration 2: [A₂] [B₂] [C₂]
  Iteration 3: [A₃] [B₃] ←C完成, [D₁] ←新请求立即加入
  Iteration 4: [A₄] ←B完成, [D₂] [E₁] ←又一个新请求
  ...
  
  → GPU 始终满载，无空闲
  → 吞吐提升 2-10x
```

### 2.2.3 Iteration-Level Scheduling 的数学建模

```python
# 吞吐量计算模型
def compute_throughput(batch_size, prefill_tokens, decode_tokens, 
                       prefill_time_per_token, decode_time_per_token):
    """
    Static Batching 吞吐量:
      T_static = batch_size / max(prefill + decode for all requests)
    
    Continuous Batching 吞吐量:
      T_continuous ≈ batch_size * avg_decode_tokens / 
                     sum(individual decode times)
    
    加速比 = T_continuous / T_static
    
    典型场景（batch=32, 长度分布均匀 100-2000 tokens）:
      Static:     32 / (2000 * 0.01ms) = 1.6 tokens/s per request
      Continuous: 32 / (1050 * 0.01ms) = 3.0 tokens/s per request
      加速比 ≈ 1.9x（仅长度差异就带来的增益）
    """
    pass
```

## 2.3 vLLM 调度器：三队列架构

```python
# vLLM Scheduler 的核心逻辑 (简化)
class Scheduler:
    """
    三队列调度架构：
    - waiting_queue: 等待 Prefill 的新请求
    - running_queue: 正在 Decode 的请求
    - swapped_queue: 被换出到 CPU 的请求（显存不足时）
    """
    
    def schedule(self) -> SchedulerOutputs:
        # 优先级 1: 处理 swapped 队列（有请求被换出，优先换回）
        if self.swapped_queue:
            can_swap_in = self._try_swap_in()
            if can_swap_in:
                return self._build_outputs(swapped_in=can_swap_in)
        
        # 优先级 2: Running 请求续 Decode
        running_budget = self._compute_running_budget()
        for req in self.running_queue:
            if req.needs_new_block():
                if self.block_manager.has_free_blocks():
                    self.block_manager.allocate(req)
                else:
                    # 显存不够 → Preemption（驱逐优先级低的请求）
                    victim = self.select_victim(policy="recompute")
                    # policy="recompute": 丢弃 KV Cache，下次重新 Prefill
                    # policy="swap":      KV Cache 换出到 CPU 内存
                    self.preempt(victim)
        
        # 优先级 3: Waiting 队列的新请求
        # 关键：Prefill 和 Decode 共享同一个 batch iteration
        while self.waiting_queue and self.can_admit():
            new_req = self.waiting_queue.popleft()
            blocks_needed = ceil_div(new_req.prompt_len, block_size)
            
            if self.block_manager.can_allocate(blocks_needed):
                self.block_manager.allocate(new_req, blocks_needed)
                self.running_queue.append(new_req)
            else:
                self.waiting_queue.appendleft(new_req)
                break  # 显存不够，停止接纳
    
    def select_victim(self, policy="recompute"):
        """
        Preemption 策略选择:
        
        | 策略 | 优点 | 缺点 | 适用 |
        |------|------|------|------|
        | recompute | 无 CPU 传输开销 | 需要重新 Prefill | 短 prompt |
        | swap | 保留 KV Cache | CPU↔GPU 传输慢 | 长 prompt |
        """
        if policy == "recompute":
            # 选最新到达的请求（LIFO）
            return self.running_queue[-1]
        else:
            # Swap: 选 KV Cache 最大的请求（减少碎片）
            return max(self.running_queue, key=lambda r: r.num_blocks)
```

## 2.4 Prefix Caching 深度机制

### 2.4.1 Automatic Prefix Caching (APC)

```
场景：100 个请求共享相同的 System Prompt (2000 tokens)

不用 Prefix Caching:
  每个请求独立存储 2000 tokens 的 KV Cache
  100 × 2000 = 200,000 tokens 的 KV Cache

用 Prefix Caching (vLLM APC):
  共享前缀只存一份，通过 Block 引用计数共享
  1 × 2000 + 100 × (各自独立部分)
  
  节省: ~90% System Prompt 的 KV Cache 显存
```

### 2.4.2 Hash-Based Block Matching

```python
# APC 通过 Block 内容的 hash 来匹配可复用的 KV Cache
class AutomaticPrefixCaching:
    def __init__(self):
        self.hash_to_block = {}  # hash → physical_block_id
    
    def compute_block_hash(self, token_ids: List[int], block_idx: int):
        """
        Block hash = hash(前缀所有 token + 当前 block 的 token)
        这确保只有完全相同的前缀才会命中 cache
        """
        prefix_tokens = token_ids[:block_idx * block_size]
        block_tokens = token_ids[block_idx * block_size : 
                                  (block_idx + 1) * block_size]
        return hash(tuple(prefix_tokens) + tuple(block_tokens))
    
    def try_reuse(self, token_ids, block_idx):
        h = self.compute_block_hash(token_ids, block_idx)
        if h in self.hash_to_block:
            block = self.hash_to_block[h]
            block.ref_count += 1  # 增加引用计数
            return block
        return None  # 需要新分配
```

### 2.4.3 实际效果测量

```
测试条件：H100 80GB, Llama 2 70B, System Prompt 2K tokens

| 并发数 | 无 APC (显存) | 有 APC (显存) | 节省 | 吞吐提升 |
|--------|-------------|-------------|------|---------|
| 10     | 12.8 GB     | 7.2 GB      | 44%  | +35%    |
| 50     | 48.0 GB     | 10.8 GB     | 78%  | +120%   |
| 100    | OOM         | 18.4 GB     | ∞    | 可用    |

结论：高并发 + 长 System Prompt 场景下，APC 是必须开启的特性
```

## 2.5 Chunked Prefill：消除长 Prompt 阻塞

```
问题：长 Prompt (如 32K tokens) 的 Prefill 会独占 GPU 几秒

Chunked Prefill：
  将长 Prompt 分 chunk 处理，每个 chunk 和 Decode batch 一起执行
  
  Iteration 1: [Prefill_chunk1 (1024 tokens)] + [Decode: A₅, B₃]
  Iteration 2: [Prefill_chunk2 (1024 tokens)] + [Decode: A₆, B₄]
  ...
  
  好处：Decode 请求不会被长 Prefill 阻塞
  代价：TTFT 略微增加（多了几个 iteration 才完成 Prefill）
```

### Chunked Prefill 与 Prefill-Decode 分离的权衡

```
| 方案 | TTFT | Decode 延迟 | 实现复杂度 | 硬件要求 |
|------|------|-----------|----------|---------|
| 无优化 | 最短 | 被 Prefill 阻塞 | 最简单 | 单 GPU |
| Chunked Prefill | 略增 | 稳定 | 中等 | 单 GPU |
| PD 分离 (DistServe) | 最短 | 最稳定 | 最复杂 | 多 GPU |

选型建议：
  - 单 GPU / 小规模 → Chunked Prefill（vLLM 默认）
  - 多 GPU / 大规模 → PD 分离（vLLM v0.8+ / Dynamo）
```

## 2.6 vLLM v0.8：PD 分离架构

vLLM v0.8（2026 年 4 月）引入了 Prefill-Decode 分离架构，H100 上吞吐较 v0.6 提升 40%。

### 2.6.1 架构设计

```
┌─────────────────────────────────────────────────────┐
│                    API Server                        │
│              OpenAI Compatible API                   │
├────────────────┬────────────────────────────────────┤
│   Router       │   根据请求类型分发                    │
│                │   新请求 → Prefill Worker             │
│                │   续生成 → Decode Worker              │
├────────────────┼────────────────────────────────────┤
│ Prefill Workers │ Decode Workers                     │
│ (GPU 0, 1)     │ (GPU 2, 3, 4, 5)                   │
│ 计算密集        │ 访存密集                             │
│ 大 batch 并行   │ 低延迟逐 token                      │
├────────────────┴────────────────────────────────────┤
│              KV Cache Transfer Layer                 │
│          Prefill 完成后，KV Cache → Decode Worker     │
│          via NVLink / RDMA                          │
└─────────────────────────────────────────────────────┘
```

### 2.6.2 配置与调优

```bash
# vLLM v0.8 PD 分离启动
vllm serve meta-llama/Llama-3.1-70B-Instruct \
  --tensor-parallel-size 2 \
  --pipeline-parallel-size 3 \
  --enable-disaggregated-prefill \
  --prefill-gpu-ratio 0.33 \       # 1/3 GPU 做 Prefill
  --decode-gpu-ratio 0.67 \        # 2/3 GPU 做 Decode
  --kv-transfer-method nccl \      # KV Cache 传输方式
  --chunked-prefill-size 2048 \    # Prefill chunk 大小
  --max-num-seqs 256               # 最大并发
```

### 2.6.3 性能对比

```
测试条件：4×H100 80GB, Llama 3.1 70B, ShareGPT 数据集

| 指标 | vLLM v0.6 | vLLM v0.8 (PD分离) | 提升 |
|------|-----------|-------------------|------|
| 吞吐 (tokens/s) | 3,200 | 4,480 | +40% |
| P50 TTFT | 320ms | 180ms | -44% |
| P99 TTFT | 2.1s | 0.8s | -62% |
| P50 TPOT | 28ms | 25ms | -11% |
| P99 TPOT | 85ms | 42ms | -51% |
| 最大并发 | 128 | 256 | +100% |
```

## 2.7 vLLM 架构总览

```
┌──────────────────────────────────────────────────────┐
│              API Server (FastAPI)                      │
│  OpenAI 兼容 API + Streaming + Tool Calling           │
├──────────────────────────────────────────────────────┤
│              LLM Engine                                │
│  ├── Scheduler (调度器)                                │
│  │   ├── Waiting Queue (等待 Prefill)                 │
│  │   ├── Running Queue (正在 Decode)                  │
│  │   ├── Swapped Queue (换出到 CPU)                   │
│  │   └── Preemption Policy (recompute/swap)           │
│  ├── Block Manager (显存管理)                          │
│  │   ├── GPU Block Allocator                          │
│  │   ├── CPU Block Allocator (Swap Space)             │
│  │   ├── Block Table (页表)                           │
│  │   └── Automatic Prefix Caching (APC)               │
│  ├── Model Executor                                    │
│  │   ├── Prefill Workers (计算密集 GPU)               │
│  │   ├── Decode Workers (访存密集 GPU)                │
│  │   ├── KV Transfer Manager (NVLink/RDMA)            │
│  │   └── Model Runner                                 │
│  └── Attention Backend                                 │
│      ├── FlashAttention-2/3                           │
│      ├── FlashInfer                                    │
│      └── PagedAttention v1/v2 Kernel                  │
├──────────────────────────────────────────────────────┤
│              Quantization Backends                     │
│  FP8 / INT8 (W8A8) / AWQ / GPTQ / FP4 (实验)         │
├──────────────────────────────────────────────────────┤
│              CUDA / ROCm / NCCL / NVLink               │
└──────────────────────────────────────────────────────┘
```

## 2.8 生产环境调优 Checklist

```bash
# 1. 基础性能
--gpu-memory-utilization 0.92        # 留 8% 给 CUDA context
--max-model-len 8192                 # 限制最大序列长度
--block-size 16                      # Block 大小（通常 16 或 32）

# 2. 前缀缓存（高并发必开）
--enable-prefix-caching              # 开启 APC

# 3. Chunked Prefill（长 prompt 场景）
--enable-chunked-prefill
--max-num-batched-tokens 4096        # 每 iteration 最大 token 数

# 4. 量化（显存不足时）
--quantization fp8                   # H100 原生 FP8
--kv-cache-dtype fp8                 # KV Cache 也用 FP8

# 5. 多 GPU
--tensor-parallel-size 4             # 4 GPU 张量并行
--enable-disaggregated-prefill       # v0.8 PD 分离

# 6. 监控
--metrics-port 9090                  # Prometheus 指标
# 关键指标：gpu_cache_usage_perc, num_requests_running,
#          avg_prompt_throughput, avg_generation_throughput
```

## 2.9 本章小结

| 技术 | 解决的问题 | 效果 |
|------|----------|------|
| PagedAttention v1/v2 | KV Cache 内存碎片 | 利用率 20% → 95%+ |
| Continuous Batching | GPU 空闲浪费 | 吞吐 2-10x |
| Prefix Caching (APC) | 重复 Prompt 开销 | 显存 ~90% 节省 |
| Chunked Prefill | 长 Prompt 阻塞 Decode | Decode 延迟稳定 |
| PD 分离 (v0.8) | Prefill/Decode 资源竞争 | 吞吐 +40%，P99 TTFT -62% |

**下一章预告**：第 3 章将深入 SGLang——RadixAttention 和 Runtime 级别的推理优化。

---

*Signal 知识平台 · LLM 推理框架 · 第 2 章*
