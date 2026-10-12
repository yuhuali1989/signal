---
title: "vLLM 算子开发全书 - 第3章: 什么时候「自然就支持」了：同构复用的四条判据"
book: "vLLM 算子开发全书：新增架构何时开刀、何时白嫖，以及算子融合怎么落地"
chapter: "3"
chapterTitle: "什么时候「自然就支持」了：同构复用的四条判据"
description: "给出判断新架构能否零成本复用的四条判据（注意力形态、归一化与激活、权重可映射性、计算图可拼装性），并说明权重名映射、config 兼容与 fused 权重合并三类 B 档改动的写法"
date: "2026-10-12"
updatedAt: "2026-10-12"
agent: "研究员→编辑→审校员"
tags:
  - "vLLM"
  - "算子开发"
  - "模型架构"
  - "推理优化"
  - "权重映射"
type: "book"
---

# 第 3 章 · 什么时候「自然就支持」了

## 3.1 自然支持的本质：落在已有算子的参数空间里

一个架构"不需要开发"的准确含义是：**它的每一层都能用 vLLM 已有的 layer module 表达，且这些 module 的参数组合能覆盖它的配置。**

不是"模型简单"，也不是"和某个模型很像"。判断要落到四条具体判据上。

## 3.2 判据一：注意力形态是否已有后端覆盖

| 已有覆盖 | 说明 |
|---|---|
| **MHA / MQA** | 最早支持，完全覆盖 |
| **GQA** | 通过 `num_key_value_heads` 参数覆盖，绝大多数现代模型 |
| **MLA** | 已有支持（`mla_decode_kvcache` 在 CPU 侧、`cutlass_mla_decode` 在 CUDA 侧） |
| **线性注意力 / SSM** | **`selective_scan_fwd` 已注册**，Mamba 系起点比想象高 |
| ** sliding window / 稀疏** | 部分后端支持（需注意 metadata 差异） |

**判据**：如果新架构的注意力能被上面某一种表达（哪怕要配不同的 `sliding_window`、`num_kv_heads`、`head_dim`），就不需要新 attention kernel。

**反例信号**：
- KV cache 里存的不是标准 K/V，而是压缩后的潜在向量（MLA 曾属此类）
- 注意力需要跨模态的特殊 mask 或位置对齐
- 需要自定义的稀疏 pattern（非 sliding window / 非 block-sparse 已有形式）

## 3.3 判据二：归一化、激活、位置编码是否都在算子清单里

对照第 2 章的算子清单：

| 组件 | 已有算子 | 参数空间 |
|---|---|---|
| 归一化 | `rms_norm` / `fused_add_rms_norm` / `poly_norm` | eps、是否有残差融合 |
| 激活 | `silu_and_mul` / `gelu_and_mul` / `gelu_tanh_and_mul` / `fatrelu_and_mul` | 门控 MLP 的主流形式 |
| 位置编码 | `rotary_embedding` / `batched_rotary_embedding` | 多种 RoPE 变体、支持多 LoRA |

**判据**：如果这三处都能对应上，架构大概率属于 A/B 档。

**常见的"擦边"情形**：
- 归一化位置不同（pre-norm vs post-norm、QKV norm、QK norm）→ 通常只是 **forward 里的调用顺序**变化，属于 B 档，不用写算子
- 有 bias 项（LLaMA 没有，某些模型有）→ 已有 linear 层支持 bias 参数
- 激活是 SwiGLU 的变体 → 若门控乘的组合方式一致，`silu_and_mul` 可直接用

## 3.4 判据三：权重能否映射（这是最常卡住的一关）

即使结构完全同构，**权重名对不上也会加载失败**。三种由轻到重的解法：

### 解法一：前缀映射（最轻）

HF 权重名与 vLLM 期望只差前缀时，直接在 model 文件的权重加载逻辑里做替换：

```python
# 典型模式：把 HF 的命名映射到 vLLM 的 module 结构
def load_weights(self, weights):
    for name, loaded_weight in weights:
        name = self._rename(name)          # 前缀/后缀重写
        param = self._get_param(name)
        if param is not None:
            weight_loader(param, loaded_weight, ...)
```

### 解法二：分开的权重合并成 fused（中等）

vLLM 为了少一次 GEMM，通常期望 **fused QKV**（`qkv_proj`）与 **fused gate/up**（`gate_up_proj`），而 HF 权重常是分开的（`q_proj` / `k_proj` / `v_proj`）。

这时需要做 stack/merge 变换：

```python
# 伪代码：把 q/k/v 合并成一个 qkv
if "q_proj" in name:
    shard_id = 0
elif "k_proj" in name:
    shard_id = 1
elif "v_proj" in name:
    shard_id = 2
param = self.qkv_proj.weight
weight_loader(param, loaded_weight, shard_id)   # 按 shard 写入对应切片
```

> ⚠️ **这一类最容易出错**：融合后权重的**排列顺序**必须与 vLLM 的切分假设一致。顺序错了模型能正常加载、能出 token，但**结果是错的**。这是"不报错只掉效果"的典型，必须用第 8 章的输出对比验证。

### 解法三：自定义 loader（最重）

只有格式本身特殊（非 safetensors/pt/gguf）时才需要。vLLM 支持运行时注册：

```python
@register_model_loader("my_format")
class MyLoader(BaseModelLoader): ...
```

## 3.5 判据四：计算图能否用已有积木拼装

最后一条：即使所有零件都有，**拼装方式**也必须能用 `nn.Module` 的 forward 表达。

能拼装的情况（B 档，写 model 文件即可）：
- 层数、维度不同
- 归一化位置不同
- 残差连接方式不同
- 额外的 token 混合层，只要它由已有算子组成

不能拼装、需要扩展的情况：
- 层间有**控制信号**（如动态路由决定跳过哪些层）
- 需要跨层共享状态（非 KV cache 的额外缓存）
- forward 里有依赖 batch 内容的动态控制流（会破坏 CUDA graph 捕获，见第 7 章）

## 3.6 一个典型 B 档实战：接一个新 dense 模型

把上面的判据串起来，接一个新 dense decoder 模型的标准动作：

```
① 找到结构最接近的已有 model 文件（如 llama.py）作为模板
② 对比 config：num_heads / num_kv_heads / head_dim / hidden_size / 
   intermediate_size / rope 参数 / norm eps / 是否有 bias
③ 写 model 文件：
   - 用 QKVParallelLinear / MergedColumnParallelLinear（gate_up） / RowParallelLinear
   - Attention 用已有 Attention module，传入正确的 num_kv_heads 等参数
   - RMSNorm 用已有 module
④ 写 load_weights：处理命名映射与 qkv / gate_up 的融合
⑤ 正确性验证：与 HF transformers 逐 token 对比（第 8 章）
⑥ 性能验证：profile 看是否有意外掉速
```

**全程 0 行 CUDA。** 这就是为什么 vLLM 的"新模型支持"PR 常常只有一两百行 Python。

## 3.7 一个容易忽略的收益：量化自动生效

如果你的模型走标准 layer module，那么**所有已有量化方案会自动可用**：

| 量化 | 状态 |
|---|---|
| FP8 | `static_scaled_fp8_quant` / `dynamic_scaled_fp8_quant` / CUTLASS `cutlass_scaled_mm` |
| INT8 W8A8 | `static/dynamic_scaled_int8_quant` |
| GPTQ | `gptq_marlin_gemm` / `gptq_marlin_24_gemm` |
| AWQ | `awq_gemm` / `awq_dequantize` |
| NVFP4 | `scaled_fp4_quant` / `cutlass_scaled_fp4_mm` |
| GGUF | `ggml_mul_mat_a8` 等 |
| Compressed Tensors | W8A8 / W4A16 等 |

原因是量化被抽象成 `LinearMethodBase`：模型层只调用 `QuantizedLinearMethod` 的接口，**具体用哪个 kernel 由 `--quantization` 参数决定**。

> ★**这是走标准 layer 的另一大收益**：自定义 kernel 往往只写了 FP16 路径，量化要另做一遍；而复用标准层，量化支持是白送的。反过来，**如果你为了性能自己写了算子，就要自己负责它的量化版本**——这是"要不要自己写 kernel"时最容易被低估的隐性成本。

## 3.8 本章小结

- **四条判据**：注意力形态 / 归一化激活位置编码 / 权重可映射 / 计算图可拼装。四条全过 = A 档，卡在权重或拼装 = B 档，卡在注意力或原语 = C 档。
- **权重映射三解法**：前缀映射 → fused 权重合并（qkv / gate_up）→ 自定义 loader。
- ⚠️**fused 权重合并的顺序错误不报错、只掉效果**——必须做输出对比。
- ★**复用标准 layer 的最大隐性收益是量化自动生效**；自写 kernel 意味着自付量化版本的成本。

**下一章**反过来讲：命中 C 档时，六类必须开发的情形分别该怎么动手。
