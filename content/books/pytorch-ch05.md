---
title: "第 5 章：torch.compile 与 TorchDynamo——编译革命"
description: "PyTorch 2.0 编译栈全解：TorchDynamo 字节码捕获、FX Graph、AOTAutograd、TorchInductor 代码生成、Triton kernel 编译、FlexAttention 实战"
date: "2026-04-11"
updatedAt: "2026-04-12 00:00"
book: "PyTorch 原理深度剖析"
chapter: 5
chapterTitle: "torch.compile 与 TorchDynamo——编译革命"
tags: ["PyTorch", "torch.compile", "TorchDynamo", "Inductor", "Triton", "FlexAttention"]
type: "book"
---

# 第 5 章：torch.compile 与 TorchDynamo——编译革命

## 5.1 从 Eager 到 Compiled：为什么需要编译？

PyTorch 的 Eager Mode 是其成功的基石——Python 式的逐行执行让调试和原型开发极其方便。但在生产训练中，Eager Mode 付出了巨大的性能代价：

```
PyTorch 1.x (Eager Mode):
  Python 代码 → 逐行执行 → 每个 op 单独调用 CUDA kernel
  
  问题 1: Python 开销
    每个 tensor 操作都要经过 Python 解释器
    for 循环 → 极慢（每次 dispatch overhead ~10μs）
    
  问题 2: 无法跨 op 优化
    x = a + b    # kernel 1: 读 a,b → 写 x（HBM 读写 1 次）
    y = x * c    # kernel 2: 读 x,c → 写 y（HBM 读写 1 次）
    # 总计: 4 次 HBM 读 + 2 次 HBM 写
    # 但如果融合: (a+b)*c → 2 次读 + 1 次写（节省 50%）
    
  问题 3: 无法利用硬件特性
    无法自动使用 Tensor Core
    无法自动做 CUDA Graph
    无法自动做 memory planning

PyTorch 2.0 (Compiled Mode):
  Python 代码 → 捕获计算图 → 编译优化 → 生成融合 kernel
  
  torch.compile = TorchDynamo + AOTAutograd + TorchInductor
```

## 5.2 TorchDynamo：字节码层面的图捕获

TorchDynamo 是 PyTorch 编译的"入口"——它在 **Python 字节码层面**拦截执行，构建计算图。这比之前所有图捕获方案都更强大：

```python
# Python 字节码
import dis

def my_function(x, y):
    z = x + y
    return z * 2

dis.dis(my_function)
# LOAD_FAST  x          (0)
# LOAD_FAST  y          (2)
# BINARY_ADD            (4)
# STORE_FAST z          (6)
# LOAD_FAST  z          (8)
# LOAD_CONST 2          (10)
# BINARY_MULTIPLY       (12)
# RETURN_VALUE          (14)

# TorchDynamo 通过 PEP 523 的 frame evaluation hook
# 替换 Python 的帧求值函数
# 拦截每条字节码，构建 FX Graph
```

### 5.2.1 图捕获方案的演进

```
方案 1: torch.jit.trace (PyTorch 1.0)
  问题: 无法处理控制流（if/for 被固定为一条路径）
  
方案 2: torch.jit.script (TorchScript)
  问题: 需要修改代码符合 TorchScript 子集语法
  
方案 3: torch.fx.symbolic_trace (FX Graph)
  问题: 无法处理数据依赖的控制流
  
方案 4: TorchDynamo (PyTorch 2.0) ✅
  ✅ 字节码级拦截，无需修改用户代码
  ✅ 遇到无法追踪的代码自动 Graph Break（优雅降级）
  ✅ 支持 data-dependent control flow
  ✅ 几乎 100% 的 PyTorch 代码都能捕获
```

### 5.2.2 Graph Break：当编译遇到"不可编译"的代码

```python
# ❌ 会导致 Graph Break 的代码
def bad_function(x):
    y = x + 1              # → Graph 1
    print(y.shape)          # Graph Break! print 是 Python 副作用
    z = y * 2              # → Graph 2
    return z
# 结果: 2 个子图，中间被 Python 代码断开
# 性能: 每个子图独立编译，失去跨区域优化机会

# ❌ 其他常见 Graph Break 原因:
# 1. 调用未编译的 Python 函数
# 2. 访问 .item()（tensor → Python scalar）
# 3. 动态 shape 条件分支
# 4. 非 PyTorch 操作（numpy、自定义 C++ 扩展）

# ✅ 避免 Graph Break 的写法
def good_function(x):
    y = x + 1
    z = y * 2
    return z
# 1 个完整的图，最优编译效果

# ✅ 检查 Graph Break
@torch.compile(fullgraph=True)  # 强制完整图，有 break 直接报错
def strict_function(x):
    return x + 1

# ✅ 查看编译日志
import torch._dynamo as dynamo
dynamo.config.log_level = logging.DEBUG
# 或者设置环境变量: TORCH_LOGS="dynamo"
```

### 5.2.3 Dynamic Shapes 处理

```python
# TorchDynamo 默认假设 tensor shape 固定
# 第一次调用 shape=[32,512] → 编译一次
# 第二次调用 shape=[16,1024] → 重新编译

# 开启 dynamic shapes
@torch.compile(dynamic=True)
def model_forward(x):
    return model(x)
# 用符号化 shape 编译，一次编译覆盖多种 shape
# 但可能牺牲一些优化机会（无法做 shape-specific 的 unrolling）

# 精细控制: mark_dynamic
x = torch.randn(32, 512)
torch._dynamo.mark_dynamic(x, 0)  # batch 维度动态
torch._dynamo.mark_dynamic(x, 1)  # sequence 维度动态
```

## 5.3 AOTAutograd：提前编译反向传播

传统 PyTorch 的反向传播是**运行时**构建的——前向执行时记录计算图（Autograd Tape），反向时遍历这个图。AOTAutograd 改变了这一点：

```
传统 (Eager):
  前向: x → op1 → op2 → op3 → y (记录每个 op 的 backward)
  反向: 遍历录制的计算图 → 逐个调用 backward kernel
  (反向传播的图在运行时才确定)

AOTAutograd:
  编译时:
    前向图 → functorch.grad → 生成反向图 → 两个图都送给 Inductor 编译
  运行时:
    直接执行编译好的 前向 kernel 和 反向 kernel
  
  核心优势: 反向传播也能做算子融合！
  
  举例:
    前向: y = ReLU(x @ W + b)
    反向 (Eager): grad_W = x.T @ (grad_y * (y > 0))  → 3 个 kernel
    反向 (AOT):   一个融合 kernel 完成所有计算       → 1 个 kernel
```

```python
# AOTAutograd 的工作流程
import torch._functorch as functorch

def forward_fn(x, weight, bias):
    return torch.nn.functional.relu(x @ weight + bias)

# 1. 函数化: 消除 in-place 操作
functionalized = functorch.functionalize(forward_fn)

# 2. 自动微分: 生成反向函数
forward_graph, backward_graph = functorch.aot_function(
    forward_fn,
    fw_compiler=inductor_compile,   # 前向用 Inductor 编译
    bw_compiler=inductor_compile    # 反向也用 Inductor 编译
)
```

## 5.4 TorchInductor：生成高性能 Kernel

TorchInductor 是编译栈的"后端"——接收 FX Graph，输出优化的 GPU/CPU kernel：

```python
# 输入: FX Graph (来自 TorchDynamo + AOTAutograd)
# graph():
#     %x = placeholder[target=x]
#     %add = call_function[target=torch.add](args=(%x, 1))
#     %mul = call_function[target=torch.mul](args=(%add, 2))
#     return (%mul,)

# Inductor 优化过程:
# 1. 算子融合 (Operator Fusion)
#    add + mul → 一个融合 kernel
# 2. Memory Planning
#    分析张量生命周期，复用内存
# 3. Kernel 选择
#    简单 elementwise → Triton pointwise kernel
#    矩阵乘法 → cuBLAS / Triton matmul
#    Attention → FlashAttention / Triton attention
```

### 5.4.1 Triton Kernel 代码生成

```python
# Inductor 自动生成的 Triton kernel 示例:
@triton.jit
def triton_fused_add_mul(
    in_ptr0,    # 输入 x
    out_ptr0,   # 输出
    xnumel,     # 元素总数
    XBLOCK: tl.constexpr  # 每个 block 处理的元素数
):
    xoffset = tl.program_id(0) * XBLOCK
    xindex = xoffset + tl.arange(0, XBLOCK)
    xmask = xindex < xnumel
    
    x0 = tl.load(in_ptr0 + xindex, xmask)
    # 融合: (x + 1) * 2 在一个 kernel 里完成
    tmp0 = x0 + 1.0    # add
    tmp1 = tmp0 * 2.0   # mul
    tl.store(out_ptr0 + xindex, tmp1, xmask)
    
# 关键: 2 次 HBM 访问（1 读 + 1 写）
# Eager 模式: 4 次 HBM 访问（2 读 + 1 写 + 1 读）
# 对 Memory-Bound 操作，这意味着 ~2x 加速
```

### 5.4.2 CUDA Graph 集成

```python
# CUDA Graph: 把一系列 GPU 操作录制为一个图，一次 launch
# 消除了每个 kernel 的 CPU-GPU dispatch overhead（~5-10μs × 1000 个 op）

@torch.compile(mode="reduce-overhead")  # 自动启用 CUDA Graph
def model_forward(x):
    return model(x)

# reduce-overhead 模式下 Inductor 的行为:
# 1. 第一次调用: 正常执行 + 录制 CUDA Graph
# 2. 后续调用: 直接 replay CUDA Graph
# 3. 如果输入 shape 变化: 重新录制

# 注意事项:
# - CUDA Graph 要求固定 shape（或者用 memory pool padding）
# - 不能在 Graph 内部做 CPU-GPU 同步
# - 不能在 Graph 内部做条件分支
```

## 5.5 FlexAttention：自定义 Attention 的编译利器

PyTorch 2.5+ 引入了 `flex_attention`，让你用 Python 写任意 attention pattern，编译后性能接近手写 CUDA：

```python
from torch.nn.attention.flex_attention import flex_attention, create_block_mask

# 1. 标准 Causal Attention
def causal_mask(b, h, q_idx, kv_idx):
    return q_idx >= kv_idx

block_mask = create_block_mask(causal_mask, B=1, H=1, Q_LEN=1024, KV_LEN=1024)
output = flex_attention(query, key, value, block_mask=block_mask)

# 2. Sliding Window Attention (Mistral 风格)
def sliding_window(b, h, q_idx, kv_idx):
    return (q_idx >= kv_idx) & (q_idx - kv_idx <= 4096)

# 3. 自定义 Score Modification (ALiBi)
def alibi_bias(score, b, h, q_idx, kv_idx):
    slope = 2 ** (-(h + 1) / num_heads * 8)
    return score + slope * (q_idx - kv_idx)

output = flex_attention(query, key, value, score_mod=alibi_bias)

# 4. Document Masking (多文档 attention)
def document_mask(b, h, q_idx, kv_idx):
    return document_ids[q_idx] == document_ids[kv_idx]

# FlexAttention 的魔力:
# - 用 Python 写 mask/bias 函数 → TorchDynamo 捕获 → Triton 编译
# - 自动利用 block-sparse structure，跳过全零块
# - 性能通常是 naive attention 的 2-4x，接近 FlashAttention
```

## 5.6 实际加速效果与最佳实践

```python
import torch
import time

model = YourTransformerModel().cuda()

# === 编译模式选择 ===
# "default"         — 平衡编译时间和运行速度 (推荐入门)
# "reduce-overhead" — 最大化运行速度（CUDA Graph，推荐推理）
# "max-autotune"    — 最大化速度，编译时间更长（搜索最优 Triton 配置，推荐训练）

compiled_model = torch.compile(model, mode="max-autotune")

# === 典型加速效果 ===
# LLM Training (7B, A100):
#   Eager:     1,200 tokens/sec
#   Compiled:  1,700 tokens/sec (42% 提升)
#   来源: 算子融合 + 减少 Python 开销 + CUDA Graph
#
# LLM Inference (Decode, batch=1):
#   Eager:     35 tokens/sec
#   reduce-overhead: 52 tokens/sec (49% 提升)
#   来源: CUDA Graph 消除 launch overhead
#
# Vision Transformer (ViT-L, A100):
#   Eager:     850 img/sec
#   max-autotune: 1,350 img/sec (59% 提升)

# === 编译 warmup 处理 ===
# 第一次调用会触发编译（可能需要 30s-2min）
with torch.no_grad():
    dummy = torch.randn(1, 512, device='cuda')
    _ = compiled_model(dummy)  # warmup 编译
    torch.cuda.synchronize()
print("Compilation done!")

# === 调试编译问题 ===
# 环境变量:
# TORCH_LOGS="dynamo"          — 查看图捕获日志
# TORCH_LOGS="inductor"        — 查看代码生成日志  
# TORCHDYNAMO_VERBOSE=1        — 详细 graph break 原因
# TORCH_COMPILE_DEBUG=1        — 输出所有中间 IR

# 代码内调试:
torch._dynamo.config.suppress_errors = True  # 编译失败时回退 eager（开发用）
torch._dynamo.reset()  # 清除编译缓存
```

### 5.6.1 编译与分布式训练

```python
# torch.compile + FSDP2 (推荐组合)
from torch.distributed._composable.fsdp import fully_shard

model = MyLLM()
for layer in model.layers:
    fully_shard(layer)  # FSDP2 sharding
fully_shard(model)

# compile 必须在 FSDP wrap 之后
compiled_model = torch.compile(model)

# torch.compile + DDP
model = DDP(model, device_ids=[rank])
compiled_model = torch.compile(model)

# 注意: compile + DDP/FSDP 可能需要设置:
torch._dynamo.config.optimize_ddp = True
```

## 5.7 编译栈全景架构

```
用户代码 (Python)
    │
    ▼
TorchDynamo ─── 字节码拦截 → FX Graph (前向)
    │                              │
    │                              ▼
    │                        AOTAutograd ─── functorch → FX Graph (反向)
    │                              │
    ▼                              ▼
Pattern Matching ←────── FX Graph (前向 + 反向)
    │
    ├── FlashAttention Pattern → 直接调用 FlashAttention
    ├── GEMM Pattern          → 直接调用 cuBLAS
    └── Elementwise/Reduce    → Triton codegen
                                   │
                                   ▼
                              TorchInductor
                                   │
                    ┌──────────────┼──────────────┐
                    ▼              ▼              ▼
               Triton Kernel   cuBLAS Call   CUDA Graph
                    │              │              │
                    └──────────────┴──────────────┘
                                   │
                                   ▼
                              GPU Execution
```

## 5.8 本章小结

| 组件 | 作用 | 关键技术 |
|------|------|---------|
| TorchDynamo | 捕获计算图 | Python 字节码修改 (PEP 523) |
| AOTAutograd | 编译反向传播 | functorch 自动微分 |
| TorchInductor | 生成 kernel | Triton / cuBLAS / CUDA codegen |
| FlexAttention | 自定义 Attention | Python → Triton 编译 |

**关键要点：**
1. `torch.compile` 对大多数 PyTorch 代码开箱即用
2. `mode="reduce-overhead"` 适合推理，`mode="max-autotune"` 适合训练
3. 避免 Graph Break 是获得最佳性能的关键
4. 编译 + FSDP2 是当前 LLM 训练的最佳实践
5. FlexAttention 让自定义 attention pattern 变得简单且高效

---

*Signal 知识平台 · PyTorch 原理深度剖析 · 第 5 章*
