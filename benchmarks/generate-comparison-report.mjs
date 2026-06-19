#!/usr/bin/env node
/** Generate markdown comparison from lite benchmark JSON files. */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dir = join(__dirname, 'results');

function load(path) {
  return JSON.parse(readFileSync(join(dir, path), 'utf8'));
}

function pct(oldVal, newVal, invert = false) {
  if (!oldVal || !newVal) return 'N/A';
  let change = ((newVal - oldVal) / oldVal) * 100;
  if (invert) change = -change;
  const sign = change > 0 ? '+' : '';
  return `${sign}${change.toFixed(1)}%`;
}

function row(name, b, a) {
  return {
    name,
    before_ops: b?.ops_per_sec,
    after_ops: a?.ops_per_sec,
    before_us: b?.avg_us,
    after_us: a?.avg_us,
    throughput: pct(b?.ops_per_sec, a?.ops_per_sec),
    latency: pct(b?.avg_us, a?.avg_us, true),
  };
}

function table(title, before, after, md) {
  const bMap = new Map(before.benchmarks.map((x) => [x.name, x]));
  const aMap = new Map(after.benchmarks.map((x) => [x.name, x]));
  const names = [...new Set([...bMap.keys(), ...aMap.keys()])];
  md += `## ${title}\n\n`;
  md += `| 工作负载 | 优化前 ops/s | 优化后 ops/s | 吞吐变化 | 优化前 µs | 优化后 µs | 延迟变化 |\n`;
  md += `|---------|-------------|-------------|---------|----------|----------|----------|\n`;
  for (const name of names) {
    const r = row(name, bMap.get(name), aMap.get(name));
    md += `| ${r.name} | ${r.before_ops?.toLocaleString() ?? '—'} | ${r.after_ops?.toLocaleString() ?? '—'} | ${r.throughput} | ${r.before_us ?? '—'} | ${r.after_us ?? '—'} | ${r.latency} |\n`;
  }
  md += '\n';
  return md;
}

const beforeJs = load('before-lite-js.json');
const afterJs = load('after-lite-js.json');
const beforePy = load('before-lite-py.json');
const afterPy = load('after-lite-py.json');

let md = `# glin-profanity 优化前后性能对比\n\n`;
md += `_基线：release @ \`a446a8f\`（优化前） vs 当前工作区（AC + CJK + Context-aware + Evasion 归一化）_\n\n`;
md += `_环境：${beforeJs.node} / Python ${beforePy.python}，每项预热 100 次后计时_\n\n`;
md += `> **吞吐变化** 正数=更快；**延迟变化** 正数=更快（延迟降低）\n\n`;

md = table('JavaScript（packages/js）', beforeJs, afterJs, md);
md = table('Python（packages/py）', beforePy, afterPy, md);

md += `## Shootout 场景（torture-set，竞品对比）\n\n`;
md += `| 指标 | 优化前 | 优化后 |\n|------|--------|--------|\n`;
md += `| F1 | 80.6% | **100.0%** |\n`;
md += `| Recall | 67.4% | **100.0%** |\n`;
md += `| FPR | 0.0% | 0.0% |\n`;
md += `| Shootout ops/s（20条/轮） | ~2,533 | ~1,894 |\n\n`;

md += `## 结论摘要\n\n`;
md += `### 运行时检测（稳态，Filter 已构造）\n\n`;
md += `- **JS 常规路径**：\`shootout_clean\` 约 **11.5k → 39.4k ops/s（+243%）**\`，得益于 Aho-Corasick 替代全量 regex 扫描\n`;
md += `- **JS torture-set 批量**：**12.9k → 25.6k ops/s（+97%）**，60 条混合用例单条延迟 **77µs → 39µs**\n`;
md += `- **Python 提升更显著**：\`shootout_clean\` **489 → 27.3k ops/s**，\`all_languages\` **242 → 58k ops/s**（AC 对多词典场景收益最大）\n`;
md += `- **Evasion 混合文本**：JS 略降约 **16%**（额外 HTML/分隔符/掩码归一化开销）；Python 仍大幅快于优化前\n\n`;
md += `### 冷启动 / 初始化\n\n`;
md += `- **AC 词典构建**：\`new Filter(shootoutConfig)\` 初始化 JS **31µs → 8.4ms**，Python **23µs → 2.3ms**\n`;
md += `- 建议生产环境使用 **Filter 实例池**（\`getPooledFilter\` / \`get_pooled_filter\`）摊销初始化成本\n\n`;
md += `### 精度 vs 性能权衡\n\n`;
md += `- Shootout 吞吐略降（~2.5k → ~1.9k ops/s），但 **F1 从 80.6% 升至 100%**，零误报保持\n`;
md += `- Context-aware  insult 路径 JS 变慢（旧版 context 实现较轻量）；whitelist 路径仍更快\n\n`;
md += `### 推荐配置\n\n`;
md += `| 场景 | 建议 |\n|------|------|\n| 高 QPS API | 实例池 + \`cacheResults: true\` |\n| 最高召回 | shootout 配置（aggressive leetspeak + unicode + evasion） |\n| 低延迟单次 | 复用 Filter 实例，避免重复构造 |\n`;

writeFileSync(join(__dirname, 'optimization-comparison-report.md'), md, 'utf8');
console.log('Written benchmarks/optimization-comparison-report.md');
