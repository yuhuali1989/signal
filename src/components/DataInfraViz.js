'use client';

import { useState, useMemo } from 'react';
import useHashState from '@/hooks/useHashState';
import {
  INFRA_TABS,
  OVERVIEW_DATA,
  K8S_DATA,
  DATALAKE_DATA,
  PIPELINE_DATA,
  MLOPS_DATA,
  OBSERVABILITY_DATA,
  VECTOR_DATA,
  DEDUP_DATA,
  SYNTH_DATA,
  FRAMEWORK_DATA,
  UNITY_CATALOG_INFRA_DATA,
  COMPUTE_ENGINE_DATA,
} from '@/lib/data-infra-data';

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

function SectionCard({ icon, title, desc, color, children }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 mb-4">
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">{icon}</span>
          <h3 className="text-base font-semibold text-gray-800">{title}</h3>
        </div>
        {desc && <p className="text-xs text-gray-500 ml-7">{desc}</p>}
      </div>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 1. 全景总览
// ─────────────────────────────────────────────────────────────
function OverviewTab() {
  const { layers, metrics, techChoices } = OVERVIEW_DATA;

  return (
    <div className="space-y-4">
      {/* 核心指标 */}
      <SectionCard icon="📊" title="核心指标" desc="数据闭环平台关键运营数据">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {metrics.map(m => (
            <div key={m.name} className="rounded-xl border border-gray-100 bg-gray-50/50 p-3 text-center">
              <div className="text-xl mb-1">{m.icon}</div>
              <div className="text-lg font-bold font-mono" style={{ color: m.color }}>{m.value}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">{m.name}</div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* 架构层次图 */}
      <SectionCard icon="🏗️" title="架构层次" desc="从基础设施到应用层的 6 层架构">
        <div className="space-y-2">
          {layers.map((layer, i) => (
            <div key={layer.label}>
              <div className="flex items-center gap-2 rounded-xl border p-3"
                style={{ borderColor: layer.color + '33', background: layer.color + '06' }}>
                <div className="w-20 text-center flex-shrink-0">
                  <div className="text-[10px] font-bold" style={{ color: layer.color }}>{layer.label}</div>
                </div>
                <div className="flex-1 flex items-center gap-1.5 flex-wrap">
                  {layer.items.map(item => (
                    <span key={item} className="text-[9px] px-1.5 py-0.5 rounded-md font-mono"
                      style={{ background: layer.color + '15', color: layer.color }}>
                      {item}
                    </span>
                  ))}
                </div>
              </div>
              {i < layers.length - 1 && (
                <div className="text-center text-[9px] text-gray-300 py-0.5">↕</div>
              )}
            </div>
          ))}
        </div>
      </SectionCard>

      {/* 技术选型 */}
      <SectionCard icon="⚖️" title="技术选型决策" desc="每个关键领域的技术选型及理由">
        <div className="space-y-2">
          {techChoices.map(tc => (
            <div key={tc.category} className="rounded-xl border border-gray-100 bg-gray-50/30 p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-semibold text-gray-700">{tc.category}</span>
                <Badge color="#3fb950">{tc.chosen}</Badge>
                <span className="text-[9px] text-gray-400 ml-auto">vs {tc.alternatives.join(' / ')}</span>
              </div>
              <p className="text-[10px] text-gray-500">💡 {tc.reason}</p>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 2. K8s & 容器
// ─────────────────────────────────────────────────────────────
function K8sTab() {
  const { clusters, components, namespaces, gpuStrategy, schedulerComparison } = K8S_DATA;
  const [activeSubTab, setActiveSubTab] = useState('overview');
  const [activeScheduler, setActiveScheduler] = useState(null);

  const SUB_TABS = [
    { id: 'overview',   label: '集群总览',   icon: '🖥️' },
    { id: 'scheduler',  label: '调度器选型', icon: '⚡' },
  ];

  return (
    <div className="space-y-4">
      {/* Sub Tab 切换 */}
      <div className="flex gap-2">
        {SUB_TABS.map(t => (
          <button key={t.id} onClick={() => setActiveSubTab(t.id)}
            className="text-xs px-4 py-1.5 rounded-full border transition-all font-medium"
            style={{
              background: activeSubTab === t.id ? '#326ce5' : 'transparent',
              color: activeSubTab === t.id ? '#fff' : '#64748b',
              borderColor: activeSubTab === t.id ? '#326ce5' : '#e2e8f0',
            }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── 集群总览 ── */}
      {activeSubTab === 'overview' && (
        <div className="space-y-4">
          {/* 集群矩阵 */}
          <SectionCard icon="🖥️" title="集群矩阵" desc="3 套 K8s 集群，按工作负载类型隔离">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {clusters.map(c => (
                <div key={c.name} className="rounded-xl border p-4"
                  style={{ borderColor: c.color + '33', background: c.color + '06' }}>
                  <div className="text-sm font-semibold text-gray-800 mb-1">{c.name}</div>
                  <div className="text-[10px] text-gray-500 mb-3">{c.purpose}</div>
                  <div className="space-y-1.5 text-[10px]">
                    {[
                      { label: '节点', value: c.nodes },
                      { label: 'GPU', value: c.gpu },
                      { label: '网络', value: c.network },
                      { label: '存储', value: c.storage },
                      { label: '调度', value: c.scheduler },
                    ].map(item => (
                      <div key={item.label} className="flex items-center gap-2">
                        <span className="text-gray-400 w-8">{item.label}</span>
                        <span className="font-mono text-gray-600">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* K8s 组件 */}
          <SectionCard icon="☸️" title="核心组件" desc="Kubernetes 生态关键组件">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {components.map(c => (
                <div key={c.name} className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/30 p-3">
                  <span className="text-lg flex-shrink-0 mt-0.5">{c.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-semibold text-gray-700">{c.name}</span>
                      <Badge color="#326ce5">{c.category}</Badge>
                    </div>
                    <div className="text-[10px] text-gray-500">{c.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Namespace */}
          <SectionCard icon="📁" title="Namespace 规划" desc="按职能隔离，独立资源配额">
            <div className="space-y-2">
              {namespaces.map(ns => (
                <div key={ns.name} className="flex items-center gap-3 rounded-xl border p-3"
                  style={{ borderColor: ns.color + '33', background: ns.color + '04' }}>
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: ns.color }} />
                  <span className="text-xs font-mono font-semibold text-gray-700 w-28">{ns.name}</span>
                  <span className="text-[10px] text-gray-500 flex-1">{ns.desc}</span>
                  <span className="text-[9px] font-mono text-gray-400 flex-shrink-0">{ns.quota}</span>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* GPU 调度策略 */}
          <div className="rounded-2xl border border-[#326ce5]/20 bg-[#326ce5]/5 p-5">
            <div className="text-xs font-semibold text-gray-700 mb-3">🎮 GPU 调度策略</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {Object.entries(gpuStrategy).map(([key, value]) => {
                const labels = { topology: '拓扑感知', mig: 'MIG 切分', timeshare: '时间片共享', preemption: '抢占策略', monitoring: 'GPU 监控' };
                return (
                  <div key={key} className="rounded-lg border border-[#326ce5]/20 bg-white/80 p-2.5">
                    <div className="text-[9px] text-gray-400 mb-0.5">{labels[key] || key}</div>
                    <div className="text-[10px] text-gray-700">{value}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── 调度器选型 ── */}
      {activeSubTab === 'scheduler' && (
        <div className="space-y-4">
          {/* 定位说明 */}
          <div className="rounded-2xl border border-[#326ce5]/20 bg-[#326ce5]/04 p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚡</span>
              <div>
                <div className="text-sm font-bold text-gray-800 mb-1">{schedulerComparison.title}</div>
                <div className="text-[10px] text-gray-500 leading-relaxed">{schedulerComparison.desc}</div>
              </div>
            </div>
          </div>

          {/* 调度器卡片列表 */}
          <div className="space-y-3">
            {schedulerComparison.schedulers.map(s => (
              <div key={s.name} className="rounded-2xl border overflow-hidden"
                style={{ borderColor: s.color + '30' }}>
                {/* 卡片头部（可点击展开） */}
                <button
                  className="w-full flex items-center gap-3 p-4 text-left transition-colors hover:bg-gray-50/50"
                  style={{ background: s.color + '04' }}
                  onClick={() => setActiveScheduler(activeScheduler === s.name ? null : s.name)}>
                  <span className="text-2xl flex-shrink-0">{s.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="text-sm font-bold text-gray-800">{s.name}</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                        style={{ background: s.color + '15', color: s.color }}>{s.version}</span>
                      <span className="text-[9px] px-2 py-0.5 rounded-full font-semibold"
                        style={{ background: s.verdictColor + '15', color: s.verdictColor }}>{s.verdict}</span>
                      {/* 评分 */}
                      <div className="flex gap-0.5 ml-auto">
                        {[1,2,3,4,5].map(i => (
                          <div key={i} className="w-3 h-1.5 rounded-full"
                            style={{ background: i <= s.score ? s.color : s.color + '25' }} />
                        ))}
                      </div>
                    </div>
                    <div className="text-[9px] text-gray-400">{s.org}</div>
                  </div>
                  <span className="text-[9px] text-gray-400 flex-shrink-0">{activeScheduler === s.name ? '▲' : '▼'}</span>
                </button>

                {/* 展开内容 */}
                {activeScheduler === s.name && (
                  <div className="px-4 pb-4 space-y-3" style={{ background: s.color + '02' }}>
                    <p className="text-[10px] text-gray-500 leading-relaxed pt-2">{s.desc}</p>

                    {/* 核心特性 */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {s.coreFeatures.map(f => (
                        <div key={f.name} className="rounded-xl border border-gray-100 bg-white/80 p-3">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-sm">{f.icon}</span>
                            <span className="text-[10px] font-semibold text-gray-700">{f.name}</span>
                          </div>
                          <p className="text-[9px] text-gray-500">{f.desc}</p>
                        </div>
                      ))}
                    </div>

                    {/* 适用场景 + 局限 */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="rounded-xl border border-gray-100 bg-white/80 p-3">
                        <div className="text-[9px] font-semibold text-[#3fb950] mb-1.5">✅ 适用场景</div>
                        {s.useCases.map((u, i) => (
                          <div key={i} className="text-[9px] text-gray-500 mb-0.5">· {u}</div>
                        ))}
                      </div>
                      <div className="rounded-xl border border-gray-100 bg-white/80 p-3">
                        <div className="text-[9px] font-semibold text-[#e17055] mb-1.5">⚠️ 局限</div>
                        {s.limitations.map((l, i) => (
                          <div key={i} className="text-[9px] text-gray-500 mb-0.5">· {l}</div>
                        ))}
                      </div>
                    </div>

                    {/* 配置示例 */}
                    <div>
                      <div className="text-[9px] font-semibold text-gray-600 mb-1.5">📋 配置示例</div>
                      <pre className="text-[8px] font-mono rounded-xl p-3 leading-relaxed overflow-x-auto"
                        style={{ background: s.color + '08', color: s.color, border: `1px solid ${s.color}20` }}>
                        {s.keyConfig}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* GPU 细粒度调度技术全景 */}
          <SectionCard icon="🔬" title={schedulerComparison.gpuFineGrained.title}
            desc={schedulerComparison.gpuFineGrained.desc}>
            <div className="space-y-3 mb-4">
              {schedulerComparison.gpuFineGrained.techniques.map(t => (
                <div key={t.name} className="rounded-xl border p-3"
                  style={{ borderColor: t.color + '25', background: t.color + '04' }}>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-[10px] font-bold text-gray-800">{t.name}</span>
                    <span className="text-[9px] px-2 py-0.5 rounded-full font-mono"
                      style={{ background: t.color + '15', color: t.color }}>{t.vendor}</span>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{t.isolation}</span>
                  </div>
                  <div className="text-[9px] font-mono text-gray-500 mb-2 bg-gray-50 rounded px-2 py-1">{t.granularity}</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <div className="text-[8px] font-semibold text-[#3fb950] mb-1">✅ 优势</div>
                      {t.pros.map((p, i) => <div key={i} className="text-[9px] text-gray-500 mb-0.5">· {p}</div>)}
                    </div>
                    <div>
                      <div className="text-[8px] font-semibold text-[#e17055] mb-1">⚠️ 局限</div>
                      {t.cons.map((c, i) => <div key={i} className="text-[9px] text-gray-500 mb-0.5">· {c}</div>)}
                    </div>
                  </div>
                  <div className="mt-2 text-[9px] rounded-lg px-2 py-0.5 inline-block"
                    style={{ background: t.color + '12', color: t.color }}>💡 {t.bestFor}</div>
                </div>
              ))}
            </div>

            {/* 选型矩阵 */}
            <div>
              <div className="text-[10px] font-semibold text-gray-600 mb-2">📊 {schedulerComparison.gpuFineGrained.decisionMatrix.title}</div>
              <div className="overflow-x-auto">
                <table className="w-full text-[9px]">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-1.5 px-2 text-gray-400 font-medium">调度器</th>
                      {schedulerComparison.gpuFineGrained.decisionMatrix.scenarios.map(s => (
                        <th key={s} className="text-center py-1.5 px-1 text-gray-400 font-medium whitespace-nowrap text-[8px]">{s}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {schedulerComparison.gpuFineGrained.decisionMatrix.rows.map((row, i) => (
                      <tr key={row.scheduler} className={`border-b border-gray-50 ${i%2===0?'bg-gray-50/20':''}`}>
                        <td className="py-1.5 px-2 font-mono font-semibold text-[#326ce5]">{row.scheduler}</td>
                        {row.scores.map((s, j) => (
                          <td key={j} className="py-1.5 px-1 text-center text-[8px]">{s}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </SectionCard>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 3. 数据湖仓 — 车端工程规范折叠面板（独立组件，避免 Hook 规则问题）
// ─────────────────────────────────────────────────────────────
function EdgeClientPanel({ edgeClient }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-[#6c5ce7]/20 bg-[#6c5ce7]/[0.02]">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left">
        <div className="flex items-center gap-2">
          <span className="text-base">🚗</span>
          <span className="text-sm font-semibold text-gray-800">{edgeClient.title}</span>
          <span className="text-[10px] text-gray-400 hidden sm:inline">{edgeClient.subtitle}</span>
        </div>
        <span className="text-[10px] text-gray-400 flex-shrink-0">{open ? '▲ 收起' : '▼ 展开车端工程规范'}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-4">
          {/* 软件栈 */}
          <SectionCard icon="🚗" title={edgeClient.title} desc={edgeClient.subtitle}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Object.entries(edgeClient.softwareStack).map(([k, v]) => {
                const labels = { os: 'OS', middleware: '中间件', runtime: '运行时', container: '容器', recorder: '录制器', uploader: '上传 Agent', trigger: '触发引擎' };
                return (
                  <div key={k} className="rounded-lg border border-gray-100 bg-gray-50/50 p-2">
                    <div className="text-[8px] text-gray-400 mb-0.5">{labels[k] || k}</div>
                    <div className="text-[9px] font-mono text-gray-700 leading-relaxed">{v}</div>
                  </div>
                );
              })}
            </div>
          </SectionCard>
          {/* MCAP + Channel / 时间戳同步 / Session 切割 / 增量读取 / Iceberg 行粒度 / 多模态拼接 — 原 client Tab 内容 */}
          <EdgeClientContent edgeClient={edgeClient} />
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 3b. 车端工程规范内容（MCAP / 时间戳 / Session / 增量 / 拼接规则）
// ─────────────────────────────────────────────────────────────
function EdgeClientContent({ edgeClient }) {
  return (
    <>
      {/* MCAP 文件结构 */}
      <SectionCard icon="📄" title={edgeClient.mcapStructure.title} desc={edgeClient.mcapStructure.desc}>
        <div className="mb-4">
          <div className="text-[10px] font-semibold text-gray-600 mb-2">📊 MCAP 文件布局</div>
          <div className="space-y-1">
            {edgeClient.mcapStructure.fileLayout.map(s => (
              <div key={s.section} className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50/30 p-2">
                <div className="w-24 flex-shrink-0">
                  <span className="text-[9px] font-mono font-semibold text-[#00cec9]">{s.section}</span>
                </div>
                <div className="flex-1 text-[9px] text-gray-600">{s.desc}</div>
                <div className="text-[8px] font-mono text-gray-400 flex-shrink-0">{s.size}</div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="text-[10px] font-semibold text-gray-600 mb-2">📡 Channel 定义（每个传感器对应一个 Channel）</div>
          <div className="overflow-x-auto">
            <table className="w-full text-[9px]">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-1.5 px-2 text-gray-400 font-medium">Topic</th>
                  <th className="text-left py-1.5 px-2 text-gray-400 font-medium">Schema</th>
                  <th className="text-center py-1.5 px-2 text-gray-400 font-medium">Rate</th>
                  <th className="text-center py-1.5 px-2 text-gray-400 font-medium">Encoding</th>
                  <th className="text-left py-1.5 px-2 text-gray-400 font-medium">说明</th>
                </tr>
              </thead>
              <tbody>
                {edgeClient.mcapStructure.channels.map((ch, i) => (
                  <tr key={ch.topic} className={`border-b border-gray-50 ${i % 2 === 0 ? 'bg-gray-50/20' : ''}`}>
                    <td className="py-1.5 px-2 font-mono text-[#6c5ce7] text-[8px]">{ch.topic}</td>
                    <td className="py-1.5 px-2 font-mono text-gray-500 text-[8px]">{ch.schema}</td>
                    <td className="py-1.5 px-2 text-center"><Badge color="#00cec9">{ch.rate}</Badge></td>
                    <td className="py-1.5 px-2 text-center font-mono text-gray-400 text-[8px]">{ch.encoding}</td>
                    <td className="py-1.5 px-2 text-gray-500">{ch.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </SectionCard>

      {/* 时间戳同步 */}
      <SectionCard icon="⏱️" title={edgeClient.timestampSync.title} desc={edgeClient.timestampSync.desc}>
        <div className="space-y-2 mb-3">
          {edgeClient.timestampSync.methods.map(m => (
            <div key={m.name} className="rounded-xl border p-3"
              style={{ borderColor: m.color + '25', background: m.color + '04' }}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-gray-800">{m.name}</span>
                <Badge color={m.color}>{m.precision}</Badge>
              </div>
              <p className="text-[10px] text-gray-500 mb-1">{m.desc}</p>
              <div className="text-[9px] font-mono px-2 py-0.5 rounded inline-block"
                style={{ background: m.color + '12', color: m.color }}>{m.impl}</div>
            </div>
          ))}
        </div>
        <div className="text-[9px] text-gray-500 rounded-xl border border-gray-100 bg-gray-50/50 p-2">
          {edgeClient.timestampSync.alignRule}
        </div>
      </SectionCard>

      {/* Session 切割策略 */}
      <SectionCard icon="✂️" title={edgeClient.sessionCut.title} desc={edgeClient.sessionCut.desc}>
        <div className="space-y-2 mb-3">
          {edgeClient.sessionCut.triggers.map(t => (
            <div key={t.name} className="rounded-xl border p-3"
              style={{ borderColor: t.color + '25', background: t.color + '04' }}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base">{t.icon}</span>
                <span className="text-xs font-semibold text-gray-800">{t.name}</span>
                <Badge color={t.color}>{t.priority}</Badge>
              </div>
              <p className="text-[10px] text-gray-500">{t.desc}</p>
            </div>
          ))}
        </div>
        <div className="text-[9px] text-gray-500">切割点两侧各保留 <span className="font-mono font-semibold text-[#6c5ce7]">{edgeClient.sessionCut.overlapSeconds}s</span> 重叠，防止切割点数据丢失</div>
      </SectionCard>

      {/* 增量读取机制 */}
      <SectionCard icon="🔄" title={edgeClient.incrementalRead.title} desc={edgeClient.incrementalRead.desc}>
        <div className="space-y-2 mb-4">
          {edgeClient.incrementalRead.methods.map(m => (
            <div key={m.name} className="rounded-xl border p-3"
              style={{ borderColor: m.color + '25', background: m.color + '04' }}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-base">{m.icon}</span>
                <span className="text-xs font-semibold text-gray-800">{m.name}</span>
              </div>
              <p className="text-[10px] text-gray-500 mb-1.5">{m.desc}</p>
              {m.schema && (
                <div className="text-[8px] font-mono px-2 py-1 rounded bg-gray-100 text-gray-600 mb-1.5">{m.schema}</div>
              )}
              <div className="text-[9px] text-gray-400">{m.how}</div>
              {m.priority && (
                <div className="mt-2 space-y-1">
                  {m.priority.map(p => (
                    <div key={p.level} className="flex items-center gap-2 text-[9px]">
                      <Badge color={p.level.includes('P0') ? '#ff7b72' : p.level.includes('P1') ? '#ffa657' : p.level.includes('P2') ? '#79c0ff' : '#3fb950'}>{p.level}</Badge>
                      <span className="text-gray-600">{p.condition}</span>
                      <span className="font-mono text-gray-400 ml-auto">{p.delay}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Raw 层 Iceberg 行粒度 */}
      <SectionCard icon="📊" title={edgeClient.rawIcebergRow.title} desc={edgeClient.rawIcebergRow.desc}>
        <div className="space-y-2 mb-4">
          {edgeClient.rawIcebergRow.tables.map(t => (
            <div key={t.table} className="rounded-xl border p-3"
              style={{ borderColor: t.color + '25', background: t.color + '04' }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">{t.icon}</span>
                <span className="text-[10px] font-bold font-mono" style={{ color: t.color }}>{t.table}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 mb-2">
                <div className="rounded-lg border border-gray-100 bg-white/80 p-2">
                  <div className="text-[8px] text-gray-400 mb-0.5">行粒度</div>
                  <div className="text-[9px] font-semibold text-gray-700">{t.rowUnit}</div>
                </div>
                <div className="rounded-lg border border-gray-100 bg-white/80 p-2">
                  <div className="text-[8px] text-gray-400 mb-0.5">时间窗口</div>
                  <div className="text-[9px] font-mono" style={{ color: t.color }}>{t.timeWindow}</div>
                </div>
                <div className="rounded-lg border border-gray-100 bg-white/80 p-2">
                  <div className="text-[8px] text-gray-400 mb-0.5">行数/Session</div>
                  <div className="text-[9px] font-mono text-gray-600">{t.rowsPerSession}</div>
                </div>
              </div>
              <div className="text-[9px] text-gray-500 mb-1">📎 {t.fileRef}</div>
              <div className="text-[8px] text-gray-400">写入时机: {t.whenInserted}</div>
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-[#00cec9]/20 bg-[#00cec9]/05 p-3">
          <div className="text-[10px] font-semibold text-gray-700 mb-2">💡 关键结论</div>
          <div className="space-y-1.5">
            {edgeClient.rawIcebergRow.keyInsights.map((ins, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-[#00cec9] flex-shrink-0 mt-0.5">▸</span>
                <div>
                  <div className="text-[9px] font-semibold text-gray-700">{ins.insight}</div>
                  <div className="text-[8px] text-gray-400">{ins.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </SectionCard>

      {/* 多模态拼接规则 */}
      <SectionCard icon="🔗" title={edgeClient.joinRules.title} desc={edgeClient.joinRules.desc}>
        <div className="mb-3 rounded-xl border border-[#3fb950]/20 bg-[#3fb950]/05 p-2">
          <span className="text-[9px] font-semibold text-[#3fb950]">基准模态: </span>
          <span className="text-[9px] text-gray-600">{edgeClient.joinRules.baseModality}</span>
        </div>
        <div className="space-y-2 mb-4">
          {edgeClient.joinRules.rules.map(r => (
            <div key={r.modality} className="rounded-xl border p-3"
              style={{ borderColor: r.color + '25', background: r.color + '04' }}>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-xs font-semibold text-gray-800">{r.modality}</span>
                <Badge color={r.color}>{r.method}</Badge>
                <Badge color={r.color}>容差 {r.tolerance}</Badge>
              </div>
              <p className="text-[10px] text-gray-500 mb-1">{r.detail}</p>
              <div className="text-[9px] text-amber-600">⚠️ fallback: {r.fallback}</div>
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-[#a29bfe]/20 bg-[#a29bfe]/04 p-3">
          <div className="text-[9px] font-semibold text-gray-700 mb-2">🔍 多模态拼接 SQL 示例</div>
          <pre className="text-[8px] font-mono text-gray-600 whitespace-pre-wrap leading-relaxed overflow-x-auto">{edgeClient.joinRules.sceneJoinSQL}</pre>
        </div>
      </SectionCard>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// 3. 数据湖仓 — 存算分离 · 对象存储 · 缓存加速 · 表格式选型
// ─────────────────────────────────────────────────────────────
export function DatalakeTab() {
  const { computeStorageSeparation, objectStorage, cacheAcceleration, tableFormat, queryEngines, icebergSource } = DATALAKE_DATA;
  const [activeSubTab, setActiveSubTab] = useState('separation');
  const [activeIcebergTab, setActiveIcebergTab] = useState('overview');

  const SUB_TABS = [
    { id: 'separation', label: '存算分离',   icon: '🏗️' },
    { id: 'object',     label: '对象存储',   icon: '☁️' },
    { id: 'cache',      label: '缓存加速',   icon: '⚡' },
    { id: 'format',     label: '表格式选型', icon: '🧊' },
    { id: 'engines',    label: '查询引擎',   icon: '🔍' },
    { id: 'iceberg',    label: 'Iceberg 源码', icon: '🔬' },
  ];

  const ICEBERG_TABS = [
    { id: 'overview',    label: '架构总览',    icon: '🏗️' },
    { id: 'metadata',    label: '元数据结构',  icon: '📋' },
    { id: 'snapshot',    label: 'Snapshot',   icon: '📸' },
    { id: 'schema',      label: 'Schema 演化', icon: '🔄' },
    { id: 'partition',   label: '分区演化',    icon: '📂' },
    { id: 'compaction',  label: 'Compaction', icon: '🗜️' },
    { id: 'rowdelete',   label: '行级删除 V2→V3', icon: '🗑️' },
    { id: 'v3flow',      label: 'V3 读写流程', icon: '⚡' },
    { id: 'timeline',    label: '功能时间线',  icon: '📅' },
    { id: 'flink',       label: 'Flink 集成 🆕', icon: '🔗' },
    { id: 'pyiceberg',   label: 'PyIceberg',  icon: '🐍' },
  ];

  return (
    <div className="space-y-4">
      {/* 定位说明 */}
      <div className="rounded-2xl border border-[#00cec9]/20 bg-[#00cec9]/04 p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🏗️</span>
          <div>
            <div className="text-sm font-bold text-gray-800 mb-1">数据湖仓架构</div>
            <div className="text-[10px] text-gray-500 leading-relaxed">
              存算分离 · 对象存储选型 · 缓存加速方案 · 开放表格式（Iceberg / Delta / Hudi）· 多引擎查询
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {['存算分离', 'S3/OSS/MinIO', 'JuiceFS/Alluxio', 'Apache Iceberg', 'Delta Lake', 'Trino/Spark'].map(t => (
                <span key={t} className="text-[9px] px-2 py-0.5 rounded-full font-mono"
                  style={{ background: '#00cec9' + '15', color: '#00cec9', border: '1px solid #00cec930' }}>
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Sub Tab 切换 */}
      <div className="flex gap-1.5 flex-wrap">
        {SUB_TABS.map(t => (
          <button key={t.id} onClick={() => setActiveSubTab(t.id)}
            className="text-xs px-3 py-1.5 rounded-full border transition-all"
            style={{
              background: activeSubTab === t.id ? '#00cec9' : 'transparent',
              color: activeSubTab === t.id ? '#fff' : '#64748b',
              borderColor: activeSubTab === t.id ? '#00cec9' : '#e2e8f0',
            }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── 存算分离架构 ── */}
      {activeSubTab === 'separation' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#6c5ce7]/20 bg-[#6c5ce7]/04 p-5">
            <div className="text-sm font-bold text-gray-800 mb-1">{computeStorageSeparation.title}</div>
            <div className="text-[10px] text-gray-500 mb-3">{computeStorageSeparation.subtitle}</div>
            <div className="text-[10px] text-gray-600 leading-relaxed mb-4 rounded-xl border border-[#6c5ce7]/15 bg-white/80 p-3">
              {computeStorageSeparation.principle}
            </div>
            {/* 优势卡片 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
              {computeStorageSeparation.benefits.map(b => (
                <div key={b.title} className="rounded-xl border border-[#6c5ce7]/15 bg-white/80 p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base">{b.icon}</span>
                    <span className="text-xs font-semibold text-gray-700">{b.title}</span>
                  </div>
                  <p className="text-[10px] text-gray-500">{b.desc}</p>
                </div>
              ))}
            </div>
            {/* vs HDFS 对比 */}
            <SectionCard icon="⚖️" title="存算分离 vs HDFS" desc="">
              <div className="overflow-x-auto">
                <table className="w-full text-[9px]">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-1.5 px-2 text-gray-400 font-medium">维度</th>
                      <th className="text-left py-1.5 px-2 font-semibold text-[#6c5ce7]">存算分离</th>
                      <th className="text-left py-1.5 px-2 text-gray-400 font-medium">HDFS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {computeStorageSeparation.vsHDFS.map((row, i) => (
                      <tr key={row.dim} className={`border-b border-gray-50 ${i%2===0?'bg-gray-50/20':''}`}>
                        <td className="py-1.5 px-2 font-semibold text-gray-600">{row.dim}</td>
                        <td className="py-1.5 px-2 text-[#6c5ce7]">{row.separation}</td>
                        <td className="py-1.5 px-2 text-gray-400">{row.hdfs}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>
            {/* 架构层次 */}
            <div className="mt-4 space-y-2">
              <div className="text-[10px] font-semibold text-gray-600 mb-2">🏗️ 架构层次</div>
              {computeStorageSeparation.architecture.layers.map((layer, i) => (
                <div key={layer.name} className="rounded-xl border p-3"
                  style={{ borderColor: layer.color + '30', background: layer.color + '06' }}>
                  <div className="text-[10px] font-bold mb-1.5" style={{ color: layer.color }}>{layer.name}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {layer.items.map(item => (
                      <span key={item} className="text-[9px] px-2 py-0.5 rounded-full font-mono"
                        style={{ background: layer.color + '12', color: layer.color, border: `1px solid ${layer.color}25` }}>
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── 对象存储选型 ── */}
      {activeSubTab === 'object' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#ffa657]/20 bg-[#ffa657]/04 p-4">
            <div className="text-sm font-bold text-gray-800 mb-1">{objectStorage.title}</div>
            <div className="text-[10px] text-gray-500 mb-4">{objectStorage.subtitle}</div>
            {/* 选型卡片 */}
            <div className="space-y-3 mb-4">
              {objectStorage.options.map(opt => (
                <div key={opt.name} className="rounded-2xl border p-4"
                  style={{ borderColor: opt.color + '30', background: opt.color + '05' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{opt.icon}</span>
                    <span className="text-sm font-bold text-gray-800">{opt.name}</span>
                    <Badge color={opt.color}>{opt.type}</Badge>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                    <div>
                      <div className="text-[9px] font-semibold text-[#3fb950] mb-1">✅ 优势</div>
                      {opt.pros.map((p, i) => <div key={i} className="text-[9px] text-gray-500 mb-0.5">· {p}</div>)}
                    </div>
                    <div>
                      <div className="text-[9px] font-semibold text-[#e17055] mb-1">⚠️ 劣势</div>
                      {opt.cons.map((c, i) => <div key={i} className="text-[9px] text-gray-500 mb-0.5">· {c}</div>)}
                    </div>
                  </div>
                  <div className="text-[9px] rounded-lg px-2 py-1 inline-block"
                    style={{ background: opt.color + '12', color: opt.color }}>
                    💡 最适合：{opt.bestFor}
                  </div>
                </div>
              ))}
            </div>
            {/* 存储类型 */}
            <SectionCard icon="📊" title="S3 存储类型与成本" desc="">
              <div className="overflow-x-auto">
                <table className="w-full text-[9px]">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {['类型', '成本', '延迟', '适用场景', '取回费用'].map(h => (
                        <th key={h} className="text-left py-1.5 px-2 text-gray-400 font-medium whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {objectStorage.storageClasses.map((sc, i) => (
                      <tr key={sc.name} className={`border-b border-gray-50 ${i%2===0?'bg-gray-50/20':''}`}>
                        <td className="py-1.5 px-2 font-mono font-semibold text-[#ffa657]">{sc.name}</td>
                        <td className="py-1.5 px-2 font-mono text-gray-600">{sc.cost}</td>
                        <td className="py-1.5 px-2 text-gray-500">{sc.latency}</td>
                        <td className="py-1.5 px-2 text-gray-500">{sc.useCase}</td>
                        <td className="py-1.5 px-2 text-gray-400">{sc.retrieval}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>
            {/* 生命周期策略 */}
            <SectionCard icon="🔄" title="生命周期策略" desc={objectStorage.lifecyclePolicy.desc}>
              <div className="space-y-1.5">
                {objectStorage.lifecyclePolicy.rules.map((r, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-xl border border-[#ffa657]/15 bg-[#ffa657]/04 p-2.5">
                    <span className="text-[9px] text-gray-400 w-36 flex-shrink-0">{r.trigger}</span>
                    <span className="text-[9px] font-mono text-[#ffa657] flex-1">{r.action}</span>
                    <Badge color="#3fb950">{r.saving}</Badge>
                  </div>
                ))}
              </div>
            </SectionCard>
            {/* 性能优化 Tips */}
            <SectionCard icon="⚡" title="性能优化 Tips" desc="">
              <div className="space-y-1.5">
                {objectStorage.performanceTips.map((tip, i) => (
                  <div key={i} className="text-[10px] text-gray-500 rounded-lg border border-gray-100 bg-gray-50/30 p-2">
                    · {tip}
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        </div>
      )}

      {/* ── 缓存加速 ── */}
      {activeSubTab === 'cache' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#00b894]/20 bg-[#00b894]/04 p-4">
            <div className="text-sm font-bold text-gray-800 mb-1">{cacheAcceleration.title}</div>
            <div className="text-[10px] text-gray-500 mb-2">{cacheAcceleration.subtitle}</div>
            <div className="text-[10px] text-amber-600 rounded-xl border border-amber-100 bg-amber-50/50 p-3 mb-4">
              ⚠️ {cacheAcceleration.problem}
            </div>
            {/* 方案卡片 */}
            <div className="space-y-3 mb-4">
              {cacheAcceleration.solutions.map(sol => (
                <div key={sol.name} className="rounded-2xl border p-4"
                  style={{ borderColor: sol.color + '30', background: sol.color + '05' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{sol.icon}</span>
                    <span className="text-sm font-bold text-gray-800">{sol.name}</span>
                    <Badge color={sol.color}>{sol.type}</Badge>
                  </div>
                  <p className="text-[10px] text-gray-500 mb-2">{sol.desc}</p>
                  {/* 缓存层次 */}
                  <div className="mb-2">
                    <div className="text-[9px] font-semibold text-gray-600 mb-1">缓存层次</div>
                    {sol.cacheHierarchy.map((h, i) => (
                      <div key={i} className="text-[9px] text-gray-500 mb-0.5">· {h}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                    <div>
                      <div className="text-[9px] font-semibold text-[#3fb950] mb-1">✅ 优势</div>
                      {sol.pros.map((p, i) => <div key={i} className="text-[9px] text-gray-500 mb-0.5">· {p}</div>)}
                    </div>
                    <div>
                      <div className="text-[9px] font-semibold text-[#e17055] mb-1">⚠️ 劣势</div>
                      {sol.cons.map((c, i) => <div key={i} className="text-[9px] text-gray-500 mb-0.5">· {c}</div>)}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 text-[9px]">
                    <span className="rounded-lg px-2 py-0.5"
                      style={{ background: sol.color + '12', color: sol.color }}>
                      🚀 性能提升：{sol.perfGain}
                    </span>
                    <span className="rounded-lg px-2 py-0.5 bg-gray-100 text-gray-500">
                      💡 适用：{sol.useCase}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {/* 选型矩阵 */}
            <SectionCard icon="📊" title={cacheAcceleration.decisionMatrix.title} desc="">
              <div className="overflow-x-auto">
                <table className="w-full text-[9px]">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-1.5 px-2 text-gray-400 font-medium">方案</th>
                      {cacheAcceleration.decisionMatrix.criteria.map(c => (
                        <th key={c} className="text-left py-1.5 px-2 text-gray-400 font-medium whitespace-nowrap">{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {cacheAcceleration.decisionMatrix.rows.map((row, i) => (
                      <tr key={row.solution} className={`border-b border-gray-50 ${i%2===0?'bg-gray-50/20':''}`}>
                        <td className="py-1.5 px-2 font-mono font-semibold text-[#00b894]">{row.solution}</td>
                        {row.scores.map((s, j) => (
                          <td key={j} className="py-1.5 px-2 text-gray-500">{s}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          </div>
        </div>
      )}

      {/* ── 表格式选型 ── */}
      {activeSubTab === 'format' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#00cec9]/20 bg-[#00cec9]/04 p-4">
            <div className="text-sm font-bold text-gray-800 mb-1">{tableFormat.title}</div>
            <div className="text-[10px] text-gray-500 mb-2">{tableFormat.subtitle}</div>
            <div className="text-[10px] text-gray-600 rounded-xl border border-[#00cec9]/15 bg-white/80 p-3 mb-4">
              {tableFormat.intro}
            </div>

            {/* ── 文件格式对比（新增）── */}
            <SectionCard icon="📁" title="存储文件格式对比" desc="Parquet / ORC / Avro / Arrow / JSON / CSV — 按场景选择最合适的格式">
              {/* 文件格式卡片 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                {tableFormat.fileFormats.map(fmt => (
                  <div key={fmt.name} className="rounded-xl border p-3"
                    style={{ borderColor: fmt.color + '30', background: fmt.color + '05' }}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-lg">{fmt.icon}</span>
                      <span className="text-xs font-bold text-gray-800">{fmt.name}</span>
                      <span className="text-[8px] px-1.5 py-0.5 rounded-full font-mono ml-auto"
                        style={{ background: fmt.color + '15', color: fmt.color, border: `1px solid ${fmt.color}30` }}>
                        {fmt.type}
                      </span>
                    </div>
                    <div className="text-[8px] text-gray-400 mb-1.5 flex flex-wrap gap-2">
                      <span>压缩：{fmt.compression}</span>
                      <span>·</span>
                      <span>读取：{fmt.readPattern}</span>
                    </div>
                    <div className="mb-1.5">
                      <div className="text-[8px] font-semibold text-[#3fb950] mb-0.5">✅ 优势</div>
                      {fmt.pros.slice(0, 3).map((p, i) => (
                        <div key={i} className="text-[8px] text-gray-500">· {p}</div>
                      ))}
                    </div>
                    <div className="mb-1.5">
                      <div className="text-[8px] font-semibold text-[#e17055] mb-0.5">⚠️ 劣势</div>
                      {fmt.cons.slice(0, 2).map((c, i) => (
                        <div key={i} className="text-[8px] text-gray-500">· {c}</div>
                      ))}
                    </div>
                    <div className="text-[8px] rounded-lg px-2 py-1 inline-block"
                      style={{ background: fmt.color + '12', color: fmt.color }}>
                      💡 {fmt.bestFor}
                    </div>
                  </div>
                ))}
              </div>

              {/* 文件格式对比矩阵 */}
              <div className="overflow-x-auto mb-4">
                <table className="w-full text-[8px]">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-1.5 px-2 text-gray-400 font-medium whitespace-nowrap">维度</th>
                      <th className="text-center py-1.5 px-2 font-semibold text-[#00cec9] whitespace-nowrap">Parquet</th>
                      <th className="text-center py-1.5 px-2 text-gray-400 font-medium whitespace-nowrap">ORC</th>
                      <th className="text-center py-1.5 px-2 text-gray-400 font-medium whitespace-nowrap">Avro</th>
                      <th className="text-center py-1.5 px-2 text-gray-400 font-medium whitespace-nowrap">Arrow</th>
                      <th className="text-center py-1.5 px-2 text-gray-400 font-medium whitespace-nowrap">JSON</th>
                      <th className="text-center py-1.5 px-2 text-gray-400 font-medium whitespace-nowrap">CSV</th>
                      <th className="text-center py-1.5 px-2 font-semibold text-[#6c5ce7] whitespace-nowrap">MCAP 🚗</th>
                      <th className="text-center py-1.5 px-2 font-semibold text-[#00b894] whitespace-nowrap">WebDataset</th>
                      <th className="text-center py-1.5 px-2 font-semibold text-[#e17055] whitespace-nowrap">Lance</th>
                      <th className="text-center py-1.5 px-2 text-gray-400 font-medium whitespace-nowrap">TFRecord</th>
                      <th className="text-center py-1.5 px-2 text-gray-400 font-medium whitespace-nowrap">HDF5</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableFormat.fileFormatMatrix.map((row, i) => (
                      <tr key={row.dim} className={`border-b border-gray-50 ${i%2===0?'bg-gray-50/20':''}`}>
                        <td className="py-1.5 px-2 font-semibold text-gray-600 whitespace-nowrap">{row.dim}</td>
                        <td className="py-1.5 px-2 text-center text-[#00cec9]">{row.parquet}</td>
                        <td className="py-1.5 px-2 text-center text-gray-400">{row.orc}</td>
                        <td className="py-1.5 px-2 text-center text-gray-400">{row.avro}</td>
                        <td className="py-1.5 px-2 text-center text-gray-400">{row.arrow}</td>
                        <td className="py-1.5 px-2 text-center text-gray-400">{row.json}</td>
                        <td className="py-1.5 px-2 text-center text-gray-400">{row.csv}</td>
                        <td className="py-1.5 px-2 text-center text-[#6c5ce7]">{row.mcap}</td>
                        <td className="py-1.5 px-2 text-center text-[#00b894]">{row.webdataset}</td>
                        <td className="py-1.5 px-2 text-center text-[#e17055]">{row.lance}</td>
                        <td className="py-1.5 px-2 text-center text-gray-400">{row.tfrecord}</td>
                        <td className="py-1.5 px-2 text-center text-gray-400">{row.hdf5}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 选型决策树 */}
              <div className="mb-2">
                <div className="text-[10px] font-bold text-gray-700 mb-2">🎯 {tableFormat.selectionGuide.title}</div>
                <div className="text-[9px] text-gray-400 mb-3">{tableFormat.selectionGuide.subtitle}</div>
                <div className="space-y-2">
                  {tableFormat.selectionGuide.scenarios.map(sc => (
                    <div key={sc.title} className="rounded-xl border p-3"
                      style={{ borderColor: sc.color + '30', background: sc.color + '05' }}>
                      <div className="flex items-start gap-2">
                        <span className="text-base flex-shrink-0">{sc.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-[9px] font-semibold text-gray-700">{sc.title}</span>
                            <span className="text-[8px] px-2 py-0.5 rounded-full font-bold"
                              style={{ background: sc.color + '18', color: sc.color }}>
                              → {sc.answer}
                            </span>
                          </div>
                          <div className="text-[8px] text-gray-500 mb-1.5">{sc.reason}</div>
                          <pre className="text-[7.5px] font-mono text-gray-500 bg-gray-50 rounded-lg p-2 overflow-x-auto whitespace-pre-wrap">{sc.config}</pre>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </SectionCard>

            {/* 格式卡片 */}
            <div className="space-y-4 mb-4">
              {tableFormat.formats.map(fmt => (
                <div key={fmt.name} className="rounded-2xl border p-4"
                  style={{ borderColor: fmt.color + '30', background: fmt.color + '05' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{fmt.icon}</span>
                    <span className="text-sm font-bold text-gray-800">{fmt.name}</span>
                    <span className="text-[9px] px-2 py-0.5 rounded-full font-semibold"
                      style={{ background: fmt.verdictColor + '15', color: fmt.verdictColor }}>
                      {fmt.verdict}
                    </span>
                    <div className="ml-auto flex gap-0.5">
                      {[1,2,3,4,5].map(i => (
                        <div key={i} className="w-3 h-1.5 rounded-full"
                          style={{ background: i <= fmt.score ? fmt.color : fmt.color + '25' }} />
                      ))}
                    </div>
                  </div>
                  <div className="text-[9px] text-gray-400 mb-2">来源：{fmt.origin}</div>
                  <div className="text-[10px] text-gray-600 mb-3 rounded-lg border border-gray-100 bg-white/80 p-2">
                    {fmt.coreDesign}
                  </div>
                  {/* 核心特性 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mb-3">
                    {fmt.keyFeatures.map(f => (
                      <div key={f.name} className="rounded-lg border border-gray-100 bg-white/80 p-2">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-sm">{f.icon}</span>
                          <span className="text-[9px] font-semibold text-gray-700">{f.name}</span>
                        </div>
                        <p className="text-[8px] text-gray-500">{f.desc}</p>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <div className="text-[9px] font-semibold text-[#3fb950] mb-1">✅ 优势</div>
                      {fmt.pros.map((p, i) => <div key={i} className="text-[9px] text-gray-500 mb-0.5">· {p}</div>)}
                    </div>
                    <div>
                      <div className="text-[9px] font-semibold text-[#e17055] mb-1">⚠️ 劣势</div>
                      {fmt.cons.map((c, i) => <div key={i} className="text-[9px] text-gray-500 mb-0.5">· {c}</div>)}
                    </div>
                  </div>
                  <div className="mt-2 text-[9px] rounded-lg px-2 py-1 inline-block"
                    style={{ background: fmt.color + '12', color: fmt.color }}>
                    💡 最适合：{fmt.bestFor}
                  </div>
                </div>
              ))}
            </div>
            {/* 对比表 */}
            <SectionCard icon="📊" title="三大格式对比" desc="">
              <div className="overflow-x-auto">
                <table className="w-full text-[9px]">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-1.5 px-2 text-gray-400 font-medium">特性</th>
                      <th className="text-center py-1.5 px-2 font-semibold text-[#00cec9]">Iceberg ✅</th>
                      <th className="text-center py-1.5 px-2 text-gray-400 font-medium">Delta Lake</th>
                      <th className="text-center py-1.5 px-2 text-gray-400 font-medium">Hudi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableFormat.comparisonTable.map((row, i) => (
                      <tr key={row.feature} className={`border-b border-gray-50 ${i%2===0?'bg-gray-50/20':''}`}>
                        <td className="py-1.5 px-2 font-semibold text-gray-600">{row.feature}</td>
                        <td className="py-1.5 px-2 text-center text-[#00cec9]">{row.iceberg}</td>
                        <td className="py-1.5 px-2 text-center text-gray-400">{row.delta}</td>
                        <td className="py-1.5 px-2 text-center text-gray-400">{row.hudi}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>
            {/* Iceberg 最佳实践 */}
            <SectionCard icon="🧊" title="Iceberg 最佳实践" desc="">
              <div className="space-y-2">
                {tableFormat.icebergBestPractices.map(bp => (
                  <div key={bp.title} className="rounded-xl border border-[#00cec9]/15 bg-[#00cec9]/04 p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm">{bp.icon}</span>
                      <span className="text-xs font-semibold text-gray-700">{bp.title}</span>
                    </div>
                    <p className="text-[10px] text-gray-500">{bp.desc}</p>
                  </div>
                ))}
              </div>
            </SectionCard>
            {/* Iceberg Spec 版本演进 */}
            <SectionCard icon="📜" title="Iceberg Spec 版本演进：V1 → V2 → V3" desc="格式规范版本对比与引擎支持进度">
              <div className="space-y-4">
                {tableFormat.icebergSpecVersions.map(sv => (
                  <div key={sv.version} className="rounded-2xl border p-4"
                    style={{ borderColor: sv.color + '40', background: sv.color + '06' }}>
                    {/* 版本标题行 */}
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-base font-black" style={{ color: sv.color }}>{sv.version}</span>
                      <span className="text-xs font-bold text-gray-700">{sv.title}</span>
                      <span className="text-[9px] px-2 py-0.5 rounded-full font-semibold ml-auto"
                        style={{ background: sv.color + '18', color: sv.color }}>{sv.status}</span>
                    </div>
                    <div className="text-[9px] text-gray-400 mb-2">发布：{sv.released}</div>
                    <div className="text-[10px] text-gray-600 rounded-lg border border-gray-100 bg-white/80 p-2 mb-3">
                      {sv.coreTheme}
                    </div>
                    {/* 新特性 */}
                    <div className="mb-3">
                      <div className="text-[9px] font-semibold text-gray-500 mb-1.5">🆕 新增特性</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {sv.newFeatures.map(f => (
                          <div key={f.name} className="rounded-lg border border-gray-100 bg-white/80 p-2">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="text-sm">{f.icon}</span>
                              <span className="text-[9px] font-semibold text-gray-700">{f.name}</span>
                            </div>
                            <p className="text-[8px] text-gray-500">{f.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* 引擎支持 */}
                    <div className="mb-2">
                      <div className="text-[9px] font-semibold text-gray-500 mb-1.5">🔧 引擎支持进度</div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-[8px]">
                          <thead>
                            <tr className="border-b border-gray-100">
                              <th className="text-left py-1 px-1.5 text-gray-400 font-medium">引擎</th>
                              <th className="text-left py-1 px-1.5 text-gray-400 font-medium">支持状态</th>
                              <th className="text-left py-1 px-1.5 text-gray-400 font-medium">版本/预计时间</th>
                              <th className="text-left py-1 px-1.5 text-gray-400 font-medium">备注</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sv.engineSupport.map((e, i) => (
                              <tr key={e.engine} className={`border-b border-gray-50 ${i%2===0?'bg-gray-50/30':''}`}>
                                <td className="py-1 px-1.5 font-semibold text-gray-600">{e.engine}</td>
                                <td className="py-1 px-1.5">{e.support}</td>
                                <td className="py-1 px-1.5 text-gray-500">{e.version}</td>
                                <td className="py-1 px-1.5 text-gray-400">{e.note}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    {/* V3 升级注意事项 */}
                    {sv.upgradeNotes && (
                      <div className="mt-2">
                        <div className="text-[9px] font-semibold text-gray-500 mb-1">⚠️ 升级注意事项</div>
                        {sv.upgradeNotes.map((n, i) => (
                          <div key={i} className="text-[8px] text-gray-500 mb-0.5">· {n}</div>
                        ))}
                      </div>
                    )}
                    {/* V3 源码深度解析 */}
                    {sv.sourceDeepDive && (
                      <div className="mt-3 border-t border-gray-100 pt-3">
                        <div className="text-[9px] font-semibold text-gray-600 mb-2">🔬 {sv.sourceDeepDive.title}</div>
                        {sv.sourceDeepDive.sections.map((sec, si) => (
                          <div key={si} className="mb-3">
                            <div className="text-[9px] font-bold mb-1" style={{ color: sv.color }}>{sec.name}</div>
                            <div className="text-[8px] text-gray-500 mb-1.5">{sec.desc}</div>
                            {/* 写入延迟分析专属渲染 */}
                            {sec.writeLatencyAnalysis && (() => {
                              const wl = sec.writeLatencyAnalysis;
                              return (
                                <div className="space-y-2 mb-2">
                                  <div className="rounded-lg border border-orange-100 bg-orange-50/40 p-2.5">
                                    <div className="text-[9px] font-semibold text-orange-700 mb-1">📊 总体结论</div>
                                    <p className="text-[8px] text-gray-600">{wl.summary}</p>
                                  </div>
                                  <div className="text-[9px] font-semibold text-gray-500 mb-1">⚙️ 额外开销来源</div>
                                  {wl.overheadItems.map((item, ii) => (
                                    <div key={ii} className="rounded-lg border p-2"
                                      style={{ borderColor: item.color + '30', background: item.color + '08' }}>
                                      <div className="flex items-center gap-1.5 mb-1">
                                        <span className="text-[9px] font-bold" style={{ color: item.color }}>{item.name}</span>
                                        <span className="text-[8px] px-1.5 py-0.5 rounded-full"
                                          style={{ background: item.color + '18', color: item.color }}>严重度：{item.severity}</span>
                                      </div>
                                      <p className="text-[8px] text-gray-500 mb-1">{item.desc}</p>
                                      <p className="text-[8px] text-green-600">✅ 缓解：{item.mitigation}</p>
                                    </div>
                                  ))}
                                  <div className="text-[9px] font-semibold text-gray-500 mt-2 mb-1">📈 Append vs Upsert 写入延迟对比</div>
                                  <div className="overflow-x-auto">
                                    <table className="w-full text-[8px]">
                                      <thead>
                                        <tr className="border-b border-gray-100">
                                          <th className="text-left py-1 px-1.5 text-gray-400">场景</th>
                                          <th className="text-left py-1 px-1.5 text-gray-400">V2</th>
                                          <th className="text-left py-1 px-1.5 text-gray-400">V3</th>
                                          <th className="text-left py-1 px-1.5 text-gray-400">结论</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {[
                                          { label: '纯 Append', ...wl.appendVsUpsert.append },
                                          { label: '低频 Upsert', ...wl.appendVsUpsert.upsert_low },
                                          { label: '高频 Upsert', ...wl.appendVsUpsert.upsert_high },
                                        ].map((row, ri) => (
                                          <tr key={ri} className={`border-b border-gray-50 ${ri%2===0?'bg-gray-50/20':''}`}>
                                            <td className="py-1 px-1.5 font-semibold text-gray-600">{row.label}</td>
                                            <td className="py-1 px-1.5 text-gray-500">{row.v2}</td>
                                            <td className="py-1 px-1.5 text-gray-500">{row.v3}</td>
                                            <td className="py-1 px-1.5 text-blue-600 font-medium">{row.verdict}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                  <div className="rounded-lg border border-blue-100 bg-blue-50/40 p-2.5 mt-1">
                                    <div className="text-[9px] font-semibold text-blue-700 mb-1">💡 核心洞察</div>
                                    <p className="text-[8px] text-gray-600">{wl.keyInsight}</p>
                                  </div>
                                </div>
                              );
                            })()}
                            <pre className="text-[7.5px] font-mono rounded-lg p-2.5 leading-relaxed overflow-x-auto"
                              style={{ background: sv.color + '08', color: sv.color, border: `1px solid ${sv.color}20` }}>
                              {sec.code}
                            </pre>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        </div>
      )}

      {/* ── 查询引擎 ── */}
      {activeSubTab === 'engines' && (
        <div className="space-y-3">
          <SectionCard icon="🔍" title="查询引擎选型" desc="多引擎覆盖不同查询场景，按延迟和规模选择">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {queryEngines.map(e => (
                <div key={e.name} className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/30 p-3">
                  <span className="text-2xl flex-shrink-0">{e.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-gray-800">{e.name}</span>
                      <Badge color="#00cec9">{e.role}</Badge>
                      <span className="text-[9px] text-gray-400 ml-auto font-mono">{e.latency}</span>
                    </div>
                    <p className="text-[10px] text-gray-500">{e.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {/* ── Iceberg 源码解析 ── */}
      {activeSubTab === 'iceberg' && (
        <div className="space-y-4">
          {/* 定位说明 */}
          <div className="rounded-2xl border border-[#00cec9]/20 bg-[#00cec9]/04 p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🧊</span>
              <div>
                <div className="text-sm font-bold text-gray-800 mb-1">{icebergSource.overview.title}</div>
                <div className="text-[10px] text-gray-500 leading-relaxed mb-2">{icebergSource.overview.desc}</div>
                <div className="flex flex-wrap gap-2">
                  <span className="text-[9px] px-2 py-0.5 rounded-full font-mono"
                    style={{ background: '#00cec920', color: '#00cec9', border: '1px solid #00cec930' }}>
                    v{icebergSource.overview.version}
                  </span>
                  <a href={icebergSource.overview.repoUrl} target="_blank" rel="noopener noreferrer"
                    className="text-[9px] px-2 py-0.5 rounded-full font-mono"
                    style={{ background: '#00cec920', color: '#00cec9', border: '1px solid #00cec930' }}>
                    GitHub ↗
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Iceberg Sub Tab 切换 */}
          <div className="flex gap-1.5 flex-wrap">
            {ICEBERG_TABS.map(t => (
              <button key={t.id} onClick={() => setActiveIcebergTab(t.id)}
                className="text-xs px-3 py-1.5 rounded-full border transition-all"
                style={{
                  background: activeIcebergTab === t.id ? '#00cec9' : 'transparent',
                  color: activeIcebergTab === t.id ? '#fff' : '#64748b',
                  borderColor: activeIcebergTab === t.id ? '#00cec9' : '#e2e8f0',
                }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {/* ── 架构总览 ── */}
          {activeIcebergTab === 'overview' && (
            <div className="space-y-3">
              {icebergSource.overview.coreModules.map(mod => (
                <div key={mod.name} className="rounded-2xl border p-4"
                  style={{ borderColor: mod.color + '30', background: mod.color + '05' }}>
                  <div className="flex items-start gap-3 mb-3">
                    <span className="text-2xl flex-shrink-0">{mod.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-sm font-bold text-gray-800">{mod.name}</span>
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded"
                          style={{ background: mod.color + '15', color: mod.color }}>{mod.keyClass}</span>
                      </div>
                      <div className="text-[9px] font-mono text-gray-400 mb-1 break-all">{mod.pkg}</div>
                      <p className="text-[10px] text-gray-500 leading-relaxed">{mod.desc}</p>
                    </div>
                  </div>
                  <div className="rounded-lg border border-gray-100 bg-white/80 p-2 mb-2">
                    <span className="text-[9px] text-gray-400">核心方法：</span>
                    <span className="text-[9px] font-mono font-semibold ml-1" style={{ color: mod.color }}>{mod.keyMethod}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 items-center">
                    {mod.flow.map((step, i) => (
                      <div key={i} className="flex items-center gap-1">
                        <span className="text-[9px] px-2 py-0.5 rounded-full"
                          style={{ background: mod.color + '12', color: mod.color, border: `1px solid ${mod.color}25` }}>
                          {step}
                        </span>
                        {i < mod.flow.length - 1 && <span className="text-gray-200 text-xs">→</span>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── 三层元数据结构 ── */}
          {activeIcebergTab === 'metadata' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-[#00cec9]/20 bg-[#00cec9]/04 p-4">
                <div className="text-sm font-bold text-gray-800 mb-1">{icebergSource.metadataLayer.title}</div>
                <div className="text-[10px] text-gray-500 mb-4">{icebergSource.metadataLayer.desc}</div>
                {/* 三层结构 */}
                <div className="space-y-3 mb-4">
                  {icebergSource.metadataLayer.layers.map(layer => (
                    <div key={layer.level} className="rounded-2xl border p-4"
                      style={{ borderColor: layer.color + '30', background: layer.color + '05' }}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded"
                          style={{ background: layer.color + '20', color: layer.color }}>{layer.level}</span>
                        <span className="text-sm font-bold text-gray-800">{layer.name}</span>
                      </div>
                      <p className="text-[10px] text-gray-500 mb-2">{layer.desc}</p>
                      <div className="space-y-1">
                        {layer.files.map((f, i) => (
                          <div key={i} className="text-[9px] font-mono text-gray-400 rounded px-2 py-0.5"
                            style={{ background: layer.color + '08' }}>· {f}</div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                {/* metadata JSON 示例 */}
                <div className="text-[10px] font-semibold text-gray-600 mb-2">📄 TableMetadata JSON 结构示例</div>
                <pre className="text-[8px] font-mono rounded-xl p-4 leading-relaxed overflow-x-auto"
                  style={{ background: '#00cec908', color: '#00cec9', border: '1px solid #00cec920' }}>
                  {icebergSource.metadataLayer.code}
                </pre>
              </div>
            </div>
          )}

          {/* ── Snapshot 隔离与时间旅行 ── */}
          {activeIcebergTab === 'snapshot' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-[#fd79a8]/20 bg-[#fd79a8]/04 p-4">
                <div className="text-sm font-bold text-gray-800 mb-1">{icebergSource.snapshotIsolation.title}</div>
                <div className="text-[10px] text-gray-500 mb-3">{icebergSource.snapshotIsolation.desc}</div>
                <pre className="text-[8px] font-mono rounded-xl p-4 leading-relaxed overflow-x-auto"
                  style={{ background: '#fd79a808', color: '#fd79a8', border: '1px solid #fd79a820' }}>
                  {icebergSource.snapshotIsolation.code}
                </pre>
              </div>
              <SectionCard icon="📸" title="Snapshot 操作类型" desc="">
                <div className="space-y-2">
                  {icebergSource.snapshotIsolation.snapshotOps.map(op => (
                    <div key={op.op} className="flex items-start gap-3 rounded-xl border p-3"
                      style={{ borderColor: op.color + '25', background: op.color + '05' }}>
                      <span className="text-[10px] font-mono font-bold w-20 flex-shrink-0"
                        style={{ color: op.color }}>{op.op}</span>
                      <p className="text-[10px] text-gray-500">{op.desc}</p>
                    </div>
                  ))}
                </div>
              </SectionCard>
            </div>
          )}

          {/* ── Schema 演化 ── */}
          {activeIcebergTab === 'schema' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-[#6c5ce7]/20 bg-[#6c5ce7]/04 p-4">
                <div className="text-sm font-bold text-gray-800 mb-1">{icebergSource.schemaEvolution.title}</div>
                <div className="text-[10px] text-gray-500 mb-3">{icebergSource.schemaEvolution.desc}</div>
                <pre className="text-[8px] font-mono rounded-xl p-4 leading-relaxed overflow-x-auto"
                  style={{ background: '#6c5ce708', color: '#6c5ce7', border: '1px solid #6c5ce720' }}>
                  {icebergSource.schemaEvolution.code}
                </pre>
              </div>
              <SectionCard icon="✅" title="Schema 演化安全性" desc="">
                <div className="space-y-2">
                  {icebergSource.schemaEvolution.safeOps.map(op => (
                    <div key={op.op} className="flex items-center gap-3 rounded-xl border p-2.5"
                      style={{ borderColor: op.safe ? '#3fb95025' : '#e1705525', background: op.safe ? '#3fb95005' : '#e1705505' }}>
                      <span className="text-sm flex-shrink-0">{op.safe ? '✅' : '❌'}</span>
                      <span className="text-[10px] font-semibold w-20 flex-shrink-0"
                        style={{ color: op.safe ? '#3fb950' : '#e17055' }}>{op.op}</span>
                      <p className="text-[10px] text-gray-500">{op.desc}</p>
                    </div>
                  ))}
                </div>
              </SectionCard>
            </div>
          )}

          {/* ── 分区演化 ── */}
          {activeIcebergTab === 'partition' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-[#ffa657]/20 bg-[#ffa657]/04 p-4">
                <div className="text-sm font-bold text-gray-800 mb-1">{icebergSource.partitionEvolution.title}</div>
                <div className="text-[10px] text-gray-500 mb-3">{icebergSource.partitionEvolution.desc}</div>
                <pre className="text-[8px] font-mono rounded-xl p-4 leading-relaxed overflow-x-auto"
                  style={{ background: '#ffa65708', color: '#ffa657', border: '1px solid #ffa65720' }}>
                  {icebergSource.partitionEvolution.code}
                </pre>
              </div>
              <SectionCard icon="📂" title="分区 Transform 类型" desc="">
                <div className="space-y-2">
                  {icebergSource.partitionEvolution.transforms.map(t => (
                    <div key={t.name} className="rounded-xl border border-[#ffa657]/15 bg-[#ffa657]/04 p-3">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[10px] font-mono font-bold text-[#ffa657]">{t.name}</span>
                        <span className="text-[9px] font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{t.example}</span>
                      </div>
                      <p className="text-[10px] text-gray-500">{t.desc}</p>
                    </div>
                  ))}
                </div>
              </SectionCard>
            </div>
          )}

          {/* ── Compaction ── */}
          {activeIcebergTab === 'compaction' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-[#00cec9]/20 bg-[#00cec9]/04 p-4">
                <div className="text-sm font-bold text-gray-800 mb-1">{icebergSource.compaction.title}</div>
                <div className="text-[10px] text-gray-500 mb-3">{icebergSource.compaction.desc}</div>
                <pre className="text-[8px] font-mono rounded-xl p-4 leading-relaxed overflow-x-auto"
                  style={{ background: '#00cec908', color: '#00cec9', border: '1px solid #00cec920' }}>
                  {icebergSource.compaction.code}
                </pre>
              </div>
              <SectionCard icon="🗜️" title="Compaction 策略" desc="">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {icebergSource.compaction.strategies.map(s => (
                    <div key={s.name} className="rounded-xl border p-3"
                      style={{ borderColor: s.color + '25', background: s.color + '05' }}>
                      <div className="text-xs font-bold mb-1" style={{ color: s.color }}>{s.name}</div>
                      <p className="text-[10px] text-gray-500">{s.desc}</p>
                    </div>
                  ))}
                </div>
              </SectionCard>
              {/* Flink 小文件爆炸问题 */}
              {icebergSource.compaction.flinkSmallFileProblem && (() => {
                const fp = icebergSource.compaction.flinkSmallFileProblem;
                return (
                  <SectionCard icon="⚡" title={fp.title} desc={fp.problem}>
                    <div className="space-y-3">
                      <div>
                        <div className="text-[9px] font-semibold text-gray-500 mb-2">🔍 根因分析</div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {fp.rootCause.map((rc, i) => (
                            <div key={i} className="rounded-xl border border-red-100 bg-red-50/30 p-2.5">
                              <div className="text-xs mb-1">{rc.icon} <span className="font-bold text-red-600">{rc.cause}</span></div>
                              <p className="text-[9px] text-gray-500">{rc.desc}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="text-[9px] font-semibold text-gray-500 mb-2">🛠️ 解决方案对比</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {fp.solutions.map((sol, si) => (
                            <div key={si} className="rounded-xl border p-3"
                              style={{ borderColor: sol.color + '30', background: sol.color + '06' }}>
                              <div className="text-xs font-bold mb-2" style={{ color: sol.color }}>{sol.name}</div>
                              <ul className="space-y-1 mb-2">
                                {sol.items.map((item, ii) => (
                                  <li key={ii} className="text-[9px] text-gray-500">· {item}</li>
                                ))}
                              </ul>
                              {sol.code && (
                                <pre className="text-[7.5px] font-mono rounded-lg p-2 leading-relaxed overflow-x-auto mt-2"
                                  style={{ background: sol.color + '08', color: sol.color, border: `1px solid ${sol.color}20` }}>
                                  {sol.code}
                                </pre>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="rounded-xl border border-blue-100 bg-blue-50/30 p-3">
                        <div className="text-[9px] font-semibold text-blue-600 mb-1">📌 当前建议（2026 Q1）</div>
                        <p className="text-[9px] text-gray-600">{fp.currentStatus}</p>
                      </div>
                    </div>
                  </SectionCard>
                );
              })()}
            </div>
          )}

          {/* ── 行级删除 ── */}
          {activeIcebergTab === 'rowdelete' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-[#e17055]/20 bg-[#e17055]/04 p-4">
                <div className="text-sm font-bold text-gray-800 mb-1">{icebergSource.rowLevelOps.title}</div>
                <div className="text-[10px] text-gray-500 mb-3">{icebergSource.rowLevelOps.desc}</div>
              </div>
              {/* V2 vs V3 删除类型对比 */}
              <SectionCard icon="🗑️" title="V2 vs V3 删除机制对比" desc="">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {icebergSource.rowLevelOps.deleteTypes.map(d => (
                    <div key={d.type} className="rounded-xl border p-3"
                      style={{ borderColor: d.color + '25', background: d.color + '05' }}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold"
                          style={{ background: d.color + '20', color: d.color }}>{d.version}</span>
                        <span className="text-xs font-bold" style={{ color: d.color }}>{d.type}</span>
                      </div>
                      <p className="text-[9px] text-gray-500 mb-1">{d.desc}</p>
                      <span className="text-[8px] px-2 py-0.5 rounded-full"
                        style={{ background: d.color + '15', color: d.color }}>适用：{d.useCase}</span>
                    </div>
                  ))}
                </div>
              </SectionCard>
              {/* V2 实现代码 */}
              <SectionCard icon="📄" title="V2 底层实现" desc="Position Delete File + Equality Delete File">
                <pre className="text-[8px] font-mono rounded-xl p-4 leading-relaxed overflow-x-auto"
                  style={{ background: '#ffa65708', color: '#e17055', border: '1px solid #ffa65720' }}>
                  {icebergSource.rowLevelOps.v2Code}
                </pre>
              </SectionCard>
              {/* V3 DV 实现代码 */}
              <SectionCard icon="⚡" title="V3 Deletion Vector（DV）底层实现" desc="Roaring Bitmap 替代 Delete File，文件数不再线性增长">
                <pre className="text-[8px] font-mono rounded-xl p-4 leading-relaxed overflow-x-auto"
                  style={{ background: '#00b89408', color: '#00b894', border: '1px solid #00b89420' }}>
                  {icebergSource.rowLevelOps.v3Code}
                </pre>
              </SectionCard>
              {/* Compaction 说明 */}
              <SectionCard icon="🗜️" title="Compaction：V2 和 V3 共同的物化合并手段" desc="">
                <pre className="text-[8px] font-mono rounded-xl p-4 leading-relaxed overflow-x-auto"
                  style={{ background: '#6c5ce708', color: '#6c5ce7', border: '1px solid #6c5ce720' }}>
                  {icebergSource.rowLevelOps.compactionNote}
                </pre>
              </SectionCard>
            </div>
          )}

          {/* ── V3 读写流程 + Bloom Filter ── */}
          {activeIcebergTab === 'v3flow' && icebergSource.v3FlowAndBF && (() => {
            const v3 = icebergSource.v3FlowAndBF;
            return (
              <div className="space-y-4">
                {/* Bloom Filter 说明 */}
                <div className="rounded-2xl border border-[#00b894]/20 bg-[#00b894]/04 p-4">
                  <div className="text-sm font-bold text-gray-800 mb-1">🌸 Bloom Filter — 是什么/谁创建/是否必须</div>
                  <div className="text-[10px] text-gray-500 mb-3">{v3.bloomFilterDesc}</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                    {v3.bloomFilterUseCases.map((uc, i) => (
                      <div key={i} className={`rounded-xl border p-2.5 ${i===0?'border-green-100 bg-green-50/30':'border-red-100 bg-red-50/30'}`}>
                        <div className={`text-[9px] font-bold mb-1 ${i===0?'text-green-700':'text-red-600'}`}>{uc.label}</div>
                        {uc.cases.map((c, ci) => <div key={ci} className="text-[8px] text-gray-500">· {c}</div>)}
                      </div>
                    ))}
                  </div>
                  <pre className="text-[8px] font-mono rounded-xl p-3 leading-relaxed overflow-x-auto"
                    style={{ background: '#00b89408', color: '#00b894', border: '1px solid #00b89420' }}>
                    {v3.bloomFilterSetup}
                  </pre>
                </div>
                {/* BF 大小权衡表 */}
                <SectionCard icon="📊" title="Bloom Filter 误判率 vs 文件大小（100万行）" desc="">
                  <div className="overflow-x-auto">
                    <table className="w-full text-[9px]">
                      <thead><tr className="border-b border-gray-100">
                        <th className="text-left py-1 px-2 text-gray-400">误判率 FPP</th>
                        <th className="text-left py-1 px-2 text-gray-400">每 key 空间</th>
                        <th className="text-left py-1 px-2 text-gray-400">100万行大小</th>
                        <th className="text-left py-1 px-2 text-gray-400">备注</th>
                      </tr></thead>
                      <tbody>
                        {v3.bfSizeTable.map((row, i) => (
                          <tr key={i} className={`border-b border-gray-50 ${i===1?'bg-green-50/30 font-semibold':''}`}>
                            <td className="py-1 px-2 text-gray-700">{row.fpp}</td>
                            <td className="py-1 px-2 text-gray-500">{row.bytesPerKey} bytes</td>
                            <td className="py-1 px-2 text-gray-500">{row.size1M}</td>
                            <td className="py-1 px-2 text-gray-400">{row.note}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </SectionCard>
                {/* 写入流程 */}
                <SectionCard icon="✍️" title="Upsert 写入流程全解析" desc="V2 EqualityDelete 根本问题 + Spark V3 DV 写入（源码实证）+ Flink V3 DV 设计方向">
                  <pre className="text-[8px] font-mono rounded-xl p-4 leading-relaxed overflow-x-auto"
                    style={{ background: '#a29bfe08', color: '#6c5ce7', border: '1px solid #a29bfe20' }}>
                    {v3.writeFlowCode}
                  </pre>
                </SectionCard>
                {/* 读取流程 */}
                <SectionCard icon="🔍" title="V3 完整读取流程" desc="点查（BF 加速）+ 范围查询（列统计裁剪）">
                  <pre className="text-[8px] font-mono rounded-xl p-4 leading-relaxed overflow-x-auto"
                    style={{ background: '#00cec908', color: '#00cec9', border: '1px solid #00cec920' }}>
                    {v3.readFlowCode}
                  </pre>
                </SectionCard>
              </div>
            );
          })()}

          {/* ── 功能时间线 ── */}
          {activeIcebergTab === 'timeline' && icebergSource.icebergTimeline && (() => {
            const tl = icebergSource.icebergTimeline;
            return (
              <div className="space-y-4">
                <div className="rounded-2xl border border-[#74b9ff]/20 bg-[#74b9ff]/04 p-4">
                  <div className="text-sm font-bold text-gray-800 mb-1">📅 {tl.title}</div>
                  <div className="text-[10px] text-gray-500">{tl.desc}</div>
                </div>
                <div className="relative">
                  {/* 时间线竖线 */}
                  <div className="absolute left-[72px] top-0 bottom-0 w-px bg-gray-200" />
                  <div className="space-y-4">
                    {tl.events.map((ev, ei) => (
                      <div key={ei} className="flex gap-4">
                        {/* 日期+版本 */}
                        <div className="w-[68px] flex-shrink-0 text-right">
                          <div className="text-[9px] font-bold" style={{ color: ev.color }}>{ev.date}</div>
                          <div className="text-[8px] text-gray-400 leading-tight">{ev.version}</div>
                        </div>
                        {/* 圆点 */}
                        <div className="flex-shrink-0 w-3 h-3 rounded-full border-2 mt-1 z-10"
                          style={{ borderColor: ev.color, background: ev.color + '30' }} />
                        {/* 内容 */}
                        <div className="flex-1 pb-2">
                          {ev.highlights.map((h, hi) => (
                            <div key={hi} className="mb-1.5 rounded-lg border p-2"
                              style={{ borderColor: ev.color + '20', background: ev.color + '06' }}>
                              <div className="text-[9px] font-bold mb-0.5" style={{ color: ev.color }}>{h.name}</div>
                              <div className="text-[8px] text-gray-500">{h.desc}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ── Flink 集成 🆕 ── */}
          {activeIcebergTab === 'flink' && icebergSource.flinkIntegration && (() => {
            const fi = icebergSource.flinkIntegration;
            return (
              <div className="space-y-4">
                {/* 总览 */}
                <div className="rounded-2xl border border-[#00b894]/20 bg-[#00b894]/04 p-4">
                  <div className="text-sm font-bold text-gray-800 mb-1">🔗 {fi.title}</div>
                  <div className="text-[10px] text-gray-500">{fi.desc}</div>
                </div>

                {/* 1. FlinkSink vs IcebergSink 对比 */}
                <SectionCard icon="⚖️" title={fi.sinkComparison.title} desc={fi.sinkComparison.desc}>
                  <div className="overflow-x-auto mb-3">
                    <table className="w-full text-[9px]">
                      <thead><tr className="border-b border-gray-100">
                        <th className="text-left py-1.5 px-2 text-gray-400">维度</th>
                        <th className="text-left py-1.5 px-2 text-gray-500 font-semibold">FlinkSink（V1）</th>
                        <th className="text-left py-1.5 px-2 font-semibold text-[#00b894]">IcebergSink（V2）</th>
                      </tr></thead>
                      <tbody>
                        {fi.sinkComparison.rows.map((row, i) => (
                          <tr key={i} className={`border-b border-gray-50 ${row.highlight ? 'bg-green-50/30' : ''}`}>
                            <td className="py-1.5 px-2 font-semibold text-gray-600">{row.dim}</td>
                            <td className="py-1.5 px-2 text-gray-400">{row.v1}</td>
                            <td className="py-1.5 px-2 text-[#00b894] font-medium">{row.v2}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <pre className="text-[8px] font-mono rounded-xl p-3 leading-relaxed overflow-x-auto"
                    style={{ background: '#00b89408', color: '#00b894', border: '1px solid #00b89420' }}>
                    {fi.sinkComparison.v2CompactCode}
                  </pre>
                </SectionCard>

                {/* 2. 分布模式 */}
                <SectionCard icon="🔀" title={fi.distributionMode.title} desc={fi.distributionMode.desc}>
                  <div className="space-y-3 mb-2">
                    {fi.distributionMode.modes.map(m => (
                      <div key={m.name} className="rounded-xl border p-3"
                        style={{ borderColor: m.color + '30', background: m.color + '06' }}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded"
                            style={{ background: m.color + '20', color: m.color }}>{m.name}</span>
                          <span className="text-[9px] text-gray-500">{m.useCase}</span>
                        </div>
                        <p className="text-[9px] text-gray-500 mb-2">{m.desc}</p>
                        <pre className="text-[8px] font-mono rounded-lg p-2 leading-relaxed overflow-x-auto"
                          style={{ background: m.color + '08', color: m.color, border: `1px solid ${m.color}20` }}>
                          {m.code}
                        </pre>
                      </div>
                    ))}
                  </div>
                  <div className="text-[9px] text-gray-400 rounded-lg border border-gray-100 p-2">
                    💡 {fi.distributionMode.statisticsNote}
                  </div>
                </SectionCard>

                {/* 3. Upsert / CDC 写入 */}
                <SectionCard icon="🔄" title={fi.upsertCdc.title} desc={fi.upsertCdc.desc}>
                  <pre className="text-[8px] font-mono rounded-xl p-3 leading-relaxed overflow-x-auto mb-3"
                    style={{ background: '#6c5ce708', color: '#6c5ce7', border: '1px solid #6c5ce720' }}>
                    {fi.upsertCdc.code}
                  </pre>
                  <div className="overflow-x-auto mb-2">
                    <table className="w-full text-[9px]">
                      <thead><tr className="border-b border-gray-100">
                        <th className="text-left py-1 px-2 text-gray-400">RowKind</th>
                        <th className="text-left py-1 px-2 text-gray-400">upsert=true 行为</th>
                        <th className="text-left py-1 px-2 text-gray-400">Delete 类型</th>
                      </tr></thead>
                      <tbody>
                        {fi.upsertCdc.writeLogic.map((row, i) => (
                          <tr key={i} className="border-b border-gray-50">
                            <td className="py-1 px-2 font-mono font-bold text-[8px]" style={{ color: row.color }}>{row.rowKind}</td>
                            <td className="py-1 px-2 text-gray-500">{row.upsertBehavior}</td>
                            <td className="py-1 px-2 text-gray-400">{row.deleteType}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="text-[9px] text-amber-600 rounded-lg border border-amber-100 bg-amber-50/30 p-2">
                    ⚠️ {fi.upsertCdc.keyInsight}
                  </div>
                </SectionCard>

                {/* 4. DynamicIcebergSink */}
                <SectionCard icon="🔀" title={fi.dynamicSink.title} desc={fi.dynamicSink.desc}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                    {fi.dynamicSink.highlights.map((h, i) => (
                      <div key={i} className="rounded-xl border border-[#fd79a8]/20 bg-[#fd79a8]/04 p-2.5">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-sm">{h.icon}</span>
                          <span className="text-[9px] font-bold text-gray-700">{h.name}</span>
                        </div>
                        <p className="text-[8px] text-gray-500">{h.desc}</p>
                      </div>
                    ))}
                  </div>
                  <pre className="text-[8px] font-mono rounded-xl p-3 leading-relaxed overflow-x-auto mb-2"
                    style={{ background: '#fd79a808', color: '#e84393', border: '1px solid #fd79a820' }}>
                    {fi.dynamicSink.code}
                  </pre>
                  <div className="space-y-1">
                    {fi.dynamicSink.limitations.map((l, i) => (
                      <div key={i} className="text-[8px] text-gray-400 flex items-start gap-1">
                        <span className="text-amber-400 flex-shrink-0">⚠</span>{l}
                      </div>
                    ))}
                  </div>
                </SectionCard>

                {/* 5. Dynamic Table SQL */}
                <SectionCard icon="📋" title={fi.dynamicTable.title} desc={fi.dynamicTable.desc}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                    {fi.dynamicTable.sourceCapabilities.map((cap, i) => (
                      <div key={i} className="rounded-xl border border-[#74b9ff]/20 bg-[#74b9ff]/04 p-2.5">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-sm">{cap.icon}</span>
                          <span className="text-[9px] font-bold text-[#74b9ff]">{cap.name}</span>
                        </div>
                        <p className="text-[8px] text-gray-500">{cap.desc}</p>
                      </div>
                    ))}
                  </div>
                  <pre className="text-[8px] font-mono rounded-xl p-3 leading-relaxed overflow-x-auto mb-3"
                    style={{ background: '#74b9ff08', color: '#0984e3', border: '1px solid #74b9ff20' }}>
                    {fi.dynamicTable.sqlExample}
                  </pre>
                  <div className="space-y-1.5">
                    {fi.dynamicTable.sourceSwitch.map((s, i) => (
                      <div key={i} className="rounded-lg border border-gray-100 p-2 flex items-start gap-2">
                        <span className="text-[8px] font-mono text-gray-400 flex-shrink-0">{i === 0 ? '默认' : 'FLIP-27'}</span>
                        <div>
                          <div className="text-[8px] font-mono text-gray-600">{s.config}</div>
                          <div className="text-[8px] text-gray-400">{s.impl} — {s.note}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              </div>
            );
          })()}

          {/* ── PyIceberg ── */}

          {activeIcebergTab === 'pyiceberg' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-[#3fb950]/20 bg-[#3fb950]/04 p-4">
                <div className="text-sm font-bold text-gray-800 mb-1">{icebergSource.pyicebergApi.title}</div>
                <div className="text-[10px] text-gray-500 mb-3">{icebergSource.pyicebergApi.desc}</div>
                <pre className="text-[8px] font-mono rounded-xl p-4 leading-relaxed overflow-x-auto"
                  style={{ background: '#3fb95008', color: '#3fb950', border: '1px solid #3fb95020' }}>
                  {icebergSource.pyicebergApi.code}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
// ─────────────────────────────────────────────────────────────
// 4. 数据流水线
// ─────────────────────────────────────────────────────────────
function PipelineTab() {
  const { dagOverview, stages, airflowConfig, airflowSource } = PIPELINE_DATA;
  const [activeSubTab, setActiveSubTab] = useState('dag');
  const [activeSourceTab, setActiveSourceTab] = useState('overview');

  const SUB_TABS = [
    { id: 'dag',     label: 'DAG 流水线', icon: '🌊' },
    { id: 'source',  label: 'Airflow 源码', icon: '🔬' },
  ];

  const SOURCE_TABS = [
    { id: 'overview',    label: '架构总览',    icon: '🏗️' },
    { id: 'scheduler',   label: 'Scheduler',  icon: '⏰' },
    { id: 'executor',    label: 'K8s Executor', icon: '🚀' },
    { id: 'dag_def',     label: 'DAG 定义',   icon: '📄' },
    { id: 'deferrable',  label: 'Deferrable', icon: '⚡' },
    { id: 'plugin',      label: 'Plugin 扩展', icon: '🔌' },
    { id: 'observ',      label: '监控告警',   icon: '📊' },
  ];

  return (
    <div className="space-y-4">
      {/* Sub Tab 切换 */}
      <div className="flex gap-2">
        {SUB_TABS.map(t => (
          <button key={t.id} onClick={() => setActiveSubTab(t.id)}
            className="text-xs px-4 py-1.5 rounded-full border transition-all font-medium"
            style={{
              background: activeSubTab === t.id ? '#fd79a8' : 'transparent',
              color: activeSubTab === t.id ? '#fff' : '#64748b',
              borderColor: activeSubTab === t.id ? '#fd79a8' : '#e2e8f0',
            }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── DAG 流水线 ── */}
      {activeSubTab === 'dag' && (
        <div className="space-y-4">
          {/* DAG 概览 */}
          <div className="rounded-2xl border border-[#fd79a8]/20 bg-[#fd79a8]/5 p-5">
            <div className="text-xs font-semibold text-gray-700 mb-3">🌊 Airflow DAG 概览</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.entries(dagOverview).map(([key, value]) => {
                const labels = { name: 'DAG 名称', schedule: '调度策略', executor: '执行器', concurrency: '并发数', retries: '重试次数', sla: 'SLA' };
                return (
                  <div key={key} className="rounded-lg border border-[#fd79a8]/20 bg-white/80 p-2.5">
                    <div className="text-[9px] text-gray-400 mb-0.5">{labels[key] || key}</div>
                    <div className="text-[10px] font-mono text-gray-700">{value}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 流水线阶段 */}
          <SectionCard icon="⚙️" title="数据处理流水线" desc="7 阶段全容器化 DAG，从原始数据到训练就绪">
            <div className="space-y-3">
              {stages.map((s, i) => (
                <div key={s.id}>
                  <div className="rounded-xl border p-4"
                    style={{ borderColor: s.color + '33', background: s.color + '04' }}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold" style={{ color: s.color }}>{s.name}</span>
                        <Badge color={s.color}>{s.image}</Badge>
                      </div>
                      <span className="text-[10px] font-mono text-gray-400">{s.duration}</span>
                    </div>
                    <p className="text-[10px] text-gray-500 mb-2">{s.input} → {s.output}</p>
                    <div className="flex items-center gap-4 text-[9px] text-gray-400 font-mono flex-wrap">
                      <span>CPU: {s.resources.cpu}</span>
                      <span>MEM: {s.resources.mem}</span>
                      {s.resources.gpu !== '-' && <span className="text-[#3fb950]">GPU: {s.resources.gpu}</span>}
                      <span>×{s.resources.replicas}</span>
                      <div className="flex items-center gap-1 ml-auto flex-wrap justify-end">
                        {s.tech.map(t => (
                          <span key={t} className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">{t}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  {i < stages.length - 1 && (
                    <div className="text-center text-[9px] text-gray-300 py-1">↓</div>
                  )}
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Airflow 配置 */}
          <div className="rounded-2xl border border-[#fd79a8]/20 bg-[#fd79a8]/5 p-5">
            <div className="text-xs font-semibold text-gray-700 mb-3">☸️ Airflow on K8s 配置</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {Object.entries(airflowConfig).map(([key, value]) => (
                <div key={key} className="rounded-lg border border-[#fd79a8]/20 bg-white/80 p-2.5">
                  <div className="text-[9px] text-gray-400 mb-0.5">{key}</div>
                  <div className="text-[10px] text-gray-700">{value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Airflow 源码解析 ── */}
      {activeSubTab === 'source' && (
        <div className="space-y-4">
          {/* 定位说明 */}
          <div className="rounded-2xl border border-[#fd79a8]/20 bg-[#fd79a8]/04 p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🔬</span>
              <div>
                <div className="text-sm font-bold text-gray-800 mb-1">{airflowSource.overview.title}</div>
                <div className="text-[10px] text-gray-500 leading-relaxed mb-2">{airflowSource.overview.desc}</div>
                <div className="flex flex-wrap gap-2">
                  <span className="text-[9px] px-2 py-0.5 rounded-full font-mono"
                    style={{ background: '#fd79a820', color: '#fd79a8', border: '1px solid #fd79a830' }}>
                    v{airflowSource.overview.version}
                  </span>
                  <a href={airflowSource.overview.repoUrl} target="_blank" rel="noopener noreferrer"
                    className="text-[9px] px-2 py-0.5 rounded-full font-mono"
                    style={{ background: '#fd79a820', color: '#fd79a8', border: '1px solid #fd79a830' }}>
                    GitHub ↗
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Source Sub Tab 切换 */}
          <div className="flex gap-1.5 flex-wrap">
            {SOURCE_TABS.map(t => (
              <button key={t.id} onClick={() => setActiveSourceTab(t.id)}
                className="text-xs px-3 py-1.5 rounded-full border transition-all"
                style={{
                  background: activeSourceTab === t.id ? '#fd79a8' : 'transparent',
                  color: activeSourceTab === t.id ? '#fff' : '#64748b',
                  borderColor: activeSourceTab === t.id ? '#fd79a8' : '#e2e8f0',
                }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {/* ── 架构总览 ── */}
          {activeSourceTab === 'overview' && (
            <div className="space-y-3">
              {airflowSource.overview.coreComponents.map(comp => (
                <div key={comp.name} className="rounded-2xl border p-4"
                  style={{ borderColor: comp.color + '30', background: comp.color + '05' }}>
                  <div className="flex items-start gap-3 mb-3">
                    <span className="text-2xl flex-shrink-0">{comp.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-sm font-bold text-gray-800">{comp.name}</span>
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded"
                          style={{ background: comp.color + '15', color: comp.color }}>
                          {comp.keyClass}
                        </span>
                      </div>
                      <div className="text-[9px] font-mono text-gray-400 mb-1">{comp.file}</div>
                      <p className="text-[10px] text-gray-500 leading-relaxed">{comp.desc}</p>
                    </div>
                  </div>
                  {/* 核心方法 */}
                  <div className="rounded-lg border border-gray-100 bg-white/80 p-2 mb-2">
                    <span className="text-[9px] text-gray-400">核心方法：</span>
                    <span className="text-[9px] font-mono font-semibold ml-1" style={{ color: comp.color }}>{comp.keyMethod}</span>
                  </div>
                  {/* 执行流程 */}
                  <div className="flex flex-wrap gap-1.5 items-center">
                    {comp.flow.map((step, i) => (
                      <div key={i} className="flex items-center gap-1">
                        <span className="text-[9px] px-2 py-0.5 rounded-full"
                          style={{ background: comp.color + '12', color: comp.color, border: `1px solid ${comp.color}25` }}>
                          {step}
                        </span>
                        {i < comp.flow.length - 1 && <span className="text-gray-200 text-xs">→</span>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Scheduler 调度循环 ── */}
          {activeSourceTab === 'scheduler' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-[#6c5ce7]/20 bg-[#6c5ce7]/04 p-4">
                <div className="text-sm font-bold text-gray-800 mb-1">{airflowSource.schedulerLoop.title}</div>
                <div className="text-[10px] text-gray-500 mb-3">{airflowSource.schedulerLoop.desc}</div>
                <pre className="text-[8px] font-mono rounded-xl p-4 leading-relaxed overflow-x-auto"
                  style={{ background: '#6c5ce708', color: '#6c5ce7', border: '1px solid #6c5ce720' }}>
                  {airflowSource.schedulerLoop.code}
                </pre>
              </div>
              {/* TaskInstance 状态机 */}
              <SectionCard icon="🔄" title="TaskInstance 状态机" desc="Scheduler 驱动 TI 在各状态间流转">
                <div className="space-y-2">
                  {airflowSource.schedulerLoop.stateTransitions.map((t, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-xl border p-2.5"
                      style={{ borderColor: t.color + '25', background: t.color + '05' }}>
                      <span className="text-[9px] font-mono font-semibold w-24 flex-shrink-0 text-right"
                        style={{ color: t.color }}>{t.from}</span>
                      <span className="text-gray-200">→</span>
                      <span className="text-[9px] font-mono font-bold w-24 flex-shrink-0"
                        style={{ color: t.color }}>{t.to}</span>
                      <span className="text-[9px] text-gray-400 flex-1">{t.trigger}</span>
                    </div>
                  ))}
                </div>
              </SectionCard>
            </div>
          )}

          {/* ── KubernetesExecutor ── */}
          {activeSourceTab === 'executor' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-[#00cec9]/20 bg-[#00cec9]/04 p-4">
                <div className="text-sm font-bold text-gray-800 mb-1">{airflowSource.kubernetesExecutor.title}</div>
                <div className="text-[10px] text-gray-500 mb-3">{airflowSource.kubernetesExecutor.desc}</div>
                <pre className="text-[8px] font-mono rounded-xl p-4 leading-relaxed overflow-x-auto"
                  style={{ background: '#00cec908', color: '#00cec9', border: '1px solid #00cec920' }}>
                  {airflowSource.kubernetesExecutor.code}
                </pre>
              </div>
              {/* Pod Spec 关键字段 */}
              <SectionCard icon="☸️" title={airflowSource.kubernetesExecutor.podSpec.title} desc="">
                <div className="overflow-x-auto mb-4">
                  <table className="w-full text-[9px]">
                    <thead>
                      <tr className="border-b border-gray-100">
                        {['字段', '值', '说明'].map(h => (
                          <th key={h} className="text-left py-1.5 px-2 text-gray-400 font-medium">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {airflowSource.kubernetesExecutor.podSpec.fields.map((f, i) => (
                        <tr key={f.field} className={`border-b border-gray-50 ${i%2===0?'bg-gray-50/20':''}`}>
                          <td className="py-1.5 px-2 font-mono font-semibold text-[#00cec9]">{f.field}</td>
                          <td className="py-1.5 px-2 font-mono text-gray-500 text-[8px]">{f.value}</td>
                          <td className="py-1.5 px-2 text-gray-500">{f.desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="text-[9px] font-semibold text-gray-600 mb-2">📋 executor_config 示例（Task 级资源覆盖）</div>
                <pre className="text-[8px] font-mono rounded-xl p-3 leading-relaxed overflow-x-auto"
                  style={{ background: '#00cec908', color: '#00cec9', border: '1px solid #00cec920' }}>
                  {airflowSource.kubernetesExecutor.executorConfig}
                </pre>
              </SectionCard>
            </div>
          )}

          {/* ── DAG 定义 ── */}
          {activeSourceTab === 'dag_def' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-[#fd79a8]/20 bg-[#fd79a8]/04 p-4">
                <div className="text-sm font-bold text-gray-800 mb-1">{airflowSource.dagDefinition.title}</div>
                <div className="text-[10px] text-gray-500 mb-4">{airflowSource.dagDefinition.desc}</div>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <div className="text-[10px] font-semibold text-gray-600 mb-2">📌 传统写法（Operator + XCom）</div>
                    <pre className="text-[8px] font-mono rounded-xl p-3 leading-relaxed overflow-x-auto"
                      style={{ background: '#64748b08', color: '#64748b', border: '1px solid #64748b20' }}>
                      {airflowSource.dagDefinition.traditional}
                    </pre>
                  </div>
                  <div>
                    <div className="text-[10px] font-semibold text-[#fd79a8] mb-2">✅ TaskFlow API（推荐，Airflow 2.0+）</div>
                    <pre className="text-[8px] font-mono rounded-xl p-3 leading-relaxed overflow-x-auto"
                      style={{ background: '#fd79a808', color: '#fd79a8', border: '1px solid #fd79a820' }}>
                      {airflowSource.dagDefinition.taskflow}
                    </pre>
                  </div>
                </div>
              </div>
              {/* XCom 说明 */}
              <SectionCard icon="📦" title="XCom 任务间数据传递" desc="">
                <div className="space-y-2">
                  {airflowSource.dagDefinition.xcoms.map((x, i) => (
                    <div key={i} className="rounded-xl border border-[#fd79a8]/15 bg-[#fd79a8]/04 p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[9px] font-mono font-bold text-[#fd79a8]">{x.key}</span>
                      </div>
                      <div className="text-[10px] text-gray-500 mb-1">{x.desc}</div>
                      <div className="text-[8px] font-mono text-gray-400 bg-gray-50 rounded px-2 py-1">{x.example}</div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            </div>
          )}

          {/* ── Deferrable Operator ── */}
          {activeSourceTab === 'deferrable' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-[#79c0ff]/20 bg-[#79c0ff]/04 p-4">
                <div className="text-sm font-bold text-gray-800 mb-1">{airflowSource.deferrable.title}</div>
                <div className="text-[10px] text-gray-500 mb-3">{airflowSource.deferrable.desc}</div>
                <pre className="text-[8px] font-mono rounded-xl p-4 leading-relaxed overflow-x-auto"
                  style={{ background: '#79c0ff08', color: '#79c0ff', border: '1px solid #79c0ff20' }}>
                  {airflowSource.deferrable.code}
                </pre>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {airflowSource.deferrable.benefits.map(b => (
                  <div key={b.title} className="rounded-xl border border-[#79c0ff]/20 bg-[#79c0ff]/04 p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base">{b.icon}</span>
                      <span className="text-xs font-semibold text-gray-700">{b.title}</span>
                    </div>
                    <p className="text-[10px] text-gray-500">{b.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Plugin 扩展 ── */}
          {activeSourceTab === 'plugin' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-[#ffa657]/20 bg-[#ffa657]/04 p-4">
                <div className="text-sm font-bold text-gray-800 mb-1">{airflowSource.plugins.title}</div>
                <div className="text-[10px] text-gray-500 mb-3">{airflowSource.plugins.desc}</div>
                <pre className="text-[8px] font-mono rounded-xl p-4 leading-relaxed overflow-x-auto"
                  style={{ background: '#ffa65708', color: '#ffa657', border: '1px solid #ffa65720' }}>
                  {airflowSource.plugins.code}
                </pre>
              </div>
              <SectionCard icon="📦" title="常用 Provider 包" desc="apache-airflow-providers-* 系列">
                <div className="space-y-2">
                  {airflowSource.plugins.builtinPlugins.map(p => (
                    <div key={p.name} className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/30 p-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <span className="text-[10px] font-bold font-mono text-[#ffa657]">{p.name}</span>
                          <span className="text-[8px] font-mono text-gray-400">{p.pkg}</span>
                        </div>
                        <p className="text-[10px] text-gray-500">{p.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            </div>
          )}

          {/* ── 监控告警 ── */}
          {activeSourceTab === 'observ' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-[#3fb950]/20 bg-[#3fb950]/04 p-4">
                <div className="text-sm font-bold text-gray-800 mb-1">{airflowSource.observability.title}</div>
                <div className="text-[10px] text-gray-500 mb-4">{airflowSource.observability.desc}</div>
                {/* 指标表 */}
                <div className="overflow-x-auto mb-4">
                  <table className="w-full text-[9px]">
                    <thead>
                      <tr className="border-b border-gray-100">
                        {['指标名', '类型', '含义'].map(h => (
                          <th key={h} className="text-left py-1.5 px-2 text-gray-400 font-medium">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {airflowSource.observability.metrics.map((m, i) => (
                        <tr key={m.metric} className={`border-b border-gray-50 ${i%2===0?'bg-gray-50/20':''}`}>
                          <td className="py-1.5 px-2 font-mono text-[#3fb950] text-[8px]">{m.metric}</td>
                          <td className="py-1.5 px-2">
                            <span className="text-[8px] px-1.5 py-0.5 rounded font-mono"
                              style={{ background: '#3fb95015', color: '#3fb950' }}>{m.type}</span>
                          </td>
                          <td className="py-1.5 px-2 text-gray-500">{m.desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* 告警规则 */}
                <div className="text-[10px] font-semibold text-gray-600 mb-2">🚨 告警规则</div>
                <div className="space-y-2">
                  {airflowSource.observability.alertRules.map(r => (
                    <div key={r.name} className="rounded-xl border border-[#3fb950]/15 bg-[#3fb950]/04 p-3">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[10px] font-semibold text-gray-700">{r.name}</span>
                        <span className="text-[8px] font-mono px-1.5 py-0.5 rounded"
                          style={{ background: '#e1705515', color: '#e17055' }}>{r.condition}</span>
                      </div>
                      <div className="text-[9px] text-gray-400">→ {r.action}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 5. MLOps 实验
// ─────────────────────────────────────────────────────────────
function MLOpsTab() {
  const { experimentPlatform, cicd, abTesting, modelRegistry } = MLOPS_DATA;
  const [activeSubTab, setActiveSubTab] = useState('practice');

  const SUB_TABS = [
    { id: 'practice', label: '平台实践', icon: '🧪' },
    { id: 'source',   label: '源码解析', icon: '🔬' },
  ];

  return (
    <div className="space-y-4">
      {/* Sub Tab 切换 */}
      <div className="flex gap-1.5 flex-wrap">
        {SUB_TABS.map(t => (
          <button key={t.id} onClick={() => setActiveSubTab(t.id)}
            className="text-xs px-3 py-1.5 rounded-full border transition-all"
            style={{
              background: activeSubTab === t.id ? '#3fb950' : 'transparent',
              color: activeSubTab === t.id ? '#fff' : '#64748b',
              borderColor: activeSubTab === t.id ? '#3fb950' : '#e2e8f0',
            }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* 平台实践 */}
      {activeSubTab === 'practice' && (
        <div className="space-y-4">
          {/* 实验追踪 */}
          <SectionCard icon="📈" title="实验追踪 & 模型管理" desc={experimentPlatform.tracking.name}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
              {experimentPlatform.tracking.features.map(f => (
                <div key={f.name} className="flex items-start gap-2 rounded-xl border border-gray-100 bg-gray-50/30 p-3">
                  <span className="text-sm flex-shrink-0">{f.icon}</span>
                  <div>
                    <div className="text-xs font-semibold text-gray-700">{f.name}</div>
                    <div className="text-[10px] text-gray-500">{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 pt-3">
              <div className="text-[10px] font-semibold text-gray-600 mb-2">🏷️ {experimentPlatform.dataVersion.name}</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {experimentPlatform.dataVersion.features.map(f => (
                  <div key={f.name} className="flex items-start gap-2 rounded-xl border border-gray-100 bg-gray-50/30 p-3">
                    <span className="text-sm flex-shrink-0">{f.icon}</span>
                    <div>
                      <div className="text-xs font-semibold text-gray-700">{f.name}</div>
                      <div className="text-[10px] text-gray-500">{f.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </SectionCard>

          {/* CI/CD */}
          <SectionCard icon="🔄" title="CI/CD 流水线" desc="从代码提交到模型上线的自动化流程">
            <div className="space-y-2">
              {cicd.stages.map((s, i) => (
                <div key={s.name} className="flex items-center gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-[#3fb950]/10 border border-[#3fb950]/30 flex items-center justify-center text-sm flex-shrink-0">
                      {s.icon}
                    </div>
                    {i < cicd.stages.length - 1 && <div className="w-px h-4 bg-[#3fb950]/20 mt-1" />}
                  </div>
                  <div className="flex-1 rounded-xl border border-gray-100 bg-gray-50/30 p-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-700">{s.name}</span>
                      <span className="text-[10px] text-gray-500">{s.desc}</span>
                      <Badge color="#3fb950">{s.tool}</Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* A/B 测试 */}
          <SectionCard icon="🚦" title="A/B 测试 & 灰度发布" desc={`策略: ${abTesting.strategy}`}>
            <div className="space-y-2">
              {abTesting.steps.map(s => {
                const phaseColors = { Shadow: '#6c5ce7', 'Canary 1%': '#ffa657', 'Canary 5%': '#fd79a8', 'Canary 20%': '#00cec9', 'Full Rollout': '#3fb950' };
                return (
                  <div key={s.phase} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/30 p-3">
                    <Badge color={phaseColors[s.phase] || '#6c5ce7'}>{s.phase}</Badge>
                    <span className="text-[10px] font-mono text-gray-600 w-16">{s.traffic}</span>
                    <span className="text-[10px] text-gray-400 w-12">{s.duration}</span>
                    <span className="text-[10px] text-gray-500 flex-1">{s.criteria}</span>
                  </div>
                );
              })}
            </div>
          </SectionCard>

          {/* 模型注册表 */}
          <SectionCard icon="📦" title="模型注册表" desc="所有模型版本的统一管理">
            <div className="space-y-2">
              {modelRegistry.map(m => {
                const statusColors = { active: '#3fb950', testing: '#ffa657', archived: '#94a3b8' };
                const stageColors = { Production: '#3fb950', Staging: '#ffa657', Archived: '#94a3b8' };
                return (
                  <div key={m.name} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/30 p-3">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: statusColors[m.status] }} />
                    <span className="text-xs font-mono font-semibold text-gray-700 flex-1 min-w-0 truncate">{m.name}</span>
                    <Badge color={stageColors[m.stage]}>{m.stage}</Badge>
                    <span className="text-[9px] font-mono text-gray-400 hidden sm:inline">{m.metrics}</span>
                    <span className="text-[9px] text-gray-300">{m.date}</span>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        </div>
      )}

      {/* MLflow 源码解析 */}
      {activeSubTab === 'source' && (
        <div className="space-y-4">
          {/* 仓库概览 */}
          <SectionCard icon="📦" title="仓库概览" desc="mlflow/mlflow · GitHub · Apache-2.0 · 全球最流行的 MLOps 开源平台">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {[
                { label: 'Stars', value: '19k+', icon: '⭐', color: '#f39c12' },
                { label: 'Commits', value: '11,915+', icon: '📝', color: '#6c5ce7' },
                { label: '主语言', value: 'Python', icon: '🐍', color: '#3fb950' },
                { label: '最新版本', value: 'v3.11.1', icon: '🏷️', color: '#e84393' },
              ].map(m => (
                <div key={m.label} className="rounded-xl border border-gray-100 bg-gray-50/50 p-3 text-center">
                  <div className="text-lg mb-1">{m.icon}</div>
                  <div className="text-sm font-bold font-mono" style={{ color: m.color }}>{m.value}</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">{m.label}</div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {['Python', 'TypeScript', 'Java', 'R', 'Scala', 'Shell'].map(lang => (
                <span key={lang} className="text-[9px] px-2 py-0.5 rounded-full font-mono bg-gray-100 text-gray-500">{lang}</span>
              ))}
            </div>
          </SectionCard>

          {/* 顶层目录结构 */}
          <SectionCard icon="🗂️" title="顶层目录结构" desc="Python 为主体，支持 50+ ML 框架集成，近年大幅扩展 LLM/Agent 能力">
            <pre className="text-[10px] leading-[1.6] text-gray-700 bg-gray-50 border border-gray-200 p-4 rounded-xl overflow-x-auto font-mono whitespace-pre">{`mlflow/
├── mlflow/                    # 核心 Python 包
│   ├── tracking/              # 实验追踪（核心模块）
│   │   ├── client.py          # MlflowClient 主入口
│   │   ├── fluent.py          # mlflow.log_metric() 等顶层 API
│   │   ├── _tracking_service/ # TrackingService 抽象层
│   │   └── _model_registry/   # 模型注册服务
│   ├── store/                 # 存储后端抽象
│   │   ├── tracking/          # 实验数据存储（SQLAlchemy / FileStore）
│   │   ├── model_registry/    # 模型注册存储
│   │   ├── artifact/          # Artifact 存储（S3/GCS/ADLS/HDFS）
│   │   ├── _unity_catalog/    # Unity Catalog 后端适配
│   │   └── db_migrations/     # Alembic 数据库迁移脚本
│   ├── models/                # MLflow Model 格式 & Flavor 系统
│   ├── entities/              # 数据模型（Run/Experiment/Metric 等）
│   ├── tracing/               # LLM 追踪（2024 新增，核心增长点）
│   ├── evaluation/            # 模型评估框架
│   ├── deployments/           # 模型部署（REST API / Kubernetes）
│   ├── server/                # MLflow Tracking Server（Flask）
│   ├── gateway/               # AI Gateway（LLM 统一代理）
│   ├── mcp/                   # MCP Server 集成（2025 新增）
│   │
│   ├── # ── LLM/Agent 框架集成（近年大幅扩展）──
│   ├── langchain/             # LangChain 自动追踪
│   ├── openai/                # OpenAI API 追踪
│   ├── anthropic/             # Anthropic Claude 追踪
│   ├── gemini/                # Google Gemini 追踪
│   ├── llama_index/           # LlamaIndex 追踪
│   ├── ag2/ agno/ crewai/     # Multi-Agent 框架追踪
│   ├── smolagents/ strands/   # 新兴 Agent 框架
│   │
│   ├── # ── 传统 ML 框架集成 ──
│   ├── sklearn/ pytorch/ tensorflow/ keras/
│   ├── xgboost/ lightgbm/ catboost/ statsmodels/
│   └── spark/ pyspark/ transformers/ diffusers/
│
├── tests/                     # 测试套件（与 mlflow/ 目录镜像）
├── docs/                      # 文档（MkDocs）
└── requirements/              # 依赖管理（按功能分文件）`}</pre>
          </SectionCard>

          {/* 核心模块解析 */}
          <SectionCard icon="🔍" title="核心模块深度解析" desc="从实验记录到模型部署的完整链路">
            <div className="space-y-3">
              {[
                {
                  module: 'tracking/ — 实验追踪核心',
                  path: 'mlflow/tracking/',
                  role: '最核心模块',
                  color: '#3fb950',
                  desc: 'MLflow 的核心价值所在。fluent.py 提供 mlflow.start_run() / log_metric() 等顶层 API，client.py 提供 MlflowClient 面向对象接口。底层通过 TrackingServiceInterface 抽象，支持本地文件、SQLAlchemy 数据库、远程 REST Server 三种后端。',
                  keyPoints: [
                    'fluent.py：mlflow.start_run() 创建 Run 上下文，自动记录 Git commit / 环境信息',
                    'client.py：MlflowClient 封装所有 REST API 调用，支持 async 模式（v3.11 新增）',
                    '_tracking_service/：TrackingServiceInterface 抽象，RestStore / SqlAlchemyStore / FileStore 三种实现',
                    'context/：自动检测 Databricks / GitHub Actions / Kubernetes 运行环境',
                    'request_auth/：支持 Bearer Token / Basic Auth / Databricks PAT 认证',
                  ],
                },
                {
                  module: 'store/ — 存储后端抽象',
                  path: 'mlflow/store/',
                  role: '多后端存储',
                  color: '#6c5ce7',
                  desc: '存储层完全抽象，支持多种后端。tracking/ 存实验元数据，artifact/ 存模型文件和大型 Artifact，model_registry/ 存模型版本信息。_unity_catalog/ 是 Databricks UC 的专用适配器。',
                  keyPoints: [
                    'tracking/sqlalchemy_store.py：SQLAlchemy ORM，支持 MySQL/PostgreSQL/SQLite',
                    'tracking/file_store.py：本地文件系统存储，开发调试首选',
                    'artifact/s3_artifact_repo.py：S3 Artifact 存储，支持 STS 临时凭证',
                    '_unity_catalog/：UC 模型注册表适配，与 Databricks 深度集成',
                    'db_migrations/：Alembic 迁移脚本，支持跨版本数据库升级',
                  ],
                },
                {
                  module: 'tracing/ — LLM 追踪（核心增长点）',
                  path: 'mlflow/tracing/',
                  role: '2024 新增，快速增长',
                  color: '#e84393',
                  desc: '2024 年新增的 LLM 追踪模块，是 MLflow 向 AI Engineering Platform 转型的核心。自动追踪 LLM 调用链路（输入/输出/Token 用量/延迟），支持 OpenAI / Anthropic / LangChain 等主流框架的零代码自动追踪。',
                  keyPoints: [
                    'mlflow.tracing.enable()：一行代码开启自动追踪，无需修改业务代码',
                    'Span 树形结构：记录完整的 LLM 调用链（Agent → Tool → LLM → Response）',
                    'async 支持：v3.11 默认开启异步 Trace 日志，不阻塞主线程',
                    '与 OpenTelemetry 兼容：Span 格式遵循 OTEL 标准，可导出到 Jaeger/Zipkin',
                    'mlflow.openai.autolog() / mlflow.langchain.autolog()：框架级自动追踪',
                  ],
                },
                {
                  module: 'models/ — Model Flavor 系统',
                  path: 'mlflow/models/',
                  role: '模型打包标准',
                  color: '#ffa657',
                  desc: 'MLflow Model 是一种标准化的模型打包格式，通过 Flavor 系统支持 50+ ML 框架。每个 Flavor 定义了如何序列化/反序列化模型，以及如何部署为 REST API。MLmodel 文件是模型的元数据清单。',
                  keyPoints: [
                    'MLmodel 文件：YAML 格式，记录 Flavor 列表、Python 环境、签名（输入/输出 Schema）',
                    'pyfunc Flavor：通用 Python 函数接口，任何模型都可以包装为 pyfunc',
                    'mlflow.models.signature：自动推断模型输入/输出类型（支持 pandas/numpy/dict）',
                    'mlflow.evaluate()：统一评估框架，支持分类/回归/LLM 评估指标',
                    'Model Registry：Staging → Production 阶段管理 + 版本别名',
                  ],
                },
                {
                  module: 'server/ — Tracking Server',
                  path: 'mlflow/server/',
                  role: 'Flask REST Server',
                  color: '#00cec9',
                  desc: 'MLflow Tracking Server 是一个 Flask 应用，提供 REST API 供客户端记录实验数据。支持多用户并发，可配置 SQLAlchemy 后端数据库和 Artifact 存储位置。生产部署推荐使用 gunicorn + PostgreSQL + S3。',
                  keyPoints: [
                    'mlflow server --backend-store-uri postgresql://... --default-artifact-root s3://...',
                    'REST API：/api/2.0/mlflow/runs/create、/api/2.0/mlflow/metrics/log 等',
                    'Auth 插件：mlflow-server-auth 提供基础用户认证（v2.5+）',
                    'Prometheus 指标：/metrics 端点暴露服务器运行指标',
                    'Docker 镜像：ghcr.io/mlflow/mlflow 官方镜像，支持 K8s 部署',
                  ],
                },
                {
                  module: 'gateway/ — AI Gateway',
                  path: 'mlflow/gateway/',
                  role: 'LLM 统一代理',
                  color: '#a29bfe',
                  desc: 'MLflow AI Gateway 是一个 LLM 统一代理层，将多个 LLM Provider（OpenAI/Anthropic/Cohere/Azure OpenAI）统一为一个 API 接口。支持负载均衡、速率限制、成本追踪。',
                  keyPoints: [
                    '统一 /gateway/routes/{route_name}/invocations 接口',
                    '配置文件驱动：YAML 定义路由规则和 Provider 映射',
                    '自动追踪：所有 Gateway 调用自动记录到 MLflow Tracking',
                    '与 mlflow.deployments 集成：模型部署到 Gateway 路由',
                  ],
                },
              ].map(mod => (
                <div key={mod.module} className="rounded-xl border p-4"
                  style={{ borderColor: mod.color + '25', background: mod.color + '03' }}>
                  <div className="flex items-start gap-3 mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-bold font-mono" style={{ color: mod.color }}>{mod.module}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                          style={{ background: mod.color + '15', color: mod.color }}>{mod.role}</span>
                      </div>
                      <div className="text-[9px] text-gray-400 font-mono mb-1.5">{mod.path}</div>
                      <p className="text-[10px] text-gray-600 leading-relaxed mb-2">{mod.desc}</p>
                      <ul className="space-y-1">
                        {mod.keyPoints.map((p, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-[10px] text-gray-500">
                            <span style={{ color: mod.color }} className="flex-shrink-0 mt-0.5">▸</span>
                            {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* 核心调用链路 */}
          <SectionCard icon="🔄" title="核心调用链路" desc="mlflow.log_metric() 的完整执行路径">
            <pre className="text-[10px] leading-[1.7] text-gray-700 bg-gray-50 border border-gray-200 p-4 rounded-xl overflow-x-auto font-mono whitespace-pre">{`mlflow.log_metric("loss", 0.42, step=100)
         │
         ▼
fluent.py: log_metric()        # 顶层 API，获取当前 active run
         │
         ▼
MlflowClient.log_metric()      # client.py，委托给 tracking service
         │
         ▼
TrackingServiceInterface       # 抽象层，根据 MLFLOW_TRACKING_URI 选择实现
    │
    ├─► RestStore              # 远程 Server 模式
    │       └─ POST /api/2.0/mlflow/runs/log-metric
    │               └─ MLflow Tracking Server (Flask)
    │                       └─ SqlAlchemyStore.log_metric()
    │                               └─ INSERT INTO metrics (run_uuid, key, value, step)
    │
    ├─► SqlAlchemyStore        # 直连数据库模式
    │       └─ SQLAlchemy ORM → PostgreSQL / MySQL / SQLite
    │
    └─► FileStore              # 本地文件模式（开发调试）
            └─ 写入 mlruns/{experiment_id}/{run_id}/metrics/loss`}</pre>
          </SectionCard>

          {/* LLM 追踪调用链路 */}
          <SectionCard icon="🤖" title="LLM 自动追踪链路" desc="mlflow.openai.autolog() 的工作原理">
            <pre className="text-[10px] leading-[1.7] text-gray-700 bg-gray-50 border border-gray-200 p-4 rounded-xl overflow-x-auto font-mono whitespace-pre">{`mlflow.openai.autolog()        # 一行开启自动追踪
         │
         ▼
Monkey-patch openai.OpenAI     # 拦截 openai 客户端
         │
         ▼
用户代码: client.chat.completions.create(...)
         │
         ▼
MLflow Wrapper                 # 拦截调用
    │
    ├─► 创建 Span（type=LLM）
    │       ├─ span.set_inputs(messages)
    │       ├─ span.set_attribute("model", "gpt-4o")
    │       └─ span.set_attribute("temperature", 0.7)
    │
    ├─► 调用原始 OpenAI API
    │
    ├─► 记录响应
    │       ├─ span.set_outputs(response.choices[0].message)
    │       ├─ span.set_attribute("usage.prompt_tokens", N)
    │       └─ span.set_attribute("usage.completion_tokens", M)
    │
    └─► 异步写入 Trace 到 Tracking Server
            └─ POST /api/2.0/mlflow/traces`}</pre>
          </SectionCard>

          {/* 关键设计决策 */}
          <SectionCard icon="💡" title="关键设计决策" desc="MLflow 源码中体现的架构哲学">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { title: 'Fluent API + Client API 双轨', desc: 'fluent.py 提供 mlflow.xxx() 全局函数（适合脚本/Notebook），MlflowClient 提供面向对象接口（适合生产代码）。两者底层共享同一套 TrackingService。', color: '#3fb950' },
                { title: 'Flavor 插件系统', desc: '每个 ML 框架对应一个 Flavor 模块（mlflow/sklearn、mlflow/pytorch 等），通过统一的 save_model/load_model 接口实现框架无关的模型打包。新框架只需实现 Flavor 接口即可接入。', color: '#6c5ce7' },
                { title: 'autolog 零侵入追踪', desc: '通过 Python monkey-patching 拦截框架的训练/推理调用，无需修改用户代码即可自动记录参数、指标、模型。每个框架的 autolog 实现在对应的 mlflow/{framework}/ 目录下。', color: '#e84393' },
                { title: 'async Trace 日志（v3.11）', desc: '2026 年 4 月默认开启异步 Trace 日志，Trace 数据在后台线程批量写入，不阻塞主线程。对高并发 LLM 应用尤其重要，避免追踪开销影响推理延迟。', color: '#ffa657' },
                { title: 'OpenTelemetry 兼容', desc: 'Tracing 模块的 Span 格式遵循 OpenTelemetry 标准，可以将 MLflow Trace 导出到任何 OTEL 兼容的后端（Jaeger/Zipkin/Datadog）。', color: '#00cec9' },
                { title: 'MCP Server 集成（2025）', desc: 'mlflow/mcp/ 目录实现了 MLflow 作为 MCP Server，允许 AI Agent 通过 MCP 协议直接查询实验数据、获取模型信息，是 MLflow 向 Agentic 工作流演进的关键一步。', color: '#a29bfe' },
              ].map(item => (
                <div key={item.title} className="rounded-xl border p-3"
                  style={{ borderColor: item.color + '25', background: item.color + '04' }}>
                  <div className="text-[10px] font-bold mb-1" style={{ color: item.color }}>{item.title}</div>
                  <p className="text-[10px] text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 6. 可观测性
// ─────────────────────────────────────────────────────────────
function ObservabilityTab() {
  const { stack, dashboards, alertRules } = OBSERVABILITY_DATA;

  return (
    <div className="space-y-4">
      {/* 技术栈 */}
      <SectionCard icon="🔭" title="可观测性技术栈" desc="指标 · 日志 · 追踪 · 告警 四大支柱">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {stack.map(s => (
            <div key={s.name} className="rounded-xl border p-4"
              style={{ borderColor: s.color + '33', background: s.color + '06' }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{s.icon}</span>
                <span className="text-sm font-semibold text-gray-800">{s.name}</span>
                <Badge color={s.color}>{s.role}</Badge>
              </div>
              <p className="text-[10px] text-gray-500 mb-2">{s.desc}</p>
              <div className="text-[9px] font-mono" style={{ color: s.color }}>{s.metrics}</div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* 仪表盘 */}
      <SectionCard icon="📊" title="Grafana 仪表盘" desc="50+ 预置仪表盘覆盖全链路">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {dashboards.map(d => (
            <div key={d.name} className="rounded-xl border border-gray-100 bg-gray-50/30 p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-gray-700">{d.name}</span>
                <span className="text-[9px] text-gray-400">刷新: {d.refresh}</span>
              </div>
              <p className="text-[10px] text-gray-500">{d.panels}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* 告警规则 */}
      <SectionCard icon="🚨" title="告警规则" desc="多级告警升级，从 Slack 到电话">
        <div className="space-y-2">
          {alertRules.map(r => {
            const sevColors = { critical: '#ff7b72', warning: '#ffa657', info: '#79c0ff' };
            return (
              <div key={r.name} className="rounded-xl border p-3"
                style={{ borderColor: sevColors[r.severity] + '33', background: sevColors[r.severity] + '04' }}>
                <div className="flex items-center gap-2 mb-1">
                  <Badge color={sevColors[r.severity]}>{r.severity}</Badge>
                  <span className="text-xs font-semibold text-gray-700">{r.name}</span>
                </div>
                <div className="text-[10px] text-gray-500 mb-1">条件: <span className="font-mono">{r.condition}</span></div>
                <div className="text-[10px] text-gray-500">动作: {r.action}</div>
              </div>
            );
          })}
        </div>
      </SectionCard>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 7. 向量 & 特征
// ─────────────────────────────────────────────────────────────
function VectorTab() {
  const { vectorDB, featureStore } = VECTOR_DATA;

  return (
    <div className="space-y-4">
      {/* 向量数据库 */}
      <SectionCard icon="🧬" title={`向量数据库 — ${vectorDB.engine}`} desc={vectorDB.deployment}>
        <div className="space-y-2">
          {vectorDB.collections.map(c => (
            <div key={c.name} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/30 p-3">
              <span className="text-lg flex-shrink-0">{c.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-mono font-semibold text-gray-700">{c.name}</span>
                  <Badge color="#d2a8ff">dim: {c.dim}</Badge>
                  <span className="text-[9px] font-mono text-gray-400">{c.vectors} vectors</span>
                </div>
                <div className="text-[10px] text-gray-500">{c.usage}</div>
                <div className="text-[9px] text-gray-400 mt-0.5">模型: {c.model}</div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* 索引类型 */}
      <SectionCard icon="📇" title="索引类型" desc="不同场景选择不同索引策略">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {vectorDB.indexTypes.map(idx => (
            <div key={idx.name} className="rounded-xl border border-gray-100 bg-gray-50/50 p-3">
              <div className="text-xs font-mono font-semibold text-gray-700 mb-1">{idx.name}</div>
              <div className="text-[10px] text-gray-500 mb-1">{idx.desc}</div>
              <Badge color="#d2a8ff">{idx.scenario}</Badge>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* 应用场景 */}
      <SectionCard icon="🎯" title="向量检索应用场景" desc="向量数据库在数据闭环中的 4 大应用">
        <div className="space-y-2">
          {vectorDB.useCases.map(uc => (
            <div key={uc.name} className="rounded-xl border border-gray-100 bg-gray-50/30 p-3">
              <div className="text-xs font-semibold text-gray-700 mb-1">{uc.name}</div>
              <div className="text-[10px] text-gray-500 mb-2">{uc.desc}</div>
              <div className="text-[9px] font-mono text-[#d2a8ff] bg-[#d2a8ff]/8 rounded-lg px-2 py-1.5 border border-[#d2a8ff]/20">
                {uc.flow}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* 特征仓库 */}
      <SectionCard icon="🍽️" title={`特征仓库 — ${featureStore.engine}`} desc="离线批量 + 在线实时双模特征服务">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
          {Object.entries(featureStore.architecture).map(([key, value]) => {
            const labels = { offline: '离线存储', online: '在线服务', registry: '特征注册' };
            return (
              <div key={key} className="rounded-lg border border-gray-100 bg-gray-50/50 p-2.5">
                <div className="text-[9px] text-gray-400 mb-0.5">{labels[key]}</div>
                <div className="text-[10px] font-mono text-gray-700">{value}</div>
              </div>
            );
          })}
        </div>

        {featureStore.featureGroups.map(group => (
          <div key={group.name} className="mb-3">
            <div className="text-[10px] font-semibold mb-2" style={{ color: group.color }}>{group.name}</div>
            <div className="space-y-1.5">
              {group.features.map(f => (
                <div key={f.name} className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50/30 p-2">
                  <span className="text-[10px] font-mono text-gray-700 w-40 truncate">{f.name}</span>
                  <Badge color={group.color}>{f.dim}</Badge>
                  <span className="text-[9px] text-gray-400">{f.dtype}</span>
                  <span className="text-[9px] text-gray-400 ml-auto hidden sm:inline">{f.source} · {f.freshness}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </SectionCard>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 8. 图像去重
// ─────────────────────────────────────────────────────────────
function DedupTab() {
  const { dedupLevels, methods, pipeline, adScenarios, paperComparison, architecture, metrics } = DEDUP_DATA;

  return (
    <div className="space-y-4">
      {/* 去重层级体系 */}
      <SectionCard icon="🏗️" title="去重层级体系" desc="自动驾驶 & 具身机器人场景下的三级去重架构">
        <div className="space-y-4">
          {dedupLevels.map(lv => (
            <div key={lv.level} className="rounded-xl border p-4"
              style={{ borderColor: lv.color + '33', background: lv.color + '04' }}>
              {/* 层级标题 */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{lv.icon}</span>
                  <span className="text-sm font-bold" style={{ color: lv.color }}>{lv.level}: {lv.name}</span>
                  <Badge color={lv.color}>冗余率 {lv.redundancy}</Badge>
                </div>
              </div>
              <p className="text-[10px] text-gray-500 mb-3">{lv.desc}</p>

              {/* 具体做法 */}
              <div className="space-y-2 mb-3">
                {lv.approaches.map(a => (
                  <div key={a.name} className="rounded-lg border border-gray-100 bg-white/80 p-2.5">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-gray-700">{a.name}</span>
                      {a.paper && <Badge color={lv.color}>{a.paper}</Badge>}
                    </div>
                    <div className="text-[10px] text-gray-500">{a.desc}</div>
                    {a.detail && <div className="text-[9px] text-gray-400 mt-1 font-mono">{a.detail}</div>}
                  </div>
                ))}
              </div>

              {/* Level 2 专属论文表格 */}
              {lv.papers && typeof lv.papers[0] === 'object' && (
                <div className="mt-3">
                  <div className="text-[10px] font-semibold text-gray-600 mb-2">📄 相关论文</div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-[10px]">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="text-left py-1.5 px-2 text-gray-500 font-medium">论文</th>
                          <th className="text-center py-1.5 px-2 text-gray-500 font-medium">会议</th>
                          <th className="text-center py-1.5 px-2 text-gray-500 font-medium">任务</th>
                          <th className="text-left py-1.5 px-2 text-gray-500 font-medium">亮点</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lv.papers.map(p => (
                          <tr key={p.paper} className="border-b border-gray-50">
                            <td className="py-1.5 px-2 font-semibold" style={{ color: lv.color }}>{p.paper}</td>
                            <td className="py-1.5 px-2 text-center text-gray-500">{p.venue}</td>
                            <td className="py-1.5 px-2 text-center text-gray-500">{p.task}</td>
                            <td className="py-1.5 px-2 text-gray-600">{p.highlight}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </SectionCard>

      {/* 去重方法演进 */}
      <SectionCard icon="📈" title="去重方法演进" desc="从精确哈希到多模态语义去重的技术演进">
        <div className="space-y-2">
          {methods.map((m, i) => (
            <div key={m.name} className="rounded-xl border p-4"
              style={{ borderColor: m.color + '33', background: m.color + '04' }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{m.icon}</span>
                  <span className="text-sm font-semibold text-gray-800">{m.name}</span>
                  <Badge color={m.color}>{m.tech}</Badge>
                </div>
                <span className="text-xs font-mono" style={{ color: m.color }}>去重率: {m.dedup_rate}</span>
              </div>
              <p className="text-[10px] text-gray-500 mb-2">{m.desc}</p>
              <div className="flex items-center gap-4 text-[9px] text-gray-400 font-mono">
                <span>粒度: {m.granularity}</span>
                <span>精确率: {m.precision}</span>
                <span>召回率: {m.recall}</span>
                <span>成本: {m.cost}</span>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* 推荐多级 Pipeline */}
      <SectionCard icon="⚙️" title="推荐多级去重 Pipeline" desc="4 阶段渐进式去重，从粗到细逐步过滤">
        <div className="space-y-2">
          {pipeline.map((p, i) => (
            <div key={p.stage}>
              <div className="flex items-center gap-3 rounded-xl border p-3"
                style={{ borderColor: p.color + '33', background: p.color + '06' }}>
                <div className="w-16 flex-shrink-0 text-center">
                  <div className="text-[10px] font-bold" style={{ color: p.color }}>{p.stage}</div>
                  <div className="text-[9px] text-gray-400">{p.name}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-gray-600 mb-1">
                    <span className="font-mono">{p.method}</span>
                  </div>
                  <div className="text-[10px] text-gray-500">目标: {p.target}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-xs font-bold font-mono" style={{ color: p.color }}>{p.dedup}</div>
                  <div className="text-[9px] text-gray-400">{p.time}</div>
                </div>
              </div>
              {i < pipeline.length - 1 && (
                <div className="text-center text-[9px] text-gray-300 py-0.5">↓</div>
              )}
            </div>
          ))}
          <div className="rounded-xl border border-[#e17055]/20 bg-[#e17055]/5 p-3 text-center">
            <span className="text-xs font-semibold text-[#e17055]">最终保留: ~32% 高质量非重复数据</span>
            <span className="text-[10px] text-gray-500 ml-2">（存储成本降低 ~70%，训练效率提升 ~3x）</span>
          </div>
        </div>
      </SectionCard>

      {/* 自动驾驶场景去重效果 */}
      <SectionCard icon="🚗" title="自动驾驶场景去重效果" desc="不同场景类型的冗余率和去重策略">
        <div className="space-y-2">
          {adScenarios.map(s => (
            <div key={s.scenario} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/30 p-3">
              <span className="text-lg flex-shrink-0">{s.icon}</span>
              <span className="text-xs font-semibold text-gray-700 w-32">{s.scenario}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-[#e17055]/30"
                      style={{ width: s.redundancy }} />
                  </div>
                  <span className="text-[10px] font-mono text-[#e17055] w-10">{s.redundancy}</span>
                </div>
                <div className="text-[9px] text-gray-400 mt-0.5">{s.method} → {s.retained}</div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* 论文对比 */}
      <SectionCard icon="📄" title="核心论文对比" desc="图像去重领域 3 篇关键论文">
        <div className="overflow-x-auto">
          <table className="w-full text-[10px]">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 px-2 text-gray-500 font-medium">论文</th>
                <th className="text-center py-2 px-2 text-gray-500 font-medium">会议</th>
                <th className="text-center py-2 px-2 text-gray-500 font-medium">模态</th>
                <th className="text-center py-2 px-2 text-gray-500 font-medium">领域</th>
                <th className="text-center py-2 px-2 text-gray-500 font-medium">最大去重</th>
                <th className="text-center py-2 px-2 text-gray-500 font-medium">性能损失</th>
                <th className="text-left py-2 px-2 text-gray-500 font-medium">亮点</th>
              </tr>
            </thead>
            <tbody>
              {paperComparison.map(p => (
                <tr key={p.paper} className="border-b border-gray-50">
                  <td className="py-2 px-2 font-semibold text-[#e17055]">{p.paper}</td>
                  <td className="py-2 px-2 text-center text-gray-500">{p.venue}</td>
                  <td className="py-2 px-2 text-center text-gray-500">{p.modality}</td>
                  <td className="py-2 px-2 text-center text-gray-500">{p.domain}</td>
                  <td className="py-2 px-2 text-center font-mono text-[#e17055]">{p.maxDedup}</td>
                  <td className="py-2 px-2 text-center font-mono text-[#3fb950]">{p.perfDrop}</td>
                  <td className="py-2 px-2 text-gray-600">{p.highlight}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* 工程架构：车端 + 云端 */}
      <SectionCard icon="🏗️" title="去重工程架构" desc="车端边缘去重 + 云端深度去重的两级架构">
        {/* 车端 */}
        <div className="mb-4">
          <div className="text-[10px] font-semibold text-gray-700 mb-2">🚗 {architecture.edgeDedup.name}</div>
          <div className="space-y-1.5">
            {architecture.edgeDedup.steps.map(s => (
              <div key={s.name} className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50/30 p-2">
                <span className="text-[10px] font-semibold text-gray-700 w-20">{s.name}</span>
                <span className="text-[10px] text-gray-500 flex-1">{s.desc}</span>
                <Badge color="#6c5ce7">{s.tech}</Badge>
              </div>
            ))}
            <div className="text-[9px] text-[#6c5ce7] font-mono text-right">压缩效果: {architecture.edgeDedup.compression}</div>
          </div>
        </div>
        {/* 云端 */}
        <div className="mb-4">
          <div className="text-[10px] font-semibold text-gray-700 mb-2">☁️ {architecture.cloudDedup.name}</div>
          <div className="space-y-1.5">
            {architecture.cloudDedup.steps.map(s => (
              <div key={s.name} className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50/30 p-2">
                <span className="text-[10px] font-semibold text-gray-700 w-24">{s.name}</span>
                <span className="text-[10px] text-gray-500 flex-1">{s.desc}</span>
                <Badge color="#e17055">{s.tech}</Badge>
              </div>
            ))}
            <div className="text-[9px] text-[#e17055] font-mono text-right">压缩效果: {architecture.cloudDedup.compression}</div>
          </div>
        </div>
        {/* 存储 */}
        <div className="rounded-lg border border-[#e17055]/20 bg-[#e17055]/5 p-3">
          <div className="text-[9px] font-semibold text-gray-600 mb-2">💾 存储基础设施</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {Object.entries(architecture.storage).map(([key, value]) => {
              const labels = { embeddings: '嵌入存储', index: '索引策略', metadata: '元数据' };
              return (
                <div key={key} className="rounded-md border border-[#e17055]/15 bg-white/80 p-2">
                  <div className="text-[8px] text-gray-400">{labels[key]}</div>
                  <div className="text-[10px] font-mono text-gray-700">{value}</div>
                </div>
              );
            })}
          </div>
        </div>
      </SectionCard>

      {/* 效果指标 */}
      <SectionCard icon="📊" title="去重效果总览" desc="去重前后的数据规模和模型性能对比">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="text-[10px] font-semibold text-gray-600 mb-2">📦 数据规模变化</div>
            <div className="space-y-2">
              {[['总帧数', metrics.before.totalFrames, metrics.after.totalFrames],
                ['存储量', metrics.before.storage, metrics.after.storage],
                ['训练数据', metrics.before.trainData, metrics.after.trainData],
              ].map(([label, before, after]) => (
                <div key={label} className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-500 w-14">{label}</span>
                  <span className="text-[10px] font-mono text-gray-400 line-through">{before}</span>
                  <span className="text-[10px]">→</span>
                  <span className="text-[10px] font-mono font-semibold text-[#3fb950]">{after}</span>
                </div>
              ))}
              <div className="text-xs font-bold text-[#e17055] mt-1">💰 节省成本: {metrics.after.savedCost}</div>
            </div>
          </div>
          <div>
            <div className="text-[10px] font-semibold text-gray-600 mb-2">🎯 模型性能影响 (nuScenes)</div>
            <div className="space-y-2">
              {Object.entries(metrics.quality).map(([key, value]) => {
                const labels = { nds: 'NDS', map: 'mAP', l2: 'L2 (3s)' };
                return (
                  <div key={key} className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-500 w-14">{labels[key]}</span>
                    <span className="text-[10px] font-mono text-gray-600">{value}</span>
                  </div>
                );
              })}
              <div className="text-[10px] text-[#3fb950] font-medium mt-1">✅ 性能损失 &lt; 1%，可忽略不计</div>
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 9. 数据合成
// ─────────────────────────────────────────────────────────────
function SynthTab() {
  const { overview, methods, architecture, qualityMetrics, papers, metrics } = SYNTH_DATA;

  return (
    <div className="space-y-4">
      {/* 数据合成在闭环中的价值 */}
      <SectionCard icon="🎯" title="数据合成在闭环中的价值" desc={overview.role}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {overview.value.map(v => (
            <div key={v.name} className="flex items-start gap-2 rounded-xl border p-3"
              style={{ borderColor: v.color + '33', background: v.color + '06' }}>
              <span className="text-lg flex-shrink-0">{v.icon}</span>
              <div>
                <div className="text-xs font-semibold text-gray-700">{v.name}</div>
                <div className="text-[10px] text-gray-500">{v.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* 合成方法分类 */}
      <SectionCard icon="🧪" title="合成方法分类" desc="5 大合成方向覆盖标注、图像、场景、域适配、轨迹">
        <div className="space-y-3">
          {methods.map(m => (
            <div key={m.name} className="rounded-xl border p-4"
              style={{ borderColor: m.color + '33', background: m.color + '04' }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{m.icon}</span>
                  <span className="text-sm font-semibold text-gray-800">{m.name}</span>
                  <Badge color={m.color}>{m.category}</Badge>
                </div>
                <Badge color="#3fb950">{m.cost}</Badge>
              </div>
              <p className="text-[10px] text-gray-500 mb-2">{m.desc}</p>
              <div className="flex items-center gap-4 text-[9px] text-gray-400 font-mono flex-wrap">
                <span>技术: {m.tech}</span>
                <span>输入: {m.input}</span>
                <span>输出: {m.output}</span>
                <span style={{ color: m.color }}>质量: {m.quality}</span>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* 合成数据在闭环中的架构 */}
      <SectionCard icon="🔄" title="合成数据闭环架构" desc="从长尾发现到效果反馈的 7 阶段闭环">
        <div className="space-y-2">
          {architecture.pipeline.map((p, i) => (
            <div key={p.stage}>
              <div className="flex items-center gap-3 rounded-xl border p-3"
                style={{ borderColor: p.color + '33', background: p.color + '06' }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0"
                  style={{ background: p.color + '15' }}>
                  {p.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-semibold text-gray-700">{p.name}</span>
                    <Badge color={p.color}>{p.stage}</Badge>
                  </div>
                  <div className="text-[10px] text-gray-500">{p.desc}</div>
                  <div className="text-[9px] text-gray-400 mt-0.5 font-mono">{p.source}</div>
                </div>
              </div>
              {i < architecture.pipeline.length - 1 && (
                <div className="text-center text-[9px] text-gray-300 py-0.5">↓</div>
              )}
            </div>
          ))}
        </div>
      </SectionCard>

      {/* 真实-合成数据混合策略 */}
      <SectionCard icon="🔀" title="真实-合成数据混合策略" desc={architecture.mixStrategy.name}>
        <div className="overflow-x-auto">
          <table className="w-full text-[10px]">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 px-2 text-gray-500 font-medium">场景类型</th>
                <th className="text-center py-2 px-2 text-gray-500 font-medium">真实数据</th>
                <th className="text-center py-2 px-2 text-gray-500 font-medium">合成数据</th>
                <th className="text-center py-2 px-2 text-gray-500 font-medium">混合方式</th>
                <th className="text-left py-2 px-2 text-gray-500 font-medium">原因</th>
              </tr>
            </thead>
            <tbody>
              {architecture.mixStrategy.rules.map(r => (
                <tr key={r.scenario} className="border-b border-gray-50">
                  <td className="py-2 px-2 font-semibold text-gray-700">{r.scenario}</td>
                  <td className="py-2 px-2 text-center font-mono text-[#3fb950]">{r.realRatio}</td>
                  <td className="py-2 px-2 text-center font-mono text-[#a29bfe]">{r.synthRatio}</td>
                  <td className="py-2 px-2 text-center"><Badge color="#a29bfe">{r.method}</Badge></td>
                  <td className="py-2 px-2 text-gray-500">{r.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* 质量评估体系 */}
      <SectionCard icon="✅" title="合成数据质量评估体系" desc="6 维度自动化质量评估">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {qualityMetrics.map(m => (
            <div key={m.name} className="flex items-start gap-2 rounded-xl border border-gray-100 bg-gray-50/30 p-3">
              <span className="text-lg flex-shrink-0">{m.icon}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-semibold text-gray-700">{m.name}</span>
                  <Badge color="#a29bfe">目标: {m.target}</Badge>
                </div>
                <div className="text-[10px] text-gray-500">{m.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* 核心论文 */}
      <SectionCard icon="📄" title="核心论文参考" desc="数据合成领域关键论文">
        <div className="overflow-x-auto">
          <table className="w-full text-[10px]">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 px-2 text-gray-500 font-medium">论文</th>
                <th className="text-center py-2 px-2 text-gray-500 font-medium">会议</th>
                <th className="text-center py-2 px-2 text-gray-500 font-medium">任务</th>
                <th className="text-left py-2 px-2 text-gray-500 font-medium">亮点</th>
              </tr>
            </thead>
            <tbody>
              {papers.map(p => (
                <tr key={p.paper} className="border-b border-gray-50">
                  <td className="py-2 px-2 font-semibold text-[#a29bfe]">{p.paper}</td>
                  <td className="py-2 px-2 text-center text-gray-500">{p.venue}</td>
                  <td className="py-2 px-2 text-center text-gray-500">{p.task}</td>
                  <td className="py-2 px-2 text-gray-600">{p.highlight}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* 效果指标 */}
      <SectionCard icon="📊" title="合成数据效果总览" desc="合成数据对模型性能的提升效果">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <div className="text-[10px] font-semibold text-gray-600 mb-2">📦 合成规模</div>
            <div className="space-y-1.5">
              {Object.entries(metrics.synthVolume).map(([key, value]) => {
                const labels = { daily: '日产量', monthly: '月产量', total: '累计总量' };
                return (
                  <div key={key} className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-500 w-14">{labels[key]}</span>
                    <span className="text-[10px] font-mono font-semibold text-[#a29bfe]">{value}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-semibold text-gray-600 mb-2">💰 成本节省</div>
            <div className="space-y-1.5">
              {Object.entries(metrics.costSaving).map(([key, value]) => (
                <div key={key} className="text-[10px] text-gray-600">
                  <span className="text-[#3fb950]">✅</span> {value}
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-semibold text-gray-600 mb-2">🎯 质量提升</div>
            <div className="space-y-1.5">
              {Object.entries(metrics.qualityImpact).map(([key, value]) => (
                <div key={key} className="text-[10px] text-gray-600">
                  <span className="text-[#3fb950]">📈</span> {value}
                </div>
              ))}
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 10. 推理 & 训练框架优化
// ═══════════════════════════════════════════════════════════════
function FrameworkTab() {
  const { overview, trainFrameworks, precisionStrategies, inferenceEngines, compileOptimizations, edgeOptimization, communicationOpt, decisionMatrix, papers, metrics } = FRAMEWORK_DATA;

  return (
    <div className="space-y-4">
      {/* 总览 */}
      <SectionCard icon="⚡" title="推理 & 训练优化总览" desc={overview.role}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {overview.dimensions.map(d => (
            <div key={d.name} className="flex items-start gap-2 rounded-xl border p-3"
              style={{ borderColor: d.color + '33', background: d.color + '06' }}>
              <span className="text-lg flex-shrink-0">{d.icon}</span>
              <div>
                <div className="text-xs font-semibold text-gray-700">{d.name}</div>
                <div className="text-[10px] text-gray-500">{d.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* 训练框架对比 */}
      <SectionCard icon="🏋️" title="分布式训练框架对比" desc="DeepSpeed vs FSDP vs Megatron-LM 三大主流框架">
        <div className="space-y-4">
          {trainFrameworks.map(fw => (
            <div key={fw.name} className="rounded-xl border p-4"
              style={{ borderColor: fw.color + '33', background: fw.color + '04' }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">{fw.icon}</span>
                <span className="text-sm font-semibold text-gray-800">{fw.name}</span>
                <Badge color={fw.color}>{fw.org}</Badge>
                <span className="text-[10px] text-gray-400 ml-auto">推荐: {fw.bestFor}</span>
              </div>
              <p className="text-[10px] text-gray-500 mb-3">{fw.desc}</p>

              {/* 阶段表格 */}
              <div className="overflow-x-auto mb-3">
                <table className="w-full text-[10px]">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-1.5 px-2 text-gray-500 font-medium">阶段</th>
                      <th className="text-left py-1.5 px-2 text-gray-500 font-medium">策略</th>
                      <th className="text-center py-1.5 px-2 text-gray-500 font-medium">显存节省</th>
                      <th className="text-center py-1.5 px-2 text-gray-500 font-medium">通信开销</th>
                      <th className="text-left py-1.5 px-2 text-gray-500 font-medium">适用场景</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fw.stages.map(s => (
                      <tr key={s.name} className="border-b border-gray-50">
                        <td className="py-1.5 px-2 font-semibold text-gray-700 font-mono">{s.name}</td>
                        <td className="py-1.5 px-2 text-gray-600">{s.desc}</td>
                        <td className="py-1.5 px-2 text-center font-mono" style={{ color: fw.color }}>{s.memSave}</td>
                        <td className="py-1.5 px-2 text-center"><Badge color={fw.color}>{s.overhead}</Badge></td>
                        <td className="py-1.5 px-2 text-gray-500">{s.scenario}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 优缺点 */}
              <div className="flex gap-4 text-[10px]">
                <div className="flex-1">
                  <span className="font-semibold text-[#3fb950]">✅ 优势：</span>
                  <span className="text-gray-500">{fw.pros.join(' · ')}</span>
                </div>
                <div className="flex-1">
                  <span className="font-semibold text-[#ff6b6b]">⚠️ 局限：</span>
                  <span className="text-gray-500">{fw.cons.join(' · ')}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* 混合精度策略 */}
      <SectionCard icon="🎯" title="混合精度策略" desc="从 FP32 到 INT4，精度-效率的完整光谱">
        <div className="overflow-x-auto">
          <table className="w-full text-[10px]">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 px-2 text-gray-500 font-medium">精度</th>
                <th className="text-center py-2 px-2 text-gray-500 font-medium">位宽</th>
                <th className="text-center py-2 px-2 text-gray-500 font-medium">每参数内存</th>
                <th className="text-center py-2 px-2 text-gray-500 font-medium">训练加速</th>
                <th className="text-center py-2 px-2 text-gray-500 font-medium">精度影响</th>
                <th className="text-left py-2 px-2 text-gray-500 font-medium">适用场景</th>
              </tr>
            </thead>
            <tbody>
              {precisionStrategies.map(p => (
                <tr key={p.name} className="border-b border-gray-50">
                  <td className="py-2 px-2 font-semibold font-mono" style={{ color: p.color }}>{p.name}</td>
                  <td className="py-2 px-2 text-center font-mono text-gray-600">{p.bits}</td>
                  <td className="py-2 px-2 text-center font-mono text-gray-600">{p.memPerParam}</td>
                  <td className="py-2 px-2 text-center"><Badge color={p.color}>{p.trainSpeed}</Badge></td>
                  <td className="py-2 px-2 text-center text-gray-600">{p.quality}</td>
                  <td className="py-2 px-2 text-gray-500">{p.scenario}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* 推理引擎对比 */}
      <SectionCard icon="🚀" title="推理引擎对比" desc="云端 LLM 推理 vs 车端实时推理，5 大主流引擎">
        <div className="space-y-3">
          {inferenceEngines.map(eng => (
            <div key={eng.name} className="rounded-xl border p-4"
              style={{ borderColor: eng.color + '33', background: eng.color + '04' }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{eng.icon}</span>
                <span className="text-sm font-semibold text-gray-800">{eng.name}</span>
                <Badge color={eng.color}>{eng.org}</Badge>
              </div>
              <p className="text-[10px] text-gray-500 mb-2">{eng.desc}</p>
              <div className="flex flex-wrap gap-1 mb-2">
                {eng.features.map(f => (
                  <span key={f} className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                    style={{ background: eng.color + '15', color: eng.color }}>
                    {f}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-4 text-[9px] text-gray-400 font-mono">
                <span>延迟: <span style={{ color: eng.color }}>{eng.latency}</span></span>
                <span>吞吐: {eng.throughput}</span>
                <span>平台: {eng.platform}</span>
              </div>
              <div className="mt-1.5 text-[10px] text-gray-500">
                <span className="font-semibold">最佳场景：</span>{eng.bestFor}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* 编译优化 */}
      <SectionCard icon="🔧" title="编译 & 算子优化" desc="torch.compile · FlashAttention · Triton · CUDA Graph">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {compileOptimizations.map(opt => (
            <div key={opt.name} className="rounded-xl border p-4"
              style={{ borderColor: opt.color + '33', background: opt.color + '04' }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{opt.icon}</span>
                <span className="text-xs font-semibold text-gray-800">{opt.name}</span>
                <Badge color={opt.color}>{opt.maturity}</Badge>
              </div>
              <p className="text-[10px] text-gray-500 mb-2">{opt.desc}</p>
              <div className="flex items-center gap-3 text-[9px] text-gray-400 mb-2">
                <span>加速: <span className="font-mono" style={{ color: opt.color }}>{opt.speedup}</span></span>
                <span>接入成本: {opt.effort}</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {opt.details.map(d => (
                  <span key={d} className="text-[9px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">{d}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* 车端推理优化 */}
      <SectionCard icon="🚗" title="车端推理优化 (NVIDIA Orin)" desc="从模型量化到多模型调度的全链路车端优化">
        {/* 平台规格 */}
        <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-3 mb-4">
          <div className="text-xs font-semibold text-gray-700 mb-2">📋 {edgeOptimization.platform.name} 规格</div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {edgeOptimization.platform.specs.map(s => (
              <div key={s.name} className="text-center">
                <div className="text-sm mb-0.5">{s.icon}</div>
                <div className="text-[10px] font-semibold text-gray-700">{s.name}</div>
                <div className="text-[9px] text-gray-500 font-mono">{s.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 优化策略 */}
        <div className="space-y-2 mb-4">
          {edgeOptimization.strategies.map(s => (
            <div key={s.name} className="rounded-xl border p-3"
              style={{ borderColor: s.color + '33', background: s.color + '06' }}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-sm">{s.icon}</span>
                <span className="text-xs font-semibold text-gray-700">{s.name}</span>
                <Badge color={s.color}>{s.impact}</Badge>
              </div>
              <p className="text-[10px] text-gray-500 mb-1.5">{s.desc}</p>
              <div className="flex flex-wrap gap-1">
                {s.techniques.map(t => (
                  <span key={t} className="text-[9px] px-1.5 py-0.5 rounded-full"
                    style={{ background: s.color + '12', color: s.color }}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* 延迟预算 */}
        <div className="rounded-xl border border-gray-100 bg-gray-50/30 p-3">
          <div className="text-xs font-semibold text-gray-700 mb-2">⏱️ 端到端延迟预算分配</div>
          <div className="space-y-1.5">
            {edgeOptimization.latencyBudget.map(l => (
              <div key={l.module} className="flex items-center gap-2 text-[10px]">
                <span className="w-24 text-gray-600 font-medium">{l.module}</span>
                <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden relative">
                  <div className="h-full rounded-full transition-all"
                    style={{
                      width: `${(parseFloat(l.actual) / 50) * 100}%`,
                      background: l.module === '端到端总计' ? '#6c5ce7' : l.color,
                      opacity: l.module === '端到端总计' ? 1 : 0.7,
                    }} />
                </div>
                <span className="w-16 text-right font-mono" style={{ color: l.color }}>{l.actual}</span>
                <span className="w-16 text-right text-gray-400 font-mono">/ {l.target}</span>
              </div>
            ))}
          </div>
        </div>
      </SectionCard>

      {/* 通信优化 */}
      <SectionCard icon="📡" title="分布式通信优化" desc="NCCL · GDR · NVLink · 梯度压缩 · 计算通信重叠">
        <div className="space-y-2">
          {communicationOpt.map(c => (
            <div key={c.name} className="flex items-center gap-3 rounded-xl border p-3"
              style={{ borderColor: c.color + '33', background: c.color + '06' }}>
              <span className="text-lg flex-shrink-0">{c.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-semibold text-gray-700">{c.name}</span>
                  <Badge color={c.color}>{c.bandwidth}</Badge>
                </div>
                <div className="text-[10px] text-gray-500">{c.desc}</div>
                <div className="text-[9px] text-gray-400 mt-0.5">场景: {c.scenario}</div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* 框架选型决策矩阵 */}
      <SectionCard icon="🧭" title="框架选型决策矩阵" desc="不同场景下的最优框架组合推荐">
        <div className="overflow-x-auto">
          <table className="w-full text-[10px]">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 px-2 text-gray-500 font-medium">场景</th>
                <th className="text-center py-2 px-2 text-gray-500 font-medium">训练框架</th>
                <th className="text-center py-2 px-2 text-gray-500 font-medium">推理引擎</th>
                <th className="text-center py-2 px-2 text-gray-500 font-medium">精度</th>
                <th className="text-center py-2 px-2 text-gray-500 font-medium">编译优化</th>
                <th className="text-left py-2 px-2 text-gray-500 font-medium">选型理由</th>
              </tr>
            </thead>
            <tbody>
              {decisionMatrix.map(d => (
                <tr key={d.scenario} className="border-b border-gray-50">
                  <td className="py-2 px-2 font-semibold text-gray-700">{d.scenario}</td>
                  <td className="py-2 px-2 text-center"><Badge color="#326ce5">{d.framework}</Badge></td>
                  <td className="py-2 px-2 text-center"><Badge color="#76b900">{d.inference}</Badge></td>
                  <td className="py-2 px-2 text-center"><Badge color="#ff6b6b">{d.precision}</Badge></td>
                  <td className="py-2 px-2 text-center"><Badge color="#ffa657">{d.compile}</Badge></td>
                  <td className="py-2 px-2 text-gray-500">{d.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* 核心论文 */}
      <SectionCard icon="📄" title="核心论文参考" desc="推理与训练优化领域关键论文">
        <div className="overflow-x-auto">
          <table className="w-full text-[10px]">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 px-2 text-gray-500 font-medium">论文</th>
                <th className="text-center py-2 px-2 text-gray-500 font-medium">会议</th>
                <th className="text-center py-2 px-2 text-gray-500 font-medium">方向</th>
                <th className="text-left py-2 px-2 text-gray-500 font-medium">核心贡献</th>
              </tr>
            </thead>
            <tbody>
              {papers.map(p => (
                <tr key={p.paper} className="border-b border-gray-50">
                  <td className="py-2 px-2 font-semibold text-gray-700">{p.paper}</td>
                  <td className="py-2 px-2 text-center"><Badge color="#ff6b6b">{p.venue}</Badge></td>
                  <td className="py-2 px-2 text-center"><Badge color="#79c0ff">{p.topic}</Badge></td>
                  <td className="py-2 px-2 text-gray-500">{p.highlight}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* 效果指标 */}
      <SectionCard icon="📊" title="效果指标总览" desc="训练 · 推理 · 优化三维度关键指标">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { title: '🏋️ 训练指标', data: metrics.training, color: '#ff6b6b' },
            { title: '🚀 推理指标', data: metrics.inference, color: '#76b900' },
            { title: '⚡ 优化效果', data: metrics.optimization, color: '#ffa657' },
          ].map(group => (
            <div key={group.title} className="rounded-xl border p-3" style={{ borderColor: group.color + '33', background: group.color + '04' }}>
              <div className="text-xs font-semibold text-gray-700 mb-2">{group.title}</div>
              {Object.entries(group.data).map(([key, value]) => (
                <div key={key} className="text-[10px] text-gray-600 mb-1">
                  <span style={{ color: group.color }}>▸</span> {value}
                </div>
              ))}
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// 计算引擎选型 Tab
// ═══════════════════════════════════════════════════════════
function ComputeEngineTab() {
  const ce = COMPUTE_ENGINE_DATA;
  const [activeSubTab, setActiveSubTab] = useState('engines');
  const [selectedEngine, setSelectedEngine] = useState('Apache Spark');

  const SUB_TABS = [
    { id: 'engines',  label: '引擎详情', icon: '⚡' },
    { id: 'matrix',   label: '选型矩阵', icon: '📊' },
    { id: 'stages',   label: '闭环分工', icon: '🔄' },
    { id: 'decision', label: '选型决策', icon: '🧠' },
  ];

  const currentEngine = ce.engines.find(e => e.name === selectedEngine) || ce.engines[0];

  return (
    <div className="space-y-4">
      {/* 定位卡片 */}
      <SectionCard icon="⚡" title={ce.title} desc={ce.subtitle}>
        <div className="flex flex-wrap gap-2">
          {ce.engines.map(e => (
            <span key={e.name} className="text-[9px] px-2 py-0.5 rounded-full font-mono"
              style={{ background: e.color + '15', color: e.color, border: `1px solid ${e.color}30` }}>
              {e.icon} {e.name}
            </span>
          ))}
        </div>
      </SectionCard>

      {/* Sub Tab 切换 */}
      <div className="flex gap-1.5 flex-wrap">
        {SUB_TABS.map(t => (
          <button key={t.id} onClick={() => setActiveSubTab(t.id)}
            className="text-xs px-3 py-1.5 rounded-full border transition-all"
            style={{
              background: activeSubTab === t.id ? '#f39c12' : 'transparent',
              color: activeSubTab === t.id ? '#fff' : '#64748b',
              borderColor: activeSubTab === t.id ? '#f39c12' : '#e2e8f0',
            }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* 引擎详情 */}
      {activeSubTab === 'engines' && (
        <div className="space-y-3">
          {/* 引擎选择器 */}
          <div className="flex gap-2 flex-wrap">
            {ce.engines.map(e => (
              <button key={e.name} onClick={() => setSelectedEngine(e.name)}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border transition-all"
                style={{
                  background: selectedEngine === e.name ? e.color + '15' : 'transparent',
                  color: selectedEngine === e.name ? e.color : '#64748b',
                  borderColor: selectedEngine === e.name ? e.color + '50' : '#e2e8f0',
                  fontWeight: selectedEngine === e.name ? 600 : 400,
                }}>
                <span>{e.icon}</span>
                <span>{e.name}</span>
              </button>
            ))}
          </div>

          {/* 当前引擎详情 */}
          {currentEngine && (
            <div className="rounded-2xl border p-5"
              style={{ borderColor: currentEngine.color + '30', background: currentEngine.color + '04' }}>
              {/* 头部 */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{currentEngine.icon}</span>
                  <div>
                    <div className="text-base font-bold text-gray-800">{currentEngine.name}</div>
                    <div className="text-xs font-medium" style={{ color: currentEngine.color }}>{currentEngine.tagline}</div>
                    <div className="text-[9px] text-gray-400 font-mono mt-0.5">v{currentEngine.version}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[9px] text-gray-400 mb-1">K8s 集成</div>
                  <div className="text-[9px] font-mono px-2 py-0.5 rounded"
                    style={{ background: currentEngine.color + '12', color: currentEngine.color }}>
                    {currentEngine.k8sIntegration}
                  </div>
                </div>
              </div>

              {/* 主要场景 */}
              <div className="mb-4">
                <div className="text-[10px] font-semibold text-gray-600 mb-2">🎯 主要应用场景</div>
                <div className="space-y-1">
                  {currentEngine.scenarios.map((s, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-[10px] text-gray-600">
                      <span style={{ color: currentEngine.color }} className="flex-shrink-0">▸</span>{s}
                    </div>
                  ))}
                </div>
              </div>

              {/* 优势 & 局限 */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="rounded-xl border border-green-100 bg-green-50/50 p-3">
                  <div className="text-[10px] font-semibold text-green-700 mb-1.5">✅ 优势</div>
                  {currentEngine.strengths.map((s, i) => (
                    <div key={i} className="text-[9px] text-gray-600 mb-0.5">· {s}</div>
                  ))}
                </div>
                <div className="rounded-xl border border-red-100 bg-red-50/50 p-3">
                  <div className="text-[10px] font-semibold text-red-600 mb-1.5">⚠️ 局限</div>
                  {currentEngine.weaknesses.map((w, i) => (
                    <div key={i} className="text-[9px] text-gray-600 mb-0.5">· {w}</div>
                  ))}
                </div>
              </div>

              {/* 性能指标 & 适用场景 */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border p-3" style={{ borderColor: currentEngine.color + '20', background: currentEngine.color + '06' }}>
                  <div className="text-[10px] font-semibold text-gray-600 mb-2">📊 性能指标</div>
                  {Object.entries(currentEngine.perf).map(([k, v]) => {
                    const labels = { throughput: '吞吐量', latency: '延迟', scale: '规模' };
                    return (
                      <div key={k} className="flex justify-between text-[9px] mb-0.5">
                        <span className="text-gray-400">{labels[k]}</span>
                        <span className="font-mono" style={{ color: currentEngine.color }}>{v}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="rounded-xl border p-3" style={{ borderColor: currentEngine.color + '20', background: currentEngine.color + '06' }}>
                  <div className="text-[10px] font-semibold text-gray-600 mb-2">🎯 闭环中用于</div>
                  <div className="flex flex-wrap gap-1">
                    {currentEngine.usedFor.map(u => (
                      <Badge key={u} color={currentEngine.color}>{u}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 选型矩阵 */}
      {activeSubTab === 'matrix' && (
        <SectionCard icon="📊" title={ce.selectionMatrix.title}
          desc="✅ 首选 · ⚠️ 可用 · ❌ 不适合">
          <div className="overflow-x-auto">
            <table className="w-full text-[9px]">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 px-2 text-gray-500 font-semibold w-40">场景</th>
                  {['Spark', 'Ray', 'Flink', 'Trino', 'RAPIDS'].map(e => (
                    <th key={e} className="text-center py-2 px-2 font-semibold" style={{ color: ce.engines.find(eng => eng.name.includes(e))?.color || '#64748b' }}>{e}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ce.selectionMatrix.scenarios.map((row, i) => (
                  <tr key={i} className={`border-b border-gray-50 ${i % 2 === 0 ? 'bg-gray-50/30' : ''}`}>
                    <td className="py-2 px-2 text-gray-600 font-medium">{row.scene}</td>
                    <td className="py-2 px-2 text-center">{row.spark}</td>
                    <td className="py-2 px-2 text-center">{row.ray}</td>
                    <td className="py-2 px-2 text-center">{row.flink}</td>
                    <td className="py-2 px-2 text-center">{row.trino}</td>
                    <td className="py-2 px-2 text-center">{row.rapids}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}

      {/* 闭环分工 */}
      {activeSubTab === 'stages' && (
        <SectionCard icon="🔄" title="数据闭环各阶段计算引擎分工"
          desc="不同阶段选用最适合的引擎，引擎间通过 Iceberg + Unity Catalog 共享数据">
          <div className="space-y-2">
            {ce.stageMapping.map((s, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/30 p-3">
                <div className="w-28 flex-shrink-0">
                  <div className="text-[10px] font-semibold text-gray-700">{s.stage}</div>
                </div>
                <div className="flex flex-wrap gap-1 flex-shrink-0">
                  {s.engines.map(eng => {
                    const engineData = ce.engines.find(e => e.name.includes(eng) || eng.includes(e.name.split(' ')[0]));
                    return (
                      <span key={eng} className="text-[9px] px-1.5 py-0.5 rounded font-mono font-semibold"
                        style={{ background: (engineData?.color || '#64748b') + '15', color: engineData?.color || '#64748b' }}>
                        {eng}
                      </span>
                    );
                  })}
                </div>
                <div className="text-[9px] text-gray-500 flex-1">{s.desc}</div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* 选型决策 */}
      {activeSubTab === 'decision' && (
        <SectionCard icon="🧠" title="选型决策 FAQ"
          desc="常见选型问题的深度解答">
          <div className="space-y-3">
            {ce.decisions.map((d, i) => (
              <div key={i} className="rounded-xl border border-[#f39c12]/20 bg-[#f39c12]/04 p-4">
                <div className="flex items-start gap-2 mb-2">
                  <span className="text-[#f39c12] font-bold text-sm flex-shrink-0">Q{i + 1}</span>
                  <div className="text-[10px] font-semibold text-gray-800">{d.question}</div>
                </div>
                <div className="text-[10px] text-gray-600 leading-relaxed pl-5">{d.answer}</div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Unity Catalog Tab
// ═══════════════════════════════════════════════════════════
function UnityCatalogTab() {
  const uc = UNITY_CATALOG_INFRA_DATA;
  const [activeSubTab, setActiveSubTab] = useState('caps');

  const SUB_TABS = [
    { id: 'caps',      label: '三大能力', icon: '✨' },
    { id: 'namespace', label: '命名空间', icon: '🗂️' },
    { id: 'lineage',   label: '数据血缘', icon: '🔗' },
    { id: 'vs',        label: 'vs MLflow',  icon: '⚖️' },
    { id: 'integrate', label: '工具集成', icon: '🔌' },
    { id: 'source',    label: '源码解析', icon: '🔬' },
  ];

  return (
    <div className="space-y-4">
      {/* 定位卡片 */}
      <SectionCard icon="🗂️" title={uc.title} desc={uc.subtitle}>
        <div className="flex flex-wrap gap-2">
          {[uc.version, 'Iceberg REST Catalog', '开源自托管', 'K8s 部署'].map(t => (
            <span key={t} className="text-[9px] px-2 py-0.5 rounded-full font-mono"
              style={{ background: '#e84393' + '15', color: '#e84393', border: '1px solid #e8439330' }}>
              {t}
            </span>
          ))}
        </div>
      </SectionCard>

      {/* Sub Tab 切换 */}
      <div className="flex gap-1.5 flex-wrap">
        {SUB_TABS.map(t => (
          <button key={t.id} onClick={() => setActiveSubTab(t.id)}
            className="text-xs px-3 py-1.5 rounded-full border transition-all"
            style={{
              background: activeSubTab === t.id ? '#e84393' : 'transparent',
              color: activeSubTab === t.id ? '#fff' : '#64748b',
              borderColor: activeSubTab === t.id ? '#e84393' : '#e2e8f0',
            }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* 三大能力 */}
      {activeSubTab === 'caps' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {uc.coreCaps.map(cap => (
            <div key={cap.title} className="rounded-2xl border p-5"
              style={{ borderColor: cap.color + '30', background: cap.color + '04' }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">{cap.icon}</span>
                <div>
                  <div className="text-sm font-bold text-gray-800">{cap.title}</div>
                  <div className="text-[9px] font-mono" style={{ color: cap.color }}>{cap.catalog}</div>
                </div>
              </div>
              <p className="text-[10px] text-gray-500 mb-3 leading-relaxed">{cap.desc}</p>
              <ul className="space-y-1.5 mb-3">
                {cap.points.map((p, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-[10px] text-gray-600">
                    <span style={{ color: cap.color }} className="flex-shrink-0 mt-0.5">▸</span>
                    {p}
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-1">
                {cap.tags.map(tag => (
                  <Badge key={tag} color={cap.color}>{tag}</Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 命名空间 */}
      {activeSubTab === 'namespace' && (
        <SectionCard icon="🗂️" title="三层命名空间（Catalog → Schema → Table/Volume）"
          desc="5 个 Catalog 覆盖数据全生命周期，统一命名空间消除数据孤岛">
          <div className="space-y-2">
            {uc.namespaceOverview.map(cat => (
              <div key={cat.catalog} className="flex items-center gap-3 rounded-xl border p-3"
                style={{ borderColor: cat.color + '25', background: cat.color + '04' }}>
                <span className="text-lg flex-shrink-0">{cat.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold font-mono" style={{ color: cat.color }}>{cat.catalog}</span>
                    <span className="text-[10px] text-gray-400">{cat.desc}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {cat.schemas.map(s => (
                      <span key={s} className="text-[8px] px-1.5 py-0.5 rounded font-mono"
                        style={{ background: cat.color + '12', color: cat.color }}>.{s}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* 数据血缘 */}
      {activeSubTab === 'lineage' && (
        <SectionCard icon="🔗" title="全链路数据血缘（Column-level Lineage）"
          desc="从原始传感器帧到最终模型权重，每一步转换都有完整血缘记录">
          <div className="space-y-2">
            {uc.lineageChain.map((link, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="flex-1 rounded-lg border border-gray-100 bg-gray-50/50 p-2">
                  <div className="text-[9px] font-mono text-gray-600 truncate">{link.from}</div>
                </div>
                <div className="flex flex-col items-center flex-shrink-0 min-w-[80px]">
                  <div className="text-[8px] text-gray-400 text-center whitespace-nowrap">{link.op}</div>
                  <div className="text-sm" style={{ color: link.color }}>→</div>
                </div>
                <div className="flex-1 rounded-lg border border-gray-100 bg-gray-50/50 p-2">
                  <div className="text-[9px] font-mono text-gray-600 truncate">{link.to}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
            {['列级血缘', '影响分析', '根因定位', 'GDPR 审计'].map((cap, i) => (
              <div key={cap} className="rounded-xl border border-[#e84393]/15 bg-[#e84393]/04 p-2 text-center">
                <div className="text-[10px] font-semibold text-gray-700">{cap}</div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* vs MLflow */}
      {activeSubTab === 'vs' && (
        <SectionCard icon="⚖️" title="Unity Catalog vs 纯 MLflow"
          desc="UC 不替代 MLflow，而是作为统一元数据层包裹 MLflow">
          <div className="space-y-1.5">
            <div className="grid grid-cols-3 gap-2 text-[9px] font-semibold text-gray-400 px-2 mb-1">
              <span>维度</span><span>纯 MLflow</span><span>UC + MLflow</span>
            </div>
            {uc.vsMLflow.map(row => (
              <div key={row.aspect} className="grid grid-cols-3 gap-2 rounded-xl border border-gray-100 bg-gray-50/30 p-2.5 text-[9px]">
                <span className="font-semibold text-gray-700">{row.aspect}</span>
                <span className={`font-mono ${row.winner === 'mlflow' ? 'text-[#3fb950]' : 'text-gray-400'}`}>{row.mlflow}</span>
                <span className={`font-mono ${row.winner === 'uc' ? 'text-[#e84393] font-semibold' : 'text-gray-400'}`}>{row.uc}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* 工具集成 */}
      {activeSubTab === 'integrate' && (
        <SectionCard icon="🔌" title="工具集成"
          desc="Unity Catalog 作为统一元数据层，无缝接入现有数据栈">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {uc.integrations.map(item => (
              <div key={item.tool} className="rounded-xl border p-3"
                style={{ borderColor: item.color + '25', background: item.color + '05' }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-sm">{item.icon}</span>
                  <span className="text-[10px] font-semibold text-gray-700">{item.tool}</span>
                </div>
                <p className="text-[9px] text-gray-400 leading-relaxed">{item.role}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* 源码解析 */}
      {activeSubTab === 'source' && (
        <div className="space-y-4">
          {/* 仓库概览 */}
          <SectionCard icon="📦" title="仓库概览" desc="unitycatalog/unitycatalog · GitHub · Apache-2.0">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {[
                { label: 'Stars', value: '3.4k', icon: '⭐', color: '#f39c12' },
                { label: 'Commits', value: '689+', icon: '📝', color: '#6c5ce7' },
                { label: '主语言', value: 'Java 49%', icon: '☕', color: '#e84393' },
                { label: '最新版本', value: 'v0.5.0-SNAPSHOT', icon: '🏷️', color: '#3fb950' },
              ].map(m => (
                <div key={m.label} className="rounded-xl border border-gray-100 bg-gray-50/50 p-3 text-center">
                  <div className="text-lg mb-1">{m.icon}</div>
                  <div className="text-sm font-bold font-mono" style={{ color: m.color }}>{m.value}</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">{m.label}</div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {['Java 49%', 'Python 26%', 'Jupyter 14%', 'TypeScript 8%', 'Scala 3%'].map(lang => (
                <span key={lang} className="text-[9px] px-2 py-0.5 rounded-full font-mono bg-gray-100 text-gray-500">{lang}</span>
              ))}
            </div>
          </SectionCard>

          {/* 顶层目录结构 */}
          <SectionCard icon="🗂️" title="顶层目录结构" desc="monorepo 架构，服务端 Java + Python AI SDK + TypeScript UI">
            <pre className="text-[10px] leading-[1.6] text-gray-700 bg-gray-50 border border-gray-200 p-4 rounded-xl overflow-x-auto font-mono whitespace-pre">{`unitycatalog/
├── server/                    # 核心服务端（Java / Scala）
│   └── src/main/java/io/unitycatalog/server/
│       ├── UnityCatalogServer.java   # 入口：Armeria HTTP 服务器
│       ├── service/                  # REST API 处理层
│       │   ├── CatalogService.java   # Catalog CRUD
│       │   ├── TableService.java     # Table / Delta 操作
│       │   ├── ModelService.java     # 模型注册
│       │   ├── SchemaService.java    # Schema 管理
│       │   ├── VolumeService.java    # 非结构化数据卷
│       │   ├── FunctionService.java  # UDF 注册
│       │   ├── AuthService.java      # 认证服务
│       │   ├── PermissionService.java# 权限管理
│       │   ├── IcebergRestCatalogService.java  # Iceberg REST 协议
│       │   └── credential/           # 临时凭证下发
│       ├── persist/                  # 持久化层（Hibernate ORM）
│       │   ├── CatalogRepository.java
│       │   ├── TableRepository.java
│       │   ├── ModelRepository.java
│       │   ├── SchemaRepository.java
│       │   ├── VolumeRepository.java
│       │   └── dao/                  # JPA Entity 定义
│       ├── auth/                     # 认证 & JWT
│       ├── security/                 # 权限表达式引擎
│       └── utils/                    # 工具类
├── ai/                        # Python AI SDK（unitycatalog-ai）
│   ├── core/                         # 核心 Python 客户端
│   └── integrations/                 # LangChain / OpenAI / Anthropic 集成
├── api/                       # OpenAPI 规范（YAML）
├── clients/                   # 多语言客户端（Java / Python）
├── connectors/spark/          # Apache Spark 连接器
├── ui/                        # TypeScript React 前端
├── integration-tests/         # 集成测试
└── helm/                      # Kubernetes Helm Chart`}</pre>
          </SectionCard>

          {/* 核心模块解析 */}
          <SectionCard icon="🔍" title="核心模块深度解析" desc="从 HTTP 请求到数据库持久化的完整链路">
            <div className="space-y-3">
              {[
                {
                  module: 'UnityCatalogServer.java',
                  path: 'server/src/main/java/io/unitycatalog/server/',
                  role: '服务入口',
                  color: '#e84393',
                  desc: '基于 Armeria（非 Vert.x）构建的异步 HTTP 服务器。Armeria 是 LINE 开源的高性能 Java 异步框架，支持 HTTP/1.1、HTTP/2 和 gRPC。注册所有 REST 路由，初始化 Hibernate ORM 连接池，启动 JWT 认证中间件。',
                  keyPoints: [
                    'Armeria ServerBuilder 注册 /api/2.1/unity-catalog/* 路由（非 Vert.x）',
                    'HikariCP 连接池 + H2（开发）/ PostgreSQL（生产）',
                    'UnityAccessDecorator 拦截所有请求做权限验证',
                    'URLTranscoderVerticle 处理 HTTP ↔ gRPC 协议转码',
                    'DocService 自动生成 API 文档（Armeria 内置）',
                  ],
                },
                {
                  module: 'service/ 层',
                  path: 'server/src/main/java/io/unitycatalog/server/service/',
                  role: 'REST API 处理',
                  color: '#6c5ce7',
                  desc: '每个资源类型对应一个 Service 类，实现 CRUD 操作。Service 层调用 Repository 层做持久化，调用 AuthorizedService 做权限检查。',
                  keyPoints: [
                    'TableService：处理 Delta Lake 表的 CRUD + 临时凭证下发',
                    'ModelService：MLflow 兼容的模型注册 API',
                    'IcebergRestCatalogService：实现 Iceberg REST Catalog 协议，兼容 Spark/Flink',
                    'CredentialService：为 S3/GCS/ADLS 下发短期 STS 凭证',
                    'PermissionService：基于 JCasbin 的权限管理，@AuthorizeExpression 注解驱动',
                  ],
                },
                {
                  module: 'persist/ 层',
                  path: 'server/src/main/java/io/unitycatalog/server/persist/',
                  role: '数据持久化（Hibernate ORM）',
                  color: '#00cec9',
                  desc: 'Repository 模式封装所有数据库操作。使用 Hibernate 6 + JPA，支持 H2（嵌入式）和 PostgreSQL（生产）。dao/ 子目录存放 JPA Entity 定义。',
                  keyPoints: [
                    'Repositories.java：单例工厂，统一管理所有 Repository 实例',
                    'TableRepository：Delta 表元数据 + 分区信息（无血缘字段，血缘在 Roadmap 规划中）',
                    'ModelRepository：模型版本 + 阶段（Staging/Production）管理',
                    'dao/：TableInfoDAO / ColumnInfoDAO / ModelVersionInfoDAO 等 JPA Entity',
                    '事务管理：Hibernate Session 手动管理，无 Spring @Transactional',
                  ],
                },
                {
                  module: 'auth/ + security/ 层',
                  path: 'server/src/main/java/io/unitycatalog/server/auth/',
                  role: '权限引擎（JCasbin + SpEL）',
                  color: '#ffa657',
                  desc: '权限引擎基于 JCasbin（非 CEL）+ Spring Expression Language（SpEL）。JCasbinAuthorizer 将策略存储在数据库（JDBCAdapter），@AuthorizeExpression 注解使用 SpEL 表达式声明权限规则。',
                  keyPoints: [
                    'JCasbinAuthorizer：基于 JCasbin 库，策略存 DB（JDBCAdapter），支持 RBAC/ABAC',
                    "@AuthorizeExpression：SpEL 表达式注解，如 #authorize(#principal, #table, 'SELECT')",
                    'UnityAccessDecorator：AOP 拦截器，在 Service 方法执行前做权限检查',
                    'AuthorizeResourceKey：统一资源标识符（catalog.schema.table）',
                    'SCIM 2.0 用户/组管理（Scim2UserService / Scim2SelfService）',
                    '支持 OAuth2 / OIDC 外部身份提供商（模块化认证，v0.5 新增）',
                  ],
                },
                {
                  module: 'ai/ Python SDK',
                  path: 'ai/core/ + ai/integrations/',
                  role: 'AI 工具函数注册',
                  color: '#3fb950',
                  desc: 'unitycatalog-ai Python 包，让 AI Agent 可以发现和调用 UC 中注册的 Python 函数。支持 LangChain / OpenAI Function Calling / Anthropic Tool Use。',
                  keyPoints: [
                    'UnityCatalogFunctionClient：注册/调用 UC 中的 Python UDF',
                    'UCFunctionToolkit：将 UC 函数转换为 LangChain Tool',
                    'integrations/：LangChain / LlamaIndex / OpenAI / Anthropic 适配器',
                    '函数签名自动转换为 JSON Schema（供 LLM 理解）',
                  ],
                },
              ].map(mod => (
                <div key={mod.module} className="rounded-xl border p-4"
                  style={{ borderColor: mod.color + '25', background: mod.color + '03' }}>
                  <div className="flex items-start gap-3 mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-bold font-mono" style={{ color: mod.color }}>{mod.module}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                          style={{ background: mod.color + '15', color: mod.color }}>{mod.role}</span>
                      </div>
                      <div className="text-[9px] text-gray-400 font-mono mb-1.5">{mod.path}</div>
                      <p className="text-[10px] text-gray-600 leading-relaxed mb-2">{mod.desc}</p>
                      <ul className="space-y-1">
                        {mod.keyPoints.map((p, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-[10px] text-gray-500">
                            <span style={{ color: mod.color }} className="flex-shrink-0 mt-0.5">▸</span>
                            {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* 核心调用链路 */}
          <SectionCard icon="🔄" title="核心调用链路" desc="一次 CREATE TABLE 请求的完整生命周期">
            <pre className="text-[10px] leading-[1.7] text-gray-700 bg-gray-50 border border-gray-200 p-4 rounded-xl overflow-x-auto font-mono whitespace-pre">{`HTTP POST /api/2.1/unity-catalog/tables
         │
         ▼
Armeria HTTP Server            # 路由分发（非 Vert.x）
         │
         ▼
UnityAccessDecorator.handle()  # JWT 验证 + 提取 caller identity
         │
         ▼
TableService.createTable()     # 业务逻辑入口
    │
    ├─► UnityAccessEvaluator   # 权限检查（JCasbin + SpEL 表达式）
    │       └─ @AuthorizeExpression("#authorize(#principal, #schema, 'CREATE_TABLE')")
    │
    ├─► 参数校验 + 类型推断
    │       └─ Delta / Iceberg / CSV / Parquet 格式识别
    │
    ├─► TableRepository.create()   # 持久化
    │       ├─ Hibernate Session.save(TableInfoDAO)
    │       ├─ 写入列信息 ColumnInfoDAO[]
    │       └─ 写入分区信息（无血缘字段，血缘为 Roadmap ❓ 规划中）
    │
    └─► 返回 TableInfo JSON    # 序列化响应`}</pre>
          </SectionCard>

          {/* 关键设计决策 */}
          <SectionCard icon="💡" title="关键设计决策" desc="UC 源码中体现的架构哲学">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { title: 'Armeria 异步框架', desc: '选择 Armeria（LINE 开源）而非 Spring Boot / Vert.x，原生支持 HTTP/1.1、HTTP/2、gRPC，内置 DocService 自动生成 API 文档，适合高并发元数据查询场景。', color: '#e84393' },
                { title: 'OpenAPI 优先', desc: 'api/ 目录存放 OpenAPI YAML 规范，所有客户端代码（Java/Python/TypeScript）均由 OpenAPI Generator 自动生成，保证多语言 API 一致性。', color: '#6c5ce7' },
                { title: 'Iceberg REST 协议兼容', desc: 'IcebergRestCatalogService 实现了 Iceberg REST Catalog 标准协议，使 Spark/Flink/Trino 可以直接将 UC 作为 Iceberg Catalog，无需额外适配层。', color: '#00cec9' },
                { title: 'JCasbin + SpEL 权限引擎', desc: '权限引擎基于 JCasbin（非 CEL），策略存储在数据库（JDBCAdapter）。@AuthorizeExpression 注解使用 SpEL 表达式声明权限规则，如 #authorize(#principal, #table, \'SELECT\')。', color: '#ffa657' },
                { title: '临时凭证下发', desc: 'TemporaryTableCredentialsService 为每次数据访问下发短期 STS 凭证（15 分钟），数据平面（S3/GCS）与控制平面（UC 服务器）完全解耦，数据不经过 UC 服务器。', color: '#3fb950' },
                { title: '血缘（Roadmap ❓ 规划中）', desc: '当前版本（v0.5）尚未实现数据血缘功能。官方 Roadmap 中 Lineage 标注为 ❓（未排期），TableInfoDAO 和 ColumnInfoDAO 中均无血缘字段。Databricks 商业版 UC 有完整血缘，开源版待实现。', color: '#94a3b8' },
              ].map(item => (
                <div key={item.title} className="rounded-xl border p-3"
                  style={{ borderColor: item.color + '25', background: item.color + '04' }}>
                  <div className="text-[10px] font-bold mb-1" style={{ color: item.color }}>{item.title}</div>
                  <p className="text-[10px] text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// 主组件
// ═══════════════════════════════════════════════════════════
export default function DataInfraViz() {
  const [activeTab, setActiveTab] = useHashState('tab', 'overview');

  const tabComponents = useMemo(() => ({
    overview:      <OverviewTab />,
    k8s:           <K8sTab />,
    datalake:      <DatalakeTab />,
    pipeline:      <PipelineTab />,
    compute:       <ComputeEngineTab />,
    unitycatalog:  <UnityCatalogTab />,
    mlops:         <MLOpsTab />,
    observability: <ObservabilityTab />,
    vectordb:      <VectorTab />,
    dedup:         <DedupTab />,
    synth:         <SynthTab />,
    framework:     <FrameworkTab />,
  }), []);

  const activeInfo = INFRA_TABS.find(t => t.id === activeTab);

  return (
    <div>
      {/* Tab 切换 */}
      <div className="flex flex-wrap gap-1.5 mb-6 p-1.5 bg-gray-50 rounded-2xl border border-gray-100">
        {INFRA_TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className="flex items-center gap-1.5 py-2 px-3 rounded-xl text-xs font-medium transition-all whitespace-nowrap"
            style={activeTab === tab.id
              ? { background: '#fff', color: tab.color, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: `1px solid ${tab.color}33` }
              : { color: '#94a3b8' }}>
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 当前 Tab 标题 */}
      <div className="mb-5 flex items-center gap-2">
        <span className="text-lg">{activeInfo?.icon}</span>
        <div>
          <h2 className="text-base font-semibold text-gray-800">{activeInfo?.label}</h2>
          <p className="text-xs text-gray-400">{activeInfo?.desc}</p>
        </div>
      </div>

      {/* Tab 内容 */}
      {tabComponents[activeTab]}
    </div>
  );
}