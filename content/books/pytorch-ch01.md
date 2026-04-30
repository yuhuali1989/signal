---
title: "第 1 章：Tensor 与计算图——PyTorch 的基石"
description: "深入 PyTorch Tensor 的内存布局、Storage/View 机制、动态计算图构建原理，从 C++ ATen 层到 Python 前端的完整链路"
date: "2026-04-11"
updatedAt: "2026-04-11"
book: "PyTorch 原理深度剖析"
chapter: 1
chapterTitle: "Tensor 与计算图——PyTorch 的基石"
tags: ["PyTorch", "Tensor", "计算图", "ATen", "Autograd"]
type: "book"
---

# 第 1 章：Tensor 与计算图——PyTorch 的基石

> 你每天写的 `torch.tensor([1, 2, 3])` 背后，是一套精密的 C++ 引擎。

## 1.1 Tensor 的内存模型

PyTorch 的 Tensor 不是一块简单的内存，而是由三层组成的精巧结构：

```
┌─────────────────────────────────────────────┐
│              Python Tensor 对象               │
│  (torch.Tensor, Python 层)                   │
│  ├── .data → Storage                         │
│  ├── .grad → Tensor (梯度)                   │
│  ├── .grad_fn → 计算图节点                    │
│  ├── .shape, .stride, .offset               │
│  └── .device, .dtype, .requires_grad        │
├─────────────────────────────────────────────┤
│              C++ TensorImpl                   │
│  (at::TensorImpl, ATen 层)                   │
│  ├── StorageImpl* storage_                   │
│  ├── int64_t storage_offset_                 │
│  ├── SmallVector<int64_t> sizes_             │
│  ├── SmallVector<int64_t> strides_           │
│  └── DispatchKeySet key_set_                 │
├─────────────────────────────────────────────┤
│              Storage                          │
│  (c10::StorageImpl)                          │
│  ├── DataPtr data_ptr_  → 实际内存指针        │
│  ├── int64_t numel_                          │
│  └── Allocator* allocator_ (CPU/CUDA)        │
└─────────────────────────────────────────────┘
```

**关键理解**：Tensor 只是 Storage 的一个"视图"（View）。多个 Tensor 可以共享同一个 Storage。

### 1.1.1 Storage 与 View 的关系

```python
import torch

a = torch.arange(12).reshape(3, 4)
b = a[1:3, :2]  # b 是 a 的 View

# 它们共享同一块内存！
print(a.data_ptr() == b.storage().data_ptr())  # True

# b 的布局信息：
print(b.storage_offset())  # 4 (从第5个元素开始)
print(b.size())            # torch.Size([2, 2])
print(b.stride())          # (4, 1) — 行步长4, 列步长1

# 修改 b 会影响 a（因为共享 Storage）
b[0, 0] = 999
print(a[1, 0])  # tensor(999)
```

**Stride 的数学含义**：访问 `tensor[i, j, k]` 的内存地址为：

$$\text{addr} = \text{base\_ptr} + \text{offset} + i \times \text{stride}[0] + j \times \text{stride}[1] + k \times \text{stride}[2]$$

### 1.1.2 连续性（Contiguity）

```python
a = torch.arange(12).reshape(3, 4)
print(a.is_contiguous())  # True, stride = (4, 1)

b = a.t()  # 转置
print(b.is_contiguous())  # False, stride = (1, 4)
# 内存没变，只是 stride 变了！

c = b.contiguous()  # 重新分配内存，变成连续
print(c.is_contiguous())  # True, stride = (3, 1)
# c 现在有自己的 Storage
```

**为什么 contiguity 重要？** CUDA kernel 对内存连续的 Tensor 访问效率高 10-100 倍（合并访问 vs 随机访问）。

## 1.2 动态计算图的构建

PyTorch 的核心特色是**动态计算图**（Define-by-Run）：计算图在前向传播时"边跑边建"。

### 1.2.1 计算图节点：grad_fn

```python
x = torch.tensor([2.0], requires_grad=True)
y = torch.tensor([3.0], requires_grad=True)

# 前向传播时，每一步都创建计算图节点
z = x * y         # z.grad_fn = <MulBackward0>
w = z + x         # w.grad_fn = <AddBackward0>
loss = w.pow(2)   # loss.grad_fn = <PowBackward0>

# 计算图结构：
# loss (PowBackward0)
#   └── w (AddBackward0)
#         ├── z (MulBackward0)
#         │     ├── x (叶子节点, AccumulateGrad)
#         │     └── y (叶子节点, AccumulateGrad)
#         └── x (叶子节点, AccumulateGrad)
```

### 1.2.2 计算图的 C++ 实现

```cpp
// 简化版 PyTorch 计算图节点 (torch/csrc/autograd/function.h)
struct Node {
    // 反向传播函数：接收上游梯度，返回下游梯度
    virtual variable_list apply(variable_list&& grads) = 0;
    
    // 边（输入）：连接到上游节点
    edge_list next_edges_;  // vector<Edge>
    
    // Edge = {shared_ptr<Node> function, uint32_t input_nr}
    // 表示"反向传播时，把梯度传给哪个节点的第几个输入"
};

// MulBackward0 的实现
struct MulBackward0 : public Node {
    at::Tensor self_;  // 保存前向传播时的输入，反向时需要
    at::Tensor other_;
    
    variable_list apply(variable_list&& grads) override {
        auto& grad_output = grads[0];
        // d(a*b)/da = b, d(a*b)/db = a
        auto grad_self = grad_output * other_;
        auto grad_other = grad_output * self_;
        return {grad_self, grad_other};
    }
};
```

**每个 `grad_fn` 节点保存了前向传播时的"中间数据"**（被称为 saved tensors），反向传播时用来计算梯度。

### 1.2.3 requires_grad 的传播规则

```python
a = torch.tensor([1.0], requires_grad=True)
b = torch.tensor([2.0])  # requires_grad=False

c = a + b  # c.requires_grad = True (只要有一个输入 requires_grad=True)
d = b * b  # d.requires_grad = False (所有输入都是 False)

# 控制梯度追踪
with torch.no_grad():
    e = a * 2  # e.requires_grad = False（即使 a 需要梯度）
    # 推理时常用，避免建图开销

# 更底层的控制
f = a.detach() * 2  # f.requires_grad = False, 切断计算图
```

## 1.3 DispatchKey：PyTorch 的万能分发机制

PyTorch 如何决定一个操作用哪个 kernel？答案是 **Dispatch Key 分发系统**：

```
torch.add(tensor_a, tensor_b)
         │
         ▼
  ┌──────────────────────────────┐
  │     Dispatcher (分发器)        │
  │                              │
  │  检查 DispatchKeySet:         │
  │  1. Autograd   → 包装梯度    │
  │  2. AutocastCPU → 自动混合精度 │
  │  3. CUDA        → CUDA kernel │
  │  4. CPU         → CPU kernel  │
  │  5. FuncTorch   → vmap 变换   │
  │  ...                          │
  │                              │
  │  按优先级选择第一个匹配的 key  │
  └──────────────────────────────┘
         │
         ▼
  实际执行 at::add CUDA kernel
```

```python
# 你可以查看一个 Tensor 的 dispatch keys
x = torch.randn(3, 3, device='cuda', requires_grad=True)
# 内部的 DispatchKeySet 包含:
# {AutogradCUDA, CUDA, ADInplaceOrView, ...}
# 调用 x + y 时：
# 1. AutogradCUDA 层：记录 grad_fn (AddBackward0)
# 2. CUDA 层：执行实际的加法 CUDA kernel
```

## 1.4 自定义 Tensor 操作

### 1.4.1 torch.autograd.Function

```python
class MyReLU(torch.autograd.Function):
    """自定义 ReLU，理解前向/反向的关系"""
    
    @staticmethod
    def forward(ctx, input):
        """
        ctx: 上下文对象，用于保存反向传播需要的数据
        """
        # 保存输入，反向时要用来判断哪些位置 > 0
        ctx.save_for_backward(input)
        return input.clamp(min=0)
    
    @staticmethod
    def backward(ctx, grad_output):
        """
        grad_output: 上游传来的梯度 (dL/d_output)
        返回: 对每个 forward 输入的梯度 (dL/d_input)
        """
        input, = ctx.saved_tensors
        grad_input = grad_output.clone()
        grad_input[input < 0] = 0  # ReLU 导数：x>0 时为 1，否则为 0
        return grad_input

# 使用
x = torch.randn(5, requires_grad=True)
y = MyReLU.apply(x)
y.sum().backward()
print(x.grad)  # x > 0 的位置梯度为 1，否则为 0
```

### 1.4.2 扩展到 C++ (CUDA kernel)

```cpp
// 用 C++ 扩展写高性能自定义算子
// my_relu_kernel.cu

__global__ void relu_forward_kernel(float* output, const float* input, int n) {
    int idx = blockIdx.x * blockDim.x + threadIdx.x;
    if (idx < n) {
        output[idx] = input[idx] > 0 ? input[idx] : 0;
    }
}

__global__ void relu_backward_kernel(float* grad_input, 
                                      const float* grad_output,
                                      const float* input, int n) {
    int idx = blockIdx.x * blockDim.x + threadIdx.x;
    if (idx < n) {
        grad_input[idx] = input[idx] > 0 ? grad_output[idx] : 0;
    }
}

// 注册为 PyTorch 算子
torch::Tensor relu_forward(torch::Tensor input) {
    auto output = torch::empty_like(input);
    int n = input.numel();
    relu_forward_kernel<<<(n+255)/256, 256>>>(
        output.data_ptr<float>(), input.data_ptr<float>(), n);
    return output;
}
```

## 1.5 内存管理：CUDA Caching Allocator

PyTorch 不直接用 `cudaMalloc`/`cudaFree`（太慢，每次 ~1ms），而是维护一个**内存池**：

```
┌─────────────── CUDA Caching Allocator ───────────────┐
│                                                       │
│  cudaMalloc 申请大块内存 (Block Pool)                  │
│  ┌─────────────────────────────────────────────┐      │
│  │  Block 1 (256 MB)                           │      │
│  │  ├── Segment A (used, 64MB) ← tensor_1      │      │
│  │  ├── Segment B (free, 128MB)                │      │
│  │  └── Segment C (used, 64MB) ← tensor_2      │      │
│  ├─────────────────────────────────────────────┤      │
│  │  Block 2 (512 MB)                           │      │
│  │  ├── Segment D (free, 512MB)                │      │
│  │  └── ...                                    │      │
│  └─────────────────────────────────────────────┘      │
│                                                       │
│  分配: 从 free segment 中切割，O(1)                    │
│  释放: 标记为 free，不调用 cudaFree                    │
│  碎片: 相邻 free segments 会被合并                     │
└───────────────────────────────────────────────────────┘
```

```python
# 查看 GPU 内存状态
print(torch.cuda.memory_summary())

# 手动释放缓存（不释放正在使用的 Tensor）
torch.cuda.empty_cache()

# 内存碎片问题的典型场景：
# 训练时 activation 大小变化导致碎片 → OOM
# 解决：使用 torch.cuda.memory.CUDACachingAllocator
# 的 expandable_segments 特性（PyTorch 2.0+）
import os
os.environ['PYTORCH_CUDA_ALLOC_CONF'] = 'expandable_segments:True'
```

## 1.6 本章小结

| 概念 | 核心理解 |
|------|---------|
| **Tensor** | Storage + View（offset, sizes, strides） |
| **计算图** | 前向时自动构建，每个操作创建 grad_fn 节点 |
| **Dispatch** | DispatchKey 优先级决定走哪个 kernel |
| **CUDA Allocator** | 内存池化，避免频繁 cudaMalloc |

下一章我们将深入前向传播的完整执行路径：从 Python 调用到 C++ kernel 的每一步。

---

*Signal 知识平台 · PyTorch 原理深度剖析 · 第 1 章*
