'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';

const catColors = {
  purple: 'bg-purple-50 text-purple-700 border-purple-200',
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  green: 'bg-green-50 text-green-700 border-green-200',
  orange: 'bg-orange-50 text-orange-700 border-orange-200',
};

// tag 的样式映射
const tagStyles = {
  'llm':    'bg-violet-50 text-violet-600 border-violet-200',
  '多模态': 'bg-sky-50 text-sky-600 border-sky-200',
  '自动驾驶': 'bg-emerald-50 text-emerald-600 border-emerald-200',
  'vla':    'bg-rose-50 text-rose-600 border-rose-200',
  '世界模型': 'bg-amber-50 text-amber-600 border-amber-200',
  '推理优化': 'bg-teal-50 text-teal-600 border-teal-200',
  '强化学习': 'bg-indigo-50 text-indigo-600 border-indigo-200',
  '基础架构': 'bg-gray-100 text-gray-600 border-gray-200',
};

const tagIcons = {
  'llm':    '🤖',
  '多模态': '👁️',
  '自动驾驶': '🚗',
  'vla':    '🦾',
  '世界模型': '🌍',
  '推理优化': '⚡',
  '强化学习': '🎯',
  '基础架构': '🏗️',
};

// 固定展示顺序
const TAG_ORDER = ['llm', '多模态', '自动驾驶', 'vla', '世界模型', '推理优化', '强化学习', '基础架构'];

export default function PapersList({ papers, categories }) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeTag, setActiveTag] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // 从所有论文中收集出现过的 tag，按固定顺序排列
  const availableTags = useMemo(() => {
    const tagSet = new Set();
    papers.forEach(p => (p.tags || []).forEach(t => tagSet.add(t)));
    return TAG_ORDER.filter(t => tagSet.has(t));
  }, [papers]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return papers.filter(p => {
      const catMatch = activeCategory === 'all' || p.category === activeCategory;
      const tagMatch = activeTag === 'all' || (p.tags || []).includes(activeTag);
      const searchMatch = !q ||
        (p.title || '').toLowerCase().includes(q) ||
        (p.authors || '').toLowerCase().includes(q) ||
        (p.venue || '').toLowerCase().includes(q) ||
        (p.tags || []).some(t => t.toLowerCase().includes(q));
      return catMatch && tagMatch && searchMatch;
    });
  }, [papers, activeCategory, activeTag, searchQuery]);

  const catMap = {};
  categories.forEach(c => { catMap[c.id] = c; });

  return (
    <div>
      {/* ── 搜索框 ── */}
      <div className="relative mb-5">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 text-sm">🔍</span>
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="搜索论文标题、作者、venue、标签…"
          className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#6c5ce7]/50 focus:ring-2 focus:ring-[#6c5ce7]/10 bg-white placeholder-gray-300"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 text-xs"
          >✕</button>
        )}
      </div>

      {/* ── Category Filter ── */}
      <div className="flex flex-wrap gap-2 mb-3">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-3.5 py-1.5 text-sm font-medium rounded-full border transition-all ${
            activeCategory === 'all'
              ? 'bg-maxwell-500 text-white border-maxwell-500'
              : 'bg-white text-gray-600 border-gray-200 hover:border-maxwell-300'
          }`}
        >
          全部 ({papers.length})
        </button>
        {categories.map(cat => {
          const count = papers.filter(p => p.category === cat.id).length;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3.5 py-1.5 text-sm font-medium rounded-full border transition-all ${
                activeCategory === cat.id
                  ? 'bg-maxwell-500 text-white border-maxwell-500'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-maxwell-300'
              }`}
            >
              {cat.icon} {cat.name} ({count})
            </button>
          );
        })}
      </div>

      {/* ── Tag Filter ── */}
      <div className="flex flex-wrap gap-2 mb-8 pb-6 border-b border-gray-100">
        <button
          onClick={() => setActiveTag('all')}
          className={`px-3 py-1 text-xs font-medium rounded-full border transition-all ${
            activeTag === 'all'
              ? 'bg-gray-700 text-white border-gray-700'
              : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
          }`}
        >
          # 全部主题
        </button>
        {availableTags.map(tag => {
          const count = papers.filter(p => (p.tags || []).includes(tag)).length;
          const style = tagStyles[tag] || 'bg-gray-100 text-gray-600 border-gray-200';
          const icon = tagIcons[tag] || '#';
          return (
            <button
              key={tag}
              onClick={() => setActiveTag(tag)}
              className={`px-3 py-1 text-xs font-medium rounded-full border transition-all ${
                activeTag === tag
                  ? 'bg-gray-700 text-white border-gray-700'
                  : `${style} hover:opacity-80`
              }`}
            >
              {icon} {tag} ({count})
            </button>
          );
        })}
      </div>

      {/* ── Papers Grid ── */}
      {searchQuery && (
        <div className="mb-3 text-xs text-gray-400">
          找到 <span className="font-semibold text-gray-600">{filtered.length}</span> 篇结果
          {filtered.length === 0 && <span className="ml-2 text-gray-300">· 试试其他关键词</span>}
        </div>
      )}
      <div className="space-y-4">
        {filtered.map(paper => {
          const cat = catMap[paper.category] || {};
          return (
            <div key={paper.id} className="card-hover bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  {/* Category + Venue + Importance */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${catColors[cat.color] || ''}`}>
                      {cat.icon} {cat.name}
                    </span>
                    <span className="text-xs text-gray-400 font-mono">{paper.venue}</span>
                    <span className="flex items-center gap-0.5" title={`重要性 ${paper.importance}/5`}>
                      {[1,2,3,4,5].map(i => (
                        <span
                          key={i}
                          className={`inline-block w-1.5 h-1.5 rounded-full ${
                            i <= paper.importance
                              ? i <= 2 ? 'bg-amber-400' : i <= 4 ? 'bg-orange-400' : 'bg-red-400'
                              : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-semibold text-gray-900 mb-1">
                    {paper.hasReview ? (
                      <Link href={`/papers/${paper.id}/`} className="hover:text-maxwell-600 transition-colors">
                        {paper.title}
                      </Link>
                    ) : paper.arxivUrl ? (
                      <a href={paper.arxivUrl} target="_blank" rel="noopener noreferrer" className="hover:text-maxwell-600 transition-colors">
                        {paper.title}
                      </a>
                    ) : (
                      paper.title
                    )}
                  </h3>

                  {/* Authors */}
                  <p className="text-xs text-gray-400 mb-2">{paper.authors}</p>

                  {/* Summary */}
                  <p className="text-sm text-gray-500">{paper.summary}</p>

                  {/* Tags */}
                  {paper.tags && paper.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {paper.tags.map(tag => {
                        const style = tagStyles[tag] || 'bg-gray-100 text-gray-500 border-gray-200';
                        const icon = tagIcons[tag] || '#';
                        return (
                          <button
                            key={tag}
                            onClick={() => setActiveTag(activeTag === tag ? 'all' : tag)}
                            className={`px-2 py-0.5 text-xs rounded-full border transition-all hover:opacity-80 ${
                              activeTag === tag ? 'ring-1 ring-offset-1 ring-gray-400' : ''
                            } ${style}`}
                          >
                            {icon} {tag}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex items-center gap-3 mt-3">
                    {paper.arxivUrl && paper.arxivUrl !== '#' && (
                      <a
                        href={paper.arxivUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 font-medium"
                      >
                        📎 论文原文 ↗
                      </a>
                    )}
                    {paper.hasReview && (
                      <Link
                        href={`/papers/${paper.id}/`}
                        className="inline-flex items-center gap-1 text-sm text-maxwell-500 hover:text-maxwell-700 font-medium"
                      >
                        📖 阅读解读 →
                      </Link>
                    )}
                    {!paper.hasReview && (
                      <span className="text-xs text-gray-300">解读撰写中...</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-3xl mb-3">📄</p>
          <p>暂无该分类的论文</p>
        </div>
      )}
    </div>
  );
}
