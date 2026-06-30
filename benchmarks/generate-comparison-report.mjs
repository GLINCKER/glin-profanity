#!/usr/bin/env node
/** Generate markdown comparison report from branch-comparison.json + lite JSON. */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dir = join(__dirname, 'results');

function load(name) {
  const path = join(dir, name);
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, 'utf8'));
}

function pct(oldVal, newVal, invert = false) {
  if (oldVal == null || newVal == null || oldVal === 0) return 'N/A';
  let change = ((newVal - oldVal) / oldVal) * 100;
  if (invert) change = -change;
  const sign = change > 0 ? '+' : '';
  return `${sign}${change.toFixed(1)}%`;
}

function benchTable(before, after) {
  const bMap = new Map(before.benchmarks.map((x) => [x.name, x]));
  const aMap = new Map(after.benchmarks.map((x) => [x.name, x]));
  const names = [...new Set([...bMap.keys(), ...aMap.keys()])];
  let md = `| 工作负载 | release ops/s | feat-opt ops/s | 吞吐变化 | release µs | feat-opt µs | 延迟变化 |\n`;
  md += `|---------|--------------|---------------|---------|-----------|------------|----------|\n`;
  for (const name of names) {
    const b = bMap.get(name);
    const a = aMap.get(name);
    md += `| ${name} | ${b?.ops_per_sec?.toLocaleString() ?? '—'} | ${a?.ops_per_sec?.toLocaleString() ?? '—'} | ${pct(b?.ops_per_sec, a?.ops_per_sec)} | ${b?.avg_us ?? '—'} | ${a?.avg_us ?? '—'} | ${pct(b?.avg_us, a?.avg_us, true)} |\n`;
  }
  return md + '\n';
}

function keyFullRows(before, after, keys) {
  const bMap = new Map(before.benchmarks.map((x) => [x.name, x]));
  const aMap = new Map(after.benchmarks.map((x) => [x.name, x]));
  let md = `| Benchmark | release ops/s | feat-opt ops/s | 吞吐变化 | release µs | feat-opt µs |\n`;
  md += `|-----------|--------------|---------------|---------|-----------|------------|\n`;
  for (const name of keys) {
    const b = bMap.get(name);
    const a = aMap.get(name);
    if (!b && !a) continue;
    md += `| ${name} | ${b?.ops_per_sec?.toLocaleString() ?? '—'} | ${a?.ops_per_sec?.toLocaleString() ?? '—'} | ${pct(b?.ops_per_sec, a?.ops_per_sec)} | ${b?.avg_us ?? '—'} | ${a?.avg_us ?? '—'} |\n`;
  }
  return md + '\n';
}

const meta = load('branch-comparison.json');
const beforeJs = load('before-lite-js.json');
const afterJs = load('after-lite-js.json');
const beforePy = load('before-lite-py.json');
const afterPy = load('after-lite-py.json');
const fullBeforeJs = load('before-js.json');
const fullAfterJs = load('after-js.json');
const fullBeforePy = load('before-py.json');
const fullAfterPy = load('after-py.json');

if (!beforeJs || !afterJs || !beforePy || !afterPy) {
  console.error('Missing lite benchmark JSON in benchmarks/results/');
  process.exit(1);
}

const releaseSha = meta?.release_sha ?? 'release';
const featSha = meta?.feat_sha ?? 'feat-performance-opt';
const commits = meta?.commits ?? [];

let md = `# glin-profanity：release vs feat-performance-opt 完整对比报告\n\n`;
md += `_生成时间：${meta?.generated_at ?? new Date().toISOString()}_\n\n`;
md += `_基线分支：\`release\` @ \`${releaseSha}\`_\n\n`;
md += `_对比分支：\`feat-performance-opt\` @ \`${featSha}\`_\n\n`;
md += `_运行环境：Node ${beforeJs.node} / Python ${beforePy.python}_\n\n`;
md += `> **吞吐变化** 正数表示 feat-opt 更快；**延迟变化** 正数表示 feat-opt 延迟更低。\n\n`;

md += `## 1. 分支差异概览\n\n`;
md += `| 指标 | 值 |\n|------|----|\n`;
md += `| release SHA | \`${releaseSha}\` |\n`;
md += `| feat-performance-opt SHA | \`${featSha}\` |\n`;
md += `| 新增 commit 数 | ${commits.length} |\n`;
md += `| 代码变更规模 | 91 files, +8795 / -827 lines（相对 release） |\n\n`;

if (commits.length) {
  md += `<details><summary>feat-performance-opt 相对 release 的 commit 列表（${commits.length}）</summary>\n\n`;
  for (const line of commits) md += `- ${line}\n`;
  md += `\n</details>\n\n`;
}

md += `## 2. 核心能力变更（feat-performance-opt）\n\n`;
md += `| 能力 | release | feat-performance-opt |\n|------|---------|---------------------|\n`;
md += `| Aho-Corasick 词典快路径 | 无 | 有（\`disable_aho_corasick\` 可回退 legacy） |\n`;
md += `| Evasion 归一化（HTML/掩码/分隔符） | 无 | 有 |\n`;
md += `| Context-aware 检测 | 基础 | 与 AC 路径对齐，parity 测试覆盖 |\n`;
md += `| CJK 边界 / 单字策略 | 较弱 | 方向 B 拉丁边界 + 无歧义单字白名单 |\n`;
md += `| Unicode homoglyph 表 | 较小 | Py/JS 189 条完全同步 |\n`;
md += `| Variant span 映射 | 基础 | emoji FE0F / combining class 对齐 |\n`;
md += `| Filter 实例池 | 无 | Py/JS \`get_pooled_filter\` / \`getPooledFilter\` |\n`;
md += `| 跨语言 parity 测试 | 无 | \`tests/cross_language_parity_test.py\` |\n\n`;

if (meta?.tests) {
  md += `## 3. 测试套件\n\n`;
  md += `| 套件 | release | feat-performance-opt |\n|------|---------|---------------------|\n`;
  md += `| Python pytest | ${meta.tests.release?.py?.summary ?? '—'} | ${meta.tests.feat?.py?.summary ?? '—'} |\n`;
  md += `| JavaScript jest | ${meta.tests.release?.js?.summary ?? '—'} | ${meta.tests.feat?.js?.summary ?? '—'} |\n`;
  md += `| 跨语言 parity | ${meta.tests.release?.parity?.summary ?? '—'} | ${meta.tests.feat?.parity?.summary ?? '—'} |\n\n`;
}

if (meta?.shootout_glin) {
  const rs = meta.shootout_glin.release;
  const fs = meta.shootout_glin.feat;
  md += `## 4. Shootout torture-set（glin-profanity 单库精度）\n\n`;
  md += `| 指标 | release | feat-performance-opt |\n|------|---------|---------------------|\n`;
  if (rs?.f1 && fs?.f1) {
    md += `| Precision | ${rs.precision ?? '—'} | ${fs.precision ?? '—'} |\n`;
    md += `| Recall | ${rs.recall ?? '—'} | ${fs.recall ?? '—'} |\n`;
    md += `| F1 | ${rs.f1 ?? '—'} | ${fs.f1 ?? '—'} |\n`;
    md += `| FPR | ${rs.fpr ?? '—'} | ${fs.fpr ?? '—'} |\n\n`;
  } else {
    md += `| 结果 | ${rs?.error ?? JSON.stringify(rs) ?? '—'} | ${fs?.error ?? JSON.stringify(fs) ?? '—'} |\n\n`;
  }
}

md += `## 5. 性能对比（Lite 工作负载）\n\n`;
md += `统一预热 100 次后计时；Filter 实例在稳态路径下复用。\n\n`;
md += `### 5.1 JavaScript（packages/js）\n\n`;
md += benchTable(beforeJs, afterJs);
md += `### 5.2 Python（packages/py）\n\n`;
md += benchTable(beforePy, afterPy);

if (fullBeforeJs && fullAfterJs && fullBeforePy && fullAfterPy) {
  md += `## 6. 性能对比（Full 矩阵 · 关键项）\n\n`;
  const KEY = [
    'init:shootout',
    'init:all_languages',
    'shootout/is_profane/clean_short',
    'shootout/is_profane/evasion_wordbreak',
    'shootout/is_profane/evasion_html',
    'shootout/is_profane/evasion_masked',
    'shootout/is_profane/cjk_chinese',
    'shootout_legacy/is_profane/clean_short',
    'context_aware/is_profane/context_profanity',
    'context_aware/is_profane/context_whitelist',
    'torture_set_60x_isProfane',
    'all_languages/is_profane/clean_short',
    'cached_shootout/check_profanity/clean_short_hit',
  ];
  md += `### 6.1 JavaScript\n\n`;
  md += keyFullRows(fullBeforeJs, fullAfterJs, KEY);
  md += `### 6.2 Python\n\n`;
  md += keyFullRows(fullBeforePy, fullAfterPy, KEY);
}

md += `## 7. 结论与建议\n\n`;
md += `### 7.1 性能\n\n`;

const scB = beforeJs.benchmarks.find((x) => x.name === 'shootout_clean');
const scA = afterJs.benchmarks.find((x) => x.name === 'shootout_clean');
const pyB = beforePy.benchmarks.find((x) => x.name === 'shootout_clean');
const pyA = afterPy.benchmarks.find((x) => x.name === 'shootout_clean');
const initB = beforeJs.benchmarks.find((x) => x.name === 'init_shootout_config');
const initA = afterJs.benchmarks.find((x) => x.name === 'init_shootout_config');

if (scB && scA) {
  md += `- **JS shootout_clean**：${scB.ops_per_sec.toLocaleString()} → ${scA.ops_per_sec.toLocaleString()} ops/s（${pct(scB.ops_per_sec, scA.ops_per_sec)}）\n`;
}
if (pyB && pyA) {
  md += `- **Python shootout_clean**：${pyB.ops_per_sec.toLocaleString()} → ${pyA.ops_per_sec.toLocaleString()} ops/s（${pct(pyB.ops_per_sec, pyA.ops_per_sec)}）\n`;
}
if (initB && initA) {
  md += `- **JS Filter 初始化（shootout 配置）**：${initB.avg_us}µs → ${initA.avg_us}µs（AC 构建开销，建议用实例池摊销）\n`;
}

md += `\n### 7.2 精度 / 行为\n\n`;
md += `- feat-opt 在 torture-set 上目标为 **F1=100%、FPR=0%**（含 word-break / HTML / 掩码 evasion）\n`;
md += `- CJK / emoji / 重音词形等边界 case 与 release 行为差异显著，详见 parity 测试\n\n`;

md += `### 7.3 推荐配置\n\n`;
md += `| 场景 | 建议 |\n|------|------|\n| 高 QPS API | Filter 实例池 + \`cacheResults: true\` |\n| 最高召回 | shootout 配置（aggressive leetspeak + unicode + evasion） |\n| 与 release 行为对齐调试 | \`disable_aho_corasick: true\` 走 legacy 路径 |\n| 跨语言一致性 | 跑 \`tests/cross_language_parity_test.py\` 作为发布门禁 |\n\n`;

md += `---\n\n`;
md += `_复现：\`python benchmarks/run-branch-comparison.py\`，结果 JSON 在 \`benchmarks/results/\`._\n`;

writeFileSync(join(__dirname, 'optimization-comparison-report.md'), md, 'utf8');
console.log('Written benchmarks/optimization-comparison-report.md');
