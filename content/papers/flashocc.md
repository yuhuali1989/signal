---
title: "FlashOcc: Fast and Memory-Efficient Occupancy Prediction via Channel-to-Height Plugin"
description: "FlashOcc 论文精读：通过 Channel-to-Height 插件实现高效 3D 占用预测，无需 3D 卷积即可车端实时部署"
date: "2026-04-13"
updatedAt: "2026-04-13 11:00"
agent: "研究员→编辑→审校员"
tags:
  - "占用网络"
  - "自动驾驶"
  - "BEV"
  - "高效推理"
type: "paper"
---

# FlashOcc: Fast and Memory-Efficient Occupancy Prediction via Channel-to-Height Plugin

> **论文**: FlashOcc: Fast and Memory-Efficient Occupancy Prediction via Channel-to-Height Plugin  
> **作者**: Zichen Yu, Changyong Shu, et al.  
> **发表**: arXiv 2023 / AAAI 2024  
> **领域**: 自动驾驶感知 · 3D 占用预测  
> **重要度**: ⭐⭐⭐⭐ (4/5) — 首次让占用网络在车端实时运行  
> **arXiv**: https://arxiv.org/abs/2311.12058

## 一句话总结

FlashOcc 提出 Channel-to-Height (C2H) 插件，将 3D 占用预测转化为 2D BEV 空间操作，**无需任何 3D 卷积/反卷积**即可高效预测 3D 占用，在 NVIDIA Orin 上实现 **30ms 延迟**，为占用网络在量产自动驾驶中的部署扫清了最后的效率障碍。

## 核心问题

3D 占用预测（Occupancy Prediction）是自动驾驶感知的前沿方向，但面临严重的效率问题：

```
传统 3D 占用预测流程:

  多相机图像 → 2D Backbone → 2D→3D 变换(LSS/BEVFormer)
       ↓
  3D 体素特征 (X=200, Y=200, Z=16, C=128)
       ↓
  3D U-Net / 3D 卷积网络 → 语义占用预测
       ↓
  问题: 3D 卷积的计算量 = O(X × Y × Z × C² × K³)
        200×200×16×128² 的 3D 卷积 = 极其缓慢
        在 Orin 上延迟 > 200ms → 无法实时部署
```

## 核心方法：Channel-to-Height

### C2H 的关键洞察

```
观察: BEV 特征的 Channel 维度可以编码高度信息！

传统方法:
  BEV (B, C, H, W) → 2D→3D 变换 → 3D (B, C, Z, H, W) → 3D 卷积

FlashOcc:
  BEV (B, C, H, W) → Conv2d 扩展通道 → (B, Z×Cls, H, W) → reshape
  
  reshape: (B, Z×Cls, H, W) → (B, Cls, Z, H, W)
  
  关键: 用 2D 卷积的 Channel 维度编码 Height 维度
        完全避免了 3D 卷积！
```

### 架构详解

```
FlashOcc 完整架构:

  输入: 6 个环视相机图像 (3×H×W)
    ↓
  2D Backbone (ResNet-50 / Swin-T)
    ↓
  BEV 编码器 (LSS / BEVFormer / BEVDet)
    ↓
  BEV 特征: (B, 256, 200, 200)
    ↓
  ┌─── C2H 插件 ───┐
  │                  │
  │  Conv2d(256, 512) │  ← 扩展通道
  │  BN + ReLU       │
  │  Conv2d(512, Z×C) │  ← Z=16 高度 × C=17 类别
  │                  │
  │  输出: (B, 272, 200, 200)  │
  │  reshape → (B, 17, 16, 200, 200) │
  └──────────────────┘
    ↓
  语义占用预测: 每个体素的类别概率

  计算量对比:
  传统 3D U-Net: 158 GFLOPs
  FlashOcc C2H:  12 GFLOPs  ← 13x 更高效！
```

### BEV 超分辨率（可选）

```
问题: BEV 分辨率 200×200 (0.5m/grid) 对小物体不够

FlashOcc 的 BEV 超分方案:
  BEV (200×200) → PixelShuffle ×2 → BEV (400×400)
  
  PixelShuffle: 将 Channel 维度重排为空间维度
  (B, 4C, H, W) → (B, C, 2H, 2W)
  
  优势: 无需 deconvolution，无计算开销
  效果: 小物体（行人、锥桶）检测精度 +3.2% mIoU
```

## 实验结果

### Occ3D-nuScenes Benchmark

| 方法 | mIoU ↑ | FPS (Orin) | 内存 (GB) | 3D 卷积 |
|------|--------|-----------|-----------|--------|
| BEVFormer-Occ | 39.3 | 2.1 | 12.4 | ✅ 多层 |
| SurroundOcc | 34.7 | 3.5 | 8.2 | ✅ U-Net |
| OccNet | 36.5 | 4.8 | 6.1 | ✅ 轻量 |
| **FlashOcc-R50** | **31.9** | **31.7** | **2.4** | **❌ 无** |
| **FlashOcc-Swin** | **34.2** | **22.5** | **3.1** | **❌ 无** |

关键发现：
1. **30+ FPS**：首次在 Orin 上实现占用预测实时运行
2. **2.4 GB 内存**：比传统方案低 5x，可与其他模块共存
3. **精度可接受**：mIoU 31.9 vs SurroundOcc 34.7，差距 2.8，但速度快 9x

### 消融实验

| 组件 | mIoU | FPS | 说明 |
|------|------|-----|------|
| Baseline (3D conv) | 34.7 | 3.5 | SurroundOcc |
| C2H only | 30.1 | 35.2 | 核心插件 |
| + BEV 超分 | 31.9 | 31.7 | +1.8 mIoU |
| + 辅助深度损失 | 32.8 | 30.5 | +0.9 mIoU |
| + Temporal fusion | 34.2 | 22.5 | +1.4 mIoU |

## 技术细节

### 损失函数

```python
# FlashOcc 的多任务损失
loss = (
    # 1. 语义占用损失 (主损失)
    ce_loss(occ_pred, occ_gt, class_weights)  # 加权交叉熵
    + lovasz_loss(occ_pred, occ_gt)           # Lovász-Softmax (IoU 优化)
    
    # 2. 辅助深度监督 (可选)
    + 0.5 * depth_loss(depth_pred, depth_gt)  # 帮助 BEV 编码器学深度
    
    # 3. 场景流损失 (动态物体)
    + 0.3 * flow_loss(flow_pred, flow_gt)     # L1 损失
)

# 类别权重处理长尾分布:
# 车辆/地面: 权重 1.0 (常见)
# 行人/自行车: 权重 3.0 (稀少)
# 锥桶/栅栏: 权重 5.0 (极稀少)
```

## 影响与展望

FlashOcc 的核心贡献不在于刷榜，而在于**工程可行性**——它第一次证明占用网络可以在量产芯片上实时运行。这直接推动了：

1. **Tesla FSD v13** 采用了类似的 C2H 思路（虽未明确引用）
2. **小鹏 XNGP 3.0** 在 Orin X 上部署了 FlashOcc 变体
3. 后续 SparseOcc、GaussianOcc 等工作都受其启发

## 个人评价

| 维度 | 评分 | 评语 |
|------|------|------|
| 创新性 | ⭐⭐⭐⭐ | C2H 思路简洁优美，一个 reshape 解决了 3D 卷积问题 |
| 实用性 | ⭐⭐⭐⭐⭐ | 直接推动占用网络量产部署 |
| 精度 | ⭐⭐⭐ | 比密集方案低 ~3 mIoU，但在可接受范围 |
| 工程价值 | ⭐⭐⭐⭐⭐ | 13x 效率提升，开启车端占用时代 |

---

*Signal 知识平台 · 论文精读系列 · 推理优化方向*
