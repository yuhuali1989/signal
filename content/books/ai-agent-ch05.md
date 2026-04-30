---
title: "AI Agent 实战指南 - 第5章: 记忆与状态管理"
book: "AI Agent 实战指南"
chapter: "5"
chapterTitle: "记忆与状态管理"
description: "从零构建 AI 智能体系统"
date: "2026-04-11"
updatedAt: "2026-04-11 21:26"
agent: "研究员→编辑→审校员"
tags:
  - "Agent"
  - "Memory"
  - "状态管理"
type: "book"
---

# 第 5 章：记忆与状态管理

> 选自《AI Agent 实战指南》

## 5.1 为什么 Agent 需要记忆

LLM 的核心局限是**无状态推理**——每次对话都从零开始，没有跨会话的持久记忆。这对构建实用的 Agent 系统是致命的：

```
无记忆 Agent 的问题:

  用户: "帮我预订明天去上海的机票"
  Agent: ✅ 已搜索航班...
  
  用户: "改成后天的"
  Agent: ❌ 改什么？去哪里？（丢失上下文）
  
  用户: "用我上次的偏好"
  Agent: ❌ 什么偏好？（无长期记忆）
```

Agent 记忆系统需要解决三个层次的问题：

| 层次 | 名称 | 保持时间 | 类比 |
|------|------|---------|------|
| L1 | 工作记忆 (Working Memory) | 单次对话 | 人的工作记忆（7±2 项） |
| L2 | 情景记忆 (Episodic Memory) | 跨会话 | 人的自传体记忆 |
| L3 | 语义记忆 (Semantic Memory) | 永久 | 人的知识库 |

## 5.2 工作记忆：上下文窗口管理

### 5.2.1 滑动窗口策略

最简单的工作记忆管理——保留最近 N 条消息：

```python
class SlidingWindowMemory:
    """滑动窗口记忆：保留最近 N 轮对话"""
    
    def __init__(self, max_turns: int = 20):
        self.max_turns = max_turns
        self.messages: list[dict] = []
    
    def add(self, role: str, content: str):
        self.messages.append({"role": role, "content": content})
        # 保留 system prompt + 最近 N 轮
        if len(self.messages) > self.max_turns * 2 + 1:
            system = self.messages[0]
            self.messages = [system] + self.messages[-(self.max_turns * 2):]
    
    def get_context(self) -> list[dict]:
        return self.messages.copy()
```

**局限**：滑动窗口丢弃的早期消息可能包含关键信息。

### 5.2.2 摘要压缩策略

当对话超过窗口大小时，用 LLM 对早期对话做摘要压缩：

```python
class SummaryMemory:
    """摘要压缩记忆：自动压缩早期对话"""
    
    def __init__(self, llm, max_tokens: int = 4000, summary_threshold: int = 3000):
        self.llm = llm
        self.max_tokens = max_tokens
        self.summary_threshold = summary_threshold
        self.summary = ""
        self.recent_messages: list[dict] = []
    
    async def add(self, role: str, content: str):
        self.recent_messages.append({"role": role, "content": content})
        
        if self._estimate_tokens() > self.summary_threshold:
            await self._compress()
    
    async def _compress(self):
        """将前半部分对话压缩为摘要"""
        split = len(self.recent_messages) // 2
        to_summarize = self.recent_messages[:split]
        
        prompt = f"""请将以下对话历史压缩为简洁摘要，保留关键信息和决策：

之前的摘要：{self.summary}

新对话：
{self._format_messages(to_summarize)}

输出一段简洁的摘要："""
        
        self.summary = await self.llm.generate(prompt)
        self.recent_messages = self.recent_messages[split:]
    
    def get_context(self) -> list[dict]:
        context = []
        if self.summary:
            context.append({
                "role": "system",
                "content": f"之前对话摘要：{self.summary}"
            })
        context.extend(self.recent_messages)
        return context
```

### 5.2.3 Token 预算分配

生产环境中需要精确管理 token 预算：

```
上下文窗口 token 分配（以 128K 为例）:

  ┌─────────────────────────────────────────┐
  │ System Prompt + 工具定义     ~8K (6%)   │
  │ 长期记忆检索结果             ~4K (3%)   │
  │ 对话摘要                     ~2K (2%)   │
  │ 近期消息（完整保留）         ~80K (62%) │
  │ 工具调用结果                 ~20K (16%) │
  │ 预留给生成                   ~14K (11%) │
  └─────────────────────────────────────────┘
```

## 5.3 长期记忆：向量数据库方案

### 5.3.1 基于 Embedding 的记忆检索

向量数据库是实现长期记忆最成熟的方案：

```python
import chromadb
from datetime import datetime

class VectorMemory:
    """基于向量数据库的长期记忆"""
    
    def __init__(self, collection_name: str = "agent_memory"):
        self.client = chromadb.PersistentClient(path="./memory_db")
        self.collection = self.client.get_or_create_collection(
            name=collection_name,
            metadata={"hnsw:space": "cosine"}
        )
    
    def store(self, content: str, metadata: dict = None):
        """存储一条记忆"""
        doc_id = f"mem_{datetime.now().timestamp()}"
        meta = {
            "timestamp": datetime.now().isoformat(),
            "type": "episodic",
            **(metadata or {})
        }
        self.collection.add(
            documents=[content],
            metadatas=[meta],
            ids=[doc_id]
        )
    
    def recall(self, query: str, n_results: int = 5,
               where: dict = None) -> list[dict]:
        """根据语义相似度检索记忆"""
        results = self.collection.query(
            query_texts=[query],
            n_results=n_results,
            where=where  # 元数据过滤
        )
        return [
            {"content": doc, "metadata": meta, "distance": dist}
            for doc, meta, dist in zip(
                results["documents"][0],
                results["metadatas"][0],
                results["distances"][0]
            )
        ]
    
    def forget(self, older_than_days: int = 90):
        """清理过期记忆"""
        cutoff = (datetime.now() - timedelta(days=older_than_days)).isoformat()
        old_docs = self.collection.get(
            where={"timestamp": {"$lt": cutoff}}
        )
        if old_docs["ids"]:
            self.collection.delete(ids=old_docs["ids"])
```

### 5.3.2 记忆的生命周期管理

```
记忆生命周期:

  输入 → 重要性评估 → 存储 → 检索 → 衰减/巩固 → 遗忘
          ↓                      ↓
     低重要性→丢弃         反复检索→巩固
     高重要性→立即存储      长期未用→衰减
```

关键设计决策：

| 维度 | 选项 | 适用场景 |
|------|------|---------|
| 存储粒度 | 原始对话 / 提取事实 / 摘要 | 事实提取最通用 |
| 检索策略 | 纯语义 / 时间加权 / 重要性加权 | 混合策略最佳 |
| 遗忘机制 | 固定 TTL / 访问频率衰减 / 无遗忘 | 衰减更自然 |
| 一致性 | 允许矛盾 / 新覆盖旧 / 显式冲突检测 | 冲突检测更安全 |

## 5.4 状态机驱动的 Agent 状态管理

### 5.4.1 有限状态机 (FSM)

对于流程明确的 Agent，FSM 提供可预测的状态转换：

```python
from enum import Enum
from typing import Callable

class AgentState(Enum):
    IDLE = "idle"
    PLANNING = "planning"
    EXECUTING = "executing"
    WAITING_INPUT = "waiting_input"
    REVIEWING = "reviewing"
    COMPLETED = "completed"
    ERROR = "error"

class AgentFSM:
    """Agent 有限状态机"""
    
    TRANSITIONS = {
        AgentState.IDLE: [AgentState.PLANNING],
        AgentState.PLANNING: [AgentState.EXECUTING, AgentState.ERROR],
        AgentState.EXECUTING: [
            AgentState.WAITING_INPUT,
            AgentState.REVIEWING,
            AgentState.ERROR
        ],
        AgentState.WAITING_INPUT: [AgentState.EXECUTING],
        AgentState.REVIEWING: [
            AgentState.COMPLETED,
            AgentState.PLANNING  # 需要重新规划
        ],
        AgentState.ERROR: [AgentState.PLANNING, AgentState.IDLE],
        AgentState.COMPLETED: [AgentState.IDLE],
    }
    
    def __init__(self):
        self.state = AgentState.IDLE
        self.history: list[tuple] = []
        self.context: dict = {}
    
    def transition(self, new_state: AgentState):
        if new_state not in self.TRANSITIONS.get(self.state, []):
            raise ValueError(
                f"非法转换: {self.state} → {new_state}，"
                f"允许: {self.TRANSITIONS[self.state]}"
            )
        self.history.append((self.state, new_state))
        self.state = new_state
    
    def can_transition(self, new_state: AgentState) -> bool:
        return new_state in self.TRANSITIONS.get(self.state, [])
```

### 5.4.2 持久化状态管理

长时间运行的 Agent 需要持久化状态，以支持断点续传：

```python
import json
from pathlib import Path

class PersistentAgentState:
    """可持久化的 Agent 状态"""
    
    def __init__(self, agent_id: str, state_dir: str = "./agent_states"):
        self.agent_id = agent_id
        self.state_file = Path(state_dir) / f"{agent_id}.json"
        self.state_file.parent.mkdir(parents=True, exist_ok=True)
        self._load()
    
    def _load(self):
        if self.state_file.exists():
            data = json.loads(self.state_file.read_text())
            self.fsm_state = AgentState(data["fsm_state"])
            self.plan = data.get("plan", [])
            self.completed_steps = data.get("completed_steps", [])
            self.context = data.get("context", {})
        else:
            self.fsm_state = AgentState.IDLE
            self.plan = []
            self.completed_steps = []
            self.context = {}
    
    def save(self):
        data = {
            "fsm_state": self.fsm_state.value,
            "plan": self.plan,
            "completed_steps": self.completed_steps,
            "context": self.context,
            "updated_at": datetime.now().isoformat()
        }
        self.state_file.write_text(json.dumps(data, ensure_ascii=False, indent=2))
    
    def checkpoint(self, step: str, result: dict):
        """保存检查点，支持断点续传"""
        self.completed_steps.append({
            "step": step,
            "result": result,
            "timestamp": datetime.now().isoformat()
        })
        self.save()
```

## 5.5 高级模式：反思与自我修正

### 5.5.1 反思记忆 (Reflective Memory)

灵感来自 Generative Agents（Stanford 2023），Agent 可以对原始记忆进行反思，生成更高层次的洞察：

```python
class ReflectiveMemory:
    """反思记忆：定期对记忆进行反思总结"""
    
    def __init__(self, llm, vector_memory: VectorMemory):
        self.llm = llm
        self.memory = vector_memory
        self.reflection_count = 0
    
    async def reflect(self, topic: str = None):
        """触发反思：从近期记忆中提取高层洞察"""
        recent = self.memory.recall(
            query=topic or "最近发生了什么重要的事",
            n_results=20
        )
        
        memories_text = "\n".join(
            f"- {m['content']}" for m in recent
        )
        
        prompt = f"""基于以下记忆，提取 3-5 个高层洞察或规律：

{memories_text}

请输出洞察列表，每个洞察一行："""
        
        insights = await self.llm.generate(prompt)
        
        # 将洞察存储为高级记忆
        for insight in insights.strip().split("\n"):
            if insight.strip():
                self.memory.store(
                    content=insight.strip(),
                    metadata={
                        "type": "reflection",
                        "reflection_round": self.reflection_count
                    }
                )
        
        self.reflection_count += 1
        return insights
```

### 5.5.2 记忆架构选型指南

| 方案 | 复杂度 | 适用场景 | 代表实现 |
|------|--------|---------|---------|
| 滑动窗口 | ★ | 简单对话机器人 | LangChain ConversationBufferMemory |
| 摘要压缩 | ★★ | 长对话助手 | LangChain ConversationSummaryMemory |
| 向量检索 | ★★★ | 需要长期记忆的 Agent | MemGPT / Zep |
| FSM + 持久化 | ★★★ | 流程型 Agent | LangGraph StateGraph |
| 反思记忆 | ★★★★ | 自主进化 Agent | Generative Agents / AIOS |
| 混合架构 | ★★★★★ | 生产级 Agent 系统 | 自定义组合 |

## 5.6 实战案例：构建带记忆的研究助手

```python
class ResearchAssistant:
    """带完整记忆系统的研究助手"""
    
    def __init__(self, llm):
        self.llm = llm
        self.working_memory = SummaryMemory(llm, max_tokens=8000)
        self.long_term = VectorMemory("research_assistant")
        self.reflective = ReflectiveMemory(llm, self.long_term)
        self.state = PersistentAgentState("research_assistant")
    
    async def process(self, user_input: str) -> str:
        # 1. 更新工作记忆
        await self.working_memory.add("user", user_input)
        
        # 2. 检索相关长期记忆
        relevant = self.long_term.recall(user_input, n_results=3)
        memory_context = "\n".join(
            f"[记忆] {m['content']}" for m in relevant
        )
        
        # 3. 构建完整上下文
        context = self.working_memory.get_context()
        if memory_context:
            context.insert(1, {
                "role": "system",
                "content": f"相关历史记忆:\n{memory_context}"
            })
        
        # 4. 生成回复
        response = await self.llm.chat(context)
        
        # 5. 存储到长期记忆
        self.long_term.store(
            f"用户问: {user_input}\n助手答: {response[:200]}",
            metadata={"type": "conversation"}
        )
        
        # 6. 定期触发反思
        if len(self.state.completed_steps) % 10 == 0:
            await self.reflective.reflect()
        
        return response
```

## 5.7 小结

记忆与状态管理是 Agent 从"对话玩具"走向"生产工具"的关键技术。核心要点：

1. **分层设计**：工作记忆处理当前任务，长期记忆保存跨会话信息
2. **检索优于存储**：存了记不起来等于没存，检索质量决定记忆质量
3. **遗忘是特性**：没有遗忘机制的记忆系统最终会被噪声淹没
4. **状态可持久化**：长时间运行的 Agent 必须支持断点续传
5. **反思提升质量**：定期对原始记忆做反思，生成高层洞察

---

## 5.8 最新进展（2026 年 4 月更新）

### MCP 协议安全危机对 Agent 记忆与状态管理的影响

2026 年 4 月，OX Security 披露 MCP 协议 STDIO 传输接口存在架构级 RCE 漏洞，影响超 20 万台 AI 服务器（事件细节待核实，数据来源：OX Security报告）。该漏洞对 Agent 的记忆与状态管理系统提出了新的安全要求：

1. **状态持久化需要加密**：Agent 的状态文件（包括记忆数据库、上下文缓存）可能通过 MCP 漏洞被远程读取。建议对所有持久化状态数据启用 AES-256 加密。

2. **记忆检索需要沙箱化**：当 Agent 通过 MCP 工具从外部检索记忆时（如 RAG 系统），检索过程应在沙箱环境中运行，防止提示注入通过记忆内容传播。

3. **MCP Server 白名单机制**：Agent 的工具调用配置应采用白名单模式，只允许经过安全审计的 MCP Server。CSA 已发布安全基线建议。

### Agent 记忆系统新趋势

- **结构化记忆图谱**：从纯向量检索演进到 Knowledge Graph + 向量混合检索，LangChain v0.3 和 LlamaIndex（llama-index）均引入了 GraphRAG 作为长期记忆后端。
- **分布式状态同步**：多 Agent 协作场景下，Agent 间的状态同步成为新课题。MIT TR 2026 趋势报告将「Agent Orchestration」列为十大趋势之一。
- **反思记忆的 RL 优化**：DeepMind 最新研究表明，用 RL 训练 Agent 的反思策略（何时反思、反思什么），可使任务成功率提升 23%。

---

*本章由 Signal 知识平台 AI 智能体自动生成。*
