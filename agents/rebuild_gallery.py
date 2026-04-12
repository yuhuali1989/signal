"""重建 Gallery 模型数据，基于 Sebastian Raschka models.yml 的真实图片 URL"""
import json
from pathlib import Path

BASE = "https://sebastianraschka.com/llm-architecture-gallery/images/architectures/"

models = [
  # === 密集模型 ===
  {"id":"gpt-oss-120b","name":"GPT-OSS 120B","org":"OpenAI","type":"dense","typeLabel":"密集模型","typeIcon":"🧱","open":True,"params":"120B","date":"2026-01","context":"200K tokens","attention":"MHA","architectureImage":f"{BASE}gpt-oss-120b.webp","factSheet":{"params":"120B","architecture":"Dense Transformer, Decoder-only","attention":"MHA","context":"200K tokens","license":"Apache 2.0"},"highlights":["OpenAI 首个开源大模型","200K 上下文"]},

  {"id":"llama-3-8b","name":"Llama 3 8B","org":"Meta","type":"dense","typeLabel":"密集模型","typeIcon":"🧱","open":True,"params":"8B / 70B / 405B","date":"2024-04","context":"128K tokens","attention":"GQA (8 KV heads)","architectureImage":f"{BASE}llama-3-8b.webp","factSheet":{"params":"8B (系列: 8B/70B/405B)","architecture":"Dense Transformer","attention":"GQA","context":"128K tokens","layers":"32","hiddenSize":"4096","heads":"32","kvHeads":"8","vocab":"128K tokens","positionalEncoding":"RoPE","normalization":"RMSNorm","activation":"SwiGLU","training":"15T tokens","license":"Llama 3 Community"},"highlights":["GQA 注意力","128K 词表","15T tokens 训练"]},

  {"id":"llama-4-maverick","name":"Llama 4 Maverick 400B","org":"Meta","type":"moe","typeLabel":"MoE 稀疏","typeIcon":"🔀","open":True,"params":"400B MoE","date":"2025-04","context":"1M tokens","attention":"Interleaved Attention","architectureImage":f"{BASE}llama-4-maverick-400b.webp","factSheet":{"params":"400B total","architecture":"MoE Transformer","attention":"Interleaved Global+Local","context":"1M tokens","experts":"128 experts, Top-2","license":"Llama 4 Community"},"highlights":["首个原生 MoE 开源","1M 原生上下文","128 专家"]},

  {"id":"gemma-4-31b","name":"Gemma 4 31B","org":"Google","type":"dense","typeLabel":"密集模型","typeIcon":"🧱","open":True,"params":"31B","date":"2026-04","context":"128K tokens","attention":"MQA","architectureImage":f"{BASE}gemma-4-31b.webp","factSheet":{"params":"31B","architecture":"Dense Transformer","attention":"MQA","context":"128K tokens","vocab":"256K (SentencePiece)","activation":"GeGLU","license":"Apache 2.0"},"highlights":["原生多模态","Apache 2.0","Gemini 同源"]},

  {"id":"gemma-4-26b-a4b","name":"Gemma 4 26B-A4B","org":"Google","type":"moe","typeLabel":"MoE 稀疏","typeIcon":"🔀","open":True,"params":"26B/4B active","date":"2026-04","context":"128K tokens","attention":"MQA","architectureImage":f"{BASE}gemma-4-26b-a4b.webp","factSheet":{"params":"26B/4B active","architecture":"MoE Transformer","attention":"MQA","context":"128K tokens","license":"Apache 2.0"},"highlights":["MoE 高性价比","4B 成本 13B 性能"]},

  {"id":"gemma-3-27b","name":"Gemma 3 27B","org":"Google","type":"dense","typeLabel":"密集模型","typeIcon":"🧱","open":True,"params":"27B","date":"2025-03","context":"128K tokens","attention":"Sliding+Global","architectureImage":f"{BASE}gemma-3-27b.webp","factSheet":{"params":"27B","architecture":"Dense Transformer","attention":"Sliding Window + Global","context":"128K tokens","license":"Gemma License"},"highlights":["混合注意力机制"]},

  {"id":"mistral-small-3-1","name":"Mistral Small 3.1 24B","org":"Mistral AI","type":"dense","typeLabel":"密集模型","typeIcon":"🧱","open":True,"params":"24B","date":"2025-03","context":"128K tokens","attention":"GQA","architectureImage":f"{BASE}mistral-3-1-small-24b.webp","factSheet":{"params":"24B","architecture":"Dense Transformer","attention":"GQA","context":"128K tokens","license":"Apache 2.0"},"highlights":["高性价比","单卡可部署"]},

  {"id":"mistral-small-4","name":"Mistral Small 4","org":"Mistral AI","type":"dense","typeLabel":"密集模型","typeIcon":"🧱","open":True,"params":"未公开","date":"2026-03","context":"128K tokens","attention":"GQA","architectureImage":f"{BASE}mistral-small-4.webp","factSheet":{"params":"未公开","architecture":"Dense Transformer","attention":"GQA","context":"128K tokens","license":"Apache 2.0"},"highlights":["Mistral 最新小模型"]},

  {"id":"olmo-3-7b","name":"OLMo 3 7B","org":"AI2","type":"dense","typeLabel":"密集模型","typeIcon":"🧱","open":True,"params":"7B","date":"2025-08","context":"32K tokens","attention":"GQA","architectureImage":f"{BASE}olmo-3-7b.webp","factSheet":{"params":"7B","architecture":"Dense Transformer","attention":"GQA","context":"32K tokens","license":"Apache 2.0"},"highlights":["完全开放(数据+代码+权重)","学术首选"]},

  {"id":"olmo-3-32b","name":"OLMo 3 32B","org":"AI2","type":"dense","typeLabel":"密集模型","typeIcon":"🧱","open":True,"params":"32B","date":"2025-10","context":"32K tokens","attention":"GQA","architectureImage":f"{BASE}olmo-3-32b.webp","factSheet":{"params":"32B","architecture":"Dense Transformer","attention":"GQA","context":"32K tokens","license":"Apache 2.0"},"highlights":["AI2 旗舰开放模型"]},

  # === MoE 模型 ===
  {"id":"deepseek-v3","name":"DeepSeek-V3","org":"DeepSeek","type":"moe","typeLabel":"MoE 稀疏","typeIcon":"🔀","open":True,"params":"671B/37B active","date":"2024-12","context":"128K tokens","attention":"MLA","architectureImage":f"{BASE}deepseek-v3-r1-671-billion.webp","factSheet":{"params":"671B/37B active","architecture":"MoE Transformer","attention":"MLA (Multi-head Latent Attention)","context":"128K tokens","training":"14.8T tokens, 2048×H800, $5.57M","vocab":"128K","positionalEncoding":"RoPE","normalization":"RMSNorm","activation":"SwiGLU","precision":"FP8 (全程)","experts":"256 细粒度专家+1共享, Top-8","license":"MIT"},"highlights":["MLA 32x KV压缩","FP8 全程训练","$5.57M 极低成本"]},

  {"id":"deepseek-v3-2","name":"DeepSeek V3.2","org":"DeepSeek","type":"moe","typeLabel":"MoE 稀疏","typeIcon":"🔀","open":True,"params":"671B","date":"2025-06","context":"128K tokens","attention":"MLA","architectureImage":f"{BASE}deepseek-v3-2-671b.webp","factSheet":{"params":"671B","architecture":"MoE Transformer","attention":"MLA","context":"128K tokens","license":"MIT"},"highlights":["V3 改进版","推理增强"]},

  {"id":"mistral-large-3","name":"Mistral Large 3","org":"Mistral AI","type":"moe","typeLabel":"MoE 稀疏","typeIcon":"🔀","open":True,"params":"673B MoE","date":"2025-11","context":"128K tokens","attention":"GQA","architectureImage":f"{BASE}mistral-3-large-673-billion.webp","factSheet":{"params":"673B MoE","architecture":"MoE Transformer","attention":"GQA","context":"128K tokens","license":"Apache 2.0"},"highlights":["Mistral 最大模型"]},

  {"id":"qwen3-235b","name":"Qwen3 235B-A22B","org":"阿里","type":"moe","typeLabel":"MoE 稀疏","typeIcon":"🔀","open":True,"params":"235B/22B active","date":"2025-04","context":"128K→1M","attention":"GQA","architectureImage":f"{BASE}qwen3-235b-a22b.webp","factSheet":{"params":"235B/22B active","architecture":"MoE Transformer","attention":"GQA","context":"128K→1M (YaRN)","vocab":"152K tokens","license":"Apache 2.0"},"highlights":["最完整开源家族","152K 大词表","思考/非思考切换"]},

  {"id":"qwen3-32b","name":"Qwen3 32B","org":"阿里","type":"dense","typeLabel":"密集模型","typeIcon":"🧱","open":True,"params":"32B","date":"2025-04","context":"128K tokens","attention":"GQA","architectureImage":f"{BASE}qwen3-32b.webp","factSheet":{"params":"32B","architecture":"Dense Transformer","attention":"GQA","context":"128K tokens","license":"Apache 2.0"},"highlights":["Qwen 旗舰密集模型"]},

  {"id":"qwen3-8b","name":"Qwen3 8B","org":"阿里","type":"dense","typeLabel":"密集模型","typeIcon":"🧱","open":True,"params":"8B","date":"2025-04","context":"128K tokens","attention":"GQA","architectureImage":f"{BASE}qwen3-8b.webp","factSheet":{"params":"8B","architecture":"Dense Transformer","attention":"GQA","context":"128K tokens","license":"Apache 2.0"},"highlights":["轻量高效"]},

  {"id":"glm-5-744b","name":"GLM-5 744B","org":"智谱 AI","type":"moe","typeLabel":"MoE 稀疏","typeIcon":"🔀","open":True,"params":"744B/40B active","date":"2026-04","context":"128K tokens","attention":"MQA","architectureImage":f"{BASE}glm-5-744b.webp","factSheet":{"params":"744B/40B active","architecture":"MoE Transformer","attention":"MQA","context":"128K tokens","license":"MIT"},"highlights":["MIT 开源","SWE-Bench 超越 GPT-5.4"]},

  {"id":"glm-4-5-355b","name":"GLM-4.5 355B","org":"智谱 AI","type":"moe","typeLabel":"MoE 稀疏","typeIcon":"🔀","open":True,"params":"355B","date":"2025-06","context":"128K tokens","attention":"MQA","architectureImage":f"{BASE}glm-4-5-355b.webp","factSheet":{"params":"355B","architecture":"MoE Transformer","attention":"MQA","context":"128K tokens","license":"智谱 License"},"highlights":["智谱旗舰"]},

  {"id":"kimi-k2","name":"Kimi K2 1T","org":"月之暗面","type":"moe","typeLabel":"MoE 稀疏","typeIcon":"🔀","open":True,"params":"1T MoE","date":"2025-07","context":"128K tokens","attention":"MLA-like","architectureImage":f"{BASE}kimi-k2-1-trillion.webp","factSheet":{"params":"1T MoE","architecture":"MoE Transformer","attention":"MLA-like","context":"128K tokens","license":"开源"},"highlights":["万亿参数","MLA 类注意力"]},

  {"id":"minimax-m2","name":"MiniMax M2 230B","org":"MiniMax","type":"moe","typeLabel":"MoE 稀疏","typeIcon":"🔀","open":True,"params":"230B","date":"2025-09","context":"1M tokens","attention":"Lightning Attention","architectureImage":f"{BASE}minimax-m2-230b.webp","factSheet":{"params":"230B","architecture":"MoE + Lightning Attention","context":"1M tokens","license":"MiniMax License"},"highlights":["Lightning Attention","原生 1M 上下文"]},

  {"id":"grok-2-5","name":"Grok 2.5 270B","org":"xAI","type":"moe","typeLabel":"MoE 稀疏","typeIcon":"🔀","open":True,"params":"270B","date":"2025-12","context":"128K tokens","attention":"未公开","architectureImage":f"{BASE}grok-2-5-270b.webp","factSheet":{"params":"270B","architecture":"MoE Transformer","context":"128K tokens","license":"Apache 2.0"},"highlights":["xAI 首个开源"]},

  {"id":"nemotron-3-nano","name":"Nemotron 3 Nano 30B-A3B","org":"NVIDIA","type":"moe","typeLabel":"MoE 稀疏","typeIcon":"🔀","open":True,"params":"30B/3B active","date":"2025-10","context":"128K tokens","attention":"GQA","architectureImage":f"{BASE}nemotron-3-nano-30b-a3b.webp","factSheet":{"params":"30B/3B active","architecture":"MoE Transformer","attention":"GQA","context":"128K tokens","license":"NVIDIA License"},"highlights":["NVIDIA 自研","极小激活参数"]},

  {"id":"arcee-trinity","name":"Arcee Trinity Large 400B","org":"Arcee AI","type":"moe","typeLabel":"MoE 稀疏","typeIcon":"🔀","open":True,"params":"400B","date":"2025-11","context":"128K tokens","attention":"GQA","architectureImage":f"{BASE}arcee-ai-trinity-large-400b.webp","factSheet":{"params":"400B","architecture":"MoE Transformer","attention":"GQA","context":"128K tokens","license":"Apache 2.0"},"highlights":["模型合并技术先驱"]},

  # === 推理模型 ===
  {"id":"deepseek-r1","name":"DeepSeek-R1","org":"DeepSeek","type":"reasoning","typeLabel":"推理模型","typeIcon":"🧠","open":True,"params":"671B MoE","date":"2025-01","context":"128K tokens","attention":"MLA","architectureImage":f"{BASE}deepseek-v3-r1-671-billion.webp","factSheet":{"params":"671B MoE (同V3架构)","architecture":"MoE Transformer + RL","attention":"MLA","context":"128K tokens","training":"纯 RL, 无 SFT","license":"MIT"},"highlights":["纯 RL 涌现思维链","GRPO 方法","MIT 开源"]},

  # === SSM / 线性注意力 ===
  {"id":"xlstm-7b","name":"xLSTM 7B","org":"NXAI","type":"ssm","typeLabel":"SSM/线性","typeIcon":"🌊","open":True,"params":"7B","date":"2024-05","context":"可扩展","attention":"mLSTM (线性)","architectureImage":f"{BASE}xlstm-7b.webp","factSheet":{"params":"7B","architecture":"xLSTM (mLSTM+sLSTM)","attention":"线性注意力 O(N)","context":"理论无限","license":"Apache 2.0"},"highlights":["LSTM 复兴","线性复杂度","无需 KV Cache"]},

  {"id":"kimi-linear","name":"Kimi Linear 48B-A3B","org":"月之暗面","type":"ssm","typeLabel":"SSM/线性","typeIcon":"🌊","open":True,"params":"48B/3B active","date":"2025-11","context":"128K tokens","attention":"线性注意力","architectureImage":f"{BASE}kimi-linear-48b-a3b.webp","factSheet":{"params":"48B/3B active","architecture":"Linear Attention MoE","attention":"线性注意力","context":"128K tokens","license":"开源"},"highlights":["线性注意力+MoE","极低推理成本"]},

  # === 小模型 ===
  {"id":"phi-4","name":"Phi-4","org":"Microsoft","type":"small","typeLabel":"小模型","typeIcon":"🔬","open":True,"params":"14B","date":"2024-12","context":"16K tokens","attention":"Full Attention","architectureImage":f"{BASE}phi-4.webp","factSheet":{"params":"14B","architecture":"Dense Transformer","attention":"Full Attention","context":"16K tokens","layers":"40","hiddenSize":"5120","heads":"40","vocab":"100K","activation":"GELU","training":"合成数据为主 (~50%)","license":"MIT"},"highlights":["合成数据驱动","14B 超越 GPT-4o-mini"]},

  {"id":"smollm3-3b","name":"SmolLM3 3B","org":"HuggingFace","type":"small","typeLabel":"小模型","typeIcon":"🔬","open":True,"params":"3B","date":"2025-12","context":"128K tokens","attention":"GQA","architectureImage":f"{BASE}smollm3-3b.webp","factSheet":{"params":"3B","architecture":"Dense Transformer","attention":"GQA","context":"128K tokens","license":"Apache 2.0"},"highlights":["HuggingFace 自研"]},

  {"id":"llama-3-2-1b","name":"Llama 3.2 1B","org":"Meta","type":"small","typeLabel":"小模型","typeIcon":"🔬","open":True,"params":"1B","date":"2024-09","context":"128K tokens","attention":"GQA","architectureImage":f"{BASE}llama-3-2-1b.webp","factSheet":{"params":"1B","architecture":"Dense Transformer","attention":"GQA","context":"128K tokens","license":"Llama 3.2 Community"},"highlights":["超轻量端侧"]},

  {"id":"qwen3-4b","name":"Qwen3 4B","org":"阿里","type":"small","typeLabel":"小模型","typeIcon":"🔬","open":True,"params":"4B","date":"2025-04","context":"128K tokens","attention":"GQA","architectureImage":f"{BASE}qwen3-4b.webp","factSheet":{"params":"4B","architecture":"Dense Transformer","attention":"GQA","context":"128K tokens","license":"Apache 2.0"},"highlights":["端侧友好"]},
]

Path("content/gallery").mkdir(parents=True, exist_ok=True)
Path("content/gallery/models.json").write_text(json.dumps(models, ensure_ascii=False, indent=2))

from collections import Counter
types = Counter(m["type"] for m in models)
print(f"Total: {len(models)} models")
for t, c in types.most_common():
    print(f"  {t}: {c}")
print(f"With image: {sum(1 for m in models if m.get('architectureImage'))}/{len(models)}")
