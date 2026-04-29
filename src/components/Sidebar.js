
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

const NAV_GROUPS = [
  {
    key: 'knowledge',
    label: '知识',
    color: '#6c5ce7',
    items: [
      { name: '书架',     href: '/books/',      icon: '📖' },
      { name: '文章',     href: '/articles/',   icon: '📝' },
      { name: '论文',     href: '/papers/',     icon: '🔬' },
      { name: '模型',     href: '/models/',     icon: '📊' },
      { name: '闭环 Infra', href: '/data-infra/', icon: '🔄' },
      { name: '工具箱',   href: '/tools/',      icon: '🧰' },
    ],
  },
  {
    key: 'business',
    label: '业务',
    color: '#00cec9',
    items: [
      { name: '自动驾驶', href: '/vla/',     icon: '🚗' },
      { name: '广告业务', href: '/ads/',     icon: '📣' },
      { name: '金融业务', href: '/finance/', icon: '🏦' },
      { name: '实验室',   href: '/lab/',     icon: '🧪' },
      { name: '量化业务', href: '/quant/',   icon: '📈' },
    ],
  },
  {
    key: 'strategy',
    label: '战略',
    color: '#e17055',
    items: [
      { name: '业务原生',    href: '/strategy/', icon: '🧭' },
      { name: '创业雷达',    href: '/idea/',     icon: '💡' },
      { name: '经济研究',    href: '/economy/',  icon: '🌐' },
      { name: 'Roadmap 建议', href: '/roadmap/', icon: '🗺️' },
    ],
  },
  {
    key: 'news',
    label: '动态',
    color: '#3fb950',
    items: [
      { name: 'AI 声浪',    href: '/news/',            icon: '🌊' },
      { name: '全行业动态', href: '/industry-news/',   icon: '📡' },
      { name: '进化日志',   href: '/evolution/',       icon: '📜' },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // 路由变化时关闭移动端菜单
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const isActive = (href) => {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname?.startsWith(href.replace(/\/$/, ''));
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} px-4 h-14 flex-shrink-0 border-b border-gray-100/80`}>
        <Link href="/" className="flex items-center gap-2.5 group" onClick={() => setMobileOpen(false)}>
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#6c5ce7] to-[#a29bfe] flex items-center justify-center text-white font-bold text-sm shadow-sm shadow-purple-200/50 group-hover:shadow-purple-300/60 transition-shadow flex-shrink-0">
            S
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-bold text-gray-900 tracking-tight leading-none">Signal</span>
              <span className="text-[9px] text-gray-400 leading-none mt-0.5">从噪声中提取前沿信号</span>
            </div>
          )}
        </Link>
        {/* 桌面端折叠按钮 */}
        {!collapsed && (
          <button
            className="hidden md:flex w-6 h-6 items-center justify-center rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            onClick={() => setCollapsed(true)}
            title="收起侧边栏"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7" />
            </svg>
          </button>
        )}
      </div>

      {/* 状态指示 */}
      <div className={`px-4 py-2.5 flex-shrink-0 ${collapsed ? 'px-2' : ''}`}>
        {collapsed ? (
          <div className="flex justify-center">
            <span className="w-2 h-2 bg-green-500 rounded-full status-glow" />
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-green-50/80 rounded-lg border border-green-100/60">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full status-glow" />
            <span className="text-[11px] text-green-700 font-medium">自主进化中</span>
          </div>
        )}
      </div>

      {/* 导航分组 */}
      <nav className="flex-1 overflow-y-auto px-3 py-1 space-y-4 scrollbar-none">
        {NAV_GROUPS.map(group => (
          <div key={group.key}>
            {/* 分组标题 */}
            {collapsed ? (
              <div className="flex justify-center mb-1.5">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: group.color }} />
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-2 mb-1">
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: group.color }} />
                <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: group.color + 'cc' }}>
                  {group.label}
                </span>
              </div>
            )}

            {/* 导航项 */}
            <div className="space-y-0.5">
              {group.items.map(item => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-2.5 rounded-lg transition-all ${
                      collapsed
                        ? 'justify-center px-2 py-2'
                        : 'px-2.5 py-1.5'
                    }`}
                    style={active
                      ? { color: group.color, background: group.color + '12' }
                      : {}
                    }
                    title={collapsed ? item.name : undefined}
                  >
                    <span className={`text-sm flex-shrink-0 ${active ? '' : 'grayscale opacity-60'} transition-all`}>
                      {item.icon}
                    </span>
                    {!collapsed && (
                      <span className={`text-[13px] font-medium transition-colors ${
                        active ? '' : 'text-gray-500 hover:text-gray-700'
                      }`}>
                        {item.name}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* 底部：折叠状态下的展开按钮 */}
      {collapsed && (
        <div className="flex-shrink-0 p-3 border-t border-gray-100/80">
          <button
            className="w-full flex items-center justify-center py-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            onClick={() => setCollapsed(false)}
            title="展开侧边栏"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

      {/* 底部信息（非折叠） */}
      {!collapsed && (
        <div className="flex-shrink-0 px-4 py-3 border-t border-gray-100/80">
          <p className="text-[10px] text-gray-300 leading-relaxed">
            AI 多智能体驱动 · 内容每日自动更新
          </p>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* 移动端顶部栏 */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 h-12 bg-white/95 backdrop-blur-xl border-b border-gray-100/80 flex items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#6c5ce7] to-[#a29bfe] flex items-center justify-center text-white font-bold text-xs shadow-sm">
            S
          </div>
          <span className="text-sm font-semibold text-gray-900">Signal</span>
        </Link>
        <button
          className="p-1.5 rounded-lg hover:bg-gray-50"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileOpen
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
            }
          </svg>
        </button>
      </div>

      {/* 移动端遮罩 */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* 移动端侧边栏 */}
      <div className={`md:hidden fixed top-0 left-0 z-50 h-full w-56 bg-white/95 backdrop-blur-xl border-r border-gray-100/80 shadow-xl transform transition-transform duration-200 ease-out ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {sidebarContent}
      </div>

      {/* 桌面端侧边栏 */}
      <aside className={`hidden md:flex flex-col fixed top-0 left-0 h-screen bg-white/95 backdrop-blur-xl border-r border-gray-100/80 z-40 transition-all duration-200 ease-out ${
        collapsed ? 'w-[52px]' : 'w-52'
      }`}>
        {sidebarContent}
      </aside>

      {/* 占位：防止内容被侧边栏遮挡 */}
      <div className={`hidden md:block flex-shrink-0 transition-all duration-200 ${collapsed ? 'w-[52px]' : 'w-52'}`} />
    </>
  );
}
