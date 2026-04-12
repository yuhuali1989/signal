"""为 models.json 中的每个模型生成 textArch 文本架构图"""
import json
from pathlib import Path

fp = Path(__file__).parent.parent / 'content' / 'gallery' / 'models.json'
models = json.loads(fp.read_text())

# 10 个重点模型的详细文本架构图
DETAILED = {}

DETAILED["GPT-OSS 120B"] = """\
┌─────────────────────────────────┐
│      GPT-OSS 120B (Dense)       │
├─────────────────────────────────┤
│ Input Tokens                    │
│   ↓                             │
│ Embedding (128K vocab)          │
│   + Rotary Position Encoding    │
│   ↓                             │
│ ╔═════════════════════════════╗  │
│ ║ Transformer Block × 96L    ║  │
│ ║ ┌─────────────────────┐    ║  │
│ ║ │ RMSNorm             │    ║  │
│ ║ │ Multi-Head Attention │    ║  │
│ ║ │  H=96, d=128        │    ║  │
│ ║ │  GQA: 96Q / 8KV     │    ║  │
│ ║ │  + RoPE              │    ║  │
│ ║ └───────┬─────────────┘    ║  │
│ ║         │ + Residual       ║  │
│ ║ ┌───────┴─────────────┐    ║  │
│ ║ │ RMSNorm             │    ║  │
│ ║ │ FFN (SwiGLU)        │    ║  │
│ ║ │  12288→49152→12288  │    ║  │
│ ║ └───────┬─────────────┘    ║  │
│ ║         │ + Residual       ║  │
│ ╚═════════╪═════════════════╝  │
│           ↓                     │
│ RMSNorm → LM Head → Logits     │
└─────────────────────────────────┘"""

DETAILED["Llama 3 8B"] = """\
┌─────────────────────────────────┐
│       Llama 3 8B (Dense)        │
├─────────────────────────────────┤
│ Input Tokens                    │
│   ↓                             │
│ Embedding (128K vocab, BPE)     │
│   ↓                             │
│ ╔═════════════════════════════╗  │
│ ║ Transformer Block × 32L    ║  │
│ ║ ┌─────────────────────┐    ║  │
│ ║ │ RMSNorm             │    ║  │
│ ║ │ Grouped-Query Attn  │    ║  │
│ ║ │  H=32, d=128        │    ║  │
│ ║ │  GQA: 32Q / 8KV     │    ║  │
│ ║ │  + RoPE (θ=500000)  │    ║  │
│ ║ └───────┬─────────────┘    ║  │
│ ║         │ + Residual       ║  │
│ ║ ┌───────┴─────────────┐    ║  │
│ ║ │ RMSNorm             │    ║  │
│ ║ │ FFN (SwiGLU)        │    ║  │
│ ║ │  4096→14336→4096    │    ║  │
│ ║ └───────┬─────────────┘    ║  │
│ ║         │ + Residual       ║  │
│ ╚═════════╪═════════════════╝  │
│           ↓                     │
│ RMSNorm → LM Head (128K)       │
└─────────────────────────────────┘"""

DETAILED["DeepSeek-V3"] = """\
┌──────────────────────────────────┐
│ DeepSeek-V3 671B (MoE, 37B act)  │
├──────────────────────────────────┤
│ Input Tokens                      │
│   ↓                               │
│ Embedding (128K vocab)            │
│   ↓                               │
│ Layer 1-3: Dense FFN              │
│   ↓                               │
│ ╔══════════════════════════════╗   │
│ ║ MoE Block × 58L (Layer 4-61)║   │
│ ║ ┌────────────────────────┐   ║   │
│ ║ │ RMSNorm                │   ║   │
│ ║ │ Multi-head Latent Attn │   ║   │
│ ║ │  (MLA)                 │   ║   │
│ ║ │  KV压缩: d→512 (32×)  │   ║   │
│ ║ │  H=128, d_h=128       │   ║   │
│ ║ │  + RoPE (解耦)        │   ║   │
│ ║ └───────┬────────────────┘   ║   │
│ ║         │ + Residual         ║   │
│ ║ ┌───────┴────────────────┐   ║   │
│ ║ │ RMSNorm                │   ║   │
│ ║ │ DeepSeekMoE            │   ║   │
│ ║ │  1 shared + 256 routed │   ║   │
│ ║ │  Top-8 (sigmoid route) │   ║   │
│ ║ │  Aux-loss-free balance │   ║   │
│ ║ │  SwiGLU (d_ff=2048)   │   ║   │
│ ║ └───────┬────────────────┘   ║   │
│ ║         │ + Residual         ║   │
│ ╚═════════╪════════════════════╝   │
│           ↓                        │
│ RMSNorm → LM Head                  │
│   + MTP Module (depth=1)           │
└──────────────────────────────────┘"""

DETAILED["Mamba / Mamba-2"] = """\
┌──────────────────────────────────┐
│    Mamba 2.8B (SSM, 非Transformer)│
├──────────────────────────────────┤
│ Input → Embedding                 │
│   ↓                               │
│ ╔══════════════════════════════╗   │
│ ║ Mamba Block × 64L            ║   │
│ ║ ┌────────────────────────┐   ║   │
│ ║ │ Norm                   │   ║   │
│ ║ │   ↓                    │   ║   │
│ ║ │ Linear (d → 2·d_inner) │   ║   │
│ ║ │   ↓         ↓          │   ║   │
│ ║ │ ┌─┴───┐  ┌──┴──┐      │   ║   │
│ ║ │ │Conv │  │ σ   │      │   ║   │
│ ║ │ │ 1D  │  │gate │      │   ║   │
│ ║ │ └──┬──┘  └──┬──┘      │   ║   │
│ ║ │    ↓        │          │   ║   │
│ ║ │ ┌──┴──────┐ │          │   ║   │
│ ║ │ │Select.  │ │          │   ║   │
│ ║ │ │  SSM    │ │          │   ║   │
│ ║ │ │x'=Ax+Bu│ │          │   ║   │
│ ║ │ │y =Cx+Du│ │          │   ║   │
│ ║ │ │Δ,B,C   │ │          │   ║   │
│ ║ │ │输入依赖│ │          │   ║   │
│ ║ │ └──┬─────┘ │          │   ║   │
│ ║ │    └── ⊗ ──┘          │   ║   │
│ ║ │       ↓               │   ║   │
│ ║ │ Linear (d_i → d)      │   ║   │
│ ║ └───────┬───────────────┘   ║   │
│ ║         │ + Residual        ║   │
│ ╚═════════╪═══════════════════╝   │
│           ↓                       │
│ Norm → LM Head                    │
│ ★ O(N) 线性复杂度                 │
└──────────────────────────────────┘"""

DETAILED["DeepSeek-R1"] = """\
┌──────────────────────────────────┐
│  DeepSeek-R1 671B (MoE + 推理)   │
├──────────────────────────────────┤
│ Input (Question/Problem)          │
│   ↓                               │
│ ╔══════════════════════════════╗   │
│ ║ Base: DeepSeek-V3 架构       ║   │
│ ║ (MLA + MoE, 671B/37B)       ║   │
│ ╠══════════════════════════════╣   │
│ ║ RL Training (GRPO)           ║   │
│ ║                              ║   │
│ ║ Stage 1: 纯 RL (无 SFT)     ║   │
│ ║   规则奖励 (准确性+格式)     ║   │
│ ║   ↓ 涌现 CoT                ║   │
│ ║   ↓ 涌现 反思 & 验证        ║   │
│ ║   ↓ 涌现 "aha moment"       ║   │
│ ║                              ║   │
│ ║ Stage 2: RL + SFT            ║   │
│ ║   长 CoT 过滤 → SFT          ║   │
│ ║   继续 RL (多场景奖励)       ║   │
│ ╚══════════════════════════════╝   │
│   ↓                               │
│ <think>推理过程</think>            │
│ <answer>最终答案</answer>          │
│                                    │
│ ★ 纯 RL 涌现推理能力              │
│ ★ AIME 79.8%, MATH 97.3%          │
└──────────────────────────────────┘"""

DETAILED["Mixtral 8x7B"] = """\
┌──────────────────────────────────┐
│  Mixtral 8×7B (MoE, 12.9B act)   │
├──────────────────────────────────┤
│ Input Tokens                      │
│   ↓                               │
│ Embedding (32K vocab, BPE)        │
│   ↓                               │
│ ╔══════════════════════════════╗   │
│ ║ Transformer Block × 32L     ║   │
│ ║ ┌────────────────────────┐   ║   │
│ ║ │ RMSNorm                │   ║   │
│ ║ │ Grouped-Query Attn     │   ║   │
│ ║ │  H=32, d=128           │   ║   │
│ ║ │  GQA: 32Q / 8KV        │   ║   │
│ ║ │  + RoPE                │   ║   │
│ ║ │  Sliding Window 4K     │   ║   │
│ ║ └───────┬────────────────┘   ║   │
│ ║         │ + Residual         ║   │
│ ║ ┌───────┴────────────────┐   ║   │
│ ║ │ RMSNorm                │   ║   │
│ ║ │ MoE FFN                │   ║   │
│ ║ │  8 experts, Top-2      │   ║   │
│ ║ │  Gate: softmax          │   ║   │
│ ║ │  SwiGLU 4096→14336     │   ║   │
│ ║ └───────┬────────────────┘   ║   │
│ ║         │ + Residual         ║   │
│ ╚═════════╪════════════════════╝   │
│           ↓                        │
│ RMSNorm → LM Head (32K)           │
│ ★ 开源 MoE 先驱                   │
└──────────────────────────────────┘"""

DETAILED["Phi-4"] = """\
┌─────────────────────────────────┐
│      Phi-4 14B (Dense, 小模型)   │
├─────────────────────────────────┤
│ Input Tokens                    │
│   ↓                             │
│ Embedding (100K vocab)          │
│   ↓                             │
│ ╔═════════════════════════════╗  │
│ ║ Transformer Block × 40L    ║  │
│ ║ ┌─────────────────────┐    ║  │
│ ║ │ RMSNorm             │    ║  │
│ ║ │ Full Attention      │    ║  │
│ ║ │  H=40, d=128        │    ║  │
│ ║ │  Full KV (no GQA)   │    ║  │
│ ║ │  + RoPE              │    ║  │
│ ║ │  Context: 16K        │    ║  │
│ ║ └───────┬─────────────┘    ║  │
│ ║         │ + Residual       ║  │
│ ║ ┌───────┴─────────────┐    ║  │
│ ║ │ RMSNorm             │    ║  │
│ ║ │ FFN (SwiGLU)        │    ║  │
│ ║ │  5120→17920→5120    │    ║  │
│ ║ └───────┬─────────────┘    ║  │
│ ║         │ + Residual       ║  │
│ ╚═════════╪═════════════════╝  │
│           ↓                     │
│ RMSNorm → LM Head (100K)       │
│ ★ 合成数据驱动                  │
│ ★ 14B 超越 GPT-4o-mini         │
└─────────────────────────────────┘"""

DETAILED["Qwen 2.5"] = """\
┌─────────────────────────────────┐
│       Qwen 2.5 72B (Dense)      │
├─────────────────────────────────┤
│ Input Tokens                    │
│   ↓                             │
│ Embedding (152K vocab, BPE)     │
│   ↓                             │
│ ╔═════════════════════════════╗  │
│ ║ Transformer Block × 80L    ║  │
│ ║ ┌─────────────────────┐    ║  │
│ ║ │ RMSNorm             │    ║  │
│ ║ │ Grouped-Query Attn  │    ║  │
│ ║ │  H=64, d=128        │    ║  │
│ ║ │  GQA: 64Q / 8KV     │    ║  │
│ ║ │  + RoPE              │    ║  │
│ ║ │  + YaRN (128K)       │    ║  │
│ ║ └───────┬─────────────┘    ║  │
│ ║         │ + Residual       ║  │
│ ║ ┌───────┴─────────────┐    ║  │
│ ║ │ RMSNorm             │    ║  │
│ ║ │ FFN (SwiGLU)        │    ║  │
│ ║ │  8192→29568→8192    │    ║  │
│ ║ └───────┬─────────────┘    ║  │
│ ║         │ + Residual       ║  │
│ ╚═════════╪═════════════════╝  │
│           ↓                     │
│ RMSNorm → LM Head (152K)       │
│ ★ 最完整开源家族                │
│   0.5B/1.5B/7B/14B/72B         │
└─────────────────────────────────┘"""

DETAILED["Gemini 2.0 / 2.5"] = """\
┌──────────────────────────────────┐
│   Gemini 2.0/2.5 (MoE, 闭源)     │
├──────────────────────────────────┤
│ Multi-Modal Input                 │
│ ┌────┐ ┌─────┐ ┌─────┐ ┌─────┐  │
│ │Text│ │Image│ │Audio│ │Video│  │
│ └─┬──┘ └──┬──┘ └──┬──┘ └──┬──┘  │
│   └───┬───┴───────┴───────┘      │
│       ↓                          │
│ Unified Tokenizer (256K)         │
│   ↓                               │
│ ╔══════════════════════════════╗   │
│ ║ MoE Transformer × ?L        ║   │
│ ║ ┌────────────────────────┐   ║   │
│ ║ │ Norm                   │   ║   │
│ ║ │ Multi-Query Attention  │   ║   │
│ ║ │  Context: 1M→2M       │   ║   │
│ ║ └───────┬────────────────┘   ║   │
│ ║         │ + Residual         ║   │
│ ║ ┌───────┴────────────────┐   ║   │
│ ║ │ Norm                   │   ║   │
│ ║ │ Sparse MoE FFN         │   ║   │
│ ║ │  >1T total params      │   ║   │
│ ║ │  Top-K routing         │   ║   │
│ ║ └───────┬────────────────┘   ║   │
│ ║         │ + Residual         ║   │
│ ╚═════════╪════════════════════╝   │
│           ↓                        │
│ Multi-Modal Output                 │
│ Flash: 极致性价比 | TPU v5p        │
└──────────────────────────────────┘"""

DETAILED["Claude Opus 4.6"] = """\
┌─────────────────────────────────┐
│   Claude Opus 4.6 (Dense, 闭源)  │
├─────────────────────────────────┤
│ Input (Text / Image / Code)     │
│   ↓                             │
│ Tokenizer (未公开)              │
│   ↓                             │
│ ╔═════════════════════════════╗  │
│ ║ Transformer Block × ?L     ║  │
│ ║ ┌─────────────────────┐    ║  │
│ ║ │ Pre-Norm             │    ║  │
│ ║ │ Attention            │    ║  │
│ ║ │  (推测 GQA 或 MLA)  │    ║  │
│ ║ │  Context: 200K       │    ║  │
│ ║ └───────┬─────────────┘    ║  │
│ ║         │ + Residual       ║  │
│ ║ ┌───────┴─────────────┐    ║  │
│ ║ │ Pre-Norm             │    ║  │
│ ║ │ FFN (推测 SwiGLU)   │    ║  │
│ ║ └───────┬─────────────┘    ║  │
│ ║         │ + Residual       ║  │
│ ╚═════════╪═════════════════╝  │
│           ↓                     │
│ Constitutional AI 对齐          │
│ RLHF + CAI 反馈                │
│           ↓                     │
│ Output → Response               │
│ ★ SWE-bench 72.3% (SOTA)       │
└─────────────────────────────────┘"""

# 应用到 models
for m in models:
    name = m['name']
    if name in DETAILED:
        m['textArch'] = DETAILED[name]

# 为剩余模型生成简化版
for m in models:
    if m.get('textArch'):
        continue
    t = m.get('type', 'dense')
    name = m['name']
    params = m.get('params', '?')
    fs = m.get('factSheet', {})
    attn = fs.get('attention', 'Attention')
    ctx = fs.get('context', '?')
    norm = fs.get('normalization', 'RMSNorm')
    act = fs.get('activation', 'SwiGLU')
    layers = fs.get('layers', '?')

    if t == 'moe':
        experts = fs.get('experts', '?')
        m['textArch'] = f"""\
┌─────────────────────────────────┐
│  {name[:30]:^30}  │
│  ({params}, MoE)                │
├─────────────────────────────────┤
│ Embedding → Transformer + MoE   │
│ ╔═════════════════════════════╗  │
│ ║ Block × {str(layers):>3}L               ║  │
│ ║ ┌─────────────────────┐    ║  │
│ ║ │ {norm[:20]:<20} │    ║  │
│ ║ │ {attn[:20]:<20} │    ║  │
│ ║ │  Context: {str(ctx)[:12]:<12}  │    ║  │
│ ║ └───────┬─────────────┘    ║  │
│ ║         │ + Residual       ║  │
│ ║ ┌───────┴─────────────┐    ║  │
│ ║ │ MoE FFN             │    ║  │
│ ║ │  {str(experts)[:20]:<20} │    ║  │
│ ║ │  {act[:20]:<20} │    ║  │
│ ║ └───────┬─────────────┘    ║  │
│ ║         │ + Residual       ║  │
│ ╚═════════╪═════════════════╝  │
│           ↓                     │
│ LM Head → Logits                │
└─────────────────────────────────┘"""
    elif t == 'ssm':
        m['textArch'] = f"""\
┌─────────────────────────────────┐
│  {name[:30]:^30}  │
│  ({params}, SSM)                │
├─────────────────────────────────┤
│ Embedding                       │
│ ╔═════════════════════════════╗  │
│ ║ SSM Block × {str(layers):>3}L            ║  │
│ ║ ┌─────────────────────┐    ║  │
│ ║ │ Norm → Linear → Conv │    ║  │
│ ║ │   ↓                  │    ║  │
│ ║ │ Selective SSM         │    ║  │
│ ║ │  x'=Ax+Bu, y=Cx+Du  │    ║  │
│ ║ │   ↓  ⊗  Gate        │    ║  │
│ ║ │ Linear → Output      │    ║  │
│ ║ └───────┬─────────────┘    ║  │
│ ║         │ + Residual       ║  │
│ ╚═════════╪═════════════════╝  │
│           ↓                     │
│ Norm → LM Head                  │
│ ★ O(N) 线性复杂度               │
└─────────────────────────────────┘"""
    else:
        m['textArch'] = f"""\
┌─────────────────────────────────┐
│  {name[:30]:^30}  │
│  ({params}, Dense)              │
├─────────────────────────────────┤
│ Embedding                       │
│ ╔═════════════════════════════╗  │
│ ║ Transformer Block × {str(layers):>3}L    ║  │
│ ║ ┌─────────────────────┐    ║  │
│ ║ │ {norm[:20]:<20} │    ║  │
│ ║ │ {attn[:20]:<20} │    ║  │
│ ║ │  Context: {str(ctx)[:12]:<12}  │    ║  │
│ ║ └───────┬─────────────┘    ║  │
│ ║         │ + Residual       ║  │
│ ║ ┌───────┴─────────────┐    ║  │
│ ║ │ FFN ({act[:14]})    │    ║  │
│ ║ └───────┬─────────────┘    ║  │
│ ║         │ + Residual       ║  │
│ ╚═════════╪═════════════════╝  │
│           ↓                     │
│ LM Head → Logits                │
└─────────────────────────────────┘"""

fp.write_text(json.dumps(models, ensure_ascii=False, indent=2))
has = sum(1 for m in models if m.get('textArch'))
print(f'Total: {len(models)}, with textArch: {has}')
