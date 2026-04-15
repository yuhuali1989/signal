'use client';

import Link from 'next/link';
import { useState } from 'react';

const navItems = [
  { name: '首页', href: '/' },
  { name: '书架', href: '/books/' },
  { name: '文章', href: '/articles/' },
  { name: '论文', href: '/papers/', title: '论文解读 · 研究趋势 · 四大方向追踪' },
  { name: '模型', href: '/models/', title: '架构图库 · 排行榜 · 评测数据集' },
  { name: '自动驾驶', href: '/vla/', title: 'DriveWorld-VLA · Alpamayo-R1 · 自动驾驶前沿' },
  { name: '数据闭环', href: '/data-infra/', title: 'K8s · 数据湖仓 · MLOps · 闭环链路 · 向量DB' },
  { name: '实验室', href: '/lab/', title: 'NeRF · 占用网络 · 扩散模型 · 蒸馏 · 轻量可复现' },
{ name: '业务原生', href: '/strategy/', title: 'AI 时代困境 · Palantir 模式 · 应对框架 · 业务原生转型' },
  { name: '声浪', href: '/news/', title: 'AI 前沿动态 · 每日聚合' },
  { name: '工具箱', href: '/tools/', title: 'Prompt 对比 · 模型参数速查 · 评测维度解析' },
  { name: '日志', href: '/evolution/', title: 'AI 智能体进化记录 · 全部更新透明可追溯' },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-white/85 backdrop-blur-xl border-b border-gray-100/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6c5ce7] to-[#a29bfe] flex items-center justify-center text-white font-bold text-xs shadow-sm shadow-purple-200/50 group-hover:shadow-purple-300/60 transition-shadow">
              S
            </div>
            <span className="text-base font-semibold text-gray-900 tracking-tight">Signal</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-0">
            {navItems.map(item => (
              <Link
                key={item.name}
                href={item.href}
                title={item.title}
                className="px-2 py-1.5 text-[12px] font-medium text-gray-500 hover:text-[#6c5ce7] rounded-lg hover:bg-purple-50/50 transition-all whitespace-nowrap"
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Right */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-green-50/80 rounded-full border border-green-100/60">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full status-glow" />
              <span className="text-[11px] text-green-700 font-medium">自主进化中</span>
            </div>

            <button
              className="lg:hidden p-2 rounded-lg hover:bg-gray-50"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <div className="lg:hidden pb-3 border-t border-gray-50 mt-1 pt-2">
            {navItems.map(item => (
              <Link
                key={item.name}
                href={item.href}
                className="block px-3 py-2 text-sm text-gray-600 hover:text-[#6c5ce7] hover:bg-purple-50/50 rounded-lg"
                onClick={() => setMobileOpen(false)}
              >
                {item.name}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
