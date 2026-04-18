'use client';

import Footer from '@/components/Footer';
import IdeaRadar from '@/components/IdeaRadar';

export default function IdeaPage() {
  return (
    <>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {/* Hero */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-gray-900">💡 创业雷达</h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100 font-medium">
              每日扫描
            </span>
          </div>
          <p className="text-sm text-gray-500">
            综合软件 · 游戏 · 硬件行业国内外每日新闻，提炼可行创业方向与海外对标公司
          </p>
          <p className="text-xs text-gray-400 mt-1 leading-relaxed max-w-3xl">
            覆盖 <span className="font-semibold text-gray-600">AI 工具 / 游戏科技 / 消费硬件 / 开发者工具 / 企业 SaaS</span> 等赛道，
            每个方向标注国外已有玩家、市场规模、进入壁垒与中国机会窗口。
          </p>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { icon: '🌍', label: '覆盖行业', value: '5+', desc: '软件·游戏·硬件·SaaS·工具' },
            { icon: '🚀', label: '创业方向', value: '30+', desc: '持续更新中' },
            { icon: '🏢', label: '海外对标', value: '50+', desc: '已有公司案例' },
            { icon: '🇨🇳', label: '中国机会', value: '12+', desc: '可行赛道分析' },
          ].map(item => (
            <div key={item.label} className="rounded-xl border border-gray-100 bg-white p-4 text-center shadow-sm">
              <div className="text-2xl mb-1">{item.icon}</div>
              <div className="text-xl font-bold text-gray-900">{item.value}</div>
              <div className="text-xs font-semibold text-gray-700 mt-0.5">{item.label}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">{item.desc}</div>
            </div>
          ))}
        </div>

        {/* 主体 */}
        <IdeaRadar />
      </div>
      <Footer />
    </>
  );
}
