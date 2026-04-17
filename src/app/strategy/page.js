'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import StrategyViz from '@/components/StrategyViz';

export default function StrategyPage() {
  return (
    <>
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {/* Hero */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-gray-900">🧭 业务原生</h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 border border-purple-100 font-medium">
              Palantir 模式
            </span>
          </div>
          <p className="text-sm text-gray-500">
            AI Coding & Agent 时代下的软件行业困境分析、全球破局思路与业务原生应对框架
          </p>
          <p className="text-xs text-gray-400 mt-1 leading-relaxed max-w-3xl">
            当 AI 能写 80% 的代码，软件团队的价值锚点在哪里？本模块深度分析行业困境，
            对标 <span className="font-mono text-gray-500">Palantir / Databricks / Salesforce / Tesla</span> 等全球标杆，
            提出从 <span className="font-semibold text-[#6c5ce7]">Code Factory → Decision Engine</span> 的转型框架。
          </p>
        </div>

        {/* 核心亮点 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-8">
          {[
            { icon: '⚠️', label: '5 大困境', desc: '系统性冲击分析', color: '#e17055' },
            { icon: '🌍', label: '5 大破局', desc: '策略 · 信号 · 深度展开', color: '#3fb950' },
            { icon: '🏛️', label: 'Palantir', desc: '决策操作系统', color: '#6c5ce7' },
            { icon: '🏗️', label: '4 层架构', desc: '应对框架体系', color: '#326ce5' },
            { icon: '🔄', label: 'FDE × 飞轮', desc: '驻场交付闭环', color: '#e17055' },
            { icon: '📦', label: '交付形态', desc: 'SaaS 共用困境', color: '#fd79a8' },
            { icon: '📊', label: '行业对标', desc: '4 家标杆对比', color: '#ffa657' },
            { icon: '🇨🇳', label: '中国借鉴', desc: '本土化可行路径', color: '#00b894' },
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
        <StrategyViz />

        {/* 底部说明 */}
        <div className="mt-10 p-4 bg-gray-50 rounded-2xl border border-gray-100 text-xs text-gray-400 leading-relaxed">
          <span className="font-medium text-gray-500">📌 说明：</span>
          本模块分析 AI Coding & Agent 时代对软件行业的系统性冲击，
          深度解析 <span className="font-mono text-gray-600">Palantir</span> 的"决策操作系统"模式，
          并提出借鉴 <span className="font-mono text-gray-600">Ontology + AIP + Forward Deployed</span> 思想的平台产品应对框架。
          核心理念：从"卖代码"转向"卖决策能力"，构建数据基座 → 业务本体 → AI 平台 → 决策应用的四层架构。
          路线图覆盖 2026 Q1 至 2027 Q4，分 4 个阶段渐进实施。
          <span className="font-medium text-[#00b894]">「中国借鉴」</span>模块深度分析 Palantir 模式在中国的四大障碍与可行赛道，
          提出私有化部署 + 垂直行业切入 + 数据本体绑定的本土化四原则。
        </div>
      </main>
      <Footer />
    </>
  );
}
