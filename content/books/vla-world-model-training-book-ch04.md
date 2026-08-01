---
title: "VLA 与世界模型：训练过程全解 - 第4章: VLA 架构设计：视觉编码器、语言模型与动作头"
book: "VLA 与世界模型：训练过程全解"
chapter: "4"
chapterTitle: "VLA 架构设计：视觉编码器、语言模型与动作头"
description: "深入拆解 VLA 的三大组件如何组装：注意力掩码设计、Action Expert 架构、跨具身编码器，以及四种代表模型的架构图对比"
date: "2026-08-01"
updatedAt: "2026-08-01"
agent: "研究员→编辑→审校员"
tags:
  - "VLA架构"
  - "Transformer"
  - "Action Expert"
  - "注意力掩码"
  - "DiT"
type: "book"
---

# 第 4 章：VLA 架构设计——视觉编码器、语言模型与动作头

## 4.1 VLA 架构的通用模板

尽管 RT-2、OpenVLA、π0、GR00T N1 的具体实现不同，它们都遵循同一个通用架构模板：

```
┌──────────────────────────────────────────────────┐
│                   VLA 架构模板                     │
│                                                    │
│  ┌─────────┐  ┌──────────┐  ┌──────────────────┐ │
│  │ 视觉编码器│→│ 视觉 token│  │                  │ │
│  │ (SigLIP) │  │  (196个)  │  │   语言模型骨干    │ │
│  └─────────┘  └──────────┘  │  (Llama/PaliGemma)│ │
│                              │                    │ │
│  ┌─────────┐  ┌──────────┐  │  ┌──────────────┐ │ │
│  │ 语言指令  │→│ 语言 token│→ │  │   动作头      │ │ │
│  │ "pick up"│  │  (N个)    │  │  │ (Token/Diff/  │ │ │
│  └─────────┘  └──────────┘  │  │  Flow)        │ │ │
│                              │  └──────┬───────┘ │ │
│  ┌─────────┐  ┌──────────┐  │         │         │ │
│  │本体状态 q│→│ 状态 token│  │         ▼         │ │
│  │ (关节角度)│  │  (1个)    │  │    动作 a_t       │ │
│  └─────────┘  └──────────┘  └──────────────────┘ │
└──────────────────────────────────────────────────┘
```

三种 token 在语言模型内部通过自注意力交互，最终由动作头生成控制命令。

## 4.2 注意力掩码设计

不同 VLA 模型的核心差异之一，在于三种 token 之间的注意力掩码设计。

### 4.2.1 OpenVLA：简单统一

OpenVLA 将所有 token 一视同仁——视觉 token、语言 token 和动作 token 拼接成一个序列，使用标准的因果注意力（causal attention）：

```
[视觉token₁, 视觉token₂, ..., 语言token₁, ..., 动作token₁, ..., 动作token₇]

注意力掩码（causal）:
     V₁  V₂  ...  L₁  ...  A₁  ...  A₇
V₁   ✓   ✓   ...  ✓   ...  ✓   ...  ✓
V₂   ✗   ✓   ...  ✓   ...  ✓   ...  ✓
...
A₇   ✗   ✗   ...  ✗   ...  ✗   ...  ✓
```

**优点**：实现简单，直接复用 Llama 2 的架构和训练基础设施。

**缺点**：动作 token 只能注意到前面的 token，无法双向交互——而动作的各维度之间本应有强关联（如夹爪闭合时机与末端位置的关系）。

### 4.2.2 π0：分块因果掩码

π0 引入了更精细的**分块因果掩码**（block-wise causal masking），灵感来自 Mixture-of-Experts：

```
              VLM Block    Proprio Block    Action Block
VLM Block       ✓(因果)         ✗               ✗
Proprio Block   ✓(可见VLM)   ✓(双向)            ✗
Action Block    ✓(可见VLM)   ✓(可见Proprio)   ✓(双向)
```

**关键设计**：
- VLM block 处理视觉和语言 token，使用因果自注意力（保持生成式能力）
- Proprio block（本体状态）使用双向注意力，可以看到 VLM block
- Action block 使用双向注意力，可以看到 VLM 和 Proprio

这样，动作 token 之间可以**双向交互**，确保生成的动作序列内部一致。同时，VLM backbone 的预训练知识不受干扰（因果掩码保持不变）。

### 4.2.3 GR00T N1：双系统分离

GR00T N1 采用更彻底的分离——System 1（VLM）和 System 2（DiT）是两个独立的模块：

```
System 1 (慢思考, ~5Hz):
  [视觉token + 语言token] → VLM (Eagle2) → 语义特征 token

System 2 (快动作, ~100Hz):  
  [语义特征token + 本体状态] → DiT → 扩散去噪 → 动作 a_t
```

System 1 的输出作为 System 2 的条件。System 2 的 DiT 以 System 1 的语义特征为条件，执行扩散去噪生成高频动作。

## 4.3 Action Expert 设计

### 4.3.1 π0 的 Action Expert

π0 的核心创新之一是 **Action Expert**——一组独立的 Transformer 参数（300M），专门处理本体状态和动作 token：

```python
class PiZeroModel(nn.Module):
    def __init__(self):
        self.vlm = PaliGemma.from_pretrained("paligemma-3b-pt-224")  # 2.291B
        self.action_expert = TransformerDecoder(
            d_model=2048,
            n_layers=10,
            n_heads=16,
        )  # 0.315B
        # Total: 2.291B + 0.315B = 3.3B ( trainable: 0.315B + VLM LoRA )
    
    def forward(self, images, text, proprio, noisy_actions, t):
        # 1. VLM 编码视觉和语言
        vlm_tokens = self.vlm.encode(images, text)  # [B, seq, 2048]
        
        # 2. Action Expert 编码本体状态和噪声动作
        proprio_token = self.proprio_proj(proprio)  # [B, 1, 2048]
        action_tokens = self.action_proj(noisy_actions)  # [B, H, 2048]
        
        # 3. 拼接 + 分块因果注意力
        all_tokens = concat([vlm_tokens, proprio_token, action_tokens])
        output = self.combined_transformer(
            all_tokens, attention_mask=BLOCK_CAUSAL_MASK
        )
        
        # 4. 提取动作 token 的输出 → 预测速度场
        velocity = self.velocity_head(output[:, -H:, :])  # [B, H, 7]
        return velocity
```

**Action Expert 的参数量**：仅 315M，但通过双向注意力和专属参数，它能精确建模动作分布的复杂结构。

### 4.3.2 GR00T N1 的 DiT Action Module

GR00T N1 的 System 2 使用 Diffusion Transformer（DiT）：

```
DiT 输入:
  - 语义条件: System 1 VLM 输出的特征 token
  - 本体状态: 关节角度向量
  - 噪声动作: noisy a_t

DiT 架构:
  - 多层 Transformer block withAdaLN（自适应层归一化）
  - 每层接收时间步 t 的 embedding 作为条件
  - 交叉注意力: DiT query × VLM key/value

DiT 输出:
  - 预测噪声 ε_θ(a_t^noisy, obs, t)
  - 或预测速度 v_θ(a_t^noisy, obs, t)
```

GR00T 1.6 将 DiT block 增大到 2×，支持更细粒度的手指控制和长视距操作。

## 4.4 跨具身（Cross-Embodiment）编码器

### 4.4.1 问题：不同机器人有不同的状态/动作空间

| 机器人 | 关节数 | 动作维度 | 控制频率 |
|--------|--------|----------|----------|
| WidowX | 4 | 4 (Δxyz + gripper) | 5 Hz |
| Franka Emika | 7 | 7 (Δxyz + Δrpy + gripper) | 15 Hz |
| Google Robot | 7 | 7 | 3 Hz |
| GR-1 人形 | 30+ | 30+ | 50 Hz |
| 双臂 | 14 | 14 | 10 Hz |

### 4.4.2 GR00T N1 的 Latent Action Space

GR00T N1 引入**潜在动作空间**——将不同机器人的动作映射到一个共享的潜在表示：

```
Franka 7D →  Latent Action Space  → Franka 7D
GR-1 30D →  Latent Action Space  → GR-1 30D
双臂 14D →  Latent Action Space  → 双臂 14D
```

这意味着"抓取"这个概念，在 Franka 上学到的表示可以迁移到 GR-1 人形。实现方式是通过一个 embodiment-aware 的编码器-解码器：

```python
class EmbodimentAwareEncoder(nn.Module):
    def encode(self, action, embodiment_id):
        # embodiment_id 标识机器人类型
        emb = self.emb_embedding(embodiment_id)  # [B, D]
        h = self.encoder(action, emb)             # → latent z
        return z
    
    def decode(self, z, embodiment_id):
        emb = self.emb_embedding(embodiment_id)
        action = self.decoder(z, emb)              # → action_dim
        return action
```

### 4.4.3 π0 的自然跨具身

π0 通过更简洁的方式实现跨具身——本体状态向量 q_t 自然地区分不同实体：

```
Franka:   q_t = [j₁, j₂, j₃, j₄, j₅, j₆, j₇]  (7维)
GR-1:     q_t = [j₁, ..., j₃₀]                    (30维)
```

由于 action expert 使用双向注意力且参数独立，它可以自适应不同维度的输入。训练时，不同实体的数据混合在同一个 batch 中，模型自然学会区分。

## 4.5 四种代表模型架构对比

```
┌─────────────────────────────────────────────────────────────┐
│                        RT-2 (55B)                            │
│  [PaLI-X VLM 55B] → [Action Tokenizer 256 bins] → 7 tokens  │
│  全因果注意力, 无 Action Expert, 无跨具身                      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                     OpenVLA (7B)                             │
│  [SigLIP + Llama2 7B] → [Action Tokenizer 256 bins] → 7 tok │
│  全因果注意力, LoRA 微调, OXE 预训练                          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                       π0 (3.3B)                              │
│  [PaliGemma 3B] ←→ [Action Expert 300M] → Flow Matching     │
│  分块因果掩码, 双向动作注意力, 50步 Action Chunk, 50Hz       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    GR00T N1 (2B)                             │
│  [Eagle2 VLM 2B] → 语义token → [DiT Action] → Diffusion     │
│  双系统分离, 潜在动作空间, 100Hz+ 控制频率                    │
└─────────────────────────────────────────────────────────────┘
```

| 维度 | RT-2 | OpenVLA | π0 | GR00T N1 |
|------|------|---------|-----|----------|
| 总参数 | 55B | 7B | 3.3B | 2B |
| 视觉编码器 | PaLI-X 内置 | SigLIP | SigLIP | Eagle2 |
| LM 骨干 | PaLI-X | Llama 2 | PaliGemma | Eagle2 VLM |
| 动作表示 | 离散 token | 离散 token | Flow Matching | Diffusion |
| Action Expert | ❌ | ❌ | ✅ (300M) | ✅ (DiT) |
| 注意力掩码 | 全因果 | 全因果 | 分块因果 | 双系统分离 |
| Action Chunk | ❌ | ❌ | ✅ (H=50) | ✅ |
| 控制频率 | ~1Hz | 6Hz | 50Hz | 100Hz+ |
| 跨具身 | 单一实体 | OXE | 7种实体 | 多种人形 |
| 开源 | ❌ | ✅ | ✅ | ✅ (Apache 2.0) |

## 4.6 架构选择决策树

```
是否需要 >20Hz 高频控制?
├─ 否 → 预算充足?
│       ├─ 是 → RT-2 风格 (大VLM + 离散token, 最高语义泛化)
│       └─ 否 → OpenVLA 风格 (7B + 离散token, 开源易部署)
└─ 是 → 需要双臂/灵巧手?
        ├─ 是 → π0 风格 (Flow Matching + Action Chunk, 50Hz)
        └─ 否 → GR00T 风格 (双系统 + DiT, 100Hz+)
```

## 4.7 小结

VLA 架构设计的核心决策点：

1. **动作表示**决定上限：离散 token 简单但限制频率和精度；Diffusion/Flow 精确高频但实现复杂
2. **注意力掩码**决定信息流：全因果最简单但动作 token 无法双向交互；分块因果是最佳折中
3. **Action Expert**是关键创新：独立参数 + 双向注意力，让动作建模与 VLM 理解解耦
4. **双系统架构**是工程趋势：VLM 慢思考 + DiT/Flow 快动作，兼顾语义理解和实时控制
5. **跨具身**是规模化前提：潜在动作空间或自然维度自适应，让一个模型服务多种机器人

下一章将进入完整的训练流程——从预训练到 Co-fine-tuning 到任务微调的每个阶段。
