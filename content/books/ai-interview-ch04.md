---
title: "AI 概念面试题 120 道 - 第4章: Audio 音频与语音篇"
book: "AI 概念面试题 120 道"
chapter: "4"
chapterTitle: "Audio 音频与语音篇"
description: "对标 aioffer Audio 分类：音频去噪、Audio Tokenizer、Voice Activity Detection、ASR（Whisper）、TTS（Neural Codec）、Speaker Diarization、Real-Time Voice Chat、Audio LLM 等 10 道高频题，含难度标注"
date: "2026-04-13"
updatedAt: "2026-04-13"
agent: "研究员→编辑→审校员"
tags:
  - "面试"
  - "Audio"
  - "语音识别"
  - "TTS"
  - "ASR"
  - "音频处理"
type: "book"
---

# 第 4 章：Audio 音频与语音篇

> 选自《AI 概念面试题 120 道》· 对标 aioffer.com Audio 分类题库

每题标注难度：🟢 Easy · 🟡 Medium · 🔴 Hard

---

## Q77. 什么是 Meeting Assistant - Audio Denoising（音频去噪）？ 🟡 Medium

**音频去噪**：从含噪音频中分离出干净的语音信号。

**传统方法**：
- **谱减法**：估计噪声谱，从含噪谱中减去
- **维纳滤波**：基于信噪比的最优线性滤波
- **局限**：只能处理平稳噪声，对非平稳噪声（人声、音乐）效果差

**深度学习方法**：

| 方法 | 原理 | 代表模型 |
|------|------|---------|
| 频域掩码 | 预测时频掩码，过滤噪声 | SEGAN、DCCRN |
| 波形域 | 直接在波形上操作 | Wave-U-Net、DEMUCS |
| 扩散模型 | 用 Diffusion 去噪 | DiffuSE |

**会议场景特殊挑战**：
- 多人同时说话（鸡尾酒会问题）
- 回声消除（扬声器声音被麦克风拾取）
- 远场拾音（麦克风距离说话人较远）

**评测指标**：PESQ（感知语音质量）、STOI（短时客观可懂度）、SI-SNR（尺度不变信噪比）

---

## Q78. 什么是 Audio Tokenizer？如何将音频离散化？ 🔴 Hard

**为什么需要 Audio Tokenizer**：将连续的音频波形转化为离散 token，才能用语言模型处理音频。

**主要方法**：

**EnCodec（Meta）**：
- 用 VQ-VAE（向量量化变分自编码器）将音频编码为离散 token
- 残差向量量化（RVQ）：多层量化，每层量化上一层的残差
- 24kHz 音频 → 75 token/秒（每个 token 来自 8 个码本）

**SoundStream（Google）**：
- 类似 EnCodec，用 RVQ 进行神经音频编解码
- 支持可变比特率（通过使用不同数量的 RVQ 层）

**Semantic Token vs Acoustic Token**：
- **Acoustic Token**（EnCodec/SoundStream）：保留音色、音调等声学细节，适合 TTS
- **Semantic Token**（HuBERT/W2V-BERT）：保留语义内容，适合 ASR

**Audio LLM 的 Token 设计**：
```
音频 → Acoustic Encoder → Acoustic Token（声学细节）
     → Semantic Encoder → Semantic Token（语义内容）
→ 两种 token 结合 → LLM 处理
```

---

## Q79. 什么是 Voice Activity Detection（VAD）？ 🟢 Easy

**VAD（语音活动检测）**：检测音频流中哪些时间段有人说话，哪些是静音/噪声。

**为什么重要**：
- ASR 系统只需要处理有语音的片段，减少计算量
- 实时通话中，静音期间不传输数据（节省带宽）
- 说话人分离（Speaker Diarization）的前置步骤

**方法**：

| 方法 | 原理 | 特点 |
|------|------|------|
| 能量阈值 | 音频能量超过阈值则为语音 | 简单，对噪声敏感 |
| 传统 ML | MFCC + SVM/GMM | 鲁棒性好 |
| 深度学习 | LSTM/Transformer 分类 | 精度高 |
| Silero VAD | 轻量 LSTM，实时 | 工业界常用 |
| WebRTC VAD | Google 开源，C 实现 | 嵌入式设备 |

**评测指标**：
- **Miss Rate**：漏检率（将语音判为静音）
- **False Alarm Rate**：虚警率（将噪声判为语音）
- **Detection Error Tradeoff（DET）曲线**：Miss Rate vs False Alarm Rate

---

## Q80. 什么是 Meeting Transcription Service - ASR？Whisper 的原理是什么？ 🟡 Medium

**ASR（自动语音识别）**：将语音转化为文字。

**Whisper（OpenAI）**：
- 大规模弱监督预训练（68 万小时多语言音频）
- Encoder-Decoder Transformer 架构
- 输入：30 秒音频片段的 Mel 频谱图（80 维，3000 帧）
- 输出：文字 token 序列

**Whisper 的多任务能力**：
```
特殊 token 控制任务：
<|transcribe|>  → 语音识别（同语言）
<|translate|>   → 语音翻译（翻译为英语）
<|zh|>          → 指定语言（中文）
<|notimestamps|> → 不输出时间戳
```

**会议转录的工程挑战**：
- **长音频处理**：Whisper 只支持 30 秒，需要分段处理（VAD 分段）
- **说话人区分**：Whisper 不区分说话人，需要结合 Speaker Diarization
- **实时性**：流式 ASR 需要在说话过程中实时输出文字

**评测指标**：WER（词错误率）= (插入 + 删除 + 替换) / 总词数

---

## Q81. 什么是 Real-Time Voice Chat Application？ 🟡 Medium

**实时语音对话系统架构**：

```
用户说话 → VAD（检测说话结束）
         → ASR（语音转文字）
         → LLM（生成回复文字）
         → TTS（文字转语音）
         → 播放给用户
```

**延迟分解**：
| 阶段 | 典型延迟 | 优化方向 |
|------|---------|---------|
| VAD | < 100ms | 端点检测算法 |
| ASR | 200-500ms | 流式 ASR |
| LLM | 500ms-2s | 流式生成 + 小模型 |
| TTS | 100-300ms | 流式 TTS |
| 总计 | 1-3s | 端到端优化 |

**流式处理**：
- **流式 ASR**：边说边识别，不等说完再处理
- **流式 LLM**：边生成边输出 token
- **流式 TTS**：收到第一句话就开始合成，不等全部文字

**端到端语音 LLM（GPT-4o 原生音频）**：
- 直接处理音频 token，无需 ASR/TTS 中间步骤
- 延迟更低（< 500ms），能感知情绪和语调
- 代表：GPT-4o、Moshi（Kyutai）

---

## Q82. 什么是 Audio LLM：Tokenization、Data 和 Training？ 🟡 Medium

**Audio LLM 的三个核心问题**：

**1. Tokenization（音频离散化）**：
- 语义 token（HuBERT）：捕捉语义内容，适合理解任务
- 声学 token（EnCodec）：捕捉声学细节，适合生成任务
- 混合方案：先用语义 token 生成内容，再用声学 token 合成音频

**2. Data（训练数据）**：
- 语音识别数据（音频-文字对）：LibriSpeech、Common Voice
- 语音合成数据（文字-音频对）：LJSpeech、VCTK
- 音频描述数据（音频-文字描述）：AudioCaps、WavCaps
- 多轮语音对话数据：稀缺，通常需要合成

**3. Training（训练策略）**：
```
阶段1：预训练（大规模音频数据，自监督）
阶段2：多模态对齐（音频-文字配对数据）
阶段3：指令微调（语音指令-回答对）
阶段4：RLHF（人类偏好对齐）
```

**代表模型**：Qwen-Audio、SALMONN、WavLLM、Gemini（原生多模态）

---

## Q83. 什么是 Speaker Diarization at Scale（说话人分离）？ 🔴 Hard

**Speaker Diarization**：解决"谁在什么时候说话"的问题，将音频分割并标注每段的说话人。

**流程**：
```
音频 → VAD（去除静音）
     → 分段（将音频切成短片段）
     → 说话人嵌入（提取每段的说话人特征向量）
     → 聚类（将相同说话人的片段归为一类）
     → 后处理（平滑边界，处理重叠语音）
```

**说话人嵌入（Speaker Embedding）**：
- **d-vector**：LSTM 提取的说话人特征
- **x-vector**：TDNN（时延神经网络）提取，更鲁棒
- **ECAPA-TDNN**：当前最强的说话人嵌入模型

**聚类方法**：
- **AHC（层次聚类）**：不需要预先知道说话人数量
- **Spectral Clustering**：基于相似度矩阵的谱聚类
- **VBx**：变分贝叶斯 HMM，精度最高

**大规模挑战**：
- 数百小时的会议录音需要高效处理
- 多说话人同时说话（重叠语音）
- 说话人数量未知

**评测指标**：DER（Diarization Error Rate）= 漏检 + 虚警 + 说话人混淆

---

## Q84. 什么是 Neural Codec TTS？VALL-E 的原理是什么？ 🔴 Hard

**Neural Codec TTS**：用神经音频编解码器（如 EnCodec）将 TTS 转化为语言模型问题。

**VALL-E（Microsoft，2023）**：
- 将 TTS 建模为条件语言模型：给定文本和 3 秒参考音频，生成目标说话人的语音
- 用 EnCodec 将音频编码为离散 token（8 层 RVQ）
- 自回归模型生成第 1 层 token，非自回归模型并行生成 2-8 层 token

**VALL-E 的零样本音色克隆**：
```
输入：文本 "Hello, how are you?" + 3 秒参考音频（目标说话人）
输出：目标说话人说 "Hello, how are you?" 的音频
```

**现代 TTS 技术路线对比**：
| 方法 | 代表模型 | 特点 |
|------|---------|------|
| 自回归 Codec LM | VALL-E、GPT-SoVITS | 音色克隆强，但慢 |
| Flow-based | CosyVoice、Voicebox | 快速且高质量 |
| Diffusion | Grad-TTS、NaturalSpeech 3 | 高质量，可控性好 |
| 端到端 | VITS、VITS2 | 快速，适合实时 |

**评测指标**：MOS（平均意见分，人工评测）、WER（用 ASR 验证可懂度）、说话人相似度（余弦相似度）

---

## Q85. 什么是 Streaming ASR System Design？ 🔴 Hard

**流式 ASR**：在用户说话过程中实时输出识别结果，而非等说完再处理。

**核心挑战**：
- **因果性**：只能使用当前和过去的音频，不能使用未来的音频
- **延迟 vs 精度权衡**：等待更多上下文可以提高精度，但增加延迟
- **稳定性**：已输出的文字不应该频繁修改（"闪烁"问题）

**流式 ASR 架构**：

| 架构 | 原理 | 延迟 | 精度 |
|------|------|------|------|
| CTC（连接时序分类） | 帧级别预测，无需对齐 | 低 | 中 |
| RNN-T（Transducer） | 联合声学和语言模型 | 低 | 高 |
| Streaming Attention | 局部注意力窗口 | 中 | 高 |
| Two-Pass | 第一遍快速，第二遍精确 | 中 | 最高 |

**RNN-T（Transducer）**：
- 声学编码器（处理音频帧）+ 预测网络（语言模型）+ 联合网络
- 支持真正的流式处理，每帧都可以输出 token
- 工业界流式 ASR 的主流方案（Google、Apple、Amazon 都使用）

**工程优化**：
- **Chunk-based 处理**：每 80-160ms 处理一个 chunk
- **Look-ahead**：允许少量未来帧（如 80ms）提高精度
- **Endpoint Detection**：检测说话结束，触发最终识别
