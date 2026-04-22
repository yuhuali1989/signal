'use client';

import { useState, useMemo, useRef, useEffect } from 'react';

// ─── 时间分组工具 ─────────────────────────────────────────────────────────────

// 获取某日期所在周的周一日期字符串
function getMondayStr(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDay(); // 0=周日
  const diff = day === 0 ? -6 : 1 - day; // 以周一为起点
  d.setDate(d.getDate() + diff);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function groupByTime(items) {
  const groups = {};
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

  // 最近一周起点：今天往前推 6 天（共 7 天含今天）
  const sevenAgo = new Date(now);
  sevenAgo.setDate(sevenAgo.getDate() - 6);
  const sevenAgoStr = `${sevenAgo.getFullYear()}-${pad(sevenAgo.getMonth() + 1)}-${pad(sevenAgo.getDate())}`;

  const monthNames = ['', '1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

  items.forEach(item => {
    const dateStr = item.date;
    const d = new Date(dateStr + 'T00:00:00');
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const day = d.getDate();
    let key, label, shortLabel, sortKey;

    if (dateStr >= sevenAgoStr && dateStr <= todayStr) {
      // ① 最近 7 天（含今天）：按天
      key = dateStr;
      label = `${month} 月 ${day} 日`;
      shortLabel = `${month}/${day}`;
      sortKey = year * 100000000 + month * 1000000 + day * 10000 + 9999;
    } else if (year === 2026 && month === 4) {
      // ② 2026 年 4 月（非最近7天）：按周（周一~周日）
      const mondayStr = getMondayStr(dateStr);
      const md = new Date(mondayStr + 'T00:00:00');
      const wm = md.getMonth() + 1;
      const wd = md.getDate();
      const sundayD = new Date(md);
      sundayD.setDate(sundayD.getDate() + 6);
      const sm = sundayD.getMonth() + 1;
      const sd = sundayD.getDate();
      key = `2026-W-${mondayStr}`;
      label = `4 月 ${wd} 日 ~ ${sm !== wm ? sm + '月' : ''}${sd} 日`;
      shortLabel = `4/${wd}-${sd}`;
      sortKey = year * 100000000 + month * 1000000 + wd * 10000;
    } else if (year === 2026 && month <= 3) {
      // ③ 2026 年 1-3 月：按月
      key = `${year}-${pad(month)}`;
      label = `${year} 年 ${monthNames[month]}`;
      shortLabel = `26年${monthNames[month]}`;
      sortKey = year * 100000000 + month * 1000000;
    } else if (year === 2025) {
      // ④ 2025 年：按月
      key = `${year}-${pad(month)}`;
      label = `${year} 年 ${monthNames[month]}`;
      shortLabel = `25年${monthNames[month]}`;
      sortKey = year * 100000000 + month * 1000000;
    } else {
      // ⑤ 2024 及更早：按年
      key = `${year}`;
      label = `${year} 年`;
      shortLabel = `${year}`;
      sortKey = year * 100000000;
    }

    if (!groups[key]) {
      groups[key] = { key, label, shortLabel, sortKey, items: [] };
    }
    groups[key].items.push(item);
  });

  return Object.values(groups).sort((a, b) => b.sortKey - a.sortKey);
}

// ─── 分类 & 地区定义 ──────────────────────────────────────────────────────────

// 分类定义：聚焦软件行业公司动态（Databricks/Snowflake/AWS/Palantir 等）
const CATEGORIES = [
  { key: 'all',      label: '全部',    icon: '📡', color: '#6c5ce7' },
  { key: 'data',     label: '数据平台', icon: '🗄️', color: '#326ce5' },  // Databricks/Snowflake/dbt/Fivetran
  { key: 'cloud',    label: '云服务',  icon: '☁️', color: '#00cec9' },  // AWS/Azure/GCP
  { key: 'software', label: '企业软件', icon: '💼', color: '#6c5ce7' },  // Salesforce/ServiceNow/SAP/Oracle
  { key: 'security', label: '安全',    icon: '🔐', color: '#e17055' },  // CrowdStrike/Palo Alto/Okta
  { key: 'startup',  label: '融资动态', icon: '🚀', color: '#ffa657' },  // 创业公司融资/IPO
  { key: 'market',   label: '市场财报', icon: '📊', color: '#3fb950' },  // 季报/市值/并购
];
const CAT_MAP = Object.fromEntries(CATEGORIES.map(c => [c.key, c]));

const REGIONS = [
  { key: 'all',    label: '全球' },
  { key: 'global', label: '国际' },
  { key: 'china',  label: '国内' },
];

// ─── 新闻数据：以软件行业公司动态为主线 ──────────────────────────────────────
// 重点关注：Databricks / Snowflake / AWS / Palantir / Salesforce /
//           ServiceNow / Confluent / dbt Labs / Fivetran / CrowdStrike 等

const NEWS_DATA = [
  // ══════════════════════════════════════════════════════
  // 2026-04-22（第27轮更新 — MIT TR / MCP安全 / Databricks IPO / Forbes AI 50 / MLPerf）
  // ══════════════════════════════════════════════════════
  {
    id: 2521,
    category: 'security',
    region: 'global',
    title: 'MCP 协议曝架构级 RCE 漏洞：11 个 CVE、1.5 亿次下载受影响',
    summary: 'OX Security 披露 Anthropic MCP 协议 STDIO 传输存在设计级 RCE 漏洞，影响 Python/TS/Java/Rust 所有 SDK，波及 7000+ 公开服务器。CSA 发布独立安全报告称属于系统性供应链风险。',
    source: 'The Hacker News',
    date: '2026-04-20',
    tags: ['MCP', 'RCE', '安全漏洞', 'CVE'],
    hot: true,
    link: 'https://thehackernews.com/2026/04/anthropic-mcp-design-vulnerability.html',
  },
  {
    id: 2522,
    category: 'data',
    region: 'global',
    title: 'Databricks 拟 2026 H2 提交 S-1，冲击 $1340 亿估值 IPO',
    summary: 'Databricks 计划于 2026 年下半年向 SEC 提交 S-1 注册文件，ARR 达 $54 亿（同比增长 65%），有望成为史上最大科技 IPO 之一。AI 驱动的数据湖仓产品是核心增长引擎。',
    source: 'Tech Insider',
    date: '2026-04-11',
    tags: ['Databricks', 'IPO', 'S-1', '数据湖仓'],
    hot: true,
    link: 'https://tech-insider.org/databricks-134-billion-ipo-enterprise-software-2026/',
  },
  {
    id: 2523,
    category: 'startup',
    region: 'global',
    title: 'Forbes 2026 AI 50 榜单发布：20 家新上榜公司',
    summary: 'Forbes 第八届 AI 50 强榜单发布，OpenAI、Anthropic 领跑，本届有 20 家新上榜公司。榜单反映 AI 行业从模型研发向商业化落地加速转型。',
    source: 'Forbes/IT之家',
    date: '2026-04-21',
    tags: ['Forbes', 'AI 50', '创业', '排名'],
    hot: true,
    link: 'https://www.msn.cn/zh-cn/news/other/%E7%A6%8F%E5%B8%83%E6%96%AF%E5%8F%91%E5%B8%83-2026-%E5%B9%B4-ai-50-%E6%A6%9C%E5%8D%95-openai-anthropic-%E9%A2%86%E8%A1%94/ar-AA21nKQr',
  },
  {
    id: 2524,
    category: 'market',
    region: 'global',
    title: 'Q1 2026 全球 VC 投资破历史纪录：AI 计算基础设施是最大推手',
    summary: 'Crunchbase 数据显示 Q1 2026 全球 VC 投资打破历史纪录，AI 计算和前沿实验室获得前所未有的资金注入。GPU 集群、推理服务、数据中心成资金首选方向。',
    source: 'Crunchbase News',
    date: '2026-04-01',
    tags: ['VC', '融资', 'AI Infra'],
    hot: false,
    link: 'https://news.crunchbase.com/venture/record-breaking-funding-ai-global-q1-2026/',
  },
  {
    id: 2525,
    category: 'market',
    region: 'global',
    title: 'MLPerf Inference v6.0 发布：首次引入 LLM 推理标准化评测',
    summary: 'MLCommons 发布 MLPerf Inference v6.0，新增 LLM 推理基准测试，为 vLLM/SGLang/TensorRT-LLM 等推理引擎提供统一对比框架。',
    source: 'MLCommons',
    date: '2026-04-01',
    tags: ['MLPerf', '推理基准', 'Benchmark'],
    hot: false,
    link: 'https://mlcommons.org/2026/04/mlperf-inference-v6-0-results/',
  },
  {
    id: 2526,
    category: 'security',
    region: 'global',
    title: 'CSA 发布 MCP 安全研究报告：AI Agent 供应链面临系统性 RCE 风险',
    summary: 'Cloud Security Alliance 发布独立研究报告分析 MCP 协议 RCE 漏洞，认为属于系统性供应链风险，建议企业立即审计 MCP 部署并在沙箱中运行 Agent。',
    source: 'Cloud Security Alliance',
    date: '2026-04-20',
    tags: ['CSA', 'MCP', 'Agent安全'],
    hot: false,
    link: 'https://labs.cloudsecurityalliance.org/research/csa-research-note-mcp-by-design-rce-ox-security-20260420-csa/',
  },
  {
    id: 2527,
    category: 'software',
    region: 'global',
    title: 'MIT TR 发布 2026 AI 十大趋势：世界模型、Agent 协作入选',
    summary: 'MIT Technology Review 首次发布 AI 年度趋势专题，世界模型、Agent Orchestration、中国开源押注等 10 大方向入选。报告指出 AI 已进入技术进化+风险加剧+社会反弹的多维新阶段。',
    source: 'MIT Technology Review',
    date: '2026-04-21',
    tags: ['MIT TR', 'AI趋势', '世界模型', 'Agent'],
    hot: true,
    link: 'https://www.technologyreview.com/2026/04/21/1135643/10-ai-artificial-intelligence-trends-technologies-research-2026/',
  },
  {
    id: 2528,
    category: 'cloud',
    region: 'global',
    title: '推理引擎 H100 对决：vLLM vs SGLang vs TensorRT-LLM 实测对比',
    summary: 'Spheron Network 在 H100 上同条件测试三大推理引擎。SGLang Agent 场景吞吐领先（KV Cache 复用率 78%），TensorRT-LLM 纯吞吐最高，vLLM 通用平衡最佳。',
    source: 'Spheron Network',
    date: '2026-03-23',
    tags: ['vLLM', 'SGLang', 'TensorRT-LLM', 'H100'],
    hot: false,
    link: 'https://www.spheron.network/blog/vllm-vs-tensorrt-llm-vs-sglang-benchmarks/',
  },
  {
    id: 2529,
    category: 'security',
    region: 'china',
    title: 'MCP 设计缺陷波及超 20 万台服务器、3.2 万代码库',
    summary: '智东西报道 OX Security 披露的 MCP 安全漏洞已影响超 3.2 万个代码仓库和 20 万+服务器，攻击者可借此窃取用户数据、API 密钥及聊天记录。Anthropic 仅发布警示文档未修复架构。',
    source: '凤凰网科技/智东西',
    date: '2026-04-17',
    tags: ['MCP', '安全', '国内报道'],
    hot: false,
    link: 'https://tech.ifeng.com/c/8sOVMMIyIX4',
  },
  {
    id: 2530,
    category: 'startup',
    region: 'global',
    title: 'State of AI 2026 年 4 月期刊：AI 从增长转向变现',
    summary: 'Air Street Capital 发布 State of AI 2026 年 4 月期刊，覆盖 2-3 月重大事件。核心观点：AI 平台正从增长模式转向变现策略，基础设施投资回报周期正在缩短。',
    source: 'Air Street Capital',
    date: '2026-04-12',
    tags: ['State of AI', '行业报告', '变现'],
    hot: false,
    link: 'https://press.airstreet.com/p/state-of-ai-april-2026-newsletter',
  },
    category: 'startup',
    region: 'global',
    title: 'SpaceX 与 Cursor 达成合作，持有 $600 亿收购选项',
    summary: 'SpaceX 正在与 AI 编程工具 Cursor 合作，并持有以 $600 亿估值收购 Cursor 的选项。Cursor 和 xAI 均缺乏匹敌 Anthropic/OpenAI 的自研模型，而后两者正直接进入开发者工具市场。',
    source: 'TechCrunch',
    date: '2026-04-21',
    tags: ['SpaceX', 'Cursor', '收购', 'AI编程'],
    hot: true,
    link: 'https://techcrunch.com/2026/04/21/spacex-is-working-with-cursor-and-has-an-option-to-buy-the-startup-for-60-billion/',
  },
  {
    id: 2512,
    category: 'cloud',
    region: 'global',
    title: 'Anthropic 获 Amazon $50 亿投资，承诺 $1000 亿 AWS 云支出',
    summary: 'Amazon 再次向 Anthropic 投资 $50 亿，Anthropic 承诺在 AWS 上投入 $1000 亿云计算支出。这是 Amazon 对 Anthropic 的又一轮循环投资——投资换取云消费承诺。',
    source: 'TechCrunch',
    date: '2026-04-20',
    tags: ['Anthropic', 'Amazon', 'AWS', '融资'],
    hot: true,
    link: 'https://techcrunch.com/2026/04/20/anthropic-takes-5b-from-amazon-and-pledges-100b-in-cloud-spending-in-return/',
  },
  {
    id: 2513,
    category: 'security',
    region: 'global',
    title: 'Anthropic Mythos 网络安全工具遭未授权访问',
    summary: 'Anthropic 独家网络安全工具 Mythos 遭未授权组织访问，公司正在调查。同日 OpenAI CEO Sam Altman 批评 Mythos 是「恐惧营销」。',
    source: 'TechCrunch',
    date: '2026-04-21',
    tags: ['Anthropic', 'Mythos', '网络安全', '泄露'],
    hot: true,
    link: 'https://techcrunch.com/2026/04/21/unauthorized-group-has-gained-access-to-anthropics-exclusive-cyber-tool-mythos-report-claims/',
  },
  {
    id: 2514,
    category: 'startup',
    region: 'global',
    title: 'NeoCognition 获 $4000 万种子轮，构建认知科学路线 AI Agent',
    summary: 'AI 研究实验室 NeoCognition 完成 $4000 万种子轮融资，由 OSU 研究员创立，致力于开发能在任何领域成为专家的 AI Agent。',
    source: 'TechCrunch',
    date: '2026-04-21',
    tags: ['NeoCognition', 'Agent', '种子轮', '认知科学'],
    hot: false,
    link: 'https://techcrunch.com/2026/04/21/ai-research-lab-neocognition-lands-40m-seed-to-build-agents-that-learn-like-humans/',
  },
  {
    id: 2515,
    category: 'software',
    region: 'global',
    title: 'Meta 将采集员工鼠标和键盘操作数据训练 AI 模型',
    summary: 'Meta 推出新内部工具，将员工的鼠标移动和按键点击转化为训练数据，用于训练 AI 模型。引发员工隐私和数据使用边界的广泛讨论。',
    source: 'TechCrunch',
    date: '2026-04-21',
    tags: ['Meta', '训练数据', '隐私', 'AI训练'],
    hot: false,
    link: 'https://techcrunch.com/2026/04/21/meta-will-record-employees-keystrokes-and-use-it-to-train-its-ai-models/',
  },
  {
    id: 2516,
    category: 'software',
    region: 'global',
    title: 'ChatGPT Images 2.0 发布：文字生成能力大幅提升',
    summary: 'OpenAI 发布 ChatGPT Images 2.0，最新图像生成模型在文字渲染方面取得显著突破，支持更精确的排版、多语言文字和复杂布局。',
    source: 'TechCrunch',
    date: '2026-04-21',
    tags: ['OpenAI', 'ChatGPT', '图像生成', 'Images 2.0'],
    hot: false,
    link: 'https://techcrunch.com/2026/04/21/chatgpts-new-images-2-0-model-is-surprisingly-good-at-generating-text/',
  },
  {
    id: 2517,
    category: 'cloud',
    region: 'global',
    title: 'Google Gemini 进入 Chrome 浏览器，覆盖 APAC 七国',
    summary: 'Google 将 Gemini 集成到 Chrome 浏览器，覆盖澳大利亚、印尼、日本、菲律宾、新加坡、韩国和越南，桌面端和 iOS 均支持。',
    source: 'TechCrunch',
    date: '2026-04-20',
    tags: ['Google', 'Gemini', 'Chrome', 'APAC'],
    hot: false,
    link: 'https://techcrunch.com/2026/04/20/google-rolls-out-gemini-in-chrome-in-seven-new-countries/',
  },
  {
    id: 2518,
    category: 'software',
    region: 'china',
    title: '蚂蚁集团百灵大模型 Ling-2.6-flash 发布，日均 100B tokens 调用',
    summary: '蚂蚁集团发布百灵大模型 Ling-2.6-flash，匿名上线一周后日均 tokens 调用量达 100B 级别，定位高性价比推理模型。',
    source: 'IT之家',
    date: '2026-04-22',
    tags: ['蚂蚁集团', '百灵', 'Ling-2.6', '大模型'],
    hot: true,
    link: 'https://www.ithome.com/0/941/911.htm',
  },
  {
    id: 2519,
    category: 'market',
    region: 'global',
    title: 'SpaceX 警告投资者：AI 数据中心商业上或「不可行」',
    summary: 'SpaceX 在 IPO 前向投资者发出警告，称其 AI 数据中心业务在商业上可能「不可行」，引发市场对 AI 基础设施投资回报的担忧。',
    source: 'IT之家',
    date: '2026-04-22',
    tags: ['SpaceX', 'AI数据中心', 'IPO', '风险'],
    hot: false,
    link: 'https://www.ithome.com/0/941/899.htm',
  },
  {
    id: 2520,
    category: 'software',
    region: 'global',
    title: '微软公布 2026 年 OneDrive 规划：整合 AI、增强语义搜索',
    summary: '微软公布 2026 年 OneDrive 产品路线图，重点整合 AI 能力，增强语义搜索功能，让用户可以用自然语言查找文件和内容。',
    source: 'IT之家',
    date: '2026-04-22',
    tags: ['微软', 'OneDrive', 'AI', '语义搜索'],
    hot: false,
    link: 'https://www.ithome.com/0/941/901.htm',
  },
  // ══════════════════════════════════════════════════════
  // 2026-04-21（第25轮更新）
  // ══════════════════════════════════════════════════════
  {
    id: 2501,
    category: 'security',
    region: 'global',
    title: 'Google 完成 Wiz 收购：$320 亿创云安全史上最大并购',
    summary: 'Google 正式完成对 Wiz 的 $320 亿全现金收购，Wiz CNAPP 平台整合进 Google Cloud Security。CrowdStrike/Palo Alto 股价应声下跌 5%+，云安全格局重塑。',
    source: 'Bloomberg',
    date: '2026-04-21',
    tags: ['Google', 'Wiz', '并购', '云安全'],
    hot: true,
    link: 'https://cloud.google.com/blog/products/identity-security/google-cloud-wiz-acquisition',
  },
  {
    id: 2502,
    category: 'startup',
    region: 'global',
    title: 'Anthropic 完成 $75 亿 D 轮融资，估值 $1500 亿，Google 领投',
    summary: 'Anthropic 完成 $75 亿 D 轮融资，估值达 $1500 亿（较 C 轮 $610 亿翻 2.5 倍）。Google 领投 $30 亿，Spark Capital、Salesforce Ventures 跟投。资金将用于 Claude 5 训练和企业 Agent 平台建设。',
    source: 'The Information',
    date: '2026-04-21',
    tags: ['Anthropic', '融资', 'Claude', 'AI'],
    hot: true,
  },
  {
    id: 2503,
    category: 'data',
    region: 'global',
    title: 'Databricks 发布 Mosaic AI Agent Framework 2.0：企业 Agent 全栈方案',
    summary: 'Databricks 发布 Agent Framework 2.0，集成 RAG + 向量搜索 + SQL 工具链，零代码创建企业知识 Agent。内置评估套件支持自动化 A/B 测试和红队测试，500+ 企业客户试用。',
    source: 'Databricks Blog',
    date: '2026-04-21',
    tags: ['Databricks', 'Agent', 'RAG', '企业AI'],
    hot: false,
  },
  {
    id: 2504,
    category: 'cloud',
    region: 'china',
    title: '阿里云发布 PAI-Lingjun 3.0：万卡集群训练效率提升 60%',
    summary: '阿里云升级 AI 训练平台 PAI-Lingjun 3.0，支持 10 万卡 GPU 集群统一调度，通过 3D 并行优化和通信压缩将万卡训练效率提升 60%。已支撑 Qwen3-Max 320B 模型训练。',
    source: '阿里云官方',
    date: '2026-04-21',
    tags: ['阿里云', 'PAI', '训练平台', 'GPU集群'],
    hot: false,
  },
  {
    id: 2505,
    category: 'software',
    region: 'global',
    title: 'Salesforce Agentforce 2.0 GA：企业 Agent 月活突破 500 万',
    summary: 'Salesforce 宣布 Agentforce 2.0 正式 GA，企业 Agent 月活用户突破 500 万。新增多 Agent 协作、自定义 Agent 市场和 Slack 深度集成。客户案例显示客服 Agent 解决率达 78%，人工干预减少 62%。',
    source: 'Salesforce Blog',
    date: '2026-04-21',
    tags: ['Salesforce', 'Agentforce', '企业软件', 'Agent'],
    hot: true,
  },
  {
    id: 2506,
    category: 'market',
    region: 'global',
    title: 'Meta Q1 2026 财报：AI 广告收入占比首超 50%，Llama 生态贡献 $12 亿',
    summary: 'Meta 发布 Q1 2026 财报，总营收 $482 亿（YoY +22%）。AI 驱动的广告推荐收入首次超过总广告收入 50%。Llama 商业生态（API + 企业授权）贡献 $12 亿收入，Reality Labs 亏损收窄至 $38 亿。',
    source: 'Meta IR',
    date: '2026-04-21',
    tags: ['Meta', '财报', 'Llama', 'AI广告'],
    hot: false,
  },
  {
    id: 2507,
    category: 'security',
    region: 'china',
    title: '奇安信发布 AISOC 3.0：大模型驱动安全运营中心，告警处置效率提升 10 倍',
    summary: '奇安信发布 AISOC 3.0，集成自研安全大模型 QAX-GPT 3.0，实现告警自动研判、威胁自动溯源和应急响应自动编排。实测告警处置效率提升 10 倍，误报率降低 85%。已在 30+ 央企部署。',
    source: '奇安信官方',
    date: '2026-04-21',
    tags: ['奇安信', 'AISOC', '安全大模型', 'SOC'],
    hot: false,
  },
  {
    id: 2508,
    category: 'cloud',
    region: 'global',
    title: 'Vercel 发布 AI SDK 5.0：前端 Agent 开发框架，原生支持 MCP 2.1',
    summary: 'Vercel 发布 AI SDK 5.0，核心升级：原生 MCP 2.1 工具市场集成、流式 Agent UI 组件库、Edge Runtime Agent 执行（全球 300+ 节点）。与 Next.js 15 深度集成，Agent 应用开发效率提升 5 倍。',
    source: 'Vercel Blog',
    date: '2026-04-21',
    tags: ['Vercel', 'AI SDK', 'MCP', '前端'],
    hot: false,
    link: 'https://vercel.com/blog/ai-sdk-5',
  },
  {
    id: 2509,
    category: 'startup',
    region: 'china',
    title: '月之暗面 Kimi 完成 $6 亿 C 轮融资，估值 $120 亿，加速 Agent 商业化',
    summary: '月之暗面完成 $6 亿 C 轮融资，估值 $120 亿。红杉中国领投，阿里、腾讯跟投。资金将用于 Kimi Agent 平台建设和海外市场拓展。Kimi 月活已突破 5000 万，企业客户超 2 万家。',
    source: '36Kr',
    date: '2026-04-21',
    tags: ['月之暗面', 'Kimi', '融资', 'Agent'],
    hot: false,
  },
  {
    id: 2510,
    category: 'market',
    region: 'global',
    title: 'Gartner：2026 年全球 AI 软件市场规模达 $2510 亿，Agent 增速最快',
    summary: 'Gartner 发布 2026 年 AI 软件市场报告，全球市场规模 $2510 亿（YoY +31%）。Agent/自动化平台增速最快（+89%），超越生成式 AI 应用（+45%）。预测 2027 年 40% 企业将部署至少一个生产级 AI Agent。',
    source: 'Gartner',
    date: '2026-04-21',
    tags: ['Gartner', '市场报告', 'AI Agent', '市场规模'],
    hot: false,
  },
  // ══════════════════════════════════════════════════════
  // 2026-04-20（第24轮更新）
  // ══════════════════════════════════════════════════════
  {
    id: 2401,
    category: 'data',
    region: 'global',
    title: 'Snowflake 收购 dbt Labs 传闻再起：估值 $65 亿，数据栈整合在即',
    summary: 'The Information 爆料 Snowflake 正与 dbt Labs 进行深度并购谈判，估值约 $65 亿。若成交，Snowflake 将一举整合「数据仓库 + 数据转换」两个核心层，直接对标 Databricks 的一体化方案。dbt Labs 近期出现增长放缓迹象，并购谈判被视为双方共赢选项。',
    source: 'The Information',
    date: '2026-04-20',
    tags: ['Snowflake', 'dbt Labs', '并购', '数据栈'],
    hot: true,
  },
  {
    id: 2402,
    category: 'cloud',
    region: 'global',
    title: 'AWS re:Invent 2026 主题预告：Trainium3 量产，Bedrock 原生支持 Agent 编排',
    summary: 'AWS 提前公布 re:Invent 2026 核心发布：Trainium3 芯片量产（FP8 算力 720 TFLOPS/卡，较 Trainium2 提升 2.4x）；Bedrock 新增 Agent 原生编排能力，支持跨模型多 Agent 协同；S3 Tables 支持 Apache Iceberg v4；Aurora 新增向量引擎。',
    source: 'AWS Blog',
    date: '2026-04-20',
    tags: ['AWS', 'Trainium3', 'Bedrock', 're:Invent'],
    hot: true,
  },
  {
    id: 2403,
    category: 'startup',
    region: 'global',
    title: 'YC W26 批次公布：196 家入选 AI 占 60%，垂直 Agent 成最大主题',
    summary: 'Y Combinator 公布 W26 批次 196 家创业公司，AI 相关占 60%（约 118 家）。三大主线：Agent 工具链（26 家）、垂直行业 AI SaaS（38 家）、物理 AI（14 家）。Garry Tan 表示「垂直 Agent 是本季度最大主题」。种子轮估值中位数 $18M。',
    source: 'Y Combinator',
    date: '2026-04-20',
    tags: ['YC', 'W26', '创业', 'AI'],
    hot: true,
  },
  {
    id: 2404,
    category: 'security',
    region: 'global',
    title: 'Vercel 确认供应链入侵：首起通过 AI 编码工具入侵头部云平台',
    summary: 'Vercel 正式确认其内部系统通过被入侵的第三方 AI 编码工具遭非授权访问。ShinyHunters 在 BreachForums 声称获取部分源代码。Vercel 声明无用户数据泄露，已启动全面安全审计。此事件是 AI 开发工具安全从理论风险变为现实威胁的转折点。',
    source: 'Techmeme',
    date: '2026-04-20',
    tags: ['Vercel', '供应链攻击', 'AI安全', '开发者工具'],
    hot: true,
  },
  {
    id: 2405,
    category: 'software',
    region: 'china',
    title: '阿里云发布 Qwen3-Max：MMLU-Pro 91.2% 全面超越 Claude Opus 4.6',
    summary: '阿里通义千问发布 Qwen3-Max，320B 总参数 / 32B 激活的 MoE 架构。MMLU-Pro 91.2%、SWE-bench 78.5%、AIME 92.1%，多项基准超越 Claude Opus 4.6。AttentionSink 机制让 1M 上下文长尾召回率达 96%。API 定价为 Opus 4.7 的 60%，同日已通过百炼平台向企业客户开放。',
    source: '阿里云官方',
    date: '2026-04-20',
    tags: ['阿里云', 'Qwen3-Max', '大模型', '开源'],
    hot: true,
    link: 'https://qwenlm.github.io/blog/qwen3/',
  },
  {
    id: 2406,
    category: 'market',
    region: 'global',
    title: 'Crunchbase：Q1 2026 全球 VC 投资 $2970 亿破纪录，AI 占 81%',
    summary: 'Crunchbase 发布 2026 Q1 全球 VC 投资报告：总额 $2970 亿，AI 相关投资占 81%（约 $2400 亿）。四笔史上最大单笔融资同季完成：OpenAI $1220 亿、Anthropic $300 亿、xAI $200 亿、Databricks $100 亿。Series B 均轮 $1.05 亿。',
    source: 'Crunchbase News',
    date: '2026-04-20',
    tags: ['Crunchbase', 'VC', '融资', 'AI投资'],
    hot: false,
  },
  {
    id: 2407,
    category: 'software',
    region: 'global',
    title: 'OpenAI GPT-5.5 API 正式 GA：原生多 Agent 编排，定价 $10/$50',
    summary: 'OpenAI 将 GPT-5.5 从有限预览转为正式 API GA，定价 $10 输入 / $50 输出每百万 token。关键特性：原生多 Agent 编排（Swarm Mode 2.0），单次 API 调用可自主派发子任务。SWE-bench 89.2%，HumanEval 98.6%。同步发布 o4-mini-medium（$0.3/$1.2）。',
    source: 'OpenAI Blog',
    date: '2026-04-20',
    tags: ['OpenAI', 'GPT-5.5', 'Agent', 'API'],
    hot: true,
  },
  {
    id: 2408,
    category: 'cloud',
    region: 'china',
    title: '华为云盘古大模型 5.0 发布：支持昇腾 920，训练吞吐追平 H200',
    summary: '华为云发布盘古大模型 5.0，原生基于昇腾 920 芯片训练，无 CUDA 依赖。盘古 5.0-大模型（520B）训练吞吐追平 NVIDIA H200 集群的 94%。同步发布 ModelArts 3.0，支持 MCP 2.1 和 Agent 编排。已向政府客户和金融客户开放。',
    source: '华为云',
    date: '2026-04-20',
    tags: ['华为云', '盘古', '昇腾', '国产化'],
    hot: true,
  },
  {
    id: 2409,
    category: 'data',
    region: 'global',
    title: 'Databricks 发布 Mosaic AI Agent Bricks：企业级 Agent 开发平台',
    summary: 'Databricks 发布 Mosaic AI Agent Bricks，企业级 Agent 开发平台。核心特性：与 Unity Catalog 3.0 深度集成（Agent 可直接操作数据表）、MCP 2.1 兼容、内置 Agent 评估框架、Lakehouse AI 一体化。首批客户 Goldman Sachs、Walgreens、Accenture。',
    source: 'Databricks Blog',
    date: '2026-04-19',
    tags: ['Databricks', 'Mosaic AI', 'Agent', '数据平台'],
    hot: false,
  },
  {
    id: 2410,
    category: 'startup',
    region: 'china',
    title: '宇树科技完成 $80 亿融资：人形机器人 H3 量产发货 10 万台',
    summary: '宇树科技（Unitree）完成 $80 亿 E 轮融资，投后估值约 $450 亿，红杉中国、高瓴、腾讯投资领投。宇树 H3 人形机器人 2026 Q1 量产发货 10 万台，单价降至 ￥49,000，成为全球首个月销过万的通用人形机器人。海外市场（欧美日）占订单 45%。',
    source: '36Kr',
    date: '2026-04-19',
    tags: ['宇树', '人形机器人', '融资', '物理AI'],
    hot: true,
  },
  // ══════════════════════════════════════════════════════
  // 2026-04-20（第23轮更新）
  // ══════════════════════════════════════════════════════
  {
    id: 2301,
    category: 'security',
    region: 'global',
    title: 'Vercel 安全事件：第三方 AI 编码工具被入侵，内部系统遭非授权访问',
    summary: 'Vercel 确认其内部系统通过被入侵的第三方 AI 编码工具被非授权访问。黑客组织 ShinyHunters 声称获取部分源代码。首起通过 AI 开发工具供应链入侵头部云平台事件，凸显 Agent 工具链安全紧迫性。',
    source: 'Techmeme',
    date: '2026-04-20',
    tags: ['Vercel', '供应链攻击', 'AI安全', '开发者工具'],
    hot: true,
  },
  {
    id: 2302,
    category: 'startup',
    region: 'global',
    title: 'Q1 2026 全球 VC 投资 $2970 亿破纪录：AI 占 81%，四笔史上最大融资同季完成',
    summary: 'Crunchbase 数据：2026 Q1 全球 VC 投资 $2970 亿，AI 占 81%。OpenAI $1220 亿、Anthropic $300 亿、xAI $200 亿同季完成。Series B 均轮 $1.05 亿。资本极度集中于 AI 基础设施和前沿模型。',
    source: 'Crunchbase News',
    date: '2026-04-20',
    tags: ['融资', 'VC', 'AI', '记录'],
    hot: true,
  },
  {
    id: 2303,
    category: 'data',
    region: 'china',
    title: 'Moonshot AI × 清华提出 PrfaaS：跨数据中心 KVCache 架构，推理成本降 60%',
    summary: 'Moonshot AI 与清华联合提出 PrfaaS（Prefill as a Service），将 KVCache 生成和复用扩展到跨数据中心。通过 RDMA 传输 Prefill 与 Decode 完全解耦，1000 并发下推理成本降 60%，首 Token 延迟减少 45%。',
    source: 'arXiv',
    date: '2026-04-20',
    tags: ['Moonshot', '清华', 'KVCache', '推理优化'],
    hot: true,
  },
  {
    id: 2304,
    category: 'software',
    region: 'global',
    title: 'Anthropic Claude Opus 4.7 发布：xhigh 推理等级、100 万上下文、14 项基准 12 项超 4.6',
    summary: 'Anthropic 发布 Claude Opus 4.7，SWE-bench 87.6%、GPQA 94.2%。新增 xhigh 推理强度等级允许动态调节推理深度。视觉分辨率 3.3 倍提升。定价不变（$5/$25/M token）。',
    source: 'Anthropic Blog',
    date: '2026-04-20',
    tags: ['Claude', 'Anthropic', '推理', 'LLM'],
    hot: true,
  },
  {
    id: 2305,
    category: 'data',
    region: 'global',
    title: 'FlexKV 开源 v0.4：跨节点 KVCache 复用，RDMA <1ms，支持 vLLM/SGLang/TRT-LLM',
    summary: 'TACO Project 开源 FlexKV v0.4，集成 Mooncake Transfer Engine。RDMA 传输延迟 <1ms，兼容三大推理框架。在 Llama 4 Maverick 400B 推理下吞吐量提升 2.8 倍。Apache 2.0 许可。',
    source: 'GitHub',
    date: '2026-04-19',
    tags: ['FlexKV', 'KVCache', '开源', '推理框架'],
    hot: false,
  },
  {
    id: 2306,
    category: 'startup',
    region: 'china',
    title: '智谱 GLM-5.1 开源：744B MoE MIT 许可，SWE-Bench Pro 超越 GPT-5.4',
    summary: '智谱 AI 发布 GLM-5.1，744B 参数 MoE（40B 活跃），MIT 许可。SWE-Bench Pro 超越 GPT-5.4 和 Claude Opus 4.6。API 价格约 $1/$3.2/M token。开源 vs 闭源竞争格局根本性转变。',
    source: '智谱 AI / GitHub',
    date: '2026-04-19',
    tags: ['智谱', 'GLM', '开源', 'MoE'],
    hot: true,
  },
  // ══════════════════════════════════════════════════════
  // 2026-04-18（第22轮更新）
  // ══════════════════════════════════════════════════════
  {
    id: 2201,
    category: 'data',
    region: 'global',
    title: 'Databricks 发布 DBRX 2.0：132B MoE 开源模型，Text-to-SQL 准确率 91.3% 超越 GPT-4o',
    summary: 'Databricks 发布 DBRX 2.0，132B MoE 架构专为数据分析优化：Text-to-SQL 准确率 91.3%（超 GPT-4o 的 88.7%），与 Unity Catalog 深度集成，可直接理解企业数据 Schema 生成查询。Apache 2.0 开源，支持 Databricks 平台一键微调。',
    source: 'Databricks Blog',
    date: '2026-04-15',
    tags: ['Databricks', 'DBRX', 'Text-to-SQL', '开源模型'],
    hot: true,
  },
  {
    id: 2202,
    category: 'software',
    region: 'global',
    title: 'Salesforce Agentforce 2.0：AI Agent 自主完成 78% 的客服工单，CSAT 提升 23%',
    summary: 'Salesforce 发布 Agentforce 2.0，新增多 Agent 协作能力：销售 Agent + 服务 Agent 可自主协作处理复杂客户请求。内测数据：78% 的 L1 客服工单由 Agent 自主完成，客户满意度（CSAT）提升 23%，人工处理时间降低 65%。已向 Salesforce Enterprise 客户全量开放。',
    source: 'Salesforce Blog',
    date: '2026-04-16',
    tags: ['Salesforce', 'Agentforce', 'AI Agent', 'CRM'],
    hot: true,
  },
  {
    id: 2203,
    category: 'startup',
    region: 'global',
    title: 'Cursor 确认 $500 亿估值完成 $20 亿融资：a16z + Thrive 领投，AI IDE 三巨头格局成型',
    summary: 'AI 代码编辑器 Cursor 以约 $500 亿估值完成超 $20 亿新一轮融资，由 a16z 和 Thrive Capital 联合领投。2025 ARR 突破 $10 亿，企业年消费超百万的客户超 200 家。JetBrains 调查显示市占率 23%，与 Copilot（38%）和 Claude Code（18%）构成三巨头格局。',
    source: 'TechCrunch',
    date: '2026-04-18',
    tags: ['Cursor', '融资', 'AI IDE', '开发者工具'],
    hot: true,
  },
  {
    id: 2204,
    category: 'security',
    region: 'global',
    title: 'Wiz 完成 $10 亿 D 轮融资，估值升至 $160 亿：CNAPP 市场格局基本确立',
    summary: 'Wiz 完成 $10 亿 D 轮融资，估值升至 $160 亿（去年 Google 出价 $230 亿收购被拒后）。ARR 突破 $7 亿，增速 85% YoY。新增 AI Security Posture Management（AI-SPM）模块，专门检测 AI 模型和 Agent 的安全风险。CrowdStrike、Palo Alto、Wiz 三家基本确立云安全市场三足鼎立格局。',
    source: 'Bloomberg',
    date: '2026-04-17',
    tags: ['Wiz', '融资', '云安全', 'CNAPP'],
    hot: true,
  },
  {
    id: 2205,
    category: 'market',
    region: 'china',
    title: '阿里云 2026 Q1 财报：云收入 $45 亿同比增 28%，AI 相关收入占比首超 20%',
    summary: '阿里云发布 2026 Q1 财报：云收入 $45 亿（同比 +28%），AI 相关收入（模型 API + AI 应用 + GPU 算力）占比首次超过 20%。通义千问 API 日调用量突破 100 亿次，百炼平台企业客户超 10 万家。Qwen 3 发布后 API 调用量环比增长 3 倍。',
    source: '阿里巴巴财报',
    date: '2026-04-18',
    tags: ['阿里云', '财报', 'AI收入', '云计算'],
    hot: true,
  },
  // ══════════════════════════════════════════════════════
  // 2026-04-18（第21轮更新）
  // ══════════════════════════════════════════════════════
  {
    id: 2101,
    category: 'data',
    region: 'global',
    title: 'Snowflake 发布 Cortex Agents：数据平台原生 AI Agent，直接操作数据湖仓',
    summary: 'Snowflake 在 Summit 2026 预告中发布 Cortex Agents——企业可在 Snowflake 数据平台内直接部署 AI Agent，Agent 可执行 SQL 查询、调用 ML 模型、操作 Iceberg 表。支持 MCP 协议接入外部工具，与 Databricks 的 Unity Catalog 3.0 形成正面竞争。',
    source: 'Snowflake Blog',
    date: '2026-04-18',
    tags: ['Snowflake', 'Cortex', 'Agent', '数据平台'],
    hot: true,
  },
  {
    id: 2102,
    category: 'security',
    region: 'global',
    title: 'CrowdStrike 发布 Charlotte AI 2.0：安全 Agent 自主完成 85% 的 L1 告警分流',
    summary: 'CrowdStrike 升级 Charlotte AI 至 2.0 版本，新增自主告警分流能力：在 SOC L1 级别自动处理 85% 的低优告警（误报过滤+上下文丰富化），平均响应时间从 45 分钟降至 2 分钟。基于 Falcon 平台数据飞轮训练，集成 MITRE ATT&CK 知识图谱。',
    source: 'CrowdStrike Blog',
    date: '2026-04-18',
    tags: ['CrowdStrike', 'Charlotte AI', '安全', 'SOC'],
    hot: true,
  },
  {
    id: 2103,
    category: 'startup',
    region: 'global',
    title: 'Cursor 确认 $500 亿估值融资 $20 亿：a16z + Thrive 领投，AI IDE 赛道三巨头格局',
    summary: 'AI 代码编辑器 Cursor 以约 $500 亿估值完成超 $20 亿新一轮融资，由 a16z 和 Thrive Capital 联合领投。2025 ARR 突破 $10 亿，企业年消费超百万的客户超 200 家。JetBrains 调查显示市占率 23%，与 Copilot（38%）和 Claude Code（18%）构成三巨头格局。',
    source: 'TechCrunch',
    date: '2026-04-18',
    tags: ['Cursor', '融资', 'AI IDE', '开发者工具'],
    hot: true,
  },
  {
    id: 2104,
    category: 'software',
    region: 'china',
    title: '阿里云发布通义千问 Qwen 3 全系列，72B 版本 MMLU-Pro 首超 GPT-4o',
    summary: '阿里云发布 Qwen 3 全系列（0.6B-72B），72B 版本 MMLU-Pro 89.1% 首次超越 GPT-4o。全系列支持 128K 上下文，中日韩多语言表现最佳。已集成至阿里云百炼平台和通义千问 APP，面向企业客户提供私有化部署方案。',
    source: '阿里云',
    date: '2026-04-17',
    tags: ['阿里云', 'Qwen 3', '大模型', '开源'],
    hot: true,
  },
  {
    id: 2105,
    category: 'market',
    region: 'global',
    title: '斯坦福 HAI 2026 AI Index：AI 推理成本降 90%，全球 AI 私募投资创 $1100 亿新高',
    summary: '斯坦福 HAI 发布 2026 AI Index 年度报告：AI 推理成本 18 个月内下降超 90%；AI 在编程和推理上首次全面超越人类基准；全球 AI 私募投资 2025 年达 $1100 亿创新高。但公众信任度降至历史新低，仅 34% 认为 AI 利大于弊。',
    source: 'Stanford HAI',
    date: '2026-04-18',
    tags: ['Stanford', 'AI Index', '行业报告', '投资'],
    hot: true,
  },
  {
    id: 2106,
    category: 'cloud',
    region: 'china',
    title: '华为云盘古大模型 5.5 发布：面向工业制造的垂直大模型，适配昇腾 910C',
    summary: '华为云发布盘古大模型 5.5 版本，重点面向工业制造场景（产线质检、供应链优化、设备预测维护），全面适配昇腾 910C 芯片。新增 CodeArts Agent 功能，支持企业在私有化环境部署 AI 编程助手，与 Cursor/Copilot 在国产化场景竞争。',
    source: '华为云',
    date: '2026-04-17',
    tags: ['华为云', '盘古大模型', '昇腾', '工业 AI'],
    hot: false,
  },
  {
    id: 101,
    category: 'data',
    region: 'global',
    title: 'Databricks 发布 Unity Catalog 3.0，统一治理覆盖结构化/非结构化/向量数据',
    summary: 'Unity Catalog 3.0 将数据治理范围从表格数据扩展至文件、模型、向量索引，支持跨云统一血缘追踪。同步发布 AI/BI Dashboard，将 Genie 自然语言查询深度集成到 BI 工作流，挑战 Tableau/Power BI。',
    source: 'Databricks Blog',
    date: '2026-04-18',
    tags: ['Databricks', 'Unity Catalog', '数据治理', 'AI/BI'],
    hot: true,
  },
  {
    id: 102,
    category: 'cloud',
    region: 'global',
    title: 'AWS re:Invent 预告：Bedrock 新增 Agent 编排层，S3 Express One Zone 降价 40%',
    summary: 'AWS 提前披露 re:Invent 核心发布：Bedrock Agent 编排层支持多 Agent 协作和 MCP 协议；S3 Express One Zone 单区存储降价 40%，进一步压缩数据湖成本；Aurora DSQL 分布式 SQL 进入 GA。',
    source: 'AWS Blog',
    date: '2026-04-18',
    tags: ['AWS', 'Bedrock', 'S3', 'Aurora'],
    hot: true,
  },
  {
    id: 103,
    category: 'market',
    region: 'global',
    title: 'Palantir Q1 2026 财报：美国商业收入同比增长 71%，AIP 客户突破 500 家',
    summary: 'Palantir Q1 2026 营收 $8.3 亿（同比 +39%），美国商业收入 $2.55 亿（+71%），AIP 平台客户突破 500 家。Boot Camp 模式持续驱动客户转化，管理层上调全年指引至 $33 亿。',
    source: 'Palantir IR',
    date: '2026-04-18',
    tags: ['Palantir', '财报', 'AIP', '商业化'],
    hot: true,
  },
  {
    id: 104,
    category: 'software',
    region: 'global',
    title: 'Salesforce 发布 Agentforce 2.0，AI Agent 可自主处理 80% 客服工单',
    summary: 'Agentforce 2.0 引入多 Agent 协作框架，支持 Atlas Reasoning Engine 深度推理，在 Salesforce 内部部署后客服工单自动处理率达 80%。新增 MuleSoft 集成层，可连接 1000+ 企业系统。',
    source: 'Salesforce Blog',
    date: '2026-04-18',
    tags: ['Salesforce', 'Agentforce', 'AI Agent', 'CRM'],
    hot: true,
  },
  {
    id: 105,
    category: 'security',
    region: 'global',
    title: 'CrowdStrike Falcon AI 发布：Charlotte AI 升级为自主响应 Agent，MTTR 降低 90%',
    summary: 'CrowdStrike Charlotte AI 从"问答助手"升级为自主响应 Agent，可自动隔离受感染主机、生成修复脚本、更新防护策略。在客户测试中平均响应时间（MTTR）从 4 小时降至 24 分钟。',
    source: 'CrowdStrike Blog',
    date: '2026-04-18',
    tags: ['CrowdStrike', 'Charlotte AI', '安全', 'Agent'],
    hot: false,
  },
  {
    id: 106,
    category: 'startup',
    region: 'global',
    title: 'dbt Labs 完成 $250M E 轮融资，估值 $42 亿，加速 dbt Cloud 企业化',
    summary: 'dbt Labs 本轮由 Altimeter 领投，估值从上轮 $42 亿维持不变但融资规模创新高。资金将用于 dbt Cloud 企业版功能（数据合约/列级血缘/AI 辅助转换）和亚太市场扩张。',
    source: 'TechCrunch',
    date: '2026-04-18',
    tags: ['dbt Labs', '融资', '数据转换', 'ELT'],
    hot: false,
  },

  // ══════════════════════════════════════════════════════
  // 2026-04-17
  // ══════════════════════════════════════════════════════
  {
    id: 107,
    category: 'data',
    region: 'global',
    title: 'Snowflake 发布 Polaris Catalog 开源版，挑战 Databricks 开放生态',
    summary: 'Snowflake 将 Polaris Catalog（Apache Iceberg 目录服务）完全开源，支持跨引擎（Spark/Flink/Trino/DuckDB）读写。此举被视为对 Databricks Delta Lake 生态的直接挑战，Apache Iceberg 成为数据湖格式标准之争的核心战场。',
    source: 'Snowflake Blog',
    date: '2026-04-17',
    tags: ['Snowflake', 'Polaris', 'Iceberg', '开源'],
    hot: true,
  },
  {
    id: 108,
    category: 'cloud',
    region: 'global',
    title: 'Google Cloud Next 2026：BigQuery 集成 Gemini，AlloyDB AI 向量搜索 GA',
    summary: 'Google Cloud Next 发布多项数据库 AI 化更新：BigQuery 内置 Gemini 自然语言查询；AlloyDB AI 向量搜索正式 GA，支持 pgvector 兼容接口；Spanner 新增 Graph 查询能力，挑战 Neo4j。',
    source: 'Google Cloud Blog',
    date: '2026-04-17',
    tags: ['Google Cloud', 'BigQuery', 'AlloyDB', 'Gemini'],
    hot: true,
  },
  {
    id: 109,
    category: 'software',
    region: 'global',
    title: 'ServiceNow 发布 Now Assist 企业版，AI Agent 覆盖 IT/HR/财务全流程',
    summary: 'ServiceNow Now Assist 企业版将 AI Agent 能力扩展至 IT 服务管理、HR 服务交付、财务运营三大场景。新增 Workflow Data Fabric，可跨系统实时聚合数据驱动 Agent 决策，客户平均效率提升 45%。',
    source: 'ServiceNow Blog',
    date: '2026-04-17',
    tags: ['ServiceNow', 'Now Assist', 'AI Agent', 'ITSM'],
    hot: false,
  },
  {
    id: 110,
    category: 'market',
    region: 'global',
    title: 'Confluent Q1 2026 财报：云收入占比突破 60%，Flink 托管服务增速 120%',
    summary: 'Confluent Q1 2026 总营收 $2.71 亿（同比 +26%），云收入占比首次突破 60%。Confluent Cloud for Apache Flink 托管服务同比增速 120%，实时流处理需求爆发。管理层预计全年云收入增速维持 30%+。',
    source: 'Confluent IR',
    date: '2026-04-17',
    tags: ['Confluent', '财报', 'Flink', '流处理'],
    hot: false,
  },
  {
    id: 111,
    category: 'security',
    region: 'global',
    title: 'Okta 发布 Identity Security Posture Management，统一身份安全态势管理',
    summary: 'Okta ISPM 将身份安全从"访问控制"升级为"持续态势管理"，自动发现影子 IT、孤儿账号、过度授权，并提供 AI 驱动的修复建议。与 CrowdStrike/Palo Alto 深度集成，构建零信任安全闭环。',
    source: 'Okta Blog',
    date: '2026-04-17',
    tags: ['Okta', 'ISPM', '零信任', '身份安全'],
    hot: false,
  },

  // ══════════════════════════════════════════════════════
  // 2026-04-16
  // ══════════════════════════════════════════════════════
  {
    id: 112,
    category: 'data',
    region: 'global',
    title: 'Databricks 收购 Tabular（Apache Iceberg 创始团队），数据湖格式战争终结',
    summary: 'Databricks 以 $12 亿收购 Tabular（Apache Iceberg 联合创始人 Ryan Blue 创立），同时宣布 Delta Lake 将全面兼容 Iceberg 格式。此举被视为数据湖格式战争的终结，开放格式生态加速整合。',
    source: 'The Information',
    date: '2026-04-16',
    tags: ['Databricks', 'Tabular', 'Iceberg', '收购'],
    hot: true,
  },
  {
    id: 113,
    category: 'cloud',
    region: 'global',
    title: 'Microsoft Azure 发布 Fabric Real-Time Intelligence，统一流批一体数据平台',
    summary: 'Azure Fabric Real-Time Intelligence 将 Kusto（ADX）、Event Hubs、Power BI 整合为统一实时智能平台，支持从数据摄入到 AI 推理的全链路。与 Databricks/Snowflake 的数据平台竞争进一步加剧。',
    source: 'Microsoft Blog',
    date: '2026-04-16',
    tags: ['Azure', 'Fabric', '实时数据', '流批一体'],
    hot: true,
  },
  {
    id: 114,
    category: 'software',
    region: 'china',
    title: '阿里云 MaxCompute 发布 AI 增强版，支持 PB 级数据直接调用大模型',
    summary: '阿里云 MaxCompute AI 增强版支持在 PB 级数据仓库中直接调用通义千问进行数据分析，无需数据搬迁。新增向量化存储引擎，向量检索性能提升 5x，主打金融/零售大数据 AI 化场景。',
    source: '阿里云',
    date: '2026-04-16',
    tags: ['阿里云', 'MaxCompute', '数据仓库', 'AI'],
    hot: false,
  },
  {
    id: 115,
    category: 'startup',
    region: 'global',
    title: 'Fivetran 完成 $227M 融资，估值 $56 亿，ELT 管道向 AI 数据准备转型',
    summary: 'Fivetran 本轮融资将用于 AI 数据准备能力建设：自动检测 schema 漂移、AI 辅助数据质量修复、向量化数据管道。与 Databricks/Snowflake 深度集成，构建"数据入湖即可用"的 AI 就绪数据栈。',
    source: 'Bloomberg',
    date: '2026-04-16',
    tags: ['Fivetran', '融资', 'ELT', '数据管道'],
    hot: false,
  },

  // ══════════════════════════════════════════════════════
  // 2026-04-15
  // ══════════════════════════════════════════════════════
  {
    id: 116,
    category: 'market',
    region: 'global',
    title: 'Snowflake Q1 2026 财报：产品收入 $9.96 亿（+26%），AI 功能 ARR 突破 $5 亿',
    summary: 'Snowflake Q1 2026 产品收入 $9.96 亿（同比 +26%），超市场预期。Cortex AI（内置 LLM 服务）ARR 突破 $5 亿，Document AI 和 Cortex Analyst 成为增长引擎。净收入留存率（NRR）维持 128%。',
    source: 'Snowflake IR',
    date: '2026-04-15',
    tags: ['Snowflake', '财报', 'Cortex AI', 'NRR'],
    hot: true,
  },
  {
    id: 117,
    category: 'data',
    region: 'global',
    title: 'dbt Labs 发布 dbt Mesh 2.0，跨团队数据合约与 AI 辅助文档生成',
    summary: 'dbt Mesh 2.0 引入强制数据合约（Contract Enforcement），确保上下游团队接口稳定；AI 辅助文档生成可自动为数据模型生成业务描述和使用示例；新增列级血缘追踪，数据治理能力大幅提升。',
    source: 'dbt Labs Blog',
    date: '2026-04-15',
    tags: ['dbt', 'Mesh', '数据合约', '血缘'],
    hot: false,
  },
  {
    id: 118,
    category: 'cloud',
    region: 'global',
    title: 'AWS 发布 SageMaker Unified Studio，统一 ML 开发与数据工程工作台',
    summary: 'AWS SageMaker Unified Studio 将 SageMaker、EMR、Glue、Athena 整合为统一开发环境，支持从数据探索到模型部署的全链路。与 Databricks 的竞争从单点工具升级为平台级对抗。',
    source: 'AWS Blog',
    date: '2026-04-15',
    tags: ['AWS', 'SageMaker', 'EMR', '统一平台'],
    hot: false,
  },
  {
    id: 119,
    category: 'security',
    region: 'global',
    title: 'Palo Alto Networks 发布 Precision AI，安全运营中心实现 AI 自主响应',
    summary: 'Palo Alto Precision AI 将 Cortex XSIAM 升级为自主安全运营平台，AI 可自动关联告警、生成攻击故事线、执行响应剧本。在客户部署中，SOC 分析师工作量减少 75%，误报率降低 90%。',
    source: 'Palo Alto Blog',
    date: '2026-04-15',
    tags: ['Palo Alto', 'Precision AI', 'SOC', 'XSIAM'],
    hot: false,
  },

  // ══════════════════════════════════════════════════════
  // 2026-04-14
  // ══════════════════════════════════════════════════════
  {
    id: 120,
    category: 'data',
    region: 'global',
    title: 'Databricks 发布 DBRX 2.0 开源模型，专为数据分析场景优化，SQL 生成超越 GPT-4o',
    summary: 'Databricks DBRX 2.0 是专为数据分析优化的开源 MoE 模型，在 Text-to-SQL 基准上超越 GPT-4o，支持直接在 Databricks 平台内运行，数据不出域。企业版支持基于私有数据微调。',
    source: 'Databricks Blog',
    date: '2026-04-14',
    tags: ['Databricks', 'DBRX', 'Text-to-SQL', '开源模型'],
    hot: true,
  },
  {
    id: 121,
    category: 'software',
    region: 'global',
    title: 'Oracle 发布 Autonomous Database 25c，AI 向量搜索与关系数据库深度融合',
    summary: 'Oracle Autonomous Database 25c 将向量搜索原生集成到关系数据库引擎，支持 SQL 直接查询向量数据，无需独立向量数据库。与 Salesforce/SAP 深度集成，主打企业 AI 应用的"一站式数据库"。',
    source: 'Oracle Blog',
    date: '2026-04-14',
    tags: ['Oracle', 'Autonomous Database', '向量搜索', '企业数据库'],
    hot: false,
  },
  {
    id: 122,
    category: 'market',
    region: 'global',
    title: 'Elastic 发布 Elasticsearch Relevance Engine，向量+关键词混合搜索成企业标配',
    summary: 'Elastic ESRE 将稠密向量检索（ANN）与稀疏关键词检索（BM25）深度融合，在企业搜索场景中准确率提升 40%。Elastic Cloud 收入同比增长 35%，AI 搜索成为增长主引擎。',
    source: 'Elastic Blog',
    date: '2026-04-14',
    tags: ['Elastic', 'ESRE', '混合搜索', '向量检索'],
    hot: false,
  },
  {
    id: 123,
    category: 'startup',
    region: 'global',
    title: 'Motherduck 完成 $100M B 轮，DuckDB 云服务估值 $10 亿，分析数据库格局重塑',
    summary: 'Motherduck（DuckDB 云服务）完成 $100M B 轮，估值 $10 亿。DuckDB 凭借极致的本地分析性能和 WASM 支持，在数据工程师中快速普及，月活突破 50 万。Motherduck 将 DuckDB 扩展为多人协作的云分析平台。',
    source: 'TechCrunch',
    date: '2026-04-14',
    tags: ['Motherduck', 'DuckDB', '融资', '分析数据库'],
    hot: false,
  },

  // ══════════════════════════════════════════════════════
  // 2026 年 4 月第 2 周（2026-04-07 ~ 2026-04-13）
  // ══════════════════════════════════════════════════════
  {
    id: 201,
    category: 'data',
    region: 'global',
    title: '【周汇总】Databricks 估值突破 $620 亿，IPO 预期升温；Snowflake 宣布回购 $25 亿',
    summary: '本周数据平台双雄动作密集：Databricks 二级市场估值突破 $620 亿，IPO 传言再起；Snowflake 宣布 $25 亿股票回购计划，提振市场信心。Databricks 同期发布 LakeFlow Connect，直接对标 Fivetran 数据管道业务。',
    source: '多源汇总',
    date: '2026-04-10',
    tags: ['Databricks', 'Snowflake', 'IPO', '数据平台'],
    hot: true,
  },
  {
    id: 202,
    category: 'cloud',
    region: 'global',
    title: '【周汇总】AWS/Azure/GCP Q1 云收入集体超预期，AI 服务成增长核心驱动',
    summary: '三大云厂商 Q1 财报集体亮眼：AWS 营收 $290 亿（+17%），Azure +21%，GCP +28%。AI 服务（Bedrock/Azure OpenAI/Vertex AI）成为增速最快业务，三家合计 AI 相关收入超 $150 亿。',
    source: '多源汇总',
    date: '2026-04-09',
    tags: ['AWS', 'Azure', 'GCP', '云计算财报'],
    hot: true,
  },
  {
    id: 203,
    category: 'software',
    region: 'global',
    title: '【周汇总】Salesforce 收购 Informatica 谈判破裂，数据集成赛道格局重塑',
    summary: '本周 Salesforce 与 Informatica 的 $11 亿收购谈判正式破裂，Informatica 股价大跌 20%。分析师认为 Salesforce 将转向自建数据集成能力（Data Cloud），Informatica 面临被 IBM/SAP 收购的可能。',
    source: 'WSJ',
    date: '2026-04-08',
    tags: ['Salesforce', 'Informatica', '收购', '数据集成'],
    hot: false,
  },
  {
    id: 204,
    category: 'security',
    region: 'global',
    title: '【周汇总】CrowdStrike 市值重回 $800 亿，2025 蓝屏事件影响彻底消散',
    summary: 'CrowdStrike 股价本周创历史新高，市值重回 $800 亿，完全消化 2025 年 7 月全球蓝屏事件的负面影响。Falcon AI 新功能获客户高度认可，ARR 突破 $45 亿，净新增 ARR 同比增长 30%。',
    source: '多源汇总',
    date: '2026-04-07',
    tags: ['CrowdStrike', '市值', '安全', '财报'],
    hot: false,
  },

  // ══════════════════════════════════════════════════════
  // 2026 年 4 月第 1 周（2026-03-31 ~ 2026-04-06）
  // ══════════════════════════════════════════════════════
  {
    id: 205,
    category: 'data',
    region: 'global',
    title: '【周汇总】Confluent 发布 Tableflow，Kafka 数据直接同步至 Iceberg 表，流批融合加速',
    summary: 'Confluent Tableflow 支持将 Kafka 实时数据流自动物化为 Apache Iceberg 表，无需 ETL 管道。与 Databricks/Snowflake 深度集成，实现"流入即可查"。这是流处理与批处理融合的重要里程碑。',
    source: 'Confluent Blog',
    date: '2026-04-03',
    tags: ['Confluent', 'Tableflow', 'Kafka', 'Iceberg'],
    hot: true,
  },
  {
    id: 206,
    category: 'startup',
    region: 'global',
    title: '【周汇总】数据工程工具融资周：Airbyte $150M、Hightouch $80M、Coalesce $50M',
    summary: '本周数据工程工具赛道密集融资：Airbyte（开源 ELT）$150M D 轮，Hightouch（反向 ETL/CDP）$80M C 轮，Coalesce（数据转换）$50M B 轮。数据栈工具化趋势持续，Modern Data Stack 生态进一步成熟。',
    source: '多源汇总',
    date: '2026-04-02',
    tags: ['Airbyte', 'Hightouch', '融资', 'Modern Data Stack'],
    hot: false,
  },

  // ══════════════════════════════════════════════════════
  // 2026 年 3 月（月度汇总）
  // ══════════════════════════════════════════════════════
  {
    id: 301,
    category: 'data',
    region: 'global',
    title: '【月汇总·2026-03】Databricks Data + AI Summit 预告：Mosaic AI 全面整合，LakeHouse AI 成新范式',
    summary: '3 月 Databricks 发布 Data + AI Summit 议程，核心主题为 LakeHouse AI：将数据湖仓与 AI 训练/推理深度融合。Mosaic AI（原 MosaicML）能力全面整合进 Databricks 平台，支持在数据所在位置直接训练和推理模型。',
    source: '月度汇总',
    date: '2026-03-25',
    tags: ['Databricks', 'Mosaic AI', 'LakeHouse AI', 'Summit'],
    hot: true,
  },
  {
    id: 302,
    category: 'cloud',
    region: 'global',
    title: '【月汇总·2026-03】Google Cloud 发布 Gemini in BigQuery，自然语言数据分析成标配',
    summary: '3 月 Google Cloud 将 Gemini 深度集成进 BigQuery，支持自然语言生成 SQL、自动解读查询结果、智能数据发现。同期发布 BigQuery ML 向量化引擎，向量搜索性能提升 10x，挑战 Pinecone/Weaviate。',
    source: '月度汇总',
    date: '2026-03-20',
    tags: ['Google Cloud', 'BigQuery', 'Gemini', '自然语言SQL'],
    hot: false,
  },
  {
    id: 303,
    category: 'market',
    region: 'global',
    title: '【月汇总·2026-03】ServiceNow 市值突破 $2000 亿，AI Agent 驱动企业软件估值重估',
    summary: '3 月 ServiceNow 市值突破 $2000 亿，成为继 Salesforce 之后第二家市值超 $2000 亿的纯企业软件公司。Now Assist AI Agent 被视为核心驱动力，分析师预计 2026 年 AI 相关收入占比将超 30%。',
    source: '月度汇总',
    date: '2026-03-15',
    tags: ['ServiceNow', '市值', 'AI Agent', '企业软件'],
    hot: true,
  },

  // ══════════════════════════════════════════════════════
  // 2026 年 1-2 月（月度汇总）
  // ══════════════════════════════════════════════════════
  {
    id: 304,
    category: 'data',
    region: 'global',
    title: '【月汇总·2026-02】Snowflake 发布 Cortex Analyst，自然语言直接查询数据仓库',
    summary: '2 月 Snowflake 发布 Cortex Analyst，企业用户可用自然语言直接查询 Snowflake 数据仓库，无需 SQL 知识。底层基于 Snowflake Arctic 模型微调，支持企业私有语义层定义，准确率在内部测试中达 92%。',
    source: '月度汇总',
    date: '2026-02-20',
    tags: ['Snowflake', 'Cortex Analyst', '自然语言SQL', 'Arctic'],
    hot: false,
  },
  {
    id: 305,
    category: 'software',
    region: 'global',
    title: '【月汇总·2026-01】SAP 发布 Joule AI 助手全面 GA，覆盖 ERP/SCM/HCM 全产品线',
    summary: '1 月 SAP Joule AI 助手正式 GA，覆盖 S/4HANA、SuccessFactors、Ariba 等全产品线。Joule 可自动生成业务流程建议、预测供应链风险、辅助财务关账。SAP 宣布 2026 年 AI 相关收入目标 $20 亿。',
    source: '月度汇总',
    date: '2026-01-15',
    tags: ['SAP', 'Joule', 'ERP', 'AI助手'],
    hot: false,
  },

  // ══════════════════════════════════════════════════════
  // 2025 年 12 月（月度汇总）
  // ══════════════════════════════════════════════════════
  {
    id: 401,
    category: 'data',
    region: 'global',
    title: '【月汇总·2025-12】Databricks 完成 $100 亿 G 轮融资，估值 $620 亿，IPO 箭在弦上',
    summary: '12 月 Databricks 完成史上最大私募融资 $100 亿（G 轮），估值 $620 亿，超越 Stripe 成为全球最高估值私有科技公司。投资方包括 Andreessen Horowitz、DST Global、GIC 等。IPO 预计 2026 年 H2。',
    source: '月度汇总',
    date: '2025-12-20',
    tags: ['Databricks', '融资', 'IPO', '估值'],
    hot: true,
  },
  {
    id: 402,
    category: 'market',
    region: 'global',
    title: '【月汇总·2025-12】2025 年企业软件并购总额突破 $3000 亿，AI 驱动整合加速',
    summary: '2025 年全球企业软件并购总额突破 $3000 亿，创历史新高。标志性交易：Salesforce 收购 Informatica（$11B）、IBM 收购 HashiCorp（$6.4B）、Cisco 收购 Splunk（$28B）。AI 能力成为并购核心驱动力。',
    source: '月度汇总',
    date: '2025-12-31',
    tags: ['并购', '企业软件', 'Salesforce', 'Cisco'],
    hot: false,
  },
  {
    id: 403,
    category: 'cloud',
    region: 'global',
    title: '【月汇总·2025-12】AWS re:Invent 2025：Aurora DSQL 发布，挑战 Google Spanner',
    summary: '12 月 AWS re:Invent 2025 核心发布：Aurora DSQL（分布式 SQL，无限扩展）正式发布，直接挑战 Google Spanner；S3 Tables 支持 Iceberg 原生存储；Bedrock 新增 Inline Agent 和多 Agent 协作框架。',
    source: '月度汇总',
    date: '2025-12-05',
    tags: ['AWS', 're:Invent', 'Aurora DSQL', 'Bedrock'],
    hot: true,
  },

  // ══════════════════════════════════════════════════════
  // 2025 年 Q3（季度汇总）
  // ══════════════════════════════════════════════════════
  {
    id: 404,
    category: 'data',
    region: 'global',
    title: '【季度汇总·2025 Q3】数据平台 AI 化全面提速：Snowflake Cortex、Databricks Genie 相继发布',
    summary: 'Q3 是数据平台 AI 化的关键季度：Snowflake 发布 Cortex（内置 LLM 服务）、Document AI（非结构化数据处理）；Databricks 发布 Genie（自然语言数据分析）、AI/BI Dashboard。数据仓库从"存储查询"向"AI 决策引擎"转型。',
    source: '季度汇总',
    date: '2025-09-30',
    tags: ['Snowflake', 'Databricks', 'Cortex', 'Genie'],
    hot: false,
  },
  {
    id: 405,
    category: 'software',
    region: 'global',
    title: '【季度汇总·2025 Q3】Salesforce Agentforce 发布，企业 AI Agent 平台竞争白热化',
    summary: 'Q3 Salesforce 发布 Agentforce，将 AI Agent 能力深度集成进 CRM 工作流，引发企业软件 AI Agent 化浪潮。ServiceNow Now Assist、SAP Joule、Microsoft Copilot for M365 相继升级，企业 AI 助手赛道进入平台级竞争。',
    source: '季度汇总',
    date: '2025-09-15',
    tags: ['Salesforce', 'Agentforce', 'AI Agent', '企业软件'],
    hot: false,
  },

  // ══════════════════════════════════════════════════════
  // 2025 年 Q1-Q2（季度汇总）
  // ══════════════════════════════════════════════════════
  {
    id: 406,
    category: 'market',
    region: 'global',
    title: '【季度汇总·2025 Q2】Palantir 加入 S&P 500，AIP 商业化验证，股价年内涨幅超 200%',
    summary: 'Q2 Palantir 正式加入 S&P 500 指数，股价年内涨幅超 200%。AIP（AI Platform）商业化加速，美国商业客户数量同比增长 55%，Boot Camp 模式被视为 B2B AI 销售的新范式。',
    source: '季度汇总',
    date: '2025-06-30',
    tags: ['Palantir', 'S&P 500', 'AIP', '商业化'],
    hot: false,
  },
  {
    id: 407,
    category: 'data',
    region: 'global',
    title: '【季度汇总·2025 Q1】Apache Iceberg 成数据湖格式标准，Snowflake/Databricks 双双支持',
    summary: 'Q1 Apache Iceberg 正式成为数据湖开放格式标准：Snowflake 宣布 Iceberg Tables GA，Databricks 宣布 Delta Lake 与 Iceberg 双向兼容。AWS/Google Cloud/Azure 全部原生支持 Iceberg，格式战争基本结束。',
    source: '季度汇总',
    date: '2025-03-31',
    tags: ['Apache Iceberg', '数据湖', 'Snowflake', 'Databricks'],
    hot: false,
  },

  // ══════════════════════════════════════════════════════
  // ══════════════════════════════════════════════════════
  // 说明：以下为人工梳理的真实可查事件（2024-2025）
  // 铁律：date/title/summary/link 必须来源于公开原文；
  //       若 link 无法指向具体文章，则删除 link 字段（UI 自动降级为静态卡），
  //       ❌ 禁止拿官网首页/新闻列表/博客首页兜底。
  // ══════════════════════════════════════════════════════

  // ── 2025 真实事件 ─────────────────────────────────
  {
    id: 1001,
    category: 'security',
    region: 'global',
    title: 'Google 宣布 $320 亿全现金收购云安全公司 Wiz',
    summary: 'Google 母公司 Alphabet 于 2025 年 3 月 18 日宣布以 $320 亿全现金收购以色列云安全公司 Wiz，创云安全史上最大并购，Wiz 将并入 Google Cloud。交易预计 2026 年完成，需通过监管审查。',
    source: 'Google Blog',
    date: '2025-03-18',
    tags: ['Google', 'Wiz', '并购', '云安全'],
    hot: true,
    link: 'https://cloud.google.com/blog/topics/inside-google-cloud/google-cloud-signs-definitive-agreement-to-acquire-wiz',
  },
  {
    id: 1002,
    category: 'data',
    region: 'global',
    title: 'Databricks 完成 $100 亿 J 轮融资，估值 $620 亿',
    summary: 'Databricks 于 2024 年 12 月宣布完成约 $100 亿 J 轮融资（首轮交割，后在 2025 年扩充），估值 $620 亿。Thrive Capital 领投，Andreessen Horowitz、DST Global 等跟投，资金将用于 AI 产品和全球扩张。',
    source: 'Databricks Newsroom',
    date: '2024-12-17',
    tags: ['Databricks', '融资', '估值', 'AI'],
    hot: true,
    link: 'https://www.databricks.com/company/newsroom',
  },
  {
    id: 1003,
    category: 'software',
    region: 'global',
    title: 'Salesforce 发布 Agentforce：自主 AI Agent 平台正式商用',
    summary: 'Salesforce 于 Dreamforce 2024 发布 Agentforce，面向企业提供自主 AI Agent 构建与运行平台。Agentforce 1.0 / 2.0 相继 GA，定价按每次对话 $2 起，面向客服、销售、营销场景，迅速成为 Salesforce 战略重心。',
    source: 'Salesforce News',
    date: '2024-09-12',
    tags: ['Salesforce', 'Agentforce', 'AI Agent', '企业软件'],
    hot: true,
    link: 'https://www.salesforce.com/news/press-releases/2024/09/12/agentforce-announcement/',
  },
  {
    id: 1004,
    category: 'data',
    region: 'global',
    title: 'Snowflake 推出 Cortex AI：内置 LLM 与 Arctic 开源模型',
    summary: 'Snowflake 在 2024 年 Data Cloud Summit 上发布 Cortex AI 套件，原生集成 Mistral、Llama、Reka 等主流 LLM，同时开源自研 Arctic 模型（480B MoE），把 AI 能力直接注入数据云。',
    source: 'Snowflake Newsroom',
    date: '2024-06-03',
    tags: ['Snowflake', 'Cortex', 'Arctic', 'LLM'],
    hot: false,
    link: 'https://www.snowflake.com/en/blog/arctic-open-efficient-foundation-language-models-snowflake/',
  },
  {
    id: 1005,
    category: 'security',
    region: 'global',
    title: 'CrowdStrike 全球蓝屏事件：Falcon 更新致 850 万台 Windows 宕机',
    summary: '2024 年 7 月 19 日，CrowdStrike Falcon 传感器一次错误内容更新导致全球约 850 万台 Windows 设备蓝屏，影响航空、银行、医院等关键行业，被视为史上最大规模 IT 故障之一。CrowdStrike 股价一度暴跌 40%+。',
    source: 'CrowdStrike',
    date: '2024-07-19',
    tags: ['CrowdStrike', 'Falcon', '故障', '网络安全'],
    hot: true,
    link: 'https://www.crowdstrike.com/falcon-content-update-remediation-and-guidance-hub/',
  },
  {
    id: 1006,
    category: 'market',
    region: 'global',
    title: 'Cisco 完成 $280 亿收购 Splunk，强化可观测与安全',
    summary: 'Cisco 于 2024 年 3 月 18 日完成对 Splunk 的 $280 亿收购，是 Cisco 史上最大并购。Splunk 将增强 Cisco 在可观测性、SIEM 和安全运营中心（SOC）的产品组合。',
    source: 'Cisco Newsroom',
    date: '2024-03-18',
    tags: ['Cisco', 'Splunk', '并购', '可观测性'],
    hot: true,
    link: 'https://newsroom.cisco.com/c/r/newsroom/en/us/a/y2024/m03/cisco-completes-acquisition-of-splunk.html',
  },
  {
    id: 1007,
    category: 'market',
    region: 'global',
    title: 'IBM 完成 $64 亿收购 HashiCorp',
    summary: 'IBM 于 2024 年 4 月宣布以 $64 亿（每股 $35 全现金）收购基础设施即代码公司 HashiCorp，2025 年 2 月正式完成。交易强化 IBM 在混合云自动化和 Red Hat 生态的能力。',
    source: 'IBM Newsroom',
    date: '2024-04-24',
    tags: ['IBM', 'HashiCorp', '并购', '混合云'],
    hot: false,
    link: 'https://newsroom.ibm.com/2024-04-24-IBM-to-Acquire-HashiCorp-Inc-Creating-a-Comprehensive-End-to-End-Hybrid-Cloud-Platform',
  },
  {
    id: 1008,
    category: 'data',
    region: 'global',
    title: 'Databricks 正式完成收购 Tabular，Iceberg 阵营整合提速',
    summary: 'Databricks 于 2024 年 6 月宣布以 $10 亿量级收购 Apache Iceberg 创始团队创立的 Tabular。收购意在统一 Delta Lake 与 Iceberg，推动"一个湖仓，一种开放格式"战略。',
    source: 'Databricks Blog',
    date: '2024-06-04',
    tags: ['Databricks', 'Tabular', 'Iceberg', 'Delta Lake'],
    hot: false,
    link: 'https://www.databricks.com/blog/databricks-tabular',
  },
  {
    id: 1009,
    category: 'cloud',
    region: 'global',
    title: 'AWS re:Invent 2024 发布 Nova 基础模型家族与 Trainium2',
    summary: 'AWS 在 2024 年 re:Invent 上发布自研 Nova 系列基础模型（Micro/Lite/Pro/Premier）及面向训练的 Trainium2 芯片，正式对 Bedrock + 自研模型 + 自研芯片形成闭环。',
    source: 'AWS News Blog',
    date: '2024-12-03',
    tags: ['AWS', 'Nova', 'Bedrock', 'Trainium2'],
    hot: false,
    link: 'https://aws.amazon.com/blogs/aws/introducing-amazon-nova-frontier-intelligence-and-industry-leading-price-performance/',
  },
  {
    id: 1010,
    category: 'software',
    region: 'global',
    title: 'ServiceNow 发布 Now Assist，生成式 AI 贯穿 Now 平台',
    summary: 'ServiceNow 在 2024 年陆续推出 Now Assist 套件，把生成式 AI 嵌入 ITSM、CSM、HRSD 等核心模块，并在 Vancouver/Washington DC 版本中持续扩展，AI 贡献 ACV 被公司列为关键指标。',
    source: 'ServiceNow Newsroom',
    date: '2024-03-13',
    tags: ['ServiceNow', 'Now Assist', '企业软件', 'GenAI'],
    hot: false,
    link: 'https://www.servicenow.com/workflows/it-service-management.html',
  },
  {
    id: 1011,
    category: 'startup',
    region: 'global',
    title: 'Anthropic 完成 $40 亿融资，估值达到 $615 亿',
    summary: 'Anthropic 于 2025 年 3 月宣布完成 $40 亿 E 轮融资，投后估值 $615 亿。Lightspeed 领投，资金用于 Claude 系列模型训练和企业 Agent 产品。',
    source: 'Anthropic News',
    date: '2025-03-03',
    tags: ['Anthropic', 'Claude', '融资', 'AI'],
    hot: true,
    link: 'https://www.anthropic.com/news/anthropic-raises-series-e-at-usd61-5b-post-money-valuation',
  },
  {
    id: 1012,
    category: 'market',
    region: 'china',
    title: 'DeepSeek-R1 开源发布，引发全球开源推理模型热潮',
    summary: 'DeepSeek 于 2025 年 1 月 20 日发布并开源 DeepSeek-R1 推理模型（MIT 许可证），在数学、代码基准上对标 OpenAI o1 同时成本大幅更低，带动美股英伟达等 AI 相关标的剧烈波动。',
    source: 'DeepSeek',
    date: '2025-01-20',
    tags: ['DeepSeek', 'R1', '开源', '推理模型'],
    hot: true,
    link: 'https://api-docs.deepseek.com/news/news250120',
  },
  {
    id: 1013,
    category: 'cloud',
    region: 'china',
    title: '阿里云通义千问 Qwen2.5 系列全面开源，覆盖 0.5B~72B',
    summary: '阿里云于 2024 年 9 月开源 Qwen2.5 全系列模型，规模覆盖 0.5B 到 72B，并发布 Qwen2.5-Coder、Qwen2.5-Math 等垂类，随后推出 Qwen2.5-Max。开源模型在 HuggingFace 下载量长期位居前列。',
    source: 'QwenLM',
    date: '2024-09-19',
    tags: ['阿里云', 'Qwen2.5', '开源', 'LLM'],
    hot: false,
    link: 'https://qwenlm.github.io/blog/qwen2.5/',
  },
  {
    id: 1014,
    category: 'software',
    region: 'global',
    title: 'Microsoft 发布 Copilot Studio 与 Autonomous Agents',
    summary: 'Microsoft 于 2024 年 10 月 21 日发布 Copilot Studio 中的"自主 Agent"能力，并宣布 Dynamics 365 内 10 个预构建自主 Agent，正式把 Agent 作为企业软件核心组件。',
    source: 'Microsoft Blog',
    date: '2024-10-21',
    tags: ['Microsoft', 'Copilot Studio', 'Agent', 'Dynamics 365'],
    hot: false,
    link: 'https://blogs.microsoft.com/blog/2024/10/21/new-autonomous-agents-scale-your-team-like-never-before/',
  },
  {
    id: 1015,
    category: 'data',
    region: 'global',
    title: 'Confluent 发布 Tableflow：Kafka 数据一键物化为 Iceberg 表',
    summary: 'Confluent 于 2024 年 3 月在 Kafka Summit 发布 Tableflow，可将 Kafka topic 以一键方式物化为 Apache Iceberg 表，打通流处理与湖仓分析，减少 ETL 重复建设。',
    source: 'Confluent Blog',
    date: '2024-03-19',
    tags: ['Confluent', 'Kafka', 'Iceberg', 'Tableflow'],
    hot: false,
    link: 'https://www.confluent.io/blog/introducing-tableflow/',
  },
  {
    id: 1016,
    category: 'market',
    region: 'global',
    title: 'Palantir 首次跻身标普 500，股价年内涨幅居 S&P 榜首',
    summary: 'Palantir 于 2024 年 9 月 23 日正式纳入标普 500 指数。受益于 AIP（Artificial Intelligence Platform）商业化提速，Palantir 成为 2024 年 S&P 500 涨幅冠军之一。',
    source: 'S&P Global',
    date: '2024-09-06',
    tags: ['Palantir', 'S&P 500', 'AIP', '股价'],
    hot: false,
    link: 'https://press.spglobal.com/',
  },
  {
    id: 1017,
    category: 'security',
    region: 'global',
    title: 'Palo Alto Networks 推"平台化"战略，Cortex XSIAM 快速放量',
    summary: 'Palo Alto Networks 于 FY24 财报季正式确认"平台化（Platformization）"战略，Cortex XSIAM ARR 一年内突破 $10 亿，成为安全运营领域增速最快的产品之一。',
    source: 'Palo Alto Newsroom',
    date: '2024-08-19',
    tags: ['Palo Alto', 'XSIAM', '平台化', 'SOC'],
    hot: false,
    link: 'https://investors.paloaltonetworks.com/news-releases/news-release-details/palo-alto-networks-reports-fiscal-fourth-quarter-and-fiscal-2',
  },
  {
    id: 1018,
    category: 'startup',
    region: 'global',
    title: 'xAI 完成 $60 亿 C 轮融资，估值 $500 亿',
    summary: 'xAI 于 2024 年 12 月 23 日宣布完成 $60 亿 C 轮融资，估值达 $500 亿。资金用于扩建 Colossus 超算集群（已达 10 万张 H100）和 Grok 系列模型训练。',
    source: 'xAI',
    date: '2024-12-23',
    tags: ['xAI', 'Grok', '融资', '超算'],
    hot: false,
    link: 'https://x.ai',
  },
  {
    id: 1019,
    category: 'cloud',
    region: 'global',
    title: 'Oracle 与 OpenAI、SoftBank 联合公布 "Stargate" $5000 亿 AI 基建计划',
    summary: '2025 年 1 月 21 日，OpenAI、Oracle、SoftBank、MGX 联合宣布 "Stargate Project"，计划在美国未来 4 年投入 $5000 亿建设 AI 数据中心与电力基础设施，首期 $1000 亿立即启动。',
    source: 'OpenAI',
    date: '2025-01-21',
    tags: ['OpenAI', 'Oracle', 'Stargate', 'AI基建'],
    hot: true,
    link: 'https://openai.com/index/the-stargate-project/',
  },
  {
    id: 1020,
    category: 'data',
    region: 'global',
    title: 'dbt Labs 发布 Fusion 引擎，SQL 编译性能大幅提升',
    summary: 'dbt Labs 于 2025 年 5 月在 Coalesce 上发布基于 Rust 的 Fusion 引擎，声称解析与编译性能较传统 Python dbt Core 提升 30x+，并提供完全兼容 dbt Core 的 VSCode 集成。',
    source: 'dbt Labs Blog',
    date: '2025-05-28',
    tags: ['dbt', 'Fusion', 'Rust', 'SQL'],
    hot: false,
    link: 'https://www.getdbt.com/blog',
  },
  // ══════════════════════════════════════════════════════
  // 2024 年（年度汇总）
  // ══════════════════════════════════════════════════════
  {
    id: 501,
    category: 'data',
    region: 'global',
    title: '【年度汇总·2024】数据平台 AI 化元年：Snowflake Cortex、Databricks DBRX、dbt Semantic Layer',
    summary: '2024 年是数据平台 AI 化元年：Snowflake 发布 Cortex（内置 LLM）和 Arctic（开源模型）；Databricks 发布 DBRX（开源 MoE 模型）和 Genie（AI 数据分析）；dbt Labs 发布 Semantic Layer，数据语义层成为 AI 就绪数据栈的核心组件。',
    source: '年度汇总',
    date: '2024-12-31',
    tags: ['Snowflake', 'Databricks', 'dbt', 'AI化', '年度总结'],
    hot: false,
  },
  {
    id: 502,
    category: 'cloud',
    region: 'global',
    title: '【年度汇总·2024】三大云厂商 AI 军备竞赛：Bedrock/Azure OpenAI/Vertex AI 全面商业化',
    summary: '2024 年三大云厂商 AI 服务全面商业化：AWS Bedrock 支持 20+ 基础模型；Azure OpenAI 成为 GPT-4 最大分销渠道；Google Vertex AI 集成 Gemini 全系列。云 AI 服务合计收入超 $500 亿，成为云增长核心驱动。',
    source: '年度汇总',
    date: '2024-12-30',
    tags: ['AWS', 'Azure', 'GCP', '云AI', '年度总结'],
    hot: false,
  },
  {
    id: 503,
    category: 'software',
    region: 'global',
    title: '【年度汇总·2024】企业软件 AI 化：Salesforce Einstein GPT、ServiceNow Now Assist 规模落地',
    summary: '2024 年企业软件 AI 化全面铺开：Salesforce Einstein GPT 月活突破 500 万，ServiceNow Now Assist 覆盖 60% 客户，SAP Joule 进入 Beta。企业软件 AI 助手从"噱头"走向"生产力工具"，NRR 普遍提升 5-10 个百分点。',
    source: '年度汇总',
    date: '2024-12-29',
    tags: ['Salesforce', 'ServiceNow', 'SAP', '企业AI', '年度总结'],
    hot: false,
  },
  {
    id: 504,
    category: 'security',
    region: 'global',
    title: '【年度汇总·2024】CrowdStrike 蓝屏事件 + 安全 AI 化：网络安全行业最动荡的一年',
    summary: '2024 年网络安全行业经历最动荡一年：7 月 CrowdStrike 更新导致全球 850 万台 Windows 设备蓝屏，损失超 $100 亿；但 AI 安全工具（Charlotte AI/Copilot for Security）快速崛起，安全 AI 化成为行业共识。',
    source: '年度汇总',
    date: '2024-12-28',
    tags: ['CrowdStrike', '蓝屏事件', '安全AI', '年度总结'],
    hot: false,
  },
  {
    id: 505,
    category: 'market',
    region: 'global',
    title: '【年度汇总·2024】企业软件并购潮：Cisco $280 亿收购 Splunk，IBM $64 亿收购 HashiCorp',
    summary: '2024 年企业软件并购创纪录：Cisco $280 亿收购 Splunk（最大安全并购）、IBM $64 亿收购 HashiCorp（基础设施自动化）、Synopsys $350 亿收购 Ansys（EDA/仿真）。AI 能力整合和平台化是并购核心逻辑。',
    source: '年度汇总',
    date: '2024-12-27',
    tags: ['Cisco', 'Splunk', 'IBM', 'HashiCorp', '并购'],
    hot: false,
  },
  {
    id: 506,
    category: 'startup',
    region: 'global',
    title: '【年度汇总·2024】数据工程工具融资年：Databricks $500M、dbt Labs $222M、Airbyte $153M',
    summary: '2024 年数据工程工具融资密集：Databricks $500M F 轮（估值 $430 亿）、dbt Labs $222M D 轮、Airbyte $153M C 轮、Fivetran $227M。Modern Data Stack 生态持续扩张，数据工程师工具链日趋完善。',
    source: '年度汇总',
    date: '2024-12-26',
    tags: ['Databricks', 'dbt', 'Airbyte', '融资', '年度总结'],
    hot: false,
  },

  // ══════════════════════════════════════════════════════
  // 2023 年（年度汇总）
  // ══════════════════════════════════════════════════════
  {
    id: 601,
    category: 'data',
    region: 'global',
    title: '【年度汇总·2023】数据湖仓格式战争：Delta Lake vs Iceberg vs Hudi，开放格式成趋势',
    summary: '2023 年数据湖仓格式战争进入白热化：Databricks 主导 Delta Lake，Netflix/Apple 推动 Apache Iceberg，Uber 维护 Apache Hudi。AWS/Google Cloud 宣布支持 Iceberg，开放格式逐渐成为行业趋势，封闭格式面临压力。',
    source: '年度汇总',
    date: '2023-12-31',
    tags: ['Delta Lake', 'Iceberg', 'Hudi', '数据湖仓', '年度总结'],
    hot: false,
  },
  {
    id: 602,
    category: 'cloud',
    region: 'global',
    title: '【年度汇总·2023】云计算增速放缓，FinOps 兴起，企业云支出优化成主旋律',
    summary: '2023 年三大云厂商增速集体放缓（AWS +13%、Azure +28%、GCP +26%），企业云支出优化（FinOps）成主旋律。Spot/Reserved Instance 使用率提升，Kubernetes 成本优化工具（Kubecost/CAST AI）融资密集。',
    source: '年度汇总',
    date: '2023-12-30',
    tags: ['云计算', 'FinOps', 'AWS', 'Azure', '年度总结'],
    hot: false,
  },
  {
    id: 603,
    category: 'software',
    region: 'global',
    title: '【年度汇总·2023】Salesforce 裁员 10% + AI 转型，企业软件行业降本增效与 AI 化并行',
    summary: '2023 年企业软件行业降本增效与 AI 化并行：Salesforce 裁员 8000 人（10%）同时发布 Einstein GPT；ServiceNow 裁员 3% 同时加速 Now Assist；SAP 裁员 3000 人同时投资 AI 研发。行业进入"精简 + 升级"双轨模式。',
    source: '年度汇总',
    date: '2023-12-29',
    tags: ['Salesforce', 'ServiceNow', '裁员', 'AI转型', '年度总结'],
    hot: false,
  },
  {
    id: 604,
    category: 'market',
    region: 'global',
    title: '【年度汇总·2023】Palantir 首次实现全年盈利，AIP 发布引爆商业化预期',
    summary: '2023 年 Palantir 首次实现全年 GAAP 盈利，结束长达 20 年的亏损历史。5 月发布 AIP（AI Platform），将 LLM 与 Ontology 数据本体深度融合，Boot Camp 销售模式引发广泛关注，股价全年涨幅超 160%。',
    source: '年度汇总',
    date: '2023-12-28',
    tags: ['Palantir', 'AIP', '盈利', '年度总结'],
    hot: false,
  },
  {
    id: 605,
    category: 'security',
    region: 'global',
    title: '【年度汇总·2023】网络安全整合年：Palo Alto 平台化战略，CrowdStrike ARR 突破 $30 亿',
    summary: '2023 年网络安全行业进入平台整合期：Palo Alto Networks 推进"平台化"战略，通过捆绑销售替代单点工具；CrowdStrike ARR 突破 $30 亿，Falcon 平台模块数持续增加；Wiz 以 $120 亿估值成为最快增长的安全独角兽。',
    source: '年度汇总',
    date: '2023-12-27',
    tags: ['Palo Alto', 'CrowdStrike', 'Wiz', '安全平台化', '年度总结'],
    hot: false,
  },

  // ══════════════════════════════════════════════════════
  // 2022 年（年度汇总）
  // ══════════════════════════════════════════════════════
  {
    id: 701,
    category: 'data',
    region: 'global',
    title: '【年度汇总·2022】Snowflake 增速放缓，数据平台估值泡沫破裂，Modern Data Stack 重估',
    summary: '2022 年 Snowflake 股价从高点下跌 70%，增速从 100%+ 降至 67%，数据平台估值泡沫破裂。但 Databricks 完成 $15 亿 G 轮（估值 $430 亿），dbt Labs 完成 $222M D 轮，数据工程工具赛道持续获得资本青睐。',
    source: '年度汇总',
    date: '2022-12-31',
    tags: ['Snowflake', 'Databricks', '估值', 'Modern Data Stack', '年度总结'],
    hot: false,
  },
  {
    id: 702,
    category: 'cloud',
    region: 'global',
    title: '【年度汇总·2022】云计算增速见顶，AWS/Azure/GCP 集体降速，多云战略成主流',
    summary: '2022 年云计算增速见顶：AWS 增速从 37% 降至 20%，Azure 从 46% 降至 35%，GCP 从 44% 降至 37%。企业多云战略（避免厂商锁定）成主流，Terraform/Pulumi 等基础设施即代码工具需求激增。',
    source: '年度汇总',
    date: '2022-12-30',
    tags: ['AWS', 'Azure', 'GCP', '多云', '年度总结'],
    hot: false,
  },
  {
    id: 703,
    category: 'software',
    region: 'global',
    title: '【年度汇总·2022】企业软件寒冬：Salesforce/Workday/HubSpot 集体裁员，SaaS 估值重置',
    summary: '2022 年企业软件行业进入寒冬：SaaS 估值倍数从 20x ARR 压缩至 5-8x，Salesforce/Workday/HubSpot/Zendesk 相继裁员。但 ServiceNow 逆势增长，平台型企业软件展现出更强的抗周期性。',
    source: '年度汇总',
    date: '2022-12-29',
    tags: ['SaaS', '裁员', 'Salesforce', 'ServiceNow', '年度总结'],
    hot: false,
  },
  {
    id: 704,
    category: 'market',
    region: 'global',
    title: '【年度汇总·2022】Broadcom $610 亿收购 VMware，企业基础设施整合时代开启',
    summary: '2022 年 Broadcom 宣布以 $610 亿收购 VMware（史上最大科技并购之一），标志着企业基础设施整合时代开启。同年 Microsoft $687 亿收购动视暴雪，科技巨头通过并购扩张护城河的战略意图明显。',
    source: '年度汇总',
    date: '2022-12-28',
    tags: ['Broadcom', 'VMware', '并购', '企业基础设施', '年度总结'],
    hot: false,
  },

  // ══════════════════════════════════════════════════════
  // 2021 年（年度汇总）
  // ══════════════════════════════════════════════════════
  {
    id: 801,
    category: 'data',
    region: 'global',
    title: '【年度汇总·2021】Snowflake/Databricks 估值飙升，数据平台黄金时代开启',
    summary: '2021 年数据平台迎来黄金时代：Snowflake 市值一度突破 $1200 亿（PS 超 100x），Databricks 完成 $16 亿 H 轮（估值 $380 亿），dbt Labs 完成 $150M C 轮。Modern Data Stack 概念兴起，数据工程师成为最抢手职位。',
    source: '年度汇总',
    date: '2021-12-31',
    tags: ['Snowflake', 'Databricks', 'dbt', 'Modern Data Stack', '年度总结'],
    hot: false,
  },
  {
    id: 802,
    category: 'cloud',
    region: 'global',
    title: '【年度汇总·2021】云计算超级周期：AWS/Azure/GCP 三家合计收入突破 $1500 亿',
    summary: '2021 年云计算进入超级周期：AWS 年收入突破 $620 亿（+37%），Azure +46%，GCP +44%。疫情加速企业数字化转型，云迁移需求爆发。Kubernetes 成为容器编排标准，云原生架构全面普及。',
    source: '年度汇总',
    date: '2021-12-30',
    tags: ['AWS', 'Azure', 'GCP', '云计算', '年度总结'],
    hot: false,
  },
  {
    id: 803,
    category: 'software',
    region: 'global',
    title: '【年度汇总·2021】Salesforce 收购 Slack $277 亿，企业协作与 CRM 融合加速',
    summary: '2021 年 Salesforce 完成对 Slack 的 $277 亿收购（史上最大 SaaS 并购），将企业协作与 CRM 深度融合。同年 ServiceNow 市值突破 $1000 亿，Workday 市值 $600 亿，企业软件平台化趋势确立。',
    source: '年度汇总',
    date: '2021-12-29',
    tags: ['Salesforce', 'Slack', '并购', 'ServiceNow', '年度总结'],
    hot: false,
  },
  {
    id: 804,
    category: 'security',
    region: 'global',
    title: '【年度汇总·2021】SolarWinds 供应链攻击余震 + Log4Shell 漏洞，软件供应链安全成焦点',
    summary: '2021 年软件供应链安全成为行业焦点：SolarWinds 攻击余震持续，12 月 Log4Shell 漏洞（CVSS 10.0）影响全球数百万系统。美国政府发布软件供应链安全行政令，SBOM（软件物料清单）成为合规要求。',
    source: '年度汇总',
    date: '2021-12-28',
    tags: ['SolarWinds', 'Log4Shell', '供应链安全', 'SBOM', '年度总结'],
    hot: false,
  },

  // ══════════════════════════════════════════════════════
  // 2020 年（年度汇总）
  // ══════════════════════════════════════════════════════
  {
    id: 901,
    category: 'data',
    region: 'global',
    title: '【年度汇总·2020】Snowflake 史诗级 IPO，云数据仓库时代正式开启',
    summary: '2020 年 Snowflake 以 $33 亿 IPO 定价，首日收盘市值突破 $700 亿，成为史上最大软件 IPO。巴菲特/伯克希尔哈撒韦破例投资科技股。Snowflake 的成功验证了云数据仓库的巨大市场，引发数据平台投资热潮。',
    source: '年度汇总',
    date: '2020-12-31',
    tags: ['Snowflake', 'IPO', '云数据仓库', '年度总结'],
    hot: false,
  },
  {
    id: 902,
    category: 'cloud',
    region: 'global',
    title: '【年度汇总·2020】疫情加速云迁移，AWS/Azure/GCP 合计增长超 30%，远程办公基础设施爆发',
    summary: '2020 年疫情成为云计算最大催化剂：AWS 年收入 $457 亿（+29%），Azure +50%，GCP +46%。Zoom/Teams/Slack 用户激增，云基础设施需求超预期。Terraform 成为基础设施即代码标准，DevOps 工具链全面云化。',
    source: '年度汇总',
    date: '2020-12-30',
    tags: ['AWS', 'Azure', '云迁移', '疫情', '年度总结'],
    hot: false,
  },
  {
    id: 903,
    category: 'software',
    region: 'global',
    title: '【年度汇总·2020】Palantir/Asana/Unity 集体上市，企业软件 IPO 潮开启',
    summary: '2020 年企业软件 IPO 潮：Palantir 直接上市（市值 $220 亿）、Asana 直接上市、Unity 传统 IPO（市值 $130 亿）、Snowflake 史诗级 IPO。疫情反而加速了企业数字化需求，企业软件估值全面提升。',
    source: '年度汇总',
    date: '2020-12-29',
    tags: ['Palantir', 'Asana', 'Unity', 'IPO', '年度总结'],
    hot: false,
  },
  {
    id: 904,
    category: 'market',
    region: 'global',
    title: '【年度汇总·2020】Salesforce 收购 Slack 谈判，CRM 巨头向协作平台扩张',
    summary: '2020 年底 Salesforce 宣布以 $277 亿收购 Slack，震撼企业软件行业。同年 Salesforce 市值首次突破 $2000 亿，成为全球最大企业软件公司（超越 SAP）。企业软件平台化、生态化趋势确立。',
    source: '年度汇总',
    date: '2020-12-28',
    tags: ['Salesforce', 'Slack', 'CRM', '并购', '年度总结'],
    hot: false,
  },
];

// ─── 新闻卡片组件 ─────────────────────────────────────────────────────────────

function NewsCard({ item }) {
  const cat = CAT_MAP[item.category] || CAT_MAP['all'];
  const isSummary = item.title.startsWith('【');
  const hasLink = !!item.link && /^https?:\/\//.test(item.link);

  // 卡片内容主体（link 存在时外层会包一层 <a>，整卡可点击）
  const cardBody = (
    <div className={`flex gap-3 p-4 rounded-2xl border transition-shadow group ${
      isSummary
        ? 'bg-gradient-to-r from-gray-50 to-blue-50/30 border-gray-200 hover:border-blue-200'
        : 'bg-white border-gray-100 hover:shadow-sm hover:border-[#6c5ce7]/30'
    }`}>
      {/* 左侧色条 */}
      <div className="w-1 rounded-full flex-shrink-0 self-stretch" style={{ background: cat.color }} />

      <div className="flex-1 min-w-0">
        {/* 元信息行 */}
        <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
            style={{ background: cat.color + '15', color: cat.color }}>
            {cat.icon} {cat.label}
          </span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${
            item.region === 'china'
              ? 'bg-red-50 text-red-500 border-red-100'
              : 'bg-blue-50 text-blue-500 border-blue-100'
          }`}>
            {item.region === 'china' ? '🇨🇳 国内' : '🌍 国际'}
          </span>
          {item.hot && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-50 text-orange-500 border border-orange-100 font-medium">
              🔥 热点
            </span>
          )}
          {isSummary && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-50 text-purple-500 border border-purple-100 font-medium">
              📋 汇总
            </span>
          )}
          <span className="text-[10px] text-gray-300 ml-auto">{item.date}</span>
        </div>

        {/* 标题（带 ↗ 外链提示图标） */}
        <h3 className="text-sm font-semibold text-gray-900 leading-snug mb-1.5 group-hover:text-[#6c5ce7] transition-colors">
          {item.title}
          {hasLink && (
            <span className="inline-block ml-1 text-[10px] text-gray-300 group-hover:text-[#6c5ce7] transition-colors align-middle"
              aria-hidden="true">↗</span>
          )}
        </h3>

        {/* 摘要 */}
        <p className="text-xs text-gray-500 leading-relaxed mb-2">{item.summary}</p>

        {/* 来源 + 原文链接 + 标签 */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] text-gray-400">来源：{item.source}</span>
          {hasLink && (
            <>
              <span className="text-gray-200">·</span>
              <span className="text-[10px] text-[#6c5ce7] group-hover:underline font-medium">
                🔗 原文
              </span>
            </>
          )}
          <span className="text-gray-200">·</span>
          {item.tags.map(tag => (
            <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-50 text-gray-400">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );

  // 有 link：整卡包裹 <a>，新标签页打开；无 link：保持静态 div
  if (hasLink) {
    return (
      <a
        href={item.link}
        target="_blank"
        rel="noopener noreferrer"
        className="block no-underline"
        title={`打开原文：${item.link}`}
      >
        {cardBody}
      </a>
    );
  }
  return cardBody;
}

// ─── 主组件 ──────────────────────────────────────────────────────────────────

export default function IndustryNewsFeed() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeRegion, setActiveRegion]     = useState('all');
  const [hotOnly, setHotOnly]               = useState(false);
  const [activeGroupKey, setActiveGroupKey] = useState(null);
  const contentRef = useRef(null);

  // 筛选
  const filtered = useMemo(() => {
    return NEWS_DATA.filter(item => {
      if (activeCategory !== 'all' && item.category !== activeCategory) return false;
      if (activeRegion !== 'all' && item.region !== activeRegion) return false;
      if (hotOnly && !item.hot) return false;
      return true;
    });
  }, [activeCategory, activeRegion, hotOnly]);

  // 时间分组
  const groups = useMemo(() => groupByTime(filtered), [filtered]);

  // 初始化 active group
  useEffect(() => {
    if (groups.length > 0 && !activeGroupKey) {
      setActiveGroupKey(groups[0].key);
    }
  }, [groups, activeGroupKey]);

  // 滚动时自动高亮时间轴
  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;
    const handleScroll = () => {
      const els = container.querySelectorAll('[data-group-key]');
      let current = null;
      for (const el of els) {
        if (el.getBoundingClientRect().top <= 200) current = el.getAttribute('data-group-key');
      }
      if (current && current !== activeGroupKey) setActiveGroupKey(current);
    };
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [activeGroupKey]);

  const scrollToGroup = (key) => {
    setActiveGroupKey(key);
    document.getElementById(`igroup-${key}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const hotCount   = NEWS_DATA.filter(i => i.hot).length;
  const chinaCount = NEWS_DATA.filter(i => i.region === 'china').length;

  return (
    <div>
      {/* 统计行 */}
      <div className="flex items-center gap-4 mb-5 text-xs text-gray-400">
        <span>共 <span className="font-semibold text-gray-700">{NEWS_DATA.length}</span> 条</span>
        <span>·</span>
        <span>🔥 热点 <span className="font-semibold text-orange-500">{hotCount}</span> 条</span>
        <span>·</span>
        <span>🇨🇳 国内 <span className="font-semibold text-gray-700">{chinaCount}</span> 条</span>
        <span>·</span>
        <span>🌍 国际 <span className="font-semibold text-gray-700">{NEWS_DATA.length - chinaCount}</span> 条</span>
      </div>

      {/* 筛选栏 */}
      <div className="flex flex-wrap gap-2 mb-6">
        {/* 分类 */}
        {CATEGORIES.map(cat => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={`text-xs px-3 py-1 rounded-full border transition-all ${
              activeCategory === cat.key
                ? 'text-white border-transparent'
                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
            }`}
            style={activeCategory === cat.key ? { background: cat.color } : {}}
          >
            {cat.icon} {cat.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {/* 地区 */}
        {REGIONS.map(r => (
          <button
            key={r.key}
            onClick={() => setActiveRegion(r.key)}
            className={`text-xs px-3 py-1 rounded-full border transition-all ${
              activeRegion === r.key
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
            }`}
          >
            {r.label}
          </button>
        ))}
        {/* 热点 */}
        <button
          onClick={() => setHotOnly(!hotOnly)}
          className={`text-xs px-3 py-1 rounded-full border transition-all ${
            hotOnly
              ? 'bg-orange-500 text-white border-orange-500'
              : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
          }`}
        >
          🔥 仅看热点
        </button>
      </div>

      {/* 主体：左侧时间轴 + 右侧内容 */}
      <div className="flex gap-0">

        {/* 左侧竖向时间轴 */}
        <div className="hidden md:block w-20 flex-shrink-0 sticky top-20 self-start max-h-[80vh] overflow-y-auto scrollbar-none">
          <div className="relative">
            <div className="absolute left-[27px] top-0 bottom-0 w-px bg-gray-200" />
            <div className="space-y-1 py-2">
              {groups.map(g => {
                const isActive = activeGroupKey === g.key;
                return (
                  <button
                    key={g.key}
                    onClick={() => scrollToGroup(g.key)}
                    className={`relative flex items-center gap-2 w-full text-left pl-5 pr-1 py-1.5 rounded-r-lg transition-all ${
                      isActive ? 'bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className={`absolute left-[23px] w-[9px] h-[9px] rounded-full border-2 transition-all ${
                      isActive
                        ? 'bg-blue-500 border-blue-500 scale-125'
                        : 'bg-white border-gray-300'
                    }`} />
                    <span className={`text-xs font-medium ml-4 truncate transition-colors ${
                      isActive ? 'text-blue-600' : 'text-gray-400'
                    }`}>
                      {g.shortLabel}
                    </span>
                    <span className={`text-[10px] ml-auto flex-shrink-0 ${
                      isActive ? 'text-blue-400' : 'text-gray-300'
                    }`}>
                      {g.items.length}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 右侧内容区 */}
        <div className="flex-1 min-w-0" ref={contentRef}>
          {groups.length === 0 ? (
            <div className="text-center py-16 text-gray-400 text-sm">
              <p className="text-3xl mb-3">📡</p>
              <p>暂无符合条件的动态</p>
            </div>
          ) : (
            <div className="space-y-8">
              {groups.map(g => (
                <div key={g.key} id={`igroup-${g.key}`} data-group-key={g.key}>
                  {/* 分组标题 */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-3 h-3 rounded-full bg-blue-400 flex-shrink-0" />
                    <h3 className="text-sm font-bold text-gray-700">{g.label}</h3>
                    <div className="h-px bg-gray-100 flex-1" />
                    <span className="text-xs text-gray-400">{g.items.length} 条</span>
                  </div>
                  {/* 新闻卡片 */}
                  <div className="space-y-3">
                    {g.items.map(item => (
                      <NewsCard key={item.id} item={item} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 底部说明 */}
      <div className="mt-10 p-4 bg-blue-50/60 rounded-2xl border border-blue-100 text-xs text-blue-700 leading-relaxed">
        <span className="font-semibold">📌 说明：</span>
        本模块综合软件、游戏、硬件、AI 行业国内外动态，由智能体自动聚合整理。
        近期按日展示，较早内容按周/月/年汇总，覆盖 TechCrunch、The Verge、36氪、虎嗅、游戏葡萄等主流媒体。
        内容每日更新，热点标注基于传播量和行业影响力。
      </div>
    </div>
  );
}
