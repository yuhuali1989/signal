---
title: "7月 AI 军备竞赛全景：开源反超、半价劲敌、全栈硬件对决"
date: 2026-07-31
description: "2026年7月成为AI史上最密集发布月：Inkling-Small 276B反超975B原版、Claude Opus 5半价对标Fable 5、DeepSeek V4.5 MIT开源GPQA 91.8%、GLM 5.2开源首次击败GPT-5/Claude、Gemini 3.2 Pro 2M上下文、AMD Helios vs NVIDIA Vera Rubin七芯片全栈对决。69个发布创纪录。"
tags: ["Claude Opus 5", "Inkling-Small", "DeepSeek V4.5", "GLM 5.2", "Gemini 3.2 Pro", "Vera Rubin", "AMD Helios", "开源", "MoE", "军备竞赛"]
---

# 7月 AI 军备竞赛全景：开源反超、半价劲敌、全栈硬件对决

> 2026年7月，ThursdAI追踪到69个AI产品发布——模型、产品、论文、工具——创历史纪录。这个月不只是数量，而是结构性转折：开源模型首次在Agent编码上击败闭源前沿，半价模型达到旗舰95%性能，AI芯片从"单卡竞赛"进入"整柜全栈博弈"。本文全景拆解七大事件及其深层含义。

## 一、Inkling-Small：1/4规模反超原版的开源奇迹

Thinking Machines Lab在7月30日做了一件反直觉的事：发布了一个只有原版Inkling四分之一规模的模型，然后看着它在多个基准上反超原版。

**核心规格：**

| 维度 | Inkling (原版) | Inkling-Small |
|---|---|---|
| 总参数 | 975B (MoE) | 276B (MoE) |
| 激活参数 | 41B | 12B |
| 架构 | 42层 decoder-only + MoE | 同 |
| 专家配置 | 256专家选6 + 2共享 | 同 |
| 上下文 | 1M tokens | 1M tokens |
| 多模态 | 文本+图像+音频 | 同 |
| 许可证 | Apache 2.0 | Apache 2.0 |
| 训练硬件 | GB300 NVL72 | GB300 NVL72 |

**反超数据：**

- **SWE-bench Verified**: 80.2% vs 77.6%（+2.6pp）
- **ARC-AGI-2**: 40.1% vs 36.5%（+3.6pp）
- **HLE (Humanity's Last Exam)**: 31.6% vs 29.7%（+1.9pp）
- **测试时计算曲线**: 在每个思考预算下均位于Inkling之上

Thinking Machines将这一成就归因于预训练数据和配方的改进，而非架构变化。这是一个重要信号：**2026年的模型效率提升不再来自更大的参数，而来自更好的数据工程和训练策略**。

**部署门槛大幅降低：**

- BF16: 需 600GB VRAM → 4×B300 或 8×H200
- NVFP4 量化: 仅需 180GB → **1×B300 (W4A4)** 或 2×H200 (W4A16)
- 推理框架: SGLang / vLLM / Unsloth / TokenSpeed / HuggingFace 首日适配
- 定价: $0.30/$1.20 per 1M tokens（比Inkling便宜3-4倍）

**深层含义**：Inkling-Small挑战了"更大即更好"的直觉。如果276B/12B能在Agent编码上反超975B/41B，那么部署Inkling而非Inkling-Small的选择需要用你自己的评估集来证明其合理性——而不是默认"大就是好"。

## 二、Claude Opus 5：半价达到95%前沿性能

Anthropic在7月24日发布Claude Opus 5，这是两个月内第四个Claude 5系列模型。核心定位：**接近Fable 5性能、半价**。

**基准表现：**

| 基准 | Claude Opus 5 | Claude Fable 5 | GPT-5.6 Sol | Opus 4.8 |
|---|---|---|---|---|
| SWE-bench Verified | **96.0%** | — | — | 69.2% |
| SWE-bench Pro | 79.2% | 80.0% | — | — |
| Frontier-Bench v0.1 | **43.3%** | 33.7% | 34.4% | 21.1% |
| ARC-AGI-3 | **30.2%** | — | 7.8% | 1.5% |
| OSWorld 2.0 | **70.6%** | — | — | 55.7% |
| AutomationBench | **26.0%** | 17.4% | 18.1% | 17.0% |
| GDPval-AA v2 (Elo) | **1861** | 1747 | — | — |

**关键创新：**

1. **Per-request effort toggle** (low/medium/high)：用户可按请求平衡成本与能力，最低档仍超其他模型最高档
2. **Extended Thinking 默认开启**：不再需要手动激活
3. **Fast 模式**：2.5倍速度，2倍价格
4. **1M token 上下文**（默认=最大）
5. **安全改进**：自动化行为审计得分2.3（最低misaligned行为率），prompt injection鲁棒性大幅提升

**Anthropic的定价策略**：

| 模型 | 输入/1M | 输出/1M | 定位 |
|---|---|---|---|
| Claude Fable 5 | $10 | $50 | 长期自主Agent（数天级） |
| Claude Opus 5 | $5 | $25 | 日常主力（编码/研究/Agent） |
| Claude Sonnet 5 | $3 | $15 | 高吞吐量确定任务 |
| Claude Mythos 5 | — | — | 前沿网络安全（受限访问） |

Opus 5成为Claude Max默认模型，意味着数百万用户的日常体验直接升级——免费提价、性能翻倍。

**Anthropic的战略意图**：两个月内四个模型覆盖从高吞吐到超长期Agent的全价位曲线，不留缝隙。这种节奏被解读为IPO前铺路。

## 三、DeepSeek V4.5：MIT许可下的性价比碾压

DeepSeek在7月5日发布V4.5，延续其"MIT许可 + 超低价 + 前沿性能"配方。

**核心数据：**

- **许可证**: MIT（比Llama社区许可更宽松，律师当日放行）
- **GPQA Diamond**: 91.8%（与GPT-5.6的91.0%和Opus 4.8的91.5%持平）
- **SWE-bench Pro**: 62.1%（强但非领先）
- **MMLU-Pro**: 89.4%
- **MATH**: 93.1%
- **上下文**: 256K tokens
- **API定价**: $0.50/$1.10 per 1M（比GPT-5.6便宜约15倍）
- **自托管**: 权重免费下载，边际成本=硬件+电力

**性价比对比：**

| 模型 | 许可证 | GPQA Diamond | 输入/1M | 输出/1M | 权重 |
|---|---|---|---|---|---|
| Claude Opus 4.8 | 闭源 | 91.5% | $15 | $75 | ❌ |
| GPT-5.6 | 闭源 | 91.0% | $5 | $30 | ❌ |
| **DeepSeek V4.5** | **MIT** | **91.8%** | **$0.50** | **$1.10** | **✅** |
| DeepSeek V4 Pro | Apache 2.0 | 89.9% | $0.44 | $0.87 | ✅ |
| Llama 5 | 社区许可 | 88.0% | $0.80 | $2.40 | ✅ |

**诚实评估**：
- 推理/数学：前沿水平，价格无可匹敌
- 编码：SWE-bench Pro 62.1%强但明显落后GPT-5.6/Opus 5
- 发布日基准分需打折，等社区复现确认

DeepSeek V4.5的真正贡献不在于某个基准数字，而在于证明了一个经济模型：**在推理密集任务上，开源已经是从成本角度的正确选择，而非退而求其次**。

## 四、GLM 5.2：开源首次在SWE-bench Pro击败GPT-5和Claude

智谱AI在7月8日发布GLM 5.2，创造了开源模型的历史里程碑。

**关键数据：**

- **架构**: 744B-A40B MoE（MIT许可）
- **SWE-bench Pro**: 68.5%——**首个超越GPT-5和Claude的开源模型**
- **GLM 5.2 Air**（蒸馏版）: 106B-A12B，可在64GB Mac上~30 tok/s运行，SWE-bench Pro 58%

LLMCheck评价：*"两年来，开源vs闭源在Agent编码这个最后堡垒上的差距是唯一还偏向OpenAI/Anthropic的数字。2026年7月，GLM 5.2抹平了它。"*

这意味着：开源社区不再只是追赶闭源模型的"影子"，而是在最难的Agent编码任务上实现了**正向超越**。结合GLM 5.2 Air可以在消费级Mac上运行，这把"前沿可达性"推到了个人开发者层面。

## 五、Gemini 3.2 Pro：2M上下文，长程推理无衰减

Google在7月2日发布Gemini 3.2 Pro，上下文窗口达到2M tokens。

**核心规格：**

- **上下文窗口**: 2,000,000 tokens（闭源模型中最大）
- **Artificial Analysis Intelligence Index**: 59.6
- **SWE-bench Verified**: 86.4%
- **MMLU-Pro**: 91.4%
- **Arena ELO**: 1508
- **定价**: $2/$12 per 1M tokens
- **配套**: Veo 3视频生成（原生音频/首尾帧控制/10分钟视频）

**技术突破**：Gemini 3.1在2M上下文边缘存在明显的检索质量衰减，3.2专门优化了长程推理中的信息保持。这意味着开发者可以真正将整个代码仓库、数小时视频、数百页法律文件一次性投入，而不必担心上下文末尾的"失忆"。

**上下文窗口行业排名**（2026年7月）：

1. Llama 4.5 Scout: 10M tokens（开源）
2. Gemini 3.2 Pro/Flash: 2M tokens（闭源）
3. Claude Opus 4.7/Sonnet 4.6 (1M变体): 1M tokens
4. DeepSeek V4.1/Qwen 3.7/Llama 4.5 Maverick: 1M tokens（开源）

## 六、AMD Helios vs NVIDIA Vera Rubin：全栈AI基础设施世纪对决

7月23日是AI芯片竞争的转折点——AMD和NVIDIA同日展示了完整的机架级AI解决方案。

### NVIDIA Vera Rubin：七芯片全栈

| 芯片 | 角色 |
|---|---|
| Vera CPU | 定制Olympus核心，单线程AI Agent性能超x86 50% |
| Rubin GPU | 288GB HBM4, 聚合带宽22TB/s |
| NVLink 6 交换机 | 第六代scale-up |
| ConnectX-9 SuperNIC | 1.6T |
| BlueField-4 DPU | 网络卸载 |
| Spectrum-6 | 102.4Tb/s以太网 |
| Groq 3 LPX | 低延迟推理加速（七号芯片） |

**实测**: CoreWeave基于DeepSeek-R1的测试显示，Vera Rubin NVL72每兆瓦吞吐量是GB200 NVL72的**10倍**。已交付OpenAI/Anthropic/SpaceX。

### AMD Helios：全栈首秀

| 规格 | 详情 |
|---|---|
| GPU | MI455X (Instinct) |
| CPU | 第六代EPYC Venice |
| 网络 | Pensando DPU (12块/机架) |
| 配置 | 每计算托盘4块GPU + 1颗EPYC |
| 售价 | ~$500-550万（比Vera Rubin贵~40%） |
| 客户 | 微软Azure全栈部署 + OpenAI/Meta/Oracle背书 |

**关键信号**: AMD不再靠"便宜"竞争，而是靠"全栈TCO和最低每token成本"。Futurum估计Helios售价比Vera Rubin高40%但仍拿下微软全栈订单——这意味着AMD的竞争力已从价格转向系统集成能力。

### 竞争格局变化

AI Capex正从"单芯片竞赛"进入"整柜全栈博弈"。同一周：

- Google确认Gemini 4预训练启动，2026 capex上调至$195-205B
- Intel Q2数据中心业务+59%至$63亿
- Anthropic签约AMD MI450算力（最高2GW）
- AMD签Cerebras/Cisco/AT&T战略合作

## 七、7月发布潮的深层结构

将这七个事件放在一起，浮现出几个结构性趋势：

### 1. 开源-闭源代差从6-10个月缩至4-7个月

缩小差距的实验室全为中国（月之暗面/智谱/DeepSeek），西方前沿实验室走API路线。7月这一窗口进一步压缩：

- GLM 5.2 SWE-bench Pro 68.5% → 正向超越闭源
- DeepSeek V4.5 GPQA 91.8% → 与闭源持平
- Inkling-Small 276B → 美国开源最大权重 + 效率反超

### 2. 1M+上下文成标配

| 模型 | 上下文 |
|---|---|
| Llama 4.5 Scout | 10M |
| Gemini 3.2 Pro | 2M |
| GPT-5.6 / Claude 5 / Kimi K3 / Inkling | 1M+ |

百万token上下文不再是旗舰特权，而是前沿基准线。

### 3. 效率 > 规模

Inkling-Small（276B反超975B）和Claude Opus 5（半价达95%性能）共同指向一个趋势：**2026年的竞争力不来自堆参数，而来自更好的数据、更聪明的训练策略和更精细的推理控制**。

### 4. AI Agent成为硬件设计核心

NVIDIA专门设计Vera CPU的Olympus核心来优化Agent低延迟推理；Groq 3 LPX成为七号芯片专为解码阶段设计；AMD强调"最低每token成本"——所有硬件叙事都围绕Agent的持续推理需求重新设计。

### 5. 前沿不再是单一领跑者

BenchLM的BenchAlign评分前五名分属三家实验室（Anthropic/OpenAI/Moonshot），分差在3分以内。模型选择从"谁是最好"变为"哪个组合最适合特定工作负载"。

## 八、选型决策框架

综合7月格局，给出一个可直接使用的选型框架：

| 场景 | 首选 | 理由 |
|---|---|---|
| 日常编码/研究/Agent | Claude Opus 5 | $5/$25半价，Frontier-Bench SOTA |
| 长期自主Agent（数天级） | Claude Fable 5 | 专为长horizon设计 |
| 推理/数学 + 预算敏感 | DeepSeek V4.5 | MIT, GPQA 91.8%, $0.50/$1.10 |
| 开源Agent编码（服务器） | GLM 5.2 | SWE-Pro 68.5%首个开源超越 |
| 开源Agent编码（消费级） | GLM 5.2 Air | 64GB Mac可跑, SWE-Pro 58% |
| 高效开源多模态 | Inkling-Small | 276B/12B, NVFP4单卡B300 |
| 长上下文（千页文档） | Gemini 3.2 Pro | 2M tokens, 长程无衰减 |
| 超长上下文（全代码库） | Llama 4.5 Scout | 10M tokens开源 |
| 性价比自托管 | DeepSeek V4.5 或 Kimi K3 | MIT/开放权重, 边际成本=硬件 |

## 九、与本项目既有内容的交叉呼应

本文与站点既有内容形成互链：

- **推理工程实战**（2026-07-28文章）：DeepSeek V4.5和Kimi K3的自托管经济学直接验证了该文的连续批处理+KV分页+推测解码管线
- **GPU工作原理与并发模型**（8章书籍）：Vera Rubin七芯片架构和AMD Helios全栈方案是该书第6-7章多进程共享/协作的产业级实例
- **多模态数据管道**（2026-07-30文章）：Inkling-Small的原生图文音频多模态训练正是该文第5环节"重标注"的产物——用强VLM生成高质量多模态训练数据
- **Ray Data引擎**（10章书籍）：GLM 5.2和DeepSeek V4.5的大规模预训练数据摄取正是Ray Data + DFN过滤管线的生产级用例

## 结语：从"谁最强"到"什么最合适"

2026年7月最大的变化不是某个模型破了某个纪录，而是**前沿AI从"单一领跑者"变成了"一个拥挤的领域"**。七个前沿模型在四周内从六家实验室涌出，分差在几个基准点以内。开源不再只是"追赶闭源的影子"，而是正向超越。半价模型达到旗舰95%性能。硬件从单卡变成全栈。

对于开发者和企业，这意味着模型选择不再是"看排行榜选第一名"，而是一个架构决策：你的工作负载是推理密集还是编码密集？需要1M+上下文还是256K够了？能自托管还是需要API？MIT许可重要还是社区许可够了？每个维度上，7月都给了你至少两个值得认真评估的选项。

这不是一个"选最好的"的时代，而是一个"选最合适的"的时代。而7月，给了你前所未有的选项深度。
