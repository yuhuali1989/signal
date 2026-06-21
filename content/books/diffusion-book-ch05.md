---
title: "Diffusion模型文本与多模态融合从入门到精通 - 第5章: 训练数据流水线与条件数据加载"
book: "Diffusion模型文本与多模态融合从入门到精通"
chapter: "5"
chapterTitle: "训练数据流水线与条件数据加载"
description: "图文对数据处理、多模态条件数据加载器、动态分辨率分桶、Caption增强与Dropout策略、DataLoader完整实现"
date: "2026-06-21"
updatedAt: "2026-06-21 12:00"
agent: "研究员→编辑→审校员"
tags:
  - "数据流水线"
  - "图文对"
  - "数据加载"
  - "分桶"
  - "Caption增强"
type: "book"
---

# 第 5 章：训练数据流水线与条件数据加载

> 选自《Diffusion模型文本与多模态融合从入门到精通》

## 5.1 图文对数据处理

### 5.1.1 数据格式

```python
# 文生图训练数据标准格式：JSONL
# 每行一个 JSON 对象
{"image": "path/to/image.jpg", "caption": "一只橘猫在窗台上晒太阳"}
{"image": "path/to/image2.jpg", "caption": "a cute golden retriever puppy"}
{"image": "path/to/image3.jpg", "caption": "日落时分的海滩，金色的阳光洒在海面上"}

# 带多数据源的数据格式
{"image": "image.jpg", "caption": "a cat",
 "text_embeddings": "precomputed_clip_embeddings.npy",  # 预提取文本嵌入
 "image_embeddings": "precomputed_vit_embeddings.npy"}    # 预提取图像嵌入
```

### 5.1.2 图像预处理流水线

```python
class ImagePreprocessor:
    """
    图像预处理：训练 SD 时使用
    
    流程：
    1. 解码（JPEG/PNG/WebP → RGB tensor）
    2. 长边保持比例缩放到目标尺寸
    3. 居中裁剪（或随机裁剪，用于数据增强）
    4. 归一化到 [-1, 1]
    5. (可选) 编码到潜空间
    """
    def __init__(self, resolution=512, center_crop=True, random_flip=True):
        self.resolution = resolution
        self.center_crop = center_crop
        self.random_flip = random_flip
    
    def __call__(self, image_path: str) -> torch.Tensor:
        """
        返回: [3, H, W] 归一化到 [-1, 1] 的图像
        """
        from PIL import Image
        import torchvision.transforms as T
        
        # 1. 解码
        image = Image.open(image_path).convert('RGB')
        
        # 2. 保持比例缩放
        w, h = image.size
        scale = self.resolution / max(w, h)
        new_w, new_h = int(w * scale), int(h * scale)
        image = image.resize((new_w, new_h), Image.LANCZOS)
        
        # 3. 裁剪
        if self.center_crop:
            # 居中裁剪到目标尺寸
            left = (new_w - self.resolution) // 2
            top = (new_h - self.resolution) // 2
            image = image.crop((left, top, left + self.resolution, top + self.resolution))
        else:
            # 随机裁剪（数据增强）
            i, j, h, w = T.RandomCrop.get_params(
                image, output_size=(self.resolution, self.resolution)
            )
            image = image.crop((j, i, j + w, i + h))
        
        # 4. 转 Tensor + 归一化到 [-1, 1]
        image = T.ToTensor()(image) * 2 - 1
        
        # 5. 随机水平翻转
        if self.random_flip and torch.rand(1) > 0.5:
            image = torch.flip(image, dims=[-1])
        
        return image
```

### 5.1.3 Caption 处理与增强

```python
class CaptionProcessor:
    """
    Caption 处理：清洗 + 增强 + 模板化
    
    增强策略（用于训练）：
    - drop: 随机丢弃 caption（用于 CFG 训练）
    - template: 使用模板包装（如 "a photo of {caption}"）
    - augment: LLM 生成变体
    """
    def __init__(
        self,
        tokenizer,
        max_length=77,
        caption_dropout_prob=0.1,        # CFG 无条件训练概率
        template_augmentation=False,
    ):
        self.tokenizer = tokenizer
        self.max_length = max_length
        self.caption_dropout_prob = caption_dropout_prob
        self.template_augmentation = template_augmentation
        
        self.templates = [
            "{}",
            "a photo of {}",
            "an image of {}",
            "{}",
        ]
    
    def __call__(self, caption: str, training=True) -> dict:
        """
        处理 Caption
        
        training=True 时：
        - 以 caption_dropout_prob 概率置空（CFG 训练）
        - 随机选择模板
        - Tokenize
        """
        if training and random.random() < self.caption_dropout_prob:
            caption = ""  # ★ 无条件训练
        
        if self.template_augmentation and training:
            template = random.choice(self.templates)
            caption = template.format(caption)
        
        tokens = self.tokenizer(
            caption,
            max_length=self.max_length,
            padding="max_length",
            truncation=True,
            return_tensors="pt",
        )
        
        return {
            "input_ids": tokens.input_ids[0],
            "attention_mask": tokens.attention_mask[0],
            "raw_caption": caption,
        }
```

## 5.2 多模态条件数据加载器

```python
class MultimodalConditionDataset(Dataset):
    """
    多模态条件数据集：支持文本 + ControlNet 条件 + 图像条件的联合加载
    
    每个样本格式：
    {
        "image": [3, 512, 512],           # 目标图像（已编码到潜空间）
        "caption": {"input_ids": [77],...}, # 文本条件
        "canny_condition": [3, 512, 512],  # ControlNet Canny 条件
        "depth_condition": [1, 512, 512],  # ControlNet 深度条件
        "reference_image": [3, 512, 512],  # IP-Adapter 参考图
    }
    """
    def __init__(
        self,
        data_path: str,           # JSONL 数据路径
        vae: nn.Module,           # VAE 编码器（预提取潜空间）
        text_encoder: nn.Module,  # CLIP 文本编码器
        resolution=512,
        cond_types=["canny"],     # 条件类型列表
    ):
        # 读取 JSONL
        with open(data_path, 'r') as f:
            self.data = [json.loads(line) for line in f]
        
        self.vae = vae
        self.text_encoder = text_encoder
        self.resolution = resolution
        self.cond_types = cond_types
        self.image_prep = ImagePreprocessor(resolution)
        self.caption_proc = CaptionProcessor(
            text_encoder.tokenizer if hasattr(text_encoder, 'tokenizer') else None
        )
        
        # 条件预处理器
        self.control_prep = ControlNetPreprocessor()
    
    def __len__(self):
        return len(self.data)
    
    def __getitem__(self, idx):
        item = self.data[idx]
        
        # 1. 目标图像 → VAE 潜空间
        image = self.image_prep(item["image"]).unsqueeze(0)
        with torch.no_grad():
            latent, _, _ = self.vae(image)  # [1, 4, 64, 64]
            latent = latent.squeeze(0)
        
        # 2. 文本条件
        caption = self.caption_proc(item["caption"], training=True)
        
        # 3. ControlNet 条件
        conditions = {}
        for cond_type in self.cond_types:
            if f"{cond_type}_image" in item:
                cond_img = self.image_prep(item[f"{cond_type}_image"])
                conditions[cond_type] = cond_img
        
        # 4. IP-Adapter 参考图（如果有）
        ref_image = None
        if "reference_image" in item:
            ref_image = self.image_prep(item["reference_image"])
        
        return {
            "latent": latent,
            "caption": caption,
            "conditions": conditions,
            "reference": ref_image,
        }
```

## 5.3 动态分辨率分桶

### 5.3.1 分桶策略

```python
class ResolutionBucket:
    """
    多分辨率训练：不同分辨率的图像分桶到最近的 bucket
    
    SD 时代：固定 512×512
    SDXL 时代：多种分辨率分桶
    Sora/Flux 时代：原始分辨率训练
    
    Bucket 列表：
    - 256×256  (1:1)
    - 512×512  (1:1)    ← 标准 SD
    - 768×768  (1:1)
    - 512×768  (2:3)    ← 竖图
    - 768×512  (3:2)    ← 横图
    - 512×1024 (1:2)
    - 1024×512 (2:1)
    - 896×1152 (7:9)
    """
    def __init__(self):
        self.buckets = [
            (256, 256, 256),   # (w, h, area)
            (512, 512, 512),
            (384, 640, 512),
            (640, 384, 512),
            (512, 768, 640),
            (768, 512, 640),
            (512, 1024, 768),
            (1024, 512, 768),
            (896, 1152, 1024),
            (1152, 896, 1024),
        ]
    
    def assign_bucket(self, w, h):
        """将图像分配到最近的 bucket（基于面积和宽高比）"""
        area = (w * h) ** 0.5  # 几何平均
        aspect = w / h
        
        best_bucket = None
        best_score = float('inf')
        
        for bw, bh, _ in self.buckets:
            b_area = (bw * bh) ** 0.5
            b_aspect = bw / bh
            
            # 面积差 + 宽高比差
            score = abs(area - b_area) / max(area, b_area) + \
                    abs(aspect - b_aspect) * 2
            if score < best_score:
                best_score = score
                best_bucket = (bw, bh)
        
        return best_bucket

class BucketedDataLoader:
    """
    分桶数据加载器：同一 batch 内的图像来自同一 bucket
    """
    def __init__(self, dataset, bucket):
        self.dataset = dataset
        self.bucket = bucket  # (w, h) 当前 batch 的目标分辨率
    
    def collate_fn(self, batch):
        """将同一 bucket 的数据整理为 batch"""
        latents = []
        captions = []
        
        for item in batch:
            # 将图像缩放到 bucket 尺寸
            image = item["image"]
            image = F.interpolate(
                image.unsqueeze(0),
                size=(self.bucket[1], self.bucket[0]),
                mode='bilinear',
                align_corners=False,
            ).squeeze(0)
            
            # VAE 编码
            with torch.no_grad():
                latent = vae.encode(image.unsqueeze(0))
            latents.append(latent)
            captions.append(item["caption"])
        
        return {
            "latents": torch.cat(latents, dim=0),
            "captions": captions,
        }
```

## 5.4 完整训练数据流水线

```python
class DiffusionDataPipeline:
    """
    端到端数据流水线：磁盘 → 模型输入
    
    流程：
    JSONL → Dataset → Bucket Assignment → Batch → VAE + Text Encode → Model
    """
    def __init__(self, config):
        self.config = config
        self.dataset = MultimodalConditionDataset(
            data_path=config.data_path,
            vae=config.vae,
            text_encoder=config.text_encoder,
            resolution=config.resolution,
        )
        
        # 为每个 bucket 创建一个 DataLoader
        self.bucket_manager = ResolutionBucket()
        self.dataloaders = {}
        
        # 预分桶
        bucket_images = defaultdict(list)
        for idx in range(len(self.dataset)):
            item = json.loads(open(config.data_path).readline())
            w, h = get_image_size(item["image"])
            bucket = self.bucket_manager.assign_bucket(w, h)
            bucket_images[bucket].append(idx)
        
        for bucket, indices in bucket_images.items():
            subset = Subset(self.dataset, indices)
            self.dataloaders[bucket] = DataLoader(
                subset,
                batch_size=config.batch_size,
                shuffle=True,
                num_workers=config.num_workers,
                collate_fn=BucketedDataLoader(self.dataset, bucket).collate_fn,
            )
    
    def get_batch(self):
        """
        从随机的 bucket 中获取一个 batch
        """
        bucket = random.choice(list(self.dataloaders.keys()))
        loader = self.dataloaders[bucket]
        return next(iter(loader))
```

---

*本章由 Signal 知识平台 AI 智能体自动生成并持续修订。最后更新：2026-06-21*
