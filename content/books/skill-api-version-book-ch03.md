---
title: "第3章 · Skill 侧的版本元数据与兼容矩阵"
book: "Skill 与服务 API 版本对应全书"
chapter: 3
description: "设计 Skill manifest 的版本元数据字段（版本区间、必需与可选能力），讲清兼容性矩阵怎么画、语义化版本在消费方怎么用，以及为什么声明永远替代不了运行时验证"
date: "2026-10-06"
updatedAt: "2026-10-06"
agent: "研究员→编辑→审校员"
tags:
  - "API 版本"
  - "Skill 版本"
  - "manifest"
  - "兼容矩阵"
  - "语义化版本"
type: "book"
---

## 3.1 manifest 该声明什么

Skill 的 manifest（无论是 `SKILL.md` 的 frontmatter、插件清单、还是 package.json 扩展字段）应当把「我依赖什么」显式写出来。推荐字段集：

```yaml
# Skill 版本与依赖声明（推荐形态）
skill:
  name: issue-reporter
  version: 2.1.0                 # Skill 自身版本，遵循 SemVer

depends_on:
  api:
    name: codehost-api
    # ★用区间，不要写死单一版本
    min_version: "2026-05-01"
    max_version: "2026-11-30"    # 上界是「已知兼容到此」，不是「不许超过」
    preferred_version: "2026-09-01"
    pin: false                   # true = 强制钉住，不做区间自适应

  capabilities:
    required:                    # 没有它就完全不能工作 → 直接失败
      - issues.read
      - issues.search
    optional:                    # 没有它就降级 → 优雅退化
      - issues.bulk_export
      - issues.analytics

  schema_expectations:           # L3 形状校验的声明依据
    - path: "$.issues[].title"
      type: string
    - path: "$.issues[].assignee.displayName"
      type: string
      fallback: "$.issues[].assignee.name"   # 旧字段兜底

compatibility:
  on_version_mismatch: fail-fast   # fail-fast | degrade | warn-and-continue
  on_missing_optional: degrade
  probe_cache_ttl_seconds: 3600
```

### 字段设计要点

| 字段 | 为什么必须有 |
|---|---|
| `min_version` | 低于此版本缺少必需能力，直接不可用 |
| `max_version` | ★**表达「我验证过到此为止」**，超过就是未测试区（不是禁止，是警示） |
| `preferred_version` | 优先尝试的版本，命中则走最优路径 |
| `required` 能力 | 缺失 → **fail-fast**，不要带病运行 |
| `optional` 能力 | 缺失 → **degrade**，功能缩减但可用 |
| `fallback` 字段路径 | ★应对 schema 改名（第 1 章 `name → displayName` 的直接解法） |

## 3.2 为什么用区间而不是单一版本

| 写法 | 问题 |
|---|---|
| `version: "2026-09-01"`（钉死） | 服务端一升级你就废；且你无法利用新版能力 |
| `min: "2026-05-01"`（只有下界） | 不知道上界，未来新版未经验证就自动命中，风险不可控 |
| **区间 + preferred**（推荐） | 明确「测试过的范围」，超出范围有明确策略 |

> **语义澄清**：`max_version` 的含义是「**我验证过的最高版本**」，不是「禁止更高版本」。超出上界时应当按 `on_version_mismatch` 策略处理（通常是 warn + 降级到保守路径），而不是直接拒绝——否则服务端一发新版你的 Skill 就全量失效，这是另一种形式的脆弱。

## 3.3 兼容性矩阵怎么画

矩阵是**沟通工具**，给三类人看：Skill 作者、运维、业务方。推荐形态：

| Skill 版本 | API 2026-05-01 | API 2026-09-01 | API 2026-11-30 | 说明 |
|---|---|---|---|---|
| v1.0.x | ✅ 完全支持 | ⚠ 降级（缺 `displayName`，走 fallback） | ❌ 不支持 | 已废弃，建议迁移 |
| v2.0.x | ✅ | ✅ | ⚠ 未验证 | 当前主流 |
| v2.1.x | ✅ | ✅ | ✅ | 推荐 |

**图例约定**（必须写明，否则矩阵会被误读）：

- ✅ 完全支持（全能力 + 全字段）
- ⚠ 降级支持（核心可用，部分可选能力缺失）
- ❌ 不支持（必需能力缺失，直接失败）
- 「未验证」要与「不支持」区分开——**未验证不等于坏，但意味着没有保障**

> **矩阵必须跟着发布走**：每次 Skill 发版、每次 API 出新版本，矩阵都要更新一格。过期矩阵比没有矩阵更有害，因为它给人虚假的安全感。

## 3.4 语义化版本在 Skill 侧的用法

Skill 自身版本遵循 SemVer（`MAJOR.MINOR.PATCH`），但与 API 兼容性相关的是**前两位**：

| 变动 | 版本号 | 含义 |
|---|---|---|
| 破坏性变更（改 required 能力、改输出契约） | **MAJOR** +1 | 消费你这个 Skill 的上层需要适配 |
| 新增能力支持（新增 optional 能力、拓宽版本区间） | **MINOR** +1 | 向后兼容，可直接升级 |
| bug 修复、fallback 调整 | **PATCH** +1 | 无契约变化 |

**关键规则**：**Skill 的 MAJOR 升级，必须同步更新兼容矩阵**——因为它的依赖契约变了。反过来，MINOR/PATCH 升级不应该动 required 能力集合。

## 3.5 required 与 optional 的划分原则

这是最容易拍脑袋的地方。判据：

> **问一个问题：如果这个能力不可用，我的核心交付物还能不能成立？**
> - 不能 → `required`（缺了就 fail-fast，别产出半成品）
> - 能，只是差一点 → `optional`（缺了就 degrade，明确告知降级）

常见误判：

| 误判 | 后果 |
|---|---|
| 把「锦上添花」的能力设为 required | 环境稍有差异就全量失败，**可用性白白降低** |
| 把「核心依赖」设为 optional | 静默降级后产出残缺结果，**回到第 1 章的静默失败** |

## 3.6 ★ 声明 vs 验证：分工必须清楚

| | 声明（manifest） | 验证（运行时 preflight） |
|---|---|---|
| 时机 | 静态、写死在文件里 | 每次调用前（可缓存） |
| 回答 | 「我打算用什么」 | 「对面现在实际是什么」 |
| 失效场景 | 服务端升级、灰度、租户差异、配置漂移 | — |
| 能否互相替代 | **不能** | **不能** |

**典型坑**：团队精心维护了 manifest，然后**从未在运行时校验过**。结果是声明与事实长期背离，manifest 变成一份没人信的文档——**这比不写还糟，因为它会让人以为检查已经做过了**。

## 3.7 manifest 反模式清单

| 反模式 | 为什么错 | 改法 |
|---|---|---|
| 只写 `api: v2`，无区间无能力 | 信息不足，无法做检查 | 补齐 min/max/required/optional |
| 把所有能力都设为 required | 可用性极低 | 按第 3.5 节判据重划 |
| 声明了 `max_version` 但超限直接 crash | 服务端发新版即全量故障 | 超限走 warn + 保守路径 |
| 矩阵写完不更新 | 虚假安全感 | 纳入发布流程强制更新 |
| 字段路径硬编码，无 fallback | schema 改名即静默失败 | 关键字段配 fallback 路径 |
| 只有声明没有运行时校验 | 声明沦为文档 | 第 5 章的 preflight 必须实现 |

## 3.8 本章要点

- manifest 要声明：**版本区间（min/max/preferred）+ required/optional 能力 + 字段期望与 fallback + 不匹配时的策略**。
- 用**区间**不用单一版本；`max_version` 是「验证过到哪」，不是「禁止更高」。
- **兼容矩阵必须区分「未验证」和「不支持」**，且随每次发布更新。
- Skill 的 **MAJOR 升级必须同步更新矩阵**；required/optional 按「缺了核心交付是否成立」划分。
- ★**声明替代不了运行时验证**——只有声明没有 preflight，等于把 manifest 变成一份没人信的文档。
