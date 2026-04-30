---
title: "第 6 章：Disaggregated Serving 与分布式推理"
description: "前沿推理架构全解：Prefill-Decode 分离、KV Cache Transfer、MoE 推理调度、Mooncake/DistServe/Splitwise 系统设计、多节点推理编排"
date: "2026-04-11"
updatedAt: "2026-04-12 00:00"
book: "LLM 推理框架：从原理到优化"
chapter: 6
chapterTitle: "Disaggregated Serving 与分布式推理"
tags: ["Disaggregated Serving", "分布式推理", "MoE", "PD分离", "Mooncake", "DistServe"]
type: "book"
---

# 第 6 章：Disaggregated Serving 与分布式推理

## 6.1 Prefill-Decode 分离架构

### 6.1.1 为什么要分离？

Prefill 和 Decode 两个阶段的计算特性截然不同，混合调度是性能的最大瓶颈：

```
Prefill 特性:                    Decode 特性:
  Compute-Bound                   Memory-Bound
  大矩阵乘法 (GEMM)               矩阵-向量乘 (GEMV)
  GPU 利用率 60-90%               GPU 利用率 5-15%
  延迟敏感 (TTFT)                  吞吐敏感 (TPS)
  短时高算力需求                    长时低算力需求
  
混在一起的问题:
  1. Prefill 的大计算量阻塞 Decode 请求的 token 输出（TPOT 飙升）
  2. Decode 的低 GPU 利用率拉低整体效率
  3. SLO 违规: Prefill 抢占导致 Decode 延迟不可控
  
  典型场景:
    用户 A: 发送 4K token prompt → Prefill 需要 2s
    用户 B: 正在生成第 50 个 token → 被 A 的 Prefill 阻塞
    结果: B 的 TPOT 从 30ms 飙升到 2000ms
```

### 6.1.2 分离架构设计

```
          ┌──────────────┐
          │   Router     │ ← 接收用户请求
          │  (调度器)     │
          └──────┬───────┘
                 │
    ┌────────────┴────────────┐
    ▼                          ▼
┌──────────┐            ┌──────────┐
│ Prefill  │            │  Decode  │
│  Pool    │    KV     │   Pool   │
│          │  Transfer │          │
│ H100×4   │ ───────→  │ H100×8   │
│ (高算力)  │  (RDMA)   │ (高并发)  │
└──────────┘            └──────────┘

资源配比策略:
  场景 1: 长 prompt + 短输出 (RAG/摘要)
    Prefill : Decode = 4 : 4
    
  场景 2: 短 prompt + 长输出 (代码生成)  
    Prefill : Decode = 2 : 6
    
  场景 3: 混合流量
    Prefill : Decode = 3 : 5
    动态弹性伸缩
```

### 6.1.3 KV Cache Transfer：分离架构的关键挑战

```
Prefill 节点完成后，需要把 KV Cache 传输到 Decode 节点:

KV Cache 大小估算 (Llama 3 70B, 4K prompt):
  每层: 2 (K+V) × 4096 (seq_len) × 1024 (8 KV heads × 128 dim) × 2 (FP16) = 16 MB
  80 层: 16 × 80 = 1.28 GB
  
传输方案对比:

方案 1: RDMA 直接传输 (推荐)
  Prefill GPU → NVLink → NIC → RDMA → NIC → Decode GPU
  带宽: 200-400 Gbps (InfiniBand HDR/NDR)
  10 GB 传输时间: ~200ms
  延迟: 可接受（Prefill 本身需要 1-2s）
  
方案 2: 通过 Host Memory 中转
  GPU → PCIe → Host → TCP/IP → Host → PCIe → GPU
  带宽: 25-100 Gbps
  10 GB 传输时间: ~800ms-3.2s
  延迟: 勉强可接受
  
方案 3: KV Cache 量化压缩传输
  FP16 → INT4 量化 → 传输 → Decode 端反量化
  压缩比: 4x
  10 GB → 2.5 GB → ~50ms (RDMA)
  代价: 轻微质量下降 (perplexity +0.1-0.3%)
  
方案 4: KV Cache 计算而非传输 (Mooncake)
  不传输 KV Cache，Decode 节点重新 Prefill 一小段
  适用: 短 prompt 场景
  延迟: Decode 端多 100-500ms
```

### 6.1.4 生产系统案例

```python
# DistServe (OSDI 2024) 架构
class DistServe:
    """Prefill-Decode 分离的推理系统"""
    
    def __init__(self, prefill_gpus, decode_gpus):
        self.prefill_pool = PrefillWorkerPool(prefill_gpus)
        self.decode_pool = DecodeWorkerPool(decode_gpus)
        self.kv_transfer = RDMAKVTransfer()
    
    async def serve(self, request):
        # 1. Prefill 阶段
        kv_cache, first_token = await self.prefill_pool.prefill(
            request.prompt,
            request.max_tokens
        )
        
        # 2. KV Cache 异步传输
        transfer_handle = self.kv_transfer.async_send(
            kv_cache, 
            target=self.decode_pool.get_idle_worker()
        )
        
        # 3. 边传输边开始 Decode（流水线化）
        yield first_token
        await transfer_handle.wait()
        
        # 4. Decode 阶段（在 Decode Pool 上）
        async for token in self.decode_pool.decode(
            request, kv_cache_ref=transfer_handle.ref
        ):
            yield token

# Splitwise (ISCA 2024): 
# 类似架构但在 Prefill Pool 内部用 TP，Decode Pool 用 DP
# 关键创新: 分离后 Prefill 吞吐提升 2.5x，Decode P99 延迟降低 3x
```

## 6.2 MoE 模型的推理挑战

### 6.2.1 MoE 推理 vs Dense 推理

```
Dense Model (Llama 3 70B):
  每个 token 都经过相同的 70B 参数
  所有 GPU 计算量相同 → 容易负载均衡
  TP=8: 每 GPU 均匀分担 70B/8 = 8.75B 参数
  
MoE Model (DeepSeek V3, 1T 参数, 2048 专家):
  每个 token 被路由到 8/2048 个专家
  激活参数: ~40B (远小于总参数)
  
  问题 1: 负载不均衡
    热门专家（如处理代码的专家）被频繁调用
    冷门专家（如处理小语种的专家）几乎空闲
    → GPU 间计算量差 3-5x
    
  问题 2: All-to-All 通信
    token 需要被发送到对应专家所在的 GPU
    通信模式不可预测（数据依赖路由）
    → 通信成为瓶颈
    
  问题 3: 显存压力
    1T 参数 × 2 bytes (FP16) = 2 TB
    即使 128 GPU (128 × 80GB = 10TB)，也需要精心放置
```

### 6.2.2 Expert Parallelism 推理策略

```python
# 策略 1: 纯 Expert Parallelism (EP)
# 每 GPU 放 2048/N 个专家
class ExpertParallelInference:
    """
    EP=256 (每 GPU 8 个专家):
    
    GPU 0: Expert 0-7
    GPU 1: Expert 8-15
    ...
    GPU 255: Expert 2040-2047
    
    推理流程:
    1. Router: 每个 token 选 Top-8 专家
    2. All-to-All: token dispatch 到目标 GPU
    3. Expert: 每个 GPU 处理本地专家
    4. All-to-All: 结果 combine 回来
    """
    
    def forward(self, hidden_states, router_logits):
        # 路由决策
        expert_indices = router_logits.topk(8).indices  # [batch, 8]
        
        # Dispatch: token → 目标 GPU
        dispatched = all_to_all_dispatch(hidden_states, expert_indices)
        
        # 本地专家计算
        local_output = self.local_experts(dispatched)
        
        # Combine: 结果 → 回到原始 GPU
        output = all_to_all_combine(local_output, expert_indices)
        return output

# 策略 2: EP + TP (专家内部再做张量并行)
# 当单个专家太大时使用
# EP=128, TP=2: 每 GPU 放 8 个专家，每个专家的参数跨 2 卡

# 策略 3: Expert Offloading (单卡推理 MoE)
class ExpertOffloading:
    """
    思路: GPU 只放 N 个活跃专家，其余放 CPU
    
    GPU (80GB): 放 Top-32 最热门专家 (约 40GB)
    CPU (512GB): 放剩余 2016 个专家
    
    Cache 命中: GPU 直接计算 (~1ms)
    Cache 未命中: CPU→GPU 传输 (~10ms) + 计算
    
    实际命中率: ~85-95% (热门专家稳定)
    平均延迟: ~2ms (vs 纯 GPU ~0.5ms)
    """
    
    def __init__(self, model, gpu_cache_size=32):
        self.gpu_experts = LRUCache(gpu_cache_size)
        self.cpu_experts = {}  # 所有专家
        
    def forward(self, hidden, expert_id):
        if expert_id in self.gpu_experts:
            return self.gpu_experts[expert_id](hidden)
        else:
            # 异步预取 + 计算
            expert = self.cpu_experts[expert_id].to('cuda', non_blocking=True)
            self.gpu_experts.put(expert_id, expert)
            return expert(hidden)

# 策略 4: Dynamic Expert Placement
# 根据实时流量统计动态调整专家位置
# 如果 Expert 42 被频繁调用 → 复制到多个 GPU
# 如果 Expert 1337 很少被调用 → 合并到更少的 GPU
```

### 6.2.3 DeepSeek V3 推理实战

```
DeepSeek V3 推理配置 (生产级):

硬件: 256 × H100 80GB (32 节点)
模型: 1T params, 2048 experts, 每 token 激活 8 experts

配置:
  EP = 256 (每 GPU 8 experts)
  Attention TP = 8 (每节点内 8 卡做 Attention 的 TP)
  
  单节点内:
    NVLink 900 GB/s (All-to-All dispatch/combine)
  
  跨节点:
    InfiniBand NDR 400 Gbps (All-to-All 跨节点通信)
  
  吞吐: ~50K tokens/sec (batch_size=256)
  延迟: TTFT ~500ms, TPOT ~25ms
  
优化技巧:
  1. Expert Parallelism + Tensor Parallelism 混合
     FFN (MoE): EP 跨所有 GPU
     Attention:  TP 在节点内 (NVLink 够快)
     
  2. 通信-计算重叠
     Layer N 的 All-to-All ←重叠→ Layer N-1 的 Expert Compute
     
  3. 动态批处理
     短请求优先 Decode，长请求分配更多 Prefill 资源
```

## 6.3 多节点推理的通信优化

### 6.3.1 大模型多节点部署方案

```
4 节点 32 GPU 推理 405B 模型:

方案 A: TP=8, PP=4 (流水线并行)
  节点 0: Layers 0-19   (TP=8, NVLink 通信)
  节点 1: Layers 20-39  (TP=8)
  节点 2: Layers 40-59  (TP=8)
  节点 3: Layers 60-79  (TP=8)
  
  节点间: PP P2P 通信 (IB 400Gbps)
  优点: 每节点只需 405B/4 ≈ 100B 参数的显存
  缺点: PP 引入 pipeline bubble (Decode 时每 token 串行过 4 节点)
  延迟: TPOT ~100ms (pipeline 延迟)

方案 B: TP=8, DP=4 (数据并行, 高吞吐)
  每个节点完整模型副本 (TP=8)
  不同节点处理不同请求
  无跨节点通信 → 最大吞吐
  
  前提: 每节点 8×80GB = 640GB > 405B×2=810GB → 需要 INT4 量化
  优点: 吞吐最高，延迟最低
  缺点: 需要量化 + 每节点显存要求高

方案 C: TP=32 (跨节点张量并行)
  所有 32 GPU 做 TP
  
  理论最优: 模型无需复制，显存效率最高
  实际问题: AllReduce 跨节点通信延迟太高
  不推荐 (除非有 NVSwitch/NVLink C2C)

推荐: 方案 B (能量化时) > 方案 A (不能量化时)
```

### 6.3.2 通信带宽计算

```python
# TP=8 AllReduce 通信量（每层每 token）
def tp_comm_per_layer(hidden_dim=8192, tp_size=8):
    """
    每层有 2 次 AllReduce（Attention 后 + FFN 后）
    每次 AllReduce: 2 × (tp-1)/tp × hidden_dim × 2 bytes (FP16)
    """
    allreduce_size = 2 * (tp_size - 1) / tp_size * hidden_dim * 2  # bytes
    return 2 * allreduce_size  # 2 次 per layer

# Llama 3 70B, TP=8:
per_layer = tp_comm_per_layer(8192, 8)  # ~28 KB
total_per_token = per_layer * 80  # 80 layers → ~2.24 MB

# NVLink 带宽: 900 GB/s
# 通信时间: 2.24 MB / 900 GB/s = 2.5 μs → 可以忽略

# InfiniBand 带宽: 50 GB/s (400 Gbps)
# 通信时间: 2.24 MB / 50 GB/s = 45 μs → 不可忽略！

# 结论: TP 只在 NVLink 内做，不跨节点
```

## 6.4 前沿系统：Mooncake (月饼)

Mooncake 是月之暗面（Kimi）开源的 PD 分离推理系统，其核心创新是 **以 KV Cache 为中心的调度**：

```
传统 PD 分离: 以请求为中心
  请求 → Prefill → 传输 KV → Decode
  
Mooncake: 以 KV Cache 为中心
  KV Cache 是一等公民，有独立的存储和调度层
  
  KV Cache Pool (分布式对象存储):
    ┌─────────────────────────────────────┐
    │  KV Cache Store (GPU + CPU + SSD)   │
    │  ├── Hot: GPU DRAM (最近的 session)  │
    │  ├── Warm: Host DRAM (最近 1 小时)   │
    │  └── Cold: NVMe SSD (历史 session)  │
    └─────────────────────────────────────┘
    
  好处:
  1. 多轮对话: KV Cache 不需要每次重新 Prefill
     用户 A 的第 5 轮对话 → 直接从 KV Store 加载前 4 轮的 KV
     节省: 4 轮 × 4K tokens × 2s = 8s Prefill 时间
     
  2. 跨请求复用: 相同 system prompt 的 KV Cache 共享
     100 个用户使用相同的 10K system prompt
     只 Prefill 1 次 → 100 个请求共享 KV Cache
     
  3. Session 恢复: 用户下次来直接从 SSD 加载
     不需要重新 Prefill 历史消息
```

## 6.5 推理成本优化总结

```
成本优化决策树:

延迟敏感型 (在线推理):
├── 单卡能放下模型？
│   ├── 是 → Continuous Batching + CUDA Graph
│   └── 否 → TP=N (NVLink 内)
├── 需要超大并发？
│   └── PD 分离 (DistServe/Splitwise)
└── MoE 模型？
    └── EP + TP 混合 + All-to-All 优化

吞吐敏感型 (离线推理):
├── 最大化 batch → DP + 大 batch
├── 显存不够？ → 量化 (INT4/INT8)
└── 单位成本最低？ → DeepSeek V3 + Expert Offloading

成本对比 (处理 100M tokens):
  GPT-5.4 API:     $1,000 (input) + $3,000 (output) = $4,000
  Claude 3.5 Sonnet:  $1,500 + $7,500 = $9,000
  自建 Llama 3 70B: ~$50 (GPU 时间)
  自建 DeepSeek V3: ~$30 (GPU 时间, MoE 高效)
```

## 6.6 本章小结

| 技术 | 解决的问题 | 状态 | 代表系统 |
|------|----------|------|---------|
| PD 分离 | Prefill/Decode 资源冲突 | 生产可用 | Splitwise, DistServe |
| KV Transfer | PD 分离后的数据传输 | RDMA 方案成熟 | Mooncake |
| KV Cache Pool | 多轮/跨请求 KV 复用 | 生产可用 | Mooncake, SGLang |
| MoE EP | 专家模型推理效率 | 活跃研究中 | DeepSeek, Mixtral |
| Expert Offloading | 单卡跑大 MoE | 慢但可用 | llama.cpp, DeepSeek |
| Dynamic Routing | 自适应专家放置 | 研究阶段 | — |

**关键要点：**
1. Prefill-Decode 分离是大规模 LLM 推理的必经之路
2. KV Cache 管理决定了推理系统的效率上限
3. MoE 推理的 All-to-All 通信是当前最大瓶颈
4. Mooncake 的 KV-centric 架构代表了推理系统的演进方向
5. 自建推理的成本可以是 API 的 1/100

---

*Signal 知识平台 · LLM 推理框架 · 第 6 章*
