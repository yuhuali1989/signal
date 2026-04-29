'use client';

import { useState } from 'react';

// ─── 数据定义 ───────────────────────────────────────────────────────────────

const INDUSTRIES = [
  { key: 'ai-tools',   label: 'AI 工具',    icon: '🤖', color: '#6c5ce7' },
  { key: 'game-tech',  label: '游戏科技',   icon: '🎮', color: '#e17055' },
  { key: 'hardware',   label: '消费硬件',   icon: '🔧', color: '#00cec9' },
  { key: 'dev-tools',  label: '开发者工具', icon: '⚙️', color: '#3fb950' },
  { key: 'enterprise', label: '企业 SaaS',  icon: '🏢', color: '#ffa657' },
];

const IDEAS = [
  // ── AI 工具 ──────────────────────────────────────────────────────────────
  {
    id: 1,
    industry: 'ai-tools',
    title: 'AI 驱动的代码审查 & 安全扫描',
    signal: '🔥🔥 爆发',
    signalDate: '2026-04-29',
    summary: 'Qwen3 全系列开源（2026-04-29）、Llama 4 Scout 10M 上下文开源、DeepSeek-R1 持续引用——开源模型能力已接近闭源旗舰，自部署成本约为 API 的 1/10。AI 编码工具（Cursor/GitHub Copilot/Devin）正在重塑软件开发流程，Cognition AI（Devin）完成 $2.5 亿 B 轮融资（估值 $25 亿）验证了 AI 工程师赛道的商业价值。', 
    opportunity: '中国金融/政务软件外包市场对合规审查需求强烈，且国内缺乏对标产品。',
    overseas: [
      { name: 'Snyk', url: 'https://snyk.io', desc: '代码安全扫描，估值 $8.5B' },
      { name: 'Semgrep', url: 'https://semgrep.dev', desc: '开源静态分析 + AI 修复建议' },
      { name: 'CodeAnt AI', url: 'https://codeant.ai', desc: 'AI 代码审查，YC 2024' },
    ],
    market: '$12B（全球应用安全市场）',
    barrier: '中',
    china: '高',
    tags: ['安全', 'DevSecOps', 'B2B'],
  },
  {
    id: 2,
    industry: 'ai-tools',
    title: 'AI 产品经理 / 需求分析 Agent',
    signal: '🔥 热点',
    signalDate: '2026-04-22',
    summary: 'MIT TR 2026趋势报告将Agent Orchestration列为十大趋势，多Agent协作催生PM工具需求。将用户反馈、竞品分析、数据埋点自动转化为PRD草稿和优先级建议。Forbes AI 50有多家PM工具公司入选。',
    opportunity: '国内互联网公司 PM 数量庞大，工具付费意愿正在提升。',
    overseas: [
      { name: 'Productboard', url: 'https://productboard.com', desc: '产品管理平台，已集成 AI' },
      { name: 'Pendo', url: 'https://pendo.io', desc: '用户行为分析 + AI 洞察' },
      { name: 'Cycle', url: 'https://cycle.app', desc: 'AI 驱动的产品反馈聚合' },
    ],
    market: '$4B（产品管理软件市场）',
    barrier: '低',
    china: '高',
    tags: ['AI Agent', 'SaaS', 'PM工具'],
  },
  {
    id: 3,
    industry: 'ai-tools',
    title: '垂直行业 AI 知识库 & 问答',
    signal: '🔥 热点',
    signalDate: '2026-04',
    summary: '通用 RAG 已泛滥，但法律/医疗/工程等垂直领域需要专业语料 + 合规审计链路。',
    opportunity: '国内法律科技、医疗 AI 政策窗口期，数据本地化要求天然保护本土玩家。',
    overseas: [
      { name: 'Harvey AI', url: 'https://harvey.ai', desc: '法律 AI，估值 $3B' },
      { name: 'Abridge', url: 'https://abridge.com', desc: '医疗对话 AI，A16Z 投资' },
      { name: 'Glean', url: 'https://glean.com', desc: '企业知识搜索，估值 $4.6B' },
    ],
    market: '$30B+（垂直知识管理市场）',
    barrier: '高',
    china: '高',
    tags: ['RAG', '垂直AI', '知识管理'],
  },
  {
    id: 4,
    industry: 'ai-tools',
    title: 'AI 数据标注 & 合成数据平台',
    signal: '🔥 热点',
    signalDate: '2026-04',
    summary: '模型训练对高质量标注数据需求持续增长，合成数据可降低 80% 标注成本。',
    opportunity: '国内自动驾驶/工业视觉公司对标注平台需求旺盛，且数据不能出境。',
    overseas: [
      { name: 'Scale AI', url: 'https://scale.com', desc: '数据标注独角兽，估值 $14B' },
      { name: 'Labelbox', url: 'https://labelbox.com', desc: '标注平台，估值 $1B' },
      { name: 'Gretel AI', url: 'https://gretel.ai', desc: '合成数据生成' },
    ],
    market: '$17B（数据标注市场 2025）',
    barrier: '中',
    china: '高',
    tags: ['数据标注', '合成数据', '基础设施'],
  },

  // ── 游戏科技 ─────────────────────────────────────────────────────────────
  {
    id: 5,
    industry: 'game-tech',
    title: 'AI NPC & 动态叙事引擎',
    signal: '🔥 热点',
    signalDate: '2026-04',
    summary: 'LLM 驱动的 NPC 可实现无限对话和动态剧情，彻底改变 RPG/开放世界游戏体验。',
    opportunity: '国内手游市场庞大，AI NPC 可显著降低内容制作成本，腾讯/网易已在布局但中小团队机会窗口存在。',
    overseas: [
      { name: 'Inworld AI', url: 'https://inworld.ai', desc: 'AI NPC 平台，估值 $500M' },
      { name: 'Convai', url: 'https://convai.com', desc: '游戏 AI 角色，YC 投资' },
      { name: 'Replica Studios', url: 'https://replicastudios.com', desc: 'AI 语音 NPC' },
    ],
    market: '$200B+（全球游戏市场）',
    barrier: '中',
    china: '中',
    tags: ['游戏AI', 'NPC', '叙事'],
  },
  {
    id: 6,
    industry: 'game-tech',
    title: 'AI 游戏内容生成工具（美术/关卡）',
    signal: '👀 关注',
    signalDate: '2026-04',
    summary: '游戏美术资产生成（角色/场景/贴图）和关卡自动生成，可将中小团队的内容产能提升 10x。',
    opportunity: '国内独立游戏和手游团队规模小、美术成本高，AI 生成工具需求迫切。',
    overseas: [
      { name: 'Scenario', url: 'https://scenario.com', desc: '游戏资产 AI 生成' },
      { name: 'Ludo AI', url: 'https://ludo.ai', desc: '游戏创意与市场分析' },
      { name: 'Promethean AI', url: 'https://prometheanai.com', desc: 'AI 关卡设计助手' },
    ],
    market: '$5B（游戏开发工具市场）',
    barrier: '低',
    china: '高',
    tags: ['AIGC', '游戏工具', '美术生成'],
  },
  {
    id: 7,
    industry: 'game-tech',
    title: '云游戏 + AI 个性化推荐平台',
    signal: '👀 关注',
    signalDate: '2026-04',
    summary: '云游戏基础设施成熟后，AI 个性化（难度自适应/内容推荐/防沉迷）成为差异化关键。',
    opportunity: '国内云游戏政策逐步放开，AI 个性化可帮助平台提升留存和合规。',
    overseas: [
      { name: 'NVIDIA GeForce NOW', url: 'https://geforcenow.com', desc: '云游戏平台' },
      { name: 'Overwolf', url: 'https://overwolf.com', desc: '游戏内 App 平台' },
    ],
    market: '$8B（云游戏市场 2025）',
    barrier: '高',
    china: '中',
    tags: ['云游戏', '个性化', '平台'],
  },

  // ── 消费硬件 ─────────────────────────────────────────────────────────────
  {
    id: 8,
    industry: 'hardware',
    title: 'AI 眼镜 / 空间计算配件',
    signal: '🔥 热点',
    signalDate: '2026-04',
    summary: 'Meta Ray-Ban 验证了 AI 眼镜市场，Apple Vision Pro 打开空间计算想象。轻量化 AI 眼镜是下一个硬件平台。',
    opportunity: '国内供应链优势明显，雷鸟/INMO 等已在布局，软件生态和 AI 能力是差异化点。',
    overseas: [
      { name: 'Meta Ray-Ban', url: 'https://ray-ban.com/meta', desc: 'AI 眼镜，2024 爆款' },
      { name: 'Brilliant Labs', url: 'https://brilliantlabs.com', desc: '开源 AR 眼镜' },
      { name: 'Even Realities', url: 'https://evenrealities.com', desc: '轻量 AI 眼镜' },
    ],
    market: '$50B+（AR/AI 眼镜市场预测 2030）',
    barrier: '高',
    china: '高',
    tags: ['硬件', 'AR', 'AI眼镜'],
  },
  {
    id: 9,
    industry: 'hardware',
    title: 'AI 家庭机器人 / 桌面助手',
    signal: '🔥 热点',
    signalDate: '2026-04',
    summary: 'Figure 01、1X 等人形机器人融资热潮，但家庭场景的小型 AI 机器人（陪伴/教育/家务辅助）市场更快落地。',
    opportunity: '国内老龄化加速，AI 陪伴机器人需求增长；教育机器人市场已有验证。',
    overseas: [
      { name: 'Emo Robot', url: 'https://living.ai', desc: '桌面 AI 机器人，Living.ai' },
      { name: 'Loona', url: 'https://keyi.tech', desc: 'AI 宠物机器人' },
      { name: 'Moxie', url: 'https://embodied.com', desc: '儿童 AI 陪伴机器人' },
    ],
    market: '$20B（家庭机器人市场 2028）',
    barrier: '高',
    china: '高',
    tags: ['机器人', '硬件', '陪伴AI'],
  },
  {
    id: 10,
    industry: 'hardware',
    title: 'AI 健康监测可穿戴',
    signal: '👀 关注',
    signalDate: '2026-04',
    summary: '连续血糖监测（CGM）、心理健康监测、睡眠分析等 AI 可穿戴设备，医疗级精度 + 消费级价格是趋势。',
    opportunity: '国内慢病管理市场庞大，医保政策逐步覆盖数字健康设备。',
    overseas: [
      { name: 'Oura Ring', url: 'https://ouraring.com', desc: '健康追踪戒指，估值 $5B' },
      { name: 'Levels Health', url: 'https://levelshealth.com', desc: 'CGM + AI 代谢分析' },
      { name: 'Whoop', url: 'https://whoop.com', desc: '运动健康追踪，估值 $3.6B' },
    ],
    market: '$100B+（数字健康市场）',
    barrier: '高',
    china: '中',
    tags: ['健康科技', '可穿戴', 'AI医疗'],
  },

  // ── 开发者工具 ───────────────────────────────────────────────────────────
  {
    id: 11,
    industry: 'dev-tools',
    title: 'AI 测试自动化平台',
    signal: '🔥 热点',
    signalDate: '2026-04',
    summary: 'AI 可自动生成测试用例、识别 UI 变更、修复 flaky test，将测试覆盖率提升同时降低维护成本。',
    opportunity: '国内大厂测试团队规模大，外包测试市场成熟，AI 测试工具替代空间明确。',
    overseas: [
      { name: 'Momentic', url: 'https://momentic.ai', desc: 'AI E2E 测试，YC 2023' },
      { name: 'Octomind', url: 'https://octomind.dev', desc: 'AI 测试自动化' },
      { name: 'Meticulous', url: 'https://meticulous.ai', desc: '无代码 AI 测试录制' },
    ],
    market: '$8B（软件测试市场）',
    barrier: '中',
    china: '高',
    tags: ['测试', 'DevOps', 'AI工具'],
  },
  {
    id: 12,
    industry: 'dev-tools',
    title: 'AI 运维 & 可观测性平台',
    signal: '👀 关注',
    signalDate: '2026-04',
    summary: 'AIOps：AI 自动根因分析、告警降噪、容量预测，将 MTTR 从小时级降到分钟级。',
    opportunity: '国内云原生普及加速，中小企业缺乏专业 SRE，AI 运维工具需求强烈。',
    overseas: [
      { name: 'Datadog', url: 'https://datadoghq.com', desc: '可观测性平台，市值 $40B' },
      { name: 'Coroot', url: 'https://coroot.com', desc: 'eBPF + AI 可观测性' },
      { name: 'Rootly', url: 'https://rootly.com', desc: 'AI 事故响应平台' },
    ],
    market: '$15B（AIOps 市场 2026）',
    barrier: '高',
    china: '中',
    tags: ['AIOps', '运维', '可观测性'],
  },
  {
    id: 13,
    industry: 'dev-tools',
    title: 'MCP / Agent 编排中间件',
    signal: '🔥 热点',
    signalDate: '2026-04',
    summary: 'MCP 协议爆发，企业需要安全可控的 Agent 编排层：权限管理、审计日志、工具市场。',
    opportunity: '国内企业 AI 化加速，但安全合规要求高，私有化部署的 Agent 中间件是刚需。',
    overseas: [
      { name: 'LangChain', url: 'https://langchain.com', desc: 'Agent 框架，估值 $200M' },
      { name: 'Composio', url: 'https://composio.dev', desc: 'Agent 工具集成平台' },
      { name: 'Arcade AI', url: 'https://arcade-ai.com', desc: 'Agent 工具授权平台' },
    ],
    market: '$10B+（AI 中间件市场预测）',
    barrier: '中',
    china: '高',
    tags: ['MCP', 'Agent', '中间件'],
  },
  {
    id: 16,
    industry: 'dev-tools',
    title: 'AI 编码 Agent（自主软件工程师）',
    signal: '🔥🔥 爆发',
    signalDate: '2026-04',
    summary: 'Cognition AI（Devin）以 $250B 估值融资，Cursor 传闻被 SpaceX 以 $60B 收购，Sierra 收购 Fragment。AI 编码 Agent 从"辅助工具"升级为"自主软件工程师"，能独立完成需求分析→编码→测试→部署全流程。',
    opportunity: '国内软件外包市场规模超 $1000 亿，AI 编码 Agent 可将交付效率提升 5-10x。本土化需求（中文代码注释、国内框架适配、私有化部署）为国内玩家提供保护。',
    overseas: [
      { name: 'Cognition AI (Devin)', url: 'https://cognition.ai', desc: '首个 AI 软件工程师，估值 $250B' },
      { name: 'Cursor', url: 'https://cursor.com', desc: 'AI 代码编辑器，传闻估值 $60B' },
      { name: 'Windsurf (Codeium)', url: 'https://codeium.com', desc: 'AI 编码助手，企业版增长快' },
      { name: 'Sierra', url: 'https://sierra.ai', desc: 'AI 客服 Agent，收购 Fragment' },
    ],
    market: '$50B+（全球软件开发服务市场的 AI 替代空间）',
    barrier: '高',
    china: '中',
    tags: ['AI编码', 'Agent', '软件工程', '开发工具'],
  },

  // ── 企业 SaaS ────────────────────────────────────────────────────────────
  {
    id: 14,
    industry: 'enterprise',
    title: 'AI 财务 & 审计自动化',
    signal: '🔥 热点',
    signalDate: '2026-04',
    summary: '财务对账、发票处理、审计底稿生成等高重复性工作，AI 可将效率提升 5-10x，且合规要求推动企业付费。',
    opportunity: '国内财税数字化政策驱动，中小企业财务外包市场庞大，AI 替代空间明确。',
    overseas: [
      { name: 'Vic.ai', url: 'https://vic.ai', desc: 'AI 财务自动化，北欧独角兽' },
      { name: 'Trullion', url: 'https://trullion.com', desc: 'AI 审计平台' },
      { name: 'Ramp', url: 'https://ramp.com', desc: '企业支出管理 + AI，估值 $16B' },
    ],
    market: '$20B（财务自动化市场）',
    barrier: '中',
    china: '高',
    tags: ['财税', 'AI自动化', 'B2B'],
  },
  {
    id: 15,
    industry: 'enterprise',
    title: 'AI 供应链 & 采购优化',
    signal: '👀 关注',
    signalDate: '2026-04',
    summary: '供应链预测、供应商风险评估、采购谈判 AI 助手，制造业数字化转型的核心痛点。',
    opportunity: '中国制造业体量全球第一，供应链 AI 工具本土化需求强，且数据不出境要求保护本土玩家。',
    overseas: [
      { name: 'Coupa', url: 'https://coupa.com', desc: '采购管理平台，市值 $8B' },
      { name: 'Pactum AI', url: 'https://pactum.com', desc: 'AI 采购谈判，沃尔玛使用' },
      { name: 'Altana', url: 'https://altana.ai', desc: '供应链知识图谱' },
    ],
    market: '$25B（供应链管理软件市场）',
    barrier: '高',
    china: '高',
    tags: ['供应链', '制造业', 'AI优化'],
  },

  // ── 新增方向：AI Agent 安全与审计 ──────────────────────────────────────
  {
    id: 16,
    industry: 'dev-tools',
    title: 'AI Agent / MCP 工具安全网关与审计',
    signal: '🔥 热点',
    signalDate: '2026-04',
    summary: 'Vercel 被第三方 AI 工具入侵事件（2026-04-20）验证了 Agent 工具链安全的紧迫性。YC W26 批次已有 12 家 MCP 安全相关创业公司。企业需要对 AI Agent 的每次外部工具调用进行审计、沙箱隔离和意图验证。',
    opportunity: '国内大厂 AI Agent 部署加速，但 Agent 安全审计工具空白。金融/政务场景合规要求天然产生付费意愿。',
    overseas: [
      { name: 'AgentOps', url: 'https://agentops.ai', desc: 'Agent 可观测性平台，YC W24' },
      { name: 'Invariant Labs', url: 'https://invariantlabs.ai', desc: 'Agent 安全测试，a16z 投资' },
      { name: 'ToolGuard', url: 'https://toolguard.dev', desc: 'MCP 安全网关，YC W26' },
    ],
    market: '$8B（AI 安全市场 2026，Gartner 预测）',
    barrier: '中',
    china: '高',
    tags: ['Agent安全', 'MCP', 'DevSecOps', '审计'],
  },

  // ── 新增方向：AI 深度研究工具 ──────────────────────────────────────────
  {
    id: 17,
    industry: 'enterprise',
    title: 'AI 深度研究工具（知识工作者的 AI 同事）',
    signal: '🔥🔥 爆发',
    signalDate: '2026-04-29',
    summary: 'Gemini 3.1 Pro 深度研究代理、OpenAI Deep Research、Perplexity Deep Research 三大巨头同台竞技，验证了深度研究 Agent 的市场需求。Perplexity 完成 $5 亿 D 轮融资（估值 $140 亿，2026-04-26），月活超 1 亿。咨询顾问、研究员、分析师等职业的初级工作（文献综述、市场调研）将被大幅自动化。', 
    opportunity: '国内咨询/投研/法律/医疗等知识密集型行业对深度研究工具需求旺盛，但现有产品均为海外产品，数据合规和中文语料质量是本土玩家的核心壁垒。',
    overseas: [
      { name: 'Perplexity', url: 'https://perplexity.ai', desc: 'AI 搜索+深度研究，估值 $9B' },
      { name: 'Elicit', url: 'https://elicit.com', desc: '学术研究 AI 助手，专注论文分析' },
      { name: 'Consensus', url: 'https://consensus.app', desc: '科学文献 AI 搜索' },
    ],
    market: '$30B+（知识工作者工具市场）',
    barrier: '高',
    china: '高',
    tags: ['深度研究', 'AI Agent', '知识工作', '咨询'],
  },

  // ── 新增方向：端侧 AI 手机模型 ────────────────────────────────────────
  {
    id: 18,
    industry: 'consumer',
    title: '端侧 AI 手机模型（离线智能的下一个战场）',
    signal: '🔥 热点',
    signalDate: '2026-04-29',
    summary: 'Qwen3-0.6B/1.7B/4B 系列（2026-04-29 开源）专为端侧优化，Apache 2.0 协议可商业化。苹果 Apple Intelligence、三星 Galaxy AI、华为盘古端侧版均已落地。端侧 AI 模型正在成为高端手机的核心差异化卖点，数据隐私和离线能力是驱动因素。Llama 4 Scout 17B 激活参数单卡 H100 可跑，进一步降低端侧部署门槛。', 
    opportunity: '国内手机厂商（小米/OPPO/vivo）均有端侧 AI 布局，但模型能力参差不齐。专注手机 NPU 优化的小参数模型（1B-7B）是高价值细分赛道，与手机厂商深度合作可获得稳定收入。',
    overseas: [
      { name: 'Apple Intelligence', url: 'https://apple.com/apple-intelligence/', desc: '苹果端侧 AI，深度集成 iOS' },
      { name: 'Qualcomm AI Hub', url: 'https://aihub.qualcomm.com', desc: '骁龙 NPU 模型优化平台' },
      { name: 'MediaTek NeuroPilot', url: 'https://neuropilot.mediatek.com', desc: '联发科端侧 AI 平台' },
    ],
    market: '$20B+（AI 手机市场，IDC 2026 预测）',
    barrier: '高',
    china: '高',
    tags: ['端侧AI', '手机', 'NPU', '离线推理'],
  },
  // ── 新增方向：开源大模型 API 商业化平台 ────────────────────────────────
  {
    id: 19,
    industry: 'enterprise',
    title: '开源大模型 API 商业化平台（自部署 + 托管的中间层）',
    signal: '🔥🔥 爆发',
    signalDate: '2026-04-29',
    summary: 'Qwen3 全系列开源（Apache 2.0）+ Llama 4 Scout 开源，开源模型能力已接近闭源旗舰。但企业自部署门槛高（需要 GPU 集群、运维团队），催生了"开源模型托管 API"这一中间层市场。字节豆包 API 降价 80%、阿里云 DashScope 降价 60%，验证了"开源引流+云端变现"的商业模式可行性。国内中小企业需要低门槛、合规、中文优化的开源模型 API 服务。',
    opportunity: '国内中小企业（10-500人）有 AI 需求但无法自建 GPU 集群，需要"开箱即用的开源模型 API"。本土玩家可在数据合规（数据不出境）、中文优化、行业微调三个维度建立差异化壁垒。',
    overseas: [
      { name: 'Together AI', url: 'https://together.ai', desc: '开源模型托管 API，估值 $1.25B' },
      { name: 'Replicate', url: 'https://replicate.com', desc: '开源模型一键部署平台' },
      { name: 'Groq', url: 'https://groq.com', desc: '超低延迟开源模型推理，LPU 芯片' },
    ],
    market: '$15B+（AI API 服务市场，2026 预测）',
    barrier: '中',
    china: '高',
    tags: ['开源模型', 'API平台', '云服务', '中间层'],
  },
];

// ─── 子组件 ──────────────────────────────────────────────────────────────────

const BARRIER_COLOR = { '低': '#3fb950', '中': '#ffa657', '高': '#e17055' };
const CHINA_COLOR   = { '低': '#e17055', '中': '#ffa657', '高': '#3fb950' };

function IdeaCard({ idea, industryColor }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      {/* 顶部色条 */}
      <div className="h-1" style={{ background: industryColor }} />

      <div className="p-5">
        {/* 标题行 */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="text-sm font-bold text-gray-900 leading-snug">{idea.title}</h3>
          <span className={`flex-shrink-0 text-[10px] px-2 py-0.5 rounded-full font-medium ${
            idea.signal === '🔥 热点'
              ? 'bg-red-50 text-red-600 border border-red-100'
              : 'bg-blue-50 text-blue-600 border border-blue-100'
          }`}>
            {idea.signal}
          </span>
        </div>

        {/* 摘要 */}
        <p className="text-xs text-gray-500 leading-relaxed mb-3">{idea.summary}</p>

        {/* 指标行 */}
        <div className="flex items-center gap-3 mb-3 text-[11px]">
          <span className="text-gray-400">市场规模：<span className="text-gray-700 font-medium">{idea.market}</span></span>
          <span className="text-gray-300">|</span>
          <span className="text-gray-400">进入壁垒：
            <span className="font-semibold" style={{ color: BARRIER_COLOR[idea.barrier] }}>{idea.barrier}</span>
          </span>
          <span className="text-gray-300">|</span>
          <span className="text-gray-400">中国机会：
            <span className="font-semibold" style={{ color: CHINA_COLOR[idea.china] }}>{idea.china}</span>
          </span>
        </div>

        {/* 标签 */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {idea.tags.map(tag => (
            <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-50 text-gray-500 border border-gray-100">
              {tag}
            </span>
          ))}
        </div>

        {/* 展开按钮 */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-[11px] text-gray-400 hover:text-gray-600 flex items-center gap-1 transition-colors"
        >
          <svg className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          {expanded ? '收起' : '查看海外对标 & 中国机会'}
        </button>

        {/* 展开内容 */}
        {expanded && (
          <div className="mt-4 space-y-3 border-t border-gray-50 pt-4">
            {/* 海外对标 */}
            <div>
              <div className="text-[11px] font-semibold text-gray-500 mb-2">🌍 海外已有玩家</div>
              <div className="space-y-1.5">
                {idea.overseas.map(co => (
                  <div key={co.name} className="flex items-start gap-2">
                    <span className="text-[11px] font-semibold text-[#6c5ce7] min-w-[80px]">{co.name}</span>
                    <span className="text-[11px] text-gray-400">{co.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 中国机会 */}
            <div className="p-3 rounded-xl bg-green-50/60 border border-green-100/60">
              <div className="text-[11px] font-semibold text-green-700 mb-1">🇨🇳 中国机会窗口</div>
              <p className="text-[11px] text-green-800 leading-relaxed">{idea.opportunity}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── 主组件 ──────────────────────────────────────────────────────────────────

export default function IdeaRadar() {
  const [activeIndustry, setActiveIndustry] = useState('all');
  const [signalFilter, setSignalFilter] = useState('all');
  const [chinaFilter, setChinaFilter] = useState('all');

  const filtered = IDEAS.filter(idea => {
    if (activeIndustry !== 'all' && idea.industry !== activeIndustry) return false;
    if (signalFilter === 'hot' && idea.signal !== '🔥 热点') return false;
    if (signalFilter === 'watch' && idea.signal !== '👀 关注') return false;
    if (chinaFilter === 'high' && idea.china !== '高') return false;
    return true;
  });

  const getIndustryColor = (key) => INDUSTRIES.find(i => i.key === key)?.color || '#6c5ce7';

  return (
    <div>
      {/* 筛选栏 */}
      <div className="flex flex-wrap gap-3 mb-6">
        {/* 行业筛选 */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-gray-400 mr-1">行业：</span>
          <button
            onClick={() => setActiveIndustry('all')}
            className={`text-xs px-3 py-1 rounded-full border transition-all ${
              activeIndustry === 'all'
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
            }`}
          >
            全部
          </button>
          {INDUSTRIES.map(ind => (
            <button
              key={ind.key}
              onClick={() => setActiveIndustry(ind.key)}
              className={`text-xs px-3 py-1 rounded-full border transition-all ${
                activeIndustry === ind.key
                  ? 'text-white border-transparent'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
              }`}
              style={activeIndustry === ind.key ? { background: ind.color, borderColor: ind.color } : {}}
            >
              {ind.icon} {ind.label}
            </button>
          ))}
        </div>

        {/* 信号筛选 */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-400 mr-1">信号：</span>
          {[
            { key: 'all', label: '全部' },
            { key: 'hot', label: '🔥 热点' },
            { key: 'watch', label: '👀 关注' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setSignalFilter(f.key)}
              className={`text-xs px-3 py-1 rounded-full border transition-all ${
                signalFilter === f.key
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* 中国机会筛选 */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-400 mr-1">中国机会：</span>
          <button
            onClick={() => setChinaFilter('all')}
            className={`text-xs px-3 py-1 rounded-full border transition-all ${
              chinaFilter === 'all'
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
            }`}
          >
            全部
          </button>
          <button
            onClick={() => setChinaFilter('high')}
            className={`text-xs px-3 py-1 rounded-full border transition-all ${
              chinaFilter === 'high'
                ? 'bg-green-600 text-white border-green-600'
                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
            }`}
          >
            🇨🇳 高机会
          </button>
        </div>
      </div>

      {/* 结果数 */}
      <div className="text-xs text-gray-400 mb-4">
        共 <span className="font-semibold text-gray-700">{filtered.length}</span> 个创业方向
        {activeIndustry !== 'all' && (
          <span className="ml-2">· {INDUSTRIES.find(i => i.key === activeIndustry)?.label}</span>
        )}
      </div>

      {/* 卡片网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(idea => (
          <IdeaCard
            key={idea.id}
            idea={idea}
            industryColor={getIndustryColor(idea.industry)}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400 text-sm">
          暂无符合条件的创业方向
        </div>
      )}

      {/* 底部说明 */}
      <div className="mt-10 p-4 bg-amber-50/60 rounded-2xl border border-amber-100 text-xs text-amber-700 leading-relaxed">
        <span className="font-semibold">📌 说明：</span>
        本模块综合软件、游戏、硬件行业国内外每日新闻，提炼可行创业方向。
        「海外对标」列出已有玩家供参考，「中国机会」分析本土化可行性。
        数据每月人工更新，信号标注参考近期行业声浪。
        <span className="font-semibold ml-1">进入壁垒</span>：低=快速验证，中=需要资源积累，高=需要深厚护城河。
      </div>
    </div>
  );
}
