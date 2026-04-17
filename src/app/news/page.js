import Footer from '@/components/Footer';
import NewsFeed from '@/components/NewsFeed';
import { getNewsFeed, getNewsCategories } from '@/lib/content';

export const metadata = {
  title: 'AI 动态 — Signal',
  description: '精选 YouTube、播客、X 等平台的 AI 前沿视频与讨论，每日自动聚合',
};

export default function NewsPage() {
  const news = getNewsFeed();
  const categories = getNewsCategories();

  return (
    <>
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-gray-900">🌊 AI 动态</h1>
            <span className="px-2.5 py-0.5 text-xs font-medium bg-cyan-50 text-cyan-600 border border-cyan-100 rounded-full">
              每日自动聚合
            </span>
          </div>
          <p className="text-sm text-gray-500 mb-1">
            精选 YouTube、播客、X 等平台的 AI 前沿视频与讨论，由智能体每日自动整理
          </p>
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span>共 {news.length} 条</span>
            <span>·</span>
            <span>覆盖 LLM · Agent · 推理 · 自动驾驶 · 研究动态</span>
          </div>
        </div>

        <NewsFeed news={news} categories={categories} />
      </div>

      <Footer />
    </>
  );
}
