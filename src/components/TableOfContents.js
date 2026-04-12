'use client';

import { useState, useEffect } from 'react';

export default function TableOfContents({ contentHtml }) {
  const [headings, setHeadings] = useState([]);
  const [activeId, setActiveId] = useState('');

  useEffect(() => {
    // 从 HTML 中提取标题
    const parser = new DOMParser();
    const doc = parser.parseFromString(contentHtml, 'text/html');
    const elements = doc.querySelectorAll('h2, h3');
    const items = Array.from(elements).map((el, i) => ({
      id: el.id || `heading-${i}`,
      text: el.textContent.replace(/^[\d.]+\s*/, '').trim(),
      level: el.tagName === 'H2' ? 2 : 3,
    }));
    setHeadings(items);

    // 给实际 DOM 中的标题加 id
    setTimeout(() => {
      const realHeadings = document.querySelectorAll('article h2, article h3');
      realHeadings.forEach((el, i) => {
        if (!el.id) el.id = `heading-${i}`;
      });
    }, 100);
  }, [contentHtml]);

  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter(e => e.isIntersecting);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: '-80px 0px -70% 0px', threshold: 0 }
    );

    headings.forEach(h => {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length < 3) return null;

  return (
    <nav className="hidden xl:block sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">目录</p>
      <ul className="space-y-1 text-sm border-l border-gray-100">
        {headings.map(h => (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById(h.id);
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  setActiveId(h.id);
                }
              }}
              className={`block py-1 transition-colors ${
                h.level === 3 ? 'pl-6' : 'pl-3'
              } ${
                activeId === h.id
                  ? 'text-maxwell-600 border-l-2 border-maxwell-500 -ml-px font-medium'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {h.text.length > 30 ? h.text.slice(0, 30) + '...' : h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
