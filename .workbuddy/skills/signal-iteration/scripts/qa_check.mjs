#!/usr/bin/env node
/**
 * Signal 数据质检
 *
 * 用法（cwd 必须是仓库根 E:/workbuddy/signal/signal）：
 *   node .workbuddy/skills/signal-iteration/scripts/qa_check.mjs [sinceDate]
 *
 * sinceDate 可选，如 2026-10-01：
 *   只把该日期及之后的数据判定为「本轮」，更早的问题归类为「历史遗留」（warn，不阻断）。
 * 不传则所有问题都算 fail。
 *
 * 检查项：JSON 可解析 / news·models·evo 的 id 唯一 / models 16 字段齐全 / 8 榜 rank 连续 / 榜单日期一致
 * 退出码：0 通过，1 本轮有问题
 */
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const since = process.argv[2] || '';
const load = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));

let news, models, benches, evo;
try {
  news = load('content/news/news-feed.json');
  models = load('content/gallery/models.json');
  benches = load('content/benchmarks/benchmarks.json');
  evo = load('content/evolution-log.json');
} catch (e) {
  console.error('✗ JSON 解析失败:', e.message);
  process.exit(1);
}

const fail = [];
const warn = [];
const isFresh = (item) => !since || (item.date || '') >= since;

console.log('=== Signal 数据质检 ===');
console.log(`news ${news.length} | models ${models.length} | bench ${benches.length} | evo ${evo.length}`);
console.log('✓ 4 个 JSON 均可解析');

// 1. id 唯一性
function checkDup(name, arr) {
  const ids = arr.map((x) => x.id);
  const dups = [...new Set(ids.filter((v, i) => ids.indexOf(v) !== i))];
  if (!dups.length) {
    console.log(`✓ ${name} id 唯一 (${arr.length} 条)`);
    return;
  }
  const fresh = dups.filter((id) => {
    const it = arr.find((x) => x.id === id);
    return it && isFresh(it);
  });
  const legacy = dups.filter((id) => !fresh.includes(id));
  if (fresh.length) fail.push(`${name} 本轮 id 重复: ${fresh.join(', ')}`);
  if (legacy.length) {
    warn.push(`${name} 历史遗留 id 重复 ${legacy.length} 个（非本轮）: ${legacy.slice(0, 3).join(', ')}${legacy.length > 3 ? ' ...' : ''}`);
  }
  console.log(`${fresh.length ? '✗' : '⚠'} ${name} id 重复 ${dups.length} 个（本轮 ${fresh.length} / 历史 ${legacy.length}）`);
}
checkDup('news', news);
checkDup('models', models);
checkDup('evo', evo);

// 2. models 字段完整
const MODEL_KEYS = [
  'id', 'name', 'org', 'type', 'typeLabel', 'typeIcon', 'open', 'params',
  'date', 'context', 'attention', 'factSheet', 'tags', 'keyInnovation',
  'highlights', 'description',
];
const badModels = models.filter((m) => !MODEL_KEYS.every((k) => k in m));
if (!badModels.length) {
  console.log(`✓ models 16 字段齐全 (${models.length} 个)`);
} else {
  const fresh = badModels.filter(isFresh);
  const legacy = badModels.filter((m) => !isFresh(m));
  if (fresh.length) fail.push(`models 本轮字段缺失: ${fresh.map((m) => m.id).join(', ')}`);
  if (legacy.length) warn.push(`models 历史遗留字段缺失 ${legacy.length} 个（旧 schema，非本轮）`);
  console.log(`${fresh.length ? '✗' : '⚠'} models 字段缺失 ${badModels.length} 个（本轮 ${fresh.length} / 历史 ${legacy.length}）`);
}

// 3. 榜单 rank 连续 + 日期一致
const badRank = benches.filter((b) => !(b.models || []).every((m, i) => m.rank === i + 1));
if (!badRank.length) {
  console.log(`✓ ${benches.length} 榜 rank 连续 (${benches.map((b) => b.category).join(', ')})`);
} else {
  fail.push(`榜单 rank 不连续: ${badRank.map((b) => b.category).join(', ')}`);
  console.log(`✗ 榜单 rank 不连续: ${badRank.map((b) => b.category).join(', ')}`);
}
const dates = [...new Set(benches.map((b) => b.date))];
console.log(`  榜单日期: ${dates.join(', ')}${dates.length > 1 ? '  ⚠ 不一致' : '  ✓ 一致'}`);

// 4. 各榜第一（便于人工核对）
benches.forEach((b) => {
  const top = (b.models || [])[0];
  if (top) console.log(`  ${b.category.padEnd(20)} #1 ${top.name} (${top.provider}) ${top.score}`);
});

// 汇总
console.log('\n=== 汇总 ===');
if (fail.length) {
  console.log('✗ 本轮未通过:');
  fail.forEach((f) => console.log('   -', f));
}
if (warn.length) {
  console.log('⚠ 历史遗留（不阻断本轮）:');
  warn.forEach((w) => console.log('   -', w));
}
if (!fail.length) console.log('✅ 本轮新增数据质检通过');
process.exit(fail.length ? 1 : 0);
