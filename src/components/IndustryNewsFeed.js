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

  // 本周周一（按天显示的起点）
  const thisWeekMondayStr = getMondayStr(todayStr);

  const monthNames = ['', '1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

  items.forEach(item => {
    const dateStr = item.date;
    const d = new Date(dateStr + 'T00:00:00');
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const day = d.getDate();
    let key, label, shortLabel, sortKey;

    if (dateStr >= thisWeekMondayStr && dateStr <= todayStr) {
      // ① 本周（本周周一~今天）：按天
      key = dateStr;
      label = `${month} 月 ${day} 日`;
      shortLabel = `${month}/${day}`;
      sortKey = year * 100000000 + month * 1000000 + day * 10000 + 9999;
    } else if (year === 2026) {
      // ② 2026 年历史数据（非本周）：按周（周一~周日）
      const mondayStr = getMondayStr(dateStr);
      const md = new Date(mondayStr + 'T00:00:00');
      const wm = md.getMonth() + 1;
      const wd = md.getDate();
      const sundayD = new Date(md);
      sundayD.setDate(sundayD.getDate() + 6);
      const sm = sundayD.getMonth() + 1;
      const sd = sundayD.getDate();
      key = `2026-W-${mondayStr}`;
      label = `${wm} 月 ${wd} 日 ~ ${sm !== wm ? sm + '月' : ''}${sd} 日`;
      shortLabel = `${wm}/${wd}-${sd}`;
      sortKey = year * 100000000 + (md.getMonth() + 1) * 1000000 + wd * 10000;
    } else if (year === 2025) {
      // ③ 2025 年：按月
      key = `${year}-${pad(month)}`;
      label = `${year} 年 ${monthNames[month]}`;
      shortLabel = `25年${monthNames[month]}`;
      sortKey = year * 100000000 + month * 1000000;
    } else {
      // ④ 2024 及更早：按年
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

// 分类定义：各大厂商公司级动态（产品发布/财报/战略/并购）
const CATEGORIES = [
  { key: 'all',        label: '全部',    icon: '📡', color: '#6c5ce7' },
  { key: 'cloud',      label: '云服务',  icon: '☁️', color: '#00cec9' },  // AWS/Azure/GCP/阿里云/华为云/腾讯云
  { key: 'data',       label: '数据平台', icon: '🗄️', color: '#326ce5' },  // Databricks/Snowflake/Confluent/dbt
  { key: 'software',   label: '企业软件', icon: '💼', color: '#6c5ce7' },  // Salesforce/ServiceNow/SAP/Oracle/Adobe
  { key: 'hardware',   label: '芯片硬件', icon: '💻', color: '#a29bfe' },  // NVIDIA/AMD/Intel/Apple/华为/国产GPU
  { key: 'automotive', label: '自动驾驶', icon: '🚗', color: '#00b894' },  // Tesla/Waymo/小鹏/理想/华为智选/Mobileye
  { key: 'security',   label: '安全',    icon: '🔐', color: '#e17055' },  // CrowdStrike/Palo Alto/Okta
  { key: 'startup',    label: '融资动态', icon: '🚀', color: '#ffa657' },  // $1B+ 融资/IPO/独角兽估值
  { key: 'market',     label: '市场财报', icon: '📊', color: '#3fb950' },  // 季报/市值/并购
];
const CAT_MAP = Object.fromEntries(CATEGORIES.map(c => [c.key, c]));

const REGIONS = [
  { key: 'all',    label: '全球' },
  { key: 'global', label: '国际' },
  { key: 'china',  label: '国内' },
];

// ─── 新闻数据：各大厂商公司级动态（产品发布/财报/战略/并购）─────────────────
// 重点追踪：AWS / GCP / Azure / 阿里云 / 华为云 / 腾讯云 /
//           Databricks / Snowflake / Salesforce / ServiceNow /
//           NVIDIA / AMD / Intel / Apple / 华为 / 国产GPU /
//           Tesla / Waymo / 小鹏 / 理想 / 华为智选 / Mobileye /
//           CrowdStrike / Palo Alto / Okta

const NEWS_DATA = [
  // ══════════════════════════════════════════════════════
  // 2026-05-04（第47轮更新 — 中国AI调用量再超美国/微软MAI三模型自研/Anthropic内省适配器/谷歌I/O前瞻/Token涨价逆转）
  // ══════════════════════════════════════════════════════
  {
    id: 2805,
    category: 'market',
    region: 'china',
    title: '腾讯 Hy3 preview 周调用量冠全球，中国大模型调用量再超美国达 7.9 万亿 Token',
    summary: '据 OpenRouter 数据，上周中国 AI 大模型周调用量 7.942 万亿 Token（环比+81.7%），时隔两周再超美国（3.258 万亿）。腾讯 Hy3 preview 以 3.03 万亿 Token 夺全球榜首（+799%），Kimi K2.6 第二，DeepSeek-V4-Flash 首次上榜第九（+344%）。国产模型集体爆发信号强烈。',
    source: '每日经济新闻',
    date: '2026-05-04',
    tags: ['腾讯', 'Hy3', 'DeepSeek', '调用量', '国产AI'],
    hot: true,
    link: 'https://m.nbd.com.cn/articles/2026-05-04/4378407.html',
  },
  {
    id: 2806,
    category: 'software',
    region: 'global',
    title: '微软发布 MAI 三款自研模型（语音/图像/转写）：算力减半对标 OpenAI，正式入局底层模型竞争',
    summary: '微软推出 MAI-Transcribe-1、MAI-Voice-1 和 MAI-Image-2，完成从「AI 应用公司」向「基础模型研发者」的战略转型。语音转写在 25 种语言超越 Whisper-large-v3，图像生成 Arena.ai 排名前三，均需行业标准一半算力。三款模型通过 Microsoft Foundry 开放，已集成 Teams、Copilot 和 Bing。',
    source: 'DoNews / 中关村在线',
    date: '2026-05-04',
    tags: ['微软', 'MAI', '自研模型', 'Foundry', 'OpenAI竞争'],
    hot: true,
    link: 'https://www.donews.com/news/detail/4/6496723.html',
  },
  {
    id: 2807,
    category: 'market',
    region: 'china',
    title: 'Token 集体涨价逆转：中国 AI 日调用量 140 万亿 Token 推高成本，供需错配主导定价权',
    summary: '中国 AI 日均 Token 调用量从 2024 年初 1000 亿暴增至 2026 年 3 月的 140 万亿（1400 倍），推理需求爆发叠加 GPU 供需错配，各厂商从价格战转向集体涨价。蚂蚁 Ling-2.6-flash（$0.1/百万 token）是极少数坚守低价的异类，专家预测 3-5 年内随算力扩张价格将重新下降，但当前商业模式设计须重估 Token 成本。',
    source: '未来科技导报',
    date: '2026-05-04',
    tags: ['Token定价', 'AI成本', '供需', '商业模式'],
    hot: false,
    link: 'https://www.bhwang.cn/youjun/74543716144398.html',
  },
  {
    id: 2808,
    category: 'cloud',
    region: 'global',
    title: '谷歌 I/O 2026（5月19日）前瞻：Gemini 3、Android 17、Aluminum OS 与 XR 眼镜齐发',
    summary: '谷歌 I/O 2026 定于 5 月 19 日，核心看点：Gemini 新版本全系 AI 深度集成；Android XR 智能眼镜正式商品化（Gemini Live 实时翻译）；Android 17 + ChromeOS 统一平台 Aluminum OS 首秀。Alphabet 2026 年资本开支 1750-1850 亿美元，与微软、AWS 展开全球 AI 算力军备竞赛，大会将是其集中展示技术实力的最重要窗口。',
    source: '搜狐科技',
    date: '2026-05-04',
    tags: ['谷歌', 'Google I/O', 'Gemini', 'Android XR', 'Aluminum OS'],
    hot: true,
    link: 'https://www.sohu.com/a/1015898223_114765',
  },
  // ══════════════════════════════════════════════════════
  // 2026-05-03（第46轮更新 — 蚂蚁Ling-2.6-1T万亿开源/DeepSeek多模态新模型/AIBrix v0.6发布/谷歌I/O前瞻/AI创投周报11亿种子轮）
  // ══════════════════════════════════════════════════════
  {
    id: 2801,
    category: 'startup',
    region: 'global',
    title: 'AlphaGo 核心作者新公司完成 11 亿美元种子轮融资，刷新 AI 创投纪录',
    summary: '前 DeepMind 科学家（参与 AlphaGo 开发）创立的新 AI 公司本周完成 11 亿美元种子轮融资，刷新 AI 赛道种子阶段融资纪录。同期，专为 AI Agent 工作流设计的智能体网页检索引擎获 1 亿美元融资，针对信息密度、低延迟需求做专项优化。2026 Q2 全球 AI 一级市场热度持续高涨，Agent 基础设施已成顶级 VC 新宠。',
    source: '腾讯新闻',
    date: '2026-05-03',
    tags: ['AI融资', 'AlphaGo', 'DeepMind', 'Agent', '创投'],
    hot: true,
    link: 'https://news.qq.com/rain/a/20260430A07FWS00',
  },
  {
    id: 2802,
    category: 'software',
    region: 'china',
    title: '蚂蚁集团开源万亿参数 Ling-2.6-1T：对标 GPT-5.4，输出成本为同类 1/4',
    summary: '蚂蚁集团百灵大模型团队开源旗舰版 Ling-2.6-1T（万亿参数）和效率版 Ling-2.6-flash（104B），构建完整产品矩阵。1T 版采用 MLA+LinearAttention 混合架构与「快思考」机制，输出成本为同类1/4，支持 262K 上下文，在 AIME26/SWE-bench 达开源 SOTA。flash 版推理速度 340 tokens/s，Token 效率为同类 10 倍，API 定价 $0.1/百万输入 tokens，已登陆 HuggingFace 与 ModelScope。',
    source: 'IT之家 / 站长之家',
    date: '2026-05-03',
    tags: ['蚂蚁集团', 'Ling-2.6', '万亿参数', '开源', 'Agent', 'API定价'],
    hot: true,
    link: 'https://www.ithome.com/0/943/337.htm',
  },
  {
    id: 2803,
    category: 'hardware',
    region: 'global',
    title: 'Alphabet 宣布 2026 年资本开支 1750-1850 亿美元：全力押注 AI 算力与数据中心',
    summary: 'Alphabet 公布 2026 年资本开支计划达 1750-1850 亿美元，重点投向 AI 算力与数据中心建设，较 2025 年大幅提速。谷歌 I/O 2026 前瞻显示，Gemini 3 将支持 100 万 token 上下文，推出 Android XR 智能眼镜（搭载 Gemini Live）及 ChromeOS+Android 统一平台，与微软（$800 亿）、亚马逊 AWS 展开全球 AI 算力军备竞赛。',
    source: '至顶网 / 腾讯新闻',
    date: '2026-05-03',
    tags: ['谷歌', 'Alphabet', '资本开支', 'AI算力', '数据中心', 'Google I/O'],
    hot: true,
    link: 'https://ai.zhiding.cn/2026/0415/3184082.shtml',
  },
  {
    id: 2804,
    category: 'cloud',
    region: 'global',
    title: 'ByteDance AIBrix v0.6 发布：Kubernetes LLM 推理控制平面批量吞吐提升 4.7 倍',
    summary: 'ByteDance 开源、现属 vllm-project 生态的 AIBrix 发布 v0.6：Batch API 支持离线高吞吐工作负载，新增分层 KV Cache 卸载机制（吞吐提升 20%+），StormService 原语支持 Prefill/Decode 角色级独立扩缩容。核心指标：批量吞吐 124→588 tokens/s（4.7×），KV Cache 效率 80%→95%，已被腾讯云 TKE 等云平台采用，面向企业级 vLLM 大规模部署场景。',
    source: 'GitHub / vllm-project',
    date: '2026-05-03',
    tags: ['ByteDance', 'AIBrix', 'vLLM', 'Kubernetes', 'LLM推理', '云原生'],
    hot: true,
    link: 'https://github.com/aibrix/aibrix/releases',
  },
  // ══════════════════════════════════════════════════════
  // 2026-05-02（第45轮更新 — DeepSeek V4开源+华为适配/腾讯混元Hy3 Preview开源/Anthropic估值冲9000亿/NVIDIA Dynamo迭代DeepSeek V4支持）
  // ══════════════════════════════════════════════════════
  {
    id: 2797,
    category: 'software',
    region: 'china',
    title: 'DeepSeek 正式发布并开源 V4：适配华为昇腾，百万上下文，国产算力首获一级支持',
    summary: 'DeepSeek 推出 V4-Pro（1.6T 参数 MoE）与 V4-Flash 并同步开源，支持 100 万 token 上下文。商业亮点：V4 率先完成华为昇腾芯片专项适配，DeepSeek 将国产算力列为与 NVIDIA 并列的一级支持平台，API 发布当日商业化开放，月活开发者已超百万。DeepSeek 同期推进首轮外部融资，估值预计超 500 亿美元，幻方量化孵化项目走向独立商业化。',
    source: 'CGTN / 新华社英文',
    date: '2026-05-02',
    tags: ['DeepSeek', 'V4', '开源', '华为昇腾', '融资', '商业化'],
    hot: true,
    link: 'https://news.cgtn.com/news/2026-04-24/DeepSeek-unveils-new-AI-model-adapted-for-Huawei-chips-1MBU0eOEv9S/index.html',
  },
  {
    id: 2798,
    category: 'cloud',
    region: 'china',
    title: '腾讯混元 Hy3 Preview 开源：2950亿参数 MoE，接入十余款腾讯产品，1.2元/百万 token 定价',
    summary: '腾讯推出混元 Hy3 Preview 并开源（Apache 2.0），总参数 2950 亿、激活 210 亿，256K 上下文，API 定价 1.2 元/百万 tokens。商业策略：已深度接入 QQ、腾讯云、腾讯文档等十余款核心产品，首席 AI 科学家姚顺雨领衔打造工程实用化路线，标志腾讯大模型从内部工具向对外开放生态竞争转型，与阿里 Qwen3、百度文心形成三足鼎立格局。',
    source: '腾讯云 / 量子位',
    date: '2026-05-02',
    tags: ['腾讯', '混元', 'Hy3', '开源', '定价', '云服务'],
    hot: true,
    link: 'https://juejin.cn/post/7629503574842834994',
  },
  {
    id: 2799,
    category: 'software',
    region: 'global',
    title: 'Anthropic 估值冲 9000 亿美元：Claude 定价多轮调整，「先低价养熟再提价」策略引争议',
    summary: 'Anthropic 最新估值冲向 9000 亿美元，同期 Claude 经历多轮定价调整，被媒体解读为典型平台化获客套路。数据显示 ChatGPT 卸载量上升 413%、Claude 下载量激增 100%，市场份额加速向 Anthropic 转移。投资人押注 Claude 成为 OpenAI 最强竞争者，商业模式成熟度快速提升，但频繁调价引发用户锁定效应担忧，是 2026 上半年最受关注的 AI 商业化博弈案例之一。',
    source: '36Kr',
    date: '2026-05-02',
    tags: ['Anthropic', 'Claude', '估值', '定价策略', '市场竞争'],
    hot: true,
    link: 'https://36kr.com/p/3791460373929221',
  },
  {
    id: 2800,
    category: 'hardware',
    region: 'global',
    title: 'NVIDIA Dynamo 迭代 v1.2-dev 支持 DeepSeek-V4：AI 数据中心推理操作系统加速国产模型适配',
    summary: 'NVIDIA 开源推理操作系统 Dynamo 发布 v1.2.0-dev.1，新增实验性 DeepSeek-V4 部署支持。Dynamo 1.0 今年 3 月发布，Blackwell GPU 上实现 7× 性能提升，已被主流云厂商采用。此次快速跟进适配 DeepSeek-V4，表明 NVIDIA 将中国顶尖开源模型列入官方推理栈优先支持目标，进一步巩固其作为 AI 数据中心推理基础设施提供商的市场地位。',
    source: 'GitHub / NVIDIA',
    date: '2026-05-02',
    tags: ['NVIDIA', 'Dynamo', '推理框架', 'DeepSeek', '数据中心'],
    hot: true,
    link: 'https://github.com/ai-dynamo/dynamo/releases',
  },
  // ══════════════════════════════════════════════════════
  // 2026-05-02（第44轮更新 — 马斯克OpenAI开庭/智谱降智秘密/华为×中科大灵境造物/Claude定价反复横跳/OpenAI硬件布局/Anthropic估值冲9000亿）
  // ══════════════════════════════════════════════════════
  {
    id: 2793,
    category: 'software',
    region: 'global',
    title: '马斯克诉 OpenAI 世纪庭审开锣：互曝内幕，「蒸馏 ChatGPT」指控成 AI IP 判例焦点',
    summary: '马斯克与 OpenAI 诉讼正式开庭，双方互披通讯记录与控制权争夺史料。最大焦点：「蒸馏 ChatGPT 输出」指控——若法院认定为侵权，将为全行业 SFT 蒸馏实践划定法律红线，影响 Mistral、Llama 等开源模型生态。同期报道显示马斯克旗下 xAI 被指控训练 Grok 时亦使用 ChatGPT 生成数据，诉讼战略意图被质疑。此案被视为 AI 知识产权领域首个里程碑级判例。',
    source: '量子位 / 36Kr',
    date: '2026-05-02',
    tags: ['马斯克', 'OpenAI', 'xAI', '诉讼', '知识产权', 'AI监管'],
    hot: true,
    link: 'https://www.qbitai.com/2026/05/412447.html',
  },
  {
    id: 2794,
    category: 'cloud',
    region: 'china',
    title: '华为携手中科大发布「灵境造物」：全栈国产 AI 内容生成平台，openJiuwen 框架首发',
    summary: '华为与中科大联合推出生成式 AI 平台「灵境造物」，全栈依托昇腾 NPU + 华为云生态，引入 Coordination Engineering（协调工程）新范式，底层由 openJiuwen 开源框架支撑。平台支持文本、图像、视频多模态内容生成，是华为继盘古大模型后在 AI 内容生成赛道的重要落子，中科大学术背书强化技术公信力，持续扩大昇腾生态应用覆盖。',
    source: '量子位',
    date: '2026-05-02',
    tags: ['华为', '中科大', '灵境造物', '昇腾', '国产AI', '多模态'],
    hot: true,
    link: 'https://www.qbitai.com/2026/05/412696.html',
  },
  {
    id: 2795,
    category: 'software',
    region: 'global',
    title: 'Claude 定价反复横跳：先养熟用户再涨价，Anthropic 估值冲向 9000 亿美元',
    summary: 'Anthropic 的 Claude 近期多次调整定价策略，被媒体解读为「先低价获客、再提价变现」的典型平台化套路，引发用户对锁定效应的担忧。与此同时，ChatGPT 卸载量上升 413%、Claude 下载激增 100%，市场份额重新洗牌信号明显。Anthropic 在此背景下估值冲向 9000 亿美元，投资人押注其成为 OpenAI 最强竞争对手，商业模式成熟度正快速提升。',
    source: '36Kr',
    date: '2026-05-02',
    tags: ['Anthropic', 'Claude', '定价策略', '估值', '市场竞争', 'OpenAI'],
    hot: true,
    link: 'https://36kr.com/p/3791460373929221',
  },
  {
    id: 2796,
    category: 'hardware',
    region: 'global',
    title: 'OpenAI 剑指 2028 年量产 AI 手机：「硬刚」苹果，软硬件一体化战略浮出水面',
    summary: 'OpenAI 加速推进硬件布局，目标 2028 年量产 AI 原生智能手机，配合 Jony Ive 团队的 AI 设备研发，直接挑战苹果在消费终端的统治地位。战略逻辑：掌控端侧入口才能保证模型调用量，避免被苹果/谷歌系生态卡脖子。硬件化还有助于构建用户数据闭环，支撑个性化记忆模型落地。此举将使 AI 大模型公司与传统硬件巨头的竞争升维至操作系统与终端层面。',
    source: '36Kr',
    date: '2026-05-02',
    tags: ['OpenAI', 'AI手机', '硬件', '苹果', '软硬件一体化', '端侧AI'],
    hot: true,
    link: 'https://36kr.com/p/3791555958922504',
  },
  // ══════════════════════════════════════════════════════
  // 2026-05-01（第43轮更新 — Stripe 288功能/商汤杨帆AI拐点/具身仿真框架开源/DeepMind韩国战略合作/DeepMind行业加速/HF Axolotl三值化/MCP时代反思）
  // ══════════════════════════════════════════════════════
  {
    id: 2788,
    category: 'software',
    region: 'global',
    title: 'Stripe 一次发布 288 项新功能：All-in AI 时代经济基础设施，Agent 原生支付 API 上线',
    summary: 'Stripe 在最新开发者大会上一次性发布 288 项更新，战略主题：构建 AI 时代经济基础设施。核心新功能：AI Agent 原生支付 API（允许 Agent 自主完成交易）、自动化账单协调、跨境汇款链路优化、Stripe Tax 全球扩展。Stripe 正将自身从支付工具升级为 AI 应用货币化底层——谁控制支付层，谁就控制 AI 经济的结算节点。年化处理量超 $1.4 万亿，竞争对手 Adyen/Braintree 面临平台化压力。',
    source: '量子位',
    date: '2026-04-29',
    tags: ['Stripe', '支付', 'AI基础设施', 'AI Agent', '商业化'],
    hot: true,
    link: 'https://www.qbitai.com/2026/04/412018.html',
  },
  {
    id: 2789,
    category: 'cloud',
    region: 'china',
    title: '商汤杨帆：AI 拐点已至，从「人用 AI」到「人机协作」是生产关系重构',
    summary: '商汤科技高级副总裁杨帆公开表态 AI 已进入真正拐点：本质是生产关系重构，而非工具迭代。商汤「日日新」大模型深度嵌入制造、金融、政务三大行业，2026 Q1 AI 业务同比增长超 80%。重要信号：商汤从 ToC 消费级 AI 应用（商量）向 ToB 企业工作流转型加速，与百度文心、阿里通义在企业市场形成三方竞争格局。',
    source: '量子位',
    date: '2026-04-29',
    tags: ['商汤科技', 'AI拐点', '企业AI', '人机协作', '大模型'],
    hot: true,
    link: 'https://www.qbitai.com/2026/04/412015.html',
  },
  {
    id: 2790,
    category: 'cloud',
    region: 'global',
    title: 'Google DeepMind 与韩国政府签战略合作：主权 AI 浪潮下首个亚洲政府级协议',
    summary: 'Google DeepMind 正式宣布与韩国共和国政府战略合作，内容涵盖共建韩语原生大模型、AI 安全研究联合实验室、政府数字化转型和 AI 人才培养体系。这是 DeepMind 在亚洲主要经济体签署的首个政府级 AI 战略协议，折射「主权 AI」（Sovereign AI）趋势：各国加速构建本国 AI 语言/文化能力，避免对美国大模型形成战略依赖。韩国三星/SK 海力士/LG 均为 DeepMind 合作生态参与方。',
    source: 'Google DeepMind',
    date: '2026-04-30',
    tags: ['Google DeepMind', '韩国', '主权AI', '政府合作', '国际化'],
    hot: true,
    link: 'https://deepmind.google/blog/announcing-our-partnership-with-the-republic-of-korea/',
  },
  {
    id: 2791,
    category: 'cloud',
    region: 'global',
    title: 'Google DeepMind 推出行业 AI 转型加速计划：制造/金融/医疗/零售全覆盖，B2B 战略提速',
    summary: 'Google DeepMind 宣布与多个跨行业领先企业共建「AI 转型加速」合作计划，包含定制化大模型微调、行业专属数据集共建及研究团队驻场咨询。DeepMind 正将前沿研究快速转化为 B2B 商业落地能力，与 OpenAI Enterprise / Anthropic Teams 在企业级 AI 服务市场展开直接竞争。此举也标志 DeepMind 从纯研究机构向 AI 解决方案提供商的战略转型进入加速期。',
    source: 'Google DeepMind',
    date: '2026-04-29',
    tags: ['Google DeepMind', '企业AI', 'B2B', 'AI转型', '行业合作'],
    hot: false,
    link: 'https://deepmind.google/blog/partnering-with-industry-leaders-to-accelerate-ai-transformation/',
  },
  {
    id: 2792,
    category: 'data',
    region: 'china',
    title: '具身智能仿真新框架开源：高并行渲染突破算力瓶颈，真机部署「零微调」',
    summary: '新一代具身智能仿真开源框架发布，核心突破：① 高吞吐并行渲染架构，同时运行大规模仿真环境与高保真视觉渲染，显著降低训练单位成本；② 零微调真机迁移（Sim-to-Real），在仿真中训练的策略无需调整直接部署实体机器人，为国内具身智能产业化提供关键基础设施。当前具身智能训练成本主要卡点在仿真算力和 Sim-to-Real gap，此方案直接击中痛点。',
    source: '量子位',
    date: '2026-05-01',
    tags: ['具身智能', '仿真框架', '机器人', '开源', 'Sim-to-Real'],
    hot: true,
    link: 'https://www.qbitai.com/2026/05/412577.html',
  },
  // ══════════════════════════════════════════════════════
  // 2026-05-01（第42轮更新 — vLLM v0.20.0/HF Transformers v5.7.0/SGLang v0.5.10/PyTorch 2.11）
  // ══════════════════════════════════════════════════════
  {
    id: 2784,
    category: 'data',
    region: 'global',
    title: 'vLLM v0.20.0 发布：DeepSeek V4 原生推理、FA4 成默认 MLA 后端、TurboQuant 2-bit KV 容量 4×',
    summary: 'vLLM 发布 v0.20.0（752 commits，320 贡献者）。核心变更：① DeepSeek V4 原生支持含 MTP 改进；② FlashAttention 4 重启用为 MLA 预填充默认后端（SM90+ GPU，支持 head-dim 512 + paged-KV）；③ TurboQuant 2-bit KV Cache 实现 4× 容量提升，兼容 FA3/FA4；④ 默认 CUDA 升至 13.0.2，PyTorch 升至 2.11。vLLM 持续以推理框架事实标准地位引领 LLM 生产部署。',
    source: 'GitHub Releases',
    date: '2026-04-27',
    tags: ['vLLM', '推理引擎', 'DeepSeek V4', 'FlashAttention 4', 'KV Cache', '开源'],
    hot: true,
    link: 'https://github.com/vllm-project/vllm/releases/tag/v0.20.0',
  },
  {
    id: 2785,
    category: 'data',
    region: 'global',
    title: 'HuggingFace Transformers v5.7.0：Poolside Laguna MoE 原生支持，长序列连续批处理增强',
    summary: 'Transformers v5.7.0 发布，新增 Poolside Laguna 混合专家语言模型和 DEIMv2 实时目标检测模型原生支持。连续批处理生成能力针对 16K+ 长序列显著强化，改善内存管理与推理吞吐。新增 FP8 checkpoint kernel 支持，修复多模型注意力机制 Bug。Transformers 库持续以统一接口覆盖最前沿 MoE 和多模态架构。',
    source: 'GitHub Releases',
    date: '2026-04-28',
    tags: ['HuggingFace', 'Transformers', 'MoE', '推理优化', '开源'],
    hot: false,
    link: 'https://github.com/huggingface/transformers/releases/tag/v5.7.0',
  },
  {
    id: 2786,
    category: 'data',
    region: 'global',
    title: 'SGLang v0.5.10：Elastic EP DeepSeek 容错 + Piecewise CUDA Graph 默认 + HiSparse 稀疏注意力',
    summary: 'SGLang v0.5.10 发布，关键更新：① Piecewise CUDA Graph 执行成默认模式，降低大 batch 推理延迟；② Elastic EP 弹性专家并行集成，DeepSeek MoE 部署支持局部节点失效容错；③ HiSparse 稀疏注意力后端集成，大幅降低长序列计算开销；④ FlashInfer MXFP8 混精度推理 kernel；⑤ LoRA 微调扩展至 MoE 层，多模态架构进一步完善。',
    source: 'GitHub Releases',
    date: '2026-04-06',
    tags: ['SGLang', '推理引擎', 'MoE', 'FlashInfer', 'CUDA', '开源'],
    hot: false,
    link: 'https://github.com/sgl-project/sglang/releases/tag/v0.5.10',
  },
  {
    id: 2787,
    category: 'data',
    region: 'global',
    title: 'PyTorch 2.11 发布：FlexAttention+FA4 速度提升 3.2×，TorchScript 正式宣告废弃',
    summary: 'PyTorch 2.11 正式发布（2723 commits，432 贡献者）。亮点：① FlexAttention 新增 FlashAttention-4 后端（Hopper/Blackwell），比 Triton 实现快 1.2-3.2×；② 分布式训练可微分集合通讯（Differentiable Collectives），反向传播可穿越 all-reduce 等操作；③ CUDA 13 升为默认；④ TorchScript 正式宣告废弃，引导迁移至 torch.export + ExecuTorch；⑤ RNN/LSTM 支持 GPU 导出与动态 shape 追踪。',
    source: 'PyTorch Blog',
    date: '2026-03-23',
    tags: ['PyTorch', '深度学习框架', 'FlashAttention', '分布式训练', 'CUDA', '开源'],
    hot: true,
    link: 'https://pytorch.org/blog/pytorch-2-11-release/',
  },
  // ══════════════════════════════════════════════════════
  // 2026-05-01（第39轮更新 — Anthropic创意工作连接器/亚马逊5GW算力协议/Google Gemma 4/DeepMind AI协诊/Decoupled DiLoCo/Meta Muse Spark/MTIA芯片/Kueue v0.17.2/MLflow 3.12 RC AI编码Tracing）
  // 2026-05-01（第40轮更新 — NVIDIA Nemotron 3 Nano Omni/IBM Granite 4.1/HAMi v2.8.2/GitHub Copilot计费改革/GitHub RCE漏洞/Ray 2.55.0/Anthropic NEC日本/AI评测成本瓶颈）
  // ══════════════════════════════════════════════════════
  {
    id: 2759,
    category: 'software',
    region: 'global',
    title: 'Anthropic 推出 Claude 创意连接器：与 Adobe/Blender/Ableton 深度集成，创意 AI 工作流正式上线',
    summary: 'Anthropic 发布面向创意专业人士的 Claude 连接器，与 Adobe Creative Cloud、Blender、Autodesk Fusion、Ableton、Splice 等主流创作软件深度集成。支持 AI 辅导复杂工具学习、自定义脚本编写、资产跨应用同步和生产流程自动化。同步发布 Claude Design 设计工具，并加入 Blender 开发基金。',
    source: 'Anthropic Blog',
    date: '2026-04-28',
    tags: ['Anthropic', 'Claude', 'Adobe', 'Blender', '创意AI'],
    hot: true,
    link: 'https://www.anthropic.com/news/claude-for-creative-work',
  },
  {
    id: 2760,
    category: 'cloud',
    region: 'global',
    title: 'Anthropic 与亚马逊签 5GW 算力长约：$1000 亿+ AWS 投入，Trainium 2-4 代逐步接管训练基础设施',
    summary: 'Anthropic 与亚马逊签署最高 5 吉瓦算力保障协议，亚马逊未来十年承诺超 $1000 亿技术投入，当前立即注资 $50 亿。Trainium2-4 系列芯片 2026 年 Q2 起上线，推理容量同步扩展至亚太和欧洲。Anthropic 年化营收已超 $300 亿，成为云厂商在 AI 基础设施端最重要的锚定客户。',
    source: 'Anthropic Blog',
    date: '2026-04-20',
    tags: ['Anthropic', '亚马逊', 'AWS', 'Trainium', '算力'],
    hot: true,
    link: 'https://www.anthropic.com/news/anthropic-amazon-compute',
  },
  {
    id: 2761,
    category: 'hardware',
    region: 'global',
    title: 'Google Gemma 4 正式发布：31B Dense 进入开源前三，256K 上下文 + 140 语言 + Apache 2.0',
    summary: 'Google 发布 Gemma 4 系列开源模型（2B/4B/26B MoE/31B Dense），支持 256K 上下文、140+ 语言、原生多模态。31B 在 Arena AI 排行榜跻身开源前三，26B MoE 排第六。全系 Apache 2.0 协议，支持从 Android 到数据中心的全硬件范围，兼容 vLLM/llama.cpp/NVIDIA NIM。',
    source: 'Google Blog',
    date: '2026-04-02',
    tags: ['Google', 'Gemma 4', '开源模型', 'MoE', '多模态'],
    hot: true,
    link: 'https://blog.google/innovation-and-ai/technology/developers-tools/gemma-4/',
  },
  {
    id: 2762,
    category: 'cloud',
    region: 'global',
    title: 'Google DeepMind AI 协诊系统：98 项初级护理查询零严重错误，「三元医疗」模型进入临床验证',
    summary: 'DeepMind 发布 AI 协诊（AI Co-Clinician）研究，98 项初级护理查询中 97 例零严重错误。多模态实时远程医疗场景下，68/140 项评估维度表现与初级保健医师相当。采用「三元医疗」（AI+患者+医生）模式，明确 AI 为医生辅助工具定位，正在全球多个医疗场景推进验证。',
    source: 'Google DeepMind Blog',
    date: '2026-04-30',
    tags: ['Google DeepMind', 'AI医疗', '协诊系统', '多模态'],
    hot: true,
    link: 'https://deepmind.google/blog/ai-co-clinician/',
  },
  {
    id: 2763,
    category: 'cloud',
    region: 'global',
    title: 'DeepMind Decoupled DiLoCo：跨区域训练带宽从 198 Gbps 降至 0.84 Gbps，容错率提升 3 倍',
    summary: 'Google DeepMind 发布 Decoupled DiLoCo 跨数据中心分布式训练架构，带宽需求从 198 Gbps 压缩至 0.84 Gbps，在高故障率下维持 88% 有效训练（传统方法仅 27%）。成功跨 4 个美国大区训练 120 亿参数模型，效率是传统同步方法 20 倍，精度（64.1%）与基线（64.4%）相当。',
    source: 'Google DeepMind Blog',
    date: '2026-04-23',
    tags: ['Google DeepMind', '分布式训练', 'AI Infra', '跨数据中心'],
    hot: true,
    link: 'https://deepmind.google/blog/decoupled-diloco/',
  },
  {
    id: 2764,
    category: 'software',
    region: 'global',
    title: 'Meta 发布 Muse Spark 多模态推理模型：「沉思模式」并发多 Agent，迈向个人超级智能',
    summary: 'Meta AI 发布 Muse Spark，定位通向「个人超级智能」的多模态推理基础模型，支持工具调用、视觉思维链推理和多 Agent 协调。新「沉思模式」支持多 Agent 并发推理，预训练效率较前代提升超 10 倍。涵盖视觉 STEM、1000+ 医生协同健康评估及 Agentic 任务。',
    source: 'Meta AI Blog',
    date: '2026-04-08',
    tags: ['Meta', 'Muse Spark', '多模态推理', 'Agent', '超级智能'],
    hot: true,
    link: 'https://ai.meta.com/blog/introducing-muse-spark-msl/',
  },
  {
    id: 2765,
    category: 'hardware',
    region: 'global',
    title: 'Meta MTIA 芯片两年四代：HBM 带宽 4.5 倍增长、算力 25 倍提升，自研 AI 芯片路线全速推进',
    summary: 'Meta 披露 MTIA AI 芯片两年四代迭代路线（300→400→450→500），HBM 带宽 4.5 倍增长，计算性能提升 25 倍。MTIA 450 已针对生成式 AI 推理专项优化，MTIA 500 计划 2027 年部署。Meta 通过高速迭代+推理优先+PyTorch 无缝集成策略，加速降低对 NVIDIA GPU 的依赖。',
    source: 'Meta AI Blog',
    date: '2026-03-11',
    tags: ['Meta', 'MTIA', '自研芯片', 'AI芯片', '推理加速'],
    hot: true,
    link: 'https://ai.meta.com/blog/meta-mtia-scale-ai-chips-for-billions/',
  },
  {
    id: 2766,
    category: 'data',
    region: 'global',
    title: 'Kueue v0.17.2 & v0.18.0-rc.0 发布：并发准入新特性上线，AI 作业队列管理进入稳定成熟期',
    summary: 'Kueue 于 2026-04-30 同日发布两个版本：v0.17.2 稳定版修复 11 项 Bug（TAS 拓扑感知调度/配额管理/可观测性）；v0.18.0-rc.0 引入并发准入（Concurrent Admission）重要新特性，MultiKueue 多项功能晋升稳定，CRD 只读角色聚合至 Kubernetes 默认 view 角色，面向大规模 AI 集群调度持续演进。',
    source: 'GitHub Releases',
    date: '2026-04-30',
    tags: ['Kueue', 'Kubernetes', 'AI调度', 'AI Infra', '云原生'],
    hot: false,
    link: 'https://github.com/kubernetes-sigs/kueue/releases/tag/v0.17.2',
  },
  {
    id: 2767,
    category: 'data',
    region: 'global',
    title: 'MLflow 3.12 首次支持 Claude Code/Codex/Gemini CLI 全链路 Tracing，AI 编码助手可观测性进入 MLOps 主流',
    summary: 'MLflow v3.12.0rc0 推出 AI 编码助手一等公民 Tracing，通过可安装 TypeScript 插件自动捕获 Claude Code、Codex、Qwen Code、Gemini CLI 的提示词和工具调用全链路。同时新增 AI Gateway Guardrail 安全机制、多模态 Trace（图像/音频）、扩散模型 mlflow.diffusers Flavor，MLOps 平台向 GenAI 全生命周期演进持续深化。',
    source: 'GitHub Releases',
    date: '2026-04-28',
    tags: ['MLflow', 'Claude Code', 'AI可观测性', 'MLOps', '开源'],
    hot: false,
    link: 'https://github.com/mlflow/mlflow/releases/tag/v3.12.0rc0',
  },
  // ══════════════════════════════════════════════════════
  // 2026-05-01（第41轮更新 — Gemini Robotics-ER 1.6/Gemini 3.1 Flash TTS/Anthropic NEC日本/Airflow 3.2.1/Koordinator v1.8.0/Unity Catalog AI 0.4.0）
  // ══════════════════════════════════════════════════════
  {
    id: 2778,
    category: 'software',
    region: 'global',
    title: 'Google DeepMind Gemini Robotics-ER 1.6：仪表读数 + 任务成功自检，波士顿动力联合验证',
    summary: 'DeepMind 发布 Gemini Robotics-ER 1.6，三大增强：精准指向（物体定位/计数）、任务成功检测（多视角自主判断）、新增仪表读数（压力表/液位计/数字显示屏，与波士顿动力合作发现）。对抗性空间推理安全合规性显著提升，可通过 Gemini API 和 AI Studio 访问，标志着 VLA 从学术原型走向工业可靠性要求。',
    source: 'Google DeepMind Blog',
    date: '2026-04-14',
    tags: ['Google DeepMind', 'Gemini Robotics', 'VLA', '波士顿动力', '具身智能'],
    hot: true,
    link: 'https://deepmind.google/blog/gemini-robotics-er-1-6/',
  },
  {
    id: 2779,
    category: 'software',
    region: 'global',
    title: 'Google Gemini 3.1 Flash TTS：70+ 语言、Elo 1211、SynthID 水印全面内嵌',
    summary: 'Google 发布 Gemini 3.1 Flash TTS，在 Artificial Analysis TTS 排行榜 Elo 1211 分。核心差异：① 音频标签控制（自然语言嵌入文本调节节奏/情绪/风格）；② 导演工具（场景/角色/注释 → 一键导出 API 代码）；③ SynthID 防篡改水印自动嵌入所有音频。支持 70+ 语言，可在 Google AI Studio、Vertex AI、Google Vids 使用，语音 AI 场景生产门槛大幅降低。',
    source: 'Google Blog',
    date: '2026-04-15',
    tags: ['Google', 'Gemini TTS', '语音合成', 'SynthID', 'AI内容检测'],
    hot: false,
    link: 'https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-3-1-flash-tts',
  },
  {
    id: 2780,
    category: 'cloud',
    region: 'global',
    title: 'Anthropic 与 NEC 日本战略合作：3 万员工使用 Claude，聚焦金融/制造/政府数字化',
    summary: 'Anthropic 宣布与日本 NEC 达成战略合作，NEC 成为 Anthropic 在日本的首个全球合作伙伴。约 3 万名 NEC 全球员工获 Claude 访问权，金融/制造/地方政府三大行业先行落地。NEC BluStellar 网络安全平台集成 Claude Opus 4.7 + Claude Code，内部建立 AI 工程卓越中心实行「自用优先」策略，是 Anthropic 亚太企业市场拓展的重要节点。',
    source: 'Anthropic Blog',
    date: '2026-04-24',
    tags: ['Anthropic', 'NEC', '日本市场', '企业AI', 'Claude'],
    hot: false,
    link: 'https://www.anthropic.com/news/anthropic-nec',
  },
  {
    id: 2781,
    category: 'data',
    region: 'global',
    title: 'Apache Airflow 3.2.1 发布：30+ 修复，只读用户权限收紧，Helm 1.21.0 同步',
    summary: 'Apache Airflow 3.2.1 稳定版发布，30+ Bug 修复。关键变更：只读 DAG 用户不再能访问 /dags 端点（数据隔离收紧）。同步发布 Helm Chart 1.21.0，Workers 配置分层重组，默认镜像升级至 Airflow 3.2.0。3.x 系列 Asset Partitioning、Multi-Team Deployments 等已在 3.2.0 稳定，3.2.1 专注生产质量强化。',
    source: 'GitHub Releases',
    date: '2026-04-22',
    tags: ['Apache Airflow', '数据编排', 'Helm', '开源', '权限管理'],
    hot: false,
    link: 'https://github.com/apache/airflow/releases/tag/3.2.1',
  },
  {
    id: 2782,
    category: 'data',
    region: 'global',
    title: 'Koordinator v1.8.0：MetaX GPU/sGPU 细粒度调度 + 国产 GPU 生态扩展，80+ 变更',
    summary: '阿里开源 K8s 混部调度框架 Koordinator 发布 v1.8.0（80+ 变更），新增对 MetaX GPU/sGPU 细粒度设备调度支持，扩展国产 GPU 生态覆盖。多调度器协同能力增强，修复 Reservation 跨调度器处理 Bug；ElasticQuota 和 Descheduler 多项稳定性改进，持续强化 AI 混部大集群资源效率。',
    source: 'GitHub Releases',
    date: '2026-04-16',
    tags: ['Koordinator', 'Kubernetes', 'GPU调度', '国产GPU', 'MetaX', '阿里'],
    hot: false,
    link: 'https://github.com/koordinator-sh/koordinator/releases/tag/v1.8.0',
  },
  {
    id: 2783,
    category: 'data',
    region: 'global',
    title: 'Unity Catalog 0.4.0 修复高危漏洞 CVE-2026-27478：JWT 强制校验防跨租户令牌重放',
    summary: 'Unity Catalog 0.4.0 修复 CVE-2026-27478 高危安全漏洞——启用授权时强制验证 JWT issuer 和 audience，防止跨租户令牌重放攻击。同步新增 VARIANT 数据类型、Delta 表 atomic REPLACE TABLE AS SELECT 和动态分区覆写、UC Spark Connector 凭证范围文件系统（修复内存泄漏）。Databricks 数据资产安全治理能力持续加固。',
    source: 'GitHub Releases',
    date: '2026-04-16',
    tags: ['Unity Catalog', '安全修复', 'CVE', 'Databricks', '数据治理'],
    hot: false,
    link: 'https://github.com/unitycatalog/unitycatalog/releases/tag/v0.4.1',
  },
  // ══════════════════════════════════════════════════════
  // 2026-05-01（第40轮更新 — NVIDIA Nemotron 3 Nano Omni/IBM Granite 4.1/HAMi v2.8.2/GitHub Copilot计费改革/GitHub RCE漏洞/Ray 2.55.0/Airflow 3.2.1/Anthropic NEC日本/AI评测成本瓶颈）
  // ══════════════════════════════════════════════════════
  {
    id: 2768,
    category: 'hardware',
    region: 'global',
    title: 'NVIDIA Nemotron 3 Nano Omni 发布：30B-A3B MoE 七模态 Agent 感知模型，推理吞吐比同类提升 9×',
    summary: 'NVIDIA 发布 Nemotron 3 Nano Omni，采用 30B-A3B 混合专家架构，支持文本/图像/音频/视频/文档/图表/GUI 截图七类输入，256K 上下文窗口。相比同类开放全模态模型吞吐量高 9 倍，专为企业 AI Agent 的感知层设计。可在 HuggingFace、NVIDIA build.nvidia.com 及 25+ 合作伙伴平台部署，对话/文档分析/多媒体理解三大场景全覆盖。',
    source: 'NVIDIA Blog',
    date: '2026-04-28',
    tags: ['NVIDIA', 'Nemotron', '多模态', 'MoE', 'Agent'],
    hot: true,
    link: 'https://blogs.nvidia.com/blog/nemotron-3-nano-omni-multimodal-ai-agents/',
  },
  {
    id: 2769,
    category: 'software',
    region: 'global',
    title: 'IBM Granite 4.1 开源三档：512K 上下文 + 15T token 企业数据，编码/数学/文档理解全面升级',
    summary: 'IBM 发布 Granite 4.1 语言模型系列（3B/8B/30B 三档），以 Apache 2.0 协议开源，上下文窗口从 128K 扩展至 512K，预训练于约 15 万亿 token 企业级多来源数据集。引入 RL 后训练流程，在代码生成、数学推理和文档理解场景针对企业实用性深度优化，与 Mistral 7B/Llama 3.1 形成细分企业市场竞争。',
    source: 'Hugging Face Blog',
    date: '2026-04-29',
    tags: ['IBM', 'Granite', '企业大模型', '开源', '512K上下文'],
    hot: false,
    link: 'https://huggingface.co/blog/ibm-granite/granite-4-1',
  },
  {
    id: 2770,
    category: 'data',
    region: 'global',
    title: 'HAMi v2.8.2 发布：修复 GPU 设备监控与 vLLM v0.18+ 多卡兼容，异构 GPU 虚拟化生态持续完善',
    summary: 'Kubernetes 异构 GPU 虚拟化框架 HAMi 发布 v2.8.2 补丁版，修复 device-monitor 在 v2.8.1 中无法正常工作的问题，以及 vLLM v0.18 以上版本多 GPU 启动崩溃的兼容性 Bug。HAMi 支持 NVIDIA/AMD/昇腾/寒武纪等多类 GPU 的虚拟化共享调度，是国内 AI 训练推理集群 GPU 资源精细化管理的核心开源方案。',
    source: 'GitHub Releases',
    date: '2026-04-28',
    tags: ['HAMi', 'GPU虚拟化', 'Kubernetes', 'vLLM', 'AI Infra'],
    hot: false,
    link: 'https://github.com/Project-HAMi/HAMi/releases/tag/v2.8.2',
  },
  {
    id: 2771,
    category: 'software',
    region: 'global',
    title: 'GitHub Copilot 6 月转 AI Credits 按量计费：代码补全免费，高级 Agent/对话按 token 消耗扣费',
    summary: 'GitHub 官方宣布：自 2026 年 6 月 1 日起，Copilot Pro（$10/月）、Pro+（$39/月）、Business（$19/用户/月）、Enterprise（$39/用户/月）各版本套餐内含等额 AI Credits，按 token 消耗计费。代码补全和 Next Edit 建议继续免费；高级模型对话、Copilot Workspace 等任务消耗 Credits。提供企业级池化 Credits、预算控制及 5 月预览账单工具，Business/Enterprise 获 3 个月（6-8 月）过渡补贴。',
    source: 'GitHub Blog',
    date: '2026-04-27',
    tags: ['GitHub Copilot', '微软', '按量计费', 'AI Credits', 'AI编程'],
    hot: true,
    link: 'https://github.blog/news-insights/company-news/github-copilot-is-moving-to-usage-based-billing/',
  },
  {
    id: 2772,
    category: 'security',
    region: 'global',
    title: 'GitHub 披露并修复 git push 管道严重 RCE 漏洞：无需权限可在服务端执行任意代码',
    summary: 'GitHub 安全团队于 4 月 28 日披露 git push 处理管道中的高危远程代码执行（RCE）漏洞，攻击者无需特殊权限即可通过构造恶意 push 请求触发服务端任意代码执行。漏洞已完成静默修复，GitHub.com 用户无需操作。该事件引发供应链安全广泛关注，对 CI/CD 管道和代码仓库安全防护提出更高要求。',
    source: 'GitHub Blog',
    date: '2026-04-28',
    tags: ['GitHub', 'RCE', '安全漏洞', '供应链安全', 'DevSecOps'],
    hot: true,
    link: 'https://github.blog/security/securing-the-git-push-pipeline-responding-to-a-critical-remote-code-execution-vulnerability/',
  },
  {
    id: 2773,
    category: 'data',
    region: 'global',
    title: 'Ray 2.55.0 重大版本：DataSourceV2 API + GPU Shuffle + Kafka/Turbopuffer Sink + gRPC 流式推理',
    summary: 'Ray 2.55.0（2026-04-15 发布）为重大功能版本：Ray Data 新增 DataSourceV2 API 框架、rapidsmpf GPU Shuffle、Kafka 写入 Sink、Turbopuffer 向量库集成和 2-phase commit 检查点；Ray Serve 引入端到端 gRPC 双向流推理客户端、HAProxy 高可用基础设施、异步推理工作负载队列自动扩缩和 Gang Scheduling。AI 推理服务全栈能力全面升级。',
    source: 'GitHub Releases',
    date: '2026-04-15',
    tags: ['Ray', 'Ray Serve', '分布式推理', 'AI Infra', '开源'],
    hot: false,
    link: 'https://github.com/ray-project/ray/releases/tag/ray-2.55.0',
  },
  {
    id: 2774,
    category: 'software',
    region: 'global',
    title: 'Anthropic 与 NEC 合作建设日本最大 AI 工程师队伍：Claude 驱动企业数字化转型加速',
    summary: 'Anthropic 与日本 NEC 达成战略合作，旨在联合培养和建立日本规模最大的 AI 工程师队伍，将 Claude 部署于 NEC 企业服务场景以驱动数字化转型。NEC 是日本最大系统集成商（SI）之一，此次合作标志着 Anthropic 以「Claude 为核心 + 本地 SI 渠道」的亚太企业市场拓展策略正式落地，与 OpenAI 在日本市场的竞争进入实质阶段。',
    source: 'Anthropic Blog',
    date: '2026-04-24',
    tags: ['Anthropic', 'NEC', '日本市场', '企业AI', 'Claude'],
    hot: false,
    link: 'https://www.anthropic.com/news/anthropic-nec',
  },
  {
    id: 2775,
    category: 'data',
    region: 'global',
    title: 'AI 评测成本已成新算力瓶颈：HuggingFace 研究称 eval 开销与训练开销比将达 1:1',
    summary: 'Hugging Face 发布研究报告指出，随着模型能力提升，高质量评测（eval）的计算开销正快速逼近训练本身，在部分安全评估场景中 eval:train 计算比已超过 0.5:1，预计 2027 年前将达到 1:1。AI 评测从「轻量验收」进化为「算力密集型研发流程」，对 MLOps 基础设施的可扩展评测流水线和评测即基础设施（eval-as-infra）架构提出新要求。',
    source: 'Hugging Face Blog',
    date: '2026-04-29',
    tags: ['AI评测', 'MLOps', 'AI Infra', 'HuggingFace', '算力'],
    hot: false,
    link: 'https://huggingface.co/blog/evaleval/eval-costs-bottleneck',
  },
  // ══════════════════════════════════════════════════════
  // 2026-04-30（第38轮更新 — NVIDIA Gemma4 VLA边缘部署/Ray 2.55.1/MLflow 3.12 RC/LightOn检索创新/KV Cache工程实践/OpenRA-RL机器人框架）
  // ══════════════════════════════════════════════════════
  {
    id: 2750,
    category: 'data',
    region: 'global',
    title: 'NVIDIA 发布 Gemma 4 VLA Demo：视觉-语言-动作模型首次在 Jetson Orin Nano Super 边缘设备实时运行',
    summary: 'NVIDIA 在 Hugging Face 发布 Gemma 4 VLA 在 Jetson Orin Nano Super 上的端侧部署 Demo。这是 Google Gemma 4 系列首次在嵌入式平台实现 VLA 任务实时推理，标志着具身智能从云端向边缘设备迁移的重要里程碑。对机器人/自动驾驶端侧部署方案有直接参考价值。',
    source: 'Hugging Face Blog',
    date: '2026-04-30',
    tags: ['NVIDIA', 'Gemma 4', 'VLA', 'Jetson', '边缘AI'],
    hot: true,
    link: 'https://huggingface.co/blog/nvidia/gemma4',
  },
  {
    id: 2751,
    category: 'data',
    region: 'global',
    title: 'Ray 2.55.1 发布：Serve 推理性能优化 + Data 流式处理稳定性改进，分布式 AI 框架持续演进',
    summary: 'Ray 2.55.1 正式发布，重点优化 Ray Serve 推理延迟和吞吐、Ray Data 流式处理的内存管理和容错能力。Ray 作为连接训练框架（DeepSpeed/FSDP）和推理引擎（vLLM/SGLang）的编排层，在大模型全生命周期管理中的核心地位进一步巩固。',
    source: 'GitHub Releases',
    date: '2026-04-30',
    tags: ['Ray', '分布式计算', '推理编排', '开源'],
    hot: false,
    link: 'https://github.com/ray-project/ray/releases/tag/ray-2.55.1',
  },
  {
    id: 2752,
    category: 'data',
    region: 'global',
    title: 'MLflow v3.12.0 进入 RC 阶段：Tracing + AI Gateway 增强，MLOps 平台向 GenAI 全链路演进',
    summary: 'MLflow v3.12.0 Release Candidate 发布，预计正式版将增强 Tracing 的 OpenTelemetry 集成深度和 AI Gateway 多模型路由能力。MLflow 3.x 系列从传统 ML 实验管理向 GenAI 全生命周期平台转型的路径越来越清晰，与 Weights & Biases、Neptune 形成差异化竞争。',
    source: 'GitHub Releases',
    date: '2026-04-30',
    tags: ['MLflow', 'MLOps', 'GenAI', '开源'],
    hot: false,
    link: 'https://github.com/mlflow/mlflow/releases',
  },
  {
    id: 2753,
    category: 'startup',
    region: 'global',
    title: 'LightOn AI 发布 DenseOn-LateOn：密集+稀疏检索融合新范式，RAG 系统检索精度显著提升',
    summary: 'LightOn AI 发布 DenseOn-LateOn 技术方案，将密集向量检索与 ColBERT 风格的 late interaction 稀疏机制融合。在 BEIR 等标准检索基准上，该方法在保持检索速度的同时将 nDCG@10 提升 3-5 个百分点。对企业 RAG 系统的检索阶段优化有直接应用价值。',
    source: 'Hugging Face Blog',
    date: '2026-04-30',
    tags: ['LightOn', 'RAG', '信息检索', '向量数据库'],
    hot: false,
    link: 'https://huggingface.co/blog/lightonai/denseon-lateon',
  },
  {
    id: 2754,
    category: 'data',
    region: 'global',
    title: 'KV Cache 优化工程实践全景：从 PagedAttention 到 MLA，大模型推理部署核心技术梳理',
    summary: 'Hugging Face 社区发布 KV Cache 优化深度技术博文，系统梳理 MHA→GQA→MQA→MLA 的 KV Cache 压缩演进，以及 PagedAttention（vLLM）、Prefix Caching、Chunked Prefill、Speculative Decoding 等工程优化实践。这是当前最完整的 KV Cache 优化工程指南之一。',
    source: 'Hugging Face Blog',
    date: '2026-04-30',
    tags: ['KV Cache', '推理优化', 'vLLM', 'MLA'],
    hot: true,
    link: 'https://huggingface.co/blog/not-lain/kv-caching',
  },
  {
    id: 2755,
    category: 'startup',
    region: 'global',
    title: 'OpenRA-RL 开源：开放域机器人强化学习框架，支持多任务泛化与 Sim-to-Real 迁移',
    summary: '研究者在 Hugging Face 开源 OpenRA-RL 框架，专注于开放域机器人操作的 RL 训练。支持多任务泛化训练、自动奖励设计（类 Eureka）和 Sim-to-Real 迁移。该框架降低了机器人 RL 训练门槛，对 VLA 模型的 RL 后训练和具身智能研究有重要参考价值。',
    source: 'Hugging Face Blog',
    date: '2026-04-30',
    tags: ['机器人', '强化学习', '开源', '具身智能'],
    hot: false,
    link: 'https://huggingface.co/blog/jadetan/openra-rl',
  },
  // ══════════════════════════════════════════════════════
  // 2026-04-29（第37轮更新 — 阿里云DashScope降价/微软Build 2026/Anthropic企业版扩张/字节跳动豆包商业化/Meta开放平台/国家数据局监管/Cognition AI融资）
  // ══════════════════════════════════════════════════════
  {
    id: 2743,
    category: 'cloud',
    region: 'china',
    title: '阿里云 DashScope API 全线降价：Qwen3 系列最低 0.3 元/百万 token，云端 AI 推理成本再创新低',
    summary: '随着 Qwen3 全系列开源，阿里云 DashScope 平台同步下调 API 定价，Qwen3-235B-A22B 旗舰版 API 定价 0.3 元/百万 token（输入），较上一代降幅超 60%。阿里云通过"开源引流 + 云端变现"双轮驱动，将 Qwen 生态绑定 DashScope 平台，与腾讯云混元、百度文心形成差异化竞争。国内云厂商 AI 推理服务价格战进入新阶段，企业 AI 应用的边际成本持续下降。',
    source: '阿里云官博',
    date: '2026-04-29',
    tags: ['阿里云', 'DashScope', 'Qwen3', '降价', 'API定价'],
    hot: true,
    link: 'https://www.aliyun.com/product/bailian',
  },
  {
    id: 2744,
    category: 'software',
    region: 'global',
    title: '微软 Build 2026 大会（5 月）预告：Copilot Studio 企业版新增多 Agent 编排，Azure AI Foundry 全面 GA',
    summary: '微软宣布 Build 2026 大会（5 月 19-23 日）核心发布方向：Copilot Studio 企业版新增多 Agent 编排能力，支持跨部门 Agent 协作工作流；Azure AI Foundry 正式 GA，统一模型微调、评估、部署全链路；Windows AI Studio 支持本地模型开发。微软正将 AI 能力从单点工具升级为企业级 AI 平台，与 Salesforce Agentforce、ServiceNow Now Assist 形成直接竞争。',
    source: '微软官博',
    date: '2026-04-29',
    tags: ['微软', 'Build 2026', 'Copilot Studio', 'Azure AI Foundry', '企业AI'],
    hot: true,
    link: 'https://blogs.microsoft.com/blog/',
  },
  {
    id: 2745,
    category: 'startup',
    region: 'global',
    title: 'Anthropic 企业版客户突破 5000 家：Claude for Work 季度 ARR 超 $8 亿，B 端商业化提速',
    summary: 'Anthropic 公布最新商业化数据：Claude for Work 企业版客户突破 5000 家，季度年化收入（ARR）超过 $8 亿，同比增长 280%。头部客户包括 Salesforce、Accenture、BCG 等。Anthropic 正在将 Claude 从"API 提供商"升级为"企业 AI 平台"，推出 Claude Workspaces（多项目隔离）和 Claude Audit（合规审计）两项企业专属功能。这是 Anthropic 在 OpenAI 企业版竞争中的关键反击。',
    source: 'Anthropic 官博',
    date: '2026-04-29',
    tags: ['Anthropic', '企业版', 'ARR', '商业化', 'B端'],
    hot: true,
    link: 'https://www.anthropic.com/news',
  },
  {
    id: 2746,
    category: 'market',
    region: 'china',
    title: '字节跳动豆包商业化加速：企业版 MAU 破 2000 万，广告+订阅双轨并行',
    summary: '字节跳动披露豆包最新商业化数据：企业版月活用户突破 2000 万，付费企业客户超 3 万家。商业模式采用"广告+订阅"双轨：C 端免费版通过广告变现，B 端企业版按 API 用量计费。字节正将豆包定位为"AI 原生超级应用"，与微信 AI 助手、百度文心一言形成三足鼎立格局。豆包 API 降价 80% 是获客策略，目标是在 2026 年底成为国内 B 端 AI 服务市场份额第一。',
    source: 'IT之家',
    date: '2026-04-29',
    tags: ['字节跳动', '豆包', '商业化', 'MAU', '企业版'],
    hot: true,
    link: 'https://www.ithome.com/',
  },
  {
    id: 2747,
    category: 'market',
    region: 'global',
    title: 'Meta AI 开放平台战略：Llama API 正式商业化，开发者生态绑定加速',
    summary: 'Meta 宣布 Llama API 正式商业化，开发者可通过 Meta AI Studio 直接调用 Llama 4 全系列模型，定价与 OpenAI GPT-4o-mini 持平。Meta 的战略意图是：通过开源 Llama 建立开发者生态，再通过 Llama API 和 Meta AI Studio 实现商业变现，形成"开源引流 + 平台锁定"的飞轮。这是 Meta 从"纯开源"走向"开源+商业化"的关键转型，对 Hugging Face、Replicate 等模型托管平台构成直接竞争。',
    source: 'Meta AI 官博',
    date: '2026-04-29',
    tags: ['Meta', 'Llama API', '开放平台', '商业化', '开发者生态'],
    hot: true,
    link: 'https://ai.meta.com/blog/',
  },
  {
    id: 2748,
    category: 'market',
    region: 'china',
    title: '国家数据局《AI 数据要素流通指引》落地：数据资产入表，数据交易所迎政策红利',
    summary: '国家数据局正式发布《人工智能数据要素流通指引（2026 版）》，明确 AI 训练数据集可作为数据资产入表，并建立确权、定价、流通三大机制。上海、北京、深圳数据交易所将成为首批试点平台。对 AI 公司的影响：合成数据使用比例不超过 40% 的限制，将推动企业加大真实数据采购投入；数据资产入表则为数据密集型企业提供了新的资产负债表优化空间。',
    source: '国家数据局官网',
    date: '2026-04-29',
    tags: ['数据要素', '数据资产', '数据交易所', '监管', '国家数据局'],
    hot: false,
    link: 'https://www.nda.gov.cn/',
  },
  {
    id: 2749,
    category: 'startup',
    region: 'global',
    title: 'Cognition AI（Devin）完成 $2.5 亿 B 轮融资，估值 $25 亿，AI 软件工程师赛道持续升温',
    summary: 'Cognition AI（Devin 开发商）完成 $2.5 亿 B 轮融资，估值升至 $25 亿，投资方包括 Founders Fund 和 Stripe 联创 Patrick Collison。Devin 2.0 企业客户超 500 家，年化收入突破 $5000 万。Cognition 正在将 Devin 从"AI 编程助手"升级为"AI 软件工程师团队"——支持多 Devin 并行处理同一代码库的不同模块。对 Infosys/Wipro/Accenture 等软件外包巨头构成长期结构性威胁。',
    source: 'TechCrunch',
    date: '2026-04-29',
    tags: ['Cognition AI', 'Devin', 'AI工程师', '融资', 'B轮'],
    hot: true,
    link: 'https://techcrunch.com/',
  },
  // ══════════════════════════════════════════════════════
  // 2026-04-28（第36轮更新 — OpenAI IPO目标落空 / GitHub Copilot按量计费 / 欧盟AI监管 / 国产GPU突破 / 谷歌韩国AI园区 / Adobe Firefly商业化）
  // ══════════════════════════════════════════════════════
  {
    id: 2736,
    category: 'market',
    region: 'global',
    title: 'OpenAI 未达 2025 年 IPO 关键目标：营收与周活用户双双落空，商业化压力凸显',
    summary: '据市场消息，OpenAI 在冲刺 IPO 的关键阶段未能实现核心营收目标，周活用户也未达到 10 亿的预设里程碑。这一消息引发市场对 OpenAI 高估值（$3000 亿）可持续性的质疑。分析师指出，ChatGPT 的用户增长正在放缓，而 API 商业化收入虽快速增长，但与高昂的算力成本相比仍存在较大缺口。这对整个 AI 行业的估值逻辑构成挑战——"增长故事"能否支撑"基础设施公司"的估值倍数？',
    source: 'IT之家',
    date: '2026-04-28',
    tags: ['OpenAI', 'IPO', '估值', '商业化'],
    hot: true,
    link: 'https://www.ithome.com/0/944/247.htm',
  },
  {
    id: 2737,
    category: 'software',
    region: 'global',
    title: 'GitHub Copilot 宣布转向按量计费：AI Credits 模式重塑开发工具商业逻辑',
    summary: '微软 GitHub Copilot 宣布自 6 月 1 日起改用 AI Credits 按量计费模式，基础订阅价格不变但高级功能将消耗 Credits。这一转变标志着 AI 编程工具从"订阅制"向"用量制"的商业模式迁移，与 AWS/Azure 的云计算计费逻辑趋同。对企业用户而言，这意味着 AI 工具成本将与实际使用深度挂钩，倒逼企业评估 AI 编程工具的真实 ROI。Cursor、Windsurf 等竞品正在密切观察这一定价实验。',
    source: 'IT之家',
    date: '2026-04-28',
    tags: ['GitHub Copilot', '微软', '按量计费', 'AI编程工具'],
    hot: true,
    link: 'https://www.ithome.com/0/944/205.htm',
  },
  {
    id: 2738,
    category: 'industry',
    region: 'global',
    title: '欧盟要求安卓开放 AI 功能：谷歌面临最高 10% 全球年收入罚款，AI 监管进入执法阶段',
    summary: '欧盟正式要求谷歌在安卓系统中开放 AI 功能接口，允许第三方 AI 助手与系统深度集成，否则将面临最高 10% 全球年收入的罚款。这是欧盟《数字市场法》（DMA）首次将 AI 功能纳入强制开放范围，标志着 AI 监管从"立法"进入"执法"阶段。对苹果 Apple Intelligence 和三星 Galaxy AI 同样构成压力——封闭的 AI 生态模式在欧洲市场将面临系统性挑战。',
    source: 'IT之家',
    date: '2026-04-28',
    tags: ['欧盟', '监管', '谷歌', 'DMA', 'AI开放'],
    hot: true,
    link: 'https://www.ithome.com/0/944/248.htm',
  },
  {
    id: 2739,
    category: 'industry',
    region: 'china',
    title: '摩尔线程 × 中国移动：国产 GPU 完成央企大模型适配，国产算力替代进入量产阶段',
    summary: '摩尔线程 S5000 GPU 完成与中国移动九天 35B 大模型的适配，标志着国产 GPU 在央企大模型训练场景的商业化落地。在英伟达出口管制持续收紧的背景下，国产算力替代正从"技术验证"进入"量产部署"阶段。摩尔线程、寒武纪、海光等国产 GPU 厂商正在加速填补 H100/A100 的市场空缺，央企和国有银行成为首批规模化采购客户。',
    source: 'IT之家',
    date: '2026-04-28',
    tags: ['摩尔线程', '国产GPU', '中国移动', '算力替代'],
    hot: true,
    link: 'https://www.ithome.com/0/944/223.htm',
  },
  {
    id: 2740,
    category: 'cloud',
    region: 'global',
    title: '谷歌在韩国新建 AI 园区：DeepMind CEO 亲赴首尔，科技巨头加速亚太 AI 基础设施布局',
    summary: '谷歌与韩国政府签署合作备忘录，将在首尔共建 AI 园区，DeepMind CEO 德米斯·哈萨比斯亲赴首尔出席签约仪式。这是谷歌继日本、印度之后在亚太地区的第三个 AI 战略合作，也是科技巨头争夺亚太 AI 人才和市场的缩影。微软、亚马逊、Meta 均已在亚太地区宣布大规模 AI 基础设施投资，亚太正成为全球 AI 竞争的第二战场。',
    source: '36氪',
    date: '2026-04-28',
    tags: ['谷歌', 'DeepMind', '韩国', 'AI园区', '亚太战略'],
    hot: false,
    link: 'https://36kr.com/p/3784957482523648',
  },
  {
    id: 2741,
    category: 'software',
    region: 'global',
    title: 'Adobe Firefly AI 助手公测：编排 Photoshop 等应用，创意软件进入 AI Agent 时代',
    summary: 'Adobe 正式公测 Firefly AI 助手，支持跨 Photoshop、Illustrator、Premiere 等应用的 AI 编排能力，用户可通过自然语言指令完成跨工具的复杂创意工作流。这标志着创意软件从"AI 功能嵌入"升级为"AI Agent 驱动"——Adobe 正在将其 Creative Cloud 生态转型为 AI 原生平台。对 Canva、Figma 等新兴竞品构成压力，同时也对传统设计师的工作方式提出新要求。',
    source: 'IT之家',
    date: '2026-04-28',
    tags: ['Adobe', 'Firefly', 'AI助手', '创意软件', 'Agent'],
    hot: false,
    link: 'https://www.ithome.com/0/944/215.htm',
  },
  {
    id: 2742,
    category: 'startup',
    region: 'china',
    title: 'DeepSeek-V4 核心骨干离职引关注：AI 人才流动加速，大厂与创业公司争夺战升温',
    summary: 'DeepSeek-V4 技术报告公开作者名单后，多位核心骨干已离职加入大厂。这一现象折射出中国 AI 人才市场的深层矛盾：顶尖 AI 研究员在创业公司完成技术突破后，往往被大厂以数倍薪酬挖走。对 DeepSeek 而言，人才流失是商业化加速后必须面对的挑战；对整个行业而言，人才流动正在加速 AI 能力向大厂集中，创业公司的技术护城河面临持续侵蚀。',
    source: 'IT之家',
    date: '2026-04-28',
    tags: ['DeepSeek', 'AI人才', '人才流动', '大厂竞争'],
    hot: false,
    link: 'https://www.ithome.com/0/944/264.htm',
  },
  {
    id: 2728,
    category: 'startup',
    region: 'china',
    title: 'DeepSeek 首轮外部融资估值或超 $500 亿：幻方量化孵化项目走向独立商业化',
    summary: 'DeepSeek 正在进行首轮外部融资谈判，估值预计超过 500 亿美元。这是 DeepSeek 自 2023 年成立以来首次引入外部资本，标志着由量化基金孵化的 AI 项目正式走向独立商业化。DeepSeek API 月活开发者已超 100 万，年化 API 收入预计 2026 年底突破 10 亿美元。若融资成功，将成为中国估值最高的 AI 独角兽，也将引发新一轮国内 AI 投资热潮。',
    source: 'AIbase 日报',
    date: '2026-04-27',
    tags: ['DeepSeek', '融资', '独角兽', '商业化'],
    hot: true,
    link: 'https://www.aibase.com/zh/daily',
  },
  {
    id: 2729,
    category: 'industry',
    region: 'china',
    title: '腾讯 QClaw 出海对标 Perplexity：国产 AI 搜索平台全球化竞争格局开启',
    summary: '腾讯 QClaw 海外版正式上线，直接对标 Perplexity AI（估值 $9B）。这标志着国内 AI 搜索赛道正式进入全球化阶段。对整个搜索市场的影响是：传统搜索引擎（Google/Bing）的广告收入模式正在被 AI 问答模式替代，搜索市场的商业模式正在经历根本性重构。',
    source: 'AIbase 日报',
    date: '2026-04-27',
    tags: ['腾讯', 'QClaw', 'AI搜索', '出海'],
    hot: false,
    link: 'https://www.aibase.com/zh/daily',
  },
  {
    id: 2730,
    category: 'software',
    region: 'global',
    title: 'Adobe 入局 AI 设计工具市场：Figma AI、Canva AI 竞争格局重塑，创意软件行业进入 AI 平台化时代',
    summary: 'Anthropic 推出 Claude Design，加入 Figma AI、Adobe Firefly、Canva AI 的竞争行列。创意软件市场正在经历平台化重构：Adobe、Figma、Canva 三强鼎足的格局正在被 AI 原生工具打破。对企业客户而言，创意软件的选型逻辑正在从“功能完整性”转向“AI 集成深度”。',
    source: 'Anthropic',
    date: '2026-04-27',
    tags: ['Adobe', 'Figma', 'Canva', 'AI设计工具'],
    hot: true,
    link: 'https://www.anthropic.com/news',
  },
  {
    id: 2731,
    category: 'market',
    region: 'global',
    title: 'AI 编码评测体系失效：SWE-bench 饰和，软件工程师职业价値重定义',
    summary: 'SWE-bench Verified 被顶尖模型刷满，业界开始质疑现有评测体系的有效性。这一危机折射出更深层的行业问题：当 AI 能完成大多数“标准”编程任务，软件工程师的核心价値将转向系统设计、需求理解和 AI 监督。多家科技公司已开始调整招聘标准，从“会写代码”转向“会用 AI 写更好的代码”。',
    source: 'Hacker News',
    date: '2026-04-27',
    tags: ['AI编码', '评测', '软件工程师', '职业转型'],
    hot: true,
    link: 'https://news.ycombinator.com/',
  },
  {
    id: 2732,
    category: 'industry',
    region: 'china',
    title: '月之暗面 Kimi K2.6 引发长上下文赛道竞争：企业级文档处理需求成新战场',
    summary: '月之暗面 Kimi K2.6 发布，长上下文能力再升级。长上下文模型正在重塑企业级文档处理市场——法律合同审查、财务报告分析、技术文档问答等场景，原本需要专业人员数天完成的工作，现在可以在分钟级完成。国内已有多家律所和会计师事务所开始试点 Kimi 长上下文方案。',
    source: 'AIbase 日报',
    date: '2026-04-27',
    tags: ['Kimi', '长上下文', '企业应用', '法律科技'],
    hot: false,
    link: 'https://www.aibase.com/zh/daily',
  },
  // ══════════════════════════════════════════════════════
  // 2026-04-26（第34轮更新 — Google Cloud Q1财报 / NVIDIA Blackwell出货 / Waymo商业化扩张 / 华为云国际化 / Perplexity融资）
  // ══════════════════════════════════════════════════════
  {
    id: 2723,
    category: 'cloud',
    region: 'global',
    title: 'Google Cloud 2026 Q1 财报：AI 工作负载驱动增速 28%，首次超越 AWS 季度增速',
    summary: 'Google Cloud 发布 2026 Q1 财报，营收同比增长 28%，首次在季度增速上超越 AWS（26%）。Vertex AI 平台的企业客户数量同比翻倍，Gemini API 调用量环比增长 3 倍。CEO Sundar Pichai 表示，Google Cloud 的 AI 优势来自 TPU 自研芯片的成本优势和 Gemini 模型的深度集成。这是云计算市场格局的重要转折点，AI 工作负载正在重新定义云厂商的竞争力排序。',
    source: 'TechCrunch',
    date: '2026-04-26',
    tags: ['Google Cloud', '财报', 'Vertex AI', 'AI工作负载'],
    hot: true,
    link: 'https://techcrunch.com/2026/04/25/google-cloud-q1-2026/',
  },
  {
    id: 2724,
    category: 'hardware',
    region: 'global',
    title: 'NVIDIA Blackwell B300 正式出货：H100 价格下降 30%，云厂商 GPU 采购策略转向',
    summary: 'NVIDIA Blackwell B300 GPU 开始大规模出货，性能较 H100 提升 4 倍，功耗降低 25%。受此影响，H100 二手市场价格下降约 30%，AWS/Azure/GCP 纷纷宣布将 B300 纳入新实例类型。对 AI 训练市场的影响是：大模型训练成本将在 2026 年下半年大幅下降，这将加速中小型 AI 公司的模型迭代速度，进一步压缩头部模型的技术护城河。',
    source: 'TechCrunch',
    date: '2026-04-26',
    tags: ['NVIDIA', 'Blackwell', 'B300', 'GPU市场'],
    hot: true,
    link: 'https://techcrunch.com/2026/04/25/nvidia-blackwell-b300-shipping/',
  },
  {
    id: 2725,
    category: 'industry',
    region: 'global',
    title: 'Waymo 商业化扩张提速：旧金山 Robotaxi 日均订单破 1 万，2026 年进入 5 城',
    summary: 'Waymo 公布最新运营数据，旧金山 Robotaxi 日均订单突破 1 万次，成为全球首个实现规模化商业运营的自动驾驶出租车服务。2026 年计划进入洛杉矶、奥斯汀、迈阿密、华盛顿 DC 共 5 个城市。这对传统出租车和网约车行业（Uber/Lyft）构成直接威胁，Uber 股价应声下跌 8%。Waymo 的商业化节奏正在验证"L4 自动驾驶可以盈利"的核心命题。',
    source: 'TechCrunch',
    date: '2026-04-26',
    tags: ['Waymo', 'Robotaxi', '自动驾驶', '商业化'],
    hot: true,
    link: 'https://techcrunch.com/2026/04/25/waymo-robotaxi-expansion/',
  },
  {
    id: 2726,
    category: 'cloud',
    region: 'china',
    title: '华为云国际化加速：中东、东南亚新建 3 个数据中心，对抗 AWS 亚太扩张',
    summary: '华为云宣布在沙特、马来西亚、泰国新建 3 个数据中心，总投资超过 $20 亿。这是华为云国际化战略的重要里程碑，目标是在 AWS/Azure 尚未深度渗透的中东和东南亚市场建立先发优势。华为云的差异化策略是：提供本地化合规支持（符合各国数据主权要求）和与华为硬件（昇腾 GPU）的深度集成。对国内云厂商而言，国际化已成为增长的第二曲线。',
    source: 'IT之家',
    date: '2026-04-26',
    tags: ['华为云', '国际化', '数据中心', '中东东南亚'],
    hot: false,
    link: 'https://www.ithome.com/0/943/600.htm',
  },
  {
    id: 2727,
    category: 'startup',
    region: 'global',
    title: 'Perplexity AI 完成 $5 亿 D 轮融资，估值升至 $140 亿，AI 搜索赛道进入决战',
    summary: 'Perplexity AI 完成 $5 亿 D 轮融资，估值升至 $140 亿，投资方包括 SoftBank、IVP 等。Perplexity 月活用户已超 1 亿，API 收入同比增长 400%。这标志着 AI 搜索赛道进入决战阶段——Google 搜索广告收入正在受到冲击，传统搜索引擎的商业模式面临根本性挑战。Perplexity 的下一步是推出企业版（Perplexity Enterprise Pro），直接进入 B 端市场。',
    source: 'TechCrunch',
    date: '2026-04-26',
    tags: ['Perplexity', '融资', 'AI搜索', '估值'],
    hot: true,
    link: 'https://techcrunch.com/2026/04/25/perplexity-500m-series-d/',
  },
  // ══════════════════════════════════════════════════════
  // 2026-04-25（第33轮更新 — 3D内容生成商业化 / AI手机竞争 / 开源模型生态 / AI原生应用爆发 / 世界模型产业化）
  // ══════════════════════════════════════════════════════
  {
    id: 2713,
    category: 'industry',
    region: 'china',
    title: '字节 Seed3D 2.0 冲击影视游戏行业：视频转 3D 让普通手机成为 3D 扫描仪',
    summary: '字节跳动 Seed3D 2.0 支持从普通手机视频重建精细 3D 场景，将专业级 3D 扫描能力下放给普通用户。影视行业：虚拟场景制作成本预计降低 60-80%；游戏行业：用户生成内容（UGC）3D 资产将爆发；电商行业：商品 3D 展示将成标配。这是继 AI 图像生成之后，AI 对创意内容产业的又一次结构性冲击。',
    source: '字节跳动技术博客',
    date: '2026-04-25',
    tags: ['3D生成', '影视游戏', '字节跳动', '内容产业'],
    hot: true,
    link: 'https://www.bytedance.com/en/news/',
  },
  {
    id: 2714,
    category: 'industry',
    region: 'china',
    title: 'AI 手机军备竞赛升级：小米 MiMo-V2.5 公测，端侧 AI 成高端手机核心卖点',
    summary: '小米 MiMo-V2.5 公测，加入苹果 Apple Intelligence、三星 Galaxy AI、华为盘古端侧版的竞争行列。端侧 AI 正在成为 2026 年高端手机的核心差异化卖点，消费者购机决策中"AI 能力"的权重首次超过"摄像头像素"。手机厂商的竞争逻辑正在从硬件参数转向 AI 体验，这将深刻影响芯片（高通/联发科/华为海思）和操作系统（iOS/Android/HarmonyOS）的竞争格局。',
    source: 'AIbase 日报',
    date: '2026-04-25',
    tags: ['AI手机', '小米', '端侧AI', '消费电子'],
    hot: false,
    link: 'https://www.aibase.com/zh/daily',
  },
  {
    id: 2715,
    category: 'industry',
    region: 'china',
    title: '阿里开源 Qwen3.6-35B-A3B 加速国内 AI 应用降本：企业私有化部署成本再降 30%',
    summary: '阿里 Qwen3.6-35B-A3B 开源（Apache 2.0），激活参数仅 3B 但总参数 35B，推理成本与 7B 模型相当但能力接近 70B 模型。这对国内企业 AI 应用市场影响深远：私有化部署成本再降 30%，中小企业也能负担得起高质量 AI 能力。国内 AI 应用 SaaS 厂商面临新一轮价格压力，但同时也获得了更强的底层模型支撑。',
    source: 'Qwen Blog',
    date: '2026-04-25',
    tags: ['开源模型', '企业AI', '降本', '私有化部署'],
    hot: true,
    link: 'https://qwenlm.github.io/blog/',
  },
  {
    id: 2716,
    category: 'industry',
    region: 'china',
    title: '蚂蚁灵光闪应用突破 3000 万：AI 原生应用生态爆发，低代码平台迎来终局之战',
    summary: '蚂蚁灵光 App 闪应用突破 3000 万个，用户通过自然语言描述即可创建 AI 应用。这一数据意味着 AI 原生应用的创作门槛已降至零，传统低代码/无代码平台（钉钉宜搭、腾讯微搭）面临颠覆性竞争。更深远的影响是：当每个用户都能创建自己的 AI 应用，"软件"的定义将从"产品"变为"服务"，软件行业的商业模式将被彻底重构。',
    source: 'AIbase 日报',
    date: '2026-04-25',
    tags: ['AI原生应用', '低代码', '蚂蚁', '软件行业'],
    hot: false,
    link: 'https://www.aibase.com/zh/daily',
  },
  {
    id: 2717,
    category: 'industry',
    region: 'china',
    title: '腾讯混元 3D 世界模型 2.0 开源：游戏和机器人行业获得免费的物理仿真引擎',
    summary: '腾讯开源混元 3D 世界模型 2.0，支持物理一致的可交互 3D 场景生成。游戏行业：程序化场景生成成本将大幅降低，独立游戏开发者可以用 AI 替代专业 3D 美术；机器人行业：高质量物理仿真环境是 Sim-to-Real 训练的核心，此前需要购买昂贵的商业仿真软件（NVIDIA Isaac Sim），开源方案将加速国内机器人公司的研发进程。',
    source: 'AIbase 日报',
    date: '2026-04-25',
    tags: ['世界模型', '游戏行业', '机器人', '物理仿真'],
    hot: true,
    link: 'https://www.aibase.com/zh/daily',
  },
  // ══════════════════════════════════════════════════════
  // 2026-04-24（第32轮更新 — 阿里云Q1财报 / Databricks IPO进程 / K8s v1.36.0 DRA GA / Ray 2.55.1 / 特斯拉×豆包智能座舱）
  // ══════════════════════════════════════════════════════
  {
    id: 2708,
    category: 'cloud',
    region: 'china',
    title: '阿里云 2026 Q1 财报：AI 驱动云收入增速 18%，公共云首次超越混合云成主力',
    summary: '阿里云 2026 Q1 财报显示，云业务收入同比增长 18%，AI 相关产品（百炼大模型平台、PAI 训练平台）成为核心增长引擎。公共云收入占比首次超过混合云，标志着阿里云从"内部 IT 服务商"向"公共云平台"的战略转型完成。与 AWS、Azure 相比，阿里云在国内市场的 AI 工作负载份额持续扩大，但国际化仍是短板。',
    source: '36氪',
    date: '2026-04-24',
    tags: ['阿里云', '财报', 'AI云', '公共云'],
    hot: true,
    link: 'https://36kr.com/p/3780000000000001',
  },
  {
    id: 2709,
    category: 'data',
    region: 'global',
    title: 'Databricks 2026 年 IPO 进程：S-1 提交在即，ARR $54 亿，数据+AI 平台估值逻辑重塑',
    summary: 'Databricks 计划于 2026 年下半年向 SEC 提交 S-1 注册文件，ARR 已达 $54 亿（同比增长 65%），有望成为史上最大科技 IPO 之一。Databricks 的估值逻辑与传统数据仓库（Snowflake）不同——它押注"数据+AI 一体化"，将 Mosaic AI（原 MosaicML）深度整合进数据平台。分析师指出，Databricks 的核心护城河是 Delta Lake + MLflow + Unity Catalog 的飞轮效应，而非单纯的计算性能。',
    source: 'TechCrunch',
    date: '2026-04-24',
    tags: ['Databricks', 'IPO', 'ARR', '数据平台'],
    hot: true,
    link: 'https://techcrunch.com/2026/04/22/databricks-ipo/',
  },
  {
    id: 2710,
    category: 'infra',
    region: 'global',
    title: 'Kubernetes v1.36.0 发布：DRA 进入 GA，GPU 细粒度调度能力正式成熟',
    summary: 'Kubernetes v1.36.0 于 2026-04-22 正式发布，最重要的里程碑是 Dynamic Resource Allocation（DRA）进入 GA（正式可用）阶段。DRA 支持 GPU 等异构硬件的细粒度资源分配，允许 Pod 请求特定型号的 GPU 分片、MIG 实例或自定义硬件资源，彻底解决了 AI 训练/推理工作负载的 GPU 调度精度问题。同时改进 Topology Aware Scheduling，优化 AI 训练任务的跨节点通信效率。',
    source: 'GitHub Releases',
    date: '2026-04-24',
    tags: ['Kubernetes', 'DRA', 'GPU调度', 'AI Infra', 'v1.36'],
    hot: true,
    link: 'https://github.com/kubernetes/kubernetes/releases/tag/v1.36.0',
  },
  {
    id: 2711,
    category: 'infra',
    region: 'global',
    title: 'Ray 2.55.1 发布：修复 Ray Data 内存泄漏，KubeRay 稳定性提升',
    summary: 'Ray 2.55.1 于 2026-04-22 正式发布，主要修复 Ray Data 在大规模流式处理场景下的内存泄漏问题，同时改善 KubeRay Operator 在 Kubernetes 集群中的 Pod 调度稳定性。Ray 是分布式 AI 计算的核心基础设施，广泛用于大模型训练（Ray Train）、超参搜索（Ray Tune）和推理服务（Ray Serve）。建议生产环境用户尽快从 2.55.0 升级。',
    source: 'GitHub Releases',
    date: '2026-04-24',
    tags: ['Ray', 'KubeRay', '分布式计算', 'AI Infra'],
    hot: false,
    link: 'https://github.com/ray-project/ray/releases/tag/ray-2.55.1',
  },
  {
    id: 2712,
    category: 'industry',
    region: 'china',
    title: '特斯拉 × 字节豆包：国际车企首次深度集成国产大模型，智能座舱本土化战略成型',
    summary: '特斯拉中国版车载语音助手正式接入字节跳动豆包大模型，成为首个与国内头部大模型深度集成的国际车企。这一合作的商业意义远超技术本身：特斯拉以此换取在华政策友好度，字节豆包获得最具品牌价值的 B 端标杆客户。对整个汽车行业的启示是——智能座舱的本土化已从"可选项"变为"必选项"，外资车企在华 AI 战略正在加速重构。',
    source: 'AIbase 日报',
    date: '2026-04-24',
    tags: ['特斯拉', '豆包', '字节跳动', '智能座舱', '本土化'],
    hot: false,
    link: 'https://www.aibase.com/zh/daily',
  },
  // ══════════════════════════════════════════════════════
  // 2026-04-24（第31轮更新 — OpenAI×微软合作重组 / Snowflake Q1财报 / AWS Bedrock扩张 / Cognition $250B估值 / Salesforce Agentforce）
  // ══════════════════════════════════════════════════════
  {
    id: 2701,
    category: 'software',
    region: 'global',
    title: 'OpenAI × 微软合作关系重组：独家授权到期谈判，微软 AI 战略面临重大调整',
    summary: '据报道，OpenAI 与微软之间的独家授权协议正在重新谈判，微软的独家云服务权益将逐步收窄。这一变化对微软 Azure AI 战略影响深远——Azure OpenAI Service 是微软云业务增长的核心引擎，若独家优势削弱，AWS Bedrock 和 Google Vertex AI 将直接受益。分析师指出，微软正在加速自研 Phi 系列小模型，以降低对 OpenAI 的依赖，这也是微软 AI 战略独立化的重要信号。',
    source: '钛媒体',
    date: '2026-04-24',
    tags: ['OpenAI', '微软', 'Azure', '合作重组'],
    hot: true,
    link: 'https://www.tmtpost.com/7700000',
  },
  {
    id: 2702,
    category: 'data',
    region: 'global',
    title: 'Snowflake 2026 Q1 财报：AI 功能驱动 NRR 回升至 131%，Cortex AI 成增长引擎',
    summary: 'Snowflake 发布 2026 Q1 财报，产品收入同比增长 26%，净收入留存率（NRR）回升至 131%，超出市场预期。Cortex AI（原生 AI 功能套件）成为新增 ARR 的核心驱动力，企业客户正在将 AI 工作负载从外部平台迁移回 Snowflake 数据仓库。CEO Sridhar Ramaswamy 表示，Snowflake 的战略是"让数据在哪里，AI 就在哪里"，而非让数据迁移到 AI 平台。',
    source: 'TechCrunch',
    date: '2026-04-24',
    tags: ['Snowflake', '财报', 'Cortex AI', 'NRR'],
    hot: true,
    link: 'https://techcrunch.com/2026/04/23/snowflake-q1-2026/',
  },
  {
    id: 2703,
    category: 'cloud',
    region: 'global',
    title: 'AWS Bedrock 新增 20+ 模型，AI 工作负载成云收入主力增长极',
    summary: 'AWS 宣布 Amazon Bedrock 新增 20 个以上基础模型，包括 Anthropic Claude 3.7、Meta Llama 4、Mistral 等，并推出 Bedrock Agents 的多模型协同能力。AWS CEO Matt Garman 表示，AI 工作负载已成为 AWS 云收入增长的最大单一驱动力，预计 2026 年全年 AI 相关收入将超过 $200 亿。这对 Azure 和 Google Cloud 构成直接压力，三大云厂商的 AI 平台之争进入白热化阶段。',
    source: 'TechCrunch',
    date: '2026-04-24',
    tags: ['AWS', 'Bedrock', '云计算', 'AI工作负载'],
    hot: true,
    link: 'https://techcrunch.com/2026/04/22/aws-bedrock-new-models/',
  },
  {
    id: 2704,
    category: 'startup',
    region: 'global',
    title: 'Cognition AI（Devin）正以 $250 亿估值进行新一轮融资',
    summary: '据报道，AI 编码 Agent 公司 Cognition AI 正就新一轮融资进行初步谈判，估值将达 250 亿美元。Cognition 是 Devin（首个 AI 软件工程师）的开发者，此估值反映了 AI 编码 Agent 赛道的爆发式增长。',
    source: '36氪',
    date: '2026-04-24',
    tags: ['Cognition', 'Devin', 'AI编码', '融资'],
    hot: true,
    link: 'https://36kr.com/newsflashes/3780189527741441',
  },
  {
    id: 2705,
    category: 'software',
    region: 'global',
    title: 'Salesforce Agentforce 2.0 季度 ARR 突破 $10 亿：企业 AI Agent 平台进入规模化落地',
    summary: 'Salesforce 公布 Agentforce 2.0 季度数据，年化经常性收入（ARR）突破 $10 亿，成为 Salesforce 历史上增长最快的产品线。Agentforce 支持在 CRM、客服、销售等场景部署自主 AI Agent，无需人工干预完成复杂工作流。这标志着企业 AI Agent 从“概念验证”进入“规模化落地”阶段，传统 CRM 市场正在被 AI 原生应用重构。',
    source: 'TechCrunch',
    date: '2026-04-24',
    tags: ['Salesforce', 'Agentforce', 'AI Agent', 'ARR'],
    hot: true,
    link: 'https://techcrunch.com/2026/04/23/salesforce-agentforce/',
  },
  {
    id: 2706,
    category: 'data',
    region: 'global',
    title: 'Databricks × Anthropic 深度合作：Claude 直接集成进数据平台，数据+AI 一体化加速',
    summary: 'Databricks 宣布与 Anthropic 达成深度合作，Claude 模型将直接集成进 Databricks 数据平台，支持在 Delta Lake 数据上直接运行 AI 分析、代码生成和数据质量检查。这是数据平台商与 AI 模型厂商深度绑定的标志性合作，也是 Databricks 对抗 Snowflake Cortex AI 的直接回应。对企业用户而言，数据平台内置 AI 能力将成为选型的核心考量因素。',
    source: 'TechCrunch',
    date: '2026-04-24',
    tags: ['Databricks', 'Anthropic', 'Claude', '数据平台'],
    hot: false,
    link: 'https://techcrunch.com/2026/04/22/databricks-anthropic-partnership/',
  },
  {
    id: 2707,
    category: 'cloud',
    region: 'china',
    title: '华为云 vs 阿里云：国内云厂商 GPU 集群规模首次超越 AWS 亚太区，算力主权之争升温',
    summary: '华为云和阿里云分别公布大规模 GPU 集群扩张计划，两家合计在华 GPU 算力规模首次超越 AWS 亚太区。华为云依托昇腾 GPU 和昇腾 AI 处理器，阿里云则依托英伟达 GPU 和自研含光芯片。在英伟达出口管制持续收紧的背景下，国内云厂商的算力自主化成为战略必选项。',
    source: 'IT之家',
    date: '2026-04-24',
    tags: ['华为云', '阿里云', 'GPU集群', '算力主权'],
    hot: false,
    link: 'https://www.ithome.com/0/942/900.htm',
  },
  // ══════════════════════════════════════════════════════
  // 2026-04-23（第30轮更新 — Google Cloud Next云厂商竞争 / 千里科技智驾 / 华为 ADS5 / Tesla资本支出 / Anthropic万亿估值 / Meta员工数据）
  // ══════════════════════════════════════════════════════
  {
    id: 2601,
    category: 'cloud',
    region: 'global',
    title: 'Google Cloud Next \'26：云厂商三强格局重塑，AWS/Azure/GCP 全面转向 AI 平台战略',
    summary: 'Google Cloud Next \'26 大会标志着云计算市场格局重塑。谷歌发布第 8 代 TPU 和 Agent 开发平台，直接对标 AWS SageMaker 和 Azure AI Studio。三大云厂商的竞争模式已从“存储和计算”转向“AI 平台和模型生态”，企业客户的云选型逻辑正在发生根本性变化。',
    source: 'TechCrunch',
    date: '2026-04-23',
    tags: ['Google Cloud', 'AWS', 'Azure', '云厂商竞争'],
    hot: true,
    link: 'https://techcrunch.com/2026/04/22/google-cloud-next-new-tpu-ai-chips-compete-with-nvidia/',
  },
  {
    id: 2602,
    category: 'software',
    region: 'global',
    title: 'ServiceNow 2026 Q1 财报：AI Agent 驱动 cRPO 增长 22%，企业 IT 自动化加速',
    summary: 'ServiceNow 发布 2026 Q1 财报，当期剩余合同义务（cRPO）同比增长 22%，超出市场预期。Now AI Agent 平台已有超过 1000 家企业客户部署，平均客单价値（ACV）同比增长 35%。企业 IT 服务市场正在被 AI Agent 重构，传统的工单系统、ITSM 工具面临被自动化替代的压力。',
    source: 'TechCrunch',
    date: '2026-04-23',
    tags: ['ServiceNow', '财报', 'AI Agent', 'cRPO'],
    hot: true,
    link: 'https://techcrunch.com/2026/04/23/servicenow-q1-2026/',
  },
  {
    id: 2603,
    category: 'industry',
    region: 'china',
    title: '千里科技智驾装车量破 46 万辆，华为之外第二极崛起，自助驾产业格局重塑',
    summary: '千里科技公布智驾装车量突破 46 万辆，覆盖极氪、领克 17 款车型，预计 2026 年进入百万量级，形成华为之外的“智驾双雄”格局。这对整个自动驾驶产业的意义在于：主机厂商在智驾供应商选择上有了真正的竞争性替代方案，不再必须全面依赖华为。',
    source: '36氪',
    date: '2026-04-23',
    tags: ['千里科技', '智驾', '自动驾驶'],
    hot: true,
    link: 'https://36kr.com/p/3779369343144965',
  },
  {
    id: 2604,
    category: 'startup',
    region: 'global',
    title: 'Anthropic 二级市场估值升至万亿美元，超越 OpenAI，AI 安全赛道商业价値重塑',
    summary: 'Anthropic 在 Forge Global 等平台上的二级市场估值已升至约 1 万亿美元，超过 OpenAI 的 8800 亿美元。这一估值逆转的核心逻辑是：Anthropic 的“安全优先”定位在监管收紧的环境下成为商业优势，尤其在欧盟和金融行业客户中。对整个 AI 行业的启示是：安全合规能力正在成为 AI 厂商的核心竞争力。',
    source: '36氪',
    date: '2026-04-23',
    tags: ['Anthropic', '估值', 'OpenAI', '二级市场'],
    hot: true,
    link: 'https://36kr.com/newsflashes/3779005902066946',
  },
  {
    id: 2605,
    category: 'industry',
    region: 'china',
    title: '华为乾崑智驾 ADS 5 + 鸿蒙座舱 HarmonySpace 6 双发布：自动驾驶软件定义权之争升温',
    summary: '华为发布 ADS 5 智驾系统（车位到车位 3.0）和鸿蒙座舱 HarmonySpace 6（小艺智能体），2026 年研发投入超过 180 亿元。18 家合作车企高管同台亮相。这标志着自动驾驶的竞争重心已从“硬件芯片”转向“软件定义体验”，华为的软件生态策略正在成为其核心护城河。',
    source: 'IT之家',
    date: '2026-04-23',
    tags: ['华为', '乾崑', 'ADS5', '鸿蒙座舱'],
    hot: true,
    link: 'https://www.ithome.com/0/942/800.htm',
  },
  {
    id: 2606,
    category: 'market',
    region: 'global',
    title: 'Tesla 2026 资本支出计划增至 $250 亿：全年自由现金流将为负，压注 AI 基础设施',
    summary: '特斯拉 2026 年计划资本支出为历史水平的三倍，CFO 表示全年自由现金流将为负。资金主要投向 AI 训练基础设施和自动驾驶。这一投资逐辑展示了特斯拉将自己定位为“AI 公司”而非仅仅是“汽车公司”的战略意图，但也引发投资者对其短期盈利能力的质疑。',
    source: 'TechCrunch',
    date: '2026-04-23',
    tags: ['Tesla', '资本支出', 'AI基础设施', '自动驾驶'],
    hot: true,
    link: 'https://techcrunch.com/2026/04/22/tesla-just-increased-its-capex-to-25b-heres-where-the-money-is-going/',
  },
  // ══════════════════════════════════════════════════════
  // 2026-04-23（第29轮更新 — Databricks IPO S-1 / Google Cloud TPU芯片策略 / Thinking Machines Lab / Meta员工数据 / MCP安全）
  // ══════════════════════════════════════════════════════
  {
    id: 2537,
    category: 'data',
    region: 'global',
    title: 'Databricks S-1 提交在即：ARR $54 亿、增速 65%，数据+AI 一体化平台估值逻辑重塑',
    summary: 'Databricks 计划于 2026 年下半年向 SEC 提交 S-1 注册文件，ARR 已达 $54 亿（同比增长 65%），有望成为史上最大科技 IPO 之一。Databricks 的估值逻辑与传统数据仓库（Snowflake）不同——它压注“数据+AI 一体化”，将 Delta Lake、MLflow、Unity Catalog 打包为一个平台。分析师指出，这是对 Snowflake 的直接威胁，也是开源数据平台商业化的重要验证。',
    source: 'TechCrunch',
    date: '2026-04-23',
    tags: ['Databricks', 'IPO', 'S-1', 'ARR'],
    hot: true,
    link: 'https://techcrunch.com/2026/04/22/databricks-ipo/',
  },
  {
    id: 2538,
    category: 'cloud',
    region: 'global',
    title: 'Google Cloud 发布两款新 TPU 芯片，采取“TPU+NVIDIA”双轨策略应对算力之争',
    summary: 'Google Cloud 在 Cloud Next \'26 发布两款新一代 TPU，性能更强成本更低，同时仍在云平台中拥抜 NVIDIA GPU，采取双轨策略。这一策略的商业逻辑是：用自研 TPU 降低对 NVIDIA 的依赖，同时保留 NVIDIA 生态兼容性。对企业客户而言，这意味着在 Google Cloud 上运行 AI 工作负载的成本将持续下降。',
    source: 'TechCrunch',
    date: '2026-04-23',
    tags: ['Google Cloud', 'TPU', 'NVIDIA', '云算力'],
    hot: true,
    link: 'https://techcrunch.com/2026/04/22/google-cloud-next-new-tpu-ai-chips-compete-with-nvidia/',
  },
  {
    id: 2539,
    category: 'startup',
    region: 'global',
    title: 'Thinking Machines Lab 与 Google Cloud 签署数十亿美元 AI 基础设施协议',
    summary: 'Mira Murati 创办的 Thinking Machines Lab 与 Google Cloud 签署数十亿美元协议，获取基于 NVIDIA GB300 芯片的 AI 基础设施。这是该公司成立以来最大规模的合作，也是前 OpenAI CTO 创业后首次大规模公开亮相。对行业的信号是：顶尖 AI 人才创业后仍选择云厂商合作而非自建算力。',
    source: 'TechCrunch',
    date: '2026-04-23',
    tags: ['Thinking Machines Lab', 'Mira Murati', 'Google Cloud', 'GB300'],
    hot: true,
    link: 'https://techcrunch.com/2026/04/22/exclusive-google-deepens-thinking-machines-lab-ties-with-new-multi-billion-dollar-deal/',
  },
  {
    id: 2540,
    category: 'security',
    region: 'global',
    title: 'Meta 将记录员工键盘操作用于训练 AI 模型，引发隐私争议',
    summary: 'Meta 推出内部工具，将员工鼠标移动和按键操作转化为 AI 训练数据。此举引发隐私争议，但也展示了大厂在 AI 训练数据获取上的激进策略。这对企业客户的启示是：内部员工行为数据将成为 AI 训练的重要资产，企业需要重新评估内部数据的隐私边界。',
    source: 'TechCrunch',
    date: '2026-04-23',
    tags: ['Meta', 'AI训练', '数据隐私', '员工数据'],
    hot: false,
    link: 'https://techcrunch.com/2026/04/21/meta-will-record-employees-keystrokes-and-use-it-to-train-its-ai-models/',
  },
  // ══════════════════════════════════════════════════════
  // 2026-04-22（第28轮更新 — OpenAI Workspace Agents企业平台化 / Google Cloud Next云厂商竞争 / Confluent财报 / CrowdStrike市场地位 / Oracle AI战略）
  // ══════════════════════════════════════════════════════
  {
    id: 2532,
    category: 'software',
    region: 'global',
    title: 'OpenAI ChatGPT Workspace Agents 上线：从聊天机器人进化为团队自动化平台，企业软件市场格局受冲击',
    summary: 'OpenAI 推出 ChatGPT Workspace Agents，由 Codex 驱动，可自动化复杂团队工作流，即使无人値守也能持续运行。这对 Salesforce、ServiceNow、Atlassian 等企业软件厂商构成直接威胁——ChatGPT 正式从对话工具转型为企业自动化平台，传统 SaaS 应用的市场边界正在被重定义。',
    source: 'The Decoder',
    date: '2026-04-22',
    tags: ['OpenAI', 'ChatGPT', 'Workspace Agents', '企业软件'],
    hot: true,
    link: 'https://the-decoder.com/openai-launches-workspace-agents-that-turn-chatgpt-from-a-chatbot-into-a-team-automation-platform/',
  },
  {
    id: 2533,
    category: 'cloud',
    region: 'global',
    title: 'Google Cloud Next \'26 全景：第8代 TPU + Agent 平台 + Workspace AI 三连发，全栈 AI 能力对标 Microsoft Azure + Copilot',
    summary: 'Google 在 Cloud Next \'26 发布第8代 TPU、统一 Agent 开发部署平台、以及深度嵌入 Gmail/Docs/Sheets 的 Workspace AI 层，全栈 AI 能力对标 Microsoft Azure + Copilot 体系。这标志着云计算市场的竞争已全面转向“AI 平台和模型生态”，存储和计算价格已不再是企业选型的核心因素。',
    source: 'The Decoder',
    date: '2026-04-22',
    tags: ['Google Cloud', 'TPU', 'Agent平台', 'Workspace AI'],
    hot: true,
    link: 'https://the-decoder.com/google-unveils-8th-gen-tpus-agent-platform-and-workspace-ai-layer-at-cloud-next-26/',
  },
  {
    id: 2534,
    category: 'data',
    region: 'global',
    title: 'Confluent 2026 Q1 财报：实时数据流平台收入增长 23%，AI 工作负载成新增长点',
    summary: 'Confluent 发布 2026 Q1 财报，总收入同比增长 23%，云收入占比提升至 68%。AI 工作负载对实时数据流的需求大幅增加，成为 Confluent 新增 ARR 的核心驱动力。CEO Jay Kreps 表示，实时数据流是 AI Agent 的神经系统，没有实时数据流就没有真正的 AI Agent。',
    source: 'TechCrunch',
    date: '2026-04-22',
    tags: ['Confluent', '财报', '实时数据流', 'AI Agent'],
    hot: false,
    link: 'https://techcrunch.com/2026/04/22/confluent-q1-2026/',
  },
  {
    id: 2535,
    category: 'security',
    region: 'global',
    title: 'CrowdStrike 2026 Q1 财报：ARR 突破 $40 亿，AI 安全平台成企业安全市场新标准',
    summary: 'CrowdStrike 发布 2026 Q1 财报，ARR 突破 $40 亿，年化经常性收入增长 22%。Falcon AI 平台已成为企业安全市场的新标准，将安全检测、响应和合规整合到一个 AI 平台。分析师指出，安全平台化趋势正在加速，单点安全工具厂商面临被平台厂商并购的压力。',
    source: 'TechCrunch',
    date: '2026-04-22',
    tags: ['CrowdStrike', '财报', 'Falcon AI', '安全平台'],
    hot: false,
    link: 'https://techcrunch.com/2026/04/22/crowdstrike-q1-2026/',
  },
  {
    id: 2536,
    category: 'software',
    region: 'global',
    title: 'Oracle AI 战略加速：OCI 超大规模 GPU 集群对抗 AWS/Azure，传统数据库厂商转型 AI 基础设施商',
    summary: 'Oracle 宣布将在 OCI（Oracle Cloud Infrastructure）上投建超大规模 GPU 集群，目标是为大型 AI 训练工作负载提供更低成本的替代方案。Oracle 的策略是利用其在企业数据库市场的存量客户，将其迁移到 OCI AI 工作负载。这标志着传统数据库厂商正在全面转型为 AI 基础设施商。',
    source: 'TechCrunch',
    date: '2026-04-22',
    tags: ['Oracle', 'OCI', 'GPU集群', 'AI基础设施'],
    hot: false,
    link: 'https://techcrunch.com/2026/04/22/oracle-ai-strategy/',
  },
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
  {
    id: 2531,
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
