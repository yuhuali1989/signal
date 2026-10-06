---
title: "第4章 · 能力协商优于版本号比较"
book: "skill-api-version-book"
chapter: 4
description: "讲清版本号比较为何在灰度、可选能力、租户差异下失效，提出能力探测优先的原则，并以 MCP 官方规范的版本与能力协商机制为完整实证案例，给出缺失能力时的回退与拒绝矩阵"
date: "2026-10-06"
updatedAt: "2026-10-06"
agent: "研究员→编辑→审校员"
tags:
  - "能力协商"
  - "feature detection"
  - "MCP"
  - "版本协商"
  - "优雅降级"
type: "book"
---

## 4.1 版本号比较为什么会失效

「比较版本号」看起来是最自然的检查方式（`myVer <= apiVer`），但它在四种场景下静默失效：

| 失效场景 | 例子 | 版本号比较的结论 | 实际 |
|---|---|---|---|
| **① 同一版本号，不同能力集** | API `2026-09-01` 在 A 租户开了 `bulk_export`，B 租户没开 | 相同 → 通过 | 一个能用一个不能用 |
| **② 灰度发布** | 新能力只放量 10% | 相同 → 通过 | 90% 概率缺能力 |
| **③ 能力是可选的** | 服务端实现了但可配置关闭 | 相同 → 通过 | 可能关闭了 |
| **④ 版本不反映字段级差异** | schema 改名但版本号未动（第 1 章事故） | 相同 → 通过 | 字段已经变了 |

**根因**：版本号是**粗粒度的、单向的、由提供方维护的**标签；而 Skill 真正关心的是「**我需要的那几个能力在不在、那几个字段长什么样**」——这是**细粒度的、多维的、由实际运行态决定**的事实。

## 4.2 ★ 原则：能力探测优先于版本比较

> **Feature / Capability Detection > Version Comparison**

这条原则在前端领域叫「特性检测优于 UA 嗅探」，在 API 领域同理：

| | 版本比较 | 能力探测 |
|---|---|---|
| 问的问题 | 「你是不是 v2？」 | 「你能不能做 X？」 |
| 粒度 | 粗（整个契约） | 细（单个能力） |
| 灰度/租户差异 | 看不见 | **看得见** |
| 服务端加可选能力 | 需要升级版本号 | **不需要** |
| 失败模式 | 要么全通过要么全拒绝 | 可按能力逐个降级 |

**推荐组合**：**用版本号做粗筛（快速排除完全不兼容的代际），用能力探测做精判（决定走哪条路径、降不降级）**。两者不是替代关系，是分层关系。

## 4.3 完整实证：MCP 的版本与能力协商机制

Model Context Protocol（MCP）把上面的原则做成了规范，是极好的现成范例。以下依据其官方规范与 SDK 文档。

### 4.3.1 两个 era，且**没有协商握手**

| Era | 版本 | 机制 |
|---|---|---|
| **Modern** | `2026-07-28` 及以后 | **无握手**，每个请求在 `_meta` 里自带版本与能力，服务器**逐请求独立**接受/拒绝 |
| **Legacy** | `2025-11-25` 及以前 | 用 `initialize` 握手建立会话 |

规范原话值得抄下来：

> **There is no negotiation handshake. Every request carries its protocol version, and the server accepts or rejects each request independently.**

这个设计选择的价值：**无状态、无会话、每个请求自证身份**——避免了「握手时的版本」与「实际请求时的版本」不一致的问题。

### 4.3.2 版本不符 → 错误里直接给出 supported 列表

```
请求版本不被支持时：
{
  "jsonrpc": "2.0", "id": 1,
  "error": {
    "code": -32022,
    "message": "Unsupported protocol version",
    "data": { "supported": ["2026-07-28", "2025-11-25"], "requested": "1900-01-01" }
  }
}
```

★**关键设计**：错误响应里**带着服务器支持的版本列表**。规范明确要求客户端：

> The client **SHOULD** select a mutually supported version from the `supported` list and **retry** the request, or surface an error if no compatible version exists.

这比「报错了但不知道该用什么」强太多——**一次往返就完成了版本发现**。

### 4.3.3 能力声明：capabilities + extensions

```json
// 客户端声明自己支持的能力与扩展
{
  "capabilities": {
    "roots": {},
    "extensions": {
      "io.modelcontextprotocol/ui": { "mimeTypes": ["text/html;profile=mcp-app"] }
    }
  }
}
```

- **核心能力**：客户端侧 `sampling` / `elicitation` / `roots`；服务器侧 `tools` / `resources` / `prompts` / `logging`
- **可选扩展**：`extensions` map，键是带前缀的扩展标识（如 `io.modelcontextprotocol/tasks`），值是该扩展的设置对象（空对象 = 支持但无额外设置）
- 请求若依赖**未声明**的客户端能力 → `-32021` 错误

### 4.3.4 能力缺失时必须明确回退

> If one party supports an extension but the other does not, the supporting party **MUST** either **revert to core protocol behavior** or **reject the request** with an appropriate error. Extensions **SHOULD** document their expected fallback behavior.

这是第 6 章降级设计要抄的原文规范：**二选一（回退核心行为 / 明确拒绝），且必须文档化 fallback 行为**。注意它禁止的是「静默地做别的事」。

### 4.3.5 版本/能力发现：`server/discover`

服务器 **MUST** 实现 `server/discover`；客户端 **MAY** 在发其他请求前先调用它，但**不是必须**：

```json
// 请求
{ "jsonrpc":"2.0", "id":"discover-1", "method":"server/discover",
  "params": { "_meta": { "io.modelcontextprotocol/protocolVersion": "2026-07-28" } } }

// 响应
{ "jsonrpc":"2.0", "id":"discover-1",
  "result": {
    "resultType": "complete",
    "supportedVersions": ["2026-07-28"],
    "capabilities": { "tools": {}, "resources": {} },
    "_meta": { "io.modelcontextprotocol/serverInfo": { "name":"ExampleServer", "version":"1.0.0" } },
    "ttlMs": 3600000, "cacheScope": "public"
  } }
```

**两种合法用法**（第 5 章会展开）：

1. **先 discover**：调用前就知道支持什么，稳妥但多一个 RTT
2. **inline + 处理 -32022**：直接发请求，版本不对时从错误里拿 supported 列表重试——**零额外 RTT（成功路径）**

### 4.3.6 ★ era 判定要缓存（规范明确要求）

因为要同时兼容 legacy 与 modern，客户端需要探测「对面是哪个 era」。规范对缓存的要求：

> Clients **SHOULD** cache the result for the lifetime of the server process (stdio) or origin (HTTP), and **MAY** persist it across restarts of the same server configuration, **re-probing if the cached assumption later fails**.

三条可直接复用的规则：

1. 缓存粒度：**stdio = server 进程生命周期；HTTP = origin**
2. 可持久化到配置级
3. **缓存假设失效时必须重新探测**（不是永久信任）

SDK 层的对应实现：

| SDK | 模式 |
|---|---|
| Python | `mode="auto"`（探测 `server/discover`，非 modern 错误则回退 legacy 握手）／`mode="legacy"`（强制握手）／**钉住版本**（不探测） |
| Ruby | `mode: :modern`（只走现代生命周期，legacy-only 服务器直接失败）／`:legacy`／`:auto` |

> **注意 SDK 的一个真实坑**：服务器升级到 modern 后，原本读 `server_info["protocolVersion"]` 的代码会突然返回 `nil`（因为自动协商采用了 modern 生命周期，返回结构变了）。**这正是第 1 章「行为漂移」的实例——版本号没变，返回结构变了。** 解法是用 era 无关的读取器（如 `client.protocol_version`）。

## 4.4 能力探测的三种手段

| 手段 | 做法 | 适用 | 成本 |
|---|---|---|---|
| **① 发现端点** | 调 `server/discover` / `/capabilities` / introspection | 有标准发现端点时 | 1 RTT（可缓存） |
| **② 元数据携带** | 读响应头/响应体的 capabilities、ttlMs、cacheScope | ★最省，顺带就有 | 0 |
| **③ 探针调用** | 发一个无害的轻量请求（如 `tools/list`、ping）看是否支持 | 无发现端点时的兜底 | 1 RTT（可缓存） |

**优先级**：② > ① > ③。能用顺带信息就别多打一次，能走标准发现端点就别自己发明探针。

## 4.5 能力缺失的处理矩阵（★）

| 能力类型 | 缺失时 | 理由 |
|---|---|---|
| **required 能力** | **fail-fast**：明确报错 + 说明缺什么 + 建议动作 | 核心交付不成立，跑下去只会产出残缺/错误结果 |
| **optional 能力** | **degrade**：走替代路径，**必须显式告知已降级** | 核心仍成立，但必须让调用方知道结果范围变了 |
| **可选扩展** | 回退核心行为，**或**明确拒绝（二选一，需文档化） | 照抄 MCP 规范的 MUST |
| **未知字段** | **忽略**（第 2.5 节铁律） | 服务端加字段是合法演进 |

**降级必须「显式」**——写进日志、写进返回值元数据、必要时告知用户。静默降级 = 第 1 章的静默失败换了件衣服。

## 4.6 本章要点

- 版本号比较在**灰度、租户差异、可选能力、schema 未跟版本变动**四种场景下静默失效。
- ★**能力探测优先于版本比较**；推荐分层：版本号粗筛 + 能力探测精判。
- MCP 实证要点：**无握手、逐请求自带版本**；版本不符返回 **-32022 + supported 列表**供客户端重试；`server/discover` 可选；能力缺失 MUST **回退核心行为或明确拒绝**；**era 判定必须缓存并在失效时重探**。
- 探测手段优先级：**顺带元数据 > 标准发现端点 > 自制探针**。
- 降级矩阵：required 缺失 → fail-fast；optional 缺失 → **显式** degrade；未知字段 → 忽略。**静默降级等于静默失败**。
