---
title: "第 3 章：反向传播——Autograd 引擎的完整剖析"
description: "深入 PyTorch Autograd 引擎：反向传播的图遍历算法、梯度累积机制、Checkpoint 内存优化、自定义反向传播、常见梯度 Bug 排查"
date: "2026-04-11"
updatedAt: "2026-04-11"
book: "PyTorch 原理深度剖析"
chapter: 3
chapterTitle: "反向传播——Autograd 引擎的完整剖析"
tags: ["PyTorch", "反向传播", "Autograd", "梯度", "Checkpoint"]
type: "book"
---

# 第 3 章：反向传播——Autograd 引擎的完整剖析

> `loss.backward()` 一行代码，背后是 PyTorch 最复杂的子系统。

## 3.1 反向传播的数学基础

### 3.1.1 链式法则的计算图表示

给定计算图 $y = f(g(h(x)))$，链式法则：

$$\frac{\partial y}{\partial x} = \frac{\partial y}{\partial f} \cdot \frac{\partial f}{\partial g} \cdot \frac{\partial g}{\partial h} \cdot \frac{\partial h}{\partial x}$$

在计算图中，**反向模式自动微分**从输出向输入传播梯度：

```
前向传播: x → h(x) → g(h) → f(g) → y
                                     │
反向传播: dx ← dh ← dg ← df ← dy = 1
```

**为什么用反向模式而不是前向模式？** 

对于 $f: \mathbb{R}^n \to \mathbb{R}$（n 个参数，1 个 loss）：
- 前向模式：需要 $n$ 次传播（每个参数一次）
- 反向模式：只需要 **1 次**传播

深度学习模型有上亿参数但只有 1 个 loss，所以反向模式高效 $10^8$ 倍。

### 3.1.2 雅可比矩阵与向量积 (VJP)

PyTorch 的 Autograd 不计算完整的雅可比矩阵 $J$，而是计算**向量-雅可比积 (VJP)**：

$$v^T J = v^T \frac{\partial f}{\partial x}$$

其中 $v$ 是从上游传来的梯度向量。这避免了存储完整雅可比矩阵。

```python
# 手动验证 VJP
x = torch.tensor([1.0, 2.0, 3.0], requires_grad=True)
y = x ** 2  # y = [1, 4, 9]

# 雅可比矩阵 J = diag(2x) = diag([2, 4, 6])
# VJP: v^T @ J，其中 v 是上游梯度

# 当 v = [1, 1, 1]（即 y.sum().backward()）
y.sum().backward()
print(x.grad)  # tensor([2., 4., 6.]) = v^T @ diag(2x)

# 当 v = [1, 0, 0]（只对 y[0] 求梯度）
x.grad = None
y[0].backward()
print(x.grad)  # tensor([2., 0., 0.])
```

## 3.2 Autograd 引擎的执行流程

### 3.2.1 loss.backward() 的完整路径

```python
loss.backward()

# 等价于：
torch.autograd.backward(
    tensors=[loss],
    grad_tensors=[torch.ones_like(loss)],  # 初始梯度 = 1
    retain_graph=False,
    create_graph=False,
)
```

```
loss.backward() 执行流程:

1. 创建初始梯度 grad_output = 1.0
2. 从 loss.grad_fn 开始，拓扑排序计算图
3. 按拓扑逆序（从输出到输入）遍历节点
4. 对每个节点调用 apply(grad)
5. 将计算出的梯度传递给下游节点
6. 叶子节点的梯度累积到 .grad 属性

详细步骤:

loss.grad_fn = PowBackward0
  ├── 计算: grad_w = grad_loss * 2 * w
  └── 传递给 w.grad_fn = AddBackward0
        ├── 计算: grad_z = grad_w * 1
        │   └── 传递给 z.grad_fn = MulBackward0
        │         ├── grad_x += grad_z * y  (累积到 x.grad)
        │         └── grad_y += grad_z * x  (累积到 y.grad)
        └── 计算: grad_x += grad_w * 1  (累积到 x.grad)
```

### 3.2.2 C++ Engine 的核心实现

```cpp
// 简化版 Autograd Engine (torch/csrc/autograd/engine.cpp)
class Engine {
    void execute(const edge_list& roots,
                 const variable_list& inputs) {
        
        // 1. 拓扑排序：计算每个节点的依赖数
        std::unordered_map<Node*, int> dependencies;
        compute_dependencies(roots, dependencies);
        
        // 2. 初始化就绪队列
        std::priority_queue<NodeTask> ready_queue;
        for (auto& root : roots) {
            ready_queue.push({root.function, inputs});
        }
        
        // 3. 主循环：处理就绪队列中的节点
        while (!ready_queue.empty()) {
            auto task = ready_queue.top();
            ready_queue.pop();
            
            // 4. 执行反向函数
            auto outputs = task.fn->apply(task.inputs);
            
            // 5. 将梯度传递给下游节点
            for (int i = 0; i < outputs.size(); i++) {
                auto& edge = task.fn->next_edge(i);
                auto& next_fn = edge.function;
                
                // 累积梯度（同一个节点可能从多条路径收到梯度）
                accumulate_grad(next_fn, edge.input_nr, outputs[i]);
                
                // 依赖数减 1，为 0 时加入就绪队列
                if (--dependencies[next_fn.get()] == 0) {
                    ready_queue.push({next_fn, ...});
                }
            }
        }
    }
};
```

### 3.2.3 多线程反向传播

```
PyTorch Autograd Engine 的线程模型:

默认: 使用线程池 (CPU) 或 CUDA Stream (GPU)

主线程:        [计算 Node A] → [计算 Node B] → ...
工作线程 1:    [计算 Node C] → [计算 Node E]
工作线程 2:    [计算 Node D]

关键: 独立的子图可以并行计算
  如果 Node C 和 Node D 没有依赖关系 → 可以并行

GPU 上的特殊处理:
  反向传播通常在 default CUDA stream 上串行执行
  但不同 stream 间可以并行
  torch.cuda.stream() 手动控制
```

## 3.3 梯度累积的细节

### 3.3.1 为什么是 "累积" 而不是 "覆盖"？

```python
# 梯度累积的原因：一个参数可能被多次使用
x = torch.tensor([2.0], requires_grad=True)
y = x * x  # x 被用了两次
y.backward()

# dy/dx = d(x*x)/dx = x + x = 2x = 4
# 实现方式：
# MulBackward0.apply():
#   grad_x_from_left  = grad_y * x = 1 * 2 = 2 (x 作为左操作数)
#   grad_x_from_right = grad_y * x = 1 * 2 = 2 (x 作为右操作数)
#   x.grad = 2 + 2 = 4  ← 累积！
```

### 3.3.2 梯度清零的必要性

```python
# 经典 bug：忘记清零梯度
optimizer = torch.optim.SGD(model.parameters(), lr=0.01)

for epoch in range(10):
    for batch in dataloader:
        # ❌ 错误：不清零，梯度会持续累积
        loss = model(batch)
        loss.backward()  # 梯度累加到已有的 .grad 上
        optimizer.step()

# ✅ 正确方式
for epoch in range(10):
    for batch in dataloader:
        optimizer.zero_grad()  # 必须先清零
        loss = model(batch)
        loss.backward()
        optimizer.step()

# ✅ 更高效的方式 (PyTorch 1.7+)
for epoch in range(10):
    for batch in dataloader:
        optimizer.zero_grad(set_to_none=True)  # 设为 None 而不是 0
        # 好处：节省一次 memset 操作，且下次 backward 直接写入而不是 +=
        loss = model(batch)
        loss.backward()
        optimizer.step()
```

### 3.3.3 梯度累积实现大 Batch

```python
# 显存不够放大 batch？用梯度累积等效实现
accumulation_steps = 4
effective_batch_size = micro_batch_size * accumulation_steps

optimizer.zero_grad()
for i, batch in enumerate(dataloader):
    loss = model(batch) / accumulation_steps  # 注意要除以步数
    loss.backward()  # 梯度累积（不清零）
    
    if (i + 1) % accumulation_steps == 0:
        optimizer.step()  # 累积 4 步后再更新参数
        optimizer.zero_grad()
```

## 3.4 Gradient Checkpointing：用时间换空间

### 3.4.1 问题：激活值的显存开销

前向传播时，每一层的输出（激活值）都需要保存，因为反向传播时要用：

$$\text{激活值显存} \approx \text{batch\_size} \times \text{seq\_len} \times \text{hidden\_dim} \times \text{num\_layers} \times 2\text{B}$$

Llama 70B, batch=1, seq=8192:

$$1 \times 8192 \times 8192 \times 80 \times 2 \approx 10.7\text{ GB}$$

### 3.4.2 Checkpoint 的工作原理

```python
# 不用 checkpoint：保存所有激活值
def forward(self, x):
    h1 = self.layer1(x)    # 保存 h1 (用于反向)
    h2 = self.layer2(h1)   # 保存 h2
    h3 = self.layer3(h2)   # 保存 h3
    return self.layer4(h3)
# 显存: O(N) 层的激活值

# 用 checkpoint：只保存部分，反向时重算
from torch.utils.checkpoint import checkpoint

def forward(self, x):
    # 前向：不保存 h1, h2 的激活值
    h1 = checkpoint(self.layer1, x, use_reentrant=False)
    h2 = checkpoint(self.layer2, h1, use_reentrant=False)
    h3 = self.layer3(h2)
    return self.layer4(h3)
# 反向传播时：重新执行 layer1, layer2 的前向来获取激活值
# 显存: O(sqrt(N))，但计算量增加 ~33%
```

### 3.4.3 Selective Checkpoint

```python
# 不是所有层都值得 checkpoint
# 原则：checkpoint 计算量大但激活值也大的层

class TransformerBlock(nn.Module):
    def forward(self, x):
        # Attention 的激活值很大 (seq_len^2) → 值得 checkpoint
        h = checkpoint(self.attention, x, use_reentrant=False)
        
        # MLP 的激活值较小 → 不 checkpoint
        h = self.mlp(h)
        
        return h
```

## 3.5 常见梯度问题排查

### 3.5.1 梯度消失与爆炸

```python
# 检测梯度健康状况
def check_gradients(model):
    for name, param in model.named_parameters():
        if param.grad is not None:
            grad_norm = param.grad.norm()
            param_norm = param.norm()
            ratio = grad_norm / (param_norm + 1e-8)
            
            if grad_norm < 1e-7:
                print(f"⚠️ 梯度消失: {name}, grad_norm={grad_norm:.2e}")
            elif grad_norm > 1e3:
                print(f"⚠️ 梯度爆炸: {name}, grad_norm={grad_norm:.2e}")
            elif ratio > 100:
                print(f"⚠️ 梯度/参数比过大: {name}, ratio={ratio:.2e}")
```

### 3.5.2 梯度裁剪

```python
# 全局梯度裁剪 (最常用)
torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)

# 实现原理：
def clip_grad_norm_(parameters, max_norm):
    # 1. 计算所有参数梯度的总范数
    total_norm = torch.sqrt(
        sum(p.grad.norm() ** 2 for p in parameters if p.grad is not None)
    )
    
    # 2. 计算裁剪系数
    clip_coef = max_norm / (total_norm + 1e-6)
    clip_coef = min(clip_coef, 1.0)  # 不放大，只缩小
    
    # 3. 对所有梯度乘以裁剪系数
    for p in parameters:
        if p.grad is not None:
            p.grad.mul_(clip_coef)
    
    return total_norm
```

### 3.5.3 in-place 操作与梯度

```python
# ❌ 危险：in-place 操作可能破坏计算图
x = torch.tensor([1.0], requires_grad=True)
y = x * 2
y.add_(1)  # in-place！修改了 y 的数据
# y 的 grad_fn 保存的是修改前的引用 → 梯度错误

# ✅ 安全：用 out-of-place 操作
y = x * 2
y = y + 1  # 创建新 Tensor，计算图完整

# PyTorch 2.0+ 的检测机制：
# 版本号检查 —— 每个 Tensor 有 _version 计数器
# in-place 操作 _version += 1
# backward 时检查 version，不一致则报错
```

## 3.6 高阶梯度与 create_graph

```python
# 计算二阶梯度（Hessian-Vector Product）
x = torch.tensor([2.0], requires_grad=True)
y = x ** 3  # y = 8

# 一阶梯度
dy_dx = torch.autograd.grad(y, x, create_graph=True)[0]
print(dy_dx)  # tensor([12.]) = 3x^2 = 3*4 = 12

# 二阶梯度
d2y_dx2 = torch.autograd.grad(dy_dx, x)[0]
print(d2y_dx2)  # tensor([12.]) = 6x = 6*2 = 12

# create_graph=True 让一阶梯度保留计算图
# 这样二阶梯度也能反向传播
# 用途：MAML（元学习）、对抗训练、物理模拟
```

## 3.7 本章小结

| 概念 | 核心机制 |
|------|---------|
| **反向传播** | 拓扑逆序遍历计算图，调用每个节点的 `apply()` |
| **梯度累积** | 同一参数从多条路径收到的梯度相加 |
| **Checkpoint** | 牺牲 ~33% 计算换 $O(\sqrt{N})$ 显存 |
| **梯度裁剪** | 全局范数裁剪防止梯度爆炸 |
| **高阶梯度** | `create_graph=True` 保留计算图 |

---

*Signal 知识平台 · PyTorch 原理深度剖析 · 第 3 章*
