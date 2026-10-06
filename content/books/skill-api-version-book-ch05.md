---
title: "第5章 · 调用前的检查（Preflight 设计）"
book: "skill-api-version-book"
chapter: 5
description: "给出调用前检查的完整落地方案：五查内容与短路顺序、先发现还是内联重试两种模式的取舍、探测结果的缓存与失效重探、快速失败与优雅降级的决策树，以及一份可直接抄的 Preflight 参考实现"
date: "2026-10-06"
updatedAt: "2026-10-06"
agent: "研究员→编辑→审校员"
tags:
  - "Preflight"
  - "调用前检查"
  - "版本校验"
  - "优雅降级"
  - "幂等"
  - "缓存"
type: "book"
---

## 5.1 Preflight 查什么：五查

调用前检查不是「ping 一下」，而是五项按序进行：

| # | 检查 | 判据 | 失败动作 |
|---|---|---|---|
| **① 连通与鉴权** | 能不能连上、凭证是否有效 | HTTP 可达 / 401·403 判定 | 直接失败（重试无意义，除非凭证可刷新） |
| **② 版本对应（L1）** | 服务端支持的版本区间是否含我要的版本 | supported 列表 ∩ [min, max] | 不匹配 → 按 `on_version_mismatch` 策略 |
| **③ 能力齐全（L2）** | `required` 能力是否全在；`optional` 缺哪些 | capabilities 集合运算 | required 缺 → fail-fast；optional 缺 → 记录降级 |
| **④ 形状预期（L3·前置）** | 声明的字段期望路径是否有 fallback | manifest 的 `schema_expectations` | 拿到响应后校验（见 5.7） |
| **⑤ 配额与限流** | 余量是否够这次调用 | 配额端点 / 响应头 | 不够 → 退避或排队 |

**④ 为什么放在「前置」**：形状校验要等响应回来才能做，但它依赖 manifest 声明的 fallback 链，所以**预检查阶段要把 fallback 链准备好**，响应阶段才执行。

## 5.2 顺序与短路：便宜的先做

```
①连通/鉴权  →  ②版本  →  ③能力  →  ⑤配额  →  (调用)  →  ④形状校验(响应)
   ↓失败          ↓失败      ↓required缺    ↓不足         ↓字段不符
  立即失败      按策略     立即失败       退避/排队     显式报错
```

**原则**：
- **越便宜、越可能失败的检查越靠前**（连通性最便宜且最常失败）
- **任一环失败立即短路**，不要带着已知问题继续
- **④ 形状校验只能在响应后做**，但它是最容易被省略的一环——省略它就回到第 1 章的静默失败

## 5.3 两种模式：先发现（discover-first）vs 内联重试（inline + retry）

MCP 规范同时允许两种，这是个很好的设计取舍样本：

| | **Discover-first** | **Inline + retry** |
|---|---|---|
| 流程 | 先调 `server/discover` → 选版本 → 发业务请求 | 直接发业务请求（带首选版本）→ 若 -32022 则从 supported 列表重试 |
| 成功路径 RTT | 2 次（discover + 业务） | **1 次** |
| 失败路径 RTT | 2 次（discover 已知结果，可能直接判失败） | 2 次（业务失败 + 重试） |
| 首调延迟 | 略高 | **低** |
| 适用场景 | 长连接、会发很多请求、版本不确定 | 一次性调用、版本大概率正确、追求低延迟 |

**决策规则**：

```
if 本次会话将发起多请求 or 版本完全不确定:
    → discover-first（探测一次，全会话复用）
elif 单次调用 or 首选版本大概率正确:
    → inline + retry（成功路径零额外开销）
```

**两者都成立的前提**：错误响应里**必须带 supported 列表**（MCP 的 -32022 就是这么设计的）。如果你的 API 只返回一个「版本不支持」而**不给可用列表**，那么 inline 模式就无法自动恢复，只能 discover-first 或人工配置。

> **给 API 设计者的建议**：版本错误响应**一定要带上 supported 版本列表**。这一个字段，能把消费方从「配错版本就卡死」变成「自动协商恢复」。

## 5.4 ★ 缓存：让检查的成本趋近于零

「检查太贵」是跳过检查的头号借口，而缓存直接消掉这个借口：

| 缓存什么 | 粒度 | 失效条件 |
|---|---|---|
| 服务器支持的**版本列表** | 每个 origin / 每个 server 进程 | TTL 到期、连接重建、配置变更 |
| **能力集合** | 同上 | 同上 |
| **era 判定**（modern/legacy） | stdio = 进程生命周期；HTTP = origin | ★**缓存假设失效时必须重探** |
| **版本选择结果** | 同上 | 同上 |

规范（MCP）给出的可复用规则：

> Clients **SHOULD** cache the result for the lifetime of the server process (stdio) or origin (HTTP), **MAY** persist it across restarts of the same server configuration, **re-probing if the cached assumption later fails**.

三条硬性要求：

1. **用服务端给的 TTL**：MCP 的 `server/discover` 响应带 `ttlMs` 与 `cacheScope`，照它缓存；没有就用 manifest 里的 `probe_cache_ttl_seconds`（默认 3600 是个合理起点）
2. **缓存失败也要重探**：一次探测失败不要永久缓存「失败」
3. **★缓存假设失效必须重探**：调用时若出现与缓存不符的错误（比如缓存说支持某版本但实际报 -32022），**立即作废缓存重新探测**——这是防止「缓存了过期事实」的关键

**成本账**：假设 TTL = 1 小时、每次调用省 1 个 RTT、一小时内调用 1000 次，则摊薄后每千次调用只多 1 次探测。**相比静默失败，这个成本低到没有讨论价值。**

## 5.5 fail-fast 还是 degrade：决策树

```
preflight 结果
  │
  ├─ required 能力缺失 / 版本区间完全不相交
  │     └→ ★ fail-fast：明确报错，说明缺什么、建议怎么修
  │
  ├─ optional 能力缺失
  │     └→ degrade：走替代路径，★必须显式标记 degraded=true
  │
  ├─ 版本高于 max_version（未验证区）
  │     └→ warn + 保守路径：仍可调用，但走 L3 严格校验 + 记录告警
  │
  ├─ 版本低于 min_version
  │     └→ fail-fast（除非 manifest 显式允许降级模式）
  │
  └─ 配额不足
        └→ 退避重试 / 排队，不静默降级
```

**判据回顾（第 3.5 节）**：required 缺失 = 核心交付不成立 → 必须 fail-fast；optional 缺失 = 核心仍成立 → degrade 但**显式告知**。

## 5.6 重试、幂等与超时

版本协商天然涉及重试（inline 模式），所以必须配套：

| 要点 | 做法 |
|---|---|
| **幂等** | 写操作必须带 `Idempotency-Key`，否则重试会造成重复副作用 |
| **只重试可重试的** | 版本错误（-32022）、429、5xx 可重试；400/401/403 不重试 |
| **重试上限与退避** | 版本重试最多遍历 supported 列表一次；网络类用指数退避 |
| **超时** | preflight 超时必须**短于**业务超时（探测只是前置，别让它拖垮主流程） |
| **重试换版本要重放完整上下文** | 不同版本的参数/字段可能不同，不能只换版本号 |

## 5.7 参考实现（可直接抄的骨架）

```python
import time
from dataclasses import dataclass, field

@dataclass
class Probe:
    supported_versions: list[str]
    capabilities: set[str]
    fetched_at: float
    ttl_ms: int = 3_600_000
    def fresh(self) -> bool:
        return (time.time() - self.fetched_at) * 1000 < self.ttl_ms

@dataclass
class Decision:
    ok: bool
    version: str | None = None
    degraded: list[str] = field(default_factory=list)   # ★显式记录降级项
    reason: str = ""

class VersionGuard:
    """调用前的版本与能力守卫。"""

    def __init__(self, manifest, transport):
        self.m = manifest                      # 第 3 章的 manifest
        self.t = transport                     # 具体传输（HTTP / stdio ...）
        self._probe: Probe | None = None
        self.warnings: list[str] = []

    # ---- 探测（带缓存 + 失效重探）----
    def probe(self, force: bool = False) -> Probe:
        if self._probe and self._probe.fresh() and not force:
            return self._probe
        res = self.t.discover()                # server/discover 或等价端点
        self._probe = Probe(
            supported_versions=res["supportedVersions"],
            capabilities=set(res.get("capabilities", {})),
            fetched_at=time.time(),
            ttl_ms=res.get("ttlMs", 3_600_000),
        )
        return self._probe

    # ---- Preflight 五查 ----
    def preflight(self) -> Decision:
        if not self.t.healthy():                                   # ①连通
            return Decision(False, reason="connectivity/auth failed")

        p = self.probe()                                           # ②版本
        want = self.m.preferred_version
        if want not in p.supported_versions:
            cand = [v for v in p.supported_versions
                    if self.m.min_version <= v <= self.m.max_version]
            if not cand:
                return Decision(False, reason=f"no version in range; supported={p.supported_versions}")
            want = cand[-1]                                        # 选区间内最新
            self.warnings.append(f"preferred {self.m.preferred_version} unsupported, fell back to {want}")

        if want > self.m.max_version:                              # 超越验证区
            self.warnings.append(f"{want} > max_version {self.m.max_version}: unvalidated, strict L3 enabled")

        missing_req = self.m.required_capabilities - p.capabilities  # ③能力
        if missing_req:
            return Decision(False, reason=f"missing required capabilities: {sorted(missing_req)}")

        degraded = sorted(self.m.optional_capabilities - p.capabilities)
        if degraded:
            self.warnings.append(f"degraded, optional missing: {degraded}")

        if not self.t.quota_ok():                                   # ⑤配额
            return Decision(False, reason="quota exceeded")

        return Decision(True, version=want, degraded=degraded)

    # ---- 调用：preflight → 发请求 → 版本错误自动重试 ----
    def call(self, method, params, idempotency_key=None):
        d = self.preflight()
        if not d.ok:
            raise IncompatibleAPIError(d.reason)

        try:
            resp = self.t.request(method, params, version=d.version,
                                  idempotency_key=idempotency_key)
        except UnsupportedVersionError as e:                        # 类似 -32022
            # ★缓存假设失效 → 作废重探，从 supported 里挑一个重试（仅一次）
            self.probe(force=True)
            alt = [v for v in e.supported
                   if self.m.min_version <= v <= self.m.max_version]
            if not alt:
                raise IncompatibleAPIError(f"server supports {e.supported}, none in range")
            resp = self.t.request(method, params, version=alt[-1],
                                  idempotency_key=idempotency_key)
            self.warnings.append(f"retried with {alt[-1]} after version error")

        self._assert_shape(resp)                                    # ④形状校验
        resp.meta = {"version": d.version, "degraded": d.degraded,
                     "warnings": self.warnings}                     # ★降级显式外露
        return resp

    # ---- ④ L3：必需字段断言 + fallback 链 + 忽略未知字段 ----
    def _assert_shape(self, resp):
        for exp in self.m.schema_expectations:
            val = self._pick(resp, exp.path) or (
                self._pick(resp, exp.fallback) if exp.fallback else None)
            if val is None and exp.required:
                raise SchemaDriftError(f"field {exp.path} missing (fallback {exp.fallback} also missing)")
            # 未知字段不校验 → 遵守第 2.5 节铁律
```

**这段代码体现的原则**：

1. 探测带缓存、TTL 用服务端给的、错误时强制重探
2. 版本区间内自动选代、超上界走严格校验
3. required 缺 → 抛错；optional 缺 → 记录 `degraded`
4. 版本错误**自动从 supported 重试一次**，重试带幂等键
5. 形状校验用**必需断言 + fallback 链 + 忽略未知字段**
6. ★**降级信息写进 `resp.meta` 显式外露**，绝不静默

## 5.8 错误与动作映射表

| 现象 | 归类 | 动作 |
|---|---|---|
| 连不上 / 401 / 403 | 环境·鉴权 | 失败（凭证可刷新则刷新一次重试） |
| `-32022` 类版本错误（带 supported） | 版本不对应 | 从 supported 列表选区间内版本重试一次 |
| 版本错误但**不给 supported** | 版本不对应 | discover-first 探测；仍不行则人工介入 |
| required 能力缺失 | 不兼容 | fail-fast + 明确说明缺什么 |
| optional 能力缺失 | 部分兼容 | degrade + 显式标记 |
| 响应缺必需字段（含 fallback） | schema 漂移 | 显式 `SchemaDriftError`（**不要静默**） |
| 响应多了未知字段 | 合法演进 | **忽略**（第 2.5 节铁律） |
| 429 / 5xx | 限流·瞬时 | 退避重试（幂等键） |

## 5.9 本章要点

- Preflight 是**五查**：①连通鉴权 → ②版本 → ③能力 → ⑤配额 → 调用 → ④形状校验（响应时）。
- 顺序按「**便宜且常失败的先做**」，任一环失败即短路。
- 两种模式取舍：**discover-first**（多请求/版本不确定）vs **inline + retry**（单次/低延迟）；后者成立的前提是**错误响应带 supported 列表**。
- ★**缓存探测结果**（用服务端 TTL、origin/进程粒度、**假设失效必须重探**）——这让检查成本摊薄到可以忽略。
- 决策树：required 缺 → fail-fast；optional 缺 → **显式** degrade；超上界 → warn + 严格 L3；配额不足 → 退避不降级。
- 重试必须配**幂等键**，且**只重试可重试的错误**。
- ★**降级信息必须写进响应元数据显式外露**——静默降级就是静默失败。
