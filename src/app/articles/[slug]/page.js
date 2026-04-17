import Footer from '@/components/Footer';
import TableOfContents from '@/components/TableOfContents';
import Link from 'next/link';
import { getAllContent, getContentBySlug } from '@/lib/content';

export async function generateStaticParams() {
  const items = getAllContent('articles');
  return items.map(item => ({ slug: item.slug }));
}

export async function generateMetadata({ params }) {
  const post = await getContentBySlug('articles', params.slug);
  return { title: post ? `${post.title} — Signal` : 'Signal' };
}

export default async function ArticleDetailPage({ params }) {
  const post = await getContentBySlug('articles', params.slug);

  if (!post) {
    return (
      <>
        
        <main className="max-w-4xl mx-auto px-4 py-20 text-center">
          <p className="text-gray-400">内容不存在</p>
          <Link href="/articles/" className="text-maxwell-500 text-sm mt-4 inline-block">← 返回文章</Link>
        </main>
      </>
    );
  }

  return (
    <>
      
      <main className="max-w-[1300px] mx-auto px-4 sm:px-6 py-12">
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
          <Link href="/" className="hover:text-maxwell-500">首页</Link>
          <span>/</span>
          <Link href="/articles/" className="hover:text-maxwell-500">文章</Link>
          <span>/</span>
          <span className="text-gray-600 truncate">{post.title}</span>
        </div>

        {/* 双栏布局：左内容 + 右 TOC */}
        <div className="flex gap-8">
          {/* 主内容 */}
          <div className="flex-1 min-w-0 max-w-4xl">
            <div className="mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">{post.title}</h1>
              {post.description && (
                <p className="text-gray-500 mb-3">{post.description}</p>
              )}
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
                {post.date && <span>📅 {new Date(post.date).toLocaleDateString('zh-CN')}</span>}
                {post.agent && <span>🤖 {post.agent}</span>}
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

            <article
              className="prose prose-gray prose-maxwell max-w-none"
              dangerouslySetInnerHTML={{ __html: post.contentHtml }}
            />

            <div className="mt-12 pt-6 border-t border-gray-100">
              <Link href="/articles/" className="text-sm text-maxwell-500 hover:text-maxwell-700">
                ← 返回文章
              </Link>
            </div>
          </div>

          {/* 右侧 TOC */}
          <div className="hidden xl:block w-52 flex-shrink-0">
            <TableOfContents contentHtml={post.contentHtml} />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
