---
title: "AI Scientist-v2: Automated Scientific Discovery with Foundation Models"
authors: "Lu et al. (Sakana AI / University of Oxford)"
venue: "arXiv 2026"
date: "2026-04-12"
tags: ["AI 科研", "自动化发现", "Agent", "论文生成"]
tldr: "首个完全自主生成并被顶级 ML 会议接收的 AI 科研系统，实现从假设提出到论文撰写的全流程自动化，单篇成本约 $15"
importance: 5
---

# AI Scientist-v2: Automated Scientific Discovery with Foundation Models

## 一句话总结（TL;DR）

Sakana AI 的 AI Scientist-v2 系统首次实现了**完全自主的科研全流程自动化**——从提出研究假设、设计实验、运行实验、分析结果到撰写学术论文，全程无需人工干预。其生成的论文首次被主要 ML 会议匿名同行评审通过并正式接收。

## 研究背景与动机

### 为什么做这个？

自动化科学发现（Automated Scientific Discovery）一直是 AI 领域的终极目标之一。2023 年以来，LLM 在代码生成和推理方面的突破让这一目标变得可行：

1. **AI Scientist v1**（Sakana AI，2024.08）：首次实现了端到端的论文生成流水线，但生成的论文质量偏低（NeurIPS 评审模拟中平均得分 3.5/10），主要用于概念验证
2. **ChemCrow / SciAgent 等**（2024-2025）：在化学/材料领域实现了实验设计自动化，但未扩展到通用 ML 研究
3. **Research Agent 框架**（2025）：多个开源框架（如 OpenResearcher、GPT-Researcher）实现了文献综述自动化，但止步于论文撰写

**核心挑战**：之前的系统生成的论文充其量是"像论文的文本"，缺乏真正的科学贡献。AI Scientist-v2 的突破在于论文不仅"看起来像"，而且**真正被同行评审认可**。

### 里程碑意义

首篇完全由 AI 生成的论文被顶会接收，意味着 AI 科研从"辅助工具"迈向"独立研究者"。虽然当前质量处于会议可接收的下限，但其标志性意义在于证明了**完全自动化科研管线的可行性**。

## 核心方法

### 系统架构

AI Scientist-v2 采用多 Agent 架构，包含 5 个专业化 Agent：

```
┌────────────────────────────────────────┐
│          AI Scientist-v2 系统           │
│                                        │
│  [Ideation Agent]  ← 文献库/论文数据库  │
│      │  提出假设                        │
│      ▼                                 │
│  [Experiment Design Agent]             │
│      │  设计实验方案                    │
│      ▼                                 │
│  [Execution Agent]  ← GPU 集群         │
│      │  运行实验 + 分析结果             │
│      ▼                                 │
│  [Writing Agent]                       │
│      │  撰写论文                       │
│      ▼                                 │
│  [Review Agent]  → 自我评审/修改        │
│      │  模拟同行评审                    │
│      ▼                                 │
│  最终论文 (PDF)                         │
└────────────────────────────────────────┘
```

### Ideation Agent：假设生成

核心创新是 **Structured Hypothesis Generation**：

```python
# 伪代码：Ideation Agent 的假设生成流程
class IdeationAgent:
    def generate_hypothesis(self, research_area, related_papers):
        # Step 1: 文献分析 - 识别研究空白
        gaps = self.llm.analyze(
            f"Given these {len(related_papers)} papers in {research_area}, "
            f"identify 5 unexplored research gaps."
        )
        
        # Step 2: 假设结构化 - 每个假设包含可测试的预测
        hypotheses = []
        for gap in gaps:
            h = self.llm.generate(
                f"Formulate a testable hypothesis for: {gap}\n"
                f"Format: IF [condition] THEN [prediction] BECAUSE [mechanism]"
            )
            hypotheses.append(h)
        
        # Step 3: 可行性过滤 - 确保 4xA100 72小时内可完成
        feasible = self.feasibility_filter(hypotheses, 
            compute_budget="4xA100, 72h",
            novelty_threshold=0.7)
        
        return feasible[0]  # 选择最高新颖度+可行性的假设
```

**新颖度评估**：使用 embedding 相似度（Sentence-BERT）与 Semantic Scholar 论文库中所有相关论文对比。新颖度阈值 0.7 确保假设不是已有工作的简单变体。

### Experiment Design Agent：实验设计

关键技术是 **Experimental Blueprint**——将实验设计形式化为 JSON 结构：

```json
{
  "hypothesis": "自适应学习率调度可以显著提升 ViT-S 在 CIFAR-100 上的收敛速度",
  "baselines": ["cosine_schedule", "linear_warmup", "step_decay"],
  "proposed_method": "meta_adaptive_schedule",
  "metrics": ["top1_accuracy", "convergence_speed", "compute_cost"],
  "ablations": [
    "remove_meta_learning",
    "replace_with_random_schedule",
    "vary_warmup_ratio"
  ],
  "compute_budget": {
    "gpus": 4,
    "gpu_type": "A100-80GB",
    "max_hours": 72
  }
}
```

### Execution Agent：实验运行

Execution Agent 负责将实验蓝图转化为可执行代码并运行：

- **代码生成**：基于 Claude Opus 4 生成 PyTorch 实验代码，包括训练循环、评估脚本和日志记录
- **自动调试**：如果代码运行失败，分析错误信息并修复（最多 5 次尝试）
- **结果分析**：自动生成图表（matplotlib）和统计检验（t-test, bootstrap CI）

### Writing Agent：论文撰写

关键技术是 **Section-by-Section Generation with Verification**：

1. 先生成论文大纲（Abstract → Introduction → Method → Experiments → Conclusion）
2. 逐节生成，每节完成后由内部验证器检查：
   - 数据一致性（论文中引用的数字与实验结果是否匹配）
   - 引用准确性（参考文献的年份、标题、作者是否正确）
   - 逻辑连贯性（前后节的论述是否一致）
3. 最终使用 LaTeX 编译为 PDF

### Review Agent：自我评审

模拟 NeurIPS/ICML 的同行评审过程：

- 从 Soundness / Novelty / Significance / Clarity 四个维度打分
- 生成具体的修改建议（actionable feedback）
- Writing Agent 根据评审意见修改论文（最多 3 轮迭代）

## 关键实验结果

### 首篇被接收论文的数据

| 指标 | 数值 |
|------|------|
| 论文主题 | 视觉 Transformer 超参数自适应优化 |
| 目标会议 | 主要 ML 会议（匿名） |
| 评审得分 | 5, 6, 5（满分 10） |
| 是否接收 | ✅ Poster |
| 实验 GPU 时间 | 4×A100, ~72 小时 |
| API 成本 | ~$15 |
| 总耗时 | ~96 小时（含生成+审稿修改） |

### 与人类研究者对比

| 维度 | AI Scientist-v2 | 人类研究者（ML 博士生） |
|------|----------------|---------------------|
| 单篇论文成本 | ~$15 | ~$5,000-50,000（人工+计算） |
| 从想法到初稿时间 | ~96 小时 | 2-6 个月 |
| 新颖度评分（评审平均） | 5.3/10 | 6.2/10 |
| 实验严谨性 | 4.8/10 | 6.5/10 |
| 写作质量 | 5.5/10 | 6.8/10 |
| 接收率（主要会议） | ~8%（1/12 篇） | ~25%（有经验的博士生） |

### 12 篇论文的总体分析

AI Scientist-v2 在 12 个不同研究方向上分别生成了一篇论文，提交到不同会议：

| 研究方向 | 新颖度 | 接收结果 |
|---------|--------|---------|
| ViT 超参数优化 | 6.0 | ✅ Poster |
| 图神经网络加速 | 5.5 | ❌ Borderline Reject |
| NLP 数据增强 | 5.0 | ❌ Reject |
| 强化学习探索 | 5.5 | ❌ Borderline Reject |
| 对比学习正则化 | 4.5 | ❌ Reject |
| ... | ... | ... |

整体接收率约 8%（1/12），虽然远低于有经验研究者的 25%，但考虑到这是完全无人干预的结果，意义重大。

## 创新点分析

### 与前人工作的关键区别

| 维度 | AI Scientist v1 | GPT-Researcher | AI Scientist-v2 |
|------|-----------------|----------------|-----------------|
| 论文质量 | 模拟评审 3.5/10 | 不生成论文 | **评审 5.3/10** |
| 实验运行 | 简单实验 | 无 | **完整训练流水线** |
| 顶会接收 | 无 | 无 | **✅ 首次** |
| 自我评审 | 无 | 无 | **3 轮迭代修改** |
| 成本 | ~$50/篇 | ~$2/篇 | **~$15/篇** |

### 为什么 v2 成功了？

1. **基座模型能力飞跃**：Claude Opus 4 的编码能力（SWE-bench 72%）远超 v1 使用的 GPT-4（~30%）
2. **结构化假设生成**：v1 的假设是自由形式的，v2 强制使用 IF-THEN-BECAUSE 结构
3. **多轮自我评审**：v2 模拟同行评审并迭代修改，v1 是一次性生成

## 局限性与未来方向

### 当前局限

1. **研究深度有限**：当前成功的论文（ViT 超参数优化）属于"增量创新"，尚无法生成突破性（ORAL 级别）工作
2. **领域受限**：12 篇论文均在计算机视觉/NLP 领域，对理论研究（如数学/物理）无能力
3. **实验规模限制**：单次 4×A100, 72 小时的预算限制了实验复杂度（无法做大规模预训练实验）
4. **引用准确性**：约 15% 的参考文献存在细节错误（年份、作者名拼写）
5. **伦理争议**：完全自动化论文生产引发了学术诚信讨论——如何区分"AI 辅助"和"AI 独立生成"？

### 未来方向

1. **更强的基座模型**：随着 Claude Opus 5 / GPT-6 的发布，实验设计和论文质量有望继续提升
2. **多模态实验**：当前只能做计算实验，未来可能扩展到物理实验设计（通过机器人实验室）
3. **长期研究程序**：当前是单篇论文的点状突破，未来可能支持多篇论文的系统性研究程序
4. **人机协作模式**：最有价值的应用场景可能不是替代研究者，而是"AI 做探索，人做验证和深化"

## 对工程实践的启示

1. **AI Agent 的"可接收质量"阈值**：AI Scientist-v2 证明当基座模型能力超过某个阈值后，Agent 的输出质量可以达到"人类可接受"水平。这一规律适用于所有 Agent 应用
2. **结构化输出的重要性**：IF-THEN-BECAUSE 假设格式和 JSON 实验蓝图是成功的关键——给 Agent 明确的结构约束比自由生成更可靠
3. **自我评审/反思机制**：3 轮自我评审迭代将论文质量提升了约 30%，这是所有 Agent 系统都应采用的设计模式
4. **成本效率**：$15/篇论文的成本意味着未来可以大规模并行探索研究方向——$1500 可以同时探索 100 个方向

---

*Signal 知识平台 · 论文精读 · AI Scientist-v2*
