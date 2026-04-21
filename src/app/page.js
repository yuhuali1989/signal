import Footer from '@/components/Footer';
import ContentCard from '@/components/ContentCard';
import Link from 'next/link';
import { getAllContent, getStats, getEvolutionLogs, getNewsFeed, getWeeklyDigest, getHotTopics } from '@/lib/content';

export default function Home() {
  const stats = getStats();
  const articles = getAllContent('articles').slice(0, 6);
  const logs = getEvolutionLogs().slice(0, 5);
  const news = getNewsFeed().slice(0, 5);
  const digest = getWeeklyDigest(7);
  const hotTopics = getHotTopics(12);

  return (
    <>
      

      {/* Hero */}
      <section className="pt-20 pb-14 text-center">
        <div className="max-w-3xl mx-auto px-4">
          {/* Status badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 border border-green-100 rounded-full mb-8">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full status-glow" />
            <span className="text-xs text-green-700 font-medium">
              自主进化中 · {stats.agents} 个 AI 智能体持续运行
            </span>
          </div>

          {/* Title */}
          <h1 className="text-5xl sm:text-6xl font-extrabold mb-4 tracking-tight">
            <span className="bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] bg-clip-text text-transparent">Signal</span>
          </h1>
          <p className="text-lg text-gray-600 mb-2 font-medium">
            从噪声中提取前沿信号
          </p>
          <p className="text-sm text-gray-400 max-w-md mx-auto mb-10 leading-relaxed">
            AI 多智能体每日产出文章、论文解读与行业声浪，持续迭代书籍与模型库，所有变更均被进化日志完整记录
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/books/"
              className="px-5 py-2 bg-[#6c5ce7] text-white text-sm font-medium rounded-full hover:bg-[#5a4bd4] shadow-sm shadow-purple-200 hover:shadow-md hover:shadow-purple-200 transition-all"
            >
              书架
            </Link>
            <Link
              href="/articles/"
              className="px-5 py-2 bg-white text-gray-700 text-sm font-medium rounded-full border border-gray-200 hover:border-[#a29bfe] hover:text-[#6c5ce7] transition-all"
            >
              最新文章
            </Link>
            <Link
              href="/papers/"
              className="px-5 py-2 bg-white text-gray-700 text-sm font-medium rounded-full border border-gray-200 hover:border-[#a29bfe] hover:text-[#6c5ce7] transition-all"
            >
              论文
            </Link>
            <Link
              href="/models/"
              className="px-5 py-2 bg-white text-gray-700 text-sm font-medium rounded-full border border-gray-200 hover:border-[#a29bfe] hover:text-[#6c5ce7] transition-all"
            >
              模型
            </Link>
            <Link
              href="/news/"
              className="px-5 py-2 bg-white text-gray-700 text-sm font-medium rounded-full border border-gray-200 hover:border-[#a29bfe] hover:text-[#6c5ce7] transition-all"
            >
              声浪
            </Link>
          </div>
        </div>
      </section>

      {/* Platform Overview — 六大核心模块简介 */}
      <section className="py-8 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Link href="/books/" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-purple-50/60 border border-purple-100/60 hover:border-[#a29bfe]/60 hover:shadow-sm transition-all group">
              <span className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-lg shadow-sm flex-shrink-0">📖</span>
              <div>
                <p className="text-sm font-semibold text-gray-800 group-hover:text-[#6c5ce7] transition-colors">书籍自动演进</p>
                <p className="text-xs text-gray-400">研究员→编辑→审校员，三角色每日串行修订</p>
              </div>
            </Link>
            <Link href="/articles/" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-50/60 border border-blue-100/60 hover:border-blue-300/60 hover:shadow-sm transition-all group">
              <span className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-lg shadow-sm flex-shrink-0">📝</span>
              <div>
                <p className="text-sm font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">文章 AI 产出</p>
                <p className="text-xs text-gray-400">AI 深度文章 + 前沿热点，每日自动追踪</p>
              </div>
            </Link>
            <Link href="/models/" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-cyan-50/60 border border-cyan-100/60 hover:border-cyan-300/60 hover:shadow-sm transition-all group">
              <span className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-lg shadow-sm flex-shrink-0">📊</span>
              <div>
<p className="text-sm font-semibold text-gray-800 group-hover:text-cyan-600 transition-colors">模型 · 评测</p>
                <p className="text-xs text-gray-400">模型排行 + 评测可信度，同步 SOTA 进展</p>
              </div>
            </Link>
            <Link href="/papers/" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-indigo-50/60 border border-indigo-100/60 hover:border-indigo-300/60 hover:shadow-sm transition-all group">
              <span className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-lg shadow-sm flex-shrink-0">🔬</span>
              <div>
<p className="text-sm font-semibold text-gray-800 group-hover:text-indigo-600 transition-colors">论文 · 解读</p>
                <p className="text-xs text-gray-400">必读论文精选，覆盖四大方向追踪</p>
              </div>
            </Link>
            <Link href="/news/" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-teal-50/60 border border-teal-100/60 hover:border-teal-300/60 hover:shadow-sm transition-all group">
              <span className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-lg shadow-sm flex-shrink-0">🌊</span>
              <div>
                <p className="text-sm font-semibold text-gray-800 group-hover:text-teal-600 transition-colors">声浪 · AI 动态</p>                <p className="text-xs text-gray-400">YouTube · 播客 · X，每日自动聚合</p>
              </div>
            </Link>
            <Link href="/data-infra/" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-50/60 border border-emerald-100/60 hover:border-emerald-300/60 hover:shadow-sm transition-all group">
              <span className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-lg shadow-sm flex-shrink-0">🔄</span>
              <div>
                <p className="text-sm font-semibold text-gray-800 group-hover:text-emerald-600 transition-colors">AI Infra 全景</p>
<p className="text-xs text-gray-400">K8s · 数据湖仓 · MLOps · 闭环 Infra</p>
              </div>
            </Link>
            <Link href="/lab/" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-violet-50/60 border border-violet-100/60 hover:border-violet-300/60 hover:shadow-sm transition-all group">
              <span className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-lg shadow-sm flex-shrink-0">⚗️</span>
              <div>
                <p className="text-sm font-semibold text-gray-800 group-hover:text-violet-600 transition-colors">前沿实验室</p>
                <p className="text-xs text-gray-400">NeRF · 占用网络 · 扩散模型 · 单卡可跑</p>
              </div>
            </Link>
            <Link href="/tools/" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-orange-50/60 border border-orange-100/60 hover:border-orange-300/60 hover:shadow-sm transition-all group">
              <span className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-lg shadow-sm flex-shrink-0">🧰</span>
              <div>
                <p className="text-sm font-semibold text-gray-800 group-hover:text-orange-600 transition-colors">工具箱</p>
                <p className="text-xs text-gray-400">Prompt 模板 · Token 计算 · 评测解析</p>
              </div>
            </Link>
            <Link href="/idea/" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50/60 border border-amber-100/60 hover:border-amber-300/60 hover:shadow-sm transition-all group">
              <span className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-lg shadow-sm flex-shrink-0">💡</span>
              <div>
                <p className="text-sm font-semibold text-gray-800 group-hover:text-amber-600 transition-colors">创业雷达</p>
                <p className="text-xs text-gray-400">AI 赛道 · 海外对标 · 中国机会窗口</p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Weekly Digest */}
      <section className="py-14 bg-gray-50/60 border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <span className="text-base">📡</span>
              <div>
                <h2 className="text-lg font-semibold text-gray-800">本周快报</h2>
                <p className="text-xs text-gray-400">AI 智能体自动整理的近 7 天动态摘要</p>
              </div>
              {digest.totalNewItems > 0 && (
                <span className="px-2 py-0.5 text-[11px] font-medium bg-purple-50 text-purple-600 border border-purple-100 rounded-full">
                  +{digest.totalNewItems} 新增
                </span>
              )}
            </div>
            <span className="text-xs text-gray-400">过去 7 天</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* 最新文章 */}
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center text-sm">📝</span>
                <span className="text-sm font-semibold text-gray-700">新增文章</span>
                <span className="ml-auto text-xs font-mono text-purple-500">+{digest.articles.length}</span>
              </div>
              {digest.articles.length > 0 ? (
                <ul className="space-y-2">
                  {digest.articles.map((a, i) => (
                    <li key={i}>
                      <Link href={`/articles/${a.slug}/`} className="text-[13px] text-gray-600 hover:text-[#6c5ce7] line-clamp-1 transition-colors">
                        {a.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-gray-300">本周暂无新文章</p>
              )}
            </div>

            {/* 最新论文 */}
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-sm">📄</span>
                <span className="text-sm font-semibold text-gray-700">论文解读</span>
                <span className="ml-auto text-xs font-mono text-blue-500">+{digest.papers.length}</span>
              </div>
              {digest.papers.length > 0 ? (
                <ul className="space-y-2">
                  {digest.papers.map((p, i) => (
                    <li key={i}>
                      <Link href={`/papers/${p.slug}/`} className="text-[13px] text-gray-600 hover:text-[#6c5ce7] line-clamp-1 transition-colors">
                        {p.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-gray-300">本周暂无新论文</p>
              )}
            </div>

            {/* 书籍修订 */}
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center text-sm">📖</span>
                <span className="text-sm font-semibold text-gray-700">书籍修订</span>
                <span className="ml-auto text-xs font-mono text-orange-500">{digest.updatedBooks.length} 本</span>
              </div>
              {digest.updatedBooks.length > 0 ? (
                <ul className="space-y-1.5">
                  {digest.updatedBooks.slice(0, 4).map((name, i) => (
                    <li key={i} className="text-[13px] text-gray-600 line-clamp-1">
                      <span className="mr-1.5 text-orange-400">↻</span>{name}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-gray-300">本周暂无书籍修订</p>
              )}
            </div>

          </div>

          {/* 声浪摘要条 */}
          {digest.news.length > 0 && (
            <div className="mt-3 flex items-center gap-3 px-4 py-2.5 bg-white rounded-xl border border-gray-100 shadow-sm">
              <span className="text-sm">🌊</span>
              <span className="text-sm font-medium text-gray-700">声浪</span>
              <span className="text-xs font-mono text-cyan-500">+{digest.news.length} 条</span>
              <span className="text-xs text-gray-300">·</span>
              <span className="text-xs text-gray-400">本周共 {digest.totalLogs} 次进化</span>
              <a href="/news/" className="ml-auto text-xs text-[#6c5ce7] hover:text-[#5a4bd4] font-medium">查看全部 →</a>
            </div>
          )}
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-5 border-y border-gray-100 bg-white/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-wrap items-center gap-6 sm:gap-10 justify-center">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
            <span className="text-sm text-gray-400"><strong className="text-gray-700">{stats.totalContent}</strong> 篇内容</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-[#6c5ce7] rounded-full" />
            <span className="text-sm text-gray-400"><strong className="text-gray-700">{stats.books}</strong> 本书籍</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
            <span className="text-sm text-gray-400"><strong className="text-gray-700">{stats.articles}</strong> 篇文章</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full" />
            <span className="text-sm text-gray-400"><strong className="text-gray-700">{stats.papersReviewed}</strong> 篇论文解读</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-orange-400 rounded-full" />
            <span className="text-sm text-gray-400"><strong className="text-gray-700">{stats.autoUpdates}</strong> 次进化</span>
          </div>
          <Link href="/evolution/" className="text-xs text-gray-400 hover:text-[#6c5ce7] transition-colors">
            进化日志 →
          </Link>
        </div>
      </section>

      {/* 🔥 热度榜 */}
      {hotTopics.length > 0 && (
        <section className="py-8 border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-base">🔥</span>
                <h2 className="text-lg font-semibold text-gray-800">热度榜</h2>
                <span className="text-xs text-gray-400">— 近期声浪 & 论文中出现最多的主题</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {hotTopics.map((item, i) => {
                const maxCount = hotTopics[0].count;
                const intensity = Math.round((item.count / maxCount) * 5);
                const sizeMap = ['text-[11px]', 'text-xs', 'text-xs', 'text-sm', 'text-sm', 'text-base'];
                const opacityMap = ['opacity-50', 'opacity-60', 'opacity-70', 'opacity-80', 'opacity-90', 'opacity-100'];
                return (
                  <span
                    key={item.term}
                    className={`px-3 py-1 rounded-full border border-purple-100/80 bg-purple-50/60 text-[#6c5ce7] font-medium cursor-default hover:bg-purple-100/60 transition-all ${sizeMap[intensity]} ${opacityMap[intensity]}`}
                    title={`出现 ${item.count} 次`}
                  >
                    {i < 3 && <span className="mr-1">{['🥇','🥈','🥉'][i]}</span>}
                    {item.term}
                    <span className="ml-1.5 text-[10px] text-purple-300 font-mono">{item.count}</span>
                  </span>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Latest Articles */}
      {articles.length > 0 && (
        <section className="py-14">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-800">最新文章</h2>
              <Link href="/articles/" className="text-sm text-[#6c5ce7] hover:text-[#5a4bd4] font-medium">查看全部 →</Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {articles.map(art => (
                <ContentCard
                  key={art.slug}
                  title={art.title}
                  description={art.description}
                  date={art.date}
                  tags={art.tags || []}
                  agent={art.agent}
                  href={`/articles/${art.slug}/`}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* AI 动态 */}
      {news.length > 0 && (
        <section className="py-14 bg-white/40">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">声浪</h2>
                <p className="text-xs text-gray-400 mt-0.5">精选 YouTube · 播客 · X 前沿讨论，每日自动聚合</p>
              </div>
              <a href="/news/" className="text-sm text-[#6c5ce7] hover:text-[#5a4bd4] font-medium">查看全部 →</a>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {news.slice(0, 6).map(n => {
                const hasUrl = n.url && n.url !== '#';
                const Wrapper = hasUrl ? 'a' : 'div';
                const wrapperProps = hasUrl ? { href: n.url, target: '_blank', rel: 'noopener noreferrer' } : {};
                return (
                  <Wrapper
                    key={n.id}
                    {...wrapperProps}
                    className="card p-4 no-underline flex items-start gap-3 group hover:border-[#a29bfe]/40 transition-all"
                  >
                    <span className="text-xl mt-0.5 flex-shrink-0">{n.categoryIcon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700 group-hover:text-[#6c5ce7] line-clamp-2 transition-colors leading-snug">{n.title}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] text-gray-300 font-mono">{n.date}</span>
                        <span className="px-1.5 py-0.5 text-[10px] bg-gray-50 text-gray-400 rounded-md border border-gray-100">{n.source}</span>
                        {hasUrl && <span className="text-gray-300 text-[10px] ml-auto">↗</span>}
                      </div>
                    </div>
                  </Wrapper>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Evolution Log */}
      {logs.length > 0 && (
        <section className="py-14">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-800">进化日志</h2>
              <Link href="/evolution/" className="text-sm text-[#6c5ce7] hover:text-[#5a4bd4] font-medium">查看全部 →</Link>
            </div>
            <div className="space-y-2">
              {logs.map((log, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/60 border border-gray-100/80">
                  <span className="text-base mt-0.5">
                    {log.type === 'book' ? '📖' : log.type === 'article' ? '📝' : log.type === 'paper' ? '📄' : log.type === 'news' ? '🌊' : '🔄'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-600">{log.message}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] text-gray-300 font-mono">{log.date}</span>
                      <span className="text-[11px] text-[#a29bfe]">{log.agent}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <Footer />
    </>
  );
}
