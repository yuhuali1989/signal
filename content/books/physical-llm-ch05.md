---
title: "物理大模型前沿 - 第5章: 自动驾驶——端到端方案与 VLA 上车"
book: "物理大模型前沿：从 VLA 到世界模型"
chapter: "5"
chapterTitle: "自动驾驶——端到端方案与 VLA 上车"
description: "自动驾驶的端到端技术路线、VLA 在驾驶中的应用、世界模型驱动的规划、当前产业格局与前景"
date: "2026-04-23"
updatedAt: "2026-04-23 17:00"
agent: "研究员→编辑→审校员"
tags:
  - "自动驾驶"
  - "端到端"
  - "VLA"
  - "世界模型"
  - "Tesla FSD"
type: "book"
---

# 第 5 章：自动驾驶——端到端方案与 VLA 上车

> 选自《物理大模型前沿：从 VLA 到世界模型》

## 5.1 自动驾驶的技术路线演进

自动驾驶技术经历了三代架构演进：

```
第一代 (2015-2020): 模块化流水线
  感知 → 预测 → 规划 → 控制
  代表: Waymo (早期), Apollo

第二代 (2020-2024): 部分端到端
  感知 → 预测+规划（联合优化） → 控制
  代表: UniAD, VAD, Tesla FSD v12

第三代 (2024-至今): 完全端到端 + 世界模型
  传感器输入 → 大模型 → 驾驶动作
  代表: DriveVLM, GAIA-1 + 规划, Cosmos + RL
```

### 模块化 vs 端到端的核心权衡

| 维度 | 模块化 | 端到端 |
|------|--------|--------|
| 可解释性 | ✅ 每个模块输出可检查 | ❌ 黑盒决策 |
| 工程复杂度 | ❌ 模块间接口多、误差累积 | ✅ 统一优化 |
| 上限 | ❌ 受限于人工设计的模块边界 | ✅ 理论上限更高 |
| 数据效率 | ✅ 每个模块可独立训练 | ❌ 需要大量端到端数据 |
| 安全验证 | ✅ 可逐模块验证 | ❌ 整体验证困难 |
| 长尾处理 | ❌ 需要逐个处理 corner case | ✅ 数据驱动自动覆盖 |

## 5.2 端到端自动驾驶的里程碑

### UniAD：统一自动驾驶框架

**UniAD**（Unified Autonomous Driving）由上海 AI Lab 于 2023 年发布（[arXiv:2212.10156](https://arxiv.org/abs/2212.10156)），是首个将感知、预测、规划统一在一个 Transformer 中的端到端框架，获得 CVPR 2023 Best Paper。

**架构**：

```
多相机输入 (6 cameras)
  ↓
BEV 编码器 (BEVFormer)
  ↓
┌──────────────────────────────────────┐
│  TrackFormer (目标检测+跟踪)          │
│  ↓                                    │
│  MapFormer (在线建图)                  │
│  ↓                                    │
│  MotionFormer (运动预测)               │
│  ↓                                    │
│  OccFormer (占据预测)                  │
│  ↓                                    │
│  Planner (规划)                       │
└──────────────────────────────────────┘
  ↓
规划轨迹 → 控制指令
```

### Tesla FSD v12+：纯视觉端到端

Tesla FSD（Full Self-Driving）从 v12 版本开始全面转向端到端神经网络：

| 版本 | 架构 | 关键变化 |
|------|------|---------|
| FSD v11 | 模块化（30 万行 C++） | 传统感知+规划流水线 |
| FSD v12 | 端到端神经网络 | 删除大量规则代码，纯数据驱动 |
| FSD v13+ | 端到端 + 世界模型 | 加入预测未来场景的能力 |

**Tesla 的数据优势**：
- 全球 600 万+ 辆车的车队数据采集
- 每天产生 PB 级驾驶视频
- 影子模式（Shadow Mode）：在后台运行 FSD，与人类驾驶对比
- Dojo 超算：专为视频训练设计的 AI 超级计算机

> **注意**：2026 年 4 月，马斯克在 Q1 财报电话会上确认 HW3 芯片无法支持无监督 FSD，需要升级到 AI4 芯片。来源：[36Kr](https://36kr.com/newsflashes/3779039345710080)

### DriveVLM：VLA 上车

**DriveVLM** 由清华大学和理想汽车于 2024 年发布（[arXiv:2402.12289](https://arxiv.org/abs/2402.12289)），是首个将 VLM 能力引入自动驾驶规划的工作。

**核心思路**：
1. 用 VLM 理解复杂驾驶场景（如施工区域、事故现场）
2. VLM 输出场景描述和高层决策（如"前方施工，需要变道"）
3. 传统规划器执行具体轨迹规划

```
多相机输入 + 语言描述
  ↓
VLM (InternVL 骨干)
  ↓
场景理解: "前方 50m 有施工围挡，右侧车道可通行"
  ↓
高层决策: "向右变道，减速至 30km/h"
  ↓
轨迹规划器 → 控制指令
```

## 5.3 世界模型驱动的自动驾驶

### 世界模型在自动驾驶中的三种应用模式

```
模式 1: 数据增强（离线）
  真实驾驶数据 → 世界模型 → 生成更多训练场景（不同天气/交通）
  → 扩充端到端模型的训练数据

模式 2: 场景仿真（离线）
  世界模型生成逼真驾驶场景 → 替代传统仿真器
  → 用于安全验证和测试

模式 3: 在线规划（实时）
  当前观测 → 世界模型预测多条未来轨迹 → 选择最安全的
  → 类似人类"预判"能力
```

### 关键数据集

| 数据集 | 机构 | 规模 | 传感器 | 链接 |
|--------|------|------|--------|------|
| Waymo Open | Waymo | 1150 场景, 1200 万帧 | 相机+LiDAR | [waymo.com/open](https://waymo.com/open/) |
| nuScenes | Motional | 1000 场景, 140 万帧 | 相机+LiDAR+Radar | [nuscenes.org](https://www.nuscenes.org/) |
| Argoverse 2 | Argo AI | 1000 场景 | 相机+LiDAR | [argoverse.org](https://www.argoverse.org/) |
| KITTI | KIT/Toyota | 22 序列 | 相机+LiDAR | [cvlibs.net/datasets/kitti](https://www.cvlibs.net/datasets/kitti/) |

> **数据来源**：各数据集官方网站，截至 2026 年 4 月。

## 5.4 产业格局：谁在领跑

### 全球自动驾驶公司技术路线对比

| 公司 | 技术路线 | 传感器 | 当前状态 | 数据规模 |
|------|---------|--------|---------|---------|
| **Waymo** | 模块化→混合 | LiDAR+相机+Radar | L4 商业运营（旧金山/凤凰城） | 超过2000万英里（截至2023年公开数据） |
| **Tesla** | 纯视觉端到端 | 仅相机（8 个） | L2+ 量产，无监督 FSD 试点 | 数十亿英里车队数据 |
| **小鹏** | 端到端 | 相机+LiDAR | L2+ 量产，城市 NGP | 数亿公里 |
| **华为 ADS** | 端到端 | 相机+LiDAR+Radar | L2+ 量产（问界/阿维塔） | 数亿公里 |
| **Cruise** | 模块化 | LiDAR+相机 | 暂停运营（2023 事故后） | - |
| **Wayve** | 端到端+世界模型 | 相机为主 | L4 测试（伦敦） | GAIA-1 世界模型 |
| **Momenta** | 端到端 | 相机+LiDAR | L2+ 量产（多品牌） | 数亿公里 |

### 中国自动驾驶的特殊优势

1. **数据规模**：中国拥有全球最复杂的交通场景（混合交通流、非标准道路）
2. **政策支持**：多个城市开放 L4 测试区域（北京亦庄、上海临港、深圳坪山）
3. **产业链完整**：从芯片（地平线/黑芝麻）到算法到整车的完整链条
4. **成本优势**：国产 LiDAR 价格降至 $200 以下（禾赛/速腾/图达通）

## 5.5 自动驾驶的核心挑战与前景

### 挑战一：长尾场景

自动驾驶的 99% 场景可以用规则处理，但剩下的 1% 长尾场景（corner cases）决定了系统的安全性：

```
常见长尾场景:
- 施工区域（临时标线、引导员手势）
- 紧急车辆（消防车、救护车）
- 异常天气（暴雨、大雾、冰雪）
- 非标准道路参与者（轮椅、滑板、动物）
- 传感器退化（逆光、雨滴遮挡）
```

**世界模型的解决方案**：用世界模型生成大量长尾场景的合成数据，覆盖真实世界中罕见但关键的情况。

### 挑战二：安全验证

自动驾驶需要证明其安全性优于人类驾驶员。根据 RAND Corporation 的研究，要在统计上证明自动驾驶比人类安全，需要 **110 亿英里** 的无事故驾驶数据。

> **数据来源**：Kalra & Paddock, "Driving to Safety: How Many Miles of Driving Would It Take to Demonstrate Autonomous Vehicle Reliability?", RAND Corporation, 2016

### 前景展望

| 时间线 | 预期进展 |
|--------|---------|
| 2026-2027 | L4 Robotaxi 在更多城市商业运营；端到端方案成为主流 |
| 2028-2030 | 世界模型驱动的规划上车；L4 覆盖主要城市 |
| 2030+ | L5 全场景自动驾驶开始试点；自动驾驶卡车大规模商用 |

---

**参考文献**

1. Hu et al., "Planning-oriented Autonomous Driving (UniAD)", arXiv:2212.10156, 2022 (CVPR 2023 Best Paper)
2. Tian et al., "DriveVLM: The Convergence of Autonomous Driving and Large Vision-Language Models", arXiv:2402.12289, 2024
3. Hu et al., "GAIA-1: A Generative World Model for Autonomous Driving", arXiv:2309.17080, 2023
4. NVIDIA, "Cosmos World Foundation Model Platform for Physical AI", arXiv:2501.12399, 2025
5. Waymo Open Dataset, [waymo.com/open](https://waymo.com/open/)
6. nuScenes Dataset, [nuscenes.org](https://www.nuscenes.org/)
7. Zheng et al., "GenAD: Generalized Predictive Model for Autonomous Driving", arXiv:2402.18555, 2024
8. Wang et al., "DriveWM: Driving into the Future with Multi-View World Models", arXiv:2404.18228, 2024