"""补充 2015-2021 年声浪数据 + 年度总结卡片"""
import json
from pathlib import Path

fp = Path(__file__).parent.parent / "content" / "news" / "news-feed.json"
news = json.loads(fp.read_text())
existing_ids = {n["id"] for n in news}

new_entries = [
    # 2015
    {"id":"sum-2015","title":"📊 2015：深度学习破局年","summary":"ResNet 152 层打开深度网络大门，TensorFlow 开源让深度学习民主化，AlphaGo 击败樊麾点燃 AI 应用想象。","source":"年度总结","url":"https://arxiv.org/abs/1512.03385","date":"2015-12-31","category":"research","categoryName":"年度总结","categoryIcon":"📊","categoryColor":"blue","type":"summary"},
    {"id":"n2015-01","title":"ResNet 发布：152 层深度残差网络","summary":"何恺明等提出残差学习，用跳跃连接解决梯度消失，ILSVRC 2015 冠军。","source":"arXiv","url":"https://arxiv.org/abs/1512.03385","date":"2015-12-10","category":"research","categoryName":"技术突破","categoryIcon":"🔬","categoryColor":"green"},
    {"id":"n2015-02","title":"TensorFlow 开源：Google 深度学习框架","summary":"成为此后 5 年最流行的深度学习框架，极大降低 AI 研究门槛。","source":"Google","url":"https://www.tensorflow.org/","date":"2015-11-09","category":"opensource","categoryName":"开源生态","categoryIcon":"📦","categoryColor":"orange"},
    {"id":"n2015-03","title":"AlphaGo 击败樊麾：AI 首次战胜职业围棋手","summary":"DeepMind AlphaGo 5:0 击败欧洲围棋冠军樊麾，论文次年发表于 Nature。","source":"Nature","url":"https://www.nature.com/articles/nature16961","date":"2015-10-01","category":"research","categoryName":"技术突破","categoryIcon":"🔬","categoryColor":"green"},
    # 2016
    {"id":"sum-2016","title":"📊 2016：AI 登上世界头条","summary":"AlphaGo 4:1 击败李世石成全球头条，GAN 图像生成爆发，Google 推出 TPU 加速 AI 计算。","source":"年度总结","url":"https://deepmind.google/research/highlighted-research/alphago/","date":"2016-12-31","category":"research","categoryName":"年度总结","categoryIcon":"📊","categoryColor":"blue","type":"summary"},
    {"id":"n2016-01","title":"AlphaGo 4:1 击败李世石","summary":"全球直播观看超 2 亿人次，AI 里程碑时刻。","source":"DeepMind","url":"https://deepmind.google/research/highlighted-research/alphago/","date":"2016-03-15","category":"research","categoryName":"技术突破","categoryIcon":"🔬","categoryColor":"green"},
    {"id":"n2016-02","title":"GAN 图像生成爆发 + Google TPU v1","summary":"DCGAN/pix2pix 推动 GAN 实用化，Google TPU 加速深度学习推理。","source":"Google","url":"https://cloud.google.com/tpu","date":"2016-05-18","category":"research","categoryName":"技术突破","categoryIcon":"🔬","categoryColor":"green"},
    # 2017
    {"id":"sum-2017","title":"📊 2017：Transformer 元年","summary":"Attention Is All You Need 彻底改变 AI，AlphaGo Zero 无需人类知识从零自学围棋，PPO 算法成为后来 RLHF 的基础。","source":"年度总结","url":"https://arxiv.org/abs/1706.03762","date":"2017-12-31","category":"research","categoryName":"年度总结","categoryIcon":"📊","categoryColor":"blue","type":"summary"},
    {"id":"n2017-01","title":"Attention Is All You Need：Transformer 诞生","summary":"自注意力机制替代 RNN/CNN，此后成为 GPT/BERT/LLaMA 所有大模型的基础。","source":"NeurIPS","url":"https://arxiv.org/abs/1706.03762","date":"2017-06-12","category":"research","categoryName":"技术突破","categoryIcon":"🔬","categoryColor":"green"},
    {"id":"n2017-02","title":"AlphaGo Zero + PPO 算法","summary":"AlphaGo Zero 纯自我对弈超越人类，PPO 成为最流行的策略梯度算法。","source":"Nature / OpenAI","url":"https://arxiv.org/abs/1707.06347","date":"2017-10-18","category":"research","categoryName":"技术突破","categoryIcon":"🔬","categoryColor":"green"},
    # 2018
    {"id":"sum-2018","title":"📊 2018：预训练革命","summary":"BERT 和 GPT-1 开启预训练大模型时代，「预训练+微调」成为 NLP 标准流程。","source":"年度总结","url":"https://arxiv.org/abs/1810.04805","date":"2018-12-31","category":"research","categoryName":"年度总结","categoryIcon":"📊","categoryColor":"blue","type":"summary"},
    {"id":"n2018-01","title":"BERT：双向预训练改写 NLP 格局","summary":"Masked Language Model 实现双向理解，11 个 NLP 任务创记录。","source":"Google AI","url":"https://arxiv.org/abs/1810.04805","date":"2018-10-11","category":"research","categoryName":"技术突破","categoryIcon":"🔬","categoryColor":"green"},
    {"id":"n2018-02","title":"GPT-1 发布：生成式预训练的起点","summary":"OpenAI 发布 GPT-1（1.17 亿参数），展示无监督预训练+有监督微调的威力。","source":"OpenAI","url":"https://openai.com/research/language-unsupervised","date":"2018-06-11","category":"model-release","categoryName":"模型发布","categoryIcon":"🚀","categoryColor":"purple"},
    # 2019
    {"id":"sum-2019","title":"📊 2019：GPT-2「太危险不发布」","summary":"GPT-2 推迟开源引发 AI 安全大讨论，T5 统一 NLP 任务范式。大模型开始引发社会关注。","source":"年度总结","url":"https://openai.com/research/better-language-models","date":"2019-12-31","category":"research","categoryName":"年度总结","categoryIcon":"📊","categoryColor":"blue","type":"summary"},
    {"id":"n2019-01","title":"GPT-2：太危险了不能发布","summary":"15 亿参数，生成质量之高引发安全担忧，AI 安全讨论的标志性事件。","source":"OpenAI","url":"https://openai.com/research/better-language-models","date":"2019-02-14","category":"model-release","categoryName":"模型发布","categoryIcon":"🚀","categoryColor":"purple"},
    {"id":"n2019-02","title":"T5：统一 NLP 为 Text-to-Text","summary":"所有 NLP 任务统一为文本到文本格式，为后来的指令微调奠定基础。","source":"Google","url":"https://arxiv.org/abs/1910.10683","date":"2019-10-23","category":"research","categoryName":"技术突破","categoryIcon":"🔬","categoryColor":"green"},
    # 2020
    {"id":"sum-2020","title":"📊 2020：Scaling Law 时代","summary":"GPT-3 展示大力出奇迹（1750 亿参数），Scaling Law 建立规模与性能的数学关系，AlphaFold 2 解决蛋白质折叠，ViT 统一视觉和语言架构。","source":"年度总结","url":"https://arxiv.org/abs/2005.14165","date":"2020-12-31","category":"research","categoryName":"年度总结","categoryIcon":"📊","categoryColor":"blue","type":"summary"},
    {"id":"n2020-01","title":"GPT-3：1750 亿参数，Few-Shot 涌现","summary":"仅通过提示词即可完成翻译、编程、问答，展示 in-context learning 能力。","source":"OpenAI","url":"https://arxiv.org/abs/2005.14165","date":"2020-05-28","category":"model-release","categoryName":"模型发布","categoryIcon":"🚀","categoryColor":"purple"},
    {"id":"n2020-02","title":"AlphaFold 2：解决 50 年蛋白质折叠难题","summary":"CASP14 竞赛碾压性领先，Nature 评为年度十大科学突破之首。","source":"Nature","url":"https://www.nature.com/articles/s41586-021-03819-2","date":"2020-11-30","category":"research","categoryName":"技术突破","categoryIcon":"🔬","categoryColor":"green"},
    {"id":"n2020-03","title":"Scaling Law + ViT：改变 AI 方向的两篇论文","summary":"Scaling Law 建立幂律关系，ViT 证明纯 Transformer 可以做图像分类。","source":"arXiv","url":"https://arxiv.org/abs/2001.08361","date":"2020-01-23","category":"research","categoryName":"技术突破","categoryIcon":"🔬","categoryColor":"green"},
    # 2021
    {"id":"sum-2021","title":"📊 2021：多模态 + 代码生成崛起","summary":"DALL-E 首次展示文本生成图像，Codex/Copilot 让 AI 编程走向实用，AlphaFold 2 开源预测 2 亿个蛋白质结构。AI 从理解走向创造。","source":"年度总结","url":"https://openai.com/research/dall-e","date":"2021-12-31","category":"research","categoryName":"年度总结","categoryIcon":"📊","categoryColor":"blue","type":"summary"},
    {"id":"n2021-01","title":"DALL-E：用文本生成图片的开端","summary":"首次展示 AI 根据文字描述生成创意图片，多模态 AI 序幕拉开。","source":"OpenAI","url":"https://openai.com/research/dall-e","date":"2021-01-05","category":"model-release","categoryName":"模型发布","categoryIcon":"🚀","categoryColor":"purple"},
    {"id":"n2021-02","title":"Codex + GitHub Copilot：AI 编程助手诞生","summary":"首个 AI 编程助手上线，从此改变程序员工作方式。","source":"GitHub","url":"https://github.com/features/copilot","date":"2021-06-29","category":"industry","categoryName":"行业动态","categoryIcon":"🏢","categoryColor":"blue"},
    {"id":"n2021-03","title":"AlphaFold 2 开源：预测 2 亿个蛋白质结构","summary":"覆盖几乎所有已知蛋白质，被誉为 AI 对人类最重大的贡献之一。","source":"DeepMind","url":"https://alphafold.ebi.ac.uk/","date":"2021-07-15","category":"opensource","categoryName":"开源生态","categoryIcon":"📦","categoryColor":"orange"},
    # 年度总结（2022-2025）
    {"id":"sum-2022","title":"📊 2022：ChatGPT 爆发，AI 走向大众","summary":"ChatGPT 5 天破百万用户，Stable Diffusion 开源让 AI 绘画平权，Chinchilla 颠覆 Scaling Law，InstructGPT/RLHF 奠定对齐技术基础。","source":"年度总结","url":"https://openai.com/blog/chatgpt","date":"2022-12-31","category":"research","categoryName":"年度总结","categoryIcon":"📊","categoryColor":"blue","type":"summary"},
    {"id":"sum-2023","title":"📊 2023：百模大战与开源爆发","summary":"GPT-4 多模态能力，Llama 2 开源点燃热潮，Claude 2 进入竞争，OpenAI 董事会宫斗。大模型百花齐放。","source":"年度总结","url":"https://openai.com/research/gpt-4","date":"2023-12-31","category":"research","categoryName":"年度总结","categoryIcon":"📊","categoryColor":"blue","type":"summary"},
    {"id":"sum-2024","title":"📊 2024：多模态爆发 + 推理突破","summary":"GPT-4o 原生多模态，Sora 视频生成，Claude 3.5 刷新编码基准，o1 展示 CoT 推理。Llama 3.1 405B 推动开源追赶闭源。","source":"年度总结","url":"https://openai.com/index/hello-gpt-4o/","date":"2024-12-31","category":"research","categoryName":"年度总结","categoryIcon":"📊","categoryColor":"blue","type":"summary"},
    {"id":"sum-2025","title":"📊 2025：中国突围 + Agent 元年","summary":"DeepSeek-R1/V3 极低成本打入世界前三，Claude 3 Opus 称霸编码，Cursor 估值破百亿。AI 从模型竞赛转向 Agent 应用。","source":"年度总结","url":"https://www.deepseek.com/","date":"2025-12-31","category":"research","categoryName":"年度总结","categoryIcon":"📊","categoryColor":"blue","type":"summary"},
]

added = 0
for entry in new_entries:
    if entry["id"] not in existing_ids:
        news.append(entry)
        existing_ids.add(entry["id"])
        added += 1

news.sort(key=lambda x: x["date"], reverse=True)
fp.write_text(json.dumps(news, ensure_ascii=False, indent=2))

from collections import Counter
years = Counter(n["date"][:4] for n in news)
summaries = sum(1 for n in news if n.get("type") == "summary")
print(f"新增: {added} 条 | 总计: {len(news)} 条 | 总结: {summaries} 个")
for y in sorted(years):
    print(f"  {y}: {years[y]} 条")
