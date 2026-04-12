/**
 * ResearchTrends — 研究趋势区块（纯展示，无状态，服务端安全）
 * 展示四大研究方向的论文数量 / 精读数 / 重要性 / 近期热度
 */

const barColors = {
  arch:      { bar: 'bg-purple-400', bg: 'bg-purple-50',  border: 'border-purple-100', text: 'text-purple-700' },
  alignment: { bar: 'bg-blue-400',   bg: 'bg-blue-50',    border: 'border-blue-100',   text: 'text-blue-700'   },
  inference: { bar: 'bg-green-400',  bg: 'bg-green-50',   border: 'border-green-100',  text: 'text-green-700'  },
  data:      { bar: 'bg-orange-400', bg: 'bg-orange-50',  border: 'border-orange-100', text: 'text-orange-700' },
};

export default function ResearchTrends({ trends }) {
  if (!trends || trends.length === 0) return null;

  const maxTotal = Math.max(...trends.map(t => t.total), 1);

  return (
    <section className="mb-10 p-5 rounded-2xl bg-gray-50/70 border border-gray-100">
      <div className="flex items-center gap-2 mb-5">
        <span className="text-sm font-semibold text-gray-700">📈 研究方向热度</span>
        <span className="text-xs text-gray-400">· 论文覆盖 / 精读完成 / 重点程度</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {trends.map(t => {
          const c = barColors[t.id] || barColors.arch;
          const pct = Math.round((t.total / maxTotal) * 100);
          const reviewedPct = t.total > 0 ? Math.round((t.reviewed / t.total) * 100) : 0;

          return (
            <div
              key={t.id}
              className={`rounded-xl border ${c.border} ${c.bg} p-4`}
            >
              {/* 标题行 */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{t.icon}</span>
                  <span className={`text-sm font-semibold ${c.text}`}>{t.name}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  {t.recent > 0 && (
                    <span className="px-1.5 py-0.5 rounded-md bg-white/70 border border-gray-200 text-gray-500">
                      🔥 近期 {t.recent}
                    </span>
                  )}
                </div>
              </div>

              {/* 进度条：总量 */}
              <div className="mb-2">
                <div className="flex items-center justify-between text-[11px] text-gray-400 mb-1">
                  <span>论文覆盖</span>
                  <span className="font-mono">{t.total} 篇</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/60 border border-gray-200 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${c.bar}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              {/* 进度条：精读完成率 */}
              <div className="mb-3">
                <div className="flex items-center justify-between text-[11px] text-gray-400 mb-1">
                  <span>精读完成</span>
                  <span className="font-mono">{t.reviewed}/{t.total} ({reviewedPct}%)</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/60 border border-gray-200 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gray-400/60"
                    style={{ width: `${reviewedPct}%` }}
                  />
                </div>
              </div>

              {/* 底部统计 */}
              <div className="flex items-center gap-3 text-[11px] text-gray-500">
                <span>⭐ 重要性满分 <strong className={c.text}>{t.critical}</strong> 篇</span>
                <span className="text-gray-300">|</span>
                <span className="text-xs text-gray-400 leading-tight">{t.description}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
