'use client';

import Footer from '@/components/Footer';
import QuantViz from '@/components/QuantViz';

export default function QuantPage() {
  return (
    <>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {/* Hero */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-gray-900">📈 量化业务</h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-600 border border-green-100 font-medium">
              Quant × AI
            </span>
          </div>
          <p className="text-sm text-gray-500">
            量化交易技术体系 · 国内外市场行情 · 大模型在量化中的应用 · 实战指南
          </p>
          <p className="text-xs text-gray-400 mt-1 leading-relaxed max-w-3xl">
            系统梳理量化交易的核心技术栈、策略体系和市场格局。
            深度分析 <span className="font-mono text-gray-500">Renaissance / Two Sigma / Citadel</span> 等全球标杆，
            以及 <span className="font-mono text-gray-500">幻方 / 九坤 / 明汯</span> 等中国头部量化私募。
            重点关注 <span className="font-semibold text-[#ffa657]">GPT-4 / Claude / Qlib</span> 等大模型和 AI 工具在因子挖掘、策略生成、风险管理中的革命性应用。
          </p>
        </div>

        {/* 核心亮点 */}
        <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          {[
            { icon: '🌐', label: '全景总览', desc: '行业全景 · 发展历程', color: '#6c5ce7' },
            { icon: '🧠', label: '策略体系', desc: '6 大策略分类', color: '#e17055' },
            { icon: '⚙️', label: '技术栈', desc: '5 层技术架构', color: '#3fb950' },
            { icon: '🤖', label: 'AI & 大模型', desc: 'LLM × 量化', color: '#ffa657' },
            { icon: '📊', label: '国内外行情', desc: '中美对比 · 头部机构', color: '#79c0ff' },
            { icon: '🛠️', label: '实战指南', desc: '入门 · 平台 · 陷阱', color: '#fd79a8' },
          ].map(item => (
            <div key={item.label} className="rounded-xl border p-3 text-center"
              style={{ borderColor: item.color + '33', background: item.color + '04' }}>
              <div className="text-xl mb-1">{item.icon}</div>
              <div className="text-xs font-semibold text-gray-800">{item.label}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">{item.desc}</div>
            </div>
          ))}
        </div>

        {/* 主体 */}
        <QuantViz />

        {/* 底部说明 */}
        <div className="mt-10 p-4 bg-gray-50 rounded-2xl border border-gray-100 text-xs text-gray-400 leading-relaxed">
          <span className="font-medium text-gray-500">📌 说明：</span>
          本模块系统梳理量化交易的技术体系和市场格局。
          策略体系覆盖 <span className="font-mono text-gray-600">统计套利 / CTA / 高频做市 / 因子投资 / ML 策略 / 期权策略</span> 六大分类。
          技术栈从 <span className="font-mono text-gray-600">数据层 → 研究层 → 执行层 → 风控层 → 基础设施</span> 五层展开。
          重点分析大模型（GPT-4/Claude/FinGPT）在研报分析、因子挖掘、策略生成、情绪分析、RL 交易、全链路 Agent 中的应用。
          国内外行情对比中美量化市场差异，梳理监管政策和行业趋势。
        </div>
      </div>
      <Footer />
    </>
  );
}
