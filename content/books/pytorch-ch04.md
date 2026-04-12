---
title: "第 4 章：优化器——从 SGD 到 AdamW 的数学与实现"
description: "深入 PyTorch 优化器：SGD/Adam/AdamW 的数学推导、源码实现、学习率调度策略、融合优化器的 CUDA 加速、8-bit 优化器与大模型训练实战"
date: "2026-04-11"
updatedAt: "2026-04-12 00:00"
book: "PyTorch 原理深度剖析"
chapter: 4
chapterTitle: "优化器——从 SGD 到 AdamW 的数学与实现"
tags: ["PyTorch", "优化器", "Adam", "AdamW", "学习率", "8-bit", "LAMB"]
type: "book"
---

# 第 4 章：优化器——从 SGD 到 AdamW 的数学与实现

## 4.1 优化器的统一接口

PyTorch 所有优化器继承自 `torch.optim.Optimizer`，理解这个基类是理解所有优化器的起点：

```python
# 所有 PyTorch 优化器的基类
class Optimizer:
    def __init__(self, params, defaults):
        self.param_groups = []  # 参数组（不同层可以不同 lr）
        self.state = {}         # 每个参数的状态（如 Adam 的 m, v）
        self.defaults = defaults
    
    def zero_grad(self, set_to_none=True):
        """清除梯度。set_to_none=True 更高效（PyTorch 1.7+）"""
        for group in self.param_groups:
            for p in group['params']:
                if set_to_none:
                    p.grad = None  # 比 .zero_() 更高效，避免 memset
                else:
                    p.grad.zero_()
    
    @torch.no_grad()  # 优化器更新不需要计算图
    def step(self, closure=None):
        raise NotImplementedError
    
    def state_dict(self):
        """序列化优化器状态（checkpoint 恢复必需）"""
        return {
            'state': self.state,
            'param_groups': [{k: v for k, v in g.items() if k != 'params'} 
                            for g in self.param_groups]
        }
```

### 4.1.1 参数组（Parameter Groups）的妙用

```python
# 不同层使用不同的学习率——LLM 微调标配
model = AutoModelForCausalLM.from_pretrained("llama-3-8b")

# 策略: Backbone 小 lr, Head 大 lr, Embedding 不更新
optimizer = torch.optim.AdamW([
    {'params': model.model.embed_tokens.parameters(), 'lr': 0},      # 冻结
    {'params': model.model.layers.parameters(), 'lr': 1e-5},          # 小 lr
    {'params': model.lm_head.parameters(), 'lr': 5e-5},              # 大 lr
], weight_decay=0.01)

# 更高级: Layer-wise Learning Rate Decay (LLRD)
def get_llrd_groups(model, base_lr=1e-4, decay=0.9):
    """深层衰减: 越靠近输入层学习率越小"""
    groups = []
    num_layers = len(model.model.layers)
    for i, layer in enumerate(model.model.layers):
        lr = base_lr * (decay ** (num_layers - i))
        groups.append({'params': layer.parameters(), 'lr': lr})
    groups.append({'params': model.lm_head.parameters(), 'lr': base_lr})
    return groups
```

## 4.2 SGD 与动量

### 4.2.1 朴素 SGD 的问题

$$\theta_{t+1} = \theta_t - \eta \nabla L(\theta_t)$$

朴素 SGD 在高曲率方向震荡、低曲率方向前进缓慢（"之字形"路径）。

### 4.2.2 Momentum 的引入

$$v_t = \mu v_{t-1} + g_t$$
$$\theta_t = \theta_{t-1} - \eta v_t$$

动量项 $v_t$ 是梯度的**指数加权移动平均**，相当于给一个球加了惯性：

```python
# SGD with Momentum 源码 (简化)
def sgd_step(params, grads, momentum_buffer, lr, momentum, weight_decay, nesterov):
    for i, (param, grad) in enumerate(zip(params, grads)):
        # Weight Decay (L2 正则化)
        if weight_decay != 0:
            grad = grad + weight_decay * param
        
        # Momentum
        if momentum != 0:
            if momentum_buffer[i] is None:
                buf = momentum_buffer[i] = grad.clone()
            else:
                buf = momentum_buffer[i]
                buf.mul_(momentum).add_(grad)  # v = μv + g
            
            if nesterov:
                # Nesterov: 先"预看"一步，再用当前梯度修正
                grad = grad + momentum * buf
            else:
                grad = buf
        
        # 参数更新
        param.add_(grad, alpha=-lr)  # θ = θ - η*v
```

### 4.2.3 Nesterov Momentum

$$v_t = \mu v_{t-1} + \nabla L(\theta_t - \eta \mu v_{t-1})$$

直觉：先按动量方向"预测"下一步位置，再在预测位置计算梯度。在凸优化中有理论加速保证。

```python
# SGD with Nesterov Momentum
optimizer = torch.optim.SGD(
    model.parameters(), lr=0.01, momentum=0.9, 
    nesterov=True,  # ResNet/ViT 训练常用
    weight_decay=1e-4
)
```

## 4.3 Adam 与 AdamW

### 4.3.1 Adam 的数学推导

Adam（Adaptive Moment Estimation）结合了 Momentum（一阶矩）和 RMSProp（二阶矩）：

$$m_t = \beta_1 m_{t-1} + (1 - \beta_1) g_t \quad \text{(一阶矩：梯度均值估计)}$$
$$v_t = \beta_2 v_{t-1} + (1 - \beta_2) g_t^2 \quad \text{(二阶矩：梯度方差估计)}$$
$$\hat{m}_t = \frac{m_t}{1 - \beta_1^t}, \quad \hat{v}_t = \frac{v_t}{1 - \beta_2^t} \quad \text{(偏差校正)}$$
$$\theta_t = \theta_{t-1} - \eta \frac{\hat{m}_t}{\sqrt{\hat{v}_t} + \epsilon}$$

**为什么需要偏差校正？** 初始时 $m_0 = v_0 = 0$，前几步 $m_t$ 和 $v_t$ 偏向零。$1/(1-\beta^t)$ 在 $t$ 小时放大估计，$t$ 大时趋近 1（校正消失）。

```python
# 默认超参数（几乎是万能的）
beta1 = 0.9     # 梯度均值的衰减率
beta2 = 0.999   # 梯度方差的衰减率  
eps = 1e-8      # 数值稳定性
lr = 1e-3       # 学习率（预训练常用 1e-4 ~ 3e-4）
```

### 4.3.2 AdamW：解耦权重衰减（Loshchilov & Hutter, 2019）

Adam 的 weight decay 实现有本质缺陷：

```python
# Adam 中的 L2 正则（错误方式）
grad = grad + weight_decay * param  # 加到梯度里
# 问题: weight_decay 被 Adam 的 1/sqrt(v) 自适应缩放了
# 大梯度参数 → v 大 → 1/sqrt(v) 小 → weight_decay 效果弱
# 与直觉矛盾：大参数应该被更强地正则化

# AdamW 中的解耦权重衰减（正确方式）
param = param - lr * weight_decay * param  # 直接衰减参数，不经过 Adam
# weight_decay 对所有参数同等作用
# 不受 Adam 自适应学习率影响
```

```python
# AdamW 完整实现 (简化版)
@torch.no_grad()
def adamw_step(params, grads, exp_avgs, exp_avg_sqs, step_t,
               lr, beta1, beta2, eps, weight_decay, amsgrad=False):
    
    step = step_t.item()
    
    for param, grad, m, v in zip(params, grads, exp_avgs, exp_avg_sqs):
        # 1. 权重衰减（解耦，直接作用于参数）
        param.mul_(1 - lr * weight_decay)
        
        # 2. 更新一阶矩 m（梯度均值）
        m.mul_(beta1).add_(grad, alpha=1 - beta1)
        
        # 3. 更新二阶矩 v（梯度方差）
        v.mul_(beta2).addcmul_(grad, grad, value=1 - beta2)
        
        # 4. 偏差校正
        bias_correction1 = 1 - beta1 ** step
        bias_correction2 = 1 - beta2 ** step
        step_size = lr / bias_correction1
        
        # 5. AMSGrad 变体（可选，保证 v 单调递增）
        if amsgrad:
            v_max = torch.max(v_hat_prev, v / bias_correction2)
            denom = v_max.sqrt().add_(eps)
        else:
            denom = (v.sqrt() / (bias_correction2 ** 0.5)).add_(eps)
        
        # 6. 参数更新
        param.addcdiv_(m, denom, value=-step_size)
```

### 4.3.3 融合优化器（Fused Optimizer）

标准优化器的每个数学操作对应一次 CUDA kernel launch，存在大量冗余 HBM 读写：

```python
# 标准 AdamW：每个参数多次 kernel launch
# param.mul_(), m.mul_(), m.add_(), v.mul_(), v.addcmul_(), param.addcdiv_()
# = 6 次 HBM 读写（param, m, v 各读写 2 次）

# 融合 AdamW：1 个 CUDA kernel 完成所有操作
optimizer = torch.optim.AdamW(params, lr=1e-3, fused=True)
# 1 次 HBM 读写 → 约 2-3x 加速

# 融合 kernel 伪代码 (CUDA)
__global__ void fused_adamw_kernel(
    float* param, float* grad, float* m, float* v,
    float lr, float beta1, float beta2, float eps, float wd, int step
) {
    int i = blockIdx.x * blockDim.x + threadIdx.x;
    // 1 次读取 param, grad, m, v
    float p = param[i], g = grad[i], m_val = m[i], v_val = v[i];
    
    p *= (1 - lr * wd);                        // 权重衰减
    m_val = beta1 * m_val + (1 - beta1) * g;   // 更新 m
    v_val = beta2 * v_val + (1 - beta2) * g*g;  // 更新 v
    
    float bc1 = 1 - powf(beta1, step);
    float bc2 = 1 - powf(beta2, step);
    p -= lr / bc1 * m_val / (sqrtf(v_val / bc2) + eps);
    
    // 1 次写回 param, m, v
    param[i] = p; m[i] = m_val; v[i] = v_val;
}
```

## 4.4 大模型训练的优化器创新

### 4.4.1 8-bit Adam（bitsandbytes）

LLM 预训练中，优化器状态占用的显存是模型参数的 2 倍（AdamW: 12 bytes/param vs 模型 4 bytes/param）。8-bit Adam 将优化器状态压缩到 1/4：

```python
import bitsandbytes as bnb

# 标准 AdamW: 每参数 12 bytes (m: FP32 + v: FP32 + param backup: FP32)
# 7B 模型: 7B × 12 = 84 GB 优化器状态

# 8-bit AdamW: 每参数 4 bytes (m: INT8 + v: INT8 + 动态量化因子)
optimizer = bnb.optim.AdamW8bit(
    model.parameters(), lr=1e-4, 
    betas=(0.9, 0.999),
    # 内部: m, v 存储为 INT8，每 256 个元素一个缩放因子
    # 更新时: INT8 → FP32 → 计算 → FP32 → INT8
)
# 7B 模型: 7B × 4 = 28 GB 优化器状态（节省 56 GB）
# 精度损失: < 0.1% (几乎可忽略)

# 动态量化的关键：Block-wise Quantization
# 不是对整个张量用一个 scale，而是每 256 个元素独立量化
# 这样大值和小值不会互相影响
```

### 4.4.2 LAMB / LARS：大 Batch 训练优化器

当 batch size 从 256 增大到 8192+（分布式训练常见），Adam 的收敛性会变差。LAMB（Layer-wise Adaptive Moments optimizer for Batch training）通过层级自适应学习率解决：

```python
# LAMB 的核心: 用 (参数范数 / 更新范数) 作为层级缩放因子
def lamb_step(param, grad, m, v, lr, beta1, beta2, eps, weight_decay):
    # Adam 更新量
    m.mul_(beta1).add_(grad, alpha=1 - beta1)
    v.mul_(beta2).addcmul_(grad, grad, value=1 - beta2)
    adam_update = m / (v.sqrt() + eps) + weight_decay * param
    
    # LAMB 关键: Trust Ratio
    param_norm = param.norm(2)
    update_norm = adam_update.norm(2)
    
    if param_norm > 0 and update_norm > 0:
        trust_ratio = param_norm / update_norm
    else:
        trust_ratio = 1.0
    
    # 缩放后的更新
    param.add_(adam_update, alpha=-lr * trust_ratio)
    
# BERT 预训练: LAMB + lr=0.00176 + batch_size=65536
# 训练时间从 3 天缩短到 76 分钟（TPU v3-1024）
```

### 4.4.3 Adafactor：显存友好的优化器

Adafactor 通过矩阵分解将 $v$（二阶矩）的存储从 $O(mn)$ 降到 $O(m+n)$：

```python
# AdamW 存储 v: [hidden_dim, hidden_dim] → 16M elements for 4K×4K
# Adafactor: v ≈ row_factor × col_factor
#   row_factor: [hidden_dim, 1] → 4K elements
#   col_factor: [1, hidden_dim] → 4K elements
#   存储: 8K vs 16M (压缩 2000x)

# T5/PaLM 预训练使用 Adafactor
from transformers import Adafactor

optimizer = Adafactor(
    model.parameters(), 
    lr=1e-3,
    relative_step=True,   # 自动学习率
    warmup_init=True,
    scale_parameter=True
)
```

## 4.5 学习率调度策略详解

学习率调度与优化器同样重要，错误的 schedule 直接导致训练失败：

```python
# === 1. Cosine Annealing (LLM 训练标配) ===
scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(
    optimizer, T_max=total_steps, eta_min=lr * 0.1
)
# lr_t = eta_min + 0.5 * (lr - eta_min) * (1 + cos(π * t / T_max))

# === 2. Warmup + Cosine (最常见的组合) ===
def warmup_cosine(step, warmup_steps, total_steps, max_lr, min_lr):
    if step < warmup_steps:
        return max_lr * step / warmup_steps  # 线性 warmup
    else:
        progress = (step - warmup_steps) / (total_steps - warmup_steps)
        return min_lr + 0.5 * (max_lr - min_lr) * (1 + math.cos(math.pi * progress))

# === 3. WSD (Warmup-Stable-Decay, DeepSeek 创新) ===
def wsd_schedule(step, warmup_steps, stable_steps, decay_steps, max_lr, min_lr):
    """DeepSeek V3/R1 使用的三阶段调度"""
    if step < warmup_steps:
        return max_lr * step / warmup_steps                    # Phase 1: Warmup
    elif step < warmup_steps + stable_steps:
        return max_lr                                           # Phase 2: Stable
    else:
        decay_progress = (step - warmup_steps - stable_steps) / decay_steps
        return min_lr + (max_lr - min_lr) * (1 - decay_progress)  # Phase 3: Linear Decay
    
# WSD 的优势: 
# - Stable 阶段可以在任意时刻停止训练，loss 仍然是好的
# - 方便增量训练（继续训练只需要再加一段 Stable）
# - DeepSeek V3 实际使用: Warmup 2K steps → Stable ~95% → Decay 最后 5%

# === 4. Inverse Square Root (经典 Transformer 论文) ===
# lr = d^{-0.5} * min(step^{-0.5}, step * warmup^{-1.5})
scheduler = torch.optim.lr_scheduler.LambdaLR(
    optimizer,
    lambda step: min((step+1)**-0.5, (step+1) * warmup_steps**-1.5)
)

# === 5. OneCycleLR (超收敛) ===
scheduler = torch.optim.lr_scheduler.OneCycleLR(
    optimizer, max_lr=1e-3, total_steps=total_steps,
    pct_start=0.3,  # 30% 用于上升
    anneal_strategy='cos'
)
```

### 调度策略对比

```
  lr
  ↑
  │  ╱‾‾‾‾‾‾‾╲         Warmup + Cosine
  │ ╱           ╲
  │╱             ╲___
  ├───────────────────→ step
  
  lr
  ↑
  │  ╱‾‾‾‾‾‾‾‾‾‾‾╲     WSD (DeepSeek)
  │ ╱              │╲
  │╱               │ ╲__
  ├───────────────────→ step
     Warmup  Stable  Decay
  
  lr
  ↑
  │  ╱╲                  OneCycleLR
  │ ╱  ╲
  │╱    ╲___
  ├───────────────────→ step
```

## 4.6 实战：LLM 预训练的优化器配置

```python
# Llama 3 风格的预训练优化器配置
def setup_optimizer(model, args):
    # 1. 权重衰减分组（Embedding 和 LayerNorm 不加 weight_decay）
    decay_params = []
    no_decay_params = []
    
    for name, param in model.named_parameters():
        if 'layernorm' in name or 'bias' in name or 'embed' in name:
            no_decay_params.append(param)
        else:
            decay_params.append(param)
    
    param_groups = [
        {'params': decay_params, 'weight_decay': 0.1},
        {'params': no_decay_params, 'weight_decay': 0.0}
    ]
    
    # 2. 创建融合 AdamW
    optimizer = torch.optim.AdamW(
        param_groups,
        lr=3e-4,           # Llama 3 用 3e-4
        betas=(0.9, 0.95), # Llama 3 用 β2=0.95（比默认 0.999 低）
        eps=1e-8,
        fused=True          # 融合 kernel
    )
    
    # 3. 学习率调度
    scheduler = get_cosine_schedule_with_warmup(
        optimizer, 
        num_warmup_steps=2000,
        num_training_steps=args.total_steps,
        min_lr_ratio=0.1    # 最低学习率 = max_lr * 0.1
    )
    
    return optimizer, scheduler

# 梯度裁剪（防止梯度爆炸）
torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
```

## 4.7 优化器显存占用对比

| 优化器 | 显存/参数 | 7B 模型总占用 | 适用场景 |
|--------|:---------:|:------------:|---------|
| SGD+Momentum | 4 bytes | 28 GB | CV 微调 |
| Adam | 12 bytes | 84 GB | 通用选择 |
| **AdamW** | **12 bytes** | **84 GB** | **LLM 预训练标配** |
| AdamW (fused) | 12 bytes | 84 GB | +30% 速度 |
| 8-bit Adam | 4 bytes | 28 GB | 显存受限训练 |
| Adafactor | ~6 bytes | ~42 GB | T5 风格预训练 |
| LION | 4 bytes | 28 GB | Google 新优化器 |
| LAMB | 12 bytes | 84 GB | 超大 batch 训练 |

## 4.8 调试优化器的实用技巧

```python
# 1. 检查梯度分布
for name, param in model.named_parameters():
    if param.grad is not None:
        grad_norm = param.grad.norm(2).item()
        param_norm = param.norm(2).item()
        ratio = grad_norm / (param_norm + 1e-8)
        if ratio > 10:
            print(f"⚠️ {name}: grad/param ratio = {ratio:.2f} (可能不稳定)")

# 2. 学习率 Finder (快速确定最佳 lr 范围)
def lr_finder(model, train_loader, optimizer, start_lr=1e-7, end_lr=10, num_iter=100):
    lrs, losses = [], []
    lr_mult = (end_lr / start_lr) ** (1 / num_iter)
    lr = start_lr
    
    for i, batch in enumerate(train_loader):
        if i >= num_iter: break
        for g in optimizer.param_groups: g['lr'] = lr
        loss = train_step(model, batch)
        lrs.append(lr); losses.append(loss)
        lr *= lr_mult
    
    # 选择 loss 下降最快的 lr（最陡坡度点的 1/10）
    return lrs, losses

# 3. 梯度累积（等效增大 batch size）
accumulation_steps = 4
for i, batch in enumerate(train_loader):
    loss = model(batch) / accumulation_steps  # 除以累积步数
    loss.backward()
    
    if (i + 1) % accumulation_steps == 0:
        torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
        optimizer.step()
        optimizer.zero_grad()
```

## 4.9 本章小结

```
选择优化器的决策树:

是否预训练大模型？
├── 是 → AdamW (fused) + Warmup-Cosine/WSD
│   └── 显存不够？ → 8-bit AdamW 或 Adafactor
│   └── Batch 很大？ → 考虑 LAMB
└── 否 → 微调？
    ├── 全量微调 → AdamW, lr=1e-5 ~ 5e-5
    ├── LoRA → AdamW, lr=1e-4 ~ 3e-4
    └── CV 任务 → SGD+Momentum+Nesterov, lr=0.01
```

**关键要点：**
1. AdamW 是 LLM 训练的无脑选择，β2=0.95 通常比默认 0.999 更好
2. fused=True 零成本提速 30%，没有理由不开
3. 学习率 schedule 比优化器选择更重要——永远用 Warmup
4. weight_decay 只加在非 bias/LayerNorm 参数上
5. 梯度裁剪 max_norm=1.0 是 LLM 训练的安全网

---

*Signal 知识平台 · PyTorch 原理深度剖析 · 第 4 章*
