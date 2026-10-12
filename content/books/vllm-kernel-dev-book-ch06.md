---
title: "vLLM 算子开发全书 - 第6章: 算子融合：vLLM 到底融合了什么，怎么体现"
book: "vLLM 算子开发全书：新增架构何时开刀、何时白嫖，以及算子融合怎么落地"
chapter: "6"
chapterTitle: "算子融合：vLLM 到底融合了什么，怎么体现"
description: "系统拆解 vLLM 的算子融合：为什么要融合、vLLM 编译管线里 10 个 fusion pass 各自融合了什么、手写融合算子与编译器自动融合的分工、以及怎么验证融合真的发生了"
date: "2026-10-12"
updatedAt: "2026-10-12"
agent: "研究员→编辑→审校员"
tags:
  - "vLLM"
  - "算子融合"
  - "kernel fusion"
  - "torch.compile"
  - "CUDA Graph"
  - "推理优化"
type: "book"
---

# 第 6 章 · 算子融合：vLLM 到底融合了什么

## 6.1 融合要解决的根本问题：不是算力，是启动开销与显存往返

一个直觉类比：

> GPU 像一个切菜极快但每次都要等一张新订单条的厨师——「切洋葱」…等…「热油」…等…「下洋葱」…等。

一次模型 forward 可能涉及**数百次 kernel launch**。每一次 launch 都有 CPU→GPU 的固定开销，而每次 kernel 之间还要把中间结果写回显存再读出来。

**融合的本质**：把相邻的两个（或多个）操作合成一个 kernel，从而

```
① 少一次 kernel launch（省 CPU 开销）
② 少一次显存往返（中间结果留在寄存器/共享内存里）
③ 少一份中间张量的显存占用
```

> ★**关键认知**：在 decode 阶段，很多算子是**访存受限**而非算力受限。此时融合省掉的那次显存往返，收益远大于任何算术优化。这就是为什么融合对 LLM 推理格外重要。

## 6.2 vLLM 的编译管线：融合发生的位置

```
① Dynamo（Python → FX graph）
      追踪 forward 的字节码，记录算子，产出 FX 图（不执行代码）
        ↓
② vLLM 自定义 Pass（FX graph → 优化后的 graph）  ★融合在这里发生
      vllm/compilation/passes/，可按需开关（PassConfig）
        ↓
③ Inductor（优化后的 graph → CUDA / Triton kernel）
      内存规划、循环分块、寄存器分配
        ↓
④ 磁盘缓存
      第二次启动直接命中，冷启动不再编译
```

**两个值得记住的实现细节**：

1. **vLLM 丢弃了所有 Dynamo guards**（`TorchCompileWithNoGuardsWrapper`，`guard_filter_fn = lambda x: [False for _ in x]`）。因为 vLLM 自己控制输入形状，所以**只编译一次，永不重编译**——这对长驻服务的启动时间是重要优化。
2. **缓存 key 包含**：模型 hash、dtype、并行布局、编译模式 + pass 配置、CUDA/NCCL/Triton 版本。默认位置 `~/.cache/vllm/torch_compile_cache/`。**换任何一个都会重新编译**，这也是"为什么我改了个参数启动就慢了"的常见答案。

## 6.3 十大 fusion pass：vLLM 具体融合了什么

这是本章最有价值的一张表。这些 pass 位于 `vllm/compilation/passes/fusion/`，全部可通过 `CompilationConfig.pass_config` 开关：

| Pass | 融合了什么 | 为什么有价值 |
|---|---|---|
| **`act_quant_fusion`** | SiLU + Mul + Quantize → 1 个 kernel | 门控 MLP 的输出紧接着量化，是 FP8 路径上的热点 |
| **`rms_quant_fusion`** | RMSNorm + Quantize → 1 个 kernel | 同上，归一化后立刻量化 |
| **`attn_quant_fusion`** | Attention + Quantize → 1 个 kernel | 注意力输出直接量化进 KV 或下一层 |
| **`allreduce_rms_fusion`** | **AllReduce + RMSNorm → 1 个 kernel（重叠通信）** | ★张量并行下每个 block 结束都有 AllReduce，把它与下一个 norm 重叠是 TP 场景的大杀器 |
| **`collective_fusion`** | GEMM + TP 通信 → 重叠 | 通信与计算重叠，隐藏延迟 |
| **`qk_norm_rope_fusion`** | **QK norm + RoPE → 1 个 kernel** | 现代架构（Qwen3 等）普遍在 QK 上加 norm，与 RoPE 天然相邻 |
| **`sequence_parallelism`** | 序列并行相关优化 | 长序列场景 |
| **Attention rewriting** | **pre-attention RMSNorm + QKV 投影** | 注意力前的固定组合 |
| **MoE fusion** | router + dispatch + experts（可能时合并） | MoE 的调度开销 |
| **Memory passes** | donated buffers、in-place ops、**KV-write fusion** | 省显存、省写入 |

**读这张表的三个收获**：

1. **融合的对象高度固定**：归一化、量化、残差加、激活、RoPE、通信——这些才是推理图里真正相邻的成对操作。
2. **通信也能被"融合"**（`allreduce_rms_fusion`、`collective_fusion`）——这是 TP 部署下最容易被忽视的收益点。
3. **底层已有融合算子**（第 2 章的 `fused_add_rms_norm` / `silu_and_mul`）——编译器的融合 pass 与手写的融合算子是**同一目标的两层实现**。

## 6.4 手写融合算子 vs 编译器自动融合

这是一个必须分清的分工：

| | **手写融合算子** | **编译器自动融合** |
|---|---|---|
| 位置 | `csrc/` 或 Triton，包成 CustomOp | `vllm/compilation/passes/` 的 FX pass |
| 触发条件 | 模型代码显式调用融合路径 | 编译器在 FX 图上 pattern-match |
| 优点 | 确定性强、可手工极致优化 | **零代码，覆盖所有用标准原语写的代码** |
| 缺点 | 只为特定组合服务；每个组合都要写 | 只认已知模式；模式不匹配就融合不了 |
| 典型 | `fused_add_rms_norm`、`silu_and_mul`、`paged_attention_v1/v2` | `rms_quant_fusion`、`act_quant_fusion` |

**★决策规则**：

```
① 先让编译器试（用标准原语写 forward）
       ↓ 编译器融合成功 → 结束，不用写算子
       ↓ 编译器做不到（模式不认识 / 性能仍不够）
② 写一个融合算子（Triton 优先），包成 CustomOp
       ↓
③ 模型 forward 改成调用融合路径
```

> 再次强调那条实践提醒：**在写融合 kernel 之前先查 `vllm/compilation/`**。手写编译器已经会做的融合，是最常见的一种白费功夫。

## 6.5 融合在代码里怎么体现：三处可观察的位置

如果你想知道"融合到底发生了没有"，看这三个地方：

**① 算子名层面**（最直观）
`vllm/_custom_ops.py` 里出现 `fused_` 前缀或 `_and_` 连接的算子名，就是融合算子：

- `fused_add_rms_norm` — 残差加 + 归一化
- `silu_and_mul` / `gelu_and_mul` — 激活 + 门控乘
- `cutlass_scaled_mm` — GEMM + 反量化（融合进 GEMM 的 epilogue）
- `gptq_marlin_gemm` / `awq_gemm` — 反量化 + GEMM

**② 编译 pass 层面**
`vllm/compilation/passes/fusion/*.py` 每个文件一个模式；通过 `CompilationConfig.pass_config` 开关。

**③ 运行期层面**
编译产物的 kernel 数量与名字（profile 工具里可见融合后的 kernel）。

## 6.6 一个具体例子：残差加 + 归一化

Transformer 里最经典的一对相邻操作：

```
不融合（3 次 kernel launch + 2 次显存往返）：
  residual = x + residual      ← kernel 1，写回显存
  normed = rms_norm(residual)  ← kernel 2，读出来再写回

融合（1 次 kernel launch + 0 次额外往返）：
  residual, normed = fused_add_rms_norm(x, residual)  ← 一次读完、算完、写出
```

`fused_add_rms_norm` 的存在说明：**这个最常见的模式，vLLM 已经在算子层给你融合好了**。如果你的新架构 forward 里还在分两步写，那就白白丢失了这次融合——这就是第 4 章说"归一化位置不同"虽然是 B 档、但仍要写对 forward 的原因。

## 6.7 融合与量化：一层容易漏的关系

注意 `rms_quant_fusion`、`act_quant_fusion`、`attn_quant_fusion` 三个 pass 的共同点：**它们融合的都是「归一化/激活 + 量化」**。

这意味着在 **FP8 / INT8 路径上，融合的收益比 FP16 更大**——因为量化本身多了一步。所以：

> **评估新架构性能时，要分别在 FP16 与量化路径上测。** 有些架构在 FP16 下融合覆盖良好，切换到 FP8 后因为某个算子没有量化版本，融合链断了，性能反而大跌。

这也呼应第 3 章的结论：**自写 kernel 意味着自付量化版本的成本**，包括它的融合版本。

## 6.8 怎么验证融合真的发生了

```
① 开 torch.compile（默认开；enforce_eager=True 会关掉全部编译优化）
② 看编译日志 / profile：kernel 数量是否下降
③ 对比开关 pass_config 前后的吞吐：
   --compilation-config '{"pass_config": {"enable_fusion": false}}'
   若关掉融合后明显变慢 → 说明融合生效了
④ 检查缓存是否命中：改配置会换 cache key，导致重编译
⑤ 注意 CUDA graph 是否捕获成功（融合后的图更适合被捕获）
```

## 6.9 本章小结

- **融合省的是 launch 开销与显存往返**，decode 阶段多为访存受限，所以收益显著。
- **管线四步**：Dynamo → **vLLM fusion pass（融合发生处）** → Inductor → 磁盘缓存；vLLM 丢弃 guards 实现"只编译一次"。
- **十大 pass**：`act_quant` / `rms_quant` / `attn_quant` / `allreduce_rms`（重叠通信）/ `collective`（GEMM+TP 重叠）/ `qk_norm_rope` / attention rewriting / MoE fusion / memory(KV-write) 等。
- ★**先让编译器融合，做不到再手写**；手写前必查 `vllm/compilation/`。
- **融合在量化路径上收益更大**，评估时要分 FP16 与量化两条路径测。

**下一章**是所有自定义 kernel 都必须过的关：**连续批处理与 CUDA graph 的硬约束**——写错不会报错，只会静默破坏其他请求的 cache。
