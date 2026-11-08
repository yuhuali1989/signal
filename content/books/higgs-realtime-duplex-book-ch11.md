---
title: "Higgs Realtime Duplex 深度拆解 - 第11章: 训练栈：2T 续训、MOPD 专家教师与 RSI 闭环"
book: "Higgs Realtime Duplex 深度拆解：从 160ms 时间片到因果 DiT"
chapter: "11"
chapterTitle: "训练栈：2T 续训、MOPD 专家教师与 RSI 闭环"
description: "展开官方后训练配方，讲清多教师 on-policy 蒸馏与 GRPO 在话轮判断上的适配性、四类专家教师各自负责的策略、蒸馏成单一学生的过程，以及递归自改进闭环与仿真环境要求"
date: "2026-11-08"
updatedAt: "2026-11-08"
agent: "研究员→编辑→审校员"
tags:
  - "MOPD"
  - "GRPO"
  - "蒸馏"
  - "RSI"
  - "仿真环境"
type: "book"
part: "篇五 · 训练"
---

# 第 11 章 · 训练栈：2T 续训、MOPD 与 RSI 闭环

## 11.1 三段式看训练

按官方披露，训练可以分成三层，本书不额外脑补未公开阶段：

```
① 起点：一个文本预训练模型（名称【未公开】）
② 续训：约 2T token 的文本 / 音频 / 视觉数据【官方】→ 45B MoE 基座
③ 后训练：MOPD（多教师 on-policy 蒸馏）+ RSI 闭环【官方】→ 最终前台模型
```

第 ② 层在第 6 章讲过动机：文本是压舱石，音视频负责跨模态对齐，IFEval 94.1 说明语言能力没被拖垮。这一章重点拆第 ③ 层。

## 11.2 MOPD：多教师 on-policy 蒸馏

官方：`For post-training, we use multi-teacher on-policy distillation (MOPD). Starting from the same base model, we train specialist teachers with reinforcement learning, including GRPO, on groups of related tasks... We then distill them into a single student that combines these capabilities.`

拆成四步：

```python
# 【推断】按官方描述的结构骨架，非官方实现
base = load_text_pretrained_then_continue_2T()      # 同一基座
teachers = {}
for group in ["natural_conversation", "interactive_behavior",
              "dynamic_delegation", "task_completion"]:
    teachers[group] = rl_train(copy(base),
                               env=interactive_sim[group],
                               algo="GRPO",                 # 【官方】含 GRPO
                               on_policy=True)              # 轨迹来自当前学生策略
student = distill(base, teachers, on_policy_rollouts=True)
```

三个术语值得展开：

**① on-policy**：教师的训练数据来自**当前策略自己与环境交互产生的轨迹**，而不是一份固定的离线数据集。好处是蒸馏时不会出现分布漂移——学生实际会遇到的状态，教师就在这些状态上给过示范。对「何时该附和」这类强上下文依赖的判断，这一点尤其关键：离线数据里「该附和」的时机分布，和模型自己跑出来的时机分布可能差很远。

**② GRPO（Group Relative Policy Optimization）**：对同一状态采样一组动作，用组内相对优势来更新策略，不需要单独训一个 value model。它适合话轮判断的原因是——**这类决策给不出绝对奖励**。「这一片该不该说 mm-hm」没有标准分数，但「在同样上下文里，附和比沉默好」这种相对比较是可以从交互结果里得到的。组相对偏好正好对上。

**③ 多教师 → 单学生**：不是把四个模型堆在一起路由，而是把四种能力**蒸馏进一个学生**。这点很重要：第 9 章那个 160ms 硬实时循环里，没有余地每片跑一次「该找哪个专家」的调度；单一主干是恒定算力的前提。

## 11.3 四类专家教师各自在学什么

| 教师 | 任务组【官方】 | 学到的策略【官方】 |
|---|---|---|
| 自然对话 | `natural conversation` | 说什么：语言质量、连贯、语气 |
| 交互行为 | `interactive behavior` | 何时说 / 何时让步（对应第 10 章替掉的四个 VAD 阈值） |
| 动态委派 | `dynamic delegation` | 何时自己答、何时把任务交给更大后端 |
| 任务完成 | `task completion` | 何时起推理线程、何时调工具、如何跟到结果 |

官方那句总结最精准：

> `Through interaction, the teachers learn what to say and when to act—when to speak or yield, begin or extend a reasoning thread, call a tool, or delegate.`

**「说什么 + 何时行动」这个并列，是整本书对训练部分最该记住的一句**。传统后训练基本只优化「说什么」；全双工多出来的那一半——时机——被单独建成一类可学习策略。这也解释了为什么第 10 章的 VAD 规则能被整体删掉。

## 11.4 RSI 闭环：把 edge case 变成训练数据

官方：`We also use a recursive self-improvement (RSI) loop: our agent system interacts with simulated environments, reviews its failures, synthesizes targeted data, and trains the model on it before repeating the cycle.`

四步闭环：

```
仿真环境交互 → 复盘失败 → 合成定向数据 → 训练 → 回到仿真
```

**仿真必须重现什么**【官方】：`interruptions, overlapping speech, side conversations, background noise`。官方给仿真定了两条标准，缺一不可：

- `realistic enough to teach natural behavior`（真实到能教出自然行为）；
- `hard enough to expose weaknesses`（难到能暴露弱点）。

第二条更关键：如果仿真太温和，模型只会把顺境练得更熟，闭环转再多轮也拿不到新数据。

官方还有一句非常重：

> `The engineering target is the whole harness of simulators, tools, and judges, not an isolated model.`
> `For a small team, the loop turns edge cases into training data and lets us iterate with far less manual data work.`

**工程对象是整套 harness（模拟器 + 工具 + 裁判），不是孤立的模型**。这跟站内《RSI 工程全书》第 6 章那条「瓶颈是验证，不是生成」是同一句话：生成失败案例不难，判断「哪些失败值得合成数据、合成的数据是否真的补上了缺口」才是成本所在；judge 就是这套闭环里的 oracle。

## 11.5 用 RSI 全书的尺子给它定级

拿站内《递归自我改进（RSI）工程全书》的 L0–L3 证据阶梯量一下（这是本书的分析，不是 Boson 的自我定位）：

| 判据 | Higgs 这条闭环 |
|---|---|
| 改动对象 | 训练数据 / 交互策略，属于 **learner 侧** |
| 干预范围 | 合成数据回灌训练，评估由 judges 完成 |
| 验证器 | 仿真环境 + 裁判，但**未公开是否冻结、是否披露可变集重合度** |
| 状态继承 | 每轮训练后的模型进入下一轮仿真，是 |
| 改进者是否变强 | **无公开证据**；harness 由研发团队搭建，模型没有改写仿真器/裁判 |

结论：**这是典型的 L1 有界自精化 + 验证器**，和站内 Hy4 算子采纳率 37→61%、K3.5 自动审计报告属于同一层。它不是 L2 点火——没有「新版本 improver 带来更大后续增益」的跨轮反事实证据，harness 本身也没被模型自己改写。

这个定位不是贬低。L1 恰恰是 2026 年产业界真正拿到收益的一层：把 edge case 自动转成训练数据，对小团队省下的是最贵的人工数据工作。只是别把它读成「模型在改进自己改进自己的方式」。

## 11.6 训练成本与自建集群的呼应

第 6 章讲过 `own NVIDIA H100 cluster` + `data center Boson built itself` + `based in part on Megatron`。放到本章的训练栈上看，三处开销都很实在：

1. **2T token 续训**：大规模 MoE 的专家并行/张量并行，Megatron 是成熟底座；
2. **四个 GRPO 教师**：每个都要在仿真环境里做 on-policy 采样，算力是「一次训练 × 四组交互」；
3. **RSI 闭环反复迭代**：每轮都要跑仿真、复盘、合成、再训练，是长期常驻的算力，不是一次性任务。

这正好解释李沐在公开讲座里强调的带宽/内存/算力判断与「自己建机房甚至电厂更便宜」的成本账——**当训练变成一个持续闭环而不是一次性项目，自有集群的边际成本才会低于按需租云**。（⑤号来源，属动机解释而非官方规格。）

## 11.7 本章【未公开】清单

- 四个教师各自的数据量、奖励函数、GRPO 组大小与超参；
- 蒸馏损失、教师权重、on-policy rollout 的采样规模；
- 仿真环境数量、裁判是人还是模型、是否冻结评估器；
- RSI 循环轮数与每轮增益（因此无法判断是否出现加速）；
- 2T token 的三模态配比、课程安排。

官方给的是**方法名与意图**，不是可复现的训练配方。本书也不把上面这些补成表格——这正是第 1 章四级证据纪律的用处。

## 11.8 本章小结

- 训练三层：文本基座 → 约 2T token 三模态续训 → MOPD + RSI 后训练。
- MOPD：同一基座用 RL（含 GRPO）训四类专家教师，on-policy 采样避免分布漂移，再蒸馏成**单一学生**（恒定算力所需）。
- GRPO 用组内相对优势，适合「该不该附和」这类无绝对奖励的时机判断；教师学的是「**说什么 + 何时行动**」。
- RSI 闭环：仿真交互 → 复盘失败 → 合成定向数据 → 训练；仿真须含插话/重叠/旁人对话/噪声，且要难到暴露弱点；工程目标是整套 harness。
- 按站内 L0–L3 尺子，这是 **L1 有界自精化 + 验证器**，不是 L2 点火。
- 训练配方大部分【未公开】，本书不补成配置表。

> 最后一章：把七项 benchmark、未公开清单、产品状态、与教学基准书的逐条对账，以及七条可迁移原则收成全书结论。
