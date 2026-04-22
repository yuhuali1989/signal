// ────────────────────────────────────────────────────────────────
// 数据闭环 & AI Infra — 数据定义
// 涵盖 K8s · 数据湖仓 · MLOps · 闭环链路 · 可观测性 · 向量DB
// ────────────────────────────────────────────────────────────────

// ═══════════════════════════════════════════════════════════════
// 模块 Tab 定义
// ═══════════════════════════════════════════════════════════════
export const INFRA_TABS = [
  { id: 'overview',      label: '全景总览',        icon: '🗺️', color: '#6c5ce7', desc: '数据闭环全景架构 · 技术栈全图 · 核心指标' },
  { id: 'k8s',           label: 'K8s & 容器',      icon: '☸️', color: '#326ce5', desc: 'Kubernetes 集群 · 调度策略 · 服务网格 · GitOps' },
  { id: 'datalake',      label: '数据湖仓',         icon: '🏞️', color: '#00cec9', desc: 'Iceberg · Hudi · 湖仓一体 · 数据版本 · 血缘追踪' },
  { id: 'pipeline',      label: '数据流水线',       icon: '⚙️', color: '#fd79a8', desc: '采集 → 清洗 → 标注 → 挖掘 · Airflow DAG 编排' },
  { id: 'compute',       label: '计算引擎选型',     icon: '⚡', color: '#f39c12', desc: 'Spark · Ray · Flink · Trino · RAPIDS · 场景选型矩阵' },
  { id: 'unitycatalog',  label: 'Unity Catalog',   icon: '🗂️', color: '#e84393', desc: '统一元数据 · 模型注册 · 数据集管理 · 列级血缘' },
  { id: 'mlops',         label: 'MLOps 实验',       icon: '🧪', color: '#3fb950', desc: '实验管理 · 模型注册 · CI/CD · 自动评测 · A/B 测试' },
  { id: 'observability', label: '可观测性',         icon: '📊', color: '#ffa657', desc: 'Prometheus · Grafana · ELK · 分布式追踪 · 告警' },
  { id: 'vectordb',      label: '向量 & 特征',      icon: '🧬', color: '#d2a8ff', desc: '向量数据库 · 特征仓库 · 嵌入检索 · 场景挖掘' },
  { id: 'dedup',         label: '图像去重',         icon: '🔍', color: '#e17055', desc: 'SemDeDup · D³ · SSL-Dedup · 多级去重 Pipeline · 长尾保护' },
  { id: 'synth',         label: '数据合成',         icon: '🧫', color: '#a29bfe', desc: '场景合成 · 长尾生成 · Sim2Real · 轨迹合成 · 自动标注 · 质量评估' },
  { id: 'framework',     label: '推理 & 训练优化',  icon: '🔥', color: '#ff6b6b', desc: '训练框架 · 推理引擎 · 量化编译 · 车端优化 · 框架选型对比' },
];

// ═══════════════════════════════════════════════════════════════
// 1. 全景总览
// ═══════════════════════════════════════════════════════════════
export const OVERVIEW_DATA = {
  // 架构层次
  layers: [
    { label: '应用层',   items: ['VLA 训练', '世界模型', '自动标注', '仿真评测', '在线推理'], color: '#6c5ce7' },
    { label: 'MLOps',    items: ['MLflow', 'W&B', 'DVC', 'Seldon', 'BentoML'], color: '#3fb950' },
    { label: '计算层',   items: ['Spark', 'Ray', 'Dask', 'DeepSpeed', 'Volcano'], color: '#fd79a8' },
    { label: '编排层',   items: ['Kubernetes', 'Airflow', 'Argo', 'Istio', 'Keda'], color: '#326ce5' },
    { label: '存储层',   items: ['Iceberg', 'JuiceFS', 'S3/COS', 'Redis', 'Milvus'], color: '#00cec9' },
    { label: '基础设施', items: ['GPU 集群', 'InfiniBand', 'NVMe', 'CDN', 'VPN'], color: '#ffa657' },
  ],
  // 核心指标
  metrics: [
    { name: '日数据入库', value: '~50 TB', icon: '📥', color: '#6c5ce7' },
    { name: 'GPU 集群', value: '128×A100', icon: '🖥️', color: '#3fb950' },
    { name: 'K8s 节点', value: '200+', icon: '☸️', color: '#326ce5' },
    { name: '容器实例', value: '3,000+', icon: '📦', color: '#fd79a8' },
    { name: '数据湖总量', value: '~500 PB', icon: '🏞️', color: '#00cec9' },
    { name: '日均 Pipeline', value: '~2,000 DAG', icon: '⚙️', color: '#ffa657' },
    { name: '模型版本', value: '~500', icon: '🧪', color: '#d2a8ff' },
    { name: '向量索引', value: '~10B', icon: '🧬', color: '#79c0ff' },
  ],
  // 技术选型对比
  techChoices: [
    { category: '容器编排', chosen: 'Kubernetes', alternatives: ['Docker Swarm', 'Nomad', 'Mesos'], reason: '生态最成熟，GPU 调度支持最好' },
    { category: '数据湖格式', chosen: 'Apache Iceberg', alternatives: ['Delta Lake', 'Apache Hudi'], reason: '开放标准，Schema Evolution 最灵活' },
    { category: '工作流编排', chosen: 'Airflow + Argo', alternatives: ['Prefect', 'Dagster', 'Luigi'], reason: 'Airflow 调度 + Argo K8s 原生 DAG' },
    { category: '特征仓库', chosen: 'Feast', alternatives: ['Tecton', 'Hopsworks', 'Feathr'], reason: '开源，K8s 原生，支持离线/在线双模' },
    { category: '向量数据库', chosen: 'Milvus', alternatives: ['Qdrant', 'Weaviate', 'Pinecone'], reason: '分布式，GPU 加速，10B+ 向量规模' },
    { category: '模型服务', chosen: 'Seldon + TensorRT', alternatives: ['BentoML', 'TorchServe', 'Triton'], reason: 'K8s 原生 + 车端 TensorRT 统一' },
  ],
};

// ═══════════════════════════════════════════════════════════════
// 2. K8s & 容器编排
// ═══════════════════════════════════════════════════════════════
export const K8S_DATA = {
  clusters: [
    {
      name: '训练集群',
      purpose: 'VLA + 世界模型分布式训练',
      nodes: '16 × DGX A100',
      gpu: '128 × A100 80GB',
      network: 'InfiniBand HDR 200Gbps',
      storage: 'Lustre 2PB + NVMe 缓存',
      scheduler: 'Volcano + Gang Scheduling',
      color: '#3fb950',
    },
    {
      name: '数据处理集群',
      purpose: '数据清洗 · 标注 · 挖掘 · ETL',
      nodes: '50 × CPU 节点 + 20 × T4 GPU',
      gpu: '20 × T4 16GB',
      network: '25Gbps Ethernet',
      storage: 'JuiceFS + S3',
      scheduler: 'Default + Priority Class',
      color: '#fd79a8',
    },
    {
      name: '推理/服务集群',
      purpose: '模型服务 · API · 仿真 · CI/CD',
      nodes: '30 × CPU + 10 × L4 GPU',
      gpu: '10 × L4 24GB',
      network: '25Gbps Ethernet',
      storage: 'Ceph RBD + S3',
      scheduler: 'HPA + Keda 自动扩缩',
      color: '#79c0ff',
    },
  ],
  components: [
    { name: 'Kubernetes 1.29', role: '容器编排核心', desc: '统一管理所有计算资源，支持 GPU 拓扑感知调度', icon: '☸️', category: '核心' },
    { name: 'Volcano 1.9', role: 'GPU 批调度器', desc: 'Gang Scheduling + Fair Share + 队列管理，训练任务不抢占', icon: '🌋', category: '调度' },
    { name: 'Istio 1.21', role: '服务网格', desc: 'mTLS 加密 + 流量管理 + 金丝雀发布 + 可观测性', icon: '🕸️', category: '网络' },
    { name: 'Argo CD', role: 'GitOps 部署', desc: 'Git 仓库即真相源，声明式部署，自动同步', icon: '🔄', category: '部署' },
    { name: 'Argo Workflows', role: 'DAG 编排', desc: 'K8s 原生工作流引擎，支持 DAG/Step/Loop', icon: '🔀', category: '编排' },
    { name: 'Keda', role: '事件驱动扩缩', desc: '基于 Kafka 消息积压 / GPU 利用率自动扩缩 Pod', icon: '📈', category: '扩缩' },
    { name: 'Cert-Manager', role: '证书管理', desc: 'Let\'s Encrypt 自动签发 + 轮换 TLS 证书', icon: '🔐', category: '安全' },
    { name: 'Velero', role: '备份恢复', desc: '集群状态 + PV 数据定期备份到 S3', icon: '💾', category: '运维' },
  ],
  namespaces: [
    { name: 'training', desc: '训练任务 (VLA/WM/预训练)', quota: 'GPU: 128, MEM: 10TB', color: '#3fb950' },
    { name: 'data-pipeline', desc: '数据处理流水线', quota: 'CPU: 400, MEM: 3.2TB', color: '#fd79a8' },
    { name: 'auto-label', desc: '自动标注服务', quota: 'GPU: 16, MEM: 1TB', color: '#ffa657' },
    { name: 'model-serving', desc: '模型推理服务', quota: 'GPU: 10, MEM: 240GB', color: '#79c0ff' },
    { name: 'monitoring', desc: '监控 & 日志', quota: 'CPU: 32, MEM: 128GB', color: '#d2a8ff' },
    { name: 'mlops', desc: 'MLflow / Feast / DVC', quota: 'CPU: 16, MEM: 64GB', color: '#6c5ce7' },
  ],
  gpuStrategy: {
    topology: 'GPU 拓扑感知调度 (NVLink/NVSwitch 亲和性)',
    mig: 'A100 MIG 切分 (1g.10gb / 2g.20gb / 3g.40gb)',
    timeshare: 'T4/L4 GPU 时间片共享 (推理任务)',
    preemption: '低优先级任务可被训练任务抢占',
    monitoring: 'DCGM Exporter → Prometheus → Grafana GPU 仪表盘',
  },
};

// ═══════════════════════════════════════════════════════════════
// 3. 数据湖仓
// ═══════════════════════════════════════════════════════════════
export const DATALAKE_DATA = {
  architecture: {
    layers: [
      {
        name: 'Landing Zone',
        desc: '原始数据着陆区，保留原始格式',
        format: 'MCAP / ROS2 Bag / Raw',
        lifecycle: '7 天后归档',
        storage: 'S3 Standard',
        color: '#ff7b72',
      },
      {
        name: 'Bronze Layer',
        desc: '解码后的结构化原始数据',
        format: 'Parquet + Iceberg',
        lifecycle: '90 天热存储',
        storage: 'S3 + JuiceFS 缓存',
        color: '#ffa657',
      },
      {
        name: 'Silver Layer',
        desc: '清洗、对齐、去重后的数据',
        format: 'Parquet + Iceberg (Schema V2)',
        lifecycle: '1 年温存储',
        storage: 'S3 Standard-IA',
        color: '#79c0ff',
      },
      {
        name: 'Gold Layer',
        desc: '标注完成、训练就绪的数据',
        format: 'WebDataset + Iceberg',
        lifecycle: '永久保留',
        storage: 'S3 + NVMe 热缓存',
        color: '#3fb950',
      },
    ],
  },
  icebergFeatures: [
    { name: 'Schema Evolution', desc: '无需重写数据即可添加/删除/重命名列', icon: '🔄' },
    { name: 'Hidden Partitioning', desc: '自动分区裁剪，查询无需感知分区结构', icon: '📂' },
    { name: 'Time Travel', desc: '按快照 ID 或时间戳查询历史版本', icon: '⏰' },
    { name: 'ACID Transactions', desc: '并发写入安全，支持 Serializable 隔离', icon: '🔒' },
    { name: 'Compaction', desc: '自动合并小文件，优化查询性能', icon: '📦' },
    { name: 'Row-level Deletes', desc: '支持行级删除/更新 (Merge-on-Read)', icon: '✂️' },
  ],
  lakeFSWorkflow: [
    { step: 1, action: 'branch', desc: '从 main 创建 feature/new-labels 分支', icon: '🌿' },
    { step: 2, action: 'commit', desc: '标注数据写入分支，自动记录变更', icon: '📝' },
    { step: 3, action: 'diff', desc: '对比分支与 main 的数据差异', icon: '🔍' },
    { step: 4, action: 'test', desc: '在分支上运行数据质量测试', icon: '✅' },
    { step: 5, action: 'merge', desc: '测试通过后合并到 main', icon: '🔀' },
    { step: 6, action: 'tag', desc: '打标签 v2.3.0 用于训练', icon: '🏷️' },
  ],
  queryEngines: [
    { name: 'Trino', role: '联邦查询', desc: '跨数据源 SQL 查询 (Iceberg + Hive + MySQL)', latency: '秒级', icon: '🔍' },
    { name: 'Spark SQL', role: '批处理', desc: '大规模 ETL + 聚合分析', latency: '分钟级', icon: '⚡' },
    { name: 'DuckDB', role: '本地分析', desc: '开发者本地快速探索 Parquet/Iceberg', latency: '毫秒级', icon: '🦆' },
    { name: 'Apache Atlas', role: '数据血缘', desc: '端到端数据血缘追踪 + 元数据治理', latency: '-', icon: '🗺️' },
  ],
  comparison: [
    { feature: '开放标准', iceberg: '✅ Apache 开源', delta: '⚠️ Databricks 主导', hudi: '✅ Apache 开源' },
    { feature: 'Schema Evolution', iceberg: '✅ 完整支持', delta: '✅ 支持', hudi: '⚠️ 部分支持' },
    { feature: 'Hidden Partition', iceberg: '✅ 原生支持', delta: '❌ 不支持', hudi: '❌ 不支持' },
    { feature: 'Time Travel', iceberg: '✅ 快照级', delta: '✅ 版本级', hudi: '✅ 时间线级' },
    { feature: '引擎兼容', iceberg: '✅ Spark/Trino/Flink', delta: '⚠️ Spark 优先', hudi: '✅ Spark/Flink' },
    { feature: '社区活跃度', iceberg: '🔥 最活跃', delta: '🔥 活跃', hudi: '⚠️ 一般' },
  ],
};

// ═══════════════════════════════════════════════════════════════
// 4. 数据流水线
// ═══════════════════════════════════════════════════════════════
export const PIPELINE_DATA = {
  dagOverview: {
    name: 'AD Data Pipeline',
    schedule: '每小时触发 (数据到达驱动)',
    executor: 'KubernetesExecutor',
    concurrency: 32,
    retries: 3,
    sla: '4 小时内完成',
  },
  stages: [
    {
      id: 'ingest',
      name: '数据接入',
      operator: 'KubernetesPodOperator',
      image: 'data-ingest:v2.3',
      input: 'S3 Landing Zone (MCAP/ROS2)',
      output: 'Iceberg Bronze Table',
      resources: { cpu: '4 core', mem: '8 GB', gpu: '-', replicas: 10 },
      tech: ['Kafka Consumer', 'Apache Avro', 'Hive Metastore'],
      duration: '~10 min',
      color: '#6c5ce7',
    },
    {
      id: 'decode',
      name: '解码对齐',
      operator: 'KubernetesPodOperator',
      image: 'data-decode:v1.8',
      input: 'Iceberg Bronze',
      output: 'Iceberg Bronze (decoded)',
      resources: { cpu: '8 core', mem: '16 GB', gpu: 'T4 ×1', replicas: 20 },
      tech: ['mcap-cli', 'FFmpeg', 'Draco', 'tf2_ros'],
      duration: '~30 min',
      color: '#00cec9',
    },
    {
      id: 'clean',
      name: '数据清洗',
      operator: 'SparkKubernetesOperator',
      image: 'data-clean:v3.1',
      input: 'Iceberg Bronze (decoded)',
      output: 'Iceberg Silver Table',
      resources: { cpu: '8 core', mem: '32 GB', gpu: '-', replicas: 15 },
      tech: ['PySpark 3.5', 'Great Expectations', 'OpenCV'],
      duration: '~20 min',
      color: '#fd79a8',
    },
    {
      id: 'annotate',
      name: '自动标注',
      operator: 'KubernetesPodOperator',
      image: 'auto-label:v4.2',
      input: 'Iceberg Silver',
      output: 'Iceberg Gold (labeled)',
      resources: { cpu: '16 core', mem: '64 GB', gpu: 'A100 ×2', replicas: 8 },
      tech: ['BEVFusion', 'InternVL', 'SAM2', 'MapTR'],
      duration: '~60 min',
      color: '#ffa657',
    },
    {
      id: 'qa',
      name: '质量检测',
      operator: 'KubernetesPodOperator',
      image: 'data-qa:v2.0',
      input: 'Iceberg Gold (labeled)',
      output: 'QA Report + Iceberg Gold (verified)',
      resources: { cpu: '4 core', mem: '16 GB', gpu: '-', replicas: 5 },
      tech: ['Great Expectations', 'Evidently AI', 'Label Studio'],
      duration: '~15 min',
      color: '#3fb950',
    },
    {
      id: 'mine',
      name: '场景挖掘',
      operator: 'KubernetesPodOperator',
      image: 'data-mine:v1.5',
      input: 'Iceberg Gold (verified)',
      output: 'Milvus 向量索引 + 挖掘报告',
      resources: { cpu: '8 core', mem: '32 GB', gpu: 'T4 ×1', replicas: 6 },
      tech: ['CLIP', 'FAISS', 'Milvus', 'Active Learning'],
      duration: '~25 min',
      color: '#79c0ff',
    },
    {
      id: 'export',
      name: '训练导出',
      operator: 'SparkKubernetesOperator',
      image: 'data-export:v1.2',
      input: 'Iceberg Gold + Feast Features',
      output: 'WebDataset (NVMe 热缓存)',
      resources: { cpu: '8 core', mem: '16 GB', gpu: '-', replicas: 4 },
      tech: ['WebDataset', 'Feast', 'LakeFS tag'],
      duration: '~15 min',
      color: '#d2a8ff',
    },
  ],
  airflowConfig: {
    executor: 'KubernetesExecutor (每个 Task 独立 Pod)',
    scheduler: '3 副本 HA，PostgreSQL 元数据库',
    worker: '动态创建，按 Task 资源需求分配',
    dag_repo: 'Git 仓库 (Argo CD 自动同步)',
    secrets: 'Kubernetes Secrets + Vault',
    monitoring: 'StatsD → Prometheus → Grafana',
  },
};

// ═══════════════════════════════════════════════════════════════
// 5. MLOps 实验平台
// ═══════════════════════════════════════════════════════════════
export const MLOPS_DATA = {
  experimentPlatform: {
    tracking: {
      name: 'MLflow + W&B',
      features: [
        { name: '实验追踪', desc: '超参数 · Loss 曲线 · 指标对比 · 模型 Artifact', icon: '📈' },
        { name: '模型注册', desc: '版本管理 · Stage (Staging/Production) · 审批流', icon: '📦' },
        { name: '模型对比', desc: '多实验并排对比 · 指标雷达图 · 参数 Diff', icon: '🔍' },
        { name: '团队协作', desc: '共享实验 · 评论 · @提及 · Slack 通知', icon: '👥' },
      ],
    },
    dataVersion: {
      name: 'DVC + LakeFS',
      features: [
        { name: '数据版本', desc: 'Git-like 数据版本管理，支持 branch/tag/merge', icon: '🏷️' },
        { name: '数据血缘', desc: '从原始数据到训练集的完整链路追踪', icon: '🗺️' },
        { name: '可复现性', desc: '代码 + 数据 + 环境 = 完全可复现的实验', icon: '🔄' },
        { name: '增量处理', desc: '只处理变化的数据，避免全量重跑', icon: '⚡' },
      ],
    },
  },
  cicd: {
    stages: [
      { name: 'Code Push', desc: 'Git push → 触发 CI', icon: '📤', tool: 'GitHub Actions' },
      { name: 'Lint & Test', desc: '代码检查 + 单元测试 + 数据验证', icon: '✅', tool: 'pytest + ruff' },
      { name: 'Build Image', desc: '构建训练/推理 Docker 镜像', icon: '🐳', tool: 'Kaniko (K8s 原生)' },
      { name: 'Train', desc: '提交训练任务到 Volcano', icon: '🧠', tool: 'Volcano Job' },
      { name: 'Evaluate', desc: '自动评测: L2 / FVD / 碰撞率 / PDMS', icon: '📊', tool: 'NAVSIM + nuScenes' },
      { name: 'Gate', desc: '指标门禁: 新模型必须优于 baseline', icon: '🚦', tool: 'MLflow Compare' },
      { name: 'Deploy', desc: 'Argo CD 自动部署到 Staging → Production', icon: '🚀', tool: 'Argo CD + Seldon' },
    ],
  },
  abTesting: {
    strategy: '影子模式 → 金丝雀 → 全量',
    steps: [
      { phase: 'Shadow', traffic: '0% (并行运行)', duration: '3 天', criteria: '无崩溃 + 延迟达标' },
      { phase: 'Canary 1%', traffic: '1%', duration: '2 天', criteria: '接管率 ≤ baseline' },
      { phase: 'Canary 5%', traffic: '5%', duration: '3 天', criteria: '所有指标 ≤ baseline' },
      { phase: 'Canary 20%', traffic: '20%', duration: '5 天', criteria: '统计显著性 p<0.05' },
      { phase: 'Full Rollout', traffic: '100%', duration: '-', criteria: '持续监控 7 天' },
    ],
  },
  modelRegistry: [
    { name: 'DriveWorld-VLA v3.2', stage: 'Production', metrics: 'L2: 0.42m, FVD: 52', date: '2026-04-10', status: 'active' },
    { name: 'DriveWorld-VLA v3.1', stage: 'Archived', metrics: 'L2: 0.48m, FVD: 68', date: '2026-03-28', status: 'archived' },
    { name: 'DriveWorld-VLA v3.3-rc1', stage: 'Staging', metrics: 'L2: 0.39m, FVD: 47', date: '2026-04-13', status: 'testing' },
    { name: 'WorldModel-Diffusion v2.1', stage: 'Production', metrics: 'FVD: 52, SSIM: 0.89', date: '2026-04-08', status: 'active' },
    { name: 'AutoLabel-BEVFusion v4.2', stage: 'Production', metrics: 'mAP: 0.72, NDS: 0.74', date: '2026-04-05', status: 'active' },
  ],
};

// ═══════════════════════════════════════════════════════════════
// 6. 可观测性
// ═══════════════════════════════════════════════════════════════
export const OBSERVABILITY_DATA = {
  stack: [
    {
      name: 'Prometheus',
      role: '指标采集 & 存储',
      desc: '拉取模式采集 K8s / GPU / 应用指标，15s 采集间隔，90 天保留',
      metrics: '~500K 时间序列',
      icon: '📈',
      color: '#e6522c',
    },
    {
      name: 'Grafana',
      role: '可视化仪表盘',
      desc: '50+ 预置仪表盘：K8s 集群 / GPU 利用率 / 数据流水线 / 模型指标',
      metrics: '50+ 仪表盘',
      icon: '📊',
      color: '#f46800',
    },
    {
      name: 'Elasticsearch',
      role: '日志存储 & 搜索',
      desc: '集中式日志存储，支持全文搜索 + 结构化查询',
      metrics: '~2TB/天 日志',
      icon: '🔍',
      color: '#00bfb3',
    },
    {
      name: 'Jaeger',
      role: '分布式追踪',
      desc: '端到端请求追踪，从数据接入到训练完成的全链路',
      metrics: '~1M spans/天',
      icon: '🔗',
      color: '#66d3f8',
    },
    {
      name: 'PagerDuty',
      role: '告警 & 值班',
      desc: '多级告警升级：Slack → 电话 → 值班经理',
      metrics: '~50 告警规则',
      icon: '🚨',
      color: '#06ac38',
    },
  ],
  dashboards: [
    { name: 'K8s 集群总览', panels: 'CPU/MEM/网络/Pod 状态/节点健康', refresh: '30s' },
    { name: 'GPU 利用率', panels: 'GPU Util% / 显存 / 温度 / 功耗 / SM 活跃度', refresh: '15s' },
    { name: '数据流水线', panels: 'DAG 成功率 / 延迟 / 数据量 / 错误分布', refresh: '1min' },
    { name: '模型训练', panels: 'Loss / LR / 吞吐量 / GPU 通信 / 梯度范数', refresh: '10s' },
    { name: '模型推理', panels: 'QPS / P99 延迟 / 错误率 / 模型版本分布', refresh: '15s' },
    { name: '数据质量', panels: '标注一致性 / 覆盖率 / 分布偏差 / 异常检测', refresh: '5min' },
  ],
  alertRules: [
    { name: 'GPU 利用率过低', condition: 'GPU Util < 30% 持续 30min', severity: 'warning', action: '检查训练任务是否卡住' },
    { name: 'Pipeline 失败', condition: 'DAG 失败率 > 5%', severity: 'critical', action: '自动重试 + 通知值班' },
    { name: '存储空间不足', condition: 'S3 使用率 > 85%', severity: 'warning', action: '触发冷归档策略' },
    { name: '模型推理延迟', condition: 'P99 > 100ms 持续 5min', severity: 'critical', action: '自动扩容 + 降级' },
    { name: '数据质量异常', condition: '标注一致性 < 90%', severity: 'warning', action: '暂停流水线 + 人工审核' },
    { name: '集群节点故障', condition: 'Node NotReady > 2', severity: 'critical', action: '自动隔离 + 重调度' },
  ],
};

// ═══════════════════════════════════════════════════════════════
// 7. 向量数据库 & 特征仓库
// ═══════════════════════════════════════════════════════════════
export const VECTOR_DATA = {
  vectorDB: {
    engine: 'Milvus 2.4 (分布式)',
    deployment: 'K8s StatefulSet, 3 QueryNode + 2 DataNode + etcd',
    collections: [
      { name: 'scene_embeddings', dim: 768, vectors: '~50M', model: 'CLIP ViT-L/14', usage: '场景相似度检索 · 长尾挖掘', icon: '🎬' },
      { name: 'frame_embeddings', dim: 1024, vectors: '~500M', model: 'InternViT-6B', usage: '帧级视觉检索 · 异常检测', icon: '🖼️' },
      { name: 'text_embeddings', dim: 4096, vectors: '~10M', model: 'InternLM2-7B', usage: '语言描述检索 · 语义搜索', icon: '📝' },
      { name: 'trajectory_embeddings', dim: 256, vectors: '~100M', model: 'Trajectory Encoder', usage: '轨迹模式匹配 · 行为聚类', icon: '🛤️' },
      { name: 'map_embeddings', dim: 512, vectors: '~5M', model: 'MapTR Encoder', usage: '地图场景匹配 · 区域检索', icon: '🗺️' },
    ],
    indexTypes: [
      { name: 'IVF_PQ', desc: '倒排 + 乘积量化，内存效率高', scenario: '大规模离线检索' },
      { name: 'HNSW', desc: '图索引，召回率高', scenario: '在线实时检索' },
      { name: 'GPU_IVF_FLAT', desc: 'GPU 加速暴力搜索', scenario: '小规模精确检索' },
    ],
    useCases: [
      { name: '长尾场景挖掘', desc: '用 CLIP 编码新场景 → 在 scene_embeddings 中检索最近邻 → 距离 > 阈值则为新场景', flow: '新数据 → CLIP → Milvus Search → 距离判断 → 标记' },
      { name: '困难样本发现', desc: '模型预测错误的样本 → 编码后检索相似样本 → 批量加入训练集', flow: '错误样本 → Encode → Milvus → 相似样本 → 训练集' },
      { name: '数据去重', desc: '新数据编码后检索 → 余弦相似度 > 0.98 则判定为重复', flow: '新数据 → Encode → Milvus → 相似度 > 0.98 → 去重' },
      { name: '语义搜索', desc: '自然语言描述 → 文本编码 → 检索匹配场景', flow: '"雨天十字路口" → InternLM → Milvus → 匹配场景' },
    ],
  },
  featureStore: {
    engine: 'Feast 0.38 (K8s 部署)',
    architecture: {
      offline: 'Iceberg (批量特征) → Trino 查询',
      online: 'Redis Cluster (实时特征) → <1ms 延迟',
      registry: 'PostgreSQL (特征定义 + 版本)',
    },
    featureGroups: [
      {
        name: 'BEV 感知特征',
        features: [
          { name: 'bev_feature_map', dim: '256×200×200', dtype: 'FP16', source: 'BEVFusion', freshness: '每帧更新' },
          { name: 'detected_objects', dim: 'N×10', dtype: 'FP32', source: '3D 检测头', freshness: '每帧更新' },
          { name: 'semantic_map', dim: '6×200×200', dtype: 'INT8', source: '语义分割', freshness: '每帧更新' },
        ],
        color: '#6c5ce7',
      },
      {
        name: '语言理解特征',
        features: [
          { name: 'instruction_embedding', dim: '4096', dtype: 'FP16', source: 'InternLM2', freshness: '每条指令' },
          { name: 'scene_description', dim: '4096', dtype: 'FP16', source: 'InternVL', freshness: '每帧更新' },
          { name: 'driving_intent', dim: '32', dtype: 'FP32', source: 'Intent Classifier', freshness: '每秒更新' },
        ],
        color: '#00cec9',
      },
      {
        name: '运动规划特征',
        features: [
          { name: 'ego_trajectory', dim: '12×2', dtype: 'FP32', source: 'VLA Head', freshness: '每帧更新' },
          { name: 'agent_trajectories', dim: '6×12×2', dtype: 'FP32', source: '预测头', freshness: '每帧更新' },
          { name: 'control_signal', dim: '3', dtype: 'FP32', source: 'PID 控制器', freshness: '100Hz' },
        ],
        color: '#fd79a8',
      },
      {
        name: '地图 & 环境特征',
        features: [
          { name: 'hd_map_feature', dim: '128×256', dtype: 'FP16', source: 'MapTR', freshness: '每帧更新' },
          { name: 'weather_condition', dim: '8', dtype: 'FP32', source: '天气分类器', freshness: '每分钟' },
          { name: 'road_topology', dim: '64×64', dtype: 'INT8', source: 'TopoNet', freshness: '每帧更新' },
        ],
        color: '#ffa657',
      },
    ],
  },
};

// ═══════════════════════════════════════════════════════════════
// 8. 图像去重
// ═══════════════════════════════════════════════════════════════
export const DEDUP_DATA = {
  // 去重层级体系（自动驾驶 & 具身机器人）
  dedupLevels: [
    {
      level: 'Level 1',
      name: '帧级去重（时间冗余）',
      icon: '🎬',
      color: '#79c0ff',
      desc: '消除连续帧之间的时间冗余，20Hz→3Hz 关键帧提取',
      approaches: [
        { name: '固定间隔采样', desc: '每 N 帧取 1 帧，简单但丢失关键事件', paper: null },
        { name: '帧间差异检测', desc: '光流/SSIM 检测变化，变化大时保留', paper: null },
        { name: 'DINOv2 帧级嵌入', desc: '相邻帧语义嵌入余弦相似度 > 0.98 则跳过', paper: 'SSL-Dedup (NeurIPS 2024)' },
        { name: '运动状态感知', desc: '结合 IMU/速度信号，静止时大幅降采样', paper: null },
      ],
      redundancy: '~85%',
      papers: ['SSL-Dedup (NeurIPS 2024)', 'SemDeDup (ICLR 2023)'],
    },
    {
      level: 'Level 2',
      name: '片段级去重（空间冗余）',
      icon: '🗺️',
      color: '#e17055',
      desc: '消除不同采集轮次中对同一地理区域/路段的重复覆盖，是自动驾驶和具身机器人场景中数据量最大的冗余来源',
      approaches: [
        {
          name: 'GPS/位姿聚类去重',
          desc: '基于 GPS 轨迹或 SLAM 位姿将片段按地理位置聚类，同一区域保留最优版本（标注质量/天气多样性/传感器完整性）',
          paper: 'D³: Scaling Up Data Deduplication for Driving (CVPR 2025)',
          detail: '将轨迹投影到栅格地图，同一栅格内的片段视为空间重复候选，再用多模态特征精排',
        },
        {
          name: 'NetVLAD / CosPlace 视觉位置识别',
          desc: '用视觉位置识别（VPR）模型判断两个片段是否拍摄同一地点。将每帧编码为全局描述子，片段级聚合后检索相似片段',
          paper: 'CosPlace: Revisiting and Improving Visual Place Recognition (CVPR 2023)',
          detail: 'CosPlace 用余弦相似度替代三元组损失训练 VPR 模型，在 Pittsburgh30k/Tokyo24/7 上 SOTA。片段去重时将连续帧描述子聚合为片段级向量',
        },
        {
          name: 'EigenPlaces 特征空间去重',
          desc: '基于 PCA 白化的视觉位置识别，在特征空间中发现空间冗余片段。相比 NetVLAD 更紧凑（512d→256d），检索更快',
          paper: 'EigenPlaces: Training Viewpoint Robust Models for VPR (ICCV 2023)',
          detail: '通过 PCA 降维保留最具判别力的方向，对视角变化更鲁棒。适合多车不同视角采集同一路段的去重',
        },
        {
          name: 'BEV 语义地图匹配',
          desc: '将片段的 BEV 语义地图（车道线/路沿/建筑轮廓）作为指纹，通过地图匹配发现空间重复。对光照/天气/季节变化完全鲁棒',
          paper: 'MapTR: Structured Modeling and Learning for Online Vectorized HD Map Construction (ICLR 2023)',
          detail: '用 MapTR 生成在线矢量化地图，将地图元素编码为结构化特征，片段间地图相似度 > 阈值则判定为空间重复',
        },
        {
          name: 'LiDAR 点云子地图匹配',
          desc: '将片段的 LiDAR 扫描累积为子地图（submap），通过 ICP/NDT 配准或学习型描述子匹配发现重叠区域',
          paper: 'OverlapTransformer: An Efficient and Yaw-Angle-Invariant Transformer Network for LiDAR-Based Place Recognition (RA-L 2022)',
          detail: 'OverlapTransformer 将 LiDAR 扫描转为 Range Image，用 Transformer 提取旋转不变描述子。片段级去重时将多帧 Range Image 聚合',
        },
        {
          name: '轨迹形状匹配',
          desc: '用 DTW（动态时间规整）或 Fréchet 距离比较两条轨迹的几何形状相似度，发现重复路段。不依赖 GPS 精度，对 SLAM 漂移鲁棒',
          paper: 'Computing the Fréchet Distance Between Two Polygonal Curves (IJCGA 1995)',
          detail: '经典算法在自动驾驶中的应用：将轨迹离散化后计算 Fréchet 距离，< 5m 阈值判定为同一路段。结合方向一致性过滤反向行驶',
        },
        {
          name: '多模态融合片段指纹',
          desc: '融合视觉 VPR + LiDAR 子地图 + 轨迹形状 + BEV 地图的多模态片段指纹，综合判断空间冗余',
          paper: 'D³: Scaling Up Data Deduplication for Driving (CVPR 2025)',
          detail: 'D³ 的片段级去重核心：4 种模态特征加权融合为片段指纹 → Milvus 向量检索 → 层次聚类 → 每簇保留最优版本',
        },
        {
          name: 'Habitat/Gibson 场景去重（具身机器人）',
          desc: '具身机器人场景中，基于 3D 场景图（Scene Graph）或房间拓扑结构判断不同采集轮次是否覆盖同一空间区域',
          paper: 'ConceptGraphs: Open-Vocabulary 3D Scene Graphs for Perception and Planning (ICRA 2024)',
          detail: '用开放词汇 3D 场景图表示空间语义，通过图匹配发现重复覆盖区域。适用于室内具身机器人的数据去重',
        },
      ],
      redundancy: '~60%',
      papers: [
        { paper: 'D³', venue: 'CVPR 2025', task: '多模态驾驶数据去重', method: '视觉+LiDAR+轨迹+地图融合', highlight: '首个 AD 专用多级去重框架，片段级去重核心' },
        { paper: 'CosPlace', venue: 'CVPR 2023', task: '视觉位置识别', method: '余弦相似度训练 VPR', highlight: '简洁高效的 VPR 方法，适合大规模片段检索' },
        { paper: 'EigenPlaces', venue: 'ICCV 2023', task: '视角鲁棒位置识别', method: 'PCA 白化 + 视角不变训练', highlight: '对多车不同视角采集同一路段的去重效果最佳' },
        { paper: 'MixVPR', venue: 'WACV 2023', task: '全局视觉位置识别', method: 'Feature Mixing + MLP', highlight: '无需局部特征聚合，全 MLP 架构，推理极快' },
        { paper: 'OverlapTransformer', venue: 'RA-L 2022', task: 'LiDAR 位置识别', method: 'Range Image + Transformer', highlight: '旋转不变 LiDAR 描述子，适合点云片段匹配' },
        { paper: 'MapTR', venue: 'ICLR 2023', task: '在线矢量化地图构建', method: 'Transformer + 结构化建模', highlight: 'BEV 地图指纹用于空间冗余检测' },
        { paper: 'ConceptGraphs', venue: 'ICRA 2024', task: '开放词汇 3D 场景图', method: 'VLM + 3D 场景图', highlight: '具身机器人场景的空间语义去重' },
        { paper: 'Patch-NetVLAD', venue: 'CVPR 2021', task: '局部特征位置识别', method: 'NetVLAD + Patch 匹配', highlight: '局部+全局特征融合，细粒度空间匹配' },
        { paper: 'AnyLoc', venue: 'RA-L 2024', task: '通用位置识别', method: 'DINOv2 + VLAD 聚合', highlight: '基于基础模型的零样本 VPR，跨域泛化强' },
      ],
    },
    {
      level: 'Level 3',
      name: '场景级去重（语义冗余）',
      icon: '🎭',
      color: '#3fb950',
      desc: '消除语义相似但地理位置不同的场景冗余，如大量相似的直行道路、停车场',
      approaches: [
        { name: 'CLIP 场景分类', desc: '按场景类型（高速/城区/停车场/十字路口）分类后均衡采样', paper: 'SemDeDup (ICLR 2023)' },
        { name: 'DINOv2 场景聚类', desc: '场景级嵌入聚类，大簇降采样、小簇全保留', paper: 'SSL-Dedup (NeurIPS 2024)' },
        { name: 'D³ 多模态场景指纹', desc: '融合多模态特征的场景级去重，保持场景多样性', paper: 'D³ (CVPR 2025)' },
      ],
      redundancy: '~40%',
      papers: ['SemDeDup (ICLR 2023)', 'SSL-Dedup (NeurIPS 2024)', 'D³ (CVPR 2025)'],
    },
  ],
  // 去重方法演进
  methods: [
    {
      name: '精确哈希去重',
      tech: 'MD5 / SHA-256',
      granularity: '像素级完全相同',
      dedup_rate: '~3%',
      precision: '100%',
      recall: '~5%',
      cost: '极低',
      icon: '#️⃣',
      color: '#94a3b8',
      desc: '计算文件哈希值，完全相同的文件直接去除。速度极快但只能发现完全相同的副本。',
    },
    {
      name: '感知哈希去重',
      tech: 'pHash / dHash / aHash',
      granularity: '近似像素级',
      dedup_rate: '~5%',
      precision: '99%',
      recall: '~23%',
      cost: '低',
      icon: '🔢',
      color: '#79c0ff',
      desc: '将图像缩放+DCT变换为紧凑哈希，汉明距离<5判定为重复。对裁剪/缩放鲁棒，但对视角/光照变化敏感。',
    },
    {
      name: 'CLIP 语义去重',
      tech: 'CLIP ViT-L/14 + 余弦相似度',
      granularity: '语义级',
      dedup_rate: '~40%',
      precision: '91%',
      recall: '~79%',
      cost: '中',
      icon: '📎',
      color: '#ffa657',
      desc: '利用 CLIP 视觉编码器提取语义嵌入，余弦相似度>阈值判定为重复。语义理解强但对细粒度视觉差异不敏感。',
    },
    {
      name: 'DINOv2 自监督去重',
      tech: 'DINOv2 ViT-L/G + FAISS/Milvus',
      granularity: '视觉语义级',
      dedup_rate: '~50%',
      precision: '97%',
      recall: '~95%',
      cost: '中高',
      icon: '🦕',
      color: '#3fb950',
      desc: 'SSL-Dedup 方法，DINOv2 自蒸馏嵌入保留更多视觉细节，对视角/光照/遮挡变化鲁棒，图像去重最佳选择。',
    },
    {
      name: 'D³ 多模态去重',
      tech: 'CLIP + PointPillar + Trajectory + MapTR',
      granularity: '多模态场景级',
      dedup_rate: '~70%',
      precision: '96%',
      recall: '~92%',
      cost: '高',
      icon: '🎯',
      color: '#e17055',
      desc: '融合视觉+LiDAR+轨迹+地图四种模态，层次化去重（帧级/片段级/场景级），自动驾驶专用，长尾保护机制。',
    },
  ],
  // 推荐的多级去重 Pipeline
  pipeline: [
    {
      stage: 'Stage 1',
      name: '精确去重',
      method: 'MD5 / SHA-256',
      target: '完全相同的文件副本',
      dedup: '~3%',
      time: '<1 min / 1M images',
      color: '#94a3b8',
    },
    {
      stage: 'Stage 2',
      name: '近似像素去重',
      method: 'pHash (汉明距离 < 5)',
      target: '裁剪/缩放/轻微修改的副本',
      dedup: '~5%',
      time: '~5 min / 1M images',
      color: '#79c0ff',
    },
    {
      stage: 'Stage 3',
      name: 'SSL 语义去重',
      method: 'DINOv2 ViT-L + Milvus (cos > 0.95)',
      target: '不同视角/光照/天气的相同场景',
      dedup: '~40%',
      time: '~2 hr / 10M images (8×A100)',
      color: '#3fb950',
    },
    {
      stage: 'Stage 4',
      name: '多模态场景去重',
      method: 'D³ (视觉+LiDAR+轨迹+地图)',
      target: '多车重复路段 / 时间冗余片段',
      dedup: '~20%',
      time: '~3 hr / 10M frames (8×A100)',
      color: '#e17055',
    },
  ],
  // 自动驾驶场景去重效果
  adScenarios: [
    { scenario: '连续帧 (20Hz)', redundancy: '~85%', method: 'DINOv2 帧级', retained: '~3Hz 关键帧', icon: '🎬' },
    { scenario: '多车同路段', redundancy: '~60%', method: 'D³ 片段级', retained: '保留最佳标注版本', icon: '🚗' },
    { scenario: '静态场景 (停车/等灯)', redundancy: '~90%', method: 'DINOv2 + 运动检测', retained: '每类保留 10 样本', icon: '🅿️' },
    { scenario: '天气重复 (晴天过多)', redundancy: '~40%', method: 'CLIP 天气分类 + 均衡采样', retained: '各天气均衡', icon: '☀️' },
    { scenario: '夜间低质量', redundancy: '~30%', method: '质量评分 + DINOv2', retained: '保留高质量夜间', icon: '🌙' },
    { scenario: '长尾稀有场景', redundancy: '0%', method: '小簇全保留策略', retained: '全部保留', icon: '⚠️' },
  ],
  // 论文对比
  paperComparison: [
    { paper: 'SemDeDup', venue: 'ICLR 2023', modality: '单模态 (视觉/文本)', domain: '通用', maxDedup: '~50%', perfDrop: '<0.5%', highlight: '开创语义去重范式' },
    { paper: 'D³', venue: 'CVPR 2025', modality: '多模态 (视觉+LiDAR+轨迹+地图)', domain: '自动驾驶', maxDedup: '~70%', perfDrop: '<1%', highlight: '首个 AD 专用多级去重框架' },
    { paper: 'SSL-Dedup', venue: 'NeurIPS 2024', modality: '单模态 (视觉)', domain: '通用', maxDedup: '~50%', perfDrop: '<0.2%', highlight: 'DINOv2 > CLIP 去重' },
    { paper: 'CosPlace', venue: 'CVPR 2023', modality: '单模态 (视觉)', domain: 'VPR / 片段去重', maxDedup: '~60%', perfDrop: '<0.5%', highlight: '余弦相似度训练 VPR，片段级空间去重' },
    { paper: 'EigenPlaces', venue: 'ICCV 2023', modality: '单模态 (视觉)', domain: 'VPR / 片段去重', maxDedup: '~60%', perfDrop: '<0.5%', highlight: 'PCA 白化视角鲁棒，多车同路段去重' },
    { paper: 'OverlapTransformer', venue: 'RA-L 2022', modality: '单模态 (LiDAR)', domain: 'LiDAR 位置识别', maxDedup: '~55%', perfDrop: '<0.3%', highlight: '旋转不变 LiDAR 描述子' },
    { paper: 'AnyLoc', venue: 'RA-L 2024', modality: '单模态 (视觉)', domain: '通用 VPR', maxDedup: '~55%', perfDrop: '<0.5%', highlight: 'DINOv2 零样本 VPR，跨域泛化' },
    { paper: 'ConceptGraphs', venue: 'ICRA 2024', modality: '多模态 (视觉+3D)', domain: '具身机器人', maxDedup: '~50%', perfDrop: '<1%', highlight: '3D 场景图空间语义去重' },
  ],
  // 工程架构
  architecture: {
    edgeDedup: {
      name: '车端去重 (Edge)',
      steps: [
        { name: '关键帧提取', desc: '20Hz → 3Hz，基于帧间差异的关键帧选择', tech: 'OpenCV + 光流' },
        { name: '轻量编码', desc: 'MobileNet-V3 提取 256d 嵌入，本地缓存', tech: 'TensorRT + ONNX' },
        { name: '本地去重', desc: '与最近 1000 帧比较，cos > 0.98 跳过上传', tech: 'FAISS (CPU)' },
      ],
      compression: '~85% 帧被过滤',
    },
    cloudDedup: {
      name: '云端去重 (Cloud)',
      steps: [
        { name: 'MD5 + pHash', desc: '精确 + 近似像素级去重', tech: 'Spark UDF' },
        { name: 'DINOv2 编码', desc: '6路相机分别编码 → 帧级嵌入聚合', tech: 'DINOv2 ViT-L + A100' },
        { name: 'Milvus 检索', desc: '新数据 vs 全量索引，cos > 0.95 标记重复', tech: 'Milvus IVF_PQ' },
        { name: 'D³ 多模态', desc: '融合 LiDAR + 轨迹 + 地图的场景级去重', tech: 'D³ Pipeline' },
        { name: '长尾保护', desc: '小簇全保留 + FPS 多样性采样', tech: 'K-Means + FPS' },
      ],
      compression: '额外去除 ~40%',
    },
    storage: {
      embeddings: 'Milvus (10B+ 向量) + Feast (特征缓存)',
      index: 'IVF_PQ (离线) + HNSW (在线增量)',
      metadata: 'Iceberg (去重标记 + 血缘追踪)',
    },
  },
  // 效果指标
  metrics: {
    before: { totalFrames: '~500M', storage: '~500 PB', trainData: '~50 PB' },
    after: { totalFrames: '~150M', storage: '~150 PB', trainData: '~15 PB', savedCost: '~70%' },
    quality: { nds: '0.714 → 0.711 (-0.003)', map: '0.672 → 0.668 (-0.004)', l2: '0.42m → 0.43m (+0.01m)' },
  },
};

// ═══════════════════════════════════════════════════════════════
// 9. 数据合成
// ═══════════════════════════════════════════════════════════════
export const SYNTH_DATA = {
  // 数据合成在闭环中的定位
  overview: {
    role: '数据合成是数据闭环的关键加速器，解决长尾场景数据不足和标注成本高昂两大核心痛点',
    position: '位于数据闭环的「数据增强」环节，连接场景挖掘（上游）和模型训练（下游）',
    value: [
      { name: '长尾补充', desc: '定向生成稀有场景（施工区/动物/极端天气），补充真实数据中的长尾缺口', icon: '🎯', color: '#e17055' },
      { name: '标注降本', desc: 'VLM 自动标注替代人工，标注成本降低 90%+', icon: '💰', color: '#3fb950' },
      { name: '数据多样性', desc: '同一场景生成多种变体（天气/光照/交通流），提升模型泛化能力', icon: '🌈', color: '#ffa657' },
      { name: '仿真闭环', desc: 'Sim2Real 打通仿真→真实链路，仿真数据直接可训练', icon: '🔄', color: '#79c0ff' },
      { name: '轨迹增强', desc: '扩散模型生成多样化轨迹，解决规划模型训练中的分布偏差', icon: '🛤️', color: '#d2a8ff' },
      { name: '质量闭环', desc: '合成数据质量自动评估，形成生成→评估→优化的闭环', icon: '✅', color: '#6c5ce7' },
    ],
  },
  // 合成方法分类
  methods: [
    {
      name: 'VLM 自动标注',
      category: '标注合成',
      tech: 'InternVL + Grounded-SAM2 + Metric3D',
      input: '原始图像 (无标注)',
      output: '3D 检测框 + 语义分割 + 场景描述',
      quality: 'mAP ~0.65 (vs 人工 0.72)',
      cost: '~$0.01/帧 (vs 人工 ~$2/帧)',
      icon: '🤖',
      color: '#e17055',
      desc: '利用视觉大模型自动生成高质量 3D 标注，完全替代人工标注流程。InternVL 提供场景理解，Grounded-SAM2 精确分割，Metric3D 深度估计，几何投影生成 3D 框。',
    },
    {
      name: '长尾场景定向合成',
      category: '图像合成',
      tech: 'InstructPix2Pix + ControlNet + LoRA',
      input: '真实图像 + 文本指令',
      output: '编辑后的驾驶图像 (保持结构)',
      quality: 'FID ~35, 结构保持率 >95%',
      cost: '~$0.005/张 (GPU 推理)',
      icon: '🎨',
      color: '#ffa657',
      desc: '通过自然语言指令编辑真实驾驶图像，定向生成长尾稀有场景。ControlNet 保持场景几何结构，InstructPix2Pix 根据指令修改目标属性（天气/光照/物体）。',
    },
    {
      name: 'LLM 场景布局生成',
      category: '场景合成',
      tech: 'GPT-4 / Claude + Transformer Decoder',
      input: '自然语言场景描述',
      output: 'BEV 布局 (物体位置/朝向/类别)',
      quality: '碰撞率 <2%, 车道合规 >98%',
      cost: '~$0.02/场景 (API 调用)',
      icon: '📝',
      color: '#79c0ff',
      desc: '用 LLM 将自然语言描述解析为结构化场景，Transformer Decoder 生成 BEV 布局。支持多样性采样，同一描述生成多种合理布局。可与 MagicDrive 联合渲染为多视角图像。',
    },
    {
      name: 'Sim-to-Real 域适配',
      category: '域迁移',
      tech: 'CUT / CycleGAN + CARLA',
      input: 'CARLA 仿真渲染图',
      output: '真实风格驾驶图像',
      quality: 'FID ~42, 下游 mAP +3.2%',
      cost: '~$0.002/张 (GPU 推理)',
      icon: '🔄',
      color: '#3fb950',
      desc: '将仿真器渲染图像转换为真实风格，使仿真数据可直接用于真实场景模型训练。CUT 用对比学习实现高效单向翻译，PatchNCE Loss 保持局部结构一致性。',
    },
    {
      name: '扩散轨迹合成',
      category: '轨迹合成',
      tech: 'DDPM + VectorNet + 条件注入',
      input: '地图 + 周围 Agent 状态',
      output: '多条多样化驾驶轨迹',
      quality: 'minADE ~0.8m, 碰撞率 <1%',
      cost: '~$0.001/组 (GPU 推理)',
      icon: '🛤️',
      color: '#d2a8ff',
      desc: '用扩散模型在轨迹空间扩散/去噪，条件注入地图和周围 Agent 特征，采样时生成多条多样化轨迹。支持可行性过滤（碰撞检测 + 车道合规 + 运动学约束）。',
    },
  ],
  // 合成数据在闭环中的架构
  architecture: {
    pipeline: [
      { stage: '触发', name: '长尾发现', desc: '场景挖掘发现数据缺口 → 生成合成需求', source: '向量 DB + 主动学习', icon: '🔍', color: '#6c5ce7' },
      { stage: '生成', name: '数据合成', desc: '根据需求选择合成方法 → 批量生成数据', source: '合成引擎集群 (A100)', icon: '🧫', color: '#a29bfe' },
      { stage: '质检', name: '质量评估', desc: '自动评估合成数据质量 → 过滤低质量样本', source: 'FID / CLIP Score / 下游指标', icon: '✅', color: '#3fb950' },
      { stage: '入库', name: '数据入湖', desc: '合成数据标记来源 → 写入 Iceberg Gold 层', source: 'Iceberg + LakeFS tag', icon: '🏞️', color: '#00cec9' },
      { stage: '混合', name: '数据混合', desc: '真实数据 + 合成数据按比例混合 → 训练集', source: 'WebDataset + 采样策略', icon: '🔀', color: '#fd79a8' },
      { stage: '训练', name: '模型训练', desc: '混合数据训练 → 评估长尾场景提升', source: 'Volcano + MLflow', icon: '🧠', color: '#ffa657' },
      { stage: '反馈', name: '效果反馈', desc: '训练效果反馈 → 调整合成策略和比例', source: '指标对比 + A/B 测试', icon: '📊', color: '#79c0ff' },
    ],
    mixStrategy: {
      name: '真实-合成数据混合策略',
      rules: [
        { scenario: '常规场景', realRatio: '90%', synthRatio: '10%', method: '随机混合', reason: '真实数据充足，合成数据作为增强' },
        { scenario: '长尾场景 (施工区)', realRatio: '30%', synthRatio: '70%', method: '过采样合成', reason: '真实数据极少，合成数据为主' },
        { scenario: '极端天气', realRatio: '40%', synthRatio: '60%', method: '天气均衡采样', reason: '暴雨/大雪真实数据不足' },
        { scenario: '夜间场景', realRatio: '50%', synthRatio: '50%', method: '时间均衡采样', reason: '夜间数据质量差，合成补充' },
        { scenario: '新城市/新路段', realRatio: '20%', synthRatio: '80%', method: 'Sim2Real 为主', reason: '无真实数据，仿真+域适配' },
      ],
    },
  },
  // 质量评估体系
  qualityMetrics: [
    { name: 'FID (Fréchet Inception Distance)', desc: '衡量合成图像与真实图像分布的距离', target: '< 50', icon: '📐' },
    { name: 'CLIP Score', desc: '合成图像与文本描述的语义一致性', target: '> 0.28', icon: '📎' },
    { name: '结构保持率 (SSIM)', desc: '编辑前后场景结构的保持程度', target: '> 0.85', icon: '🏗️' },
    { name: '下游 mAP 提升', desc: '加入合成数据后检测模型 mAP 变化', target: '> +1.0%', icon: '📈' },
    { name: '碰撞率 (轨迹)', desc: '合成轨迹与其他 Agent/边界的碰撞比例', target: '< 1%', icon: '💥' },
    { name: '标注一致性', desc: '自动标注与人工标注的一致性 (IoU)', target: '> 0.75', icon: '🎯' },
  ],
  // 论文参考
  papers: [
    { paper: 'MagicDrive', venue: 'ICLR 2024', task: '可控多视角街景生成', method: 'SD + ControlNet + LoRA', highlight: 'BEV 布局条件 → 6 路一致环视图像' },
    { paper: 'ChatScene', venue: 'CVPR 2024', task: '文本→场景布局生成', method: 'LLM + Transformer Decoder', highlight: '自然语言描述 → BEV 物体布局' },
    { paper: 'InstructPix2Pix', venue: 'CVPR 2023', task: '指令式图像编辑', method: 'Diffusion + 文本条件', highlight: '"make it rainy" → 天气变换' },
    { paper: 'CTG++', venue: 'CoRL 2023', task: '可控轨迹生成', method: 'Diffusion + 约束引导', highlight: '条件扩散 → 多样化安全轨迹' },
    { paper: 'GeoDiffusion', venue: 'ICLR 2024', task: '几何可控场景生成', method: 'Diffusion + 3D 布局条件', highlight: '3D 框条件 → 几何一致图像' },
    { paper: 'DriveEditor', venue: 'ECCV 2024', task: '驾驶场景编辑', method: 'ControlNet + 区域编辑', highlight: '局部编辑保持全局一致性' },
    { paper: 'Grounded-SAM', venue: '2024', task: '开放词汇分割', method: 'Grounding-DINO + SAM', highlight: '文本提示 → 精确实例分割' },
    { paper: 'CUT', venue: 'ECCV 2020', task: '无配对图像翻译', method: '对比学习 + PatchNCE', highlight: '单向翻译，高效 Sim2Real' },
  ],
  // 效果指标
  metrics: {
    synthVolume: { daily: '~100K 帧/天', monthly: '~3M 帧/月', total: '~50M 帧 (累计)' },
    costSaving: { labelCost: '标注成本降低 90% ($2→$0.01/帧)', dataCost: '长尾数据获取成本降低 80%', trainCost: '训练数据准备周期缩短 70%' },
    qualityImpact: {
      longtail_mAP: '长尾场景 mAP: 0.32 → 0.48 (+50%)',
      weather_robustness: '极端天气鲁棒性: +12% mAP',
      planning_collision: '规划碰撞率: 2.1% → 1.3% (-38%)',
      overall_nds: '整体 NDS: 0.714 → 0.728 (+1.4%)',
    },
  },
};

// ═══════════════════════════════════════════════════════════════
// 10. 推理 & 训练框架优化
// ═══════════════════════════════════════════════════════════════
export const FRAMEWORK_DATA = {
  // 总览
  overview: {
    role: '推理与训练框架优化是数据闭环中模型迭代速度的核心瓶颈，直接决定从数据到模型部署的端到端效率',
    dimensions: [
      { name: '训练吞吐', desc: '分布式训练框架选型与通信优化，最大化 GPU 利用率', icon: '🏋️', color: '#ff6b6b' },
      { name: '推理延迟', desc: '推理引擎与量化策略，满足车端实时性要求 (<50ms)', icon: '⚡', color: '#ffa657' },
      { name: '显存效率', desc: '混合精度、梯度检查点、KV Cache 优化，降低显存占用', icon: '💾', color: '#3fb950' },
      { name: '编译加速', desc: 'torch.compile / Triton / CUDA Graph，算子融合与图优化', icon: '🔧', color: '#79c0ff' },
      { name: '车端部署', desc: 'Orin 平台推理优化，模型裁剪与多模型并行调度', icon: '🚗', color: '#d2a8ff' },
      { name: '成本控制', desc: '训练成本 vs 推理成本的全局优化，ROI 最大化', icon: '💰', color: '#6c5ce7' },
    ],
  },

  // 训练框架对比
  trainFrameworks: [
    {
      name: 'DeepSpeed ZeRO',
      org: 'Microsoft',
      icon: '🔵',
      color: '#326ce5',
      desc: '业界最成熟的大模型分布式训练框架，ZeRO 三阶段渐进式优化显存',
      stages: [
        { name: 'ZeRO-1', desc: '优化器状态分片', memSave: '~4×', overhead: '极低', scenario: '中等模型 (<10B)' },
        { name: 'ZeRO-2', desc: '+ 梯度分片', memSave: '~8×', overhead: '低', scenario: '大模型 (10-70B)' },
        { name: 'ZeRO-3', desc: '+ 参数分片', memSave: '~N×', overhead: '中', scenario: '超大模型 (>70B)' },
        { name: 'ZeRO-Infinity', desc: '+ NVMe 卸载', memSave: '∞', overhead: '高', scenario: '极端显存受限' },
      ],
      pros: ['生态最成熟', '与 HuggingFace 深度集成', '配置简单', 'Offload 支持'],
      cons: ['通信开销随 ZeRO 阶段增加', '大规模集群调优复杂'],
      bestFor: 'VLA 模型训练 (7B-70B 参数量)',
    },
    {
      name: 'PyTorch FSDP',
      org: 'Meta',
      icon: '🔴',
      color: '#ee4c2c',
      desc: 'PyTorch 原生全分片数据并行，与 PyTorch 生态无缝集成',
      stages: [
        { name: 'FULL_SHARD', desc: '参数+梯度+优化器全分片', memSave: '~N×', overhead: '中', scenario: '大模型训练' },
        { name: 'SHARD_GRAD_OP', desc: '梯度+优化器分片', memSave: '~8×', overhead: '低', scenario: '中等模型' },
        { name: 'NO_SHARD', desc: '不分片 (DDP)', memSave: '1×', overhead: '极低', scenario: '小模型 / 基线' },
      ],
      pros: ['PyTorch 原生', '无额外依赖', 'torch.compile 兼容', '社区活跃'],
      cons: ['成熟度略低于 DeepSpeed', '高级功能较少'],
      bestFor: '需要 torch.compile 加速的场景',
    },
    {
      name: 'Megatron-LM',
      org: 'NVIDIA',
      icon: '🟢',
      color: '#76b900',
      desc: 'NVIDIA 官方大模型训练框架，支持 3D 并行（TP + PP + DP）',
      stages: [
        { name: 'Tensor Parallel', desc: '层内张量切分', memSave: '~T×', overhead: '低 (NVLink)', scenario: '单节点多卡' },
        { name: 'Pipeline Parallel', desc: '层间流水线', memSave: '~P×', overhead: '中 (气泡)', scenario: '跨节点' },
        { name: 'Sequence Parallel', desc: '序列维度切分', memSave: '~S×', overhead: '低', scenario: '长序列' },
      ],
      pros: ['3D 并行最成熟', 'NVIDIA 硬件深度优化', '吞吐量最高', 'FP8 原生支持'],
      cons: ['代码侵入性强', '模型适配成本高', '社区生态较封闭'],
      bestFor: '超大规模预训练 (>100B)，NVIDIA 集群',
    },
  ],

  // 混合精度策略
  precisionStrategies: [
    { name: 'FP32', bits: 32, memPerParam: '4B', trainSpeed: '1×', quality: '基线', scenario: '调试 / 精度敏感任务', color: '#94a3b8' },
    { name: 'BF16', bits: 16, memPerParam: '2B', trainSpeed: '~2×', quality: '≈FP32', scenario: '主流训练精度（推荐）', color: '#3fb950' },
    { name: 'FP16 + Loss Scaling', bits: 16, memPerParam: '2B', trainSpeed: '~2×', quality: '需调参', scenario: '无 BF16 硬件支持时', color: '#ffa657' },
    { name: 'FP8 (E4M3/E5M2)', bits: 8, memPerParam: '1B', trainSpeed: '~3×', quality: '略降', scenario: 'H100/H200 训练加速', color: '#ff6b6b' },
    { name: 'INT8 (W8A8)', bits: 8, memPerParam: '1B', trainSpeed: 'N/A', quality: '推理用', scenario: '推理量化（PTQ/QAT）', color: '#79c0ff' },
    { name: 'INT4 (GPTQ/AWQ)', bits: 4, memPerParam: '0.5B', trainSpeed: 'N/A', quality: '有损', scenario: '极致推理压缩', color: '#d2a8ff' },
  ],

  // 推理引擎对比
  inferenceEngines: [
    {
      name: 'TensorRT',
      org: 'NVIDIA',
      icon: '🟩',
      color: '#76b900',
      desc: '车端推理首选，深度优化 NVIDIA GPU/Orin 平台',
      features: ['INT8/FP8 量化', '算子融合', '动态 Shape', 'CUDA Graph', 'DLA 加速'],
      latency: '<30ms (Orin)',
      throughput: '高',
      platform: 'NVIDIA GPU / Orin / Xavier',
      bestFor: '车端实时推理（VLA 模型部署）',
    },
    {
      name: 'vLLM',
      org: 'UC Berkeley',
      icon: '🟦',
      color: '#326ce5',
      desc: '云端 LLM 推理首选，PagedAttention 显存管理革命',
      features: ['PagedAttention', '连续批处理', 'Speculative Decoding', 'Prefix Caching', 'LoRA 热切换'],
      latency: '~100ms (首 Token)',
      throughput: '极高 (批处理)',
      platform: 'NVIDIA GPU (云端)',
      bestFor: '云端 VLM/LLM 推理服务（标注/场景理解）',
    },
    {
      name: 'ONNX Runtime',
      org: 'Microsoft',
      icon: '🟧',
      color: '#e17055',
      desc: '跨平台推理引擎，支持多硬件后端',
      features: ['跨平台', '图优化', '量化工具链', 'DirectML', 'CUDA EP'],
      latency: '~50ms',
      throughput: '中',
      platform: 'CPU / GPU / NPU / 多平台',
      bestFor: '跨平台部署、非 NVIDIA 硬件',
    },
    {
      name: 'TGI (Text Generation Inference)',
      org: 'Hugging Face',
      icon: '🟨',
      color: '#ffa657',
      desc: 'HuggingFace 官方推理服务，开箱即用',
      features: ['Flash Attention', 'Paged Attention', '水印', '流式输出', 'Safetensors'],
      latency: '~120ms (首 Token)',
      throughput: '高',
      platform: 'NVIDIA GPU (云端)',
      bestFor: '快速部署 HuggingFace 模型',
    },
    {
      name: 'SGLang',
      org: 'LMSYS',
      icon: '🟪',
      color: '#a29bfe',
      desc: '新一代 LLM 推理引擎，RadixAttention 前缀共享',
      features: ['RadixAttention', '自动前缀缓存', '结构化输出', '多模态支持', 'DP Attention'],
      latency: '~80ms (首 Token)',
      throughput: '极高',
      platform: 'NVIDIA GPU (云端)',
      bestFor: '高并发 VLM 推理、结构化输出场景',
    },
  ],

  // 编译优化
  compileOptimizations: [
    {
      name: 'torch.compile',
      desc: 'PyTorch 2.x 图编译器，自动算子融合与内存优化',
      speedup: '训练 10-30%↑, 推理 20-50%↑',
      effort: '一行代码',
      maturity: '成熟',
      icon: '🔥',
      color: '#ee4c2c',
      details: ['TorchDynamo 图捕获', 'TorchInductor 代码生成', '自动算子融合', '内存规划优化', '支持动态 Shape'],
    },
    {
      name: 'FlashAttention-3',
      desc: '硬件感知的注意力计算优化，IO 感知算法',
      speedup: 'Attention 2-4×↑, 显存 5-20×↓',
      effort: '替换 Attention 层',
      maturity: '成熟',
      icon: '⚡',
      color: '#ffa657',
      details: ['IO 感知 tiling', 'Online softmax', '异步流水线 (H100)', 'FP8 支持', '变长序列优化'],
    },
    {
      name: 'Triton',
      desc: 'OpenAI 开源 GPU 编程语言，Python 写 CUDA kernel',
      speedup: '自定义算子 2-5×↑',
      effort: '需编写 Triton kernel',
      maturity: '活跃发展',
      icon: '🔺',
      color: '#3fb950',
      details: ['Python 语法写 GPU kernel', '自动 tiling 与调度', '与 torch.compile 集成', '跨 GPU 架构', '社区 kernel 库丰富'],
    },
    {
      name: 'CUDA Graph',
      desc: '将多个 CUDA 操作录制为图，减少 CPU-GPU 同步开销',
      speedup: '推理 10-30%↑ (小 batch)',
      effort: '需适配动态 Shape',
      maturity: '成熟',
      icon: '📊',
      color: '#79c0ff',
      details: ['消除 kernel launch 开销', '减少 CPU-GPU 同步', '适合固定 Shape 推理', 'TensorRT 自动使用', 'vLLM 集成'],
    },
  ],

  // 车端推理优化
  edgeOptimization: {
    platform: {
      name: 'NVIDIA Orin',
      specs: [
        { name: 'GPU', value: '2048 CUDA + 64 Tensor Cores', icon: '🖥️' },
        { name: '算力', value: '275 TOPS (INT8) / 138 TFLOPS (FP16)', icon: '⚡' },
        { name: '内存', value: '32GB LPDDR5 (204.8 GB/s)', icon: '💾' },
        { name: '功耗', value: '15-60W (可配置)', icon: '🔋' },
        { name: 'DLA', value: '2× Deep Learning Accelerator', icon: '🧠' },
      ],
    },
    strategies: [
      {
        name: '模型量化',
        desc: 'FP32 → FP16 → INT8 逐步量化，精度-延迟 Pareto 优化',
        techniques: ['PTQ (训练后量化)', 'QAT (量化感知训练)', '混合精度量化 (敏感层 FP16 + 其余 INT8)', 'DLA INT8 卸载'],
        impact: '延迟 ↓50%, 显存 ↓60%',
        icon: '📐',
        color: '#ff6b6b',
      },
      {
        name: '知识蒸馏',
        desc: '大模型 (Teacher) → 小模型 (Student)，保留核心能力',
        techniques: ['特征蒸馏 (BEV 特征对齐)', '输出蒸馏 (轨迹 KL 散度)', '渐进式蒸馏 (多阶段)', '任务特定蒸馏'],
        impact: '参数量 ↓70%, 精度损失 <2%',
        icon: '🎓',
        color: '#3fb950',
      },
      {
        name: '结构剪枝',
        desc: '移除冗余通道/注意力头，减少计算量',
        techniques: ['通道剪枝 (L1 范数)', '注意力头剪枝', '层剪枝 (浅层冗余)', '结构化稀疏 (2:4)'],
        impact: 'FLOPs ↓40%, 延迟 ↓30%',
        icon: '✂️',
        color: '#ffa657',
      },
      {
        name: '多模型调度',
        desc: '感知/预测/规划多模型在 Orin 上的并行调度',
        techniques: ['CUDA Stream 并行', 'GPU + DLA 异构调度', '优先级抢占 (安全优先)', '动态 batch 合并'],
        impact: 'GPU 利用率 ↑40%, 端到端延迟 <50ms',
        icon: '🔄',
        color: '#79c0ff',
      },
    ],
    latencyBudget: [
      { module: '图像预处理', target: '3ms', actual: '2.5ms', status: 'good', color: '#3fb950' },
      { module: 'BEV 编码器', target: '10ms', actual: '8.2ms', status: 'good', color: '#3fb950' },
      { module: 'VLA 推理', target: '15ms', actual: '14.1ms', status: 'good', color: '#3fb950' },
      { module: '世界模型预测', target: '8ms', actual: '7.8ms', status: 'good', color: '#3fb950' },
      { module: '轨迹规划', target: '5ms', actual: '4.2ms', status: 'good', color: '#3fb950' },
      { module: '安全校验', target: '3ms', actual: '2.1ms', status: 'good', color: '#3fb950' },
      { module: '控制输出', target: '2ms', actual: '1.5ms', status: 'good', color: '#3fb950' },
      { module: '端到端总计', target: '<50ms', actual: '40.4ms', status: 'good', color: '#6c5ce7' },
    ],
  },

  // 通信优化
  communicationOpt: [
    { name: 'NCCL AllReduce', desc: '梯度同步的标准通信原语', bandwidth: '~180 GB/s (IB HDR)', scenario: '数据并行梯度聚合', icon: '📡', color: '#326ce5' },
    { name: 'GDR (GPUDirect RDMA)', desc: 'GPU 直接通过 RDMA 通信，绕过 CPU', bandwidth: '~200 GB/s', scenario: '跨节点张量并行', icon: '🔗', color: '#76b900' },
    { name: '梯度压缩', desc: 'Top-K / 随机稀疏化 / 1-bit Adam', bandwidth: '压缩比 10-100×', scenario: '带宽受限场景', icon: '📦', color: '#ffa657' },
    { name: '计算-通信重叠', desc: '前向/反向计算与梯度通信流水线化', bandwidth: '隐藏 50-80% 通信', scenario: 'ZeRO-3 / FSDP', icon: '⏱️', color: '#fd79a8' },
    { name: 'NVLink / NVSwitch', desc: '节点内 GPU 高速互联', bandwidth: '900 GB/s (NVLink 4)', scenario: '节点内张量并行', icon: '🔌', color: '#d2a8ff' },
  ],

  // 框架选型决策矩阵
  decisionMatrix: [
    { scenario: 'VLA 预训练 (7B)', framework: 'DeepSpeed ZeRO-2', inference: 'N/A', precision: 'BF16', compile: 'torch.compile', reason: '成熟稳定，HuggingFace 集成好' },
    { scenario: 'VLA+WM 联合训练 (20B)', framework: 'DeepSpeed ZeRO-3', inference: 'N/A', precision: 'BF16 + FP8', compile: 'FlashAttention-3', reason: '显存需求大，需参数分片' },
    { scenario: '超大预训练 (>100B)', framework: 'Megatron-LM 3D', inference: 'N/A', precision: 'FP8', compile: 'Triton kernels', reason: '3D 并行吞吐量最高' },
    { scenario: '云端 VLM 推理 (标注)', framework: 'N/A', inference: 'vLLM / SGLang', precision: 'INT8 (W8A8)', compile: 'CUDA Graph', reason: '高并发批处理，PagedAttention' },
    { scenario: '车端实时推理 (Orin)', framework: 'N/A', inference: 'TensorRT', precision: 'INT8 + DLA', compile: 'TRT 图优化', reason: '延迟最低，Orin 深度优化' },
    { scenario: '快速原型验证', framework: 'FSDP', inference: 'ONNX Runtime', precision: 'FP16', compile: 'torch.compile', reason: 'PyTorch 原生，零额外依赖' },
  ],

  // 核心论文
  papers: [
    { paper: 'FlashAttention-3', venue: 'NeurIPS 2024', topic: '注意力优化', highlight: 'H100 异步流水线 + FP8，Attention 速度 2-4×' },
    { paper: 'DeepSpeed ZeRO++', venue: 'ICML 2024', topic: '通信优化', highlight: '量化权重通信 + 分层分片，通信量减少 4×' },
    { paper: 'vLLM (PagedAttention)', venue: 'SOSP 2023', topic: 'LLM 推理', highlight: 'OS 虚拟内存思想管理 KV Cache，吞吐量 24×' },
    { paper: 'SGLang (RadixAttention)', venue: 'ICML 2024', topic: 'LLM 推理', highlight: '前缀树共享 KV Cache，多轮对话加速 5×' },
    { paper: 'GPTQ', venue: 'ICLR 2023', topic: '模型量化', highlight: '一次性 INT4 量化，精度损失极小' },
    { paper: 'AWQ', venue: 'MLSys 2024', topic: '模型量化', highlight: '激活感知权重量化，保护显著通道' },
    { paper: 'Speculative Decoding', venue: 'ICML 2023', topic: '推理加速', highlight: '小模型草稿 + 大模型验证，无损加速 2-3×' },
    { paper: 'Triton', venue: 'MAPL 2019', topic: 'GPU 编程', highlight: 'Python 写 GPU kernel，性能接近手写 CUDA' },
  ],

  // 效果指标
  metrics: {
    training: {
      throughput: '128×A100 集群: ~45K tokens/s (VLA 7B, ZeRO-2)',
      gpuUtil: 'MFU (Model FLOPs Utilization): ~52%',
      costPerEpoch: '~$8,500 / epoch (AWS p4d.24xlarge)',
      iterationCycle: '数据→模型→部署: 72 小时',
    },
    inference: {
      cloudLatency: '云端 VLM 推理: ~120ms/请求 (vLLM, A100)',
      cloudThroughput: '云端批处理: ~500 请求/s (INT8)',
      edgeLatency: '车端端到端: <50ms (Orin, TensorRT INT8)',
      edgePower: '车端功耗: ~35W (Orin, 275 TOPS)',
    },
    optimization: {
      compileSpeedup: 'torch.compile: 训练 +22%, 推理 +38%',
      flashAttnSpeedup: 'FlashAttention-3: Attention 层 3.2× 加速',
      quantizationSaving: 'INT8 量化: 显存 ↓50%, 延迟 ↓45%',
      distillationResult: '蒸馏: 参数 ↓70%, NDS 仅降 0.8%',
    },
  },
};

// ═══════════════════════════════════════════════════════════════
// 计算引擎选型
// ═══════════════════════════════════════════════════════════════
export const COMPUTE_ENGINE_DATA = {
  title: '计算引擎选型',
  subtitle: '自动驾驶数据闭环中五大计算场景的引擎选型与对比',
  color: '#f39c12',

  // 五大引擎详情
  engines: [
    {
      name: 'Apache Spark',
      icon: '⚡',
      color: '#e25a1c',
      version: '3.5+',
      tagline: '批处理 & 特征工程主力',
      scenarios: ['大规模 ETL（50TB/天原始数据清洗）', '多模态特征工程（BEV 特征批量计算）', 'SQL 分析（Iceberg 表查询）', '数据质量检测（Great Expectations 集成）'],
      strengths: ['生态最成熟，SQL/DataFrame/ML 统一 API', 'Iceberg/Delta Lake 原生支持', 'RAPIDS 加速（GPU Spark）', 'K8s 原生部署（Spark on K8s）'],
      weaknesses: ['启动延迟高（~30s）', '小文件问题需调优', '实时流处理不如 Flink'],
      perf: { throughput: '~2 TB/h（A100 节点）', latency: '分钟级', scale: '50~500 节点' },
      usedFor: ['数据清洗', '特征工程', 'SQL 分析', '数据质量'],
      k8sIntegration: 'Spark Operator + Dynamic Allocation',
    },
    {
      name: 'Ray',
      icon: '☀️',
      color: '#028cf3',
      version: '2.x',
      tagline: '分布式 ML 计算统一框架',
      scenarios: ['分布式模型训练（Ray Train + DeepSpeed）', '超参搜索（Ray Tune，数百并发实验）', '批量推理（Ray Serve，自动标注流水线）', '数据处理（Ray Data，与 Spark 互补）'],
      strengths: ['Python 原生，ML 工程师友好', '训练/推理/数据处理统一框架', 'Actor 模型支持复杂有状态任务', 'KubeRay 原生 K8s 集成'],
      weaknesses: ['SQL 能力弱于 Spark', '大规模 ETL 不如 Spark', '社区相对较小'],
      perf: { throughput: '~500 实验/天（Tune）', latency: '秒级', scale: '10~200 节点' },
      usedFor: ['分布式训练', '超参搜索', '批量推理', '主动学习'],
      k8sIntegration: 'KubeRay Operator',
    },
    {
      name: 'Apache Flink',
      icon: '🌊',
      color: '#e6526f',
      version: '1.19+',
      tagline: '实时流处理引擎',
      scenarios: ['车端数据实时接入（Kafka → Flink → Iceberg）', '实时特征计算（在线特征仓库更新）', '模型监控指标实时聚合', '接管事件实时触发回采流水线'],
      strengths: ['毫秒级延迟，Exactly-Once 语义', 'Kafka 深度集成', '流批统一（Flink SQL）', 'Iceberg Streaming Write 支持'],
      weaknesses: ['运维复杂度高', '批处理性能不如 Spark', '学习曲线陡'],
      perf: { throughput: '~10 GB/s（峰值）', latency: '< 100ms', scale: '10~100 节点' },
      usedFor: ['实时接入', '流式特征', '监控聚合', '事件触发'],
      k8sIntegration: 'Flink Kubernetes Operator',
    },
    {
      name: 'Trino',
      icon: '🔍',
      color: '#dd00a1',
      version: '435+',
      tagline: '跨湖联邦查询引擎',
      scenarios: ['跨 Catalog 联邦查询（Unity Catalog 统一入口）', '数据探索与 Ad-hoc 分析', '数据质量巡检（跨表 JOIN）', '训练数据集采样与统计'],
      strengths: ['跨数据源联邦查询（Iceberg/Hive/S3/MySQL）', '交互式查询延迟低（秒级）', 'Unity Catalog REST Catalog 集成', '无需数据移动'],
      weaknesses: ['不适合大规模 ETL', '无状态，不支持流处理', '写入能力有限'],
      perf: { throughput: '~100 GB/查询', latency: '秒级（交互式）', scale: '10~50 节点' },
      usedFor: ['联邦查询', '数据探索', '质量巡检', '采样统计'],
      k8sIntegration: 'Helm Chart 部署',
    },
    {
      name: 'RAPIDS cuDF/cuML',
      icon: '🚀',
      color: '#76b900',
      version: '24.x',
      tagline: 'GPU 加速数据处理',
      scenarios: ['GPU 加速 Spark（Spark-RAPIDS 插件）', '点云数据预处理（cuDF 替代 Pandas）', '大规模特征归一化/标准化', '图像批量解码与增强（cuCIM）'],
      strengths: ['GPU 加速 10-100× 提升（vs CPU）', 'Pandas/Spark API 兼容，零代码改动', 'cuML 替代 scikit-learn', 'NVIDIA Orin 车端同架构'],
      weaknesses: ['依赖 NVIDIA GPU', '内存受限于显存', '部分算子 CPU fallback'],
      perf: { throughput: 'Spark ETL 加速 5-20×', latency: '毫秒级（单批）', scale: 'GPU 节点' },
      usedFor: ['GPU 加速 ETL', '点云处理', '特征计算', '图像处理'],
      k8sIntegration: 'NVIDIA GPU Operator + Spark-RAPIDS',
    },
  ],

  // 场景选型矩阵
  selectionMatrix: {
    title: '场景 × 引擎选型矩阵',
    scenarios: [
      { scene: '大规模批量 ETL（TB 级）',      spark: '✅ 首选', ray: '⚠️ 可用', flink: '❌ 不适合', trino: '❌ 不适合', rapids: '✅ 加速' },
      { scene: '实时流处理（毫秒级）',          spark: '⚠️ Structured Streaming', ray: '❌ 不适合', flink: '✅ 首选', trino: '❌ 不适合', rapids: '❌ 不适合' },
      { scene: '分布式模型训练',               spark: '❌ 不适合', ray: '✅ 首选', flink: '❌ 不适合', trino: '❌ 不适合', rapids: '⚠️ 辅助' },
      { scene: '超参搜索 / 批量推理',          spark: '❌ 不适合', ray: '✅ 首选', flink: '❌ 不适合', trino: '❌ 不适合', rapids: '❌ 不适合' },
      { scene: '交互式 SQL 分析',              spark: '⚠️ 可用', ray: '❌ 不适合', flink: '❌ 不适合', trino: '✅ 首选', rapids: '❌ 不适合' },
      { scene: '跨数据源联邦查询',             spark: '⚠️ 可用', ray: '❌ 不适合', flink: '❌ 不适合', trino: '✅ 首选', rapids: '❌ 不适合' },
      { scene: '点云/图像 GPU 批处理',         spark: '⚠️ 需插件', ray: '⚠️ 可用', flink: '❌ 不适合', trino: '❌ 不适合', rapids: '✅ 首选' },
      { scene: '特征工程（离线）',             spark: '✅ 首选', ray: '⚠️ 可用', flink: '❌ 不适合', trino: '⚠️ 可用', rapids: '✅ 加速' },
      { scene: '特征工程（在线/实时）',        spark: '❌ 不适合', ray: '⚠️ 可用', flink: '✅ 首选', trino: '❌ 不适合', rapids: '❌ 不适合' },
      { scene: '数据质量检测',                 spark: '✅ 首选', ray: '⚠️ 可用', flink: '⚠️ 可用', trino: '✅ 可用', rapids: '❌ 不适合' },
    ],
  },

  // 在闭环各阶段的分工
  stageMapping: [
    { stage: '数据采集 & 上传', engines: ['Flink'], desc: 'Kafka → Flink → Iceberg Landing Zone 实时写入' },
    { stage: '数据处理 & 清洗', engines: ['Spark', 'RAPIDS'], desc: 'Spark + RAPIDS 批量解码、清洗、时间戳对齐' },
    { stage: '多模态融合 & 标注', engines: ['Ray', 'RAPIDS'], desc: 'Ray Serve 驱动 BEVFusion/SAM2 批量推理，RAPIDS 加速点云处理' },
    { stage: '场景挖掘', engines: ['Spark', 'Ray'], desc: 'Spark 计算 CLIP 嵌入，Ray 驱动主动学习循环' },
    { stage: '特征工程', engines: ['Spark', 'Flink', 'RAPIDS'], desc: '离线 Spark + RAPIDS，在线 Flink 实时特征更新' },
    { stage: '模型训练', engines: ['Ray'], desc: 'Ray Train + DeepSpeed ZeRO-3 分布式训练' },
    { stage: '数据分析 & 质检', engines: ['Trino', 'Spark'], desc: 'Trino 跨 Catalog 联邦查询，Spark 批量质量检测' },
    { stage: '监控 & 回采触发', engines: ['Flink'], desc: 'Flink 实时聚合接管率/碰撞率，触发回采 Pipeline' },
  ],

  // 技术选型决策
  decisions: [
    { question: '为什么不用 Dask 替代 Spark？', answer: 'Dask 在 TB 级数据上稳定性不如 Spark，且 Iceberg 集成不成熟；Spark 生态更完整，RAPIDS 加速后性能差距缩小。' },
    { question: '为什么同时用 Spark 和 Ray？', answer: '两者互补：Spark 擅长 SQL/ETL/大规模批处理；Ray 擅长 ML 工作流/Actor 模型/Python 生态。通过 Ray on Spark 可以互相调用。' },
    { question: '为什么不用 Spark Streaming 替代 Flink？', answer: 'Spark Structured Streaming 微批延迟 ~1s，Flink 原生流处理延迟 <100ms；接管事件触发回采对延迟敏感，选 Flink。' },
    { question: 'RAPIDS 如何与 Spark 集成？', answer: 'Spark-RAPIDS 插件零代码改动，自动将 Spark SQL 算子替换为 GPU 实现，ETL 加速 5-20×，点云处理加速 50×+。' },
    { question: 'Trino 和 Spark SQL 如何选择？', answer: 'Trino 适合交互式查询（秒级响应）和跨数据源联邦；Spark SQL 适合大规模 ETL 和复杂转换。两者通过 Unity Catalog 共享元数据。' },
  ],
};

// ═══════════════════════════════════════════════════════════════
// Unity Catalog — 统一元数据治理（AI Infra 技术栈 Tab）
// ═══════════════════════════════════════════════════════════════
export const UNITY_CATALOG_INFRA_DATA = {
  title: 'Unity Catalog — 统一元数据治理层',
  subtitle: '覆盖模型注册 · 数据集管理 · 数据模型血缘，作为整个 AI Infra 的元数据底座',
  color: '#e84393',
  repo: 'https://github.com/unitycatalog/unitycatalog',
  version: 'v0.3+ · 开源 · K8s 自托管',

  // 三大核心能力
  coreCaps: [
    {
      title: '模型注册',
      icon: '🧠',
      color: '#3fb950',
      desc: '统一管理模型全生命周期，与 MLflow 深度集成',
      points: [
        'Staging → Candidate → Production → Archived 四阶段流转',
        '模型权重以 Volume 形式存储，统一命名空间引用',
        '每个版本绑定训练数据集、超参、评测指标',
        'RBAC 细粒度权限：研究员只读，CI/CD Bot 可写',
        '与 MLflow Model Registry 双向同步，无缝迁移',
      ],
      catalog: 'model_registry.models.*',
      tags: ['MLflow 集成', '版本管理', '权重 Volume', 'RBAC'],
    },
    {
      title: '数据集管理',
      icon: '📦',
      color: '#00cec9',
      desc: '结构化表（Iceberg）与非结构化文件（Volume）统一纳管',
      points: [
        '原始传感器数据：camera / lidar / radar Volume 统一目录',
        '标注数据集：bbox_3d / seg_masks / language_qa Iceberg 表',
        'BEV 特征集：bev_tensors / scene_embeddings 预计算存储',
        '数据集版本快照，支持 Git-like 分支与回滚（LakeFS 集成）',
        '数据集统计：覆盖率 / 分布 / 质量分数自动计算',
      ],
      catalog: 'raw_data.* / processed_data.*',
      tags: ['Volume 管理', 'Iceberg 表', '版本快照', '质量统计'],
    },
    {
      title: '数据模型血缘',
      icon: '🔗',
      color: '#e84393',
      desc: '列级血缘追踪，从原始传感器帧到最终模型权重全链路可溯',
      points: [
        '列级（Column-level）血缘：追踪到具体字段的来源与转换',
        '影响分析：修改上游表时，自动识别所有下游依赖',
        '根因定位：模型指标下降时，快速定位到具体数据批次',
        '合规审计：GDPR 删除请求自动追踪所有衍生数据',
        'Spark / Airflow / dbt 操作自动上报血缘，零侵入',
      ],
      catalog: 'governance.audit.*',
      tags: ['列级血缘', '影响分析', '根因定位', 'GDPR 合规'],
    },
  ],

  // 三层命名空间（精简版）
  namespaceOverview: [
    { catalog: 'raw_data',        icon: '🚗', color: '#6c5ce7', desc: '原始传感器数据', schemas: ['camera', 'lidar', 'radar', 'vehicle'] },
    { catalog: 'processed_data',  icon: '⚙️', color: '#00cec9', desc: '清洗标注结构化数据', schemas: ['annotations', 'bev_features', 'scenes'] },
    { catalog: 'feature_store',   icon: '🍽️', color: '#fd79a8', desc: '预计算特征', schemas: ['online', 'offline', 'stats'] },
    { catalog: 'model_registry',  icon: '🧠', color: '#3fb950', desc: '模型版本与实验', schemas: ['experiments', 'models', 'evaluations'] },
    { catalog: 'governance',      icon: '🔐', color: '#ffa657', desc: '数据治理与合规', schemas: ['audit', 'privacy', 'quality'] },
  ],

  // 血缘链路
  lineageChain: [
    { from: 'raw_data.camera.frames_volume', to: 'processed_data.bev_features.bev_tensors', op: 'BEVFusion 推理', color: '#6c5ce7' },
    { from: 'processed_data.bev_features.bev_tensors', to: 'feature_store.offline.scene_feat_v2', op: 'Spark 特征工程', color: '#00cec9' },
    { from: 'feature_store.offline.scene_feat_v2', to: 'model_registry.experiments.runs', op: 'PyTorch 训练', color: '#3fb950' },
    { from: 'model_registry.experiments.runs', to: 'model_registry.models.vla_v2', op: 'MLflow 注册', color: '#3fb950' },
    { from: 'model_registry.models.vla_v2', to: 'model_registry.evaluations.eval_results', op: 'NAVSIM 评测', color: '#ffa657' },
  ],

  // 与 MLflow 对比
  vsMLflow: [
    { aspect: '模型存储',     mlflow: 'Artifact Store（独立）',       uc: 'model_registry.models.weights_volume（统一命名）', winner: 'uc' },
    { aspect: '数据集管理',   mlflow: '不支持',                        uc: 'raw_data / processed_data Catalog 全覆盖', winner: 'uc' },
    { aspect: '血缘追踪',     mlflow: '仅实验内部',                    uc: '跨系统列级血缘（数据→特征→模型→部署）', winner: 'uc' },
    { aspect: '权限控制',     mlflow: '无细粒度权限',                  uc: 'RBAC 到 Schema/Table/Volume 级别', winner: 'uc' },
    { aspect: '非结构化数据', mlflow: '仅 Artifact',                   uc: 'Volume 统一管理权重/点云/视频', winner: 'uc' },
    { aspect: '实验管理',     mlflow: '完整（Run/Metric/Param）',      uc: '通过 MLflow 集成，不替代', winner: 'mlflow' },
  ],

  // 集成工具
  integrations: [
    { tool: 'MLflow',     role: '实验/模型注册同步到 model_registry', icon: '🧪', color: '#3fb950' },
    { tool: 'Spark',      role: '读写 Iceberg 表，自动注册血缘',       icon: '⚡', color: '#ffa657' },
    { tool: 'Airflow',    role: 'DAG 任务自动上报血缘',                icon: '🌊', color: '#00cec9' },
    { tool: 'dbt',        role: 'SQL 转换血缘自动解析',                icon: '🔨', color: '#6c5ce7' },
    { tool: 'Feast',      role: '特征定义同步到 feature_store',        icon: '🍽️', color: '#fd79a8' },
    { tool: 'LakeFS',     role: '数据版本与 UC 版本对齐',              icon: '🏷️', color: '#79c0ff' },
    { tool: 'Trino',      role: '跨 Catalog 联邦查询',                 icon: '🔍', color: '#e17055' },
    { tool: 'Great Expectations', role: 'DQ 结果写入 governance.quality', icon: '✅', color: '#a29bfe' },
  ],
};