---
title: "多模态基础模型预训练数据格式与Megatron/DeepSpeed框架适配深度解析"
date: "2026-06-15"
author: "Signal AI 编辑"
tags:
  - "多模态"
  - "预训练"
  - "Megatron"
  - "DeepSpeed"
  - "数据格式"
  - "大模型训练"
category: "infra"
summary: "深入解析多模态基础模型预训练中的数据格式设计原则、Megatron-LM和DeepSpeed框架的数据加载机制，以及图文交错数据、视频数据、JSONL格式适配的最佳实践与常见陷阱。"
---

# 多模态基础模型预训练数据格式与Megatron/DeepSpeed框架适配深度解析

> 多模态基础模型（MMFM）的预训练数据格式直接影响训练效率、收敛速度和模型质量。本文深入剖析数据格式设计原则，详解 Megatron-LM 和 DeepSpeed 两大框架的数据加载机制，并提供实战级配置方案。

## 1. 多模态预训练数据的格式挑战

多模态预训练数据相比纯文本数据有三大核心挑战：

| 挑战 | 说明 | 影响 |
|------|------|------|
| **异质性** | 文本、图像、音频、视频各有其原生格式 | 需要统一Token化表示 |
| **交错性** | 图文交错序列长度和比例极度不均 | 影响padding和batch策略 |
| **规模** | 多模态数据量通常是文本的10-100倍 | I/O和存储成为瓶颈 |

### 1.1 主流多模态数据格式对比

| 格式 | 使用框架 | 适用模型 | 优势 | 劣势 |
|------|---------|---------|------|------|
| **JSONL** | DeepSpeed / 通用 | 多模态LLM | 灵活、可扩展、易调试 | 文件大、加载慢 |
| **bin/idx (MMap)** | Megatron-LM | 文本密集型 | 内存映射、加载极快 | 构建复杂、修改困难 |
| **WebDataset (tar)** | WebDataset / DALI | 视觉+文本 | 高吞吐、流式读取 | 随机访问困难 |
| **HDF5** | 通用科学计算 | 音频+3D | 层次结构支持好 | I/O性能不如MMap |
| **TFRecord** | TensorFlow | 跨框架 | Protobuf高效序列化 | TF生态依赖 |
| **MosaicDB** | MosaicML/Composer | 通用 | Streaming、混料支持 | 较新生态小 |

## 2. Megatron-LM 数据格式

### 2.1 核心数据流水线

```
原始数据 → 清洗 → Token化 → 合并 → 
  ┌─────────────────────────────┐
  │   预处理脚本                │
  │   tools/preprocess_data.py  │
  └─────────────┬───────────────┘
                ↓
    ┌───────────────────────┐
    │  data/dataset.bin      │ ← 二进制token序列
    │  data/dataset.idx      │ ← 索引文件（文档边界）
    │  data/dataset_*.npy    │ ← 可选：图像特征/位置
    └───────────────────────┘
```

### 2.2 .bin/.idx 格式详解

Megatron 使用基于内存映射（Memory-Mapped）的二进制格式，支持超大规模数据的高效随机访问。

**bin 文件结构**：
```
┌─────────────────────────────────────────────┐
│ token_0 | token_1 | ... | token_N           │ ← 连续的np.uint16序列
│ 所有文档按顺序拼接，文档间无分隔符          │
└─────────────────────────────────────────────┘
```

**idx 文件结构**：
```
┌──────────┬─────────────────────────────────┐
│ Header   │ magic_number (int64)            │ ← 固定值 1953467590
│          │ version (int64)                 │ ← 格式版本
│          │ num_docs (int64)                │ ← 文档总数
│          │ num_tokens (int64)              │ ← token总数
│          │ dtype_code (int64)              │ ← 数据类型码 (1=uint16)
│          │ vocab_size (int64)              │ ← 词表大小
├──────────┼─────────────────────────────────┤
│ Index    │ doc_idx[num_docs+1]             │ ← 每个文档的结束位置
│          │ seq_idx[0..num_tokens]          │ ← 每个token所属文档ID
│          │ cum_len[0..num_tokens+1]        │ ← 累积token数
└──────────┴─────────────────────────────────┘
```

### 2.3 多模态数据预处理脚本

```python
# Megatron 图文交错数据预处理示例
# tools/preprocess_multimodal_data.py

import numpy as np
import torch
from megatron.tokenizer import build_tokenizer

def preprocess_multimodal_data(
    raw_data_path: str,
    output_prefix: str,
    tokenizer_type: str = "GPT2BPETokenizer",
    image_token_id: int = 50256,  # 图像占位Token
    num_images: int = 0,          # 图像特征文件数量
):
    """
    将图文交错JSONL数据转换为Megatron bin/idx格式
    
    输入格式：
    {"text": "A photo of <|image|> a cat", "image_features": "img_001.npy"}
    """
    tokenizer = build_tokenizer(tokenizer_type)
    
    tokens_list = []
    image_feature_list = []
    
    with open(raw_data_path, 'r') as f:
        for line in f:
            item = json.loads(line)
            
            # 1. 替换图像占位符
            text = item['text'].replace('<|image|>', f' {image_token_id} ')
            
            # 2. Token化文本
            tokens = tokenizer.tokenize(text)
            
            # 3. 插入图像起始/结束标记（可选）
            # tokens = [bos_token_id] + tokens + [eos_token_id]
            
            tokens_list.append(tokens)
             
            # 4. 记录图像特征路径
            if 'image_features' in item:
                image_feature_list.append(item['image_features'])
    
    # 5. 合并所有文档为连续token序列
    all_tokens = np.concatenate(tokens_list).astype(np.uint16)
    
    # 6. 构建索引
    doc_idx = np.cumsum([0] + [len(t) for t in tokens_list])
    
    # 7. 写入bin和idx文件
    write_mmap_data(output_prefix, all_tokens, doc_idx)
    
    print(f"Processed {len(tokens_list)} documents, {len(all_tokens)} tokens")
```

### 2.4 多模态Megatron训练配置

```json
{
  "data_path": "/data/dataset_text_document",   // 文本token数据
  "image_data_path": "/data/image_features/",   // 图像特征目录
  "image_token_length": 256,                     // 每张图对应token数
  "image_token_id": 50256,                      // 图占位符
  "seq_length": 4096,                           // 序列长度
  "num_image_tokens": 1,                        // 每文档图像数
  "img_h": 336,                                 // 图像分辨率
  "img_w": 336,
  // 数据加载参数
  "dataloader_type": "single",                  // 单数据源
  "data_impl": "mmap",                          // 内存映射
  "split": "949,50,1",                          // train/val/test
  "train_samples": 100000000,                   // 训练样本数
}
```

### 2.5 常见问题：多模态数据分片

多模态数据的一个痛点：文本token和图像特征是**分离存储**的，训练时需要同步加载。

```python
# Megatron 多模态数据加载适配
class MultimodalBlendedMegatronDataset(MegatronDataset):
    """
    多模态数据集：文本bin + 图像特征的同步加载
    """
    def __init__(self, text_data_path, image_data_path):
        # 文本数据（Megatron原生MMap格式）
        self.text_dataset = MMapIndexedDataset(text_data_path)
        
        # 图像特征（预提取的NPY文件）
        self.image_features = np.load(
            f"{image_data_path}/features.npy", 
            mmap_mode='r'
        )
        
    def __getitem__(self, idx):
        # 文本token
        text_tokens = self.text_dataset[idx]
        
        # 对应的图像特征（需要与文本索引对齐）
        image_feat = self.image_features[idx]
        
        # 在图文交错位置插入图像Token
        tokens = self._interleave(text_tokens, image_feat)
        
        return tokens
```

## 3. DeepSpeed 数据格式

### 3.1 DeepSpeed Data Pipeline 架构

DeepSpeed 的数据流水线以 JSONL 为核心格式，使用 DeepSpeed Data Efficiency library 或 Mixture of Datasets (MoD) 进行多源数据混合。

```
JSONL文件(原始/预处理后)
    │
    ▼
┌──────────────────────────────────┐
│  DeepSpeed Data Pipeline         │
│                                  │
│  ┌──────────────────────────┐   │
│  │ Data Sampler (MoD)       │   │ ← 混合比例、采样策略
│  │  - 按数据集权重采样      │   │
│  │  - 支持BlendingDatasets  │   │
│  └──────────┬───────────────┘   │
│             ▼                   │
│  ┌──────────────────────────┐   │
│  │ Data Collator            │   │ ← Padding、Masking
│  │  - 动态padding           │   │
│  │  - 图像特征嵌入          │   │
│  └──────────┬───────────────┘   │
│             ▼                   │
│  ┌──────────────────────────┐   │
│  │ ZeRO Optimizer           │   │ ← 显存优化
│  └──────────────────────────┘   │
└──────────────────────────────────┘
```

### 3.2 JSONL 格式规范

DeepSpeed 最常用的多模态数据格式是 JSONL（每行一个JSON对象）：

```jsonl
# 图文交错数据格式
{"text": "A photo of <image> a cute cat", "image": "cat.jpg", "image_token_id": 0}
{"text": "This diagram shows <image> the training pipeline", "image": "pipeline.png", "image_token_id": 0}

# 多模态对话格式（多轮）
{"messages": [
    {"role": "user", "content": "<image> What is this?"},
    {"role": "assistant", "content": "This is a golden retriever."}
], "image": "dog.jpg"}

# 视频数据格式
{"text": "A video of <video> a person walking", "video_frames": "walking_frames/", "num_frames": 32, "fps": 24}

# 交错多图格式
{"text": "<image> shows the front view. <image> shows the back view. Both are <image> of the same building.", 
 "images": ["front.jpg", "back.jpg", "building_details.jpg"]}
```

### 3.3 DeepSpeed 多模态数据处理

```python
# DeepSpeed 多模态数据加载器
import deepspeed
from deepspeed.accelerator import get_accelerator

class MultimodalDataCollator:
    """
    多模态数据整理器：处理图像Token嵌入 + 动态Padding
    """
    def __init__(self, 
                 image_processor=None,
                 tokenizer=None,
                 max_length=4096,
                 image_token_id=0,
                 num_image_tokens=256):
        self.image_processor = image_processor
        self.tokenizer = tokenizer
        self.max_length = max_length
        self.image_token_id = image_token_id
        self.num_image_tokens = num_image_tokens
    
    def __call__(self, batch):
        input_ids_list = []
        attention_mask_list = []
        image_tensors_list = []
        
        for item in batch:
            # 1. 处理文本
            text = item['text'].replace('<image>', f'<|image|>' * self.num_image_tokens)
            encoded = self.tokenizer(
                text,
                max_length=self.max_length,
                padding=False,
                truncation=True,
            )
            
            # 2. 处理图像
            if 'image' in item and self.image_processor:
                image = Image.open(item['image']).convert('RGB')
                image_tensor = self.image_processor(image)
            else:
                image_tensor = None
            
            input_ids_list.append(encoded['input_ids'])
            attention_mask_list.append(encoded['attention_mask'])
            image_tensors_list.append(image_tensor)
        
        # 3. 动态Padding（DeepSpeed推荐）
        # 使用 pad_sequence 而非固定长度padding
        input_ids = torch.nn.utils.rnn.pad_sequence(
            [torch.tensor(ids) for ids in input_ids_list],
            batch_first=True,
            padding_value=self.tokenizer.pad_token_id
        )
        
        attention_mask = torch.nn.utils.rnn.pad_sequence(
            [torch.tensor(mask) for mask in attention_mask_list],
            batch_first=True,
            padding_value=0
        )
        
        # 4. 图像特征拼接
        if any(t is not None for t in image_tensors_list):
            images = torch.stack(image_tensors_list) if image_tensors_list[0] is not None else None
        else:
            images = None
        
        return {
            'input_ids': input_ids,
            'attention_mask': attention_mask,
            'images': images,
            'labels': input_ids.clone(),  # CLM loss
        }
```

### 3.4 Mixture of Datasets (MoD) 配置

DeepSpeed 的混合数据集机制支持按比例混合多模态和纯文本数据：

```python
# DeepSpeed MoD 配置
from deepspeed.data.datasets import DeepSpeedDataset
from deepspeed.data.sampling import BlendingDataset

# 多模态数据 + 纯文本数据的混合
datasets = {
    "multimodal_laion": {
        "path": "/data/laion-5b-jsonl/",
        "format": "jsonl",
        "weight": 0.6,          # 60% 采样权重
        "max_samples": 50000000,
    },
    "text_pile": {
        "path": "/data/the-pile-jsonl/",
        "format": "jsonl",
        "weight": 0.3,
        "max_samples": 100000000,
    },
    "code_starcoder": {
        "path": "/data/starcoder-jsonl/",
        "format": "jsonl",
        "weight": 0.1,
    }
}

# 混合采样器
blend_dataset = BlendingDataset(datasets, shuffle=True)

# DeepSpeed ZeRO3 + MoD 训练
model_engine, optimizer, _, _ = deepspeed.initialize(
    model=model,
    model_parameters=model.parameters(),
    config_params={
        "train_batch_size": 2048,
        "gradient_accumulation_steps": 8,
        "data_efficiency": {
            "enabled": True,
            "dataset_type": "blendable",
        }
    }
)
```

## 4. 多模态数据的 Token 化策略

多模态预训练中，不同模态在统一序列中的表示方式是最关键的设计决策。

### 4.1 三种主流方案对比

| 方案 | 代表模型 | 实现 | 优点 | 缺点 |
|------|---------|------|------|------|
| **离散Token化** | VQ-GAN+GPT | 图像→VQ-VAE code→离散token | 统一序列建模 | 信息损失，序列过长 |
| **连续嵌入注入** | LLaVA/Florence-2 | 图像→ViT→连续向量→cross-attn | 信息完整 | 架构复杂 |
| **交错序列** | Chameleon/CM3Leon | 图像token+文本token统一序列 | 最简洁统一 | 训练慢，图占序列长 |

### 4.2 Megatron中的图像Token处理

```python
# Megatron 中处理多模态序列的注意事项
def build_multimodal_sample(tokens, image_hidden_states, image_length=256):
    """
    构建图文交错的训练样本
    
    关键参数：
    - image_length: 每张图占用多少token位置（PixArt: 1, SD: 256, Chameleon: 1024）
    - tok_type: token类型（文本=0, 图像=1）
    - loss_mask: 图像token是否参与loss计算（通常不计算）
    """
    # Megatron的data sample格式要求
    sample = {
        'text': tokens,              # (seq_len,) 包括图像占位token
        'types': None,               # token类型ID
        'labels': tokens.copy(),     # 预测目标
        'loss_mask': np.ones_like(tokens),  # 1=计算loss
        'attention_mask': None,      # Megatron自动生成
        'metadata': {
            'image_indices': [],      # 图像token的位置索引
            'image_hidden_states': image_hidden_states,  # 预提取的图像特征
            'num_images': 0,
        }
    }
    return sample
```

## 5. Megatron vs DeepSpeed 数据格式对比

| 维度 | Megatron-LM | DeepSpeed | 选择建议 |
|------|-------------|-----------|---------|
| **数据格式** | bin/idx (MMap) | JSONL / WebDataset | 数据量大用MMap，灵活用JSONL |
| **预处理** | tools/preprocess_data.py | 自定义脚本 | Megatron成熟，DeepSpeed灵活 |
| **多模态支持** | 需自定义（无原生支持） | 原生（Collator机制） | DeepSpeed更适合多模态 |
| **随机访问** | O(1) 索引 | 取决于实现 | Megatron碾压 |
| **I/O吞吐** | 极高（MMap） | 中等（JSON解析开销） | Megatron领先 |
| **数据混合** | 有限（BlendedDataset） | 强（MoD机制） | DeepSpeed更强 |
| **动态Padding** | 不原生支持 | 原生支持 | DeepSpeed更适合变长多模态 |
| **图像预提取** | 需提前提取NPY | 可在线processor | DeepSpeed更灵活 |
| **分布式加载** | 多进程索引 | DeepSpeed Data Pipeline | 相当 |
| **社区生态** | NVIDIA官方 | Microsoft + HF | 两者都活跃 |

## 6. 实战经验：常见陷阱与解决方案

### 6.1 Megatron 多模态踩坑记录

```python
# 坑1：图像占位Token导致注意力分散
# 现象：模型学习忽略图像token，退化回纯文本
# 解决：使用独立type_id区分模态
sample = {
    'text': tokens,
    'types': np.where(tokens == IMAGE_TOKEN_ID, 1, 0),  # 0=文本, 1=图像
}

# 坑2：序列长度爆炸
# 现象：每张图256token × 多图 = 快速耗尽4096上下文
# 解决：限制每样本最多K图，过长图进行动态压缩
if num_image_tokens * num_images > max_image_length:
    compress_factor = (num_image_tokens * num_images) // max_image_length
    image_features = image_features[::compress_factor]

# 坑3：数据均衡（图文比例）
# 现象：纯文本样本占主导，多模态能力退化
# 解决：细粒度控制图文比例, 对无图像样本做downsample
text_only_weight = 0.3  # 纯文本降至30%
multimodal_weight = 0.7  # 图文多模态占70%
```

### 6.2 DeepSpeed 多模态踩坑记录

```python
# 坑1：JSONL解析成为I/O瓶颈
# 现象：GPU利用率降到60%以下
# 解决：使用多进程预处理+缓存

# 预处理JSONL为Arrow格式（10×加速）
import pyarrow as pa
import pyarrow.parquet as pq

def jsonl_to_parquet(jsonl_path, parquet_path):
    table = pq.read_json(jsonl_path)
    pq.write_table(table, parquet_path, compression='snappy')

# 训练时直接读取Parquet
df = pq.read_table(parquet_path).to_pandas()

# 坑2：图像在线解码太慢
# 现象：训练时CPU 100%，GPU等待
# 解决：预提取图像ViT特征 + on-disk缓存

def pre_extract_and_cache(image_paths, vit_model, cache_dir):
    for path in image_paths:
        cache_key = hashlib.md5(path.encode()).hexdigest()
        cache_path = f"{cache_dir}/{cache_key}.npy"
        
        if not os.path.exists(cache_path):
            image = Image.open(path).convert('RGB')
            with torch.no_grad():
                features = vit_model(image).cpu().numpy()
            np.save(cache_path, features)

# 坑3：ZeRO3 + 多模态的大变量问题
# 现象：图像特征作为模型参数被ZeRO分片，通信开销巨大
# 解决：图像特征不通过ZeRO管理，使用DataLoader直接传入
class MultimodalModelWithExternalFeatures(nn.Module):
    def __init__(self, llm, vision_encoder):
        super().__init__()
        self.llm = llm           # ZeRO管理
        self.vision_encoder = vision_encoder  # ZeRO管理
    
    def forward(self, input_ids, attention_mask, pixel_values=None):
        # pixel_values 由DataLoader提供，不经过ZeRO
        if pixel_values is not None:
            vision_outputs = self.vision_encoder(pixel_values)
            # 注入视觉特征
            inputs_embeds = self.llm.model.embed_tokens(input_ids)
            inputs_embeds = inject_vision_tokens(inputs_embeds, vision_outputs)
        else:
            inputs_embeds = None
        
        return self.llm(inputs_embeds=inputs_embeds, 
                       attention_mask=attention_mask)
```

### 6.3 数据格式转换工具

```python
# Megatron bin/idx ↔ JSONL ↔ WebDataset 互转工具

# Megatron → JSONL
def megatron_to_jsonl(bin_path, idx_path, output_path, tokenizer):
    dataset = MMapIndexedDataset(bin_path, idx_path)
    with open(output_path, 'w') as f:
        for i in range(len(dataset)):
            tokens = dataset[i]
            text = tokenizer.detokenize(tokens.tolist())
            json.dump({"text": text}, f)
            f.write('\n')

# JSONL → Megatron
def jsonl_to_megatron(input_path, output_prefix, tokenizer, 
                      append_eod=True, eod_token_id=50256):
    tokenizer = build_tokenizer(tokenizer)
    tokens_list = []
    with open(input_path, 'r') as f:
        for line in f:
            item = json.loads(line)
            tokens = tokenizer.tokenize(item['text'])
            if append_eod:
                tokens = tokens + [eod_token_id]
            tokens_list.append(tokens)
    
    all_tokens = np.concatenate(tokens_list).astype(np.uint16)
    doc_idx = np.cumsum([0] + [len(t) for t in tokens_list])
    write_mmap_data(output_prefix, all_tokens, doc_idx)
```

## 7. 数据流水线性能优化

### 7.1 关键性能指标

| 指标 | 正常值 | 需要优化的信号 |
|------|--------|--------------|
| **GPU 利用率** | >90% | <70% 表示数据加载有瓶颈 |
| **CPU 利用率** | 40-60% | >80% 预处理过重；<20% I/O等待 |
| **I/O 吞吐** | >10GB/s (NVMe) | <1GB/s 存储系统瓶颈 |
| **预处理好时间** | <5ms/样本 | >20ms 需要缓存或预提取 |
| **数据队列空率** | <1% | >5% 数据来不及供应 |

### 7.2 Megatron 数据加载优化

```yaml
# Megatron 数据加载配置优化
# 关键参数说明：
#   num_workers: 数据加载worker数（GPU数×2~4）
#   data_impl: mmap (内存映射，最快)
#   dataloader_type: single / cyclic / external
#   split: 训练/验证/测试比例
#   train_samples: 训练的样本数

# 推荐配置（多模态感知器）
num_workers: 16           # CPU核数相关
data_impl: mmap            # 必须为mmap才能享受MMap加速
dataloader_type: cyclic    # 循环读取，避免epoch结束的同步开销
micro_batch_size: 4        # 每GPU微批大小
global_batch_size: 2048    # 全局批量
seed: 1234
```

### 7.3 DeepSpeed 数据加载优化

```yaml
# DeepSpeed 数据流水线优化
train_batch_size: 2048
gradient_accumulation_steps: 8
  
data_efficiency:
  enabled: true
  # 梯度累积数据的复用（减少数据加载次数）
  gradient_accumulation_reuse: 4
  
dataloader:
  # 多进程加载
  num_workers: 16
  # 预取batch数
  prefetch_factor: 4
  # 使用固定内存加速CPU→GPU传输
  pin_memory: true
  # 持久化worker（避免每次epoch重启）
  persistent_workers: true

# 多模态特殊配置
multimodal:
  image_processor: "vit_huge"      # 图像处理器
  precomputed_features: true       # 预提取特征
  feature_cache_size: 10000        # 特征缓存（样本数）
  online_transform: false          # 是否在线数据增强
```

## 8. 总结

多模态基础模型的数据格式设计没有银弹：

1. **选格式**：纯文本/图文对优先 Megatron bin/idx（极致性能），多模态对话/交错数据优先 DeepSpeed JSONL（灵活性）
2. **图像处理**：百亿级数据量必须预提取ViT特征并缓存，避免在线解码
3. **Token化**：图像占位Token方案（Chameleon风格）在Megatron上实现简单，但序列长度控制是关键
4. **数据混合**：DeepSpeed MoD 天然支持多源数据混合，Megatron需要手动实现 BlendedDataset
5. **性能**：MMap 在大数据量下性能远优于 JSONL，但JSONL适合快速迭代

> 参考来源：NVIDIA Megatron-LM 文档、Microsoft DeepSpeed 文档、Chameleon/CM3Leon 论文、LLaVA 技术报告
