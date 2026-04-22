'use client';
import { useState } from 'react';
import { SITE_ROADMAP } from '@/lib/strategy-data';

function SectionCard({ icon, title, desc, children }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">{icon}</span>
        <div>
          <p className="text-sm font-semibold text-gray-800">{title}</p>
          {desc && <p className="text-[10px] text-gray-400">{desc}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

export default function RoadmapPage() {
  const { lastUpdated, summary, topOpportunities, githubFindings, coverageGaps, moduleProposals, suggestedSources } = SITE_ROADMAP;

  const priorityColor = { P0: '#e17055', P1: '#ffa657', P2: '#94a3b8' };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">

      {/* 页头 */}
      <div className="rounded-2xl border border-[#6c5ce7]/20 bg-[#6c5ce7]/[0.04] p-4 flex items-start gap-3">
        <span className="text-2xl flex-shrink-0">🎨</span>
        <div>
          <p className="text-sm font-semibold text-gray-800 mb-1">AI 设计师（角色 E）Roadmap 建议报告</p>
          <p className="text-xs text-gray-500 leading-relaxed">{summary}</p>
          <p className="text-[10px] text-gray-400 mt-1">最后更新：{lastUpdated} · 由 AI 设计师定期扫描 GitHub 生态、新闻盲区、模块覆盖后更新</p>
        </div>
      </div>

      {/* TOP 5 机会 */}
      <SectionCard icon="🔥" title="最高价值机会 TOP 5" desc="综合评估价值/投入比，优先实施">
        <div className="space-y-3">
          {topOpportunities.map((op, i) => (
            <div key={op.id} className="rounded-xl border p-4"
              style={{ borderColor: op.color + '33', background: op.color + '06' }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                  style={{ background: priorityColor[op.priority] }}>{op.priority}</span>
                <span className="text-xs font-bold text-gray-400">#{i + 1}</span>
                <span className="text-sm font-semibold text-gray-800">{op.title}</span>
                <span className="ml-auto text-[10px] text-gray-400">价值 {op.value} · 投入 {op.effort}</span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed mb-2">{op.desc}</p>
              <div className="flex items-start gap-1.5">
                <span className="text-[10px] text-gray-400 flex-shrink-0 mt-0.5">→</span>
                <p className="text-[10px] text-gray-500 leading-relaxed">{op.action}</p>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* 新闻角度盲区 */}
      <SectionCard icon="📡" title="新闻角度盲区" desc="对比现有 category 分布，发现覆盖不足的方向">
        <div className="space-y-2">
          {coverageGaps.map((gap, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/50 p-3">
              <span className="text-sm">{gap.hotness}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-semibold text-gray-800">{gap.angle}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                    style={{ background: gap.severity === '严重缺失' ? '#e1705515' : '#ffa65715',
                             color: gap.severity === '严重缺失' ? '#e17055' : '#ffa657' }}>
                    {gap.severity}
                  </span>
                </div>
                <p className="text-[10px] text-gray-400">建议 category: <span className="font-mono text-gray-600">{gap.suggestedCategory}</span> · 来源: {gap.suggestedSources.join(' / ')}</p>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* 模块扩充建议 */}
      <SectionCard icon="🧩" title="模块扩充建议" desc="按优先级排列的新模块/新页面提案">
        <div className="space-y-2">
          {moduleProposals.map((m, i) => (
            <div key={i} className="rounded-xl border border-gray-100 p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold text-white"
                  style={{ background: priorityColor[m.priority] }}>{m.priority}</span>
                <span className="text-xs font-semibold text-gray-800">{m.name}</span>
                <span className="text-[9px] text-gray-400 ml-auto">{m.type}</span>
              </div>
              <p className="text-[10px] text-gray-500 leading-relaxed mb-1">{m.desc}</p>
              <p className="text-[10px] text-gray-400">数据来源: <span className="text-gray-600">{m.dataSource}</span></p>
              <p className="text-[10px] text-gray-400">实施建议: <span className="text-gray-600">{m.implementHint}</span></p>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* GitHub 明星资源 */}
      <SectionCard icon="⭐" title="GitHub 明星资源发现" desc="高 star 仓库中 Signal 尚未覆盖的方向">
        <div className="space-y-2">
          {githubFindings.map((g, i) => (
            <div key={i} className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/50 p-3">
              <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold text-white mt-0.5 flex-shrink-0"
                style={{ background: priorityColor[g.priority] }}>{g.priority}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-mono font-semibold text-gray-800">{g.repo}</span>
                  <span className="text-[9px] text-gray-400">⭐ {g.stars}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">{g.type}</span>
                </div>
                <p className="text-[10px] text-gray-500 mb-0.5">{g.reason}</p>
                <p className="text-[10px] text-gray-400">→ {g.action}</p>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* 建议新增信息源 */}
      <SectionCard icon="📰" title="建议新增信息源" desc="采集员白名单中缺失的高质量来源">
        <div className="space-y-2">
          {suggestedSources.map((s, i) => (
            <div key={i} className="flex items-start gap-3 rounded-xl border border-gray-100 p-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-semibold text-gray-800">{s.name}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">{s.type}</span>
                </div>
                <a href={s.url} target="_blank" rel="noopener noreferrer"
                  className="text-[10px] text-blue-400 hover:text-blue-500 font-mono break-all">{s.url}</a>
                <p className="text-[10px] text-gray-400 mt-0.5">{s.reason}</p>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

    </div>
  );
}
