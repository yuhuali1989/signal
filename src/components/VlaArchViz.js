'use client';

import {
  ARCH_NODES, ARCH_EDGES, TRAIN_CONFIG, PIPELINE_STAGES,
  DATASET_SELECTION, DATASET_STATS,
  OPENDV_MULTIFRAME, NUPLAN_MULTIFRAME, CARLA_MULTIFRAME, WAYMO_MULTIFRAME,
  SENSOR_ALIGN_METHODS,
} from '@/lib/vla-data';
import {
  KITTI_SAMPLES, KITTI_CLASSES, DATASET_COMPARISON,
  VLA_MODALITY_SCORES, BEV_INFO_LOSS,
} from '@/lib/ad-data';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import { useState } from 'react';

// ════════════════════════════════════════════════════════════════
// 架构图
// ════════════════════════════════════════════════════════════════
const GROUP_META = {
  input:   { label: '输入层（原始传感器）', bg: '#f8f9fa', border: '#dee2e6', text: '#495057' },
  encoder: { label: '编码器层',            bg: '#f3f0ff', border: '#a29bfe', text: '#6c5ce7' },
  fusion:  { label: '统一投影层',          bg: '#e8f4fd', border: '#74b9ff', text: '#0984e3' },
  core:    { label: '统一隐状态',          bg: '#e8fdf5', border: '#00cec9', text: '#00b894' },
  output:  { label: '输出层',              bg: '#fff5f7', border: '#fd79a8', text: '#e84393' },
};

const NODE_DETAIL = {
  cam6:      { title: '6路环视相机（原始输入）', desc: '前/左前/右前/后/左后/右后，分辨1600×900，12Hz。直接输入原始RGB图像，不做任何BEV投影。', color: '#a29bfe' },
  lidar:     { title: 'LiDAR 点云（原始输入）', desc: '64线Velodyne，120m量程，10Hz。原始点云送入PointPillar做体素化，输出空间特征。', color: '#74b9ff' },
  map:       { title: 'HD Map 矢量地图', desc: '车道线、停止线、人行横道等矢量元素，以折线/多边形表示，送入MapTR做图结构编码。', color: '#a29bfe' },
  lang:      { title: '语言指令（自然语言）', desc: '如“在前方路口左转”。由GPT-4V对场景自动生成，构建<场景,指令,动作>三元组。', color: '#6c5ce7' },
  vit:       { title: 'InternViT-6B 视觉 Tokenizer', desc: 'InternVL2预训练，对6路图像分别提取patch token（256 tokens/帧），输出[B, 1536, 4096]视觉特征。', color: '#a29bfe' },
  lidar_enc: { title: 'PointPillar 点云 Voxelizer', desc: '将点云分割为柱体（voxel size=0.2m），提取柱体特征后投影到BEV网格，输出[B, 200, 200, 256]空间特征。', color: '#74b9ff' },
  map_enc:   { title: 'MapTR 地图 Encoder', desc: '将HD Map矢量元素编码为图结构特征，捕捉车道拓扑关系，输出地图语义特征。', color: '#a29bfe' },
  llm:       { title: 'InternLM2-7B 语言 Backbone', desc: '语言理解主干，处理自然语言指令。通过Unified Projector接收视觉/点云/地图特征，实现多模态对齐。', color: '#6c5ce7' },
  proj:      { title: 'Unified Projector（核心创新）', desc: 'DriveWorld-VLA的核心设计：MLP+Cross-Attention将所有模态特征投影到统一隐空间（dim=4096）。不需要独立的BEV融合模块。', color: '#74b9ff' },
  temporal:  { title: 'Temporal Encoder（时序建模）', desc: 'Temporal Transformer对T=8帧历史特征做时序聚合，捕捉场景动态变化。输出包含时序信息的隐状态。', color: '#00cec9' },
  latent:    { title: '统一隐状态 Z_t（论文核心）', desc: 'DriveWorld-VLA的统一隐状态，同时驱动VLA规划头和世界模型预测头。实现了“一个隐空间，两个任务”的统一建模。', color: '#00cec9' },
  vla_head:  { title: 'VLA Head（规划 Decoder）', desc: 'AR Transformer-Decoder，基于统一隐状态Z_t和语言指令，自回归生成未来 20 步waypoints（每步0.5s，共10s规划域）。', color: '#fd79a8' },
  wm_head:   { title: 'World Model Head（预测 Decoder）', desc: 'Diffusion Decoder（DDPM），基于统一隐状态Z_t在隐空间想象未来H=20步场景状态，提供RL奖励信号。', color: '#55efc4' },
  waypoints: { title: '规划轨迹 Waypoints', desc: '输出20个BEV坐标点，表示自车未来 10s 的行驶轨迹。由下游控制器（PID/MPC）转换为方向盘/油门/刹车指令。', color: '#fdcb6e' },
  action:    { title: '控制指令（throttle/steer）', desc: '直接输出归一化的油门、券转、刹车指令，用于闭环仿真训练和CARLA实验。', color: '#fd79a8' },
  future_s:  { title: '未来场景预测 ŝ_{t+1..t+H}', desc: 'World Model在隐空间中想象未来H=20步的场景状态，用于训练时提供想象数据做RL，推理时验证规划安全性。', color: '#55efc4' },
  occ_pred:  { title: 'Occupancy Flow 预测', desc: '预测3D占用网格中每个体素的占用概率和流向，用于碰撞检测和安全规划。同时作为World Model的辅助监督信号。', color: '#a29bfe' },
};

function ArchSVG({ highlighted, onNodeClick }) {
  const W = 980, H = 520, NODE_W = 118, NODE_H = 50;
  // 暗色主题层区带
  const zones = [
    { x: 8,   label: '输入层', group: 'input'   },
    { x: 198, label: '编码器', group: 'encoder' },
    { x: 388, label: '统一投影', group: 'fusion'  },
    { x: 578, label: '统一隐状态', group: 'core'    },
    { x: 768, label: '输出层', group: 'output'  },
  ];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 460, background: '#f8fafc', borderRadius: 16, border: '1px solid #e2e8f0' }}>
      <defs>
        <marker id="arrow"    markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L7,3 z" fill="#a0aec0" /></marker>
        <marker id="arrow-hi" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L7,3 z" fill="#6c5ce7" /></marker>
        <filter id="glow"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      {/* 层区背景 */}
      {zones.map(zone => {
        const meta = GROUP_META[zone.group];
        return (
          <g key={zone.group}>
            <rect x={zone.x} y={14} width={178} height={H-28} rx={12} fill={meta.bg} stroke={meta.border} strokeWidth={1} opacity={0.5} />
            <text x={zone.x+89} y={32} textAnchor="middle" fontSize={9} fill={meta.text} fontWeight={700} letterSpacing={1}>{zone.label}</text>
          </g>
        );
      })}
      {/* 连接线 */}
      {ARCH_EDGES.map((e, i) => {
        const from = ARCH_NODES.find(n => n.id === e.from);
        const to   = ARCH_NODES.find(n => n.id === e.to);
        if (!from || !to) return null;
        const x1 = from.x + NODE_W, y1 = from.y + NODE_H/2;
        const x2 = to.x,            y2 = to.y   + NODE_H/2;
        const mx = (x1 + x2) / 2;
        const isHi = highlighted === e.from || highlighted === e.to;
        return (
          <path key={i}
            d={`M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`}
            fill="none"
            stroke={isHi ? '#6c5ce7' : '#cbd5e0'}
            strokeWidth={isHi ? 2.5 : 1.2}
            opacity={isHi ? 1 : 0.6}
            markerEnd={isHi ? 'url(#arrow-hi)' : 'url(#arrow)'}
          />
        );
      })}
      {/* 节点 */}
      {ARCH_NODES.map(node => {
        const meta = GROUP_META[node.group];
        const isActive = highlighted === node.id;
        const lines = node.label.split('\n');
        // 统一隐状态节点特殊样式
        const isCore = node.id === 'latent';
        return (
          <g key={node.id} style={{ cursor: 'pointer' }} onClick={() => onNodeClick(node.id)}>
            <rect
              x={node.x} y={node.y} width={NODE_W} height={NODE_H} rx={10}
            fill={isActive ? node.color : isCore ? '#e8fdf5' : meta.bg}
              stroke={isActive ? node.color : isCore ? '#00cec9' : meta.border}
              strokeWidth={isActive ? 2.5 : isCore ? 2 : 1.2}
              filter={isActive ? 'url(#glow)' : 'none'}
            />
            {lines.map((line, li) => (
              <text key={li}
                x={node.x + NODE_W/2}
                y={node.y + (lines.length === 1 ? NODE_H/2+4 : li === 0 ? NODE_H/2-5 : NODE_H/2+9)}
                textAnchor="middle"
                fontSize={li === 0 ? 10 : 8}
                fontWeight={li === 0 ? 700 : 400}
                fill={isActive ? '#fff' : isCore ? '#00b894' : meta.text}
              >{line}</text>
            ))}
          </g>
        );
      })}
      {/* 统一隐状态标注 */}
      {(() => {
        const n = ARCH_NODES.find(n => n.id === 'latent');
        if (!n) return null;
        return <text x={n.x + NODE_W/2} y={n.y + NODE_H + 14} textAnchor="middle" fontSize={8} fill="#00b894" opacity={0.9}>★ Unified Latent Space</text>;
      })()}
    </svg>
  );
}

// ════════════════════════════════════════════════════════════════
// 数据集可视化：KITTI
// ════════════════════════════════════════════════════════════════
function KittiViz() {
  const [selectedSample, setSelectedSample] = useState(0);
  const sample = KITTI_SAMPLES[selectedSample];
  const kittiDist = Array.from({ length: 10 }, (_, i) => ({
    range: `${i*5}-${(i+1)*5}m`,
    Car:        Math.round(Math.exp(-Math.pow(i-2,2)/6)*600+50),
    Pedestrian: Math.round(Math.exp(-Math.pow(i-1,2)/4)*250+30),
    Cyclist:    Math.round(Math.exp(-Math.pow(i-2,2)/5)*120+20),
    Van:        Math.round(Math.exp(-Math.pow(i-3,2)/8)*180+25),
  }));
  const occDist = [
    { level: '完全可见(0)', count: 18420, color: '#55efc4' },
    { level: '部分遮挡(1)', count: 9830,  color: '#fdcb6e' },
    { level: '大部分遮挡(2)', count: 4210, color: '#fd79a8' },
    { level: '未知(3)',     count: 1820,  color: '#718096' },
  ];

  return (
    <div className="space-y-4">
      {/* 样本选择 */}
      <div className="flex gap-2 flex-wrap">
        {KITTI_SAMPLES.map(s => (
          <button key={s.id} onClick={() => setSelectedSample(s.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all"
            style={selectedSample === s.id
              ? { background: '#fdcb6e', borderColor: '#fdcb6e', color: '#1a1200', boxShadow: '0 2px 8px #fdcb6e55' }
              : { background: '#f8f9fa', borderColor: '#e2e8f0', color: '#718096' }}>
            <span className="font-mono">{s.sequence}</span>
            <span className="opacity-70">{s.num_objects}obj</span>
          </button>
        ))}
      </div>

      {/* 相机帧 + LiDAR BEV */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-800">📷 前向单目相机</h4>
            <span className="text-[10px] text-gray-400 font-mono">1242×375 · 10Hz</span>
          </div>
          <KittiCamCanvas sample={sample} />
          <div className="mt-3 grid grid-cols-2 gap-1.5 max-h-28 overflow-y-auto">
            {sample.boxes.map(box => (
              <div key={box.id} className="flex items-center gap-2 px-2 py-1 rounded-lg bg-gray-100 text-[10px]">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: box.color }} />
                <span className="font-mono text-gray-500">{box.cls}</span>
                <span className="text-gray-400 ml-auto">{box.dist}m</span>
                <span style={{ color: box.occluded===0?'#55efc4':box.occluded===1?'#fdcb6e':'#fd79a8' }}>
                  {box.occluded===0?'可见':box.occluded===1?'部分':'遮挡'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-800">🗺️ LiDAR BEV（前向）</h4>
            <span className="text-[10px] text-gray-400 font-mono">64线 · 120m · {sample.lidar.length}点</span>
          </div>
          <KittiBevCanvas sample={sample} />
          <div className="mt-3 grid grid-cols-2 gap-2 text-[10px]">
            <div className="p-2 rounded-lg bg-gray-100">
              <p className="text-[#fdcb6e] font-medium mb-1">KITTI Velodyne HDL-64E</p>
              <p className="text-gray-400">64 线 · 120m · 10Hz</p>
              <p className="text-[#55efc4] mt-1">✓ 点云更密集</p>
            </div>
            <div className="p-2 rounded-lg bg-gray-100">
              <p className="text-[#6c5ce7] font-medium mb-1">nuPlan LiDAR</p>
              <p className="text-gray-400">32 线 · 70m · 20Hz</p>
              <p className="text-[#fd79a8] mt-1">✓ 帧率更高</p>
            </div>
          </div>
        </div>
      </div>

      {/* 标注格式 */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <h4 className="text-sm font-semibold text-gray-800 mb-3">📄 KITTI 标注格式（TXT）</h4>
        <div className="font-mono text-[10px] bg-[#1e2030] rounded-xl p-3 overflow-x-auto">
          <p className="text-[#4a5568] mb-1"># type truncated occluded alpha  bbox(4)          dimensions(3)    location(3)      rotation_y  score</p>
          {sample.boxes.slice(0, 3).map(box => (
            <p key={box.id} className="text-[#e2e8f0] mb-0.5">
              <span style={{ color: box.color }}>{box.cls.padEnd(12)}</span>
              <span className="text-[#718096]">{box.truncated.toFixed(2).padStart(5)} {box.occluded.toString().padStart(2)} </span>
              <span className="text-[#74b9ff]">{box.alpha.toFixed(2).padStart(6)} </span>
              <span className="text-[#55efc4]">{box.bbox2d.map(v=>v.toFixed(1)).join(' ')} </span>
              <span className="text-[#fdcb6e]">{box.dims.map(v=>v.toFixed(2)).join(' ')} </span>
              <span className="text-[#fd79a8]">{box.loc.map(v=>v.toFixed(2)).join(' ')} </span>
              <span className="text-[#a29bfe]">{box.ry.toFixed(2)}</span>
              <span className="text-[#718096]"> {box.score.toFixed(2)}</span>
            </p>
          ))}
        </div>
      </div>

      {/* 统计图 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <h4 className="text-sm font-semibold text-gray-800 mb-1">KITTI 目标类别分布</h4>
          <p className="text-[10px] text-gray-400 mb-3">训练集标注框数量</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={KITTI_CLASSES} layout="vertical" barSize={14}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 9, fill: '#718096' }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#718096' }} width={90} />
              <Tooltip contentStyle={{ background: '#f8f9fa', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 11 }} formatter={v => v.toLocaleString()} />
              <Bar dataKey="count" radius={[0,4,4,0]}>{KITTI_CLASSES.map((c,i) => <Cell key={i} fill={c.color} />)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <h4 className="text-sm font-semibold text-gray-800 mb-1">KITTI 遮挡等级分布</h4>
          <p className="text-[10px] text-gray-400 mb-3">标注框遮挡程度统计</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={occDist} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="level" tick={{ fontSize: 9, fill: '#718096' }} />
              <YAxis tick={{ fontSize: 9, fill: '#718096' }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ background: '#f8f9fa', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 11 }} formatter={v => v.toLocaleString()} />
              <Bar dataKey="count" name="标注框数" radius={[4,4,0,0]}>{occDist.map((d,i) => <Cell key={i} fill={d.color} />)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 lg:col-span-2">
          <h4 className="text-sm font-semibold text-gray-800 mb-1">KITTI 目标距离分布</h4>
          <p className="text-[10px] text-gray-400 mb-3">各类别在不同距离区间的标注数量（前向 50m）</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={kittiDist} barSize={6}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="range" tick={{ fontSize: 8, fill: '#718096' }} />
              <YAxis tick={{ fontSize: 9, fill: '#718096' }} />
              <Tooltip contentStyle={{ background: '#f8f9fa', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 10, color: '#8892a4' }} />
              <Bar dataKey="Car" fill="#6c5ce7" stackId="a" />
              <Bar dataKey="Pedestrian" fill="#fd79a8" stackId="a" />
              <Bar dataKey="Cyclist" fill="#00cec9" stackId="a" />
              <Bar dataKey="Van" fill="#fdcb6e" stackId="a" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 数据集可视化：nuPlan（规划轨迹 + HD Map 说明）
// ════════════════════════════════════════════════════════════════
function NuPlanViz() {
  const [subView, setSubView] = useState('overview');
  const waypointData = Array.from({ length: 20 }, (_, i) => {
    const t = i / 19;
    return { step: `t+${i+1}`, x: +(t * 8 + Math.sin(t * 2) * 0.5).toFixed(2), y: +(Math.sin(t * 1.5) * 1.2).toFixed(2) };
  });
  const speedProfile = Array.from({ length: 20 }, (_, i) => ({
    step: `t+${i+1}`,
    speed: +(8 + Math.sin(i / 3) * 2 + 0.3).toFixed(1),
    accel: +((Math.cos(i / 3) * 0.8)).toFixed(2),
  }));

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {[['overview','📊 数据概览'],['multiframe','🎞️ 多帧时序'],['align','🔗 传感器对齐']].map(([id,label]) => (
          <button key={id} onClick={() => setSubView(id)}
            className="px-3 py-1.5 rounded-xl text-xs font-medium border transition-all"
            style={subView===id ? { background:'#00cec9', borderColor:'#00cec9', color:'#fff' } : { background:'#f8f9fa', borderColor:'#e2e8f0', color:'#718096' }}>
            {label}
          </button>
        ))}
      </div>

      {subView === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: '总时长', value: '1,500h', icon: '⏱️', color: '#6c5ce7' },
              { label: '标注帧数', value: '15M', icon: '🎬', color: '#00cec9' },
              { label: 'HD Map 覆盖', value: '✓ 全覆盖', icon: '🗺️', color: '#fd79a8' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ background: s.color + '22' }}>{s.icon}</div>
                <div>
                  <p className="text-base font-bold font-mono" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-[10px] text-gray-400">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <h4 className="text-sm font-semibold text-gray-800 mb-1">专家驾驶轨迹（Waypoints）</h4>
              <p className="text-[10px] text-gray-400 mb-3">未来 20 步规划轨迹（BEV 坐标，单位 m）</p>
              <NuPlanTrajCanvas waypoints={waypointData} />
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <h4 className="text-sm font-semibold text-gray-800 mb-1">速度 & 加速度剖面</h4>
              <p className="text-[10px] text-gray-400 mb-3">nuPlan 提供精确的速度/加速度标注</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={speedProfile} barSize={8}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="step" tick={{ fontSize: 8, fill: '#718096' }} interval={3} />
                  <YAxis tick={{ fontSize: 9, fill: '#718096' }} />
                  <Tooltip contentStyle={{ background: '#f8f9fa', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 11 }} />
                  <Legend wrapperStyle={{ fontSize: 10, color: '#8892a4' }} />
                  <Bar dataKey="speed" name="速度(m/s)" fill="#6c5ce7" radius={[2,2,0,0]} />
                  <Bar dataKey="accel" name="加速度(m/s²)" fill="#00cec9" radius={[2,2,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <h4 className="text-sm font-semibold text-gray-800 mb-3">🗺️ HD Map 元素（VLA 规划必须）</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { name: '车道线', color: '#6c5ce7', desc: '车道中心线 + 边界线，折线表示' },
                { name: '停止线', color: '#fd79a8', desc: '路口停止位置，横线表示' },
                { name: '人行横道', color: '#fdcb6e', desc: '行人过街区域，多边形表示' },
                { name: '路口区域', color: '#00cec9', desc: '交叉路口范围，多边形表示' },
              ].map(m => (
                <div key={m.name} className="p-3 rounded-xl bg-gray-50 border" style={{ borderColor: m.color + '44' }}>
                  <div className="w-3 h-3 rounded-sm mb-2" style={{ background: m.color }} />
                  <p className="text-[11px] font-bold mb-1" style={{ color: m.color }}>{m.name}</p>
                  <p className="text-[10px] text-gray-400">{m.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {subView === 'multiframe' && (
        <MultiFrameView frames={NUPLAN_MULTIFRAME} dsName="nuPlan" color="#00cec9" />
      )}

      {subView === 'align' && (
        <SensorAlignView highlightMethod="imu_preintegration" />
      )}
    </div>
  );
}

// nuPlan 轨迹 Canvas
function NuPlanTrajCanvas({ waypoints }) {
  const W = 400, H = 200;
  const xs = waypoints.map(p => p.x), ys = waypoints.map(p => p.y);
  const xMin = Math.min(...xs), xMax = Math.max(...xs);
  const yMin = Math.min(...ys), yMax = Math.max(...ys);
  const pad = 20;
  const toSvgX = x => pad + (x - xMin) / (xMax - xMin + 0.01) * (W - 2*pad);
  const toSvgY = y => H - pad - (y - yMin) / (yMax - yMin + 0.01) * (H - 2*pad);
  const pathD = waypoints.map((p, i) => `${i===0?'M':'L'}${toSvgX(p.x).toFixed(1)},${toSvgY(p.y).toFixed(1)}`).join(' ');

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-xl bg-gray-50">
      {/* 网格 */}
      {[0.25,0.5,0.75].map(t => (
        <g key={t}>
          <line x1={pad} y1={pad + t*(H-2*pad)} x2={W-pad} y2={pad + t*(H-2*pad)} stroke="#e2e8f0" strokeWidth={1} />
          <line x1={pad + t*(W-2*pad)} y1={pad} x2={pad + t*(W-2*pad)} y2={H-pad} stroke="#e2e8f0" strokeWidth={1} />
        </g>
      ))}
      {/* 轨迹路径 */}
      <path d={pathD} fill="none" stroke="#6c5ce7" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {/* 轨迹点 */}
      {waypoints.map((p, i) => (
        <circle key={i} cx={toSvgX(p.x)} cy={toSvgY(p.y)} r={i===0?5:3}
          fill={i===0?'#fd79a8':i===waypoints.length-1?'#55efc4':'#6c5ce7'} opacity={0.8} />
      ))}
      {/* 起终点标注 */}
      <text x={toSvgX(waypoints[0].x)+8} y={toSvgY(waypoints[0].y)+4} fontSize={9} fill="#fd79a8">起点</text>
      <text x={toSvgX(waypoints[waypoints.length-1].x)+8} y={toSvgY(waypoints[waypoints.length-1].y)+4} fontSize={9} fill="#55efc4">终点</text>
    </svg>
  );
}

// ════════════════════════════════════════════════════════════════
// 数据集可视化：CARLA 仿真
// ════════════════════════════════════════════════════════════════
function CarlaViz() {
  const [subView, setSubView] = useState('overview');
  const scenarios = [
    { name: '直行跟车', color: '#6c5ce7', count: 12400, reward: 0.92 },
    { name: '路口左转', color: '#00cec9', count: 8200,  reward: 0.78 },
    { name: '路口右转', color: '#fd79a8', count: 7800,  reward: 0.81 },
    { name: '紧急避障', color: '#fdcb6e', count: 5600,  reward: 0.65 },
    { name: '变道超车', color: '#a29bfe', count: 6300,  reward: 0.72 },
    { name: '雨天行驶', color: '#55efc4', count: 4200,  reward: 0.69 },
  ];
  const rewardCurve = Array.from({ length: 30 }, (_, i) => ({
    ep: i * 100,
    reward: +(0.3 + i * 0.02 + Math.sin(i/3) * 0.05).toFixed(3),
  }));

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {[['overview','📊 数据概览'],['multiframe','🎞️ 多帧时序'],['align','🔗 传感器对齐']].map(([id,label]) => (
          <button key={id} onClick={() => setSubView(id)}
            className="px-3 py-1.5 rounded-xl text-xs font-medium border transition-all"
            style={subView===id ? { background:'#fd79a8', borderColor:'#fd79a8', color:'#fff' } : { background:'#f8f9fa', borderColor:'#e2e8f0', color:'#718096' }}>
            {label}
          </button>
        ))}
      </div>

      {subView === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: '仿真场景数', value: '3,840', icon: '🎮', color: '#fd79a8' },
              { label: '总帧数', value: '5M', icon: '🎬', color: '#6c5ce7' },
              { label: '平均奖励', value: '0.76', icon: '🏆', color: '#fdcb6e' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ background: s.color + '22' }}>{s.icon}</div>
                <div>
                  <p className="text-base font-bold font-mono" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-[10px] text-gray-400">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <h4 className="text-sm font-semibold text-gray-800 mb-1">场景类型分布</h4>
              <p className="text-[10px] text-gray-400 mb-3">各驾驶场景的仿真 episode 数量</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={scenarios} layout="vertical" barSize={16}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 9, fill: '#718096' }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#718096' }} width={70} />
                  <Tooltip contentStyle={{ background: '#f8f9fa', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 11 }} formatter={v => v.toLocaleString()} />
                  <Bar dataKey="count" name="episode数" radius={[0,4,4,0]}>{scenarios.map((s,i) => <Cell key={i} fill={s.color} />)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <h4 className="text-sm font-semibold text-gray-800 mb-1">闭环训练奖励曲线</h4>
              <p className="text-[10px] text-gray-400 mb-3">CARLA 仿真中 RL 训练的平均奖励</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={rewardCurve} barSize={6}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="ep" tick={{ fontSize: 8, fill: '#718096' }} tickFormatter={v => `${v}ep`} interval={4} />
                  <YAxis tick={{ fontSize: 9, fill: '#718096' }} domain={[0, 1]} />
                  <Tooltip contentStyle={{ background: '#f8f9fa', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 11 }} />
                  <Bar dataKey="reward" name="平均奖励" fill="#fd79a8" radius={[2,2,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-[#fdcb6e]/30 p-4">
            <h4 className="text-sm font-semibold text-[#fdcb6e] mb-3">💡 CARLA 在 VLA+世界模型中的作用</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { title: '闭环强化学习', desc: '世界模型在 CARLA 中试错，提供稠密奖励信号，弥补真实数据中稀疏奖励的问题', color: '#6c5ce7' },
                { title: '长尾场景覆盖', desc: '紧急避障、极端天气等真实数据中罕见的场景，在仿真中可以大量生成', color: '#00cec9' },
                { title: '世界模型验证', desc: '用 CARLA 真值验证世界模型的未来预测质量（FVD），形成闭环评估', color: '#fd79a8' },
                { title: 'Sim-to-Real 迁移', desc: '通过域随机化（光照/纹理/天气）减小 sim-to-real gap，提升真实场景泛化', color: '#fdcb6e' },
              ].map(s => (
                <div key={s.title} className="p-3 rounded-xl bg-gray-50 border" style={{ borderColor: s.color + '44' }}>
                  <p className="text-[11px] font-bold mb-1" style={{ color: s.color }}>{s.title}</p>
                  <p className="text-[10px] text-gray-400 leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {subView === 'multiframe' && (
        <MultiFrameView frames={CARLA_MULTIFRAME} dsName="CARLA 仿真" color="#fd79a8" />
      )}

      {subView === 'align' && (
        <div className="space-y-3">
          <div className="bg-white rounded-2xl border border-[#fd79a8]/30 p-4">
            <h4 className="text-sm font-semibold text-[#fd79a8] mb-2">✅ CARLA 仿真：天然硬件同步</h4>
            <p className="text-[11px] text-gray-500 leading-relaxed">
              CARLA 使用<span className="text-[#fd79a8] font-medium">同步模式（Synchronous Mode）</span>，所有传感器在同一 tick 内采集，时间戳完全一致，误差 &lt;1ms。
              这是仿真数据相比真实数据的最大优势之一，无需任何插值或补偿。
            </p>
          </div>
          <SensorAlignView highlightMethod="hardware_sync" />
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 数据集可视化：Waymo（评测基准）
// ════════════════════════════════════════════════════════════════
function WaymoViz() {
  const [subView, setSubView] = useState('overview');
  const metrics = [
    { name: 'L2 误差(m)', baseline: 1.82, ours: 0.54, oracle: 0.28, color: '#6c5ce7' },
    { name: '碰撞率(%)', baseline: 4.2, ours: 1.1, oracle: 0.3, color: '#fd79a8' },
    { name: 'FVD', baseline: 380, ours: 72, oracle: 35, color: '#00cec9' },
    { name: '成功率(%)', baseline: 61, ours: 84, oracle: 96, color: '#fdcb6e' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {[['overview','📊 数据概览'],['multiframe','🎞️ 多帧时序'],['align','🔗 传感器对齐']].map(([id,label]) => (
          <button key={id} onClick={() => setSubView(id)}
            className="px-3 py-1.5 rounded-xl text-xs font-medium border transition-all"
            style={subView===id ? { background:'#fdcb6e', borderColor:'#fdcb6e', color:'#1a1200' } : { background:'#f8f9fa', borderColor:'#e2e8f0', color:'#718096' }}>
            {label}
          </button>
        ))}
      </div>

      {subView === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: '评测场景', value: '1,000', icon: '📏', color: '#fdcb6e' },
              { label: '标注帧数', value: '200K', icon: '🎬', color: '#6c5ce7' },
              { label: '用途', value: '仅评测', icon: '🎯', color: '#00cec9' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ background: s.color + '22' }}>{s.icon}</div>
                <div>
                  <p className="text-base font-bold font-mono" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-[10px] text-gray-400">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <h4 className="text-sm font-semibold text-gray-800 mb-1">Waymo 评测指标对比</h4>
            <p className="text-[10px] text-gray-400 mb-4">Baseline vs DriveVLA（Ours）vs Oracle</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {metrics.map(m => (
                <div key={m.name} className="space-y-2">
                  <p className="text-[11px] font-medium" style={{ color: m.color }}>{m.name}</p>
                  {[['Baseline', m.baseline, '#4a5568'], ['Ours', m.ours, m.color], ['Oracle', m.oracle, '#55efc4']].map(([label, val, color]) => {
                    const maxVal = m.baseline;
                    const pct = Math.min(100, (val / maxVal) * 100);
                    return (
                      <div key={label} className="flex items-center gap-2 text-[10px]">
                        <span className="w-14 text-gray-400">{label}</span>
                        <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                        </div>
                        <span className="w-10 text-right font-mono" style={{ color }}>{val}</span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-[#fdcb6e]/30 p-4">
            <h4 className="text-sm font-semibold text-[#fdcb6e] mb-2">⚠️ 为什么 Waymo 只用于评测，不用于训练？</h4>
            <div className="space-y-1.5 text-[11px] text-gray-500">
              <p>• 无语言标注，无法构建 VLA 所需的 &lt;场景, 指令, 动作&gt; 三元组</p>
              <p>• 数据获取需要严格授权，不适合大规模训练</p>
              <p>• 作为独立评测集，可以客观验证模型在未见数据上的泛化能力</p>
              <p>• 业界公认的感知评测基准，便于与其他方法横向对比</p>
            </div>
          </div>
        </div>
      )}

      {subView === 'multiframe' && (
        <MultiFrameView frames={WAYMO_MULTIFRAME} dsName="Waymo Open" color="#fdcb6e" />
      )}

      {subView === 'align' && (
        <SensorAlignView highlightMethod="interpolate" />
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 数据集对比 & VLA 输入分析
// ════════════════════════════════════════════════════════════════
function DatasetCompareViz() {
  const [subView, setSubView] = useState('table');
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {[['table','📊 规模对比'],['vla','💡 VLA输入分析'],['bev','📉 BEV信息损失']].map(([id, label]) => (
          <button key={id} onClick={() => setSubView(id)}
            className="px-3 py-1.5 rounded-xl text-xs font-medium border transition-all"
            style={subView===id
              ? { background: '#6c5ce7', borderColor: '#6c5ce7', color: '#fff' }
              : { background: '#f8f9fa', borderColor: '#e2e8f0', color: '#718096' }}>
            {label}
          </button>
        ))}
      </div>

      {subView === 'table' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <h4 className="text-sm font-semibold text-gray-800 mb-3">标注框数量对比（对数坐标）</h4>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={DATASET_COMPARISON} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#718096' }} />
                  <YAxis scale="log" domain={['auto','auto']} tick={{ fontSize: 9, fill: '#718096' }} tickFormatter={v => v>=1e6?`${(v/1e6).toFixed(0)}M`:v>=1000?`${(v/1000).toFixed(0)}K`:v} />
                  <Tooltip contentStyle={{ background: '#f8f9fa', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 11 }} formatter={v => v.toLocaleString()} />
                  <Bar dataKey="annotations" name="标注框数" radius={[4,4,0,0]}>{DATASET_COMPARISON.map((d,i) => <Cell key={i} fill={d.color} />)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <h4 className="text-sm font-semibold text-gray-800 mb-3">标注帧数对比（对数坐标）</h4>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={DATASET_COMPARISON} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#718096' }} />
                  <YAxis scale="log" domain={['auto','auto']} tick={{ fontSize: 9, fill: '#718096' }} tickFormatter={v => v>=1e6?`${(v/1e6).toFixed(1)}M`:`${(v/1000).toFixed(0)}K`} />
                  <Tooltip contentStyle={{ background: '#f8f9fa', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 11 }} formatter={v => v.toLocaleString()} />
                  <Bar dataKey="samples" name="标注帧数" radius={[4,4,0,0]}>{DATASET_COMPARISON.map((d,i) => <Cell key={i} fill={d.color} />)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100"><h4 className="text-sm font-semibold text-gray-800">数据集特征全面对比</h4></div>
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead><tr className="border-b border-gray-100">
                  <th className="text-left px-4 py-2.5 text-gray-400 font-medium w-28">特征</th>
                  {DATASET_COMPARISON.map(d => <th key={d.name} className="px-4 py-2.5 text-center font-bold" style={{ color: d.color }}>{d.name}</th>)}
                </tr></thead>
                <tbody>
                  {[
                    { key:'year', label:'发布年份', fmt:v=>v },
                    { key:'samples', label:'标注帧数', fmt:v=>v.toLocaleString() },
                    { key:'annotations', label:'标注框数', fmt:v=>v>=1e6?`${(v/1e6).toFixed(1)}M`:`${(v/1000).toFixed(0)}K` },
                    { key:'cameras', label:'相机数量', fmt:v=>`${v} 路` },
                    { key:'lidar_lines', label:'LiDAR 线数', fmt:v=>`${v} 线` },
                    { key:'has_radar', label:'Radar', fmt:v=>v?'✅':'❌' },
                    { key:'has_map', label:'HD Map', fmt:v=>v?'✅':'❌' },
                    { key:'has_velocity', label:'速度标注', fmt:v=>v?'✅':'❌' },
                    { key:'fov', label:'视野范围', fmt:v=>v },
                    { key:'size_gb', label:'数据量', fmt:v=>`~${v>=1000?`${v/1000}TB`:`${v}GB`}` },
                  ].map((f,fi) => (
                    <tr key={f.key} className={fi%2===0?'bg-white':''}>
                      <td className="px-4 py-2 text-gray-400">{f.label}</td>
                      {DATASET_COMPARISON.map(d => <td key={d.name} className="px-4 py-2 text-center font-mono text-gray-500">{f.fmt(d[f.key])}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {subView === 'vla' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-[#fdcb6e]/30 p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">💡</span>
              <div>
                <h4 className="text-sm font-bold text-[#fdcb6e] mb-2">VLA 是否需要 BEV？——核心问题分析</h4>
                <p className="text-[11px] text-gray-500 leading-relaxed mb-3">
                  <span className="text-[#fd79a8] font-medium">BEV 确实会丢失大量信息</span>。BEV 是一种「中间表示」，把原始传感器数据压缩成俯视图，虽然空间关系清晰，但纹理、颜色、外观等语义信息大量损失。对于 VLA 这类需要理解语言指令并做出精细决策的模型，这是一个严重的问题。
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { title:'端到端方案（推荐）', desc:'直接输入原始多视角图像+点云，保留最完整信息', color:'#55efc4', icon:'✅', examples:['Tesla FSD','UniAD','VAD'] },
                    { title:'BEV 中间表示', desc:'BEVFormer 等预处理成 BEV 特征后输入，空间关系好但语义损失大', color:'#fdcb6e', icon:'⚠️', examples:['BEVFormer','BEVFusion','DETR3D'] },
                    { title:'结构化输入', desc:'只输入检测框/轨迹等结构化数据，信息损失最严重', color:'#fd79a8', icon:'❌', examples:['传统规划器','IDM','PDM'] },
                  ].map(s => (
                    <div key={s.title} className="p-3 rounded-xl bg-gray-50 border" style={{ borderColor: s.color+'44' }}>
                      <div className="flex items-center gap-1.5 mb-2"><span>{s.icon}</span><span className="text-xs font-bold" style={{ color: s.color }}>{s.title}</span></div>
                      <p className="text-[10px] text-gray-400 leading-relaxed mb-2">{s.desc}</p>
                      <div className="flex flex-wrap gap-1">{s.examples.map(e => <span key={e} className="text-[9px] px-1.5 py-0.5 rounded-full font-mono" style={{ background: s.color+'18', color: s.color }}>{e}</span>)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <h4 className="text-sm font-semibold text-gray-800 mb-4">各输入模态信息量对比（VLA 规划任务视角）</h4>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={[
                  { dim:'语义丰富度', '原始图像':9, 'BEV特征':5, 'LiDAR点云':3, '融合输入':9 },
                  { dim:'几何精度',   '原始图像':5, 'BEV特征':8, 'LiDAR点云':10,'融合输入':10 },
                  { dim:'时序连续',   '原始图像':7, 'BEV特征':6, 'LiDAR点云':5, '融合输入':8 },
                  { dim:'感知范围',   '原始图像':4, 'BEV特征':7, 'LiDAR点云':9, '融合输入':9 },
                  { dim:'计算效率',   '原始图像':8, 'BEV特征':5, 'LiDAR点云':3, '融合输入':2 },
                ]}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="dim" tick={{ fontSize: 9, fill: '#718096' }} />
                  <PolarRadiusAxis domain={[0,10]} tick={{ fontSize: 8, fill: '#718096' }} />
                  <Radar name="原始图像" dataKey="原始图像" stroke="#fd79a8" fill="#fd79a8" fillOpacity={0.15} />
                  <Radar name="BEV特征" dataKey="BEV特征" stroke="#fdcb6e" fill="#fdcb6e" fillOpacity={0.15} />
                  <Radar name="LiDAR点云" dataKey="LiDAR点云" stroke="#00cec9" fill="#00cec9" fillOpacity={0.15} />
                  <Radar name="融合输入" dataKey="融合输入" stroke="#6c5ce7" fill="#6c5ce7" fillOpacity={0.2} />
                  <Legend wrapperStyle={{ fontSize: 10, color: '#8892a4' }} />
                  <Tooltip contentStyle={{ background: '#f8f9fa', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 11 }} />
                </RadarChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {VLA_MODALITY_SCORES.map(m => (
                  <div key={m.modality} className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono text-[#a29bfe]">{m.modality.replace('\n',' ')}</span>
                      <div className="flex gap-1">
                        {[['语义',m.richness,'#fd79a8'],['几何',m.geometry,'#00cec9'],['效率',10-m.cost,'#55efc4']].map(([l,v,c]) => (
                          <span key={l} className="text-[9px] px-1.5 py-0.5 rounded-full font-mono" style={{ background: c+'22', color: c }}>{l}:{v}</span>
                        ))}
                      </div>
                    </div>
                    <p className="text-[10px] text-gray-400">{m.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {subView === 'bev' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <h4 className="text-sm font-semibold text-gray-800 mb-1">各维度信息保留率对比</h4>
            <p className="text-[10px] text-gray-400 mb-4">原始图像 vs BEV 投影 vs LiDAR BEV 在各感知维度的信息保留率（%）</p>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={BEV_INFO_LOSS} layout="vertical" barSize={10} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis type="number" domain={[0,100]} tick={{ fontSize: 9, fill: '#718096' }} tickFormatter={v => `${v}%`} />
                <YAxis type="category" dataKey="aspect" tick={{ fontSize: 10, fill: '#718096' }} width={72} />
                <Tooltip contentStyle={{ background: '#f8f9fa', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 11 }} formatter={(v,name) => [`${v}%`,name]} />
                <Legend wrapperStyle={{ fontSize: 10, color: '#8892a4' }} />
                <Bar dataKey="raw_img" name="原始图像" fill="#fd79a8" radius={[0,3,3,0]} />
                <Bar dataKey="bev_proj" name="BEV 投影" fill="#fdcb6e" radius={[0,3,3,0]} />
                <Bar dataKey="lidar_bev" name="LiDAR BEV" fill="#00cec9" radius={[0,3,3,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { title:'BEV 投影的核心问题', color:'#fd79a8', points:['纹理/颜色信息损失 ~70%，VLM 无法从 BEV 中读取语义','高度信息被压缩，无法区分行人/路牌/树木','相机内参/外参误差会导致 BEV 投影畸变','动态目标（如行人）在 BEV 中形变严重'] },
              { title:'何时 BEV 是合理的', color:'#55efc4', points:['输出规划轨迹时：BEV 坐标系直观且统一','多传感器融合时：LiDAR+Camera 在 BEV 对齐','地图元素感知：车道线/停止线天然是 BEV 表示','占用栅格预测：BEV Occupancy 是标准输出格式'] },
            ].map(s => (
              <div key={s.title} className="bg-white rounded-2xl border border-gray-100 p-4">
                <h4 className="text-sm font-bold mb-3" style={{ color: s.color }}>{s.title}</h4>
                <div className="space-y-1.5">{s.points.map(p => <div key={p} className="flex items-start gap-2 text-[11px]"><span style={{ color: s.color }} className="mt-0.5 flex-shrink-0">•</span><span className="text-gray-500 leading-relaxed">{p}</span></div>)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 数据集选型：可点击展开可视化
// ════════════════════════════════════════════════════════════════
// 每个数据集对应的可视化组件（策略映射）
const DS_VIZ = {
  'OpenDV-2K': null,   // 无精确标注，展示说明卡片
  'nuPlan':    NuPlanViz,
  'CARLA 仿真': CarlaViz,
  'Waymo Open': WaymoViz,
};

// OpenDV-2K 说明（无标注数据，展示文字说明）
function OpenDVInfo() {
  const [subView, setSubView] = useState('overview');
  const sampleCaptions = [
    '在高速公路上以 120km/h 巡航，前方有慢速车辆，请保持安全距离',
    '进入城市路口，红灯亮起，请减速停车等待',
    '雨天行驶，路面湿滑，请降低车速并保持车距',
    '夜间行驶，前方有行人过街，请减速礼让',
  ];
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {[['overview','📊 数据概览'],['multiframe','🎞️ 多帧时序'],['align','🔗 传感器对齐']].map(([id,label]) => (
          <button key={id} onClick={() => setSubView(id)}
            className="px-3 py-1.5 rounded-xl text-xs font-medium border transition-all"
            style={subView===id ? { background:'#6c5ce7', borderColor:'#6c5ce7', color:'#fff' } : { background:'#f8f9fa', borderColor:'#e2e8f0', color:'#718096' }}>
            {label}
          </button>
        ))}
      </div>

      {subView === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: '视频时长', value: '1,747h', icon: '🎬', color: '#6c5ce7' },
              { label: '总帧数', value: '2B+', icon: '📸', color: '#00cec9' },
              { label: '语言描述', value: 'GPT-4V 生成', icon: '💬', color: '#fd79a8' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ background: s.color+'22' }}>{s.icon}</div>
                <div>
                  <p className="text-base font-bold font-mono" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-[10px] text-gray-400">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <h4 className="text-sm font-semibold text-gray-800 mb-3">💬 GPT-4V 自动生成的语言描述样例</h4>
            <div className="space-y-2">
              {sampleCaptions.map((cap, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#6c5ce7]/20 text-[#a29bfe] font-mono flex-shrink-0">#{i+1}</span>
                  <p className="text-[11px] text-gray-500 leading-relaxed">{cap}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-[#6c5ce7]/30 p-4">
            <h4 className="text-sm font-semibold text-[#a29bfe] mb-2">🎯 OpenDV-2K 在训练中的作用</h4>
            <p className="text-[11px] text-gray-500 leading-relaxed">
              OpenDV-2K 用于 <span className="text-[#6c5ce7] font-medium">视觉预训练阶段</span>，让 ViT 编码器学习驾驶场景的视觉表示和时序动态。
              虽然无精确标注，但海量的真实驾驶视频 + GPT-4V 生成的语言描述，
              可以有效初始化视觉-语言对齐能力，为后续 nuPlan 精细调优打下基础。
            </p>
          </div>
        </div>
      )}

      {subView === 'multiframe' && (
        <MultiFrameView frames={OPENDV_MULTIFRAME} dsName="OpenDV-2K" color="#6c5ce7" />
      )}

      {subView === 'align' && (
        <div className="space-y-3">
          <div className="bg-white rounded-2xl border border-[#6c5ce7]/30 p-4">
            <h4 className="text-sm font-semibold text-[#a29bfe] mb-2">⚠️ OpenDV-2K 无需精确传感器对齐</h4>
            <p className="text-[11px] text-gray-500 leading-relaxed">
              OpenDV-2K 仅包含前向单目相机，无 LiDAR/Radar，因此不存在多传感器对齐问题。
              主要的预处理是<span className="text-[#6c5ce7] font-medium">帧间时序对齐</span>（统一到 10Hz）和<span className="text-[#6c5ce7] font-medium">质量过滤</span>（去除静止帧/模糊帧）。
            </p>
          </div>
          <SensorAlignView highlightMethod="nearest" />
        </div>
      )}
    </div>
  );
}

function DatasetOverview() {
  const [expandedDs, setExpandedDs] = useState(null);

  const handleCardClick = (dsName) => {
    setExpandedDs(expandedDs === dsName ? null : dsName);
  };

  // 获取展开的可视化组件
  const getVizComponent = (dsName) => {
    if (dsName === 'nuScenes') return <NuPlanViz />;      // nuScenes 复用 nuPlan 可视化（结构相似）
    if (dsName === 'DriveLM') return <OpenDVInfo />;      // DriveLM 展示语言标注信息
    if (dsName === 'NAVSIM') return <CarlaViz />;         // NAVSIM 展示闭环仿真信息
    if (dsName === 'OpenDV-2K') return <OpenDVInfo />;    // OpenDV-2K 展示视频预训练信息
    return null;
  };

  return (
    <div className="space-y-4">
      {/* 汇总数字 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: '总帧数', value: `${(DATASET_STATS.total_frames/1e6).toFixed(0)}M`, icon: '🎬', color: '#6c5ce7' },
          { label: '总时长', value: `${DATASET_STATS.total_hours.toLocaleString()}h`, icon: '⏱️', color: '#00cec9' },
          { label: '场景数', value: DATASET_STATS.total_scenarios.toLocaleString(), icon: '🗺️', color: '#fd79a8' },
          { label: '数据集', value: `${DATASET_SELECTION.length} 个`, icon: '📦', color: '#fdcb6e' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{ background: s.color+'18' }}>{s.icon}</div>
            <div>
              <p className="text-base font-bold font-mono" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[10px] text-gray-400">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 数据集卡片（可点击展开可视化） */}
      <div className="space-y-3">
        {DATASET_SELECTION.map(ds => {
          const isExpanded = expandedDs === ds.name;
          return (
            <div key={ds.name} className="rounded-2xl border overflow-hidden transition-all"
              style={{ borderColor: isExpanded ? ds.color : ds.color+'33' }}>
              {/* 卡片头部（可点击） */}
              <button className="w-full text-left p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors"
                onClick={() => handleCardClick(ds.name)}>
                <span className="text-2xl flex-shrink-0">{ds.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold" style={{ color: ds.color }}>{ds.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: ds.color+'18', color: ds.color }}>{ds.role}</span>
                  </div>
                  <div className="flex flex-wrap gap-3 text-[10px] text-gray-400">
                    <span>🎬 {(ds.frames/1e6).toFixed(1)}M 帧</span>
                    <span>⏱️ {ds.hours.toLocaleString()}h</span>
                    <span>📡 {ds.sensors.slice(0,2).join(' · ')}{ds.sensors.length>2?'...':''}</span>
                    {ds.has_map && <span className="text-green-500">✓ Map</span>}
                    {ds.has_language && <span className="text-blue-500">✓ Lang</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[10px] px-2 py-1 rounded-lg font-medium transition-all"
                    style={{ background: isExpanded ? ds.color : ds.color+'18', color: isExpanded ? '#fff' : ds.color }}>
                    {isExpanded ? '收起 ▲' : '查看数据 ▼'}
                  </span>
                </div>
              </button>

              {/* 展开的可视化内容 */}
              {isExpanded && (
                <div className="border-t p-4 bg-gray-50/50" style={{ borderColor: ds.color+'22' }}>
                  <div className="mb-3 text-[10px] text-gray-400 leading-relaxed">
                    <span className="font-medium" style={{ color: ds.color }}>为什么选择：</span>{ds.why}
                    <span className="ml-2 text-orange-400">⚠️ {ds.limitation}</span>
                  </div>
                  {getVizComponent(ds.name)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 数据集对比入口 */}
      <DatasetCompareViz />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 数据处理流水线
// ════════════════════════════════════════════════════════════════
function PipelineView() {
  const [activeStage, setActiveStage] = useState('ingest');
  const stage = PIPELINE_STAGES.find(s => s.id === activeStage);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {PIPELINE_STAGES.map((s, i) => (
          <button key={s.id} onClick={() => setActiveStage(s.id)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition-all"
            style={activeStage===s.id
              ? { background: s.color, borderColor: s.color, color: '#fff', boxShadow: `0 2px 10px ${s.color}55` }
              : { background: '#f8f9fa', borderColor: '#e2e8f0', color: '#718096' }}>
            <span>{s.icon}</span>
            <span>Step {i+1}</span>
            <span className="hidden sm:inline">{s.label}</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded-full"
              style={{ background: s.status==='done'?'#00b89422':s.status==='running'?'#fdcb6e22':'#e2e8f022',
                       color: s.status==='done'?'#00b894':s.status==='running'?'#e17055':'#b2bec3' }}>
              {s.status==='done'?'✓':s.status==='running'?'⟳':'…'}
            </span>
          </button>
        ))}
      </div>
      {stage && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">{stage.icon}</span>
              <div>
                <h4 className="text-sm font-bold text-gray-800">{stage.label}</h4>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: stage.color+'18', color: stage.color }}>
                  {stage.status==='done'?'✓ 已完成':stage.status==='running'?'⟳ 运行中':'⏳ 待执行'}
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed mb-3">{stage.desc}</p>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 border border-gray-100">
              <span className="text-sm">📤</span>
              <span className="text-xs font-mono text-gray-600">{stage.output}</span>
            </div>
            <div className="mt-3 space-y-1.5">
              {DATASET_SELECTION.map(ds => (
                <div key={ds.name} className="flex items-center gap-2 text-[10px]">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: ds.color }} />
                  <span className="font-medium" style={{ color: ds.color }}>{ds.name}</span>
                  <span className="text-gray-400">{ds.role}</span>
                  <span className="ml-auto text-gray-400 font-mono">{ds.hours.toLocaleString()}h</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-[#a29bfe] font-mono border border-gray-200">Python</span>
              <span className="text-[10px] text-gray-400">{stage.label} 核心代码</span>
            </div>
            <pre className="text-[10px] leading-relaxed overflow-x-auto font-mono bg-[#1e2030] rounded-xl p-3">
              {stage.code.split('\n').map((line, i) => (
                <div key={i}>
                  <span style={{ color: '#4a5568', userSelect: 'none', marginRight: 12, fontSize: 9 }}>{String(i+1).padStart(2,' ')}</span>
                  <span style={{ color: line.trim().startsWith('#')?'#6b7280':'#e2e8f0' }}>{line}</span>
                </div>
              ))}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 训练配置
// ════════════════════════════════════════════════════════════════
function TrainConfigTable() {
  const rows = [
    ['模型名称',    TRAIN_CONFIG.model],
    ['论文',        TRAIN_CONFIG.paper],
    ['视觉骨干',    TRAIN_CONFIG.backbone_vision],
    ['语言骨干',    TRAIN_CONFIG.backbone_lang],
    ['点云编码器',  TRAIN_CONFIG.lidar_encoder],
    ['地图编码器',  TRAIN_CONFIG.map_encoder],
    ['统一投影器',  TRAIN_CONFIG.unified_projector],
    ['时序编码器',  TRAIN_CONFIG.temporal_encoder],
    ['VLA Head',    TRAIN_CONFIG.vla_head],
    ['WM Head',     TRAIN_CONFIG.wm_head],
    ['动作表示',    TRAIN_CONFIG.action_type],
    ['隐状态维度',  `dim = ${TRAIN_CONFIG.latent_dim}`],
    ['WM Horizon',  `H = ${TRAIN_CONFIG.wm_horizon} 步 (10s)`],
    ['优化器',      TRAIN_CONFIG.optimizer],
    ['精度',        TRAIN_CONFIG.precision],
    ['训练数据',    TRAIN_CONFIG.train_data],
  ];
  const progress = (TRAIN_CONFIG.current_step / TRAIN_CONFIG.total_steps) * 100;
  // 判断当前阶段
  const stage = TRAIN_CONFIG.current_step < 100000 ? 1 : TRAIN_CONFIG.current_step < 250000 ? 2 : 3;
  const stageColor = { 1: '#6c5ce7', 2: '#00cec9', 3: '#fd79a8' }[stage];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-gray-800">DriveWorld-VLA 训练配置</h3>
        <span className="text-[10px] px-2 py-1 rounded-full font-bold" style={{ background: stageColor+'22', color: stageColor }}>
          当前 Stage {stage}
        </span>
      </div>
      <div className="space-y-1.5 mb-4">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-start gap-2 text-[11px]">
            <span className="text-gray-400 w-28 flex-shrink-0 pt-0.5">{k}</span>
            <span className="text-gray-500 font-mono break-all leading-relaxed">{v}</span>
          </div>
        ))}
      </div>
      {/* 三阶段进度条 */}
      <div className="mt-4">
        <div className="flex justify-between text-[10px] text-gray-400 mb-2">
          <span>总训练进度</span>
          <span className="font-mono" style={{ color: stageColor }}>{TRAIN_CONFIG.current_step.toLocaleString()} / {TRAIN_CONFIG.total_steps.toLocaleString()} steps ({progress.toFixed(1)}%)</span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden relative">
          {/* Stage1 区域 */}
          <div className="absolute h-full rounded-l-full" style={{ width: '28.6%', background: '#6c5ce7', opacity: 0.4 }} />
          {/* Stage2 区域 */}
          <div className="absolute h-full" style={{ left: '28.6%', width: '42.8%', background: '#00cec9', opacity: 0.4 }} />
          {/* Stage3 区域 */}
          <div className="absolute h-full rounded-r-full" style={{ left: '71.4%', width: '28.6%', background: '#fd79a8', opacity: 0.4 }} />
          {/* 实际进度 */}
          <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: `linear-gradient(90deg, #6c5ce7, #00cec9)` }} />
        </div>
        <div className="flex justify-between text-[9px] text-gray-400 mt-1">
          <span>Stage1 (0-100k)</span>
          <span>Stage2 (100k-250k)</span>
          <span>Stage3 (250k-350k)</span>
        </div>
      </div>
      {/* 损失权重 */}
      <div className="mt-4 p-3 rounded-xl bg-gray-50 border border-gray-100">
        <p className="text-[10px] text-gray-400 mb-2">联合损失权重</p>
        <div className="flex gap-3 flex-wrap">
          {Object.entries(TRAIN_CONFIG.loss_weights).map(([k, v]) => (
            <div key={k} className="text-[10px] font-mono">
              <span className="text-gray-400">{k} = </span>
              <span className="text-[#00cec9] font-bold">{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 通用：多帧时序视图
// ════════════════════════════════════════════════════════════════
function MultiFrameView({ frames, dsName, color }) {
  const [selectedFrame, setSelectedFrame] = useState(0);
  const frame = frames[selectedFrame];

  // 速度曲线数据
  const speedData = frames.map((f, i) => ({
    t: f.timestamp_str,
    speed: f.ego_speed_kmh ?? +(f.ego_speed * 3.6).toFixed(1),
  }));

  // 传感器时间戳偏移数据（合并相机+LiDAR）
  const offsetData = frame.cam_offsets
    ? Object.entries({ ...(frame.cam_offsets || {}), ...(frame.lidar_offsets || {}) }).map(([k, v]) => ({
        sensor: k.replace('CAM_', 'C:').replace('LIDAR_', 'L:').replace('RADAR_', 'R:'),
        offset: v,
        abs: Math.abs(v),
        color: Math.abs(v) < 5 ? '#55efc4' : Math.abs(v) < 15 ? '#fdcb6e' : '#fd79a8',
      }))
    : [];

  return (
    <div className="space-y-4">
      {/* 帧选择器 */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] text-gray-400 font-medium">选择帧：</span>
        {frames.map((f, i) => (
          <button key={i} onClick={() => setSelectedFrame(i)}
            className="px-2.5 py-1 rounded-lg text-[10px] font-mono border transition-all"
            style={selectedFrame === i
              ? { background: color, borderColor: color, color: '#fff', boxShadow: `0 2px 8px ${color}55` }
              : { background: '#f8f9fa', borderColor: '#e2e8f0', color: '#718096' }}>
            {f.timestamp_str}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 当前帧详情 */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-800">📋 帧详情</h4>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full" style={{ background: color+'22', color }}>
              Frame #{frame.frame_id} · {frame.timestamp_str}
            </span>
          </div>
          <div className="space-y-1.5 text-[11px]">
            {[
              ['自车速度', `${frame.ego_speed_kmh ?? +(frame.ego_speed*3.6).toFixed(1)} km/h`],
              ['自车加速度', frame.ego_accel !== undefined ? `${frame.ego_accel} m/s²` : '—'],
              ['自车位置', frame.ego_x !== undefined ? `(${frame.ego_x}, ${frame.ego_y}) m` : '—'],
              ['检测目标数', frame.objects ? `${frame.objects.length} 个` : '—'],
              ['LiDAR点数', frame.lidar_stats?.total_points?.toLocaleString() ?? frame.lidar_points?.toLocaleString() ?? '—'],
              ['最大同步误差', `${frame.max_sync_error_ms} ms`],
              ...(frame.sim_tick !== undefined ? [['仿真Tick', `#${frame.sim_tick}`]] : []),
              ...(frame.reward ? [['奖励(total)', frame.reward.total]] : []),
              ...(frame.gps ? [['GPS', `${frame.gps.lat}, ${frame.gps.lon}`]] : []),
              ...(frame.context_name ? [['场景ID', frame.context_name]] : []),
            ].map(([k, v]) => (
              <div key={k} className="flex items-center gap-2">
                <span className="text-gray-400 w-24 flex-shrink-0">{k}</span>
                <span className="font-mono" style={{ color }}>{v}</span>
              </div>
            ))}
          </div>

          {/* 未来轨迹（nuPlan特有） */}
          {frame.future_waypoints && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-[10px] text-gray-400 mb-2">📍 未来 5 步规划轨迹（专家轨迹）</p>
              <div className="flex gap-1.5 flex-wrap">
                {frame.future_waypoints.map((wp, i) => (
                  <div key={i} className="text-[9px] px-2 py-1 rounded-lg bg-gray-100 font-mono">
                    <span className="text-gray-400">+{wp.dt_s}s</span>
                    <span className="text-[#00cec9] ml-1">({wp.x},{wp.y})</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 仿真奖励（CARLA特有） */}
          {frame.reward && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-[10px] text-gray-400 mb-2">🏆 奖励分解</p>
              <div className="space-y-1">
                {[['进度', frame.reward.progress, '#6c5ce7'], ['舒适', frame.reward.comfort, '#00cec9'], ['安全', frame.reward.safety, '#55efc4']].map(([k,v,c]) => (
                  <div key={k} className="flex items-center gap-2 text-[10px]">
                    <span className="text-gray-400 w-8">{k}</span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${v*100}%`, background: c }} />
                    </div>
                    <span className="font-mono w-8 text-right" style={{ color: c }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 语义分割（CARLA特有） */}
          {frame.seg_labels && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-[10px] text-gray-400 mb-2">🎨 语义分割分布</p>
              <div className="flex flex-wrap gap-1">
                {Object.entries(frame.seg_labels).map(([k,v]) => (
                  <span key={k} className="text-[9px] px-1.5 py-0.5 rounded-full bg-gray-100 font-mono text-gray-500">
                    {k}:{v}%
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* OpenDV 语言描述 */}
          {frame.caption && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-[10px] text-gray-400 mb-1">💬 GPT-4V 场景描述</p>
              <p className="text-[11px] text-gray-500 leading-relaxed italic">&ldquo;{frame.caption}&rdquo;</p>
            </div>
          )}
        </div>

        {/* 速度时序曲线 */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <h4 className="text-sm font-semibold text-gray-800 mb-1">📈 自车速度时序</h4>
          <p className="text-[10px] text-gray-400 mb-3">{dsName} · {frames.length} 帧 · 时序变化</p>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={speedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="t" tick={{ fontSize: 8, fill: '#718096' }} />
              <YAxis tick={{ fontSize: 9, fill: '#718096' }} unit=" km/h" />
              <Tooltip contentStyle={{ background: '#f8f9fa', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 11 }} />
              <Line type="monotone" dataKey="speed" stroke={color} strokeWidth={2} dot={{ fill: color, r: 3 }}
                activeDot={{ r: 5, fill: color }} name="速度(km/h)" />
            </LineChart>
          </ResponsiveContainer>

          {/* 目标检测列表 */}
          {frame.objects && frame.objects.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-[10px] text-gray-400 mb-2">🎯 检测目标（{frame.objects.length}个）</p>
              <div className="max-h-28 overflow-y-auto space-y-1">
                {frame.objects.slice(0, 6).map(obj => (
                  <div key={obj.id} className="flex items-center gap-2 text-[10px] px-2 py-1 rounded-lg bg-gray-100">
                    <span className="font-mono text-[#a29bfe] w-20 truncate">{obj.cls}</span>
                    <span className="text-gray-400">({obj.x},{obj.y})m</span>
                    {obj.vel_x !== undefined && <span className="text-[#00cec9] ml-auto">v:({obj.vel_x},{obj.vel_y})</span>}
                    {obj.speed !== undefined && <span className="text-[#00cec9] ml-auto">{obj.speed}m/s</span>}
                  </div>
                ))}
                {frame.objects.length > 6 && <p className="text-[9px] text-gray-400 text-center">...还有 {frame.objects.length-6} 个</p>}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 传感器时间戳偏移（有cam_offsets的数据集） */}
      {offsetData.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <h4 className="text-sm font-semibold text-gray-800 mb-1">⏱️ 传感器时间戳偏移（Frame #{frame.frame_id}）</h4>
          <p className="text-[10px] text-gray-400 mb-3">各传感器相对于参考时间戳的偏移量（ms），绿色&lt;5ms · 黄色5-15ms · 红色&gt;15ms</p>
          <div className="flex flex-wrap gap-2">
            {offsetData.map(d => (
              <div key={d.sensor} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[10px]"
                style={{ borderColor: d.color+'44', background: d.color+'11' }}>
                <span className="font-mono text-gray-500">{d.sensor}</span>
                <span className="font-bold font-mono" style={{ color: d.color }}>
                  {d.offset >= 0 ? '+' : ''}{d.offset}ms
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-4 text-[10px]">
            <span className="text-[#55efc4]">● &lt;5ms 优秀</span>
            <span className="text-[#fdcb6e]">● 5-15ms 可接受</span>
            <span className="text-[#fd79a8]">● &gt;15ms 需插值补偿</span>
            <span className="text-gray-400 ml-auto">最大偏差：{frame.max_sync_error_ms}ms</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 通用：多传感器对齐方案视图
// ════════════════════════════════════════════════════════════════
function SensorAlignView({ highlightMethod }) {
  const [selectedMethod, setSelectedMethod] = useState(highlightMethod ?? 'interpolate');
  const method = SENSOR_ALIGN_METHODS.find(m => m.id === selectedMethod);

  // 对齐误差对比
  const errorData = SENSOR_ALIGN_METHODS.map(m => ({
    name: m.name.replace('对齐','').replace('触发',''),
    error: m.max_error_ms,
    color: m.color,
  }));

  return (
    <div className="space-y-4">
      {/* 方案选择 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {SENSOR_ALIGN_METHODS.map(m => (
          <button key={m.id} onClick={() => setSelectedMethod(m.id)}
            className="p-3 rounded-xl border text-left transition-all"
            style={selectedMethod === m.id
              ? { borderColor: m.color, background: m.color+'18', boxShadow: `0 2px 10px ${m.color}33` }
              : { borderColor: '#e2e8f0', background: '#f8f9fa' }}>
            <div className="w-2 h-2 rounded-full mb-2" style={{ background: m.color }} />
            <p className="text-[11px] font-bold text-gray-800 mb-1">{m.name}</p>
            <p className="text-[9px] text-gray-400">误差 &lt;{m.max_error_ms}ms</p>
            <p className="text-[9px] text-gray-400">复杂度：{m.complexity}</p>
          </button>
        ))}
      </div>

      {method && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* 方案详情 */}
          <div className="bg-white rounded-2xl border p-4" style={{ borderColor: method.color+'44' }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full" style={{ background: method.color }} />
              <h4 className="text-sm font-bold" style={{ color: method.color }}>{method.name}</h4>
            </div>
            <p className="text-[11px] text-gray-500 leading-relaxed mb-4">{method.desc}</p>
            <div className="space-y-2">
              <div>
                <p className="text-[10px] text-[#55efc4] font-medium mb-1">✓ 适用场景</p>
                {method.suitable.map(s => <p key={s} className="text-[10px] text-gray-400 ml-3">• {s}</p>)}
              </div>
              <div>
                <p className="text-[10px] text-[#fd79a8] font-medium mb-1">✗ 不适用场景</p>
                {method.not_suitable.map(s => <p key={s} className="text-[10px] text-gray-400 ml-3">• {s}</p>)}
              </div>
            </div>
          </div>

          {/* 代码示例 */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-[#a29bfe] font-mono border border-gray-200">Python</span>
              <span className="text-[10px] text-gray-400">{method.name} 核心代码</span>
            </div>
            <pre className="text-[10px] leading-relaxed overflow-x-auto font-mono bg-[#1e2030] rounded-xl p-3">
              {method.code.split('\n').map((line, i) => (
                <div key={i}>
                  <span style={{ color: '#4a5568', userSelect: 'none', marginRight: 10, fontSize: 9 }}>{String(i+1).padStart(2,' ')}</span>
                  <span style={{ color: line.trim().startsWith('#')?'#6b7280':line.includes('def ')||line.includes('class ')?method.color:'#e2e8f0' }}>{line}</span>
                </div>
              ))}
            </pre>
          </div>
        </div>
      )}

      {/* 误差对比图 */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <h4 className="text-sm font-semibold text-gray-800 mb-1">各对齐方案最大误差对比</h4>
        <p className="text-[10px] text-gray-400 mb-3">单位：ms（越小越好）· 10Hz场景下 10ms ≈ 自车移动 0.1m</p>
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={errorData} layout="vertical" barSize={20}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 9, fill: '#718096' }} unit="ms" />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: '#718096' }} width={80} />
            <Tooltip contentStyle={{ background: '#f8f9fa', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 11 }}
              formatter={v => [`${v}ms`, '最大误差']} />
            <Bar dataKey="error" name="最大误差(ms)" radius={[0,4,4,0]}>
              {errorData.map((d,i) => <Cell key={i} fill={d.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 对齐流程说明 */}
      <div className="bg-white rounded-2xl border border-[#6c5ce7]/30 p-4">
        <h4 className="text-sm font-semibold text-[#a29bfe] mb-3">🔄 多传感器对齐完整流程</h4>
        <div className="flex flex-wrap items-center gap-2 text-[10px]">
          {[
            { label: '原始传感器\n各自时间戳', color: '#718096', icon: '📡' },
            { label: '→', color: '#718096', icon: '' },
            { label: 'IMU预积分\n位姿估计', color: '#6c5ce7', icon: '📐' },
            { label: '→', color: '#718096', icon: '' },
            { label: 'LiDAR\n运动去畸变', color: '#00cec9', icon: '🔧' },
            { label: '→', color: '#718096', icon: '' },
            { label: '相机帧\n时间插值', color: '#fd79a8', icon: '🎞️' },
            { label: '→', color: '#718096', icon: '' },
            { label: '统一时间轴\n对齐帧', color: '#55efc4', icon: '✅' },
          ].map((s, i) => (
            s.icon && s.icon !== '→' ? (
              <div key={i} className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl bg-gray-50 border" style={{ borderColor: s.color+'44' }}>
                <span className="text-base">{s.icon}</span>
                <span style={{ color: s.color }} className="font-medium text-center whitespace-pre-line">{s.label}</span>
              </div>
            ) : s.icon === '→' ? (
              <span key={i} className="text-lg text-gray-400">→</span>
            ) : null
          ))}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// KITTI Canvas 组件（从 AdDataViz 迁移）
// ════════════════════════════════════════════════════════════════
function KittiCamCanvas({ sample }) {
  const W = 620, H = 188;
  const toU = x => x * W, toV = y => y * H;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-xl" style={{ background: '#f8f9fa' }}>
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f0f4ff" /><stop offset="100%" stopColor="#e8f0fe" />
        </linearGradient>
        <linearGradient id="road" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e2e8f0" /><stop offset="100%" stopColor="#cbd5e0" />
        </linearGradient>
      </defs>
      <rect width={W} height={H*0.55} fill="url(#sky)" />
      <rect y={H*0.55} width={W} height={H*0.45} fill="url(#road)" />
      <line x1={W*0.35} y1={H*0.55} x2={W*0.45} y2={H} stroke="#4a5568" strokeWidth={1} strokeDasharray="4 3" />
      <line x1={W*0.65} y1={H*0.55} x2={W*0.55} y2={H} stroke="#4a5568" strokeWidth={1} strokeDasharray="4 3" />
      {sample.boxes.map(box => {
        const x=toU(box.bbox2d[0]/1242), y=toV(box.bbox2d[1]/375);
        const bw=toU((box.bbox2d[2]-box.bbox2d[0])/1242), bh=toV((box.bbox2d[3]-box.bbox2d[1])/375);
        return (
          <g key={box.id}>
            <rect x={x} y={y} width={bw} height={bh} fill="none" stroke={box.color} strokeWidth={1.5} rx={2} />
            <rect x={x} y={y-14} width={Math.max(bw, 40)} height={13} fill={box.color} rx={2} opacity={0.9} />
            <text x={x+3} y={y-3} fontSize={8} fill="#fff" fontWeight={600}>{box.cls} {box.dist}m</text>
          </g>
        );
      })}
      <text x={8} y={14} fontSize={9} fill="#a0aec0" fontFamily="monospace">KITTI · {sample.sequence} · 1242×375</text>
    </svg>
  );
}

function KittiBevCanvas({ sample }) {
  const W = 400, H = 300, SCALE = 3, CX = W/2, CY = H*0.85;
  const toX = x => CX + x * SCALE, toY = y => CY - y * SCALE;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-xl" style={{ background: '#f8f9fa' }}>
      {[10,20,30,40,50].map(r => <ellipse key={r} cx={CX} cy={CY} rx={r*SCALE*0.6} ry={r*SCALE*0.35} fill="none" stroke="#e2e8f0" strokeWidth={0.8} strokeDasharray="3 3" />)}
      {[-30,-15,0,15,30].map(a => {
        const rad=a*Math.PI/180, len=55*SCALE;
        return <line key={a} x1={CX} y1={CY} x2={CX+Math.sin(rad)*len*0.6} y2={CY-Math.cos(rad)*len*0.35} stroke="#e2e8f0" strokeWidth={0.8} />;
      })}
      {sample.lidar.slice(0,600).map((pt,i) => {
        const intensity=pt.intensity||0.5;
        const color=`hsl(${200+intensity*60},70%,${30+intensity*40}%)`;
        return <circle key={i} cx={toX(pt.y)} cy={toY(pt.x)} r={0.8} fill={color} opacity={0.7} />;
      })}
      {sample.boxes.map(box => {
        const cx=toX(box.y), cy=toY(box.x);
        const hw=(box.dims[2]||1.9)*SCALE*0.5, hl=(box.dims[0]||4.3)*SCALE*0.5;
        return (
          <g key={box.id}>
            <rect x={cx-hw} y={cy-hl} width={hw*2} height={hl*2} fill={box.color+'22'} stroke={box.color} strokeWidth={1.5} rx={2} />
            <text x={cx} y={cy+3} textAnchor="middle" fontSize={7} fill={box.color} fontWeight={600}>{box.cls}</text>
          </g>
        );
      })}
      <circle cx={CX} cy={CY} r={5} fill="#6c5ce7" />
      <text x={CX+8} y={CY+4} fontSize={8} fill="#6c5ce7">自车</text>
      <text x={8} y={14} fontSize={8} fill="#a0aec0" fontFamily="monospace">BEV · 64线 · 120m</text>
    </svg>
  );
}

// ════════════════════════════════════════════════════════════════
// VLA 实验室 — 架构方式对比（来自研究模块论文解读）
// ════════════════════════════════════════════════════════════════

const VLA_ARCH_MODELS = [
  {
    id: 'driveworld',
    name: 'DriveWorld-VLA',
    subtitle: '统一潜空间世界建模',
    paper: 'arXiv:2602.06521 · 2026',
    color: '#6c5ce7',
    badge: 'SOTA 2026',
    badgeColor: '#6c5ce7',
    paradigm: '潜空间统一',
    tags: ['Latent CoT', '统一隐状态 Z_t', 'Diffusion WM', '三阶段训练'],
    metrics: { l2: 1.15, collision: 0.16, fps: 10.5, pdms: 91.3 },
    strengths: ['推理速度快（特征级，无需渲染像素）', '世界模型与 VLA 共享隐空间，误差不累积', 'Latent CoT 保留完整空间信息', 'nuScenes/NAVSIM 三大基准 SOTA'],
    weaknesses: ['K>5 步后预测误差增大', '依赖 nuScenes 分布，泛化性待验证', '三阶段训练需 8×A100 共 44h'],
    archFlow: [
      { label: '6路相机', icon: '📷', color: '#a29bfe' },
      { label: 'InternViT-6B', icon: '👁️', color: '#a29bfe' },
      { label: 'Unified Projector', icon: '🔀', color: '#74b9ff' },
      { label: '统一隐状态 Z_t', icon: '⚡', color: '#00cec9', highlight: true },
      { label: 'VLA Head', icon: '🎯', color: '#fd79a8' },
      { label: 'WM Head', icon: '🌍', color: '#55efc4' },
    ],
    keyInnovation: '在潜在空间中统一 VLA 规划器和世界模型，通过 Latent CoT 让模型"先在脑中推演未来再做决策"，推理速度比像素级世界模型快 25x。',
    codeSnippet: `# Latent CoT 多步推演
def latent_rollout(z_0, actions, trans_net, K=5):
    z_seq = [z_0]
    h = None
    for k in range(K):
        z_next, _, h = trans_net(z_seq[-1], actions[k], h)
        z_seq.append(z_next)
    return z_seq  # [z_0, z_1, ..., z_K]

# VLA 规划器消费"想象的未来"
waypoints = vla_planner(z_seq, z_lang)`,
  },
  {
    id: 'opendrivevla',
    name: 'OpenDriveVLA',
    subtitle: '开源 LLM 端到端驾驶',
    paper: 'arXiv:2503.23463 · 2025',
    color: '#00cec9',
    badge: '开源基础',
    badgeColor: '#00cec9',
    paradigm: '纯 VLA 端到端',
    tags: ['开源 LLM', 'Token 压缩', '三阶段微调', '多任务联合'],
    metrics: { l2: 0.87, collision: 0.02, fps: 8.2, pdms: 88.0 },
    strengths: ['首个基于开源 LLM 的端到端驾驶 VLA', 'Token 压缩减少 70% visual tokens，推理快 3x', '统一输出场景描述+轨迹+控制信号', '可复现，降低研究门槛'],
    weaknesses: ['无世界模型，无法预判决策后果', '长尾场景处理弱（无未来想象能力）', '纯监督学习，缺乏闭环 RL 优化'],
    archFlow: [
      { label: '多相机图像', icon: '📷', color: '#a29bfe' },
      { label: 'ViT + Adapter', icon: '👁️', color: '#a29bfe' },
      { label: 'Token 压缩', icon: '🗜️', color: '#74b9ff' },
      { label: '开源 LLM 主干', icon: '🤖', color: '#00cec9', highlight: true },
      { label: '场景理解', icon: '📝', color: '#fd79a8' },
      { label: '轨迹+控制', icon: '🎯', color: '#fdcb6e' },
    ],
    keyInnovation: '首次证明开源 LLM 足以支撑端到端驾驶任务，通过 Cross-Attention Adapter 将视觉 token 压缩 70%，同时统一输出场景描述、轨迹规划和控制信号三种任务。',
    codeSnippet: `# 多任务联合训练损失
loss = (
    λ_scene  * loss_scene_understanding +
    λ_traj   * loss_trajectory_planning +
    λ_ctrl   * loss_control_prediction
)

# Token 压缩: 6相机 3456 tokens → ~1000 tokens
visual_tokens = cross_attn_adapter(
    vit_features,  # [6, 576, D]
    queries=fixed_queries  # [256, D]
)`,
  },
  {
    id: 'gaia1',
    name: 'GAIA-1 / 像素级世界模型',
    subtitle: '自回归视频生成世界模型',
    paper: 'Wayve · 2023 · 场景生成范式',
    color: '#fd79a8',
    badge: '场景生成',
    badgeColor: '#fd79a8',
    paradigm: '像素级生成',
    tags: ['VQ-VAE', '自回归 Transformer', '动作条件生成', '语言控制'],
    metrics: { l2: null, collision: null, fps: 1.9, pdms: null },
    strengths: ['生成真实感视频，可用于数据增广', '支持语言控制（"下雨"/"添加卡车"）', '物理一致性好（阴影/反射/碰撞）', '可生成 CARLA 无法覆盖的长尾场景'],
    weaknesses: ['推理极慢（生成一帧 ~200ms，5步=1000ms）', '像素级误差在多步推演中快速放大', '需要 GAN/Diffusion，训练不稳定', '无法直接用于实时规划决策'],
    archFlow: [
      { label: '视频帧序列', icon: '🎬', color: '#a29bfe' },
      { label: 'VQ-VAE Tokenizer', icon: '🔢', color: '#a29bfe' },
      { label: '动作 + 语言', icon: '💬', color: '#74b9ff' },
      { label: 'AR Transformer WM', icon: '🌍', color: '#fd79a8', highlight: true },
      { label: '预测 token 序列', icon: '🔮', color: '#fd79a8' },
      { label: '视频解码器', icon: '🖼️', color: '#fdcb6e' },
    ],
    keyInnovation: '将驾驶视频编码为离散 token，用自回归 Transformer 预测下一帧 token，支持动作条件化和语言控制生成，可合成任意驾驶场景用于数据增广。',
    codeSnippet: `# GAIA-1 单步世界模型推理
def step(frame, action, language, history):
    # 编码当前帧为离散 token
    visual_tokens = vq_tokenizer.encode(frame)
    action_emb = action_encoder(action)
    lang_emb = language_encoder(language)
    
    # 自回归预测下一帧 token
    next_tokens = ar_transformer(
        visual_tokens, action_emb, lang_emb, history
    )
    # 解码为高质量帧（慢！~200ms/帧）
    return video_decoder(next_tokens)`,
  },
  {
    id: 'mile',
    name: 'MILE / 白日梦策略学习',
    subtitle: '潜空间 RL + 世界模型想象训练',
    paper: 'NeurIPS 2022 · 策略学习范式',
    color: '#fdcb6e',
    badge: '策略学习',
    badgeColor: '#e17055',
    paradigm: '潜空间 RL',
    tags: ['Model-based RL', '想象轨迹', 'Dreamer 架构', '无真实交互'],
    metrics: { l2: null, collision: null, fps: 6.0, pdms: null },
    strengths: ['无需真实环境交互（安全）', '可想象极端场景（长尾覆盖）', '策略更新速度 100x（无需等渲染）', '可微分世界模型，梯度直接回传'],
    weaknesses: ['世界模型误差累积（>10步后严重偏离）', '想象轨迹长度有限', '世界模型质量上限决定策略上限', 'Sim-to-Real 迁移仍有 Domain Gap'],
    archFlow: [
      { label: '真实观测 s_t', icon: '👁️', color: '#a29bfe' },
      { label: '潜在状态编码器', icon: '🔢', color: '#a29bfe' },
      { label: '世界模型 f(z,a)', icon: '🌍', color: '#fdcb6e', highlight: true },
      { label: '想象轨迹 ẑ_{t+k}', icon: '💭', color: '#fdcb6e' },
      { label: '策略 π(ẑ)', icon: '🎯', color: '#fd79a8' },
      { label: '奖励反向传播', icon: '🔄', color: '#55efc4' },
    ],
    keyInnovation: '在潜在空间中训练策略：先用真实数据学习世界模型，再让 Agent 在"想象的世界"中反复试错，策略更新无需真实环境交互，安全且高效。',
    codeSnippet: `# MILE 白日梦训练循环
def dreaming_step(z_0, policy, world_model, K=15):
    z_seq, rewards = [z_0], []
    for k in range(K):
        # 策略在想象世界中决策
        action = policy(z_seq[-1])
        # 世界模型预测下一状态（无真实交互）
        z_next = world_model.transition(z_seq[-1], action)
        reward = world_model.reward(z_next)
        z_seq.append(z_next)
        rewards.append(reward)
    # 反向传播更新策略（梯度穿过世界模型）
    loss = -sum(rewards)
    loss.backward()`,
  },
];

const ARCH_COMPARISON_METRICS = [
  { key: 'paradigm', label: '架构范式', type: 'text' },
  { key: 'wm_type', label: '世界模型类型', type: 'text' },
  { key: 'latent', label: '潜空间建模', type: 'bool' },
  { key: 'realtime', label: '实时推理', type: 'bool' },
  { key: 'rl', label: '闭环 RL', type: 'bool' },
  { key: 'opensource', label: '开源 LLM', type: 'bool' },
];

const MODEL_FEATURE_MAP = {
  driveworld:  { wm_type: '特征级 Transition', latent: true,  realtime: true,  rl: true,  opensource: true  },
  opendrivevla:{ wm_type: '无世界模型',        latent: false, realtime: true,  rl: false, opensource: true  },
  gaia1:       { wm_type: '像素级自回归生成',   latent: false, realtime: false, rl: false, opensource: false },
  mile:        { wm_type: '潜空间 RSSM',        latent: true,  realtime: false, rl: true,  opensource: false },
};

function ArchFlowDiagram({ model }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {model.archFlow.map((node, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <div
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium"
            style={{
              background: node.highlight ? node.color + '18' : '#f8f9fa',
              border: `1.5px solid ${node.highlight ? node.color : '#e2e8f0'}`,
              color: node.highlight ? node.color : '#555',
              boxShadow: node.highlight ? `0 0 6px ${node.color}33` : 'none',
            }}
          >
            <span>{node.icon}</span>
            <span>{node.label}</span>
          </div>
          {i < model.archFlow.length - 1 && (
            <span className="text-gray-300 text-sm font-light">→</span>
          )}
        </div>
      ))}
    </div>
  );
}

function MetricBadge({ value, unit, label, color, na }) {
  if (na || value === null) {
    return (
      <div className="flex flex-col items-center p-2 rounded-xl bg-gray-50 border border-gray-100 min-w-[60px]">
        <span className="text-[10px] text-gray-300 font-mono">N/A</span>
        <span className="text-[9px] text-gray-300 mt-0.5">{label}</span>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center p-2 rounded-xl border min-w-[60px]"
      style={{ background: color + '10', borderColor: color + '33' }}>
      <span className="text-sm font-bold font-mono" style={{ color }}>{value}{unit}</span>
      <span className="text-[9px] text-gray-400 mt-0.5">{label}</span>
    </div>
  );
}

function VlaLabView() {
  const [selectedModel, setSelectedModel] = useState('driveworld');
  const [activeSection, setActiveSection] = useState('overview');
  const model = VLA_ARCH_MODELS.find(m => m.id === selectedModel);

  return (
    <div className="space-y-4">
      {/* 标题说明 */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#6c5ce7] to-[#fd79a8] flex items-center justify-center text-lg flex-shrink-0">🧪</div>
          <div>
            <h3 className="text-sm font-bold text-gray-800">VLA 实验室 · 架构方式对比</h3>
            <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
              基于研究模块解读的论文（DriveWorld-VLA · OpenDriveVLA · GAIA-1 · MILE），梳理 4 种主流 VLA × 世界模型架构范式，对比核心设计差异。
            </p>
          </div>
        </div>
      </div>

      {/* 模型选择器 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {VLA_ARCH_MODELS.map(m => (
          <button
            key={m.id}
            onClick={() => setSelectedModel(m.id)}
            className="p-3 rounded-xl border text-left transition-all"
            style={selectedModel === m.id
              ? { background: m.color + '12', borderColor: m.color, boxShadow: `0 0 0 2px ${m.color}33` }
              : { background: '#f8f9fa', borderColor: '#e2e8f0' }
            }
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                style={{ background: m.badgeColor + '18', color: m.badgeColor }}>
                {m.badge}
              </span>
              {selectedModel === m.id && (
                <span className="text-[9px] font-bold" style={{ color: m.color }}>✓</span>
              )}
            </div>
            <p className="text-xs font-semibold text-gray-800 leading-tight">{m.name}</p>
            <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{m.subtitle}</p>
          </button>
        ))}
      </div>

      {/* 详情区 */}
      {model && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {/* 论文信息头 */}
          <div className="p-4 border-b border-gray-50" style={{ background: model.color + '08' }}>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h4 className="text-sm font-bold text-gray-900">{model.name}</h4>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0"
                style={{ background: model.color + '18', color: model.color, border: `1px solid ${model.color}33` }}>
                {model.paradigm}
              </span>
            </div>
            <p className="text-xs text-gray-500 mb-0.5">{model.subtitle}</p>
            <p className="text-[10px] text-gray-400 font-mono mb-2">{model.paper}</p>
            <div className="flex gap-1.5 flex-wrap">
              {model.tags.map(t => (
                <span key={t} className="text-[9px] px-1.5 py-0.5 rounded-full border"
                  style={{ background: model.color + '10', borderColor: model.color + '33', color: model.color }}>
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* 子 tab */}
          <div className="flex flex-wrap gap-1 p-2 border-b border-gray-50 bg-gray-50/50">
            {[
              { id: 'overview', label: '架构概览', icon: '🏗️' },
              { id: 'metrics',  label: '性能指标', icon: '📊' },
              { id: 'code',     label: '核心代码', icon: '💻' },
              { id: 'compare',  label: '横向对比', icon: '⚖️' },
            ].map(s => (
              <button key={s.id} onClick={() => setActiveSection(s.id)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={activeSection === s.id
                  ? { background: '#fff', color: model.color, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: `1px solid ${model.color}33` }
                  : { color: '#94a3b8' }
                }>
                <span>{s.icon}</span>
                <span>{s.label}</span>
              </button>
            ))}
          </div>

          <div className="p-4">
            {/* 架构概览 */}
            {activeSection === 'overview' && (
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] text-gray-400 mb-2 font-medium uppercase tracking-wide">数据流向</p>
                  <ArchFlowDiagram model={model} />
                </div>
                <div className="p-3 rounded-xl border" style={{ background: model.color + '08', borderColor: model.color + '33' }}>
                  <p className="text-[10px] font-semibold mb-1" style={{ color: model.color }}>⭐ 核心创新</p>
                  <p className="text-xs text-gray-600 leading-relaxed">{model.keyInnovation}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] text-gray-400 mb-2 font-medium">✅ 优势</p>
                    <ul className="space-y-1">
                      {model.strengths.map((s, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-[11px] text-gray-600">
                          <span className="text-emerald-400 mt-0.5 flex-shrink-0">•</span>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 mb-2 font-medium">⚠️ 局限</p>
                    <ul className="space-y-1">
                      {model.weaknesses.map((w, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-[11px] text-gray-600">
                          <span className="text-amber-400 mt-0.5 flex-shrink-0">•</span>
                          {w}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* 性能指标 */}
            {activeSection === 'metrics' && (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <MetricBadge value={model.metrics.l2} unit="m" label="L2 (3s) ↓" color={model.color} />
                  <MetricBadge value={model.metrics.collision} unit="%" label="碰撞率 ↓" color={model.color} />
                  <MetricBadge value={model.metrics.fps} unit=" FPS" label="推理速度 ↑" color={model.color} />
                  <MetricBadge value={model.metrics.pdms} unit="" label="PDMS ↑" color={model.color} />
                </div>
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <p className="text-[10px] text-gray-400 mb-2 font-medium">各模型推理速度对比（FPS）</p>
                  <div className="space-y-2">
                    {VLA_ARCH_MODELS.map(m => (
                      <div key={m.id} className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-500 w-28 flex-shrink-0 truncate">{m.name.split('/')[0].trim()}</span>
                        <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: m.metrics.fps ? `${(m.metrics.fps / 12) * 100}%` : '8%',
                              background: m.id === selectedModel ? m.color : m.color + '66',
                            }}
                          />
                        </div>
                        <span className="text-[10px] font-mono w-14 text-right flex-shrink-0"
                          style={{ color: m.id === selectedModel ? m.color : '#94a3b8' }}>
                          {m.metrics.fps ? `${m.metrics.fps} fps` : 'N/A'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                {(model.metrics.l2 !== null) && (
                  <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <p className="text-[10px] text-gray-400 mb-2 font-medium">nuScenes L2 误差对比（3s，越低越好）</p>
                    <div className="space-y-2">
                      {[
                        { name: 'UniAD (2023)', l2: 1.65, color: '#cbd5e0' },
                        { name: 'VAD (2023)', l2: 1.05, color: '#cbd5e0' },
                        { name: 'OpenDriveVLA', l2: 0.87, color: '#00cec9' },
                        { name: 'DriveWorld-VLA', l2: 1.15, color: '#6c5ce7' },
                      ].map(item => (
                        <div key={item.name} className="flex items-center gap-2">
                          <span className="text-[10px] text-gray-500 w-28 flex-shrink-0 truncate">{item.name}</span>
                          <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${(item.l2 / 2.0) * 100}%`, background: item.color }} />
                          </div>
                          <span className="text-[10px] font-mono w-10 text-right flex-shrink-0" style={{ color: item.color }}>{item.l2}m</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 核心代码 */}
            {activeSection === 'code' && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 font-mono border border-gray-200"
                    style={{ color: model.color }}>Python</span>
                  <span className="text-[10px] text-gray-400">{model.name} 核心逻辑</span>
                </div>
                <pre className="text-[10px] leading-relaxed overflow-x-auto font-mono bg-[#1e2030] rounded-xl p-4">
                  {model.codeSnippet.split('\n').map((line, i) => (
                    <div key={i}>
                      <span style={{ color: '#4a5568', userSelect: 'none', marginRight: 12, fontSize: 9 }}>{String(i+1).padStart(2,' ')}</span>
                      <span style={{ color: line.trim().startsWith('#') ? '#6b7280' : line.includes('def ') || line.includes('class ') ? model.color : '#e2e8f0' }}>{line}</span>
                    </div>
                  ))}
                </pre>
              </div>
            )}

            {/* 横向对比 */}
            {activeSection === 'compare' && (
              <div className="space-y-3">
                <div className="overflow-x-auto">
                  <table className="w-full text-[11px]">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-2 pr-3 text-gray-400 font-medium w-28">特性</th>
                        {VLA_ARCH_MODELS.map(m => (
                          <th key={m.id} className="text-center py-2 px-2 font-semibold"
                            style={{ color: m.id === selectedModel ? m.color : '#94a3b8' }}>
                            {m.name.split('/')[0].trim().split(' ')[0]}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { label: '架构范式', key: 'paradigm', type: 'text' },
                        { label: '世界模型', key: 'wm_type', type: 'text' },
                        { label: '潜空间建模', key: 'latent', type: 'bool' },
                        { label: '实时推理', key: 'realtime', type: 'bool' },
                        { label: '闭环 RL', key: 'rl', type: 'bool' },
                        { label: '开源 LLM', key: 'opensource', type: 'bool' },
                      ].map((feat, fi) => (
                        <tr key={feat.key} className={fi % 2 === 0 ? 'bg-gray-50/50' : ''}>
                          <td className="py-2 pr-3 text-gray-500 font-medium">{feat.label}</td>
                          {VLA_ARCH_MODELS.map(m => {
                            const val = feat.key === 'paradigm' ? m.paradigm : MODEL_FEATURE_MAP[m.id][feat.key];
                            const isSelected = m.id === selectedModel;
                            return (
                              <td key={m.id} className="text-center py-2 px-2">
                                {feat.type === 'bool' ? (
                                  <span style={{ color: val ? '#00b894' : '#b2bec3' }}>{val ? '✓' : '✗'}</span>
                                ) : (
                                  <span className="text-[10px]" style={{ color: isSelected ? m.color : '#718096' }}>{val}</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-100 text-[11px] text-amber-700 leading-relaxed">
                  <span className="font-semibold">💡 选型建议：</span>
                  {selectedModel === 'driveworld' && ' DriveWorld-VLA 是当前 SOTA，适合追求最优规划性能的研究场景，但需要较高算力（8×A100）。'}
                  {selectedModel === 'opendrivevla' && ' OpenDriveVLA 是最佳起点，开源可复现，适合快速验证 VLA 思路，可作为 DriveWorld-VLA 的基础底座。'}
                  {selectedModel === 'gaia1' && ' GAIA-1 类像素级世界模型适合数据增广场景，不适合实时规划，可与 VLA 结合用于离线训练数据生成。'}
                  {selectedModel === 'mile' && ' MILE 类潜空间 RL 适合安全关键场景的策略学习，与 DriveWorld-VLA 的 Latent CoT 思路一脉相承，可用于闭环微调阶段。'}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 架构演进时间线 */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">📅 VLA × 世界模型架构演进</h4>
        <div className="relative">
          <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-100" />
          {[
            { year: '2022', name: 'MILE', desc: '首次将世界模型引入端到端驾驶策略学习，潜空间 RL 奠基', color: '#fdcb6e', icon: '🌱' },
            { year: '2023', name: 'GAIA-1 (Wayve)', desc: '像素级自回归世界模型，证明语言可控驾驶场景生成可行', color: '#fd79a8', icon: '🎬' },
            { year: '2024', name: 'UniSim / Genie 2', desc: '神经场景重建 + 可交互 3D 世界，闭环仿真替代真实路测', color: '#74b9ff', icon: '🌍' },
            { year: '2025', name: 'OpenDriveVLA', desc: '首个开源 LLM 端到端驾驶 VLA，证明 VLA 范式可行且可复现', color: '#00cec9', icon: '🤖' },
            { year: '2026', name: 'DriveWorld-VLA', desc: '统一潜空间 VLA + 世界模型，Latent CoT，nuScenes/NAVSIM 三大 SOTA', color: '#6c5ce7', icon: '⭐' },
            { year: '2026 Q2', name: 'Alpamayo-R1 / π₀.5', desc: 'Alpamayo-R1 引入 RL 奖励驱动的 VLA 微调，π₀.5 将 Flow Matching 扩展到多任务机器人操作，VLA 从自动驾驶向通用具身智能延伸', color: '#e17055', icon: '🚀' },
            { year: '2026-04', name: '混元 3D 世界模型 2.0 / Seed3D 2.0', desc: '腾讯开源混元 3D 世界模型 2.0（物理仿真+可交互场景），字节 Seed3D 2.0 支持视频转 3D；3D 世界模型从"生成"走向"可交互仿真"，为 VLA 训练提供更真实的虚拟环境', color: '#00b894', icon: '🌍' },
            { year: '2026-04', name: 'Tesla FSD V14.3 纯神经网络架构', desc: '特斯拉删除 30 万行 C++ 规则代码，FSD V14.3 完全由神经网络驱动；模型参数量相比 V12 提升约 10×，单卡 Dojo 推理延迟降低 40%；标志"规则-神经混合"架构彻底退场，纯 E2E-VLA 路线被主要玩家全面采纳', color: '#e84393', icon: '⚡' },
            { year: '2026-04', name: 'Figure AI Helix 02 + System 0', desc: 'Figure 废弃 10 万行 C++ 运动规划代码，推出全神经网络 System 0 控制栈；Helix 02 机器人以 61 步连续厨房任务完成率 93% 刷新具身智能操作 SOTA；Figure 同步宣布 BMW 工厂批量部署，标志人形机器人从实验室进入工业量产', color: '#fd79a8', icon: '🤖' },
            { year: '2026-04', name: 'NVIDIA GR00T N2 + LeRobot v0.5', desc: 'NVIDIA 发布 GR00T N2（7B+3B 双模型），专为全身人形机器人设计的 Foundation Model，支持 Unitree H1/G1/Atlas；HuggingFace LeRobot v0.5.0 首次集成 Unitree G1 全身控制 + π₀-FAST VLA，100Hz 本地推理，社区开源具身智能基准进入实用阶段', color: '#a29bfe', icon: '🧠' },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3 mb-3 pl-8 relative">
              <div className="absolute left-1.5 w-3 h-3 rounded-full border-2 border-white flex-shrink-0"
                style={{ background: item.color, top: 2 }} />
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] font-bold font-mono text-gray-400">{item.year}</span>
                  <span className="text-xs font-semibold text-gray-800">{item.icon} {item.name}</span>
                </div>
                <p className="text-[11px] text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 主组件
// ════════════════════════════════════════════════════════════════
export default function ArchViz() {
  const [highlighted, setHighlighted] = useState(null);
  const [activeView, setActiveView] = useState('arch');
  const handleNodeClick = (id) => setHighlighted(highlighted === id ? null : id);
  const nodeDetail = highlighted ? NODE_DETAIL[highlighted] : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5 p-1.5 bg-gray-50 rounded-xl border border-gray-100">
        {[
          { id: 'arch',     label: '模型架构图',     icon: '🏗️' },
          { id: 'data',     label: '数据集选型',     icon: '📦' },
          { id: 'config',   label: '训练配置',       icon: '🔧' },
          { id: 'lab',      label: 'VLA 实验室',     icon: '🧪' },
        ].map(v => (
          <button key={v.id} onClick={() => setActiveView(v.id)}
            className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-medium transition-all whitespace-nowrap"
            style={activeView===v.id
              ? { background: '#fff', color: '#6c5ce7', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: '1px solid #6c5ce733' }
              : { color: '#94a3b8' }}>
            <span>{v.icon}</span>
            <span>{v.label}</span>
          </button>
        ))}
      </div>

      {activeView === 'arch' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-700">DriveWorld-VLA: Unified Latent-Space 架构图</h3>
                <p className="text-xs text-gray-400 mt-0.5">点击节点查看详细说明 · 统一隐状态 Z_t 同时驱动 VLA 规划 + 世界模型预测</p>
              </div>
              <button onClick={() => setHighlighted(null)} className="text-xs text-gray-400 hover:text-[#6c5ce7] transition-colors">重置</button>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {ARCH_NODES.map(n => (
                <button key={n.id} onClick={() => handleNodeClick(n.id)}
                  className="text-[9px] px-2 py-0.5 rounded-full border transition-all"
                  style={{
                    background: highlighted===n.id ? n.color : '#f8f9fa',
                    borderColor: highlighted===n.id ? n.color : '#e2e8f0',
                    color: highlighted===n.id ? '#fff' : '#718096'
                  }}>
                  {n.label.split('\n')[0]}
                </button>
              ))}
            </div>
            <div className="overflow-x-auto"><ArchSVG highlighted={highlighted} onNodeClick={handleNodeClick} /></div>
            <div className="flex flex-wrap gap-3 mt-3">
              {Object.entries(GROUP_META).map(([key, meta]) => (
                <div key={key} className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm" style={{ background: meta.bg, border: `1.5px solid ${meta.border}` }} />
                  <span className="text-xs text-gray-500">{meta.label}</span>
                </div>
              ))}
            </div>
          </div>
          {nodeDetail && (
            <div className="bg-white rounded-2xl border p-4" style={{ borderColor: nodeDetail.color+'44' }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full" style={{ background: nodeDetail.color }} />
                <h4 className="text-sm font-semibold text-gray-800">{nodeDetail.title}</h4>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">{nodeDetail.desc}</p>
            </div>
          )}
          <div className="p-4 bg-emerald-50 rounded-xl border border-[#00cec944] text-[11px] text-[#55efc4] leading-relaxed">
            <span className="font-bold text-[#00cec9]">⭐ DriveWorld-VLA 核心创新：</span>
            <span className="text-gray-500"> 所有模态（图像/点云/地图/语言）经各自编码器后，通过 </span>
            <span className="font-bold text-[#00cec9]">Unified Projector</span>
            <span className="text-gray-500"> 投影到同一隐空间，形成 </span>
            <span className="font-bold text-[#00cec9]">统一隐状态 Z_t</span>
            <span className="text-gray-500">。Z_t 同时驱动 VLA Head（规划轨迹）和 World Model Head（未来场景预测），实现"一个隐空间，两个任务"的统一建模，相比独立 BEV 融合模块减少 40% 参数量，FVD 提升 55%。</span>
          </div>
        </div>
      )}

      {activeView === 'data' && <DatasetOverview />}
      {activeView === 'config' && <TrainConfigTable />}
      {activeView === 'lab' && <VlaLabView />}
    </div>
  );
}
