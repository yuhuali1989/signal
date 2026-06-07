---
title: "物联网数据闭环架构设计 - 第4章：对象存储数据湖与 Iceberg 表格式"
book: "物联网数据闭环架构设计"
chapter: "4"
chapterTitle: "对象存储数据湖与 Iceberg 表格式"
description: "基于 AWS S3、GCP GCS、Azure Blob Storage 三云对象存储构建统一数据湖，以 Apache Iceberg 表格式组织物联网数据的采集、存储、查询与生命周期管理。新增数据质量框架、Iceberg 高级特性、成本优化深度分析和查询性能调优。"
date: "2026-05-31"
updatedAt: "2026-05-31"
agent: "架构师"
tags: ["iot", "object-storage", "iceberg", "data-lake", "multi-cloud", "data-quality", "cost-optimization"]
---

# 第4章：对象存储数据湖与 Iceberg 表格式

## 4.1 三云对象存储策略

### 4.1.1 存储拓扑

```
┌─────────┐   ┌─────────┐   ┌─────────┐
│  AWS S3  │   │ GCP GCS │   │ Azure  │
│  (主湖)  │   │(副湖)   │   │ Blob   │
│  us-east │   │ asia     │   │ europe  │
└────┬────┘   └────┬────┘   └────┬────┘
     │             │             │
     └─────────────┼─────────────┘
                   │
          ┌────────▼────────┐
          │ 统一数据湖视图   │
          │ (Iceberg Catalog) │
          └─────────────────┘
```

**写入策略**：设备数据就近写入所在区域的云对象存储（S3 us-east-1 → GCS asia-southeast1 → Blob westeurope），Iceberg Catalog 提供全局统一视图。

**读取策略**：
- **热数据查询**：读取本地云的对象存储（低延迟）
- **跨云分析**：通过 Iceberg Catalog 统一查询，存储本地化减少跨云流量
- **训练数据导出**：从主湖（S3）导出，避免跨云带宽成本

### 4.1.2 存储分层策略

| 层 | 存储类型 | 用途 | 保留周期 | 成本/GB/月 | 访问频率 |
|:---|:---------|:-----|:---------|:-----|:---------|
| **热数据** | S3 Standard / GCS Standard | 最近 7 天原始数据 | 7 天 | $0.023 | > 1 次/天 |
| **温数据** | S3 Standard-IA / GCS Nearline | 已标注训练数据 | 90 天 | $0.0125 | > 1 次/周 |
| **冷数据** | S3 Glacier IR / GCS Coldline | 历史备份、审计 | 1 年 | $0.0045 | < 1 次/月 |
| **归档** | S3 Glacier Deep Archive / GCS Archive | 合规留存 | 7 年+ | $0.001 | < 1 次/年 |

**生命周期策略（S3 Lifecycle Policy 示例）**：
```xml
<LifecycleConfiguration>
  <Rule>
    <ID>iot-data-lifecycle</ID>
    <Status>Enabled</Status>
    <Filter>
      <Prefix>raw/</Prefix>
    </Filter>
    <Transitions>
      <Transition>
        <Days>7</Days>
        <StorageClass>STANDARD_IA</StorageClass>
      </Transition>
      <Transition>
        <Days>30</Days>
        <StorageClass>GLACIER_IR</StorageClass>
      </Transition>
      <Transition>
        <Days>90</Days>
        <StorageClass>DEEP_ARCHIVE</StorageClass>
      </Transition>
    </Transitions>
    <Expiration>
      <Days>2555</Days>  <!-- 7 年 -->
    </Expiration>
  </Rule>
</LifecycleConfiguration>
```

### 4.1.3 三云成本对比（2026 年价格）

| 云厂商 | Standard | Standard-IA | Glacier IR | Deep Archive | 跨云流出费 |
|:-----|:-------|:------------|:------------|:-------------|:---------|
| **AWS S3** | $0.023/GB | $0.0125/GB | $0.0045/GB | $0.001/GB | $0.09/GB（出互联网） |
| **GCP GCS** | $0.020/GB | $0.010/GB | $0.0040/GB | $0.0004/GB | $0.085/GB |
| **Azure Blob** | $0.025/GB | $0.015/GB | $0.0050/GB | $0.002/GB | $0.087/GB |

**成本优化建议**：
- 热数据放 GCP GCS（最便宜 $0.020/GB）
- 冷归档放 Azure（Deep Archive $0.002/GB，但 Azure 最贵）
- **实际**：主湖用 AWS S3（生态最成熟），通过生命周期自动降级

## 4.2 数据组织方式

### 4.2.1 S3/GCS 路径设计（优化版）

```
s3://iot-data-lake/
  └── env=prod/                    # 环境隔离（prod/staging/dev）
      └── device_type={type}/        # 设备类型分区（camera/imu/audio）
          └── region={region}/       # 区域分区（us-east-1/eu-west-1）
              └── year={YYYY}/
                  └── month={MM}/
                      └── day={DD}/
                          └── hour={HH}/       # 新增小时分区（加速查询）
                              └── device_id={hash}/
                                  ├── sensor/
                                  │   ├── camera_{timestamp}.jpg
                                  │   ├── imu_{timestamp}.bin
                                  │   └── audio_{timestamp}.wav
                                  ├── inference/
                                  │   └── vla_result_{timestamp}.json
                                  └── metadata.json
```

**分区设计原则**：
1. **时间分区优先**：`year/month/day/hour` 四级分区，支持时间范围查询剪枝
2. **设备类型分区**：不同传感器数据隔离，便于独立管理生命周期
3. **区域分区**：支持合规要求（欧盟数据不出境）
4. **设备 ID 哈希分区**：避免单个前缀下对象数过多（S3 限 1000 个 PUT/LIST 每秒）

### 4.2.2 Iceberg 表设计（深度版）

#### 表 1：传感器原始数据表

```sql
CREATE TABLE iot.sensor_raw (
    device_id       STRING        COMMENT '设备唯一 ID（哈希后）',
    timestamp       TIMESTAMP    COMMENT '数据采集时间戳（事件时间）',
    sensor_type     STRING      COMMENT '传感器类型：camera/imu/audio/tof',
    file_path       STRING      COMMENT '对象存储路径（s3://...）',
    file_size       BIGINT      COMMENT '文件大小（字节）',
    compression     STRING      COMMENT '压缩格式：raw/h265/zstd',
    checksum        STRING      COMMENT '文件校验和（SHA-256）',
    region          STRING      COMMENT '采集区域：us-east-1/eu-west-1',
    cloud_provider  STRING      COMMENT '存储云厂商：aws/gcp/azure',
    upload_latency  INT         COMMENT '端到云延迟（秒）',
    data_quality    FLOAT       COMMENT '数据质量分数（0-1）',
    is_deleted      BOOLEAN     COMMENT '是否已标记为删除（合规）'
) PARTITIONED BY (
    years(timestamp),           -- 按年分区（大型分区）
    months(timestamp),          -- 按月子分区
    days(timestamp),            -- 按日子分区（最常用查询）
    bucket(region, 16)         -- 区域哈希桶（16 桶，避免倾斜）
)
TBLPROPERTIES (
    'write.format.default' = 'parquet',
    'write.parquet.compression-codec' = 'zstd',  -- 相比 snappy 小 20%
    'write.target-file-size-bytes' = '536870912',  -- 512 MB（推荐大小）
    'read.split.target-size' = '134217728',       -- 128 MB（读取分裂）
    'commit.retry.num-retries' = '5',            -- 并发提交重试
    'history.expire.max-snapshot-age-ms' = '2592000000'  -- 保留 30 天快照
)
USING ICEBERG;
```

**分区策略说明**：
- `years/months/days`：时间分区支持时间旅行（Time Travel）查询
- `bucket(region, 16)`：区域哈希避免数据倾斜（某些区域设备多）
- **不按 device_id 分区**：设备数太多（亿级），会导致分区爆炸

#### 表 2：VLA 推理结果表

```sql
CREATE TABLE iot.vla_inference (
    device_id       STRING      COMMENT '设备 ID',
    timestamp       TIMESTAMP  COMMENT '推理时间戳',
    model_version   STRING    COMMENT '模型版本：v2.3.1',
    input_hash      STRING    COMMENT '输入数据指纹（MD5，去重用）',
    output_json     STRING    COMMENT 'VLA 推理输出（JSON 字符串）',
    latency_ms      INT       COMMENT '推理延迟（毫秒）',
    confidence      FLOAT     COMMENT '置信度（0-1）',
    uploaded        BOOLEAN   COMMENT '是否已上传到云端',
    edge_device_ts   TIMESTAMP COMMENT '端侧时间戳（时钟偏差修正）'
) PARTITIONED BY (
    years(timestamp),
    months(timestamp),
    days(timestamp),
    bucket(model_version, 8)   -- 按模型版本哈希（8 桶）
)
TBLPROPERTIES (
    'write.format.default' = 'parquet',
    'write.parquet.compression-codec' = 'zstd',
    'sort.by' = 'confidence DESC',  -- 按置信度降序排序（加速困难样本查询）
    'z-order.by' = 'device_id,timestamp'  -- Z-order 优化多维查询
)
USING ICEBERG;
```

**Z-order 说明**：
- Z-order 让 `device_id` 和 `timestamp` 在文件中交错存储
- 查询 `WHERE device_id='xxx' AND timestamp > '...'` 时，跳过 90%+ 不相关文件
- **代价**：写入时排序开销增加 20-30%，但查询加速 5-10×

#### 表 3：训练数据标注表

```sql
CREATE TABLE iot.training_labels (
    label_id        STRING      COMMENT '标注 ID（UUID）',
    device_id       STRING      COMMENT '设备 ID',
    data_timestamp  TIMESTAMP  COMMENT '原始数据时间戳',
    labeler         STRING      COMMENT '标注者：auto/human/model',
    label_json      STRING      COMMENT '标注结果（JSON）',
    quality_score   FLOAT      COMMENT '质量分数（0-1）',
    created_at      TIMESTAMP  COMMENT '标注创建时间',
    reviewed_by     STRING      COMMENT '审核人（人工校验）',
    review_status   STRING     COMMENT '审核状态：pending/approved/rejected'
) PARTITIONED BY (
    years(created_at),
    bucket(labeler, 4)        -- 按标注者哈希（auto/human/model/ensemble）
)
TBLPROPERTIES (
    'write.format.default' = 'parquet',
    'write.parquet.compression-codec' = 'zstd'
)
USING ICEBERG;
```

### 4.2.3 Iceberg 高级特性使用

#### Time Travel（时间旅行）

```sql
-- 查询 7 天前的传感器数据状态（用于复现训练结果）
SELECT * FROM iot.sensor_raw
FOR SYSTEM_TIME AS OF '2026-05-24 00:00:00'
WHERE device_id = 'abc123' AND days(timestamp) = '20260524';

-- 或者按快照 ID 查询
SELECT * FROM iot.sensor_raw
VERSION AS OF '5849092702692470606'  -- Snapshot ID
WHERE device_id = 'abc123';
```

**用途**：
- 复现历史训练实验（数据版本固定）
- 审计（查看数据在过去某个时间点的状态）
- 回滚错误的数据更新

#### Incremental Read（增量读取）

```python
# PyIceberg + PySpark 增量读取（仅读取新数据）
from pyiceberg.catalog import load_catalog

catalog = load_catalog("rest", **{
    "uri": "https://iceberg-catalog.iot-platform.com",
    "credential": "xxx"
})

table = catalog.load_table("iot.sensor_raw")

# 读取从快照 12345 到最新快照的增量数据
incremental_df = table.incremental_read(
    start_snapshot_id=12345,
    end_snapshot_id=None  # None = 最新
)

# 转换为 Spark DataFrame
df = spark.createDataFrame(incremental_df)
```

**用途**：
- 流式 ETL（每分钟读取新增数据）
- 增量训练（仅用新标注数据做增量训练）

#### Schema Evolution（模式演化）

```sql
-- 新增列（无需重写数据文件）
ALTER TABLE iot.sensor_raw
ADD COLUMNS (
    gps_latitude  DOUBLE  COMMENT 'GPS 纬度（新增合规字段）',
    gps_longitude DOUBLE  COMMENT 'GPS 经度'
);

-- 删除列（仅元数据操作，不删数据）
ALTER TABLE iot.sensor_raw
DROP COLUMN upload_latency;

-- 重命名列
ALTER TABLE iot.sensor_raw
RENAME COLUMN checksum TO file_checksum;
```

**优势**：
- 无需重写 PB 级数据文件
- 向后兼容（旧数据文件仍可读）
- 支持 Schema 演化审计（谁什么时候改了 Schema）

## 4.3 数据 Pipeline

### 4.3.1 端到端数据流（详细版）

```
设备数据 → IoT Gateway → 对象存储（原始层 /raw）
                              │
                    ┌─────────▼─────────┐
                    │   Airflow DAG     │
                    │   (托管 MWAA)     │
                    └─────────┬─────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
        数据清洗          关键帧提取       端侧推理合并
         (去重/去噪)      (场景检测)      (上传VLA结果)
              │               │               │
     ┌────────────────┼────────────────┼────────┐
     ▼                ▼                ▼        ▼
  质量检查        Iceberg 写入     通知标注服务  触发训练
  (Great Expectations)
              │
              ▼
      Iceberg 数据湖（已清洗+标注+组织）
                      │
            ┌─────────▼─────────┐
            │   训练数据导出     │
            │   (Spark 读取)    │
            └───────────────────┘
```

### 4.3.2 Airflow DAG 设计

**DAG：每日数据清洗（daily_data_cleaning）**

```python
from airflow import DAG
from airflow.providers.apache.spark.operators.spark_submit import SparkSubmitOperator
from airflow.operators.python import PythonOperator
from datetime import datetime, timedelta

default_args = {
    'owner': 'data-engineering',
    'depends_on_past': False,
    'retries': 2,
    'retry_delay': timedelta(minutes=5),
}

with DAG(
    dag_id='daily_data_cleaning',
    default_args=default_args,
    schedule_interval='0 2 * * *',  # 每天凌晨 2 点（数据低峰）
    catchup=False,
    tags=['iot', 'data-quality']
) as dag:
    
    # Task 1: 数据去重（基于 input_hash）
    deduplicate = SparkSubmitOperator(
        task_id='deduplicate',
        application='/opt/airflow/jobs/dedup.py',
        conn_id='spark_default',
        jars='/opt/iceberg/spark-runtime.jar',
        application_args=[
            '--source-table', 'iot.sensor_raw',
            '--target-table', 'iot.sensor_deduped',
            '--date', '{{ ds }}'  # Airflow 宏：执行日期
        ]
    )
    
    # Task 2: 数据质量检查（Great Expectations）
    quality_check = PythonOperator(
        task_id='quality_check',
        python_callable=run_great_expectations,
        op_kwargs={
            'datasource': 'iceberg',
            'suite': 'iot_sensor_raw_suite',
            'date': '{{ ds }}'
        }
    )
    
    # Task 3: 关键帧提取（场景变化检测）
    extract_keyframes = SparkSubmitOperator(
        task_id='extract_keyframes',
        application='/opt/airflow/jobs/keyframe_extractor.py',
        conn_id='spark_default',
        application_args=[
            '--source-table', 'iot.sensor_deduped',
            '--target-table', 'iot.sensor_keyframes',
            '--date', '{{ ds }}'
        ]
    )
    
    # Task 4: 触发下游标注任务
    trigger_labeling = TriggerDagRunOperator(
        task_id='trigger_labeling',
        trigger_dag_id='auto_labeling_pipeline',
        conf={'date': '{{ ds }}'}
    )
    
    # 依赖关系
    deduplicate >> quality_check >> extract_keyframes >> trigger_labeling
```

### 4.3.3 数据质量监控框架

#### Great Expectations 规则配置

```python
# great_expectations/suites/iot_sensor_raw_suite.py
import great_expectations as ge
import great_expectations.jupyter as ge_jupyter

def build_suite():
    suite = ge.core.ExpectationSuite(
        name="iot_sensor_raw_suite",
        expectations=[
            # 规则 1：device_id 不为空
            ge.core.ExpectationConfiguration(
                expectation_type="expect_column_values_to_not_be_null",
                kwargs={"column": "device_id"}
            ),
            # 规则 2：timestamp 在合理范围内（过去 7 天内）
            ge.core.ExpectationConfiguration(
                expectation_type="expect_column_values_to_be_between",
                kwargs={
                    "column": "timestamp",
                    "min_value": "2026-05-24",  # 7 天前
                    "max_value": "2026-05-31"    # 今天
                }
            ),
            # 规则 3：file_size 为正数
            ge.core.ExpectationConfiguration(
                expectation_type="expect_column_values_to_be_positive",
                kwargs={"column": "file_size"}
            ),
            # 规则 4：checksum 格式正确（SHA-256 十六进制）
            ge.core.ExpectationConfiguration(
                expectation_type="expect_column_values_to_match_regex",
                kwargs={
                    "column": "checksum",
                    "regex": r"^[a-f0-9]{64}$"
                }
            ),
            # 规则 5：region 值在允许列表中
            ge.core.ExpectationConfiguration(
                expectation_type="expect_column_values_to_be_in_set",
                kwargs={
                    "column": "region",
                    "value_set": [
                        "us-east-1", "eu-west-1", "ap-southeast-1",
                        "cn-north-1", "sa-east-1"
                    ]
                }
            ),
            # 规则 6：数据完整性（每设备每天至少 1 条）
            ge.core.ExpectationConfiguration(
                expectation_type="expect_compound_rows_to_match_some_criterion",
                kwargs={
                    "condition": "count(*) >= 1",
                    "mostly": 0.95  # 95% 的设备满足
                }
            )
        ]
    )
    return suite
```

#### 质量监控告警

| 检查项 | 方法 | 告警阈值 | 处理方式 |
|:-------|:-----|:---------|:---------|
| 数据完整性 | 每批次校验 device_id + timestamp 唯一性 | 重复率 > 1% | 邮件 + PagerDuty |
| 延迟 | 端侧上传时间 vs 到达数据湖时间 | 超过 4h | Slack 通知 |
| 数据量异常 | 对比基线（设备数×单设备期望量） | 偏差 > 30% | 自动暂停 Pipeline |
| 文件损坏 | checksum 校验 | 失败率 > 0.1% | 重新上传 |
| Schema 变更 | Iceberg Schema Evolution 检测 | 未授权变更 | 阻断 + 通知 DBA |

## 4.4 跨云数据复制

### 4.4.1 复制策略

```
AWS S3 (主湖)
    │
    ├── S3 Cross-Region Replication (CRR) → S3 us-west-2 / eu-west-1
    │    频率：实时（秒级）
    │    用途：同云灾备
    │
    ├── S3 Batch Replication → GCS (跨云)
    │    使用 S3 Batch Operations + GCS Transfer Service
    │    频率：每小时（批量）
    │    用途：GCP 训练集群就近读取
    │
    └── S3 Batch Replication → Azure Blob (合规备份)
         使用 S3 → Azure Data Factory
         频率：每天（夜间）
         用途：合规留存（GDPR 要求）
```

**注意**：
- 跨云复制是异步的，延迟 1-4 小时
- 对于需要实时数据访问的场景，建议直接访问本地云的对象存储
- **成本**：跨云流出费 ~$0.08/GB，每日 50 PB 复制 = $4M/天（太贵！）

### 4.4.2 跨云复制成本优化

**问题**：50 PB/天 × $0.08/GB = $4,000,000/天（不可接受）

**解决方案**：
1. **仅复制元数据**：原始数据不跨云复制，仅复制 Iceberg 元数据（JSON/AVRO 文件，~MB 级）
2. **按需复制**：仅复制训练需要的子集（~5 TB/天）
3. **压缩后复制**：原始数据 50 PB → 压缩后 5 PB → 跨云复制 $0.4M/天

**优化后成本**：
| 复制方式 | 数据量/天 | 流出费/天 | 月成本 |
|:---------|:-------|:---------|:-------|
| 全量复制（原始） | 50 PB | $4M | $120M |
| 仅复制元数据 | ~10 GB | $0.0008 | $0.024 |
| 复制训练子集 | 5 TB | $400 | $12,000 |
| 压缩后复制 | 5 PB | $400K | $12M |
| **推荐方案** | **元数据+子集** | **~$400/天** | **~$12,000/月** |

## 4.5 成本分析（深度版）

### 4.5.1 存储成本明细

| 成本项 | 月数据量 | 存储成本/月 | 请求成本/月 | 总计/月 |
|:-------|:-------|:-----------|:-----------|:-------|
| 热存储（S3 Standard） | ~50 PB | ~$1.15M | ~$50K (PUT) | ~$1.2M |
| 温存储（S3 Standard-IA） | ~30 PB | ~$375K | ~$30K (GET) | ~$405K |
| 冷存储（S3 Glacier IR） | ~100 PB | ~$450K | ~$10K | ~$460K |
| 归档（S3 Deep Archive） | ~200 PB | ~$200K | ~$5K | ~$205K |
| 跨区域复制（CRR） | ~50 PB | $0 | ~$200K | ~$200K |
| 跨云复制（S3→GCS） | ~5 TB | $0 | ~$100 | ~$100 |
| **存储总计** | **~380 PB** | **~$2.4M** | **~$345K** | **~$2.7M/月** |

### 4.5.2 查询计算成本

| 引擎 | 用途 | 成本/月 | 备注 |
|:-----|:-----|:-------|:-----|
| Athena (S3) | 即席查询 | ~$50K | $5/TB 扫描 |
| Spark (EMR) | ETL + 训练数据导出 | ~$500K | 100 节点 × $5/小时 × 24h × 30 |
| StarRocks (OLAP) | 实时分析看板 | ~$100K | 10 节点 × $0.5/小时 |
| **计算总计** | | **~$650K/月** | |

### 4.5.3 总成本与优化空间

| 成本类别 | 当前/月 | 优化后/月 | 优化措施 |
|:-------|:-------|:-------|:---------|
| 存储 | $2.7M | $1.2M | 端侧预处理 -80% + 生命周期自动降级 |
| 计算 | $650K | $400K | Spot 实例 -40% + 查询优化 |
| 网络 | $200K | $50K | CloudFront CDN 缓存静态资源 |
| 管理 | $50K | $50K | 不变 |
| **总计** | **$3.6M/月** | **$1.7M/月** | **节省 53%** |

**优化后年化成本**：$1.7M × 12 = **$20.4M/年**

## 4.6 查询性能调优

### 4.6.1 Iceberg 表优化

#### 小文件合并（Compaction）

```sql
-- 手动触发 Compaction（合并小文件）
CALL catalog_name.system.rewrite_data_files(
    table => 'iot.sensor_raw',
    strategy => 'binpack',           -- 打包策略
    options => map('target-file-size-bytes', '536870912')  -- 目标 512 MB
);

-- 自动 Compaction（通过 Spark Structured Streaming）
```

**问题**：流式写入会产生大量小文件（< 32 MB），导致查询性能差。

**解决方案**：
- 每小时自动 Compaction（合并到 512 MB）
- Z-order 重新排列（多维排序）

#### 统计信息更新

```sql
-- 更新表统计信息（加速查询规划）
CALL catalog_name.system.compute_table_stats(
    table => 'iot.sensor_raw',
    columns => array('device_id', 'timestamp', 'region')
);
```

**效果**：
- 查询规划时间从 30 秒降到 2 秒
- 文件剪枝率从 60% 提升到 95%

### 4.6.2 查询引擎选择

| 引擎 | 延迟 | 吞吐 | 成本 | 适用场景 |
|:-----|:-----|:-----|:-----|:---------|
| **Athena** | 10-60s | 低 | $5/TB 扫描 | 即席查询、调试 |
| **Spark** | 5-30min | 极高 | $10-50/TB | ETL、训练数据导出 |
| **StarRocks** | 1-10s | 高 | $ 自托管 | 实时分析看板 |
| **Trino** | 5-60s | 高 | $ 自托管 | 跨数据源联合查询 |

**推荐组合**：
- 即席查询 → Athena（按扫描量付费，无需集群）
- ETL → Spark on EMR（Spot 实例降低成本）
- 实时看板 → StarRocks（亚秒级响应）

## 4.7 本章小结

本章设计了基于三云对象存储 + Iceberg 表格式的统一数据湖方案：

**核心架构**：
- **存储分层**：热/温/冷/归档四层，生命周期自动降级
- **数据组织**：四级时间分区 + 区域哈希桶，支持高效查询剪枝
- **Iceberg 特性**：Time Travel（复现实验）+ Incremental Read（流式 ETL）+ Schema Evolution（灵活演进）
- **数据质量**：Great Expectations 规则引擎 + 6 项核心检查

**成本优化**：
- 存储成本：$3.6M/月 → $1.7M/月（节省 53%）
- 跨云复制：仅复制元数据 + 训练子集，$400/天
- 查询优化：Compaction + 统计信息更新 + Z-order

**查询性能**：
- 引擎选择：Athena（即席）+ Spark（ETL）+ StarRocks（实时）
- 规划时间：30s → 2s（统计信息）
- 文件剪枝：60% → 95%（Z-order）

下一章讨论如何基于这些数据完成 VLA/VLX 产品的落地——从端侧量化推理到云端训练 Pipeline，再到 OTA 灰度发布的完整链路。
