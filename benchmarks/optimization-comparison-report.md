# glin-profanity 优化前后性能对比

_基线：release @ `a446a8f`（优化前） vs 当前工作区（AC + CJK + Context-aware + Evasion 归一化）_

_环境：v25.3.0 / Python 3.13.9，每项预热 100 次后计时_

> **吞吐变化** 正数=更快；**延迟变化** 正数=更快（延迟降低）

## JavaScript（packages/js）

| 工作负载 | 优化前 ops/s | 优化后 ops/s | 吞吐变化 | 优化前 µs | 优化后 µs | 延迟变化 |
|---------|-------------|-------------|---------|----------|----------|----------|
| init_shootout_config | 31,641 | 119 | -99.6% | 31.6 | 8433.67 | -26588.8% |
| torture_set_60_batch | 12,980 | 25,608 | +97.3% | 77.04 | 39.05 | +49.3% |
| basic_clean | 12,335 | 52,338 | +324.3% | 81.07 | 19.11 | +76.4% |
| shootout_clean | 11,474 | 39,407 | +243.4% | 87.15 | 25.38 | +70.9% |
| shootout_evasion_mix | 10,232 | 8,586 | -16.1% | 97.73 | 116.47 | -19.2% |
| context_aware_insult | 29,744 | 10,507 | -64.7% | 33.62 | 95.17 | -183.1% |
| context_aware_whitelist | 15,247 | 26,453 | +73.5% | 65.59 | 37.8 | +42.4% |
| cjk_chinese | 16,638 | 17,711 | +6.4% | 60.1 | 56.46 | +6.1% |
| all_languages_clean | 1,124 | 24,260 | +2058.4% | 889.41 | 41.22 | +95.4% |
| shootout_legacy_clean | 12,683 | 6,461 | -49.1% | 78.85 | 154.78 | -96.3% |

## Python（packages/py）

| 工作负载 | 优化前 ops/s | 优化后 ops/s | 吞吐变化 | 优化前 µs | 优化后 µs | 延迟变化 |
|---------|-------------|-------------|---------|----------|----------|----------|
| init_shootout_config | 43,799 | 426 | -99.0% | 22.83 | 2348.57 | -10187.2% |
| torture_set_60_batch | 1,464 | 30,981 | +2016.2% | 682.86 | 32.28 | +95.3% |
| basic_clean | 487 | 61,736 | +12576.8% | 2054.72 | 16.2 | +99.2% |
| shootout_clean | 489 | 27,297 | +5482.2% | 2043.97 | 36.63 | +98.2% |
| shootout_evasion_mix | 372 | 9,159 | +2362.1% | 2689.31 | 109.18 | +95.9% |
| context_aware_insult | 2,642 | 15,139 | +473.0% | 378.49 | 66.05 | +82.5% |
| context_aware_whitelist | 821 | 86,661 | +10455.5% | 1217.49 | 11.54 | +99.1% |
| cjk_chinese | 2,609 | 34,157 | +1209.2% | 383.29 | 29.28 | +92.4% |
| all_languages_clean | 242 | 58,051 | +23888.0% | 4134.8 | 17.23 | +99.6% |
| shootout_legacy_clean | 488 | 385 | -21.1% | 2051.08 | 2599.48 | -26.7% |

## Shootout 场景（torture-set，竞品对比）

| 指标 | 优化前 | 优化后 |
|------|--------|--------|
| F1 | 80.6% | **100.0%** |
| Recall | 67.4% | **100.0%** |
| FPR | 0.0% | 0.0% |
| Shootout ops/s（20条/轮） | ~2,533 | ~1,894 |

## 结论摘要

### 运行时检测（稳态，Filter 已构造）

- **JS 常规路径**：`shootout_clean` 约 **11.5k → 39.4k ops/s（+243%）**`，得益于 Aho-Corasick 替代全量 regex 扫描
- **JS torture-set 批量**：**12.9k → 25.6k ops/s（+97%）**，60 条混合用例单条延迟 **77µs → 39µs**
- **Python 提升更显著**：`shootout_clean` **489 → 27.3k ops/s**，`all_languages` **242 → 58k ops/s**（AC 对多词典场景收益最大）
- **Evasion 混合文本**：JS 略降约 **16%**（额外 HTML/分隔符/掩码归一化开销）；Python 仍大幅快于优化前

### 冷启动 / 初始化

- **AC 词典构建**：`new Filter(shootoutConfig)` 初始化 JS **31µs → 8.4ms**，Python **23µs → 2.3ms**
- 建议生产环境使用 **Filter 实例池**（`getPooledFilter` / `get_pooled_filter`）摊销初始化成本

### 精度 vs 性能权衡

- Shootout 吞吐略降（~2.5k → ~1.9k ops/s），但 **F1 从 80.6% 升至 100%**，零误报保持
- Context-aware  insult 路径 JS 变慢（旧版 context 实现较轻量）；whitelist 路径仍更快

### 推荐配置

| 场景 | 建议 |
|------|------|
| 高 QPS API | 实例池 + `cacheResults: true` |
| 最高召回 | shootout 配置（aggressive leetspeak + unicode + evasion） |
| 低延迟单次 | 复用 Filter 实例，避免重复构造 |
