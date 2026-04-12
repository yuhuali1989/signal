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
    { id: 'collect',  label: '数据采集',   icon: '🚗', color: '#6c5ce7', desc: '车端多传感器实时采集' },
    { id: 'upload',   label: '数据上传',   icon: '📡', color: '#00cec9', desc: '边缘预处理 + 增量上传' },
    { id: 'process',  label: '数据处理',   icon: '⚙️', color: '#fd79a8', desc: '清洗 · 标注 · 质检 · 挖掘' },
    { id: 'store',    label: '数据存储',   icon: '🗄️', color: '#ffa657', desc: '数据湖 + 特征仓库 + 版本管理' },
    { id: 'train',    label: '模型训练',   icon: '🧠', color: '#3fb950', desc: 'VLA + 世界模型分布式训练' },
    { id: 'deploy',   label: '模型部署',   icon: '🚀', color: '#79c0ff', desc: '车端推理 + OTA 灰度发布' },
    { id: 'monitor',  label: '效果监控',   icon: '📊', color: '#d2a8ff', desc: '在线指标 + 触发回采策略' },
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
    catalog: 'AWS Glue / Hive Metastore',
    query: 'Trino / Spark SQL',
    version: 'LakeFS (Git-like 数据版本管理)',
    lineage: 'Apache Atlas (数据血缘追踪)',
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