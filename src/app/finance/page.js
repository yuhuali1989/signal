'use client';

import { useState } from 'react';
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
          { role: 'ML/算法', hc: 25, avgBase: 72, avgBonus: 25, avgEquity: 18, avgBenefit: 15, avgTotal: 130, note: '含 3 名 P8+ 专家（年包 250-350 万），P7 均 180 万，P6 均 100 万' },
          { role: '工程开发', hc: 30, avgBase: 55, avgBonus: 18, avgEquity: 8, avgBenefit: 14, avgTotal: 95, note: '含 AI 平台 12 人 + 数据工程 10 人 + 前端 8 人，高级 130 万+' },
          { role: '产品经理', hc: 10, avgBase: 48, avgBonus: 15, avgEquity: 6, avgBenefit: 13, avgTotal: 82, note: '含 2 名高级产品（年包 120 万+），中级 65 万' },
          { role: '数据标注/分析', hc: 12, avgBase: 32, avgBonus: 8, avgEquity: 0, avgBenefit: 10, avgTotal: 50, note: '含外包标注团队 5 人（外包 25 万/人），数据分析师 70 万' },
          { role: '合规/风控', hc: 8, avgBase: 55, avgBonus: 18, avgEquity: 8, avgBenefit: 14, avgTotal: 95, note: '需持有 FRM/CFA 等资质，高级合规 150 万+' },
        ],
        salaryTotal: 8280,
        salaryNote: '人力总成本 = Σ(各岗位人数 × 人均年包)。年包 = 基本工资 + 绩效奖金(0-8个月) + 股权/RSU(按年摊销) + 综合福利(五险一金 + 商业保险 + 工位租金 3-5万/人 + 餐补交通补 2-3万 + 团建差旅 1-2万)',
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
          { item: '商业模型 API', cost: 200, note: 'GPT-4 / Claude API 用于 baseline 对比 + 数据标注辅助' },
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
          { role: 'ML/算法', hc: 40, avgBase: 78, avgBonus: 28, avgEquity: 22, avgBenefit: 17, avgTotal: 145, note: '新增 NLP/多模态/强化学习方向，P8+ 5 人（均 280 万），P7 均 190 万' },
          { role: '工程开发', hc: 45, avgBase: 58, avgBonus: 20, avgEquity: 10, avgBenefit: 15, avgTotal: 103, note: '新增 Agent 框架 + 推理优化团队，高级架构师 150 万+' },
          { role: '产品经理', hc: 15, avgBase: 52, avgBonus: 17, avgEquity: 8, avgBenefit: 13, avgTotal: 90, note: '各业务线配备专属产品，高级产品总监 130 万+' },
          { role: '数据标注/分析', hc: 18, avgBase: 35, avgBonus: 9, avgEquity: 0, avgBenefit: 11, avgTotal: 55, note: '扩充金融领域标注专家，数据分析师 75 万' },
          { role: '合规/风控', hc: 12, avgBase: 58, avgBonus: 20, avgEquity: 10, avgBenefit: 15, avgTotal: 103, note: '新增 AI 伦理审查岗，高级合规专家 160 万+' },
        ],
        salaryTotal: 14011,
        salaryNote: '人均成本较 Y1 上浮 8-12%（市场薪资涨幅 + 高级人才引入 + 办公福利成本上升）',
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
          { item: '商业模型 API', cost: 300, note: '多模态模型 API + 评测基准' },
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
          { role: 'ML/算法', hc: 55, avgBase: 85, avgBonus: 32, avgEquity: 28, avgBenefit: 18, avgTotal: 163, note: '新增 Agent/强化学习/世界模型方向，P8+ 8 人（均 300 万），P9 首席科学家 400 万' },
          { role: '工程开发', hc: 60, avgBase: 62, avgBonus: 22, avgEquity: 13, avgBenefit: 16, avgTotal: 113, note: '新增 Agent 编排 + 可观测性团队，P8 架构师 200 万+' },
          { role: '产品经理', hc: 20, avgBase: 55, avgBonus: 18, avgEquity: 10, avgBenefit: 14, avgTotal: 97, note: '新增 AI 产品运营 + 用户增长，产品VP 180 万+' },
          { role: '数据标注/分析', hc: 25, avgBase: 38, avgBonus: 10, avgEquity: 0, avgBenefit: 12, avgTotal: 60, note: '引入 RLHF 标注专家团队，数据科学家 90 万+' },
          { role: '合规/风控', hc: 20, avgBase: 62, avgBonus: 22, avgEquity: 13, avgBenefit: 16, avgTotal: 113, note: '新增 AI 安全红队 + 监管沙盒对接，首席合规官 250 万' },
        ],
        salaryTotal: 21445,
        salaryNote: '人均成本较 Y2 上浮 10-15%（Agent 方向人才稀缺溢价 + 股权激励加码 + P9 级首席科学家引入）',
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
          { item: '商业模型 API', cost: 350, note: 'Agent 评测 + 复杂推理 baseline' },
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
          { role: 'ML/算法', hc: 65, avgBase: 90, avgBonus: 35, avgEquity: 32, avgBenefit: 19, avgTotal: 176, note: '新增模型商业化 + 行业解决方案架构师，P8+ 12 人（均 320 万），P9 2 人（均 450 万）' },
          { role: '工程开发', hc: 70, avgBase: 65, avgBonus: 24, avgEquity: 15, avgBenefit: 17, avgTotal: 121, note: '新增 SaaS 平台 + 多租户架构团队，P8 架构师 220 万+' },
          { role: '产品经理', hc: 25, avgBase: 58, avgBonus: 20, avgEquity: 12, avgBenefit: 15, avgTotal: 105, note: '新增商业化产品 + 行业解决方案 PM，产品VP 200 万+' },
          { role: '数据标注/分析', hc: 30, avgBase: 40, avgBonus: 11, avgEquity: 0, avgBenefit: 13, avgTotal: 64, note: '数据飞轮自动化，标注团队转型为质检，数据科学家 95 万+' },
          { role: '合规/风控', hc: 30, avgBase: 65, avgBonus: 24, avgEquity: 15, avgBenefit: 17, avgTotal: 121, note: '新增行业标准制定 + 外部合规咨询，首席合规官 280 万' },
        ],
        salaryTotal: 28085,
        salaryNote: '人均成本较 Y3 上浮 8-12%（商业化人才溢价 + 行业专家引入 + P9 级人才扩编）',
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
          { item: '商业模型 API', cost: 400, note: '行业 benchmark + 客户 demo 环境' },
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
          { role: 'ML/算法', hc: 75, avgBase: 95, avgBonus: 38, avgEquity: 36, avgBenefit: 20, avgTotal: 189, note: '含 15 名 P8+ 专家（均 350 万），3 名 P9（均 500 万），首席科学家 1 人（600 万）' },
          { role: '工程开发', hc: 80, avgBase: 68, avgBonus: 25, avgEquity: 16, avgBenefit: 18, avgTotal: 127, note: '平台成熟，重心转向运维 + 优化，P8 架构师 250 万+' },
          { role: '产品经理', hc: 28, avgBase: 60, avgBonus: 22, avgEquity: 13, avgBenefit: 15, avgTotal: 110, note: '商业化产品矩阵完善，CPO 级 250 万+' },
          { role: '数据标注/分析', hc: 32, avgBase: 42, avgBonus: 12, avgEquity: 0, avgBenefit: 14, avgTotal: 68, note: '以数据质量治理为主，标注高度自动化，首席数据官 200 万+' },
          { role: '合规/风控', hc: 35, avgBase: 68, avgBonus: 26, avgEquity: 16, avgBenefit: 18, avgTotal: 128, note: '行业标准制定 + 外部咨询输出，首席合规官 300 万+' },
        ],
        salaryTotal: 34071,
        salaryNote: '人均成本较 Y4 上浮 6-10%（行业成熟期涨幅趋缓，但顶尖人才溢价持续走高）',
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
          { item: '商业模型 & 工具', cost: 500, note: '前沿模型评测 + 工具链生态' },
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
                    {p.headcount.breakdown.map((r, ri) => (
                      <tr key={r.role} className={ri % 2 === 0 ? 'bg-gray-50/40' : ''}>
                        <td className="py-1.5 pr-2 font-medium text-gray-700">{r.role}</td>
                        <td className="py-1.5 pr-2 text-center text-gray-800 font-semibold">{r.hc}</td>
                        <td className="py-1.5 pr-2 text-right text-gray-600 font-mono">{r.avgBase}</td>
                        <td className="py-1.5 pr-2 text-right text-gray-600 font-mono">{r.avgBonus}</td>
                        <td className="py-1.5 pr-2 text-right text-gray-600 font-mono">{r.avgEquity}</td>
                        <td className="py-1.5 pr-2 text-right text-gray-600 font-mono">{r.avgBenefit}</td>
                        <td className="py-1.5 pr-2 text-right text-gray-800 font-mono font-semibold">{r.avgTotal}</td>
                        <td className="py-1.5 pr-2 text-right text-gray-800 font-mono font-bold">¥{(r.hc * r.avgTotal).toLocaleString()}</td>
                        <td className="py-1.5 text-[10px] text-gray-400 max-w-[200px]">{r.note}</td>
                      </tr>
                    ))}
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
