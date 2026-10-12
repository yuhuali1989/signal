---
title: "vLLM 算子开发全书 - 第5章: 四条实现路径：CUDA、Triton、torch.compile 与 CustomOp"
book: "vLLM 算子开发全书：新增架构何时开刀、何时白嫖，以及算子融合怎么落地"
chapter: "5"
chapterTitle: "四条实现路径：CUDA、Triton、torch.compile 与 CustomOp"
description: "对比 vLLM 里实现算子的四条路径：native PyTorch 回退、torch.compile 自动融合、Triton kernel、CUDA csrc kernel，给出取舍表、CUDA 算子的五步接入骨架与多后端分派写法"
date: "2026-10-12"
updatedAt: "2026-10-12"
agent: "研究员→编辑→审校员"
tags:
  - "vLLM"
  - "算子开发"
  - "Triton"
  - "CUDA"
  - "torch.compile"
  - "GPU 内核"
type: "book"
---

# 第 5 章 · 四条实现路径

## 5.1 先看清这四条路不是并列关系

它们更像是**递进的四级**——越往下越贵、越难维护，但也越接近性能上限：

```
① forward_native（纯 PyTorch）   正确性基线，任何平台可跑
        ↓ 不够快
② torch.compile 自动融合         零代码，编译器帮你合
        ↓ 编译器做不到
③ Triton kernel                  跨平台、可读、迭代快
        ↓ 最后一程
④ CUDA kernel（csrc/）           极致性能，但只管 NVIDIA、维护成本高
```

**原则：能用上一层解决，就不要往下走。** 每下一级都意味着：更长的开发周期、更窄的硬件覆盖、更高的维护成本。

## 5.2 路径一：forward_native（纯 PyTorch）

**CustomOp 的标准约定**：每个自定义算子都要实现 `forward_native`，作为平台无关的回退实现。

```python
class MyNorm(CustomOp):
    def forward_native(self, x, residual=None):
        # 纯 PyTorch，慢但一定对
        orig_dtype = x.dtype
        x = x.to(torch.float32)
        if residual is not None:
            x = x + residual.to(torch.float32)
            residual = x.to(orig_dtype)
        ...
        return x.to(orig_dtype), residual

    def forward_cuda(self, x, residual=None):
        return ops.my_fused_norm(x, residual, self.weight, self.eps)

    def forward_rocm(self, x, residual=None):
        return aiter_ops.my_norm(x, self.weight, self.eps)
```

**它的三重价值**：
1. **安全网**：新平台、新 dtype 组合下不会直接崩
2. **正确性参照**：CUDA 实现的单元测试可以拿它当 golden
3. **性能下限**：即使 kernel 没写，功能也完整

## 5.3 路径二：让 torch.compile 去融合

vLLM 的编译管线（第 6 章详述）已经内置了针对性的融合 pass。**如果你的算子是用标准 PyTorch 原语写的，编译器很可能自动完成融合**——此时手写 kernel 是重复劳动。

判断方法：

```
① 先用 forward_native 实现
② 开启 torch.compile（默认开启，enforce_eager=True 会关掉）
③ 用 torch.compile 的日志或 profile 看生成的 kernel 数量与耗时
④ 若编译器已融合（如 RMSNorm+Quant 合成一个 kernel），就不必手写
```

> ★**一条来自实践的经验提醒**：写融合 kernel 之前**先查 `vllm/compilation/`**。vLLM 对已知模式已有融合 hook——只要底层原语暴露得正确，图编译器会自动融合。**手写编译器已经会做的融合，是最常见的一种白费功夫。**

## 5.4 路径三：Triton kernel

**典型位置**：`vllm/attention/ops/` 下（`triton_flash_attention.py`、`prefix_prefill.py`、`triton_unified_attention.py`）。

**优点**：
- Python 语法，可读性与 PyTorch 接近
- **跨平台**：CUDA 与 ROCm 都能跑（同一份代码）
- 迭代快：改完即测，无需编译整个扩展
- 与 vLLM 的 Triton 版本一起被纳入编译缓存 key

**缺点**：
- 对极致手工优化（如寄存器级调度、CUTLASS 级别的 GEMM）力有不逮
- 复杂的数据布局变换写起来比 CUDA 啰嗦

**适合场景**：注意力变体、归一化/激活融合、位置编码、MoE 的 dispatch 逻辑——**绝大多数 vLLM 算子需求**。

## 5.5 路径四：CUDA kernel（csrc/）

**五步接入骨架**（第 2 章展开过，这里给完整版）：

```
① 实现：csrc/ 下写 .cu
② 声明：csrc/ops.h 加函数声明
③ 注册：csrc/torch_bindings.cpp
        ops.def("my_kernel(Tensor x, Tensor w) -> Tensor");
        ops.impl("my_kernel", torch::kCUDA, &my_kernel_impl);
④ Python 面：vllm/_custom_ops.py 加 wrapper
        def my_kernel(x, w): return torch.ops._C.my_kernel(x, w)
⑤ 包装：CustomOp 里按平台分派
⑥ 【别忘】CMakeLists.txt 加源文件
```

**三个必踩的坑**（重温）：

| 坑 | 后果 | 解法 |
|---|---|---|
| 没注册 meta function | `torch.compile` shape propagation 失败，报错难懂 | `@register_fake` |
| 只写 CUDA | ROCm / CPU 上退化或报错 | 在 `csrc/rocm/torch_bindings.cpp`（`torch.ops._rocm_C`）、`csrc/cpu/torch_bindings.cpp` 分别注册 |
| 忘了改 CMakeLists | 代码不参与编译，符号找不到 | 加进对应 extension |

**什么时候值得写 CUDA**：
- GEMM 类（要用 CUTLASS / cuBLASLt 级别优化）
- 已被 profile 证明是瓶颈、且 Triton 版本明显不够快
- 需要特殊指令（FP8/FP4 的 tensor core 指令、TMA 等）

## 5.6 四条路取舍表

| 维度 | forward_native | torch.compile | Triton | CUDA |
|---|---|---|---|---|
| 开发成本 | 极低 | 零 | 低 | 高 |
| 维护成本 | 低 | 零 | 低 | 高 |
| 硬件覆盖 | 全部 | 全部 | CUDA + ROCm | 主要是 NVIDIA |
| 性能 | 差 | 中 | 好 | 最好 |
| 能否参与融合 | 能（编译器可见） | 本身就是融合 | 能（注册后） | 能（注册后） |
| 适用 | 正确性基线 / 长尾平台 | 标准原语可表达的模式 | **默认首选** | 瓶颈处的最后 10% |

## 5.7 多后端分派：CustomOp 的正确写法

无论用哪条路径实现，最终都应包成 `CustomOp`，由 `forward()` 按 `current_platform` 和配置标志分派：

```python
class MyOp(CustomOp):
    def forward_native(self, x): ...   # 回退
    def forward_cuda(self, x): ...     # CUDA / Triton 实现
    def forward_rocm(self, x): ...     # ROCm（AITER 等）
    def forward_xpu(self, x): ...      # XPU
    def forward_cpu(self, x): ...      # CPU（onednn 等）
```

**两个容易被忽略的收益**：

1. **注册到 `torch.library` 后，编译器才能在 FX 图上 pattern-match 并替换它。** 绕过 CustomOp 直接调裸 kernel，编译器就看不见，也就无法参与融合。
2. **配置标志可以开关**：某些算子在特定 dtype 或特定平台上不适用，可以在分派里按条件回退，而不用改调用点。

## 5.8 接入后的第一件事：让它可以被测试

写完算子，先做三件比性能优化更重要的事：

```
① 与 forward_native 对拍：随机输入，比对输出（含 dtype 边界）
② 跑 vLLM 的模型正确性测试：与 HF transformers 逐 token 对比
③ 记录它在什么平台上走哪条路径（写进文档或 docstring）
```

> 第 8 章会给完整的验证流程。这里强调一点：**算子的正确性 bug 极难从模型输出上发现**——它表现为"偶尔掉点"，而不是崩溃。所以对拍是必须的，不是可选的。

## 5.9 本章小结

- **四条路是递进的，不是并列的**：`forward_native` → `torch.compile` → `Triton` → `CUDA`。能用上一层就别往下走。
- **Triton 是默认首选**：跨平台（CUDA+ROCm）、可读、迭代快；CUDA 留给 GEMM 与被证明的瓶颈。
- **CustomOp 是标准包装**：按平台分派 `forward_*`，且**注册进 torch.library 才能被编译器看见并参与融合**。
- **CUDA 三坑**：meta function（@register_fake）、ROCm/CPU 单独注册、CMakeLists 加文件。
- **写完先对拍再优化**——算子 bug 表现为"偶尔掉点"，不会崩。

**下一章**是全书核心：**算子融合**。为什么融合、vLLM 里融合具体在哪些 pass 里发生、以及手写融合与编译器自动融合怎么分工。
