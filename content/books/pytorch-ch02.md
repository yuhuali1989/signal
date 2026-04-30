---
title: "第 2 章：前向传播——从 Python 到 CUDA Kernel 的完整旅程"
description: "追踪一次 model(input) 调用的完整执行路径：Python 层 → Dispatcher → ATen → cuDNN/cuBLAS → CUDA Kernel，含 nn.Module 源码剖析"
date: "2026-04-11"
updatedAt: "2026-04-11"
book: "PyTorch 原理深度剖析"
chapter: 2
chapterTitle: "前向传播——从 Python 到 CUDA Kernel 的完整旅程"
tags: ["PyTorch", "前向传播", "nn.Module", "Dispatcher", "cuDNN"]
type: "book"
---

# 第 2 章：前向传播——从 Python 到 CUDA Kernel 的完整旅程

> 当你写下 `output = model(input)` 时，到底发生了什么？

## 2.1 nn.Module 的调用链

```python
# 你写的代码
output = model(input)

# 实际执行的调用链：
# 1. model.__call__(input)           ← Python
# 2.   → _wrapped_call_impl(input)   ← nn.Module
# 3.     → self.forward(input)       ← 你定义的 forward
# 4.       → F.linear(x, w, b)      ← functional 接口
# 5.         → torch.addmm(b, x, w.t())  ← ATen 操作
# 6.           → Dispatcher 分发     ← C++ 层
# 7.             → AutogradCUDA      ← 记录 grad_fn
# 8.               → CUDA kernel     ← cuBLAS GEMM
```

### 2.1.1 nn.Module.__call__ 源码

```python
# 简化版 nn.Module.__call__ (torch/nn/modules/module.py)
class Module:
    def __call__(self, *args, **kwargs):
        # 1. 执行 forward hooks（如果有）
        for hook in self._forward_pre_hooks.values():
            result = hook(self, args)
            if result is not None:
                args = result
        
        # 2. 执行 forward
        result = self.forward(*args, **kwargs)
        
        # 3. 执行 forward hooks（后置）
        for hook in self._forward_hooks.values():
            hook_result = hook(self, args, result)
            if hook_result is not None:
                result = hook_result
        
        # 4. 注册 backward hooks（如果有）
        if self._backward_hooks:
            result.register_hook(...)
        
        return result
```

**关键洞察**：`__call__` 不等于 `forward`。`__call__` 多了 hooks 机制，这是 PyTorch 很多高级特性的基础（如 gradient checkpointing、混合精度）。

### 2.1.2 Hook 的实际用途

```python
# 1. Forward Hook：查看中间层输出
activations = {}
def save_activation(name):
    def hook(module, input, output):
        activations[name] = output.detach()
    return hook

model.layer1.register_forward_hook(save_activation('layer1'))

# 2. Backward Hook：查看/修改梯度
def gradient_clipping_hook(module, grad_input, grad_output):
    return tuple(g.clamp(-1, 1) if g is not None else g for g in grad_input)

model.layer1.register_full_backward_hook(gradient_clipping_hook)

# 3. Forward Pre-Hook：修改输入
def add_noise(module, input):
    return (input[0] + torch.randn_like(input[0]) * 0.01,)

model.layer1.register_forward_pre_hook(add_noise)
```

## 2.2 F.linear 的完整路径

```python
# F.linear 的实现
def linear(input, weight, bias=None):
    # 实际调用 torch._C._nn.linear(input, weight, bias)
    # 这是一个 C++ 绑定
    return torch._C._nn.linear(input, weight, bias)
```

在 C++ 层：

```cpp
// aten/src/ATen/native/Linear.cpp (简化)
Tensor linear(const Tensor& input, const Tensor& weight, 
              const c10::optional<Tensor>& bias) {
    if (input.dim() == 2 && bias.has_value()) {
        // 最常见的路径：2D input + bias
        // addmm: result = beta * bias + alpha * input @ weight.t()
        return at::addmm(bias.value(), input, weight.t());
    }
    // 高维输入：用 matmul + add
    auto output = at::matmul(input, weight.t());
    if (bias.has_value()) {
        output.add_(bias.value());
    }
    return output;
}
```

### 2.2.2 矩阵乘法的分发

```
at::matmul(A, B)
    │
    ▼
Dispatcher::call(aten::mm, A, B)
    │
    ├── DispatchKey::AutogradCUDA
    │   └── 包装 MmBackward0 节点
    │       └── 转发到下一层
    │
    ├── DispatchKey::CUDA
    │   └── at::native::mm_cuda(A, B)
    │       │
    │       ├── A, B 都是 float32 → cublasSgemm
    │       ├── A, B 都是 float16 → cublasHgemm
    │       ├── A, B 都是 bfloat16 → cublasBf16gemm
    │       └── 混合精度 → cublasMixedGemm
    │
    └── DispatchKey::CPU
        └── at::native::mm_cpu(A, B)
            └── MKL / OpenBLAS sgemm
```

## 2.3 CUDA Kernel 执行细节

### 2.3.1 cuBLAS GEMM

矩阵乘法 $C = \alpha AB + \beta C$ 是深度学习最核心的计算：

```
GEMM 在 GPU 上的执行：

1. 数据从 HBM (显存) 加载到 L2 Cache
2. 从 L2 加载到 Shared Memory (每个 SM)
3. 从 Shared Memory 加载到 Register File
4. Tensor Core 执行 4x4x4 矩阵乘 (1 cycle)
5. 结果写回 Shared Memory → L2 → HBM

H100 Tensor Core (BF16):
  官方规格: 989 TFLOPS（FP16，含稀疏加速）/ 494 TFLOPS（FP16，不含稀疏）

性能关键: Tile Size 选择
  太小 → Tensor Core 利用率低
  太大 → Shared Memory 不够
  cuBLAS 自动搜索最优 Tile Size (Heuristic + Autotune)
```

### 2.3.2 cuDNN 卷积

```python
# 卷积的多种算法
# cuDNN 会 benchmark 选择最快的
torch.backends.cudnn.benchmark = True  # 开启自动搜索

# 可选算法：
# 1. IMPLICIT_GEMM      — 将卷积转为矩阵乘（im2col）
# 2. IMPLICIT_PRECOMP_GEMM — 预计算索引的 GEMM
# 3. GEMM               — 显式 im2col + GEMM
# 4. WINOGRAD            — Winograd 变换（3x3 卷积最快）
# 5. FFT                 — 傅里叶变换（大 kernel 高效）

# 第一次调用会 benchmark 所有算法，后续调用用缓存的最优算法
# 注意：输入 shape 变化会重新 benchmark
```

## 2.4 混合精度前向传播 (AMP)

```python
# torch.autocast 的工作原理
with torch.autocast(device_type='cuda', dtype=torch.float16):
    output = model(input)
    # 内部机制：
    # 1. matmul/conv → 自动用 FP16 (快 2x)
    # 2. softmax/layernorm/loss → 保持 FP32 (数值稳定)
    # 3. 选择基于 Dispatcher 的 AutocastCUDA key
```

```
AMP 操作分类：

✅ FP16 安全 (性能敏感):          ❌ 必须 FP32 (数值敏感):
  ├── Linear (GEMM)                ├── Softmax
  ├── Conv2d                       ├── LayerNorm / BatchNorm
  ├── BMM (Batch MatMul)           ├── Cross Entropy Loss
  └── GRU / LSTM                   ├── L2 Normalize
                                   └── Exp / Log / Pow
```

### 2.4.1 Loss Scaling

FP16 的最小正数是 $6 \times 10^{-8}$。小梯度会下溢为 0。

```python
scaler = torch.GradScaler()

for batch in dataloader:
    with torch.autocast(device_type='cuda'):
        output = model(batch)
        loss = criterion(output)
    
    # 1. Loss 乘以一个大数（如 65536）
    scaled_loss = scaler.scale(loss)
    # loss × 65536，梯度也会 ×65536，避免下溢
    
    # 2. 反向传播（梯度都是放大的）
    scaled_loss.backward()
    
    # 3. Unscale 梯度（÷65536），检查是否有 inf/nan
    scaler.unscale_(optimizer)
    
    # 4. 如果梯度正常，执行优化步骤
    # 如果有 inf/nan，跳过这步并减小 scale factor
    scaler.step(optimizer)
    
    # 5. 动态调整 scale factor
    scaler.update()
    # 连续 2000 步没有 inf → scale ×2
    # 出现 inf → scale ÷2
```

## 2.5 torch.compile 对前向传播的改造

PyTorch 2.0 引入 `torch.compile`，从"即时执行"变为"编译执行"：

```python
model = torch.compile(model)  # 一行代码

# 内部流程：
# 1. TorchDynamo: 捕获 Python 字节码，提取计算图
# 2. AOTAutograd: 提前生成反向传播图
# 3. TorchInductor: 将计算图编译为优化的 Triton/CUDA kernel

# 例子：手动分步
@torch.compile(backend="inductor")
def forward_step(model, x):
    x = model.linear1(x)
    x = F.gelu(x)  # GELU 和 linear 可能被融合
    x = model.linear2(x)
    return x
```

### 2.5.1 算子融合

```
未融合 (eager mode):              融合后 (compiled):
  Linear → 写回 HBM                Linear + GELU + Dropout
  GELU   → 读 HBM, 写回 HBM       = 一个 Triton kernel
  Dropout → 读 HBM, 写回 HBM       只读写 HBM 一次
  
  3 次读 HBM + 3 次写 HBM          1 次读 + 1 次写
  = 6 次 HBM 访问                  = 2 次 HBM 访问 (3x 提速)
```

```python
# 生成的 Triton kernel (简化)
@triton.jit
def fused_linear_gelu_dropout(
    x_ptr, w_ptr, b_ptr, out_ptr,
    M, N, K, p_drop, seed,
    BLOCK_M: tl.constexpr = 64,
    BLOCK_N: tl.constexpr = 64,
):
    # 1. 加载 x 和 w 的 tile
    # 2. 矩阵乘 (在 Tensor Core 上)
    acc = tl.dot(x_tile, w_tile)
    # 3. 加 bias
    acc += b_tile
    # 4. GELU (融合，不写回 HBM)
    acc = acc * 0.5 * (1 + tl.math.erf(acc * 0.7071067811865476))
    # 5. Dropout (融合)
    mask = tl.rand(seed, offsets) > p_drop
    acc = tl.where(mask, acc / (1 - p_drop), 0.0)
    # 6. 写回 HBM（只写一次）
    tl.store(out_ptr + offsets, acc)
```

## 2.6 完整前向传播时序图

```
model(input) 的完整时序 (1 个 Transformer Block):

时间轴 →

Python:  __call__ → forward() → ... → return
           │
C++:       │─ Dispatcher ──── ATen ops ────────────│
           │                                        │
CUDA:      │   ┌─LayerNorm─┐ ┌──Attention GEMM──┐ │
           │   │ 自定义     │ │ cuBLAS           │ │
           │   │ kernel     │ │ cublasSgemm      │ │
           │   └────────────┘ └──────────────────┘ │
           │   ┌─Softmax───┐ ┌──MLP GEMM────────┐ │
           │   │ 自定义     │ │ cuBLAS           │ │
           │   │ kernel     │ │                  │ │
           │   └────────────┘ └──────────────────┘ │
           │                                        │
GPU HBM:   ▓▓▓▓░░░▓▓▓▓▓▓▓▓░░░▓▓░░░▓▓▓▓▓▓▓▓░░░▓▓▓
           读入   写出   读入         读入         写出
           
▓ = HBM 访问 (带宽瓶颈)
░ = 计算 (Tensor Core)

关键洞察: 大部分时间花在 HBM 读写上，不是计算！
这就是为什么 FlashAttention 和算子融合如此重要。
```

## 2.7 本章小结

| 阶段 | 发生什么 | 瓶颈 |
|------|---------|------|
| Python 层 | `__call__` → hooks → `forward` | Python 解释器开销 |
| Dispatcher | DispatchKey 分发到正确 kernel | 分发本身很快 (~ns) |
| ATen 层 | 选择最优实现 (cuBLAS/cuDNN) | 算法选择 |
| CUDA Kernel | Tensor Core 计算 | **HBM 带宽** |
| 内存 | Caching Allocator 管理显存 | 碎片化 |

**最大的性能瓶颈不是计算，而是内存带宽。** 这解释了为什么 FlashAttention（减少 HBM 访问）、算子融合（减少中间结果写回）、torch.compile（自动融合）是最有效的优化手段。

---

*Signal 知识平台 · PyTorch 原理深度剖析 · 第 2 章*
