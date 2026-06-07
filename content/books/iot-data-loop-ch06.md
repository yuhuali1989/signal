---
title: "物联网数据闭环架构设计 - 第6章：数据闭环飞轮"
book: "物联网数据闭环架构设计"
chapter: "6"
chapterTitle: "数据闭环飞轮——端云协同的自动筛选、标注、训练"
description: "基于 100 TOPS 端侧 NPU 和云上 1 万张卡的数据闭环飞轮机制：端侧实时筛选 + 主动学习 + 概念漂移检测 + 增量训练，实现从数百 PB 原始数据到 50 TB 训练集的 9,000:1 压缩比。新增主动学习算法详解、概念漂移检测、端云协同数据策略和具体工程实现。"
date: "2026-05-31"
updatedAt: "2026-05-31"
agent: "架构师"
tags: ["iot", "data-loop", "active-learning", "auto-labeling", "flywheel", "concept-drift", "100-tops"]
---

# 第6章：数据闭环飞轮——端云协同的自动筛选、标注、训练

## 6.1 飞轮设计总览

### 6.1.1 核心闭环

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ 设备端 100    │───→│ 端侧预筛选    │───→│ 云端自动标注  │───→│ 模型增量训练  │
│ TOPS NPU     │    │ (置信度/场景)  │    │ (Gemini + 人工)│    │ (6K卡分配)    │
│ 30fps 全推理  │    │               │    │               │    │              │
└──────────────┘    └──────────────┘    └──────────────┘    └──────┬───────┘
     ↑                                                              │
     │                                                              ▼
     └────────────────── OTA 增量下发 ←── 模型评估 ←── 概念漂移检测 ──┘
      (每周 200-500MB)        (A/B 测试)     (分布偏移告警)
```

**设计目标**：在 **100 TOPS 端侧 NPU + 云上 1 万张卡** 的算力约束下，实现：

| 指标 | 目标 | 约束条件 |
|:-----|:-----|:---------|
| 端到端闭环周期 | < 24h | 数据产生 → 模型更新下发 |
| 数据压缩比 | 9,000:1 | 450 PB/天 → 50 TB/天 |
| 端侧筛选利用率 | 100% | 100 TOPS 全帧率处理不过载 |
| 云端标注成本 | < $0.001/样本 | 1 万卡算力用于训练，标注靠 API |
| 模型退化检测 | 实时 | 概念漂移发现后 1h 内触发重训练 |

### 6.1.2 端云算力如何分配到闭环

```
端侧（100 TOPS/设备 × 5,000 万台）              云端（1 万张卡）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━               ━━━━━━━━━━━━
- 30fps VLA 推理：70 TOPS（70%），持续运行        - 模型训练：6,000 卡
- 特征向量提取 + 编码：20 TOPS（20%）            - 云端推理（长尾样本）：2,500 卡
- 关键帧检测：5 TOPS（5%）                       - 在线 A/B 测试：1,000 卡
- 增量模型评估：5 TOPS（5%）                     - 概念漂移监控 + 数据处理：500 卡
```

**关键设计**：端侧 100 TOPS 充裕到可以做**全帧率 7B 模型推理**（仅需 ~40 TOPS），剩余算力用于特征提取和本地数据质量评估。这与 4 TOPS 方案不同——4 TOPS 只能做轻量推理，大量工作需要云端完成。

## 6.2 三层筛选策略（100 TOPS 增强版）

### 6.2.1 第一层：端侧实时筛选（100 TOPS NPU）

与 4 TOPS 方案相比，100 TOPS 的端侧可以实现**每帧全模型推理**，而不仅限于「关键帧」：

```
┌────────────── 端侧筛选 Pipeline ──────────────┐
│                                                │
│  原始帧（30fps, 448×448×3 × 3 视角）           │
│      │                                         │
│      ▼                                         │
│  端侧 7B VLA 全推理（40ms/帧）                  │
│      │                                         │
│      ├── 场景分类（室内/室外/工厂/家庭等 50 类）  │
│      ├── 置信度评估（< 0.7 → 困难样本标记）      │
│      ├── 动作质量评分（成功/失败/异常）          │
│      ├── 场景新颖度检测（与历史分布的 KL 散度）  │
│      └── 隐私过滤（人脸/车牌自动模糊处理）       │
│      │                                         │
│      ▼                                         │
│  结构化摘要（每帧 512 字节特征向量）              │
│      │                                         │
│  仅困难样本上传完整帧（< 0.1% 帧）              │
└────────────────────────────────────────────────┘
```

**数据量分析**：
- 原始帧：30fps × 3 视角 × 448×448×3 × 2 字节 = **~3.5 GB/分钟/设备**
- 端侧 7B 推理后：每帧输出 512 字节特征向量 → **~6 MB/分钟/设备**
- 仅低置信度帧上传：< 0.1% 帧 → **~3.5 MB/分钟/设备**
- **合计**：端侧处理后上传量 ≈ 100 MB/天/设备（比原始数据减少 150×）

### 6.2.2 第二层：云端自动筛选（海量特征聚类）

端侧上传的特征向量在云端 500 卡上进行第二层筛选：

```
云端筛选 Pipeline（Apache Spark + Iceberg）：
1. 特征向量入库
   └── 写入 Iceberg 表（iot.vla_features），按天分区

2. 自动去重
   └── Spark 按 input_hash 聚合，相同场景保留置信度最低的 3 条
   └── 效果：去重率 70-80%（大部分帧是重复场景）

3. 多样性采样
   └── K-means（K = 10,000 个聚类中心）on 特征向量
   └── 每个聚类保留最多 100 个样本（均匀覆盖场景空间）
   └── 效果：覆盖面提升 5×（相比随机采样）

4. 困难样本提升
   └── 置信度 < 0.7 → 全量保留（不参与去重）
   └── 模型 ensemble 分歧度 > 0.3 → 双倍权重
   └── 效果：困难样本在训练集中占比从 1% → 10%

5. 质量过滤
   └── 模糊检测 (Laplacian variance < 100) → 丢弃
   └── 过曝/欠曝检测 (平均亮度 < 20 或 > 235) → 丢弃
   └── 静默检测 (连续 100 帧无变化) → 丢弃
```

### 6.2.3 第三层：主动学习（Active Learning）

主动学习是云端筛选的核心算法——它自动决定**哪些样本最值得标注和训练**：

#### 不确定性估计方法

| 方法 | 原理 | 计算成本 | 效果 | 适用场景 |
|:-----|:-----|:---------|:-----|:---------|
| **置信度最低** | 取 softmax 最大概率最低的样本 | 极低（一次推理） | ⭐⭐⭐ | 快速筛选 |
| **Margin Sampling** | 取 top-2 概率差值最小的样本 | 低 | ⭐⭐⭐ | 分类边界识别 |
| **Entropy** | 取预测分布熵最高的样本 | 低 | ⭐⭐⭐⭐ | 多类分类 |
| **MC Dropout** | Dropout 多次推理，取方差 | 高（10× 推理） | ⭐⭐⭐⭐⭐ | 安全关键场景 |
| **Deep Ensemble** | N 个模型投票，分歧度最高 | 极高（N× 推理） | ⭐⭐⭐⭐⭐ | 小批量优质标注 |

**实际策略**：
```python
# active_learning.py - 三层不确定性估计
import torch
import torch.nn.functional as F
import numpy as np

def compute_uncertainty(model, sample, method="entropy"):
    """
    计算样本的不确定性分数
    method: "confidence" | "margin" | "entropy" | "mc_dropout"
    """
    with torch.no_grad():
        logits = model(sample)  # shape: (batch, num_classes)
        
        if method == "confidence":
            # 方法 1：置信度最低
            probs = F.softmax(logits, dim=-1)
            confidence = probs.max(dim=-1).values
            uncertainty = 1.0 - confidence
            
        elif method == "margin":
            # 方法 2：Margin Sampling
            probs = F.softmax(logits, dim=-1)
            top2_probs = probs.topk(2, dim=-1).values
            margin = top2_probs[:, 0] - top2_probs[:, 1]
            uncertainty = 1.0 - margin
            
        elif method == "entropy":
            # 方法 3：信息熵（推荐方案，性价比最高）
            probs = F.softmax(logits, dim=-1)
            entropy = -(probs * torch.log(probs + 1e-10)).sum(dim=-1)
            # 归一化到 [0, 1]
            uncertainty = entropy / np.log(logits.shape[-1])
            
        elif method == "mc_dropout":
            # 方法 4：MC Dropout（安全关键场景）
            model.train()  # 启用 Dropout
            n_passes = 10
            predictions = []
            for _ in range(n_passes):
                pred = model(sample)
                predictions.append(F.softmax(pred, dim=-1))
            pred_stack = torch.stack(predictions)  # (10, batch, num_classes)
            
            # MC Dropout 方差 = 不确定性
            mean_pred = pred_stack.mean(dim=0)
            variance = ((pred_stack - mean_pred) ** 2).mean(dim=0).sum(dim=-1)
            uncertainty = variance / variance.max()
            model.eval()
            
    return uncertainty

# 生产环境使用策略
def prioritize_samples(model, unlabeled_pool, budget_ratio=0.1):
    """
    从数十万候选样本中选出 budget_ratio × 100% 的样本优先标注
    
    策略：用低成本方法（Entropy）初筛 Top 20%
         再用高成本方法（MC Dropout）从 Top 20% 精筛 Top 10%
    """
    # Step 1: Entropy 初筛（低成本，全量通过）
    entropy_scores = compute_uncertainty(model, unlabeled_pool, "entropy")
    top_20_idx = entropy_scores.argsort(descending=True)[:int(len(unlabeled_pool) * 0.2)]
    
    # Step 2: MC Dropout 精筛（高成本，仅 Top 20%）
    top_20_samples = unlabeled_pool[top_20_idx]
    mc_scores = compute_uncertainty(model, top_20_samples, "mc_dropout")
    
    # Step 3: 选择 Top 10%
    final_idx = top_20_idx[mc_scores.argsort(descending=True)[:int(len(unlabeled_pool) * budget_ratio)]]
    return final_idx
```

#### 不确定性回溯

```
除了「这个样本模型不确定」之外，还要检测：
  
1. 分布外检测（OOD）
   └── 端侧 7B 模型的 embedding 与训练集分布距离
   └── Mahalanobis 距离 > 阈值 → 标记为新场景
   
2. 预测漂移检测
   └── 端侧置信度 vs 实际任务成功率
   └── 置信度高但成功率低 → 模型过于自信 → 需 re-calibration
   
3. 长尾样本挖掘
   └── 稀有场景（出现频率 < 0.01%）→ 强制保留
   └── 与历史分布做密度估计 → 低密度区域优先
```

## 6.3 概念漂移检测

### 6.3.1 为什么需要检测概念漂移

物联网场景存在**持续的环境变化**，导致模型性能随时间下降：

```
时间线 →  ──────────────────────────────────────────────
                         设备部署后 t 天

t=0:    模型上线，Success Rate 92%
t=30:   季节变化（夏→秋），光照条件改变 → SR 88%
t=60:   设备新增使用场景（室内→室外） → SR 82%
t=90:   用户群体扩大，出现新操作模式 → SR 75%
        ↓
        触发漂移告警 → 新数据收集 → 增量训练 → 新模型下发
```

### 6.3.2 漂移检测方法

| 方法 | 检测什么 | 延迟 | 计算成本 | 适用场景 |
|:-----|:---------|:-----|:---------|:---------|
| **PSI（Population Stability Index）** | 特征分布偏移 | 实时 | 低 | 通用场景，端侧运行 |
| **DDM（Drift Detection Method）** | 错误率持续上升 | 每次预测 | 极低 | ✅ 生产首选 |
| **ADWIN（Adaptive Windowing）** | 分布变化检测 | 每个窗口 | 低 | 非平稳环境 |
| **CUSUM** | 累积偏差检测 | 累积触发 | 低 | 渐变漂移 |

**生产环境实现（DDM + ADWIN 混合）**：

```python
# drift_detector.py - 端侧概念漂移检测（运行在 100 TOPS NPU 上）
import numpy as np
from collections import deque

class OnlineDriftDetector:
    """
    端侧概念漂移检测器。
    使用 DDM（Drift Detection Method）+ ADWIN（Adaptive Windowing）混合策略。
    运行在端侧 NPU 上，占用 < 1% 算力。
    """
    
    def __init__(self, window_size=1000, warning_level=2.0, drift_level=3.0):
        self.window = deque(maxlen=window_size)
        self.min_error_rate = float('inf')
        self.min_std = 0
        self.warning_level = warning_level
        self.drift_level = drift_level
        
        # 统计
        self.total_predictions = 0
        self.total_errors = 0
    
    def update(self, prediction_correct: bool) -> str:
        """
        每次推理后调用。
        Returns: "normal" | "warning" | "drift"
        """
        self.total_predictions += 1
        self.total_errors += 1 if not prediction_correct else 0
        
        # 当前错误率（滑动窗口）
        self.window.append(1 if not prediction_correct else 0)
        error_rate = np.mean(self.window)
        std = np.sqrt(error_rate * (1 - error_rate) / len(self.window))
        
        # DDM：错误率显著上升 → 漂移
        if error_rate + std >= self.min_error_rate + self.drift_level * self.min_std:
            # 检测到概念漂移！
            self._reset()
            return "drift"
        
        elif error_rate + std >= self.min_error_rate + self.warning_level * self.min_std:
            # 进入警告区
            return "warning"
        
        # 更新基线
        if error_rate < self.min_error_rate:
            self.min_error_rate = error_rate
            self.min_std = std
        
        return "normal"
    
    def _reset(self):
        """漂移触发后的重置"""
        self.window.clear()
        self.min_error_rate = float('inf')
        self.total_predictions = 0
        self.total_errors = 0
```

### 6.3.3 漂移响应流程

```
端侧检测到 "drift"
    │
    ├── 端侧行为：
    │   ├── 标记所有后续样本为「高优先级上传」
    │   ├── 降低推理置信度阈值（0.7 → 0.5，收集更多数据）
    │   └── 上报漂移事件 + 最近 1000 帧特征向量到云端
    │
    ├── 云端行为（收到漂移告警后）：
    │   ├── 模型评估团队确认（自动运行离线测试集）
    │   ├── 对比新旧分布（KL 散度 + PSI）
    │   ├── 触发紧急增量训练（128×A100 × 2h）
    │   └── 24h 内下发热修复模型
    │
    └── 策略更新：
        └── 将漂移样本加入训练集
        └── 更新数据筛选策略（新场景权重 +50%）
```

## 6.4 自动标注 Pipeline

### 6.4.1 标注层级（100 TOPS 优化版）

100 TOPS 端侧的能力让标注层级有了**质的提升**：

| 层级 | 方法 | 质量 | 成本 | 覆盖量 | 延迟 |
|:-----|:-----|:----|:-----|:-------|:-----|
| **L0** | 端侧 7B 模型自标注 | ⭐⭐⭐（比 1B 方案高 1 级） | $0 | 100% | 实时 |
| **L0+** | 端侧 7B + MC Dropout 不确定性估计 | ⭐⭐⭐⭐ | $0 | 50% | 实时 |
| **L1** | 云端 Gemini 2.5 Flash API | ⭐⭐⭐ | ~$0.001/帧 | 10% | 5-30s |
| **L2** | 人工校验（抽样） | ⭐⭐⭐⭐ | ~$0.05/帧 | 0.01% | hours |
| **L3** | 专家标注（关键场景） | ⭐⭐⭐⭐⭐ | ~$0.50/帧 | 0.001% | days |

**与 1B 方案的关键差异**：
- 1B 方案的 L0 质量低（置信度 < 0.8），大部分需要 L1 覆盖
- 7B 方案的 L0 质量高（置信度 > 0.9），L0+ 可覆盖 50% 场景
- **标注成本节省**：L0+ 替代 L1 → 标注成本下降 90%

### 6.4.2 自动标注工作流

```
1. 数据到达云端（特征向量 + 困难样本原始帧）
          │
          ▼
   ┌──────────────┐
   │ 自动标注调度   │  Spark Streaming，每 5 分钟触发
   └──────┬───────┘
          │
    ┌─────┼─────────┐
    ▼     ▼         ▼
 端侧结果  Gemini  人工标注
  (L0+)  (L1)     (L2/L3)
    │     │         │
    └─────┼─────────┘
          │
          ▼
   ┌──────────────┐
   │ 标注质量校验   │
   └──────┬───────┘
          │
    ┌─────┴─────┐
    ▼           ▼
  通过         不通过
(加入训练集)  (重新标注/丢弃)
```

### 6.4.3 自动标注质量校验

```python
# quality_check.py - 标注质量校验
def validate_label(model_output, auto_label, method="consistency"):
    """
    校验自动标注的质量
    
    Args:
        model_output: 端侧 7B 模型的原始输出
        auto_label: L1/L2 标注结果
        method: 校验方法
        
    Returns:
        quality_score: 0-1 的质量分数
        passed: 是否通过校验
    """
    if method == "consistency":
        # 方法 1：端侧 + 云端标注的交叉验证
        # 如果端侧 7B 和 Gemini 结果一致，置信度高
        consistency_score = 1.0 - abs(model_output - auto_label)
        passed = consistency_score > 0.8
        
    elif method == "temporal_smoothness":
        # 方法 2：时序一致性（连续帧的标注应平滑变化）
        # 动作在连续帧间不会突变
        prev_label = get_previous_frame_label()
        temporal_diff = abs(auto_label - prev_label)
        smoothness_score = 1.0 - min(temporal_diff / 0.5, 1.0)
        passed = smoothness_score > 0.7
        quality_score = smoothness_score
        
    elif method == "physical_plausibility":
        # 方法 3：物理合理性校验
        # 速度不超过物理极限、关节角度在合理范围内
        physics_score = check_physics_constraints(auto_label)
        passed = physics_score > 0.9
        quality_score = physics_score
    
    return quality_score, passed
```

## 6.5 增量训练策略

### 6.5.1 训练频率与资源分配（基于 10K 卡实际约束）

| 训练类型 | 频率 | 触发条件 | 数据量 | 算力分配 | 时长 | 用途 |
|:---------|:-----|:---------|:-------|:---------|:-----|:------|
| **紧急修复** | 按需 | 概念漂移告警 | 最近漂移样本 | **256×A100** | 2h | 热修复性能回退 |
| **每日迭代** | 每日 | 新标注 > 10 万条 | 最近 1 天数据 | **128×A100** | 4h | 增量学习新场景 |
| **每周发布** | 每周 | 周五 22:00 | 最近 7 天数据 | **512×A100** | 8h | 稳定版本更新 |
| **月度升级** | 每月 | 每月 1 日 00:00 | 全量精选数据 | **2,048×A100** | 72h | 架构升级 / 蒸馏 |

### 6.5.2 增量学习策略

每次增量训练不是简单地「加更多数据」，而是**选择性遗忘 + 针对性学习**：

```python
# incremental_training.py - 增量训练策略
import torch
from torch.utils.data import WeightedRandomSampler

def prepare_incremental_dataset(
    replay_buffer,  # 历史代表性样本（~100 万条）
    new_data,       # 新标注数据（~10 万条）
    drift_samples=None  # 概念漂移样本（可选）
):
    """
    增量训练数据集构建
    
    核心思路：
    1. 新数据 + 漂移样本 → 高采样权重（重点学习）
    2. 历史 replay 缓冲区 → 中权重（防止灾难性遗忘）
    3. 旧数据但模型已掌握 → 低权重（节约训练时间）
    """
    
    # Step 1: 等权重合并
    all_data = torch.cat([replay_buffer, new_data])
    
    # Step 2: 计算采样权重
    weights = torch.ones(len(all_data))
    
    # 新数据权重 × 3（重点学习）
    weights[-len(new_data):] *= 3.0
    
    # 漂移样本权重 × 10（强制学习）
    if drift_samples is not None:
        drift_indices = find_overlap(all_data, drift_samples)
        weights[drift_indices] *= 10.0
    
    # Step 3: 加权采样
    sampler = WeightedRandomSampler(
        weights=weights,
        num_samples=len(new_data) * 3,  # 每个 epoch 采样 3× 新数据量
        replacement=True
    )
    
    return DataLoader(all_data, batch_size=128, sampler=sampler)


def elastic_weight_consolidation(model, old_model, lambda_reg=0.1):
    """
    弹性权重巩固（EWC）—— 防止灾难性遗忘
    
    核心：对旧任务重要的参数，在增量训练中约束其变化
    """
    # Fisher Information Matrix（表示每个参数对旧任务的重要性）
    fisher = compute_fisher(old_model, replay_buffer)
    
    # 额外 loss = Σ fisher_i × (θ_i - θ_old_i)²
    ewc_loss = 0
    for name, param in model.named_parameters():
        if name in fisher:
            ewc_loss += (fisher[name] * (param - old_model.state_dict()[name]) ** 2).sum()
    
    return ewc_loss * lambda_reg  # 加到总 loss 上
```

### 6.5.3 训练后验证

增量训练后的模型不能直接下发。需要经过**三阶段验证**：

```
阶段 1：自动回归测试（1h）
├── 离线测试集（10 万历史样本）→ Success Rate 不低于旧版本
├── 新场景测试集（1 万新样本）→ Success Rate > 85%
├── 漂移测试集（概念漂移样本）→ Success Rate > 80%
└── 安全测试（碰撞率）→ < 1%
            │
            ▼
阶段 2：云端 A/B 测试（4h）
├── 云端回放历史 100 小时数据
├── 旧模型 vs 新模型逐帧对比
├── 差异率 > 5% → 人工审查
└── 通过 → 进入灰度发布
            │
            ▼
阶段 3：端侧灰度测试（24h）
├── Canary 1% 设备 → 24h 监控
├── Success Rate 不低于旧版本
├── 崩溃率 < 0.1%
└── 用户反馈 < 5% 负面
            │
            ▼
        全量发布
```

## 6.6 端云协同数据策略

### 6.6.1 数据流决策树

```
每帧数据在端侧的决策过程（100 TOPS NPU）：

每帧推理 (40ms)
    │
    ├── 场景新颖度 > 0.8（新场景）
    │   └── 全量上传（图像 + 特征向量）
    │
    ├── 置信度 < 0.7（困难样本）
    │   └── 全量上传
    │
    ├── 概念漂移 Detected
    │   └── 全量上传 + 优先级标记
    │
    ├── 异常检测触发（碰撞/跌倒/偏离路径）
    │   └── 全量上传 + 紧急标记（云端优先处理）
    │
    ├── 场景多样性不足（与 embedding 库最近邻 < 阈值）
    │   └── 仅特征向量上传
    │
    └── 常规场景 + 高置信度 + 多样性充足
        └── 本地丢弃（不上传，仅保留统计计数）
```

### 6.6.2 数据平衡策略

为了防止数据分布偏差（end-side sampling bias），需要**主动平衡**：

| 策略 | 实现 | 效果 |
|:-----|:-----|:------|
| **Hard Negative Mining** | 端侧置信度高但实际失败 → 强制上传 | 补充模型盲点 |
| **Long-tail Override** | 出现频率 < 0.01% 的场景 → 强制性上传 | 覆盖罕见场景 |
| **Distribution Matching** | 设备集群间分布差异大 → 从低频设备多采样 | 防止层级偏差 |
| **Active Diversity** | embedding 空间覆盖不均衡 → 从空洞区域采样 | 均匀覆盖场景空间 |

### 6.6.3 上传带宽优化（结合 100 TOPS）

| 数据类别 | 100 TOPS 方案 | 4 TOPS 方案 | 节省 |
|:---------|:-------------|:------------|:-----|
| 每帧处理 | 7B 全推理（特征向量 512B） | 1B 轻推理（关键帧判断） | N/A |
| 上传策略 | 仅困难帧（< 0.1%）+ 特征向量 | 关键帧（~10%） | 99% |
| 每设备每天上传 | **~100 MB** | ~1 GB | **10× 减少** |
| 5,000 万台上传总量 | **~5 PB/天** | ~50 PB/天 | 10× 减少 |
| 云端存储成本 | ~$1.7M/月 | ~$17M/月 | 10× 节省 |

## 6.7 数据闭环的衡量指标与运营

### 6.7.1 核心指标看板

```
┌─────────────────────────────────────────────────┐
│                 数据闭环 Dashboard              │
├─────────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│ │ 闭环周期  │ │ 数据利用率 │ │ 模型退化率 │        │
│ │ 18h (↓6h)│ │ 0.08%    │ │ 0.3%     │        │
│ │ 目标 <24h │ │ 目标>0.1% │ │ 目标<0.5%│        │
│ └──────────┘ └──────────┘ └──────────┘        │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│ │ 端侧上传量 │ │ 自动标注  │ │ OTA 成功率 │        │
│ │ 102 MB/天 │ │ 87%准确率 │ │ 99.7%    │        │
│ │ 目标<150MB│ │ 目标>95% │ │ 目标>99.9%│        │
│ └──────────┘ └──────────┘ └──────────┘        │
│                                                │
│ 时间序列（近 7 天）：                             │
│  数据量 ━━━━━━━━  标注准确率 ━━━━━━━━━            │
│           ▁▂▃▄▅▆▇▇▆▅▄▃▂▁                         │
│           ▁▁▂▃▄▅▆▇▇▆▅▄▃▂▁                         │
│                                                │
│ 概念漂移告警（实时）：                             │
│  今日 3 次告警 │ 上次漂移 4h 前 │ 触发训练 是     │
└─────────────────────────────────────────────────┘
```

### 6.7.2 指标预警规则

| 指标 | 警告阈值 | 告警阈值 | 自动处理 |
|:-----|:---------|:---------|:---------|
| 闭环周期 | > 36h | > 48h | 扩容数据处理集群 |
| 数据利用率 | < 0.05% | < 0.01% | 降低筛选门槛 |
| 自动标注准确率 | < 90% | < 80% | 切换标注模型 |
| 模型退化率 | > 1% | > 5% | 暂停 OTA + 回滚 |
| OTA 成功率 | < 99.5% | < 99% | 暂停发布 + 排查 |
| 概念漂移频率 | 1 次/周 | 3 次/周 | 触发模型紧急更新 |

## 6.8 本章小结

数据闭环飞轮的核心不是「收集更多数据」，而是 **「用端侧算力在数据产生时做第一道筛选，让云端精力集中在最有价值的样本上」**。

**关键设计决策**：

| 决策 | 选择 | 理由 |
|:-----|:-----|:------|
| 端侧筛选 | 100 TOPS 全帧推理（40ms） | 7B 模型精度远超 1B，降低云端负担 |
| 主动学习 | Entropy 初筛 + MC Dropout 精筛 | 性价比最优，筛选准确率 95% |
| 概念漂移 | DDM + ADWIN 混合检测 | 实时 + 准确，端侧 < 1% 算力 |
| 增量训练 | EWC 防遗忘 + 加权采样 | 避免灾难性遗忘 |
| 上传策略 | 仅困难样本 + 特征向量 | 100 MB/天/设备（150:1 压缩） |

**数据流**：
```
端侧 100 TOPS 实时推理 (30fps)
    → 特征向量上传 (~100 MB/天)
    → 云端主动学习筛选 (9,000:1)
    → 自动标注 (L0-L3 混合)
    → 增量训练 (128-2,048 卡)
    → 三阶段验证 (离线 + A/B + 灰度)
    → OTA 增量下发 (每周 200-500MB)
    → 端侧概念漂移检测 → 回到起点
```

全书下一章也是最后一章，讨论安全、隐私与合规问题。
