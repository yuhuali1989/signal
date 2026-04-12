"""
Signal — AI 新闻抓取与分类引擎

从主流科技媒体检索大模型相关新闻，自动分类并生成结构化 JSON。
支持的分类:
  - 模型发布: 新模型发布、benchmark 更新
  - 行业动态: 公司战略、融资、收购
  - 技术突破: 论文、算法创新
  - 开源生态: 开源项目、社区动态
  - 应用落地: AI 产品、商业化
  - 安全与治理: AI 安全、监管政策
"""

import json
import hashlib
import re
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).parent.parent
NEWS_DIR = ROOT / 'content' / 'news'
NEWS_DIR.mkdir(parents=True, exist_ok=True)


# ─── 新闻分类 ───

CATEGORIES = {
    'model-release': {'name': '模型发布', 'icon': '🚀', 'color': 'purple'},
    'industry': {'name': '行业动态', 'icon': '🏢', 'color': 'blue'},
    'research': {'name': '技术突破', 'icon': '🔬', 'color': 'green'},
    'opensource': {'name': '开源生态', 'icon': '📦', 'color': 'orange'},
    'application': {'name': '应用落地', 'icon': '💡', 'color': 'yellow'},
    'safety': {'name': '安全与治理', 'icon': '🛡️', 'color': 'red'},
}

# ─── 分类关键词规则 ───

CATEGORY_RULES = {
    'model-release': [
        'GPT-5', 'GPT-4o', 'Claude 4', 'Claude Opus', 'Gemini', 'Llama 4',
        'Qwen3', 'DeepSeek', '发布', 'release', 'launch', '新模型', 'benchmark',
        'MMLU', 'HumanEval', 'Mistral', '开放权重', 'open weight',
    ],
    'industry': [
        '融资', '收购', '估值', 'IPO', '裁员', '招聘', 'OpenAI', 'Anthropic',
        'Google', 'Meta', 'xAI', '字节', '腾讯', '阿里', '百度', '战略',
        '合作', '投资', 'billion', '亿', 'CEO', 'CTO',
    ],
    'research': [
        '论文', 'paper', 'arXiv', 'ICML', 'NeurIPS', 'ICLR', 'ACL',
        'Transformer', '注意力机制', 'attention', 'MoE', 'RLHF', 'DPO',
        '微调', 'fine-tune', '蒸馏', 'distillation', '量化', 'quantization',
        'scaling law', 'reasoning', '推理',
    ],
    'opensource': [
        '开源', 'open source', 'GitHub', 'Hugging Face', 'Apache', 'MIT',
        'vLLM', 'LangChain', 'LlamaIndex', 'CrewAI', 'Dify', 'Ollama',
        '社区', 'community', 'contributor',
    ],
    'application': [
        'AI编程', 'Cursor', 'Copilot', 'AI Agent', '智能体', '搜索',
        '客服', '教育', '医疗', '金融', 'SaaS', 'API', '产品', '上线',
        'coding', '自动驾驶', 'autonomous',
    ],
    'safety': [
        '安全', 'safety', '对齐', 'alignment', '监管', 'regulation',
        '伦理', 'ethics', '偏见', 'bias', '越狱', 'jailbreak', '红队',
        'red team', 'GDPR', '立法', 'legislation',
    ],
}


def classify_news(title, summary='', override=None):
    """基于关键词规则对新闻进行分类"""
    if override:
        return override

    text = f"{title} {summary}".lower()
    scores = {}

    for category, keywords in CATEGORY_RULES.items():
        score = sum(1 for kw in keywords if kw.lower() in text)
        if score > 0:
            scores[category] = score

    if not scores:
        return 'industry'

    return max(scores, key=scores.get)


def news_id(title, source):
    """生成新闻唯一 ID"""
    return hashlib.md5(f"{title}-{source}".encode()).hexdigest()[:10]


# ─── 种子新闻数据（模拟从各媒体抓取） ───

SEED_NEWS = [
    {
        'title': 'OpenAI 发布 GPT-5：推理能力大幅提升，支持原生多模态',
        'summary': 'OpenAI 正式发布 GPT-5 模型，在数学推理和代码生成上较 GPT-4o 提升 40%+，首次支持原生音视频理解与生成。API 已开放，定价与 GPT-4o 持平。',
        'source': 'The Verge',
        'url': 'https://theverge.com',
        'date': '2026-04-11',
        'category_override': 'model-release',
    },
    {
        'title': 'Anthropic Claude 4 Opus 全面超越 GPT-4o，代码能力创新高',
        'summary': 'Anthropic 发布 Claude 4 系列，Claude 4 Opus 在 SWE-bench 上首次突破 70%，成为最强 AI 编程助手。Claude 4 Sonnet 性价比之王。',
        'source': 'TechCrunch',
        'url': 'https://techcrunch.com',
        'date': '2026-04-10',
        'category_override': 'model-release',
    },
    {
        'title': 'DeepSeek-R2 开源：GRPO 升级版，推理能力逼近 o1-pro',
        'summary': 'DeepSeek 开源 R2 模型，基于改进版 GRPO 算法训练，在 AIME 2024 数学竞赛中得分超越 o1。同时发布 R2-Distill 系列蒸馏模型。',
        'source': '机器之心',
        'url': 'https://jiqizhixin.com',
        'date': '2026-04-09',
        'category_override': 'opensource',
    },
    {
        'title': 'Meta 发布 Llama 4 Scout/Maverick：首个原生 MoE 开源大模型',
        'summary': 'Meta 发布 Llama 4 系列，采用 MoE 架构，Scout (17B/109B) 和 Maverick (17B/400B)，支持 10M token 上下文窗口。',
        'source': 'Meta AI Blog',
        'url': 'https://ai.meta.com',
        'date': '2026-04-08',
        'category_override': 'model-release',
    },
    {
        'title': 'Google DeepMind 发布 Gemini 2.5 Pro：思考模型登场',
        'summary': 'Google 发布 Gemini 2.5 Pro，首个 "思考模型"，在 coding 和 math 上全面超越 Gemini 2.0。支持 1M token 上下文。',
        'source': 'Google AI Blog',
        'url': 'https://blog.google',
        'date': '2026-04-07',
        'category_override': 'model-release',
    },
    {
        'title': 'Cursor 估值突破 100 亿美元，AI IDE 赛道竞争白热化',
        'summary': 'AI 编程工具 Cursor 完成新一轮融资，估值超 100 亿美元。同期 Windsurf、Augment Code 等竞品也获得大额融资。',
        'source': 'Bloomberg',
        'url': 'https://bloomberg.com',
        'date': '2026-04-10',
        'category_override': 'industry',
    },
    {
        'title': '阿里发布 Qwen3：开源模型首次支持混合推理模式',
        'summary': '通义千问 Qwen3 系列发布，首创"思考/非思考"混合推理模式。Qwen3-235B-A22B 采用 MoE 架构。',
        'source': '阿里云官方',
        'url': 'https://qwen.ai',
        'date': '2026-04-06',
        'category_override': 'model-release',
    },
    {
        'title': 'Hugging Face 开源 SmolLM3：3B 参数超越 Llama 3.1 8B',
        'summary': 'Hugging Face 发布 SmolLM3，仅 3B 参数在多项 benchmark 上超越 Llama 3.1 8B。小模型的极致优化。',
        'source': 'Hugging Face Blog',
        'url': 'https://huggingface.co',
        'date': '2026-04-05',
        'category_override': 'opensource',
    },
    {
        'title': '欧盟 AI Act 正式生效：通用 AI 系统面临严格合规要求',
        'summary': '欧盟《人工智能法》核心条款正式生效，GPAI 提供者需提交技术文档、遵守版权规则。违规罚款最高达全球营收 3%。',
        'source': 'Reuters',
        'url': 'https://reuters.com',
        'date': '2026-04-04',
        'category_override': 'safety',
    },
    {
        'title': 'Karpathy 开源 LLM Wiki：让知识库自己生长的新范式',
        'summary': '前 OpenAI 科学家 Karpathy 分享 LLM Wiki 方法论，用 LLM 增量维护结构化 Wiki 替代传统 RAG。帖子获 4.3 万点赞。',
        'source': 'X (Twitter)',
        'url': 'https://x.com',
        'date': '2026-04-03',
        'category_override': 'research',
    },
    {
        'title': '字节跳动发布 DAPO：修复 GRPO 的熵崩塌问题',
        'summary': '字节跳动开源 DAPO 算法，通过动态采样和解耦 clip 策略解决 GRPO 训练中的熵崩塌问题。',
        'source': 'arXiv',
        'url': 'https://arxiv.org',
        'date': '2026-04-02',
        'category_override': 'research',
    },
    {
        'title': 'vLLM 发布 v1.0：推理引擎进入生产级时代',
        'summary': 'vLLM 正式发布 1.0 版本，支持分离式前缀缓存、多 LoRA 并发、FP8 推理，吞吐提升 2-3 倍。',
        'source': 'GitHub',
        'url': 'https://github.com/vllm-project/vllm',
        'date': '2026-04-01',
        'category_override': 'opensource',
    },
]


def generate_news_data(force=False):
    """生成新闻数据文件。如果已有手工编辑的数据且非 force 模式则跳过"""
    output_path = NEWS_DIR / 'news-feed.json'

    # 防覆盖保护：如果已有数据且 URL 不全是 #，说明是手工维护的
    if output_path.exists() and not force:
        try:
            existing = json.loads(output_path.read_text(encoding='utf-8'))
            real_urls = sum(1 for n in existing if n.get('url', '#').startswith('http'))
            if real_urls > 0:
                print(f"  ⏭️  跳过新闻生成（已有 {len(existing)} 条，{real_urls} 条含真实链接）")
                print(f"     使用 --force 强制覆盖")
                return existing
        except Exception:
            pass  # JSON 损坏，重新生成

    news_items = []

    for item in SEED_NEWS:
        category = classify_news(item['title'], item.get('summary', ''), item.get('category_override'))
        cat_info = CATEGORIES[category]

        news_items.append({
            'id': news_id(item['title'], item['source']),
            'title': item['title'],
            'summary': item.get('summary', ''),
            'source': item['source'],
            'url': item.get('url', ''),
            'date': item['date'],
            'category': category,
            'categoryName': cat_info['name'],
            'categoryIcon': cat_info['icon'],
            'categoryColor': cat_info['color'],
        })

    # 按日期降序
    news_items.sort(key=lambda x: x['date'], reverse=True)

    # 保存为 JSON
    output_path = NEWS_DIR / 'news-feed.json'
    output_path.write_text(
        json.dumps(news_items, ensure_ascii=False, indent=2),
        encoding='utf-8'
    )

    # 保存分类索引
    categories_output = []
    for cat_id, cat_info in CATEGORIES.items():
        count = sum(1 for n in news_items if n['category'] == cat_id)
        categories_output.append({
            'id': cat_id,
            'name': cat_info['name'],
            'icon': cat_info['icon'],
            'color': cat_info['color'],
            'count': count,
        })

    cat_path = NEWS_DIR / 'categories.json'
    cat_path.write_text(
        json.dumps(categories_output, ensure_ascii=False, indent=2),
        encoding='utf-8'
    )

    print(f"  ✅ 已生成 {len(news_items)} 条新闻")
    print(f"  📂 新闻数据: {output_path}")
    print(f"  📂 分类索引: {cat_path}")

    # 打印分类统计
    print(f"\n  📊 分类统计:")
    for cat in categories_output:
        if cat['count'] > 0:
            print(f"     {cat['icon']} {cat['name']}: {cat['count']} 条")

    return news_items


if __name__ == '__main__':
    import sys
    print("📰 Signal — AI 声浪抓取引擎")
    print("=" * 40)
    force = '--force' in sys.argv
    generate_news_data(force=force)
