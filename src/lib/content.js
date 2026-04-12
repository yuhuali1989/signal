import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkRehype from 'remark-rehype';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import rehypeStringify from 'rehype-stringify';

const contentDirectory = path.join(process.cwd(), 'content');

/**
 * 获取指定类型的所有内容
 * @param {'books' | 'articles'} type
 */
export function getAllContent(type) {
  const dir = path.join(contentDirectory, type);
  if (!fs.existsSync(dir)) return [];

  const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'));

  const items = files.map(filename => {
    const slug = filename.replace(/\.md$/, '');
    const fullPath = path.join(dir, filename);
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(fileContents);

    return {
      slug,
      content,
      ...data,
      date: data.date || null,
      updatedAt: data.updatedAt || data.date || null,
    };
  });

  return items.sort((a, b) => {
    const dateA = new Date(a.date || 0);
    const dateB = new Date(b.date || 0);
    return dateB - dateA;
  });
}

/**
 * 获取单篇内容（含 HTML 渲染）
 */
export async function getContentBySlug(type, slug) {
  const fullPath = path.join(contentDirectory, type, `${slug}.md`);
  if (!fs.existsSync(fullPath)) return null;

  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(fileContents);

  const processedContent = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeKatex)
    .use(rehypeStringify)
    .process(content);
  const contentHtml = processedContent.toString();

  return {
    slug,
    contentHtml,
    content,
    ...data,
  };
}

/**
 * 获取进化日志
 */
export function getEvolutionLogs() {
  const logPath = path.join(contentDirectory, 'evolution-log.json');
  if (!fs.existsSync(logPath)) return [];
  return JSON.parse(fs.readFileSync(logPath, 'utf8'));
}

/**
 * 获取新闻 Feed
 */
export function getNewsFeed() {
  const feedPath = path.join(contentDirectory, 'news', 'news-feed.json');
  if (!fs.existsSync(feedPath)) return [];
  return JSON.parse(fs.readFileSync(feedPath, 'utf8'));
}

/**
 * 获取新闻分类
 */
export function getNewsCategories() {
  const catPath = path.join(contentDirectory, 'news', 'categories.json');
  if (!fs.existsSync(catPath)) return [];
  return JSON.parse(fs.readFileSync(catPath, 'utf8'));
}

/**
 * 获取论文索引
 */
export function getPapersIndex() {
  const indexPath = path.join(contentDirectory, 'papers', 'papers-index.json');
  if (!fs.existsSync(indexPath)) return [];
  return JSON.parse(fs.readFileSync(indexPath, 'utf8'));
}

/**
 * 获取论文分类
 */
export function getPaperCategories() {
  const catPath = path.join(contentDirectory, 'papers', 'categories.json');
  if (!fs.existsSync(catPath)) return [];
  return JSON.parse(fs.readFileSync(catPath, 'utf8'));
}

/**
 * 获取论文解读内容
 */
export async function getPaperReview(slug) {
  const fullPath = path.join(contentDirectory, 'papers', `${slug}.md`);
  if (!fs.existsSync(fullPath)) return null;
  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(fileContents);
  const processedContent = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeKatex)
    .use(rehypeStringify)
    .process(content);
  return { slug, contentHtml: processedContent.toString(), content, ...data };
}

/**
 * 获取评测排行榜数据
 */
export function getBenchmarks() {
  const benchPath = path.join(contentDirectory, 'benchmarks', 'benchmarks.json');
  if (!fs.existsSync(benchPath)) return [];
  return JSON.parse(fs.readFileSync(benchPath, 'utf8'));
}

/**
 * 获取评测数据集
 */
export function getBenchmarkDatasets() {
  const dsPath = path.join(contentDirectory, 'benchmarks', 'datasets.json');
  if (!fs.existsSync(dsPath)) return [];
  return JSON.parse(fs.readFileSync(dsPath, 'utf8'));
}

/**
 * 获取近 N 天新增的内容摘要（用于首页「本周快报」）
 */
export function getWeeklyDigest(days = 7) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().slice(0, 10); // 'YYYY-MM-DD'

  const articles = getAllContent('articles').filter(a => (a.date || '') >= cutoffStr);
  const books = getAllContent('books').filter(b => (b.updatedAt || b.date || '') >= cutoffStr);
  const papers = getPapersIndex().filter(p => (p.date || '') >= cutoffStr);
  const news = getNewsFeed().filter(n => (n.date || '') >= cutoffStr);
  const logs = getEvolutionLogs().filter(l => (l.date || '') >= cutoffStr);

  return {
    articles: articles.slice(0, 3),  // 最新 3 篇文章
    papers: papers.slice(0, 2),       // 最新 2 篇论文
    news: news.slice(0, 3),           // 最新 3 条声浪
    updatedBooks: [...new Set(books.map(b => b.book).filter(Boolean))], // 修订过的书名（去重）
    totalNewItems: articles.length + papers.length + news.length,
    totalLogs: logs.length,
  };
}

/**
 * 获取热度榜：从 news + papers 中统计高频关键词/标签，返回 Top N
 */
export function getHotTopics(topN = 10) {
  const news = getNewsFeed();
  const papers = getPapersIndex();

  // 关键词黑名单（太泛，无信息量）
  const STOP = new Set([
    'ai', 'llm', 'model', '模型', '研究', '大模型', '方法', 'new', 'the', 'of', 'with',
    'for', 'and', 'in', 'on', 'a', 'an', 'to', 'is', '的', '与', '及', '从', '在',
    '通过', '利用', '基于', '实现', '提出', '一种', '用于', '方向',
  ]);

  const freq = {};

  const addTerms = (terms) => {
    if (!Array.isArray(terms)) return;
    terms.forEach(t => {
      const key = t.toLowerCase().trim();
      if (key.length < 2 || STOP.has(key)) return;
      freq[key] = (freq[key] || 0) + 1;
    });
  };

  // 从 news 的 tags 和 title 关键词抽取
  news.forEach(n => {
    addTerms(n.tags || []);
    // 标题里的括号内容（通常是英文术语）
    const matches = (n.title || '').match(/[A-Z][A-Za-z0-9\-]{2,}/g) || [];
    addTerms(matches);
  });

  // 从 papers 的 tags / category
  papers.forEach(p => {
    addTerms(p.tags || []);
    if (p.category) addTerms([p.category]);
  });

  const sorted = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN);

  return sorted.map(([term, count]) => ({ term, count }));
}

/**
 * 获取平台统计数据
 */
export function getStats() {
  const books = getAllContent('books');
  const articles = getAllContent('articles');
  const news = getNewsFeed();
  const logs = getEvolutionLogs();

  const papers = getPapersIndex();

  return {
    totalContent: books.length + articles.length + news.length,
    books: books.length,
    articles: articles.length,
    papers: papers.length,
    papersReviewed: papers.filter(p => p.hasReview).length,
    news: news.length,
    autoUpdates: logs.length,
    agents: 3,
  };
}
