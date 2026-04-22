// ────────────────────────────────────────────────────────────────
// 自动驾驶数据闭环架构 — 数据定义
// 基于云厂商（AWS/阿里云/腾讯云）+ 全容器化设计
// ────────────────────────────────────────────────────────────────

// ═══════════════════════════════════════════════════════════════
// 1. 闭环总览
// ═══════════════════════════════════════════════════════════════
export const LOOP_OVERVIEW = {
  title: '自动驾驶数据闭环',
  subtitle: '从车端采集到云端训练，再到车端部署的全链路闭环',
  stages: [
    { id: 'collect',     label: '数据采集',   icon: '🚗', color: '#6c5ce7', desc: '车端多传感器实时采集' },
    { id: 'upload',      label: '数据上传',   icon: '📡', color: '#00cec9', desc: '边缘预处理 + 增量上传' },
    { id: 'process',     label: '数据处理',   icon: '⚙️', color: '#fd79a8', desc: '清洗 · 标注 · 质检 · 挖掘' },
    { id: 'multimodal',  label: '多模态融合', icon: '🔀', color: '#a29bfe', desc: 'BEV融合 · 时序对齐 · 跨模态标注' },
    { id: 'sceneMine',   label: '场景挖掘',   icon: '⛏️', color: '#e17055', desc: '长尾挖掘 · 困难样本 · 主动学习' },
    { id: 'store',       label: '数据存储',   icon: '🗄️', color: '#ffa657', desc: '数据湖 + Unity Catalog 元数据 + 特征仓库' },
    { id: 'train',       label: '模型训练',   icon: '🧠', color: '#3fb950', desc: 'VLA + 世界模型分布式训练' },
    { id: 'deploy',      label: '模型部署',   icon: '🚀', color: '#79c0ff', desc: '车端推理 + OTA 灰度发布' },
    { id: 'monitor',     label: '效果监控',   icon: '📊', color: '#d2a8ff', desc: '在线指标 + 触发回采策略' },
  ],
};

// ═══════════════════════════════════════════════════════════════
// 2. 数据采集层
// ═══════════════════════════════════════════════════════════════
export const COLLECT_LAYER = {
  title: '🚗 数据采集层（车端）',
  desc: '车载计算平台实时采集多传感器数据，边缘端完成初步筛选和压缩',
  sensors: [
    { name: '环视相机 ×6', spec: '1920×1080 @20Hz, H.265', bandwidth: '~180 MB/s', icon: '📷', color: '#6c5ce7' },
    { name: 'LiDAR ×1',    spec: '128线, 150m, @10Hz',     bandwidth: '~30 MB/s',  icon: '🟢', color: '#3fb950' },
    { name: '毫米波雷达 ×5', spec: '4D, 300m, @13Hz',       bandwidth: '~2 MB/s',   icon: '📡', color: '#ffa657' },
    { name: 'GNSS/IMU',     spec: 'RTK, 100Hz',             bandwidth: '~0.1 MB/s', icon: '🛰️', color: '#00cec9' },
    { name: 'CAN Bus',      spec: '车辆状态, 100Hz',         bandwidth: '~0.05 MB/s', icon: '🔌', color: '#fd79a8' },
  ],
  edgeCompute: {
    platform: 'NVIDIA Orin / TDA4',
    os: 'Linux + ROS2 Humble',
    container: 'k3s + containerd',
    tasks: [
      { name: '数据录制', desc: 'ROS2 bag → MCAP 格式，按场景自动分段', tech: 'mcap-ros2-recorder' },
      { name: '边缘触发', desc: '急刹/碰撞/接管/异常检测 → 标记高价值片段', tech: 'TensorRT + ONNX' },
      { name: '数据压缩', desc: '图像 H.265 编码，点云 Draco 压缩，压缩比 5:1', tech: 'FFmpeg + Draco' },
      { name: '隐私脱敏', desc: '人脸/车牌实时模糊，GDPR 合规', tech: 'YOLOv8-nano + OpenCV' },
    ],
    dailyData: '~2 TB/车/天（压缩后 ~400 GB）',
  },
  triggerStrategies: [
    { name: '全量录制', desc: '所有传感器连续录制，用于基线数据积累', priority: 'low', storage: '~2TB/天' },
    { name: '事件触发', desc: '急刹 · 接管 · AEB · 碰撞 · 异常检测', priority: 'critical', storage: '~50GB/天' },
    { name: '场景触发', desc: '十字路口 · 施工区 · 恶劣天气 · 夜间', priority: 'high', storage: '~200GB/天' },
    { name: '模型触发', desc: '模型不确定性 > 阈值 · 预测与实际偏差大', priority: 'high', storage: '~100GB/天' },
    { name: '随机采样', desc: '按时间/里程均匀采样，保证数据多样性', priority: 'medium', storage: '~80GB/天' },
  ],
};

// ═══════════════════════════════════════════════════════════════
// 3. 数据上传层
// ═══════════════════════════════════════════════════════════════
export const UPLOAD_LAYER = {
  title: '📡 数据上传层（车→云）',
  desc: '多通道智能上传，支持断点续传和优先级调度',
  channels: [
    { name: '5G/4G 蜂窝', bandwidth: '50-300 Mbps', cost: '高', scenario: '实时/高优先级数据', icon: '📶' },
    { name: 'Wi-Fi 6E',   bandwidth: '1-2 Gbps',    cost: '低', scenario: '停车场/充电站批量上传', icon: '📡' },
    { name: '有线以太网',  bandwidth: '10 Gbps',      cost: '极低', scenario: '维保站/数据中心直连', icon: '🔌' },
  ],
  uploadPipeline: [
    { step: 1, name: '优先级排序', desc: '事件触发 > 模型触发 > 场景触发 > 随机采样 > 全量', icon: '📋' },
    { step: 2, name: '增量同步',   desc: 'rsync + 分块哈希，仅上传变化部分', icon: '🔄' },
    { step: 3, name: '断点续传',   desc: 'S3 Multipart Upload，每块 64MB，失败自动重试', icon: '⏸️' },
    { step: 4, name: '带宽调度',   desc: '根据网络质量动态切换通道，避免影响车端推理', icon: '📊' },
    { step: 5, name: '完整性校验', desc: 'SHA-256 校验 + 元数据一致性验证', icon: '✅' },
  ],
  infra: {
    gateway: 'Kong API Gateway (K8s Ingress)',
    queue: 'Apache Kafka (3 Broker, 分区按车辆ID)',
    storage: 'S3 / COS Landing Zone (生命周期: 7天)',
    container: 'Kubernetes + Istio Service Mesh',
  },
};

// ═══════════════════════════════════════════════════════════════
// 4. 数据处理层
// ═══════════════════════════════════════════════════════════════
export const PROCESS_LAYER = {
  title: '⚙️ 数据处理层（云端）',
  desc: '全容器化的数据处理流水线，从原始数据到训练就绪数据',
  pipeline: [
    {
      id: 'ingest',
      name: '① 数据接入',
      desc: 'Landing Zone → 格式校验 → 元数据注册',
      tech: ['Kafka Consumer', 'Apache Avro', 'Hive Metastore'],
      container: 'data-ingest:v2.3',
      cpu: '4 core', mem: '8 GB', replicas: 10,
      color: '#6c5ce7',
    },
    {
      id: 'decode',
      name: '② 解码解压',
      desc: 'MCAP → 按传感器拆分 → 时间戳对齐 → 坐标系统一',
      tech: ['mcap-cli', 'FFmpeg', 'Draco', 'tf2_ros'],
      container: 'data-decode:v1.8',
      cpu: '8 core', mem: '16 GB', gpu: 'T4 ×1', replicas: 20,
      color: '#00cec9',
    },
    {
      id: 'clean',
      name: '③ 数据清洗',
      desc: '去重 · 去噪 · 异常帧剔除 · 传感器故障检测',
      tech: ['PySpark', 'Dask', 'OpenCV'],
      container: 'data-clean:v3.1',
      cpu: '8 core', mem: '32 GB', replicas: 15,
      color: '#fd79a8',
    },
    {
      id: 'annotate',
      name: '④ 自动标注',
      desc: '3D 检测 · 语义分割 · 车道线 · 可行驶区域 · 语言描述',
      tech: ['BEVFusion', 'InternVL', 'SAM2', 'MapTR'],
      container: 'auto-label:v4.2',
      cpu: '16 core', mem: '64 GB', gpu: 'A100 ×2', replicas: 8,
      color: '#ffa657',
    },
    {
      id: 'qa',
      name: '⑤ 质量检测',
      desc: '标注一致性 · 覆盖率 · 分布偏差 · 人工抽检',
      tech: ['Label Studio', 'Great Expectations', 'Evidently AI'],
      container: 'data-qa:v2.0',
      cpu: '4 core', mem: '16 GB', replicas: 5,
      color: '#3fb950',
    },
    {
      id: 'mine',
      name: '⑥ 数据挖掘',
      desc: '长尾场景挖掘 · 困难样本发现 · 数据平衡采样',
      tech: ['CLIP Embedding', 'FAISS', 'Active Learning'],
      container: 'data-mine:v1.5',
      cpu: '8 core', mem: '32 GB', gpu: 'T4 ×1', replicas: 6,
      color: '#79c0ff',
    },
  ],
  orchestration: {
    engine: 'Apache Airflow (KubernetesExecutor)',
    scheduler: 'Argo Workflows (DAG 编排)',
    monitor: 'Prometheus + Grafana',
    log: 'ELK Stack (Elasticsearch + Logstash + Kibana)',
  },
};

// ═══════════════════════════════════════════════════════════════
// 5. 数据存储层
// ═══════════════════════════════════════════════════════════════
export const STORE_LAYER = {
  title: '🗄️ 数据存储层（数据湖）',
  desc: '分层存储 + 数据版本管理 + 特征仓库',
  tiers: [
    {
      name: '热存储',
      tech: 'NVMe SSD (Ceph / JuiceFS)',
      data: '最近 7 天 + 当前训练集',
      latency: '<1ms',
      cost: '$$$$',
      color: '#ff7b72',
      icon: '🔥',
    },
    {
      name: '温存储',
      tech: 'S3 Standard / COS 标准',
      data: '最近 90 天 + 标注数据',
      latency: '~10ms',
      cost: '$$$',
      color: '#ffa657',
      icon: '🌡️',
    },
    {
      name: '冷存储',
      tech: 'S3 Glacier / COS 归档',
      data: '历史全量原始数据',
      latency: '分钟~小时',
      cost: '$',
      color: '#79c0ff',
      icon: '❄️',
    },
  ],
  dataLake: {
    format: 'Apache Iceberg (表格式) + Parquet (列存)',
    catalog: 'Unity Catalog (统一元数据管理)',
    query: 'Trino / Spark SQL',
    version: 'LakeFS (Git-like 数据版本管理)',
    lineage: 'Unity Catalog 内置血缘追踪',
  },
  featureStore: {
    engine: 'Feast / Tecton',
    features: [
      { name: 'BEV 特征', dim: '256×200×200', format: 'FP16 Tensor', source: 'BEVFusion 输出' },
      { name: '语言嵌入', dim: '4096', format: 'FP16 Vector', source: 'InternLM2 编码' },
      { name: '轨迹特征', dim: '6×12×2', format: 'FP32 Array', source: '6个Agent×12步×(x,y)' },
      { name: '地图特征', dim: '128×256', format: 'FP16 Tensor', source: 'MapTR 编码' },
    ],
  },
  scale: {
    totalVolume: '~500 PB',
    dailyIngestion: '~50 TB/天 (1000辆车)',
    annotatedData: '~20 PB',
    trainReady: '~5 PB',
  },
};

// ═══════════════════════════════════════════════════════════════
// 6. 模型训练层
// ═══════════════════════════════════════════════════════════════
export const TRAIN_LAYER = {
  title: '🧠 模型训练层',
  desc: 'VLA + 世界模型分布式训练，支持多任务联合优化',
  cluster: {
    gpu: 'NVIDIA A100 80GB × 128 (16 节点 × 8 卡)',
    interconnect: 'InfiniBand HDR 200Gbps',
    storage: 'Lustre / GPFS 并行文件系统',
    container: 'NVIDIA NGC + Kubernetes + Volcano (GPU 调度)',
    framework: 'PyTorch 2.x + DeepSpeed ZeRO-3 + FlashAttention',
  },
  trainPipeline: [
    { stage: 'Stage 1', name: '视觉-语言预训练', data: 'OpenDV-2K + nuScenes', steps: '100K', gpu: '64×A100', time: '~3天' },
    { stage: 'Stage 2', name: 'VLA+WM 联合训练', data: 'nuScenes + DriveLM', steps: '150K', gpu: '128×A100', time: '~5天' },
    { stage: 'Stage 3', name: '世界模型 RL 微调', data: 'NAVSIM 闭环', steps: '100K', gpu: '32×A100', time: '~2天' },
  ],
  mlops: {
    experiment: 'MLflow / Weights & Biases',
    registry: 'MLflow Model Registry',
    ci: 'GitHub Actions + DVC (数据版本)',
    validation: '自动化评测: L2 / FVD / 碰撞率 / PDMS',
  },
};

// ═══════════════════════════════════════════════════════════════
// 7. 模型部署层
// ═══════════════════════════════════════════════════════════════
export const DEPLOY_LAYER = {
  title: '🚀 模型部署层（云→车）',
  desc: 'OTA 灰度发布 + 车端推理优化 + A/B 测试',
  pipeline: [
    { step: 1, name: '模型优化', desc: 'INT8 量化 + 知识蒸馏 + 结构剪枝', tech: 'TensorRT + ONNX', icon: '🔧' },
    { step: 2, name: '仿真验证', desc: 'CARLA/LGSVL 闭环测试 > 10万场景', tech: 'CARLA 0.9.15 + K8s', icon: '🎮' },
    { step: 3, name: '影子模式', desc: '新模型并行运行，不控车，对比输出', tech: 'ROS2 + Docker', icon: '👤' },
    { step: 4, name: '灰度发布', desc: '1% → 5% → 20% → 100% 逐步放量', tech: 'OTA + Feature Flag', icon: '🚦' },
    { step: 5, name: '在线监控', desc: '推理延迟 · 接管率 · 碰撞率 · 用户反馈', tech: 'Prometheus + PagerDuty', icon: '📊' },
  ],
  edgeInference: {
    platform: 'NVIDIA Orin (275 TOPS)',
    runtime: 'TensorRT 8.x + CUDA 12',
    latency: '<50ms (端到端)',
    power: '<45W',
    container: 'k3s + NVIDIA Container Toolkit',
  },
};

// ═══════════════════════════════════════════════════════════════
// 8. 效果监控 & 回采触发层
// ═══════════════════════════════════════════════════════════════
export const MONITOR_LAYER = {
  title: '📊 效果监控 & 回采触发',
  desc: '在线指标监控 + 智能回采策略，驱动数据飞轮持续转动',
  metrics: [
    { name: '接管率', unit: '次/千公里', threshold: '<0.5', current: '0.32', status: 'good', icon: '🖐️' },
    { name: '碰撞率', unit: '次/百万公里', threshold: '<1.0', current: '0.15', status: 'good', icon: '💥' },
    { name: '规划偏差', unit: 'L2 (m)', threshold: '<0.5', current: '0.42', status: 'good', icon: '📐' },
    { name: '推理延迟', unit: 'ms (P99)', threshold: '<50', current: '38', status: 'good', icon: '⏱️' },
    { name: '乘客舒适度', unit: '评分 (1-5)', threshold: '>4.0', current: '4.3', status: 'good', icon: '😊' },
    { name: '长尾覆盖率', unit: '%', threshold: '>80', current: '72', status: 'warn', icon: '🎯' },
  ],
  recallTriggers: [
    { name: '接管事件', desc: '驾驶员主动接管 → 回采前后 30s 数据', priority: 'critical', color: '#ff7b72' },
    { name: '模型不确定性', desc: '预测置信度 < 0.6 → 回采当前场景', priority: 'high', color: '#ffa657' },
    { name: '分布偏移', desc: '输入特征分布偏离训练集 > 2σ', priority: 'high', color: '#ffa657' },
    { name: '新场景发现', desc: 'CLIP 嵌入与已知场景距离 > 阈值', priority: 'medium', color: '#79c0ff' },
    { name: '性能退化', desc: '滑动窗口指标连续 3 天下降', priority: 'high', color: '#ffa657' },
    { name: '定期巡检', desc: '每周随机采样 1% 数据做全量评估', priority: 'low', color: '#3fb950' },
  ],
};

// ═══════════════════════════════════════════════════════════════
// 9. 基础设施总览
// ═══════════════════════════════════════════════════════════════
export const INFRA_OVERVIEW = {
  title: '☁️ 基础设施（全容器化）',
  desc: '基于 Kubernetes 的全容器化架构，支持多云部署',
  layers: [
    {
      name: '容器编排',
      components: [
        { name: 'Kubernetes 1.28+', role: '容器编排', icon: '☸️' },
        { name: 'Istio', role: '服务网格', icon: '🕸️' },
        { name: 'Argo CD', role: 'GitOps 部署', icon: '🔄' },
        { name: 'Volcano', role: 'GPU 批调度', icon: '🌋' },
      ],
      color: '#6c5ce7',
    },
    {
      name: '数据基础设施',
      components: [
        { name: 'Apache Kafka', role: '消息队列', icon: '📨' },
        { name: 'Apache Airflow', role: '工作流编排', icon: '🌊' },
        { name: 'Apache Iceberg', role: '数据湖表格式', icon: '🧊' },
        { name: 'Unity Catalog', role: '统一元数据管理', icon: '🗂️' },
        { name: 'LakeFS', role: '数据版本管理', icon: '🏷️' },
      ],
      color: '#00cec9',
    },
    {
      name: '存储 & 计算',
      components: [
        { name: 'S3 / COS', role: '对象存储', icon: '🪣' },
        { name: 'JuiceFS', role: 'POSIX 文件系统', icon: '📁' },
        { name: 'Trino', role: '联邦查询', icon: '🔍' },
        { name: 'Spark', role: '分布式计算', icon: '⚡' },
      ],
      color: '#fd79a8',
    },
    {
      name: '可观测性',
      components: [
        { name: 'Prometheus', role: '指标采集', icon: '📈' },
        { name: 'Grafana', role: '可视化仪表盘', icon: '📊' },
        { name: 'ELK Stack', role: '日志分析', icon: '📝' },
        { name: 'Jaeger', role: '分布式追踪', icon: '🔗' },
      ],
      color: '#ffa657',
    },
    {
      name: 'MLOps',
      components: [
        { name: 'MLflow', role: '实验管理', icon: '🧪' },
        { name: 'DVC', role: '数据版本', icon: '📦' },
        { name: 'Feast', role: '特征仓库', icon: '🍽️' },
        { name: 'Seldon', role: '模型服务', icon: '🤖' },
      ],
      color: '#3fb950',
    },
  ],
  cloudProviders: [
    { name: 'AWS', services: 'EKS + S3 + SageMaker + Glacier', icon: '☁️' },
    { name: '腾讯云', services: 'TKE + COS + TI Platform + 归档存储', icon: '☁️' },
    { name: '阿里云', services: 'ACK + OSS + PAI + 冷归档', icon: '☁️' },
  ],
};

// ═══════════════════════════════════════════════════════════════
// 10. 数据流量统计
// ═══════════════════════════════════════════════════════════════
export const DATA_FLOW_STATS = {
  fleet: {
    totalVehicles: 1000,
    activeVehicles: 850,
    dailyMileage: '~50,000 km',
  },
  daily: {
    rawData: '~50 TB',
    afterCompress: '~10 TB',
    uploaded: '~8 TB',
    afterClean: '~6 TB',
    annotated: '~4 TB',
    trainReady: '~2 TB',
  },
  cumulative: {
    totalRaw: '~500 PB',
    totalAnnotated: '~20 PB',
    totalScenes: '~50M',
    totalMileage: '~18M km',
  },
};

// ═══════════════════════════════════════════════════════════════
// 11. Unity Catalog 元数据管理层（新增）
// ═══════════════════════════════════════════════════════════════
export const UNITY_CATALOG_LAYER = {
  title: '🗂️ Unity Catalog 元数据管理',
  desc: 'Databricks 开源统一元数据层，三层命名空间 + 细粒度权限 + 全链路血缘，覆盖数据 / 特征 / 模型',

  // 三层命名空间设计
  namespace: {
    title: '三层命名空间（Catalog → Schema → Table/Volume）',
    catalogs: [
      {
        name: 'raw_data',
        icon: '🚗',
        color: '#6c5ce7',
        desc: '原始传感器数据目录',
        schemas: [
          { name: 'camera',  tables: ['frames_v1', 'frames_v2', 'calibration'], desc: '环视相机帧序列' },
          { name: 'lidar',   tables: ['pointcloud_v1', 'pointcloud_v2', 'hdmap'], desc: '激光雷达点云' },
          { name: 'radar',   tables: ['radar_4d_v1', 'radar_tracks'], desc: '4D 毫米波雷达' },
          { name: 'vehicle', tables: ['can_bus', 'gnss_imu', 'trigger_events'], desc: '车辆状态与触发事件' },
        ],
      },
      {
        name: 'processed_data',
        icon: '⚙️',
        color: '#00cec9',
        desc: '清洗标注后的结构化数据',
        schemas: [
          { name: 'annotations', tables: ['bbox_3d', 'seg_masks', 'lane_lines', 'language_qa'], desc: '多模态标注结果' },
          { name: 'bev_features', tables: ['bev_tensors', 'temporal_seq', 'scene_embeddings'], desc: 'BEV 融合特征' },
          { name: 'scenes',      tables: ['scene_index', 'scene_tags', 'scene_splits'], desc: '场景索引与划分' },
        ],
      },
      {
        name: 'feature_store',
        icon: '🍽️',
        color: '#fd79a8',
        desc: '预计算特征，供训练直接消费',
        schemas: [
          { name: 'online',  tables: ['bev_feat_fp16', 'lang_embed_fp16', 'traj_feat_fp32'], desc: '在线特征（低延迟）' },
          { name: 'offline', tables: ['scene_feat_v1', 'scene_feat_v2', 'aug_feat'], desc: '离线特征（大批量）' },
          { name: 'stats',   tables: ['feat_stats', 'feat_drift', 'feat_coverage'], desc: '特征统计与漂移监控' },
        ],
      },
      {
        name: 'model_registry',
        icon: '🧠',
        color: '#3fb950',
        desc: '模型版本与实验管理',
        schemas: [
          { name: 'experiments', tables: ['runs', 'metrics', 'params', 'artifacts'], desc: 'MLflow 实验记录' },
          { name: 'models',      tables: ['vla_v1', 'vla_v2', 'world_model_v1', 'onnx_exports'], desc: '模型版本注册' },
          { name: 'evaluations', tables: ['eval_results', 'benchmark_scores', 'shadow_compare'], desc: '评测结果与对比' },
        ],
      },
      {
        name: 'governance',
        icon: '🔐',
        color: '#ffa657',
        desc: '数据治理与合规',
        schemas: [
          { name: 'audit',   tables: ['access_logs', 'query_history', 'data_changes'], desc: '访问审计日志' },
          { name: 'privacy', tables: ['pii_inventory', 'masking_rules', 'consent_records'], desc: '隐私合规管理' },
          { name: 'quality', tables: ['dq_rules', 'dq_results', 'sla_tracking'], desc: '数据质量规则与结果' },
        ],
      },
    ],
  },

  // 细粒度访问控制
  accessControl: {
    title: '细粒度访问控制（RBAC + ABAC）',
    principals: [
      { role: '数据工程师', permissions: ['raw_data.*: READ/WRITE', 'processed_data.*: READ/WRITE'], color: '#6c5ce7', icon: '🔧' },
      { role: '算法研究员', permissions: ['processed_data.*: READ', 'feature_store.*: READ', 'model_registry.*: READ/WRITE'], color: '#00cec9', icon: '🔬' },
      { role: '标注员',     permissions: ['processed_data.annotations.*: READ/WRITE'], color: '#fd79a8', icon: '✏️' },
      { role: '模型部署',   permissions: ['model_registry.models.*: READ', 'feature_store.online.*: READ'], color: '#3fb950', icon: '🚀' },
      { role: '数据治理',   permissions: ['governance.*: READ/WRITE', '*.audit: READ'], color: '#ffa657', icon: '🔐' },
      { role: 'CI/CD Bot', permissions: ['model_registry.*: READ/WRITE', 'feature_store.*: READ'], color: '#79c0ff', icon: '🤖' },
    ],
    rowFilter: '按车辆ID / 城市 / 时间范围 行级过滤，支持多租户隔离',
    columnMask: '敏感字段（车牌/人脸坐标）自动脱敏，GDPR 合规',
  },

  // 数据血缘追踪
  lineage: {
    title: '全链路数据血缘（Column-level Lineage）',
    desc: '从原始传感器帧到最终模型权重，每一步转换都有完整血缘记录',
    chain: [
      { from: 'raw_data.camera.frames_v2', to: 'processed_data.bev_features.bev_tensors', op: 'BEVFusion 推理', latency: '~2h/批次' },
      { from: 'processed_data.bev_features.bev_tensors', to: 'feature_store.offline.scene_feat_v2', op: 'Spark 特征工程', latency: '~30min' },
      { from: 'feature_store.offline.scene_feat_v2', to: 'model_registry.experiments.runs', op: 'PyTorch 训练', latency: '~5天' },
      { from: 'model_registry.experiments.runs', to: 'model_registry.models.vla_v2', op: 'MLflow 注册', latency: '~5min' },
      { from: 'model_registry.models.vla_v2', to: 'model_registry.evaluations.eval_results', op: 'NAVSIM 评测', latency: '~2h' },
    ],
    capabilities: [
      { name: '列级血缘', desc: '追踪到具体字段的来源与转换逻辑', icon: '🔬' },
      { name: '影响分析', desc: '修改上游表时，自动识别所有下游依赖', icon: '🌊' },
      { name: '根因定位', desc: '模型指标下降时，快速定位到具体数据批次', icon: '🎯' },
      { name: '合规审计', desc: '数据删除请求（GDPR）自动追踪所有衍生数据', icon: '📋' },
    ],
  },

  // 数据质量规则
  dataQuality: {
    title: '内置数据质量规则引擎',
    rules: [
      { table: 'raw_data.camera.frames_v2', rule: 'timestamp 连续性 ≤ 100ms 间隔', severity: 'error', autoFix: false },
      { table: 'processed_data.annotations.bbox_3d', rule: 'IoU 与参考模型 ≥ 0.7', severity: 'warning', autoFix: false },
      { table: 'feature_store.online.bev_feat_fp16', rule: 'NULL 率 < 0.1%', severity: 'error', autoFix: true },
      { table: 'feature_store.stats.feat_drift', rule: 'PSI < 0.2（特征分布稳定）', severity: 'warning', autoFix: false },
      { table: 'model_registry.evaluations.eval_results', rule: 'PDMS ≥ 基线 -2%', severity: 'error', autoFix: false },
      { table: 'governance.privacy.pii_inventory', rule: '所有 PII 字段已脱敏', severity: 'error', autoFix: true },
    ],
    engine: 'Unity Catalog 内置 DQ + Great Expectations 集成',
    alerting: 'Slack / PagerDuty 告警，Grafana 仪表盘',
  },

  // 与现有工具集成
  integrations: [
    { tool: 'Apache Spark',   role: '读写 Iceberg 表，自动注册血缘', icon: '⚡', color: '#ffa657' },
    { tool: 'Apache Airflow', role: 'DAG 任务自动上报血缘到 Unity Catalog', icon: '🌊', color: '#00cec9' },
    { tool: 'MLflow',         role: '实验 / 模型注册同步到 model_registry schema', icon: '🧪', color: '#3fb950' },
    { tool: 'Feast',          role: '特征定义同步到 feature_store catalog', icon: '🍽️', color: '#fd79a8' },
    { tool: 'dbt',            role: 'SQL 转换血缘自动解析，数据文档生成', icon: '🔨', color: '#6c5ce7' },
    { tool: 'LakeFS',         role: '数据版本 commit 与 Unity Catalog 版本对齐', icon: '🏷️', color: '#79c0ff' },
    { tool: 'Great Expectations', role: '数据质量结果写入 governance.quality schema', icon: '✅', color: '#a29bfe' },
    { tool: 'Trino',          role: '跨 catalog 联邦查询，统一 SQL 接口', icon: '🔍', color: '#e17055' },
  ],

  // 部署方式
  deployment: {
    options: [
      { mode: 'Databricks 托管', desc: '全托管，零运维，与 Delta Lake 深度集成', pros: '开箱即用', cons: '供应商锁定', color: '#ff7b72' },
      { mode: '开源自托管', desc: 'unitycatalog/unitycatalog on K8s，REST API + UI', pros: '完全控制', cons: '需运维', color: '#3fb950' },
      { mode: '混合模式', desc: '元数据层自托管，存储层用云对象存储', pros: '灵活', cons: '复杂度高', color: '#ffa657' },
    ],
    recommended: '开源自托管（K8s 部署），与现有 Kubernetes 基础设施统一管理',
    repo: 'https://github.com/unitycatalog/unitycatalog',
    version: 'v0.3+（支持 Iceberg REST Catalog）',
  },
};

// ═══════════════════════════════════════════════════════════════
// 12. 多模态融合层（新增）
// ═══════════════════════════════════════════════════════════════
export const MULTIMODAL_LAYER = {
  title: '🔀 多模态融合层',
  desc: '相机 / LiDAR / 雷达 / 语言 四模态时序对齐与联合表征',

  // 时序对齐策略
  syncStrategies: [
    {
      name: '硬件时间同步',
      desc: 'PTP (IEEE 1588) 精度 < 1μs，所有传感器统一时钟域',
      tech: 'PTP + GPS 1PPS',
      accuracy: '< 1 μs',
      color: '#6c5ce7',
      icon: '⏱️',
    },
    {
      name: '触发同步',
      desc: '相机 trigger 信号与 LiDAR 旋转角度对齐，消除运动模糊',
      tech: 'FPGA Trigger Board',
      accuracy: '< 0.5 ms',
      color: '#00cec9',
      icon: '🔫',
    },
    {
      name: '软件插值对齐',
      desc: '云端后处理：IMU 积分补偿运动畸变，线性插值对齐时间戳',
      tech: 'ROS2 tf2 + scipy',
      accuracy: '< 5 ms',
      color: '#fd79a8',
      icon: '🧮',
    },
    {
      name: '跨帧时序建模',
      desc: '滑动窗口 8 帧历史 + 未来 6 帧预测，构建时序上下文',
      tech: 'Temporal Transformer',
      accuracy: '8+6 帧',
      color: '#ffa657',
      icon: '🎞️',
    },
  ],

  // BEV 融合流水线
  bevFusion: {
    title: 'BEV 多模态融合流水线',
    steps: [
      { name: '相机 → BEV', desc: 'LSS / BEVDet：Lift-Splat-Shoot 将图像特征投影到 BEV 空间', tech: 'LSS + Depth Estimation', color: '#6c5ce7' },
      { name: 'LiDAR → BEV', desc: 'VoxelNet / PointPillars：点云体素化后提取 BEV 特征', tech: 'VoxelNet + Sparse Conv', color: '#3fb950' },
      { name: '雷达 → BEV', desc: '4D 毫米波雷达点云 → 速度感知 BEV 特征（RadarNet）', tech: 'RadarNet + CFAR', color: '#ffa657' },
      { name: '特征融合', desc: 'BEVFusion：通道注意力 + 空间对齐，融合三模态 BEV 特征', tech: 'BEVFusion / UniSim', color: '#fd79a8' },
      { name: '语言注入', desc: '驾驶指令 / 场景描述 → 语言嵌入注入 BEV 特征（VLA 核心）', tech: 'InternVL2 + Cross-Attn', color: '#a29bfe' },
      { name: '时序聚合', desc: '多帧 BEV 特征时序聚合，支持遮挡推理和速度估计', tech: 'BEVFormer / StreamPETR', color: '#00cec9' },
    ],
    outputDim: '256 × 200 × 200 (C × H × W)',
    fps: '10 Hz（车端）/ 离线不限',
  },

  // 跨模态标注协议
  annotationProtocol: [
    {
      modality: '相机',
      tasks: ['2D 检测', '实例分割', '车道线', '深度估计', '光流'],
      autoTool: 'SAM2 + InternVL2',
      manualRate: '< 5%',
      color: '#6c5ce7',
      icon: '📷',
    },
    {
      modality: 'LiDAR',
      tasks: ['3D 检测', '语义分割', '地面分割', '动态物体追踪'],
      autoTool: 'BEVFusion + OpenPCDet',
      manualRate: '< 10%',
      color: '#3fb950',
      icon: '🟢',
    },
    {
      modality: '毫米波雷达',
      tasks: ['速度估计', '目标关联', '遮挡补偿'],
      autoTool: 'RadarNet + Kalman Filter',
      manualRate: '< 3%',
      color: '#ffa657',
      icon: '📡',
    },
    {
      modality: '语言',
      tasks: ['场景描述', '驾驶意图', '危险预警', 'QA 对话'],
      autoTool: 'InternLM2 + GPT-4V',
      manualRate: '~30%',
      color: '#a29bfe',
      icon: '💬',
    },
    {
      modality: '轨迹',
      tasks: ['历史轨迹', '未来规划', '交互预测', '意图分类'],
      autoTool: 'MTR + HiVT',
      manualRate: '< 8%',
      color: '#00cec9',
      icon: '🛣️',
    },
  ],

  // 多模态数据集规格
  datasetSpec: {
    format: 'nuScenes-like JSON + WebDataset tar',
    sampleRate: '2 Hz（关键帧）/ 10 Hz（完整序列）',
    windowSize: '8 帧历史 + 当前帧 + 6 帧未来',
    modalityCoverage: '相机 100% · LiDAR 100% · 雷达 85% · 语言 60%',
    avgAnnotationTime: '~45 min/场景（自动标注 + 人工审核）',
    qualityThreshold: 'IoU > 0.7 (3D) · mIoU > 0.75 (分割)',
  },
};

// ═══════════════════════════════════════════════════════════════
// 12. 场景挖掘层（新增）
// ═══════════════════════════════════════════════════════════════
export const SCENE_MINE_LAYER = {
  title: '⛏️ 场景挖掘层',
  desc: '从海量数据中自动发现高价值场景，驱动主动学习闭环',

  // 场景分类体系
  sceneTaxonomy: [
    {
      category: '长尾场景',
      icon: '🦄',
      color: '#e17055',
      examples: ['逆行车辆', '施工区域', '动物穿越', '极端天气', '非标路口'],
      frequency: '< 0.1%',
      value: '极高',
      mineMethod: 'CLIP 嵌入距离 + 孤立森林异常检测',
    },
    {
      category: '困难场景',
      icon: '💪',
      color: '#fd79a8',
      examples: ['强逆光', '大雨/大雪', '隧道出入口', '密集行人', '复杂交叉路口'],
      frequency: '~2%',
      value: '高',
      mineMethod: '模型不确定性 + 预测误差 > 阈值',
    },
    {
      category: '安全关键场景',
      icon: '⚠️',
      color: '#ff7b72',
      examples: ['AEB 触发', '接管事件', '碰撞预警', '鬼探头', '加塞'],
      frequency: '~0.5%',
      value: '极高',
      mineMethod: '事件触发 + 规则过滤',
    },
    {
      category: '覆盖缺口场景',
      icon: '🕳️',
      color: '#ffa657',
      examples: ['夜间施工', '港口/矿区', '高速匝道', '地下停车场', '乡村道路'],
      frequency: '~5%',
      value: '高',
      mineMethod: '数据分布分析 + 覆盖率热力图',
    },
    {
      category: '多样性场景',
      icon: '🌈',
      color: '#00cec9',
      examples: ['不同城市', '不同季节', '不同时段', '不同车型', '不同驾驶风格'],
      frequency: '~10%',
      value: '中',
      mineMethod: '聚类采样 + 最大化多样性',
    },
  ],

  // 挖掘技术栈
  miningPipeline: [
    {
      step: '① 嵌入提取',
      desc: '用 CLIP / DINOv2 提取场景级视觉嵌入，LiDAR 用 PointMAE',
      tech: 'CLIP ViT-L/14 + DINOv2 + PointMAE',
      output: '1024-dim 向量 / 场景',
      color: '#6c5ce7',
      icon: '🧬',
    },
    {
      step: '② 向量索引',
      desc: '全量场景嵌入入库 FAISS，支持亿级近邻检索',
      tech: 'FAISS IVF-PQ + Milvus',
      output: '< 10ms 检索延迟',
      color: '#00cec9',
      icon: '🗂️',
    },
    {
      step: '③ 异常检测',
      desc: '孤立森林 + LOF 检测分布外场景，自动标记长尾候选',
      tech: 'Isolation Forest + LOF',
      output: '异常分数 0-1',
      color: '#fd79a8',
      icon: '🔍',
    },
    {
      step: '④ 聚类分析',
      desc: 'HDBSCAN 自适应聚类，发现数据分布空洞（覆盖缺口）',
      tech: 'HDBSCAN + UMAP 降维',
      output: '场景分布热力图',
      color: '#ffa657',
      icon: '🗺️',
    },
    {
      step: '⑤ 主动学习',
      desc: '不确定性采样 + 多样性采样，最大化标注 ROI',
      tech: 'BADGE + CoreSet + BALD',
      output: '标注优先级队列',
      color: '#3fb950',
      icon: '🎯',
    },
    {
      step: '⑥ 数据平衡',
      desc: '按场景类别 / 天气 / 时段 / 城市 重采样，消除分布偏差',
      tech: 'Stratified Sampling + SMOTE',
      output: '平衡训练集',
      color: '#79c0ff',
      icon: '⚖️',
    },
  ],

  // 主动学习闭环
  activeLearningLoop: {
    title: '主动学习闭环',
    desc: '用最少的标注预算获得最大的模型提升',
    steps: [
      { phase: '初始化', action: '随机采样 1% 数据，训练基础模型', icon: '🌱' },
      { phase: '不确定性评估', action: '对未标注数据推理，计算预测熵 / MC Dropout', icon: '❓' },
      { phase: '候选选择', action: '选取不确定性最高 + 多样性最大的 K 个样本', icon: '🎯' },
      { phase: '人工标注', action: '优先标注高价值候选，平均 45min/场景', icon: '✏️' },
      { phase: '模型更新', action: '增量训练，验证集指标提升后合并', icon: '🔄' },
      { phase: '效果评估', action: '对比随机采样基线，计算标注效率提升比', icon: '📊' },
    ],
    efficiency: '相比随机采样，标注效率提升 3-5×',
  },

  // 数据飞轮量化指标
  flywheelMetrics: [
    { name: '长尾场景覆盖率', current: '72%', target: '90%', unit: '%', trend: 'up', color: '#e17055' },
    { name: '困难样本比例', current: '8%', target: '15%', unit: '%', trend: 'up', color: '#fd79a8' },
    { name: '标注自动化率', current: '92%', target: '95%', unit: '%', trend: 'up', color: '#3fb950' },
    { name: '场景多样性指数', current: '0.76', target: '0.90', unit: 'Shannon H', trend: 'up', color: '#00cec9' },
    { name: '主动学习效率', current: '3.8×', target: '5×', unit: '倍', trend: 'up', color: '#6c5ce7' },
    { name: '数据复用率', current: '65%', target: '80%', unit: '%', trend: 'up', color: '#ffa657' },
  ],
};

// ═══════════════════════════════════════════════════════════════
// 13. 标注质量管控（新增）
// ═══════════════════════════════════════════════════════════════
export const ANNOTATION_QA_LAYER = {
  title: '✅ 标注质量管控',
  desc: '多级质检体系，保障训练数据质量',

  qaLevels: [
    {
      level: 'L1 自动校验',
      desc: '格式合规 · 坐标范围 · 时间戳连续性 · 标注完整性',
      tool: 'Great Expectations + Pandera',
      passRate: '~98%',
      color: '#3fb950',
      icon: '🤖',
    },
    {
      level: 'L2 模型一致性',
      desc: '与参考模型输出对比，IoU < 0.5 的标注标记为疑似错误',
      tool: 'BEVFusion 参考模型',
      passRate: '~95%',
      color: '#00cec9',
      icon: '🔬',
    },
    {
      level: 'L3 跨模态一致性',
      desc: '相机 2D 框与 LiDAR 3D 框投影一致性，偏差 > 10px 报警',
      tool: '投影矩阵校验',
      passRate: '~93%',
      color: '#ffa657',
      icon: '🔗',
    },
    {
      level: 'L4 人工抽检',
      desc: '随机抽取 5% 数据人工复核，不合格批次全量返工',
      tool: 'Label Studio + 专家审核',
      passRate: '~99.5%',
      color: '#6c5ce7',
      icon: '👁️',
    },
  ],

  // 标注平台
  platform: {
    tool: 'Label Studio Enterprise + 自研 3D 标注工具',
    annotators: '内部 50 人 + 外包 200 人',
    throughput: '~500 场景/天',
    avgCost: '~¥80/场景（自动标注后）',
    sla: '48h 交付，质量 > 95%',
  },

  // 常见错误类型
  errorTypes: [
    { type: '3D 框朝向错误', rate: '2.1%', severity: 'high', autoFix: false },
    { type: '遮挡目标漏标', rate: '3.5%', severity: 'high', autoFix: false },
    { type: '类别混淆', rate: '1.2%', severity: 'medium', autoFix: true },
    { type: '时间戳偏移', rate: '0.8%', severity: 'medium', autoFix: true },
    { type: '语言描述不准确', rate: '5.0%', severity: 'low', autoFix: false },
    { type: '轨迹插值误差', rate: '1.5%', severity: 'medium', autoFix: true },
  ],
};