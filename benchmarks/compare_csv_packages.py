#!/usr/bin/env python3
"""Compare glin_profanity 3.4.0 vs feat-performance-opt on CSV text column."""

from __future__ import annotations

import json
import sys
import time
from pathlib import Path

import pandas as pd

CSV_PATH = Path(
    "/Users/wlike/Downloads/请求明细(safetyScore_ge_0.6)_2026-06-24_10_56_28.csv"
)
PACKAGE_V340 = Path("/Users/wlike/Downloads/glin_profanity-3.4.0")
PACKAGE_OPT = Path("/Users/wlike/Documents/learn/glin-profanity/packages/py")
OUTPUT_XLSX = Path(
    "/Users/wlike/Downloads/glin_profanity_comparison_2026-06-24.xlsx"
)

# Override every language dictionary with the saylo curated word lists.
SAYLO_DICT_DIR = Path(
    "/Users/wlike/Documents/saylo/saylo_dialog_safety/config/dictionaries"
)

# Sentinel language key meaning "scan against every saylo dictionary at once".
ALL_LANGUAGES_KEY = "all"

FILTER_CONFIG_BASE = {
    "detect_leetspeak": True,
    "normalize_unicode": True,
}


def load_saylo_dictionaries() -> dict[str, list[str]]:
    """Load every ``<language>.json`` (a plain string array) from saylo."""
    if not SAYLO_DICT_DIR.exists():
        raise SystemExit(f"saylo dictionary dir not found: {SAYLO_DICT_DIR}")
    dicts: dict[str, list[str]] = {}
    for path in sorted(SAYLO_DICT_DIR.glob("*.json")):
        with path.open(encoding="utf-8") as handle:
            data = json.load(handle)
        if not isinstance(data, list):
            raise SystemExit(f"Unexpected format (need array) in {path}")
        dicts[path.stem] = [str(word) for word in data]
    if not dicts:
        raise SystemExit(f"No dictionaries loaded from {SAYLO_DICT_DIR}")
    print(
        "Loaded saylo dictionaries: "
        + ", ".join(f"{lang}={len(words)}" for lang, words in dicts.items())
    )
    return dicts


def words_for_language_key(
    saylo_dicts: dict[str, list[str]], language_key: str
) -> list[str]:
    """Return the saylo word list for a language key (or all combined).

    English profanity is overlaid onto every single-language dictionary because
    cross-language chat texts very frequently contain English slurs (e.g. a
    German/Italian sentence with "fuck"/"cock"); without this overlay those hits
    are silently missed.
    """
    if language_key == ALL_LANGUAGES_KEY:
        combined: list[str] = []
        for words in saylo_dicts.values():
            combined.extend(words)
        return combined
    if language_key not in saylo_dicts:
        # Saylo has no dictionary for this language: fall back to all words so we
        # never silently under-detect.
        combined = []
        for words in saylo_dicts.values():
            combined.extend(words)
        return combined
    words = list(saylo_dicts[language_key])
    if language_key != "english":
        words.extend(saylo_dicts.get("english", []))
    return words

# CSV locale tags -> glin-profanity dictionary language keys
LOCALE_TO_LANGUAGE: dict[str, str] = {
    "en-US": "english",
    "es-ES": "spanish",
    "pt-BR": "portuguese",
    "ja-JP": "japanese",
    "zh-Hant-TW": "chinese",
    "zh-Hans-CN": "chinese",
    "fr-FR": "french",
    "de-DE": "german",
    "it-IT": "italian",
}

PREFIX_TO_LANGUAGE: dict[str, str] = {
    "en": "english",
    "es": "spanish",
    "pt": "portuguese",
    "ja": "japanese",
    "zh": "chinese",
    "fr": "french",
    "de": "german",
    "it": "italian",
}


def locale_to_language(locale: object) -> str:
    """Map CSV ``language`` column value to a dictionary language key.

    A missing/``-`` locale means "language unknown" -> scan with every
    dictionary (``ALL_LANGUAGES_KEY``).
    """
    raw = str(locale or "").strip()
    if not raw or raw == "-":
        return ALL_LANGUAGES_KEY
    if raw in LOCALE_TO_LANGUAGE:
        return LOCALE_TO_LANGUAGE[raw]
    prefix = raw.split("-", 1)[0].lower()
    return PREFIX_TO_LANGUAGE.get(prefix, ALL_LANGUAGES_KEY)


def unload_glin_profanity() -> None:
    for name in list(sys.modules):
        if name == "glin_profanity" or name.startswith("glin_profanity."):
            del sys.modules[name]


def load_filter(package_parent: Path, language_key: str, custom_words: list[str]):
    unload_glin_profanity()
    parent = str(package_parent.resolve())
    sys.path = [p for p in sys.path if Path(p).resolve() != package_parent.resolve()]
    sys.path.insert(0, parent)
    from glin_profanity.filters.filter import Filter

    # languages=[] disables the bundled dictionaries; the saylo words are
    # injected via custom_words so both packages run on the same vocabulary.
    config = {**FILTER_CONFIG_BASE, "languages": [], "custom_words": custom_words}
    return Filter(config)


def run_batch(
    label: str,
    package_parent: Path,
    texts: list[str],
    languages: list[str],
    saylo_dicts: dict[str, list[str]],
) -> tuple[list[bool], list[str], list[frozenset[str]], list[float], list[str]]:
    print(f"Loading Filter from {package_parent} ({label})...")
    filters: dict[str, object] = {}
    mapped_languages: list[str] = []

    contains_list: list[bool] = []
    words_list: list[str] = []
    words_sets: list[frozenset[str]] = []
    time_list: list[float] = []

    total = len(texts)
    for i, (text, locale) in enumerate(zip(texts, languages, strict=True)):
        if i > 0 and i % 1000 == 0:
            print(f"  [{label}] {i}/{total}...")
        language = locale_to_language(locale)
        mapped_languages.append(language)
        if language not in filters:
            custom_words = words_for_language_key(saylo_dicts, language)
            filters[language] = load_filter(package_parent, language, custom_words)
            filt = filters[language]
            print(
                f"  [{label}] cached language={language!r}, "
                f"words={filt.get_word_count()}"
            )
        filt = filters[language]

        start = time.perf_counter()
        result = filt.check_profanity(text if isinstance(text, str) else str(text))
        elapsed_ms = (time.perf_counter() - start) * 1000
        contains_list.append(bool(result.get("contains_profanity", False)))
        words = result.get("profane_words") or []
        word_set = frozenset(words)
        words_sets.append(word_set)
        words_list.append("; ".join(words))
        time_list.append(elapsed_ms)

    return contains_list, words_list, words_sets, time_list, mapped_languages


def classify_results_match(
    v340_contains: bool,
    opt_contains: bool,
    v340_words: frozenset[str],
    opt_words: frozenset[str],
) -> str:
    if v340_contains != opt_contains:
        return "false"
    if v340_words == opt_words:
        return "true"
    return "half"


def main(csv_path: Path = CSV_PATH, output_xlsx: Path = OUTPUT_XLSX) -> None:
    if not csv_path.exists():
        raise SystemExit(f"CSV not found: {csv_path}")

    print(f"Reading {csv_path}...")
    df = pd.read_csv(csv_path, encoding="utf-8")
    if "text" not in df.columns:
        raise SystemExit(f"Missing 'text' column. Columns: {list(df.columns)}")
    if "language" not in df.columns:
        raise SystemExit(f"Missing 'language' column. Columns: {list(df.columns)}")

    texts = df["text"].fillna("").astype(str).tolist()
    locales = df["language"].fillna("").tolist()
    print(f"Rows: {len(texts)}")

    saylo_dicts = load_saylo_dictionaries()

    v340_contains, v340_words, v340_word_sets, v340_times, dict_langs = run_batch(
        "3.4.0", PACKAGE_V340, texts, locales, saylo_dicts
    )
    opt_contains, opt_words, opt_word_sets, opt_times, _ = run_batch(
        "feat-opt", PACKAGE_OPT, texts, locales, saylo_dicts
    )

    df["dictionary_language"] = dict_langs
    df["v340_contains_profanity"] = v340_contains
    df["v340_profane_words"] = v340_words
    df["v340_time_ms"] = v340_times
    df["opt_contains_profanity"] = opt_contains
    df["opt_profane_words"] = opt_words
    df["opt_time_ms"] = opt_times
    df["results_match"] = [
        classify_results_match(
            v340_contains[i], opt_contains[i], v340_word_sets[i], opt_word_sets[i]
        )
        for i in range(len(texts))
    ]

    v340_avg = sum(v340_times) / len(v340_times) if v340_times else 0.0
    opt_avg = sum(opt_times) / len(opt_times) if opt_times else 0.0
    v340_total = sum(v340_times)
    opt_total = sum(opt_times)
    true_count = int((df["results_match"] == "true").sum())
    half_count = int((df["results_match"] == "half").sum())
    false_count = int((df["results_match"] == "false").sum())
    v340_flagged = sum(v340_contains)
    opt_flagged = sum(opt_contains)
    total_rows = len(df)

    summary = pd.DataFrame(
        [
            {"metric": "total_rows", "value": total_rows},
            {"metric": "v340_avg_time_ms", "value": round(v340_avg, 4)},
            {"metric": "opt_avg_time_ms", "value": round(opt_avg, 4)},
            {"metric": "v340_total_time_ms", "value": round(v340_total, 2)},
            {"metric": "opt_total_time_ms", "value": round(opt_total, 2)},
            {"metric": "speedup_vs_v340", "value": round(v340_avg / opt_avg, 4) if opt_avg else None},
            {"metric": "v340_flagged_count", "value": v340_flagged},
            {"metric": "opt_flagged_count", "value": opt_flagged},
            {"metric": "results_match_true_count", "value": true_count},
            {"metric": "results_match_half_count", "value": half_count},
            {"metric": "results_match_false_count", "value": false_count},
            {
                "metric": "results_match_true_rate_pct",
                "value": round(100 * true_count / total_rows, 4) if total_rows else 0,
            },
            {
                "metric": "results_match_half_rate_pct",
                "value": round(100 * half_count / total_rows, 4) if total_rows else 0,
            },
            {
                "metric": "results_match_false_rate_pct",
                "value": round(100 * false_count / total_rows, 4) if total_rows else 0,
            },
        ]
    )

    print(f"Writing {output_xlsx}...")
    with pd.ExcelWriter(output_xlsx, engine="openpyxl") as writer:
        df.to_excel(writer, sheet_name="明细", index=False)
        summary.to_excel(writer, sheet_name="汇总", index=False)

    print("Done.")
    print(f"  v340 avg: {v340_avg:.4f} ms | opt avg: {opt_avg:.4f} ms")
    print(
        f"  flagged: v340={v340_flagged} opt={opt_flagged} | "
        f"match true={true_count} half={half_count} false={false_count}"
    )


if __name__ == "__main__":
    if len(sys.argv) > 1:
        csv_arg = Path(sys.argv[1])
        out_arg = Path(sys.argv[2]) if len(sys.argv) > 2 else OUTPUT_XLSX
        main(csv_arg, out_arg)
    else:
        main()
