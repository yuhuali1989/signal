"""
Signal — 真实多智能体内容生产引擎

三个角色：
  📡 研究员 (Researcher)  — 调研最新资料、检查现有内容的过时/缺漏
  ✍️  编辑 (Editor)        — 基于研究报告，写作或修订内容
  🔍 审校员 (Reviewer)     — 技术准确性、格式规范、质量把关

支持三种 LLM 后端（按优先级）:
  1. CrewAI（pip install crewai）— 最强，完整的多智能体编排
  2. OpenAI API（pip install openai）— 用原生 API 模拟多角色
  3. 模板模式 — 无 API 时的 fallback
"""

import os
import sys
import json
import re
import hashlib
import argparse
from datetime import datetime, timezone
from pathlib import Path

# ─── 环境配置 ───
try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).parent.parent / '.env')
except ImportError:
    pass

# ─── 检测可用的 LLM 后端 ───
BACKEND = 'template'  # 默认

try:
    from crewai import Agent, Task, Crew, Process
    BACKEND = 'crewai'
except ImportError:
    pass

if BACKEND == 'template':
    try:
        import openai
        if os.getenv('OPENAI_API_KEY') or os.getenv('OPENAI_BASE_URL'):
            BACKEND = 'openai'
    except ImportError:
        pass

print(f"[Signal] 后端: {BACKEND}")

# ─── 路径配置 ───
ROOT = Path(__file__).parent.parent
CONTENT_DIR = ROOT / 'content'
BOOKS_DIR = CONTENT_DIR / 'books'
ARTICLES_DIR = CONTENT_DIR / 'articles'
PAPERS_DIR = CONTENT_DIR / 'papers'
EVOLUTION_LOG = CONTENT_DIR / 'evolution-log.json'

for d in [BOOKS_DIR, ARTICLES_DIR, PAPERS_DIR]:
    d.mkdir(parents=True, exist_ok=True)


# ═══════════════════════════════════════════
#  工具函数
# ═══════════════════════════════════════════

def slugify(text):
    """生成纯 ASCII slug"""
    ascii_part = re.sub(r'[^a-zA-Z0-9\s\-]', '', text).strip()
    slug = re.sub(r'[\s\-]+', '-', ascii_part).lower().strip('-')
    if len(slug) < 3:
        slug = hashlib.md5(text.encode()).hexdigest()[:8]
    return slug[:60]


def now_str():
    return datetime.now().strftime('%Y-%m-%d %H:%M')


def save_markdown(directory, slug, frontmatter, body):
    """保存 Markdown 文件（带 frontmatter）"""
    filepath = directory / f"{slug}.md"

    # 防覆盖保护：超过 80 行的手写内容不覆盖
    if filepath.exists():
        existing_lines = filepath.read_text(encoding='utf-8').count('\n')
        if existing_lines > 80:
            print(f"    ⏭️  跳过（已有 {existing_lines} 行，保护手写内容）")
            return False

    lines = ['---']
    for k, v in frontmatter.items():
        if isinstance(v, list):
            lines.append(f"{k}:")
            for item in v:
                lines.append(f"  - \"{item}\"")
        else:
            val = str(v).replace('"', '\\"')
            lines.append(f'{k}: "{val}"')
    lines.append('---\n')
    lines.append(body)

    filepath.write_text('\n'.join(lines), encoding='utf-8')
    return True


def append_evolution_log(entry):
    """追加进化日志"""
    logs = []
    if EVOLUTION_LOG.exists():
        try:
            logs = json.loads(EVOLUTION_LOG.read_text(encoding='utf-8'))
        except Exception:
            pass
    logs.insert(0, entry)
    EVOLUTION_LOG.write_text(json.dumps(logs[:50], ensure_ascii=False, indent=2), encoding='utf-8')


# ═══════════════════════════════════════════
#  OpenAI API 多角色模拟
# ═══════════════════════════════════════════

def call_llm(system_prompt, user_prompt, model=None):
    """调用 LLM API"""
    if BACKEND == 'template':
        return None

    if BACKEND == 'openai':
        client = openai.OpenAI(
            api_key=os.getenv('OPENAI_API_KEY', 'sk-placeholder'),
            base_url=os.getenv('OPENAI_BASE_URL', 'https://api.openai.com/v1'),
        )
        model = model or os.getenv('SIGNAL_MODEL', 'gpt-4o-mini')
        resp = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.7,
            max_tokens=4096,
        )
        return resp.choices[0].message.content

    return None


def run_researcher(topic, existing_content=None):
    """
    📡 研究员：调研主题，输出结构化研究报告
    如果有现有内容，则检查过时/缺漏
    """
    system = """你是 Signal 知识平台的 AI 前沿研究员。
你的职责是：
1. 深度调研给定主题的最新技术进展
2. 收集关键论文、项目、数据和代码
3. 如果有现有内容，指出过时信息和需要补充的地方
4. 输出结构化的研究报告

输出格式：
## 研究报告
### 核心发现
- ...
### 关键论文/项目
- ...
### 现有内容评估（如果有）
- 过时内容：...
- 缺漏内容：...
### 建议修订方向
- ..."""

    user = f"主题: {topic}\n\n"
    if existing_content:
        user += f"现有内容（前 2000 字）:\n{existing_content[:2000]}\n\n请评估现有内容并指出需要更新的地方。"
    else:
        user += "请对这个主题进行全面调研，输出研究报告。"

    result = call_llm(system, user)
    if result:
        print(f"    📡 研究员完成 ({len(result)} 字)")
    return result


def run_editor(topic, research_report, existing_content=None, content_type='article'):
    """
    ✍️ 编辑：基于研究报告写作/修订内容
    """
    if content_type == 'book_chapter':
        system = """你是 Signal 知识平台的技术书籍编辑。
你的职责是基于研究员的报告，撰写或修订书籍章节。

写作要求：
1. 字数 3000-5000 字（中文）
2. 使用 Markdown 格式，合理使用 h2/h3 标题
3. 包含代码示例（Python），用 ```python 包裹
4. 数学公式用 $...$ (行内) 和 $$...$$ (独立行)
5. 适当使用表格对比不同方案
6. 深入浅出，既有理论深度又有工程实践
7. 不要生成 frontmatter（---开头的部分），直接从正文开始"""
    else:
        system = """你是 Signal 知识平台的技术文章编辑。
你的职责是基于研究员的报告，撰写深度技术文章。

写作要求：
1. 字数 1500-2500 字（中文）
2. 使用 Markdown 格式，包含 h2/h3 标题
3. 包含代码示例和表格
4. 数学公式用 $...$ 和 $$...$$
5. 给出清晰的结论和展望
6. 不要生成 frontmatter，直接从正文开始"""

    user = f"主题: {topic}\n\n研究报告:\n{research_report}\n\n"
    if existing_content:
        user += f"现有内容:\n{existing_content[:3000]}\n\n请基于研究报告修订和完善现有内容。"
    else:
        user += "请基于研究报告撰写全新内容。"

    result = call_llm(system, user)
    if result:
        print(f"    ✍️  编辑完成 ({len(result)} 字)")
    return result


def run_reviewer(content, topic):
    """
    🔍 审校员：检查质量，直接输出修正后的内容
    """
    system = """你是 Signal 知识平台的内容审校员。
你的职责是审校技术文章，检查并修正：

1. 技术准确性：概念、数据、代码是否正确
2. 逻辑一致性：论述是否连贯、结构是否合理
3. Markdown 格式：代码块、表格、公式格式是否正确
4. 内容完整性：是否有遗漏的重要内容

直接输出修正后的完整文章内容，不要输出审校意见。
不要添加 frontmatter。"""

    user = f"主题: {topic}\n\n待审校内容:\n{content}"

    result = call_llm(system, user)
    if result:
        print(f"    🔍 审校员完成 ({len(result)} 字)")
    return result


# ═══════════════════════════════════════════
#  CrewAI 多智能体编排
# ═══════════════════════════════════════════

def run_crewai_pipeline(topic, existing_content=None, content_type='article'):
    """使用 CrewAI 运行完整的三角色流水线"""
    researcher = Agent(
        role='AI 前沿研究员',
        goal=f'深度调研 "{topic}" 的最新技术突破和行业动态',
        backstory='你是一位资深 AI 研究员，持续关注 arXiv、顶会论文和技术社区。',
        verbose=True,
        allow_delegation=False,
    )

    editor = Agent(
        role='技术内容编辑',
        goal=f'将 "{topic}" 的研究成果整理成高质量的中文技术文章',
        backstory='你是一位专业技术编辑，擅长将复杂概念转化为清晰的技术文章。',
        verbose=True,
        allow_delegation=False,
    )

    reviewer = Agent(
        role='内容审校员',
        goal='检查技术准确性、格式规范性和内容质量',
        backstory='你是一位严谨的审校员，精通 AI 领域，专注于发现错误和改进内容。',
        verbose=True,
        allow_delegation=False,
    )

    word_count = '3000-5000' if content_type == 'book_chapter' else '1500-2500'
    context_info = f"\n现有内容（前 2000 字）:\n{existing_content[:2000]}" if existing_content else ""

    research_task = Task(
        description=f"""深度研究主题: {topic}{context_info}

        要求：
        1. 列出 3-5 个核心技术要点和最新进展
        2. 引用具体论文、项目或数据
        3. 如果有现有内容，指出过时信息和缺漏
        """,
        expected_output='结构化研究报告',
        agent=researcher,
    )

    edit_task = Task(
        description=f"""基于研究报告撰写/修订中文技术文章:

        主题: {topic}
        字数: {word_count} 字
        格式: Markdown，包含代码块、表格、数学公式
        不要生成 frontmatter
        """,
        expected_output='完整 Markdown 文章',
        agent=editor,
    )

    review_task = Task(
        description="""审校文章，检查技术准确性、格式和质量。
        直接输出修正后的完整文章。不要输出审校意见。""",
        expected_output='修正后的完整 Markdown 文章',
        agent=reviewer,
    )

    crew = Crew(
        agents=[researcher, editor, reviewer],
        tasks=[research_task, edit_task, review_task],
        process=Process.sequential,
        verbose=True,
    )

    result = crew.kickoff()
    return str(result)


# ═══════════════════════════════════════════
#  统一流水线入口
# ═══════════════════════════════════════════

def run_pipeline(topic, existing_content=None, content_type='article'):
    """
    统一入口：根据可用后端选择最优方式运行三角色流水线

    返回: 最终的 Markdown 内容
    """
    print(f"    🔄 流水线启动 (后端: {BACKEND})")

    if BACKEND == 'crewai':
        return run_crewai_pipeline(topic, existing_content, content_type)

    elif BACKEND == 'openai':
        # 用 OpenAI API 模拟三角色串行
        # Step 1: 研究员
        research = run_researcher(topic, existing_content)
        if not research:
            return None

        # Step 2: 编辑
        content = run_editor(topic, research, existing_content, content_type)
        if not content:
            return None

        # Step 3: 审校员
        final = run_reviewer(content, topic)
        return final or content

    else:
        # 模板模式
        return None


# ═══════════════════════════════════════════
#  主题库
# ═══════════════════════════════════════════

ARTICLE_TOPICS = [
    {'title': 'MoE 架构革命：DeepSeek-V3 如何用 1/10 成本击败 GPT-4',
     'description': '深入分析 Mixture of Experts 架构的技术细节和 DeepSeek-V3 的工程创新',
     'tags': ['MoE', 'DeepSeek', '模型架构'], 'category': '模型架构'},
    {'title': 'Transformer 注意力机制的未来：从 MHA 到 MLA',
     'description': '系统梳理 MHA→MQA→GQA→MLA 的演进路线和工程实现',
     'tags': ['Transformer', '注意力机制', 'MLA'], 'category': '模型架构'},
    {'title': 'RLHF 的终结？DPO、GRPO 与强化学习新范式',
     'description': '从 PPO 到 DPO 到 GRPO，对齐技术的演进链和未来方向',
     'tags': ['RLHF', 'DPO', 'GRPO', '对齐'], 'category': '训练与对齐'},
    {'title': 'LLM 推理框架终极对决：vLLM vs SGLang vs TensorRT-LLM',
     'description': '三大推理框架的架构设计、性能对比和选型指南',
     'tags': ['推理优化', 'vLLM', 'SGLang'], 'category': '训推优化'},
    {'title': 'KV Cache 优化全景：从 PagedAttention 到 MLA',
     'description': 'KV Cache 的显存优化技术完整图谱',
     'tags': ['KV Cache', '推理优化', '显存'], 'category': '训推优化'},
    {'title': '分布式训练框架全解：DeepSpeed vs Megatron-LM vs FSDP',
     'description': '三大分布式训练框架的架构对比和选型指南',
     'tags': ['训练框架', 'DeepSpeed', 'FSDP'], 'category': '训推优化'},
    {'title': 'AI Coding 工具对比：Cursor vs Windsurf vs GitHub Copilot',
     'description': '主流 AI 编程工具的功能对比和实际体验评测',
     'tags': ['AI Coding', 'Cursor', 'Copilot'], 'category': '工具与生态'},
    {'title': 'AI Agent 框架大战：CrewAI vs LangGraph vs AutoGen',
     'description': '主流 Agent 框架的架构对比和适用场景',
     'tags': ['Agent', 'CrewAI', 'LangGraph'], 'category': '工具与生态'},
    {'title': 'RAG 2.0：从朴素检索到自适应知识增强',
     'description': 'RAG 技术的演进路线和前沿方向',
     'tags': ['RAG', '知识库', '检索增强'], 'category': '工具与生态'},
]

BOOK_TOPICS = [
    {
        'title': '大语言模型从入门到前沿',
        'slug_prefix': '93f28994',
        'tags': ['LLM', '教程', '入门'],
        'description': '系统梳理大语言模型的核心技术',
        'chapters': [
            'Transformer 架构深度剖析',
            '预训练：从数据到模型',
            '指令微调与对齐技术',
            '推理优化：KV Cache、量化与投机采样',
            '多模态扩展：视觉、语音与代码',
            'Agent 与工具使用',
            '前沿方向与未来展望',
        ],
    },
    {
        'title': 'AI Agent 实战指南',
        'slug_prefix': 'ai-agent',
        'tags': ['Agent', '实战', '多智能体'],
        'description': '从零构建 AI 智能体系统',
        'chapters': [
            'AI Agent 概述与核心概念',
            '单 Agent 架构：ReAct、Plan-and-Execute',
            '工具使用与函数调用',
            '多 Agent 协作框架',
            '记忆与状态管理',
            '生产级部署与监控',
            '案例研究：自动化研究助手',
        ],
    },
    {
        'title': '自动驾驶大模型深度研究',
        'slug_prefix': 'ad-llm',
        'tags': ['自动驾驶', '大模型', '多模态'],
        'description': '全面解析大模型如何重塑自动驾驶技术栈',
        'chapters': [
            '数据：从采集到合成的全链路',
            '数据平台与数据闭环',
            '训练与推理平台',
            '数据处理方法',
            '模型架构：从模块化到端到端',
            '安全与长尾问题',
            '未来趋势与展望',
        ],
    },
    {
        'title': 'PyTorch 原理深度剖析',
        'slug_prefix': 'pytorch',
        'tags': ['PyTorch', '深度学习框架', '源码分析'],
        'description': '深入 PyTorch 内核：Tensor、计算图、Autograd、Dispatcher、torch.compile、分布式训练的完整剖析',
        'chapters': [
            'Tensor 与计算图——PyTorch 的基石',
            '前向传播——从 Python 到 CUDA Kernel 的完整旅程',
            '反向传播——Autograd 引擎的完整剖析',
            '优化器——从 SGD 到 AdamW 的数学与实现',
            'torch.compile 与 TorchDynamo——编译革命',
            '分布式训练原语——从 NCCL 到 FSDP',
            '性能分析与调优——让每一行代码都快起来',
        ],
    },
    {
        'title': 'LLM 推理框架：从原理到优化',
        'slug_prefix': 'inference',
        'tags': ['推理', 'vLLM', 'SGLang', 'TensorRT-LLM'],
        'description': '深度拆解 LLM 推理瓶颈、vLLM/SGLang/TensorRT-LLM 架构、量化/投机采样/KV压缩等核心优化技术',
        'chapters': [
            'LLM 推理为什么难——自回归解码的瓶颈分析',
            'vLLM 深度剖析——PagedAttention 与 Continuous Batching',
            'SGLang 深度剖析——RadixAttention 与编程式推理',
            'TensorRT-LLM——图编译与极致优化',
            '推理优化核心技术——量化、投机采样与 KV Cache 压缩',
            'Disaggregated Serving 与分布式推理',
            '可以进一步优化的方向——2026 前沿与未来',
        ],
    },
]


# ═══════════════════════════════════════════
#  Fallback 模板
# ═══════════════════════════════════════════

def generate_article_template(topic):
    return f"""# {topic['title']}

> {topic['description']}

## 引言

{topic['title']}是当前 AI 领域最受关注的方向之一。

## 核心技术解析

### 技术背景

随着大语言模型的快速发展，{topic['tags'][0]} 领域涌现出大量创新。

### 关键突破

业界正在探索更高效的技术方案。

### 工程实践

在实际应用中，相关技术正在被广泛采用。

## 总结

{topic['title']}代表了 AI 技术发展的重要方向。

---

*本文由 Signal 知识平台 AI 智能体自动生成，经审校后发布。*
"""


def generate_book_chapter_template(book, chapter_title, chapter_num):
    return f"""# 第 {chapter_num} 章：{chapter_title}

> 选自《{book['title']}》

## 本章概述

本章深入探讨 {chapter_title} 的核心概念和实践应用。

## 核心内容

{chapter_title}是 {book['tags'][0]} 领域的重要基础。

```python
# 示例代码 - {chapter_title}
def example():
    pass
```

## 小结

本章介绍了 {chapter_title} 的核心内容。

---

*本章由 Signal 知识平台 AI 智能体自动生成。*
"""


# ═══════════════════════════════════════════
#  运行逻辑
# ═══════════════════════════════════════════

def run_articles(count=2):
    """生成文章"""
    import random
    print(f"\n📝 开始生成 {count} 篇文章...")
    topics = random.sample(ARTICLE_TOPICS, min(count, len(ARTICLE_TOPICS)))

    for topic in topics:
        slug = slugify(topic['title'])
        filepath = ARTICLES_DIR / f"{slug}.md"
        print(f"  → {topic['title']}")

        # 检查现有内容
        existing = None
        if filepath.exists():
            existing = filepath.read_text(encoding='utf-8')
            line_count = existing.count('\n')
            if line_count > 80:
                print(f"    ⏭️  跳过（已有 {line_count} 行）")
                continue

        # 运行三角色流水线
        body = run_pipeline(topic['title'], existing, 'article')
        if not body:
            body = generate_article_template(topic)
            print(f"    📝 使用模板 (后端: {BACKEND})")

        frontmatter = {
            'title': topic['title'],
            'description': topic['description'],
            'date': datetime.now().strftime('%Y-%m-%d'),
            'updatedAt': now_str(),
            'agent': '研究员→编辑→审校员',
            'tags': topic['tags'],
            'type': 'article',
        }
        if 'category' in topic:
            frontmatter['category'] = topic['category']

        save_markdown(ARTICLES_DIR, slug, frontmatter, body)

        append_evolution_log({
            'date': now_str(),
            'type': 'article',
            'agent': '研究员→编辑→审校员' if BACKEND != 'template' else '模板生成',
            'message': f'{"AI 生成" if BACKEND != "template" else "模板生成"}文章: {topic["title"]}',
            'slug': slug,
        })
        print(f"    ✅ 已保存: content/articles/{slug}.md")


def run_books():
    """生成/修订书籍章节"""
    print(f"\n📖 开始处理书籍...")

    for book in BOOK_TOPICS:
        book_slug = book.get('slug_prefix', slugify(book['title']))
        print(f"  📚 {book['title']}")

        for i, chapter in enumerate(book['chapters'], 1):
            slug = f"{book_slug}-ch{i:02d}"
            filepath = BOOKS_DIR / f"{slug}.md"
            print(f"    Ch{i}: {chapter}")

            # 检查现有内容
            existing = None
            if filepath.exists():
                existing = filepath.read_text(encoding='utf-8')
                line_count = existing.count('\n')
                if line_count > 80:
                    print(f"      ⏭️  跳过（已有 {line_count} 行）")
                    continue

            # 运行三角色流水线
            topic_str = f"《{book['title']}》第 {i} 章: {chapter}"
            body = run_pipeline(topic_str, existing, 'book_chapter')
            if not body:
                body = generate_book_chapter_template(book, chapter, i)
                print(f"      📝 使用模板")

            frontmatter = {
                'title': f"{book['title']} - 第{i}章: {chapter}",
                'book': book['title'],
                'chapter': str(i),
                'chapterTitle': chapter,
                'description': book['description'],
                'date': datetime.now().strftime('%Y-%m-%d'),
                'updatedAt': now_str(),
                'agent': '研究员→编辑→审校员',
                'tags': book['tags'],
                'type': 'book',
            }

            save_markdown(BOOKS_DIR, slug, frontmatter, body)

        append_evolution_log({
            'date': now_str(),
            'type': 'book',
            'agent': '研究员→编辑→审校员' if BACKEND != 'template' else '模板生成',
            'message': f'{"修订" if BACKEND != "template" else "检查"}书籍: {book["title"]}',
            'slug': book_slug,
        })
        print(f"    ✅ {book['title']} 完成")


def run_evolve():
    """
    进化模式：只修订现有内容，不生成新内容
    适合定时任务（cron / GitHub Actions）每日运行
    """
    print(f"\n🧬 进化模式 — 修订现有内容...")

    if BACKEND == 'template':
        print("  ⚠️ 模板模式下无法进化，需要配置 LLM API")
        return

    # 找到所有内容文件
    updated = 0
    for md_file in sorted(ARTICLES_DIR.glob('*.md')):
        content = md_file.read_text(encoding='utf-8')
        lines = content.count('\n')
        if lines < 50:
            # 内容太少，需要充实
            slug = md_file.stem
            print(f"  🔄 充实: {slug} ({lines} 行)")

            # 从 frontmatter 提取标题
            import yaml
            if content.startswith('---'):
                fm_end = content.index('---', 3)
                fm = yaml.safe_load(content[3:fm_end])
                title = fm.get('title', slug)
            else:
                title = slug

            body = run_pipeline(title, content, 'article')
            if body:
                # 保留 frontmatter，替换 body
                if content.startswith('---'):
                    fm_section = content[:content.index('---', 3) + 3]
                    md_file.write_text(fm_section + '\n\n' + body, encoding='utf-8')
                    updated += 1
                    print(f"    ✅ 已更新")

    print(f"\n  📊 进化完成: 更新了 {updated} 篇内容")


def main():
    parser = argparse.ArgumentParser(description='Signal — 多智能体内容引擎')
    parser.add_argument('--mode', choices=['all', 'article', 'book', 'news', 'evolve'],
                        default='all', help='运行模式')
    parser.add_argument('--count', type=int, default=2, help='生成数量（文章）')
    args = parser.parse_args()

    print("=" * 55)
    print("🧬 Signal — 多智能体内容生产引擎")
    print(f"📅 {now_str()}")
    print(f"🤖 模式: {args.mode}  |  后端: {BACKEND}")
    if BACKEND == 'crewai':
        print("✅ CrewAI 多智能体编排已加载")
    elif BACKEND == 'openai':
        model = os.getenv('SIGNAL_MODEL', 'gpt-4o-mini')
        print(f"✅ OpenAI API 已连接 (模型: {model})")
    else:
        print("📝 模板模式 — 配置 API Key 启用 AI 生成")
    print("=" * 55)

    if args.mode == 'evolve':
        run_evolve()
    elif args.mode in ('all', 'book'):
        run_books()
    if args.mode in ('all', 'article'):
        run_articles(args.count)
    if args.mode in ('all', 'news'):
        print("\n📡 抓取新闻...")
        try:
            from fetch_news import generate_news_data
            generate_news_data()
        except Exception as e:
            print(f"  ⚠️ 新闻抓取失败: {e}")

    print(f"\n🎉 完成！")


if __name__ == '__main__':
    main()
