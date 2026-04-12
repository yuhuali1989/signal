'use client';

import { useState } from 'react';
import DatasetExplorer from '@/components/DatasetExplorer';
import BenchmarkBoard from '@/components/BenchmarkBoard';

export default function BenchmarkTabs({ datasets, benchmarks }) {
  const [activeTab, setActiveTab] = useState('datasets');

  return (
    <>
      {/* ── Tab 导航（有激活态） ── */}
      <div className="flex gap-1 mb-10 p-1 bg-gray-50 rounded-xl border border-gray-100 w-fit">
        <button
          onClick={() => setActiveTab('datasets')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
            activeTab === 'datasets'
              ? 'bg-white text-[#6c5ce7] shadow-sm border border-gray-100'
              : 'text-gray-500 hover:text-[#6c5ce7] hover:bg-white/60'
          }`}
        >
          🗂️ 数据集浏览
        </button>
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
            activeTab === 'leaderboard'
              ? 'bg-white text-[#6c5ce7] shadow-sm border border-gray-100'
              : 'text-gray-500 hover:text-[#6c5ce7] hover:bg-white/60'
          }`}
        >
          🏆 模型排行榜
        </button>
      </div>

      {/* ── Section 1：数据集浏览器 ── */}
      {activeTab === 'datasets' && (
        <section>
          <div className="flex items-center gap-2 mb-5">
            <span className="text-lg">🗂️</span>
            <h2 className="text-lg font-semibold text-gray-800">数据集浏览</h2>
            <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-purple-50 text-purple-600 border border-purple-100 rounded-full">
              {datasets.length} 个
            </span>
          </div>
          <DatasetExplorer datasets={datasets} />
        </section>
      )}

      {/* ── Section 2：模型排行榜 ── */}
      {activeTab === 'leaderboard' && (
        <section>
          <div className="flex items-center gap-2 mb-5">
            <span className="text-lg">🏆</span>
            <h2 className="text-lg font-semibold text-gray-800">模型能力排行榜</h2>
          </div>
          <p className="text-sm text-gray-500 mb-6">
            综合 LMSYS Arena、SWE-bench、GPQA 等主流 Benchmark 数据
          </p>
          <BenchmarkBoard benchmarks={benchmarks} />
        </section>
      )}
    </>
  );
}
