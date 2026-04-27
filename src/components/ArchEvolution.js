'use client';

import { useState } from 'react';

/* ─── 数据 ─── */
const KEY_LAYERS = [
  { layer: 'Embedding', role: 'Token → 向量', variants: 'Lookup Table', innovations: 'RoPE（旋转位置编码，LLaMA/DeepSeek）、ALiBi（无需位置编码，BLOOM）', icon: '🔤' },
  { layer: 'Attention', role: '序列内信息聚合', variants: 'MHA → GQA → MQA', innovations: 'MLA（DeepSeek V2/V3，KV Cache 压缩 64×）、NSA（Native Sparse Attention，稀疏注意力）', icon: '👁️', highlight: true },
  { layer: 'FFN / MLP', role: '非线性变换与知识存储', variants: 'ReLU → SwiGLU → GeGLU', innovations: 'SwiGLU（LLaMA 系列标配）、MoE（稀疏激活，Mixtral/DeepSeek/Qwen3）', icon: '🧮', highlight: true },
  { layer: 'Normalization', role: '训练稳定性', variants: 'LayerNorm → RMSNorm', innovations: 'RMSNorm（去均值计算，LLaMA/Qwen/DeepSeek 标配，更快）', icon: '⚖️' },
  { layer: '位置编码', role: '序列位置感知', variants: '绝对 PE → 相对 PE → 旋转 PE', innovations: 'RoPE（可外推长上下文）、YaRN / LongRoPE（超长上下文扩展）', icon: '📍' },
  { layer: 'KV Cache', role: '推理加速', variants: '全量缓存', innovations: 'GQA（分组共享 KV）、MLA（低秩压缩，只存潜在向量）', icon: '💾', highlight: true },
  { layer: '路由机制（MoE）', role: '专家选择', variants: 'Top-K 硬路由', innovations: '无辅助损失负载均衡（DeepSeek V3，用 bias 动态调整替代 aux loss）', icon: '🔀', highlight: true },
  { layer: '输出头', role: '预测下一 Token', variants: '单步 LM Head', innovations: 'MTP（Multi-Token Prediction，DeepSeek V3，多步预测 + Speculative Decoding）', icon: '🎯' },
  { layer: '跳层 / 早退', role: '动态计算深度', variants: '固定 N 层', innovations: 'MoD（Mixture of Depths，Google，按 token 难度跳过 Block）、Layer Skipping（MiniCPM 3.0）', icon: '⏭️', highlight: true },
  { layer: '视觉编码器（VLA）', role: '图像 → 视觉 Token', variants: 'ViT', innovations: 'SigLIP（Google，对比学习，PaliGemma/Gemma3）、InternViT（InternVL 系列）', icon: '🖼️' },
];

const TIMELINE = [
  { date: '2024-05', model: 'DeepSeek-V2', innovation: 'MLA（Multi-head Latent Attention）', contribution: 'KV Cache 压缩至 1/64，首次工程化验证低秩 KV 压缩可行性', tag: 'Attention', color: 'bg-blue-100 text-blue-700' },
  { date: '2024-12', model: 'DeepSeek-V3', innovation: 'MLA + 无辅助损失 MoE + MTP', contribution: 'FP8 训练 + 多 Token 预测，671B 参数仅需 2.788M H800 GPU 小时训练完成', tag: 'MoE+推理', color: 'bg-purple-100 text-purple-700' },
  { date: '2025-01', model: 'DeepSeek-R1', innovation: 'GRPO（Group Relative Policy Optimization）', contribution: '纯 RL 激发推理链，无需 SFT 冷启动，数学/代码推理达 o1 水平', tag: '训练范式', color: 'bg-orange-100 text-orange-700' },
  { date: '2025-02', model: 'Gemini 2.0 Flash', innovation: '原生多模态输出 + 实时流式推理', contribution: '首个支持文本/图像/音频多模态原生输出的生产级模型，延迟降低 50%', tag: '多模态', color: 'bg-teal-100 text-teal-700' },
  { date: '2025-02', model: 'Claude 3.7 Sonnet', innovation: '扩展思考（Extended Thinking）+ 混合推理', contribution: '首个支持可调节思考预算的商业模型，thinking token 上限可配置', tag: '推理控制', color: 'bg-amber-100 text-amber-700' },
  { date: '2025-03', model: 'Gemma 3', innovation: 'SigLIP2 视觉编码器 + 滑动窗口注意力', contribution: '5:1 交替局部/全局注意力，128K 上下文，27B 参数单 GPU 可运行', tag: '长上下文', color: 'bg-green-100 text-green-700' },
  { date: '2025-03', model: 'GPT-4.5', innovation: '超大规模预训练 + 情感智能对齐', contribution: '参数规模达历代最大，EQ 对齐显著提升，首次在 SimpleQA 超越 o1', tag: '规模扩展', color: 'bg-gray-100 text-gray-700' },
  { date: '2025-04', model: 'Qwen3（0428）', innovation: '思考/非思考双模式 + 细粒度 MoE（128 专家）', contribution: '同一模型支持 enable_thinking 开关，235B-A22B MoE 激活参数仅 22B', tag: '推理控制', color: 'bg-amber-100 text-amber-700' },
  { date: '2025-04', model: 'DeepSeek-V3-0324', innovation: 'MLA + FP8 KV Cache + DualPipe 流水线优化', contribution: '计算通信完全重叠，集群 GPU 利用率提升至 ~80%，编码能力大幅提升', tag: '系统优化', color: 'bg-cyan-100 text-cyan-700' },
  { date: '2025-04', model: 'Llama 4（Scout/Maverick）', innovation: '原生多模态 MoE + iRoPE 位置编码', contribution: 'Scout 17B-A3B 支持 10M 上下文；iRoPE 交替 NoPE 层解决超长上下文外推', tag: '长上下文', color: 'bg-blue-100 text-blue-700' },
  { date: '2025-05', model: 'GPT-4o（0513）', innovation: '原生图像生成集成 + 指令跟随增强', contribution: '首个将高质量图像生成原生集成到对话模型的商业产品，文字渲染精度大幅提升', tag: '多模态', color: 'bg-gray-100 text-gray-700' },
  { date: '2025-05', model: 'Gemini 2.5 Pro', innovation: '深度思考（Deep Think）+ 原生音频理解', contribution: '在 AIME 2025 达 86.7%，Humanity Last Exam 43.1%，多项 SOTA；支持原生音频流输入', tag: '推理增强', color: 'bg-teal-100 text-teal-700' },
  { date: '2025-06', model: 'Claude 4 Sonnet / Opus', innovation: '并行工具调用 + 记忆外化架构', contribution: 'Sonnet 4 编码能力 SWE-bench 72.7%；Opus 4 首次支持持久记忆模块外挂', tag: 'Agent', color: 'bg-amber-100 text-amber-700' },
  { date: '2025-07', model: 'Mistral Large 3', innovation: '128K 上下文 + 函数调用优化', contribution: '开源最强 123B 密集模型，函数调用准确率超 GPT-4o，Apache 2.0 许可', tag: '开源', color: 'bg-indigo-100 text-indigo-700' },
  { date: '2025-08', model: 'Llama 3.3 / 3.4', innovation: '跨模态对齐 + 工具使用微调', contribution: '405B 指令版本在 Agent 任务超越 GPT-4o；3.4 新增视频理解能力', tag: 'Agent', color: 'bg-blue-100 text-blue-700' },
  { date: '2025-09', model: 'o3 / o3-mini', innovation: '强化学习扩展推理时计算（Test-Time Compute）', contribution: 'ARC-AGI 87.5%，首次接近人类水平；推理时计算量可按任务动态扩展 1000×', tag: '推理增强', color: 'bg-orange-100 text-orange-700' },
  { date: '2025-10', model: 'Qwen2.5-Max', innovation: 'MoE + 长上下文 RoPE 外推（YaRN 改进版）', contribution: '1M 上下文窗口，Needle-in-Haystack 召回率 99%+，开源最强多语言模型', tag: '长上下文', color: 'bg-amber-100 text-amber-700' },
  { date: '2025-11', model: 'Gemini 2.0 Ultra', innovation: '多模态原生推理 + 实时视频理解', contribution: '首个在视频理解任务全面超越人类专家的模型，支持 2 小时视频实时问答', tag: '多模态', color: 'bg-teal-100 text-teal-700' },
  { date: '2025-12', model: 'DeepSeek-R2（预览）', innovation: 'NSA（Native Sparse Attention）+ MoE 联合稀疏', contribution: 'NSA 将长序列注意力计算量降低 4×，与 MoE 联合稀疏首次工程化验证', tag: 'Attention', color: 'bg-blue-100 text-blue-700' },
  { date: '2026-01', model: 'o3-pro / o4-mini', innovation: '工具集成推理（Tool-Integrated Reasoning）', contribution: '推理过程中原生调用代码执行/搜索/计算器，推理链可验证性大幅提升', tag: '推理增强', color: 'bg-orange-100 text-orange-700' },
  { date: '2026-02', model: 'Claude 4 Opus（正式版）', innovation: '混合推理 + 持久记忆 + 计算机使用 2.0', contribution: 'SWE-bench 验证集 79.4%；Computer Use 2.0 支持跨会话状态保持', tag: 'Agent', color: 'bg-amber-100 text-amber-700' },
  { date: '2026-02', model: 'Gemini 2.5 Flash', innovation: '轻量深度思考 + 自适应推理预算', contribution: '首个在轻量级模型上实现自动推理预算分配，简单任务 0 thinking token', tag: '推理控制', color: 'bg-teal-100 text-teal-700' },
  { date: '2026-03', model: 'GPT-5', innovation: '统一多模态架构 + 超长上下文（1M）', contribution: '首个将文本/图像/音频/视频统一到单一 Transformer 架构，MMMU 96.8%', tag: '多模态', color: 'bg-gray-100 text-gray-700' },
  { date: '2026-03', model: 'Qwen3-235B-A22B（正式版）', innovation: '细粒度 MoE + 双模式推理 + FP8 全链路', contribution: '开源最强 MoE，Codeforces 2056 ELO，AIME 2025 85.7%，Apache 2.0', tag: 'MoE+推理', color: 'bg-amber-100 text-amber-700' },
  { date: '2026-04', model: 'Llama 4 Behemoth（训练中）', innovation: '超大规模 MoE（2T 参数）+ 多模态原生', contribution: '2T 总参数 / 288B 激活，教师模型蒸馏 Scout/Maverick；STEM 超越 GPT-5/Gemini 2.5 Pro', tag: '规模扩展', color: 'bg-blue-100 text-blue-700' },
  { date: '2026-04', model: 'Gemini 2.5 Pro（0414）', innovation: '深度思考 v2 + 原生代码执行沙箱', contribution: 'AIME 2025 92.0%，SWE-bench 63.8%，Humanity Last Exam 18.8%，全面刷新 SOTA', tag: '推理增强', color: 'bg-teal-100 text-teal-700' },
  { date: '2026-04', model: 'Qwen3.6-27B（开源）', innovation: '轻量 MoE + 无缝思维链切换（Thinking/Non-Thinking 双模式）', contribution: '27B 总参数 / 3B 激活，开源 MoE 新标杆；思维链切换无需重新加载模型，MATH-500 / GPQA 与同量级闭源模型相当，Apache 2.0', tag: 'MoE+推理', color: 'bg-amber-100 text-amber-700' },
  { date: '2026-04', model: 'Claude Opus 4.7', innovation: '编码专项强化 + 多步骤代码重构能力', contribution: 'SWE-bench Pro 87.6%（超越所有已知模型）；跨文件依赖分析与复杂重构能力大幅提升；同步修复 Claude Code 质量回退问题', tag: '编码增强', color: 'bg-purple-100 text-purple-700' },
  { date: '2026-04', model: 'Qwen3.6-35B-A3B（开源）', innovation: '轻量 MoE 专家池扩展：同等激活参数（3B）下增加专家数量', contribution: '总参数 35B / 激活 3B，知识密集型任务（MMLU-Pro 75.8%）相比 27B 版本提升 3.3pp；验证了"增加专家池 > 增加激活参数"对知识覆盖的边际收益规律', tag: 'MoE扩展', color: 'bg-amber-100 text-amber-700' },
  { date: '2026-04', model: 'Gemini 3.1 Pro 深度研究代理', innovation: '多源并行检索 + 研究规划 + 迭代深化的 Agent 架构', contribution: '首个深度集成 Google Scholar/YouTube/Books 的多模态研究 Agent；支持数小时自主研究任务；研究规划→并行检索→可信度评估→迭代深化的四层 Agent 架构', tag: 'Agent架构', color: 'bg-green-100 text-green-700' },
];

const EVOLUTION_PATHS = [
  {
    id: 'attention',
    icon: '👁️',
    title: 'Attention：MHA → 低秩压缩（MLA）→ 稀疏（NSA）',
    color: 'border-blue-200 bg-blue-50/40',
    headerColor: 'text-blue-700',
    path: ['MHA', 'GQA', 'MQA', 'MLA', 'NSA'],
    current: 'MLA（DeepSeek V2 首创，V3/V4 工程化验证）+ NSA（DeepSeek-R2 预览版已工程化，长序列注意力计算量降低 4×）',
    core: '将 KV Cache 从 H×d_h 压缩到低秩潜在向量 d_c，压缩比 64×；NSA 在此基础上引入稀疏块注意力，跳过无关 token',
    next: 'MLA + NSA 联合部署标准化——Llama 4 iRoPE 已验证交替 NoPE 层可进一步降低位置编码开销；下一步是 NSA 与 Flash Attention 3 深度融合，实现硬件级稀疏加速',
    benefit: '1M 上下文推理成本降至与 128K 相当',
  },
  {
    id: 'ffn',
    icon: '🔀',
    title: 'FFN：Dense → 粗粒度 MoE → 细粒度 MoE + 无辅助损失均衡',
    color: 'border-purple-200 bg-purple-50/40',
    headerColor: 'text-purple-700',
    path: ['Dense FFN', '粗粒度 MoE (8E)', '细粒度 MoE (256E)', '专家共享+路由混合'],
    current: '细粒度 MoE 已成主流标配：DeepSeek V3（256E）、Qwen3（128E）、Llama 4 Scout（17B-A3B）均采用；无辅助损失均衡已取代 aux loss',
    core: '专家越细粒度，激活参数越少，知识专业化越强；共享专家（DeepSeek 系列）保底通用能力',
    next: '超大规模 MoE（Llama 4 Behemoth 2T 参数/288B 激活）验证规模上限；下一步是专家动态合并/拆分（Expert Merging），推理时按任务自适应调整专家粒度',
    benefit: '2T 参数 MoE 激活成本等同 288B 密集模型，知识容量提升 7×',
  },
  {
    id: 'depth',
    icon: '⏭️',
    title: '计算深度：固定 N 层 → 动态跳层（MoD）',
    color: 'border-green-200 bg-green-50/40',
    headerColor: 'text-green-700',
    path: ['固定 N 层', 'Early Exit', 'MoD (Gemma 3)', 'MoD + MoE 联合稀疏'],
    current: 'Gemma 3 滑动窗口注意力（5:1 局部/全局交替）已工程化；iRoPE（Llama 4）交替 NoPE 层减少位置编码计算；MoD 在学术界持续验证',
    core: '按 token 难度或层序动态决定计算路径，简单 token 跳过中间层或使用局部注意力',
    next: 'MoD + MoE 联合稀疏——DeepSeek-R2 NSA 已在宽度维度稀疏化；下一步是深度（跳层）+ 宽度（专家路由）+ 注意力（稀疏）三维联合稀疏，预计 2026 下半年有模型验证',
    benefit: '激活计算量减少 70%+，推理速度提升 3×',
  },
  {
    id: 'inference',
    icon: '🎯',
    title: '推理范式：单步预测 → MTP + 投机解码 → 自适应预算',
    color: 'border-amber-200 bg-amber-50/40',
    headerColor: 'text-amber-700',
    path: ['单步 LM Head', 'MTP (DeepSeek V3)', 'Speculative Decoding', '自适应推理预算'],
    current: '自适应推理预算已商业化：Claude 3.7 Sonnet 可配置 thinking token 上限；Gemini 2.5 Flash 实现自动预算分配；o3/o4-mini 推理时计算量可动态扩展 1000×',
    core: '推理时计算（Test-Time Compute）成为新的扩展维度：简单任务 0 thinking，复杂任务深度推理链',
    next: '工具集成推理（Tool-Integrated Reasoning，o4-mini 已验证）标准化——推理链中原生调用代码执行/搜索/计算器；下一步是推理链可验证性（Verifiable Reasoning）与形式化证明结合',
    benefit: '数学/代码任务准确率再提升 20%+，推理过程可审计',
  },
  {
    id: 'quant',
    icon: '🔢',
    title: '量化精度：BF16 → FP8 全链路 → FP4 原生训练',
    color: 'border-rose-200 bg-rose-50/40',
    headerColor: 'text-rose-700',
    path: ['FP32', 'BF16', 'FP8 训练 (DeepSeek V3)', 'INT4 端侧', 'FP4 原生训练'],
    current: 'FP8 训练已成行业标配（DeepSeek V3/Qwen3/Llama 4 均采用）；Gemini 2.5 系列采用 INT8 KV Cache；端侧 INT4/INT3 量化（llama.cpp/MLX）已成熟',
    core: 'FP8 训练节省 50% 显存；INT4 量化使 70B 模型可在 M4 MacBook 本地运行；Expert Paging（Gemini Nano）使 MoE 在手机上可行',
    next: 'FP4 原生训练（NVIDIA Blackwell B200/B300 已支持，GB200 NVL72 FP4 算力 1.44 EFLOPS）→ 2026 下半年首批 FP4 训练模型预计发布',
    benefit: '训练显存再减 50%，万亿参数 MoE 单 DGX SuperPOD 可训',
  },
];

const NEXT_STEPS = [
  { direction: 'NSA + Flash Attention 3 硬件融合', status: 'NSA 已在 DeepSeek-R2 预览版工程化，Flash Attention 3 已支持 Hopper GPU', next: '将 NSA 稀疏块注意力与 FA3 的异步流水线深度融合，实现硬件级稀疏加速，无需 padding 开销', benefit: '1M 上下文推理延迟降至 128K 水平，H100 利用率提升 30%', readiness: 82, icon: '👁️' },
  { direction: '工具集成推理（TIR）标准化', status: 'o4-mini 已验证推理链中原生调用代码执行/搜索；Claude 4 Opus 支持计算机使用 2.0', next: '将 TIR 框架开源标准化（类似 ReAct 但更深度集成），使开源模型也能在推理链中可靠调用外部工具', benefit: '数学/代码/科学任务准确率提升 25%+，推理过程可审计', readiness: 78, icon: '🎯' },
  { direction: 'FP4 原生训练', status: 'FP8 训练已成行业标配；NVIDIA B200/B300 FP4 算力已就绪（GB200 NVL72 达 1.44 EFLOPS）', next: '首批 FP4 训练模型预计 2026 Q3 发布，需配合 QAT（量化感知训练）和梯度缩放策略', benefit: '训练显存再减 50%，万亿参数 MoE 单 SuperPOD 可训', readiness: 72, icon: '🔢' },
  { direction: '三维联合稀疏（深度+宽度+注意力）', status: 'MoE（宽度稀疏）+ NSA（注意力稀疏）已各自工程化；MoD（深度稀疏）学术验证充分', next: '在同一模型中同时启用跳层（MoD）+ 专家路由（MoE）+ 稀疏注意力（NSA），三维联合稀疏', benefit: '激活计算量减少 75%+，推理速度提升 4×', readiness: 55, icon: '🔀' },
  { direction: '超长上下文原生推理（10M+）', status: 'Llama 4 Scout 已支持 10M 上下文（iRoPE）；Gemini 2.5 Pro 支持 1M 上下文', next: '将 10M 上下文能力与 NSA 稀疏注意力结合，使超长上下文推理成本可控；探索分层记忆（Hierarchical Memory）架构', benefit: '整本书/整个代码库作为上下文，Agent 任务完成率提升 40%', readiness: 65, icon: '📏' },
  { direction: '专家记忆外化（MoE + 外部知识库）', status: 'RAG 与 MoE 目前独立存在；Claude 4 Opus 持久记忆模块已验证外挂记忆可行性', next: '将部分 MoE 专家替换为可检索的外部向量库，实现知识动态更新无需重训', benefit: '无需重训即可更新知识，知识截止日期问题彻底解决', readiness: 42, icon: '🧠' },
];

/* ─── 子 Tab ─── */
const SUB_TABS = [
  { id: 'layers',    label: '🧱 关键 Layer',   desc: 'Transformer 核心组件速查' },
  { id: 'timeline',  label: '📅 创新时间线',   desc: '近期架构创新追踪' },
  { id: 'evolution', label: '🧭 演进路径',     desc: '5 条主流架构演进方向' },
  { id: 'next',      label: '🔭 下一步',       desc: '可做的架构创新方向' },
];

export default function ArchEvolution() {
  const [activeTab, setActiveTab] = useState('layers');
  const [expandedPath, setExpandedPath] = useState(null);

  return (
    <div>
      {/* 页头 */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-1">模型架构演进</h2>
      <p className="text-sm text-gray-500">从关键 Layer 到演进路径，追踪 2024→2026 大模型架构创新脉络 · 更新至 2026-04-27（含 Qwen3.6-35B-A3B / Gemini 3.1 Pro 深度研究代理）</p>
      </div>

      {/* 子 Tab */}
      <div className="flex gap-1 mb-8 p-1 bg-gray-50 rounded-xl border border-gray-100 w-fit flex-wrap">
        {SUB_TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            title={t.desc}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === t.id
                ? 'bg-white text-[#6c5ce7] shadow-sm border border-gray-100'
                : 'text-gray-500 hover:text-[#6c5ce7] hover:bg-white/60'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── 关键 Layer ── */}
      {activeTab === 'layers' && (
        <div>
          <p className="text-xs text-gray-400 mb-5">追踪新模型时，重点关注以下 Layer 是否有创新替换或改进。<span className="text-[#6c5ce7]">紫色高亮</span>为当前演进最活跃的 Layer。</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {KEY_LAYERS.map(l => (
              <div key={l.layer} className={`rounded-xl border p-4 ${l.highlight ? 'border-[#6c5ce7]/30 bg-purple-50/30' : 'border-gray-100 bg-white'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{l.icon}</span>
                  <span className={`text-sm font-bold ${l.highlight ? 'text-[#6c5ce7]' : 'text-gray-800'}`}>{l.layer}</span>
                  {l.highlight && <span className="px-1.5 py-0.5 text-[10px] font-medium bg-[#6c5ce7]/10 text-[#6c5ce7] rounded-full">活跃演进</span>}
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex gap-2">
                    <span className="w-14 flex-shrink-0 text-gray-400">作用</span>
                    <span className="text-gray-600">{l.role}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="w-14 flex-shrink-0 text-gray-400">变体</span>
                    <span className="text-gray-500 font-mono text-[11px]">{l.variants}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="w-14 flex-shrink-0 text-gray-400">代表创新</span>
                    <span className="text-gray-700">{l.innovations}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 创新时间线 ── */}
      {activeTab === 'timeline' && (
        <div>
          <p className="text-xs text-gray-400 mb-6">2024-05 至今，每次新模型发布时若有关键 Layer 创新，在此追踪记录。共 {TIMELINE.length} 条记录，最新更新至 2026-04-24（Qwen3.6-27B + Claude Opus 4.7）。</p>
          <div className="relative">
            {/* 竖线 */}
            <div className="absolute left-[88px] top-0 bottom-0 w-px bg-gray-200" />
            <div className="space-y-6">
              {TIMELINE.map((item, i) => (
                <div key={i} className="flex gap-4 relative">
                  {/* 日期 */}
                  <div className="w-20 flex-shrink-0 text-right">
                    <span className="text-xs font-mono text-gray-400">{item.date}</span>
                  </div>
                  {/* 圆点 */}
                  <div className="w-4 flex-shrink-0 flex items-start justify-center pt-1 relative z-10">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#6c5ce7] border-2 border-white shadow-sm" />
                  </div>
                  {/* 内容 */}
                  <div className="flex-1 pb-2">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-sm font-bold text-gray-800">{item.model}</span>
                      <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${item.color}`}>{item.tag}</span>
                    </div>
                    <p className="text-xs font-medium text-[#6c5ce7] mb-1">{item.innovation}</p>
                    <p className="text-xs text-gray-500">{item.contribution}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── 演进路径 ── */}
      {activeTab === 'evolution' && (
        <div>
          <p className="text-xs text-gray-400 mb-5">当前主流架构演进呈现 5 条清晰路径，点击展开详情。</p>
          <div className="space-y-3">
            {EVOLUTION_PATHS.map((p, i) => {
              const isOpen = expandedPath === p.id;
              return (
                <div key={p.id} className={`rounded-xl border ${p.color} overflow-hidden`}>
                  <button
                    onClick={() => setExpandedPath(isOpen ? null : p.id)}
                    className="w-full p-4 text-left flex items-center gap-3"
                  >
                    <span className="text-xl">{p.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold ${p.headerColor}`}>
                        <span className="text-gray-400 font-mono mr-2">{'0' + (i + 1)}</span>
                        {p.title}
                      </p>
                      {/* 路径箭头 */}
                      <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                        {p.path.map((step, si) => (
                          <span key={si} className="flex items-center gap-1">
                            <span className={`px-2 py-0.5 text-[10px] font-medium rounded-md ${
                              si === p.path.length - 1
                                ? 'bg-[#6c5ce7] text-white'
                                : si === p.path.length - 2
                                ? `${p.color} border border-current font-bold text-gray-700`
                                : 'bg-white/60 text-gray-500'
                            }`}>{step}</span>
                            {si < p.path.length - 1 && <span className="text-gray-300 text-xs">→</span>}
                          </span>
                        ))}
                      </div>
                    </div>
                    <span className={`text-gray-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}>▼</span>
                  </button>
                  {isOpen && (
                    <div className="border-t border-gray-200/60 p-4 bg-white/60 space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="rounded-lg bg-white border border-gray-100 p-3">
                          <p className="text-[10px] font-bold text-gray-400 uppercase mb-1.5">当前状态</p>
                          <p className="text-xs text-gray-700">{p.current}</p>
                        </div>
                        <div className="rounded-lg bg-white border border-gray-100 p-3">
                          <p className="text-[10px] font-bold text-gray-400 uppercase mb-1.5">核心原理</p>
                          <p className="text-xs text-gray-700">{p.core}</p>
                        </div>
                        <div className="rounded-lg bg-[#6c5ce7]/5 border border-[#6c5ce7]/20 p-3">
                          <p className="text-[10px] font-bold text-[#6c5ce7] uppercase mb-1.5">⚡ 下一步</p>
                          <p className="text-xs text-gray-700">{p.next}</p>
                          <p className="text-[10px] text-[#6c5ce7] mt-1.5 font-medium">预期收益：{p.benefit}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 下一步 ── */}
      {activeTab === 'next' && (
        <div>
          <p className="text-xs text-gray-400 mb-5">基于当前技术成熟度，按可行性排序的 6 个架构创新方向。进度条代表技术就绪度（TRL）。</p>
          <div className="space-y-4">
            {NEXT_STEPS.map((s, i) => (
              <div key={i} className="card rounded-xl p-5">
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-2xl flex-shrink-0">{s.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-sm font-bold text-gray-800">{s.direction}</h3>
                      <span className="text-xs text-gray-400 font-mono">TRL {s.readiness}%</span>
                    </div>
                    {/* 进度条 */}
                    <div className="w-full bg-gray-100 rounded-full h-1.5 mb-3">
                      <div
                        className="h-1.5 rounded-full bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe]"
                        style={{ width: `${s.readiness}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">当前状态</p>
                    <p className="text-xs text-gray-600">{s.status}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">下一步做法</p>
                    <p className="text-xs text-gray-700">{s.next}</p>
                  </div>
                  <div className="bg-purple-50/50 rounded-lg p-2.5">
                    <p className="text-[10px] font-bold text-[#6c5ce7] uppercase mb-1">预期收益</p>
                    <p className="text-xs text-gray-700">{s.benefit}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-6 text-center">
            TRL = Technology Readiness Level（技术就绪度）· 数据来源：各模型论文 + Signal AI 综合评估
          </p>
        </div>
      )}
    </div>
  );
}
