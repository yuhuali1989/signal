'use client';

import { useState } from 'react';
import Footer from '@/components/Footer';

const TABS = [
  { id: 'llm',     name: '大模型应用', icon: '🧠', desc: '银行 / 券商 / 保险三大场景的 LLM 落地' },
  { id: 'privacy', name: '隐私计算原理', icon: '🔐', desc: 'FL · HE · MPC · TEE 四大技术路线' },
  { id: 'scene',   name: '金融场景应用', icon: '🏦', desc: '隐私计算在金融的真实落地与大模型交叉' },
  { id: 'case',    name: '标杆案例',   icon: '🔭', desc: '蚂蚁 / 微众 / 摩根士丹利 / 高盛' },
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
              银行 · 大模型 · 隐私计算
            </span>
          </div>
          <p className="text-sm text-gray-500">
            金融行业大模型落地主线 + 隐私计算四大技术（FL / HE / MPC / TEE）的原理与场景应用
          </p>
          <p className="text-xs text-gray-400 mt-1 leading-relaxed max-w-3xl">
            金融行业对"数据不出域"和"合规可追溯"有极高要求，大模型能否落地高度依赖
            <span className="font-mono text-gray-500"> 联邦学习 / 同态加密 / MPC / TEE </span>
            等隐私计算技术。本模块把两条主线并列讲清楚：
            <span className="text-gray-600">LLM 在金融的应用</span>
            &nbsp;×&nbsp;
            <span className="text-gray-600">隐私计算原理与落地</span>。
          </p>
        </div>

        {/* 核心亮点 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mb-8">
          {[
            { icon: '🧠', label: '投研助手', desc: '研报摘要',     color: '#6c5ce7' },
            { icon: '💬', label: '智能客服', desc: 'RAG 知识库',    color: '#00cec9' },
            { icon: '🛡️', label: '风控反欺诈', desc: 'Graph+LLM', color: '#e17055' },
            { icon: '🔐', label: '联邦学习', desc: '多方联合建模',  color: '#3fb950' },
            { icon: '🧮', label: '同态加密', desc: '密文推理',      color: '#a29bfe' },
            { icon: '🏛️', label: 'TEE 可信执行', desc: 'SGX/TDX', color: '#ffa657' },
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

        <p className="text-xs text-gray-400 mb-6">
          {TABS.find(t => t.id === tab)?.desc}
        </p>

        {tab === 'llm'     && <LlmSection />}
        {tab === 'privacy' && <PrivacySection />}
        {tab === 'scene'   && <SceneSection />}
        {tab === 'case'    && <CaseSection />}

        <div className="mt-10 p-4 bg-gray-50 rounded-2xl border border-gray-100 text-xs text-gray-400 leading-relaxed">
          <span className="font-medium text-gray-500">📌 说明：</span>
          金融行业的核心矛盾是"数据价值"与"数据合规"。大模型带来巨大价值空间，
          但真正的落地必须与隐私计算结合。后续迭代会加入"密文推理性能对比图"、
          "联邦 LoRA 微调仿真器"和"金融监管政策时间线"。
        </div>
      </div>
      <Footer />
    </>
  );
}

/* ────────────────── 大模型应用 ────────────────── */
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
    </div>
  );
}

/* ────────────────── 隐私计算原理 ────────────────── */
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
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="text-base font-semibold text-gray-800 mb-3">⚖️ 四大技术横向对比</h3>
        <div className="overflow-x-auto">
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
    </div>
  );
}

/* ────────────────── 金融场景应用 ────────────────── */
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

/* ────────────────── 标杆案例 ────────────────── */
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
      name: '建行 / 工行 大模型',
      region: '🇨🇳 中国',
      focus: '国有行自研大模型 + 多场景铺开',
      fact: '建行"方舟"、工行"工银智涌"、交行"天擎"：在客服、研发、反洗钱等多场景内测或上线',
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
  );
}
