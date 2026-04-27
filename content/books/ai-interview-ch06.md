---
title: "AI 概念面试题 120 道 - 第6章: ML Systems 机器学习系统篇"
book: "AI 概念面试题 120 道"
chapter: "6"
chapterTitle: "ML Systems 机器学习系统篇"
description: "对标 aiofferly.com Fundamental 高难度题：Offline RL、Dreamer vs MuZero、Token-level PPO、Process Reward Models、SLO-Aware Model Serving、Continuous Batching、MLOps、数据飞轮等 ML 系统设计题 15 道，含难度标注"
date: "2026-04-13"
updatedAt: "2026-04-13"
agent: "研究员→编辑→审校员"
tags:
  - "面试"
  - "ML Systems"
  - "强化学习"
  - "模型服务"
  - "MLOps"
type: "book"
---

# 第 6 章：ML Systems 机器学习系统篇

> 选自《AI 概念面试题 120 道》· 对标 aiofferly.com 高难度 Fundamental 题库

每题标注难度：🟢 Easy · 🟡 Medium · 🔴 Hard

---

## Q96. 什么是 Token-level PPO for RLHF？ 🔴 Hard

**标准 PPO（Sequence-level）的问题**：
- 奖励只在序列末尾给出（稀疏奖励）
- 长序列中，早期 token 的梯度信号很弱
- 难以区分序列中哪些 token 是好的/坏的

**Token-level PPO**：将奖励分配到每个 token 级别：
```
序列奖励 r(x, y) → 分配到每个 token：r_t
方法1：均匀分配：r_t = r(x,y) / T
方法2：KL 惩罚：r_t = -β·KL(π_θ(·|s_t) || π_ref(·|s_t))
方法3：Process Reward Model：训练 PRM 预测每步的奖励
```

**PPO 目标（Token 级别）**：
```
L_PPO = E_t[min(r_t·Â_t, clip(r_t, 1-ε, 1+ε)·Â_t)]
其中 r_t = π_θ(a_t|s_t) / π_old(a_t|s_t)（重要性采样比）
Â_t：优势函数估计（GAE）
```

**与 GRPO 的区别**：PPO 需要 Critic 网络估计价值函数；GRPO 用组内相对奖励，无需 Critic。

---

## Q97. 什么是 Process Reward Models（PRM）for Test-Time Scaling？ 🔴 Hard

**Outcome Reward Model（ORM）vs Process Reward Model（PRM）**：
- **ORM**：只评估最终答案是否正确（结果奖励）
- **PRM**：评估推理过程中每个步骤的质量（过程奖励）

**PRM 的优势**：
- 提供更密集的奖励信号，训练更稳定
- 可以检测推理过程中的错误步骤
- 支持 Test-Time Compute Scaling（推理时搜索）

**Test-Time Scaling with PRM**：
```
问题 → 生成多条推理路径（Beam Search / MCTS）
     → PRM 评估每个步骤的质量
     → 选择 PRM 分数最高的路径
     → 输出最终答案
```

**Best-of-N Sampling**：生成 N 个答案，用 ORM/PRM 选择最好的：
- N=1：标准生成
- N=64：显著提升数学推理准确率
- 效果类似于将模型"升级"一个档次

**代表工作**：OpenAI PRM800K、DeepSeek-R1 的 GRPO 训练、o1/o3 的推理时搜索。

---

## Q98. 什么是 Offline RL Under Distribution Shift？ 🔴 Hard

**Offline RL（离线强化学习）**：只用预先收集的静态数据集训练 RL 策略，不与环境交互。

**Distribution Shift 问题**：
- 训练数据由行为策略（Behavior Policy）收集
- 学习的策略（Learned Policy）可能访问训练数据中未见过的状态-动作对
- 对这些 OOD（Out-of-Distribution）状态-动作对的 Q 值估计不准确（通常过高估计）
- 导致策略在部署时表现差

**解决方案**：

| 方法 | 原理 |
|------|------|
| CQL（Conservative Q-Learning） | 惩罚 OOD 动作的 Q 值，保守估计 |
| IQL（Implicit Q-Learning） | 避免直接查询 OOD 动作，用分位数回归 |
| TD3+BC | 在策略优化中加入行为克隆正则化 |
| Decision Transformer | 将 RL 建模为序列预测，用 Transformer 直接学习策略 |

**在 LLM 对齐中的应用**：RLHF 本质上是 Offline RL（用人类偏好数据训练奖励模型，再优化策略）。

---

## Q99. 什么是 Dreamer vs MuZero World Models？ 🔴 Hard

**World Model（世界模型）**：能够预测环境状态变化的模型，用于在"想象"中规划和训练策略。

**DreamerV3**：
- 用 RSSM（循环状态空间模型）学习世界模型
- 在世界模型的"想象"中训练 Actor-Critic
- 无需真实环境交互，样本效率极高
- 在 Atari、DMControl、Minecraft 等任务上达到人类水平

**MuZero（DeepMind）**：
- 不学习完整的环境模型，只学习对规划有用的隐式模型
- 结合 MCTS（蒙特卡洛树搜索）进行规划
- 在 Atari、围棋、国际象棋上达到超人水平

**对比**：
| 对比 | DreamerV3 | MuZero |
|------|-----------|--------|
| 世界模型 | 显式（预测观测） | 隐式（只预测价值/策略） |
| 规划方式 | 在想象中展开轨迹 | MCTS |
| 适用场景 | 连续控制、视觉任务 | 离散动作、棋类游戏 |
| 样本效率 | 高 | 中 |

---

## Q100. 什么是 SLO-Aware Multi-Tenant Model Serving？ 🔴 Hard

**SLO（Service Level Objective）**：服务质量目标，如"P99 延迟 < 2 秒"、"可用性 > 99.9%"。

**Multi-Tenant（多租户）**：多个用户/团队共享同一套 LLM 推理基础设施。

**挑战**：
- 不同租户有不同的 SLO 要求（实时对话 vs 批处理任务）
- 资源竞争（高优先级请求被低优先级请求阻塞）
- 公平性（防止某个租户占用过多资源）

**SLO-Aware 调度策略**：
```
请求队列（按 SLO 优先级排序）：
  高优先级（实时对话，SLO: P99 < 500ms）→ 优先调度
  中优先级（API 调用，SLO: P99 < 2s）→ 正常调度
  低优先级（批处理，SLO: 吞吐量 > 1000 token/s）→ 填充空闲资源

资源隔离：
  GPU 分区（MIG，Multi-Instance GPU）
  KV Cache 配额（每个租户的最大 KV Cache 大小）
  请求速率限制（Token Bucket 算法）
```

**代表系统**：vLLM 的优先级队列、Triton Inference Server 的模型并发控制。

---

## Q101. 什么是 Continuous Batching Fairness？ 🔴 Hard

**连续批处理（Continuous Batching）**：每个解码步骤后，立即将新请求插入空闲槽位，不等待整个 batch 完成。

**公平性问题**：
- 长序列请求会长期占用 GPU 资源，导致短序列请求等待时间长
- 某些用户的请求可能被"饿死"（长时间得不到处理）

**公平性策略**：

| 策略 | 原理 | 权衡 |
|------|------|------|
| FCFS（先来先服务） | 按到达顺序处理 | 简单，但长请求阻塞短请求 |
| Shortest Job First | 优先处理短请求 | 吞吐量高，但长请求可能饿死 |
| Fair Queuing | 每个用户轮流处理 | 公平，但吞吐量下降 |
| Preemption（抢占） | 长请求可以被高优先级请求打断 | 公平，但需要保存/恢复状态 |

**Preemption 实现**：
- 将被抢占请求的 KV Cache 换出到 CPU（Swap）
- 或者直接丢弃 KV Cache，重新计算（Recompute）
- vLLM 支持基于 PagedAttention 的高效抢占

---

## Q102. 什么是 MLOps 的核心组件？如何构建 ML 平台？ 🟡 Medium

**MLOps 核心组件**：

| 组件 | 功能 | 代表工具 |
|------|------|---------|
| 数据版本管理 | 追踪数据集变化 | DVC、LakeFS |
| 实验追踪 | 记录超参数、指标、模型 | MLflow、W&B、Neptune |
| 特征存储 | 统一管理特征 | Feast、Tecton |
| 模型注册 | 版本管理、审批流程 | MLflow Registry |
| CI/CD | 自动化训练、测试、部署 | GitHub Actions、Kubeflow |
| 监控 | 数据漂移、模型性能退化 | Evidently、Arize |

**ML 特有挑战**：
- 数据依赖（代码不变但数据变了，结果也变）
- 不确定性（相同代码不同随机种子结果不同）
- 模型退化（分布漂移导致线上性能下降）

**LLMOps**（LLM 时代的 MLOps）：
- Prompt 版本管理（LangSmith、PromptLayer）
- LLM 评测自动化（LLM-as-Judge）
- 成本追踪（token 消耗 → 费用）
- 幻觉监控（检测生成内容的事实准确性）

---

## Q103. 什么是数据飞轮（Data Flywheel）？ 🟡 Medium

**数据飞轮**：用户使用产品 → 产生数据 → 改进模型 → 产品更好 → 吸引更多用户 → 产生更多数据的正向循环。

**AI 产品的数据飞轮**：
```
用户使用 → 收集反馈（点赞/踩、编辑、重新生成）
         → 识别模型弱点（高频失败案例）
         → 针对性收集训练数据
         → 微调/重训练模型
         → 模型更好 → 用户更满意 → 更多使用
```

**关键要素**：
- **反馈收集**：设计合理的反馈机制（不能太打扰用户）
- **数据标注**：将用户行为转化为训练信号（隐式反馈 vs 显式反馈）
- **快速迭代**：缩短从数据到模型更新的周期（周级别 → 天级别）
- **隐私保护**：用户数据的合规使用（差分隐私、数据脱敏）

**竞争壁垒**：数据飞轮是 AI 产品最重要的护城河，先发优势积累的数据难以被后来者复制。

---

## Q104. 什么是 Experimentation、Reproducibility 和 MLOps？ 🟡 Medium

**实验可重复性（Reproducibility）**：给定相同的代码、数据、环境，能够得到相同的结果。

**ML 实验可重复性的挑战**：
- 随机性（随机种子、数据 shuffle 顺序）
- 环境依赖（CUDA 版本、库版本）
- 数据版本（训练数据可能被修改）
- 硬件差异（不同 GPU 的浮点运算结果略有不同）

**最佳实践**：
```python
# 固定随机种子
import random, numpy as np, torch
random.seed(42)
np.random.seed(42)
torch.manual_seed(42)
torch.cuda.manual_seed_all(42)
torch.backends.cudnn.deterministic = True

# 记录实验配置
mlflow.log_params({
    "model": "llama-3-8b",
    "lr": 1e-4,
    "batch_size": 32,
    "data_version": "v2.1",
    "git_commit": git.Repo().head.commit.hexsha
})
```

**实验追踪系统**：W&B、MLflow、Neptune 都支持自动记录超参数、指标、模型权重、代码版本。

---

## Q105. 什么是 Two-Tower Retrieval for Recommendations？ 🟡 Medium

**双塔模型（Two-Tower Model）**：推荐系统中用于大规模候选召回的模型。

**架构**：
```
User Tower：用户特征（历史行为、人口属性）→ 用户向量 u
Item Tower：物品特征（标题、类别、标签）→ 物品向量 v
相似度：score = u · v（点积）或 cosine(u, v)
```

**训练**：
- **正样本**：用户实际点击/购买的物品
- **负样本**：随机负采样 + 难负样本（用户曝光但未点击）
- **损失函数**：InfoNCE（对比损失）或 Sampled Softmax

**工程优化**：
- 物品向量离线预计算，存入向量数据库
- 在线只需计算用户向量 + ANN 检索（毫秒级）
- 支持亿级物品库的实时召回

**双塔 vs 交叉模型**：
- 双塔：速度快（适合召回），但用户-物品交互建模弱
- 交叉模型（如 DIN）：精度高（适合精排），但速度慢

---

## Q106. 什么是 Fraud Detection in Financial Transactions？ 🟢 Easy

**金融欺诈检测**：识别信用卡欺诈、洗钱、账户盗用等异常交易。

**挑战**：
- **严重不平衡**：正常交易 vs 欺诈交易 = 1000:1 甚至更高
- **实时性**：需要在毫秒级内做出决策
- **对抗性**：欺诈者会针对检测模型进行对抗

**特征工程**：
- 交易金额、时间、地点
- 用户历史行为（过去 1 小时/24 小时的交易统计）
- 设备指纹、IP 地址
- 商户类别、交易频率

**模型选择**：
| 模型 | 优点 | 缺点 |
|------|------|------|
| XGBoost | 快速、可解释 | 特征工程依赖 |
| 图神经网络 | 捕捉账户关系网络 | 复杂 |
| 序列模型（LSTM） | 捕捉时序模式 | 延迟较高 |
| 规则 + ML 混合 | 可解释，合规 | 维护成本高 |

**评测**：不能用 Accuracy（不平衡），用 F1、AUC-ROC、Precision@K；特别关注 False Negative Rate（漏报欺诈的代价极高）。

---

## Q107. 什么是 Customer Segmentation for Marketing Campaigns？ 🟡 Medium

**客户分群**：将客户按照行为、属性、价值等维度分成不同群体，针对性地制定营销策略。

**RFM 模型**（经典方法）：
- **R（Recency）**：最近一次购买距今多久
- **F（Frequency）**：购买频率
- **M（Monetary）**：消费金额

**机器学习方法**：

| 方法 | 原理 | 适用场景 |
|------|------|---------|
| K-Means | 基于距离的聚类 | 特征维度低，球形簇 |
| DBSCAN | 基于密度的聚类 | 任意形状簇，有噪声 |
| 层次聚类 | 自底向上合并 | 需要树状结构 |
| GMM | 高斯混合模型 | 软分配，椭圆形簇 |
| 深度聚类 | Autoencoder + 聚类 | 高维数据 |

**AI 增强的客户分群**：
- 用 LLM 分析客户评论，提取情感和偏好
- 用序列模型（Transformer）建模购买序列
- 用图神经网络捕捉客户社交关系

**评测**：轮廓系数（Silhouette Score）、Davies-Bouldin 指数；最终以业务指标（转化率、ROI）评估。

---

## Q108. 什么是 High Quality Human Data？如何构建高质量标注数据集？ 🟡 Medium

**高质量数据的重要性**：LIMA 论文证明 1000 条高质量数据优于 50000 条低质量数据；数据质量是 LLM 性能的关键瓶颈。

**数据质量维度**：
| 维度 | 说明 | 检测方法 |
|------|------|---------|
| 准确性 | 事实正确 | 专家审核、自动核查 |
| 多样性 | 覆盖不同话题/风格 | 嵌入空间多样性 |
| 完整性 | 回答完整，不截断 | 长度分布、完整性检查 |
| 一致性 | 相似问题回答一致 | 一致性测试 |
| 安全性 | 无有害内容 | 安全分类器 |

**标注流程最佳实践**：
1. **标注指南**：详细的标注规范，包含示例和边界情况
2. **标注员培训**：确保标注员理解任务
3. **质量控制**：多人标注 + 一致性检验（Cohen's Kappa）
4. **迭代改进**：根据模型反馈改进标注指南
5. **主动学习**：优先标注模型最不确定的样本

**合成数据**：用强模型（GPT-4）生成数据，再用弱模型学习（Self-Instruct、Evol-Instruct）。
