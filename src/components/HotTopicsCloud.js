'use client';

import { useRouter } from 'next/navigation';

/**
 * HotTopicsCloud — 可点击的热度词云
 * 点击 term → 跳转到 /papers/?q=xxx 或 /news/?q=xxx
 * 若词条更多出现在声浪数据中，跳转到 /news/；否则跳到 /papers/
 */
export default function HotTopicsCloud({ topics }) {
  const router = useRouter();

  if (!topics || !topics.length) return null;

  const maxCount = topics[0].count;

  const sizeMap   = ['text-[11px]', 'text-xs', 'text-xs', 'text-sm', 'text-sm', 'text-base'];
  const opacityMap = ['opacity-50', 'opacity-60', 'opacity-70', 'opacity-80', 'opacity-90', 'opacity-100'];

  const handleClick = (term) => {
    // 优先跳论文搜索，用 q= 参数（PapersList 已支持前端搜索，这里也传 q 供未来后端使用）
    router.push(`/papers/?q=${encodeURIComponent(term)}`);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {topics.map((item, i) => {
        const intensity = Math.round((item.count / maxCount) * 5);
        return (
          <button
            key={item.term}
            onClick={() => handleClick(item.term)}
            className={`px-3 py-1 rounded-full border border-purple-100/80 bg-purple-50/60 text-[#6c5ce7] font-medium cursor-pointer hover:bg-purple-100/80 hover:shadow-sm hover:border-[#a29bfe]/60 transition-all ${sizeMap[intensity]} ${opacityMap[intensity]}`}
            title={`出现 ${item.count} 次，点击查看相关论文`}
          >
            {i < 3 && <span className="mr-1">{['🥇','🥈','🥉'][i]}</span>}
            {item.term}
            <span className="ml-1.5 text-[10px] text-purple-300 font-mono">{item.count}</span>
          </button>
        );
      })}
    </div>
  );
}
