'use client';

import { useState } from 'react';
import Link from 'next/link';
import Footer from '@/components/Footer';

const TABS = [
  { id: 'arch',    name: '架构演进', icon: '🏗️', desc: '2020 → 2026 广告系统技术栈变迁' },
  { id: 'ai',      name: 'AI 创新',  icon: '🤖', desc: '召回 · 粗排 · 精排 · 创意 · 归因' },
  { id: 'llm',     name: '大模型应用', icon: '🧠', desc: '生成式创意 · 商品理解 · 对话式广告' },
  { id: 'case',    name: '标杆案例', icon: '🔭', desc: 'Meta Advantage+ · Google PMax · 字节 Seed-Ad' },
];

export default function AdsPage() {
  const [tab, setTab] = useState('arch');

  return (
    <>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {/* Hero */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-gray-900">📣 广告业务</h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-100 font-medium">
              互联网广告 · 近 5 年技术演进
            </span>
          </div>
          <p className="text-sm text-gray-500">
            从"召回→粗排→精排→重排→创意"的经典漏斗，到生成式广告 & LLM 原生投放的范式迁移
          </p>
          <p className="text-xs text-gray-400 mt-1 leading-relaxed max-w-3xl">
            本模块梳理近 5 年互联网广告系统的架构演进、关键 AI 创新与大模型应用主线。
            涵盖 <span className="font-mono text-gray-500">Meta Advantage+ / Google PMax / 字节 Seed-Ad / Amazon 生成式素材</span> 等标杆。
            与之并列的具体工程案例可参见 <Link href="/vla/" className="text-[#00cec9] underline underline-offset-2">Seed-Ad 深度剖析</Link>。
          </p>
        </div>

        {/* 核心亮点 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mb-8">
          {[
            { icon: '🏗️', label: '5 代架构', desc: 'DNN → LLM', color: '#00cec9' },
            { icon: '🎯', label: '双塔召回', desc: 'User × Ad', color: '#6c5ce7' },
            { icon: '🧬', label: 'SIM 长序列', desc: '万级行为建模', color: '#e17055' },
            { icon: '🎨', label: 'AIGC 素材', desc: '图文+视频生成', color: '#fd79a8' },
            { icon: '💬', label: '对话式广告', desc: 'ChatGPT Ads', color: '#a29bfe' },
            { icon: '📈', label: '全域归因', desc: '增量提升', color: '#ffa657' },
          ].map(item => (
            <div key={item.label} className="rounded-xl border p-3 text-center"
              style={{ borderColor: item.color + '33', background: item.color + '04' }}>
              <div className="text-xl mb-1">{item.icon}</div>
              <div className="text-xs font-semibold text-gray-800">{item.label}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">{item.desc}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-100 overflow-x-auto">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-all ${
                tab === t.id
                  ? 'border-[#00cec9] text-[#00cec9]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <span>{t.icon}</span>
              <span>{t.name}</span>
            </button>
          ))}
        </div>

        {/* Tab 描述 */}
        <p className="text-xs text-gray-400 mb-6">
          {TABS.find(t => t.id === tab)?.desc}
        </p>

        {/* 内容区 */}
        {tab === 'arch' && <ArchSection />}
        {tab === 'ai'   && <AiSection />}
        {tab === 'llm'  && <LlmSection />}
        {tab === 'case' && <CaseSection />}

        {/* 底部说明 */}
        <div className="mt-10 p-4 bg-gray-50 rounded-2xl border border-gray-100 text-xs text-gray-400 leading-relaxed">
          <span className="font-medium text-gray-500">📌 说明：</span>
          本模块关注<span className="text-gray-600">互联网广告系统</span>的工程与算法演进，
          不涉及传统广告代理/品牌创意层面的业务。后续迭代会加入交互式架构漏斗图、AIGC 素材 Demo 与归因沙盒。
        </div>
      </div>
      <Footer />
    </>
  );
}

/* ────────────────── 架构演进 ────────────────── */
function ArchSection() {
  const eras = [
    {
      year: '2020',
      title: '深度学习全面上线',
      stack: 'Wide&Deep · DIN · DeepFM',
      infra: 'Parameter Server · TensorFlow 1.x · Kafka + HDFS',
      milestone: '精排全面换代为 DNN，CTR 模型万亿参数 Embedding 成标配',
      color: '#6c5ce7',
    },
    {
      year: '2021',
      title: '长序列 & 多目标',
      stack: 'SIM · MMoE · PLE',
      infra: 'GPU 训练 · TF2 / PyTorch · Flink 实时特征',
      milestone: '用户行为从百级拉长到万级，CTR × CVR × Dwell 多任务联合',
      color: '#00cec9',
    },
    {
      year: '2022',
      title: 'Transformer 入场',
      stack: 'BST · User-BERT · 图网络召回',
      infra: '向量检索 (Faiss / ScaNN) · ONNX · 蒸馏上线',
      milestone: '召回从双塔内积迈向序列 Transformer，ANN 向量化召回主流',
      color: '#e17055',
    },
    {
      year: '2023',
      title: '端上推理 & 隐私化',
      stack: 'On-Device Ranking · ATT · FLoC / Topics API',
      infra: '端侧 TFLite · 差分隐私 · 联邦学习',
      milestone: 'iOS ATT 冲击下 MMM 回归复兴，端上精排成本下探',
      color: '#fd79a8',
    },
    {
      year: '2024',
      title: '生成式广告素材',
      stack: 'SD / DALL·E · Sora-class · 文案 LLM',
      infra: 'Diffusion 训练集群 · 素材工厂 Pipeline',
      milestone: 'Meta Advantage+ / Google PMax 全面铺开，创意生产工业化',
      color: '#a29bfe',
    },
    {
      year: '2025-2026',
      title: 'LLM 原生投放',
      stack: 'Agent 投放员 · 对话式广告 · 生成式落地页',
      infra: 'LLM Serving · RAG 商品库 · RLHF 对齐',
      milestone: '广告主只写目标，由 Agent 负责出价-创意-落地页闭环',
      color: '#ffa657',
    },
  ];

  return (
    <div className="space-y-6">
      {/* 时间线 */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="text-base font-semibold text-gray-800 mb-4">📅 近 5 年架构演进时间线</h3>
        <div className="relative pl-6">
          <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-gradient-to-b from-[#6c5ce7] via-[#00cec9] to-[#ffa657]" />
          <div className="space-y-5">
            {eras.map(e => (
              <div key={e.year} className="relative">
                <div className="absolute -left-[22px] top-1.5 w-3 h-3 rounded-full border-2 border-white shadow-sm"
                  style={{ background: e.color }} />
                <div className="flex items-baseline gap-3 mb-1">
                  <span className="text-xs font-mono font-bold" style={{ color: e.color }}>{e.year}</span>
                  <span className="text-sm font-semibold text-gray-800">{e.title}</span>
                </div>
                <div className="text-[13px] text-gray-600 leading-relaxed">
                  <div><span className="text-gray-400">算法栈：</span>{e.stack}</div>
                  <div><span className="text-gray-400">基础设施：</span>{e.infra}</div>
                  <div className="mt-1 text-gray-500 italic">💡 {e.milestone}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 经典漏斗 */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="text-base font-semibold text-gray-800 mb-4">🎯 经典广告系统漏斗（2026 版）</h3>
        <div className="space-y-2">
          {[
            { stage: '请求', scale: '1 次请求 / 用户',          model: '特征抽取',               color: '#6c5ce7' },
            { stage: '召回', scale: '亿级库 → 数千候选',         model: '双塔 / 向量 ANN / 图召回', color: '#00cec9' },
            { stage: '粗排', scale: '数千 → 数百',              model: '轻量 DNN / 蒸馏 Transformer', color: '#3fb950' },
            { stage: '精排', scale: '数百 → 数十',              model: 'SIM + MMoE + 多目标融合',  color: '#e17055' },
            { stage: '重排', scale: '数十 → 最终 Top-K',         model: '生成式序列决策 / 多样性约束', color: '#fd79a8' },
            { stage: '创意', scale: 'Top-K × N 种素材',         model: 'AIGC 动态素材 + 文案 LLM', color: '#a29bfe' },
          ].map((s, i) => (
            <div key={s.stage} className="flex items-center gap-3 p-3 rounded-lg border"
              style={{ borderColor: s.color + '33', background: s.color + '06', marginLeft: `${i * 8}px`, marginRight: `${i * 8}px` }}>
              <div className="w-16 text-center">
                <div className="text-sm font-bold" style={{ color: s.color }}>{s.stage}</div>
              </div>
              <div className="flex-1 text-[13px] text-gray-600">
                <div className="text-gray-800 font-medium">{s.model}</div>
                <div className="text-[11px] text-gray-400 mt-0.5">规模：{s.scale}</div>
              </div>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-gray-400 mt-3 italic">
          注：2024 后兴起的 "一阶段广告系统" 尝试用生成式模型一步到位输出 Top-K + 素材，尚未成为主流。
        </p>
      </div>
    </div>
  );
}

/* ────────────────── AI 创新 ────────────────── */
function AiSection() {
  const innovations = [
    {
      area: '召回',
      items: [
        { name: '双塔 DSSM',   year: '2013→', impact: '亿级商品库实时检索的基础' },
        { name: '图召回 GNN',  year: '2019→', impact: '冷启商品通过商品-用户图扩散' },
        { name: 'TDM / COLD', year: '2020→', impact: '用树模型 / 轻量模型替代暴力内积' },
        { name: '生成式召回', year: '2024→', impact: 'LLM 直接输出商品 ID 序列（Google TIGER）' },
      ],
    },
    {
      area: '排序',
      items: [
        { name: 'DIN / DIEN',    year: '2018→', impact: '注意力建模用户历史行为' },
        { name: 'SIM 长序列',    year: '2020→', impact: '从百级到万级的行为序列建模' },
        { name: 'MMoE / PLE',    year: '2018→', impact: '多目标（CTR/CVR/停留）解耦共享' },
        { name: 'Transformer 精排', year: '2022→', impact: '序列特征全面 Self-Attention 化' },
      ],
    },
    {
      area: '创意',
      items: [
        { name: '素材 CTR 预估', year: '2019→', impact: '图文组合 × 用户的精细匹配' },
        { name: '动态创意 DCO',  year: '2020→', impact: '模板化素材按用户实时组装' },
        { name: 'AIGC 图像',    year: '2023→', impact: 'Stable Diffusion 成为素材工厂底座' },
        { name: 'AIGC 视频',    year: '2024→', impact: 'Sora-class 模型生产短视频广告' },
      ],
    },
    {
      area: '归因',
      items: [
        { name: 'Last-Click → MTA', year: '—',    impact: '多点归因：Shapley / MTA 模型' },
        { name: 'Uplift 增量建模',  year: '2019→', impact: '双模型 / Causal Forest 评估广告真实增量' },
        { name: 'MMM 复兴',         year: '2022→', impact: 'iOS ATT 后，贝叶斯 MMM 重新重要起来' },
        { name: 'GeoLift / A/B',   year: '2023→', impact: '地理实验 + 因果推断作为 ATT 的替代' },
      ],
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {innovations.map(block => (
        <div key={block.area} className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00cec9]" />
            {block.area}
          </h3>
          <div className="space-y-2">
            {block.items.map(it => (
              <div key={it.name} className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                <div className="flex items-baseline justify-between mb-0.5">
                  <span className="text-sm font-semibold text-gray-800">{it.name}</span>
                  <span className="text-[10px] font-mono text-gray-400">{it.year}</span>
                </div>
                <p className="text-[12px] text-gray-500 leading-relaxed">{it.impact}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ────────────────── LLM 应用 ────────────────── */
function LlmSection() {
  const lines = [
    {
      title: '① 生成式创意',
      color: '#a29bfe',
      points: [
        'Meta Advantage+ Creative：LLM 自动生成文案 + Diffusion 出图/视频，广告主只传 1 张主图',
        'Google Performance Max (PMax)：同一预算跨搜索/YouTube/Discover/Gmail 自动分配 + 生成素材',
        'Amazon Sponsored Brands：基于商品图的生成式场景化素材（2024 上线）',
        '中国：字节 Seed-Ad / 腾讯妙思 / 阿里万相 —— 素材工厂 + 预审 + ROI 回流闭环',
      ],
    },
    {
      title: '② 商品 / 用户理解',
      color: '#6c5ce7',
      points: [
        '商品 LLM Embedding：用通用大模型替代 BERT-Finetune 做商品标题/描述的稠密表征',
        '用户兴趣 LLM 摘要：把历史行为交给 LLM 总结"长期兴趣标签"，缓解稀疏性',
        '跨域统一表征：把商品图 + 标题 + 评论通过多模态 LLM 融合为单一 embedding，供召回与排序共用',
      ],
    },
    {
      title: '③ 对话式广告（LLM-Native）',
      color: '#00cec9',
      points: [
        'ChatGPT Ads：OpenAI 正在试点在对话中插入原生广告（2025 开始）',
        'Perplexity：在 AI 搜索答案中嵌入"赞助问题" + 商品链接',
        '腾讯元宝 / 豆包 / Kimi：国内大模型都在试验对话式插播与 Agent 导购',
        '关键难点：相关性、信任度、归因链路重构（不再是 Last-Click）',
      ],
    },
    {
      title: '④ Agent 投放员',
      color: '#ffa657',
      points: [
        '广告主输入「目标 + 预算 + 品牌调性」，Agent 完成定向-创意-出价-落地页闭环',
        '代表产品：Meta AI Sandbox、Google Ads Gemini Copilot、巨量千川 AI 投手',
        '评估指标从"CTR/CVR"扩展到"Agent 决策命中率 / 预算利用率"',
      ],
    },
  ];

  return (
    <div className="space-y-4">
      {lines.map(l => (
        <div key={l.title} className="bg-white rounded-2xl border p-5"
          style={{ borderColor: l.color + '33' }}>
          <h3 className="text-base font-semibold mb-3" style={{ color: l.color }}>{l.title}</h3>
          <ul className="space-y-2">
            {l.points.map((p, i) => (
              <li key={i} className="flex gap-2 text-[13px] text-gray-600 leading-relaxed">
                <span style={{ color: l.color }}>▸</span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

/* ────────────────── 标杆案例 ────────────────── */
function CaseSection() {
  const cases = [
    {
      name: 'Meta Advantage+',
      tag: '生成式创意 × 自动化投放',
      year: '2023 起',
      core: '广告主只需提供素材原料（1 张主图 + 基础文案），系统自动生成多套创意、匹配人群、自动出价',
      impact: '据 Meta 2024 Q4 财报：Advantage+ 贡献广告收入 20B+ USD/季度',
      stack: 'Llama 家族 · Emu 图像 · Make-A-Video · 多目标出价模型',
      color: '#6c5ce7',
    },
    {
      name: 'Google Performance Max',
      tag: '跨渠道统一预算 × Gemini 创意',
      year: '2022 起',
      core: '一个广告系列覆盖 Search / YouTube / Discover / Gmail / Maps，Gemini 生成文案与图像',
      impact: '2024 起 Gemini 深度接管创意与出价；PMax 成为 Google Ads 主推产品',
      stack: 'Gemini · Imagen · Veo · 多 Arm Bandit 出价',
      color: '#3fb950',
    },
    {
      name: '字节 Seed-Ad',
      tag: '国内生成式广告标杆',
      year: '2024 起',
      core: '巨量引擎旗下，将 Seed 大模型能力注入创意生成、商品理解、智能投放；支持图文、视频、直播切片',
      impact: '详细工程拆解见本站 /vla/ 下的 Seed-Ad 深度剖析（数据闭环 + 预测模块 + Notebook）',
      stack: 'Doubao/Seed 基座 · Diffusion 模型 · 直播素材生成',
      color: '#00cec9',
      link: '/vla/',
    },
    {
      name: 'Amazon Sponsored Brands Generative',
      tag: '电商站内生成式素材',
      year: '2024 起',
      core: '商家只传商品图，AI 生成"生活化场景图"用于投放，大幅降低中小商家创作门槛',
      impact: '成为 Amazon 广告业务增长的重要驱动之一',
      stack: 'Titan Image · Bedrock · 商品知识图谱',
      color: '#ffa657',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {cases.map(c => (
        <div key={c.name} className="bg-white rounded-2xl border p-5 hover:shadow-sm transition-shadow"
          style={{ borderColor: c.color + '33' }}>
          <div className="flex items-baseline justify-between mb-2">
            <h3 className="text-base font-semibold text-gray-800">{c.name}</h3>
            <span className="text-[10px] font-mono text-gray-400">{c.year}</span>
          </div>
          <div className="inline-block text-[11px] px-2 py-0.5 rounded-full mb-3"
            style={{ background: c.color + '12', color: c.color }}>
            {c.tag}
          </div>
          <p className="text-[13px] text-gray-600 leading-relaxed mb-2">{c.core}</p>
          <p className="text-[12px] text-gray-500 leading-relaxed mb-2">
            <span className="text-gray-400">业务影响：</span>{c.impact}
          </p>
          <p className="text-[12px] text-gray-500 leading-relaxed">
            <span className="text-gray-400">技术栈：</span><span className="font-mono">{c.stack}</span>
          </p>
          {c.link && (
            <Link href={c.link} className="inline-block mt-3 text-[12px] font-medium"
              style={{ color: c.color }}>
              查看深度剖析 →
            </Link>
          )}
        </div>
      ))}
    </div>
  );
}
