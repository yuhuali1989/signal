---
title: "自动驾驶大模型深度研究 - 第5章: VLA 模型架构：从模块化到端到端"
book: "自动驾驶大模型深度研究"
chapter: "5"
chapterTitle: "VLA 模型架构：从模块化到端到端"
description: "全面解析 Vision-Language-Action 如何重塑自动驾驶技术栈"
date: "2026-04-11"
updatedAt: "2026-04-14 11:00"
agent: "研究员→编辑→审校员"
tags:
  - "自动驾驶"
  - "VLA"
  - "端到端"
  - "世界模型"
type: "book"
---

# 第 5 章：VLA 模型架构——从模块化到端到端

> 选自《自动驾驶大模型深度研究》

## 5.1 架构范式演进

自动驾驶系统的架构经历了三代演进：

| 代际 | 架构 | 代表系统 | 核心特点 |
|------|------|---------|---------|
| **第一代** | 模块化流水线 | Apollo 5.0 / Autoware | 感知→预测→规划→控制，模块间接口明确 |
| **第二代** | 部分端到端 | UniAD / VAD | 用统一 Transformer 连接多个模块，梯度端到端 |
| **第三代** | VLA 端到端 | DriveVLA / RT-2-Drive | 视觉-语言-动作一体化，直接从传感器到控制 |

**关键转折点**：2025 年 Tesla FSD v13 首次在量产车上部署"感知到控制"的端到端架构，证明了大规模数据 + 大模型的可行性。

## 5.2 VLA (Vision-Language-Action) 架构

### 5.2.1 核心思想

VLA 将自动驾驶建模为一个多模态序列生成问题：

```
输入: [图像序列] + [导航指令/语言] + [车辆状态]
输出: [动作序列] (轨迹点/方向盘角度/油门刹车)
```

### 5.2.2 主流 VLA 架构

**1. OpenDriveVLA (2025)**

```python
class OpenDriveVLA(nn.Module):
    """基于开源 LLM 的端到端 VLA"""
    def __init__(self):
        self.vision_encoder = ViT_L_14()        # CLIP 视觉编码
        self.projector = MLPProjector(1024, 4096) # 视觉→语言空间映射
        self.llm = Qwen2_7B()                    # 语言模型骨干
        self.action_head = ActionTokenizer(       # 动作离散化
            vocab_size=256,
            trajectory_points=10
        )
    
    def forward(self, images, nav_instruction, ego_state):
        # 1. 多视角图像编码
        vis_tokens = self.vision_encoder(images)      # [B, N_cam, L, D]
        vis_embeds = self.projector(vis_tokens)        # 投影到 LLM 空间
        
        # 2. 构造多模态序列
        text_embeds = self.llm.embed(nav_instruction)  # 指令嵌入
        ego_embeds = self.encode_ego(ego_state)         # 车辆状态嵌入
        
        # 3. LLM 推理 + 动作生成
        combined = torch.cat([vis_embeds, text_embeds, ego_embeds], dim=1)
        hidden = self.llm(combined)
        
        # 4. 解码轨迹
        trajectory = self.action_head(hidden[:, -10:])  # 未来 3 秒轨迹点
        return trajectory
```

**2. DriveWorld-VLA (2026, arXiv:2602.06521)**

核心创新：**潜在空间统一世界模型与 VLA**

```
DriveWorld-VLA 流水线:
┌────────────┐    ┌─────────────────┐    ┌──────────────┐
│ 多视角图像  │ →  │  潜在世界模型     │ →  │  VLA 策略头   │
│ + LiDAR    │    │  (预测未来状态)   │    │  (生成动作)   │
└────────────┘    └─────────────────┘    └──────────────┘
                         ↓
                  ┌─────────────────┐
                  │ 世界模型生成环境  │ → RL 后训练 VLA
                  │ (合成难例数据)   │
                  └─────────────────┘
```

关键技术：
- **Latent CoT**：在潜在空间进行 Chain-of-Thought 推理，替代文本 CoT，推理速度提升 5x
- **World Model as Gym**：世界模型作为 RL 训练环境，为 VLA 生成无限训练场景
- **Data Scaling Amplification**：证明世界模型可以将有限真实数据的价值放大 10-50 倍

### 5.2.3 VLA 架构对比

| 模型 | 视觉编码 | LLM 骨干 | 动作空间 | nuScenes NDS | 特色 |
|------|---------|---------|---------|:---:|------|
| OpenDriveVLA | CLIP ViT-L | Qwen2-7B | 离散 token | 68.4 | 开源可复现 |
| DriveVLA-W0 | DINOv2 | LLaMA-3-8B | 连续回归 | 71.2 | 世界模型后训练 |
| DriveWorld-VLA | BEVFormer | 自研 3B | 潜在空间 | **73.8** | Latent CoT |
| RT-2-Drive | PaLI-X | PaLM-E 12B | 离散 token | 70.1 | Google 多模态 |
| FSD v13 | HydraNet | 自研 ~5B | 连续回归 | N/A (内部) | 量产部署 |

## 5.3 BEV (Bird's-Eye View) 感知范式

### 5.3.1 从 2D 到 BEV 的跃迁

BEV 感知将多视角 2D 图像统一到鸟瞰视角的 3D 空间中：

```python
class BEVFormerLayer(nn.Module):
    """BEV 特征提取核心层"""
    def __init__(self, d_model=256, n_heads=8, bev_h=200, bev_w=200):
        self.spatial_cross_attn = DeformableAttention(d_model, n_heads)
        self.temporal_self_attn = nn.MultiheadAttention(d_model, n_heads)
        self.bev_queries = nn.Parameter(torch.randn(bev_h * bev_w, d_model))
    
    def forward(self, multi_cam_features, prev_bev=None):
        """
        multi_cam_features: 6 个相机的特征图 [B, 6, H, W, C]
        prev_bev: 上一帧 BEV 特征 (时序融合)
        """
        # 1. 空间交叉注意力: BEV queries ← 多视角图像特征
        bev = self.spatial_cross_attn(
            query=self.bev_queries,
            key=multi_cam_features,
            reference_points=self.get_3d_ref_points()  # 3D 参考点投影
        )
        
        # 2. 时序自注意力: 融合历史 BEV
        if prev_bev is not None:
            bev = self.temporal_self_attn(bev, prev_bev, prev_bev)
        
        return bev  # [B, H*W, C] → reshape 为 [B, C, H, W]
```

### 5.3.2 占用网络 (Occupancy Network)

占用网络将 BEV 扩展为 3D 体素空间，解决不规则障碍物的表示问题：

```
3D Occupancy Grid:
┌──────────────────┐
│  X: 200 格 (前后) │
│  Y: 200 格 (左右) │  → 每格分辨率: 0.5m
│  Z: 16  格 (上下) │  → 总计 640K 体素
│  每体素: 类别 ID   │
└──────────────────┘

优势:
- 表示任意形状障碍物 (不限于 3D box)
- 可处理施工锥桶、翻倒车辆等长尾目标
- Tesla FSD v12+ 已在量产中使用
```

## 5.4 端到端架构的统一框架

### 5.4.1 UniAD 架构解析

UniAD (2023) 是首个被广泛认可的统一端到端框架：

```
感知 → 预测 → 规划 (全流程可微)

┌─────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│ BEV 编码 │→│ 目标检测  │→│ 轨迹预测  │→│ 规划网络  │
│ (Track) │   │ + 跟踪   │   │ (Motion) │   │ (Plan)   │
└─────────┘   └──────────┘   └──────────┘   └──────────┘
                   ↕               ↕
              ┌──────────┐   ┌──────────┐
              │ 地图分割  │   │ 占用预测  │
              │ (Map)    │   │ (Occ)    │
              └──────────┘   └──────────┘
```

### 5.4.2 从 UniAD 到 VLA 的演进

```
UniAD (2023):    显式模块 + 端到端梯度
  ↓
VAD (2024):      向量化表示 + 更紧凑的模块
  ↓
SparseDrive (2025): 稀疏表示 + 推理加速
  ↓
DriveWorld-VLA (2026): 潜在空间 + 语言理解 + 世界模型
```

## 5.5 模型部署与推理优化

### 5.5.1 车端部署约束

| 平台 | 算力 | 功耗 | 典型场景 | 量产车型 |
|------|------|------|---------|---------|
| NVIDIA Orin | 254 TOPS | 60W | L2+ (量产主流) | 理想 L9/蔚来 ET7 |
| NVIDIA Thor | 2000 TOPS | 100W | L4 (下一代) | 2027 预期量产 |
| 华为 MDC 810 | 400 TOPS | 100W | 国内 L4 方案 | 极狐 αS HI |
| 地平线 J6E | 560 TOPS | 45W | 高性价比 L2+ | 理想 L6/比亚迪 |
| Mobileye EyeQ Ultra | 176 TOPS | 35W | 纯视觉 L2+ | 极氪 001/宝马 |

### 5.5.2 量产案例：Horizon SuperDrive 2.0

2026 年 4 月地平线发布的 SuperDrive 2.0 是首个量产 L3 城市 NOA 系统，基于端到端 VLA 架构：

```
SuperDrive 2.0 技术栈:
┌────────────────────────────────────────────────────┐
│                  Journey 6E SoC (560 TOPS)          │
├────────────────────────────────────────────────────┤
│  传感器输入:                                         │
│    11 相机 (8M×2 + 5M×3 + 2M×6)                     │
│    1 LiDAR (128线, 可选)                             │
│    5 毫米波雷达                                       │
│            ↓                                         │
│  ┌──────────────────────────────────────────────┐   │
│  │ VLA-Drive 3B (端到端)                          │   │
│  │  ViT-L 视觉编码 → BEV 融合 → LLM 3B 推理      │   │
│  │  → Diffusion Action Head (轨迹生成)             │   │
│  │  延迟: 68ms (INT8量化 + Token剪枝)              │   │
│  └──────────────────────────────────────────────┘   │
│            ↓                                         │
│  控制输出: 10Hz 轨迹点 (3s horizon, 30 waypoints)    │
│  安全兜底: RSS (Responsibility-Sensitive Safety)      │
└────────────────────────────────────────────────────┘

量产指标:
  城区接管率: 0.3 次/百公里 (行业平均 2.1 次)
  覆盖城市: 300+ (无图 NOA)
  OTA 更新: 2 周一次模型迭代
```

### 5.5.3 推理优化技术栈

```python
# VLA 模型量化部署示例
import tensorrt as trt

class VLADeployer:
    """VLA 模型 TensorRT 部署"""
    def __init__(self, onnx_path):
        self.engine = self.build_engine(onnx_path)
    
    def build_engine(self, onnx_path):
        builder = trt.Builder(trt.Logger(trt.Logger.WARNING))
        config = builder.create_builder_config()
        
        # INT8 量化 (视觉编码器) + FP16 (LLM 骨干)
        config.set_flag(trt.BuilderFlag.INT8)
        config.set_flag(trt.BuilderFlag.FP16)
        
        # 动态 batch + 序列长度
        profile = builder.create_optimization_profile()
        profile.set_shape("images", (1,6,3,480,640), (1,6,3,480,640), (1,6,3,480,640))
        profile.set_shape("instruction", (1,1), (1,64), (1,256))
        
        return builder.build_engine(network, config)
    
    def infer(self, images, instruction):
        """推理延迟目标: < 100ms @ Orin"""
        # ... TensorRT 推理流程
        pass
```

关键优化策略：
1. **视觉编码器量化**：INT8 量化减少 4x 计算量，精度损失 < 0.3 NDS
2. **KV Cache 优化**：VLA 的 LLM 部分使用 PagedAttention 管理长上下文
3. **Token 剪枝**：动态裁剪不重要的视觉 token，减少 40% 计算量
4. **模型蒸馏**：大模型 (12B) → 部署模型 (3B)，知识蒸馏保留 95% 性能
5. **Speculative Decoding**：小模型草稿 + VLA 验证，动作生成延迟降低 40%

## 5.6 VLA 训练数据工程

### 5.6.1 数据管线架构

VLA 模型的数据需求远超传统感知模型，需要构建系统化的数据工程管线：

```python
class VLADataPipeline:
    """VLA 训练数据管线"""
    
    # 数据源及规模
    DATA_SOURCES = {
        "real_driving":    "2000 万英里车队采集数据",
        "world_model_sim": "5000 万帧世界模型合成数据",
        "corner_case_gen":  "100 万帧长尾场景（对抗生成）",
        "language_pairs":   "500 万条 <场景, 语言描述> 对",
    }
    
    def __init__(self):
        self.cleaner = DataCleaner(
            dedup_threshold=0.95,    # 场景去重
            quality_score_min=0.7,   # 质量过滤
            balance_strategy="sqrt"  # 场景平衡采样
        )
        self.augmentor = SceneAugmentor(
            weather=["rain", "snow", "fog", "night"],
            traffic_density=["sparse", "normal", "congested"],
            road_type=["highway", "urban", "parking"]
        )
    
    def process(self, raw_data):
        # 1. 清洗去重
        cleaned = self.cleaner.run(raw_data)
        # 2. 场景增强
        augmented = self.augmentor.augment(cleaned, factor=5)
        # 3. 语言标注（自动 + 人工审核）
        labeled = self.auto_label(augmented)
        # 4. 数据混合（真实:合成 = 1:3）
        return self.mix_data(labeled, ratio={"real": 0.25, "synthetic": 0.75})
```

### 5.6.2 世界模型数据增强

| 增强维度 | 方法 | 效果 |
|---------|------|------|
| 天气变化 | UniSim 2 天气渲染 | 雨天检测 AP +12% |
| 长尾场景 | 对抗场景生成器 | 碰撞率降低 28% |
| 轨迹多样性 | 扩散模型轨迹采样 | 规划多样性 +40% |
| 视角迁移 | NeRF 重建 + 虚拟相机 | 跨车型迁移损失 < 2% |

## 5.7 安全验证与 V&V 框架

### 5.7.1 VLA 安全验证挑战

端到端模型的安全验证比模块化系统困难得多：

```
传统模块化验证:                 VLA 端到端验证:
  ┌──────┐                      ┌─────────────────┐
  │ 感知 │ → 独立测试             │                 │
  ├──────┤                      │  VLA 黑盒        │
  │ 预测 │ → 独立测试             │  (输入→输出)     │ → 如何验证？
  ├──────┤                      │                 │
  │ 规划 │ → 独立测试             └─────────────────┘
  └──────┘
  每模块有明确 spec              无法独立验证子模块
```

### 5.7.2 分层验证方案

```
VLA V&V 分层框架:
  Level 1: 单元级 — Latent CoT 可解释性验证
  Level 2: 场景级 — 10,000+ ODD 场景覆盖测试
  Level 3: 统计级 — 百万英里仿真 + 影子模式验证
  Level 4: 形式化 — RSS 安全包络 + 概率保证

关键指标:
  - 碰撞率 < 0.001 次/万公里（vs 人类 0.15 次/万公里）
  - 接管率 < 0.3 次/百公里（城区 NOA）
  - 端到端延迟 < 100ms（99th percentile）
  - ODD 覆盖率 > 99.5%（已验证场景）
```

## 5.8 VLA 推理优化：从 2 秒到 45 毫秒（FlashDrive 2026）

Reasoning VLA 的最大工程瓶颈是推理延迟（2s+），FlashDrive 论文首次证明了 Reasoning VLA 可以满足车规实时要求（< 100ms）：

### 5.8.1 三大核心技术

```python
# FlashDrive 推理优化技术栈
class FlashDriveOptimizer:
    def __init__(self, main_model, draft_model):
        self.main = main_model      # 7B VLA (Alpamayo-R1)
        self.draft = draft_model     # 700M Draft VLA (10% 主模型)
        self.action_vqvae = ActionVQVAE(codebook_size=4096)  # 动作压缩
        self.prefill_pipeline = LatentPrefillPipeline()       # 流水线预填充

    def speculative_reasoning(self, bev_features):
        """1. 推理投机执行：小模型生成草稿，大模型验证"""
        draft_steps = self.draft.reason(bev_features, max_steps=8)  # ~8ms
        accepted = self.main.verify_batch(draft_steps)               # ~20ms
        # 接受率 > 85%，有效加速 ~6.7x
        return accepted

    def compressed_action_decode(self, reasoning_output):
        """2. 动作 Token 压缩：180 维 → 22 码本 token"""
        compressed = self.action_vqvae.encode(reasoning_output)  # 8x 压缩
        actions = self.action_vqvae.parallel_decode(compressed)  # 单次前向传播
        return actions

    def pipeline_infer(self, frame_t, frame_t_plus_1):
        """3. 潜在空间预填充：利用帧间时间冗余"""
        # 帧 t 推理的同时预填充帧 t+1 的 BEV 特征
        with concurrent_execution():
            result_t = self.reason_and_plan(frame_t)
            self.prefill_pipeline.prepare(frame_t_plus_1)  # 隐藏感知延迟
        return result_t
```

### 5.8.2 性能对比

| 优化阶段 | 延迟 | 累计加速 | L2 精度 |
|---------|------|---------|--------|
| 原始 Alpamayo-R1 | 2,100ms | — | 0.71m |
| + Speculative Reasoning | 312ms | 6.7x | 0.71m |
| + Action Compression | 89ms | 24x | 0.72m |
| + Latent Prefill | **45ms** | **44x** | 0.72m |

精度损失 < 1.5%，首次满足车规 100ms 延迟要求。

### 5.8.3 技术迁移：LLM Infra → AD Infra

FlashDrive 的意义超越自动驾驶本身——它证明了 LLM 推理优化技术可以系统性迁移到 VLA：

| LLM 技术 | VLA 适配 | 核心难点 |
|---------|---------|---------|
| Speculative Decoding | Speculative Reasoning | 连续输出 vs 离散 token |
| KV Cache 压缩 | Action Token 压缩 | 需要 VQ-VAE 训练 |
| Chunked Prefill | Latent Prefill | 帧间冗余天然可利用 |

## 5.9 开源量产 VLA：小鹏 VLA 2.0 全景

2026 年 4 月小鹏在北京车展全面展示 VLA 2.0 生态，标志着开源量产 VLA 的成熟：

### 5.9.1 架构特点

- **72B MoE 基座**：8 专家 × 9B，活跃参数 ~9B，阿里云 3 万卡训练
- **脑内推理**：latent space CoT，延迟远低于文本 CoT，安全性保持
- **5 天全链路迭代**：数据采集→自动标注→训练→仿真→OTA 的完整闭环

### 5.9.2 量产数据

| 指标 | VLA 2.0 | 对比 |
|------|---------|------|
| 接管率 | 0.25 次/百公里 | 行业领先 |
| 窄路能力 | 13x 提升 | vs VLA 1.0 |
| 覆盖城市 | 300+ | 无图 NOA |
| 推理延迟 | 52ms (Orin X) | 满足车规 |

### 5.9.3 开源与商用生态

大众汽车成为首发商用客户（2026 年 ID.7 搭载），Apache 2.0 协议开源权重+推理代码+训练框架。这是中国自动驾驶技术向全球输出的标志性事件。

## 5.10 开放问题与研究方向

1. **VLA 的可解释性**：端到端模型的决策过程如何解释？Latent CoT 是否足够？注意力可视化 + 概念探针是有前景的方向
2. **长尾场景泛化**：如何让 VLA 在罕见场景（施工区、极端天气）中表现稳健？世界模型对抗生成 + 在线学习
3. **实时性约束**：FlashDrive 证明 Reasoning VLA 可满足车规要求，但长尾场景接受率下降（85% → 60%）仍需解决
4. **仿真与真实的 Gap**：世界模型生成的训练数据与真实场景的分布差异——Domain Randomization + Sim2Real 迁移
5. **规模化验证**：如何在有限路测里程下证明 VLA 的安全性？形式化方法 + 统计置信区间
6. **多芯片协同**：Thor/J6E 双芯片方案下 VLA 的流水线并行推理

## 小结

本章系统梳理了自动驾驶模型架构从模块化到 VLA 端到端的演进路径。VLA 架构通过统一视觉感知、语言理解和动作生成，正在成为下一代自动驾驶的核心范式。DriveWorld-VLA 等工作证明了世界模型与 VLA 的深度融合可以显著提升数据效率和泛化能力。FlashDrive 解决了 Reasoning VLA 的实时性瓶颈（44x 加速到 45ms），小鹏 VLA 2.0 开源和大众商用标志着量产 VLA 生态的成熟。未来的关键挑战在于长尾场景优化、安全验证和全球化部署。

---

*本章由 Signal 知识平台 AI 智能体自动生成并深度修订。最后更新：2026-04-18*
