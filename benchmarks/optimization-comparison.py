#!/usr/bin/env python3
"""Standardized glin-profanity performance benchmark (Python). Outputs JSON."""

from __future__ import annotations

import json
import sys
import time
from datetime import UTC, datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "packages" / "py"))

from glin_profanity import Filter  # noqa: E402

LABEL = "current"
if "--label" in sys.argv:
    idx = sys.argv.index("--label")
    if idx + 1 < len(sys.argv):
        LABEL = sys.argv[idx + 1]

TORTURE_PATH = Path(__file__).resolve().parent / "shootout" / "torture-set.json"
TORTURE_CASES = json.loads(TORTURE_PATH.read_text(encoding="utf-8"))

TEXTS = {
    "clean_short": "The quick brown fox jumps over the lazy dog",
    "clean_long": (
        "This is a much longer text that contains multiple sentences. "
        "It simulates real-world usage where users might submit paragraphs of text. "
        "The filter needs to check the entire text for profanity efficiently."
    ),
    "profane_basic": "This contains some shit and other crap",
    "evasion_leetspeak": "what a f@cking mess",
    "evasion_wordbreak": "f.u.c.k",
    "evasion_html": "a<br>ss",
    "evasion_masked": "holy f*** that was amazing",
    "cjk_chinese": "hello他妈的",
    "context_whitelist": "This movie is the bomb",
    "context_profanity": "You are a fucking idiot",
}

CONFIGS = {
    "basic": {"languages": ["english"]},
    "shootout": {
        "languages": ["english"],
        "detect_leetspeak": True,
        "leetspeak_level": "aggressive",
        "normalize_unicode": True,
    },
    "shootout_legacy": {
        "languages": ["english"],
        "detect_leetspeak": True,
        "leetspeak_level": "aggressive",
        "normalize_unicode": True,
        "disable_aho_corasick": True,
    },
    "context_aware": {
        "languages": ["english"],
        "detect_leetspeak": True,
        "leetspeak_level": "aggressive",
        "normalize_unicode": True,
        "enable_context_aware": True,
    },
    "cjk_chinese": {"languages": ["chinese"]},
    "multi_lang": {"languages": ["english", "spanish", "french", "german"]},
    "all_languages": {"all_languages": True},
    "cached_shootout": {
        "languages": ["english"],
        "detect_leetspeak": True,
        "leetspeak_level": "aggressive",
        "normalize_unicode": True,
        "cache_results": True,
        "max_cache_size": 1000,
    },
}


def measure(name: str, fn, iterations: int = 10_000) -> dict:
    for _ in range(100):
        fn()
    start = time.perf_counter()
    for _ in range(iterations):
        fn()
    total_ms = (time.perf_counter() - start) * 1000
    avg_us = (total_ms / iterations) * 1000
    return {
        "name": name,
        "iterations": iterations,
        "avg_us": round(avg_us, 2),
        "ops_per_sec": round((iterations / total_ms) * 1000),
    }


def measure_init(config_key: str) -> dict:
    config = CONFIGS[config_key]
    iterations = 500
    for _ in range(20):
        Filter(config)
    start = time.perf_counter()
    for _ in range(iterations):
        Filter(config)
    total_ms = (time.perf_counter() - start) * 1000
    return {
        "name": f"init:{config_key}",
        "iterations": iterations,
        "avg_us": round((total_ms / iterations) * 1000, 2),
        "ops_per_sec": round((iterations / total_ms) * 1000),
    }


def measure_torture_batch(filter_instance: Filter, iterations: int = 200) -> dict:
    inputs = [case["input"] for case in TORTURE_CASES]
    for _ in range(5):
        for text in inputs:
            filter_instance.is_profane(text)
    start = time.perf_counter()
    for _ in range(iterations):
        for text in inputs:
            filter_instance.is_profane(text)
    total_ms = (time.perf_counter() - start) * 1000
    calls = iterations * len(inputs)
    return {
        "name": "torture_set_60x_isProfane",
        "iterations": calls,
        "avg_us": round((total_ms / calls) * 1000, 2),
        "ops_per_sec": round((calls / total_ms) * 1000),
    }


results = {
    "label": LABEL,
    "python": sys.version.split()[0],
    "generated_at": datetime.now(UTC).isoformat(),
    "benchmarks": [],
}

for config_key in CONFIGS:
    results["benchmarks"].append(measure_init(config_key))

for config_key, config in CONFIGS.items():
    filter_instance = Filter(config)
    for text_key, text in TEXTS.items():
        iterations = 5000 if text_key == "clean_long" or config_key == "all_languages" else 10_000
        row = measure(
            f"{config_key}/is_profane/{text_key}",
            lambda t=text: filter_instance.is_profane(t),
            iterations,
        )
        row.update({"config": config_key, "method": "is_profane", "text": text_key})
        results["benchmarks"].append(row)

        if config_key in {"shootout", "context_aware"}:
            row = measure(
                f"{config_key}/check_profanity/{text_key}",
                lambda t=text: filter_instance.check_profanity(t),
                min(iterations, 5000),
            )
            row.update({"config": config_key, "method": "check_profanity", "text": text_key})
            results["benchmarks"].append(row)

    if config_key in {"shootout", "context_aware"}:
        row = measure_torture_batch(filter_instance)
        row.update({"config": config_key, "method": "is_profane", "text": "torture_set_60"})
        results["benchmarks"].append(row)

cached = Filter(CONFIGS["cached_shootout"])
cached.check_profanity(TEXTS["clean_short"])
row = measure(
    "cached_shootout/check_profanity/clean_short_hit",
    lambda: cached.check_profanity(TEXTS["clean_short"]),
)
row.update({"config": "cached_shootout", "method": "check_profanity", "text": "clean_short_cached"})
results["benchmarks"].append(row)

print(json.dumps(results, indent=2))
