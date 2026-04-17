'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

// 所有导航条目，带分组色标
const NAV_ITEMS = [
  // 知识类
  { name: '书架',     href: '/books/',      group: 'knowledge' },
  { name: '文章',     href: '/articles/',   group: 'knowledge' },
  { name: '论文',     href: '/papers/',     group: 'knowledge' },
  { name: '模型',     href: '/models/',     group: 'knowledge' },
  { name: '数据闭环', href: '/data-infra/', group: 'knowledge' },
  { name: '工具箱',   href: '/tools/',      group: 'knowledge' },
  // 业务类
  { name: '自动驾驶', href: '/vla/',        group: 'business' },
  { name: '实验室',   href: '/lab/',        group: 'business' },
  // 战略类
  { name: '业务原生', href: '/strategy/',   group: 'strategy' },
  // 动态类
  { name: 'AI 声浪',  href: '/news/',       group: 'news' },
  { name: '进化日志', href: '/evolution/',  group: 'news' },
];

const GROUP_COLOR = {
  knowledge: '#6c5ce7',
  business:  '#00cec9',
  strategy:  '#e17055',
  news:      '#3fb950',
};

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-100/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">

        {/* 主行：Logo + 右侧状态 + 移动端汉堡 */}
        <div className="flex items-center justify-between h-11">
          <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#6c5ce7] to-[#a29bfe] flex items-center justify-center text-white font-bold text-xs shadow-sm shadow-purple-200/50 group-hover:shadow-purple-300/60 transition-shadow">
              S
            </div>
            <span className="text-sm font-semibold text-gray-900 tracking-tight">Signal</span>
          </Link>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-green-50/80 rounded-full border border-green-100/60">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full status-glow" />
              <span className="text-[11px] text-green-700 font-medium">自主进化中</span>
            </div>
            <button
              className="md:hidden p-1.5 rounded-lg hover:bg-gray-50"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                }
              </svg>
            </button>
          </div>
        </div>

        {/* 桌面导航：全部条目平铺，分组色点区分 */}
        <div className="hidden md:flex items-center gap-0 pb-1 overflow-x-auto scrollbar-none">
          {NAV_ITEMS.map((item, i) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href.replace(/\/$/, ''));
            const color = GROUP_COLOR[item.group];
            // 分组之间加竖线分隔
            const prevGroup = i > 0 ? NAV_ITEMS[i - 1].group : item.group;
            const showDivider = i > 0 && prevGroup !== item.group;

            return (
              <span key={item.href} className="flex items-center flex-shrink-0">
                {showDivider && (
                  <span className="w-px h-3.5 bg-gray-200 mx-1 flex-shrink-0" />
                )}
                <Link
                  href={item.href}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-[12px] font-medium rounded-lg transition-all whitespace-nowrap"
                  style={isActive
                    ? { color, background: color + '12' }
                    : { color: '#6b7280' }
                  }
                >
                  {/* 分组色点 */}
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0 transition-opacity"
                    style={{ background: color, opacity: isActive ? 1 : 0.35 }}
                  />
                  {item.name}
                </Link>
              </span>
            );
          })}
        </div>

        {/* 移动端菜单：按分组分区展示 */}
        {mobileOpen && (
          <div className="md:hidden pb-4 border-t border-gray-50 mt-0.5 pt-3 space-y-3">
            {[
              { key: 'knowledge', label: '知识' },
              { key: 'business',  label: '业务' },
              { key: 'strategy',  label: '战略' },
              { key: 'news',      label: '动态' },
            ].map(({ key, label }) => {
              const items = NAV_ITEMS.filter(n => n.group === key);
              const color = GROUP_COLOR[key];
              return (
                <div key={key}>
                  <div className="flex items-center gap-1.5 px-3 mb-1">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{label}</span>
                  </div>
                  <div className="space-y-0.5">
                    {items.map(item => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="block px-3 py-2 text-sm text-gray-600 hover:text-[#6c5ce7] hover:bg-purple-50/50 rounded-lg transition-colors"
                        onClick={() => setMobileOpen(false)}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </nav>
  );
}
