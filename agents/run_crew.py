"""
Signal — 真实多智能体内容生产引擎

角色体系（对应 ai-wiki.md B1-B9/C/D/E）：
  📡 B1 声浪编辑   — 生成 AI 行业动态，追加到 news-feed.json
  ✍️  B2 内容编辑   — 研究员→编辑→审校员三角色流水线，生成文章/书籍章节
  🤖 B3 模型编辑   — 更新 models.json（模型卡）和 benchmarks.json（评测榜）
  📊 B4 数据编辑   — 更新 IdeaRadar.js 创业信号（signal/signalDate）
  🗄️  B5 系统编辑   — 汇聚本次运行摘要，追加 evolution-log
  🏗️  B6 Infra 编辑 — 检查 K8s/数据湖仓工具最新版本，更新 data-infra-data.js
  🦾 B7 VLA 编辑   — 追踪 VLA/自动驾驶最新进展，追加 evolution-log
  🔭 B8 战略编辑   — 扫描 GitHub 生态机会，更新 strategy-data.js
  🔬 B9 实验室编辑  — 更新 lab-data.js 实验项目 + quant-data.js 量化摘要
  🔍 C  QA 检查    — 静态完整性检查（papers/news/evolution-log）
  🚀 D  发布       — git add/commit（需 --publish 参数）
  🎨 E  设计师     — GitHub 生态深度扫描，更新 SITE_ROADMAP（--mode designer）

支持四种 LLM 后端（按优先级）:
  1. Claude Code CLI（claude -p）— 本地 Claude Code 直接驱动，无需 API Key
  2. CrewAI（pip install crewai）— 完整的多智能体编排
  3. OpenAI API（pip install openai）— 兼容 DeepSeek/Ollama/Hunyuan
  4. 模板模式 — 无任何后端时的 fallback
"""

import os
import sys
import json
import re
import hashlib
import shutil
import subprocess
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

def _find_claude_bin():
    """查找 claude CLI 可执行文件路径"""
    # 1. PATH 中查找
    p = shutil.which('claude')
    if p:
        return p
    # 2. 已知路径 fallback（nvm 安装路径）
    known_paths = [
        Path.home() / '.nvm/versions/node/v20.20.2/lib/node_modules/@tencent/claude-code-internal/node_modules/.bin/claude',
        Path.home() / '.nvm/versions/node/v22.0.0/lib/node_modules/@anthropic-ai/claude-code/node_modules/.bin/claude',
        Path('/usr/local/bin/claude'),
        Path('/usr/bin/claude'),
    ]
    for kp in known_paths:
        if kp.exists():
            return str(kp)
    # 3. 动态搜索 nvm 目录下所有 claude
    nvm_root = Path.home() / '.nvm/versions/node'
    if nvm_root.exists():
        matches = list(nvm_root.glob('*/lib/node_modules/**/bin/claude'))
        if matches:
            return str(matches[0])
    return None

CLAUDE_BIN = _find_claude_bin()
BACKEND = 'template'  # 默认

if CLAUDE_BIN:
    BACKEND = 'claude_code'
else:
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

print(f"[Signal] 后端: {BACKEND}" + (f" (claude: {CLAUDE_BIN})" if BACKEND == 'claude_code' else ""))

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
    # 保留最多 500 条，防止无限增长（修复原 logs[:50] 截断 bug）
    EVOLUTION_LOG.write_text(json.dumps(logs[:500], ensure_ascii=False, indent=2), encoding='utf-8')


# ═══════════════════════════════════════════
#  JSON 健壮解析工具
# ═══════════════════════════════════════════

def _parse_json_robust(raw: str):
    """
    对 LLM 返回的 JSON 做多层容错处理：
    1. 剥除 markdown ```json ... ``` 围栏
    2. 剥除非 JSON 前缀/后缀文字（取第一个 { 或 [ 到最后一个 } 或 ] 之间的内容）
    3. 尝试直接 json.loads
    4. 失败则用 re 修复常见问题后再试
    5. 若包含多个顶层对象（Extra data），只取第一个
    返回解析结果，失败时 raise ValueError
    """
    if not raw or not raw.strip():
        raise ValueError("LLM 返回空内容")

    # Step1: 剥除 markdown 围栏
    text = raw.strip()
    text = re.sub(r'^```(?:json)?\s*', '', text, flags=re.MULTILINE)
    text = re.sub(r'```\s*$', '', text, flags=re.MULTILINE)
    text = text.strip()

    # Step2: 提取第一个合法 JSON 片段（{ ... } 或 [ ... ]）
    def _extract_json_block(s):
        for start_char, end_char in [('{', '}'), ('[', ']')]:
            idx = s.find(start_char)
            if idx == -1:
                continue
            # 从 idx 向后找匹配的结尾
            depth = 0
            in_str = False
            escape = False
            for i, c in enumerate(s[idx:], idx):
                if escape:
                    escape = False
                    continue
                if c == '\\' and in_str:
                    escape = True
                    continue
                if c == '"' and not escape:
                    in_str = not in_str
                    continue
                if in_str:
                    continue
                if c == start_char:
                    depth += 1
                elif c == end_char:
                    depth -= 1
                    if depth == 0:
                        return s[idx:i+1]
        return s  # 原样返回

    # Step3: 尝试直接解析
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Step4: 提取第一个完整 JSON 块
    block = _extract_json_block(text)
    try:
        return json.loads(block)
    except json.JSONDecodeError:
        pass

    # Step5: 修复常见问题后再试
    fixed = block
    # 去掉行尾注释 // ...
    fixed = re.sub(r'//[^\n"]*\n', '\n', fixed)
    # 去掉块注释 /* ... */
    fixed = re.sub(r'/\*.*?\*/', '', fixed, flags=re.DOTALL)
    # 修复 trailing comma before } or ]
    fixed = re.sub(r',\s*([}\]])', r'\1', fixed)
    # 修复缺少逗号：} 后紧跟 { 或 "key"（对象数组场景）
    fixed = re.sub(r'}\s*\n\s*{', '},\n{', fixed)
    fixed = re.sub(r']\s*\n\s*\[', '],\n[', fixed)
    try:
        return json.loads(fixed)
    except json.JSONDecodeError as e:
        raise ValueError(f"JSON 解析失败（多层修复后仍无效）: {e}\n原始片段[:200]: {block[:200]}")


# ═══════════════════════════════════════════
#  OpenAI API 多角色模拟
# ═══════════════════════════════════════════

def call_llm(system_prompt, user_prompt, model=None):
    """调用 LLM API"""
    if BACKEND == 'template':
        return None

    if BACKEND == 'claude_code':
        # 通过 claude -p 子进程调用，无需 API Key
        # 使用 --dangerously-skip-permissions 让 claude 拥有完整工具权限（Bash/Read/Edit/WebFetch）
        # 从 ROOT 目录运行，让 claude 能访问所有项目文件
        full_prompt = f"{system_prompt}\n\n---\n\n{user_prompt}"
        try:
            r = subprocess.run(
                [CLAUDE_BIN, '-p', '--dangerously-skip-permissions', full_prompt],
                capture_output=True,
                text=True,
                timeout=1200,  # 单次调用最多 20 分钟
                cwd=str(ROOT),  # signal 项目根目录，claude 可访问所有文件
            )
            if r.returncode == 0 and r.stdout.strip():
                return r.stdout.strip()
            if r.stderr:
                print(f"    ⚠️ claude stderr: {r.stderr[:200]}")
            return None
        except subprocess.TimeoutExpired:
            print("    ⚠️ claude 调用超时 (600s)")
            return None
        except Exception as e:
            print(f"    ⚠️ claude 调用失败: {e}")
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

重点关注领域（AI Infra 开源项目）：
- Kubernetes 生态：Volcano/Koordinator/HAMi/Kueue 调度器、GPU 虚拟化、AI 工作负载 CRD
- Apache Iceberg：表格式演进、Puffin 统计、Deletion Vector、REST Catalog、PyIceberg
- Apache Airflow 3.x：Task SDK、Asset Partitioning、DAG Bundle、FastAPI 迁移
- MLflow 3.x：LLM Tracing、AI Gateway、GenAI 评估、Unity Catalog 集成
- Unity Catalog：AI/ML 资产管理、多引擎集成、权限模型演进
- Apache Spark 4.x：Python UDF、Spark Connect、GPU 加速、Iceberg/Delta 集成
- Ray 2.x：Ray Data、Ray Serve、KubeRay、分布式训练优化

输出格式：
## 研究报告
### 核心发现
- ...
### 关键论文/项目/Release
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

    elif BACKEND == 'claude_code':
        # 单次调用——三角色合一，避免 3× subprocess 超时累积
        word_count = '3000-5000' if content_type == 'book_chapter' else '1500-2500'
        system = f"""你是 Signal 知识平台的内容生产团队，由研究员、编辑和审校员三个角色组成。
请按以下流程完成内容创作：
1. 【研究员】调研主题最新技术进展，列出 3-5 个核心技术要点
2. 【编辑】基于调研撰写中文技术文章（{word_count}字，Markdown 格式，含代码块/表格/公式）
3. 【审校员】检查技术准确性、格式规范性，输出最终版本

直接输出最终的 Markdown 文章正文，不要 frontmatter，不要输出调研过程或审校意见。"""
        user = f"主题: {topic}"
        if existing_content:
            user += f"\n\n现有内容（参考/更新）:\n{existing_content[:2000]}"
        result = call_llm(system, user)
        if result:
            print(f"    ✅ 单次合并生成完成 ({len(result)} 字)")
        return result

    elif BACKEND == 'openai':
        # 串行三角色：研究员 → 编辑 → 审校员
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
    # ── AI Infra 开源项目进展追踪 ──────────────────────────────
    {'title': 'Kubernetes AI Infra 进展追踪：调度器、GPU 虚拟化与 AI 工作负载新特性',
     'description': '追踪 K8s 社区最新进展：Volcano/Koordinator/HAMi/Kueue 调度器更新、GPU 细粒度调度新特性、AI 工作负载 CRD 演进',
     'tags': ['Kubernetes', 'GPU 调度', 'Volcano', 'HAMi', 'AI Infra'], 'category': 'AI Infra',
     'oss_watch': ['kubernetes/kubernetes', 'volcano-sh/volcano', 'koordinator-sh/koordinator',
                   'Project-HAMi/HAMi', 'kubernetes-sigs/kueue', 'google/dynamic-workload-scheduler']},
    {'title': 'Apache Iceberg 社区进展：新版本特性、性能优化与生态集成',
     'description': '追踪 Iceberg 最新 Release 亮点：Puffin 统计文件、Deletion Vector、REST Catalog 演进、多引擎兼容性更新',
     'tags': ['Iceberg', '数据湖仓', '开放表格式', 'AI Infra'], 'category': 'AI Infra',
     'oss_watch': ['apache/iceberg', 'apache/iceberg-python'],
     'source_path': '/Users/harrisyu/WorkBuddy/20260409114249/oss-repos/iceberg-1.10.1'},
    {'title': 'Apache Airflow 3.x 社区进展：Task SDK、Asset Partitioning 与调度新特性',
     'description': '追踪 Airflow 3.x 最新动态：Task SDK 独立化进展、Asset Partitioning 落地、FastAPI 迁移、Provider 生态更新',
     'tags': ['Airflow', '工作流编排', 'Task SDK', 'AI Infra'], 'category': 'AI Infra',
     'oss_watch': ['apache/airflow'],
     'source_path': '/Users/harrisyu/WorkBuddy/20260409114249/oss-repos/airflow-3.2.1'},
    {'title': 'MLflow 3.x 社区进展：Tracing、AI Gateway 与 GenAI 评估新特性',
     'description': '追踪 MLflow 最新 Release：LLM Tracing 增强、AI Gateway 多模型路由、GenAI 评估框架、Unity Catalog 集成进展',
     'tags': ['MLflow', 'MLOps', 'LLM Tracing', 'AI Infra'], 'category': 'AI Infra',
     'oss_watch': ['mlflow/mlflow'],
     'source_path': '/Users/harrisyu/WorkBuddy/20260409114249/oss-repos/mlflow-3.11.1'},
    {'title': 'Unity Catalog 社区进展：开源数据目录的 AI 资产管理与多引擎集成',
     'description': '追踪 Unity Catalog 最新动态：AI/ML 资产管理增强、Iceberg REST Catalog 兼容、Spark/Trino/DuckDB 集成进展',
     'tags': ['Unity Catalog', '数据治理', 'AI Infra'], 'category': 'AI Infra',
     'oss_watch': ['unitycatalog/unitycatalog'],
     'source_path': '/Users/harrisyu/WorkBuddy/20260409114249/oss-repos/unitycatalog-0.4.1'},
    {'title': 'Apache Spark 社区进展：Spark 4.x 新特性与 AI/ML 工作负载优化',
     'description': '追踪 Spark 4.x 最新动态：Python UDF 性能提升、Spark Connect 演进、GPU 加速、与 Iceberg/Delta 深度集成',
     'tags': ['Spark', '大数据', 'Spark 4.x', 'AI Infra'], 'category': 'AI Infra',
     'oss_watch': ['apache/spark']},
    {'title': 'Ray 社区进展：Ray 2.x 分布式 AI 框架新特性与生产落地',
     'description': '追踪 Ray 最新动态：Ray Data 流式处理、Ray Serve 推理优化、RayJob on K8s、KubeRay Operator 更新',
     'tags': ['Ray', '分布式计算', 'RayServe', 'AI Infra'], 'category': 'AI Infra',
     'oss_watch': ['ray-project/ray', 'ray-project/kuberay']},
    # ── 机器人仿真 & 世界模型 ──────────────────────────────────────
    {'title': '开源机器人仿真平台全景：Genesis vs ManiSkill3 vs IsaacGym vs MuJoCo',
     'description': '深度对比 2025-2026 年最重要的开源机器人仿真平台：速度、任务覆盖、Sim2Real 能力、硬件兼容性与生态成熟度。重点分析 Genesis 80× 加速原理、ManiSkill3 SAPIEN GPU 渲染架构、IsaacLab 迁移路线，以及各平台在 VLA/具身智能训练中的实战表现。同时追踪最新仿真论文（arXiv cs.RO）和开源 benchmark 进展。',
     'tags': ['机器人仿真', 'Genesis', 'ManiSkill', 'IsaacGym', '具身智能', 'Sim2Real'], 'category': '具身智能'},
    {'title': '腾讯混元3D世界模型（HY-World 2.0）深度解析：从全景生成到可交互3DGS世界',
     'description': '深入分析腾讯 HY-World 2.0 的四阶段生成架构：HY-Pano 2.0（360°全景生成）→ WorldNav（语义感知路径规划）→ WorldStereo 2.0（全局几何记忆扩展）→ WorldMirror 2.0（3DGS+Mesh混合重建）。评估其在机器人仿真数据生成、游戏引擎集成、数字孪生场景中的实际效果，与 GAIA-1、DreamerV3、Cosmos、UniSim 等世界模型的技术路线对比，以及开源策略对具身智能生态的影响。',
     'tags': ['混元', 'HY-World', '世界模型', '3DGS', '腾讯', '具身智能', '3D生成'], 'category': '世界模型'},
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
    # ── 开源项目源码解析系列 ──────────────────────────────────────
    {
        'title': 'Apache Iceberg 源码深度解析（v1.10.1）',
        'slug_prefix': 'iceberg-src',
        'tags': ['Iceberg', '数据湖仓', '源码解析', '开放表格式'],
        'description': '基于 Apache Iceberg 1.10.1 源码，深度解析开放表格式的核心设计：三层元数据、Snapshot 隔离、Schema/Partition 演化、Compaction、行级删除与 PyIceberg',
        'source_repo': 'https://github.com/apache/iceberg',
        'source_version': 'apache-iceberg-1.10.1',
        'source_path': '/Users/harrisyu/WorkBuddy/20260409114249/oss-repos/iceberg-1.10.1',
        'chapters': [
            'Iceberg 架构总览——为什么需要开放表格式（v1.10.1 核心模块）',
            '三层元数据结构——Catalog / TableMetadata / Snapshot 源码剖析',
            'Snapshot 隔离与时间旅行——MVCC 实现与增量读取 API',
            'Schema 演化——field-id 机制与安全类型变更源码解析',
            'Partition Evolution——隐式分区与 Transform 源码实现',
            'Compaction 深度解析——RewriteDataFilesAction / Sort / Z-Order',
            '行级删除——Position Delete vs Equality Delete 与 MERGE INTO 实现',
            'PyIceberg——Python 原生 API 与 REST Catalog 集成',
        ],
    },
    {
        'title': 'Apache Airflow 3.x 源码深度解析（v3.2.1）',
        'slug_prefix': 'airflow-src',
        'tags': ['Airflow', '工作流编排', '源码解析', 'Kubernetes'],
        'description': '基于 Apache Airflow 3.2.1 源码，深度解析 Airflow 3.x 重大架构变革：Task SDK 独立化、FastAPI 重写、Asset Partitioning、DAG Bundle、Scheduler 调度循环与 KubernetesExecutor',
        'source_repo': 'https://github.com/apache/airflow',
        'source_version': '3.2.1',
        'source_path': '/Users/harrisyu/WorkBuddy/20260409114249/oss-repos/airflow-3.2.1',
        'chapters': [
            'Airflow 3.x 架构革命——Task SDK 独立化与 FastAPI 重写（vs 2.x 对比）',
            'Scheduler 调度循环——_run_scheduler_loop() 与 TaskInstance 状态机源码',
            'KubernetesExecutor——execute_async() / sync() 与 Pod Spec 动态生成',
            'DAG 定义新范式——TaskFlow API / @task 装饰器 / Asset 数据感知调度',
            'Asset Partitioning——3.2 新特性：分区级数据感知触发源码解析',
            'Deferrable Operator——Triggerer 异步等待机制与 asyncio 实现',
            'DAG Bundle 与 Git 同步——3.x 新 DAG 分发机制源码剖析',
            '监控与可观测性——StatsD 指标 / OpenTelemetry / 告警规则',
        ],
    },
    {
        'title': 'Unity Catalog 源码深度解析（v0.4.1）',
        'slug_prefix': 'unitycatalog-src',
        'tags': ['Unity Catalog', '数据治理', '源码解析', 'Iceberg', 'Delta Lake'],
        'description': '基于 Unity Catalog 0.4.1 源码，深度解析开源数据目录的核心设计：三层命名空间、Iceberg REST Catalog 兼容、Delta 协议集成、权限模型（JCasbin）与 AI/ML 资产管理',
        'source_repo': 'https://github.com/unitycatalog/unitycatalog',
        'source_version': 'v0.4.1',
        'source_path': '/Users/harrisyu/WorkBuddy/20260409114249/oss-repos/unitycatalog-0.4.1',
        'chapters': [
            'Unity Catalog 架构总览——三层命名空间（Catalog/Schema/Table）与 Vert.x 服务端',
            'REST API 设计——OpenAPI 3.0 规范与 Catalog/Schema/Table CRUD 源码',
            'Iceberg REST Catalog 兼容——IcebergRestCatalog 接口实现源码解析',
            'Delta 协议集成——Delta Commits API 与 Checkpoint 管理源码',
            '权限模型——JCasbin 授权引擎与 @AuthorizeExpression 注解机制',
            '临时凭证——S3/ADLS/GCS 临时访问凭证生成源码（STS/SAS Token）',
            'AI/ML 资产管理——Model / Function / Volume 注册与版本管理',
            '多引擎集成——Spark / Trino / DuckDB / PyIceberg 接入实战',
        ],
    },
    {
        'title': 'MLflow 3.x 源码深度解析（v3.11.1）',
        'slug_prefix': 'mlflow-src',
        'tags': ['MLflow', 'MLOps', '源码解析', '实验追踪', '模型注册'],
        'description': '基于 MLflow 3.11.1 源码，深度解析 MLOps 平台核心：Tracking Server / Model Registry / Artifact Store 三层架构，以及 3.x 新特性：AI Gateway、Tracing、GenAI 评估与 Unity Catalog 集成',
        'source_repo': 'https://github.com/mlflow/mlflow',
        'source_version': 'v3.11.1',
        'source_path': '/Users/harrisyu/WorkBuddy/20260409114249/oss-repos/mlflow-3.11.1',
        'chapters': [
            'MLflow 3.x 架构总览——Tracking / Registry / Artifacts 三层设计与 3.x 新特性',
            'Tracking Server 源码——Run / Metric / Param / Tag 的存储与查询实现',
            'Fluent API 源码——mlflow.start_run() / log_metric() 的调用链路解析',
            'Model Registry 源码——RegisteredModel / ModelVersion 状态机与审批流',
            'Artifact Store——S3/ADLS/GCS 多后端抽象与 MLmodel 格式规范',
            'MLflow Tracing——3.x 新特性：LLM 调用链路追踪与 OpenTelemetry 集成',
            'AI Gateway——统一 LLM 代理：OpenAI/Anthropic/Bedrock 路由源码解析',
            'GenAI 评估——mlflow.evaluate() 与 LLM-as-Judge 评估框架源码',
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
#  B1 声浪编辑
# ═══════════════════════════════════════════

# 新闻分类 ID 列表（与 categories.json 对应）
NEWS_CATEGORIES = ['model-release', 'research', 'infra', 'opensource', 'industry', 'safety']

def run_b1_news(count=3):
    """
    B1 声浪编辑 — 使用 ai-wiki.md §六 B1 完整提示词，让 claude 自主采集真实新闻
    claude 拥有完整工具权限：Bash(curl 验链) / Read / Edit / WebFetch
    返回 0（写入由 claude 自主完成，无需 Python 层解析）
    """
    print(f"\n📡 B1 声浪编辑 — 启动自主采集（使用 ai-wiki.md B1 完整提示词）...")

    if BACKEND == 'template':
        print("  ⚠️ 模板模式，跳过 B1（需要 LLM 后端）")
        return 0

    today = datetime.now().strftime('%Y-%m-%d')

    # B1 新闻采集提示词 — 用 WebSearch 搜索引擎聚合，不逐站访问
    yesterday = (datetime.now() - __import__('datetime').timedelta(days=1)).strftime('%Y-%m-%d')
    prompt = f"""你是 Signal 知识平台的 AI 新闻编辑员，今天日期：{today}。

## ⚡ 采集策略（搜索引擎聚合版）

**不要逐个访问公司博客或媒体网站**。直接用 **WebSearch** 做 3 条搜索，一次拿到跨来源的新闻列表：

### 第一步：3 条 WebSearch 搜索（全部执行）

```
搜索1：AI model release OR benchmark OR agent framework site:huggingface.co OR site:deepmind.google OR site:anthropic.com OR site:openai.com after:{yesterday}
搜索2：AI infrastructure OR LLM deployment OR open source release site:github.com OR site:venturebeat.com OR site:techcrunch.com after:{yesterday}
搜索3：人工智能 大模型 发布 OR 融资 OR 开源 after:{yesterday}
```

每条搜索返回的结果里，提取：**标题、来源域名、日期、完整 URL**，汇总成候选列表（预计 15-25 条）。

### 第二步：批量 curl 验链（一条命令并发）

```bash
for url in URL1 URL2 URL3 ...; do
  curl -s -o /dev/null -w "$url %{{http_code}}\\n" --max-time 8 -L -A "Mozilla/5.0" "$url" &
done
wait
```
只保留 200/301/302 的条目。

### 第三步：去重 + 写入

1. 读取 `content/news/news-feed.json` 前 80 行去重（标题/URL 相近的跳过）
2. 读取 `src/components/IndustryNewsFeed.js` 前 60 行了解已有全行业动态

---

## ⛔ 真实性铁律

1. **每条新闻必须来自 WebSearch 实际返回的结果**，严禁凭印象编造
2. **url 字段必须是 curl 验证过 200/301/302 的真实链接**
3. 不确定时宁可少写，禁止凑数

---

## 写入任务

### 声浪 content/news/news-feed.json
- 写入 news-feed.json **头部**，目标 6-10 条，**date 必须含今天 {today}**
- 格式：`{{ "id": "news-{today.replace('-','')}-xx", "title": "...", "summary": "80-150字中文", "source": "...", "url": "...", "date": "{today}", "category": "llm|infra|agent|data|industry", "tags": [...], "hot": true, "region": "global|china" }}`
- **修改前先读文件确认 JSON 结构，用 Edit 在第一个 `[` 后插入新条目，不要整体重写**
- 写完后：`node -e "JSON.parse(require('fs').readFileSync('content/news/news-feed.json','utf8')); console.log('JSON OK')"` 验证

### 全行业动态 src/components/IndustryNewsFeed.js
- 在 NEWS_DATA 数组头部插入 4-6 条，聚焦**公司商业动态**（财报/融资/定价/并购），非技术发布
- 国内外各半，每条 title 含「公司名 + 具体动作」
- **修改前先读文件前 30 行确认数组结构**

### 新闻写入后联动
- 若有新模型发布/Benchmark 刷新 → 更新 `content/benchmarks/benchmarks.json`
- 若有架构创新 → 在 `src/components/ArchEvolution.js` TIMELINE 头部追加

### 论文/开源项目 → B2 研究文章联动（重要！）
收集到的新闻中，**凡涉及以下类型的条目，必须在 `content/articles/` 目录写入（或更新）对应深度研究文章**：
- arXiv 论文 / 顶会（NeurIPS/ICML/ICLR/CVPR/ICCV/CoRL/RSS）论文
- 重大开源项目发布（GitHub stars > 1k 或来自知名团队）
- 机器人仿真平台、具身智能 benchmark、世界模型、VLA 相关

操作方式：
1. 从搜索结果提取论文标题 + 摘要 + 关键贡献
2. 在 `content/articles/` 下新建 `<slugified-title>.md`（或更新已有文件）
3. 文章结构：frontmatter（title/date/tags/summary）+ 背景 + 核心贡献 + 技术细节 + 意义与局限，**中文，1500-3000字**
4. **仿真/benchmark/世界模型类论文优先写入**

---

## 完成后输出

最后输出一行：`✅ B1完成：声浪+N条({today})，全行业动态+M条，论文文章+P篇`
"""

    result = call_llm("", prompt)
    if not result:
        print("  ⚠️ B1 claude 未返回结果")
        return 0

    print(f"  ✅ B1 完成（claude 自主完成写入）")
    return 1


# ═══════════════════════════════════════════
#  B3 模型编辑员
# ═══════════════════════════════════════════

def run_b3_models(model_count=2, benchmark_updates=1):
    """
    B3 模型编辑员 — 使用 ai-wiki.md §六 B3 完整提示词，让 claude 自主追踪并写入
    写入：content/gallery/models.json, content/benchmarks/benchmarks.json
    返回: (models_added, benchmarks_updated)
    """
    print(f"\n🤖 B3 模型编辑员 — 启动自主追踪（使用 ai-wiki.md B3 完整提示词）...")

    if BACKEND == 'template':
        print("  ⚠️ 模板模式，跳过 B3（需要 LLM 后端）")
        return 0, 0

    today = datetime.now().strftime('%Y-%m-%d')

    prompt = f"""你是 Signal 知识平台的 AI 模型编辑员，职责是**自主追踪模型发布 → 补充模型卡片/排行榜/架构演进 → 更新本模块 Roadmap**。
你独立完成从信息追踪到数据写入的全流程，不依赖中央采集员。

今天是 {today}。

## 前置步骤

1. 读取 /Users/harrisyu/WorkBuddy/20260409114249/signal/ai-wiki.md，了解当前模块进展和目录结构。
2. 读取 `src/lib/strategy-data.js` 中 `SITE_ROADMAP.topOpportunities` 和 `productPlans`，了解本模块的重点方向和待完成任务。

> 📌 **启动检查清单（读完 Roadmap 后，在对话中输出以下确认）**：
> - 本模块当前有哪些 🔴 高优待完成条目？（列出 1-3 条）
> - 本模块有哪些已知内容盲区或过期数据需要本次修复？
> - 本次执行的重点是什么？（一句话概括）
>
> 如果 Roadmap 中本模块无待完成条目，则按默认日常任务执行。

3. 自主扫描各厂商官方博客、HuggingFace、Benchmark 榜单，获取最新模型发布和评测数据，所有引用 URL 必须真实可访问。

---

## 写入任务（全程免审批）

### 任务 1：更新模型数据 content/gallery/models.json（每次至少补充 2 个模型）

- 重点补充：自动驾驶专用模型 + 最新基础模型
- ⚡ **Roadmap 模型中心补全**（🔴高优）：优先补充 Qwen3 系列 / Gemini 2.5 系列 / Claude 4 系列 / GPT-5 系列最新模型卡片，国产开源模型（DeepSeek / InternLM）同步跟进
- models.json 是大文件，使用 replace_in_file 追加，不要整体重写
- 🔬 **架构创新追踪**：每次新增模型时，若该模型在 Attention / FFN / 位置编码 / 路由机制 / 输出头等关键 Layer 有创新，必须同步更新 ai-wiki.md 中「模型模块 → 近期架构创新追踪」表格

#### 模型卡片必填字段规范

每个模型卡片必须包含以下字段：id, name, org, type, typeLabel, typeIcon, open, params, date, context, attention, factSheet(highlight/training/inference/benchmarks), highlights, textArch, tags

textArch 是必填 ASCII 架构图，不得留空（Dense/MoE/VLA 模板参考 ai-wiki.md §六 B3）

#### 排行榜刷新（每次迭代必须执行）

数据文件：`content/benchmarks/benchmarks.json`
- 检查 `date` 字段是否落后当天超过 7 天，若是则必须刷新
- 将 date 更新为 {today}，根据最新公开 Benchmark 数据调整排名
- 数据来源（只能引用真实公开数据，禁止编造分数）：LMSYS Chatbot Arena / OpenCompass / SWE-bench / 各厂商官方技术报告

### 任务 2：更新本模块 Roadmap

- 使用 `replace_in_file` 局部更新 `src/lib/strategy-data.js` 中 `SITE_ROADMAP`
- 严禁全量重写 strategy-data.js

## 重要注意事项

- 所有引用 URL 必须真实可访问（写入前 curl 验证）
- 所有文件使用 UTF-8 编码，中文直接写入，严禁 Unicode 转义（\\uXXXX）
- 大文件（isBigFile=true）使用 replace_in_file 或 multi_replace，不要用 edit_file
- ⚡ **前端保护（强制）**：所有 `.js` 文件写入完成后，必须验证 http://localhost:3000 是否正常

---

## 🔍 完成后自检（每次必做）

逐条检查本次写入的所有内容，URL curl 验证返回 404/5xx 的立即删除，输出一行自检结论。

- 写入完成后，**明确告知系统编辑员**："B3 模型数据更新完成"
"""

    result = call_llm("", prompt)
    if not result:
        print("  ⚠️ B3 claude 未返回结果")
        return 0, 0

    print(f"  ✅ B3 完成（claude 自主完成写入）")
    return 1, 1


# ═══════════════════════════════════════════
#  B4 数据编辑员
# ═══════════════════════════════════════════

def run_b4_data():
    """
    B4 数据编辑员 — 使用 ai-wiki.md §六 B4 完整提示词，让 claude 自主追踪并写入
    写入：src/components/IdeaRadar.js, src/app/economy/page.js
    返回: ideas_updated
    """
    print(f"\n📊 B4 数据编辑员 — 启动自主追踪（使用 ai-wiki.md B4 完整提示词）...")

    if BACKEND == 'template':
        print("  ⚠️ 模板模式，跳过 B4（需要 LLM 后端）")
        return 0

    today = datetime.now().strftime('%Y-%m-%d')

    prompt = f"""你是 Signal 知识平台的 AI 数据编辑员，职责是**自主追踪市场/创业信号 → 更新创业雷达/经济研究 → 更新本模块 Roadmap**。
你独立完成从信号追踪到数据写入的全流程，不依赖中央采集员。

今天是 {today}。

## 前置步骤

1. 读取 /Users/harrisyu/WorkBuddy/20260409114249/signal/ai-wiki.md，了解当前模块进展。
2. 读取 `src/lib/strategy-data.js` 中 `SITE_ROADMAP.topOpportunities`，了解本模块的重点方向。

> 📌 **启动检查清单（读完 Roadmap 后，在对话中输出以下确认）**：
> - 本模块当前有哪些 🔴 高优待完成条目？（列出 1-3 条）
> - 本模块有哪些已知内容盲区或过期数据需要本次修复？
> - 本次执行的重点是什么？（一句话概括）
>
> 如果 Roadmap 中本模块无待完成条目，则按默认日常任务执行。

3. 自主扫描 VC 动态、创业新闻、宏观经济数据源，获取最新市场信号，所有引用 URL 必须真实可访问。

---

## 写入任务（全程免审批）

### 任务 1：更新创业雷达 src/components/IdeaRadar.js（每日更新）

- 更新 IDEAS 数组中各方向的 signalDate 和 signal 标注（🔥热点/👀关注）
- 每日至少更新 2-3 个方向的信号标注，每周新增 ≥1 个创业方向

### 任务 2：更新经济研究 src/app/economy/page.js（每日更新）

- 重大数据发布日（非农/CPI/FOMC 等）：当日必须更新对应 Tab
- 普通交易日：至少更新汇率数据 + 1 条市场动态

### 任务 3：更新本模块 Roadmap

- 读取 `src/lib/strategy-data.js` 中 `SITE_ROADMAP`
- 若本轮发现新的创业方向或市场机会，追加到 `topOpportunities`
- 使用 `replace_in_file` 局部更新，严禁全量重写 strategy-data.js

## 重要注意事项

- 所有引用 URL 必须真实可访问（写入前 curl 验证）
- 所有文件使用 UTF-8 编码，中文直接写入，严禁 Unicode 转义（\\uXXXX）
- ⚡ **前端保护（强制）**：所有 `.js` 文件写入完成后，必须验证 http://localhost:3000 是否正常

---

## 🔍 完成后自检（每次必做）

逐条检查本次写入的所有内容，URL curl 验证返回 404/5xx 的立即删除，输出一行自检结论。

- 写入完成后，**明确告知系统编辑员**："B4 数据更新完成"
"""

    result = call_llm("", prompt)
    if not result:
        print("  ⚠️ B4 claude 未返回结果")
        return 0

    print(f"  ✅ B4 完成（claude 自主完成写入）")
    return 1


# ═══════════════════════════════════════════
#  B6 Infra 编辑员
# ═══════════════════════════════════════════

def run_b6_infra():
    """
    B6 Infra 编辑员 — 自主扫描 AI Infra 开源项目 GitHub Releases，更新 data-infra-data.js
    claude 使用完整 B6 提示词，通过 curl 验证版本，直接写入文件
    返回: "" (claude 自主写入)
    """
    print(f"\n☸️  B6 Infra 编辑员 — 扫描 GitHub Releases 更新 AI Infra 版本信息...")

    if BACKEND == 'template':
        print("  ⚠️ 模板模式，跳过 B6（需要 LLM 后端）")
        return ""

    today = datetime.now().strftime('%Y-%m-%d')

    prompt = f"""你是 Signal 知识平台的 AI Infra 编辑员，职责是**自主追踪 AI Infra 开源项目进展 → 更新闭环 Infra 页面所有 Tab → 更新本模块 Roadmap**。
你独立完成从信息追踪到页面更新的全流程，不依赖中央采集员。

今天是 {today}。

## 前置步骤

1. 读取 /Users/harrisyu/WorkBuddy/20260409114249/signal/ai-wiki.md，了解当前 `/data-infra/` 页面的所有 Tab 内容和数据结构。
2. 读取 `src/lib/strategy-data.js` 中 `SITE_ROADMAP.topOpportunities` 和 `productPlans`，了解本模块的重点方向和待完成任务。

> 📌 **启动检查清单（读完 Roadmap 后，在对话中输出以下确认）**：
> - 本模块当前有哪些 🔴 高优待完成条目？（列出 1-3 条）
> - 本模块有哪些已知内容盲区或过期数据需要本次修复？
> - 本次执行的重点是什么？（一句话概括）
>
> 如果 Roadmap 中本模块无待完成条目，则按默认日常任务执行。

3. 自主扫描以下 AI Infra 开源项目的最新 Release（近 14 天内）：
   - K8s 调度器：`github.com/volcano-sh/volcano/releases` · `github.com/koordinator-sh/koordinator/releases` · `github.com/Project-HAMi/HAMi/releases` · `github.com/kubernetes-sigs/kueue/releases`
   - 数据湖仓：`github.com/apache/iceberg/releases` · `github.com/apache/iceberg-python/releases` · `github.com/unitycatalog/unitycatalog/releases`
   - 数据流水线：`github.com/apache/airflow/releases`
   - MLOps：`github.com/mlflow/mlflow/releases`
   - 计算引擎：`github.com/apache/spark/releases` · `github.com/ray-project/ray/releases` · `github.com/ray-project/kuberay/releases`
4. 所有引用 URL 必须真实可访问（写入前 curl 验证）。

---

## 写入任务（全程免审批）

### 任务 1：更新 K8s & 容器 Tab（`src/lib/data-infra-data.js` → `K8S_DATA`）

- 若有调度器新版本（Volcano/Koordinator/HAMi/Kueue/GPU Operator），更新 `schedulerComparison.schedulers[]` 中对应条目的 `version` 字段和 `coreFeatures`
- 若有 GPU 细粒度调度新技术，更新 `schedulerComparison.gpuFineGrained.techniques[]`
- 若有 K8s 新版本，更新 `components[]` 中 Kubernetes 的版本号

### 任务 2：更新数据湖仓 Tab（`src/lib/data-infra-data.js` → `DATALAKE_DATA`）

- 若 Iceberg 有新版本，更新 `icebergSource.overview.version` 和相关源码解析内容
- 若 Unity Catalog 有新版本，更新对应的源码解析内容
- 若有新的表格式特性（Puffin/Deletion Vector/REST Catalog 演进），更新 `tableFormat` 相关内容

### 任务 3：更新数据流水线 Tab（`src/lib/data-infra-data.js` → `PIPELINE_DATA`）

- 若 Airflow 有新版本，更新 Airflow 源码解析中的版本信息和新特性描述
- 若有 Asset Partitioning / Task SDK / DAG Bundle 等新特性落地，更新对应子页内容

### 任务 4：更新 MLOps Tab（`src/lib/data-infra-data.js` → `MLOPS_DATA`）

- 若 MLflow 有新版本，更新版本信息和新特性（Tracing/AI Gateway/GenAI 评估）
- 若有 Unity Catalog 集成新进展，更新对应内容

### 任务 5：更新计算引擎选型 Tab（`src/lib/data-infra-data.js` → `COMPUTE_ENGINE_DATA`）

- 若 Spark/Ray 有新版本，更新对应引擎的版本信息和新特性描述
- 若有新的引擎选型建议，更新选型矩阵

### 任务 6：更新本模块 Roadmap

- 读取 `src/lib/strategy-data.js` 中 `SITE_ROADMAP`
- 若本轮发现新的 AI Infra 技术方向或开源项目，追加到 `topOpportunities`
- 若本轮完成了 `productPlans` 中的 Infra 相关条目，将其标记为完成或移除
- 若发现需要新增 Tab 或新增子页的需求，追加到 `productPlans.categories[content]`
- 使用 `replace_in_file` 局部更新，严禁全量重写 strategy-data.js

## 重要注意事项

- 所有引用 URL 必须真实可访问（写入前 curl 验证）
- 所有文件使用 UTF-8 编码，中文直接写入，严禁 Unicode 转义（\\uXXXX）
- 大文件（isBigFile=true）使用 replace_in_file 或 multi_replace，不要用 edit_file
- ⚡ **前端保护（强制）**：所有 `.js` 文件写入完成后，必须执行「全局规则：前端样式保护」中的规则 2（验证 localhost:3000 是否正常），如果异常则执行缓存修复 SOP

---

## 🔍 完成后自检（每次必做，不可跳过）

### 自检 1：真实性核查

逐条检查本次写入的所有内容，对照以下标准：

| 检查项 | 标准 | 不合格处理 |
|--------|------|-----------|
| URL/链接 | curl 验证返回 200/301/302 | 立即删除该条目 |
| 数字/数据 | 来自原始出处，非估算或推断 | 标注"待核实"或删除 |
| 日期 | 与原文发布日期一致 | 修正为正确日期 |
| 公司/产品名 | 与官方命名一致 | 修正拼写/大小写 |
| 版本号 | 来自 GitHub Release 或官方公告 | 修正或删除 |

**自检结论**：在对话中输出一行 `✅ 真实性自检通过（N 条写入，0 条删除）` 或 `⚠️ 自检发现 N 处问题，已修正`

### 自检 2：可靠性核查

- **覆盖完整性**：本次是否遗漏了重要信息源？是否有明显的内容盲区？
- **时效性**：写入内容是否都在合理的时间窗口内（非过期信息）？
- **一致性**：新写入内容与已有内容是否存在矛盾（如同一模型的不同版本号）？

**自检结论**：在对话中输出一行 `✅ 可靠性自检通过` 或 `⚠️ 发现 N 处可靠性问题：[简述]`

### 自检 3：本次来不及做的优化 → 写入 Roadmap

在执行过程中，若发现以下情况，**必须写入 `src/lib/strategy-data.js` 的 `SITE_ROADMAP.productPlans`**：

- 发现了有价值但本次来不及深入的内容方向
- 发现了现有页面结构需要优化但本次未动的地方
- 发现了数据缺失/过期但本次未修复的条目
- 发现了新的信息源值得长期追踪

**写入格式**（追加到 `productPlans.categories[content].items[]` 或 `topOpportunities[]`）：
```js
{{ priority: '🟡', title: '优化项标题', desc: '具体描述：发现了什么问题/机会，建议如何改进', source: 'B6自检-{today}' }}
```

**使用 `replace_in_file` 局部追加，严禁全量重写 strategy-data.js**

- 写入完成后，**明确告知系统编辑员**："B6 Infra 更新完成"
"""

    result = call_llm("", prompt)
    if not result:
        print("  ⚠️ B6 claude 未返回结果")
        return ""

    print(f"  ✅ B6 完成（claude 自主完成写入）")
    return result[:200] if result else ""


# ═══════════════════════════════════════════
#  B7 VLA 编辑员
# ═══════════════════════════════════════════

def run_b7_vla():
    """
    B7 VLA 编辑员 — 自主扫描 arXiv/顶会/厂商博客，更新 vla-data.js
    claude 使用完整 B7 提示词，通过 curl 验证 URL，直接写入文件
    返回: "" (claude 自主写入)
    """
    print(f"\n🚗 B7 VLA 编辑员 — 扫描 arXiv/顶会/厂商博客更新 VLA 进展...")

    if BACKEND == 'template':
        print("  ⚠️ 模板模式，跳过 B7（需要 LLM 后端）")
        return ""

    today = datetime.now().strftime('%Y-%m-%d')

    prompt = f"""你是 Signal 知识平台的 AI VLA 编辑员，职责是**自主追踪自动驾驶/VLA/具身智能前沿进展 → 更新 VLA 实验室页面所有 Tab → 更新本模块 Roadmap**。
你独立完成从信息追踪到页面更新的全流程，不依赖中央采集员。

今天是 {today}。

## 前置步骤

1. 读取 /Users/harrisyu/WorkBuddy/20260409114249/signal/ai-wiki.md，了解当前 `/vla/` 页面的所有 Tab 内容和数据结构。
2. 读取 `src/lib/strategy-data.js` 中 `SITE_ROADMAP.topOpportunities` 和 `productPlans`，了解本模块的重点方向和待完成任务。

> 📌 **启动检查清单（读完 Roadmap 后，在对话中输出以下确认）**：
> - 本模块当前有哪些 🔴 高优待完成条目？（列出 1-3 条）
> - 本模块有哪些已知内容盲区或过期数据需要本次修复？
> - 本次执行的重点是什么？（一句话概括）
>
> 如果 Roadmap 中本模块无待完成条目，则按默认日常任务执行。

3. 自主扫描以下信息源（近 14 天内）：
   - **论文**：arXiv cs.RO / cs.CV / cs.AI（VLA/世界模型/具身智能方向）
   - **顶会**：CVPR / ICCV / CoRL / ICRA / NeurIPS 最新 Proceedings
   - **厂商博客**：Waymo / Tesla AI / Wayve / Mobileye / 华为 ADS / 小鹏 / 理想 / 文远知行
   - **开源仓库**：`github.com/huggingface/lerobot/releases` · `github.com/openvla/openvla/releases`
4. 所有引用 URL 必须真实可访问（写入前 curl 验证）。

---

## 写入任务（全程免审批）

### 任务 1：更新 VLA 模型 Tab

- 若有新 VLA 模型发布（OpenVLA / π₀ / Seed-AD / Alpamayo-R1 等），更新对应模型卡片
- 更新核心指标（nuScenes L2 / 碰撞率 / FVD / 推理延迟）
- 若有新 SOTA，更新排行对比表

### 任务 2：更新世界模型 Tab

- 若有新世界模型论文/发布（GAIA / DreamerV3 / Cosmos / UniSim 等），更新对应内容
- 更新生成质量指标（FVD / FID）和规划能力评测

### 任务 3：更新数据闭环 Tab

- 若有新的数据闭环技术进展（合成数据 / 数据飞轮 / 标注工具），更新对应内容
- 更新数据规模统计和闭环效率指标

### 任务 4：更新具身智能 Tab（如有）

- 若有新的机器人操作 / 人形机器人 / 灵巧手进展，更新对应内容
- 重点追踪：Figure / 1X / Boston Dynamics / 宇树 / 智元 / 傅利叶

### 任务 5：更新本模块 Roadmap

- 读取 `src/lib/strategy-data.js` 中 `SITE_ROADMAP`
- 若本轮发现新的 VLA/自动驾驶技术方向，追加到 `topOpportunities`
- 若本轮完成了 `productPlans` 中的 VLA 相关条目，将其标记为完成或移除
- 使用 `replace_in_file` 局部更新，严禁全量重写 strategy-data.js

## 重要注意事项

- 所有引用 URL 必须真实可访问（写入前 curl 验证）
- 所有文件使用 UTF-8 编码，中文直接写入，严禁 Unicode 转义（\\uXXXX）
- 大文件（isBigFile=true）使用 replace_in_file 或 multi_replace，不要用 edit_file
- ⚡ **前端保护（强制）**：所有 `.js` 文件写入完成后，必须执行「全局规则：前端样式保护」中的规则 2

---

## 🔍 完成后自检（每次必做，不可跳过）

### 自检 1：真实性核查

逐条检查本次写入的所有内容，对照以下标准：

| 检查项 | 标准 | 不合格处理 |
|--------|------|-----------|
| URL/链接 | curl 验证返回 200/301/302 | 立即删除该条目 |
| 数字/数据 | 来自原始出处，非估算或推断 | 标注"待核实"或删除 |
| 日期 | 与原文发布日期一致 | 修正为正确日期 |
| 公司/产品名 | 与官方命名一致 | 修正拼写/大小写 |
| 版本号 | 来自 GitHub Release 或官方公告 | 修正或删除 |

**自检结论**：在对话中输出一行 `✅ 真实性自检通过（N 条写入，0 条删除）` 或 `⚠️ 自检发现 N 处问题，已修正`

### 自检 2：可靠性核查

- **覆盖完整性**：本次是否遗漏了重要信息源？是否有明显的内容盲区？
- **时效性**：写入内容是否都在合理的时间窗口内（非过期信息）？
- **一致性**：新写入内容与已有内容是否存在矛盾（如同一模型的不同版本号）？

**自检结论**：在对话中输出一行 `✅ 可靠性自检通过` 或 `⚠️ 发现 N 处可靠性问题：[简述]`

### 自检 3：本次来不及做的优化 → 写入 Roadmap

在执行过程中，若发现以下情况，**必须写入 `src/lib/strategy-data.js` 的 `SITE_ROADMAP.productPlans`**：

- 发现了有价值但本次来不及深入的内容方向
- 发现了现有页面结构需要优化但本次未动的地方
- 发现了数据缺失/过期但本次未修复的条目
- 发现了新的信息源值得长期追踪

**写入格式**（追加到 `productPlans.categories[content].items[]` 或 `topOpportunities[]`）：
```js
{{ priority: '🟡', title: '优化项标题', desc: '具体描述：发现了什么问题/机会，建议如何改进', source: 'B7自检-{today}' }}
```

**使用 `replace_in_file` 局部追加，严禁全量重写 strategy-data.js**

- 写入完成后，**明确告知系统编辑员**："B7 VLA 更新完成"
"""

    result = call_llm("", prompt)
    if not result:
        print("  ⚠️ B7 claude 未返回结果")
        return ""

    print(f"  ✅ B7 完成（claude 自主完成写入）")
    return result[:200] if result else ""


# ═══════════════════════════════════════════
#  B8 战略编辑员
# ═══════════════════════════════════════════

def run_b8_strategy():
    """
    B8 战略编辑员 — 自主扫描 Palantir/Databricks/a16z/Sequoia 等信息源，更新 strategy-data.js
    claude 使用完整 B8 提示词，通过 curl 验证 URL，直接写入文件
    返回: "" (claude 自主写入)
    """
    print(f"\n🎯 B8 战略编辑员 — 扫描战略信息源更新战略机会信号...")

    if BACKEND == 'template':
        print("  ⚠️ 模板模式，跳过 B8（需要 LLM 后端）")
        return ""

    today = datetime.now().strftime('%Y-%m-%d')

    prompt = f"""你是 Signal 知识平台的 AI 战略编辑员，职责是**自主追踪行业战略/商业分析动态 → 更新业务原生战略页面所有 Tab → 更新本模块 Roadmap**。
你独立完成从信息追踪到页面更新的全流程，不依赖中央采集员。

今天是 {today}。

## 前置步骤

1. 读取 /Users/harrisyu/WorkBuddy/20260409114249/signal/ai-wiki.md，了解当前 `/strategy/` 页面的所有 Tab 内容和数据结构（8 个 Tab：行业困境/全球破局/Palantir 深度/应对框架/FDE×飞轮/交付形态/行业对标/模型安全/中国借鉴）。
2. 读取 `src/lib/strategy-data.js` 中 `SITE_ROADMAP.topOpportunities` 和 `productPlans`，了解本模块的重点方向和待完成任务。

> 📌 **启动检查清单（读完 Roadmap 后，在对话中输出以下确认）**：
> - 本模块当前有哪些 🔴 高优待完成条目？（列出 1-3 条）
> - 本模块有哪些已知内容盲区或过期数据需要本次修复？
> - 本次执行的重点是什么？（一句话概括）
>
> 如果 Roadmap 中本模块无待完成条目，则按默认日常任务执行。

3. 自主扫描以下信息源（近 14 天内）：
   - **公司财报/投资者日**：Palantir / Databricks / Snowflake / Salesforce / ServiceNow 官方 IR 页面
   - **行业报告**：Gartner / IDC / a16z / Sequoia 最新报告
   - **战略分析媒体**：Stratechery / Ben Thompson · The Information · Bloomberg Technology
   - **国内来源**：36Kr 企业服务 · 虎嗅商业分析 · 晚点 LatePost
4. 所有引用 URL 必须真实可访问（写入前 curl 验证）。

---

## 写入任务（全程免审批）

### 任务 1：更新全球破局思路 Tab

- 若有新的破局案例或信号（Palantir 新合同 / Databricks 新融资 / AI 原生企业软件新进展），更新对应策略的「近期声浪信号」
- 更新 `lastUpdated` 字段为今日日期
- 若有新的破局策略值得加入，追加到策略列表

### 任务 2：更新 Palantir 模式深度解析 Tab

- 若 Palantir 有新产品发布 / 新合同 / 财务数据更新，更新对应内容
- 若 AIP / Foundry / Gotham 有新特性，更新产品矩阵

### 任务 3：更新行业对标 Tab

- 若 Palantir/Databricks/Salesforce/Tesla 有重大战略变化，更新对比矩阵
- 若有新的值得对标的公司，追加到对标列表

### 任务 4：更新模型安全 Tab

- 若有新的 AI 安全事件 / 监管政策 / 主流模型提供商安全更新，更新对应内容
- 更新主流模型提供商安全对比表（Anthropic/OpenAI/Google/DeepSeek/Qwen）

### 任务 5：更新本模块 Roadmap

- 读取 `src/lib/strategy-data.js` 中 `SITE_ROADMAP`
- 若本轮发现新的战略方向或商业模式创新，追加到 `topOpportunities`
- 若本轮完成了 `productPlans` 中的战略相关条目，将其标记为完成或移除
- 使用 `replace_in_file` 局部更新，严禁全量重写 strategy-data.js

## 重要注意事项

- 所有引用 URL 必须真实可访问（写入前 curl 验证）
- 所有文件使用 UTF-8 编码，中文直接写入，严禁 Unicode 转义（\\uXXXX）
- 大文件（isBigFile=true）使用 replace_in_file 或 multi_replace，不要用 edit_file
- ⚡ **前端保护（强制）**：所有 `.js` 文件写入完成后，必须执行「全局规则：前端样式保护」中的规则 2

---

## 🔍 完成后自检（每次必做，不可跳过）

### 自检 1：真实性核查

逐条检查本次写入的所有内容，对照以下标准：

| 检查项 | 标准 | 不合格处理 |
|--------|------|-----------|
| URL/链接 | curl 验证返回 200/301/302 | 立即删除该条目 |
| 数字/数据 | 来自原始出处，非估算或推断 | 标注"待核实"或删除 |
| 日期 | 与原文发布日期一致 | 修正为正确日期 |
| 公司/产品名 | 与官方命名一致 | 修正拼写/大小写 |
| 版本号 | 来自 GitHub Release 或官方公告 | 修正或删除 |

**自检结论**：在对话中输出一行 `✅ 真实性自检通过（N 条写入，0 条删除）` 或 `⚠️ 自检发现 N 处问题，已修正`

### 自检 2：可靠性核查

- **覆盖完整性**：本次是否遗漏了重要信息源？是否有明显的内容盲区？
- **时效性**：写入内容是否都在合理的时间窗口内（非过期信息）？
- **一致性**：新写入内容与已有内容是否存在矛盾（如同一模型的不同版本号）？

**自检结论**：在对话中输出一行 `✅ 可靠性自检通过` 或 `⚠️ 发现 N 处可靠性问题：[简述]`

### 自检 3：本次来不及做的优化 → 写入 Roadmap

在执行过程中，若发现以下情况，**必须写入 `src/lib/strategy-data.js` 的 `SITE_ROADMAP.productPlans`**：

- 发现了有价值但本次来不及深入的内容方向
- 发现了现有页面结构需要优化但本次未动的地方
- 发现了数据缺失/过期但本次未修复的条目
- 发现了新的信息源值得长期追踪

**写入格式**（追加到 `productPlans.categories[content].items[]` 或 `topOpportunities[]`）：
```js
{{ priority: '🟡', title: '优化项标题', desc: '具体描述：发现了什么问题/机会，建议如何改进', source: 'B8自检-{today}' }}
```

**使用 `replace_in_file` 局部追加，严禁全量重写 strategy-data.js**

- 写入完成后，**明确告知系统编辑员**："B8 战略更新完成"
"""

    result = call_llm("", prompt)
    if not result:
        print("  ⚠️ B8 claude 未返回结果")
        return ""

    print(f"  ✅ B8 完成（claude 自主完成写入）")
    return result[:200] if result else ""


# ═══════════════════════════════════════════
#  B9 实验室编辑员
# ═══════════════════════════════════════════

def run_b9_lab():
    """
    B9 实验室编辑员 — 自主扫描 arXiv cs.CV/cs.GR 和量化社区，更新 lab-data.js + quant-data.js
    claude 使用完整 B9 提示词，通过 curl 验证 URL，直接写入文件
    返回: "" (claude 自主写入)
    """
    print(f"\n🔬 B9 实验室编辑员 — 扫描 arXiv/量化社区更新实验室和量化页面...")

    if BACKEND == 'template':
        print("  ⚠️ 模板模式，跳过 B9（需要 LLM 后端）")
        return ""

    today = datetime.now().strftime('%Y-%m-%d')

    prompt = f"""你是 Signal 知识平台的 AI 实验室编辑员，职责是**自主追踪前沿技术/量化交易进展 → 更新实验室和量化业务页面 → 更新本模块 Roadmap**。
你独立完成从信息追踪到页面更新的全流程，不依赖中央采集员。

今天是 {today}。

## 前置步骤

1. 读取 /Users/harrisyu/WorkBuddy/20260409114249/signal/ai-wiki.md，了解当前 `/lab/` 和 `/quant/` 页面的内容和数据结构。
2. 读取 `src/lib/strategy-data.js` 中 `SITE_ROADMAP.topOpportunities` 和 `productPlans`，了解本模块的重点方向和待完成任务。

> 📌 **启动检查清单（读完 Roadmap 后，在对话中输出以下确认）**：
> - 本模块当前有哪些 🔴 高优待完成条目？（列出 1-3 条）
> - 本模块有哪些已知内容盲区或过期数据需要本次修复？
> - 本次执行的重点是什么？（一句话概括）
>
> 如果 Roadmap 中本模块无待完成条目，则按默认日常任务执行。

3. 自主扫描以下信息源（近 14 天内）：
   - **前沿技术**：arXiv cs.CV / cs.GR（NeRF/3DGS/扩散模型/占用网络）· CVPR/ICCV/SIGGRAPH 最新论文
   - **量化交易**：Two Sigma / Renaissance / Citadel 公开信息 · QuantLib · 量化社区（Qlib/Backtrader）
   - **国内量化**：幻方/九坤/明汯/灵均/衍复/锐天 公开信息 · 聚宽/米筐社区
4. 所有引用 URL 必须真实可访问（写入前 curl 验证）。

---

## 写入任务（全程免审批）

### 任务 1：更新实验室 `/lab/` 页面

- 若有新的 NeRF / 3DGS / 扩散模型 / 占用网络重要论文或开源项目，更新对应 Demo 卡片
- 更新技术成熟度评估（研究阶段 / 工程化阶段 / 产品化阶段）
- 若有新的单卡可跑 Demo，追加到 Demo 集合

### 任务 2：更新量化业务 `/quant/` 页面

- **AI & 大模型 Tab**：若有新的 LLM 在量化交易中的应用案例或论文，更新对应内容
- **国内外行情 Tab**：若有头部量化机构重大动态（新产品/业绩/人事），更新对应内容
- **实战指南 Tab**：若有新的量化工具/平台/数据源值得推荐，更新对应内容
- **策略体系 Tab**：若有新的 AI 驱动策略值得收录，追加到策略列表

### 任务 3：更新本模块 Roadmap

- 读取 `src/lib/strategy-data.js` 中 `SITE_ROADMAP`
- 若本轮发现新的前沿技术方向或量化机会，追加到 `topOpportunities`
- 若本轮完成了 `productPlans` 中的实验室/量化相关条目，将其标记为完成或移除
- 使用 `replace_in_file` 局部更新，严禁全量重写 strategy-data.js

## 重要注意事项

- 所有引用 URL 必须真实可访问（写入前 curl 验证）
- 所有文件使用 UTF-8 编码，中文直接写入，严禁 Unicode 转义（\\uXXXX）
- 大文件（isBigFile=true）使用 replace_in_file 或 multi_replace，不要用 edit_file
- ⚡ **前端保护（强制）**：所有 `.js` 文件写入完成后，必须执行「全局规则：前端样式保护」中的规则 2

---

## 🔍 完成后自检（每次必做，不可跳过）

### 自检 1：真实性核查

逐条检查本次写入的所有内容，对照以下标准：

| 检查项 | 标准 | 不合格处理 |
|--------|------|-----------|
| URL/链接 | curl 验证返回 200/301/302 | 立即删除该条目 |
| 数字/数据 | 来自原始出处，非估算或推断 | 标注"待核实"或删除 |
| 日期 | 与原文发布日期一致 | 修正为正确日期 |
| 公司/产品名 | 与官方命名一致 | 修正拼写/大小写 |
| 版本号 | 来自 GitHub Release 或官方公告 | 修正或删除 |

**自检结论**：在对话中输出一行 `✅ 真实性自检通过（N 条写入，0 条删除）` 或 `⚠️ 自检发现 N 处问题，已修正`

### 自检 2：可靠性核查

- **覆盖完整性**：本次是否遗漏了重要信息源？是否有明显的内容盲区？
- **时效性**：写入内容是否都在合理的时间窗口内（非过期信息）？
- **一致性**：新写入内容与已有内容是否存在矛盾（如同一模型的不同版本号）？

**自检结论**：在对话中输出一行 `✅ 可靠性自检通过` 或 `⚠️ 发现 N 处可靠性问题：[简述]`

### 自检 3：本次来不及做的优化 → 写入 Roadmap

在执行过程中，若发现以下情况，**必须写入 `src/lib/strategy-data.js` 的 `SITE_ROADMAP.productPlans`**：

- 发现了有价值但本次来不及深入的内容方向
- 发现了现有页面结构需要优化但本次未动的地方
- 发现了数据缺失/过期但本次未修复的条目
- 发现了新的信息源值得长期追踪

**写入格式**（追加到 `productPlans.categories[content].items[]` 或 `topOpportunities[]`）：
```js
{{ priority: '🟡', title: '优化项标题', desc: '具体描述：发现了什么问题/机会，建议如何改进', source: 'B9自检-{today}' }}
```

**使用 `replace_in_file` 局部追加，严禁全量重写 strategy-data.js**

- 写入完成后，**明确告知系统编辑员**："B9 实验室/量化更新完成"
"""

    result = call_llm("", prompt)
    if not result:
        print("  ⚠️ B9 claude 未返回结果")
        return ""

    print(f"  ✅ B9 完成（claude 自主完成写入）")
    return result[:200] if result else ""


# ═══════════════════════════════════════════
#  E 设计师（扫描 GitHub 生态）
# ═══════════════════════════════════════════

def run_e_designer():
    """
    E 设计师 — 扫描 GitHub Trending / AI 生态，更新 SITE_ROADMAP
    写入：src/lib/strategy-data.js（topOpportunities/githubFindings/moduleProposals）
    设计师独立运行（--mode designer），不在 daily pipeline 中
    返回: updates_summary
    """
    print(f"\n🎨 E 设计师 — 扫描 GitHub 生态与平台机会...")

    STRATEGY_FILE = ROOT / 'src' / 'lib' / 'strategy-data.js'

    if BACKEND == 'template':
        print("  ⚠️ 模板模式，跳过 E（需要 LLM 后端）")
        return ""

    if not STRATEGY_FILE.exists():
        print("  ⚠️ strategy-data.js 不存在，跳过 E")
        return ""

    today = datetime.now().strftime('%Y-%m-%d')

    system = """你是 Signal 知识平台的 E 设计师，专注于平台战略规划和 GitHub 生态扫描。

你的职责是每周/每月扫描 AI 开源生态，识别：
1. GitHub Trending 上过去一周爆火的 AI/ML 仓库（stars 增速异常的）
2. 值得 Signal 平台纳入的新研究方向（未覆盖的 AI 子领域）
3. 平台内容/功能的改进建议

输出 JSON 格式：
{
  "github_findings": [
    {
      "repo": "org/repo",
      "stars": "xxx+",
      "type": "仓库类型",
      "priority": "P0",
      "reason": "关注原因（40字以内）",
      "action": "建议行动（20字以内）"
    }
  ],
  "module_proposals": [
    {
      "name": "模块名称（20字以内）",
      "type": "工具/实践类" | "数据看板类" | "社区/动态类",
      "priority": "P0" | "P1",
      "effort": "低" | "中" | "高",
      "value": "极高" | "高" | "中",
      "desc": "模块描述（80字以内）",
      "dataSource": "数据来源",
      "implementHint": "实现提示（30字以内）"
    }
  ],
  "top_opportunities": [
    {
      "id": "唯一id",
      "title": "机会标题（25字以内）",
      "priority": "P0",
      "value": "极高",
      "effort": "中",
      "desc": "机会描述（80-100字）",
      "action": "行动建议（20字以内）",
      "color": "#hexcode"
    }
  ],
  "summary": "本次扫描摘要（80字）"
}

只返回 JSON，不要解释。"""

    user = f"""今天是 {today}，请执行本周 GitHub 生态扫描和 Signal 平台机会分析。

扫描维度：
1. 过去两周 GitHub Trending AI/ML 仓库（stars 增速 > 500/天）
2. 值得 Signal 追踪但当前完全空白的新方向（如 AI for Science/量子ML/多模态视频生成）
3. Signal 平台目前最大的用户体验痛点/功能缺口

生成：
- 3-5 个 GitHub 发现
- 1-2 个新模块提案
- 1-2 个顶级机会

直接返回 JSON。"""

    raw = call_llm(system, user)
    if not raw:
        print("  ⚠️ LLM 未返回结果，跳过 E")
        return ""

    designer_data = {}
    try:
        designer_data = _parse_json_robust(raw)
    except (ValueError, json.JSONDecodeError) as e:
        print(f"  ⚠️ JSON 解析失败: {e}")
        return ""

    github_findings = designer_data.get('github_findings', [])
    module_proposals = designer_data.get('module_proposals', [])
    top_opportunities = designer_data.get('top_opportunities', [])
    e_summary = designer_data.get('summary', '')

    if not any([github_findings, module_proposals, top_opportunities]):
        print("  ℹ️ 无新内容，跳过写入")
        return ""

    content = STRATEGY_FILE.read_text(encoding='utf-8')
    new_content = content

    # 插入 topOpportunities
    if top_opportunities:
        opp_pattern = re.compile(r'(topOpportunities:\s*\[)')
        match = opp_pattern.search(new_content)
        if match:
            insert_pos = match.end()
            new_opps_js = ''
            for opp in top_opportunities[:2]:
                opp_id = opp.get('id', f'e-{today}')
                new_opps_js += f"""
    {{
      id: '{opp_id}',
      title: '{opp.get("title", "").replace("'", "\\'")}',
      priority: '{opp.get("priority", "P1")}',
      value: '{opp.get("value", "中")}',
      effort: '{opp.get("effort", "中")}',
      desc: '{opp.get("desc", "").replace("'", "\\'")[:120]}',
      action: '{opp.get("action", "").replace("'", "\\'")}',
      color: '{opp.get("color", "#6c5ce7")}',
    }},"""
            new_content = new_content[:insert_pos] + new_opps_js + new_content[insert_pos:]

    # 插入 githubFindings
    if github_findings:
        gh_pattern = re.compile(r'(githubFindings:\s*\[)')
        match = gh_pattern.search(new_content)
        if match:
            insert_pos = match.end()
            new_gh_js = ''
            for gh in github_findings[:3]:
                new_gh_js += f"""
    {{
      repo: '{gh.get("repo", "")}',
      stars: '{gh.get("stars", "?")}',
      type: '{gh.get("type", "未知")}',
      priority: '{gh.get("priority", "P1")}',
      reason: '{gh.get("reason", "").replace("'", "\\'")}',
      action: '{gh.get("action", "").replace("'", "\\'")}',
    }},"""
            new_content = new_content[:insert_pos] + new_gh_js + new_content[insert_pos:]

    # 插入 moduleProposals
    if module_proposals:
        mp_pattern = re.compile(r'(moduleProposals:\s*\[)')
        match = mp_pattern.search(new_content)
        if match:
            insert_pos = match.end()
            new_mp_js = ''
            for mp in module_proposals[:2]:
                new_mp_js += f"""
    {{
      name: '{mp.get("name", "").replace("'", "\\'")}',
      type: '{mp.get("type", "工具/实践类")}',
      priority: '{mp.get("priority", "P1")}',
      effort: '{mp.get("effort", "中")}',
      value: '{mp.get("value", "高")}',
      desc: '{mp.get("desc", "").replace("'", "\\'")[:80]}',
      dataSource: '{mp.get("dataSource", "").replace("'", "\\'")}',
      implementHint: '{mp.get("implementHint", "").replace("'", "\\'")}',
    }},"""
            new_content = new_content[:insert_pos] + new_mp_js + new_content[insert_pos:]

    # 更新 lastUpdated
    new_content = re.sub(
        r"(SITE_ROADMAP\s*=\s*\{[^}]{0,200}lastUpdated:\s*')[^']*(')",
        rf'\g<1>{today}\g<2>',
        new_content
    )

    if new_content != content:
        STRATEGY_FILE.write_text(new_content, encoding='utf-8')

    for gh in github_findings[:3]:
        print(f"    + GitHub: {gh.get('repo', '')}")
    for opp in top_opportunities[:2]:
        print(f"    + 机会: {opp.get('title', '')[:40]}")

    result = f"GitHub 发现 {len(github_findings)} 个，模块提案 {len(module_proposals)} 个，机会 {len(top_opportunities)} 个: {e_summary[:50] if e_summary else ''}"
    print(f"  ✅ E 完成：{result}")

    append_evolution_log({
        'date': now_str(),
        'type': 'designer-scan',
        'agent': 'E',
        'message': f'设计师扫描: {e_summary[:80] if e_summary else result}',
    })

    return result


# ═══════════════════════════════════════════
#  B5 系统编辑（汇聚）
# ═══════════════════════════════════════════

def run_b5_aggregate(summary: dict):
    """
    B5 系统编辑 — 汇聚本次运行结果，追加到 evolution-log
    summary 格式: {
      'news': int, 'articles': int, 'books': int,
      'models': int, 'benchmarks': int, 'ideas': int,
      'infra': str, 'vla': str, 'strategy': str, 'lab': str
    }
    """
    parts = []
    if summary.get('news'):
        parts.append(f"声浪 +{summary['news']} 条")
    if summary.get('articles'):
        parts.append(f"文章 +{summary['articles']} 篇")
    if summary.get('books'):
        parts.append(f"书籍章节 +{summary['books']} 章")
    if summary.get('models'):
        parts.append(f"模型 +{summary['models']} 个")
    if summary.get('benchmarks'):
        parts.append(f"评测榜更新 {summary['benchmarks']} 项")
    if summary.get('ideas'):
        parts.append(f"创业信号更新 {summary['ideas']} 条")
    if summary.get('infra') and summary['infra'] not in ('跳过', '无更新'):
        parts.append(f"Infra 版本: {summary['infra']}")
    if summary.get('vla') and summary['vla'] not in ('跳过', '无更新'):
        parts.append(f"VLA: {summary['vla']}")
    if summary.get('strategy') and summary['strategy'] not in ('跳过', '无更新'):
        parts.append(f"战略: {summary['strategy']}")
    if summary.get('lab') and summary['lab'] not in ('跳过', '无更新'):
        parts.append(f"实验室: {summary['lab']}")

    message = "每日进化: " + "，".join(parts) if parts else "每日进化: 无新增内容"
    entry = {
        'date': now_str(),
        'type': 'daily',
        'agent': 'B1→B2→B3→B4→B6→B7→B8→B9→B5',
        'message': message,
    }
    append_evolution_log(entry)
    print(f"  ✅ B5 汇聚完成：{message}")


# ═══════════════════════════════════════════
#  C QA 检查
# ═══════════════════════════════════════════

def run_c_qa() -> list:
    """
    C QA 检查 — 纯静态完整性验证，不调用 LLM
    返回问题列表，空列表表示全部通过
    """
    issues = []

    # 1. 检查 papers-index.json：hasReview:true 的条目对应 .md 文件是否存在
    papers_index = CONTENT_DIR / 'papers' / 'papers-index.json'
    if papers_index.exists():
        try:
            papers = json.loads(papers_index.read_text(encoding='utf-8'))
            missing_reviews = []
            for p in papers:
                if p.get('hasReview') and p.get('id'):
                    md_path = PAPERS_DIR / f"{p['id']}.md"
                    if not md_path.exists():
                        missing_reviews.append(p['id'])
            if missing_reviews:
                issues.append(f"papers-index.json: hasReview=true 但无对应 .md 文件 ({len(missing_reviews)} 条): {missing_reviews[:5]}")
        except json.JSONDecodeError as e:
            issues.append(f"papers-index.json JSON 解析失败: {e}")
    else:
        issues.append("papers-index.json 不存在")

    # 2. 检查 evolution-log.json
    if EVOLUTION_LOG.exists():
        try:
            logs = json.loads(EVOLUTION_LOG.read_text(encoding='utf-8'))
            if not isinstance(logs, list):
                issues.append("evolution-log.json 不是数组")
        except json.JSONDecodeError as e:
            issues.append(f"evolution-log.json JSON 解析失败: {e}")
    else:
        issues.append("evolution-log.json 不存在")

    # 3. 检查 news-feed.json
    news_feed = CONTENT_DIR / 'news' / 'news-feed.json'
    if news_feed.exists():
        try:
            news = json.loads(news_feed.read_text(encoding='utf-8'))
            invalid = [i for i, n in enumerate(news) if not (n.get('id') and n.get('title') and n.get('date'))]
            if invalid:
                issues.append(f"news-feed.json: {len(invalid)} 条缺少 id/title/date 字段（索引: {invalid[:5]}）")
        except json.JSONDecodeError as e:
            issues.append(f"news-feed.json JSON 解析失败: {e}")
    else:
        issues.append("news-feed.json 不存在")

    # 4. 检查 articles/*.md 是否有 title frontmatter
    missing_title = []
    for md_file in ARTICLES_DIR.glob('*.md'):
        content = md_file.read_text(encoding='utf-8')
        if content.startswith('---'):
            if 'title:' not in content[:500]:
                missing_title.append(md_file.name)
    if missing_title:
        issues.append(f"文章缺少 title frontmatter ({len(missing_title)} 篇): {missing_title[:3]}")

    # 5. 检查关键 JS 数据文件语法（node --check）
    js_files = [
        ROOT / 'src' / 'lib' / 'lab-data.js',
        ROOT / 'src' / 'lib' / 'data-infra-data.js',
        ROOT / 'src' / 'lib' / 'strategy-data.js',
        ROOT / 'src' / 'components' / 'IdeaRadar.js',
    ]
    for jf in js_files:
        if not jf.exists():
            continue
        r = subprocess.run(['node', '--check', str(jf)], capture_output=True, text=True)
        if r.returncode != 0:
            issues.append(f"{jf.name} 语法错误: {r.stderr.strip()[:120]}")

    # 6. Next.js 构建检查（清缓存后 build，捕获 Error 行）
    print("  🔨 执行 npm run build 检查...")
    try:
        # 先清 .next / out 缓存，避免 chunk ID 失效
        import shutil as _shutil
        for _d in [ROOT / '.next', ROOT / 'out']:
            if _d.exists():
                _shutil.rmtree(_d)
        # 必须带 NEXT_PUBLIC_BASE_PATH='' 否则资源路径带 /signal/ 前缀导致 CSS 404
        build_env = {**os.environ, 'NEXT_PUBLIC_BASE_PATH': '', 'NODE_ENV': 'production'}
        r = subprocess.run(
            ['npm', 'run', 'build'],
            capture_output=True, text=True, cwd=str(ROOT), timeout=180,
            env=build_env
        )
        output = r.stdout + r.stderr
        # 收集真正的错误行（排除 KaTeX warn）
        errors = [
            ln for ln in output.splitlines()
            if ('error' in ln.lower() or 'Error' in ln)
            and 'unicodeTextInMathMode' not in ln
            and 'warn' not in ln.lower()
        ]
        if r.returncode != 0:
            issues.append(f"npm build 失败 (exit {r.returncode}): " + '; '.join(errors[:3]))
        elif errors:
            issues.append(f"npm build 有 error 输出: " + '; '.join(errors[:3]))
        else:
            print("  ✅ npm build 通过")
    except subprocess.TimeoutExpired:
        issues.append("npm build 超时（>180s）")
    except Exception as e:
        issues.append(f"npm build 执行异常: {e}")

    # 7. Playwright 浏览器前端检查
    # 构建时用 NEXT_PUBLIC_BASE_PATH=''，所有资源路径为 /_next/...
    # serve 直接从 out/ 根目录提供服务，路径完全匹配
    print("  🌐 准备静态服务...")
    import shutil as _sh
    npx_bin = _sh.which('npx')
    # 使用端口 3001 进行 QA 检查，避免中断用户在 3000 上运行的预览服务
    QA_PORT = 3001
    subprocess.run(['bash', '-c', f'lsof -ti:{QA_PORT} | xargs kill -9 2>/dev/null; true'], shell=False)
    serve_proc = subprocess.Popen(
        [npx_bin or 'npx', 'serve', 'out', '-p', str(QA_PORT)],
        cwd=str(ROOT), stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
    )
    import time; time.sleep(2)  # 等待 serve 启动

    print("  🌐 执行 Playwright 前端检查...")
    try:
        playwright_script = r"""
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const issues = [];

  const pages = [
    { path: '/', checks: ['Signal', '声浪'] },
    { path: '/news', checks: ['新闻', '声浪'] },
    { path: '/finance', checks: ['金融'] },
    { path: '/lab', checks: [] },
  ];

  for (const { path, checks } of pages) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    try {
      const res = await page.goto('http://localhost:3001' + path, { waitUntil: 'networkidle', timeout: 15000 });
      const status = res ? res.status() : 0;
      if (status >= 400) {
        issues.push(path + ' HTTP ' + status);
        await page.close(); continue;
      }

      // ── 1. CSS 样式检查 ──
      const styleInfo = await page.evaluate(() => {
        const bg = window.getComputedStyle(document.body).backgroundColor;
        // 背景色应为 rgb(247, 248, 250)（Tailwind bg-[#f7f8fa]），不能是透明或纯白
        const cssOk = bg !== 'rgba(0, 0, 0, 0)' && bg !== 'rgb(255, 255, 255)';
        // 侧边栏 aside 应有宽度（桌面端 ~208px）
        const aside = document.querySelector('aside');
        const sidebarW = aside ? aside.getBoundingClientRect().width : -1;
        return { bg, cssOk, sidebarW };
      });
      if (!styleInfo.cssOk) {
        issues.push(path + ' Tailwind CSS 未生效（body背景色=' + styleInfo.bg + '）');
      }
      if (styleInfo.sidebarW >= 0 && styleInfo.sidebarW < 50) {
        issues.push(path + ' 侧边栏宽度异常(' + styleInfo.sidebarW + 'px)，布局可能崩溃');
      }

      // ── 2. CSS chunk 资源可访问性 ──
      const cssLinks = await page.evaluate(() =>
        Array.from(document.querySelectorAll('link[rel="stylesheet"]')).map(l => l.href)
      );
      for (const cssUrl of cssLinks) {
        const httpStatus = await page.evaluate(async (url) => {
          try { const r = await fetch(url); return r.status; } catch { return 0; }
        }, cssUrl);
        if (httpStatus !== 200) {
          const fname = cssUrl.split('/').pop();
          issues.push(path + ' CSS资源404: ' + fname + ' (HTTP ' + httpStatus + ') — 可能需重建');
        }
      }

      // ── 3. 页面内容检查 ──
      const bodyText = await page.evaluate(() => document.body ? document.body.innerText : '');
      if (/Application error|unhandled.*error|TypeError|ReferenceError/i.test(bodyText)) {
        const snippet = bodyText.match(/(Application error|unhandled.*error|TypeError|ReferenceError)[^\n]*/i);
        issues.push(path + ' 页面JS报错: ' + (snippet ? snippet[0].slice(0, 100) : '未知'));
      }
      for (const kw of checks) {
        if (!bodyText.includes(kw)) {
          issues.push(path + ' 缺少关键内容: "' + kw + '"');
        }
      }

      // ── 4. 截图 ──
      const slug = path.replace(/\//g, '_') || '_home';
      await page.screenshot({ path: '/tmp/qa-screenshot' + slug + '.png', fullPage: false });

    } catch (e) {
      issues.push(path + ' 访问失败: ' + e.message.slice(0, 80));
    }
    await page.close();
  }

  await browser.close();

  if (issues.length > 0) {
    console.log('ISSUES:' + JSON.stringify(issues));
  } else {
    console.log('OK');
  }
})();
"""
        # 写临时脚本到 ROOT 目录，确保 node 能 require playwright
        script_path = ROOT / '_qa_browser_check.js'
        script_path.write_text(playwright_script, encoding='utf-8')

        r = subprocess.run(
            ['node', str(script_path)],
            capture_output=True, text=True, cwd=str(ROOT), timeout=60
        )
        script_path.unlink(missing_ok=True)

        output = (r.stdout + r.stderr).strip()
        if r.returncode != 0:
            issues.append(f"Playwright 执行失败: {output[:200]}")
        elif output.startswith('ISSUES:'):
            try:
                pw_issues = json.loads(output[len('ISSUES:'):])
                for i in pw_issues:
                    issues.append(f"前端: {i}")
                print(f"  ⚠️ Playwright 发现 {len(pw_issues)} 个前端问题")
            except Exception:
                issues.append(f"Playwright 输出解析失败: {output[:200]}")
        else:
            print("  ✅ Playwright 前端检查通过（截图已存 /tmp/qa-screenshot*.png）")

    except subprocess.TimeoutExpired:
        issues.append("Playwright 检查超时（>60s）")
    except Exception as e:
        issues.append(f"Playwright 检查异常: {e}")
    finally:
        # 停止 QA 专用 serve 进程（端口 3001）
        try:
            serve_proc.terminate()
        except Exception:
            pass
        # 确保用户预览服务（端口 3000）仍在运行
        try:
            _check = subprocess.run(
                ['bash', '-c', 'lsof -ti:3000'],
                capture_output=True, text=True
            )
            if not _check.stdout.strip():
                # 3000 没有进程，重新启动
                subprocess.Popen(
                    [npx_bin or 'npx', 'serve', 'out', '-p', '3000'],
                    cwd=str(ROOT), stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
                )
                print("  🌐 预览服务已重启（http://localhost:3000）")
        except Exception:
            pass

    return issues


# ═══════════════════════════════════════════
#  D 发布
# ═══════════════════════════════════════════

def run_d_publish(dry_run=True):
    """
    D 发布 — git add/commit 内容变更
    dry_run=True 时只打印命令不执行（默认安全模式）
    """
    print(f"\n🚀 D 发布{'（预演）' if dry_run else '（实际执行）'}...")
    git_root = str(ROOT)
    commands = [
        ['git', '-C', git_root, 'add', 'content/'],
        ['git', '-C', git_root, 'commit', '-m', f'feat: 每日进化 {datetime.now().strftime("%Y-%m-%d")} [by Signal agent]'],
    ]
    for cmd in commands:
        cmd_str = ' '.join(cmd)
        if dry_run:
            print(f"  [预演] {cmd_str}")
        else:
            result = subprocess.run(cmd, capture_output=True, text=True)
            if result.returncode == 0:
                print(f"  ✅ {cmd_str}")
            else:
                print(f"  ⚠️ 失败: {result.stderr[:200]}")


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

        # 构建主题字符串（AI Infra 追踪主题注入 oss_watch 和 source_path）
        topic_title = topic['title']
        if 'oss_watch' in topic:
            topic_title += (
                f"\n\n[开源项目追踪] 重点关注以下仓库的最新 Release/PR/Issue："
                f"\n" + "\n".join(f"  - https://github.com/{r}" for r in topic['oss_watch'])
            )
        if 'source_path' in topic:
            source_path = Path(topic['source_path'])
            if source_path.exists():
                topic_title += f"\n\n[本地源码] {source_path}（请基于真实源码分析）"

        # 运行三角色流水线
        body = run_pipeline(topic_title, existing, 'article')
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

        # 源码解析书籍：预加载源码上下文
        source_context = None
        if 'source_path' in book:
            source_path = Path(book['source_path'])
            if source_path.exists():
                print(f"    📂 源码路径: {source_path} (版本: {book.get('source_version', 'unknown')})")
                source_context = {
                    'repo': book.get('source_repo', ''),
                    'version': book.get('source_version', ''),
                    'path': str(source_path),
                }
            else:
                print(f"    ⚠️  源码路径不存在: {source_path}，请先 git clone")

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

            # 构建主题字符串（源码解析书籍注入版本和路径信息）
            topic_str = f"《{book['title']}》第 {i} 章: {chapter}"
            if source_context:
                topic_str += (
                    f"\n\n[源码信息] 版本: {source_context['version']}"
                    f" | 仓库: {source_context['repo']}"
                    f" | 本地路径: {source_context['path']}"
                    f"\n请基于该版本的真实源码进行分析，引用具体的类名、方法名和文件路径。"
                )

            # 运行三角色流水线
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
            if source_context:
                frontmatter['sourceVersion'] = source_context['version']
                frontmatter['sourceRepo'] = source_context['repo']

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
    parser.add_argument('--mode',
                        choices=['all', 'article', 'book', 'news', 'evolve', 'daily', 'qa', 'designer'],
                        default='daily', help='运行模式（默认: daily）')
    parser.add_argument('--count', type=int, default=2, help='生成数量（文章）')
    parser.add_argument('--publish', action='store_true', help='执行 git commit（D 发布步骤，默认预演）')
    args = parser.parse_args()

    print("=" * 60)
    print("🧬 Signal — 多智能体内容生产引擎")
    print(f"📅 {now_str()}")
    print(f"🤖 模式: {args.mode}  |  后端: {BACKEND}")
    if BACKEND == 'claude_code':
        print(f"✅ Claude Code CLI 已就绪: {CLAUDE_BIN}")
    elif BACKEND == 'crewai':
        print("✅ CrewAI 多智能体编排已加载")
    elif BACKEND == 'openai':
        model = os.getenv('SIGNAL_MODEL', 'gpt-4o-mini')
        print(f"✅ OpenAI API 已连接 (模型: {model})")
    else:
        print("📝 模板模式 — 无可用 LLM 后端（claude CLI 未找到，也无 API Key）")
    print("=" * 60)

    if args.mode == 'daily':
        # ── 每日全量运行：B1 → B2 → B3 → B4 → B6 → B7 → B8 → B9 → B5 → C → D ──
        summary = {}

        print("\n📡 B1 声浪编辑...")
        n = run_b1_news(count=3)
        summary['news'] = n

        print("\n✍️  B2 内容编辑...")
        run_articles(args.count)
        summary['articles'] = args.count

        print("\n🤖 B3 模型编辑...")
        try:
            models_added, benchmarks_updated = run_b3_models(model_count=2, benchmark_updates=1)
            summary['models'] = models_added
            summary['benchmarks'] = benchmarks_updated
        except Exception as e:
            print(f"  ⚠️ B3 执行异常: {e}")
            summary['models'] = 0

        print("\n📊 B4 数据编辑...")
        try:
            ideas_updated = run_b4_data()
            summary['ideas'] = ideas_updated
        except Exception as e:
            print(f"  ⚠️ B4 执行异常: {e}")
            summary['ideas'] = 0

        print("\n🏗️  B6 Infra 编辑...")
        try:
            infra_result = run_b6_infra()
            summary['infra'] = infra_result
        except Exception as e:
            print(f"  ⚠️ B6 执行异常: {e}")
            summary['infra'] = '跳过'

        print("\n🦾 B7 VLA 编辑...")
        try:
            vla_result = run_b7_vla()
            summary['vla'] = vla_result
        except Exception as e:
            print(f"  ⚠️ B7 执行异常: {e}")
            summary['vla'] = '跳过'

        print("\n🔭 B8 战略编辑...")
        try:
            strategy_result = run_b8_strategy()
            summary['strategy'] = strategy_result
        except Exception as e:
            print(f"  ⚠️ B8 执行异常: {e}")
            summary['strategy'] = '跳过'

        print("\n🔬 B9 实验室编辑...")
        try:
            lab_result = run_b9_lab()
            summary['lab'] = lab_result
        except Exception as e:
            print(f"  ⚠️ B9 执行异常: {e}")
            summary['lab'] = '跳过'

        print("\n📋 B5 汇聚...")
        run_b5_aggregate(summary)

        print("\n🔍 C QA 检查...")
        issues = run_c_qa()
        if issues:
            print("  ⚠️ 发现以下问题：")
            for issue in issues:
                print(f"    - {issue}")
        else:
            print("  ✅ 全部通过")

        if args.publish:
            run_d_publish(dry_run=False)
        else:
            print("\n💡 提示：加 --publish 参数可自动 git commit 内容变更")

    elif args.mode == 'designer':
        # ── 设计师深度扫描（独立模式，较耗时）──
        print("\n🎨 E 设计师 — GitHub 生态深度扫描...")
        try:
            result = run_e_designer()
            print(f"  {result}")
        except Exception as e:
            print(f"  ⚠️ E 设计师执行异常: {e}")
        if args.publish:
            run_d_publish(dry_run=False)
        else:
            print("\n💡 提示：加 --publish 参数可自动 git commit 内容变更")

    elif args.mode == 'qa':
        # ── 只跑 QA 检查 ──
        issues = run_c_qa()
        if issues:
            print("\n⚠️ QA 检查发现问题：")
            for issue in issues:
                print(f"  - {issue}")
            sys.exit(1)
        else:
            print("\n✅ QA 全部通过")

    elif args.mode == 'evolve':
        run_evolve()

    elif args.mode in ('all', 'book'):
        run_books()
        if args.mode in ('all', 'article'):
            run_articles(args.count)
        if args.mode == 'all':
            print("\n📡 抓取新闻...")
            try:
                from fetch_news import generate_news_data
                generate_news_data()
            except Exception as e:
                print(f"  ⚠️ 新闻抓取失败: {e}")

    elif args.mode == 'article':
        run_articles(args.count)

    elif args.mode == 'news':
        run_b1_news(count=args.count or 3)

    print(f"\n🎉 完成！")


if __name__ == '__main__':
    main()
