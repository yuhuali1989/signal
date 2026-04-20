'use client';

import { useState } from 'react';

// ════════════════════════════════════════════════════════════════
// Seed-AD 架构 & 数据可视化
// 4 子 Tab：三阶段架构图 / 对比 DriveWorld-VLA / 数据集选型 / 训练配置
// ════════════════════════════════════════════════════════════════

const SUB_TABS = [
  { id: 'arch', label: '三阶段架构图', icon: '🧠', color: '#10b981' },
  { id: 'diff', label: '对比 DriveWorld-VLA', icon: '📊', color: '#6c5ce7' },
  { id: 'data', label: '数据集选型', icon: '🗄️', color: '#00cec9' },
  { id: 'train', label: '训练配置', icon: '⚙️', color: '#f39c12' },
];

// ── 三阶段架构节点（可点击查看详情） ────────────────────────
const ARCH_NODES = {
  input: { label: '多模态输入', desc: '6 摄像头 + 5 LiDAR + 5 Radar + 车辆状态 + 导航 Token', params: '原始数据', x: 60, y: 160 },
  backbone: { label: '共享骨干', desc: 'SwinT-Ultra 12B 视觉编码 + Cross-Attn×8 多模态融合 + Temporal 8B 时序聚合 → Latent 2048D', params: '40B', x: 280, y: 160 },
  imagination: { label: '想象 Imagination', desc: '预测未来 3s BEV 占用栅格（40×40，10Hz×30 帧）+ 场景动态演化 + 目标意图推理', params: '10B', x: 520, y: 70, color: '#10b981' },
  reflection: { label: '反思 Reflection', desc: '5 维风险评分：碰撞 / 舒适 / 效率 / 合规 / 综合；触发阈值 > 0.3 进入保守模式', params: '10B', x: 520, y: 160, color: '#00cec9' },
  action: { label: '行动 Action', desc: '条件式轨迹生成：30 个路径点 (x, y, θ, v) + 置信带 + 保守模式兜底', params: '10B', x: 520, y: 250, color: '#fd79a8' },
  output: { label: '最终轨迹', desc: '10Hz × 3s = 30 个轨迹点，送入车辆控制器', params: '输出', x: 760, y: 160 },
};

const ARCH_EDGES = [
  { from: 'input', to: 'backbone' },
  { from: 'backbone', to: 'imagination' },
  { from: 'backbone', to: 'reflection' },
  { from: 'backbone', to: 'action' },
  { from: 'imagination', to: 'reflection', dashed: true, label: '场景预测' },
  { from: 'reflection', to: 'action', dashed: true, label: '风险信号' },
  { from: 'action', to: 'output' },
  { from: 'action', to: 'imagination', curve: true, dashed: true, label: '想象→反思→行动 迭代' },
];

function ArchDiagram() {
  const [selected, setSelected] = useState(null);
  const W = 880, H = 360;

  const nodePos = (id) => ARCH_NODES[id];
  const edgePath = (e) => {
    const a = nodePos(e.from), b = nodePos(e.to);
    if (e.curve) {
      // action → imagination 反向大弧
      return `M ${a.x + 60} ${a.y} Q ${a.x + 180} ${H - 30}, ${b.x + 30} ${b.y + 20}`;
    }
    return `M ${a.x + 60} ${a.y} L ${b.x - 60} ${b.y}`;
  };

  return (
    <div>
      <div className="mb-3 text-xs text-gray-500">
        🌱 <span className="font-semibold text-emerald-700">Seed-AD 70B</span> 三阶段推理架构：
        <span className="text-gray-700">想象 (Imagination)</span> →
        <span className="text-cyan-700"> 反思 (Reflection)</span> →
        <span className="text-pink-600"> 行动 (Action)</span>
        <span className="ml-2 text-gray-400">点击节点查看详情</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ background: '#0a0d14', borderRadius: 12, border: '1px solid #1e2130' }}>
        {/* 边 */}
        {ARCH_EDGES.map((e, i) => (
          <g key={i}>
            <path d={edgePath(e)} fill="none"
              stroke={e.dashed ? '#10b98166' : '#10b981'} strokeWidth="1.5"
              strokeDasharray={e.dashed ? '4,4' : ''}
              markerEnd="url(#arrow)" />
            {e.label && (() => {
              const a = nodePos(e.from), b = nodePos(e.to);
              const mx = (a.x + b.x) / 2 + 60, my = (a.y + b.y) / 2 - 6;
              return (
                <text x={mx} y={my} fontSize="8" fill="#94a3b8" fontFamily="monospace" textAnchor="middle">
                  {e.label}
                </text>
              );
            })()}
          </g>
        ))}
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#10b981" />
          </marker>
        </defs>
        {/* 节点 */}
        {Object.entries(ARCH_NODES).map(([id, n]) => {
          const color = n.color || '#10b981';
          const isSel = selected === id;
          return (
            <g key={id} style={{ cursor: 'pointer' }} onClick={() => setSelected(selected === id ? null : id)}>
              <rect x={n.x - 60} y={n.y - 22} width="120" height="44" rx="8"
                fill={isSel ? color + '44' : color + '1a'}
                stroke={color}
                strokeWidth={isSel ? 2 : 1} />
              <text x={n.x} y={n.y - 4} fontSize="11" fill="#fff" fontFamily="system-ui" fontWeight="600" textAnchor="middle">
                {n.label}
              </text>
              <text x={n.x} y={n.y + 10} fontSize="9" fill={color} fontFamily="monospace" textAnchor="middle">
                {n.params}
              </text>
            </g>
          );
        })}
      </svg>

      {/* 节点详情 */}
      {selected && (
        <div className="mt-3 p-4 rounded-xl border bg-emerald-50/40 border-emerald-100">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-gray-800">{ARCH_NODES[selected].label}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-mono">
              {ARCH_NODES[selected].params}
            </span>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">{ARCH_NODES[selected].desc}</p>
        </div>
      )}

      {/* 三阶段循环说明 */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { k: 'imagination', icon: '🔮', title: '想象', desc: '预测未来 3s 场景（BEV 占用栅格）', color: '#10b981' },
          { k: 'reflection', icon: '🪞', title: '反思', desc: '评估规划风险（5 维雷达）', color: '#00cec9' },
          { k: 'action', icon: '🎯', title: '行动', desc: '生成最终轨迹（或触发保守模式）', color: '#fd79a8' },
        ].map((s, i) => (
          <div key={s.k} className="p-3 rounded-xl border" style={{ borderColor: s.color + '33', background: s.color + '08' }}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{s.icon}</span>
              <span className="text-xs font-semibold" style={{ color: s.color }}>STEP {i + 1} · {s.title}</span>
            </div>
            <p className="text-xs text-gray-600">{s.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 对比 DriveWorld-VLA ───────────────────────────────────────
function DiffWithDriveWorld() {
  const rows = [
    { k: '参数量', dw: 'InternLM2-7B 主干', sa: '70B 云端 / 13B 车端蒸馏', win: 'sa' },
    { k: '架构范式', dw: '两阶段（Unified Latent Z_t）', sa: '三阶段（想象→反思→行动）', win: 'sa' },
    { k: '规划头', dw: 'AR VLA Head', sa: 'Action Head 条件式轨迹生成', win: 'tie' },
    { k: '世界模型', dw: 'Diffusion WM', sa: 'Imagination Head（物理约束）', win: 'sa' },
    { k: 'nuScenes L2 (3s)', dw: '0.42m', sa: '0.54m（原论文口径统一）', win: 'tie', note: '评测口径不同，Seed-AD 在更严格协议下仍为 SOTA' },
    { k: 'nuScenes 碰撞率', dw: '1.2%', sa: '0.11%', win: 'sa' },
    { k: '车端推理', dw: '未公开', sa: 'Orin X 45ms (INT4 + 蒸馏)', win: 'sa' },
    { k: '合成数据工具链', dw: '无专属', sa: 'UniSim 2.0 扩展（32 种天气/光照）', win: 'sa' },
    { k: '开源程度', dw: '部分（推理 + 权重）', sa: '完整（训练管线 + 工具链）', win: 'sa' },
    { k: 'FVD (未来场景)', dw: '52', sa: '47', win: 'sa' },
  ];
  return (
    <div>
      <div className="mb-3 text-xs text-gray-500">
        🥊 与现有 <span className="font-semibold text-purple-700">DriveWorld-VLA</span> 对照，
        <span className="text-emerald-700 font-semibold">Seed-AD</span> 在 10 项关键维度中 8 项占优。
      </div>
      <div className="rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-gray-50">
            <tr className="text-left">
              <th className="px-3 py-2 font-semibold text-gray-600">维度</th>
              <th className="px-3 py-2 font-semibold text-purple-700">DriveWorld-VLA</th>
              <th className="px-3 py-2 font-semibold text-emerald-700">Seed-AD</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className={`border-t border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                <td className="px-3 py-2 text-gray-700 font-medium">{r.k}</td>
                <td className="px-3 py-2 text-gray-500 font-mono">{r.dw}</td>
                <td className={`px-3 py-2 font-mono ${r.win === 'sa' ? 'text-emerald-700 font-semibold' : 'text-gray-600'}`}>
                  {r.sa}
                  {r.win === 'sa' && <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">SOTA</span>}
                  {r.note && <div className="text-[10px] text-gray-400 mt-0.5">{r.note}</div>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 指标雷达对比 */}
      <div className="mt-6 p-4 rounded-xl border border-gray-100 bg-white">
        <div className="text-xs font-semibold text-gray-700 mb-3">核心指标雷达对比</div>
        <DualRadar />
      </div>
    </div>
  );
}

function DualRadar() {
  const W = 340, H = 280, CX = W / 2, CY = H / 2 + 10, R = 90;
  const axes = ['L2 精度', '碰撞安全', '推理速度', '开源完整', '合成数据', 'FVD 预测'];
  // 归一化分数（越大越好）
  const dw =  [0.78, 0.40, 0.35, 0.55, 0.20, 0.85];
  const sa =  [0.72, 0.95, 0.92, 0.95, 0.92, 0.95];
  const pt = (i, v) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / axes.length;
    return { x: CX + R * v * Math.cos(a), y: CY + R * v * Math.sin(a) };
  };
  const polyPts = (arr) => arr.map((v, i) => {
    const p = pt(i, v);
    return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
  }).join(' ');

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: 480, background: '#0a0d14', borderRadius: 8 }}>
      {/* 网格 */}
      {[0.25, 0.5, 0.75, 1.0].map(r => (
        <polygon key={r} points={polyPts(axes.map(() => r))} fill="none" stroke="#1e2130" strokeWidth="0.8" />
      ))}
      {/* 轴 */}
      {axes.map((_, i) => {
        const p = pt(i, 1);
        return <line key={i} x1={CX} y1={CY} x2={p.x} y2={p.y} stroke="#1e2130" strokeWidth="0.6" />;
      })}
      {/* DriveWorld */}
      <polygon points={polyPts(dw)} fill="#6c5ce733" stroke="#6c5ce7" strokeWidth="1.5" />
      {/* Seed-AD */}
      <polygon points={polyPts(sa)} fill="#10b98133" stroke="#10b981" strokeWidth="1.8" />
      {/* 轴标签 */}
      {axes.map((label, i) => {
        const p = pt(i, 1.18);
        return <text key={i} x={p.x} y={p.y} fontSize="10" fill="#94a3b8" fontFamily="system-ui" textAnchor="middle" dominantBaseline="middle">{label}</text>;
      })}
      {/* 图例 */}
      <g transform="translate(10, 260)">
        <rect x="0" y="-8" width="12" height="10" fill="#6c5ce733" stroke="#6c5ce7" />
        <text x="18" y="0" fontSize="10" fill="#cbd5e1" fontFamily="system-ui">DriveWorld-VLA</text>
        <rect x="130" y="-8" width="12" height="10" fill="#10b98133" stroke="#10b981" />
        <text x="148" y="0" fontSize="10" fill="#cbd5e1" fontFamily="system-ui">Seed-AD</text>
      </g>
    </svg>
  );
}

// ── 数据集选型 ─────────────────────────────────────────────
function DatasetSelection() {
  const datasets = [
    { name: 'nuScenes', role: '主训练集', scale: '1000 场景 · 1.4M 图像 · 390k LiDAR', features: ['6 路环视', '32 线 LiDAR', 'HD Map', 'L2/碰撞 评测'], color: '#10b981', primary: true },
    { name: 'OpenDV-2K', role: '视觉预训练', scale: '2000 小时 · 60M 图像', features: ['YouTube 驾驶视频', '多地域多天气', '无标注仅视觉'], color: '#00cec9' },
    { name: 'DriveLM', role: '语言标注', scale: 'nuScenes 子集 · 460K 问答对', features: ['场景描述', '因果推理', 'VLM 指令微调'], color: '#6c5ce7' },
    { name: 'UniSim 2.0', role: '合成数据', scale: '无限生成 · 32 种天气×光照组合', features: ['物理引擎渲染', '长尾场景覆盖', '行人/切入/施工'], color: '#f39c12', seedAd: true },
    { name: 'nuPlan', role: '闭环评估', scale: '1300 小时驾驶数据', features: ['闭环仿真', 'PDMS 指标', '规则检查'], color: '#fd79a8' },
    { name: 'Waymo Open', role: '补充数据', scale: '2000 场景 · 20s 片段', features: ['5 路摄像头', '5 路 LiDAR', '3D 跟踪'], color: '#8b95a5' },
  ];
  return (
    <div>
      <div className="mb-3 text-xs text-gray-500">
        🗄️ <span className="font-semibold text-emerald-700">Seed-AD</span> 采用 5+1 数据组合：
        5 个真实数据集覆盖训练/预训练/语言/评估 +
        <span className="text-orange-600 font-semibold"> UniSim 2.0 合成数据工具链</span>（专属创新）。
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {datasets.map(d => (
          <div key={d.name}
            className="p-4 rounded-2xl border bg-white relative"
            style={{ borderColor: d.color + '33' }}>
            {d.seedAd && (
              <span className="absolute top-3 right-3 text-[9px] px-1.5 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-100 font-semibold">
                Seed-AD 专属
              </span>
            )}
            {d.primary && (
              <span className="absolute top-3 right-3 text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 font-semibold">
                主数据集
              </span>
            )}
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-gray-800">{d.name}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md font-medium"
                style={{ background: d.color + '18', color: d.color }}>{d.role}</span>
            </div>
            <div className="text-[11px] text-gray-500 font-mono mb-2">{d.scale}</div>
            <div className="flex flex-wrap gap-1">
              {d.features.map(f => (
                <span key={f} className="text-[10px] px-1.5 py-0.5 rounded-md bg-gray-50 text-gray-500 border border-gray-100">
                  {f}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 数据配比 */}
      <div className="mt-5 p-4 rounded-2xl bg-gray-50 border border-gray-100">
        <div className="text-xs font-semibold text-gray-700 mb-3">训练数据混合配比</div>
        <div className="space-y-2">
          {[
            { name: 'nuScenes (主)', pct: 30, color: '#10b981' },
            { name: 'UniSim 2.0 合成', pct: 28, color: '#f39c12' },
            { name: 'OpenDV-2K', pct: 22, color: '#00cec9' },
            { name: 'DriveLM 语言', pct: 10, color: '#6c5ce7' },
            { name: 'Waymo Open', pct: 6, color: '#8b95a5' },
            { name: 'nuPlan (闭环)', pct: 4, color: '#fd79a8' },
          ].map(b => (
            <div key={b.name} className="flex items-center gap-3 text-xs">
              <div className="w-28 text-gray-600">{b.name}</div>
              <div className="flex-1 h-6 bg-white rounded-lg border border-gray-100 overflow-hidden">
                <div className="h-full rounded-lg transition-all"
                  style={{ width: `${b.pct * 2.5}%`, background: b.color }} />
              </div>
              <div className="w-10 text-right font-mono text-gray-500">{b.pct}%</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── 训练配置 ───────────────────────────────────────────────
function TrainConfig() {
  const stages = [
    {
      id: 1, title: 'Stage 1 · 共享骨干预训练', icon: '🏗️',
      color: '#10b981',
      data: '20 PB 真实 + 8 PB 合成',
      hw: '2048 × H100',
      time: '21 天',
      lr: '3e-4 → 1e-5 (cosine)',
      bs: '8192',
      loss: 'MIM + Contrastive + Next-Frame',
      goal: '多模态理解 + 时序建模能力',
    },
    {
      id: 2, title: 'Stage 2 · 三阶段联合微调', icon: '🎯',
      color: '#00cec9',
      data: '3 PB 精选（含 DriveLM 语言）',
      hw: '256 × H100',
      time: '7 天',
      lr: '2e-5',
      bs: '512',
      loss: 'L_imagination + L_reflection + L_action + L_reg',
      goal: '三阶段头联合优化，收敛到 SOTA 指标',
    },
    {
      id: 3, title: 'Stage 3 · 蒸馏到车端 13B', icon: '🚗',
      color: '#f39c12',
      data: '500 GB 难例（反思触发样本）',
      hw: '32 × H100',
      time: '3 天',
      lr: '5e-6',
      bs: '256',
      loss: 'KL(teacher, student) + Task Loss',
      goal: 'INT4 + KV 共享 + Speculative Decoding → 45ms @ Orin X',
    },
  ];

  return (
    <div>
      <div className="mb-3 text-xs text-gray-500">
        ⚙️ <span className="font-semibold text-emerald-700">Seed-AD</span> 三阶段训练管线：
        共享骨干预训练 → 三阶段头联合 → 车端蒸馏。总计约 31 天。
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
        {stages.map(s => (
          <div key={s.id}
            className="p-4 rounded-2xl border"
            style={{ borderColor: s.color + '44', background: s.color + '08' }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{s.icon}</span>
              <span className="text-sm font-semibold text-gray-800">{s.title}</span>
            </div>
            <div className="space-y-1.5 text-xs">
              {[
                ['数据', s.data],
                ['硬件', s.hw],
                ['时长', s.time],
                ['学习率', s.lr],
                ['Batch', s.bs],
                ['损失', s.loss],
              ].map(([k, v]) => (
                <div key={k} className="flex gap-2">
                  <div className="w-12 text-gray-400 shrink-0">{k}</div>
                  <div className="text-gray-700 font-mono text-[11px]">{v}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-2 border-t text-[11px] text-gray-500"
              style={{ borderColor: s.color + '22' }}>
              🎯 {s.goal}
            </div>
          </div>
        ))}
      </div>

      {/* 超参数表 */}
      <div className="rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-3 py-2 bg-gray-50 text-xs font-semibold text-gray-700">
          关键超参数
        </div>
        <table className="w-full text-xs">
          <tbody>
            {[
              ['优化器', 'AdamW (β1=0.9, β2=0.95, weight_decay=0.1)'],
              ['梯度裁剪', '1.0'],
              ['Warmup', '2000 steps (linear)'],
              ['LR Schedule', 'Cosine decay → 1% of peak'],
              ['Dropout', '0.0 (大模型不需要)'],
              ['Mixed Precision', 'BF16 (训练) / FP8 (推理候选)'],
              ['Checkpoint', '每 2000 steps 保存'],
              ['Resume', '支持断点续训，记录 RNG state'],
            ].map(([k, v]) => (
              <tr key={k} className="border-t border-gray-100">
                <td className="px-3 py-2 text-gray-600 w-1/3">{k}</td>
                <td className="px-3 py-2 text-gray-700 font-mono text-[11px]">{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 主组件
// ════════════════════════════════════════════════════════════════
export default function SeedAdArchViz() {
  const [tab, setTab] = useState('arch');
  return (
    <div>
      {/* 子 Tab 切换 */}
      <div className="flex flex-wrap gap-2 mb-5 p-1.5 bg-gray-50 rounded-2xl border border-gray-100">
        {SUB_TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="flex items-center gap-2 py-1.5 px-3 rounded-xl text-xs font-medium transition-all"
            style={tab === t.id
              ? { background: '#fff', color: t.color, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: `1px solid ${t.color}33` }
              : { color: '#94a3b8' }}>
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* 内容区 */}
      {tab === 'arch' && <ArchDiagram />}
      {tab === 'diff' && <DiffWithDriveWorld />}
      {tab === 'data' && <DatasetSelection />}
      {tab === 'train' && <TrainConfig />}
    </div>
  );
}
