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
// ─────────────────────────────────────────────────────────────
// 3. 数据湖仓 — 存算分离 · 对象存储 · 缓存加速 · 表格式选型
// ─────────────────────────────────────────────────────────────
export function DatalakeTab() {
  const {
    computeStorageSeparation,
    objectStorage,
    cacheAcceleration,
    tableFormat,
    queryEngines,
  } = DATALAKE_DATA;

  const [activeSubTab, setActiveSubTab] = useState('separation');
  const [selectedFormat, setSelectedFormat] = useState('Apache Iceberg');
  const [selectedCache, setSelectedCache] = useState('JuiceFS');
  const [selectedStorage, setSelectedStorage] = useState('AWS S3');

  const SUB_TABS = [
    { id: 'separation', label: '存算分离',   icon: '🔀' },
    { id: 'object',     label: '对象存储',   icon: '🪣' },
    { id: 'cache',      label: '缓存加速',   icon: '⚡' },
    { id: 'format',     label: '表格式选型', icon: '🧊' },
    { id: 'engines',    label: '查询引擎',   icon: '🔍' },
  ];

  const accentColor = '#00cec9';

  return (
    <div className="space-y-4">
      {/* 定位说明 */}
      <div className="rounded-2xl border border-[#00cec9]/20 bg-[#00cec9]/04 p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🏞️</span>
          <div>
            <div className="text-sm font-bold text-gray-800 mb-1">数据湖仓基础架构</div>
            <div className="text-[10px] text-gray-500 leading-relaxed">
              聚焦湖仓核心四要素：
              <span className="font-semibold text-[#00cec9]">存算分离</span>（计算与存储独立扩缩）·
              <span className="font-semibold text-[#00cec9]">对象存储</span>（S3/OSS/MinIO 选型与生命周期）·
              <span className="font-semibold text-[#00cec9]">缓存加速</span>（JuiceFS/Alluxio/NVMe 解决 IO 瓶颈）·
              <span className="font-semibold text-[#00cec9]">表格式选型</span>（Iceberg vs Delta vs Hudi）
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {['Apache Iceberg', 'JuiceFS', 'Alluxio', 'S3', 'MinIO', 'Delta Lake', 'Apache Hudi'].map(t => (
                <span key={t} className="text-[9px] px-2 py-0.5 rounded-full font-mono"
                  style={{ background: accentColor + '15', color: accentColor, border: `1px solid ${accentColor}30` }}>
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
              background: activeSubTab === t.id ? accentColor : 'transparent',
              color: activeSubTab === t.id ? '#fff' : '#64748b',
              borderColor: activeSubTab === t.id ? accentColor : '#e2e8f0',
            }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── 存算分离 ── */}
      {activeSubTab === 'separation' && (
        <div className="space-y-4">
          <SectionCard title={computeStorageSeparation.title} subtitle={computeStorageSeparation.subtitle} color={accentColor}>
            <div className="text-[10px] text-gray-600 leading-relaxed mb-4 p-3 rounded-xl bg-gray-50 border border-gray-100">
              {computeStorageSeparation.principle}
            </div>
            {/* 核心优势 */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {computeStorageSeparation.benefits.map((b, i) => (
                <div key={i} className="rounded-xl border border-gray-100 p-3 bg-white">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base">{b.icon}</span>
                    <span className="text-[10px] font-bold text-gray-800">{b.title}</span>
                  </div>
                  <div className="text-[9px] text-gray-500 leading-relaxed">{b.desc}</div>
                </div>
              ))}
            </div>
            {/* 架构分层 */}
            <div className="mb-4">
              <div className="text-[10px] font-semibold text-gray-600 mb-2">🏗️ 架构分层</div>
              <div className="space-y-2">
                {computeStorageSeparation.architecture.layers.map((layer, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-xl border p-2.5"
                    style={{ borderColor: layer.color + '30', background: layer.color + '06' }}>
                    <div className="text-[9px] font-bold w-14 flex-shrink-0" style={{ color: layer.color }}>{layer.name}</div>
                    <div className="flex flex-wrap gap-1.5">
                      {layer.items.map(item => (
                        <span key={item} className="text-[8px] px-2 py-0.5 rounded-full font-mono"
                          style={{ background: layer.color + '15', color: layer.color, border: `1px solid ${layer.color}30` }}>
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* 存算分离 vs HDFS */}
            <div>
              <div className="text-[10px] font-semibold text-gray-600 mb-2">⚖️ 存算分离 vs 传统 HDFS</div>
              <div className="overflow-x-auto">
                <table className="w-full text-[9px]">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-1.5 pr-3 text-gray-500 font-medium">维度</th>
                      <th className="text-left py-1.5 pr-3 font-semibold" style={{ color: accentColor }}>存算分离</th>
                      <th className="text-left py-1.5 text-gray-500 font-medium">传统 HDFS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {computeStorageSeparation.vsHDFS.map((row, i) => (
                      <tr key={i} className="border-b border-gray-50">
                        <td className="py-1.5 pr-3 text-gray-500 font-medium">{row.dim}</td>
                        <td className="py-1.5 pr-3 text-gray-700">{row.separation}</td>
                        <td className="py-1.5 text-gray-400">{row.hdfs}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </SectionCard>
        </div>
      )}

      {/* ── 对象存储 ── */}
      {activeSubTab === 'object' && (
        <div className="space-y-4">
          <SectionCard title={objectStorage.title} subtitle={objectStorage.subtitle} color="#ffa657">
            {/* 选型卡片 */}
            <div className="flex gap-2 flex-wrap mb-4">
              {objectStorage.options.map(opt => (
                <button key={opt.name} onClick={() => setSelectedStorage(opt.name)}
                  className="text-xs px-3 py-1.5 rounded-full border transition-all"
                  style={{
                    background: selectedStorage === opt.name ? opt.color : 'transparent',
                    color: selectedStorage === opt.name ? '#fff' : '#64748b',
                    borderColor: selectedStorage === opt.name ? opt.color : '#e2e8f0',
                  }}>
                  {opt.icon} {opt.name}
                </button>
              ))}
            </div>
            {(() => {
              const opt = objectStorage.options.find(o => o.name === selectedStorage) || objectStorage.options[0];
              return (
                <div className="rounded-2xl border p-4 mb-4"
                  style={{ borderColor: opt.color + '30', background: opt.color + '05' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">{opt.icon}</span>
                    <div>
                      <div className="text-sm font-bold text-gray-800">{opt.name}</div>
                      <span className="text-[9px] px-2 py-0.5 rounded-full"
                        style={{ background: opt.color + '20', color: opt.color }}>{opt.type}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <div className="text-[9px] font-semibold text-green-600 mb-1">✅ 优势</div>
                      {opt.pros.map((p, i) => (
                        <div key={i} className="text-[9px] text-gray-600 flex items-start gap-1 mb-0.5">
                          <span className="text-green-500 flex-shrink-0">▸</span>{p}
                        </div>
                      ))}
                    </div>
                    <div>
                      <div className="text-[9px] font-semibold text-red-500 mb-1">⚠️ 局限</div>
                      {opt.cons.map((c, i) => (
                        <div key={i} className="text-[9px] text-gray-600 flex items-start gap-1 mb-0.5">
                          <span className="text-red-400 flex-shrink-0">▸</span>{c}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="text-[9px] text-gray-500 p-2 rounded-lg bg-white border border-gray-100">
                    🎯 <span className="font-semibold">最适场景：</span>{opt.bestFor}
                  </div>
                </div>
              );
            })()}
            {/* 存储类型 */}
            <div className="mb-4">
              <div className="text-[10px] font-semibold text-gray-600 mb-2">📦 S3 存储类型与成本</div>
              <div className="space-y-2">
                {objectStorage.storageClasses.map((sc, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-xl border border-gray-100 p-2.5 bg-white">
                    <div className="w-28 flex-shrink-0">
                      <div className="text-[9px] font-bold text-gray-700">{sc.name}</div>
                      <div className="text-[8px] font-mono text-orange-500">{sc.cost}</div>
                    </div>
                    <div className="flex-1">
                      <div className="text-[9px] text-gray-600">{sc.useCase}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-[8px] text-gray-400">延迟</div>
                      <div className="text-[8px] font-mono text-gray-600">{sc.latency}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* 生命周期策略 */}
            <div className="mb-4">
              <div className="text-[10px] font-semibold text-gray-600 mb-2">🔄 生命周期自动迁移策略</div>
              <div className="text-[9px] text-gray-500 mb-2">{objectStorage.lifecyclePolicy.desc}</div>
              <div className="flex items-center gap-1 flex-wrap">
                {objectStorage.lifecyclePolicy.rules.map((rule, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <div className="rounded-lg border border-orange-100 bg-orange-50 p-2 text-center">
                      <div className="text-[8px] text-orange-600 font-semibold">{rule.trigger}</div>
                      <div className="text-[8px] text-gray-600 mt-0.5">{rule.action}</div>
                      <div className="text-[8px] text-green-600 font-bold mt-0.5">{rule.saving}</div>
                    </div>
                    {i < objectStorage.lifecyclePolicy.rules.length - 1 && (
                      <span className="text-gray-300 text-xs">→</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
            {/* 性能优化 Tips */}
            <div>
              <div className="text-[10px] font-semibold text-gray-600 mb-2">⚡ 性能优化 Tips</div>
              <div className="space-y-1">
                {objectStorage.performanceTips.map((tip, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-[9px] text-gray-600">
                    <span className="text-orange-400 flex-shrink-0 mt-0.5">▸</span>
                    <span>{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          </SectionCard>
        </div>
      )}

      {/* ── 缓存加速 ── */}
      {activeSubTab === 'cache' && (
        <div className="space-y-4">
          <SectionCard title={cacheAcceleration.title} subtitle={cacheAcceleration.subtitle} color="#6c5ce7">
            <div className="text-[10px] text-gray-600 leading-relaxed mb-4 p-3 rounded-xl bg-purple-50 border border-purple-100">
              ⚠️ <span className="font-semibold">问题背景：</span>{cacheAcceleration.problem}
            </div>
            {/* 方案选择 */}
            <div className="flex gap-2 flex-wrap mb-4">
              {cacheAcceleration.solutions.map(sol => (
                <button key={sol.name} onClick={() => setSelectedCache(sol.name)}
                  className="text-xs px-3 py-1.5 rounded-full border transition-all"
                  style={{
                    background: selectedCache === sol.name ? sol.color : 'transparent',
                    color: selectedCache === sol.name ? '#fff' : '#64748b',
                    borderColor: selectedCache === sol.name ? sol.color : '#e2e8f0',
                  }}>
                  {sol.icon} {sol.name}
                </button>
              ))}
            </div>
            {(() => {
              const sol = cacheAcceleration.solutions.find(s => s.name === selectedCache) || cacheAcceleration.solutions[0];
              return (
                <div className="rounded-2xl border p-4 mb-4"
                  style={{ borderColor: sol.color + '30', background: sol.color + '05' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{sol.icon}</span>
                    <div>
                      <div className="text-sm font-bold text-gray-800">{sol.name}</div>
                      <span className="text-[9px] px-2 py-0.5 rounded-full"
                        style={{ background: sol.color + '20', color: sol.color }}>{sol.type}</span>
                    </div>
                  </div>
                  <div className="text-[9px] text-gray-600 mb-3 leading-relaxed">{sol.desc}</div>
                  {/* 缓存层级 */}
                  <div className="mb-3">
                    <div className="text-[9px] font-semibold text-gray-600 mb-1.5">📚 缓存层级</div>
                    <div className="space-y-1">
                      {sol.cacheHierarchy.map((h, i) => (
                        <div key={i} className="flex items-center gap-2 text-[9px]">
                          <span className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white flex-shrink-0"
                            style={{ background: sol.color }}>L{i + 1}</span>
                          <span className="text-gray-600">{h}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <div className="text-[9px] font-semibold text-green-600 mb-1">✅ 优势</div>
                      {sol.pros.map((p, i) => (
                        <div key={i} className="text-[9px] text-gray-600 flex items-start gap-1 mb-0.5">
                          <span className="text-green-500 flex-shrink-0">▸</span>{p}
                        </div>
                      ))}
                    </div>
                    <div>
                      <div className="text-[9px] font-semibold text-red-500 mb-1">⚠️ 局限</div>
                      {sol.cons.map((c, i) => (
                        <div key={i} className="text-[9px] text-gray-600 flex items-start gap-1 mb-0.5">
                          <span className="text-red-400 flex-shrink-0">▸</span>{c}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 text-[9px] p-2 rounded-lg bg-white border border-gray-100">
                      🚀 <span className="font-semibold text-gray-700">性能提升：</span>
                      <span style={{ color: sol.color }}>{sol.perfGain}</span>
                    </div>
                  </div>
                  <div className="mt-2 text-[9px] text-gray-500 p-2 rounded-lg bg-white border border-gray-100">
                    🎯 <span className="font-semibold">适用场景：</span>{sol.useCase}
                  </div>
                </div>
              );
            })()}
            {/* 选型矩阵 */}
            <div>
              <div className="text-[10px] font-semibold text-gray-600 mb-2">📊 {cacheAcceleration.decisionMatrix.title}</div>
              <div className="overflow-x-auto">
                <table className="w-full text-[9px]">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-1.5 pr-3 text-gray-500 font-medium">方案</th>
                      {cacheAcceleration.decisionMatrix.criteria.map(c => (
                        <th key={c} className="text-left py-1.5 pr-2 text-gray-500 font-medium">{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {cacheAcceleration.decisionMatrix.rows.map((row, i) => (
                      <tr key={i} className="border-b border-gray-50">
                        <td className="py-1.5 pr-3 font-semibold text-gray-700">{row.solution}</td>
                        {row.scores.map((s, j) => (
                          <td key={j} className="py-1.5 pr-2 text-gray-600">{s}</td>
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

      {/* ── 表格式选型 ── */}
      {activeSubTab === 'format' && (
        <div className="space-y-4">
          <SectionCard title={tableFormat.title} subtitle={tableFormat.subtitle} color="#fd79a8">
            <div className="text-[10px] text-gray-600 leading-relaxed mb-4 p-3 rounded-xl bg-pink-50 border border-pink-100">
              {tableFormat.intro}
            </div>
            {/* 格式选择 */}
            <div className="flex gap-2 flex-wrap mb-4">
              {tableFormat.formats.map(fmt => (
                <button key={fmt.name} onClick={() => setSelectedFormat(fmt.name)}
                  className="text-xs px-3 py-1.5 rounded-full border transition-all"
                  style={{
                    background: selectedFormat === fmt.name ? fmt.color : 'transparent',
                    color: selectedFormat === fmt.name ? '#fff' : '#64748b',
                    borderColor: selectedFormat === fmt.name ? fmt.color : '#e2e8f0',
                  }}>
                  {fmt.icon} {fmt.name}
                </button>
              ))}
            </div>
            {(() => {
              const fmt = tableFormat.formats.find(f => f.name === selectedFormat) || tableFormat.formats[0];
              return (
                <div className="rounded-2xl border p-4 mb-4"
                  style={{ borderColor: fmt.color + '30', background: fmt.color + '05' }}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{fmt.icon}</span>
                      <div>
                        <div className="text-sm font-bold text-gray-800">{fmt.name}</div>
                        <div className="text-[9px] text-gray-400">{fmt.origin}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] px-2 py-1 rounded-full font-semibold"
                        style={{ background: fmt.verdictColor + '20', color: fmt.verdictColor }}>
                        {fmt.verdict}
                      </span>
                      <div className="flex gap-0.5 mt-1 justify-end">
                        {[1,2,3,4,5].map(i => (
                          <div key={i} className="w-3 h-1.5 rounded-full"
                            style={{ background: i <= fmt.score ? fmt.color : fmt.color + '25' }} />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="text-[9px] text-gray-600 mb-3 p-2 rounded-lg bg-white border border-gray-100 leading-relaxed">
                    🏗️ <span className="font-semibold">核心设计：</span>{fmt.coreDesign}
                  </div>
                  {/* 核心特性 */}
                  <div className="mb-3">
                    <div className="text-[9px] font-semibold text-gray-600 mb-2">✨ 核心特性</div>
                    <div className="grid grid-cols-2 gap-2">
                      {fmt.keyFeatures.map((kf, i) => (
                        <div key={i} className="rounded-lg border border-gray-100 p-2 bg-white">
                          <div className="flex items-center gap-1 mb-0.5">
                            <span className="text-xs">{kf.icon}</span>
                            <span className="text-[9px] font-semibold text-gray-700">{kf.name}</span>
                          </div>
                          <div className="text-[8px] text-gray-500 leading-relaxed">{kf.desc}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Iceberg 元数据结构（仅 Iceberg 显示） */}
                  {fmt.metadataStructure && (
                    <div className="mb-3">
                      <div className="text-[9px] font-semibold text-gray-600 mb-2">🗂️ {fmt.metadataStructure.desc}</div>
                      <div className="space-y-1.5">
                        {fmt.metadataStructure.layers.map((layer, i) => (
                          <div key={i} className="rounded-lg border p-2"
                            style={{ borderColor: fmt.color + '25', background: fmt.color + '05' }}>
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-[8px] font-bold w-20 flex-shrink-0" style={{ color: fmt.color }}>{layer.name}</span>
                              <span className="text-[8px] text-gray-500 leading-relaxed">{layer.desc}</span>
                            </div>
                            <div className="text-[8px] font-mono text-gray-400 ml-22">{layer.example}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-[9px] font-semibold text-green-600 mb-1">✅ 优势</div>
                      {fmt.pros.map((p, i) => (
                        <div key={i} className="text-[9px] text-gray-600 flex items-start gap-1 mb-0.5">
                          <span className="text-green-500 flex-shrink-0">▸</span>{p}
                        </div>
                      ))}
                    </div>
                    <div>
                      <div className="text-[9px] font-semibold text-red-500 mb-1">⚠️ 局限</div>
                      {fmt.cons.map((c, i) => (
                        <div key={i} className="text-[9px] text-gray-600 flex items-start gap-1 mb-0.5">
                          <span className="text-red-400 flex-shrink-0">▸</span>{c}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="mt-2 text-[9px] text-gray-500 p-2 rounded-lg bg-white border border-gray-100">
                    🎯 <span className="font-semibold">最适场景：</span>{fmt.bestFor}
                  </div>
                </div>
              );
            })()}
            {/* 对比表格 */}
            <div className="mb-4">
              <div className="text-[10px] font-semibold text-gray-600 mb-2">📊 三格式全面对比</div>
              <div className="overflow-x-auto">
                <table className="w-full text-[9px]">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-1.5 pr-3 text-gray-500 font-medium">特性</th>
                      <th className="text-left py-1.5 pr-3 font-semibold text-[#00cec9]">Iceberg</th>
                      <th className="text-left py-1.5 pr-3 font-semibold text-[#0078d4]">Delta Lake</th>
                      <th className="text-left py-1.5 font-semibold text-[#e17055]">Hudi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableFormat.comparisonTable.map((row, i) => (
                      <tr key={i} className="border-b border-gray-50">
                        <td className="py-1.5 pr-3 text-gray-500 font-medium">{row.feature}</td>
                        <td className="py-1.5 pr-3 text-gray-700">{row.iceberg}</td>
                        <td className="py-1.5 pr-3 text-gray-700">{row.delta}</td>
                        <td className="py-1.5 text-gray-700">{row.hudi}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            {/* Iceberg 最佳实践 */}
            <div>
              <div className="text-[10px] font-semibold text-gray-600 mb-2">🧊 Iceberg 最佳实践</div>
              <div className="space-y-2">
                {tableFormat.icebergBestPractices.map((bp, i) => (
                  <div key={i} className="flex items-start gap-2 rounded-xl border border-[#00cec9]/20 p-2.5 bg-[#00cec9]/03">
                    <span className="text-base flex-shrink-0">{bp.icon}</span>
                    <div>
                      <div className="text-[9px] font-bold text-gray-700 mb-0.5">{bp.title}</div>
                      <div className="text-[9px] text-gray-500 leading-relaxed">{bp.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </SectionCard>
        </div>
      )}

      {/* ── 查询引擎 ── */}
      {activeSubTab === 'engines' && (
        <div className="space-y-4">
          <SectionCard title="查询引擎矩阵" subtitle="Trino / Spark SQL / DuckDB / Flink SQL — 按场景选择最优引擎" color={accentColor}>
            <div className="grid grid-cols-2 gap-3">
              {queryEngines.map((engine, i) => (
                <div key={i} className="rounded-2xl border border-gray-100 p-4 bg-white">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{engine.icon}</span>
                    <div>
                      <div className="text-sm font-bold text-gray-800">{engine.name}</div>
                      <span className="text-[9px] px-2 py-0.5 rounded-full"
                        style={{ background: accentColor + '15', color: accentColor }}>
                        {engine.role}
                      </span>
                    </div>
                  </div>
                  <div className="text-[9px] text-gray-600 leading-relaxed mb-2">{engine.desc}</div>
                  <div className="flex items-center gap-1 text-[8px]">
                    <span className="text-gray-400">典型延迟：</span>
                    <span className="font-mono font-bold" style={{ color: accentColor }}>{engine.latency}</span>
                  </div>
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