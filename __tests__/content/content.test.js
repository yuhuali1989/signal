/**
 * Signal 平台自动化测试
 * 覆盖：数据完整性、JSON 格式、Markdown frontmatter、路由一致性、内容质量
 */

const fs = require('fs');
const path = require('path');

const CONTENT_DIR = path.join(__dirname, '..', '..', 'content');
const NEWS_FEED = path.join(CONTENT_DIR, 'news', 'news-feed.json');
const NEWS_CATEGORIES = path.join(CONTENT_DIR, 'news', 'categories.json');
const PAPERS_INDEX = path.join(CONTENT_DIR, 'papers', 'papers-index.json');
const PAPERS_CATEGORIES = path.join(CONTENT_DIR, 'papers', 'categories.json');
const EVOLUTION_LOG = path.join(CONTENT_DIR, 'evolution-log.json');

// Helper: 读取 JSON 文件
function readJSON(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(content);
}

// Helper: 读取 Markdown frontmatter
function parseFrontmatter(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  
  const fm = {};
  const lines = match[1].split('\n');
  let currentKey = null;
  let isArray = false;
  
  for (const line of lines) {
    // 匹配 key: value 行 (key 只含字母数字下划线)
    const kvMatch = line.match(/^(\w+):\s*(.*)/);
    if (kvMatch) {
      const key = kvMatch[1];
      const value = kvMatch[2].trim();
      if (value === '') {
        currentKey = key;
        fm[currentKey] = [];
        isArray = true;
      } else {
        fm[key] = value.replace(/^"(.*)"$/, '$1');
        isArray = false;
      }
    } else if (isArray && line.trim().startsWith('- ')) {
      fm[currentKey].push(line.trim().replace(/^- "?(.*?)"?$/, '$1'));
    }
  }
  return fm;
}

// Helper: 获取目录下所有 .md 文件
function getMdFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(f => f.endsWith('.md'));
}

// ============================================================
// 测试组 1: JSON 数据文件格式验证
// ============================================================
describe('JSON 数据文件格式验证', () => {
  test('news-feed.json 是有效的 JSON 数组', () => {
    const data = readJSON(NEWS_FEED);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
  });

  test('每条新闻包含必需字段', () => {
    const news = readJSON(NEWS_FEED);
    const requiredFields = ['id', 'title', 'summary', 'source', 'date', 'category'];
    
    news.forEach((item, index) => {
      requiredFields.forEach(field => {
        expect(item).toHaveProperty(field);
        expect(item[field]).toBeTruthy();
      });
    });
  });

  test('新闻日期格式正确 (YYYY-MM-DD)', () => {
    const news = readJSON(NEWS_FEED);
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    
    news.forEach(item => {
      expect(item.date).toMatch(dateRegex);
    });
  });

  test('新闻分类在已定义分类中', () => {
    const news = readJSON(NEWS_FEED);
    const categories = readJSON(NEWS_CATEGORIES);
    const validCategoryIds = categories.map(c => c.id);
    
    news.forEach(item => {
      expect(validCategoryIds).toContain(item.category);
    });
  });

  test('news categories.json 格式正确', () => {
    const categories = readJSON(NEWS_CATEGORIES);
    expect(Array.isArray(categories)).toBe(true);
    
    categories.forEach(cat => {
      expect(cat).toHaveProperty('id');
      expect(cat).toHaveProperty('name');
      expect(cat).toHaveProperty('icon');
      expect(cat).toHaveProperty('color');
    });
  });

  test('papers-index.json 是有效 JSON 数组', () => {
    const data = readJSON(PAPERS_INDEX);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
  });

  test('每篇论文包含必需字段', () => {
    const papers = readJSON(PAPERS_INDEX);
    const requiredFields = ['id', 'title', 'authors', 'venue', 'category', 'importance', 'summary'];
    
    papers.forEach(paper => {
      requiredFields.forEach(field => {
        expect(paper).toHaveProperty(field);
      });
      expect(paper.importance).toBeGreaterThanOrEqual(1);
      expect(paper.importance).toBeLessThanOrEqual(5);
    });
  });

  test('论文分类在已定义分类中', () => {
    const papers = readJSON(PAPERS_INDEX);
    const categories = readJSON(PAPERS_CATEGORIES);
    const validCategoryIds = categories.map(c => c.id);
    
    papers.forEach(paper => {
      expect(validCategoryIds).toContain(paper.category);
    });
  });

  test('evolution-log.json 格式正确', () => {
    const logs = readJSON(EVOLUTION_LOG);
    expect(Array.isArray(logs)).toBe(true);
    
    logs.forEach(log => {
      expect(log).toHaveProperty('date');
      expect(log).toHaveProperty('type');
      expect(log).toHaveProperty('agent');
      expect(log).toHaveProperty('message');
      expect(['book', 'article', 'paper', 'news']).toContain(log.type);
    });
  });
});

// ============================================================
// 测试组 2: 论文索引与解读文件一致性
// ============================================================
describe('论文索引与解读文件一致性', () => {
  test('hasReview=true 的论文必须有对应 .md 文件', () => {
    const papers = readJSON(PAPERS_INDEX);
    const papersDir = path.join(CONTENT_DIR, 'papers');
    
    papers.filter(p => p.hasReview).forEach(paper => {
      const mdFile = path.join(papersDir, `${paper.id}.md`);
      expect(fs.existsSync(mdFile)).toBe(true);
    });
  });

  test('论文 .md 文件必须有对应的索引条目', () => {
    const papers = readJSON(PAPERS_INDEX);
    const paperIds = papers.map(p => p.id);
    const mdFiles = getMdFiles(path.join(CONTENT_DIR, 'papers'));
    
    mdFiles.forEach(file => {
      const slug = file.replace('.md', '');
      expect(paperIds).toContain(slug);
    });
  });
});

// ============================================================
// 测试组 3: Markdown 文件 frontmatter 验证
// ============================================================
describe('文章 Markdown frontmatter 验证', () => {
  const articlesDir = path.join(CONTENT_DIR, 'articles');
  const articles = getMdFiles(articlesDir);
  
  test('所有文章文件都有 frontmatter', () => {
    articles.forEach(file => {
      const fm = parseFrontmatter(path.join(articlesDir, file));
      expect(fm).not.toBeNull();
    });
  });

  test('文章 frontmatter 包含 title 和 type', () => {
    articles.forEach(file => {
      const fm = parseFrontmatter(path.join(articlesDir, file));
      if (fm) {
        expect(fm.title).toBeTruthy();
        expect(fm.type).toBe('article');
      }
    });
  });
});

describe('书籍 Markdown frontmatter 验证', () => {
  const booksDir = path.join(CONTENT_DIR, 'books');
  const books = getMdFiles(booksDir);
  
  test('所有书籍章节都有 frontmatter', () => {
    books.forEach(file => {
      const fm = parseFrontmatter(path.join(booksDir, file));
      expect(fm).not.toBeNull();
    });
  });

  test('书籍 frontmatter 包含 book, chapter, chapterTitle', () => {
    books.forEach(file => {
      const fm = parseFrontmatter(path.join(booksDir, file));
      if (fm) {
        expect(fm.book).toBeTruthy();
        expect(fm.chapter).toBeTruthy();
        expect(fm.chapterTitle).toBeTruthy();
        expect(fm.type).toBe('book');
      }
    });
  });
});

// ============================================================
// 测试组 4: 内容质量检查
// ============================================================
describe('内容质量检查', () => {
  test('新闻 url 字段为有效值', () => {
    const news = readJSON(NEWS_FEED);
    news.forEach(item => {
      expect(item.url).toBeTruthy();
    });
  });

  test('新闻 ID 唯一', () => {
    const news = readJSON(NEWS_FEED);
    const ids = news.map(n => n.id);
    const uniqueIds = [...new Set(ids)];
    expect(ids.length).toBe(uniqueIds.length);
  });

  test('论文 ID 唯一', () => {
    const papers = readJSON(PAPERS_INDEX);
    const ids = papers.map(p => p.id);
    const uniqueIds = [...new Set(ids)];
    expect(ids.length).toBe(uniqueIds.length);
  });

  test('文章文件无重复 slug', () => {
    const articles = getMdFiles(path.join(CONTENT_DIR, 'articles'));
    const slugs = articles.map(f => f.replace('.md', ''));
    const uniqueSlugs = [...new Set(slugs)];
    expect(slugs.length).toBe(uniqueSlugs.length);
  });

  test('书籍章节文件大小 > 500 字节 (非空模板)', () => {
    const booksDir = path.join(CONTENT_DIR, 'books');
    const books = getMdFiles(booksDir);
    const smallFiles = [];
    
    books.forEach(file => {
      const stats = fs.statSync(path.join(booksDir, file));
      if (stats.size < 500) {
        smallFiles.push({ file, size: stats.size });
      }
    });
    
    // 报告但不强制失败（一些模板可能还未充实）
    if (smallFiles.length > 0) {
      console.warn(`⚠️ ${smallFiles.length} 个书籍章节文件 < 500 bytes:`, smallFiles.map(f => f.file));
    }
    // 至少 50% 的章节应该被充实
    expect(books.length - smallFiles.length).toBeGreaterThanOrEqual(books.length * 0.5);
  });

  test('新闻摘要长度合理 (10-500 字)', () => {
    const news = readJSON(NEWS_FEED);
    news.forEach(item => {
      expect(item.summary.length).toBeGreaterThan(10);
      expect(item.summary.length).toBeLessThan(500);
    });
  });
});

// ============================================================
// 测试组 5: 文件系统完整性
// ============================================================
describe('文件系统完整性', () => {
  test('必需的目录结构存在', () => {
    const requiredDirs = [
      'content/books',
      'content/articles',
      'content/papers',
      'content/news',
      'src/app',
      'src/lib',
      'src/components'
    ];
    
    requiredDirs.forEach(dir => {
      const fullPath = path.join(__dirname, '..', '..', dir);
      expect(fs.existsSync(fullPath)).toBe(true);
    });
  });

  test('核心配置文件存在', () => {
    const requiredFiles = [
      'package.json',
      'next.config.js',
      'tailwind.config.js',
      'src/lib/content.js',
      'src/app/layout.js',
      'src/app/page.js'
    ];
    
    requiredFiles.forEach(file => {
      const fullPath = path.join(__dirname, '..', '..', file);
      expect(fs.existsSync(fullPath)).toBe(true);
    });
  });

  test('每本书有 7 个章节文件', () => {
    const booksDir = path.join(CONTENT_DIR, 'books');
    const files = getMdFiles(booksDir);
    
    const bookPrefixes = ['93f28994', 'ad-llm', 'ai-agent', 'ai-interview', 'inference', 'pytorch', 'code-as-proxy'];
    bookPrefixes.forEach(prefix => {
      const chapters = files.filter(f => f.startsWith(prefix));
      expect(chapters.length).toBe(7);
    });
  });

  test('所有页面路由文件存在', () => {
    const routes = [
      'src/app/page.js',
      'src/app/articles/page.js',
      'src/app/articles/[slug]/page.js',
      'src/app/books/page.js',
      'src/app/books/[slug]/page.js',
      'src/app/papers/page.js',
      'src/app/papers/[slug]/page.js',
      'src/app/news/page.js',
      'src/app/evolution/page.js'
    ];
    
    routes.forEach(route => {
      const fullPath = path.join(__dirname, '..', '..', route);
      expect(fs.existsSync(fullPath)).toBe(true);
    });
  });
});

// ============================================================
// 测试组 6: 内容交叉一致性
// ============================================================
describe('内容交叉一致性', () => {
  test('新闻分类计数与实际匹配', () => {
    const news = readJSON(NEWS_FEED);
    const categories = readJSON(NEWS_CATEGORIES);
    
    categories.forEach(cat => {
      const actualCount = news.filter(n => n.category === cat.id).length;
      expect(actualCount).toBe(cat.count);
    });
  });

  test('新闻条目的 categoryName 与分类定义一致', () => {
    const news = readJSON(NEWS_FEED);
    const categories = readJSON(NEWS_CATEGORIES);
    const catMap = {};
    categories.forEach(c => { catMap[c.id] = c.name; });
    
    news.forEach(item => {
      // 年度总结 (type: summary) 使用自定义分类名
      if (item.type !== 'summary') {
        expect(item.categoryName).toBe(catMap[item.category]);
      }
    });
  });

  test('进化日志 type 字段只包含有效类型', () => {
    const logs = readJSON(EVOLUTION_LOG);
    const validTypes = ['book', 'article', 'paper', 'news'];
    
    logs.forEach(log => {
      expect(validTypes).toContain(log.type);
    });
  });

  test('进化日志按时间倒序排列', () => {
    const logs = readJSON(EVOLUTION_LOG);
    
    for (let i = 0; i < logs.length - 1; i++) {
      const current = new Date(logs[i].date);
      const next = new Date(logs[i + 1].date);
      expect(current.getTime()).toBeGreaterThanOrEqual(next.getTime());
    }
  });

  test('文章 tags 字段存在', () => {
    const articlesDir = path.join(CONTENT_DIR, 'articles');
    const articles = getMdFiles(articlesDir);
    
    articles.forEach(file => {
      const content = fs.readFileSync(path.join(articlesDir, file), 'utf8');
      const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
      if (fmMatch) {
        // 检查 frontmatter 中包含 tags 关键字
        expect(fmMatch[1]).toMatch(/tags:/);
      }
    });
  });
});

// ============================================================
// 测试组 7: Markdown 内容质量深度检查
// ============================================================
describe('Markdown 内容质量深度检查', () => {
  test('文章正文不包含外部 HTTP 链接', () => {
    const articlesDir = path.join(CONTENT_DIR, 'articles');
    const articles = getMdFiles(articlesDir);
    const externalLinkRegex = /https?:\/\/(?!#)[^\s)]+/g;
    const violations = [];
    
    articles.forEach(file => {
      const content = fs.readFileSync(path.join(articlesDir, file), 'utf8');
      // 移除 frontmatter
      const body = content.replace(/^---[\s\S]*?---/, '');
      const links = body.match(externalLinkRegex);
      if (links && links.length > 0) {
        violations.push({ file, links: links.slice(0, 3) });
      }
    });
    
    if (violations.length > 0) {
      console.warn(`⚠️ ${violations.length} 篇文章包含外部链接:`, 
        violations.map(v => `${v.file}: ${v.links.join(', ')}`));
    }
    // 外部链接应尽量减少
    expect(violations.length).toBeLessThanOrEqual(5);
  });

  test('书籍章节正文包含代码块', () => {
    const booksDir = path.join(CONTENT_DIR, 'books');
    const books = getMdFiles(booksDir);
    const codeBlockRegex = /```[\s\S]*?```/g;
    let withCode = 0;
    
    books.forEach(file => {
      const content = fs.readFileSync(path.join(booksDir, file), 'utf8');
      const stats = fs.statSync(path.join(booksDir, file));
      // 只检查已充实的章节 (> 2KB)
      if (stats.size > 2000) {
        const blocks = content.match(codeBlockRegex);
        if (blocks && blocks.length > 0) {
          withCode++;
        }
      }
    });
    
    // 至少 60% 的充实章节应含代码
    const totalRich = books.filter(f => {
      const stats = fs.statSync(path.join(booksDir, f));
      return stats.size > 2000;
    }).length;
    
    expect(withCode).toBeGreaterThanOrEqual(Math.floor(totalRich * 0.6));
  });

  test('论文解读包含论文基本信息', () => {
    const papersDir = path.join(CONTENT_DIR, 'papers');
    const papers = getMdFiles(papersDir);
    
    papers.forEach(file => {
      const content = fs.readFileSync(path.join(papersDir, file), 'utf8');
      const fm = parseFrontmatter(path.join(papersDir, file));
      
      // 论文解读应有 title
      expect(fm).not.toBeNull();
      if (fm) {
        expect(fm.title).toBeTruthy();
      }
      
      // 正文至少 1000 字节
      const stats = fs.statSync(path.join(papersDir, file));
      expect(stats.size).toBeGreaterThan(1000);
    });
  });

  test('Markdown 文件无 YAML frontmatter 语法错误', () => {
    const dirs = ['articles', 'books', 'papers'];
    const errors = [];
    
    dirs.forEach(dir => {
      const dirPath = path.join(CONTENT_DIR, dir);
      const files = getMdFiles(dirPath);
      
      files.forEach(file => {
        const content = fs.readFileSync(path.join(dirPath, file), 'utf8');
        // 检查 frontmatter 是否正确闭合
        const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
        if (!fmMatch) {
          errors.push(`${dir}/${file}: 缺少或未闭合的 frontmatter`);
        }
      });
    });
    
    expect(errors).toEqual([]);
  });
});

// ============================================================
// 测试组 8: 书籍完成度与论文覆盖度
// ============================================================
describe('书籍完成度与论文覆盖度', () => {
  test('所有书籍章节文件 > 2KB (全部充实)', () => {
    const booksDir = path.join(CONTENT_DIR, 'books');
    const books = getMdFiles(booksDir);
    const smallFiles = [];
    
    books.forEach(file => {
      const stats = fs.statSync(path.join(booksDir, file));
      if (stats.size < 2000) {
        smallFiles.push({ file, size: stats.size });
      }
    });
    
    if (smallFiles.length > 0) {
      console.warn(`⚠️ ${smallFiles.length} 个书籍章节 < 2KB:`, smallFiles.map(f => `${f.file}(${f.size}B)`));
    }
    // 所有章节都应该已充实 (>2KB)
    expect(smallFiles.length).toBe(0);
  });

  test('论文索引与解读文件数量匹配', () => {
    const papers = readJSON(PAPERS_INDEX);
    const mdFiles = getMdFiles(path.join(CONTENT_DIR, 'papers'));
    
    // 所有论文都有解读
    const reviewedPapers = papers.filter(p => p.hasReview);
    expect(reviewedPapers.length).toBe(mdFiles.length);
  });

  test('进化日志最新条目日期在最近 2 天内', () => {
    const logs = readJSON(EVOLUTION_LOG);
    const now = new Date();
    const twoDaysAgo = new Date(now);
    twoDaysAgo.setDate(now.getDate() - 2);
    const latestDate = new Date(logs[0].date.split(' ')[0]);
    expect(latestDate.getTime()).toBeGreaterThanOrEqual(twoDaysAgo.getTime());
  });

  test('新闻 url 字段非空', () => {
    const news = readJSON(NEWS_FEED);
    news.forEach(item => {
      expect(item.url).toBeTruthy();
    });
  });

  test('文章数量 >= 36', () => {
    const articles = getMdFiles(path.join(CONTENT_DIR, 'articles'));
    expect(articles.length).toBeGreaterThanOrEqual(63);
  });

  test('论文解读数量 >= 20', () => {
    const papers = readJSON(PAPERS_INDEX);
    expect(papers.length).toBeGreaterThanOrEqual(57);
  });
});

// ============================================================
// 测试组 9: 新闻时效性与论文分类覆盖度
// ============================================================
describe('新闻时效性与论文分类覆盖度', () => {
  test('新闻至少 3 条来自最近 2 天', () => {
    const news = readJSON(NEWS_FEED);
    const today = new Date();
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(today.getDate() - 2);
    
    const recentNews = news.filter(n => {
      const newsDate = new Date(n.date);
      return newsDate >= twoDaysAgo;
    });
    
    expect(recentNews.length).toBeGreaterThanOrEqual(3);
  });

  test('论文覆盖至少 3 个分类', () => {
    const papers = readJSON(PAPERS_INDEX);
    const categories = new Set(papers.map(p => p.category));
    expect(categories.size).toBeGreaterThanOrEqual(3);
  });

  test('论文重要度分布合理 (至少 3 篇 importance=5)', () => {
    const papers = readJSON(PAPERS_INDEX);
    const highImportance = papers.filter(p => p.importance === 5);
    expect(highImportance.length).toBeGreaterThanOrEqual(3);
  });

  test('每个新闻分类至少有 1 条新闻', () => {
    const news = readJSON(NEWS_FEED);
    const categories = readJSON(NEWS_CATEGORIES);
    
    categories.forEach(cat => {
      const count = news.filter(n => n.category === cat.id).length;
      expect(count).toBeGreaterThanOrEqual(1);
    });
  });

  test('文章 frontmatter description 长度合理 (20-300 字)', () => {
    const articlesDir = path.join(CONTENT_DIR, 'articles');
    const articles = getMdFiles(articlesDir);
    const violations = [];
    
    articles.forEach(file => {
      const fm = parseFrontmatter(path.join(articlesDir, file));
      if (fm && fm.description) {
        if (fm.description.length < 20 || fm.description.length > 300) {
          violations.push({ file, length: fm.description.length });
        }
      }
    });
    
    if (violations.length > 0) {
      console.warn(`⚠️ ${violations.length} 篇文章 description 长度异常:`, 
        violations.map(v => `${v.file}(${v.length}字)`));
    }
    expect(violations.length).toBeLessThanOrEqual(3);
  });

  test('进化日志不少于 20 条记录', () => {
    const logs = readJSON(EVOLUTION_LOG);
    expect(logs.length).toBeGreaterThanOrEqual(20);
  });
});
