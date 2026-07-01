#!/usr/bin/env python3
"""Focused before/after optimization benchmark (Python)."""

from __future__ import annotations

import json
import sys
import time
from datetime import UTC, datetime
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
if "GLIN_REPO_ROOT" in __import__("os").environ:
    REPO_ROOT = Path(__import__("os").environ["GLIN_REPO_ROOT"]).resolve()

sys.path.insert(0, str(REPO_ROOT / "packages" / "py"))

from glin_profanity import Filter  # noqa: E402

LABEL = sys.argv[sys.argv.index("--label") + 1] if "--label" in sys.argv else "current"
TORTURE_CASES = json.loads(
    (Path(__file__).resolve().parent / "shootout" / "torture-set.json").read_text(
        encoding="utf-8"
    )
)

WORKLOADS = [
    {
        "id": "basic_clean",
        "config": {"languages": ["english"]},
        "text": "The quick brown fox jumps over the lazy dog",
        "iterations": 20_000,
    },
    {
        "id": "shootout_clean",
        "config": {
            "languages": ["english"],
            "detect_leetspeak": True,
            "leetspeak_level": "aggressive",
            "normalize_unicode": True,
        },
        "text": "The quick brown fox jumps over the lazy dog",
        "iterations": 20_000,
    },
    {
        "id": "shootout_evasion_mix",
        "config": {
            "languages": ["english"],
            "detect_leetspeak": True,
            "leetspeak_level": "aggressive",
            "normalize_unicode": True,
        },
        "text": "f.u.c.k and a<br>ss and holy f*** and what a f@cking mess",
        "iterations": 10_000,
    },
    {
        "id": "context_aware_insult",
        "config": {
            "languages": ["english"],
            "detect_leetspeak": True,
            "leetspeak_level": "aggressive",
            "normalize_unicode": True,
            "enable_context_aware": True,
        },
        "text": "You are a fucking idiot",
        "iterations": 10_000,
    },
    {
        "id": "context_aware_whitelist",
        "config": {"languages": ["english"], "enable_context_aware": True},
        "text": "This movie is the bomb",
        "iterations": 10_000,
    },
    {
        "id": "cjk_chinese",
        "config": {"languages": ["chinese"]},
        "text": "hello他妈的",
        "iterations": 10_000,
    },
    {
        "id": "all_languages_clean",
        "config": {"all_languages": True},
        "text": "The quick brown fox jumps over the lazy dog",
        "iterations": 3_000,
    },
]


def measure_is_profane(filter_instance: Filter, text: str, iterations: int) -> dict:
    for _ in range(100):
        filter_instance.is_profane(text)
    start = time.perf_counter()
    for _ in range(iterations):
        filter_instance.is_profane(text)
    total_ms = (time.perf_counter() - start) * 1000
    return {
        "avg_us": round((total_ms / iterations) * 1000, 2),
        "ops_per_sec": round((iterations / total_ms) * 1000),
        "iterations": iterations,
    }


def measure_init(config: dict, iterations: int = 300) -> dict:
    for _ in range(20):
        Filter(config)
    start = time.perf_counter()
    for _ in range(iterations):
        Filter(config)
    total_ms = (time.perf_counter() - start) * 1000
    return {
        "avg_us": round((total_ms / iterations) * 1000, 2),
        "ops_per_sec": round((iterations / total_ms) * 1000),
        "iterations": iterations,
    }


def measure_torture_batch(filter_instance: Filter, iterations: int = 150) -> dict:
    inputs = [case["input"] for case in TORTURE_CASES]
    for _ in range(3):
        for text in inputs:
            filter_instance.is_profane(text)
    start = time.perf_counter()
    for _ in range(iterations):
        for text in inputs:
            filter_instance.is_profane(text)
    total_ms = (time.perf_counter() - start) * 1000
    calls = iterations * len(inputs)
    return {
        "avg_us": round((total_ms / calls) * 1000, 2),
        "ops_per_sec": round((calls / total_ms) * 1000),
        "iterations": calls,
    }


results = {
    "label": LABEL,
    "python": sys.version.split()[0],
    "generated_at": datetime.now(UTC).isoformat(),
    "benchmarks": [],
}

shootout_config = WORKLOADS[1]["config"]
results["benchmarks"].append({"name": "init_shootout_config", **measure_init(shootout_config)})

shootout_filter = Filter(shootout_config)
results["benchmarks"].append(
    {"name": "torture_set_60_batch", **measure_torture_batch(shootout_filter)}
)

for workload in WORKLOADS:
    filter_instance = Filter(workload["config"])
    row = measure_is_profane(filter_instance, workload["text"], workload["iterations"])
    results["benchmarks"].append({"name": workload["id"], **row})

try:
    legacy_filter = Filter({**shootout_config, "disable_aho_corasick": True})
    row = measure_is_profane(legacy_filter, WORKLOADS[1]["text"], 20_000)
    row["has_ac_fast_path"] = True
except TypeError:
    row = measure_is_profane(shootout_filter, WORKLOADS[1]["text"], 20_000)
    row["has_ac_fast_path"] = False
results["benchmarks"].append({"name": "shootout_legacy_clean", **row})

print(json.dumps(results, indent=2))
