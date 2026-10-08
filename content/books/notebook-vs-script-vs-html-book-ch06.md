---
title: "Notebook 全书：形态差异、平台选型与自建落地 - 第7章: 工程化：测试、CI、参数化与调度"
book: "Notebook 全书：形态差异、平台选型与自建落地"
chapter: "7"
description: "对比三种形态在单元测试、持续集成、参数化运行、定时调度与模块化复用上的能力差距，重点论证「被 cron 依赖的 notebook 已经变成带漂亮 UI 的技术债」这一判断"
date: "2026-10-06"
updatedAt: "2026-10-06"
agent: "研究员→编辑→审校员"
tags:
  - "工程化"
  - "CI"
  - "papermill"
  - "调度"
  - "模块化"
  - "技术债"
type: "book"
part: "篇二 · 工程：从探索到交付"
---
# 第 7 章 · 工程化：测试、CI、参数化与调度

## 6.1 测试：谁能被单测覆盖

| 形态 | 测试能力 | 工具 | 评价 |
|---|---|---|---|
| **Python 脚本** | ★**原生最强** | pytest / unittest | 函数即单元，CI 直接跑 |
| **Notebook** | 中 | **nbval**（校验输出）/ **testbook**（注入执行）/ marimo 可直接 pytest | 可行但要额外搭 |
| **HTML** | ❌ 无 | — | 只能人眼看数 |

**给 Notebook 加测试的三条实用做法**：

1. **把逻辑提升到 `.py` 模块**，notebook 只调用——逻辑就有单测了（见 6.5 节）
2. **在 notebook 里加断言 cell**：`assert 0 <= rate <= 1`、`assert df.shape[0] > 0`
3. **CI 里跑 `nbconvert --execute`**：任何 cell 报错即失败——这本身就是最强的「冒烟测试」

> 第 3 条投入极小、收益极高：**它把「notebook 能不能从头跑通」这件事从人的记忆变成了流水线的闸门。**

## 6.2 CI：谁能进流水线

| 形态 | CI 集成 | 做法 |
|---|---|---|
| **脚本** | ★天然 | `pytest` + lint + type check + 构建 |
| **Notebook** | 需配置 | `nbconvert --execute`（全量执行，报错即失败）<br>`papermill`（带参数执行）<br>marimo：`python nb.py` 直接跑 |
| **HTML** | 只能校验产物 | 最多检查「能否成功生成」，无法验证内容对错 |

**推荐的 notebook CI 流水线**：

```
① 拉代码
② 装依赖（锁文件）
③ nbconvert --execute / papermill 跑全量   ← 核心闸门
④ 比对产出（如生成报告/指标文件）
⑤ 导出 HTML 作为构建产物（可选）
```

## 6.3 参数化：让同一份东西跑不同输入

| 形态 | 参数化方式 |
|---|---|
| **脚本** | `argparse` / `click` / 环境变量 —— ★最成熟 |
| **Notebook** | **papermill**：给 cell 打 `parameters` 标签，执行时注入；或 marimo CLI 参数 |
| **HTML** | ❌ 无法参数化（只能重新生成） |

```bash
# papermill：同一份 notebook，换个日期再跑一次
papermill report.ipynb out_2026-09-30.ipynb -p date 2026-09-30 -p category electronics
```

> **参数化是「探索」走向「生产」的第一步**：当你开始需要「换个日期再跑一次」时，就该考虑参数化；再往下走一步就是调度。

## 6.4 ★ 调度与生产化：notebook 的能力边界

这是本章最重要的判断，直接引用业界共识：

> **「探索留在 notebook 里，任何无人值守运行的东西都该在它之外。」**
> **「当一个 notebook 变成 cron 任务或生产触发器的依赖时，它就不再是 notebook 了——它成了带着漂亮 UI 的、无人追踪的技术债。」**

| 形态 | 适合调度吗 | 说明 |
|---|---|---|
| **脚本** | ★**是** | 可预测、可重试、可告警、可容器化 |
| **Notebook** | ⚠️ 勉强 | papermill/nbconvert 能跑，但依赖 kernel 与文件状态，**故障排查更难** |
| **HTML** | ❌ 否 | 它只是产物 |

**不该用 notebook 的场景**（业界共识）：

- 长驻服务、后端 API
- 需要可预测调度的批任务
- 已经被 cron 或生产触发器依赖的东西

> 判断信号很简单：**如果它挂了会有人半夜被叫起来，它就不该是 notebook。**

## 6.5 ★ 模块化：notebook 是消费者，不是源码

一条被广泛认同的心智模型：

> **「notebook 是你库代码的消费者，而不是库代码的来源。」**

推荐的目录结构：

```
src/
  features.py      # 有单测的特征变换
  model.py         # 有单测的训练/评估函数
notebooks/
  01_eda.ipynb     # 从 src/ import，展示图与表
  02_baseline.ipynb
```

配套技巧（Jupyter）：

```python
%load_ext autoreload
%autoreload 2
from src import features, model   # 改了 .py 立即生效，不用重启 kernel
```

**「提升出去（promote out）」的信号**：

| 信号 | 含义 |
|---|---|
| 同一段代码被复制粘贴到第二个 notebook | ★它属于 `.py` 模块 |
| 某段逻辑需要被测试 | 它属于 `.py` 模块 |
| 想把它 import 到别处 | 它属于 `.py` 模块 |
| 它开始被别人依赖 | 它属于 `.py` 模块 |

> marimo 在这点上更进一步：notebook **本身就是 `.py`**，可以直接被 import、被 pytest——格式层面就没了这个鸿沟。

## 6.6 部署路径对比

| 形态 | 部署路径 |
|---|---|
| **脚本** | ★Docker / K8s / Airflow / 云函数 —— 标准生产链路 |
| **Notebook** | 需 nbconvert 转成脚本，或靠平台托管（marimo run、Hex、Deepnote） |
| **HTML** | 静态托管 / CDN / 嵌入 —— 零后端成本 |

**常见工业化流水线（双轨制）**：

```
Notebook（探索验证）
   ↓ jupytext / nbconvert
纯 Python 脚本
   ↓ 单元测试
生产部署（Docker / K8s / Airflow）
   ↓ 产出
HTML / 静态报告（交付）
```

## 6.7 规模与性能的硬边界

| 限制 | 说明 |
|---|---|
| **notebook 文件 > 100 MB** | ★性能骤降——浏览器要渲染累积的全部输出。解法：清理旧输出或把逻辑迁到 `.py` |
| **大 DataFrame 渲染** | 典型笔记本渲染约 200–800 ms；表太大应显示摘要/采样 |
| **kernel 启动** | 本地通常 1–3 秒，共享服务器更久 |
| **HTML** | 数据全在页面里 → **页面大小随数据量线性膨胀**，超大表不适合直接嵌 |

> 这些边界的实际含义：**notebook 与 HTML 都适合「结果集」，不适合「全量数据」**。真正的全量数据处理应该在脚本/数仓里完成，结果再进 notebook 或 HTML。

## 6.8 本章要点

- 测试：**脚本原生最强**；notebook 靠断言 cell + `nbconvert --execute`（★性价比最高）+ 逻辑提升到模块；HTML 无。
- CI：脚本天然；notebook 用 `nbconvert --execute` / `papermill` 做闸门；HTML 只能校验「能否生成」。
- 参数化：`argparse` / **papermill**（`parameters` 标签）/ marimo CLI；HTML 无法参数化。
- ★**调度是 notebook 的能力边界**：「被 cron 依赖的 notebook 已是带漂亮 UI 的技术债」；**挂了会半夜叫醒人的东西不该是 notebook**。
- ★**notebook 是库代码的消费者，不是源码**；复制粘贴/需要测试/要被 import = 提升为 `.py` 的信号。
- 工业流水线：**Notebook → jupytext/nbconvert → 脚本 → 单测 → 生产 → HTML 交付**。
- 硬边界：notebook > 100 MB 性能骤降；**notebook 与 HTML 都只适合装结果集，不适合装全量数据**。
