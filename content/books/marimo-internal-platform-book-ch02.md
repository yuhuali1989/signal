---
title: "Notebook 全书：形态差异、平台选型与自建落地 - 第18章: marimo 开源代码拆解：能复用什么、必须懂什么"
book: "Notebook 全书：形态差异、平台选型与自建落地"
chapter: "18"
description: "拆解 marimo 的代码结构与核心模块（App/Cell/Kernel/DAG/ScopedVisitor/ASGI 服务）、响应式执行原理、四种执行环境与部署形态，并给出 molab 的参考架构与二次开发切入点"
date: "2026-10-06"
updatedAt: "2026-10-06"
agent: "研究员→编辑→审校员"
tags:
  - "marimo"
  - "源码架构"
  - "响应式执行"
  - "DAG"
  - "Pyodide"
  - "uv"
type: "book"
part: "篇三 · 自建与落地"
---

## 2.1 总体技术栈

| 层 | 技术 |
|---|---|
| 后端 | **Python**（核心引擎 + 运行时） |
| 服务 | **Starlette / ASGI**（`marimo/_server/asgi.py`） |
| 前端 | **React + TypeScript**（`frontend/`） |
| 内核通信 | WebSocket / RPC 风格消息 |
| 包管理 | **uv**（PEP 723 内联元数据 + sandbox venv） |
| 许可 | **Apache-2.0** |

这是一个「**Python 引擎 + Starlette 服务 + React 前端**」的经典三层结构。对自建而言最大的好处是：**引擎是 pip 包，可以被你的服务 import 和驱动**，而不是必须跑它自己的 CLI。

## 2.2 核心模块地图

| 模块 | 职责 | 为什么对你重要 |
|---|---|---|
| `marimo/_ast/app.py` | **`App`**：notebook 的应用定义（cell 集合） | 你要在服务端加载/校验 notebook 时面对的对象 |
| `marimo/_ast/cell.py` | **`Cell`**：单元格，记录 `defs`（定义的变量）与 `refs`（引用的变量） | ★响应式的数据来源 |
| `marimo/_runtime/runtime.py` | **Kernel**：协调执行、维护状态与 DAG | 你要做暂停/恢复/资源限制时的落点 |
| `DirectedGraph` | 反应式依赖图 | 可做「影响面分析」「哪些 cell 会重跑」 |
| `cell_runner` | 真正执行 cell，管理前后钩子 | ★**埋点、审计、超时控制的最佳切入点** |
| `ScopedVisitor` | AST 静态分析，收集 refs / defs | 想做「notebook 静态检查」可直接复用 |
| `marimo/_server/asgi.py` | ASGI 服务入口 | ★**嵌鉴权、注入租户上下文的位置** |
| `frontend/src/plugins/` | 前端插件系统 | 自定义 UI 元素/主题从这里扩展 |
| `marimo/_save/save.py` | 缓存（`mo.cache`） | 与你的对象存储对接 |
| `marimo/_dependencies/` | 依赖检测与安装 | 与 uv / 沙箱策略相关 |

### 公共 API（你的平台代码会直接用到）

```
marimo.App        应用定义          marimo.md       动态 Markdown
marimo.Cell       单元格装饰器      marimo.sql      SQL 单元
marimo.ui         交互元素          marimo.state   可变响应式状态
marimo.stop       条件中断执行      marimo.cache   缓存
```

## 2.3 响应式执行原理（必须理解，否则会误用）

```
① 静态分析：加载 notebook 时，对每个 cell 做一次 AST 分析
   → 提取该 cell 定义了哪些变量（defs）、引用了哪些变量（refs）
        ↓
② 构图：以 defs/refs 为边，构建有向无环图（DAG）
        ↓
③ 调度：某个 cell 变更（或 UI 元素更新）
   → 沿 DAG 找出所有依赖它的 cell → 重跑（或标记 stale）
        ↓
④ 无 hidden state：删除 cell → 它的变量被真正清除，下游随之更新
```

三个必须传达给用户/同事的点（也是常见踩坑）：

| 要点 | 说明 |
|---|---|
| **执行顺序 ≠ 页面顺序** | 顺序由变量引用决定，所以可以把辅助函数放最后、重要输出放最前 |
| ★**不要跨 cell 修改对象** | marimo 只跟踪 defs/refs，**不跟踪运行时对象变更**。要改 dataframe（如加一列），**必须和定义它的 cell 放同一个 cell** |
| **可变状态用 `mo.state`** | 需要跨 cell 共享的可变状态要用官方的 `marimo.state`，不要用全局变量 hack |

> 最后一条是「Jupyter 老手转 marimo」最容易翻车的地方，也是内部推广时**必须写进规范**的一条。

## 2.4 四种执行环境（★自建选型的直接依据）

| 环境 | 机制 | 适用场景 | 平台化含义 |
|---|---|---|---|
| **Native Python** | 跑在当前 Python 环境 | 本地开发 | 不适合多用户平台 |
| **Sandbox** | **uv** 虚拟环境 + PEP 723 内联依赖，按 notebook 隔离 | ★**自建默认选择** | 依赖可复现，隔离成本低 |
| **Docker** | 容器内执行 | 不信任代码 / 远程执行 | 更强隔离，启动更慢 |
| **Browser WASM** | Pyodide，浏览器内跑，无后端 | 文档嵌入、轻量演示 | 不能跑重包/ML |

**自建推荐**：**Sandbox（uv + PEP 723）为主，Docker 兜底**。理由：

- PEP 723 把依赖内联在 `.py` 文件顶部（`# /// script` 块），**notebook 自描述、可复现**，天然适合 Git 与审计
- uv 装包极快（molab 就是靠它做到「边 import 边装」），用户体验接近本地
- Docker 方案给不信任场景（如对外共享、外包人员）使用

## 2.5 部署形态（平台要托管的四种产物）

| 命令 / 形态 | 产物 | 平台侧要做什么 |
|---|---|---|
| `marimo edit nb.py` | 交互式编辑会话 | ★会话调度、鉴权、持久化 |
| `marimo run nb.py` | **App**（隐藏代码，只留交互） | App 托管、路由、访问控制、只读分享 |
| `python nb.py` / CLI 参数 | 脚本 / 流水线任务 | ★调度器、参数注入、产物归档、告警 |
| `marimo export html-wasm` | 静态 HTML（Pyodide） | 静态托管、嵌入内网文档/门户 |
| `marimo export ... slides` | 幻灯片 | 报告场景 |

> **app 形态是内部平台价值最高的一块**：`marimo run` 隐藏代码只留交互控件，等于**零前端成本地把分析变成业务方可用的工具**——这正是 Hex 的 app mode 卖点，而你在 marimo 里免费拥有。

## 2.6 SQL 与数据接入

- marimo 内置 **SQL 引擎**，可查询 dataframe、数据库、湖仓、CSV、Google Sheets，结果返回 dataframe
- 支持 **Polars / Pandas / PyArrow / DuckDB / SQLite / Postgres / MySQL** 等后端
- SQL cell 可以依赖 Python 变量（把 Python 值嵌进查询）

**平台侧要补的**：数据库连接的**凭证代管**（不能让用户把密码写进 notebook）、连接目录、查询下推与配额。这是第 4 章的重点之一。

## 2.7 AI 能力：已留好接口

| 能力 | 机制 | 对内部平台的价值 |
|---|---|---|
| **`marimo pair`** | 把任意 agent（Claude Code、Codex、OpenCode 等）连到**正在运行的 marimo session** | ★agent 能读写运行时状态、在 kernel 里执行 |
| **编辑器内置 AI** | 支持自带 API key、自定义 system prompt、**本地模型** | ★可指向内部模型端点，数据不出内网 |
| **上下文感知** | AI 能看到内存里的变量 | 生成的代码更贴合实际数据（比凭空生成强） |

> 对内部平台而言，这意味着 **AI Native 那一层不用从零做**——marimo 已经提供了「agent ↔ kernel」的通道，你要做的是**把通道接到内部模型/agent、并加审计与安全边界**（第 6 章）。

## 2.8 molab 的架构：一份现成的自建参考

molab 是官方托管实现，其公开技术选型对自建极具参考价值：

| 组件 | molab 用的 | 自建可替代为 |
|---|---|---|
| 容器/算力 | **Modal**（快速容器启动） | K8s / 内部容器平台 / 云函数 |
| 包管理 | **uv** | uv（一致） |
| 持久化存储 | **Cloudflare R2** | 内部对象存储（S3 兼容 / OSS / MinIO） |
| 远程存储 | Google Drive / HuggingFace / **S3 兼容** | 内部对象存储 |
| 共享 | public-but-undiscoverable 链接（类似 secret gist） | 内部链接 + 权限校验 |
| AI | 免费开源模型 + `marimo pair` | 内部模型端点 |

**可直接抄的三条经验**：

1. **容器启动速度决定体验**——molab 专门选 Modal 就是为了快；自建时「冷启动 < 10 秒」应当是硬指标
2. **预装常用包 + uv 按需补装**：molab 预装 PyTorch/NumPy/Polars，其余靠 uv 现装
3. **持久化只认两类**：sidebar 上传的文件 + `mo.persistent_cache` 缓存（且有限制）——自建要明确告知用户「什么会持久、什么不会」

## 2.9 二次开发的正确切入点

按「改动代价从小到大」排序：

| 优先级 | 做法 | 例子 |
|---|---|---|
| **1. 纯外围**（首选） | 不改源码，只用 CLI / API / 配置 | 用 `marimo run` 起 app、用脚本模式跑调度 |
| **2. 包一层服务** | 自己写控制面，调 marimo 的 Python API | 会话管理、鉴权网关、调度器 |
| **3. 注入/钩子** | 利用 `cell_runner` 钩子、ASGI 中间件 | 审计埋点、超时、租户上下文注入 |
| **4. 改源码**（最后手段） | fork 并维护 patch | 深度定制存储后端、特殊鉴权 |

> ★**fork 治理原则**：若必须改源码，**patch 要小而独立，并尽量向上游提 PR**。否则上游一升级你就得重做合并——这是自研平台最常见的慢性死亡方式（第 5 章细讲）。

## 2.10 本章要点

- 技术栈：**Python 引擎 + Starlette/ASGI 服务 + React/TS 前端**，Apache-2.0。
- 核心模块：`App` / `Cell`（defs+refs）/ `Kernel` / `DirectedGraph` / `cell_runner` / `ScopedVisitor` / `asgi.py`。
- ★响应式靠**静态分析构建 DAG**，执行顺序与页面顺序无关；**不要跨 cell 改对象**，可变状态用 `mo.state`。
- 四种执行环境，自建推荐 **Sandbox（uv + PEP 723）为主、Docker 兜底**；WASM 只用于文档嵌入。
- 产物四形态：**edit / run(app) / script / export**；★**app 形态是价值最高的免费午餐**。
- AI 已留通道（`marimo pair` + 自带 key/本地模型），平台要做的是接内部模型 + 加边界。
- molab 架构（Modal + uv + R2）是现成范本；★冷启动速度、预装 + 按需装、持久化边界三条经验可直接抄。
- 二次开发优先级：**外围 → 包一层 → 钩子注入 →（最后）改源码**，fork patch 要小而可上游化。
