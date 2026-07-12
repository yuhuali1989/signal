---
title: "多模态数据处理算法从入门到精通 - 第6章: 多模态生成模型的数据流水线"
book: "多模态数据处理算法从入门到精通"
chapter: "6"
chapterTitle: "多模态生成模型的数据流水线"
description: "文生图/文生视频/文生3D的数据处理流水线、VAE潜空间编码、Tag系统设计、Tag存储架构选型(Parquet/WebDataset双写)、数据量规划与估算、Collation与Prefetch策略"
date: "2026-06-07"
updatedAt: "2026-07-12 17:40"
agent: "研究员→编辑→审校员"
tags:
  - "数据流水线"
  - "文生图"
  - "文生视频"
  - "VAE"
  - "Collation"
  - "Tag系统"
  - "数据量"
  - "Parquet"
  - "WebDataset"
type: "book"
---

# 第 6 章：多模态生成模型的数据流水线

> 选自《多模态数据处理算法从入门到精通》

## 6.1 文生图模型的数据流水线

### 6.1.1 Stable Diffusion / Flux 流水线

```
文本数据：Prompt/Caption → Tokenizer → Text Embedding (CLIP/T5)
                                    ↕
图像数据：图像 → 图像预处理 → VAE Encoder → Latent (4×64×64)
                                    ↓
                            Diffusion UNet (加噪→去噪)
                                    ↓
                           VAE Decoder → 生成图像
```

### 6.1.2 Caption 处理策略

Caption的质量是文生图效果的核心决定因素：

| 策略 | 方法 | 参数 | 效果影响 |
|------|------|------|---------|
| **Template Caption** | 使用模板生成结构化的Caption | templates | 一致性提升，多样性受限 |
| **LLM Captioning** | 使用LLM生成详细描述 | model=Gemini, temp=0.7 | 质量高，成本高 |
| **Reward Captioning** | 基于奖励模型选择最优Caption | reward_model | 筛选高质量Caption |
| **Caption Dropout** | 训练时随机丢弃部分Caption | dropout_prob=0.1 | 提升无条件生成能力 |
| **Tag System** | 使用逗号分隔的标签格式 | tags, weights | A1111风格，适合SD v1 |

```python
# 扩散模型的Caption处理
class DiffusionCaptionProcessor:
    def __init__(self, tokenizer, text_encoder, max_length=77):
        self.tokenizer = tokenizer
        self.text_encoder = text_encoder
        self.max_length = max_length
    
    def process_prompt(self, prompt: str, negative_prompt: str = ""):
        # 正Prompt
        pos_tokens = self.tokenizer(
            prompt, max_length=self.max_length,
            padding="max_length", truncation=True, return_tensors="pt"
        )
        pos_embeds = self.text_encoder(pos_tokens.input_ids)
        
        # 负Prompt（Classifier-Free Guidance）
        neg_tokens = self.tokenizer(
            negative_prompt or "", max_length=self.max_length,
            padding="max_length", truncation=True, return_tensors="pt"
        )
        neg_embeds = self.text_encoder(neg_tokens.input_ids)
        
        return {
            "positive": pos_embeds,
            "negative": neg_embeds,
        }
```

### 6.1.3 VAE 编码与图像预处理

VAE（Variational Autoencoder）将像素空间压缩到潜空间，是扩散模型的关键环节：

```python
# VAE数据预处理（用于训练Stable Diffusion）
class SDDataProcessor:
    def __init__(self, vae, image_size=512):
        self.vae = vae
        self.image_size = image_size
        self.vae_scale_factor = 8  # 512→64的潜空间缩放
    
    def preprocess_image(self, image: np.ndarray) -> torch.Tensor:
        """图像预处理：训练时使用"""
        # 1. 尺寸调整（保持比例+中心裁剪）
        image = self._resize_and_crop(image, self.image_size)
        
        # 2. 归一化到[-1, 1]
        image = image.astype(np.float32) / 127.5 - 1.0
        image = torch.from_numpy(image).permute(2, 0, 1).unsqueeze(0)
        
        # 3. VAE编码到潜空间
        with torch.no_grad():
            latent = self.vae.encode(image).latent_dist.sample() * 0.18215
        
        return latent
    
    def _resize_and_crop(self, image, target_size):
        """多模态数据增强：随机裁剪+缩放"""
        h, w = image.shape[:2]
        
        # 随机缩放（scale range对应SD训练配置）
        scale = np.random.uniform(0.8, 1.2)
        new_h, new_w = int(h * scale), int(w * scale)
        image = cv2.resize(image, (new_w, new_h), 
                          interpolation=cv2.INTER_LANCZOS4)
        
        # 随机裁剪到目标尺寸
        if new_h > target_size:
            y = np.random.randint(0, new_h - target_size)
        else:
            y = 0
        if new_w > target_size:
            x = np.random.randint(0, new_w - target_size)
        else:
            x = 0
        
        return image[y:y+target_size, x:x+target_size]

# VAE编码参数：
# vae_scale_factor = 8 (SD 1.x/2.x, Flux)
# vae_scale_factor = 4 (SDXL)
# latent_multiplier = 0.18215 (SD的latent缩放因子，稳定训练)
```

### 6.1.4 图像Latent空间的数据增强

直接在Latent空间做增强比在像素空间更高效：

```python
# 潜空间增强（在VAE输出上直接操作）
class LatentAugmentation:
    def __init__(self, noise_std=0.01, dropout_rate=0.05):
        self.noise_std = noise_std
        self.dropout_rate = dropout_rate
    
    def forward(self, latent):
        # 1. 添加高斯噪声（正则化）
        if self.noise_std > 0:
            noise = torch.randn_like(latent) * self.noise_std
            latent = latent + noise
        
        # 2. Channel Dropout（提升鲁棒性）
        if self.dropout_rate > 0:
            mask = torch.bernoulli(
                torch.full(latent.shape, 1 - self.dropout_rate)
            ).to(latent.device)
            latent = latent * mask
        
        return latent
```

## 6.2 文生视频模型的数据处理

### 6.2.1 Sora/Gen-3 风格流水线

```
文本 → Text Encoder → Text Embedding
                             ↓
视频帧提取 → 3D Patch Embedding → 时空压缩
                             ↓
                       Diffusion Transformer
                             ↓
                       VAE Decoder (逐帧)
                             ↓
                      视频组装 (帧→Video)
```

### 6.2.2 视频数据处理的关键差异

| 方面 | 文生图 | 文生视频 | 参数调优 |
|------|--------|---------|---------|
| **数据维度** | 2D (H,W) | 3D (T,H,W) | T=16-128帧 |
| **编码方式** | 2D VAE | 3D VAE CausalConv | temporal_compression=4 |
| **分辨率** | 512-1024 | 384-1024 | 视频分辨率通常低于图像 |
| **帧率** | N/A | 24-30fps | 可降采样到3-8fps减少计算 |
| **时长** | N/A | 2-60秒 | 短视频训练效果好 |
| **Caption** | 单张描述 | 时序事件描述 | 需要事件级时间戳标注 |
| **增强** | 空间增强 | 时空联合增强 | 时间一致性约束 |

### 6.2.3 时空压缩编码

视频数据量大，需要有效的时空压缩：

```python
# 时空VAE编码 (类似Sora的压缩策略)
class SpatioTemporalVAE(nn.Module):
    """
    3D VAE: 同时在时间和空间维度压缩
    压缩比: 4×8×8 (时间×高×宽)
    """
    def __init__(self, in_channels=3, latent_dim=4):
        super().__init__()
        # 时间下采样 ×4
        self.temporal_enc = nn.ModuleList([
            CausalConv3D(in_channels, 128, kernel=(3,3,3), stride=(2,1,1)),
            CausalConv3D(128, 256, kernel=(3,3,3), stride=(2,1,1)),
        ])
        # 空间下采样 ×8
        self.spatial_enc = nn.ModuleList([
            nn.Conv3d(256, 512, kernel=3, stride=(1,2,2), padding=1),
            nn.Conv3d(512, latent_dim*2, kernel=3, stride=(1,2,2), padding=1),
        ])
    
    def encode(self, video):
        # video: (B, C, T, H, W)
        h = self.temporal_enc(video)
        h = self.spatial_enc(h)
        mean, logvar = h.chunk(2, dim=1)
        latent = mean + torch.randn_like(mean) * (0.5 * logvar).exp()
        return latent * 0.18215
```

## 6.3 文生3D模型的数据处理

### 6.3.1 多视角数据构建

文生3D模型（如Zero-1-to-3、MVDream）需要多视角训练数据：

| 算子 | 算法 | 参数 |
|------|------|------|
| **视角渲染** | 3D模型→多视角2D渲染 | azim=[0,360], elev=[-30,30] |
| **法线图生成** | 从3D网格计算法线 | normalize=True |
| **深度图渲染** | Z-Buffer提取 | near=0.1, far=100 |
| **UV展开** | 网格参数化 | method=least_squares_conformal |
| **点云采样** | 表面均匀采样 | n_points=100000 |
| **体素化** | 将网格转为体素 | resolution=128 |

### 6.3.2 3D数据增强

```python
# 3D数据增强
class PointCloudAugmentation:
    def __init__(self):
        self.rotation_range = (0, 360)  # 随机旋转角度
        self.scale_range = (0.8, 1.2)    # 随机缩放
        self.jitter_std = 0.01            # 点云抖动噪声
        self.dropout_ratio = 0.1          # 随机丢弃
    
    def augment(self, points):
        # 1. 随机旋转（沿Z轴）
        theta = np.random.uniform(*self.rotation_range) * np.pi / 180
        rotation = np.array([
            [np.cos(theta), -np.sin(theta), 0],
            [np.sin(theta), np.cos(theta), 0],
            [0, 0, 1]
        ])
        points = points @ rotation
        
        # 2. 随机缩放
        scale = np.random.uniform(*self.scale_range)
        points = points * scale
        
        # 3. 抖动噪声
        noise = np.random.normal(0, self.jitter_std, points.shape)
        points = points + noise
        
        # 4. 随机丢弃点
        if self.dropout_ratio > 0:
            mask = np.random.rand(points.shape[0]) > self.dropout_ratio
            points = points[mask]
        
        return points
```

## 6.4 数据Collation与批处理

### 6.4.1 Collation算子

Collation是将多个样本打包为Batch的核心算子：

```python
# 多模态生成模型的Collation
def multimodal_collate_fn(batch):
    """
    将不同模态的数据整理成统一的Batch
    batch: [(image, text, audio, ...), ...]
    """
    images = torch.stack([item['image'] for item in batch])
    
    # 文本处理（动态padding到Batch最大长度）
    texts = [item['caption'] for item in batch]
    text_tokens = tokenizer(texts, padding='longest', 
                           return_tensors='pt')
    
    # 音频处理（动态padding）
    audios = pad_sequence(
        [item['audio'].squeeze(0) for item in batch],
        batch_first=True
    )
    
    return {
        'image': images,          # (B, C, H, W)
        'input_ids': text_tokens.input_ids,   # (B, L)
        'attention_mask': text_tokens.attention_mask,  # (B, L)
        'audio': audios,          # (B, T_audio)
    }
```

### 6.4.2 高性能数据加载策略

| 策略 | 原理 | 参数 | 提升效果 |
|------|------|------|---------|
| **Prefetch** | 异步预加载下个Batch | prefetch_factor=2-4 | I/O延迟隐藏 |
| **Shared Memory** | 使用共享内存减少拷贝 | num_workers=4-8 | 减少CPU→GPU传输 |
| **Memory Mapping** | mmap直接访问磁盘文件 | mmap_mode='r' | 减少内存占用 |
| **WebDataset** | tar包顺序读取 | shard_size=1GB | 极高吞吐 |
| **Cache** | 高频样本缓存 | cache_size=10000 | 重复访问加速 |
| **Sharding** | 多进程分片加载 | num_shards=64 | 分布式训练 |

```python
# PyTorch DataLoader 配置（多模态训练最佳实践）
data_loader = DataLoader(
    dataset,
    batch_size=256,
    num_workers=8,          # CPU核数相关
    prefetch_factor=4,      # 预取4个Batch
    pin_memory=True,        # 使用固定内存（加速CPU→GPU）
    persistent_workers=True, # 维持worker进程（减少重启开销）
    shuffle=True,
    collate_fn=multimodal_collate_fn,
    drop_last=True,         # 丢弃最后一个不完整Batch
)
```

## 6.5 数据质量监控与流水线诊断

| 监控指标 | 正常范围 | 问题诊断 |
|---------|---------|---------|
| **数据处理吞吐** | >1000 samples/s/GPU | I/O瓶颈：增加num_workers |
| **GPU利用率** | >90% | 预处理瓶颈：检查数据加载 |
| **CPU负载** | <80% | 过多worker：减少num_workers |
| **内存使用** | <80%总内存 | 增大cache或减少prefetch |
| **数据质量比例** | 通过率>95% | 过滤标准过严/过松 |
| **增强多样性** | 中等方差 | 增强参数过强/过弱 |

## 6.6 Tag 系统：多模态数据流水线的「中枢神经」

如果说前面的 VAE 编码、Collation 解决的是"数据怎么喂"，那么 **Tag（标签/元数据）系统解决的是"喂哪些数据、按什么配比喂"**。在亿级样本的数据湖中，没有 Tag 的数据就是垃圾——它驱动着流水线的四大关键动作：

1. **过滤（Filter）**：质量分过低、NSFW、运动幅度太小、OCR 文字过多 → 丢弃
2. **路由（Route）**：按 Tag 把样本分到不同训练阶段/分组（如 HunyuanVideo 把视频分 5 组、图像分 2 组）
3. **平衡（Balance）**：按概念 Tag 做逆频率采样，避免"人/猫"等头部概念主导
4. **安全（Safety）**：版权、隐私、有害内容分级拦截

### 6.6.1 多维 Tag 分类体系（Taxonomy）

一套完整的多模态 Tag 体系通常是**多维度、多标签（multi-label）**的，而非单一分类：

| 维度 | 含义 | 取值类型 | 真实案例 |
|------|------|---------|---------|
| **质量 Quality** | 美学/清晰度/伪影 | 连续值 0–10 或 -2..2 | VisionRewardDB 18 维美学评分；Dover 视频质量分 |
| **语义/概念 Concept** | 物体/场景/风格/领域 | 层级分类（hierarchical） | Data-Juicer Domain 标签（General/Code/Financial/Image/Multimodal）；iFashion 8 组 228 属性 |
| **任务 Task** | 该样本适合什么训练目标 | 多标签 bitmask | caption / VQA / OCR / grounding / referral / conversation |
| **安全 Safety** | 有害内容分级 | 多标签 + 分级 | LlavaGuard 提出 6/8/32 类安全分类法（NSFW、暴力、仇恨、隐私、版权） |
| **运动 Motion（视频）** | 运镜/动态 | 分类 + 连续值 | HunyuanVideo 14 类运镜标签；光流幅值（optical flow magnitude） |
| **对齐 Alignment** | 跨模态相关性 | 连续值 | CLIP image-text 相似度；文本-视频相关性 |
| **来源/合规 Provenance** | 来源/许可/分辨率 | 字符串/枚举 | source_url、license、resolution、fps、duration |

**Tag 取值类型的存储映射**（设计 Tag schema 时就要想清楚落地方式）：

- **分类（categorical）** → 整数枚举 + 字典映射表（如 `style: 3` 对应 "cinematic"）
- **多标签（multi-label）** → **bitmask**（uint64 支持 64 个标签，VisionRewardDB 的 `meta_mask` 即此，1 表示该标签参与训练、0 表示忽略，用于**平衡采样**）
- **连续值（continuous）** → float32（美学分、CLIP 分）
- **有序（ordinal）** → int 等级（-2 极空 → 2 极丰富）
- **层级（hierarchical）** → 路径字符串或嵌套 JSON（`animal/dog/golden_retriever`，Parquet 原生支持嵌套 struct）

### 6.6.2 Tag 在流水线中的生命周期

```
① 采集阶段（自动保留）   分辨率/时长/fps/来源URL/license → source metadata
        ↓
② 模型自动标注           CLIP相似度、美学模型、NSFW分类器、OCR、目标检测、
                         captioning模型、运镜分类器 → 生成质量/概念/运动 Tag
        ↓
③ 人工/LLM 校验补标      SFT 数据、结构化 Caption（如 HunyuanVideo 7 维 JSON）
        ↓
④ 聚合为样本级 Tag 集合  → 进入存储层（见 6.7）→ 驱动过滤/路由/平衡
```

### 6.6.3 真实案例：Tag 如何组织一个大模型的数据集

**HunyuanVideo（腾讯，13B）— 结构化 JSON Caption（7 维）+ 运镜标签**
```json
{
  "short_caption": "A golden retriever running on a beach",
  "dense_caption": "A close-up of a golden retriever with wet fur,
                    sprinting across a sunlit sandy beach, waves crashing behind",
  "background": "ocean and cloudy sky",
  "style": "realistic, cinematic",
  "camera_type": "handheld",
  "lighting": "golden hour, backlit",
  "atmosphere": "warm, energetic",
  "camera_motion": ["pan_right", "zoom_in"]   // 14 类运镜标签之一/组合
}
```
视频按 Tag 分到 **5 个训练组**、图像分到 **2 个组**，分别服务不同训练阶段（图文联合训练）。

**Movie Gen（Meta，30B）— 概念平衡采样**
用 LLaMA3-Video 自动标注（平均 100 词描述）+ 16 类相机运动控制标签；对概念做**簇划分**，按簇大小逆平方根采样，避免高频概念主导。

**Data-Juicer（阿里，Qwen 数据底座）— 算子级 Tag**
每个算子带 `Domain`（General/LaTeX/Code/Financial/Image/Multimodal）+ `Language`（en/zh）标签，用 YAML 自由组合成 Pipeline，100+ 算子即 100+ 种 Tag 化变换。

---

## 6.7 Tag 存储架构选型（重点）

Tag 系统最大的工程矛盾是：**同一份 Tag 要同时服务两种截然相反的访问模式**。

| 访问模式 | 诉求 | 典型操作 |
|---------|------|---------|
| **离线筛选/平衡/统计** | 按 Tag 过滤、聚合、重采样、看分布 | "筛出 resolution>1024 且 style=cinematic 的样本"、"统计各概念占比" |
| **流式训练读取** | 按 shard 顺序、媒体+Tag 一起喂给模型 | DataLoader 顺序读 tar，随机访问极少 |

单一存储无法兼顾，因此工业界标准是 **双写模式（Dual-Write）**：Tag 同时存在于两处——

1. **媒体包内（.json）**：跟随 tar shard 流式训练，顺序读
2. **列式索引（Parquet）**：离线筛选/平衡/分析，聚合为 1 行/样本

### 6.7.1 工业标准范式：NeMo Curator 的 WebDataset + Parquet

NVIDIA NeMo Curator 的 `ImageTextPairDataset` 即采用此范式：

```
dataset/
├── 00000.tar                # 媒体分片
│   ├── 000000000.jpg        # 图像
│   ├── 000000000.txt        # caption 文本
│   └── 000000000.json       # 该样本 Tag/metadata
├── 00001.tar
│   └── ...
├── 00000.parquet            # 聚合元数据（列式，1 行/样本）
├── 00001.parquet
└── 00002.parquet
```

- **Record ID = shard ID + 片内偏移**：第 43 个 shard 的第 32 条 → `00042.tar`，key=`000420031`。ID 同时写在 `.json` 与 `.parquet` 的 `key` 列，二者靠此对齐。
- `save_metadata()` 只写 Parquet（不碰 tar）；`to_webdataset()` 按 `filter_column` 过滤后**重新分片（reshard）** tar，通常在 Pipeline 末端导出训练集时调用。
- Parquet 列里可存放 embedding、分类器分数、采样权重——支撑"先在 Parquet 上算平衡权重，再据此重采样 tar"的完整闭环。

### 6.7.2 存储格式对比与选型

| 格式 | 随机访问 | 过滤/聚合 | 流式训练 | 适用场景 |
|------|---------|----------|---------|---------|
| **Sidecar JSON** | 行级，大文件慢 | 差（需全扫） | 需解析 | 小数据集 / 原型验证 |
| **Parquet（列式）** | 列剪枝快 | ★★★ 极强 | 需转 WebDataset | 离线筛选/平衡/统计（**索引层**） |
| **WebDataset tar+json** | shard+offset | 需读 Parquet | ★★★ 顺序流 | 大规模训练（**工业标准**） |
| **TFRecord** | 需 `tf.io` | 中 | ★★★ | TensorFlow 生态 |
| **LMDB / HDF5** | ★★★ KV | 差 | 中 | RAG / 检索增强（高频随机读） |
| **Vector DB** | 语义检索 | 中 | 否 | 去重 / 相似搜索（放 embedding） |

> **结论**：大规模多模态训练 = **Parquet 做"大脑"（筛选+平衡），WebDataset 做"肌肉"（喂养）**，二者靠 Record ID 双写对齐。JSON 仅用于小数据原型。

### 6.7.3 用 Tag 做概念平衡（端到端代码）

```python
import pandas as pd
import numpy as np

# 1. 从 Parquet 索引读取概念 Tag
meta = pd.read_parquet("dataset/00000.parquet")   # 含 concept 列
counts = meta["concept"].value_counts()            # 每个概念的样本数 n_c

# 2. 计算采样权重：逆平方根（Movie Gen 同款）
total = counts.sum()
weights = {}
for c, n_c in counts.items():
    weights[c] = (1.0 / np.sqrt(n_c)) / sum(
        1.0 / np.sqrt(v) for v in counts.values()
    )

# 3. 写回 Parquet 新增 sample_weight 列（双写的一部分）
meta["sample_weight"] = meta["concept"].map(weights)
meta.to_parquet("dataset/00000.parquet", index=False)

# 4. 据此重采样并重分片 tar（NeMo: to_webdataset / 自实现 weighted resample）
#    训练时 DataLoader 按 sample_weight 做加权采样 → 头部概念不再碾压长尾
```

```python
# 多标签 bitmask 的存储与平衡（参考 VisionRewardDB meta_mask）
# 18 维美学标签 → 每个样本一个 uint32 bitmask
# 第 i 位 = 1 表示第 i 个维度参与本次训练（平衡正负样本）
meta_mask = 0b1011_0010_1101_0011   # 示例：哪几维启用
# 训练时：仅用 mask 中为 1 的维度计算 loss / 做平衡采样
```

---

## 6.8 数据量规划与估算（重点）

数据量的核心法则：**质量 >> 数量**。Cambrian-1 的消融实验表明，视觉指令微调中"提升数据质量"带来的性能增益，远大于"单纯加样本数"；精心标注的 100K 常能胜过噪声 1M。

### 6.8.1 按训练阶段与模态的量级（来自已公开训练方案）

**图文 / 视觉语言模型（VLM）**

| 阶段 | 量级 | 真实案例 |
|------|------|---------|
| 对比预训练（CLIP 式） | 1 亿 – 10 亿图文对 | CLIP 4 亿；LAION-5B（全量）/ LAION-2B-en（过滤子集） |
| VLM 特征对齐预训练 | 数十万 – 数百万 | LLaVA 595K（CC3M 子集）；Qwen-VL 阶段 1 |
| VLM 多任务预训练 | 数千万 – 上亿 | Qwen-VL 阶段 2：77M |
| VLM 指令微调（SFT） | 10 万 – 100 万 | LLaVA-1.5 665K；Qwen-VL-Chat 350K |
| VLM 全量预训练 | 十亿级图文对 | Qwen-VL：收集 50 亿 → 清洗后 **14 亿**（保留率 28%），训练约 15 亿样本 |

**视频生成模型**

| 模型 | 参数 | 训练数据规模 |
|------|------|-------------|
| Stable Video Diffusion | 1.5B | LVD ~5.77 亿 clips |
| CogVideoX | 2B / 5B | ~3500 万视频 clips + 20 亿图像 |
| Wan 2.1 | 1.3B / 14B | ~50 亿图像 + ~12 亿视频 clips（估计） |
| **HunyuanVideo** | 13B | 数十亿图像-文本对 + 数亿视频（阶段 1 数十亿 / 阶段 2 数亿）；SFT ~100 万；V2A 25 万小时预训练 / 8 万小时 SFT 子集 |
| Movie Gen | 30B | 工业级视频库（未公开量级） |

**音频 / 语音**

| 任务 | 数据量 | 备注 |
|------|--------|------|
| ASR 从零训练 | 1 万 – 10 万小时转录语音 | 干净多样化即可 |
| Whisper（OpenAI） | 68 万小时多语种 | 工业级 |
| 垂域（医疗/法律/小语种） | 1000 小时高质量领域内 | 常优于 10 万小时通用数据 |

### 6.8.2 数据量经验法则与规划清单

- **保留率（yield）**：原始池 → 最终训练集通常只保留 **20%–30%**（Qwen-VL 28%）。视频因运动/美学/安全多重过滤，保留率更低，原始池常为训练集的 **5–10 倍**。
- **预训练**：数据量决定天花板，规模越大越好，但必须质量过滤；LAION-5B 之所以存在，正是 4 亿不够用。
- **对齐 / SFT**：质量主导数量，精标 100K > 噪声 1M。
- **概念平衡**：用 Tag 做逆频率采样，抑制"人/猫"等头部概念。
- **规划 5 步**：
  1. 定阶段（预训练 / 对齐 / SFT）→ 定量级
  2. 估算原始池 = 目标训练集 ÷ 保留率（0.2–0.3）
  3. 设计 Tag schema → 支撑过滤与平衡
  4. 选存储：双写 Parquet（筛选）+ WebDataset（训练）
  5. 算预算：自动标注（模型）vs 人工成本、tar 压缩 vs parquet 存储成本

---

## 6.9 本章小结

本章系统梳理了多模态生成模型（文生图/文生视频/文生3D）的完整数据流水线：从 VAE 潜空间编码、时空压缩编码，到 Caption 处理策略、Collation 批处理与高性能加载。并在此基础上重点重构了两个工程核心：

- **Tag 系统是流水线的"中枢神经"**——它驱动过滤、路由、平衡、安全四大动作。一套完整的 Tag 体系是多维、多标签的（质量/语义/任务/安全/运动/对齐/来源），取值类型需提前规划为枚举、bitmask、float 或层级路径以匹配存储。
- **Tag 存储采用"双写"工业范式**——Parquet（列式索引）负责离线筛选/平衡/统计，WebDataset tar+json 负责流式训练喂养，二者靠 Record ID 对齐；NeMo Curator 是此范式的标准实现。
- **数据量遵循"质量 >> 数量"**：CLIP 4 亿、LAION-5B、Qwen-VL 50 亿→14 亿（保留率 28%）、HunyuanVideo 数十亿图文对+数亿视频、SFT 约 100 万——原始池到训练集的保留率通常仅 20%–30%，且必须用 Tag 做概念平衡。

高效的数据加载、清晰的 Tag 体系与合理的数据量规划，共同构成生成模型训练性能的底层保障。

---

*本章由 Signal 知识平台 AI 智能体自动生成并持续修订。最后更新：2026-07-12*
