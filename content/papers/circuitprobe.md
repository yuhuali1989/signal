---
title: "CircuitProbe: 通过稳定区域检测预测 Transformer 推理电路"
authors: "Rajkiran Panuganti"
venue: "arXiv 2026 (cs.AI)"
arxivUrl: "https://arxiv.org/abs/2604.00716"
date: "2026-04-12"
category: "arch"
importance: 4
tags:
  - "Interpretability"
  - "Mechanistic"
  - "Transformer"
  - "Circuit"
type: "paper"
---

# CircuitProbe: Predicting Reasoning Circuits in Transformers via Stability Zone Detection

## 论文信息

| 项目 | 内容 |
|------|------|
| 标题 | CircuitProbe: Predicting Reasoning Circuits in Transformers via Stability Zone Detection |
| 作者 | Rajkiran Panuganti |
| 发表 | arXiv 2604.00716, April 2026 |
| 领域 | 机械可解释性（Mechanistic Interpretability） |

## 一句话总结

> **通过检测 Transformer 内部的"稳定区域"（Stability Zones）——即对输入扰动鲁棒的神经元子集——来自动发现和预测负责特定推理任务的计算电路，无需传统的逐层消融或激活修补。**

## 研究动机

### 可解释性的核心挑战

当前 LLM 可解释性研究面临一个基本困境：

```
传统方法（Activation Patching / Causal Tracing）:
  1. 选定一个行为（如"模型能做算术"）
  2. 逐层/逐头修改激活值
  3. 观察行为变化 → 定位关键组件
  
  问题:
  - 计算成本极高: O(L × H × D) 次前向传播
  - L=层数, H=注意力头数, D=维度
  - 对于 Llama 70B: >500K 次前向传播定位一个电路
  - 只能验证已知行为，无法发现未知电路
```

### CircuitProbe 的思路

```
核心洞察: 真正参与推理的神经元对输入噪声具有"稳定性"

直觉类比:
  - 想象一条高速公路上的车流
  - 主干道（推理电路）: 即使有些车变道，整体流向稳定
  - 辅路（非推理组件）: 轻微扰动就改变方向
  
  → 通过测量"对扰动的稳定性"来定位推理电路
```

## 方法详解

### 1. 稳定区域（Stability Zone）定义

对于 Transformer 中的每个组件 $c$（注意力头、MLP 神经元、残差流位置），定义其稳定性分数：

$$S(c) = \frac{1}{N} \sum_{i=1}^{N} \frac{\| f_c(x_i) - f_c(x_i + \epsilon_i) \|}{\| f_c(x_i) \|}$$

其中：
- $f_c(x)$：组件 $c$ 在输入 $x$ 上的激活值
- $\epsilon_i$：随机高斯扰动，$\epsilon \sim \mathcal{N}(0, \sigma^2 I)$
- $N$：采样次数（论文使用 $N=100$）
- $\sigma$：扰动强度（输入嵌入 L2 范数的 5%）

**关键性质**：推理电路的稳定性分数显著低于非推理组件（更稳定 = 更参与推理）。

### 2. 电路发现算法

```python
class CircuitProbe:
    def discover_circuit(self, model, task_examples, sigma=0.05, N=100):
        """
        自动发现负责特定任务的推理电路
        
        Args:
            model: Transformer 模型
            task_examples: 目标任务的输入-输出对
            sigma: 扰动强度
            N: 采样次数
        """
        stability_scores = {}
        
        # 步骤 1: 计算每个组件的稳定性分数
        for component in model.all_components():
            scores = []
            for x, y in task_examples:
                original_act = model.get_activation(x, component)
                
                perturbed_acts = []
                for _ in range(N):
                    eps = torch.randn_like(model.embed(x)) * sigma
                    perturbed_act = model.get_activation(x + eps, component)
                    perturbed_acts.append(perturbed_act)
                
                # 计算相对变化率
                variations = [
                    torch.norm(pa - original_act) / torch.norm(original_act)
                    for pa in perturbed_acts
                ]
                scores.append(np.mean(variations))
            
            stability_scores[component] = np.mean(scores)
        
        # 步骤 2: 稳定区域检测（低变化率 = 推理电路）
        threshold = np.percentile(
            list(stability_scores.values()), 15  # 取最稳定的 15%
        )
        circuit = {c for c, s in stability_scores.items() 
                   if s < threshold}
        
        # 步骤 3: 连通性验证
        circuit = self.verify_connectivity(model, circuit, task_examples)
        
        return circuit
    
    def verify_connectivity(self, model, candidate_circuit, examples):
        """验证候选电路是否形成连通的计算路径"""
        # 只保留候选电路，消融其余组件
        # 检查任务性能是否保持
        ablated_acc = model.evaluate_with_circuit(candidate_circuit, examples)
        full_acc = model.evaluate(examples)
        
        if ablated_acc / full_acc > 0.9:  # 保持 90% 以上性能
            return candidate_circuit
        else:
            # 逐步添加回被消融的组件直到恢复性能
            return self.expand_circuit(model, candidate_circuit, examples)
```

### 3. 效率优势

```
计算复杂度对比:

| 方法 | 前向传播次数 | GPT-2 (12L) | Llama 70B (80L) |
|------|-----------|-------------|-----------------|
| Activation Patching | O(L×H×N) | ~15K | ~500K |
| ACDC (自动电路发现) | O(L×H×N×T) | ~50K | ~2M |
| CircuitProbe | O(N×|D|) | ~3K | ~10K |

N=采样次数(100), H=注意力头数, L=层数, D=数据集大小, T=搜索步数

CircuitProbe 比 Activation Patching 快 50x，且可以发现未知电路。
```

## 实验结果

### 任务 1：算术推理电路

```
模型: GPT-2 Medium (24 层)
任务: 两位数加法 (如 "47 + 38 = 85")

CircuitProbe 发现的电路:
  - 层 2-4: 数字识别注意力头 (将"47"解析为数值)
  - 层 8-10: 进位检测头 (7+8=15, 检测到需要进位)
  - 层 16-18: 加法计算头 (执行实际计算)
  - 层 22-24: 答案格式化头 (将结果转为 token)

验证: 仅保留这 10 个头（总共 24×16=384 个头），
      加法准确率从 94.2% 仅降至 91.8%（保留 97.5% 性能）
```

### 任务 2：语言推理 vs 事实回忆

```
模型: Llama 2 7B
发现: 语言推理电路和事实回忆电路几乎不重叠

语言推理 (如语法判断):
  → 层 1-8 的特定注意力头（浅层）
  
事实回忆 (如"法国首都是___"):
  → 层 20-28 的 MLP 神经元（深层）

重叠度: < 5%

这解释了为什么微调事实知识不会损害语言能力，反之亦然。
```

### 任务 3：安全对齐电路

```
最引人注目的发现:

模型: Llama 2 7B Chat (经过 RLHF 对齐)

安全拒绝电路:
  - 层 14-16: "危险检测头"（识别有害请求）
  - 层 24-26: "拒绝激活头"（触发拒绝回复）
  - MLP 层 15-20: "安全价值神经元"

与 Anthropic 的 Scaling Monosemanticity 研究发现一致:
  SAE 提取的"安全特征" → CircuitProbe 发现的"安全电路"
  两种方法从不同角度指向相同的模型组件。
```

## 与相关工作的对比

| 方法 | 发现能力 | 可扩展性 | 需要标注 | 理论基础 |
|------|---------|---------|---------|---------|
| Activation Patching | ✅ 验证假设 | ❌ 慢 | ✅ 需要 | 因果推理 |
| ACDC | ✅ 自动发现 | ❌ 很慢 | ✅ 需要 | 因果推理 |
| Probing | ❌ 只测线性可分性 | ✅ 快 | ✅ 需要 | 统计相关 |
| SAE | ✅ 特征发现 | ⚠️ 中等 | ❌ 无监督 | 稀疏编码 |
| **CircuitProbe** | ✅ 自动发现 | ✅ 快 | ❌ 无监督 | 动力系统稳定性 |

## 局限性

1. **稳定性 ≠ 因果性**：稳定的组件不一定是因果必要的
2. **扰动强度敏感**：$\sigma$ 选择不当会导致假阳性/假阴性
3. **层间交互未建模**：假设组件独立，忽略层间非线性交互
4. **仅验证到 7B 模型**：70B+ 模型的电路可能更复杂

## 对 AI 安全的意义

```
潜在应用:
1. 安全审计: 检查对齐训练是否真正修改了安全电路
2. 后门检测: 异常稳定区域可能指示植入的后门
3. 能力预测: 通过电路分析预测模型的涌现能力
4. 定向遗忘: 精确消融知识电路而不损害其他能力
```

## 我的评价

**创新性**: ★★★★☆ — 用动力系统稳定性理论解读 Transformer 电路是新颖的视角

**实用性**: ★★★★☆ — 50x 加速使得大模型电路分析从"不可能"变为"困难但可行"

**严谨性**: ★★★☆☆ — 理论基础扎实，但"稳定性→因果性"的跳跃需要更多验证

**影响力**: ★★★★☆ — 如果能扩展到 70B+ 模型，将成为可解释性研究的标准工具

---

*Signal 知识平台 · 论文精读*
