# Signal · AI Wiki

> 每次迭代前请先阅读本文档，了解当前进展和规划方向，避免重复建设或方向偏差。

---

## 一、项目定位

**Signal** —— 从噪声中提取前沿信号。

一个以 AI 智能体为核心驱动的知识平台，书籍每天自动研究与修订，文章由 AI 每日产出，全部内容开源可追溯。当前聚焦 **大模型 / VLA / 自动驾驶** 三大方向。

---

## 二、当前模块进展

### 1. 首页 `/`
- ✅ Hero 区：品牌定位 + CTA 按钮（书架 / 文章 / 评测榜）
- ✅ 平台概览：三大核心模块简介卡片
- ✅ 本周快报：新增文章 / 论文解读 / 书籍修订 自动聚合（近 7 天）
- ✅ Stats Bar：总内容数 / 书籍 / 文章 / 论文解读 / 进化次数
- ✅ 最新文章列表（最近 6 篇）
- ✅ AI 动态（声浪，最近 6 条）
- ✅ 进化日志（最近 5 条）

### 2. 书架 `/books/`
- ✅ 按书名分组，章节排序展示
- ✅ 快速跳转导航（多本书时）
- ✅ 每本书封面色块 + 章节列表
- ✅ 书籍详情页 `/books/[slug]/`：侧边栏目录 + Markdown 渲染 + 上下章导航
- 📚 当前书架（7 本）：
  - 《AI Agent 实战指南》7 章
  - 《自动驾驶大模型》7 章
  - 《AI 面试通关》7 章
  - 《推理引擎》7 章
  - 《PyTorch 深度学习》7 章
  - 《大模型训练实战》7 章
  - 📖 **《AI 时代软件行业全景》7 章**（新增）
    - 第1章：软件行业的历史演进与当前格局（六十年五次范式跃迁、三层价值栈、中国特殊性）
    - 第2章：AI 对软件开发本身的重塑（编码工具进化史、生产力数据、开发经济学重构、工程师角色转变）
    - 第3章：数据平台的战略价值重估（Databricks vs Snowflake 路线之争、Iceberg 格式战争、中国数据平台）
    - 第4章：企业软件的 AI 化转型路径（Salesforce Agentforce、ServiceNow、SAP、AI 原生企业软件崛起）
    - 第5章：安全行业的范式变革（CrowdStrike 数据飞轮、AI 新型威胁、零信任架构、Wiz 云安全）
    - 第6章：创业机会地图（15 个 AI 原生软件新品类、中国特色机会、创业陷阱）
    - 第7章：未来十年终局猜想（AGI 临近影响、软件商业模式重构、中国三条战略路径、2035 展望）
  - 📖 **《Code as Proxy — AI 时代的数据安全架构》7 章**（新增）
    - 第1章：核心理念——当 AI 不该碰你的数据（根本矛盾、四层架构、适用边界）
    - 第2章：理论基础——从信息论到零信任（最小充分统计量、信息瓶颈、差分隐私、数据主权、联邦计算、20+ 学术引用）
    - 第3章：Palantir AIP 深度解析（Ontology 建模、AIP 架构、IL6 安全、TITAN 边缘部署、$2.87B 商业验证）
    - 第4章：架构设计模式（Schema 增强、三种代码生成模式、沙箱执行、结果摘要、MCP 集成）
    - 第5章：安全威胁模型（五大攻击面：代码注入/Schema推断/Prompt注入/侧信道/供应链 + 防御策略 + 合规框架）
    - 第6章：行业应用案例（金融/医疗/国防/自动驾驶四大场景 + 联邦代码执行）
    - 第7章：未来演进（Agent 原生架构、自进化 Ontology、联邦代码网络、形式化验证、数据原生 AI）

### 3. 文章 `/articles/`
- ✅ 文章列表 + 标签筛选
- ✅ 文章详情页 `/articles/[slug]/`：Markdown 渲染

### 4. 论文 `/papers/`
- ✅ 论文趋势区块（四大方向：模型架构 / 训练对齐 / 推理优化 / 数据合成）
- ✅ 论文列表：分类筛选 + 重要性标记 + 已解读标记
- ✅ 论文详情页 `/papers/[slug]/`：解读内容渲染

### 5. 模型 `/models/`
- ✅ 模型图库（ModelGallery）：架构图 + Fact Sheet
- ✅ 评测排行榜（BenchmarkBoard）：多维度对比
- ✅ 数据集探索（DatasetExplorer）：覆盖 LLM / 编码 / 推理 / Agent / 自动驾驶
- ✅ 架构对比工具（ArchDiffTool）：两模型并排对比
- ✅ 自动驾驶专区：模型架构 + 数据集已丰富

### 6. VLA 实验室 `/vla/`
- ✅ Hero：DriveWorld-VLA 三步流程概览（数据准备 / 模型架构 / 三阶段训练）
- ✅ **架构 & 数据** Tab（子 Tab：模型架构图 / 数据集选型 / 训练配置 / VLA 实验室）
  - 模型架构图：Unified Latent-Space SVG 可视化，节点可点击查看详情
  - 数据集选型：多数据集对比
  - 训练配置：超参数表格
  - VLA 实验室：4 种 VLA 世界模型架构方案展示
- ✅ **全链路实验** Tab（Notebook 风格，逐步可运行）
  - Cell 1：数据准备（nuScenes mini，可调数据条数）
  - Cell 2：数据处理（多传感器对齐 + Tokenize）
  - Cell 3：模型搭建（DriveWorld-VLA 完整架构）
  - Cell 4：模型训练（三阶段训练，含 Loss 曲线可视化）
  - Cell 5：数据可视化（摄像头 / 雷达 / BEV 随机样本展示）
  - Cell 6：预测结果可视化（轨迹预测 + 碰撞概率）

### 7. 声浪 `/news/`
- ✅ AI 前沿动态聚合（YouTube / 播客 / X）
- ✅ 分类筛选 + 来源标记

### 8. 进化日志 `/evolution/`
- ✅ 时间线展示所有 AI 智能体操作记录
- ✅ 类型分类（书籍 / 文章 / 论文 / 声浪）

### 9. 业务原生 `/strategy/`
（内容不变，见下）

### 9b. 创业雷达 `/idea/`
- ✅ **战略分组**下新增模块，综合软件 · 游戏 · 硬件行业国内外每日新闻，提炼可行创业方向
- ✅ 覆盖 5 大行业：AI 工具 / 游戏科技 / 消费硬件 / 开发者工具 / 企业 SaaS
- ✅ 15 个创业方向，每个方向包含：
  - 信号标注（🔥热点 / 👀关注）+ 更新日期
  - 市场规模 / 进入壁垒 / 中国机会 三维评估
  - 海外已有玩家（公司名 + 估值 + 简介）
  - 中国机会窗口分析
  - 标签体系
- ✅ 筛选器：行业 / 信号类型 / 中国高机会
- ✅ 卡片展开/收起交互

### 9c. 全行业动态 `/industry-news/`
- ✅ **定位**：聚焦软件行业公司动态，重点关注 Databricks / Snowflake / AWS / Palantir / Salesforce / ServiceNow / Confluent / dbt Labs / CrowdStrike / Oracle 等
- ✅ **时间轴模式**（与 AI 声浪一致）：左侧竖向时间轴导航 + 右侧内容区
- ✅ 时间分组规则：最近 7 天按日、2026 年 4 月按周、2026 年 1-3 月按月、2025 年按月、2024 及更早按年
- ✅ **6 大分类**（重新梳理，去掉游戏/硬件/AI，聚焦软件行业）：
  - 🗄️ 数据平台（Databricks/Snowflake/dbt/Fivetran/Confluent）
  - ☁️ 云服务（AWS/Azure/GCP）
  - 💼 企业软件（Salesforce/ServiceNow/SAP/Oracle）
  - 🔐 安全（CrowdStrike/Palo Alto/Okta）
  - 🚀 融资动态（创业公司融资/IPO）
  - 📊 市场财报（季报/市值/并购）
- ✅ 历史数据：2020-2026 年各阶段汇总，以软件行业公司为主线（数据平台格式战争/云计算增速/企业软件并购/安全行业整合）
- ✅ 汇总条目有 📋 汇总标签，视觉上与单条新闻区分
- ✅ 筛选器：6 大分类 + 地区（国内/国际）+ 仅看热点
- ✅ 滚动时时间轴自动高亮当前时间段

### 9d. 全球经济与中国经济研究 `/economy/`
- ✅ **战略分组**下新增模块，综合多维度宏观数据研判美元/人民币汇率走势
- ✅ **6 大 Tab**：
  - 📈 **汇率预测**：历史走势柱状图 + 三大情景（基准/升值/贬值）+ 综合研判结论
  - 🏦 **美联储动态**：当前利率、点阵图、FOMC 日历、纪要摘要、政策→汇率传导路径
  - 🇺🇸 **美国经济**：GDP/CPI/PCE/失业率等核心指标 + 经济现状分析 + 对人民币影响
  - 🇨🇳 **中国经济**：GDP/CPI/PPI/贸易顺差/外储 + 央行工具箱 + 贸易格局分析
  - 📊 **数据看板**：三大类（美联储&美国 / 中国经济 / 汇率相关）全量指标一览
  - ⚠️ **风险因子**：6 大风险（贸易摩擦/通胀反弹/超预期降息/财政刺激/地缘政治/资本开放）+ 风险矩阵
- ✅ **核心预测**：基准情景下 2026 Q2—2027 Q1 汇率中枢约 6.85，区间 6.60—7.10（当前实际汇率 6.81，美元大幅走弱背景下）
- ✅ 数据基于 2026 年 4 月公开信息，每月更新

### 9. 业务原生 `/strategy/`
- ✅ **行业困境分析** Tab：AI Coding 发展时间线 + 五大核心困境（代码商品化/人才断裂/价值侵蚀/复杂度爆炸/差异化坍缩）
- ✅ **全球破局思路** Tab：5 大破局策略（Palantir 模式/垂直 AI/平台生态/复合 AI/数据飞轮）+ 每个策略的**近期声浪信号**（🔥热点/👀关注，含日期+来源标签）+ **深度展开**折叠区块（为什么有效/主要风险/核心机会/关注指标）；`lastUpdated` 字段标记更新时间，需定期人工维护
- ✅ **Palantir 模式深度解析** Tab：产品矩阵（Foundry/Gotham/AIP）+ 四大护城河 + **🧩 Code as Proxy 设计哲学**（AIP 核心原则：AI 生成代理代码，数据不出域；四层架构：业务语义层→代理生成层→受控执行层→结果摘要层；传统 AI vs Code as Proxy 对比；战略影响：唯一能在 IL6 最高机密环境运行 LLM 的商业产品）+ 财务数据
- ✅ **应对框架** Tab：四层架构（数据基座→业务本体→AI 平台→决策应用）+ 18 月路线图 + 团队转型 + KPI
- ✅ **FDE × 飞轮** Tab：FDE（前线工程师）vs 业务 BP 深度对比（能力维度/典型一天/常见误区/8 维度对比表）+ 进化路径（BP→FDE→FDE+AI→Agent+FDE）+ 交付飞轮四阶段（嵌入→交付→抽象→规模化）+ 飞轮加速器（AI Agent/Ontology 模板/Playbook/数据飞轮）+ 飞轮效果量化表 + FDE 团队建设（人才画像/职业路径/运营模式）
- ✅ **交付形态** Tab：内部 SaaS 共用六大困境 + 爆炸半径深度分析 + 交付形态演进（大一统→微服务→领域平台→嵌入式能力）+ 决策框架 + 真实案例
- ✅ **行业对标** Tab：Palantir/Databricks/Salesforce/Tesla 模式对比矩阵
- ✅ **模型安全** Tab：外部大模型（Claude/GPT/Gemini）接触公司内部代码和数据的风险论证与可控性方案。核心问题定义（四方利益相关者关切）+ 六大风险全景图（数据泄露/知识产权/合规监管/供应链依赖/代码质量/提示注入，每项含真实案例+缓解措施）+ 数据分级管控体系（L1公开→L4绝密，差异化模型访问策略）+ 技术管控架构（安全网关→模型路由→终端管控→审计响应四层）+ 主流模型提供商安全对比（Anthropic/OpenAI/Google/DeepSeek/Qwen 八维度评估）+ 推荐方案四阶段（快速启用→安全网关→多模型路由→持续运营）+ 成本效益分析（管控成本 vs 使用收益 vs 不用的隐性成本）+ 行业实践参考（Google/Microsoft/Stripe/JPMorgan/Shopify）+ 五大关键结论
  - 💡 **代码生成隔离模式**（Schema-aware Code Generation with Local Execution）：AI 只接触数据的 Schema / 元数据，生成处理代码，**不接触真实数据**；代码在本地/私有环境执行，数据不出域。即"AI writes the code, data never leaves the perimeter"。对应 Palantir AIP 的核心安全设计——AI 操作 Ontology（数据本体/Schema），而非原始数据本身。相关术语：Code-as-Proxy / Federated Code Execution / Data Residency + AI Assist / Sandboxed Code Execution
- ✅ **中国借鉴** Tab：四大障碍（政府市场/数据主权/价格敏感/大厂自建）+ 四大可行赛道（制造出海/工业能源/医疗/金融）+ 本土化四原则（私有化部署/产品化降本/垂直切入/绑定数据本体）+ 一句话总结

---

### 10. 闭环 Infra `/data-infra/`
- ✅ **AI Infra 技术栈** Section（DataInfraViz 组件，10 个 Tab）：
  - 全景总览 · K8s & 容器 · 数据湖仓 · 数据流水线 · MLOps 实验 · 可观测性 · 向量 & 特征 · 图像去重 · 数据合成
  - ⚡ **推理 & 训练优化**（新增）：分布式训练框架对比（DeepSpeed/FSDP/Megatron-LM）· 混合精度策略（FP32→INT4 全光谱）· 推理引擎对比（TensorRT/vLLM/SGLang/ONNX Runtime/TGI）· 编译优化（torch.compile/FlashAttention-3/Triton/CUDA Graph）· 车端推理优化（Orin 平台量化/蒸馏/剪枝/多模型调度/延迟预算）· 分布式通信优化 · 框架选型决策矩阵 · 核心论文 · 效果指标
- ✅ **闭环 Infra 链路** Section（DataLoopArch 组件，7 层闭环）：
  - 数据采集 → 数据上传 → 数据处理 → 数据存储 → 模型训练 → 模型部署 → 效果监控

### 11. 侧边栏导航 `Sidebar.js`
- ✅ **左侧竖向固定侧边栏**，按四大分组清晰展示所有 13 个导航条目
  - 🟣 知识（紫）：书架 · 文章 · 论文 · 模型 · 闭环 Infra · 工具箱
  - 🩵 业务（青）：自动驾驶 · 实验室
  - 🟠 战略（橙）：业务原生 · **创业雷达**（新增）· **经济研究**（新增）
  - 🟢 动态（绿）：AI 声浪 · **全行业动态**（新增）· 进化日志
- ✅ 每个分组有色点 + 分组标题（知识/业务/战略/动态），层次清晰
- ✅ 当前页面高亮（色块背景 + 图标彩色）
- ✅ 桌面端：固定左侧 `w-52`，支持折叠为 `w-[52px]` 图标模式
- ✅ 移动端：顶部栏 + 汉堡菜单，侧边栏滑出覆盖
- ✅ 全局布局：通过 `layout.js` 统一引入 `Sidebar.js`，各页面无需单独引用导航组件
- ✅ Logo + 品牌信息 + 「自主进化中」状态指示

---

## 三、技术栈

```
Next.js 14 (App Router)  +  React  +  Tailwind CSS
内容层：Markdown / JSON 文件驱动（content/ 目录）
可视化：纯 SVG + React 状态驱动（无第三方图表库）
部署：本地 localhost:3000
```

---

## 四、后续迭代规划

> 优先级：🔴 高 / 🟡 中 / 🟢 低

### 迭代 1：内容质量提升（近期）
- 🔴 **研究模块扩充**：在 `/papers/` 中补充更多 VLA / 世界模型方向论文解读（目前 VLA 方向论文已在研究模块，但解读深度可加强）
- 🔴 **书籍内容更新**：确保书架中的书籍章节内容与最新研究同步，尤其是 VLA / 自动驾驶方向
- 🟡 **模型中心数据补全**：models.json 中补充更多 2025 年新模型（如 Qwen3、Gemini 2.5 等）

### 迭代 2：VLA 实验室深化（中期）
- 🔴 **真实数据接入**：全链路实验目前使用模拟数据，计划接入真实 nuScenes mini 数据集（HuggingFace 下载）
- 🟡 **训练结果持久化**：训练完成后将 Loss 曲线 / 指标保存，支持多次实验对比
- 🟡 **更多 VLA 架构方案**：VLA 实验室目前有 4 种架构，可扩展到 6-8 种，覆盖 RT-2、OpenVLA、UniAD 等
- 🟢 **模型导出**：训练完成后支持模型权重下载（ONNX / PyTorch 格式）

### 迭代 3：平台能力增强（中期）
- 🔴 **搜索功能**：全站内容搜索（文章 / 论文 / 书籍），目前完全没有搜索入口
- 🟡 **标签系统统一**：文章 / 论文 / 书籍的标签体系统一，支持跨模块标签聚合页
- 🟡 **RSS / 订阅**：提供 RSS Feed，方便用户订阅更新
- 🟢 **暗色模式**：全站支持 Dark Mode

### 迭代 4：AI 智能体能力（长期）
- 🔴 **进化日志可视化**：进化日志目前只有文字列表，可做成甘特图 / 热力图，展示 AI 智能体活跃度
- 🟡 **智能体状态面板**：展示各 AI 智能体（研究员 / 编辑 / 审校员）的实时状态和任务队列
- 🟡 **内容质量评分**：对书籍章节 / 文章自动打分，标记需要人工复核的内容
- 🟢 **多语言支持**：英文版内容镜像

### 迭代 5：交互体验优化（持续）
- 🟡 **首页个性化**：根据用户浏览历史推荐相关内容
- 🟡 **书籍阅读体验**：字体大小调节 / 阅读进度保存 / 高亮笔记
- 🟢 **移动端优化**：部分复杂可视化组件（VLA 架构图 / 模型对比）在移动端体验较差，需适配
- 🟢 **加载性能**：VlaArchViz.js（120KB）/ VlaNotebook.js（83KB）体积过大，考虑拆分懒加载

---

## 五、已知问题 & 技术债

| 问题 | 严重程度 | 说明 |
|------|---------|------|
| VlaArchViz.js 体积过大 | 🟡 中 | 120KB，包含大量内联 SVG 和数据，影响首次加载 |
| VlaNotebook.js 体积过大 | 🟡 中 | 83KB，可拆分为多个 Cell 组件 |
| 全链路实验使用模拟数据 | 🔴 高 | 训练数据为随机生成，非真实 nuScenes 数据 |
| gallery/page.js 和 benchmarks/page.js 为空 | 🟡 中 | 两个页面只有 118B，内容未实现 |
| 无全站搜索 | 🔴 高 | 内容越来越多，缺少搜索入口体验很差 |

---

## 六、目录结构速查

```
maxwell-knowledge/
├── src/
│   ├── app/
│   │   ├── page.js              # 首页
│   │   ├── books/               # 书架
│   │   ├── articles/            # 文章
│   │   ├── papers/              # 论文
│   │   ├── models/              # 模型
│   │   ├── vla/                 # VLA 实验室
│   │   ├── news/                # 声浪
│   │   ├── evolution/           # 进化日志
│   │   ├── strategy/            # 业务原生
│   │   ├── idea/                # 创业雷达（新增）
│   │   ├── economy/             # 经济研究（新增）
│   │   ├── industry-news/       # 全行业动态（新增）
│   │   ├── benchmarks/          # 评测榜（待完善）
│   │   └── gallery/             # 图库（待完善）
│   ├── components/
│   │   ├── Sidebar.js           # 左侧竖向导航栏（全局）
│   │   ├── IdeaRadar.js         # 创业雷达主组件（新增）
│   │   ├── IndustryNewsFeed.js  # 全行业动态主组件（新增）
│   │   ├── VlaArchViz.js        # VLA 架构可视化（大文件 120KB）
│   │   ├── VlaNotebook.js       # 全链路实验 Notebook（大文件 83KB）
│   │   ├── VlaTrainRunner.js    # 训练运行器（61KB）
│   │   ├── ModelHub.js          # 模型主组件
│   │   ├── DatasetExplorer.js   # 数据集探索
│   │   ├── StrategyViz.js       # 业务原生可视化
│   │   └── ...
│   └── lib/
│       ├── content.js           # 内容读取工具函数
│       └── strategy-data.js     # 业务原生数据定义
└── content/                     # 内容数据目录（Markdown + JSON）
```

---

*最后更新：2026-04-18（新增「全球经济与中国经济研究」模块 `/economy/`，综合美联储政策与中国宏观数据研判美元/人民币汇率走势）*

---

## 七、自动化任务提示词

> 以下提示词供 AI 智能体执行每日内容更新和质检任务时直接使用，复制粘贴即可运行。

---

### 📝 角色一：网站编辑员（内容更新）

```
你是 Signal 知识平台的 AI 编辑员，负责持续更新网站内容。

## 前置步骤（必须先执行）
1. 读取 /Users/harrisyu/WorkBuddy/20260409114249/maxwell-knowledge/ai-wiki.md，
   了解当前模块进展、已有内容、技术栈和目录结构，避免重复建设。
2. 读取 content/news/news-feed.json 了解现有声浪条目（注意：这是大文件，只读前100行即可）。
3. 读取 content/papers/papers-index.json 了解现有论文列表。

## 本次更新任务（按优先级顺序执行，全程免审批）

### 任务 1：更新声浪 content/news/news-feed.json（最高优先级）
- 新增 8-10 条最新 AI 动态，重点覆盖：
  - LLM 前沿：模型发布/能力突破/推理优化（GPT/Claude/Gemini/Qwen/Llama 系列）
  - AI Infra：推理框架(vLLM/SGLang/TensorRT-LLM)、训练框架、GPU/NPU 硬件、KV Cache 优化
  - 闭环 Infra：数据合成、标注自动化、数据飞轮、合成数据质量评估
  - Agent/MCP：MCP 协议生态、Agent 编排、工具调用安全
  - 自动驾驶：VLA 进展、世界模型、端到端方案
  - 全行业：软件/游戏/硬件/创业融资/政策监管动态（同步更新 IndustryNewsFeed.js 中的 NEWS_DATA）
- 对 30 天前的旧条目（date 字段），将同类话题合并为一条摘要条目，减少冗余
- 每条新闻格式：{ id, title, summary, source, date, category, tags[], hot, region }
- 注意：JSON 文件必须使用 UTF-8 编码，所有中文字符直接写入，不要使用 Unicode 转义（\uXXXX）

### 任务 2：新增文章 content/articles/（每次至少 2 篇）
- 选题方向（优先选当前最热的）：
  - LLM 推理优化新进展（Speculative Decoding / MLA / 量化）
  - 闭环 Infra 与合成数据最新实践
  - 自动驾驶 VLA/世界模型最新进展
  - MCP/Agent 生态最新动向
- 文章格式（Markdown）：
  - frontmatter: title, date, tags[], summary, category
  - 正文：背景→核心技术→实现细节→实际效果→总结，不少于 1500 字
  - 包含代码示例（Python/伪代码）和数据对比表格
  - 文件名：{topic}-{date}.md，全小写英文，用连字符

### 任务 3：更新书架（每次至少更新 1 本书的 1 个章节）
- 优先更新以下书籍（与最新进展相关的章节）：
  - 《自动驾驶大模型》(ad-llm-ch*.md)：补充最新 VLA/世界模型进展
  - 《AI Agent 实战指南》(ai-agent-ch*.md)：补充 MCP 协议和 Agent 安全内容
  - 《推理引擎》(inference-ch*.md)：补充最新推理优化技术
- 更新要求：在章节末尾追加「最新进展」小节，不改动原有内容结构

### 任务 4：新增/更新论文解读 content/papers/（每次至少 1 篇详细解读）
- 优先方向：自动驾驶 VLA、世界模型、数据合成、推理优化
- 解读格式（Markdown，不少于 2000 字）：
  - frontmatter: title, authors, venue, date, tags[], tldr, importance(1-5)
  - 正文结构：
    1. 一句话总结（TL;DR）
    2. 研究背景与动机（为什么做这个）
    3. 核心方法（配伪代码或公式，用 $...$ 包裹数学公式）
    4. 关键实验结果（表格对比，数字要具体）
    5. 创新点分析（与前人工作的区别）
    6. 局限性与未来方向
    7. 对工程实践的启示
  - 同步更新 papers-index.json，添加新论文的索引条目

### 任务 4b：更新创业雷达 src/components/IdeaRadar.js（每月至少刷新一次）
- 更新 IDEAS 数组中各方向的 signalDate 和 signal 标注（🔥热点/👀关注）
- 补充新出现的海外创业公司（overseas 数组），尤其关注 YC 最新批次
- 新增创业方向时覆盖 5 大行业：AI 工具 / 游戏科技 / 消费硬件 / 开发者工具 / 企业 SaaS
- 每个新方向必须包含：market（市场规模）、barrier（进入壁垒）、china（中国机会）、overseas（≥2 家对标）、opportunity（中国机会窗口）

### 任务 4c：更新全行业动态 src/components/IndustryNewsFeed.js（每次至少新增 5 条）
- 在 NEWS_DATA 数组头部插入最新新闻条目
- 覆盖 6 大分类：ai / software / game / hardware / startup / policy
- 国内外各占约一半（region: 'china' | 'global'）
- 每条格式：{ id, category, region, title, summary, source, date, tags[], hot, link }
- 对超过 60 天的旧条目可以删除，保持列表在 30 条以内

### 任务 5：更新模型数据 content/gallery/models.json（每次至少补充 2 个模型）
- 重点补充：
  - 自动驾驶专用模型（DriveVLM、OpenDriveVLA、SparseDrive 等）
  - 最新基础模型（Qwen3、Gemini 2.5 Pro、Claude 4 等）
  - 每个模型包含：name, provider, params, context, benchmark_scores{},
    architecture, release_date, open_source, ad_specific(bool)
- 注意：models.json 是大文件(122KB)，使用 replace_in_file 追加，不要整体重写

### 任务 6：更新进化日志 content/evolution-log.json
- 追加本次更新的操作记录，格式：
  { id, type, title, description, date, agent: "editor-v2" }
- type 可选：news | article | book | paper | model

### 任务 7：更新文档 ai-wiki.md
- 更新「当前模块进展」中受影响的章节
- 更新「最后更新」时间戳

### 任务 8：提交代码
- git add -A
- git commit -m "content: 每日内容更新 - 声浪/文章/论文/模型 [$(date +%Y-%m-%d)]"
- git push origin main

## 重要注意事项
- 所有文件必须使用 UTF-8 编码，中文直接写入，严禁 Unicode 转义（\uXXXX 会导致乱码）
- JSON 文件修改前先用 grep_search 确认当前末尾结构，避免破坏 JSON 格式
- 大文件（isBigFile=true）使用 replace_in_file 或 multi_replace，不要用 edit_file
- 每次迭代保证：声浪 ≥8 条新增、文章 ≥2 篇、书籍 ≥1 章更新、论文 ≥1 篇详细解读、模型 ≥2 个
- 创业雷达（IdeaRadar.js）每月刷新一次信号标注，每季度新增 ≥3 个创业方向
- 全行业动态（IndustryNewsFeed.js）每次迭代新增 ≥5 条，保持列表 ≤30 条
```

---

### 🔍 角色二：质检员（可用性检查）

```
你是 Signal 知识平台的 AI 质检员，负责验证网站内容更新质量和服务可用性。

## 前置步骤
读取 ai-wiki.md 了解当前模块结构，确认检查范围。

## 检查任务（全程免审批）

### 检查 1：服务可用性（HTTP 状态码）
依次 curl 以下路由，确认均返回 200：
for path in "/" "/books/" "/articles/" "/papers/" "/models/" "/news/" \
            "/vla/" "/strategy/" "/idea/" "/industry-news/" "/evolution/" \
            "/data-infra/" "/tools/" "/lab/" "/idea/" "/industry-news/"; do
  status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 http://localhost:3000${path})
  echo "${status} ${path}"
done
记录所有非 200 的路由，分析原因。

### 检查 2：内容格式检查
# 检查 JSON 文件格式合法性
for f in content/news/news-feed.json content/papers/papers-index.json \
          content/evolution-log.json; do
  python3 -c "import json,sys; json.load(open('$f')); print('OK: $f')" 2>&1
done

# 检查是否存在 Unicode 转义乱码（\uXXXX 形式的中文）
grep -r '\\u[0-9a-fA-F]\{4\}' content/news/news-feed.json | head -5
grep -r '\\u[0-9a-fA-F]\{4\}' content/papers/papers-index.json | head -5

### 检查 3：声浪链接可用性
# 从 news-feed.json 提取前 10 条有 url 字段的链接并检测
python3 -c "
import json, subprocess
data = json.load(open('content/news/news-feed.json'))
items = [i for i in data.get('items', data if isinstance(data, list) else [])
         if i.get('url') and i['url'].startswith('http')][:10]
for item in items:
    r = subprocess.run(['curl','-s','-o','/dev/null','-w','%{http_code}',
                       '--max-time','5', item['url']], capture_output=True, text=True)
    print(f\"{r.stdout} {item['url'][:60]}\")
"

### 检查 4：数学公式渲染检查
# 检查论文解读中的公式格式（确保用 $ 包裹而非 \( \)）
grep -r '\\\\(' content/papers/*.md | head -5
grep -r '\$[^$]\+\$' content/papers/*.md | wc -l

### 检查 5：运行自动化测试用例
cd /Users/harrisyu/WorkBuddy/20260409114249/maxwell-knowledge
if [ -f "tests/content.test.js" ]; then
  npx jest tests/content.test.js --no-coverage 2>&1 | tail -20
elif [ -f "package.json" ] && grep -q '"test"' package.json; then
  npm test 2>&1 | tail -20
else
  echo "未找到测试文件，跳过"
fi

### 检查 6：乱码根因分析与修复
# 乱码根因：JSON 文件中中文被序列化为 Unicode 转义（\uXXXX）
# 原因：Python json.dumps() 默认 ensure_ascii=True，所有非 ASCII 字符被转义
# 修复：所有写 JSON 的地方统一加 ensure_ascii=False

# 检测并修复
python3 -c "
import json, re
files = ['content/news/news-feed.json', 'content/papers/papers-index.json',
         'content/evolution-log.json']
for f in files:
    raw = open(f, 'r', encoding='utf-8').read()
    if re.search(r'\\\\u[0-9a-fA-F]{4}', raw):
        data = json.loads(raw)
        open(f, 'w', encoding='utf-8').write(
            json.dumps(data, ensure_ascii=False, indent=2))
        print(f'已修复: {f}')
    else:
        print(f'正常: {f}')
"

### 检查 7：清除缓存并重启服务
# 停止现有服务
pkill -f "next dev" 2>/dev/null; sleep 2

# 清除 Next.js 构建缓存
rm -rf /Users/harrisyu/WorkBuddy/20260409114249/maxwell-knowledge/.next

# 重启开发服务器
cd /Users/harrisyu/WorkBuddy/20260409114249/maxwell-knowledge
nohup npx next dev > /tmp/signal-dev.log 2>&1 &
sleep 8 && tail -5 /tmp/signal-dev.log

# 验证服务已启动
curl -s -o /dev/null -w "服务状态: %{http_code}\n" http://localhost:3000/

### 检查 8：输出质检报告
汇总以下信息：
- 路由可用性：X/Y 通过
- JSON 格式：是否合法
- Unicode 乱码：是否存在/已修复
- 声浪链接：X/Y 可访问
- 测试用例：通过/失败/跳过
- 服务状态：正常/异常
- 发现的问题列表（如有）
```

---

> **乱码根本原因备注**：Python 的 `json.dumps()` 默认 `ensure_ascii=True`，会把所有非 ASCII 字符（包括中文）转义为 `\uXXXX`。Next.js 读取 JSON 时某些情况下不会自动反转义，导致页面显示乱码。**修复方法**：所有写 JSON 的地方统一加 `ensure_ascii=False`。
