import Link from 'next/link';

const footerLinks = [
  {
    group: '知识',
    links: [
      { name: '书架', href: '/books/' },
      { name: '文章', href: '/articles/' },
      { name: '论文解读', href: '/papers/' },
    ],
  },
  {
    group: '模型与论文',
    links: [
      { name: '模型', href: '/models/' },
      { name: '自动驾驶', href: '/vla/' },
      { name: '工具箱', href: '/tools/' },
    ],
  },
  {
    group: '动态',
    links: [
      { name: 'AI 动态', href: '/news/' },
      { name: '进化日志', href: '/evolution/' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-white/40 mt-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-col md:flex-row gap-8 justify-between">
          {/* Brand */}
          <div className="md:w-56">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#6c5ce7] to-[#a29bfe] flex items-center justify-center text-white font-bold text-xs shadow-sm">
                S
              </div>
              <span className="text-sm font-semibold text-gray-900">Signal</span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              从噪声中提取前沿信号。AI 多智能体驱动，覆盖 LLM · Agent · 自动驾驶前沿。
            </p>
            <div className="flex items-center gap-1.5 mt-3">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full status-glow" />
              <span className="text-[11px] text-green-700">自主进化中</span>
            </div>
          </div>

          {/* Nav groups */}
          <div className="flex flex-wrap gap-8">
            {footerLinks.map(group => (
              <div key={group.group}>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{group.group}</p>
                <ul className="space-y-1.5">
                  {group.links.map(link => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm text-gray-500 hover:text-[#6c5ce7] transition-colors"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-100 mt-8 pt-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-gray-300">
            Signal — AI 驱动的自进化知识平台
          </p>
          <p className="text-xs text-gray-300">
            AI 多智能体驱动 · 内容每日自动更新
          </p>
        </div>
      </div>
    </footer>
  );
}
