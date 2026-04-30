---
title: "Code as Proxy — 第4章: 架构设计模式"
book: "Code as Proxy — AI 时代的数据安全架构"
chapter: "4"
chapterTitle: "架构设计模式"
description: "Code as Proxy 的工程实现：四层架构详细设计、Schema-Driven Code Gen、沙箱执行引擎、结果摘要策略，以及与现有系统的集成模式"
date: "2026-04-18"
updatedAt: "2026-04-18 02:30"
agent: "研究员→编辑→审校员"
tags:
  - "Code as Proxy"
  - "架构设计"
  - "沙箱执行"
  - "Schema-Driven"
  - "NL2SQL"
type: "book"
---

# 第 4 章：架构设计模式

> 选自《Code as Proxy — AI 时代的数据安全架构》

## 4.1 从理念到工程

前三章我们理解了 Code as Proxy 的理念、理论基础和 Palantir 的实践。本章将聚焦于**工程实现**——如何在你自己的系统中构建 Code as Proxy 架构。

## 4.2 四层架构的详细设计

### 4.2.1 第一层：业务语义层（Semantic Layer）

业务语义层是 AI 与数据之间的"翻译层"。它将底层数据结构转化为 AI 可理解的业务语义。

**核心组件：**

```
业务语义层
├── Schema Registry（Schema 注册中心）
│   ├── 表结构定义（字段名、类型、约束）
│   ├── 字段语义描述（自然语言描述每个字段的业务含义）
│   ├── 数据统计摘要（值域范围、分布特征、空值率）
│   └── 版本管理（Schema 演进历史）
│
├── Relationship Graph（关系图谱）
│   ├── 实体间关系（外键、业务关联）
│   ├── 关系语义（"用户 下单 订单"而非"users.id = orders.user_id"）
│   └── 关系约束（一对多、多对多、级联规则）
│
├── Action Catalog（动作目录）
│   ├── 可执行动作列表（查询、聚合、更新、删除）
│   ├── 动作前置条件（权限、业务规则）
│   ├── 动作参数 Schema（输入/输出类型定义）
│   └── 动作审批流程（哪些动作需要人工审批）
│
└── Constraint Engine（约束引擎）
    ├── 业务规则（"订单金额不能为负"）
    ├── 权限规则（"销售只能看自己区域的数据"）
    ├── 安全规则（"PII 字段不能出现在结果摘要中"）
    └── 合规规则（"金融数据查询需要审计日志"）
```

**Schema 增强示例：**

```json
{
  "table": "orders",
  "business_name": "订单",
  "description": "记录所有客户订单，包含下单、支付、发货、完成全生命周期",
  "fields": [
    {
      "name": "order_id",
      "type": "BIGINT",
      "business_name": "订单编号",
      "description": "全局唯一的订单标识符，格式：ORD-YYYYMMDD-XXXXXX",
      "is_pii": false,
      "is_primary_key": true
    },
    {
      "name": "customer_id",
      "type": "BIGINT",
      "business_name": "客户编号",
      "description": "下单客户的唯一标识，关联 customers 表",
      "is_pii": true,
      "foreign_key": "customers.customer_id"
    },
    {
      "name": "total_amount",
      "type": "DECIMAL(12,2)",
      "business_name": "订单总金额",
      "description": "订单的总金额（含税），单位：人民币元",
      "is_pii": false,
      "statistics": {
        "min": 0.01,
        "max": 999999.99,
        "mean": 328.45,
        "median": 189.00,
        "p95": 1200.00
      },
      "constraints": ["NOT NULL", "> 0"]
    },
    {
      "name": "status",
      "type": "ENUM",
      "business_name": "订单状态",
      "description": "订单当前状态",
      "is_pii": false,
      "enum_values": ["pending", "paid", "shipped", "delivered", "cancelled", "refunded"],
      "distribution": {
        "pending": "5%", "paid": "10%", "shipped": "15%",
        "delivered": "60%", "cancelled": "7%", "refunded": "3%"
      }
    }
  ],
  "relationships": [
    {
      "type": "belongs_to",
      "target": "customers",
      "description": "每个订单属于一个客户",
      "cardinality": "many_to_one"
    },
    {
      "type": "has_many",
      "target": "order_items",
      "description": "每个订单包含多个商品明细",
      "cardinality": "one_to_many"
    }
  ],
  "available_actions": [
    {
      "name": "query_orders",
      "description": "查询订单列表，支持按状态、时间、金额筛选",
      "requires_approval": false
    },
    {
      "name": "cancel_order",
      "description": "取消订单，仅限 pending/paid 状态",
      "requires_approval": true,
      "approval_role": "order_manager"
    }
  ]
}
```

AI 看到的是这份增强 Schema，而非 `SELECT * FROM orders LIMIT 10` 的结果。

### 4.2.2 第二层：代理生成层（Proxy Generation Layer）

代理生成层负责将用户的自然语言意图转化为可执行的代码或结构化 Action。

**三种生成模式：**

| 模式 | 说明 | 适用场景 | 安全性 |
|------|------|---------|--------|
| **SQL 生成** | AI 生成 SQL 查询语句 | 数据分析、报表 | ⭐⭐⭐⭐ |
| **Action 生成** | AI 生成结构化 Action 对象 | 业务操作、工作流 | ⭐⭐⭐⭐⭐ |
| **代码生成** | AI 生成 Python/JS 代码 | 复杂数据处理 | ⭐⭐⭐ |

**模式 1：SQL 生成（NL2SQL）**

```python
# AI 的输入
prompt = f"""
你是一个 SQL 生成助手。根据以下数据库 Schema 和用户问题，生成 SQL 查询。

Schema:
{enhanced_schema}

用户问题: "上个月销量最高的 10 个产品是什么？"

要求:
1. 只使用 Schema 中定义的表和字段
2. 不要使用 SELECT *，只选择必要字段
3. 对 PII 字段使用聚合函数而非直接查询
4. 添加 LIMIT 限制结果集大小
"""

# AI 的输出
generated_sql = """
SELECT p.product_name, SUM(oi.quantity) as total_sold
FROM order_items oi
JOIN products p ON oi.product_id = p.product_id
JOIN orders o ON oi.order_id = o.order_id
WHERE o.order_date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
  AND o.order_date < DATE_TRUNC('month', CURRENT_DATE)
  AND o.status IN ('delivered', 'shipped')
GROUP BY p.product_name
ORDER BY total_sold DESC
LIMIT 10
"""
```

**模式 2：Action 生成（结构化操作）**

```python
# AI 生成的 Action（JSON 格式，非自由文本）
generated_action = {
    "action_type": "query",
    "target_entity": "Product",
    "aggregation": {
        "field": "OrderItem.quantity",
        "function": "SUM",
        "alias": "total_sold"
    },
    "filters": [
        {"field": "Order.order_date", "op": ">=", "value": "last_month_start"},
        {"field": "Order.status", "op": "in", "value": ["delivered", "shipped"]}
    ],
    "joins": [
        {"from": "Product", "to": "OrderItem", "on": "product_id"},
        {"from": "OrderItem", "to": "Order", "on": "order_id"}
    ],
    "sort": {"field": "total_sold", "order": "DESC"},
    "limit": 10,
    "output_format": "table",
    "pii_handling": "exclude"
}
```

Action 模式比 SQL 模式更安全，因为 Action 的结构是预定义的，AI 只能在预定义的操作空间内生成指令。

**模式 3：代码生成（Python/JS）**

```python
# AI 生成的 Python 代码
generated_code = """
import pandas as pd

def analyze_sales_decline(df_orders, df_products, df_order_items):
    # 合并数据
    merged = df_order_items.merge(df_orders, on='order_id')
    merged = merged.merge(df_products, on='product_id')
    
    # 按月聚合
    merged['month'] = pd.to_datetime(merged['order_date']).dt.to_period('M')
    monthly = merged.groupby(['product_name', 'month'])['quantity'].sum().reset_index()
    
    # 计算环比变化
    monthly['prev_month'] = monthly.groupby('product_name')['quantity'].shift(1)
    monthly['change_pct'] = (monthly['quantity'] - monthly['prev_month']) / monthly['prev_month']
    
    # 筛选下降超过 20% 的产品
    latest = monthly[monthly['month'] == monthly['month'].max()]
    declining = latest[latest['change_pct'] < -0.2]
    
    # 返回摘要（不返回原始数据）
    return {
        'total_declining': len(declining),
        'avg_decline': declining['change_pct'].mean(),
        'top_declining': declining.nsmallest(5, 'change_pct', keep='first')['product_name'].tolist()
    }
"""
```

代码模式最灵活但安全性最低，需要配合沙箱执行和代码审查。

### 4.2.3 第三层：受控执行层（Controlled Execution Layer）

受控执行层是 Code as Proxy 的安全核心——确保 AI 生成的代码在受控环境中安全执行。

**沙箱架构：**

```
┌─────────────────────────────────────────────┐
│              沙箱执行引擎                      │
├─────────────────────────────────────────────┤
│                                             │
│  ┌─────────────┐    ┌──────────────────┐   │
│  │ 代码验证器   │    │ 权限检查器        │   │
│  │ - 语法检查   │    │ - ACL 验证       │   │
│  │ - 安全扫描   │    │ - 行级/列级权限   │   │
│  │ - 资源限制   │    │ - 时间窗口检查    │   │
│  │ - 禁止操作   │    │ - 审批状态检查    │   │
│  └──────┬──────┘    └────────┬─────────┘   │
│         │                    │              │
│         ▼                    ▼              │
│  ┌──────────────────────────────────────┐  │
│  │         隔离执行环境                   │  │
│  │  - 独立进程/容器                      │  │
│  │  - 内存限制（如 512MB）               │  │
│  │  - CPU 时间限制（如 30s）             │  │
│  │  - 网络隔离（无外部访问）             │  │
│  │  - 文件系统只读（除临时目录）          │  │
│  │  - 禁止系统调用（exec, fork, socket） │  │
│  └──────────────────────────────────────┘  │
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │         审计日志记录器                  │  │
│  │  - 执行的代码全文                      │  │
│  │  - 访问的数据范围                      │  │
│  │  - 执行时间和资源消耗                  │  │
│  │  - 返回结果的摘要                      │  │
│  └──────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

**代码验证规则示例：**

```python
FORBIDDEN_PATTERNS = [
    r'import\s+os',           # 禁止操作系统调用
    r'import\s+subprocess',   # 禁止子进程
    r'import\s+socket',       # 禁止网络访问
    r'open\s*\(',             # 禁止文件操作
    r'exec\s*\(',             # 禁止动态执行
    r'eval\s*\(',             # 禁止动态求值
    r'__import__',            # 禁止动态导入
    r'requests\.',            # 禁止 HTTP 请求
    r'urllib\.',              # 禁止 URL 访问
    r'DROP\s+TABLE',          # 禁止删表（SQL）
    r'DELETE\s+FROM.*WHERE\s+1\s*=\s*1',  # 禁止全表删除
    r'UPDATE.*SET.*WHERE\s+1\s*=\s*1',    # 禁止全表更新
]

ALLOWED_IMPORTS = [
    'pandas', 'numpy', 'datetime', 'json',
    'collections', 'itertools', 'functools',
    'math', 'statistics', 'decimal',
]
```

### 4.2.4 第四层：结果摘要层（Result Summary Layer）

结果摘要层确保 AI 只看到聚合后的结果，而非原始数据。

**摘要策略：**

| 策略 | 说明 | 示例 |
|------|------|------|
| **聚合摘要** | 返回统计值而非原始行 | "共 1,234 条记录，平均金额 ¥328" |
| **Top-K 摘要** | 只返回排名前 K 的结果 | "销量前 5：产品A(1200), 产品B(980)..." |
| **分布摘要** | 返回数据分布而非具体值 | "60% 已完成, 15% 运输中, 10% 已支付..." |
| **变化摘要** | 返回变化趋势而非绝对值 | "环比增长 15%, 同比增长 32%" |
| **异常摘要** | 只返回异常项 | "发现 3 个异常值，偏离均值 >3σ" |
| **PII 过滤** | 自动移除个人信息 | 将姓名替换为 "用户_001" |

```python
class ResultSummarizer:
    def summarize(self, raw_result, summary_config):
        """将原始查询结果转化为安全摘要"""
        summary = {}
        
        # 基础统计
        summary['total_rows'] = len(raw_result)
        summary['columns'] = list(raw_result.columns)
        
        # 数值列聚合
        for col in raw_result.select_dtypes(include='number').columns:
            if not self._is_pii(col):
                summary[f'{col}_stats'] = {
                    'mean': raw_result[col].mean(),
                    'median': raw_result[col].median(),
                    'min': raw_result[col].min(),
                    'max': raw_result[col].max(),
                }
        
        # PII 过滤
        for col in raw_result.columns:
            if self._is_pii(col):
                summary[f'{col}_note'] = f'[PII 字段已过滤，共 {raw_result[col].nunique()} 个唯一值]'
        
        # Top-K（非 PII 字段）
        if summary_config.get('top_k'):
            k = summary_config['top_k']
            sort_col = summary_config['sort_by']
            top = raw_result.nlargest(k, sort_col)
            summary['top_items'] = top[[c for c in top.columns if not self._is_pii(c)]].to_dict('records')
        
        return summary
```

## 4.3 集成模式

### 4.3.1 与现有数据平台集成

```
模式 A：API Gateway 模式
  ┌──────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
  │ 用户 │───→│ AI 网关  │───→│ Code Gen │───→│ 数据平台 │
  └──────┘    │(Schema)  │    │(生成代码) │    │(执行代码) │
              └──────────┘    └──────────┘    └──────────┘

模式 B：Sidecar 模式
  ┌──────────────────────────────────┐
  │          业务应用                  │
  │  ┌──────────┐  ┌──────────────┐ │
  │  │ 业务逻辑 │  │ CaP Sidecar  │ │
  │  │          │  │ - Schema 缓存│ │
  │  │          │  │ - Code Gen   │ │
  │  │          │  │ - 沙箱执行   │ │
  │  └──────────┘  └──────────────┘ │
  └──────────────────────────────────┘

模式 C：SDK 模式
  import { CodeAsProxy } from '@cap/sdk';
  
  const cap = new CodeAsProxy({
    schemaRegistry: 'https://schema.internal/v1',
    llmProvider: 'claude-api',
    sandbox: 'docker',
    summaryPolicy: 'aggregate',
  });
  
  const result = await cap.query(
    "上个月销量下降超过 20% 的产品有哪些？"
  );
  // result 是摘要，不是原始数据
```

### 4.3.2 与 AI Agent 框架集成

Code as Proxy 可以作为 AI Agent 的工具（Tool）注册到 MCP（Model Context Protocol）中：

```python
# MCP Tool 定义
{
    "name": "secure_data_query",
    "description": "安全地查询业务数据。AI 只能看到 Schema 和结果摘要，不接触原始数据。",
    "input_schema": {
        "type": "object",
        "properties": {
            "intent": {
                "type": "string",
                "description": "用自然语言描述你想查询的内容"
            },
            "output_format": {
                "type": "string",
                "enum": ["summary", "top_k", "distribution", "trend"],
                "description": "结果摘要的格式"
            }
        },
        "required": ["intent"]
    }
}
```

当 AI Agent 调用这个工具时，它只需要表达意图，Code as Proxy 系统自动完成：Schema 查找 → 代码生成 → 沙箱执行 → 结果摘要 → 返回给 Agent。

## 4.4 设计模式目录

### 模式 1：Schema-First Query（Schema 优先查询）

```
场景：用户想查询数据
流程：Schema → LLM → SQL → 沙箱执行 → 聚合摘要
适用：数据分析、报表生成、KPI 监控
```

### 模式 2：Ontology-Grounded Action（本体锚定操作）

```
场景：用户想执行业务操作
流程：Ontology → LLM → 结构化 Action → 审批 → 执行 → 状态摘要
适用：业务流程自动化、工作流编排
```

### 模式 3：Federated Code Dispatch（联邦代码分发）

```
场景：数据分布在多个节点
流程：各节点 Schema → LLM → 生成各节点代码 → 分发执行 → 聚合各节点摘要
适用：多数据中心、边缘计算、跨组织协作
```

### 模式 4：Iterative Refinement（迭代精化）

```
场景：单次查询无法满足需求
流程：Schema → LLM → 代码 v1 → 执行 → 摘要 → LLM 分析摘要 → 代码 v2 → ...
适用：探索性分析、复杂问题分解
```

### 模式 5：Human-in-the-Loop Approval（人机协作审批）

```
场景：高风险操作需要人工确认
流程：LLM → 生成 Action → 展示给人类审批 → 人类确认/修改 → 执行
适用：数据修改、资金操作、权限变更
```

---

## 本章小结

| 要点 | 说明 |
|------|------|
| **四层架构** | 业务语义层 → 代理生成层 → 受控执行层 → 结果摘要层 |
| **Schema 增强** | 不只是字段定义，还包括业务语义、统计摘要、关系、约束 |
| **三种生成模式** | SQL 生成、Action 生成、代码生成，安全性递减 |
| **沙箱执行** | 隔离环境 + 资源限制 + 禁止操作 + 审计日志 |
| **结果摘要** | 聚合/Top-K/分布/变化/异常/PII 过滤 |
| **集成模式** | API Gateway / Sidecar / SDK，可注册为 MCP Tool |

> **核心洞察**：Code as Proxy 的工程实现关键在于"增强 Schema"——给 AI 足够丰富的业务语义，让它在不看数据的情况下也能生成高质量代码。Schema 的质量直接决定了生成代码的质量。
