---
title: "AI 概念面试题 120 道 - 第5章: Algorithm 算法与系统篇"
book: "AI 概念面试题 120 道"
chapter: "5"
chapterTitle: "Algorithm 算法与系统篇"
description: "对标 aioffer Algorithm 分类：反向传播、LSH、BM25 搜索、LRU/LFU Cache、流式算法、分布式系统等 AI 工程师必备算法题 10 道，含难度标注"
date: "2026-04-13"
updatedAt: "2026-04-13"
agent: "研究员→编辑→审校员"
tags:
  - "面试"
  - "Algorithm"
  - "反向传播"
  - "缓存"
  - "流式算法"
type: "book"
---

# 第 5 章：Algorithm 算法与系统篇

> 选自《AI 概念面试题 120 道》· 对标 aioffer.com Algorithm 分类题库

每题标注难度：🟢 Easy · 🟡 Medium · 🔴 Hard

---

## Q86. 什么是 Backpropagation from Scratch？手推反向传播 🔴 Hard

**反向传播**：用链式法则计算损失函数对每个参数的梯度。

**前向传播**（以两层网络为例）：
```
z₁ = W₁·x + b₁
a₁ = ReLU(z₁)
z₂ = W₂·a₁ + b₂
L = CrossEntropy(softmax(z₂), y)
```

**反向传播（链式法则）**：
```
∂L/∂z₂ = softmax(z₂) - y          # softmax + CE 的梯度
∂L/∂W₂ = ∂L/∂z₂ · a₁ᵀ
∂L/∂b₂ = ∂L/∂z₂
∂L/∂a₁ = W₂ᵀ · ∂L/∂z₂
∂L/∂z₁ = ∂L/∂a₁ ⊙ ReLU'(z₁)      # ReLU 梯度：z>0 时为 1，否则为 0
∂L/∂W₁ = ∂L/∂z₁ · xᵀ
∂L/∂b₁ = ∂L/∂z₁
```

**自动微分（Autograd）**：PyTorch/JAX 通过构建计算图，自动执行反向传播，无需手动推导。

**面试考点**：
- 为什么 softmax + CE 的梯度是 ŷ - y（非常简洁）
- ReLU 在 0 处的梯度（通常定义为 0）
- 矩阵乘法的梯度（注意转置）

---

## Q87. 什么是 Locality Sensitive Hashing（LSH）？ 🟢 Easy

**LSH（局部敏感哈希）**：一种近似最近邻搜索算法，将相似的向量以高概率映射到同一个哈希桶。

**核心思想**：设计哈希函数，使得相似的输入有高概率产生相同的哈希值，不相似的输入有低概率产生相同的哈希值。

**用于余弦相似度的 LSH（Random Projection）**：
```python
# 随机投影 LSH
def lsh_hash(vector, random_planes):
    # 将向量投影到随机超平面，取符号
    projections = random_planes @ vector
    return tuple((projections > 0).astype(int))
```

**用于 Jaccard 相似度的 LSH（MinHash）**：
- 已在第 2 章 Q39 详细介绍

**LSH 在 AI 中的应用**：
- 向量数据库的近似最近邻搜索（FAISS 的 LSH 索引）
- 文档去重（MinHash LSH）
- 推荐系统的候选召回

**LSH vs HNSW**：
- LSH：理论保证，但精度较低
- HNSW：实践中精度更高，是向量数据库的主流选择

---

## Q88. 什么是 In-Memory BM25 Search？ 🟢 Easy

**BM25（Best Match 25）**：经典的文本检索算法，基于词频（TF）和逆文档频率（IDF）：

```
BM25(q, d) = ∑ᵢ IDF(qᵢ) · (tf(qᵢ,d) · (k₁+1)) / (tf(qᵢ,d) + k₁·(1-b+b·|d|/avgdl))
```
- tf：词在文档中的频率
- IDF：逆文档频率（稀有词权重高）
- k₁（通常 1.2-2.0）：词频饱和参数
- b（通常 0.75）：文档长度归一化参数

**In-Memory BM25 实现**：
```python
# 倒排索引
index = {}  # {term: [(doc_id, tf), ...]}
for doc_id, doc in enumerate(corpus):
    for term in tokenize(doc):
        index[term].append((doc_id, tf))

# 查询
def search(query, k=10):
    scores = defaultdict(float)
    for term in tokenize(query):
        for doc_id, tf in index.get(term, []):
            scores[doc_id] += idf[term] * bm25_tf(tf, doc_lengths[doc_id])
    return sorted(scores.items(), key=lambda x: -x[1])[:k]
```

**BM25 vs 向量检索**：BM25 精确匹配关键词，向量检索理解语义；混合使用效果最好（RAG 标配）。

---

## Q89. 什么是 LFU Cache with LRU Ties？ 🟡 Medium

**LFU（Least Frequently Used）Cache**：淘汰访问频率最低的缓存项；频率相同时，淘汰最久未使用的（LRU Ties）。

**数据结构设计**：
```python
class LFUCache:
    def __init__(self, capacity):
        self.capacity = capacity
        self.min_freq = 0
        self.key_val = {}           # key → value
        self.key_freq = {}          # key → frequency
        self.freq_keys = defaultdict(OrderedDict)  # freq → {key: None}（有序，LRU）
    
    def get(self, key):
        if key not in self.key_val:
            return -1
        self._increment_freq(key)
        return self.key_val[key]
    
    def put(self, key, value):
        if self.capacity == 0:
            return
        if key in self.key_val:
            self.key_val[key] = value
            self._increment_freq(key)
        else:
            if len(self.key_val) >= self.capacity:
                # 淘汰最低频率中最久未使用的
                evict_key, _ = self.freq_keys[self.min_freq].popitem(last=False)
                del self.key_val[evict_key]
                del self.key_freq[evict_key]
            self.key_val[key] = value
            self.key_freq[key] = 1
            self.freq_keys[1][key] = None
            self.min_freq = 1
    
    def _increment_freq(self, key):
        freq = self.key_freq[key]
        del self.freq_keys[freq][key]
        if not self.freq_keys[freq] and freq == self.min_freq:
            self.min_freq += 1
        self.key_freq[key] = freq + 1
        self.freq_keys[freq + 1][key] = None
```

**时间复杂度**：get 和 put 均为 O(1)。

**AI 应用**：KV Cache 管理、Embedding 缓存、推理结果缓存。

---

## Q90. 什么是 Thread-Safe LRU Cache for Inference？ 🔴 Hard

**LRU Cache（Least Recently Used）**：淘汰最久未使用的缓存项。

**线程安全的挑战**：多个推理请求并发访问缓存，需要保证：
- 读写操作的原子性
- 避免死锁
- 最小化锁竞争（保证高并发性能）

**实现方案**：

```python
import threading
from collections import OrderedDict

class ThreadSafeLRUCache:
    def __init__(self, capacity):
        self.capacity = capacity
        self.cache = OrderedDict()
        self.lock = threading.RLock()  # 可重入锁
    
    def get(self, key):
        with self.lock:
            if key not in self.cache:
                return None
            self.cache.move_to_end(key)  # 标记为最近使用
            return self.cache[key]
    
    def put(self, key, value):
        with self.lock:
            if key in self.cache:
                self.cache.move_to_end(key)
            self.cache[key] = value
            if len(self.cache) > self.capacity:
                self.cache.popitem(last=False)  # 淘汰最久未使用
```

**高性能优化**：
- **读写锁（RWLock）**：读操作并发，写操作独占
- **分片锁（Sharded Lock）**：将缓存分成多个分片，每个分片独立加锁，减少竞争
- **无锁数据结构**：使用 CAS（Compare-And-Swap）操作

**推理缓存的应用**：Semantic Cache（语义相似的请求返回缓存结果）、KV Cache 管理。

---

## Q91. 什么是 Streaming Log Aggregation？ 🟡 Medium

**流式日志聚合**：实时处理和聚合大量 AI 系统产生的日志（推理请求、模型输出、错误信息）。

**系统架构**：
```
AI 服务（多实例）→ 日志 Producer
                      ↓
              Kafka（消息队列，缓冲和分发）
                      ↓
              Flink/Spark Streaming（流处理）
              ├── 实时聚合（QPS、延迟、错误率）
              ├── 异常检测（延迟突增、错误率上升）
              └── 数据写入（ClickHouse/Elasticsearch）
                      ↓
              Grafana（实时监控大盘）
```

**关键指标聚合**：
- **滑动窗口**：计算最近 1 分钟/5 分钟的 P99 延迟
- **计数器**：请求总数、错误数、token 消耗量
- **直方图**：延迟分布（用于计算百分位数）

**AI 特有的日志内容**：
- 每次推理的 prompt token 数、completion token 数
- 模型版本、采样参数（temperature、top_p）
- 检索到的文档（RAG 系统）
- 工具调用记录（Agent 系统）

---

## Q92. 什么是 Rolling Top-K Over a Data Stream？ 🟡 Medium

**问题**：在数据流中，实时维护最近 N 个元素中的 Top-K 最大值。

**应用场景**：
- 实时热门搜索词（最近 1 小时的 Top-10 搜索词）
- 推荐系统中的热门商品
- 监控系统中的高延迟请求

**解决方案**：

**方案 1：滑动窗口 + 最小堆**
```python
import heapq
from collections import deque

class RollingTopK:
    def __init__(self, window_size, k):
        self.window = deque()  # 滑动窗口
        self.window_size = window_size
        self.k = k
    
    def add(self, value):
        self.window.append(value)
        if len(self.window) > self.window_size:
            self.window.popleft()
    
    def top_k(self):
        return heapq.nlargest(self.k, self.window)
```

**方案 2：Count-Min Sketch（近似，适合高频流）**：
- 用多个哈希函数维护频率估计
- 空间 O(w×d)，查询误差有理论保证

**方案 3：Heavy Hitters 算法（Misra-Gries）**：
- 找出出现频率超过 n/k 的元素
- 空间 O(k)，适合找高频元素

---

## Q93. 什么是 Budget-Aware GenAI Gateway？ 🟡 Medium

**GenAI Gateway**：统一管理 AI 服务调用的网关，提供路由、限流、成本控制等功能。

**Budget-Aware（预算感知）功能**：
```
用户请求 → GenAI Gateway
              ├── 身份认证（API Key 验证）
              ├── 预算检查（用户/团队的 token 配额）
              │   ├── 超出预算 → 拒绝请求（429）
              │   └── 接近预算 → 降级到更便宜的模型
              ├── 模型路由（根据任务复杂度选择模型）
              │   ├── 简单任务 → GPT-4o-mini（便宜）
              │   └── 复杂任务 → GPT-4o（贵）
              ├── 请求转发 → LLM Provider
              ├── 成本记录（token 消耗 → 费用）
              └── 响应返回
```

**成本优化策略**：
- **模型路由**：用分类器判断任务复杂度，选择最便宜的足够好的模型
- **Semantic Cache**：相似请求直接返回缓存，不调用 LLM
- **Prompt 压缩**：压缩长 prompt，减少 input token
- **批处理**：合并多个请求，利用 batch API 折扣

**代表产品**：LiteLLM、Portkey、Helicone、Kong AI Gateway

---

## Q94. 什么是 Optimize Ad Targeting with Streaming Percentiles？ 🟡 Medium

**问题**：广告系统需要实时计算用户行为指标的百分位数（如 P95 点击率），用于动态调整出价策略。

**流式百分位数算法**：

**T-Digest**：
- 用一系列"质心"（centroid）近似表示数据分布
- 边缘的质心更精确（P1、P99），中间的质心更粗糙（P50）
- 空间 O(δ)，查询误差有理论保证

**GK（Greenwald-Khanna）算法**：
- 维护一个有序的摘要结构
- 保证任意百分位数的误差 ≤ ε
- 空间 O(1/ε · log(εN))

**实际应用**：
```python
# 使用 T-Digest 计算流式 P95
from tdigest import TDigest

digest = TDigest()
for ctr in stream_of_click_through_rates:
    digest.update(ctr)
    p95 = digest.percentile(95)
    # 根据 P95 CTR 调整出价
    bid = base_bid * (p95 / target_ctr)
```

**广告出价优化**：
- 实时计算各广告位的 P95 CTR
- 动态调整出价（高 CTR 广告位出更高价）
- 预算控制（接近预算时降低出价）

---

## Q95. 什么是 Time-based Hyperparameter Store？ 🟡 Medium

**Hyperparameter Store**：集中管理 AI 系统中的超参数（模型参数、业务参数），支持动态更新和版本管理。

**Time-based（基于时间）的特性**：
- 超参数有生效时间（如"从明天 0 点起，temperature 从 0.7 改为 0.5"）
- 支持定时实验（A/B 测试在特定时间段生效）
- 历史回溯（查询某个时间点的超参数值）

**数据模型**：
```python
{
  "param_name": "temperature",
  "value": 0.5,
  "effective_from": "2026-04-14T00:00:00Z",
  "effective_until": "2026-04-21T00:00:00Z",
  "experiment_id": "exp_001",
  "rollout_percentage": 50  # 只对 50% 的流量生效
}
```

**工程实现**：
- 存储：PostgreSQL（支持时间范围查询）
- 缓存：Redis（低延迟读取）
- 推送：WebSocket / 长轮询（实时更新到服务实例）
- 版本控制：每次修改记录历史，支持回滚
