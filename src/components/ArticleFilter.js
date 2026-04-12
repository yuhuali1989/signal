'use client';

import { useState, useMemo } from 'react';
import ContentCard from '@/components/ContentCard';

export default function ArticleFilter({ articles }) {
  const [activeTag, setActiveTag] = useState('all');

  // 从所有文章中提取 tags 并统计
  const tagCounts = useMemo(() => {
    const counts = {};
    articles.forEach(art => {
      (art.tags || []).forEach(tag => {
        counts[tag] = (counts[tag] || 0) + 1;
      });
    });
    // 按数量排序
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([tag, count]) => ({ tag, count }));
  }, [articles]);

  const filtered = activeTag === 'all'
    ? articles
    : articles.filter(art => (art.tags || []).includes(activeTag));

  return (
    <div>
      {/* Tag Filter */}
      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => setActiveTag('all')}
          className={`px-3.5 py-1.5 text-sm font-medium rounded-full border transition-all ${
            activeTag === 'all'
              ? 'bg-maxwell-500 text-white border-maxwell-500'
              : 'bg-white text-gray-600 border-gray-200 hover:border-maxwell-300'
          }`}
        >
          全部 ({articles.length})
        </button>
        {tagCounts.map(({ tag, count }) => (
          <button
            key={tag}
            onClick={() => setActiveTag(tag)}
            className={`px-3.5 py-1.5 text-sm font-medium rounded-full border transition-all ${
              activeTag === tag
                ? 'bg-maxwell-500 text-white border-maxwell-500'
                : 'bg-white text-gray-600 border-gray-200 hover:border-maxwell-300'
            }`}
          >
            {tag} ({count})
          </button>
        ))}
      </div>

      {/* Articles Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(art => (
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

      {filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-3xl mb-3">📝</p>
          <p>暂无该标签的文章</p>
        </div>
      )}
    </div>
  );
}
