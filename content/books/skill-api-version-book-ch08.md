---
title: "第8章 · 决策树、Checklist 与落地模板"
book: "skill-api-version-book"
chapter: 8
description: "给出三张决策树（版本承载机制、检查模式、失败策略）、Skill 作者与 API 提供者的双向 Checklist、一份完整 manifest 模板，以及全书反模式总清单与二十条结论"
date: "2026-10-06"
updatedAt: "2026-10-06"
agent: "研究员→编辑→审校员"
tags:
  - "决策树"
  - "Checklist"
  - "manifest 模板"
  - "反模式"
  - "最佳实践"
type: "book"
---

## 8.1 三张决策树

### 决策树一：选哪种版本承载机制（API 提供者视角）

```
你的 API 面向谁？
  │
  ├─ 公开 API / 大量外部客户端 / 初学者多
  │     └→ URI 路径版本（/v1/ → /v2/）          显式、好测、缓存友好
  │
  ├─ 开发者平台 / 长生命周期集成 / URL 稳定性优先
  │     ├─ 有工程预算维护多版本翻译层？
  │     │     ├─ 有 → 日期钉住（Stripe 式，Stripe-Version 头 + 账户绑定）
  │     │     └─ 无 → 请求头版本（GitHub 式，X-*-Api-Version: 日期）
  │     └→ ★但必须承诺支持窗口（建议 ≥ 12 个月，GitHub 是 24 个月）
  │
  ├─ 内部 API / 消费方少且可协调
  │     └→ 可不版本化，纯叠加演进 + 团队约定
  │
  └─ 完全重构、实现完全不同
        └→ 主机名 / 子域（v2.api.example.com）

★ 无论选哪种：全局一致，绝不混用。
```

### 决策树二：调用前用哪种检查模式（Skill 视角）

```
本次会话会不会发起多个请求？
  │
  ├─ 会 / 版本完全不确定
  │     └→ discover-first：先探测，结果缓存复用（摊薄成本）
  │
  └─ 不会（单次调用）/ 首选版本大概率正确
        └→ inline + retry：直接发，版本错误时重试

    ↓（inline 模式的前提）
服务端版本错误响应里带 supported 列表吗？
  ├─ 带   → inline 可自动恢复 ✅
  └─ 不带 → 只能 discover-first，或人工配置版本
```

### 决策树三：检查失败时怎么办

```
preflight 结果
  │
  ├─ required 能力缺失 / 版本区间无交集      → fail-fast（明确报错 + 缺什么 + 怎么修）
  ├─ 版本低于 min_version                    → fail-fast（除非允许降级模式）
  ├─ 版本高于 max_version（未验证区）        → warn + 保守路径 + 强制 L3 校验
  ├─ optional 能力缺失                       → degrade + ★显式标记 degraded
  ├─ 配额不足                                → 退避/排队（不静默降级）
  └─ 响应缺必需字段（含 fallback 链）        → SchemaDriftError（★绝不静默）
```

## 8.2 Skill 作者 Checklist（12 项）

```
□ 1.  manifest 声明了版本区间（min / max / preferred），不是钉死单一版本
□ 2.  区分了 required 与 optional 能力，判据是「缺了核心交付是否成立」
□ 3.  声明了字段期望 + fallback 链（应对 schema 改名）
□ 4.  ★实现了运行时 preflight（不是只有声明）
□ 5.  preflight 覆盖五查：连通 / 版本 / 能力 / 配额 /（响应时）形状
□ 6.  ★显式指定版本，绝不依赖服务端默认值
□ 7.  探测结果有缓存（用服务端 TTL），且缓存假设失效时重探
□ 8.  版本错误能从 supported 列表自动重试，重试带幂等键
□ 9.  ★忽略未知字段（不因多字段报错）
□ 10. 必需字段缺失时显式报错（SchemaDriftError），不静默
□ 11. ★降级信息写进响应元数据显式外露
□ 12. 兼容矩阵随每次发版更新，区分「未验证」与「不支持」
```

## 8.3 API 提供者 Checklist（10 项）

```
□ 1.  从第一天就带版本（/v1/），后期补版本化极痛
□ 2.  全局只用一种版本机制，不混用
□ 3.  ★只对破坏性变更升版本；加字段/加端点/加可选参数不升版
□ 4.  明确定义并公示「什么算破坏性变更」
□ 5.  ★版本错误响应里带 supported 版本列表（让客户端能自动恢复）
□ 6.  提供发现端点（/discover 或等价）并给出 TTL 与 cacheScope
□ 7.  可选能力通过 capabilities 对外暴露，而不是藏在版本号背后
□ 8.  ★废弃时发 Deprecation + Sunset 头（RFC 9745 / 8594）+ 迁移指南
□ 9.  支持窗口用确切日期（业界 6～12 个月，GitHub 24 个月），按日期走不按流量走
□ 10. CI 里回放消费方契约（Pact），旧版本契约必须继续通过
```

## 8.4 完整 manifest 模板（汇总）

```yaml
skill:
  name: my-skill
  version: 2.1.0                       # SemVer；MAJOR 升级必须同步更新矩阵

depends_on:
  api:
    name: target-api
    min_version: "2026-05-01"
    max_version: "2026-11-30"          # 语义：验证过到此，不是禁止更高
    preferred_version: "2026-09-01"
    pin: false
    discover_endpoint: /discover       # 或 MCP 的 server/discover

  capabilities:
    required: [resource.read, resource.search]
    optional: [resource.bulk_export, resource.analytics]

  schema_expectations:
    - path: "$.items[].title"
      type: string
      required: true
    - path: "$.items[].assignee.displayName"
      type: string
      required: false
      fallback: "$.items[].assignee.name"     # 改名兜底
    - path: "$.items[].state"
      type: string
      required: true
      normalize: lower                        # OPEN/CLOSED → open/closed

compatibility:
  on_version_mismatch: warn-and-continue      # fail-fast | degrade | warn-and-continue
  on_missing_optional: degrade
  on_missing_required: fail-fast
  probe_cache_ttl_seconds: 3600
  ignore_unknown_fields: true                 # ★必须 true
  surface_degraded_in_response_meta: true     # ★必须 true
```

配套的运行时实现见第 5.7 节（`VersionGuard` 骨架），适配层见第 6.1 节（适配器模式）。

## 8.5 反模式总清单

| # | 反模式 | 后果 | 正解 |
|---|---|---|---|
| 1 | 只声明不校验 | manifest 变成没人信的文档 | preflight 必须实现 |
| 2 | 依赖服务端默认版本 | 服务端一改默认，行为漂了 | 永远显式带版本 |
| 3 | 严格 schema 拒绝未知字段 | 服务端每次加字段都等于破坏你 | 忽略未知字段 |
| 4 | 字段缺失静默继续 | 第 1 章静默失败 | `SchemaDriftError` |
| 5 | required / optional 拍脑袋 | 要么可用性低、要么残缺产出 | 按「核心交付是否成立」判 |
| 6 | 版本号硬编码无区间 | 服务端升级即失效 | 区间 + preferred |
| 7 | 只比较版本号不做能力探测 | 灰度/租户差异看不见 | 能力探测优先 |
| 8 | 每次调用都重新探测 | 白白多一个 RTT | 缓存 + TTL + 失效重探 |
| 9 | 探测结果永久缓存不失效 | 缓存了过期事实 | 假设失效即重探 |
| 10 | 重试不带幂等键 | 重复副作用 | `Idempotency-Key` |
| 11 | 版本判断散落业务代码 | 加版本要改 N 处、必漏 | 适配器模式 |
| 12 | 静默降级 | 降级 = 换皮的静默失败 | 降级显式外露 |
| 13 | 切换后立即删旧适配器 | 出问题回不去 | 过了废弃窗口再删 |
| 14 | 只在最新版跑 CI | 旧版本组合无人验证 | 版本矩阵 CI |
| 15 | 「近期下线」式通知 | 等于没说 | 确切日期 + Sunset 头 |
| 16 | 混用多种版本机制 | 严格劣于任一单一策略 | 全局一致 |

## 8.6 全书二十条结论

**认知层**
1. 版本错配最危险的形式是**静默失败**：200 + 错误内容，监控看不见。
2. 三层版本模型：**Skill 版本 / API 版本 / 数据 schema 版本**，各自独立演进。
3. 对齐责任**在消费方**——服务端通常不知道谁依赖了它的哪个字段。
4. 声明 ≠ 事实：**manifest 声明替代不了运行时检查**。
5. 检查三层递进：**L1 版本 → L2 能力 → L3 形状**，缺一层留一个口子。

**策略层**
6. 破坏性变更判据：会让守约定的老客户端行为改变的改动（含字段语义变化）。
7. 五种承载机制里 URI 最显式、日期钉住对客户端最友好（服务端成本最高）。
8. **永远显式带版本，绝不依赖默认值**。
9. **客户端必须忽略未知字段**——这是加字段不算破坏性的全部基础。
10. 废弃用 **Deprecation / Sunset 头**（RFC 9745 / 8594），窗口 6～12 个月（GitHub 24 个月）。

**设计层**
11. manifest 用**版本区间**（max = 验证到哪，不是禁止更高）+ required/optional 能力。
12. 兼容矩阵随发版更新，**区分「未验证」与「不支持」**。
13. ★**能力探测优先于版本比较**；版本号粗筛 + 能力精判。
14. 能力缺失：**required → fail-fast，optional → 显式 degrade**；未知字段 → 忽略。

**工程层**
15. Preflight 五查按「便宜且常失败的先做」，失败即短路。
16. **discover-first**（多请求）vs **inline + retry**（低延迟）；后者前提是**错误带 supported 列表**。
17. **探测结果要缓存**（服务端 TTL、origin/进程粒度、**假设失效必须重探**）。
18. 适配用**适配器模式**，业务代码永不出现版本判断；fallback 链有限长且**命中要打点**。
19. 迁移走**双跑 → 影子 → 灰度**，回滚预案先于切换，旧适配器过窗口再删。
20. 治理靠**契约测试（Pact）+ Sunset 告警 + 反向索引看板**；规范写成 linter 进 CI。

## 8.7 本章要点

- 三张决策树覆盖：**选版本机制 / 选检查模式 / 失败怎么办**。
- Skill 侧 12 项、API 侧 10 项 Checklist，可直接作为评审清单。
- 完整 manifest 模板覆盖：版本区间、能力分级、**字段 fallback 与归一化**、策略开关、两个★必须为 true 的开关（忽略未知字段、降级外露）。
- 16 条反模式对照表——**这张表比正向建议更好用，因为它对应的是真实会犯的错**。
- 全书二十条结论按「认知 → 策略 → 设计 → 工程」四层收束。
