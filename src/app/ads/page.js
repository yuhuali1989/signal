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
