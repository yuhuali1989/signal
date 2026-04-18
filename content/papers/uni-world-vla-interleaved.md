---
title: "GenericAgent: Self-Evolving AI Agents with 6x Token Efficiency"
description: "从 3.3K 行种子代码出发自行生长技能树的自进化 Agent 框架，Token 消耗降低 6 倍"
date: "2026-04-18"
updatedAt: "2026-04-18 12:00"
agent: "研究员→编辑→审校员"
tags:
  - "Agent"
  - "自进化"
  - "效率优化"
  - "技能学习"
type: "paper"
paper: "GenericAgent"
arxivUrl: "https://github.com/lsdefine/GenericAgent"
---

# GenericAgent: Self-Evolving AI Agents with 6x Token Efficiency

> **项目信息**: GitHub Trending 2026-04-18, by lsdefine
> **核心贡献**: 提出自进化 Agent 框架，从极小种子代码（3.3K 行）出发，通过经验积累自动生长技能树，Token 消耗仅为传统 Agent 的 1/6

## 一、问题：Agent 的 Token 低效困境

当前 AI Agent 面临严重的 **Token 效率问题**：

```
传统 Agent 工作流（每次任务重新推理）:
  任务1: 分析(2K) + 规划(1K) + 执行(3K) + 反思(1K) = 7K tokens
  任务2: 分析(2K) + 规划(1K) + 执行(3K) + 反思(1K) = 7K tokens  ← 重复！
  任务3: 分析(2K) + 规划(1K) + 执行(3K) + 反思(1K) = 7K tokens  ← 重复！
  
  总计: 21K tokens，重复率 ~70%

GenericAgent（技能复用）:
  任务1: 分析(2K) + 规划(1K) + 执行(3K) + 学习技能(0.5K) = 6.5K tokens
  任务2: 调用技能(0.3K) + 适配(0.2K) + 执行(0.5K) = 1K tokens    ← 技能复用！
  任务3: 调用技能(0.3K) + 组合(0.4K) + 执行(0.5K) = 1.2K tokens   ← 组合技能！
  
  总计: 8.7K tokens，节省 ~6x
```

核心洞察：**重复性推理是 Agent Token 浪费的主因**。如果 Agent 能将成功经验沉淀为可复用的「技能」，后续任务只需调用技能而非重新推理。

## 二、技术架构

### 2.1 三层架构

GenericAgent 采用分层架构：

```
┌──────────────────────────────────────┐
│       Layer 3: 元推理层               │
│  (决策：用已有技能 or 学习新技能)      │
├──────────────────────────────────────┤
│       Layer 2: 技能树                 │
│  ┌──────────┐  ┌──────────┐          │
│  │ 文件操作  │  │ 系统控制  │          │
│  ├──────────┤  ├──────────┤          │
│  │ 读取文件 │  │ 进程管理  │          │
│  │ 写入文件 │  │ 网络配置  │          │
│  │ 搜索文件 │  │ 服务管理  │          │
│  └──────────┘  └──────────┘          │
├──────────────────────────────────────┤
│       Layer 1: 种子代码 (3.3K行)      │
│  - 基础 LLM 调用                      │
│  - 工具注册/调用接口                   │
│  - 技能存储/检索机制                   │
│  - 经验回放缓冲区                     │
└──────────────────────────────────────┘
```

### 2.2 技能学习循环

GenericAgent 的自进化遵循四步循环：

1. **尝试**（Attempt）：面对新任务，先在技能树中检索相关技能
2. **执行**（Execute）：如果有匹配技能则调用，否则通过 LLM 推理解决
3. **提炼**（Distill）：将成功的推理链压缩为结构化技能
4. **存储**（Store）：将新技能挂载到技能树的对应节点

```python
# 技能提炼的伪代码
def distill_skill(reasoning_chain, task_description, result):
    """将推理链压缩为可复用技能"""
    skill = {
        "name": extract_skill_name(task_description),
        "trigger": extract_trigger_conditions(reasoning_chain),
        "steps": compress_to_minimal_steps(reasoning_chain),
        "params": extract_parameterizable_parts(reasoning_chain),
        "success_rate": 1.0,  # 初始成功率
        "usage_count": 0
    }
    return skill
```

### 2.3 技能组合机制

GenericAgent 的高级能力来自 **技能组合**：

```
原子技能:
  - skill_read_file(path) → content
  - skill_parse_json(content) → data  
  - skill_filter_data(data, condition) → filtered

组合技能 (自动发现):
  - skill_query_json_file(path, condition) → filtered
    = skill_read_file → skill_parse_json → skill_filter_data
```

组合技能的发现是自动的：当 Agent 多次在相近上下文中连续调用同一组原子技能时，元推理层会自动将它们封装为组合技能。

## 三、实验评测

### Token 效率对比

| Agent 框架 | 10 任务总 Token | 平均单任务 Token | 相对效率 |
|-----------|---------------|----------------|---------|
| ReAct | 85K | 8.5K | 1x |
| AutoGen | 72K | 7.2K | 1.2x |
| CrewAI | 68K | 6.8K | 1.3x |
| **GenericAgent** | **14K** | **1.4K** | **6.1x** |

### 任务成功率

在 SWE-bench Lite 子集上的评测：

| Agent | Pass@1 | Token/任务 | 效率比 |
|-------|--------|-----------|--------|
| Claude Code | 42.3% | 12K | 1x |
| Aider | 38.7% | 8K | 1.5x |
| GenericAgent | 35.1% | 2K | 6x |

GenericAgent 在准确率上略低于专用编码 Agent，但 **Token 效率高 6 倍**，适合长期运行的 Agent 场景。

## 四、技能树可视化

经过 100 个任务后的典型技能树：

```
GenericAgent 技能树 (100 任务后)

root
├── 文件系统 (23 技能)
│   ├── 读取类 (8)
│   ├── 写入类 (7)
│   ├── 搜索类 (5)
│   └── 组合操作 (3)
├── 代码操作 (18 技能)
│   ├── 分析类 (6)
│   ├── 修改类 (8)
│   └── 生成类 (4)
├── 系统管理 (12 技能)
│   ├── 进程管理 (4)
│   ├── 网络配置 (3)
│   └── 服务运维 (5)
├── 数据处理 (15 技能)
│   ├── JSON/YAML (5)
│   ├── CSV/表格 (4)
│   ├── 文本处理 (3)
│   └── 数据转换 (3)
└── 组合技能 (8 技能)
    ├── 代码审查流程 (1)
    ├── 日志分析流程 (1)
    └── ... (6)

总计: 76 原子技能 + 8 组合技能 = 84 可复用技能
```

## 五、与其他 Agent 框架的定位对比

| 维度 | ReAct | AutoGen | CrewAI | GenericAgent |
|------|-------|---------|--------|-------------|
| 学习范式 | 无学习 | 对话学习 | 角色分工 | 技能进化 |
| Token 效率 | 1x | 1.2x | 1.3x | 6x |
| 长期改善 | 无 | 有限 | 有限 | 显著 |
| 种子代码 | N/A | 15K+ | 20K+ | 3.3K |
| 适用场景 | 单次任务 | 多Agent | 工作流 | 长期运行 |

## 六、意义与启示

### 对 Agent 架构的启示

1. **经验复用 > 重复推理**：Agent 的长期效率取决于学习能力
2. **最小种子原则**：3.3K 行代码证明 Agent 不需要庞大的预设框架
3. **Token 经济学**：6x 效率提升直接转化为 6x 成本降低

### 局限性

1. 技能泛化性有限——在新领域仍需重新学习
2. 技能冲突问题——两个技能对同一任务给出矛盾建议
3. 安全审计——自动学习的技能可能包含不安全操作

---

*当 Agent 学会「不重复犯错」，AI 的效率上限将不再由模型大小决定，而由经验积累速度决定。*
