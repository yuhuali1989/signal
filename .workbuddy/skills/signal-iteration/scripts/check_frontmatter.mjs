#!/usr/bin/env node
/**
 * Signal frontmatter 全量校验（防首页 500）
 *
 * 用法（cwd 必须是仓库根 E:/workbuddy/signal/signal）：
 *   node .workbuddy/skills/signal-iteration/scripts/check_frontmatter.mjs
 *
 * 为什么必须跑：
 *   单个 md 的 frontmatter 解析失败 → src/lib/content.js 的 getAllContent 整体抛错
 *   → 首页统计直接 500（不是只坏那一页）。
 *   常见根因：description / title 的值里内嵌了未转义的英文双引号 "。
 *
 * 依赖仓库 node_modules 里的 gray-matter。
 * 退出码：0 全通过，1 存在失败文件
 */
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : p.endsWith('.md') ? [p] : [];
  });
}

const root = path.join(process.cwd(), 'content');
if (!fs.existsSync(root)) {
  console.error('✗ 未找到 content 目录，请在仓库根运行');
  process.exit(1);
}

const files = walk(root);
const bad = [];
for (const f of files) {
  try {
    matter.read(f);
  } catch (e) {
    bad.push({ f, msg: String(e.message).split('\n')[0] });
  }
}

console.log(`MD 总数: ${files.length} | frontmatter 解析失败: ${bad.length}`);
bad.forEach((b) => console.log('  [FAIL]', path.relative(process.cwd(), b.f), '::', b.msg));

if (bad.length) {
  console.log('\n✗ 存在解析失败文件 → 会导致首页 500，必须先修复再 commit');
  console.log('  修复要点：检查该文件的 description / title，把内部英文双引号 " 换成中文「」或全角引号');
  process.exit(1);
}
console.log('✅ frontmatter 全部解析通过');
