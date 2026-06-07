---
title: "物联网数据闭环架构设计 - 第5章：VLA/VLX 产品落地——从数据采集到模型部署"
book: "物联网数据闭环架构设计"
chapter: "5"
chapterTitle: "VLA/VLX 产品落地——从数据采集到模型部署"
description: "在亿级物联网设备上落地 VLA/VLX 视觉-语言-动作模型的完整链路：端侧量化推理、云端训练 Pipeline、模型评估与 OTA 灰度发布。新增模型架构详解、分布式训练优化、评估指标体系和完善的部署策略。"
date: "2026-05-31"
updatedAt: "2026-05-31"
agent: "架构师"
tags: ["iot", "vla", "model-deployment", "quantization", "ota", "distributed-training", "evaluation"]
---

# 第5章：VLA/VLX 产品落地——从数据采集到模型部署

## 5.1 VLA 模型选型

### 5.1.1 端侧 vs 云端分工

```
端侧（NPU 100 TOPS）                 云端（1 万张 GPU/NPU 卡）
    │                                      │
    ├── 主 VLA 模型（7B INT4 量化）         ├── 教师模型（13B-70B）
    ├── 实时推理 < 45ms                    ├── 大规模训练 + 蒸馏
    ├── 全帧率分析（30fps 实时处理）        ├── 长尾场景分析
    ├── 结构化特征向量输出                    ├── 新模型训练（FSDP + LoRA）
    └── 仅低置信度样本异步上传              └── 每周模型更新下发
```

**策略**：端侧 100 TOPS NPU 可直接运行 7B 参数量化 VLA 模型，覆盖 90%+ 的实时推理场景。云端 1 万张卡专注于大规模训练、知识蒸馏和长尾困难样本处理。端侧与云端的关系从「轻推理 + 云端全量」转变为 **「端侧做主推理，云端做教练」**。

### 5.1.2 VLA 模型架构详解

#### 端侧主 VLA 模型（7B INT4，100 TOPS NPU）

```
┌──────────────── 端侧 VLA 架构（7B 参数，INT4 量化）─────────────────┐
│                                                          │
│  输入：摄像头帧 (448×448×3) + 语言指令 + 历史动作轨迹    │
│      │                                                   │
│      ▼                                                   │
│  ┌──────────────┐                                       │
│  │  视觉编码器   │  InternViT-300M (300M 参数)          │
│  │  (冻结)      │  → 256 个 patch token (1024-dim)      │
│  └──────┬───────┘                                       │
│         │                                                 │
│         ▼                                                 │
│  ┌──────────────┐                                       │
│  │  投影层      │  MLP (1024 → 4096)                   │
│  │  (可训练)    │                                       │
│  └──────┬───────┘                                       │
│         │                                                 │
│         ▼                                                 │
│  ┌──────────────┐                                       │
│  │  语言主干     │  Qwen3-7B (量化 INT4, 3.5GB 参数)  │
│  │  (LoRA 微调) │  → 指令 + 历史轨迹 embedding            │
│  │  32 层 Transformer                                    │
│  └──────┬───────┘                                       │
│         │  (总计 ~1500 token)                             │
│         ▼                                                 │
│  ┌──────────────┐                                       │
│  │  跨模态融合   │  Cross-Attention (Visual × Language)  │
│  │  (8 层)      │  → 融合特征 (4096-dim)                │
│  └──────┬───────┘                                       │
│         │                                                 │
│         ▼                                                 │
│  ┌──────────────┐                                       │
│  │  动作解码头   │  VLA-Specialized Head                 │
│  │              │  → 离散动作 token (codebook 2048)      │
│  │              │  → 连续动作 [x,y,z,roll,pitch,yaw,grip]│
│  └──────────────┘                                       │
│                                                          │
│  总参数：7.3B（视觉 300M + 语言 7B + 动作头 < 100M）       │
│  量化后：INT4 (~3.5GB) + NPU 100 TOPS 推理 40ms          │
└──────────────────────────────────────────────────────────┘
```

**与 1B 方案的核心差异**：
| 维度 | 1B 方案（旧假设） | 7B 方案（实际，100 TOPS 驱动） |
|:-----|:---------------|:-----------------------------|
| 视觉输入 | 224×224 低分辨率 | 448×448 高分辨率 |
| 视觉编码器 | SigLIP ViT-B (86M) | InternViT-300M (300M) |
| 语言模型 | Qwen3-0.6B | Qwen3-7B |
| 上下文长度 | 128 token | 1500 token（含历史轨迹） |
| 推理延迟 | 35ms | 40ms（稍长但精度大幅提升） |
| 场景理解能力 | 有限（1B 模型知识不足） | 强（7B 模型通识知识丰富） |
| 零样本泛化 | 差 | 好（可利用 7B 预训练知识） |

#### 云端教师模型（13B-70B，1 万卡集群训练）

```
┌────────────────  云端教师模型（70B 参数）─────────────────┐
│                                                          │
│  输入：多视角图像 (3×448×448) + 语言指令 + 历史动作序列   │
│      │                                                   │
│      ▼                                                   │
│  ┌──────────────┐                                       │
│  │  视觉编码器   │  InternViT-6B (6B 参数)              │
│  │  (Full Train) │  → 576 个 patch token × 3 视角       │
│  └──────┬───────┘                                       │
│         │  (1728 visual token)                           │
│         ▼                                                 │
│  ┌──────────────┐                                       │
│  │  语言主干     │  DeepSeek V4 / Qwen3-72B              │
│  │  (Full Fine-tune)                                     │
│  │              │  → 指令 + 历史对话 (1024 token)         │
│  └──────┬───────┘                                       │
│         │  (总计 ~3500 token)                             │
│         ▼                                                 │
│  ┌──────────────┐                                       │
│  │  统一 Transformer │  DeepSeek V4 架构 (MLA + MoE)    │
│  │  (自回归)      │  → 推理轨迹 + 置信度评估              │
│  └──────┬───────┘                                       │
│         │                                                 │
│         ▼                                                 │
│  ┌──────────────┐                                       │
│  │  动作解码器   │  VLA 专用多头解码器                    │
│  │              │  → 离散 action token (codebook 4096)   │
│  │              │  → 连续动作 + 不确定性估计              │
│  └──────────────┘                                       │
│                                                          │
│  总参数：70B+                                            │
│  训练：FSDP (Zero-3) + 4D 并行 (TP+PP+DP+Sequence)      │
│  推理：vLLM + Tensor Parallel (8×A100/张卡)             │
└──────────────────────────────────────────────────────────┘
```

### 5.1.3 模型压缩路线对比

| 压缩技术 | 压缩比 | 精度损失 | 推理加速 | 适用层 | 工具链 |
|:---------|:-----|:---------|:---------|:-----|:---------|
| **4-bit NF4 量化** | 8× | < 2% | 3-5× | 全模型 | bitsandbytes + GPTQ |
| **INT8 量化** | 4× | < 1% | 2-3× | 全模型 | TensorRT / ONXX Runtime |
| **知识蒸馏** (7B→1B) | - | ~5% | - | 训练阶段 | Hugging Face Distilbert |
| **结构化剪枝** | 1.5-2× | 3-8% | 1.5-2× | FFN 层 | Torch Pruning |
| **LoRA 微调** | - | < 1% | - | 适配阶段 | PEFT Library |
| **MTP** (Multi-Token Prediction) | - | - | 2-3× | 推理阶段 | DeepSeek V3 方案 |

**推荐组合（端侧部署 7B → INT4）**：
1. **训练时**：云端教师模型（13B-70B）→ 端侧学生模型（7B），知识蒸馏 + LoRA 微调
2. **推理时**：4-bit NF4 量化 + 硬件稀疏化（2:4 sparse，2× 加速）

## 5.2 训练 Pipeline

### 5.2.1 数据准备 Pipeline

```
数据湖 Iceberg
    │
    ├── 自动筛选（场景多样性 + 困难样本挖掘）
    │   ├── 聚类（K-means on VLA embedding）→ 均匀采样
    │   └── 置信度过滤（confidence < 0.7）→ 困难样本
    ├── 自动标注（Gemini 2.5 Flash API）
    │   ├── Prompt: "描述图像中机器人的动作和意图"
    │   ├── 输出：结构化标注 JSON
    │   └── 人工校验（抽样 5%）
    ├── 数据增强（合成数据）
    │   ├── 背景替换（Copper来增强）
    │   ├── 域随机化（Domain Randomization）
    │   └── 对抗样本生成
    └── 训练数据集导出（Spark → WebDataset）
        ├── 格式：Tar 包（每个 1GB，含图像 + JSON）
        └── 索引：CSV（样本路径 + 标签）
```

**困难样本挖掘策略**：
- 端侧 VLA 推理置信度 < 0.7 的样本 → 优先上传
- 场景聚类（K-means on ViT embedding）→ 每个聚类中心保留最多 1000 条
- 时序异常检测（Isolation Forest）→ 保存异常片段
- **效果**：从 450 PB → 50 TB 训练集，**压缩比 9,000:1**

### 5.2.2 分布式训练架构

#### FSDP（Fully Sharded Data Parallel）

```python
# train_fsdp.py - PyTorch FSDP 训练脚本
import torch
from torch.distributed.fsdp import FullyShardedDataParallel as FSDP
from torch.distributed.fsdp.wrap import transformer_auto_wrap_policy
from transformers import Qwen2ForCausalLM, Qwen2Config

# 1. 模型初始化（在 CPU 上，避免 OOM）
config = Qwen2Config.from_pretrained("Qwen/Qwen3-1B")
model = Qwen2ForCausalLM(config)

# 2. FSDP 包装策略（按 Transformer Layer 分片）
auto_wrap_policy = functools.partial(
    transformer_auto_wrap_policy,
    transformer_layer_cls={Qwen2DecoderLayer}  # 每个 Decoder Layer 独立分片
)

# 3. FSDP 包装
model = FSDP(
    model,
    sharding_strategy=torch.distributed.fsdp.api.ShardingStrategy.FULL_SHARD,  # ZeRO-3
    cpu_offload=torch.distributed.fsdp.api.CpuOffload(offload_params=True),  # CPU offload（省显存）
    auto_wrap_policy=auto_wrap_policy,
    mixed_precision=torch.distributed.fsdp.api.MixedPrecision(
        param_dtype=torch.bfloat16,  # 参数 bfloat16
        reduce_dtype=torch.float32,     # Gradient 全精度（精度保证）
        buffer_dtype=torch.bfloat16
    ),
    device_id=torch.cuda.current_device()
)

# 4. 优化器（每 GPU 局部参数）
optimizer = torch.optim.AdamW(
    model.parameters(),
    lr=2e-5,
    betas=(0.9, 0.95),
    weight_decay=0.1
)

# 5. 训练循环
for batch in dataloader:
    outputs = model(**batch)
    loss = outputs.loss
    loss.backward()
    optimizer.step()
    optimizer.zero_grad()
```

**FSDP 优势**：
- **显存占用**：Model (4GB) + Gradients (4GB) + Optimizer (8GB) = 16GB/GPU（vs DDP 48GB/GPU）
- **通信开销**：All-Gather (参数收集) + Reduce-Scatter (梯度归约) = 每个 step ~20GB 通信
- **适用场景**：模型 1B-70B，GPU 数 8-512

#### Gradient Checkpointing（梯度检查点）

```python
# 启用梯度检查点（以时间换空间）
from torch.utils.checkpoint import checkpoint

# 在 forward 中手动插入 checkpoint
def forward(self, hidden_states):
    # Layer 1-16: checkpoint（不存激活值）
    for layer in self.layers[:16]:
        hidden_states = checkpoint(layer, hidden_states)
    
    # Layer 17-32: 正常前向（存激活值，用于反向）
    for layer in self.layers[16:]:
        hidden_states = layer(hidden_states)
    
    return hidden_states

# 效果：激活值显存 48GB → 12GB（4× 节省），训练速度 -15%
```

#### Mixed Precision（混合精度训练）

```python
# bfloat16 vs float16 对比
| 数据类型 | 范围 | 精度 | 溢出风险 | 推荐场景 |
|:---------|:-----|:-----|:---------|:---------|
| float32 | 全 | 全 | 无 | 主权重（Master Weights） |
| float16 | 小 | 中 | 高（梯度爆炸） | 不推荐（用 bfloat16） |
| bfloat16 | 同 float32 | 低 | 低（指数位同 float32） | ✅ 推荐（A100/H100） |
| fp8 (e4m3) | 更小 | 更低 | 中 | H100 + Transformer Engine |

# PyTorch 实现
scaler = torch.cuda.amp.GradScaler()  # float16 需要 GradScaler（防止 underflow）
# bfloat16 无需 GradScaler！
with torch.autocast(device_type='cuda', dtype=torch.bfloat16):
    outputs = model(inputs)
    loss = outputs.loss

loss.backward()
optimizer.step()
```

### 5.2.3 训练监控（Weights & Biases）

```python
import wandb

# 初始化 W&B
wandb.init(
    project="vla-training",
    name="v2.3.1-distilled",
    config={
        "model": "Qwen3-1B",
        "method": "knowledge_distillation",
        "teacher": "Qwen3-7B",
        "lr": 2e-5,
        "batch_size": 128,
        "num_gpus": 64
    }
)

# 训练循环中记录指标
for epoch in range(num_epochs):
    for batch in dataloader:
        loss = model(**batch).loss
        
        wandb.log({
            "train/loss": loss.item(),
            "train/lr": optimizer.param_groups[0]['lr'],
            "train/grad_norm": torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0),
            "train/gpu_memory": torch.cuda.max_memory_allocated() / 1e9
        })
        
        loss.backward()
        optimizer.step()
        
        if step % 100 == 0:
            # 评估
            eval_loss = evaluate(model, eval_dataloader)
            wandb.log({"eval/loss": eval_loss})
            
            # 生成样本可视化
            sample_output = model.generate(sample_input)
            wandb.log({"eval/sample": wandb.Image(sample_output)})
```

**监控指标**：
| 指标 | 目标 | 告警阈值 |
|:-----|:-----|:---------|
| training_loss | 下降 | 连续 3 个 epoch 不降 → 学习率衰减 |
| grad_norm | < 1.0 | > 10.0 → 梯度爆炸 |
| gpu_memory | < 80% | > 95% → OOM 风险 |
| samples_per_second | > 100 | < 50 → 数据加载瓶颈 |
| eval/loss | 下降 | 上升 → 过拟合 |

### 5.2.4 训练成本优化（1 万卡总量约束）

**显存/算力约束**：云上总卡数 1 万张，需要在训练和推理之间动态分配。

```
┌──────────────── 1 万张卡资源分配（典型配置）──────────────────┐
│                                                          │
│  训练：6,000 张卡（60%）        推理：4,000 张卡（40%）     │
│  ┌────────────────────┐        ┌────────────────────┐    │
│  │ 大版本训练 4,000   │        │ 云端推理服务 2,000  │    │
│  │ 蒸馏/增量 1,500   │        │ 端侧备份回退 1,000  │    │
│  │ 实验探索 500       │        │ 动态弹性扩容 1,000  │    │
│  └────────────────────┘        └────────────────────┘    │
└──────────────────────────────────────────────────────────┘
```

| 训练场景 | GPU 数 | 时长 | 成本（按需） | 成本（Spot） | 占总卡比例 |
|:---------|:-------|:-----|:-----------|:-----------|:---------|
| 端侧 VLA 微调（7B LoRA） | 128×A100 | 6h | ~$3,600 | ~$1,080 | 1.28% |
| 知识蒸馏（教师 70B → 学生 7B） | 512×A100 | 48h | ~$96,000 | ~$28,800 | 5.12% |
| 云端教师训练（70B 增量） | 2,048×A100 | 120h | ~$960,000 | ~$288,000 | 20.48% |
| 每周迭代（LoRA 微调） | 128×A100 | 8h | ~$4,800 | ~$1,440 | 1.28% |
| 月度大版本（蒸馏+微调） | 2,048×A100 | 72h | ~$576,000 | ~$172,800 | 20.48% |

**成本优化技巧**：
1. **Gradient Accumulation**：模拟大 batch（64 GPU × 16 accumulation = 等效 batch 1024）
2. **CPU Offload**：优化器状态放 CPU（省显存 50%）
3. **Selective Recomputation**：仅重计算瓶颈层（省时间 30%）
4. **FP8 Training**（H100）：计算速度 2×，显存 50%

## 5.3 端侧部署

### 5.3.1 OTA 模型下发（完整流程）

```
┌──────────┐    ┌──────────┐    ┌──────────┐
│ 模型仓库   │───→│ OTA 服务  │───→│ 设备端   │
│ (S3)     │    │ (控制面) │    │ (NPU)   │
└──────────┘    └──────────┘    └──────────┘
                     │                  │
              ┌──────┴──────┐              │
              ▼             ▼              │
         灰度 1%        继续评估          设备下载
       （内部测试）     （24h 无异常）    （P2P + CDN）
              │              │              │
              ▼              ▼              ▼
         灰度 10%        继续评估        刷写固件
       （自愿用户）      （48h 无异常）    （A/B 分区）
              │              │              │
              ▼              ▼              ▼
         灰度 50%        继续评估        重启生效
       （特定区域）      （72h 无异常）    （回滚准备）
              │              │              │
              ▼              ▼              ▼
         全量 100%       完成          清理旧版本
       （全球设备）                     （保留 1 个旧版）
```

**OTA 灰度策略详解**：

| 阶段 | 目标设备 | 时长 | 监控指标 | 通过条件 | 回滚触发 |
|:-----|:-------|:-----|:---------|:---------|:---------|
| **Canary 1%** | 内部测试设备（员工） | 24h | 崩溃率 < 0.1% | ✅ 无 P0 bug | 崩溃率 > 1% |
| **Ring 10%** | 自愿升级用户（Beta 用户） | 48h | 任务成功率 > 95% | ✅ 无回归 | 成功率 < 90% |
| **Ring 50%** | 特定区域（如 us-east-1） | 72h | 用户投诉 < 10/天 | ✅ NPS > 0 | 投诉 > 50/天 |
| **全量 100%** | 所有设备 | 24h（逐步扩量） | 系统稳定性 99.9% | ✅ 无异常 | 稳定性 < 99% |

**P2P 分发优化**：
```
传统 OTA：1M 设备 × 3.5GB 模型（7B INT4）= 3.5PB 下载 = 网络拥塞

P2P OTA（BitTorrent 协议 + 增量更新）：
  1. 首次全量：从 S3 CDN + 局域网 P2P 下载 3.5GB 模型
  2. 后续增量更新：仅下载参数差异（每周 ~200-500MB）
  3. 分片管理：每片 4MB，P2P 节点互相补全
  4. 版本兼容：端侧保留 2 个版本，下载失败自动切换
  
效果：CDN 流量减少 80%，下载速度提升 5×，增量更新省带宽 85%
```

> **与 1B 模型 OTA 对比**：7B INT4 模型 3.5GB 比 1B 模型的 520MB 大 7 倍。为此，增量更新（Delta OTA）和 P2P 分发变得至关重要。

### 5.3.2 端侧推理引擎选型（7B INT4）

| 框架 | 适用硬件 | 7B INT4 延迟 | 量化支持 | 性能 | 推荐场景 |
|:-----|:---------|:------------|:---------|:-----|:---------|
| **llama.cpp** | CPU（ARM/x86） | 80-150ms | GGUF (Q4/Q5/Q8) | ⭐⭐⭐⭐ | 树莓派 / 低端设备 |
| **ONNX Runtime** | NPU/GPU | **30-50ms** ✅ | INT4/INT8/FP16 | ⭐⭐⭐⭐⭐ | ✅ **推荐**（自研 100 TOPS NPU） |
| **MLC-LLM** | 通用（编译优化） | 40-60ms | Q4F16_2 | ⭐⭐⭐⭐ | 跨平台部署 |
| **自研 NPU Runtime** | 自研 100 TOPS NPU | **< 40ms** | 定制 NF4 + 2:4 稀疏 | ⭐⭐⭐⭐⭐ | 亿级量产（< $0.01/设备） |

**关键考量**：7B INT4 模型约 3.5GB 参数，需至少 8GB 内存用于推理。100 TOPS NPU + 16GB LPDDR5X 可以胜任。

**ONNX Runtime 部署示例（7B 模型）**：

```python
# 1. PyTorch 7B 模型 → ONNX
import torch
from transformers import AutoModelForCausalLM

# 加载 7B 模型（需要至少 16GB 显存）
model = AutoModelForCausalLM.from_pretrained(
    "Qwen/Qwen3-7B",
    torch_dtype=torch.bfloat16,
    device_map="auto"
)

# 导出 ONNX（带动态 batch）
from torch.onnx import export
dummy_input = torch.randint(0, 151936, (1, 256))  # 7B 词汇表 151936

export(
    model,
    (dummy_input,),
    "qwen3-7b.onnx",
    input_names=["input_ids"],
    output_names=["logits"],
    dynamic_axes={"input_ids": {0: "batch", 1: "sequence"}},
    opset_version=17
)

# 2. INT4 量化（NF4 格式）
from onnxruntime.quantization import quantize_dynamic, QuantType

quantize_dynamic(
    "qwen3-7b.onnx",
    "qwen3-7b-int4.onnx",
    weight_type=QuantType.QUInt4x4  # INT4 量化
)

# 3. 端侧推理（NPU）
import onnxruntime as ort

# 100 TOPS NPU 执行器
session = ort.InferenceSession(
    "qwen3-7b-int4.onnx",
    providers=[("NPUExecutionProvider", {"device_id": 0, "npu_tops": 100})]
)

input_ids = np.array([[1, 123, 456, ...]])  # Tokenized input (256 tokens)
logits = session.run(None, {"input_ids": input_ids})[0]
# 输出 shape: (1, 256, 151936)
```

## 5.4 模型评估框架

### 5.4.1 离线评估指标

| 指标 | 定义 | 计算方法 | 目标值 | 用途 |
|:-----|:-----|:---------|:-------|:-----|
| **Perplexity** | 语言模型困惑度 | exp(cross_entropy_loss) | < 10（1B 模型） | 预训练质量 |
| **BLEU-4** | 生成文本与参考的 n-gram 重叠 | NLTK corpus_bleu | > 0.35 | 指令跟随质量 |
| **Success Rate** | 任务完成率 | 执行轨迹达到目标状态的比例 | > 85% | VLA 核心指标 |
| **Trajectory Length** | 完成任务的平均步数 | 平均步数 | < 50 步 | 效率指标 |
| **Collision Rate** | 碰撞率 | 碰撞次数 / 总步数 | < 1% | 安全指标 |

**离线评估 Pipeline**：

```python
# offline_evaluation.py
from transformers import AutoModelForCausalLM
from datasets import load_dataset
import torch

def evaluate_vla(model_path, eval_dataset):
    model = AutoModelForCausalLM.from_pretrained(model_path)
    dataset = load_dataset("iot-vla-bench", split=eval_dataset)
    
    results = {
        "success_rate": [],
        "trajectory_length": [],
        "collision_rate": []
    }
    
    for sample in dataset:
        # 1. 模型推理
        observation = sample["observation"]  # 图像
        instruction = sample["instruction"]  # 语言指令
        
        with torch.no_grad():
            action = model.generate(
                observation,
                instruction,
                max_new_tokens=256,
                do_sample=True,
                temperature=0.7
            )
        
        # 2. 在仿真环境中执行动作
        from robot_sim import RobotSimulator
        sim = RobotSimulator(sample["environment"])
        trajectory = sim.rollout(action)
        
        # 3. 计算指标
        success = sim.check_success(trajectory)
        results["success_rate"].append(float(success))
        results["trajectory_length"].append(len(trajectory))
        results["collision_rate"].append(sim.count_collisions(trajectory))
    
    # 4. 汇总
    return {
        "success_rate": sum(results["success_rate"]) / len(results["success_rate"]),
        "avg_trajectory_length": sum(results["trajectory_length"]) / len(results["trajectory_length"]),
        "collision_rate": sum(results["collision_rate"]) / sum(results["trajectory_length"])
    }

# 执行
metrics = evaluate_vla("qwen3-1b-v2.3.1", "iot-vla-bench-v2")
print(f"Success Rate: {metrics['success_rate']:.2%}")
print(f"Avg Trajectory Length: {metrics['avg_trajectory_length']:.1f}")
print(f"Collision Rate: {metrics['collision_rate']:.2%}")
```

### 5.4.2 在线 A/B 测试框架

#### A/B 测试架构

```
用户设备 ──→ OTA 服务 (获取实验分组)
                │
         ┌──────┴──────┐
         ▼              ▼
     模型 A（对照组）  模型 B（实验组）
   (v2.2.0, 95%)   (v2.3.1, 5%)
         │              │
         ▼              ▼
     数据上报 ──→ 离线分析 (Spark + Iceberg)
                      │
                 ┌────┴────┐
                 ▼         ▼
             模型 A 胜   模型 B 胜
        (流量 100%)   (流量扩到 10%)
```

**分组策略（Consistent Hashing）**：

```python
# ab_testing.py - 设备分组逻辑（在 OTA 服务端执行）
import hashlib

def get_ab_group(device_id: str, experiment_id: str) -> str:
    """
    根据 device_id 和 experiment_id 计算分组。
    保证同一设备始终分到同一组（Consistent Hashing）。
    """
    hash_input = f"{device_id}:{experiment_id}".encode()
    hash_value = int(hashlib.md5(hash_input).hexdigest(), 16)
    
    # 按百分比分配（本例：5% 实验组，95% 对照组）
    if hash_value % 100 < 5:
        return "experiment"  # 实验组（模型 B）
    else:
        return "control"     # 对照组（模型 A）

# OTA 服务端调用
experiment_id = "exp-v2.3.1-canary"
group = get_ab_group(device_id="abc123", experiment_id=experiment_id)

if group == "experiment":
    model_version = "v2.3.1"  # 新版本
else:
    model_version = "v2.2.0"  # 旧版本

# 返回 OTA 配置
response = {
    "model_version": model_version,
    "model_url": f"s3://iot-firmware/{model_version}.onnx",
    "ab_group": group
}
```

#### 在线指标监控

| 指标 | 定义 | 目标 | 告警 |
|:-----|:-----|:-----|:-----|
| **Task Success Rate** | 用户任务完成率 | > 90% | < 85% |
| **Latency P50/P95** | 端到端延迟 | < 50ms / < 100ms | > 100ms / > 200ms |
| **Crash Rate** | OOM / 崩溃率 | < 0.1% | > 1% |
| **User Feedback Rate** | 用户主动反馈（点赞/点踩） | 点踩 < 5% | 点踩 > 10% |
| **Data Efficiency** | 每千帧有效样本数 | > 50 | < 30 |

**实时监控 Dashboard（Grafana）**：

```yaml
# grafana-dashboard-ab-testing.json (节选)
panels:
  - title: "Task Success Rate by Model Version"
    targets:
      - expr: |
          sum(rate(iot_task_success_total[5m])) by (model_version)
          /
          sum(rate(iot_task_total[5m])) by (model_version)
    type: "timeseries"
    
  - title: "Latency P95 by Model Version"
    targets:
      - expr: |
          histogram_quantile(0.95, 
            sum(rate(iot_inference_latency_seconds_bucket[5m])) by (model_version, le)
          )
    type: "heatmap"
    
  - title: "Crash Rate (Alert)"
    targets:
      - expr: |
          sum(rate(iot_crash_total[5m])) by (model_version)
          /
          sum(rate(iot_task_total[5m])) by (model_version)
    type: "stat"
    thresholds:
      - value: 0.001  # 0.1%
        color: "green"
      - value: 0.01   # 1%
        color: "red"
```

## 5.5 模型注册与版本管理

### 5.5.1 Model Registry（MLflow）

```python
import mlflow
import mlflow.pytorch

# 1. 训练完成后注册模型
mlflow.set_tracking_uri("http://mlflow.iot-platform.com:5000")
mlflow.set_experiment("/iot/vla-training")

with mlflow.start_run(run_name="v2.3.1-distilled"):
    # 记录参数
    mlflow.log_params({
        "model": "Qwen3-1B",
        "teacher": "Qwen3-7B",
        "lr": 2e-5,
        "batch_size": 128
    })
    
    # 记录指标
    mlflow.log_metrics({
        "train_loss": 0.35,
        "eval/success_rate": 0.87,
        "eval/perplexity": 8.2
    })
    
    # 记录模型文件
    mlflow.pytorch.log_model(
        model,
        "model",
        registered_model_name="iot-vla-lite"
    )
    
    # 记录 ONNX 版本（用于部署）
    mlflow.onnx.log_model(
        onnx_model,
        "onnx_model",
        registered_model_name="iot-vla-lite-onnx"
    )

# 2. 模型版本管理（MLflow UI 或 API）
from mlflow.tracking import MlflowClient

client = MlflowClient()
model_version = client.get_latest_versions("iot-vla-lite", stages=["None"])[0]

# 过渡到 Staging
client.transition_model_version_stage(
    name="iot-vla-lite",
    version=model_version.version,
    stage="Staging"
)

# 3. 添加注释
client.update_model_version(
    name="iot-vla-lite",
    version=model_version.version,
    description="V2.3.1 蒸馏版本，Success Rate 87%，适合端侧部署"
)
```

### 5.5.2 模型版本生命周期

```
Model Version State Machine:

None (刚注册)
    │
    ▼
Staging (预发布验证)
    │  - 在 staging 环境测试 24h
    │  - 离线评估 + 小规模 A/B
    ▼
Production (生产)
    │  - OTA 全量发布
    │  - 监控 7 天
    ▼
Archived (归档)
    │  - 保留模型文件（可回滚）
    │  - 从生产列表移除
    ▼
Deleted (删除)
    - 永久删除（合规要求保留 7 年？）
```

## 5.6 本章小结

本章设计了 VLA/VLX 产品从端侧推理到云端训练再到 OTA 下发的完整链路：

**模型架构**：
- **端侧主模型（7B INT4）**：InternViT-300M + Qwen3-7B + 动作头，量化后 3.5GB，100 TOPS NPU 推理 40ms
- **云端教师模型（13B-70B）**：InternViT-6B + DeepSeek V4 72B / Qwen3-72B，1 万卡集群训练

**训练资源**：
- **分配策略**：训练 60%（6,000 卡）+ 推理 40%（4,000 卡），动态切换
- **蒸馏**：教师 70B → 学生 7B，512×A100 × 48h
- **周更新**：LoRA 微调，128×A100 × 8h

**端侧部署**：
- **OTA 流程**：Canary 1% → Ring 10% → Ring 50% → 全量 100%（共 7 天）
- **增量更新**：Delta OTA（每周 200-500MB，省 85% 带宽）
- **推理引擎**：自研 NPU Runtime（100 TOPS）+ ONNX Runtime（备选）

**评估框架**：
- **离线指标**：Success Rate > 85% + Perplexity < 10 + Collision Rate < 1%
- **在线 A/B**：Consistent Hashing 分组 + 5 项核心指标实时监控
- **模型注册**：MLflow Model Registry + 版本状态机（None→Staging→Production→Archived）

下一章讨论数据闭环飞轮的核心机制——如何让数据自动驱动模型持续提升，实现从 450 PB 原始数据到 50 TB 训练集的 9,000:1 压缩比。
