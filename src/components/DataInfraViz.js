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
// 3. 数据湖仓
// ─────────────────────────────────────────────────────────────
function DatalakeTab() {
  const { architecture, icebergFeatures, lakeFSWorkflow, queryEngines, comparison } = DATALAKE_DATA;

  return (
    <div className="space-y-4">
      {/* 分层架构 */}
      <SectionCard icon="🏗️" title="湖仓分层架构" desc="Landing → Bronze → Silver → Gold 四层数据精炼">
        <div className="space-y-2">
          {architecture.layers.map((layer, i) => (
            <div key={layer.name}>
              <div className="flex items-center gap-3 rounded-xl border p-3"
                style={{ borderColor: layer.color + '33', background: layer.color + '06' }}>
                <div className="w-24 flex-shrink-0">
                  <div className="text-xs font-bold" style={{ color: layer.color }}>{layer.name}</div>
                  <div className="text-[9px] text-gray-400">{layer.lifecycle}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-gray-600 mb-1">{layer.desc}</div>
                  <div className="flex items-center gap-2">
                    <Badge color={layer.color}>{layer.format}</Badge>
                    <span className="text-[9px] text-gray-400">{layer.storage}</span>
                  </div>
                </div>
              </div>
              {i < architecture.layers.length - 1 && (
                <div className="text-center text-[9px] text-gray-300 py-0.5">↓ ETL</div>
              )}
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Iceberg 特性 */}
      <SectionCard icon="🧊" title="Apache Iceberg 核心特性" desc="为什么选择 Iceberg 作为数据湖表格式">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
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

      {/* 格式对比 */}
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

      {/* LakeFS 工作流 */}
      <SectionCard icon="🌿" title="LakeFS 数据版本管理" desc="Git-like 工作流管理数据变更">
        <div className="flex flex-col gap-2">
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
      </SectionCard>

      {/* 查询引擎 */}
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

// ═══════════════════════════════════════════════════════════════
// 主组件
// ═══════════════════════════════════════════════════════════════
export default function DataInfraViz() {
  const [activeTab, setActiveTab] = useState('overview');

  const tabComponents = useMemo(() => ({
    overview: <OverviewTab />,
    k8s: <K8sTab />,
    datalake: <DatalakeTab />,
    pipeline: <PipelineTab />,
    mlops: <MLOpsTab />,
    observability: <ObservabilityTab />,
    vectordb: <VectorTab />,
    dedup: <DedupTab />,
    synth: <SynthTab />,
    framework: <FrameworkTab />,
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