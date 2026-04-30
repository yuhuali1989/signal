'use client';

import { useState, useMemo, useRef, useEffect } from 'react';

const categoryColors = {
  purple: 'bg-purple-50 text-purple-700 border-purple-200',
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  green: 'bg-green-50 text-green-700 border-green-200',
  orange: 'bg-orange-50 text-orange-700 border-orange-200',
  yellow: 'bg-amber-50 text-amber-700 border-amber-200',
  red: 'bg-red-50 text-red-700 border-red-200',
};

function getWeekNumber(date) {
  const d = new Date(date);
  const start = new Date(d.getFullYear(), 0, 1);
  const diff = d - start + ((start.getTimezoneOffset() - d.getTimezoneOffset()) * 60000);
  return Math.ceil((diff / 86400000 + start.getDay() + 1) / 7);
}

function groupNewsByTimePeriod(news) {
  const groups = {};
  // 用字符串比较避免时区问题
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const todayStr = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;
  const sevenAgo = new Date(now);
  sevenAgo.setDate(sevenAgo.getDate() - 7);
  const sevenAgoStr = `${sevenAgo.getFullYear()}-${pad(sevenAgo.getMonth()+1)}-${pad(sevenAgo.getDate())}`;

  const monthNames = ['', '1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];

  news.forEach(item => {
    const dateStr = item.date; // "2026-04-11"
    const d = new Date(dateStr + 'T00:00:00');
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const day = d.getDate();
    let key, label, shortLabel, sortKey;

    if (dateStr >= sevenAgoStr && dateStr <= todayStr) {
      // 最近 7 天：按天
      key = dateStr;
      label = `${month} 月 ${day} 日`;
      shortLabel = `${month}/${day}`;
      sortKey = year * 10000 + month * 100 + day;
    } else if (year === 2026 && month >= 4) {
      // 2026年4月+（非最近7天）：按周
      const week = getWeekNumber(item.date);
      key = `${year}-W${week}`;
      label = `${year} 年 第 ${week} 周`;
      shortLabel = `W${week}`;
      sortKey = year * 10000 + month * 100 + day;
    } else if (year >= 2026 && month < 4) {
      // 2026年1-3月：按月
      key = `${year}-${pad(month)}`;
      label = `${year} 年 ${month} 月`;
      shortLabel = `${monthNames[month]}`;
      sortKey = year * 10000 + month * 100;
    } else {
      // 2025 及更早：按年
      key = `${year}`;
      label = `${year} 年`;
      shortLabel = `${year}`;
      sortKey = year * 10000;
    }

    if (!groups[key]) {
      groups[key] = { key, label, shortLabel, sortKey, items: [] };
    }
    groups[key].items.push(item);
  });

  return Object.values(groups).sort((a, b) => b.sortKey - a.sortKey);
}

export default function NewsFeed({ news, categories }) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [activePlatform, setActivePlatform] = useState('all');
  const [activeGroupKey, setActiveGroupKey] = useState(null);
  const contentRef = useRef(null);

  // 平台列表
  const platforms = useMemo(() => {
    const counts = {};
    news.forEach(n => {
      const p = n.platform || 'web';
      counts[p] = (counts[p] || 0) + 1;
    });
    return [
      { id: 'all', label: '全部', icon: '📡', count: news.length },
      { id: 'web', label: '网站', icon: '🌐', count: counts.web || 0 },
      { id: 'youtube', label: 'YouTube', icon: '🎬', count: counts.youtube || 0 },
      { id: 'podcast', label: '播客', icon: '🎙️', count: counts.podcast || 0 },
      { id: 'x', label: 'X/推特', icon: '𝕏', count: counts.x || 0 },
    ].filter(p => p.id === 'all' || p.count > 0);
  }, [news]);

  const filtered = useMemo(() => {
    let items = news;
    if (activeCategory !== 'all') {
      items = items.filter(n => n.category === activeCategory);
    }
    if (activePlatform !== 'all') {
      items = items.filter(n => (n.platform || 'web') === activePlatform);
    }
    return items;
  }, [news, activeCategory, activePlatform]);

  const groups = useMemo(() => groupNewsByTimePeriod(filtered), [filtered]);

  // 设置初始 active group
  useEffect(() => {
    if (groups.length > 0 && !activeGroupKey) {
      setActiveGroupKey(groups[0].key);
    }
  }, [groups, activeGroupKey]);

  // 监听右侧滚动，自动高亮对应时间段
  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;

    const handleScroll = () => {
      const groupEls = container.querySelectorAll('[data-group-key]');
      let current = null;
      for (const el of groupEls) {
        const rect = el.getBoundingClientRect();
        if (rect.top <= 200) {
          current = el.getAttribute('data-group-key');
        }
      }
      if (current && current !== activeGroupKey) {
        setActiveGroupKey(current);
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [activeGroupKey]);

  const scrollToGroup = (key) => {
    setActiveGroupKey(key);
    const el = document.getElementById(`group-${key}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-6 pb-4 border-b border-gray-100">
        {/* Category */}
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-1 text-xs font-medium rounded-full border transition-all ${
              activeCategory === 'all'
                ? 'bg-maxwell-500 text-white border-maxwell-500'
                : 'bg-white text-gray-600 border-gray-200 hover:border-maxwell-300'
            }`}
          >
            全部 ({news.length})
          </button>
          {categories.filter(c => c.count > 0).map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1 text-xs font-medium rounded-full border transition-all ${
                activeCategory === cat.id
                  ? 'bg-maxwell-500 text-white border-maxwell-500'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-maxwell-300'
              }`}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="hidden sm:block w-px h-5 bg-gray-200 flex-shrink-0" />

        {/* Platform */}
        <div className="flex flex-wrap gap-1.5">
          {platforms.filter(p => p.id !== 'all').map(p => (
            <button
              key={p.id}
              onClick={() => setActivePlatform(p.id === activePlatform ? 'all' : p.id)}
              className={`px-3 py-1 text-xs font-medium rounded-full border transition-all ${
                activePlatform === p.id
                  ? 'bg-gray-800 text-white border-gray-800'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
              }`}
            >
              {p.icon} {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Layout: Sidebar Timeline + Content */}
      <div className="flex gap-0">

        {/* Left: Vertical Timeline Sidebar */}
        <div className="hidden md:block w-20 flex-shrink-0 sticky top-20 self-start">
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[27px] top-0 bottom-0 w-px bg-gray-200" />

            {/* Timeline nodes */}
            <div className="space-y-1 py-2">
              {groups.map((g) => {
                const isActive = activeGroupKey === g.key;
                return (
                  <button
                    key={g.key}
                    onClick={() => scrollToGroup(g.key)}
                    className={`relative flex items-center gap-2 w-full text-left pl-5 pr-1 py-1.5 rounded-r-lg transition-all ${
                      isActive
                        ? 'bg-maxwell-50'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    {/* Dot */}
                    <div className={`absolute left-[23px] w-[9px] h-[9px] rounded-full border-2 transition-all ${
                      isActive
                        ? 'bg-maxwell-500 border-maxwell-500 scale-125'
                        : 'bg-white border-gray-300'
                    }`} />

                    {/* Label */}
                    <span className={`text-xs font-medium ml-4 truncate transition-colors ${
                      isActive ? 'text-maxwell-600' : 'text-gray-400'
                    }`}>
                      {g.shortLabel}
                    </span>

                    {/* Count badge */}
                    <span className={`text-[10px] ml-auto flex-shrink-0 ${
                      isActive ? 'text-maxwell-400' : 'text-gray-300'
                    }`}>
                      {g.items.length}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: News Content */}
        <div className="flex-1 min-w-0" ref={contentRef}>
          <div className="space-y-8">
            {groups.map(g => (
              <div key={g.key} id={`group-${g.key}`} data-group-key={g.key}>
                {/* Group Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className=" w-3 h-3 rounded-full bg-maxwell-400 flex-shrink-0" />
                  <h3 className="text-sm font-bold text-gray-700">{g.label}</h3>
                  <div className="h-px bg-gray-100 flex-1" />
                  <span className="text-xs text-gray-400">{g.items.length} 条</span>
                </div>

                {/* News Cards */}
                <div className="space-y-3 md:pl-0 pl-6 md:border-l-0 border-l-2 border-gray-100 md:ml-0 ml-1.5">
                  {g.items.map(item => {
                    const hasUrl = item.url && item.url !== '#';
                    const domain = hasUrl ? item.url.replace(/^https?:\/\//, '').split('/')[0] : null;
                    const isSummary = item.type === 'summary';

                    const CardTag = hasUrl ? 'a' : 'div';
                    const cardProps = hasUrl ? {
                      href: item.url,
                      target: '_blank',
                      rel: 'noopener noreferrer',
                    } : {};

                    return (
                      <CardTag
                        key={item.id}
                        {...cardProps}
                        className={`block rounded-xl border p-4 no-underline transition-all ${
                          isSummary
                            ? 'bg-gradient-to-r from-maxwell-50 to-blue-50 border-maxwell-200 hover:border-maxwell-400'
                            : item.importance >= 5
                            ? 'bg-amber-50/40 border-amber-200/70 hover:border-amber-300'
                            : 'card-hover bg-white border-gray-100 hover:border-maxwell-200'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                              <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${categoryColors[item.categoryColor] || 'bg-gray-50 text-gray-600'}`}>
                                {item.categoryIcon} {item.categoryName}
                              </span>
                              <span className="text-xs text-gray-400">{item.source}</span>
                              <span className="text-xs text-gray-300">·</span>
                              <span className="text-xs text-gray-400">{item.date}</span>
                              {/* 重要性标注 */}
                              {item.importance >= 4 && (
                                <span className="ml-auto flex items-center gap-0.5 text-amber-400 text-xs" title={`重要性 ${item.importance}/5`}>
                                  {Array.from({ length: Math.min(item.importance, 5) }).map((_, i) => (
                                    <svg key={i} className="w-3 h-3 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                  ))}
                                </span>
                              )}
                            </div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-1 leading-snug">
                          {item.platformIcon && item.platform !== 'web' && (
                            <span className="mr-1.5">{item.platformIcon}</span>
                          )}
                          {item.title}
                        </h4>
                            {item.summary && (
                              <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                                {item.summary}
                              </p>
                            )}
                            {/* 「为什么重要」字段 */}
                            {item.whyMatters && (
                              <div className="mt-2 flex items-start gap-1.5 px-2.5 py-1.5 bg-amber-50 rounded-lg border border-amber-100">
                                <span className="text-amber-400 text-xs flex-shrink-0 mt-0.5">💡</span>
                                <p className="text-xs text-amber-700 leading-relaxed">{item.whyMatters}</p>
                              </div>
                            )}
                            {domain && (
                              <p className="mt-1.5 text-xs text-maxwell-400 truncate">🔗 {domain}</p>
                            )}
                          </div>
                          {hasUrl && (
                            <div className="flex-shrink-0 mt-1 text-gray-300">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </CardTag>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <p className="text-3xl mb-3">📡</p>
              <p>暂无该分类的声浪</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
