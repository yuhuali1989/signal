// ═══════════════════════════════════════════════════════════════
// 平台产品团队未来规划 — 数据定义
// ═══════════════════════════════════════════════════════════════

// 1. AI Coding & Agent 时代下的软件行业困境
export const INDUSTRY_CRISIS = {
  title: 'AI Coding & Agent 时代的软件行业困境',
  subtitle: '当 AI 能写 80% 的代码，软件团队的价值锚点在哪里？',
  timeline: [
    { year: '2022', event: 'GitHub Copilot 发布', impact: '代码补全效率 +55%', icon: '🚀', color: '#79c0ff' },
    { year: '2023', event: 'GPT-4 + Cursor 爆发', impact: '初级开发任务被替代 30%+', icon: '⚡', color: '#ffa657' },
    { year: '2024', event: 'Devin / SWE-Agent / OpenHands', impact: 'AI Agent 独立完成 Issue → PR', icon: '🤖', color: '#e17055' },
    { year: '2025', event: 'Claude Code / Codex / Gemini CLI', impact: '端到端自主编码 Agent 成熟', icon: '🧠', color: '#6c5ce7' },
    { year: '2026+', event: 'Multi-Agent 协作 + 自我进化', impact: '软件开发范式根本性重构', icon: '🌐', color: '#3fb950' },
  ],
  crises: [
    {
      id: 'commoditization',
      name: '代码商品化',
      icon: '📉',
      color: '#e17055',
      severity: '🔴 致命',
      desc: '当 AI 能在几分钟内生成高质量代码，"写代码"本身不再是稀缺能力。传统按人天计费的外包/项目制模式面临崩塌。',
      evidence: [
        'Cursor + Claude 组合可在 30 分钟内完成过去 3 天的 CRUD 开发',
        'Devin 在 SWE-bench 上解决 13.86% 的真实 GitHub Issue（2024）→ 2025 年已超 40%',
        'Google 内部 25%+ 新代码由 AI 生成（2025 Q1 财报披露）',
        'Meta 报告 AI 辅助代码审查覆盖率达 50%+',
      ],
      affected: ['外包公司', '初级开发者', '标准化 SaaS', '低复杂度项目团队'],
    },
    {
      id: 'talent_shift',
      name: '人才结构断裂',
      icon: '👥',
      color: '#ffa657',
      severity: '🔴 致命',
      desc: '初级岗位需求骤降，但高级架构师/AI 工程师严重短缺。传统"初级→中级→高级"的成长路径被打断。',
      evidence: [
        '2025 年全球科技公司初级开发岗位招聘量同比下降 35%（LinkedIn 数据）',
        'AI/ML 工程师薪资涨幅 25%+，传统后端开发薪资持平或下降',
        '大量中级开发者面临"向上突破难、向下被替代"的夹心困境',
        'Prompt Engineering 从热门岗位到被 Agent 自动化，生命周期不到 2 年',
      ],
      affected: ['初级开发者', '培训机构', '传统 IT 教育', '人力外包'],
    },
    {
      id: 'value_erosion',
      name: '产品价值侵蚀',
      icon: '💸',
      color: '#fd79a8',
      severity: '🟡 严重',
      desc: '用户可以用 AI 快速搭建"够用"的替代品，标准化软件产品的护城河被削弱。SaaS 订阅模式面临挑战。',
      evidence: [
        '用户用 Cursor 在 2 小时内复刻简单 SaaS 产品的核心功能',
        'Vercel v0 / Bolt.new 让非技术人员也能生成可用的 Web 应用',
        'AI 生成的一次性工具替代了大量轻量级 SaaS 订阅',
        'Open Source + AI 组合进一步压缩商业软件空间',
      ],
      affected: ['轻量级 SaaS', '工具类产品', '低壁垒平台', '标准化解决方案'],
    },
    {
      id: 'complexity_explosion',
      name: '复杂度爆炸',
      icon: '🌀',
      color: '#6c5ce7',
      severity: '🟡 严重',
      desc: 'AI 生成代码的速度远超人类理解和维护的速度，系统复杂度指数级增长。技术债务积累加速。',
      evidence: [
        'AI 生成的代码缺乏统一架构思想，不同 Agent 产出的代码风格割裂',
        '代码量增长 3-5x，但可维护性下降，"AI 写的代码只有 AI 能改"',
        '安全漏洞随 AI 生成代码量线性增长（Snyk 2025 报告）',
        '测试覆盖率与代码生成速度严重脱节',
      ],
      affected: ['大型系统', '金融/医疗等高可靠性领域', '长期维护项目', '安全敏感系统'],
    },
    {
      id: 'differentiation_collapse',
      name: '差异化坍缩',
      icon: '🪞',
      color: '#00cec9',
      severity: '🟡 严重',
      desc: '当所有团队都用相同的 AI 工具，产出趋同。技术实现不再是竞争壁垒，"做什么"比"怎么做"更重要。',
      evidence: [
        '多家创业公司用 AI 在同一周内推出几乎相同的产品',
        '技术栈选型趋同（Next.js + Tailwind + Supabase 成为 AI 时代的"标准答案"）',
        'UI/UX 设计也被 AI 标准化，产品外观越来越相似',
        '竞争焦点从技术能力转向领域知识和数据壁垒',
      ],
      affected: ['技术驱动型创业公司', '通用型 SaaS', '缺乏领域壁垒的团队'],
    },
  ],
};

// 2. 全球软件行业破局思路
export const GLOBAL_BREAKOUT = {
  title: '全球软件行业破局思路',
  subtitle: '从"卖代码"到"卖决策"——价值链重构',
  strategies: [
    {
      id: 'palantir',
      name: 'Palantir 模式',
      subtitle: '数据操作系统 + 前线部署',
      icon: '🏛️',
      color: '#6c5ce7',
      marketCap: '$260B+ (2025)',
      revenue: '$2.87B (2024)',
      growth: '+29% YoY',
      keyInsight: '不卖软件，卖"决策能力"。将 AI 嵌入客户的核心业务流程，成为不可替代的操作系统。',
      pillars: [
        { name: 'Ontology（本体论）', desc: '将客户的业务实体、关系、规则建模为统一的数字孪生，AI 在此之上推理', icon: '🧬' },
        { name: 'AIP（AI Platform）', desc: '让大模型直接操作业务数据和流程，而非仅仅对话。LLM → Action', icon: '⚡' },
        { name: 'Forward Deployed Engineer', desc: '工程师驻场客户，深度理解业务后定制解决方案。高触达 + 高粘性', icon: '🪖' },
        { name: 'TITAN（边缘部署）', desc: '将 AI 能力部署到战场/工厂/油田等断网环境，离线自主决策', icon: '🛡️' },
      ],
      moat: '深度业务绑定 + 数据飞轮 + 安全合规壁垒 → 客户迁移成本极高',
    },
    {
      id: 'vertical_ai',
      name: '垂直 AI 深耕',
      subtitle: '领域知识 + AI = 不可替代',
      icon: '🏥',
      color: '#3fb950',
      examples: [
        { company: 'Veeva Systems', domain: '生命科学', desc: '医药行业 CRM + 临床试验管理，FDA 合规壁垒', revenue: '$2.4B' },
        { company: 'Toast', domain: '餐饮', desc: '餐饮全链路（POS + 支付 + 供应链 + AI 排班）', revenue: '$4.0B' },
        { company: 'Procore', domain: '建筑', desc: '建筑项目管理 + AI 安全检测 + 成本预测', revenue: '$1.0B' },
        { company: 'Samsara', domain: '物联网/物流', desc: 'IoT 传感器 + AI 车队管理 + 安全评分', revenue: '$0.9B' },
        { company: 'Waymo / Momenta', domain: '自动驾驶', desc: '数据闭环 + 世界模型 + 端到端驾驶', revenue: '—' },
      ],
      keyInsight: '通用 AI 工具无法替代深度领域知识。垂直场景的数据壁垒 + 合规要求 + 行业 know-how 构成真正的护城河。',
    },
    {
      id: 'platform_play',
      name: '平台生态战略',
      subtitle: '成为 AI Agent 的"操作系统"',
      icon: '🌐',
      color: '#ffa657',
      examples: [
        { company: 'Salesforce (Agentforce)', desc: '企业 AI Agent 平台，Agent 直接操作 CRM 数据和业务流程' },
        { company: 'ServiceNow', desc: 'IT 运维 AI Agent，自动处理工单、变更、事件响应' },
        { company: 'Databricks', desc: '数据 + AI 统一平台，从数据湖到模型训练到部署的全链路' },
        { company: 'Snowflake (Cortex)', desc: '数据云 + AI 推理，让 AI 直接在数据仓库内运行' },
      ],
      keyInsight: '不做 AI 本身，做 AI Agent 运行的基础设施。掌握数据层和工作流层，成为 Agent 时代的"水电煤"。',
    },
    {
      id: 'compound_ai',
      name: '复合 AI 系统',
      subtitle: '从单模型到多 Agent 协作系统',
      icon: '🔗',
      color: '#e17055',
      examples: [
        { company: 'Cognition (Devin)', desc: '多 Agent 协作的 AI 软件工程师，规划→编码→测试→部署' },
        { company: 'Sierra AI', desc: 'AI 客服 Agent，多轮对话 + 业务操作 + 人工升级' },
        { company: 'Harvey AI', desc: '法律 AI Agent，合同审查 + 法规检索 + 风险评估' },
        { company: 'Glean', desc: '企业知识 AI，连接所有内部系统的统一搜索和问答' },
      ],
      keyInsight: '单个 LLM 调用无法解决复杂业务问题。需要多 Agent 编排、工具调用、记忆管理、人机协作的复合系统。',
    },
    {
      id: 'data_moat',
      name: '数据飞轮壁垒',
      subtitle: '数据 → AI → 更好的产品 → 更多数据',
      icon: '🔄',
      color: '#00cec9',
      examples: [
        { company: 'Tesla FSD', desc: '百万辆车的影子模式数据 → 训练 → OTA 更新 → 更多数据' },
        { company: 'Spotify', desc: '用户行为数据 → 推荐算法 → 更长使用时长 → 更多数据' },
        { company: 'Waze', desc: '用户导航数据 → 实时路况 → 更准确导航 → 更多用户' },
        { company: 'Scale AI', desc: '标注数据 → 更好的标注模型 → 更低成本 → 更多客户数据' },
      ],
      keyInsight: '在 AI 时代，数据是唯一不会被 AI 自动生成的稀缺资源。拥有独特数据源的公司拥有真正的护城河。',
    },
  ],
};

// 3. Palantir 模式深度解析
export const PALANTIR_DEEP_DIVE = {
  title: 'Palantir 模式深度解析',
  subtitle: '从"软件公司"到"决策操作系统"的范式转移',
  // 核心产品矩阵
  products: [
    {
      name: 'Foundry',
      target: '商业客户',
      icon: '🏭',
      color: '#3fb950',
      desc: '企业数据操作系统，将分散的数据源统一为可操作的数字孪生',
      layers: [
        { name: 'Data Connection', desc: '200+ 数据源连接器，实时/批量数据接入' },
        { name: 'Pipeline Builder', desc: '可视化数据流水线，代码/低代码混合编排' },
        { name: 'Ontology', desc: '业务对象建模层，定义实体/关系/动作/约束' },
        { name: 'Workshop', desc: '业务用户操作界面，拖拽式决策应用构建' },
        { name: 'AIP', desc: 'LLM 集成层，自然语言 → Ontology 操作 → 业务动作' },
      ],
    },
    {
      name: 'Gotham',
      target: '政府/国防',
      icon: '🛡️',
      color: '#6c5ce7',
      desc: '情报分析与反恐平台，处理 PB 级多源情报数据的关联分析',
      layers: [
        { name: 'Data Integration', desc: 'SIGINT/HUMINT/OSINT/GEOINT 多源情报融合' },
        { name: 'Graph Analysis', desc: '万亿级知识图谱，实体关系推理与模式发现' },
        { name: 'Gaia', desc: '地理空间分析，卫星图像 + 地面传感器 + 轨迹数据' },
        { name: 'TITAN', desc: '边缘部署，断网环境下的自主 AI 推理' },
      ],
    },
    {
      name: 'AIP',
      target: '全客户',
      icon: '⚡',
      color: '#e17055',
      desc: 'AI Platform — 让 LLM 不只是聊天，而是直接操作业务系统',
      layers: [
        { name: 'LLM Orchestration', desc: '多模型编排（GPT-4/Claude/Llama），任务路由' },
        { name: 'Ontology Grounding', desc: 'LLM 输出锚定到 Ontology 对象，消除幻觉' },
        { name: 'Action Framework', desc: 'AI 建议 → 人工审批 → 系统执行的闭环' },
        { name: 'Logic & Guardrails', desc: '业务规则引擎 + 安全护栏，确保 AI 行为合规' },
      ],
    },
  ],
  // Palantir 的核心竞争力
  moats: [
    {
      name: 'Ontology 本体论',
      icon: '🧬',
      color: '#6c5ce7',
      desc: '不是简单的数据库 Schema，而是对客户整个业务世界的数字化建模。包含实体、关系、动作、约束、权限。一旦建立，迁移成本极高。',
      analogy: '如果数据库是"存储"，Ontology 就是"理解"。AI 在 Ontology 之上推理，而非在原始数据上猜测。',
    },
    {
      name: 'Forward Deployed Engineer',
      icon: '🪖',
      color: '#e17055',
      desc: '不是远程支持，而是工程师驻场 6-18 个月，深度理解客户业务后构建解决方案。这种模式看似"不可扩展"，但创造了极高的客户粘性和 NRR（净收入留存率 >115%）。',
      analogy: '传统 SaaS 是"卖工具"，Palantir 是"派军师"。军师走了，但他建立的作战体系留下了。',
    },
    {
      name: '安全合规壁垒',
      icon: '🔒',
      color: '#3fb950',
      desc: 'FedRAMP High / IL5 / IL6 / NATO SECRET 等最高级别安全认证。获取这些认证需要数年时间和数亿美元投入，构成极高的进入壁垒。',
      analogy: '这不是技术壁垒，而是信任壁垒。在国防和情报领域，信任比技术更稀缺。',
    },
    {
      name: '数据网络效应',
      icon: '🔄',
      color: '#ffa657',
      desc: '客户使用越多，Ontology 越丰富 → AI 推理越准确 → 客户越依赖 → 更多数据接入。形成正向飞轮。',
      analogy: '每个客户的 Ontology 都是独一无二的"数字基因组"，随时间指数级增值。',
    },
  ],
  // 财务数据
  financials: {
    revenue: [
      { year: '2020', value: '$1.09B', growth: '+47%' },
      { year: '2021', value: '$1.54B', growth: '+41%' },
      { year: '2022', value: '$1.91B', growth: '+24%' },
      { year: '2023', value: '$2.23B', growth: '+17%' },
      { year: '2024', value: '$2.87B', growth: '+29%' },
      { year: '2025E', value: '$3.75B', growth: '+31%' },
    ],
    metrics: {
      nrr: '>115%',
      govRevenue: '55%',
      commercialRevenue: '45%',
      commercialGrowth: '+54% YoY (2024 Q4)',
      customers: '711 (2024)',
      topCustomerConcentration: '<10%',
      ruleOf40: '68 (2024 Q4)',
    },
  },
};

// 4. 平台产品团队应对框架
export const RESPONSE_FRAMEWORK = {
  title: '平台产品团队应对框架',
  subtitle: '借鉴 Palantir 模式，构建 AI 时代的平台产品竞争力',
  // 核心理念
  philosophy: {
    before: '我们是一个写代码的团队，交付软件产品',
    after: '我们是一个构建"决策操作系统"的团队，交付业务能力',
    shift: '从 Code Factory → Decision Engine',
  },
  // 四层架构
  layers: [
    {
      id: 'data_foundation',
      name: '数据基座层',
      subtitle: 'Data Foundation',
      icon: '🏗️',
      color: '#326ce5',
      palantirRef: 'Foundry Data Connection + Pipeline',
      desc: '构建统一的数据接入、治理和服务能力，成为业务数据的"单一事实来源"',
      capabilities: [
        { name: '统一数据接入', desc: '100+ 数据源连接器，实时/批量/流式，覆盖内部系统 + 外部 API + IoT', tech: 'Kafka · Flink · Airbyte · dbt' },
        { name: '数据湖仓一体', desc: 'Iceberg 格式统一存储，支持 ACID 事务 + 时间旅行 + Schema 演进', tech: 'Iceberg · Trino · Spark · LakeFS' },
        { name: '数据质量闭环', desc: '自动化数据质量检测 + 异常告警 + 血缘追踪 + 影响分析', tech: 'Great Expectations · OpenLineage · Monte Carlo' },
        { name: '特征工程平台', desc: '离线/在线特征统一管理，特征复用率 > 60%，避免重复计算', tech: 'Feast · Tecton · Redis' },
      ],
      metrics: [
        { label: '数据源覆盖', value: '100+', unit: '个' },
        { label: '数据延迟', value: '<5', unit: 'min' },
        { label: '数据质量 SLA', value: '99.5%', unit: '' },
        { label: '特征复用率', value: '>60%', unit: '' },
      ],
    },
    {
      id: 'ontology',
      name: '业务本体层',
      subtitle: 'Business Ontology',
      icon: '🧬',
      color: '#6c5ce7',
      palantirRef: 'Foundry Ontology',
      desc: '将业务领域知识建模为结构化的本体（Ontology），让 AI 在业务语义上推理而非原始数据上猜测',
      capabilities: [
        { name: '实体建模', desc: '定义业务核心对象（用户/订单/设备/场景），属性 + 关系 + 约束', tech: 'Knowledge Graph · Neo4j · RDF' },
        { name: '业务规则引擎', desc: '将领域专家知识编码为可执行规则，AI 输出必须满足规则约束', tech: 'Drools · OPA · Custom DSL' },
        { name: '数字孪生', desc: '业务系统的实时数字镜像，支持 What-if 分析和仿真推演', tech: 'Event Sourcing · CQRS · Simulation' },
        { name: '语义搜索 & 推理', desc: '基于 Ontology 的语义检索和逻辑推理，消除 LLM 幻觉', tech: 'Milvus · LangChain · RAG + KG' },
      ],
      metrics: [
        { label: '业务实体覆盖', value: '200+', unit: '类' },
        { label: '规则库', value: '500+', unit: '条' },
        { label: 'AI 幻觉率', value: '<3%', unit: '' },
        { label: '推理准确率', value: '>95%', unit: '' },
      ],
    },
    {
      id: 'ai_platform',
      name: 'AI 平台层',
      subtitle: 'AI Platform (AIP)',
      icon: '⚡',
      color: '#e17055',
      palantirRef: 'Palantir AIP',
      desc: '让 AI 不只是"聊天"，而是直接操作业务系统。从 LLM → Action 的完整闭环',
      capabilities: [
        { name: 'Multi-Agent 编排', desc: '多 Agent 协作框架，任务分解 → 并行执行 → 结果聚合 → 人工审批', tech: 'LangGraph · CrewAI · AutoGen' },
        { name: 'Tool & API Gateway', desc: 'Agent 可调用的工具注册中心，统一鉴权 + 限流 + 审计 + 回滚', tech: 'MCP · OpenAPI · gRPC · Kong' },
        { name: '安全护栏', desc: 'AI 输出的多层校验：格式 → 业务规则 → 权限 → 人工审批 → 执行', tech: 'Guardrails AI · NeMo · Custom' },
        { name: '持续学习', desc: '用户反馈 → 模型微调 → A/B 测试 → 灰度发布的闭环', tech: 'RLHF · DPO · MLflow · Seldon' },
      ],
      metrics: [
        { label: 'Agent 任务成功率', value: '>90%', unit: '' },
        { label: '平均响应时间', value: '<3', unit: 's' },
        { label: '安全拦截率', value: '>99%', unit: '' },
        { label: '人工干预率', value: '<10%', unit: '' },
      ],
    },
    {
      id: 'decision_app',
      name: '决策应用层',
      subtitle: 'Decision Applications',
      icon: '🎯',
      color: '#3fb950',
      palantirRef: 'Foundry Workshop + AIP Copilot',
      desc: '面向业务用户的决策应用，将底层能力封装为可操作的业务工具',
      capabilities: [
        { name: 'AI Copilot', desc: '嵌入业务流程的 AI 助手，理解上下文 + 建议操作 + 一键执行', tech: 'Chat UI · Streaming · Context Window' },
        { name: '决策仪表盘', desc: '实时业务指标 + AI 异常检测 + 根因分析 + 行动建议', tech: 'Grafana · Superset · Custom Viz' },
        { name: '自动化工作流', desc: 'AI 驱动的业务流程自动化，人工只处理异常和审批', tech: 'Temporal · Airflow · n8n' },
        { name: '场景化应用', desc: '针对具体业务场景的深度定制应用（如智能排班/库存优化/风控）', tech: 'Low-Code · Plugin · Micro Frontend' },
      ],
      metrics: [
        { label: '决策效率提升', value: '5-10x', unit: '' },
        { label: '自动化率', value: '>70%', unit: '' },
        { label: '用户满意度', value: '>4.5', unit: '/5' },
        { label: '业务 ROI', value: '>300%', unit: '' },
      ],
    },
  ],
  // 实施路线图
  roadmap: [
    {
      phase: 'Phase 1',
      name: '基座构建',
      duration: 'Q1-Q2 2026',
      color: '#326ce5',
      icon: '🏗️',
      goals: [
        '统一数据接入层，覆盖 Top 20 核心数据源',
        '数据湖仓一体化（Iceberg + LakeFS）',
        '基础特征工程平台上线',
        'AI Coding 工具链标准化（Cursor + Claude + CI/CD）',
      ],
      deliverables: ['数据平台 v1.0', '特征仓库 v1.0', 'AI 开发规范 v1.0'],
      risk: '数据源接入的兼容性和稳定性',
    },
    {
      phase: 'Phase 2',
      name: '本体建模',
      duration: 'Q3-Q4 2026',
      color: '#6c5ce7',
      icon: '🧬',
      goals: [
        '核心业务领域 Ontology 建模（3-5 个关键领域）',
        '业务规则引擎上线，覆盖 Top 100 业务规则',
        '语义搜索 + RAG 系统上线',
        '数字孪生 PoC（选择 1 个业务场景）',
      ],
      deliverables: ['Ontology 平台 v1.0', '规则引擎 v1.0', 'RAG 系统 v1.0'],
      risk: '领域知识获取和建模的准确性',
    },
    {
      phase: 'Phase 3',
      name: 'AI 平台化',
      duration: 'Q1-Q2 2027',
      color: '#e17055',
      icon: '⚡',
      goals: [
        'Multi-Agent 编排框架上线',
        'Tool & API Gateway 统一管理',
        '安全护栏体系完善（多层校验 + 审计）',
        '首批 3-5 个 AI Agent 投入生产',
      ],
      deliverables: ['AI Platform v1.0', 'Agent Store v1.0', '安全护栏 v1.0'],
      risk: 'Agent 可靠性和安全性',
    },
    {
      phase: 'Phase 4',
      name: '决策引擎',
      duration: 'Q3-Q4 2027',
      color: '#3fb950',
      icon: '🎯',
      goals: [
        'AI Copilot 嵌入核心业务流程',
        '决策仪表盘覆盖关键业务指标',
        '自动化工作流覆盖率 > 50%',
        '数据飞轮闭环验证（用户反馈 → 模型优化 → 效果提升）',
      ],
      deliverables: ['AI Copilot v1.0', '决策中心 v1.0', '自动化引擎 v1.0'],
      risk: '业务用户接受度和变革管理',
    },
  ],
  // 团队能力转型
  teamTransformation: {
    before: [
      { role: '前端开发', count: '40%', icon: '🖥️' },
      { role: '后端开发', count: '35%', icon: '⚙️' },
      { role: '测试工程师', count: '15%', icon: '🧪' },
      { role: '产品经理', count: '10%', icon: '📋' },
    ],
    after: [
      { role: 'AI/ML 工程师', count: '25%', icon: '🤖', desc: 'Agent 开发 · 模型微调 · RAG · 评估' },
      { role: '平台工程师', count: '20%', icon: '☸️', desc: '数据平台 · AI Infra · DevOps · SRE' },
      { role: '领域工程师', count: '20%', icon: '🧬', desc: 'Ontology 建模 · 规则引擎 · 业务分析' },
      { role: '全栈开发', count: '15%', icon: '💻', desc: 'AI Copilot UI · 决策应用 · 可视化' },
      { role: '产品经理', count: '15%', icon: '🎯', desc: 'AI 产品设计 · 用户研究 · 商业化' },
      { role: '安全工程师', count: '5%', icon: '🔒', desc: 'AI 安全 · 合规 · 隐私 · 审计' },
    ],
  },
  // 关键成功指标
  kpis: [
    { category: '平台能力', metrics: [
      { name: '数据源覆盖率', target: '>80%', current: '~30%', icon: '📊' },
      { name: 'AI Agent 生产数量', target: '>20', current: '0', icon: '🤖' },
      { name: 'Ontology 实体覆盖', target: '>200 类', current: '0', icon: '🧬' },
      { name: '自动化率', target: '>70%', current: '~20%', icon: '⚙️' },
    ]},
    { category: '业务价值', metrics: [
      { name: '决策效率提升', target: '5-10x', current: '1x', icon: '⚡' },
      { name: '人工干预率', target: '<10%', current: '~80%', icon: '👤' },
      { name: '业务 ROI', target: '>300%', current: '~100%', icon: '💰' },
      { name: '客户 NRR', target: '>115%', current: '~100%', icon: '📈' },
    ]},
    { category: '团队能力', metrics: [
      { name: 'AI 工程师占比', target: '>25%', current: '~5%', icon: '🧑‍💻' },
      { name: 'AI 辅助代码占比', target: '>60%', current: '~20%', icon: '🤖' },
      { name: '领域知识沉淀', target: '>500 规则', current: '~50', icon: '📚' },
      { name: '人均产出提升', target: '3-5x', current: '1x', icon: '🚀' },
    ]},
  ],
};

// 5. 行业对标分析
export const BENCHMARKS = {
  title: '行业对标分析',
  companies: [
    {
      name: 'Palantir',
      model: '决策操作系统',
      icon: '🏛️',
      color: '#6c5ce7',
      strengths: ['Ontology 深度绑定', 'FDE 驻场模式', '安全合规壁垒', 'AIP 让 LLM 可操作'],
      weaknesses: ['高人力成本', '扩展速度受限', '依赖大客户'],
      takeaway: '学习 Ontology 思想和 AIP 架构，但用 AI Agent 替代 FDE 降低人力依赖',
    },
    {
      name: 'Databricks',
      model: '数据 + AI 统一平台',
      icon: '🧱',
      color: '#e17055',
      strengths: ['开源生态（Spark/Delta/MLflow）', '数据湖仓一体', 'Unity Catalog 治理', 'Mosaic AI 训练'],
      weaknesses: ['偏底层基础设施', '业务理解较浅', '与 Snowflake 竞争激烈'],
      takeaway: '学习数据平台架构和开源策略，但需要在上层补充业务语义层',
    },
    {
      name: 'Salesforce',
      model: 'CRM + AI Agent 平台',
      icon: '☁️',
      color: '#00cec9',
      strengths: ['庞大客户基础', 'Agentforce 生态', 'Data Cloud 统一', '行业解决方案'],
      weaknesses: ['平台臃肿', '定制成本高', 'AI 能力起步晚'],
      takeaway: '学习 Agent 平台化思路和行业解决方案模板，但避免平台过度复杂化',
    },
    {
      name: 'Tesla',
      model: '数据飞轮 + 端到端 AI',
      icon: '🚗',
      color: '#3fb950',
      strengths: ['百万级数据采集终端', '端到端神经网络', '数据闭环自动化', '硬件+软件垂直整合'],
      weaknesses: ['封闭生态', '高度依赖自有硬件', '安全监管风险'],
      takeaway: '学习数据飞轮和端到端思想，在自动驾驶领域直接对标',
    },
  ],
};
