# Signal · AI Wiki

> 每次迭代前请先阅读本文档，了解当前进展和规划方向，避免重复建设或方向偏差。

---

## 一、项目定位

**Signal** —— 从噪声中提取前沿信号。

AI 多智能体驱动的知识平台：每日追踪行业声浪、产出文章与论文解读、迭代书籍与模型库，所有变更均被进化日志完整记录。当前聚焦 **大模型 / VLA / 自动驾驶** 三大方向。

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
- ✅ Hero：研究项目卡片（3 张，可切换）—— DriveWorld-VLA / **Seed-AD（新增）** / **Alpamayo-R1（精简展开）**
- ✅ 两大活跃研究项目各自拥有独立的 3 Tab（架构&数据 / 全链路实验 / 数据闭环），互不干扰
- ✅ **Alpamayo-R1（青色主题 #00cec9）** —— NVIDIA Research R1-style Reasoning-VLA
  - 技术方案分解（3 步）：数据 & 长尾场景（DRIVE 内部数据 + CoT 标注） · R1-style VLM 架构（VLM 主干 + 显式 Chain-of-Thought） · 训练范式（SFT on CoT + 仿真 RL/GRPO）
  - 研究概要卡：核心创新（R1 推理 + RL 后训练迁移到驾驶）· 关键卖点（可解释 / 长尾 / RL 友好 / 车端工程化）· 与 DriveWorld/Seed-AD 的差异（不压注世界模型或超大参数量，而是压注「推理链×RL」）· 当前状态（跟踪中，等待论文/开源/Benchmark）
- ✅ **DriveWorld-VLA**（紫色主题 #6c5ce7）
  - 架构 & 数据 Tab（子 Tab：模型架构图 / 数据集选型 / 训练配置 / VLA 实验室）
  - 全链路实验 Tab（6 Cell Notebook，含 360° 全景拼接 + GT/Pred 对比）
  - 数据闭环 Tab（7 层）
- ✅ **Seed-AD（新增）**（翡翠绿主题 #10b981）—— 字节 70B VLA 三阶段推理工业级落地
  - **架构 & 数据** Tab（[SeedAdArchViz.js](/Users/harrisyu/WorkBuddy/20260409114249/maxwell-knowledge/src/components/SeedAdArchViz.js)，4 子 Tab）
    - 三阶段架构图：共享骨干 40B + 想象头 10B + 反思头 10B + 行动头 10B，节点可点击
    - 对比 DriveWorld-VLA：10 维对照表 + 双层雷达图（Seed-AD 8/10 维占优）
    - 数据集选型：nuScenes + OpenDV-2K + DriveLM + **UniSim 2.0 合成** + nuPlan + Waymo，训练配比可视化
    - 训练配置：三阶段（预训练 21 天 + 联合 7 天 + 蒸馏 3 天 = 31 天）+ 超参表
  - **全链路实验** Tab（[SeedAdNotebook.js](/Users/harrisyu/WorkBuddy/20260409114249/maxwell-knowledge/src/components/SeedAdNotebook.js)，6 Cell）
    - Cell 1 数据下载 & 预览：HuggingFace `saeedrmd/trajectory-prediction-nuscenes` 真实加载 + UniSim 2.0 风格 32 种天气/光照增强 + 三阶段 Token 预览
    - Cell 2 多模态 Tokenize：6 cam + 5 LiDAR + 5 Radar + 状态 + 导航 → Latent 2048D
    - Cell 3 三阶段模型搭建：70B 完整结构（骨干 + 想象/反思/行动 三头）
    - Cell 4 三阶段训练：Stage1 MIM+NFP+Con · Stage2 联合微调 · Stage3 蒸馏
    - Cell 5 车端蒸馏：INT4 + KV 共享 + SpecDec v3 → Orin X 45ms
    - Cell 6 **预测可视化**：独立组件 [SeedAdPredictionViz.js](/Users/harrisyu/WorkBuddy/20260409114249/maxwell-knowledge/src/components/SeedAdPredictionViz.js)，三视图同步（想象 BEV 40×40 占用栅格 + 反思 5 维风险雷达 + 行动轨迹 + 置信带），共享 30 帧时间轴，支持播放/拖动，3 种演示场景（城市巡航 / 紧急切入 / 行人横穿），保守模式触发实时可视
  - **数据闭环** Tab（[SeedAdDataLoop.js](/Users/harrisyu/WorkBuddy/20260409114249/maxwell-knowledge/src/components/SeedAdDataLoop.js)，8 层）
    - 相比 DriveWorld 的 7 层，新增 ★ **UniSim 2.0 合成数据层**（Seed-AD 专属创新）
    - 车端 13B 实时反思，只回传 collision > 0.3 的风险 case，减 80% 带宽
  - **核心指标**：nuScenes L2(3s) **0.54m** · 碰撞率 **0.11%** · FVD **47** · Orin X **45ms**（全面超越 VLA-World 0.58m / 0.15%，新 SOTA）

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

### 9d. 量化业务 `/quant/`
- ✅ **业务分组**下新增模块，系统梳理量化交易技术体系、国内外市场格局、大模型应用
- ✅ **6 大 Tab**：
  - 🌐 **全景总览**：量化交易定义 · 核心指标（全球 AUM ~$1.5T / 美股量化占比 60-70% / A 股 25-30%）· 发展历程（1952-2025）· 量化 vs 主观投资对比
  - 🧠 **策略体系**：6 大策略分类（统计套利 / CTA / 高频做市 / 因子投资 / ML 策略 / 期权策略），每类含子策略、风险收益指标
  - ⚙️ **技术栈**：5 层架构（数据层→研究层→执行层→风控层→基础设施）+ 编程语言选型（Python/C++/Rust/Java/R/FPGA）
  - 🤖 **AI & 大模型**：6 大应用场景（LLM 研报分析 / AI 因子挖掘 / LLM 策略生成 / 多模态情绪分析 / RL 交易 Agent / AI Agent 全链路）+ 风险与局限 + 8 篇核心论文
  - 📊 **国内外行情**：全球头部机构（Renaissance/Two Sigma/Citadel/D.E. Shaw/Man Group/Bridgewater）· 中国头部量化私募（幻方/九坤/明汯/灵均/衍复/锐天）· 中美对比 · 监管政策 · 市场趋势
  - 🛠️ **实战指南**：入门路径（4 阶段）· 平台选型（Qlib/Backtrader/VectorBT/聚宽/米筐/QuantConnect）· 数据源 · 回测六大陷阱 · 推荐书籍

### 9e. 全球经济与中国经济研究 `/economy/`
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
- ✅ **左侧竖向固定侧边栏**，按四大分组清晰展示所有 14 个导航条目
  - 🟣 知识（紫）：书架 · 文章 · 论文 · 模型 · 闭环 Infra · 工具箱
  - 🩵 业务（青）：自动驾驶 · 实验室 · **量化业务**（新增）
  - 🟠 战略（橙）：业务原生 · 创业雷达 · 经济研究
  - 🟢 动态（绿）：AI 声浪 · 全行业动态 · 进化日志
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
构建产物：纯静态文件（output: 'export'），无服务端依赖
部署：GitHub Pages（.github/workflows/nextjs.yml 官方模板）
      ⚠️ GitHub Pages 部署在 /signal/ 子路径下，next.config.js 中 `basePath`
         **必须在 production 构建时显式写为 `/signal`**（不能只依赖 configure-pages@v5
         自动注入 —— 它无法覆盖 `process.env.XXX` 动态读取的 basePath）。
         当前实现：basePath = isProd ? (NEXT_PUBLIC_BASE_PATH ?? '/signal') : ''
         并同步设置 assetPrefix，避免 _next/* 静态资源 404。
      线上地址：https://yuhuali1989.github.io/signal/
      远程仓库：git@github.com:yuhuali1989/signal.git（main 分支触发部署）
本地：localhost:3000
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

*最后更新：2026-04-21*

**本次主要更新内容**：
- 🚗 **声浪大扩充：37 条时间线式 AI 声浪**（从 10 条扩充至 37 条），覆盖 2020-2026 年完整时间线——
  - 📅 **年度总结 6 条**（2020-2025）：GPT-3 → DETR3D → ChatGPT/BEVFormer → GPT-4/UniAD/LLaMA → Sora/DeepSeek-V2/VLA → DeepSeek-R1/Qwen3/Gemini Robotics
  - 📆 **月度总结 3 条**（2026.1-3）：DeepSeek-R1 全球爆火 → Claude 3.7/数据闭环 → Gemini Robotics/GR00T N1/QwQ-32B
  - 📰 **周报 3 条**（2026.4 W1-W3）：MCP 生态扩展 → DriveLM/SGLang → Qwen3 发布/UniAD-mini
  - 🚗 **自动驾驶专题 14 条**：UniAD/DriveLM/Vista/GAIA-1/CarLLaVA/Copilot4D/BEVFormer/端到端综述/DriveAGI 等
  - 🚀 **模型发布 6 条**：Qwen3/DeepSeek-R1/DeepSeek-V3/Claude 3.7/Qwen2.5-VL/Gemini 2.5 Pro
  - ⚙️ **AI Infra 4 条**：vLLM/SGLang/TensorRT-LLM/NVIDIA Blackwell
  - 🤖 **Agent 1 条**：Anthropic MCP 协议
  - ✅ **所有 37 条 URL 经 curl 验证 200 + arXiv 论文标题交叉核实**，杜绝虚构链接

---

## 七、自动化任务提示词

> 以下提示词供 AI 智能体执行每日内容更新和质检任务时直接使用，复制粘贴即可运行。
> 
> ⚠️ **格式说明**：提示词使用五反引号（`````）包裹，内部可安全嵌套三反引号代码块。

---

### 📝 角色一：网站编辑员（内容更新）

`````text
你是 Signal 知识平台的 AI 编辑员，负责持续更新网站内容。

## 前置步骤（必须先执行）

1. 读取 /Users/harrisyu/WorkBuddy/20260409114249/signal/ai-wiki.md，
   了解当前模块进展、已有内容、技术栈和目录结构，避免重复建设。
2. 读取 content/news/news-feed.json 了解现有声浪条目（注意：这是大文件，只读前 100 行即可）。
3. 读取 content/papers/papers-index.json 了解现有论文列表。

---

## 本次更新任务（按优先级顺序执行，全程免审批）

### 任务 1：更新声浪 content/news/news-feed.json（最高优先级）

#### ⛔ 真实性铁律（违反则本次更新作废）

1. **每一条声浪必须来自真实、可追溯的公开信息源**，严禁凭印象 / 大模型幻觉 / 行业惯性编造任何内容。
2. **禁止虚构的元素**（一旦发现全部回滚并重来）：
   - 公司名 / 产品名 / 模型名 / 项目代号（如 "Llama 5"、"GPT-6" 等如果官方未发布，不得出现）
   - 版本号 / 参数量 / 发布日期 / 融资金额 / 估值 / Benchmark 分数
   - 人名 / 职位 / 引述原话
   - URL 地址（不允许猜测性地拼接路径或域名）
3. **每条新闻的 `url` 字段必须是真实可访问的 http(s) 链接**，且是原始出处（官方博客 / arXiv / GitHub Release / 权威媒体原文），**不是**搜索结果页、聚合首页或已失效页面。
4. **不确定时的处理**：如果无法确认某条信息的真实性或链接可用性，**宁可少写一条，也不允许编造填充凑数**。宁缺毋滥。

#### ✅ 信息源白名单（硬性规定，只能从以下来源采集，附 URL 基础路径和 curl 行为）

> ⚠️ **关键规则**：`url` 字段必须是下表中某个基础路径的**子页面**，不允许自行拼接不存在的路径。
> 例如 `https://www.anthropic.com/news/claude-opus-4-7` 是合法的（`/news/` 下的真实子页面），
> 但 `https://www.anthropic.com/news/claude-4-7-haiku` 如果 curl 返回 404 则**必须丢弃**。

##### 🤖 AI 公司官方博客/新闻（优先级最高）

| 来源 | URL 基础路径 | curl 行为 | 说明 |
|------|-------------|-----------|------|
| Anthropic | `https://www.anthropic.com/news/` | ✅ 200 | 每篇文章有独立 slug |
| Anthropic 研究 | `https://www.anthropic.com/research/` | ✅ 200 | 研究论文/技术博客 |
| OpenAI | `https://openai.com/index/` | ⚠️ 403 | curl 返回 403（反爬），但浏览器可访问，需人工确认 |
| Google DeepMind | `https://deepmind.google/discover/blog/` | ✅ 200 | |
| Google Blog | `https://blog.google/technology/google-deepmind/` | ✅ 200 | Gemini 等产品发布 |
| Google AI Dev | `https://ai.google.dev/` | ✅ 200 | API/SDK 文档和公告 |
| Meta AI | `https://ai.meta.com/blog/` | ✅ 200 | Llama 系列发布 |
| Qwen 通义千问 | `https://qwenlm.github.io/blog/` | ✅ 200 | Qwen 系列发布 |
| DeepSeek | `https://www.deepseek.com/blog/` | ✅ 200 | |
| Mistral | `https://mistral.ai/news/` | ✅ 200 | |
| NVIDIA 新闻 | `https://nvidianews.nvidia.com/news/` | ✅ 200 | 硬件/平台发布 |
| NVIDIA 开发者 | `https://developer.nvidia.com/blog/` | ✅ 200 | 技术博客 |

##### 📦 代码/模型/论文（可直接验证真实性）

| 来源 | URL 模式 | curl 行为 | 说明 |
|------|---------|-----------|------|
| GitHub Releases | `https://github.com/{org}/{repo}/releases/tag/{version}` | ✅ 200 | 必须是真实存在的 release tag |
| GitHub 仓库 | `https://github.com/{org}/{repo}` | ✅ 200 | 仓库必须真实存在 |
| HuggingFace 模型 | `https://huggingface.co/{org}/{model}` | ✅ 200 或 401（私有） | 模型页面 |
| HuggingFace 博客 | `https://huggingface.co/blog/` | ✅ 200 | |
| arXiv | `https://arxiv.org/abs/{id}` | ✅ 200 | 论文 ID 格式 YYMM.NNNNN |
| Papers with Code | `https://paperswithcode.com/` | ✅ 200 | |

##### 📰 权威媒体（部分有反爬，标注 curl 行为）

| 来源 | URL 基础路径 | curl 行为 | 说明 |
|------|-------------|-----------|------|
| TechCrunch | `https://techcrunch.com/` | ⚠️ 常 404 | URL 路径含日期，容易拼错，**必须 curl 验证** |
| The Verge | `https://www.theverge.com/` | ⚠️ 常 404 | 同上 |
| Bloomberg | `https://www.bloomberg.com/` | ⚠️ 403 | 付费墙 + 反爬，需人工确认 |
| Reuters | `https://www.reuters.com/` | ⚠️ 401 | 部分文章需登录 |
| The Information | `https://www.theinformation.com/` | ⚠️ 403/404 | 付费墙，**慎用**，优先找免费一手出处 |
| VentureBeat | `https://venturebeat.com/` | ✅ 200 | |
| MIT Tech Review | `https://www.technologyreview.com/` | ✅ 200 | |
| Ars Technica | `https://arstechnica.com/` | ✅ 200 | |

##### 🇨🇳 国内来源

| 来源 | URL 基础路径 | curl 行为 | 说明 |
|------|-------------|-----------|------|
| 36Kr | `https://36kr.com/` | ✅ 200 | 快讯页 `/newsflashes`，文章页 `/p/{id}` |
| 机器之心 | `https://www.jiqizhixin.com/` | ✅ 200 | |
| 量子位 | `https://www.qbitai.com/` | ✅ 200 | |
| InfoQ | `https://www.infoq.cn/` | ✅ 200 | |
| 虎嗅 | `https://www.huxiu.com/` | ✅ 200 | |
| 极客公园 | `https://www.geekpark.net/` | ✅ 200 | |

##### 🏛️ 行业/学术/政策

| 来源 | URL 基础路径 | curl 行为 | 说明 |
|------|-------------|-----------|------|
| Stanford HAI | `https://aiindex.stanford.edu/` | ✅ 200 | AI Index 年度报告 |
| LMSYS | `https://lmsys.org/blog/` | ✅ 200 | Arena 排行榜 |
| MCP 官方 | `https://modelcontextprotocol.io/` | ✅ 200 | MCP 协议规范 |
| MCP Servers | `https://github.com/modelcontextprotocol/servers` | ✅ 200 | MCP 工具生态 |
| EU AI Act | `https://digital-strategy.ec.europa.eu/` | ✅ 200 | 欧盟 AI 政策 |
| CVPR/NeurIPS/ICML | 各会议官网 | ✅ 200 | 学术会议 |
| a16z Blog | `https://a16z.com/blog/` | ✅ 200 | |

##### ❌ 禁用来源（一律不得使用）

- 任何未核实的自媒体号、公众号二手转载（除非是官方公众号）
- Reddit / X（Twitter）未经核实的爆料帖
- AI 生成的「行业观察」「趋势预测」类自媒体
- 已知不稳定/经常 404 的聚合站（如 `llm-stats.com`、`chat.lmsys.org` 等）
- **绝对禁止**：自行拼接 URL 路径。如果你不确定某个 URL 是否存在，**必须先 curl 验证**

#### 📋 采编流程（按顺序执行，不可跳步）

1. **采集**：每条新闻先写入本地草稿，**必须附带原始出处 URL**。
2. **验链**：写入 `news-feed.json` 前，对每条 `url` 执行 `curl -s -o /dev/null -w "%{http_code}" --max-time 8 -L <url>`，只有返回 **200 / 301 / 302** 才允许保留；返回 403（某些站点对 curl 限流但浏览器可访问）需人工确认。返回 404 / 410 / 5xx / timeout 的 **一律丢弃**该条，不得提交。
3. **去重**：与 news-feed.json 最近 60 天条目对比标题和 url，避免重复。
4. **写入**：JSON 文件使用 UTF-8 直接写中文，严禁 `\uXXXX` 转义。

#### 📝 内容要求

- 新增 8-10 条最新 AI 动态，重点覆盖：
  - LLM 前沿：模型发布 / 能力突破 / 推理优化（GPT / Claude / Gemini / Qwen / Llama 系列）
  - AI Infra：推理框架（vLLM / SGLang / TensorRT-LLM）、训练框架、GPU/NPU 硬件、KV Cache 优化
  - 闭环 Infra：数据合成、标注自动化、数据飞轮、合成数据质量评估
  - Agent/MCP：MCP 协议生态、Agent 编排、工具调用安全
  - 自动驾驶：VLA 进展、世界模型、端到端方案
  - 全行业：软件 / 游戏 / 硬件 / 创业融资 / 政策监管动态（同步更新 IndustryNewsFeed.js 中的 NEWS_DATA）
- 对 30 天前的旧条目（date 字段），将同类话题合并为一条摘要条目，减少冗余（合并时保留代表性原始 url）

#### 🗂️ 每条新闻字段（`url` 为必填，不允许缺失或为空字符串）

```json
{
  "id": "news-YYYYMMDD-xxx",
  "title": "来自原文的准确标题（允许适度中文化，但不得夸大/改变语义）",
  "summary": "80-150 字，基于原文事实撰写，关键数字必须和原文一致",
  "source": "原始出处名称，如 OpenAI Blog / arXiv / The Information",
  "url": "https://原始出处的完整链接（必填且经过 curl 校验）",
  "date": "YYYY-MM-DD（原文发布日期，不是抓取日期）",
  "category": "llm | infra | agent | ad | data | industry",
  "tags": ["..."],
  "hot": true,
  "region": "global | china"
}
```

### 任务 2：新增文章 content/articles/（每次至少 2 篇）

- ⚠️ **去重校验（写文章前必须执行）**：
  1. 先用 `ls content/articles/` 列出所有已有文章文件名
  2. 用 `grep -l "关键词" content/articles/*.md` 搜索已有文章中是否已覆盖相同主题
  3. 对比已有文章的 frontmatter 中的 title / tags / summary，确认不存在以下重复情况：
     - **标题重复**：与已有文章标题相同或高度相似（如仅改了日期）
     - **主题重复**：同一技术/产品/事件已有深度文章，无实质性新内容
     - **角度重复**：同一话题已从相同角度分析过（如都是"入门介绍"或"原理解析"）
  4. 如果主题已有文章但有重大更新（如新版本发布、重要实验结果），应**更新已有文章**而非新写一篇
  5. 允许同一大方向的不同细分主题（如"vLLM 架构解析"和"SGLang vs vLLM 性能对比"不算重复）
- 选题方向（优先选当前最热的 + 尚未覆盖的角度）：
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
    3. 核心方法（配伪代码或公式，用 `$...$` 包裹数学公式）
    4. 关键实验结果（表格对比，数字要具体）
    5. 创新点分析（与前人工作的区别）
    6. 局限性与未来方向
    7. 对工程实践的启示
  - 同步更新 papers-index.json，添加新论文的索引条目

### 任务 4b：更新创业雷达 src/components/IdeaRadar.js（每日更新）

- **每日必做**：扫描 TechCrunch / Crunchbase / 36Kr / IT桔子 / ProductHunt / YC HN，更新 IDEAS 数组中各方向的 signalDate 和 signal 标注（🔥热点/👀关注）
- 补充新出现的海外创业公司（overseas 数组），尤其关注 YC 最新批次、a16z/Sequoia/Benchmark 新投项目
- 补充国内创业动态：关注高瓴/红杉中国/源码资本等新投项目，36Kr/IT桔子 融资快讯
- 新增创业方向时覆盖 5 大行业：AI 工具 / 游戏科技 / 消费硬件 / 开发者工具 / 企业 SaaS
- 每个新方向必须包含：market（市场规模）、barrier（进入壁垒）、china（中国机会）、overseas（≥2 家对标）、opportunity（中国机会窗口）
- **每日至少更新 2-3 个方向的信号标注**，每周新增 ≥1 个创业方向
- 关注维度：融资事件 / 产品发布 / 政策变化 / 市场格局变动 / 关键人物动态

### 任务 4c：更新全行业动态 src/components/IndustryNewsFeed.js（每日更新，≥10 条）

在 NEWS_DATA 数组头部插入最新新闻条目。

#### ⛔ 真实性铁律（与任务 1 声浪同等重要，违反则本次更新作废）

1. **每条动态必须基于真实发生的新闻事件**，严禁凭行业印象 / 大模型幻觉编造。常见编造陷阱（**一律禁止**）：
   - 虚构公司融资金额 / 估值 / 轮次 / 领投方
   - 虚构产品名 / 版本号 / 发布日期 / 交付时间
   - 虚构季报营收 / 利润 / 市值 / 股价变动数字
   - 虚构并购金额 / 并购完成时间 / 并购双方
   - 虚构官员表态 / 政策文件 / 监管动向
2. **`link` 字段必填且必须与本条动态一一对应**：
   - ✅ 必须是**本条动态的原始新闻页完整 URL**（官方新闻稿 / 一手媒体报道 / 官方公告）
   - ❌ 禁止：聚合首页（如 `https://techcrunch.com/`）、分类/标签页（如 `techcrunch.com/category/...`）、搜索结果页
   - ❌ 禁止：指向无关页面（如条目讲 Databricks 新产品，link 却指向 Databricks 官网首页）
   - ❌ 禁止：指向社交媒体二次转发（必须找到一手出处）
3. **`date` 字段必须是该新闻事件的真实发布日期**：
   - 不是你抓取/撰写这条条目的日期（今天）
   - 不是"看起来像是最近"猜的日期
   - 不是转载媒体的转载日期（要找回一手出处的原始发布日）
   - 必须 ≤ 今天（不得为未来日期）
4. **`title` / `summary` 必须忠于原文事实**：
   - title 允许中文化，不得夸大或扭曲语义
   - summary 中的公司名 / 产品名 / 数字（金额 / 百分比 / 日期）必须与原文一字不差
   - 不得将外媒原标题自行翻译后再编造并不存在的配图 / 引述 / 数据点
5. **`source` 必须是原始出处**（如 The Information / Bloomberg / Databricks Blog），不是转载站
6. **不确定时**：宁可当日少发一条，也不允许编造凑数。宁缺毋滥。
7. **当日新增条数没有下限**：如果当日没有可验证的重大事件，可以**一条都不新增**。严禁为了"凑够 10 条"而从行业印象里编造动态。

#### 🚨 历史事故案例（必读）

**2026-04-21 link 修复事件**：
- 背景：自动化任务累计跑到第 25 轮（id 2501-2510 等条目），连续多日"每日新增 10 条"。
- 用户反馈："新闻链接还是不对，跟动态里的总结完全对不上啊"。
- 排查发现：大量 link 指向**官网首页 / 新闻列表 / 博客首页**（如 `anthropic.com/news`、`databricks.com/blog`、`salesforce.com/news/`、`qianxin.com/`、`36kr.com/newsflashes`），违反"本条动态原文完整 URL"的规定。
- 注意：这些条目的**事件本身是真实的**（现在就是 2026 年 4 月，Qwen3 发布、Cursor 融资、Agentforce 2.0 等都是真实发生的），问题只是 link 不对。
- 处置：删除 17 个坏 link 行（首页/列表页），让对应条目降级为无链接静态卡；保留所有真实事件条目。
- 教训（未来自动化任务必须遵守）：
  - ❌ **没有具体文章 URL = 不填 link**。宁可不带 link 让 UI 降级为静态卡，也不允许用官网首页/博客首页/新闻列表兜底
  - ❌ **"每日 10 条"不是硬指标**。真实世界并非每天都有 10 条值得写的软件行业事件
  - ✅ 遇到你熟悉但拿不准具体文章 URL 的事件，直接省略 link 字段，UI 自动降级为静态卡

#### 📋 采编流程（按顺序执行，不可跳步）

1. **采集**：从下方信息源扫描当日真实新闻，每条记录 { 标题、摘要、原始出处、原始 URL、原文发布日期 }
2. **验链**：对每条 link 执行 `curl -s -o /dev/null -w "%{http_code}" --max-time 8 -L -A "Mozilla/5.0" <url>`
   - 返回 200/301/302 才保留；返回 403 需浏览器人工确认（常见于 Bloomberg / The Information）
   - 返回 404/410/5xx/timeout 的一律丢弃，不允许提交
3. **校验对应关系**：每条写入前，打开 link 用 Cmd+F 对照 summary 里的关键数字 / 公司名 / 产品名，**至少命中一个**才允许保留；一个都对不上的直接丢弃
4. **去重**：与 NEWS_DATA 近 60 天条目对比 title 与 link，避免重复
5. **写入**：在 NEWS_DATA 数组头部插入

#### 🌐 信息源白名单（硬性规定，附具体 URL 和 curl 行为）

> ⚠️ **关键规则**：`link` 字段必须是下表中某个基础路径的**具体文章子页面**。
> 禁止指向首页/分类页/搜索页。禁止自行拼接不存在的 URL 路径。

##### 🏢 软件行业公司官方（优先级最高，一手出处）

| 来源 | URL 基础路径 | curl 行为 | 说明 |
|------|-------------|-----------|------|
| Databricks | `https://www.databricks.com/blog/` | ✅ 200 | 产品发布/技术博客 |
| Snowflake | `https://www.snowflake.com/en/blog/` | ✅ 200 | |
| AWS | `https://aws.amazon.com/blogs/` | ✅ 200 | 各子博客如 `/blogs/aws/`、`/blogs/machine-learning/` |
| Google Cloud | `https://cloud.google.com/blog/` | ✅ 200 | |
| Azure | `https://azure.microsoft.com/en-us/blog/` | ✅ 200 | |
| Salesforce | `https://www.salesforce.com/news/` | ✅ 200 | |
| ServiceNow | `https://www.servicenow.com/blogs/` | ✅ 200 | |
| CrowdStrike | `https://www.crowdstrike.com/blog/` | ✅ 200 | |
| Palo Alto Networks | `https://www.paloaltonetworks.com/blog/` | ✅ 200 | |
| Vercel | `https://vercel.com/blog/` | ✅ 200 | |
| Cloudflare | `https://blog.cloudflare.com/` | ✅ 200 | |
| Confluent | `https://www.confluent.io/blog/` | ✅ 200 | |
| MongoDB | `https://www.mongodb.com/blog/` | ✅ 200 | |
| 阿里云 | `https://www.alibabacloud.com/blog/` | ✅ 200 | |
| 华为云 | `https://www.huaweicloud.com/` | ✅ 200 | |
| 腾讯云 | `https://cloud.tencent.com/developer/` | ✅ 200 | |

##### 📰 权威媒体（注意 curl 行为差异）

| 来源 | URL 基础路径 | curl 行为 | 说明 |
|------|-------------|-----------|------|
| Bloomberg | `https://www.bloomberg.com/` | ⚠️ 403 | 付费墙+反爬，需人工确认 |
| Reuters | `https://www.reuters.com/` | ⚠️ 401 | 部分文章需登录 |
| The Information | `https://www.theinformation.com/` | ⚠️ 403/404 | 付费墙，**慎用** |
| TechCrunch | `https://techcrunch.com/` | ⚠️ 常 404 | URL 含日期，容易拼错 |
| The Verge | `https://www.theverge.com/` | ⚠️ 常 404 | 同上 |
| WSJ | `https://www.wsj.com/` | ⚠️ 403 | 付费墙 |
| FT | `https://www.ft.com/` | ⚠️ 403 | 付费墙 |
| VentureBeat | `https://venturebeat.com/` | ✅ 200 | |
| Seeking Alpha | `https://seekingalpha.com/` | ✅ 200 | 财报分析 |

##### 🇨🇳 国内来源

| 来源 | URL 基础路径 | curl 行为 | 说明 |
|------|-------------|-----------|------|
| 36Kr | `https://36kr.com/` | ✅ 200 | 快讯 `/newsflashes`，文章 `/p/{id}` |
| 虎嗅 | `https://www.huxiu.com/` | ✅ 200 | |
| 极客公园 | `https://www.geekpark.net/` | ✅ 200 | |
| InfoQ | `https://www.infoq.cn/` | ✅ 200 | |
| 澎湃新闻 | `https://www.thepaper.cn/` | ✅ 200 | |
| 第一财经 | `https://www.yicai.com/` | ✅ 200 | |
| 奇安信 | `https://www.qianxin.com/` | ✅ 200 | 安全行业 |

##### 📊 财经/监管数据

| 来源 | URL 基础路径 | curl 行为 | 说明 |
|------|-------------|-----------|------|
| SEC EDGAR | `https://www.sec.gov/cgi-bin/browse-edgar` | ✅ 200 | 10-K/10-Q/8-K 原始文件 |
| Yahoo Finance | `https://finance.yahoo.com/` | ✅ 200 | IR 链接 |
| Crunchbase | `https://news.crunchbase.com/` | ✅ 200 | 融资数据 |
| Y Combinator | `https://www.ycombinator.com/companies` | ✅ 200 | YC 批次 |
| Gartner | `https://www.gartner.com/en/newsroom/` | ⚠️ 403 | 反爬，需人工确认 |
| 港交所披露易 | `https://www.hkexnews.hk/` | ✅ 200 | |

##### ❌ 禁用来源

- 任何未核实的微信公众号二手转发
- Reddit / X 未经核实的爆料
- "AI 生成的行业观察" 类自媒体号
- **绝对禁止**：自行拼接 URL 路径，如果不确定某个 URL 是否存在，**必须先 curl 验证**

#### 📝 内容要求

- **覆盖 6 大分类**（与页面 CATEGORIES 定义一致，注意 category 字段必须使用以下 key）：

  | key | emoji | 名称 | 覆盖范围 |
  |-----|-------|------|---------|
  | `data` | 🗄️ | 数据平台 | Databricks / Snowflake / dbt Labs / Fivetran / Confluent / Cloudera / Teradata / MongoDB / ClickHouse / StarRocks / Apache Iceberg 生态 |
  | `cloud` | ☁️ | 云服务 | AWS / Azure / GCP / 阿里云 / 腾讯云 / 华为云 / Oracle Cloud / IBM Cloud / Vercel / Cloudflare |
  | `software` | 💼 | 企业软件 | Salesforce / ServiceNow / SAP / Oracle / Workday / Atlassian / Notion / Figma / Canva / 用友 / 金蝶 / 飞书 / 钉钉 |
  | `security` | 🔐 | 安全 | CrowdStrike / Palo Alto Networks / Okta / Zscaler / Wiz / SentinelOne / Fortinet / 奇安信 / 深信服 / 360 |
  | `startup` | 🚀 | 融资动态 | 创业公司融资 / IPO / 并购 / YC 批次 / 独角兽动态 |
  | `market` | 📊 | 市场财报 | 季报 / 年报 / 市值变动 / 大型并购 / 行业分析报告 |

- 国内外各占约一半（region: 'china' | 'global'）
- **每日至少新增 10 条**，热点事件（hot: true）不少于 3 条
- 对超过 90 天的旧条目进行合并归档（同类话题合并为一条汇总，保留代表性 link）
- ⚠️ category 字段只能使用上表 6 个值，不要使用其他值（如 ai / game / hardware / funding / policy 等），否则会导致页面报错

#### 🗂️ 每条动态字段（`link` 为必填，且必须经 curl 校验、与 summary 一一对应）

```js
{
  id: 2511,                       // 数字自增，2501+ 是 2026 年新增
  category: 'data',               // 只能用 data/cloud/software/security/startup/market
  region: 'global',               // 或 'china'
  title: '来自原文的准确标题（允许中文化，不得夸大语义）',
  summary: '80-150 字，基于原文事实，关键数字与原文一致',
  source: 'Databricks Blog',      // 一手出处名，不是转载站
  date: '2026-04-21',             // 原文真实发布日，不是抓取日期
  tags: ['Databricks', 'Agent'],
  hot: true,
  link: 'https://www.databricks.com/blog/mosaic-ai-agent-framework-2', // 必填，原文完整 URL，经 curl 校验
},
```

#### 🧹 历史遗留处理

- NEWS_DATA 中 id 2300 之前的历史条目（2023 及更早）部分**缺 link 字段**
- **本次及以后的更新中，遇到这些老条目时**：
  - 如果能找回一手出处 URL，补齐 `link` 字段
  - 如果找不到，且该条动态已超过 180 天，**直接合并进该年的"汇总条目"或删除**，不要留着没有 link 的孤立条目

### 任务 4d：更新经济研究 src/app/economy/page.js（每日更新）

- **每日必做**：跟踪宏观经济核心数据变动，更新页面中的数据和研判
- **数据源覆盖**（每日必须扫描）：
  - 🏦 央行/官方：美联储官网（FOMC 声明/纪要/点阵图）、中国人民银行（MLF/LPR/逆回购）、国家统计局、海关总署
  - 📊 财经数据：Bloomberg / Reuters / FRED / Wind / 东方财富 / 同花顺
  - 📰 分析研报：高盛 / 摩根士丹利 / 中金 / 中信 / 华泰 等卖方研报
  - 🌐 国际组织：IMF / World Bank / BIS / WTO 报告
- **更新内容**：
  - 📈 **汇率预测 Tab**：更新最新汇率数据点、调整三大情景概率和区间（如有重大事件）
  - 🏦 **美联储动态 Tab**：FOMC 会议结果 / 官员讲话 / 市场利率预期变化（CME FedWatch）
  - 🇺🇸 **美国经济 Tab**：GDP/CPI/PCE/非农/失业率/PMI 等指标发布时即时更新
  - 🇨🇳 **中国经济 Tab**：GDP/CPI/PPI/PMI/进出口/社融/M2 等指标发布时即时更新
  - ⚠️ **风险因子 Tab**：重大地缘政治事件 / 贸易政策变化 / 关税调整 即时更新风险评估
- **更新频率细则**：
  - 重大数据发布日（非农/CPI/FOMC 等）：当日必须更新对应 Tab
  - 普通交易日：至少更新汇率数据 + 1 条市场动态
  - 每周末：回顾本周数据，更新综合研判结论
  - 每月初：全面刷新所有 Tab 数据，更新预测区间

### 任务 5：更新模型数据 content/gallery/models.json（每次至少补充 2 个模型）

- 重点补充：
  - 自动驾驶专用模型（DriveVLM、OpenDriveVLA、SparseDrive 等）
  - 最新基础模型（Qwen3、Gemini 2.5 Pro、Claude 4 等）
  - 每个模型包含：name, provider, params, context, benchmark_scores{},
    architecture, release_date, open_source, ad_specific(bool)
- 注意：models.json 是大文件(122KB)，使用 replace_in_file 追加，不要整体重写

### 任务 6：更新进化日志 content/evolution-log.json（重要）

- 每次更新结束后，将本次的每项操作作为独立条目追加到 JSON 数组头部
- **统一使用新格式**（禁止使用旧的 `{ date, type, agent, message, slug }` 格式，那种格式在进化日志页面上显示会丢失细节）：

  ```json
  {
    "id": "evo-YYYYMMDD-xxx",
    "type": "news | article | book | paper | model | system",
    "title": "一句话简明标题（≤40字，体现核心变更）",
    "description": "3-5 句详细描述：本次做了什么、为什么做、影响范围/数据指标（如有）。避免只写一个模块名",
    "date": "YYYY-MM-DD HH:MM",
    "agent": "editor-v2"
  }
  ```

- **title 撰写要求**：动宾结构，含主体对象（如"新增《XX》第 N 章"、"声浪新增 8 条覆盖 XXX"）
- **description 撰写要求**：
  - 必须包含**具体内容点**（模型名/论文名/技术名/数字指标）
  - 对新增类：说明核心亮点（如"MMLU-Pro 91.2% 超 Opus 4.6"）
  - 对更新类：说明追加了哪些小节、覆盖了什么新进展
  - 对修复类：说明问题根因和修复方式
  - ≥60 字，≤200 字
- type 可选：`news | article | book | paper | model | system`（system 用于部署/配置/Bug 修复类）
- 每次至少追加 5-8 条独立日志（对应 5-8 次独立的内容/代码变更）

### 任务 7：更新文档 ai-wiki.md（重要）

- 更新「当前模块进展」中受影响的章节（如新增模块、Tab、重要功能点）
- 更新「最后更新」时间戳为当前日期
- **必须更新「本次主要更新内容」区块**（位于「最后更新」时间戳下方），按以下要求撰写：
  - 不能只写"声浪/文章/论文/模型"的简略一句话
  - 使用分类 emoji + 加粗标题的方式，逐项列出本次的**主要更新点**
  - 涵盖维度（按本次实际变更列出，可选）：
    - 🚀 **部署/基建变更**：CI/CD、basePath、依赖升级等
    - ✨ **新增模块/功能**：新页面、新 Tab、新组件
    - 🎨 **交互/可视化升级**：UI 改版、新可视化、新交互方式
    - 🔧 **Bug 修复/重构**：关键修复、代码重构、性能优化
    - 📝 **提示词/规范更新**：AI 编辑员/质检员提示词迭代
    - 📚 **每日内容更新**：声浪 +X 条、文章 +X 篇、书籍 +X 章、论文 +X 篇、模型 +X 个、全行业动态 +X 条（给出具体数字）
  - 每项要用**一句话清楚说明变更影响或价值**，而不是只列模块名
  - 仅保留本次最新一轮的更新摘要，覆盖而非追加历史

### 任务 8：提交代码

- git add -A
- git commit -m "content: 每日内容更新 - 声浪/文章/论文/模型 [$(date +%Y-%m-%d)]"
- git push origin main

---

## 重要注意事项

- ⛔ **真实性总则（最高优先级）**：声浪 / 全行业动态 / 创业雷达的**所有条目必须基于真实公开信息**，严禁编造公司名、产品、数字、链接；**每条必须带真实 url 并通过 curl 可达性校验**；宁可少发，绝不造假（详见任务 1 和任务 4c 的真实性铁律）
- 所有文件必须使用 UTF-8 编码，中文直接写入，严禁 Unicode 转义（\uXXXX 会导致乱码）
- JSON 文件修改前先用 grep_search 确认当前末尾结构，避免破坏 JSON 格式
- 大文件（isBigFile=true）使用 replace_in_file 或 multi_replace，不要用 edit_file
- 每次迭代保证：声浪 ≥8 条新增、文章 ≥2 篇、书籍 ≥1 章更新、论文 ≥1 篇详细解读、模型 ≥2 个
- 创业雷达（IdeaRadar.js）每日更新 2-3 个方向信号标注，每周新增 ≥1 个创业方向
- 全行业动态（IndustryNewsFeed.js）每日新增 ≥10 条（热点 ≥3 条），category 只能用 data/cloud/software/security/startup/market，保持活跃列表 ≤60 条
- 经济研究（economy/page.js）重大数据发布日当日更新，普通日至少更新汇率+1条动态，每月初全面刷新
`````

---

### 🔍 角色二：质检员（可用性检查）

`````text
你是 Signal 知识平台的 AI 质检员，负责验证网站内容更新质量和服务可用性。

## 前置步骤

读取 ai-wiki.md 了解当前模块结构，确认检查范围。

---

## 检查任务（全程免审批）

### 检查 1：服务可用性（HTTP 状态码）

依次 curl 以下路由，确认均返回 200：

```bash
for path in "/" "/books/" "/articles/" "/papers/" "/models/" "/news/" \
            "/vla/" "/strategy/" "/idea/" "/industry-news/" "/evolution/" \
            "/data-infra/" "/tools/" "/lab/" "/quant/" "/economy/" \
            "/gallery/" "/benchmarks/"; do
  status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 http://localhost:3000${path})
  echo "${status} ${path}"
done
```

记录所有非 200 的路由，分析原因。

### 检查 2：内容格式检查

```bash
# 检查 JSON 文件格式合法性
for f in content/news/news-feed.json content/papers/papers-index.json \
          content/evolution-log.json; do
  python3 -c "import json,sys; json.load(open('$f')); print('OK: $f')" 2>&1
done

# 检查是否存在 Unicode 转义乱码（\uXXXX 形式的中文）
grep -r '\\u[0-9a-fA-F]\{4\}' content/news/news-feed.json | head -5
grep -r '\\u[0-9a-fA-F]\{4\}' content/papers/papers-index.json | head -5
```

### 检查 3：声浪 + 全行业动态 链接真实性与可用性（关键！）

> 声浪和全行业动态的价值就在于"真实 + 可追溯"，链接无效 = 内容失信。本检查必须逐条执行并输出明细。

```bash
# 全量检测 news-feed.json 与 IndustryNewsFeed.js 中条目的 url/link 可访问性
python3 <<'PY'
import json, subprocess, re, sys, pathlib

def check(url):
    r = subprocess.run(['curl','-s','-o','/dev/null','-w','%{http_code}',
                        '-L','--max-time','8',
                        '-A','Mozilla/5.0 (SignalBot)',
                        url], capture_output=True, text=True)
    return r.stdout.strip()

total_bad = 0

# ============ 1) 声浪 news-feed.json ============
data = json.load(open('content/news/news-feed.json'))
items = data.get('items', data if isinstance(data, list) else [])
missing = [i.get('id','?') for i in items if not i.get('url')]
print(f'[news] 总数={len(items)}, 缺 url={len(missing)}')
if missing:
    print('  缺 url 的条目:', missing[:10])

items_sorted = sorted([i for i in items if i.get('url','').startswith('http')],
                      key=lambda x: x.get('date',''), reverse=True)[:20]
bad = []
for it in items_sorted:
    code = check(it['url'])
    ok = code in ('200','301','302','303')
    mark = '✅' if ok else '❌'
    print(f"  {mark} {code} {it.get('date','')} {it['url'][:80]}")
    if not ok and code not in ('403',):
        bad.append((it.get('id'), code, it.get('url')))
print(f'[news] 失效链接 {len(bad)} 条')
for b in bad:
    print('  -', b)
total_bad += len(bad)

# ============ 2) 全行业动态 IndustryNewsFeed.js 中 NEWS_DATA ============
# 直接用正则从 JS 文件中提取 { id, date, link } 条目信息
text = pathlib.Path('src/components/IndustryNewsFeed.js').read_text(encoding='utf-8')
# 按单个对象块切分
blocks = re.findall(r'\{\s*id:\s*(\d+),.*?\}', text, re.DOTALL)
ind_total = len(blocks)
ind_missing = 0
ind_links = []   # (id, date, link)
for blk in blocks:
    m_id   = re.search(r'id:\s*(\d+)', blk)
    m_date = re.search(r"date:\s*['\"]([^'\"]+)['\"]", blk)
    m_link = re.search(r"link:\s*['\"](https?://[^'\"]+)['\"]", blk)
    if not m_link:
        ind_missing += 1
        continue
    ind_links.append((m_id.group(1) if m_id else '?',
                      m_date.group(1) if m_date else '',
                      m_link.group(1)))

print(f'\n[industry] 总数={ind_total}, 缺 link={ind_missing}')
if ind_missing > 0:
    print(f'  ⚠️ 有 {ind_missing} 条历史条目缺少 link 字段，请按任务 4c「历史遗留处理」补齐或合并')

# 按日期倒序抽检最近 20 条 link
ind_links.sort(key=lambda x: x[1], reverse=True)
ind_bad = []
for iid, d, url in ind_links[:20]:
    code = check(url)
    ok = code in ('200','301','302','303')
    mark = '✅' if ok else '❌'
    print(f"  {mark} {code} {d} id={iid} {url[:80]}")
    if not ok and code not in ('403',):
        ind_bad.append((iid, code, url))
print(f'[industry] 失效链接 {len(ind_bad)} 条')
for b in ind_bad:
    print('  -', b)
total_bad += len(ind_bad)

# ============ 总结 ============
if total_bad > 0 or missing or ind_missing:
    print(f'\n⚠️ 合计问题：news 缺 url={len(missing)}, news 失效={len(bad)}, '
          f'industry 缺 link={ind_missing}, industry 失效={len(ind_bad)}')
    print('请对上述问题执行以下操作之一：')
    print('  a) 替换为真实可访问的原始出处 url')
    print('  b) 整条删除（不要留着带 404 的链接）')
    sys.exit(1)
else:
    print('\n✅ 所有抽检链接均可访问，无缺失字段')
PY
```

**判定标准**：
- 任一侧（news / industry）失效链接数 > 0 → 质检不通过，必须先修复再发布
- 任一侧缺 url/link 字段的条目 > 0 → 质检不通过（真实性铁律要求每条都必须有 url/link）
- 403 状态：有些网站对 curl 做反爬（如 Bloomberg / The Information），需浏览器人工打开确认

### 检查 3b：声浪 + 全行业动态 内容三维度真实性抽查（链接 × 对应关系 × 日期）

> 检查 3 解决"链接能不能打开"，检查 3b 解决"链接打开后和我们的文案是否匹配"。
> 本检查同时覆盖：
> - **声浪** news-feed.json 本轮新增的全部条目（>10 条则抽查 5 条 + 全部 hot）
> - **全行业动态** IndustryNewsFeed.js NEWS_DATA 本轮新增的全部条目（>10 条则抽查 5 条 + 全部 hot）

#### 📋 逐条校验清单（每条都要跑完这 3 维）

对每条被抽查的声浪 / 动态，打开 `url` 或 `link` 后逐项核对：

1. **🔗 链接可用性（深度校验，比检查 3 更严格）**
   - url/link 返回 200/301/302 ✓（继承检查 3 的 curl 结果）
   - 页面实际内容**不是**"Page Not Found" / "文章已下架" / "404" / 登录墙兜底页
   - url/link **精确指向本条新闻的原文页**，不是：
     - ❌ 官网首页（如只写到 `https://openai.com/` 或 `https://databricks.com/` 而不是具体 blog 链接）
     - ❌ 分类/标签聚合页（如 `https://techcrunch.com/category/ai/`）
     - ❌ 搜索结果页（如 `google.com/search?q=...`）
     - ❌ X（Twitter）/ 社交媒体对新闻的二次转发（必须找到一手出处）

2. **🎯 对应关系准确性（title / summary / source / tags 必须与原文一致）**
   - **title**：允许中文化，但**不得改变语义、不得夸大**
     - 反例：原文 "OpenAI releases GPT-4o mini evaluation update" → 不得写成 "OpenAI 震撼发布 GPT-4o mini 性能暴涨"
   - **summary**：关键要素必须可在原文中**逐一找到**（用 Cmd+F 验证）：
     - 公司名 / 产品名 / 模型名 / 版本号 —— 一字不差
     - 数字指标（参数量 / Benchmark 分数 / 融资金额 / 市值 / 价格）—— 必须与原文完全一致
     - 人名 / 职位 —— 必须与原文一致
     - 引述的"原话"—— 必须是原文的直接引用，不得转写
   - **source**：必须是原始出处名（OpenAI Blog / arXiv / Bloomberg / Databricks Blog 等），**不是**二手转载站的名字
     - 反例：原文首发在 The Information，不得把 source 写成"36Kr"只因为 36Kr 翻译转载了一下
   - **category / tags**：与内容领域匹配（如 vLLM 1.0 发布不应打 `ad` 标签；全行业动态的 category 必须是 data/cloud/software/security/startup/market 之一）

3. **📅 日期准确性（最容易出错的一维，必须死磕）**
   - `date` 字段必须是**原文发布日期**，不是：
     - ❌ 你抓取/撰写这条新闻的日期（今天）
     - ❌ "看起来像是最近"猜的日期
     - ❌ 转载媒体的转载日期（要找回一手出处的原始发布日）
   - 必须 **≤ 今天**（不允许出现未来日期，曾多次发生 LLM 幻觉写成明年日期）
   - 必须 **≥ 2023-01-01**（过旧的条目应合并归档而不是作为新增）
   - 校验方法：打开 url/link，在文章顶部/底部找 "Published" / "发布时间" / arXiv 的 `[Submitted on ...]` 字段对照

#### 🤖 自动化校验脚本（同时覆盖 news-feed.json 和 IndustryNewsFeed.js）

```bash
python3 <<'PY'
import json, subprocess, re, pathlib
from datetime import date, datetime

TODAY = date.today()
MIN_DATE = date(2023, 1, 1)

def fetch_text(url):
    """获取页面纯文本，供后续比对"""
    r = subprocess.run(['curl','-s','-L','--max-time','10',
                        '-A','Mozilla/5.0 (SignalBot)', url],
                       capture_output=True, text=True)
    return re.sub(r'<[^>]+>', ' ', r.stdout or '')

BAD_URL_PATTERNS = [
    r'^https?://[^/]+/?$',                      # 纯首页
    r'(google\.com/search|bing\.com/search)',   # 搜索结果页
    r'twitter\.com/?$', r'x\.com/?$',           # 社媒首页
]

def check_item(iid, title, summary, source, date_s, url, kind='news'):
    """对一条条目执行三维度校验，返回 issue 列表"""
    out = []
    # ① 日期准确性
    try:
        d = datetime.strptime((date_s or '')[:10], '%Y-%m-%d').date()
        if d > TODAY:
            out.append((kind, iid, '日期', f'date={d} 为未来日期'))
        if d < MIN_DATE:
            out.append((kind, iid, '日期', f'date={d} 过旧（<2023），应归档合并'))
    except Exception:
        out.append((kind, iid, '日期', f'date 字段非法: {date_s}'))
    # ② 必填字段
    for name, val in [('url/link', url), ('title', title),
                      ('summary', summary), ('source', source)]:
        if not val:
            out.append((kind, iid, '字段', f'{name} 为空'))
    # ③ url 指向性
    if url and any(re.search(p, url) for p in BAD_URL_PATTERNS):
        out.append((kind, iid, '链接', f'url 不是文章原文: {url}'))
    # ④ 对应关系（summary 关键数字必须在原文出现）
    if summary and url and url.startswith('http'):
        nums = re.findall(r'\d{2,}(?:[.,]\d+)?[%xB亿千万]?', summary)
        if len(nums) >= 2:
            text = fetch_text(url)
            missing = [n for n in nums[:5] if n not in text]
            if len(missing) > len(nums[:5]) // 2:
                out.append((kind, iid, '对应',
                            f'summary 数字 {missing} 在原文未找到（高度疑似编造）'))
    return out

all_issues = []

# ============ 1) 声浪 news-feed.json ============
data = json.load(open('content/news/news-feed.json'))
news_items = data.get('items', data if isinstance(data, list) else [])
# 仅检查本月新增条目
month_prefix = TODAY.isoformat()[:7]
recent_news = [i for i in news_items
               if i.get('date','').startswith(month_prefix)]
print(f'[news] 本月新增条目数: {len(recent_news)}')
for it in recent_news:
    all_issues.extend(check_item(
        it.get('id','?'), it.get('title',''), it.get('summary',''),
        it.get('source',''), it.get('date',''), it.get('url',''),
        kind='news'))

# ============ 2) 全行业 IndustryNewsFeed.js ============
text = pathlib.Path('src/components/IndustryNewsFeed.js').read_text(encoding='utf-8')
blocks = re.findall(r'\{\s*id:\s*\d+,.*?\n\s*\},', text, re.DOTALL)
def grab(pat, blk, default=''):
    m = re.search(pat, blk)
    return m.group(1) if m else default

recent_ind = []
for blk in blocks:
    d = grab(r"date:\s*['\"]([^'\"]+)['\"]", blk)
    if d.startswith(month_prefix):
        recent_ind.append({
            'id':       grab(r'id:\s*(\d+)', blk, '?'),
            'title':    grab(r"title:\s*['\"]([^'\"]+)['\"]", blk),
            'summary':  grab(r"summary:\s*['\"]([^'\"]+)['\"]", blk),
            'source':   grab(r"source:\s*['\"]([^'\"]+)['\"]", blk),
            'date':     d,
            'link':     grab(r"link:\s*['\"](https?://[^'\"]+)['\"]", blk),
        })

print(f'[industry] 本月新增条目数: {len(recent_ind)}')
for it in recent_ind:
    all_issues.extend(check_item(
        it['id'], it['title'], it['summary'], it['source'],
        it['date'], it['link'], kind='industry'))

# ============ 输出 ============
print(f'\n自动化校验发现 {len(all_issues)} 个问题:')
for kind, iid, cat, msg in all_issues:
    print(f'  [{kind}][{cat}] id={iid}: {msg}')

if all_issues:
    print('\n⛔ 必须修正所有问题后才能发布')
else:
    print('\n✅ 三维度校验全部通过')
PY
```

#### ✋ 人工必做环节（脚本覆盖不到的）

- 对每条抽查项（**声浪 + 全行业动态**），**真的打开 url/link，用 Cmd+F 搜 summary 里的关键数字/公司名**，确认原文中存在
- 对 title 的中文化做语义 check —— 是否扭曲了原意
- 对 source 做溯源 —— 原文首发在哪里？现在写的 source 是不是真正的一手出处？
- 特别对全行业动态中涉及**融资金额 / 并购价格 / 季报数字**的条目重点核对，这些数字最容易被编造

#### 🚨 判定标准

| 问题类型 | 处置 |
|---|---|
| 链接打开是 404 / 下架页 | **整条删除** |
| url/link 是首页/搜索页/社媒首页 | 找到一手原文 url 替换，找不到则删除 |
| summary 的数字/公司名在原文中找不到 | **整条删除**（编造嫆疑极高） |
| title 语义被改变（夸大/扭曲） | 改为忠于原文的译法 |
| source 不是一手出处 | 改为一手出处名 |
| date 为未来日期 | 必须改为原文真实发布日 |
| date 不是原文发布日 | 必须改为原文真实发布日 |
| 全行业动态条目缺 `link` | 补齐一手出处 link，找不到则合并到周/月/年汇总条目 |

**任何一项不过关，本轮质检视为失败，必须回到编辑员任务 1 或任务 4c 重做再发布。**

### 检查 4：数学公式渲染检查

```bash
# 检查论文解读中的公式格式（确保用 $ 包裹而非 \( \)）
grep -r '\\\\(' content/papers/*.md | head -5
grep -r '\$[^$]\+\$' content/papers/*.md | wc -l
```

### 检查 5：运行自动化测试用例

```bash
cd /Users/harrisyu/WorkBuddy/20260409114249/signal
if [ -f "tests/content.test.js" ]; then
  npx jest tests/content.test.js --no-coverage 2>&1 | tail -20
elif [ -f "package.json" ] && grep -q '"test"' package.json; then
  npm test 2>&1 | tail -20
else
  echo "未找到测试文件，跳过"
fi
```

### 检查 6：乱码根因分析与修复

> **根因**：Python `json.dumps()` 默认 `ensure_ascii=True`，所有非 ASCII 字符被转义为 `\uXXXX`。
> Next.js 读取 JSON 时某些情况下不会自动反转义，导致页面显示乱码。
> **修复**：所有写 JSON 的地方统一加 `ensure_ascii=False`。

```bash
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
```

### 检查 7：清除缓存并重启服务

> ⚠️ 重要：必须等待编译完成后再验证，否则 CSS/JS 未就绪会导致页面样式崩溃。

```bash
# 停止现有服务
pkill -f "next dev" 2>/dev/null; sleep 2

# 清除 Next.js 构建缓存
rm -rf /Users/harrisyu/WorkBuddy/20260409114249/signal/.next

# 重启开发服务器
cd /Users/harrisyu/WorkBuddy/20260409114249/signal
nohup npx next dev > /tmp/signal-dev.log 2>&1 &

# 轮询等待首页编译完成（最多等 90 秒），避免编译期间访问导致 CSS 失效
echo "等待 Next.js 编译完成..."
for i in $(seq 1 30); do
  status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 3 http://localhost:3000/ 2>/dev/null)
  if [ "$status" = "200" ]; then
    echo "✅ 服务已就绪 (第 ${i} 次检测，HTTP $status)"
    break
  fi
  echo "  编译中... ($i/30，当前状态: $status)"
  sleep 3
done

# 输出最新日志确认状态
tail -5 /tmp/signal-dev.log
```

### 检查 8：输出质检报告

汇总以下信息：

| 检查项 | 结果 |
|--------|------|
| 路由可用性 | X/Y 通过 |
| JSON 格式 | 合法 / 非法 |
| Unicode 乱码 | 无 / 已修复 |
| 声浪链接可用性（检查 3） | X/Y 可访问 |
| 全行业动态链接可用性（检查 3） | X/Y 可访问，缺 link N 条 |
| 声浪对应关系准确性（检查 3b · title/summary/source） | X/Y 通过 |
| 全行业动态对应关系准确性（检查 3b） | X/Y 通过 |
| 声浪日期准确性（检查 3b · date 与原文一致） | X/Y 通过 |
| 全行业动态日期准确性（检查 3b） | X/Y 通过 |
| 测试用例 | 通过 / 失败 / 跳过 |
| 服务状态 | 正常 / 异常 |

如有问题，列出问题清单及修复建议。
`````
