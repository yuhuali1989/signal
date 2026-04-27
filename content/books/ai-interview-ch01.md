---
title: "AI 概念面试题 120 道 - 第1章: Fundamental 基础篇"
book: "AI 概念面试题 120 道"
chapter: "1"
chapterTitle: "Fundamental 基础篇"
description: "对标 aiofferly.com Fundamental 分类：梯度下降、优化器（SGD/Adam/AdamW）、激活函数、正则化、偏差-方差、PCA、Transformer 架构、注意力机制、MQA/GQA、混合精度训练等 25 道核心基础题，含难度标注"
date: "2026-04-13"
updatedAt: "2026-04-13"
agent: "研究员→编辑→审校员"
tags:
  - "面试"
  - "Fundamental"
  - "梯度下降"
  - "Transformer"
  - "优化器"
type: "book"
---

# 第 1 章：Fundamental 基础篇

> 选自《AI 概念面试题 120 道》· 对标 aiofferly.com Fundamental 分类题库

每题标注难度：🟢 Easy · 🟡 Medium · 🔴 Hard

---

## Q1. 梯度下降的基本原理是什么？SGD、Mini-batch GD、Full-batch GD 的区别？ 🟢 Easy

**梯度下降**：沿损失函数梯度的反方向更新参数，逐步逼近最小值：
```
θ ← θ - η · ∇L(θ)
```

| 类型 | 每步使用样本数 | 优点 | 缺点 |
|------|------------|------|------|
| Full-batch GD | 全部数据 | 梯度准确，收敛稳定 | 内存大，更新慢 |
| SGD | 1 个样本 | 更新快，有噪声可逃离局部最优 | 梯度噪声大，收敛不稳定 |
| Mini-batch GD | k 个样本（通常 32-512） | 兼顾速度和稳定性 | 需调 batch size |

**实践**：深度学习几乎都用 Mini-batch GD，通常简称"SGD"。

---

## Q2. SGD with Momentum 的原理是什么？ 🟡 Medium

**问题**：普通 SGD 在梯度方向频繁震荡，收敛慢，容易陷入鞍点。

**Momentum（动量）**：引入速度向量 v，累积历史梯度方向：
```
v_t = β · v_{t-1} + (1-β) · g_t      # 动量累积（β 通常 0.9）
θ ← θ - η · v_t
```

**直觉**：像小球滚下山坡，积累惯性，在一致方向上加速，在震荡方向上抵消。

**效果**：
- 加速收敛（尤其在梯度方向一致的维度）
- 减少震荡（在梯度方向不一致的维度）
- 更容易逃离鞍点

**Nesterov Momentum**：在"预测位置"计算梯度，比标准 Momentum 更精确：
```
v_t = β · v_{t-1} + η · ∇L(θ - β · v_{t-1})
```

---

## Q3. Adam 优化器的原理？与 AdamW 的区别？ 🟡 Medium

**Adam**：结合一阶矩（动量）和二阶矩（自适应学习率）：
```
m_t = β₁·m_{t-1} + (1-β₁)·g_t          # 一阶矩（动量），β₁=0.9
v_t = β₂·v_{t-1} + (1-β₂)·g_t²         # 二阶矩（梯度平方），β₂=0.999
m̂_t = m_t/(1-β₁ᵗ)                       # 偏差修正
v̂_t = v_t/(1-β₂ᵗ)
θ ← θ - η · m̂_t / (√v̂_t + ε)
```

**直觉**：m 是"方向"，v 是"步长自适应"——梯度大的参数步长小，梯度小的参数步长大。

**AdamW（解耦权重衰减）**：Adam 的 L2 正则化通过梯度传递，会被自适应学习率缩放，效果不如直接衰减权重：
```
# Adam + L2（有问题）：g_t = ∇L + λ·θ  → 权重衰减被 v̂_t 缩放
# AdamW（正确）：θ ← θ·(1 - η·λ) - η·m̂_t/(√v̂_t + ε)
```

**实践**：LLM 预训练标配 AdamW；图像分类 SGD+Momentum 有时泛化更好。

---

## Q4. 什么是偏差（Bias）和方差（Variance）？如何权衡？ 🟢 Easy

**偏差**：模型预测值与真实值的系统性偏差，反映**欠拟合**（模型太简单）。

**方差**：模型在不同训练集上预测结果的波动，反映**过拟合**（模型太复杂）。

```
总误差 = 偏差² + 方差 + 不可约噪声
```

**权衡策略**：

| 症状 | 诊断 | 解决方案 |
|------|------|---------|
| 训练/测试 loss 都高 | 高偏差（欠拟合） | 增加模型复杂度、增加特征、减少正则化 |
| 训练 loss 低但测试 loss 高 | 高方差（过拟合） | 增加数据、正则化、Dropout、集成 |

**学习曲线**：训练集和验证集 loss 随数据量变化的曲线，是诊断偏差/方差的标准工具。

---

## Q5. L1 和 L2 正则化的区别？为什么 L1 产生稀疏解？ 🟡 Medium

| 对比维度 | L1（Lasso） | L2（Ridge） |
|---------|------------|------------|
| 惩罚项 | λ∑\|wᵢ\| | λ∑wᵢ² |
| 稀疏性 | ✅ 部分权重精确为 0 | ❌ 权重趋近 0 但不为 0 |
| 特征选择 | ✅ 自动特征选择 | ❌ 保留所有特征 |
| 对异常值 | 鲁棒 | 敏感 |
| 梯度 | 不连续（在 0 处） | 连续 |

**为什么 L1 产生稀疏解**：L1 的约束域是菱形，最优解倾向于落在顶点（坐标轴上），即某些权重为 0；L2 的约束域是圆形，解均匀收缩，不会精确为 0。

**Elastic Net**：L1 + L2 的组合，兼顾稀疏性和稳定性。

---

## Q6. 什么是 Dropout？训练和推理时有何不同？ 🟢 Easy

**原理**：训练时随机将部分神经元输出置为 0（概率 p），强迫网络学习冗余表示。

**Inverted Dropout**（现代标准实现）：
```python
# 训练时：丢弃概率 p，保留的神经元除以 (1-p) 保持期望不变
mask = (torch.rand(x.shape) > p).float()
x = x * mask / (1 - p)

# 推理时：关闭 Dropout，直接使用所有神经元
# model.eval() 自动处理
```

**为什么有效**：
- 防止神经元共适应（Co-adaptation）
- 相当于训练了 2ⁿ 个共享权重的子网络的集成
- 轻微正则化效果

**注意**：Transformer 中 Dropout 通常加在 Attention 权重和 FFN 输出上；推理时必须调用 `model.eval()`。

---

## Q7. 什么是 Batch Normalization 和 Layer Normalization？各自适用场景？ 🟡 Medium

**Batch Normalization（BN）**：
```
x̂ = (x - μ_B) / √(σ_B² + ε)    # 在 batch 维度归一化
y = γ·x̂ + β                      # 可学习缩放和平移
```
- 适用：CNN、图像任务、大 batch
- 缺点：依赖 batch 统计，batch 小时效果差；训练/推理行为不同

**Layer Normalization（LN）**：
```
x̂ = (x - μ_L) / √(σ_L² + ε)    # 在特征维度归一化（对每个样本）
```
- 适用：Transformer、NLP、小 batch、序列任务
- 优点：与 batch size 无关，训练/推理行为一致

**其他变体**：
- **RMSNorm**：只做缩放不做平移（LLaMA 使用），计算更快
- **Group Norm**：介于 BN 和 LN 之间，适合小 batch 的 CV 任务

---

## Q8. Transformer 架构的核心组件是什么？ 🟡 Medium

**Encoder Block**（BERT 类）：
```
输入 → Multi-Head Self-Attention → Add & LayerNorm → FFN → Add & LayerNorm
```

**Decoder Block**（GPT 类）：
```
输入 → Masked Self-Attention → Add & LN → [Cross-Attention → Add & LN] → FFN → Add & LN
```

**关键组件**：
| 组件 | 作用 |
|------|------|
| Multi-Head Attention | 并行捕捉不同子空间的依赖关系 |
| FFN（Feed-Forward） | 两层 MLP，通常 4× hidden dim，非线性变换 |
| 残差连接 | 缓解梯度消失，使深层网络可训练 |
| Layer Norm | 稳定训练，加速收敛 |
| 位置编码 | 注入序列位置信息（Attention 本身位置无关） |

**Pre-LN vs Post-LN**：现代 LLM 多用 Pre-LN（LN 在 Attention/FFN 之前），训练更稳定。

---

## Q9. Multi-Head Self-Attention 的原理？为什么要多头？ 🟡 Medium

**Scaled Dot-Product Attention**：
```
Attention(Q, K, V) = softmax(QKᵀ / √d_k) · V
```
- Q（Query）：当前位置想查询的信息
- K（Key）：每个位置的"索引"
- V（Value）：每个位置的实际内容
- √d_k：缩放因子，防止点积过大导致 softmax 梯度消失

**Multi-Head**：将 Q、K、V 投影到 h 个不同低维子空间，分别计算注意力，再拼接：
```
MultiHead(Q,K,V) = Concat(head₁,...,headₕ) · W^O
headᵢ = Attention(Q·Wᵢ^Q, K·Wᵢ^K, V·Wᵢ^V)
```

**为什么多头**：不同头可以关注不同类型的关系（语法、语义、指代、位置等），增强表达能力，参数量与单头相当（每头维度缩小 h 倍）。

---

## Q10. Multi-Query Attention（MQA）和 Grouped-Query Attention（GQA）是什么？ 🟡 Medium

**背景**：标准 MHA（Multi-Head Attention）中每个 Q 头都有独立的 K、V 头，KV Cache 显存占用大。

**MQA（Multi-Query Attention）**：所有 Q 头共享同一组 K、V：
- KV Cache 减少 h 倍（h = 头数）
- 推理速度大幅提升
- 代价：模型质量略有下降

**GQA（Grouped-Query Attention）**：将 Q 头分成 g 组，每组共享一对 K、V（MHA 和 MQA 的折中）：
- KV Cache 减少 h/g 倍
- 质量接近 MHA，速度接近 MQA

**使用情况**：
- MQA：Falcon、PaLM
- GQA：LLaMA 3、Mistral、Gemma（g=8，即 8 个 Q 头共享 1 对 KV）

---

## Q11. 什么是 KV Cache？为什么重要？如何优化？ 🟡 Medium

**KV Cache**：自回归生成时，缓存已计算过的 Key 和 Value 矩阵，避免重复计算。

**原理**：生成第 t 个 token 时，前 t-1 个 token 的 K、V 已计算，直接复用：
```
无 KV Cache：每步重新计算所有 token 的 K、V → O(t²) 复杂度
有 KV Cache：只计算新 token 的 K、V，与缓存拼接 → O(t) 复杂度
```

**显存占用**：`2 × num_layers × num_heads × head_dim × seq_len × batch_size × bytes`

**优化方案**：
| 方法 | 原理 | 效果 |
|------|------|------|
| MQA/GQA | 减少 K、V 头数 | KV Cache 减少 4-8x |
| PagedAttention（vLLM） | 非连续内存管理，消除碎片 | 显存利用率 60%→96% |
| Prefix Caching | 共享前缀的请求复用 KV Cache | 首 token 延迟降低 50%+ |
| 量化 KV Cache | INT8/INT4 存储 | 显存减少 2-4x |

---

## Q12. 什么是 Flash Attention？解决了什么问题？ 🟡 Medium

**问题**：标准 Attention 需要将 N×N 的注意力矩阵写入 HBM（显存），I/O 成本是主要瓶颈（不是计算量）。

**Flash Attention 核心思想**：
1. **分块计算（Tiling）**：将 Q、K、V 分成小块，在 SRAM（片上缓存，带宽比 HBM 快 10x）中完成计算
2. **在线 Softmax**：用数值稳定的在线算法，无需存储完整注意力矩阵
3. **重计算（Recomputation）**：反向传播时重新计算注意力，而非存储，以计算换显存

**效果**：
- 速度提升 2-4x（Flash Attention 2）
- 显存从 O(N²) 降至 O(N)
- 支持更长序列（128K+）

**版本**：Flash Attention 1（2022）→ FA2（2023，进一步优化并行）→ FA3（2024，H100 优化）

---

## Q13. 什么是位置编码？RoPE 的原理是什么？ 🟡 Medium

**为什么需要位置编码**：Attention 本身对位置不敏感（置换不变），需要额外注入位置信息。

**正弦位置编码（原始 Transformer）**：
```
PE(pos, 2i)   = sin(pos / 10000^(2i/d))
PE(pos, 2i+1) = cos(pos / 10000^(2i/d))
```
优点：可外推；缺点：绝对位置编码，不能直接表达相对位置。

**RoPE（旋转位置编码，LLaMA/GPT-NeoX 使用）**：
- 将位置信息编码为旋转矩阵，作用于 Q 和 K
- 两个 token 的注意力分数只依赖它们的**相对位置**（旋转角度之差）
- 支持长度外推（配合 YaRN 等技术）

```
Q_rotated = Q · R(pos)    # R 是旋转矩阵
K_rotated = K · R(pos)
QK^T 的结果只依赖 pos_q - pos_k
```

**ALiBi**：在注意力分数上加线性偏置 -|i-j|·m，外推性能优秀，无需修改嵌入。

---

## Q14. 什么是残差连接（Residual Connection）？为什么有效？ 🟢 Easy

**原理**：在层的输出上加上输入（跳跃连接）：
```
output = F(x) + x
```

**为什么有效**：
1. **缓解梯度消失**：梯度可以直接通过跳跃连接反向传播，不经过非线性变换
2. **恒等映射退化**：最坏情况 F(x)=0，退化为恒等映射，不会比浅层网络更差
3. **特征复用**：低层特征直接传递到高层

**影响**：ResNet 使得训练 100+ 层网络成为可能；Transformer 中每个子层都有残差连接。

---

## Q15. 什么是主成分分析（PCA）？ 🟢 Easy

**PCA**：通过线性变换将高维数据投影到低维空间，使投影后方差最大（信息损失最小）。

**步骤**：
1. 数据中心化（减去均值）
2. 计算协方差矩阵 Σ = XᵀX / (n-1)
3. 对 Σ 做特征值分解：Σ = VΛVᵀ
4. 取前 k 个最大特征值对应的特征向量作为主成分

**应用**：降维、可视化（t-SNE/UMAP 更适合可视化）、去噪、特征解耦

**局限**：只能捕捉线性关系；对异常值敏感；主成分可解释性差。

**PCA vs t-SNE**：PCA 保留全局结构（线性），t-SNE 保留局部结构（非线性），适合可视化聚类。

---

## Q16. 什么是 K 折交叉验证？Stratified K-Fold 的作用？ 🟡 Medium

**K 折交叉验证**：将数据集分成 K 份，每次用 K-1 份训练、1 份验证，重复 K 次，取平均性能。

**作用**：充分利用有限数据；减少评估结果的随机性；用于超参数选择和模型比较。

**Stratified K-Fold**：保持每折中类别比例与原始数据集一致：
- 适合**不平衡数据集**（如正负样本比例 1:100）
- 防止某折中某类别样本过少导致评估不准确

**实践建议**：
- 分类任务默认用 Stratified K-Fold
- K 通常取 5 或 10
- 数据量极少时用 Leave-One-Out（K=n）

---

## Q17. 什么是集成学习？Bagging 和 Boosting 的区别？ 🟡 Medium

| 对比 | Bagging | Boosting |
|------|---------|---------|
| 训练方式 | 并行，独立训练 | 串行，后一个关注前一个的错误 |
| 目标 | 降低方差（解决过拟合） | 降低偏差（解决欠拟合） |
| 代表算法 | Random Forest | AdaBoost、GBDT、XGBoost |
| 采样方式 | 有放回采样（Bootstrap） | 调整样本权重或拟合残差 |

**Random Forest**：Bagging + 随机特征子集，进一步降低树间相关性。

**XGBoost vs GBDT**：XGBoost 加入正则化项、二阶梯度、并行化、缺失值处理，工程优化更好。

**Stacking**：用元学习器（Meta-learner）组合多个基模型的预测，比简单投票更灵活。

---

## Q18. 什么是混合精度训练（Mixed Precision Training）？FP16/BF16/FP8 的区别？ 🟡 Medium

| 格式 | 指数位 | 尾数位 | 数值范围 | 精度 | 适用场景 |
|------|-------|-------|---------|------|---------|
| FP32 | 8 | 23 | 大 | 高 | 传统训练、梯度累积 |
| FP16 | 5 | 10 | 小（易溢出） | 中 | 推理、旧版混合精度 |
| BF16 | 8 | 7 | 大（同 FP32） | 低 | LLM 训练首选 |
| FP8 | 4/5 | 3/2 | — | 低 | H100 推理加速 |

**LLM 训练为什么用 BF16**：BF16 与 FP32 有相同的指数位，数值范围相同，不会溢出；虽然精度低于 FP16，但 LLM 训练对精度要求不高，对范围要求高。

**混合精度训练流程**：
```
前向传播：BF16/FP16（快）
反向传播：BF16/FP16（快）
梯度累积：FP32（精确）
参数更新：FP32（精确）
```

---

## Q19. 什么是 Elo 评分系统？在 LLM 评测中如何应用？ 🟡 Medium

**Elo 系统**：一种基于对战结果动态更新选手评分的方法，源自国际象棋：
```
E_A = 1 / (1 + 10^((R_B - R_A)/400))   # A 赢 B 的期望概率
R_A' = R_A + K·(S_A - E_A)              # 更新 A 的评分（K 通常 32）
```

**在 LLM 评测中的应用（Chatbot Arena）**：
- 用户对两个匿名模型的回答进行偏好投票（A 更好 / B 更好 / 平局）
- 根据投票结果用 Elo 算法更新模型评分
- 优点：不需要固定基准，反映真实用户偏好；可以比较任意两个模型

**局限**：需要大量对战数据才能稳定；用户偏好可能有偏见（如偏好更长的回答）。

---

## Q20. 什么是 Activation Checkpointing（梯度检查点）？ 🟡 Medium

**问题**：反向传播需要保存前向传播的所有中间激活值，显存占用 = O(层数 × batch × seq_len × hidden)。

**Activation Checkpointing**：
- 前向传播时只保存部分"检查点"激活值，其余丢弃
- 反向传播时，从最近的检查点**重新计算**丢弃的激活值

**权衡**：
- 显存节省：从 O(N) 降至 O(√N)（每隔 √N 层保存一个检查点）
- 计算开销：增加约 33% 的额外前向计算

**适用场景**：显存不足时训练更大的 batch size 或更长的序列；训练 70B+ 模型时几乎必用。

---

## Q21. 什么是 ZeRO 优化？三个阶段分别做了什么？ 🔴 Hard

**ZeRO（Zero Redundancy Optimizer，DeepSpeed）**：消除数据并行训练中的显存冗余。

**数据并行的冗余**：每个 GPU 都保存完整的模型参数、梯度、优化器状态（Adam 需要 m 和 v），显存浪费严重。

| 阶段 | 分片内容 | 显存节省（N 个 GPU） |
|------|---------|------------------|
| ZeRO-1 | 优化器状态 | 4x |
| ZeRO-2 | 优化器状态 + 梯度 | 8x |
| ZeRO-3 | 优化器状态 + 梯度 + 参数 | 64x（理论） |

**ZeRO-Offload**：将优化器状态和梯度卸载到 CPU，进一步节省 GPU 显存。

**实践**：训练 70B+ 模型通常需要 ZeRO-3 + Activation Checkpointing + BF16 混合精度。

---

## Q22. 什么是 Distributed Training 和 4D 并行？ 🔴 Hard

**四种并行策略**：

| 并行类型 | 分割维度 | 通信开销 | 适用场景 |
|---------|---------|---------|---------|
| 数据并行（DP） | 数据 batch | All-Reduce 梯度 | 模型能放入单 GPU |
| 张量并行（TP） | 矩阵运算 | 每层 All-Reduce | 单层参数量大 |
| 流水线并行（PP） | 模型层 | 层间激活传递 | 层数多 |
| 序列并行（SP） | 序列长度 | 序列维度通信 | 超长序列 |

**4D 并行**（Megatron-LM）：同时使用 DP + TP + PP + SP，训练千亿参数模型。

**流水线气泡**：PP 中 GPU 等待上游计算的空闲时间，通过 micro-batch 流水线调度（1F1B）减少。

---

## Q23. 什么是 Feature Store？Point-in-Time Correctness 是什么？ 🔴 Hard

**Feature Store**：统一管理机器学习特征的平台，解决训练和推理时特征不一致的问题。

**核心功能**：
- 特征计算和存储（离线 + 在线）
- 特征版本管理
- 特征共享（不同模型复用相同特征）
- 低延迟在线服务（毫秒级特征查询）

**Point-in-Time Correctness（时间点正确性）**：
- **问题**：训练时如果使用了"未来"的特征值（数据泄露），模型在生产中会失效
- **解决**：训练时对每个样本，只使用该样本**时间点之前**已知的特征值
- **实现**：Feature Store 记录每个特征值的有效时间范围，训练时按时间点查询

**代表工具**：Feast（开源）、Tecton（商业）、Hopsworks

---

## Q24. 什么是 Inference Serving 的延迟、吞吐量和可靠性？ 🔴 Hard

**核心指标**：
| 指标 | 定义 | 优化方向 |
|------|------|---------|
| TTFT（首 token 延迟） | 从请求到第一个 token 的时间 | 减少 prefill 计算量 |
| TPOT（每 token 延迟） | 生成每个 token 的平均时间 | 优化 decode 效率 |
| 吞吐量（Throughput） | 单位时间处理的 token 数 | 连续批处理、大 batch |
| P99 延迟 | 99% 请求的延迟上限 | 减少长尾，资源隔离 |

**延迟 vs 吞吐量的权衡**：
- 大 batch → 高吞吐量，但单请求延迟增加
- 小 batch → 低延迟，但 GPU 利用率低

**可靠性保障**：
- 健康检查 + 自动重启
- 请求队列 + 超时机制
- 多副本负载均衡
- 熔断器（Circuit Breaker）防止级联故障

---

## Q25. 什么是 CTR 预估和广告排序？ 🟡 Medium

**CTR（Click-Through Rate）预估**：预测用户点击某个广告/内容的概率，是推荐系统和广告系统的核心。

**经典模型演进**：
```
LR（逻辑回归）→ FM（因子分解机）→ DeepFM → DIN → DIEN → 双塔模型
```

**双塔模型（Two-Tower）**：
- User Tower：编码用户特征 → 用户向量
- Item Tower：编码物品特征 → 物品向量
- 相似度：用户向量和物品向量的点积/余弦相似度
- 优点：物品向量可以离线预计算，在线只需计算用户向量 + ANN 检索

**特征工程**：用户历史行为序列、上下文特征（时间、位置）、交叉特征（用户×物品）

**训练目标**：多任务学习（同时预测点击、转化、停留时长），用加权损失平衡。
