---
title: "Code as Proxy — 第3章: Palantir AIP 深度解析"
book: "Code as Proxy — AI 时代的数据安全架构"
chapter: "3"
chapterTitle: "Palantir AIP 深度解析"
description: "Code as Proxy 最成功的商业实践：Palantir 如何通过 Ontology + AIP 架构，让 LLM 在最高机密环境中安全运行"
date: "2026-04-18"
updatedAt: "2026-04-18 02:30"
agent: "研究员→编辑→审校员"
tags:
  - "Code as Proxy"
  - "Palantir"
  - "AIP"
  - "Ontology"
  - "Foundry"
type: "book"
---

# 第 3 章：Palantir AIP 深度解析

> 选自《Code as Proxy — AI 时代的数据安全架构》

## 3.1 为什么是 Palantir？

在所有实践 Code as Proxy 理念的公司中，Palantir 是最极致的。原因很简单：**它的客户不允许任何数据泄露——哪怕是理论上的可能性。**

Palantir 的客户包括：
- **美国国防部**：处理 IL6（最高机密）级别的情报数据
- **CIA / NSA**：反恐情报分析
- **NATO**：跨国军事协调
- **Airbus / BP / Merck**：核心商业机密

在这些场景中，"数据可能被 AI 提供商看到"不是一个可接受的风险——它是一个**不可逾越的红线**。

Palantir 的解法不是"加更多的加密"或"签更严格的协议"，而是从架构层面确保：**AI 根本看不到数据。**

这就是 Code as Proxy 在 Palantir 的具体实现。

## 3.2 Ontology：AI 的"业务地图"

### 3.2.1 什么是 Ontology？

Ontology（本体论）是 Palantir 整个架构的基石。它不是一个数据库 Schema，而是对客户**整个业务世界的数字化建模**。

```
数据库 Schema：
  users (id INT, name VARCHAR, email VARCHAR)
  orders (id INT, user_id INT, amount DECIMAL)

Ontology：
  用户 (User)
    ├── 属性：姓名, 邮箱, 注册时间, 信用等级
    ├── 关系：下单 → 订单, 属于 → 部门, 管理 → 下属
    ├── 动作：冻结账户, 升级会员, 发送通知
    ├── 约束：信用等级 ∈ {A, B, C, D}, 冻结需要主管审批
    └── 权限：销售可见姓名+订单, 财务可见金额, 管理员全部可见
```

关键区别：

| 维度 | 数据库 Schema | Ontology |
|------|-------------|----------|
| 描述对象 | 数据结构 | 业务世界 |
| 包含内容 | 字段名 + 类型 | 实体 + 关系 + 动作 + 约束 + 权限 |
| 语义丰富度 | 低（技术层面） | 高（业务层面） |
| AI 可理解性 | 需要额外解释 | 自描述，AI 可直接推理 |
| 演进方式 | DBA 手动修改 | 随业务理解深化持续演进 |

### 3.2.2 Ontology 的构建过程

Palantir 的 FDE（Forward Deployed Engineer）驻场客户后，第一件事就是构建 Ontology：

```
Week 1-2：业务浸泡
  ├── 跟随业务人员日常工作
  ├── 记录所有业务实体和操作
  └── 绘制业务流程图

Week 3-4：初版建模
  ├── 定义核心实体（10-20 个）
  ├── 建立实体间关系
  ├── 定义关键动作和约束
  └── 与业务方验证

Month 2-3：迭代深化
  ├── 扩展到 50-100 个实体
  ├── 细化权限模型
  ├── 接入真实数据源
  └── AI 开始在 Ontology 上推理

Month 4+：持续演进
  ├── 新业务场景 → 新实体/关系
  ├── 用户反馈 → 约束调整
  ├── AI 使用数据 → Ontology 优化
  └── 形成数据飞轮
```

### 3.2.3 Ontology 为什么是 Code as Proxy 的关键？

Ontology 解决了 Code as Proxy 的核心挑战：**如何让 AI 在不看数据的情况下，仍然能生成高质量的操作代码？**

答案是：**给 AI 足够丰富的业务语义。**

```
没有 Ontology 的 Code as Proxy：
  AI 看到：users (id, name, email, score)
  AI 生成：SELECT * FROM users WHERE score > 80
  问题：AI 不知道 score 是什么，80 是否合理，结果应该怎么用

有 Ontology 的 Code as Proxy：
  AI 看到：
    用户.信用等级 (A/B/C/D, A 最高)
    用户.下单 → 订单 (金额, 状态)
    动作：升级会员 (条件: 信用等级 ≥ B 且近 30 天订单 ≥ 3)
  AI 生成：
    找出信用等级为 B 且近 30 天有 3 笔以上已完成订单的用户，
    执行"升级会员"动作，生成升级报告
  优势：AI 理解业务语义，生成的代码更准确、更安全
```

**Ontology 是 Schema 的"业务增强版"。** 它不仅告诉 AI 数据长什么样，还告诉 AI 数据意味着什么、可以怎么操作、有什么约束。

## 3.3 AIP：让 LLM 操作 Ontology

### 3.3.1 AIP 的架构

AIP（AI Platform）是 Palantir 在 2023 年推出的 AI 平台，它的核心设计就是 Code as Proxy：

```
┌─────────────────────────────────────────────────────┐
│                    用户界面                           │
│  "帮我找出上个月销量下降超过 20% 的产品，             │
│   分析原因并生成补货建议"                             │
└──────────────────────┬──────────────────────────────┘
                       │ 自然语言
                       ▼
┌─────────────────────────────────────────────────────┐
│              LLM 编排层 (LLM Orchestration)          │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐             │
│  │ Claude  │  │ GPT-4   │  │ Llama   │  任务路由    │
│  └─────────┘  └─────────┘  └─────────┘             │
└──────────────────────┬──────────────────────────────┘
                       │ 理解意图
                       ▼
┌─────────────────────────────────────────────────────┐
│           Ontology 锚定层 (Ontology Grounding)       │
│  将 LLM 的自然语言理解锚定到 Ontology 对象：          │
│  "销量下降" → 产品.月销量.环比变化 < -20%             │
│  "分析原因" → 关联: 产品→供应商, 产品→促销活动        │
│  "补货建议" → 动作: 生成采购订单(需要采购经理审批)     │
└──────────────────────┬──────────────────────────────┘
                       │ 生成 Action
                       ▼
┌─────────────────────────────────────────────────────┐
│            Action 框架 (Action Framework)             │
│  AI 生成结构化 Action（而非自由文本）：                │
│  {                                                   │
│    "action": "query_products",                       │
│    "filter": {"monthly_sales_change": {"$lt": -0.2}},│
│    "join": ["supplier", "promotion"],                │
│    "output": "generate_purchase_order",              │
│    "approval": "procurement_manager"                 │
│  }                                                   │
└──────────────────────┬──────────────────────────────┘
                       │ 人工审批
                       ▼
┌─────────────────────────────────────────────────────┐
│           Foundry 执行层 (Foundry Runtime)            │
│  Action 在 Foundry 内部执行：                         │
│  - 查询产品数据（权限受 Ontology ACL 约束）           │
│  - 关联供应商和促销数据                               │
│  - 生成采购订单草稿                                   │
│  - 数据全程不出 Foundry 边界                          │
└──────────────────────┬──────────────────────────────┘
                       │ 结果摘要
                       ▼
┌─────────────────────────────────────────────────────┐
│            结果摘要层 (Result Summary)                │
│  LLM 收到的不是原始数据，而是：                       │
│  "共 23 个产品销量下降 >20%，其中 15 个与供应商 A     │
│   的交货延迟相关，已生成 8 份采购订单待审批"           │
└─────────────────────────────────────────────────────┘
```

### 3.3.2 LLM 在 AIP 中"看到"了什么？

这是理解 Code as Proxy 的关键。在整个流程中，LLM 看到的信息是：

**✅ LLM 可以看到的：**
- Ontology Schema（实体、关系、动作、约束的定义）
- 用户的自然语言请求
- Action 执行后的聚合摘要

**❌ LLM 看不到的：**
- 任何原始数据行
- 具体的产品名称、价格、销量数字
- 供应商的具体信息
- 用户的个人信息

LLM 就像一个**只看得到地图但看不到实际地形的指挥官**——它根据地图（Ontology）制定作战计划（Action），士兵（Foundry Runtime）在实际地形上执行，然后向指挥官汇报结果摘要。

### 3.3.3 Ontology Grounding：消除幻觉的关键

LLM 最大的问题之一是幻觉（Hallucination）——生成看似合理但实际错误的内容。AIP 通过 **Ontology Grounding** 大幅降低幻觉率：

```
没有 Grounding 的 LLM：
  用户："分析上月销量"
  LLM 可能生成：SELECT sales FROM products WHERE month = 'last_month'
  问题：表名可能不对，字段名可能不对，时间表达可能不对

有 Ontology Grounding 的 LLM：
  用户："分析上月销量"
  Ontology 提供：
    - 实体: Product (id, name, category, monthly_sales[])
    - 时间: monthly_sales 是按月聚合的数组，索引 -1 = 上月
    - 约束: monthly_sales 单位为"件"，非金额
  LLM 生成的 Action 被约束在 Ontology 定义的空间内
  → 幻觉率从 ~5% 降至 <1%
```

**Ontology 就是 LLM 的"类型系统"。** 就像编程语言的类型系统防止类型错误一样，Ontology 防止 LLM 产生语义错误。

## 3.4 安全架构：IL6 级别的保护

### 3.4.1 美国国防信息分级

理解 Palantir 的安全架构，需要先了解美国国防信息分级体系：

| 级别 | 名称 | 说明 | Palantir 支持 |
|------|------|------|-------------|
| IL2 | 公开信息 | 非敏感的公开数据 | ✅ Foundry Cloud |
| IL4 | 受控非密 | CUI（受控非密信息） | ✅ Foundry Gov |
| IL5 | 国防非密 | 国防相关的非密信息 | ✅ Foundry Gov+ |
| IL6 | 机密 | SECRET 级别机密信息 | ✅ Gotham + TITAN |
| IL6+ | 最高机密 | TOP SECRET / SCI | ✅ 离线部署 |

**Palantir AIP 是唯一能在 IL6 环境中运行 LLM 的商业产品。** 这不是因为它的加密更强，而是因为 Code as Proxy 架构从根本上消除了数据泄露的可能性。

### 3.4.2 TITAN：边缘部署的极致

TITAN 是 Palantir 的边缘部署方案，将 AI 能力部署到**完全断网的环境**：

```
TITAN 部署场景：
  ┌──────────────────────────────┐
  │        战场指挥所             │
  │  ┌──────┐  ┌──────────────┐ │
  │  │TITAN │  │ 本地 Ontology │ │
  │  │节点  │  │ + 本地数据    │ │
  │  └──┬───┘  └──────┬───────┘ │
  │     │              │         │
  │     ▼              ▼         │
  │  本地 LLM    Foundry Runtime │
  │  (离线推理)   (本地执行)      │
  │                              │
  │  ❌ 无网络连接               │
  │  ❌ 无外部 API 调用          │
  │  ✅ 完全自主决策             │
  └──────────────────────────────┘
```

在 TITAN 中，Code as Proxy 的每一层都在本地运行：
- **Ontology**：预先部署的业务模型
- **LLM**：本地部署的小型模型（如 Llama 的军事微调版）
- **Runtime**：本地 Foundry 实例
- **数据**：本地传感器和情报数据

这是 Code as Proxy 的极致形态：**不仅数据不出域，连 AI 本身都在域内。**

### 3.4.3 安全审计链

AIP 的每一个操作都有完整的审计链：

```
审计记录示例：
{
  "timestamp": "2026-04-18T10:23:45Z",
  "user": "analyst_007",
  "clearance": "SECRET",
  "request": "分析过去 72 小时的异常通信模式",
  "ontology_objects_accessed": ["Communication", "Entity", "Location"],
  "action_generated": {
    "type": "temporal_pattern_analysis",
    "time_range": "72h",
    "filters": ["anomaly_score > 0.8"]
  },
  "approval": {
    "required": true,
    "approver": "supervisor_003",
    "approved_at": "2026-04-18T10:24:12Z"
  },
  "execution": {
    "runtime": "foundry-gov-il6-east",
    "duration_ms": 3420,
    "rows_processed": 1847293,
    "rows_returned_to_llm": 0,
    "summary_returned": "发现 3 个异常通信集群，涉及 12 个实体..."
  }
}
```

注意 `rows_returned_to_llm: 0`——LLM 没有看到任何原始数据行。

## 3.5 商业验证：数字说话

Palantir 的 Code as Proxy 架构不仅在安全上成功，在商业上也得到了充分验证：

### 3.5.1 财务表现

| 指标 | 2022 | 2023 | 2024 | 趋势 |
|------|------|------|------|------|
| 营收 | $1.91B | $2.23B | $2.87B | 📈 +29% |
| 商业营收增速 | +15% | +20% | +54% | 📈 加速 |
| 客户数 | 367 | 497 | 711 | 📈 +43% |
| NRR | >115% | >115% | >115% | ✅ 稳定 |
| Rule of 40 | 42 | 51 | 68 | 📈 优秀 |
| 市值 | ~$15B | ~$40B | ~$260B | 📈 爆发 |

### 3.5.2 AIP 的商业影响

AIP 在 2023 年推出后，成为 Palantir 增长的核心引擎：

- **商业客户增速加快**：AIP 让中小企业也能使用 Palantir，不再需要 FDE 驻场
- **NRR 提升**：现有客户因 AIP 扩大使用范围，净收入留存率持续 >115%
- **竞争壁垒加深**：Ontology + AIP 的组合让客户迁移成本极高
- **新市场打开**：AIP for Defense 让 LLM 进入了此前不可能进入的国防市场

### 3.5.3 客户案例

**Airbus（航空制造）**：
- 使用 Foundry + AIP 管理全球供应链
- Ontology 建模了 10,000+ 供应商、100,000+ 零部件
- AI 自动检测供应链风险，提前 2-4 周预警
- 数据不出 Airbus 的私有云环境

**BP（能源）**：
- 使用 Foundry 管理全球油田运营数据
- Ontology 建模了设备、管道、传感器、维护记录
- AI 预测设备故障，减少非计划停机 30%
- 传感器数据留在边缘节点，只有摘要上传

**美国陆军**：
- 使用 Gotham + TITAN 进行战场态势感知
- Ontology 建模了部队、装备、地形、威胁
- AI 在断网环境下自主分析情报，辅助指挥决策
- 所有数据在 TITAN 节点本地处理

## 3.6 Palantir 模式的局限性

尽管 Palantir 的 Code as Proxy 实践非常成功，但它也有明确的局限性：

### 3.6.1 Ontology 构建成本高

构建高质量的 Ontology 需要：
- **深度业务理解**：FDE 驻场 6-18 个月
- **持续维护**：业务变化 → Ontology 更新
- **专业人才**：同时懂技术和业务的人才稀缺

这使得 Palantir 的模式难以快速规模化。

### 3.6.2 FDE 模式的人力瓶颈

FDE 是 Palantir 的核心竞争力，也是其最大的瓶颈：
- 每个 FDE 同时只能服务 1-2 个客户
- FDE 的培养周期长（2-4 年达到独立交付水平）
- 人力成本高，限制了客户覆盖范围

### 3.6.3 不适用于所有 AI 任务

Code as Proxy 在以下场景效果有限：
- **需要理解数据内容的任务**：如文本分类、情感分析
- **需要跨域数据关联的任务**：如果数据分布在多个不互通的 Ontology 中
- **实时交互场景**：Code as Proxy 的"生成代码→执行→返回摘要"链路有延迟

### 3.6.4 Ontology 锁定效应

一旦客户的业务深度绑定了 Palantir 的 Ontology，迁移成本极高。这对 Palantir 是优势（高 NRR），但对客户是风险（供应商锁定）。

---

## 本章小结

| 要点 | 说明 |
|------|------|
| **Ontology** | 不是 Schema，而是对业务世界的完整数字化建模 |
| **AIP 架构** | LLM → Ontology Grounding → Action → Foundry 执行 → 结果摘要 |
| **安全级别** | 唯一能在 IL6（最高机密）环境运行 LLM 的商业产品 |
| **TITAN** | 边缘部署，完全断网环境下的自主 AI 推理 |
| **商业验证** | $2.87B 营收，711 客户，NRR >115%，市值 $260B+ |
| **局限性** | Ontology 构建成本高、FDE 人力瓶颈、不适用所有 AI 任务 |

> **核心洞察**：Palantir 的成功不是因为它的 AI 更强，而是因为它的架构更安全。Code as Proxy + Ontology 的组合，让 AI 在最敏感的环境中也能安全运行。这不是一个技术选择，而是一个架构哲学——"让 AI 理解业务，但不让 AI 碰数据"。
