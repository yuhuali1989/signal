---
title: "VLA 与世界模型：训练过程全解 - 第5章: VLA 训练流程：预训练、Co-fine-tuning 与任务微调"
book: "VLA 与世界模型：训练过程全解"
chapter: "5"
chapterTitle: "VLA 训练流程：预训练、Co-fine-tuning 与任务微调"
description: "完整拆解 VLA 的三阶段训练流程：VLM 预训练→跨域 Co-fine-tuning→任务级 LoRA 微调，含训练超参、损失函数、分布式策略"
date: "2026-08-01"
updatedAt: "2026-08-01"
agent: "研究员→编辑→审校员"
tags:
  - "VLA训练"
  - "Co-fine-tuning"
  - "LoRA"
  - "分布式训练"
  - "损失函数"
type: "book"
---

# 第 5 章：VLA 训练流程——预训练、Co-fine-tuning 与任务微调

## 5.1 VLA 训练的总体架构

VLA 训练遵循类似 LLM 的"预训练→后训练"范式，但增加了机器人特有的阶段：

```
Stage 0: VLM 预训练（可选，通常用现成模型）
  数据: 数十亿图文对
  产出: 视觉-语言对齐的 backbone

Stage 1: VLA 预训练（大规模机器人数据）
  数据: Open X-Embodiment 100万+条轨迹
  产出: 通用机器人策略

Stage 2: Co-fine-tuning（混合训练，防遗忘）
  数据: α×VLM数据 + (1-α)×机器人数据
  产出: 保持泛化的策略

Stage 3: 任务微调（特定任务/机器人）
  数据: 10-50K 条目标任务演示
  方法: 全量微调 或 LoRA
  产出: 部署就绪的策略
```

## 5.2 Stage 1：VLA 预训练

### 5.2.1 OpenVLA 的预训练配置

OpenVLA 是目前最完整的开源 VLA 预训练参考：

| 配置项 | 值 | 备注 |
|--------|-----|------|
| 骨干模型 | Llama-2-7B + SigLIP | 预训练 VLM |
| 训练数据 | Open X-Embodiment | 970K 条轨迹 |
| GPU 数量 | 64 × A100 (80GB) | — |
| 训练时长 | 14 天 | 21,500 A100-hours |
| Batch Size | 2048 | 全局 |
| 学习率 | 2e-5 | cosine decay |
| 精度 | bfloat16 | — |
| 动作 token | 256 bins × 7 维 | 离散化 |
| 序列长度 | ~1024 token | 视觉196 + 语言50 + 动作7 |

### 5.2.2 损失函数

**离散 token VLA（OpenVLA/RT-2）**：

标准 next-token prediction 交叉熵损失：

```
L = -Σ_{k=1}^{7} log p_θ(a_t^{(k)} | o_t, ℓ, a_t^{(<k)})
```

每个动作维度是一个 token，7 维动作 = 7 步自回归生成。

**Flow Matching VLA（π0）**：

MSE 损失预测速度场：

```
L^τ(θ) = E_{p(A_t|o_t), q(A_t^τ|A_t)} [ || v_θ(A_t^τ, o_t) - u(A_t^τ | A_t) ||² ]
```

其中 `A_t^τ = τ·A_t + (1-τ)·ε`，`u(A_t^τ|A_t) = A_t - ε` 是目标速度。

τ 的采样策略影响训练效果：

| 采样策略 | 公式 | 效果 |
|----------|------|------|
| Uniform | τ ~ U(0, 1) | 均衡，open-pi-zero 默认 |
| Beta | τ ~ Beta(α, β), α<β | 早期噪声阶段密度更高，π0 原始论文推荐 |

**Diffusion VLA（GR00T N1）**：

标准 DDPM 噪声预测损失：

```
L = E_{t, ε, a_0} [ || ε_θ(a_t^noisy, obs, t) - ε ||² ]
```

### 5.2.3 分布式训练策略

VLA 预训练的规模（64+ GPU）需要分布式训练：

| 并行策略 | 适用组件 | 配置 |
|----------|----------|------|
| 数据并行 (DP) | 整体 | batch 切分到各 GPU |
| FSDP | LM 骨干 | 参数分片，减少显存 |
| 张量并行 (TP) | 大模型 (>14B) | 层内切分 |
| 序列并行 (SP) | 长序列 | 序列维度切分 |

OpenVLA 使用 FSDP（Fully Sharded Data Parallel）在 64 × A100 上训练，每个 GPU 仅需持有 7B/64 ≈ 110M 参数的副本。

GR00T N1 的 DiT 模块使用较小的并行度（单 GPU 即可），而 VLM backbone 使用 FSDP。

### 5.2.4 训练监控指标

| 指标 | 含义 | 健康范围 |
|------|------|----------|
| Action token loss | 动作预测准确度 | < 1.5 (OpenVLA) |
| Flow matching loss | 速度场预测误差 | < 0.05 (π0) |
| 成功率（仿真评估） | 闭环任务完成率 | > 30% (预训练阶段) |
| 梯度范数 | 训练稳定性 | 0.1-10 |
| GPU 利用率 | 计算效率 | > 85% |

## 5.3 Stage 2：Co-fine-tuning

### 5.3.1 为什么需要 Co-fine-tuning

直接在机器人数据上微调会导致灾难性遗忘——VLM backbone 忘记互联网预训练学到的世界知识。表现为：

- 语义泛化下降：无法理解训练数据中未出现的概念（如"Taylor Swift"）
- 视觉鲁棒性下降：对未见过的背景/光照敏感
- 指令理解变窄：只能理解训练集中的固定表述

### 5.3.2 RT-2 的 Co-fine-tuning 配比

```
Batch = α × B_VLM + (1-α) × B_robot

α = 0.5（推荐）
```

| α 值 | 已知任务 | 零样本泛化 | 语义泛化 |
|------|----------|------------|----------|
| 0.0 | 93% | 12% | 差 |
| 0.25 | 92% | 34% | 中 |
| 0.50 | 91% | 62% | 好 |
| 0.75 | 85% | 71% | 最好 |

### 5.3.3 VLM 数据的选择

Co-fine-tuning 中混合的 VLM 数据不是随机的——它应该覆盖机器人任务中可能遇到的概念：

| 数据类型 | 来源 | 作用 |
|----------|------|------|
| 物体识别 | CC3M/LAION 物体子集 | 保持物体识别能力 |
| 场景理解 | COCO/ADE20K | 保持场景理解 |
| 指令跟随 | LLaVA 训练集 | 保持指令多样性 |
| 空间关系 | Visual Genome | "左边的杯子""桌子上面" |

### 5.3.4 OpenVLA 的简化策略

OpenVLA 为了简化训练流程，**不做 Co-fine-tuning**——仅在机器人数据上微调。代价是语义泛化较弱。这在实践中通常可接受，因为：

1. 大多数工业应用的任务范围固定，不需要互联网级语义泛化
2. Co-fine-tuning 需要维护两套数据管道，增加工程复杂度
3. 任务微调阶段可以通过指令增强部分补偿

## 5.4 Stage 3：任务微调

### 5.4.1 全量微调 vs LoRA

| 方法 | 可训练参数 | 显存需求 | 性能 | 适用场景 |
|------|-----------|----------|------|----------|
| 全量微调 | 100% | 高（7B需~56GB） | 最优 | 有足够GPU资源 |
| LoRA (r=16) | 1.4% | 低（7B需~15GB） | 接近全量 | 生产环境首选 |
| 只调最后层 | <0.1% | 最低 | 差 | 不推荐 |
| 冻结视觉编码器 | ~50% | 中 | 差 | 不推荐 |

OpenVLA 的消融实验结论：
- **LoRA（rank=16）是最佳选择**——仅微调 1.4% 参数，性能匹配全量微调
- 只调最后层或冻结视觉编码器会导致性能严重下降
- LoRA 的优势在于可在单张 RTX 4090 上微调 7B 模型

### 5.4.2 LoRA 微调实现

```python
from peft import LoraConfig, get_peft_model

# 配置 LoRA
lora_config = LoraConfig(
    r=16,  # rank
    lora_alpha=32,
    target_modules=["q_proj", "v_proj", "k_proj", "o_proj",
                    "gate_proj", "up_proj", "down_proj"],
    lora_dropout=0.05,
    bias="none",
    task_type="CAUSAL_LM"
)

# 应用到 VLA 模型
model = get_peft_model(vla_model, lora_config)
# 可训练参数: 1.4% (~98M / 7B)
```

### 5.4.3 GR00T 1.7 的后训练配置

GR00T 1.7 支持选择性冻结——微调视觉主干、投影仪和扩散模型，但保持语言模型冻结：

```bash
uv run python -m torch.distributed.run --nproc_per_node=1 \
  gr00t/experiment/launch_finetune.py \
  --base-model-path nvidia/GR00T-N1.7-3B \
  --dataset-path $DATASET_DIR/lerobot \
  --output-dir $MODELS_DIR/finetune \
  --global-batch-size 12 \
  --max-steps 20000 \
  --num-gpus 1 \
  --save-steps 5000 \
  --no-tune-llm \          # 冻结语言模型
  --tune-visual \           # 微调视觉编码器
  --tune-projector \        # 微调投影层
  --tune-diffusion-model \  # 微调 DiT 动作模块
  --color-jitter-params brightness 0.3 contrast 0.4 saturation 0.5 hue 0.08
```

### 5.4.4 微调数据量需求

| 场景 | 推荐数据量 | 预期效果 |
|------|-----------|----------|
| 新任务（同机器人） | 100-500 条 | 基本可用 |
| 新任务（同机器人） | 1,000-5,000 条 | 生产级 |
| 新机器人实体 | 5,000-50,000 条 | 需配合预训练 |
| 新环境（同任务同机器人） | 200-1,000 条 | 环境泛化 |

## 5.5 训练超参数总览

### 5.5.1 离散 token VLA（OpenVLA 风格）

| 超参 | 预训练 | LoRA 微调 |
|------|--------|-----------|
| 学习率 | 2e-5 | 5e-5 |
| Batch size | 2048 | 32-128 |
| Epochs | ~15 (OXE) | 10-50 |
| Warmup | 1000 steps | 100 steps |
| Decay | Cosine → 0 | Cosine → 0.01×lr |
| Gradient clipping | 1.0 | 1.0 |
| Weight decay | 0.01 | 0.01 |
| Label smoothing | 0.1 | 0.1 |

### 5.5.2 Flow Matching VLA（π0 风格）

| 超参 | 预训练 | 微调 |
|------|--------|------|
| 学习率 | 5e-5 | 2e-5 |
| Batch size | 1024 | 64-256 |
| Steps | ~30K | 5K-10K |
| τ 采样 | Beta(2, 5) | Beta(2, 5) |
| Action chunk H | 50 | 50 |
| Flow steps (推理) | 10 | 10 |
| EMA decay | 0.999 | 0.999 |

### 5.5.3 Diffusion VLA（GR00T 风格）

| 超参 | 预训练 | 后训练 |
|------|--------|--------|
| 学习率 | 1e-4 | 5e-5 |
| Batch size | 512 | 12 |
| Diffusion steps | 100 (训练) | 10 (推理) |
| Noise schedule | Cosine | Cosine |
| 冻结组件 | — | LM |
| 训练步数 | 100K | 20K |

## 5.6 训练常见问题与排查

| 问题 | 症状 | 原因 | 解决方案 |
|------|------|------|----------|
| 灾难性遗忘 | 语义泛化骤降 | 纯机器人数据微调 | Co-fine-tuning α=0.5 |
| 动作抖动 | 输出动作不平滑 | 离散化精度不足 | 改用 Diffusion/Flow |
| OOM | 显存不足 | 序列太长/ batch太大 | FSDP + gradient checkpoint |
| 训练发散 | loss 突然飙升 | 学习率过大 | 降低 lr，增加 warmup |
| 低成功率 | 仿真评估 < 20% | 数据不足/质量差 | 增加数据 + 质量过滤 |
| 推理太慢 | < 5Hz | 自回归7步 / Diffusion50步 | Flow Matching + Action Chunk |

## 5.7 小结

VLA 训练流程的核心要点：

1. **三阶段范式**：VLM 预训练 → VLA 预训练 → 任务微调，与 LLM 的预训练→SFT→RLHF 类比
2. **Co-fine-tuning 是关键**：50% VLM + 50% 机器人数据防止遗忘
3. **LoRA 是生产首选**：1.4% 参数达到全量微调性能，单卡可跑
4. **Flow Matching > Diffusion > 离散 Token**：在频率、精度、多模态三个维度上递进
5. **数据量需求分场景**：同机器人新任务 1K-5K 条；新机器人需 5K-50K + 预训练

下一章将逐一剖析 RT-2、OpenVLA、π0、GR00T N1 四大模型的完整训练细节。
