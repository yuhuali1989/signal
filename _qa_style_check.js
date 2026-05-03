const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const issues = [];

  const pages = [
    { path: '/', name: '首页' },
    { path: '/news', name: '新闻' },
    { path: '/books', name: '书架' },
  ];

  for (const { path, name } of pages) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    try {
      await page.goto('http://localhost:3000' + path, { waitUntil: 'networkidle', timeout: 15000 });

      // 1. 检查 CSS 是否加载（sidebar 应有宽度）
      const sidebarWidth = await page.evaluate(() => {
        const sidebar = document.querySelector('aside, nav, [class*="sidebar"], [class*="nav"]');
        if (!sidebar) return 0;
        return sidebar.getBoundingClientRect().width;
      });
      if (sidebarWidth < 50) {
        issues.push(`${name}: 侧边栏宽度异常 (${sidebarWidth}px)，CSS 可能未加载`);
      }

      // 2. 检查是否有 Tailwind 样式生效（body 背景色不是默认白色）
      const bgColor = await page.evaluate(() => {
        return window.getComputedStyle(document.body).backgroundColor;
      });
      if (bgColor === 'rgba(0, 0, 0, 0)' || bgColor === 'rgb(255, 255, 255)') {
        issues.push(`${name}: body 背景色为默认值(${bgColor})，Tailwind 可能未生效`);
      }

      // 3. 检查导航栏是否重复（nav 元素数量）
      const navCount = await page.evaluate(() => {
        // 顶部固定导航数量（移动端 header）
        return document.querySelectorAll('header, [class*="topbar"], [class*="mobile-nav"]').length;
      });
      if (navCount > 2) {
        issues.push(`${name}: 导航栏重复出现 ${navCount} 次`);
      }

      // 4. 检查 CSS chunk 是否实际返回 200
      const cssLinks = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('link[rel="stylesheet"]')).map(l => l.href);
      });
      for (const cssUrl of cssLinks) {
        const res = await page.evaluate(async (url) => {
          try { const r = await fetch(url); return r.status; } catch { return 0; }
        }, cssUrl);
        if (res !== 200) {
          issues.push(`${name}: CSS资源 404/失败 — ${cssUrl.split('/').slice(-1)[0]} (HTTP ${res})`);
        }
      }

      await page.screenshot({ path: `/tmp/qa-style-${path.replace(/\//g,'_') || 'home'}.png` });

    } catch (e) {
      issues.push(`${name}: 访问失败 — ${e.message.slice(0, 80)}`);
    }
    await page.close();
  }

  await browser.close();

  if (issues.length > 0) {
    console.log('STYLE_ISSUES:' + JSON.stringify(issues));
  } else {
    console.log('STYLE_OK');
  }
})();
