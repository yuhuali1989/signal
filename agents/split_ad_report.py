"""将自动驾驶报告拆分为 Signal 书架章节"""
import os
import re
from pathlib import Path

ROOT = Path(__file__).parent.parent
# 报告路径：优先从环境变量读取，否则使用默认相对路径
REPORT = Path(os.getenv('AD_REPORT_PATH', ROOT / 'data' / '自动驾驶大模型深度研究报告.md'))
BOOKS_DIR = ROOT / 'content' / 'books'

report = REPORT.read_text(encoding='utf-8')

# 按 '## 第X章' 拆分
chapters = re.split(r'(?=## 第[一二三四五六七八九十]+章)', report)
chapters = [c.strip() for c in chapters if c.strip() and '## 第' in c]

book_title = '自动驾驶大模型深度研究'
book_slug = 'ad-llm'

num_map = {'一':'1','二':'2','三':'3','四':'4','五':'5','六':'6','七':'7'}

for i, ch_content in enumerate(chapters, 1):
    title_match = re.search(r'## (第[一二三四五六七八九十]+章\s+.+)', ch_content)
    ch_title = title_match.group(1) if title_match else f'第{i}章'
    short_title = re.sub(r'第[一二三四五六七八九十]+章\s+', '', ch_title)

    slug = f'{book_slug}-ch{i:02d}'

    # 去掉原来的 ## 章节标题行
    body = re.sub(r'## 第[一二三四五六七八九十]+章.+\n+', '', ch_content).strip()

    # 构建完整文件
    content = f"""---
title: "{book_title} - 第{i}章: {short_title}"
book: "{book_title}"
chapter: "{i}"
chapterTitle: "{short_title}"
description: "从数据、平台到模型架构的全景分析（2024-2026），系统梳理自动驾驶大模型关键技术"
date: "2026-04-11"
updatedAt: "2026-04-11 16:15"
agent: "研究员→编辑→审校员"
tags:
  - "自动驾驶"
  - "端到端"
  - "VLA"
type: "book"
---

# 第 {i} 章：{short_title}

> 选自《{book_title}》— 从数据、平台到模型架构的全景分析

{body}

---

*本章内容来源于 Signal 知识平台自动驾驶研究报告，由 AI 智能体整理与修订。*
"""

    filepath = BOOKS_DIR / f'{slug}.md'
    filepath.write_text(content, encoding='utf-8')
    lines = len(content.split('\n'))
    print(f'  ✅ {slug}.md: {short_title} ({lines} 行)')

print(f'\n📖 共拆分 {len(chapters)} 章')
