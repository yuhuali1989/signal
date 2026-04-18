// ═══════════════════════════════════════════════════════════════
// 量化业务数据定义
// ═══════════════════════════════════════════════════════════════

// Tab 定义
export const QUANT_TABS = [
  { id: 'overview',    label: '全景总览',       icon: '🌐', color: '#6c5ce7', desc: '量化交易行业全景 · 核心概念 · 发展历程 · 市场规模' },
  { id: 'strategies',  label: '策略体系',       icon: '🧠', color: '#e17055', desc: '统计套利 · CTA · 高频做市 · 因子投资 · 机器学习策略' },
  { id: 'tech',        label: '技术栈',         icon: '⚙️', color: '#3fb950', desc: '数据管道 · 回测引擎 · 执行系统 · 风控框架 · 基础设施' },
  { id: 'ai',          label: 'AI & 大模型',    icon: '🤖', color: '#ffa657', desc: '大模型在量化中的应用 · 因子挖掘 · 情绪分析 · 代码生成' },
  { id: 'market',      label: '国内外行情',     icon: '📊', color: '#79c0ff', desc: '全球量化市场格局 · 中美对比 · 监管政策 · 头部机构' },
  { id: 'practice',    label: '实战指南',       icon: '🛠️', color: '#fd79a8', desc: '个人量化入门 · 平台选型 · 数据源 · 回测陷阱 · 实盘部署' },
];

// ═══════════════════════════════════════════════════════════════
// 1. 全景总览
// ═══════════════════════════════════════════════════════════════
export const OVERVIEW_DATA = {
  definition: '量化交易（Quantitative Trading）是利用数学模型、统计分析和计算机程序，系统化地识别交易机会并自动执行交易的投资方式。核心理念：用数据和算法替代人类主观判断，追求可复现、可度量、可优化的投资收益。',
  
  coreMetrics: [
    { name: '全球量化 AUM', value: '~$1.5T', icon: '💰', color: '#6c5ce7', desc: '2025 年全球量化基金管理规模' },
    { name: '美股量化占比', value: '~60-70%', icon: '🇺🇸', color: '#3fb950', desc: '美股交易量中量化/算法交易占比' },
    { name: 'A 股量化占比', value: '~25-30%', icon: '🇨🇳', color: '#e17055', desc: 'A 股成交额中量化交易占比' },
    { name: '中国量化私募', value: '~¥1.5万亿', icon: '📈', color: '#ffa657', desc: '中国量化私募管理规模（2025）' },
    { name: '高频交易延迟', value: '<1μs', icon: '⚡', color: '#79c0ff', desc: '顶级高频交易系统的订单延迟' },
    { name: '年化夏普比', value: '1.5-3.0', icon: '📐', color: '#d2a8ff', desc: '优秀量化策略的夏普比率范围' },
  ],

  // 发展历程
  timeline: [
    { year: '1952', event: 'Markowitz 均值-方差模型', desc: '现代投资组合理论奠基，量化投资的理论起点', color: '#6c5ce7' },
    { year: '1973', event: 'Black-Scholes 期权定价', desc: '期权定价公式发表，衍生品量化交易开始', color: '#3fb950' },
    { year: '1982', event: 'Renaissance Technologies 成立', desc: 'Jim Simons 创立文艺复兴科技，开启量化传奇', color: '#e17055' },
    { year: '1988', event: 'D.E. Shaw 成立', desc: 'David Shaw 创立 D.E. Shaw，计算机科学家进入华尔街', color: '#ffa657' },
    { year: '1998', event: 'LTCM 崩盘', desc: '长期资本管理公司崩盘，量化风控的惨痛教训', color: '#ff6b6b' },
    { year: '2007', event: 'Quant Quake', desc: '量化地震，多家量化基金同时巨亏，拥挤交易风险暴露', color: '#ff6b6b' },
    { year: '2010', event: 'Flash Crash', desc: '美股闪崩，道指 5 分钟暴跌 1000 点，高频交易监管加强', color: '#ff6b6b' },
    { year: '2013', event: '中国量化元年', desc: '股指期货放开，中国量化私募开始快速发展', color: '#79c0ff' },
    { year: '2017', event: 'AI 量化兴起', desc: '深度学习开始大规模应用于因子挖掘和策略生成', color: '#d2a8ff' },
    { year: '2020', event: '中国量化爆发', desc: '百亿量化私募涌现，幻方/明汯/九坤/灵均等崛起', color: '#3fb950' },
    { year: '2023', event: 'LLM 进入量化', desc: 'GPT-4/Claude 用于研报分析、因子挖掘、代码生成', color: '#ffa657' },
    { year: '2024-25', event: 'AI Agent 量化', desc: 'AI Agent 自主研究→策略生成→回测→部署全链路', color: '#6c5ce7' },
  ],

  // 量化 vs 主观
  comparison: [
    { dimension: '决策依据', quant: '数据 + 模型 + 算法', discretionary: '经验 + 直觉 + 基本面', color: '#6c5ce7' },
    { dimension: '执行方式', quant: '程序自动执行', discretionary: '人工下单', color: '#3fb950' },
    { dimension: '情绪影响', quant: '无（纪律性强）', discretionary: '高（恐惧/贪婪）', color: '#e17055' },
    { dimension: '容量', quant: '受限于策略容量', discretionary: '受限于研究深度', color: '#ffa657' },
    { dimension: '可复现性', quant: '高（回测可验证）', discretionary: '低（依赖个人）', color: '#79c0ff' },
    { dimension: '适应性', quant: '需要持续迭代模型', discretionary: '人类直觉适应快', color: '#d2a8ff' },
    { dimension: '人才需求', quant: '数学/CS/金融复合', discretionary: '行业研究/投资经验', color: '#fd79a8' },
  ],
};

// ═══════════════════════════════════════════════════════════════
// 2. 策略体系
// ═══════════════════════════════════════════════════════════════
export const STRATEGIES_DATA = {
  categories: [
    {
      name: '统计套利 (Statistical Arbitrage)',
      icon: '📐',
      color: '#6c5ce7',
      desc: '利用资产间的统计关系偏离进行配对/多空交易，赚取均值回归收益',
      subStrategies: [
        { name: '配对交易', desc: '找到高相关性的两只股票，当价差偏离时做多低估做空高估', example: '中国平安 vs 中国人寿' },
        { name: '多因子中性', desc: '做多高 Alpha 股票、做空低 Alpha 股票，对冲市场风险', example: '市场中性策略，Beta ≈ 0' },
        { name: 'ETF 套利', desc: '利用 ETF 与成分股之间的价差进行套利', example: '沪深 300 ETF vs 成分股组合' },
        { name: '跨市场套利', desc: '同一标的在不同市场的价差套利', example: 'A/H 股溢价套利' },
      ],
      riskReturn: { annualReturn: '8-15%', sharpe: '1.5-2.5', maxDrawdown: '3-8%', capacity: '中等' },
    },
    {
      name: 'CTA (Commodity Trading Advisor)',
      icon: '📈',
      color: '#e17055',
      desc: '趋势跟踪策略，在期货/外汇市场上追踪价格趋势，危机时期表现优异',
      subStrategies: [
        { name: '趋势跟踪', desc: '识别并跟随中长期价格趋势，经典的"截断亏损，让利润奔跑"', example: '均线交叉 / 通道突破' },
        { name: '动量策略', desc: '买入近期表现强势的资产，卖出弱势资产', example: '截面动量 / 时序动量' },
        { name: '均值回归', desc: '在价格偏离均值时反向交易，赚取回归收益', example: 'Bollinger Band / RSI 超买超卖' },
        { name: '波动率策略', desc: '交易波动率本身，利用隐含波动率与实际波动率的差异', example: 'VIX 期货 / 期权 Straddle' },
      ],
      riskReturn: { annualReturn: '10-25%', sharpe: '0.8-1.5', maxDrawdown: '10-20%', capacity: '大' },
    },
    {
      name: '高频做市 (HFT Market Making)',
      icon: '⚡',
      color: '#3fb950',
      desc: '在买卖价差中赚取微小利润，提供市场流动性，要求极低延迟',
      subStrategies: [
        { name: '被动做市', desc: '同时挂买单和卖单，赚取 Bid-Ask Spread', example: '每笔赚 0.01%，日交易万次' },
        { name: '订单流预测', desc: '分析 Level-2 订单簿数据，预测短期价格方向', example: 'Order Book Imbalance' },
        { name: '延迟套利', desc: '利用不同交易所之间的信息传播延迟', example: '跨交易所价差捕捉' },
        { name: '事件驱动 HFT', desc: '在新闻/数据发布的毫秒级窗口内交易', example: '非农数据发布后的瞬间交易' },
      ],
      riskReturn: { annualReturn: '20-100%+', sharpe: '3-10+', maxDrawdown: '1-5%', capacity: '极小' },
    },
    {
      name: '因子投资 (Factor Investing)',
      icon: '🧩',
      color: '#ffa657',
      desc: '基于学术研究发现的风险因子（价值/动量/质量/规模等）构建投资组合',
      subStrategies: [
        { name: '价值因子', desc: '买入低估值（低 PE/PB）股票，卖出高估值股票', example: 'Fama-French HML' },
        { name: '动量因子', desc: '买入过去 12 个月涨幅最大的股票', example: 'Jegadeesh-Titman 动量' },
        { name: '质量因子', desc: '买入高 ROE、低负债、稳定盈利的公司', example: 'Piotroski F-Score' },
        { name: '低波动因子', desc: '买入低波动率股票，反直觉地获得更高风险调整收益', example: 'Minimum Variance Portfolio' },
      ],
      riskReturn: { annualReturn: '10-20%', sharpe: '0.8-1.5', maxDrawdown: '15-25%', capacity: '极大' },
    },
    {
      name: '机器学习策略 (ML-based)',
      icon: '🤖',
      color: '#79c0ff',
      desc: '利用机器学习/深度学习模型从海量数据中发现非线性模式',
      subStrategies: [
        { name: 'Alpha 因子挖掘', desc: '用 GP/NN 自动搜索有效因子表达式', example: 'WorldQuant Alpha101 / Qlib' },
        { name: '深度学习预测', desc: 'LSTM/Transformer 预测价格/收益率', example: 'TemporalFusionTransformer' },
        { name: '强化学习交易', desc: 'RL Agent 学习最优交易策略', example: 'PPO/SAC 做仓位管理' },
        { name: 'NLP 情绪分析', desc: '分析新闻/社交媒体情绪驱动交易', example: 'FinBERT / GPT 研报分析' },
      ],
      riskReturn: { annualReturn: '15-40%', sharpe: '1.0-2.5', maxDrawdown: '5-15%', capacity: '中等' },
    },
    {
      name: '期权策略 (Options)',
      icon: '🎯',
      color: '#d2a8ff',
      desc: '利用期权的非线性收益结构构建复杂策略，可精确控制风险敞口',
      subStrategies: [
        { name: '波动率套利', desc: '交易隐含波动率与实际波动率的差异', example: 'Delta-Neutral Straddle' },
        { name: '波动率曲面交易', desc: '利用波动率微笑/期限结构的异常', example: 'Skew Trading / Calendar Spread' },
        { name: '尾部风险对冲', desc: '用深度虚值期权对冲极端事件', example: 'Tail Risk Parity' },
        { name: '卖方策略', desc: '系统性卖出期权收取时间价值', example: 'Iron Condor / Covered Call' },
      ],
      riskReturn: { annualReturn: '8-20%', sharpe: '1.0-2.0', maxDrawdown: '5-15%', capacity: '中等' },
    },
  ],
};

// ═══════════════════════════════════════════════════════════════
// 3. 技术栈
// ═══════════════════════════════════════════════════════════════
export const TECH_DATA = {
  layers: [
    {
      name: '数据层',
      icon: '📊',
      color: '#6c5ce7',
      desc: '行情数据、另类数据的采集、清洗、存储',
      components: [
        { name: '行情数据', tech: 'Tick/L2/K线', tools: 'Wind / Tushare / AKShare / Binance API', desc: '股票/期货/期权/加密货币的实时和历史行情' },
        { name: '基本面数据', tech: '财报/公告/宏观', tools: 'Wind / 聚宽 / RiceQuant', desc: '上市公司财务数据、宏观经济指标' },
        { name: '另类数据', tech: '卫星/舆情/供应链', tools: 'Web Scraping / NLP Pipeline', desc: '新闻舆情、社交媒体、卫星图像、信用卡消费等' },
        { name: '数据存储', tech: '时序数据库', tools: 'Arctic / ClickHouse / TimescaleDB / DolphinDB', desc: '高性能时序数据存储与查询' },
      ],
    },
    {
      name: '研究层',
      icon: '🔬',
      color: '#3fb950',
      desc: '因子研究、策略开发、回测验证',
      components: [
        { name: '因子研究', tech: 'Alpha 挖掘', tools: 'Qlib / Alphalens / FactorLab', desc: '因子构建、IC 分析、因子衰减、多重共线性检验' },
        { name: '回测引擎', tech: '事件驱动/向量化', tools: 'Backtrader / Zipline / VectorBT / Qlib', desc: '历史数据回测，支持滑点/手续费/冲击成本模拟' },
        { name: '风险模型', tech: '多因子风险', tools: 'Barra / 自研风险模型', desc: '风险因子暴露分析、协方差矩阵估计、VaR/CVaR' },
        { name: '组合优化', tech: '凸优化', tools: 'CVXPY / Riskfolio-Lib / PyPortfolioOpt', desc: '均值-方差优化、Black-Litterman、风险平价' },
      ],
    },
    {
      name: '执行层',
      icon: '🚀',
      color: '#e17055',
      desc: '订单管理、交易执行、滑点控制',
      components: [
        { name: '订单管理 (OMS)', tech: '订单路由', tools: 'CTP / XTP / 恒生 / FIX Protocol', desc: '订单生成、拆单、路由、状态跟踪' },
        { name: '执行算法', tech: 'TWAP/VWAP/IS', tools: '自研执行引擎', desc: '最小化市场冲击的智能执行算法' },
        { name: '低延迟系统', tech: 'C++/FPGA', tools: 'Kernel Bypass / DPDK / Solarflare', desc: '微秒级延迟的交易系统，FPGA 硬件加速' },
        { name: '模拟交易', tech: '仿真环境', tools: 'Paper Trading / 仿真盘', desc: '实盘前的模拟验证环境' },
      ],
    },
    {
      name: '风控层',
      icon: '🛡️',
      color: '#ff6b6b',
      desc: '实时风控、仓位管理、合规监控',
      components: [
        { name: '实时风控', tech: '规则+模型', tools: '自研风控引擎', desc: '持仓限额、亏损限额、波动率限制、相关性监控' },
        { name: '仓位管理', tech: 'Kelly/风险平价', tools: 'Kelly Criterion / Risk Parity', desc: '最优仓位计算、动态再平衡' },
        { name: '压力测试', tech: '情景分析', tools: 'Monte Carlo / Historical Stress', desc: '极端市场情景下的组合表现模拟' },
        { name: '合规监控', tech: '交易监控', tools: '交易所报告 / 内部审计', desc: '交易合规性检查、异常交易检测' },
      ],
    },
    {
      name: '基础设施',
      icon: '🏗️',
      color: '#79c0ff',
      desc: '计算资源、网络、部署运维',
      components: [
        { name: 'GPU 集群', tech: 'ML 训练', tools: 'A100/H100 + Ray / Dask', desc: '大规模因子挖掘和模型训练' },
        { name: '低延迟网络', tech: 'Co-location', tools: '交易所机房托管 / 专线', desc: '物理距离最小化，网络延迟 <100μs' },
        { name: 'MLOps', tech: '模型管理', tools: 'MLflow / Weights & Biases / DVC', desc: '模型版本管理、实验追踪、自动部署' },
        { name: '监控告警', tech: '可观测性', tools: 'Grafana / Prometheus / PagerDuty', desc: '策略表现、系统延迟、异常交易实时监控' },
      ],
    },
  ],

  // 编程语言选型
  languages: [
    { name: 'Python', usage: '研究 & 回测', share: '70%', pros: '生态最丰富（NumPy/Pandas/Qlib）', cons: '速度慢，不适合低延迟', color: '#3776ab' },
    { name: 'C++', usage: '执行 & 高频', share: '15%', pros: '极致性能，微秒级延迟', cons: '开发效率低', color: '#00599c' },
    { name: 'Rust', usage: '新一代系统', share: '5%', pros: '安全+性能，无 GC', cons: '生态尚不成熟', color: '#dea584' },
    { name: 'Java', usage: '中间件 & OMS', share: '5%', pros: '企业级稳定性', cons: 'GC 停顿影响延迟', color: '#f89820' },
    { name: 'R', usage: '统计分析', share: '3%', pros: '统计建模最强', cons: '工程化能力弱', color: '#276dc3' },
    { name: 'FPGA/Verilog', usage: '超低延迟', share: '2%', pros: '纳秒级延迟', cons: '开发周期极长', color: '#ff6b6b' },
  ],
};

// ═══════════════════════════════════════════════════════════════
// 4. AI & 大模型在量化中的应用
// ═══════════════════════════════════════════════════════════════
export const AI_DATA = {
  overview: {
    role: '大模型正在重塑量化交易的每一个环节：从研报理解、因子挖掘、策略生成到风险管理，AI 不再只是"更好的统计工具"，而是成为量化研究员的"AI 副驾驶"',
    impact: [
      { name: '研报理解', desc: 'LLM 自动解析数百页研报/财报，提取关键信息和情绪信号', icon: '📄', color: '#6c5ce7' },
      { name: '因子挖掘', desc: 'AI 自动搜索有效因子表达式，效率是人工的 100 倍+', icon: '🔍', color: '#e17055' },
      { name: '策略生成', desc: 'LLM 根据自然语言描述生成完整的交易策略代码', icon: '💻', color: '#3fb950' },
      { name: '风险预警', desc: '多模态 AI 综合新闻/社交/市场数据，提前预警风险事件', icon: '⚠️', color: '#ff6b6b' },
      { name: '执行优化', desc: 'RL Agent 学习最优执行策略，减少市场冲击', icon: '🎯', color: '#ffa657' },
      { name: '知识图谱', desc: '构建公司关系/产业链图谱，发现隐含的投资逻辑', icon: '🕸️', color: '#79c0ff' },
    ],
  },

  // 大模型应用场景
  applications: [
    {
      name: 'LLM 研报分析',
      category: '信息提取',
      icon: '📄',
      color: '#6c5ce7',
      desc: '用 GPT-4/Claude 自动解析卖方研报、财报电话会议纪要，提取关键观点、盈利预测调整、管理层语气变化',
      models: ['GPT-4o', 'Claude 3.5', 'Qwen-72B', 'FinGPT'],
      input: '研报 PDF / 财报文本 / 电话会议录音',
      output: '结构化观点 + 情绪评分 + 关键数据变化',
      alpha: '研报情绪因子 IC ~0.03-0.05',
      example: '解析 1000 份研报 → 提取"盈利上调"信号 → 构建多空组合',
    },
    {
      name: 'AI 因子挖掘',
      category: '因子研究',
      icon: '🔍',
      color: '#e17055',
      desc: '用遗传编程 (GP) 或 LLM 自动搜索有效的 Alpha 因子表达式，替代人工因子构建',
      models: ['Qlib RL', 'AlphaGen (LLM)', 'WorldQuant BRAIN', 'GPT-4 + Code Interpreter'],
      input: '价量数据 + 基本面数据 + 因子模板',
      output: '因子表达式 + IC/IR/换手率分析',
      alpha: '自动挖掘因子 IC ~0.02-0.08',
      example: 'LLM 生成 10000 个因子 → 回测筛选 → Top 50 因子组合',
    },
    {
      name: 'LLM 策略生成',
      category: '策略开发',
      icon: '💻',
      color: '#3fb950',
      desc: '用自然语言描述交易逻辑，LLM 自动生成完整的 Python 策略代码，包含回测和风控',
      models: ['GPT-4o', 'Claude 3.5 Sonnet', 'DeepSeek-Coder', 'Qwen-Coder'],
      input: '自然语言策略描述 + 约束条件',
      output: '完整 Python 策略代码 + 回测报告',
      alpha: '加速策略开发 10×，但需人工审核',
      example: '"写一个双均线策略，5日均线上穿20日均线买入" → 完整代码',
    },
    {
      name: '多模态情绪分析',
      category: '另类数据',
      icon: '🌊',
      color: '#ffa657',
      desc: '综合新闻文本、社交媒体、视频/图像等多模态数据，构建市场情绪指标',
      models: ['FinBERT', 'GPT-4V', 'Gemini Pro', 'Chinese-FinBERT'],
      input: '新闻 + 微博/Twitter + 财经视频',
      output: '情绪评分 (-1 到 +1) + 情绪变化趋势',
      alpha: '情绪因子 IC ~0.02-0.04',
      example: '监控 10 万条微博 → 实时情绪指数 → 极端情绪时反向交易',
    },
    {
      name: 'RL 交易 Agent',
      category: '策略执行',
      icon: '🤖',
      color: '#79c0ff',
      desc: '用强化学习训练交易 Agent，学习最优的买卖时机和仓位管理',
      models: ['PPO', 'SAC', 'TD3', 'Decision Transformer'],
      input: '市场状态 (价格/持仓/资金)',
      output: '交易动作 (买/卖/持有 + 仓位比例)',
      alpha: '执行成本降低 15-30%',
      example: 'RL Agent 学习 TWAP 的改进版本，适应市场微观结构',
    },
    {
      name: 'AI Agent 全链路',
      category: '端到端',
      icon: '🔄',
      color: '#d2a8ff',
      desc: 'AI Agent 自主完成：市场研究 → 策略假设 → 代码实现 → 回测验证 → 风险评估的全流程',
      models: ['GPT-4o + Function Calling', 'Claude 3.5 + MCP', 'AutoGPT-Quant'],
      input: '投资目标 + 风险约束',
      output: '完整策略 + 回测报告 + 风险分析',
      alpha: '研究效率提升 5-10×，但需人工把关',
      example: '"研究 A 股小市值动量策略" → Agent 自主完成全流程',
    },
  ],

  // 关键论文
  papers: [
    { paper: 'FinGPT', venue: 'NeurIPS 2023 Workshop', topic: '金融 LLM', highlight: '开源金融大模型框架，支持情绪分析/研报生成/风险评估' },
    { paper: 'BloombergGPT', venue: 'arXiv 2023', topic: '金融 LLM', highlight: '500 亿参数金融专用 LLM，金融 NLP 任务 SOTA' },
    { paper: 'AlphaGen', venue: 'KDD 2024', topic: 'AI 因子挖掘', highlight: 'LLM + RL 自动生成 Alpha 因子，超越人工因子' },
    { paper: 'FinRL', venue: 'NeurIPS 2020', topic: 'RL 交易', highlight: '开源金融强化学习框架，支持多种 RL 算法' },
    { paper: 'Qlib', venue: 'JMLR 2021', topic: 'AI 量化平台', highlight: '微软开源 AI 量化研究平台，因子挖掘+模型训练+回测' },
    { paper: 'FinMem', venue: 'AAAI 2024', topic: 'Agent 交易', highlight: 'LLM Agent + 分层记忆系统，模拟人类交易员决策' },
    { paper: 'TradingGPT', venue: 'arXiv 2024', topic: 'Multi-Agent', highlight: '多 Agent 协作交易系统，分析师+交易员+风控员' },
    { paper: 'MarketSenseAI', venue: 'ICAIF 2024', topic: 'LLM 选股', highlight: 'GPT-4 分析新闻+财报选股，年化超额 10%+' },
  ],

  // 风险与局限
  risks: [
    { name: '过拟合', desc: 'LLM 生成的策略容易过拟合历史数据，样本外表现差', severity: '高', icon: '⚠️' },
    { name: '幻觉', desc: 'LLM 可能生成看似合理但逻辑错误的策略', severity: '高', icon: '🌀' },
    { name: '数据泄露', desc: '训练数据可能包含未来信息（look-ahead bias）', severity: '高', icon: '🔓' },
    { name: '黑箱风险', desc: '深度学习模型难以解释，监管和风控困难', severity: '中', icon: '📦' },
    { name: '拥挤交易', desc: '大量机构使用相似 AI 模型，策略趋同', severity: '中', icon: '👥' },
    { name: '延迟', desc: 'LLM 推理延迟高，不适合高频场景', severity: '低', icon: '⏱️' },
  ],
};

// ═══════════════════════════════════════════════════════════════
// 5. 国内外行情
// ═══════════════════════════════════════════════════════════════
export const MARKET_DATA = {
  // 全球头部量化机构
  globalFirms: [
    {
      name: 'Renaissance Technologies',
      country: '🇺🇸',
      aum: '$130B',
      flagship: 'Medallion Fund',
      performance: '年化 ~66% (费前, 1988-2018)',
      style: '纯数学/物理模型，极度保密',
      color: '#6c5ce7',
      highlight: '史上最成功的量化基金，30 年几乎无亏损年份',
    },
    {
      name: 'Two Sigma',
      country: '🇺🇸',
      aum: '$60B',
      flagship: 'Vega / Absolute Return',
      performance: '年化 ~15-20%',
      style: 'ML/AI 驱动，技术文化浓厚',
      color: '#3fb950',
      highlight: '硅谷文化的对冲基金，大量使用机器学习',
    },
    {
      name: 'Citadel',
      country: '🇺🇸',
      aum: '$65B',
      flagship: 'Wellington / Tactical Trading',
      performance: '年化 ~20%+ (近 5 年)',
      style: '多策略，基本面量化+高频',
      color: '#e17055',
      highlight: 'Ken Griffin 创立，2022 年赚 $16B 创纪录',
    },
    {
      name: 'D.E. Shaw',
      country: '🇺🇸',
      aum: '$60B',
      flagship: 'Composite / Oculus',
      performance: '年化 ~15%',
      style: '计算金融先驱，系统化+基本面',
      color: '#ffa657',
      highlight: 'Jeff Bezos 曾在此工作，计算机科学家文化',
    },
    {
      name: 'Man Group (AHL)',
      country: '🇬🇧',
      aum: '$175B',
      flagship: 'AHL Alpha / Evolution',
      performance: '年化 ~10-15%',
      style: 'CTA 先驱，趋势跟踪+ML',
      color: '#79c0ff',
      highlight: '全球最大上市对冲基金，CTA 策略鼻祖',
    },
    {
      name: 'Bridgewater',
      country: '🇺🇸',
      aum: '$125B',
      flagship: 'Pure Alpha / All Weather',
      performance: '年化 ~12% (Pure Alpha)',
      style: '宏观量化，风险平价',
      color: '#d2a8ff',
      highlight: 'Ray Dalio 创立，全球最大对冲基金',
    },
  ],

  // 中国头部量化私募
  chinaFirms: [
    {
      name: '幻方量化',
      aum: '~600 亿',
      style: 'AI 量化，深度学习驱动',
      infra: '自建 GPU 集群 (10000+ A100)',
      highlight: '国内 AI 量化标杆，自研 DeepSeek 大模型',
      color: '#6c5ce7',
      status: '百亿+',
    },
    {
      name: '九坤投资',
      aum: '~800 亿',
      style: '多策略，统计套利+CTA',
      infra: '顶级技术团队，低延迟系统',
      highlight: '清华系量化代表，技术实力顶尖',
      color: '#3fb950',
      status: '百亿+',
    },
    {
      name: '明汯投资',
      aum: '~500 亿',
      style: '多因子+机器学习',
      infra: '大规模因子库，自研回测平台',
      highlight: '规模增长最快的量化私募之一',
      color: '#e17055',
      status: '百亿+',
    },
    {
      name: '灵均投资',
      aum: '~600 亿',
      style: '量化多头+市场中性',
      infra: '自研交易系统',
      highlight: '2024 年因 DMA 策略引发市场关注',
      color: '#ffa657',
      status: '百亿+',
    },
    {
      name: '衍复投资',
      aum: '~400 亿',
      style: '统计套利+多因子',
      infra: '精品量化，策略容量控制',
      highlight: '业绩稳定性突出，回撤控制优秀',
      color: '#79c0ff',
      status: '百亿+',
    },
    {
      name: '锐天投资',
      aum: '~200 亿',
      style: '高频+做市',
      infra: 'C++ 低延迟系统',
      highlight: '国内高频交易代表',
      color: '#d2a8ff',
      status: '百亿+',
    },
  ],

  // 中美量化对比
  comparison: [
    { dimension: '市场规模', us: '~$1.2T AUM', china: '~¥1.5 万亿 AUM', gap: '美国领先 5×+', color: '#6c5ce7' },
    { dimension: '市场占比', us: '交易量 60-70%', china: '成交额 25-30%', gap: '美国更成熟', color: '#3fb950' },
    { dimension: '策略多样性', us: '全品种全策略', china: '以股票量化为主', gap: '美国更丰富', color: '#e17055' },
    { dimension: '高频交易', us: '极度发达，Co-location', china: '受限（T+1/涨跌停）', gap: '制度差异大', color: '#ffa657' },
    { dimension: '衍生品', us: '期权/期货极丰富', china: '品种有限，限制多', gap: '美国领先显著', color: '#79c0ff' },
    { dimension: 'AI 应用', us: '全面渗透', china: '快速追赶（幻方/DeepSeek）', gap: '差距缩小', color: '#d2a8ff' },
    { dimension: '监管环境', us: '成熟但宽松', china: '趋严（2024 量化新规）', gap: '中国监管更严', color: '#ff6b6b' },
    { dimension: '人才', us: '全球顶尖人才聚集', china: '清北+海归，快速提升', gap: '美国仍领先', color: '#fd79a8' },
  ],

  // 监管政策
  regulations: [
    {
      region: '🇨🇳 中国',
      policies: [
        { name: '2024 量化新规', desc: '限制 DMA 策略杠杆、加强程序化交易报备、异常交易监控', impact: '短期利空，长期规范化', date: '2024.02' },
        { name: '程序化交易报备', desc: '量化私募需向交易所报备策略类型和交易频率', impact: '透明度提升', date: '2024.05' },
        { name: '融券 T+1', desc: '融券卖出次日才能还券，限制日内回转', impact: '限制高频策略', date: '2024.01' },
        { name: '北向资金限制', desc: '加强北向资金量化交易监管', impact: '外资量化受限', date: '2024.03' },
      ],
      color: '#e17055',
    },
    {
      region: '🇺🇸 美国',
      policies: [
        { name: 'Reg NMS', desc: '全国市场系统规则，保证最优价格执行', impact: '促进高频做市', date: '2005' },
        { name: 'Volcker Rule', desc: '限制银行自营交易', impact: '银行量化团队转移到对冲基金', date: '2014' },
        { name: 'SEC 高频交易提案', desc: '拟要求高频交易商注册为交易商', impact: '监管趋严', date: '2023' },
        { name: 'AI 交易监管', desc: 'SEC 关注 AI 在交易中的系统性风险', impact: '未来可能出台 AI 交易规则', date: '2024' },
      ],
      color: '#79c0ff',
    },
  ],

  // 市场趋势
  trends: [
    { name: 'AI 原生量化', desc: '从"AI 辅助"到"AI 原生"，大模型成为量化研究的核心基础设施', icon: '🤖', color: '#6c5ce7' },
    { name: '另类数据爆发', desc: '卫星图像、信用卡数据、社交媒体等另类数据源快速增长', icon: '📡', color: '#3fb950' },
    { name: '加密货币量化', desc: '7×24 小时市场、高波动率、DeFi 套利，成为量化新战场', icon: '₿', color: '#ffa657' },
    { name: '量化出海', desc: '中国量化机构开始布局海外市场（美股/港股/东南亚）', icon: '🌏', color: '#79c0ff' },
    { name: '监管趋严', desc: '全球监管机构加强对量化/高频/AI 交易的监管', icon: '📋', color: '#ff6b6b' },
    { name: '策略容量瓶颈', desc: '优质策略拥挤，Alpha 衰减加速，倒逼策略创新', icon: '📉', color: '#d2a8ff' },
  ],
};

// ═══════════════════════════════════════════════════════════════
// 6. 实战指南
// ═══════════════════════════════════════════════════════════════
export const PRACTICE_DATA = {
  // 入门路径
  learningPath: [
    { stage: '基础', name: '数学 & 编程', duration: '2-3 月', skills: ['概率统计', '线性代数', 'Python 编程', 'Pandas/NumPy'], icon: '📚', color: '#6c5ce7' },
    { stage: '进阶', name: '金融 & 策略', duration: '3-6 月', skills: ['金融市场微观结构', '技术分析', '因子投资理论', '回测框架'], icon: '📈', color: '#3fb950' },
    { stage: '实战', name: '策略开发', duration: '6-12 月', skills: ['因子研究', '策略回测', '风险管理', '模拟交易'], icon: '🛠️', color: '#e17055' },
    { stage: '高级', name: 'ML & 系统', duration: '12+ 月', skills: ['机器学习', '深度学习', '低延迟系统', '实盘部署'], icon: '🚀', color: '#ffa657' },
  ],

  // 平台选型
  platforms: [
    { name: 'Qlib (微软)', type: '开源框架', lang: 'Python', features: ['AI 因子挖掘', '模型训练', '回测', '数据管理'], bestFor: 'AI 量化研究', url: 'github.com/microsoft/qlib', color: '#6c5ce7' },
    { name: 'Backtrader', type: '开源框架', lang: 'Python', features: ['事件驱动回测', '实盘对接', '可视化', '社区活跃'], bestFor: '策略回测入门', url: 'backtrader.com', color: '#3fb950' },
    { name: 'VectorBT', type: '开源框架', lang: 'Python', features: ['向量化回测', '极速', '组合优化', 'Numba 加速'], bestFor: '大规模参数扫描', url: 'vectorbt.dev', color: '#e17055' },
    { name: '聚宽 (JoinQuant)', type: '在线平台', lang: 'Python', features: ['A 股数据', '在线回测', '模拟交易', '社区'], bestFor: 'A 股量化入门', url: 'joinquant.com', color: '#ffa657' },
    { name: 'RiceQuant (米筐)', type: '在线平台', lang: 'Python', features: ['多市场数据', '回测', '实盘', '因子库'], bestFor: 'A 股专业量化', url: 'ricequant.com', color: '#79c0ff' },
    { name: 'QuantConnect', type: '在线平台', lang: 'Python/C#', features: ['全球市场', '云端回测', '实盘', 'LEAN 引擎'], bestFor: '全球市场量化', url: 'quantconnect.com', color: '#d2a8ff' },
  ],

  // 数据源
  dataSources: [
    { name: 'Tushare Pro', market: 'A 股', type: '行情+基本面', cost: '免费/积分制', quality: '⭐⭐⭐⭐', color: '#6c5ce7' },
    { name: 'AKShare', market: 'A 股+全球', type: '行情+另类', cost: '免费开源', quality: '⭐⭐⭐', color: '#3fb950' },
    { name: 'Wind (万得)', market: '全市场', type: '全品种全数据', cost: '¥5-20 万/年', quality: '⭐⭐⭐⭐⭐', color: '#e17055' },
    { name: 'Yahoo Finance', market: '全球', type: '行情', cost: '免费', quality: '⭐⭐⭐', color: '#ffa657' },
    { name: 'Binance API', market: '加密货币', type: '行情+交易', cost: '免费', quality: '⭐⭐⭐⭐', color: '#79c0ff' },
    { name: 'DolphinDB', market: '全市场', type: '时序数据库', cost: '商业授权', quality: '⭐⭐⭐⭐⭐', color: '#d2a8ff' },
  ],

  // 回测陷阱
  pitfalls: [
    { name: '前视偏差 (Look-ahead Bias)', desc: '使用了未来才能获得的数据，如用当天收盘价在开盘时交易', severity: '致命', fix: '严格按时间戳对齐数据，使用 point-in-time 数据库', icon: '🔮', color: '#ff6b6b' },
    { name: '幸存者偏差 (Survivorship Bias)', desc: '只用当前存在的股票回测，忽略了已退市的股票', severity: '严重', fix: '使用包含退市股票的全量数据', icon: '💀', color: '#e17055' },
    { name: '过拟合 (Overfitting)', desc: '策略在历史数据上表现完美，但实盘亏损', severity: '严重', fix: '样本外测试、交叉验证、限制参数数量', icon: '📐', color: '#ffa657' },
    { name: '交易成本忽略', desc: '回测不考虑手续费、滑点、冲击成本', severity: '严重', fix: '模拟真实交易成本，高频策略尤其重要', icon: '💸', color: '#79c0ff' },
    { name: '数据窥探 (Data Snooping)', desc: '反复在同一数据集上测试不同策略，总能找到"有效"的', severity: '中等', fix: '预留独立测试集，使用 Bonferroni 校正', icon: '🔍', color: '#d2a8ff' },
    { name: '流动性幻觉', desc: '回测假设可以无限量成交，实际市场流动性有限', severity: '中等', fix: '模拟订单簿冲击，限制单笔交易量', icon: '💧', color: '#6c5ce7' },
  ],

  // 推荐书籍
  books: [
    { title: 'Advances in Financial Machine Learning', author: 'Marcos López de Prado', topic: 'ML 量化', level: '高级', color: '#6c5ce7' },
    { title: 'Quantitative Trading', author: 'Ernest Chan', topic: '量化入门', level: '入门', color: '#3fb950' },
    { title: 'Algorithmic Trading', author: 'Ernest Chan', topic: '算法交易', level: '中级', color: '#e17055' },
    { title: 'Machine Learning for Asset Managers', author: 'Marcos López de Prado', topic: 'ML 资管', level: '高级', color: '#ffa657' },
    { title: 'Trading and Exchanges', author: 'Larry Harris', topic: '市场微观结构', level: '中级', color: '#79c0ff' },
    { title: '打开量化投资的黑箱', author: 'Rishi Narang', topic: '量化科普', level: '入门', color: '#d2a8ff' },
  ],
};
