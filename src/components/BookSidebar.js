'use client';

import Link from 'next/link';
import { useState } from 'react';

/**
 * 书籍侧边栏 — 显示当前书的完整章节目录
 * 固定在左侧，支持折叠/展开
 */
export default function BookSidebar({ bookTitle, chapters, currentSlug }) {
  const [collapsed, setCollapsed] = useState(false);

  if (!chapters || chapters.length <= 1) return null;

  return (
    <aside className={`hidden lg:block flex-shrink-0 transition-all duration-300 ${collapsed ? 'w-12' : 'w-60'}`}>
      <div className="sticky top-20">
        {/* 折叠按钮 */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center w-7 h-7 rounded-md bg-gray-100 hover:bg-maxwell-50 text-gray-400 hover:text-maxwell-500 mb-3 transition-colors"
          title={collapsed ? '展开目录' : '收起目录'}
        >
          <svg className={`w-4 h-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>

        {collapsed ? (
          /* 折叠态：只显示章节序号圆点 */
          <div className="flex flex-col items-center gap-1.5">
            {chapters.map((ch) => {
              const isCurrent = ch.slug === currentSlug;
              return (
                <Link
                  key={ch.slug}
                  href={`/books/${ch.slug}/`}
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
                    isCurrent
                      ? 'bg-maxwell-500 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-400 hover:bg-maxwell-50 hover:text-maxwell-600'
                  }`}
                  title={`第 ${ch.chapter} 章：${ch.chapterTitle}`}
                >
                  {ch.chapter}
                </Link>
              );
            })}
          </div>
        ) : (
          /* 展开态：完整目录 */
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            {/* 书名 */}
            <div className="px-4 py-3 bg-gradient-to-r from-maxwell-50 to-white border-b border-gray-100">
              <Link href="/books/" className="text-xs text-maxwell-400 hover:text-maxwell-600">← 书架</Link>
              <h3 className="text-sm font-semibold text-gray-900 mt-1 leading-snug">{bookTitle}</h3>
              <p className="text-xs text-gray-400 mt-0.5">{chapters.length} 章</p>
            </div>

            {/* 章节列表 */}
            <nav className="py-2 max-h-[calc(100vh-200px)] overflow-y-auto">
              {chapters.map((ch) => {
                const isCurrent = ch.slug === currentSlug;
                return (
                  <Link
                    key={ch.slug}
                    href={`/books/${ch.slug}/`}
                    className={`flex items-start gap-2.5 px-4 py-2.5 text-sm transition-all group ${
                      isCurrent
                        ? 'bg-maxwell-50 text-maxwell-700 font-medium border-l-2 border-maxwell-500'
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700 border-l-2 border-transparent'
                    }`}
                  >
                    {/* 章节序号 */}
                    <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                      isCurrent
                        ? 'bg-maxwell-500 text-white'
                        : 'bg-gray-100 text-gray-400 group-hover:bg-maxwell-100 group-hover:text-maxwell-500'
                    }`}>
                      {ch.chapter}
                    </span>
                    {/* 章节标题 */}
                    <span className="leading-snug line-clamp-2">
                      {ch.chapterTitle || ch.title}
                    </span>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </div>
    </aside>
  );
}
