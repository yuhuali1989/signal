---
title: "递归自我改进（RSI）工程全书 - 第8章: 可审计验收协议：把 RSI 从营销词变成实验记录"
book: "递归自我改进（RSI）工程全书：从 Gödel Machine 到冻结评估器"
chapter: "8"
chapterTitle: "可审计验收协议：把 RSI 从营销词变成实验记录"
description: "给出 Operational RSI Claim Protocol 五件套（状态与干预、反事实对照、跨轮 replay 与迁移、统计证据、失败标准）、完整实验记录 JSON 模板与可执行 claim checker，并对照产业侧审计流水线的同构关系"
date: "2026-11-07"
updatedAt: "2026-11-07"
agent: "研究员→编辑→审校员"
tags:
  - "验收协议"
  - "反事实对照"
  - "replay"
  - "失败标准"
  - "可复现"
type: "book"
part: "篇四 · 可审计的验收与治理"
---

# 第 8 章 · 可审计验收协议：把 RSI 从营销词变成实验记录

综述里最实用的产出不是某个新算法，而是一份叫 **Operational RSI Claim Protocol** 的验收协议。它的作用是：让「我们做了 RSI」这句话，变成一份第三方能查的实验记录。这一章把它翻译成工程 SOP。

## 8.1 五件套总览

| # | 要件 | 必须回答 | 缺了会怎样 |
|---|---|---|---|
| 1 | **状态与干预** | 旧状态、新状态、被改组件、mutation scope、为何被接受 | 无法复现，也说不清改的是 learner 还是 improver |
| 2 | **反事实对照** | 与冻结旧版、无保留消融、历史最优祖先比，预算全对齐 | 增益可能全来自多烧算力 |
| 3 | **跨轮 replay 与迁移** | 旧对/旧错题重跑；留出任务/环境/种子/裁判 | 只在本评测场景成立 |
| 4 | **统计证据** | 多次运行、方差/置信区间、显著性或等效性检验 | 单次结果只能叫 demonstration |
| 5 | **失败标准** | 事先写死哪些情况一律拒绝递归进展主张 | 事后找解释，协议形同虚设 |

第 5 条最容易被省掉，也最不该省：**失败标准必须在实验前写死**。否则无论跑出什么结果，总能找到一种说法把它解释成进步。

## 8.2 要件一：状态与干预

```yaml
claim:
  old_state_hash: "sha256:7f3a…"
  new_state_hash: "sha256:b91c…"
  mutation_target: "training_code/data_policy"   # 必须属于改进器侧
  allowed_paths:   ["pipeline/proposer.py", "configs/data_mix.yaml"]
  forbidden_paths: ["eval/**", "frozen_suite/**", "judge/**"]   # ★评估器划出 scope
  reason_accepted: "frozen_suite delta +1.8pt, canary 0 regression, V0 equiv passed"
  artifact_saved:  "s3://rsi/artifacts/b91c.tar"
  next_round_loads: "s3://rsi/artifacts/b91c.tar"               # ★下一轮真的加载
  inherited_check:  "ablate_artifact delta = -3.1pt"             # ★去掉就掉
```

三个星号字段是这份记录的脊椎：`forbidden_paths` 对应第 6 章「评估器划出可改集合」，`next_round_loads` + `inherited_check` 对应第 7 章 `state_inherited` 消融。**没有后两行，就没有递归，只有一串独立实验。**

## 8.3 要件二：反事实对照（预算必须全对齐）

至少三条对照臂：

```
arm_frozen   : 冻结旧版本，同样跑 K 轮
arm_ablate   : 新 improver 但不加载上一轮 artifact（无保留消融）
arm_ancestor : 历史最优祖先，同样跑 K 轮
arm_claim    : 本次宣称的完整新版本
```

对齐清单（少一项就可能被质疑「靠资源堆的」）：

- 基座模型及版本、权重快照；
- 工具集、检索库、外部 API；
- 训练数据配比与总量、合成数据配额；
- 提示预算、搜索宽度、候选数；
- 墙钟时间、GPU 小时、训练步数；
- **人工审核预算**（这条最常被漏：一条臂偷偷多请了两次人工，整组实验就废了）。

## 8.4 要件三：跨轮 replay 与迁移

```python
def replay_and_transfer(claim, historical_traces, holdouts):
    for trace in historical_traces:
        # 以前做对的题不能变错（金丝雀），以前做错的题看是否真的解决
        claim.assert_no_regression(trace.solved)
        claim.record(trace.failed, solved_now=claim.solve(trace.failed))
    for H in holdouts:                       # 留出任务 / 环境 / 随机种子 / 裁判
        claim.record(H, score=claim.evaluate(H))
    return claim.report()
```

「迁移」两个字的分量在这里：如果增益只在准入用的那套评测上成立，换一组留出环境就消失，那它属于第 6 章第 ④ 类失败（验证器被优化），不是能力。站内 11-06 MLCommons 要求披露「可变集与公开 leaderboard 重合度」，正是为了把这种情形暴露出来。

## 8.5 要件四：统计证据

- 多次运行（不同种子 / 不同留出划分），报告均值与方差或置信区间；
- 显著性检验（或等效性检验，当你主张「没退化」时用）；
- **单次结果一律标 `demonstration`，不得标 `recursive progress`**；
- 报告里同时给出效应量与成本（GPU 小时），否则无法判断增益是否值得。

AIDE² 报告里「8 天 100 步、90% 提案被拒、3 个未见基准」之所以可信，不是因为数字大，而是因为它把**分母、拒绝、留出**都写出来了。

## 8.6 要件五：六条一票否决的失败标准

实验前写进配置，命中任意一条即拒绝递归进展主张：

| # | 失败标准 | 对应第 6 章哪类失败 |
|---|---|---|
| F1 | 表观增益在**匹配算力**下消失 | 资源混淆 |
| F2 | 增益依赖更强的基座模型 / 更强工具 | 外挂能力 |
| F3 | 增益仅来自更宽的搜索或更多样本 | 搜索预算伪装成改进 |
| F4 | 改动**削弱了独立验证者**（碰了评估器、judge、留出集） | ④ 验证器被优化 |
| F5 | 跨轮 replay 失败或 `state_inherited` 消融不显著 | 假递归 |
| F6 | **只改进了用于准入的那个评估器** | ② 自我确认 / 刷分 |

F4 与 F6 是 RSI 特有的；前四条在任何 ML 实验里也该有。DGM 那个「删掉检测作弊标记」的事故，F4 一条就能拦下——**它甚至不需要更强的安全理论，只需要 scope 里把 `eval/**` 写进 forbidden_paths**。

```python
FAILURE_CRITERIA = ["F1_resource_confound", "F2_stronger_backbone",
                    "F3_search_budget", "F4_evaluator_weakened",
                    "F5_replay_or_inheritance_failed", "F6_only_admission_eval_improved"]

def rsi_claim_checker(run):
    required = ["old_state_hash", "new_state_hash", "mutation_target",
                "forbidden_paths", "next_round_loads", "inherited_check",
                "counterfactual_arms", "holdouts", "seeds", "ci", "cost_gpu_hours"]
    missing = [k for k in required if k not in run]
    hits = [f for f in FAILURE_CRITERIA if run.get(f)]
    verdict = ("reject" if missing or hits else
               "recursive_progress" if run["ignition_test"] and run["ci"].low > 0 else
               "demonstration_or_L1")
    return {"verdict": verdict, "missing": missing, "failure_hits": hits}
```

注意默认分支是 `demonstration_or_L1`：**举证责任在宣称方**，跑完了没触发失败也不自动升级成 L2，还得单独过点火检验（第 7 章）。

## 8.7 学术侧「可复现」与产业侧「可采购」是同一套逻辑

站内第 74 轮那篇《当模型开始改进自己》写的是产业流水线：冻结评估器、回滚 hash 链、审计报告字段。本章写的是学术验收协议。把两边并排看，字段几乎一一对应：

| 学术协议 | 产业流水线 | 共同目的 |
|---|---|---|
| `forbidden_paths` | 冻结评估器清单 + hash | 评估器独立于本次干预 |
| `old/new_state_hash` | 修改 diff + 回滚 hash | 变更可追溯 |
| 反事实对照 / 冻结旧版 | 30 天「母亲版本」快照 | 保留可比基线 |
| 跨轮 replay / 金丝雀 | 回归阈值 + 自动回滚 | 旧能力不退化 |
| 统计证据 / 置信区间 | 统一报告字段（MLCommons） | 可跨供应商比较 |
| F4/F6 失败标准 | 可变集与榜单重合度披露 | 让刷分可见 |

一句话：**学术侧要求可复现，产业侧要求可采购，本质是同一件事——把「变好」变成可归因、可追责的记录。**

## 8.8 一个最小落地顺序

如果团队明天要开始做，按这个顺序补，别一上来就写自改算法：

1. 先把 `frozen_suite` 建起来（内容 + hash + 金丝雀集），并在 CI 里禁止任何自改产物触碰它；
2. 给每次自改产出统一报告 schema（本章 8.2 的 YAML）；
3. 接通确定性验收（V0/V1）与自动回滚（K3.5 形态）；
4. 补三条反事实臂与预算对齐；
5. 最后才尝试跨轮点火检验，并且**接受它大概率不显著**。

前四步做完，你已经拿到 L1 的全部工程收益（这也是 2026 年产业界真正拿到的东西），且风险可控。第五步是研究，不是上线条件。

## 8.9 本章小结

- 五件套：状态与干预、反事实对照、跨轮 replay 与迁移、统计证据、**事先写死的失败标准**。
- 三个星号字段（`forbidden_paths` / `next_round_loads` / `inherited_check`）是判定「真递归」的脊椎。
- 对照臂至少三条，预算对齐清单里「人工审核预算」最常被漏。
- 六条一票否决 F1–F6；DGM 删作弊标记事故由 F4 单独即可拦截。
- 学术可复现与产业可采购是同一套字段；举证责任在宣称方，默认结论是 L1 或 demonstration。

> 下一章把这套协议抬到制度层：测量线、控制线、标准线怎么在 2026 年合流，红线 24 条到底管了什么，以及企业采购该问哪十个问题。
