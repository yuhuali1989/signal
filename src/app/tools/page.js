'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Footer from '@/components/Footer';

// ─── Prompt 模板库 ────────────────────────────────────────────
const PROMPT_TEMPLATES = [
  {
    id: 'cot',
    category: '推理',
    name: 'Chain-of-Thought（思维链）',
    desc: '引导模型逐步推理，显著提升复杂问题准确率',
    icon: '🧠',
    color: '#6c5ce7',
    template: `请一步一步地思考以下问题，展示完整的推理过程，最后给出答案。

问题：{{问题}}

推理步骤：
1. 首先，我需要理解...
2. 接着分析...
3. 因此...

最终答案：`,
  },
  {
    id: 'rag',
    category: 'RAG',
    name: 'RAG 检索增强生成',
    desc: '基于给定上下文文档回答问题，减少幻觉',
    icon: '📄',
    color: '#00b894',
    template: `你是一个专业助手。请仅根据以下提供的上下文信息来回答问题，不要使用你的训练知识。如果上下文中没有足够信息，请明确说明。

<context>
{{检索到的文档内容}}
</context>

问题：{{用户问题}}

基于上下文的回答：`,
  },
  {
    id: 'react',
    category: 'Agent',
    name: 'ReAct 推理-行动',
    desc: '交替进行思考和行动，适合工具调用和 Agent 场景',
    icon: '🤖',
    color: '#0984e3',
    template: `你是一个能够使用工具解决问题的 AI 助手。按照以下格式交替进行思考和行动：

思考：分析当前状态和下一步需要做什么
行动：选择一个工具并执行
观察：工具返回的结果
...（重复直到得出最终答案）
最终答案：综合所有观察给出结论

可用工具：{{工具列表}}

任务：{{任务描述}}

思考：`,
  },
  {
    id: 'structured_output',
    category: '输出格式',
    name: 'JSON 结构化输出',
    desc: '强制模型输出符合 Schema 的 JSON，适合下游程序处理',
    icon: '{}',
    color: '#e17055',
    template: `请分析以下内容，并严格按照 JSON 格式输出结果，不要包含任何额外的文字说明。

输入：{{待分析内容}}

请输出以下 JSON 格式：
{
  "summary": "一句话摘要",
  "key_points": ["要点1", "要点2", "要点3"],
  "sentiment": "positive | neutral | negative",
  "confidence": 0.0-1.0,
  "tags": ["标签1", "标签2"]
}`,
  },
  {
    id: 'few_shot',
    category: '推理',
    name: 'Few-Shot 示例学习',
    desc: '提供少量示例引导模型理解任务格式和期望输出',
    icon: '📌',
    color: '#fdcb6e',
    template: `请参考以下示例完成任务：

示例 1：
输入：{{示例输入1}}
输出：{{示例输出1}}

示例 2：
输入：{{示例输入2}}
输出：{{示例输出2}}

示例 3：
输入：{{示例输入3}}
输出：{{示例输出3}}

现在请处理：
输入：{{实际输入}}
输出：`,
  },
  {
    id: 'system_persona',
    category: '角色设定',
    name: '专家角色 System Prompt',
    desc: '设定模型角色和专业背景，提升垂直领域回答质量',
    icon: '👤',
    color: '#a29bfe',
    template: `你是一位资深的{{领域}}专家，拥有{{年数}}年从业经验。你的专长包括{{专长列表}}。

在回答时，你应该：
- 使用专业但易懂的语言
- 引用具体案例和数据支持观点
- 指出常见误区和注意事项
- 在不确定时明确说明

背景：{{用户背景或项目信息}}

请回答：{{问题}}`,
  },
  {
    id: 'summarize',
    category: '文本处理',
    name: '分层摘要',
    desc: '按不同粒度生成摘要，适合长文档处理',
    icon: '✂️',
    color: '#55efc4',
    template: `请对以下文本生成三个层次的摘要：

<text>
{{待摘要的文本}}
</text>

1. 一句话摘要（≤30字）：

2. 段落摘要（100-150字）：

3. 要点列表（5-7个关键点）：
   • 
   • 
   • `,
  },
  {
    id: 'code_review',
    category: '代码',
    name: '代码审查',
    desc: '系统化审查代码质量、安全性和可维护性',
    icon: '🔍',
    color: '#74b9ff',
    template: `请对以下代码进行全面审查，重点关注：

\`\`\`{{语言}}
{{代码}}
\`\`\`

请从以下维度分析：

**🐛 Bug 与逻辑问题**
（列出潜在 bug 和逻辑错误）

**🔒 安全性**
（SQL 注入、XSS、未校验输入等）

**⚡ 性能**
（时间复杂度、内存使用、可优化点）

**📖 可读性 & 可维护性**
（命名、注释、代码结构）

**✅ 改进建议**
（优先级排序的具体改进项）`,
  },
];

const PROMPT_CATEGORIES = ['全部', '推理', 'RAG', 'Agent', '输出格式', '角色设定', '文本处理', '代码'];

// ─── MCP Server 目录数据 ──────────────────────────────────────
const MCP_SERVERS = [
  {
    id: 'filesystem',
    name: 'Filesystem',
    repo: 'modelcontextprotocol/servers',
    path: 'src/filesystem',
    category: '文件系统',
    stars: '14k+',
    desc: '读写本地文件系统，支持目录遍历、文件搜索、内容读写',
    url: 'https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem',
    badge: '官方',
    badgeColor: '#6c5ce7',
  },
  {
    id: 'github',
    name: 'GitHub',
    repo: 'modelcontextprotocol/servers',
    path: 'src/github',
    category: '代码托管',
    stars: '14k+',
    desc: '操作 GitHub 仓库：搜索代码、读取文件、创建 Issue/PR、管理 Workflow',
    url: 'https://github.com/modelcontextprotocol/servers/tree/main/src/github',
    badge: '官方',
    badgeColor: '#6c5ce7',
  },
  {
    id: 'postgres',
    name: 'PostgreSQL',
    repo: 'modelcontextprotocol/servers',
    path: 'src/postgres',
    category: '数据库',
    stars: '14k+',
    desc: '连接 PostgreSQL 数据库，执行 SQL 查询，读取 Schema 信息',
    url: 'https://github.com/modelcontextprotocol/servers/tree/main/src/postgres',
    badge: '官方',
    badgeColor: '#6c5ce7',
  },
  {
    id: 'sqlite',
    name: 'SQLite',
    repo: 'modelcontextprotocol/servers',
    path: 'src/sqlite',
    category: '数据库',
    stars: '14k+',
    desc: '操作本地 SQLite 数据库，适合轻量级数据分析场景',
    url: 'https://github.com/modelcontextprotocol/servers/tree/main/src/sqlite',
    badge: '官方',
    badgeColor: '#6c5ce7',
  },
  {
    id: 'brave-search',
    name: 'Brave Search',
    repo: 'modelcontextprotocol/servers',
    path: 'src/brave-search',
    category: '搜索',
    stars: '14k+',
    desc: '调用 Brave Search API 进行网页搜索，支持本地搜索和新闻搜索',
    url: 'https://github.com/modelcontextprotocol/servers/tree/main/src/brave-search',
    badge: '官方',
    badgeColor: '#6c5ce7',
  },
  {
    id: 'puppeteer',
    name: 'Puppeteer',
    repo: 'modelcontextprotocol/servers',
    path: 'src/puppeteer',
    category: '浏览器',
    stars: '14k+',
    desc: '控制 Chromium 浏览器：截图、点击、填表、抓取动态页面内容',
    url: 'https://github.com/modelcontextprotocol/servers/tree/main/src/puppeteer',
    badge: '官方',
    badgeColor: '#6c5ce7',
  },
  {
    id: 'slack',
    name: 'Slack',
    repo: 'modelcontextprotocol/servers',
    path: 'src/slack',
    category: '通讯协作',
    stars: '14k+',
    desc: '读取 Slack 频道消息、发送消息、搜索历史记录',
    url: 'https://github.com/modelcontextprotocol/servers/tree/main/src/slack',
    badge: '官方',
    badgeColor: '#6c5ce7',
  },
  {
    id: 'google-maps',
    name: 'Google Maps',
    repo: 'modelcontextprotocol/servers',
    path: 'src/google-maps',
    category: '地图/位置',
    stars: '14k+',
    desc: '地点搜索、路线规划、地理编码，适合位置感知 Agent',
    url: 'https://github.com/modelcontextprotocol/servers/tree/main/src/google-maps',
    badge: '官方',
    badgeColor: '#6c5ce7',
  },
  {
    id: 'memory',
    name: 'Memory',
    repo: 'modelcontextprotocol/servers',
    path: 'src/memory',
    category: '记忆/知识图谱',
    stars: '14k+',
    desc: '基于知识图谱的持久化记忆，让 Agent 跨会话记住用户信息',
    url: 'https://github.com/modelcontextprotocol/servers/tree/main/src/memory',
    badge: '官方',
    badgeColor: '#6c5ce7',
  },
  {
    id: 'sequential-thinking',
    name: 'Sequential Thinking',
    repo: 'modelcontextprotocol/servers',
    path: 'src/sequentialthinking',
    category: '推理增强',
    stars: '14k+',
    desc: '结构化多步推理工具，引导模型分解复杂问题，适合规划类任务',
    url: 'https://github.com/modelcontextprotocol/servers/tree/main/src/sequentialthinking',
    badge: '官方',
    badgeColor: '#6c5ce7',
  },
  {
    id: 'context7',
    name: 'Context7',
    repo: 'upstash/context7',
    path: '',
    category: '文档检索',
    stars: '8k+',
    desc: '为 AI 编程助手提供最新的库文档，解决 LLM 知识截止问题，支持 npm/PyPI 包',
    url: 'https://github.com/upstash/context7',
    badge: '热门',
    badgeColor: '#e17055',
  },
  {
    id: 'firecrawl',
    name: 'Firecrawl',
    repo: 'mendableai/firecrawl-mcp-server',
    path: '',
    category: '网页抓取',
    stars: '5k+',
    desc: '高质量网页内容抓取，自动处理 JS 渲染、反爬虫，输出干净 Markdown',
    url: 'https://github.com/mendableai/firecrawl-mcp-server',
    badge: '热门',
    badgeColor: '#e17055',
  },
  {
    id: 'exa',
    name: 'Exa Search',
    repo: 'exa-labs/exa-mcp-server',
    path: '',
    category: '搜索',
    stars: '3k+',
    desc: '语义搜索引擎，专为 AI Agent 设计，返回高质量结构化结果',
    url: 'https://github.com/exa-labs/exa-mcp-server',
    badge: '推荐',
    badgeColor: '#00b894',
  },
  {
    id: 'desktop-commander',
    name: 'Desktop Commander',
    repo: 'wonderwhy-er/DesktopCommanderMCP',
    path: '',
    category: '系统控制',
    stars: '4k+',
    desc: '控制桌面应用、执行终端命令、管理进程，赋予 Agent 完整系统操作能力',
    url: 'https://github.com/wonderwhy-er/DesktopCommanderMCP',
    badge: '推荐',
    badgeColor: '#00b894',
  },
];

const MCP_CATEGORIES = ['全部', '文件系统', '数据库', '搜索', '浏览器', '代码托管', '通讯协作', '记忆/知识图谱', '推理增强', '文档检索', '网页抓取', '地图/位置', '系统控制'];

function MCPDirectory() {
  const [activeCategory, setActiveCategory] = useState('全部');
  const filtered = activeCategory === '全部' ? MCP_SERVERS : MCP_SERVERS.filter(s => s.category === activeCategory);

  return (
    <div>
      {/* 说明 */}
      <div className="mb-5 p-4 rounded-2xl border border-[#6c5ce7]/15 bg-[#6c5ce7]/[0.03] flex items-start gap-3">
        <span className="text-xl flex-shrink-0">🔌</span>
        <div>
          <p className="text-sm font-semibold text-gray-800 mb-0.5">MCP Server 生态目录</p>
          <p className="text-xs text-gray-500 leading-relaxed">
            Model Context Protocol（MCP）是 Anthropic 提出的开放协议，让 AI 助手能够安全地连接外部工具和数据源。
            以下收录了 <a href="https://github.com/modelcontextprotocol/servers" target="_blank" rel="noopener noreferrer" className="text-[#6c5ce7] hover:underline">官方仓库</a> 及社区高 star 的 MCP Server，持续更新。
          </p>
        </div>
      </div>

      {/* Category 筛选 */}
      <div className="flex flex-wrap gap-2 mb-5">
        {MCP_CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${activeCategory === cat ? 'bg-[#6c5ce7]/10 text-[#6c5ce7] border-[#6c5ce7]/30' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}>
            {cat}
          </button>
        ))}
      </div>

      {/* Server 列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map(server => (
          <a key={server.id} href={server.url} target="_blank" rel="noopener noreferrer"
            className="group block rounded-2xl border border-gray-100 bg-white p-4 hover:shadow-sm hover:border-gray-200 transition-all">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium text-gray-500 bg-gray-100 flex-shrink-0">{server.category}</span>
                <h3 className="text-sm font-semibold text-gray-800 truncate group-hover:text-[#6c5ce7] transition-colors">{server.name}</h3>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold text-white"
                  style={{ background: server.badgeColor }}>{server.badge}</span>
                <span className="text-[10px] text-gray-400">⭐ {server.stars}</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed mb-2">{server.desc}</p>
            <p className="text-[10px] font-mono text-gray-300 truncate">{server.repo}</p>
          </a>
        ))}
      </div>

      <p className="mt-4 text-center text-[11px] text-gray-400">
        更多 Server 见 <a href="https://github.com/modelcontextprotocol/servers" target="_blank" rel="noopener noreferrer" className="text-[#6c5ce7] hover:underline">github.com/modelcontextprotocol/servers</a> · 共 {MCP_SERVERS.length} 个已收录
      </p>
    </div>
  );
}



// ═══════════════════════════════════════════════════════════════
// Tab 4: Prompt 模板库
// ═══════════════════════════════════════════════════════════════
function PromptTemplates({ templates }) {
  const [activeCategory, setActiveCategory] = useState('全部');
  const [expandedId, setExpandedId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const filtered = activeCategory === '全部' ? templates : templates.filter(t => t.category === activeCategory);

  const handleCopy = (t) => {
    navigator.clipboard.writeText(t.template);
    setCopiedId(t.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div>
      {/* Category tabs */}
      <div className="flex flex-wrap gap-2 mb-5">
        {PROMPT_CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${activeCategory === cat ? 'bg-[#6c5ce7]/10 text-[#6c5ce7] border-[#6c5ce7]/30' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}>
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(t => (
          <div key={t.id} className="rounded-2xl border border-gray-100 bg-white hover:shadow-sm transition-all overflow-hidden">
            {/* Header */}
            <div className="p-4 pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-mono font-bold flex-shrink-0"
                    style={{ background: t.color + '18', color: t.color }}>
                    {t.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-gray-800 truncate">{t.name}</h3>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0"
                        style={{ background: t.color + '18', color: t.color }}>
                        {t.category}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{t.desc}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="px-4 pb-4 flex gap-2">
              <button onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}
                className="flex-1 py-1.5 text-xs font-medium text-gray-500 border border-gray-200 rounded-lg hover:border-gray-300 hover:text-gray-700 transition-all">
                {expandedId === t.id ? '收起 ▲' : '展开预览 ▼'}
              </button>
              <button onClick={() => handleCopy(t)}
                className="flex-1 py-1.5 text-xs font-medium rounded-lg transition-all"
                style={{ background: copiedId === t.id ? '#00b894' : t.color, color: '#fff' }}>
                {copiedId === t.id ? '✓ 已复制' : '一键复制'}
              </button>
            </div>

            {/* Expanded preview */}
            {expandedId === t.id && (
              <div className="border-t border-gray-100 mx-4 mb-4">
                <pre className="mt-3 text-[11px] leading-relaxed text-gray-600 whitespace-pre-wrap font-mono bg-gray-50 rounded-xl p-3 max-h-64 overflow-y-auto">
                  {t.template}
                </pre>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Tab 0: Tokenizer
// ═══════════════════════════════════════════════════════════════

// 彩色调色板（循环使用）
const TOKEN_COLORS = [
  { bg: '#e0f2fe', text: '#0369a1', border: '#bae6fd' },
  { bg: '#fce7f3', text: '#9d174d', border: '#fbcfe8' },
  { bg: '#dcfce7', text: '#166534', border: '#bbf7d0' },
  { bg: '#fef3c7', text: '#92400e', border: '#fde68a' },
  { bg: '#ede9fe', text: '#5b21b6', border: '#ddd6fe' },
  { bg: '#ffedd5', text: '#9a3412', border: '#fed7aa' },
  { bg: '#f0fdf4', text: '#14532d', border: '#bbf7d0' },
  { bg: '#fff1f2', text: '#9f1239', border: '#fecdd3' },
];

// 模型 → 编码方案映射（按模型家族分组）
const MODEL_GROUPS = [
  {
    group: 'OpenAI GPT-4o / o 系列',
    color: '#10a37f',
    models: [
      { id: 'gpt-4o',       label: 'GPT-4o',        enc: 'o200k_base', badge: '最新' },
      { id: 'gpt-4o-mini',  label: 'GPT-4o mini',   enc: 'o200k_base' },
      { id: 'o1',           label: 'o1',             enc: 'o200k_base', badge: '推理' },
      { id: 'o1-mini',      label: 'o1-mini',        enc: 'o200k_base' },
      { id: 'o3',           label: 'o3',             enc: 'o200k_base', badge: '推理' },
      { id: 'o3-mini',      label: 'o3-mini',        enc: 'o200k_base' },
    ],
  },
  {
    group: 'OpenAI GPT-4 / GPT-3.5',
    color: '#10a37f',
    models: [
      { id: 'gpt-4',        label: 'GPT-4',          enc: 'cl100k_base' },
      { id: 'gpt-4-turbo',  label: 'GPT-4 Turbo',    enc: 'cl100k_base' },
      { id: 'gpt-3.5-turbo',label: 'GPT-3.5 Turbo',  enc: 'cl100k_base' },
    ],
  },
  {
    group: 'Claude（Anthropic）',
    color: '#d4863a',
    models: [
      { id: 'claude-3-7-sonnet', label: 'Claude 3.7 Sonnet', enc: 'cl100k_base', badge: '近似' },
      { id: 'claude-3-5-sonnet', label: 'Claude 3.5 Sonnet', enc: 'cl100k_base', badge: '近似' },
      { id: 'claude-3-opus',     label: 'Claude 3 Opus',     enc: 'cl100k_base', badge: '近似' },
    ],
  },
  {
    group: 'Gemini（Google）',
    color: '#4285f4',
    models: [
      { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash', enc: 'o200k_base', badge: '近似' },
      { id: 'gemini-1.5-pro',   label: 'Gemini 1.5 Pro',   enc: 'cl100k_base', badge: '近似' },
    ],
  },
  {
    group: 'DeepSeek',
    color: '#1e40af',
    models: [
      { id: 'deepseek-v3',  label: 'DeepSeek-V3',   enc: 'cl100k_base', badge: '近似' },
      { id: 'deepseek-r1',  label: 'DeepSeek-R1',   enc: 'cl100k_base', badge: '近似' },
    ],
  },
  {
    group: 'Meta Llama',
    color: '#0064e0',
    models: [
      { id: 'llama-3',      label: 'Llama 3 系列',  enc: 'cl100k_base', badge: '近似' },
      { id: 'llama-2',      label: 'Llama 2 系列',  enc: 'p50k_base',   badge: '近似' },
    ],
  },
  {
    group: 'Qwen（阿里）',
    color: '#ff6a00',
    models: [
      { id: 'qwen2.5',      label: 'Qwen 2.5 系列', enc: 'cl100k_base', badge: '近似' },
      { id: 'qwen2',        label: 'Qwen 2 系列',   enc: 'cl100k_base', badge: '近似' },
    ],
  },
  {
    group: '原始编码方案',
    color: '#64748b',
    models: [
      { id: 'enc:cl100k_base', label: 'cl100k_base', enc: 'cl100k_base', badge: '编码' },
      { id: 'enc:o200k_base',  label: 'o200k_base',  enc: 'o200k_base',  badge: '编码' },
      { id: 'enc:p50k_base',   label: 'p50k_base',   enc: 'p50k_base',   badge: '编码' },
      { id: 'enc:r50k_base',   label: 'r50k_base',   enc: 'r50k_base',   badge: '编码' },
      { id: 'enc:gpt2',        label: 'gpt2',         enc: 'gpt2',        badge: '编码' },
    ],
  },
];

// 扁平化查找
const ALL_MODELS = MODEL_GROUPS.flatMap(g => g.models.map(m => ({ ...m, groupColor: g.color, groupName: g.group })));

const TOKENIZER_EXAMPLES = [
  { label: '中文句子', text: '大语言模型是人工智能领域的重要突破，今天的AI已经可以写代码、做推理。' },
  { label: '英文句子', text: 'The quick brown fox jumps over the lazy dog. Large language models have revolutionized NLP.' },
  { label: '代码片段', text: 'def hello_world():\n    print("Hello, World!")\n    return {"status": 200}' },
  { label: '中英混合', text: 'ChatGPT在推理能力方面有了显著提升（benchmark: MMLU 89.8%，GPQA Diamond 78.3%）' },
  { label: '特殊字符', text: '🚀 emoji & symbols: <|endoftext|> [INST] <<SYS>>\n\t spaces and\ttabs' },
  { label: 'JSON 结构', text: '{"model": "gpt-4o", "temperature": 0.7, "messages": [{"role": "user", "content": "你好"}]}' },
  { label: 'Prompt 模板', text: 'You are a helpful assistant. Please analyze the following text and provide a detailed summary:\n\n{{TEXT}}' },
  { label: '数学公式', text: 'The softmax function: σ(z)_i = e^{z_i} / Σ_j e^{z_j}, where z is the input vector.' },
];

function TokenizerTool() {
  const [text, setText] = useState('大语言模型是人工智能领域的重要突破，ChatGPT开创了新的交互范式。');
  const [selectedModelId, setSelectedModelId] = useState('gpt-4o');
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showIds, setShowIds] = useState(false);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const encCacheRef = useRef({});  // 缓存已加载的 encoder，避免重复 import

  const selectedModel = ALL_MODELS.find(m => m.id === selectedModelId) || ALL_MODELS[0];
  const encoding = selectedModel.enc;

  // 重新 tokenize（js-tiktoken 纯 JS，同步运行，无 wasm 等待）
  const tokenize = useCallback(async (inputText, enc) => {
    if (!inputText.trim()) { setTokens([]); return; }
    setLoading(true);
    setError('');
    try {
      let encoder = encCacheRef.current[enc];
      if (!encoder) {
        const { getEncoding } = await import('js-tiktoken');
        encoder = getEncoding(enc);
        encCacheRef.current[enc] = encoder;  // 缓存起来，切换模型秒切
      }

      const encoded = encoder.encode(inputText);

      // 逐 token 解码，将多字节 UTF-8 fragment 合并为完整字符
      const result = [];
      let colorIdx = 0;
      let pendingBytes = [];
      let pendingIds = [];

      const flushPending = () => {
        if (!pendingIds.length) return;
        const buf = new Uint8Array(pendingBytes);
        const decoded = new TextDecoder('utf-8', { fatal: false }).decode(buf);
        result.push({ id: pendingIds[0], text: decoded, colorIdx: colorIdx % TOKEN_COLORS.length });
        colorIdx++;
        pendingBytes = [];
        pendingIds = [];
      };

      for (let i = 0; i < encoded.length; i++) {
        const tokenId = encoded[i];
        const bytes = encoder.decode(new Uint32Array([tokenId]));
        const firstByte = bytes[0];
        const isStart = firstByte < 0x80 || firstByte >= 0xC0;
        if (isStart && pendingIds.length > 0) flushPending();
        pendingBytes.push(...bytes);
        pendingIds.push(tokenId);
        const testDecode = new TextDecoder('utf-8', { fatal: false }).decode(new Uint8Array(pendingBytes));
        if (!testDecode.includes('\uFFFD')) flushPending();
      }
      flushPending();

      setTokens(result);
    } catch (e) {
      setError('Tokenize 出错: ' + e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // 文本或编码改变时重新计算
  useEffect(() => {
    const timer = setTimeout(() => tokenize(text, encoding), 150);
    return () => clearTimeout(timer);
  }, [text, encoding, tokenize]);

  const uniqueTokenCount = tokens.length;
  const charCount = text.length;

  return (
    <div className="space-y-5">
      {/* 模型选择器 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs font-medium text-gray-600">选择模型</label>
          <button onClick={() => setShowModelPicker(!showModelPicker)}
            className="text-[10px] text-[#6c5ce7] hover:underline">
            {showModelPicker ? '收起' : '展开全部模型'}
          </button>
        </div>

        {/* 当前选中 + 快速切换热门 */}
        {!showModelPicker && (
          <div className="flex flex-wrap gap-2">
            {['gpt-4o', 'o3', 'claude-3-7-sonnet', 'gemini-2.0-flash', 'deepseek-r1', 'llama-3', 'qwen2.5'].map(mid => {
              const m = ALL_MODELS.find(x => x.id === mid);
              if (!m) return null;
              const isSelected = selectedModelId === mid;
              return (
                <button key={mid} onClick={() => setSelectedModelId(mid)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${isSelected
                    ? 'bg-[#6c5ce7]/10 border-[#6c5ce7]/30 text-[#6c5ce7]'
                    : 'bg-white border-gray-100 text-gray-500 hover:border-gray-200'}`}>
                  {m.label}
                  {m.badge && <span className={`ml-1.5 text-[9px] px-1 py-0.5 rounded-full ${
                    m.badge === '近似' ? 'bg-amber-50 text-amber-600' :
                    m.badge === '推理' ? 'bg-blue-50 text-blue-600' :
                    m.badge === '最新' ? 'bg-green-50 text-green-600' :
                    'bg-gray-100 text-gray-500'
                  }`}>{m.badge}</span>}
                </button>
              );
            })}
            <button onClick={() => setShowModelPicker(true)}
              className="px-3 py-1.5 rounded-xl border border-dashed border-gray-200 text-xs text-gray-400 hover:border-gray-300">
              更多…
            </button>
          </div>
        )}

        {/* 展开的完整模型列表（按家族分组） */}
        {showModelPicker && (
          <div className="space-y-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
            {MODEL_GROUPS.map(group => (
              <div key={group.group}>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5"
                  style={{ color: group.color }}>{group.group}</p>
                <div className="flex flex-wrap gap-1.5">
                  {group.models.map(m => {
                    const isSelected = selectedModelId === m.id;
                    return (
                      <button key={m.id} onClick={() => { setSelectedModelId(m.id); setShowModelPicker(false); }}
                        className={`px-2.5 py-1 rounded-lg border text-xs transition-all ${isSelected
                          ? 'border-[#6c5ce7]/30 text-[#6c5ce7] font-medium'
                          : 'bg-white border-gray-100 text-gray-500 hover:border-gray-200'}`}
                        style={isSelected ? { background: group.color + '18' } : {}}>
                        {m.label}
                        {m.badge && <span className={`ml-1 text-[9px] px-1 py-0.5 rounded-full ${
                          m.badge === '近似' ? 'bg-amber-50 text-amber-500' :
                          m.badge === '推理' ? 'bg-blue-50 text-blue-500' :
                          m.badge === '最新' ? 'bg-green-50 text-green-500' :
                          'bg-gray-100 text-gray-400'
                        }`}>{m.badge}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            <p className="text-[10px] text-gray-400 pt-1">
              ⚠️ 标注「近似」的模型使用对应 OpenAI 编码估算（实际分词可能略有差异）
            </p>
          </div>
        )}
      </div>

      {/* 输入区 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-gray-600">输入文本</label>
            <div className="flex gap-1 flex-wrap">
              {TOKENIZER_EXAMPLES.map(ex => (
                <button key={ex.label} onClick={() => setText(ex.text)}
                  className="text-[10px] px-2 py-0.5 rounded-full border border-gray-200 text-gray-400 hover:border-[#6c5ce7]/30 hover:text-[#6c5ce7] transition-all">
                  {ex.label}
                </button>
              ))}
            </div>
          </div>
          <textarea value={text} onChange={e => setText(e.target.value)}
            placeholder="输入任意文本，实时看到 BPE 分词结果……"
            className="w-full h-28 px-3 py-2.5 text-sm border border-gray-200 rounded-xl resize-none focus:outline-none focus:border-[#6c5ce7]/50 focus:ring-2 focus:ring-[#6c5ce7]/10 text-gray-700 placeholder-gray-300 font-mono"
          />
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-2 lg:grid-cols-1 gap-3 content-start">
          {[
            { label: 'Token 数', value: loading ? '…' : uniqueTokenCount.toLocaleString(), color: '#6c5ce7', sub: selectedModel.label },
            { label: '字符数', value: charCount.toLocaleString(), color: '#0984e3', sub: `约 ${(charCount / Math.max(uniqueTokenCount, 1)).toFixed(2)} chars/token` },
          ].map(card => (
            <div key={card.label} className="rounded-xl border border-gray-100 bg-white p-3.5">
              <p className="text-[10px] text-gray-400 mb-1">{card.label}</p>
              <p className="text-2xl font-bold font-mono" style={{ color: card.color }}>{card.value}</p>
              <p className="text-[10px] text-gray-300 mt-0.5 truncate">{card.sub}</p>
            </div>
          ))}
          <div className="lg:col-span-1">
            <button onClick={() => setShowIds(!showIds)}
              className={`w-full py-2 text-xs font-medium rounded-xl border transition-all ${showIds ? 'bg-[#6c5ce7]/10 border-[#6c5ce7]/30 text-[#6c5ce7]' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'}`}>
              {showIds ? '▲ 隐藏 Token ID' : '▼ 显示 Token ID'}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600">{error}</div>
      )}

      {/* 可视化区域 */}
      {tokens.length > 0 && !loading && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-gray-600">
              Token 可视化 · <span className="text-gray-400">共 {uniqueTokenCount} 个 token</span>
            </p>
            <p className="text-[10px] text-gray-300">编码：<span className="font-mono">{encoding}</span> · 每种颜色代表一个独立 token</p>
          </div>

          {/* 彩色 token 块 */}
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 leading-8 min-h-20">
            <div className="flex flex-wrap gap-0.5 items-baseline">
              {tokens.map((tok, i) => {
                const c = TOKEN_COLORS[tok.colorIdx];
                const parts = tok.text.split('\n');
                return parts.map((part, pi) => (
                  <span key={`${i}-${pi}`}>
                    {pi > 0 && <br />}
                    {part !== '' && (
                      <span
                        title={`Token ID: ${tok.id}  |  "${tok.text.replace(/\n/g, '\\n').replace(/\t/g, '\\t')}"`}
                        className="inline-block px-0.5 rounded text-xs font-mono border cursor-default hover:opacity-80 transition-opacity"
                        style={{ background: c.bg, color: c.text, borderColor: c.border }}>
                        {part.replace(/ /g, '\u00B7')}
                      </span>
                    )}
                    {part === '' && pi > 0 && (
                      <span className="inline-block text-[10px] text-gray-300 font-mono">↵</span>
                    )}
                  </span>
                ));
              })}
            </div>
          </div>

          {/* Token ID 列表 */}
          {showIds && (
            <div className="mt-3 p-3 bg-gray-900 rounded-2xl border border-gray-800 overflow-x-auto">
              <p className="text-[10px] text-gray-500 mb-2 font-mono">Token IDs · {selectedModel.label} ({encoding})</p>
              <div className="flex flex-wrap gap-1">
                {tokens.map((tok, i) => {
                  const c = TOKEN_COLORS[tok.colorIdx];
                  return (
                    <span key={i}
                      title={`"${tok.text.replace(/\n/g, '\\n').replace(/\t/g, '\\t')}"`}
                      className="text-[10px] font-mono px-1.5 py-0.5 rounded border cursor-default"
                      style={{ background: c.bg + '22', color: c.text, borderColor: c.border + '44' }}>
                      {tok.id}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {tokens.some(t => t.text.includes(' ')) && (
            <p className="mt-2 text-[11px] text-gray-400">
              💡 英文单词前通常带空格（显示为 ·），这是 BPE 的特性
            </p>
          )}
          {tokens.some(t => /[\u4e00-\u9fff]/.test(t.text) && t.text.length > 2) && (
            <p className="mt-1 text-[11px] text-gray-400">
              💡 中文字词通常被切成多个 token，所以中文比英文消耗更多 token
            </p>
          )}
        </div>
      )}

      {!tokens.length && !loading && !error && text.trim() === '' && (
        <div className="flex flex-col items-center justify-center py-16 text-gray-300">
          <span className="text-4xl mb-3">🔬</span>
          <p className="text-sm">在上方输入文本，实时看到 BPE 分词可视化</p>
          <p className="text-xs mt-1">或点击右侧示例快速体验中文/代码/特殊字符的分词差异</p>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 主页面
// ═══════════════════════════════════════════════════════════════
const TABS = [
  { id: 'tokenizer', label: 'Tokenizer', icon: '🔬', desc: 'BPE 分词可视化 · 查看真实 token 切分' },
  { id: 'mcp', label: 'MCP 目录', icon: '🔌', desc: 'MCP Server 生态目录 · 官方 + 社区精选' },
  { id: 'prompts', label: 'Prompt 模板库', icon: '📌', desc: '8 个常用高质量模板' },
];

export default function ToolsPage() {
  const [activeTab, setActiveTab] = useState('tokenizer');
  const active = TABS.find(t => t.id === activeTab);

  return (
    <>
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-gray-900">🧰 工具箱</h1>
            <span className="px-2.5 py-0.5 text-xs font-medium bg-purple-50 text-purple-600 border border-purple-100 rounded-full">实用工具</span>
          </div>
          <p className="text-sm text-gray-500">LLM 开发者日常必备 — Tokenizer 可视化 · Prompt 模板 · 更多工具持续更新</p>
        </div>

        {/* Tab bar */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-1 py-3 px-2 rounded-2xl border text-center transition-all ${activeTab === tab.id ? 'bg-white border-[#6c5ce7]/20 shadow-sm' : 'bg-gray-50 border-transparent hover:bg-white hover:border-gray-100'}`}>
              <span className="text-lg">{tab.icon}</span>
              <span className={`text-[10px] font-medium leading-tight ${activeTab === tab.id ? 'text-[#6c5ce7]' : 'text-gray-500'}`}>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Active tab description */}
        <div className="flex items-center gap-2 mb-5">
          <span className="text-base">{active?.icon}</span>
          <h2 className="text-sm font-semibold text-gray-700">{active?.label}</h2>
          <span className="text-xs text-gray-400">· {active?.desc}</span>
        </div>

        {/* Content */}
        {activeTab === 'tokenizer' && <TokenizerTool />}
        {activeTab === 'mcp' && <MCPDirectory />}
        {activeTab === 'prompts' && <PromptTemplates templates={PROMPT_TEMPLATES} />}
      </div>
      <Footer />
    </>
  );
}
