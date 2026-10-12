---
title: "vLLM 算子开发全书 - 第4章: 必须开刀的六类情形：从新注意力到新多模态"
book: "vLLM 算子开发全书：新增架构何时开刀、何时白嫖，以及算子融合怎么落地"
chapter: "4"
chapterTitle: "必须开刀的六类情形：从新注意力到新多模态"
description: "逐类拆解六种必须开发算子的情形：全新注意力机制、新归一化激活、新 MoE 形态、新位置编码、多模态融合新方式、全新计算原语，各给出改动手位与省力替代方案"
date: "2026-10-12"
updatedAt: "2026-10-12"
agent: "研究员→编辑→审校员"
tags:
  - "vLLM"
  - "算子开发"
  - "注意力机制"
  - "MoE"
  - "多模态"
  - "GPU 内核"
type: "book"
---

# 第 4 章 · 必须开刀的六类情形

## 4.1 情形一：全新注意力机制（最常见、最重）

**为什么躲不掉**：注意力是唯一与 **KV cache 的物理布局**紧耦合的部分。PagedAttention 的 kernel 假设 cache 是 `[num_blocks, block_size, num_kv_heads, head_dim]` 的分页结构，并通过 `slot_mapping` 做 gather/scatter。任何改变"cache 里存什么"的机制，既有 kernel 都用不上。

| 机制 | 现状 |
|---|---|
| MHA / MQA / GQA | 已覆盖，无需开发 |
| **MLA**（多头潜在注意力） | 已有支持：`cutlass_mla_decode`（CUDA）、`mla_decode_kvcache`（CPU） |
| **线性注意力** | 属于 C 档，需新 kernel |
| **SSM / Mamba** | `selective_scan_fwd` 已注册；新变体可能仍需扩展 |
| 自定义稀疏 pattern | 若非已有 sliding window / block-sparse 形式，需新 kernel |

**改动手位**：

```
① 子类化并注册新的 AttentionBackend（vllm/attention/backends/）
② backend 必须产出 kernel 需要的 metadata：
   block tables / slot mappings / 序列长度
③ 若 metadata 格式与现有不同，ModelRunner 层也要改（第 2 章链路②）
④ kernel 实现：
   - CUDA：csrc/attention/ 下（参考 paged_attention_v1 / v2）
   - 或 Triton：vllm/attention/ops/ 下
     （已有 triton_flash_attention.py / prefix_prefill.py / triton_unified_attention.py）
```

**省力方案**：先检查新机制能否**归约**到已有形式。例如某些线性注意力在解码阶段可以写成递归形式——这时未必需要新的 attention backend，可能只需一个状态更新算子。

## 4.2 情形二：新的归一化 / 激活

**常见度**：中等。往往是新架构带来的小改动的累积。

**改动手位**：

```
① kernel 写在 csrc/（CUDA）或 vllm/.../ops/（Triton）
② 替换 layer module 里的调用点——★不要改每个 model 文件
③ 因为 layer module 是共享的，一处改动覆盖所有模型
```

**现成的融合启示**：注意算子清单里的 `fused_add_rms_norm`——它把**残差加 + 归一化**合成一个 kernel。这提示了一件事：

> 当你需要一个新的 norm 变体时，**顺便考虑它与残差加的融合版本**。Transformer 里这两个操作永远相邻，融合掉一次 kernel launch 与一次显存往返是白捡的收益。

**省力方案**：如果新 norm 只是公式微调，先试 `forward_native`（纯 PyTorch）跑通；再试 torch.compile 能否自动融合；最后才写 Triton。

## 4.3 情形三：新的 MoE 形态

MoE 的复杂度集中在 **dispatch 与聚合**，而不是专家计算本身。

| 已有覆盖 | 算子 |
|---|---|
| 标准 MoE GEMM | `cutlass_moe_mm`、`cutlass_scaled_mm_azp` |
| MoE 数据准备 | `get_cutlass_moe_mm_data`、`shuffle_rows` |
| GGUF MoE | `ggml_moe_a8` |
| CPU MoE | `fused_experts_cpu` |

**需要动手的信号**：
- 路由方式不同（不是 top-k，或需要自定义 gate 归一化）
- 专家分组/共享专家的结构与 `FusedMoE` 假设不符
- 需要专家级并行（EP）与 TP 的混合策略

**改动手位**：扩展/替换 `FusedMoE`，或实现新的 `FusedMoEMethodBase`（量化路径）。

**编译器的帮助**：vLLM 的编译 pass 里有 **MoE fusion——在可能的情况下合并 router + dispatch + experts**。所以先让编译器试一遍，再决定手写。

## 4.4 情形四：新的位置编码

**已有**：`rotary_embedding`、`batched_rotary_embedding`（支持多 LoRA）。

**需要动手的场景**：
- 非 RoPE 的编码方式
- 跨模态的位置对齐（文本 token 与图像/视频 token 的位置语义不同）
- 与 QK norm 耦合的定制编码

**★一个重要的省力点**：vLLM 已有 **`qk_norm_rope_fusion`（QK norm + RoPE → 1 kernel）** 这个融合 pass。也就是说，如果你的新位置编码是"QK norm 之后接 RoPE"，编译器很可能已经处理了融合，你只需要正确暴露底层原语。

## 4.5 情形五：多模态融合的新方式（最隐蔽）

这是**最容易被误判为"已经支持"**的一类。多模态模型往往能跑起来，但性能远低于预期，问题就出在这里。

**根因**：注意力 metadata 的语义变了。

```
纯文本 batch：每个请求一段连续 token
多模态 batch：一个请求里混合了文本 token 与 N 个图像 patch token
             → 位置编码、注意力 mask、chunk 边界的语义都变了
             → 若 metadata（cu_seqlens_q / seq_lens / block table）表达不对
                不报错，但结果或性能不对
```

**已有参考实现**：
- `vllm/attention/ops/prefix_prefill.py`：prefix 场景（query 同时关注缓存上下文与新 token），用两阶段循环处理
- `merge_attn_states`、`convert_vertical_slash_indexes`：attention 状态合并

**改动手位**：
1. 确认视觉 token 如何参与位置编码与 attention mask
2. 确认 chunked prefill 下视觉 token 不被拆到不同 chunk（或显式处理跨 chunk）
3. 若需要新的融合方式，在 model 文件里接线（多模态融合通常跨两个已有 layer）

**一个必查项**：多模态的**视觉 encoder 输出缓存**（vLLM 已有 encoder-output caching）。一图多问的场景下，这个缓存的收益远大于任何 kernel 优化——**先确认开了，再谈算子**。

## 4.6 情形六：全新计算原语

兜底类别：自定义稀疏、自定义量化格式、全新的算子类型。

**改动手位**：完整走第 2 章的五步（csrc → ops.h → torch_bindings → _custom_ops.py → CustomOp）。

**决策顺序**（务必按此顺序，能省大量工作）：

```
① torch 原语组合 → 跑通正确性
② 让 torch.compile 融合 → 看是否自动优化
③ Triton kernel → 跨平台、迭代快
④ CUDA kernel → 只在有证据表明 Triton 不够时才写
⑤ 融合版本 → 与相邻算子合并（第 6 章）
```

## 4.7 六类情形对照总表

| 情形 | 改动手位 | 省力替代 | 优先级建议 |
|---|---|---|---|
| **新注意力** | AttentionBackend + metadata（可能波及 ModelRunner） | 尝试归约到已有形式 | 高（最重） |
| **新归一化/激活** | kernel + 改 layer module 调用点 | forward_native → compile → Triton | 中 |
| **新 MoE** | 扩展 FusedMoE / FusedMoEMethodBase | 先看编译器 MoE fusion | 中 |
| **新位置编码** | kernel 或 compile pass | qk_norm_rope_fusion 可能已覆盖 | 低 |
| **多模态融合** | model 文件接线 + metadata 语义 | ★先开 encoder-output caching | 中（隐蔽） |
| **全新原语** | 完整五步 | torch → compile → Triton → CUDA | 视情况 |

## 4.8 一个贯穿的判断：先问「这是不是性能问题」

最后一类常见误判：**以为需要算子，其实是配置问题**。

遇到"新模型跑得慢"，按这个顺序排查：

```
① 是否走了标准 layer？（自写 forward 可能绕开了融合）
② 量化是否生效？（--quantization 参数）
③ torch.compile 是否开启、缓存是否命中？（enforce_eager 会关掉全部编译优化）
④ CUDA graph 是否正常捕获？（动态 shape 会导致回退）
⑤ 注意力后端是否选对？（平台/ dtype / 序列长度会自动选择，但可能选到次优）
⑥ batch 是否足够大？（算子写得再好，batch=1 也吃不满 GPU）
⑦ 多模态是否开了 encoder-output caching
⑧ 最后才考虑写算子
```

> 经验判断：**90% 的"需要写算子"最后发现是配置或 metadata 问题。** 走完这份清单再动手，能省掉大量无效开发。

## 4.9 本章小结

- 六类 C 档情形：**新注意力**（最重，耦合 KV cache 布局）、**新归一化/激活**（改 layer 调用点即可覆盖所有模型）、**新 MoE**（dispatch/聚合）、**新位置编码**（可能已被 qk_norm_rope_fusion 覆盖）、**多模态融合**（最隐蔽，先查 encoder caching）、**全新原语**。
- 决策顺序固定：**torch 组合 → 编译器融合 → Triton → CUDA → 融合版本**。
- ★**遇到性能问题先走八项排查清单**，90% 的情况不是算子问题。

**下一章**讲具体怎么写：CUDA、Triton、torch.compile、CustomOp 四条路的取舍与实操。
