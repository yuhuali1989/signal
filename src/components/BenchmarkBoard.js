'use client';

import { useState } from 'react';

const categoryColors = {
  coding: 'bg-blue-50 text-blue-700 border-blue-200',
  reasoning: 'bg-purple-50 text-purple-700 border-purple-200',
  overall: 'bg-green-50 text-green-700 border-green-200',
  agent: 'bg-orange-50 text-orange-700 border-orange-200',
  cost: 'bg-amber-50 text-amber-700 border-amber-200',
};

export default function BenchmarkBoard({ benchmarks }) {
  const [activeBoard, setActiveBoard] = useState(benchmarks[0]?.id || '');

  const current = benchmarks.find(b => b.id === activeBoard) || benchmarks[0];

  return (
    <div>
      {/* Board Selector */}
      <div className="flex flex-wrap gap-2 mb-8">
        {benchmarks.map(b => (
          <button
            key={b.id}
            onClick={() => setActiveBoard(b.id)}
            className={`px-4 py-2 text-sm font-medium rounded-xl border transition-all ${
              activeBoard === b.id
                ? 'bg-maxwell-500 text-white border-maxwell-500 shadow-md shadow-maxwell-200'
                : 'bg-white text-gray-600 border-gray-200 hover:border-maxwell-300'
            }`}
          >
            {b.categoryIcon} {b.categoryName}
          </button>
        ))}
      </div>

      {current && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full border ${categoryColors[current.category] || ''}`}>
                {current.categoryIcon} {current.categoryName}
              </span>
              <span className="text-xs text-gray-400">{current.date}</span>
            </div>
            <h2 className="text-lg font-bold text-gray-900">{current.title}</h2>
            <p className="text-sm text-gray-500 mt-1">{current.description}</p>
          </div>

          {/* Leaderboard Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-gray-500 border-b border-gray-100">
                  <th className="text-left px-6 py-3 font-medium">#</th>
                  <th className="text-left px-4 py-3 font-medium">模型</th>
                  <th className="text-left px-4 py-3 font-medium">厂商</th>
                  <th className="text-right px-4 py-3 font-medium">综合分</th>
                  <th className="text-center px-4 py-3 font-medium">变化</th>
                  {current.category === 'cost' && (
                    <>
                      <th className="text-right px-4 py-3 font-medium">输入 $/M</th>
                      <th className="text-right px-4 py-3 font-medium">输出 $/M</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {current.models.map((m, i) => (
                  <tr
                    key={m.name}
                    className={`border-b border-gray-50 hover:bg-maxwell-50/30 transition-colors ${
                      i === 0 ? 'bg-amber-50/30' : ''
                    }`}
                  >
                    <td className="px-6 py-3.5">
                      <span className={`text-sm font-bold ${
                        i === 0 ? 'text-amber-500' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-orange-400' : 'text-gray-300'
                      }`}>
                        {m.badge || m.rank}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`text-sm font-semibold ${i === 0 ? 'text-gray-900' : 'text-gray-700'}`}>
                        {m.name}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs text-gray-400">{m.provider}</span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className={`text-sm font-bold ${
                        i === 0 ? 'text-maxwell-600' : 'text-gray-700'
                      }`}>
                        {current.category === 'cost' ? m.value_score : m.score}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`text-xs ${
                        m.change.includes('↑') ? 'text-green-500' : m.change.includes('↓') ? 'text-red-400' : 'text-gray-400'
                      }`}>
                        {m.change}
                      </span>
                    </td>
                    {current.category === 'cost' && (
                      <>
                        <td className="px-4 py-3.5 text-right text-xs text-gray-500">
                          ${m.input_price}
                        </td>
                        <td className="px-4 py-3.5 text-right text-xs text-gray-500">
                          ${m.output_price}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="px-6 py-3 bg-gray-50/50 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              📊 数据来源: LMSYS Arena · OpenCompass · SWE-bench · 各厂商官方数据 · Signal AI 综合评估
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
