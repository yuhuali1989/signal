import Footer from '@/components/Footer';
import ContentCard from '@/components/ContentCard';
import Link from 'next/link';
import { getAllContent, getStats, getEvolutionLogs, getNewsFeed, getWeeklyDigest, getHotTopics } from '@/lib/content';
import HotTopicsCloud from '@/components/HotTopicsCloud';

export default function Home() {
  const stats = getStats();
  const articles = getAllContent('articles').slice(0, 6);
  const logs = getEvolutionLogs().slice(0, 5);
  const news = getNewsFeed().slice(0, 12);
  const digest = getWeeklyDigest(7);
  const hotTopics = getHotTopics(12);

  return (
    <>

      {/* ═══════════════════ Hero（紧凑版） ═══════════════════ */}
      <section className="pt-16 pb-10 text-center">
        <div className="max-w-3xl mx-auto px-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 border border-green-100 rounded-full mb-6">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full status-glow" />
            <span className="text-xs text-green-700 font-medium">
              自主进化中 · {stats.agents} 个 AI 智能体持续运行
            </span>
          </div>

          <h1 className="text-5xl sm:text-6xl font-extrabold mb-3 tracking-tight">
            <span className="bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] bg-clip-text text-transparent">Signal</span>
          </h1>
          <p className="text-lg text-gray-600 font-medium">
            从噪声中提取前沿信号
          </p>
          <p className="text-sm text-gray-400 max-w-lg mx-auto mt-2 mb-8 leading-relaxed">
            AI 多智能体驱动的个人知识平台 —— 每日追踪前沿动态、产出深度文章与论文解读、持续迭代书籍与模型库
          </p>

          {/* 数据快照条 —— 紧凑嵌入 Hero */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 justify-center text-sm text-gray-400 mb-8">
            <span><strong className="text-gray-700 font-semibold">{stats.books}</strong> 本书</span>
            <span className="text-gray-200">·</span>
            <span><strong className="text-gray-700 font-semibold">{stats.articles}</strong> 篇文章</span>
            <span className="text-gray-200">·</span>
            <span><strong className="text-gray-700 font-semibold">{stats.papersReviewed}</strong> 篇论文</span>
            <span className="text-gray-200">·</span>
            <span><strong className="text-gray-700 font-semibold">{stats.totalContent}</strong> 总内容</span>
            <span className="text-gray-200">·</span>
            <span><strong className="text-orange-500 font-semibold">{stats.autoUpdates}</strong> 次进化</span>
          </div>

          {/* CTA */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/news/" className="px-5 py-2 bg-[#6c5ce7] text-white text-sm font-medium rounded-full hover:bg-[#5a4bd4] shadow-sm shadow-purple-200 hover:shadow-md hover:shadow-purple-200 transition-all">
              🌊 今日声浪
            </Link>
            <Link href="/articles/" className="px-5 py-2 bg-white text-gray-700 text-sm font-medium rounded-full border border-gray-200 hover:border-[#a29bfe] hover:text-[#6c5ce7] transition-all">
              最新文章
            </Link>
            <Link href="/books/" className="px-5 py-2 bg-white text-gray-700 text-sm font-medium rounded-full border border-gray-200 hover:border-[#a29bfe] hover:text-[#6c5ce7] transition-all">
              书架
            </Link>
            <Link href="/papers/" className="px-5 py-2 bg-white text-gray-700 text-sm font-medium rounded-full border border-gray-200 hover:border-[#a29bfe] hover:text-[#6c5ce7] transition-all">
              论文
            </Link>
            <Link href="/models/" className="px-5 py-2 bg-white text-gray-700 text-sm font-medium rounded-full border border-gray-200 hover:border-[#a29bfe] hover:text-[#6c5ce7] transition-all">
              模型
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════ 🔥 今日信号（声浪 + 热度榜合并） ═══════════════════ */}
      <section className="py-10 bg-gradient-to-b from-purple-50/40 to-white border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {/* 标题行 */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <span className="text-lg">🔥</span>
              <div>
                <h2 className="text-xl font-bold text-gray-900">今日信号</h2>
                <p className="text-xs text-gray-400 mt-0.5">AI 前沿动态实时聚合 · YouTube · 播客 · X · 官方博客</p>
              </div>
            </div>
            <Link href="/news/" className="text-sm text-[#6c5ce7] hover:text-[#5a4bd4] font-medium">
              查看全部 →
            </Link>
          </div>

          {/* 热度榜 —— 嵌入信号区顶部 */}
          {hotTopics.length > 0 && (
            <div className="mb-5 p-4 bg-white/80 rounded-xl border border-purple-100/60">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm">📊</span>
                <span className="text-sm font-semibold text-gray-700">热度榜</span>
                <span className="text-xs text-gray-400">— 近期声浪 & 论文中出现最多的主题</span>
              </div>
              <HotTopicsCloud topics={hotTopics} />
            </div>
          )}

          {/* 声浪列表 —— 2 列紧凑布局 */}
          {news.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {news.slice(0, 8).map(n => {
                const hasUrl = n.url && n.url !== '#';
                const Wrapper = hasUrl ? 'a' : 'div';
                const wrapperProps = hasUrl ? { href: n.url, target: '_blank', rel: 'noopener noreferrer' } : {};
                return (
                  <Wrapper
                    key={n.id}
                    {...wrapperProps}
                    className="flex items-start gap-3 px-4 py-3 rounded-xl bg-white border border-gray-100/80 hover:border-[#a29bfe]/40 hover:shadow-sm transition-all group no-underline"
                  >
                    <span className="text-lg mt-0.5 flex-shrink-0">{n.categoryIcon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700 group-hover:text-[#6c5ce7] line-clamp-2 transition-colors leading-snug">{n.title}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[10px] text-gray-300 font-mono">{n.date}</span>
                        <span className="px-1.5 py-0.5 text-[10px] bg-gray-50 text-gray-400 rounded-md border border-gray-100">{n.source}</span>
                        {hasUrl && <span className="text-gray-300 text-[10px] ml-auto">↗</span>}
                      </div>
                    </div>
                  </Wrapper>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════ 📝 最新文章 ═══════════════════ */}
      {articles.length > 0 && (
        <section className="py-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <span className="text-base">📝</span>
                <h2 className="text-lg font-semibold text-gray-800">最新文章</h2>
              </div>
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

      {/* ═══════════════════ 📚 知识地图（按四大分组组织） ═══════════════════ */}
      <section className="py-12 bg-gray-50/50 border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-2 mb-6">
            <span className="text-base">🗺️</span>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">知识地图</h2>
              <p className="text-xs text-gray-400 mt-0.5">探索 Signal 的全部模块 —— 从基础知识到前沿研究</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* 知识分组 */}
            <div className="bg-white rounded-2xl border border-purple-100/60 p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-[#6c5ce7]" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#6c5ce7]/80">知识</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Link href="/books/" className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-purple-50/60 transition-colors group">
                  <span className="text-base">📖</span>
                  <div>
                    <p className="text-sm font-medium text-gray-700 group-hover:text-[#6c5ce7]">书架</p>
                    <p className="text-[11px] text-gray-400">{stats.books} 本 · AI 自动演进</p>
                  </div>
                </Link>
                <Link href="/articles/" className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-purple-50/60 transition-colors group">
                  <span className="text-base">📝</span>
                  <div>
                    <p className="text-sm font-medium text-gray-700 group-hover:text-[#6c5ce7]">文章</p>
                    <p className="text-[11px] text-gray-400">{stats.articles} 篇深度分析</p>
                  </div>
                </Link>
                <Link href="/papers/" className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-purple-50/60 transition-colors group">
                  <span className="text-base">🔬</span>
                  <div>
                    <p className="text-sm font-medium text-gray-700 group-hover:text-[#6c5ce7]">论文</p>
                    <p className="text-[11px] text-gray-400">{stats.papersReviewed} 篇解读</p>
                  </div>
                </Link>
                <Link href="/models/" className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-purple-50/60 transition-colors group">
                  <span className="text-base">📊</span>
                  <div>
                    <p className="text-sm font-medium text-gray-700 group-hover:text-[#6c5ce7]">模型</p>
                    <p className="text-[11px] text-gray-400">图库 · 对比 · 评测</p>
                  </div>
                </Link>
                <Link href="/data-infra/" className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-purple-50/60 transition-colors group">
                  <span className="text-base">🔄</span>
                  <div>
                    <p className="text-sm font-medium text-gray-700 group-hover:text-[#6c5ce7]">闭环 Infra</p>
                    <p className="text-[11px] text-gray-400">数据湖仓 · MLOps</p>
                  </div>
                </Link>
                <Link href="/tools/" className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-purple-50/60 transition-colors group">
                  <span className="text-base">🧰</span>
                  <div>
                    <p className="text-sm font-medium text-gray-700 group-hover:text-[#6c5ce7]">工具箱</p>
                    <p className="text-[11px] text-gray-400">仿真导航 · Tokenizer</p>
                  </div>
                </Link>
              </div>
            </div>

            {/* 业务分组 */}
            <div className="bg-white rounded-2xl border border-cyan-100/60 p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-[#00cec9]" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#00cec9]/80">业务</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Link href="/vla/" className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-cyan-50/60 transition-colors group">
                  <span className="text-base">🚗</span>
                  <div>
                    <p className="text-sm font-medium text-gray-700 group-hover:text-[#00cec9]">自动驾驶 VLA</p>
                    <p className="text-[11px] text-gray-400">Seed-AD · DriveWorld</p>
                  </div>
                </Link>
                <Link href="/lab/" className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-cyan-50/60 transition-colors group">
                  <span className="text-base">🧪</span>
                  <div>
                    <p className="text-sm font-medium text-gray-700 group-hover:text-[#00cec9]">实验室</p>
                    <p className="text-[11px] text-gray-400">NeRF · 扩散模型</p>
                  </div>
                </Link>
                <Link href="/quant/" className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-cyan-50/60 transition-colors group col-span-2">
                  <span className="text-base">📈</span>
                  <div>
                    <p className="text-sm font-medium text-gray-700 group-hover:text-[#00cec9]">量化业务</p>
                    <p className="text-[11px] text-gray-400">策略体系 · 技术栈 · AI 量化</p>
                  </div>
                </Link>
              </div>
            </div>

            {/* 战略分组 */}
            <div className="bg-white rounded-2xl border border-orange-100/60 p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-[#e17055]" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#e17055]/80">战略</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Link href="/strategy/" className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-orange-50/60 transition-colors group">
                  <span className="text-base">🧭</span>
                  <div>
                    <p className="text-sm font-medium text-gray-700 group-hover:text-[#e17055]">业务原生</p>
                    <p className="text-[11px] text-gray-400">Palantir 模式 · 破局</p>
                  </div>
                </Link>
                <Link href="/idea/" className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-orange-50/60 transition-colors group">
                  <span className="text-base">💡</span>
                  <div>
                    <p className="text-sm font-medium text-gray-700 group-hover:text-[#e17055]">创业雷达</p>
                    <p className="text-[11px] text-gray-400">15 个方向 · 中国机会</p>
                  </div>
                </Link>
                <Link href="/economy/" className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-orange-50/60 transition-colors group">
                  <span className="text-base">🌐</span>
                  <div>
                    <p className="text-sm font-medium text-gray-700 group-hover:text-[#e17055]">经济研究</p>
                    <p className="text-[11px] text-gray-400">汇率 · 美联储 · 宏观</p>
                  </div>
                </Link>
                <Link href="/roadmap/" className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-orange-50/60 transition-colors group">
                  <span className="text-base">🗺️</span>
                  <div>
                    <p className="text-sm font-medium text-gray-700 group-hover:text-[#e17055]">Roadmap</p>
                    <p className="text-[11px] text-gray-400">平台演进路线</p>
                  </div>
                </Link>
              </div>
            </div>

            {/* 动态分组 */}
            <div className="bg-white rounded-2xl border border-green-100/60 p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-[#3fb950]" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#3fb950]/80">动态</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Link href="/news/" className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-green-50/60 transition-colors group">
                  <span className="text-base">🌊</span>
                  <div>
                    <p className="text-sm font-medium text-gray-700 group-hover:text-[#3fb950]">AI 声浪</p>
                    <p className="text-[11px] text-gray-400">每日聚合 · 7 大分类</p>
                  </div>
                </Link>
                <Link href="/industry-news/" className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-green-50/60 transition-colors group">
                  <span className="text-base">📡</span>
                  <div>
                    <p className="text-sm font-medium text-gray-700 group-hover:text-[#3fb950]">全行业动态</p>
                    <p className="text-[11px] text-gray-400">软件 · 云 · 安全</p>
                  </div>
                </Link>
                <Link href="/evolution/" className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-green-50/60 transition-colors group col-span-2">
                  <span className="text-base">📜</span>
                  <div>
                    <p className="text-sm font-medium text-gray-700 group-hover:text-[#3fb950]">进化日志</p>
                    <p className="text-[11px] text-gray-400">{stats.autoUpdates} 次自动进化 · 完整变更记录</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ 📡 本周快报（紧凑版） ═══════════════════ */}
      <section className="py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <span className="text-base">📡</span>
              <h2 className="text-lg font-semibold text-gray-800">本周快报</h2>
              {digest.totalNewItems > 0 && (
                <span className="px-2 py-0.5 text-[11px] font-medium bg-purple-50 text-purple-600 border border-purple-100 rounded-full">
                  +{digest.totalNewItems} 新增
                </span>
              )}
            </div>
            <span className="text-xs text-gray-400">过去 7 天 · 共 {digest.totalLogs} 次进化</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 新增文章 */}
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

            {/* 论文解读 */}
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
        </div>
      </section>

      {/* ═══════════════════ 进化日志（紧凑版） ═══════════════════ */}
      {logs.length > 0 && (
        <section className="py-8 border-t border-gray-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-base">📜</span>
                <h2 className="text-base font-semibold text-gray-700">最近进化</h2>
              </div>
              <Link href="/evolution/" className="text-xs text-[#6c5ce7] hover:text-[#5a4bd4] font-medium">查看全部 →</Link>
            </div>
            <div className="space-y-1.5">
              {logs.map((log, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/60 border border-gray-100/80">
                  <span className="text-sm flex-shrink-0">
                    {log.type === 'book' ? '📖' : log.type === 'article' ? '📝' : log.type === 'paper' ? '📄' : log.type === 'news' ? '🌊' : '🔄'}
                  </span>
                  <p className="text-sm text-gray-600 flex-1 min-w-0 truncate">{log.message}</p>
                  <span className="text-[11px] text-gray-300 font-mono flex-shrink-0">{log.date}</span>
                  <span className="text-[11px] text-[#a29bfe] flex-shrink-0">{log.agent}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </>
  );
}
