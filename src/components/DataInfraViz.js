'use client';

import { useState, useMemo } from 'react';
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
  const { clusters, components, namespaces, gpuStrategy } = K8S_DATA;

  return (
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
// 3. 数据湖仓 — 多模态存储方案（可独立使用）
// ─────────────────────────────────────────────────────────────
export function DatalakeTab() {
  const { dataChain, modalSpecs, icebergSchemas, edgeClient, webdatasetData,
          storageFormats, trainDatasetBuild, ioOptimization,
          icebergFeatures, lakeFSWorkflow, comparison, queryEngines } = DATALAKE_DATA;
  const [activeSubTab, setActiveSubTab] = useState('formats');
  const [selectedTable, setSelectedTable] = useState(null);
  const [selectedStage, setSelectedStage] = useState('collect');
  const [selectedAccess, setSelectedAccess] = useState(0);

  const SUB_TABS = [
    { id: 'formats',    label: '存储格式全景',   icon: '🗺️' },
    { id: 'chain',      label: '多模态数据链路', icon: '🔗' },
    { id: 'schema',     label: 'Schema 设计',  icon: '📐' },
    { id: 'webdataset', label: 'WebDataset',   icon: '📼' },
    { id: 'modal',      label: '模态存储规格', icon: '📦' },
    { id: 'train',      label: '训练集构建',   icon: '🧠' },
    { id: 'io',         label: 'IO 优化',      icon: '⚡' },
    { id: 'iceberg',    label: 'Iceberg',      icon: '🧊' },
    { id: 'lakefs',     label: 'LakeFS 版本',  icon: '🌿' },
  ];

  return (
    <div className="space-y-4">
      {/* 定位说明 */}
      <div className="rounded-2xl border border-[#00cec9]/20 bg-[#00cec9]/04 p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🏞️</span>
          <div>
            <div className="text-sm font-bold text-gray-800 mb-1">自动驾驶多模态存储方案</div>
            <div className="text-[10px] text-gray-500 leading-relaxed">
              覆盖 <span className="font-semibold text-[#00cec9]">车端采集 → Landing → Bronze → Silver → Gold</span> 全链路存储规范，
              五模态（相机/LiDAR/雷达/标注/语言）统一存储选型，含 Schema 设计、WebDataset 打包、IO 优化、Iceberg 与 LakeFS 版本管理。
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {['Apache Iceberg', 'WebDataset', 'LakeFS', 'JuiceFS', 'Parquet', 'Unity Catalog'].map(t => (
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

      {/* ── 存储格式全景 ── */}
      {activeSubTab === 'formats' && (() => {
        const stage = storageFormats.stages.find(s => s.id === selectedStage) || storageFormats.stages[0];
        return (
          <div className="space-y-4">
            {/* 顶部定位 */}
            <div className="rounded-2xl border border-[#00cec9]/20 bg-[#00cec9]/04 p-4">
              <div className="text-sm font-bold text-gray-800 mb-1">{storageFormats.title}</div>
              <div className="text-[10px] text-gray-500 mb-3">{storageFormats.subtitle}</div>
              {/* 5阶段选择器 */}
              <div className="flex flex-wrap gap-2">
                {storageFormats.stages.map(s => (
                  <button key={s.id} onClick={() => { setSelectedStage(s.id); setSelectedAccess(0); }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-all"
                    style={{
                      background: selectedStage === s.id ? s.color + '15' : 'transparent',
                      color: selectedStage === s.id ? s.color : '#64748b',
                      borderColor: selectedStage === s.id ? s.color + '50' : '#e2e8f0',
                      fontWeight: selectedStage === s.id ? 700 : 400,
                    }}>
                    <span>{s.icon}</span>
                    <span>{s.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 阶段详情 */}
            <div className="rounded-2xl border p-5"
              style={{ borderColor: stage.color + '30', background: stage.color + '05' }}>
              {/* 头部 */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{stage.icon}</span>
                  <div>
                    <div className="text-base font-bold text-gray-800">{stage.name}</div>
                    <div className="text-[10px] font-medium" style={{ color: stage.color }}>{stage.subtitle}</div>
                    <div className="text-[9px] text-gray-400 mt-0.5">{stage.location} · {stage.lifecycle}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[8px] text-gray-400 mb-1">日数据量</div>
                  <div className="text-xs font-bold" style={{ color: stage.color }}>{stage.dailyVolume}</div>
                </div>
              </div>

              {/* 格式裁决 */}
              <div className="rounded-xl border p-3 mb-4"
                style={{ borderColor: stage.color + '30', background: stage.color + '08' }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold text-gray-700">✅ 最优格式：</span>
                  <span className="text-[10px] font-bold" style={{ color: stage.color }}>{stage.verdict.format}</span>
                  <span className="text-[9px] px-2 py-0.5 rounded-full ml-auto"
                    style={{ background: stage.color + '15', color: stage.color }}>{stage.verdict.reason}</span>
                </div>
                <div className="flex gap-0.5 mt-1">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className="w-4 h-1.5 rounded-full"
                      style={{ background: i <= stage.verdict.score ? stage.color : stage.color + '25' }} />
                  ))}
                </div>
              </div>

              {/* 为什么选这个格式 */}
              <div className="mb-4">
                <div className="text-[10px] font-semibold text-gray-600 mb-2">💡 为什么选这个格式？</div>
                <div className="space-y-1">
                  {stage.whyThisFormat.map((r, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-[9px] text-gray-600">
                      <span style={{ color: stage.color }} className="flex-shrink-0 mt-0.5">▸</span>
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 存储介质 */}
              {stage.storageMedia && (
                <div className="mb-4 rounded-xl border p-3"
                  style={{ borderColor: stage.color + '25', background: stage.color + '06' }}>
                  <div className="text-[10px] font-semibold text-gray-600 mb-2">
                    {stage.storageMedia.icon} 存储介质：{stage.storageMedia.title}
                  </div>
                  <div className="text-[9px] font-mono font-semibold mb-1.5" style={{ color: stage.color }}>
                    {stage.storageMedia.spec}
                  </div>
                  <div className="text-[9px] text-gray-600 mb-2 leading-relaxed">{stage.storageMedia.why}</div>
                  <div className="flex flex-wrap gap-2 mb-2 text-[8px]">
                    <span className="text-gray-400">生命周期：<span className="text-gray-600">{stage.storageMedia.lifecycle}</span></span>
                    {stage.storageMedia.costNote && (
                      <span className="text-gray-400">成本参考：<span className="text-gray-600">{stage.storageMedia.costNote}</span></span>
                    )}
                  </div>
                  {stage.storageMedia.alternatives && (
                    <div>
                      <div className="text-[8px] text-gray-400 mb-1">为什么不用其他方案：</div>
                      <div className="space-y-0.5">
                        {stage.storageMedia.alternatives.map((alt, i) => (
                          <div key={i} className="flex items-start gap-1.5 text-[8px] text-gray-500">
                            <span className="font-mono font-semibold text-gray-600 flex-shrink-0">{alt.name}：</span>
                            <span>{alt.reason}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Schema */}
              <div className="mb-4">
                <div className="text-[10px] font-semibold text-gray-600 mb-2">📐 Schema 设计</div>
                <div className="text-[9px] text-gray-500 mb-2">{stage.schema.desc}</div>

                {/* MCAP 阶段：关键字段 */}
                {stage.schema.keyFields && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-[9px]">
                      <thead><tr className="border-b border-gray-100">
                        <th className="text-left py-1 px-2 text-gray-400">字段</th>
                        <th className="text-left py-1 px-2 text-gray-400">类型</th>
                        <th className="text-left py-1 px-2 text-gray-400">说明</th>
                      </tr></thead>
                      <tbody>
                        {stage.schema.keyFields.map((f, i) => (
                          <tr key={i} className={`border-b border-gray-50 ${i%2===0?'bg-gray-50/20':''}`}>
                            <td className="py-1 px-2 font-mono font-semibold" style={{ color: stage.color }}>{f.field}</td>
                            <td className="py-1 px-2 font-mono text-gray-400 text-[8px]">{f.type}</td>
                            <td className="py-1 px-2 text-gray-500">{f.desc}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Bronze/Silver/Gold 阶段：多张表 */}
                {stage.schema.tables && stage.schema.tables.map(tbl => (
                  <div key={tbl.name} className="mb-3 rounded-xl border border-gray-100 bg-white/80 p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-bold font-mono" style={{ color: stage.color }}>{tbl.name}</span>
                      <Badge color={stage.color}>{tbl.rowUnit}</Badge>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-[9px]">
                        <thead><tr className="border-b border-gray-100">
                          <th className="text-left py-1 px-2 text-gray-400">字段</th>
                          <th className="text-left py-1 px-2 text-gray-400">类型</th>
                          <th className="text-left py-1 px-2 text-gray-400">说明</th>
                        </tr></thead>
                        <tbody>
                          {tbl.keyFields.map((f, i) => (
                            <tr key={i} className={`border-b border-gray-50 ${i%2===0?'bg-gray-50/20':''}`}>
                              <td className="py-1 px-2 font-mono font-semibold" style={{ color: stage.color }}>{f.field}</td>
                              <td className="py-1 px-2 font-mono text-gray-400 text-[8px]">{f.type}</td>
                              <td className="py-1 px-2 text-gray-500">{f.desc}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 text-[8px]">
                      {tbl.partitionBy && <span className="text-gray-400">分区: <span className="font-mono text-gray-600">{tbl.partitionBy}</span></span>}
                      {tbl.rowsPerDay && <span className="text-gray-400">行数/天: <span className="font-mono" style={{ color: stage.color }}>{tbl.rowsPerDay}</span></span>}
                      {tbl.volumeRef && <span className="text-gray-400">Volume: <span className="font-mono text-gray-500">{tbl.volumeRef}</span></span>}
                    </div>
                  </div>
                ))}

                {/* Silver 转换操作 */}
                {stage.schema.silverTransform && (
                  <div className="mt-2">
                    <div className="text-[9px] font-semibold text-gray-600 mb-1">🔄 Silver 层转换操作</div>
                    <div className="flex flex-wrap gap-1.5">
                      {stage.schema.silverTransform.map(op => (
                        <div key={op.op} className="rounded-lg border border-[#79c0ff]/20 bg-[#79c0ff]/05 px-2 py-1">
                          <span className="text-[8px] font-semibold text-[#79c0ff]">{op.op}: </span>
                          <span className="text-[8px] text-gray-500">{op.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* WebDataset tar 布局 */}
                {stage.schema.tarLayout && (
                  <div className="space-y-1">
                    {stage.schema.tarLayout.map((f, i) => (
                      <div key={i} className="flex items-center gap-2 rounded-lg border border-gray-100 bg-white/80 p-1.5">
                        <span className="text-[8px] font-mono text-[#3fb950] w-56 flex-shrink-0">{f.file}</span>
                        <span className="text-[8px] text-gray-400">{f.desc}</span>
                      </div>
                    ))}
                    {stage.schema.featureParquet && (
                      <div className="mt-3 rounded-xl border border-[#3fb950]/20 bg-[#3fb950]/05 p-3">
                        <div className="text-[9px] font-bold text-[#3fb950] mb-1">{stage.schema.featureParquet.name}</div>
                        <div className="text-[8px] text-gray-500 mb-2">{stage.schema.featureParquet.desc}</div>
                        <div className="flex flex-wrap gap-1">
                          {stage.schema.featureParquet.keyFields.map(f => (
                            <div key={f.field} className="rounded px-1.5 py-0.5 border border-[#3fb950]/15 bg-white/80">
                              <span className="text-[8px] font-mono font-semibold text-[#3fb950]">{f.field}</span>
                              <span className="text-[7px] text-gray-400 ml-1">{f.type}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 访问方式 */}
              <div className="mb-3">
                <div className="text-[10px] font-semibold text-gray-600 mb-2">🔍 访问方式</div>
                <div className="flex gap-1.5 mb-2 flex-wrap">
                  {stage.accessPatterns.map((ap, i) => (
                    <button key={i} onClick={() => setSelectedAccess(i)}
                      className="text-[9px] px-2.5 py-1 rounded-full border transition-all"
                      style={{
                        background: selectedAccess === i ? stage.color : 'transparent',
                        color: selectedAccess === i ? '#fff' : '#64748b',
                        borderColor: selectedAccess === i ? stage.color : '#e2e8f0',
                      }}>
                      {ap.pattern}
                    </button>
                  ))}
                </div>
                {stage.accessPatterns[selectedAccess] && (
                  <div className="rounded-xl border p-3"
                    style={{ borderColor: stage.color + '20', background: stage.color + '04' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge color={stage.color}>{stage.accessPatterns[selectedAccess].tool}</Badge>
                      <span className="text-[9px] text-gray-400">{stage.accessPatterns[selectedAccess].note}</span>
                    </div>
                    <pre className="text-[8px] font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap"
                      style={{ color: stage.color }}>
                      {stage.accessPatterns[selectedAccess].code}
                    </pre>
                  </div>
                )}
              </div>

              {/* 流向 */}
              <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-2 text-center">
                <span className="text-[9px] text-gray-400">下一阶段: </span>
                <span className="text-[9px] font-semibold text-gray-600">{stage.toNextStage}</span>
              </div>
            </div>

            {/* 格式选型决策矩阵 */}
            <SectionCard icon="📊" title={storageFormats.decisionMatrix.title} desc="">
              <div className="overflow-x-auto">
                <table className="w-full text-[9px]">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {storageFormats.decisionMatrix.dimensions.map(d => (
                        <th key={d} className="text-left py-1.5 px-2 text-gray-400 font-medium whitespace-nowrap">{d}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {storageFormats.decisionMatrix.formats.map((fmt, i) => (
                      <tr key={fmt.name} className={`border-b border-gray-50 ${i%2===0?'bg-gray-50/20':''}`}>
                        <td className="py-1.5 px-2 font-mono font-bold text-[#00cec9]">{fmt.name}</td>
                        <td className="py-1.5 px-2 text-gray-500">{fmt.stage}</td>
                        <td className="py-1.5 px-2 text-gray-500">{fmt.write}</td>
                        <td className="py-1.5 px-2 text-gray-500">{fmt.read}</td>
                        <td className="py-1.5 px-2 text-gray-500">{fmt.query}</td>
                        <td className="py-1.5 px-2 text-gray-500">{fmt.version}</td>
                        <td className="py-1.5 px-2 text-gray-500">{fmt.scale}</td>
                        <td className="py-1.5 px-2 text-amber-600 text-[8px]">{fmt.limit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          </div>
        );
      })()}

      {/* ── 多模态数据链路（含车端工程规范） ── */}
      {activeSubTab === 'chain' && (
        <div className="space-y-4">

          {/* ── 车端工程规范（折叠） ── */}
          <EdgeClientPanel edgeClient={edgeClient} />

          {/* ── 全链路流转 ── */}
          <div className="text-xs font-semibold text-gray-600 mb-1">{dataChain.title}</div>
          <div className="space-y-2">
          {dataChain.stages.map((stage, i) => (
            <div key={stage.name}>
              <div className="rounded-2xl border p-4"
                style={{ borderColor: stage.color + '30', background: stage.color + '05' }}>
                {/* 阶段头 */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">{stage.icon}</span>
                  <div>
                    <div className="text-xs font-bold text-gray-800">{stage.name}</div>
                    <div className="text-[9px] font-mono" style={{ color: stage.color }}>{stage.location}</div>
                  </div>
                  {stage.dailyVolume && (
                    <Badge color={stage.color} >{stage.dailyVolume}</Badge>
                  )}
                </div>

                {/* 车端采集：模态列表 */}
                {stage.modalities && (
                  <div className="space-y-1">
                    {stage.modalities.map(m => (
                      <div key={m.name} className="flex items-center gap-2 rounded-lg border border-gray-100 bg-white/80 p-2 text-[9px]">
                        <span className="font-semibold text-gray-700 w-24 flex-shrink-0">{m.name}</span>
                        <span className="font-mono text-gray-400 w-28 flex-shrink-0">{m.format}</span>
                        <span className="text-gray-400 w-12 flex-shrink-0">{m.rate}</span>
                        <span className="font-mono" style={{ color: stage.color }}>{m.size}</span>
                        <span className="text-gray-300 ml-auto">压缩: {m.compress}</span>
                      </div>
                    ))}
                    <div className="text-[9px] font-semibold text-gray-600 mt-2">
                      输出: <span className="font-mono" style={{ color: stage.color }}>{stage.output}</span>
                    </div>
                  </div>
                )}

                {/* 湖仓层：描述 + 格式 + 操作 */}
                {stage.desc && (
                  <div className="space-y-2">
                    <p className="text-[10px] text-gray-500">{stage.desc}</p>
                    <div className="flex flex-wrap gap-2 text-[9px]">
                      <span className="font-mono px-2 py-0.5 rounded" style={{ background: stage.color + '12', color: stage.color }}>
                        格式: {stage.format}
                      </span>
                      <span className="font-mono px-2 py-0.5 rounded bg-gray-100 text-gray-500">
                        分区: {stage.partition}
                      </span>
                      <span className="font-mono px-2 py-0.5 rounded bg-gray-100 text-gray-500">
                        生命周期: {stage.lifecycle}
                      </span>
                    </div>
                    {/* Bronze 模态存储 */}
                    {stage.modalStorage && (
                      <div className="space-y-1 mt-2">
                        {stage.modalStorage.map(ms => (
                          <div key={ms.modality} className="flex items-center gap-2 rounded-lg border border-gray-100 bg-white/80 p-2 text-[9px]">
                            <span className="font-semibold text-gray-700 w-20 flex-shrink-0">{ms.modality}</span>
                            <span className="font-mono text-gray-400 flex-1">{ms.format}</span>
                            <span className="font-mono" style={{ color: stage.color }}>{ms.size}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Silver 操作列表 */}
                    {stage.ops && !stage.modalStorage && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {stage.ops.map(op => (
                          <span key={op} className="text-[8px] px-1.5 py-0.5 rounded"
                            style={{ background: stage.color + '12', color: stage.color }}>{op}</span>
                        ))}
                      </div>
                    )}
                    {/* Gold 标注类型 */}
                    {stage.annotations && (
                      <div className="space-y-1 mt-2">
                        {stage.annotations.map(a => (
                          <div key={a.type} className="flex items-center gap-2 rounded-lg border border-gray-100 bg-white/80 p-2 text-[9px]">
                            <span className="font-semibold text-gray-700 w-20 flex-shrink-0">{a.type}</span>
                            <span className="text-gray-400 flex-1">{a.tool}</span>
                            <Badge color={stage.color}>自动化 {a.autoRate}</Badge>
                            <span className="font-mono text-gray-300">{a.format}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              {i < dataChain.stages.length - 1 && (
                <div className="text-center text-[9px] text-gray-300 py-1 font-mono">
                  ↓ {i === 0 ? '5G/WiFi 上传 · 增量同步' : i === 1 ? 'Spark + RAPIDS 解码对齐' : i === 2 ? 'Spark 清洗 · 场景切分' : 'BEVFusion + SAM2 自动标注'}
                </div>
              )}
            </div>
          ))}
          </div>
        </div>
      )}
      {activeSubTab === 'schema' && (
        <div className="space-y-4">
          {/* ① 数据粒度层次（最顶部，先看这里）*/}
          <div className="rounded-2xl border border-[#00cec9]/20 bg-white p-5">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">📐</span>
              <div className="text-sm font-bold text-gray-800">{icebergSchemas.granularity.title}</div>
            </div>
            <div className="text-[10px] text-gray-500 mb-4">{icebergSchemas.granularity.desc}</div>

            {/* 四层粒度卡片 */}
            <div className="space-y-2 mb-4">
              {icebergSchemas.granularity.levels.map((lv, i) => (
                <div key={lv.level}>
                  <div className="rounded-xl border p-3"
                    style={{ borderColor: lv.color + '30', background: lv.color + '05' }}>
                    <div className="flex items-start gap-3">
                      <span className="text-xl flex-shrink-0">{lv.icon}</span>
                      <div className="flex-1 min-w-0">
                        {/* 标题行 */}
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-xs font-bold" style={{ color: lv.color }}>{lv.level}</span>
                          <span className="text-[9px] px-2 py-0.5 rounded-full font-mono"
                            style={{ background: lv.color + '15', color: lv.color }}>
                            ⏱ {lv.duration}
                          </span>
                          <span className="text-[9px] px-2 py-0.5 rounded-full font-mono"
                            style={{ background: lv.color + '15', color: lv.color }}>
                            💾 {lv.size}
                          </span>
                        </div>
                        {/* 描述 */}
                        <p className="text-[10px] text-gray-600 mb-1.5">{lv.desc}</p>
                        {/* 关键信息行 */}
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[9px] mb-1.5">
                          <span className="text-gray-400">主键: <span className="font-mono font-semibold" style={{ color: lv.color }}>{lv.keyId}</span></span>
                          <span className="text-gray-400">Iceberg 表: <span className="font-mono text-gray-600">{lv.icebergTable}</span></span>
                        </div>
                        {/* 示例 */}
                        <div className="text-[8px] font-mono text-gray-400 bg-gray-50 rounded px-2 py-1 mb-1.5">
                          例: {lv.example}
                        </div>
                        {/* 特殊说明 */}
                        <div className="text-[9px] text-amber-600">{lv.note}</div>
                        {/* Scene 切割策略 */}
                        {lv.cutStrategy && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {lv.cutStrategy.map(cs => (
                              <div key={cs.type} className="rounded-lg border border-[#ffa657]/20 bg-[#ffa657]/05 px-2 py-1">
                                <span className="text-[8px] font-semibold text-[#ffa657]">{cs.type}</span>
                                <span className="text-[8px] text-gray-400 ml-1">{cs.desc}</span>
                                <span className="text-[8px] font-mono text-[#ffa657] ml-1">({cs.ratio})</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {/* Frame 行数说明 */}
                        {lv.rowsPerScene && (
                          <div className="mt-2 grid grid-cols-2 gap-1">
                            {Object.entries(lv.rowsPerScene).map(([k, v]) => (
                              <div key={k} className="text-[8px] font-mono text-gray-500">
                                <span className="text-[#3fb950]">{k}: </span>{v}
                              </div>
                            ))}
                          </div>
                        )}
                        {/* Session 视频文件说明 */}
                        {lv.videoFiles && (
                          <div className="mt-1.5 flex gap-3 text-[8px]">
                            <span className="font-mono text-[#e84393]">视频文件: {lv.videoFiles}</span>
                            <span className="font-mono text-[#e84393]">帧数: {lv.frameCount}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {i < icebergSchemas.granularity.levels.length - 1 && (
                    <div className="text-center text-[9px] text-gray-300 py-0.5 font-mono">
                      {i === 0 ? '↓ 按 15min 自动切割' : i === 1 ? '↓ 按 20s 窗口 / 事件触发切割' : '↓ 按采样率拆分（20Hz / 10Hz / 13Hz）'}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* 粒度换算速查表 */}
            <div className="rounded-xl border border-[#00cec9]/15 bg-[#00cec9]/04 p-3">
              <div className="text-[10px] font-semibold text-gray-700 mb-2">🔢 粒度换算速查</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {icebergSchemas.granularity.conversion.map((c, i) => (
                  <div key={i} className="rounded-lg border border-[#00cec9]/15 bg-white/80 p-2">
                    <div className="text-[9px] font-mono font-semibold text-[#00cec9]">{c.from}</div>
                    <div className="text-[10px] font-bold text-gray-700">{c.to}</div>
                    <div className="text-[8px] text-gray-400">{c.note}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ② 核心关联键 */}
          <div className="rounded-xl border border-[#00cec9]/20 bg-[#00cec9]/05 p-3">
            <div className="text-[10px] font-semibold text-gray-700 mb-2">🔑 核心关联键</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {icebergSchemas.joinKeys.map(k => (
                <div key={k.key} className="rounded-lg border border-[#00cec9]/15 bg-white/80 p-2">
                  <div className="text-[9px] font-bold font-mono text-[#00cec9]">{k.key}</div>
                  <div className="text-[8px] text-gray-400 font-mono mb-0.5">{k.type}</div>
                  <div className="text-[8px] text-gray-500 leading-relaxed">{k.desc}</div>
                  <div className="text-[8px] font-mono text-gray-300 mt-0.5">e.g. {k.example}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 表选择器 */}
          <div className="flex flex-wrap gap-1.5">
            {icebergSchemas.tables.map(t => (
              <button key={t.name} onClick={() => setSelectedTable(selectedTable === t.name ? null : t.name)}
                className="text-[9px] px-2.5 py-1 rounded-lg border transition-all font-mono"
                style={{
                  background: selectedTable === t.name ? t.color + '15' : 'transparent',
                  color: selectedTable === t.name ? t.color : '#64748b',
                  borderColor: selectedTable === t.name ? t.color + '50' : '#e2e8f0',
                  fontWeight: selectedTable === t.name ? 600 : 400,
                }}>
                {t.icon} {t.name.split('.').pop()}
              </button>
            ))}
          </div>

          {/* 选中表的 Schema 详情 */}
          {icebergSchemas.tables.map(table => (
            (selectedTable === null || selectedTable === table.name) && (
              <div key={table.name} className="rounded-2xl border p-4"
                style={{ borderColor: table.color + '25', background: table.color + '04' }}>
                {/* 表头 */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{table.icon}</span>
                    <div>
                      <div className="text-xs font-bold font-mono" style={{ color: table.color }}>{table.name}</div>
                      <div className="text-[9px] text-gray-500 mt-0.5">{table.desc}</div>
                    </div>
                  </div>
                  <div className="text-right text-[8px] text-gray-400 space-y-0.5">
                    <div>分区: <span className="font-mono text-gray-600">{table.partitionBy}</span></div>
                    <div>排序: <span className="font-mono text-gray-600">{table.sortBy}</span></div>
                  </div>
                </div>

                {/* 字段列表 */}
                <div className="overflow-x-auto mb-3">
                  <table className="w-full text-[9px]">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-1.5 px-2 text-gray-400 font-medium w-36">字段名</th>
                        <th className="text-left py-1.5 px-2 text-gray-400 font-medium w-32">类型</th>
                        <th className="text-center py-1.5 px-2 text-gray-400 font-medium w-12">PK</th>
                        <th className="text-center py-1.5 px-2 text-gray-400 font-medium w-12">可空</th>
                        <th className="text-left py-1.5 px-2 text-gray-400 font-medium">说明</th>
                      </tr>
                    </thead>
                    <tbody>
                      {table.fields.map((f, fi) => (
                        <tr key={fi} className={`border-b border-gray-50 ${fi % 2 === 0 ? 'bg-gray-50/20' : ''}`}>
                          <td className="py-1.5 px-2 font-mono font-semibold" style={{ color: table.color }}>{f.name}</td>
                          <td className="py-1.5 px-2 font-mono text-gray-500 text-[8px]">{f.type}</td>
                          <td className="py-1.5 px-2 text-center">{f.pk ? '🔑' : ''}</td>
                          <td className="py-1.5 px-2 text-center text-gray-300">{f.nullable ? '✓' : '✗'}</td>
                          <td className="py-1.5 px-2 text-gray-500">{f.desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Volume 关联 + JOIN 示例 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="rounded-lg border border-gray-100 bg-white/80 p-2">
                    <div className="text-[8px] font-semibold text-gray-500 mb-1">📦 Volume 关联</div>
                    <div className="text-[8px] font-mono text-gray-600">{table.volumeRef}</div>
                    {table.note && <div className="text-[8px] text-amber-600 mt-1">{table.note}</div>}
                  </div>
                  <div className="rounded-lg border border-gray-100 bg-white/80 p-2">
                    <div className="text-[8px] font-semibold text-gray-500 mb-1">🔗 JOIN 示例</div>
                    <div className="text-[8px] font-mono text-gray-500 whitespace-pre-wrap leading-relaxed">{table.joinExample}</div>
                  </div>
                </div>
              </div>
            )
          ))}

          {/* 视频存储方案 */}
          <div className="rounded-2xl border border-[#6c5ce7]/20 bg-[#6c5ce7]/04 p-4">
            <div className="text-xs font-bold text-gray-800 mb-1">{icebergSchemas.videoStorage.title}</div>
            <div className="text-[9px] text-gray-500 mb-3">{icebergSchemas.videoStorage.desc}</div>
            <div className="space-y-2 mb-3">
              {icebergSchemas.videoStorage.strategy.map(s => (
                <div key={s.type} className="rounded-xl border p-3"
                  style={{ borderColor: s.color + '25', background: s.color + '04' }}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-semibold text-gray-800">{s.type}</span>
                    <Badge color={s.color}>{s.format}</Badge>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 text-[8px]">
                    <div><span className="text-gray-400">存储位置: </span><span className="font-mono text-gray-600">{s.where}</span></div>
                    <div><span className="text-gray-400">路径格式: </span><span className="font-mono text-gray-500">{s.path}</span></div>
                    <div><span className="text-gray-400">Iceberg 关联: </span><span className="font-mono" style={{ color: s.color }}>{s.icebergRef}</span></div>
                  </div>
                  <div className="text-[8px] text-amber-600 mt-1">💡 {s.note}</div>
                </div>
              ))}
            </div>
            {/* video_sessions schema */}
            <div className="rounded-xl border border-[#6c5ce7]/15 bg-white/80 p-3">
              <div className="text-[9px] font-semibold text-gray-700 mb-2">📋 {icebergSchemas.videoStorage.videoSessionSchema.name}</div>
              <div className="text-[8px] text-gray-400 mb-2">{icebergSchemas.videoStorage.videoSessionSchema.desc}</div>
              <div className="flex flex-wrap gap-1">
                {icebergSchemas.videoStorage.videoSessionSchema.fields.map(f => (
                  <div key={f.name} className="rounded px-1.5 py-0.5 border border-[#6c5ce7]/15 bg-[#6c5ce7]/05">
                    <span className="text-[8px] font-mono font-semibold text-[#6c5ce7]">{f.name}</span>
                    <span className="text-[7px] text-gray-400 ml-1">{f.type}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ER 关联关系 */}
          <div className="rounded-2xl border border-gray-100 bg-white p-4">
            <div className="text-xs font-bold text-gray-800 mb-1">{icebergSchemas.erDiagram.title}</div>
            <div className="text-[9px] text-gray-400 mb-3">
              核心枢纽表: <span className="font-mono text-[#a29bfe] font-semibold">{icebergSchemas.erDiagram.centerTable}</span>
            </div>
            {/* 关联列表 */}
            <div className="space-y-1.5 mb-4">
              {icebergSchemas.erDiagram.relations.map((r, i) => (
                <div key={i} className="flex items-center gap-2 text-[9px]">
                  <span className="font-mono text-gray-500 w-36 flex-shrink-0 truncate">{r.from.split('.').pop()}</span>
                  <span className="text-gray-300 flex-shrink-0">──</span>
                  <Badge color="#a29bfe">{r.type}</Badge>
                  <span className="font-mono text-[#a29bfe] flex-shrink-0">{r.key}</span>
                  <span className="text-gray-300 flex-shrink-0">──▶</span>
                  <span className="font-mono text-gray-500 w-36 flex-shrink-0 truncate">{r.to.split('.').pop()}</span>
                  <span className="text-gray-400 flex-1 truncate">{r.desc}</span>
                </div>
              ))}
            </div>
            {/* 联合查询示例 */}
            <div className="rounded-xl border border-[#a29bfe]/20 bg-[#a29bfe]/04 p-3">
              <div className="text-[9px] font-semibold text-gray-700 mb-2">🔍 多模态联合查询示例（训练数据采样）</div>
              <pre className="text-[8px] font-mono text-gray-600 whitespace-pre-wrap leading-relaxed overflow-x-auto">{icebergSchemas.erDiagram.queryExample}</pre>
            </div>
          </div>
        </div>
      )}

      {/* ── WebDataset ── */}
      {activeSubTab === 'webdataset' && (
        <div className="space-y-4">
          {/* 定位卡片 */}
          <div className="rounded-2xl border p-5"
            style={{ borderColor: '#e17055' + '30', background: '#e17055' + '05' }}>
            <div className="flex items-start gap-3">
              <span className="text-2xl">📼</span>
              <div>
                <div className="text-sm font-bold text-gray-800 mb-1">{webdatasetData.title}</div>
                <div className="text-[10px] text-gray-500 mb-2">{webdatasetData.concept.oneLiner}</div>
                <div className="text-[9px] font-semibold text-[#e17055] mb-3">
                  💡 {webdatasetData.concept.keyIdea}
                </div>
                {/* 性能速览 */}
                <div className="grid grid-cols-3 gap-2">
                  {webdatasetData.perfNumbers.slice(0,3).map(p => (
                    <div key={p.metric} className="rounded-xl border border-[#e17055]/15 bg-white/80 p-2">
                      <div className="text-[8px] text-gray-400 mb-1">{p.metric}</div>
                      <div className="text-[8px] text-gray-400 line-through mb-0.5">{p.singleFile}</div>
                      <div className="text-[9px] font-bold" style={{ color: '#e17055' }}>{p.webdataset}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* tar 包结构 */}
          <SectionCard icon="📦" title="Shard 内部结构（tar 包）"
            desc={`1 Shard = ${webdatasetData.concept.shardDesign.unit}，大小 ${webdatasetData.concept.shardDesign.size}`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* 文件列表 */}
              <div>
                <div className="text-[9px] font-semibold text-gray-600 mb-2">📄 文件命名约定</div>
                <div className="space-y-1">
                  {webdatasetData.concept.tarLayout.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50/30 p-1.5">
                      <span className="text-[8px] font-mono text-[#e17055] w-52 flex-shrink-0">{f.file}</span>
                      <span className="text-[8px] text-gray-400">{f.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Shard 设计 */}
              <div>
                <div className="text-[9px] font-semibold text-gray-600 mb-2">📐 Shard 粒度设计</div>
                <div className="space-y-2">
                  {[['单元', webdatasetData.concept.shardDesign.unit],
                    ['大小', webdatasetData.concept.shardDesign.size],
                    ['总量', webdatasetData.concept.shardDesign.totalShards],
                    ['命名', webdatasetData.concept.shardDesign.naming],
                  ].map(([k, v]) => (
                    <div key={k} className="flex items-center gap-2 text-[9px]">
                      <span className="text-gray-400 w-8 flex-shrink-0">{k}</span>
                      <span className="font-mono" style={{ color: '#e17055' }}>{v}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3">
                  <div className="text-[9px] font-semibold text-gray-600 mb-1">为什么是 ~1GB？</div>
                  {webdatasetData.concept.shardDesign.whyOneGB.map((r, i) => (
                    <div key={i} className="text-[8px] text-gray-500 mb-0.5">· {r}</div>
                  ))}
                </div>
              </div>
            </div>
          </SectionCard>

          {/* 与 Iceberg 分工 */}
          <SectionCard icon="⚖️" title={webdatasetData.vsIceberg.title}
            desc={webdatasetData.vsIceberg.analogy}>
            {/* 能力对比矩阵 */}
            <div className="overflow-x-auto mb-4">
              <table className="w-full text-[9px]">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-1.5 px-2 text-gray-400 font-medium">能力</th>
                    <th className="text-center py-1.5 px-2 font-semibold" style={{ color: '#e17055' }}>WebDataset</th>
                    <th className="text-center py-1.5 px-2 font-semibold text-[#00cec9]">Iceberg</th>
                  </tr>
                </thead>
                <tbody>
                  {webdatasetData.vsIceberg.comparison.map((row, i) => (
                    <tr key={row.capability} className={`border-b border-gray-50 ${i % 2 === 0 ? 'bg-gray-50/20' : ''}`}>
                      <td className="py-1.5 px-2 text-gray-600 font-medium">{row.capability}</td>
                      <td className="py-1.5 px-2 text-center text-[9px]"
                        style={{ color: row.winner === 'wds' ? '#e17055' : '#94a3b8',
                                 fontWeight: row.winner === 'wds' ? 600 : 400 }}>
                        {row.webdataset}
                      </td>
                      <td className="py-1.5 px-2 text-center text-[9px]"
                        style={{ color: row.winner === 'ice' ? '#00cec9' : '#94a3b8',
                                 fontWeight: row.winner === 'ice' ? 600 : 400 }}>
                        {row.iceberg}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 协作工作流 */}
            <div className="rounded-xl border border-[#a29bfe]/20 bg-[#a29bfe]/04 p-3 mb-3">
              <div className="text-[10px] font-semibold text-gray-700 mb-3">
                {webdatasetData.vsIceberg.workflow.title}
              </div>
              <div className="space-y-3">
                {webdatasetData.vsIceberg.workflow.steps.map((s, i) => (
                  <div key={s.step}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-base">{s.icon}</span>
                      <span className="text-xs font-semibold text-gray-800">{s.step}</span>
                      <span className="text-[9px] text-gray-400">{s.desc}</span>
                    </div>
                    <pre className="text-[8px] font-mono rounded-lg p-2.5 leading-relaxed overflow-x-auto"
                      style={{ background: s.color + '10', color: s.color, border: `1px solid ${s.color}20` }}>
                      {s.code}
                    </pre>
                    {i < webdatasetData.vsIceberg.workflow.steps.length - 1 && (
                      <div className="text-center text-[9px] text-gray-300 py-1">↓ shard 路径列表传递</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            {/* 桥梁字段说明 */}
            <div className="rounded-xl border border-[#00cec9]/20 bg-[#00cec9]/05 p-3">
              <div className="text-[9px] font-semibold text-gray-700 mb-1">🌉 桥梁字段</div>
              <div className="text-[9px] text-gray-500">
                <span className="font-mono text-[#00cec9]">{webdatasetData.vsIceberg.workflow.bridgeField.table}</span>
                {' 表的 '}
                <span className="font-mono font-bold text-[#e17055]">{webdatasetData.vsIceberg.workflow.bridgeField.field}</span>
                {' 字段：'}
                {webdatasetData.vsIceberg.workflow.bridgeField.desc}
              </div>
            </div>
          </SectionCard>

          {/* 打包流程 */}
          <SectionCard icon="🏭" title={webdatasetData.packingPipeline.title}
            desc={webdatasetData.packingPipeline.desc}>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {webdatasetData.packingPipeline.steps.map((s, i) => (
                <div key={s.step} className="flex items-center gap-1.5">
                  <div className="rounded-lg px-2 py-1 text-[9px] font-semibold"
                    style={{ background: s.color + '15', color: s.color }}>
                    {s.step}
                  </div>
                  <div className="text-[8px] text-gray-400 max-w-[120px]">{s.desc}</div>
                  {i < webdatasetData.packingPipeline.steps.length - 1 && (
                    <span className="text-gray-200 text-xs">→</span>
                  )}
                </div>
              ))}
            </div>
            <pre className="text-[8px] font-mono rounded-xl p-3 leading-relaxed overflow-x-auto"
              style={{ background: '#e17055' + '08', color: '#e17055', border: '1px solid #e1705520' }}>
              {webdatasetData.packingPipeline.code}
            </pre>
          </SectionCard>

          {/* 训练侧读取 */}
          <SectionCard icon="🚀" title={webdatasetData.trainingRead.title} desc="">
            <pre className="text-[8px] font-mono rounded-xl p-3 leading-relaxed overflow-x-auto mb-3"
              style={{ background: '#e17055' + '08', color: '#e17055', border: '1px solid #e1705520' }}>
              {webdatasetData.trainingRead.code}
            </pre>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {webdatasetData.trainingRead.keyPoints.map(kp => (
                <div key={kp.point} className="rounded-xl border border-[#e17055]/15 bg-[#e17055]/04 p-2">
                  <div className="text-[9px] font-mono font-bold text-[#e17055] mb-0.5">{kp.point}</div>
                  <div className="text-[8px] text-gray-500">{kp.desc}</div>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* 局限性 */}
          <SectionCard icon="⚠️" title="局限性与解决方案" desc="WebDataset 不是银弹，了解局限才能正确使用">
            <div className="space-y-2">
              {webdatasetData.limitations.map(lim => (
                <div key={lim.problem} className="rounded-xl border p-3"
                  style={{ borderColor: lim.color + '25', background: lim.color + '04' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base">{lim.icon}</span>
                    <span className="text-xs font-semibold text-gray-800">{lim.problem}</span>
                  </div>
                  <p className="text-[10px] text-gray-500 mb-1.5">{lim.detail}</p>
                  <div className="text-[9px] rounded-lg px-2 py-1 inline-block"
                    style={{ background: lim.color + '12', color: lim.color }}>
                    ✅ 解决方案: {lim.solution}
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {/* ── 模态存储规格 ── */}
      {activeSubTab === 'modal' && (
        <div className="space-y-3">
          {modalSpecs.map(spec => (
            <div key={spec.modality} className="rounded-2xl border p-4"
              style={{ borderColor: spec.color + '25', background: spec.color + '04' }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">{spec.icon}</span>
                <span className="text-sm font-bold text-gray-800">{spec.modality}</span>
                <Badge color={spec.color}>{spec.scale}</Badge>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { label: '原始格式', value: spec.rawFormat },
                  { label: '存储格式', value: spec.storedFormat },
                  { label: '压缩策略', value: spec.compression },
                  { label: '分区键', value: spec.partitionKey },
                  { label: '访问模式', value: spec.accessPattern },
                  { label: '训练格式', value: spec.trainFormat },
                ].map(item => (
                  <div key={item.label} className="rounded-lg border border-gray-100 bg-white/80 p-2">
                    <div className="text-[8px] text-gray-400 mb-0.5">{item.label}</div>
                    <div className="text-[9px] font-mono text-gray-700 leading-relaxed">{item.value}</div>
                  </div>
                ))}
              </div>
              <div className="mt-2 text-[9px] text-gray-400">
                <span className="font-semibold">索引策略：</span>{spec.indexing}
              </div>
              <div className="mt-1 text-[9px]" style={{ color: spec.color }}>
                <span className="font-semibold">训练读取带宽：</span>{spec.readBW}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── 训练集构建 ── */}
      {activeSubTab === 'train' && (
        <div className="space-y-3">
          <SectionCard icon="🧠" title={trainDatasetBuild.title}
            desc="从 Gold 层到训练就绪数据集的 6 步构建流程">
            <div className="space-y-2 mb-4">
              {trainDatasetBuild.steps.map((s, i) => (
                <div key={s.step} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0"
                      style={{ background: s.color + '15', border: `1.5px solid ${s.color}40` }}>
                      {s.icon}
                    </div>
                    {i < trainDatasetBuild.steps.length - 1 && (
                      <div className="w-px h-4 mt-1" style={{ background: s.color + '30' }} />
                    )}
                  </div>
                  <div className="flex-1 rounded-xl border p-3 -mt-0.5"
                    style={{ borderColor: s.color + '20', background: s.color + '04' }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-gray-800">{s.step}</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                        style={{ background: s.color + '12', color: s.color }}>{s.tech}</span>
                    </div>
                    <p className="text-[10px] text-gray-500 mb-1">{s.desc}</p>
                    <div className="text-[9px] font-mono text-gray-400">输出: {s.output}</div>
                  </div>
                </div>
              ))}
            </div>
            {/* 输出规格 */}
            <div className="rounded-xl border border-[#00cec9]/20 bg-[#00cec9]/05 p-3">
              <div className="text-[10px] font-semibold text-gray-700 mb-2">📊 训练集输出规格</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {Object.entries(trainDatasetBuild.outputSpec).map(([k, v]) => {
                  const labels = {
                    totalScenes: '总场景数', totalShards: 'Shard 数量',
                    totalSize: '总大小', modalCoverage: '模态覆盖率',
                    trainValTest: '训练/验证/测试', avgShardSize: '平均 Shard 大小',
                    readThroughput: '训练读取带宽',
                  };
                  return (
                    <div key={k} className="rounded-lg border border-[#00cec9]/15 bg-white/80 p-2">
                      <div className="text-[8px] text-gray-400 mb-0.5">{labels[k] || k}</div>
                      <div className="text-[9px] font-mono font-semibold text-gray-700">{v}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </SectionCard>
        </div>
      )}

      {/* ── IO 优化 ── */}
      {activeSubTab === 'io' && (
        <div className="space-y-3">
          <SectionCard icon="⚡" title={ioOptimization.title} desc={ioOptimization.bottleneck}>
            {/* IO 栈 */}
            <div className="mb-4">
              <div className="text-[10px] font-semibold text-gray-600 mb-2">存储层次结构</div>
              <div className="space-y-1">
                {ioOptimization.ioStack.map((layer, i) => (
                  <div key={layer.layer}>
                    <div className="flex items-center gap-3 rounded-xl border p-2.5"
                      style={{ borderColor: layer.color + '30', background: layer.color + '06' }}>
                      <div className="w-28 flex-shrink-0">
                        <div className="text-[10px] font-semibold" style={{ color: layer.color }}>{layer.layer}</div>
                        <div className="text-[8px] text-gray-400">{layer.size}</div>
                      </div>
                      <div className="flex gap-4 text-[9px]">
                        <span className="text-gray-500">延迟: <span className="font-mono" style={{ color: layer.color }}>{layer.latency}</span></span>
                        <span className="text-gray-500">带宽: <span className="font-mono" style={{ color: layer.color }}>{layer.bw}</span></span>
                      </div>
                    </div>
                    {i < ioOptimization.ioStack.length - 1 && (
                      <div className="text-center text-[8px] text-gray-300 py-0.5">↕ 缓存命中率 &gt;90%</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            {/* 优化策略 */}
            <div className="space-y-2">
              {ioOptimization.strategies.map(s => (
                <div key={s.name} className="rounded-xl border p-3"
                  style={{ borderColor: s.color + '25', background: s.color + '04' }}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-base">{s.icon}</span>
                    <span className="text-xs font-semibold text-gray-800">{s.name}</span>
                    <Badge color={s.color}>{s.gain}</Badge>
                  </div>
                  <p className="text-[10px] text-gray-500 mb-1">{s.desc}</p>
                  <div className="text-[9px] font-mono px-2 py-0.5 rounded inline-block"
                    style={{ background: s.color + '10', color: s.color }}>{s.config}</div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {/* ── Iceberg ── */}
      {activeSubTab === 'iceberg' && (
        <div className="space-y-4">
          <SectionCard icon="🧊" title="Apache Iceberg 核心特性" desc="为什么选择 Iceberg 作为自动驾驶数据湖表格式">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
              {icebergFeatures.map(f => (
                <div key={f.name} className="rounded-xl border border-gray-100 bg-gray-50/50 p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm">{f.icon}</span>
                    <span className="text-xs font-semibold text-gray-700">{f.name}</span>
                  </div>
                  <p className="text-[10px] text-gray-500">{f.desc}</p>
                </div>
              ))}
            </div>
          </SectionCard>
          <SectionCard icon="⚖️" title="湖格式对比" desc="Iceberg vs Delta Lake vs Hudi">
            <div className="overflow-x-auto">
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 px-2 text-gray-500 font-medium">特性</th>
                    <th className="text-center py-2 px-2 text-[#00cec9] font-semibold">Iceberg ✅</th>
                    <th className="text-center py-2 px-2 text-gray-500 font-medium">Delta Lake</th>
                    <th className="text-center py-2 px-2 text-gray-500 font-medium">Hudi</th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.map(row => (
                    <tr key={row.feature} className="border-b border-gray-50">
                      <td className="py-2 px-2 text-gray-600 font-medium">{row.feature}</td>
                      <td className="py-2 px-2 text-center">{row.iceberg}</td>
                      <td className="py-2 px-2 text-center text-gray-400">{row.delta}</td>
                      <td className="py-2 px-2 text-center text-gray-400">{row.hudi}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
          <SectionCard icon="🔍" title="查询引擎" desc="多引擎覆盖不同查询场景">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {queryEngines.map(e => (
                <div key={e.name} className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/30 p-3">
                  <span className="text-lg flex-shrink-0">{e.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-semibold text-gray-700">{e.name}</span>
                      <Badge color="#00cec9">{e.role}</Badge>
                      <span className="text-[9px] text-gray-400 ml-auto">{e.latency}</span>
                    </div>
                    <p className="text-[10px] text-gray-500">{e.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {/* ── LakeFS 版本 ── */}
      {activeSubTab === 'lakefs' && (
        <SectionCard icon="🌿" title="LakeFS 数据版本管理" desc="Git-like 工作流管理数据变更，与 DVC + MLflow 三位一体">
          <div className="flex flex-col gap-2 mb-4">
            {lakeFSWorkflow.map((step, i) => (
              <div key={step.step} className="flex items-center gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-[#00cec9]/10 border border-[#00cec9]/30 flex items-center justify-center text-sm flex-shrink-0">
                    {step.icon}
                  </div>
                  {i < lakeFSWorkflow.length - 1 && <div className="w-px h-4 bg-[#00cec9]/20 mt-1" />}
                </div>
                <div className="flex-1 rounded-xl border border-gray-100 bg-gray-50/30 p-2.5">
                  <div className="flex items-center gap-2">
                    <Badge color="#00cec9">{step.action}</Badge>
                    <span className="text-[10px] text-gray-600">{step.desc}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* 三位一体版本体系 */}
          <div className="rounded-xl border border-[#00cec9]/20 bg-[#00cec9]/05 p-3">
            <div className="text-[10px] font-semibold text-gray-700 mb-2">🔗 三位一体版本体系</div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { tool: 'LakeFS', role: '数据版本', desc: 'Git-like 分支/合并/快照，管理 Iceberg 表和 Volume 文件', color: '#00cec9' },
                { tool: 'DVC', role: '数据+模型版本', desc: '与 Git commit 绑定，追踪数据集和模型权重变更', color: '#3fb950' },
                { tool: 'MLflow', role: '实验版本', desc: '记录超参/指标/数据集版本，与 LakeFS tag 对应', color: '#ffa657' },
              ].map(item => (
                <div key={item.tool} className="rounded-lg border p-2.5"
                  style={{ borderColor: item.color + '25', background: item.color + '05' }}>
                  <div className="text-[10px] font-bold mb-0.5" style={{ color: item.color }}>{item.tool}</div>
                  <div className="text-[9px] font-semibold text-gray-600 mb-1">{item.role}</div>
                  <div className="text-[8px] text-gray-400 leading-relaxed">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 4. 数据流水线
// ─────────────────────────────────────────────────────────────
function PipelineTab() {
  const { dagOverview, stages, airflowConfig } = PIPELINE_DATA;

  return (
    <div className="space-y-4">
      {/* DAG 概览 */}
      <div className="rounded-2xl border border-[#fd79a8]/20 bg-[#fd79a8]/5 p-5 mb-4">
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
  );
}

// ─────────────────────────────────────────────────────────────
// 5. MLOps 实验
// ─────────────────────────────────────────────────────────────
function MLOpsTab() {
  const { experimentPlatform, cicd, abTesting, modelRegistry } = MLOPS_DATA;

  return (
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
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// 主组件
// ═══════════════════════════════════════════════════════════
export default function DataInfraViz() {
  const [activeTab, setActiveTab] = useState('overview');

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