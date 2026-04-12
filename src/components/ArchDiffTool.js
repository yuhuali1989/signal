'use client';

import { useState } from 'react';

export default function ArchDiffTool({ models }) {
  const [modelA, setModelA] = useState('');
  const [modelB, setModelB] = useState('');
  const [isOpen, setIsOpen] = useState(true);

  const a = models.find(m => m.id === modelA);
  const b = models.find(m => m.id === modelB);

  const compareFields = [
    { key: 'params', label: '参数量' },
    { key: 'arch', label: '架构类型' },
    { key: 'context', label: '上下文长度' },
    { key: 'vocab', label: '词表大小' },
    { key: 'layers', label: '层数' },
    { key: 'hiddenSize', label: '隐藏维度' },
    { key: 'heads', label: '注意力头数' },
    { key: 'kvHeads', label: 'KV 头数' },
    { key: 'activation', label: '激活函数' },
    { key: 'normalization', label: '归一化' },
    { key: 'posEncoding', label: '位置编码' },
    { key: 'attention', label: '注意力机制' },
    { key: 'training', label: '训练数据量' },
    { key: 'license', label: '开源许可' },
  ];

  return (
    <div className="mb-10">
      {/* Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-[#6c5ce7] transition-colors mb-4"
      >
        <span className={`transition-transform ${isOpen ? 'rotate-90' : ''}`}>▶</span>
        架构对比工具
      </button>

      {isOpen && (
        <div className="card p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-1">
            架构对比工具
          </h3>
          <p className="text-sm text-gray-500 mb-5">
            选择两个模型进行架构参数并排对比，快速发现差异
          </p>

          {/* Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase mb-1.5 block">模型 A</label>
              <select
                value={modelA}
                onChange={e => setModelA(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:border-[#6c5ce7] focus:ring-1 focus:ring-[#6c5ce7] outline-none"
              >
                <option value="">选择模型</option>
                {models.map(m => (
                  <option key={m.id} value={m.id} disabled={m.id === modelB}>
                    {m.name} ({m.params})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase mb-1.5 block">模型 B</label>
              <select
                value={modelB}
                onChange={e => setModelB(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:border-[#6c5ce7] focus:ring-1 focus:ring-[#6c5ce7] outline-none"
              >
                <option value="">选择模型</option>
                {models.map(m => (
                  <option key={m.id} value={m.id} disabled={m.id === modelA}>
                    {m.name} ({m.params})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => { const t = modelA; setModelA(modelB); setModelB(t); }}
              disabled={!modelA || !modelB}
              className="px-4 py-1.5 text-xs font-medium border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-all"
            >
              ⇄ 交换
            </button>
            <button
              onClick={() => { setModelA(''); setModelB(''); }}
              className="px-4 py-1.5 text-xs font-medium border border-gray-200 rounded-lg hover:bg-gray-50 transition-all"
            >
              清空
            </button>
          </div>

          {/* Comparison Table */}
          {a && b && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2.5 px-3 text-xs font-bold text-gray-400 uppercase w-1/4">参数</th>
                    <th className="text-left py-2.5 px-3 text-xs font-bold text-[#6c5ce7] uppercase w-[37.5%]">
                      {a.name}
                    </th>
                    <th className="text-left py-2.5 px-3 text-xs font-bold text-orange-500 uppercase w-[37.5%]">
                      {b.name}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {compareFields.map(f => {
                    const va = a.factSheet?.[f.key] || a[f.key] || '—';
                    const vb = b.factSheet?.[f.key] || b[f.key] || '—';
                    const isDiff = va !== vb;
                    return (
                      <tr key={f.key} className={`border-b border-gray-50 ${isDiff ? 'bg-amber-50/30' : ''}`}>
                        <td className="py-2 px-3 text-xs text-gray-500 font-medium">{f.label}</td>
                        <td className="py-2 px-3 text-xs text-gray-800 font-mono">{va}</td>
                        <td className="py-2 px-3 text-xs text-gray-800 font-mono">{vb}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Architecture images side by side */}
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div>
                  <p className="text-xs font-bold text-[#6c5ce7] mb-2">{a.name}</p>
                  <div className="rounded-lg border border-gray-200 overflow-hidden bg-white p-3">
                    <table className="w-full text-xs">
                      <tbody>
                        {compareFields.slice(0, 7).map(f => (
                          <tr key={f.key} className="border-b border-gray-50">
                            <td className="py-1 text-gray-400 font-mono w-1/3">{f.label}</td>
                            <td className="py-1 text-gray-700 font-medium">{a.factSheet?.[f.key] || a[f.key] || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-orange-500 mb-2">{b.name}</p>
                  <div className="rounded-lg border border-gray-200 overflow-hidden bg-white p-3">
                    <table className="w-full text-xs">
                      <tbody>
                        {compareFields.slice(0, 7).map(f => (
                          <tr key={f.key} className="border-b border-gray-50">
                            <td className="py-1 text-gray-400 font-mono w-1/3">{f.label}</td>
                            <td className="py-1 text-gray-700 font-medium">{b.factSheet?.[f.key] || b[f.key] || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Prompt when nothing selected */}
          {(!a || !b) && (
            <div className="text-center py-8 text-gray-300">
              <p className="text-3xl mb-2">⚖️</p>
              <p className="text-sm">选择两个模型开始对比</p>
            </div>  )}
        </div>
      )}

      {/* Quick model tags */}
      <div className="flex flex-wrap gap-1.5 mb-6">
        {models.map(m => (
          <button
            key={m.id}
            onClick={() => {
              if (!isOpen) setIsOpen(true);
              if (!modelA) setModelA(m.id);
              else if (!modelB && m.id !== modelA) setModelB(m.id);
            }}
            className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-all ${
              m.id === modelA
                ? 'bg-[#6c5ce7] text-white border-[#6c5ce7]'
                : m.id === modelB
                  ? 'bg-orange-500 text-white border-orange-500'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-[#6c5ce7]'
            }`}
          >
            {m.name} ({m.params})
          </button>
        ))}
      </div>
    </div>
  );
}
