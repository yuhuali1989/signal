'use client';

import { useState, useMemo } from 'react';

const CATEGORY_CONFIG = {
  '全部': { icon: '📊', color: 'maxwell' },
  '自动驾驶': { icon: '🚗', color: 'red' },
  '编码能力': { icon: '💻', color: 'blue' },
  '推理能力': { icon: '🧠', color: 'purple' },
  '综合能力': { icon: '📋', color: 'green' },
  'Agent 能力': { icon: '🤖', color: 'orange' },
};

export default function DatasetExplorer({ datasets }) {
  const [activeCategory, setActiveCategory] = useState('全部');
  const [activeTag, setActiveTag] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [reliabilityFilter, setReliabilityFilter] = useState('all');

  // 分类统计
  const categories = useMemo(() => {
    const cats = { '全部': datasets.length };
    datasets.forEach(d => {
      cats[d.category] = (cats[d.category] || 0) + 1;
    });
    return cats;
  }, [datasets]);

  // 提取所有 tag
  const allTags = useMemo(() => {
    const tagCount = {};
    datasets.forEach(d => {
      (d.tags || []).forEach(t => {
        tagCount[t] = (tagCount[t] || 0) + 1;
      });
    });
    return Object.entries(tagCount).sort((a, b) => b[1] - a[1]);
  }, [datasets]);

  // 可信度分级统计
  const reliabilityLevels = useMemo(() => {
    const levels = { all: datasets.length, excellent: 0, high: 0, medium: 0, low: 0, minimal: 0 };
    datasets.forEach(d => {
      const lv = d.contamination?.level;
      if (lv && levels[lv] !== undefined) levels[lv]++;
    });
    return levels;
  }, [datasets]);

  // 过滤
  const filtered = useMemo(() => {
    return datasets.filter(d => {
      if (activeCategory !== '全部' && d.category !== activeCategory) return false;
      if (activeTag && !(d.tags || []).includes(activeTag)) return false;
      if (reliabilityFilter !== 'all') {
        const lv = d.contamination?.level;
        if (lv !== reliabilityFilter) return false;
      }
      return true;
    });
  }, [datasets, activeCategory, activeTag, reliabilityFilter]);

  // 当前分类下的 tag
  const visibleTags = useMemo(() => {
    const base = activeCategory === '全部' ? datasets : datasets.filter(d => d.category === activeCategory);
    const tc = {};
    base.forEach(d => (d.tags || []).forEach(t => { tc[t] = (tc[t] || 0) + 1; }));
    return Object.entries(tc).sort((a, b) => b[1] - a[1]);
  }, [datasets, activeCategory]);

  return (
    <div>
      {/* 分类筛选 */}
      <div className="flex flex-wrap gap-2 mb-4">
        {Object.entries(categories).map(([cat, count]) => {
          const cfg = CATEGORY_CONFIG[cat] || { icon: '📁', color: 'gray' };
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => { setActiveCategory(cat); setActiveTag(null); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-all ${
                isActive
                  ? 'bg-maxwell-50 border-maxwell-300 text-maxwell-700 font-medium'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-maxwell-200'
              }`}
            >
              <span>{cfg.icon}</span>
              <span>{cat}</span>
              <span className={`text-xs ${isActive ? 'text-maxwell-500' : 'text-gray-400'}`}>({count})</span>
            </button>
          );
        })}
      </div>

      {/* Tag 筛选 */}
      {visibleTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-6">
          <button
            onClick={() => setActiveTag(null)}
            className={`px-2 py-0.5 text-xs rounded-md transition-all ${
              !activeTag ? 'bg-maxwell-100 text-maxwell-700 font-medium' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            全部 Tag
          </button>
          {visibleTags.map(([tag, count]) => (
            <button
              key={tag}
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              className={`px-2 py-0.5 text-xs rounded-md transition-all ${
                activeTag === tag ? 'bg-maxwell-100 text-maxwell-700 font-medium' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {tag} ({count})
            </button>
          ))}
        </div>
      )}

      {/* ✅ 评测可信度筛选 */}
      <div className="mb-6">
        <p className="text-xs text-gray-400 mb-2">✅ 评测可信度</p>
        <div className="flex flex-wrap gap-1.5">
          {[
            { key: 'all', label: '全部', icon: '' },
            { key: 'excellent', label: '高度可信 ≥90%', icon: '🟣' },
            { key: 'high', label: '较高可信 ≥70%', icon: '🟢' },
            { key: 'medium', label: '一般可信 ≥40%', icon: '🟡' },
            { key: 'low', label: '较低可信 ≥15%', icon: '🟠' },
            { key: 'minimal', label: '极低可信 <15%', icon: '🔴' },
          ].map(lv => {
            const count = reliabilityLevels[lv.key] || 0;
            const isActive = reliabilityFilter === lv.key;
            return (
              <button
                key={lv.key}
                onClick={() => setReliabilityFilter(isActive ? 'all' : lv.key)}
                className={`px-2.5 py-1 text-xs rounded-md border transition-all ${
                  isActive
                    ? 'bg-maxwell-500 text-white border-maxwell-500'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-maxwell-300'
                }`}
              >
                {lv.icon} {lv.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* 结果统计 */}
      <p className="text-sm text-gray-400 mb-4">
        共 {filtered.length} 个数据集
        {activeCategory !== '全部' && ` · ${activeCategory}`}
        {activeTag && ` · #${activeTag}`}
        {reliabilityFilter !== 'all' && ` · 🧪 ${reliabilityFilter}`}
      </p>

      {/* 数据集卡片列表 */}
      <div className="space-y-4">
        {filtered.map(ds => {
          const isExpanded = expandedId === ds.id;
          return (
            <div
              key={ds.id}
              className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:border-maxwell-200 transition-all"
            >
              {/* 卡片头部 */}
              <div
                className="p-5 cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : ds.id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {/* 分类 + Tags */}
                    <div className="flex flex-wrap items-center gap-1.5 mb-2">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                        ds.category === '自动驾驶'
                          ? 'bg-red-50 text-red-600'
                          : ds.category === '编码能力'
                          ? 'bg-blue-50 text-blue-600'
                          : ds.category === '推理能力'
                          ? 'bg-purple-50 text-purple-600'
                          : ds.category === 'Agent 能力'
                          ? 'bg-orange-50 text-orange-600'
                          : 'bg-green-50 text-green-600'
                      }`}>
                        {ds.category}
                      </span>
                      {(ds.tags || []).slice(0, 4).map(tag => (
                        <span key={tag} className="px-1.5 py-0.5 text-xs bg-gray-50 text-gray-500 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* 名称 */}
                    <h3 className="text-base font-semibold text-gray-900 mb-1">
                      {ds.name}
                    </h3>
                    <p className="text-xs text-gray-400 mb-2">{ds.fullName}</p>
                    <p className="text-sm text-gray-600 line-clamp-2">{ds.description}</p>
                  </div>

                  {/* 展开箭头 */}
                  <span className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                </div>

                {/* 关键指标预览 */}
                <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-500">
                  <span>📏 指标: {ds.metrics}</span>
                  <span>📦 规模: {ds.scale}</span>
                  <span>📖 来源: {ds.source}</span>
                  {ds.contamination && (
                    <span className={`font-medium ${
                      ds.contamination.level === 'excellent' ? 'text-purple-600' :
                      ds.contamination.level === 'high' ? 'text-green-600' :
                      ds.contamination.level === 'medium' ? 'text-yellow-600' :
                      ds.contamination.level === 'low' ? 'text-orange-600' :
                      'text-red-500'
                    }`}>
                      ✅ 可信度: {ds.contamination.score}%
                    </span>
                  )}
                </div>
              </div>

              {/* 展开详情 */}
              {isExpanded && (
                <div className="border-t border-gray-100 p-5 bg-gray-50/50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 mb-1.5">🔨 构建方式</h4>
                      <p className="text-sm text-gray-700">{ds.construction}</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 mb-1.5">📏 评测指标</h4>
                      <p className="text-sm text-gray-700">{ds.metrics}</p>
                    </div>
                  </div>

                  {/* 评测可信度 */}
                  {ds.contamination && (
                    <div className="mb-4 p-3 bg-white rounded-lg border border-gray-100">
                      <h4 className="text-xs font-semibold text-gray-500 mb-2">✅ 评测可信度</h4>
                      <div className="flex items-center gap-3 mb-1.5">
                        <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                          ds.contamination.level === 'excellent' ? 'bg-purple-100 text-purple-700' :
                          ds.contamination.level === 'high' ? 'bg-green-100 text-green-700' :
                          ds.contamination.level === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          ds.contamination.level === 'low' ? 'bg-orange-100 text-orange-700' :
                          ds.contamination.level === 'minimal' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-500'
                        }`}>
                          {ds.contamination.level === 'excellent' ? '🟣 高度可信' :
                           ds.contamination.level === 'high' ? '🟢 较高可信' :
                           ds.contamination.level === 'medium' ? '🟡 一般可信' :
                           ds.contamination.level === 'low' ? '🟠 较低可信' :
                           ds.contamination.level === 'minimal' ? '🔴 极低可信' :
                           '⚫ 未知'}
                        </span>
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              ds.contamination.score >= 80 ? 'bg-purple-500' :
                              ds.contamination.score >= 60 ? 'bg-green-500' :
                              ds.contamination.score >= 40 ? 'bg-yellow-500' :
                              ds.contamination.score >= 20 ? 'bg-orange-500' :
                              'bg-red-400'
                            }`}
                            style={{ width: `${ds.contamination.score}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono text-gray-500 w-8 text-right">{ds.contamination.score}%</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{ds.contamination.note}</p>
                    </div>
                  )}

                  {/* 排行榜 */}
                  {ds.topModels && ds.topModels.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-xs font-semibold text-gray-500 mb-2">🏆 SOTA 排行</h4>
                      <div className="space-y-1.5">
                        {ds.topModels.map((m, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                              i === 0 ? 'bg-yellow-100 text-yellow-700' :
                              i === 1 ? 'bg-gray-100 text-gray-600' :
                              i === 2 ? 'bg-orange-50 text-orange-600' :
                              'bg-gray-50 text-gray-400'
                            }`}>
                              {i + 1}
                            </span>
                            <span className="font-medium text-gray-800 min-w-[140px]">{m.name}</span>
                            <span className="text-maxwell-600 font-mono text-xs">{m.score}</span>
                            <span className="text-gray-400 text-xs ml-auto">{m.date}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 链接 */}
                  <div className="flex gap-3">
                    {ds.url && (
                      <a
                        href={ds.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-white border border-gray-200 rounded-lg hover:border-maxwell-300 hover:text-maxwell-600 transition-all"
                      >
                        🔗 官网
                      </a>
                    )}
                    {ds.paperUrl && (
                      <a
                        href={ds.paperUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-white border border-gray-200 rounded-lg hover:border-maxwell-300 hover:text-maxwell-600 transition-all"
                      >
                        📄 论文
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
