---
title: "第 3 章：SGLang 深度剖析——RadixAttention 与编程式推理"
description: "SGLang 的核心创新：RadixAttention 树状 KV Cache 复用、结构化生成约束、编程式 LLM 推理范式、与 vLLM 的架构差异、Dynamo 集成"
date: "2026-04-12"
updatedAt: "2026-04-15 11:00"
book: "LLM 推理框架：从原理到优化"
chapter: 3
chapterTitle: "SGLang 深度剖析——RadixAttention 与编程式推理"
tags: ["SGLang", "RadixAttention", "推理", "结构化生成"]
type: "book"
---

# 第 3 章：SGLang 深度剖析——RadixAttention 与编程式推理

## 3.1 SGLang 的定位与演进

SGLang = **S**tructured **G**eneration **Lang**uage，来自 LMSYS（UC Berkeley），核心差异化：

```
vLLM:   通用 LLM 推理引擎（重点在调度和显存管理）
SGLang: 结构化 + 编程式推理引擎（重点在前缀复用和约束生成）
TRT-LLM: 极致性能（NVIDIA 硬件深度优化）
Dynamo:  分布式编排（Prefill-Decode 分离调度）
```

### SGLang 的版本演进

| 版本 | 时间 | 关键特性 |
|------|------|---------|
| v0.1 | 2024-01 | RadixAttention + Python DSL |
| v0.2 | 2024-06 | FlashInfer backend + 多 GPU |
| v0.3 | 2025-01 | Speculative Decoding + JSON schema |
| v0.4 | 2025-09 | MoE 专家并行 + 长上下文优化 |
| v0.5 | 2026-03 | Dynamo 集成 + PD 分离 + FP4 |

### 为什么 SGLang 越来越重要？

2026 年的 LLM 应用不再是简单的"一问一答"。Agent 工作流、RAG pipeline、结构化输出（JSON/SQL/代码）成为主流。这些场景的共同特点是：

1. **大量前缀共享**：系统提示词、工具描述、检索文档
2. **结构化输出要求**：必须输出合法 JSON、SQL、API 调用
3. **多步推理**：一次任务触发 10+ 次 LLM 调用
4. **分支探索**：Tree-of-Thought、Best-of-N 采样

SGLang 在这些场景下的优势是其他框架难以匹敌的。

## 3.2 RadixAttention：树状 KV Cache 复用

### 3.2.1 核心思想

vLLM 的 Prefix Caching 只能复用**完全相同**的前缀。SGLang 用 **Radix Tree（基数树）** 存储所有请求的 KV Cache，实现**任意前缀**的复用：

```
场景：3 个请求共享部分前缀

请求 A: "You are a helpful assistant. Translate to Chinese: Hello"
请求 B: "You are a helpful assistant. Translate to Chinese: World"  
请求 C: "You are a helpful assistant. Summarize: ..."

Radix Tree:
                    "You are a helpful assistant."
                    (KV Cache: 共享！)
                           │
              ┌────────────┼─────────────┐
              ▼            ▼             ▼
      "Translate to    "Translate to   "Summarize:"
       Chinese: Hello"  Chinese: World"  (KV Cache 3)
       (KV Cache 1)    (KV Cache 2)

→ System Prompt "You are a helpful assistant." 的 KV 只计算一次
→ "Translate to Chinese:" 也被 A 和 B 共享
→ 树越深，复用越多
```

### 3.2.2 Radix Tree 的实现细节

```python
class RadixNode:
    """Radix Tree 节点：存储 token 序列片段和对应的 KV Cache"""
    def __init__(self):
        self.children: Dict[int, 'RadixNode'] = {}  # token_id → child
        self.kv_cache: Optional[KVCacheBlock] = None
        self.token_ids: List[int] = []  # 本节点存储的 token 序列
        self.ref_count: int = 0         # 引用计数
        self.last_access: float = 0.0   # LRU 时间戳

class RadixTree:
    """Radix Tree 管理器"""
    def __init__(self, max_total_tokens: int):
        self.root = RadixNode()
        self.total_cached_tokens = 0
        self.max_total_tokens = max_total_tokens
    
    def insert(self, token_ids: List[int], kv_cache: KVCacheBlock):
        """插入一个新的 token 序列和对应的 KV Cache"""
        node = self.root
        i = 0
        while i < len(token_ids):
            first_token = token_ids[i]
            if first_token in node.children:
                child = node.children[first_token]
                # 找到公共前缀长度
                match_len = common_prefix_length(
                    child.token_ids, token_ids[i:]
                )
                if match_len < len(child.token_ids):
                    # 需要分裂节点
                    self._split_node(child, match_len)
                i += match_len
                node = child
            else:
                # 创建新叶子节点
                new_node = RadixNode()
                new_node.token_ids = token_ids[i:]
                new_node.kv_cache = kv_cache
                node.children[first_token] = new_node
                break
        
        node.ref_count += 1
        node.last_access = time.time()
    
    def match_prefix(self, token_ids: List[int]) -> Tuple[int, KVCacheBlock]:
        """查找最长匹配前缀，返回匹配长度和 KV Cache"""
        node = self.root
        matched = 0
        last_kv = None
        
        i = 0
        while i < len(token_ids):
            first_token = token_ids[i]
            if first_token not in node.children:
                break
            child = node.children[first_token]
            match_len = common_prefix_length(
                child.token_ids, token_ids[i:]
            )
            if match_len == 0:
                break
            matched += match_len
            if child.kv_cache is not None:
                last_kv = child.kv_cache
            i += match_len
            node = child
        
        return matched, last_kv
    
    def evict_lru(self, target_free: int):
        """LRU 驱逐策略：优先驱逐引用计数为 0 的叶子节点"""
        candidates = self._get_leaf_nodes()
        candidates.sort(key=lambda n: (n.ref_count, n.last_access))
        
        freed = 0
        for node in candidates:
            if freed >= target_free:
                break
            if node.ref_count == 0:
                freed += len(node.token_ids)
                self._remove_node(node)
        
        return freed
```

### 3.2.3 与 vLLM Prefix Caching 的区别

| 特性 | vLLM APC | SGLang RadixAttention |
|------|:---:|:---:|
| 复用粒度 | Block 级别（16 tokens） | **Token 级别** |
| 数据结构 | Hash Map | **Radix Tree** |
| 多分支复用 | 需要完全匹配 | **部分前缀也能匹配** |
| LRU 驱逐 | 按 Block | 按树节点（叶子优先） |
| 内存开销 | O(blocks) | O(unique_prefixes) |
| 适合场景 | 固定 System Prompt | **多轮对话、Tree-of-Thought** |
| 最大收益场景 | 相同前缀大量请求 | **前缀有层次结构的请求** |

### 3.2.4 多轮对话的优势

```
多轮对话中，每轮都共享之前的历史：

Round 1: [System] + [User Q1] + [Assistant A1]
         ↓ 只需计算 System+Q1+A1 的 KV
Round 2: [System] + [User Q1] + [Assistant A1] + [User Q2] + [Assistant A2]
         ↓ 复用 Round 1 全部 KV，只计算 Q2+A2
Round 3: [System] + ... + [User Q3] + [Assistant A3]
         ↓ 复用 Round 2 全部 KV，只计算 Q3+A3

TTFT 对比（128K context）:
  无 Cache:       ~5000ms（每轮都重算全部）
  vLLM APC:       ~3000ms（只复用 system prompt）
  RadixAttention: ~200ms  （复用全部历史 KV！）
```

### 3.2.5 Tree-of-Thought 场景

```
问题: "解决数学问题 X"
     
     Root: "Let me think step by step..."
           │
     ┌─────┼──────────┐
     ▼     ▼          ▼
   方法A  方法B      方法C
   "First, "Using    "We can
    we can  algebra   apply..."
    try..." ..."      
     │       │         │
    ┌┴┐     ┌┴┐      ┌┴┐
    ▼ ▼     ▼ ▼      ▼ ▼
   A1 A2   B1 B2    C1 C2

总共 6 个叶子节点，但共享了大量前缀 KV Cache
RadixTree 自动管理这种树状结构的缓存
```

## 3.3 结构化生成（Constrained Generation）

### 3.3.1 编程式推理 DSL

```python
# SGLang 的编程式推理
import sglang as sgl

@sgl.function
def review_analyzer(s, review):
    s += "Analyze this review:\n" + review + "\n"
    
    # 强制输出 JSON 格式
    s += "Sentiment: " + sgl.gen("sentiment", 
                                  choices=["positive", "negative", "neutral"])
    
    s += "\nRating: " + sgl.gen("rating", regex=r"[1-5]")
    
    s += "\nSummary: " + sgl.gen("summary", max_tokens=50)

# 调用
result = review_analyzer.run(review="This product is amazing!")
print(result["sentiment"])  # "positive" — 保证在三选一中
print(result["rating"])     # "5" — 保证是 1-5 的数字
```

### 3.3.2 约束解码的实现

```
传统生成: 每个 token 从完整词表中采样
约束生成: 用有限状态机 (FSM) 限制可选 token

例：regex=r"[1-5]"

FSM 状态:
  State 0 (初始) → 只允许 token "1","2","3","4","5"
  State 1 (接受) → 结束

在 logits 层面:
  把不满足 FSM 约束的 token 的 logits 设为 -inf
  → softmax 后概率为 0
  → 保证输出满足约束
```

### 3.3.3 JSON Schema 约束

2026 年最常见的使用场景是**强制输出合法 JSON**：

```python
@sgl.function
def extract_entity(s, text):
    s += f"Extract entities from: {text}\n"
    s += "Output JSON:\n"
    s += sgl.gen("result", json_schema={
        "type": "object",
        "properties": {
            "entities": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "name": {"type": "string"},
                        "type": {"type": "string", "enum": ["PERSON", "ORG", "LOC"]},
                        "confidence": {"type": "number", "minimum": 0, "maximum": 1}
                    },
                    "required": ["name", "type"]
                }
            }
        },
        "required": ["entities"]
    })

# 输出保证是合法 JSON，且符合 schema
# 无需 retry 或后处理解析错误！
```

### 3.3.4 FSM 编译优化

SGLang 在首次遇到新的约束模式时会**预编译 FSM**，后续请求直接复用：

```python
class CompiledFSM:
    """预编译的有限状态机，用于约束解码"""
    def __init__(self, pattern: str, tokenizer):
        self.states = {}
        self.transitions = {}
        
        # 将 regex/JSON schema 编译为 FSM
        nfa = regex_to_nfa(pattern)
        dfa = nfa_to_dfa(nfa)
        
        # 预计算每个状态允许的 token 集合
        for state in dfa.states:
            allowed_tokens = set()
            for token_id, token_str in tokenizer.get_vocab().items():
                if dfa.can_transition(state, token_str):
                    allowed_tokens.add(token_id)
            self.allowed_tokens[state] = torch.tensor(
                list(allowed_tokens), dtype=torch.long
            )
    
    def get_mask(self, state: int, vocab_size: int) -> torch.Tensor:
        """返回当前状态的 token mask"""
        mask = torch.full((vocab_size,), float('-inf'))
        mask[self.allowed_tokens[state]] = 0.0
        return mask
```

**性能提升**：预编译 FSM 使得约束解码的额外开销从 ~5ms/token 降到 <0.1ms/token。

## 3.4 SGLang Runtime 架构

```
┌──────────────────────────────────────────────┐
│            SGLang Frontend (Python)           │
│  sgl.function / sgl.gen / fork / select       │
├──────────────────────────────────────────────┤
│            Interpreter + Compiler             │
│  解析 SGLang 程序 → 推理请求 DAG              │
│  分支(fork)展开、约束(schema)预编译           │
│  延迟调度 (lazy execution)                    │
├──────────────────────────────────────────────┤
│            Router (负载均衡)                   │
│  多 Worker 数据并行 + KV 亲和路由              │
│  RadixTree 感知：相似前缀路由到同一 Worker      │
├──────────────────────────────────────────────┤
│            Runtime Engine (Rust + CUDA)        │
│  ├── RadixAttention Manager                   │
│  │   └── Radix Tree + LRU Eviction            │
│  ├── Continuous Batching Scheduler             │
│  │   └── Chunked Prefill + PD 优先级          │
│  ├── FlashInfer Attention Backend              │
│  │   └── Ragged Tensor + PagedKV              │
│  ├── Constrained Decoding Engine               │
│  │   └── Compiled FSM + Token Mask             │
│  ├── Speculative Decoding (可选)               │
│  │   └── Eagle / Medusa / Draft Model          │
│  └── Quantization (FP8 / FP4 / AWQ)           │
├──────────────────────────────────────────────┤
│            Model Executor                      │
│  PyTorch 2.x + torch.compile + CUDA Graphs    │
│  NCCL (TP) + Gloo (DP)                        │
└──────────────────────────────────────────────┘
```

### 3.4.1 FlashInfer：SGLang 的注意力后端

SGLang 使用自研的 FlashInfer 作为注意力计算后端（而非 FlashAttention）：

```
FlashAttention vs FlashInfer:

FlashAttention:
  - 假设规则的 batch 形状
  - 每个请求长度相同（padding 到最长）
  - 对 continuous batching 不够友好

FlashInfer:
  - Ragged Tensor 原生支持不等长序列
  - PagedKV 原生支持（与 vLLM 的 PagedAttention 等价）
  - 支持 GQA/MQA/MLA 等各种注意力变体
  - 支持 prefix-aware 计算（跳过已缓存的前缀）
```

### 3.4.2 延迟执行优化

SGLang 的 Python DSL 使用**延迟执行**模式：

```python
@sgl.function
def multi_step_reasoning(s, question):
    s += f"Question: {question}\n"
    s += "Step 1: " + sgl.gen("step1", max_tokens=100)
    s += "\nStep 2: " + sgl.gen("step2", max_tokens=100)
    s += "\nAnswer: " + sgl.gen("answer", max_tokens=50)

# 三次 sgl.gen 不会立即执行
# SGLang Interpreter 会分析依赖关系
# 将可并行的部分合并为一个 batch
# 最小化 GPU kernel 启动次数
```

## 3.5 SGLang vs vLLM 性能对比

### 3.5.1 基准测试结果（Llama 3.1 70B, 4×H100）

| 场景 | SGLang 0.5 | vLLM 0.8 | 比值 | 原因 |
|------|:---:|:---:|:---:|------|
| 多轮对话 (10 轮) | 42 req/s | 15 req/s | **2.8×** | RadixAttention |
| 结构化输出 (JSON) | 38 req/s | 8 req/s | **4.75×** | FSM 约束解码 |
| Tree-of-Thought (8 分支) | 28 req/s | 9 req/s | **3.1×** | 树状 KV 复用 |
| 单轮长生成 (4K tokens) | 18 req/s | 17 req/s | 1.06× | 基本持平 |
| RAG (共享检索上下文) | 35 req/s | 22 req/s | **1.6×** | 前缀复用 |
| Batch 推理 (无共享) | 20 req/s | 21 req/s | 0.95× | vLLM 略快 |

### 3.5.2 选型建议

```
选择 SGLang 当:
  ✅ 大量多轮对话
  ✅ 需要结构化输出 (JSON/SQL/代码)
  ✅ Agent 工作流 (多步推理)
  ✅ Tree-of-Thought / Best-of-N
  ✅ 前缀复用率高 (>50%)

选择 vLLM 当:
  ✅ 简单的一问一答服务
  ✅ 模型兼容性要求高（vLLM 支持更多模型）
  ✅ 生产稳定性优先
  ✅ 需要与更多开源生态集成

选择 TRT-LLM 当:
  ✅ 极致单卡性能
  ✅ NVIDIA GPU 专属优化
  ✅ 部署后不频繁更换模型

选择 Dynamo 当:
  ✅ 大规模分布式推理（100+ GPU）
  ✅ 需要 Prefill-Decode 分离
  ✅ 需要自动扩缩容
```

## 3.6 SGLang 与 Dynamo 的集成（2026 新特性）

SGLang 0.5 引入了与 NVIDIA Dynamo 的集成，将 RadixAttention 的 KV Cache 管理能力与 Dynamo 的分布式调度结合：

```python
import sglang as sgl
from sglang.dynamo import DynamoIntegration

# SGLang + Dynamo 集成配置
engine = sgl.Engine(
    model="meta-llama/Llama-3.1-70B-Instruct",
    tp_size=4,
    
    # Dynamo PD 分离
    dynamo=DynamoIntegration(
        prefill_pool_size=4,    # 4 GPU 专门做 Prefill
        decode_pool_size=12,    # 12 GPU 专门做 Decode
        kv_transfer="rdma",     # RDMA 传输 KV Cache
    ),
    
    # RadixAttention 仍然生效
    radix_cache=True,
    max_radix_cache_tokens=1_000_000,
)
```

这种组合在大规模部署中展现了极强的性能：
- Prefill 阶段：Dynamo 的计算密集池处理
- Decode 阶段：SGLang 的 RadixAttention 管理 KV Cache
- KV Transfer：通过 RDMA 在两个池之间传输

## 3.7 LiteRT-LM：端侧 LLM 推理新标准（2026-04 新增）

### 3.7.1 端侧推理的碎片化问题

2026 年以前，端侧（移动端/边缘设备）LLM 推理缺乏统一框架：

| 方案 | 来源 | 支持硬件 | 局限 |
|------|------|----------|------|
| llama.cpp/GGUF | 社区 | CPU + Metal (Mac) | 移动端优化不足 |
| MLC LLM | CMU | ARM CPU/GPU | 模型覆盖有限 |
| MediaPipe LLM | Google | Android NPU | 仅限 Google 生态 |
| ONNX Runtime Mobile | Microsoft | ARM CPU | 缺乏量化优化 |
| ExecuTorch | Meta | ARM CPU/GPU/NPU | PyTorch 绑定 |

### 3.7.2 LiteRT-LM 架构

Google 于 2026 年 4 月开源 LiteRT-LM（原 TensorFlow Lite 的 LLM 演进版），提供统一的端侧 LLM 推理方案：

```
┌─────────────────────────────────────────────────────┐
│              LiteRT-LM Architecture                  │
├─────────────────────────────────────────────────────┤
│  Unified API Layer                                   │
│  ├── Text Generation API                             │
│  ├── Embedding API                                   │
│  └── Multi-Modal API (text + image + audio)          │
├─────────────────────────────────────────────────────┤
│  Optimization Layer                                  │
│  ├── Dynamic Quantization (4-bit / 8-bit)            │
│  │   └── QAT-aware + PTQ 自适应选择                  │
│  ├── KV Cache Dynamic Paging                         │
│  │   └── 移动端内存受限下的按需分页                    │
│  ├── Speculative Decoding (Lite)                     │
│  │   └── 草稿模型 = 同模型低精度版本                  │
│  └── Flash Attention Lite                            │
│      └── 针对 ARM NEON/SVE 优化的注意力实现           │
├─────────────────────────────────────────────────────┤
│  Hardware Abstraction Layer (HAL)                     │
│  ├── ARM CPU (NEON / SVE / SVE2)                     │
│  ├── ARM Mali / Adreno GPU (OpenCL/Vulkan)           │
│  ├── Qualcomm Hexagon DSP / NPU                     │
│  ├── MediaTek APU                                    │
│  ├── Google Tensor TPU (Pixel 10+)                   │
│  └── Apple ANE (experimental)                        │
└─────────────────────────────────────────────────────┘
```

### 3.7.3 端侧性能基准

Gemma 4 E2B (2B 参数) 在不同设备上的推理性能：

| 设备 | 芯片 | 量化 | 首 Token 延迟 | 吞吐 | 内存占用 |
|------|------|------|-------------|------|---------|
| Pixel 10 Pro | Tensor G5 + TPU | INT4 | 180ms | 52 tok/s | 1.2 GB |
| Samsung Galaxy S25 Ultra | Snapdragon 8 Gen 5 | INT4 | 210ms | 45 tok/s | 1.3 GB |
| NVIDIA Orin NX | Orin (边缘) | INT8 | 85ms | 120 tok/s | 2.1 GB |
| Raspberry Pi 6 | ARM Cortex-A78 | INT4 | 1200ms | 8 tok/s | 1.4 GB |

### 3.7.4 与云端框架的关系

```
端侧请求 → LiteRT-LM (本地推理)
    │
    ├── 简单任务：本地完成（隐私、低延迟）
    │
    └── 复杂任务：上传到云端
         ├── SGLang (Agent 工作流)
         ├── vLLM (通用推理)
         └── Dynamo (大规模分布式)

关键：LiteRT-LM 不替代云端框架，而是形成「端-云协同」推理架构
```

## 3.8 AMD ROCm 推理生态突破（2026 新进展）

### 3.8.1 从"纸面竞争"到"供应链选项"

AMD MI450 于 2026 年 4 月正式量产（注：此信息待核实，截至本文 AMD MI300X 为最新量产型号；CDNA 5 架构，HBM4 768GB，FP4 4.8 PetaFLOPS），标志着 GPU 推理不再是 NVIDIA 独占：

```
2024 年: AMD MI300X 发布 → 性能好但 ROCm 兼容性差 → "能用但不好用"
2025 年: ROCm 6.x + vLLM 初步支持 → "基本可用"
2026 年: ROCm 7.0 + vLLM/SGLang 原生支持 + 4 万片大单 → "正式选项"
```

### 3.8.2 ROCm 7.0 推理框架支持状态

| 框架 | 支持程度 | 性能对比 (vs H200 CUDA) | 备注 |
|------|----------|----------------------|------|
| **vLLM** | ✅ 原生支持 | ~90% | 最成熟的 ROCm 推理选项 |
| **SGLang** | ✅ 原生支持 | ~85% | RadixAttention 在 HIP 上需优化 |
| **PyTorch** | ✅ 零代码迁移 | ~95% | torch.compile 在 ROCm 上效果好 |
| **TRT-LLM** | ❌ 不支持 | — | NVIDIA 专属 |
| **Dynamo** | ⚠️ 实验性 | ~70% | NCCL 替代方案 RCCL 仍不稳定 |
| **ONNX Runtime** | ✅ 支持 | ~80% | 静态图部署方案 |

### 3.8.3 选型建议更新

```
2026 年推理硬件选型:

NVIDIA H200/B200:
  ✅ 生态最成熟，所有框架支持
  ✅ TRT-LLM 极致性能
  ❌ 供应紧张，价格高
  推荐: 追求极致性能和生态完整性

AMD MI450（注：此信息待核实，参见上方说明）:
  ✅ 显存更大 (768GB vs 192GB)
  ✅ FP4 推理性能优异
  ✅ 价格竞争力强
  ❌ ROCm 生态仍有差距
  推荐: 大显存需求（长上下文、大 batch）、成本敏感场景

Google TPU v6 (Trillium):
  ✅ 推理性价比最优
  ✅ XLA 编译优化
  ❌ 仅限 GCP
  推荐: Google Cloud 用户
```

## 3.9 本章小结

| 技术 | 核心价值 | 适用场景 |
|------|---------|---------|
| **RadixAttention** | 任意前缀复用，多轮对话零冗余 | 多轮对话、Agent、共享上下文 |
| **结构化生成** | FSM 约束保证输出格式 | JSON/SQL/API 调用 |
| **编程式推理** | Python DSL 编排复杂推理流程 | 多步推理、分支探索 |
| **FlashInfer** | Ragged Tensor + PagedKV 原生支持 | 不等长序列高效计算 |
| **Dynamo 集成** | PD 分离 + KV 路由 | 大规模分布式部署 |
| **LiteRT-LM** | 端侧统一推理框架 | 移动端/边缘设备本地推理 |
| **ROCm 7.0** | AMD GPU 推理生态成熟 | 大显存、成本敏感场景 |

**SGLang 的哲学**：推理不仅是"跑模型"，而是"编程式地使用模型"。这种思维方式正在重塑 LLM 推理的基础设施。

---

## 3.10 最新进展（2026 年 4 月更新）

### 推理引擎格局演变：四强争霸与分工明确

2026 年 4 月的"模型发布大爆炸"（两周内 Meta/阿里/Google/OpenAI/Anthropic 同时发布重大更新）对推理引擎格局产生了深远影响。关键变化：

**vLLM 0.8 的 MoE 突破**：vLLM 0.8 通过 Expert Parallel Scheduling 技术将 MoE 模型推理吞吐提升 40%，原生支持 Llama 4 Scout（10M 上下文、16 专家）和 Qwen 3 全系列。Spheron H100 基准显示，在 64+ 并发请求下 vLLM 吞吐量较 SGLang 高约 15%。

**SGLang 的差异化优势更加清晰**：
- **RadixAttention 在 Agent 场景的核心价值**：随着 MCP 协议生态成熟和 Anthropic 推出 Managed Agents 云服务，多轮 Agent 对话场景爆发式增长。SGLang 的前缀共享和结构化生成在这一场景中无可替代——多轮对话 TTFT 降至首轮的 30%。
- **单请求延迟仍有优势**：SGLang 在 TTFT 上比 vLLM 0.8 快 10-20%，对延迟敏感的交互式 Agent 场景更合适。

**2026 年 4 月推理引擎选型矩阵**：

| 场景 | 首选引擎 | 理由 |
|------|---------|------|
| 高并发 API（batch≥64） | vLLM 0.8 | MoE 吞吐最优 |
| Agent 多轮对话 | SGLang | RadixAttention 前缀共享 |
| 极致 P99 延迟 | TensorRT-LLM | CUDA Graph 优化 |
| 本地开发/实验 | Ollama | 一键部署 |
| 结构化输出（JSON/SQL） | SGLang | FSM 约束原生支持 |

### Speculative Decoding 2.0 与动态 Token 树

vLLM 0.8 引入的 Speculative Decoding 2.0 值得关注：草稿模型不再线性生成 token 序列，而是生成一棵 token 树（每步分叉 2-4 个候选），目标模型一次性验证整棵树。这将草稿验证延迟降低 25%，接受率从 72% 提升到 81%（Qwen 3 72B → 0.6B 配对）。

SGLang 社区也在跟进类似的树形推测方案，预计在下一版本中支持。

### 推理成本暴跌与开源 MoE 民主化

斯坦福 HAI 2026 AI Index 报告确认：AI 推理成本过去 18 个月下降超 90%。这一数据的背后，推理引擎的 MoE 优化贡献巨大——Llama 4 Scout（109B 总参数/13B 活跃参数）在 vLLM 0.8 + 单卡 H100 上可达 2590 tokens/s 的吞吐，使得开源 MoE 大模型在生产环境中的部署成本首次低于同级别闭源 API。

---

*Signal 知识平台 · LLM 推理框架 · 第 3 章*
