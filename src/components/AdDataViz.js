'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, ScatterChart, Scatter,
} from 'recharts';
import {
  KITTI_META, KITTI_SAMPLES, KITTI_CLASSES,
  DATASET_COMPARISON, VLA_MODALITY_SCORES, BEV_INFO_LOSS,
} from '@/lib/ad-data';
import { DATASET_SELECTION, DATASET_STATS } from '@/lib/vla-data';
import { useRef } from 'react';

// ─── 目标检测统计（KITTI） ─────────────────────────────────────
function DetectionStats() {
  // KITTI 距离分布（模拟）
  const kittiDist = Array.from({ length: 10 }, (_, i) => ({
    range: `${i * 5}-${(i+1)*5}m`,
    Car:        Math.round(Math.exp(-Math.pow(i-2,2)/6)*600 + Math.random()*80),
    Pedestrian: Math.round(Math.exp(-Math.pow(i-1,2)/4)*250 + Math.random()*50),
    Cyclist:    Math.round(Math.exp(-Math.pow(i-2,2)/5)*120 + Math.random()*30),
    Van:        Math.round(Math.exp(-Math.pow(i-3,2)/8)*180 + Math.random()*40),
  }));
  // KITTI 遮挡等级分布
  const occDist = [
    { level: '完全可见(0)', count: 18420, color: '#55efc4' },
    { level: '部分遮挡(1)', count: 9830,  color: '#fdcb6e' },
    { level: '大部分遮挡(2)', count: 4210, color: '#fd79a8' },
    { level: '未知(3)',     count: 1820,  color: '#4a5568' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* KITTI 类别分布 */}
      <div className="bg-[#0f1117] rounded-2xl border border-[#1e2130] p-4">
        <h4 className="text-sm font-semibold text-[#e2e8f0] mb-1">KITTI 目标类别分布</h4>
        <p className="text-[10px] text-[#4a5568] mb-3">训练集标注框数量</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={KITTI_CLASSES} layout="vertical" barSize={14}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2130" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 9, fill: '#4a5568' }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#8892a4' }} width={90} />
            <Tooltip contentStyle={{ background: '#1a1f2e', border: '1px solid #2a3040', borderRadius: 8, fontSize: 11 }}
              formatter={(v) => v.toLocaleString()} />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
              {KITTI_CLASSES.map((c, i) => <Cell key={i} fill={c.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* KITTI 遮挡等级分布 */}
      <div className="bg-[#0f1117] rounded-2xl border border-[#1e2130] p-4">
        <h4 className="text-sm font-semibold text-[#e2e8f0] mb-1">KITTI 遮挡等级分布</h4>
        <p className="text-[10px] text-[#4a5568] mb-3">标注框遮挡程度统计（0=完全可见）</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={occDist} barSize={32}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2130" />
            <XAxis dataKey="level" tick={{ fontSize: 9, fill: '#4a5568' }} />
            <YAxis tick={{ fontSize: 9, fill: '#4a5568' }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
            <Tooltip contentStyle={{ background: '#1a1f2e', border: '1px solid #2a3040', borderRadius: 8, fontSize: 11 }}
              formatter={(v) => v.toLocaleString()} />
            <Bar dataKey="count" name="标注框数" radius={[4, 4, 0, 0]}>
              {occDist.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* KITTI 距离分布 */}
      <div className="bg-[#0f1117] rounded-2xl border border-[#1e2130] p-4">
        <h4 className="text-sm font-semibold text-[#e2e8f0] mb-1">KITTI 目标距离分布</h4>
        <p className="text-[10px] text-[#4a5568] mb-3">各类别在不同距离区间的标注数量（前向 50m）</p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={kittiDist} barSize={6}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2130" />
            <XAxis dataKey="range" tick={{ fontSize: 8, fill: '#4a5568' }} />
            <YAxis tick={{ fontSize: 9, fill: '#4a5568' }} />
            <Tooltip contentStyle={{ background: '#1a1f2e', border: '1px solid #2a3040', borderRadius: 8, fontSize: 11 }} />
            <Legend wrapperStyle={{ fontSize: 10, color: '#8892a4' }} />
            <Bar dataKey="Car"        fill="#6c5ce7" stackId="a" />
            <Bar dataKey="Pedestrian" fill="#fd79a8" stackId="a" />
            <Bar dataKey="Cyclist"    fill="#00cec9" stackId="a" />
            <Bar dataKey="Van"        fill="#fdcb6e" stackId="a" radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 数据集规模对比 */}
      <div className="bg-[#0f1117] rounded-2xl border border-[#1e2130] p-4">
        <h4 className="text-sm font-semibold text-[#e2e8f0] mb-1">训练数据集规模对比</h4>
        <p className="text-[10px] text-[#4a5568] mb-3">实验室选用数据集 vs 评测基准（对数坐标）</p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={DATASET_COMPARISON} barSize={28}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2130" />
            <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#8892a4' }} />
            <YAxis scale="log" domain={['auto','auto']} tick={{ fontSize: 9, fill: '#4a5568' }}
              tickFormatter={v => v >= 1e6 ? `${(v/1e6).toFixed(0)}M` : v >= 1000 ? `${(v/1000).toFixed(0)}K` : v} />
            <Tooltip contentStyle={{ background: '#1a1f2e', border: '1px solid #2a3040', borderRadius: 8, fontSize: 11 }}
              formatter={v => v.toLocaleString()} />
            <Bar dataKey="samples" name="标注帧数" radius={[4,4,0,0]}>
              {DATASET_COMPARISON.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── 数据集概览卡片 ────────────────────────────────────────────
function DatasetOverview() {
  return (
    <div className="mb-6 space-y-3">
      {/* 汇总数字 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: '总帧数',   value: `${(DATASET_STATS.total_frames / 1e6).toFixed(0)}M`, icon: '🎬', color: '#6c5ce7' },
          { label: '总时长',   value: `${DATASET_STATS.total_hours.toLocaleString()}h`,     icon: '⏱️', color: '#00cec9' },
          { label: '场景数',   value: DATASET_STATS.total_scenarios.toLocaleString(),        icon: '🗺️', color: '#fd79a8' },
          { label: '数据集',   value: `${DATASET_SELECTION.length} 个`,                     icon: '📦', color: '#fdcb6e' },
        ].map((s) => (
          <div key={s.label} className="bg-[#0f1117] rounded-2xl border border-[#1e2130] p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: s.color + '22' }}>
              {s.icon}
            </div>
            <div>
              <p className="text-base font-bold font-mono" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[10px] text-[#4a5568]">{s.label}</p>
            </div>
          </div>
        ))}
      </div>
      {/* 数据集角色标签 */}
      <div className="flex flex-wrap gap-2">
        {DATASET_SELECTION.map(ds => (
          <div key={ds.name} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-medium"
            style={{ borderColor: ds.color + '44', background: ds.color + '11', color: ds.color }}>
            <span>{ds.icon}</span>
            <span className="font-bold">{ds.name}</span>
            <span className="opacity-70">· {ds.role}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── KITTI 样本视图 ───────────────────────────────────────────
function KittiSampleView() {
  const [selectedSample, setSelectedSample] = useState(0);
  const sample = KITTI_SAMPLES[selectedSample];

  return (
    <div className="space-y-4">
      {/* 样本选择 */}
      <div className="flex gap-2 flex-wrap">
        {KITTI_SAMPLES.map((s) => (
          <button
            key={s.id}
            onClick={() => setSelectedSample(s.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all"
            style={
              selectedSample === s.id
                ? { background: '#fdcb6e', borderColor: '#fdcb6e', color: '#1a1200', boxShadow: '0 2px 8px #fdcb6e55' }
                : { background: '#0f1117', borderColor: '#1e2130', color: '#718096' }
            }
          >
            <span className="font-mono">{s.sequence}</span>
            <span className="opacity-70">{s.num_objects}obj</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* KITTI 前向相机帧（Canvas 模拟） */}
        <div className="bg-[#0f1117] rounded-2xl border border-[#1e2130] p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-[#e2e8f0]">📷 前向单目相机</h4>
            <span className="text-[10px] text-[#4a5568] font-mono">1242×375 · 10Hz</span>
          </div>
          {/* 模拟相机帧 */}
          <KittiCamCanvas sample={sample} />
          <div className="mt-3 grid grid-cols-2 gap-1.5 max-h-28 overflow-y-auto">
            {sample.boxes.map((box) => (
              <div key={box.id} className="flex items-center gap-2 px-2 py-1 rounded-lg bg-[#1a1f2e] text-[10px]">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: box.color }} />
                <span className="font-mono text-[#a0aec0]">{box.cls}</span>
                <span className="text-[#4a5568] ml-auto">{box.dist}m</span>
                <span className="text-[10px]" style={{ color: box.occluded === 0 ? '#55efc4' : box.occluded === 1 ? '#fdcb6e' : '#fd79a8' }}>
                  {box.occluded === 0 ? '可见' : box.occluded === 1 ? '部分' : '遮挡'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* KITTI LiDAR BEV（前向半球） */}
        <div className="bg-[#0f1117] rounded-2xl border border-[#1e2130] p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-[#e2e8f0]">🗺️ LiDAR BEV（前向）</h4>
            <span className="text-[10px] text-[#4a5568] font-mono">64线 · 120m · {sample.lidar.length}点</span>
          </div>
          <KittiBevCanvas sample={sample} />
          {/* KITTI vs nuScenes LiDAR 对比 */}
          <div className="mt-3 grid grid-cols-2 gap-2 text-[10px]">
            <div className="p-2 rounded-lg bg-[#1a1f2e]">
              <p className="text-[#fdcb6e] font-medium mb-1">KITTI Velodyne HDL-64E</p>
              <p className="text-[#4a5568]">64 线 · 120m · 10Hz</p>
              <p className="text-[#4a5568]">前向 360° 水平</p>
              <p className="text-[#55efc4] mt-1">✓ 点云更密集</p>
            </div>
            <div className="p-2 rounded-lg bg-[#1a1f2e]">
              <p className="text-[#6c5ce7] font-medium mb-1">nuScenes VLP-32C</p>
              <p className="text-[#4a5568]">32 线 · 70m · 20Hz</p>
              <p className="text-[#4a5568]">360° 全向</p>
              <p className="text-[#fd79a8] mt-1">✓ 帧率更高</p>
            </div>
          </div>
        </div>
      </div>

      {/* KITTI 标注格式说明 */}
      <div className="bg-[#0f1117] rounded-2xl border border-[#1e2130] p-4">
        <h4 className="text-sm font-semibold text-[#e2e8f0] mb-3">📄 KITTI 标注格式（TXT）</h4>
        <div className="font-mono text-[10px] bg-[#080b12] rounded-xl p-3 border border-[#1e2130] overflow-x-auto">
          <p className="text-[#4a5568] mb-1"># type truncated occluded alpha  bbox(4)          dimensions(3)    location(3)      rotation_y  score</p>
          <p className="text-[#55efc4]">Car      0.00      0         -1.57  712 143 810 307  1.89 1.49 4.23  1.84 1.47 8.41  -1.56       0.92</p>
          <p className="text-[#fdcb6e]">Pedestrian 0.00   1         0.21   425 171 475 286  1.72 0.57 0.61  -1.23 1.65 12.3  0.21        0.78</p>
          <p className="text-[#fd79a8]">Cyclist  0.50      2         1.89   552 156 620 281  1.73 0.60 1.76  4.62 1.67 9.51  1.89        0.65</p>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-[10px]">
          {[
            { label: '坐标系', value: '相机坐标系', note: '⚠️ 非 LiDAR 坐标系', color: '#fdcb6e' },
            { label: '遮挡等级', value: '0/1/2/3', note: '完全/部分/大部分/未知', color: '#a29bfe' },
            { label: '截断比例', value: '0.0-1.0', note: '目标超出图像边界比例', color: '#00cec9' },
          ].map((f) => (
            <div key={f.label} className="p-2 rounded-lg bg-[#1a1f2e]">
              <p style={{ color: f.color }} className="font-medium mb-0.5">{f.label}</p>
              <p className="text-[#e2e8f0] font-mono">{f.value}</p>
              <p className="text-[#4a5568] mt-0.5">{f.note}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── KITTI 相机帧 Canvas ───────────────────────────────────────
function KittiCamCanvas({ sample }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;

    // 背景（晴天白天）
    const sky = ctx.createLinearGradient(0, 0, 0, H * 0.5);
    sky.addColorStop(0, '#87ceeb'); sky.addColorStop(1, '#c8e6f5');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H * 0.5);
    const ground = ctx.createLinearGradient(0, H * 0.5, 0, H);
    ground.addColorStop(0, '#6b7280'); ground.addColorStop(1, '#374151');
    ctx.fillStyle = ground; ctx.fillRect(0, H * 0.5, W, H * 0.5);

    // 道路（KITTI 典型场景：直道）
    ctx.fillStyle = '#4b5563';
    ctx.beginPath();
    ctx.moveTo(W * 0.3, H * 0.5); ctx.lineTo(W * 0.7, H * 0.5);
    ctx.lineTo(W * 0.9, H); ctx.lineTo(W * 0.1, H);
    ctx.closePath(); ctx.fill();
    // 车道线
    ctx.strokeStyle = '#ffffff88'; ctx.lineWidth = 2; ctx.setLineDash([10, 8]);
    ctx.beginPath(); ctx.moveTo(W * 0.5, H * 0.5); ctx.lineTo(W * 0.5, H); ctx.stroke();
    ctx.setLineDash([]);

    // 目标物 + 2D 框
    sample.boxes.forEach((box) => {
      const ox = box.bbox2d.u * W, oy = box.bbox2d.v * H;
      const ow = box.bbox2d.bw * W, oh = box.bbox2d.bh * H;
      ctx.fillStyle = box.color + 'bb';
      ctx.beginPath(); ctx.roundRect(ox - ow/2, oy - oh/2, ow, oh, 2); ctx.fill();
      ctx.strokeStyle = box.color; ctx.lineWidth = 2;
      ctx.strokeRect(ox - ow/2 - 2, oy - oh/2 - 2, ow + 4, oh + 4);
      // 标签
      ctx.fillStyle = box.color;
      ctx.fillRect(ox - ow/2 - 2, oy - oh/2 - 14, ow + 4, 13);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 8px monospace';
      ctx.fillText(`${box.cls.slice(0,3)} ${box.score}`, ox - ow/2, oy - oh/2 - 3);
    });

    // 相机标注
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, 0, W, 18);
    ctx.fillStyle = '#fdcb6e'; ctx.font = 'bold 10px monospace';
    ctx.fillText('KITTI · CAM_LEFT_COLOR · 1242×375', 5, 13);
  }, [sample]);

  return <canvas ref={canvasRef} width={560} height={200} className="rounded-xl w-full" />;
}

// ─── KITTI BEV Canvas（前向半球） ─────────────────────────────
function KittiBevCanvas({ sample }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H * 0.9;
    const SCALE = H * 0.85 / 60;

    ctx.fillStyle = '#0f1117'; ctx.fillRect(0, 0, W, H);

    // 扇形（前向 ±90°）
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, H * 0.85);
    grad.addColorStop(0, 'rgba(253,203,110,0.06)'); grad.addColorStop(1, 'rgba(253,203,110,0.01)');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, H * 0.85, -Math.PI, 0); ctx.closePath(); ctx.fill();

    // 距离圆弧
    [15, 30, 45, 60].forEach((r) => {
      ctx.strokeStyle = '#1e2130'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(cx, cy, r * SCALE, -Math.PI, 0); ctx.stroke();
      ctx.fillStyle = '#2a3040'; ctx.font = '9px monospace';
      ctx.fillText(`${r}m`, cx + r * SCALE + 2, cy - 2);
    });

    // 点云
    sample.lidar.forEach((pt) => {
      if (pt.x < 0) return; // 只显示前向
      const px = cx - pt.y * SCALE, py = cy - pt.x * SCALE;
      if (px < 0 || px > W || py < 0 || py > H) return;
      const t = pt.intensity;
      const r = t > 0.5 ? Math.round((t - 0.5) * 2 * 255) : 0;
      const g = Math.round(Math.min(t * 2, 1) * 180);
      const b = t < 0.5 ? Math.round((0.5 - t) * 2 * 255) : 0;
      ctx.fillStyle = `rgba(${r},${g},${b},0.8)`;
      ctx.fillRect(px - 1, py - 1, 2, 2);
    });

    // 3D 框
    sample.boxes.forEach((box) => {
      const bx = cx - box.y * SCALE, by = cy - box.x * SCALE;
      const bw = box.w * SCALE, bl = box.l * SCALE;
      ctx.strokeStyle = box.color; ctx.lineWidth = 1.8;
      ctx.fillStyle = box.color + '22';
      ctx.fillRect(bx - bl/2, by - bw/2, bl, bw);
      ctx.strokeRect(bx - bl/2, by - bw/2, bl, bw);
      ctx.fillStyle = box.color; ctx.font = 'bold 9px monospace';
      ctx.fillText(`${box.cls.slice(0,3)}`, bx + 3, by - 3);
    });

    // 自车
    ctx.fillStyle = '#fdcb6e';
    ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 8px sans-serif';
    ctx.fillText('EGO', cx - 10, cy + 16);
    ctx.fillStyle = '#fdcb6e'; ctx.font = '9px monospace';
    ctx.fillText('▲ FRONT', cx - 24, 14);
  }, [sample]);

  return <canvas ref={canvasRef} width={400} height={300} className="rounded-xl w-full" style={{ background: '#0f1117' }} />;
}

// ─── 数据集对比 + VLA 信息分析 ────────────────────────────────
function DatasetCompare() {
  const [activeView, setActiveView] = useState('compare');

  return (
    <div className="space-y-4">
      {/* 子视图切换 */}
      <div className="flex gap-2 p-1 bg-[#0f1117] rounded-xl border border-[#1e2130]">
        {[
          { id: 'compare', label: '数据集横向对比', icon: '⚖️' },
          { id: 'vla',     label: 'VLA 输入信息分析', icon: '🧠' },
          { id: 'bev',     label: 'BEV 信息损失', icon: '📉' },
        ].map((v) => (
          <button
            key={v.id}
            onClick={() => setActiveView(v.id)}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium transition-all"
            style={
              activeView === v.id
                ? { background: '#1a1f2e', color: '#a29bfe', border: '1px solid #6c5ce755' }
                : { color: '#4a5568' }
            }
          >
            <span>{v.icon}</span><span>{v.label}</span>
          </button>
        ))}
      </div>

      {activeView === 'compare' && <DatasetCompareTable />}
      {activeView === 'vla' && <VlaInputAnalysis />}
      {activeView === 'bev' && <BevInfoLoss />}
    </div>
  );
}

// ─── 数据集横向对比表 ─────────────────────────────────────────
function DatasetCompareTable() {
  const features = [
    { key: 'year',        label: '发布年份',    fmt: (v) => v },
    { key: 'samples',     label: '标注帧数',    fmt: (v) => v.toLocaleString() },
    { key: 'annotations', label: '标注框数',    fmt: (v) => v >= 1e6 ? `${(v/1e6).toFixed(1)}M` : `${(v/1000).toFixed(0)}K` },
    { key: 'cameras',     label: '相机数量',    fmt: (v) => `${v} 路` },
    { key: 'lidar_lines', label: 'LiDAR 线数',  fmt: (v) => `${v} 线` },
    { key: 'has_radar',   label: 'Radar',       fmt: (v) => v ? '✅' : '❌' },
    { key: 'has_map',     label: 'HD Map',      fmt: (v) => v ? '✅' : '❌' },
    { key: 'has_velocity',label: '速度标注',    fmt: (v) => v ? '✅' : '❌' },
    { key: 'fov',         label: '视野范围',    fmt: (v) => v },
    { key: 'coord_system',label: '坐标系',      fmt: (v) => v },
    { key: 'annotation_format', label: '标注格式', fmt: (v) => v },
    { key: 'size_gb',     label: '数据量',      fmt: (v) => `~${v >= 1000 ? `${v/1000}TB` : `${v}GB`}` },
  ];

  return (
    <div className="space-y-4">
      {/* 规模对比柱状图 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-[#0f1117] rounded-2xl border border-[#1e2130] p-4">
          <h4 className="text-sm font-semibold text-[#e2e8f0] mb-3">标注框数量对比（对数坐标）</h4>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={DATASET_COMPARISON} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2130" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#8892a4' }} />
              <YAxis scale="log" domain={['auto', 'auto']} tick={{ fontSize: 9, fill: '#4a5568' }}
                tickFormatter={(v) => v >= 1e6 ? `${(v/1e6).toFixed(0)}M` : v >= 1000 ? `${(v/1000).toFixed(0)}K` : v} />
              <Tooltip contentStyle={{ background: '#1a1f2e', border: '1px solid #2a3040', borderRadius: 8, fontSize: 11 }}
                formatter={(v) => v.toLocaleString()} />
              <Bar dataKey="annotations" name="标注框数" radius={[4, 4, 0, 0]}>
                {DATASET_COMPARISON.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-[#0f1117] rounded-2xl border border-[#1e2130] p-4">
          <h4 className="text-sm font-semibold text-[#e2e8f0] mb-3">标注帧数对比（对数坐标）</h4>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={DATASET_COMPARISON} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2130" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#8892a4' }} />
              <YAxis scale="log" domain={['auto', 'auto']} tick={{ fontSize: 9, fill: '#4a5568' }}
                tickFormatter={(v) => v >= 1e6 ? `${(v/1e6).toFixed(1)}M` : `${(v/1000).toFixed(0)}K`} />
              <Tooltip contentStyle={{ background: '#1a1f2e', border: '1px solid #2a3040', borderRadius: 8, fontSize: 11 }}
                formatter={(v) => v.toLocaleString()} />
              <Bar dataKey="samples" name="标注帧数" radius={[4, 4, 0, 0]}>
                {DATASET_COMPARISON.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 特征对比表 */}
      <div className="bg-[#0f1117] rounded-2xl border border-[#1e2130] overflow-hidden">
        <div className="p-4 border-b border-[#1e2130]">
          <h4 className="text-sm font-semibold text-[#e2e8f0]">数据集特征全面对比</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-[#1e2130]">
                <th className="text-left px-4 py-2.5 text-[#4a5568] font-medium w-28">特征</th>
                {DATASET_COMPARISON.map((d) => (
                  <th key={d.name} className="px-4 py-2.5 text-center font-bold" style={{ color: d.color }}>{d.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {features.map((f, fi) => (
                <tr key={f.key} className={fi % 2 === 0 ? 'bg-[#0a0d14]' : ''}>
                  <td className="px-4 py-2 text-[#4a5568]">{f.label}</td>
                  {DATASET_COMPARISON.map((d) => (
                    <td key={d.name} className="px-4 py-2 text-center font-mono text-[#a0aec0]">
                      {f.fmt(d[f.key])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 优缺点总结 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[
          {
            name: 'KITTI', color: '#fdcb6e',
            pros: ['64线LiDAR，点云密度高', '双目相机，可计算视差深度', '任务多样（检测/跟踪/深度/光流）', '学术界基准，论文引用量最高'],
            cons: ['仅前向视角，无环视', '无速度标注，无HD Map', '场景单一（德国郊区）', '数据量小，不适合大规模训练', '标注坐标系为相机系，需转换'],
          },
          {
            name: 'nuPlan', color: '#6c5ce7',
            pros: ['1500h 真实驾驶数据，规模最大', '有 HD Map，规划任务必须', '有速度/加速度标注，轨迹预测必须', '有语言场景描述，VLA 对齐必须', 'SQLite 数据库格式，查询高效'],
            cons: ['无 Radar 传感器', '相机分辨率相对较低', '主要覆盖美国城市场景', '数据获取需申请授权'],
          },
        ].map((d) => (
          <div key={d.name} className="bg-[#0f1117] rounded-2xl border border-[#1e2130] p-4">
            <h4 className="text-sm font-bold mb-3" style={{ color: d.color }}>{d.name} 优缺点</h4>
            <div className="space-y-1.5 mb-3">
              {d.pros.map((p) => (
                <div key={p} className="flex items-start gap-2 text-[11px]">
                  <span className="text-[#55efc4] mt-0.5 flex-shrink-0">✓</span>
                  <span className="text-[#a0aec0]">{p}</span>
                </div>
              ))}
            </div>
            <div className="space-y-1.5">
              {d.cons.map((c) => (
                <div key={c} className="flex items-start gap-2 text-[11px]">
                  <span className="text-[#fd79a8] mt-0.5 flex-shrink-0">✗</span>
                  <span className="text-[#4a5568]">{c}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── VLA 输入信息分析 ─────────────────────────────────────────
function VlaInputAnalysis() {
  return (
    <div className="space-y-4">
      {/* 核心观点卡片 */}
      <div className="bg-[#0f1117] rounded-2xl border border-[#fdcb6e]/30 p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl flex-shrink-0">💡</span>
          <div>
            <h4 className="text-sm font-bold text-[#fdcb6e] mb-2">VLA 是否需要 BEV？——核心问题分析</h4>
            <p className="text-[11px] text-[#a0aec0] leading-relaxed mb-3">
              你的直觉是对的：<span className="text-[#fd79a8] font-medium">BEV 确实会丢失大量信息</span>。
              BEV 是一种「中间表示」，它把原始传感器数据压缩成俯视图，
              虽然空间关系清晰，但纹理、颜色、外观等语义信息大量损失。
              对于 VLA 这类需要理解语言指令并做出精细决策的模型，这是一个严重的问题。
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  title: '端到端方案（推荐）',
                  desc: '直接输入原始多视角图像 + 点云，让模型自己学习特征提取，保留最完整信息',
                  color: '#55efc4',
                  icon: '✅',
                  examples: ['Tesla FSD', 'UniAD', 'VAD'],
                },
                {
                  title: 'BEV 中间表示',
                  desc: 'BEVFormer 等预处理成 BEV 特征后输入，空间关系好但语义损失大',
                  color: '#fdcb6e',
                  icon: '⚠️',
                  examples: ['BEVFormer', 'BEVFusion', 'DETR3D'],
                },
                {
                  title: '结构化输入',
                  desc: '只输入检测框/轨迹等结构化数据，计算量最小但信息损失最严重',
                  color: '#fd79a8',
                  icon: '❌',
                  examples: ['传统规划器', 'IDM', 'PDM'],
                },
              ].map((s) => (
                <div key={s.title} className="p-3 rounded-xl bg-[#080b12] border" style={{ borderColor: s.color + '44' }}>
                  <div className="flex items-center gap-1.5 mb-2">
                    <span>{s.icon}</span>
                    <span className="text-xs font-bold" style={{ color: s.color }}>{s.title}</span>
                  </div>
                  <p className="text-[10px] text-[#4a5568] leading-relaxed mb-2">{s.desc}</p>
                  <div className="flex flex-wrap gap-1">
                    {s.examples.map((e) => (
                      <span key={e} className="text-[9px] px-1.5 py-0.5 rounded-full font-mono"
                        style={{ background: s.color + '18', color: s.color }}>{e}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 各模态信息量雷达图 */}
      <div className="bg-[#0f1117] rounded-2xl border border-[#1e2130] p-4">
        <h4 className="text-sm font-semibold text-[#e2e8f0] mb-1">各输入模态信息量对比（VLA 规划任务视角）</h4>
        <p className="text-[10px] text-[#4a5568] mb-4">评分维度：语义丰富度 · 几何精度 · 时序连续性 · 感知范围 · 计算成本（越高越贵）</p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={[
              { dim: '语义丰富度', '原始图像': 9, 'BEV特征': 5, 'LiDAR点云': 3, '融合输入': 9 },
              { dim: '几何精度',   '原始图像': 5, 'BEV特征': 8, 'LiDAR点云': 10,'融合输入': 10 },
              { dim: '时序连续',   '原始图像': 7, 'BEV特征': 6, 'LiDAR点云': 5, '融合输入': 8 },
              { dim: '感知范围',   '原始图像': 4, 'BEV特征': 7, 'LiDAR点云': 9, '融合输入': 9 },
              { dim: '计算效率',   '原始图像': 8, 'BEV特征': 5, 'LiDAR点云': 3, '融合输入': 2 },
            ]}>
              <PolarGrid stroke="#1e2130" />
              <PolarAngleAxis dataKey="dim" tick={{ fontSize: 9, fill: '#8892a4' }} />
              <PolarRadiusAxis domain={[0, 10]} tick={{ fontSize: 8, fill: '#4a5568' }} />
              <Radar name="原始图像" dataKey="原始图像" stroke="#fd79a8" fill="#fd79a8" fillOpacity={0.15} />
              <Radar name="BEV特征" dataKey="BEV特征" stroke="#fdcb6e" fill="#fdcb6e" fillOpacity={0.15} />
              <Radar name="LiDAR点云" dataKey="LiDAR点云" stroke="#00cec9" fill="#00cec9" fillOpacity={0.15} />
              <Radar name="融合输入" dataKey="融合输入" stroke="#6c5ce7" fill="#6c5ce7" fillOpacity={0.2} />
              <Legend wrapperStyle={{ fontSize: 10, color: '#8892a4' }} />
              <Tooltip contentStyle={{ background: '#1a1f2e', border: '1px solid #2a3040', borderRadius: 8, fontSize: 11 }} />
            </RadarChart>
          </ResponsiveContainer>

          {/* 模态说明 */}
          <div className="space-y-2">
            {VLA_MODALITY_SCORES.map((m) => (
              <div key={m.modality} className="p-3 rounded-xl bg-[#080b12] border border-[#1e2130]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono text-[#a29bfe]">{m.modality.replace('\n', ' ')}</span>
                  <div className="flex gap-1">
                    {[['语义', m.richness, '#fd79a8'], ['几何', m.geometry, '#00cec9'], ['效率', 10 - m.cost, '#55efc4']].map(([l, v, c]) => (
                      <span key={l} className="text-[9px] px-1.5 py-0.5 rounded-full font-mono"
                        style={{ background: c + '22', color: c }}>{l}:{v}</span>
                    ))}
                  </div>
                </div>
                <p className="text-[10px] text-[#4a5568]">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 推荐方案 */}
      <div className="bg-[#0f1117] rounded-2xl border border-[#6c5ce7]/30 p-4">
        <h4 className="text-sm font-semibold text-[#a29bfe] mb-3">🎯 自动驾驶 VLA 推荐输入方案</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            {
              stage: '感知阶段',
              input: '6路原始图像 + LiDAR 点云',
              reason: '保留最完整的语义和几何信息，让 ViT/BEVFormer 自适应提取特征',
              color: '#6c5ce7',
            },
            {
              stage: '语言理解',
              input: '自然语言指令 + 场景描述',
              reason: 'LLM 对图像语义的理解远强于对 BEV 特征的理解，原始图像更利于 VLM 对齐',
              color: '#00cec9',
            },
            {
              stage: '时序建模',
              input: '历史帧图像序列（T-4 到 T）',
              reason: '世界模型需要时序信息预测未来，图像序列比 BEV 序列保留更多运动线索',
              color: '#fd79a8',
            },
            {
              stage: '规划输出',
              input: 'BEV 空间轨迹点',
              reason: '输出阶段用 BEV 坐标表示规划轨迹是合理的，因为规划本身是空间问题',
              color: '#fdcb6e',
            },
          ].map((s) => (
            <div key={s.stage} className="p-3 rounded-xl bg-[#080b12] border" style={{ borderColor: s.color + '44' }}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[9px] px-2 py-0.5 rounded-full font-bold" style={{ background: s.color + '22', color: s.color }}>{s.stage}</span>
              </div>
              <p className="text-[11px] font-mono text-[#e2e8f0] mb-1">{s.input}</p>
              <p className="text-[10px] text-[#4a5568] leading-relaxed">{s.reason}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── BEV 信息损失可视化 ───────────────────────────────────────
function BevInfoLoss() {
  return (
    <div className="space-y-4">
      <div className="bg-[#0f1117] rounded-2xl border border-[#1e2130] p-4">
        <h4 className="text-sm font-semibold text-[#e2e8f0] mb-1">各维度信息保留率对比</h4>
        <p className="text-[10px] text-[#4a5568] mb-4">
          原始图像 vs BEV 投影 vs LiDAR BEV 在各感知维度的信息保留率（%）
        </p>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={BEV_INFO_LOSS} layout="vertical" barSize={10} barGap={2}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2130" horizontal={false} />
            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 9, fill: '#4a5568' }} tickFormatter={(v) => `${v}%`} />
            <YAxis type="category" dataKey="aspect" tick={{ fontSize: 10, fill: '#8892a4' }} width={72} />
            <Tooltip
              contentStyle={{ background: '#1a1f2e', border: '1px solid #2a3040', borderRadius: 8, fontSize: 11 }}
              formatter={(v, name) => [`${v}%`, name]}
            />
            <Legend wrapperStyle={{ fontSize: 10, color: '#8892a4' }} />
            <Bar dataKey="raw_img"  name="原始图像"  fill="#fd79a8" radius={[0, 3, 3, 0]} />
            <Bar dataKey="bev_proj" name="BEV 投影"  fill="#fdcb6e" radius={[0, 3, 3, 0]} />
            <Bar dataKey="lidar_bev"name="LiDAR BEV" fill="#00cec9" radius={[0, 3, 3, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 关键结论 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[
          {
            title: 'BEV 投影的核心问题',
            color: '#fd79a8',
            points: [
              '纹理/颜色信息损失 ~70%，VLM 无法从 BEV 中读取语义',
              '高度信息被压缩，无法区分行人/路牌/树木',
              '近处目标被远处目标遮挡的信息丢失',
              '相机内参/外参误差会导致 BEV 投影畸变',
              '动态目标（如行人）在 BEV 中形变严重',
            ],
          },
          {
            title: '何时 BEV 是合理的',
            color: '#55efc4',
            points: [
              '输出规划轨迹时：BEV 坐标系直观且统一',
              '多传感器融合时：LiDAR+Camera 在 BEV 对齐',
              '地图元素感知：车道线/停止线天然是 BEV 表示',
              '占用栅格预测：BEV Occupancy 是标准输出格式',
              '作为中间监督信号，而非 VLA 的直接输入',
            ],
          },
        ].map((s) => (
          <div key={s.title} className="bg-[#0f1117] rounded-2xl border border-[#1e2130] p-4">
            <h4 className="text-sm font-bold mb-3" style={{ color: s.color }}>{s.title}</h4>
            <div className="space-y-1.5">
              {s.points.map((p) => (
                <div key={p} className="flex items-start gap-2 text-[11px]">
                  <span style={{ color: s.color }} className="mt-0.5 flex-shrink-0">•</span>
                  <span className="text-[#a0aec0] leading-relaxed">{p}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 信息流架构图 */}
      <div className="bg-[#0f1117] rounded-2xl border border-[#1e2130] p-4">
        <h4 className="text-sm font-semibold text-[#e2e8f0] mb-3">推荐：端到端 VLA 信息流</h4>
        <div className="flex flex-wrap items-center gap-2 text-[10px]">
          {[
            { label: '6路图像\n(原始)', color: '#fd79a8', icon: '📷' },
            { label: '→', color: '#4a5568', icon: '' },
            { label: 'ViT / BEVFormer\n(特征提取)', color: '#6c5ce7', icon: '🔬' },
            { label: '→', color: '#4a5568', icon: '' },
            { label: 'Cross-Attention\n(语言对齐)', color: '#00cec9', icon: '🔗' },
            { label: '→', color: '#4a5568', icon: '' },
            { label: 'World Model\n(未来预测)', color: '#a29bfe', icon: '🌍' },
            { label: '→', color: '#4a5568', icon: '' },
            { label: 'BEV 轨迹\n(规划输出)', color: '#fdcb6e', icon: '🗺️' },
          ].map((s, i) => (
            s.icon ? (
              <div key={i} className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl bg-[#080b12] border" style={{ borderColor: s.color + '44' }}>
                <span className="text-base">{s.icon}</span>
                <span style={{ color: s.color }} className="font-medium text-center whitespace-pre-line">{s.label}</span>
              </div>
            ) : (
              <span key={i} className="text-lg" style={{ color: s.color }}>{s.label}</span>
            )
          ))}
        </div>
        <p className="mt-3 text-[10px] text-[#4a5568] leading-relaxed">
          <span className="text-[#fdcb6e] font-medium">关键设计原则：</span>
          输入端保留原始图像的完整语义信息，BEV 仅作为特征融合的中间空间，
          最终规划输出在 BEV 坐标系表达。这样既利用了 BEV 的空间优势，
          又不丢失 VLM 所需的语义信息。
        </p>
      </div>
    </div>
  );
}

// ─── Tab 定义 ──────────────────────────────────────────────────
const TABS = [
  { id: 'kitti',   label: 'KITTI 数据集', icon: '📂', desc: '前向单目 · 64线LiDAR · 标注格式' },
  { id: 'compare', label: '数据集对比',   icon: '⚖️', desc: 'KITTI vs nuPlan vs Waymo · VLA 输入分析 · BEV 信息损失' },
  { id: 'stats',   label: 'KITTI 统计',     icon: '📊', desc: 'KITTI 目标分布 · 距离 · 遮挡等级 · 数据集规模' },
];

// ─── 主组件 ────────────────────────────────────────────────────
export default function AdDataViz() {
  const [activeTab, setActiveTab] = useState('kitti');

  return (
    <div className="bg-[#080b12] rounded-3xl border border-[#1e2130] p-5">
      {/* 标题 */}
      {(() => {
        const TAB_HEADER = {
          kitti:   { title: 'KITTI 数据集可视化',        sub: 'Karlsruhe, Germany · 2012/2015 · Velodyne HDL-64E' },
          compare: { title: '数据集横向对比 & VLA 分析',  sub: 'KITTI · nuPlan · Waymo · Argoverse2' },
          stats:   { title: 'KITTI 数据统计',             sub: 'KITTI 目标分布 · 距离 · 遮挡等级 · 数据集规樘' },
        };
        const { title, sub } = TAB_HEADER[activeTab] ?? TAB_HEADER.sensor;
        return (
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#6c5ce7] to-[#00cec9] flex items-center justify-center text-xl shadow-lg flex-shrink-0">
          🚗
        </div>
        <div>
          <h3 className="text-base font-bold text-[#e2e8f0]">{title}</h3>
          <p className="text-[11px] text-[#4a5568]">{sub}</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 bg-green-900/30 rounded-full border border-green-800/40">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
          <span className="text-[10px] text-green-400 font-medium">实时渲染</span>
        </div>
      </div>
        );
      })()}
      <DatasetOverview />

      {/* Tab */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex-shrink-0 flex items-center gap-2 py-2 px-4 rounded-xl text-xs font-medium transition-all border"
            style={
              activeTab === tab.id
                ? { background: '#1a1f2e', color: '#a29bfe', borderColor: '#6c5ce7', boxShadow: '0 0 0 1px #6c5ce755' }
                : { background: '#0f1117', color: '#4a5568', borderColor: '#1e2130' }
            }
          >
            <span>{tab.icon}</span>
            <span className="whitespace-nowrap">{tab.label}</span>
          </button>
        ))}
      </div>

      {activeTab === 'kitti' && (
        <KittiSampleView />
      )}

      {activeTab === 'compare' && (
        <DatasetCompare />
      )}

      {activeTab === 'stats' && (
        <DetectionStats />
      )}

      {/* 底部说明 */}
      <div className="mt-5 p-3 bg-[#0f1117] rounded-xl border border-[#1e2130] text-[10px] text-[#4a5568] leading-relaxed">
        <span className="text-[#6c5ce7] font-medium">📌 数据说明：</span>
        传感器数据均为模拟生成，用于展示数据格式与可视化效果。
        KITTI 数据参考 <span className="font-mono text-[#8892a4]">KITTI 2012/2015</span> 格式；
        传感器融合参考 <span className="font-mono text-[#8892a4]">nuScenes v1.0</span> 配置（仅作传感器配置参考，非主训练集）。
        实验室主训练数据为 <span className="font-mono text-[#fdcb6e]">OpenDV-2K + nuPlan + CARLA</span>，详见「架构」Tab。
      </div>
    </div>
  );
}
