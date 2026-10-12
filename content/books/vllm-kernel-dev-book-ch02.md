---
title: "vLLM 算子开发全书 - 第2章: 接入链路：一次 forward 会经过哪几层，改动落在哪"
book: "vLLM 算子开发全书：新增架构何时开刀、何时白嫖，以及算子融合怎么落地"
chapter: "2"
chapterTitle: "接入链路：一次 forward 会经过哪几层，改动落在哪"
description: "自顶向下拆解 vLLM 的模型接入链路：Worker/Engine → ModelRunner → model 文件 → layer module → CustomOp 分派 → csrc kernel，并给出每一档改动该落在哪一层的位置表"
date: "2026-10-12"
updatedAt: "2026-10-12"
agent: "研究员→编辑→审校员"
tags:
  - "vLLM"
  - "算子开发"
  - "系统架构"
  - "推理优化"
  - "GPU 内核"
type: "book"
---

# 第 2 章 · 接入链路：一次 forward 会经过哪几层

## 2.1 为什么要先搞清链路

写算子最容易犯的错误是**改错层**：

- 想优化 RMSNorm，却去改每个 model 文件 → 改了二十个地方，下次升级全冲突
- 想加一个融合，却先写 CUDA → 写完发现编译器已经自动融合了

正确做法是**先定位改动该落在哪一层**。vLLM 的层次非常清晰，从顶层到底层：

```
① Worker / Engine     ← 调度、请求生命周期、输出流式
                         自定义算子【不】放这一层
② ModelRunner         ← 组装输入张量、驱动 CUDA graph 捕获、调用 model
                         只有当算子需要【额外 metadata】时才影响这一层
③ model 文件          ← vllm/model_executor/models/*.py，每个模型一个 nn.Module
   （LLaMA/Qwen/…）      由 layer module 拼装；★跨两个已有 layer 的融合在这里接线
④ layer module        ← Attention / RMSNorm / Linear / RotaryEmbedding / FusedMoE
                         ★大多数自定义算子【替换或子类化】的就是这一层
⑤ CustomOp 分派       ← vllm/model_executor/custom_op.py，按平台选实现
⑥ Python wrapper      ← vllm/_custom_ops.py（约 3000 行），csrc 符号的 Python 面
⑦ csrc/ kernel        ← 手写 CUDA/C++，通过 torch_bindings.cpp 注册
```

## 2.2 各层职责与「改这里」的信号

| 层 | 职责 | 什么信号说明要改这一层 |
|---|---|---|
| **① Worker/Engine** | 调度与请求生命周期 | 几乎从不为算子改 |
| **② ModelRunner** | 组装输入、CUDA graph 捕获 | 新 attention kernel 需要**不同的 metadata 格式** |
| **③ model 文件** | 由积木拼装计算图 | 新增架构、或融合**跨越两个已有 layer** |
| **④ layer module** | 单一功能的可复用模块 | 换更快的实现（RMSNorm/SwiGLU/RoPE） |
| **⑤ CustomOp** | 按平台分派实现 | 新算子要支持多后端（CUDA/ROCm/CPU/XPU） |
| **⑥/⑦ kernel** | 真正的计算 | 出现全新计算原语 |

## 2.3 底层：一个 kernel 是怎么被接进来的

这是写算子必须知道的完整链路（以 CUDA kernel 为例）：

```
① 在 csrc/ 下写 .cu 实现
        ↓
② 在 csrc/ops.h 声明函数
        ↓
③ 在 csrc/torch_bindings.cpp 用 TORCH_LIBRARY_EXPAND 注册
   （ops.def 声明 schema / ops.impl 绑定实现）
        ↓
④ 在 vllm/_custom_ops.py 加 Python wrapper（调用 torch.ops._C.xxx）
        ↓
⑤ 包成 CustomOp（nn.Module），按平台实现 forward_*
        ↓
⑥ layer module 调用它 → model 文件调用 layer
```

**三个容易漏的点**：

1. **返回 tensor 的算子必须注册 meta function**（`@register_fake`），否则 `torch.compile` 的 shape propagation 会失败——报错信息往往很难懂，容易卡半天。
2. **ROCm 算子注册在 `csrc/rocm/torch_bindings.cpp`（`torch.ops._rocm_C`），CPU 算子在 `csrc/cpu/torch_bindings.cpp`**。只写 CUDA 实现，在 AMD 机器上会直接退化或报错。
3. **新 .cu 文件要加进 CMakeLists.txt**，否则不会被编译。

## 2.4 CustomOp：多后端分派的标准写法

`vllm/model_executor/custom_op.py` 里的 `CustomOp` 是一个 `torch.nn.Module`，它按当前平台选择不同的 `forward_*` 实现。典型模式（以 RMSNorm 为例）：

```python
class RMSNorm(CustomOp):
    def forward_native(self, x, residual=None):
        # 纯 PyTorch 回退实现，任何平台都能跑
        ...
    def forward_cuda(self, x, residual=None):
        if residual is not None:
            return ops.fused_add_rms_norm(x, residual, self.weight, self.eps)
        return ops.rms_norm(x, self.weight, self.eps)
    def forward_rocm(self, x, residual=None):
        return aiter_ops.rms_norm(x, self.weight, self.eps)
```

**这个设计的价值**：

- 上层代码只写 `self.norm(x)`，平台差异被封装掉
- 新平台接入只需加一个 `forward_xxx`
- **纯 PyTorch 的 `forward_native` 是安全网**——新算子在没写 CUDA 时也能跑通（正确性优先于性能）

> ★**另一个关键点**：CustomOp 会用 `torch.library` 注册，这样 `torch.compile` 才能**在 FX 图上 pattern-match 并替换**。如果你绕过 CustomOp 直接调裸 kernel，编译器就看不见它，也就无法参与融合。

## 2.5 已注册算子全景（先查再写）

动手前务必先翻 `vllm/_custom_ops.py`。下面是已注册的主要类别——**你需要的很可能已经在里面了**：

| 类别 | 代表算子 |
|---|---|
| **Paged Attention** | `paged_attention_v1` / `paged_attention_v2` |
| **Attention 合并** | `merge_attn_states`、`convert_vertical_slash_indexes` |
| **激活** | `silu_and_mul`、`gelu_and_mul`、`gelu_tanh_and_mul`、`fatrelu_and_mul` |
| **归一化** | `rms_norm`、**`fused_add_rms_norm`**、`poly_norm` |
| **位置编码** | `rotary_embedding`、`batched_rotary_embedding`（支持多 LoRA） |
| **采样** | `apply_repetition_penalties_` |
| **FP8 量化** | `static_scaled_fp8_quant`、`dynamic_scaled_fp8_quant`、`scaled_fp4_quant` |
| **INT8 量化** | `static_scaled_int8_quant`、`dynamic_scaled_int8_quant` |
| **CUTLASS GEMM** | `cutlass_scaled_mm`、`cutlass_scaled_mm_azp`、`cutlass_moe_mm`、`cutlass_scaled_fp4_mm` |
| **GPTQ** | `gptq_gemm`、`gptq_shuffle`、`gptq_marlin_gemm`、`gptq_marlin_24_gemm` |
| **AWQ** | `awq_gemm`、`awq_dequantize` |
| **Machete** | `machete_mm`、`machete_prepack_B` |
| **GGUF** | `ggml_mul_mat_a8`、`ggml_moe_a8`、`ggml_dequantize` |
| **MoE 辅助** | `get_cutlass_moe_mm_data`、`shuffle_rows` |
| **Mamba / SSM** | **`selective_scan_fwd`** |
| **CPU 专用** | `onednn_scaled_mm`、`mla_decode_kvcache`、`fused_experts_cpu` |

> **注意 `fused_add_rms_norm` 和 `selective_scan_fwd` 这两个**：前者说明"残差加 + 归一化"这个最常见模式**已经有融合算子**；后者说明 SSM 类架构也已有底层支持——如果你要接一个 Mamba 系模型，起点比想象中高得多。

## 2.6 模型加载：权重是怎么对上号的

算子之外，B 档工作量的大头往往是**权重映射**。

vLLM 的模型加载链路：

```
model_loader 按 load_format 选择 loader
  （auto / gguf / bitsandbytes / sharded_state / runai_streamer / tensorizer / dummy）
        ↓
权重下载 → 格式解析（safetensors / pt / gguf / npcache）
        ↓
权重处理（reshape、dtype 转换）
        ↓
张量并行分片（每张卡只加载自己那一份）
        ↓
量化（如指定）
        ↓
按参数名映射到 layer module
```

**权重名对不上时的三种解法**（按代价从低到高）：

| 解法 | 适用 |
|---|---|
| **`--model` 指向已有架构 + 权重名前缀映射** | 只差命名前缀/后缀 |
| **在 model 文件里写 `load_weights` 的重命名逻辑** | 命名规则不同但结构一致 |
| **写一个 stack 或 merge 的权重变换** | 需要把多个权重合并成 vLLM 期望的形状（如把分开的 Q/K/V 合成 fused QKV） |

> 第三类最容易出问题：融合后的权重形状必须和 vLLM 的 `QKVParallelLinear` 期望一致，否则模型能加载但结果全错——**这类错误不报错，只掉效果**，必须用第 8 章的正确性对比流程验证。

## 2.7 改动位置速查表

| 你要做的事 | 改哪一层 | 代价 |
|---|---|---|
| 换一个更快的 RMSNorm 实现 | ④ layer module（**改调用点，不要改每个 model 文件**） | 低（共享 module 一次改动覆盖所有模型） |
| 加 fused bias + gelu | ③ model forward 改成调融合路径 + ④/⑦ 提供 kernel | 中 |
| 加新的 attention kernel | 注册新 AttentionBackend（`vllm/attention/backends/`）+ ② 提供 metadata | 高 |
| 加新的量化方案 | 实现 `LinearMethodBase` 子类 + 注册到 quantization registry | 中（★已有模型通过 `--quantization` 自动生效，无需 per-model 改动） |
| 加一个全新 layer | ③ 直接扩展 model 文件 | 高，留给真正的新架构 |
| 支持新模型但结构同构 | ③ 加一个 model 文件（几十行）+ 权重映射 | 低 |

## 2.8 本章小结

- **链路七层**：Worker/Engine → ModelRunner → model 文件 → layer module → CustomOp → Python wrapper → csrc kernel。
- **自定义算子主要落在 ④（替换/子类化 layer）**；跨 layer 的融合接线在 ③；只有全新原语才下到 ⑦。
- **接 kernel 的五步**：csrc 实现 → ops.h 声明 → torch_bindings 注册 → _custom_ops.py wrapper → CustomOp 包装。三个坑：**meta function（@register_fake）、ROCm/CPU 单独注册、CMakeLists 加文件**。
- **CustomOp 的隐藏价值**：注册进 `torch.library` 后，编译器才能在图上看见并融合它。
- **动手前先查 `_custom_ops.py`**——`fused_add_rms_norm`、`selective_scan_fwd` 这些说明很多"看起来要写"的东西已经有了。

**下一章**展开 A/B 档：什么时候模型**自然就支持**了，以及同构复用到底能省多少事。
