
'use client';

import Sidebar from '@/components/Sidebar';

export default function SidebarLayout({ children }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 min-w-0 md:min-h-screen">
        {/* 移动端顶部留白（给移动端顶部栏让位） */}
        <div className="md:hidden h-12" />
        {children}
      </main>
    </div>
  );
}
