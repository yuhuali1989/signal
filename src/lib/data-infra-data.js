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
  { id: 'datalake',      label: '数据湖仓',         icon: '🏞️', color: '#00cec9', desc: 'Iceberg · Parquet · WebDataset · LakeFS 版本管理 · Schema 设计 · IO 优化' },
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
// 3. 数据湖仓 — 自动驾驶多模态存储方案
// ═══════════════════════════════════════════════════════════════
export const DATALAKE_DATA = {

  // ── 存储格式全景（5阶段格式决策地图）────────────────────────
  storageFormats: {
    title: '数据链路存储格式全景',
    subtitle: '从采集侧到训练前，每个阶段的最优存储格式、Schema 设计、访问方式与转换逻辑',

    stages: [
      // ─────────────────────────────────────────────────────────
      // 阶段 1：采集侧（车端落盘）
      // ─────────────────────────────────────────────────────────
      {
        id: 'collect',
        name: '① 采集侧',
        subtitle: '车端落盘格式',
        icon: '🚗',
        color: '#6c5ce7',
        location: 'NVMe SSD（车载 2TB）',
        lifecycle: '上传完成后保留 24h',

        verdict: {
          format: 'MCAP',
          reason: '唯一合理选择',
          score: 5,
        },
        whyThisFormat: [
          '多模态统一容器：6路相机 + LiDAR + 雷达 + CAN（车辆总线信号：车速/方向盘/油门/刹车/接管事件）写入同一文件，统一纳秒级时间戳索引',
          '流式写入：Chunk 机制（1s/块 zstd 压缩），写入延迟 < 1ms，不阻塞采集进程',
          'ChunkIndex 支持随机访问：不需要解压整个文件即可定位任意时刻的数据',
          '开放标准：Foxglove 开源，ROS2 原生支持，工具链成熟（mcap-cli/Foxglove Studio）',
          '为什么不用 ROS2 Bag：ROS2 Bag 底层就是 MCAP，MCAP 是其超集，直接用 MCAP 更灵活',
          '为什么不直接存 MP4 + CSV：多模态时间戳对齐困难，无法原子性写入，恢复困难',
          '⚠️ 为什么 MCAP 不能直接用于训练（不能与 WebDataset 统一）：MCAP 是时序流格式（按时间轴交织所有 topic），训练需要随机采样（打乱顺序），用 MCAP 训练 = 每次 epoch 顺序扫描全量原始数据，GPU 等 IO；此外 MCAP 录制时没有标注，标注是事后生成的，WebDataset 打包时才把 label.json 和传感器数据合并进同一 tar；最后 WebDataset 里的 can.npy/hist.npy 是从 MCAP 提取后预处理的结果（聚合/积分），不是原始信号，无法反向还原成 MCAP 格式',
        ],
        storageMedia: {
          title: '车载 NVMe SSD',
          icon: '💾',
          spec: '2TB NVMe SSD（PCIe 4.0 × 4，顺序写入 ~3 GB/s）',
          why: '车端唯一可行选择：需要支持 6路相机（H.265）+ LiDAR + 雷达 + CAN 同时写入，总带宽峰值 ~500 MB/s；NVMe 写入延迟 < 0.1ms，不阻塞实时采集进程；SSD 无机械部件，抗振动（车辆行驶颠簸）',
          lifecycle: '上传完成后 24h 内清除（循环写入）',
          alternatives: [
            { name: 'eMMC', reason: '❌ 带宽不足（~300 MB/s），无法支持多路高清视频同时写入' },
            { name: 'HDD', reason: '❌ 机械硬盘抗振动差，车辆颠簸时磁头损坏风险高' },
            { name: '云端直传', reason: '❌ 4G/5G 带宽不稳定，隧道/地库无信号时数据丢失' },
          ],
        },
        schema: {
          desc: 'MCAP 没有传统意义的 Schema，而是通过 Channel + Message 组织数据',
          keyFields: [
            { field: 'log_time (ns)',    type: 'uint64',  desc: '消息接收时间戳（纳秒，PTP 同步后的系统时钟）' },
            { field: 'publish_time (ns)', type: 'uint64', desc: '消息发布时间戳（传感器驱动层时间）' },
            { field: 'channel_id',       type: 'uint16',  desc: '传感器通道 ID，对应 /camera/front 等 topic' },
            { field: 'data',             type: 'bytes',   desc: '序列化的消息体（Protobuf/ROS2 msg）' },
            { field: 'sequence',         type: 'uint32',  desc: '消息序号，用于检测丢帧' },
          ],
          fileNaming: '{vehicle_id}_{start_timestamp_us}_{camera_id}.mcap',
          fileSize: '~5~15 GB/Session（压缩前）/ ~1~3 GB（H.265 视频压缩后）',
        },
        accessPatterns: [
          {
            pattern: '顺序读取（上传/回放）',
            tool: 'mcap-cli / Python mcap 库',
            code: `import mcap
from mcap.reader import make_reader

with open("session_v001_20240315.mcap", "rb") as f:
    reader = make_reader(f)
    for schema, channel, message in reader.iter_messages(
        topics=["/camera/front/image_raw", "/lidar/points"],
        start_time=1710460800_000000000,  # 纳秒
        end_time=1710460820_000000000,
    ):
        # message.data 是 Protobuf 序列化的原始字节
        print(f"topic={channel.topic} ts={message.log_time}")`,
            note: '按 topic 过滤，只读需要的 Channel，不解压其他 Channel 的 Chunk',
          },
          {
            pattern: '随机访问（调试/回放特定时刻）',
            tool: 'Foxglove Studio / mcap seek',
            code: `# 利用 ChunkIndex 直接 seek 到指定时间戳
reader.seek(timestamp_ns=1710460810_000000000)
schema, channel, message = next(reader.iter_messages())`,
            note: 'ChunkIndex 存储每个 Chunk 的时间范围，seek 只需读 Footer + ChunkIndex，O(log n)',
          },
        ],
        toNextStage: '上传到 S3 Landing Zone，触发 Airflow DAG 解码',
        dailyVolume: '~8 TB（1000辆车，压缩后）',
      },

      // ─────────────────────────────────────────────────────────
      // 阶段 2：原始数据（Landing Zone + Bronze Layer）
      // ─────────────────────────────────────────────────────────
      {
        id: 'raw',
        name: '② 原始数据',
        subtitle: 'Landing Zone + Bronze Layer',
        icon: '📥',
        color: '#ff7b72',
        location: 'S3 Standard（Landing）+ S3（Bronze）',
        lifecycle: 'Landing 7天 → Bronze 90天',

        verdict: {
          format: 'Landing: MCAP 原样 | Bronze: session_index（MCAP文件粒度）+ lidar_frames（帧粒度）。雷达/CAN 不建帧级表，Silver 层从 MCAP 聚合进 scene_index。',
          reason: 'Bronze 层不解码视频不存 JPEG，只存 MCAP 文件级元数据',
          score: 5,
        },
        whyThisFormat: [
          '⚠️ MCAP 里没有 JPEG：相机数据是 H.265 连续视频流（sensor_msgs/CompressedImage），不是独立帧，无法直接抽取 JPEG，必须解码整段视频才能得到帧',
          'Bronze 层不解码视频：解码 H.265 是计算密集操作，Bronze 层只需元数据（时间范围/传感器状态/帧数统计），不需要图像内容',
          '不存帧级 JPEG 的核心原因：去重后只保留 ~30% 的 Scene，如果 Bronze 层全量解码存 JPEG，70% 的解码和存储都是浪费（1000辆车/天 → 2.16亿个 JPEG 文件）',
          'Bronze 层粒度 = Session（MCAP 文件）：1行 = 1个 Session，记录 MCAP 文件路径、时间范围、传感器完整性、帧数统计',
          'LiDAR 例外：点云数据量小且结构化，Bronze 层解码存帧级 Parquet（~900万行/天），用于场景切分时的时序对齐和标注关联',
          '雷达和 CAN 不建帧级表：Silver 层处理时从 MCAP 按时间范围解码，直接聚合成 scene_index 的统计字段，无需单独存帧级表',
        ],
        schema: {
          desc: 'Bronze 层核心表：session_index（MCAP 文件粒度）+ lidar_frames（帧粒度）。雷达和 CAN 不建帧级表，Silver 层从 MCAP 解码后聚合进 scene_index。',
          tables: [
            {
              name: 'raw_data.sessions.session_index',
              rowUnit: '1行 = 1个 Session（1个 MCAP 文件，15分钟）',
              keyFields: [
                { field: 'session_id',       type: 'STRING',    desc: '主键，格式 {vehicle_id}_{start_timestamp_us}' },
                { field: 'vehicle_id',       type: 'STRING',    desc: '车辆 ID' },
                { field: 'start_us',         type: 'LONG',      desc: 'Session 开始时间戳（微秒）' },
                { field: 'end_us',           type: 'LONG',      desc: 'Session 结束时间戳（微秒）' },
                { field: 'duration_s',       type: 'FLOAT',     desc: '时长（秒），典型值 900s = 15min' },
                { field: 'mcap_path',        type: 'STRING',    desc: 'S3 MCAP 文件路径，如 s3://landing/{vehicle_id}/{date}/{session_id}.mcap' },
                { field: 'mcap_size_bytes',  type: 'LONG',      desc: 'MCAP 文件大小（字节）' },
                { field: 'camera_channels',  type: 'LIST<STRING>', desc: '可用相机 Channel 列表，如 [front, rear, left_front, ...]' },
                { field: 'camera_fps',       type: 'INT',       desc: '相机帧率（Hz），典型值 20' },
                { field: 'camera_frame_count', type: 'INT',     desc: '相机总帧数（所有相机之和）' },
                { field: 'has_lidar',        type: 'BOOLEAN',   desc: 'LiDAR 数据是否完整' },
                { field: 'has_radar',        type: 'BOOLEAN',   desc: '雷达数据是否完整' },
                { field: 'has_can',          type: 'BOOLEAN',   desc: 'CAN 总线数据是否完整（CAN = Controller Area Network，车辆内部总线，记录车速/方向盘角度/油门/刹车/档位/接管事件等车辆状态信号）' },
                { field: 'intrinsic_json',   type: 'STRING',    desc: '相机内参 JSON（Session 级别，从 MCAP Header 提取，不需要每帧存）' },
                { field: 'extrinsic_json',   type: 'STRING',    desc: '外参 JSON（Session 级别）' },
                { field: 'cut_reason',       type: 'STRING',    desc: 'Session 切割原因：timer_15min / file_size / ign_off / network_resume' },
                { field: 'upload_status',    type: 'STRING',    desc: 'pending / uploaded / verified' },
                { field: 'event_time',       type: 'TIMESTAMP', desc: '分区字段' },
              ],
              partitionBy: 'days(event_time), vehicle_id',
              rowsPerDay: '~1000行（1000辆车 × 1 Session均值）',
              volumeRef: 'raw_data.sessions.mcap_volume → MCAP 文件（~5~15GB/Session）',
            },
            {
              name: 'raw_data.lidar.lidar_frames',
              rowUnit: '1行 = 1帧（LiDAR 一次旋转扫描，100ms）',
              keyFields: [
                { field: 'frame_id',      type: 'STRING', desc: '主键，格式 {session_id}_{timestamp_us}' },
                { field: 'session_id',    type: 'STRING', desc: '外键，关联 session_index' },
                { field: 'scene_id',      type: 'STRING', desc: '外键，Silver 层场景切分后回填（初始为 NULL）' },
                { field: 'vehicle_id',    type: 'STRING', desc: '车辆 ID' },
                { field: 'timestamp_us',  type: 'LONG',   desc: 'Unix 时间戳（微秒），多模态对齐基准' },
                { field: 'event_time',    type: 'TIMESTAMP', desc: '分区字段' },
                { field: 'pcd_path',      type: 'STRING', desc: 'S3 Volume 路径，指向 .pcd.draco 文件（~500KB）' },
                { field: 'num_points',    type: 'INT',    desc: '点云点数（典型值 ~100K）' },
                { field: 'ego_pose_json', type: 'STRING', desc: '车体位姿 JSON（4×4 变换矩阵）' },
              ],
              partitionBy: 'days(event_time)',
              rowsPerDay: '~900万行（1000辆×9000帧）',
              volumeRef: 'raw_data.lidar.pcd_volume → .pcd.draco 文件',
            },
          ],
          note: '⚠️ Bronze 层只有 session_index 一张表。雷达/CAN/LiDAR 原始帧级数据均在 MCAP 文件中，Silver 层处理时从 MCAP 解码聚合进 scene_index。',
        },
        accessPatterns: [
          {
            pattern: '查询某车车某天的 Session 列表',
            tool: 'Trino SQL',
            code: `-- 查询某车车某天的所有 Session（MCAP 文件）
SELECT session_id, start_us, end_us, mcap_path,
       camera_frame_count, has_lidar, has_radar, has_can
FROM raw_data.sessions.session_index
WHERE vehicle_id = 'v001'
  AND DATE(event_time) = '2024-03-15'
ORDER BY start_us`,
            note: 'Bronze 层只有 session_index 一张表。所有模态原始数据均在 MCAP 文件里，通过 mcap_path 访问',
          },
        ],
        storageMedia: {
          title: 'S3 对象存储（双层）',
          icon: '☁️',
          spec: 'Landing Zone：S3 Standard（高频访问，7天）→ Bronze：S3 Standard（90天）',
          why: 'Landing Zone 用 S3 Standard 是因为上传后立即触发 Airflow DAG 处理，访问频率高；Bronze 层 MCAP 文件 90天内可能被重新解码（重标注/回放调试），仍用 Standard；session_index 元数据存 Iceberg on S3，支持 Trino SQL 查询',
          lifecycle: 'Landing 7天后自动转 Bronze；Bronze 90天后转 S3 Glacier（归档）',
          costNote: 'MCAP 文件是主要存储成本：1000辆车 × 8TB/天 × 90天 = ~720TB，约 $16K/月（S3 Standard $0.023/GB）',
          alternatives: [
            { name: 'HDFS', reason: '❌ 运维成本高，不支持弹性扩缩容，云原生场景已被 S3 替代' },
            { name: 'NFS', reason: '❌ 单点故障风险，带宽瓶颈，不适合 PB 级多模态数据' },
            { name: 'S3 Glacier 直接归档', reason: '❌ 取回延迟 3-5h，Bronze 层需要快速访问（重标注/调试）' },
          ],
        },
        toNextStage: 'Silver 层从 MCAP 解码雷达/CAN/LiDAR 数据，聚合进 scene_index → 场景切分 → 去重',
        dailyVolume: '~1 TB（session_index 元数据 + MCAP 文件）',
      },

      // ─────────────────────────────────────────────────────────
      // 阶段 3：去重清理后数据（Silver Layer）
      // ─────────────────────────────────────────────────────────
      {
        id: 'silver',
        name: '③ 去重清理后',
        subtitle: 'Silver Layer',
        icon: '⚪',
        color: '#79c0ff',
        location: 'S3 Standard-IA（低频访问）',
        lifecycle: '1年温存储',

        verdict: {
          format: 'scene_index（1行=1个Scene，含雷达/CAN聚合字段）。相机/雷达/CAN 均不存帧级表。',
          reason: 'Silver 层核心是场景切分和去重，雷达/CAN 聚合进 scene_index，无需帧级表',
          score: 5,
        },
        whyThisFormat: [
          'Silver 层也不解码视频、不存 JPEG：场景切分只需要 CAN/LiDAR 时间戳 + 事件标记，不需要图像内容',
          'CLIP 去重只需抽关键帧：每个 Scene 只抽 1~3 帧关键帧（从 MCAP 解码单帧）计算 CLIP 嵌入，不全量解码',
          'scene_index 是 Silver 层核心表：1行=1个Scene（20s），记录时间范围/传感器完整性/去重状态/标注状态',
          'LiDAR 帧级表回填 scene_id：Bronze 层已有 lidar_frames，Silver 层通过 UPDATE 回填 scene_id（Iceberg 行级更新）',
          '雷达/CAN 无帧级表：Silver 层处理时直接从 MCAP 按 scene 时间范围解码，聚合成 scene_index 的统计字段，不单独建表',
          '相机帧级表在 Gold 层才生成：只对去重后保留的 Scene 解码，直接打包进 WebDataset，不单独存 JPEG',
        ],
        schema: {
          desc: 'Silver 层新增 scene_index 核心表（1行=1个Scene），Bronze 层各模态帧级表回填 scene_id',
          tables: [
            {
              name: 'processed_data.scenes.scene_index',
              rowUnit: '1行 = 1个 Scene（20s 固定窗口 / 事件触发）',
              keyFields: [
                { field: 'scene_id',         type: 'STRING',       desc: '主键，格式 {vehicle_id}_{date}_{session}_{seq}' },
                { field: 'vehicle_id',        type: 'STRING',       desc: '车辆 ID' },
                { field: 'session_id',        type: 'STRING',       desc: '外键，关联 session_index（来自哪个 MCAP 文件）' },
                { field: 'start_us',          type: 'LONG',         desc: 'Scene 开始时间戳（微秒）' },
                { field: 'end_us',            type: 'LONG',         desc: 'Scene 结束时间戳（微秒）' },
                { field: 'duration_s',        type: 'FLOAT',        desc: '时长（秒），典型值 20s' },
                { field: 'city',              type: 'STRING',       desc: '城市（分区字段）' },
                { field: 'weather',           type: 'STRING',       desc: 'sunny/rainy/foggy/night（从 MCAP 元数据或模型推断）' },
                { field: 'scenario_tags',     type: 'LIST<STRING>', desc: '[long_tail, highway, intersection, ...]' },
                { field: 'has_takeover',      type: 'BOOLEAN',      desc: '是否含接管事件（从 CAN 数据检测）' },
                { field: 'nav_command',        type: 'STRING',       desc: '导航路口指令：go_straight / turn_left / turn_right / u_turn / change_lane_left / change_lane_right / follow_lane（来自地图导航系统，表示该 Scene 内下一个路口的动作，训练时作为高层意图输入）' },
                { field: 'ego_traj_hist_json', type: 'STRING',       desc: '历史轨迹 JSON（过去 2s，[20帧×(x,y,yaw)]，从 CAN 速度/方向盘积分 + IMU 修正），训练时告诉模型"车刚才怎么走的"' },
                { field: 'has_lidar',         type: 'BOOLEAN',      desc: 'LiDAR 数据完整性' },
                { field: 'has_radar',         type: 'BOOLEAN',      desc: '雷达数据完整性' },
                { field: 'dedup_hash',        type: 'STRING',       desc: '场景感知哈希（pHash，从 MCAP 抽 1 帧关键帧计算），Hamming 距离 < 8 则去重' },
                { field: 'clip_embedding',    type: 'BINARY',       desc: 'CLIP ViT-L/14 嵌入（FP16，512维，从 MCAP 抽 1 帧关键帧计算），余弦相似度 > 0.95 则去重' },
                { field: 'is_duplicate',      type: 'BOOLEAN',      desc: '是否被标记为重复（去重后丢弃）' },
                { field: 'annotation_status', type: 'STRING',       desc: 'pending / auto_labeled / human_reviewed / rejected' },
                { field: 'dataset_version',   type: 'STRING',       desc: '所属数据集版本（Gold 层打包后回填）' },
                { field: 'webdataset_shard',  type: 'STRING',       desc: 'WebDataset shard 路径（Gold 层打包后回填）' },
                { field: 'cut_reason',        type: 'STRING',       desc: '切割原因：fixed_window / takeover / aeb / bad_weather / construction' },
                { field: 'start_time',        type: 'TIMESTAMP',    desc: '分区字段' },
              ],
              partitionBy: 'days(start_time), city',
              rowsPerDay: '~45000行（1000辆×45 Scene/Session）',
            },
          ],
          silverTransform: [
            { op: '场景切分', desc: '读取 CAN + LiDAR 时间戳，按 20s 固定窗口 + 事件触发切割，生成 scene_id，写入 scene_index' },
            { op: 'CAN 聚合（车辆总线信号）', desc: 'CAN（Controller Area Network）是汽车内部通信总线，记录车辆底层状态：车速（m/s）、方向盘转角（deg）、油门/刹车踏板开度（%）、档位（P/R/N/D）、横纵向加速度、人工接管标志（is_takeover）、AEB 自动紧急制动触发标志（is_aeb）等。对每个 Scene 时间范围内的 CAN 帧做聚合：avg_speed_mps / max_brake_pct / has_takeover / has_aeb / 轨迹积分（ego_trajectory），写入 scene_index 对应字段。同时生成 ego_traj_hist_json（过去 2s 历史轨迹，从 CAN 速度/方向盘积分 + IMU 修正）。CAN 帧级表不保留（已聚合）。' },
            { op: '导航指令写入（nav_command）', desc: '从地图导航系统（/planning/route_commands topic）提取该 Scene 内下一个路口的动作指令，编码为 go_straight / turn_left / turn_right / u_turn / change_lane_left / change_lane_right / follow_lane，写入 scene_index.nav_command 字段。注意：这不是 CAN 数据，而是导航系统的高层意图，与 CAN 的底层电气信号是两个不同来源。训练时作为离散 token 输入模型，告诉模型"该往哪走"。' },
            { op: '雷达聚合', desc: '对每个 Scene 时间范围内的雷达数据做聚合：平均目标数/最近目标距离/迎面车标记，写入 scene_index 对应字段。雷达帧级表不保留。' },
            { op: 'scene_id 回填', desc: '将 scene_id UPDATE 回填到 lidar_frames 表（Iceberg 行级更新）。雷达和 CAN 已聚合进 scene_index，无需回填。' },
            { op: '关键帧抽取（轻量）', desc: '每个 Scene 从 MCAP 解码 1~3 帧关键帧，用于计算 pHash 和 CLIP 嵌入，不全量解码' },
            { op: '感知哈希去重', desc: '计算 pHash，Hamming 距离 < 8 则标记 is_duplicate=true' },
            { op: 'CLIP 嵌入去重', desc: 'CLIP ViT-L/14 提取场景嵌入，余弦相似度 > 0.95 则去重' },
            { op: '质量过滤', desc: '传感器故障/数据缺失/时间戳异常 → 标记 annotation_status=rejected' },
          ],
          note: '⚠️ Silver 层不存相机帧级表，不存 JPEG。雷达和 CAN 帧级数据聚合进 scene_index 后不单独保留帧级表。',
        },
        accessPatterns: [
          {
            pattern: '训练数据采样（最核心的查询）',
            tool: 'Trino SQL',
            code: `-- 分层采样：雨天 + 有行人 + 未去重 的场景
SELECT scene_id, webdataset_shard, weather, scenario_tags
FROM processed_data.scenes.scene_index
WHERE annotation_status = 'human_reviewed'
  AND is_duplicate = false
  AND has_lidar = true
  AND weather = 'rain'
  AND ARRAY_CONTAINS(scenario_tags, 'pedestrian')
  AND dataset_version = 'v2.3.0'
  AND dataset_split = 'train'
ORDER BY RANDOM()
LIMIT 50000`,
            note: 'scene_index 是训练采样唯一入口，所有过滤条件都在这里，不需要扫描帧级表',
          },
          {
            pattern: '查询某 Scene 的 LiDAR 帧（用于标注/调试）',
            tool: 'Spark SQL',
            code: `-- 给定 scene_id，获取 LiDAR 帧列表（雷达/CAN 已聚合到 scene_index，无需 JOIN）
SELECT l.frame_id, l.timestamp_us, l.pcd_path, l.ego_pose_json
FROM raw_data.lidar.lidar_frames l
WHERE l.scene_id = 'v001_20240315_s003_0042'
ORDER BY l.timestamp_us
-- 雷达原始帧级数据如需可从 MCAP 按时间范围解码`,
            note: '雷达和 CAN 已聚合进 scene_index，不需要 JOIN 帧级表。只有 LiDAR 帧级表保留（因为有 pcd_path 和标注关联）。',
          },
        ],
        storageMedia: {
          title: 'S3 Standard-IA（低频访问）',
          icon: '🧊',
          spec: 'S3 Standard-IA（Infrequent Access），存储成本 $0.0125/GB/月（比 Standard 低 46%）',
          why: 'Silver 层 scene_index 元数据访问频率中等（训练采样查询），但 LiDAR pcd 文件访问频率低（只在标注/调试时访问）；Standard-IA 最低存储时间 30天，符合 Silver 层 1年温存储策略；Iceberg 表元数据（manifest/snapshot）存 S3 Standard，数据文件存 Standard-IA',
          lifecycle: '1年后转 S3 Glacier Instant Retrieval（毫秒级取回，$0.004/GB/月）',
          costNote: 'scene_index：~45K行/天 × 365天 = ~1600万行，Parquet 约 5GB，可忽略；LiDAR pcd 文件：~900万帧/天 × 500KB × 365天 ≈ 1.6PB，是主要成本',
          alternatives: [
            { name: 'S3 Standard', reason: '❌ 成本高 46%，Silver 层访问频率不需要 Standard 级别' },
            { name: 'S3 Glacier', reason: '❌ 取回延迟 1-5min（Instant）或 3-5h（Flexible），训练采样查询无法接受' },
            { name: 'Azure Data Lake', reason: '⚠️ 可行，但需要跨云，增加数据传输成本和延迟' },
          ],
        },
        toNextStage: '对保留的 Scene（去重后 ~70%）解码 MCAP → 打包 WebDataset shard → Gold Layer',
        dailyVolume: '~1 TB（scene_index + LiDAR/雷达帧级元数据，无图像）',
      },

      // ─────────────────────────────────────────────────────────
      // 阶段 4：带标签数据（Gold 标注层）
      // ─────────────────────────────────────────────────────────
      {
        id: 'gold',
        name: '④ 带标签数据',
        subtitle: 'Gold Layer（标注层）',
        icon: '🏷️',
        color: '#ffa657',
        location: 'S3 Standard + NVMe 热缓存',
        lifecycle: '永久保留',

        verdict: {
          format: 'Parquet（结构化标注）+ JSON Volume（nuScenes 格式）+ PNG Volume（分割 mask）',
          reason: '标注数据结构化存 Parquet 便于统计，原始标注 JSON 存 Volume 便于工具链兼容',
          score: 5,
        },
        whyThisFormat: [
          'Gold 层才解码视频：只对去重后保留的 Scene（~30% 的 Session）从 MCAP 解码相机帧，避免全量解码的浪费',
          '解码后直接打包 WebDataset：不单独存 JPEG 文件，解码 → 直接写入 tar shard，消灭小文件问题',
          '3D 检测框存 Parquet：cx/cy/cz/l/w/h/yaw 等数值字段，支持按类别/置信度/城市过滤，Iceberg 列裁剪高效',
          '语义分割 mask 存 PNG Volume：RLE 压缩的 PNG，不适合存 Parquet 列（二进制大对象），通过 mask_path 关联',
          'nuScenes JSON 格式兼容：保留 nuScenes 格式的原始标注 JSON，便于与开源工具链（mmdetection3d/OpenPCDet）直接对接',
          '标注版本化：dataset_version 字段 + Iceberg Time Travel，可回溯任意版本的标注',
          '自动标注置信度存储：confidence 字段区分自动标注（< 0.9 需人工审核）和人工标注（= 1.0）',
        ],
        schema: {
          desc: '标注数据按类型拆分为独立 Iceberg 表，通过 frame_id 关联传感器数据',
          tables: [
            {
              name: 'processed_data.annotations.bbox_3d',
              rowUnit: '1行 = 1个 3D 检测框（单帧单目标）',
              keyFields: [
                { field: 'anno_id',       type: 'STRING',  desc: '主键' },
                { field: 'frame_id',      type: 'STRING',  desc: '外键，关联 lidar.pointcloud_v2' },
                { field: 'scene_id',      type: 'STRING',  desc: '外键，关联 scene_index' },
                { field: 'track_id',      type: 'STRING',  desc: '跨帧追踪 ID（同一目标在多帧中相同）' },
                { field: 'category',      type: 'STRING',  desc: 'car/truck/pedestrian/cyclist/cone' },
                { field: 'cx,cy,cz',      type: 'FLOAT',   desc: '3D 中心坐标（车体坐标系，米）' },
                { field: 'l,w,h',         type: 'FLOAT',   desc: '长宽高（米）' },
                { field: 'yaw',           type: 'FLOAT',   desc: '偏航角（弧度）' },
                { field: 'velocity_json', type: 'STRING',  desc: '速度向量 {vx,vy,vz}（m/s）' },
                { field: 'confidence',    type: 'FLOAT',   desc: '置信度 0-1（自动标注 < 0.9，人工 = 1.0）' },
                { field: 'source',        type: 'STRING',  desc: 'auto_bevfusion/human/auto+human' },
                { field: 'dataset_version', type: 'STRING', desc: '标注版本，如 v2.3.0' },
              ],
              partitionBy: 'days(created_at), dataset_version',
              rowsPerDay: '~5000万行（1000辆×50框/帧×200帧/Scene×45Scene），仅用于标注工具链读取，训练时打包进 WebDataset shard',
            },
          ],
        },
        accessPatterns: [
          {
            pattern: '按场景统计标注分布（直接查 scene_index）',
            tool: 'Trino SQL',
            code: `-- 标注统计查询：直接用 scene_index 的聚合字段，无需 JOIN 帧级标注表
SELECT city, weather,
       COUNT(*) AS total_scenes,
       SUM(CASE WHEN has_pedestrian THEN 1 ELSE 0 END) AS pedestrian_scenes,
       AVG(object_count_avg) AS avg_objects,
       AVG(label_confidence_avg) AS avg_confidence
FROM processed_data.scenes.scene_index
WHERE dataset_version = 'v2.3.0'
  AND annotation_status = 'human_reviewed'
GROUP BY city, weather
ORDER BY city, total_scenes DESC`,
            note: '标注聚合字段已在 scene_index 中，无需 JOIN bbox_3d 帧级表',
          },
        ],
        storageMedia: {
          title: 'S3 Standard + NVMe 热缓存',
          icon: '🔥',
          spec: 'S3 Standard（永久保留）+ 本地 NVMe 热缓存（JuiceFS，~50TB）',
          why: 'Gold 层标注数据永久保留，S3 Standard 提供高可用（99.999999999% 耐久性）；标注 Parquet 表（bbox_3d/seg_masks）访问频率高（标注工具链/质检），用 S3 Standard；WebDataset shard 训练时高频读取，用 JuiceFS 挂载 NVMe 热缓存（缓存命中率 ~80%，IO 吞吐从 ~200MB/s 提升到 ~2GB/s）',
          lifecycle: '永久保留，按 dataset_version 版本化管理（Iceberg Time Travel）',
          costNote: 'bbox_3d 标注表：~5000万行/天 × 365天 = ~180亿行，Parquet 约 500GB；WebDataset shard：~50TB 总量，S3 Standard ~$1150/月',
          alternatives: [
            { name: 'S3 Standard-IA', reason: '❌ Gold 层访问频率高（标注工具链每天查询），Standard-IA 取回费用反而更贵' },
            { name: 'Lustre 并行文件系统', reason: '⚠️ 训练集群内可用，但成本高（$0.14/GB/月 vs S3 $0.023/GB），适合超大规模训练集群' },
            { name: 'HDFS', reason: '❌ 不支持弹性扩缩容，运维成本高，已被云原生方案替代' },
          ],
        },
        toNextStage: 'Ray 打包为 WebDataset shard（含相机/LiDAR/雷达/CAN/标注）→ 训练前数据',
        dailyVolume: '~2 TB（标注数据 + 实体文件）',
      },

      // ─────────────────────────────────────────────────────────
      // 阶段 5：训练前数据（WebDataset + 预计算特征）
      // ─────────────────────────────────────────────────────────
      {
        id: 'train',
        name: '⑤ 训练前数据',
        subtitle: 'Gold WebDataset + Feature Store',
        icon: '🚀',
        color: '#3fb950',
        location: 'S3 + NVMe 热缓存（JuiceFS）',
        lifecycle: '永久保留（按版本管理）',

        verdict: {
          format: 'WebDataset tar（多模态打包）+ FP16 Parquet（预计算特征）',
          reason: '训练 IO 吞吐 ~2 GB/s，GPU 利用率 90%+',
          score: 5,
        },
        whyThisFormat: [
          'WebDataset tar：消灭小文件问题（2.16亿 JPEG → 5万 shard），顺序读取吞吐 ~2 GB/s vs 随机读 ~50 MB/s',
          'FP16 预计算特征：BEV 特征/语言嵌入离线预计算存 Parquet，训练时直接读取，跳过重计算（节省 40% 训练时间）',
          '为什么不用 TFRecord：TFRecord 是 TensorFlow 专属，PyTorch 生态不友好；WebDataset 框架无关',
          '为什么不用 LMDB：LMDB 不支持分布式读取，多节点训练时需要复制整个数据库',
          '为什么不用 Zarr：Zarr 适合科学计算的多维数组，不适合多模态异构数据',
          'Shard 大小 ~1GB：太小（shard 数量多，调度开销大）/ 太大（单 shard 读取时间长，GPU 等待）',
          '⚠️ 为什么 WebDataset 不能直接替代 MCAP（不能与采集侧统一）：WebDataset 是训练打包格式（面向 GPU 随机采样），MCAP 是原始录制格式（面向时序回放/调试）；WebDataset 里的数据是预处理后的结果（can.npy 是聚合后的状态向量，hist.npy 是积分后的历史轨迹），不是原始信号，无法用于重新标注或回放调试；MCAP 是"原材料仓库"，WebDataset 是"配好料的半成品"，两者都必须保留',
        ],
        storageMedia: {
          title: 'S3 + NVMe 热缓存（JuiceFS）',
          icon: '⚡',
          spec: 'S3 Standard（~50TB 总量）+ JuiceFS 挂载 NVMe 热缓存（训练集群本地，~10TB 缓存）',
          why: 'WebDataset shard 训练时顺序读取，JuiceFS 预取机制将 S3 吞吐从 ~200MB/s 提升到 ~2GB/s（128×A100 集群需要 ~15GB/s 总 IO）；NVMe 热缓存缓存最近访问的 shard（LRU 策略，命中率 ~80%）；预计算特征 Parquet 存 S3，按 scene_id 分区，PyArrow 列裁剪读取',
          lifecycle: '永久保留，按 dataset_version 版本化（LakeFS Git-like 工作流）',
          costNote: 'WebDataset shard：~50TB × $0.023/GB = ~$1150/月；NVMe 热缓存：~10TB NVMe SSD，一次性硬件成本 ~$5K；JuiceFS 元数据存 Redis（~$200/月）',
          alternatives: [
            { name: 'Lustre 并行文件系统', reason: '⚠️ 超大规模训练集群（1000+ GPU）可用，吞吐更高，但成本高 6× 且运维复杂' },
            { name: 'GPFS（IBM Spectrum Scale）', reason: '⚠️ 企业级高性能，但许可证费用高，云原生场景不推荐' },
            { name: '纯 S3 直读', reason: '❌ 吞吐 ~200MB/s，128×A100 训练时 GPU 利用率仅 ~30%，IO 成为瓶颈' },
            { name: 'Alluxio 缓存', reason: '⚠️ 功能类似 JuiceFS，但 JVM 内存开销大，JuiceFS 更轻量（Go 实现）' },
          ],
        },
        schema: {
          desc: 'WebDataset 通过文件命名约定组织数据，无传统 Schema；预计算特征存 Parquet',
          tarLayout: [
            { file: '{scene_id}_{frame_idx:06d}.jpg',        desc: '前摄像头帧（JPEG，~150KB）' },
            { file: '{scene_id}_{frame_idx:06d}.lidar.npy',  desc: '点云矩阵（float32 [N,4]，~500KB）' },
            { file: '{scene_id}_{frame_idx:06d}.radar.npy',  desc: '雷达点云（float32 [M,5]，~5KB，M 个目标点，每点含 x/y/z/径向速度/RCS）' },
            { file: '{scene_id}_{frame_idx:06d}.can.npy',    desc: 'CAN 车辆状态向量（float32 [8]，~0.1KB，含车速/方向盘角度/油门/刹车/横纵向加速度/接管标志/AEB标志，从 can_bus 表按时间戳最近邻查询）' },
            { file: '{scene_id}_{frame_idx:06d}.hist.npy',   desc: '历史轨迹矩阵（float32 [20,3]，~0.2KB，过去 2s 的 ego x/y/yaw，从 CAN+IMU 积分，告诉模型"车刚才怎么走的"）' },
            { file: '{scene_id}_{frame_idx:06d}.label.json', desc: '3D 标注框列表（nuScenes 格式）' },
            { file: '{scene_id}_nav.json',                   desc: 'Scene 级导航指令（{"command":"turn_right","dist_to_junction_m":120}，来自地图导航系统，非 CAN 数据）' },
            { file: '{scene_id}_{frame_idx:06d}.pose.json',  desc: '车体位姿（4×4 变换矩阵）' },
            { file: '{scene_id}_{frame_idx:06d}.meta.json',  desc: '帧元数据（timestamp_us/camera_id/对齐状态）' },
            { file: '{scene_id}_scene_meta.json',            desc: 'Scene 级元数据（天气/城市/标签/帧数）' },
          ],
          featureParquet: {
            name: 'feature_store.offline.bev_features_v2',
            desc: '预计算 BEV 特征（FP16），训练时直接读取，跳过 BEVFusion 推理',
            keyFields: [
              { field: 'scene_id',      type: 'STRING',  desc: '主键' },
              { field: 'frame_id',      type: 'STRING',  desc: '帧 ID' },
              { field: 'bev_feat',      type: 'BINARY',  desc: 'BEV 特征张量（FP16，[256,200,200]，~20MB/帧）' },
              { field: 'lang_embed',    type: 'BINARY',  desc: '语言嵌入（FP16，[1,4096]，~8KB/帧）' },
              { field: 'model_version', type: 'STRING',  desc: '生成特征的模型版本' },
            ],
          },
        },
        accessPatterns: [
          {
            pattern: 'PyTorch 训练读取（标准方式）',
            tool: 'WebDataset + PyTorch DataLoader',
            code: `import webdataset as wds
from torch.utils.data import DataLoader

# Step 1: Iceberg 筛选目标 shard（只读 10% 的 shard）
target_shards = trino.query("""
    SELECT DISTINCT webdataset_shard
    FROM processed_data.scenes.scene_index
    WHERE weather = 'rain' AND has_pedestrian = true
      AND dataset_version = 'v2.3.0'
""").to_list()  # 返回 ~200 个 shard 路径

# Step 2: WebDataset 流式读取
dataset = (
    wds.WebDataset(target_shards, shardshuffle=True)
    .decode("rgb8")                    # JPEG → numpy uint8
    .to_tuple("jpg", "lidar.npy", "label.json", "pose.json")
    .shuffle(buffer_size=2000)         # 跨 shard buffer shuffle
    .map(preprocess_multimodal)
    .batched(32, partial=False)
)
loader = DataLoader(dataset, num_workers=8, pin_memory=True)`,
            note: 'Iceberg 筛选（秒级）→ WebDataset 只读目标 shard（200/50000），IO 吞吐 ~2 GB/s',
          },
          {
            pattern: '读取预计算特征（加速训练）',
            tool: 'PyArrow + PyTorch',
            code: `import pyarrow.parquet as pq
import torch, numpy as np

# 读取预计算 BEV 特征（FP16，跳过 BEVFusion 推理）
def load_bev_feature(scene_id: str, frame_id: str) -> torch.Tensor:
    table = pq.read_table(
        f"s3://features/bev/{scene_id[:8]}/bev_features_v2.parquet",
        filters=[("frame_id", "=", frame_id)],
        columns=["bev_feat"]
    )
    feat_bytes = table["bev_feat"][0].as_py()
    feat = np.frombuffer(feat_bytes, dtype=np.float16)
    return torch.from_numpy(feat.reshape(256, 200, 200))`,
            note: '预计算特征节省 40% 训练时间（跳过 BEVFusion 推理），FP16 存储节省 50% 空间',
          },
          {
            pattern: '调试：随机访问单帧（WebDataset 局限性解决方案）',
            tool: 'Python tarfile',
            code: `import tarfile, json

# Iceberg 查询：找到 scene_id 对应的 shard 路径
row = trino.query(f"""
    SELECT webdataset_shard
    FROM processed_data.scenes.scene_index
    WHERE scene_id = '{scene_id}'
""").fetchone()

# 用 offset 直接定位 tar 包内的文件
with tarfile.open(row.webdataset_shard) as tar:
    tar.fileobj.seek(row.shard_frame_offset)
    member = tar.next()
    img_bytes = tar.extractfile(member).read()`,
            note: 'frames_v2 表新增 shard_frame_offset 字段，解决 WebDataset 随机访问困难的问题',
          },
        ],
        toNextStage: 'GPU 训练（128×A100，~15 GB/s IO 吞吐）',
        dailyVolume: '~50 TB（训练集总量，按版本管理）',
      },
    ],

    // 格式选型决策矩阵
    decisionMatrix: {
      title: '各阶段存储格式选型决策矩阵',
      dimensions: ['格式', '写入方式', '读取方式', '查询能力', '版本管理', '适合规模', '主要局限'],
      formats: [
        { name: 'MCAP',          stage: '采集侧',   write: '流式写入 <1ms', read: '顺序/随机（ChunkIndex）', query: '无 SQL，只能按 topic/时间过滤', version: '文件级', scale: '单车 ~2TB/天', limit: '无结构化查询，不适合云端分析' },
        { name: 'Iceberg+Parquet', stage: 'Bronze/Silver/Gold', write: 'ACID 批量写入', read: 'SQL 谓词下推，列裁剪', query: '完整 SQL，支持 JOIN/聚合/过滤', version: '快照级 Time Travel', scale: '亿级行，PB 级', limit: '不适合直接训练读取（随机 IO）' },
        { name: 'S3 Volume',     stage: 'Bronze/Gold', write: 'PUT 对象', read: 'GET 对象（需知道 key）', query: '无，只能通过 Iceberg 表的 file_path 间接查询', version: '无（依赖 Iceberg）', scale: '无限', limit: '小文件问题（亿级文件时 LIST 极慢）' },
        { name: 'WebDataset tar', stage: '训练前',  write: '批量打包（Ray）', read: '顺序流式读取 ~2GB/s', query: '无，依赖 Iceberg 筛选 shard', version: '文件级（配合 LakeFS）', scale: '万级 shard', limit: '随机访问困难，增量更新需重新打包' },
        { name: 'FP16 Parquet',  stage: '训练前',   write: '离线预计算写入', read: '列裁剪，按 frame_id 过滤', query: '有限 SQL', version: '字段版本化', scale: '百亿行', limit: '特征维度固定，模型更新需重新计算' },
      ],
    },
  },

  // ── 车端采集客户端（工程实现细节）────────────────────────────
  edgeClient: {
    title: '车端采集客户端工程实现',
    subtitle: '从传感器驱动到 MCAP 落盘、增量上传、切分触发的完整工程细节',

    // 车端软件栈
    softwareStack: {
      os: 'Linux 5.15 (RT 实时补丁)',
      middleware: 'ROS2 Humble (DDS: CycloneDDS)',
      runtime: 'NVIDIA Orin + CUDA 11.8',
      container: 'k3s + containerd（各采集进程容器化）',
      recorder: 'mcap-ros2-recorder v2.3（自研扩展）',
      uploader: '自研增量上传 Agent（Go 实现）',
      trigger: '自研触发引擎（C++ 实现，<5ms 响应）',
    },

    // MCAP 文件内部结构
    mcapStructure: {
      title: 'MCAP 文件内部结构（车端落盘格式）',
      desc: 'MCAP 是 Foxglove 开源的多模态容器格式，一个文件包含所有传感器的 Channel，统一时间戳索引',
      fileLayout: [
        { section: 'Header',    desc: 'Magic bytes + 版本 + 库信息', size: '固定 8 bytes' },
        { section: 'Schema',    desc: '每个 Channel 的消息格式定义（Protobuf/ROS2 msg schema）', size: '~几 KB' },
        { section: 'Channel',   desc: '每个传感器对应一个 Channel，含 topic 名、schema_id、元数据', size: '~几百 bytes/Channel' },
        { section: 'Message',   desc: '实际数据帧，含 channel_id + log_time（纳秒）+ publish_time + data', size: '变长，主体数据' },
        { section: 'Chunk',     desc: '消息按时间分块压缩（默认 1s 一个 Chunk，zstd 压缩）', size: '~1~5 MB/Chunk' },
        { section: 'ChunkIndex', desc: 'Chunk 的时间范围索引，支持随机访问', size: '~几十 bytes/Chunk' },
        { section: 'Statistics', desc: '全文件统计（消息数/时间范围/Channel 列表）', size: '~几 KB' },
        { section: 'Footer',    desc: 'SummaryOffset + Magic bytes，文件完整性标志', size: '固定 20 bytes' },
      ],
      channels: [
        { topic: '/camera/front/image_raw',      schema: 'sensor_msgs/CompressedImage', rate: '20Hz', encoding: 'h265',    note: '前视相机，H.265 编码后直接写入' },
        { topic: '/camera/rear/image_raw',       schema: 'sensor_msgs/CompressedImage', rate: '20Hz', encoding: 'h265',    note: '后视相机' },
        { topic: '/camera/left_front/image_raw', schema: 'sensor_msgs/CompressedImage', rate: '20Hz', encoding: 'h265',    note: '左前相机' },
        { topic: '/camera/right_front/image_raw',schema: 'sensor_msgs/CompressedImage', rate: '20Hz', encoding: 'h265',    note: '右前相机' },
        { topic: '/camera/left_rear/image_raw',  schema: 'sensor_msgs/CompressedImage', rate: '20Hz', encoding: 'h265',    note: '左后相机' },
        { topic: '/camera/right_rear/image_raw', schema: 'sensor_msgs/CompressedImage', rate: '20Hz', encoding: 'h265',    note: '右后相机' },
        { topic: '/lidar/points',                schema: 'sensor_msgs/PointCloud2',     rate: '10Hz', encoding: 'draco',   note: 'LiDAR 点云，Draco 压缩' },
        { topic: '/radar/front/targets',         schema: 'custom_msgs/RadarTargets',    rate: '13Hz', encoding: 'protobuf', note: '前向雷达目标列表' },
        { topic: '/radar/rear/targets',          schema: 'custom_msgs/RadarTargets',    rate: '13Hz', encoding: 'protobuf', note: '后向雷达' },
        { topic: '/gnss/fix',                    schema: 'sensor_msgs/NavSatFix',       rate: '10Hz', encoding: 'protobuf', note: 'GNSS 定位' },
        { topic: '/imu/data',                    schema: 'sensor_msgs/Imu',             rate: '100Hz', encoding: 'protobuf', note: 'IMU 加速度/角速度' },
        { topic: '/vehicle/can_signals',         schema: 'custom_msgs/CanSignals',      rate: '100Hz', encoding: 'protobuf', note: 'CAN 总线解码信号（车辆状态：车速/方向盘角度/油门/刹车/档位/接管事件/AEB 触发等）' },
        { topic: '/perception/objects',          schema: 'custom_msgs/PerceptionResult', rate: '10Hz', encoding: 'protobuf', note: '感知结果（用于触发判断）' },
        { topic: '/planning/trajectory',         schema: 'custom_msgs/Trajectory',      rate: '10Hz', encoding: 'protobuf', note: '规划轨迹（用于触发判断）' },
        { topic: '/system/trigger_events',       schema: 'custom_msgs/TriggerEvent',    rate: '事件', encoding: 'protobuf', note: '触发事件记录（接管/AEB/异常）' },
      ],
    },

    // 时间戳同步机制（多模态拼接的基础）
    timestampSync: {
      title: '时间戳同步机制（多模态拼接的基础）',
      desc: '所有传感器必须在同一时钟域内，才能用 timestamp_us 做精确对齐',
      methods: [
        {
          name: 'PTP 硬件同步（主要方案）',
          precision: '< 1 μs',
          desc: 'IEEE 1588 PTP 协议，Orin 作为 PTP Slave，同步到车载 GPS 时钟（PTP Master）。所有传感器通过硬件 trigger 信号对齐到同一时钟域。',
          impl: 'linuxptp (ptp4l + phc2sys) + NVIDIA Orin PTP 硬件支持',
          color: '#6c5ce7',
        },
        {
          name: 'FPGA 触发同步（相机-LiDAR）',
          precision: '< 0.5 ms',
          desc: 'FPGA 产生 trigger 脉冲，同时触发所有相机曝光 + LiDAR 旋转角度标记，消除相机间的相对时延。',
          impl: '自研 FPGA Trigger Board，GPIO 连接各相机 trigger 引脚',
          color: '#00cec9',
        },
        {
          name: 'ROS2 Header 时间戳',
          precision: '< 1 ms（软件层）',
          desc: '每条 ROS2 消息的 header.stamp 使用 CLOCK_REALTIME（已 PTP 同步），写入 MCAP 时同时记录 log_time（接收时间）和 publish_time（发布时间）。',
          impl: 'ROS2 Time API + MCAP log_time/publish_time 双时间戳',
          color: '#fd79a8',
        },
      ],
      alignRule: '云端对齐规则：以 LiDAR 帧时间戳为基准，在 ±5ms 窗口内查找最近的相机帧、雷达帧，超出窗口则标记为对齐失败（丢弃或插值）。',
    },

    // 车端存储策略（落盘逻辑）
    storageStrategy: {
      title: '车端存储策略（落盘逻辑）',
      desc: '车端 NVMe 作为缓冲区，MCAP 文件按 Session 切割，上传后保留 24h 再删除',
      localStorage: {
        device: 'NVMe SSD 2TB（车载）',
        filesystem: 'ext4 + noatime（减少写放大）',
        path: '/data/mcap/{date}/{session_id}/',
        retention: '上传完成后保留 24h，然后删除（保留 24h 用于重传）',
        freeSpaceGuard: '剩余空间 < 200GB 时停止录制，触发告警',
      },
      writeMode: [
        {
          name: '直写模式（Write-Through）',
          desc: '传感器数据直接写入 MCAP 文件，不经过内存缓冲。适合低延迟场景。',
          pros: '延迟低，数据不丢失', cons: 'IOPS 压力大',
          used: '相机（高带宽，需要持续写入）',
        },
        {
          name: '缓冲写模式（Buffered Write）',
          desc: '数据先写入内存环形缓冲区（Ring Buffer），定期 flush 到 MCAP。',
          pros: '减少 IOPS，批量写入效率高', cons: '断电可能丢失缓冲数据',
          used: 'LiDAR / 雷达 / CAN（数据量小，可接受缓冲）',
          bufferSize: '环形缓冲区 512MB，每 1s flush 一次',
        },
        {
          name: '事件触发回写（Retroactive Write）',
          desc: '内存中保留最近 30s 的环形缓冲，触发事件时将缓冲数据回写到独立 MCAP 文件。',
          pros: '捕获事件前的数据', cons: '内存占用大',
          used: '接管/AEB/碰撞事件（需要事件前 15s 数据）',
          bufferSize: '内存环形缓冲 30s × 全模态 ≈ 6GB',
        },
      ],
    },

    // Session 切割时机（核心问题）
    sessionCut: {
      title: 'Session 切割时机（何时产生新 MCAP 文件）',
      desc: '切割 = 关闭当前 MCAP 文件 + 打开新文件，切割点两侧各保留 2s 重叠（防止切割点数据丢失）',
      triggers: [
        {
          trigger: '定时切割（主要）',
          condition: '每 15 分钟自动切割',
          priority: 1,
          detail: '最常见的切割方式。15min = 18,000 相机帧 × 6 路 = 108,000 帧，MCAP 文件大小约 5~15 GB（压缩前）/ 1~3 GB（H.265 压缩后）。',
          color: '#6c5ce7',
          icon: '⏰',
        },
        {
          trigger: '文件大小切割',
          condition: '单文件超过 4 GB',
          priority: 2,
          detail: '防止单文件过大导致上传失败或内存溢出。4GB 约对应 10~12 分钟的录制。',
          color: '#00cec9',
          icon: '📦',
        },
        {
          trigger: '点火/熄火切割',
          condition: 'CAN 信号检测到 IGN_ON / IGN_OFF',
          priority: 3,
          detail: '车辆启动时开始新 Session，熄火时关闭当前 Session。一次 Trip 的边界。',
          color: '#3fb950',
          icon: '🔑',
        },
        {
          trigger: '网络恢复切割',
          condition: '网络从断开恢复，且当前文件 > 5min',
          priority: 4,
          detail: '网络恢复时切割，便于立即上传最新数据，而不是等待当前 Session 结束。',
          color: '#ffa657',
          icon: '📶',
        },
        {
          trigger: '存储空间切割',
          condition: '可用空间 < 500GB',
          priority: 5,
          detail: '存储紧张时缩短 Session 时长（改为 5min 切割），加快上传释放空间。',
          color: '#fd79a8',
          icon: '💾',
        },
      ],
      overlapSeconds: 2,
      namingConvention: '{vehicle_id}_{date}_{start_timestamp_us}_{camera_id}.mcap',
      example: 'v001_20240315_1710460800000000_front.mcap',
    },

    // 增量读取机制（上传 Agent 如何知道哪些是新数据）
    incrementalRead: {
      title: '增量读取机制（上传 Agent 如何感知新数据）',
      desc: '上传 Agent 需要知道：哪些文件是新的、哪些已上传、断点续传从哪里继续',
      methods: [
        {
          name: '文件状态数据库（SQLite）',
          desc: '本地 SQLite 记录每个 MCAP 文件的状态：pending / uploading / uploaded / failed',
          schema: 'files(session_id, file_path, size_bytes, sha256, status, upload_offset, created_at, uploaded_at)',
          how: '录制进程写完文件后，向 SQLite 插入 pending 记录；上传 Agent 轮询 pending 记录，按优先级排序上传。',
          color: '#6c5ce7',
          icon: '🗄️',
        },
        {
          name: 'inotify 文件系统监听',
          desc: 'Linux inotify 监听 /data/mcap/ 目录，文件 CLOSE_WRITE 事件触发上传 Agent 处理。',
          how: '录制进程关闭文件（Session 切割）时，inotify 立即通知上传 Agent，无需轮询，延迟 < 100ms。',
          color: '#00cec9',
          icon: '👁️',
        },
        {
          name: 'S3 Multipart Upload + 断点续传',
          desc: '大文件分块上传（每块 64MB），上传进度记录在 SQLite 的 upload_offset 字段。网络中断后从 offset 继续。',
          how: 'S3 CreateMultipartUpload → UploadPart（记录 offset）→ CompleteMultipartUpload。失败时用 upload_id 继续。',
          color: '#fd79a8',
          icon: '⏸️',
        },
        {
          name: '优先级队列',
          desc: '上传队列按优先级排序：事件触发文件 > 最新 Session > 历史 Session',
          priority: [
            { level: 'P0 紧急', condition: '含接管/AEB/碰撞事件的 Session', delay: '< 5min 上传' },
            { level: 'P1 高',   condition: '最近 1h 内的 Session', delay: '< 30min 上传' },
            { level: 'P2 中',   condition: '当天的 Session', delay: '< 4h 上传' },
            { level: 'P3 低',   condition: '历史 Session（补传）', delay: '空闲时上传' },
          ],
          color: '#ffa657',
          icon: '📋',
        },
      ],
    },

    // Raw 层 Iceberg 一条数据的窗口（核心问题）
    rawIcebergRow: {
      title: 'Raw 层 Iceberg 表：一行数据对应什么粒度？',
      desc: '这是最容易混淆的问题。不同模态的 Iceberg 表，行粒度不同，但都以"单次采样"为基本单元。',
      tables: [
        {
          table: 'raw_data.camera.frames_v2',
          rowUnit: '1 行 = 1 帧（单相机单次曝光）',
          timeWindow: '50ms（20Hz）',
          rowsPerSession: '18,000 行 / Session / 相机 = 108,000 行 / Session（6路）',
          rowsPerDay: '~2.16 亿行 / 天（1000辆车 × 6相机 × 18000帧）',
          keyFields: 'frame_id（主键）, scene_id（外键）, timestamp_us, file_path',
          fileRef: '每行的 file_path 指向 S3 Volume 中的一个 JPEG 文件（~150KB）',
          whenInserted: 'Bronze 层处理时：MCAP 解码 → 每帧抽取 JPEG → 写 S3 → 插入 Iceberg 行',
          color: '#6c5ce7',
          icon: '📷',
        },
        {
          table: 'raw_data.lidar.pointcloud_v2',
          rowUnit: '1 行 = 1 帧（LiDAR 一次旋转扫描）',
          timeWindow: '100ms（10Hz）',
          rowsPerSession: '9,000 行 / Session',
          rowsPerDay: '~900 万行 / 天（1000辆车）',
          keyFields: 'frame_id（主键）, scene_id（外键）, timestamp_us, file_path',
          fileRef: '每行的 file_path 指向 S3 Volume 中的一个 .pcd.draco 文件（~500KB）',
          whenInserted: 'Bronze 层处理时：MCAP 解码 → 每帧提取点云 → Draco 压缩 → 写 S3 → 插入 Iceberg 行',
          color: '#3fb950',
          icon: '🟢',
        },
        {
          table: 'raw_data.radar.radar_4d_v1',
          rowUnit: '1 行 = 1 帧（雷达一次扫描，含所有目标点）',
          timeWindow: '77ms（13Hz）',
          rowsPerSession: '11,700 行 / Session / 雷达 = 58,500 行 / Session（5路）',
          rowsPerDay: '~5.85 亿行 / 天（1000辆车 × 5雷达）',
          keyFields: 'frame_id（主键）, scene_id（外键）, timestamp_us, radar_id, points（LIST<STRUCT>）',
          fileRef: '无 file_path，points 字段直接存 LIST<STRUCT>（x/y/z/v_r/rcs/snr），数据量小可内联',
          whenInserted: 'Bronze 层处理时：MCAP 解码 → 解析雷达目标 → 直接插入 Iceberg 行（无需 Volume）',
          color: '#ffa657',
          icon: '📡',
        },
        {
          table: 'raw_data.vehicle.can_bus',
          rowUnit: '1 行 = 1 个 CAN 采样时刻（100Hz，每 10ms 一条，记录该时刻所有车辆状态信号的快照）',
          timeWindow: '10ms（100Hz）',
          rowsPerSession: '90,000 行 / Session（100Hz × 900s）',
          rowsPerDay: '~9000 万行 / 天（1000辆车）',
          keyFields: 'record_id（主键）, scene_id（外键）, timestamp_us, speed_mps（车速 m/s）, steering_angle_deg（方向盘角度）, throttle_pct（油门 0-100%）, brake_pct（制动踏板 0-100%）, gear（档位 P/R/N/D）, is_takeover（人工接管标志）, is_aeb（AEB 触发标志）, lateral_accel / longitudinal_accel（横纵向加速度）',
          fileRef: '无 file_path，所有信号字段直接存 Parquet 列（宽表设计，数据量小 ~5GB/天）',
          whenInserted: 'Bronze 层处理时：MCAP 解码 /vehicle/can_signals 消息 → DBC 文件解析原始 CAN 帧为工程量信号 → 直接插入 Iceberg 行',
          color: '#00cec9',
          icon: '🔌',
        },
        {
          table: 'raw_data.camera.video_sessions',
          rowUnit: '1 行 = 1 个 Session（一个 MCAP 文件对应的视频段）',
          timeWindow: '15 分钟（900s）',
          rowsPerSession: '1 行 / Session / 相机 = 6 行 / Session（6路）',
          rowsPerDay: '~6000 行 / 天（1000辆车 × 6相机 × 1 Session均值）',
          keyFields: 'session_id（主键）, vehicle_id, camera_id, start_time, end_time, file_path',
          fileRef: '每行的 file_path 指向 S3 Volume 中的一个 MP4 文件（~1~3GB）',
          whenInserted: 'Landing Zone 处理时：MCAP 上传完成 → 提取视频流 → 写 S3 → 插入 Iceberg 行',
          color: '#e84393',
          icon: '🎬',
        },
      ],
      // 关键结论
      keyInsights: [
        { insight: 'Bronze 层相机数据：不解码视频，不存帧级表。用 session_index 表（1行=1个 MCAP 文件）管理相机数据', detail: 'MCAP 里存的是 H.265 视频流，不是 JPEG。解码成本高，且 Bronze 层不需要图像内容。全量解码存 JPEG 会产生 2.16 亿个小文件，70% 会在去重后丢弃。' },
        { insight: 'LiDAR/雷达例外：Bronze 层就解码存帧级表，用于场景切分时的时序对齐', detail: 'LiDAR 数据量小（~900万帧/天），解码成本低，帧级 Parquet 表用于场景切分时的时序对齐和标注。雷达数据直接内联存 Parquet。' },
        { insight: 'Silver 层也不解码视频：scene_index 是核心表，1行=1个 Scene', detail: 'Silver 层只需要 CAN + LiDAR 时间戳做场景切分。CLIP 去重只抽取 1~3 帧关键帧计算嵌入，不全量解码。' },
        { insight: 'Gold 层才解码视频：只对去重后保留的 Scene（~30%）解码，直接打包 WebDataset', detail: '解码 → 直接写入 tar shard，不单独存 JPEG 文件。这样只解码需要的数据，消灭小文件问题。' },
        { insight: 'CAN/雷达数据内联存储，不需要 Volume', detail: 'CAN（车辆总线信号，100Hz，~5GB/天）和雷达（~50GB/天）数据量小，直接存 Parquet 列，避免小文件问题。CAN 数据包含车速/方向盘/油门/刹车/接管事件，是场景切分和长尾挖掘的核心依据。' },
      ],
    },

    // 多模态拼接规则（云端处理时）
    joinRules: {
      title: '多模态拼接规则（Bronze → Silver 处理时）',
      desc: '云端处理时，如何将不同采样率的传感器数据对齐拼接',
      baseModality: 'LiDAR（10Hz）作为时间基准，其他模态向 LiDAR 帧对齐',
      rules: [
        {
          modality: '相机 → LiDAR 对齐',
          method: '最近邻匹配',
          tolerance: '±5ms',
          detail: '对每个 LiDAR 帧（100ms 间隔），在 ±5ms 窗口内查找最近的相机帧。20Hz 相机帧间隔 50ms，理论上每个 LiDAR 帧都能找到对应相机帧。',
          fallback: '超出 ±5ms 则标记 camera_aligned=false，该帧不参与 BEV 融合',
          color: '#6c5ce7',
        },
        {
          modality: '雷达 → LiDAR 对齐',
          method: '最近邻匹配 + 线性插值',
          tolerance: '±10ms',
          detail: '雷达 13Hz（77ms 间隔），LiDAR 10Hz（100ms 间隔）。用线性插值将雷达点云插值到 LiDAR 时间戳，补偿 ~40ms 的时间差。',
          fallback: '超出 ±10ms 则标记 radar_aligned=false',
          color: '#ffa657',
        },
        {
          modality: 'CAN → 任意帧对齐',
          method: '时间范围查询',
          tolerance: '±10ms',
          detail: 'CAN（Controller Area Network，车辆总线）100Hz（10ms 间隔），记录车速/方向盘/油门/刹车/接管事件等车辆状态。对任意传感器帧，在 ±10ms 内查找最近的 CAN 记录，获取该时刻的车辆状态（用于场景标签生成：如 has_takeover / has_aeb / 高速/低速场景分类）。CAN 密度足够（100Hz），几乎总能找到对应记录。',
          fallback: '极少情况下 CAN 丢包，用前后两条记录线性插值',
          color: '#00cec9',
        },
        {
          modality: 'GNSS/IMU → 任意帧对齐',
          method: 'IMU 积分推算',
          tolerance: '无限制（IMU 100Hz，总能覆盖）',
          detail: 'IMU 100Hz，用 IMU 积分（预积分）推算任意时刻的车体位姿，精度 < 1cm（短时间内）。GNSS 10Hz 用于修正 IMU 漂移。',
          fallback: 'GNSS 信号丢失时纯 IMU 推算，误差随时间累积',
          color: '#3fb950',
        },
      ],
      sceneJoinSQL: `-- Silver 层场景切分后，将 LiDAR 帧归属到 scene_id
-- 雷达/CAN 已聚合进 scene_index，无需回填帧级表

-- 步骤1：将 scene_id 回填到 lidar_frames
UPDATE raw_data.lidar.lidar_frames l
SET scene_id = s.scene_id
FROM processed_data.scenes.scene_index s
WHERE l.timestamp_us BETWEEN s.start_us AND s.end_us
  AND l.vehicle_id = s.vehicle_id;

-- 步骤2：训练采样（通过 scene_index 直接读取，无需 JOIN 雷达/CAN 帧级表）
SELECT
  s.scene_id,
  s.avg_speed_mps,          -- CAN 聚合字段，直接可用
  s.radar_nearest_m,        -- 雷达聚合字段，直接可用
  s.has_takeover,
  l.pcd_path     AS lidar_path,
  l.ego_pose_json
FROM processed_data.scenes.scene_index s
JOIN raw_data.lidar.lidar_frames l
  ON s.scene_id = l.scene_id
WHERE s.scene_id = 'v001_20240315_s003_0042'
ORDER BY l.timestamp_us`,
    },
  },

  // ── 多模态数据链路（车端→训练全链路）──────────────────────────
  dataChain: {
    title: '多模态数据链路（车端 → 训练全链路）',
    stages: [
      {
        name: '车端采集',
        icon: '🚗',
        color: '#6c5ce7',
        location: 'Edge (Orin)',
        modalities: [
          { name: '环视相机 ×6', format: 'H.265 / JPEG', rate: '20Hz', size: '~180MB/s', compress: 'H.265 5:1' },
          { name: 'LiDAR ×1',    format: 'MCAP / PCD',   rate: '10Hz', size: '~30MB/s',  compress: 'Draco 4:1' },
          { name: '毫米波雷达 ×5', format: 'CSV / Binary', rate: '13Hz', size: '~2MB/s',   compress: 'zstd' },
          { name: 'GNSS/IMU',    format: 'NMEA / Binary', rate: '100Hz', size: '~0.1MB/s', compress: '无' },
          { name: 'CAN Bus',     format: 'DBC / Binary',  rate: '100Hz', size: '~0.05MB/s', compress: '无' },
        ],
        output: 'MCAP 多模态容器（统一时间戳）',
        dailyVolume: '~2 TB/车（压缩后 ~400 GB）',
      },
      {
        name: 'Landing Zone',
        icon: '📥',
        color: '#ff7b72',
        location: 'S3 Standard',
        desc: '原始数据着陆，保留原始格式，7 天生命周期',
        format: 'MCAP / ROS2 Bag',
        partition: 'vehicle_id / date / session_id',
        lifecycle: '7 天 → 归档',
        dailyVolume: '~8 TB（1000辆车上传）',
        ops: ['SHA-256 完整性校验', 'Kafka 消息确认', '元数据注册到 Unity Catalog'],
      },
      {
        name: 'Bronze Layer',
        icon: '🟤',
        color: '#ffa657',
        location: 'S3 + JuiceFS 缓存',
        desc: '解码 + 时间戳对齐 + 坐标系统一，按模态拆分存储',
        format: 'Parquet（结构化）+ Volume（非结构化）',
        partition: 'date / vehicle_id / modality',
        lifecycle: '90 天热存储',
        dailyVolume: '~6 TB',
        modalStorage: [
          { modality: '相机帧', format: 'JPEG（原始）/ Parquet（元数据）', partition: 'date/camera_id/hour', size: '~4 TB/天' },
          { modality: '点云',   format: 'PCD + Draco 压缩 / Parquet（元数据）', partition: 'date/lidar_id/hour', size: '~800 GB/天' },
          { modality: '雷达',   format: 'Parquet（结构化点云）', partition: 'date/radar_id', size: '~50 GB/天' },
          { modality: '位姿/IMU', format: 'Parquet（时序）', partition: 'date/vehicle_id', size: '~10 GB/天' },
          { modality: 'CAN',   format: 'Parquet（信号解码）', partition: 'date/vehicle_id', size: '~5 GB/天' },
        ],
      },
      {
        name: 'Silver Layer',
        icon: '⚪',
        color: '#79c0ff',
        location: 'S3 Standard-IA',
        desc: '清洗 + 去重 + 多模态时序对齐 + 场景切分',
        format: 'Parquet + Iceberg (Schema V2)',
        partition: 'scene_id / date / city',
        lifecycle: '1 年温存储',
        dailyVolume: '~4 TB',
        ops: [
          '时间戳对齐（PTP 精度 <1μs，软件插值 <5ms）',
          '坐标系统一（相机/LiDAR/雷达 → 车体坐标系）',
          '场景切分（按时间窗口 20s / 按事件触发）',
          '去重（感知哈希 + CLIP 嵌入相似度）',
          '质量过滤（模糊帧/遮挡/传感器故障剔除）',
        ],
      },
      {
        name: 'Gold Layer',
        icon: '🟡',
        color: '#3fb950',
        location: 'S3 + NVMe 热缓存',
        desc: '自动标注 + 人工审核 + 训练就绪数据集',
        format: 'WebDataset tar + Iceberg（索引）',
        partition: 'dataset_version / split（train/val/test）',
        lifecycle: '永久保留',
        dailyVolume: '~2 TB',
        annotations: [
          { type: '3D 检测框', tool: 'BEVFusion 自动标注', autoRate: '90%', format: 'nuScenes JSON' },
          { type: '语义分割', tool: 'SAM2 自动分割', autoRate: '85%', format: 'PNG mask + RLE' },
          { type: '车道线',   tool: 'MapTR 自动提取', autoRate: '92%', format: 'Polyline JSON' },
          { type: '语言描述', tool: 'InternVL2 生成', autoRate: '70%', format: 'JSON QA pairs' },
          { type: '轨迹标注', tool: 'MTR 预测 + 人工校正', autoRate: '80%', format: 'Trajectory JSON' },
        ],
      },
    ],
  },

  // ── Iceberg 表 Schema 设计 ────────────────────────────────────
  icebergSchemas: {
    title: 'Iceberg 表 Schema 设计 & 多模态关联',
    desc: '所有模态通过 scene_id + frame_id 双键关联，文件路径存 Iceberg 表，实体存 S3 Volume',

    // ── 数据粒度层次（最重要，先看这里）────────────────────────
    granularity: {
      title: '数据粒度层次（从大到小）',
      desc: '理解四层粒度是读懂所有 Schema 的前提',
      levels: [
        {
          level: 'Trip（行程）',
          icon: '🚗',
          color: '#6c5ce7',
          duration: '30 分钟 ~ 4 小时',
          size: '~50 GB ~ 400 GB（压缩后）',
          desc: '车辆一次完整出行，从点火到熄火。一辆车每天 1~3 次 Trip。',
          keyId: 'trip_id',
          icebergTable: '无独立表，通过 vehicle_id + date 隐式标识',
          example: '早高峰通勤：07:30 出发 → 08:45 到达，约 75 分钟',
          note: '⚠️ Trip 不是存储单元，只是逻辑概念，不对应 Iceberg 表',
        },
        {
          level: 'Session（录制段）',
          icon: '🎬',
          color: '#e84393',
          duration: '10 ~ 30 分钟（默认 15 分钟自动切割）',
          size: '~5 ~ 15 GB（压缩前）/ ~1 ~ 3 GB（H.265 压缩后）',
          desc: '车端按固定时长自动切割的连续录制片段，是视频文件的存储单元。一次 Trip 包含 2~16 个 Session。',
          keyId: 'session_id',
          icebergTable: 'raw_data.camera.video_sessions（每个 Session 一行）',
          example: 'session_v001_20240315_s003：07:30:00 ~ 07:45:00，15 分钟，6 路相机各一个 MP4 文件',
          note: '💡 Session 是视频文件的粒度。一个 Session = 6 个相机视频文件（6路环视）',
          videoFiles: '6 路相机 × 1 个 MP4 = 6 个视频文件 / Session',
          frameCount: '15 min × 60s × 20Hz = 18,000 帧 / Session / 相机',
        },
        {
          level: 'Scene（场景）',
          icon: '🎯',
          color: '#ffa657',
          duration: '20 秒（固定窗口）或 10 ~ 60 秒（事件触发）',
          size: '~200 ~ 600 MB（所有模态）',
          desc: '从 Session 中切割出的有意义片段，是训练数据的基本单元。一个 Session 包含 ~45 个 Scene（20s 固定切割）。',
          keyId: 'scene_id',
          icebergTable: 'processed_data.scenes.scene_index（每个 Scene 一行）',
          example: 'scene_v001_20240315_s003_0042：07:37:20 ~ 07:37:40，20 秒，400 帧（相机）/ 200 帧（LiDAR）',
          note: '💡 Scene 是标注和训练的粒度。一个 WebDataset shard 包含 ~50 个 Scene',
          cutStrategy: [
            { type: '固定窗口切割', desc: '每 20s 切一个 Scene，用于基线数据积累', ratio: '~70%' },
            { type: '事件触发切割', desc: '接管/急刹/AEB 触发，前后各 15s，共 30s', ratio: '~20%' },
            { type: '场景触发切割', desc: '检测到施工区/恶劣天气/复杂路口，10~60s', ratio: '~10%' },
          ],
        },
        {
          level: 'Frame（帧）',
          icon: '🖼️',
          color: '#3fb950',
          duration: '50ms（相机 20Hz）/ 100ms（LiDAR 10Hz）/ 77ms（雷达 13Hz）',
          size: '~150 KB（单相机 JPEG）/ ~500 KB（点云 PCD）',
          desc: '单个传感器的一次采样，是 Iceberg 表的最小存储粒度（每行 = 一帧）。',
          keyId: 'frame_id',
          icebergTable: 'raw_data.camera.frames_v2 / raw_data.lidar.pointcloud_v2 / raw_data.radar.radar_4d_v1',
          example: 'frame_v001_20240315_s003_0042_1710460800123456：时间戳精确到微秒',
          note: '💡 Frame 是 Iceberg 表的行粒度。一个 Scene（20s）= 400 相机帧 + 200 LiDAR 帧 + 260 雷达帧',
          rowsPerScene: {
            camera: '400 行 / Scene（20Hz × 20s）× 6 相机 = 2400 行',
            lidar: '200 行 / Scene（10Hz × 20s）',
            radar: '260 行 / Scene（13Hz × 20s）× 5 雷达 = 1300 行',
            can: '2000 行 / Scene（100Hz × 20s）',
          },
        },
      ],
      // 粒度换算关系
      conversion: [
        { from: '1 Trip',    to: '2~16 Sessions',    note: '按 15min 自动切割' },
        { from: '1 Session', to: '~45 Scenes',        note: '20s 固定窗口' },
        { from: '1 Scene',   to: '400 相机帧',         note: '20Hz × 20s' },
        { from: '1 Scene',   to: '200 LiDAR 帧',       note: '10Hz × 20s' },
        { from: '1 Session', to: '18,000 相机帧',      note: '20Hz × 15min × 60s' },
        { from: '1 Session', to: '6 个视频文件',        note: '6 路环视相机各一个 MP4' },
        { from: '1 Session', to: '~1~3 GB 视频',       note: 'H.265 压缩后' },
        { from: '1 天',      to: '~1000 Sessions',     note: '1000辆车 × 1 Session/车（均值）' },
      ],
    },

    // 核心关联键说明
    joinKeys: [
      { key: 'scene_id',    type: 'STRING',  desc: '场景唯一标识，格式 {vehicle_id}_{date}_{session}_{seq}，所有模态表的主关联键', example: 'v001_20240315_s003_0042' },
      { key: 'frame_id',    type: 'STRING',  desc: '帧唯一标识，格式 {scene_id}_{timestamp_us}，精确到微秒', example: 'v001_20240315_s003_0042_1710460800123456' },
      { key: 'timestamp_us', type: 'LONG',   desc: 'Unix 时间戳（微秒），所有模态时序对齐的基准', example: '1710460800123456' },
      { key: 'vehicle_id',  type: 'STRING',  desc: '车辆唯一标识，用于多租户隔离和行级权限过滤', example: 'v001' },
    ],

    // 各模态 Iceberg 表 Schema
    tables: [
      {
        name: 'raw_data.sessions.session_index',
        icon: '🎬',
        color: '#6c5ce7',
        desc: 'Session 元数据表（Bronze 层核心表，1行=1个MCAP文件=15min录制段）。相机数据不存帧级表，通过 mcap_path 读取原始 MCAP 文件。',
        partitionBy: 'days(event_time), vehicle_id',
        sortBy: 'vehicle_id, start_us',
        fields: [
          { name: 'session_id',       type: 'STRING',       nullable: false, pk: true,  desc: '主键，格式 {vehicle_id}_{start_timestamp_us}' },
          { name: 'vehicle_id',       type: 'STRING',       nullable: false, pk: false, desc: '车辆 ID，行级权限过滤' },
          { name: 'start_us',         type: 'LONG',         nullable: false, pk: false, desc: 'Session 开始时间戳（微秒）' },
          { name: 'end_us',           type: 'LONG',         nullable: false, pk: false, desc: 'Session 结束时间戳（微秒）' },
          { name: 'duration_s',       type: 'FLOAT',        nullable: false, pk: false, desc: '时长（秒），典型值 900s = 15min' },
          { name: 'event_time',       type: 'TIMESTAMP',    nullable: false, pk: false, desc: '分区字段（由 start_us 转换）' },
          { name: 'mcap_path',        type: 'STRING',       nullable: false, pk: false, desc: 'S3 MCAP 文件路径，如 s3://landing/{vehicle_id}/{date}/{session_id}.mcap' },
          { name: 'mcap_size_bytes',  type: 'LONG',         nullable: false, pk: false, desc: 'MCAP 文件大小（字节），典型值 5~15 GB' },
          { name: 'camera_channels',  type: 'LIST<STRING>', nullable: true,  pk: false, desc: '可用相机 Channel 列表，如 [front, rear, left_front, ...]' },
          { name: 'camera_fps',       type: 'INT',          nullable: false, pk: false, desc: '相机帧率（Hz），典型值 20' },
          { name: 'camera_frame_count', type: 'INT',        nullable: false, pk: false, desc: '相机总帧数（所有相机之和），典型值 108000（6路×18000帧）' },
          { name: 'has_lidar',        type: 'BOOLEAN',      nullable: false, pk: false, desc: 'LiDAR 数据是否完整' },
          { name: 'has_radar',        type: 'BOOLEAN',      nullable: false, pk: false, desc: '雷达数据是否完整' },
          { name: 'has_can',          type: 'BOOLEAN',      nullable: false, pk: false, desc: 'CAN 总线数据是否完整（车速/方向盘/油门/刹车/接管事件等车辆状态信号）' },
          { name: 'intrinsic_json',   type: 'STRING',       nullable: true,  pk: false, desc: '相机内参 JSON（Session 级别，从 MCAP Header 提取，不需要每帧存）' },
          { name: 'extrinsic_json',   type: 'STRING',       nullable: true,  pk: false, desc: '外参 JSON（Session 级别）' },
          { name: 'cut_reason',       type: 'STRING',       nullable: false, pk: false, desc: 'Session 切割原因：timer_15min / file_size / ign_off / network_resume' },
          { name: 'upload_status',    type: 'STRING',       nullable: false, pk: false, desc: 'pending / uploaded / verified' },
        ],
        volumeRef: 'raw_data.sessions.mcap_volume（实体 MCAP 文件，~5~15GB/Session）',
        note: '⚠️ 相机数据不在 Iceberg 帧级表中。访问相机帧需要：1) 查 session_index 得到 mcap_path；2) 用 mcap 库按时间范围解码视频流。Gold 层打包时才解码，直接写入 WebDataset shard。',
        joinExample: '-- 查找某辆车某天的所有 Session\nSELECT session_id, start_us, end_us, mcap_path, camera_frame_count\nFROM raw_data.sessions.session_index\nWHERE vehicle_id = \'v001\'\n  AND DATE(event_time) = \'2024-03-15\'\nORDER BY start_us',
      },
      {
        name: 'raw_data.lidar.lidar_frames',
        icon: '🟢',
        color: '#3fb950',
        desc: 'LiDAR 帧级元数据表（Bronze 层，1行=1帧，实体 PCD 文件存 Volume）',
        partitionBy: 'days(event_time)',
        sortBy: 'session_id, timestamp_us',
        fields: [
          { name: 'frame_id',           type: 'STRING',    nullable: false, pk: true,  desc: '主键，格式 {session_id}_{timestamp_us}' },
          { name: 'scene_id',           type: 'STRING',    nullable: true,  pk: false, desc: '外键，Silver 层场景切分后回填（初始为 NULL）' },
          { name: 'session_id',         type: 'STRING',    nullable: false, pk: false, desc: '外键，关联 session_index，Bronze 层写入时填充' },
          { name: 'vehicle_id',         type: 'STRING',    nullable: false, pk: false, desc: '车辆 ID' },
          { name: 'timestamp_us',       type: 'LONG',      nullable: false, pk: false, desc: 'Unix 时间戳（微秒），多模态对齐基准' },
          { name: 'event_time',         type: 'TIMESTAMP', nullable: false, pk: false, desc: '分区字段' },
          { name: 'pcd_path',           type: 'STRING',    nullable: false, pk: false, desc: 'S3 Volume 路径，指向 .pcd.draco 文件（~500KB）' },
          { name: 'num_points',         type: 'INT',       nullable: false, pk: false, desc: '点云点数（典型值 ~100K）' },
          { name: 'range_m',            type: 'FLOAT',     nullable: false, pk: false, desc: '最大探测距离（米）' },
          { name: 'ego_pose_json',      type: 'STRING',    nullable: true,  pk: false, desc: '车体位姿 JSON（4×4 变换矩阵，坐标系转换用）' },
          { name: 'bbox_3d_count',      type: 'INT',       nullable: true,  pk: false, desc: '自动标注 3D 框数量（Gold 层标注完成后回填）' },
        ],
        volumeRef: 'raw_data.lidar.pcd_volume（实体 .pcd.draco 文件）',
        note: 'LiDAR 是唯一保留帧级表的模态，仅用于 Bronze 层场景切分时的时序对齐。Gold 层打包 WebDataset 后此表不再参与训练。',
        joinExample: 'JOIN processed_data.scenes.scene_index USING (scene_id)',
      },
      {
        name: 'processed_data.scenes.scene_index',
        icon: '🎬',
        color: '#a29bfe',
        desc: '场景索引表（所有模态的汇聚入口，训练采样的唯一核心表）。雷达和 CAN 数据不单独建帧级表，直接聚合进此表。',
        partitionBy: 'days(start_time), city',
        sortBy: 'scene_id',
        fields: [
          { name: 'scene_id',              type: 'STRING',       nullable: false, pk: true,  desc: '场景唯一标识，格式 {vehicle_id}_{date}_{session}_{seq}' },
          { name: 'vehicle_id',            type: 'STRING',       nullable: false, pk: false, desc: '车辆 ID，行级权限过滤' },
          { name: 'session_id',            type: 'STRING',       nullable: false, pk: false, desc: '外键，关联 session_index（来自哪个 MCAP 文件）' },
          { name: 'start_time',            type: 'TIMESTAMP',    nullable: false, pk: false, desc: '场景开始时间（分区字段）' },
          { name: 'start_us',              type: 'LONG',         nullable: false, pk: false, desc: '开始时间戳（微秒），用于从 MCAP 按时间范围解码' },
          { name: 'end_us',                type: 'LONG',         nullable: false, pk: false, desc: '结束时间戳（微秒）' },
          { name: 'duration_s',            type: 'FLOAT',        nullable: false, pk: false, desc: '时长（秒），典型值 20s' },
          { name: 'city',                  type: 'STRING',       nullable: false, pk: false, desc: '城市（分区字段）' },
          { name: 'weather',               type: 'STRING',       nullable: true,  pk: false, desc: 'sunny/rainy/foggy/night' },
          { name: 'scenario_tags',         type: 'LIST<STRING>', nullable: true,  pk: false, desc: '场景标签 [long_tail, highway, intersection, ...]' },
          { name: 'cut_reason',            type: 'STRING',       nullable: false, pk: false, desc: '切割原因：fixed_window / takeover / aeb / bad_weather / construction' },

          { name: 'has_lidar',             type: 'BOOLEAN',      nullable: false, pk: false, desc: 'LiDAR 数据完整性' },
          { name: 'has_radar',             type: 'BOOLEAN',      nullable: false, pk: false, desc: '雷达数据完整性' },
                { name: 'has_can',               type: 'BOOLEAN',      nullable: false, pk: false, desc: 'CAN 总线数据完整性（车速/方向盘/油门/刹车/接管事件等车辆状态信号）' },

          { name: 'avg_speed_mps',         type: 'FLOAT',        nullable: true,  pk: false, desc: '场景内平均车速（m/s），从 CAN 数据聚合' },
          { name: 'max_accel_mps2',        type: 'FLOAT',        nullable: true,  pk: false, desc: '最大纵向加速度（m/s²），急加速场景识别用' },
          { name: 'max_brake_pct',         type: 'FLOAT',        nullable: true,  pk: false, desc: '最大制动开度（%），急刻场景识别用' },
          { name: 'has_takeover',          type: 'BOOLEAN',      nullable: false, pk: false, desc: '是否含接管事件（从 CAN takeover_flag 检测）' },
          { name: 'has_aeb',               type: 'BOOLEAN',      nullable: false, pk: false, desc: '是否触发 AEB（从 CAN 检测）' },
          { name: 'ego_trajectory',        type: 'BINARY',       nullable: true,  pk: false, desc: '未来轨迹 GT（FP32 [N,3]，x/y/yaw），从 GNSS/IMU 提取，训练时作为监督信号（模型需预测这个轨迹）' },
          { name: 'ego_traj_hist_json',    type: 'STRING',       nullable: true,  pk: false, desc: '历史轨迹（过去 2s，[20帧×(x,y,yaw)]，从 CAN 速度/方向盘积分 + IMU 修正），训练时作为输入特征，告诉模型"车刚才怎么走的"' },
          { name: 'nav_command',           type: 'STRING',       nullable: true,  pk: false, desc: '导航路口指令：go_straight / turn_left / turn_right / u_turn / change_lane_left / change_lane_right / follow_lane（来自地图导航系统，非 CAN 数据，训练时作为高层意图输入）' },

          { name: 'radar_target_count_avg', type: 'FLOAT',       nullable: true,  pk: false, desc: '场景内雷达平均目标数，从雷达数据聚合' },
          { name: 'radar_nearest_m',       type: 'FLOAT',        nullable: true,  pk: false, desc: '场景内雷达最近目标距离（米），近距驾驶场景识别用' },
          { name: 'radar_has_oncoming',    type: 'BOOLEAN',      nullable: true,  pk: false, desc: '是否有迎面车（径向速度 v_r > 5m/s）' },

          { name: 'has_pedestrian',         type: 'BOOLEAN',      nullable: true,  pk: false, desc: '是否含行人目标（从标注聚合，Gold 层打包后回填）' },
          { name: 'has_vehicle',            type: 'BOOLEAN',      nullable: true,  pk: false, desc: '是否含车辆目标' },
          { name: 'has_cyclist',            type: 'BOOLEAN',      nullable: true,  pk: false, desc: '是否含骑行者目标' },
          { name: 'object_count_avg',       type: 'FLOAT',        nullable: true,  pk: false, desc: '场景内每帧平均目标数（从 bbox_3d 聚合）' },
          { name: 'category_stats_json',    type: 'STRING',       nullable: true,  pk: false, desc: '各类别目标数 JSON，如 {"car":120,"pedestrian":30}，用于数据集统计' },
          { name: 'label_source',           type: 'STRING',       nullable: true,  pk: false, desc: '标注来源：auto_bevfusion / human / auto+human' },
          { name: 'label_confidence_avg',   type: 'FLOAT',        nullable: true,  pk: false, desc: '平均标注置信度（< 0.9 说明自动标注质量低，需人工复核）' },
          { name: 'qa_pairs_json',          type: 'STRING',       nullable: true,  pk: false, desc: 'VLA 训练用 QA 对 JSON 数组（场景级，Gold 层打包后回填）' },

          { name: 'dedup_hash',            type: 'STRING',       nullable: true,  pk: false, desc: '场景感知哈希（pHash），Hamming 距离 < 8 则标记重复' },
          { name: 'clip_embedding',        type: 'BINARY',       nullable: true,  pk: false, desc: 'CLIP ViT-L/14 场景嵌入（FP16，512维），余弦相似度 > 0.95 则去重' },
          { name: 'is_duplicate',          type: 'BOOLEAN',      nullable: false, pk: false, desc: '是否被标记为重复（去重后丢弃）' },
          { name: 'annotation_status',     type: 'STRING',       nullable: false, pk: false, desc: '标注状态：pending / auto_labeled / human_reviewed / rejected' },
          { name: 'dataset_split',         type: 'STRING',       nullable: true,  pk: false, desc: '训练集划分 train/val/test' },
          { name: 'dataset_version',       type: 'STRING',       nullable: true,  pk: false, desc: '所属数据集版本（Gold 层打包后回填）' },
          { name: 'webdataset_shard',      type: 'STRING',       nullable: true,  pk: false, desc: 'WebDataset shard 路径（Gold 层打包后回填，训练直接读取）' },
        ],
        volumeRef: '无 Volume，此表是整个数据链路唯一的 Iceberg 索引表（配合 session_index）。所有模态原始数据均在 MCAP 文件中，标注/雷达/CAN 均聚合为字段，训练时通过 webdataset_shard 直接读取 shard，零 JOIN。',
        note: '⚠️ 这是 Silver/Gold 层唯一的 Iceberg 表。lidar_frames/bbox_3d/seg_masks/language_qa 等帧级表均已删除——原始数据在 MCAP 中，标注聚合为字段，详细标注打包进 WebDataset shard。',
        joinExample: `-- 训练采样：一张表，零 JOIN
SELECT webdataset_shard
FROM processed_data.scenes.scene_index
WHERE annotation_status = 'human_reviewed'
  AND is_duplicate = false
  AND has_pedestrian = true   -- 标注聚合字段，无需 JOIN bbox_3d
  AND radar_nearest_m < 20   -- 雷达聚合字段，无需 JOIN 雷达表
  AND avg_speed_mps > 5      -- CAN 聚合字段，无需 JOIN CAN 表
  AND dataset_version = 'v2.3.0'`,
      },
    ],

    // 视频数据存储方案（专项说明）
    videoStorage: {
      title: '视频数据存储方案',
      desc: '视频不直接存 Iceberg 表，而是文件存 Volume + 元数据存 Iceberg，通过 session_id 关联',
      strategy: [
        {
          type: '原始录制视频',
          format: 'H.265 MP4 / MCAP 容器',
          where: 'S3 Volume: raw_data.camera.video_volume',
          path: 's3://raw/camera/{vehicle_id}/{date}/{session_id}/front_camera.mp4',
          icebergRef: 'raw_data.camera.video_sessions 表（元数据）',
          note: '1 Session = 15 分钟连续录制，6 路相机各 1 个 MP4，共 6 文件。文件大小 ~1~3 GB/文件（H.265）。一次 Trip（30min~4h）= 2~16 个 Session。',
          color: '#6c5ce7',
        },
        {
          type: '关键帧（训练用）',
          format: 'JPEG / WebP',
          where: 'S3 Volume: raw_data.camera.frames_volume',
          path: 's3://raw/camera/{vehicle_id}/{date}/{scene_id}/{frame_id}.jpg',
          icebergRef: 'raw_data.camera.frames_v2 表（file_path 字段指向此路径）',
          note: '⚠️ Bronze 层：从视频按 20Hz 抽帧，存独立 JPEG（file_path 指向单帧）。Gold 层打包后：file_path 仍保留（调试用），新增 shard_path + shard_frame_offset（训练用）。训练时应走 shard，不走单帧 JPEG。',
          color: '#3fb950',
        },
        {
          type: '事件回放视频',
          format: 'MP4（H.264）',
          where: 'S3 Volume: governance.audit.replay_volume',
          path: 's3://governance/replay/{vehicle_id}/{event_id}/replay.mp4',
          icebergRef: 'governance.audit.event_log 表（replay_path 字段）',
          note: '接管/碰撞事件的完整回放，合规留存 3 年',
          color: '#ffa657',
        },
      ],
      videoSessionSchema: {
        name: 'raw_data.camera.video_sessions',
        desc: '视频 Session 元数据表（与帧表通过 session_id 关联）',
        fields: [
          { name: 'session_id',   type: 'STRING',    desc: 'Session 唯一标识' },
          { name: 'vehicle_id',   type: 'STRING',    desc: '车辆 ID' },
          { name: 'camera_id',    type: 'STRING',    desc: '相机编号' },
          { name: 'start_time',   type: 'TIMESTAMP', desc: '录制开始时间' },
          { name: 'end_time',     type: 'TIMESTAMP', desc: '录制结束时间' },
          { name: 'duration_s',   type: 'FLOAT',     desc: '时长（秒）' },
          { name: 'fps',          type: 'INT',       desc: '帧率' },
          { name: 'resolution',   type: 'STRING',    desc: '分辨率 1920x1080' },
          { name: 'codec',        type: 'STRING',    desc: '编码格式 H.265/H.264' },
          { name: 'file_path',    type: 'STRING',    desc: 'S3 Volume 视频文件路径' },
          { name: 'file_size_mb', type: 'LONG',      desc: '文件大小（MB）' },
          { name: 'frame_count',  type: 'INT',       desc: '总帧数' },
        ],
      },
    },

    // 多模态关联关系（ER 图）
    erDiagram: {
      title: '多模态表关联关系（以 scene_id / frame_id 为核心）',
      centerTable: 'processed_data.scenes.scene_index',
      relations: [
        { from: 'scene_index',        to: 'sessions.session_index',  key: 'session_id',       type: 'N:1', desc: '多个场景来自同一个 Session（MCAP 文件）' },
        { from: 'scene_index',        to: 'annotations.bbox_3d',     key: 'scene_id',         type: '1:N', desc: '一个场景含多个 3D 标注框（仅标注工具链读取，训练时标注已打包进 shard）' },
        { from: 'scene_index',        to: 'WebDataset shard',        key: 'webdataset_shard', type: '1:1', desc: '场景对应的训练数据包（相机/LiDAR/雷达/CAN/标注全部打包）' },
      ],
      queryExample: `-- 训练采样：一张表，零 JOIN
SELECT
  s.scene_id,
  s.weather,
  s.scenario_tags,
  s.has_pedestrian,       -- 标注聚合字段，无需 JOIN bbox_3d
  s.object_count_avg,     -- 标注聚合字段
  s.radar_nearest_m,      -- 雷达聚合字段，无需 JOIN 雷达表
  s.avg_speed_mps,        -- CAN 聚合字段，无需 JOIN CAN 表
  s.webdataset_shard      -- 训练数据包路径，交给 WebDataset 读取
FROM processed_data.scenes.scene_index s
WHERE s.annotation_status = 'human_reviewed'
  AND s.is_duplicate = false
  AND s.has_pedestrian = true
  AND s.dataset_version = 'v2.3.0'
  AND s.dataset_split = 'train'`,
    },
  },

  // ── 各模态存储规格 ────────────────────────────────────────────
  modalSpecs: [
    {
      modality: '相机（Camera）',
      icon: '📷',
      color: '#6c5ce7',
      rawFormat: 'H.265 / JPEG',
      storedFormat: 'JPEG（原始帧）+ WebP（训练集）',
      compression: 'H.265 5:1（录制）/ WebP 3:1（训练）',
      partitionKey: 'date / camera_id / scene_id',
      accessPattern: '随机帧访问 + 时序滑窗（8帧）',
      indexing: 'Iceberg 表存储帧元数据（时间戳/曝光/内参）',
      trainFormat: 'WebDataset tar（每 shard ~1GB，含图像+标注）',
      scale: '~4 TB/天 · ~120 TB/月',
      readBW: '~10 GB/s（训练时）',
    },
    {
      modality: 'LiDAR（点云）',
      icon: '🟢',
      color: '#3fb950',
      rawFormat: 'MCAP / PCD',
      storedFormat: 'Draco 压缩 PCD + Parquet（元数据）',
      compression: 'Draco 4:1（几何压缩）',
      partitionKey: 'date / lidar_id / scene_id',
      accessPattern: '按场景批量读取（10帧/场景）',
      indexing: 'Iceberg 表存储点云元数据（帧数/点数/bbox范围）',
      trainFormat: 'NumPy .npy（点云矩阵）+ WebDataset 打包',
      scale: '~800 GB/天 · ~24 TB/月',
      readBW: '~2 GB/s（训练时）',
    },
    {
      modality: '毫米波雷达',
      icon: '📡',
      color: '#ffa657',
      rawFormat: 'Binary / CSV',
      storedFormat: 'Parquet（结构化点云：x/y/z/v/rcs）',
      compression: 'Parquet zstd 8:1',
      partitionKey: 'date / radar_id / scene_id',
      accessPattern: '与相机/LiDAR 联合读取（BEV 融合）',
      indexing: 'Iceberg 表，与相机帧通过 scene_id 关联',
      trainFormat: 'Parquet 直接读取（小数据量）',
      scale: '~50 GB/天 · ~1.5 TB/月',
      readBW: '~200 MB/s（训练时）',
    },
    {
      modality: '标注数据',
      icon: '🏷️',
      color: '#fd79a8',
      rawFormat: 'nuScenes JSON / KITTI txt',
      storedFormat: 'Parquet（结构化）+ JSON（原始）',
      compression: 'Parquet zstd 10:1',
      partitionKey: 'dataset_version / scene_id / annotation_type',
      accessPattern: '与传感器数据 JOIN（scene_id 关联）',
      indexing: 'Iceberg 表，支持按类别/置信度/城市过滤',
      trainFormat: 'WebDataset tar（与传感器数据打包）',
      scale: '~200 GB/天 · ~6 TB/月',
      readBW: '~500 MB/s（训练时）',
    },
    {
      modality: '语言/QA 数据',
      icon: '💬',
      color: '#a29bfe',
      rawFormat: 'JSON',
      storedFormat: 'Parquet（结构化 QA 对）',
      compression: 'Parquet zstd 5:1',
      partitionKey: 'dataset_version / scene_id / qa_type',
      accessPattern: '与视觉数据配对读取（VLA 训练）',
      indexing: 'Iceberg 表，支持按问题类型/场景类别过滤',
      trainFormat: 'JSON Lines + WebDataset 打包',
      scale: '~10 GB/天 · ~300 GB/月',
      readBW: '~100 MB/s（训练时）',
    },
  ],

  // ── WebDataset 详解 ───────────────────────────────────────────
  webdatasetData: {
    title: 'WebDataset — 训练 IO 层',
    subtitle: '基于 tar 包的流式数据集格式，解决大规模训练的 IO 瓶颈，与 Iceberg 互补分工',
    color: '#e17055',

    // 核心概念
    concept: {
      oneLiner: '把"一个样本的所有模态文件"打包进 tar，按顺序流式读取，彻底消灭小文件问题',
      keyIdea: '命名约定驱动对齐：同一前缀（000000）的所有文件自动识别为同一样本',
      tarLayout: [
        { file: 'scene_0042_000000.jpg',        desc: '前摄像头帧（~150KB）' },
        { file: 'scene_0042_000000.lidar.npy',  desc: '对应点云矩阵（~500KB）' },
        { file: 'scene_0042_000000.radar.npy',  desc: '雷达点云（float32 [M,5]，~5KB，含目标 x/y/z/径向速度/RCS）' },
        { file: 'scene_0042_000000.can.npy',    desc: 'CAN 车辆状态向量（float32 [8]，~0.1KB，含车速/方向盘/油门/刹车/加速度/接管标志/AEB标志）' },
        { file: 'scene_0042_000000.hist.npy',   desc: '历史轨迹（float32 [20,3]，~0.2KB，过去 2s ego x/y/yaw）' },
        { file: 'scene_0042_nav.json',          desc: '导航指令（场景级）：{"command": "turn_right", "dist_to_junction_m": 120}' },
        { file: 'scene_0042_000000.label.json', desc: '3D 标注框（~10KB）' },
        { file: 'scene_0042_000000.pose.json',  desc: '车体位姿（~1KB）' },
        { file: 'scene_0042_000001.jpg',        desc: '下一帧...' },
        { file: '...',                           desc: '共 400 帧（20s × 20Hz）' },
        { file: 'scene_0042_meta.json',         desc: 'Scene 级元数据（天气/城市/标签）' },
      ],
      shardDesign: {
        unit: '1 Shard = ~50 个 Scene',
        size: '~1 GB（经验最优值）',
        totalShards: '~50K shards（500K 场景 ÷ 50）',
        naming: 'camera_lidar_{000000..049999}.tar',
        whyOneGB: [
          '< 100MB：shard 数量多，S3 LIST 开销大，调度复杂',
          '> 5GB：单 shard 读取时间长，GPU 等待，流水线气泡大',
          '~1GB：约 50 Scene，读取时间 ~0.5s，流水线填充充分',
        ],
      },
    },

    // 与 Iceberg 的分工（核心）
    vsIceberg: {
      title: 'WebDataset vs Iceberg — 分工与协作',
      analogy: 'Iceberg 是导航系统（规划路线），WebDataset 是高速公路（高速行驶）。先导航，再上高速。',
      comparison: [
        { capability: '训练 IO 吞吐',     webdataset: '✅ ~2 GB/s 顺序读',       iceberg: '❌ 不负责 IO',              winner: 'wds' },
        { capability: '条件过滤查询',     webdataset: '❌ 无法，需全量扫描',      iceberg: '✅ SQL WHERE 谓词下推',      winner: 'ice' },
        { capability: '聚合统计',         webdataset: '❌ 无法',                  iceberg: '✅ GROUP BY / COUNT',        winner: 'ice' },
        { capability: '行级删除/更新',    webdataset: '❌ 需重新打包整个 shard',  iceberg: '✅ ACID 事务，秒级完成',     winner: 'ice' },
        { capability: 'Schema 演化',      webdataset: '❌ 无 schema 概念',        iceberg: '✅ 无缝加字段',              winner: 'ice' },
        { capability: '数据版本管理',     webdataset: '❌ 文件级别，无快照',      iceberg: '✅ 快照级，Time Travel',     winner: 'ice' },
        { capability: '数据血缘追踪',     webdataset: '❌ 无',                    iceberg: '✅ 列级血缘',                winner: 'ice' },
        { capability: '行/列级权限控制',  webdataset: '❌ 只有 S3 桶级别',        iceberg: '✅ RBAC + ABAC',             winner: 'ice' },
        { capability: '多模态 JOIN',      webdataset: '⚠️ 依赖打包时对齐',       iceberg: '✅ SQL JOIN 任意组合',       winner: 'ice' },
        { capability: '增量写入',         webdataset: '❌ 需重新打包',            iceberg: '✅ 流式追加',                winner: 'ice' },
        { capability: 'GPU 喂数据效率',   webdataset: '✅ 流式，无随机 IO',       iceberg: '❌ 不直接用于训练',          winner: 'wds' },
        { capability: '小文件问题',       webdataset: '✅ tar 打包，无小文件',    iceberg: '⚠️ 元数据表行数多',         winner: 'wds' },
      ],
      workflow: {
        title: '协作工作流（两步走）',
        steps: [
          {
            step: 'Step 1：Iceberg 筛选',
            desc: '用 SQL 从 scene_index 表过滤出目标场景，得到 shard 路径列表',
            code: `SELECT DISTINCT webdataset_shard
FROM processed_data.scenes.scene_index
WHERE weather = 'rain'
  AND has_pedestrian = true
  AND dataset_version = 'v2.3.0'
  AND dataset_split = 'train'
-- 返回 200 个 shard 路径（而非全量 50K）`,
            color: '#00cec9',
            icon: '🔍',
          },
          {
            step: 'Step 2：WebDataset 训练',
            desc: '只读筛选出的 200 个 shard，流式喂给 GPU，IO 吞吐 ~2 GB/s',
            code: `import webdataset as wds

shards = iceberg_query_result  # 200 个 shard 路径
dataset = (
    wds.WebDataset(shards, shardshuffle=True)
    .decode("rgb8")
    .to_tuple("jpg", "lidar.npy", "label.json")
    .shuffle(buffer_size=1000)   # 跨 shard buffer shuffle
    .map(preprocess_fn)
    .batched(32)
)
loader = DataLoader(dataset, num_workers=8)`,
            color: '#e17055',
            icon: '🚀',
          },
        ],
        bridgeField: {
          table: 'processed_data.scenes.scene_index',
          field: 'webdataset_shard',
          desc: '这个字段是 Iceberg 和 WebDataset 的桥梁：Iceberg 负责筛选 scene_id，通过此字段找到对应的 shard 路径，WebDataset 负责高效读取',
        },
      },
    },

    // 打包流程（Ray 实现）
    packingPipeline: {
      title: '打包流程（Silver → Gold WebDataset shard）',
      desc: '用 Ray 并行打包，每个 worker 负责 50 个 Scene，输出 1 个 shard',
      steps: [
        { step: '① Iceberg 采样', desc: 'Trino SQL 按分层策略采样 500K scene_id，保证多样性', color: '#6c5ce7' },
        { step: '② 时序对齐', desc: '对每个 scene，按 LiDAR 时间戳对齐相机/雷达/CAN，生成对齐帧列表', color: '#00cec9' },
        { step: '③ Ray 并行打包', desc: '每个 Ray worker 处理 50 个 scene，读取 S3 文件，写入 tar shard', color: '#e17055' },
        { step: '④ Iceberg 回写', desc: '打包完成后，将 shard_path 回写到 scene_index.webdataset_shard 字段', color: '#3fb950' },
        { step: '⑤ LakeFS 版本化', desc: 'LakeFS commit 打 tag dataset_v2.3.0，绑定 shard 快照', color: '#ffa657' },
      ],
      code: `@ray.remote
def pack_scenes_to_shard(scene_ids: list, shard_path: str):
    """将 50 个 scene 打包为 1 个 WebDataset shard（~1GB）"""
    with wds.TarWriter(shard_path) as sink:
        for scene_id in scene_ids:
            # 从 Iceberg 查询该 scene 的所有对齐帧
            frames = query_iceberg(f"""
                SELECT l.frame_id, l.timestamp_us,
                       l.pcd_path AS lidar_path,
                       s.radar_nearest_m,   -- 雷达聚合字段，无需 JOIN
                       s.avg_speed_mps      -- CAN 聚合字段，无需 JOIN
                FROM raw_data.lidar.lidar_frames l
                JOIN processed_data.scenes.scene_index s
                  ON l.scene_id = s.scene_id
                WHERE l.scene_id = '{scene_id}'
                ORDER BY l.timestamp_us
            """)
            for i, frame in enumerate(frames):
                key = f"{scene_id}_{i:06d}"
                sink.write({
                    "__key__":    key,
                    "jpg":        read_s3(frame.cam_path),
                    "lidar.npy":  pointcloud_to_numpy(frame.lidar_path),
                    "radar.json": json.dumps(frame.radar_points).encode(),
                    "label.json": get_annotations(frame.frame_id),
                    "pose.json":  get_ego_pose(frame.frame_id),
                })
    # 回写 shard 路径到 Iceberg
    update_scene_shard_ref(scene_ids, shard_path)

# 并行打包 50K shards
ray.get([
    pack_scenes_to_shard.remote(batch, f"s3://gold/shards/shard_{i:06d}.tar")
    for i, batch in enumerate(chunks(all_scene_ids, 50))
])`,
    },

    // 训练侧读取
    trainingRead: {
      title: '训练侧读取（PyTorch DataLoader）',
      code: `import webdataset as wds
from torch.utils.data import DataLoader

# Step 1: Iceberg 筛选目标 shard（只读 10% 的 shard）
target_shards = trino.query("""
    SELECT DISTINCT webdataset_shard
    FROM processed_data.scenes.scene_index
    WHERE weather IN ('rain', 'fog') AND has_pedestrian = true
""").to_list()

# Step 2: WebDataset 流式读取
dataset = (
    wds.WebDataset(
        target_shards,
        shardshuffle=True,      # shard 级别 shuffle（跨节点分发）
        resampled=True,         # 无限循环，适合多 epoch 训练
        handler=wds.warn_and_continue,  # 跳过损坏的 shard
    )
    .decode("rgb8")             # JPEG → numpy uint8 自动解码
    .to_tuple("jpg", "lidar.npy", "label.json", "pose.json")
    .shuffle(buffer_size=2000)  # 内存 buffer shuffle（跨 shard 混洗）
    .map(preprocess_multimodal) # 数据增强 + 坐标系转换
    .batched(32, partial=False) # 固定 batch size
)

loader = DataLoader(
    dataset,
    num_workers=8,          # 每个 worker 负责不同 shard
    pin_memory=True,        # 锁页内存，加速 CPU→GPU 传输
    persistent_workers=True # worker 复用，避免重复初始化
)`,
      keyPoints: [
        { point: 'shardshuffle=True', desc: 'shard 级别 shuffle，不同训练节点读取不同 shard，天然无锁并行' },
        { point: 'buffer_size=2000', desc: '内存中保留 2000 个样本的 buffer，随机采样，补偿 shard 内时序相关性' },
        { point: 'num_workers=8', desc: '每个 worker 独立读取一个 shard，8 个 worker 同时流式读取 8 个 shard' },
        { point: 'resampled=True', desc: '无限循环模式，适合多 epoch 训练，自动 reshuffle' },
      ],
    },

    // 局限性与解决方案
    limitations: [
      {
        problem: '随机访问困难',
        detail: '调试时想看某一帧，需要知道它在哪个 shard 的哪个字节偏移',
        solution: 'Iceberg frames_v2 表新增 shard_path + frame_offset_bytes 字段，用 tarfile.extractfile(offset) 定位',
        color: '#ff7b72',
        icon: '🔍',
      },
      {
        problem: 'Shard 内 shuffle 不充分',
        detail: '同一 shard 内的帧来自相同时间段，时序相关性强，影响训练收敛',
        solution: 'shardshuffle=True（shard 级）+ shuffle(buffer_size=2000)（样本级）双重 shuffle',
        color: '#ffa657',
        icon: '🔀',
      },
      {
        problem: '增量更新麻烦',
        detail: '新数据来了，不能直接追加到已有 shard，必须新建 shard',
        solution: '新数据攒成新 shard（shard_v2.3.1_*.tar），Iceberg 表记录版本，训练时合并读取多版本 shard',
        color: '#79c0ff',
        icon: '➕',
      },
      {
        problem: '多模态对齐依赖打包时正确性',
        detail: '000000.jpg 和 000000.lidar.npy 必须严格对应同一时刻，框架不做校验',
        solution: '打包时写入 000000.meta.json（含 timestamp_us），训练侧读取后校验时间戳差值 < 5ms',
        color: '#a29bfe',
        icon: '⚠️',
      },
      {
        problem: '不支持列裁剪',
        detail: '读取 shard 时必须解压整个样本，即使只需要相机帧，点云也会被读取',
        solution: '按模态拆分 shard（camera_only_*.tar / lidar_only_*.tar），单模态任务只读对应 shard',
        color: '#fd79a8',
        icon: '📦',
      },
    ],

    // 性能数据
    perfNumbers: [
      { metric: 'S3 文件数（1000辆/天）', singleFile: '~2.16 亿个 JPEG', webdataset: '~2000 个 shard', winner: 'wds' },
      { metric: '训练 IO 吞吐',           singleFile: '~50 MB/s（随机）', webdataset: '~2 GB/s（顺序）', winner: 'wds' },
      { metric: 'GPU 利用率',             singleFile: '40~60%（IO 瓶颈）', webdataset: '90%+',           winner: 'wds' },
      { metric: 'S3 PUT 请求费用/天',     singleFile: '极高（×2.16亿）',  webdataset: '低（×2000）',    winner: 'wds' },
      { metric: '随机访问单帧',           singleFile: '✅ 直接',          webdataset: '⚠️ 需 offset',   winner: 'single' },
      { metric: '条件过滤',               singleFile: '❌ 无法',          webdataset: '❌ 无法（需 Iceberg）', winner: 'none' },
    ],
  },

  // ── 训练数据集构建流程 ─────────────────────────────────────────
  trainDatasetBuild: {
    title: '训练数据集构建（Gold → 训练就绪）',
    steps: [
      {
        step: '① 场景采样',
        desc: '从 Gold 层按场景类别/城市/天气/时段分层采样，保证数据多样性',
        tech: 'Trino SQL + Spark 采样',
        output: 'scene_id 列表（~500K 场景）',
        color: '#6c5ce7',
        icon: '🎯',
      },
      {
        step: '② 多模态打包',
        desc: '将相机帧/点云/雷达/标注/语言 QA 按 scene_id 对齐，打包为 WebDataset shard',
        tech: 'Ray + WebDataset',
        output: '~50K tar shards（每 shard ~1GB）',
        color: '#00cec9',
        icon: '📦',
      },
      {
        step: '③ 时序窗口构建',
        desc: '构建 8 帧历史 + 当前帧 + 6 帧未来的时序样本，支持 BEVFormer 时序建模',
        tech: 'Spark + NumPy',
        output: '时序样本索引（Iceberg 表）',
        color: '#fd79a8',
        icon: '🎞️',
      },
      {
        step: '④ 数据集版本化',
        desc: 'LakeFS commit + DVC 双版本记录，绑定 Git commit 与数据集快照',
        tech: 'LakeFS + DVC + MLflow',
        output: 'dataset_v2.3.0 快照',
        color: '#ffa657',
        icon: '🏷️',
      },
      {
        step: '⑤ 预计算特征',
        desc: '离线预计算 BEV 特征/语言嵌入/场景嵌入，存入 Feast 特征仓库，训练时直接读取',
        tech: 'Ray + BEVFusion + InternLM2',
        output: 'feature_store.offline.scene_feat_v2',
        color: '#3fb950',
        icon: '🧬',
      },
      {
        step: '⑥ 训练集注册',
        desc: '将数据集元数据注册到 Unity Catalog model_registry，与训练实验绑定',
        tech: 'Unity Catalog + MLflow',
        output: 'processed_data.scenes.train_split_v2',
        color: '#e84393',
        icon: '📋',
      },
    ],
    outputSpec: {
      totalScenes: '~500K 场景',
      totalShards: '~50K tar shards',
      totalSize: '~50 TB（训练集）',
      modalCoverage: '相机 100% · LiDAR 100% · 雷达 85% · 语言 60%',
      trainValTest: '80% / 10% / 10%',
      avgShardSize: '~1 GB / shard',
      readThroughput: '~15 GB/s（128×A100 训练时）',
    },
  },

  // ── 训练 IO 优化 ──────────────────────────────────────────────
  ioOptimization: {
    title: '训练 IO 优化（解决存储瓶颈）',
    bottleneck: '128×A100 训练时需要 ~15 GB/s 持续读取带宽，S3 直读仅 ~2 GB/s，需多级缓存加速',
    strategies: [
      {
        name: 'JuiceFS 分布式缓存',
        desc: '在训练节点本地 NVMe 上构建 JuiceFS 缓存层，热数据命中率 >90%',
        gain: '读取速度 2GB/s → 12GB/s',
        config: '每节点 8×NVMe 3.84TB，缓存容量 ~30TB',
        color: '#6c5ce7',
        icon: '⚡',
      },
      {
        name: 'WebDataset 顺序读取',
        desc: 'tar shard 顺序读取，避免随机 IO，充分利用 S3 顺序读取带宽',
        gain: '随机 IO → 顺序 IO，吞吐提升 5×',
        config: 'shard 大小 1GB，prefetch_factor=4',
        color: '#00cec9',
        icon: '📦',
      },
      {
        name: '多进程预取（DataLoader）',
        desc: 'PyTorch DataLoader num_workers=16，CPU 解码与 GPU 训练流水线并行',
        gain: 'GPU 利用率从 65% → 92%',
        config: 'num_workers=16, pin_memory=True, persistent_workers=True',
        color: '#fd79a8',
        icon: '🔄',
      },
      {
        name: 'Lustre 并行文件系统',
        desc: '训练集群挂载 Lustre 2PB，提供 POSIX 接口，支持 MPI-IO 并行读取',
        gain: '聚合带宽 ~40 GB/s（16节点）',
        config: 'Lustre 2PB，OST ×32，条带宽度 4MB',
        color: '#3fb950',
        icon: '🗄️',
      },
      {
        name: '预计算特征缓存',
        desc: '将 BEV 特征/语言嵌入离线预计算并缓存，训练时直接读取 FP16 张量，跳过重计算',
        gain: '每步训练时间减少 40%（跳过 BEVFusion 推理）',
        config: 'FP16 存储，NVMe 热缓存，Feast 在线服务',
        color: '#ffa657',
        icon: '🧬',
      },
      {
        name: 'DALI GPU 解码',
        desc: 'NVIDIA DALI 将图像解码/增强从 CPU 移至 GPU，消除 CPU 解码瓶颈',
        gain: 'CPU 解码瓶颈消除，GPU 利用率 +8%',
        config: 'DALI Pipeline + TensorRT 预处理',
        color: '#79c0ff',
        icon: '🚀',
      },
    ],
    ioStack: [
      { layer: 'GPU 显存', size: '80GB × 128', latency: 'ns 级', bw: '~2 TB/s', color: '#ff7b72' },
      { layer: 'NVMe 本地缓存', size: '~30 TB（JuiceFS）', latency: 'μs 级', bw: '~40 GB/s', color: '#ffa657' },
      { layer: 'Lustre 并行 FS', size: '2 PB', latency: 'ms 级', bw: '~40 GB/s', color: '#79c0ff' },
      { layer: 'S3 对象存储', size: '~500 PB', latency: '10ms 级', bw: '~2 GB/s（单节点）', color: '#3fb950' },
    ],
  },

  // ── Iceberg 特性（保留）────────────────────────────────────────
  icebergFeatures: [
    { name: 'Schema Evolution', desc: '无需重写数据即可添加/删除/重命名列，标注字段迭代无痛', icon: '🔄' },
    { name: 'Hidden Partitioning', desc: '自动分区裁剪，按 scene_id/date/city 查询无需感知分区', icon: '📂' },
    { name: 'Time Travel', desc: '按快照 ID 或时间戳查询历史版本，复现任意训练集', icon: '⏰' },
    { name: 'ACID Transactions', desc: '并发标注写入安全，支持 Serializable 隔离', icon: '🔒' },
    { name: 'Compaction', desc: '自动合并小文件（标注增量写入产生），优化查询性能', icon: '📦' },
    { name: 'Row-level Deletes', desc: '支持行级删除（GDPR 合规删除 PII 数据）', icon: '✂️' },
  ],

  // ── LakeFS 数据版本工作流（保留）──────────────────────────────
  lakeFSWorkflow: [
    { step: 1, action: 'branch', desc: '从 main 创建 feature/new-labels-v2.3 分支', icon: '🌿' },
    { step: 2, action: 'write',  desc: '新标注数据写入分支（BEVFusion v4.2 输出）', icon: '✏️' },
    { step: 3, action: 'diff',   desc: '对比分支与 main 的数据差异（新增 50K 场景）', icon: '🔍' },
    { step: 4, action: 'test',   desc: '在分支上运行 Great Expectations 数据质量测试', icon: '✅' },
    { step: 5, action: 'merge',  desc: '测试通过后合并到 main，触发 Airflow DAG', icon: '🔀' },
    { step: 6, action: 'tag',    desc: '打标签 dataset_v2.3.0，绑定 MLflow 实验', icon: '🏷️' },
  ],

  // ── 格式对比（保留）──────────────────────────────────────────
  comparison: [
    { feature: '开放标准', iceberg: '✅ Apache 开源', delta: '⚠️ Databricks 主导', hudi: '✅ Apache 开源' },
    { feature: 'Schema Evolution', iceberg: '✅ 完整支持', delta: '✅ 支持', hudi: '⚠️ 部分支持' },
    { feature: 'Hidden Partition', iceberg: '✅ 原生支持', delta: '❌ 不支持', hudi: '❌ 不支持' },
    { feature: 'Time Travel', iceberg: '✅ 快照级', delta: '✅ 版本级', hudi: '✅ 时间线级' },
    { feature: '引擎兼容', iceberg: '✅ Spark/Trino/Flink', delta: '⚠️ Spark 优先', hudi: '✅ Spark/Flink' },
    { feature: '社区活跃度', iceberg: '🔥 最活跃', delta: '🔥 活跃', hudi: '⚠️ 一般' },
  ],

  // ── 查询引擎（更新）──────────────────────────────────────────
  queryEngines: [
    { name: 'Trino', role: '联邦查询', desc: '跨 Catalog 联邦查询（Unity Catalog 统一入口），Ad-hoc 分析', latency: '秒级', icon: '🔍' },
    { name: 'Spark SQL', role: '批处理', desc: '大规模 ETL + 特征工程 + 数据集构建', latency: '分钟级', icon: '⚡' },
    { name: 'DuckDB', role: '本地分析', desc: '开发者本地快速探索 Parquet/Iceberg，零配置', latency: '毫秒级', icon: '🦆' },
    { name: 'Flink SQL', role: '流式查询', desc: '实时接入数据的流式聚合与质量监控', latency: '<100ms', icon: '🌊' },
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