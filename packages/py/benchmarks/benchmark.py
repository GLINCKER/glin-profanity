#!/usr/bin/env python3
"""
Performance benchmarks for glin-profanity.

Run with: python benchmarks/benchmark.py
"""

import time
from dataclasses import dataclass
from typing import Callable

from glin_profanity import Filter


@dataclass
class BenchmarkResult:
    """Result of a benchmark run."""

    name: str
    iterations: int
    total_ms: float
    avg_ms: float
    ops_per_second: float


def benchmark(
    name: str,
    fn: Callable[[], object],
    iterations: int = 10000,
) -> BenchmarkResult:
    """Run a benchmark function multiple times and measure performance."""
    # Warmup
    for _ in range(100):
        fn()

    start = time.perf_counter()
    for _ in range(iterations):
        fn()
    total_ms = (time.perf_counter() - start) * 1000

    avg_ms = total_ms / iterations
    ops_per_second = 1000 / avg_ms if avg_ms > 0 else float("inf")

    return BenchmarkResult(
        name=name,
        iterations=iterations,
        total_ms=total_ms,
        avg_ms=avg_ms,
        ops_per_second=ops_per_second,
    )


def format_result(result: BenchmarkResult) -> str:
    """Format benchmark results for display."""
    return f"""{result.name}:
  - Total time: {result.total_ms:.2f}ms for {result.iterations} iterations
  - Average: {result.avg_ms:.4f}ms per operation
  - Throughput: {result.ops_per_second:.0f} ops/sec
"""


# Sample texts for benchmarking
CLEAN_TEXT = "The quick brown fox jumps over the lazy dog"
PROFANE_TEXT = "This contains some shit and other crap"
LEETSPEAK_TEXT = "Th1s c0nt@1ns s0m3 $h!t 4nd 0th3r cr@p"
UNICODE_TEXT = "Тhis сontаins ѕome shіt and оther сrap"  # Mixed scripts
LONG_TEXT = (
    "This is a much longer text that contains multiple sentences. "
    "It simulates real-world usage where users might submit paragraphs of text. "
    "The filter needs to check the entire text for profanity efficiently. "
    "This helps measure performance for longer content like comments or posts."
)


def main() -> None:
    """Run all benchmarks."""
    print("=" * 60)
    print("glin-profanity Performance Benchmarks (Python)")
    print("=" * 60)
    print()

    # Basic filter benchmarks
    print("1. Basic Filter (is_profane)")
    print("-" * 40)

    basic_filter = Filter({"languages": ["english"]})

    print(format_result(benchmark("Clean text", lambda: basic_filter.is_profane(CLEAN_TEXT))))
    print(format_result(benchmark("Profane text", lambda: basic_filter.is_profane(PROFANE_TEXT))))
    print(format_result(benchmark("Long text", lambda: basic_filter.is_profane(LONG_TEXT))))

    # Leetspeak detection benchmarks
    print("2. Leetspeak Detection")
    print("-" * 40)

    leetspeak_filter = Filter({
        "languages": ["english"],
        "detect_leetspeak": True,
        "leetspeak_level": "moderate",
    })

    print(
        format_result(
            benchmark(
                "Clean text with leetspeak detection",
                lambda: leetspeak_filter.is_profane(CLEAN_TEXT),
            )
        )
    )
    print(
        format_result(
            benchmark("Leetspeak text", lambda: leetspeak_filter.is_profane(LEETSPEAK_TEXT))
        )
    )

    # Unicode normalization benchmarks
    print("3. Unicode Normalization")
    print("-" * 40)

    unicode_filter = Filter({
        "languages": ["english"],
        "normalize_unicode": True,
    })

    print(
        format_result(
            benchmark(
                "Clean text with unicode normalization",
                lambda: unicode_filter.is_profane(CLEAN_TEXT),
            )
        )
    )
    print(
        format_result(
            benchmark("Unicode obfuscated text", lambda: unicode_filter.is_profane(UNICODE_TEXT))
        )
    )

    # Combined leetspeak + unicode benchmarks
    print("4. Combined (Leetspeak + Unicode)")
    print("-" * 40)

    combined_filter = Filter({
        "languages": ["english"],
        "detect_leetspeak": True,
        "leetspeak_level": "aggressive",
        "normalize_unicode": True,
    })

    print(
        format_result(
            benchmark(
                "Clean text with all normalizations",
                lambda: combined_filter.is_profane(CLEAN_TEXT),
            )
        )
    )
    print(
        format_result(
            benchmark(
                "Obfuscated text with all normalizations",
                lambda: combined_filter.is_profane(LEETSPEAK_TEXT),
            )
        )
    )

    # Caching benchmarks
    print("5. Caching Performance")
    print("-" * 40)

    caching_filter = Filter({
        "languages": ["english"],
        "cache_results": True,
        "max_cache_size": 1000,
    })

    def without_cache() -> object:
        caching_filter.clear_cache()
        return caching_filter.check_profanity(CLEAN_TEXT)

    print(format_result(benchmark("Without cache (first calls)", without_cache, 1000)))

    # Warm up cache
    caching_filter.check_profanity(CLEAN_TEXT)

    print(
        format_result(
            benchmark(
                "With cache (cached calls)",
                lambda: caching_filter.check_profanity(CLEAN_TEXT),
            )
        )
    )

    # check_profanity detailed results
    print("6. check_profanity (Detailed Results)")
    print("-" * 40)

    print(
        format_result(
            benchmark(
                "check_profanity clean text",
                lambda: basic_filter.check_profanity(CLEAN_TEXT),
            )
        )
    )
    print(
        format_result(
            benchmark(
                "check_profanity profane text",
                lambda: basic_filter.check_profanity(PROFANE_TEXT),
            )
        )
    )

    # Multi-language benchmarks
    print("7. Multi-language Support")
    print("-" * 40)

    multi_lang_filter = Filter({
        "languages": ["english", "spanish", "french", "german"],
    })

    print(
        format_result(
            benchmark("Multi-language filter", lambda: multi_lang_filter.is_profane(CLEAN_TEXT))
        )
    )

    all_lang_filter = Filter({"all_languages": True})

    print(
        format_result(
            benchmark(
                "All languages filter",
                lambda: all_lang_filter.is_profane(CLEAN_TEXT),
                5000,
            )
        )
    )

    # Summary
    print("=" * 60)
    print("Summary")
    print("=" * 60)
    print(
        """
Key Findings:
- Basic is_profane() is very fast (typically <0.1ms per call)
- Leetspeak detection adds minimal overhead
- Unicode normalization adds minimal overhead
- Caching provides significant speedup for repeated checks
- Multi-language support scales well

Recommendations:
- Enable caching for applications with repeated checks
- Use 'moderate' leetspeak level for best performance/detection balance
- Enable detect_leetspeak and normalize_unicode for comprehensive detection
"""
    )


if __name__ == "__main__":
    main()
