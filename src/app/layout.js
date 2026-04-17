import '@/app/globals.css';
import 'katex/dist/katex.min.css';
import Sidebar from '@/components/Sidebar';

export const metadata = {
  title: 'Signal — 从噪声中提取前沿信号',
  description: 'AI 驱动的自进化知识平台',
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-[#f7f8fa] text-gray-800 antialiased md:flex">
        <Sidebar />
        <main className="flex-1 min-w-0 pt-12 md:pt-0 min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
