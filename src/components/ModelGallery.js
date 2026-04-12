'use client';

import { useState, useMemo } from 'react';

const categoryLabels = {
  all: { label: '全部', icon: '📋' },
  dense: { label: '密集模型', icon: '🧱' },
  moe: { label: 'MoE 稀疏', icon: '🔀' },
  ssm: { label: 'SSM/Mamba', icon: '🌊' },
  reasoning: { label: '推理增强', icon: '🧠' },
  small: { label: '小模型', icon: '🔬' },
  multimodal: { label: '多模态', icon: '👁️' },
  video: { label: '视频生成', icon: '🎬' },
  autonomous: { label: '自动驾驶', icon: '🚗' },
};

export default function ModelGallery({ models }) {
  const [activeType, setActiveType] = useState('all');
  const [activeTag, setActiveTag] = useState(null);
  const [expandedId, setExpandedId] = useState(models[0]?.id || null);

  // 收集所有 tags
  const allTags = useMemo(() => {
    const tagCount = {};
    models.forEach(m => (m.tags || []).forEach(t => { tagCount[t] = (tagCount[t] || 0) + 1; }));
    return Object.entries(tagCount).sort((a, b) => b[1] - a[1]);
  }, [models]);

  const filtered = models.filter(m => {
    if (activeType !== 'all' && m.type !== activeType) return false;
    if (activeTag && !(m.tags || []).includes(activeTag)) return false;
    return true;
  });

  return (
    <div>
      {/* Type Filter */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        <span className="text-xs text-gray-400 self-center mr-1">类型:</span>
        {Object.entries(categoryLabels).map(([key, val]) => {
          const count = key === 'all' ? models.length : models.filter(m => m.type === key).length;
          if (key !== 'all' && count === 0) return null;
          return (
            <button
              key={key}
              onClick={() => setActiveType(key)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-all ${
                activeType === key
                  ? 'bg-[#6c5ce7] text-white border-[#6c5ce7]'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-[#6c5ce7]/40'
              }`}
            >
              {val.icon} {val.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Tag Filter */}
      <div className="flex flex-wrap gap-1 mb-6">
        <span className="text-xs text-gray-400 self-center mr-1">标签:</span>
        {activeTag && (
          <button
            onClick={() => setActiveTag(null)}
            className="px-2 py-0.5 text-xs font-medium rounded-full bg-[#6c5ce7] text-white"
          >
            #{activeTag} ✕
          </button>
        )}
        {allTags.slice(0, 15).map(([tag, count]) => (
          tag !== activeTag && (
            <button
              key={tag}
              onClick={() => setActiveTag(tag)}
              className="px-2 py-0.5 text-xs text-gray-500 bg-gray-100 rounded-full hover:bg-[#6c5ce7]/10 hover:text-[#6c5ce7] transition-all"
            >
              #{tag} ({count})
            </button>
          )
        ))}
      </div>

      <p className="text-xs text-gray-400 mb-4">
        共 {filtered.length} 个模型
        {activeType !== 'all' && ` · ${categoryLabels[activeType]?.label}`}
        {activeTag && ` · #${activeTag}`}
      </p>

      {/* Model Cards */}
      <div className="space-y-4">
        {filtered.map(m => {
          const isExpanded = expandedId === m.id;
          const fs = m.factSheet;

          return (
            <div key={m.id} className="card rounded-xl overflow-hidden">
              {/* Header */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : m.id)}
                className="w-full p-5 text-left flex items-start gap-4 hover:bg-gray-50/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="text-base font-bold text-gray-900">{m.name}</h3>
                    <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-gray-100 text-gray-500">
                      {m.org}
                    </span>
                    <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${
                      m.status === 'open' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {m.status === 'open' ? '📖 开源' : '🔒 闭源'}
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-purple-50 text-purple-600">
                      {categoryLabels[m.category]?.icon} {categoryLabels[m.category]?.label}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mb-2">{m.keyInnovation}</p>
                  <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                    <span>📅 {m.date}</span>
                    <span>📐 {fs.params}</span>
                    <span>📏 {fs.context}</span>
                    <span>🧩 {fs.attention}</span>
                  </div>
                </div>
                <span className={`text-gray-300 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </button>

              {/* Expanded Detail */}
              {isExpanded && (
                <div className="border-t border-gray-100 p-5 bg-gray-50/30">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Fact Sheet */}
                    <div>
                      <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">📋 Fact Sheet</h4>
                      <div className="space-y-1.5">
                        {Object.entries(fs).map(([k, v]) => (
                          <div key={k} className="flex text-xs">
                            <span className="w-32 flex-shrink-0 text-gray-400 font-mono">{k}</span>
                            <span className="text-gray-700">{v}</span>
                          </div>
                        ))}
                      </div>

                      {/* Highlights */}
                      <h4 className="text-xs font-bold text-gray-500 uppercase mt-4 mb-2">✨ 亮点</h4>
                      <ul className="space-y-1">
                        {m.highlights.map((h, i) => (
                          <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                            <span className="text-purple-400 mt-0.5">•</span>{h}
                          </li>
                        ))}
                      </ul>

                      {/* Links */}
                      <div className="flex gap-3 mt-4">
                        {m.paperUrl && (
                          <a href={m.paperUrl} target="_blank" rel="noopener noreferrer"
                            className="px-3 py-1.5 text-xs font-medium bg-white border border-gray-200 rounded-lg hover:border-purple-300 transition-colors">
                            📄 论文
                          </a>
                        )}
                        {m.blogUrl && (
                          <a href={m.blogUrl} target="_blank" rel="noopener noreferrer"
                            className="px-3 py-1.5 text-xs font-medium bg-white border border-gray-200 rounded-lg hover:border-purple-300 transition-colors">
                            🔗 官方博客
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Architecture Diagram - Text */}
                    <div>
                      <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">🏗️ 架构图</h4>
                      <pre className="text-[10px] sm:text-[11px] leading-[1.4] text-gray-700 bg-gray-50 border border-gray-200 p-3 sm:p-4 rounded-lg overflow-x-auto font-mono whitespace-pre">
{m.textArch || '架构图待补充'}
                      </pre>
                      <p className="mt-2 text-[10px] text-gray-400 text-right">
                        参考来源: 各模型论文 ·{' '}
                        <a href="https://sebastianraschka.com/llm-architecture-gallery/" target="_blank" rel="noopener noreferrer" className="text-[#6c5ce7] hover:underline">
                          Sebastian Raschka Gallery ↗
                        </a>
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-3xl mb-3">🏛️</p>
          <p>暂无匹配的模型</p>
        </div>
      )}
    </div>
  );
}
