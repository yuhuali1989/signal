import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ArticleFilter from '@/components/ArticleFilter';
import { getAllContent } from '@/lib/content';

export const metadata = { title: '文章 — Signal' };

export default function ArticlesPage() {
  const articles = getAllContent('articles');

  return (
    <>
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">📝 文章</h1>
          <p className="text-sm text-gray-500">热点追踪 + 深度解读，AI 智能体自动生成的技术文章</p>
        </div>

        <ArticleFilter articles={articles} />
      </main>
      <Footer />
    </>
  );
}
