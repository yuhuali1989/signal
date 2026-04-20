'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Footer from '@/components/Footer';

const ArchViz = dynamic(() => import('@/components/VlaArchViz'), { ssr: false, loading: () => <LoadingBlock /> });

const Notebook = dynamic(() => import('@/components/VlaNotebook'), { ssr: false, loading: () => <LoadingBlock /> });

const DataLoop = dynamic(() => import('@/components/DataLoopArch'), { ssr: false, loading: () => <LoadingBlock /> });

// Seed-AD 子模块（70B · 三阶段 想象→反思→行动）
const SeedAdArchViz  = dynamic(() => import('@/components/SeedAdArchViz'),  { ssr: false, loading: () => <LoadingBlock /> });
const SeedAdNotebook = dynamic(() => import('@/components/SeedAdNotebook'), { ssr: false, loading: () => <LoadingBlock /> });
const SeedAdDataLoop = dynamic(() => import('@/components/SeedAdDataLoop'), { ssr: false, loading: () => <LoadingBlock /> });

function LoadingBlock() {
  return (
    <div className="flex items-center justify-center h-64 rounded-2xl bg-[#0a0d14] border border-[#1e2130]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-[#00cec9] border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-[#4a5568]">加载可视化组件...</span>
      </div>
    </div>
  );
}

const TABS = [
  {
    id: 'arch',
    label: '架构 & 数据',
    icon: '🏗️',
    desc: 'Unified Latent-Space 架构图 · 数据集选型 · 训练配置 · VLA 实验室',
    color: '#6c5ce7',
  },
  {
    id: 'notebook',
    label: '全链路实验',
    icon: '📓',
    desc: '数据加载 → 数据处理 → 模型搭建 → 三阶段训练 · 可逐步运行的 Notebook',
    color: '#e17055',
  },
  {
    id: 'dataloop',
    label: '数据闭环',
    icon: '🔄',
    desc: '数据采集 → 上传 → 处理 → 存储 → 训练 → 部署 → 监控回采 · 自动驾驶专项闭环架构',
    color: '#00cec9',
  },
];

// 研究项目卡片数据
const RESEARCH_PROJECTS = [
  {
    id: 'driveworld',
    title: 'DriveWorld-VLA',
    badge: 'Unified Latent-Space',
    badgeColor: '#6c5ce7',
    status: '深度解读',
    statusColor: 'bg-purple-50 text-purple-600 border-purple-100',
    desc: '统一隐空间同时驱动 VLA 规划 + 世界模型预测，端到端自动驾驶。L2 误差 0.42m，FVD 52，碰撞率 1.2%。',
    tags: ['VLA', 'World Model', 'nuScenes', 'NAVSIM'],
    icon: '🤖',
    active: true,
  },
  {
    id: 'seedad',
    title: 'Seed-AD',
    badge: '70B · 三阶段开源',
    badgeColor: '#10b981',
    status: '深度解读',
    statusColor: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    desc: '字节 70B VLA 三阶段推理（想象→反思→行动），nuScenes L2(3s) 0.54m / 碰撞率 0.11% 新 SOTA，车端 Orin X 45ms。',
    tags: ['70B-VLA', 'Imagination', 'Reflection', 'nuScenes-SOTA'],
    icon: '🌱',
    active: true,
  },
  {
    id: 'alpamayo',
    title: 'Alpamayo-R1',
    badge: 'Reasoning-VLA',
    badgeColor: '#00cec9',
    status: '跟踪中',
    statusColor: 'bg-cyan-50 text-cyan-600 border-cyan-100',
    desc: '将 Chain-of-Thought 推理引入自动驾驶决策链，通过慢思考提升复杂场景处理能力。',
    tags: ['R1-style', 'CoT', 'Driving', 'Reasoning'],
    icon: '🧠',
    active: false,
  },
];

function PageHero({ activeProject, setActiveProject }) {
  return (
    <div className="mb-8">
      {/* 大标题 */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-bold text-gray-900">🚗 自动驾驶研究</h1>
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100 font-medium">持续追踪</span>
        </div>
        <p className="text-sm text-gray-500">大模型 × 自动驾驶前沿 — VLA、世界模型、推理驾驶的深度研究与实验</p>
        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
          <span>{RESEARCH_PROJECTS.length} 个研究项目</span>
          <span>·</span>
          <span>覆盖 VLA · World Model · Reasoning-AD</span>
        </div>
      </div>

      {/* 研究项目切换卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {RESEARCH_PROJECTS.map(proj => (
          <button
            key={proj.id}
            onClick={() => setActiveProject(proj.id)}
            className="text-left p-4 rounded-2xl border transition-all bg-white hover:shadow-sm"
            style={activeProject === proj.id
              ? { borderColor: proj.badgeColor + '66', background: proj.badgeColor + '0d', boxShadow: `0 1px 4px ${proj.badgeColor}22` }
              : { borderColor: '#f1f5f9' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{proj.icon}</span>
              <span className="text-sm font-semibold text-gray-800">{proj.title}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium ml-auto"
                style={{ background: proj.badgeColor + '18', color: proj.badgeColor, border: `1px solid ${proj.badgeColor}30` }}>
                {proj.badge}
              </span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed mb-2">{proj.desc}</p>
            <div className="flex items-center gap-1.5 flex-wrap">
              {proj.tags.map(t => (
                <span key={t} className="text-[10px] px-1.5 py-0.5 bg-gray-50 text-gray-400 rounded-md border border-gray-100">{t}</span>
              ))}
              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ml-auto ${proj.statusColor}`}>{proj.status}</span>
            </div>
          </button>
        ))}
      </div>

      {/* DriveWorld-VLA 三步骤详情（仅 active 时显示） */}
      {activeProject === 'driveworld' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              step: '01',
              title: '数据准备 & 处理',
              desc: 'nuScenes（核心）+ DriveLM（语言标注）+ NAVSIM（闭环评估）+ OpenDV-2K（视觉预训练）。nuScenes 6路环视相机 + LiDAR + HD Map，配合 DriveLM 460K 语言标注构建 <视觉, 语言, 动作> 三元组，NAVSIM 提供闭环 RL 奖励信号。',
              icon: '🗄️',
              color: '#6c5ce7',
              tags: ['nuScenes', 'DriveLM', 'NAVSIM', 'OpenDV-2K'],
            },
            {
              step: '02',
              title: '模型架构',
              desc: 'InternViT-6B + PointPillar + MapTR + InternLM2-7B → Unified Projector → 统一隐状态 Z_t → VLA Head（规划）+ World Model Head（Diffusion预测）。',
              icon: '🧠',
              color: '#00cec9',
              tags: ['Unified Latent Z_t', 'Diffusion WM', 'AR VLA Head'],
            },
            {
              step: '03',
              title: '三阶段训练',
              desc: 'Stage1: 视觉-语言预训练(100k) → Stage2: VLA+WM联合训练(150k) → Stage3: 世界模型辅助RL微调(100k)。L2: 3.2→0.42m，FVD: 420→52，碰撞率: 3.8%→1.2%。',
              icon: '📊',
              color: '#fd79a8',
              tags: ['L2: 0.42m', 'FVD: 52', '碰撞率: 1.2%'],
            },
          ].map((item) => (
            <div key={item.step} className="rounded-2xl border p-4 hover:shadow-sm transition-shadow"
              style={{ borderColor: item.color + '33', background: item.color + '08' }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{item.icon}</span>
                <span className="text-xs font-bold" style={{ color: item.color }}>STEP {item.step}</span>
              </div>
              <h3 className="text-sm font-semibold text-gray-800 mb-1">{item.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed mb-3">{item.desc}</p>
              <div className="flex flex-wrap gap-1">
                {item.tags.map((t) => (
                  <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                    style={{ background: item.color + '18', color: item.color }}>{t}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Seed-AD 三步骤详情 */}
      {activeProject === 'seedad' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              step: '01',
              title: '数据 & UniSim 2.0 合成',
              desc: 'nuScenes（主，HuggingFace 真实加载）+ OpenDV-2K（2000 小时视觉预训练）+ DriveLM（460K 语言标注）+ nuPlan（闭环评估）+ ★ UniSim 2.0 合成数据工具链（32 种天气/光照组合，每条样本扩增 ×5，补齐长尾场景）。',
              icon: '🗄️',
              color: '#10b981',
              tags: ['nuScenes', 'OpenDV-2K', 'DriveLM', 'UniSim 2.0'],
            },
            {
              step: '02',
              title: '三阶段模型（70B / 13B）',
              desc: '共享骨干 40B（SwinT-Ultra 12B + Cross-Attn×8 + Temporal 28B）→ 想象头 10B（BEV 占用栅格预测）+ 反思头 10B（5 维风险评分）+ 行动头 10B（条件式轨迹生成）。车端蒸馏到 13B + INT4 + KV 共享 + SpecDec v3 → Orin X 45ms。',
              icon: '🧠',
              color: '#00cec9',
              tags: ['70B 云端', '13B 车端', 'Imagination', 'Reflection', 'Action'],
            },
            {
              step: '03',
              title: '三阶段训练（31 天）',
              desc: 'Stage1 共享骨干预训练（2048×H100，21 天，MIM+NFP+Con）→ Stage2 三阶段头联合微调（256×H100，7 天）→ Stage3 蒸馏到 13B 车端（32×H100，3 天）。nuScenes L2(3s)=0.54m，碰撞率 0.11%，FVD=47，全面超越 DriveWorld-VLA。',
              icon: '📊',
              color: '#fd79a8',
              tags: ['L2: 0.54m', '碰撞率: 0.11%', 'FVD: 47', 'Orin X 45ms'],
            },
          ].map((item) => (
            <div key={item.step} className="rounded-2xl border p-4 hover:shadow-sm transition-shadow"
              style={{ borderColor: item.color + '33', background: item.color + '08' }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{item.icon}</span>
                <span className="text-xs font-bold" style={{ color: item.color }}>STEP {item.step}</span>
              </div>
              <h3 className="text-sm font-semibold text-gray-800 mb-1">{item.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed mb-3">{item.desc}</p>
              <div className="flex flex-wrap gap-1">
                {item.tags.map((t) => (
                  <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                    style={{ background: item.color + '18', color: item.color }}>{t}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Alpamayo-R1 占位卡（跟踪中） */}
      {activeProject === 'alpamayo' && (
        <div className="rounded-2xl border border-cyan-100 bg-cyan-50/30 p-6 text-center">
          <div className="text-3xl mb-3">🧠</div>
          <h3 className="text-base font-semibold text-gray-700 mb-1">Alpamayo-R1 研究跟踪中</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            将 Chain-of-Thought 推理引入自动驾驶，通过慢思考提升复杂场景决策能力。
            深度解读与实验正在整理，敬请期待。
          </p>
        </div>
      )}
    </div>
  );
}

// ── Seed-AD 子 Tab 区域（与 DriveWorld 平行，独立状态） ────────
const SEEDAD_TABS = [
  { id: 'arch',     label: '架构 & 数据', icon: '🏗️', color: '#10b981',
    desc: '三阶段架构图（想象→反思→行动）· 对比 DriveWorld-VLA · 数据集选型 · 训练配置' },
  { id: 'notebook', label: '全链路实验',  icon: '📓', color: '#f39c12',
    desc: '数据下载 → Tokenize → 三阶段模型搭建 → 三阶段训练 → 蒸馏到 13B → 预测可视化' },
  { id: 'dataloop', label: '数据闭环',    icon: '🔄', color: '#00cec9',
    desc: '8 层闭环架构（含 UniSim 2.0 合成数据层，Seed-AD 专属创新）' },
];

function SeedAdSection() {
  const [tab, setTab] = useState('arch');
  const current = SEEDAD_TABS.find(t => t.id === tab);
  return (
    <>
      <div className="flex flex-wrap gap-2 mb-6 p-1.5 bg-gray-50 rounded-2xl border border-gray-100">
        {SEEDAD_TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="flex items-center gap-2 py-2 px-4 rounded-xl text-sm font-medium transition-all whitespace-nowrap"
            style={tab === t.id
              ? { background: '#fff', color: t.color, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: `1px solid ${t.color}33` }
              : { color: '#94a3b8' }}>
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      <div className="mb-5 flex items-center gap-2">
        <span className="text-lg">{current?.icon}</span>
        <div>
          <h2 className="text-base font-semibold text-gray-800">{current?.label}</h2>
          <p className="text-xs text-gray-400">{current?.desc}</p>
        </div>
      </div>

      <div>
        {tab === 'arch'     && <SeedAdArchViz />}
        {tab === 'notebook' && <SeedAdNotebook />}
        {tab === 'dataloop' && <SeedAdDataLoop />}
      </div>

      <div className="mt-10 p-4 bg-emerald-50/30 rounded-2xl border border-emerald-100 text-xs text-gray-500 leading-relaxed">
        <span className="font-medium text-emerald-700">🌱 Seed-AD 亮点：</span>
        字节跳动 Seed 团队开源的 <span className="font-mono text-emerald-700">70B VLA 自动驾驶大模型</span>，首次把
        <span className="font-mono text-emerald-700"> 想象-反思-行动</span> 三阶段推理工业级落地。
        nuScenes L2(3s) <span className="font-mono font-bold">0.54m</span> · 碰撞率
        <span className="font-mono font-bold"> 0.11%</span> 成为新 SOTA（超越 VLA-World 0.58m / 0.15%）。
        配套开源完整训练管线、基于 <span className="font-mono">UniSim 2.0</span> 扩展的合成数据工具链，
        以及 Orin X 车端推理 <span className="font-mono font-bold">45ms</span> 延迟的优化实现（INT4 + KV 共享 + SpecDec v3）。
      </div>
    </>
  );
}

export default function VlaPage() {
  const [activeTab, setActiveTab] = useState('arch');
  const [activeProject, setActiveProject] = useState('driveworld');

  return (
    <>
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <PageHero activeProject={activeProject} setActiveProject={setActiveProject} />

        {/* DriveWorld-VLA 可视化 Tab */}
        {activeProject === 'driveworld' && (
          <>
            <div className="flex flex-wrap gap-2 mb-6 p-1.5 bg-gray-50 rounded-2xl border border-gray-100">
              {TABS.map((tab) => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className="flex items-center gap-2 py-2 px-4 rounded-xl text-sm font-medium transition-all whitespace-nowrap"
                  style={activeTab === tab.id
                    ? { background: '#fff', color: tab.color, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: `1px solid ${tab.color}33` }
                    : { color: '#94a3b8' }}>
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            <div className="mb-5 flex items-center gap-2">
              <span className="text-lg">{TABS.find(t => t.id === activeTab)?.icon}</span>
              <div>
                <h2 className="text-base font-semibold text-gray-800">{TABS.find(t => t.id === activeTab)?.label}</h2>
                <p className="text-xs text-gray-400">{TABS.find(t => t.id === activeTab)?.desc}</p>
              </div>
            </div>

            <div>
              {activeTab === 'arch' && <ArchViz />}
              {activeTab === 'notebook' && <Notebook />}
              {activeTab === 'dataloop' && <DataLoop />}
            </div>

            <div className="mt-10 p-4 bg-gray-50 rounded-2xl border border-gray-100 text-xs text-gray-400 leading-relaxed">
              <span className="font-medium text-gray-500">📌 说明：</span>
              本页面基于 <span className="font-mono text-gray-600">DriveWorld-VLA: Unified Latent-Space World Modeling with VLA</span> 论文进行可视化演示。所有数据均为模拟数据，用于展示研究思路。
              核心创新：<span className="font-mono">Unified Projector</span> 将多模态特征投影到统一隐状态 <span className="font-mono">Z_t</span>，
              同时驱动 <span className="font-mono">VLA Head</span>（规划）和 <span className="font-mono">World Model Head</span>（Diffusion预测），
              相比独立 BEV 融合减少 40% 参数量，FVD 提升 88%（420→52）。
            </div>
          </>
        )}

        {/* Seed-AD 可视化 Tab（与 DriveWorld 平行，各自维护 activeTab） */}
        {activeProject === 'seedad' && (
          <SeedAdSection />
        )}
      </div>
      <Footer />
    </>
  );
}
