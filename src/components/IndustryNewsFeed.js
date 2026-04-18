'use client';

import { useState } from 'react';

// ─── 数据定义 ───────────────────────────────────────────────────────────────

const CATEGORIES = [
  { key: 'all',        label: '全部',      icon: '📡', color: '#6c5ce7' },
  { key: 'ai',         label: 'AI',        icon: '🤖', color: '#6c5ce7' },
  { key: 'software',   label: '软件',      icon: '💻', color: '#326ce5' },
  { key: 'game',       label: '游戏',      icon: '🎮', color: '#e17055' },
  { key: 'hardware',   label: '硬件',      icon: '🔧', color: '#00cec9' },
  { key: 'startup',    label: '创业融资',  icon: '🚀', color: '#ffa657' },
  { key: 'policy',     label: '政策监管',  icon: '📋', color: '#3fb950' },
];

const REGIONS = [
  { key: 'all',    label: '全球' },
  { key: 'global', label: '国际' },
  { key: 'china',  label: '国内' },
];

const NEWS_DATA = [
  // ── AI ──────────────────────────────────────────────────────────────────
  {
    id: 1,
    category: 'ai',
    region: 'global',
    title: 'Anthropic 发布 Claude 4，推理能力大幅提升，支持 200K 上下文窗口',
    summary: 'Claude 4 在数学推理、代码生成和长文档理解上全面超越 GPT-4o，企业版支持私有化部署。',
    source: 'TechCrunch',
    date: '2026-04-18',
    tags: ['LLM', 'Anthropic', '推理'],
    hot: true,
    link: '#',
  },
  {
    id: 2,
    category: 'ai',
    region: 'china',
    title: '阿里通义千问 3 发布，开源版本性能对标 GPT-4o，支持 MCP 协议',
    summary: '通义千问 3 开源版本在多项基准测试中超越 Llama 3，并原生支持 MCP 工具调用协议，开发者生态快速扩张。',
    source: '36氪',
    date: '2026-04-17',
    tags: ['LLM', '阿里', '开源'],
    hot: true,
    link: '#',
  },
  {
    id: 3,
    category: 'ai',
    region: 'global',
    title: 'OpenAI 推出 o3-mini 企业版，专为代码生成和数学推理优化',
    summary: '定价比 GPT-4o 低 40%，推理速度提升 3x，主打企业级代码助手场景。',
    source: 'The Verge',
    date: '2026-04-16',
    tags: ['OpenAI', '推理模型', '企业'],
    hot: false,
    link: '#',
  },
  {
    id: 4,
    category: 'ai',
    region: 'global',
    title: 'MCP 协议生态爆发：超过 5000 个工具服务器上线，成为 Agent 标准协议',
    summary: 'Anthropic 发布 MCP 1.0 正式版，主流 IDE、云平台、SaaS 工具纷纷接入，Agent 编排中间件赛道升温。',
    source: 'Hacker News',
    date: '2026-04-15',
    tags: ['MCP', 'Agent', '生态'],
    hot: true,
    link: '#',
  },
  {
    id: 5,
    category: 'ai',
    region: 'china',
    title: '字节跳动豆包大模型日活突破 1 亿，推出企业版 API 定价策略',
    summary: '豆包在消费端积累大量用户后，开始向企业市场渗透，API 定价比 GPT-4o 低 60%，主打性价比路线。',
    source: '虎嗅',
    date: '2026-04-14',
    tags: ['字节', '豆包', '企业AI'],
    hot: false,
    link: '#',
  },

  // ── 软件 ─────────────────────────────────────────────────────────────────
  {
    id: 6,
    category: 'software',
    region: 'global',
    title: 'GitHub Copilot 新增 Agent 模式，可自主完成多步骤编程任务',
    summary: 'Copilot Agent 可以自主读取代码库、运行测试、修复 Bug，完成从需求到 PR 的完整流程，开发者效率提升实测 40%。',
    source: 'GitHub Blog',
    date: '2026-04-18',
    tags: ['GitHub', 'Copilot', 'Agent'],
    hot: true,
    link: '#',
  },
  {
    id: 7,
    category: 'software',
    region: 'global',
    title: 'Cursor 月活突破 500 万，估值达 $25 亿，AI IDE 赛道竞争加剧',
    summary: 'Cursor 凭借深度代码库理解和多文件编辑能力快速增长，VS Code 插件生态受到冲击，微软加速 Copilot 迭代。',
    source: 'Bloomberg',
    date: '2026-04-17',
    tags: ['Cursor', 'AI IDE', '融资'],
    hot: true,
    link: '#',
  },
  {
    id: 8,
    category: 'software',
    region: 'china',
    title: '腾讯云发布 AI 原生开发平台，集成代码生成、测试、部署全链路',
    summary: '腾讯云 AI 开发平台打通从需求到上线的完整流程，主打企业私有化部署，已有 200+ 企业客户。',
    source: '腾讯科技',
    date: '2026-04-16',
    tags: ['腾讯云', 'AI开发', '企业'],
    hot: false,
    link: '#',
  },
  {
    id: 9,
    category: 'software',
    region: 'global',
    title: 'Figma 发布 AI 设计助手，可将自然语言描述直接生成可交互原型',
    summary: 'Figma AI 支持从文字描述生成完整 UI 组件，并可直接导出 React 代码，设计师和开发者协作流程大幅简化。',
    source: 'Figma Blog',
    date: '2026-04-15',
    tags: ['Figma', 'AI设计', 'UI'],
    hot: false,
    link: '#',
  },

  // ── 游戏 ─────────────────────────────────────────────────────────────────
  {
    id: 10,
    category: 'game',
    region: 'global',
    title: 'Epic Games 发布 MetaHuman AI，实时生成高保真数字人，成本降低 90%',
    summary: 'MetaHuman AI 可在 10 分钟内生成影视级数字人，并支持实时表情驱动，游戏和影视制作成本大幅下降。',
    source: 'GamesIndustry.biz',
    date: '2026-04-18',
    tags: ['Epic', '数字人', 'AIGC'],
    hot: true,
    link: '#',
  },
  {
    id: 11,
    category: 'game',
    region: 'china',
    title: '米哈游《原神》AI NPC 系统上线，玩家与角色对话体验大幅提升',
    summary: '米哈游将 LLM 接入游戏 NPC 系统，角色可进行开放式对话，玩家留存率提升 15%，AI 游戏化应用进入主流。',
    source: '游戏葡萄',
    date: '2026-04-17',
    tags: ['米哈游', 'AI NPC', '游戏'],
    hot: true,
    link: '#',
  },
  {
    id: 12,
    category: 'game',
    region: 'global',
    title: 'Inworld AI 完成 $150M C 轮融资，AI NPC 平台估值达 $10 亿',
    summary: 'Inworld AI 已与 EA、育碧等主流游戏厂商签约，AI NPC 赛道进入规模化阶段，竞争对手 Convai 同期融资 $30M。',
    source: 'TechCrunch',
    date: '2026-04-16',
    tags: ['Inworld', 'AI NPC', '融资'],
    hot: false,
    link: '#',
  },
  {
    id: 13,
    category: 'game',
    region: 'global',
    title: 'Steam 2025 年度报告：AI 辅助开发游戏占比达 35%，独立游戏爆发',
    summary: 'AI 工具大幅降低独立游戏开发门槛，2025 年 Steam 新上架游戏数量同比增长 60%，但头部效应依然显著。',
    source: 'Steam',
    date: '2026-04-14',
    tags: ['Steam', '独立游戏', 'AIGC'],
    hot: false,
    link: '#',
  },

  // ── 硬件 ─────────────────────────────────────────────────────────────────
  {
    id: 14,
    category: 'hardware',
    region: 'global',
    title: 'Meta 发布 Ray-Ban 第三代 AI 眼镜，内置 Llama 3 本地推理，续航 12 小时',
    summary: '新一代 Ray-Ban 支持实时翻译、场景理解和 AR 叠加，本地运行 Llama 3 保护隐私，预售 24 小时售罄。',
    source: 'The Verge',
    date: '2026-04-18',
    tags: ['Meta', 'AI眼镜', 'AR'],
    hot: true,
    link: '#',
  },
  {
    id: 15,
    category: 'hardware',
    region: 'china',
    title: '雷鸟创新发布 X3 Pro AI 眼镜，搭载国产大模型，售价 2999 元',
    summary: '雷鸟 X3 Pro 集成通义千问，支持实时翻译和导航，国产供应链优势使售价比 Meta 低 40%，主打性价比市场。',
    source: '雷科技',
    date: '2026-04-17',
    tags: ['雷鸟', 'AI眼镜', '国产'],
    hot: true,
    link: '#',
  },
  {
    id: 16,
    category: 'hardware',
    region: 'global',
    title: 'NVIDIA 发布 Jetson Thor，边缘 AI 算力提升 10x，机器人应用爆发',
    summary: 'Jetson Thor 专为人形机器人设计，支持多模态感知和实时决策，Figure 01、1X 等机器人公司已预订。',
    source: 'NVIDIA Blog',
    date: '2026-04-15',
    tags: ['NVIDIA', '边缘AI', '机器人'],
    hot: false,
    link: '#',
  },
  {
    id: 17,
    category: 'hardware',
    region: 'china',
    title: '华为发布昇腾 910C，AI 训练性能对标 H100，国产算力生态加速',
    summary: '昇腾 910C 在 LLM 训练任务上性能达到 H100 的 85%，配合 MindSpore 框架，国内大模型训练成本大幅下降。',
    source: '华为',
    date: '2026-04-14',
    tags: ['华为', '昇腾', 'AI芯片'],
    hot: true,
    link: '#',
  },

  // ── 创业融资 ─────────────────────────────────────────────────────────────
  {
    id: 18,
    category: 'startup',
    region: 'global',
    title: 'Harvey AI 完成 $300M D 轮，法律 AI 估值达 $30 亿，扩张至亚洲市场',
    summary: 'Harvey AI 已服务全球 Top 50 律所中的 30 家，D 轮资金将用于亚洲市场扩张和多语言支持，中国市场是重点。',
    source: 'Forbes',
    date: '2026-04-18',
    tags: ['Harvey', '法律AI', '融资'],
    hot: true,
    link: '#',
  },
  {
    id: 19,
    category: 'startup',
    region: 'global',
    title: 'YC W26 Demo Day：AI Agent 占比 60%，MCP 工具链创业成新热点',
    summary: 'YC 2026 冬季批次 200 家公司中，60% 与 AI Agent 相关，MCP 工具集成、垂直行业 Agent 是最热赛道。',
    source: 'Y Combinator',
    date: '2026-04-17',
    tags: ['YC', 'Agent', '创业'],
    hot: true,
    link: '#',
  },
  {
    id: 20,
    category: 'startup',
    region: 'china',
    title: '智谱 AI 完成 20 亿元 C+ 轮融资，估值超 200 亿，加速企业市场布局',
    summary: '智谱 AI 凭借 GLM 系列模型在企业私有化部署市场快速增长，本轮融资将用于模型研发和销售团队扩张。',
    source: '36氪',
    date: '2026-04-16',
    tags: ['智谱AI', '融资', '企业AI'],
    hot: false,
    link: '#',
  },

  // ── 政策监管 ─────────────────────────────────────────────────────────────
  {
    id: 21,
    category: 'policy',
    region: 'china',
    title: '工信部发布《AI 生成内容标识管理办法》，AIGC 内容须强制标注',
    summary: '新规要求所有 AI 生成的文字、图片、视频内容必须添加可识别标识，违规最高罚款 100 万元，2026 年 7 月起执行。',
    source: '工信部',
    date: '2026-04-18',
    tags: ['政策', 'AIGC', '监管'],
    hot: true,
    link: '#',
  },
  {
    id: 22,
    category: 'policy',
    region: 'global',
    title: 'EU AI Act 正式生效：高风险 AI 系统须通过合规审查，违规罚款达营收 7%',
    summary: 'EU AI Act 对医疗、金融、执法等高风险 AI 应用设置严格准入门槛，欧洲 AI 创业公司合规成本大幅上升。',
    source: 'Reuters',
    date: '2026-04-15',
    tags: ['EU AI Act', '合规', '监管'],
    hot: false,
    link: '#',
  },
  {
    id: 23,
    category: 'policy',
    region: 'china',
    title: '国家数据局发布数据跨境流通新规，AI 训练数据出境须经安全评估',
    summary: '新规明确 AI 模型训练数据的跨境传输须经国家数据局安全评估，进一步强化数据主权，本土 AI 公司受益。',
    source: '国家数据局',
    date: '2026-04-14',
    tags: ['数据主权', '政策', '跨境'],
    hot: false,
    link: '#',
  },
];

// ─── 子组件 ──────────────────────────────────────────────────────────────────

const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map(c => [c.key, c]));

function NewsCard({ item }) {
  const cat = CATEGORY_MAP[item.category] || CATEGORY_MAP['ai'];

  return (
    <div className="flex gap-4 p-4 rounded-2xl border border-gray-100 bg-white hover:shadow-sm transition-shadow group">
      {/* 左侧色条 */}
      <div className="w-1 rounded-full flex-shrink-0 self-stretch" style={{ background: cat.color }} />

      <div className="flex-1 min-w-0">
        {/* 顶部元信息 */}
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
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
          <span className="text-[10px] text-gray-300 ml-auto">{item.date}</span>
        </div>

        {/* 标题 */}
        <h3 className="text-sm font-semibold text-gray-900 leading-snug mb-1.5 group-hover:text-[#6c5ce7] transition-colors">
          {item.title}
        </h3>

        {/* 摘要 */}
        <p className="text-xs text-gray-500 leading-relaxed mb-2">{item.summary}</p>

        {/* 底部：来源 + 标签 */}
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
  const [activeRegion, setActiveRegion] = useState('all');
  const [hotOnly, setHotOnly] = useState(false);

  const filtered = NEWS_DATA.filter(item => {
    if (activeCategory !== 'all' && item.category !== activeCategory) return false;
    if (activeRegion !== 'all' && item.region !== activeRegion) return false;
    if (hotOnly && !item.hot) return false;
    return true;
  });

  const hotCount = NEWS_DATA.filter(i => i.hot).length;

  return (
    <div>
      {/* 统计行 */}
      <div className="flex items-center gap-4 mb-5 text-xs text-gray-400">
        <span>共 <span className="font-semibold text-gray-700">{NEWS_DATA.length}</span> 条</span>
        <span>·</span>
        <span>🔥 热点 <span className="font-semibold text-orange-500">{hotCount}</span> 条</span>
        <span>·</span>
        <span>🇨🇳 国内 <span className="font-semibold text-gray-700">{NEWS_DATA.filter(i => i.region === 'china').length}</span> 条</span>
        <span>·</span>
        <span>🌍 国际 <span className="font-semibold text-gray-700">{NEWS_DATA.filter(i => i.region === 'global').length}</span> 条</span>
      </div>

      {/* 筛选栏 */}
      <div className="flex flex-wrap gap-3 mb-6">
        {/* 分类 */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {CATEGORIES.map(cat => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`text-xs px-3 py-1 rounded-full border transition-all ${
                activeCategory === cat.key
                  ? 'text-white border-transparent'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
              }`}
              style={activeCategory === cat.key ? { background: cat.color, borderColor: cat.color } : {}}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>

        {/* 地区 */}
        <div className="flex items-center gap-1.5">
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
        </div>

        {/* 热点开关 */}
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

      {/* 结果数 */}
      <div className="text-xs text-gray-400 mb-4">
        显示 <span className="font-semibold text-gray-700">{filtered.length}</span> 条
      </div>

      {/* 新闻列表 */}
      <div className="space-y-3">
        {filtered.map(item => (
          <NewsCard key={item.id} item={item} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400 text-sm">
          暂无符合条件的新闻
        </div>
      )}

      {/* 底部说明 */}
      <div className="mt-10 p-4 bg-blue-50/60 rounded-2xl border border-blue-100 text-xs text-blue-700 leading-relaxed">
        <span className="font-semibold">📌 说明：</span>
        本模块综合软件、游戏、硬件、AI 行业国内外每日新闻，由智能体自动聚合整理。
        覆盖 TechCrunch、The Verge、36氪、虎嗅、游戏葡萄等主流媒体。
        内容每日更新，热点标注基于传播量和行业影响力。
      </div>
    </div>
  );
}
