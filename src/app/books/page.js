import Footer from '@/components/Footer';
import Link from 'next/link';
import { getAllContent } from '@/lib/content';

export const metadata = { title: '书架 — Signal' };

// 每本书对应的封面渐变色（循环使用）
const COVER_GRADIENTS = [
  'from-violet-500 to-purple-700',
  'from-blue-500 to-indigo-700',
  'from-emerald-500 to-teal-700',
  'from-orange-500 to-amber-700',
  'from-rose-500 to-pink-700',
  'from-cyan-500 to-sky-700',
];

export default function BooksPage() {
  const books = getAllContent('books');

  // 按书名分组
  const bookGroups = {};
  books.forEach(b => {
    const bookName = b.book || '未分类';
    if (!bookGroups[bookName]) bookGroups[bookName] = [];
    bookGroups[bookName].push(b);
  });

  // 每组按章节排序
  Object.keys(bookGroups).forEach(key => {
    bookGroups[key].sort((a, b) => (parseInt(a.chapter) || 0) - (parseInt(b.chapter) || 0));
  });

  const bookNames = Object.keys(bookGroups);

  return (
    <>
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">📖 书架</h1>
          <p className="text-sm text-gray-500">由 AI 智能体持续研究与修订，三角色串行流水线保障内容质量</p>
        </div>

        {/* 快速跳转 */}
        {bookNames.length > 1 && (
          <div className="mb-10 p-4 bg-gray-50 rounded-xl border border-gray-100">
            <div className="text-xs font-medium text-gray-400 mb-3">📚 共 {bookNames.length} 本 · 快速跳转</div>
            <div className="flex flex-wrap gap-2">
              {bookNames.map((name, i) => (
                <a
                  key={name}
                  href={`#book-${i}`}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-200 hover:border-[#a29bfe] hover:shadow-sm transition-all text-sm"
                >
                  <span className={`w-6 h-6 rounded-md bg-gradient-to-br ${COVER_GRADIENTS[i % COVER_GRADIENTS.length]} flex items-center justify-center text-white text-xs font-bold`}>
                    {i + 1}
                  </span>
                  <span className="text-gray-700 font-medium">{name}</span>
                  <span className="text-xs text-gray-400">{bookGroups[name].length} 章</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* 书籍卡片列表 */}
        <div className="space-y-6">
          {bookNames.map((bookName, idx) => {
            const chapters = bookGroups[bookName];
            const latestDate = chapters.reduce((max, ch) => {
              const d = ch.updatedAt || ch.date || '';
              return d > max ? d : max;
            }, '');
            const gradient = COVER_GRADIENTS[idx % COVER_GRADIENTS.length];

            return (
              <div
                key={bookName}
                id={`book-${idx}`}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm shadow-gray-100/60 overflow-hidden scroll-mt-20"
              >
                {/* 书籍头部 */}
                <div className="flex items-start gap-5 p-6 pb-5">
                  {/* 封面色块 */}
                  <div className={`flex-shrink-0 w-14 h-20 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-2xl shadow-md`}>
                    📖
                  </div>

                  {/* 书籍信息 */}
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-bold text-gray-900 mb-1">{bookName}</h2>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#6c5ce7]" />
                        {chapters.length} 章
                      </span>
                      {latestDate && (
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                          最近更新 {latestDate}
                        </span>
                      )}
                      <span className="px-2 py-0.5 bg-green-50 text-green-600 border border-green-100 rounded-full font-medium">
                        持续修订中
                      </span>
                    </div>
                  </div>

                  {/* 进入第一章按钮 */}
                  <Link
                    href={`/books/${chapters[0].slug}/`}
                    className="flex-shrink-0 px-4 py-2 bg-[#6c5ce7] text-white text-sm font-medium rounded-full hover:bg-[#5a4bd4] transition-colors shadow-sm shadow-purple-200"
                  >
                    开始阅读
                  </Link>
                </div>

                {/* 分割线 */}
                <div className="border-t border-gray-50 mx-6" />

                {/* 章节列表 */}
                <div className="p-6 pt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {chapters.map((ch, ci) => (
                      <Link
                        key={ch.slug}
                        href={`/books/${ch.slug}/`}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-purple-50/60 hover:border-[#a29bfe]/40 border border-transparent transition-all group"
                      >
                        {/* 章节序号 */}
                        <span className={`flex-shrink-0 w-7 h-7 rounded-md bg-gradient-to-br ${gradient} text-white text-xs font-bold flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity`}>
                          {ch.chapter || ci + 1}
                        </span>
                        {/* 章节标题 */}
                        <span className="text-[13px] text-gray-600 group-hover:text-[#6c5ce7] transition-colors line-clamp-1 font-medium">
                          {ch.chapterTitle || ch.title}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {books.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <p className="text-4xl mb-4">📚</p>
            <p>书架空空，AI 智能体正在努力写作中...</p>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}
