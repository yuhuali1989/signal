'use client';

import { useState } from 'react';
import { INDUSTRY_CRISIS, GLOBAL_BREAKOUT, PALANTIR_DEEP_DIVE, RESPONSE_FRAMEWORK, BENCHMARKS } from '@/lib/strategy-data';

// ═══════════════════════════════════════════════════════════════
// 通用 UI 组件
// ═══════════════════════════════════════════════════════════════
function Badge({ color, children }) {
  return (
    <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap"
      style={{ background: color + '15', color }}>
      {children}
    </span>
  );
}

function SectionCard({ icon, title, desc, children, color }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-base">{icon}</span>
        <h3 className="text-sm font-bold text-gray-800">{title}</h3>
      </div>
      {desc && <p className="text-[10px] text-gray-400 mb-4 ml-6">{desc}</p>}
      {children}
    </div>
  );
}

function ProgressBar({ value, max, color }) {
  const pct = typeof value === 'string' ? parseInt(value) : (value / max) * 100;
  return (
    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.min(pct, 100)}%`, background: color }} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Tab 1: 行业困境分析
// ═══════════════════════════════════════════════════════════════
function CrisisTab() {
  const { timeline, crises } = INDUSTRY_CRISIS;
  const [expandedCrisis, setExpandedCrisis] = useState(null);

  return (
    <div className="space-y-4">
      {/* AI 发展时间线 */}
      <SectionCard icon="⏳" title="AI Coding 发展时间线" desc="从代码补全到自主编码 Agent 的演进">
        <div className="space-y-2">
          {timeline.map((t, i) => (
            <div key={t.year} className="flex items-center gap-3">
              <div className="w-14 flex-shrink-0 text-right">
                <span className="text-xs font-bold font-mono" style={{ color: t.color }}>{t.year}</span>
              </div>
              <div className="w-6 flex-shrink-0 flex flex-col items-center">
                <div className="w-3 h-3 rounded-full border-2" style={{ borderColor: t.color, background: t.color + '30' }} />
                {i < timeline.length - 1 && <div className="w-0.5 h-6 bg-gray-100" />}
              </div>
              <div className="flex-1 rounded-xl border p-3" style={{ borderColor: t.color + '33', background: t.color + '04' }}>
                <div className="flex items-center gap-2 mb-1">
                  <span>{t.icon}</span>
                  <span className="text-xs font-semibold text-gray-800">{t.event}</span>
                </div>
                <span className="text-[10px] text-gray-500">{t.impact}</span>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* 五大困境 */}
      <SectionCard icon="⚠️" title="五大核心困境" desc="AI Coding & Agent 时代对软件行业的系统性冲击">
        <div className="space-y-3">
          {crises.map(c => (
            <div key={c.id} className="rounded-xl border p-4 cursor-pointer transition-all hover:shadow-sm"
              style={{ borderColor: c.color + '33', background: c.color + '04' }}
              onClick={() => setExpandedCrisis(expandedCrisis === c.id ? null : c.id)}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{c.icon}</span>
                  <span className="text-sm font-bold text-gray-800">{c.name}</span>
                  <Badge color={c.color}>{c.severity}</Badge>
                </div>
                <span className="text-xs text-gray-400">{expandedCrisis === c.id ? '收起 ▲' : '展开 ▼'}</span>
              </div>
              <p className="text-[10px] text-gray-500 mb-2">{c.desc}</p>

              {expandedCrisis === c.id && (
                <div className="mt-3 space-y-3 animate-fadeIn">
                  {/* 证据 */}
                  <div>
                    <div className="text-[10px] font-semibold text-gray-600 mb-1.5">📊 关键证据</div>
                    <div className="space-y-1">
                      {c.evidence.map((e, i) => (
                        <div key={i} className="flex items-start gap-2 text-[10px] text-gray-500">
                          <span className="text-gray-300 mt-0.5">•</span>
                          <span>{e}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* 受影响群体 */}
                  <div>
                    <div className="text-[10px] font-semibold text-gray-600 mb-1.5">🎯 受影响群体</div>
                    <div className="flex flex-wrap gap-1.5">
                      {c.affected.map(a => (
                        <Badge key={a} color={c.color}>{a}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Tab 2: 全球破局思路
// ═══════════════════════════════════════════════════════════════
function BreakoutTab() {
  const { strategies } = GLOBAL_BREAKOUT;
  const [activeStrategy, setActiveStrategy] = useState('palantir');

  const current = strategies.find(s => s.id === activeStrategy);

  return (
    <div className="space-y-4">
      {/* 策略选择器 */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-gray-50 rounded-2xl border border-gray-100">
        {strategies.map(s => (
          <button key={s.id} onClick={() => setActiveStrategy(s.id)}
            className="flex items-center gap-1.5 py-2 px-3 rounded-xl text-xs font-medium transition-all whitespace-nowrap"
            style={activeStrategy === s.id
              ? { background: '#fff', color: s.color, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: `1px solid ${s.color}33` }
              : { color: '#94a3b8' }}>
            <span>{s.icon}</span>
            <span>{s.name}</span>
          </button>
        ))}
      </div>

      {current && (
        <SectionCard icon={current.icon} title={current.name} desc={current.subtitle}>
          {/* 核心洞察 */}
          <div className="rounded-xl border p-4 mb-4" style={{ borderColor: current.color + '33', background: current.color + '06' }}>
            <div className="text-[10px] font-semibold text-gray-600 mb-1">💡 核心洞察</div>
            <p className="text-xs text-gray-700 font-medium">{current.keyInsight}</p>
          </div>

          {/* Palantir 特殊展示 */}
          {current.id === 'palantir' && (
            <>
              <div className="flex items-center gap-4 mb-4 text-[10px] text-gray-500 font-mono">
                <span>市值: <span className="font-semibold" style={{ color: current.color }}>{current.marketCap}</span></span>
                <span>营收: <span className="font-semibold" style={{ color: current.color }}>{current.revenue}</span></span>
                <span>增长: <span className="font-semibold text-[#3fb950]">{current.growth}</span></span>
              </div>
              <div className="space-y-2 mb-4">
                {current.pillars.map(p => (
                  <div key={p.name} className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/30 p-3">
                    <span className="text-lg flex-shrink-0">{p.icon}</span>
                    <div>
                      <div className="text-xs font-semibold text-gray-700">{p.name}</div>
                      <div className="text-[10px] text-gray-500 mt-0.5">{p.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="rounded-lg border border-[#6c5ce7]/20 bg-[#6c5ce7]/5 p-3">
                <div className="text-[10px] font-semibold text-[#6c5ce7] mb-1">🏰 护城河</div>
                <div className="text-[10px] text-gray-600">{current.moat}</div>
              </div>
            </>
          )}

          {/* 垂直 AI / 平台 / 复合 AI / 数据飞轮 */}
          {current.examples && (
            <div className="space-y-2">
              {current.examples.map((ex, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/30 p-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-semibold text-gray-700">{ex.company}</span>
                      {ex.domain && <Badge color={current.color}>{ex.domain}</Badge>}
                    </div>
                    <div className="text-[10px] text-gray-500">{ex.desc}</div>
                  </div>
                  {ex.revenue && (
                    <div className="text-xs font-mono font-semibold flex-shrink-0" style={{ color: current.color }}>
                      {ex.revenue}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Tab 3: Palantir 模式深度解析
// ═══════════════════════════════════════════════════════════════
function PalantirTab() {
  const { products, moats, financials } = PALANTIR_DEEP_DIVE;

  return (
    <div className="space-y-4">
      {/* 产品矩阵 */}
      <SectionCard icon="📦" title="核心产品矩阵" desc="Foundry（商业）+ Gotham（国防）+ AIP（AI 平台）">
        <div className="space-y-4">
          {products.map(p => (
            <div key={p.name} className="rounded-xl border p-4" style={{ borderColor: p.color + '33', background: p.color + '04' }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{p.icon}</span>
                <span className="text-sm font-bold" style={{ color: p.color }}>{p.name}</span>
                <Badge color={p.color}>{p.target}</Badge>
              </div>
              <p className="text-[10px] text-gray-500 mb-3">{p.desc}</p>
              <div className="space-y-1.5">
                {p.layers.map((l, i) => (
                  <div key={l.name} className="flex items-center gap-2 rounded-lg border border-gray-100 bg-white/80 p-2">
                    <div className="w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-bold text-white"
                      style={{ background: p.color }}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-semibold text-gray-700">{l.name}</span>
                      <span className="text-[10px] text-gray-400 ml-2">{l.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* 核心竞争力 */}
      <SectionCard icon="🏰" title="核心竞争力（护城河）" desc="为什么 Palantir 难以被替代">
        <div className="space-y-3">
          {moats.map(m => (
            <div key={m.name} className="rounded-xl border p-4" style={{ borderColor: m.color + '33', background: m.color + '04' }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{m.icon}</span>
                <span className="text-xs font-bold text-gray-800">{m.name}</span>
              </div>
              <p className="text-[10px] text-gray-500 mb-2">{m.desc}</p>
              <div className="rounded-lg border border-gray-100 bg-white/60 p-2">
                <span className="text-[9px] text-gray-400">💬 类比：</span>
                <span className="text-[10px] text-gray-600 italic">{m.analogy}</span>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* 财务数据 */}
      <SectionCard icon="📈" title="财务表现" desc="营收增长 + 关键经营指标">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* 营收趋势 */}
          <div>
            <div className="text-[10px] font-semibold text-gray-600 mb-2">💰 营收趋势</div>
            <div className="space-y-1.5">
              {financials.revenue.map(r => (
                <div key={r.year} className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-gray-500 w-12">{r.year}</span>
                  <div className="flex-1">
                    <ProgressBar value={parseFloat(r.value.replace('$', '').replace('B', '')) / 4 * 100} max={100} color="#6c5ce7" />
                  </div>
                  <span className="text-[10px] font-mono font-semibold text-gray-700 w-14 text-right">{r.value}</span>
                  <span className="text-[9px] font-mono text-[#3fb950] w-10 text-right">{r.growth}</span>
                </div>
              ))}
            </div>
          </div>
          {/* 关键指标 */}
          <div>
            <div className="text-[10px] font-semibold text-gray-600 mb-2">📊 关键指标 (2024)</div>
            <div className="space-y-2">
              {Object.entries(financials.metrics).map(([key, value]) => {
                const labels = {
                  nrr: '净收入留存率 (NRR)',
                  govRevenue: '政府营收占比',
                  commercialRevenue: '商业营收占比',
                  commercialGrowth: '商业增长率',
                  customers: '客户数量',
                  topCustomerConcentration: '最大客户占比',
                  ruleOf40: 'Rule of 40',
                };
                return (
                  <div key={key} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50/30 p-2">
                    <span className="text-[10px] text-gray-500">{labels[key] || key}</span>
                    <span className="text-[10px] font-mono font-semibold text-[#6c5ce7]">{value}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Tab 4: 应对框架
// ═══════════════════════════════════════════════════════════════
function FrameworkTab() {
  const { philosophy, layers, roadmap, teamTransformation, kpis } = RESPONSE_FRAMEWORK;

  return (
    <div className="space-y-4">
      {/* 核心理念转变 */}
      <SectionCard icon="💡" title="核心理念转变" desc="从代码工厂到决策引擎的范式转移">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex-1 min-w-[200px] rounded-xl border border-gray-200 bg-gray-50 p-3 text-center">
            <div className="text-[9px] text-gray-400 mb-1">BEFORE</div>
            <div className="text-xs text-gray-600">{philosophy.before}</div>
          </div>
          <div className="text-xl text-[#6c5ce7] flex-shrink-0">→</div>
          <div className="flex-1 min-w-[200px] rounded-xl border border-[#6c5ce7]/30 bg-[#6c5ce7]/5 p-3 text-center">
            <div className="text-[9px] text-[#6c5ce7] mb-1">AFTER</div>
            <div className="text-xs font-semibold text-[#6c5ce7]">{philosophy.after}</div>
          </div>
        </div>
        <div className="text-center mt-3">
          <Badge color="#e17055">{philosophy.shift}</Badge>
        </div>
      </SectionCard>

      {/* 四层架构 */}
      <SectionCard icon="🏗️" title="四层架构体系" desc="借鉴 Palantir 模式的平台产品架构">
        <div className="space-y-4">
          {layers.map((layer, idx) => (
            <div key={layer.id} className="rounded-xl border p-4" style={{ borderColor: layer.color + '33', background: layer.color + '04' }}>
              {/* 层级标题 */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{layer.icon}</span>
                  <div>
                    <div className="text-sm font-bold" style={{ color: layer.color }}>{layer.name}</div>
                    <div className="text-[9px] text-gray-400 font-mono">{layer.subtitle}</div>
                  </div>
                </div>
                <Badge color={layer.color}>Ref: {layer.palantirRef}</Badge>
              </div>
              <p className="text-[10px] text-gray-500 mb-3">{layer.desc}</p>

              {/* 能力项 */}
              <div className="space-y-2 mb-3">
                {layer.capabilities.map(cap => (
                  <div key={cap.name} className="rounded-lg border border-gray-100 bg-white/80 p-2.5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-semibold text-gray-700">{cap.name}</span>
                      <span className="text-[8px] font-mono text-gray-400">{cap.tech}</span>
                    </div>
                    <div className="text-[10px] text-gray-500">{cap.desc}</div>
                  </div>
                ))}
              </div>

              {/* 指标 */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {layer.metrics.map(m => (
                  <div key={m.label} className="rounded-lg border border-gray-100 bg-white/60 p-2 text-center">
                    <div className="text-xs font-bold font-mono" style={{ color: layer.color }}>{m.value}{m.unit}</div>
                    <div className="text-[8px] text-gray-400">{m.label}</div>
                  </div>
                ))}
              </div>

              {idx < layers.length - 1 && (
                <div className="text-center text-gray-300 mt-3 text-sm">⬇</div>
              )}
            </div>
          ))}
        </div>
      </SectionCard>

      {/* 实施路线图 */}
      <SectionCard icon="🗺️" title="实施路线图" desc="4 个阶段，18 个月完成核心转型">
        <div className="space-y-3">
          {roadmap.map((phase, i) => (
            <div key={phase.phase}>
              <div className="rounded-xl border p-4" style={{ borderColor: phase.color + '33', background: phase.color + '04' }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{phase.icon}</span>
                    <span className="text-sm font-bold" style={{ color: phase.color }}>{phase.phase}: {phase.name}</span>
                  </div>
                  <Badge color={phase.color}>{phase.duration}</Badge>
                </div>
                <div className="space-y-1 mb-3">
                  {phase.goals.map((g, j) => (
                    <div key={j} className="flex items-start gap-2 text-[10px] text-gray-500">
                      <span className="text-gray-300 mt-0.5">•</span>
                      <span>{g}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {phase.deliverables.map(d => (
                      <Badge key={d} color={phase.color}>{d}</Badge>
                    ))}
                  </div>
                  <span className="text-[9px] text-gray-400">⚠️ {phase.risk}</span>
                </div>
              </div>
              {i < roadmap.length - 1 && (
                <div className="text-center text-gray-300 py-1 text-xs">↓</div>
              )}
            </div>
          ))}
        </div>
      </SectionCard>

      {/* 团队能力转型 */}
      <SectionCard icon="👥" title="团队能力转型" desc="从传统开发团队到 AI-Native 团队">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Before */}
          <div>
            <div className="text-[10px] font-semibold text-gray-500 mb-2 text-center">📌 当前团队结构</div>
            <div className="space-y-2">
              {teamTransformation.before.map(r => (
                <div key={r.role} className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-2">
                  <span>{r.icon}</span>
                  <span className="text-[10px] text-gray-600 flex-1">{r.role}</span>
                  <span className="text-[10px] font-mono font-semibold text-gray-500">{r.count}</span>
                </div>
              ))}
            </div>
          </div>
          {/* After */}
          <div>
            <div className="text-[10px] font-semibold text-[#6c5ce7] mb-2 text-center">🎯 目标团队结构</div>
            <div className="space-y-2">
              {teamTransformation.after.map(r => (
                <div key={r.role} className="flex items-center gap-2 rounded-lg border border-[#6c5ce7]/20 bg-[#6c5ce7]/5 p-2">
                  <span>{r.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-semibold text-gray-700">{r.role}</div>
                    <div className="text-[8px] text-gray-400">{r.desc}</div>
                  </div>
                  <span className="text-[10px] font-mono font-semibold text-[#6c5ce7]">{r.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SectionCard>

      {/* KPI 仪表盘 */}
      <SectionCard icon="📊" title="关键成功指标 (KPIs)" desc="三大维度的目标与现状对比">
        <div className="space-y-4">
          {kpis.map(cat => (
            <div key={cat.category}>
              <div className="text-[10px] font-semibold text-gray-600 mb-2">{cat.category}</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {cat.metrics.map(m => (
                  <div key={m.name} className="rounded-lg border border-gray-100 bg-gray-50/30 p-2.5">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">{m.icon}</span>
                        <span className="text-[10px] font-semibold text-gray-700">{m.name}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-[10px]">
                      <span className="text-gray-400 font-mono">现状: {m.current}</span>
                      <span className="text-gray-300">→</span>
                      <span className="text-[#3fb950] font-mono font-semibold">目标: {m.target}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Tab 5: 行业对标
// ═══════════════════════════════════════════════════════════════
function BenchmarkTab() {
  const { companies } = BENCHMARKS;

  return (
    <div className="space-y-4">
      <SectionCard icon="🏢" title="行业对标分析" desc="四家标杆企业的模式解析与借鉴">
        <div className="space-y-4">
          {companies.map(c => (
            <div key={c.name} className="rounded-xl border p-4" style={{ borderColor: c.color + '33', background: c.color + '04' }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{c.icon}</span>
                <span className="text-sm font-bold" style={{ color: c.color }}>{c.name}</span>
                <Badge color={c.color}>{c.model}</Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div>
                  <div className="text-[9px] font-semibold text-[#3fb950] mb-1">✅ 优势</div>
                  <div className="space-y-0.5">
                    {c.strengths.map(s => (
                      <div key={s} className="text-[10px] text-gray-500 flex items-start gap-1">
                        <span className="text-[#3fb950]">+</span> {s}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-[9px] font-semibold text-[#e17055] mb-1">⚠️ 劣势</div>
                  <div className="space-y-0.5">
                    {c.weaknesses.map(w => (
                      <div key={w} className="text-[10px] text-gray-500 flex items-start gap-1">
                        <span className="text-[#e17055]">-</span> {w}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-gray-100 bg-white/60 p-2">
                <span className="text-[9px] font-semibold text-gray-500">🎯 借鉴要点：</span>
                <span className="text-[10px] text-gray-600">{c.takeaway}</span>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* 综合对比矩阵 */}
      <SectionCard icon="📊" title="模式对比矩阵" desc="四种模式的核心维度对比">
        <div className="overflow-x-auto">
          <table className="w-full text-[10px]">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 px-2 text-gray-500 font-medium">维度</th>
                {companies.map(c => (
                  <th key={c.name} className="text-center py-2 px-2 font-medium" style={{ color: c.color }}>{c.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { dim: '核心壁垒', values: ['Ontology + 安全', '开源生态 + 数据', '客户基础 + 生态', '数据飞轮 + 硬件'] },
                { dim: 'AI 深度', values: ['⭐⭐⭐⭐⭐', '⭐⭐⭐⭐', '⭐⭐⭐', '⭐⭐⭐⭐⭐'] },
                { dim: '可复制性', values: ['低（重人力）', '高（开源）', '中（需客户基础）', '低（需硬件）'] },
                { dim: '适合我们', values: ['⭐⭐⭐⭐⭐', '⭐⭐⭐⭐', '⭐⭐⭐', '⭐⭐⭐⭐'] },
              ].map(row => (
                <tr key={row.dim} className="border-b border-gray-50">
                  <td className="py-2 px-2 font-semibold text-gray-600">{row.dim}</td>
                  {row.values.map((v, i) => (
                    <td key={i} className="py-2 px-2 text-center text-gray-500">{v}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 主组件
// ═══════════════════════════════════════════════════════════════
const TABS = [
  { id: 'crisis', label: '行业困境', icon: '⚠️', color: '#e17055', desc: 'AI Coding 时代的五大系统性冲击' },
  { id: 'breakout', label: '全球破局', icon: '🌍', color: '#3fb950', desc: '五大破局策略与标杆案例' },
  { id: 'palantir', label: 'Palantir 模式', icon: '🏛️', color: '#6c5ce7', desc: '决策操作系统的深度解析' },
  { id: 'framework', label: '应对框架', icon: '🏗️', color: '#326ce5', desc: '四层架构 + 路线图 + 团队转型' },
  { id: 'benchmark', label: '行业对标', icon: '📊', color: '#ffa657', desc: '四家标杆企业模式对比' },
];

export default function StrategyViz() {
  const [activeTab, setActiveTab] = useState('crisis');

  const tabContent = {
    crisis: <CrisisTab />,
    breakout: <BreakoutTab />,
    palantir: <PalantirTab />,
    framework: <FrameworkTab />,
    benchmark: <BenchmarkTab />,
  };

  return (
    <div>
      {/* Tab 导航 */}
      <div className="flex flex-wrap gap-2 mb-6 p-1.5 bg-gray-50 rounded-2xl border border-gray-100">
        {TABS.map(tab => (
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

      {/* Tab 标题 */}
      <div className="mb-5 flex items-center gap-2">
        <span className="text-lg">{TABS.find(t => t.id === activeTab)?.icon}</span>
        <div>
          <h2 className="text-base font-semibold text-gray-800">
            {TABS.find(t => t.id === activeTab)?.label}
          </h2>
          <p className="text-xs text-gray-400">
            {TABS.find(t => t.id === activeTab)?.desc}
          </p>
        </div>
      </div>

      {/* 内容区 */}
      {tabContent[activeTab]}
    </div>
  );
}
