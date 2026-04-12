// 自动驾驶数据可视化 —— 模拟数据源
// 包含 KITTI 格式数据 + 多数据集横向对比，所有数值为演示用途

// ─── 数据集概览 ───────────────────────────────────────────────
export const AD_DATASET_META = {
  name: 'nuScenes (模拟)',
  version: 'v1.0-mini',
  location: 'Boston-Seaport / Singapore-Onenorth',
  total_scenes: 850,
  total_samples: 40_000,
  total_annotations: 1_400_000,
  sensors: [
    { name: 'CAM_FRONT',       type: 'camera', hz: 12, res: '1600×900' },
    { name: 'CAM_FRONT_LEFT',  type: 'camera', hz: 12, res: '1600×900' },
    { name: 'CAM_FRONT_RIGHT', type: 'camera', hz: 12, res: '1600×900' },
    { name: 'CAM_BACK',        type: 'camera', hz: 12, res: '1600×900' },
    { name: 'CAM_BACK_LEFT',   type: 'camera', hz: 12, res: '1600×900' },
    { name: 'CAM_BACK_RIGHT',  type: 'camera', hz: 12, res: '1600×900' },
    { name: 'LIDAR_TOP',       type: 'lidar',  hz: 20, channels: 32, range: '70m' },
    { name: 'RADAR_FRONT',     type: 'radar',  hz: 13, range: '250m' },
    { name: 'RADAR_FRONT_LEFT',type: 'radar',  hz: 13, range: '250m' },
    { name: 'RADAR_FRONT_RIGHT',type:'radar',  hz: 13, range: '250m' },
    { name: 'RADAR_BACK_LEFT', type: 'radar',  hz: 13, range: '250m' },
    { name: 'RADAR_BACK_RIGHT',type: 'radar',  hz: 13, range: '250m' },
  ],
};

// ─── 目标类别 ──────────────────────────────────────────────────
export const OBJ_CLASSES = [
  { name: 'car',             color: '#6c5ce7', count: 545_230 },
  { name: 'pedestrian',      color: '#fd79a8', count: 198_450 },
  { name: 'bicycle',         color: '#00cec9', count: 67_820  },
  { name: 'truck',           color: '#fdcb6e', count: 89_340  },
  { name: 'bus',             color: '#74b9ff', count: 34_120  },
  { name: 'motorcycle',      color: '#a29bfe', count: 28_670  },
  { name: 'traffic_cone',    color: '#e17055', count: 156_890 },
  { name: 'barrier',         color: '#55efc4', count: 279_480 },
];

// ─── 场景天气/时间分布 ─────────────────────────────────────────
export const SCENE_CONDITIONS = [
  { condition: '晴天白天', count: 312, color: '#fdcb6e' },
  { condition: '阴天白天', count: 198, color: '#b2bec3' },
  { condition: '雨天白天', count: 87,  color: '#74b9ff' },
  { condition: '晴天夜间', count: 143, color: '#6c5ce7' },
  { condition: '阴天夜间', count: 76,  color: '#a29bfe' },
  { condition: '雨天夜间', count: 34,  color: '#00cec9' },
];

// ─── 确定性随机数生成器 ───────────────────────────────────────
function seededRng(seed) {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; };
}

// ─── 生成 LiDAR 点云（BEV，模拟 32 线） ──────────────────────
function genLidarPoints(rng, numPoints = 800) {
  const points = [];
  for (let i = 0; i < numPoints; i++) {
    const angle = rng() * Math.PI * 2;
    const r = Math.pow(rng(), 0.5) * 50; // 0-50m，近处密集
    const x = r * Math.cos(angle);
    const y = r * Math.sin(angle);
    const z = (rng() - 0.5) * 3;
    const intensity = rng();
    // 道路区域点更密集
    const onRoad = Math.abs(y) < 8 && r < 40;
    if (onRoad || rng() > 0.3) {
      points.push({ x: +x.toFixed(2), y: +y.toFixed(2), z: +z.toFixed(2), intensity: +intensity.toFixed(3) });
    }
  }
  return points;
}

// ─── 生成 3D 检测框（BEV） ────────────────────────────────────
function genBev3DBoxes(rng) {
  const boxes = [];
  const cls = OBJ_CLASSES.slice(0, 6);
  const numBoxes = 8 + Math.floor(rng() * 8);
  for (let i = 0; i < numBoxes; i++) {
    const c = cls[Math.floor(rng() * cls.length)];
    const angle = (rng() - 0.5) * Math.PI * 0.6;
    const dist = 5 + rng() * 35;
    const laneOffset = (rng() - 0.5) * 12;
    const x = dist * Math.cos(angle) + laneOffset * Math.sin(angle);
    const y = dist * Math.sin(angle) + laneOffset * Math.cos(angle);
    const w = c.name === 'car' ? 2.0 : c.name === 'truck' ? 2.5 : c.name === 'bus' ? 2.8 : c.name === 'pedestrian' ? 0.7 : 0.8;
    const l = c.name === 'car' ? 4.5 : c.name === 'truck' ? 7.0 : c.name === 'bus' ? 11.0 : c.name === 'pedestrian' ? 0.7 : 1.8;
    const yaw = (rng() - 0.5) * 0.4;
    const vel_x = (rng() - 0.5) * 10;
    const vel_y = (rng() - 0.5) * 3;
    const score = +(0.6 + rng() * 0.38).toFixed(2);
    boxes.push({ id: i, cls: c.name, color: c.color, x: +x.toFixed(2), y: +y.toFixed(2), w, l, yaw: +yaw.toFixed(3), vel_x: +vel_x.toFixed(2), vel_y: +vel_y.toFixed(2), score, dist: +Math.sqrt(x*x+y*y).toFixed(1) });
  }
  return boxes;
}

// ─── 生成 Radar 点 ─────────────────────────────────────────────
function genRadarPoints(rng, numPoints = 40) {
  return Array.from({ length: numPoints }, (_, i) => {
    const angle = (rng() - 0.5) * Math.PI * 1.4; // 前向 ±70°
    const r = 10 + rng() * 200;
    const vr = (rng() - 0.5) * 30; // 径向速度 m/s
    return {
      id: i,
      x: +(r * Math.cos(angle)).toFixed(1),
      y: +(r * Math.sin(angle)).toFixed(1),
      r: +r.toFixed(1),
      angle: +angle.toFixed(3),
      vr: +vr.toFixed(2),
      rcs: +(rng() * 20 - 5).toFixed(1), // 雷达截面积 dBsm
    };
  });
}

// ─── 生成相机帧场景描述（用于 Canvas 渲染） ───────────────────
const CAM_NAMES = ['FRONT', 'FRONT_LEFT', 'FRONT_RIGHT', 'BACK', 'BACK_LEFT', 'BACK_RIGHT'];
const CAM_ANGLES = [0, -60, 60, 180, -120, 120]; // 相对车头角度（度）

function genCamScene(rng, camAngle) {
  // 天空颜色
  const timeOfDay = rng() > 0.4 ? 'day' : 'night';
  const weather = rng() > 0.7 ? 'rain' : 'clear';
  // 道路上的目标物
  const objects = [];
  const numObj = 2 + Math.floor(rng() * 5);
  for (let i = 0; i < numObj; i++) {
    const cls = OBJ_CLASSES[Math.floor(rng() * 5)];
    objects.push({
      cls: cls.name,
      color: cls.color,
      x: 0.1 + rng() * 0.8,
      y: 0.4 + rng() * 0.35,
      w: cls.name === 'pedestrian' ? 0.04 : cls.name === 'bicycle' ? 0.06 : 0.12,
      h: cls.name === 'pedestrian' ? 0.18 : cls.name === 'bicycle' ? 0.12 : 0.1,
      score: +(0.65 + rng() * 0.33).toFixed(2),
    });
  }
  return { timeOfDay, weather, objects, camAngle };
}

// ─── 生成完整抽样帧 ────────────────────────────────────────────
export const AD_SAMPLES = Array.from({ length: 6 }, (_, si) => {
  const rng = seededRng(si * 997 + 13);
  const lidar = genLidarPoints(rng);
  const boxes = genBev3DBoxes(seededRng(si * 997 + 77));
  const radar = genRadarPoints(seededRng(si * 997 + 55));
  const cams = CAM_NAMES.map((name, ci) => ({
    name,
    angle: CAM_ANGLES[ci],
    scene: genCamScene(seededRng(si * 997 + ci * 31 + 100), CAM_ANGLES[ci]),
  }));

  // 自车状态
  const ego_speed = +(rng() * 15).toFixed(1);
  const ego_yaw_rate = +(rng() * 0.3 - 0.15).toFixed(3);
  const ego_accel = +(rng() * 2 - 0.5).toFixed(2);

  // 自车历史轨迹（过去 2s，20 帧）
  let ex = 0, ey = 0, eyaw = 0;
  const ego_traj = Array.from({ length: 20 }, (_, t) => {
    eyaw += ego_yaw_rate * 0.1 + (seededRng(si + t)() - 0.5) * 0.01;
    ex += ego_speed * 0.1 * Math.cos(eyaw);
    ey += ego_speed * 0.1 * Math.sin(eyaw);
    return { t, x: +ex.toFixed(2), y: +ey.toFixed(2), yaw: +eyaw.toFixed(3) };
  });

  // 传感器时间戳偏移（ms）
  const timestamps = {
    LIDAR_TOP:         0,
    CAM_FRONT:         Math.round((seededRng(si)() - 0.5) * 20),
    CAM_FRONT_LEFT:    Math.round((seededRng(si+1)() - 0.5) * 20),
    CAM_FRONT_RIGHT:   Math.round((seededRng(si+2)() - 0.5) * 20),
    CAM_BACK:          Math.round((seededRng(si+3)() - 0.5) * 20),
    CAM_BACK_LEFT:     Math.round((seededRng(si+4)() - 0.5) * 20),
    CAM_BACK_RIGHT:    Math.round((seededRng(si+5)() - 0.5) * 20),
    RADAR_FRONT:       Math.round((seededRng(si+6)() - 0.5) * 40),
    RADAR_FRONT_LEFT:  Math.round((seededRng(si+7)() - 0.5) * 40),
    RADAR_FRONT_RIGHT: Math.round((seededRng(si+8)() - 0.5) * 40),
  };

  return {
    id: si,
    scene_id: `scene-${(si * 137 + 42).toString().padStart(4, '0')}`,
    location: si < 3 ? 'Boston-Seaport' : 'Singapore-Onenorth',
    weather: si % 3 === 0 ? '晴天' : si % 3 === 1 ? '阴天' : '雨天',
    time_of_day: si < 4 ? '白天' : '夜间',
    lidar,
    boxes,
    radar,
    cams,
    ego_speed,
    ego_yaw_rate,
    ego_accel,
    ego_traj,
    timestamps,
    num_objects: boxes.length,
  };
});

// ─── 目标距离分布（用于统计图） ───────────────────────────────
export const DIST_DISTRIBUTION = Array.from({ length: 14 }, (_, i) => ({
  range: `${i * 5}-${(i + 1) * 5}m`,
  car:         Math.round(Math.exp(-Math.pow(i - 3, 2) / 8) * 800 + Math.random() * 100),
  pedestrian:  Math.round(Math.exp(-Math.pow(i - 2, 2) / 5) * 400 + Math.random() * 80),
  bicycle:     Math.round(Math.exp(-Math.pow(i - 2, 2) / 6) * 200 + Math.random() * 50),
  truck:       Math.round(Math.exp(-Math.pow(i - 4, 2) / 10) * 300 + Math.random() * 60),
}));

// ─── 速度分布（各类别） ────────────────────────────────────────
export const SPEED_DISTRIBUTION = Array.from({ length: 16 }, (_, i) => ({
  speed: i * 2,
  car:        Math.round(Math.exp(-Math.pow(i - 5, 2) / 12) * 1200 + Math.random() * 100),
  pedestrian: Math.round(Math.exp(-Math.pow(i - 1, 2) / 2) * 600 + Math.random() * 80),
  bicycle:    Math.round(Math.exp(-Math.pow(i - 2, 2) / 4) * 400 + Math.random() * 60),
  truck:      Math.round(Math.exp(-Math.pow(i - 4, 2) / 10) * 500 + Math.random() * 70),
}));

// ════════════════════════════════════════════════════════════════
// KITTI 数据集
// ════════════════════════════════════════════════════════════════

export const KITTI_META = {
  name: 'KITTI',
  version: '2012/2015',
  location: 'Karlsruhe, Germany',
  total_scenes: 22,          // 训练序列
  total_samples: 14_999,     // 标注帧
  total_annotations: 80_256, // 3D 标注框
  sensors: [
    { name: 'CAM_LEFT_COLOR',  type: 'camera', hz: 10, res: '1242×375' },
    { name: 'CAM_RIGHT_COLOR', type: 'camera', hz: 10, res: '1242×375' },
    { name: 'CAM_LEFT_GRAY',   type: 'camera', hz: 10, res: '1242×375' },
    { name: 'CAM_RIGHT_GRAY',  type: 'camera', hz: 10, res: '1242×375' },
    { name: 'VELODYNE_HDL64',  type: 'lidar',  hz: 10, channels: 64, range: '120m' },
    { name: 'GPS/IMU',         type: 'imu',    hz: 100 },
  ],
  annotation_format: 'txt',   // 每帧一个 .txt 文件
  label_coord: 'camera',      // 标注坐标系：相机坐标系（非 LiDAR）
  tasks: ['detection_2d', 'detection_3d', 'tracking', 'depth', 'flow', 'odometry'],
};

// ─── KITTI 目标类别 ────────────────────────────────────────────
export const KITTI_CLASSES = [
  { name: 'Car',          color: '#6c5ce7', count: 28_742 },
  { name: 'Pedestrian',   color: '#fd79a8', count: 4_487  },
  { name: 'Cyclist',      color: '#00cec9', count: 1_627  },
  { name: 'Van',          color: '#fdcb6e', count: 2_914  },
  { name: 'Truck',        color: '#74b9ff', count: 1_094  },
  { name: 'Misc',         color: '#a29bfe', count: 973    },
  { name: 'Tram',         color: '#e17055', count: 511    },
  { name: 'Person_sitting',color:'#55efc4', count: 222    },
];

// ─── KITTI 模拟样本（前向单目 + 64线LiDAR） ───────────────────
export const KITTI_SAMPLES = Array.from({ length: 4 }, (_, si) => {
  const rng = seededRng(si * 1337 + 42);

  // KITTI LiDAR 点云（64线，前向半球，更密集）
  const lidar = [];
  for (let i = 0; i < 1200; i++) {
    const angle = (rng() - 0.5) * Math.PI; // 前向 ±90°
    const r = Math.pow(rng(), 0.4) * 60;
    const x = r * Math.cos(angle);
    const y = r * Math.sin(angle);
    const z = (rng() - 0.5) * 4;
    lidar.push({ x: +x.toFixed(2), y: +y.toFixed(2), z: +z.toFixed(2), intensity: +rng().toFixed(3) });
  }

  // KITTI 3D 框（相机坐标系，仅前向）
  const boxes = [];
  const numBoxes = 4 + Math.floor(rng() * 6);
  for (let i = 0; i < numBoxes; i++) {
    const cls = KITTI_CLASSES[Math.floor(rng() * 4)];
    const dist = 5 + rng() * 50;
    const lateral = (rng() - 0.5) * 10;
    const w = cls.name === 'Car' ? 1.9 : cls.name === 'Van' ? 2.1 : 0.6;
    const l = cls.name === 'Car' ? 4.3 : cls.name === 'Van' ? 5.2 : 1.7;
    const h = cls.name === 'Car' ? 1.5 : cls.name === 'Van' ? 2.0 : 1.7;
    const truncated = +(rng() * 0.5).toFixed(2);
    const occluded = Math.floor(rng() * 3); // 0=完全可见, 1=部分遮挡, 2=大部分遮挡
    const score = +(0.55 + rng() * 0.43).toFixed(2);
    // 2D 投影框（归一化）
    const u = 0.1 + rng() * 0.8;
    const v = 0.3 + rng() * 0.4;
    const bw = cls.name === 'Pedestrian' ? 0.05 : 0.14;
    const bh = cls.name === 'Pedestrian' ? 0.2 : 0.12;
    boxes.push({
      id: i, cls: cls.name, color: cls.color,
      x: +dist.toFixed(2), y: +lateral.toFixed(2), z: 0,
      w, l, h,
      dist: +dist.toFixed(1),
      truncated, occluded,
      score,
      bbox2d: { u, v, bw, bh }, // 归一化 2D 框
    });
  }

  // 自车状态
  const ego_speed = +(rng() * 20).toFixed(1);

  return {
    id: si,
    frame_id: (si * 317 + 100).toString().padStart(6, '0'),
    sequence: `2011_09_2${si}`,
    weather: '晴天',
    time_of_day: '白天',
    lidar,
    boxes,
    ego_speed,
    num_objects: boxes.length,
  };
});

// ════════════════════════════════════════════════════════════════
// 数据集横向对比
// ════════════════════════════════════════════════════════════════

// ─── 数据集规模对比 ────────────────────────────────────────────
export const DATASET_COMPARISON = [
  {
    name: 'KITTI',
    color: '#fdcb6e',
    samples: 14_999,
    annotations: 80_256,
    scenes: 22,
    cameras: 4,
    lidar_lines: 64,
    has_radar: false,
    has_map: false,
    has_velocity: false,
    coord_system: '相机坐标系',
    annotation_format: 'TXT（每帧）',
    fov: '前向 90°',
    year: 2012,
    size_gb: 180,
  },
  {
    name: 'nuPlan',
    color: '#6c5ce7',
    samples: 15_000_000,
    annotations: 150_000_000,
    scenes: 1_500,
    cameras: 8,
    lidar_lines: 32,
    has_radar: false,
    has_map: true,
    has_velocity: true,
    coord_system: 'LiDAR 坐标系',
    annotation_format: 'SQLite + Parquet',
    fov: '360° 环视',
    year: 2021,
    size_gb: 1_500,
  },
  {
    name: 'Waymo Open',
    color: '#00cec9',
    samples: 200_000,
    annotations: 12_000_000,
    scenes: 1_000,
    cameras: 5,
    lidar_lines: 64,
    has_radar: false,
    has_map: false,
    has_velocity: true,
    coord_system: 'LiDAR 坐标系',
    annotation_format: 'TFRecord',
    fov: '360° 环视',
    year: 2019,
    size_gb: 1_000,
  },
  {
    name: 'Argoverse2',
    color: '#fd79a8',
    samples: 1_000_000,
    annotations: 30_000_000,
    scenes: 1_000,
    cameras: 7,
    lidar_lines: 64,
    has_radar: false,
    has_map: true,
    has_velocity: true,
    coord_system: 'LiDAR 坐标系',
    annotation_format: 'Parquet',
    fov: '360° 环视',
    year: 2023,
    size_gb: 1_000,
  },
];

// ─── VLA 输入模态信息量分析 ────────────────────────────────────
// 各输入模态对 VLA 规划任务的信息贡献度（0-10 分）
export const VLA_MODALITY_SCORES = [
  {
    modality: '原始图像\n(多视角)',
    richness: 9,    // 纹理/颜色/语义丰富
    geometry: 5,    // 深度模糊，需推断
    temporal: 7,    // 帧间光流可估计
    range: 4,       // 受遮挡/距离限制
    cost: 3,        // 计算成本低
    desc: '语义最丰富，但几何信息需隐式推断',
  },
  {
    modality: 'BEV 特征\n(投影)',
    richness: 5,    // 纹理信息损失
    geometry: 8,    // 空间关系清晰
    temporal: 6,    // 可叠加历史帧
    range: 7,       // 覆盖范围大
    cost: 6,        // 需要 BEVFormer 等预处理
    desc: '空间关系好，但纹理/外观信息大量丢失',
  },
  {
    modality: 'LiDAR 点云\n(原始)',
    richness: 3,    // 无颜色/纹理
    geometry: 10,   // 精确 3D 几何
    temporal: 5,    // 帧间配准复杂
    range: 9,       // 70m+ 精确测距
    cost: 8,        // 点云处理计算量大
    desc: '几何精度最高，但缺乏语义/外观信息',
  },
  {
    modality: '3D 检测框\n(结构化)',
    richness: 2,    // 高度抽象
    geometry: 8,    // 位置/尺寸精确
    temporal: 8,    // 跟踪 ID 连续
    range: 8,       // 检测范围内精确
    cost: 2,        // 极低，已预处理
    desc: '最紧凑，但丢失了大量未检测目标信息',
  },
  {
    modality: '图像+点云\n(融合)',
    richness: 9,
    geometry: 10,
    temporal: 8,
    range: 9,
    cost: 9,        // 最高计算成本
    desc: '信息最完整，是端到端 VLA 的理想输入',
  },
];

// ─── BEV 信息损失量化 ─────────────────────────────────────────
export const BEV_INFO_LOSS = [
  { aspect: '纹理/颜色',   raw_img: 95, bev_proj: 30, lidar_bev: 5,  note: 'BEV 投影严重损失外观信息' },
  { aspect: '语义理解',    raw_img: 90, bev_proj: 55, lidar_bev: 20, note: '语言模型对图像语义理解更强' },
  { aspect: '3D 几何',     raw_img: 40, bev_proj: 75, lidar_bev: 98, note: 'BEV 保留了空间关系' },
  { aspect: '遮挡处理',    raw_img: 35, bev_proj: 60, lidar_bev: 70, note: 'BEV 可部分处理遮挡' },
  { aspect: '长距离感知',  raw_img: 50, bev_proj: 70, lidar_bev: 85, note: 'LiDAR BEV 远距离精度高' },
  { aspect: '实例区分',    raw_img: 80, bev_proj: 70, lidar_bev: 65, note: '图像颜色/纹理有助于区分' },
  { aspect: '车道线/地图', raw_img: 60, bev_proj: 85, lidar_bev: 40, note: 'BEV 视角更适合地图元素' },
  { aspect: '速度估计',    raw_img: 45, bev_proj: 65, lidar_bev: 55, note: '需要时序信息辅助' },
];
