'use client';

import { useState, useMemo, useEffect, useRef } from 'react';

// ════════════════════════════════════════════════════════════════
// Seed-AD 三阶段预测可视化
// 想象（Imagination）· 反思（Reflection）· 行动（Action）
// 共享 30 帧时间轴（0~3s, 10Hz），拖动/播放时三图同步刷新
// ════════════════════════════════════════════════════════════════

const FRAMES = 30;       // 3s × 10Hz
const DT = 0.1;          // 100ms 每帧
const GRID_N = 40;       // BEV 占用栅格 40×40
const GRID_RANGE = 40;   // ±20m

// ── 场景预设：决定演示时是否触发保守模式 ───────────────────────
const SCENES = [
  {
    id: 'urban_cruise',
    name: '城市巡航',
    desc: '直行巡航，周围车辆正常行驶，无风险触发',
    icon: '🛣️',
    peakFrame: -1,
  },
  {
    id: 'cut_in',
    name: '紧急切入',
    desc: '右前方车辆 1.8s 后切入本车道，反思触发保守模式',
    icon: '⚠️',
    peakFrame: 18,
  },
  {
    id: 'ped_cross',
    name: '行人横穿',
    desc: '左前方行人 2.4s 后横穿，预测碰撞概率升高',
    icon: '🚸',
    peakFrame: 24,
  },
];

// ── 伪随机（按帧+种子生成确定性结果，避免每次渲染闪烁） ─────
function hash(seed) {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// ── 生成 30 帧 BEV 占用栅格（想象模块输出） ─────────────────
function genBEVFrames(scene) {
  const frames = [];
  for (let t = 0; t < FRAMES; t++) {
    const grid = new Float32Array(GRID_N * GRID_N);
    // 道路边界（两侧低占用）
    for (let i = 0; i < GRID_N; i++) {
      grid[i * GRID_N + 0] = 0.15;
      grid[i * GRID_N + 1] = 0.10;
      grid[i * GRID_N + (GRID_N - 1)] = 0.15;
      grid[i * GRID_N + (GRID_N - 2)] = 0.10;
    }
    // 周围车辆（3-5 个移动目标）
    const nObs = 4;
    for (let o = 0; o < nObs; o++) {
      // 每个目标有自己的轨迹：初始位置 + 速度
      const seed = o * 37 + 13;
      const x0 = (hash(seed) - 0.5) * 25;         // ±12m 横向
      const y0 = 5 + hash(seed + 1) * 25;         // 5~30m 纵向
      const vx = (hash(seed + 2) - 0.5) * 2;      // ±1 m/s
      const vy = -4 + hash(seed + 3) * 2;         // -4~-2 m/s（相向）
      const x = x0 + vx * t * DT;
      const y = y0 + vy * t * DT;
      // 映射到栅格
      const gx = Math.floor((x + GRID_RANGE / 2) / (GRID_RANGE / GRID_N));
      const gy = Math.floor((GRID_RANGE - y) / (GRID_RANGE / GRID_N));
      if (gx >= 1 && gx < GRID_N - 1 && gy >= 1 && gy < GRID_N - 1) {
        // 2×2 占用块 + 边缘淡化
        for (let di = -1; di <= 1; di++) {
          for (let dj = -1; dj <= 1; dj++) {
            const idx = (gy + dj) * GRID_N + (gx + di);
            const strength = (di === 0 && dj === 0) ? 0.95 : 0.55;
            grid[idx] = Math.max(grid[idx], strength);
          }
        }
      }
    }
    // 场景专属目标（切入车 / 行人）
    if (scene.id === 'cut_in') {
      // 右前方 → 中心车道
      const x = 4 - (t / FRAMES) * 4.5;
      const y = 18 - t * DT * 3;
      const gx = Math.floor((x + GRID_RANGE / 2) / (GRID_RANGE / GRID_N));
      const gy = Math.floor((GRID_RANGE - y) / (GRID_RANGE / GRID_N));
      if (gx >= 1 && gx < GRID_N - 1 && gy >= 1 && gy < GRID_N - 1) {
        for (let di = -1; di <= 1; di++) {
          for (let dj = -1; dj <= 1; dj++) {
            grid[(gy + dj) * GRID_N + (gx + di)] = 1.0;
          }
        }
      }
    } else if (scene.id === 'ped_cross') {
      // 左前方横穿
      const x = -6 + (t / FRAMES) * 8;
      const y = 15;
      const gx = Math.floor((x + GRID_RANGE / 2) / (GRID_RANGE / GRID_N));
      const gy = Math.floor((GRID_RANGE - y) / (GRID_RANGE / GRID_N));
      if (gx >= 0 && gx < GRID_N && gy >= 0 && gy < GRID_N) {
        grid[gy * GRID_N + gx] = 1.0;
      }
    }
    frames.push(grid);
  }
  return frames;
}

// ── 生成 30 帧 5 维风险评分（反思模块输出） ────────────────
function genRiskFrames(scene) {
  const frames = [];
  for (let t = 0; t < FRAMES; t++) {
    // 基础值：低风险巡航
    let collision = 0.08 + hash(t) * 0.05;
    let comfort   = 0.85 + hash(t + 1) * 0.08;
    let efficiency= 0.80 + hash(t + 2) * 0.10;
    let compliance= 0.92 + hash(t + 3) * 0.05;

    // 场景注入风险峰值（高斯钟形）
    if (scene.peakFrame > 0) {
      const sigma = 4;
      const gauss = Math.exp(-((t - scene.peakFrame) ** 2) / (2 * sigma ** 2));
      collision += gauss * 0.65;
      comfort   -= gauss * 0.45;
      efficiency-= gauss * 0.25;
    }

    collision  = Math.min(1, Math.max(0, collision));
    comfort    = Math.min(1, Math.max(0, comfort));
    efficiency = Math.min(1, Math.max(0, efficiency));
    compliance = Math.min(1, Math.max(0, compliance));
    // 综合分：越低越安全（碰撞权重大）
    const overall = 1 - (collision * 0.5 + (1 - comfort) * 0.2 +
                         (1 - efficiency) * 0.15 + (1 - compliance) * 0.15);

    frames.push({ collision, comfort, efficiency, compliance, overall });
  }
  return frames;
}

// ── 生成 30 帧规划轨迹（行动模块输出） ──────────────────────
function genTrajFrames(scene, riskFrames) {
  // 一次性生成完整 30 点轨迹（车辆未来 3s）
  // 保守模式触发 → 轨迹减速且微微左偏避让
  const pts = [];
  let x = 0, y = 0, vy = 8;  // 初速度 8 m/s (~29 km/h)
  for (let t = 0; t < FRAMES; t++) {
    const risk = riskFrames[t];
    const conservative = risk.collision > 0.3;
    // 控制量
    let ax = 0, ay = 0;
    if (conservative) {
      ay = -2.5;  // 减速 2.5 m/s²
      // 根据场景决定避让方向
      ax = scene.id === 'cut_in' ? -0.6 : (scene.id === 'ped_cross' ? 0.5 : 0);
    } else {
      ay = 0.2;
    }
    vy = Math.max(1.5, vy + ay * DT);
    x += ax * DT;
    y += vy * DT;
    pts.push({
      x, y,
      conservative,
      conf: conservative ? 0.72 : 0.94,
      speed: vy,
    });
  }
  return pts;
}

// ════════════════════════════════════════════════════════════════
// 子组件 1：BEV 占用栅格
// ════════════════════════════════════════════════════════════════
function BEVView({ grid, conservative }) {
  const W = 260, H = 260;
  const cell = W / GRID_N;
  const rects = [];
  for (let i = 0; i < GRID_N; i++) {
    for (let j = 0; j < GRID_N; j++) {
      const v = grid[j * GRID_N + i];
      if (v < 0.05) continue;
      const alpha = Math.min(1, v);
      // 占用越高越红
      const color = v > 0.7 ? `rgba(239,68,68,${alpha})`
                   : v > 0.4 ? `rgba(251,191,36,${alpha * 0.85})`
                             : `rgba(16,185,129,${alpha * 0.5})`;
      rects.push(
        <rect key={`${i}-${j}`} x={i * cell} y={j * cell} width={cell} height={cell}
          fill={color} />
      );
    }
  }
  return (
    <div>
      <div className="text-[10px] text-gray-500 mb-1 flex items-center gap-1.5">
        <span className="text-emerald-600 font-semibold">① 想象 Imagination</span>
        <span className="text-gray-300">·</span>
        <span>BEV 占用栅格 40×40 · 10Hz</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: 280, background: '#0a0d14', borderRadius: 8, border: `1px solid ${conservative ? '#ef444466' : '#10b98133'}` }}>
        {/* 网格背景 */}
        {[0.25, 0.5, 0.75].map(f => (
          <g key={f}>
            <line x1={0} y1={H * f} x2={W} y2={H * f} stroke="#1e2130" strokeWidth="0.5" />
            <line x1={W * f} y1={0} x2={W * f} y2={H} stroke="#1e2130" strokeWidth="0.5" />
          </g>
        ))}
        {rects}
        {/* Ego 车（底部中心）*/}
        <rect x={W / 2 - 4} y={H - 20} width="8" height="16" fill="#10b981" stroke="#fff" strokeWidth="1" />
        <text x={W / 2 + 8} y={H - 10} fontSize="9" fill="#10b981" fontFamily="monospace">ego</text>
        {/* 刻度 */}
        <text x={4} y={12} fontSize="8" fill="#4a5568" fontFamily="monospace">+20m</text>
        <text x={4} y={H - 4} fontSize="8" fill="#4a5568" fontFamily="monospace">0m</text>
        <text x={W - 34} y={H - 4} fontSize="8" fill="#4a5568" fontFamily="monospace">右 +20m</text>
      </svg>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 子组件 2：5 维风险雷达
// ════════════════════════════════════════════════════════════════
function ReflectionRadar({ risk }) {
  const W = 260, H = 260, CX = W / 2, CY = H / 2, R = 95;
  const axes = [
    { label: '碰撞风险', key: 'collision', invert: true },
    { label: '舒适性', key: 'comfort', invert: false },
    { label: '通行效率', key: 'efficiency', invert: false },
    { label: '合规性', key: 'compliance', invert: false },
    { label: '综合得分', key: 'overall', invert: false },
  ];
  const N = axes.length;
  const angle = (i) => -Math.PI / 2 + (i * 2 * Math.PI) / N;
  const pt = (i, v) => {
    const a = angle(i);
    return { x: CX + R * v * Math.cos(a), y: CY + R * v * Math.sin(a) };
  };
  // 值（反转：碰撞越低越好 → 显示时取 1-collision）
  const values = axes.map((ax) => ax.invert ? (1 - risk[ax.key]) : risk[ax.key]);
  const polyPts = values.map((v, i) => {
    const p = pt(i, v);
    return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
  }).join(' ');
  // 风险高时变红
  const danger = risk.collision > 0.3;
  const fillColor = danger ? 'rgba(239,68,68,0.25)' : 'rgba(16,185,129,0.22)';
  const strokeColor = danger ? '#ef4444' : '#10b981';

  return (
    <div>
      <div className="text-[10px] text-gray-500 mb-1 flex items-center gap-1.5">
        <span className="text-cyan-600 font-semibold">② 反思 Reflection</span>
        <span className="text-gray-300">·</span>
        <span>5 维风险评分</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: 280, background: '#0a0d14', borderRadius: 8, border: `1px solid ${danger ? '#ef444466' : '#10b98133'}` }}>
        {/* 同心多边形网格 */}
        {[0.25, 0.5, 0.75, 1.0].map(r => {
          const pts = axes.map((_, i) => {
            const p = pt(i, r);
            return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
          }).join(' ');
          return <polygon key={r} points={pts} fill="none" stroke="#1e2130" strokeWidth="0.8" />;
        })}
        {/* 轴线 */}
        {axes.map((_, i) => {
          const p = pt(i, 1);
          return <line key={i} x1={CX} y1={CY} x2={p.x} y2={p.y} stroke="#1e2130" strokeWidth="0.6" />;
        })}
        {/* 数据多边形 */}
        <polygon points={polyPts} fill={fillColor} stroke={strokeColor} strokeWidth="1.5" />
        {values.map((v, i) => {
          const p = pt(i, v);
          return <circle key={i} cx={p.x} cy={p.y} r="3" fill={strokeColor} />;
        })}
        {/* 轴标签 + 数值 */}
        {axes.map((ax, i) => {
          const p = pt(i, 1.18);
          const pv = pt(i, values[i]);
          const rawVal = ax.invert ? risk[ax.key] : risk[ax.key];
          return (
            <g key={ax.key}>
              <text x={p.x} y={p.y} fontSize="9" fill="#94a3b8" fontFamily="system-ui" textAnchor="middle" dominantBaseline="middle">
                {ax.label}
              </text>
              <text x={pv.x} y={pv.y - 6} fontSize="8" fill={strokeColor} fontFamily="monospace" textAnchor="middle">
                {ax.invert ? rawVal.toFixed(2) : (rawVal * 100).toFixed(0) + (ax.key === 'overall' ? '' : '%')}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 子组件 3：轨迹 + 置信带
// ════════════════════════════════════════════════════════════════
function ActionTrajectory({ traj, currentFrame }) {
  const W = 260, H = 260;
  // 将 x∈[-5,5], y∈[0,30] 映射到画布
  const toX = (x) => W / 2 + x * 16;
  const toY = (y) => H - 20 - y * 7.5;
  const path = traj.map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(p.x).toFixed(1)},${toY(p.y).toFixed(1)}`).join(' ');
  // 置信带 ±0.3m（保守模式 ±0.15m）
  const bandUp = traj.map((p, i) => {
    const b = p.conservative ? 0.15 : 0.3;
    return `${i === 0 ? 'M' : 'L'}${toX(p.x - b).toFixed(1)},${toY(p.y).toFixed(1)}`;
  }).join(' ');
  const bandDn = traj.map((p, i) => {
    const b = p.conservative ? 0.15 : 0.3;
    return `${i === 0 ? 'M' : 'L'}${toX(p.x + b).toFixed(1)},${toY(p.y).toFixed(1)}`;
  }).join(' ');
  const current = traj[currentFrame];
  const speed = current?.speed || 0;
  const isConservative = current?.conservative;

  return (
    <div>
      <div className="text-[10px] text-gray-500 mb-1 flex items-center gap-1.5">
        <span className="text-emerald-600 font-semibold">③ 行动 Action</span>
        <span className="text-gray-300">·</span>
        <span>轨迹 + 置信带</span>
        {isConservative && (
          <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100 font-medium">
            ⚠ 保守模式
          </span>
        )}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: 280, background: '#0a0d14', borderRadius: 8, border: `1px solid ${isConservative ? '#ef444466' : '#10b98133'}` }}>
        {/* 道路（简化） */}
        <line x1={toX(-1.75)} y1={0} x2={toX(-1.75)} y2={H} stroke="#1e2130" strokeWidth="1" strokeDasharray="4,4" />
        <line x1={toX(1.75)} y1={0} x2={toX(1.75)} y2={H} stroke="#1e2130" strokeWidth="1" strokeDasharray="4,4" />
        <line x1={toX(-3.75)} y1={0} x2={toX(-3.75)} y2={H} stroke="#2d3748" strokeWidth="1.2" />
        <line x1={toX(3.75)} y1={0} x2={toX(3.75)} y2={H} stroke="#2d3748" strokeWidth="1.2" />
        {/* 置信带 */}
        <path d={bandUp} fill="none" stroke="#10b98144" strokeWidth="1" strokeDasharray="2,2" />
        <path d={bandDn} fill="none" stroke="#10b98144" strokeWidth="1" strokeDasharray="2,2" />
        {/* 主轨迹 */}
        <path d={path} fill="none"
          stroke={isConservative ? '#ef4444' : '#10b981'}
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {/* 30 个路径点 */}
        {traj.map((p, i) => (
          <circle key={i} cx={toX(p.x)} cy={toY(p.y)}
            r={i === currentFrame ? 4 : 1.8}
            fill={i === currentFrame ? '#fff' : (p.conservative ? '#ef4444' : '#10b981')}
            stroke={i === currentFrame ? (p.conservative ? '#ef4444' : '#10b981') : 'none'}
            strokeWidth={i === currentFrame ? 2 : 0}
          />
        ))}
        {/* Ego 车 */}
        <rect x={toX(0) - 5} y={toY(0) - 2} width="10" height="18" rx="2" fill="#10b981" stroke="#fff" strokeWidth="1" />
        {/* 时间/速度标注 */}
        <text x={10} y={16} fontSize="9" fill="#94a3b8" fontFamily="monospace">
          t = {(currentFrame * DT).toFixed(1)}s
        </text>
        <text x={10} y={28} fontSize="9" fill="#10b981" fontFamily="monospace">
          v = {speed.toFixed(1)} m/s
        </text>
        <text x={10} y={40} fontSize="9" fill="#94a3b8" fontFamily="monospace">
          conf = {(current?.conf * 100 || 0).toFixed(0)}%
        </text>
      </svg>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 主组件
// ════════════════════════════════════════════════════════════════
export default function SeedAdPredictionViz() {
  const [sceneIdx, setSceneIdx] = useState(1); // 默认演示"紧急切入"
  const [currentFrame, setCurrentFrame] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timerRef = useRef(null);

  const scene = SCENES[sceneIdx];

  // 预生成所有帧（scene 改变才重算）
  const bevFrames = useMemo(() => genBEVFrames(scene), [scene]);
  const riskFrames = useMemo(() => genRiskFrames(scene), [scene]);
  const trajPoints = useMemo(() => genTrajFrames(scene, riskFrames), [scene, riskFrames]);

  // 当前帧数据
  const bev = bevFrames[currentFrame];
  const risk = riskFrames[currentFrame];

  // 自动播放
  useEffect(() => {
    if (!playing) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setCurrentFrame((f) => {
        if (f >= FRAMES - 1) { setPlaying(false); return 0; }
        return f + 1;
      });
    }, 100);
    return () => clearInterval(timerRef.current);
  }, [playing]);

  // 场景切换时重置
  useEffect(() => {
    setCurrentFrame(0);
    setPlaying(false);
  }, [sceneIdx]);

  const conservative = trajPoints[currentFrame]?.conservative;

  return (
    <div className="space-y-4">
      {/* 场景选择 */}
      <div className="flex flex-wrap gap-2">
        <span className="text-xs text-gray-500 self-center mr-1">演示场景：</span>
        {SCENES.map((s, i) => (
          <button key={s.id} onClick={() => setSceneIdx(i)}
            className={`text-xs px-3 py-1.5 rounded-xl border transition-all font-medium ${
              i === sceneIdx
                ? 'border-emerald-300 bg-emerald-50 text-emerald-700 shadow-sm'
                : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
            }`}>
            <span className="mr-1">{s.icon}</span>{s.name}
          </button>
        ))}
      </div>
      <div className="text-xs text-gray-500 px-3 py-2 bg-gray-50 rounded-lg border border-gray-100">
        <span className="font-medium text-gray-700">{scene.icon} {scene.name}</span>
        <span className="mx-2">·</span>
        {scene.desc}
      </div>

      {/* 保守模式横幅 */}
      {conservative && (
        <div className="px-4 py-2.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-sm text-red-700">
          <span className="text-lg">⚠️</span>
          <span className="font-semibold">反思模块触发保守模式</span>
          <span className="text-xs text-red-500">—— 碰撞风险 {(risk.collision * 100).toFixed(0)}% &gt; 30%，轨迹已重规划（减速 2.5 m/s² + 横向避让）</span>
        </div>
      )}

      {/* 三视图（横向并列，小屏纵向） */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-3 rounded-2xl bg-white border border-gray-100">
          <BEVView grid={bev} conservative={conservative} />
        </div>
        <div className="p-3 rounded-2xl bg-white border border-gray-100">
          <ReflectionRadar risk={risk} />
        </div>
        <div className="p-3 rounded-2xl bg-white border border-gray-100">
          <ActionTrajectory traj={trajPoints} currentFrame={currentFrame} />
        </div>
      </div>

      {/* 共享时间轴 */}
      <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => setPlaying(p => !p)}
            className="text-sm px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors">
            {playing ? '⏸ 暂停' : '▶ 播放'}
          </button>
          <button onClick={() => { setCurrentFrame(0); setPlaying(false); }}
            className="text-sm px-3 py-1.5 rounded-xl bg-white border border-gray-200 hover:border-gray-300 text-gray-600 font-medium transition-colors">
            ↺ 重置
          </button>
          <div className="flex-1 text-right text-xs text-gray-500 font-mono">
            frame {currentFrame + 1} / {FRAMES}
            <span className="ml-2 text-emerald-600">t = {(currentFrame * DT).toFixed(1)}s</span>
          </div>
        </div>
        <input type="range" min={0} max={FRAMES - 1} value={currentFrame}
          onChange={(e) => setCurrentFrame(parseInt(e.target.value))}
          className="w-full accent-emerald-500" />
        <div className="flex justify-between text-[9px] text-gray-400 font-mono mt-1">
          <span>0.0s</span>
          <span>0.5s</span>
          <span>1.0s</span>
          <span>1.5s</span>
          <span>2.0s</span>
          <span>2.5s</span>
          <span>3.0s</span>
        </div>
      </div>

      {/* 结果摘要 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
        {[
          { label: '规划 L2', value: '0.54m', sub: '@ 3s（nuScenes SOTA）', color: '#10b981' },
          { label: '碰撞率', value: '0.11%', sub: 'vs VLA-World 0.15%', color: '#10b981' },
          { label: '推理延迟', value: '45ms', sub: 'Orin X · INT4 · 13B', color: '#00cec9' },
          { label: '反思次数', value: '≤3 次', sub: '自动终止迭代', color: '#6c5ce7' },
        ].map(m => (
          <div key={m.label} className="p-3 rounded-xl bg-white border border-gray-100">
            <div className="text-[10px] text-gray-400 mb-0.5">{m.label}</div>
            <div className="text-lg font-bold font-mono" style={{ color: m.color }}>{m.value}</div>
            <div className="text-[10px] text-gray-400">{m.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
