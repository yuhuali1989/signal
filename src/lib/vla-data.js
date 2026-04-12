// 自动驾驶 VLA + 世界模型实验室 —— 数据源
// 聚焦自动驾驶场景，数据集选型：OpenDV-2K + nuPlan + CARLA 仿真
// 所有数值为演示用途

// ════════════════════════════════════════════════════════════════
// 数据集选型说明
// ════════════════════════════════════════════════════════════════
// ────────────────────────────────────────────────────────────────
// 数据集选型论证（VLA + 世界模型最优组合）
//
// 核心原则：VLA 需要 视觉(V) + 语言(L) + 动作(A) 三要素全部具备
//           世界模型需要 连续帧时序 + 动作条件化 + 可评估的闭环环境
//
// 最优组合：nuScenes（核心）+ DriveLM（语言）+ NAVSIM（闭环）+ OpenDV-2K（预训练）
// ────────────────────────────────────────────────────────────────
export const DATASET_SELECTION = [
  {
    name: 'nuScenes',
    role: 'VLA 核心训练集',
    color: '#00cec9',
    icon: '🎯',
    frames: 1_400_000,
    hours: 5.5,
    source: 'Motional 真实采集（波士顿 + 新加坡）',
    sensors: ['6路环视相机', '32线LiDAR', 'RADAR×5', 'GPS/IMU'],
    has_annotation: true,
    has_language: true,
    has_map: true,
    why: 'VLA+世界模型的最优核心数据集：① 6路环视相机是VLA视觉输入的标准格式；② 配套DriveLM提供460K语言标注，是目前最完整的驾驶语言生态；③ UniAD/VAD/SparseDrive/OpenDriveVLA全部基于nuScenes，便于公平对比；④ HuggingFace提供mini版(4GB)，可本地快速验证',
    limitation: '总时长仅5.5h，场景多样性有限（仅两个城市）',
    badge: '⭐ 首选',
    stages: ['视觉-语言预训练', '世界模型预训练', '端到端规划微调'],
  },
  {
    name: 'DriveLM',
    role: '语言标注扩展',
    color: '#6c5ce7',
    icon: '💬',
    frames: 1_400_000,
    hours: 5.5,
    source: 'nuScenes 语言标注扩展（OpenDriveLab）',
    sensors: ['继承 nuScenes 全部传感器'],
    has_annotation: true,
    has_language: true,
    has_map: true,
    why: '基于 nuScenes 场景的 Graph-of-Thought 驾驶推理链标注，提供感知→预测→规划的完整语言推理链，是 VLA 语言对齐训练的关键数据源，直接对应 DriveWorld-VLA 的 Latent CoT 设计',
    limitation: '依赖 nuScenes，无独立传感器数据',
    badge: '语言必备',
    stages: ['视觉-语言预训练'],
  },
  {
    name: 'NAVSIM',
    role: '闭环评估 & RL 微调',
    color: '#fd79a8',
    icon: '🔄',
    frames: 1_100_000,
    hours: 120,
    source: 'nuPlan 子集（非反应式仿真）',
    sensors: ['6路相机', 'LiDAR', 'HD Map'],
    has_annotation: true,
    has_language: false,
    has_map: true,
    why: '世界模型训练的关键闭环环境：① PDMS/EPDMS 指标是目前最接近真实驾驶的评估标准；② 非反应式仿真避免了 CARLA 的 sim-to-real gap；③ DriveWorld-VLA 和 Alpamayo-R1 均在此评测达到 SOTA；④ 可用作 RL 微调的奖励信号来源',
    limitation: '非反应式仿真，其他车辆不响应 ego 行为',
    badge: '闭环必备',
    stages: ['端到端规划微调', '闭环RL微调'],
  },
  {
    name: 'OpenDV-2K',
    role: '视觉预训练',
    color: '#fdcb6e',
    icon: '🎬',
    frames: 2_000_000_000,
    hours: 1_747,
    source: 'YouTube 驾驶视频',
    sensors: ['前向单目相机'],
    has_annotation: false,
    has_language: true,
    has_map: false,
    why: '海量真实驾驶视频（2B帧），用于世界模型视觉编码器的自监督预训练，学习驾驶场景的时序动态和物理规律。无需标注，GPT-4V自动生成语言描述。作为预训练数据，显著提升后续 nuScenes 微调的收敛速度',
    limitation: '无精确标注，无LiDAR，仅前向视角，不能直接用于VLA训练',
    badge: '预训练',
    stages: ['视觉-语言预训练'],
  },
];

// ════════════════════════════════════════════════════════════════
// 数据处理流水线（DriveWorld-VLA）
// ════════════════════════════════════════════════════════════════
export const PIPELINE_STAGES = [
  {
    id: 'ingest',
    label: '原始数据摄入',
    icon: '📥',
    desc: '多源数据并行流式摄入：nuScenes传感器包(.db) + DriveLM语言标注(.json) + NAVSIM仿真录制(.log) + OpenDV-2K视频流。使用Ray Data实现真正的流式处理，有界队列防OOM。',
    output: '~2TB 原始数据（nuScenes 5.5h + NAVSIM 120h + OpenDV-2K 1747h）',
    status: 'done',
    color: '#6c5ce7',
    code: `# 流式读取，有界队列防OOM（Ray Data）
import ray
from queue import Queue

@ray.remote
def ingest_nuplan(scene_id: str):
    """流式读取nuPlan SQLite场景"""
    db = NuPlanDB(f"nuplan_{scene_id}.db")
    for frame in db.iter_frames(stride=1):
        yield {
            'cams': frame.get_cameras(),      # 8路相机
            'lidar': frame.get_lidar_pc(),    # 5路LiDAR合并
            'map': frame.get_map_elements(),  # HD Map矢量
            'ego': frame.get_ego_state(),     # 自车状态
            'ts': frame.timestamp,
        }

# 有界队列：避免生产者过快导致OOM
ds = ray.data.from_items(scene_ids) \\
    .flat_map(ingest_nuplan) \\
    .limit_inflight(max_inflight=50)  # 有界队列`,
  },
  {
    id: 'align',
    label: '多传感器时间戳对齐',
    icon: '⏱️',
    desc: '利用高频IMU数据（200Hz）做预积分，对相机帧和LiDAR点云进行精确时间插值对齐，同时对LiDAR点云做运动去畸变（undistortion）。统一到10Hz。',
    output: '时间对齐的多模态帧（误差<2ms）',
    status: 'done',
    color: '#a29bfe',
    code: `def imu_preintegration_align(imu_data, cam_frames, lidar_frames):
    """IMU预积分对齐：误差<2ms，支持高速场景"""
    # Step1: IMU预积分 → 任意时刻精确位姿
    poses = preintegrate_imu(imu_data, hz=200)  # 200Hz位姿序列

    # Step2: LiDAR运动去畸变（点云采集期间车辆移动补偿）
    lidar_undistorted = []
    for pc in lidar_frames:
        # 每个点按采集时刻插值位姿，补偿运动畸变
        pose_interp = interpolate_pose(poses, pc.point_timestamps)
        lidar_undistorted.append(undistort_pointcloud(pc, pose_interp))

    # Step3: 相机帧插值到LiDAR时间戳
    t_unified = np.array([pc.timestamp for pc in lidar_undistorted])
    cam_aligned = {
        name: interpolate_frames(frames, t_unified, method='linear')
        for name, frames in cam_frames.items()
    }
    return SyncedFrame(cam=cam_aligned, lidar=lidar_undistorted,
                       poses=poses, timestamp=t_unified)`,
  },
  {
    id: 'filter',
    label: '质量过滤',
    icon: '🔍',
    desc: '多维度质量过滤：过滤静止帧（速度<0.5m/s）、相机遮挡帧（亮度方差<100）、LiDAR稀疏帧（点数<5000）、传感器故障帧（时间戳跳变>100ms）。',
    output: '→ 保留 ~76% 有效帧',
    status: 'done',
    color: '#74b9ff',
    code: `# 策略模式：各过滤器独立可配置，避免if-else嵌套
FILTER_REGISTRY = {
    'static':   lambda f: f.ego_speed >= 0.5,          # 过滤静止帧
    'cam_blur': lambda f: f.cam_variance >= 100,        # 过滤模糊帧
    'lidar_sparse': lambda f: f.lidar_points >= 5000,  # 过滤稀疏帧
    'ts_jump':  lambda f: f.max_ts_gap_ms <= 100,      # 过滤时间戳跳变
    'ego_valid':lambda f: f.ego_accel_abs <= 8.0,      # 过滤异常加速
}

def quality_filter(frame: SyncedFrame, filters=None) -> bool:
    """策略模式：字典映射替代if-else"""
    active = filters or list(FILTER_REGISTRY.keys())
    return all(FILTER_REGISTRY[name](frame) for name in active)

# Ray Data并行过滤
ds_filtered = ds.filter(quality_filter)`,
  },
  {
    id: 'language',
    label: '语言指令生成',
    icon: '💬',
    desc: '用 GPT-4V 对驾驶场景生成结构化语言描述，构建 <场景, 指令, 动作> 三元组。同时生成场景问答对（VQA）用于视觉-语言预训练。',
    output: '→ 15.2M 语言-动作对',
    status: 'done',
    color: '#00cec9',
    code: `# GPT-4V批量生成场景描述（异步并发）
import asyncio
from openai import AsyncOpenAI

async def generate_scene_caption(frame: SyncedFrame) -> dict:
    client = AsyncOpenAI()
    # 结构化prompt：场景描述 + 驾驶指令 + 关键目标
    prompt = f"""分析当前驾驶场景，输出JSON格式：
    {{
      "scene_desc": "场景描述（天气/道路/交通）",
      "instruction": "驾驶指令（如：在前方路口左转）",
      "key_objects": ["关键目标列表"],
      "risk_level": "low/medium/high"
    }}
    自车速度: {frame.ego_speed:.1f} m/s
    检测目标: {frame.detected_objects[:5]}"""

    resp = await client.chat.completions.create(
        model="gpt-4-vision-preview",
        messages=[{"role":"user","content":[
            {"type":"image_url","image_url":{"url": frame.front_cam_b64}},
            {"type":"text","text": prompt}
        ]}]
    )
    return json.loads(resp.choices[0].message.content)

# 并发批量生成
captions = await asyncio.gather(*[generate_scene_caption(f) for f in frames])`,
  },
  {
    id: 'tokenize',
    label: '多模态 Tokenize',
    icon: '🔢',
    desc: '图像→ViT Patch Token（InternViT-6B），点云→PointPillar Voxel Token，地图→MapTR Graph Token，轨迹→离散化Waypoint Token，语言→LLM Token。统一投影到dim=4096隐空间。',
    output: '→ 统一 Token 序列（dim=4096）',
    status: 'running',
    color: '#fd79a8',
    code: `class DriveWorldTokenizer:
    """DriveWorld-VLA多模态Tokenizer"""
    def __init__(self):
        self.vit = InternViT6B()           # 视觉Tokenizer
        self.lidar_enc = PointPillar()     # 点云Voxelizer
        self.map_enc = MapTR()             # 地图Encoder
        self.llm_tok = InternLM2Tokenizer()# 语言Tokenizer
        self.projector = UnifiedProjector(dim=4096)  # 统一投影器

    def tokenize(self, frame: SyncedFrame):
        # 图像: InternViT-6B patch tokens (256 tokens/帧 × 6相机)
        img_tokens = self.vit(frame.cameras)       # [B, 1536, 4096]
        # 点云: PointPillar voxel tokens
        lidar_tokens = self.lidar_enc(frame.lidar) # [B, 400, 256] → proj
        # 地图: MapTR graph tokens
        map_tokens = self.map_enc(frame.map)       # [B, 100, 256] → proj
        # 语言: LLM tokenizer
        lang_tokens = self.llm_tok(frame.caption)  # [B, L, 4096]
        # 统一投影到隐空间（核心创新）
        unified = self.projector(img_tokens, lidar_tokens, map_tokens)
        return UnifiedTokens(visual=unified, lang=lang_tokens)`,
  },
  {
    id: 'pack',
    label: '序列打包写入',
    icon: '📦',
    desc: '按场景连续性打包为 WebDataset shard（含时序上下文T=8帧），流式写入对象存储。每个shard包含完整的多模态token序列和标注。',
    output: '→ 3,240 个 .tar shard',
    status: 'pending',
    color: '#fdcb6e',
    code: `# 流式写入WebDataset，有界队列防OOM
import webdataset as wds
from queue import Queue

def pack_to_webdataset(scene_frames, output_path, shard_size=500):
    """按场景打包，保留时序上下文（T=8帧历史）"""
    queue = Queue(maxsize=50)  # 有界队列

    with wds.ShardWriter(output_path, maxcount=shard_size) as sink:
        for scene in scene_frames:
            # 滑动窗口：每次取T=8帧历史 + 当前帧
            for i in range(8, len(scene)):
                window = scene[i-8:i+1]  # T=8历史帧
                sink.write({
                    "__key__": f"{scene.id}_{i:06d}",
                    "img.npy":   window.img_tokens.numpy(),
                    "lidar.npy": window.lidar_tokens.numpy(),
                    "map.npy":   window.map_tokens.numpy(),
                    "traj.npy":  window.future_waypoints.numpy(),
                    "lang.txt":  window.caption,
                    "meta.json": json.dumps(window.metadata),
                })`,
  },
];

// ════════════════════════════════════════════════════════════════
// 架构节点（DriveWorld-VLA: Unified Latent-Space）
// 论文核心：统一隐空间同时驱动 VLA 规划 + 世界模型预测
// ════════════════════════════════════════════════════════════════
export const ARCH_NODES = [
  // 输入层 —— 原始多模态传感器
  { id: 'cam6',    label: '6路环视相机\n(1600×900, 12Hz)', group: 'input',   x: 20,  y: 50,  color: '#dfe6e9' },
  { id: 'lidar',   label: 'LiDAR 点云\n(64线, 10Hz)',      group: 'input',   x: 20,  y: 170, color: '#dfe6e9' },
  { id: 'map',     label: 'HD Map\n(车道/停止线/路口)',    group: 'input',   x: 20,  y: 290, color: '#dfe6e9' },
  { id: 'lang',    label: '语言指令\n(GPT-4V 生成)',       group: 'input',   x: 20,  y: 410, color: '#dfe6e9' },

  // 编码器层 —— 各模态独立编码
  { id: 'vit',     label: 'InternViT-6B\n视觉 Tokenizer',  group: 'encoder', x: 210, y: 50,  color: '#a29bfe' },
  { id: 'lidar_enc',label: 'PointPillar\n点云 Voxelizer',  group: 'encoder', x: 210, y: 170, color: '#74b9ff' },
  { id: 'map_enc', label: 'MapTR\n地图 Encoder',           group: 'encoder', x: 210, y: 290, color: '#a29bfe' },
  { id: 'llm',     label: 'InternLM2-7B\n语言 Backbone',  group: 'encoder', x: 210, y: 410, color: '#6c5ce7' },

  // 融合层 —— 统一隐空间投影
  { id: 'proj',    label: 'Unified Projector\n(多模态→隐空间)', group: 'fusion', x: 420, y: 110, color: '#74b9ff' },
  { id: 'temporal',label: 'Temporal Encoder\n(历史帧聚合)',      group: 'fusion', x: 420, y: 310, color: '#00cec9' },

  // 核心：统一隐状态
  { id: 'latent',  label: '统一隐状态 Z_t\n(Unified Latent)', group: 'core', x: 620, y: 200, color: '#00cec9' },

  // 双头输出
  { id: 'vla_head',label: 'VLA Head\n(规划 Decoder)',      group: 'core', x: 620, y: 80,  color: '#fd79a8' },
  { id: 'wm_head', label: 'World Model Head\n(预测 Decoder)', group: 'core', x: 620, y: 340, color: '#55efc4' },

  // 输出层
  { id: 'waypoints',label: '规划轨迹\n(20步 Waypoints)',   group: 'output', x: 830, y: 50,  color: '#fdcb6e' },
  { id: 'action',   label: '控制指令\n(throttle/steer)',   group: 'output', x: 830, y: 150, color: '#fd79a8' },
  { id: 'future_s', label: '未来场景预测\nŝ_{t+1..t+H}',  group: 'output', x: 830, y: 280, color: '#55efc4' },
  { id: 'occ_pred', label: 'Occupancy Flow\n(3D 占用预测)', group: 'output', x: 830, y: 400, color: '#a29bfe' },
];

export const ARCH_EDGES = [
  // 输入 → 编码器
  { from: 'cam6',     to: 'vit' },
  { from: 'lidar',    to: 'lidar_enc' },
  { from: 'map',      to: 'map_enc' },
  { from: 'lang',     to: 'llm' },
  // 编码器 → 统一投影
  { from: 'vit',      to: 'proj' },
  { from: 'lidar_enc',to: 'proj' },
  { from: 'map_enc',  to: 'proj' },
  { from: 'llm',      to: 'proj' },
  // 投影 → 时序编码
  { from: 'proj',     to: 'temporal' },
  // 时序 → 统一隐状态
  { from: 'temporal', to: 'latent' },
  { from: 'proj',     to: 'latent' },
  // 隐状态 → 双头
  { from: 'latent',   to: 'vla_head' },
  { from: 'latent',   to: 'wm_head' },
  // VLA Head → 输出
  { from: 'vla_head', to: 'waypoints' },
  { from: 'vla_head', to: 'action' },
  // WM Head → 输出
  { from: 'wm_head',  to: 'future_s' },
  { from: 'wm_head',  to: 'occ_pred' },
];

// ════════════════════════════════════════════════════════════════
// 训练曲线（DriveWorld-VLA 三阶段训练）
// Stage1: 视觉预训练(0-100k) → Stage2: VLA联合训练(100k-250k) → Stage3: WM-RL(250k-350k)
// ════════════════════════════════════════════════════════════════
function seededRngSimple(seed) {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; };
}

function genTrainCurve() {
  const rng = seededRngSimple(42);
  const data = [];
  // Stage1: 视觉预训练 (step 0-100, 对应0-100k steps)
  let vis_loss = 4.2, vla_loss = 0, wm_loss = 0;
  let l2_err = 99, col_rate = 0.99, fvd = 999;
  let stage = 1;

  for (let step = 0; step <= 350; step += 5) {
    if (step === 100) { stage = 2; vla_loss = 3.8; wm_loss = 4.5; l2_err = 3.2; col_rate = 0.18; fvd = 420; }
    if (step === 250) { stage = 3; }

    if (stage === 1) {
      vis_loss = Math.max(0.8, vis_loss * 0.982 + (rng() - 0.5) * 0.06);
    } else if (stage === 2) {
      vis_loss = Math.max(0.5, vis_loss * 0.995 + (rng() - 0.5) * 0.02);
      vla_loss = Math.max(0.18, vla_loss * 0.983 + (rng() - 0.5) * 0.05);
      wm_loss  = Math.max(0.22, wm_loss  * 0.980 + (rng() - 0.5) * 0.07);
      l2_err   = Math.max(0.32, l2_err   * 0.982 + (rng() - 0.5) * 0.04);
      col_rate = Math.max(0.025,col_rate * 0.977 + (rng() - 0.5) * 0.003);
      fvd      = Math.max(48,   fvd      * 0.978 + (rng() - 0.5) * 5);
    } else {
      vis_loss = Math.max(0.45, vis_loss * 0.998 + (rng() - 0.5) * 0.01);
      vla_loss = Math.max(0.12, vla_loss * 0.990 + (rng() - 0.5) * 0.03);
      wm_loss  = Math.max(0.15, wm_loss  * 0.988 + (rng() - 0.5) * 0.04);
      l2_err   = Math.max(0.24, l2_err   * 0.992 + (rng() - 0.5) * 0.02);
      col_rate = Math.max(0.015,col_rate * 0.990 + (rng() - 0.5) * 0.002);
      fvd      = Math.max(38,   fvd      * 0.990 + (rng() - 0.5) * 3);
    }

    // LR schedule: warmup(0-10) → cosine decay, 各阶段重置
    let lr;
    if (step < 10) lr = 1e-4 * (step / 10);
    else if (step < 100) lr = 1e-4 * Math.pow(0.993, step - 10);
    else if (step < 110) lr = 2e-4 * ((step - 100) / 10);
    else if (step < 250) lr = 2e-4 * Math.pow(0.990, step - 110);
    else if (step < 260) lr = 5e-5 * ((step - 250) / 10);
    else lr = 5e-5 * Math.pow(0.994, step - 260);

    data.push({
      step,
      stage,
      vis_loss:    stage >= 1 ? +vis_loss.toFixed(3) : null,
      vla_loss:    stage >= 2 ? +vla_loss.toFixed(3) : null,
      wm_loss:     stage >= 2 ? +wm_loss.toFixed(3)  : null,
      policy_loss: stage >= 2 ? +vla_loss.toFixed(3) : null,  // 兼容旧字段
      l2_err:      stage >= 2 ? +l2_err.toFixed(3)   : null,
      col_rate:    stage >= 2 ? +col_rate.toFixed(4)  : null,
      fvd:         stage >= 2 ? +Math.round(fvd)      : null,
      lr:          +lr.toFixed(7),
    });
  }
  return data;
}
export const TRAIN_CURVE = genTrainCurve();

// 三阶段训练配置
export const TRAIN_STAGES = [
  {
    id: 'stage1',
    name: 'Stage 1: 视觉-语言预训练',
    steps: '0 → 100k',
    color: '#6c5ce7',
    icon: '👁️',
    frozen: ['lidar_enc', 'map_enc', 'vla_head', 'wm_head'],
    trainable: ['vit', 'llm', 'proj'],
    loss: 'L_VLP = L_img_text + L_caption',
    data: 'OpenDV-2K (2B帧视频)',
    lr: '1e-4',
    batch: 512,
    gpus: 'A100×32',
    desc: '冻结点云/地图编码器，仅训练视觉-语言对齐。用OpenDV-2K海量驾驶视频学习场景视觉表示，为后续VLA训练提供强视觉先验。',
    key_metric: 'CLIP Score: 0.31 → 0.68',
  },
  {
    id: 'stage2',
    name: 'Stage 2: VLA + 世界模型联合训练',
    steps: '100k → 250k',
    color: '#00cec9',
    icon: '🧠',
    frozen: [],
    trainable: ['全部模块'],
    loss: 'L = λ₁·L_plan + λ₂·L_wm + λ₃·L_occ',
    data: 'nuPlan (15M帧) + CARLA (5M帧)',
    lr: '2e-4',
    batch: 128,
    gpus: 'A100×16',
    desc: '全参数联合训练。规划损失(L_plan)监督waypoint预测，世界模型损失(L_wm)监督未来场景预测，占用损失(L_occ)监督3D占用预测。三个任务共享统一隐状态Z_t。',
    key_metric: 'L2: 3.2m → 0.42m | FVD: 420 → 52',
  },
  {
    id: 'stage3',
    name: 'Stage 3: 世界模型辅助 RL 微调',
    steps: '250k → 350k',
    color: '#fd79a8',
    icon: '🎮',
    frozen: ['vit', 'lidar_enc', 'map_enc', 'llm'],
    trainable: ['proj', 'temporal', 'latent', 'vla_head', 'wm_head'],
    loss: 'L = L_plan + α·R_wm (世界模型想象奖励)',
    data: 'CARLA 闭环仿真 (在线生成)',
    lr: '5e-5',
    batch: 64,
    gpus: 'A100×8',
    desc: '冻结编码器，用世界模型在隐空间中想象未来H=20步，生成稠密奖励信号R_wm。通过PPO算法微调规划头，显著提升长尾场景（紧急避障/复杂路口）的成功率。',
    key_metric: '碰撞率: 3.8% → 1.2% | 成功率: 76% → 89%',
  },
];

// ════════════════════════════════════════════════════════════════
// 评测结果（DriveWorld-VLA vs SOTA）
// ════════════════════════════════════════════════════════════════
export const EVAL_RESULTS = [
  { task: '直行',     baseline: 0.88, ours: 0.97, oracle: 0.99 },
  { task: '变道',     baseline: 0.61, ours: 0.85, oracle: 0.94 },
  { task: '路口左转', baseline: 0.52, ours: 0.79, oracle: 0.91 },
  { task: '路口右转', baseline: 0.58, ours: 0.82, oracle: 0.93 },
  { task: '跟车',     baseline: 0.71, ours: 0.91, oracle: 0.97 },
  { task: '紧急避障', baseline: 0.34, ours: 0.68, oracle: 0.85 },
  { task: '雨天行驶', baseline: 0.45, ours: 0.73, oracle: 0.88 },
  { task: '夜间行驶', baseline: 0.49, ours: 0.76, oracle: 0.90 },
];

// SOTA 模型对比
export const SOTA_COMPARISON = [
  { model: 'UniAD',          l2: 0.71, col: 0.048, fvd: null, params: '1.1B',  color: '#b2bec3' },
  { model: 'VAD',            l2: 0.54, col: 0.038, fvd: null, params: '0.8B',  color: '#b2bec3' },
  { model: 'DriveLM',        l2: 0.62, col: 0.042, fvd: null, params: '7B',    color: '#b2bec3' },
  { model: 'DriveVLM',       l2: 0.48, col: 0.031, fvd: 142,  params: '7B',    color: '#74b9ff' },
  { model: 'OmniDrive',      l2: 0.44, col: 0.028, fvd: 118,  params: '7B',    color: '#a29bfe' },
  { model: 'DriveWorld-VLA', l2: 0.31, col: 0.012, fvd: 52,   params: '7B',    color: '#00cec9' },
];

// 损失函数定义
export const LOSS_DEFINITIONS = [
  {
    id: 'L_plan',
    name: 'L_plan 规划损失',
    color: '#6c5ce7',
    formula: 'L_plan = Σₖ ||wₖ - ŵₖ||_smooth_L1',
    desc: 'Smooth-L1 监督未来 20 步 waypoint。相比 MSE 对异常点更鲁棒。',
    weight: 'λ₁ = 1.0',
    stage: [2, 3],
  },
  {
    id: 'L_wm',
    name: 'L_wm 世界模型损失',
    color: '#00cec9',
    formula: 'L_wm = E_q[log p(o_{t+1:t+H} | z_t)] - KL[q(z_t|o_t) || p(z_t)]',
    desc: 'ELBO 目标：重建未来H帧观测 + KL正则化隐状态。用Diffusion Decoder实现高质量预测。',
    weight: 'λ₂ = 0.5',
    stage: [2, 3],
  },
  {
    id: 'L_occ',
    name: 'L_occ 占用损失',
    color: '#fd79a8',
    formula: 'L_occ = BCE(occ_pred, occ_gt) + α·Dice(occ_pred, occ_gt)',
    desc: '二元交叉熵 + Dice Loss 对 3D Occupancy Grid 进行监督。辅助世界模型学习准确的空间占用。',
    weight: 'λ₃ = 0.3',
    stage: [2, 3],
  },
  {
    id: 'R_wm',
    name: 'R_wm 世界模型奖励',
    color: '#fdcb6e',
    formula: 'R_wm = Σ_{h=1}^{H} γ^h · r(z_{t+h}) — 隐空间想象奖励',
    desc: 'Stage3 RL阶段专属。世界模型在隐空间想象H步，计算路径奖励。避免了真实环境交互的高成本。',
    weight: 'α = 0.1',
    stage: [3],
  },
];

// ════════════════════════════════════════════════════════════════
// 世界模型：未来轨迹想象（统一隐空间）
// ════════════════════════════════════════════════════════════════
function genImagination() {
  const rng = seededRngSimple(99);
  const data = [];
  let x = 0, y = 0, yaw = 0;
  const ego_speed = 8 + rng() * 4;
  for (let t = 0; t <= 20; t++) {
    yaw += (rng() - 0.48) * 0.04;
    x += ego_speed * 0.1 * Math.cos(yaw);
    y += ego_speed * 0.1 * Math.sin(yaw);
    const reward = Math.min(1, 0.3 + t * 0.025 + (rng() - 0.3) * 0.05);
    // 隐空间不确定性（多条想象轨迹）
    const uncertainty = Math.max(0.02, 0.05 + t * 0.008);
    data.push({ t, x: +x.toFixed(2), y: +y.toFixed(2), reward: +reward.toFixed(3), uncertainty: +uncertainty.toFixed(3) });
  }
  return data;
}
export const IMAGINATION_TRAJ = genImagination();

// 多条想象轨迹（展示不确定性）
export const IMAGINATION_MULTI = Array.from({ length: 5 }, (_, k) => {
  const rng = seededRngSimple(k * 137 + 42);
  const data = [];
  let x = 0, y = 0, yaw = 0;
  const ego_speed = 7 + rng() * 5;
  for (let t = 0; t <= 20; t++) {
    yaw += (rng() - 0.48) * 0.05;
    x += ego_speed * 0.1 * Math.cos(yaw);
    y += ego_speed * 0.1 * Math.sin(yaw);
    data.push({ t, x: +x.toFixed(2), y: +y.toFixed(2) });
  }
  return { id: k, color: ['#6c5ce7','#00cec9','#fd79a8','#fdcb6e','#55efc4'][k], traj: data };
});

// ════════════════════════════════════════════════════════════════
// 训练配置（DriveWorld-VLA）
// ════════════════════════════════════════════════════════════════
export const TRAIN_CONFIG = {
  model: 'DriveWorld-VLA-7B',
  paper: 'DriveWorld-VLA: Unified Latent-Space World Modeling with VLA',
  backbone_vision: 'InternViT-6B (InternVL2 pretrained)',
  backbone_lang: 'InternLM2-7B',
  lidar_encoder: 'PointPillar (voxel size=0.2m)',
  map_encoder: 'MapTR (BEV 200×200, 0.5m/pixel)',
  unified_projector: 'MLP + Cross-Attention (dim=4096)',
  temporal_encoder: 'Temporal Transformer (T=8帧历史)',
  vla_head: 'AR Transformer-Decoder (6L, 16H)',
  wm_head: 'Diffusion Decoder (DDPM, T=1000)',
  action_type: 'Waypoints (20步, 0.5s间隔) + 控制指令',
  latent_dim: 4096,
  wm_horizon: 20,
  wm_imagine_batch: 512,
  // 三阶段训练
  stage1: { steps: 100_000, lr: 1e-4, batch: 512, gpus: 'A100×32' },
  stage2: { steps: 150_000, lr: 2e-4, batch: 128, gpus: 'A100×16' },
  stage3: { steps: 100_000, lr: 5e-5, batch: 64,  gpus: 'A100×8'  },
  total_steps: 350_000,
  current_step: 187_400,
  optimizer: 'AdamW (β₁=0.9, β₂=0.999, wd=0.01)',
  precision: 'BF16',
  loss_weights: { lambda_plan: 1.0, lambda_wm: 0.5, lambda_occ: 0.3, alpha_rl: 0.1 },
  train_data: 'OpenDV-2K (Stage1视觉预训练) + nuScenes+DriveLM (Stage2 VLA训练) + NAVSIM闭环 (Stage3 RL微调)',
};

// ════════════════════════════════════════════════════════════════
// 数据集统计（用于概览卡片）
// ════════════════════════════════════════════════════════════════
export const DATASET_STATS = {
  total_frames: 2_003_900_000,   // OpenDV-2K 2B帧 + nuScenes 1.4M帧
  total_hours: 1_878,            // OpenDV-2K 1747h + NAVSIM 120h + nuScenes 5.5h + DriveLM 5.5h
  total_scenarios: 1_250,        // nuScenes 1000场景 + NAVSIM 250场景
  datasets: DATASET_SELECTION,
};

// ════════════════════════════════════════════════════════════════
// 多帧时序数据 & 多传感器对齐（四个数据集）
// ════════════════════════════════════════════════════════════════

function seededRng(seed) {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; };
}

// ─── OpenDV-2K：前向单目多帧（无标注，仅视频帧 + 语言描述） ──
export const OPENDV_MULTIFRAME = Array.from({ length: 6 }, (_, fi) => {
  const rng = seededRng(fi * 997 + 11);
  const t = fi * 0.1; // 10Hz，每帧 0.1s
  const speed = +(8 + Math.sin(fi * 0.5) * 3 + rng() * 0.5).toFixed(1);
  const captions = [
    '高速公路直行，前方车辆保持安全距离，车速约 80km/h',
    '进入匝道，轻踩刹车减速，注意右侧合流车辆',
    '城市道路，前方红灯，逐渐减速停车',
    '绿灯起步，直行通过路口，注意行人',
    '跟随前车变道至左侧超车道，保持 3s 车距',
    '雨天行驶，路面湿滑，降速至 60km/h，开启雨刷',
  ];
  const scenes = ['highway', 'ramp', 'urban_stop', 'urban_go', 'lane_change', 'rain'];
  return {
    frame_id: fi,
    timestamp_ms: Math.round(t * 1000),
    timestamp_str: `T+${(t * 1000).toFixed(0)}ms`,
    scene_type: scenes[fi],
    ego_speed_kmh: +(speed * 3.6).toFixed(1),
    caption: captions[fi],
    // 光流估计（模拟，用于时序建模）
    optical_flow: { mean_mag: +(rng() * 8 + 2).toFixed(2), direction_deg: +(rng() * 30 - 15).toFixed(1) },
    // 帧间差异（用于过滤静止帧）
    frame_diff: +(rng() * 0.15 + 0.02).toFixed(3),
    // 亮度/对比度（用于质量过滤）
    brightness: +(rng() * 80 + 100).toFixed(0),
    contrast: +(rng() * 40 + 60).toFixed(0),
  };
});

// ─── nuPlan：多帧时序（8路相机 + 5路LiDAR + GPS/IMU） ────────
export const NUPLAN_MULTIFRAME = Array.from({ length: 6 }, (_, fi) => {
  const rng = seededRng(fi * 1337 + 77);
  const t = fi * 0.1; // 10Hz
  const base_speed = 8 + Math.sin(fi * 0.4) * 2;
  const ego_speed = +(base_speed + rng() * 0.3).toFixed(2);
  const ego_yaw = +(fi * 0.02 + rng() * 0.005).toFixed(4);
  const ego_x = +(fi * ego_speed * 0.1 * Math.cos(ego_yaw)).toFixed(2);
  const ego_y = +(fi * ego_speed * 0.1 * Math.sin(ego_yaw)).toFixed(2);

  // 8路相机时间戳偏移（ms），模拟硬件触发抖动
  const cam_offsets = {
    CAM_F0:  Math.round((seededRng(fi*8+0)() - 0.5) * 8),
    CAM_F1:  Math.round((seededRng(fi*8+1)() - 0.5) * 8),
    CAM_F2:  Math.round((seededRng(fi*8+2)() - 0.5) * 8),
    CAM_B0:  Math.round((seededRng(fi*8+3)() - 0.5) * 8),
    CAM_B1:  Math.round((seededRng(fi*8+4)() - 0.5) * 8),
    CAM_B2:  Math.round((seededRng(fi*8+5)() - 0.5) * 8),
    CAM_L0:  Math.round((seededRng(fi*8+6)() - 0.5) * 8),
    CAM_R0:  Math.round((seededRng(fi*8+7)() - 0.5) * 8),
  };
  // 5路LiDAR时间戳偏移（ms）
  const lidar_offsets = {
    LIDAR_TOP:   0,
    LIDAR_FL:    Math.round((seededRng(fi*5+0)() - 0.5) * 5),
    LIDAR_FR:    Math.round((seededRng(fi*5+1)() - 0.5) * 5),
    LIDAR_BL:    Math.round((seededRng(fi*5+2)() - 0.5) * 5),
    LIDAR_BR:    Math.round((seededRng(fi*5+3)() - 0.5) * 5),
  };

  // 专家轨迹（未来 5 步）
  const future_waypoints = Array.from({ length: 5 }, (_, k) => {
    const dt = (k + 1) * 0.5;
    return {
      dt_s: dt,
      x: +(ego_x + ego_speed * dt * Math.cos(ego_yaw + k * 0.01)).toFixed(2),
      y: +(ego_y + ego_speed * dt * Math.sin(ego_yaw + k * 0.01)).toFixed(2),
    };
  });

  // 检测到的目标（BEV坐标）
  const num_obj = 3 + Math.floor(rng() * 5);
  const objects = Array.from({ length: num_obj }, (_, oi) => {
    const dist = 5 + rng() * 40;
    const angle = (rng() - 0.5) * Math.PI * 0.8;
    return {
      id: oi,
      cls: ['car','pedestrian','bicycle','truck'][Math.floor(rng()*4)],
      x: +(dist * Math.cos(angle)).toFixed(2),
      y: +(dist * Math.sin(angle)).toFixed(2),
      vel_x: +(rng() * 6 - 1).toFixed(2),
      vel_y: +(rng() * 2 - 1).toFixed(2),
    };
  });

  return {
    frame_id: fi,
    timestamp_ms: Math.round(t * 1000),
    timestamp_str: `T+${(t * 1000).toFixed(0)}ms`,
    ego_x, ego_y,
    ego_speed,
    ego_yaw,
    ego_accel: +((rng() - 0.5) * 1.5).toFixed(3),
    ego_yaw_rate: +((rng() - 0.5) * 0.1).toFixed(4),
    cam_offsets,
    lidar_offsets,
    future_waypoints,
    objects,
    // GPS/IMU
    gps: { lat: +(42.3601 + fi * 0.00001).toFixed(6), lon: +(-71.0589 + fi * 0.00001).toFixed(6), alt: +(10 + rng()).toFixed(2) },
    imu: { ax: +((rng()-0.5)*0.5).toFixed(3), ay: +((rng()-0.5)*0.3).toFixed(3), gz: +((rng()-0.5)*0.05).toFixed(4) },
    // 对齐后的最大时间差（ms）
    max_sync_error_ms: Math.max(...Object.values(cam_offsets).map(Math.abs), ...Object.values(lidar_offsets).map(Math.abs)),
  };
});

// ─── CARLA 仿真：多帧时序（6路相机 + 64线LiDAR + 语义分割） ──
export const CARLA_MULTIFRAME = Array.from({ length: 6 }, (_, fi) => {
  const rng = seededRng(fi * 2333 + 55);
  const t = fi * 0.05; // 20Hz（仿真帧率更高）
  const ego_speed = +(6 + Math.sin(fi * 0.8) * 4 + rng() * 0.2).toFixed(2);
  const ego_x = +(fi * ego_speed * 0.05).toFixed(2);
  const ego_y = +(Math.sin(fi * 0.3) * 2).toFixed(2);

  // 仿真特有：语义分割标签分布
  const seg_labels = {
    road:       Math.round(40 + rng() * 10),   // %
    vehicle:    Math.round(8 + rng() * 5),
    pedestrian: Math.round(2 + rng() * 3),
    building:   Math.round(20 + rng() * 8),
    vegetation:  Math.round(15 + rng() * 5),
    sky:        Math.round(10 + rng() * 5),
    other:      0,
  };
  seg_labels.other = 100 - Object.values(seg_labels).reduce((a,b)=>a+b,0);

  // 奖励信号（仿真特有）
  const reward = {
    progress: +(rng() * 0.4 + 0.3).toFixed(3),
    comfort:  +(rng() * 0.3 + 0.6).toFixed(3),
    safety:   +(rng() * 0.2 + 0.7).toFixed(3),
    total:    0,
  };
  reward.total = +((reward.progress + reward.comfort + reward.safety) / 3).toFixed(3);

  // 6路相机时间戳（仿真中完全同步，偏差极小）
  const cam_offsets = {
    CAM_FRONT:       0,
    CAM_FRONT_LEFT:  Math.round(rng() * 2),
    CAM_FRONT_RIGHT: Math.round(rng() * 2),
    CAM_BACK:        Math.round(rng() * 2),
    CAM_BACK_LEFT:   Math.round(rng() * 2),
    CAM_BACK_RIGHT:  Math.round(rng() * 2),
  };

  const num_obj = 2 + Math.floor(rng() * 6);
  const objects = Array.from({ length: num_obj }, (_, oi) => ({
    id: oi,
    cls: ['vehicle','pedestrian','bicycle'][Math.floor(rng()*3)],
    x: +((rng()-0.5)*40).toFixed(2),
    y: +((rng()-0.5)*20).toFixed(2),
    vel_x: +(rng()*8-2).toFixed(2),
    vel_y: +(rng()*2-1).toFixed(2),
    // 仿真特有：真值标签（无噪声）
    gt_x: +((rng()-0.5)*40).toFixed(2),
    gt_y: +((rng()-0.5)*20).toFixed(2),
  }));

  return {
    frame_id: fi,
    timestamp_ms: Math.round(t * 1000),
    timestamp_str: `T+${(t * 1000).toFixed(0)}ms`,
    sim_tick: fi * 5,  // 仿真 tick
    ego_x, ego_y,
    ego_speed,
    ego_accel: +((rng()-0.5)*2).toFixed(3),
    cam_offsets,
    lidar_points: Math.round(60000 + rng() * 20000),
    seg_labels,
    reward,
    objects,
    // 仿真天气参数
    weather: { cloudiness: Math.round(rng()*80), precipitation: Math.round(rng()*30), sun_altitude: Math.round(30+rng()*60) },
    // 对齐误差（仿真中几乎为0）
    max_sync_error_ms: Math.max(...Object.values(cam_offsets)),
  };
});

// ─── Waymo Open：多帧时序（5路相机 + 64线LiDAR） ─────────────
export const WAYMO_MULTIFRAME = Array.from({ length: 6 }, (_, fi) => {
  const rng = seededRng(fi * 3141 + 99);
  const t = fi * 0.1; // 10Hz
  const ego_speed = +(10 + Math.sin(fi * 0.6) * 3 + rng() * 0.4).toFixed(2);
  const ego_x = +(fi * ego_speed * 0.1).toFixed(2);
  const ego_y = +(Math.sin(fi * 0.2) * 1.5).toFixed(2);

  // 5路相机时间戳偏移（ms）
  const cam_offsets = {
    FRONT:       0,
    FRONT_LEFT:  Math.round((seededRng(fi*5+0)() - 0.5) * 12),
    FRONT_RIGHT: Math.round((seededRng(fi*5+1)() - 0.5) * 12),
    SIDE_LEFT:   Math.round((seededRng(fi*5+2)() - 0.5) * 12),
    SIDE_RIGHT:  Math.round((seededRng(fi*5+3)() - 0.5) * 12),
  };

  // Waymo 特有：激光雷达返回强度分布
  const lidar_stats = {
    total_points: Math.round(150000 + rng() * 50000),
    near_points:  Math.round(30000 + rng() * 10000),  // <10m
    mid_points:   Math.round(80000 + rng() * 20000),  // 10-50m
    far_points:   Math.round(40000 + rng() * 15000),  // >50m
    mean_intensity: +(rng() * 0.4 + 0.3).toFixed(3),
  };

  // 3D 检测框（Waymo 格式，LiDAR坐标系）
  const num_obj = 4 + Math.floor(rng() * 8);
  const objects = Array.from({ length: num_obj }, (_, oi) => {
    const dist = 3 + rng() * 60;
    const angle = (rng() - 0.5) * Math.PI * 1.8;
    return {
      id: oi,
      cls: ['TYPE_VEHICLE','TYPE_PEDESTRIAN','TYPE_CYCLIST','TYPE_SIGN'][Math.floor(rng()*4)],
      x: +(dist * Math.cos(angle)).toFixed(2),
      y: +(dist * Math.sin(angle)).toFixed(2),
      z: +((rng()-0.5)*2).toFixed(2),
      length: +(rng()*3+1.5).toFixed(2),
      width:  +(rng()*1.5+0.8).toFixed(2),
      height: +(rng()*1.5+1.0).toFixed(2),
      heading: +(rng()*Math.PI*2).toFixed(3),
      speed: +(rng()*12).toFixed(2),
    };
  });

  return {
    frame_id: fi,
    timestamp_ms: Math.round(t * 1000),
    timestamp_str: `T+${(t * 1000).toFixed(0)}ms`,
    context_name: `segment-${(fi*137+42).toString().padStart(8,'0')}`,
    ego_x, ego_y,
    ego_speed,
    ego_accel: +((rng()-0.5)*1.2).toFixed(3),
    cam_offsets,
    lidar_stats,
    objects,
    // Waymo 特有：激光雷达扫描线分布
    lidar_ring_dist: Array.from({length:8}, (_,i) => ({
      ring: `Ring ${i*8}-${(i+1)*8}`,
      points: Math.round(15000 + rng()*8000 - i*1000),
    })),
    max_sync_error_ms: Math.max(...Object.values(cam_offsets).map(Math.abs)),
  };
});

// ─── 多传感器对齐方案对比 ─────────────────────────────────────
export const SENSOR_ALIGN_METHODS = [
  {
    id: 'nearest',
    name: '最近邻对齐',
    desc: '每个传感器帧选取时间戳最近的其他传感器帧，简单但误差较大',
    color: '#fd79a8',
    max_error_ms: 50,
    complexity: '低',
    suitable: ['OpenDV-2K（无需精确对齐）'],
    not_suitable: ['高速场景（50ms内车辆移动>0.5m）'],
    code: `def nearest_align(cam_ts, lidar_ts):
    aligned = []
    for t in lidar_ts:
        idx = np.argmin(np.abs(cam_ts - t))
        aligned.append((t, cam_ts[idx], abs(cam_ts[idx]-t)))
    return aligned`,
  },
  {
    id: 'interpolate',
    name: '线性插值对齐',
    desc: '对相机帧在时间轴上做线性插值，将所有传感器对齐到LiDAR时间戳',
    color: '#fdcb6e',
    max_error_ms: 10,
    complexity: '中',
    suitable: ['nuPlan（官方推荐方案）', 'Waymo Open'],
    not_suitable: ['快速运动场景（插值误差累积）'],
    code: `def interpolate_align(cam_frames, lidar_ts, target_hz=10):
    t_unified = np.arange(t_start, t_end, 1/target_hz)
    # 对每路相机做时间插值
    cam_aligned = {}
    for cam_name, frames in cam_frames.items():
        cam_aligned[cam_name] = interpolate_frames(
            frames, t_unified, method='linear'
        )
    return SyncedFrame(cam=cam_aligned, lidar=lidar_ts)`,
  },
  {
    id: 'imu_preintegration',
    name: 'IMU 预积分对齐',
    desc: '利用高频IMU数据（100-200Hz）对传感器位姿做精确插值，补偿运动畸变',
    color: '#6c5ce7',
    max_error_ms: 2,
    complexity: '高',
    suitable: ['nuPlan（高精度场景）', 'Waymo Open（高速场景）'],
    not_suitable: ['无IMU数据的数据集'],
    code: `def imu_preintegration_align(imu_data, cam_ts, lidar_ts):
    # IMU 预积分：计算任意时刻的精确位姿
    poses = preintegrate_imu(imu_data)  # 100Hz 位姿序列
    # 对LiDAR点云做运动补偿（去畸变）
    lidar_undistorted = undistort_lidar(lidar_ts, poses)
    # 将相机帧插值到LiDAR时间戳
    cam_aligned = pose_interpolate(cam_ts, poses, target_ts=lidar_ts)
    return SyncedFrame(cam=cam_aligned, lidar=lidar_undistorted)`,
  },
  {
    id: 'hardware_sync',
    name: '硬件同步触发',
    desc: 'CARLA仿真中所有传感器由同一时钟触发，天然对齐，误差<1ms',
    color: '#00cec9',
    max_error_ms: 1,
    complexity: '无（仿真）',
    suitable: ['CARLA 仿真（天然同步）'],
    not_suitable: ['真实传感器（硬件成本高）'],
    code: `# CARLA 中传感器天然同步，无需额外对齐
world = client.get_world()
settings = world.get_settings()
settings.synchronous_mode = True   # 同步模式
settings.fixed_delta_seconds = 0.05  # 20Hz
world.apply_settings(settings)
# 所有传感器在同一 tick 内采集，时间戳完全一致`,
  },
];
