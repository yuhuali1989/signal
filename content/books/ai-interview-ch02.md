---
title: "AI 概念面试题 120 道 - 第2章: NLP 与大语言模型篇"
book: "AI 概念面试题 120 道"
chapter: "2"
chapterTitle: "NLP 与大语言模型篇"
description: "对标 aioffer NLP 分类：Prompt Engineering、Tokenization（BPE）、Beam Search 解码、LLM 评测（Perplexity）、SFT、DPO/RLHF、RAG、幻觉、MoE、LoRA、Flash Attention、Long Context、Speculative Decoding 等 30 道高频题，含难度标注"
date: "2026-04-13"
updatedAt: "2026-04-13"
agent: "研究员→编辑→审校员"
tags:
  - "面试"
  - "NLP"
  - "LLM"
  - "RAG"
  - "RLHF"
  - "LoRA"
type: "book"
---

# 第 2 章：NLP 与大语言模型篇

> 选自《AI 概念面试题 120 道》· 对标 aioffer.com NLP 分类题库

每题标注难度：🟢 Easy · 🟡 Medium · 🔴 Hard

---

## Q26. 什么是 Prompt Engineering？核心技巧有哪些？ 🟢 Easy

**Prompt Engineering**：通过设计输入提示来引导 LLM 产生期望输出的技术。

**核心技巧**：

| 技巧 | 说明 | 示例 |
|------|------|------|
| 角色设定 | 给模型一个专家身份 | "你是一位资深 Python 工程师" |
| 任务分解 | 将复杂任务拆分为步骤 | "首先...，然后...，最后..." |
| 少样本示例（Few-shot） | 提供输入输出示例 | 给 3 个示例再提问 |
| 输出格式约束 | 指定输出格式 | "以 JSON 格式输出，包含字段 X、Y" |
| 思维链（CoT） | 要求逐步推理 | "Let's think step by step" |
| 负面约束 | 明确不要做什么 | "不要包含代码，只给解释" |
| 系统提示分离 | 将指令和用户输入分开 | System prompt vs User message |

**Zero-shot vs Few-shot**：Zero-shot 只给任务描述；Few-shot 给 k 个示例（通常 3-8 个），效果更稳定。

**Prompt 陷阱**：示例顺序影响结果；过长 prompt 导致"Lost in the Middle"；指令歧义导致不稳定输出。

---

## Q27. 什么是 Prompt Engineering - Basics II？结构化输出和工具调用如何实现？ 🟡 Medium

**结构化输出（Structured Output）**：强制 LLM 输出符合特定 Schema 的 JSON/XML：

```python
# OpenAI Structured Output
response = client.chat.completions.create(
    model="gpt-4o",
    response_format={"type": "json_schema", "json_schema": schema},
    messages=[...]
)
```

**为什么需要**：LLM 输出是自由文本，下游系统需要结构化数据；直接 prompt 要求 JSON 不稳定。

**实现方式**：
- **Constrained Decoding**：在解码时强制只生成符合 Schema 的 token（Outlines、Guidance）
- **Fine-tuning**：微调模型学习特定输出格式
- **JSON Mode**：OpenAI/Anthropic 的 API 级别支持

**Function Calling**：LLM 生成结构化的函数调用请求，由外部系统执行后将结果返回：
```json
{"function": "get_weather", "args": {"city": "上海", "date": "明天"}}
```

---

## Q28. 什么是 Tokenization？BPE 算法的原理是什么？ 🔴 Hard

**Tokenization**：将文本分割为模型可处理的最小单元（token）。

**BPE（Byte Pair Encoding）算法**：
1. 初始词汇表 = 所有字符（或字节）
2. 统计相邻 token 对的频率
3. 将最高频的 token 对合并为新 token，加入词汇表
4. 重复直到词汇表达到目标大小

**示例**：
```
语料：["low"×5, "lower"×2, "newest"×6, "widest"×3]
初始：l-o-w, l-o-w-e-r, n-e-w-e-s-t, w-i-d-e-s-t
合并 e+s → es：l-o-w, l-o-w-e-r, n-e-w-es-t, w-i-d-es-t
合并 es+t → est：...n-e-w-est, w-i-d-est
```

**现代变体**：
| 方法 | 使用模型 | 特点 |
|------|---------|------|
| BPE | GPT-2/3/4、LLaMA | 基于频率合并 |
| WordPiece | BERT | 最大化训练数据似然 |
| SentencePiece | LLaMA、T5 | 语言无关，直接处理原始文本 |
| Tiktoken | GPT-4 | OpenAI 高效 BPE 实现 |

**中文 Tokenization 挑战**：中文字符多，词汇表需要更大；BPE 会将中文字符拆成字节，效率低（需要专门的中文分词或更大词汇表）。

---

## Q29. 什么是 Beam Search？与贪心解码、采样的区别？ 🔴 Hard

**自回归生成**：逐 token 生成，每次将已生成序列作为输入，预测下一个 token。

**Beam Search**：维护 k 条候选序列（beam），每步扩展所有候选，保留概率最高的 k 条：
```
beam_size=3 时：
步骤1：["the", "a", "an"]（保留 top-3）
步骤2：["the cat", "the dog", "a cat"]（保留 top-3）
...最终选择总概率最高的序列
```

**解码策略对比**：

| 策略 | 原理 | 优点 | 缺点 |
|------|------|------|------|
| Greedy | 每步选最高概率 token | 快速 | 局部最优，重复 |
| Beam Search | 维护 k 条候选序列 | 质量较好 | 保守，不够多样 |
| Top-k 采样 | 从概率最高的 k 个中随机采样 | 多样性好 | k 难调 |
| Top-p（Nucleus）| 从累积概率 ≥ p 的集合中采样 | 自适应，效果好 | — |
| Temperature | 调整概率分布尖锐程度 | 控制创造性 | 高温可能乱 |

**Temperature 的作用**：
- T < 1：分布更尖锐，更确定性（适合代码、事实问答）
- T > 1：分布更平坦，更多样（适合创意写作）
- T = 0：等价于贪心解码

---

## Q30. 什么是 LLM 评测中的 Perplexity（困惑度）？ 🟢 Easy

**Perplexity（PPL）**：衡量语言模型对文本的"困惑程度"，即模型预测文本的平均不确定性：

```
PPL(W) = exp(-1/N · ∑ log P(wᵢ | w₁,...,w_{i-1}))
```

**直觉**：PPL = k 意味着模型在每个位置平均有 k 个等可能的选择。PPL 越低，模型越好。

**典型值**：
- 好的 LLM 在 WikiText-103 上 PPL ≈ 3-10
- 随机猜测（词汇表 50K）PPL ≈ 50000

**局限**：
- PPL 依赖词汇表大小，不同 tokenizer 的模型不可直接比较
- PPL 低不代表生成质量好（可能生成无聊但概率高的文本）
- 不能衡量事实准确性、有害性等

**其他评测指标**：BLEU（机器翻译）、ROUGE（摘要）、HumanEval（代码）、MMLU（知识）、MT-Bench（对话）

---

## Q31. 什么是 LLM 评测的 Basics？如何全面评测一个 LLM？ 🟡 Medium

**评测维度**：

| 维度 | 评测内容 | 代表基准 |
|------|---------|---------|
| 知识与推理 | 多学科知识、逻辑推理 | MMLU、ARC、HellaSwag |
| 代码能力 | 代码生成、调试 | HumanEval、MBPP、SWE-bench |
| 数学推理 | 数学题求解 | GSM8K、MATH、AIME |
| 对话质量 | 指令遵循、对话自然度 | MT-Bench、AlpacaEval |
| 安全性 | 有害内容、越狱 | TruthfulQA、BBQ |
| 长上下文 | 长文档理解 | RULER、Needle-in-a-Haystack |

**LLM-as-Judge**：用强大的 LLM（如 GPT-4）评估其他模型的输出质量，成本低于人工评测。

**评测陷阱**：
- **基准污染**：训练数据包含测试集（数据泄露）
- **指标游戏**：优化指标而非真实能力
- **位置偏见**：LLM-as-Judge 倾向于选择第一个或更长的回答

---

## Q32. 什么是 Supervised Fine-Tuning（SFT）？如何构建 SFT 数据？ 🟢 Easy

**SFT**：用（指令, 回答）格式的高质量数据对预训练模型进行监督微调，使模型能够遵循指令。

**SFT 数据格式**：
```json
{
  "instruction": "用一句话解释什么是梯度下降",
  "input": "",
  "output": "梯度下降是一种通过沿损失函数梯度反方向迭代更新参数来最小化损失的优化算法。"
}
```

**数据质量 > 数据数量**：LIMA 论文证明 1000 条高质量数据的效果优于 50000 条低质量数据。

**构建 SFT 数据的方法**：
| 方法 | 说明 | 代表数据集 |
|------|------|---------|
| 人工标注 | 最高质量，成本最高 | OpenAI InstructGPT 数据 |
| Self-Instruct | 用 LLM 生成指令和回答 | Alpaca（GPT-3.5 生成） |
| 真实用户对话 | 真实分布，多样性好 | ShareGPT |
| 任务转化 | 将 NLP 任务转为指令格式 | FLAN |

**Customer Support Chatbot SFT 数据**：收集真实客服对话 → 清洗（去除敏感信息）→ 标注（标记好/坏回答）→ 格式化为指令对。

---

## Q33. 什么是 RLHF？PPO 在 LLM 对齐中如何工作？ 🔴 Hard

**RLHF（Reinforcement Learning from Human Feedback）** 三阶段：

1. **SFT**：用高质量对话数据微调预训练模型
2. **奖励模型训练**：收集人类偏好排序（y_w > y_l），训练 RM 预测偏好分数
3. **PPO 强化学习**：用 RM 作为奖励信号，通过 PPO 优化 LLM

**PPO 目标**：
```
max_θ E[r_φ(x, y)] - β·KL(π_θ(y|x) || π_ref(y|x))
```
- r_φ：奖励模型分数
- KL 惩罚：防止偏离 SFT 模型太远（避免 Reward Hacking）

**Reward Hacking**：模型找到满足奖励函数但违背真实意图的方式（如生成极长但无意义的回答）。

**局限**：奖励模型可能被 Hack；人类偏好标注昂贵且主观；PPO 训练不稳定，超参敏感。

---

## Q34. 什么是 DPO？与 RLHF 的区别？GRPO 是什么？ 🟡 Medium

**DPO（Direct Preference Optimization）**：将 RLHF 的 RL 阶段转化为直接的监督学习，无需显式训练奖励模型：

```
L_DPO = -E[log σ(β·log(π_θ(y_w|x)/π_ref(y_w|x)) - β·log(π_θ(y_l|x)/π_ref(y_l|x)))]
```
其中 y_w 是偏好回答，y_l 是非偏好回答，β 控制偏离参考模型的程度。

**DPO 优势**：更简单稳定，无需 PPO，无需单独训练奖励模型，已成为主流对齐方法。

**GRPO（Group Relative Policy Optimization，DeepSeek 提出）**：
- 对同一问题生成多个回答，用组内相对奖励（而非绝对奖励）训练
- 无需 Critic 网络（比 PPO 更简单）
- 在数学推理任务上效果显著（DeepSeek-R1 使用）

**对比**：
| 方法 | 需要 RM | 稳定性 | 适用场景 |
|------|---------|-------|---------|
| PPO | ✅ | 差 | 通用对齐 |
| DPO | ❌ | 好 | 偏好对齐 |
| GRPO | 可选 | 好 | 推理任务 |

---

## Q35. 什么是 RAG（检索增强生成）？Basics I 核心流程是什么？ 🟢 Easy

**RAG 流程**：
```
用户问题 → 向量化 → 向量数据库检索（Top-K 相关文档）
         → 文档 + 问题拼接为 prompt → LLM 生成答案
```

**核心组件**：
1. **文档处理**：分块（Chunking）→ 向量化（Embedding）→ 存入向量数据库
2. **检索**：将问题向量化，做近似最近邻搜索（ANN）
3. **生成**：将检索到的文档作为上下文，LLM 基于文档回答

**RAG vs 微调**：
| 对比 | RAG | 微调 |
|------|-----|------|
| 知识更新 | 实时更新（改数据库） | 需要重新训练 |
| 可溯源 | ✅ 可以引用来源 | ❌ |
| 成本 | 低（无需训练） | 高 |
| 适用场景 | 知识密集型、知识频繁变化 | 风格/格式学习 |

---

## Q36. 什么是高级 RAG（Search in RAG Systems）？如何提升检索质量？ 🟡 Medium

**基础 RAG 的问题**：
- 单一向量检索可能遗漏关键词匹配的文档
- 检索到的文档不一定是最相关的（需要重排序）
- 问题表述与文档表述不一致（语义鸿沟）

**高级 RAG 技术**：

| 技术 | 原理 | 效果 |
|------|------|------|
| 混合检索（Hybrid Search） | 向量检索 + BM25 关键词检索，RRF 融合 | 召回率提升 |
| 重排序（Reranker） | 用 Cross-Encoder 对检索结果重新排序 | 精确率提升 |
| HyDE | 先生成假设答案，用假设答案检索 | 语义对齐更好 |
| 查询改写 | 将用户问题改写为更适合检索的形式 | 召回率提升 |
| 多路召回 | 从多个索引/数据源并行检索 | 覆盖率提升 |
| Self-RAG | 动态决定是否需要检索，评估检索质量 | 质量更高 |

**BM25 vs 向量检索**：
- BM25：关键词匹配，精确但不理解语义
- 向量检索：语义理解，但可能遗漏关键词
- 混合：互补，效果最好

---

## Q37. 什么是幻觉（Hallucination）？如何检测和缓解？ 🟢 Easy

**幻觉**：LLM 生成看似合理但实际上不正确或无中生有的内容。

**类型**：
- **事实性幻觉**：生成错误的事实（错误的日期、人名、引用）
- **忠实性幻觉**：生成内容与输入文档不一致

**根本原因**：
- 训练目标是预测下一个 token，不是"说真话"
- 训练数据中存在错误和矛盾
- 模型对自身知识边界没有准确认知

**缓解方法**：
| 方法 | 原理 |
|------|------|
| RAG | 从外部知识库检索相关文档，基于文档回答 |
| 自我一致性 | 多次采样，选择一致性高的答案 |
| 引用要求 | 要求模型引用来源，无来源则拒绝回答 |
| RLHF/DPO | 用人类反馈惩罚幻觉行为 |
| 不确定性表达 | 训练模型在不确定时说"我不知道" |

---

## Q38. 什么是数据去重（Data Deduplication）？在 LLM 预训练中为什么重要？ 🟡 Medium

**为什么重要**：
- 重复数据导致模型过拟合，泛化能力下降
- 重复数据浪费计算资源
- 测试集污染（训练数据包含测试集内容）

**去重方法**：

| 方法 | 粒度 | 原理 | 速度 |
|------|------|------|------|
| 精确去重 | 文档级 | MD5/SHA 哈希 | 快 |
| MinHash | 文档级 | 局部敏感哈希，近似相似度 | 快 |
| SimHash | 文档级 | 特征哈希，汉明距离 | 快 |
| Suffix Array | 子串级 | 找重复子串 | 慢但精确 |
| 语义去重 | 语义级 | 向量相似度 | 最慢 |

**MinHash 原理**：
1. 将文档表示为 n-gram 集合
2. 用多个哈希函数计算 MinHash 签名
3. 两文档 Jaccard 相似度 ≈ MinHash 签名相同的比例
4. 相似度超过阈值（如 0.8）则认为重复

**实践**：LLaMA 3 预训练数据经过严格去重，去除了约 30% 的重复内容。

---

## Q39. 什么是 Data Deduplication - Minhash？如何大规模实现？ 🔴 Hard

**大规模 MinHash 去重流程**：

```
1. 文档分词 → n-gram（通常 5-gram）
2. 计算 MinHash 签名（通常 128-256 个哈希函数）
3. LSH（局部敏感哈希）分桶：
   - 将签名分成 b 个 band，每个 band 有 r 行
   - 同一 band 中哈希值相同的文档进入同一桶
   - 同桶文档是候选重复对
4. 精确计算候选对的 Jaccard 相似度
5. 构建重复图，用 Union-Find 找连通分量
6. 每个连通分量只保留一个文档
```

**参数调优**：
- b（band 数）和 r（每 band 行数）控制召回率和精确率的权衡
- 阈值 t ≈ (1/b)^(1/r)

**工程挑战**：
- 万亿 token 级别的数据需要分布式处理（Spark/Ray）
- 内存限制：MinHash 签名需要大量内存
- 跨语言去重：不同语言的相同内容也需要去重

---

## Q40. 什么是 Preference Alignment - DPO？如何构建偏好数据集？ 🟡 Medium

**偏好数据集格式**：
```json
{
  "prompt": "解释量子纠缠",
  "chosen": "量子纠缠是两个粒子之间的一种特殊关联...[准确详细的解释]",
  "rejected": "量子纠缠就是两个粒子互相影响...[不准确的解释]"
}
```

**数据收集方式**：
1. **人工标注**：标注员对多个回答进行排序（最高质量）
2. **AI 辅助标注**：用强模型（GPT-4）评判弱模型的回答
3. **规则过滤**：基于安全规则自动生成 chosen/rejected 对
4. **用户反馈**：收集真实用户的点赞/踩

**DPO 训练注意事项**：
- 参考模型（π_ref）通常是 SFT 模型
- β 参数控制偏离参考模型的程度（通常 0.1-0.5）
- 数据质量比数量更重要
- 需要监控 chosen/rejected 的奖励差距（reward margin）

---

## Q41. 什么是 Mixture of Experts（MoE）？在 LLM 中如何应用？ 🔴 Hard

**MoE 原理**：将 FFN 层替换为多个"专家"网络，每次只激活少数几个专家（稀疏激活）：
```
output = ∑ᵢ Gate(x)ᵢ · Expert_i(x)
```
Gate 是路由网络，选择 Top-K 个专家（通常 K=2）。

**优势**：参数量大但计算量小（稀疏激活）；不同专家可以专注不同类型的知识。

**挑战**：
- **负载均衡**：防止所有 token 都路由到同一专家（辅助损失 + 专家容量限制）
- **通信开销**：分布式训练时专家间通信成本高（All-to-All 通信）
- **推理复杂性**：需要特殊的推理框架支持

**代表模型**：
| 模型 | 专家数 | 激活专家数 | 总参数 | 激活参数 |
|------|-------|---------|-------|---------|
| Mixtral 8×7B | 8 | 2 | 47B | 13B |
| DeepSeek-V3 | 256 | 8 | 671B | 37B |
| GPT-4（据传） | 8 | 2 | ~1.8T | ~220B |

---

## Q42. 什么是 LoRA？如何在实践中使用？ 🟡 Medium

**LoRA（Low-Rank Adaptation）原理**：冻结预训练模型权重，在每个线性层旁边添加低秩分解矩阵：
```
W' = W + ΔW = W + B·A
其中 A ∈ R^(r×d)，B ∈ R^(d×r)，r << d，B 初始化为 0
```

**为什么高效**：只训练 A 和 B（参数量 = 2×r×d），远少于原始权重 d×d；推理时可以将 B·A 合并回 W，无额外推理延迟。

**LoRA in Practice（实践要点）**：

| 超参 | 推荐值 | 说明 |
|------|-------|------|
| rank r | 4-64 | 越大效果越好但参数越多 |
| alpha | r 或 2r | 缩放因子，实际学习率 = η × alpha/r |
| 应用层 | Q、V 或所有线性层 | 应用到所有层效果更好 |
| Dropout | 0.05-0.1 | 防止过拟合 |

**QLoRA**：4-bit 量化 + LoRA，65B 模型可在单张 48GB A100 上微调。

**LoRA 合并**：训练完成后将 B·A 加回 W，推理时无额外开销：
```python
model.merge_adapter()  # HuggingFace PEFT
```

---

## Q43. 什么是 Flash Attention in Transformers？为什么是工程突破？ 🟡 Medium

**标准 Attention 的瓶颈**：
- 计算复杂度 O(N²)，但实际瓶颈是 **I/O**（HBM 读写），不是计算
- N×N 注意力矩阵需要写入 HBM，对于 N=8192，矩阵大小 = 8192² × 2 bytes ≈ 128MB

**Flash Attention 核心思想**：
1. **分块计算（Tiling）**：将 Q、K、V 分成小块，在 SRAM（片上缓存）中完成计算
2. **在线 Softmax**：用数值稳定的在线算法，无需存储完整注意力矩阵
3. **重计算**：反向传播时重新计算注意力，以计算换显存

**效果对比**：
| 指标 | 标准 Attention | Flash Attention 2 |
|------|-------------|-----------------|
| 速度 | 1x | 2-4x |
| 显存 | O(N²) | O(N) |
| 最大序列长度 | ~4K（A100） | ~100K+ |

**Flash Attention 3**（2024）：针对 H100 的 Tensor Core 和异步执行进一步优化，速度再提升 1.5-2x。

---

## Q44. 什么是 Long Context in LLMs？如何扩展上下文长度？ 🟢 Easy

**挑战**：
- 位置编码外推（训练时最大长度限制）
- 注意力计算复杂度 O(N²)
- KV Cache 显存随序列长度线性增长
- "Lost in the Middle"：LLM 对上下文中间部分的信息利用率低

**扩展方案**：

| 方法 | 原理 | 代表模型 |
|------|------|---------|
| RoPE 位置插值 | 对 RoPE 频率进行缩放 | LLaMA 2 Long |
| YaRN | 改进的 RoPE 外推，保持短距离性能 | Mistral 32K |
| Sliding Window Attention | 每个 token 只关注局部窗口 | Mistral |
| 稀疏注意力 | 只计算部分 token 对的注意力 | Longformer |
| 状态空间模型（Mamba） | 线性复杂度，替代 Attention | Mamba |

**发展趋势**：GPT-4 Turbo 128K → Claude 3 200K → Gemini 1.5 Pro 1M → 未来更长

---

## Q45. 什么是 Advanced KV-Cache in Transformer？ 🟡 Medium

**KV Cache 的高级优化技术**：

**PagedAttention（vLLM）**：
- 借鉴操作系统虚拟内存管理，将 KV Cache 分成固定大小的"页"
- 用页表管理逻辑序列到物理块的映射，支持非连续存储
- 显存利用率从 ~60% 提升到 ~96%

**Prefix Caching（前缀缓存）**：
- 共享相同前缀（系统提示）的请求只计算一次 KV Cache
- 对于长系统提示（1K+ token），首次请求后延迟降低 50%+

**Speculative Decoding 中的 KV Cache**：
- 草稿模型和目标模型各自维护 KV Cache
- 验证通过的 token 的 KV Cache 直接复用

**Quantized KV Cache**：
- 将 KV Cache 从 FP16 量化为 INT8/INT4
- 显存减少 2-4x，精度损失轻微

---

## Q46. 什么是 Speculative Decoding（推测解码）？ 🔴 Hard

**问题**：LLM 自回归生成是串行的，每步只生成一个 token，GPU 利用率低（decode 阶段 GPU 利用率通常 < 30%）。

**推测解码原理**：
1. 用小型草稿模型（Draft Model）快速生成 k 个候选 token
2. 用大型目标模型**并行**验证这 k 个 token
3. 接受与目标模型分布一致的 token，拒绝不一致的（用拒绝采样保证输出分布不变）

```
草稿模型生成：[the, cat, sat, on, the]
目标模型验证：[✅, ✅, ✅, ❌, ...]
接受前 3 个 token，从目标模型分布重新采样第 4 个
```

**效果**：在不改变输出分布的前提下，速度提升 2-3x（因为验证是并行的）。

**变体**：
- **Self-Speculative Decoding**：用同一模型的早期层作为草稿模型
- **Medusa**：在模型顶部添加多个预测头，并行预测多个 token
- **EAGLE**：用特征级别的草稿模型，效率更高

---

## Q47. 什么是 Tree of Thought（ToT）？BFS 和 DFS 在 LLM 中如何应用？ 🔴 Hard

**Chain-of-Thought（CoT）的局限**：只有一条推理路径，一旦走错就无法回溯。

**Tree of Thought（ToT）**：将推理过程建模为树状搜索，在每个步骤生成多个候选"思维"，用评估函数选择最有前途的路径。

**BFS（广度优先搜索）**：
- 每层维护 k 个最优状态
- 适合：需要全局最优解的问题（如数学证明）
- 缺点：内存消耗大

**DFS（深度优先搜索）**：
- 沿一条路径深入，遇到死路回溯
- 适合：有明确终止条件的问题
- 优点：内存消耗小

**实现**：
```python
# ToT 伪代码
def tot_solve(problem, k=3, depth=5):
    states = [problem]
    for step in range(depth):
        candidates = []
        for state in states:
            thoughts = generate_thoughts(state, n=k)  # 生成 k 个候选思维
            candidates.extend(thoughts)
        states = evaluate_and_select(candidates, k)   # 评估并保留 top-k
    return best_solution(states)
```

---

## Q48. 什么是 LLM Alignment：RLHF、DPO 和 GRPO 的完整对比？ 🔴 Hard

**对齐问题**：预训练模型只学会了"预测下一个 token"，不一定有用、无害、诚实（HHH）。

**三种对齐方法完整对比**：

| 方法 | 数据格式 | 训练复杂度 | 稳定性 | 效果 | 适用场景 |
|------|---------|---------|-------|------|---------|
| RLHF（PPO） | 偏好对 + RM | 高（3 阶段） | 差 | 好 | 通用对齐 |
| DPO | 偏好对 | 低（1 阶段） | 好 | 好 | 偏好对齐 |
| GRPO | 问题 + 奖励函数 | 中 | 好 | 推理任务最好 | 数学/代码推理 |

**GRPO 详解**：
```
1. 对同一问题生成 G 个回答
2. 用奖励函数（如代码执行结果）评分
3. 组内归一化：r̂ᵢ = (rᵢ - mean(r)) / std(r)
4. 用归一化奖励作为优势函数，更新策略
```

**Constitutional AI（CAI）**：用原则列表引导模型自我批评和修订，减少对人类反馈的依赖。

---

## Q49. 什么是 N-gram 模型？与神经语言模型的区别？ 🟢 Easy

**N-gram 模型**：基于马尔可夫假设，用前 N-1 个词预测下一个词：
```
P(wₙ | w₁,...,w_{n-1}) ≈ P(wₙ | w_{n-N+1},...,w_{n-1})
```

**问题**：
- 数据稀疏：N 越大，见过的 N-gram 越少（需要平滑技术）
- 无法捕捉长距离依赖
- 词汇表大时参数量爆炸

**与神经语言模型的对比**：
| 对比 | N-gram | 神经语言模型（LLM） |
|------|--------|-----------------|
| 上下文长度 | N-1 个词 | 数千到百万 token |
| 参数量 | 指数级增长 | 固定（与序列长度无关） |
| 泛化能力 | 差（未见过的 N-gram 概率为 0） | 好（语义泛化） |
| 计算效率 | 高（查表） | 低（神经网络推理） |

**N-gram 的现代应用**：BPE tokenization 中的 n-gram 频率统计；文本去重（MinHash 基于 n-gram）；评测指标（BLEU 基于 n-gram 精确率）。

---

## Q50. 什么是 Durable Agent Workflow？如何构建可靠的 Agent 工作流？ 🟡 Medium

**Durable（持久化）Agent Workflow**：能够在中断后恢复、支持长时间运行的 Agent 工作流。

**核心特性**：
- **状态持久化**：将 Agent 状态保存到数据库，支持断点续传
- **幂等性**：相同步骤重复执行结果一致
- **错误恢复**：步骤失败后可以重试或回滚
- **可观测性**：完整的执行日志和状态追踪

**实现方案**：
```python
# LangGraph 持久化工作流示例
from langgraph.checkpoint.sqlite import SqliteSaver

checkpointer = SqliteSaver.from_conn_string("agent_state.db")
graph = workflow.compile(checkpointer=checkpointer)

# 中断后恢复
result = graph.invoke(input, config={"configurable": {"thread_id": "task_001"}})
```

**Temporal / Durable Execution**：专门的工作流引擎，支持任意长时间的工作流，自动处理重试、超时、补偿事务。

**适用场景**：需要数小时/数天的 AI 任务（如代码重构、数据分析报告）；需要人工审批的工作流；需要跨会话记忆的 Agent。

---

## Q51. 什么是 Hybrid Phishing Detection？NLP 在安全领域的应用？ 🔴 Hard

**混合钓鱼检测**：结合多种信号（URL 特征、邮件文本、HTML 结构、发件人信誉）检测钓鱼攻击。

**NLP 特征**：
- 文本情感（紧迫感、恐吓）
- 关键词（"账户被锁定"、"立即验证"）
- 语言质量（语法错误、机器翻译痕迹）
- 品牌仿冒（相似品牌名称）

**混合模型架构**：
```
URL 特征（词法+网络）→ 特征向量
邮件文本 → BERT 编码 → 文本向量
HTML 结构 → 图神经网络 → 结构向量
→ 拼接 → 分类器 → 钓鱼概率
```

**挑战**：
- 对抗攻击（攻击者会针对检测模型进行对抗）
- 零日攻击（新型钓鱼手法）
- 误报率控制（误判正常邮件的代价高）

**评测指标**：F1、AUC-ROC；特别关注 False Negative Rate（漏报率）。

---

## Q52. 什么是 Ephemeral Context Ingestion？如何处理超长文档？ 🔴 Hard

**Ephemeral Context（临时上下文）**：在推理时动态注入的上下文信息，不持久化到模型参数中。

**超长文档处理策略**：

| 策略 | 原理 | 适用场景 |
|------|------|---------|
| 截断 | 只取前 N token | 简单但信息损失大 |
| 分块 + RAG | 分块检索相关片段 | 问答任务 |
| 滑动窗口摘要 | 逐段摘要，累积上下文 | 长文档摘要 |
| 层次摘要 | 先段落摘要，再章节摘要 | 书籍级文档 |
| 长上下文模型 | 直接输入（Gemini 1M） | 有足够上下文窗口时 |

**Ephemeral Context Ingestion 流程**：
```
长文档 → 分块 → 向量化 → 存入临时向量库
用户问题 → 检索相关块 → 动态构建上下文 → LLM 回答
会话结束 → 清除临时向量库
```

**与 RAG 的区别**：RAG 的知识库是持久的；Ephemeral Context 是会话级的临时知识库，适合处理用户上传的文档。

---

## Q53. 什么是 Production RAG Microservice？如何设计生产级 RAG 系统？ 🟡 Medium

**生产级 RAG 系统架构**：

```
[API Gateway] → [RAG Service]
                    ├── Query Processor（查询改写、意图识别）
                    ├── Retriever（混合检索 + Reranker）
                    ├── Context Builder（上下文构建、截断）
                    ├── LLM Client（流式生成）
                    └── Response Validator（幻觉检测、安全过滤）
                    
[Vector DB]  ←→  [RAG Service]
[Document Store] ←→ [Ingestion Pipeline]
```

**关键工程考量**：
| 方面 | 方案 |
|------|------|
| 延迟 | 异步检索、流式输出、缓存 |
| 可靠性 | 重试机制、降级策略（无检索结果时直接用 LLM） |
| 可观测性 | 追踪每次检索的文档、LLM 输入输出 |
| 成本 | Embedding 缓存、LLM 结果缓存 |
| 安全 | 权限控制（用户只能检索自己有权限的文档） |

---

## Q54. 什么是 Paged KV Cache & Tree Codec？ 🔴 Hard

**Paged KV Cache（vLLM 核心技术）**：
- 将 KV Cache 分成固定大小的物理块（Block，通常 16 token/块）
- 用块表（Block Table）管理逻辑序列到物理块的映射
- 支持非连续内存分配，消除内部碎片
- 支持 Copy-on-Write（多个请求共享相同前缀的物理块）

**Tree Codec（Radix Tree KV Cache）**：
- 将所有请求的 KV Cache 组织成前缀树（Radix Tree）
- 相同前缀的请求共享 KV Cache 节点
- 支持自动前缀缓存，无需手动指定
- SGLang 实现了 Tree Codec，在多轮对话和 RAG 场景下效率极高

**效果**：
- Paged KV Cache：显存利用率 60% → 96%
- Tree Codec：相同前缀请求的 TTFT 降低 50-80%

---

## Q55. 什么是 Citation-First Research Agent？如何构建可溯源的研究 Agent？ 🟡 Medium

**Citation-First 原则**：Agent 的每个事实性陈述都必须有明确的来源引用，无法引用的内容不输出。

**架构设计**：
```
用户问题
    ↓
搜索规划（确定需要查询的子问题）
    ↓
并行检索（学术数据库、网页、知识库）
    ↓
证据整合（将检索结果与问题对应）
    ↓
引用生成（每个陈述标注来源）
    ↓
事实核查（验证陈述与来源一致）
    ↓
输出（带引用的结构化报告）
```

**关键技术**：
- **Grounded Generation**：生成时强制引用检索到的文档片段
- **Attribution**：将生成的每句话映射回具体的来源文档
- **Faithfulness 评测**：用 NLI 模型验证生成内容是否忠实于来源
