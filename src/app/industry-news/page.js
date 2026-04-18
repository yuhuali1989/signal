import Footer from '@/components/Footer';
import IndustryNewsFeed from '@/components/IndustryNewsFeed';

export const metadata = {
  title: '全行业动态 — Signal',
  description: '综合软件、游戏、硬件、AI 行业国内外每日新闻聚合',
};

export default function IndustryNewsPage() {
  return (
    <>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-gray-900">📡 全行业动态</h1>
            <span className="px-2.5 py-0.5 text-xs font-medium bg-blue-50 text-blue-600 border border-blue-100 rounded-full">
              每日自动聚合
            </span>
          </div>
          <p className="text-sm text-gray-500 mb-1">
            覆盖软件 · 游戏 · 硬件 · AI 行业，国内外新闻同步追踪，由智能体每日自动整理
          </p>
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span>覆盖 软件 · 游戏 · 消费硬件 · 企业 SaaS · 开发者工具 · AI 基础设施</span>
          </div>
        </div>

        <IndustryNewsFeed />
      </div>
      <Footer />
    </>
  );
}
