---
title: "AI 概念面试题 120 道 - 第3章: CV 计算机视觉篇"
book: "AI 概念面试题 120 道"
chapter: "3"
chapterTitle: "CV 计算机视觉篇"
description: "对标 aioffer CV 分类：CNN 感受野、NMS、图像去重、目标检测、ViT、CLIP/DINOv2、Diffusion 模型、SAM、BEV 感知、NeRF vs 3D Gaussian Splatting、Contrastive SSL 等 20 道高频题，含难度标注"
date: "2026-04-13"
updatedAt: "2026-04-13"
agent: "研究员→编辑→审校员"
tags:
  - "面试"
  - "CV"
  - "计算机视觉"
  - "目标检测"
  - "Diffusion"
  - "ViT"
type: "book"
---

# 第 3 章：CV 计算机视觉篇

> 选自《AI 概念面试题 120 道》· 对标 aioffer.com CV 分类题库

每题标注难度：🟢 Easy · 🟡 Medium · 🔴 Hard

---

## Q56. 什么是 CNN 的感受野（Receptive Field）？如何计算？ 🟢 Easy

**感受野**：输出特征图上某个神经元对应的输入图像区域大小。

**计算公式**（逐层累积）：
```
RF_l = RF_{l-1} + (kernel_size - 1) × stride_product_{1..l-1}
```

**示例**（VGG 风格）：
```
输入：224×224
Conv1（3×3, stride=1）：RF = 3
Conv2（3×3, stride=1）：RF = 5
MaxPool（2×2, stride=2）：RF = 6
Conv3（3×3, stride=1）：RF = 10
Conv4（3×3, stride=1）：RF = 14
```

**为什么重要**：
- 感受野决定了模型能"看到"多大范围的上下文
- 目标检测中，检测大目标需要大感受野
- 增大感受野的方法：增加层数、使用空洞卷积（Dilated Conv）、使用大 kernel

**有效感受野（Effective RF）**：实际上中心区域的贡献远大于边缘，有效感受野约为理论感受野的 1/3。

---

## Q57. 什么是 Non-Maximum Suppression（NMS）？目标检测中如何使用？ 🟡 Medium

**NMS（非极大值抑制）**：在目标检测中，去除重叠的冗余检测框，只保留最优的框。

**算法流程**：
```
1. 按置信度分数降序排列所有检测框
2. 取置信度最高的框 B，加入结果集
3. 计算 B 与其余所有框的 IoU
4. 删除 IoU > 阈值（通常 0.5）的框（认为是重复检测）
5. 重复步骤 2-4，直到没有框剩余
```

**IoU（Intersection over Union）**：
```
IoU = 交集面积 / 并集面积
```

**NMS 变体**：
| 方法 | 原理 | 适用场景 |
|------|------|---------|
| Soft-NMS | 降低重叠框的分数而非删除 | 密集目标（行人检测） |
| DIoU-NMS | 考虑中心点距离 | 更精确的框选择 |
| Class-agnostic NMS | 跨类别抑制 | 减少计算量 |

**DETR**：用 Transformer 直接预测目标，无需 NMS，端到端检测。

---

## Q58. 什么是大规模图像去重（Large-Scale Image De-Duplication）？ 🔴 Hard

**为什么重要**：训练数据中的重复图像导致过拟合；测试集污染；存储浪费。

**图像去重方法**：

| 方法 | 原理 | 速度 | 精确度 |
|------|------|------|-------|
| 精确哈希（MD5） | 像素级完全相同 | 最快 | 只能找完全相同 |
| pHash（感知哈希） | DCT 变换后的低频特征 | 快 | 近似重复（缩放/压缩） |
| dHash | 相邻像素差值 | 快 | 近似重复 |
| SSIM | 结构相似性 | 中 | 感知相似 |
| 深度特征 + ANN | CNN/CLIP 特征 + 近似最近邻 | 慢 | 语义相似 |

**大规模实现**（亿级图像）：
1. 提取轻量特征（pHash 或 CLIP 特征）
2. LSH 分桶，减少比较对数
3. 在候选对中精确计算相似度
4. 构建相似图，找连通分量
5. 每个连通分量保留一张（通常保留分辨率最高的）

**LAION 数据集去重**：LAION-5B 使用 CLIP 特征 + 近似最近邻去除了约 20% 的近似重复图像。

---

## Q59. 什么是 Vision Transformer（ViT）？与 CNN 的核心区别？ 🟡 Medium

**ViT 原理**：将图像分割为固定大小的 patch（通常 16×16），每个 patch 线性投影为 token，输入 Transformer：

```
图像（224×224）→ 分割为 196 个 16×16 patch
→ 每个 patch 展平（768 维）→ 线性投影
→ 加上 [CLS] token 和位置编码
→ Transformer Encoder（12 层）
→ [CLS] token 输出 → 分类头
```

**ViT vs CNN**：
| 对比 | CNN | ViT |
|------|-----|-----|
| 归纳偏置 | 强（局部性、平移不变性） | 弱（需要更多数据学习） |
| 感受野 | 局部到全局（逐层扩大） | 全局（每层都是全局注意力） |
| 数据需求 | 少（归纳偏置帮助） | 多（需要大规模预训练） |
| 可扩展性 | 有限 | 好（Scaling 效果好） |
| 长距离依赖 | 差 | 好 |

**现代 ViT 变体**：DeiT（数据高效）、Swin Transformer（层次化，局部注意力）、MAE（掩码自编码器预训练）

---

## Q60. 什么是 CLIP？Zero-Shot 分类如何工作？DINOv2 和 JEPA 是什么？ 🔴 Hard

**CLIP（Contrastive Language-Image Pre-training）**：
- 收集 4 亿图文对，用对比学习训练图像编码器和文本编码器
- 目标：最大化匹配图文对的相似度，最小化不匹配对的相似度

**Zero-Shot 分类**：
```python
# 无需微调，直接用文本描述分类
text_prompts = ["a photo of a cat", "a photo of a dog", "a photo of a car"]
text_features = clip.encode_text(text_prompts)
image_features = clip.encode_image(image)
similarity = image_features @ text_features.T
predicted_class = similarity.argmax()
```

**DINOv2（Meta）**：
- 自监督视觉预训练，无需文本配对
- 用知识蒸馏 + 对比学习，在大规模图像数据上训练
- 特点：特征质量极高，适合密集预测任务（分割、深度估计）

**JEPA（Joint Embedding Predictive Architecture，LeCun 提出）**：
- 在表示空间（而非像素空间）预测被掩盖的 patch
- 避免了 MAE 在像素空间预测的低效性
- 代表了 LeCun 对"世界模型"的技术路线

---

## Q61. 什么是 Diffusion Models for Image and Video Generation？ 🟡 Medium

**Diffusion Model 原理**：
- **前向过程**：逐步向数据添加高斯噪声，直到变为纯噪声
- **反向过程**：训练神经网络预测并去除噪声，从噪声恢复数据

**Stable Diffusion 核心组件**：
1. **VAE**：将图像压缩到低维潜在空间（减少计算量 64x）
2. **U-Net / DiT**：在潜在空间中进行去噪
3. **CLIP 文本编码器**：将文本提示编码为条件向量
4. **CFG（Classifier-Free Guidance）**：增强文本对图像的控制力

**视频生成（Sora 技术路线）**：
- 将视频分割为时空 patch，统一编码
- 用 Diffusion Transformer（DiT）替代 U-Net
- 支持可变时长/分辨率

**Diffusion vs GAN**：
| 对比 | GAN | Diffusion |
|------|-----|---------|
| 训练稳定性 | 差（对抗训练） | 好（简单去噪目标） |
| 模式覆盖 | 模式崩溃 | 覆盖完整分布 |
| 生成速度 | 快（单次前向） | 慢（多步去噪，DDIM 加速） |

---

## Q62. 什么是 Creative Content Generation Platform - Diffusion Models？ 🟡 Medium

**创意内容生成平台的核心技术**：

**ControlNet**：为 Stable Diffusion 添加额外控制条件（边缘、深度、姿态）：
- 复制 U-Net 编码器，用控制条件作为额外输入
- 通过零卷积（Zero Convolution）将控制信号注入原始 U-Net
- 支持：Canny 边缘、深度图、OpenPose 姿态、分割图

**IP-Adapter**：将参考图像的风格/内容注入生成过程：
- 用图像编码器（CLIP）提取参考图像特征
- 通过解耦的交叉注意力注入 U-Net

**LoRA for Diffusion**：微调 Stable Diffusion 学习特定风格/人物：
- 只训练 U-Net 的低秩矩阵
- 可以组合多个 LoRA（风格 LoRA + 人物 LoRA）

**平台架构**：
```
用户输入（文本 + 参考图 + 控制图）
    ↓
Prompt 增强（LLM 扩写 prompt）
    ↓
Diffusion 生成（SD + ControlNet + IP-Adapter）
    ↓
后处理（超分辨率、人脸修复）
    ↓
安全过滤（NSFW 检测）
```

---

## Q63. 什么是 Visual-based Product Search System？ 🟡 Medium

**以图搜图系统架构**：

```
查询图像 → 特征提取（CLIP/DINOv2）→ 查询向量
                                          ↓
商品图像库 → 离线特征提取 → 向量数据库（Faiss/Milvus）
                                          ↓
                              ANN 检索（Top-K 相似商品）
                                          ↓
                              重排序（考虑颜色、类别等属性）
                                          ↓
                              返回结果（带商品信息）
```

**关键技术**：
- **特征提取**：CLIP 特征（语义）+ 颜色直方图（颜色）+ 局部特征（纹理）
- **多粒度检索**：先粗检索（ANN），再精排（Cross-Encoder）
- **属性过滤**：颜色、类别、价格范围等结构化过滤
- **多模态查询**：文本 + 图像联合查询（"红色连衣裙，类似这张图"）

**挑战**：
- 商品图像多样性（白底图 vs 场景图）
- 相似但不同商品的区分（不同品牌的相似款式）
- 实时性（新商品上架后立即可搜索）

---

## Q64. 什么是 Contrastive SSL（自监督对比学习）？SimCLR vs MoCo？ 🟡 Medium

**自监督对比学习**：无需标签，通过对比正负样本对学习视觉表示。

**核心思想**：同一图像的不同增强视图（正样本对）应该在特征空间中距离近；不同图像（负样本对）应该距离远。

**SimCLR（Google）**：
- 对每张图像生成 2 个增强视图
- 用 NT-Xent 损失（归一化温度交叉熵）
- 需要大 batch size（4096+）才能有足够的负样本
- 简单但显存需求大

**MoCo（Meta）**：
- 维护一个动量更新的编码器（Momentum Encoder）
- 用队列（Queue）存储负样本，无需大 batch
- 动量更新：θ_k = m·θ_k + (1-m)·θ_q（m=0.999）
- 显存友好，可在单 GPU 上训练

**BYOL**：无需负样本，用预测网络防止表示坍塌，效果优于 SimCLR。

**DINOv2**：结合对比学习 + 知识蒸馏 + 正则化，目前最强的自监督视觉模型。

---

## Q65. 什么是 Open-Vocab Detection with Grounding DINO？ 🔴 Hard

**传统目标检测的局限**：只能检测训练时见过的固定类别（如 COCO 的 80 类）。

**Open-Vocabulary Detection（开放词汇检测）**：检测任意文本描述的目标，不限于预定义类别。

**Grounding DINO 原理**：
- 将文本描述（如"红色的苹果"）和图像同时输入
- 用 DINO（自监督 ViT）提取图像特征
- 用 BERT 提取文本特征
- 通过跨模态注意力融合，预测与文本对应的检测框

**架构**：
```
图像 → ViT 编码器 → 图像特征
文本 → BERT 编码器 → 文本特征
→ 跨模态融合（Cross-Attention）
→ 检测头（预测框 + 文本对应分数）
```

**应用**：
- 零样本目标检测（无需标注新类别）
- 开放世界目标检测
- 视觉问答中的定位

---

## Q66. 什么是 BEV Perception for Autonomous Driving？ 🔴 Hard

**BEV（Bird's Eye View，鸟瞰图）感知**：将多个摄像头/激光雷达的感知结果统一到鸟瞰图坐标系中，便于规划和控制。

**为什么需要 BEV**：
- 多传感器融合需要统一坐标系
- 规划算法在 BEV 空间中更简单（2D 而非 3D）
- 避免透视变换带来的尺度歧义

**BEVFusion 架构**：
```
多摄像头图像 → 2D 特征提取（ResNet/ViT）
                    ↓
              视角变换（LSS/BEVFormer）→ BEV 特征
激光雷达点云 → 3D 特征提取（VoxelNet）→ BEV 特征
                    ↓
              BEV 特征融合（拼接 + 卷积）
                    ↓
              检测头（3D 目标检测）+ 分割头（语义分割）
```

**视角变换方法**：
- **LSS（Lift-Splat-Shoot）**：预测每个像素的深度分布，将 2D 特征"提升"到 3D
- **BEVFormer**：用可变形注意力在 BEV 空间查询图像特征

---

## Q67. 什么是 Segment Anything Model（SAM）？ 🟡 Medium

**SAM（Meta，2023）**：通用图像分割模型，支持任意提示（点、框、文本）分割任意目标。

**架构**：
```
图像 → Image Encoder（MAE 预训练的 ViT-H）→ 图像嵌入（一次计算，可复用）
提示（点/框/文本）→ Prompt Encoder → 提示嵌入
图像嵌入 + 提示嵌入 → Mask Decoder（轻量 Transformer）→ 分割掩码
```

**关键设计**：
- **图像编码器只运行一次**：对同一图像的多次提示，图像嵌入可以复用
- **轻量 Mask Decoder**：只有 4 层 Transformer，推理极快
- **多义性处理**：输出 3 个候选掩码（整体/部分/子部分），让用户选择

**SAM 2**（2024）：扩展到视频分割，支持跨帧追踪目标。

**应用**：数据标注（自动生成分割标注）、医学图像分析、AR/VR、机器人抓取。

---

## Q68. 什么是 NeRF vs 3D Gaussian Splatting？ 🟡 Medium

**NeRF（Neural Radiance Field）**：
- 用 MLP 隐式表示 3D 场景（输入位置+方向，输出颜色+密度）
- 通过体积渲染（Volume Rendering）生成新视角图像
- 优点：表示连续，质量高；缺点：训练慢（数小时），渲染慢（秒级/帧）

**3D Gaussian Splatting（3DGS）**：
- 用数百万个 3D 高斯椭球显式表示场景
- 通过可微分光栅化（Differentiable Rasterization）渲染
- 优点：训练快（分钟级），渲染快（实时 100+ FPS）；缺点：存储大，编辑困难

**对比**：
| 对比 | NeRF | 3D Gaussian Splatting |
|------|------|----------------------|
| 表示方式 | 隐式（MLP） | 显式（高斯椭球） |
| 训练时间 | 数小时 | 数分钟 |
| 渲染速度 | 慢（秒级） | 实时（100+ FPS） |
| 存储 | 小（MLP 参数） | 大（数百万高斯） |
| 编辑性 | 差 | 较好 |

**应用**：虚拟场景重建、AR/VR、电影特效、自动驾驶仿真。

---

## Q69. 什么是 DiT（Diffusion Transformer）和 Flow Matching？ 🟡 Medium

**DiT（Diffusion Transformer）**：用 Transformer 替代 U-Net 作为 Diffusion 的去噪网络：
- 将图像 patch 作为 token 输入 Transformer
- 用 AdaLN（自适应层归一化）注入时间步和条件信息
- Scaling 效果好（更大的 DiT 效果更好）
- Sora、Stable Diffusion 3 都使用 DiT

**Flow Matching（流匹配）**：
- 比 DDPM 更简单的生成框架
- 直接学习从噪声到数据的"流"（向量场）
- 训练目标：预测从噪声到数据的直线路径
- 优点：推理步数更少（10-20 步 vs DDPM 的 1000 步），训练更稳定

**Rectified Flow**：Flow Matching 的一种实现，用直线路径连接噪声和数据，Stable Diffusion 3 使用。

---

## Q70. 什么是 Invoice OCR：LayoutLM & Tables？ 🔴 Hard

**文档理解的挑战**：发票/表格不仅有文字，还有版面结构（位置关系）和视觉信息（字体、颜色）。

**LayoutLM 系列**：
- **LayoutLM v1**：BERT + 2D 位置编码（每个 token 的边界框坐标）
- **LayoutLM v2**：加入视觉特征（ResNet 提取的图像特征）
- **LayoutLM v3**：统一文本和图像 token，用掩码预训练

**表格理解**：
```
表格图像 → OCR（文字识别 + 位置）
         → 表格结构识别（行/列/单元格边界）
         → 单元格内容提取
         → 结构化输出（JSON/CSV）
```

**关键技术**：
- **TableFormer**：用 Transformer 预测表格结构（行列关系）
- **TATR（Table Transformer）**：将表格检测和结构识别统一为目标检测问题

**发票信息提取流程**：
1. 版面分析（检测标题、表格、印章区域）
2. OCR（文字识别）
3. 关键信息提取（发票号、金额、日期）
4. 结构化输出 + 校验（金额合计验证）

---

## Q71. 什么是 Causal Spatiotemporal Tokens in Video ViTs？ 🔴 Hard

**视频理解的挑战**：视频 = 图像序列，需要同时建模空间（每帧内）和时间（帧间）关系。

**Causal（因果）设计**：视频生成需要因果注意力（只能看到过去帧，不能看到未来帧），与视频理解（可以看全部帧）不同。

**时空 Token 化**：
- 将视频分割为时空 patch（如 2×16×16，2 帧 × 16×16 像素）
- 每个时空 patch 作为一个 token
- 位置编码：空间位置编码 + 时间位置编码

**Video ViT 变体**：
| 模型 | 时间建模方式 | 特点 |
|------|------------|------|
| TimeSformer | 分离时间和空间注意力 | 计算高效 |
| ViViT | 时空联合注意力 | 质量高但计算量大 |
| VideoMAE | 掩码视频自编码器预训练 | 数据高效 |
| Sora | 时空 patch + DiT | 视频生成 |

**因果视频生成**：Sora 等模型使用因果注意力，确保生成的每帧只依赖之前的帧，支持流式生成。

---

## Q72. 什么是 Multi-Rate Sensor Fusion MOT（多目标追踪）？ 🟡 Medium

**MOT（Multiple Object Tracking）**：在视频序列中同时追踪多个目标，维护每个目标的轨迹。

**核心挑战**：
- 目标遮挡（被其他物体挡住）
- 目标外观变化（光照、角度）
- ID 切换（同一目标被分配不同 ID）
- 新目标出现 / 旧目标消失

**Multi-Rate Sensor Fusion**：不同传感器有不同的采样频率（摄像头 30fps，激光雷达 10fps），需要时间对齐和融合：
```
摄像头（30fps）→ 目标检测 → 高频观测
激光雷达（10fps）→ 3D 检测 → 低频但精确的深度信息
→ 卡尔曼滤波 / 粒子滤波 → 统一时间轴上的状态估计
→ 匈牙利算法 → 检测框与轨迹的最优匹配
```

**代表算法**：
- **SORT**：卡尔曼滤波 + 匈牙利算法，简单高效
- **DeepSORT**：SORT + 外观特征（Re-ID），减少 ID 切换
- **ByteTrack**：利用低置信度检测框，减少遮挡时的 ID 切换

---

## Q73. 什么是 Doc AI Aspect Ratio Pipeline？ 🟢 Easy

**文档 AI 中的宽高比处理**：文档图像（发票、合同、表格）有各种宽高比，需要统一处理。

**问题**：
- 直接 resize 到固定大小（如 224×224）会导致文字变形，OCR 精度下降
- 不同文档类型有不同的最优分辨率

**处理策略**：

| 策略 | 原理 | 适用场景 |
|------|------|---------|
| Padding + Resize | 保持宽高比，填充到目标大小 | 通用 |
| 动态分辨率 | 根据文档内容选择最优分辨率 | 高精度 OCR |
| 分块处理 | 将长文档分成多个块分别处理 | 超长文档 |
| 多尺度处理 | 在多个分辨率下处理，融合结果 | 混合内容文档 |

**LLaVA-HD / InternVL 的动态分辨率**：
- 将高分辨率图像分割为多个 448×448 的 tile
- 每个 tile 独立编码，再拼接
- 支持任意宽高比，保持文字清晰度

---

## Q74. 什么是 CUDA GEMM Tiling & Tensor Cores？ 🔴 Hard

**GEMM（General Matrix Multiplication）**：深度学习中最核心的计算操作，卷积和注意力都可以转化为 GEMM。

**Tiling（分块）优化**：
- GPU 的 SRAM（共享内存）比 DRAM（全局内存）快 100x
- 将大矩阵分成小块，在共享内存中完成计算，减少 DRAM 访问
- 关键参数：tile 大小（通常 16×16 或 32×32）

**Tensor Cores（NVIDIA）**：
- 专门为矩阵乘法设计的硬件单元
- A100：支持 FP16/BF16/INT8/FP8 的 4×4 矩阵乘法
- 相比 CUDA Core，Tensor Core 的 FLOPS 高 8-16x
- 要求矩阵维度是 8 或 16 的倍数（否则无法充分利用）

**cuBLAS vs 自定义 CUDA Kernel**：
- cuBLAS：NVIDIA 优化的 BLAS 库，大多数情况下最优
- 自定义 Kernel（如 Flash Attention）：针对特定访存模式优化，可以超越 cuBLAS

**VLIW Kernel Optimization**：在 AMD GPU 上，VLIW（超长指令字）架构需要手动调度指令以充分利用硬件。

---

## Q75. 什么是 VLIW Kernel Optimization？ 🔴 Hard

**VLIW（Very Long Instruction Word）**：一种处理器架构，将多个操作打包在一条超长指令中，由编译器负责指令调度（而非硬件）。

**AMD GPU 的 VLIW 历史**：早期 AMD GPU（GCN 之前）使用 VLIW4/VLIW5 架构，需要手动优化指令打包。

**现代 GPU Kernel 优化原则**：
1. **内存访问合并（Coalesced Memory Access）**：相邻线程访问相邻内存地址
2. **避免 Bank Conflict**：共享内存的 bank 冲突会导致串行化
3. **隐藏内存延迟**：用足够多的 warp 隐藏内存访问延迟
4. **指令级并行（ILP）**：在等待内存时执行其他计算指令
5. **寄存器复用**：减少寄存器溢出（Register Spilling）

**Triton（OpenAI）**：Python 级别的 GPU Kernel 编写框架，自动处理 tiling 和内存优化，比手写 CUDA 更简单。

---

## Q76. 什么是 World Models for Sim-to-Real？ 🔴 Hard

**World Model（世界模型）**：能够预测环境状态变化的模型，给定当前状态和动作，预测下一个状态。

**Sim-to-Real（仿真到真实）**：在仿真环境中训练的策略迁移到真实世界。

**挑战（Reality Gap）**：
- 视觉差异（仿真图像 vs 真实图像）
- 物理差异（仿真物理引擎不够精确）
- 动力学差异（真实机器人的摩擦、延迟等）

**World Model 在 Sim-to-Real 中的应用**：
```
真实世界数据 → 训练 World Model（预测下一帧）
                    ↓
              在 World Model 中训练策略（无需真实机器人）
                    ↓
              策略迁移到真实世界（World Model 减小了 Reality Gap）
```

**代表工作**：
- **DreamerV3**：用 World Model 在 Atari/机器人任务上达到人类水平
- **GAIA-1（Wayve）**：自动驾驶世界模型，生成真实感驾驶视频
- **UniSim**：通用仿真器，用扩散模型生成交互式场景
