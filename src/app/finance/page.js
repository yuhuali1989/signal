'use client';
import React, { useState } from 'react';
import useHashState from '@/hooks/useHashState';
import Link from 'next/link';
import Footer from '@/components/Footer';

const TABS = [
  { id: 'llm',      name: '大模型应用',   icon: '🧠', desc: '银行 / 券商 / 保险三大场景的 LLM 落地 + 部署经济账' },
  { id: 'risk',     name: '风控算法深潜', icon: '📊', desc: '信用评分卡 · 图网络反欺诈 · PD/LGD 模型 · 异常检测' },
  { id: 'privacy',  name: '隐私计算原理', icon: '🔐', desc: 'FL · HE · MPC · TEE 四大技术路线 + 横向对比' },
  { id: 'advanced', name: '隐私计算进阶', icon: '🔗', desc: '联邦 LoRA · FHE+LLM · 差分隐私 · 零知识证明 · 性能基准' },
  { id: 'scene',    name: '金融场景应用', icon: '🏦', desc: '隐私计算在金融的真实落地与大模型交叉' },
  { id: 'reg',      name: '监管与合规',   icon: '📜', desc: '巴塞尔协议 · 数据出境 · 模型可解释性 · AI 治理' },
  { id: 'case',     name: '标杆案例',     icon: '🔭', desc: '蚂蚁 / 微众 / 摩根士丹利 / 高盛 + 国内银行横评' },
  { id: 'fintech',  name: '金融科技演进', icon: '💹', desc: '电子化 → 互联网金融 → AI 原生金融 · 开放银行 · 嵌入式金融' },
  { id: 'plan',     name: 'AI战略规划',  icon: '🗺️', desc: '平安银行金融 AI 战略部五年业务规划 · 人力 · 成本 · 目标 · ROI' },
];

export default function FinancePage() {
  const [tab, setTab] = useHashState('tab', 'llm');

  return (
    <>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {/* Hero */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-gray-900">🏦 金融业务</h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-100 font-medium">
              银行 · 大模型 · 隐私计算 · 深度扩展版 v2
            </span>
          </div>
          <p className="text-sm text-gray-500">
            金融行业大模型落地主线 + 隐私计算四大技术（FL / HE / MPC / TEE）的原理与场景应用
          </p>
          <p className="text-xs text-gray-400 mt-1 leading-relaxed max-w-3xl">
            本模块在广度覆盖基础上，新增<span className="text-gray-600 font-medium">风控算法深潜、隐私计算进阶、监管合规、金融科技演进</span>四条深度支线。
            量化交易相关内容请参见 <Link href="/quant/" className="text-[#00cec9] underline underline-offset-2">量化业务模块</Link>。
          </p>
        </div>

        {/* 核心亮点 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-8">
          {[
            { icon: '🧠', label: '投研助手',     desc: '研报摘要',     color: '#6c5ce7' },
            { icon: '💬', label: '智能客服',     desc: 'RAG 知识库',   color: '#00cec9' },
            { icon: '🛡️', label: '风控反欺诈',   desc: 'Graph+LLM',   color: '#e17055' },
            { icon: '📊', label: '信用评分卡',   desc: 'PD/LGD/EAD',  color: '#f87171' },
            { icon: '🔐', label: '联邦学习',     desc: '多方联合建模', color: '#3fb950' },
            { icon: '🧮', label: '同态加密',     desc: '密文推理',     color: '#a29bfe' },
            { icon: '🏛️', label: 'TEE 可信执行', desc: 'SGX/TDX',     color: '#ffa657' },
            { icon: '📜', label: '监管合规',     desc: '巴塞尔/GDPR',  color: '#fd79a8' },
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

        <p className="text-xs text-gray-400 mb-6">
          {TABS.find(t => t.id === tab)?.desc}
        </p>

        {tab === 'llm'      && <LlmSection />}
        {tab === 'risk'     && <RiskSection />}
        {tab === 'privacy'  && <PrivacySection />}
        {tab === 'advanced' && <AdvancedPrivacySection />}
        {tab === 'scene'    && <SceneSection />}
        {tab === 'reg'      && <RegSection />}
        {tab === 'case'     && <CaseSection />}
        {tab === 'fintech'  && <FintechSection />}
        {tab === 'plan'     && <PlanSection />}

        <div className="mt-10 p-4 bg-gray-50 rounded-2xl border border-gray-100 text-xs text-gray-400 leading-relaxed">
          <span className="font-medium text-gray-500">📌 说明：</span>
          金融行业的核心矛盾是"数据价值"与"数据合规"。v2 版本在原 4 Tab 基础上扩充了风控算法深潜、隐私计算进阶、监管合规、金融科技演进四条支线。
          量化交易详见 <Link href="/quant/" className="text-[#00cec9] underline underline-offset-2">/quant/</Link> 模块。
        </div>
      </div>
      <Footer />
    </>
  );
}

/* ═══════════════════════════════════════════════════════════
   ①  大模型应用（保留 + 增补"部署经济账"与"落地难点"）
   ═══════════════════════════════════════════════════════════ */
function LlmSection() {
  const scenes = [
    {
      domain: '🏛️ 银行',
      color: '#6c5ce7',
      apps: [
        { name: '智能客服 & 知识库 RAG', detail: '替代传统检索式 FAQ，覆盖对公对私、信用卡、合规问答；代表：招行 AICC、建行龙智平台' },
        { name: '对公信贷辅助',         detail: 'LLM 读取企业年报 / 工商 / 司法数据生成初步授信建议，人工复核' },
        { name: '内部 Copilot',         detail: '研发代码 Copilot、合规文档起草、SQL 生成；代表：工行、交行内部大模型' },
        { name: '反洗钱 AML',           detail: 'LLM 生成可疑交易报告 (SAR) 草稿，降低合规人员重复性工作' },
      ],
    },
    {
      domain: '📈 券商 / 投研',
      color: '#00cec9',
      apps: [
        { name: '研报生成 / 摘要',       detail: 'LLM 读取招股书、财报、卖方研报，输出结构化摘要与对比分析' },
        { name: '路演问答助手',         detail: '基于公司公告 + 财务数据，实时回答投资者路演问题' },
        { name: '另类数据理解',         detail: '卫星图 / 招聘数据 / 社交舆情的多模态理解，形成投资信号' },
        { name: '合规审核',             detail: 'LLM 识别研报、营销物料中的合规风险点，减少罚单' },
      ],
    },
    {
      domain: '🛡️ 保险',
      color: '#e17055',
      apps: [
        { name: '核保核赔',             detail: '图像+文本多模态：识别事故现场图、体检报告、病历，自动化核赔' },
        { name: '智能顾问',             detail: '基于客户画像与保险条款，用 LLM 做个性化方案讲解' },
        { name: '反欺诈',               detail: '跨保单关系图 + LLM 语义识别，挖掘团伙骗保' },
      ],
    },
    {
      domain: '🔁 跨行业通用',
      color: '#fd79a8',
      apps: [
        { name: '风控反欺诈',           detail: '图网络 + LLM：LLM 作为"描述器"理解复杂关系图谱，生成审查理由' },
        { name: '合规审查',             detail: 'KYC / 反洗钱 / 境外制裁名单语义匹配' },
        { name: '流程自动化 (RPA+LLM)', detail: 'Agent 取代固定脚本的 RPA，面向合同、表单的弹性自动化' },
      ],
    },
  ];

  return (
    <div className="space-y-4">
      {scenes.map(s => (
        <div key={s.domain} className="bg-white rounded-2xl border p-5"
          style={{ borderColor: s.color + '33' }}>
          <h3 className="text-base font-semibold mb-3" style={{ color: s.color }}>{s.domain}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {s.apps.map(a => (
              <div key={a.name} className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                <div className="text-sm font-semibold text-gray-800 mb-1">{a.name}</div>
                <div className="text-[12px] text-gray-500 leading-relaxed">{a.detail}</div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* 新增：部署经济账 */}
      <div className="bg-white rounded-2xl border border-amber-100 p-5">
        <h3 className="text-base font-semibold text-amber-700 mb-3">💸 金融 LLM 部署经济账</h3>
        <p className="text-[13px] text-gray-600 leading-relaxed mb-3">
          金融行业对<span className="text-gray-800 font-medium">数据不出域</span>有刚性要求，大模型必须私有化部署或使用隐私计算方案。
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { k: '私有化部署成本', v: '70B 模型 8×A100 集群 ~¥200 万/年（含运维），7B 蒸馏模型 2×A100 ~¥30 万/年', color: '#6c5ce7' },
            { k: 'ROI 测算',       v: '智能客服：替代 50% 人工坐席 → 年省 ¥500-2000 万（中型银行）；投研助手：分析师效率提升 30-50%', color: '#00cec9' },
            { k: '合规附加成本',   v: '模型审计 + 可解释性报告 + 数据脱敏 Pipeline → 额外 20-40% 的工程成本', color: '#e17055' },
          ].map(x => (
            <div key={x.k} className="p-3 rounded-xl border text-[12px]" style={{ borderColor: x.color + '33' }}>
              <div className="font-semibold text-gray-800 mb-1">{x.k}</div>
              <div className="text-gray-600 leading-relaxed">{x.v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 新增：落地难点 */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="text-base font-semibold text-gray-800 mb-3">⚠️ 金融 LLM 落地的 5 大难点</h3>
        <div className="space-y-2">
          {[
            { k: '幻觉问题（Hallucination）', v: '金融场景零容忍——一个错误的利率数字可能导致合规事故。必须 RAG + 事实校验 + 人工复核三重保障。' },
            { k: '可解释性要求',               v: '监管要求模型决策可追溯（巴塞尔 SR 11-7）。LLM 的黑盒特性与此天然矛盾，需要 Chain-of-Thought + 归因日志。' },
            { k: '数据孤岛',                   v: '银行内部数据分散在核心系统、信贷系统、反洗钱系统，打通成本极高；跨机构更需隐私计算。' },
            { k: '实时性要求',                 v: '交易风控需 <50ms 响应，LLM 推理延迟（秒级）不适合实时链路，只能做离线/准实时辅助。' },
            { k: '人才稀缺',                   v: '既懂金融业务又懂大模型的复合人才极少，银行 IT 部门传统以 Java/Oracle 为主。' },
          ].map(x => (
            <div key={x.k} className="flex gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
              <div className="w-44 flex-shrink-0 text-[12px] font-semibold text-gray-800">{x.k}</div>
              <div className="flex-1 text-[12px] text-gray-600 leading-relaxed">{x.v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   ②  风控算法深潜（新增）
   ═══════════════════════════════════════════════════════════ */
function RiskSection() {
  const algos = [
    {
      name: '信用评分卡（Scorecard）',
      year: '1950s 起 · 至今仍是主流',
      color: '#6c5ce7',
      problem: '如何量化个人/企业的违约概率，且结果必须可解释、可审计',
      idea: '逻辑回归 + WoE（Weight of Evidence）编码 + IV（Information Value）特征筛选',
      formula: 'Score = Offset + Factor × ln(Odds)    Odds = P(Good)/P(Bad)',
      trick: '分箱（Binning）是核心工程：等频/等距/卡方/决策树分箱各有适用场景；拒绝推断（Reject Inference）解决"被拒客户无标签"问题',
    },
    {
      name: '图网络反欺诈（GNN Anti-Fraud）',
      year: '2019 起 · 快速普及',
      color: '#e17055',
      problem: '欺诈者通过"养号-团伙-中介"形成网络，单点特征难以识别',
      idea: '构建 用户-设备-商户-IP 异构图，用 GNN 传播邻居信息，团伙节点特征趋同',
      formula: 'h_v^(l+1) = σ( Σ_{u∈N(v)} α_{vu} · W · h_u^(l) )    ← GAT 注意力聚合',
      trick: '关键：图构建质量 > 模型复杂度；需要处理极端类别不平衡（欺诈率 <0.1%）；GraphSAGE 采样 + Mini-batch 解决大图训练',
    },
    {
      name: 'PD / LGD / EAD 三件套',
      year: '巴塞尔 II (2004) 起',
      color: '#3fb950',
      problem: '银行需要计算每笔贷款的预期损失（EL）和经济资本',
      idea: 'EL = PD × LGD × EAD；PD 用评分卡/ML，LGD 用 Beta 回归/Tobit，EAD 用 CCF 转换因子',
      formula: 'EL = PD × LGD × EAD\nUL = f(PD, LGD, EAD, ρ)    ← 资本计量公式',
      trick: '监管要求 PD 模型有"经济周期调整"（TTC vs PIT）；LGD 需区分"下行情景"；模型验证需 Gini/KS/PSI 三指标',
    },
    {
      name: '异常检测（Anomaly Detection）',
      year: '持续演进',
      color: '#ffa657',
      problem: '实时交易流中识别异常模式（盗刷、洗钱、市场操纵）',
      idea: '规则引擎（一线）+ 统计模型（二线）+ ML/DL（三线）三层防御',
      formula: 'Isolation Forest: s(x) = 2^(-E[h(x)]/c(n))    ← 路径越短越异常',
      trick: '金融异常检测的核心难点是"概念漂移"——欺诈手法持续变化，模型需要在线学习 + 定期重训；Autoencoder 重构误差也是常用方案',
    },
    {
      name: '实时风控引擎架构',
      year: '2018 起 · 流式计算',
      color: '#a29bfe',
      problem: '交易风控需要在 <50ms 内完成特征计算 + 模型推理 + 规则判定',
      idea: '事件驱动架构：Kafka → Flink 实时特征 → 模型服务 → 规则引擎 → 决策',
      formula: '延迟预算：特征计算 ~15ms + 模型推理 ~10ms + 规则 ~5ms + 网络 ~10ms ≈ 40ms',
      trick: '特征存储用 Redis/HBase 热温分离；模型用 ONNX/TensorRT 加速；规则引擎用 Drools/自研 DSL；灰度发布 + A/B 实验',
    },
    {
      name: 'LLM + 风控的融合探索',
      year: '2024 起 · 前沿',
      color: '#fd79a8',
      problem: '传统风控模型只能处理结构化特征，无法理解非结构化文本（合同、聊天记录、新闻）',
      idea: 'LLM 作为"特征提取器"或"决策解释器"，与传统模型互补',
      formula: '方案 A：LLM Embedding → 传统模型特征\n方案 B：传统模型决策 → LLM 生成解释报告',
      trick: 'LLM 不适合做实时风控主链路（延迟太高），但适合做离线审查、SAR 报告生成、复杂案件分析',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-purple-50/40 to-red-50/40 rounded-2xl border border-purple-100/50 p-5">
        <h3 className="text-base font-semibold text-gray-800 mb-2">📊 金融风控的 6 个核心算法 / 架构</h3>
        <p className="text-[12px] text-gray-500 leading-relaxed">
          金融风控是<span className="text-gray-700 font-medium">最成熟的 ML 工业应用领域之一</span>——
          信用评分卡已有 70 年历史，但图网络、LLM 正在带来新一轮变革。
          核心约束：<span className="text-gray-700 font-medium">可解释性 + 实时性 + 监管合规</span>。
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
              <div className="text-[10px] text-gray-400 mb-0.5">公式 / 架构</div>
              <code className="text-[11.5px] text-gray-700 font-mono leading-relaxed whitespace-pre-wrap">{a.formula}</code>
            </div>
            <div>
              <span className="text-[11px] text-gray-400 font-medium">🔧 工程要点：</span>
              <span className="text-gray-600 italic">{a.trick}</span>
            </div>
          </div>
        </div>
      ))}

      {/* 风控模型评估指标 */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 overflow-x-auto">
        <h3 className="text-base font-semibold text-gray-800 mb-3">📏 风控模型评估指标体系</h3>
        <table className="w-full text-[12.5px]">
          <thead>
            <tr className="text-left text-gray-400 border-b border-gray-100">
              <th className="py-2 pr-3 font-medium">指标</th>
              <th className="py-2 pr-3 font-medium">含义</th>
              <th className="py-2 pr-3 font-medium">合格线</th>
              <th className="py-2 font-medium">适用场景</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['KS（Kolmogorov-Smirnov）', '好坏客户分布最大分离度', '≥ 0.20', '信用评分卡'],
              ['Gini / AUC',               '排序能力（Gini = 2×AUC−1）', 'AUC ≥ 0.70', '所有二分类风控模型'],
              ['PSI（Population Stability）', '模型稳定性（训练 vs 线上分布偏移）', '< 0.10 稳定 / 0.10-0.25 需关注', '模型监控'],
              ['Precision@K',              '前 K% 高风险样本中的真实欺诈占比', '视业务而定', '反欺诈'],
              ['Lift',                     '模型 vs 随机的提升倍数',       '≥ 3x', '营销 / 催收'],
              ['Brier Score',              '概率校准度',                   '< 0.10', 'PD 模型（监管要求）'],
            ].map((r, i) => (
              <tr key={r[0]} className={i % 2 === 0 ? 'bg-gray-50/40' : ''}>
                <td className="py-2 pr-3 text-gray-800 font-medium">{r[0]}</td>
                <td className="py-2 pr-3 text-gray-600">{r[1]}</td>
                <td className="py-2 pr-3 text-gray-700 font-mono">{r[2]}</td>
                <td className="py-2 text-gray-500">{r[3]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   ③  隐私计算原理（保留）
   ═══════════════════════════════════════════════════════════ */
function PrivacySection() {
  const techs = [
    {
      name: '① 联邦学习 (Federated Learning)',
      color: '#3fb950',
      principle: '各参与方本地训练模型，只交换梯度 / 模型参数，不交换原始数据。协调者聚合梯度后下发新模型',
      formula: 'w_{t+1} = w_t − η · (1/K) Σ_k ∇L_k(w_t;  D_k)',
      strength: '通信/计算开销相对可控，工程成熟度最高',
      weakness: '梯度本身仍可能泄露数据（梯度反演攻击），需配合 DP / 加密',
      vendors: '微众 FATE · 腾讯 Angel PowerFL · 阿里蚂蚁 SecretFlow · Google TFF',
    },
    {
      name: '② 同态加密 (Homomorphic Encryption)',
      color: '#a29bfe',
      principle: '在密文上直接做加/乘运算，结果解密后等价于明文运算。分 PHE / SHE / FHE',
      formula: 'Dec( Enc(a) ⊕ Enc(b) ) = a + b,   Dec( Enc(a) ⊗ Enc(b) ) = a × b',
      strength: '理论上最强安全性，双方都不暴露明文',
      weakness: 'FHE 性能开销极大（~万倍明文），密文膨胀明显；多用于 PHE + 特定算法',
      vendors: 'Microsoft SEAL · IBM HElib · Zama · 蚂蚁 occlum',
    },
    {
      name: '③ 安全多方计算 (MPC)',
      color: '#e17055',
      principle: '多方把秘密切成分片（Secret Sharing），在分片上协同计算，任何少数方无法重建明文',
      formula: 'x = x_1 + x_2 + x_3 (mod p)；  各方只持有一个分片',
      strength: '功能最通用，可实现任意函数的联合计算',
      weakness: '对网络带宽与往返延迟非常敏感，跨地域慢',
      vendors: 'Sharemind · SPDZ · 蚂蚁 SecretFlow SPU · 蓝象智联',
    },
    {
      name: '④ 可信执行环境 (TEE)',
      color: '#ffa657',
      principle: '在 CPU 内划出加密内存区（Enclave），数据在内部明文计算，外部任何人包括 root 都无法读取',
      formula: '硬件保证：  Enclave Memory ⊕ Attestation Key',
      strength: '性能接近明文计算，工程改造小',
      weakness: '依赖硬件厂商信任（Intel / AMD / ARM），历史上有侧信道攻击（Foreshadow 等）',
      vendors: 'Intel SGX/TDX · AMD SEV · ARM CCA · NVIDIA H100 Confidential Computing',
    },
  ];

  return (
    <div className="space-y-4">
      {techs.map(t => (
        <div key={t.name} className="bg-white rounded-2xl border p-5"
          style={{ borderColor: t.color + '33' }}>
          <h3 className="text-base font-semibold mb-3" style={{ color: t.color }}>{t.name}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[13px] text-gray-600 leading-relaxed">
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
              <div className="text-[11px] font-semibold text-gray-400 mb-1">原理</div>
              {t.principle}
            </div>
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
              <div className="text-[11px] font-semibold text-gray-400 mb-1">核心公式</div>
              <code className="font-mono text-[12px] text-gray-700 block whitespace-pre-wrap">{t.formula}</code>
            </div>
            <div className="p-3 rounded-lg border" style={{ borderColor: t.color + '22', background: t.color + '06' }}>
              <div className="text-[11px] font-semibold mb-1" style={{ color: t.color }}>优点</div>
              {t.strength}
            </div>
            <div className="p-3 rounded-lg border border-red-100 bg-red-50/40">
              <div className="text-[11px] font-semibold mb-1 text-red-500">局限</div>
              {t.weakness}
            </div>
          </div>
          <p className="text-[12px] text-gray-500 mt-3">
            <span className="text-gray-400">主要厂商/开源：</span>
            <span className="font-mono">{t.vendors}</span>
          </p>
        </div>
      ))}

      {/* 对比表 */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 overflow-x-auto">
        <h3 className="text-base font-semibold text-gray-800 mb-3">⚖️ 四大技术横向对比</h3>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-left text-[11px] text-gray-400 uppercase border-b border-gray-100">
              <th className="py-2 pr-3">维度</th>
              <th className="py-2 px-3">FL 联邦学习</th>
              <th className="py-2 px-3">HE 同态加密</th>
              <th className="py-2 px-3">MPC 多方计算</th>
              <th className="py-2 px-3">TEE 可信执行</th>
            </tr>
          </thead>
          <tbody className="text-gray-600">
            {[
              ['安全性假设', '半诚实/DP',        '加密学困难问题', '半诚实 / 恶意模型', '硬件厂商信任'],
              ['性能开销',   '低（~1.x）',       '高（HE 可达 10³~10⁵）', '中高（通信敏感）', '低（~1.1x）'],
              ['通信开销',   '中',               '低',              '高',                '低'],
              ['适用场景',   '联合建模 / 微调',   '密文推理 / 特定算法', '联合统计 / 交集', '通用计算 / LLM 推理'],
              ['金融落地度', '★★★★',            '★★',              '★★★',              '★★★★'],
            ].map((row, i) => (
              <tr key={i} className="border-b border-gray-50 last:border-0">
                <td className="py-2 pr-3 font-semibold text-gray-700">{row[0]}</td>
                {row.slice(1).map((c, j) => <td key={j} className="py-2 px-3">{c}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   ④  隐私计算进阶（新增）
   ═══════════════════════════════════════════════════════════ */
function AdvancedPrivacySection() {
  const topics = [
    {
      name: '联邦 LoRA 微调',
      color: '#3fb950',
      what: '多家银行各自用本地数据做 LoRA 微调，只上传 LoRA 参数（~MB 级）到聚合服务器，聚合后下发',
      why: '大模型全量联邦训练通信成本过高（百 GB 级梯度），LoRA 把通信量压缩 1000 倍',
      how: [
        '各方本地：冻结基座，只训练 LoRA 矩阵 A、B（rank=8~64）',
        '聚合服务器：FedAvg / FedProx 聚合 LoRA 参数',
        '可选加密：上传前对 LoRA 参数做 HE 加密或 DP 加噪',
      ],
      challenge: '异构数据导致 LoRA 方向冲突（Non-IID 问题）；需要 FedProx / SCAFFOLD 等算法缓解',
    },
    {
      name: 'FHE + LLM 密文推理',
      color: '#a29bfe',
      what: '用户 prompt 加密后发送给服务方，服务方在密文上执行 LLM 推理，返回密文结果，用户本地解密',
      why: '最强隐私保证——服务方全程看不到明文 prompt 和 response',
      how: [
        '核心难点：LLM 中的非线性层（Softmax / GELU）无法直接在 FHE 上计算',
        '解决方案：多项式近似（Polynomial Approximation）替代非线性函数',
        '代表：Zama Concrete ML · CrypTen · TenSEAL',
      ],
      challenge: '当前 FHE LLM 推理延迟仍在分钟~小时级（vs 明文秒级），仅适用于极高隐私场景',
    },
    {
      name: '差分隐私（Differential Privacy）',
      color: '#e17055',
      what: '在数据/梯度/输出中加入校准噪声，使得单条记录的有无不影响最终结果',
      why: '提供数学可证明的隐私保证（ε-DP），是 FL 和数据发布的"最后一道防线"',
      how: [
        '核心公式：P[M(D) ∈ S] ≤ e^ε · P[M(D\') ∈ S] + δ',
        'DP-SGD：每步梯度裁剪 + 高斯噪声 → 训练过程满足 (ε,δ)-DP',
        'Apple / Google 在用户数据收集中大规模使用 Local DP',
      ],
      challenge: '隐私预算 ε 越小越安全但模型精度下降越多；金融场景通常 ε ∈ [1, 10]',
    },
    {
      name: '零知识证明（ZKP）',
      color: '#6c5ce7',
      what: '证明者向验证者证明"我知道某个秘密"，但不泄露秘密本身',
      why: '在金融中用于：身份验证（证明年龄 > 18 但不暴露生日）、合规审计（证明交易合规但不暴露细节）',
      how: [
        'zk-SNARK：简洁非交互式，证明体积小（~几百字节），验证快',
        'zk-STARK：无需可信设置，抗量子，但证明体积较大',
        '应用：数字货币（Zcash）、DeFi 合规、跨境 KYC',
      ],
      challenge: '电路编写复杂度高；通用 ZKP 编译器（Circom / Noir）仍在成熟中',
    },
    {
      name: '隐私集合求交（PSI）',
      color: '#ffa657',
      what: '两方各持有一个集合，只得到交集结果，不暴露各自的非交集元素',
      why: '金融最常见的隐私计算场景——银行 A 和银行 B 找共同客户做联合风控',
      how: [
        '基于 OT（Oblivious Transfer）的 PSI：通信效率高',
        '基于 DH（Diffie-Hellman）的 PSI：实现简单',
        '基于布隆过滤器的 PSI：适合大规模集合',
      ],
      challenge: '亿级集合的 PSI 仍需分钟级；需防止"差集攻击"（多次 PSI 推断非交集元素）',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-green-50/40 to-purple-50/40 rounded-2xl border border-green-100/50 p-5">
        <h3 className="text-base font-semibold text-gray-800 mb-2">🔗 隐私计算进阶：5 个前沿方向</h3>
        <p className="text-[12px] text-gray-500 leading-relaxed">
          基础四大技术（FL/HE/MPC/TEE）之上，金融行业正在探索更精细的隐私保护方案。
          这些技术<span className="text-gray-700 font-medium">不是互斥的，而是组合使用</span>——
          例如"联邦 LoRA + DP 加噪 + TEE 聚合"是当前最实用的金融大模型隐私方案。
        </p>
      </div>

      {topics.map(t => (
        <div key={t.name} className="bg-white rounded-2xl border p-5"
          style={{ borderColor: t.color + '33' }}>
          <h4 className="text-sm font-semibold mb-2" style={{ color: t.color }}>{t.name}</h4>
          <div className="space-y-2 text-[12.5px]">
            <div>
              <span className="text-[11px] text-gray-400 font-medium">📖 是什么：</span>
              <span className="text-gray-700">{t.what}</span>
            </div>
            <div>
              <span className="text-[11px] text-gray-400 font-medium">💡 为什么重要：</span>
              <span className="text-gray-700">{t.why}</span>
            </div>
            <div className="px-3 py-2 rounded-lg bg-gray-50 border border-gray-100">
              <div className="text-[10px] text-gray-400 mb-1">怎么做</div>
              <ul className="space-y-1">
                {t.how.map((h, i) => (
                  <li key={i} className="flex gap-2 text-[12px] text-gray-700">
                    <span style={{ color: t.color }}>▸</span>
                    <span className="font-mono">{h}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <span className="text-[11px] text-gray-400 font-medium">⚠️ 挑战：</span>
              <span className="text-gray-600 italic">{t.challenge}</span>
            </div>
          </div>
        </div>
      ))}

      {/* 性能基准对比 */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 overflow-x-auto">
        <h3 className="text-base font-semibold text-gray-800 mb-3">⚡ 隐私计算性能基准（2025 年水平）</h3>
        <table className="w-full text-[12.5px]">
          <thead>
            <tr className="text-left text-gray-400 border-b border-gray-100">
              <th className="py-2 pr-3 font-medium">场景</th>
              <th className="py-2 pr-3 font-medium">明文基线</th>
              <th className="py-2 pr-3 font-medium">FL</th>
              <th className="py-2 pr-3 font-medium">MPC</th>
              <th className="py-2 pr-3 font-medium">HE</th>
              <th className="py-2 font-medium">TEE</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['逻辑回归训练（100 万样本）', '~2s',    '~10s（3 轮通信）', '~30s',   '~200s',    '~3s'],
              ['XGBoost 训练（10 万样本）',  '~5s',    '~60s',            '~300s',  '不适用',    '~8s'],
              ['LLM 推理（7B，单条）',       '~0.5s',  '不适用',          '~30s',   '~3600s',   '~0.7s'],
              ['PSI（1 亿 × 1 亿）',         '—',      '—',               '~120s',  '~600s',    '~30s'],
              ['联邦 LoRA（7B，1 轮）',      '~60s',   '~90s（含通信）',   '—',      '—',        '~65s'],
            ].map((r, i) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-gray-50/40' : ''}>
                <td className="py-2 pr-3 text-gray-800 font-medium">{r[0]}</td>
                {r.slice(1).map((c, j) => <td key={j} className="py-2 pr-3 text-gray-600 font-mono">{c}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-[11px] text-gray-400 mt-3 italic">
          数据为量级估算，实际取决于硬件、网络、实现优化。TEE 在大多数场景下性能最接近明文，但安全假设最弱。
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   ⑤  金融场景应用（保留 + 深化）
   ═══════════════════════════════════════════════════════════ */
function SceneSection() {
  const scenes = [
    {
      title: '多机构联合风控',
      tech: '联邦学习 + MPC',
      color: '#3fb950',
      story: [
        '痛点：单家银行看不到客户在其他行的负债，多头借贷风险大',
        '方案：多行 / 银联 / 人行征信中心之间通过联邦学习联合建模',
        '数据不出域，只交换加密中间值或梯度；合规可审计',
        '典型：微众 FATE、银联"银行业联邦建模平台"、央行 BSN 联邦风控',
      ],
    },
    {
      title: '央行数字货币 (CBDC)',
      tech: 'TEE + 零知识证明',
      color: '#6c5ce7',
      story: [
        '数字人民币 (e-CNY) 的"可控匿名"：小额匿名 / 大额可溯',
        '依托 TEE 做交易在链上保密但合规可审计',
        '与商业银行钱包系统通过 SDK 对接，形成双层运营架构',
      ],
    },
    {
      title: '跨境数据合规',
      tech: '隐私计算 + 监管沙盒',
      color: '#e17055',
      story: [
        '《数据出境安全评估办法》下，跨境金融数据基本要做隐私计算处理',
        '沪港通、深港通、跨境理财通等需满足两地监管',
        '常见做法：本地特征上传密文 → 境外联合建模 → 模型下发推理',
      ],
    },
    {
      title: '证券联合建模 / 选股',
      tech: '联邦学习 + MPC',
      color: '#ffa657',
      story: [
        '多家私募 / 卖方研究所联合训练 Alpha 模型，各自因子不暴露',
        '通过秘密分享完成特征对齐 (PSI) + 联合 XGBoost / DNN 训练',
      ],
    },
    {
      title: '🌟 大模型 × 隐私计算交叉',
      tech: 'TEE LLM 推理 / 联邦 LoRA',
      color: '#a29bfe',
      highlight: true,
      story: [
        '密文推理：客户 prompt 在 TEE / HE 下推理，LLM 服务方看不到明文',
        '联邦 LoRA：多家银行各自 LoRA 微调 + 参数聚合，共享能力不共享数据',
        '代表：Apple Private Cloud Compute、NVIDIA H100 CC、Zama Concrete ML',
        '前沿方向：FHE + LLM 近似层（Polynomial Approx），推理延迟从小时级向分钟级演进',
      ],
    },
    {
      title: '保险理赔联合反欺诈',
      tech: 'MPC + 图网络',
      color: '#fd79a8',
      story: [
        '多家保险公司通过 MPC 做保单交叉比对，识别"一事故多赔"团伙',
        '不暴露各自客户明细，只得到"疑似欺诈"标签',
        '典型：中国保信平台、蚂蚁摩斯保险反欺诈方案',
      ],
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {scenes.map(s => (
        <div key={s.title} className="rounded-2xl border p-5 hover:shadow-sm transition-shadow"
          style={{
            borderColor: s.color + (s.highlight ? '55' : '33'),
            background: s.highlight ? s.color + '06' : '#ffffff',
          }}>
          <div className="flex items-baseline justify-between mb-2">
            <h3 className="text-base font-semibold text-gray-800">{s.title}</h3>
            {s.highlight && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white border"
                style={{ borderColor: s.color + '55', color: s.color }}>
                前沿交叉
              </span>
            )}
          </div>
          <div className="inline-block text-[11px] px-2 py-0.5 rounded-full mb-3 font-mono"
            style={{ background: s.color + '15', color: s.color }}>
            {s.tech}
          </div>
          <ul className="space-y-1.5">
            {s.story.map((p, i) => (
              <li key={i} className="flex gap-2 text-[13px] text-gray-600 leading-relaxed">
                <span style={{ color: s.color }}>▸</span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   ⑥  监管与合规（新增）
   ═══════════════════════════════════════════════════════════ */
function RegSection() {
  const regs = [
    {
      title: '🏛️ 巴塞尔协议与 AI 模型监管',
      color: '#6c5ce7',
      items: [
        { k: 'SR 11-7（美联储）',      v: '模型风险管理指引：所有用于决策的模型必须有独立验证、文档、持续监控。LLM 作为"模型"同样适用。' },
        { k: 'SS 1/23（英国 PRA）',     v: '2023 年发布的 AI/ML 模型监管指引：要求银行对 ML 模型做"可解释性评估"和"公平性测试"。' },
        { k: '巴塞尔 III 最终版',       v: '2025 年全面实施。内部评级法（IRB）下的 PD/LGD 模型必须满足"保守性原则"——ML 模型需证明不低估风险。' },
        { k: '中国银保监会',            v: '《商业银行互联网贷款管理暂行办法》要求风控模型可解释、可追溯；2024 年发布 AI 治理指引征求意见稿。' },
      ],
    },
    {
      title: '📊 模型可解释性（Explainability）',
      color: '#00cec9',
      items: [
        { k: '为什么金融必须可解释',    v: '拒贷/拒赔必须给出理由（消费者权益）；监管审计需要追溯决策链路；反歧视法要求证明模型无偏见。' },
        { k: 'SHAP / LIME',            v: '事后解释方法：SHAP 基于 Shapley 值分配特征贡献，LIME 用局部线性模型近似。金融最常用。' },
        { k: 'Attention 可视化',        v: 'Transformer 模型的注意力权重可作为"软解释"，但学术界对其可靠性有争议。' },
        { k: 'Chain-of-Thought for LLM', v: 'LLM 输出推理过程作为解释；但 CoT 可能是"事后合理化"而非真实推理路径——需要 Faithful CoT 研究。' },
        { k: '对比解释（Counterfactual）', v: '"如果收入提高 20%，贷款就会通过"——最直观的解释方式，监管最认可。' },
      ],
    },
    {
      title: '🔐 数据出境与跨境合规',
      color: '#e17055',
      items: [
        { k: '《数据出境安全评估办法》', v: '处理 100 万人以上个人信息的金融机构，数据出境需通过国家网信办安全评估。' },
        { k: '《个人信息保护法》',       v: '金融数据属于"敏感个人信息"，需单独同意 + 影响评估 + 最小必要原则。' },
        { k: 'GDPR（欧盟）',            v: '跨境金融服务必须满足 GDPR；违规罚款可达全球年营收 4%。' },
        { k: '标准合同条款（SCC）',      v: '2023 年起，中国版 SCC 成为中小金融机构数据出境的主要合规路径。' },
      ],
    },
    {
      title: '🤖 AI 治理框架',
      color: '#ffa657',
      items: [
        { k: 'EU AI Act（2024）',       v: '全球首部 AI 立法。金融信用评分被列为"高风险 AI"，需满足透明度、人工监督、数据质量等要求。' },
        { k: '中国《生成式 AI 管理办法》', v: '金融机构使用生成式 AI 需备案；输出内容需标识；不得生成虚假金融信息。' },
        { k: '算法公平性',               v: '美国 ECOA / 中国《反歧视法》要求信贷模型不得对种族/性别/年龄产生歧视性影响（Disparate Impact）。' },
        { k: '模型审计（Model Audit）',   v: '第三方审计机构对模型进行公平性、稳定性、安全性评估——正在成为金融 AI 的"年审"标配。' },
      ],
    },
  ];

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-purple-50/40 to-amber-50/40 rounded-2xl border border-purple-100/50 p-5">
        <h3 className="text-base font-semibold text-gray-800 mb-2">📜 金融 AI 的 4 条监管红线</h3>
        <p className="text-[12px] text-gray-500 leading-relaxed">
          金融是<span className="text-gray-700 font-medium">全球监管最严格的 AI 应用领域</span>——
          模型不仅要"好用"，还要"可解释、可审计、不歧视、数据合规"。
          理解监管约束，才能理解为什么金融 LLM 落地比互联网慢一个身位。
        </p>
      </div>

      {regs.map(r => (
        <div key={r.title} className="bg-white rounded-2xl border p-5" style={{ borderColor: r.color + '33' }}>
          <h4 className="text-sm font-semibold mb-3" style={{ color: r.color }}>{r.title}</h4>
          <div className="space-y-2">
            {r.items.map(x => (
              <div key={x.k} className="flex gap-3 p-2.5 rounded-lg bg-gray-50 border border-gray-100">
                <div className="w-44 flex-shrink-0 text-[12px] font-semibold text-gray-800">{x.k}</div>
                <div className="flex-1 text-[12px] text-gray-600 leading-relaxed">{x.v}</div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* 合规成本估算 */}
      <div className="bg-white rounded-2xl border border-amber-100 p-5">
        <h3 className="text-base font-semibold text-amber-700 mb-3">💰 合规成本：金融 AI 的"隐性税"</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { k: '模型验证 & 审计', v: '每个模型 ¥50-200 万/年（内部验证团队 + 外部审计）', color: '#6c5ce7' },
            { k: '数据治理 & 脱敏', v: '数据平台改造 ¥500-2000 万（一次性）+ 年运维 ¥100-300 万', color: '#e17055' },
            { k: '合规人员',        v: '大型银行 AI 合规团队 20-50 人，年人力成本 ¥1000-3000 万', color: '#ffa657' },
          ].map(x => (
            <div key={x.k} className="p-3 rounded-xl border text-[12px]" style={{ borderColor: x.color + '33' }}>
              <div className="font-semibold text-gray-800 mb-1">{x.k}</div>
              <div className="text-gray-600 leading-relaxed">{x.v}</div>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-gray-400 mt-3 italic">
          合规成本通常占金融 AI 项目总成本的 20-40%，这是互联网行业不需要承担的"隐性税"。
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   ⑦  标杆案例（保留 + 增补"国内银行横评"）
   ═══════════════════════════════════════════════════════════ */
function CaseSection() {
  const cases = [
    {
      name: '蚂蚁 SecretFlow / 摩斯',
      region: '🇨🇳 中国',
      focus: 'MPC + TEE + FL 一体化隐私计算平台',
      fact: '开源 SecretFlow + 商业化摩斯，覆盖银行联合风控、跨境、保险反欺诈；与工行、建行、中金、人保等均有合作',
      color: '#00b894',
    },
    {
      name: '微众 FATE',
      region: '🇨🇳 中国',
      focus: '最早的联邦学习工业级开源框架（2019）',
      fact: '金融联邦学习事实标准，国内大部分银行的联邦风控底座；已捐赠给 Linux 基金会',
      color: '#6c5ce7',
    },
    {
      name: 'JPMorgan / Goldman',
      region: '🇺🇸 美国',
      focus: 'LLM 投研 + 合规内部 Copilot',
      fact: 'JPM 的 LLM Suite 覆盖 5 万员工，做研究助手与合规文档；Goldman 内部 GS AI Platform 接入代码与研报场景',
      color: '#e17055',
    },
    {
      name: 'Morgan Stanley × OpenAI',
      region: '🇺🇸 美国',
      focus: 'GPT-4 财富管理知识库',
      fact: '2023 全球首批大规模私有化 GPT-4 部署，向 16000 位财富顾问提供基于内部 10 万+ 研报的即时问答',
      color: '#fd79a8',
    },
    {
      name: 'Apple Private Cloud Compute',
      region: '🇺🇸 美国',
      focus: 'TEE + 端云协同大模型推理',
      fact: '2024 WWDC 发布，定义了"云端大模型也可做到端上级别隐私"的新标准，直接影响金融行业大模型部署路径',
      color: '#a29bfe',
    },
    {
      name: 'Bloomberg GPT',
      region: '🇺🇸 美国',
      focus: '金融领域专用大模型（50B）',
      fact: '2023 年发布，基于 Bloomberg 40 年金融数据训练。在金融 NLP 任务上显著优于通用模型，但未开源',
      color: '#3fb950',
    },
  ];

  // 国内银行横评
  const banks = [
    { name: '工商银行',   model: '工银智涌',   scene: '客服 / 研发 / 反洗钱',       status: '内测 + 部分上线', moat: '最大资产规模 + 最全数据' },
    { name: '建设银行',   model: '方舟',       scene: '客服 / 信贷 / 合规',         status: '多场景上线',       moat: '住房金融数据优势' },
    { name: '交通银行',   model: '天擎',       scene: '投研 / 客服 / 代码',         status: '内测',             moat: '与华为昇腾深度合作' },
    { name: '招商银行',   model: 'AICC 平台',  scene: '智能客服 / 财富管理',         status: '大规模上线',       moat: '零售之王 + 用户体验基因' },
    { name: '平安银行',   model: '平安 GPT',   scene: '保险核赔 / 医疗 / 金融',     status: '集团级部署',       moat: '平安集团多业态数据' },
    { name: '中国银行',   model: '中银 AI',    scene: '跨境 / 外汇 / 合规',         status: '试点',             moat: '国际化业务数据' },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cases.map(c => (
          <div key={c.name} className="bg-white rounded-2xl border p-5 hover:shadow-sm transition-shadow"
            style={{ borderColor: c.color + '33' }}>
            <div className="flex items-baseline justify-between mb-2">
              <h3 className="text-base font-semibold text-gray-800">{c.name}</h3>
              <span className="text-[10px] text-gray-400">{c.region}</span>
            </div>
            <div className="inline-block text-[11px] px-2 py-0.5 rounded-full mb-3"
              style={{ background: c.color + '12', color: c.color }}>
              {c.focus}
            </div>
            <p className="text-[13px] text-gray-600 leading-relaxed">{c.fact}</p>
          </div>
        ))}
      </div>

      {/* 国内银行横评 */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 overflow-x-auto">
        <h3 className="text-base font-semibold text-gray-800 mb-3">🇨🇳 国内主要银行大模型横评</h3>
        <table className="w-full text-[12.5px]">
          <thead>
            <tr className="text-left text-gray-400 border-b border-gray-100">
              <th className="py-2 pr-3 font-medium">银行</th>
              <th className="py-2 pr-3 font-medium">模型/平台</th>
              <th className="py-2 pr-3 font-medium">主打场景</th>
              <th className="py-2 pr-3 font-medium">状态</th>
              <th className="py-2 font-medium">差异化优势</th>
            </tr>
          </thead>
          <tbody>
            {banks.map((b, i) => (
              <tr key={b.name} className={i % 2 === 0 ? 'bg-gray-50/40' : ''}>
                <td className="py-2 pr-3 text-gray-800 font-semibold">{b.name}</td>
                <td className="py-2 pr-3 text-gray-700 font-mono">{b.model}</td>
                <td className="py-2 pr-3 text-gray-600">{b.scene}</td>
                <td className="py-2 pr-3 text-gray-600">{b.status}</td>
                <td className="py-2 text-gray-500 italic">{b.moat}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-[11px] text-gray-400 mt-3 italic">
          国有大行以"自研 + 国产化"为主（昇腾/鲲鹏），股份行更灵活（招行/平安接入商业 API + 自研并行）。
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   ⑧  金融科技演进（新增）
   ═══════════════════════════════════════════════════════════ */
function FintechSection() {
  const eras = [
    { year: '1960-1990', title: '电子化时代', stack: 'ATM · 核心银行系统 · SWIFT',
      milestone: '从手工记账到电子化，银行 IT 以 IBM 大型机为核心', color: '#6c5ce7' },
    { year: '1990-2010', title: '互联网金融 1.0', stack: '网上银行 · 第三方支付 · P2P',
      milestone: '支付宝（2004）、余额宝（2013）颠覆传统银行渠道', color: '#00cec9' },
    { year: '2010-2018', title: '移动金融 & 大数据', stack: '移动支付 · 大数据风控 · 互联网保险',
      milestone: '微信支付（2013）、芝麻信用（2015）、蚂蚁花呗/借呗', color: '#3fb950' },
    { year: '2018-2023', title: 'AI 金融 & 监管科技', stack: 'ML 风控 · 智能投顾 · RegTech · 隐私计算',
      milestone: '联邦学习落地银行风控；监管科技（RegTech）兴起；数字人民币试点', color: '#e17055' },
    { year: '2023-2026', title: 'AI 原生金融', stack: 'LLM 客服 · Agent 投研 · AIGC 营销 · 密文推理',
      milestone: '大模型进入金融核心场景；隐私计算成为基础设施；Agent 替代部分人工决策', color: '#ffa657' },
  ];

  const trends = [
    {
      title: '🏗️ 开放银行（Open Banking）',
      color: '#6c5ce7',
      points: [
        '通过 API 开放银行数据和服务给第三方（经用户授权）',
        '欧盟 PSD2（2018）强制要求；中国以"银行即服务"（BaaS）模式推进',
        '代表：蚂蚁网商银行 API · 微众银行 API · Plaid（美国）· TrueLayer（欧洲）',
        '与隐私计算的交叉：开放数据的同时保护用户隐私，需要 API 级别的差分隐私或 TEE',
      ],
    },
    {
      title: '💳 嵌入式金融（Embedded Finance）',
      color: '#00cec9',
      points: [
        '金融服务嵌入非金融场景（电商分期、打车保险、SaaS 贷款）',
        '用户无感知地使用金融产品——"金融消失在场景中"',
        '技术栈：BaaS API + 实时风控 + 合规引擎',
        '市场规模：2025 年全球嵌入式金融预计 $7 万亿（Bain 估算）',
      ],
    },
    {
      title: '🪙 数字资产 & DeFi 合规化',
      color: '#e17055',
      points: [
        '比特币 ETF 获批（2024）标志传统金融接纳数字资产',
        'RWA（Real World Assets）代币化：房产、债券、艺术品上链',
        '合规 DeFi：KYC + AML + 隐私计算的结合（ZKP 身份验证）',
        '央行数字货币（CBDC）全球 130+ 国家在研究或试点',
      ],
    },
    {
      title: '🤖 Agent 金融（2025-2028 预测）',
      color: '#a29bfe',
      points: [
        'AI Agent 替代人工完成：投研分析 → 交易执行 → 风控审查 → 合规报告 全链路',
        '从"辅助工具"到"自主决策者"——但监管要求"人在回路"（Human-in-the-Loop）',
        '关键挑战：Agent 的决策可追溯性、责任归属、错误赔偿机制',
        '预测：2028 年 30% 的投研报告由 Agent 独立完成（人工审核签发）',
      ],
    },
  ];

  return (
    <div className="space-y-4">
      {/* 时间线 */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="text-base font-semibold text-gray-800 mb-4">📅 金融科技 60 年演进</h3>
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
                  <div><span className="text-gray-400">技术栈：</span>{e.stack}</div>
                  <div className="mt-1 text-gray-500 italic">💡 {e.milestone}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 四大趋势 */}
      {trends.map(t => (
        <div key={t.title} className="bg-white rounded-2xl border p-5"
          style={{ borderColor: t.color + '33' }}>
          <h3 className="text-base font-semibold mb-3" style={{ color: t.color }}>{t.title}</h3>
          <ul className="space-y-2">
            {t.points.map((p, i) => (
              <li key={i} className="flex gap-2 text-[13px] text-gray-600 leading-relaxed">
                <span style={{ color: t.color }}>▸</span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}

      {/* 中美金融科技对比 */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 overflow-x-auto">
        <h3 className="text-base font-semibold text-gray-800 mb-3">🌏 中美金融科技对比</h3>
        <table className="w-full text-[12.5px]">
          <thead>
            <tr className="text-left text-gray-400 border-b border-gray-100">
              <th className="py-2 pr-3 font-medium">维度</th>
              <th className="py-2 pr-3 font-medium">🇨🇳 中国</th>
              <th className="py-2 font-medium">🇺🇸 美国</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['移动支付',     '支付宝/微信支付覆盖 90%+ 人口',     'Apple Pay / Venmo 渗透率 ~40%'],
              ['数字银行',     '网商/微众/百信（互联网银行牌照）',   'Chime / SoFi / Revolut（Neobank）'],
              ['AI 风控',      '联邦学习 + 图网络（蚂蚁/微众领先）', 'ML 风控成熟（FICO / Zest AI）'],
              ['大模型落地',   '国有行自研 + 国产化（昇腾/鲲鹏）',   'GPT-4 私有化部署（Morgan Stanley）'],
              ['隐私计算',     '全球最大规模落地（FATE/SecretFlow）', '学术领先但工业落地较慢'],
              ['监管态度',     '强监管 + 沙盒试点（数字人民币）',     '分散监管 + 近期收紧（SEC/OCC）'],
              ['数字货币',     '数字人民币试点 26 城',               '比特币 ETF 获批 + 稳定币立法中'],
            ].map((r, i) => (
              <tr key={r[0]} className={i % 2 === 0 ? 'bg-gray-50/40' : ''}>
                <td className="py-2 pr-3 text-gray-800 font-medium">{r[0]}</td>
                <td className="py-2 pr-3 text-gray-600">{r[1]}</td>
                <td className="py-2 text-gray-600">{r[2]}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-[11px] text-gray-400 mt-3 italic">
          中国在移动支付和隐私计算落地上领先，美国在大模型应用和数字资产合规化上领先。两者正在趋同。
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   ⑨  平安银行金融 AI 战略部五年业务规划（新增）
   ═══════════════════════════════════════════════════════════ */
function PlanSection() {
  const [expandedRevenue, setExpandedRevenue] = useState(null); // 展开的营收明细年份
  const [expandedMilestone, setExpandedMilestone] = useState(null); // 展开的半年产出节点

  /* —— 部门概览 —— */
  const deptOverview = {
    name: '平安银行 · 金融科技部 · AI 战略中心',
    mission: '以大模型 + Agent 为核心驱动力，五年内实现风控、客服、理财、合规四大业务线的 AI 原生化转型，将人效比提升 3 倍，AI 贡献营收占比从 5% 提升至 35%',
    vision: '2030 年成为国内银行业 AI 能力标杆，输出金融 AI 解决方案至平安集团生态',
  };

  /* ================================================================
   *  ★ 核心逻辑：业务目标 → 半年产出 → 工作量 → 人力 → 预算
   *  从业务价值出发，每半年一个可交付产出，反推所需工作量和资源
   * ================================================================ */

  /* —— 四大业务线 & 半年产出节点（Milestone） —— */
  const bizMilestones = [
    {
      line: '🛡️ 智能风控', color: '#e17055', bizValue: '降低欺诈损失率从 0.15% → 0.03%，五年累计避免损失 ¥21 亿',
      milestones: [
        { id: 'H1-Y1', half: 'Y1 上半年', deliverable: '图网络反欺诈模型 PoC 完成', bizOutcome: '信用卡欺诈识别率提升 10%', revenue: '节省 ¥200 万/半年' },
        { id: 'H2-Y1', half: 'Y1 下半年', deliverable: '反欺诈模型上线（信用卡+消费贷）', bizOutcome: '欺诈损失率从 0.15% 降至 0.12%', revenue: '节省 ¥400 万/半年' },
        { id: 'H1-Y2', half: 'Y2 上半年', deliverable: 'LLM+图网络融合模型上线', bizOutcome: '覆盖全行信贷产品线', revenue: '节省 ¥600 万/半年' },
        { id: 'H2-Y2', half: 'Y2 下半年', deliverable: 'SAR 报告自动生成 + 联邦风控联盟', bizOutcome: '合规效率提升 60%，3 家银行联盟', revenue: '节省 ¥600 万 + 服务费 ¥200 万' },
        { id: 'H1-Y3', half: 'Y3 上半年', deliverable: '风控 Agent 1.0（自主处置+人工复核）', bizOutcome: '自主处置率 70%，复核率 30%', revenue: '节省 ¥1500 万/半年' },
        { id: 'H2-Y3', half: 'Y3 下半年', deliverable: '风控 Agent 2.0（复核率<10%）', bizOutcome: '端到端自动化，损失率降至 0.06%', revenue: '节省 ¥2000 万/半年' },
        { id: 'H1-Y4', half: 'Y4 上半年', deliverable: '风控模型市场化输出 v1', bizOutcome: '向 5 家中小银行输出', revenue: '服务费 ¥1500 万/半年' },
        { id: 'H2-Y4', half: 'Y4 下半年', deliverable: '联邦风控联盟扩至 8 家', bizOutcome: '行业标准参与制定', revenue: '服务费 ¥2000 万/半年' },
        { id: 'H1-Y5', half: 'Y5 上半年', deliverable: '全链路 AI 风控（准入→监控→催收）', bizOutcome: '损失率降至 0.03%', revenue: '节省 ¥5000 万/半年' },
        { id: 'H2-Y5', half: 'Y5 下半年', deliverable: '风控 SaaS 平台 + 行业标杆', bizOutcome: '15 家联盟，行业标准主导', revenue: '服务费 ¥3000 万/半年' },
      ],
    },
    {
      line: '💬 智能客服', color: '#00cec9', bizValue: '人工坐席替代率从 5% → 80%，五年累计节省人力成本 ¥2.8 亿',
      milestones: [
        { id: 'H1-Y1', half: 'Y1 上半年', deliverable: 'RAG 知识库搭建 + Top100 问题覆盖', bizOutcome: '自动回答准确率 >85%', revenue: '节省 ¥150 万/半年' },
        { id: 'H2-Y1', half: 'Y1 下半年', deliverable: 'RAG 客服上线（Top200 问题），替代 20% 坐席', bizOutcome: '120 人坐席释放', revenue: '节省 ¥300 万/半年' },
        { id: 'H1-Y2', half: 'Y2 上半年', deliverable: '多模态客服 PoC（语音+文字）', bizOutcome: '语音渠道 AI 覆盖率 30%', revenue: '节省 ¥800 万/半年' },
        { id: 'H2-Y2', half: 'Y2 下半年', deliverable: '多模态客服全量上线，替代 45% 坐席', bizOutcome: '270 人坐席释放', revenue: '节省 ¥1350 万/半年' },
        { id: 'H1-Y3', half: 'Y3 上半年', deliverable: '业务办理 Agent（转账/查询/挂失）', bizOutcome: '端到端业务办理，无需转人工', revenue: '节省 ¥2000 万/半年' },
        { id: 'H2-Y3', half: 'Y3 下半年', deliverable: '客服 Agent 全量（替代 65% 坐席）', bizOutcome: '满意度 >4.5/5.0', revenue: '节省 ¥2600 万/半年' },
        { id: 'H1-Y4', half: 'Y4 上半年', deliverable: '情感识别 + 主动服务', bizOutcome: '客户流失预警准确率 >80%', revenue: '节省 ¥3500 万/半年' },
        { id: 'H2-Y4', half: 'Y4 下半年', deliverable: '全渠道 AI 客服（APP/微信/电话/网银）', bizOutcome: '替代 70% 坐席', revenue: '节省 ¥4000 万/半年' },
        { id: 'H1-Y5', half: 'Y5 上半年', deliverable: '80% 交互 AI 完成 + 7×24 全时段', bizOutcome: '人工仅处理复杂投诉', revenue: '节省 ¥6000 万/半年' },
        { id: 'H2-Y5', half: 'Y5 下半年', deliverable: '客服 AI 平台输出（SaaS）', bizOutcome: '向集团子公司输出', revenue: '节省 ¥6000 万 + 输出 ¥1000 万' },
      ],
    },
    {
      line: '💰 智能理财', color: '#6c5ce7', bizValue: 'AI 辅助 AUM 从 ¥0 → ¥500 亿，五年累计佣金增量 ¥1.4 亿',
      milestones: [
        { id: 'H1-Y1', half: 'Y1 上半年', deliverable: '投研助手 PoC（研报摘要+基金对比）', bizOutcome: '内部投研团队试用', revenue: '¥0（内部试用）' },
        { id: 'H2-Y1', half: 'Y1 下半年', deliverable: '投研助手 v1 内部上线', bizOutcome: '投研效率提升 30%', revenue: '¥0（内部试用）' },
        { id: 'H1-Y2', half: 'Y2 上半年', deliverable: 'AI 理财顾问 PoC（个性化配置建议）', bizOutcome: '1000 名高净值客户试用', revenue: '佣金增量 ¥200 万' },
        { id: 'H2-Y2', half: 'Y2 下半年', deliverable: 'AI 理财顾问 1.0 全量上线', bizOutcome: 'AUM 转化率提升 8%', revenue: '佣金增量 ¥600 万' },
        { id: 'H1-Y3', half: 'Y3 上半年', deliverable: '千人千面组合推荐', bizOutcome: 'AI 管理 AUM ¥80 亿', revenue: '佣金 ¥1000 万/半年' },
        { id: 'H2-Y3', half: 'Y3 下半年', deliverable: '自动调仓 Agent + 合规话术', bizOutcome: 'AI 管理 AUM ¥150 亿', revenue: '佣金 ¥1500 万/半年' },
        { id: 'H1-Y4', half: 'Y4 上半年', deliverable: 'AI 管理 AUM ¥250 亿', bizOutcome: '客户留存率提升 15%', revenue: '佣金 ¥2000 万/半年' },
        { id: 'H2-Y4', half: 'Y4 下半年', deliverable: 'AI 管理 AUM ¥400 亿', bizOutcome: '理财 AI 品牌建立', revenue: '佣金 ¥2500 万/半年' },
        { id: 'H1-Y5', half: 'Y5 上半年', deliverable: 'AI 管理 AUM ¥500 亿', bizOutcome: '行业领先', revenue: '佣金 ¥3000 万/半年' },
        { id: 'H2-Y5', half: 'Y5 下半年', deliverable: '理财 AI 平台输出', bizOutcome: '向集团子公司输出', revenue: '佣金 ¥3250 万 + 输出 ¥500 万' },
      ],
    },
    {
      line: '📜 智能合规', color: '#ffa657', bizValue: '合规审查效率从人工 2 天/份 → AI 10 分钟/份，五年累计节省 ¥1.2 亿',
      milestones: [
        { id: 'H1-Y1', half: 'Y1 上半年', deliverable: '合规知识库搭建 + 政策检索系统', bizOutcome: '政策查询效率提升 5 倍', revenue: '节省 ¥50 万/半年' },
        { id: 'H2-Y1', half: 'Y1 下半年', deliverable: '合规知识库上线 + 基础审查辅助', bizOutcome: '合规团队效率提升 30%', revenue: '节省 ¥100 万/半年' },
        { id: 'H1-Y2', half: 'Y2 上半年', deliverable: '合同审查 Agent PoC', bizOutcome: '合同审查时间从 2 天→4 小时', revenue: '节省 ¥200 万/半年' },
        { id: 'H2-Y2', half: 'Y2 下半年', deliverable: '合规审查 Agent 上线（合同+营销物料）', bizOutcome: '审查效率提升 60%', revenue: '节省 ¥400 万/半年' },
        { id: 'H1-Y3', half: 'Y3 上半年', deliverable: '监管报告自动生成', bizOutcome: 'SAR/CTR 报告 90% 自动化', revenue: '节省 ¥600 万/半年' },
        { id: 'H2-Y3', half: 'Y3 下半年', deliverable: '全链路合规 Agent', bizOutcome: '审查时间降至 30 分钟/份', revenue: '节省 ¥800 万/半年' },
        { id: 'H1-Y4', half: 'Y4 上半年', deliverable: '参与行业标准制定', bizOutcome: '银保监会 AI 治理标准参与', revenue: '品牌价值（不直接计量）' },
        { id: 'H2-Y4', half: 'Y4 下半年', deliverable: '合规 AI 输出（咨询服务）', bizOutcome: '向 3 家机构输出', revenue: '咨询费 ¥300 万/半年' },
        { id: 'H1-Y5', half: 'Y5 上半年', deliverable: 'AI 治理示范银行认证', bizOutcome: '行业标杆', revenue: '品牌溢价 + 咨询 ¥500 万' },
        { id: 'H2-Y5', half: 'Y5 下半年', deliverable: '合规 SaaS 平台', bizOutcome: '审查时间 10 分钟/份', revenue: '平台收入 ¥800 万/半年' },
      ],
    },
  ];

  /* ================================================================
   *  ★ 甘特图数据：业务成果时间线 + 招聘节奏
   *  时间轴：前两年按月（2026.7 ~ 2028.6，24个月），后三年按半年（28H2 ~ 30H2，5个半年）
   *  总共 29 个时间槽
   *  启动时间：2026年7月（报告5月编制→6月审批→7月正式启动）
   *  主线1：业务成果 Milestone（按业务线）
   *  主线2：招聘计划（按部门/岗位族群）
   *  主线3：招聘投入成本（猎头费/招聘平台/面试成本/入职培训）
   * ================================================================ */
  // 前两年按月（24个月：2026.7~2028.6），后三年按半年（5个半年：28H2~30H2）
  const MONTHLY_COUNT = 24; // 前两年月度槽位数
  const HALF_COUNT = 5;     // 后三年半年槽位数
  const TOTAL_SLOTS = MONTHLY_COUNT + HALF_COUNT; // 29

  const ganttTimeLabels = [
    // 前两年按月
    '7月','8月','9月','10月','11月','12月', // 2026.7-12（M1-M6）
    '1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月', // 2027全年（M7-M18）
    '1月','2月','3月','4月','5月','6月', // 2028.1-6（M19-M24）
    // 后三年按半年
    '28H2','29H1','29H2','30H1','30H2',
  ];
  const ganttYearHeaders = [
    { label: 'Y1（2026.7—2027.6）', span: 12, color: '#6c5ce7' },
    { label: 'Y2（2027.7—2028.6）', span: 12, color: '#00cec9' },
    { label: 'Y3（28H2+29H1）',     span: 2,  color: '#3fb950' },
    { label: 'Y4（29H2+30H1）',     span: 2,  color: '#ffa657' },
    { label: 'Y5（30H2~）',          span: 1,  color: '#e17055' },
  ];
  // 兼容旧引用
  const ganttHalves = ganttTimeLabels;
  const ganttMonths = ganttTimeLabels;

  // 业务成果甘特图（前两年按月细化，后三年按半年）
  // 时间槽索引：0-5=2026.7-12, 6-17=2027.1-12, 18-23=2028.1-6, 24=28H2, 25=29H1, 26=29H2, 27=30H1, 28=30H2
  const ganttBizTracks = [
    {
      line: '🛡️ 风控', color: '#e17055',
      bars: [
        // 7月无人→8月骨干到位开始规划→9月起正式启动
        { start: 1, end: 2, label: '需求梳理+数据资产盘点', milestone: '8-9月：骨干到位，梳理数据现状' },
        { start: 3, end: 4, label: '数据治理+反欺诈特征工程', milestone: '10-11月：历史数据清洗完成' },
        { start: 5, end: 7, label: '图网络模型选型+训练+验证', milestone: '12-2月：GAT模型训练完成' },
        { start: 8, end: 10, label: '反欺诈PoC上线（信用卡）', milestone: '27Q1：识别率+10%' },
        // 2027 Q2-Q4：扩展+LLM融合
        { start: 11, end: 13, label: '消费贷+对公贷款覆盖', milestone: '27Q2-Q3：全产品线覆盖' },
        { start: 14, end: 17, label: 'LLM+图网络融合+SAR自动生成', milestone: '27Q4：SAR自动生成' },
        // 2028.1-6：Agent化
        { start: 18, end: 23, label: '实时风控引擎+风控Agent 1.0', milestone: '28H1：自主处置率>60%' },
        // Y3-Y5
        { start: 24, end: 24, label: '风控Agent 2.0', milestone: '处置率>90%' },
        { start: 25, end: 26, label: '风控SaaS+联邦联盟8家', milestone: '服务费¥2000万/半年' },
        { start: 27, end: 28, label: '全链路AI风控+全球化', milestone: '损失率0.03%' },
      ],
    },
    {
      line: '💬 客服', color: '#00cec9',
      bars: [
        // 8月产品总监到位开始规划→9月起正式启动
        { start: 1, end: 2, label: '需求调研+知识库规划', milestone: '8-9月：Top200问题梳理' },
        { start: 3, end: 5, label: '知识库构建+RAG系统搭建', milestone: '10-12月：RAG系统内测' },
        { start: 6, end: 8, label: 'RAG客服迭代+准确率优化', milestone: '27Q1：准确率>85%' },
        // 2027 Q2-Q4
        { start: 9, end: 11, label: '智能客服上线（替代10%）+语音接入', milestone: '27Q2：替代10%' },
        { start: 12, end: 14, label: '多模态客服（图片+视频）', milestone: '27Q3：替代率25%' },
        { start: 15, end: 17, label: '替代率35%+满意度优化', milestone: '27Q4：满意度>4.3' },
        // 2028.1-6
        { start: 18, end: 23, label: '业务办理Agent（开卡/转账/理赔）', milestone: '28H1：替代率50%' },
        // Y3-Y5
        { start: 24, end: 24, label: 'Agent替代60%', milestone: '满意度>4.5' },
        { start: 25, end: 26, label: '情感识别+全渠道70%', milestone: '节省¥4000万/半年' },
        { start: 27, end: 28, label: '80%AI完成+SaaS输出', milestone: '节省¥6000万/半年' },
      ],
    },
    {
      line: '💰 理财', color: '#6c5ce7',
      bars: [
        // 理财方向人到位更晚（需要算法+产品+数据），10月起才能启动
        { start: 3, end: 5, label: '投研助手需求定义+数据对接', milestone: '10-12月：研报数据打通' },
        { start: 6, end: 9, label: '投研助手PoC（研报摘要+基金对比）', milestone: '27Q1-Q2：内部试用' },
        { start: 10, end: 13, label: '投研助手迭代+AI理财顾问PoC', milestone: '27Q2-Q3：效率+30%' },
        { start: 14, end: 17, label: 'AI理财顾问1.0上线+用户画像', milestone: '27Q3-Q4：AUM转化率+5%' },
        // 2028.1-6
        { start: 18, end: 23, label: '千人千面推荐+自动调仓Agent', milestone: '28H1：AUM转化率+8%' },
        // Y3-Y5
        { start: 24, end: 24, label: 'AUM¥80亿', milestone: '千人千面成熟' },
        { start: 25, end: 26, label: 'AUM¥250→400亿', milestone: '佣金¥2500万/半年' },
        { start: 27, end: 28, label: 'AUM¥500亿+平台输出', milestone: '佣金¥3250万/半年' },
      ],
    },
    {
      line: '📜 合规', color: '#ffa657',
      bars: [
        // 合规专家8月到位→9月起启动知识库
        { start: 1, end: 3, label: '合规需求梳理+知识库规划', milestone: '8-10月：法规制度盘点' },
        { start: 4, end: 7, label: '合规知识库构建（法规/制度入库）', milestone: '11-2月：10万+条目' },
        { start: 8, end: 11, label: '基础合规审查辅助上线', milestone: '27Q1-Q2：效率+30%' },
        // 2027 Q3-Q4
        { start: 12, end: 14, label: '合同审查Agent开发+测试', milestone: '27Q3：准确率>90%' },
        { start: 15, end: 17, label: '合规审查全流程上线', milestone: '27Q4：效率+60%' },
        // 2028.1-6
        { start: 18, end: 23, label: '监管报告自动生成→全链路Agent', milestone: '28H1：30分钟/份' },
        // Y3-Y5
        { start: 24, end: 24, label: '全链路合规Agent', milestone: '15分钟/份' },
        { start: 25, end: 26, label: '行业标准制定+咨询输出', milestone: '银保监会参与' },
        { start: 27, end: 28, label: 'AI治理示范银行+合规SaaS', milestone: '10分钟/份' },
      ],
    },
    {
      line: '🏗️ AI平台', color: '#3fb950',
      bars: [
        // AI平台：7月可启动采购（不需要人），8月架构师到位后开始部署
        { start: 0, end: 1, label: 'GPU集群采购流程（无需人到位）', milestone: '7-8月：采购审批+下单' },
        { start: 2, end: 3, label: 'GPU到货+架构师部署', milestone: '9-10月：H100×8卡部署完成' },
        { start: 3, end: 5, label: '大模型私有化部署（70B基座）', milestone: '10-12月：推理可用' },
        { start: 6, end: 8, label: 'AI中台MVP+RAG知识库+评测体系', milestone: '27Q1：SLA 99.5%' },
        // 2027 Q2-Q4
        { start: 9, end: 11, label: '7B蒸馏版+推理优化（vLLM）', milestone: '27Q2：QPS 200' },
        { start: 12, end: 14, label: 'Agent框架搭建+工具链', milestone: '27Q3：Agent SDK发布' },
        { start: 15, end: 17, label: '联邦学习平台+平台成熟化', milestone: '27Q4：QPS 500, SLA 99.9%' },
        // 2028.1-6
        { start: 18, end: 23, label: 'Agent平台成熟+内部Copilot', milestone: '28H1：GPU利用率>70%' },
        // Y3-Y5
        { start: 24, end: 24, label: 'Agent编排+可观测', milestone: '全链路监控' },
        { start: 25, end: 26, label: 'SaaS平台+集团输出', milestone: '推理成本-50%' },
        { start: 27, end: 28, label: 'AI原生银行+全球化SaaS', milestone: '行业标杆' },
      ],
    },
  ];

  // 招聘甘特图（前两年按月，后三年按半年）
  // 数值表示该时间槽新增招聘人数（净增），负数表示缩编/转岗
  // 索引：0-5=2026.7-12, 6-17=2027.1-12, 18-23=2028.1-6, 24=28H2, 25=29H1, 26=29H2, 27=30H1, 28=30H2
  // 招聘甘特图（前两年按月，后三年按半年）
  // ⚠️ 现实节奏：7月启动猎头Pipeline+发JD → 8月首批核心骨干到位 → 9月起猎头出结果 → Q4批量到位
  // 银行体系招聘流程：猎头推荐→简历筛选→3轮面试→背调→审批→入职，最快6-8周
  // 所以7月启动，最快8月底才有第一批人到位
  const ganttHiringTracks = [
    {
      dept: '🧠 ML/算法研究', color: '#6c5ce7',
      // 7月0人→8月首席到位→9月起逐步补齐→年末(12月)~8人→Y2末~16人
      hires: [0,1,1,1,2,1, 1,1,1,0,1,0,1,1,0,1,0,0, 1,1,1,1,1,0, 5,3,2,2,1],
      cumulative: [0,1,2,3,5,6, 7,8,9,9,10,10,11,12,12,13,13,13, 14,15,16,17,18,18, 23,26,28,30,31],
      notes: [
        '猎头Pipeline启动，0到位','首席算法专家P8+×1（提前锁定）','P8高级算法×1','P7算法×1','P7×1+P6×1','P6初级×1',
        'P7多模态×1','P7NLP×1','P6×1','—','P7强化学习×1','—','P7Agent×1','P6×1','—','P7联邦×1','—','—',
        'P7×1','P7×1','P6×1','P7×1','P6×1','—',
        '世界模型方向+5','商业化算法+3','行业垂直+2','前沿探索+2','稳态+1'
      ],
    },
    {
      dept: '⚙️ 工程开发', color: '#00cec9',
      // 7月0人→8月架构师到位→9月起批量→年末~15人→Y2末~35人
      hires: [0,2,2,3,4,3, 2,2,2,1,2,1,2,2,1,2,1,0, 2,1,1,1,1,0, 6,5,5,4,4],
      cumulative: [0,2,4,7,11,14, 16,18,20,21,23,24,26,28,29,31,32,32, 34,35,36,37,38,38, 44,49,54,58,62],
      notes: [
        '猎头Pipeline启动，0到位','AI平台架构师P8×1+数据工程×1','后端×1+数据工程×1','前端×1+后端×1+数据×1','后端×2+平台×1+运维×1','后端×1+前端×1+数据×1',
        'Agent框架×2','数据工程×2','后端×2','前端×1','推理优化×2','—','Agent编排×2','可观测×2','前端×1','联邦工程×2','—','—',
        '平台×2','后端×1','前端×1','SRE×1','数据×1','—',
        'Agent平台+6','SaaS团队+5','多租户+5','全球化+4','边缘+4'
      ],
    },
    {
      dept: '📋 产品/业务分析', color: '#3fb950',
      // 7月0人→8月产品总监到位→9月起补齐→年末~5人
      hires: [0,1,1,1,1,1, 1,0,1,0,1,0,1,0,1,0,0,0, 1,0,1,0,0,0, 2,1,1,0,0],
      cumulative: [0,1,2,3,4,5, 6,6,7,7,8,8,9,9,10,10,10,10, 11,11,12,12,12,12, 14,15,16,16,16],
      notes: [
        '猎头Pipeline启动，0到位','产品总监×1（提前锁定）','风控产品×1','客服产品×1','理财产品×1','业务分析×1',
        'AI产品运营×1','—','业务架构师×1','—','数据产品×1','—','Agent产品×1','—','产品VP×1','—','—','—',
        '商业化产品×1','—','行业方案PM×1','—','—','—',
        '解决方案+2','行业PM+1','稳态+1','—','—'
      ],
    },
    {
      dept: '🧪 测试/QA', color: '#e17055',
      // 7月0人→9月首批到位→年末~3人（测试岗不急，先有代码才需要测试）
      hires: [0,0,1,1,1,0, 0,1,0,0,0,0,1,0,0,0,0,0, 0,1,0,0,1,0, 2,1,1,1,1],
      cumulative: [0,0,1,2,3,3, 3,4,4,4,4,4,5,5,5,5,5,5, 5,6,6,6,7,7, 9,10,11,12,13],
      notes: [
        '—','—','AI模型测试×1（首批代码出来后）','安全测试×1','自动化测试×1','—',
        '—','Agent评测×1','—','—','—','—','多模态测试×1','—','—','—','—','—',
        '—','端到端测试×1','—','—','安全红队×1','—',
        'SaaS测试+2','合规测试+1','全球化+1','量子安全+1','稳态+1'
      ],
    },
    {
      dept: '📜 合规/风控', color: '#ffa657',
      // 7月0人→8月首席合规到位→10月起补齐→年末~4人
      hires: [0,1,0,1,1,0, 0,1,0,0,1,0,0,1,0,0,1,0, 0,1,0,0,1,0, 2,2,2,5,5],
      cumulative: [0,1,1,2,3,3, 3,4,4,4,5,5,5,6,6,6,7,7, 7,8,8,8,9,9, 11,13,15,20,25],
      notes: [
        '—','首席合规专家×1（提前锁定）','—','AI伦理×1','监管对接×1','—',
        '—','联邦合规×1','—','—','Agent合规×1','—','—','安全红队×1','—','—','监管沙盒×1','—',
        '—','行业标准×1','—','—','外部咨询×1','—',
        '全球化合规+2','合规架构+2','量子安全+2','全球化NOC+5','稳态+5'
      ],
    },
    {
      dept: '🔧 PMO/项目管理', color: '#a29bfe',
      // 7月0人→8月高级PM到位→10月协调员→年末~2人
      hires: [0,1,0,1,0,0, 0,0,1,0,0,0,0,0,1,0,0,0, 0,0,0,1,0,0, 1,1,1,2,2],
      cumulative: [0,1,1,2,2,2, 2,2,3,3,3,3,3,3,4,4,4,4, 4,4,4,5,5,5, 6,7,8,10,12],
      notes: [
        '—','高级PM×1（提前锁定）','—','协调员×1','—','—',
        '—','—','联邦项目PM×1','—','—','—','—','—','多项目PM×1','—','—','—',
        '—','—','—','Agent项目群PM×1','—','—',
        '项目总监+1','客户成功+1','SaaS运营+1','全球化交付+2','行业标准+2'
      ],
    },
    {
      dept: '🖥️ 运维/SRE', color: '#fd79a8',
      // 7月0人→9月GPU运维到位→年末~2人（先有集群才需要运维）
      hires: [0,0,1,0,1,0, 0,1,0,0,1,0,0,0,1,0,0,0, 0,0,1,0,0,0, 1,1,1,3,3],
      cumulative: [0,0,1,1,2,2, 2,3,3,3,4,4,4,4,5,5,5,5, 5,5,6,6,6,6, 7,8,9,12,15],
      notes: [
        '—','—','GPU集群运维×1（集群到货后）','—','基础设施×1','—',
        '—','H100集群×1','—','—','联邦平台×1','—','—','—','Agent SLA×1','—','—','—',
        '—','—','三地两中心×1','—','—','—',
        'SaaS运维+1','7×24值班+1','全球化NOC+1','边缘运维+3','稳态+3'
      ],
    },
    {
      dept: '📊 数据标注/分析', color: '#636e72',
      // 7月0人→9月数据分析师到位→年末~3人（先有数据需求才招标注）
      hires: [0,0,1,1,0,1, 0,0,1,0,0,0,0,1,0,0,0,0, 0,0,0,0,0,0, 0,-1,-1,1,1],
      cumulative: [0,0,1,2,2,3, 3,3,4,4,4,4,4,5,5,5,5,5, 5,5,5,5,5,5, 5,4,3,4,5],
      notes: [
        '—','—','数据分析师×1','外包标注×1','—','金融标注×1',
        '—','—','多模态标注×1','—','—','—','—','数据科学家×1','—','—','—','—',
        '—','—','—','—','—','—',
        '自动化替代','转岗质检-1','自动化成熟-1','数据资产+1','稳态+1'
      ],
    },
    {
      dept: '🤝 解决方案/售前', color: '#00b894',
      // Y1-Y3:0人, Y4:12(+12), Y5:18(+6)
      hires: [0,0,0,0,0,0, 0,0,0,0,0,0,0,0,0,0,0,0, 0,0,0,0,0,0, 0,6,6,4,2],
      cumulative: [0,0,0,0,0,0, 0,0,0,0,0,0,0,0,0,0,0,0, 0,0,0,0,0,0, 0,6,12,16,18],
      notes: [
        '-','-','-','-','-','-',
        '-','-','-','-','-','-','-','-','-','-','-','-',
        '-','-','-','-','-','-',
        '-','解决方案总监+架构师','技术售前+客户成功','全球化售前','售前协调'
      ],
    },
  ];

  /* ================================================================
   *  ★ 招聘投入成本（新增）
   *  包含：猎头费、招聘平台费、面试差旅、入职培训、背调等
   *  单位：万元
   * ================================================================ */
  const hiringCostData = {
    // 前两年按月（24个月），后三年按半年（5个半年）
    categories: [
      {
        name: '🏹 猎头费', color: '#e17055',
        desc: 'P7+岗位走猎头，费率=年薪×20-25%；7月为Pipeline启动预付',
        // 7月启动预付→8月首批入职付款→9-10月批量→11-12月收敛
        monthly: [80,60,50,50,40,30, 25,25,20,15,20,10,20,15,15,15,10,5, 15,10,10,10,10,5, 50,40,35,45,25],
        yearTotal: [310, 215, 60, 90, 70],
      },
      {
        name: '💻 招聘平台', color: '#00cec9',
        desc: 'Boss直聘/猎聘/LinkedIn企业版/脉脉等年费+简历下载',
        monthly: [15,5,5,5,5,5, 5,3,3,3,3,3,5,3,3,3,3,3, 5,3,3,3,3,3, 15,15,15,15,15],
        yearTotal: [40, 38, 20, 30, 30],
      },
      {
        name: '✈️ 面试差旅', color: '#6c5ce7',
        desc: '异地候选人面试差旅报销+面试官出差',
        monthly: [8,6,5,4,3,2, 3,2,2,2,2,1,2,2,2,2,1,1, 2,2,1,1,1,1, 5,4,4,3,3],
        yearTotal: [28, 22, 8, 9, 6],
      },
      {
        name: '📚 入职培训', color: '#3fb950',
        desc: '新人培训（金融合规/系统权限/安全意识/业务培训）',
        monthly: [10,6,4,4,3,2, 3,2,3,2,2,1,2,2,2,2,1,1, 2,2,1,1,1,1, 5,4,4,3,3],
        yearTotal: [29, 23, 8, 9, 6],
      },
      {
        name: '🔍 背调&体检', color: '#ffa657',
        desc: '第三方背调（P7+全量背调）+入职体检',
        monthly: [5,3,2,2,2,1, 2,1,1,1,1,1,1,1,1,1,1,0, 1,1,1,1,1,0, 3,2,2,2,2],
        yearTotal: [15, 11, 5, 5, 4],
      },
    ],
    // 汇总
    summary: {
      monthlyTotal: [], // 将在渲染时计算
      yearTotals: [418, 310, 95, 135, 95], // Y1/Y2/Y2后半(28H1)/Y3-Y4/Y5
      grandTotal: 1053, // 五年招聘总投入（万元）
      notes: '💡 Y1招聘投入¥418万（7月为Pipeline启动预付，8月起才有入职成功付款）；Y2起逐步收敛，更多依赖内推和自招渠道（内推奖金另计入人力成本）。',
    },
  };

  /* ================================================================
   *  五年阶段 —— 精细化数据
   *  金额单位：万元（人民币）
   * ================================================================ */
  const phases = [
    {
      year: 'Y1（2026.7-2027.6）', title: '筑基', color: '#6c5ce7',
      focus: '7月启动Pipeline+采购：8月首批骨干到位 → 10月起业务项目正式启动 → 2027H1首批PoC上线',
      goals: [
        '【Q1·筹备】7月：GPU集群采购立项（昇腾910C×4台）；猎头Pipeline全开（JD发布+内部调岗）；0人到位，纯筹备期',
        '【Q1·筹备】8月：核心三人组到位（P8+算法专家+架构师+产品总监）；启动数据资产盘点&知识库规划；9月执行层18人批量到位',
        '【Q2·建设】10月：GPU到货+私有化部署启动（Qwen2.5-72B基座）；反欺诈特征工程+数据治理同步推进',
        '【Q2·建设】11-12月：全员34人到位；RAG知识库内测通过（准确率>80%）；图网络反欺诈模型训练启动（GAT架构）',
        '【Q3·验证】2027.1-2月：风控PoC内测（信用卡欺诈+图网络推理）；客服RAG灰度上线；两条线同步建立评测基线',
        '【Q3·决策门✓】2027.3月：风控PoC识别率+10%达标→批准全产品线扩展；客服准确率>85%达标→批准规模化上线',
        '【Q4·规模】2027.4-5月：智能客服正式上线（替代10%坐席=释放120人）；投研助手内部试用（30名投研人员日均使用率>60%）',
        '【Q4·年终】2027.6月：YE Review — 平台SLA 99.5% · ROI可见（节省¥1700万）；向管理层提交Y2扩编申请（90人 · ¥1.5亿预算）',
      ],
      goalsDetailed: [
        {
          quarter: 'Q1', label: '筹备', period: '2026.7—9月', isGate: false,
          tracks: [
            { name: '👥 人力', tasks: ['7月：猎头Pipeline全开（发布8个JD + 内部调岗摸排）', '8月：核心四人组到位 → 负责人P8 · 算法专家 · 架构师 · 产品总监', '9月：执行层18人批量入职（算法×6 工程×6 产品×4 数据×2）'] },
            { name: '🖥️ 基础设施', tasks: ['7月：昇腾910C×4台采购立项审批（¥1200万）', '数据资产盘点启动 + AI平台技术选型（vLLM / Ray / MLflow）'] },
            { name: '🛡️ 风控', tasks: ['反欺诈业务场景梳理（信用卡 + 消费贷）', '图网络架构选型（GAT vs GCN 对比实验）', '数据源对接规划（征信 / 交易流水 / 行为日志）'] },
            { name: '💬 客服', tasks: ['RAG框架选型（Milvus + LangChain）', 'Top200高频问题收集 + 人工标注启动'] },
            { name: '📜 合规/理财', tasks: ['监管政策知识库规划（3000+条文档收集）', '投研助手需求调研（访谈10名投研人员）'] },
          ],
        },
        {
          quarter: 'Q2', label: '建设', period: '2026.10—12月', isGate: false,
          tracks: [
            { name: '🖥️ 基础', tasks: ['GPU到货 → Qwen2.5-72B私有化部署完成', 'MLflow + vLLM + Ray训练平台搭建完毕', '全员34人到位；5个小组架构定型'] },
            { name: '🛡️ 风控', tasks: ['反欺诈特征工程完成（200+特征 + 时序窗口设计）', 'GAT图网络模型训练正式启动', '数据治理规范完成 + ETL管道打通'] },
            { name: '💬 客服', tasks: ['RAG知识库内测通过：准确率 >80%，Top200覆盖率 >90%', '自动化评测回归框架搭建'] },
            { name: '📜 合规/理财', tasks: ['合规知识库上线 → 政策查询效率提升5×', '合同审查辅助PoC → 合规团队内部试用'] },
          ],
        },
        {
          quarter: 'Q3', label: '验证', period: '2027.1—3月', isGate: true,
          gateDesc: '3月双决策门 → ① 风控PoC欺诈识别率+10% 达标：批准全产品线扩展  ② 客服RAG准确率>85% 达标：批准规模化上线',
          tracks: [
            { name: '🛡️ 风控', tasks: ['信用卡欺诈PoC内测（GAT图网络 + 规则引擎融合推理）', '评测基线建立：精确率 / 召回率 / F1 / AUC', '【🚦 3月决策门】识别率+10% → 批准全产品线扩展'] },
            { name: '💬 客服', tasks: ['RAG客服灰度上线（10%话务量 + 人工兜底机制）', '实时准确率监控 + A/B测试体系建立', '【🚦 3月决策门】准确率>85% → 批准规模化上线'] },
            { name: '💰 理财', tasks: ['投研助手PoC上线（研报摘要 + 基金对比 + 行情解读）', '内测：30名投研人员，目标日均使用率 >60%'] },
            { name: '📜 合规', tasks: ['合规知识库扩展覆盖全行监管政策', '合同自动审查准确率 >75%（进入灰度测试）'] },
          ],
        },
        {
          quarter: 'Q4', label: '规模化', period: '2027.4—6月', isGate: false,
          tracks: [
            { name: '💬 客服', tasks: ['智能客服正式上线 → 替代10%坐席（释放120人，节省¥300万/季）', '扩量至30%话务量，客户满意度 >4.2/5.0'] },
            { name: '💰 理财', tasks: ['投研助手推广至投研部门全员（100+人）', '研报处理效率提升30%，日均调用 >500次'] },
            { name: '🛡️ 风控', tasks: ['PoC结论报告 → 消费贷全产品线扩展立项获批', '风控数据飞轮启动：线上反馈自动入训练集'] },
            { name: '🏁 年终', tasks: ['YE Review：SLA 99.5% · ROI ¥1700万（节省¥1200万 + 内部结算¥500万）', '向管理层提交Y2扩编申请：90人 · ¥1.5亿预算'] },
          ],
        },
      ],
      kpi: '年末在岗 ~34 人 · AI 客服替代 10% · 反欺诈PoC上线 · 平台 SLA 99.5%',
      /* —— 人力成本（基于甘特图招聘节奏推导，非满编全年计算） —— */
      headcount: {
        total: 34,
        salaryTotal: 2800,
        salaryNote: '7月启动Pipeline（0人到位）→8月首批骨干5人→年底34人。按实际在岗月数计算，人均在岗仅3-5个月，故总成本¥2800万',
      },
      /* —— 硬件 & 基础设施明细 —— */
      infra: {
        total: 3500,
        breakdown: [
          { item: 'GPU 训练集群', spec: '8×昇腾910C 节点 ×4 台（国产 DGX 替代）（银行数据不出境合规要求，采用国产AI芯片）', cost: 1200, note: '70B 模型全量微调最低配置，含高速互联' },
          { item: 'GPU 推理集群', spec: '4×昇腾310P 节点 ×6 台', cost: 720, note: '支撑 7B 蒸馏版在线推理，QPS ~200' },
          { item: '存储系统', spec: 'Ceph 分布式存储 500TB + NVMe 缓存 50TB', cost: 350, note: '训练数据 + 模型 checkpoint + 向量库' },
          { item: '网络 & 机房', spec: '100Gbps RDMA 网络 + 机柜租赁 8 个', cost: 280, note: '自建 IDC 机房，含电力 / 制冷 / UPS' },
          { item: 'AI 平台软件', spec: 'MLflow + Ray + vLLM + 自研调度', cost: 200, note: '开源为主 + 自研适配层' },
          { item: '数据湖 & ETL', spec: 'Hadoop/Spark 集群 + Kafka + Flink', cost: 350, note: '复用行内大数据平台，增量扩容' },
          { item: '安全 & 隐私计算', spec: 'TEE 节点 ×4 + FATE 平台部署', cost: 200, note: '联邦学习基础设施' },
          { item: '灾备 & 冗余', spec: '异地灾备 1 套（推理集群 50% 规模）', cost: 200, note: '金融监管要求，RPO<1h / RTO<4h' },
        ],
      },
      /* —— 外部采购明细 —— */
      vendor: {
        total: 800,
        breakdown: [
          { item: '商用模型私有化部署（过渡）', cost: 200, note: 'Y1 快速启动：通义千问/GLM-4 企业版私有化部署（数据不出境）。同步评估 Qwen2.5/DeepSeek 开源方案' },
          { item: '隐私计算平台授权', cost: 150, note: 'SecretFlow 企业版 / FATE 商业支持' },
          { item: '外部数据源', cost: 200, note: '征信数据、工商数据、舆情数据年度订阅' },
          { item: '咨询 & 审计', cost: 150, note: 'AI 治理咨询（德勤/普华）+ 模型审计' },
          { item: '培训 & 认证', cost: 100, note: '团队技能培训 + 行业会议 + 云厂商认证' },
        ],
      },
      /* —— 营收 & 节省明细 —— */
      revenue: {
        savingsTotal: 1200,
        savingsBreakdown: [
          { source: '客服人力替代', amount: 600, calc: '替代 20% 坐席 ≈ 120 人 × 年均成本 5 万 = 600 万', confidence: '高' },
          { source: '风控损失降低', amount: 400, calc: '信用卡欺诈损失率从 0.15% 降至 0.12%，高风险信贷业务子集 ¥800 亿 × 0.03% = ¥2400 万 × 保守取 1/6 ≈ ¥400 万', confidence: '中' },
          { source: '合规审查提效', amount: 200, calc: '合规团队效率提升 30%，等效节省 8 人 × 25 万', confidence: '中' },
        ],
        revenueTotal: 500,
        revenueBreakdown: [
          { source: '投研助手订阅（内部）', amount: 0, calc: 'Y1 为内部试用期，不产生外部营收', confidence: '-' },
          { source: 'AI 平台技术输出', amount: 500, calc: '向平安集团内部子公司提供技术支持，内部结算 500 万', confidence: '中' },
        ],
        revenueNote: '营收定义：① 节省成本 = AI 替代人工的等效薪资 + 业务损失降低金额；② 增量营收 = AI 产品/服务直接产生的新增收入（含内部结算 + 外部客户付费）',
      },
    },
    {
      year: 'Y2（2027.7-2028.6）', title: '场景突破', color: '#00cec9',
      focus: '核心场景规模化落地 + Agent 1.0 + 联邦学习平台',
      goals: [
        '【Q1·规模化】2027.7月：扩编至55人（算法/工程/产品均衡）；风控扩展至消费贷+房贷全产品线；客服灰度扩量至50%话务量',
        '【Q1·规模化】2027.8-9月：LLM+图网络融合风控模型上线（训练集昇腾910C×8台）；客服替代率达25%（释放150名坐席）；多模态客服（语音+文字）启动开发',
        '【Q2·产品矩阵】2027.10月：AI理财顾问1.0正式上线（面向30万高净值客户）；合规审查Agent覆盖营销合规/合同审查两大场景',
        '【Q2·决策门✓】2027.12月：H1回顾 — 客服替代率≥35%达标→启动Agent 2.0规划；理财顾问月活>5万达标→启动AUM管理功能；合规效率+60%达标',
        '【Q3·Agent 1.0】2028.1月：风控Agent 1.0内测（实时交易监控+自动封卡，人工复核率目标<20%）；客服业务办理Agent试点（开卡/转账场景）',
        '【Q3·Agent 1.0】2028.2-3月：AUM转化率+8%验证（AI推荐持续追踪30天留存）；联邦风控联盟首批2家机构签约+隐私计算节点部署完成',
        '【Q4·稳固】2028.4-5月：全链路合规Agent上线（SAR报告自动生成+政策变更预警）；联邦联盟扩至3家；平台GPU利用率>70%（优化调度策略达成）',
        '【Q4·年终】2028.6月：YE Review — 90人满编 · AI年化节省¥6500万 · 联盟3家；向管理层提交Y3 Agent化路线图（130人 · ¥2.5亿预算）',
      ],
      goalsDetailed: [
        {
          quarter: 'Q1', label: '规模化', period: '2027.7—9月', isGate: false,
          tracks: [
            { name: '👥 人力', tasks: ['7月扩编 → 55人（算法+5 工程+6 产品+5 运营+3 安全+2）', '8月骨干晋级评定 + 新批次P7人才引进', '联邦学习专家2人入职（支撑Q4联盟建设）'] },
            { name: '🛡️ 风控', tasks: ['LLM+图网络融合模型训练（昇腾910C ×8台扩容后启动）', '消费贷 + 房贷产品线欺诈特征工程', '8月：融合模型上线，全行信贷产品覆盖', 'SAR自动生成PoC启动（监管报告自动化基础）'] },
            { name: '💬 客服', tasks: ['灰度流量扩量至50%话务量（自动熔断机制保障）', '客服替代率 → 25%（释放150名坐席，节省¥375万/季）', '多模态客服（语音+文字+图片）需求评审 + 技术选型'] },
            { name: '💰 理财', tasks: ['理财顾问PoC数据分析 → 1000名试用客户行为报告', '高净值客群画像建模（AUM分层 × 风险偏好）', 'AI理财顾问1.0产品设计评审'] },
            { name: '📜 合规', tasks: ['合同审查Agent升级 → 处理时间 2天→4小时', '营销合规审查场景接入（推广文案自动审核）'] },
          ],
        },
        {
          quarter: 'Q2', label: '产品矩阵', period: '2027.10—12月', isGate: true,
          gateDesc: '12月半年决策门 → ① 客服替代率≥35%：启动Agent 2.0规划  ② 理财顾问月活>5万：启动AUM管理功能  ③ 合规效率+60%：全行推广',
          tracks: [
            { name: '💰 理财', tasks: ['10月：AI理财顾问1.0正式上线（面向30万高净值客户）', '个性化基金/理财产品推荐（千人千面）', '月活目标 >5万，转化率跟踪（30天留存 >40%）'] },
            { name: '📜 合规', tasks: ['合规审查Agent全量上线（合同审查+营销物料双场景）', '审查效率+60%：合规团队等效节省20人', '接入行内合规案例库（5年历史违规案例结构化）'] },
            { name: '💬 客服', tasks: ['多模态客服PoC完成：语音ASR准确率 >92%', '客服替代率提升目标 → 35%', '【🚦 12月决策门】替代率≥35%：启动业务办理Agent规划'] },
            { name: '🛡️ 风控 / 平台', tasks: ['SAR报告自动生成内测：5000份/年 → 2小时/份', 'GPU利用率优化：Spot实例调度 + 训练/推理错峰', 'AI平台SLA监控仪表盘上线'] },
          ],
        },
        {
          quarter: 'Q3', label: 'Agent 1.0', period: '2028.1—3月', isGate: false,
          tracks: [
            { name: '🛡️ 风控 Agent', tasks: ['风控Agent 1.0内测：实时交易监控 + 异常预警 + 自动封卡', '人工复核率目标 <20%（当前100%）', '误报率控制 <0.5%（避免误封正常交易）', '联邦风控联盟：首批2家银行签约 + 隐私计算节点部署完成'] },
            { name: '💬 客服 Agent', tasks: ['业务办理Agent试点（开卡 / 挂失 / 转账三大场景）', '端到端完成率目标 >60%（剩余40%转人工）', 'Agent安全沙箱 + 操作审计日志上线'] },
            { name: '💰 理财', tasks: ['AUM转化率+8%结果验证（30天持续追踪）', '自动调仓建议功能PoC（规则引擎+模型融合）', 'AI管理AUM破¥50亿里程碑目标'] },
            { name: '📜 合规', tasks: ['SAR/CTR报告全量自动化（90%报告无需人工修改）', 'HY2合规审计准备：模型可解释性报告输出'] },
          ],
        },
        {
          quarter: 'Q4', label: '稳固', period: '2028.4—6月', isGate: false,
          tracks: [
            { name: '📜 合规 Agent', tasks: ['全链路合规Agent上线（SAR + CTR + 营销 + 合同四合一）', '政策变更影响分析自动化：监管新规 → 受影响条款清单 <2小时', '向3家外部机构提供合规咨询服务（创收¥200万）'] },
            { name: '🌐 联邦联盟', tasks: ['联邦风控联盟扩至3家（新增农商行×1 + 消费金融公司×1）', '跨机构联合建模完成首次迭代', 'GPU利用率优化达标：利用率 >70%（调度策略 + 弹性扩缩容）'] },
            { name: '🏁 年终', tasks: ['YE Review：90人满编 · 节省¥6500万 · 联盟3家 · SLA 99.95%', '向管理层提交Y3 Agent化路线图：130人 · ¥2.5亿 · 四大Agent全线升级'] },
          ],
        },
      ],
      kpi: '年末在岗 ~90 人 · AI 客服替代率 35% · 理财 AUM 转化率+8% · 合规效率+60%',
      headcount: {
        total: 90,
        salaryTotal: 9500,
        salaryNote: '年初34人→年末90人，全年平均在岗~62人。Y2是主力扩编期，人均成本较Y1上浮8-12%',
      },
      infra: {
        total: 5200,
        breakdown: [
          { item: 'GPU 训练集群扩容', spec: '新增昇腾910C 节点 ×8 台', cost: 2000, note: '支撑多模态模型训练 + Agent 微调' },
          { item: 'GPU 推理集群扩容', spec: '新增昇腾310P/910B 推理节点 ×12 台', cost: 960, note: '多模态推理 + 实时客服，QPS 目标 500' },
          { item: '存储扩容', spec: '扩至 1.2PB + 向量数据库集群', cost: 450, note: '新增 Milvus 向量库 + 多模态数据存储' },
          { item: '网络 & 机房', spec: '新增 4 个机柜 + 400Gbps 骨干升级', cost: 350, note: '支撑联邦学习跨机构通信' },
          { item: '隐私计算集群', spec: 'TEE 节点 ×8 + MPC 计算节点 ×4', cost: 500, note: '联邦风控联盟基础设施' },
          { item: '运维 & 监控', spec: 'Prometheus + Grafana + 自研 AI 监控', cost: 200, note: '模型漂移检测 + 推理延迟监控' },
          { item: '灾备升级', spec: '双活架构改造（推理层）', cost: 400, note: '客服场景要求 99.95% 可用性' },
          { item: '电力 & 制冷', spec: '新增 UPS + 液冷改造', cost: 340, note: '昇腾910C 功耗约 400W/卡，液冷散热提升能效' },
        ],
      },
      vendor: {
        total: 1150,
        breakdown: [
          { item: '商用模型授权（降级续约）', cost: 150, note: 'Y2 开源微调逐步替代商用基座，商用模型降为备选/对比基线，授权费大幅缩减' },
          { item: '开源模型生态支持', cost: 100, note: 'Qwen/DeepSeek 社区企业支持 + 微调工具链授权（ModelScope/vLLM 企业版）' },
          { item: '隐私计算平台', cost: 250, note: '联邦学习平台升级 + 跨机构部署' },
          { item: '外部数据源', cost: 300, note: '新增社交舆情 + 卫星图像 + 供应链数据' },
          { item: '咨询 & 审计', cost: 200, note: 'AI 治理成熟度评估 + 年度模型审计' },
          { item: '培训 & 会议', cost: 150, note: '团队扩张期密集培训 + 行业峰会' },
        ],
      },
      revenue: {
        savingsTotal: 4500,
        savingsBreakdown: [
          { source: '客服人力替代', amount: 2250, calc: '替代 45% 坐席 ≈ 270 人 × 年均 5 万 + 夜间/节假日全覆盖节省加班费 600 万', confidence: '高' },
          { source: '风控损失降低', amount: 1200, calc: '欺诈损失率降至 0.08%，高风险信贷业务子集 ¥900 亿 × 0.07% 降幅 = ¥6300 万 × 保守取 1/5 ≈ ¥1200 万', confidence: '中' },
          { source: '合规审查提效', amount: 600, calc: '审查效率提升 60%，等效节省 20 人 × 30 万', confidence: '高' },
          { source: 'SAR 报告自动化', amount: 450, calc: '年均 5000 份 SAR × 人工 2 天/份 → AI 2 小时/份，节省 25 人年', confidence: '中' },
        ],
        revenueTotal: 2000,
        revenueBreakdown: [
          { source: 'AI 理财顾问佣金增量', amount: 800, calc: 'AI 推荐转化率提升 8%，AUM 增量 ¥50 亿 × 管理费率 0.5% × 分成 32%', confidence: '中' },
          { source: '联邦风控服务费', amount: 500, calc: '3 家联盟银行 × 年服务费 150-200 万', confidence: '中' },
          { source: '集团内部技术输出', amount: 700, calc: '向平安保险/证券提供 AI 中台服务，内部结算', confidence: '高' },
        ],
        revenueNote: '营收定义：① 节省成本 = AI 替代人工的等效薪资 + 业务损失降低金额；② 增量营收 = AI 产品/服务直接产生的新增收入（含内部结算 + 外部客户付费）',
      },
    },
    {
      year: 'Y3（2028.7—2029.6）', title: 'Agent 驱动', color: '#3fb950',
      focus: '多 Agent 协作体系 + 全链路自动化 + 数据飞轮',
      goals: [
        '风控 Agent：实时交易监控 + 异常预警 + 自动处置（人工复核率 <10%）',
        '客服 Agent：端到端业务办理（开卡 / 转账 / 理赔），替代 65% 人工',
        '理财 Agent：千人千面投资组合推荐 + 自动调仓建议 + 市场解读',
        '合规 Agent：监管报告自动生成 + 政策变更影响分析',
        '内部 Copilot：覆盖研发 / 运营 / 财务，全行 AI 渗透率 >50%',
      ],
      kpi: 'Agent 自主处理率 >60% · 全行 AI 渗透率 >50% · 年化节省人力成本 ¥1.2 亿',
      headcount: {
        total: 130,
        salaryTotal: 16000,
        salaryNote: '年初90人→年末130人，Agent方向人才稀缺溢价+股权激励加码。人均成本较Y2上浮10-15%',
      },
      infra: {
        total: 7000,
        breakdown: [
          { item: 'GPU 训练+推理集群', spec: '昇腾910D 128卡训练 + 310P/910B 200+卡推理池', cost: 4000, note: 'Agent RL 训练 + 多 Agent 并发推理（QPS 2000）' },
          { item: '存储、向量库 & 网络', spec: '3PB + Milvus ×3 + 800Gbps 骨干 + 6 机柜', cost: 1100, note: '全行知识库/Agent 记忆 + 实时风控 <50ms' },
          { item: '隐私计算 + Agent 平台', spec: 'TEE ×16 + MPC ×8 + 自研编排引擎沙箱', cost: 1100, note: '联盟扩至 5+ 机构 + 工具调用安全隔离' },
          { item: '灾备、制冷 & 绿电', spec: '三地两中心 + 液冷全覆盖 + 绿电采购', cost: 800, note: '99.99% 可用性 + PUE <1.25（ESG）' },
        ],
      },
      vendor: {
        total: 1450,
        breakdown: [
          { item: '模型生态（开源主力 + 商用补充）', cost: 300, note: '自研 Agent 框架 + 开源企业支持 + 商用多模态能力补充（大幅缩减商用授权）' },
          { item: '隐私计算 + 安全红队', cost: 550, note: '同态加密加速库 + 联盟管理平台 + AI 安全攻防测试' },
          { item: '外部数据源', cost: 350, note: '实时行情 + 另类数据 + 全球舆情' },
          { item: '咨询、审计 & 培训', cost: 250, note: '监管沙盒申请 + 年度模型审计 + Agent 安全培训' },
        ],
      },
      revenue: {
        savingsTotal: 12000,
        savingsBreakdown: [
          { source: '客服 + 柜面人力替代', amount: 5200, calc: '替代 65% 坐席 ≈ 390 人 × 5.5 万 + 端到端业务办理节省柜面人力 3000 万', confidence: '高' },
          { source: '风控损失降低', amount: 3500, calc: '欺诈损失率降至 0.05%，高风险信贷子集 ¥1000 亿 × 0.1% 降幅 × 35% 保守系数', confidence: '中' },
          { source: '内部 Copilot + 合规自动化', amount: 3300, calc: '全行 5000+ 员工提效 15%（节省 750 人年）+ 合规全流程自动化节省 40 人年', confidence: '中' },
        ],
        revenueTotal: 5000,
        revenueBreakdown: [
          { source: 'AI 理财 AUM 佣金', amount: 2500, calc: 'AI 管理 AUM ¥200 亿 × 管理费 0.5% × 分成 25%', confidence: '中' },
          { source: '联邦风控服务费 + 集团输出', amount: 2000, calc: '5 家联盟 × 200 万 + 平安保险/证券/信托 AI 中台内部结算', confidence: '高' },
          { source: 'Agent SaaS 试点', amount: 500, calc: '2 家中小银行试点 × 250 万/年', confidence: '低' },
        ],
        revenueNote: '营收定义：① 节省成本 = AI 替代人工的等效薪资 + 业务损失降低金额；② 增量营收 = AI 产品/服务直接产生的新增收入（含内部结算 + 外部客户付费）',
      },
    },
    {
      year: 'Y4（2029.7—2030.6）', title: '生态输出', color: '#e17055',
      focus: 'AI 能力平台化 + 集团生态输出 + 行业标准参与',
      goals: [
        '金融 AI 平台 SaaS 化，向平安集团（保险 / 证券 / 信托）输出',
        '联邦学习联盟扩展至 10+ 家金融机构',
        '参与制定银行业 AI 治理标准（与银保监会 / 人行合作）',
        '风控模型市场化输出（中小银行 / 消金公司 / 互联网金融）',
        'AI 原生产品线贡献营收占比 >25%',
      ],
      kpi: '平台输出 5+ 集团子公司 · 联邦联盟 10+ 机构 · AI 营收占比 >25%',
      headcount: {
        total: 180,
        salaryTotal: 22000,
        salaryNote: '年初130人→年末180人，新增解决方案/售前团队支撑商业化输出。人均成本较Y3上浮8-12%',
      },
      infra: {
        total: 8500,
        breakdown: [
          { item: 'GPU 训练+推理集群（含SaaS租户）', spec: '下一代国产训练芯片 256卡 + 推理池 400+卡，多租户隔离', cost: 4800, note: '行业大模型持续迭代 + 弹性扩缩容支撑商业化' },
          { item: '存储、数据湖 & 网络', spec: '5PB 多租户物理隔离 + 混合云 + 专线互联', cost: 1400, note: '10+ 联盟机构低延迟通信 + SaaS 客户数据隔离' },
          { item: '隐私计算 + SaaS 平台基础设施', spec: 'TEE ×24 + MPC ×12 + HE 加速卡 + 多租户 K8s + API Gateway', cost: 1400, note: '联盟规模化运营 + 商业化计费平台' },
          { item: '灾备、合规认证 & 绿电', spec: '金融云合规+等保三级 + 绿电>50% + 碳中和路径', cost: 900, note: '外部客户合规基线 + ESG 报告要求' },
        ],
      },
      vendor: {
        total: 1930,
        breakdown: [
          { item: '模型生态（开源主力 + 商用极少量）', cost: 330, note: '微调工具链/评测平台/社区企业支持为主；商用仅保留多模态/代码生成等开源暂未追平的能力' },
          { item: '隐私计算 + 安全审计', cost: 400, note: '联盟管理 + 密码学加速 + AI 安全攻防 + SOC2/ISO27001 认证' },
          { item: '外部数据源', cost: 400, note: '全球金融数据 + ESG 数据 + 另类数据' },
          { item: '合规认证 + 市场BD', cost: 800, note: '等保认证+年度审计 + 行业峰会+客户拓展+品牌建设' },
        ],
      },
      revenue: {
        savingsTotal: 22000,
        savingsBreakdown: [
          { source: '客服人力替代（全渠道）', amount: 7500, calc: '替代 75% 坐席 + 全渠道 AI 覆盖，节省 500+ 人年', confidence: '高' },
          { source: '风控损失降低', amount: 6000, calc: '欺诈损失率降至 0.04%，高风险信贷子集 ¥1200 亿 × 0.11% 降幅 × 45% 保守系数', confidence: '中' },
          { source: '内部 Copilot + 合规&运营自动化', amount: 8500, calc: '全行 8000+ 员工提效 25%（节省人均成本） + 全链路合规/运营自动化节省 100+ 人年', confidence: '中' },
        ],
        revenueTotal: 12000,
        revenueBreakdown: [
          { source: 'AI 理财 AUM 佣金 + 集团输出', amount: 6500, calc: 'AI 管理 AUM ¥400 亿 × 管理费 0.5% × 分成 20% + 5 家子公司内部结算', confidence: '中' },
          { source: '联邦风控服务费 + SaaS 平台', amount: 4500, calc: '10 家联盟 × 200 万 + 8 家中小银行 SaaS × 300 万/年', confidence: '高' },
          { source: '行业解决方案', amount: 1000, calc: '定制化项目 3-5 个 × 200-300 万', confidence: '低' },
        ],
        revenueNote: '营收定义：① 节省成本 = AI 替代人工的等效薪资 + 业务损失降低金额；② 增量营收 = AI 产品/服务直接产生的新增收入（含内部结算 + 外部客户付费）',
      },
    },
    {
      year: 'Y5（2030.7—2031.6）', title: 'AI 原生银行', color: '#ffa657',
      focus: '全面 AI 原生化 + 自主决策 + 行业标杆',
      goals: [
        '80% 的客户交互由 AI 完成（人工仅处理复杂 / 高价值 / 投诉场景）',
        '风控全链路 AI 化：从准入 → 授信 → 贷中监控 → 贷后催收',
        '理财 Agent 管理 AUM >¥500 亿（AI 辅助决策）',
        'AI 贡献营收占比 >35%，年化节省成本 >¥5 亿',
        '成为银保监会认定的"AI 治理示范银行"',
      ],
      kpi: 'AI 交互占比 80% · AI 营收占比 35% · 年化节省 ¥5 亿 · 行业标杆认证',
      headcount: {
        total: 230,
        salaryTotal: 28000,
        salaryNote: '年初180人→年末230人，全球化+SaaS输出阶段。人均成本较Y4上浮6-10%（另预留buffer至满编260）',
      },
      infra: {
        total: 9500,
        breakdown: [
          { item: 'GPU 训练+推理集群（含边缘节点）', spec: '下一代国产训练芯片 512卡 + 推理池 600+卡 + 边缘推理节点', cost: 5500, note: '行业大模型迭代/世界模型探索 + 80% 交互量 AI 推理支撑' },
          { item: '存储、数据湖 & 全球网络', spec: '8PB 全行数据资产平台 + 全球化网络 + 多云灾备', cost: 1600, note: '数据资产化运营 + 海外业务拓展' },
          { item: '隐私计算 + SaaS 全球化架构', spec: '联盟级隐私计算网络 + 多区域部署', cost: 1500, note: '10+ 机构常态化联合计算 + 商业化全球化' },
          { item: '灾备、合规 & 绿电碳中和', spec: '全球合规 + 多地域灾备 + 绿电>80%', cost: 900, note: '各地监管要求 + AI 算力碳中和（ESG）' },
        ],
      },
      vendor: {
        total: 2430,
        breakdown: [
          { item: '自研行业大模型 + 开源生态', cost: 430, note: 'Y5 完全自主：自研行业大模型 + 开源社区贡献 + 信创全链路工具链；商用模型仅用于前沿能力评估/对比基线' },
          { item: '隐私计算 + 量子安全 + 安全审计', cost: 500, note: '联盟运营 + 密码学前沿 + 量子安全试点 + AI 安全全面覆盖' },
          { item: '外部数据源（全球覆盖）', cost: 500, note: '全球金融数据全覆盖 + 数据资产变现基础' },
          { item: '全球合规认证 + 市场品牌', cost: 1000, note: '全球合规认证+行业标准维护 + 行业标杆品牌建设+国际会议' },
        ],
      },
      revenue: {
        savingsTotal: 35000,
        savingsBreakdown: [
          { source: '客服全渠道 AI 替代', amount: 12000, calc: '替代 80% 坐席 + 全时段全渠道覆盖，节省 800+ 人年 × 平均 6 万 + 场地/设备节省 7200 万', confidence: '高' },
          { source: '风控损失降低', amount: 10000, calc: '欺诈损失率降至 0.03%，高风险信贷子集 ¥1500 亿 × 0.12% 降幅 × 55% 保守系数', confidence: '中' },
          { source: '内部 Copilot + 合规&运营全自动化', amount: 13000, calc: '全行 10000+ 员工提效 30%（节省 3000 人年）+ 全链路端到端自动化节省 150+ 人年 + 罚款风险降低', confidence: '中' },
        ],
        revenueTotal: 25000,
        revenueBreakdown: [
          { source: 'AI 理财 AUM 佣金 + 集团输出', amount: 10250, calc: 'AI 管理 AUM ¥500 亿 × 管理费 0.5% × 分成 25% + 8 家子公司内部结算 × 500 万/年', confidence: '中' },
          { source: '联邦风控服务费 + SaaS 平台', amount: 10500, calc: '15 家联盟 × 200 万 + 20 家银行/金融机构 SaaS × 375 万/年', confidence: '高' },
          { source: '行业解决方案 + 数据资产变现', amount: 4250, calc: '定制项目 8-10 个 × 250-350 万 + 脱敏数据产品/行业报告/指数产品', confidence: '中' },
        ],
        revenueNote: '营收定义：① 节省成本 = AI 替代人工的等效薪资 + 业务损失降低金额 + 场地/设备节省；② 增量营收 = AI 产品/服务直接产生的新增收入（含内部结算 + 外部客户付费 + 数据资产变现）',
      },
    },
  ];

  /* —— 四大业务线目标拆解（保留） —— */
  const bizLines = [
    {
      name: '🛡️ 智能风控', color: '#e17055',
      y1: '图网络反欺诈上线（信用卡+消费贷）', y2: 'LLM+图网络融合，SAR 自动生成',
      y3: '风控 Agent 自主处置（复核率<10%）', y4: '风控模型市场化输出', y5: '全链路 AI 风控（准入→催收）',
      metric: '欺诈损失率', baseline: '0.15%', target: '0.03%',
    },
    {
      name: '💬 智能客服', color: '#00cec9',
      y1: 'RAG 客服覆盖 Top200 问题', y2: '多模态客服，替代 45% 人工',
      y3: '端到端业务办理 Agent', y4: '情感识别 + 主动服务', y5: '80% 交互 AI 完成',
      metric: '人工坐席替代率', baseline: '5%', target: '80%',
    },
    {
      name: '💰 智能理财', color: '#6c5ce7',
      y1: '投研助手 PoC（内部试用）', y2: 'AI 理财顾问 1.0 上线',
      y3: '千人千面组合推荐 + 自动调仓', y4: 'AI 管理 AUM ¥200→400 亿', y5: 'AI 管理 AUM ¥500 亿',
      metric: 'AI 辅助 AUM', baseline: '¥0', target: '¥500 亿',
    },
    {
      name: '📜 智能合规', color: '#ffa657',
      y1: '合规知识库 + 政策检索', y2: '合规审查 Agent（合同/营销）',
      y3: '监管报告自动生成', y4: '参与行业标准制定', y5: 'AI 治理示范银行',
      metric: '合规审查效率', baseline: '人工 2 天/份', target: 'AI 10 分钟/份',
    },
  ];

  /* —— 辅助：计算各年汇总 —— */
  const yearSummary = phases.map(p => ({
    year: p.year.replace(/（.*）/, ''),
    color: p.color,
    title: p.title,
    totalInvest: p.headcount.salaryTotal + p.infra.total + p.vendor.total,
    salary: p.headcount.salaryTotal,
    infra: p.infra.total,
    vendor: p.vendor.total,
    savings: p.revenue.savingsTotal,
    revenue: p.revenue.revenueTotal,
    totalReturn: p.revenue.savingsTotal + p.revenue.revenueTotal,
  }));
  const cumData = yearSummary.reduce((acc, y, i) => {
    const prev = i > 0 ? acc[i - 1] : { cumInvest: 0, cumReturn: 0 };
    acc.push({
      ...y,
      cumInvest: prev.cumInvest + y.totalInvest,
      cumReturn: prev.cumReturn + y.totalReturn,
    });
    return acc;
  }, []);

  return (
    <div className="space-y-5">
      {/* ═══════════ 1. 部门概览 ═══════════ */}
      <div className="bg-gradient-to-br from-orange-50/50 to-red-50/30 rounded-2xl border border-orange-100/60 p-6">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-base font-bold text-gray-900">🗺️ {deptOverview.name}</h3>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-medium">五年规划 2026-2030</span>
        </div>
        <div className="space-y-2 text-[13px] text-gray-600 leading-relaxed">
          <div><span className="text-gray-400 font-medium">🎯 使命：</span>{deptOverview.mission}</div>
          <div><span className="text-gray-400 font-medium">🌟 愿景：</span>{deptOverview.vision}</div>
        </div>
      </div>

      {/* ═══════════ 2. 业务目标与半年产出节点（核心！从业务价值出发） ═══════════ */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="text-base font-semibold text-gray-800 mb-2">🎯 业务目标与半年产出节点</h3>
        <p className="text-[11px] text-gray-400 mb-4 leading-relaxed">
          💡 <strong>核心逻辑</strong>：从业务价值出发，每半年一个可交付产出（Milestone），每个产出对应明确的业务成果和收入/节省。
          先定义"做什么能产生价值"，再反推"需要多少工作量"，最后推导"需要多少人"。
          <strong>这是整个战略规划的起点，不是人力配置。</strong>
        </p>
        {bizMilestones.map((biz, bi) => (
          <div key={biz.line} className="mb-5 last:mb-0">
            <div className="flex items-center gap-2 mb-2 cursor-pointer" onClick={() => setExpandedMilestone(expandedMilestone === bi ? null : bi)}>
              <span className="text-sm font-bold" style={{ color: biz.color }}>{biz.line}</span>
              <span className="text-[11px] text-gray-500 flex-1">{biz.bizValue}</span>
              <span className="text-[10px] text-gray-400">{expandedMilestone === bi ? '▼ 收起' : '▶ 展开 10 个半年节点'}</span>
            </div>
            {expandedMilestone === bi && (
              <div className="overflow-x-auto">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="text-left text-gray-400 border-b border-gray-100">
                      <th className="py-1.5 pr-2 font-medium w-20">时间</th>
                      <th className="py-1.5 pr-2 font-medium">可交付产出</th>
                      <th className="py-1.5 pr-2 font-medium">业务成果</th>
                      <th className="py-1.5 pr-2 font-medium text-right">收入/节省</th>
                    </tr>
                  </thead>
                  <tbody>
                    {biz.milestones.map((m, mi) => (
                      <tr key={m.id} className={`${mi % 2 === 0 ? 'bg-gray-50/40' : ''} ${mi % 2 === 0 && mi > 0 ? 'border-t border-gray-100' : ''}`}>
                        <td className="py-1.5 pr-2 font-mono text-gray-600 whitespace-nowrap">{m.half}</td>
                        <td className="py-1.5 pr-2 font-medium text-gray-700">{m.deliverable}</td>
                        <td className="py-1.5 pr-2 text-gray-500">{m.bizOutcome}</td>
                        <td className="py-1.5 text-right font-mono text-green-600 whitespace-nowrap">{m.revenue}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {expandedMilestone !== bi && (
              <div className="flex gap-2 flex-wrap">
                {biz.milestones.filter((_, i) => i % 2 === 1).map(m => (
                  <span key={m.id} className="text-[10px] px-2 py-1 rounded-lg border" style={{ borderColor: biz.color + '33', color: biz.color }}>
                    {m.half.replace('Y', '').replace('下半年', 'H2')}: {m.deliverable.substring(0, 20)}...
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ═══════════ 4.5 甘特图：业务成果 + 招聘节奏 ═══════════ */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="text-base font-semibold text-gray-800 mb-2">📊 甘特图：业务成果 × 招聘节奏 × 招聘投入（三轨并行）</h3>
        <p className="text-[11px] text-gray-400 mb-4 leading-relaxed">
          💡 <strong>核心逻辑</strong>：报告 5 月编制 → 6 月审批 → <strong className="text-red-500">7 月正式启动（Pipeline启动，0人到位）</strong>。前两年（2026.7~2028.6）按<strong>月度</strong>细化，后三年按半年。
          <strong>上半部分</strong>是业务成果时间线（5 条业务线的月度可交付产出），<strong>中间</strong>是招聘计划（9 个部门的月度招聘人数），<strong>下半部分</strong>是招聘投入成本。
          三条线必须对齐：<strong>先启动Pipeline → 人逐步到位 → 交付成果</strong>。银行招聘流程最快6-8周。
        </p>

        {/* 时间轴表头 */}
        <div className="overflow-x-auto">
          <div className="min-w-[1200px]">
            {/* 年份标题 */}
            <div className="flex items-center mb-1">
              <div className="w-[120px] shrink-0" />
              {ganttYearHeaders.map((yh, yi) => (
                <div key={yi} className="text-center text-[9px] font-mono font-bold border-r border-gray-200 last:border-r-0" style={{ flex: yh.span, color: yh.color }}>
                  {yh.label}
                </div>
              ))}
            </div>
            {/* 月/半年标题 */}
            <div className="flex items-center mb-2 border-b border-gray-200 pb-1">
              <div className="w-[120px] shrink-0 text-[10px] text-gray-400 font-medium">时间轴</div>
              {ganttTimeLabels.map((h, hi) => (
                <div key={hi} className={`flex-1 text-center text-[8px] font-mono ${hi === 0 ? 'text-red-500 font-bold' : hi < MONTHLY_COUNT ? 'text-gray-500' : 'text-gray-400'}`}>
                  {h}{hi === 0 ? '←启动' : ''}
                </div>
              ))}
            </div>

            {/* ═══ 业务成果甘特图 ═══ */}
            <div className="text-[10px] font-semibold text-gray-600 mb-1 mt-2">📌 业务成果时间线（前两年按月细化）</div>
            {ganttBizTracks.map(track => (
              <div key={track.line} className="flex items-center mb-1.5">
                <div className="w-[120px] shrink-0 text-[11px] font-semibold pr-2" style={{ color: track.color }}>{track.line}</div>
                <div className="flex-1 relative h-7">
                  {/* 背景网格 */}
                  <div className="absolute inset-0 flex">
                    {ganttTimeLabels.map((_, i) => (
                      <div key={i} className={`flex-1 ${i < MONTHLY_COUNT ? (i % 6 === 0 ? 'bg-blue-50/40' : i % 3 === 0 ? 'bg-gray-50/40' : '') : 'bg-orange-50/30'} ${i === 0 ? 'border-l-2 border-red-200' : i === MONTHLY_COUNT ? 'border-l-2 border-orange-200' : 'border-l border-gray-100'}`} />
                    ))}
                  </div>
                  {/* 甘特条 */}
                  {track.bars.map((bar, bi) => {
                    const leftPct = (bar.start / TOTAL_SLOTS) * 100;
                    const widthPct = ((bar.end - bar.start + 1) / TOTAL_SLOTS) * 100;
                    return (
                      <div key={bi} className="absolute top-1 h-5 rounded-md flex items-center px-1 overflow-hidden group"
                        style={{ left: `${leftPct}%`, width: `${widthPct}%`, background: track.color + '22', borderLeft: `3px solid ${track.color}` }}>
                        <span className="text-[7.5px] text-gray-700 truncate font-medium">{bar.label}</span>
                        <span className="hidden group-hover:block absolute -top-5 left-0 text-[8px] bg-gray-800 text-white px-1.5 py-0.5 rounded whitespace-nowrap z-10">{bar.milestone}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* 分隔线 */}
            <div className="border-t-2 border-dashed border-gray-200 my-3" />

            {/* ═══ 招聘甘特图 ═══ */}
            <div className="text-[10px] font-semibold text-gray-600 mb-1">👥 招聘节奏（前两年按月，后三年按半年）</div>
            {ganttHiringTracks.map(track => (
              <div key={track.dept} className="flex items-center mb-1.5">
                <div className="w-[120px] shrink-0 text-[10.5px] font-semibold pr-2" style={{ color: track.color }}>{track.dept}</div>
                <div className="flex-1 relative h-7">
                  {/* 背景网格 */}
                  <div className="absolute inset-0 flex">
                    {ganttTimeLabels.map((_, i) => (
                      <div key={i} className={`flex-1 ${i < MONTHLY_COUNT ? (i % 6 === 0 ? 'bg-blue-50/40' : '') : 'bg-orange-50/30'} ${i === 0 ? 'border-l-2 border-red-200' : i === MONTHLY_COUNT ? 'border-l-2 border-orange-200' : 'border-l border-gray-100'}`} />
                    ))}
                  </div>
                  {/* 招聘数字 + 条形 */}
                  <div className="absolute inset-0 flex items-center">
                    {track.hires.map((h, hi) => {
                      const maxHire = Math.max(...ganttHiringTracks.flatMap(t => t.hires));
                      const barH = Math.max(0, (Math.abs(h) / maxHire) * 20);
                      return (
                        <div key={hi} className="flex-1 flex flex-col items-center justify-center relative group">
                          {h !== 0 && (
                            <>
                              <div className="absolute bottom-0.5 rounded-sm" style={{
                                width: '70%', height: `${barH}px`,
                                background: h > 0 ? track.color + '44' : '#ef444433',
                                borderBottom: h > 0 ? `2px solid ${track.color}` : '2px solid #ef4444',
                              }} />
                              <span className={`relative text-[8px] font-mono font-bold ${h > 0 ? '' : 'text-red-500'}`} style={{ color: h > 0 ? track.color : undefined }}>
                                {h > 0 ? `+${h}` : h}
                              </span>
                            </>
                          )}
                          {h === 0 && <span className="text-[7px] text-gray-300">·</span>}
                          {/* hover 提示 */}
                          <span className="hidden group-hover:block absolute -top-5 left-1/2 -translate-x-1/2 text-[8px] bg-gray-800 text-white px-1.5 py-0.5 rounded whitespace-nowrap z-10">
                            {track.notes[hi]} (累计{track.cumulative[hi]}人)
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}

            {/* 累计人数汇总行 */}
            <div className="flex items-center mt-2 pt-2 border-t border-gray-200">
              <div className="w-[120px] shrink-0 text-[10px] font-bold text-gray-700">📊 累计总人数</div>
              <div className="flex-1 flex">
                {ganttTimeLabels.map((_, hi) => {
                  const total = ganttHiringTracks.reduce((s, t) => s + (t.cumulative[hi] || 0), 0);
                  return (
                    <div key={hi} className={`flex-1 text-center text-[8px] font-mono font-bold ${hi < MONTHLY_COUNT ? 'text-gray-700' : 'text-orange-700'}`}>
                      {total}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ═══ 招聘投入成本 ═══ */}
            <div className="border-t-2 border-dashed border-gray-200 my-3" />
            <div className="text-[10px] font-semibold text-gray-600 mb-1">💰 招聘投入成本（万元/月 | 万元/半年）</div>
            {hiringCostData.categories.map(cat => (
              <div key={cat.name} className="flex items-center mb-1.5">
                <div className="w-[120px] shrink-0 text-[10px] font-semibold pr-2" style={{ color: cat.color }}>
                  {cat.name}
                  <div className="text-[7px] text-gray-400 font-normal truncate">{cat.desc}</div>
                </div>
                <div className="flex-1 relative h-7">
                  <div className="absolute inset-0 flex">
                    {ganttTimeLabels.map((_, i) => (
                      <div key={i} className={`flex-1 ${i < MONTHLY_COUNT ? (i % 6 === 0 ? 'bg-blue-50/40' : '') : 'bg-orange-50/30'} ${i === 0 ? 'border-l-2 border-red-200' : i === MONTHLY_COUNT ? 'border-l-2 border-orange-200' : 'border-l border-gray-100'}`} />
                    ))}
                  </div>
                  <div className="absolute inset-0 flex items-center">
                    {cat.monthly.map((v, vi) => {
                      const maxVal = Math.max(...hiringCostData.categories.flatMap(c => c.monthly));
                      const barH = Math.max(0, (v / maxVal) * 18);
                      return (
                        <div key={vi} className="flex-1 flex flex-col items-center justify-center relative group">
                          {v > 0 && (
                            <>
                              <div className="absolute bottom-0.5 rounded-sm" style={{
                                width: '70%', height: `${barH}px`,
                                background: cat.color + '33',
                                borderBottom: `2px solid ${cat.color}`,
                              }} />
                              <span className="relative text-[7px] font-mono" style={{ color: cat.color }}>{v}</span>
                            </>
                          )}
                          {v === 0 && <span className="text-[7px] text-gray-300">·</span>}
                          <span className="hidden group-hover:block absolute -top-5 left-1/2 -translate-x-1/2 text-[8px] bg-gray-800 text-white px-1.5 py-0.5 rounded whitespace-nowrap z-10">
                            {cat.name} ¥{v}万
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
            {/* 招聘投入汇总行 */}
            <div className="flex items-center mt-2 pt-2 border-t border-gray-200">
              <div className="w-[120px] shrink-0 text-[10px] font-bold text-red-600">💸 月度招聘总投入</div>
              <div className="flex-1 flex">
                {ganttTimeLabels.map((_, hi) => {
                  const total = hiringCostData.categories.reduce((s, c) => s + (c.monthly[hi] || 0), 0);
                  return (
                    <div key={hi} className={`flex-1 text-center text-[7.5px] font-mono font-bold ${total > 100 ? 'text-red-600' : 'text-gray-600'}`}>
                      {total}
                    </div>
                  );
                })}
              </div>
            </div>
            {/* 招聘投入年度汇总 */}
            <div className="mt-2 p-2 rounded-lg bg-red-50/50 border border-red-100 text-[10px] text-gray-600">
              <span className="font-semibold text-red-700">📊 招聘投入年度汇总：</span>
              Y1（2026.7-2027.6）<strong>¥{hiringCostData.summary.yearTotals[0]}万</strong> |
              Y2（2027.7-2028.6）<strong>¥{hiringCostData.summary.yearTotals[1]}万</strong> |
              Y3-Y5 <strong>¥{hiringCostData.summary.yearTotals[2] + hiringCostData.summary.yearTotals[3] + hiringCostData.summary.yearTotals[4]}万</strong> |
              <strong className="text-red-700"> 五年合计 ¥{hiringCostData.summary.grandTotal}万</strong>
              <div className="mt-1 text-[9px] text-gray-400">{hiringCostData.summary.notes}</div>
            </div>
          </div>
        </div>

        {/* 招聘节奏说明 */}
        <div className="mt-4 p-3 rounded-xl bg-orange-50/40 border border-orange-100 text-[11px] text-gray-600 leading-relaxed">
          <span className="font-semibold text-orange-700">📋 招聘节奏策略（7月启动Pipeline，8月起到位）：</span>
          <div className="mt-1 space-y-1">
            <div>• <strong>2026.7（M1）</strong>：<em className="text-red-500">启动月，0人到位</em>——猎头全面启动 Pipeline、发布 JD、内部调岗审批。银行招聘流程：猎头推荐→简历筛选→3轮面试→背调→审批→入职，<strong>最快6-8周</strong></div>
            <div>• <strong>2026.8（M2）</strong>：首批核心骨干到位——提前锁定的 P8+ 算法专家 ×1、架构师 ×1、产品总监 ×1、合规专家 ×1、高级PM ×1，共 ~5 人</div>
            <div>• <strong>2026.9-10（M3-M4）</strong>：猎头 Pipeline 出结果——P7/P8 算法、工程师逐步到位，月均 5-8 人，累计 ~20 人</div>
            <div>• <strong>2026.11-12（M5-M6）</strong>：批量到位——P6 执行层补齐，月均 6-8 人，年底累计 ~34 人</div>
            <div>• <strong>2027.1-6（M7-M12）</strong>：方向扩展——Agent 框架、多模态、联邦学习方向专项招聘，月均 3-5 人，达 ~55 人</div>
            <div>• <strong>2027.7-12（M13-M18）</strong>：场景深化——推理优化、Agent 编排、可观测团队，月均 2-4 人，达 ~75 人</div>
            <div>• <strong>2028.1-6（M19-M24）</strong>：平台成熟——SRE、安全红队、数据科学家补充，月均 1-3 人，达 ~90 人</div>
            <div>• <strong>2028H2-2030（Y3-Y5）</strong>：商业化+全球化——解决方案/售前团队组建，最终达 ~230 人（另预留 buffer 至满编 260）</div>
          </div>
        </div>

        {/* 关键招聘里程碑 */}
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {[
            { time: '2026.7（M1）', action: '🔴 Pipeline 启动', detail: '猎头全面启动、JD 发布、内部调岗审批', reason: '银行招聘流程最快6-8周，7月启动→8月底首批到位', cost: '猎头费 ¥80万（预付+简历费）' },
            { time: '2026.8（M2）', action: '🟠 首批骨干到位', detail: 'P8+ 算法专家 ×1、架构师 ×1、产品总监 ×1、合规专家 ×1、PM ×1', reason: '提前锁定的核心骨干，5-6月已完成面试+背调', cost: '猎头费 ¥60万（成功入职付款）' },
            { time: '2026.9-10（M3-M4）', action: '🟡 Pipeline 出结果', detail: 'P7/P8 算法 ×3、工程师 ×5、产品 ×2、合规 ×2', reason: '猎头推荐→面试→offer 周期完成，批量入职', cost: '猎头费 ¥50-40万/月' },
            { time: '2026.11-12（M5-M6）', action: '🟢 批量补齐', detail: 'P6 算法 ×3、后端 ×4、前端 ×2、测试 ×1、标注 ×2', reason: '执行层到位，支撑 2027Q1 首批 PoC 交付', cost: '猎头费收敛至 ¥30-20万/月' },
            { time: '2027.1-6（M7-M12）', action: '🔵 方向扩展', detail: 'Agent 框架 ×4、多模态算法 ×2、联邦工程 ×2、业务分析 ×3', reason: '新方向需要专业人才，提前半年招聘', cost: '月均 ¥20万（内推为主）' },
            { time: '2029H1', action: '🟣 商业化团队', detail: '解决方案总监 ×1、架构师 ×3、技术售前 ×4、客户成功 ×3', reason: 'Y4 商业化输出需要售前+交付团队', cost: '猎头费 ¥50万（高端岗位）' },
          ].map(m => (
            <div key={m.time} className="p-2.5 rounded-lg bg-gray-50 border border-gray-100">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono font-bold text-gray-700">{m.time}</span>
                <span className="text-[10px] font-semibold">{m.action}</span>
              </div>
              <div className="text-[10.5px] text-gray-700 font-medium">{m.detail}</div>
              <div className="text-[10px] text-gray-400 mt-0.5 italic">💡 {m.reason}</div>
              <div className="text-[10px] text-red-500 mt-0.5 font-medium">💰 {m.cost}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════ 5. 五年阶段总览时间线 ═══════════ */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="text-base font-semibold text-gray-800 mb-4">📅 五年演进路线</h3>
        <div className="relative pl-6">
          <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-gradient-to-b from-[#6c5ce7] via-[#3fb950] to-[#ffa657]" />
          <div className="space-y-5">
            {phases.map(p => (
              <div key={p.year} className="relative">
                <div className="absolute -left-[22px] top-1.5 w-3 h-3 rounded-full border-2 border-white shadow-sm" style={{ background: p.color }} />
                <div className="flex items-baseline gap-3 mb-1">
                  <span className="text-xs font-mono font-bold" style={{ color: p.color }}>{p.year}</span>
                  <span className="text-sm font-semibold text-gray-800">{p.title}</span>
                </div>
                <div className="text-[12px] text-gray-500 mb-3 italic">{p.focus}</div>

                {/* Y1/Y2 用季度×业务线矩阵展开；Y3-Y5 保持高层 bullet */}
                {p.goalsDetailed ? (
                  <div className="space-y-3">
                    {p.goalsDetailed.map((q) => (
                      <div key={q.quarter} className="rounded-xl border overflow-hidden" style={{ borderColor: p.color + '33' }}>
                        {/* 季度标题栏 */}
                        <div className="flex items-center gap-2 px-3 py-2" style={{ background: p.color + '12' }}>
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: p.color }}>Q{q.quarter}</span>
                          <span className="text-[12px] font-semibold text-gray-700">{q.label}</span>
                          <span className="text-[11px] text-gray-400">{q.period}</span>
                          {q.isGate && <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">🚦 决策门</span>}
                        </div>
                        {/* 决策门说明 */}
                        {q.isGate && q.gateDesc && (
                          <div className="px-3 py-1.5 bg-amber-50/60 border-b border-amber-100 text-[10.5px] text-amber-800 leading-relaxed">
                            {q.gateDesc}
                          </div>
                        )}
                        {/* 业务线任务网格 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-gray-100">
                          {q.tracks.map((track) => (
                            <div key={track.name} className="px-3 py-2">
                              <div className="text-[10px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">{track.name}</div>
                              <ul className="space-y-1">
                                {track.tasks.map((task, ti) => (
                                  <li key={ti} className={`flex gap-1.5 text-[11.5px] leading-snug ${task.startsWith('【🚦') ? 'font-semibold text-amber-700' : 'text-gray-600'}`}>
                                    <span className="mt-0.5 shrink-0" style={{ color: task.startsWith('【🚦') ? '#d97706' : p.color }}>
                                      {task.startsWith('【🚦') ? '🚦' : '▸'}
                                    </span>
                                    <span>{task.replace('【🚦 3月决策门】', '').replace('【🚦 12月决策门】', '')}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {p.goals.map((g, i) => (
                      <div key={i} className="flex gap-2 text-[12px] text-gray-600">
                        <span style={{ color: p.color }}>▸</span><span>{g}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-3 text-[11px] font-mono px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-100">
                  <span className="text-gray-400">KPI：</span><span className="text-gray-700">{p.kpi}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════ 3. 人力成本汇总（数据来源：甘特图招聘节奏） ═══════════ */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="text-base font-semibold text-gray-800 mb-2">👥 人力成本汇总（基于甘特图招聘节奏推导）</h3>
        <p className="text-[11px] text-gray-400 mb-4 leading-relaxed">
          💡 <strong>数据来源</strong>：人力成本直接由上方甘特图「招聘节奏」推导——<strong>先有招聘到位时间，再算人力成本</strong>。
          实际节奏：7月启动猎头 Pipeline（0人到位）→ 8月首批核心骨干到位（~5人）→ 9-10月 Pipeline 出结果 → Q4 批量到位 → 年底 ~34 人。
          <strong>人均年包参考</strong>：P8+ 专家 250-350 万、P7 算法/工程 150-200 万、P6 初级 80-120 万、外包 25 万。
          <strong>年度人力成本 = Σ（各月实际在岗人数 × 人均月薪）</strong>，非全年满编计算。
        </p>
        {/* 年度人力成本表格 */}
        <div className="overflow-x-auto">
          <table className="w-full text-[11.5px]">
            <thead>
              <tr className="text-left text-gray-400 border-b border-gray-200">
                <th className="py-2 pr-3 font-medium">年度</th>
                <th className="py-2 pr-3 font-medium text-center">年末在岗人数</th>
                <th className="py-2 pr-3 font-medium text-right">人力总成本（万元）</th>
                <th className="py-2 pr-3 font-medium">说明</th>
              </tr>
            </thead>
            <tbody>
              {phases.map((p, pi) => (
                <tr key={p.year} className={pi % 2 === 0 ? 'bg-gray-50/40' : ''}>
                  <td className="py-2 pr-3 font-semibold" style={{ color: p.color }}>{p.year} {p.title}</td>
                  <td className="py-2 pr-3 text-center font-mono font-semibold text-gray-800">{p.headcount.total} 人</td>
                  <td className="py-2 pr-3 text-right font-mono font-bold text-gray-900">¥{p.headcount.salaryTotal.toLocaleString()}</td>
                  <td className="py-2 pr-3 text-[10px] text-gray-500">{p.headcount.salaryNote}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-gray-300 bg-gray-50">
                <td className="py-2 pr-3 font-bold text-gray-800">五年合计</td>
                <td className="py-2 pr-3 text-center font-mono font-bold text-gray-800">230 人（另预留 buffer 至 260）</td>
                <td className="py-2 pr-3 text-right font-mono font-bold text-red-700">¥{phases.reduce((s, p) => s + p.headcount.salaryTotal, 0).toLocaleString()}</td>
                <td className="py-2 pr-3 text-[10px] text-gray-500">约 ¥{(phases.reduce((s, p) => s + p.headcount.salaryTotal, 0) / 10000).toFixed(1)} 亿</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="mt-3 p-2.5 rounded-lg bg-amber-50/50 border border-amber-100 text-[10px] text-gray-600">
          <span className="font-semibold text-amber-700">⚠️ 关键假设：</span>
          人力成本按<strong>实际到岗月份</strong>起算（非全年满编）。Y1 因 7 月启动、首批骨干 8-9 月到位，实际在岗月数仅 4-6 个月，故人力成本远低于满编全年计算值。
          详细的月度招聘到位时间请参见上方<strong>「甘特图：招聘节奏」</strong>部分。
        </div>
      </div>

      {/* ═══════════ 4. 硬件 & 基础设施预算精细拆解 ═══════════ */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="text-base font-semibold text-gray-800 mb-2">🖥️ 硬件 & 基础设施预算精细拆解（万元）</h3>
        <p className="text-[11px] text-gray-400 mb-4 leading-relaxed">
          💡 <strong>基础设施预算构成</strong>：GPU 训练/推理集群（占 50-60%）+ 存储系统（8-10%）+ 网络/机房/电力（15-20%）+ 隐私计算（8-12%）+ 灾备/安全/平台软件（10-15%）。
          GPU 采购按当年市场价估算，含 3 年质保。机房按自建 IDC + 部分混合云模式。
        </p>
        {phases.map((p, pi) => (
          <div key={p.year} className="mb-4 last:mb-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-mono font-bold" style={{ color: p.color }}>{p.year} {p.title}</span>
              <span className="text-[11px] text-gray-500">| 基础设施总预算 ¥{p.infra.total.toLocaleString()} 万</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[11.5px]">
                <thead>
                  <tr className="text-left text-gray-400 border-b border-gray-100">
                    <th className="py-1.5 pr-2 font-medium">项目</th>
                    <th className="py-1.5 pr-2 font-medium">规格 / 配置</th>
                    <th className="py-1.5 pr-2 font-medium text-right">预算（万元）</th>
                    <th className="py-1.5 pr-2 font-medium text-right">占比</th>
                    <th className="py-1.5 font-medium">说明</th>
                  </tr>
                </thead>
                <tbody>
                  {p.infra.breakdown.map((item, ii) => (
                    <tr key={item.item} className={ii % 2 === 0 ? 'bg-gray-50/40' : ''}>
                      <td className="py-1.5 pr-2 font-medium text-gray-700 whitespace-nowrap">{item.item}</td>
                      <td className="py-1.5 pr-2 text-gray-500 text-[10.5px]">{item.spec}</td>
                      <td className="py-1.5 pr-2 text-right text-gray-800 font-mono font-semibold">¥{item.cost.toLocaleString()}</td>
                      <td className="py-1.5 pr-2 text-right text-gray-500 font-mono">{((item.cost / p.infra.total) * 100).toFixed(1)}%</td>
                      <td className="py-1.5 text-[10px] text-gray-400">{item.note}</td>
                    </tr>
                  ))}
                  <tr className="border-t border-gray-200 bg-gray-50">
                    <td className="py-1.5 pr-2 font-bold text-gray-800">合计</td>
                    <td></td>
                    <td className="py-1.5 pr-2 text-right font-bold text-gray-900 font-mono">¥{p.infra.total.toLocaleString()}</td>
                    <td className="py-1.5 pr-2 text-right font-bold text-gray-700 font-mono">100%</td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ))}
        {/* 五年硬件成本汇总 */}
        <div className="mt-4 p-3 rounded-xl bg-blue-50/40 border border-blue-100 text-[12px]">
          <span className="font-semibold text-blue-700">📊 五年基础设施汇总：</span>
          <span className="text-gray-600 ml-1">
            ¥{phases.map(p => p.infra.total.toLocaleString()).join(' → ¥')} 万，
            五年合计 <span className="font-bold text-gray-800">¥{phases.reduce((s, p) => s + p.infra.total, 0).toLocaleString()} 万</span>
            （约 ¥{(phases.reduce((s, p) => s + p.infra.total, 0) / 10000).toFixed(1)} 亿）。
            其中 GPU 集群占比约 55%，是最大单项支出。
          </span>
        </div>
      </div>

      {/* ═══════════ 4.5 模型策略选型分析 ═══════════ */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="text-base font-semibold text-gray-800 mb-2">🧠 大模型策略选型：开源微调 vs 商用本地部署 vs RAG 增强</h3>
        <p className="text-[11px] text-gray-400 mb-4">
          银行场景下大模型落地不是单选题——不同业务场景适用不同技术路线，需要组合使用。以下从成本、效果、合规、可控性四个维度对比三条主路线。
        </p>

        {/* 三条路线对比表 */}
        <div className="overflow-x-auto mb-4">
          <table className="w-full text-[11px] border-collapse">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-500">
                <th className="py-2 px-2 font-medium border-b border-gray-100">维度</th>
                <th className="py-2 px-2 font-medium border-b border-gray-100">🔓 开源模型 + 行内微调</th>
                <th className="py-2 px-2 font-medium border-b border-gray-100">🏢 商用模型本地私有化部署</th>
                <th className="py-2 px-2 font-medium border-b border-gray-100">📚 RAG 增强（检索增强生成）</th>
              </tr>
            </thead>
            <tbody className="text-gray-700">
              <tr className="border-b border-gray-50">
                <td className="py-2 px-2 font-medium text-gray-600">代表方案</td>
                <td className="py-2 px-2">Qwen2.5-72B / DeepSeek-V3 / Llama3.1-70B<br/>+ LoRA/QLoRA 行业微调</td>
                <td className="py-2 px-2">文心一言企业版 / 通义千问私有化 / GLM-4 企业版<br/>+ 厂商驻场支持</td>
                <td className="py-2 px-2">任意基座模型 + 向量数据库（Milvus/ES）<br/>+ 知识库检索 + Prompt 工程</td>
              </tr>
              <tr className="border-b border-gray-50">
                <td className="py-2 px-2 font-medium text-gray-600">首年成本</td>
                <td className="py-2 px-2"><span className="text-green-600 font-semibold">¥0 授权费</span><br/>但需 GPU 算力 + 算法团队（人力成本高）</td>
                <td className="py-2 px-2"><span className="text-orange-600 font-semibold">¥200-500 万/年</span><br/>授权费 + 部署费 + 年度升级费</td>
                <td className="py-2 px-2"><span className="text-green-600 font-semibold">¥50-100 万</span><br/>向量数据库 + 知识库工程（可复用基座）</td>
              </tr>
              <tr className="border-b border-gray-50">
                <td className="py-2 px-2 font-medium text-gray-600">效果上限</td>
                <td className="py-2 px-2"><span className="font-semibold text-blue-600">最高</span>：可针对银行数据深度优化<br/>风控/合规等垂直场景效果最好</td>
                <td className="py-2 px-2"><span className="font-semibold text-blue-600">较高</span>：通用能力强，开箱即用<br/>但行业深度不如自研微调</td>
                <td className="py-2 px-2"><span className="font-semibold text-yellow-600">中等</span>：解决幻觉问题，保证事实准确<br/>但推理/决策能力受限于基座</td>
              </tr>
              <tr className="border-b border-gray-50">
                <td className="py-2 px-2 font-medium text-gray-600">数据安全</td>
                <td className="py-2 px-2"><span className="text-green-600">✅ 最优</span>：数据全程不出行内<br/>模型权重完全自主可控</td>
                <td className="py-2 px-2"><span className="text-green-600">✅ 可控</span>：私有化部署数据不出境<br/>⚠️ 但模型权重归厂商，升级依赖厂商</td>
                <td className="py-2 px-2"><span className="text-green-600">✅ 可控</span>：知识库在行内<br/>基座模型可选开源/商用</td>
              </tr>
              <tr className="border-b border-gray-50">
                <td className="py-2 px-2 font-medium text-gray-600">团队要求</td>
                <td className="py-2 px-2"><span className="text-red-500">高</span>：需要 P7+ 算法专家<br/>具备预训练/微调/对齐全栈能力</td>
                <td className="py-2 px-2"><span className="text-green-600">低</span>：厂商提供技术支持<br/>行内只需应用层开发</td>
                <td className="py-2 px-2"><span className="text-yellow-600">中</span>：需要工程能力<br/>Prompt 工程 + 检索优化 + 评测</td>
              </tr>
              <tr className="border-b border-gray-50">
                <td className="py-2 px-2 font-medium text-gray-600">迭代速度</td>
                <td className="py-2 px-2"><span className="text-yellow-600">慢</span>：微调一轮 2-4 周<br/>数据标注 + 训练 + 评测 + 上线</td>
                <td className="py-2 px-2"><span className="text-green-600">快</span>：厂商季度升级<br/>但定制化需求响应慢</td>
                <td className="py-2 px-2"><span className="text-green-600">最快</span>：知识库更新即时生效<br/>无需重新训练模型</td>
              </tr>
              <tr className="border-b border-gray-50">
                <td className="py-2 px-2 font-medium text-gray-600">长期风险</td>
                <td className="py-2 px-2">开源社区方向变化 / 许可证变更<br/>但核心能力在自己手里</td>
                <td className="py-2 px-2"><span className="text-red-500">厂商锁定</span>：升级节奏受制于人<br/>商务谈判筹码逐年减弱</td>
                <td className="py-2 px-2">基座模型可随时切换<br/>知识库资产长期有效</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 推荐策略 */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 mb-4">
          <h4 className="text-sm font-semibold text-gray-800 mb-2">📋 推荐策略：分场景组合，渐进式演进</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
            <div className="bg-white/70 rounded-lg p-3">
              <div className="font-semibold text-gray-700 mb-1">🚀 Y1 快速启动期（2026.7-2027.6）</div>
              <ul className="space-y-1 text-gray-600">
                <li>• <span className="font-medium text-blue-700">商用私有化</span>作为基座（快速可用，团队还没完全到位）</li>
                <li>• <span className="font-medium text-green-700">RAG 优先</span>落地客服/合规（最快见效，不依赖微调）</li>
                <li>• <span className="font-medium text-purple-700">开源模型评估</span>同步进行（Qwen2.5/DeepSeek 对比测试）</li>
                <li>• 风控场景用<span className="font-medium">传统 ML + 图网络</span>，暂不依赖 LLM</li>
              </ul>
            </div>
            <div className="bg-white/70 rounded-lg p-3">
              <div className="font-semibold text-gray-700 mb-1">⚡ Y2 自主可控期（2027.7-2028.6）</div>
              <ul className="space-y-1 text-gray-600">
                <li>• <span className="font-medium text-purple-700">开源微调</span>逐步替代商用基座（团队成熟，数据积累够）</li>
                <li>• 风控/理财等高价值场景<span className="font-medium">LoRA 垂直微调</span></li>
                <li>• 商用模型降级为<span className="font-medium">备选/对比基线</span>（不续高价授权）</li>
                <li>• RAG 升级为<span className="font-medium">多模态 RAG + Agent 工具调用</span></li>
              </ul>
            </div>
            <div className="bg-white/70 rounded-lg p-3">
              <div className="font-semibold text-gray-700 mb-1">🏛️ Y3+ 完全自主期（2028+）</div>
              <ul className="space-y-1 text-gray-600">
                <li>• <span className="font-medium text-purple-700">开源微调模型</span>为主力（70B 全量 + 7B 蒸馏推理）</li>
                <li>• 商用模型仅保留<span className="font-medium">特定能力补充</span>（如多模态/代码生成）</li>
                <li>• 自研 Agent 框架 + 自研评测体系</li>
                <li>• 联邦 LoRA 实现跨机构能力共享</li>
              </ul>
            </div>
            <div className="bg-white/70 rounded-lg p-3">
              <div className="font-semibold text-gray-700 mb-1">💡 核心原则</div>
              <ul className="space-y-1 text-gray-600">
                <li>• <span className="font-medium text-red-600">绝不把核心能力绑定在单一厂商</span></li>
                <li>• 商用模型是<span className="font-medium">过渡手段</span>，不是终局方案</li>
                <li>• RAG 是<span className="font-medium">所有场景的标配底座</span>（解决幻觉+时效性）</li>
                <li>• 微调是<span className="font-medium">高价值场景的护城河</span>（风控/理财）</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 各场景适用路线 */}
        <div className="mb-3">
          <h4 className="text-xs font-semibold text-gray-700 mb-2">🎯 各业务场景推荐技术路线</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
            {[
              { scene: '💬 智能客服', y1: '商用基座 + RAG（快速上线）', y2: '开源微调 + 多模态 RAG', reason: '客服对时效性要求高，RAG 可即时更新知识库；Y2 团队成熟后切换开源降低成本' },
              { scene: '🛡️ 风控反欺诈', y1: '传统 ML + 图网络（不依赖 LLM）', y2: '开源 LLM 微调 + 图网络融合', reason: '风控对准确率要求极高，Y1 用成熟的 ML 方案；Y2 数据积累够后再引入 LLM 增强' },
              { scene: '💰 理财投研', y1: '商用基座 + RAG（研报摘要）', y2: '开源微调（金融语料）+ Agent', reason: '投研需要强推理能力，Y1 用商用模型快速验证；Y2 用金融语料微调提升专业度' },
              { scene: '📜 合规审查', y1: 'RAG 为主（法规知识库检索）', y2: '开源微调（合规语料）+ RAG', reason: '合规场景事实准确性第一，RAG 天然适合；Y2 微调提升法律推理能力' },
              { scene: '🏗️ AI 平台', y1: '商用 + 开源双轨部署', y2: '开源为主 + 商用备选', reason: '平台层需要支持多模型切换，Y1 验证两条路线，Y2 根据效果收敛' },
            ].map(s => (
              <div key={s.scene} className="bg-gray-50 rounded-lg p-2.5 border border-gray-100">
                <div className="font-semibold text-gray-700 mb-1">{s.scene}</div>
                <div className="text-gray-600">
                  <span className="text-blue-600 font-medium">Y1：</span>{s.y1}<br/>
                  <span className="text-green-600 font-medium">Y2+：</span>{s.y2}
                </div>
                <div className="text-[10px] text-gray-400 mt-1 italic">💡 {s.reason}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 成本演进 */}
        <div className="bg-amber-50 rounded-xl p-3 text-[11px]">
          <span className="font-semibold text-amber-800">💰 模型成本演进逻辑：</span>
          <span className="text-amber-700 ml-1">
            Y1 商用授权 ¥200 万（快速启动）→ Y2 降至 ¥150 万（开源替代部分场景）→ Y3+ 降至 ¥100 万（仅保留特定能力补充）。
            五年商用模型总投入约 ¥750 万，但换来的是：① Y1 不等人，快速出成果；② 为开源微调提供对比基线；③ 避免厂商锁定风险。
            真正的长期投入在 GPU 算力（支撑开源微调）和人才（算法团队）上。
          </span>
        </div>
      </div>

      {/* ═══════════ 5. 外部采购明细 ═══════════ */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="text-base font-semibold text-gray-800 mb-2">🤝 外部采购明细（万元）</h3>
        <p className="text-[11px] text-gray-400 mb-4">
          外部采购 = 商用模型私有化授权（过渡期）+ 隐私计算平台 + 外部数据源 + 咨询审计 + 培训认证。
          注：商用模型为 Y1 快速启动的过渡手段，Y2 起逐步被开源微调替代（详见上方选型分析）。
        </p>
        {phases.map((p, pi) => (
          <div key={p.year} className="mb-3 last:mb-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono font-bold" style={{ color: p.color }}>{p.year}</span>
              <span className="text-[11px] text-gray-500">| 外部采购 ¥{p.vendor.total.toLocaleString()} 万</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {p.vendor.breakdown.map(v => (
                <div key={v.item} className="px-2.5 py-1.5 rounded-lg bg-gray-50 border border-gray-100 text-[11px]">
                  <span className="font-medium text-gray-700">{v.item}</span>
                  <span className="font-mono text-gray-800 font-semibold ml-1">¥{v.cost.toLocaleString()}</span>
                  <div className="text-[10px] text-gray-400 mt-0.5">{v.note}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ═══════════ 6. 年度投入总览 ═══════════ */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 overflow-x-auto">
        <h3 className="text-base font-semibold text-gray-800 mb-3">💰 年度投入总览（万元）</h3>
        <table className="w-full text-[12px]">
          <thead>
            <tr className="text-left text-gray-400 border-b border-gray-100">
              <th className="py-2 pr-3 font-medium">阶段</th>
              <th className="py-2 pr-3 font-medium text-right">👥 人力成本</th>
              <th className="py-2 pr-3 font-medium text-right">🖥️ 基础设施</th>
              <th className="py-2 pr-3 font-medium text-right">🤝 外部采购</th>
              <th className="py-2 pr-3 font-medium text-right">📊 年度总投入</th>
              <th className="py-2 font-medium text-right">占比分布</th>
            </tr>
          </thead>
          <tbody>
            {phases.map((p, i) => {
              const total = p.headcount.salaryTotal + p.infra.total + p.vendor.total;
              return (
                <tr key={p.year} className={i % 2 === 0 ? 'bg-gray-50/40' : ''}>
                  <td className="py-2 pr-3 font-semibold" style={{ color: p.color }}>{p.year} {p.title}</td>
                  <td className="py-2 pr-3 text-right text-gray-600 font-mono">¥{p.headcount.salaryTotal.toLocaleString()}</td>
                  <td className="py-2 pr-3 text-right text-gray-600 font-mono">¥{p.infra.total.toLocaleString()}</td>
                  <td className="py-2 pr-3 text-right text-gray-600 font-mono">¥{p.vendor.total.toLocaleString()}</td>
                  <td className="py-2 pr-3 text-right text-gray-800 font-mono font-bold">¥{total.toLocaleString()}</td>
                  <td className="py-2 text-right text-[10px] text-gray-400">
                    人力 {((p.headcount.salaryTotal / total) * 100).toFixed(0)}% · 硬件 {((p.infra.total / total) * 100).toFixed(0)}% · 采购 {((p.vendor.total / total) * 100).toFixed(0)}%
                  </td>
                </tr>
              );
            })}
            <tr className="border-t-2 border-gray-200 bg-gray-50">
              <td className="py-2 pr-3 font-bold text-gray-800">五年合计</td>
              <td className="py-2 pr-3 text-right text-gray-700 font-mono font-semibold">¥{phases.reduce((s, p) => s + p.headcount.salaryTotal, 0).toLocaleString()}</td>
              <td className="py-2 pr-3 text-right text-gray-700 font-mono font-semibold">¥{phases.reduce((s, p) => s + p.infra.total, 0).toLocaleString()}</td>
              <td className="py-2 pr-3 text-right text-gray-700 font-mono font-semibold">¥{phases.reduce((s, p) => s + p.vendor.total, 0).toLocaleString()}</td>
              <td className="py-2 pr-3 text-right text-gray-900 font-mono font-bold">¥{cumData[4].cumInvest.toLocaleString()}</td>
              <td className="py-2 text-right text-[10px] text-gray-500 font-semibold">
                约 ¥{(cumData[4].cumInvest / 10000).toFixed(1)} 亿
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ═══════════ 7. 营收 & 节省成本精细拆解 ═══════════ */}
      <div className="bg-white rounded-2xl border border-green-100 p-5">
        <h3 className="text-base font-semibold text-green-700 mb-2">📈 营收 & 节省成本精细拆解（万元）</h3>
        <div className="p-3 rounded-xl bg-green-50/40 border border-green-100 text-[12px] text-gray-600 leading-relaxed mb-4">
          <span className="font-semibold text-green-700">📐 营收定义与计算口径：</span>
          <div className="mt-1 space-y-1 text-[11px]">
            <div>① <strong>节省成本（Cost Savings）</strong>= AI 替代人工的等效薪资节省 + 业务损失降低金额 + 场地/设备节省。计算方式：替代人数 × 人均年成本，或损失率降幅 × 业务规模 × 保守系数。</div>
            <div>② <strong>增量营收（Incremental Revenue）</strong>= AI 产品/服务直接产生的新增收入。包括：理财 AUM 佣金增量、联邦风控服务费、集团内部技术输出结算、SaaS 平台订阅收入、行业解决方案项目收入。</div>
            <div>③ <strong>置信度标注</strong>：高 = 已有行业 benchmark 或内部试点数据支撑；中 = 基于同业案例推算；低 = 探索性估算。</div>
          </div>
        </div>

        {phases.map((p, pi) => (
          <div key={p.year} className="mb-5 last:mb-0">
            <div className="flex items-center gap-2 mb-2 cursor-pointer" onClick={() => setExpandedRevenue(expandedRevenue === pi ? null : pi)}>
              <span className="text-xs font-mono font-bold" style={{ color: p.color }}>{p.year} {p.title}</span>
              <span className="text-[11px] text-gray-500">
                | 节省 <span className="text-green-600 font-semibold">¥{p.revenue.savingsTotal.toLocaleString()}</span>
                + 营收 <span className="text-blue-600 font-semibold">¥{p.revenue.revenueTotal.toLocaleString()}</span>
                = 总回报 <span className="text-gray-800 font-bold">¥{(p.revenue.savingsTotal + p.revenue.revenueTotal).toLocaleString()}</span>
              </span>
              <span className="text-[10px] text-gray-400 ml-auto">{expandedRevenue === pi ? '▼ 收起' : '▶ 展开明细'}</span>
            </div>

            {expandedRevenue === pi && (
              <div className="space-y-3">
                {/* 节省成本明细 */}
                <div>
                  <div className="text-[11px] font-semibold text-green-700 mb-1">💚 节省成本明细（¥{p.revenue.savingsTotal.toLocaleString()} 万）</div>
                  <table className="w-full text-[11px]">
                    <thead>
                      <tr className="text-left text-gray-400 border-b border-gray-100">
                        <th className="py-1 pr-2 font-medium">来源</th>
                        <th className="py-1 pr-2 font-medium text-right">金额（万元）</th>
                        <th className="py-1 pr-2 font-medium">计算逻辑</th>
                        <th className="py-1 font-medium text-center">置信度</th>
                      </tr>
                    </thead>
                    <tbody>
                      {p.revenue.savingsBreakdown.map((s, si) => (
                        <tr key={s.source} className={si % 2 === 0 ? 'bg-green-50/30' : ''}>
                          <td className="py-1 pr-2 font-medium text-gray-700 whitespace-nowrap">{s.source}</td>
                          <td className="py-1 pr-2 text-right text-green-700 font-mono font-semibold">+¥{s.amount.toLocaleString()}</td>
                          <td className="py-1 pr-2 text-[10px] text-gray-500">{s.calc}</td>
                          <td className="py-1 text-center">
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${s.confidence === '高' ? 'bg-green-100 text-green-700' : s.confidence === '中' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'}`}>{s.confidence}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* 增量营收明细 */}
                <div>
                  <div className="text-[11px] font-semibold text-blue-700 mb-1">💙 增量营收明细（¥{p.revenue.revenueTotal.toLocaleString()} 万）</div>
                  <table className="w-full text-[11px]">
                    <thead>
                      <tr className="text-left text-gray-400 border-b border-gray-100">
                        <th className="py-1 pr-2 font-medium">来源</th>
                        <th className="py-1 pr-2 font-medium text-right">金额（万元）</th>
                        <th className="py-1 pr-2 font-medium">计算逻辑</th>
                        <th className="py-1 font-medium text-center">置信度</th>
                      </tr>
                    </thead>
                    <tbody>
                      {p.revenue.revenueBreakdown.map((r, ri) => (
                        <tr key={r.source} className={ri % 2 === 0 ? 'bg-blue-50/30' : ''}>
                          <td className="py-1 pr-2 font-medium text-gray-700 whitespace-nowrap">{r.source}</td>
                          <td className="py-1 pr-2 text-right text-blue-700 font-mono font-semibold">+¥{r.amount.toLocaleString()}</td>
                          <td className="py-1 pr-2 text-[10px] text-gray-500">{r.calc}</td>
                          <td className="py-1 text-center">
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${r.confidence === '高' ? 'bg-green-100 text-green-700' : r.confidence === '中' ? 'bg-yellow-100 text-yellow-700' : r.confidence === '低' ? 'bg-red-50 text-red-500' : 'bg-gray-100 text-gray-500'}`}>{r.confidence}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 简略行（未展开时） */}
            {expandedRevenue !== pi && (
              <div className="flex gap-2 text-[11px] flex-wrap">
                {p.revenue.savingsBreakdown.map(s => (
                  <span key={s.source} className="px-2 py-0.5 rounded bg-green-50 border border-green-100 text-green-700">
                    {s.source} <span className="font-mono font-semibold">+¥{s.amount.toLocaleString()}</span>
                  </span>
                ))}
                {p.revenue.revenueBreakdown.map(r => (
                  <span key={r.source} className="px-2 py-0.5 rounded bg-blue-50 border border-blue-100 text-blue-700">
                    {r.source} <span className="font-mono font-semibold">+¥{r.amount.toLocaleString()}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ═══════════ 8. ROI 测算总表 ═══════════ */}
      <div className="bg-white rounded-2xl border border-amber-100 p-5 overflow-x-auto">
        <h3 className="text-base font-semibold text-amber-700 mb-3">📊 ROI 测算总表（万元）</h3>
        <table className="w-full text-[12px]">
          <thead>
            <tr className="text-left text-gray-400 border-b border-gray-100">
              <th className="py-2 pr-2 font-medium">年度</th>
              <th className="py-2 pr-2 font-medium text-right">年度投入</th>
              <th className="py-2 pr-2 font-medium text-right">节省成本</th>
              <th className="py-2 pr-2 font-medium text-right">增量营收</th>
              <th className="py-2 pr-2 font-medium text-right">年度回报</th>
              <th className="py-2 pr-2 font-medium text-right">年度 ROI</th>
              <th className="py-2 pr-2 font-medium text-right">累计投入</th>
              <th className="py-2 pr-2 font-medium text-right">累计回报</th>
              <th className="py-2 font-medium text-right">累计 ROI</th>
            </tr>
          </thead>
          <tbody>
            {cumData.map((d, i) => {
              const yearRoi = ((d.totalReturn - d.totalInvest) / d.totalInvest * 100).toFixed(0);
              const cumRoiRaw = (d.cumReturn - d.cumInvest) / d.cumInvest * 100;
              const cumRoi = Math.abs(cumRoiRaw) < 1 ? '≈0' : cumRoiRaw.toFixed(0);
              const cumRoiIsPos = cumRoiRaw >= 0;
              return (
                <tr key={d.year} className={i % 2 === 0 ? 'bg-gray-50/40' : ''}>
                  <td className="py-2 pr-2 font-semibold" style={{ color: d.color }}>{d.year} {d.title}</td>
                  <td className="py-2 pr-2 text-right text-gray-600 font-mono">¥{d.totalInvest.toLocaleString()}</td>
                  <td className="py-2 pr-2 text-right text-green-600 font-mono">+¥{d.savings.toLocaleString()}</td>
                  <td className="py-2 pr-2 text-right text-blue-600 font-mono">+¥{d.revenue.toLocaleString()}</td>
                  <td className="py-2 pr-2 text-right text-gray-800 font-mono font-semibold">¥{d.totalReturn.toLocaleString()}</td>
                  <td className={`py-2 pr-2 text-right font-mono font-bold ${Number(yearRoi) >= 0 ? 'text-green-600' : 'text-red-500'}`}>{Number(yearRoi) >= 0 ? '+' : ''}{yearRoi}%</td>
                  <td className="py-2 pr-2 text-right text-gray-600 font-mono">¥{d.cumInvest.toLocaleString()}</td>
                  <td className="py-2 pr-2 text-right text-gray-700 font-mono">¥{d.cumReturn.toLocaleString()}</td>
                  <td className={`py-2 text-right font-mono font-bold ${cumRoiIsPos ? 'text-green-600' : 'text-red-500'}`}>{cumRoiIsPos && cumRoi !== '≈0' ? '+' : ''}{cumRoi}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* ROI 可视化条形图 */}
        <div className="mt-4 space-y-2">
          <div className="text-[11px] text-gray-400 font-medium">累计投入 vs 累计回报</div>
          {cumData.map((d, i) => {
            const maxVal = cumData[4].cumReturn;
            return (
              <div key={d.year} className="flex items-center gap-3">
                <span className="w-8 text-[11px] font-mono font-semibold" style={{ color: d.color }}>{d.year}</span>
                <div className="flex-1 space-y-0.5">
                  <div className="h-3 rounded-sm bg-red-200/80" style={{ width: `${(d.cumInvest / maxVal) * 100}%`, minWidth: '4px' }} />
                  <div className="h-3 rounded-sm bg-green-300/80" style={{ width: `${(d.cumReturn / maxVal) * 100}%`, minWidth: '4px' }} />
                </div>
                <span className="text-[10px] text-gray-400 w-40 text-right whitespace-nowrap">
                  投 ¥{(d.cumInvest / 10000).toFixed(1)}亿 / 回 ¥{(d.cumReturn / 10000).toFixed(1)}亿
                </span>
              </div>
            );
          })}
          <div className="flex gap-4 text-[10px] text-gray-400 mt-1">
            <span className="flex items-center gap-1"><span className="w-3 h-2 rounded-sm bg-red-200 inline-block" /> 累计投入</span>
            <span className="flex items-center gap-1"><span className="w-3 h-2 rounded-sm bg-green-300 inline-block" /> 累计回报（节省+营收）</span>
          </div>
        </div>

        <div className="mt-4 p-3 rounded-xl bg-green-50/60 border border-green-100 text-[12px] text-gray-600 leading-relaxed">
          <span className="font-semibold text-green-700">💡 关键结论：</span>
          五年累计投入约 <span className="font-bold text-gray-800">¥{(cumData[4].cumInvest / 10000).toFixed(1)} 亿</span>，
          累计回报（节省成本 + 增量营收）约 <span className="font-bold text-green-700">¥{(cumData[4].cumReturn / 10000).toFixed(1)} 亿</span>，
          <span className="font-bold text-green-700">五年累计总回报率≈{(() => { const v = (cumData[4].cumReturn - cumData[4].cumInvest) / cumData[4].cumInvest * 100; return Math.abs(v) < 1 ? '0' : (v >= 0 ? '+' : '') + v.toFixed(0); })()}%</span>。
          Y4 首年实现单年正回报（+5%），Y5 单年回报超 +50%，五年内累计回报基本持平投入（大额前期能力建设成本特征，技术资产价值未完全财务化体现）。
          核心收益来源：客服人力替代（五年累计 ¥{((600+2250+5200+7500+12000)/10000).toFixed(1)} 亿）、风控损失降低（¥{((400+1200+3500+6000+10000)/10000).toFixed(1)} 亿）、理财 AUM 佣金（¥{((0+800+2500+4000+6250)/10000).toFixed(1)} 亿）。
        </div>
      </div>

      {/* ═══════════ 9. 四大业务线目标拆解 ═══════════ */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 overflow-x-auto">
        <h3 className="text-base font-semibold text-gray-800 mb-3">🎯 四大业务线 · 五年目标拆解</h3>
        <table className="w-full text-[12px]">
          <thead>
            <tr className="text-left text-gray-400 border-b border-gray-100">
              <th className="py-2 pr-2 font-medium">业务线</th>
              <th className="py-2 pr-2 font-medium">Y1 筑基</th>
              <th className="py-2 pr-2 font-medium">Y2 突破</th>
              <th className="py-2 pr-2 font-medium">Y3 Agent</th>
              <th className="py-2 pr-2 font-medium">Y4 输出</th>
              <th className="py-2 pr-2 font-medium">Y5 原生</th>
              <th className="py-2 pr-2 font-medium">核心指标</th>
              <th className="py-2 font-medium">目标值</th>
            </tr>
          </thead>
          <tbody>
            {bizLines.map((b, i) => (
              <tr key={b.name} className={i % 2 === 0 ? 'bg-gray-50/40' : ''}>
                <td className="py-2 pr-2 font-semibold whitespace-nowrap" style={{ color: b.color }}>{b.name}</td>
                <td className="py-2 pr-2 text-gray-600">{b.y1}</td>
                <td className="py-2 pr-2 text-gray-600">{b.y2}</td>
                <td className="py-2 pr-2 text-gray-600">{b.y3}</td>
                <td className="py-2 pr-2 text-gray-600">{b.y4}</td>
                <td className="py-2 pr-2 text-gray-600">{b.y5}</td>
                <td className="py-2 pr-2 text-gray-700 font-mono whitespace-nowrap">{b.metric}</td>
                <td className="py-2 text-gray-800 font-semibold whitespace-nowrap">{b.baseline} → {b.target}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ═══════════ 10. 风险与应对 ═══════════ */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="text-base font-semibold text-gray-800 mb-3">⚠️ 关键风险与应对策略</h3>
        <div className="space-y-2">
          {[
            { risk: '监管政策变化', level: '🔴 高', impact: '生成式 AI 监管收紧可能限制 Agent 自主决策范围', mitigation: '提前参与标准制定；保持"人在回路"架构；合规团队持续跟踪政策动态' },
            { risk: '人才竞争激烈', level: '🟠 中高', impact: 'ML 算法人才被互联网大厂高薪挖角', mitigation: '股权激励 + 内部培养体系 + 与高校联合实验室；核心岗位 T+1 备份' },
            { risk: '技术路线风险', level: '🟡 中', impact: '大模型技术快速迭代，当前投入可能被新范式颠覆', mitigation: '平台化架构（模型可插拔）；保持 20% 预算用于前沿探索；与头部 AI 公司保持合作' },
            { risk: 'ROI 不及预期', level: '🟡 中', impact: '场景落地效果低于预期，投入回收期延长', mitigation: '每季度 OKR 复盘 + 止损机制；优先投入 ROI 确定性高的场景（客服 > 风控 > 理财）' },
            { risk: '数据质量不足', level: '🟠 中高', impact: '银行数据孤岛严重，模型训练数据质量差', mitigation: 'Y1 优先投入数据治理；建立数据质量评分体系；联邦学习补充外部数据' },
          ].map(r => (
            <div key={r.risk} className="p-3 rounded-lg bg-gray-50 border border-gray-100">
              <div className="flex items-center gap-3 mb-1">
                <span className="text-[12px] font-semibold text-gray-800">{r.risk}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white border border-gray-200">{r.level}</span>
              </div>
              <div className="text-[12px] text-gray-500 mb-1"><span className="text-gray-400">影响：</span>{r.impact}</div>
              <div className="text-[12px] text-gray-600"><span className="text-gray-400">应对：</span><span className="font-medium">{r.mitigation}</span></div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════ 11. 组织架构 ═══════════ */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="text-base font-semibold text-gray-800 mb-3">🏢 组织架构（Y3 成熟态）</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { name: 'AI 平台组', head: '技术总监', hc: '35 人', duty: 'AI 中台、模型服务、MLOps、评测体系', color: '#6c5ce7' },
            { name: '风控 AI 组', head: '高级算法专家', hc: '30 人', duty: '反欺诈模型、信用评分、实时风控引擎', color: '#e17055' },
            { name: '客服 AI 组', head: '高级算法专家', hc: '25 人', duty: '对话系统、RAG、多模态、TTS/ASR', color: '#00cec9' },
            { name: '理财 AI 组', head: '高级算法专家', hc: '25 人', duty: '投研 NLP、组合推荐、市场预测、Agent', color: '#3fb950' },
            { name: '数据工程组', head: '数据架构师', hc: '25 人', duty: '数据湖、特征平台、数据质量、ETL', color: '#ffa657' },
            { name: '合规治理组', head: '合规总监', hc: '20 人', duty: '模型审计、可解释性、隐私保护、监管对接', color: '#fd79a8' },
            { name: '产品 & 运营', head: '产品总监', hc: '20 人', duty: '场景规划、用户研究、运营分析、项目管理', color: '#a29bfe' },
          ].map(g => (
            <div key={g.name} className="p-3 rounded-xl border" style={{ borderColor: g.color + '33', background: g.color + '04' }}>
              <div className="text-sm font-semibold" style={{ color: g.color }}>{g.name}</div>
              <div className="text-[11px] text-gray-500 mt-1">
                <span className="font-medium text-gray-700">{g.head}</span> · {g.hc}
              </div>
              <div className="text-[11px] text-gray-400 mt-0.5">{g.duty}</div>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-gray-400 mt-3 italic">
          Y3 成熟态总编制 180 人。部门负责人向 CTO 汇报，合规治理组双线汇报（CTO + 首席合规官）。
        </p>
      </div>
    </div>
  );
}
