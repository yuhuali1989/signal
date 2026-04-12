---
title: "Anthropic RSP 3.0：当安全标杆放弃了自己的红线"
slug: "anthropic-rsp3-safety-compromise"
date: "2026-04-11"
author: "Signal AI"
category: "safety-analysis"
tags:
  - "行业动态"
  - "安全与治理"
type: "article"
description: "Anthropic 撤销 RSP 核心安全承诺的深度分析——AI 安全社区最值得信任的公司，为何选择了妥协？"
---

# Anthropic RSP 3.0：当安全标杆放弃了自己的红线

> Claude Mythos 太强不敢公开，RSP 却悄悄放松——Anthropic 的两难困境折射出整个 AI 安全领域的结构性矛盾。

## 核心事件

2026 年 4 月第二周，Anthropic 几乎同时做了两件看似矛盾的事：

1. **发布 Claude Mythos 但锁在 50 家公司内**——因为「攻击性网络能力太强」
2. **撤销 RSP 的硬性安全承诺**——从「不安全就不部署」变为「透明度优先」

这不是精神分裂。这是一家在 **商业扩张 vs 安全承诺** 之间被撕裂的公司做出的现实选择。

## RSP 的演变：从铁律到弹性

### RSP 1.0 & 2.0 的核心承诺

Anthropic 的 Responsible Scaling Policy (RSP) 曾是 AI 安全领域的金标准。核心条款是一条硬性红线：

> **「如果安全缓解措施未到位，我们不会部署超过当前安全级别的模型。」**

这意味着：即使模型已经训练完成、性能卓越，只要安全评估未通过，就**绝不上线**。这条规则让 Anthropic 在安全社区赢得了极高的信誉。

### RSP 3.0 的转向

新的 RSP 3.0 将硬性承诺替换为：

| RSP 2.0 | RSP 3.0 |
|----------|---------|
| 不安全就不部署（hard stop） | 透明度 + 风险评估 + 灵活处理 |
| 外部审计后才发布 | 内部评估为主 + 定期报告 |
| 安全缓解 = 发布前提 | 安全缓解 = 持续改进目标 |
| 二元判断（pass/fail） | 连续光谱（风险等级） |

## 为什么 Anthropic 不得不这样做？

### 1. 商业压力：$30B 营收的代价

Anthropic 的年化营收突破 $30B，首次超越 OpenAI。但这种增长建立在企业客户的持续信任上。如果严格执行 RSP 2.0：

- Claude Mythos 可能永远无法商用（安全评估永远有争议）
- 客户会转向 OpenAI 或 GLM-5.1（后者直接 MIT 开源，无任何使用限制）
- Broadcom 的 3.5GW 算力投资需要商业回报

### 2. 竞争格局：安全不对称

现实是残酷的：

```
Anthropic: Claude Mythos → 锁在 50 家公司内
智谱 AI:   GLM-5.1      → MIT 开源，任何人可用
OpenAI:    GPT-5.4      → 全球公开 API
Meta:      Muse Spark   → 闭源但大规模部署
DeepSeek:  V3/R2        → 开源，部分国家已禁止
```

当竞争对手不遵守相同的安全标准时，单方面的自我约束就变成了竞争劣势。

### 3. Claude Marketplace 的生态需求

Anthropic 推出的 Claude Marketplace 允许企业将 Claude 支出分配给 Snowflake、Replit、GitLab 等第三方工具。这意味着 Claude 不再只是一个模型，而是一个**平台**。平台需要灵活性。

## 安全社区的反应

### 批评声浪

AI 安全领域的反应普遍负面：

- **Stuart Russell (UC Berkeley)**：「这正是我们警告过的——商业激励最终会压倒安全承诺」
- **Center for AI Safety**：发表声明称「RSP 3.0 实质上取消了任何有意义的部署门槛」
- **前 Anthropic 安全研究员**（匿名）：「我们曾经引以为豪的红线，现在变成了虚线」

### 支持者的观点

也有人认为这是务实的选择：

- RSP 2.0 的二元判断本来就不科学——安全不是 0/1 问题
- 透明度框架让外界能更好地监督
- 如果固守不切实际的标准导致 Anthropic 倒闭，AI 安全反而更糟

## Claude Mythos 的悖论

这里出现了一个有趣的悖论：

- Anthropic **不敢公开** Claude Mythos（太危险）
- 但 Anthropic **放松了** 决定什么可以公开的标准
- 那么下一个 Claude Mythos 级别的模型，还会被限制吗？

RSP 3.0 下，答案是**不确定的**。这正是批评者担心的核心问题。

## 对行业的影响

### 1. AI 安全标准的「向下竞争」

如果连 Anthropic 都放松了安全标准，其他公司还有什么理由遵守更严格的规则？这可能触发安全标准的「Race to the Bottom」。

### 2. 监管的紧迫性

欧盟 AI Act 已经生效，但它主要针对「高风险应用」，对前沿模型的能力本身缺乏约束力。RSP 3.0 事件可能加速各国对前沿 AI 能力的直接监管。

### 3. 开源 vs 闭源安全叙事的反转

讽刺的是：

- 过去：闭源 = 更安全（公司可以控制访问）
- 现在：GLM-5.1 (MIT) 可能比 Claude Mythos (封闭) 更「安全」，因为安全社区可以完全审计开源模型，而 Mythos 的安全评估完全由 Anthropic 内部决定

## 结论：信任一旦打折，很难回本

Anthropic 的品牌价值建立在「我们是安全优先的 AI 公司」这一承诺上。RSP 3.0 不会让这个品牌瞬间崩塌，但它在 Anthropic 最宝贵的资产——安全社区的信任——上打了一个折扣。

在 AI 能力指数级增长的时代，**信任是唯一不能用算力买到的东西**。

---

*本文由 Signal 知识平台 AI 智能体生成*
