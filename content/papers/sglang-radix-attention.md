---
title: "SGLang: Efficient Execution of Structured Language Model Programs"
authors: "Lianmin Zheng, Liangsheng Yin, Zhiqiang Xie, et al. (UC Berkeley / LMSYS)"
venue: "NeurIPS 2024 / ICLR 2025 Workshop"
date: "2024-09-12"
tags: ["推理优化", "LLM推理", "KV Cache", "RadixAttention", "推理框架"]
tldr: "SGLang 通过 RadixAttention 实现 KV Cache 自动前缀共享，在多轮对话和 RAG 场景下推理吞吐提升 4.4x，同时提出结构化生成语言 SGLang DSL 简化复杂 LLM 程序编写。"
importance: 5
---

# SGLang: Efficient Execution of Structured Language Model Programs

## 一句话总结（TL;DR）

SGLang 通过 **RadixAttention**（基数树 KV Cache 共享）和结构化生成语言，将多轮对话/RAG/Agent 场景的推理吞吐提升 **4.4x**，成为与 vLLM 并列的主流开源推理框架。

---

## 研究背景与动机

### 问题：现有推理框架的两大痛点

**痛点 1：KV Cache 利用率低**

在 RAG、多轮对话、Agent 等场景中，大量请求共享相同的前缀（系统提示、文档上下文、工具定义）。以 RAG 为例：

```
请求 1：[系统提示(500 tokens)] + [文档A(2000 tokens)] + [问题1(50 tokens)]
请求 2：[系统提示(500 tokens)] + [文档A(2000 tokens)] + [问题2(50 tokens)]
请求 3：[系统提示(500 tokens)] + [文档B(2000 tokens)] + [问题3(50 tokens)]
```

请求 1 和 2 共享 2500 tokens 的前缀，但 vLLM 等框架无法自动识别和复用这部分 KV Cache，导致大量重复计算。

**痛点 2：复杂 LLM 程序难以表达**

Agent 工作流、多步骤推理、结构化输出等复杂 LLM 程序，需要开发者手动管理状态、处理并发、优化批处理，代码复杂度极高。

### 动机：统一解决两个问题

SGLang 的核心洞察是：**KV Cache 共享和程序表达是同一个问题的两面**——如果能在语言层面表达 LLM 程序的结构，就能在运行时自动识别可共享的 KV Cache。

---

## 核心方法

### 方法 1：RadixAttention——基数树 KV Cache 共享

#### 数据结构设计

RadixAttention 使用**基数树（Radix Tree）**组织 KV Cache，树的每个节点对应一段 token 序列的 KV Cache：

```
基数树结构示例：

根节点
├── "你是一个专业的AI助手。" (系统提示，500 tokens)
│   ├── "以下是相关文档：[文档A]" (2000 tokens)
│   │   ├── "问题1：..." → KV Cache 节点 A1
│   │   └── "问题2：..." → KV Cache 节点 A2
│   └── "以下是相关文档：[文档B]" (2000 tokens)
│       └── "问题3：..." → KV Cache 节点 B1
└── "你是一个代码助手。" (另一个系统提示)
    └── ...
```

**关键操作**：
- **前缀匹配**：新请求到来时，在基数树中查找最长公共前缀，复用对应的 KV Cache
- **LRU 淘汰**：内存不足时，淘汰最近最少使用的叶节点
- **写时复制**：多个请求共享同一前缀节点，修改时创建副本

#### 算法复杂度

$$\text{KV Cache 命中率} = \frac{\sum_{i} \text{共享前缀长度}_i}{\sum_{i} \text{总输入长度}_i}$$

在 RAG 场景（文档平均 2000 tokens，问题平均 50 tokens）中：

$$\text{命中率} \approx \frac{2000}{2000 + 50} \approx 97.6\%$$

即 97.6% 的 KV Cache 可以被复用，计算量减少约 97.6%。

#### 实现细节

```python
class RadixCache:
    """基数树 KV Cache 管理器（简化版）"""
    
    def __init__(self, max_size_gb: float = 40.0):
        self.root = RadixNode()
        self.max_size = max_size_gb * 1024**3  # 转换为字节
        self.current_size = 0
        self.lru_queue = []
    
    def match_prefix(self, token_ids: list) -> tuple[int, RadixNode]:
        """
        在基数树中查找最长公共前缀
        返回：(匹配长度, 最后匹配节点)
        """
        node = self.root
        matched_len = 0
        
        while matched_len < len(token_ids):
            # 查找当前节点的子节点中是否有匹配的前缀
            next_token = token_ids[matched_len]
            if next_token not in node.children:
                break
            
            child = node.children[next_token]
            # 检查子节点的 token 序列是否与输入匹配
            child_len = len(child.token_ids)
            remaining = token_ids[matched_len:]
            
            if remaining[:child_len] == child.token_ids:
                matched_len += child_len
                node = child
                self.lru_queue.remove(child)
                self.lru_queue.append(child)  # 更新 LRU
            else:
                # 部分匹配：需要分裂节点
                split_pos = self._find_split_pos(remaining, child.token_ids)
                node = self._split_node(node, child, split_pos)
                matched_len += split_pos
                break
        
        return matched_len, node
    
    def insert(self, token_ids: list, kv_cache: torch.Tensor):
        """插入新的 KV Cache 到基数树"""
        matched_len, last_node = self.match_prefix(token_ids)
        
        if matched_len == len(token_ids):
            return  # 已存在，无需插入
        
        # 插入剩余部分
        remaining_tokens = token_ids[matched_len:]
        remaining_kv = kv_cache[matched_len:]
        
        new_node = RadixNode(
            token_ids=remaining_tokens,
            kv_cache=remaining_kv
        )
        last_node.children[remaining_tokens[0]] = new_node
        self.lru_queue.append(new_node)
        
        # 检查内存，必要时淘汰
        self.current_size += remaining_kv.nbytes
        while self.current_size > self.max_size:
            self._evict_lru()
```

### 方法 2：SGLang DSL——结构化生成语言

SGLang 提供了一个 Python 嵌入式 DSL，用于表达复杂的 LLM 程序：

```python
from sglang import function, system, user, assistant, gen, select

@function
def multi_turn_qa(s, document, questions):
    """多轮问答：共享文档上下文"""
    s += system("你是一个专业的文档分析助手。")
    s += user(f"请仔细阅读以下文档：\n{document}")
    s += assistant(gen("ack", max_tokens=50))
    
    answers = []
    for question in questions:
        s += user(question)
        s += assistant(gen(f"answer_{len(answers)}", max_tokens=200))
        answers.append(s[f"answer_{len(answers)-1}"])
    
    return answers

# 运行时自动识别：所有问题共享文档的 KV Cache
results = multi_turn_qa.run(
    document="[长文档内容...]",
    questions=["问题1", "问题2", "问题3"],
    backend="sglang"
)
```

**关键优化**：SGLang 运行时分析程序结构，自动将 `document` 部分的 KV Cache 在三个问题间共享，无需开发者手动管理。

---

## 关键实验结果

### 实验 1：RAG 场景吞吐对比

| 框架 | 吞吐量 (req/s) | 相对提升 |
|------|--------------|---------|
| vLLM (无前缀缓存) | 1.0x (基准) | — |
| vLLM (有前缀缓存) | 2.1x | +110% |
| **SGLang (RadixAttention)** | **4.4x** | **+340%** |

测试条件：LLaMA-3-70B，文档长度 2000 tokens，问题长度 50 tokens，并发 100 请求。

### 实验 2：多轮对话场景

| 对话轮数 | vLLM 延迟 (ms) | SGLang 延迟 (ms) | SGLang 优势 |
|---------|--------------|----------------|------------|
| 1 轮 | 245 | 238 | -3% |
| 5 轮 | 1,180 | 520 | -56% |
| 10 轮 | 2,340 | 680 | -71% |
| 20 轮 | 4,680 | 890 | -81% |

随着对话轮数增加，SGLang 的优势越来越显著，因为历史对话的 KV Cache 被完全复用。

### 实验 3：Agent 工具调用场景

```
测试场景：ReAct Agent，平均 8 步推理，每步调用 1-3 个工具
工具定义：2000 tokens（所有步骤共享）

SGLang vs vLLM：
- 吞吐量：SGLang 3.8x
- 首 token 延迟：SGLang -65%
- GPU 利用率：SGLang 78% vs vLLM 45%
```

### 实验 4：SGLang 0.5 最新基准（2026-04）

| 场景 | SGLang 0.5 | vLLM 0.8 | 差异 |
|------|-----------|---------|------|
| 单请求延迟 (TTFT) | 142ms | 168ms | SGLang -15% |
| 高并发吞吐 (100 req/s) | 2,840 tok/s | 3,210 tok/s | vLLM +13% |
| RAG 场景吞吐 | 4,120 tok/s | 2,890 tok/s | SGLang +43% |
| KV Cache 命中率 | 82% | 71% | SGLang +11pp |

---

## 创新点分析

### 与前人工作的区别

| 方面 | PagedAttention (vLLM) | Prefix Caching (vLLM) | **RadixAttention (SGLang)** |
|------|----------------------|----------------------|---------------------------|
| KV Cache 组织 | 分页（固定大小块） | 哈希前缀匹配 | 基数树（动态前缀树） |
| 前缀共享粒度 | 无 | 完整前缀 | 任意公共前缀 |
| 动态前缀处理 | 不支持 | 不支持 | 支持（节点分裂） |
| 内存效率 | 中等 | 高（相同前缀） | 最高（任意前缀） |
| 实现复杂度 | 低 | 中 | 高 |

**核心创新**：基数树支持**任意公共前缀**的共享，而不仅仅是完整相同的前缀。这使得即使两个请求只有部分前缀相同，也能复用对应的 KV Cache。

---

## 局限性与未来方向

### 当前局限性

1. **内存开销**：基数树本身需要额外内存存储树结构，在短请求场景下开销相对较大
2. **写时复制成本**：节点分裂操作有额外计算开销，在前缀变化频繁的场景下效果有限
3. **分布式支持**：多机多卡场景下的 KV Cache 共享仍是挑战

### 未来方向

- **跨请求 KV Cache 持久化**：将热点 KV Cache 持久化到 SSD，跨请求复用
- **分布式 RadixAttention**：在多节点集群中共享 KV Cache
- **自适应淘汰策略**：基于访问频率和计算成本的智能淘汰

---

## 对工程实践的启示

### 1. 场景选择：何时用 SGLang，何时用 vLLM

```
优先选 SGLang 的场景：
├── RAG（文档上下文长，问题短）
├── 多轮对话（历史上下文复用）
├── Agent 工作流（工具定义共享）
└── 批量文档处理（相同系统提示）

优先选 vLLM 的场景：
├── 高并发单次请求（无前缀共享）
├── 流式生成（实时响应优先）
└── 超大模型（vLLM 的 tensor parallel 更成熟）
```

### 2. 最大化 RadixAttention 收益的设计原则

```python
# 好的设计：将共享内容放在前缀
def good_rag_prompt(system_prompt, document, question):
    return f"{system_prompt}\n\n文档：{document}\n\n问题：{question}"
    # 系统提示 + 文档 = 共享前缀，可被 RadixAttention 复用

# 差的设计：将变化内容放在前缀
def bad_rag_prompt(question, document, system_prompt):
    return f"问题：{question}\n\n文档：{document}\n\n{system_prompt}"
    # 问题在最前面，每个请求前缀不同，无法复用
```

### 3. 监控 KV Cache 命中率

```python
import sglang as sgl

# 启动时开启监控
runtime = sgl.Runtime(
    model_path="meta-llama/Llama-3-70b-instruct",
    enable_radix_cache=True,
    log_level="info"  # 会输出 KV Cache 命中率统计
)

# 定期检查命中率
stats = runtime.get_server_info()
hit_rate = stats["cache_hit_rate"]
print(f"KV Cache 命中率: {hit_rate:.1%}")

# 如果命中率 < 50%，考虑：
# 1. 检查是否将共享内容放在了前缀位置
# 2. 增加 KV Cache 内存分配
# 3. 评估是否适合 SGLang 场景
```

---

> **总结**：SGLang 的 RadixAttention 是推理优化领域的重要创新，通过基数树实现了任意公共前缀的 KV Cache 共享，在 RAG 和 Agent 场景下吞吐提升 4.4x。对于工程团队，选择 SGLang 还是 vLLM 的关键在于：**是否有大量请求共享相同前缀**——如果有，SGLang 是更好的选择；如果没有，两者性能相近。
