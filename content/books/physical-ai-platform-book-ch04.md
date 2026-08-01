---
title: "Physical AI 多模态大模型：平台设计与技术关键点 - 第4章: 数据平台模块设计——采集、标注、清洗与特征存储"
book: "Physical AI 多模态大模型：平台设计与技术关键点"
chapter: "4"
chapterTitle: "数据平台模块设计——采集、标注、清洗与特征存储"
description: "设计 DataForge/LabelHub/DataRefine/FeatureVault 四个数据模块的功能边界与 Physical AI 适配"
date: "2026-07-31"
updatedAt: "2026-07-31"
agent: "研究员→编辑→审校员"
tags:
  - "数据采集"
  - "数据标注"
  - "数据清洗"
  - "特征存储"
  - "Domain Randomization"
type: "book"
---

## 4.1 DataForge——采集与接入

**模块定位**：Physical AI 数据生命周期的入口，负责从真实世界和仿真环境采集多模态传感器数据并标准化存储。

**核心功能**：
- **真实采集**：机器人遥操作录制（关节角度序列 + 末端执行器位姿 + 力/触觉），同步采集 RGB-D 相机（30Hz）、激光雷达（10Hz）、IMU（1kHz）数据流
- **仿真生成**：一键启动 Isaac Lab/Genesis 生成合成场景变体，支持 Domain Randomization（光照/纹理/物体位置随机化）
- **格式标准化**：将异构传感器数据统一为 ROS bag2 / USD / OpenScene 格式，保证下游模块可消费

**Physical AI 适配**：
- 支持硬件触发同步（相机+激光雷达+IMU 共享触发信号），时间戳误差 <1ms
- 遥操作 SDK（Space Mouse/VR 手柄/双手示教），录制为 `(observation, action)` 对
- 仿真数据生成管道与真实采集共享同一数据格式，消除 Sim2Real 格式鸿沟

**对外接口**：
- `POST /data/ingest` — 上传传感器数据流（支持流式上传大文件）
- `GET /data/{id}/metadata` — 查询数据采集元信息（传感器配置/场景/时间）
- `POST /sim/generate` — 触发仿真场景变体生成

## 4.2 LabelHub——标注平台

**模块定位**：多模态数据标注中心，支持人工标注 + 自动标注的混合工作流。

**核心功能**：
- **3D 点云标注**：bbox 框选、BEV 鸟瞰分割、实例分割
- **视频时序标注**：关键帧标注 + 插值传播，减少逐帧标注量
- **多传感器融合标注**：RGB + 点云 + 深度同步标注，跨传感器投影一致性检查
- **机器人轨迹标注**：在 3D 空间中标注末端执行器期望轨迹，用于行为克隆训练
- **自动标注 + 主动学习**：用已训练 VLA 模型预标注，人工只修正低置信样本

**Physical AI 适配**：
- 多传感器融合标注 UI：同一时间戳的 RGB + 点云 + 深度并排显示，标注在任一视图自动投影到其他视图
- 机器人轨迹标注支持路径插值（Catmull-Rom 样条）和速度标注
- 主动学习闭环：模型预标注 → 置信度排序 → 高价值样本送人工修正 → 修正后样本反哺训练

**PAI/SageMaker 对比**：PAI-iTAG 和 SageMaker Ground Truth 都支持 3D 点云标注，但缺乏多传感器融合标注和机器人轨迹标注能力。LabelHub 的差异化在于**物理动作空间标注**。

## 4.3 DataRefine——清洗增强

**模块定位**：数据质量提升引擎，负责去重、增强、质量评分。

**核心功能**：
- **多模态去重**：DINOv2 提取视觉嵌入 + SemDeDup 语义去重（阈值 τ=0.97）+ D3 四模态联合距离（视觉+文本+深度+点云）
- **合成数据增强**：调用 Cosmos/Genie 世界模型生成场景变体（改变光照/物体/视角），填充长尾场景
- **Domain Randomization**：参数空间配置（纹理池/光照范围/物体尺度分布），批量生成变体
- **数据质量评分**：训练价值（loss reduction）+ 困难度（模型不确定性）+ 多样性（嵌入空间覆盖度）三维评分

**Physical AI 适配**：
- 去重不仅基于视觉相似度，还考虑**物理场景相似度**（相同物体布局+光照但不同视角仍算重复）
- Domain Randomization 参数空间包含物理参数（摩擦系数/质量/重力），而非仅视觉参数
- 质量评分模型使用「训练前后 success rate delta」而非 loss reduction，更贴合 Physical AI 评估范式

**与已有内容交叉引用**：本章去重算法基于站点文章 `multimodal-data-pipeline-stages-models-hf-2026-07.md` 中的 DINOv2 + SemDeDup 方案，合成数据飞轮参考 `synthetic-data-flywheel-unisim2-2026-04-18.md`。

## 4.4 FeatureVault——特征存储与数据目录

**模块定位**：托管传感器特征、场景特征和机器人状态特征的在线/离线统一仓库。

**核心功能**：
- **传感器特征**：CLIP/SigLIP 视觉嵌入、激光雷达 BEV 特征、IMU 时序特征
- **场景特征**：环境编码（室内/室外/物体密度/光照条件），用于场景检索和配比
- **机器人状态特征**：关节角度、末端位姿、力反馈，用于策略学习
- **在线离线一致**：训练时用离线特征（批量读取），推理时用在线特征（实时计算），两者结果必须一致
- **特征血缘**：从原始数据到特征的完整 DAG 追溯

**Physical AI 适配**：
- 特征 Schema 扩展为 `(visual, depth, point_cloud, proprioception, language)` 五元组
- 在线特征计算管线必须满足 <50ms 延迟约束（用于实时控制推理）
- 特征版本与模型版本双向关联：哪个模型用哪些版本的特征

**与 Lakehouse 集成**：FeatureVault 底层使用 Iceberg 表格式（参考站点文章 `lakehouse-iceberg-delta-hudi-ai-data.md`），支持时间旅行、schema evolution 和 upsert 合并。

## 4.5 四模块功能矩阵

| 模块 | 输入 | 输出 | 核心算法 | Physical AI 特化 |
|---|---|---|---|---|
| DataForge | 传感器流/仿真 | 标准化数据集 | 时间同步/格式转换 | ROS bag2 + 遥操作 SDK |
| LabelHub | 原始数据 | 标注数据 | 主动学习/插值传播 | 3D 多传感器融合标注 |
| DataRefine | 标注数据 | 清洗后数据 | DINOv2 去重/DR 增强 | 物理场景相似度 |
| FeatureVault | 清洗后数据 | 特征向量 | 嵌入提取/版本管理 | 五元组 Schema + 在线低延迟 |
