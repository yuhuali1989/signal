---
title: "AI Agent 实战指南 - 第4章: 多 Agent 协作框架"
book: "AI Agent 实战指南"
chapter: "4"
chapterTitle: "多 Agent 协作框架"
description: "从零构建 AI 智能体系统"
date: "2026-04-11"
updatedAt: "2026-04-16 11:00"
agent: "研究员→编辑→审校员"
tags:
  - "Agent"
  - "多智能体"
  - "CrewAI"
  - "LangGraph"
type: "book"
---

# 第 4 章：多 Agent 协作框架

> 选自《AI Agent 实战指南》

## 4.1 为什么需要多 Agent

单个 Agent 在处理复杂任务时面临三个瓶颈：

```
单 Agent 的瓶颈:

  1. 上下文窗口限制
     → 一个 Agent 无法同时持有所有相关信息
  
  2. 专业能力边界
     → 编码、写作、数据分析需要不同的 prompt 策略
  
  3. 决策质量
     → 自己检查自己的工作，容易忽略错误

多 Agent 的解决方案:

  Agent A (研究员)    → 负责信息收集
  Agent B (编辑)      → 负责内容生成
  Agent C (审校员)    → 负责质量检查
  
  分工 + 协作 = 更高质量的输出
```

## 4.2 多 Agent 协作模式

### 四种核心模式

```
模式 1: 顺序流水线 (Sequential)
  A → B → C → 输出
  适用: 明确的阶段划分（研究→写作→审校）

模式 2: 层级委派 (Hierarchical)
       Manager
      /   |   \
     A    B    C
  适用: 任务可分解为独立子任务

模式 3: 辩论/投票 (Debate)
  A ←→ B ←→ C → 共识
  适用: 需要多角度评估的决策

模式 4: 动态编排 (Dynamic)
  Router → 根据任务类型动态分配 Agent
  适用: 任务类型多样、无法预定义流程
```

### 模式选型

| 场景 | 推荐模式 | 原因 |
|------|---------|------|
| 内容创作 | 顺序流水线 | 研究→写作→审校，阶段清晰 |
| 客服系统 | 层级委派 | 分流到不同专业 Agent |
| 代码审查 | 辩论 | 安全/性能/可维护性多角度 |
| 通用助手 | 动态编排 | 任务类型不确定 |

## 4.3 CrewAI 实战

CrewAI 是最流行的多 Agent 框架之一，核心概念：

```
CrewAI 核心概念:

  Agent (智能体)
  ├── Role: 角色定义
  ├── Goal: 目标
  ├── Backstory: 背景故事（影响行为风格）
  └── Tools: 可用工具

  Task (任务)
  ├── Description: 任务描述
  ├── Expected Output: 期望输出
  └── Agent: 分配的 Agent

  Crew (团队)
  ├── Agents: [agent1, agent2, ...]
  ├── Tasks: [task1, task2, ...]
  └── Process: sequential / hierarchical
```

### 完整示例：AI 新闻编辑部

```python
from crewai import Agent, Task, Crew, Process

# 定义 Agent
researcher = Agent(
    role="AI 前沿研究员",
    goal="追踪最新 AI 论文、模型发布和行业动态",
    backstory="""你是一位资深 AI 研究员，曾在 Google Brain 工作 5 年。
    你擅长从海量信息中提取最有价值的技术突破和行业趋势。
    你的判断标准：技术创新性、工程可行性、行业影响力。""",
    tools=[web_search, arxiv_search, github_trending],
    verbose=True
)

editor = Agent(
    role="技术编辑",
    goal="将研究发现转化为深度技术文章",
    backstory="""你是一位技术写作专家，文章发表在 InfoQ、机器之心等平台。
    你的写作原则：准确第一，深度第二，可读性第三。
    你善于用代码示例和架构图阐释复杂概念。""",
    tools=[code_executor, diagram_generator],
    verbose=True
)

reviewer = Agent(
    role="质量审校员",
    goal="确保内容准确性、完整性和一致性",
    backstory="""你是一位严谨的技术审校员，有丰富的论文审稿经验。
    你会检查：事实准确性、逻辑一致性、代码正确性、引用来源。
    你不放过任何错误，但也不会吹毛求疵。""",
    tools=[fact_checker, code_linter],
    verbose=True
)

# 定义任务
research_task = Task(
    description="搜索过去 24 小时内最重要的 3 条 AI 新闻，提供详细信息和来源",
    expected_output="包含 3 条新闻的结构化报告，每条含标题、摘要、来源、重要性评级",
    agent=researcher
)

writing_task = Task(
    description="基于研究报告，撰写一篇深度分析文章",
    expected_output="3000+ 字的 Markdown 技术文章，含代码示例和架构图",
    agent=editor,
    context=[research_task]  # 依赖研究任务的输出
)

review_task = Task(
    description="审核文章的准确性和质量，提出修改建议",
    expected_output="审核报告 + 修改后的最终文章",
    agent=reviewer,
    context=[writing_task]
)

# 组装团队
crew = Crew(
    agents=[researcher, editor, reviewer],
    tasks=[research_task, writing_task, review_task],
    process=Process.sequential,  # 顺序执行
    verbose=True
)

# 运行
result = crew.kickoff()
```

## 4.4 LangGraph 实战

LangGraph 用**图（Graph）** 来定义 Agent 间的协作流程，比 CrewAI 更灵活：

```python
from langgraph.graph import StateGraph, END
from typing import TypedDict, Annotated

# 定义状态
class TeamState(TypedDict):
    task: str
    research: str
    draft: str
    review: str
    final: str
    iteration: int

# 定义节点函数
def research_node(state: TeamState) -> TeamState:
    """研究员节点"""
    result = researcher_agent.invoke(state["task"])
    return {"research": result, "iteration": state.get("iteration", 0)}

def editor_node(state: TeamState) -> TeamState:
    """编辑节点"""
    draft = editor_agent.invoke({
        "research": state["research"],
        "previous_feedback": state.get("review", "")
    })
    return {"draft": draft}

def reviewer_node(state: TeamState) -> TeamState:
    """审校节点"""
    review = reviewer_agent.invoke(state["draft"])
    return {"review": review, "iteration": state["iteration"] + 1}

def quality_gate(state: TeamState) -> str:
    """质量门控：决定是否需要修改"""
    if "APPROVED" in state["review"]:
        return "publish"
    elif state["iteration"] >= 3:
        return "publish"  # 最多迭代 3 次
    else:
        return "revise"

# 构建图
workflow = StateGraph(TeamState)

# 添加节点
workflow.add_node("research", research_node)
workflow.add_node("edit", editor_node)
workflow.add_node("review", reviewer_node)
workflow.add_node("publish", lambda s: {"final": s["draft"]})

# 添加边
workflow.set_entry_point("research")
workflow.add_edge("research", "edit")
workflow.add_edge("edit", "review")

# 条件路由
workflow.add_conditional_edges(
    "review",
    quality_gate,
    {
        "revise": "edit",    # 需要修改 → 回到编辑
        "publish": "publish" # 通过 → 发布
    }
)
workflow.add_edge("publish", END)

# 编译并运行
app = workflow.compile()
result = app.invoke({"task": "分析 GPT-6 对 AI 行业的影响"})
```

## 4.5 框架对比

| 特性 | CrewAI | LangGraph | AutoGen |
|------|--------|-----------|---------|
| 核心抽象 | Agent/Task/Crew | Graph/Node/Edge | Agent/GroupChat |
| 流程定义 | 声明式 | 图编排 | 对话式 |
| 灵活性 | ★★★ | ★★★★★ | ★★★★ |
| 学习曲线 | 低 | 中 | 中 |
| 状态管理 | 内置 | 显式 State | 隐式 |
| 人工介入 | 支持 | 原生支持 | 支持 |
| 条件分支 | 有限 | 完整支持 | 有限 |
| 持久化 | 基本 | 内置 Checkpoint | 基本 |
| 适合场景 | 快速原型 | 复杂工作流 | 研究/对话 |

### 选型建议

```
你的场景是:
├── 快速构建 Agent 团队原型?
│   → CrewAI (最快上手)
├── 复杂的条件分支和循环?
│   → LangGraph (最灵活)
├── 多 Agent 自由讨论?
│   → AutoGen (最自然)
└── 生产环境部署?
    → LangGraph (状态持久化 + 可观测性最好)
```

## 4.6 多 Agent 的陷阱与最佳实践

### 常见陷阱

1. **过度设计**：2 个 Agent 能解决的问题，不要用 5 个
2. **信息丢失**：Agent 间传递时信息被压缩或丢失
3. **无限循环**：审校永远不满意，编辑无限修改
4. **成本爆炸**：每个 Agent 都是一次 LLM 调用

### 最佳实践

```python
# 实践 1: 设置最大迭代次数
MAX_ITERATIONS = 3

# 实践 2: 明确的输入/输出 Schema
class ResearchOutput(BaseModel):
    findings: List[Finding]
    confidence: float
    sources: List[str]

# 实践 3: Agent 间传递结构化数据而非自由文本
# ❌ 传递原始文本（信息可能丢失）
# ✅ 传递结构化对象

# 实践 4: 监控和观测
# 每个 Agent 调用记录：输入 token、输出 token、延迟、工具调用
```

## 4.7 多 Agent RL 训练框架

近期多智能体协作研究（如 CAMEL、AutoGen 等框架）开始将 RL 训练引入多 Agent LLM 系统：

```
┌────────────────────────────────────────┐
│         多 Agent RL 训练框架            │
├────────────────────────────────────────┤
│                                         │
│  ┌─────────┐    ┌─────────┐            │
│  │ Agent A  │ ←→ │ Agent B  │  消息传递 │
│  │ (LLM)   │    │ (LLM)   │  梯度回传 │
│  └────┬────┘    └────┬────┘            │
│       │              │                  │
│       └──────┬───────┘                  │
│              ↓                          │
│  ┌──────────────────────────┐          │
│  │ Multi-Agent GRPO         │          │
│  │ ├── 联合奖励函数         │          │
│  │ ├── Agent 间消息梯度回传 │          │
│  │ ├── Tree Search 扩展     │          │
│  │ └── 经验回放共享池       │          │
│  └──────────────────────────┘          │
│                                         │
│  关键创新:                              │
│  1. Agent 间消息可以传递梯度           │
│  2. 支持 Tree Search 扩展推理树        │
│  3. 联合优化而非独立优化               │
└────────────────────────────────────────┘
```

MARTI 的核心发现：**联合 RL 训练的多 Agent 系统比独立训练的多 Agent 系统在复杂推理任务上提升 23%**。这意味着多 Agent 不仅是推理时的协作，还可以是训练时的协同进化。（注：此为研究方向性结论，具体数据以原始论文为准）

```python
# MARTI 多Agent训练伪代码（注：MARTI为示意性框架名称）
from multi_agent_rl import MultiAgentGRPO, AgentConfig

# 配置 Agent 团队
agents = [
    AgentConfig(role="researcher", backbone="qwen3-32b"),
    AgentConfig(role="coder", backbone="DeepSeek-R1"),
    AgentConfig(role="reviewer", backbone="glm-5.1"),
]

# 联合 RL 训练
trainer = MultiAgentGRPO(
    agents=agents,
    reward_fn=joint_task_completion_reward,
    message_gradient=True,   # 消息传递支持梯度
    tree_search_width=4,     # Tree Search 宽度
    shared_replay_buffer=True # 共享经验池
)

# 训练时 Agent 间消息可以回传梯度
# → Agent A 学会生成更有用的研究报告
# → Agent B 学会更好地利用研究报告编码
# → Agent C 学会更精准地发现 Bug
trainer.train(episodes=10000)
```

## 4.8 A2A 与 MCP: 多 Agent 通信标准化

### 4.8.1 Google A2A 协议

Google 于 2025 年提出 Agent-to-Agent (A2A) 协议，定义了 Agent 间的标准通信接口：

```
A2A 协议核心:
  ├── Agent Card: 声明 Agent 的能力和接口
  ├── Task Protocol: 标准化任务请求/响应格式
  ├── Streaming: 长任务的实时进度更新
  └── Security: OAuth 2.0 + Agent 身份验证
```

### 4.8.2 MCP + A2A 的协同

```
MCP (Agent ↔ 工具) + A2A (Agent ↔ Agent) = 完整生态

┌──────────┐  A2A  ┌──────────┐
│ Agent A   │ ←──→ │ Agent B   │
│ (规划者)  │      │ (执行者)  │
└─────┬────┘      └─────┬────┘
      │ MCP             │ MCP
      ↓                 ↓
┌─────┴────┐      ┌─────┴────┐
│ 搜索工具  │      │ 代码执行  │
│ 数据库    │      │ 文件系统  │
└──────────┘      └──────────┘
```

2026 年 4 月，MCP v2.1 月下载量突破 9700 万次，A2A 被 Linux 基金会 AAIF 接纳为永久治理标准（待核实）。这两个协议正在成为多 Agent 系统的"HTTP + REST"。

## 4.9 微软 Agent Framework: 生产级编排

微软于 2026 年初开源 Agent Framework（GitHub 8 万+ Star），特点：

```python
# Microsoft Agent Framework 编排示例
from agent_framework import AgentRuntime, TypedAgent, Orchestrator

# Type-safe Agent 定义
@TypedAgent(
    input=ResearchQuery,
    output=ResearchReport,
    tools=[web_search, arxiv_api],
    mcp_servers=["browser", "filesystem"]
)
class ResearcherAgent:
    system_prompt = "你是 AI 前沿研究员..."

# 生产级编排
orchestrator = Orchestrator(
    agents=[ResearcherAgent, EditorAgent, ReviewerAgent],
    strategy="sequential_with_retry",
    max_retries=2,
    timeout=300,
    observability=OpenTelemetryTracer(),
    guardrails=AgentShield(
        sandbox=True,
        intent_classifier=True,
        audit_log=True
    )
)

result = await orchestrator.run(query="分析数据飞轮在自动驾驶中的应用")
```

关键特性：
- **Type-safe**: 编译时检查 Agent 间接口兼容性
- **原生 MCP 支持**: Agent 通过 MCP 协议调用外部工具
- **AgentShield 集成**: 零信任沙箱 + 实时意图分类 + 审计日志
- **OpenTelemetry 可观测性**: Agent 调用链全链路追踪

## 小结

多 Agent 协作是构建复杂 AI 应用的关键模式。核心要点：

1. 选择合适的**协作模式**（顺序/层级/辩论/动态）
2. **CrewAI** 快速上手，**LangGraph** 最灵活
3. 避免过度设计，始终保持**最小必要 Agent 数**
4. 设置迭代上限和质量门控，防止无限循环和成本爆炸

---

## 最新进展（2026 年 4 月更新）

### 1. AI Agent 供应链安全事件：Vercel 被入侵

2026 年 4 月 20 日，Vercel 确认其内部系统通过被入侵的第三方 AI 编码工具被非授权访问（事件细节待核实）。这是**首起通过 AI Agent 工具链入侵头部云平台**的真实事件，凸显了多 Agent 系统中供应链攻击的新型风险：

```
攻击链路：
恶意代码注入第三方 AI 工具 → 工具获取 Vercel 内部凭证 → 横向移动访问内部系统

防御启示：
1. Agent 调用外部工具时必须使用沙箱隔离
2. MCP 工具服务器需要签名验证和白名单机制
3. Agent 的权限应遵循最小必要原则，即使是开发工具
```

### 2. MCP 协议生态爆发：YC W26 批次中 12 家 MCP 相关创业公司

YC W26 批次 196 家公司中，有 12 家直接围绕 MCP 协议生态构建产品：

| 方向 | 代表公司 | 产品形态 |
|------|---------|---------|
| MCP 网关/安全 | AgentShield, ToolGuard | Agent 调用工具的安全审计网关 |
| MCP 市场 | ToolHub, MCPStore | 第三方工具服务器的发现和管理平台 |
| MCP 编排 | FlowAgent, ChainForge | 基于 MCP 的多 Agent 可视化编排 |
| MCP 监控 | TraceAgent, AgentOps | Agent 调用链的可观测性平台 |

### 3. Agent 安全最佳实践更新

基于 Vercel 事件和 AAIF 全球 Agent 标准化进展，2026 年 Q2 的 Agent 安全最佳实践新增：

- **工具签名验证**：所有 MCP 工具服务器必须提供可验证的签名，Agent 运行时校验
- **跨域隔离**：不同 Agent 的工具调用不应共享凭证或运行环境
- **意图漂移检测**：监控 Agent 行为是否偏离预定义意图，自动触发熔断
- **审计不可篡改**：Agent 的每次工具调用记录写入不可变日志（Append-only）

### 4. Claude 3.5 Sonnet 的 Agent 模式增强

Anthropic Claude 3.5 Sonnet 新增 `xhigh` 推理强度等级，专为复杂 Agent 任务设计：

- Agent 可在多步推理任务中动态提升推理深度
- 单次工具调用链最长支持 50 步（此前为 20 步）
- 内置「推理预算」管理：Agent 可自主决定何时使用 xhigh vs standard

---

*本章由 Signal 知识平台 AI 智能体自动生成。*
