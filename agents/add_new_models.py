"""给 Gallery 添加新模型类型 + tags"""
import json
from pathlib import Path

fp = Path(__file__).parent.parent / 'content' / 'gallery' / 'models.json'
models = json.loads(fp.read_text())

# 1. 给现有模型加 tags
TAG_MAP = {
    'dense': ['Transformer','Dense','Decoder-Only'],
    'moe': ['Transformer','MoE','Decoder-Only'],
    'ssm': ['SSM','线性复杂度'],
    'reasoning': ['推理','强化学习','MoE'],
    'small': ['小模型','端侧部署'],
}
for m in models:
    base = TAG_MAP.get(m['type'], [])
    n = m['name'].lower()
    extra = []
    if 'deepseek' in n: extra.append('DeepSeek')
    if 'llama' in n: extra.append('Meta')
    if 'qwen' in n: extra.append('阿里')
    if 'gemma' in n or 'gemini' in n: extra.append('Google')
    if 'mistral' in n or 'mixtral' in n: extra.append('Mistral')
    if 'phi' in n: extra.append('Microsoft')
    if 'claude' in n: extra.append('Anthropic')
    if 'glm' in n: extra.append('智谱')
    if 'kimi' in n: extra.append('月之暗面')
    if 'mamba' in n or 'xlstm' in n: extra.append('非Transformer')
    m['tags'] = list(dict.fromkeys(base + extra))

# 2. 新增模型
NEW = [
  {"id":"gpt4o-mm","name":"GPT-4o (多模态)","org":"OpenAI","type":"multimodal","params":"未公开","context":"128K","date":"2024-05","attention":"未公开","description":"原生六模态统一端到端训练","highlights":["首个原生全模态","320ms语音响应"],"tags":["多模态","Transformer","OpenAI","闭源"],"factSheet":{"params":"未公开","architecture":"统一 Transformer","attention":"推测 GQA","context":"128K","vocab":"200K","license":"闭源"},"textArch":"┌─────────────────────────────────┐\n│  GPT-4o — 原生六模态 Transformer │\n├─────────────────────────────────┤\n│ ┌────┐ ┌─────┐ ┌─────┐ ┌─────┐ │\n│ │Text│ │Image│ │Audio│ │Video│ │\n│ └──┬─┘ └──┬──┘ └──┬──┘ └──┬──┘ │\n│    └───┬──┴───┬───┘       │    │\n│        ↓      ↓           ↓    │\n│   ┌─────────────────────────┐  │\n│   │ 统一 Embedding 空间      │  │\n│   └───────────┬─────────────┘  │\n│               ↓                │\n│  ╔═════════════════════════╗   │\n│  ║ Transformer Decoder     ║   │\n│  ║ (推测 GQA, 128K ctx)    ║   │\n│  ║ MHA → FFN (SwiGLU)      ║   │\n│  ╚═══════════╤═════════════╝   │\n│              ↓                 │\n│  ┌───────┐ ┌────────┐          │\n│  │Text出力│ │Audio出力│          │\n│  └───────┘ └────────┘          │\n└─────────────────────────────────┘"},
  {"id":"llava-next","name":"LLaVA-NeXT 34B","org":"UW / MSRA","type":"multimodal","params":"34B","context":"32K","date":"2024-01","attention":"GQA","description":"开源视觉-语言模型，动态高分辨率","highlights":["开源最强视觉理解","AnyRes动态分辨率"],"tags":["多模态","开源","视觉理解","Transformer"],"factSheet":{"params":"34B","architecture":"CLIP ViT-L + Yi-34B","attention":"GQA","context":"32K","resolution":"AnyRes 5tiles","license":"Apache 2.0"},"textArch":"┌───────────────────────────────┐\n│ LLaVA-NeXT 34B — 双塔 VLM     │\n├───────────────────────────────┤\n│ ┌──────┐    ┌──────────┐      │\n│ │ Image │    │ Text     │      │\n│ └──┬───┘    └────┬─────┘      │\n│    ↓             ↓             │\n│ ┌──────────┐ ┌──────────┐     │\n│ │CLIP ViT-L│ │ Tokenizer│     │\n│ │14×14 ptch│ │ (64K)    │     │\n│ └────┬─────┘ └────┬─────┘     │\n│      ↓            │           │\n│ ┌──────────┐      │           │\n│ │ AnyRes   │      │           │\n│ │ (5 tiles)│      │           │\n│ └────┬─────┘      │           │\n│      ↓            │           │\n│ ┌──────────┐      │           │\n│ │MLP 投影层 │      │           │\n│ └────┬─────┘      │           │\n│      └──────┬─────┘           │\n│             ↓                  │\n│ ╔═══════════════════════╗     │\n│ ║ Yi-34B LLM × 60L     ║     │\n│ ║ GQA + RMSNorm + SwiGLU║     │\n│ ╚══════════╤════════════╝     │\n│            ↓                   │\n│       LM Head → Text          │\n└───────────────────────────────┘"},
  {"id":"sora","name":"Sora","org":"OpenAI","type":"video","params":"未公开 (3B+)","context":"≤1min 1080p","date":"2024-02","attention":"3D Full Attention","description":"文本→视频 DiT，时空 Patch，支持 1 分钟 1080p","highlights":["首个长视频生成","时空Patch统一","物理世界理解"],"tags":["视频生成","DiT","扩散模型","OpenAI","闭源"],"factSheet":{"params":"未公开","architecture":"DiT","attention":"3D Full (时空)","context":"≤1min 1080p","scheduler":"Flow Matching","license":"闭源"},"textArch":"┌──────────────────────────────────┐\n│ Sora — DiT (Diffusion Transformer)│\n├──────────────────────────────────┤\n│ Text: \"A cat on Mars...\"          │\n│      ↓                            │\n│ ┌────────────┐                    │\n│ │ CLIP/T5    │                    │\n│ │ Text Enc.  │                    │\n│ └─────┬──────┘                    │\n│       ↓ Cross-Attn               │\n│                                   │\n│ ┌────────────────────────────┐   │\n│ │ 视频 VAE Encoder            │   │\n│ │ 帧→潜在 → 时空Patch化       │   │\n│ │ [T×H×W] → [N patches]      │   │\n│ └───────────┬────────────────┘   │\n│             ↓ + Noise (t)        │\n│ ╔════════════════════════════╗   │\n│ ║ DiT Block × ?L            ║   │\n│ ║ ┌────────────────────────┐║   │\n│ ║ │ AdaLN-Zero (t, text)   │║   │\n│ ║ │ 3D Self-Attention      │║   │\n│ ║ │ (空间+时间联合)          │║   │\n│ ║ │ Cross-Attn (text)      │║   │\n│ ║ │ FFN (GELU)             │║   │\n│ ║ └────────────────────────┘║   │\n│ ╚═══════════╤════════════════╝   │\n│             ↓                    │\n│ ┌────────────────────────┐       │\n│ │ VAE Decoder → 视频帧   │       │\n│ │ ≤1min 1080p 可变时长    │       │\n│ └────────────────────────┘       │\n└──────────────────────────────────┘"},
  {"id":"cogvideox","name":"CogVideoX 5B","org":"智谱 AI","type":"video","params":"5B","context":"6s 720p","date":"2024-08","attention":"3D Full Attention","description":"开源视频生成，3D 因果 VAE + Expert Transformer","highlights":["开源最强视频生成","3D因果VAE"],"tags":["视频生成","DiT","开源","智谱","3D VAE"],"factSheet":{"params":"5B","architecture":"Expert Transformer + 3D Causal VAE","attention":"3D Full","context":"6s 720p","patchSize":"4×8×8","license":"Apache 2.0"},"textArch":"┌───────────────────────────────┐\n│ CogVideoX 5B — 开源视频生成    │\n├───────────────────────────────┤\n│ Text: \"一只猫在火星...\"          │\n│      ↓                         │\n│ ┌─────────┐                    │\n│ │ T5-XXL  │                    │\n│ └────┬────┘                    │\n│      ↓                         │\n│ ┌──────────────────────────┐  │\n│ │ 3D Causal VAE            │  │\n│ │ 帧→潜在 (4×8×8 压缩)     │  │\n│ │ 因果卷积保持时序一致       │  │\n│ └───────────┬──────────────┘  │\n│             ↓ + Noise         │\n│ ╔══════════════════════════╗  │\n│ ║ Expert Transformer × 30L ║  │\n│ ║ AdaLN + 3D Self-Attn    ║  │\n│ ║ + Expert FFN             ║  │\n│ ╚═══════════╤══════════════╝  │\n│             ↓                  │\n│  VAE Decoder → 49帧 720p      │\n└───────────────────────────────┘"},
  {"id":"uniad","name":"UniAD","org":"上海AI实验室","type":"autonomous","params":"~50M","context":"多帧BEV","date":"2023-03","attention":"Deformable + Cross","description":"统一自动驾驶：感知→预测→规划端到端，CVPR 2023 Best Paper","highlights":["CVPR 2023 Best Paper","感知-预测-规划统一","Query-based全栈"],"tags":["自动驾驶","端到端","BEV","感知","规划","开源"],"factSheet":{"params":"~50M (不含Backbone)","architecture":"统一 Query Transformer","backbone":"ResNet-101","BEV":"200×200, 0.5m","tasks":"检测+跟踪+建图+预测+规划","license":"Apache 2.0"},"textArch":"┌────────────────────────────────────┐\n│ UniAD — 统一自动驾驶 (CVPR Best)    │\n├────────────────────────────────────┤\n│ 6 Cameras (多帧)                    │\n│      ↓                              │\n│ ┌────────────┐                      │\n│ │ ResNet+FPN │                      │\n│ └─────┬──────┘                      │\n│       ↓                             │\n│ ┌────────────────────┐              │\n│ │ BEV Encoder (LSS)  │              │\n│ │ 图像→200×200 BEV    │              │\n│ └────────┬───────────┘              │\n│          ↓                           │\n│ ┌─ TrackFormer ──────────────┐      │\n│ │ 检测Query→3D BBox + 跟踪   │      │\n│ └─────────┬──────────────────┘      │\n│           ↓                          │\n│ ┌─ MapFormer ────────────────┐      │\n│ │ 地图Query→车道线/人行道     │      │\n│ └─────────┬──────────────────┘      │\n│           ↓                          │\n│ ┌─ MotionFormer ─────────────┐      │\n│ │ Agent×Map→未来轨迹 (6 modes)│      │\n│ └─────────┬──────────────────┘      │\n│           ↓                          │\n│ ┌─ Planner ──────────────────┐      │\n│ │ GRU + 占用网格碰撞检查      │      │\n│ │ → 未来 3s 规划轨迹          │      │\n│ └────────────────────────────┘      │\n└────────────────────────────────────┘"},
  {"id":"driveworld-vla","name":"DriveWorld-VLA","org":"多机构","type":"autonomous","params":"~7B","context":"多帧多相机","date":"2026-02","attention":"Cross+Causal","description":"VLA+世界模型统一，特征级可控想象，碰撞率-36%","highlights":["VLA+世界模型","特征级想象","碰撞率-36%"],"tags":["自动驾驶","VLA","世界模型","端到端","开源"],"factSheet":{"params":"~7B","architecture":"VLA + Latent World Model","attention":"Cross+Causal","tasks":"感知+预测+想象+规划","training":"nuScenes","license":"开源"},"textArch":"┌──────────────────────────────────┐\n│ DriveWorld-VLA — VLA+世界模型     │\n├──────────────────────────────────┤\n│ 6 Cameras + 导航指令              │\n│ ┌────────┐  ┌──────────────┐     │\n│ │ Images │  │ \"Turn left\"  │     │\n│ └───┬────┘  └──────┬───────┘     │\n│     ↓              ↓              │\n│ ┌────────┐  ┌────────────┐       │\n│ │ViT Enc│  │LLM Tokenize│       │\n│ └───┬────┘  └──────┬─────┘       │\n│     └───────┬──────┘             │\n│             ↓                     │\n│ ╔══════════════════════════╗     │\n│ ║ VLA Backbone             ║     │\n│ ║ (视觉-语言 Cross-Attn)    ║     │\n│ ╚═══════════╤══════════════╝     │\n│             ↓                     │\n│ ┌─ World Model ──────────────┐  │\n│ │ 潜在空间「想象」未来 N 步    │  │\n│ │ (特征级, 不生成像素)        │  │\n│ └────────────┬───────────────┘  │\n│              ↓                   │\n│ ┌─ Action Decoder ───────────┐  │\n│ │ Causal Transformer          │  │\n│ │ → (x,y,θ) 碰撞率 -36%      │  │\n│ └────────────────────────────┘  │\n└──────────────────────────────────┘"}
]

models.extend(NEW)
fp.write_text(json.dumps(models, ensure_ascii=False, indent=2))

from collections import Counter
types = Counter(m.get('type') for m in models)
tags_all = set()
for m in models:
    tags_all.update(m.get('tags', []))
print(f'Total: {len(models)}')
print(f'Types: {dict(types)}')
print(f'Tags: {len(tags_all)}')
