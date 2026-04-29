'use client';
import React, { useState } from 'react';
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
  const [tab, setTab] = useState('llm');

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
const [expandedCost, setExpandedCost] = useState(null);   // 展开的成本明细年份
  const [expandedRevenue, setExpandedRevenue] = useState(null); // 展开的营收明细年份
  const [expandedStaff, setExpandedStaff] = useState(null); // 展开的岗位人员明细 'Y1-ML/算法研究'

  /* —— 部门概览 —— */
  const deptOverview = {
    name: '平安银行 · 金融科技部 · AI 战略中心',
    mission: '以大模型 + Agent 为核心驱动力，五年内实现风控、客服、理财、合规四大业务线的 AI 原生化转型，将人效比提升 3 倍，AI 贡献营收占比从 5% 提升至 35%',
    vision: '2030 年成为国内银行业 AI 能力标杆，输出金融 AI 解决方案至平安集团生态',
  };

  /* ================================================================
   *  五年阶段 —— 精细化数据
   *  金额单位：万元（人民币）
   * ================================================================ */
  const phases = [
    {
      year: 'Y1（2026）', title: '筑基', color: '#6c5ce7',
      focus: '大模型平台搭建 + 数据治理 + 首批场景 PoC',
      goals: [
        '完成金融大模型私有化部署（70B 基座 + 7B 蒸馏版）',
        '建设统一 AI 中台（模型管理 / Prompt 工程 / RAG 知识库 / 评测体系）',
        '风控：图网络反欺诈模型上线（覆盖信用卡 + 消费贷）',
        '客服：智能客服 RAG 系统覆盖 Top 200 高频问题，替代 20% 人工坐席',
        '理财：投研助手 PoC（研报摘要 + 基金对比），内部试用',
      ],
      kpi: 'AI 替代人工坐席 20% · 反欺诈识别率提升 15% · 平台 SLA 99.9%',
      /* —— 人力明细 —— */
      headcount: {
        total: 85,
        breakdown: [
          { role: 'ML/算法研究', hc: 12, avgBase: 85, avgBonus: 30, avgEquity: 25, avgBenefit: 16, avgTotal: 156, note: '含 3 名 P8+ 专家（年包 250-350 万），P7 均 180 万，P6 均 100 万；专注模型研发/微调/评测',
            staffDetail: [
              { title: '首席算法专家（P8+）', count: 1, level: 'P8+', annualPkg: 350, duties: ['制定模型技术路线（选型/训练策略/蒸馏方案）', '主导 70B 金融大模型微调架构设计', '对外技术合作（高校/国产模型厂商）评审'], aiLeverage: 'AI 辅助论文调研 + 实验方案自动生成，节省 40% 调研时间' },
              { title: '高级算法工程师（P8）', count: 2, level: 'P8', annualPkg: 270, duties: ['风控反欺诈模型训练与迭代（LLM + 传统 ML 融合）', '客服 RAG 系统核心算法（检索增强 + 意图识别 + 多轮对话）'], aiLeverage: 'Copilot 辅助代码编写 + AI 自动调参（Optuna/Ray Tune），开发效率提升 50%' },
              { title: '算法工程师（P7）', count: 5, level: 'P7', annualPkg: 180, duties: ['模型微调实验执行（LoRA/QLoRA/全量）', '评测体系搭建（金融 benchmark + 人工评测流水线）', 'Prompt Engineering + 模型蒸馏（70B→7B）', '向量检索优化（embedding 模型选型 + 索引调优）', 'NER/关系抽取等传统 NLP 任务适配'], aiLeverage: '每人配备 AI 编程助手，实验代码 60% 由 AI 生成后人工审核，重复性调参工作由 AutoML 平台承担' },
              { title: '初级算法工程师（P6）', count: 4, level: 'P6', annualPkg: 100, duties: ['数据清洗与预处理脚本开发', '模型评测报告撰写与可视化', '开源模型复现与 benchmark 对比', 'AB 实验数据分析与效果跟踪'], aiLeverage: 'AI 生成 80% 的数据处理代码 + 自动生成评测报告模板，专注于结果分析与业务理解' },
            ] },
          { role: '工程开发', hc: 30, avgBase: 55, avgBonus: 18, avgEquity: 8, avgBenefit: 14, avgTotal: 95, note: 'AI 平台 10 人 + 数据工程 8 人 + 后端 8 人 + 前端 4 人，高级 130 万+',
            staffDetail: [
              { title: 'AI 平台架构师（P8）', count: 1, level: 'P8', annualPkg: 180, duties: ['AI 训练/推理平台整体架构设计（MLflow + Ray + vLLM）', '技术选型决策与性能瓶颈攻关', '制定工程规范与 Code Review 标准'], aiLeverage: 'AI 辅助架构文档生成 + 自动化性能分析报告' },
              { title: 'AI 平台工程师', count: 9, level: 'P6-P7', annualPkg: 100, duties: ['训练调度系统开发（GPU 资源编排/任务队列）', '模型服务化部署（vLLM/TGI 推理引擎集成）', '模型版本管理与灰度发布流水线', 'Prompt 管理平台 + 评测自动化平台开发', 'GPU 监控与成本优化工具开发'], aiLeverage: 'Copilot 生成 70% 基础代码，工程师专注架构设计与系统调优；YAML/配置文件 90% AI 生成' },
              { title: '数据工程师', count: 8, level: 'P6-P7', annualPkg: 95, duties: ['金融数据 ETL 管道开发（Spark/Flink）', '实时特征工程平台搭建', '数据质量监控与血缘追踪', '向量数据库运维与索引优化（Milvus）', '数据脱敏与合规处理流水线'], aiLeverage: 'SQL/Spark 代码 80% AI 生成，数据质量规则由 AI 自动推荐，工程师专注数据建模与业务逻辑' },
              { title: '后端工程师', count: 8, level: 'P6-P7', annualPkg: 90, duties: ['客服系统后端 API 开发（高并发/低延迟）', '风控决策引擎服务化', '投研助手后端（研报解析/基金数据聚合）', '统一鉴权/审计日志/限流熔断等中间件', '与行内核心系统对接（核心银行/信贷/支付）'], aiLeverage: 'CRUD 代码 90% AI 生成，工程师专注业务逻辑、性能优化与系统集成；API 文档自动生成' },
              { title: '前端工程师', count: 4, level: 'P6-P7', annualPkg: 85, duties: ['客服工作台 UI（对话界面/知识库管理后台）', '风控大屏与告警可视化', '投研助手前端（研报阅读器/图表交互）', '内部 AI 平台管理控制台'], aiLeverage: '组件代码 80% AI 生成，设计稿→代码转换效率提升 3 倍，工程师专注交互体验与复杂状态管理' },
            ] },
          { role: '产品/业务分析', hc: 12, avgBase: 50, avgBonus: 16, avgEquity: 6, avgBenefit: 13, avgTotal: 85, note: '产品经理 6 人 + 业务分析师 6 人（需懂金融业务），高级 120 万+',
            staffDetail: [
              { title: '高级产品经理', count: 2, level: 'P7-P8', annualPkg: 120, duties: ['AI 产品整体规划与路线图制定', '与算法/工程团队对齐需求优先级', '产品 ROI 测算与汇报（向 VP/CTO）'], aiLeverage: 'AI 辅助竞品分析 + 自动生成 PRD 初稿 + 数据看板自动化' },
              { title: '产品经理', count: 4, level: 'P6-P7', annualPkg: 75, duties: ['客服产品需求定义与原型设计', '风控产品功能迭代与用户反馈收集', '投研助手产品设计（交互流程/功能规格）', '内部工具产品化（从脚本→可用产品）'], aiLeverage: '原型图 AI 辅助生成，用户调研报告 AI 自动整理，产品文档 70% AI 起草后人工修订' },
              { title: '业务分析师', count: 6, level: 'P6-P7', annualPkg: 70, duties: ['金融业务流程梳理（信贷/支付/理财/合规）', '数据指标体系设计与 AB 实验分析', '业务需求→技术需求翻译（与算法团队桥接）', '行业调研与监管政策解读', '客户旅程分析与痛点挖掘', '业务效果跟踪报告（周报/月报/季度复盘）'], aiLeverage: 'AI 自动生成数据分析报告 + 监管政策摘要，分析师专注业务洞察与策略建议' },
            ] },
          { role: '测试/QA', hc: 8, avgBase: 40, avgBonus: 12, avgEquity: 3, avgBenefit: 12, avgTotal: 67, note: 'AI 模型测试 + 系统集成测试 + 安全测试，高级 90 万+',
            staffDetail: [
              { title: '高级测试工程师', count: 1, level: 'P7', annualPkg: 95, duties: ['测试策略制定与质量门禁标准', 'AI 模型评测框架设计（准确率/延迟/幻觉率/安全性）', '自动化测试体系架构'], aiLeverage: 'AI 自动生成测试用例 + 测试报告模板，专注于测试策略与质量标准制定' },
              { title: 'AI 模型测试工程师', count: 3, level: 'P6', annualPkg: 65, duties: ['大模型输出质量评测（幻觉检测/事实性验证/合规性）', '对抗样本测试与红队攻击模拟', 'RAG 系统端到端评测（检索准确率/回答质量）'], aiLeverage: '测试数据集 70% AI 自动生成，对抗样本由 AI 批量构造，测试工程师专注评测标准定义与边界 case 分析' },
              { title: '系统集成测试工程师', count: 2, level: 'P6', annualPkg: 60, duties: ['API 接口自动化测试（与核心银行系统联调）', '性能压测与容量规划（JMeter/Locust）', '回归测试自动化流水线维护'], aiLeverage: '测试脚本 80% AI 生成，接口 Mock 数据自动构造，工程师专注场景设计与异常路径覆盖' },
              { title: '安全测试工程师', count: 2, level: 'P6-P7', annualPkg: 70, duties: ['AI 系统安全渗透测试（Prompt 注入/数据泄露）', '金融合规安全扫描（等保/密码学合规）', '隐私计算组件安全验证'], aiLeverage: 'AI 辅助漏洞扫描 + 自动化安全报告生成，专注于金融特有的安全攻击面分析' },
            ] },
          { role: '数据标注/分析', hc: 6, avgBase: 32, avgBonus: 8, avgEquity: 0, avgBenefit: 10, avgTotal: 50, note: '含外包标注 3 人（25 万/人），数据分析师 70 万',
            staffDetail: [
              { title: '数据分析师', count: 3, level: 'P6-P7', annualPkg: 70, duties: ['模型效果数据分析与归因（哪些 case 错了/为什么错）', '业务指标监控看板搭建（Grafana/Superset）', '标注质量审核与标注规范制定'], aiLeverage: 'AI 自动生成分析报告初稿 + 异常检测自动告警，分析师专注深度归因与业务建议' },
              { title: '数据标注专员（外包）', count: 3, level: '外包', annualPkg: 25, duties: ['金融领域语料标注（意图/实体/情感）', '模型输出质量人工评分（1-5 分）', 'SFT 训练数据构造（问答对编写）'], aiLeverage: 'AI 预标注 + 人工校验模式，标注效率提升 3 倍；AI 自动检测标注一致性，减少返工' },
            ] },
          { role: '合规/风控', hc: 8, avgBase: 55, avgBonus: 18, avgEquity: 8, avgBenefit: 14, avgTotal: 95, note: '需持有 FRM/CFA 等资质，高级合规 150 万+',
            staffDetail: [
              { title: '高级合规专家', count: 2, level: 'P7-P8', annualPkg: 150, duties: ['AI 模型合规审查框架制定（银保监会/人行要求）', '模型可解释性评估与监管报告撰写', '数据隐私合规审计（个保法/数据安全法）'], aiLeverage: 'AI 辅助监管政策变更追踪 + 合规检查清单自动生成，专注于合规策略与监管沟通' },
              { title: '风控模型审计师', count: 3, level: 'P6-P7', annualPkg: 95, duties: ['模型公平性/偏见检测（性别/年龄/地域）', '模型漂移监控与预警规则配置', '反洗钱（AML）模型合规验证'], aiLeverage: 'AI 自动化偏见检测 + 漂移报告生成，审计师专注于判断标准制定与监管解读' },
              { title: 'AI 伦理与数据治理专员', count: 3, level: 'P6', annualPkg: 60, duties: ['训练数据合规审查（版权/隐私/敏感信息）', 'AI 输出内容安全过滤规则维护', '数据分类分级与访问权限管理'], aiLeverage: 'AI 自动扫描敏感数据 + 内容安全过滤 90% 自动化，专员专注于规则制定与边界 case 裁决' },
            ] },
          { role: 'PMO/项目管理', hc: 5, avgBase: 45, avgBonus: 14, avgEquity: 4, avgBenefit: 12, avgTotal: 75, note: '跨部门协调 + 项目交付管理，高级 PM 100 万+',
            staffDetail: [
              { title: '高级项目经理', count: 1, level: 'P7', annualPkg: 110, duties: ['AI 部门整体项目组合管理（10+ 并行项目）', '与业务部门（零售/对公/风险）对齐 OKR', '资源调配与跨部门冲突协调'], aiLeverage: 'AI 自动生成项目周报 + 风险预警 + 资源冲突检测，PM 专注于决策与沟通' },
              { title: '项目经理', count: 3, level: 'P6', annualPkg: 70, duties: ['各业务线 AI 项目交付管理（客服/风控/投研）', '需求排期与迭代计划制定（Scrum/看板）', '项目文档管理与会议纪要'], aiLeverage: '会议纪要 AI 自动生成，项目计划 AI 辅助排期，甘特图自动更新，PM 专注于风险管理与干系人沟通' },
              { title: '项目协调员', count: 1, level: 'P5-P6', annualPkg: 50, duties: ['日常项目事务跟进与催办', '项目数据统计与报表制作', '外部供应商对接与合同管理'], aiLeverage: 'AI 自动催办 + 报表生成 + 合同关键条款提取，协调员专注于人际沟通与流程优化' },
            ] },
          { role: '运维/SRE', hc: 4, avgBase: 48, avgBonus: 15, avgEquity: 5, avgBenefit: 13, avgTotal: 81, note: 'AI 平台运维 + 模型服务 SLA 保障，高级 110 万+',
            staffDetail: [
              { title: '高级 SRE 工程师', count: 1, level: 'P7', annualPkg: 120, duties: ['AI 平台 SLA 体系设计（99.9% 可用性目标）', '容量规划与成本优化（GPU 利用率监控）', '故障应急预案与演练'], aiLeverage: 'AI 自动化根因分析 + 容量预测模型，SRE 专注于架构优化与应急决策' },
              { title: 'AI 平台运维工程师', count: 2, level: 'P6', annualPkg: 70, duties: ['GPU 集群日常运维（驱动/CUDA/容器）', '模型推理服务监控与告警（延迟/吞吐/错误率）', 'CI/CD 流水线维护（模型部署自动化）'], aiLeverage: '告警降噪 AI 自动处理 80% 低级告警，运维脚本 AI 生成，工程师专注于复杂故障排查与架构优化' },
              { title: '基础设施运维工程师', count: 1, level: 'P6', annualPkg: 65, duties: ['网络/存储/机房基础设施运维', 'Kubernetes 集群管理与扩缩容', '备份恢复与灾备演练'], aiLeverage: 'K8s 配置 AI 自动生成 + 异常自愈脚本 AI 编写，专注于基础设施架构演进' },
            ] },
        ],
        salaryTotal: 8037,
        salaryNote: '人力总成本 = Σ(各岗位人数 × 人均年包)。年包 = 基本工资 + 绩效奖金(0-8个月) + 股权/RSU(按年摊销) + 综合福利(五险一金 + 商业保险 + 工位租金 3-5万/人 + 餐补交通补 2-3万 + 团建差旅 1-2万)。算法:工程 ≈ 1:2.5，体现银行重落地的特点',
      },
      /* —— 硬件 & 基础设施明细 —— */
      infra: {
        total: 3500,
        breakdown: [
          { item: 'GPU 训练集群', spec: '8×A100-80G 节点 ×4 台（DGX A100）', cost: 1200, note: '70B 模型全量微调最低配置，含 NVLink + InfiniBand' },
          { item: 'GPU 推理集群', spec: '4×A100-40G 节点 ×6 台', cost: 720, note: '支撑 7B 蒸馏版在线推理，QPS ~200' },
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
          { item: '国产大模型私有化部署', cost: 200, note: '文心一言/通义千问/GLM 企业版私有化部署授权（银行数据不可出境，禁止调用境外 API）' },
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
          { source: '风控损失降低', amount: 400, calc: '信用卡欺诈损失率从 0.15% 降至 0.12%，年交易额 ¥8000 亿 × 0.03% = 2.4 亿 × 保守取 1/6', confidence: '中' },
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
      year: 'Y2（2027）', title: '场景突破', color: '#00cec9',
      focus: '核心场景规模化落地 + Agent 1.0 + 隐私计算联邦',
      goals: [
        '风控：LLM + 图网络融合模型覆盖全行信贷产品线，SAR 报告自动生成',
        '客服：多模态客服（语音 + 文字 + 图片）上线，替代 45% 人工坐席',
        '理财：AI 理财顾问 1.0 上线（个性化资产配置建议 + 合规话术生成）',
        '合规：合规审查 Agent（合同 / 营销物料 / 研报自动审核）',
        '联邦学习：与 3 家银行建立联邦风控联盟（基于 FATE/SecretFlow）',
      ],
      kpi: 'AI 客服替代率 45% · 理财 AUM 转化率提升 8% · 合规审查效率提升 60%',
      headcount: {
        total: 130,
        breakdown: [
          { role: 'ML/算法研究', hc: 20, avgBase: 82, avgBonus: 30, avgEquity: 25, avgBenefit: 17, avgTotal: 154, note: '新增 NLP/多模态/强化学习方向，P8+ 5 人（均 280 万），P7 均 190 万',
            staffDetail: [
              { title: '首席算法专家（P8+）', count: 2, level: 'P8+', annualPkg: 300, duties: ['多模态模型架构设计（语音+文字+图片融合）', '联邦学习算法方案设计与跨机构协议制定', '技术委员会核心成员，把控模型质量红线'], aiLeverage: 'AI 辅助论文调研 + 实验方案自动生成 + 代码 Review 自动化' },
              { title: '高级算法工程师（P8）', count: 3, level: 'P8', annualPkg: 260, duties: ['客服多模态模型训练（语音ASR+NLU+对话管理）', '理财 Agent 1.0 核心算法（个性化推荐+合规话术生成）', '风控图网络+LLM 融合模型研发'], aiLeverage: 'AutoML 平台承担 60% 超参搜索，AI 辅助代码编写效率提升 50%' },
              { title: '算法工程师（P7）', count: 8, level: 'P7', annualPkg: 190, duties: ['多模态数据预处理与特征工程', '模型蒸馏与量化（70B→7B→1.5B 多版本）', 'Agent 工具调用能力微调（Function Calling）', '联邦学习本地模型训练与聚合', 'RAG 系统升级（多模态检索+重排序）'], aiLeverage: '实验代码 70% AI 生成后人工审核，重复性调参由 AutoML 承担，专注于创新性算法设计' },
              { title: '初级算法工程师（P6）', count: 7, level: 'P6', annualPkg: 110, duties: ['多模态数据清洗与标注质量校验', '模型评测自动化流水线维护', '开源模型复现与 benchmark 对比', 'AB 实验数据分析与效果跟踪', '技术文档与实验报告撰写'], aiLeverage: 'AI 生成 85% 数据处理代码 + 评测报告自动生成，专注于结果分析与业务理解' },
            ] },
          { role: '工程开发', hc: 48, avgBase: 58, avgBonus: 20, avgEquity: 10, avgBenefit: 15, avgTotal: 103, note: '新增 Agent 框架 + 推理优化团队，高级架构师 150 万+',
            staffDetail: [
              { title: '首席架构师（P8）', count: 2, level: 'P8', annualPkg: 180, duties: ['Agent 框架整体架构设计（工具调用/记忆管理/安全沙箱）', '多模态推理引擎架构（vLLM 多模态扩展）', '技术选型决策与跨团队架构评审'], aiLeverage: 'AI 辅助架构文档生成 + 性能瓶颈自动分析' },
              { title: 'AI 平台工程师', count: 12, level: 'P6-P7', annualPkg: 105, duties: ['Agent 编排引擎开发（DAG 工作流/状态机）', '推理优化（KV Cache/Continuous Batching/Speculative Decoding）', '多模态模型服务化（语音/图片/文字统一接口）', '模型 A/B 测试平台升级', 'GPU 资源池化与弹性调度'], aiLeverage: 'Copilot 生成 70% 基础代码，工程师专注架构设计与性能调优' },
              { title: '数据工程师', count: 10, level: 'P6-P7', annualPkg: 100, duties: ['多模态数据管道（语音/图片/文本统一 ETL）', '实时特征平台升级（支撑 Agent 实时决策）', '联邦学习数据通道搭建', '向量数据库集群运维与索引优化', '数据血缘追踪与质量监控升级'], aiLeverage: 'SQL/Spark 代码 85% AI 生成，数据质量规则 AI 自动推荐' },
              { title: '后端工程师', count: 14, level: 'P6-P7', annualPkg: 95, duties: ['多模态客服后端（语音流/WebSocket/实时转写）', '理财 Agent API 开发（组合推荐/调仓建议/合规校验）', '合规审查 Agent 后端（合同解析/营销审核）', 'SAR 报告自动生成服务', '联邦风控联盟通信服务'], aiLeverage: 'CRUD 代码 90% AI 生成，API 文档自动生成，工程师专注业务逻辑与系统集成' },
              { title: '前端工程师', count: 6, level: 'P6-P7', annualPkg: 90, duties: ['多模态客服工作台（语音+文字+图片交互）', '理财顾问前端（资产配置可视化/K线图/组合分析）', 'Agent 调试控制台（工具调用链路可视化）', '合规审查工作台（合同标注/审核流程）'], aiLeverage: '组件代码 85% AI 生成，设计稿→代码效率提升 3 倍' },
              { title: 'Agent 框架工程师', count: 4, level: 'P7', annualPkg: 130, duties: ['Agent 核心框架开发（ReAct/CoT/Tool Use）', 'Agent 安全沙箱（权限隔离/操作审计/回滚机制）', 'Agent 记忆系统（短期/长期/工作记忆）', 'Agent 评测框架（任务完成率/安全性/效率）'], aiLeverage: 'AI 辅助框架设计 + 自动化测试用例生成，专注于核心架构创新' },
            ] },
          { role: '产品/业务分析', hc: 18, avgBase: 54, avgBonus: 17, avgEquity: 8, avgBenefit: 13, avgTotal: 92, note: '各业务线配备专属产品 + 业务分析师，高级产品总监 130 万+',
            staffDetail: [
              { title: '高级产品总监', count: 2, level: 'P8', annualPkg: 140, duties: ['AI 产品矩阵规划（客服/风控/理财/合规四条线）', '产品商业化路径设计与 ROI 测算', '与 CTO/业务 VP 对齐战略优先级'], aiLeverage: 'AI 辅助竞品分析 + 市场趋势报告自动生成' },
              { title: '产品经理（各业务线）', count: 8, level: 'P6-P7', annualPkg: 85, duties: ['客服产品：多模态交互设计 + 满意度指标体系', '风控产品：SAR 自动生成流程设计 + 审批工作流', '理财产品：AI 顾问交互设计 + 合规话术模板管理', '合规产品：合同审查流程 + 营销物料审核工作流', '内部工具产品化（从脚本→可用产品）'], aiLeverage: '原型图 AI 辅助生成，用户调研报告 AI 自动整理，产品文档 75% AI 起草' },
              { title: '业务分析师', count: 8, level: 'P6-P7', annualPkg: 75, duties: ['各业务线数据指标监控与归因分析', '联邦学习业务价值评估', 'Agent 效果跟踪（任务完成率/用户满意度/转化率）', '行业调研与监管政策解读', '季度业务复盘报告撰写'], aiLeverage: 'AI 自动生成数据分析报告 + 异常检测告警，分析师专注深度洞察与策略建议' },
            ] },
          { role: '测试/QA', hc: 10, avgBase: 42, avgBonus: 13, avgEquity: 4, avgBenefit: 12, avgTotal: 71, note: '新增 AI 模型评测 + 回归测试自动化，高级 95 万+',
            staffDetail: [
              { title: '高级测试架构师', count: 1, level: 'P7', annualPkg: 100, duties: ['多模态 AI 系统测试策略制定', 'Agent 端到端测试框架设计', '测试自动化平台架构（CI/CD 集成）'], aiLeverage: 'AI 自动生成测试策略文档 + 覆盖率分析报告' },
              { title: 'AI 模型评测工程师', count: 4, level: 'P6', annualPkg: 68, duties: ['多模态模型输出质量评测（语音识别准确率/图片理解/文本生成）', 'Agent 任务完成率评测（工具调用正确性/多步推理）', '联邦模型效果对比评测', '对抗样本测试与红队攻击模拟'], aiLeverage: '测试数据集 75% AI 自动生成，评测报告自动化，专注于评测标准定义与边界分析' },
              { title: '系统集成测试工程师', count: 3, level: 'P6', annualPkg: 62, duties: ['多模态客服端到端测试（语音→文字→回复→TTS）', 'Agent 工具调用链路测试', '联邦学习跨机构联调测试', '性能压测与容量规划'], aiLeverage: '测试脚本 85% AI 生成，Mock 数据自动构造，专注于场景设计与异常路径覆盖' },
              { title: '安全测试工程师', count: 2, level: 'P6-P7', annualPkg: 75, duties: ['Agent 安全测试（权限逃逸/数据泄露/操作越权）', '多模态输入安全测试（恶意图片/音频注入）', '联邦学习安全验证（梯度泄露/模型投毒检测）'], aiLeverage: 'AI 辅助漏洞扫描 + 攻击向量自动生成，专注于金融特有安全攻击面' },
            ] },
          { role: '数据标注/分析', hc: 8, avgBase: 36, avgBonus: 9, avgEquity: 0, avgBenefit: 11, avgTotal: 56, note: '扩充金融领域标注专家，数据分析师 75 万',
            staffDetail: [
              { title: '数据科学家', count: 3, level: 'P6-P7', annualPkg: 80, duties: ['多模态数据质量分析与清洗策略', '标注一致性评估与质量控制', 'Agent 行为数据分析（工具调用模式/失败原因）', '联邦学习数据分布分析'], aiLeverage: 'AI 自动生成分析报告 + 异常检测，科学家专注于数据策略与质量标准' },
              { title: '金融领域标注专家', count: 2, level: 'P6', annualPkg: 55, duties: ['金融专业语料标注（信贷/理财/合规术语）', 'Agent 工具调用标注（正确工具选择/参数标注）', 'RLHF 偏好数据构造（好/坏回答对比标注）'], aiLeverage: 'AI 预标注 + 人工校验模式，标注效率提升 3 倍' },
              { title: '数据标注专员（外包）', count: 3, level: '外包', annualPkg: 25, duties: ['多模态数据标注（语音转写校对/图片描述/文本分类）', '模型输出质量人工评分', 'SFT 训练数据构造'], aiLeverage: 'AI 预标注 + 人工校验，标注效率提升 4 倍；AI 自动检测标注一致性' },
            ] },
          { role: '合规/风控', hc: 12, avgBase: 58, avgBonus: 20, avgEquity: 10, avgBenefit: 15, avgTotal: 103, note: '新增 AI 伦理审查岗，高级合规专家 160 万+',
            staffDetail: [
              { title: '首席合规专家', count: 2, level: 'P8', annualPkg: 170, duties: ['AI 治理框架升级（多模态/Agent 合规标准）', '联邦学习合规审查（跨机构数据使用协议）', '监管沟通与政策解读（银保监会/人行）'], aiLeverage: 'AI 辅助监管政策变更追踪 + 合规检查清单自动生成' },
              { title: '风控模型审计师', count: 4, level: 'P6-P7', annualPkg: 100, duties: ['多模态模型公平性/偏见检测', 'Agent 决策审计（操作合规性/风险评估）', '联邦模型效果审计与公平性验证', 'SAR 报告质量审核'], aiLeverage: 'AI 自动化偏见检测 + 审计报告生成，审计师专注于判断标准与监管解读' },
              { title: 'AI 伦理审查专员', count: 3, level: 'P6-P7', annualPkg: 85, duties: ['Agent 输出内容安全审查（金融建议合规性）', '多模态内容安全过滤规则维护', '训练数据版权与隐私合规审查', 'AI 伦理委员会日常运营'], aiLeverage: 'AI 自动扫描 90% 内容安全问题，专员专注于边界 case 裁决与规则制定' },
              { title: '数据治理专员', count: 3, level: 'P6', annualPkg: 65, duties: ['联邦学习数据使用协议管理', '数据分类分级与访问权限管理', '隐私计算合规验证', '数据安全事件响应'], aiLeverage: 'AI 自动扫描敏感数据 + 权限异常检测，专员专注于规则制定与事件处理' },
            ] },
          { role: 'PMO/项目管理', hc: 7, avgBase: 48, avgBonus: 15, avgEquity: 5, avgBenefit: 12, avgTotal: 80, note: '多项目并行管理 + 跨部门协调，高级 PM 110 万+',
            staffDetail: [
              { title: '高级项目经理', count: 2, level: 'P7', annualPkg: 115, duties: ['多业务线项目组合管理（15+ 并行项目）', '联邦学习跨机构项目协调', '与业务部门 OKR 对齐与资源协调'], aiLeverage: 'AI 自动生成项目周报 + 风险预警 + 资源冲突检测' },
              { title: '项目经理', count: 4, level: 'P6', annualPkg: 72, duties: ['各业务线 AI 项目交付管理', '需求排期与迭代计划制定', '跨团队联调协调', '项目文档管理与会议纪要'], aiLeverage: '会议纪要 AI 自动生成，项目计划 AI 辅助排期，甘特图自动更新' },
              { title: '项目协调员', count: 1, level: 'P5-P6', annualPkg: 55, duties: ['日常项目事务跟进与催办', '项目数据统计与报表制作', '外部供应商对接与合同管理'], aiLeverage: 'AI 自动催办 + 报表生成 + 合同关键条款提取' },
            ] },
          { role: '运维/SRE', hc: 7, avgBase: 50, avgBonus: 16, avgEquity: 6, avgBenefit: 13, avgTotal: 85, note: '模型服务 SLA + 平台运维 + 监控告警，高级 120 万+',
            staffDetail: [
              { title: '高级 SRE 工程师', count: 2, level: 'P7', annualPkg: 125, duties: ['多模态推理服务 SLA 体系（99.95% 可用性）', '双活架构运维与故障切换演练', '容量规划与成本优化（GPU 利用率 >70%）'], aiLeverage: 'AI 自动化根因分析 + 容量预测模型，SRE 专注于架构优化与应急决策' },
              { title: 'AI 平台运维工程师', count: 3, level: 'P6', annualPkg: 75, duties: ['H100 GPU 集群运维（驱动/CUDA/容器/液冷）', '多模态推理服务监控与告警', '联邦学习平台运维（跨机构网络/证书管理）', 'CI/CD 流水线维护'], aiLeverage: '告警降噪 AI 自动处理 85% 低级告警，运维脚本 AI 生成' },
              { title: '基础设施运维工程师', count: 2, level: 'P6', annualPkg: 68, duties: ['网络/存储/机房基础设施运维', 'Kubernetes 集群管理与扩缩容', '备份恢复与灾备演练', '液冷系统维护与电力监控'], aiLeverage: 'K8s 配置 AI 自动生成 + 异常自愈脚本 AI 编写' },
            ] },
        ],
        salaryTotal: 13229,
        salaryNote: '人均成本较 Y1 上浮 8-12%（市场薪资涨幅 + 高级人才引入 + 办公福利成本上升）。算法:工程 ≈ 1:2.4，新增测试/运维保障落地质量',
      },
      infra: {
        total: 5200,
        breakdown: [
          { item: 'GPU 训练集群扩容', spec: '新增 H100-80G 节点 ×8 台', cost: 2000, note: '支撑多模态模型训练 + Agent 微调' },
          { item: 'GPU 推理集群扩容', spec: '新增 L40S 节点 ×12 台', cost: 960, note: '多模态推理 + 实时客服，QPS 目标 500' },
          { item: '存储扩容', spec: '扩至 1.2PB + 向量数据库集群', cost: 450, note: '新增 Milvus 向量库 + 多模态数据存储' },
          { item: '网络 & 机房', spec: '新增 4 个机柜 + 400Gbps 骨干升级', cost: 350, note: '支撑联邦学习跨机构通信' },
          { item: '隐私计算集群', spec: 'TEE 节点 ×8 + MPC 计算节点 ×4', cost: 500, note: '联邦风控联盟基础设施' },
          { item: '运维 & 监控', spec: 'Prometheus + Grafana + 自研 AI 监控', cost: 200, note: '模型漂移检测 + 推理延迟监控' },
          { item: '灾备升级', spec: '双活架构改造（推理层）', cost: 400, note: '客服场景要求 99.95% 可用性' },
          { item: '电力 & 制冷', spec: '新增 UPS + 液冷改造', cost: 340, note: 'H100 功耗 700W/卡，需液冷散热' },
        ],
      },
      vendor: {
        total: 1200,
        breakdown: [
          { item: '国产大模型授权 & 升级', cost: 300, note: '私有化部署模型版本升级 + 多模态能力扩展（合规要求：数据不出行内网络）' },
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
          { source: '风控损失降低', amount: 1200, calc: '欺诈损失率降至 0.08%，年交易额 ¥9000 亿 × 0.07% 降幅 = 6.3 亿 × 保守取 1/5', confidence: '中' },
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
      year: 'Y3（2028）', title: 'Agent 驱动', color: '#3fb950',
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
        total: 180,
        breakdown: [
          { role: 'ML/算法研究', hc: 28, avgBase: 90, avgBonus: 34, avgEquity: 30, avgBenefit: 18, avgTotal: 172, note: '新增 Agent/强化学习/世界模型方向，P8+ 8 人（均 300 万），P9 首席科学家 400 万',
            staffDetail: [
              { title: '首席科学家（P9）', count: 1, level: 'P9', annualPkg: 400, duties: ['AI 技术战略制定与前沿方向探索（世界模型/自主决策）', '多 Agent 协作算法架构设计', '对外学术合作与行业影响力建设'], aiLeverage: 'AI 辅助论文调研 + 实验方案自动生成，专注于战略判断与技术方向把控' },
              { title: '高级算法专家（P8+）', count: 3, level: 'P8+', annualPkg: 320, duties: ['风控 Agent 核心算法（实时监控+异常预警+自动处置）', '客服 Agent 端到端业务办理算法', '理财 Agent 千人千面推荐算法', '强化学习训练框架搭建（RLHF/RLAIF）'], aiLeverage: 'AutoML 承担 70% 超参搜索，AI 辅助代码编写效率提升 60%' },
              { title: '高级算法工程师（P8）', count: 4, level: 'P8', annualPkg: 280, duties: ['Agent 工具调用能力训练（多步推理/错误恢复）', '多 Agent 协作协议设计（任务分解/结果聚合）', '模型安全对齐（RLHF/Constitutional AI）', '数据飞轮闭环算法（自动数据采集→标注→训练→评测）'], aiLeverage: 'AI 辅助实验设计 + 自动化 ablation study' },
              { title: '算法工程师（P7）', count: 12, level: 'P7', annualPkg: 195, duties: ['Agent 各场景微调（风控/客服/理财/合规/Copilot）', '模型蒸馏与量化（多版本适配不同场景）', '向量检索与知识图谱融合', '联邦学习模型聚合算法优化', '模型评测体系维护与迭代'], aiLeverage: '实验代码 75% AI 生成，重复性调参全部 AutoML 化' },
              { title: '初级算法工程师（P6）', count: 8, level: 'P6', annualPkg: 115, duties: ['数据清洗与预处理自动化', '评测数据集构建与维护', '开源模型复现与对比', 'AB 实验数据分析', '技术文档撰写'], aiLeverage: 'AI 生成 90% 数据处理代码 + 评测报告自动生成' },
            ] },
          { role: '工程开发', hc: 65, avgBase: 62, avgBonus: 22, avgEquity: 13, avgBenefit: 16, avgTotal: 113, note: '新增 Agent 编排 + 可观测性团队，P8 架构师 200 万+',
            staffDetail: [
              { title: '首席架构师（P8+）', count: 3, level: 'P8+', annualPkg: 220, duties: ['多 Agent 编排引擎架构（DAG/状态机/事件驱动）', 'Agent 可观测性平台架构（链路追踪/决策审计/回放）', '全行 AI 中台架构设计'], aiLeverage: 'AI 辅助架构文档 + 性能瓶颈自动分析' },
              { title: 'Agent 框架工程师', count: 8, level: 'P7', annualPkg: 140, duties: ['Agent 编排引擎核心开发', 'Agent 安全沙箱升级（细粒度权限/操作回滚/审计日志）', 'Agent 记忆系统（向量记忆/结构化记忆/工作记忆）', 'Agent 工具注册与发现平台', 'Agent 评测与监控平台'], aiLeverage: 'AI 辅助框架设计 + 自动化测试，专注于核心架构创新' },
              { title: 'AI 平台工程师', count: 12, level: 'P6-P7', annualPkg: 110, duties: ['推理引擎优化（Speculative Decoding/PagedAttention）', '模型服务网格（多模型路由/灰度/熔断）', '训练平台升级（支撑 RL 训练/多 Agent 训练）', 'GPU 资源池化与智能调度'], aiLeverage: 'Copilot 生成 75% 基础代码' },
              { title: '数据工程师', count: 10, level: 'P6-P7', annualPkg: 105, duties: ['数据飞轮自动化管道', '实时特征平台（支撑 Agent 实时决策 <50ms）', '全行知识库构建与维护', '数据血缘与质量监控'], aiLeverage: 'SQL/Spark 代码 90% AI 生成' },
              { title: '后端工程师', count: 18, level: 'P6-P7', annualPkg: 100, duties: ['风控 Agent 后端（实时交易监控/自动处置/人工复核）', '客服 Agent 后端（端到端业务办理/开卡/转账/理赔）', '理财 Agent 后端（组合推荐/自动调仓/市场解读）', '合规 Agent 后端（监管报告/政策影响分析）', '内部 Copilot 后端（研发/运营/财务）'], aiLeverage: 'CRUD 代码 95% AI 生成，API 文档自动生成' },
              { title: '前端工程师', count: 8, level: 'P6-P7', annualPkg: 95, duties: ['Agent 交互界面（多轮对话/工具调用可视化/审批流）', '风控大屏升级（实时 Agent 决策链路展示）', '内部 Copilot 前端（IDE 插件/Web 工作台）', 'Agent 管理后台（配置/监控/审计）'], aiLeverage: '组件代码 90% AI 生成' },
              { title: '可观测性工程师', count: 6, level: 'P6-P7', annualPkg: 105, duties: ['Agent 链路追踪系统（每步决策/工具调用/耗时）', 'Agent 决策审计平台（合规性/正确性/可解释性）', '模型漂移检测与自动告警', '全链路性能监控与优化'], aiLeverage: 'AI 自动化根因分析 + 异常模式识别' },
            ] },
          { role: '产品/业务分析', hc: 25, avgBase: 57, avgBonus: 19, avgEquity: 10, avgBenefit: 14, avgTotal: 100, note: '新增 AI 产品运营 + 用户增长 + 业务架构师，产品VP 180 万+',
            staffDetail: [
              { title: '产品 VP', count: 1, level: 'P9', annualPkg: 200, duties: ['AI 产品战略制定与商业化路径规划', '与 CEO/CTO 对齐 AI 战略优先级', '产品团队管理与人才梯队建设'], aiLeverage: 'AI 辅助市场分析 + 竞品追踪自动化' },
              { title: '高级产品经理', count: 4, level: 'P7-P8', annualPkg: 130, duties: ['各 Agent 产品线负责人（风控/客服/理财/合规）', 'Agent 产品体验设计（人机协作流程/异常处理/升级机制）', '产品 ROI 测算与效果复盘'], aiLeverage: 'AI 辅助竞品分析 + PRD 自动生成初稿' },
              { title: '产品经理', count: 6, level: 'P6-P7', annualPkg: 90, duties: ['Agent 功能迭代与用户反馈收集', '内部 Copilot 产品设计', 'Agent 运营数据分析与优化建议', '产品文档与培训材料编写'], aiLeverage: '产品文档 80% AI 起草，用户调研报告 AI 自动整理' },
              { title: 'AI 产品运营', count: 4, level: 'P6', annualPkg: 75, duties: ['Agent 上线运营（灰度策略/用户引导/FAQ 维护）', '用户增长策略（内部推广/培训/激励）', '运营数据监控与异常处理'], aiLeverage: 'AI 自动生成运营报告 + 用户行为分析' },
              { title: '业务架构师', count: 4, level: 'P7', annualPkg: 120, duties: ['金融业务流程→Agent 任务分解', '跨业务线 Agent 协作流程设计', '业务指标体系设计与效果归因'], aiLeverage: 'AI 辅助业务流程图生成 + 指标异常归因分析' },
              { title: '业务分析师', count: 6, level: 'P6', annualPkg: 70, duties: ['Agent 效果数据分析（任务完成率/用户满意度/转化率）', '业务指标监控与异常告警', '季度业务复盘报告'], aiLeverage: 'AI 自动生成分析报告 + 异常检测告警' },
            ] },
          { role: '测试/QA', hc: 12, avgBase: 44, avgBonus: 14, avgEquity: 5, avgBenefit: 12, avgTotal: 75, note: 'Agent 端到端测试 + 安全测试 + 性能压测，高级 100 万+',
            staffDetail: [
              { title: '测试架构师', count: 1, level: 'P8', annualPkg: 120, duties: ['多 Agent 系统测试策略制定', 'Agent 端到端测试框架设计（任务完成率/安全性/效率）', '测试自动化平台架构升级'], aiLeverage: 'AI 自动生成测试策略 + 覆盖率分析' },
              { title: 'Agent 测试工程师', count: 5, level: 'P6-P7', annualPkg: 78, duties: ['Agent 端到端测试（多步推理/工具调用/错误恢复）', 'Agent 安全测试（权限逃逸/数据泄露/操作越权）', 'Agent 性能测试（并发/延迟/吞吐量）', '多 Agent 协作测试（任务分解/结果聚合/冲突处理）'], aiLeverage: '测试用例 80% AI 自动生成，专注于边界场景设计' },
              { title: '系统集成测试工程师', count: 3, level: 'P6', annualPkg: 65, duties: ['Agent 与核心银行系统联调测试', '端到端业务流程测试（开卡/转账/理赔全链路）', '性能压测与容量规划'], aiLeverage: '测试脚本 90% AI 生成，Mock 数据自动构造' },
              { title: '安全测试工程师', count: 3, level: 'P6-P7', annualPkg: 80, duties: ['Agent 红队攻击测试（Prompt 注入/越狱/社工）', 'Agent 操作安全验证（资金操作/敏感信息访问）', '隐私计算安全测试'], aiLeverage: 'AI 辅助攻击向量生成 + 漏洞扫描自动化' },
            ] },
          { role: '数据标注/分析', hc: 10, avgBase: 38, avgBonus: 10, avgEquity: 0, avgBenefit: 12, avgTotal: 60, note: '引入 RLHF 标注专家团队，数据科学家 90 万+',
            staffDetail: [
              { title: '数据科学家', count: 4, level: 'P7', annualPkg: 95, duties: ['数据飞轮效果分析与优化', 'Agent 行为数据挖掘（决策模式/失败原因/优化方向）', 'RLHF 数据质量评估与策略优化', '标注一致性评估与质量控制体系'], aiLeverage: 'AI 自动生成分析报告 + 数据质量异常自动检测' },
              { title: 'RLHF 标注专家', count: 3, level: 'P6-P7', annualPkg: 65, duties: ['Agent 决策质量人工评估（好/坏决策对比标注）', '强化学习奖励模型训练数据构造', '金融专业场景偏好数据标注'], aiLeverage: 'AI 预标注 + 人工校验，标注效率提升 4 倍' },
              { title: '数据标注专员（外包）', count: 3, level: '外包', annualPkg: 25, duties: ['基础语料标注（意图/实体/情感）', '模型输出质量人工评分', 'SFT 训练数据构造'], aiLeverage: 'AI 预标注 + 人工校验，标注效率提升 5 倍' },
            ] },
          { role: '合规/风控', hc: 18, avgBase: 62, avgBonus: 22, avgEquity: 13, avgBenefit: 16, avgTotal: 113, note: '新增 AI 安全红队 + 监管沙盒对接，首席合规官 250 万',
            staffDetail: [
              { title: '首席合规官', count: 1, level: 'P9', annualPkg: 250, duties: ['AI 治理战略制定与监管沙盒申请', '与银保监会/人行直接沟通', 'AI 伦理委员会主席'], aiLeverage: 'AI 辅助监管政策追踪 + 合规报告自动生成' },
              { title: '高级合规专家', count: 3, level: 'P8', annualPkg: 180, duties: ['Agent 合规框架制定（操作权限/审批流程/回滚机制）', '监管沙盒实验设计与报告', '跨机构联邦学习合规审查'], aiLeverage: 'AI 辅助合规检查清单生成 + 政策变更影响分析' },
              { title: 'AI 安全红队成员', count: 4, level: 'P7', annualPkg: 130, duties: ['Agent 安全攻防测试（越狱/注入/社工/权限逃逸）', 'Agent 决策安全评估（资金操作/敏感信息/合规性）', '安全漏洞报告与修复建议'], aiLeverage: 'AI 辅助攻击向量生成 + 自动化安全扫描' },
              { title: '风控模型审计师', count: 5, level: 'P6-P7', annualPkg: 100, duties: ['Agent 决策审计（操作合规性/风险评估/可解释性）', '模型公平性/偏见检测', '联邦模型效果审计'], aiLeverage: 'AI 自动化偏见检测 + 审计报告生成' },
              { title: 'AI 伦理与数据治理专员', count: 5, level: 'P6', annualPkg: 65, duties: ['Agent 输出内容安全审查', '训练数据合规审查', '数据分类分级与权限管理', '隐私计算合规验证'], aiLeverage: 'AI 自动扫描 95% 内容安全问题' },
            ] },
          { role: 'PMO/项目管理', hc: 10, avgBase: 50, avgBonus: 16, avgEquity: 6, avgBenefit: 13, avgTotal: 85, note: 'Agent 项目群管理 + OKR 对齐 + 跨 BU 协调',
            staffDetail: [
              { title: '高级项目总监', count: 1, level: 'P8', annualPkg: 140, duties: ['AI 部门项目组合管理（20+ 并行项目）', '与各 BU VP 对齐 OKR 与资源', '项目管理方法论制定与优化'], aiLeverage: 'AI 自动生成项目组合报告 + 资源冲突预警' },
              { title: '高级项目经理', count: 3, level: 'P7', annualPkg: 110, duties: ['Agent 项目群管理（风控/客服/理财/合规/Copilot）', '跨 BU 协调与冲突解决', '项目风险管理与应急预案'], aiLeverage: 'AI 自动生成周报 + 风险预警 + 排期优化建议' },
              { title: '项目经理', count: 5, level: 'P6', annualPkg: 72, duties: ['各 Agent 项目交付管理', '需求排期与迭代计划', '跨团队联调协调', '项目文档与会议纪要'], aiLeverage: '会议纪要 AI 自动生成，甘特图自动更新' },
              { title: '项目协调员', count: 1, level: 'P5-P6', annualPkg: 55, duties: ['日常事务跟进与催办', '项目数据统计与报表', '供应商对接与合同管理'], aiLeverage: 'AI 自动催办 + 报表生成' },
            ] },
          { role: '运维/SRE', hc: 12, avgBase: 52, avgBonus: 17, avgEquity: 7, avgBenefit: 13, avgTotal: 89, note: 'Agent 平台 SLA 99.99% + 模型灰度发布 + 故障自愈',
            staffDetail: [
              { title: '高级 SRE 架构师', count: 2, level: 'P8', annualPkg: 150, duties: ['Agent 平台 SLA 99.99% 架构设计', '三地两中心灾备架构', '故障自愈系统设计（自动降级/切换/恢复）'], aiLeverage: 'AI 自动化根因分析 + 容量预测 + 故障预测' },
              { title: 'SRE 工程师', count: 4, level: 'P7', annualPkg: 110, duties: ['Agent 服务 SLA 监控与保障', '模型灰度发布与回滚机制', '容量规划与成本优化', '故障应急响应与复盘'], aiLeverage: 'AI 自动化告警降噪 + 根因分析 + 修复建议' },
              { title: 'AI 平台运维工程师', count: 4, level: 'P6', annualPkg: 75, duties: ['GPU 集群运维（H100/H200 + 液冷）', 'Agent 运行时平台运维', '联邦学习平台运维', 'CI/CD 流水线维护'], aiLeverage: '运维脚本 90% AI 生成，告警 85% AI 自动处理' },
              { title: '基础设施运维工程师', count: 2, level: 'P6', annualPkg: 68, duties: ['网络/存储/机房基础设施运维', 'K8s 集群管理与扩缩容', '备份恢复与灾备演练'], aiLeverage: 'K8s 配置 AI 自动生成 + 异常自愈脚本 AI 编写' },
            ] },
        ],
        salaryTotal: 20113,
        salaryNote: '人均成本较 Y2 上浮 10-15%（Agent 方向人才稀缺溢价 + 股权激励加码 + P9 级首席科学家引入）。算法:工程 ≈ 1:2.3，运维/SRE 扩编保障 Agent 稳定性',
      },
      infra: {
        total: 7000,
        breakdown: [
          { item: 'GPU 训练集群', spec: 'H100 集群扩至 128 卡 + 新增 H200 试点', cost: 2500, note: 'Agent 训练需要大量 RL 算力' },
          { item: 'GPU 推理集群', spec: 'L40S/H100 推理池 200+ 卡', cost: 1500, note: '多 Agent 并发推理，QPS 目标 2000' },
          { item: '存储 & 向量库', spec: '扩至 3PB + Milvus 集群 ×3', cost: 600, note: '全行知识库 + Agent 记忆存储' },
          { item: '网络 & 机房', spec: '新增机柜 6 个 + 800Gbps 骨干', cost: 500, note: '支撑实时风控 <50ms 延迟' },
          { item: '隐私计算集群', spec: 'TEE ×16 + MPC ×8 + 同态加密试点', cost: 700, note: '联盟扩展至 5+ 机构' },
          { item: 'Agent 运行时平台', spec: '自研 Agent 编排引擎 + 沙箱', cost: 400, note: '工具调用 + 安全隔离 + 审计日志' },
          { item: '灾备 & 高可用', spec: '三地两中心架构', cost: 500, note: '金融核心系统要求 99.99% 可用性' },
          { item: '电力 & 制冷', spec: '液冷全覆盖 + 绿电采购', cost: 300, note: 'ESG 要求，PUE 目标 <1.25' },
        ],
      },
      vendor: {
        total: 1500,
        breakdown: [
          { item: '国产大模型 & Agent 框架授权', cost: 350, note: '私有化 Agent 框架 + 模型持续升级（行内全链路闭环，零数据外泄）' },
          { item: '隐私计算平台', cost: 300, note: '同态加密加速库 + 联盟管理平台' },
          { item: '外部数据源', cost: 350, note: '实时行情 + 另类数据 + 全球舆情' },
          { item: '安全 & 红队测试', cost: 250, note: 'AI 安全攻防测试 + 渗透测试' },
          { item: '咨询/审计/培训', cost: 250, note: '监管沙盒申请 + 年度审计 + Agent 安全培训' },
        ],
      },
      revenue: {
        savingsTotal: 12000,
        savingsBreakdown: [
          { source: '客服人力替代', amount: 5200, calc: '替代 65% 坐席 ≈ 390 人 × 5.5 万 + 端到端业务办理节省柜面人力 3000 万', confidence: '高' },
          { source: '风控损失降低', amount: 3500, calc: '欺诈损失率降至 0.05%，年交易额 ¥1 万亿 × 0.1% 降幅 = 10 亿 × 保守取 35%', confidence: '中' },
          { source: '内部 Copilot 提效', amount: 2000, calc: '全行 5000+ 员工使用，人均提效 15% ≈ 等效节省 750 人年 × 平均 26 万', confidence: '中' },
          { source: '合规自动化', amount: 1300, calc: '监管报告 + 合同审查 + 营销审核全自动化，节省 40 人年', confidence: '高' },
        ],
        revenueTotal: 5000,
        revenueBreakdown: [
          { source: 'AI 理财 AUM 佣金', amount: 2500, calc: 'AI 管理 AUM ¥200 亿 × 管理费 0.5% × 分成 25%', confidence: '中' },
          { source: '联邦风控服务费', amount: 1000, calc: '5 家联盟 × 年服务费 200 万', confidence: '高' },
          { source: '集团生态输出', amount: 1000, calc: '平安保险/证券/信托 AI 中台服务费', confidence: '高' },
          { source: 'Agent SaaS 试点', amount: 500, calc: '2 家中小银行试点 × 250 万/年', confidence: '低' },
        ],
        revenueNote: '营收定义：① 节省成本 = AI 替代人工的等效薪资 + 业务损失降低金额；② 增量营收 = AI 产品/服务直接产生的新增收入（含内部结算 + 外部客户付费）',
      },
    },
    {
      year: 'Y4（2029）', title: '生态输出', color: '#e17055',
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
        total: 220,
        breakdown: [
          { role: 'ML/算法研究', hc: 32, avgBase: 95, avgBonus: 38, avgEquity: 35, avgBenefit: 19, avgTotal: 187, note: '新增模型商业化 + 行业解决方案架构师，P8+ 12 人（均 320 万），P9 2 人（均 450 万）',
            staffDetail: [
              { title: '首席科学家（P9）', count: 2, level: 'P9', annualPkg: 450, duties: ['行业大模型技术路线制定', '对外技术品牌建设（论文/专利/行业标准）', '前沿技术探索（世界模型/自主决策/多智能体）'], aiLeverage: 'AI 辅助论文调研 + 专利检索自动化' },
              { title: '高级算法专家（P8+）', count: 5, level: 'P8+', annualPkg: 330, duties: ['SaaS 化模型适配（多租户/个性化微调/数据隔离）', '行业垂直模型训练（信贷/保险/证券/信托）', '模型商业化方案设计（定价/SLA/交付标准）'], aiLeverage: 'AutoML 承担 80% 超参搜索，AI 辅助方案文档生成' },
              { title: '高级算法工程师（P8）', count: 5, level: 'P8', annualPkg: 280, duties: ['Agent 自主决策能力升级（复杂推理/多步规划）', '联邦学习算法优化（10+ 机构规模化）', '模型安全对齐持续迭代'], aiLeverage: 'AI 辅助实验设计 + 自动化 ablation study' },
              { title: '算法工程师（P7）', count: 12, level: 'P7', annualPkg: 200, duties: ['各行业垂直模型微调与评测', '模型蒸馏/量化/部署优化', 'Agent 各场景持续迭代', '数据飞轮闭环优化'], aiLeverage: '实验代码 80% AI 生成，重复性工作全部自动化' },
              { title: '初级算法工程师（P6）', count: 8, level: 'P6', annualPkg: 120, duties: ['评测数据集构建与维护', '开源模型跟踪与对比', '技术文档与实验报告', 'AB 实验数据分析'], aiLeverage: 'AI 生成 90% 代码 + 报告自动生成' },
            ] },
          { role: '工程开发', hc: 75, avgBase: 65, avgBonus: 24, avgEquity: 15, avgBenefit: 17, avgTotal: 121, note: '新增 SaaS 平台 + 多租户架构团队，P8 架构师 220 万+',
            staffDetail: [
              { title: '首席架构师（P8+）', count: 3, level: 'P8+', annualPkg: 240, duties: ['SaaS 多租户架构设计（数据隔离/资源隔离/计费）', 'Agent 平台 SaaS 化改造', '全行 AI 中台架构演进'], aiLeverage: 'AI 辅助架构文档 + 性能分析自动化' },
              { title: 'SaaS 平台工程师', count: 10, level: 'P6-P7', annualPkg: 115, duties: ['多租户管理平台开发（租户管理/配额/计费）', 'API Gateway 与鉴权系统', '租户数据隔离与迁移工具', 'SaaS 运营后台开发'], aiLeverage: 'Copilot 生成 80% 基础代码' },
              { title: 'Agent 框架工程师', count: 8, level: 'P7', annualPkg: 145, duties: ['Agent 框架 SaaS 化（多租户 Agent 实例管理）', 'Agent 编排引擎持续优化', 'Agent 安全沙箱升级', 'Agent 评测平台商业化'], aiLeverage: 'AI 辅助框架设计 + 自动化测试' },
              { title: 'AI 平台工程师', count: 12, level: 'P6-P7', annualPkg: 115, duties: ['推理引擎多租户化（资源隔离/弹性扩缩容）', '模型服务网格升级', '训练平台 SaaS 化', 'GPU 资源池化与智能调度'], aiLeverage: 'Copilot 生成 80% 基础代码' },
              { title: '数据工程师', count: 10, level: 'P6-P7', annualPkg: 110, duties: ['多租户数据管道', '数据资产平台开发', '数据血缘与质量监控', '联邦学习数据通道运维'], aiLeverage: 'SQL/Spark 代码 90% AI 生成' },
              { title: '后端工程师', count: 18, level: 'P6-P7', annualPkg: 105, duties: ['各 Agent 后端持续迭代', 'SaaS 客户定制化接口开发', '集团子公司 AI 中台对接', '行业解决方案后端开发'], aiLeverage: 'CRUD 代码 95% AI 生成' },
              { title: '前端工程师', count: 8, level: 'P6-P7', annualPkg: 100, duties: ['SaaS 管理控制台', 'Agent 交互界面 SaaS 化', '客户定制化前端', '数据可视化大屏'], aiLeverage: '组件代码 90% AI 生成' },
              { title: '可观测性工程师', count: 6, level: 'P6-P7', annualPkg: 110, duties: ['多租户可观测性平台', 'SaaS SLA 监控与报告', 'Agent 决策审计平台升级', '成本分摊与计费系统'], aiLeverage: 'AI 自动化根因分析 + 异常模式识别' },
            ] },
          { role: '产品/业务分析', hc: 28, avgBase: 60, avgBonus: 21, avgEquity: 12, avgBenefit: 15, avgTotal: 108, note: '新增商业化产品 + 行业解决方案 PM + 售前方案，产品VP 200 万+',
            staffDetail: [
              { title: '产品 VP', count: 1, level: 'P9', annualPkg: 220, duties: ['AI 产品商业化战略', '集团生态输出产品规划', '行业解决方案产品矩阵'], aiLeverage: 'AI 辅助市场分析 + 竞品追踪' },
              { title: '高级产品经理', count: 5, level: 'P7-P8', annualPkg: 140, duties: ['SaaS 产品线负责人', '行业解决方案产品设计', '商业化定价与 GTM 策略'], aiLeverage: 'AI 辅助竞品分析 + PRD 自动生成' },
              { title: '产品经理', count: 8, level: 'P6-P7', annualPkg: 95, duties: ['各 Agent 产品持续迭代', 'SaaS 客户需求管理', '产品文档与培训材料'], aiLeverage: '产品文档 85% AI 起草' },
              { title: 'AI 产品运营', count: 4, level: 'P6', annualPkg: 80, duties: ['SaaS 客户运营', '内部 Agent 推广与培训', '运营数据监控'], aiLeverage: 'AI 自动生成运营报告' },
              { title: '业务架构师', count: 4, level: 'P7', annualPkg: 130, duties: ['行业解决方案业务架构', '客户业务流程→Agent 方案映射', '跨行业最佳实践沉淀'], aiLeverage: 'AI 辅助业务流程分析' },
              { title: '业务分析师', count: 6, level: 'P6', annualPkg: 75, duties: ['Agent 效果数据分析', 'SaaS 客户使用数据分析', '季度业务复盘'], aiLeverage: 'AI 自动生成分析报告' },
            ] },
          { role: '测试/QA', hc: 14, avgBase: 46, avgBonus: 15, avgEquity: 5, avgBenefit: 13, avgTotal: 79, note: 'SaaS 多租户测试 + 安全合规测试 + 自动化回归',
            staffDetail: [
              { title: '测试架构师', count: 1, level: 'P8', annualPkg: 130, duties: ['SaaS 多租户测试策略', '自动化测试平台架构', '测试质量标准制定'], aiLeverage: 'AI 自动生成测试策略 + 覆盖率分析' },
              { title: 'Agent 测试工程师', count: 5, level: 'P6-P7', annualPkg: 80, duties: ['Agent 端到端测试', 'SaaS 多租户隔离测试', 'Agent 性能与稳定性测试'], aiLeverage: '测试用例 85% AI 自动生成' },
              { title: '系统集成测试工程师', count: 4, level: 'P6', annualPkg: 68, duties: ['SaaS 客户环境联调', '多租户数据隔离验证', '性能压测与容量规划'], aiLeverage: '测试脚本 90% AI 生成' },
              { title: '安全合规测试工程师', count: 4, level: 'P6-P7', annualPkg: 82, duties: ['SaaS 安全测试（等保三级/SOC2）', 'Agent 安全红队测试', '隐私计算安全验证', '客户数据隔离安全审计'], aiLeverage: 'AI 辅助漏洞扫描 + 合规检查自动化' },
            ] },
          { role: '数据标注/分析', hc: 10, avgBase: 40, avgBonus: 11, avgEquity: 0, avgBenefit: 13, avgTotal: 64, note: '数据飞轮自动化，标注团队转型为质检，数据科学家 95 万+',
            staffDetail: [
              { title: '数据科学家', count: 5, level: 'P7', annualPkg: 100, duties: ['数据飞轮效果分析与优化', '多租户数据质量监控', 'Agent 行为数据挖掘', '行业数据资产评估'], aiLeverage: 'AI 自动生成分析报告 + 异常检测' },
              { title: '数据质检专家', count: 3, level: 'P6', annualPkg: 55, duties: ['标注质量审核（从标注转型为质检）', 'RLHF 数据质量评估', '数据飞轮质量闭环'], aiLeverage: 'AI 自动检测 95% 质量问题，质检专注于边界 case' },
              { title: '数据标注专员（外包）', count: 2, level: '外包', annualPkg: 25, duties: ['行业垂直语料标注', '模型输出质量评分', '新场景数据构造'], aiLeverage: 'AI 预标注 + 人工校验，标注效率提升 5 倍' },
            ] },
          { role: '合规/风控', hc: 25, avgBase: 65, avgBonus: 24, avgEquity: 15, avgBenefit: 17, avgTotal: 121, note: '新增行业标准制定 + 外部合规咨询，首席合规官 280 万',
            staffDetail: [
              { title: '首席合规官', count: 1, level: 'P9', annualPkg: 280, duties: ['AI 治理行业标准参与制定', '与银保监会/人行政策沟通', 'AI 伦理委员会主席'], aiLeverage: 'AI 辅助政策追踪 + 标准文档生成' },
              { title: '高级合规专家', count: 4, level: 'P8', annualPkg: 190, duties: ['SaaS 合规框架（等保/SOC2/ISO27001）', '行业标准制定参与', '外部合规咨询输出'], aiLeverage: 'AI 辅助合规检查 + 标准文档生成' },
              { title: 'AI 安全红队', count: 4, level: 'P7', annualPkg: 135, duties: ['SaaS 平台安全攻防', 'Agent 安全持续测试', '安全漏洞报告与修复'], aiLeverage: 'AI 辅助攻击向量生成 + 自动化扫描' },
              { title: '风控模型审计师', count: 6, level: 'P6-P7', annualPkg: 105, duties: ['多租户模型审计', 'Agent 决策合规审计', '联邦模型效果审计'], aiLeverage: 'AI 自动化审计报告生成' },
              { title: 'AI 伦理与数据治理', count: 5, level: 'P6', annualPkg: 70, duties: ['SaaS 客户数据合规', '内容安全过滤', '数据分类分级', '隐私计算合规'], aiLeverage: 'AI 自动扫描 95% 问题' },
              { title: '外部合规咨询师', count: 5, level: 'P7', annualPkg: 120, duties: ['为 SaaS 客户提供 AI 合规咨询', '帮助客户通过监管审查', '行业合规最佳实践输出'], aiLeverage: 'AI 辅助合规方案生成 + 政策解读' },
            ] },
          { role: 'PMO/项目管理', hc: 12, avgBase: 52, avgBonus: 17, avgEquity: 7, avgBenefit: 13, avgTotal: 89, note: '商业化项目交付 + 客户成功管理 + SaaS 运营',
            staffDetail: [
              { title: '高级项目总监', count: 1, level: 'P8', annualPkg: 150, duties: ['商业化项目组合管理', '客户成功体系建设', 'SaaS 运营指标管理'], aiLeverage: 'AI 自动生成项目组合报告' },
              { title: '高级项目经理', count: 3, level: 'P7', annualPkg: 115, duties: ['SaaS 客户交付项目管理', '集团子公司对接项目管理', '联邦联盟项目协调'], aiLeverage: 'AI 自动生成周报 + 风险预警' },
              { title: '客户成功经理', count: 3, level: 'P6-P7', annualPkg: 90, duties: ['SaaS 客户 onboarding', '客户健康度监控', '续约与增购推动'], aiLeverage: 'AI 自动生成客户健康报告 + 流失预警' },
              { title: '项目经理', count: 4, level: 'P6', annualPkg: 72, duties: ['各项目交付管理', '需求排期与迭代计划', '项目文档与会议纪要'], aiLeverage: '会议纪要 AI 自动生成' },
              { title: '项目协调员', count: 1, level: 'P5-P6', annualPkg: 55, duties: ['日常事务跟进', '报表制作', '供应商对接'], aiLeverage: 'AI 自动催办 + 报表生成' },
            ] },
          { role: '运维/SRE', hc: 14, avgBase: 55, avgBonus: 18, avgEquity: 8, avgBenefit: 14, avgTotal: 95, note: 'SaaS 平台 SLA + 多租户运维 + 7×24 值班',
            staffDetail: [
              { title: '高级 SRE 架构师', count: 2, level: 'P8', annualPkg: 160, duties: ['SaaS 多租户 SLA 架构', '全球化灾备架构设计', '成本优化与容量规划'], aiLeverage: 'AI 自动化根因分析 + 容量预测' },
              { title: 'SRE 工程师', count: 4, level: 'P7', annualPkg: 115, duties: ['SaaS 平台 SLA 监控与保障', '多租户资源隔离与调度', '故障应急响应（7×24 轮值）'], aiLeverage: 'AI 自动化告警降噪 + 根因分析' },
              { title: 'AI 平台运维工程师', count: 5, level: 'P6', annualPkg: 78, duties: ['GPU 集群运维（多租户）', 'SaaS 推理服务运维', '联邦学习平台运维', 'CI/CD 流水线维护'], aiLeverage: '运维脚本 90% AI 生成，告警 90% AI 自动处理' },
              { title: '基础设施运维工程师', count: 3, level: 'P6', annualPkg: 70, duties: ['混合云基础设施运维', 'K8s 多集群管理', '备份恢复与灾备演练', '电力/液冷系统维护'], aiLeverage: 'K8s 配置 AI 自动生成 + 异常自愈' },
            ] },
          { role: '解决方案/售前', hc: 10, avgBase: 58, avgBonus: 20, avgEquity: 10, avgBenefit: 15, avgTotal: 103, note: '行业解决方案设计 + 客户 POC + 技术售前，高级 150 万+',
            staffDetail: [
              { title: '解决方案总监', count: 1, level: 'P8', annualPkg: 170, duties: ['行业解决方案体系建设', '大客户方案评审与把关', '解决方案团队管理'], aiLeverage: 'AI 辅助方案模板生成 + 行业案例库自动整理' },
              { title: '高级解决方案架构师', count: 3, level: 'P7', annualPkg: 130, duties: ['金融行业 AI 解决方案设计（风控/客服/理财/合规）', '客户 POC 方案设计与实施', '技术方案答辩与投标支持'], aiLeverage: 'AI 辅助方案文档生成 + 技术方案自动化排版' },
              { title: '技术售前工程师', count: 4, level: 'P6-P7', annualPkg: 95, duties: ['客户需求调研与分析', '产品 Demo 演示与定制', '技术方案编写与报价', '竞品分析与差异化定位'], aiLeverage: 'AI 辅助需求分析 + Demo 环境自动搭建 + 方案文档 80% AI 生成' },
              { title: '售前协调员', count: 2, level: 'P6', annualPkg: 65, duties: ['客户拜访安排与跟进', '投标文档整理与提交', '合同条款协调', '客户关系维护'], aiLeverage: 'AI 辅助投标文档生成 + 合同关键条款提取' },
            ] },
        ],
        salaryTotal: 26282,
        salaryNote: '人均成本较 Y3 上浮 8-12%（商业化人才溢价 + 行业专家引入 + P9 级人才扩编）。新增解决方案/售前团队支撑商业化输出',
      },
      infra: {
        total: 8500,
        breakdown: [
          { item: 'GPU 训练集群', spec: 'H200 集群 256 卡 + 下一代 GPU 试点', cost: 2800, note: '支撑行业大模型持续迭代' },
          { item: 'GPU 推理集群', spec: '推理池 400+ 卡（含 SaaS 租户）', cost: 2000, note: '多租户推理隔离 + 弹性扩缩容' },
          { item: '存储 & 数据湖', spec: '5PB + 多租户数据隔离', cost: 800, note: 'SaaS 客户数据物理隔离' },
          { item: '网络 & 多云', spec: '混合云架构 + 专线互联', cost: 600, note: '支撑 10+ 联盟机构低延迟通信' },
          { item: '隐私计算集群', spec: 'TEE ×24 + MPC ×12 + HE 加速卡', cost: 800, note: '联盟规模化运营' },
          { item: 'SaaS 平台基础设施', spec: '多租户 K8s + API Gateway + 计费', cost: 600, note: '商业化平台基础设施' },
          { item: '灾备 & 合规', spec: '金融云合规认证 + 等保三级', cost: 500, note: '外部客户要求的合规基线' },
          { item: '电力 & 绿电', spec: '绿电占比 >50% + 碳中和路径', cost: 400, note: 'ESG 报告要求' },
        ],
      },
      vendor: {
        total: 2000,
        breakdown: [
          { item: '国产大模型企业版 & 行业适配', cost: 400, note: '私有化部署持续升级 + 行业垂直模型授权（客户 demo 环境独立隔离）' },
          { item: '隐私计算 & 安全', cost: 400, note: '联盟管理 + 密码学加速 + 安全审计' },
          { item: '外部数据源', cost: 400, note: '全球金融数据 + ESG 数据 + 另类数据' },
          { item: '合规 & 认证', cost: 400, note: '等保认证 + SOC2 + ISO27001 + 年度审计' },
          { item: '市场 & BD', cost: 400, note: '行业峰会 + 客户拓展 + 品牌建设' },
        ],
      },
      revenue: {
        savingsTotal: 22000,
        savingsBreakdown: [
          { source: '客服人力替代', amount: 7500, calc: '替代 75% 坐席 + 全渠道 AI 覆盖，节省 500+ 人年', confidence: '高' },
          { source: '风控损失降低', amount: 6000, calc: '欺诈损失率降至 0.04%，年交易额 ¥1.2 万亿 × 0.11% 降幅', confidence: '中' },
          { source: '内部 Copilot 提效', amount: 5000, calc: '全行 8000+ 员工使用，人均提效 25%', confidence: '中' },
          { source: '合规 & 运营自动化', amount: 3500, calc: '全链路自动化，节省 100+ 人年', confidence: '高' },
        ],
        revenueTotal: 12000,
        revenueBreakdown: [
          { source: 'AI 理财 AUM 佣金', amount: 4000, calc: 'AI 管理 AUM ¥400 亿 × 管理费 0.5% × 分成 20%', confidence: '中' },
          { source: '联邦风控服务费', amount: 2000, calc: '10 家联盟 × 年服务费 200 万', confidence: '高' },
          { source: '集团生态输出', amount: 2500, calc: '5 家子公司 × 平均 500 万/年', confidence: '高' },
          { source: 'SaaS 平台收入', amount: 2500, calc: '8 家中小银行 × 平均 300 万/年', confidence: '中' },
          { source: '行业解决方案', amount: 1000, calc: '定制化项目 3-5 个 × 200-300 万', confidence: '低' },
        ],
        revenueNote: '营收定义：① 节省成本 = AI 替代人工的等效薪资 + 业务损失降低金额；② 增量营收 = AI 产品/服务直接产生的新增收入（含内部结算 + 外部客户付费）',
      },
    },
    {
      year: 'Y5（2030）', title: 'AI 原生银行', color: '#ffa657',
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
        total: 250,
        breakdown: [
          { role: 'ML/算法研究', hc: 35, avgBase: 100, avgBonus: 40, avgEquity: 38, avgBenefit: 20, avgTotal: 198, note: '含 15 名 P8+ 专家（均 350 万），3 名 P9（均 500 万），首席科学家 1 人（600 万）',
            staffDetail: [
              { title: '首席科学家（P10）', count: 1, level: 'P10', annualPkg: 600, duties: ['AI 原生银行技术愿景制定', '行业标准制定核心参与', '对外技术品牌（顶会/专利/行业白皮书）'], aiLeverage: 'AI 辅助前沿技术追踪 + 专利检索，专注于战略判断' },
              { title: '首席科学家（P9）', count: 3, level: 'P9', annualPkg: 500, duties: ['各技术方向负责人（Agent/多模态/安全对齐/世界模型）', '行业大模型持续迭代技术路线', '前沿技术探索与产业化'], aiLeverage: 'AI 辅助论文调研 + 实验方案自动生成' },
              { title: '高级算法专家（P8+）', count: 6, level: 'P8+', annualPkg: 360, duties: ['AI 原生银行核心算法（80% 交互 AI 化）', '全球化模型适配（多语言/多地区合规）', '下一代 Agent 架构（自主决策/世界模型）'], aiLeverage: 'AutoML 承担 85% 超参搜索' },
              { title: '高级算法工程师（P8）', count: 5, level: 'P8', annualPkg: 290, duties: ['行业垂直模型持续迭代', '模型安全对齐（量子安全试点）', '数据飞轮闭环优化'], aiLeverage: 'AI 辅助实验设计 + 自动化 ablation study' },
              { title: '算法工程师（P7）', count: 12, level: 'P7', annualPkg: 205, duties: ['各场景 Agent 持续优化', '模型蒸馏/量化/部署优化', '全球化模型适配', '评测体系维护'], aiLeverage: '实验代码 85% AI 生成' },
              { title: '初级算法工程师（P6）', count: 8, level: 'P6', annualPkg: 125, duties: ['评测数据集维护', '开源模型跟踪', '技术文档', 'AB 实验分析'], aiLeverage: 'AI 生成 95% 代码 + 报告自动生成' },
            ] },
          { role: '工程开发', hc: 82, avgBase: 68, avgBonus: 25, avgEquity: 16, avgBenefit: 18, avgTotal: 127, note: '平台成熟，重心转向运维 + 优化，P8 架构师 250 万+',
            staffDetail: [
              { title: '首席架构师（P8+）', count: 4, level: 'P8+', annualPkg: 260, duties: ['AI 原生银行技术架构', '全球化多区域部署架构', '下一代 Agent 平台架构'], aiLeverage: 'AI 辅助架构文档 + 性能分析' },
              { title: 'Agent 框架工程师', count: 8, level: 'P7', annualPkg: 150, duties: ['Agent 框架持续演进', '自主决策引擎开发', 'Agent 安全沙箱升级', 'Agent 评测平台全球化'], aiLeverage: 'AI 辅助框架设计 + 自动化测试' },
              { title: 'SaaS 平台工程师', count: 10, level: 'P6-P7', annualPkg: 120, duties: ['全球化多区域 SaaS 平台', '多租户管理平台持续优化', '计费与结算系统', '客户自助服务平台'], aiLeverage: 'Copilot 生成 85% 基础代码' },
              { title: 'AI 平台工程师', count: 12, level: 'P6-P7', annualPkg: 120, duties: ['推理引擎持续优化', '边缘推理节点部署', '模型服务网格全球化', 'GPU 资源智能调度'], aiLeverage: 'Copilot 生成 85% 基础代码' },
              { title: '数据工程师', count: 10, level: 'P6-P7', annualPkg: 115, duties: ['全行数据资产平台', '多区域数据同步', '数据血缘与质量监控', '联邦学习数据通道'], aiLeverage: 'SQL/Spark 代码 95% AI 生成' },
              { title: '后端工程师', count: 20, level: 'P6-P7', annualPkg: 110, duties: ['各 Agent 后端持续迭代', '全球化 API 适配', '行业解决方案后端', '集团生态对接'], aiLeverage: 'CRUD 代码 95% AI 生成' },
              { title: '前端工程师', count: 10, level: 'P6-P7', annualPkg: 105, duties: ['全球化多语言前端', 'Agent 交互界面持续优化', '数据可视化大屏', '客户自助门户'], aiLeverage: '组件代码 95% AI 生成' },
              { title: '可观测性工程师', count: 8, level: 'P6-P7', annualPkg: 115, duties: ['全球化可观测性平台', '多区域 SLA 监控', 'Agent 决策审计全球化', '成本分摊与优化'], aiLeverage: 'AI 自动化根因分析 + 异常模式识别' },
            ] },
          { role: '产品/业务分析', hc: 30, avgBase: 62, avgBonus: 22, avgEquity: 13, avgBenefit: 15, avgTotal: 112, note: '商业化产品矩阵完善 + 行业咨询输出，CPO 级 250 万+',
            staffDetail: [
              { title: 'CPO（首席产品官）', count: 1, level: 'P10', annualPkg: 280, duties: ['AI 产品战略与商业化全局', '行业咨询输出', '产品团队管理'], aiLeverage: 'AI 辅助市场分析 + 竞品追踪' },
              { title: '高级产品经理', count: 5, level: 'P7-P8', annualPkg: 150, duties: ['各产品线负责人', '全球化产品适配', '行业解决方案产品化'], aiLeverage: 'AI 辅助竞品分析 + PRD 自动生成' },
              { title: '产品经理', count: 8, level: 'P6-P7', annualPkg: 100, duties: ['各 Agent 产品迭代', '客户需求管理', '产品文档与培训'], aiLeverage: '产品文档 90% AI 起草' },
              { title: 'AI 产品运营', count: 4, level: 'P6', annualPkg: 85, duties: ['全球化产品运营', '客户增长策略', '运营数据监控'], aiLeverage: 'AI 自动生成运营报告' },
              { title: '业务架构师', count: 6, level: 'P7', annualPkg: 130, duties: ['行业解决方案架构', '全球化业务适配', '最佳实践沉淀与输出'], aiLeverage: 'AI 辅助业务流程分析' },
              { title: '业务分析师', count: 6, level: 'P6', annualPkg: 75, duties: ['Agent 效果分析', '客户使用数据分析', '业务复盘报告'], aiLeverage: 'AI 自动生成分析报告' },
            ] },
          { role: '测试/QA', hc: 15, avgBase: 48, avgBonus: 16, avgEquity: 6, avgBenefit: 13, avgTotal: 83, note: '全平台自动化测试 + AI 安全攻防测试 + 合规验证',
            staffDetail: [
              { title: '测试架构师', count: 2, level: 'P8', annualPkg: 135, duties: ['全球化测试策略', '自动化测试平台架构', 'AI 安全测试体系'], aiLeverage: 'AI 自动生成测试策略' },
              { title: 'Agent 测试工程师', count: 5, level: 'P6-P7', annualPkg: 85, duties: ['Agent 端到端测试', '全球化场景测试', 'Agent 性能测试'], aiLeverage: '测试用例 90% AI 自动生成' },
              { title: '系统集成测试工程师', count: 4, level: 'P6', annualPkg: 70, duties: ['全球化环境联调', '多区域数据一致性测试', '性能压测'], aiLeverage: '测试脚本 95% AI 生成' },
              { title: '安全合规测试工程师', count: 4, level: 'P6-P7', annualPkg: 85, duties: ['全球合规测试（各地监管）', 'AI 安全红队测试', '量子安全测试试点'], aiLeverage: 'AI 辅助漏洞扫描 + 合规检查自动化' },
            ] },
          { role: '数据标注/分析', hc: 10, avgBase: 42, avgBonus: 12, avgEquity: 0, avgBenefit: 14, avgTotal: 68, note: '以数据质量治理为主，标注高度自动化，首席数据官 200 万+',
            staffDetail: [
              { title: '首席数据官', count: 1, level: 'P8', annualPkg: 200, duties: ['全行数据资产战略', '数据质量治理体系', '数据合规与安全'], aiLeverage: 'AI 辅助数据资产评估 + 质量报告自动生成' },
              { title: '数据科学家', count: 5, level: 'P7', annualPkg: 100, duties: ['数据飞轮效果分析', '全球化数据质量监控', 'Agent 行为数据挖掘', '数据资产价值评估'], aiLeverage: 'AI 自动生成分析报告 + 异常检测' },
              { title: '数据质检专家', count: 2, level: 'P6', annualPkg: 60, duties: ['标注质量审核', 'RLHF 数据质量评估', '数据飞轮质量闭环'], aiLeverage: 'AI 自动检测 98% 质量问题' },
              { title: '数据标注专员（外包）', count: 2, level: '外包', annualPkg: 25, duties: ['新场景数据构造', '模型输出质量评分'], aiLeverage: 'AI 预标注 + 人工校验，标注效率提升 6 倍' },
            ] },
          { role: '合规/风控', hc: 30, avgBase: 68, avgBonus: 26, avgEquity: 16, avgBenefit: 18, avgTotal: 128, note: '行业标准制定 + 外部咨询输出，首席合规官 300 万+',
            staffDetail: [
              { title: '首席合规官', count: 1, level: 'P9', annualPkg: 320, duties: ['AI 治理行业标准主导制定', '银保监会"AI 治理示范银行"认证推动', 'AI 伦理委员会主席'], aiLeverage: 'AI 辅助政策追踪 + 标准文档生成' },
              { title: '高级合规专家', count: 5, level: 'P8', annualPkg: 200, duties: ['全球合规框架（各地监管适配）', '行业标准制定核心参与', '外部合规咨询品牌建设'], aiLeverage: 'AI 辅助合规检查 + 标准文档生成' },
              { title: 'AI 安全红队', count: 5, level: 'P7', annualPkg: 140, duties: ['全球化 AI 安全攻防', 'Agent 安全持续测试', '量子安全试点评估'], aiLeverage: 'AI 辅助攻击向量生成 + 自动化扫描' },
              { title: '风控模型审计师', count: 7, level: 'P6-P7', annualPkg: 110, duties: ['全球化模型审计', 'Agent 决策合规审计', '行业标准合规验证'], aiLeverage: 'AI 自动化审计报告生成' },
              { title: 'AI 伦理与数据治理', count: 5, level: 'P6', annualPkg: 70, duties: ['全球化数据合规', '内容安全过滤', '数据分类分级'], aiLeverage: 'AI 自动扫描 98% 问题' },
              { title: '外部合规咨询师', count: 7, level: 'P7', annualPkg: 125, duties: ['全球化 AI 合规咨询输出', '帮助客户通过各地监管审查', '行业合规白皮书编写'], aiLeverage: 'AI 辅助合规方案生成 + 多语言政策解读' },
            ] },
          { role: 'PMO/项目管理', hc: 14, avgBase: 55, avgBonus: 18, avgEquity: 8, avgBenefit: 14, avgTotal: 95, note: '全球化项目交付 + 行业标准项目管理',
            staffDetail: [
              { title: '高级项目总监', count: 1, level: 'P8', annualPkg: 160, duties: ['全球化项目组合管理', '行业标准项目管理', '客户成功体系全球化'], aiLeverage: 'AI 自动生成项目组合报告' },
              { title: '高级项目经理', count: 4, level: 'P7', annualPkg: 120, duties: ['全球化客户交付', '行业标准项目协调', '跨区域项目管理'], aiLeverage: 'AI 自动生成周报 + 风险预警' },
              { title: '客户成功经理', count: 4, level: 'P6-P7', annualPkg: 95, duties: ['全球化客户 onboarding', '客户健康度监控', '续约与增购'], aiLeverage: 'AI 自动生成客户健康报告' },
              { title: '项目经理', count: 4, level: 'P6', annualPkg: 75, duties: ['各项目交付管理', '需求排期', '项目文档'], aiLeverage: '会议纪要 AI 自动生成' },
              { title: '项目协调员', count: 1, level: 'P5-P6', annualPkg: 58, duties: ['日常事务跟进', '报表制作', '供应商对接'], aiLeverage: 'AI 自动催办 + 报表生成' },
            ] },
          { role: '运维/SRE', hc: 18, avgBase: 58, avgBonus: 20, avgEquity: 9, avgBenefit: 14, avgTotal: 101, note: '全球化 SaaS 运维 + 7×24 NOC + 自动化运维平台',
            staffDetail: [
              { title: '高级 SRE 架构师', count: 3, level: 'P8', annualPkg: 170, duties: ['全球化 SLA 架构', '多地域灾备架构', '自动化运维平台架构'], aiLeverage: 'AI 自动化根因分析 + 容量预测' },
              { title: 'SRE 工程师', count: 5, level: 'P7', annualPkg: 120, duties: ['全球化 SLA 监控与保障', '多区域故障应急（7×24 NOC）', '容量规划与成本优化'], aiLeverage: 'AI 自动化告警降噪 + 根因分析' },
              { title: 'AI 平台运维工程师', count: 6, level: 'P6', annualPkg: 80, duties: ['全球化 GPU 集群运维', 'SaaS 推理服务运维', '边缘推理节点运维', 'CI/CD 流水线维护'], aiLeverage: '运维脚本 95% AI 生成，告警 95% AI 自动处理' },
              { title: '基础设施运维工程师', count: 4, level: 'P6', annualPkg: 72, duties: ['全球化基础设施运维', 'K8s 多集群管理', '备份恢复与灾备演练', '绿电与碳中和监控'], aiLeverage: 'K8s 配置 AI 自动生成 + 异常自愈' },
            ] },
          { role: '解决方案/售前', hc: 16, avgBase: 62, avgBonus: 22, avgEquity: 12, avgBenefit: 15, avgTotal: 111, note: '行业解决方案 + 全球化售前 + 客户成功，高级 160 万+',
            staffDetail: [
              { title: '解决方案总监', count: 2, level: 'P8', annualPkg: 180, duties: ['全球化解决方案体系', '大客户方案评审', '行业白皮书编写'], aiLeverage: 'AI 辅助方案模板 + 案例库自动整理' },
              { title: '高级解决方案架构师', count: 5, level: 'P7', annualPkg: 140, duties: ['全球化金融 AI 解决方案', '大客户 POC 方案设计', '技术方案答辩与投标'], aiLeverage: 'AI 辅助方案文档生成 + 多语言适配' },
              { title: '技术售前工程师', count: 5, level: 'P6-P7', annualPkg: 100, duties: ['全球化客户需求调研', '产品 Demo 演示', '技术方案编写与报价', '竞品分析'], aiLeverage: 'AI 辅助需求分析 + Demo 自动搭建 + 方案 85% AI 生成' },
              { title: '售前协调员', count: 4, level: 'P6', annualPkg: 70, duties: ['全球化客户拜访安排', '投标文档整理', '合同条款协调', '客户关系维护'], aiLeverage: 'AI 辅助投标文档 + 多语言翻译 + 合同条款提取' },
            ] },
        ],
        salaryTotal: 31393,
        salaryNote: '人均成本较 Y4 上浮 6-10%（行业成熟期涨幅趋缓，但顶尖人才溢价持续走高）。算法:工程 ≈ 1:2.3，解决方案/售前团队扩至 16 人支撑全球化输出',
      },
      infra: {
        total: 9500,
        breakdown: [
          { item: 'GPU 训练集群', spec: '下一代 GPU 512 卡集群', cost: 3000, note: '持续迭代行业大模型 + 世界模型探索' },
          { item: 'GPU 推理集群', spec: '推理池 600+ 卡 + 边缘推理节点', cost: 2500, note: '80% 交互量的 AI 推理支撑' },
          { item: '存储 & 数据湖', spec: '8PB + 全行数据资产平台', cost: 900, note: '数据资产化运营' },
          { item: '网络 & 多云', spec: '全球化网络 + 多云灾备', cost: 700, note: '支撑海外业务拓展' },
          { item: '隐私计算集群', spec: '联盟级隐私计算网络', cost: 800, note: '10+ 机构常态化联合计算' },
          { item: 'SaaS & 商业化', spec: '多区域部署 + 全球化架构', cost: 700, note: '商业化平台全球化' },
          { item: '灾备 & 合规', spec: '全球合规 + 多地域灾备', cost: 500, note: '满足各地监管要求' },
          { item: '电力 & 绿电', spec: '绿电占比 >80% + 碳中和', cost: 400, note: '实现 AI 算力碳中和' },
        ],
      },
      vendor: {
        total: 2500,
        breakdown: [
          { item: '国产大模型 & 工具链生态', cost: 500, note: '私有化模型持续迭代 + Agent 工具链 + 行业垂直模型（全链路国产化，满足信创要求）' },
          { item: '隐私计算 & 安全', cost: 500, note: '联盟运营 + 密码学前沿 + 量子安全试点' },
          { item: '外部数据源', cost: 500, note: '全球金融数据全覆盖' },
          { item: '合规 & 认证', cost: 500, note: '全球合规认证 + 行业标准维护' },
          { item: '市场 & 品牌', cost: 500, note: '行业标杆品牌建设 + 国际会议' },
        ],
      },
      revenue: {
        savingsTotal: 35000,
        savingsBreakdown: [
          { source: '客服人力替代', amount: 12000, calc: '替代 80% 坐席 + 全渠道全时段 AI 覆盖，节省 800+ 人年 × 平均 6 万 + 场地/设备节省 7200 万', confidence: '高' },
          { source: '风控损失降低', amount: 10000, calc: '欺诈损失率降至 0.03%，年交易额 ¥1.5 万亿 × 0.12% 降幅 = 18 亿 × 保守取 55%', confidence: '中' },
          { source: '内部 Copilot 提效', amount: 8000, calc: '全行 10000+ 员工使用，人均提效 30%，等效节省 3000 人年', confidence: '中' },
          { source: '合规 & 运营自动化', amount: 5000, calc: '全链路端到端自动化，节省 150+ 人年 + 罚款风险降低', confidence: '高' },
        ],
        revenueTotal: 25000,
        revenueBreakdown: [
          { source: 'AI 理财 AUM 佣金', amount: 6250, calc: 'AI 管理 AUM ¥500 亿 × 管理费 0.5% × 分成 25%', confidence: '中' },
          { source: '联邦风控服务费', amount: 3000, calc: '15 家联盟 × 年服务费 200 万', confidence: '高' },
          { source: '集团生态输出', amount: 4000, calc: '8 家子公司 × 平均 500 万/年', confidence: '高' },
          { source: 'SaaS 平台收入', amount: 7500, calc: '20 家银行/金融机构 × 平均 375 万/年', confidence: '中' },
          { source: '行业解决方案 & 咨询', amount: 2500, calc: '定制项目 8-10 个 × 250-350 万', confidence: '中' },
          { source: '数据资产变现', amount: 1750, calc: '脱敏数据产品 + 行业报告 + 指数产品', confidence: '低' },
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

      {/* ═══════════ 2. 五年阶段总览时间线 ═══════════ */}
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
                <div className="text-[12px] text-gray-500 mb-2 italic">{p.focus}</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {p.goals.map((g, i) => (
                    <div key={i} className="flex gap-2 text-[12px] text-gray-600">
                      <span style={{ color: p.color }}>▸</span><span>{g}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-2 text-[11px] font-mono px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-100">
                  <span className="text-gray-400">KPI：</span><span className="text-gray-700">{p.kpi}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════ 3. 人力成本精细拆解 ═══════════ */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="text-base font-semibold text-gray-800 mb-2">👥 人力成本精细拆解（万元/人/年）</h3>
        <p className="text-[11px] text-gray-400 mb-4 leading-relaxed">
          💡 <strong>人力总成本公式</strong>：年度人力成本 = Σ（各岗位人数 × 人均年包）。
          人均年包 = 基本工资 + 绩效奖金（0-8 个月） + 股权/RSU（按年摊销） + 综合福利。
          <strong>综合福利构成</strong>：五险一金（约占基本工资 22-25%）+ 补充商业保险（1.5-2.5 万/人/年）+ 工位租金（一线城市 3-5 万/人/年）+ 餐补交通补（2-3 万/人/年）+ 团建差旅（1-2 万/人/年）+ 年度体检/节日福利（0.5-1 万/人/年）。
          P8+ 专家年包 250 万起（对标 2026 年北上深头部金融科技市场价），P9 级 400-500 万，首席科学家 600 万+。
          <strong>岗位配比</strong>：算法:工程 ≈ 1:2.3~2.5（银行重落地特点），另设测试/QA、PMO、运维/SRE、解决方案/售前等保障岗位。
          <strong>合规说明</strong>：银行数据不可出境，禁止调用境外商业模型 API（GPT-4/Claude 等），统一采用国产大模型私有化部署（文心一言/通义千问/GLM 企业版）。
        </p>
        {phases.map((p, pi) => (
          <div key={p.year} className="mb-5 last:mb-0">
            <div className="flex items-center gap-2 mb-2 cursor-pointer" onClick={() => setExpandedCost(expandedCost === pi ? null : pi)}>
              <span className="text-xs font-mono font-bold" style={{ color: p.color }}>{p.year} {p.title}</span>
              <span className="text-[11px] text-gray-500">| 总人数 {p.headcount.total} 人 | 人力总成本 ¥{p.headcount.salaryTotal.toLocaleString()} 万</span>
              <span className="text-[10px] text-gray-400 ml-auto">{expandedCost === pi ? '▼ 收起' : '▶ 展开明细'}</span>
            </div>
            {expandedCost === pi && (
              <div className="overflow-x-auto">
                <table className="w-full text-[11.5px] mb-2">
                  <thead>
                    <tr className="text-left text-gray-400 border-b border-gray-100">
                      <th className="py-1.5 pr-2 font-medium">岗位</th>
                      <th className="py-1.5 pr-2 font-medium text-center">人数</th>
                      <th className="py-1.5 pr-2 font-medium text-right">基本工资</th>
                      <th className="py-1.5 pr-2 font-medium text-right">绩效奖金</th>
                      <th className="py-1.5 pr-2 font-medium text-right">股权激励</th>
                      <th className="py-1.5 pr-2 font-medium text-right">五险一金/福利</th>
                      <th className="py-1.5 pr-2 font-medium text-right">人均年包</th>
                      <th className="py-1.5 pr-2 font-medium text-right">小计</th>
                      <th className="py-1.5 font-medium">备注</th>
                    </tr>
                  </thead>
                  <tbody>
                    {p.headcount.breakdown.map((r, ri) => {
                      const staffKey = `${p.year}-${r.role}`;
                      const isStaffExpanded = expandedStaff === staffKey;
                      return (
                      <React.Fragment key={r.role}>
                      <tr className={`${ri % 2 === 0 ? 'bg-gray-50/40' : ''} ${r.staffDetail ? 'cursor-pointer hover:bg-blue-50/40 transition-colors' : ''}`}
                          onClick={() => r.staffDetail && setExpandedStaff(isStaffExpanded ? null : staffKey)}>
                        <td className="py-1.5 pr-2 font-medium text-gray-700">
                          {r.staffDetail && <span className="text-[9px] text-blue-400 mr-1">{isStaffExpanded ? '▼' : '▶'}</span>}
                          {r.role}
                        </td>
                        <td className="py-1.5 pr-2 text-center text-gray-800 font-semibold">{r.hc}</td>
                        <td className="py-1.5 pr-2 text-right text-gray-600 font-mono">{r.avgBase}</td>
                        <td className="py-1.5 pr-2 text-right text-gray-600 font-mono">{r.avgBonus}</td>
                        <td className="py-1.5 pr-2 text-right text-gray-600 font-mono">{r.avgEquity}</td>
                        <td className="py-1.5 pr-2 text-right text-gray-600 font-mono">{r.avgBenefit}</td>
                        <td className="py-1.5 pr-2 text-right text-gray-800 font-mono font-semibold">{r.avgTotal}</td>
                        <td className="py-1.5 pr-2 text-right text-gray-800 font-mono font-bold">¥{(r.hc * r.avgTotal).toLocaleString()}</td>
                        <td className="py-1.5 text-[10px] text-gray-400 max-w-[200px]">{r.note}</td>
                      </tr>
                      {/* 二级展开：人员细分 */}
                      {isStaffExpanded && r.staffDetail && (
                        <tr>
                          <td colSpan={9} className="p-0">
                            <div className="bg-gradient-to-r from-blue-50/60 to-indigo-50/40 border-l-2 border-blue-300 mx-2 my-1 rounded-lg p-3">
                              <div className="text-[10px] font-semibold text-blue-600 mb-2">👤 {r.role} · 人员细分（{r.hc} 人）· AI 时代工作方式</div>
                              <div className="space-y-2.5">
                                {r.staffDetail.map((s, si) => (
                                  <div key={si} className="bg-white/80 rounded-lg p-2.5 border border-blue-100/60">
                                    <div className="flex items-center gap-2 mb-1.5">
                                      <span className="text-[11px] font-bold text-gray-800">{s.title}</span>
                                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-mono">{s.level}</span>
                                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 font-mono">×{s.count}人</span>
                                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 font-mono">¥{s.annualPkg}万/人</span>
                                    </div>
                                    <div className="flex gap-3">
                                      <div className="flex-1 min-w-0">
                                        <div className="text-[9px] text-gray-400 font-medium mb-0.5">📋 核心职责</div>
                                        <ul className="text-[10px] text-gray-600 space-y-0.5">
                                          {s.duties.map((d, di) => (
                                            <li key={di} className="flex items-start gap-1">
                                              <span className="text-gray-300 mt-0.5 shrink-0">•</span>
                                              <span>{d}</span>
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                      <div className="w-[280px] shrink-0">
                                        <div className="text-[9px] text-purple-400 font-medium mb-0.5">🤖 AI 赋能方式</div>
                                        <div className="text-[10px] text-purple-600 bg-purple-50/60 rounded px-2 py-1 leading-relaxed">{s.aiLeverage}</div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                      </React.Fragment>
                      );
                    })}
                    <tr className="border-t border-gray-200 bg-gray-50">
                      <td className="py-1.5 pr-2 font-bold text-gray-800">合计</td>
                      <td className="py-1.5 pr-2 text-center font-bold text-gray-800">{p.headcount.total}</td>
                      <td colSpan={5} className="py-1.5 pr-2 text-right text-[10px] text-gray-400 italic">{p.headcount.salaryNote}</td>
                      <td className="py-1.5 pr-2 text-right font-bold text-gray-900 font-mono">¥{p.headcount.salaryTotal.toLocaleString()}</td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
            {/* 简略行（未展开时） */}
            {expandedCost !== pi && (
              <div className="flex gap-3 text-[11px] text-gray-500 flex-wrap">
                {p.headcount.breakdown.map(r => (
                  <span key={r.role} className="px-2 py-0.5 rounded bg-gray-50 border border-gray-100">
                    {r.role} <span className="font-semibold text-gray-700">{r.hc}人</span> × <span className="font-mono">¥{r.avgTotal}万</span> = <span className="font-mono font-semibold">¥{(r.hc * r.avgTotal).toLocaleString()}万</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
        {/* 五年人力成本汇总 */}
        <div className="mt-4 p-3 rounded-xl bg-purple-50/40 border border-purple-100 text-[12px]">
          <span className="font-semibold text-purple-700">📊 五年人力成本汇总：</span>
          <span className="text-gray-600 ml-1">
            ¥{phases.map(p => p.headcount.salaryTotal).join(' → ¥')} 万，
            五年合计 <span className="font-bold text-gray-800">¥{phases.reduce((s, p) => s + p.headcount.salaryTotal, 0).toLocaleString()} 万</span>
            （约 ¥{(phases.reduce((s, p) => s + p.headcount.salaryTotal, 0) / 10000).toFixed(1)} 亿）
          </span>
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

      {/* ═══════════ 5. 外部采购明细 ═══════════ */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="text-base font-semibold text-gray-800 mb-2">🤝 外部采购明细（万元）</h3>
        <p className="text-[11px] text-gray-400 mb-4">
          外部采购 = 商业模型 API + 隐私计算平台授权 + 外部数据源订阅 + 咨询审计 + 培训认证 + 市场BD。
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
              const cumRoi = ((d.cumReturn - d.cumInvest) / d.cumInvest * 100).toFixed(0);
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
                  <td className={`py-2 text-right font-mono font-bold ${Number(cumRoi) >= 0 ? 'text-green-600' : 'text-red-500'}`}>{Number(cumRoi) >= 0 ? '+' : ''}{cumRoi}%</td>
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
          <span className="font-bold text-green-700">累计 ROI ≈ +{((cumData[4].cumReturn - cumData[4].cumInvest) / cumData[4].cumInvest * 100).toFixed(0)}%</span>。
          Y3 年底接近盈亏平衡，Y4 起进入正向回报期。
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
