'use client';

import Link from 'next/link';
import { useState, useRef } from 'react';

const NAV_GROUPS = [
  {
    label: '知识',
    icon: '📚',
    color: '#6c5ce7',
    items: [
      { name: '书架', href: '/books/', desc: 'AI 智能体每日修订' },
      { name: '文章', href: '/articles/', desc: 'AI 深度文章 · 每日产出' },
      { name: '论文', href: '/papers/', desc: '论文解读 · 研究趋势' },
      { name: '模型', href: '/models/', desc: '架构图库 · 排行榜 · 数据集' },
      { name: '数据闭环', href: '/data-infra/', desc: 'K8s · 数据湖仓 · MLOps' },
      { name: '工具箱', href: '/tools/', desc: 'Prompt 对比 · 参数速查' },
    ],
  },
  {
    label: '业务',
    icon: '🔬',
    color: '#00cec9',
    items: [
      { name: '自动驾驶', href: '/vla/', desc: 'DriveWorld-VLA · 端到端' },
      { name: '实验室', href: '/lab/', desc: 'NeRF · 扩散模型 · 蒸馏' },
    ],
  },
  {
    label: '战略',
    icon: '🧭',
    color: '#e17055',
    // 单条目直接跳转，不用下拉
    href: '/strategy/',
    items: [
      { name: '业务原生', href: '/strategy/', desc: 'Palantir 模式 · 应对框架' },
    ],
  },
  {
    label: '动态',
    icon: '🌊',
    color: '#3fb950',
    items: [
      { name: 'AI 声浪', href: '/news/', desc: 'YouTube · 播客 · X 前沿' },
      { name: '进化日志', href: '/evolution/', desc: 'AI 智能体更新记录' },
    ],
  },
];

function DropdownGroup({ group }) {
  const [open, setOpen] = useState(false);
  const timerRef = useRef(null);

  // 单条目分组直接渲染为链接
  if (group.href) {
    return (
      <Link
        href={group.href}
        className="flex items-center gap-1 px-3 py-1.5 text-[12px] font-medium text-gray-500 hover:text-[#6c5ce7] rounded-lg hover:bg-purple-50/50 transition-all whitespace-nowrap"
      >
        <span>{group.icon}</span>
        <span>{group.label}</span>
      </Link>
    );
  }

  const handleMouseEnter = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setOpen(true);
  };

  const handleMouseLeave = () => {
    // 延迟 120ms 关闭，消除按钮与面板之间的空隙问题
    timerRef.current = setTimeout(() => setOpen(false), 120);
  };

  return (
    <div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* 触发按钮 */}
      <button
        className="flex items-center gap-1 px-3 py-1.5 text-[12px] font-medium rounded-lg hover:bg-purple-50/50 transition-all whitespace-nowrap"
        style={{ color: open ? group.color : '#6b7280' }}
      >
        <span>{group.icon}</span>
        <span>{group.label}</span>
        <svg
          className={`w-3 h-3 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* 下拉面板：顶部 pt-2 填充空隙，防止鼠标经过空白区域时关闭 */}
      {open && (
        <div
          className="absolute top-full left-0 pt-2 z-50"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div
            className="min-w-[190px] bg-white rounded-xl border border-gray-100 shadow-xl shadow-gray-200/50 py-1.5 animate-fadeIn"
            style={{ animation: 'fadeInDown 0.12s ease-out' }}
          >
            {group.items.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col px-3.5 py-2.5 hover:bg-purple-50/70 transition-colors group/item"
                onClick={() => setOpen(false)}
              >
                <span className="text-[12.5px] font-medium text-gray-700 group-hover/item:text-[#6c5ce7] transition-colors leading-tight">
                  {item.name}
                </span>
                {item.desc && (
                  <span className="text-[10px] text-gray-400 mt-0.5 leading-tight">{item.desc}</span>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileGroup, setMobileGroup] = useState(null);

  return (
    <nav className="sticky top-0 z-50 bg-white/85 backdrop-blur-xl border-b border-gray-100/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">

        {/* 主行：Logo + 桌面分组导航 + 右侧状态 */}
        <div className="flex items-center justify-between h-12">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#6c5ce7] to-[#a29bfe] flex items-center justify-center text-white font-bold text-xs shadow-sm shadow-purple-200/50 group-hover:shadow-purple-300/60 transition-shadow">
              S
            </div>
            <span className="text-sm font-semibold text-gray-900 tracking-tight">Signal</span>
          </Link>

          {/* 桌面分组导航 */}
          <div className="hidden md:flex items-center gap-0.5">
            {NAV_GROUPS.map(group => (
              <DropdownGroup key={group.label} group={group} />
            ))}
          </div>

          {/* 右侧 */}
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

        {/* 移动端菜单：分组折叠 */}
        {mobileOpen && (
          <div className="md:hidden pb-3 border-t border-gray-50 mt-0.5 pt-2 space-y-0.5">
            {NAV_GROUPS.map(group => (
              <div key={group.label}>
                {/* 单条目分组直接显示链接 */}
                {group.href ? (
                  <Link
                    href={group.href}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-[#6c5ce7] hover:bg-purple-50/50 rounded-lg transition-colors"
                    onClick={() => setMobileOpen(false)}
                  >
                    <span>{group.icon}</span>
                    <span>{group.label}</span>
                    <span className="text-[10px] text-gray-400 ml-1">{group.items[0].desc}</span>
                  </Link>
                ) : (
                  <>
                    <button
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                      onClick={() => setMobileGroup(mobileGroup === group.label ? null : group.label)}
                    >
                      <span className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <span>{group.icon}</span>
                        <span>{group.label}</span>
                      </span>
                      <svg
                        className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${mobileGroup === group.label ? 'rotate-180' : ''}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {mobileGroup === group.label && (
                      <div className="ml-4 mt-0.5 space-y-0.5 pb-1">
                        {group.items.map(item => (
                          <Link
                            key={item.href}
                            href={item.href}
                            className="flex items-center justify-between px-3 py-2 text-sm text-gray-600 hover:text-[#6c5ce7] hover:bg-purple-50/50 rounded-lg transition-colors"
                            onClick={() => setMobileOpen(false)}
                          >
                            <span>{item.name}</span>
                            {item.desc && <span className="text-[10px] text-gray-400">{item.desc}</span>}
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
