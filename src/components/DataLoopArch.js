'use client';

import { useState, useMemo } from 'react';
import {
  LOOP_OVERVIEW,
  COLLECT_LAYER,
  UPLOAD_LAYER,
  PROCESS_LAYER,
  STORE_LAYER,
  TRAIN_LAYER,
  DEPLOY_LAYER,
  MONITOR_LAYER,
  INFRA_OVERVIEW,
  DATA_FLOW_STATS,
  UNITY_CATALOG_LAYER,
  MULTIMODAL_LAYER,
  SCENE_MINE_LAYER,
  ANNOTATION_QA_LAYER,
} from '@/lib/data-loop-data';

// ─────────────────────────────────────────────────────────────────────────────
// 工具函数
// ─────────────────────────────────────────────────────────────────────────────
function Badge({ children, color = '#6c5ce7' }) {
  return (
    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
      style={{ background: color + '18', color, border: `1px solid ${color}30` }}>
      {children}
    </span>
  );
}

function SectionTitle({ icon, title, desc, color = '#6c5ce7' }) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{icon}</span>
        <h3 className="text-base font-semibold text-gray-800">{title}</h3>
      </div>
      {desc && <p className="text-xs text-gray-500 ml-7">{desc}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. 闭环总览 — 环形流程图
// ─────────────────────────────────────────────────────────────────────────────
function LoopOverview({ activeStage, setActiveStage }) {
  const stages = LOOP_OVERVIEW.stages;
  const R = 140, CX = 180, CY = 170;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 mb-6">
      <SectionTitle icon="🔄" title="数据闭环总览" desc="从车端采集到云端训练，再到车端部署的全链路闭环 — 点击节点查看详情" />

      <div className="flex flex-col lg:flex-row items-center gap-6">
        {/* 环形图 */}
        <div className="flex-shrink-0">
          <svg width="360" height="340" viewBox="0 0 360 340">
            {/* 背景环 */}
            <circle cx={CX} cy={CY} r={R} fill="none" stroke="#f0f0f5" strokeWidth="3" />

            {/* 流动箭头 */}
            <defs>
              <marker id="arrowLoop" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
                <polygon points="0 0, 6 2, 0 4" fill="#c0c0d0" />
              </marker>
            </defs>

            {/* 节点 */}
            {stages.map((s, i) => {
              const angle = (i / stages.length) * 2 * Math.PI - Math.PI / 2;
              const x = CX + R * Math.cos(angle);
              const y = CY + R * Math.sin(angle);
              const isActive = activeStage === s.id;

              // 箭头到下一个节点
              const nextAngle = ((i + 1) / stages.length) * 2 * Math.PI - Math.PI / 2;
              const midAngle = (angle + nextAngle) / 2 + (i === stages.length - 1 ? Math.PI : 0);
              const ax = CX + (R + 2) * Math.cos(midAngle);
              const ay = CY + (R + 2) * Math.sin(midAngle);

              return (
                <g key={s.id}>
                  {/* 连接弧线 */}
                  {i < stages.length && (() => {
                    const na = ((i + 0.5) / stages.length) * 2 * Math.PI - Math.PI / 2;
                    const mx = CX + R * Math.cos(na);
                    const my = CY + R * Math.sin(na);
                    return (
                      <circle cx={mx} cy={my} r="2" fill={s.color} opacity="0.3" />
                    );
                  })()}

                  {/* 节点圆 */}
                  <g onClick={() => setActiveStage(s.id)} style={{ cursor: 'pointer' }}>
                    <circle cx={x} cy={y} r={isActive ? 30 : 24}
                      fill={isActive ? s.color : '#fff'}
                      stroke={s.color}
                      strokeWidth={isActive ? 3 : 2}
                      opacity={isActive ? 1 : 0.85}
                      className="transition-all duration-200" />
                    {isActive && (
                      <circle cx={x} cy={y} r="36" fill="none" stroke={s.color} strokeWidth="1.5" opacity="0.3" strokeDasharray="4,3">
                        <animateTransform attributeName="transform" type="rotate" from={`0 ${x} ${y}`} to={`360 ${x} ${y}`} dur="8s" repeatCount="indefinite" />
                      </circle>
                    )}
                    <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="middle"
                      fontSize={isActive ? "16" : "14"}>
                      {s.icon}
                    </text>
                    <text x={x} y={y + (isActive ? 44 : 38)} textAnchor="middle"
                      fill={isActive ? s.color : '#64748b'} fontSize="10" fontWeight={isActive ? '600' : '400'}
                      fontFamily="system-ui">
                      {s.label}
                    </text>
                  </g>
                </g>
              );
            })}

            {/* 中心文字 */}
            <text x={CX} y={CY - 12} textAnchor="middle" fill="#1e293b" fontSize="13" fontWeight="600" fontFamily="system-ui">数据飞轮</text>
            <text x={CX} y={CY + 6} textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily="system-ui">Data Flywheel</text>
            <text x={CX} y={CY + 22} textAnchor="middle" fill="#6c5ce7" fontSize="8" fontFamily="monospace">
              {DATA_FLOW_STATS.fleet.totalVehicles} 车 · {DATA_FLOW_STATS.daily.rawData}/天
            </text>
          </svg>
        </div>

        {/* 右侧数据流统计 */}
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-gray-700 mb-3">📊 每日数据流量（{DATA_FLOW_STATS.fleet.totalVehicles} 辆车）</div>
          <div className="space-y-2">
            {[
              { label: '原始采集', value: DATA_FLOW_STATS.daily.rawData, color: '#6c5ce7', pct: 100 },
              { label: '压缩后', value: DATA_FLOW_STATS.daily.afterCompress, color: '#00cec9', pct: 20 },
              { label: '上传量', value: DATA_FLOW_STATS.daily.uploaded, color: '#fd79a8', pct: 16 },
              { label: '清洗后', value: DATA_FLOW_STATS.daily.afterClean, color: '#ffa657', pct: 12 },
              { label: '标注完成', value: DATA_FLOW_STATS.daily.annotated, color: '#3fb950', pct: 8 },
              { label: '训练就绪', value: DATA_FLOW_STATS.daily.trainReady, color: '#79c0ff', pct: 4 },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2">
                <span className="text-[10px] text-gray-500 w-14 text-right font-mono">{item.label}</span>
                <div className="flex-1 h-5 bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                  <div className="h-full rounded-full flex items-center px-2 transition-all duration-500"
                    style={{ width: `${Math.max(item.pct, 8)}%`, background: item.color + '30' }}>
                    <span className="text-[9px] font-mono font-semibold" style={{ color: item.color }}>{item.value}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              { label: '累计原始数据', value: DATA_FLOW_STATS.cumulative.totalRaw, icon: '💾' },
              { label: '累计场景数', value: DATA_FLOW_STATS.cumulative.totalScenes, icon: '🎬' },
              { label: '累计里程', value: DATA_FLOW_STATS.cumulative.totalMileage, icon: '🛣️' },
            ].map(item => (
              <div key={item.label} className="rounded-xl border border-gray-100 bg-gray-50/50 p-2.5 text-center">
                <div className="text-sm mb-0.5">{item.icon}</div>
                <div className="text-xs font-semibold text-gray-800 font-mono">{item.value}</div>
                <div className="text-[9px] text-gray-400">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. 数据采集层
// ─────────────────────────────────────────────────────────────────────────────
function CollectSection() {
  const { sensors, edgeCompute, triggerStrategies } = COLLECT_LAYER;

  return (
    <div className="space-y-4">
      {/* 传感器矩阵 */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5">
        <SectionTitle icon="📷" title="传感器配置" desc={`总带宽 ~${sensors.reduce((s, x) => s + parseFloat(x.bandwidth), 0).toFixed(0)} MB/s · ${edgeCompute.dailyData}`} />
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {sensors.map(s => (
            <div key={s.name} className="rounded-xl border p-3 text-center hover:shadow-sm transition-shadow"
              style={{ borderColor: s.color + '33', background: s.color + '06' }}>
              <div className="text-xl mb-1">{s.icon}</div>
              <div className="text-xs font-semibold text-gray-800 mb-1">{s.name}</div>
              <div className="text-[10px] text-gray-500 leading-relaxed">{s.spec}</div>
              <div className="text-[10px] font-mono mt-1" style={{ color: s.color }}>{s.bandwidth}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 边缘计算 */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5">
        <SectionTitle icon="🖥️" title="边缘计算平台" desc={`${edgeCompute.platform} · ${edgeCompute.os} · ${edgeCompute.container}`} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {edgeCompute.tasks.map(t => (
            <div key={t.name} className="rounded-xl border border-gray-100 bg-gray-50/50 p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-gray-700">{t.name}</span>
                <Badge color="#6c5ce7">{t.tech}</Badge>
              </div>
              <p className="text-[10px] text-gray-500 leading-relaxed">{t.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 触发策略 */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5">
        <SectionTitle icon="🎯" title="采集触发策略" desc="多级触发策略，平衡数据质量与存储成本" />
        <div className="space-y-2">
          {triggerStrategies.map(t => {
            const priorityColors = { critical: '#ff7b72', high: '#ffa657', medium: '#79c0ff', low: '#3fb950' };
            return (
              <div key={t.name} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/30 p-3">
                <Badge color={priorityColors[t.priority]}>{t.priority}</Badge>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-semibold text-gray-700">{t.name}</span>
                  <span className="text-[10px] text-gray-400 ml-2">{t.desc}</span>
                </div>
                <span className="text-[10px] font-mono text-gray-400 flex-shrink-0">{t.storage}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. 数据上传层
// ─────────────────────────────────────────────────────────────────────────────
function UploadSection() {
  const { channels, uploadPipeline, infra } = UPLOAD_LAYER;

  return (
    <div className="space-y-4">
      {/* 上传通道 */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5">
        <SectionTitle icon="📶" title="上传通道" desc="多通道智能切换，根据网络质量和数据优先级动态调度" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {channels.map(c => (
            <div key={c.name} className="rounded-xl border border-gray-100 bg-gray-50/50 p-4 text-center">
              <div className="text-xl mb-2">{c.icon}</div>
              <div className="text-xs font-semibold text-gray-800 mb-1">{c.name}</div>
              <div className="text-[10px] text-gray-500 mb-2">{c.scenario}</div>
              <div className="flex items-center justify-center gap-3">
                <span className="text-[10px] font-mono text-[#6c5ce7]">{c.bandwidth}</span>
                <span className="text-[10px] text-gray-400">成本: {c.cost}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 上传流水线 */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5">
        <SectionTitle icon="⬆️" title="上传流水线" desc="5 步智能上传，保证数据完整性和传输效率" />
        <div className="flex flex-col gap-2">
          {uploadPipeline.map((p, i) => (
            <div key={p.step} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#00cec9]/10 border border-[#00cec9]/30 flex items-center justify-center text-sm flex-shrink-0">
                {p.icon}
              </div>
              {i > 0 && (
                <div className="absolute -mt-8 ml-4 w-px h-4 bg-[#00cec9]/20" />
              )}
              <div className="flex-1 rounded-xl border border-gray-100 bg-gray-50/30 p-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-700">{p.name}</span>
                  <span className="text-[10px] text-gray-400">{p.desc}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 基础设施 */}
      <div className="rounded-2xl border border-[#00cec9]/20 bg-[#00cec9]/5 p-5">
        <div className="text-xs font-semibold text-gray-700 mb-3">☸️ 上传层基础设施（全容器化）</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {Object.entries(infra).map(([key, value]) => (
            <div key={key} className="rounded-lg border border-[#00cec9]/20 bg-white/80 p-2.5">
              <div className="text-[9px] text-gray-400 mb-0.5">{key}</div>
              <div className="text-[10px] font-mono text-gray-700">{value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. 数据处理层
// ─────────────────────────────────────────────────────────────────────────────
function ProcessSection() {
  const { pipeline, orchestration } = PROCESS_LAYER;

  return (
    <div className="space-y-4">
      {/* 处理流水线 */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5">
        <SectionTitle icon="⚙️" title="数据处理流水线" desc="全容器化 DAG 编排，从原始数据到训练就绪数据" />
        <div className="space-y-3">
          {pipeline.map((p, i) => (
            <div key={p.id} className="rounded-xl border p-4 hover:shadow-sm transition-shadow"
              style={{ borderColor: p.color + '33', background: p.color + '04' }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold" style={{ color: p.color }}>{p.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge color={p.color}>{p.container}</Badge>
                  <span className="text-[9px] text-gray-400 font-mono">×{p.replicas}</span>
                </div>
              </div>
              <p className="text-[10px] text-gray-500 mb-2">{p.desc}</p>
              <div className="flex items-center gap-4 text-[9px] text-gray-400 font-mono">
                <span>CPU: {p.cpu}</span>
                <span>MEM: {p.mem}</span>
                {p.gpu && <span className="text-[#3fb950]">GPU: {p.gpu}</span>}
                <div className="flex items-center gap-1 ml-auto flex-wrap justify-end">
                  {p.tech.map(t => (
                    <span key={t} className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 text-[9px]">{t}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 编排引擎 */}
      <div className="rounded-2xl border border-[#fd79a8]/20 bg-[#fd79a8]/5 p-5">
        <div className="text-xs font-semibold text-gray-700 mb-3">🎼 编排 & 可观测性</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {Object.entries(orchestration).map(([key, value]) => (
            <div key={key} className="rounded-lg border border-[#fd79a8]/20 bg-white/80 p-2.5">
              <div className="text-[9px] text-gray-400 mb-0.5">{key}</div>
              <div className="text-[10px] font-mono text-gray-700">{value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. 数据存储层
// ─────────────────────────────────────────────────────────────────────────────
function StoreSection() {
  const { tiers, dataLake, featureStore, scale } = STORE_LAYER;
  const uc = UNITY_CATALOG_LAYER;
  const [activeTab, setActiveTab] = useState('storage');

  return (
    <div className="space-y-4">
      {/* Tab 切换 */}
      <div className="flex gap-2 flex-wrap">
        {[
          { id: 'storage',  label: '分层存储',       icon: '📦' },
          { id: 'catalog',  label: 'Unity Catalog',  icon: '🗂️' },
          { id: 'lineage',  label: '数据血缘',       icon: '🔗' },
          { id: 'access',   label: '访问控制',       icon: '🔐' },
          { id: 'quality',  label: '数据质量',       icon: '✅' },
          { id: 'features', label: '特征仓库',       icon: '🍽️' },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className="text-xs px-3 py-1.5 rounded-full border transition-all"
            style={{
              background: activeTab === t.id ? '#ffa657' : 'transparent',
              color: activeTab === t.id ? '#fff' : '#64748b',
              borderColor: activeTab === t.id ? '#ffa657' : '#e2e8f0',
            }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* 分层存储 */}
      {activeTab === 'storage' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-100 bg-white p-5">
            <SectionTitle icon="📦" title="分层存储" desc="热/温/冷三级存储，自动生命周期管理" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {tiers.map(t => (
                <div key={t.name} className="rounded-xl border p-4 text-center"
                  style={{ borderColor: t.color + '33', background: t.color + '06' }}>
                  <div className="text-2xl mb-2">{t.icon}</div>
                  <div className="text-sm font-semibold text-gray-800 mb-1">{t.name}</div>
                  <div className="text-[10px] font-mono mb-2" style={{ color: t.color }}>{t.tech}</div>
                  <div className="text-[10px] text-gray-500 mb-1">{t.data}</div>
                  <div className="flex items-center justify-center gap-3 text-[9px] text-gray-400">
                    <span>延迟: {t.latency}</span>
                    <span>成本: {t.cost}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-[#ffa657]/20 bg-[#ffa657]/5 p-5">
            <div className="text-xs font-semibold text-gray-700 mb-3">📊 存储规模</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Object.entries(scale).map(([key, value]) => {
                const labels = { totalVolume: '总存储量', dailyIngestion: '日入库量', annotatedData: '标注数据', trainReady: '训练就绪' };
                return (
                  <div key={key} className="rounded-lg border border-[#ffa657]/20 bg-white/80 p-3 text-center">
                    <div className="text-sm font-semibold text-gray-800 font-mono">{value}</div>
                    <div className="text-[9px] text-gray-400 mt-0.5">{labels[key] || key}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Unity Catalog 三层命名空间 */}
      {activeTab === 'catalog' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-100 bg-white p-5">
            <SectionTitle icon="🗂️" title={uc.title} desc={uc.desc} color="#ffa657" />
            <div className="mb-3 rounded-xl border border-[#ffa657]/20 bg-[#ffa657]/5 p-3">
              <div className="text-[10px] font-semibold text-gray-700 mb-1">{uc.namespace.title}</div>
              <div className="text-[9px] text-gray-400">部署方式：{uc.deployment.recommended}</div>
              <div className="text-[9px] font-mono text-[#ffa657] mt-0.5">{uc.deployment.repo} · {uc.deployment.version}</div>
            </div>
            <div className="space-y-3">
              {uc.namespace.catalogs.map(cat => (
                <div key={cat.name} className="rounded-xl border p-3"
                  style={{ borderColor: cat.color + '30', background: cat.color + '05' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-base">{cat.icon}</span>
                    <span className="text-xs font-bold font-mono" style={{ color: cat.color }}>{cat.name}</span>
                    <span className="text-[10px] text-gray-400">{cat.desc}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                    {cat.schemas.map(schema => (
                      <div key={schema.name} className="rounded-lg border border-gray-100 bg-white/80 p-2">
                        <div className="text-[9px] font-mono font-semibold text-gray-600 mb-1">
                          <span style={{ color: cat.color }}>.</span>{schema.name}
                        </div>
                        <div className="flex flex-wrap gap-0.5 mb-1">
                          {schema.tables.map(t => (
                            <span key={t} className="text-[8px] px-1 py-0.5 rounded font-mono"
                              style={{ background: cat.color + '12', color: cat.color }}>{t}</span>
                          ))}
                        </div>
                        <div className="text-[8px] text-gray-400">{schema.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 集成工具 */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5">
            <SectionTitle icon="🔌" title="与现有工具集成" desc="Unity Catalog 作为统一元数据层，无缝接入现有数据栈" color="#ffa657" />
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
          </div>
        </div>
      )}

      {/* 数据血缘 */}
      {activeTab === 'lineage' && (
        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <SectionTitle icon="🔗" title={uc.lineage.title} desc={uc.lineage.desc} color="#ffa657" />
          {/* 血缘链路 */}
          <div className="space-y-2 mb-4">
            {uc.lineage.chain.map((link, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="flex-1 rounded-lg border border-[#ffa657]/20 bg-[#ffa657]/5 p-2">
                  <div className="text-[9px] font-mono text-gray-600">{link.from}</div>
                </div>
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className="text-[8px] text-gray-400 whitespace-nowrap">{link.op}</div>
                  <div className="text-[#ffa657] text-xs">→</div>
                  <div className="text-[8px] text-gray-300 whitespace-nowrap">{link.latency}</div>
                </div>
                <div className="flex-1 rounded-lg border border-[#3fb950]/20 bg-[#3fb950]/5 p-2">
                  <div className="text-[9px] font-mono text-gray-600">{link.to}</div>
                </div>
              </div>
            ))}
          </div>
          {/* 血缘能力 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {uc.lineage.capabilities.map(cap => (
              <div key={cap.name} className="rounded-xl border border-[#ffa657]/20 bg-[#ffa657]/5 p-3 text-center">
                <div className="text-lg mb-1">{cap.icon}</div>
                <div className="text-[10px] font-semibold text-gray-700 mb-0.5">{cap.name}</div>
                <div className="text-[9px] text-gray-400">{cap.desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 访问控制 */}
      {activeTab === 'access' && (
        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <SectionTitle icon="🔐" title={uc.accessControl.title} desc="基于角色的细粒度权限，支持行级过滤和列级脱敏" color="#ffa657" />
          <div className="space-y-2 mb-4">
            {uc.accessControl.principals.map(p => (
              <div key={p.role} className="flex items-start gap-3 rounded-xl border p-3"
                style={{ borderColor: p.color + '25', background: p.color + '04' }}>
                <span className="text-base flex-shrink-0">{p.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-gray-700 mb-1">{p.role}</div>
                  <div className="flex flex-wrap gap-1">
                    {p.permissions.map(perm => (
                      <span key={perm} className="text-[8px] px-1.5 py-0.5 rounded font-mono"
                        style={{ background: p.color + '15', color: p.color }}>{perm}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="rounded-xl border border-[#ffa657]/20 bg-[#ffa657]/5 p-3">
              <div className="text-[10px] font-semibold text-gray-700 mb-1">🔍 行级过滤</div>
              <div className="text-[9px] text-gray-500">{uc.accessControl.rowFilter}</div>
            </div>
            <div className="rounded-xl border border-[#ffa657]/20 bg-[#ffa657]/5 p-3">
              <div className="text-[10px] font-semibold text-gray-700 mb-1">🙈 列级脱敏</div>
              <div className="text-[9px] text-gray-500">{uc.accessControl.columnMask}</div>
            </div>
          </div>
        </div>
      )}

      {/* 数据质量 */}
      {activeTab === 'quality' && (
        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <SectionTitle icon="✅" title={uc.dataQuality.title} desc={`引擎: ${uc.dataQuality.engine} · 告警: ${uc.dataQuality.alerting}`} color="#ffa657" />
          <div className="space-y-2">
            {uc.dataQuality.rules.map((r, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/30 p-3">
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold flex-shrink-0 ${
                  r.severity === 'error' ? 'bg-red-50 text-red-500' : 'bg-yellow-50 text-yellow-600'
                }`}>{r.severity}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[9px] font-mono text-gray-500 truncate">{r.table}</div>
                  <div className="text-[10px] text-gray-700">{r.rule}</div>
                </div>
                <span className={`text-[8px] px-1.5 py-0.5 rounded flex-shrink-0 ${
                  r.autoFix ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'
                }`}>{r.autoFix ? '自动修复' : '人工处理'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 特征仓库 */}
      {activeTab === 'features' && (
        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <SectionTitle icon="🍽️" title="特征仓库 (Feature Store)" desc={`${featureStore.engine} — 预计算特征加速训练`} />
          <div className="space-y-2">
            {featureStore.features.map(f => (
              <div key={f.name} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/30 p-3">
                <span className="text-xs font-semibold text-gray-700 w-20">{f.name}</span>
                <span className="text-[10px] font-mono text-[#6c5ce7]">{f.dim}</span>
                <Badge color="#00cec9">{f.format}</Badge>
                <span className="text-[10px] text-gray-400 ml-auto">{f.source}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 rounded-xl border border-[#ffa657]/20 bg-[#ffa657]/5 p-3">
            <div className="text-[10px] font-semibold text-gray-700 mb-1">📍 Unity Catalog 映射</div>
            <div className="text-[9px] text-gray-500">特征定义存储于 <span className="font-mono text-[#ffa657]">feature_store.online.*</span> 和 <span className="font-mono text-[#ffa657]">feature_store.offline.*</span>，血缘自动追踪至原始传感器数据</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. 模型训练层
// ─────────────────────────────────────────────────────────────────────────────
function TrainSection() {
  const { cluster, trainPipeline, mlops } = TRAIN_LAYER;

  return (
    <div className="space-y-4">
      {/* GPU 集群 */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5">
        <SectionTitle icon="🖥️" title="GPU 训练集群" desc="大规模分布式训练基础设施" />
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {Object.entries(cluster).map(([key, value]) => (
            <div key={key} className="rounded-lg border border-gray-100 bg-gray-50/50 p-2.5">
              <div className="text-[9px] text-gray-400 mb-0.5">{key}</div>
              <div className="text-[10px] font-mono text-gray-700">{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 三阶段训练 */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5">
        <SectionTitle icon="📈" title="三阶段训练流水线" desc="VLA + 世界模型渐进式训练" />
        <div className="space-y-3">
          {trainPipeline.map((p, i) => {
            const colors = ['#6c5ce7', '#00cec9', '#fd79a8'];
            return (
              <div key={p.stage} className="rounded-xl border p-4"
                style={{ borderColor: colors[i] + '33', background: colors[i] + '04' }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge color={colors[i]}>{p.stage}</Badge>
                    <span className="text-xs font-semibold text-gray-700">{p.name}</span>
                  </div>
                  <span className="text-[10px] font-mono text-gray-400">{p.time}</span>
                </div>
                <div className="flex items-center gap-4 text-[9px] text-gray-400 font-mono">
                  <span>数据: {p.data}</span>
                  <span>步数: {p.steps}</span>
                  <span>GPU: {p.gpu}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MLOps */}
      <div className="rounded-2xl border border-[#3fb950]/20 bg-[#3fb950]/5 p-5">
        <div className="text-xs font-semibold text-gray-700 mb-3">🔬 MLOps 工具链</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {Object.entries(mlops).map(([key, value]) => {
            const labels = { experiment: '实验管理', registry: '模型注册', ci: 'CI/CD', validation: '自动评测' };
            return (
              <div key={key} className="rounded-lg border border-[#3fb950]/20 bg-white/80 p-2.5">
                <div className="text-[9px] text-gray-400 mb-0.5">{labels[key] || key}</div>
                <div className="text-[10px] font-mono text-gray-700">{value}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. 模型部署层
// ─────────────────────────────────────────────────────────────────────────────
function DeploySection() {
  const { pipeline, edgeInference } = DEPLOY_LAYER;

  return (
    <div className="space-y-4">
      {/* 部署流水线 */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5">
        <SectionTitle icon="🚀" title="部署流水线" desc="从模型优化到灰度发布的 5 步流程" />
        <div className="space-y-2">
          {pipeline.map((p, i) => (
            <div key={p.step} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-[#79c0ff]/10 border border-[#79c0ff]/30 flex items-center justify-center text-sm flex-shrink-0">
                  {p.icon}
                </div>
                {i < pipeline.length - 1 && <div className="w-px h-6 bg-[#79c0ff]/20 mt-1" />}
              </div>
              <div className="flex-1 rounded-xl border border-gray-100 bg-gray-50/30 p-3 -mt-0.5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-gray-700">{p.name}</span>
                  <Badge color="#79c0ff">{p.tech}</Badge>
                </div>
                <p className="text-[10px] text-gray-500">{p.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 车端推理 */}
      <div className="rounded-2xl border border-[#79c0ff]/20 bg-[#79c0ff]/5 p-5">
        <div className="text-xs font-semibold text-gray-700 mb-3">🚗 车端推理配置</div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {Object.entries(edgeInference).map(([key, value]) => (
            <div key={key} className="rounded-lg border border-[#79c0ff]/20 bg-white/80 p-2.5">
              <div className="text-[9px] text-gray-400 mb-0.5">{key}</div>
              <div className="text-[10px] font-mono text-gray-700">{value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 新增：多模态融合层
// ─────────────────────────────────────────────────────────────────────────────
function MultimodalSection() {
  const { syncStrategies, bevFusion, annotationProtocol, datasetSpec } = MULTIMODAL_LAYER;
  const [activeTab, setActiveTab] = useState('bev');

  return (
    <div className="space-y-4">
      {/* Tab 切换 */}
      <div className="flex gap-2 flex-wrap">
        {[
          { id: 'bev', label: 'BEV 融合流水线', icon: '🗺️' },
          { id: 'sync', label: '时序对齐策略', icon: '⏱️' },
          { id: 'anno', label: '跨模态标注', icon: '🏷️' },
          { id: 'spec', label: '数据集规格', icon: '📋' },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className="text-xs px-3 py-1.5 rounded-full border transition-all"
            style={{
              background: activeTab === t.id ? '#a29bfe' : 'transparent',
              color: activeTab === t.id ? '#fff' : '#64748b',
              borderColor: activeTab === t.id ? '#a29bfe' : '#e2e8f0',
            }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* BEV 融合流水线 */}
      {activeTab === 'bev' && (
        <div className="space-y-3">
          <div className="rounded-2xl border border-gray-100 bg-white p-5">
            <SectionTitle icon="🗺️" title={bevFusion.title}
              desc={`输出维度: ${bevFusion.outputDim} · 频率: ${bevFusion.fps}`}
              color="#a29bfe" />
            <div className="space-y-2">
              {bevFusion.steps.map((s, i) => (
                <div key={s.name} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: s.color + '20', color: s.color, border: `1.5px solid ${s.color}40` }}>
                      {i + 1}
                    </div>
                    {i < bevFusion.steps.length - 1 && <div className="w-px h-4 mt-1" style={{ background: s.color + '30' }} />}
                  </div>
                  <div className="flex-1 rounded-xl border p-3 -mt-0.5"
                    style={{ borderColor: s.color + '25', background: s.color + '05' }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-gray-800">{s.name}</span>
                      <Badge color={s.color}>{s.tech}</Badge>
                    </div>
                    <p className="text-[10px] text-gray-500">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 时序对齐策略 */}
      {activeTab === 'sync' && (
        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <SectionTitle icon="⏱️" title="多传感器时序对齐策略"
            desc="从硬件同步到软件插值，保证多模态数据时间一致性"
            color="#a29bfe" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {syncStrategies.map(s => (
              <div key={s.name} className="rounded-xl border p-4"
                style={{ borderColor: s.color + '30', background: s.color + '06' }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{s.icon}</span>
                  <span className="text-xs font-semibold text-gray-800">{s.name}</span>
                  <Badge color={s.color}>{s.accuracy}</Badge>
                </div>
                <p className="text-[10px] text-gray-500 mb-2">{s.desc}</p>
                <div className="text-[9px] font-mono px-2 py-1 rounded" style={{ background: s.color + '12', color: s.color }}>
                  {s.tech}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 跨模态标注协议 */}
      {activeTab === 'anno' && (
        <div className="space-y-3">
          <div className="rounded-2xl border border-gray-100 bg-white p-5">
            <SectionTitle icon="🏷️" title="跨模态联合标注协议"
              desc="五模态统一标注规范，自动化率 > 90%"
              color="#a29bfe" />
            <div className="space-y-2">
              {annotationProtocol.map(a => (
                <div key={a.modality} className="rounded-xl border p-3"
                  style={{ borderColor: a.color + '30', background: a.color + '05' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-base">{a.icon}</span>
                    <span className="text-xs font-semibold text-gray-800">{a.modality}</span>
                    <Badge color={a.color}>人工率 {a.manualRate}</Badge>
                    <span className="text-[9px] text-gray-400 ml-auto font-mono">{a.autoTool}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {a.tasks.map(t => (
                      <span key={t} className="text-[9px] px-1.5 py-0.5 rounded-md"
                        style={{ background: a.color + '15', color: a.color }}>{t}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 质量管控 */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5">
            <SectionTitle icon="✅" title={ANNOTATION_QA_LAYER.title}
              desc={ANNOTATION_QA_LAYER.desc} color="#3fb950" />
            <div className="space-y-2 mb-4">
              {ANNOTATION_QA_LAYER.qaLevels.map(q => (
                <div key={q.level} className="flex items-center gap-3 rounded-xl border p-3"
                  style={{ borderColor: q.color + '30', background: q.color + '05' }}>
                  <span className="text-base">{q.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-semibold text-gray-800">{q.level}</span>
                      <Badge color={q.color}>通过率 {q.passRate}</Badge>
                    </div>
                    <p className="text-[10px] text-gray-500">{q.desc}</p>
                  </div>
                  <span className="text-[9px] font-mono text-gray-400 flex-shrink-0">{q.tool}</span>
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-[#3fb950]/20 bg-[#3fb950]/5 p-3">
              <div className="text-[10px] font-semibold text-gray-700 mb-2">🏭 标注平台规格</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.entries(ANNOTATION_QA_LAYER.platform).map(([k, v]) => (
                  <div key={k} className="rounded-lg border border-[#3fb950]/20 bg-white/80 p-2">
                    <div className="text-[9px] text-gray-400 mb-0.5">{k}</div>
                    <div className="text-[9px] font-mono text-gray-700">{v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 数据集规格 */}
      {activeTab === 'spec' && (
        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <SectionTitle icon="📋" title="多模态数据集规格"
            desc="训练数据格式、采样率、模态覆盖率等核心参数"
            color="#a29bfe" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.entries(datasetSpec).map(([k, v]) => {
              const labels = {
                format: '存储格式',
                sampleRate: '采样频率',
                windowSize: '时序窗口',
                modalityCoverage: '模态覆盖率',
                avgAnnotationTime: '平均标注时长',
                qualityThreshold: '质量阈值',
              };
              return (
                <div key={k} className="rounded-xl border border-[#a29bfe]/20 bg-[#a29bfe]/5 p-3">
                  <div className="text-[9px] text-gray-400 mb-1">{labels[k] || k}</div>
                  <div className="text-[10px] font-mono text-gray-800">{v}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 新增：场景挖掘层
// ─────────────────────────────────────────────────────────────────────────────
function SceneMineSection() {
  const { sceneTaxonomy, miningPipeline, activeLearningLoop, flywheelMetrics } = SCENE_MINE_LAYER;
  const [activeTab, setActiveTab] = useState('taxonomy');

  return (
    <div className="space-y-4">
      {/* Tab 切换 */}
      <div className="flex gap-2 flex-wrap">
        {[
          { id: 'taxonomy', label: '场景分类体系', icon: '🗂️' },
          { id: 'pipeline', label: '挖掘技术栈', icon: '⛏️' },
          { id: 'al', label: '主动学习闭环', icon: '🎯' },
          { id: 'metrics', label: '飞轮指标', icon: '📊' },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className="text-xs px-3 py-1.5 rounded-full border transition-all"
            style={{
              background: activeTab === t.id ? '#e17055' : 'transparent',
              color: activeTab === t.id ? '#fff' : '#64748b',
              borderColor: activeTab === t.id ? '#e17055' : '#e2e8f0',
            }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* 场景分类体系 */}
      {activeTab === 'taxonomy' && (
        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <SectionTitle icon="🗂️" title="场景分类体系"
            desc="五大类场景，覆盖长尾 / 困难 / 安全关键 / 覆盖缺口 / 多样性"
            color="#e17055" />
          <div className="space-y-3">
            {sceneTaxonomy.map(s => (
              <div key={s.category} className="rounded-xl border p-4"
                style={{ borderColor: s.color + '30', background: s.color + '05' }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{s.icon}</span>
                  <span className="text-xs font-semibold text-gray-800">{s.category}</span>
                  <Badge color={s.color}>频率 {s.frequency}</Badge>
                  <Badge color={s.color}>价值 {s.value}</Badge>
                </div>
                <div className="flex flex-wrap gap-1 mb-2">
                  {s.examples.map(e => (
                    <span key={e} className="text-[9px] px-1.5 py-0.5 rounded-md"
                      style={{ background: s.color + '15', color: s.color }}>{e}</span>
                  ))}
                </div>
                <div className="text-[9px] text-gray-400 font-mono">挖掘方法: {s.mineMethod}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 挖掘技术栈 */}
      {activeTab === 'pipeline' && (
        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <SectionTitle icon="⛏️" title="场景挖掘技术栈"
            desc="从嵌入提取到数据平衡的 6 步挖掘流水线"
            color="#e17055" />
          <div className="space-y-2">
            {miningPipeline.map((p, i) => (
              <div key={p.step} className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0"
                    style={{ background: p.color + '15', border: `1.5px solid ${p.color}40` }}>
                    {p.icon}
                  </div>
                  {i < miningPipeline.length - 1 && <div className="w-px h-4 mt-1" style={{ background: p.color + '30' }} />}
                </div>
                <div className="flex-1 rounded-xl border p-3 -mt-0.5"
                  style={{ borderColor: p.color + '25', background: p.color + '04' }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-gray-800">{p.step}</span>
                    <Badge color={p.color}>{p.output}</Badge>
                  </div>
                  <p className="text-[10px] text-gray-500 mb-1">{p.desc}</p>
                  <div className="text-[9px] font-mono px-2 py-0.5 rounded inline-block"
                    style={{ background: p.color + '12', color: p.color }}>{p.tech}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 主动学习闭环 */}
      {activeTab === 'al' && (
        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <SectionTitle icon="🎯" title={activeLearningLoop.title}
            desc={activeLearningLoop.desc}
            color="#e17055" />
          <div className="space-y-2 mb-4">
            {activeLearningLoop.steps.map((s, i) => (
              <div key={s.phase} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/30 p-3">
                <div className="w-7 h-7 rounded-full bg-[#e17055]/10 border border-[#e17055]/30 flex items-center justify-center text-sm flex-shrink-0">
                  {s.icon}
                </div>
                <div>
                  <span className="text-xs font-semibold text-gray-700">{s.phase}</span>
                  <span className="text-[10px] text-gray-400 ml-2">{s.action}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-[#e17055]/20 bg-[#e17055]/5 p-3 text-center">
            <div className="text-sm font-bold text-[#e17055]">{activeLearningLoop.efficiency}</div>
          </div>
        </div>
      )}

      {/* 飞轮指标 */}
      {activeTab === 'metrics' && (
        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <SectionTitle icon="📊" title="数据飞轮量化指标"
            desc="追踪数据质量与多样性的核心 KPI"
            color="#e17055" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {flywheelMetrics.map(m => (
              <div key={m.name} className="rounded-xl border border-gray-100 bg-gray-50/50 p-3">
                <div className="text-[10px] text-gray-500 mb-1">{m.name}</div>
                <div className="text-lg font-bold font-mono mb-0.5" style={{ color: m.color }}>{m.current}</div>
                <div className="text-[9px] text-gray-400">目标: <span className="font-mono" style={{ color: m.color }}>{m.target}</span> {m.unit}</div>
                <div className="mt-1.5 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                  <div className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(parseFloat(m.current) / parseFloat(m.target) * 100, 100)}%`,
                      background: m.color,
                    }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. 效果监控层
// ─────────────────────────────────────────────────────────────────────────────
function MonitorSection() {
  const { metrics, recallTriggers } = MONITOR_LAYER;

  return (
    <div className="space-y-4">
      {/* 在线指标 */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5">
        <SectionTitle icon="📊" title="在线效果指标" desc="实时监控模型在线表现，触发回采策略" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {metrics.map(m => {
            const statusColors = { good: '#3fb950', warn: '#ffa657', bad: '#ff7b72' };
            return (
              <div key={m.name} className="rounded-xl border border-gray-100 bg-gray-50/50 p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">{m.icon}</span>
                  <span className="w-2 h-2 rounded-full" style={{ background: statusColors[m.status] }} />
                </div>
                <div className="text-xs font-semibold text-gray-800 mb-0.5">{m.name}</div>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold font-mono" style={{ color: statusColors[m.status] }}>{m.current}</span>
                  <span className="text-[9px] text-gray-400">{m.unit}</span>
                </div>
                <div className="text-[9px] text-gray-400 mt-1">阈值: {m.threshold}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 回采触发策略 */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5">
        <SectionTitle icon="🔄" title="智能回采触发" desc="基于多维信号的自动回采策略，驱动数据飞轮持续转动" />
        <div className="space-y-2">
          {recallTriggers.map(t => (
            <div key={t.name} className="flex items-center gap-3 rounded-xl border p-3"
              style={{ borderColor: t.color + '33', background: t.color + '06' }}>
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: t.color }} />
              <div className="flex-1 min-w-0">
                <span className="text-xs font-semibold text-gray-700">{t.name}</span>
                <span className="text-[10px] text-gray-400 ml-2">{t.desc}</span>
              </div>
              <Badge color={t.color}>{t.priority}</Badge>
            </div>
          ))}
        </div>
      </div>

      {/* 闭环说明 */}
      <div className="rounded-2xl border border-[#d2a8ff]/20 bg-[#d2a8ff]/5 p-5">
        <div className="text-xs font-semibold text-gray-700 mb-2">🔄 闭环驱动逻辑</div>
        <div className="space-y-1.5 text-[10px] text-gray-500 leading-relaxed">
          <div>① <span className="font-semibold text-[#6c5ce7]">监控发现问题</span> → 接管率上升 / 长尾覆盖不足 / 模型不确定性高</div>
          <div>② <span className="font-semibold text-[#00cec9]">触发回采</span> → 自动标记高价值场景，车端优先上传</div>
          <div>③ <span className="font-semibold text-[#fd79a8]">数据处理</span> → 自动标注 + 质检 + 困难样本挖掘</div>
          <div>④ <span className="font-semibold text-[#ffa657]">增量训练</span> → 新数据加入训练集，模型迭代更新</div>
          <div>⑤ <span className="font-semibold text-[#3fb950]">灰度部署</span> → 影子模式验证 → 逐步放量 → 指标提升</div>
          <div>⑥ <span className="font-semibold text-[#79c0ff]">持续循环</span> → 数据飞轮越转越快，模型越来越强</div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. 基础设施总览
// ─────────────────────────────────────────────────────────────────────────────
function InfraSection() {
  const { layers, cloudProviders } = INFRA_OVERVIEW;

  return (
    <div className="space-y-4">
      {/* 分层基础设施 */}
      {layers.map(layer => (
        <div key={layer.name} className="rounded-2xl border p-5"
          style={{ borderColor: layer.color + '33', background: layer.color + '04' }}>
          <div className="text-xs font-semibold text-gray-700 mb-3" style={{ color: layer.color }}>
            {layer.name}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {layer.components.map(c => (
              <div key={c.name} className="rounded-lg border bg-white/80 p-2.5"
                style={{ borderColor: layer.color + '20' }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-sm">{c.icon}</span>
                  <span className="text-[10px] font-semibold text-gray-700">{c.name}</span>
                </div>
                <div className="text-[9px] text-gray-400">{c.role}</div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* 多云支持 */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5">
        <SectionTitle icon="☁️" title="多云适配" desc="基于 Kubernetes 的多云部署，避免厂商锁定" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {cloudProviders.map(cp => (
            <div key={cp.name} className="rounded-xl border border-gray-100 bg-gray-50/50 p-4 text-center">
              <div className="text-xl mb-2">{cp.icon}</div>
              <div className="text-sm font-semibold text-gray-800 mb-1">{cp.name}</div>
              <div className="text-[10px] text-gray-500 font-mono">{cp.services}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 10. 架构全景图（多模态闭环全景）
// ─────────────────────────────────────────────────────────────────────────────
function ArchDiagram() {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 mb-6">
      <SectionTitle icon="🏗️" title="多模态数据闭环架构全景"
        desc="基于 Kubernetes 的全容器化架构，9 层多模态闭环设计" />

      {/* 架构层次图 */}
      <div className="space-y-1.5">
        {[
          {
            label: '车端层',
            items: ['相机×6 (1080p@20Hz)', 'LiDAR×1 (128线)', '毫米波雷达×5 (4D)', 'GNSS/IMU (RTK)', 'CAN Bus', 'Orin 边缘计算', 'k3s 容器', '隐私脱敏'],
            color: '#6c5ce7',
            arrow: '↓ 5G/WiFi/有线 · 多通道智能切换',
          },
          {
            label: '接入层',
            items: ['Kong Gateway', 'Kafka (按车辆ID分区)', 'S3 Landing Zone', 'Istio Service Mesh', 'SHA-256 完整性校验'],
            color: '#00cec9',
            arrow: '↓ 流式消费 · Airflow DAG 编排',
          },
          {
            label: '处理层',
            items: ['MCAP 解码', '时间戳对齐', '数据清洗', 'BEVFusion 自动标注', 'SAM2 分割', 'InternVL2 语言标注', 'Great Expectations 质检'],
            color: '#fd79a8',
            arrow: '↓ 多模态对齐 · 跨模态一致性校验',
          },
          {
            label: '多模态融合层',
            items: ['PTP 时序同步 (<1μs)', 'LSS 相机→BEV', 'VoxelNet LiDAR→BEV', 'RadarNet 雷达→BEV', 'BEVFusion 三模态融合', '语言嵌入注入', 'BEVFormer 时序聚合'],
            color: '#a29bfe',
            arrow: '↓ 256×200×200 BEV 特征 · 8帧时序窗口',
          },
          {
            label: '场景挖掘层',
            items: ['CLIP/DINOv2 嵌入', 'FAISS 亿级检索', '孤立森林异常检测', 'HDBSCAN 聚类', '主动学习 (BADGE)', '长尾场景标记', '数据平衡采样'],
            color: '#e17055',
            arrow: '↓ 高价值场景优先标注 · 标注效率 3-5×',
          },
          {
            label: '存储层',
            items: ['热存储 NVMe (<1ms)', '温存储 S3 (~10ms)', '冷存储 Glacier', 'Apache Iceberg 数据湖', 'Unity Catalog 元数据', 'LakeFS 版本管理', 'Feast 特征仓库', 'Trino 联邦查询'],
            color: '#ffa657',
            arrow: '↓ WebDataset · 并行文件系统 (Lustre)',
          },
          {
            label: '训练层',
            items: ['A100×128 (16节点×8卡)', 'InfiniBand 200Gbps', 'DeepSpeed ZeRO-3', 'FlashAttention-3', 'VLA+WM 联合训练', 'MLflow 实验管理', 'NAVSIM 闭环评测'],
            color: '#3fb950',
            arrow: '↓ TensorRT INT8 量化 · 知识蒸馏',
          },
          {
            label: '部署层',
            items: ['CARLA 仿真 (10万场景)', '影子模式验证', '灰度 1%→100%', 'OTA 推送', 'Orin 车端推理 (<50ms)', 'k3s + NVIDIA CTK'],
            color: '#79c0ff',
            arrow: '↓ 在线监控 · 实时指标采集',
          },
          {
            label: '监控层',
            items: ['接管率 (0.32/千km)', '碰撞率 (0.15/百万km)', '推理延迟 P99 38ms', '长尾覆盖率 72%', '分布偏移检测', '智能回采触发'],
            color: '#d2a8ff',
            arrow: '↩ 回采 → 车端层 · 数据飞轮持续转动',
          },
        ].map((layer, i) => (
          <div key={layer.label}>
            <div className="flex items-center gap-2 rounded-xl border p-3"
              style={{ borderColor: layer.color + '33', background: layer.color + '08' }}>
              <div className="w-[4.5rem] text-center flex-shrink-0">
                <div className="text-[10px] font-bold leading-tight" style={{ color: layer.color }}>{layer.label}</div>
              </div>
              <div className="flex-1 flex items-center gap-1 flex-wrap">
                {layer.items.map(item => (
                  <span key={item} className="text-[9px] px-1.5 py-0.5 rounded-md font-mono"
                    style={{ background: layer.color + '15', color: layer.color }}>
                    {item}
                  </span>
                ))}
              </div>
            </div>
            {i < 8 && (
              <div className="text-center text-[9px] text-gray-400 py-0.5 font-mono">{layer.arrow}</div>
            )}
          </div>
        ))}
      </div>

      {/* 多模态数据流说明 */}
      <div className="mt-4 rounded-xl border border-[#a29bfe]/20 bg-[#a29bfe]/5 p-3">
        <div className="text-[10px] font-semibold text-gray-700 mb-2">🔀 多模态数据闭环核心特征</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { label: '传感器模态', value: '相机 + LiDAR + 雷达 + 语言', icon: '📡' },
            { label: '时序同步精度', value: 'PTP < 1μs 硬件级', icon: '⏱️' },
            { label: '标注自动化率', value: '> 92%（人工 < 8%）', icon: '🤖' },
            { label: '主动学习增益', value: '标注效率提升 3-5×', icon: '🎯' },
          ].map(item => (
            <div key={item.label} className="rounded-lg border border-[#a29bfe]/20 bg-white/80 p-2 text-center">
              <div className="text-sm mb-0.5">{item.icon}</div>
              <div className="text-[9px] font-mono text-gray-700 font-semibold">{item.value}</div>
              <div className="text-[8px] text-gray-400 mt-0.5">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 主组件
// ═══════════════════════════════════════════════════════════════════════════════
export default function DataLoopArch() {
  const [activeStage, setActiveStage] = useState('collect');

  const stageComponents = useMemo(() => ({
    collect:    <CollectSection />,
    upload:     <UploadSection />,
    process:    <ProcessSection />,
    multimodal: <MultimodalSection />,
    sceneMine:  <SceneMineSection />,
    store:      <StoreSection />,
    train:      <TrainSection />,
    deploy:     <DeploySection />,
    monitor:    <MonitorSection />,
  }), []);

  const activeInfo = LOOP_OVERVIEW.stages.find(s => s.id === activeStage);

  return (
    <div>
      {/* 架构全景图 */}
      <ArchDiagram />

      {/* 闭环总览 */}
      <LoopOverview activeStage={activeStage} setActiveStage={setActiveStage} />

      {/* 基础设施总览 */}
      <div className="mb-6">
        <InfraSection />
      </div>

      {/* 当前选中阶段详情 */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4 p-3 rounded-xl border"
          style={{ borderColor: activeInfo.color + '33', background: activeInfo.color + '08' }}>
          <span className="text-xl">{activeInfo.icon}</span>
          <div>
            <div className="text-sm font-semibold text-gray-800">{activeInfo.label} 详情</div>
            <div className="text-[10px] text-gray-500">{activeInfo.desc} — 点击环形图切换阶段</div>
          </div>
          <div className="ml-auto flex items-center gap-1">
            {LOOP_OVERVIEW.stages.map(s => (
              <button key={s.id} onClick={() => setActiveStage(s.id)}
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all"
                style={{
                  background: activeStage === s.id ? s.color : 'transparent',
                  border: `1.5px solid ${s.color}`,
                  opacity: activeStage === s.id ? 1 : 0.4,
                }}
                title={s.label}>
                {s.icon}
              </button>
            ))}
          </div>
        </div>

        {stageComponents[activeStage]}
      </div>
    </div>
  );
}