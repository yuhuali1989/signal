---
title: "第 5 章：推理优化核心技术——量化、投机采样与 KV Cache 压缩"
description: "跨框架的推理优化技术：GPTQ/AWQ/SmoothQuant 量化对比、Speculative Decoding 原理与实现、MLA/GQA/MQA 的 KV Cache 压缩"
date: "2026-04-12"
updatedAt: "2026-04-18 11:00"
book: "LLM 推理框架：从原理到优化"
chapter: 5
chapterTitle: "推理优化核心技术——量化、投机采样与 KV Cache 压缩"
tags: ["量化", "Speculative Decoding", "KV Cache", "GQA", "MLA"]
type: "book"
---

# 第 5 章：推理优化核心技术——量化、投机采样与 KV Cache 压缩

本章深入介绍跨框架通用的推理优化核心技术。这些技术不绑定特定推理框架，而是可以在 vLLM、SGLang、TensorRT-LLM 等多个框架中应用。

## 5.1 权重量化：GPTQ vs AWQ vs SmoothQuant

### 5.1.1 量化原理：从浮点到定点

量化的本质是将连续的浮点数映射到有限的离散整数：

**对称量化**：

$$W_{quant} = \text{round}\left(\frac{W}{\Delta}\right), \quad \Delta = \frac{\max(|W|)}{2^{b-1} - 1}$$

**非对称量化**（适合激活值分布不对称的情况）：

$$W_{quant} = \text{round}\left(\frac{W - z}{s}\right), \quad s = \frac{\max(W) - \min(W)}{2^b - 1}, \quad z = \min(W)$$

```python
# 对称 INT8 量化实现
def symmetric_quantize(weight, bits=8):
    """对称量化：以 0 为中心的均匀量化"""
    qmax = 2**(bits-1) - 1  # 127 for INT8
    scale = weight.abs().max() / qmax
    weight_int = torch.round(weight / scale).clamp(-qmax-1, qmax).to(torch.int8)
    return weight_int, scale

# 非对称 INT8 量化实现
def asymmetric_quantize(weight, bits=8):
    """非对称量化：适合单侧分布（如 ReLU 后的激活）"""
    qmax = 2**bits - 1  # 255 for uint8
    w_min, w_max = weight.min(), weight.max()
    scale = (w_max - w_min) / qmax
    zero_point = torch.round(-w_min / scale).clamp(0, qmax)
    weight_int = torch.round(weight / scale + zero_point).clamp(0, qmax).to(torch.uint8)
    return weight_int, scale, zero_point

# 反量化
def dequantize(weight_int, scale, zero_point=None):
    if zero_point is not None:
        return (weight_int.float() - zero_point) * scale
    return weight_int.float() * scale
```

### 5.1.2 分组量化（Group Quantization）

全局量化的问题：如果权重分布存在离群值（outlier），所有权重的量化精度都会受损。

分组量化将权重矩阵按 channel 分组，每组有独立的 scale/zero_point：

$$W_{quant}^{(g)} = \text{round}\left(\frac{W^{(g)}}{\Delta^{(g)}}\right), \quad g = 1, ..., G$$

```python
def group_quantize(weight, bits=4, group_size=128):
    """分组量化：每 128 个元素共享一组 scale/zero_point"""
    # weight: [out_features, in_features]
    n_groups = weight.shape[1] // group_size
    weight_groups = weight.reshape(weight.shape[0], n_groups, group_size)
    
    scales = []
    zeros = []
    quantized = []
    
    for g in range(n_groups):
        w_g = weight_groups[:, g, :]
        w_max = w_g.abs().max(dim=-1, keepdim=True).values
        scale_g = w_max / (2**(bits-1) - 1)
        q_g = torch.round(w_g / scale_g).clamp(-(2**(bits-1)), 2**(bits-1)-1)
        scales.append(scale_g)
        quantized.append(q_g)
    
    return torch.cat(quantized, dim=-1), torch.cat(scales, dim=-1)
```

通常 `group_size=128` 是精度和效率的最佳平衡点。

### 5.1.3 GPTQ：基于 Hessian 的逐列量化

GPTQ 的核心思想：不同权重的"重要性"不同，用 Hessian 矩阵量化重要性：

$$\text{量化误差} = (W - \hat{W})^T H (W - \hat{W})$$

其中 $H = X^TX$ 是由校准数据计算的 Hessian 矩阵。GPTQ 按列量化，每量化一列就用 Hessian 信息补偿误差到后续列：

```python
def gptq_quantize_layer(W, H_inv, bits=4, group_size=128):
    """
    GPTQ 核心算法
    W: [out_features, in_features] 权重矩阵
    H_inv: Hessian 逆矩阵（从校准数据计算）
    """
    n_out, n_in = W.shape
    Q = torch.zeros_like(W)
    Err = torch.zeros_like(W)
    
    # 按 group 处理列
    for col_start in range(0, n_in, group_size):
        col_end = min(col_start + group_size, n_in)
        
        for col in range(col_start, col_end):
            w = W[:, col]
            d = H_inv[col, col]  # 对角线元素
            
            # Step 1: 量化当前列
            q = quantize_to_int(w, bits)
            Q[:, col] = q
            
            # Step 2: 计算误差
            err = (w - q) / d
            
            # Step 3: 将误差补偿到后续列（核心！）
            W[:, col+1:col_end] -= err.unsqueeze(1) * H_inv[col, col+1:col_end].unsqueeze(0)
    
    return Q
```

GPTQ 的优势是**利用少量校准数据，逐层最小化量化误差**，速度比逐权重量化（OBQ）快数百倍。

### 5.1.4 AWQ：激活值感知量化

AWQ (Activation-aware Weight Quantization) 的关键洞察：

> 不是所有权重同等重要——与大激活值对应的权重通道更关键

```
AWQ 核心观察：
  激活值 X 中 ~1% 的通道有显著更大的值
  这些通道对应的权重如果被量化误差影响，输出误差会被放大
  
解决方案：
  1. 用校准数据统计每个通道的激活值均值
  2. 对重要通道的权重做 per-channel scaling 保护
  3. s_c = (act_scale_c)^α  (α ∈ [0, 1], 通常 0.5)
```

```python
def awq_scale_weights(weight, activations, alpha=0.5):
    """AWQ: 根据激活值缩放保护重要通道"""
    # 统计每个通道的激活值大小
    act_scales = activations.abs().mean(dim=0)  # [in_features]
    weight_scales = weight.abs().mean(dim=0)     # [in_features]
    
    # 计算自适应缩放因子
    # 激活大的通道 → scale 大 → 量化前放大 → 量化后精度更高
    scales = (act_scales.pow(alpha) / weight_scales.pow(1-alpha)).clamp(min=1e-5)
    
    # 应用缩放（等价变换，不改变输出）
    scaled_weight = weight * scales.unsqueeze(0)  # 权重乘以 s
    # 推理时需要激活除以 s（或融合到前一层的 bias 中）
    
    return scaled_weight, scales
```

AWQ vs GPTQ 对比：

| 维度 | GPTQ | AWQ |
|------|------|-----|
| 核心思想 | Hessian 误差补偿 | 激活感知缩放 |
| 校准时间 | 中等 (~30 min for 70B) | 快 (~10 min for 70B) |
| INT4 精度 | ★★★★☆ | ★★★★★ |
| 推理速度 | ★★★★☆ | ★★★★★ (kernel 更优) |
| 与 vLLM 集成 | ✅ | ✅ (推荐) |

### 5.1.5 SmoothQuant：平滑 W8A8 量化

LLM 激活值中存在严重的**通道级离群值**（outlier channels），少数通道的激活值比其他通道大 100×+。直接量化激活会导致精度灾难。

SmoothQuant 的解决方案——将激活的"难度"迁移到权重上：

$$Y = XW = (X \text{diag}(s)^{-1}) \cdot (\text{diag}(s) W) = \hat{X} \hat{W}$$

```python
def smooth_quant(X, W, alpha=0.5):
    """
    SmoothQuant: 平滑激活异常值到权重
    数学上是等价变换: Y = XW = (X/s)(sW)
    """
    # 每通道激活最大值和权重最大值
    act_max = X.abs().amax(dim=0)      # [hidden_dim]
    weight_max = W.abs().amax(dim=0)    # [hidden_dim]
    
    # 迁移因子: alpha 控制迁移比例
    # alpha=0.5: 激活和权重各承担一半量化难度
    s = (act_max.pow(alpha) / weight_max.pow(1-alpha)).clamp(min=1e-5)
    
    # 等价变换
    X_smooth = X / s.unsqueeze(0)       # 激活变平滑
    W_smooth = W * s.unsqueeze(0)       # 权重变粗糙（但权重量化更容易）
    
    # 现在两者都可以用 INT8 量化
    X_int8, x_scale = symmetric_quantize(X_smooth, bits=8)
    W_int8, w_scale = symmetric_quantize(W_smooth, bits=8)
    
    return X_int8, W_int8, x_scale, w_scale
```

SmoothQuant 实现了**全 INT8 推理**（W8A8），在 A100/H100 上可以使用 INT8 Tensor Core，吞吐提升 1.5-2×。

### 5.1.6 FP8 量化：新一代硬件原生支持

H100/B200 GPU 原生支持 FP8 格式，两种变体：

| 格式 | 指数位 | 尾数位 | 动态范围 | 精度 | 适用场景 |
|------|--------|--------|---------|------|---------|
| E4M3 | 4 | 3 | ±240 | 较高 | 前向推理 |
| E5M2 | 5 | 2 | ±57344 | 较低 | 反向传播 |

FP8 的优势：**无需校准数据，直接 cast 即可使用**（不像 INT8 需要统计 scale）。

```python
# FP8 推理（H100 原生支持）
import torch

# DeepSeek-V3 训练时已使用 FP8
model = load_model("deepseek-v3")
model = model.to(torch.float8_e4m3fn)  # FP8 E4M3

# 或在 TensorRT-LLM 中自动启用
# trtllm-build --quantization fp8 --model_dir deepseek-v3
```

### 5.1.7 量化方案总览与选型

| 方案 | 位宽 | 速度提升 | 质量损失 | 需要校准 | 推荐场景 |
|------|:---:|:---:|:---:|:---:|:---:|
| GPTQ | W4A16 | 2-3× | 小 | 是 | 显存受限，离线量化 |
| AWQ | W4A16 | 2-3× | **最小** | 是 | **推荐默认方案** |
| SmoothQuant | W8A8 | 1.5-2× | 极小 | 是 | A100/H100 全 INT8 |
| FP8 | W8A8 | 1.5-2× | 极小 | 否 | H100/B200 免校准 |
| GGUF Q4_K_M | W4 混合 | CPU 优化 | 小 | 否 | llama.cpp / 边缘设备 |
| INT2 (QuIP#) | W2 | 3-4× | 明显 | 是 | 极端压缩研究 |

## 5.2 投机采样 (Speculative Decoding)

### 5.2.1 核心思想与数学保证

投机采样的关键性质：**输出分布与直接用大模型采样完全一致**——这是无损加速。

```
传统自回归: 大模型每次只生成 1 个 token → 序列化瓶颈

投机采样流程:
  1. Draft 模型快速生成 K 个候选 token: x₁, x₂, ..., xₖ
  2. Target 模型一次前向计算所有位置的概率: p(x₁), p(x₂|x₁), ..., p(xₖ|x₁:ₖ₋₁)
  3. 从左到右验证每个 token:
     - 接受概率: min(1, p(xᵢ)/q(xᵢ))  [p=target, q=draft]
     - 如果接受: 继续验证下一个
     - 如果拒绝: 从修正分布重采样，停止验证
  4. 返回接受的 token + 一个新采样的 token
```

验证算法的数学保证：

$$P(\text{accept } x_i) = \min\left(1, \frac{p(x_i | x_{<i})}{q(x_i | x_{<i})}\right)$$

拒绝后的修正分布：

$$p_{\text{resample}}(x) = \frac{\max(0, p(x) - q(x))}{1 - \sum_{x'} \min(p(x'), q(x'))}$$

可以证明：这个拒绝采样过程产生的分布 **严格等于** 直接从 $p$ 采样的分布。

### 5.2.2 加速比理论分析

$$\text{Speedup} = \frac{\mathbb{E}[\text{accepted tokens}] + 1}{\text{draft cost} + \text{verify cost}} = \frac{1 - \alpha^{K+1}}{(1-\alpha)(cK + 1)}$$

其中：$K$ = 猜测长度，$\alpha$ = 平均接受率，$c$ = draft/target 速度比

```python
import numpy as np

def speculative_speedup(alpha, K, c):
    """计算投机采样理论加速比"""
    expected_accepted = (1 - alpha**(K+1)) / (1 - alpha)
    cost = c * K + 1  # draft 成本 + 一次 target 验证
    return expected_accepted / cost

# 典型场景
print(f"Llama 8B→70B: {speculative_speedup(0.75, 5, 0.15):.2f}x")   # 实际加速比依赖接受率，理论约1.9×，优化实现可达2.3×
print(f"Medusa heads:  {speculative_speedup(0.80, 4, 0.05):.2f}x")   # ~2.8x
print(f"EAGLE-2:       {speculative_speedup(0.82, 5, 0.08):.2f}x")   # ~3.1x（论文报告值，取决于实现和模型）
```

### 5.2.3 Draft 模型方案对比

| Draft 方案 | 匹配度 | 额外成本 | 实现复杂度 | 加速比 |
|-----------|:---:|:---:|:---:|:---:|
| 独立小模型 (如 1B) | 中 | 需加载额外模型 | 低 | 1.5-2.3× |
| 量化版大模型 | 高 | INT4 版本 | 中 | 2.0-2.5× |
| **Medusa** (多预测头) | 高 | <1% 额外参数 | 中 | 2.5-2.8× |
| **EAGLE-2** (特征复用) | **高** | ~5% 额外参数 | 高 | **3.0-3.5×** |
| N-gram 查表 | 低 | 几乎为 0 | 低 | 1.2-1.5× |
| Self-draft (层跳过) | 中 | 0 | 中 | 1.5-2.0× |

### 5.2.4 EAGLE-2：当前 SOTA

EAGLE-2 (2024) 的核心创新是**树结构投机 + 特征级预测**：

```python
class EAGLE2DraftModel(nn.Module):
    """EAGLE-2: 在隐层特征级做投机预测"""
    def __init__(self, hidden_size, num_heads=4):
        super().__init__()
        # 轻量级特征预测网络
        self.feature_predictor = nn.Sequential(
            nn.Linear(hidden_size * 2, hidden_size),
            nn.SiLU(),
            nn.Linear(hidden_size, hidden_size),
        )
        # LM Head 复用大模型的（不额外存储）
    
    def forward(self, hidden_state, token_embedding):
        """
        输入: 大模型上一步的 hidden_state + 当前 token embedding
        输出: 预测的下一个 hidden_state
        """
        combined = torch.cat([hidden_state, token_embedding], dim=-1)
        next_hidden = self.feature_predictor(combined)
        return next_hidden  # 用大模型的 LM Head 解码为 token
```

EAGLE-2 构建**候选 token 树**而非线性链，一次验证多个分支，MT-Bench 上实现 3.1× 无损加速（论文报告值，取决于实现和模型）。

### 5.2.5 与 Continuous Batching 的结合

投机采样的一个实际挑战是：不同请求的接受长度不同，如何与 Continuous Batching 配合？

解决方案——**Batch-aligned Speculative Decoding**：
1. 所有请求使用相同的猜测长度 K
2. Padding 对齐：接受少的请求用 padding 填充
3. 动态调整 K：根据 batch 的平均接受率动态调整

## 5.3 KV Cache 压缩

### 5.3.1 注意力头共享演进：MHA → MQA → GQA → MLA

```
Multi-Head Attention (MHA) — 原始 Transformer:
  Q: [h₁ h₂ h₃ h₄ h₅ h₆ h₇ h₈]  每个头独立的 QKV
  K: [h₁ h₂ h₃ h₄ h₅ h₆ h₇ h₈]
  V: [h₁ h₂ h₃ h₄ h₅ h₆ h₇ h₈]
  KV Cache: 2 × L × H × d × S bytes  (100%)

Multi-Query Attention (MQA) — PaLM:
  Q: [h₁ h₂ h₃ h₄ h₅ h₆ h₇ h₈]  独立 Q 头
  K: [       shared_k          ]  所有 Q 共享 1 个 K
  V: [       shared_v          ]  所有 Q 共享 1 个 V
  KV Cache: 2 × L × 1 × d × S  → H倍压缩 (e.g. 32×)
  代价: 质量明显下降

Grouped-Query Attention (GQA) — Llama 3:
  Q: [h₁ h₂ | h₃ h₄ | h₅ h₆ | h₇ h₈]  8 个 Q 头
  K: [ g₁   |  g₂   |  g₃   |  g₄   ]  4 组 KV 头
  V: [ g₁   |  g₂   |  g₃   |  g₄   ]
  KV Cache: 2 × L × (H/G) × d × S  → G倍压缩 (e.g. 4×)
  Llama 3 70B: H=64, KV heads=8 → 8× 压缩

Multi-head Latent Attention (MLA) — DeepSeek-V3:
  Q: [h₁ h₂ ... h₁₂₈]  128 个 Q 头
  KV: [    c_t ∈ ℝ^512    ]  低维潜在向量
  KV Cache: L × d_c × S  (d_c=512 << H×d=128×128=16384)
  → 32× 压缩，质量不降反升！
```

### 5.3.2 MLA 深度解析

MLA 的压缩-解压过程：

```python
class MultiHeadLatentAttention(nn.Module):
    """DeepSeek-V3 MLA 实现（简化）"""
    def __init__(self, d_model=7168, n_heads=128, d_head=128, d_c=512):
        super().__init__()
        self.d_c = d_c  # 潜在维度 (KV 压缩目标)
        
        # 压缩投影: h → c (高维 → 低维)
        self.W_DKV = nn.Linear(d_model, d_c, bias=False)
        
        # 解压投影: c → K, V (低维 → 高维)
        self.W_UK = nn.Linear(d_c, n_heads * d_head, bias=False)
        self.W_UV = nn.Linear(d_c, n_heads * d_head, bias=False)
        
        # Q 投影
        self.W_Q = nn.Linear(d_model, n_heads * d_head, bias=False)
    
    def forward(self, x, kv_cache=None):
        B, L, D = x.shape
        
        # Step 1: 压缩 KV 到潜在空间
        c_kv = self.W_DKV(x)  # [B, L, d_c=512]
        
        # 缓存的是 c_kv（512维），不是完整的 K/V（16384维）
        if kv_cache is not None:
            c_kv = torch.cat([kv_cache, c_kv], dim=1)
        
        # Step 2: 按需解压为完整 K, V
        K = self.W_UK(c_kv).reshape(B, -1, self.n_heads, self.d_head)
        V = self.W_UV(c_kv).reshape(B, -1, self.n_heads, self.d_head)
        Q = self.W_Q(x).reshape(B, L, self.n_heads, self.d_head)
        
        # Step 3: 标准注意力
        attn = F.scaled_dot_product_attention(Q, K, V)
        
        return attn, c_kv  # 返回压缩后的 cache
```

**性能优化 trick**：实际实现中，$W^{UK}$ 可以吸收到 $W^Q$ 中（因为 $Q \cdot (W^{UK} c)^T = (Q \cdot W^{UK}) \cdot c^T$），避免运行时的额外矩阵乘法。

### 5.3.3 KV Cache 量化

除了架构级压缩，还可以对 KV Cache 做数值量化：

```python
class KVCacheQuantizer:
    """KV Cache 量化：INT8 per-token 量化"""
    
    @staticmethod
    def quantize(key, value):
        """将 FP16 KV Cache 量化为 INT8"""
        # Per-token 量化 (比 per-channel 精度更好)
        k_scale = key.abs().amax(dim=-1, keepdim=True) / 127
        v_scale = value.abs().amax(dim=-1, keepdim=True) / 127
        
        key_int8 = (key / k_scale).round().clamp(-128, 127).to(torch.int8)
        value_int8 = (value / v_scale).round().clamp(-128, 127).to(torch.int8)
        
        return key_int8, value_int8, k_scale, v_scale
    
    @staticmethod
    def dequantize(key_int8, value_int8, k_scale, v_scale):
        """反量化恢复"""
        key = key_int8.float() * k_scale
        value = value_int8.float() * v_scale
        return key, value
    
    # 显存节省: 2× (BF16 → INT8)
    # 精度影响: perplexity 增加 < 0.1 (几乎无损)
```

### 5.3.4 TurboQuant：零精度损失的 3-bit KV Cache 量化 🆕

> **2026 年 4 月最新突破**（注：此方法信息待核实）：Google DeepMind 的 TurboQuant 首次实现零精度损失的 3-bit KV Cache 在线量化。

传统 KV Cache 量化的核心矛盾：Key/Value 张量中的异常值（outlier）分布不均匀，直接低比特量化会丢失信息。

**TurboQuant 三项关键技术**：

1. **Hadamard Rotation**：量化前对 KV 张量应用哈达玛变换，将异常值均匀分散到所有维度。因为是正交变换，不影响 $QK^T$ 的结果。

2. **Outlier-Aware Dynamic Clipping**：在线逐 token 计算最优裁剪范围，无需离线校准。

3. **Mixed-Precision Residual**：Sink tokens (前 4 个) 保持 FP16，最近 128 token 保持 INT8，其余 INT3。

```python
class TurboQuantKVCache:
    """TurboQuant: 零损失 3-bit KV Cache 量化"""
    
    def __init__(self, d_head, sink_tokens=4, recent_window=128):
        self.H = hadamard_matrix(d_head)  # 哈达玛矩阵
        self.sink_tokens = sink_tokens
        self.recent_window = recent_window
    
    def quantize(self, key, value):
        # Step 1: Hadamard Rotation (消除异常值)
        key_rot = key @ self.H / math.sqrt(key.shape[-1])
        val_rot = value @ self.H / math.sqrt(value.shape[-1])
        
        # Step 2: 混合精度策略
        # Sink tokens → FP16, 最近窗口 → INT8, 其余 → INT3
        seq_len = key_rot.shape[1]
        sink = key_rot[:, :self.sink_tokens]  # FP16
        recent = quantize_int8(key_rot[:, -self.recent_window:])
        middle = quantize_int3(key_rot[:, self.sink_tokens:-self.recent_window])
        
        return sink, middle, recent  # ~3.2 bits/element 平均
```

| 方法 | KV 比特 | 内存节省 | 注意力加速 | 精度损失 |
|------|:---:|:---:|:---:|:---:|
| FP16 基线 | 16 bit | 1x | 1x | 0 |
| KIVI (INT4) | 4 bit | 4x | 3.2x | ~0.3 ppl |
| **TurboQuant** | **3 bit** | **6x** | **8x** | **0** |

**部署突破**：Llama-3.1-405B + TurboQuant 3-bit → **单台 8×H100 部署 128K 上下文成为可能**（FP16 KV Cache 下 OOM）。

### 5.3.5 Unweight：无损模型压缩（非量化）🆕

> **Cloudflare 2026 年 4 月发布**（注：此方法信息待核实）：与量化不同，Unweight 通过信息论方法实现 **15-22% 模型体积压缩，输出位级完全一致**。

- 不改变模型权重数值（非量化），而是对权重文件进行无损信息压缩
- Llama-3.1-8B 测试：MLP 权重压缩 ~30%，每模型节省 ~3GB 显存
- 适合不能牺牲输出质量的生产推理场景
- GPU 内核已开源

### 5.3.6 KV Cache 驱逐策略

当上下文超长时，可以有选择地丢弃不重要的 KV 对：

| 策略 | 方法 | 效果 | 复杂度 |
|------|------|------|--------|
| **H2O** | 保留注意力分数最高的 token | 保留 20% KV 质量几乎不变 | O(n) |
| **SnapKV** | 每层独立选择重要 KV | 比 H2O 更精确 | O(n log n) |
| **StreamingLLM** | 保留初始 token + 滑动窗口 | 支持无限长度 | O(1) |
| **Scissorhands** | 基于重要性分数的预算分配 | 可控压缩比 | O(n) |

```python
class H2OKVCache:
    """Heavy Hitter Oracle: 保留注意力分数最高的 KV 对"""
    def __init__(self, budget=512, recent_window=128):
        self.budget = budget
        self.recent_window = recent_window
        self.attention_scores = []  # 累积注意力分数
    
    def evict(self, keys, values, attn_scores):
        """驱逐不重要的 KV 对"""
        seq_len = keys.shape[1]
        if seq_len <= self.budget:
            return keys, values
        
        # 保留最近 window 内的 token（不可驱逐）
        heavy_budget = self.budget - self.recent_window
        
        # 累积注意力分数排序
        _, top_indices = attn_scores[:, :-self.recent_window].topk(heavy_budget, dim=-1)
        recent_indices = torch.arange(seq_len - self.recent_window, seq_len)
        keep_indices = torch.cat([top_indices, recent_indices])
        
        return keys[:, keep_indices], values[:, keep_indices]
```

## 5.4 技术组合与协同效应

这些优化技术不是互斥的，而是可以叠加使用：

```
组合方案示例（DeepSeek-V3 推理优化全栈）:

1. 架构级: MLA (32× KV 压缩)
2. 权重量化: FP8 E4M3 (2× 权重压缩)
3. KV Cache 量化: INT8 (2× 额外 KV 压缩)  
4. 投机采样: EAGLE-2 (3× Decode 加速)
5. 系统级: PD 分离 + Continuous Batching

理论综合加速: ~12-20× (相比朴素 FP16 + 无优化)
```

## 5.5 本章小结

| 技术 | 优化目标 | 加速/压缩 | 适用阶段 | 是否无损 |
|------|---------|:---:|:---:|:---:|
| AWQ (W4A16) | 权重压缩 | 2-3× | 全阶段 | 近似无损 |
| SmoothQuant (W8A8) | 全 INT8 | 1.5-2× | 全阶段 | 近似无损 |
| FP8 (E4M3) | 硬件原生 | 1.5-2× | 全阶段 | 近似无损 |
| 投机采样 (EAGLE-2) | Decode 加速 | 2-3.5× | Decode | **严格无损** |
| GQA (Llama 3) | KV 压缩 | 4-8× | 训练+推理 | 架构设计 |
| MLA (DeepSeek) | KV 压缩 | 32× | 训练+推理 | 架构设计 |
| KV Cache INT8 | KV 压缩 | 2× | 推理 | 近似无损 |
| **TurboQuant 3-bit** 🆕 | **KV 压缩** | **6×/8×** | **推理** | **严格无损** |
| **Unweight** 🆕 | **模型体积** | **15-22%** | **推理** | **严格无损** |
| H2O/SnapKV | KV 驱逐 | 5-10× | 长上下文 | 有损但可控 |

---

*Signal 知识平台 · LLM 推理框架 · 第 5 章*
