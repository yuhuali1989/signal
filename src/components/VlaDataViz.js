'use client';

import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Cell, PieChart, Pie,
} from 'recharts';
import { DATASET_STATS, PIPELINE_STAGES, FRAME_SAMPLES } from '@/lib/vla-data';

// ─── 任务分布饼图 ──────────────────────────────────────────────
function TaskPieChart() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">任务类型分布</h3>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={DATASET_STATS.tasks}
            dataKey="count"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={80}
            innerRadius={40}
            paddingAngle={3}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            labelLine={false}
          >
            {DATASET_STATS.tasks.map((t, i) => (
              <Cell key={i} fill={t.color} />
            ))}
          </Pie>
          <Tooltip formatter={(v) => v.toLocaleString()} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── 机器人平台柱状图 ──────────────────────────────────────────
function RobotBarChart() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">机器人平台分布</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={DATASET_STATS.robots} barSize={32}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
          <Tooltip formatter={(v) => v.toLocaleString()} />
          <Bar dataKey="episodes" radius={[6, 6, 0, 0]}>
            {DATASET_STATS.robots.map((r, i) => (
              <Cell key={i} fill={r.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── 数据处理流水线 ────────────────────────────────────────────
function PipelineViz() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-5">数据处理流水线</h3>
      <div className="flex flex-col gap-2">
        {PIPELINE_STAGES.map((stage, i) => (
          <div key={stage.id} className="flex items-start gap-3">
            {/* 连接线 */}
            <div className="flex flex-col items-center flex-shrink-0 w-8">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-base shadow-sm"
                style={{ background: stage.color + '22', border: `1.5px solid ${stage.color}55` }}
              >
                {stage.icon}
              </div>
              {i < PIPELINE_STAGES.length - 1 && (
                <div className="w-0.5 h-4 mt-1" style={{ background: stage.color + '44' }} />
              )}
            </div>
            {/* 内容 */}
            <div className="flex-1 pb-2">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm font-semibold text-gray-800">{stage.label}</span>
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                  style={{
                    background: stage.status === 'done' ? '#00b89422' : stage.status === 'running' ? '#6c5ce722' : '#dfe6e9',
                    color: stage.status === 'done' ? '#00b894' : stage.status === 'running' ? '#6c5ce7' : '#636e72',
                  }}
                >
                  {stage.status === 'done' ? '✓ 完成' : stage.status === 'running' ? '⟳ 运行中' : '○ 待处理'}
                </span>
                <span className="text-[11px] text-gray-400 ml-auto">{stage.count}</span>
              </div>
              <p className="text-xs text-gray-400">{stage.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 帧样本网格 ────────────────────────────────────────────────
function FrameSampleGrid() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">数据样本预览（模拟帧）</h3>
      <div className="grid grid-cols-6 gap-2">
        {FRAME_SAMPLES.slice(0, 18).map((f) => (
          <div
            key={f.id}
            className="aspect-square rounded-xl flex flex-col items-center justify-center text-center p-1 cursor-pointer hover:scale-105 transition-transform"
            style={{
              background: f.success
                ? 'linear-gradient(135deg, #6c5ce722, #a29bfe22)'
                : 'linear-gradient(135deg, #fd79a822, #e1728022)',
              border: `1.5px solid ${f.success ? '#a29bfe55' : '#fd79a855'}`,
            }}
            title={`${f.task} | ${f.robot} | step ${f.step} | reward ${f.reward}`}
          >
            <span className="text-lg">{f.success ? '✅' : '❌'}</span>
            <span className="text-[9px] text-gray-500 leading-tight mt-0.5 truncate w-full text-center">
              {f.task.split(' ')[0]}
            </span>
            <span className="text-[9px] font-mono text-gray-400">{f.reward}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-4 text-xs text-gray-400">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#a29bfe] inline-block" /> 成功</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#fd79a8] inline-block" /> 失败</span>
        <span className="ml-auto">共 {FRAME_SAMPLES.length} 个样本展示</span>
      </div>
    </div>
  );
}

// ─── 关节角度雷达图 ────────────────────────────────────────────
function JointRadarChart({ sample }) {
  const data = (sample?.joints || FRAME_SAMPLES[0].joints).map((v, i) => ({
    joint: `J${i + 1}`,
    value: +((v + Math.PI) / (2 * Math.PI) * 100).toFixed(1),
  }));
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-1">关节角度分布</h3>
      <p className="text-xs text-gray-400 mb-3">7-DOF 机械臂当前帧关节状态（归一化 0-100）</p>
      <ResponsiveContainer width="100%" height={200}>
        <RadarChart data={data}>
          <PolarGrid stroke="#f0f0f0" />
          <PolarAngleAxis dataKey="joint" tick={{ fontSize: 11 }} />
          <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
          <Radar dataKey="value" stroke="#6c5ce7" fill="#6c5ce7" fillOpacity={0.25} />
          <Tooltip />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── 统计卡片 ──────────────────────────────────────────────────
function StatCards() {
  const stats = [
    { label: '总 Episodes', value: '284,512', icon: '🎬', color: '#6c5ce7' },
    { label: '总帧数', value: '18.4M', icon: '🖼️', color: '#74b9ff' },
    { label: '录制时长', value: '1,536h', icon: '⏱️', color: '#00cec9' },
    { label: '任务类型', value: '6 类', icon: '🤖', color: '#fd79a8' },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {stats.map((s) => (
        <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
            style={{ background: s.color + '18' }}
          >
            {s.icon}
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-400">{s.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DataViz() {
  return (
    <div>
      <StatCards />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <TaskPieChart />
        <RobotBarChart />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className="lg:col-span-2">
          <PipelineViz />
        </div>
        <JointRadarChart />
      </div>
      <FrameSampleGrid />
    </div>
  );
}
