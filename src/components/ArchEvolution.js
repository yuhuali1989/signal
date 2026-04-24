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
  { date: '2024-05', model: 'DeepSeek-V2', innovation: 'MLA（Multi-head Latent Attention）', contribution: 'KV Cache 压缩至 1/64，首次工程化验证', tag: 'Attention', color: 'bg-blue-100 text-blue-700' },
  { date: '2024-12', model: 'DeepSeek-V3', innovation: 'MLA + 无辅助损失 MoE + MTP', contribution: 'FP8 训练 + 多 Token 预测，671B 可在 8×H100 部署', tag: 'MoE+推理', color: 'bg-purple-100 text-purple-700' },
  { date: '2025-01', model: 'DeepSeek-R1', innovation: 'GRPO（Group Relative Policy Optimization）', contribution: '纯 RL 激发推理链，无需 SFT 冷启动', tag: '训练范式', color: 'bg-orange-100 text-orange-700' },
  { date: '2025-03', model: 'Gemma 3', innovation: 'MoD（Mixture of Depths）+ SigLIP', contribution: '按 token 难度跳过 Block，计算量减少 ~50%', tag: '跳层', color: 'bg-green-100 text-green-700' },
  { date: '2025-04', model: 'Qwen3', innovation: '思考/非思考双模式 + MoE 细粒度路由', contribution: '同一模型支持 enable_thinking 开关切换推理深度', tag: '推理控制', color: 'bg-amber-100 text-amber-700' },
  { date: '2025-04', model: 'DeepSeek-V4', innovation: 'MLA + FP8 KV Cache + DualPipe 流水线', contribution: '计算通信重叠，集群利用率进一步提升', tag: '系统优化', color: 'bg-cyan-100 text-cyan-700' },
  { date: '2025-04', model: 'Llama 5 MoE', innovation: 'MoD + 128 专家 MoE', contribution: '动态跳过 35% 层，推理速度提升 40%，首个全面超越闭源的开源模型', tag: '跳层+MoE', color: 'bg-green-100 text-green-700' },
  { date: '2025-04', model: 'Qwen3-Max', innovation: 'MoE + AttentionSink（1M 长尾召回）', contribution: '256 细粒度专家 + MLA，1M 上下文长尾召回率 96%', tag: '长上下文', color: 'bg-rose-100 text-rose-700' },
];

const EVOLUTION_PATHS = [
  {
    id: 'attention',
    icon: '👁️',
    title: 'Attention：MHA → 低秩压缩（MLA）→ 稀疏（NSA）',
    color: 'border-blue-200 bg-blue-50/40',
    headerColor: 'text-blue-700',
    path: ['MHA', 'GQA', 'MQA', 'MLA', 'NSA'],
    current: 'MLA（DeepSeek V2 首创，V3/V4 工程化验证）',
    core: '将 KV Cache 从 H×d_h 压缩到低秩潜在向量 d_c，压缩比 64×',
    next: 'NSA（Native Sparse Attention）——在 MLA 基础上引入稀疏模式，进一步降低长序列注意力计算量（DeepSeek-R2 已验证）',
    benefit: '128K→1M 上下文推理成本大幅下降',
  },
  {
    id: 'ffn',
    icon: '🔀',
    title: 'FFN：Dense → 粗粒度 MoE → 细粒度 MoE + 无辅助损失均衡',
    color: 'border-purple-200 bg-purple-50/40',
    headerColor: 'text-purple-700',
    path: ['Dense FFN', '粗粒度 MoE (8E)', '细粒度 MoE (256E)', '专家共享+路由混合'],
    current: '细粒度 MoE（256 专家，DeepSeek V3）+ 无辅助损失负载均衡',
    core: '专家越细粒度，激活参数越少，知识专业化越强',
    next: '专家共享 + 路由专家混合——共享专家保底能力，路由专家负责专业化',
    benefit: '激活计算量减少 60%+，知识专业化更强',
  },
  {
    id: 'depth',
    icon: '⏭️',
    title: '计算深度：固定 N 层 → 动态跳层（MoD）',
    color: 'border-green-200 bg-green-50/40',
    headerColor: 'text-green-700',
    path: ['固定 N 层', 'Early Exit', 'MoD (Gemma 3)', 'MoD + MoE 联合稀疏'],
    current: 'MoD（Mixture of Depths，Google Gemma 3）+ Layer Skipping（MiniCPM 3.0）',
    core: '按 token 难度动态决定经过哪些层，简单 token 跳过中间层',
    next: 'MoD + MoE 联合稀疏——同时在深度（跳层）和宽度（专家路由）两个维度稀疏化，Llama 5 MoE 已初步验证（跳过 35% 层）',
    benefit: '激活计算量减少 60%+',
  },
  {
    id: 'inference',
    icon: '🎯',
    title: '推理范式：单步预测 → MTP + 投机解码 → 自适应预算',
    color: 'border-amber-200 bg-amber-50/40',
    headerColor: 'text-amber-700',
    path: ['单步 LM Head', 'MTP (DeepSeek V3)', 'Speculative Decoding', '自适应推理预算'],
    current: 'MTP（Multi-Token Prediction，DeepSeek V3）+ Speculative Decoding',
    core: '训练时预测多个 token 提升数据效率，推理时用小模型草稿 + 大模型验证加速',
    next: '自适应推理深度（Qwen3 思考/非思考双模式已验证）→ 连续推理预算控制（按任务复杂度动态分配 thinking token 上限）',
    benefit: '简单任务 0 thinking，复杂任务自动深思',
  },
  {
    id: 'quant',
    icon: '🔢',
    title: '量化精度：BF16 → FP8 全链路 → FP4 原生训练',
    color: 'border-rose-200 bg-rose-50/40',
    headerColor: 'text-rose-700',
    path: ['FP32', 'BF16', 'FP8 训练 (DeepSeek V3)', 'INT4 端侧', 'FP4 原生训练'],
    current: 'FP8 训练（DeepSeek V3 首次工程化）+ INT4 端侧（Gemini 4 Nano QAT）',
    core: 'FP8 训练节省 50% 显存，INT4 量化使 100B MoE 可在手机运行',
    next: 'FP4 原生训练（NVIDIA Blackwell B300 硬件已支持 FP4 算力 20 PFLOPS）→ 训练精度进一步降低',
    benefit: '训练显存再减 50%，万亿参数模型单集群可训',
  },
];

const NEXT_STEPS = [
  { direction: 'MLA + NSA 融合', status: 'MLA 已工程化（DeepSeek V3/V4），NSA 已论文验证', next: '将 NSA 稀疏模式叠加到 MLA 低秩压缩上，长序列注意力计算量再降 4×', benefit: '128K→1M 上下文推理成本大幅下降', readiness: 90, icon: '👁️' },
  { direction: 'MoD + MoE 联合稀疏', status: '各自独立验证（Gemma 3 MoD，DeepSeek V3 MoE）', next: '同一模型同时在深度（跳层）和宽度（专家路由）稀疏，Llama 5 初步验证', benefit: '激活计算量减少 60%+', readiness: 75, icon: '🔀' },
  { direction: 'FP4 全链路训练', status: 'FP8 训练已成熟，FP4 硬件已就绪（B300）', next: '将训练精度从 FP8 降至 FP4，配合 QAT 保证精度', benefit: '训练显存再减 50%，万亿参数模型单集群可训', readiness: 70, icon: '🔢' },
  { direction: '自适应推理预算', status: 'Qwen3 思考/非思考双模式（手动切换）', next: '模型自动感知任务复杂度，动态分配 thinking token 预算', benefit: '简单任务 0 thinking，复杂任务自动深思', readiness: 60, icon: '🎯' },
  { direction: '专家记忆外化（MoE + RAG）', status: 'MoE 专家知识存在权重中，RAG 知识存在外部库', next: '将部分专家替换为可检索的外部知识库，实现知识动态更新', benefit: '无需重训即可更新知识，专家数量突破显存限制', readiness: 40, icon: '🧠' },
  { direction: '端侧 MoE + Expert Paging', status: 'Gemini 4 Nano 已验证 Expert Paging（LRU Cache）', next: '将 Expert Paging 标准化，配合 INT4/FP4 量化，使 100B+ MoE 在 8GB 手机上流畅运行', benefit: '端侧模型能力接近云端 30B 密集模型', readiness: 55, icon: '📱' },
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
        <p className="text-sm text-gray-500">从关键 Layer 到演进路径，追踪 2024→2026 大模型架构创新脉络</p>
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
          <p className="text-xs text-gray-400 mb-6">2024-05 至今，每次新模型发布时若有关键 Layer 创新，在此追踪记录。</p>
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
