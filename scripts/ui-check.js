const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_DIR = path.join(__dirname, '../ui-screenshots');

const ROUTES = [
  '/',
  '/articles',
  '/benchmarks',
  '/books',
  '/models',
  '/papers',
  '/news',
  '/gallery',
  '/tools',
  '/roadmap',
  '/economy',
  '/strategy',
  '/lab',
  '/quant',
  '/idea',
  '/ads',
  '/data-infra',
  '/industry-news',
  '/evolution',
  '/finance',
  '/vla',
];

async function checkPage(page, route) {
  const url = `${BASE_URL}${route}`;
  const issues = [];

  try {
    const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
    const status = response ? response.status() : 0;

    if (status >= 400) {
      issues.push(`❌ HTTP ${status} error`);
      return { route, status, issues, screenshot: null };
    }

    // Wait a bit for JS rendering
    await page.waitForTimeout(1000);

    // --- Check 1: console errors ---
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    // --- Check 2: Broken images ---
    const brokenImages = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      return imgs
        .filter(img => !img.naturalWidth && img.complete)
        .map(img => img.src);
    });
    if (brokenImages.length > 0) {
      issues.push(`🖼️ Broken images (${brokenImages.length}): ${brokenImages.slice(0, 3).join(', ')}`);
    }

    // --- Check 3: Overflow / horizontal scroll ---
    const hasHorizScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    if (hasHorizScroll) {
      issues.push('📐 Horizontal overflow detected (possible layout issue)');
    }

    // --- Check 4: Empty main content ---
    const bodyText = await page.evaluate(() => document.body.innerText.trim());
    if (bodyText.length < 50) {
      issues.push('📭 Page appears to have very little content (possible blank page)');
    }

    // --- Check 5: Very tall single elements (potential layout bug) ---
    const tallElements = await page.evaluate(() => {
      const all = Array.from(document.querySelectorAll('*'));
      return all
        .filter(el => el.getBoundingClientRect().height > 2000)
        .map(el => `${el.tagName.toLowerCase()}${el.className ? '.' + el.className.split(' ')[0] : ''}`)
        .slice(0, 3);
    });
    if (tallElements.length > 0) {
      issues.push(`📏 Unusually tall elements (may indicate layout issues): ${tallElements.join(', ')}`);
    }

    // --- Check 6: Missing headings ---
    const headingCount = await page.evaluate(() => document.querySelectorAll('h1,h2,h3').length);
    if (headingCount === 0) {
      issues.push('🔤 No headings (h1/h2/h3) found on page');
    }

    // --- Check 7: Check for visible error text ---
    const errorText = await page.evaluate(() => {
      const text = document.body.innerText;
      const errorPatterns = [/Application error/i, /500/i, /Internal Server Error/i, /unhandled exception/i];
      return errorPatterns.find(p => p.test(text)) ? document.body.innerText.slice(0, 200) : null;
    });
    if (errorText) {
      issues.push(`💥 Error text visible on page: "${errorText.slice(0, 100)}..."`);
    }

    // Take screenshot
    const screenshotName = route === '/' ? 'home' : route.replace(/\//g, '_').replace(/^_/, '');
    const screenshotPath = path.join(SCREENSHOT_DIR, `${screenshotName}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });

    return { route, status, issues, screenshot: screenshotPath };
  } catch (err) {
    issues.push(`💥 Exception: ${err.message}`);
    return { route, status: 0, issues, screenshot: null };
  }
}

async function main() {
  if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  const results = [];

  for (const route of ROUTES) {
    process.stdout.write(`Checking ${route}... `);
    const result = await checkPage(page, route);
    results.push(result);
    const issueCount = result.issues.length;
    console.log(issueCount === 0 ? '✅ OK' : `⚠️  ${issueCount} issue(s)`);
  }

  await browser.close();

  // Print summary
  console.log('\n========== UI CHECK SUMMARY ==========');
  let totalIssues = 0;
  for (const r of results) {
    if (r.issues.length > 0) {
      console.log(`\n📄 ${r.route} (HTTP ${r.status}):`);
      r.issues.forEach(issue => console.log(`   ${issue}`));
      totalIssues += r.issues.length;
    }
  }

  const pagesWithIssues = results.filter(r => r.issues.length > 0).length;
  console.log(`\n======================================`);
  console.log(`Checked ${results.length} pages`);
  console.log(`Pages with issues: ${pagesWithIssues}`);
  console.log(`Total issues found: ${totalIssues}`);
  console.log(`Screenshots saved to: ${SCREENSHOT_DIR}`);
}

main().catch(console.error);
