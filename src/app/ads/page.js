'use client';

import { useState } from 'react';
import Link from 'next/link';
import Footer from '@/components/Footer';

const TABS = [
  { id: 'arch',    name: '架构演进', icon: '🏗️', desc: '2020 → 2026 广告系统技术栈变迁' },
  { id: 'auction', name: '拍卖与竞价', icon: '💰', desc: 'GSP · VCG · Pacing · 保留价 · 探索收割' },
  { id: 'ai',      name: 'AI 创新',  icon: '🤖', desc: '召回 · 粗排 · 精排 · 创意 · 归因' },
  { id: 'deep',    name: '算法深潜', icon: '🔬', desc: 'DIN / SIM / MMoE / 双塔负采样机制拆解' },
  { id: 'llm',     name: '大模型应用', icon: '🧠', desc: '生成式创意 · 商品理解 · 对话式广告 · 成本账' },
  { id: 'exp',     name: '实验与归因', icon: '🧪', desc: 'A/B 分层 · Uplift · MMM · Geo-Lift' },
  { id: 'case',    name: '标杆案例', icon: '🔭', desc: 'Meta Advantage+ · PMax · Seed-Ad · 国内横评' },
  { id: 'eco',     name: '生态与挑战', icon: '🌐', desc: '隐私 · 品牌安全 · 反作弊 · 监管 · 博弈' },
  { id: 'tida',    name: '钛动科技', icon: '🚀', desc: '三年大模型转型规划 · 人力物力 · ROI 测算' },
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
              互联网广告 · 深度扩展版 v2
            </span>
          </div>
          <p className="text-sm text-gray-500">
            从"召回→粗排→精排→创意"的经典漏斗，到生成式广告 &amp; LLM 原生投放的范式迁移
          </p>
          <p className="text-xs text-gray-400 mt-1 leading-relaxed max-w-3xl">
            本模块在广度覆盖基础上，新增<span className="text-gray-600 font-medium">拍卖经济学、核心算法拆解、实验归因、生态挑战</span>四条深度支线。
            涵盖 <span className="font-mono text-gray-500">Meta Advantage+ / Google PMax / 字节 Seed-Ad / Amazon 生成式素材</span> 等标杆。
            与之并列的工程案例可参见 <Link href="/vla/" className="text-[#00cec9] underline underline-offset-2">Seed-Ad 深度剖析</Link>。
          </p>
        </div>

        {/* 核心亮点 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-8">
          {[
            { icon: '🏗️', label: '5 代架构', desc: 'DNN → LLM', color: '#00cec9' },
            { icon: '💰', label: 'GSP / VCG', desc: '拍卖经济学', color: '#ffa657' },
            { icon: '🎯', label: '双塔召回', desc: 'User × Ad', color: '#6c5ce7' },
            { icon: '🧬', label: 'SIM 长序列', desc: '万级行为', color: '#e17055' },
            { icon: '🎨', label: 'AIGC 素材', desc: '图文+视频', color: '#fd79a8' },
            { icon: '💬', label: '对话式广告', desc: 'ChatGPT Ads', color: '#a29bfe' },
            { icon: '📈', label: 'Uplift 归因', desc: '因果增量', color: '#3fb950' },
            { icon: '🛡️', label: '隐私 &amp; 合规', desc: 'ATT · 差分', color: '#f87171' },
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
              className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-all ${
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
        {tab === 'arch'    && <ArchSection />}
        {tab === 'auction' && <AuctionSection />}
        {tab === 'ai'      && <AiSection />}
        {tab === 'deep'    && <DeepAlgoSection />}
        {tab === 'llm'     && <LlmSection />}
        {tab === 'exp'     && <ExpSection />}
        {tab === 'case'    && <CaseSection />}
        {tab === 'eco'     && <EcoSection />}
        {tab === 'tida'    && <TidaSection />}

        {/* 底部说明 */}
        <div className="mt-10 p-4 bg-gray-50 rounded-2xl border border-gray-100 text-xs text-gray-400 leading-relaxed">
          <span className="font-medium text-gray-500">📌 说明：</span>
          本模块关注<span className="text-gray-600">互联网广告系统</span>的工程、算法与经济学演进，
          不涉及传统广告代理/品牌创意层面的业务。v2 版本在原 4 Tab 基础上扩充了拍卖经济学、算法深潜、实验归因、生态挑战四条支线。
        </div>
      </div>
      <Footer />
    </>
  );
}

/* ═══════════════════════════════════════════════════════════
   ①  架构演进（保留 + 增补"对比表"与"一阶段系统"讨论）
   ═══════════════════════════════════════════════════════════ */
function ArchSection() {
  const eras = [
    { year: '2020', title: '深度学习全面上线', stack: 'Wide&Deep · DIN · DeepFM',
      infra: 'Parameter Server · TensorFlow 1.x · Kafka + HDFS',
      milestone: '精排全面换代为 DNN，CTR 模型万亿参数 Embedding 成标配', color: '#6c5ce7' },
    { year: '2021', title: '长序列 & 多目标', stack: 'SIM · MMoE · PLE',
      infra: 'GPU 训练 · TF2 / PyTorch · Flink 实时特征',
      milestone: '用户行为从百级拉长到万级，CTR × CVR × Dwell 多任务联合', color: '#00cec9' },
    { year: '2022', title: 'Transformer 入场', stack: 'BST · User-BERT · 图网络召回',
      infra: '向量检索 (Faiss / ScaNN) · ONNX · 蒸馏上线',
      milestone: '召回从双塔内积迈向序列 Transformer，ANN 向量化召回主流', color: '#e17055' },
    { year: '2023', title: '端上推理 & 隐私化', stack: 'On-Device Ranking · ATT · FLoC / Topics API',
      infra: '端侧 TFLite · 差分隐私 · 联邦学习',
      milestone: 'iOS ATT 冲击下 MMM 回归复兴，端上精排成本下探', color: '#fd79a8' },
    { year: '2024', title: '生成式广告素材', stack: 'SD / DALL·E · Sora-class · 文案 LLM',
      infra: 'Diffusion 训练集群 · 素材工厂 Pipeline',
      milestone: 'Meta Advantage+ / Google PMax 全面铺开，创意生产工业化', color: '#a29bfe' },
    { year: '2025-2026', title: 'LLM 原生投放', stack: 'Agent 投放员 · 对话式广告 · 生成式落地页',
      infra: 'LLM Serving · RAG 商品库 · RLHF 对齐',
      milestone: '广告主只写目标，由 Agent 负责出价-创意-落地页闭环', color: '#ffa657' },
  ];

  const compare = [
    { dim: '召回规模',   y2020: '亿级库',              y2026: '亿级库（+ LLM 生成式 ID 序列）' },
    { dim: '用户序列长度', y2020: '50 ~ 200',            y2026: '5000 ~ 50000（SIM+ESU）' },
    { dim: '精排模型',    y2020: 'DNN / DeepFM · 10 亿参数', y2026: 'Transformer + 多目标 · 百亿参数' },
    { dim: '创意形式',    y2020: '人工素材库',          y2026: 'AIGC 动态生成（图文+视频）' },
    { dim: '投放决策',    y2020: '规则 + 人工出价',     y2026: 'Agent 全自动（Advantage+/PMax）' },
    { dim: '归因方式',    y2020: 'Last-Click / MTA',    y2026: 'MMM + Uplift + Geo-Lift（隐私友好）' },
    { dim: '单次请求延迟', y2020: '~80ms',               y2026: '~50ms（端上预过滤 + 蒸馏）' },
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
            { stage: '请求', scale: '1 次请求 / 用户',         model: '特征抽取',                color: '#6c5ce7' },
            { stage: '召回', scale: '亿级库 → 数千候选',        model: '双塔 / 向量 ANN / 图召回', color: '#00cec9' },
            { stage: '粗排', scale: '数千 → 数百',             model: '轻量 DNN / 蒸馏 Transformer', color: '#3fb950' },
            { stage: '精排', scale: '数百 → 数十',             model: 'SIM + MMoE + 多目标融合',  color: '#e17055' },
            { stage: '重排', scale: '数十 → 最终 Top-K',        model: '生成式序列决策 / 多样性约束', color: '#fd79a8' },
            { stage: '创意', scale: 'Top-K × N 种素材',        model: 'AIGC 动态素材 + 文案 LLM', color: '#a29bfe' },
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
          注：2024 后兴起的 "一阶段广告系统" 尝试用生成式模型一步到位输出 Top-K + 素材，尚未成为主流（见下文讨论）。
        </p>
      </div>

      {/* 2020 vs 2026 对比表 */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 overflow-x-auto">
        <h3 className="text-base font-semibold text-gray-800 mb-4">🪞 2020 vs 2026 关键维度对比</h3>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-left text-gray-400 border-b border-gray-100">
              <th className="py-2 pr-4 font-medium">维度</th>
              <th className="py-2 pr-4 font-medium">2020</th>
              <th className="py-2 font-medium">2026</th>
            </tr>
          </thead>
          <tbody>
            {compare.map((r, i) => (
              <tr key={r.dim} className={i % 2 === 0 ? 'bg-gray-50/40' : ''}>
                <td className="py-2 pr-4 text-gray-800 font-medium">{r.dim}</td>
                <td className="py-2 pr-4 text-gray-500">{r.y2020}</td>
                <td className="py-2 text-gray-700">{r.y2026}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 一阶段广告系统讨论 */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="text-base font-semibold text-gray-800 mb-3">🌀 讨论：&ldquo;一阶段广告系统&rdquo; 可行吗？</h3>
        <p className="text-[13px] text-gray-600 leading-relaxed mb-3">
          传统多级漏斗存在<span className="text-gray-800 font-medium">模型不一致性问题</span>（召回/粗排/精排 label 与特征不同），
          学术界与工业界尝试用<span className="text-gray-800 font-medium">单一生成式模型</span>端到端输出 Top-K 广告甚至素材。
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-3 rounded-lg border border-green-100 bg-green-50/30">
            <div className="text-xs font-semibold text-green-700 mb-1">✓ 理论优势</div>
            <ul className="text-[12px] text-gray-600 space-y-1 list-disc pl-4">
              <li>消除级联偏差，全局最优</li>
              <li>天然支持多模态输入/输出</li>
              <li>与生成式创意闭环更顺滑</li>
            </ul>
          </div>
          <div className="p-3 rounded-lg border border-red-100 bg-red-50/30">
            <div className="text-xs font-semibold text-red-700 mb-1">✗ 工程难点</div>
            <ul className="text-[12px] text-gray-600 space-y-1 list-disc pl-4">
              <li>亿级库上的 LLM 推理成本过高</li>
              <li>广告位/预算/竞价约束难以建模</li>
              <li>可解释性差，广告主 / 审计不买账</li>
            </ul>
          </div>
        </div>
        <p className="text-[12px] text-gray-500 mt-3 italic">
          现状（2026）：生成式召回（Google TIGER / Meta HSTU）已小规模上线，但「一步出广告 + 素材 + 出价」仍是长期目标。
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   ②  拍卖与竞价（新增）
   ═══════════════════════════════════════════════════════════ */
function AuctionSection() {
  const auctions = [
    {
      name: 'GSP（Generalized Second-Price）',
      era: '2002 → 今',
      formula: 'price_i = bid_{i+1} × CTR_{i+1} / CTR_i',
      desc: '搜索广告经典，按下一位出价支付。简单、收益好，但并非严格激励相容。',
      adopt: 'Google Ads（搜索广告，2019 前）',
    },
    {
      name: 'VCG（Vickrey–Clarke–Groves）',
      era: '1961 理论 / 2010s 实践',
      formula: 'price_i = 他人因你胜出而损失的总福利',
      desc: '激励相容（讲真话最优），但广告主难理解、平台收益通常略低于 GSP。',
      adopt: 'Facebook Ads（2007 起） · Google 搜索（2019 切换）',
    },
    {
      name: '一价拍卖（First-Price）',
      era: '2019 → 今',
      formula: 'price_i = bid_i（赢家付自己出价）',
      desc: '程序化展示广告标准（Header Bidding 推动）。透明但需"出价教练"帮广告主 shade bid。',
      adopt: 'Display / OpenRTB 生态、Google Ad Manager（2019 起）',
    },
    {
      name: 'oCPX / 智能出价',
      era: '2017 → 今',
      formula: 'ECPM = pCVR × CPA_target × CTR',
      desc: '广告主只出目标成本（CPA/ROAS），平台用预估模型反推实际出价；本质是平台代理广告主决策。',
      adopt: '巨量 oCPC/oCPM · Meta CBO · Google tCPA',
    },
  ];

  return (
    <div className="space-y-4">
      {/* 核心概念 */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="text-base font-semibold text-gray-800 mb-3">💡 为什么广告系统离不开"拍卖"</h3>
        <p className="text-[13px] text-gray-600 leading-relaxed mb-3">
          广告位是<span className="text-gray-800 font-medium">稀缺资源</span>，同一次请求有成千上万广告竞争。
          拍卖机制决定了<span className="text-gray-800 font-medium">谁胜出、付多少钱、广告主是否愿意说真话</span>——
          这三件事是平台收入、广告主 ROI、用户体验的三角平衡。
        </p>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-3 rounded-lg bg-cyan-50/50 border border-cyan-100">
            <div className="text-lg font-bold text-cyan-700">📈 平台收入</div>
            <div className="text-[11px] text-gray-500 mt-1">保留价 / 底价策略</div>
          </div>
          <div className="p-3 rounded-lg bg-purple-50/50 border border-purple-100">
            <div className="text-lg font-bold text-purple-700">💼 广告主 ROI</div>
            <div className="text-[11px] text-gray-500 mt-1">激励相容 / 可预测性</div>
          </div>
          <div className="p-3 rounded-lg bg-amber-50/50 border border-amber-100">
            <div className="text-lg font-bold text-amber-700">👤 用户体验</div>
            <div className="text-[11px] text-gray-500 mt-1">相关性 / 广告密度</div>
          </div>
        </div>
      </div>

      {/* 主流拍卖机制 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {auctions.map(a => (
          <div key={a.name} className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-baseline justify-between mb-2">
              <h4 className="text-sm font-semibold text-gray-800">{a.name}</h4>
              <span className="text-[10px] font-mono text-gray-400">{a.era}</span>
            </div>
            <div className="px-3 py-2 rounded-lg bg-gray-50 border border-gray-100 mb-2">
              <div className="text-[10px] text-gray-400 mb-0.5">核心公式</div>
              <code className="text-[12px] text-[#6c5ce7] font-mono">{a.formula}</code>
            </div>
            <p className="text-[12px] text-gray-600 leading-relaxed mb-2">{a.desc}</p>
            <p className="text-[11px] text-gray-500">
              <span className="text-gray-400">典型平台：</span>{a.adopt}
            </p>
          </div>
        ))}
      </div>

      {/* 进阶机制 */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="text-base font-semibold text-gray-800 mb-3">🔧 进阶：平台层的"5 个隐藏杠杆"</h3>
        <div className="space-y-2">
          {[
            { k: '保留价（Reserve Price）', v: '低于某价不卖。动态保留价（DRP）按用户 × 广告位学习，可提升 10%+ 收入。' },
            { k: '预算平滑（Pacing）',       v: '防止广告主一早就烧完预算。常用 PID / MPC / 强化学习控制投放速率。' },
            { k: '流量分配（Arm Bandit）',   v: '探索 vs 收割：Thompson Sampling / UCB 决定新广告给多少曝光学 CTR。' },
            { k: '多广告位联合拍卖',         v: '同一版面多个位置，位置折扣（Position Bias）影响点击率，需联合求解。' },
            { k: '跨渠道预算（CBO / PMax）', v: '同一预算在 Feed / 搜索 / 视频间动态分配，由平台 RL 模型决策。' },
          ].map(x => (
            <div key={x.k} className="flex gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
              <div className="w-32 flex-shrink-0 text-[12px] font-semibold text-gray-800">{x.k}</div>
              <div className="flex-1 text-[12px] text-gray-600 leading-relaxed">{x.v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ECPM 计算思路 */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="text-base font-semibold text-gray-800 mb-3">🧮 eCPM：广告排序的通用货币</h3>
        <p className="text-[13px] text-gray-600 leading-relaxed mb-3">
          不同计费模式（CPC / CPM / CPA）如何公平比较？答案是折算为 <span className="font-mono text-[#6c5ce7]">eCPM</span>（每千次展示期望收入）。
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { mode: 'CPM', formula: 'eCPM = CPM',                       color: '#00cec9' },
            { mode: 'CPC', formula: 'eCPM = CPC × pCTR × 1000',          color: '#6c5ce7' },
            { mode: 'CPA', formula: 'eCPM = CPA × pCTR × pCVR × 1000',   color: '#ffa657' },
          ].map(m => (
            <div key={m.mode} className="p-4 rounded-xl border" style={{ borderColor: m.color + '33' }}>
              <div className="text-sm font-bold mb-1" style={{ color: m.color }}>{m.mode}</div>
              <code className="text-[11px] font-mono text-gray-600">{m.formula}</code>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-gray-400 mt-3 italic">
          排序时比较的是 eCPM，但向广告主收的仍是 CPC/CPM/CPA——pCTR/pCVR 的精度直接决定了平台能多收多少钱。
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   ③  AI 创新（保留）
   ═══════════════════════════════════════════════════════════ */
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

/* ═══════════════════════════════════════════════════════════
   ④  算法深潜（新增）
   ═══════════════════════════════════════════════════════════ */
function DeepAlgoSection() {
  const algos = [
    {
      name: 'DIN · Deep Interest Network',
      year: 'Alibaba 2018',
      color: '#6c5ce7',
      problem: '用户历史行为很多，但对当前候选广告真正有用的只是少量相关行为',
      idea: '引入 Attention：用候选广告 query 用户历史，给相关行为更高权重后 sum pooling',
      formula: 'u = Σ α(e_q, e_i) · e_i     α 由 MLP 输出，非 softmax，可超过 1',
      trick: '非 softmax 是因为"相关行为多个都要加成"，避免权重被强制归一',
    },
    {
      name: 'SIM · Search-based Interest',
      year: 'Alibaba 2020',
      color: '#00cec9',
      problem: 'DIN 只能吃几百个行为，而电商用户历史动辄上万',
      idea: 'GSU（General Search Unit）先按类目/向量粗筛出 Top-K 相关行为，ESU 再做精细注意力',
      formula: 'GSU: hard search（类目 ID）/ soft search（向量 ANN）  →  ESU: Multi-Head Attention',
      trick: 'GSU 可离线算好索引，在线只取 Top-K；把 1w 行为压到 100 内做精排',
    },
    {
      name: 'MMoE · Multi-gate Mixture-of-Experts',
      year: 'Google 2018',
      color: '#e17055',
      problem: '多目标（CTR/CVR/时长）共享底层易冲突（跷跷板），完全独立又浪费数据',
      idea: '底层共享 N 个 Expert，每个目标有独立 Gate 决定怎么加权 Expert 的输出',
      formula: 'y_task = Tower_task( Σ g_task(x) · Expert_i(x) )',
      trick: 'PLE 进一步把 Expert 分为 shared 和 task-specific，抑制参数干扰',
    },
    {
      name: '双塔负采样策略',
      year: '2013 起 · 工业界共识',
      color: '#fd79a8',
      problem: '双塔召回只有"用户点了这个商品"作为正样本，负样本取自哪里？',
      idea: '随机负 + 曝光未点击（Hard Neg）+ 纠偏（Sampling Bias Correction）',
      formula: 'Loss = −log [ exp(sim(u,v+)/τ) / Σ exp(sim(u,v)/τ) ]',
      trick: '批内负采样 + logQ 纠偏：减掉采样分布的 log 概率，避免热门被压制',
    },
    {
      name: '蒸馏与在线学习',
      year: '2020 起',
      color: '#a29bfe',
      problem: '精排 Transformer 太重，粗排要快 10 倍；同时数据分布在小时级漂移',
      idea: '离线大模型 → 在线小模型（Response KD / Feature KD）+ 增量训练',
      formula: 'Loss_student = α·CE(y, ŷ_s) + (1−α)·KL(ŷ_t || ŷ_s)',
      trick: 'Cross-stage 蒸馏：精排蒸馏粗排，保证一致性；防止"召粗不一致"导致的选择偏差',
    },
    {
      name: 'Uplift 增量建模',
      year: '2018 起',
      color: '#ffa657',
      problem: '不是"谁会点击广告"，而是"广告给谁看才真的带来增量"',
      idea: 'Two-Model / S-Learner / T-Learner / Causal Forest；以增量 τ(x) = E[Y|T=1,X]−E[Y|T=0,X] 为目标',
      formula: 'τ̂(x) = f_1(x) − f_0(x)     （双模型法最直观）',
      trick: '用 AUUC（Area Under Uplift Curve）而非 AUC 评估；需要随机曝光实验数据作训练集',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-cyan-50/40 to-purple-50/40 rounded-2xl border border-cyan-100/50 p-5">
        <h3 className="text-base font-semibold text-gray-800 mb-2">🔬 6 个核心算法的"一句话直觉 + 公式 + 工程 trick"</h3>
        <p className="text-[12px] text-gray-500 leading-relaxed">
          广告系统的算法创新不是堆模型，而是<span className="text-gray-700 font-medium">在"延迟预算 + 样本稀疏 + 分布漂移 + 激励相容"多重约束下找工程平衡</span>。
          本节挑选 6 个工业界真正跑在线上的关键算法，讲清楚「为什么这么做」。
        </p>
      </div>

      {algos.map(a => (
        <div key={a.name} className="bg-white rounded-2xl border p-5"
          style={{ borderColor: a.color + '33' }}>
          <div className="flex items-baseline justify-between mb-2">
            <h4 className="text-sm font-semibold" style={{ color: a.color }}>{a.name}</h4>
            <span className="text-[10px] font-mono text-gray-400">{a.year}</span>
          </div>
          <div className="space-y-2 text-[12.5px]">
            <div>
              <span className="text-[11px] text-gray-400 font-medium">🎯 要解决的问题：</span>
              <span className="text-gray-700">{a.problem}</span>
            </div>
            <div>
              <span className="text-[11px] text-gray-400 font-medium">💡 核心思路：</span>
              <span className="text-gray-700">{a.idea}</span>
            </div>
            <div className="px-3 py-2 rounded-lg bg-gray-50 border border-gray-100">
              <div className="text-[10px] text-gray-400 mb-0.5">公式 / 伪代码</div>
              <code className="text-[11.5px] text-gray-700 font-mono leading-relaxed">{a.formula}</code>
            </div>
            <div>
              <span className="text-[11px] text-gray-400 font-medium">🔧 工程 Trick：</span>
              <span className="text-gray-600 italic">{a.trick}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   ⑤  LLM 应用（保留 + 增补"经济账"）
   ═══════════════════════════════════════════════════════════ */
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

      {/* 新增：LLM 经济账 */}
      <div className="bg-white rounded-2xl border border-amber-100 p-5">
        <h3 className="text-base font-semibold text-amber-700 mb-3">💸 经济账：LLM 到底能不能"进广告链路"？</h3>
        <p className="text-[13px] text-gray-600 leading-relaxed mb-3">
          广告系统的毛利率敏感到<span className="text-gray-800 font-medium">单请求 &lt; 1 毫分</span>。LLM 能否落地取决于三个比值：
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { k: '每次生成 ROI 提升', v: '≥ 5% 才值得用 LLM 生成素材（人工素材基准）', color: '#a29bfe' },
            { k: '单次推理成本',      v: '目前 7B 蒸馏模型 ~0.001 元/次，AIGC 素材 ~0.05 元/张', color: '#6c5ce7' },
            { k: '创意复用率',        v: '一套素材能分发多少曝光决定 amortize 后成本', color: '#00cec9' },
          ].map(x => (
            <div key={x.k} className="p-3 rounded-xl border text-[12px]" style={{ borderColor: x.color + '33' }}>
              <div className="font-semibold text-gray-800 mb-1">{x.k}</div>
              <div className="text-gray-600 leading-relaxed">{x.v}</div>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-gray-400 mt-3 italic">
          因此：生成式创意 ✅ 已普及（素材生产场景足够复用）；LLM 精排 ❌ 仍太贵（请求级推理成本不划算）；LLM 召回 ⚠️ 部分上线（离线生成 ID 序列）。
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   ⑥  实验与归因（新增）
   ═══════════════════════════════════════════════════════════ */
function ExpSection() {
  const methods = [
    {
      name: 'A/B 分层实验（Layered Experiment）',
      color: '#6c5ce7',
      when: '模型 / 策略 / 素材效果验证（日常 90% 用这个）',
      how: '用户 hash 分桶；正交分层允许多个实验同时跑互不干扰',
      pitfall: 'SRM（样本比例失衡）、选择偏差、CUPED 方差削减的正确使用',
    },
    {
      name: 'Interleaving / 对比排序',
      color: '#00cec9',
      when: '搜索 / 推荐的排序算法对比，更敏感的 AB',
      how: '同一用户同一请求，交错展示 A、B 两路结果，比较点击偏好',
      pitfall: '仅适用于排序对比，创意/定向类实验不适用；Team-Draft 可缓解位置偏置',
    },
    {
      name: 'Uplift（双模型 / Meta-Learner）',
      color: '#e17055',
      when: '判断"广告给谁看真正有增量"（定向优化）',
      how: 'T-Learner / X-Learner / Causal Forest，评估 τ(x) = E[Y|T=1,x]−E[Y|T=0,x]',
      pitfall: '训练集必须来自随机曝光；AUUC 而非 AUC 评估；模型选择对噪声敏感',
    },
    {
      name: 'MMM（Marketing Mix Modeling）',
      color: '#fd79a8',
      when: '跨渠道预算分配（电视 + 信息流 + 搜索 + KOL）',
      how: '贝叶斯回归 + Adstock（延迟衰减）+ Saturation（饱和函数），估计每渠道 ROI 曲线',
      pitfall: '多重共线性、季节性混淆、需要 2+ 年周度数据；Meta Robyn / Google Meridian 为开源框架',
    },
    {
      name: 'Geo-Lift',
      color: '#ffa657',
      when: '隐私环境下替代用户级 AB（iOS ATT 后流行）',
      how: '随机选若干城市/地区投放，用合成控制法（Synthetic Control）估计 lift',
      pitfall: '地区异质性、外溢效应；测试期需要足够长（常 4-8 周）',
    },
    {
      name: 'Holdout 长周期实验',
      color: '#a29bfe',
      when: '评估广告整体长期价值（非单次活动）',
      how: '拿出 1%-5% 流量长期不投广告，观察用户 LTV、留存对照',
      pitfall: '成本高（损失展示机会）、需高管审批；但是唯一能量化"广告真实价值"的方法',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-purple-50/40 to-pink-50/40 rounded-2xl border border-purple-100/50 p-5">
        <h3 className="text-base font-semibold text-gray-800 mb-2">🧪 广告实验的 6 种武器</h3>
        <p className="text-[12px] text-gray-500 leading-relaxed">
          广告业务是<span className="text-gray-700 font-medium">因果推断最成熟的工业领域</span>之一——因为每一分钱都要知道花得值不值。
          但不同场景下的"正确工具"差异很大，选错方法等于没做实验。
        </p>
      </div>

      {methods.map(m => (
        <div key={m.name} className="bg-white rounded-2xl border p-5" style={{ borderColor: m.color + '33' }}>
          <h4 className="text-sm font-semibold mb-2" style={{ color: m.color }}>{m.name}</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[12.5px]">
            <div>
              <div className="text-[10px] text-gray-400 font-medium mb-0.5">📍 适用场景</div>
              <div className="text-gray-700">{m.when}</div>
            </div>
            <div>
              <div className="text-[10px] text-gray-400 font-medium mb-0.5">⚙️ 怎么做</div>
              <div className="text-gray-700">{m.how}</div>
            </div>
            <div>
              <div className="text-[10px] text-gray-400 font-medium mb-0.5">⚠️ 常见陷阱</div>
              <div className="text-gray-600 italic">{m.pitfall}</div>
            </div>
          </div>
        </div>
      ))}

      {/* 归因难题 */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="text-base font-semibold text-gray-800 mb-3">🎯 归因的根本难题</h3>
        <p className="text-[13px] text-gray-600 leading-relaxed mb-3">
          用户看了 5 个广告后下单，功劳算谁的？这是广告行业 20 年没解决的核心问题：
        </p>
        <div className="space-y-2 text-[12.5px]">
          <div className="p-3 rounded-lg bg-red-50/40 border border-red-100">
            <span className="font-semibold text-red-700">❌ Last-Click：</span>
            <span className="text-gray-700">把 100% 功劳给最后点击——简单但严重低估上游品牌广告。</span>
          </div>
          <div className="p-3 rounded-lg bg-amber-50/40 border border-amber-100">
            <span className="font-semibold text-amber-700">⚠️ MTA（多触点）：</span>
            <span className="text-gray-700">Shapley 值 / 马尔可夫链分配——更合理，但依赖 user-level 追踪，ATT 后不可用。</span>
          </div>
          <div className="p-3 rounded-lg bg-green-50/40 border border-green-100">
            <span className="font-semibold text-green-700">✅ Incrementality：</span>
            <span className="text-gray-700">Uplift + Geo-Lift + MMM 组合拳，只关心"真实增量"——隐私友好、因果严谨，但实施复杂。</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   ⑦  标杆案例（保留 + 增补"国内横评"）
   ═══════════════════════════════════════════════════════════ */
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

  // 国内平台横评
  const domestic = [
    { p: '巨量引擎（字节）',     strong: 'AIGC 素材 / 直播切片 / oCPX 成熟', scene: '电商 / 游戏 / 本地生活', moat: 'Seed 模型 + 抖音闭环' },
    { p: '腾讯广告（广点通）',   strong: '社交场景 / 品牌心智 / 视频号',     scene: '品牌广告 / 游戏 / 金融', moat: '微信生态 + 小程序跳转' },
    { p: '快手磁力引擎',         strong: '下沉市场 / 直播电商',              scene: '快消 / 本地服务 / 直播',   moat: '私域 + 下沉流量' },
    { p: '阿里妈妈',             strong: '电商全链路 / UD 外投',             scene: '电商 / 品牌种草',       moat: '淘宝交易数据闭环' },
    { p: '小红书（薯店）',       strong: '种草场景 / KOC / 搜索广告',        scene: '美妆 / 母婴 / 生活方式', moat: '真实用户分享氛围' },
    { p: '百度营销',             strong: '搜索广告 / 信息流',                scene: '教育 / 医疗 / 法律',     moat: '搜索意图长尾词' },
  ];

  return (
    <div className="space-y-4">
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

      {/* 国内横评 */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 overflow-x-auto">
        <h3 className="text-base font-semibold text-gray-800 mb-3">🇨🇳 国内主流广告平台横评</h3>
        <table className="w-full text-[12.5px]">
          <thead>
            <tr className="text-left text-gray-400 border-b border-gray-100">
              <th className="py-2 pr-3 font-medium">平台</th>
              <th className="py-2 pr-3 font-medium">优势能力</th>
              <th className="py-2 pr-3 font-medium">主打场景</th>
              <th className="py-2 font-medium">护城河</th>
            </tr>
          </thead>
          <tbody>
            {domestic.map((d, i) => (
              <tr key={d.p} className={i % 2 === 0 ? 'bg-gray-50/40' : ''}>
                <td className="py-2 pr-3 text-gray-800 font-semibold">{d.p}</td>
                <td className="py-2 pr-3 text-gray-700">{d.strong}</td>
                <td className="py-2 pr-3 text-gray-600">{d.scene}</td>
                <td className="py-2 text-gray-500 italic">{d.moat}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-[11px] text-gray-400 mt-3 italic">
          广告主通常多平台并投——抖音拉增量、微信守基本盘、小红书做种草、搜索接长尾，通过 MMM 衡量各渠道 ROI。
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   ⑨  钛动科技 · 三年大模型转型规划
   ═══════════════════════════════════════════════════════════ */
function TidaSection() {
  const [planTab, setPlanTab] = useState('overview');
  const planTabs = [
    { id: 'overview', label: '公司现状 & 痛点' },
    { id: 'roadmap',  label: '三年转型路线图' },
    { id: 'resource', label: '人力 & 物力规划' },
    { id: 'roi',      label: 'ROI 测算' },
  ];

  return (
    <div className="space-y-5">
      {/* 公司简介 Banner */}
      <div className="rounded-2xl p-5 border border-[#6c5ce7]/20 bg-gradient-to-br from-[#6c5ce7]/5 to-[#00cec9]/5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">🚀</span>
              <h3 className="text-base font-bold text-gray-900">钛动科技（TiDeal）</h3>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#6c5ce7]/10 text-[#6c5ce7] border border-[#6c5ce7]/20 font-medium">出海广告 SaaS</span>
            </div>
            <p className="text-[13px] text-gray-600 leading-relaxed max-w-2xl">
              成立于 2015 年，总部上海，专注<span className="font-medium text-gray-800">跨境电商广告投放 SaaS</span>，
              覆盖 Meta / Google / TikTok 等主流海外平台。2023 年营收约 <span className="font-medium text-gray-800">10 亿元</span>，
              服务 <span className="font-medium text-gray-800">3000+</span> 出海品牌客户，员工约 <span className="font-medium text-gray-800">1200 人</span>。
              当前 PE 约 <span className="font-medium text-[#e17055]">12×</span>，目标对标 AI 原生广告科技公司 <span className="font-medium text-[#6c5ce7]">30× PE</span>。
            </p>
          </div>
          <div className="flex-shrink-0 text-right">
            <div className="text-[11px] text-gray-400">当前估值锚</div>
            <div className="text-2xl font-bold text-[#e17055]">12×</div>
            <div className="text-[10px] text-gray-400">目标</div>
            <div className="text-2xl font-bold text-[#6c5ce7]">30×</div>
            <div className="text-[10px] text-gray-400">PE</div>
          </div>
        </div>
      </div>

      {/* 子 Tab 导航 */}
      <div className="flex gap-1 border-b border-gray-100">
        {planTabs.map(t => (
          <button
            key={t.id}
            onClick={() => setPlanTab(t.id)}
            className={`px-4 py-2 text-[13px] font-medium whitespace-nowrap border-b-2 transition-all ${
              planTab === t.id
                ? 'border-[#6c5ce7] text-[#6c5ce7]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 子 Tab 内容 */}
      {planTab === 'overview'  && <TidaOverview />}
      {planTab === 'roadmap'   && <TidaRoadmap />}
      {planTab === 'resource'  && <TidaResource />}
      {planTab === 'roi'       && <TidaROI />}
    </div>
  );
}

/* ── 子面板 1：公司现状 & 痛点 ── */
function TidaOverview() {
  const strengths = [
    { icon: '🌍', title: '出海流量资源', desc: '深度对接 Meta / Google / TikTok API，拥有 Tier-1 代理资质，年管理广告预算超 50 亿元' },
    { icon: '🏭', title: '客户规模', desc: '3000+ 活跃出海品牌，覆盖服装、3C、家居、美妆等主流品类，续费率约 75%' },
    { icon: '📊', title: '数据积累', desc: '7 年跨境广告投放数据，含 CTR / CVR / ROAS 等多维归因数据，是训练垂直模型的核心资产' },
    { icon: '🔧', title: 'SaaS 产品矩阵', desc: '投放管理、素材库、数据看板、受众洞察四大模块，已形成基础工作流闭环' },
  ];

  const pains = [
    {
      level: '🔴 核心痛点',
      color: '#e17055',
      items: [
        { title: '素材生产瓶颈', desc: '出海广告素材需本地化（语言 + 文化），人工制作成本高、迭代慢，平均每套素材制作周期 3-5 天，而 Meta 算法要求每周迭代 10+ 套' },
        { title: '投放决策黑盒', desc: '广告主依赖人工经验出价，缺乏智能出价建议；oCPX 模型依赖平台黑盒，客户 ROAS 波动大、不可解释' },
        { title: '数据孤岛严重', desc: '各平台数据分散，跨平台归因靠人工 Excel 汇总，无法实时感知预算分配效率' },
      ],
    },
    {
      level: '🟡 中度痛点',
      color: '#ffa657',
      items: [
        { title: '人效天花板', desc: '1 个投手平均管理 5-8 个账户，人力成本随客户规模线性增长，无法规模化' },
        { title: '产品同质化', desc: '竞品（Mintegral、Moloco、Smartly.io）功能趋同，缺乏 AI 差异化壁垒，客户粘性依赖关系而非产品' },
        { title: '国际化能力弱', desc: '多语言 LLM 能力缺失，无法自动生成高质量本地化文案，依赖外包翻译' },
      ],
    },
    {
      level: '🟢 机会窗口',
      color: '#3fb950',
      items: [
        { title: 'AIGC 素材红利', desc: '2024-2026 年是出海 AIGC 素材渗透率从 5% 到 50% 的窗口期，先发者可建立数据飞轮' },
        { title: 'Agent 投放趋势', desc: 'Meta Advantage+ / Google PMax 验证了 AI 自动化投放的可行性，出海 SaaS 有机会做"垂直 Agent 投放员"' },
      ],
    },
  ];

  return (
    <div className="space-y-5">
      {/* 优势 */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">💪 核心优势（转型基础）</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {strengths.map(s => (
            <div key={s.title} className="flex gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
              <span className="text-xl flex-shrink-0">{s.icon}</span>
              <div>
                <div className="text-[13px] font-semibold text-gray-800 mb-0.5">{s.title}</div>
                <div className="text-[12px] text-gray-600 leading-relaxed">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 痛点 */}
      {pains.map(p => (
        <div key={p.level} className="bg-white rounded-2xl border p-5" style={{ borderColor: p.color + '33' }}>
          <h3 className="text-sm font-semibold mb-3" style={{ color: p.color }}>{p.level}</h3>
          <div className="space-y-2">
            {p.items.map(item => (
              <div key={item.title} className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                <div className="text-[13px] font-semibold text-gray-800 mb-0.5">{item.title}</div>
                <div className="text-[12px] text-gray-600 leading-relaxed">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* 核心命题 */}
      <div className="rounded-2xl p-4 border border-[#6c5ce7]/20 bg-[#6c5ce7]/5">
        <p className="text-[13px] text-gray-700 leading-relaxed">
          <span className="font-bold text-[#6c5ce7]">核心命题：</span>
          钛动科技从"广告投放工具"升级为<span className="font-medium">"AI 驱动的出海增长操作系统"</span>——
          用大模型重构素材生产、投放决策、归因分析三大核心链路，
          将人效从"1 投手管 8 账户"提升至"1 投手管 50 账户"，
          实现从 <span className="font-bold text-[#e17055]">12× PE</span> 向 <span className="font-bold text-[#6c5ce7]">30× PE</span> 的估值跃迁。
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   ⑧  生态与挑战（新增）
   ═══════════════════════════════════════════════════════════ */
function EcoSection() {
  const topics = [
    {
      title: '🔐 隐私与合规',
      color: '#f87171',
      items: [
        { k: 'iOS ATT（2021）',    v: '用户级 IDFA 默认关闭，iOS 归因链路大幅收窄，Meta 曾一年损失 100 亿美元' },
        { k: 'Chrome Cookie 消亡', v: '2024 起逐步移除第三方 Cookie，程序化展示广告生态剧烈变动' },
        { k: 'Privacy Sandbox',    v: 'Google 提出 Topics API / FLEDGE，用端上兴趣分类替代 Cookie 追踪' },
        { k: '差分隐私 / 联邦',    v: 'Apple SKAdNetwork 4.0 / Meta AEM：聚合层级归因，单用户信息不可识别' },
        { k: '《个保法》《数据安全法》', v: '国内严格要求知情同意 + 最小必要；广告行业 SDK 合规成本显著上升' },
      ],
    },
    {
      title: '🛡️ 品牌安全（Brand Safety）',
      color: '#fd79a8',
      items: [
        { k: '内容审核',      v: '广告不能出现在色情 / 暴力 / 政治敏感内容旁——CV + LLM 联合预审' },
        { k: '生成式内容风险', v: 'AIGC 素材可能产生版权 / 虚假宣传 / 歧视性内容，需要生成前+生成后双审' },
        { k: 'MRC 标准',       v: '美国 Media Rating Council 定义有效曝光（≥50% 像素 + 1 秒），第三方认证必备' },
        { k: '虚假声明广告',   v: '医疗 / 金融 / 保健品广告在国内为强监管领域，AI 生成文案风险很高' },
      ],
    },
    {
      title: '🦠 反作弊与流量质量',
      color: '#ffa657',
      items: [
        { k: '机刷 / IVT',     v: '无效流量占比行业平均 10-20%，Bot Network / 模拟器点击为主要来源' },
        { k: '归因劫持',       v: '虚假 SDK / 恶意程序抢占"最后一次点击"，分走广告主归因预算' },
        { k: '设备指纹',       v: '通过 IP + UA + 设备参数识别异常；ATT 后设备指纹技术更被打压' },
        { k: '第三方监测',     v: '秒针 / AdMaster / DoubleVerify / IAS 提供第三方监测与反作弊' },
      ],
    },
    {
      title: '⚖️ 广告主 × 平台博弈',
      color: '#6c5ce7',
      items: [
        { k: '黑盒化加剧',     v: 'Advantage+ / PMax 把定向、创意、出价都"自动化"，广告主失去操控感' },
        { k: 'Walled Garden',  v: 'Meta / Google / 字节不开放用户级数据，归因靠平台自报（既是裁判又是运动员）' },
        { k: 'Clean Room',     v: 'Google ADH / Amazon AMP / 数据安全屋：双方加密数据 join，不泄露原始用户' },
        { k: '广告主自建',     v: '宝洁 / 联合利华等大广告主转向自建 CDP + MMM，降低对平台归因的依赖' },
      ],
    },
    {
      title: '📜 监管与行业趋势',
      color: '#00cec9',
      items: [
        { k: 'GDPR / CCPA',   v: '欧盟 & 加州隐私法规划定全球标准；违规罚款可达年营收 4%' },
        { k: '《生成式 AI 管理办法》', v: '国内要求 AIGC 内容显著标识，广告创意需加"AI 生成"水印' },
        { k: 'DMA（欧盟数字市场法）', v: '强制 Gatekeeper 开放数据、禁止自我偏袒——Google/Meta 广告业务受影响' },
        { k: '未成年人保护',   v: '国内外均严管针对未成年人的定向广告，COPPA / 青少年模式均有合规要求' },
      ],
    },
  ];

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-red-50/40 to-amber-50/40 rounded-2xl border border-red-100/50 p-5">
        <h3 className="text-base font-semibold text-gray-800 mb-2">🌐 广告行业的"暗流": 5 条绕不开的约束线</h3>
        <p className="text-[12px] text-gray-500 leading-relaxed">
          算法和 LLM 很亮眼，但真正决定行业走向的是<span className="text-gray-700 font-medium">隐私 / 安全 / 作弊 / 博弈 / 监管</span>这 5 条硬约束。
          理解它们，才能理解为什么 Advantage+/PMax 会以"平台黑盒化"的形式演进、为什么 MMM 会复兴、为什么 Clean Room 成为 2025 年热词。
        </p>
      </div>

      {topics.map(t => (
        <div key={t.title} className="bg-white rounded-2xl border p-5" style={{ borderColor: t.color + '33' }}>
          <h4 className="text-sm font-semibold mb-3" style={{ color: t.color }}>{t.title}</h4>
          <div className="space-y-2">
            {t.items.map(x => (
              <div key={x.k} className="flex gap-3 p-2.5 rounded-lg bg-gray-50 border border-gray-100">
                <div className="w-40 flex-shrink-0 text-[12px] font-semibold text-gray-800">{x.k}</div>
                <div className="flex-1 text-[12px] text-gray-600 leading-relaxed">{x.v}</div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* 未来趋势 */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="text-base font-semibold text-gray-800 mb-3">🔮 未来 3 年的关键趋势（主观判断）</h3>
        <div className="space-y-2 text-[12.5px]">
          {[
            { year: '2026', trend: 'Agent 投放员从"辅助"走向"主导"，广告主角色从操盘手转向目标制定者' },
            { year: '2027', trend: '对话式广告（ChatGPT/Perplexity/国内大模型）跑通商业化闭环，出现第一个"百亿级"对话广告平台' },
            { year: '2028', trend: 'Clean Room 成为跨平台归因的标配；MMM 与 Uplift 合流为统一的"因果广告衡量"框架' },
          ].map(x => (
            <div key={x.year} className="flex gap-3 items-baseline p-3 rounded-lg bg-gradient-to-r from-cyan-50/40 to-transparent">
              <span className="font-mono font-bold text-cyan-700 text-sm">{x.year}</span>
              <span className="text-gray-700">{x.trend}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── 子面板 2：三年转型路线图 ── */
function TidaRoadmap() {
  const phases = [
    {
      phase: 'Phase 1',
      year: '2025（Year 1）',
      title: '夯基础 · AI 素材工厂上线',
      color: '#00cec9',
      goal: '将 AIGC 素材渗透率从 5% 提升至 40%，素材制作周期从 3-5 天压缩至 4 小时',
      initiatives: [
        { name: '多语言文案 LLM', desc: '基于 Llama-3 / Qwen2.5 微调，支持英/西/葡/阿/日 5 语种高质量本地化文案生成' },
        { name: 'AIGC 图像素材', desc: '接入 Flux / SDXL，结合品牌 LoRA 微调，实现"商品图 → 场景化广告图"一键生成' },
        { name: '素材效果预测', desc: '训练 CTR 预估模型（基于历史 7 年数据），上线前预测素材 CTR，过滤低效素材' },
        { name: '素材数据飞轮', desc: '每次投放结果回流训练集，模型每月迭代一次，形成"生成→投放→反馈→优化"闭环' },
      ],
      kpi: ['AIGC 素材占比 ≥ 40%', '素材制作成本降低 60%', '客户素材 A/B 测试频次 ×3'],
    },
    {
      phase: 'Phase 2',
      year: '2026（Year 2）',
      title: '提智能 · AI 投放决策引擎',
      color: '#6c5ce7',
      goal: '推出"AI 投手"产品，实现出价建议自动化，1 个投手可管理账户数从 8 提升至 30',
      initiatives: [
        { name: '智能出价建议', desc: '基于历史 ROAS 数据训练出价模型，实时给出 CPA/ROAS 目标下的最优出价区间' },
        { name: '跨平台预算分配', desc: '多臂老虎机算法动态分配 Meta / Google / TikTok 预算，最大化整体 ROAS' },
        { name: '受众智能扩展', desc: 'LLM 分析高转化用户画像，自动生成 Lookalike 受众描述，辅助平台定向' },
        { name: 'AI 投手 Copilot', desc: '投手工作台嵌入 AI 助手，自然语言查询数据、获取优化建议、一键执行调整' },
      ],
      kpi: ['人均管理账户数 ≥ 30', '客户平均 ROAS 提升 15%', 'AI 投手产品 NPS ≥ 50'],
    },
    {
      phase: 'Phase 3',
      year: '2027（Year 3）',
      title: '全闭环 · AI 原生增长操作系统',
      color: '#ffa657',
      goal: '推出"AI 增长 Agent"，实现从目标输入到全链路自动化，人效达到 1 投手管 50 账户',
      initiatives: [
        { name: 'AI 增长 Agent', desc: '广告主输入"目标 + 预算 + 品牌调性"，Agent 自动完成定向-创意-出价-落地页全链路' },
        { name: '多模态素材生成', desc: '支持 AI 视频广告生成（15s/30s），覆盖 TikTok / Reels / YouTube Shorts 主流格式' },
        { name: '因果归因平台', desc: '内置 MMM + Geo-Lift 归因框架，为客户提供跨平台真实增量归因报告' },
        { name: 'SaaS → PaaS 升级', desc: '开放 API 生态，允许第三方开发者基于钛动 AI 能力构建垂直行业解决方案' },
      ],
      kpi: ['人均管理账户数 ≥ 50', '营收突破 30 亿元', 'AI 功能贡献营收占比 ≥ 40%'],
    },
  ];

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-[#6c5ce7]/5 to-[#00cec9]/5 rounded-2xl border border-[#6c5ce7]/15 p-5">
        <h3 className="text-sm font-semibold text-gray-800 mb-1">🗺️ 三年转型总纲</h3>
        <p className="text-[12px] text-gray-500 leading-relaxed">
          以<span className="font-medium text-gray-700">「素材工厂 → 投放智能 → 全链路 Agent」</span>为三步走路径，
          每年聚焦一个核心突破，避免多线并进导致资源分散。
          对标 <span className="font-medium text-gray-700">Smartly.io（2023 年估值 12 亿美元）</span> 和
          <span className="font-medium text-gray-700"> Skai（AI-first 广告平台）</span>，
          以 AI 能力密度作为核心差异化壁垒。
        </p>
      </div>

      {phases.map((p, idx) => (
        <div key={p.phase} className="bg-white rounded-2xl border p-5" style={{ borderColor: p.color + '33' }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
              style={{ background: p.color }}>
              {idx + 1}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-900">{p.title}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full text-white" style={{ background: p.color }}>{p.year}</span>
              </div>
              <p className="text-[12px] text-gray-500 mt-0.5">{p.goal}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
            {p.initiatives.map(init => (
              <div key={init.name} className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                <div className="text-[12px] font-semibold text-gray-800 mb-0.5" style={{ color: p.color }}>▸ {init.name}</div>
                <div className="text-[11.5px] text-gray-600 leading-relaxed">{init.desc}</div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {p.kpi.map(k => (
              <span key={k} className="text-[11px] px-2.5 py-1 rounded-full border font-medium"
                style={{ borderColor: p.color + '40', color: p.color, background: p.color + '08' }}>
                ✓ {k}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── 子面板 3：人力 & 物力规划 ── */
function TidaResource() {
  const headcount = [
    {
      dept: 'AI 研究院（新建）',
      color: '#6c5ce7',
      y1: 15, y2: 30, y3: 45,
      roles: [
        { role: '大模型算法工程师', y1: 5, y2: 10, y3: 15, note: '负责 LLM 微调、AIGC 模型训练' },
        { role: '多模态 / CV 工程师', y1: 4, y2: 8, y3: 12, note: '图像/视频生成模型研发' },
        { role: 'MLOps / 平台工程师', y1: 3, y2: 6, y3: 9, note: '模型训练、推理、部署基础设施' },
        { role: 'AI 产品经理', y1: 2, y2: 4, y3: 6, note: '定义 AI 功能需求，对接业务' },
        { role: '数据工程师', y1: 1, y2: 2, y3: 3, note: '数据清洗、标注、飞轮建设' },
      ],
    },
    {
      dept: '产品 & 工程（扩编）',
      color: '#00cec9',
      y1: 20, y2: 35, y3: 50,
      roles: [
        { role: '前端工程师', y1: 5, y2: 8, y3: 12, note: 'AI 功能 UI/UX 开发' },
        { role: '后端工程师', y1: 8, y2: 15, y3: 20, note: 'API 集成、Agent 框架开发' },
        { role: '产品经理', y1: 4, y2: 7, y3: 10, note: 'SaaS 产品迭代' },
        { role: '测试工程师', y1: 3, y2: 5, y3: 8, note: 'AI 功能质量保障' },
      ],
    },
    {
      dept: '商业化（扩编）',
      color: '#ffa657',
      y1: 10, y2: 20, y3: 30,
      roles: [
        { role: 'AI 解决方案顾问', y1: 5, y2: 10, y3: 15, note: '向客户销售 AI 升级套餐' },
        { role: '客户成功经理', y1: 3, y2: 6, y3: 10, note: '帮助客户落地 AI 功能' },
        { role: '市场 & 品牌', y1: 2, y2: 4, y3: 5, note: 'AI 品牌建设，行业影响力' },
      ],
    },
  ];

  const infra = [
    {
      category: '算力投入',
      color: '#6c5ce7',
      items: [
        { item: 'GPU 训练集群（Year 1）', cost: '800 万元/年', detail: '租用 A100×64 卡，用于 LLM 微调 + Diffusion 训练' },
        { item: 'GPU 训练集群（Year 2-3）', cost: '1500 万元/年', detail: '扩容至 A100×128 卡，支持更大规模模型训练' },
        { item: '推理服务器（Year 1）', cost: '300 万元/年', detail: '部署 7B 蒸馏模型，支持实时文案生成' },
        { item: '推理服务器（Year 2-3）', cost: '600 万元/年', detail: '扩容支持图像/视频生成推理' },
      ],
    },
    {
      category: '数据 & 工具',
      color: '#00cec9',
      items: [
        { item: '数据标注平台', cost: '200 万元/年', detail: '素材质量标注、RLHF 人工反馈' },
        { item: '第三方 API 费用', cost: '150 万元/年', detail: 'OpenAI / Anthropic API（过渡期使用）' },
        { item: 'MLOps 工具链', cost: '100 万元/年', detail: 'Weights & Biases / Ray / Kubeflow' },
        { item: '云存储 & CDN', cost: '200 万元/年', detail: '素材存储、全球分发加速' },
      ],
    },
    {
      category: '外部合作',
      color: '#ffa657',
      items: [
        { item: '高校联合实验室', cost: '300 万元/3年', detail: '与上海交大/复旦合作，获取前沿研究资源' },
        { item: '开源模型商业授权', cost: '50 万元/年', detail: 'Llama / Stable Diffusion 商业使用授权' },
        { item: '行业数据采购', cost: '100 万元/年', detail: '补充训练数据，提升模型泛化能力' },
      ],
    },
  ];

  const totalCost = [
    { year: 'Year 1（2025）', hc: '45 人新增', hcCost: '~3600 万元', infraCost: '~1750 万元', total: '~5350 万元' },
    { year: 'Year 2（2026）', hc: '85 人新增', hcCost: '~6800 万元', infraCost: '~2750 万元', total: '~9550 万元' },
    { year: 'Year 3（2027）', hc: '125 人新增', hcCost: '~1.0 亿元', infraCost: '~3500 万元', total: '~1.35 亿元' },
  ];

  return (
    <div className="space-y-5">
      {/* 人力规划 */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="text-sm font-semibold text-gray-800 mb-4">👥 人力规划（新增编制）</h3>
        <div className="space-y-4">
          {headcount.map(dept => (
            <div key={dept.dept} className="rounded-xl border p-4" style={{ borderColor: dept.color + '33' }}>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-[13px] font-semibold" style={{ color: dept.color }}>{dept.dept}</h4>
                <div className="flex gap-3 text-[11px] text-gray-500">
                  <span>Y1: <strong style={{ color: dept.color }}>{dept.y1}人</strong></span>
                  <span>Y2: <strong style={{ color: dept.color }}>{dept.y2}人</strong></span>
                  <span>Y3: <strong style={{ color: dept.color }}>{dept.y3}人</strong></span>
                </div>
              </div>
              <div className="space-y-1.5">
                {dept.roles.map(r => (
                  <div key={r.role} className="flex items-center gap-2 text-[12px]">
                    <div className="w-32 flex-shrink-0 text-gray-700 font-medium">{r.role}</div>
                    <div className="flex gap-2 text-gray-400 text-[11px] w-28 flex-shrink-0">
                      <span>{r.y1}→{r.y2}→{r.y3}人</span>
                    </div>
                    <div className="text-gray-500 flex-1">{r.note}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 物力规划 */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="text-sm font-semibold text-gray-800 mb-4">🖥️ 物力规划（基础设施投入）</h3>
        <div className="space-y-4">
          {infra.map(cat => (
            <div key={cat.category} className="rounded-xl border p-4" style={{ borderColor: cat.color + '33' }}>
              <h4 className="text-[13px] font-semibold mb-2" style={{ color: cat.color }}>{cat.category}</h4>
              <div className="space-y-2">
                {cat.items.map(item => (
                  <div key={item.item} className="flex gap-3 text-[12px]">
                    <div className="w-44 flex-shrink-0 text-gray-700 font-medium">{item.item}</div>
                    <div className="w-28 flex-shrink-0 font-semibold" style={{ color: cat.color }}>{item.cost}</div>
                    <div className="text-gray-500 flex-1">{item.detail}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 三年总投入汇总 */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 overflow-x-auto">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">📋 三年总投入汇总</h3>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-left text-gray-400 border-b border-gray-100">
              <th className="py-2 pr-4 font-medium">年份</th>
              <th className="py-2 pr-4 font-medium">新增人员</th>
              <th className="py-2 pr-4 font-medium">人力成本</th>
              <th className="py-2 pr-4 font-medium">基础设施</th>
              <th className="py-2 font-medium text-[#6c5ce7]">年度总投入</th>
            </tr>
          </thead>
          <tbody>
            {totalCost.map((r, i) => (
              <tr key={r.year} className={i % 2 === 0 ? 'bg-gray-50/40' : ''}>
                <td className="py-2 pr-4 font-semibold text-gray-800">{r.year}</td>
                <td className="py-2 pr-4 text-gray-600">{r.hc}</td>
                <td className="py-2 pr-4 text-gray-600">{r.hcCost}</td>
                <td className="py-2 pr-4 text-gray-600">{r.infraCost}</td>
                <td className="py-2 font-bold text-[#6c5ce7]">{r.total}</td>
              </tr>
            ))}
            <tr className="border-t border-gray-200 bg-[#6c5ce7]/5">
              <td className="py-2 pr-4 font-bold text-gray-900">三年合计</td>
              <td className="py-2 pr-4 text-gray-600">125 人新增</td>
              <td className="py-2 pr-4 text-gray-600">~2.04 亿元</td>
              <td className="py-2 pr-4 text-gray-600">~0.8 亿元</td>
              <td className="py-2 font-bold text-[#6c5ce7] text-base">~2.84 亿元</td>
            </tr>
          </tbody>
        </table>
        <p className="text-[11px] text-gray-400 mt-2 italic">
          * 人力成本按平均薪资 AI 岗 80 万/年、产品工程 60 万/年、商业化 50 万/年估算（含社保公积金）
        </p>
      </div>
    </div>
  );
}

/* ── 子面板 4：ROI 测算 ── */
function TidaROI() {
  const scenarios = [
    {
      name: '保守情景',
      color: '#e17055',
      assumption: 'AI 功能渗透慢，客户升级意愿低，竞争加剧',
      revenue: [
        { year: '2025', base: 10, aiIncrement: 0.5, total: 10.5, aiRatio: '5%' },
        { year: '2026', base: 12, aiIncrement: 2.0, total: 14, aiRatio: '14%' },
        { year: '2027', base: 14, aiIncrement: 4.0, total: 18, aiRatio: '22%' },
      ],
      pe: '18×',
      valuation: '~32 亿元',
    },
    {
      name: '基准情景',
      color: '#6c5ce7',
      assumption: 'AI 功能按计划落地，客户 ARPU 提升，新客加速',
      revenue: [
        { year: '2025', base: 10, aiIncrement: 1.5, total: 11.5, aiRatio: '13%' },
        { year: '2026', base: 13, aiIncrement: 5.0, total: 18, aiRatio: '28%' },
        { year: '2027', base: 16, aiIncrement: 14, total: 30, aiRatio: '47%' },
      ],
      pe: '25×',
      valuation: '~75 亿元',
    },
    {
      name: '乐观情景',
      color: '#3fb950',
      assumption: 'AI Agent 爆发，出海市场高增，平台效应显现',
      revenue: [
        { year: '2025', base: 10, aiIncrement: 3.0, total: 13, aiRatio: '23%' },
        { year: '2026', base: 15, aiIncrement: 10, total: 25, aiRatio: '40%' },
        { year: '2027', base: 20, aiIncrement: 25, total: 45, aiRatio: '56%' },
      ],
      pe: '30×',
      valuation: '~135 亿元',
    },
  ];

  const roiDrivers = [
    {
      driver: '① AIGC 素材溢价',
      color: '#a29bfe',
      mechanism: '客户使用 AI 素材功能，ARPU 从 3.3 万元/年提升至 5 万元/年（+50%）',
      math: '3000 客户 × 1.7 万元增量 = 5100 万元/年增量营收',
      confidence: '高',
    },
    {
      driver: '② AI 投手人效提升',
      color: '#00cec9',
      mechanism: '人均管理账户从 8 提升至 30，同等人力可服务 3.75× 客户，或降低 60% 人力成本',
      math: '节省 200 名投手 × 30 万元/年 = 6000 万元/年成本节约',
      confidence: '中高',
    },
    {
      driver: '③ 新客获取加速',
      color: '#6c5ce7',
      mechanism: 'AI 差异化壁垒吸引中大型出海品牌，客户数从 3000 增至 5000+',
      math: '2000 新客 × 5 万元 ARPU = 1 亿元/年新增营收',
      confidence: '中',
    },
    {
      driver: '④ 续费率提升',
      color: '#ffa657',
      mechanism: 'AI 功能深度绑定工作流，续费率从 75% 提升至 85%',
      math: '3000 客户 × 10% 续费提升 × 5 万元 ARPU = 1500 万元/年',
      confidence: '高',
    },
    {
      driver: '⑤ PE 估值重估',
      color: '#3fb950',
      mechanism: '从"广告工具 SaaS"（12× PE）重新定位为"AI 原生增长平台"（30× PE）',
      math: '30 亿营收 × 30× PE = 90 亿元估值（vs 当前 10 亿 × 12× = 120 亿元）',
      confidence: '取决于 AI 收入占比',
    },
  ];

  const investReturn = [
    { item: '三年总投入', value: '~2.84 亿元', note: '人力 + 基础设施' },
    { item: '三年累计 AI 增量营收（基准）', value: '~20.5 亿元', note: '1.5+5+14 亿元' },
    { item: '三年累计 AI 增量毛利（60% 毛利率）', value: '~12.3 亿元', note: '' },
    { item: '净 ROI（基准情景）', value: '~4.3×', note: '12.3 / 2.84' },
    { item: '估值增量（基准情景）', value: '~+45 亿元', note: '75 亿 - 当前 ~30 亿' },
  ];

  return (
    <div className="space-y-5">
      {/* ROI 驱动因子 */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">🔑 ROI 的 5 个驱动因子</h3>
        <div className="space-y-3">
          {roiDrivers.map(d => (
            <div key={d.driver} className="rounded-xl border p-4" style={{ borderColor: d.color + '33' }}>
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-[13px] font-semibold" style={{ color: d.color }}>{d.driver}</h4>
                <span className="text-[10px] px-2 py-0.5 rounded-full border font-medium"
                  style={{ borderColor: d.color + '40', color: d.color }}>
                  置信度：{d.confidence}
                </span>
              </div>
              <p className="text-[12px] text-gray-600 leading-relaxed mb-1">{d.mechanism}</p>
              <div className="px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-100">
                <span className="text-[11px] text-gray-400">测算：</span>
                <span className="text-[12px] font-mono text-gray-700">{d.math}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 三情景营收预测 */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">📊 三情景营收预测（亿元）</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {scenarios.map(s => (
            <div key={s.name} className="rounded-xl border p-4" style={{ borderColor: s.color + '33' }}>
              <div className="text-sm font-bold mb-1" style={{ color: s.color }}>{s.name}</div>
              <p className="text-[11px] text-gray-500 mb-3 leading-relaxed">{s.assumption}</p>
              <div className="space-y-2">
                {s.revenue.map(r => (
                  <div key={r.year} className="flex items-center justify-between text-[12px]">
                    <span className="font-mono text-gray-500">{r.year}</span>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-400">{r.base}+</span>
                      <span style={{ color: s.color }} className="font-semibold">{r.aiIncrement}</span>
                      <span className="text-gray-400">=</span>
                      <span className="font-bold text-gray-800">{r.total} 亿</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full ml-1"
                        style={{ background: s.color + '15', color: s.color }}>
                        AI {r.aiRatio}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
                <div>
                  <div className="text-[10px] text-gray-400">目标 PE</div>
                  <div className="text-lg font-bold" style={{ color: s.color }}>{s.pe}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-gray-400">2027 年估值</div>
                  <div className="text-base font-bold text-gray-800">{s.valuation}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-gray-400 mt-2 italic">
          * 基础营收按年增长 15-20% 估算（出海市场自然增长）；AI 增量为 AI 功能带来的额外营收
        </p>
      </div>

      {/* 投入产出汇总 */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">💰 投入产出汇总（基准情景）</h3>
        <div className="space-y-2">
          {investReturn.map((r, i) => (
            <div key={r.item} className={`flex items-center justify-between p-3 rounded-lg ${i === investReturn.length - 1 ? 'bg-[#6c5ce7]/8 border border-[#6c5ce7]/20' : 'bg-gray-50 border border-gray-100'}`}>
              <div className="text-[13px] text-gray-700">{r.item}</div>
              <div className="flex items-center gap-2">
                <span className={`font-bold text-[14px] ${i === investReturn.length - 1 ? 'text-[#6c5ce7]' : 'text-gray-800'}`}>{r.value}</span>
                {r.note && <span className="text-[11px] text-gray-400">（{r.note}）</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 关键风险 */}
      <div className="bg-white rounded-2xl border border-red-100/50 p-5">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">⚠️ 关键风险与对冲策略</h3>
        <div className="space-y-2 text-[12.5px]">
          {[
            { risk: '平台 API 政策收紧', mitigation: 'Meta/Google 限制第三方 API 访问 → 加深官方合作伙伴关系，争取 Tier-0 资质' },
            { risk: 'AI 人才竞争激烈', mitigation: '大厂抢人导致薪资通胀 → 股权激励 + 高校联合培养 + 远程团队' },
            { risk: '大模型成本居高不下', mitigation: '推理成本过高侵蚀毛利 → 自研蒸馏小模型 + 边缘推理优化' },
            { risk: '竞品快速跟进', mitigation: 'Smartly.io / Mintegral 推出类似功能 → 以数据飞轮建立先发壁垒，加速迭代' },
            { risk: '客户 AI 接受度低', mitigation: '中小客户不愿为 AI 付费 → 先免费内嵌，再通过效果数据证明价值后升级收费' },
          ].map(x => (
            <div key={x.risk} className="flex gap-3 p-3 rounded-lg bg-red-50/30 border border-red-100/50">
              <div className="w-36 flex-shrink-0 font-semibold text-red-700">{x.risk}</div>
              <div className="flex-1 text-gray-600 leading-relaxed">{x.mitigation}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 结论 */}
      <div className="rounded-2xl p-5 border border-[#6c5ce7]/20 bg-gradient-to-br from-[#6c5ce7]/5 to-[#3fb950]/5">
        <h3 className="text-sm font-semibold text-gray-800 mb-2">🎯 结论：转型可行性判断</h3>
        <p className="text-[13px] text-gray-700 leading-relaxed">
          钛动科技具备转型的<span className="font-medium">数据资产（7 年投放数据）、客户基础（3000+ 品牌）、平台资质（Tier-1 代理）</span>三大核心要素。
          三年 <span className="font-bold text-[#6c5ce7]">2.84 亿元</span>的转型投入，在基准情景下可带来
          <span className="font-bold text-[#6c5ce7]"> 4.3× 净 ROI</span> 和
          <span className="font-bold text-[#6c5ce7]"> +45 亿元估值增量</span>，
          实现从 <span className="font-bold text-[#e17055]">12× PE</span> 向 <span className="font-bold text-[#6c5ce7]">25-30× PE</span> 的跃迁。
          关键成功要素在于：<span className="font-medium">Year 1 素材工厂必须跑通数据飞轮</span>，这是后续一切 AI 能力的基础。
        </p>
      </div>
    </div>
  );
}
