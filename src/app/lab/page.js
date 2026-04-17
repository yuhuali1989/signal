'use client';

import dynamic from 'next/dynamic';
import Footer from '@/components/Footer';

const LabExplorer = dynamic(() => import('@/components/LabExplorer'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64 rounded-2xl bg-white border border-gray-100">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-[#6c5ce7] border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-gray-400">加载实验室...</span>
      </div>
    </div>
  ),
});

export default function LabPage() {
  return (
    <>
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {/* Hero */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-gray-900">🔬 前沿实验室</h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 border border-purple-100 font-medium">
              轻量可复现
            </span>
          </div>
          <p className="text-sm text-gray-500">
            低数据量 · 低计算资源 · 单卡可跑的自动驾驶前沿研究课题
          </p>
          <p className="text-xs text-gray-400 mt-1 leading-relaxed max-w-2xl">
            精选 10 个适合个人/小团队复现的研究方向，覆盖 NeRF 场景重建、占用网络、扩散模型生成、知识蒸馏、小样本学习、仿真强化学习。
            所有课题均可在 <span className="font-mono text-gray-500">1×RTX 3090/4090</span> 上运行，使用 <span className="font-mono text-gray-500">nuScenes mini</span>（~3GB）等轻量数据集。
          </p>
        </div>

        {/* 核心亮点 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { icon: '💻', label: '单卡即可', desc: 'RTX 3090 / 4090', color: '#6c5ce7' },
            { icon: '📦', label: '数据极少', desc: 'nuScenes mini ~3GB', color: '#00cec9' },
            { icon: '⏱️', label: '快速出结果', desc: '30min ~ 12hr', color: '#fd79a8' },
            { icon: '📄', label: '论文驱动', desc: '每个课题对应顶会论文', color: '#ffa657' },
          ].map(item => (
            <div key={item.label} className="rounded-xl border p-3 text-center"
              style={{ borderColor: item.color + '33', background: item.color + '04' }}>
              <div className="text-xl mb-1">{item.icon}</div>
              <div className="text-xs font-semibold text-gray-800">{item.label}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">{item.desc}</div>
            </div>
          ))}
        </div>

        {/* 实验室主体 */}
        <LabExplorer />

        {/* 底部说明 */}
        <div className="mt-10 p-4 bg-gray-50 rounded-2xl border border-gray-100 text-xs text-gray-400 leading-relaxed">
          <span className="font-medium text-gray-500">📌 说明：</span>
          所有课题均基于公开论文和开源代码设计，聚焦<span className="font-mono text-gray-600">低资源可复现</span>。
          数据集使用 <span className="font-mono text-gray-600">nuScenes mini</span>（10 场景）、
          <span className="font-mono text-gray-600">DriveLM 子集</span>（5K 条）或
          <span className="font-mono text-gray-600">CARLA 仿真</span>（零真实数据）。
          推荐按研究路线图的顺序逐步深入，从感知 → 世界模型 → 端到端驾驶。
        </div>
      </main>
      <Footer />
    </>
  );
}