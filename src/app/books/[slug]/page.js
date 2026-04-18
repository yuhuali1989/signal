import TableOfContents from '@/components/TableOfContents';
import BookSidebar from '@/components/BookSidebar';
import Link from 'next/link';
import { getAllContent, getContentBySlug } from '@/lib/content';

export async function generateStaticParams() {
  const items = getAllContent('books');
  return items.map(item => ({ slug: item.slug }));
}

export async function generateMetadata({ params }) {
  const post = await getContentBySlug('books', params.slug);
  return { title: post ? `${post.title} — Signal` : 'Signal' };
}

export default async function BookDetailPage({ params }) {
  const post = await getContentBySlug('books', params.slug);

  if (!post) {
    return (
      <>
        
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <p className="text-gray-400">内容不存在</p>
          <Link href="/books/" className="text-maxwell-500 text-sm mt-4 inline-block">← 返回书架</Link>
        </div>
      </>
    );
  }

  // 获取同本书所有章节
  const allBooks = getAllContent('books');
  const sameBook = allBooks
    .filter(b => b.book === post.book)
    .sort((a, b) => (parseInt(a.chapter) || 0) - (parseInt(b.chapter) || 0));
  const currentIdx = sameBook.findIndex(b => b.slug === post.slug);
  const prevChapter = currentIdx > 0 ? sameBook[currentIdx - 1] : null;
  const nextChapter = currentIdx < sameBook.length - 1 ? sameBook[currentIdx + 1] : null;

  return (
    <>
      
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-12">
        {/* 面包屑 */}
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
          <Link href="/" className="hover:text-maxwell-500">首页</Link>
          <span>/</span>
          <Link href="/books/" className="hover:text-maxwell-500">书架</Link>
          {post.book && (
            <>
              <span>/</span>
              <span className="text-gray-500">{post.book}</span>
            </>
          )}
          <span>/</span>
          <span className="text-gray-600 truncate">第 {post.chapter} 章</span>
        </div>

        {/* 三栏布局：左书目 + 中内容 + 右TOC */}
        <div className="flex gap-6">
          {/* 左侧：书籍目录 */}
          <BookSidebar
            bookTitle={post.book}
            chapters={sameBook}
            currentSlug={post.slug}
          />

          {/* 中间：主内容 */}
          <div className="flex-1 min-w-0 max-w-4xl">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                {post.chapterTitle || post.title}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
                {post.date && <span>📅 {new Date(post.date).toLocaleDateString('zh-CN')}</span>}
                {post.agent && <span>🤖 {post.agent}</span>}
                {post.updatedAt && <span>🔄 更新于 {post.updatedAt}</span>}
              </div>
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {post.tags.map(tag => (
                    <span key={tag} className="px-2 py-0.5 text-xs bg-maxwell-50 text-maxwell-600 rounded-md">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Content */}
            <article
              className="prose prose-gray prose-maxwell max-w-none"
              dangerouslySetInnerHTML={{ __html: post.contentHtml }}
            />

            {/* 上下章导航 */}
            <div className="mt-12 pt-6 border-t border-gray-100 flex items-center justify-between gap-4">
              {prevChapter ? (
                <Link href={`/books/${prevChapter.slug}/`} className="flex-1 p-4 bg-gray-50 rounded-lg hover:bg-maxwell-50 transition-colors group">
                  <p className="text-xs text-gray-400 mb-1">← 上一章</p>
                  <p className="text-sm font-medium text-gray-600 group-hover:text-maxwell-600">
                    {prevChapter.chapterTitle || prevChapter.title}
                  </p>
                </Link>
              ) : (
                <Link href="/books/" className="flex-1 p-4 bg-gray-50 rounded-lg hover:bg-maxwell-50 transition-colors group">
                  <p className="text-xs text-gray-400 mb-1">←</p>
                  <p className="text-sm font-medium text-gray-600 group-hover:text-maxwell-600">返回书架</p>
                </Link>
              )}
              {nextChapter ? (
                <Link href={`/books/${nextChapter.slug}/`} className="flex-1 p-4 bg-gray-50 rounded-lg hover:bg-maxwell-50 transition-colors group text-right">
                  <p className="text-xs text-gray-400 mb-1">下一章 →</p>
                  <p className="text-sm font-medium text-gray-600 group-hover:text-maxwell-600">
                    {nextChapter.chapterTitle || nextChapter.title}
                  </p>
                </Link>
              ) : (
                <Link href="/books/" className="flex-1 p-4 bg-gray-50 rounded-lg hover:bg-maxwell-50 transition-colors group text-right">
                  <p className="text-xs text-gray-400 mb-1">→</p>
                  <p className="text-sm font-medium text-gray-600 group-hover:text-maxwell-600">全书完结 · 返回书架</p>
                </Link>
              )}
            </div>
          </div>

          {/* 右侧：TOC */}
          <div className="hidden xl:block w-52 flex-shrink-0">
            <TableOfContents contentHtml={post.contentHtml} />
          </div>
        </div>
      </div>
    </>
  );
}
