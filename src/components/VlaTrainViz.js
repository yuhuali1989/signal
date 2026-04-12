'use client';

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, BarChart, Bar, Cell,
  ReferenceLine, ReferenceArea, ScatterChart, Scatter, ZAxis,
} from 'recharts';
import {
  TRAIN_CURVE, EVAL_RESULTS, IMAGINATION_TRAJ, IMAGINATION_MULTI,
  TRAIN_CONFIG, TRAIN_STAGES, SOTA_COMPARISON, LOSS_DEFINITIONS,
} from '@/lib/vla-data';
import { useState } from 'react';

// ─── 阶段背景色 ────────────────────────────────────────────────
const STAGE_COLORS = { 1: '#6c5ce7', 2: '#00cec9', 3: '#fd79a8' };
const STAGE_BG = { 1: '#6c5ce722', 2: '#00cec922', 3: '#fd79a822' };

// ─── 自定义 Tooltip ────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const stage = payload[0]?.payload?.stage;
  return (
    <div className="bg-[#1a1f2e] border border-[#2a3040] rounded-xl shadow-lg p-3 text-xs">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-[#4a5568]">Step {label}k</span>
        {stage && <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold" style={{ background: STAGE_BG[stage], color: STAGE_COLORS[stage] }}>Stage {stage}</span>}
      </div>
      {payload.filter(p => p.value !== null).map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
          <span className="text-[#8892a4]">{p.name}:</span>
          <span className="font-mono font-semibold" style={{ color: p.color }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
}

// ─── 三阶段概览卡片 ────────────────────────────────────────────
function StageOverview() {
  const [selected, setSelected] = useState('stage2');
  const stage = TRAIN_STAGES.find(s => s.id === selected);

  return (
    <div className="bg-[#0a0d14] rounded-2xl border border-[#1e2130] p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">🗺️</span>
        <div>
          <h3 className="text-sm font-bold text-[#e2e8f0]">DriveWorld-VLA 三阶段训练链路</h3>
          <p className="text-[10px] text-[#4a5568]">Stage1: 视觉预训练 → Stage2: VLA联合训练 → Stage3: 世界模型RL微调</p>
        </div>
      </div>

      {/* 阶段选择 */}
      <div className="flex gap-2 mb-4">
        {TRAIN_STAGES.map(s => (
          <button key={s.id} onClick={() => setSelected(s.id)}
            className="flex-1 py-2 px-3 rounded-xl border text-xs font-medium transition-all"
            style={selected === s.id
              ? { background: s.color, borderColor: s.color, color: '#fff', boxShadow: `0 2px 12px ${s.color}44` }
              : { background: '#0f1117', borderColor: '#1e2130', color: '#718096' }}>
            <div className="text-base mb-0.5">{s.icon}</div>
            <div className="text-[10px] leading-tight">{s.name.split(':')[0]}</div>
          </button>
        ))}
      </div>

      {stage && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-[#080b12] border" style={{ borderColor: stage.color + '44' }}>
              <p className="text-[10px] text-[#4a5568] mb-1">📋 阶段描述</p>
              <p className="text-[11px] text-[#a0aec0] leading-relaxed">{stage.desc}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                ['训练步数', stage.steps],
                ['学习率', stage.lr],
                ['Batch Size', stage.batch],
                ['GPU', stage.gpus],
              ].map(([k, v]) => (
                <div key={k} className="p-2.5 rounded-xl bg-[#080b12] border border-[#1e2130]">
                  <p className="text-[9px] text-[#4a5568] mb-0.5">{k}</p>
                  <p className="text-[11px] font-mono font-bold" style={{ color: stage.color }}>{v}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-[#080b12] border border-[#1e2130]">
              <p className="text-[10px] text-[#4a5568] mb-2">🔒 冻结模块</p>
              <div className="flex flex-wrap gap-1">
                {stage.frozen.length > 0 ? stage.frozen.map(m => (
                  <span key={m} className="text-[9px] px-2 py-0.5 rounded-full bg-[#1a1f2e] text-[#4a5568] border border-[#2a3040] font-mono">{m}</span>
                )) : <span className="text-[10px] text-[#55efc4]">全部解冻（端到端训练）</span>}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-[#080b12] border border-[#1e2130]">
              <p className="text-[10px] text-[#4a5568] mb-1">📐 损失函数</p>
              <p className="text-[10px] font-mono text-[#a29bfe]">{stage.loss}</p>
            </div>
            <div className="p-3 rounded-xl bg-[#080b12] border border-[#1e2130]">
              <p className="text-[10px] text-[#4a5568] mb-1">📊 关键指标</p>
              <p className="text-[11px] font-mono" style={{ color: stage.color }}>{stage.key_metric}</p>
            </div>
            <div className="p-3 rounded-xl bg-[#080b12] border border-[#1e2130]">
              <p className="text-[10px] text-[#4a5568] mb-1">🗄️ 训练数据</p>
              <p className="text-[10px] text-[#a0aec0]">{stage.data}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── 损失函数定义 ──────────────────────────────────────────────
function LossDefinitions() {
  const [selected, setSelected] = useState('L_plan');
  const loss = LOSS_DEFINITIONS.find(l => l.id === selected);
  return (
    <div className="bg-[#0a0d14] rounded-2xl border border-[#1e2130] p-5">
      <h3 className="text-sm font-bold text-[#e2e8f0] mb-1">📐 损失函数定义</h3>
      <p className="text-[10px] text-[#4a5568] mb-4">DriveWorld-VLA 联合优化目标：L = λ₁·L_plan + λ₂·L_wm + λ₃·L_occ + α·R_wm</p>
      <div className="flex gap-2 mb-4 flex-wrap">
        {LOSS_DEFINITIONS.map(l => (
          <button key={l.id} onClick={() => setSelected(l.id)}
            className="px-3 py-1.5 rounded-xl border text-[11px] font-mono font-bold transition-all"
            style={selected === l.id
              ? { background: l.color, borderColor: l.color, color: '#fff' }
              : { background: '#0f1117', borderColor: '#1e2130', color: '#718096' }}>
            {l.id}
          </button>
        ))}
      </div>
      {loss && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-[#080b12] border" style={{ borderColor: loss.color + '44' }}>
              <p className="text-[10px] text-[#4a5568] mb-1">公式</p>
              <p className="text-[11px] font-mono" style={{ color: loss.color }}>{loss.formula}</p>
            </div>
            <div className="p-3 rounded-xl bg-[#080b12] border border-[#1e2130]">
              <p className="text-[10px] text-[#4a5568] mb-1">说明</p>
              <p className="text-[11px] text-[#a0aec0] leading-relaxed">{loss.desc}</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-[#080b12] border border-[#1e2130]">
              <p className="text-[10px] text-[#4a5568] mb-1">权重</p>
              <p className="text-[13px] font-mono font-bold" style={{ color: loss.color }}>{loss.weight}</p>
            </div>
            <div className="p-3 rounded-xl bg-[#080b12] border border-[#1e2130]">
              <p className="text-[10px] text-[#4a5568] mb-2">生效阶段</p>
              <div className="flex gap-2">
                {[1, 2, 3].map(s => (
                  <span key={s} className="text-[10px] px-2 py-1 rounded-lg font-bold"
                    style={loss.stage.includes(s)
                      ? { background: STAGE_BG[s], color: STAGE_COLORS[s], border: `1px solid ${STAGE_COLORS[s]}44` }
                      : { background: '#1a1f2e', color: '#4a5568', border: '1px solid #2a3040' }}>
                    Stage {s}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── 三阶段损失曲线 ────────────────────────────────────────────
function StagedLossCurve() {
  return (
    <div className="bg-[#0a0d14] rounded-2xl border border-[#1e2130] p-5">
      <h3 className="text-sm font-bold text-[#e2e8f0] mb-1">📈 三阶段训练损失曲线</h3>
      <p className="text-[10px] text-[#4a5568] mb-3">Step 单位：×1000 · 阶段分界线：100k / 250k</p>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={TRAIN_CURVE} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e2130" />
          <ReferenceArea x1={0} x2={100} fill="#6c5ce711" />
          <ReferenceArea x1={100} x2={250} fill="#00cec911" />
          <ReferenceArea x1={250} x2={350} fill="#fd79a811" />
          <ReferenceLine x={100} stroke="#6c5ce7" strokeDasharray="4 3" label={{ value: 'S2', fill: '#6c5ce7', fontSize: 9 }} />
          <ReferenceLine x={250} stroke="#fd79a8" strokeDasharray="4 3" label={{ value: 'S3', fill: '#fd79a8', fontSize: 9 }} />
          <XAxis dataKey="step" tick={{ fontSize: 9, fill: '#4a5568' }} tickFormatter={v => `${v}k`} />
          <YAxis tick={{ fontSize: 9, fill: '#4a5568' }} domain={[0, 5]} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 10, color: '#8892a4' }} />
          <Line type="monotone" dataKey="vis_loss" name="视觉损失" stroke="#6c5ce7" strokeWidth={2} dot={false} connectNulls={false} />
          <Line type="monotone" dataKey="vla_loss" name="VLA损失" stroke="#00cec9" strokeWidth={2} dot={false} connectNulls={false} />
          <Line type="monotone" dataKey="wm_loss"  name="WM损失"  stroke="#fd79a8" strokeWidth={2} dot={false} strokeDasharray="5 3" connectNulls={false} />
        </LineChart>
      </ResponsiveContainer>
      <div className="flex gap-4 mt-2 text-[10px]">
        <span className="flex items-center gap-1"><span className="w-3 h-1 rounded" style={{ background: '#6c5ce7', display: 'inline-block' }} />Stage1: 视觉预训练</span>
        <span className="flex items-center gap-1"><span className="w-3 h-1 rounded" style={{ background: '#00cec9', display: 'inline-block' }} />Stage2: VLA联合</span>
        <span className="flex items-center gap-1"><span className="w-3 h-1 rounded" style={{ background: '#fd79a8', display: 'inline-block' }} />Stage3: WM-RL</span>
      </div>
    </div>
  );
}

// ─── 驾驶规划指标曲线 ──────────────────────────────────────────
function DrivingMetricsCurve() {
  return (
    <div className="bg-[#0a0d14] rounded-2xl border border-[#1e2130] p-5">
      <h3 className="text-sm font-bold text-[#e2e8f0] mb-1">🚗 驾驶规划指标</h3>
      <p className="text-[10px] text-[#4a5568] mb-3">L2 轨迹误差(m) · 碰撞率 — Stage2 起开始有效</p>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={TRAIN_CURVE.filter(d => d.l2_err !== null)} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e2130" />
          <ReferenceArea x1={100} x2={250} fill="#00cec911" />
          <ReferenceArea x1={250} x2={350} fill="#fd79a811" />
          <ReferenceLine x={250} stroke="#fd79a8" strokeDasharray="4 3" />
          <XAxis dataKey="step" tick={{ fontSize: 9, fill: '#4a5568' }} tickFormatter={v => `${v}k`} />
          <YAxis yAxisId="l2" tick={{ fontSize: 9, fill: '#4a5568' }} domain={[0, 4]} label={{ value: 'L2(m)', angle: -90, position: 'insideLeft', fontSize: 9, fill: '#4a5568' }} />
          <YAxis yAxisId="col" orientation="right" tick={{ fontSize: 9, fill: '#4a5568' }} domain={[0, 0.2]} tickFormatter={v => `${(v*100).toFixed(0)}%`} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 10, color: '#8892a4' }} />
          <ReferenceLine yAxisId="l2" y={0.35} stroke="#00cec9" strokeDasharray="4 3" label={{ value: '目标 0.35m', fontSize: 9, fill: '#00cec9' }} />
          <Line yAxisId="l2"  type="monotone" dataKey="l2_err"   name="L2误差(m)"  stroke="#6c5ce7" strokeWidth={2} dot={false} />
          <Line yAxisId="col" type="monotone" dataKey="col_rate"  name="碰撞率"     stroke="#fd79a8" strokeWidth={2} dot={false} strokeDasharray="5 3" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── FVD 曲线 ──────────────────────────────────────────────────
function FvdCurve() {
  return (
    <div className="bg-[#0a0d14] rounded-2xl border border-[#1e2130] p-5">
      <h3 className="text-sm font-bold text-[#e2e8f0] mb-1">🎬 世界模型质量 (FVD)</h3>
      <p className="text-[10px] text-[#4a5568] mb-3">Fréchet Video Distance — 未来帧预测质量，越低越好</p>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={TRAIN_CURVE.filter(d => d.fvd !== null)} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e2130" />
          <ReferenceArea x1={250} x2={350} fill="#fd79a811" />
          <XAxis dataKey="step" tick={{ fontSize: 9, fill: '#4a5568' }} tickFormatter={v => `${v}k`} />
          <YAxis tick={{ fontSize: 9, fill: '#4a5568' }} domain={[0, 450]} />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={60} stroke="#00cec9" strokeDasharray="4 3" label={{ value: '目标 FVD<60', fontSize: 9, fill: '#00cec9' }} />
          <Line type="monotone" dataKey="fvd" name="FVD" stroke="#00cec9" strokeWidth={2.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── 学习率调度 ────────────────────────────────────────────────
function LRCurve() {
  return (
    <div className="bg-[#0a0d14] rounded-2xl border border-[#1e2130] p-5">
      <h3 className="text-sm font-bold text-[#e2e8f0] mb-1">📉 学习率调度（三阶段）</h3>
      <p className="text-[10px] text-[#4a5568] mb-3">每阶段独立 Warmup + Cosine Decay</p>
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={TRAIN_CURVE} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e2130" />
          <ReferenceArea x1={0}   x2={100} fill="#6c5ce711" />
          <ReferenceArea x1={100} x2={250} fill="#00cec911" />
          <ReferenceArea x1={250} x2={350} fill="#fd79a811" />
          <XAxis dataKey="step" tick={{ fontSize: 9, fill: '#4a5568' }} tickFormatter={v => `${v}k`} />
          <YAxis tick={{ fontSize: 9, fill: '#4a5568' }} tickFormatter={v => v.toExponential(0)} />
          <Tooltip formatter={v => v.toExponential(2)} contentStyle={{ background: '#1a1f2e', border: '1px solid #2a3040', borderRadius: 8, fontSize: 11 }} />
          <Line type="monotone" dataKey="lr" name="LR" stroke="#fdcb6e" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── 任务成功率对比 ────────────────────────────────────────────
function EvalBar() {
  const [mode, setMode] = useState('grouped');
  const data = EVAL_RESULTS.map(r => ({
    ...r,
    improvement: +((r.ours - r.baseline) * 100).toFixed(1),
  }));
  return (
    <div className="bg-[#0a0d14] rounded-2xl border border-[#1e2130] p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-[#e2e8f0]">任务成功率对比</h3>
          <p className="text-[10px] text-[#4a5568] mt-0.5">Baseline vs DriveWorld-VLA vs Oracle</p>
        </div>
        <div className="flex gap-1">
          {['grouped', 'improvement'].map(m => (
            <button key={m} onClick={() => setMode(m)}
              className="text-[10px] px-2 py-0.5 rounded-full border transition-all"
              style={{ background: mode === m ? '#6c5ce7' : '#0f1117', borderColor: mode === m ? '#6c5ce7' : '#1e2130', color: mode === m ? '#fff' : '#718096' }}>
              {m === 'grouped' ? '对比' : '提升'}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        {mode === 'grouped' ? (
          <BarChart data={data} barGap={2} barCategoryGap="25%">
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2130" />
            <XAxis dataKey="task" tick={{ fontSize: 9, fill: '#8892a4' }} />
            <YAxis tick={{ fontSize: 9, fill: '#4a5568' }} domain={[0, 1]} tickFormatter={v => `${(v*100).toFixed(0)}%`} />
            <Tooltip formatter={v => `${(v*100).toFixed(1)}%`} contentStyle={{ background: '#1a1f2e', border: '1px solid #2a3040', borderRadius: 8, fontSize: 11 }} />
            <Legend wrapperStyle={{ fontSize: 10, color: '#8892a4' }} />
            <Bar dataKey="baseline" name="Baseline" fill="#2d3748" radius={[3,3,0,0]} />
            <Bar dataKey="ours"     name="DriveWorld-VLA" fill="#00cec9" radius={[3,3,0,0]} />
            <Bar dataKey="oracle"   name="Oracle"   fill="#55efc4" radius={[3,3,0,0]} />
          </BarChart>
        ) : (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2130" />
            <XAxis dataKey="task" tick={{ fontSize: 9, fill: '#8892a4' }} />
            <YAxis tick={{ fontSize: 9, fill: '#4a5568' }} tickFormatter={v => `+${v}%`} />
            <Tooltip formatter={v => `+${v}%`} contentStyle={{ background: '#1a1f2e', border: '1px solid #2a3040', borderRadius: 8, fontSize: 11 }} />
            <Bar dataKey="improvement" name="提升幅度(%)" radius={[4,4,0,0]}>
              {data.map((d, i) => <Cell key={i} fill={d.improvement > 28 ? '#00cec9' : d.improvement > 22 ? '#6c5ce7' : '#74b9ff'} />)}
            </Bar>
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

// ─── SOTA 对比 ─────────────────────────────────────────────────
function SotaComparison() {
  return (
    <div className="bg-[#0a0d14] rounded-2xl border border-[#1e2130] p-5">
      <h3 className="text-sm font-bold text-[#e2e8f0] mb-1">🏆 SOTA 模型对比</h3>
      <p className="text-[10px] text-[#4a5568] mb-4">nuPlan 开环评测 · L2↓ / 碰撞率↓ / FVD↓</p>
      <div className="space-y-2">
        {SOTA_COMPARISON.map((m, i) => {
          const isOurs = m.model === 'DriveWorld-VLA';
          return (
            <div key={m.model} className="flex items-center gap-3 p-3 rounded-xl border transition-all"
              style={isOurs
                ? { borderColor: '#00cec944', background: '#00cec911', boxShadow: '0 2px 12px #00cec922' }
                : { borderColor: '#1e2130', background: '#080b12' }}>
              <span className="text-[10px] text-[#4a5568] w-4 flex-shrink-0">{i+1}</span>
              <span className="text-[11px] font-bold w-32 flex-shrink-0" style={{ color: isOurs ? '#00cec9' : '#8892a4' }}>
                {m.model} {isOurs && '⭐'}
              </span>
              <div className="flex gap-4 flex-1 text-[10px]">
                <div className="flex items-center gap-1">
                  <span className="text-[#4a5568]">L2:</span>
                  <span className="font-mono font-bold" style={{ color: m.l2 <= 0.35 ? '#55efc4' : m.l2 <= 0.55 ? '#fdcb6e' : '#fd79a8' }}>{m.l2}m</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[#4a5568]">碰撞:</span>
                  <span className="font-mono font-bold" style={{ color: m.col <= 0.015 ? '#55efc4' : m.col <= 0.035 ? '#fdcb6e' : '#fd79a8' }}>{(m.col*100).toFixed(1)}%</span>
                </div>
                {m.fvd && (
                  <div className="flex items-center gap-1">
                    <span className="text-[#4a5568]">FVD:</span>
                    <span className="font-mono font-bold" style={{ color: m.fvd <= 60 ? '#55efc4' : m.fvd <= 120 ? '#fdcb6e' : '#fd79a8' }}>{m.fvd}</span>
                  </div>
                )}
              </div>
              <span className="text-[9px] text-[#4a5568] font-mono">{m.params}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── 世界模型多轨迹想象 ────────────────────────────────────────
function ImaginationViz() {
  const W = 500, H = 280;
  const PAD = 30;
  // 计算所有轨迹的坐标范围
  const allX = IMAGINATION_MULTI.flatMap(t => t.traj.map(p => p.x));
  const allY = IMAGINATION_MULTI.flatMap(t => t.traj.map(p => p.y));
  const xMin = Math.min(...allX) - 2, xMax = Math.max(...allX) + 2;
  const yMin = Math.min(...allY) - 2, yMax = Math.max(...allY) + 2;
  const toSvgX = x => PAD + (x - xMin) / (xMax - xMin) * (W - 2*PAD);
  const toSvgY = y => H - PAD - (y - yMin) / (yMax - yMin) * (H - 2*PAD);

  return (
    <div className="bg-[#0a0d14] rounded-2xl border border-[#1e2130] p-5">
      <h3 className="text-sm font-bold text-[#e2e8f0] mb-1">🌐 世界模型隐空间多轨迹想象</h3>
      <p className="text-[10px] text-[#4a5568] mb-3">H=20步前向想象 · 5条采样轨迹展示不确定性 · 统一隐状态Z_t驱动</p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-xl" style={{ background: '#080b12' }}>
        {/* 网格 */}
        {[0.25, 0.5, 0.75].map(t => (
          <g key={t}>
            <line x1={toSvgX(xMin + t*(xMax-xMin))} y1={PAD} x2={toSvgX(xMin + t*(xMax-xMin))} y2={H-PAD} stroke="#1e2130" strokeWidth={1} />
            <line x1={PAD} y1={toSvgY(yMin + t*(yMax-yMin))} x2={W-PAD} y2={toSvgY(yMin + t*(yMax-yMin))} stroke="#1e2130" strokeWidth={1} />
          </g>
        ))}
        {/* 各条想象轨迹 */}
        {IMAGINATION_MULTI.map(traj => {
          const d = traj.traj.map((p, i) => `${i===0?'M':'L'}${toSvgX(p.x).toFixed(1)},${toSvgY(p.y).toFixed(1)}`).join(' ');
          return (
            <g key={traj.id}>
              <path d={d} fill="none" stroke={traj.color} strokeWidth={1.5} opacity={0.6} strokeDasharray={traj.id === 0 ? 'none' : '4 2'} />
              {traj.traj.filter((_, i) => i % 4 === 0).map((p, i) => (
                <circle key={i} cx={toSvgX(p.x)} cy={toSvgY(p.y)} r={2} fill={traj.color} opacity={0.7} />
              ))}
            </g>
          );
        })}
        {/* 最优轨迹（第0条）加粗 */}
        <path d={IMAGINATION_MULTI[0].traj.map((p, i) => `${i===0?'M':'L'}${toSvgX(p.x).toFixed(1)},${toSvgY(p.y).toFixed(1)}`).join(' ')}
          fill="none" stroke="#00cec9" strokeWidth={3} opacity={0.9} />
        {/* 自车起点 */}
        <circle cx={toSvgX(0)} cy={toSvgY(0)} r={6} fill="#00cec9" />
        <text x={toSvgX(0)+8} y={toSvgY(0)+4} fontSize={9} fill="#00cec9">自车</text>
        {/* 图例 */}
        <text x={PAD} y={H-8} fontSize={9} fill="#4a5568">— 最优轨迹  - - 采样轨迹（不确定性）  ● 自车起点</text>
      </svg>
      <div className="mt-3 grid grid-cols-5 gap-1">
        {IMAGINATION_MULTI.map(t => (
          <div key={t.id} className="flex items-center gap-1 text-[9px]">
            <span className="w-3 h-1 rounded" style={{ background: t.color, display: 'inline-block' }} />
            <span className="text-[#4a5568]">轨迹{t.id+1}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 当前训练状态卡片 ──────────────────────────────────────────
function MetricCards() {
  const latest = TRAIN_CURVE[TRAIN_CURVE.length - 1];
  const stage2Data = TRAIN_CURVE.filter(d => d.vla_loss !== null);
  const latestS2 = stage2Data[stage2Data.length - 1];
  const currentStage = latest.stage;

  const metrics = [
    { label: 'VLA Loss',   value: latestS2?.vla_loss ?? '—',  delta: '↓ 规划损失',  color: '#6c5ce7' },
    { label: 'WM Loss',    value: latestS2?.wm_loss  ?? '—',  delta: '↓ 世界模型',  color: '#00cec9' },
    { label: 'L2 误差',    value: latestS2 ? `${latestS2.l2_err}m` : '—', delta: '↓ 轨迹误差', color: '#fd79a8' },
    { label: '碰撞率',     value: latestS2 ? `${(latestS2.col_rate*100).toFixed(2)}%` : '—', delta: '↓ 越低越好', color: '#fdcb6e' },
    { label: 'FVD',        value: latestS2?.fvd ?? '—',        delta: '↓ 预测质量',  color: '#a29bfe' },
    { label: '当前阶段',   value: `Stage ${currentStage}`,     delta: `${TRAIN_CONFIG.current_step.toLocaleString()} steps`, color: STAGE_COLORS[currentStage] },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
      {metrics.map(m => (
        <div key={m.label} className="bg-[#0a0d14] rounded-2xl border border-[#1e2130] p-4">
          <p className="text-[10px] text-[#4a5568] mb-1">{m.label}</p>
          <p className="text-lg font-bold font-mono" style={{ color: m.color }}>{m.value}</p>
          <p className="text-[9px] mt-1 text-[#4a5568]">{m.delta}</p>
        </div>
      ))}
    </div>
  );
}

export default function TrainViz() {
  const [view, setView] = useState('pipeline');

  return (
    <div>
      {/* 子视图切换 */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {[
          ['pipeline', '🗺️ 训练链路'],
          ['curves',   '📈 训练曲线'],
          ['eval',     '🏆 评测结果'],
          ['wm',       '🌐 世界模型'],
        ].map(([id, label]) => (
          <button key={id} onClick={() => setView(id)}
            className="px-4 py-2 rounded-xl text-xs font-medium border transition-all"
            style={view === id
              ? { background: '#00cec9', borderColor: '#00cec9', color: '#fff', boxShadow: '0 2px 12px #00cec944' }
              : { background: '#0a0d14', borderColor: '#1e2130', color: '#718096' }}>
            {label}
          </button>
        ))}
      </div>

      <MetricCards />

      {view === 'pipeline' && (
        <div className="space-y-4">
          <StageOverview />
          <LossDefinitions />
        </div>
      )}

      {view === 'curves' && (
        <div className="space-y-4">
          <StagedLossCurve />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <DrivingMetricsCurve />
            <FvdCurve />
          </div>
          <LRCurve />
        </div>
      )}

      {view === 'eval' && (
        <div className="space-y-4">
          <SotaComparison />
          <EvalBar />
        </div>
      )}

      {view === 'wm' && (
        <div className="space-y-4">
          <ImaginationViz />
          {/* 世界模型配置 */}
          <div className="bg-[#0a0d14] rounded-2xl border border-[#1e2130] p-5">
            <h3 className="text-sm font-bold text-[#e2e8f0] mb-4">🔧 世界模型配置</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                ['解码器类型', 'Diffusion Decoder (DDPM)', '#6c5ce7'],
                ['扩散步数', 'T=1000 (训练) / T=50 (推理)', '#00cec9'],
                ['想象步长', `H=${TRAIN_CONFIG.wm_horizon} 步 (10s)`, '#fd79a8'],
                ['想象批次', `${TRAIN_CONFIG.wm_imagine_batch} 条/批`, '#fdcb6e'],
                ['隐状态维度', `dim=${TRAIN_CONFIG.latent_dim}`, '#a29bfe'],
                ['时序窗口', `T=8 历史帧 (0.8s)`, '#55efc4'],
              ].map(([k, v, c]) => (
                <div key={k} className="p-3 rounded-xl bg-[#080b12] border border-[#1e2130]">
                  <p className="text-[9px] text-[#4a5568] mb-1">{k}</p>
                  <p className="text-[11px] font-mono font-bold" style={{ color: c }}>{v}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
