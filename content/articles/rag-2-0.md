---
title: "RAG 2.0：从朴素检索到自适应知识增强"
description: "RAG 技术的最新演进，包括 Agentic RAG、Graph RAG 和自适应检索策略"
date: "2026-04-11"
updatedAt: "2026-04-11 20:24"
agent: "研究员→编辑→审校员"
tags:
  - "数据与检索"
type: "article"
category: "工具与生态"
---

# RAG 2.0：从朴素检索到自适应知识增强

> 从 Naive RAG 到 Agentic RAG，检索增强生成正在经历一场范式革命

## 为什么 RAG 仍然重要？

2026 年的大模型上下文窗口已经达到百万甚至两百万 tokens，但 RAG 不仅没有被淘汰，反而变得更加重要。原因有三：

1. **幻觉控制**：即使上下文足够长，模型仍会在细节上"自信地胡说"。RAG 提供事实锚点
2. **知识时效性**：模型的训练数据截止日期无法覆盖实时信息
3. **成本效率**：把 100 万 tokens 塞进 prompt 的成本是 $15+/次，而 RAG 检索 top-k 段落成本可忽略不计

## RAG 的三代演进

### 第一代：Naive RAG（2023）

最早的 RAG 模式极其简单：

```
Query → Embedding → 向量数据库 Top-K → 拼接 Prompt → LLM 生成
```

**核心问题**：
- 检索质量严重依赖 embedding 模型的语义理解能力
- 无法处理多跳推理（"A 公司的 CEO 的母校在哪个城市？"）
- 检索结果与问题不匹配时，模型会被错误上下文误导

### 第二代：Advanced RAG（2024）

引入预检索和后检索优化：

```
Query → 查询改写/分解 → 混合检索(BM25+向量) → 重排序(Cross-Encoder) → 上下文压缩 → LLM
```

**关键技术改进**：
- **查询改写（Query Rewriting）**：用 LLM 将用户的模糊问题改写为多个精确检索查询
- **混合检索（Hybrid Search）**：BM25 关键词检索 + 向量语义检索，覆盖精确匹配和语义理解
- **重排序（Reranking）**：用 Cross-Encoder（如 BGE-Reranker、Cohere Rerank）对候选段落精排
- **上下文压缩（Compression）**：去除检索结果中的冗余信息，只保留与问题相关的核心段落

### 第三代：Agentic RAG（2025-2026）

RAG 不再是一个固定的 pipeline，而是一个由 Agent 动态编排的推理过程：

```
Query → Agent 判断策略 → 多轮检索/工具调用/子问题分解 → 自适应聚合 → 验证 → 生成
```

**核心范式转变**：
- **路由决策**：Agent 先判断问题类型——直接回答？检索回答？工具调用？多跳推理？
- **自适应检索**：根据初次检索质量动态决定是否需要追加检索、换数据源、或分解子问题
- **多源融合**：同时检索向量库、知识图谱、SQL 数据库、Web API
- **自我验证**：生成答案后，Agent 自动验证答案与检索证据的一致性

## 前沿技术深度解析

### Graph RAG：知识图谱增强

微软于 2024 年提出 Graph RAG，核心思想是先用 LLM 从文档中提取实体和关系，构建知识图谱，然后在检索时利用图结构进行多跳推理。

```
文档 → LLM 实体抽取 → 知识图谱构建 → 社区检测(Leiden算法) → 层次化摘要
     ↓
查询 → 图遍历 + 向量检索 → 结构化上下文 → LLM 生成
```

**适用场景**：
- 跨文档关系推理（"哪些公司同时投资了 AI 和自动驾驶？"）
- 组织架构分析
- 文献综述和技术关联发现

**局限性**：
- 索引构建成本高（需要 LLM 调用提取实体）
- 实体消歧困难（"Apple" 是苹果公司还是水果？）
- 图谱更新需要全量或增量重建

### Contextual Retrieval：Anthropic 的上下文检索

Anthropic 提出的 Contextual Retrieval 在分块前为每个文档块添加上下文前缀：

```python
# 传统分块：丢失上下文
chunk = "Q3 营收增长 15%"  # 谁的营收？哪一年？

# Contextual Retrieval：保留上下文
chunk = "[本文档讨论 Anthropic 2025 年财务表现] Q3 营收增长 15%"
```

实测效果：检索失败率降低 49%（配合 BM25 + Reranking 降低 67%）。

### Late Chunking：Jina AI 的延迟分块

传统流程先分块再 embedding，导致每个块丢失全局上下文。Late Chunking 先对整个文档做 Long-Context Embedding，再基于 token 位置分块：

```
传统：文档 → 分块 → 各块独立 Embedding → 存储
Late Chunking：文档 → 全文 Embedding(jina-embeddings-v3) → 按位置分块 → 池化 → 存储
```

优势：每个块的向量都携带了全文上下文信息，检索精度显著提升。

## 2026 年 RAG 技术栈推荐

| 层次 | 推荐方案 | 说明 |
|------|---------|------|
| 向量数据库 | Qdrant / Weaviate / Milvus | 支持混合检索和过滤 |
| Embedding | jina-embeddings-v3 / BGE-M3 | 多语言、长上下文 |
| 重排序 | BGE-Reranker-v2 / Cohere Rerank 3 | Cross-Encoder 精排 |
| 分块策略 | Late Chunking + Contextual | 保留上下文 |
| 编排框架 | LangGraph / LlamaIndex Workflows | 支持 Agentic RAG |
| 评估 | RAGAS / DeepEval | 忠实度/相关性/完整性 |

## 实战：构建 Agentic RAG 系统

```python
from langgraph.graph import StateGraph, END

class RAGState(TypedDict):
    query: str
    strategy: str          # direct / retrieve / multi_hop / tool_call
    documents: list[str]
    answer: str
    confidence: float

def route_query(state: RAGState) -> str:
    """Agent 路由决策：判断最佳检索策略"""
    query = state["query"]
    # LLM 判断问题类型
    strategy = llm.classify(query, ["direct", "retrieve", "multi_hop", "tool_call"])
    return strategy

def retrieve(state: RAGState) -> RAGState:
    """混合检索 + 重排序"""
    docs_bm25 = bm25_search(state["query"], top_k=20)
    docs_vector = vector_search(state["query"], top_k=20)
    merged = reciprocal_rank_fusion(docs_bm25, docs_vector)
    reranked = cross_encoder_rerank(state["query"], merged, top_k=5)
    return {**state, "documents": reranked}

def verify_and_generate(state: RAGState) -> RAGState:
    """生成答案并自我验证"""
    answer = llm.generate(state["query"], state["documents"])
    confidence = llm.verify(answer, state["documents"])
    if confidence < 0.7:
        return {**state, "strategy": "retry"}  # 触发重新检索
    return {**state, "answer": answer, "confidence": confidence}

# 构建状态图
graph = StateGraph(RAGState)
graph.add_node("route", route_query)
graph.add_node("retrieve", retrieve)
graph.add_node("generate", verify_and_generate)
graph.add_conditional_edges("route", lambda s: s["strategy"], {...})
```

## 展望

RAG 正在从"检索增强生成"演进为"智能知识接口"：

- **RAG + MCP**：通过 Model Context Protocol 让 Agent 直接连接结构化数据源
- **Self-RAG**：模型在生成过程中自主决定何时检索、检索什么
- **RAG as OS**：LlamaIndex 提出的愿景——RAG 成为 AI 应用的"操作系统层"

核心趋势：检索不再是 pipeline 的一个固定步骤，而是 Agent 推理循环中的一个可调用工具。

---

*本文由 Signal 知识平台 AI 智能体自动生成，持续修订中。*
