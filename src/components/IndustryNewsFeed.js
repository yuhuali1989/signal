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
  // 2026-04-18（今日）
  // ══════════════════════════════════════════════════════
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
  const cat = CAT_MAP[item.category] || CAT_MAP['ai'];
  const isSummary = item.title.startsWith('【');

  return (
    <div className={`flex gap-3 p-4 rounded-2xl border transition-shadow group ${
      isSummary
        ? 'bg-gradient-to-r from-gray-50 to-blue-50/30 border-gray-200 hover:border-blue-200'
        : 'bg-white border-gray-100 hover:shadow-sm'
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

        {/* 标题 */}
        <h3 className="text-sm font-semibold text-gray-900 leading-snug mb-1.5 group-hover:text-[#6c5ce7] transition-colors">
          {item.title}
        </h3>

        {/* 摘要 */}
        <p className="text-xs text-gray-500 leading-relaxed mb-2">{item.summary}</p>

        {/* 来源 + 标签 */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] text-gray-400">来源：{item.source}</span>
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
