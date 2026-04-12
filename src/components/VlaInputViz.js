'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell,
} from 'recharts';
import { SAMPLED_EPISODES } from '@/lib/vla-data';

// ─── Canvas：模拟 RGB 场景帧 ───────────────────────────────────
function RGBFrameCanvas({ episode, step, width = 224, height = 168 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;

    // 背景（天空/墙壁）
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H * 0.55);
    bgGrad.addColorStop(0, '#e8eaf6');
    bgGrad.addColorStop(1, '#c5cae9');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // 绘制场景物体
    episode.scene_objects.forEach((obj) => {
      const x = obj.x * W, y = obj.y * H;
      const w = obj.w * W, h = obj.h * H;
      ctx.fillStyle = obj.color;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 4);
      ctx.fill();
      // 轻微阴影
      ctx.fillStyle = 'rgba(0,0,0,0.08)';
      ctx.beginPath();
      ctx.roundRect(x + 2, y + h, w, 4, 2);
      ctx.fill();
    });

    // 末端执行器当前位置
    const ee = episode.ee_traj[Math.min(step, episode.ee_traj.length - 1)];
    const ex = ee.x * W * 0.9 + W * 0.05;
    const ey = (1 - ee.z) * H * 0.7 + H * 0.05;
    // 机械臂线条
    ctx.strokeStyle = episode.robotColor;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(W * 0.75, H * 0.1);
    ctx.quadraticCurveTo(W * 0.7, H * 0.3, ex, ey);
    ctx.stroke();
    // 末端圆点
    ctx.fillStyle = episode.robotColor;
    ctx.beginPath();
    ctx.arc(ex, ey, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(ex, ey, 3, 0, Math.PI * 2);
    ctx.fill();

    // 轨迹历史（淡色）
    if (step > 0) {
      ctx.strokeStyle = episode.robotColor + '55';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      for (let t = Math.max(0, step - 12); t <= step; t++) {
        const p = episode.ee_traj[t];
        const px = p.x * W * 0.9 + W * 0.05;
        const py = (1 - p.z) * H * 0.7 + H * 0.05;
        t === Math.max(0, step - 12) ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Step 标注
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(4, 4, 60, 18);
    ctx.fillStyle = '#fff';
    ctx.font = '10px monospace';
    ctx.fillText(`step ${step.toString().padStart(3, '0')}`, 8, 16);

    // 任务标注
    ctx.fillStyle = episode.taskColor + 'cc';
    ctx.fillRect(W - 70, 4, 66, 18);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 9px sans-serif';
    ctx.fillText(episode.task.slice(0, 9), W - 67, 16);
  }, [episode, step]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="rounded-xl w-full"
      style={{ imageRendering: 'pixelated' }}
    />
  );
}

// ─── Canvas：模拟深度图（热力图） ─────────────────────────────
function DepthFrameCanvas({ episode, step, width = 224, height = 168 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const imageData = ctx.createImageData(W, H);
    const data = imageData.data;

    const ee = episode.ee_traj[Math.min(step, episode.ee_traj.length - 1)];

    for (let py = 0; py < H; py++) {
      for (let px = 0; px < W; px++) {
        const nx = px / W, ny = py / H;
        // 模拟深度：桌面约 0.8m，目标物约 0.5m，背景 1.5m
        let depth = 1.5;
        // 桌面区域
        if (ny > 0.5) depth = 0.75 + (ny - 0.5) * 0.3;
        // 目标物
        const obj = episode.scene_objects[1];
        const dx = nx - (obj.x + obj.w / 2), dy = ny - (obj.y + obj.h / 2);
        if (Math.abs(dx) < obj.w * 0.6 && Math.abs(dy) < obj.h * 0.6) depth = 0.45;
        // 末端执行器
        const ex = ee.x * 0.9 + 0.05, ez = 1 - ee.z * 0.7 + 0.05;
        const edx = nx - ex, edy = ny - ez;
        if (edx * edx + edy * edy < 0.003) depth = 0.3;

        // 深度 → 颜色（Turbo colormap 近似）
        const t = Math.max(0, Math.min(1, 1 - depth / 1.8));
        const idx = (py * W + px) * 4;
        // 简化 Turbo：蓝→青→绿→黄→红
        if (t < 0.25) {
          data[idx] = 0; data[idx + 1] = Math.round(t * 4 * 200); data[idx + 2] = 255;
        } else if (t < 0.5) {
          data[idx] = 0; data[idx + 1] = 200; data[idx + 2] = Math.round((1 - (t - 0.25) * 4) * 255);
        } else if (t < 0.75) {
          data[idx] = Math.round((t - 0.5) * 4 * 255); data[idx + 1] = 200; data[idx + 2] = 0;
        } else {
          data[idx] = 255; data[idx + 1] = Math.round((1 - (t - 0.75) * 4) * 200); data[idx + 2] = 0;
        }
        data[idx + 3] = 255;
      }
    }
    ctx.putImageData(imageData, 0, 0);

    // 颜色条标注
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(4, 4, 60, 18);
    ctx.fillStyle = '#fff';
    ctx.font = '10px monospace';
    ctx.fillText('Depth', 8, 16);
  }, [episode, step]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="rounded-xl w-full"
    />
  );
}

// ─── RGB 通道直方图 ────────────────────────────────────────────
function RGBHistogram({ episode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4">
      <h4 className="text-xs font-semibold text-gray-600 mb-3">RGB 像素分布直方图</h4>
      <ResponsiveContainer width="100%" height={140}>
        <AreaChart data={episode.rgb_hist} margin={{ top: 2, right: 4, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
          <XAxis dataKey="bin" tick={{ fontSize: 9 }} tickFormatter={(v) => v} />
          <YAxis tick={{ fontSize: 9 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
          <Tooltip formatter={(v) => v.toLocaleString()} labelFormatter={(l) => `像素值 ${l}`} />
          <Area type="monotone" dataKey="R" stroke="#e74c3c" fill="#e74c3c" fillOpacity={0.3} strokeWidth={1.5} />
          <Area type="monotone" dataKey="G" stroke="#27ae60" fill="#27ae60" fillOpacity={0.3} strokeWidth={1.5} />
          <Area type="monotone" dataKey="B" stroke="#2980b9" fill="#2980b9" fillOpacity={0.3} strokeWidth={1.5} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── 深度分布直方图 ────────────────────────────────────────────
function DepthHistogram({ episode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4">
      <h4 className="text-xs font-semibold text-gray-600 mb-3">深度距离分布（m）</h4>
      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={episode.depth_hist} barSize={8} margin={{ top: 2, right: 4, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
          <XAxis dataKey="dist" tick={{ fontSize: 9 }} tickFormatter={(v) => `${v}m`} />
          <YAxis tick={{ fontSize: 9 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
          <Tooltip formatter={(v) => v.toLocaleString()} labelFormatter={(l) => `距离 ${l}m`} />
          <Bar dataKey="count" radius={[3, 3, 0, 0]}>
            {episode.depth_hist.map((d, i) => (
              <Cell key={i} fill={`hsl(${200 + i * 5}, 70%, ${40 + i * 2}%)`} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── 动作序列时序图 ────────────────────────────────────────────
function ActionTimeline({ episode, currentStep, onStepChange }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-semibold text-gray-600">动作范数 & 奖励时序</h4>
        <span className="text-[10px] text-gray-400 font-mono">step {currentStep}/{episode.total_steps - 1}</span>
      </div>
      <ResponsiveContainer width="100%" height={130}>
        <LineChart
          data={episode.action_norms}
          margin={{ top: 2, right: 4, bottom: 0, left: -20 }}
          onClick={(e) => e?.activeLabel !== undefined && onStepChange(Number(e.activeLabel))}
          style={{ cursor: 'crosshair' }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
          <XAxis dataKey="t" tick={{ fontSize: 9 }} />
          <YAxis tick={{ fontSize: 9 }} domain={[0, 1.2]} />
          <Tooltip
            formatter={(v, n) => [v.toFixed(3), n === 'norm' ? '动作范数' : n === 'reward' ? '奖励' : '夹爪']}
            labelFormatter={(l) => `step ${l}`}
          />
          <Line type="monotone" dataKey="norm" name="norm" stroke="#6c5ce7" strokeWidth={1.5} dot={false} />
          <Line type="monotone" dataKey="reward" name="reward" stroke="#00cec9" strokeWidth={1.5} dot={false} />
          <Line type="step" dataKey="gripper" name="gripper" stroke="#fdcb6e" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
          {/* 当前步骤参考线 */}
          <Line
            data={[{ t: currentStep, v: 0 }, { t: currentStep, v: 1.2 }]}
            dataKey="v"
            stroke="#fd79a8"
            strokeWidth={1}
            dot={false}
            strokeDasharray="3 2"
          />
        </LineChart>
      </ResponsiveContainer>
      {/* 步骤滑块 */}
      <input
        type="range"
        min={0}
        max={episode.total_steps - 1}
        value={currentStep}
        onChange={(e) => onStepChange(Number(e.target.value))}
        className="w-full mt-2 accent-[#6c5ce7]"
        style={{ height: 4 }}
      />
    </div>
  );
}

// ─── 末端执行器 3D 轨迹（XZ 投影） ────────────────────────────
function EETrajChart({ episode, currentStep }) {
  const data = episode.ee_traj.map((p, i) => ({
    ...p,
    isCurrent: i === currentStep,
  }));
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4">
      <h4 className="text-xs font-semibold text-gray-600 mb-3">末端执行器轨迹（X-Z 平面）</h4>
      <ResponsiveContainer width="100%" height={140}>
        <LineChart data={data} margin={{ top: 2, right: 4, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
          <XAxis dataKey="x" type="number" domain={['auto', 'auto']} tick={{ fontSize: 9 }} tickFormatter={(v) => v.toFixed(2)} name="X" />
          <YAxis dataKey="z" domain={['auto', 'auto']} tick={{ fontSize: 9 }} tickFormatter={(v) => v.toFixed(2)} />
          <Tooltip formatter={(v) => v.toFixed(3)} labelFormatter={(l) => `X=${Number(l).toFixed(3)}`} />
          <Line type="monotone" dataKey="z" stroke={episode.robotColor} strokeWidth={2} dot={false} name="Z" />
          <Line type="monotone" dataKey="y" stroke={episode.taskColor} strokeWidth={1.5} dot={false} strokeDasharray="4 2" name="Y" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── 语言指令 Token 注意力可视化 ──────────────────────────────
function TokenAttnViz({ episode }) {
  const maxAttn = Math.max(...episode.tokens.map(t => t.attn));
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4">
      <h4 className="text-xs font-semibold text-gray-600 mb-3">语言指令 Token 注意力权重</h4>
      <div className="flex flex-wrap gap-1.5">
        {episode.tokens.map((tok) => {
          const intensity = tok.attn / maxAttn;
          return (
            <div
              key={tok.id}
              className="flex flex-col items-center gap-0.5"
              title={`attn: ${tok.attn}`}
            >
              <div
                className="px-2 py-1 rounded-lg text-xs font-mono font-semibold transition-all"
                style={{
                  background: `rgba(108, 92, 231, ${0.1 + intensity * 0.75})`,
                  color: intensity > 0.5 ? '#fff' : '#6c5ce7',
                  border: `1px solid rgba(108, 92, 231, ${0.2 + intensity * 0.5})`,
                  transform: `scale(${0.9 + intensity * 0.15})`,
                }}
              >
                {tok.token}
              </div>
              <div className="text-[8px] text-gray-400 font-mono">{tok.attn.toFixed(2)}</div>
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex items-center gap-2 text-[10px] text-gray-400">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded" style={{ background: 'rgba(108,92,231,0.15)' }} />
          <span>低注意力</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded" style={{ background: 'rgba(108,92,231,0.85)' }} />
          <span>高注意力</span>
        </div>
      </div>
    </div>
  );
}

// ─── 关节角时序（选定关节） ────────────────────────────────────
function JointTimeline({ episode, currentStep }) {
  const data = Array.from({ length: episode.total_steps }, (_, t) => {
    const obj = { t };
    episode.joints.forEach((jArr, ji) => { obj[`J${ji + 1}`] = jArr[t]; });
    return obj;
  });
  const COLORS = ['#6c5ce7', '#a29bfe', '#74b9ff', '#00cec9', '#fd79a8', '#fdcb6e', '#55efc4'];
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4">
      <h4 className="text-xs font-semibold text-gray-600 mb-3">7-DOF 关节角时序（rad）</h4>
      <ResponsiveContainer width="100%" height={150}>
        <LineChart data={data} margin={{ top: 2, right: 4, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
          <XAxis dataKey="t" tick={{ fontSize: 9 }} />
          <YAxis tick={{ fontSize: 9 }} domain={[-Math.PI, Math.PI]} tickFormatter={(v) => v.toFixed(1)} />
          <Tooltip formatter={(v) => v.toFixed(3)} labelFormatter={(l) => `step ${l}`} />
          <Legend wrapperStyle={{ fontSize: 10 }} />
          {Array.from({ length: 7 }, (_, ji) => (
            <Line
              key={ji}
              type="monotone"
              dataKey={`J${ji + 1}`}
              stroke={COLORS[ji]}
              strokeWidth={1.2}
              dot={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Episode 选择器 ────────────────────────────────────────────
function EpisodeSelector({ episodes, selected, onSelect }) {
  return (
    <div className="flex flex-wrap gap-2 mb-5">
      {episodes.map((ep) => (
        <button
          key={ep.id}
          onClick={() => onSelect(ep.id)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all"
          style={
            selected === ep.id
              ? { background: ep.taskColor, borderColor: ep.taskColor, color: '#fff', boxShadow: `0 2px 8px ${ep.taskColor}55` }
              : { background: '#f8f9fa', borderColor: '#e2e8f0', color: '#718096' }
          }
        >
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: selected === ep.id ? '#fff' : ep.taskColor }}
          />
          <span>EP{ep.id.toString().padStart(2, '0')}</span>
          <span className="opacity-70">{ep.task.split(' ')[0]}</span>
          <span>{ep.success ? '✓' : '✗'}</span>
        </button>
      ))}
    </div>
  );
}

// ─── 主组件 ────────────────────────────────────────────────────
export default function VlaInputViz() {
  const [selectedEp, setSelectedEp] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);

  const episode = SAMPLED_EPISODES[selectedEp];

  // 自动播放
  useEffect(() => {
    if (!autoPlay) return;
    const timer = setInterval(() => {
      setCurrentStep((s) => {
        if (s >= episode.total_steps - 1) { setAutoPlay(false); return s; }
        return s + 1;
      });
    }, 120);
    return () => clearInterval(timer);
  }, [autoPlay, episode.total_steps]);

  // 切换 episode 时重置步骤
  const handleSelectEp = useCallback((id) => {
    setSelectedEp(id);
    setCurrentStep(0);
    setAutoPlay(false);
  }, []);

  return (
    <div>
      {/* 标题 */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-700">输入数据抽样可视化</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            从 {SAMPLED_EPISODES.length} 个抽样 Episode 中选择，逐帧查看 RGB / Depth / 传感器数据
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentStep(0)}
            className="text-xs px-2.5 py-1 rounded-lg border border-gray-200 text-gray-500 hover:border-[#6c5ce7] hover:text-[#6c5ce7] transition-all"
          >
            ⏮ 重置
          </button>
          <button
            onClick={() => setAutoPlay(!autoPlay)}
            className="text-xs px-3 py-1 rounded-lg border transition-all font-medium"
            style={autoPlay
              ? { background: '#fd79a8', borderColor: '#fd79a8', color: '#fff' }
              : { background: '#6c5ce7', borderColor: '#6c5ce7', color: '#fff' }
            }
          >
            {autoPlay ? '⏸ 暂停' : '▶ 播放'}
          </button>
        </div>
      </div>

      {/* Episode 选择器 */}
      <EpisodeSelector
        episodes={SAMPLED_EPISODES}
        selected={selectedEp}
        onSelect={handleSelectEp}
      />

      {/* Episode 信息条 */}
      <div
        className="flex flex-wrap items-center gap-3 px-4 py-2.5 rounded-xl mb-4 text-xs"
        style={{ background: episode.taskColor + '12', border: `1px solid ${episode.taskColor}33` }}
      >
        <span className="font-semibold" style={{ color: episode.taskColor }}>EP{episode.id.toString().padStart(2, '0')}</span>
        <span className="text-gray-600">任务：<b>{episode.task}</b></span>
        <span className="text-gray-600">机器人：<b>{episode.robot}</b></span>
        <span className="text-gray-600">步数：<b>{episode.total_steps}</b></span>
        <span
          className="ml-auto px-2 py-0.5 rounded-full font-medium"
          style={{ background: episode.success ? '#00b89422' : '#fd79a822', color: episode.success ? '#00b894' : '#e17055' }}
        >
          {episode.success ? '✓ 成功' : '✗ 失败'}
        </span>
      </div>

      {/* 主视图：RGB + Depth + 直方图 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* RGB 帧 */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-semibold text-gray-600">RGB 观测帧（模拟渲染）</h4>
            <span className="text-[10px] font-mono text-gray-400">224×168 · step {currentStep}</span>
          </div>
          <RGBFrameCanvas episode={episode} step={currentStep} />
          <div className="mt-2 flex items-center gap-3 text-[10px] text-gray-400">
            <span>● 末端执行器</span>
            <span>— 历史轨迹</span>
            <span className="ml-auto" style={{ color: episode.taskColor }}>■ {episode.task}</span>
          </div>
        </div>

        {/* Depth 帧 */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-semibold text-gray-600">深度图（Turbo 色彩映射）</h4>
            <span className="text-[10px] font-mono text-gray-400">蓝=近 → 红=远</span>
          </div>
          <DepthFrameCanvas episode={episode} step={currentStep} />
          <div className="mt-2 flex items-center gap-1 text-[10px] text-gray-400">
            <div className="flex-1 h-2 rounded-full" style={{ background: 'linear-gradient(to right, #0000ff, #00ffff, #00ff00, #ffff00, #ff0000)' }} />
            <span className="ml-2">0m → 1.8m</span>
          </div>
        </div>
      </div>

      {/* 像素分布 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <RGBHistogram episode={episode} />
        <DepthHistogram episode={episode} />
      </div>

      {/* 动作时序 + 末端轨迹 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <ActionTimeline episode={episode} currentStep={currentStep} onStepChange={setCurrentStep} />
        <EETrajChart episode={episode} currentStep={currentStep} />
      </div>

      {/* 关节角时序 */}
      <div className="mb-4">
        <JointTimeline episode={episode} currentStep={currentStep} />
      </div>

      {/* 语言 Token */}
      <TokenAttnViz episode={episode} />
    </div>
  );
}
