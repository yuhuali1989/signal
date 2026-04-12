export default function EvolutionMechanism() {
  const mechanisms = [
    {
      icon: '📖',
      title: '书籍自动演进',
      description: '研究员 → 编辑 → 审校员',
      detail: '三角色每日串行修订',
      accent: '#6c5ce7',
      bg: 'bg-purple-50/60',
    },
    {
      icon: '📝',
      title: '文章 AI 产出',
      description: 'AI 系列文章 + 前沿聚合',
      detail: '每日自动追踪前沿',
      accent: '#3b82f6',
      bg: 'bg-blue-50/60',
    },
    {
      icon: '📊',
      title: '评测持续追踪',
      description: '模型能力 + 数据集 + 污染度',
      detail: '自动更新排行榜',
      accent: '#06b6d4',
      bg: 'bg-cyan-50/60',
    },
  ];

  return (
    <section className="py-14">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-2 mb-8">
          <span className="text-base">🧬</span>
          <h2 className="text-lg font-semibold text-gray-800">进化机制</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {mechanisms.map((m, i) => (
            <div key={i} className="evo-card p-5">
              <div className={`w-10 h-10 ${m.bg} rounded-xl flex items-center justify-center text-xl mb-4`}>
                {m.icon}
              </div>
              <h3 className="text-sm font-semibold text-gray-800 mb-1">{m.title}</h3>
              <p className="text-[13px] text-gray-500 mb-0.5">{m.description}</p>
              <p className="text-[11px] text-gray-300">{m.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
