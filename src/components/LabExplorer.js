'use client';

import { useState, useMemo } from 'react';
import { LAB_CATEGORIES, LAB_PROJECTS, RESOURCE_SUMMARY } from '@/lib/lab-data';

// ─────────────────────────────────────────────────────────────
// 通用组件
// ─────────────────────────────────────────────────────────────
function Badge({ children, color = '#6c5ce7' }) {
  return (
    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap"
      style={{ background: color + '18', color, border: `1px solid ${color}30` }}>
      {children}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// 课题卡片
// ─────────────────────────────────────────────────────────────
function ProjectCard({ project, isExpanded, onToggle }) {
  const p = project;
  const statusColors = { ready: '#3fb950', experimental: '#ffa657', planned: '#94a3b8' };
  const statusLabels = { ready: '可复现', experimental: '实验性', planned: '规划中' };

  return (
    <div className="rounded-2xl border bg-white overflow-hidden transition-all hover:shadow-sm"
      style={{ borderColor: p.color + '33' }}>
      {/* 卡片头部 */}
      <button onClick={onToggle} className="w-full text-left p-5">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: statusColors[p.status] }} />
            <span className="text-sm font-semibold text-gray-800">{p.title}</span>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Badge color={statusColors[p.status]}>{statusLabels[p.status]}</Badge>
            <span className="text-xs">{p.difficulty}</span>
          </div>
        </div>
        <p className="text-xs text-gray-500 leading-relaxed mb-3">{p.desc}</p>
        <div className="flex items-center gap-4 text-[10px] text-gray-400 mb-2">
          <span>🖥️ {p.computeReq}</span>
          <span>📦 {p.dataReq}</span>
          <span>⏱️ {p.trainTime}</span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {p.tags.map(t => (
            <span key={t} className="text-[9px] px-1.5 py-0.5 rounded-md bg-gray-50 text-gray-400 border border-gray-100">{t}</span>
          ))}
          <span className="ml-auto text-[10px] text-gray-300">{isExpanded ? '收起 ▲' : '展开 ▼'}</span>
        </div>
      </button>

      {/* 展开详情 */}
      {isExpanded && (
        <div className="border-t border-gray-100 p-5 bg-gray-50/30">
          {/* 为什么轻量 */}
          <div className="mb-4 p-3 rounded-xl border border-green-100 bg-green-50/50">
            <div className="text-[10px] font-semibold text-green-700 mb-1">💡 为什么适合轻量复现？</div>
            <p className="text-[10px] text-green-600 leading-relaxed">{p.whyLightweight}</p>
          </div>

          {/* 核心思路 */}
          <div className="mb-4 p-3 rounded-xl border" style={{ borderColor: p.color + '30', background: p.color + '06' }}>
            <div className="text-[10px] font-semibold mb-1" style={{ color: p.color }}>🧠 核心思路</div>
            <p className="text-[10px] text-gray-600 leading-relaxed">{p.keyIdea}</p>
          </div>

          {/* 实验步骤 */}
          <div className="mb-4">
            <div className="text-[10px] font-semibold text-gray-700 mb-2">📋 实验步骤</div>
            <div className="space-y-1.5">
              {p.steps.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0"
                    style={{ background: p.color + '18', color: p.color }}>
                    {i + 1}
                  </div>
                  <div className="flex-1 rounded-lg border border-gray-100 bg-white p-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-gray-700">{s.name}</span>
                      <span className="text-[9px] text-gray-400 font-mono">{s.time}</span>
                    </div>
                    <p className="text-[9px] text-gray-500">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 参考论文 & 代码 */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <div className="text-[10px] font-semibold text-gray-700 mb-1.5">📄 参考论文</div>
              <div className="space-y-1">
                {p.papers.map(paper => (
                  <div key={paper} className="text-[9px] text-gray-500 flex items-center gap-1">
                    <span className="text-gray-300">•</span> {paper}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-shrink-0">
              <div className="text-[10px] font-semibold text-gray-700 mb-1.5">🔗 代码参考</div>
              <a href={p.codeRef} target="_blank" rel="noopener noreferrer"
                className="text-[9px] text-[#6c5ce7] hover:underline font-mono break-all">
                {p.codeRef.replace('https://github.com/', '')}
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 资源需求面板
// ─────────────────────────────────────────────────────────────
function ResourcePanel() {
  const r = RESOURCE_SUMMARY;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">💻</span>
        <h3 className="text-base font-semibold text-gray-800">最低资源需求</h3>
        <span className="text-xs text-gray-400">— 所有课题均可在单卡环境运行</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {[
          { label: '最低 GPU', value: r.minGPU, icon: '🎮', color: '#6c5ce7' },
          { label: '推荐 GPU', value: r.recommendGPU, icon: '⚡', color: '#3fb950' },
          { label: '内存', value: r.minRAM, icon: '🧠', color: '#00cec9' },
          { label: '磁盘', value: r.minDisk, icon: '💾', color: '#ffa657' },
        ].map(item => (
          <div key={item.label} className="rounded-xl border border-gray-100 bg-gray-50/50 p-3 text-center">
            <div className="text-lg mb-1">{item.icon}</div>
            <div className="text-xs font-bold font-mono" style={{ color: item.color }}>{item.value}</div>
            <div className="text-[9px] text-gray-400 mt-0.5">{item.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* 数据集 */}
        <div>
          <div className="text-[10px] font-semibold text-gray-600 mb-2">📦 数据集</div>
          <div className="space-y-1.5">
            {r.datasets.map(d => (
              <div key={d.name} className="flex items-center gap-2 text-[10px]">
                <span className="text-gray-700 font-medium w-24">{d.name}</span>
                <span className="text-gray-400 font-mono">{d.size}</span>
                <span className="text-gray-300">·</span>
                <span className="text-gray-400">{d.scenes} 场景</span>
              </div>
            ))}
          </div>
        </div>
        {/* 框架 */}
        <div>
          <div className="text-[10px] font-semibold text-gray-600 mb-2">🛠️ 框架依赖</div>
          <div className="space-y-1.5">
            {r.frameworks.map(f => (
              <div key={f.name} className="flex items-center gap-2 text-[10px]">
                <span className="text-gray-700 font-mono font-medium w-32">{f.name}</span>
                <span className="text-gray-400">{f.role}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 研究路线图
// ─────────────────────────────────────────────────────────────
function Roadmap() {
  const paths = [
    {
      name: '感知增强路线',
      color: '#fd79a8',
      steps: ['SurroundOcc (占用预测)', 'LiDAR→Camera 蒸馏', 'CLIP 场景理解'],
      goal: '纯视觉感知 → 车端部署',
    },
    {
      name: '世界模型路线',
      color: '#ffa657',
      steps: ['Street Gaussians (3D 重建)', 'GAIA-1 Mini (视频预测)', 'MagicDrive (可控生成)'],
      goal: '场景理解 → 未来预测 → 数据生成',
    },
    {
      name: '端到端驾驶路线',
      color: '#6c5ce7',
      steps: ['CARLA RL (仿真训练)', '语言指令规划 (VLA-Lite)', 'BEV 蒸馏 (模型压缩)'],
      goal: '仿真策略 → 语言控制 → 车端部署',
    },
  ];

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">🗺️</span>
        <h3 className="text-base font-semibold text-gray-800">推荐研究路线</h3>
        <span className="text-xs text-gray-400">— 3 条渐进式学习路径</span>
      </div>

      <div className="space-y-3">
        {paths.map(path => (
          <div key={path.name} className="rounded-xl border p-3"
            style={{ borderColor: path.color + '33', background: path.color + '04' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold" style={{ color: path.color }}>{path.name}</span>
              <span className="text-[9px] text-gray-400">🎯 {path.goal}</span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {path.steps.map((step, i) => (
                <div key={step} className="flex items-center gap-1.5">
                  <span className="text-[9px] px-2 py-0.5 rounded-md font-mono"
                    style={{ background: path.color + '15', color: path.color }}>
                    {step}
                  </span>
                  {i < path.steps.length - 1 && <span className="text-[9px] text-gray-300">→</span>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 主组件
// ═══════════════════════════════════════════════════════════════
export default function LabExplorer() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [expandedId, setExpandedId] = useState(null);

  const filteredProjects = useMemo(() => {
    if (activeCategory === 'all') return LAB_PROJECTS;
    return LAB_PROJECTS.filter(p => p.category === activeCategory);
  }, [activeCategory]);

  const stats = useMemo(() => ({
    total: LAB_PROJECTS.length,
    ready: LAB_PROJECTS.filter(p => p.status === 'ready').length,
    categories: LAB_CATEGORIES.length - 1,
  }), []);

  return (
    <div>
      {/* 统计概览 */}
      <div className="flex items-center gap-4 mb-6 text-xs text-gray-400">
        <span>🔬 {stats.total} 个研究课题</span>
        <span>·</span>
        <span>✅ {stats.ready} 个可复现</span>
        <span>·</span>
        <span>📂 {stats.categories} 个方向</span>
        <span>·</span>
        <span>💻 单卡 3090/4090 即可运行</span>
      </div>

      {/* 资源需求 */}
      <ResourcePanel />

      {/* 研究路线图 */}
      <Roadmap />

      {/* 分类筛选 */}
      <div className="flex flex-wrap gap-1.5 mb-6 p-1.5 bg-gray-50 rounded-2xl border border-gray-100">
        {LAB_CATEGORIES.map(cat => (
          <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
            className="flex items-center gap-1.5 py-2 px-3 rounded-xl text-xs font-medium transition-all whitespace-nowrap"
            style={activeCategory === cat.id
              ? { background: '#fff', color: cat.color, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: `1px solid ${cat.color}33` }
              : { color: '#94a3b8' }}>
            <span>{cat.icon}</span>
            <span>{cat.label}</span>
            {cat.id !== 'all' && (
              <span className="text-[9px] ml-0.5 opacity-60">
                {LAB_PROJECTS.filter(p => p.category === cat.id).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 课题列表 */}
      <div className="space-y-3">
        {filteredProjects.map(project => (
          <ProjectCard
            key={project.id}
            project={project}
            isExpanded={expandedId === project.id}
            onToggle={() => setExpandedId(expandedId === project.id ? null : project.id)}
          />
        ))}
      </div>

      {filteredProjects.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <div className="text-3xl mb-2">🔍</div>
          <p className="text-sm">该方向暂无课题，敬请期待</p>
        </div>
      )}
    </div>
  );
}