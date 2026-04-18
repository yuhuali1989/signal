'use client';

import { useState, useMemo } from 'react';
import {
  QUANT_TABS,
  OVERVIEW_DATA,
  STRATEGIES_DATA,
  TECH_DATA,
  AI_DATA,
  MARKET_DATA,
  PRACTICE_DATA,
} from '@/lib/quant-data';

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

function SectionCard({ icon, title, desc, children }) {
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
  const { definition, coreMetrics, timeline, comparison } = OVERVIEW_DATA;

  return (
    <div className="space-y-4">
      {/* 定义 */}
      <SectionCard icon="📖" title="什么是量化交易" desc={definition}>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {coreMetrics.map(m => (
            <div key={m.name} className="rounded-xl border border-gray-100 bg-gray-50/50 p-3 text-center">
              <div className="text-xl mb-1">{m.icon}</div>
              <div className="text-lg font-bold font-mono" style={{ color: m.color }}>{m.value}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">{m.name}</div>
              <div className="text-[9px] text-gray-300 mt-0.5">{m.desc}</div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* 发展历程 */}
      <SectionCard icon="📅" title="量化交易发展历程" desc="从 1952 年 Markowitz 到 2025 年 AI Agent 量化">
        <div className="space-y-2">
          {timeline.map((t, i) => (
            <div key={t.year}>
              <div className="flex items-center gap-3 rounded-xl border p-3"
                style={{ borderColor: t.color + '33', background: t.color + '06' }}>
                <div className="w-16 text-center flex-shrink-0">
                  <div className="text-xs font-bold font-mono" style={{ color: t.color }}>{t.year}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-gray-700">{t.event}</div>
                  <div className="text-[10px] text-gray-500">{t.desc}</div>
                </div>
              </div>
              {i < timeline.length - 1 && (
                <div className="text-center text-[9px] text-gray-300 py-0.5">↓</div>
              )}
            </div>
          ))}
        </div>
      </SectionCard>

      {/* 量化 vs 主观 */}
      <SectionCard icon="⚖️" title="量化 vs 主观投资" desc="两种投资范式的核心差异">
        <div className="overflow-x-auto">
          <table className="w-full text-[10px]">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 px-2 text-gray-500 font-medium">维度</th>
                <th className="text-center py-2 px-2 text-gray-500 font-medium">量化投资</th>
                <th className="text-center py-2 px-2 text-gray-500 font-medium">主观投资</th>
              </tr>
            </thead>
            <tbody>
              {comparison.map(c => (
                <tr key={c.dimension} className="border-b border-gray-50">
                  <td className="py-2 px-2 font-semibold text-gray-700">{c.dimension}</td>
                  <td className="py-2 px-2 text-center"><Badge color={c.color}>{c.quant}</Badge></td>
                  <td className="py-2 px-2 text-center text-gray-500">{c.discretionary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 2. 策略体系
// ─────────────────────────────────────────────────────────────
function StrategiesTab() {
  const { categories } = STRATEGIES_DATA;

  return (
    <div className="space-y-4">
      {categories.map(cat => (
        <SectionCard key={cat.name} icon={cat.icon} title={cat.name} desc={cat.desc}>
          {/* 子策略 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
            {cat.subStrategies.map(s => (
              <div key={s.name} className="rounded-xl border p-3"
                style={{ borderColor: cat.color + '33', background: cat.color + '04' }}>
                <div className="text-xs font-semibold text-gray-700 mb-1">{s.name}</div>
                <div className="text-[10px] text-gray-500 mb-1">{s.desc}</div>
                <div className="text-[9px] text-gray-400 font-mono">例: {s.example}</div>
              </div>
            ))}
          </div>
          {/* 风险收益 */}
          <div className="flex items-center gap-4 text-[10px] p-2 rounded-lg bg-gray-50">
            <span className="text-gray-500">📊 年化: <span className="font-mono font-semibold" style={{ color: cat.color }}>{cat.riskReturn.annualReturn}</span></span>
            <span className="text-gray-500">📐 夏普: <span className="font-mono font-semibold" style={{ color: cat.color }}>{cat.riskReturn.sharpe}</span></span>
            <span className="text-gray-500">📉 最大回撤: <span className="font-mono text-[#ff6b6b]">{cat.riskReturn.maxDrawdown}</span></span>
            <span className="text-gray-500">📦 容量: {cat.riskReturn.capacity}</span>
          </div>
        </SectionCard>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 3. 技术栈
// ─────────────────────────────────────────────────────────────
function TechTab() {
  const { layers, languages } = TECH_DATA;

  return (
    <div className="space-y-4">
      {/* 技术分层 */}
      {layers.map(layer => (
        <SectionCard key={layer.name} icon={layer.icon} title={layer.name} desc={layer.desc}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {layer.components.map(c => (
              <div key={c.name} className="rounded-xl border p-3"
                style={{ borderColor: layer.color + '33', background: layer.color + '04' }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-gray-700">{c.name}</span>
                  <Badge color={layer.color}>{c.tech}</Badge>
                </div>
                <div className="text-[10px] text-gray-500 mb-1">{c.desc}</div>
                <div className="text-[9px] text-gray-400 font-mono">工具: {c.tools}</div>
              </div>
            ))}
          </div>
        </SectionCard>
      ))}

      {/* 编程语言选型 */}
      <SectionCard icon="💻" title="编程语言选型" desc="量化交易中各语言的定位与适用场景">
        <div className="overflow-x-auto">
          <table className="w-full text-[10px]">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 px-2 text-gray-500 font-medium">语言</th>
                <th className="text-center py-2 px-2 text-gray-500 font-medium">用途</th>
                <th className="text-center py-2 px-2 text-gray-500 font-medium">占比</th>
                <th className="text-left py-2 px-2 text-gray-500 font-medium">优势</th>
                <th className="text-left py-2 px-2 text-gray-500 font-medium">劣势</th>
              </tr>
            </thead>
            <tbody>
              {languages.map(l => (
                <tr key={l.name} className="border-b border-gray-50">
                  <td className="py-2 px-2 font-semibold font-mono" style={{ color: l.color }}>{l.name}</td>
                  <td className="py-2 px-2 text-center"><Badge color={l.color}>{l.usage}</Badge></td>
                  <td className="py-2 px-2 text-center font-mono text-gray-600">{l.share}</td>
                  <td className="py-2 px-2 text-gray-500">{l.pros}</td>
                  <td className="py-2 px-2 text-gray-400">{l.cons}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 4. AI & 大模型
// ─────────────────────────────────────────────────────────────
function AITab() {
  const { overview, applications, papers, risks } = AI_DATA;

  return (
    <div className="space-y-4">
      {/* 总览 */}
      <SectionCard icon="🤖" title="大模型在量化中的角色" desc={overview.role}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {overview.impact.map(item => (
            <div key={item.name} className="flex items-start gap-2 rounded-xl border p-3"
              style={{ borderColor: item.color + '33', background: item.color + '06' }}>
              <span className="text-lg flex-shrink-0">{item.icon}</span>
              <div>
                <div className="text-xs font-semibold text-gray-700">{item.name}</div>
                <div className="text-[10px] text-gray-500">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* 应用场景 */}
      <SectionCard icon="🎯" title="大模型应用场景" desc="6 大核心应用方向，从研报分析到全链路 Agent">
        <div className="space-y-3">
          {applications.map(app => (
            <div key={app.name} className="rounded-xl border p-4"
              style={{ borderColor: app.color + '33', background: app.color + '04' }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{app.icon}</span>
                <span className="text-sm font-semibold text-gray-800">{app.name}</span>
                <Badge color={app.color}>{app.category}</Badge>
              </div>
              <p className="text-[10px] text-gray-500 mb-2">{app.desc}</p>
              <div className="flex flex-wrap gap-1 mb-2">
                {app.models.map(m => (
                  <span key={m} className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                    style={{ background: app.color + '15', color: app.color }}>
                    {m}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-4 text-[9px] text-gray-400 font-mono flex-wrap">
                <span>输入: {app.input}</span>
                <span>输出: {app.output}</span>
                <span style={{ color: app.color }}>Alpha: {app.alpha}</span>
              </div>
              <div className="mt-1.5 text-[10px] text-gray-500">
                <span className="font-semibold">示例：</span>{app.example}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* 风险与局限 */}
      <SectionCard icon="⚠️" title="AI 量化的风险与局限" desc="大模型在量化中的已知风险">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {risks.map(r => (
            <div key={r.name} className="flex items-start gap-2 rounded-xl border p-3"
              style={{ borderColor: r.severity === '高' ? '#ff6b6b33' : r.severity === '中' ? '#ffa65733' : '#79c0ff33',
                       background: r.severity === '高' ? '#ff6b6b06' : r.severity === '中' ? '#ffa65706' : '#79c0ff06' }}>
              <span className="text-lg flex-shrink-0">{r.icon}</span>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-semibold text-gray-700">{r.name}</span>
                  <Badge color={r.severity === '高' ? '#ff6b6b' : r.severity === '中' ? '#ffa657' : '#79c0ff'}>{r.severity}</Badge>
                </div>
                <div className="text-[10px] text-gray-500">{r.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* 核心论文 */}
      <SectionCard icon="📄" title="核心论文参考" desc="AI 量化领域关键论文">
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
                  <td className="py-2 px-2 text-center"><Badge color="#6c5ce7">{p.venue}</Badge></td>
                  <td className="py-2 px-2 text-center"><Badge color="#79c0ff">{p.topic}</Badge></td>
                  <td className="py-2 px-2 text-gray-500">{p.highlight}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 5. 国内外行情
// ─────────────────────────────────────────────────────────────
function MarketTab() {
  const { globalFirms, chinaFirms, comparison, regulations, trends } = MARKET_DATA;

  return (
    <div className="space-y-4">
      {/* 全球头部机构 */}
      <SectionCard icon="🌍" title="全球头部量化机构" desc="管理规模最大、业绩最优的量化对冲基金">
        <div className="space-y-3">
          {globalFirms.map(f => (
            <div key={f.name} className="rounded-xl border p-4"
              style={{ borderColor: f.color + '33', background: f.color + '04' }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm">{f.country}</span>
                <span className="text-sm font-semibold text-gray-800">{f.name}</span>
                <Badge color={f.color}>AUM {f.aum}</Badge>
              </div>
              <p className="text-[10px] text-gray-500 mb-1">{f.highlight}</p>
              <div className="flex items-center gap-4 text-[9px] text-gray-400 font-mono flex-wrap">
                <span>旗舰: {f.flagship}</span>
                <span style={{ color: f.color }}>业绩: {f.performance}</span>
                <span>风格: {f.style}</span>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* 中国头部量化私募 */}
      <SectionCard icon="🇨🇳" title="中国头部量化私募" desc="百亿级量化私募代表">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {chinaFirms.map(f => (
            <div key={f.name} className="rounded-xl border p-3"
              style={{ borderColor: f.color + '33', background: f.color + '04' }}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-semibold text-gray-800">{f.name}</span>
                <Badge color={f.color}>{f.status}</Badge>
                <span className="text-[9px] text-gray-400 ml-auto font-mono">{f.aum}</span>
              </div>
              <div className="text-[10px] text-gray-500 mb-1">{f.highlight}</div>
              <div className="flex items-center gap-3 text-[9px] text-gray-400">
                <span>风格: {f.style}</span>
                <span>基建: {f.infra}</span>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* 中美对比 */}
      <SectionCard icon="⚖️" title="中美量化市场对比" desc="两大量化市场的核心差异">
        <div className="overflow-x-auto">
          <table className="w-full text-[10px]">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 px-2 text-gray-500 font-medium">维度</th>
                <th className="text-center py-2 px-2 text-gray-500 font-medium">🇺🇸 美国</th>
                <th className="text-center py-2 px-2 text-gray-500 font-medium">🇨🇳 中国</th>
                <th className="text-left py-2 px-2 text-gray-500 font-medium">差距</th>
              </tr>
            </thead>
            <tbody>
              {comparison.map(c => (
                <tr key={c.dimension} className="border-b border-gray-50">
                  <td className="py-2 px-2 font-semibold text-gray-700">{c.dimension}</td>
                  <td className="py-2 px-2 text-center"><Badge color="#3fb950">{c.us}</Badge></td>
                  <td className="py-2 px-2 text-center"><Badge color="#e17055">{c.china}</Badge></td>
                  <td className="py-2 px-2 text-gray-500">{c.gap}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* 监管政策 */}
      <SectionCard icon="📋" title="监管政策" desc="中美两国量化交易监管框架">
        <div className="space-y-4">
          {regulations.map(reg => (
            <div key={reg.region}>
              <div className="text-xs font-semibold text-gray-700 mb-2">{reg.region}</div>
              <div className="space-y-2">
                {reg.policies.map(p => (
                  <div key={p.name} className="flex items-start gap-3 rounded-xl border p-3"
                    style={{ borderColor: reg.color + '33', background: reg.color + '04' }}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-semibold text-gray-700">{p.name}</span>
                        <Badge color={reg.color}>{p.date}</Badge>
                      </div>
                      <div className="text-[10px] text-gray-500">{p.desc}</div>
                      <div className="text-[9px] text-gray-400 mt-0.5">影响: {p.impact}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* 市场趋势 */}
      <SectionCard icon="🔮" title="市场趋势" desc="量化行业六大发展趋势">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {trends.map(t => (
            <div key={t.name} className="flex items-start gap-2 rounded-xl border p-3"
              style={{ borderColor: t.color + '33', background: t.color + '06' }}>
              <span className="text-lg flex-shrink-0">{t.icon}</span>
              <div>
                <div className="text-xs font-semibold text-gray-700">{t.name}</div>
                <div className="text-[10px] text-gray-500">{t.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 6. 实战指南
// ─────────────────────────────────────────────────────────────
function PracticeTab() {
  const { learningPath, platforms, dataSources, pitfalls, books } = PRACTICE_DATA;

  return (
    <div className="space-y-4">
      {/* 入门路径 */}
      <SectionCard icon="🗺️" title="量化入门路径" desc="从零到实盘的学习路线图">
        <div className="space-y-2">
          {learningPath.map((step, i) => (
            <div key={step.stage}>
              <div className="flex items-center gap-3 rounded-xl border p-3"
                style={{ borderColor: step.color + '33', background: step.color + '06' }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0"
                  style={{ background: step.color + '15' }}>
                  {step.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Badge color={step.color}>{step.stage}</Badge>
                    <span className="text-xs font-semibold text-gray-700">{step.name}</span>
                    <span className="text-[9px] text-gray-400 ml-auto">{step.duration}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {step.skills.map(s => (
                      <span key={s} className="text-[9px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">{s}</span>
                    ))}
                  </div>
                </div>
              </div>
              {i < learningPath.length - 1 && (
                <div className="text-center text-[9px] text-gray-300 py-0.5">↓</div>
              )}
            </div>
          ))}
        </div>
      </SectionCard>

      {/* 平台选型 */}
      <SectionCard icon="🖥️" title="量化平台选型" desc="开源框架 vs 在线平台">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {platforms.map(p => (
            <div key={p.name} className="rounded-xl border p-3"
              style={{ borderColor: p.color + '33', background: p.color + '04' }}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-semibold text-gray-800">{p.name}</span>
                <Badge color={p.color}>{p.type}</Badge>
                <span className="text-[9px] text-gray-400 ml-auto font-mono">{p.lang}</span>
              </div>
              <div className="flex flex-wrap gap-1 mb-1.5">
                {p.features.map(f => (
                  <span key={f} className="text-[9px] px-1.5 py-0.5 rounded-full"
                    style={{ background: p.color + '12', color: p.color }}>
                    {f}
                  </span>
                ))}
              </div>
              <div className="text-[10px] text-gray-500">
                <span className="font-semibold">最佳场景：</span>{p.bestFor}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* 数据源 */}
      <SectionCard icon="📊" title="数据源推荐" desc="行情数据、基本面数据、另类数据获取渠道">
        <div className="overflow-x-auto">
          <table className="w-full text-[10px]">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 px-2 text-gray-500 font-medium">数据源</th>
                <th className="text-center py-2 px-2 text-gray-500 font-medium">市场</th>
                <th className="text-center py-2 px-2 text-gray-500 font-medium">类型</th>
                <th className="text-center py-2 px-2 text-gray-500 font-medium">费用</th>
                <th className="text-center py-2 px-2 text-gray-500 font-medium">质量</th>
              </tr>
            </thead>
            <tbody>
              {dataSources.map(d => (
                <tr key={d.name} className="border-b border-gray-50">
                  <td className="py-2 px-2 font-semibold" style={{ color: d.color }}>{d.name}</td>
                  <td className="py-2 px-2 text-center"><Badge color={d.color}>{d.market}</Badge></td>
                  <td className="py-2 px-2 text-center text-gray-600">{d.type}</td>
                  <td className="py-2 px-2 text-center text-gray-500">{d.cost}</td>
                  <td className="py-2 px-2 text-center">{d.quality}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* 回测陷阱 */}
      <SectionCard icon="🚨" title="回测六大陷阱" desc="新手最容易踩的坑，每一个都可能让策略从盈利变亏损">
        <div className="space-y-2">
          {pitfalls.map(p => (
            <div key={p.name} className="rounded-xl border p-3"
              style={{ borderColor: p.color + '33', background: p.color + '04' }}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm">{p.icon}</span>
                <span className="text-xs font-semibold text-gray-700">{p.name}</span>
                <Badge color={p.severity === '致命' ? '#ff6b6b' : p.severity === '严重' ? '#e17055' : '#ffa657'}>{p.severity}</Badge>
              </div>
              <div className="text-[10px] text-gray-500 mb-1">{p.desc}</div>
              <div className="text-[10px] text-gray-600">
                <span className="font-semibold text-[#3fb950]">✅ 修复：</span>{p.fix}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* 推荐书籍 */}
      <SectionCard icon="📚" title="推荐书籍" desc="量化交易必读书单">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {books.map(b => (
            <div key={b.title} className="rounded-xl border p-3"
              style={{ borderColor: b.color + '33', background: b.color + '04' }}>
              <div className="text-xs font-semibold text-gray-800 mb-1">{b.title}</div>
              <div className="flex items-center gap-2 text-[10px]">
                <span className="text-gray-500">{b.author}</span>
                <Badge color={b.color}>{b.topic}</Badge>
                <Badge color={b.level === '入门' ? '#3fb950' : b.level === '中级' ? '#ffa657' : '#e17055'}>{b.level}</Badge>
              </div>
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
export default function QuantViz() {
  const [activeTab, setActiveTab] = useState('overview');

  const tabComponents = useMemo(() => ({
    overview: <OverviewTab />,
    strategies: <StrategiesTab />,
    tech: <TechTab />,
    ai: <AITab />,
    market: <MarketTab />,
    practice: <PracticeTab />,
  }), []);

  const activeInfo = QUANT_TABS.find(t => t.id === activeTab);

  return (
    <div>
      {/* Tab 切换 */}
      <div className="flex flex-wrap gap-1.5 mb-6 p-1.5 bg-gray-50 rounded-2xl border border-gray-100">
        {QUANT_TABS.map(tab => (
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
