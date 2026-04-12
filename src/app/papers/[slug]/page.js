import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { getPapersIndex, getPaperReview } from '@/lib/content';

export async function generateStaticParams() {
  const papers = getPapersIndex().filter(p => p.hasReview);
  return papers.map(p => ({ slug: p.id }));
}

export async function generateMetadata({ params }) {
  const papers = getPapersIndex();
  const paper = papers.find(p => p.id === params.slug);
  return { title: paper ? `${paper.title} — Signal 论文解读` : 'Signal' };
}

export default async function PaperDetailPage({ params }) {
  const papers = getPapersIndex();
  const paperMeta = papers.find(p => p.id === params.slug);
  const review = await getPaperReview(params.slug);

  if (!review || !paperMeta) {
    return (
      <>
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 py-20 text-center">
          <p className="text-gray-400">论文解读不存在</p>
          <Link href="/papers/" className="text-maxwell-500 text-sm mt-4 inline-block">← 返回论文列表</Link>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
          <Link href="/" className="hover:text-maxwell-500">首页</Link>
          <span>/</span>
          <Link href="/papers/" className="hover:text-maxwell-500">论文解读</Link>
          <span>/</span>
          <span className="text-gray-600 truncate">{paperMeta.title}</span>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2 py-0.5 text-xs font-medium bg-maxwell-50 text-maxwell-600 rounded-full">{paperMeta.venue}</span>
            <span className="text-xs text-amber-400">{'★'.repeat(paperMeta.importance)}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            {paperMeta.title}
          </h1>
          <p className="text-sm text-gray-500 mb-1">{paperMeta.authors}</p>
          <p className="text-sm text-gray-400 mb-3">{paperMeta.summary}</p>
          {paperMeta.arxivUrl && (
            <a
              href={paperMeta.arxivUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-gray-50 text-gray-600 rounded-lg border border-gray-200 hover:border-maxwell-300 hover:text-maxwell-600 transition-all"
            >
              📎 查看论文原文 (arXiv) ↗
            </a>
          )}
        </div>

        {/* Content */}
        <article
          className="prose prose-gray max-w-none"
          dangerouslySetInnerHTML={{ __html: review.contentHtml }}
        />

        {/* Footer nav */}
        <div className="mt-12 pt-6 border-t border-gray-100">
          <Link href="/papers/" className="text-sm text-maxwell-500 hover:text-maxwell-700">
            ← 返回论文列表
          </Link>
        </div>
      </main>
    </>
  );
}
