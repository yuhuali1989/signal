#!/usr/bin/env python3
import json
from collections import defaultdict, Counter

with open('content/news/news-feed.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

new_items = [
    {
        "id": "n2604w30-01",
        "title": "vLLM 0.8 发布：MoE 吞吐提升 40%，原生支持 Llama 4 Scout/Maverick + Qwen 3 全系列",
        "summary": "vLLM v0.8 正式发布，核心改进包括：MoE 模型推理吞吐提升 40%（通过优化专家路由调度）；原生支持 Llama 4 Scout（10M 上下文）和 Maverick（1M 上下文）的 MoE 路由；全面适配 Qwen 3 0.6B-72B 全系列。新增 Speculative Decoding 2.0 管道，草稿模型验证延迟降低 25%。Spheron H100 基准测试显示 vLLM 0.8 在高并发场景下吞吐量较 SGLang 高 15%，但 SGLang 在单请求延迟上仍有优势。",
        "whyMatters": "vLLM 0.8 的 MoE 吞吐提升意味着 Llama 4 等开源 MoE 大模型的部署成本大幅降低，推动开源模型在生产环境中的实际应用。",
        "importance": 5,
        "source": "vLLM GitHub / Spheron",
        "url": "https://blog.vllm.ai/2026/04/15/vllm-0.8.html",
        "date": "2026-04-18",
        "category": "infra",
        "categoryName": "基础设施",
        "categoryIcon": "🔧",
        "categoryColor": "yellow",
        "platform": "web",
        "platformIcon": "🌐"
    },
    {
        "id": "n2604w30-02",
        "title": "斯坦福 HAI 2026 AI Index 报告：AI 推理成本同比降 90%，公众信任度降至历史新低",
        "summary": "斯坦福人类中心 AI 研究所发布 2026 年 AI Index 年度报告。核心发现：AI 推理成本过去 18 个月下降超 90%；AI 在编程（SWE-bench 72%）和推理（GPQA 89%）上首次全面超越人类基准；全球 AI 私募投资 2025 年达 $1100 亿创新高。但公众对 AI 的信任度降至 2020 年以来最低点（仅 34% 认为 AI 利大于弊）。",
        "whyMatters": "斯坦福 AI Index 是全球最权威的 AI 行业年度体检报告。推理成本暴跌 90% 验证了 AI 民主化加速，但公众信任危机可能成为 AI 大规模应用的最大阻力。",
        "importance": 5,
        "source": "Stanford HAI",
        "url": "https://aiindex.stanford.edu/report/",
        "date": "2026-04-18",
        "category": "research",
        "categoryName": "技术突破",
        "categoryIcon": "🔬",
        "categoryColor": "green",
        "platform": "web",
        "platformIcon": "🌐"
    },
    {
        "id": "n2604w30-03",
        "title": "VLA-World：统一预测想象与反思推理的自动驾驶世界模型（arXiv 2604.09059）",
        "summary": "清华/字节联合提出 VLA-World，首次在 VLA 框架中同时实现预测想象和反思推理。模型通过世界模型分支预测未来 3 秒场景演化，同时 VLA 主干利用反思机制评估并修正规划轨迹。在 nuScenes 上 L2 误差 0.58m（较 Uni-World VLA 进一步降低 8%），碰撞率 0.15%。引入想象-反思-行动三阶段推理循环。",
        "whyMatters": "VLA-World 将自动驾驶 VLA 从感知-规划二阶段推进到想象-反思-行动三阶段，开辟了世界模型辅助决策的新范式。L2 0.58m 刷新 nuScenes 规划 SOTA。",
        "importance": 5,
        "source": "arXiv",
        "url": "https://arxiv.org/abs/2604.09059",
        "date": "2026-04-18",
        "category": "research",
        "categoryName": "技术突破",
        "categoryIcon": "🔬",
        "categoryColor": "green",
        "platform": "web",
        "platformIcon": "🌐"
    },
    {
        "id": "n2604w30-04",
        "title": "AI Scientist-v2：首篇完全由 AI 自主完成的论文被顶级 ML 会议接收",
        "summary": "Sakana AI 团队报告其 AI Scientist-v2 系统生成的论文首次被主要 ML 会议正式接收。该系统能完全自主执行提出假设、设计实验、运行实验、分析结果、撰写论文全流程，无需任何人工干预。首篇被接收论文主题为视觉 Transformer 超参数自适应优化，系统成本约 $15/篇论文。",
        "whyMatters": "AI 自主科研从概念验证进入学术认可阶段，证明了完全自动化科研管线的可行性。",
        "importance": 4,
        "source": "Sakana AI / arXiv",
        "url": "https://arxiv.org/abs/2604.06840",
        "date": "2026-04-17",
        "category": "research",
        "categoryName": "技术突破",
        "categoryIcon": "🔬",
        "categoryColor": "green",
        "platform": "web",
        "platformIcon": "🌐"
    },
    {
        "id": "n2604w30-05",
        "title": "Yann LeCun 创办 AMI 完成 $10.3 亿融资：面向工业场景的世界模型 AI 系统",
        "summary": "Meta 前首席 AI 科学家 Yann LeCun 创办的 Advanced Machine Intelligence（AMI）完成 $10.3 亿 A 轮融资。AMI 核心方向是构建面向工业场景（制造/能源/物流）的世界模型 AI 系统，强调物理世界建模和因果推理。同期 Mira Murati 的 Thinking Machines Lab 获得 NVIDIA 多年基础设施合作，采用 Vera Rubin 架构。",
        "whyMatters": "LeCun 和 Murati 两位 AI 顶级人才相继离开大厂创业，融资规模均超 $10 亿级，标志着 AI 创业进入顶级人才+超级资本的新阶段。",
        "importance": 4,
        "source": "The AI Track / TechCrunch",
        "url": "https://theaitrack.com/ai-news-april-2026-in-depth-and-concise/",
        "date": "2026-04-17",
        "category": "industry",
        "categoryName": "行业动态",
        "categoryIcon": "🏢",
        "categoryColor": "blue",
        "platform": "web",
        "platformIcon": "🌐"
    },
    {
        "id": "n2604w30-06",
        "title": "Qwen 3 全系列发布：0.6B-72B 全尺寸，首个 MMLU-Pro 超越 GPT-4o 的开源模型",
        "summary": "阿里通义千问发布 Qwen 3 全系列模型（0.6B/1.8B/7B/14B/32B/72B），72B 版本在 MMLU-Pro 上达到 89.1%，首次超越 GPT-4o（88.7%）。全系列支持 128K 上下文，中日韩阿拉伯语+欧洲语言多语言表现业界最佳。配合 vLLM 0.8 可在单机 4xA100 上达到 200 tokens/s 吞吐。同步发布 Qwen 3-Coder 系列。",
        "whyMatters": "Qwen 3 是开源模型在推理基准上全面追平甚至超越顶级闭源模型的里程碑事件。免费自托管+多语言优势使其成为非英语市场首选开源方案。",
        "importance": 5,
        "source": "阿里云 / 通义千问",
        "url": "https://qwenlm.github.io/blog/qwen3/",
        "date": "2026-04-17",
        "category": "model-release",
        "categoryName": "模型发布",
        "categoryIcon": "🚀",
        "categoryColor": "purple",
        "platform": "web",
        "platformIcon": "🌐"
    },
    {
        "id": "n2604w30-07",
        "title": "EU AI Act 开源豁免定稿：10B 参数以下享受轻量合规，大模型须完全合规",
        "summary": "欧盟委员会正式发布 AI Act 开源豁免实施细则：10B 参数以下的开放权重模型享受轻量合规要求（仅需模型卡+基本安全测试）；10B 以上仍需执行完整合规流程（对抗性测试、偏见审计、持续监控）。Meta 和 Mistral 均表示欢迎。此举被视为在促进开源创新与控制大模型风险之间取得平衡。",
        "whyMatters": "EU AI Act 开源豁免为全球 AI 监管树立标杆：小模型开源自由，大模型严格合规。10B 以下精品小模型可能迎来爆发期。",
        "importance": 4,
        "source": "EU Commission / The Verge",
        "url": "https://digital-strategy.ec.europa.eu/en/policies/european-approach-artificial-intelligence",
        "date": "2026-04-16",
        "category": "safety",
        "categoryName": "安全与治理",
        "categoryIcon": "🛡️",
        "categoryColor": "red",
        "platform": "web",
        "platformIcon": "🌐"
    },
    {
        "id": "n2604w30-08",
        "title": "Anthropic 发布托管 Agent 云服务 + Claude Cowork GA：Agent 即服务时代开启",
        "summary": "Anthropic 同日发布三项重大更新：Claude Managed Agents 公测（企业可在云上部署长运行 Agent，内置 MCP 工具调用、持久记忆、安全沙箱）；Claude Cowork 正式 GA（多人+多 Agent 协作工作空间）；Claude Code 新增 worktree 隔离模式（多 Agent 并行操作不同 Git 分支）。Agent 运行时按分钟计费 $0.02/min + token 用量。",
        "whyMatters": "Anthropic 率先推出 Agent 即服务云平台，将 Agent 从本地工具升级为云端托管服务。Agent 编排、执行、监控将成为新的云服务品类。",
        "importance": 5,
        "source": "Anthropic",
        "url": "https://www.anthropic.com/news/managed-agents",
        "date": "2026-04-16",
        "category": "infra",
        "categoryName": "基础设施",
        "categoryIcon": "🔧",
        "categoryColor": "yellow",
        "platform": "web",
        "platformIcon": "🌐"
    }
]

# 合并 30 天前的同类旧条目
cutoff = "2026-03-19"
old_items = [d for d in data if d.get('date','') < cutoff and d.get('type') != 'summary']
recent_items = [d for d in data if d.get('date','') >= cutoff or d.get('type') == 'summary']

merge_groups = defaultdict(list)
for item in old_items:
    month = item['date'][:7]
    merge_groups[month].append(item)

merged = []
for month, items in sorted(merge_groups.items(), reverse=True):
    if len(items) <= 1:
        merged.extend(items)
    else:
        titles = [i['title'][:30] for i in items[:4]]
        summary_text = " | ".join(titles)
        merged.append({
            "id": f"ns-{month}",
            "title": f"📋 {month} 综合：{len(items)} 条重要动态",
            "summary": summary_text,
            "source": "综合",
            "url": "https://signal-ai.dev/news",
            "date": f"{month}-28",
            "category": "research",
            "categoryName": "月度总结",
            "categoryIcon": "📊",
            "categoryColor": "green",
            "type": "summary"
        })

# 组合
existing_summary_ids = {d['id'] for d in recent_items if d.get('type') == 'summary'}
final = new_items + recent_items
for m in merged:
    if m['id'] not in existing_summary_ids:
        final.append(m)

with open('content/news/news-feed.json', 'w', encoding='utf-8') as f:
    json.dump(final, f, ensure_ascii=False, indent=2)

print(f"Done: +{len(new_items)} new, merged {len(old_items)} old -> {len(merged)} summaries, total={len(final)}")
cats = Counter(d.get('category','') for d in final)
print(f"Categories: {dict(cats)}")
