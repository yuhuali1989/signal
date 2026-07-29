---
title: "Ray Data 引擎：从 2.10 到 2.5x - 第10章: 表格式集成与 Upsert/Merge——以 Iceberg 为中心的对比"
book: "Ray Data 引擎：从 2.10 到 2.5x"
chapter: "10"
chapterTitle: "表格式集成与 Upsert/Merge 能力对比（以 Iceberg 为中心）"
description: "直接回答 Daft 是否支持 Iceberg upsert（结论：原生 DataFrame API 仅 append/overwrite，upsert 需走 PyIceberg）；对比 Ray Data 2.52 起原生 Iceberg UPSERT/覆盖/谓词投影下推；横向比较 Iceberg/Delta/Lance/Hudi 在两边的读/写/upsert 能力；指出 Daft 的 upsert 强项其实在 Lance；给出 CDC/SCD 场景选型建议"
date: "2026-07-29"
updatedAt: "2026-07-29"
agent: "研究员→编辑→审校员"
tags:
  - "Iceberg"
  - "Daft"
  - "Ray Data"
  - "Upsert"
  - "Merge"
  - "Delta Lake"
  - "Lance"
  - "PyIceberg"
type: "book"
---

## 10.1 直接回答：Daft 有 Iceberg upsert 吗？

**结论先说：截至 2026 年中，Daft 的 DataFrame API 对 Iceberg 只提供 `append` 与 `overwrite` 两种写模式，没有原生的 upsert/merge。**

Daft 通过 PyIceberg 薄封装来读写 Iceberg，官方文档与第三方实践（如 Dremio 的工程博客）都明确写了它的能力边界：

```python
import daft
from pyiceberg.catalog.sql import SqlCatalog

catalog = SqlCatalog("local", uri="sqlite:///catalog.db", warehouse="/wh")
table = catalog.load_table("demo.users")

df = daft.from_pydict({"id": [1, 2], "name": ["Alice", "Bob"]})
df.write_iceberg(table, mode="append")      # ✅ 支持
df.write_iceberg(table, mode="overwrite")   # ✅ 支持（替换快照）
```

而 Dremio 博客在"Limitations"一节原话指出：

> *Daft supports append and overwrite modes only. Upserts, deletes, and schema evolution must be handled through PyIceberg or another tool.*

也就是说，**想对 Iceberg 做"按 key 更新已存在行、插入新行"的 upsert，Daft 用户必须绕过 DataFrame API，直接拿 PyIceberg 的 `table.upsert()` 或 Spark/Daft 之外的 MERGE 工具来完成**：

```python
# Daft 做不到、需要退回 PyIceberg 的写法
from pyiceberg.table import upsert as _  # 示意：实际用 table.upsert() 或 MERGE
table.upsert(df.to_arrow())             # 走 PyIceberg，非 Daft 执行计划
```

这条限制的反直觉之处在于：Daft 以"现代化、为 AI 设计"著称，却在最经典的湖仓 upsert 场景上，**反而不如 Ray Data 原生**。

---

## 10.2 Ray Data 的 Iceberg 能力（2.52 起大幅补齐）

Ray Data 同样基于 PyIceberg，但从 **Ray 2.52.0（2025-11）** 起，`write_iceberg` 一口气补齐了 **upsert、覆盖、schema 更新、谓词/投影下推**：

```python
import ray
from ray.data import SaveMode
from ray.data.expressions import col

ds = ray.data.from_pandas(pd.DataFrame([
    {"id": 2, "title": "Updated Doc 2"},
    {"id": 5, "title": "New Doc 5"},
]))

# 原生 UPSERT：按 join_cols 命中则更新、未命中则插入
ds.write_iceberg(
    table_identifier="db_name.table_name",
    catalog_kwargs={"name": "default", "type": "sql"},
    mode=SaveMode.UPSERT,
    upsert_kwargs={"join_cols": ["id"]},
)
```

三种写模式一览：

| 模式 | 语义 | 关键参数 |
|---|---|---|
| `SaveMode.APPEND` | 追加，不查重 | 默认 |
| `SaveMode.UPSERT` | 按 `join_cols` 命中更新、未命中插入 | `upsert_kwargs={"join_cols":[...], "case_sensitive": bool, "branch": str}` |
| `SaveMode.OVERWRITE` | 全量替换，或按 `overwrite_filter` 局部替换 | `overwrite_filter=col("date") >= "2024-10-28"` |

配套能力（均来自 2.52 release notes）：
- **谓词下推（predicate pushdown）**：`col("region") == "US"` 直接下推到 Iceberg scan，减少读取文件；
- **投影下推（projection pushdown）**：只读需要的列，配合 Arrow 列式更省内存；
- **自动 schema evolution**：新列自动加入目标表，无需手动 `ALTER TABLE`。

> 注：Ray Data 的 upsert 采用 **copy-on-write** 策略——命中 key 时整行更新、未命中整行插入，以换取最佳并行度。若你需要"只更新部分列"的细粒度 MERGE，仍要回到 PyIceberg/Spark。

---

## 10.3 为什么 Daft 在 Iceberg upsert 上"落后"

不是技术能力问题，而是**产品优先级**：

1. **PyIceberg 薄封装策略**：Daft 早期把 Iceberg 当"输出目的地"而非"事务层"，只读/追加/覆盖覆盖了 90% 的 ETL 写入场景，upsert 被推给底层 PyIceberg。
2. **押注 Lance 作为多模态底座**：Daft 的差异化在 Lance（见 10.5），Iceberg 更多用于和现有湖仓对接，优先级低于 Lance 的原生 merge。
3. **Ray Data 有更强的"表治理"动机**：Ray Data 2.5x 主线是"成为 Data+AI 的事实层"（Iceberg 负责可共享、可版本化、可治理的事实层），upsert 是这条主线上的刚需，因此 2.52 重点投入。

这也是第 9 章"二者共生"结论的一个修正注脚：**在表格式 upsert 这一具体能力上，Ray Data（2.52+）反而领先 Daft**。

---

## 10.4 横向对比表：四种表格式的读/写/upsert

| 表格式 | Daft | Ray Data | 备注 |
|---|---|---|---|
| **Iceberg** | 读✅ / 写✅(append,overwrite) / **upsert❌(需PyIceberg)** | 读✅ / 写✅ **(append/upsert/overwrite)** / 谓词投影下推✅ | Ray Data 2.52 起原生 upsert |
| **Delta Lake** | 读✅ / 写✅(append,overwrite) / **merge 经 delta-rs** | 读✅(`read_delta_lake` 带 version) / 写⚠️核心非原生（靠 `deltaray` 第三方） | 两边 upsert 都需借助 delta-rs/deltaray |
| **Lance** | 读✅ / 写✅ **(`mode="merge"` 原生 upsert)** | 读✅(非核心) / 写❌ 无原生 writer | **Daft 的 upsert 强项在 Lance** |
| **Hudi** | 读✅（只读）/ 写❌ | 读⚠️（Hive 读取有限支持）/ 写❌ | 两边都没有一等公民 Hudi 写 |

规律很清晰：
- **Iceberg upsert**：Ray Data 原生支持，Daft 需退 PyIceberg；
- **Lance upsert**：Daft 原生支持（`write_lance(mode="merge")`），Ray Data 无原生 writer；
- **Delta upsert**：两边都靠底层 Rust 库（delta-rs / deltaray），不是各自 DataFrame 的一等公民；
- **Hudi**：两边都是"只读接入已有湖"，无写能力。

---

## 10.5 Daft 的真正 upsert 强项：Lance

Daft 在 Lance 上的 upsert 才是它"现代化"的体现——因为 Lance 原生支持 merge/version/as-of：

```python
import daft
df = daft.from_pydict({"id": [1, 2, 3], "vec": [[0.1], [0.2], [0.3]]})
# 按主键合并：已存在则更新向量、不存在则插入
df.write_lance("/data/embeddings.lance", mode="merge", on="id")
```

这对 **embedding 资产、多模态特征库** 等 AI 场景极其自然：每次新批次推理完，直接 merge 进 Lance 数据集，还能用 `as_of` 做时间点回溯。Daft 把"表格式 upsert"的优势押在了 Lance 而非 Iceberg 上。

> 实践建议：若你的"事实层"是 Iceberg（要和 Trino/Spark 共享）、且需要 upsert，当前用 **Ray Data 的 `write_iceberg(UPSERT)`** 最顺；若你的主存储是 Lance（AI 特征/向量），用 **Daft 的 `write_lance(mode="merge")`** 最顺。

---

## 10.6 Delta Lake：两边都得借力底层库

Delta 的 upsert（MERGE）在 Spark 世界里是标准能力，但两个 Python DataFrame 引擎都**不是**原生提供 DataFrame 级 merge：

- **Daft**：`write_deltalake` 当前以 append/overwrite 为主；要做 merge，官方 delta.io 文档指出可借助 **delta-rs**（Rust 实现的 Delta Lake）的 `DeltaTable.merge()`，Daft 作为"非 Spark 引擎"之一被列入。
- **Ray Data**：核心没有 `write_deltalake` upsert；社区方案是 **deltaray**（Delta + Ray 桥接库），提供 `deltaray.write_delta(table_uri, df)` 与按 version 读取；2.52 起 `read_delta_lake` 也支持 `version` 参数做时间旅行。

```python
# delta-rs（Daft / 任意 Python DataFrame 都能用）做 Delta upsert
from deltalake import DeltaTable
dt = DeltaTable("tmp_table")
dt.merge(source=source_arrow, predicate="target.x = source.x") \
  .when_matched_update(updates={"x": "source.x", "y": "source.y"}) \
  .when_not_matched_insert(updates={"x": "source.x", "y": "source.y"}) \
  .execute()
```

结论：**Delta 的 upsert 是 Delta 生态（delta-rs / Spark）的能力，不是 Daft 或 Ray Data 引擎自身的能力**。选型时别把"能写 Delta"等同于"能 merge Delta"。

---

## 10.7 选型建议：CDC / SCD 场景怎么办

| 你的场景 | 推荐做法 |
|---|---|
| Iceberg 表上做 CDC 增量同步 / SCD 维表更新 | **Ray Data `write_iceberg(UPSERT, join_cols=[...])`**（2.52+）；或回 PyIceberg |
| 多模态特征/向量库需要按 key 合并 | **Daft `write_lance(mode="merge", on="id")`** |
| 已有 Delta 湖仓，要做 MERGE | 用 **delta-rs / deltaray**，无论 Daft 还是 Ray Data 都经此层 |
| 只读接入 Hudi 湖 | 两边都能读，但要做写入请换 Spark/Iceberg |
| 想"一套 API 同时管 Iceberg upsert + 多模态 Lance merge" | 现实是**两套 API 分治**：Ray Data 管 Iceberg，Daft 管 Lance；这恰是 DREAM 栈"各取所长"的体现 |

---

## 10.8 小结：修正第 9 章的一个直觉

第 9 章说"Daft 赢在默认体验、Ray Data 赢在规模天花板"。但落到 **表格式 upsert 这一具体能力**：

- **Iceberg upsert**：Ray Data（2.52+）已原生支持，Daft 还要退回 PyIceberg——这里 **Ray Data 反而领先**；
- **Lance upsert**：Daft 原生且优雅，Ray Data 无原生 writer——这里 **Daft 领先**；
- 二者都不是 Delta/Hudi merge 的"原生宿主"，都借力 delta-rs / Spark。

所以更精确的表述是：**没有一个引擎在"所有表格式的 upsert"上全胜**。Ray Data 在 Iceberg 治理层更完整，Daft 在 Lance 多模态层更顺手。理解各自的"upsert 主场"，比笼统说"谁更强"更有工程价值——这也再次印证了本书的核心判断：**它们共用 Ray 底座，长期是分层共生，而不是你死我活。**
