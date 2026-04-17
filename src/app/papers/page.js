import Footer from '@/components/Footer';
import PapersList from '@/components/PapersList';
import ResearchTrends from '@/components/ResearchTrends';
import { getPapersIndex, getPaperCategories } from '@/lib/content';

export const metadata = { title: '论文 — Signal' };

export default function PapersPage() {
  const papers = getPapersIndex();
  const categories = getPaperCategories();

  // ── 为「研究趋势」区块计算统计数据（服务端） ──
  const trends = categories.map(cat => {
    const catPapers = papers.filter(p => p.category === cat.id);
    const reviewed  = catPapers.filter(p => p.hasReview).length;
    const critical  = catPapers.filter(p => p.importance >= 5).length;  // 重要性满分
    const recent    = catPapers.filter(p => p.venue && /202[5-9]|2026/.test(p.venue)).length;
    return {
      ...cat,
      total: catPapers.length,
      reviewed,
      critical,
      recent,
    };
  });

  return (
    <>
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">

        {/* ── 页面标题 ── */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">🔬 论文</h1>
          <p className="text-sm text-gray-500">
            大模型领域必读论文精选，覆盖模型架构、训练对齐、推理优化、数据合成四大方向
          </p>
          <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
            <span>共 {papers.length} 篇论文</span>
            <span>·</span>
            <span>{papers.filter(p => p.hasReview).length} 篇已解读</span>
            <span>·</span>
            <span>{papers.filter(p => p.importance >= 5).length} 篇重点精读</span>
          </div>
        </div>

        {/* ── 研究趋势区块 ── */}
        <ResearchTrends trends={trends} />

        {/* ── 论文列表 ── */}
        <PapersList papers={papers} categories={categories} />

      </main>
      <Footer />
    </>
  );
}
