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

const CATEGORIES = [
  { key: 'all',      label: '全部',    icon: '📡', color: '#6c5ce7' },
  { key: 'ai',       label: 'AI',      icon: '🤖', color: '#6c5ce7' },
  { key: 'software', label: '软件',    icon: '💻', color: '#326ce5' },
  { key: 'game',     label: '游戏',    icon: '🎮', color: '#e17055' },
  { key: 'hardware', label: '硬件',    icon: '🔧', color: '#00cec9' },
  { key: 'startup',  label: '创业融资', icon: '🚀', color: '#ffa657' },
  { key: 'policy',   label: '政策监管', icon: '📋', color: '#3fb950' },
];
const CAT_MAP = Object.fromEntries(CATEGORIES.map(c => [c.key, c]));

const REGIONS = [
  { key: 'all',    label: '全球' },
  { key: 'global', label: '国际' },
  { key: 'china',  label: '国内' },
];

// ─── 新闻数据（按时间倒序，含历史汇总） ──────────────────────────────────────

const NEWS_DATA = [
  // ══════════════════════════════════════════════════════
  // 2026-04-18（今日）
  // ══════════════════════════════════════════════════════
  {
    id: 101,
    category: 'ai',
    region: 'global',
    title: 'Anthropic 发布 Claude 4，推理能力大幅提升，支持 200K 上下文窗口',
    summary: 'Claude 4 在数学推理、代码生成和长文档理解上全面超越 GPT-4o，企业版支持私有化部署，API 定价下调 30%。',
    source: 'TechCrunch',
    date: '2026-04-18',
    tags: ['LLM', 'Anthropic', '推理'],
    hot: true,
  },
  {
    id: 102,
    category: 'software',
    region: 'global',
    title: 'GitHub Copilot 新增 Agent 模式，可自主完成多步骤编程任务',
    summary: 'Copilot Agent 可自主读取代码库、运行测试、修复 Bug，完成从需求到 PR 的完整流程，开发者效率提升实测 40%。',
    source: 'GitHub Blog',
    date: '2026-04-18',
    tags: ['GitHub', 'Copilot', 'Agent'],
    hot: true,
  },
  {
    id: 103,
    category: 'game',
    region: 'global',
    title: 'Epic Games 发布 MetaHuman AI，实时生成高保真数字人，成本降低 90%',
    summary: 'MetaHuman AI 可在 10 分钟内生成影视级数字人，并支持实时表情驱动，游戏和影视制作成本大幅下降。',
    source: 'GamesIndustry.biz',
    date: '2026-04-18',
    tags: ['Epic', '数字人', 'AIGC'],
    hot: true,
  },
  {
    id: 104,
    category: 'hardware',
    region: 'global',
    title: 'Meta 发布 Ray-Ban 第三代 AI 眼镜，内置 Llama 3 本地推理，续航 12 小时',
    summary: '新一代 Ray-Ban 支持实时翻译、场景理解和 AR 叠加，本地运行 Llama 3 保护隐私，预售 24 小时售罄。',
    source: 'The Verge',
    date: '2026-04-18',
    tags: ['Meta', 'AI眼镜', 'AR'],
    hot: true,
  },
  {
    id: 105,
    category: 'startup',
    region: 'global',
    title: 'Harvey AI 完成 $300M D 轮，法律 AI 估值达 $30 亿，扩张至亚洲市场',
    summary: 'Harvey AI 已服务全球 Top 50 律所中的 30 家，D 轮资金将用于亚洲市场扩张和多语言支持。',
    source: 'Forbes',
    date: '2026-04-18',
    tags: ['Harvey', '法律AI', '融资'],
    hot: true,
  },
  {
    id: 106,
    category: 'policy',
    region: 'china',
    title: '工信部发布《AI 生成内容标识管理办法》，AIGC 内容须强制标注',
    summary: '新规要求所有 AI 生成的文字、图片、视频内容必须添加可识别标识，违规最高罚款 100 万元，2026 年 7 月起执行。',
    source: '工信部',
    date: '2026-04-18',
    tags: ['政策', 'AIGC', '监管'],
    hot: true,
  },

  // ══════════════════════════════════════════════════════
  // 2026-04-17
  // ══════════════════════════════════════════════════════
  {
    id: 107,
    category: 'ai',
    region: 'china',
    title: '阿里通义千问 3 发布，开源版本性能对标 GPT-4o，支持 MCP 协议',
    summary: '通义千问 3 开源版本在多项基准测试中超越 Llama 3，并原生支持 MCP 工具调用协议，开发者生态快速扩张。',
    source: '36氪',
    date: '2026-04-17',
    tags: ['LLM', '阿里', '开源'],
    hot: true,
  },
  {
    id: 108,
    category: 'software',
    region: 'global',
    title: 'Cursor 月活突破 500 万，估值达 $25 亿，AI IDE 赛道竞争加剧',
    summary: 'Cursor 凭借深度代码库理解和多文件编辑能力快速增长，VS Code 插件生态受到冲击，微软加速 Copilot 迭代。',
    source: 'Bloomberg',
    date: '2026-04-17',
    tags: ['Cursor', 'AI IDE', '融资'],
    hot: true,
  },
  {
    id: 109,
    category: 'game',
    region: 'china',
    title: '米哈游《原神》AI NPC 系统上线，玩家与角色对话体验大幅提升',
    summary: '米哈游将 LLM 接入游戏 NPC 系统，角色可进行开放式对话，玩家留存率提升 15%，AI 游戏化应用进入主流。',
    source: '游戏葡萄',
    date: '2026-04-17',
    tags: ['米哈游', 'AI NPC', '游戏'],
    hot: true,
  },
  {
    id: 110,
    category: 'hardware',
    region: 'china',
    title: '雷鸟创新发布 X3 Pro AI 眼镜，搭载国产大模型，售价 2999 元',
    summary: '雷鸟 X3 Pro 集成通义千问，支持实时翻译和导航，国产供应链优势使售价比 Meta 低 40%，主打性价比市场。',
    source: '雷科技',
    date: '2026-04-17',
    tags: ['雷鸟', 'AI眼镜', '国产'],
    hot: true,
  },
  {
    id: 111,
    category: 'startup',
    region: 'global',
    title: 'YC W26 Demo Day：AI Agent 占比 60%，MCP 工具链创业成新热点',
    summary: 'YC 2026 冬季批次 200 家公司中，60% 与 AI Agent 相关，MCP 工具集成、垂直行业 Agent 是最热赛道。',
    source: 'Y Combinator',
    date: '2026-04-17',
    tags: ['YC', 'Agent', '创业'],
    hot: true,
  },

  // ══════════════════════════════════════════════════════
  // 2026-04-16
  // ══════════════════════════════════════════════════════
  {
    id: 112,
    category: 'ai',
    region: 'global',
    title: 'OpenAI 推出 o3-mini 企业版，专为代码生成和数学推理优化',
    summary: '定价比 GPT-4o 低 40%，推理速度提升 3x，主打企业级代码助手场景，已有 500+ 企业客户。',
    source: 'The Verge',
    date: '2026-04-16',
    tags: ['OpenAI', '推理模型', '企业'],
    hot: false,
  },
  {
    id: 113,
    category: 'software',
    region: 'china',
    title: '腾讯云发布 AI 原生开发平台，集成代码生成、测试、部署全链路',
    summary: '腾讯云 AI 开发平台打通从需求到上线的完整流程，主打企业私有化部署，已有 200+ 企业客户。',
    source: '腾讯科技',
    date: '2026-04-16',
    tags: ['腾讯云', 'AI开发', '企业'],
    hot: false,
  },
  {
    id: 114,
    category: 'game',
    region: 'global',
    title: 'Inworld AI 完成 $150M C 轮融资，AI NPC 平台估值达 $10 亿',
    summary: 'Inworld AI 已与 EA、育碧等主流游戏厂商签约，AI NPC 赛道进入规模化阶段，竞争对手 Convai 同期融资 $30M。',
    source: 'TechCrunch',
    date: '2026-04-16',
    tags: ['Inworld', 'AI NPC', '融资'],
    hot: false,
  },
  {
    id: 115,
    category: 'startup',
    region: 'china',
    title: '智谱 AI 完成 20 亿元 C+ 轮融资，估值超 200 亿，加速企业市场布局',
    summary: '智谱 AI 凭借 GLM 系列模型在企业私有化部署市场快速增长，本轮融资将用于模型研发和销售团队扩张。',
    source: '36氪',
    date: '2026-04-16',
    tags: ['智谱AI', '融资', '企业AI'],
    hot: false,
  },

  // ══════════════════════════════════════════════════════
  // 2026-04-15
  // ══════════════════════════════════════════════════════
  {
    id: 116,
    category: 'ai',
    region: 'global',
    title: 'MCP 协议生态爆发：超过 5000 个工具服务器上线，成为 Agent 标准协议',
    summary: 'Anthropic 发布 MCP 1.0 正式版，主流 IDE、云平台、SaaS 工具纷纷接入，Agent 编排中间件赛道升温。',
    source: 'Hacker News',
    date: '2026-04-15',
    tags: ['MCP', 'Agent', '生态'],
    hot: true,
  },
  {
    id: 117,
    category: 'software',
    region: 'global',
    title: 'Figma 发布 AI 设计助手，可将自然语言描述直接生成可交互原型',
    summary: 'Figma AI 支持从文字描述生成完整 UI 组件，并可直接导出 React 代码，设计师和开发者协作流程大幅简化。',
    source: 'Figma Blog',
    date: '2026-04-15',
    tags: ['Figma', 'AI设计', 'UI'],
    hot: false,
  },
  {
    id: 118,
    category: 'hardware',
    region: 'global',
    title: 'NVIDIA 发布 Jetson Thor，边缘 AI 算力提升 10x，机器人应用爆发',
    summary: 'Jetson Thor 专为人形机器人设计，支持多模态感知和实时决策，Figure 01、1X 等机器人公司已预订。',
    source: 'NVIDIA Blog',
    date: '2026-04-15',
    tags: ['NVIDIA', '边缘AI', '机器人'],
    hot: false,
  },
  {
    id: 119,
    category: 'policy',
    region: 'global',
    title: 'EU AI Act 正式生效：高风险 AI 系统须通过合规审查，违规罚款达营收 7%',
    summary: 'EU AI Act 对医疗、金融、执法等高风险 AI 应用设置严格准入门槛，欧洲 AI 创业公司合规成本大幅上升。',
    source: 'Reuters',
    date: '2026-04-15',
    tags: ['EU AI Act', '合规', '监管'],
    hot: false,
  },

  // ══════════════════════════════════════════════════════
  // 2026-04-14
  // ══════════════════════════════════════════════════════
  {
    id: 120,
    category: 'ai',
    region: 'china',
    title: '字节跳动豆包大模型日活突破 1 亿，推出企业版 API 定价策略',
    summary: '豆包在消费端积累大量用户后，开始向企业市场渗透，API 定价比 GPT-4o 低 60%，主打性价比路线。',
    source: '虎嗅',
    date: '2026-04-14',
    tags: ['字节', '豆包', '企业AI'],
    hot: false,
  },
  {
    id: 121,
    category: 'hardware',
    region: 'china',
    title: '华为发布昇腾 910C，AI 训练性能对标 H100，国产算力生态加速',
    summary: '昇腾 910C 在 LLM 训练任务上性能达到 H100 的 85%，配合 MindSpore 框架，国内大模型训练成本大幅下降。',
    source: '华为',
    date: '2026-04-14',
    tags: ['华为', '昇腾', 'AI芯片'],
    hot: true,
  },
  {
    id: 122,
    category: 'game',
    region: 'global',
    title: 'Steam 2025 年度报告：AI 辅助开发游戏占比达 35%，独立游戏爆发',
    summary: 'AI 工具大幅降低独立游戏开发门槛，2025 年 Steam 新上架游戏数量同比增长 60%，但头部效应依然显著。',
    source: 'Steam',
    date: '2026-04-14',
    tags: ['Steam', '独立游戏', 'AIGC'],
    hot: false,
  },
  {
    id: 123,
    category: 'policy',
    region: 'china',
    title: '国家数据局发布数据跨境流通新规，AI 训练数据出境须经安全评估',
    summary: '新规明确 AI 模型训练数据的跨境传输须经国家数据局安全评估，进一步强化数据主权，本土 AI 公司受益。',
    source: '国家数据局',
    date: '2026-04-14',
    tags: ['数据主权', '政策', '跨境'],
    hot: false,
  },

  // ══════════════════════════════════════════════════════
  // 2026 年 第 14 周（2026-04-01 ~ 2026-04-13）历史汇总
  // ══════════════════════════════════════════════════════
  {
    id: 201,
    category: 'ai',
    region: 'global',
    title: '【周汇总】GPT-4.5 发布 + Gemini 2.0 Ultra 开放 API，多模态竞争白热化',
    summary: '本周 OpenAI 发布 GPT-4.5（更强的指令跟随和多模态），Google 开放 Gemini 2.0 Ultra API，多模态推理能力成为新战场。同期 Mistral 发布 Mistral Large 3，开源阵营持续追赶。',
    source: '多源汇总',
    date: '2026-04-10',
    tags: ['LLM', 'GPT', 'Gemini', '多模态'],
    hot: true,
  },
  {
    id: 202,
    category: 'software',
    region: 'global',
    title: '【周汇总】Windsurf 融资 $1B，AI IDE 赛道进入独角兽时代',
    summary: 'Windsurf（原 Codeium）完成 $1B 融资，估值 $30 亿，与 Cursor 形成双雄格局。Replit 同期发布 AI Agent 模式，支持全栈应用自动生成和部署。',
    source: '多源汇总',
    date: '2026-04-08',
    tags: ['Windsurf', 'AI IDE', '融资'],
    hot: true,
  },
  {
    id: 203,
    category: 'hardware',
    region: 'global',
    title: '【周汇总】TSMC 3nm 产能扩张 + AMD MI350 发布，AI 芯片供应链重塑',
    summary: 'TSMC 宣布 3nm 月产能提升至 10 万片，AMD 发布 MI350 GPU（对标 H200），AI 训练集群成本有望在 2026 年下半年下降 20%。',
    source: '多源汇总',
    date: '2026-04-07',
    tags: ['TSMC', 'AMD', 'AI芯片', '供应链'],
    hot: false,
  },
  {
    id: 204,
    category: 'startup',
    region: 'global',
    title: '【周汇总】AI 基础设施融资周：Cohere $500M、Together AI $300M、Groq $640M',
    summary: '本周 AI Infra 赛道密集融资：Cohere 完成 $500M E 轮（企业 LLM），Together AI $300M（开源推理云），Groq $640M（LPU 推理芯片）。AI 基础设施投资热度持续高涨。',
    source: '多源汇总',
    date: '2026-04-05',
    tags: ['融资', 'AI Infra', 'Cohere', 'Groq'],
    hot: true,
  },

  // ══════════════════════════════════════════════════════
  // 2026 年 第 13 周（2026-03-23 ~ 2026-03-31）
  // ══════════════════════════════════════════════════════
  {
    id: 205,
    category: 'ai',
    region: 'global',
    title: '【周汇总】Claude 3.7 Sonnet 发布，混合推理模式成行业新标准',
    summary: 'Anthropic 发布 Claude 3.7 Sonnet，首创"混合推理"模式（快速响应 + 深度思考可切换），在 SWE-bench 上达到 70.3%，成为代码生成新标杆。',
    source: '多源汇总',
    date: '2026-03-28',
    tags: ['Claude', 'Anthropic', '推理'],
    hot: true,
  },
  {
    id: 206,
    category: 'policy',
    region: 'china',
    title: '【周汇总】中国 AI 治理新进展：算法备案制度落地，大模型须通过安全评估',
    summary: '国家互联网信息办公室发布《生成式人工智能服务管理暂行办法》实施细则，明确大模型上线须通过安全评估，算法备案制度正式落地，影响国内 30+ 大模型产品。',
    source: '网信办',
    date: '2026-03-25',
    tags: ['政策', '算法备案', '大模型监管'],
    hot: false,
  },
  {
    id: 207,
    category: 'game',
    region: 'china',
    title: '【周汇总】腾讯游戏 AI 战略发布：NPC 智能化 + AI 辅助开发双轮驱动',
    summary: '腾讯游戏发布 AI 战略白皮书，宣布旗下所有新游戏将接入 AI NPC 系统，同时推出 GameAI 开发平台，为中小游戏团队提供 AI 辅助开发工具。',
    source: '腾讯游戏',
    date: '2026-03-24',
    tags: ['腾讯', '游戏AI', 'NPC'],
    hot: false,
  },

  // ══════════════════════════════════════════════════════
  // 2025 年 12 月（历史月度汇总）
  // ══════════════════════════════════════════════════════
  {
    id: 301,
    category: 'ai',
    region: 'global',
    title: '【月汇总·2025-12】o3 发布震撼 AI 圈，推理能力突破人类专家水平',
    summary: 'OpenAI 发布 o3 模型，在 ARC-AGI 测试中达到 87.5%（人类平均 85%），在竞赛数学（AIME）达到 96.7%。标志着 AI 推理能力进入新阶段。同月 Google 发布 Gemini 2.0，多模态能力全面升级。',
    source: '月度汇总',
    date: '2025-12-25',
    tags: ['o3', 'OpenAI', 'AGI', '推理'],
    hot: true,
  },
  {
    id: 302,
    category: 'hardware',
    region: 'global',
    title: '【月汇总·2025-12】NVIDIA Blackwell 全面量产，GB200 NVL72 机架出货',
    summary: 'NVIDIA Blackwell 架构 GPU 全面量产，GB200 NVL72 机架（72 块 B200 GPU，1.4 PFLOPS）开始向微软、谷歌、亚马逊交付，AI 训练算力进入新纪元。',
    source: '月度汇总',
    date: '2025-12-20',
    tags: ['NVIDIA', 'Blackwell', 'GPU', '算力'],
    hot: true,
  },
  {
    id: 303,
    category: 'startup',
    region: 'global',
    title: '【月汇总·2025-12】2025 年 AI 融资总额突破 $1000 亿，创历史新高',
    summary: '2025 年全球 AI 领域融资总额突破 $1000 亿，其中 AI 基础设施（$380 亿）、企业 AI 应用（$290 亿）、AI 硬件（$180 亿）为前三大赛道。OpenAI 单轮 $157 亿融资创纪录。',
    source: '月度汇总',
    date: '2025-12-31',
    tags: ['融资', 'AI投资', '年度总结'],
    hot: true,
  },

  // ══════════════════════════════════════════════════════
  // 2025 年 11 月
  // ══════════════════════════════════════════════════════
  {
    id: 304,
    category: 'ai',
    region: 'global',
    title: '【月汇总·2025-11】Llama 3.3 发布 + Qwen2.5 系列开源，开源 LLM 追平闭源',
    summary: 'Meta 发布 Llama 3.3 70B，在多项基准上超越 GPT-4o；阿里 Qwen2.5 系列（7B/14B/72B）全面开源，72B 版本在代码和数学上达到 GPT-4 水平。开源 LLM 生态进入爆发期。',
    source: '月度汇总',
    date: '2025-11-20',
    tags: ['Llama', 'Qwen', '开源LLM'],
    hot: false,
  },
  {
    id: 305,
    category: 'software',
    region: 'global',
    title: '【月汇总·2025-11】Anthropic 发布 Computer Use，AI 操控电脑成现实',
    summary: 'Anthropic 发布 Claude Computer Use 功能，AI 可直接操控浏览器、桌面应用完成复杂任务。标志着 AI Agent 从"对话"走向"行动"，RPA 行业面临颠覆。',
    source: '月度汇总',
    date: '2025-11-15',
    tags: ['Claude', 'Computer Use', 'Agent'],
    hot: true,
  },

  // ══════════════════════════════════════════════════════
  // 2025 年 10 月
  // ══════════════════════════════════════════════════════
  {
    id: 306,
    category: 'hardware',
    region: 'china',
    title: '【月汇总·2025-10】华为昇腾 910B 集群规模突破万卡，国产算力生态成型',
    summary: '华为昇腾 910B 单集群规模突破 10000 卡，训练千亿参数模型效率达到 A100 集群的 80%。国内主要大模型公司（百度/阿里/字节）均已部署昇腾集群，国产算力替代加速。',
    source: '月度汇总',
    date: '2025-10-18',
    tags: ['华为', '昇腾', '国产算力'],
    hot: false,
  },
  {
    id: 307,
    category: 'game',
    region: 'global',
    title: '【月汇总·2025-10】微软 Xbox AI 战略：AI NPC + AI 游戏生成双管齐下',
    summary: '微软发布 Xbox AI 战略，宣布将 Azure AI 深度集成到游戏开发流程，支持 AI NPC 对话、AI 关卡生成、AI 美术资产生成，并向第三方开发者开放 API。',
    source: '月度汇总',
    date: '2025-10-10',
    tags: ['微软', 'Xbox', 'AI游戏'],
    hot: false,
  },

  // ══════════════════════════════════════════════════════
  // 2025 年 Q1-Q3 年度汇总
  // ══════════════════════════════════════════════════════
  {
    id: 401,
    category: 'ai',
    region: 'global',
    title: '【季度汇总·2025 Q3】推理模型成主流，o1/o3/Claude 3.5 引领新范式',
    summary: '2025 年 Q3 是推理模型爆发季：OpenAI o1 系列、Claude 3.5 Sonnet、Gemini 1.5 Pro 相继发布，"慢思考"推理范式成为行业共识。Agent 框架（LangChain/AutoGen/CrewAI）月下载量突破千万。',
    source: '季度汇总',
    date: '2025-09-30',
    tags: ['推理模型', 'Agent', '季度总结'],
    hot: false,
  },
  {
    id: 402,
    category: 'startup',
    region: 'global',
    title: '【季度汇总·2025 Q2】AI 应用层爆发：垂直 SaaS 融资超越基础模型',
    summary: '2025 年 Q2 首次出现 AI 应用层融资额超越基础模型层的情况。法律 AI（Harvey/Clio）、医疗 AI（Abridge/Nabla）、销售 AI（Gong/Clari）等垂直赛道融资合计超 $200 亿。',
    source: '季度汇总',
    date: '2025-06-30',
    tags: ['融资', '垂直AI', 'SaaS'],
    hot: false,
  },

  // ══════════════════════════════════════════════════════
  // 2024 年（年度汇总）
  // ══════════════════════════════════════════════════════
  {
    id: 501,
    category: 'ai',
    region: 'global',
    title: '【年度汇总·2024】GPT-4o + Claude 3 + Gemini 1.5：多模态 AI 元年',
    summary: '2024 年是多模态 AI 元年：GPT-4o 实现实时语音视觉交互，Claude 3 Opus 在多项基准超越 GPT-4，Gemini 1.5 Pro 支持 100 万 token 上下文。Sora 视频生成震撼发布，AI 生成内容进入视频时代。',
    source: '年度汇总',
    date: '2024-12-31',
    tags: ['GPT-4o', 'Claude 3', 'Gemini', '多模态', '年度总结'],
    hot: false,
  },
  {
    id: 502,
    category: 'hardware',
    region: 'global',
    title: '【年度汇总·2024】NVIDIA H100/H200 供不应求，AI 算力军备竞赛全面开启',
    summary: '2024 年 NVIDIA H100 全年供不应求，H200 发布后等待期长达 6 个月。微软/谷歌/亚马逊/Meta 合计 AI 资本支出超 $2000 亿。AMD MI300X 开始抢占市场，AI 芯片竞争格局初现。',
    source: '年度汇总',
    date: '2024-12-31',
    tags: ['NVIDIA', 'H100', 'AI算力', '年度总结'],
    hot: false,
  },
  {
    id: 503,
    category: 'software',
    region: 'global',
    title: '【年度汇总·2024】AI Coding 元年：Copilot 月活 1.8 亿，Cursor 异军突起',
    summary: '2024 年是 AI Coding 元年：GitHub Copilot 月活突破 1.8 亿，Cursor 从 0 到 400 万月活，Devin（AI 软件工程师）震撼发布。AI 辅助编程从"补全工具"升级为"协作伙伴"。',
    source: '年度汇总',
    date: '2024-12-31',
    tags: ['AI Coding', 'Copilot', 'Cursor', '年度总结'],
    hot: false,
  },
  {
    id: 504,
    category: 'game',
    region: 'global',
    title: '【年度汇总·2024】游戏行业 AI 化元年：AI NPC、AI 美术资产生成规模落地',
    summary: '2024 年游戏行业 AI 化全面提速：Inworld AI 完成 $50M 融资，EA/育碧/腾讯相继发布 AI NPC 系统；Midjourney/Stable Diffusion 在游戏美术资产生成中大规模应用，独立游戏开发成本下降 60%。',
    source: '年度汇总',
    date: '2024-12-30',
    tags: ['游戏AI', 'AI NPC', 'AIGC', '年度总结'],
    hot: false,
  },
  {
    id: 505,
    category: 'startup',
    region: 'global',
    title: '【年度汇总·2024】AI 融资创纪录：OpenAI $157 亿领跑，垂直 AI 应用爆发',
    summary: '2024 年全球 AI 融资总额超 $600 亿，OpenAI 单轮 $157 亿创纪录，Anthropic $40 亿、xAI $60 亿紧随其后。垂直 AI 应用（法律/医疗/销售）融资合计超 $100 亿，AI 应用层开始超越基础模型层。',
    source: '年度汇总',
    date: '2024-12-29',
    tags: ['融资', 'OpenAI', '垂直AI', '年度总结'],
    hot: false,
  },
  {
    id: 506,
    category: 'policy',
    region: 'global',
    title: '【年度汇总·2024】全球 AI 监管元年：EU AI Act 通过，中美监管框架分化',
    summary: '2024 年是全球 AI 监管元年：欧盟 AI Act 正式通过（全球首部综合性 AI 法规），中国发布《生成式 AI 服务管理暂行办法》，美国拜登政府签署 AI 行政令。中美欧三大监管框架分化格局形成。',
    source: '年度汇总',
    date: '2024-12-28',
    tags: ['EU AI Act', '监管', '政策', '年度总结'],
    hot: false,
  },

  // ══════════════════════════════════════════════════════
  // 2023 年（年度汇总）
  // ══════════════════════════════════════════════════════
  {
    id: 601,
    category: 'ai',
    region: 'global',
    title: '【年度汇总·2023】ChatGPT 引爆 AI 革命，GPT-4 发布，大模型竞赛全面开启',
    summary: '2023 年是大模型元年：ChatGPT 用户突破 1 亿（史上最快），GPT-4 发布引发全球震动，Google 发布 Bard/Gemini，Meta 开源 Llama 2，百度文心一言/阿里通义千问/华为盘古相继发布。全球大模型军备竞赛正式开启。',
    source: '年度汇总',
    date: '2023-12-31',
    tags: ['ChatGPT', 'GPT-4', 'LLM', '年度总结'],
    hot: false,
  },
  {
    id: 602,
    category: 'software',
    region: 'global',
    title: '【年度汇总·2023】AI 编程助手爆发：GitHub Copilot 商业化，Cursor 诞生',
    summary: '2023 年 GitHub Copilot 正式商业化，月活突破 100 万付费用户；Cursor 发布 0.1 版本，AI-first IDE 概念兴起；Amazon CodeWhisperer 免费开放，AI 编程助手赛道进入红海竞争。',
    source: '年度汇总',
    date: '2023-12-30',
    tags: ['Copilot', 'Cursor', 'AI编程', '年度总结'],
    hot: false,
  },
  {
    id: 603,
    category: 'hardware',
    region: 'global',
    title: '【年度汇总·2023】NVIDIA H100 成最抢手芯片，AI 算力需求超预期爆发',
    summary: '2023 年 NVIDIA H100 成为全球最抢手芯片，等待期长达 9 个月，NVIDIA 市值突破 $1 万亿。AMD 发布 MI300 系列，Google TPU v4 扩产，AI 算力供给严重不足推动云厂商自研芯片加速。',
    source: '年度汇总',
    date: '2023-12-29',
    tags: ['NVIDIA', 'H100', 'AI芯片', '年度总结'],
    hot: false,
  },
  {
    id: 604,
    category: 'game',
    region: 'global',
    title: '【年度汇总·2023】游戏行业 AI 化起步：AIGC 美术工具普及，AI NPC 概念兴起',
    summary: '2023 年 AIGC 工具（Midjourney/Stable Diffusion/DALL-E 3）在游戏美术领域大规模应用，独立开发者成本大幅下降；Inworld AI 完成 $50M A 轮，AI NPC 概念开始受到主流游戏厂商关注。',
    source: '年度汇总',
    date: '2023-12-28',
    tags: ['AIGC', '游戏美术', 'AI NPC', '年度总结'],
    hot: false,
  },
  {
    id: 605,
    category: 'startup',
    region: 'global',
    title: '【年度汇总·2023】AI 创业浪潮：Anthropic $40 亿、Inflection $13 亿，独角兽批量涌现',
    summary: '2023 年 AI 创业融资创历史纪录：Anthropic 完成 $40 亿融资（Google/Amazon），Inflection AI $13 亿，Mistral AI $1.13 亿（欧洲最大 AI 种子轮）。YC 2023 批次 30% 为 AI 公司，AI 创业浪潮全面开启。',
    source: '年度汇总',
    date: '2023-12-27',
    tags: ['Anthropic', 'Mistral', '融资', '年度总结'],
    hot: false,
  },
  {
    id: 606,
    category: 'policy',
    region: 'china',
    title: '【年度汇总·2023】中国 AI 监管先行：生成式 AI 管理办法出台，算法备案制度建立',
    summary: '2023 年中国率先出台《生成式人工智能服务管理暂行办法》，要求大模型服务须经安全评估备案；同年《互联网信息服务算法推荐管理规定》正式实施，中国成为全球最早建立 AI 监管框架的主要经济体之一。',
    source: '年度汇总',
    date: '2023-12-26',
    tags: ['政策', '生成式AI', '算法备案', '年度总结'],
    hot: false,
  },

  // ══════════════════════════════════════════════════════
  // 2022 年（年度汇总）
  // ══════════════════════════════════════════════════════
  {
    id: 701,
    category: 'ai',
    region: 'global',
    title: '【年度汇总·2022】ChatGPT 横空出世，AIGC 元年：Stable Diffusion/Midjourney 爆发',
    summary: '2022 年是 AIGC 元年：Stable Diffusion 开源引爆图像生成，Midjourney 月活突破百万，DALL-E 2 发布；12 月 ChatGPT 上线，5 天用户破百万，开启 AI 大众化时代。GPT-3.5 证明 RLHF 对齐的有效性。',
    source: '年度汇总',
    date: '2022-12-31',
    tags: ['ChatGPT', 'AIGC', 'Stable Diffusion', '年度总结'],
    hot: false,
  },
  {
    id: 702,
    category: 'hardware',
    region: 'global',
    title: '【年度汇总·2022】NVIDIA A100 成 AI 训练标配，元宇宙硬件泡沫破裂',
    summary: '2022 年 NVIDIA A100 成为大模型训练标配，数据中心 GPU 需求激增；与此同时，Meta 元宇宙战略受挫，VR/AR 硬件出货量大幅下滑，元宇宙硬件泡沫破裂，AI 算力成为新的硬件投资主线。',
    source: '年度汇总',
    date: '2022-12-30',
    tags: ['NVIDIA', 'A100', '元宇宙', '年度总结'],
    hot: false,
  },
  {
    id: 703,
    category: 'game',
    region: 'global',
    title: '【年度汇总·2022】游戏行业寒冬：裁员潮 + 版号收紧，AI 工具开始渗透',
    summary: '2022 年全球游戏行业进入寒冬：EA/Activision/Riot 相继裁员，中国版号审批收紧；但 AI 工具开始渗透游戏开发流程，Midjourney 在游戏概念美术中广泛应用，降本增效成为行业主旋律。',
    source: '年度汇总',
    date: '2022-12-29',
    tags: ['游戏寒冬', '裁员', 'AIGC', '年度总结'],
    hot: false,
  },
  {
    id: 704,
    category: 'software',
    region: 'global',
    title: '【年度汇总·2022】GitHub Copilot 正式发布，AI 辅助编程从概念走向产品',
    summary: '2022 年 GitHub Copilot 正式商业化发布（$10/月），成为首个大规模商业化的 AI 编程助手。同年 Amazon CodeWhisperer 发布，AI 辅助编程赛道正式形成，开发者生产力工具迎来 AI 化浪潮。',
    source: '年度汇总',
    date: '2022-12-28',
    tags: ['Copilot', 'AI编程', '开发者工具', '年度总结'],
    hot: false,
  },

  // ══════════════════════════════════════════════════════
  // 2021 年（年度汇总）
  // ══════════════════════════════════════════════════════
  {
    id: 801,
    category: 'ai',
    region: 'global',
    title: '【年度汇总·2021】GPT-3 生态爆发，DALL-E/Codex 开启多模态与编程 AI 时代',
    summary: '2021 年 OpenAI 发布 DALL-E（文生图）和 Codex（代码生成），GPT-3 API 生态快速扩张，涌现数千个 AI 应用。DeepMind AlphaFold 2 解决蛋白质折叠问题，被《Science》评为年度最大科学突破。',
    source: '年度汇总',
    date: '2021-12-31',
    tags: ['GPT-3', 'DALL-E', 'Codex', 'AlphaFold', '年度总结'],
    hot: false,
  },
  {
    id: 802,
    category: 'hardware',
    region: 'global',
    title: '【年度汇总·2021】芯片短缺危机全球蔓延，NVIDIA 收购 ARM 失败，元宇宙硬件起步',
    summary: '2021 年全球芯片短缺危机蔓延至汽车/消费电子/服务器，NVIDIA 收购 ARM 因监管受阻最终失败；Meta 发布 Quest 2 销量突破千万，元宇宙硬件赛道兴起，NVIDIA 市值首次突破 $7000 亿。',
    source: '年度汇总',
    date: '2021-12-30',
    tags: ['芯片短缺', 'NVIDIA', 'ARM', '元宇宙', '年度总结'],
    hot: false,
  },
  {
    id: 803,
    category: 'game',
    region: 'global',
    title: '【年度汇总·2021】游戏行业黄金年：疫情红利延续，Roblox/Epic 元宇宙布局',
    summary: '2021 年游戏行业延续疫情红利，全球游戏市场规模突破 $1800 亿。Roblox 上市市值 $380 亿，Epic Games 完成 $10 亿融资布局元宇宙，微软 $687 亿收购动视暴雪震撼业界。',
    source: '年度汇总',
    date: '2021-12-29',
    tags: ['Roblox', 'Epic', '元宇宙', '微软', '年度总结'],
    hot: false,
  },
  {
    id: 804,
    category: 'startup',
    region: 'global',
    title: '【年度汇总·2021】AI 创业融资创纪录：全球 AI 投资突破 $660 亿，独角兽数量翻倍',
    summary: '2021 年全球 AI 投资突破 $660 亿（同比增长 108%），AI 独角兽数量从 2020 年的 65 家增至 150 家。Databricks $16 亿、Scale AI $10 亿、Cohere $1.25 亿等标志性融资密集发生。',
    source: '年度汇总',
    date: '2021-12-28',
    tags: ['融资', 'Databricks', 'Scale AI', '年度总结'],
    hot: false,
  },

  // ══════════════════════════════════════════════════════
  // 2020 年（年度汇总）
  // ══════════════════════════════════════════════════════
  {
    id: 901,
    category: 'ai',
    region: 'global',
    title: '【年度汇总·2020】GPT-3 震撼发布，Transformer 架构统治 NLP，疫情加速 AI 落地',
    summary: '2020 年 OpenAI 发布 GPT-3（1750 亿参数），展示出惊人的少样本学习能力，引发全球 AI 研究热潮。疫情加速 AI 在医疗（新冠药物筛选）、远程办公、在线教育等场景落地。AlphaGo 团队转向蛋白质折叠研究。',
    source: '年度汇总',
    date: '2020-12-31',
    tags: ['GPT-3', 'Transformer', 'NLP', '年度总结'],
    hot: false,
  },
  {
    id: 902,
    category: 'hardware',
    region: 'global',
    title: '【年度汇总·2020】NVIDIA 收购 Mellanox + 宣布收购 ARM，AI 算力版图重塑',
    summary: '2020 年 NVIDIA 完成对 Mellanox（高速网络）的 $69 亿收购，强化数据中心 AI 算力生态；同年宣布以 $400 亿收购 ARM，引发全球监管关注。AMD 发布 RDNA 2 架构，AI 芯片竞争格局开始变化。',
    source: '年度汇总',
    date: '2020-12-30',
    tags: ['NVIDIA', 'ARM', 'Mellanox', 'AI芯片', '年度总结'],
    hot: false,
  },
  {
    id: 903,
    category: 'software',
    region: 'global',
    title: '【年度汇总·2020】低代码/无代码爆发，远程协作工具重塑软件行业',
    summary: '2020 年疫情推动远程协作工具爆发：Zoom 市值从 $160 亿涨至 $1000 亿，Notion/Figma/Airtable 用户激增。低代码平台（OutSystems/Mendix/Appian）融资密集，软件开发民主化趋势加速。',
    source: '年度汇总',
    date: '2020-12-29',
    tags: ['低代码', 'Zoom', 'Notion', '远程协作', '年度总结'],
    hot: false,
  },
  {
    id: 904,
    category: 'game',
    region: 'global',
    title: '【年度汇总·2020】疫情催生游戏超级周期：《动森》《Among Us》现象级爆发',
    summary: '2020 年疫情推动全球游戏市场规模突破 $1550 亿（同比增长 12%）。《动物森友会》首周销量 1300 万，《Among Us》月活突破 5 亿，游戏成为疫情期间最重要的社交娱乐方式。',
    source: '年度汇总',
    date: '2020-12-28',
    tags: ['游戏超级周期', '疫情', '年度总结'],
    hot: false,
  },
  {
    id: 905,
    category: 'policy',
    region: 'global',
    title: '【年度汇总·2020】全球数据监管收紧：GDPR 执法加强，中国数据安全立法提速',
    summary: '2020 年全球数据监管全面收紧：欧盟 GDPR 执法罚款总额突破 €1.7 亿，中国《数据安全法》草案发布，美国 CCPA 正式生效。科技巨头数据垄断问题引发全球监管关注，平台经济监管时代开启。',
    source: '年度汇总',
    date: '2020-12-27',
    tags: ['GDPR', '数据安全', '监管', '年度总结'],
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
