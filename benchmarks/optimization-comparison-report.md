# glin-profanity：release vs feat-performance-opt 完整对比报告

_生成时间：2026-06-30T03:35:55.619078+00:00_

_基线分支：`release` @ `a446a8f`_

_对比分支：`feat-performance-opt` @ `f71542c`_

_运行环境：Node v25.3.0 / Python 3.13.9_

> **吞吐变化** 正数表示 feat-opt 更快；**延迟变化** 正数表示 feat-opt 延迟更低。

## 1. 分支差异概览

| 指标 | 值 |
|------|----|
| release SHA | `a446a8f` |
| feat-performance-opt SHA | `f71542c` |
| 新增 commit 数 | 8 |
| 代码变更规模 | 91 files, +8795 / -827 lines（相对 release） |

<details><summary>feat-performance-opt 相对 release 的 commit 列表（8）</summary>

- f71542c chore: stop tracking local CSV comparison benchmark script
- 45bf4a5 fix: prevent 5m distance tokens from leetspeak sm false positives
- 99f3a43 fix: align PY/JS profanity detection across CJK, emoji spans, and scanner edges
- f817818 fix: harden cache keys, config export, and PY/JS leetspeak parity
- df6603c fix: populate profane_words on legacy fuzzy and context-aware legacy paths
- 4936139 fix: align profane_words collection with normalized-first fallback and result parity
- a09d389 fix: harden variant mapping, context-aware parity, and filter pool exports
- 82354e2 feat: add AC fast path, evasion normalization, and context-aware parity

</details>

## 2. 核心能力变更（feat-performance-opt）

| 能力 | release | feat-performance-opt |
|------|---------|---------------------|
| Aho-Corasick 词典快路径 | 无 | 有（`disable_aho_corasick` 可回退 legacy） |
| Evasion 归一化（HTML/掩码/分隔符） | 无 | 有 |
| Context-aware 检测 | 基础 | 与 AC 路径对齐，parity 测试覆盖 |
| CJK 边界 / 单字策略 | 较弱 | 方向 B 拉丁边界 + 无歧义单字白名单 |
| Unicode homoglyph 表 | 较小 | Py/JS 189 条完全同步 |
| Variant span 映射 | 基础 | emoji FE0F / combining class 对齐 |
| Filter 实例池 | 无 | Py/JS `get_pooled_filter` / `getPooledFilter` |
| 跨语言 parity 测试 | 无 | `tests/cross_language_parity_test.py` |

## 3. 测试套件

| 套件 | release | feat-performance-opt |
|------|---------|---------------------|
| Python pytest | ======================== 199 passed, 1 warning in 6.28s ======================== | ======================= 513 passed, 1 warning in 53.04s ======================== |
| JavaScript jest | 未单独跑 release jest | exit 0 |
| 跨语言 parity | release 无 parity 测试 | passed (exit 0) |

## 4. Shootout torture-set（glin-profanity 单库精度）

| 指标 | release | feat-performance-opt |
|------|---------|---------------------|
| Precision | 93.1% | 100.0% |
| Recall | 62.8% | 97.7% |
| F1 | 75.0% | 98.8% |
| FPR | 11.8% | 0.0% |

## 5. 性能对比（Lite 工作负载）

统一预热 100 次后计时；Filter 实例在稳态路径下复用。

### 5.1 JavaScript（packages/js）

| 工作负载 | release ops/s | feat-opt ops/s | 吞吐变化 | release µs | feat-opt µs | 延迟变化 |
|---------|--------------|---------------|---------|-----------|------------|----------|
| init_shootout_config | 26,531 | 141 | -99.5% | 37.69 | 7109.93 | -18764.2% |
| torture_set_60_batch | 12,456 | 26,925 | +116.2% | 80.29 | 37.14 | +53.7% |
| basic_clean | 10,613 | 49,161 | +363.2% | 94.22 | 20.34 | +78.4% |
| shootout_clean | 10,061 | 34,002 | +238.0% | 99.39 | 29.41 | +70.4% |
| shootout_evasion_mix | 7,617 | 14,606 | +91.8% | 131.29 | 68.47 | +47.8% |
| context_aware_insult | 26,577 | 21,072 | -20.7% | 37.63 | 47.46 | -26.1% |
| context_aware_whitelist | 11,423 | 60,541 | +430.0% | 87.54 | 16.52 | +81.1% |
| cjk_chinese | 12,739 | 49,803 | +290.9% | 78.5 | 20.08 | +74.4% |
| all_languages_clean | 760 | 38,124 | +4916.3% | 1316.15 | 26.23 | +98.0% |
| shootout_legacy_clean | 9,355 | 7,101 | -24.1% | 106.9 | 140.82 | -31.7% |

### 5.2 Python（packages/py）

| 工作负载 | release ops/s | feat-opt ops/s | 吞吐变化 | release µs | feat-opt µs | 延迟变化 |
|---------|--------------|---------------|---------|-----------|------------|----------|
| init_shootout_config | 35,567 | 159 | -99.6% | 28.12 | 6306.1 | -22325.7% |
| torture_set_60_batch | 1,161 | 8,815 | +659.3% | 861.06 | 113.45 | +86.8% |
| basic_clean | 314 | 22,083 | +6932.8% | 3189.7 | 45.28 | +98.6% |
| shootout_clean | 353 | 9,322 | +2540.8% | 2829.93 | 107.27 | +96.2% |
| shootout_evasion_mix | 265 | 5,852 | +2108.3% | 3773.78 | 170.87 | +95.5% |
| context_aware_insult | 3,059 | 8,117 | +165.3% | 326.9 | 123.19 | +62.3% |
| context_aware_whitelist | 582 | 59,273 | +10084.4% | 1718.68 | 16.87 | +99.0% |
| cjk_chinese | 1,876 | 45,639 | +2332.8% | 533.06 | 21.91 | +95.9% |
| all_languages_clean | 94 | 39,592 | +42019.1% | 10673.37 | 25.26 | +99.8% |
| shootout_legacy_clean | 365 | 293 | -19.7% | 2742.49 | 3407.88 | -24.3% |

## 7. 结论与建议

### 7.1 性能

- **JS shootout_clean**：10,061 → 34,002 ops/s（+238.0%）
- **Python shootout_clean**：353 → 9,322 ops/s（+2540.8%）
- **JS Filter 初始化（shootout 配置）**：37.69µs → 7109.93µs（AC 构建开销，建议用实例池摊销）

### 7.2 精度 / 行为

- feat-opt 在 torture-set 上目标为 **F1=100%、FPR=0%**（含 word-break / HTML / 掩码 evasion）
- CJK / emoji / 重音词形等边界 case 与 release 行为差异显著，详见 parity 测试

### 7.3 推荐配置

| 场景 | 建议 |
|------|------|
| 高 QPS API | Filter 实例池 + `cacheResults: true` |
| 最高召回 | shootout 配置（aggressive leetspeak + unicode + evasion） |
| 与 release 行为对齐调试 | `disable_aho_corasick: true` 走 legacy 路径 |
| 跨语言一致性 | 跑 `tests/cross_language_parity_test.py` 作为发布门禁 |

---

_复现：`python benchmarks/run-branch-comparison.py`，结果 JSON 在 `benchmarks/results/`._
