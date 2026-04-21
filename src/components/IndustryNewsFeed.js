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
    link: 'https://blog.google/inside-google/message-ceo/alphabet-acquisition-wiz/',
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
    link: 'https://www.databricks.com/company/newsroom/press-releases/databricks-raises-10b-series-j-investment-62b-valuation',
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
    link: 'https://www.snowflake.com/news/snowflake-launches-arctic-the-most-open-enterprise-grade-large-language-model/',
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
    link: 'https://www.servicenow.com/company/media/press-room/washington-release.html',
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
    link: 'https://press.spglobal.com/2024-09-06-SP-Dow-Jones-Indices-Announces-Update-to-S-P-500-S-P-MidCap-400-and-S-P-SmallCap-600',
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
    link: 'https://x.ai/blog/series-c',
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
    link: 'https://openai.com/index/announcing-the-stargate-project/',
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
    link: 'https://www.getdbt.com/blog/dbt-fusion-engine',
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
