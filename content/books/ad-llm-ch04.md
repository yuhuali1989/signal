---
title: "自动驾驶大模型深度研究 - 第4章: 感知大模型：BEV 与占用网络"
book: "自动驾驶大模型深度研究"
chapter: "4"
chapterTitle: "感知大模型：BEV 与占用网络"
description: "全面解析大模型如何重塑自动驾驶技术栈：从 BEV 变换到 3D 占用网络，从端到端感知到 VLA 融合，含最新 FlashOcc/SparseOcc/StreamPETR v2 架构分析"
date: "2026-04-11"
updatedAt: "2026-04-13 11:00"
agent: "研究员→编辑→审校员"
tags:
  - "自动驾驶"
  - "BEV"
  - "占用网络"
  - "端到端"
  - "VLA"
type: "book"
---

# 第 4 章：感知大模型：BEV 与占用网络

> 选自《自动驾驶大模型深度研究》
> 
> 本章从 2D 感知到 3D BEV，从体素占用到端到端 VLA，系统梳理自动驾驶感知大模型的完整技术演进路线。

## 4.1 从 2D 感知到 3D 感知的范式转变

传统自动驾驶感知在各传感器的原始坐标系中独立处理数据，然后通过后融合得到 3D 结果。这种方式存在根本性缺陷——**信息在融合前就已经丢失**。

```
传统方案 (后融合):
  Camera → 2D 检测 ──┐
  LiDAR → 3D 检测 ───┤→ 后融合 → 3D 结果
  Radar → 目标检测 ──┘
  问题: 各传感器独立处理，信息损失大

BEV 方案 (特征级融合):
  Camera → 特征提取 ──┐
  LiDAR → 特征提取 ───┤→ BEV 空间融合 → 3D 结果
  Radar → 特征提取 ──┘
  优势: 在统一空间中融合，信息保留完整

VLA 方案 (2026 前沿):
  Camera + LiDAR + Map ──→ BEV 特征
       ↓
  VLA (Vision-Language-Action) 模型
       ↓
  感知 + 预测 + 规划 + 控制 端到端输出
  优势: 一个模型完成全栈任务
```

### 4.1.1 感知技术演进时间线

| 阶段 | 时间 | 代表方案 | 核心思想 |
|------|------|---------|---------|
| 2D 感知 | 2015-2019 | YOLO/SSD/Faster-RCNN | 在图像平面检测 2D 框 |
| 3D 检测 | 2019-2021 | PointPillars/CenterPoint | LiDAR 点云直接 3D 检测 |
| BEV 统一 | 2021-2023 | BEVFormer/BEVFusion | 多传感器投影到鸟瞰图 |
| 占用网络 | 2023-2024 | SurroundOcc/OccWorld | 3D 体素级场景理解 |
| 端到端 | 2024-2025 | UniAD/VAD | 感知-预测-规划一体化 |
| **VLA 融合** | **2025-2026** | **DriveWorld-VLA** | **语言+视觉+动作端到端** |

## 4.2 BEV（Bird's Eye View）感知

### 4.2.1 BEV 的核心思想

BEV 将所有传感器的特征统一投影到**鸟瞰图空间**（俯视地面的 2D 平面），在这个统一空间中进行感知：

```
BEV 特征空间:

  Y (前方)
  ↑
  │  ┌──────────────────────┐
  │  │                      │
  │  │   ○ 行人              │
  │  │        ╔══╗           │
  │  │        ║车║           │
  │  │        ╚══╝           │
  │  │   ┄┄┄┄┄┄ 车道线 ┄┄┄┄ │
  │  │                      │
  │  │     [EGO]            │
  │  └──────────────────────┘
  └──────────────────────────→ X (右方)
  
  分辨率: 200×200 网格, 每格 0.5m
  覆盖范围: [-50m, 50m] × [-50m, 50m]
```

### 4.2.2 两种视角变换方法

**方法 1: 显式深度估计（LSS/BEVDet）**

```python
class LSSViewTransform:
    """Lift-Splat-Shoot 视角变换"""
    
    def lift(self, img_features, depth_dist):
        """
        Lift: 将 2D 图像特征提升到 3D
        img_features: (B, N_cam, C, H, W) — N_cam 个相机特征
        depth_dist:   (B, N_cam, D, H, W) — 每个像素的深度分布
        
        原理: 对每个像素，在 D 个深度候选处放置特征
        输出: 3D 点云特征 (B, N_cam, D, C, H, W)
        """
        # 外积: 特征 × 深度概率 = 加权 3D 特征
        return img_features.unsqueeze(2) * depth_dist.unsqueeze(3)
    
    def splat(self, points_3d, voxel_grid):
        """
        Splat: 将 3D 点特征累加到 BEV 网格
        points_3d → 通过相机内外参转换到世界坐标 → 落入 BEV 网格
        累加: 多个点落入同一网格时求和
        """
        # 体素化 + Sum Pooling
        bev = scatter_add(points_3d, voxel_indices, dim=0)
        return bev  # (B, C, Bev_H, Bev_W)
```

**方法 2: 隐式学习（BEVFormer）**

```python
class BEVFormer(nn.Module):
    """BEVFormer: 用 Transformer 注意力隐式学习视角变换"""
    
    def __init__(self, bev_h=200, bev_w=200, embed_dim=256):
        super().__init__()
        # 可学习的 BEV 查询 — 模型自动学习"在哪看"
        self.bev_queries = nn.Parameter(
            torch.randn(bev_h * bev_w, embed_dim)
        )
        
        # 时序自注意力：融合历史 BEV 特征
        self.temporal_self_attn = DeformableAttention(
            embed_dim=embed_dim,
            num_heads=8,
            num_points=4  # 每个 Query 关注 4 个可学习的参考点
        )
        
        # 空间交叉注意力：从多相机特征中采样
        self.spatial_cross_attn = SpatialCrossAttention(
            embed_dim=embed_dim,
            num_cameras=6,     # 6 个环视相机
            num_points=8,      # 每个 BEV Query 在每个相机采样 8 个点
            num_levels=4       # 多尺度特征 (FPN)
        )
    
    def forward(self, multi_camera_features, prev_bev=None):
        bev = self.bev_queries
        
        # 1. 时序自注意力：与上一帧 BEV 融合（利用时序一致性）
        if prev_bev is not None:
            bev = self.temporal_self_attn(
                query=bev, key=prev_bev, value=prev_bev
            )
        
        # 2. 空间交叉注意力：从相机特征中提取信息
        # BEV Query → 3D 参考点 → 投影到各相机 → 采样特征
        bev = self.spatial_cross_attn(
            query=bev,
            multi_camera_features=multi_camera_features
        )
        
        return bev.reshape(200, 200, -1)  # (H, W, C)
```

### 4.2.3 BEVFusion：多模态 BEV 融合

```
BEVFusion 架构:

  Camera 图像 (6 views) → Backbone → LSS → Camera BEV
                                                  ↓
                                          BEV 特征拼接 → 融合卷积 → 统一 BEV
                                                  ↑
  LiDAR 点云 → VoxelNet → 体素化 → LiDAR BEV

  关键创新: BEV 空间是天然的融合界面
  - Camera BEV 提供语义信息（颜色、纹理、类别）
  - LiDAR BEV 提供几何信息（精确距离、3D 结构）
  - 在 BEV 空间拼接后联合推理
```

### 4.2.4 StreamPETR v2：流式时序感知

```
StreamPETR v2 的时序 Object Query 传播:

  帧 t-2: [Q1, Q2, Q3, ...] → 3D 检测结果
              ↓ (位置更新 + 特征传播)
  帧 t-1: [Q1', Q2', Q3', Q_new] → 3D 检测结果
              ↓ (位置更新 + 特征传播)
  帧 t:   [Q1'', Q2'', Q3'', Q_new'] → 3D 检测结果

  核心: Object Query 跨帧传播，类似目标跟踪
  - Query 位置随时间更新（考虑自车运动补偿）
  - 长时间未被匹配的 Query 被移除
  - 新出现的物体分配新 Query
  
  优势:
  1. 检测和跟踪统一为一个 Query 传播过程
  2. 利用时序冗余提升远距离检测精度
  3. 延迟仅增加 1-2ms（无需重新处理历史帧）
```

## 4.3 占用网络（Occupancy Network）

### 4.3.1 为什么需要占用网络

BEV 是 2D 俯视图，丢失了**高度信息**。对于自动驾驶，高度至关重要：

```
BEV 无法区分的场景:

  场景 1: 立交桥          场景 2: 低矮障碍物
  
  ┌─────────┐ 桥面        ┌─────────┐
  │ 桥上的车 │            │         │
  └─────────┘            │  正常路面 │
  ═══════════ 地面        │         │
  │ 你的车  │            └────┬────┘
                              │ 15cm 路沿
                         ═════╪═════
  BEV 中两车重叠！         BEV 中路沿不可见！
  → 错误制动               → 可能剐蹭
  
  场景 3: 限高杆           场景 4: 悬空物体
  ══════════ 限高 2.0m     ┌───┐ 交通灯
  │ 大货车 │              │   │
  └────────┘              └─┬─┘
  ═══════════              ═══════════
  BEV 中限高杆不可见！     BEV 中以为是障碍物！
```

### 4.3.2 3D 占用网络基本原理

```
3D 占用空间:

  分辨率: 200×200×16 (X×Y×Z)
  体素大小: 0.5m × 0.5m × 0.5m
  覆盖: [-50m, 50m] × [-50m, 50m] × [-5m, 3m]
  
  每个体素预测:
  - 是否被占用 (binary)
  - 语义类别 (17 类: 车/人/建筑/植被/路面/...)
  - 运动流 (vx, vy, vz) — 动态物体的速度向量

  总输出: 200 × 200 × 16 × (1 + 17 + 3) = 1344 万个预测值
```

### 4.3.3 关键模型演进

| 模型 | 年份 | 核心创新 | 输入 | mIoU |
|------|------|---------|------|------|
| **MonoScene** | 2022 | 首个纯视觉 3D 占用预测 | 单目 | 11.1 |
| **TPVFormer** | 2023 | 三平面表示降低计算量 | 多相机 | 27.3 |
| **SurroundOcc** | 2023 | 多尺度 BEV→3D 提升 | 多相机 | 34.7 |
| **OccWorld** | 2024 | 4D 占用预测（含时序） | 多相机 | 36.5 |
| **FlashOcc** | 2024 | Channel-to-Height + BEV 超分 | 多相机 | 31.9 |
| **SparseOcc** | 2024 | 稀疏表示，只预测被占用的体素 | 多相机 | 35.2 |
| **GaussianOcc** | 2025 | 3D Gaussian Splatting | 多相机 | 38.1 |

### 4.3.4 FlashOcc：高效占用预测

```python
class FlashOcc(nn.Module):
    """FlashOcc: Channel-to-Height 高效占用预测
    
    核心思路: 不直接预测 3D 体素，而是：
    1. 在 BEV 空间预测（200×200）
    2. Channel 维度编码高度信息
    3. reshape Channel → Height
    """
    
    def __init__(self, bev_channels=256, height_bins=16, num_classes=17):
        super().__init__()
        self.bev_encoder = BEVEncoder()  # 生成 BEV 特征
        
        # Channel-to-Height: 扩展 Channel 到 height × classes
        self.occ_head = nn.Sequential(
            nn.Conv2d(bev_channels, height_bins * num_classes, 1),
            # (B, H*C, BEV_H, BEV_W) → (B, C, H, BEV_H, BEV_W)
        )
    
    def forward(self, images):
        bev = self.bev_encoder(images)        # (B, 256, 200, 200)
        occ = self.occ_head(bev)              # (B, 16*17, 200, 200)
        occ = occ.reshape(-1, 17, 16, 200, 200)  # (B, C, Z, X, Y)
        return occ

# 优势:
# 1. 无需真正的 3D 卷积（计算量降低 10x）
# 2. BEV 编码器可以复用现有的 2D 模型
# 3. 精度损失仅 ~2% mIoU
# 4. 延迟 < 30ms（可车端实时部署）
```

### 4.3.5 SparseOcc：稀疏占用表示

```
SparseOcc 的核心思想:

  3D 空间中大部分体素是空的（97%+），全量预测浪费大量计算。
  
  密集方案（传统）:
  ┌────────────────┐
  │  ·  ·  ·  ■  · │  预测所有 200×200×16 = 640K 个体素
  │  ·  ·  ■  ■  · │  计算量: O(H × W × Z)
  │  ·  ·  ■  ·  · │
  │  ■  ■  ·  ·  · │
  └────────────────┘
  
  稀疏方案（SparseOcc）:
  Step 1: 粗粒度预测哪些区域被占用
  Step 2: 只在被占用的区域做细粒度预测

  ┌────────────────┐  →  [■] [■■] [■] [■■]
  │  ·  ·  ·  ■  · │     只处理 4 个区域
  │  ·  ·  ■  ■  · │     计算量: O(K) << O(H×W×Z)
  │  ·  ·  ■  ·  · │     K = 被占用体素数（通常 < 3%）
  │  ■  ■  ·  ·  · │
  └────────────────┘
  
  性能: mIoU 35.2（密集方案级别），FPS 20+（2x 加速）
```

### 4.3.6 占用网络的标注方案

```
标注数据是占用网络的核心挑战:

方案 1: LiDAR 点云自动标注
  16 线/32 线/128 线 LiDAR → 点云累积 → 体素化 → 自动标注
  优点: 成本低，可大规模
  缺点: 远距离稀疏，小物体遗漏

方案 2: 多帧累积 + SLAM
  连续 N 帧 LiDAR + 高精定位 → 累积稠密点云 → 体素标注
  优点: 密度高（接近稠密）
  缺点: 运动物体有残影

方案 3: 人工 3D 标注
  3D 标注工具 → 逐体素标注
  优点: 精度最高
  缺点: 成本极高（$50/帧 vs $0.5/帧 自动标注）

方案 4: 自监督占用预测（2025-2026 趋势）
  用下一帧作为监督信号:
  预测 t+1 帧的占用 → 渲染 → 与 t+1 帧真实图像对比
  优点: 无需任何标注
  缺点: 精度仍低于有监督方案 ~5 mIoU
```

## 4.4 从感知到端到端

### 4.4.1 UniAD：统一自动驾驶

```
UniAD 流水线:

  多相机图像 → BEV 特征提取
                 ↓
  ┌─── 感知模块 ───┐
  │ 3D 检测        │ → 物体 Query (位置/尺寸/类别/速度)
  │ 语义分割       │ → BEV 语义图 (可行驶区域/车道线)
  │ 地图构建       │ → 矢量化高精地图
  └────────────────┘
           ↓
  ┌─── 预测模块 ───┐
  │ 轨迹预测       │ → 每个物体未来 3s 的 6 条多模态轨迹
  │ 占用预测       │ → 未来 BEV 占用图 (可行驶空间)
  └────────────────┘
           ↓
  ┌─── 规划模块 ───┐
  │ 自车规划       │ → 未来 3s 自车轨迹 (10 个路径点)
  │ 安全约束       │ → 碰撞检测 + 轨迹修正
  └────────────────┘
```

### 4.4.2 VAD：矢量化自动驾驶

```python
class VAD(nn.Module):
    """VAD (Vectorized Autonomous Driving)
    
    核心创新: 用矢量化地图替代栅格化表示
    - 车道线 → Bezier 曲线参数
    - 道路边界 → 多段线
    - 物体 → 轨迹点序列
    """
    
    def forward(self, images, ego_state):
        # 1. BEV 编码
        bev_features = self.bev_encoder(images)  # (B, C, H, W)
        
        # 2. 矢量化场景元素
        map_queries = self.map_decoder(bev_features)
        # 输出: N 条车道线，每条用 20 个控制点描述
        
        agent_queries = self.agent_decoder(bev_features)
        # 输出: M 个 Agent，每个有 6 条候选未来轨迹
        
        # 3. 规划
        ego_plan = self.planner(
            bev_features, 
            map_queries,     # 地图约束
            agent_queries,   # 他车预测
            ego_state        # 自车状态
        )
        # 输出: 未来 3 秒的 10 个路径点 + 速度
        
        return ego_plan
```

### 4.4.3 端到端的核心优势与挑战

| 方面 | 优势 | 挑战 |
|------|------|------|
| **信息传递** | 感知特征直接传给规划，无量化损失 | 错误会端到端传播 |
| **全局优化** | 统一损失函数联合训练 | 训练不稳定，需精细调参 |
| **交互建模** | Transformer 天然建模物体交互 | 长尾场景数据不足 |
| **部署** | 一个模型替代多个模块 | 单点故障风险 |
| **可解释性** | — | 难以解释决策原因 |

## 4.5 VLA 与感知的融合

### 4.5.1 DriveWorld-VLA 的感知层

```
DriveWorld-VLA 在感知层的创新:

  传统端到端: BEV → 检测/分割 → 预测 → 规划
  DriveWorld:  BEV → 世界模型编码 → VLA 统一推理

  ┌──────────────────────────────────────────┐
  │         DriveWorld-VLA 感知层              │
  ├──────────────────────────────────────────┤
  │                                           │
  │  多相机图像 → BEVFormer-v3               │
  │                    ↓                      │
  │  BEV 特征 → 世界模型 (Latent Dynamics)    │
  │    ├── 当前状态编码 z_t                    │
  │    ├── 未来状态预测 z_{t+1..t+T}          │
  │    └── 奖励预测 r(z_t, a_t)              │
  │                    ↓                      │
  │  VLA 解码器: z_t → (感知, 预测, 动作)      │
  │    ├── 3D 检测: 物体位置/类别/速度         │
  │    ├── 语义地图: 车道线/可行驶区域          │
  │    └── 规划动作: 转向角/加速度             │
  └──────────────────────────────────────────┘

  关键区别:
  - 不再需要显式的中间表示（检测框、语义图）
  - 世界模型在潜在空间直接预测未来
  - VLA 统一输出感知+动作，无中间量化损失
```

### 4.5.2 感知质量对 VLA 的影响

```
实验数据 (nuScenes 规划任务):

感知方案        | NDS ↑  | Planning L2 ↓ | 碰撞率 ↓
BEVFormer       | 51.7   | 2.31m         | 0.31%
BEVFormer + Occ | 53.2   | 1.98m         | 0.24%
StreamPETR v2   | 55.8   | 1.72m         | 0.19%
DriveWorld-VLA  | —      | **1.15m**     | **0.08%**

结论:
1. 更好的 BEV 编码器直接提升规划质量
2. 占用网络补充高度信息后碰撞率显著下降
3. VLA 端到端方案大幅领先模块化方案
```

## 4.6 工程部署考量

### 4.6.1 车端部署约束

```
车端部署典型约束:

  ┌──────────────────────────────────────────────────┐
  │ 硬件平台对比                                       │
  ├────────────┬─────────────┬────────────┬──────────┤
  │ 平台        │ NVIDIA Orin │ NVIDIA Thor│ 华为昇腾  │
  ├────────────┼─────────────┼────────────┼──────────┤
  │ 算力(TOPS)  │ 275 (INT8)  │ 2000       │ 400      │
  │ 功耗(W)     │ 60          │ 100        │ 80       │
  │ 内存(GB)    │ 32          │ 64         │ 48       │
  │ 延迟要求    │ <50ms       │ <30ms      │ <40ms    │
  └────────────┴─────────────┴────────────┴──────────┘
```

### 4.6.2 模型优化流程

```python
# 完整的车端部署优化流程

# Step 1: 量化
from torch.quantization import quantize_dynamic
model_int8 = quantize_dynamic(
    model, 
    {nn.Linear, nn.Conv2d},
    dtype=torch.qint8
)
# 精度损失: < 1% mAP, 速度提升: 2-3x

# Step 2: TensorRT 编译
import tensorrt as trt
engine = trt.build_engine(
    onnx_model,
    fp16=True,
    int8=True,
    workspace_size=4 * 1024 * 1024 * 1024,  # 4GB
    calibration_dataset=calib_loader,
)
# 额外加速: 1.5-2x

# Step 3: 多帧复用优化
class EfficientBEV:
    """隔帧策略: 降低高分辨率特征提取频率"""
    
    def forward(self, images, frame_idx):
        if frame_idx % 3 == 0:  # 每 3 帧做一次完整编码
            self.full_features = self.backbone(images)
        else:  # 中间帧用轻量级更新
            self.full_features = self.light_update(
                images, self.full_features
            )
        return self.bev_transform(self.full_features)
    # 计算量降低: ~40%

# Step 4: 算子融合
# Conv + BN + ReLU → 融合为一个 kernel
# Attention 的 QKV 投影 → 合并为一次 GEMM
```

### 4.6.3 精度-延迟 Pareto 前沿

```
2026 年主流方案在 Orin 上的表现:

  mAP/NDS ↑
  60 │                          ★ StreamPETR v2 (42ms)
     │                 ★ BEVFormer v2 (48ms)
  55 │          ★ BEVDet4D-TP (35ms)
     │     ★ PETR-TP (28ms)
  50 │ ★ CenterPoint (22ms)
     │
  45 │
     └───────────────────────────────────→ 延迟 (ms)
      20      30      40      50

  最优选择:
  - 要求 <30ms: CenterPoint + LiDAR
  - 要求 <50ms: BEVFormer v2 (最佳精度)
  - 纯视觉方案: StreamPETR v2 (42ms, 无需 LiDAR)
```

## 4.7 小结与展望

本章从 BEV 到占用网络再到端到端 VLA，梳理了感知大模型的完整技术栈。关键要点：

1. **BEV 统一空间**是多传感器融合的基石，BEVFormer 系列代表了 Transformer 路线的成熟
2. **占用网络**补上了 BEV 缺失的高度信息，FlashOcc/SparseOcc 让车端部署成为可能
3. **端到端**是大趋势，UniAD/VAD 验证了可行性，VLA 将其推向极致
4. **世界模型**（Genie 3/UniSim 2）正在改变感知数据的生成方式，从实采走向仿真
5. **车端部署**仍是最大瓶颈，INT8 + TensorRT + 多帧复用是标配优化组合

展望 2027：随着 NVIDIA Thor 芯片量产和世界模型成熟，**感知-世界模型-VLA** 三位一体的架构将成为 L4 自动驾驶的标准范式。

---

*本章由 Signal 知识平台 AI 智能体自动生成并深度修订。*
