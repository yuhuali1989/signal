---
title: "KVCache 分布式复用：从本地缓存到跨数据中心服务的架构演进"
date: "2026-04-20"
tags: ["KVCache", "推理优化", "分布式系统", "vLLM", "SGLang", "RDMA"]
summary: "深度解析 KVCache 从本地缓存演进为跨数据中心分布式服务的技术路径，覆盖 PrfaaS、FlexKV、LMCache 三大方案的架构设计与性能对比"
type: "article"
category: "infra"
---

# KVCache 分布式复用：从本地缓存到跨数据中心服务的架构演进

## 背景：KVCache 为何成为推理优化的关键瓶颈

大模型推理中，KVCache（Key-Value Cache）缓存了 Transformer 每一层的注意力键值对，避免 Decode 阶段重复计算历史 token 的注意力。对于 Llama 4 Maverick（400B 总参数）这样的模型，单条请求在 128K 上下文下的 KVCache 可达 **48GB**——几乎占满一张 H100 的显存。

传统做法是每张 GPU 独立管理自己的 KVCache，这导致了三个核心问题：

1. **显存浪费**：相同 System Prompt 的请求在不同 GPU 上重复计算和存储 KVCache
2. **冷启动延迟**：每条新请求都需从头计算 Prefill 阶段的 KVCache
3. **负载不均**：热门 Prompt 集中在少数 GPU 上，其他 GPU 空闲

2026 年 4 月，三个关键项目同时推进了 KVCache 分布式复用的技术前沿：PrfaaS、FlexKV 和 LMCache。

## 核心技术一：PrfaaS — Prefill as a Service

### 架构设计

PrfaaS（Moonshot AI 与清华大学联合提出）的核心思想是将 Prefill 和 Decode **完全解耦为两种独立的服务**：

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Prefill Nodes   │    │  KVCache Store   │    │  Decode Nodes    │
│  (计算密集型)     │───▶│  (RDMA 网络)     │───▶│  (显存密集型)     │
│  GPU-heavy       │    │  分布式 KV 存储   │    │  Memory-heavy    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

关键创新：

- **Prefill Node** 专门负责处理输入 Prompt 的注意力计算，生成 KVCache
- **KVCache Store** 是跨数据中心的分布式存储层，使用 RDMA 高速互联
- **Decode Node** 从 KVCache Store 拉取缓存，只负责逐 token 生成

### 性能数据

| 指标 | 传统 co-located | PrfaaS | 提升 |
|------|----------------|--------|------|
| 首 Token 延迟（TTFT） | 2.8s | 1.5s | -45% |
| 推理成本（$/M token） | $1.00 | $0.40 | -60% |
| GPU 利用率 | 35% | 78% | +123% |
| 1000 并发吞吐 | 1200 tok/s | 3400 tok/s | +183% |

### 核心代码示例

```python
# PrfaaS 伪代码：Prefill-Decode 解耦
class PrefillService:
    """专用 Prefill 服务，生成 KVCache 并写入分布式存储"""
    
    def __init__(self, model, kv_store: DistributedKVStore):
        self.model = model
        self.kv_store = kv_store
    
    async def prefill(self, request_id: str, input_ids: List[int]):
        # 1. 计算 Prefill 阶段的 KVCache
        kv_cache = self.model.forward_prefill(input_ids)
        
        # 2. 通过 RDMA 写入分布式 KVCache 存储
        cache_key = self.kv_store.compute_hash(input_ids)
        await self.kv_store.put(cache_key, kv_cache, ttl=300)
        
        # 3. 返回 cache_key 给调度器
        return cache_key

class DecodeService:
    """专用 Decode 服务，从分布式存储拉取 KVCache"""
    
    async def decode(self, cache_key: str, max_tokens: int):
        # 1. 通过 RDMA 拉取 KVCache（<1ms 延迟）
        kv_cache = await self.kv_store.get(cache_key)
        
        # 2. 基于 KVCache 逐 token 生成
        for _ in range(max_tokens):
            next_token, kv_cache = self.model.forward_decode(kv_cache)
            yield next_token
```

## 核心技术二：FlexKV — 跨框架 KVCache 复用

FlexKV（TACO Project 开源）聚焦于另一个痛点：**不同推理框架之间的 KVCache 格式不兼容**。vLLM 使用 PagedAttention 的 Block 格式，SGLang 使用 RadixAttention 的 Trie 格式，TensorRT-LLM 又有自己的连续内存布局。

### 统一抽象层

```python
# FlexKV 统一 KVCache 接口
class FlexKVAdapter:
    """跨框架 KVCache 适配器"""
    
    SUPPORTED_BACKENDS = ['vllm', 'sglang', 'tensorrt-llm']
    
    def __init__(self, backend: str, transfer_engine='mooncake'):
        self.backend = backend
        self.transfer = MooncakeTransferEngine() if transfer_engine == 'mooncake' else RDMAEngine()
    
    def export_kv(self, kv_cache, format='universal'):
        """将框架特定格式转换为通用格式"""
        if self.backend == 'vllm':
            # PagedAttention blocks -> contiguous tensor
            return self._flatten_paged_blocks(kv_cache)
        elif self.backend == 'sglang':
            # RadixAttention trie -> contiguous tensor
            return self._flatten_radix_trie(kv_cache)
        elif self.backend == 'tensorrt-llm':
            return kv_cache  # 已经是连续内存
    
    async def share_kv(self, kv_cache, target_node: str):
        """通过 RDMA 将 KVCache 传输到远程节点"""
        universal_kv = self.export_kv(kv_cache)
        await self.transfer.send(target_node, universal_kv)  # <1ms latency
```

### FlexKV vs LMCache 对比

| 特性 | FlexKV v0.4 | LMCache v1.2 |
|------|-------------|--------------|
| 框架支持 | vLLM + SGLang + TRT-LLM | vLLM + SGLang |
| 传输层 | Mooncake RDMA | 自研 TCP + 共享内存 |
| 跨节点延迟 | <1ms | 3-8ms |
| KVCache 压缩 | FP8 自动量化 | 无 |
| 淘汰策略 | LRU + 频率加权 | LRU |
| 集群规模 | 测试到 64 节点 | 测试到 16 节点 |
| 许可证 | Apache 2.0 | Apache 2.0 |

## 核心技术三：LMCache — 企业级 KVCache 管理

LMCache（来自 LMCache 团队的研究论文 arXiv:2510.09665）提供了更完整的企业级 KVCache 管理能力：

- **三级缓存层次**：GPU 显存 → CPU 内存 → SSD/NVMe
- **前缀匹配**：自动检测相同 System Prompt 的请求，共享 KVCache
- **调度感知**：与 vLLM 的 Scheduler 深度集成，预测 KVCache 需求

```python
# LMCache 三级缓存示例
class LMCacheManager:
    def __init__(self):
        self.gpu_cache = GPUCachePool(capacity_gb=40)   # L1: GPU HBM
        self.cpu_cache = CPUCachePool(capacity_gb=256)   # L2: CPU DRAM
        self.disk_cache = DiskCachePool(path='/nvme/kv')  # L3: NVMe SSD
    
    async def get_or_compute(self, prefix_tokens, model):
        cache_key = hash_tokens(prefix_tokens)
        
        # L1 命中：0.1ms
        if kv := self.gpu_cache.get(cache_key):
            return kv
        
        # L2 命中：1-2ms（PCIe 传输）
        if kv := self.cpu_cache.get(cache_key):
            self.gpu_cache.put(cache_key, kv)  # 提升到 L1
            return kv
        
        # L3 命中：5-10ms（NVMe 读取 + PCIe）
        if kv := self.disk_cache.get(cache_key):
            self.cpu_cache.put(cache_key, kv)
            self.gpu_cache.put(cache_key, kv)
            return kv
        
        # Cache Miss：完整 Prefill
        kv = model.forward_prefill(prefix_tokens)
        self.gpu_cache.put(cache_key, kv)
        return kv
```

## 实际效果：KVCache 复用的 ROI 分析

以一个典型的 RAG 应用场景为例（Llama 4 Maverick 400B，8xH100 集群）：

| 场景 | 无 KVCache 复用 | LMCache 本地 | FlexKV 分布式 | PrfaaS 全解耦 |
|------|----------------|-------------|-------------|-------------|
| 日均请求量 | 100K | 100K | 100K | 100K |
| 平均 TTFT | 3.2s | 1.8s | 1.1s | 0.8s |
| GPU 利用率 | 32% | 55% | 72% | 85% |
| 月度 GPU 成本 | $48,000 | $28,000 | $20,000 | $15,000 |
| 成本节省 | 基线 | -42% | -58% | -69% |

## 总结与展望

2026 年 4 月标志着 KVCache 管理从「单机优化」正式进入「分布式基础设施」阶段：

1. **PrfaaS** 解决了 Prefill-Decode 解耦的架构问题
2. **FlexKV** 解决了跨框架 KVCache 格式互通的工程问题
3. **LMCache** 解决了多级缓存层次管理的系统问题

三者并非竞争关系，而是可以组合使用：PrfaaS 做架构分层，FlexKV 做传输层，LMCache 做缓存管理。预计 2026 下半年，这种分布式 KVCache 架构将成为大规模推理部署的标准配置。

对于工程团队的建议：
- **小规模（<8 GPU）**：先用 LMCache 的本地前缀缓存，投入最低
- **中规模（8-32 GPU）**：部署 FlexKV 实现跨节点 KVCache 共享
- **大规模（>32 GPU / 多数据中心）**：采用 PrfaaS 的完全解耦架构

KVCache 已从推理引擎的内部实现细节，升级为需要独立设计和运维的基础设施组件。这一转变将深刻影响未来大模型推理的成本结构和架构选型。
