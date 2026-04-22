'use client';

import { useState } from 'react';
import { INDUSTRY_CRISIS, GLOBAL_BREAKOUT, PALANTIR_DEEP_DIVE, RESPONSE_FRAMEWORK, SAAS_DELIVERY, FDE_BP_FLYWHEEL, EXTERNAL_MODEL_SECURITY, BENCHMARKS } from '@/lib/strategy-data';

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
  const { strategies, lastUpdated } = GLOBAL_BREAKOUT;
  const [activeStrategy, setActiveStrategy] = useState('palantir');
  const [showDeep, setShowDeep] = useState(false);

  const current = strategies.find(s => s.id === activeStrategy);

  const levelStyle = {
    hot:   { bg: '#e17055' + '18', color: '#e17055', label: '🔥 热点' },
    watch: { bg: '#ffa657' + '18', color: '#ffa657', label: '👀 关注' },
    note:  { bg: '#636e72' + '12', color: '#636e72', label: '📌 备注' },
  };

  return (
    <div className="space-y-4">
      {/* 更新时间提示 */}
      <div className="flex items-center gap-2 text-[11px] text-gray-400">
        <span>🕐</span>
        <span>最后更新：<span className="font-medium text-gray-500">{lastUpdated}</span></span>
        <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-amber-50 border border-amber-100 text-amber-600">
          💡 声浪信号需定期人工更新
        </span>
      </div>

      {/* 策略选择器 */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-gray-50 rounded-2xl border border-gray-100">
        {strategies.map(s => (
          <button key={s.id} onClick={() => { setActiveStrategy(s.id); setShowDeep(false); }}
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
        <>
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

          {/* 近期声浪信号 */}
          {current.signals && (
            <SectionCard icon="📡" title="近期声浪信号" desc="来自财报 / 产品发布 / 行业动态的最新信号">
              <div className="space-y-2">
                {current.signals.map((sig, i) => {
                  const style = levelStyle[sig.level] || levelStyle.note;
                  return (
                    <div key={i} className="flex items-start gap-3 rounded-xl border border-gray-100 bg-white/60 p-3 hover:bg-gray-50/60 transition-colors">
                      <div className="flex flex-col items-center gap-1 flex-shrink-0 pt-0.5">
                        <span className="text-[9px] font-mono text-gray-400">{sig.date}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                          style={{ background: style.bg, color: style.color }}>{style.label}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
                            style={{ background: current.color + '15', color: current.color }}>{sig.tag}</span>
                        </div>
                        <p className="text-xs text-gray-700 leading-relaxed">{sig.text}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </SectionCard>
          )}

          {/* 深度展开（折叠） */}
          {current.deepDive && (
            <div className="rounded-2xl border overflow-hidden" style={{ borderColor: current.color + '33' }}>
              <button
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50/60 transition-colors"
                onClick={() => setShowDeep(!showDeep)}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">🔬</span>
                  <span className="text-sm font-semibold text-gray-800">深度展开</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full"
                    style={{ background: current.color + '15', color: current.color }}>
                    为什么 · 风险 · 机会 · 关注指标
                  </span>
                </div>
                <span className="text-gray-300 text-sm">{showDeep ? '▲' : '▼'}</span>
              </button>
              {showDeep && (
                <div className="px-4 pb-4 border-t space-y-4" style={{ borderColor: current.color + '22', background: current.color + '03' }}>
                  {/* 为什么有效 */}
                  <div className="pt-4">
                    <div className="text-[10px] font-semibold text-gray-500 mb-2">🧠 为什么这个模式有效</div>
                    <p className="text-xs text-gray-700 leading-relaxed bg-white/70 rounded-xl border border-gray-100 p-3">
                      {current.deepDive.why}
                    </p>
                  </div>
                  {/* 风险 & 机会 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <div className="text-[10px] font-semibold text-[#e17055] mb-2">⚠️ 主要风险</div>
                      <div className="space-y-1.5">
                        {current.deepDive.risks.map((r, i) => (
                          <div key={i} className="flex items-start gap-2 text-[11px] text-gray-600 bg-red-50/40 rounded-lg border border-red-100/60 p-2">
                            <span className="text-[#e17055] flex-shrink-0 mt-0.5">•</span>
                            <span>{r}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-semibold text-[#3fb950] mb-2">🚀 核心机会</div>
                      <div className="space-y-1.5">
                        {current.deepDive.opportunities.map((o, i) => (
                          <div key={i} className="flex items-start gap-2 text-[11px] text-gray-600 bg-green-50/40 rounded-lg border border-green-100/60 p-2">
                            <span className="text-[#3fb950] flex-shrink-0 mt-0.5">•</span>
                            <span>{o}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  {/* 关注指标 */}
                  <div>
                    <div className="text-[10px] font-semibold text-gray-500 mb-2">📊 需要持续关注的指标</div>
                    <div className="flex flex-wrap gap-2">
                      {current.deepDive.watchMetrics.map((m, i) => (
                        <span key={i} className="text-[11px] px-2.5 py-1 rounded-full border font-medium"
                          style={{ borderColor: current.color + '44', color: current.color, background: current.color + '0c' }}>
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Tab 3: Palantir 模式深度解析
// ═══════════════════════════════════════════════════════════════
function PalantirTab() {
  const { products, moats, codeAsProxy, financials } = PALANTIR_DEEP_DIVE;

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

      {/* Code as Proxy */}
      <SectionCard icon="🧩" title={codeAsProxy.title} desc={codeAsProxy.desc}>
        {/* 核心理念 */}
        <div className="rounded-xl border border-[#6c5ce7]/30 bg-[#6c5ce7]/05 p-4 mb-4">
          <div className="text-[10px] font-mono font-bold text-[#6c5ce7] mb-2">"{codeAsProxy.tagline}"</div>
          <p className="text-xs text-gray-600 leading-relaxed">{codeAsProxy.principle}</p>
        </div>

        {/* 传统 vs Code as Proxy */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div className="rounded-xl border border-[#e17055]/30 bg-[#e17055]/05 p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-base">❌</span>
              <span className="text-xs font-bold text-[#e17055]">{codeAsProxy.vsTraditional.traditional.label}</span>
            </div>
            <div className="text-[10px] font-mono text-gray-600 mb-1">{codeAsProxy.vsTraditional.traditional.flow}</div>
            <div className="text-[9px] text-[#e17055]">⚠️ {codeAsProxy.vsTraditional.traditional.risk}</div>
          </div>
          <div className="rounded-xl border border-[#3fb950]/30 bg-[#3fb950]/05 p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-base">✅</span>
              <span className="text-xs font-bold text-[#3fb950]">{codeAsProxy.vsTraditional.proxy.label}</span>
            </div>
            <div className="text-[10px] font-mono text-gray-600">{codeAsProxy.vsTraditional.proxy.flow}</div>
          </div>
        </div>

        {/* 四层架构 */}
        <div className="mb-4">
          <div className="text-[10px] font-semibold text-gray-600 mb-2">🏗️ AIP 四层执行架构</div>
          <div className="space-y-1.5">
            {codeAsProxy.layers.map((l, i) => (
              <div key={l.layer} className="flex items-center gap-2 rounded-lg border border-gray-100 bg-white/80 p-2.5">
                <div className="w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
                  style={{ background: l.color }}>{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-semibold text-gray-700">{l.layer}</span>
                  <span className="text-[9px] font-mono text-gray-400 ml-2">({l.role})</span>
                  <div className="text-[9px] text-gray-500 mt-0.5">{l.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 为什么重要 */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {codeAsProxy.why.map(w => (
            <div key={w.point} className="rounded-lg border border-gray-100 bg-gray-50/30 p-2.5">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-base">{w.icon}</span>
                <span className="text-[10px] font-semibold text-gray-700">{w.point}</span>
              </div>
              <p className="text-[9px] text-gray-500 leading-relaxed">{w.desc}</p>
            </div>
          ))}
        </div>

        {/* 战略影响 */}
        <div className="rounded-xl border border-[#ffa657]/30 bg-[#ffa657]/05 p-3">
          <div className="flex items-start gap-2">
            <span className="text-base flex-shrink-0">🏆</span>
            <p className="text-[10px] text-gray-700 leading-relaxed">{codeAsProxy.impact}</p>
          </div>
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
// Tab 6: FDE × 交付飞轮
// ═══════════════════════════════════════════════════════════════
function FlywheelTab() {
  const { roleComparison, deliveryFlywheel, fdeTeamBuilding } = FDE_BP_FLYWHEEL;
  const [activeRole, setActiveRole] = useState('fde');
  const [expandedAccelerator, setExpandedAccelerator] = useState(null);

  const currentRole = roleComparison.roles.find(r => r.id === activeRole);

  return (
    <div className="space-y-4">
      {/* FDE vs BP 角色对比 */}
      <SectionCard icon="👥" title={roleComparison.title} desc={roleComparison.desc}>
        {/* 角色切换 */}
        <div className="flex gap-2 mb-4 p-1.5 bg-gray-50 rounded-2xl border border-gray-100">
          {roleComparison.roles.map(r => (
            <button key={r.id} onClick={() => setActiveRole(r.id)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-medium transition-all"
              style={activeRole === r.id
                ? { background: '#fff', color: r.color, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: `1px solid ${r.color}33` }
                : { color: '#94a3b8' }}>
              <span>{r.icon}</span>
              <span>{r.id === 'fde' ? 'FDE（前线工程师）' : '业务 BP'}</span>
            </button>
          ))}
        </div>

        {currentRole && (
          <div className="rounded-xl border p-4 mb-4" style={{ borderColor: currentRole.color + '33', background: currentRole.color + '04' }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{currentRole.icon}</span>
              <div>
                <div className="text-sm font-bold" style={{ color: currentRole.color }}>{currentRole.name}</div>
                <div className="text-[9px] text-gray-400">源自 {currentRole.origin} · {currentRole.tagline}</div>
              </div>
            </div>
            <p className="text-[10px] text-gray-500 mb-3">{currentRole.definition}</p>

            {/* 关键特质 */}
            <div className="space-y-1.5 mb-3">
              <div className="text-[10px] font-semibold text-gray-600">📊 关键能力维度</div>
              {currentRole.keyTraits.map(t => (
                <div key={t.trait} className="flex items-center gap-2 rounded-lg border border-gray-100 bg-white/80 p-2">
                  <span className="text-[10px] font-semibold text-gray-700 w-20 flex-shrink-0">{t.trait}</span>
                  <span className="text-[10px] text-gray-500 flex-1">{t.desc}</span>
                  <span className="text-[10px] flex-shrink-0">{t.level}</span>
                </div>
              ))}
            </div>

            {/* 一天的工作 */}
            <div className="mb-3">
              <div className="text-[10px] font-semibold text-gray-600 mb-1.5">🕐 典型的一天</div>
              <div className="space-y-1">
                {currentRole.dayInLife.map((d, i) => (
                  <div key={i} className="flex items-start gap-2 text-[10px] text-gray-500">
                    <span className="text-gray-300 mt-0.5">•</span>
                    <span>{d}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 反模式 */}
            <div>
              <div className="text-[10px] font-semibold text-gray-600 mb-1.5">🚫 常见误区</div>
              <div className="space-y-1">
                {currentRole.antiPatterns.map((a, i) => (
                  <div key={i} className="text-[10px] text-gray-500">{a}</div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 核心差异对比表 */}
        <div className="mb-4">
          <div className="text-[10px] font-semibold text-gray-600 mb-2">⚖️ FDE vs 业务 BP 核心差异</div>
          <div className="overflow-x-auto">
            <table className="w-full text-[10px]">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 px-2 text-gray-500 font-medium">维度</th>
                  <th className="text-center py-2 px-2 font-medium text-[#6c5ce7]">🪖 FDE</th>
                  <th className="text-center py-2 px-2 font-medium text-[#3fb950]">🤝 业务 BP</th>
                </tr>
              </thead>
              <tbody>
                {roleComparison.comparison.map(row => (
                  <tr key={row.dimension} className="border-b border-gray-50">
                    <td className="py-2 px-2 font-semibold text-gray-600">{row.dimension}</td>
                    <td className={`py-2 px-2 text-center ${row.winner === 'fde' ? 'font-semibold text-[#6c5ce7]' : 'text-gray-500'}`}>{row.fde}</td>
                    <td className={`py-2 px-2 text-center ${row.winner === 'bp' ? 'font-semibold text-[#3fb950]' : 'text-gray-500'}`}>{row.bp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 进化方向 */}
        <div className="rounded-xl border p-4" style={{ borderColor: roleComparison.evolution.color + '33', background: roleComparison.evolution.color + '04' }}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">{roleComparison.evolution.icon}</span>
            <div>
              <div className="text-sm font-bold" style={{ color: roleComparison.evolution.color }}>{roleComparison.evolution.title}</div>
              <div className="text-[9px] text-gray-400">{roleComparison.evolution.desc}</div>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            {roleComparison.evolution.stages.map((s, i) => (
              <div key={s.name} className="flex items-center gap-1">
                <div className="rounded-lg border p-2 text-center min-w-[100px]" style={{ borderColor: s.color + '33', background: s.color + '08' }}>
                  <div className="text-lg mb-0.5">{s.icon}</div>
                  <div className="text-[9px] font-semibold" style={{ color: s.color }}>{s.name}</div>
                  <div className="text-[8px] text-gray-400">{s.desc}</div>
                  <div className="text-[10px] font-bold font-mono mt-1" style={{ color: s.color }}>{s.efficiency}</div>
                </div>
                {i < roleComparison.evolution.stages.length - 1 && (
                  <span className="text-gray-300 text-sm">→</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </SectionCard>

      {/* 交付飞轮模型 */}
      <SectionCard icon="🔄" title={deliveryFlywheel.title} desc={deliveryFlywheel.desc}>
        {/* 飞轮四阶段 */}
        <div className="space-y-3 mb-4">
          {deliveryFlywheel.stages.map((stage, idx) => (
            <div key={stage.id}>
              <div className="rounded-xl border p-4" style={{ borderColor: stage.color + '33', background: stage.color + '04' }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{stage.icon}</span>
                    <div>
                      <div className="text-sm font-bold" style={{ color: stage.color }}>
                        {idx + 1}. {stage.name}
                      </div>
                      <div className="text-[9px] text-gray-400 font-mono">{stage.subtitle}</div>
                    </div>
                  </div>
                  <Badge color={stage.color}>{stage.duration}</Badge>
                </div>
                <p className="text-[10px] text-gray-500 mb-3">{stage.desc}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <div>
                    <div className="text-[9px] font-semibold text-gray-500 mb-1">📥 输入</div>
                    <div className="space-y-0.5">
                      {stage.inputs.map(inp => (
                        <div key={inp} className="text-[10px] text-gray-500 flex items-start gap-1">
                          <span className="text-gray-300">→</span> {inp}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] font-semibold text-gray-500 mb-1">📤 输出</div>
                    <div className="space-y-0.5">
                      {stage.outputs.map(out => (
                        <div key={out} className="text-[10px] text-gray-500 flex items-start gap-1">
                          <span style={{ color: stage.color }}>←</span> {out}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-1 mb-3">
                  <div className="text-[9px] font-semibold text-gray-500">🎯 关键动作</div>
                  {stage.keyActions.map((a, i) => (
                    <div key={i} className="flex items-start gap-2 text-[10px] text-gray-500">
                      <span className="text-gray-300 mt-0.5">•</span>
                      <span>{a}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2">
                  {stage.metrics.map(m => (
                    <div key={m.label} className="rounded-lg border border-gray-100 bg-white/60 p-2 text-center">
                      <div className="text-xs font-bold font-mono" style={{ color: stage.color }}>{m.value}</div>
                      <div className="text-[8px] text-gray-400">{m.label}</div>
                    </div>
                  ))}
                </div>
              </div>
              {idx < deliveryFlywheel.stages.length - 1 && (
                <div className="text-center text-gray-300 py-1 text-lg">⬇</div>
              )}
            </div>
          ))}
          {/* 飞轮闭环箭头 */}
          <div className="text-center rounded-xl border border-dashed border-[#ffa657]/40 bg-[#ffa657]/5 p-3">
            <span className="text-sm">🔄</span>
            <span className="text-[10px] text-[#ffa657] font-semibold ml-2">规模化产出反哺嵌入阶段 → 飞轮持续加速</span>
          </div>
        </div>

        {/* 飞轮加速器 */}
        <div className="mb-4">
          <div className="text-[10px] font-semibold text-gray-600 mb-2">🚀 飞轮加速器</div>
          <div className="space-y-3">
            {deliveryFlywheel.accelerators.map(acc => (
              <div key={acc.name} className="rounded-xl border p-4 cursor-pointer transition-all hover:shadow-sm"
                style={{ borderColor: acc.color + '33', background: acc.color + '04' }}
                onClick={() => setExpandedAccelerator(expandedAccelerator === acc.name ? null : acc.name)}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{acc.icon}</span>
                    <span className="text-xs font-bold text-gray-800">{acc.name}</span>
                  </div>
                  <span className="text-xs text-gray-400">{expandedAccelerator === acc.name ? '收起 ▲' : '展开 ▼'}</span>
                </div>
                <p className="text-[10px] text-gray-500">{acc.desc}</p>
                {expandedAccelerator === acc.name && (
                  <div className="mt-2 space-y-1">
                    {acc.examples.map((ex, i) => (
                      <div key={i} className="flex items-start gap-2 text-[10px] text-gray-500">
                        <span className="text-gray-300 mt-0.5">•</span>
                        <span>{ex}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 飞轮效果量化 */}
        <div>
          <div className="text-[10px] font-semibold text-gray-600 mb-2">📈 {deliveryFlywheel.flywheelMetrics.title}</div>
          <div className="overflow-x-auto">
            <table className="w-full text-[10px]">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 px-2 text-gray-500 font-medium">轮次</th>
                  <th className="text-center py-2 px-2 font-medium text-gray-500">业务线</th>
                  <th className="text-center py-2 px-2 font-medium text-gray-500">FDE 人数</th>
                  <th className="text-center py-2 px-2 font-medium text-gray-500">交付周期</th>
                  <th className="text-center py-2 px-2 font-medium text-gray-500">平台模块</th>
                  <th className="text-center py-2 px-2 font-medium text-[#3fb950]">复用率</th>
                  <th className="text-left py-2 px-2 font-medium text-gray-500">说明</th>
                </tr>
              </thead>
              <tbody>
                {deliveryFlywheel.flywheelMetrics.rounds.map(r => (
                  <tr key={r.round} className="border-b border-gray-50">
                    <td className="py-2 px-2 font-semibold text-[#6c5ce7]">{r.round}</td>
                    <td className="py-2 px-2 text-center text-gray-600">{r.bizLines}</td>
                    <td className="py-2 px-2 text-center text-gray-600">{r.fdeCount}</td>
                    <td className="py-2 px-2 text-center font-mono text-gray-600">{r.deliveryCycle}</td>
                    <td className="py-2 px-2 text-center text-gray-600">{r.platformModules}</td>
                    <td className="py-2 px-2 text-center font-semibold text-[#3fb950]">{r.reuse}</td>
                    <td className="py-2 px-2 text-gray-500">{r.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </SectionCard>

      {/* FDE 团队建设 */}
      <SectionCard icon="🏗️" title={fdeTeamBuilding.title} desc={fdeTeamBuilding.desc}>
        {/* 人才画像 */}
        <div className="mb-4">
          <div className="text-[10px] font-semibold text-gray-600 mb-2">🎯 {fdeTeamBuilding.talentProfile.title}</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
            {fdeTeamBuilding.talentProfile.must.map(t => (
              <div key={t.trait} className="flex items-start gap-2 rounded-lg border border-[#e17055]/20 bg-[#e17055]/5 p-2">
                <span className="text-sm flex-shrink-0">{t.icon}</span>
                <div>
                  <div className="text-[10px] font-semibold text-gray-700">{t.trait} <span className="text-[#e17055]">*必须</span></div>
                  <div className="text-[9px] text-gray-500">{t.desc}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {fdeTeamBuilding.talentProfile.nice.map(t => (
              <div key={t.trait} className="flex items-start gap-2 rounded-lg border border-gray-100 bg-gray-50/30 p-2">
                <span className="text-sm flex-shrink-0">{t.icon}</span>
                <div>
                  <div className="text-[10px] font-semibold text-gray-700">{t.trait} <span className="text-gray-400">加分</span></div>
                  <div className="text-[9px] text-gray-500">{t.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 职业发展路径 */}
        <div className="mb-4">
          <div className="text-[10px] font-semibold text-gray-600 mb-2">📈 {fdeTeamBuilding.careerPath.title}</div>
          <div className="space-y-2">
            {fdeTeamBuilding.careerPath.levels.map((l, i) => (
              <div key={l.level} className="flex items-center gap-3">
                <div className="w-6 flex-shrink-0 flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full border-2" style={{ borderColor: l.color, background: l.color + '30' }} />
                  {i < fdeTeamBuilding.careerPath.levels.length - 1 && <div className="w-0.5 h-8 bg-gray-100" />}
                </div>
                <div className="flex-1 rounded-xl border p-3" style={{ borderColor: l.color + '33', background: l.color + '04' }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold" style={{ color: l.color }}>{l.level}</span>
                    <Badge color={l.color}>{l.duration}</Badge>
                  </div>
                  <div className="text-[10px] text-gray-500">{l.desc}</div>
                  <div className="text-[9px] text-gray-400 mt-1">🎯 聚焦：{l.focus}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 运营模式 */}
        <div>
          <div className="text-[10px] font-semibold text-gray-600 mb-2">⚙️ {fdeTeamBuilding.operatingModel.title}</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {fdeTeamBuilding.operatingModel.principles.map(p => (
              <div key={p.name} className="flex items-start gap-2 rounded-lg border border-gray-100 bg-gray-50/30 p-2.5">
                <span className="text-lg flex-shrink-0">{p.icon}</span>
                <div>
                  <div className="text-[10px] font-semibold text-gray-700">{p.name}</div>
                  <div className="text-[9px] text-gray-500">{p.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Tab 7: 交付形态
// ═══════════════════════════════════════════════════════════════
function DeliveryTab() {
  const { sharedPlatformProblems, blastRadiusAnalysis, deliveryEvolution, deliveryFramework, realWorldLessons } = SAAS_DELIVERY;
  const [expandedProblem, setExpandedProblem] = useState(null);
  const [expandedCase, setExpandedCase] = useState(null);

  return (
    <div className="space-y-4">
      {/* 大一统 SaaS 的六大困境 */}
      <SectionCard icon="🏢" title={sharedPlatformProblems.title} desc={sharedPlatformProblems.desc}>
        <div className="space-y-3">
          {sharedPlatformProblems.problems.map(p => (
            <div key={p.id} className="rounded-xl border p-4 cursor-pointer transition-all hover:shadow-sm"
              style={{ borderColor: p.color + '33', background: p.color + '04' }}
              onClick={() => setExpandedProblem(expandedProblem === p.id ? null : p.id)}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{p.icon}</span>
                  <span className="text-sm font-bold text-gray-800">{p.name}</span>
                  <Badge color={p.color}>{p.severity}</Badge>
                </div>
                <span className="text-xs text-gray-400">{expandedProblem === p.id ? '收起 ▲' : '展开 ▼'}</span>
              </div>
              <p className="text-[10px] text-gray-500 mb-2">{p.desc}</p>

              {expandedProblem === p.id && (
                <div className="mt-3 space-y-3 animate-fadeIn">
                  <div>
                    <div className="text-[10px] font-semibold text-gray-600 mb-1.5">📋 典型案例</div>
                    <div className="space-y-1">
                      {p.cases.map((c, i) => (
                        <div key={i} className="flex items-start gap-2 text-[10px] text-gray-500">
                          <span className="text-gray-300 mt-0.5">•</span>
                          <span>{c}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-semibold text-gray-600 mb-1.5">📊 关键指标</div>
                    <div className="flex flex-wrap gap-2">
                      {p.metrics.map(m => (
                        <div key={m.label} className="rounded-lg border border-gray-100 bg-white/60 p-2 text-center">
                          <div className="text-xs font-bold font-mono" style={{ color: p.color }}>{m.value}{m.unit ? ' ' + m.unit : ''}</div>
                          <div className="text-[8px] text-gray-400">{m.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </SectionCard>

      {/* 爆炸半径深度分析 */}
      <SectionCard icon="💥" title={blastRadiusAnalysis.title} desc={blastRadiusAnalysis.desc}>
        <div className="space-y-4">
          {blastRadiusAnalysis.dimensions.map(dim => (
            <div key={dim.name} className="rounded-xl border p-4" style={{ borderColor: dim.color + '33', background: dim.color + '04' }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">{dim.icon}</span>
                <span className="text-sm font-bold" style={{ color: dim.color }}>{dim.name}</span>
              </div>
              <div className="space-y-1.5">
                {dim.layers.map((l, i) => (
                  <div key={l.name} className="flex items-center gap-2 rounded-lg border border-gray-100 bg-white/80 p-2.5">
                    <div className="w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
                      style={{ background: dim.color }}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] font-semibold text-gray-700">{l.name}</span>
                        <Badge color={dim.color}>{l.risk}</Badge>
                      </div>
                      <div className="text-[10px] text-gray-500">{l.desc}</div>
                    </div>
                    <div className="text-[9px] text-gray-400 flex-shrink-0 max-w-[120px] text-right">
                      🛡️ {l.isolation}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* 软件交付形态演进 */}
      <SectionCard icon="📐" title={deliveryEvolution.title} desc={deliveryEvolution.desc}>
        <div className="space-y-3">
          {deliveryEvolution.stages.map((stage, idx) => (
            <div key={stage.id}>
              <div className="rounded-xl border p-4" style={{ borderColor: stage.color + '33', background: stage.color + '04' }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{stage.icon}</span>
                    <div>
                      <div className="text-sm font-bold" style={{ color: stage.color }}>{stage.name}</div>
                      <div className="text-[9px] text-gray-400 font-mono">{stage.subtitle}</div>
                    </div>
                  </div>
                  <Badge color={stage.color}>{stage.era}</Badge>
                </div>
                <p className="text-[10px] text-gray-500 mb-3">{stage.desc}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <div>
                    <div className="text-[9px] font-semibold text-[#3fb950] mb-1">✅ 优势</div>
                    <div className="space-y-0.5">
                      {stage.pros.map(p => (
                        <div key={p} className="text-[10px] text-gray-500 flex items-start gap-1">
                          <span className="text-[#3fb950]">+</span> {p}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] font-semibold text-[#e17055] mb-1">⚠️ 劣势</div>
                    <div className="space-y-0.5">
                      {stage.cons.map(c => (
                        <div key={c} className="text-[10px] text-gray-500 flex items-start gap-1">
                          <span className="text-[#e17055]">-</span> {c}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 text-[10px]">
                  <div className="flex items-center gap-1">
                    <span className="text-gray-400">💥 爆炸半径:</span>
                    <span className="font-semibold" style={{ color: stage.color }}>{stage.blastRadius}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-400">🔓 自治度:</span>
                    <span>{stage.autonomy}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-400">📈 可扩展性:</span>
                    <span>{stage.scalability}</span>
                  </div>
                </div>
                <div className="mt-2 rounded-lg border border-gray-100 bg-white/60 p-2">
                  <span className="text-[9px] text-gray-400">🎯 适用场景：</span>
                  <span className="text-[10px] text-gray-600">{stage.bestFor}</span>
                </div>
              </div>
              {idx < deliveryEvolution.stages.length - 1 && (
                <div className="text-center text-gray-300 py-1 text-lg">⬇</div>
              )}
            </div>
          ))}
        </div>
      </SectionCard>

      {/* 交付形态决策框架 */}
      <SectionCard icon="🧭" title={deliveryFramework.title} desc={deliveryFramework.subtitle}>
        {/* 四大原则 */}
        <div className="space-y-3 mb-4">
          {deliveryFramework.principles.map(p => (
            <div key={p.name} className="rounded-xl border p-4" style={{ borderColor: p.color + '33', background: p.color + '04' }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{p.icon}</span>
                <span className="text-xs font-bold text-gray-800">{p.name}</span>
              </div>
              <p className="text-[10px] text-gray-500 mb-2">{p.desc}</p>
              <div className="space-y-1">
                {p.practices.map((pr, i) => (
                  <div key={i} className="flex items-start gap-2 text-[10px] text-gray-500">
                    <span className="text-gray-300 mt-0.5">•</span>
                    <span>{pr}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* 决策矩阵 */}
        <div className="mb-4">
          <div className="text-[10px] font-semibold text-gray-600 mb-2">📊 决策矩阵</div>
          <div className="overflow-x-auto">
            <table className="w-full text-[10px]">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 px-2 text-gray-500 font-medium">维度</th>
                  <th className="text-center py-2 px-2 font-medium text-[#636e72]">大一统</th>
                  <th className="text-center py-2 px-2 font-medium text-[#326ce5]">微服务</th>
                  <th className="text-center py-2 px-2 font-medium text-[#6c5ce7]">领域平台</th>
                  <th className="text-center py-2 px-2 font-medium text-[#3fb950]">嵌入式</th>
                </tr>
              </thead>
              <tbody>
                {deliveryFramework.decisionMatrix.map(row => (
                  <tr key={row.dimension} className="border-b border-gray-50">
                    <td className="py-2 px-2 font-semibold text-gray-600">{row.dimension}</td>
                    <td className="py-2 px-2 text-center text-gray-500">{row.monolith}</td>
                    <td className="py-2 px-2 text-center text-gray-500">{row.microservice}</td>
                    <td className="py-2 px-2 text-center text-gray-500">{row.domain}</td>
                    <td className="py-2 px-2 text-center text-gray-500">{row.embedded}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 推荐演进路径 */}
        <div>
          <div className="text-[10px] font-semibold text-gray-600 mb-1">{deliveryFramework.recommendedPath.title}</div>
          <div className="text-[9px] text-gray-400 mb-3">{deliveryFramework.recommendedPath.desc}</div>
          <div className="space-y-3">
            {deliveryFramework.recommendedPath.steps.map((step, i) => (
              <div key={step.phase}>
                <div className="rounded-xl border p-4" style={{ borderColor: step.color + '33', background: step.color + '04' }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{step.icon}</span>
                      <span className="text-sm font-bold" style={{ color: step.color }}>{step.phase}: {step.name}</span>
                    </div>
                    <Badge color={step.color}>{step.duration}</Badge>
                  </div>
                  <div className="space-y-1">
                    {step.actions.map((a, j) => (
                      <div key={j} className="flex items-start gap-2 text-[10px] text-gray-500">
                        <span className="text-gray-300 mt-0.5">•</span>
                        <span>{a}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {i < deliveryFramework.recommendedPath.steps.length - 1 && (
                  <div className="text-center text-gray-300 py-1 text-xs">↓</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </SectionCard>

      {/* 真实案例与教训 */}
      <SectionCard icon="📖" title={realWorldLessons.title} desc="他山之石，可以攻玉">
        <div className="space-y-3">
          {realWorldLessons.cases.map(c => (
            <div key={c.name} className="rounded-xl border p-4 cursor-pointer transition-all hover:shadow-sm"
              style={{ borderColor: c.color + '33', background: c.color + '04' }}
              onClick={() => setExpandedCase(expandedCase === c.name ? null : c.name)}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{c.icon}</span>
                  <span className="text-sm font-bold text-gray-800">{c.name}</span>
                </div>
                <span className="text-xs text-gray-400">{expandedCase === c.name ? '收起 ▲' : '展开 ▼'}</span>
              </div>
              <p className="text-[10px] text-gray-500 mb-2">{c.scenario}</p>

              {expandedCase === c.name && (
                <div className="mt-3 space-y-3 animate-fadeIn">
                  <div>
                    <div className="text-[10px] font-semibold text-[#e17055] mb-1.5">⚠️ 遇到的问题</div>
                    <div className="space-y-1">
                      {c.problems.map((p, i) => (
                        <div key={i} className="flex items-start gap-2 text-[10px] text-gray-500">
                          <span className="text-[#e17055]">•</span>
                          <span>{p}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-lg border border-gray-100 bg-white/60 p-3">
                    <span className="text-[9px] font-semibold text-[#3fb950]">💡 核心教训：</span>
                    <span className="text-[10px] text-gray-600">{c.lesson}</span>
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
// Tab 8: 外部模型安全
// ═══════════════════════════════════════════════════════════════
function SecurityTab() {
  const { coreProblem, riskLandscape, dataClassification, technicalArchitecture, providerComparison, recommendedApproach, costBenefitAnalysis, industryPractices, codeIsolation, keyConclusions } = EXTERNAL_MODEL_SECURITY;
  const [expandedRisk, setExpandedRisk] = useState(null);
  const [expandedProvider, setExpandedProvider] = useState(null);

  return (
    <div className="space-y-4">
      {/* 核心问题定义 */}
      <SectionCard icon="🎯" title={coreProblem.title} desc={coreProblem.desc}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          {coreProblem.stakeholders.map(s => (
            <div key={s.role} className="rounded-xl border border-gray-100 bg-gray-50/30 p-3 text-center">
              <div className="text-xl mb-1">{s.icon}</div>
              <div className="text-[10px] font-semibold text-gray-700">{s.role}</div>
              <div className="text-[9px] text-gray-400 mt-0.5">{s.concern}</div>
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-[#3fb950]/30 bg-[#3fb950]/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">💡</span>
            <span className="text-sm font-bold text-[#3fb950]">{coreProblem.verdict.summary}</span>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">{coreProblem.verdict.explanation}</p>
        </div>
      </SectionCard>

      {/* 风险全景图 */}
      <SectionCard icon="⚠️" title={riskLandscape.title} desc={riskLandscape.desc}>
        <div className="space-y-3">
          {riskLandscape.risks.map(r => (
            <div key={r.id} className="rounded-xl border p-4 cursor-pointer transition-all hover:shadow-sm"
              style={{ borderColor: r.color + '33', background: r.color + '04' }}
              onClick={() => setExpandedRisk(expandedRisk === r.id ? null : r.id)}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{r.icon}</span>
                  <span className="text-sm font-bold text-gray-800">{r.name}</span>
                  <Badge color={r.color}>{r.severity}</Badge>
                </div>
                <span className="text-xs text-gray-400">{expandedRisk === r.id ? '收起 ▲' : '展开 ▼'}</span>
              </div>
              <p className="text-[10px] text-gray-500 mb-2">{r.desc}</p>

              {expandedRisk === r.id && (
                <div className="mt-3 space-y-4 animate-fadeIn">
                  {/* 风险场景 */}
                  <div>
                    <div className="text-[10px] font-semibold text-gray-600 mb-1.5">🎯 典型风险场景</div>
                    <div className="space-y-1">
                      {r.scenarios.map((s, i) => (
                        <div key={i} className="flex items-start gap-2 text-[10px] text-gray-500">
                          <span className="text-gray-300 mt-0.5">•</span>
                          <span>{s}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* 真实案例 */}
                  {r.realCases && (
                    <div>
                      <div className="text-[10px] font-semibold text-[#e17055] mb-1.5">📰 真实案例</div>
                      <div className="space-y-2">
                        {r.realCases.map((c, i) => (
                          <div key={i} className="rounded-lg border border-gray-100 bg-white/80 p-2.5">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[9px] font-mono text-gray-400">{c.date}</span>
                              <span className="text-[10px] font-semibold text-gray-700">{c.event}</span>
                            </div>
                            <div className="text-[9px] text-gray-400">💥 影响：{c.impact}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* 缓解措施 */}
                  <div>
                    <div className="text-[10px] font-semibold text-[#3fb950] mb-1.5">🛡️ 缓解措施</div>
                    <div className="space-y-1.5">
                      {r.mitigations.map((m, i) => (
                        <div key={i} className="flex items-center gap-2 rounded-lg border border-gray-100 bg-white/80 p-2">
                          <div className="flex-1 min-w-0">
                            <span className="text-[10px] font-semibold text-gray-700">{m.name}</span>
                            <span className="text-[10px] text-gray-500 ml-2">{m.desc}</span>
                          </div>
                          <span className="text-[10px] flex-shrink-0">{m.effectiveness}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </SectionCard>

      {/* 数据分级管控体系 */}
      <SectionCard icon="📊" title={dataClassification.title} desc={dataClassification.desc}>
        <div className="space-y-3">
          {dataClassification.levels.map(l => (
            <div key={l.level} className="rounded-xl border p-4" style={{ borderColor: l.color + '33', background: l.color + '04' }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{l.icon}</span>
                <span className="text-sm font-bold" style={{ color: l.color }}>{l.level}: {l.name}</span>
                <Badge color={l.color}>{l.modelAccess}</Badge>
              </div>
              <p className="text-[10px] text-gray-500 mb-3">{l.desc}</p>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {l.examples.map(e => (
                  <span key={e} className="text-[9px] px-1.5 py-0.5 rounded-full border"
                    style={{ borderColor: l.color + '44', color: l.color, background: l.color + '0c' }}>{e}</span>
                ))}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="rounded-lg border border-gray-100 bg-white/60 p-2">
                  <span className="text-[9px] text-gray-400">📋 管控策略：</span>
                  <span className="text-[10px] text-gray-600">{l.policy}</span>
                </div>
                <div className="rounded-lg border border-gray-100 bg-white/60 p-2">
                  <span className="text-[9px] text-gray-400">🔍 审计要求：</span>
                  <span className="text-[10px] text-gray-600">{l.auditLevel}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* 技术管控架构 */}
      <SectionCard icon="🏗️" title={technicalArchitecture.title} desc={technicalArchitecture.desc}>
        <div className="space-y-4">
          {technicalArchitecture.layers.map((layer, idx) => (
            <div key={layer.name}>
              <div className="rounded-xl border p-4" style={{ borderColor: layer.color + '33', background: layer.color + '04' }}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">{layer.icon}</span>
                  <div>
                    <div className="text-sm font-bold" style={{ color: layer.color }}>{layer.name}</div>
                    <div className="text-[9px] text-gray-400">{layer.desc}</div>
                  </div>
                </div>
                <div className="space-y-2">
                  {layer.components.map((c, i) => (
                    <div key={c.name} className="flex items-center gap-2 rounded-lg border border-gray-100 bg-white/80 p-2.5">
                      <div className="w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
                        style={{ background: layer.color }}>
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[10px] font-semibold text-gray-700">{c.name}</span>
                          <span className="text-[8px] font-mono text-gray-400">{c.tech}</span>
                        </div>
                        <div className="text-[10px] text-gray-500">{c.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {idx < technicalArchitecture.layers.length - 1 && (
                <div className="text-center text-gray-300 py-1 text-sm">⬇</div>
              )}
            </div>
          ))}
        </div>
      </SectionCard>

      {/* 模型提供商安全对比 */}
      <SectionCard icon="🔐" title={providerComparison.title} desc={providerComparison.desc}>
        <div className="space-y-3">
          {providerComparison.providers.map(p => (
            <div key={p.name} className="rounded-xl border p-4 cursor-pointer transition-all hover:shadow-sm"
              style={{ borderColor: p.color + '33', background: p.color + '04' }}
              onClick={() => setExpandedProvider(expandedProvider === p.name ? null : p.name)}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{p.icon}</span>
                  <span className="text-sm font-bold" style={{ color: p.color }}>{p.name}</span>
                  <Badge color={p.color}>{p.tier}</Badge>
                </div>
                <span className="text-xs text-gray-400">{expandedProvider === p.name ? '收起 ▲' : '展开 ▼'}</span>
              </div>
              <p className="text-[10px] text-gray-500 mb-2">{p.verdict}</p>

              {expandedProvider === p.name && (
                <div className="mt-3 space-y-1.5 animate-fadeIn">
                  {Object.entries(p.features).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between rounded-lg border border-gray-100 bg-white/80 p-2">
                      <span className="text-[10px] text-gray-500">{providerComparison.featureLabels[key]}</span>
                      <span className="text-[10px] font-medium text-gray-700">{value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </SectionCard>

      {/* 推荐方案 */}
      <SectionCard icon="🗺️" title={recommendedApproach.title} desc={recommendedApproach.desc}>
        <div className="space-y-3">
          {recommendedApproach.phases.map((phase, i) => (
            <div key={phase.phase}>
              <div className="rounded-xl border p-4" style={{ borderColor: phase.color + '33', background: phase.color + '04' }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{phase.icon}</span>
                    <span className="text-sm font-bold" style={{ color: phase.color }}>{phase.phase}: {phase.name}</span>
                  </div>
                  <Badge color={phase.color}>风险: {phase.risk}</Badge>
                </div>
                <div className="space-y-1 mb-3">
                  {phase.actions.map((a, j) => (
                    <div key={j} className="flex items-start gap-2 text-[10px] text-gray-500">
                      <span className="text-gray-300 mt-0.5">•</span>
                      <span>{a}</span>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1">
                  {phase.deliverables.map(d => (
                    <Badge key={d} color={phase.color}>{d}</Badge>
                  ))}
                </div>
              </div>
              {i < recommendedApproach.phases.length - 1 && (
                <div className="text-center text-gray-300 py-1 text-xs">↓</div>
              )}
            </div>
          ))}
        </div>
      </SectionCard>

      {/* 成本效益分析 */}
      <SectionCard icon="💰" title={costBenefitAnalysis.title} desc={costBenefitAnalysis.desc}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* 管控成本 */}
          <div>
            <div className="text-[10px] font-semibold text-gray-600 mb-2">📉 {costBenefitAnalysis.costs.title}</div>
            <div className="space-y-1.5">
              {costBenefitAnalysis.costs.items.map(item => (
                <div key={item.name} className="rounded-lg border border-gray-100 bg-gray-50/30 p-2">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-sm">{item.icon}</span>
                    <span className="text-[10px] font-semibold text-gray-700">{item.name}</span>
                  </div>
                  <div className="flex items-center justify-between text-[9px]">
                    <span className="font-mono text-gray-600">{item.cost}</span>
                    <Badge color="#636e72">{item.type}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* 使用收益 */}
          <div>
            <div className="text-[10px] font-semibold text-[#3fb950] mb-2">📈 {costBenefitAnalysis.benefits.title}</div>
            <div className="space-y-1.5">
              {costBenefitAnalysis.benefits.items.map(item => (
                <div key={item.name} className="rounded-lg border border-[#3fb950]/20 bg-[#3fb950]/5 p-2">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-sm">{item.icon}</span>
                    <span className="text-[10px] font-semibold text-gray-700">{item.name}</span>
                    <span className="text-[10px] font-bold font-mono text-[#3fb950] ml-auto">{item.value}</span>
                  </div>
                  <div className="text-[9px] text-gray-500">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
          {/* 不用的成本 */}
          <div>
            <div className="text-[10px] font-semibold text-[#e17055] mb-2">🚫 {costBenefitAnalysis.notUsingCosts.title}</div>
            <div className="space-y-1.5">
              {costBenefitAnalysis.notUsingCosts.items.map(item => (
                <div key={item.name} className="rounded-lg border p-2" style={{ borderColor: item.color + '33', background: item.color + '08' }}>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-sm">{item.icon}</span>
                    <span className="text-[10px] font-semibold text-gray-700">{item.name}</span>
                    <span className="text-[10px] font-bold font-mono ml-auto" style={{ color: item.color }}>{item.value}</span>
                  </div>
                  <div className="text-[9px] text-gray-500">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SectionCard>

      {/* 行业实践参考 */}
      <SectionCard icon="🏢" title={industryPractices.title} desc={industryPractices.desc}>
        <div className="space-y-3">
          {industryPractices.practices.map(p => (
            <div key={p.company} className="rounded-xl border p-4" style={{ borderColor: p.color + '33', background: p.color + '04' }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{p.icon}</span>
                <span className="text-sm font-bold" style={{ color: p.color }}>{p.company}</span>
                <Badge color={p.color}>{p.approach}</Badge>
              </div>
              <div className="space-y-1">
                {p.details.map((d, i) => (
                  <div key={i} className="flex items-start gap-2 text-[10px] text-gray-500">
                    <span className="text-gray-300 mt-0.5">•</span>
                    <span>{d}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* 代码生成隔离模式 */}
      <SectionCard icon="🧩" title={codeIsolation.title} desc={codeIsolation.desc}>
        {/* 核心原则 */}
        <div className="rounded-xl border border-[#6c5ce7]/30 bg-[#6c5ce7]/05 p-4 mb-4">
          <div className="flex items-start gap-2 mb-2">
            <span className="text-lg">💡</span>
            <div>
              <div className="text-sm font-bold text-[#6c5ce7] mb-1">{codeIsolation.tagline}</div>
              <p className="text-xs text-gray-600 leading-relaxed">{codeIsolation.corePrinciple}</p>
            </div>
          </div>
        </div>

        {/* 传统 vs 隔离 对比 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          {[codeIsolation.comparison.traditional, codeIsolation.comparison.isolated].map(mode => (
            <div key={mode.label} className="rounded-xl border p-3" style={{ borderColor: mode.color + '33', background: mode.color + '05' }}>
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-base">{mode.icon}</span>
                <span className="text-xs font-bold" style={{ color: mode.color }}>{mode.label}</span>
              </div>
              <div className="space-y-1.5">
                {mode.steps.map(s => (
                  <div key={s.step} className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0 mt-0.5"
                      style={{ background: mode.color }}>{s.step}</span>
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] text-gray-700">{s.text}</span>
                      {s.risk && (
                        <span className="ml-1 text-[9px] text-[#e17055] font-medium">⚠️ {s.risk}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Palantir AIP 连接 */}
        <div className="rounded-xl border border-[#0984e3]/30 bg-[#0984e3]/04 p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-base">🏛️</span>
            <span className="text-xs font-bold text-[#0984e3]">{codeIsolation.palantirConnection.title}</span>
          </div>
          <p className="text-[10px] text-gray-600 leading-relaxed mb-3">{codeIsolation.palantirConnection.desc}</p>
          <div className="space-y-1.5">
            {codeIsolation.palantirConnection.layers.map((l, i) => (
              <div key={l.layer} className="flex items-center gap-2 rounded-lg border border-gray-100 bg-white/80 p-2">
                <div className="w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
                  style={{ background: l.color }}>{i + 1}</div>
                <span className="text-[10px] font-semibold text-gray-700 w-16 flex-shrink-0">{l.layer}</span>
                <span className="text-[9px] text-gray-500">{l.sees}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 相关术语 */}
        <div className="mb-4">
          <div className="text-[10px] font-semibold text-gray-600 mb-2">📚 相关术语</div>
          <div className="space-y-1.5">
            {codeIsolation.terms.map(t => (
              <div key={t.name} className="flex items-start gap-2 rounded-lg border border-gray-100 bg-white/80 p-2.5">
                <span className="text-[10px] font-mono font-bold text-[#6c5ce7] flex-shrink-0 w-40">{t.name}</span>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] text-gray-700">{t.desc}</span>
                  <span className="ml-2 text-[9px] text-gray-400">({t.origin})</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 适用场景 */}
        <div className="mb-4">
          <div className="text-[10px] font-semibold text-gray-600 mb-2">🎯 典型应用场景</div>
          <div className="grid grid-cols-2 gap-2">
            {codeIsolation.useCases.map(u => (
              <div key={u.title} className="rounded-lg border border-gray-100 bg-gray-50/30 p-2.5">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-base">{u.icon}</span>
                  <span className="text-[10px] font-semibold text-gray-700">{u.title}</span>
                </div>
                <p className="text-[9px] text-gray-500 leading-relaxed">{u.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 局限性 */}
        <div className="rounded-xl border border-[#ffa657]/30 bg-[#ffa657]/05 p-3">
          <div className="text-[10px] font-semibold text-[#ffa657] mb-2">⚠️ 局限性 & 注意事项</div>
          <div className="space-y-1">
            {codeIsolation.limitations.map((l, i) => (
              <div key={i} className="flex items-start gap-2 text-[10px] text-gray-500">
                <span className="text-gray-300 mt-0.5">•</span>
                <span>{l}</span>
              </div>
            ))}
          </div>
        </div>
      </SectionCard>

      {/* 关键结论 */}
      <div className="space-y-3">
        {keyConclusions.points.map((p, i) => (
          <div key={i} className="rounded-2xl border p-5" style={{ borderColor: p.color + '33', background: p.color + '05' }}>
            <div className="flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">{p.icon}</span>
              <div>
                <p className="text-sm font-semibold text-gray-800 mb-1">{p.title}</p>
                <p className="text-xs text-gray-600 leading-relaxed">{p.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 中国借鉴 Tab
// ═══════════════════════════════════════════════════════════════
function ChinaTab() {
  const [openBlock, setOpenBlock] = useState(null);

  const obstacles = [
    {
      id: 'gov',
      icon: '🏛️',
      title: '政府市场：自主可控壁垒',
      color: '#e17055',
      verdict: '❌ 走不通',
      desc: 'Palantir 在美国核心收入来自 DoD / CIA / NSA，依赖政府对外部供应商的制度性开放。中国政府核心系统强调自主可控，华为、中软国际、神州数码等国家队天然占据入口，外资进不去，本土创业公司也难拿到核心数据权限。',
      detail: ['美国 DoD 预算充足，愿意为"黑盒"付高价', '中国政府采购倾向自建或国企承接', '数据安全法 + 等保要求，第三方平台难以获得核心数据授权', '国家队竞争：华为云、阿里政务云已深度绑定'],
    },
    {
      id: 'data',
      icon: '🔒',
      title: '数据主权：客户不愿"交出"数据',
      color: '#fd79a8',
      verdict: '⚠️ 需绕过',
      desc: 'Palantir 模式的前提是客户愿意把数据交给第三方平台统一管理。中国大型企业（尤其国企、金融、电信）把数据视为核心资产，监管要求数据本地化，"数据给了你，你比我更懂我的业务"的顾虑极其普遍。',
      detail: ['金融、医疗、政务数据本地化监管要求', '国企数据资产化意识强，不愿上第三方云', '数据安全法 / 个人信息保护法 / 行业监管三重约束', '解法：私有化部署 + 数据不出域架构'],
    },
    {
      id: 'price',
      icon: '💰',
      title: '价格敏感：FDE 高成本模式难跑通',
      color: '#ffa657',
      verdict: '⚠️ 需降本',
      desc: 'Palantir FDE 模式单项目派驻 5-10 名顶级工程师长期驻场，美国市场单人年薪 30-50 万美元，合同动辄数千万美元。中国企业软件采购价格极度压缩，习惯买断制而非订阅制，高价值咨询+软件组合教育成本极高。',
      detail: ['中国信息化项目普遍低价中标文化', '甲方习惯"买断制"，订阅制接受度低', 'FDE 人力成本在中国市场难以转嫁给客户', '解法：产品化替代人力密集型交付，FDE 作为加速器而非必需品'],
    },
    {
      id: 'bigtech',
      icon: '🏢',
      title: '大厂自建：竞争格局根本不同',
      color: '#6c5ce7',
      verdict: '⚠️ 需差异化',
      desc: '美国企业普遍外包 IT，天然需要 Palantir 这样的外部平台。中国阿里、腾讯、字节、华为都有极强的自建数据平台能力，大型国企有自己的数字化部门，中小企业预算不足付不起 Palantir 级别的价格。',
      detail: ['阿里 DataWorks / 腾讯 WeData / 华为 DataArts 已覆盖通用数据平台', '大型国企"数字化部门"倾向自建', '中小企业预算有限，无法支撑高价值交付', '解法：垂直行业深耕，做大厂不愿做的"脏活"'],
    },
  ];

  const opportunities = [
    {
      icon: '🏭',
      title: '制造业出海',
      color: '#00b894',
      feasibility: '✅ 高可行',
      why: '中国制造企业出海，数据整合需求强烈，且无国家队竞争。工厂设备数据 + 供应链数据 + 海外合规数据，天然需要统一平台。',
      examples: ['宁德时代海外工厂数字化', '比亚迪出海供应链管理', '工业设备预测性维护'],
      approach: '私有化部署 + 多语言 + 合规适配',
    },
    {
      icon: '⚡',
      title: '工业 / 能源',
      color: '#0984e3',
      feasibility: '✅ 高可行',
      why: '设备数据海量，AI 决策价值高（预测性维护、能耗优化），自建能力弱，且数据不出厂区的私有化部署天然契合监管要求。',
      examples: ['电网调度优化', '石化设备预测维护', '风电场功率预测'],
      approach: '边缘部署 + 实时数据流 + 领域模型',
    },
    {
      icon: '🏥',
      title: '医疗 / 生命科学',
      color: '#e84393',
      feasibility: '🟡 中可行',
      why: '数据孤岛严重（医院 HIS/LIS/PACS 各自独立），整合价值高，监管推动数据互通（国家医疗数据要素政策），且医院自建能力弱。',
      examples: ['多院区数据中台', '临床科研数据平台', '药企真实世界数据分析'],
      approach: '私有化 + 数据脱敏 + 合规审计链',
    },
    {
      icon: '🏦',
      title: '金融风控',
      color: '#fdcb6e',
      feasibility: '🟡 中可行',
      why: '数据敏感但需求真实（反欺诈、信贷风控、监管报送），私有化部署可绕过数据主权顾虑，且金融机构预算充足。',
      examples: ['银行反欺诈实时决策', '保险理赔智能核查', '监管报送自动化'],
      approach: '私有化 + 金融级安全 + 可解释 AI',
    },
  ];

  const principles = [
    {
      num: '01',
      title: '私有化部署是前提',
      color: '#00b894',
      desc: '不能要求客户把数据上云，必须支持完全私有化部署。数据不出域是中国市场的基本门槛，而非可选项。',
    },
    {
      num: '02',
      title: '产品化降低 FDE 成本',
      color: '#0984e3',
      desc: '用产品化替代人力密集型交付。FDE 是"加速器"而非"必需品"——先把 80% 的场景产品化，FDE 只处理最后 20% 的定制化。',
    },
    {
      num: '03',
      title: '垂直行业切入，不做通用平台',
      color: '#6c5ce7',
      desc: '不与阿里云 / 华为云正面竞争通用数据平台，先在制造 / 能源 / 医疗某一个行业做深，形成行业 Ontology 壁垒。',
    },
    {
      num: '04',
      title: '绑定数据本体，而非绑定合同',
      color: '#e17055',
      desc: '让客户的业务本体（Ontology）建在你的平台上，迁移成本自然形成。合同可以不续，但数据资产迁移成本极高。',
    },
  ];

  return (
    <div className="space-y-6">

      {/* 核心判断 */}
      <SectionCard title="核心判断：哪些说法对，哪些过于绝对" icon="⚖️">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-red-100 bg-red-50/40 p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-base">❌</span>
              <span className="text-sm font-semibold text-red-700">反对者说得对的部分</span>
            </div>
            <ul className="space-y-2">
              {[
                '政府核心市场确实进不去，这是结构性障碍',
                'FDE 高成本模式在中国价格体系下很难跑通',
                '通用数据平台赛道已被大厂占据，正面竞争无胜算',
                '数据主权意识极强，客户不愿把数据交给第三方',
              ].map((t, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-red-700">
                  <span className="mt-0.5 flex-shrink-0">•</span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-green-100 bg-green-50/40 p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-base">✅</span>
              <span className="text-sm font-semibold text-green-700">但"不适合"的结论过于绝对</span>
            </div>
            <p className="text-xs text-green-700 leading-relaxed mb-3">
              Palantir 模式的精髓不是"卖给政府"，而是：
            </p>
            <div className="rounded-lg bg-white/70 border border-green-100 p-3 text-xs text-gray-700 font-medium leading-relaxed">
              把客户的数据资产变成可被 AI 操作的<span className="text-[#6c5ce7] font-bold">业务本体（Ontology）</span>，
              用嵌入式方式深度绑定，形成极高的迁移成本。
              <br /><br />
              这个逻辑在中国<span className="text-green-700 font-bold">垂直行业</span>依然成立。
            </div>
          </div>
        </div>
      </SectionCard>

      {/* 四大障碍 */}
      <SectionCard title="四大障碍：为什么直接复制走不通" icon="🚧">
        <div className="space-y-3">
          {obstacles.map(ob => (
            <div key={ob.id} className="rounded-xl border overflow-hidden"
              style={{ borderColor: ob.color + '33' }}>
              <button
                className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50/60 transition-colors"
                onClick={() => setOpenBlock(openBlock === ob.id ? null : ob.id)}
              >
                <span className="text-xl flex-shrink-0">{ob.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-gray-800">{ob.title}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ background: ob.color + '18', color: ob.color }}>{ob.verdict}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{ob.desc}</p>
                </div>
                <span className="text-gray-300 text-sm flex-shrink-0">{openBlock === ob.id ? '▲' : '▼'}</span>
              </button>
              {openBlock === ob.id && (
                <div className="px-4 pb-4 border-t" style={{ borderColor: ob.color + '22', background: ob.color + '04' }}>
                  <p className="text-xs text-gray-600 leading-relaxed mt-3 mb-3">{ob.desc}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {ob.detail.map((d, i) => (
                      <div key={i} className="flex items-start gap-2 text-[11px] text-gray-500 bg-white/70 rounded-lg p-2 border border-gray-100">
                        <span className="flex-shrink-0" style={{ color: ob.color }}>→</span>
                        <span>{d}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </SectionCard>

      {/* 可行赛道 */}
      <SectionCard title="可行赛道：选对切入点，精髓依然成立" icon="🎯">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {opportunities.map((op, i) => (
            <div key={i} className="rounded-xl border p-4 hover:shadow-sm transition-shadow"
              style={{ borderColor: op.color + '33', background: op.color + '06' }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{op.icon}</span>
                <span className="text-sm font-semibold text-gray-800">{op.title}</span>
                <span className="ml-auto text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ background: op.color + '18', color: op.color }}>{op.feasibility}</span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed mb-3">{op.why}</p>
              <div className="flex flex-wrap gap-1 mb-2">
                {op.examples.map((e, j) => (
                  <span key={j} className="text-[10px] px-1.5 py-0.5 rounded-full border"
                    style={{ borderColor: op.color + '44', color: op.color, background: op.color + '0c' }}>{e}</span>
                ))}
              </div>
              <div className="text-[11px] text-gray-400 flex items-center gap-1">
                <span>💡</span>
                <span>{op.approach}</span>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* 本土化四原则 */}
      <SectionCard title="本土化四原则：中国版 Palantir 的正确打开方式" icon="🔑">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {principles.map((p, i) => (
            <div key={i} className="rounded-xl border p-4"
              style={{ borderColor: p.color + '33', background: p.color + '06' }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                  style={{ background: p.color }}>{p.num}</span>
                <span className="text-sm font-semibold text-gray-800">{p.title}</span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* 一句话总结 */}
      <div className="rounded-2xl border border-[#00b894]/30 bg-[#00b894]/05 p-5">
        <div className="flex items-start gap-3">
          <span className="text-2xl flex-shrink-0">💡</span>
          <div>
            <p className="text-sm font-semibold text-gray-800 mb-2">一句话总结</p>
            <p className="text-sm text-gray-600 leading-relaxed">
              <span className="font-medium text-[#e17055]">"中国不适合 Palantir 模式"</span>说的是政府市场和通用平台路线确实走不通；
              但 Palantir 模式的核心逻辑——
              <span className="font-medium text-[#6c5ce7]">数据本体化 + 嵌入式交付 + 高迁移成本</span>——
              在<span className="font-medium text-[#00b894]">制造、能源、医疗等垂直行业</span>依然有巨大机会。
              关键是：<span className="font-bold text-gray-800">私有化部署、降低交付成本、选对切入赛道</span>，
              吸收精髓做本土化变体，而非照搬。
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════
// 主组件
// ═══════════════════════════════════════════════════════════════
const TABS = [
  { id: 'crisis', label: '行业困境', icon: '⚠️', color: '#e17055', desc: 'AI Coding 时代的五大系统性冲击' },
  { id: 'breakout', label: '全球破局', icon: '🌍', color: '#3fb950', desc: '五大破局策略与标杆案例' },
  { id: 'palantir', label: 'Palantir 模式', icon: '🏛️', color: '#6c5ce7', desc: '决策操作系统的深度解析' },
  { id: 'framework', label: '应对框架', icon: '🏗️', color: '#326ce5', desc: '四层架构 + 路线图 + 团队转型' },
  { id: 'flywheel', label: 'FDE × 飞轮', icon: '🔄', color: '#e17055', desc: 'FDE 驻场模式 × 业务 BP × 交付飞轮' },
  { id: 'delivery', label: '交付形态', icon: '📦', color: '#fd79a8', desc: '内部 SaaS 共用困境与交付形态演进' },
  { id: 'benchmark', label: '行业对标', icon: '📊', color: '#ffa657', desc: '四家标杆企业模式对比' },
  { id: 'security', label: '模型安全', icon: '🔐', color: '#d63031', desc: '外部模型接触内部数据的风险论证与可控性方案' },
  { id: 'china', label: '中国借鉴', icon: '🇨🇳', color: '#00b894', desc: 'Palantir 模式在中国的可行路径与本土化策略' },
];

export default function StrategyViz() {
  const [activeTab, setActiveTab] = useState('crisis');

  const tabContent = {
    crisis: <CrisisTab />,
    breakout: <BreakoutTab />,
    palantir: <PalantirTab />,
    framework: <FrameworkTab />,
    flywheel: <FlywheelTab />,
    delivery: <DeliveryTab />,
    benchmark: <BenchmarkTab />,
    security: <SecurityTab />,
    china: <ChinaTab />,
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
