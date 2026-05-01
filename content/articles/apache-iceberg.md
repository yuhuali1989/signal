---
title: "Apache Iceberg 社区进展：新版本特性、性能优化与生态集成"
description: "追踪 Iceberg 最新 Release 亮点：Puffin 统计文件、Deletion Vector、REST Catalog 演进、多引擎兼容性更新"
date: "2026-04-30"
updatedAt: "2026-04-30 20:12"
agent: "研究员→编辑→审校员"
tags:
  - "Iceberg"
  - "数据湖仓"
  - "开放表格式"
  - "AI Infra"
type: "article"
category: "AI Infra"
---

基于研究员收集的大量调研数据，我现在来撰写最终文章。

---

# Apache Iceberg 社区进展：1.10.x 特性解析、性能跃升与生态全景

## 概述

2025 年对 Apache Iceberg 社区而言是里程碑式的一年：格式规范 V3 正式落地、1.10.x 版本系列稳定发布、PyIceberg 迈入 0.9.x 成熟阶段，Spark 4.0 原生集成也如期到来。本文将从版本特性、性能优化、生态集成三条主线，系统梳理 Iceberg 当前的技术现状。

---

## 一、Apache Iceberg 1.10.x：核心新特性

### 1.1 Spark 4.0 完整支持

1.10.0 是首个原生兼容 Apache Spark 4.0 的版本，完成了存储过程（Stored Procedures）的迁移适配，并强化了 `DataFrameWriterV2` 的 `MERGE INTO` 路径：

```sql
-- Spark 4.0 原生 MERGE INTO 示例
MERGE INTO prod.db.target t
USING (SELECT * FROM staging) s
ON t.id = s.id
WHEN MATCHED THEN UPDATE SET *
WHEN NOT MATCHED THEN INSERT *;
```

同时，1.10.0 废弃了 Flink 1.18 支持，移除了 `DynConstructors`/`DynMethods` 中已标记 deprecated 的方法，整体依赖矩阵向前收敛。

### 1.2 分区统计（Partition Statistics）增量写入

大规模表的 Planning 阶段是历来痛点。1.10.0 引入 **增量分区统计**，无需全量重建即可在提交时追加统计信息，显著降低了 Planner 扫描 manifest 的元数据开销：

```java
// 增量写入分区统计
table.updateStatistics()
    .setStatistics(snapshotId, new GenericStatisticsFile(
        snapshotId, "/path/to/stats.puffin",
        fileSize, footerSize, ImmutableList.of(blobMeta)
    ))
    .commit();
```

### 1.3 加密密钥元数据支持

1.10.0 在表元数据层面新增了加密密钥管理接口，允许引擎在写入时将密钥标识符（Key Metadata）随数据文件一起存储，为列级加密场景提供统一的密钥检索路径，满足企业合规要求。

### 1.4 RowDelta API 的 `deleteFile` 补充

`RowDelta` 接口新增 `deleteFile(DeleteFile)` 方法，使得写入位置删除文件（Position Delete）的流程更加直观，避免了之前需要绕道 `OverwriteFiles` 的变通写法：

```java
table.newRowDelta()
    .addRows(dataFile)
    .addDeletes(posDeleteFile)   // 1.10.0 新增直接方法
    .validateNoConflictingDataFiles()
    .commit();
```

### 1.5 1.10.1 稳定性修复要点

| 问题模块 | 修复内容 |
|---|---|
| REST Catalog | 修复 `PlanTableScanRequest` 中空 delete 引用的序列化错误 |
| Parquet | 修复 `ParquetTypeVisitor` 对 Variant 类型的处理；修复 UUID 读写异常 |
| Flink | 确保 `DynamicCommitter` 的幂等性，避免重复提交 |
| Spark 3.4/3.5 | 回移快照版本控制修复，与 1.10.0 主线对齐 |
| 时间戳精度 | 修复 timestamp-nanos 默认值的整数溢出问题 |

---

## 二、格式规范 V3：技术深度解析

### 2.1 删除向量（Deletion Vectors）

V3 最受关注的特性是以 Roaring Bitmap 编码的**删除向量**替代 V2 的碎片化 delete 文件。其核心思路是：每个数据文件维护一个独立的位图文件（`.dvec`），每个比特位对应文件中的一行是否被删除。

读放大（Read Amplification）的改善可以近似量化为：

$$\text{Read Amplification} = \frac{\text{数据文件读取量} + \sum_{i}{\text{delete\_file}_i}}{\text{净数据读取量}}$$

V2 中随着时间推移 $\sum \text{delete\_file}$ 线性增长，而 V3 将其压缩为单一位图，理论上读放大趋近 1，官方基准测试显示读性能提升可达 **10×**。

### 2.2 行血统（Row Lineage）

V3 为每行数据赋予全局唯一的 Row ID 和 Sequence Number，原生支持精确的变更数据捕获（CDC）场景：

```
row_id:         uint64  -- 行的全局唯一标识符
sequence_number: int64  -- 行最后一次写入时的快照序号
```

行血统信息可直接被向量化读取器消费，无需额外 JOIN 操作即可追溯每行的历史版本，有效替代传统的 `_rowid` 虚拟列方案。

### 2.3 VARIANT 类型

新增 `variant` 逻辑类型，以高效的二进制编码存储半结构化/JSON 数据，支持谓词下推（Predicate Pushdown）和 **shredding**（将常访问的嵌套字段提升为独立列）。对比存储方案如下：

| 方案 | 存储效率 | 谓词下推 | 动态 Schema |
|---|---|---|---|
| JSON 字符串 | 低 | 不支持 | 支持 |
| Map\<String, Any\> | 中 | 部分 | 支持 |
| **VARIANT (V3)** | 高 | 支持 | 支持 |
| 固定列结构 | 最高 | 完整 | 不支持 |

---

## 三、性能优化：Delete 处理的系统性重构

### 3.1 Equality Delete → Position Delete 的自动转换

在 MOR（Merge-on-Read）写入模式下，Equality Delete 文件的合并代价随时间指数增长。社区当前推荐的实践是通过 `RewriteDataFiles` 的 `DELETE_FILE_THRESHOLD` 触发自动转换：

```java
Actions.forTable(table)
    .rewriteDataFiles()
    .option(RewriteDataFiles.MODE, "delete")
    .option(RewriteDataFiles.DELETE_FILE_THRESHOLD, "2")
    .option(RewriteDataFiles.MAX_FILE_SIZE_BYTES, String.valueOf(512 * 1024 * 1024L))
    .execute();
```

该操作将 Equality Delete 就地重写为 Position Delete，后续读取时 Bloom Filter 直接定位目标行，避免全文件扫描。

### 3.2 向量化读取器的 Delete 层剥离

1.10.x 对向量化读取路径做了重要重构：将 delete 过滤逻辑从 `VectorizedReader` 主路径中抽离至独立层，使批量读取的热路径不再受 delete 文件检查的干扰：

```
旧架构:  [Parquet Batch Reader] → [Delete Filter] → [Consumer]
新架构:  [Parquet Batch Reader] → [Consumer]
                                      ↑
                              [Delete Filter Layer]（独立线程/延迟评估）
```

同时废弃了 `VectorizedReader.setRowGroupInfo()` 接口，简化了外部调用方的集成负担。

### 3.3 多维聚簇与 Z-Order

Z-Order 通过交织多列的位表示构造空间填充曲线，使多列联合过滤的文件跳过率（File Skipping Rate）显著提升：

$$Z\text{-Value}(x, y) = \text{interleave\_bits}(\text{norm}(x),\ \text{norm}(y))$$

实际生产中的写入示例：

```java
table.updateSortOrder()
    .sortBy(Expressions.bucket("customer_id", 16))
    .sortBy(zorder("event_time", "region_id", "product_sku"))
    .commit();
```

AWS 基准数据显示，对多列过滤查询，Z-Order 相比无排序可带来 **3–5×** 的 I/O 降低；结合 Hilbert Curve（在 3+ 列场景局部性更优）可进一步提升约 15%。

---

## 四、PyIceberg 0.9.x：Python 生态成熟

### 4.1 原生 UPSERT 支持

PyIceberg 0.9.0 补齐了长期缺失的 UPSERT 能力，允许纯 Python 流程无需 Spark 即可完成行级更新：

```python
from pyiceberg.catalog import load_catalog
from pyiceberg.expressions import EqualTo

catalog = load_catalog("rest", uri="http://localhost:8181")
table = catalog.load_table("db.events")

# 原生 UPSERT：按 event_id 更新或插入
table.upsert(
    df=new_df,                          # PyArrow Table
    join_cols=["event_id"],
    when_matched_update_all=True,
    when_not_matched_insert_all=True,
)
```

### 4.2 Polars 深度集成

```python
import polars as pl
from pyiceberg.catalog import load_catalog

table = load_catalog("glue").load_table("warehouse.orders")

# 惰性求值，谓词下推自动传递给 Iceberg scan
lazy_df: pl.LazyFrame = table.scan(
    row_filter="order_date >= '2025-01-01'"
).to_polars()

result = lazy_df.filter(pl.col("amount") > 1000).collect()
```

### 4.3 关键 Breaking Changes

- `rest.authorization-url` → `oauth2-server-uri`（OAuth2 端点配置规范化）
- `adlfs.*` 配置前缀废弃，统一使用 `adls.*`
- 过滤表达式中不再允许将表名作为字段前缀

---

## 五、REST Catalog 与 ViewCatalog

REST Catalog 在 1.10.x 时代完成了 View 操作的全面覆盖：

```
GET    /v1/{prefix}/namespaces/{ns}/views          # 列举视图
POST   /v1/{prefix}/namespaces/{ns}/views          # 创建视图
GET    /v1/{prefix}/namespaces/{ns}/views/{view}   # 获取视图元数据
POST   /v1/{prefix}/namespaces/{ns}/views/{view}   # 更新视图 SQL
DELETE /v1/{prefix}/namespaces/{ns}/views/{view}   # 删除视图
HEAD   /v1/{prefix}/namespaces/{ns}/views/{view}   # 检查视图存在
```

值得注意的是，JDBC Catalog 的 v0 schema 版本不对外暴露 View 端点，避免与旧客户端的不兼容冲突，这是向后兼容策略的典型示范。

---

## 六、生态集成全景

| 引擎 / 工具 | 关键集成点 | 状态 |
|---|---|---|
| **Spark 4.0** | 原生 MERGE INTO、存储过程、动态分区裁剪 2.0 | GA |
| **Flink 1.19+** | 流式 CDC → Iceberg、ACID 事务、隐式分区 | Stable |
| **Trino** | 时间旅行（`VERSION AS OF`）、完整 schema 演化 | Stable |
| **DuckDB 1.1+** | 完整 DML（INSERT/UPDATE/DELETE）、浏览器端查询 | 新增 |
| **Apache Polaris** | 多引擎 Iceberg 治理层（Snowflake 开源） | Beta |
| **AWS S3 Tables** | 托管 Iceberg、自动 Z-Order 压缩 | GA |
| **DeltaLake 迁移** | `iceberg-delta-lake` 模块无损迁移 | GA |

---

## 七、展望

社区 V4 规范的讨论已在 2025 年底启动，核心议题包括：**原生索引模型**（跳过索引、Bloom Filter 标准化）、**面向 AI/ML 的元数据增强**（特征血统、向量列类型），以及**多引擎 SQL 方言统一**。

随着 Databricks 完成对 Tabular（Iceberg 创始团队）的收购，Delta Lake 与 Iceberg 在二进制编码层面的对齐趋势愈发明显——两种格式在 deletion vector 实现上已共享相同的 Roaring Bitmap 规范。开放湖仓格式走向互操作的大势，正在由 Iceberg 社区的技术选择逐步塑造。