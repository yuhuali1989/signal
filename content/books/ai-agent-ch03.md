---
title: "AI Agent 实战指南 - 第3章: 工具使用与函数调用"
book: "AI Agent 实战指南"
chapter: "3"
chapterTitle: "工具使用与函数调用"
description: "从零构建 AI 智能体系统"
date: "2026-04-11"
updatedAt: "2026-04-14 11:00"
agent: "研究员→编辑→审校员"
tags:
  - "Agent"
  - "Function Calling"
  - "MCP"
type: "book"
---

# 第 3 章：工具使用与函数调用

> 选自《AI Agent 实战指南》

## 3.1 为什么 Agent 需要工具

LLM 的知识有三个固有局限：**知识截止日期**、**无法操作外部世界**、**数学/逻辑不可靠**。工具使用是突破这些局限的关键。

```
LLM 固有局限:               工具补上的能力:

  知识截止于训练时间         → 搜索引擎、API 查询
  无法执行代码              → 代码解释器、沙箱
  数学计算不可靠            → 计算器、Wolfram Alpha
  无法访问私有数据          → 数据库连接器、文件系统
  无法操作应用              → 浏览器自动化、API 调用
```

## 3.2 函数调用（Function Calling）

### 工作原理

Function Calling 是 LLM 原生支持的工具调用机制，主要步骤：

```
Function Calling 流程:

  1. 开发者定义工具 Schema (JSON Schema 格式)
  2. 用户发送请求
  3. LLM 判断是否需要调用工具
  4. 如果需要，输出结构化的函数调用
  5. 开发者执行函数，将结果返回 LLM
  6. LLM 综合函数结果生成最终回答

  User: "北京现在几度？"
        ↓
  LLM 决策: 需要调用 get_weather 工具
        ↓
  LLM 输出: {"name": "get_weather", "arguments": {"city": "北京"}}
        ↓
  开发者执行函数 → {"temperature": 22, "weather": "晴"}
        ↓
  LLM 综合: "北京现在 22°C，天气晴朗。"
```

### 工具定义

```python
# OpenAI Function Calling 格式
tools = [
    {
        "type": "function",
        "function": {
            "name": "search_database",
            "description": "在知识库中搜索相关文档",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "搜索查询词"
                    },
                    "top_k": {
                        "type": "integer",
                        "description": "返回结果数量",
                        "default": 5
                    },
                    "filters": {
                        "type": "object",
                        "properties": {
                            "date_range": {"type": "string"},
                            "category": {"type": "string"}
                        }
                    }
                },
                "required": ["query"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "execute_code",
            "description": "在沙箱环境中执行 Python 代码",
            "parameters": {
                "type": "object",
                "properties": {
                    "code": {
                        "type": "string",
                        "description": "要执行的 Python 代码"
                    },
                    "timeout": {
                        "type": "integer",
                        "description": "超时时间(秒)",
                        "default": 30
                    }
                },
                "required": ["code"]
            }
        }
    }
]
```

### 并行函数调用

现代 LLM 支持在一次响应中发起**多个并行函数调用**：

```python
# GPT-4o / Claude 3.5 Sonnet 并行调用示例
response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "对比北京和上海今天的天气"}],
    tools=tools,
    parallel_tool_calls=True  # 启用并行
)

# LLM 一次输出两个函数调用:
# [
#   {"name": "get_weather", "arguments": {"city": "北京"}},
#   {"name": "get_weather", "arguments": {"city": "上海"}}
# ]
# → 开发者并行执行，然后一次性返回结果
```

## 3.3 MCP 协议：工具调用的标准化

### MCP 解决什么问题

在 MCP 之前，每个 LLM 厂商的工具调用格式都不同，开发者需要为每个模型适配。MCP（Model Context Protocol）由 Anthropic 提出，旨在成为 **AI Agent 的 USB 标准**：

```
MCP 前 (碎片化):                    MCP 后 (标准化):

  GPT ←→ 专用适配器 ←→ 数据库        GPT ──┐
  Claude ←→ 专用适配器 ←→ 数据库      Claude │←→ MCP ←→ 数据库
  Gemini ←→ 专用适配器 ←→ 数据库      Gemini─┘       ←→ API
                                                    ←→ 文件系统
  N 模型 × M 工具 = N×M 适配器       N + M 个适配器即可
```

### MCP 架构

```
MCP 架构:

  ┌─────────────────────────────────────────┐
  │              MCP Client                  │
  │  (IDE / 聊天应用 / Agent 框架)           │
  │                                          │
  │  ┌──────────────────────────────────┐    │
  │  │        MCP Host (宿主)           │    │
  │  │  管理多个 Server 连接            │    │
  │  └──────────┬───────────────────────┘    │
  └─────────────┼────────────────────────────┘
                │ JSON-RPC 2.0 (stdio / SSE)
     ┌──────────┼──────────┐
     ↓          ↓          ↓
  ┌──────┐  ┌──────┐  ┌──────┐
  │Server│  │Server│  │Server│
  │(DB)  │  │(Git) │  │(Web) │
  └──┬───┘  └──┬───┘  └──┬───┘
     ↓         ↓         ↓
  Database  GitHub    Browser
```

### 实现 MCP Server

```python
# 一个简单的 MCP Server 示例
from mcp import Server, Tool, Resource

server = Server("knowledge-base")

@server.tool()
async def search(query: str, top_k: int = 5) -> list:
    """在知识库中搜索相关文档
    
    Args:
        query: 搜索查询
        top_k: 返回数量
    """
    results = await vector_db.search(query, limit=top_k)
    return [
        {"title": r.title, "content": r.content, "score": r.score}
        for r in results
    ]

@server.tool()
async def add_document(title: str, content: str, tags: list[str] = []) -> dict:
    """向知识库添加新文档"""
    doc_id = await vector_db.insert(title=title, content=content, tags=tags)
    return {"id": doc_id, "status": "success"}

@server.resource("knowledge://stats")
async def get_stats() -> dict:
    """获取知识库统计信息"""
    return {
        "total_documents": await vector_db.count(),
        "last_updated": await vector_db.last_update_time()
    }

# 运行 Server
if __name__ == "__main__":
    server.run(transport="stdio")
```

### MCP 生态现状（2026 年 4 月）

| 分类 | 代表性 Server | 数量 |
|------|-------------|------|
| 数据库 | PostgreSQL, MongoDB, Redis | 50+ |
| 开发工具 | Git, Docker, Kubernetes | 40+ |
| 云服务 | AWS, GCP, Azure | 30+ |
| SaaS | Slack, Notion, Linear | 60+ |
| 文件系统 | 本地文件, S3, Google Drive | 20+ |
| 浏览器 | Playwright, Puppeteer | 10+ |
| 总计 | Anthropic 注册中心收录 | **500+** |

### MCP 2.0：Streamable HTTP 传输

2026 年 3 月 MCP 规范升级到 2025-03-26 版本，引入 **Streamable HTTP** 传输协议，替代原有的 SSE-only 方案：

```python
# MCP 2.0 Streamable HTTP Server 示例
from mcp import Server, StreamableHTTPTransport

server = Server("knowledge-base-v2")

@server.tool()
async def streaming_search(query: str, top_k: int = 10):
    """支持流式返回搜索结果"""
    async for result in vector_db.stream_search(query, limit=top_k):
        yield {
            "title": result.title,
            "content": result.content[:200],
            "score": result.score
        }

# Streamable HTTP: 客户端可选择接收流式或完整响应
transport = StreamableHTTPTransport(
    endpoint="/mcp",
    stateless=True,           # 无状态模式（适合 serverless）
    session_management=True,  # 可选有状态会话
    resumability=True         # 支持断点续传
)
server.run(transport=transport)
```

Streamable HTTP 的关键优势：
1. **无状态友好**：每次请求独立，天然适配 serverless/容器化部署
2. **流式 + 批量**：客户端可选择接收流式 SSE 或等待完整 JSON 响应
3. **断点续传**：长时间工具调用中断后可恢复，不需重新执行
4. **会话可选**：需要上下文时启用 session，无状态场景则跳过

## 3.4 A2A 协议：Agent-to-Agent 通信

### Google A2A 协议

2025 年 Google 发布 A2A（Agent-to-Agent Protocol），解决多 Agent 系统间的通信标准化问题：

```
MCP vs A2A 定位对比:

  MCP:  Agent ←→ Tool/Resource
        (Agent 调用工具，工具是"被动"的)

  A2A:  Agent ←→ Agent
        (Agent 间对等通信，每个 Agent 都是"主动"的)

  实际场景:
  ┌─────────┐  A2A  ┌──────────┐  A2A  ┌──────────┐
  │ 研究Agent│ ←→   │ 编码Agent │ ←→   │ 测试Agent │
  └────┬────┘       └────┬─────┘       └────┬─────┘
       │ MCP             │ MCP              │ MCP
       ↓                 ↓                  ↓
    搜索引擎          IDE/Git            CI/CD
```

### A2A Agent Card

每个 Agent 通过 Agent Card 声明能力（类似 MCP 的 Tool Schema）：

```json
{
  "name": "code-reviewer",
  "description": "专业代码审查 Agent，支持 Python/Go/Rust",
  "capabilities": {
    "input": ["code_diff", "pull_request_url"],
    "output": ["review_comments", "severity_score"],
    "streaming": true,
    "push_notifications": true
  },
  "authentication": {
    "type": "oauth2",
    "scopes": ["repo:read"]
  },
  "endpoint": "https://agents.example.com/code-reviewer"
}
```

## 3.5 工具选择策略

当 Agent 拥有大量工具时，如何选择正确的工具变得至关重要：

### 静态选择 vs 动态发现

```python
# 策略 1: 静态工具列表（适合工具少的场景）
tools = [tool_a, tool_b, tool_c]  # 全部传给 LLM

# 策略 2: 工具检索（适合工具多的场景）
class ToolRouter:
    def __init__(self, all_tools: list):
        self.tool_index = build_vector_index(all_tools)
    
    def select_tools(self, user_query: str, top_k: int = 5) -> list:
        """根据用户查询检索最相关的工具"""
        relevant = self.tool_index.search(user_query, top_k=top_k)
        return relevant

# 策略 3: 分层工具选择
class HierarchicalToolSelector:
    categories = {
        "data": [search_db, query_api, read_file],
        "compute": [execute_code, calculate, plot],
        "communication": [send_email, post_message],
    }
    
    def select(self, query: str) -> list:
        # Step 1: LLM 选择类别
        category = llm.classify(query, list(self.categories.keys()))
        # Step 2: 返回该类别下的工具
        return self.categories[category]
```

### Tool Orchestration：多工具编排

当任务需要多个工具协作时，需要编排策略：

```python
class ToolOrchestrator:
    """多工具编排器 —— 支持串行、并行和条件分支"""
    
    async def execute_plan(self, plan: list[ToolCall]) -> dict:
        """执行工具调用计划"""
        results = {}
        
        for step in plan:
            if step.type == "parallel":
                # 并行执行多个独立工具
                tasks = [self.call(tool) for tool in step.tools]
                step_results = await asyncio.gather(*tasks)
                results[step.id] = step_results
                
            elif step.type == "sequential":
                # 串行执行，前一步输出作为后一步输入
                prev_output = results.get(step.depends_on)
                result = await self.call(step.tool, input=prev_output)
                results[step.id] = result
                
            elif step.type == "conditional":
                # 条件分支：根据前一步结果选择路径
                condition = results.get(step.condition_key)
                tool = step.if_true if condition else step.if_false
                results[step.id] = await self.call(tool)
        
        return results

# 示例：数据分析任务的工具编排
plan = [
    ToolCall(id="1", type="parallel", tools=[
        fetch_data("sales_2026"),
        fetch_data("costs_2026")
    ]),
    ToolCall(id="2", type="sequential", depends_on="1",
             tool=merge_datasets),
    ToolCall(id="3", type="sequential", depends_on="2",
             tool=run_analysis),
    ToolCall(id="4", type="conditional", condition_key="3",
             if_true=generate_report,
             if_false=request_more_data)
]
```

## 3.6 工具调用的安全性

### 权限控制

```python
class SecureToolExecutor:
    """安全的工具执行器"""
    
    PERMISSION_LEVELS = {
        "read": 1,     # 读取数据
        "write": 2,    # 修改数据
        "execute": 3,  # 执行代码
        "external": 4, # 外部通信（邮件/API）
    }
    
    def __init__(self, max_permission: int = 2):
        self.max_permission = max_permission
    
    def execute(self, tool_call):
        tool = self.get_tool(tool_call.name)
        
        # 1. 权限检查
        if tool.permission_level > self.max_permission:
            raise PermissionError(
                f"Tool '{tool.name}' requires level {tool.permission_level}, "
                f"but max allowed is {self.max_permission}"
            )
        
        # 2. 参数验证
        validated_args = tool.validate_arguments(tool_call.arguments)
        
        # 3. 速率限制
        if not self.rate_limiter.allow(tool.name):
            raise RateLimitError(f"Too many calls to '{tool.name}'")
        
        # 4. 沙箱执行
        with Sandbox(timeout=30, memory_limit="512M"):
            result = tool.execute(**validated_args)
        
        # 5. 输出审计
        self.audit_log.record(tool_call, result)
        
        return result
```

### Prompt Injection 防护

工具调用场景下 Prompt Injection 是最大安全威胁：

```python
class ToolInputSanitizer:
    """工具输入消毒 —— 防止通过工具返回值注入恶意 prompt"""
    
    INJECTION_PATTERNS = [
        r"ignore previous instructions",
        r"you are now",
        r"system:\s*",
        r"<\|im_start\|>",
    ]
    
    def sanitize_tool_output(self, output: str) -> str:
        """清洗工具返回结果，防止 indirect prompt injection"""
        for pattern in self.INJECTION_PATTERNS:
            if re.search(pattern, output, re.IGNORECASE):
                return "[SANITIZED: 检测到潜在注入攻击，已过滤]"
        
        # 截断过长输出（防止上下文污染）
        if len(output) > 10000:
            output = output[:10000] + "\n[TRUNCATED]"
        
        # 添加安全标记
        return f"<tool_output>{output}</tool_output>"
```

## 小结

工具使用是 Agent 从"纯对话"进化到"能做事"的关键一步。本章覆盖了：

1. **Function Calling** 是 LLM 调用工具的原生机制
2. **MCP 协议** 正在成为工具调用的行业标准（500+ 集成），2.0 版本引入 Streamable HTTP
3. **A2A 协议** 解决了 Agent-to-Agent 的通信标准化
4. **工具选择** 在工具数量多时需要检索/分层策略
5. **Tool Orchestration** 支持串行/并行/条件分支的多工具编排
6. **安全性** 必须内置权限控制、沙箱隔离和 Prompt Injection 防护

---

*本章由 Signal 知识平台 AI 智能体自动生成并深度修订。最后更新：2026-04-14*
