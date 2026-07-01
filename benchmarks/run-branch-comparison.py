#!/usr/bin/env python3
"""Run release vs feat-performance-opt benchmarks (JS + PY) and emit JSON results."""

from __future__ import annotations

import json
import os
import shutil
import subprocess
import sys
import tempfile
from datetime import UTC, datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BENCH = ROOT / "benchmarks"
RESULTS = BENCH / "results"
RELEASE_REF = "release"
FEAT_REF = "feat-performance-opt"
RUN_FULL = "--full" in sys.argv


def run(
    cmd: list[str],
    *,
    cwd: Path | None = None,
    env: dict | None = None,
    check: bool = True,
) -> subprocess.CompletedProcess:
    merged = os.environ.copy()
    if env:
        merged.update(env)
    print(f"$ {' '.join(cmd)}", flush=True)
    return subprocess.run(
        cmd,
        cwd=cwd or ROOT,
        env=merged,
        check=check,
        capture_output=True,
        text=True,
    )


def git_rev(ref: str) -> str:
    return run(["git", "rev-parse", "--short", ref]).stdout.strip()


def git_log_range(base: str, head: str) -> list[str]:
    out = run(["git", "log", f"{base}..{head}", "--oneline"]).stdout.strip()
    return [line for line in out.splitlines() if line.strip()]


def prepare_worktree(ref: str) -> Path:
    worktrees_root = ROOT / ".benchmark-worktrees"
    worktrees_root.mkdir(exist_ok=True)
    path = worktrees_root / ref.replace("/", "_")
    if path.exists():
        run(["git", "worktree", "remove", "--force", str(path)], check=False)
        if path.exists():
            shutil.rmtree(path)
    run(["git", "worktree", "add", "--detach", str(path), ref])
    return path


def build_js(tree: Path) -> None:
    js_dir = tree / "packages" / "js"
    if not (js_dir / "node_modules").exists():
        run(["npm", "install"], cwd=js_dir, env={"CI": "true"})
    run(["npm", "run", "build"], cwd=js_dir)


def run_py_benchmark(script: Path, label: str, tree: Path) -> dict:
    env = {
        "GLIN_REPO_ROOT": str(tree.resolve()),
        "PYTHONDONTWRITEBYTECODE": "1",
    }
    proc = run(
        [sys.executable, str(script), "--label", label],
        cwd=ROOT,
        env=env,
    )
    return json.loads(proc.stdout)


def run_js_benchmark(script: Path, label: str, tree: Path) -> dict:
    proc = run(
        ["node", str(script), "--label", label],
        cwd=ROOT,
        env={"GLIN_REPO_ROOT": str(tree.resolve())},
    )
    return json.loads(proc.stdout)


def run_glin_shootout_metrics(tree: Path) -> dict:
    torture_path = ROOT / "benchmarks" / "shootout" / "torture-set.json"
    cases = json.loads(torture_path.read_text(encoding="utf-8"))
    code = """
import json, os, sys
from pathlib import Path
root = Path(os.environ["GLIN_REPO_ROOT"])
sys.path.insert(0, str(root / "packages" / "py"))
from glin_profanity import Filter

cases = json.loads(Path(os.environ["TORTURE_PATH"]).read_text(encoding="utf-8"))
f = Filter({
    "languages": ["english"],
    "detect_leetspeak": True,
    "leetspeak_level": "aggressive",
    "normalize_unicode": True,
})
tp = fp = tn = fn = 0
for case in cases:
    flagged = f.is_profane(case["input"])
    expect = case.get("shouldFlag", case.get("expect") == "profane")
    if flagged and expect: tp += 1
    elif flagged and not expect: fp += 1
    elif not flagged and expect: fn += 1
    else: tn += 1
precision = tp / (tp + fp) if (tp + fp) else 0
recall = tp / (tp + fn) if (tp + fn) else 0
f1 = 2 * precision * recall / (precision + recall) if (precision + recall) else 0
fpr = fp / (fp + tn) if (fp + tn) else 0
print(json.dumps({
    "precision": f"{precision*100:.1f}%",
    "recall": f"{recall*100:.1f}%",
    "f1": f"{f1*100:.1f}%",
    "fpr": f"{fpr*100:.1f}%",
    "tp": tp, "fp": fp, "tn": tn, "fn": fn,
}))
"""
    proc = run(
        [sys.executable, "-c", code],
        cwd=ROOT,
        env={
            "GLIN_REPO_ROOT": str(tree.resolve()),
            "TORTURE_PATH": str(torture_path),
        },
    )
    return json.loads(proc.stdout.strip())


def run_tests(
    tree: Path,
    ref: str,
    *,
    js: bool = True,
    parity: bool = True,
) -> dict:
    summary: dict = {"ref": ref, "js": {}, "py": {}, "parity": {}}

    py_proc = run(
        [sys.executable, "-m", "pytest", "-q", "--tb=no"],
        cwd=tree / "packages" / "py",
        env={"GLIN_REPO_ROOT": str(tree.resolve())},
    )
    last = py_proc.stdout.strip().splitlines()[-1] if py_proc.stdout.strip() else ""
    summary["py"]["summary"] = last

    js_dir = tree / "packages" / "js"
    if js and (js_dir / "node_modules").exists():
        js_proc = run(["npm", "test", "--", "--ci", "--watchAll=false"], cwd=js_dir)
        tail = js_proc.stdout.strip().splitlines()
        summary["js"]["summary"] = next(
            (line for line in reversed(tail) if "Tests:" in line or "passed" in line),
            tail[-1] if tail else "",
        )

    parity_path = tree / "tests" / "cross_language_parity_test.py"
    if parity and parity_path.exists():
        try:
            parity_proc = run([sys.executable, str(parity_path)], cwd=tree)
            lines = parity_proc.stdout.strip().splitlines()
            summary["parity"]["summary"] = lines[-1] if lines else "passed"
        except subprocess.CalledProcessError as exc:
            summary["parity"]["summary"] = (exc.stdout or exc.stderr or str(exc)).strip().splitlines()[-1]
    else:
        summary["parity"]["summary"] = "not present on this ref"

    return summary


def run_shootout_glin(tree: Path) -> dict:
    try:
        return run_glin_shootout_metrics(tree)
    except subprocess.CalledProcessError as exc:
        return {"error": (exc.stderr or exc.stdout or str(exc))[-500:]}


def main() -> None:
    RESULTS.mkdir(parents=True, exist_ok=True)
    release_sha = git_rev(RELEASE_REF)
    feat_sha = git_rev(FEAT_REF)
    commits = git_log_range(RELEASE_REF, FEAT_REF)

    print("=== Building feat-performance-opt JS ===")
    build_js(ROOT)

    print("=== Running feat-performance-opt benchmarks ===")
    after_lite_py = run_py_benchmark(BENCH / "optimization-comparison-lite.py", "after", ROOT)
    after_lite_js = run_js_benchmark(BENCH / "optimization-comparison-lite.mjs", "after", ROOT)
    after_full_py = after_full_js = None
    if RUN_FULL:
        after_full_py = run_py_benchmark(BENCH / "optimization-comparison.py", "after", ROOT)
        after_full_js = run_js_benchmark(BENCH / "optimization-comparison.mjs", "after", ROOT)

    print("=== Preparing release worktree ===")
    release_tree = prepare_worktree(RELEASE_REF)
    build_js(release_tree)

    print("=== Running release benchmarks ===")
    before_lite_py = run_py_benchmark(BENCH / "optimization-comparison-lite.py", "before", release_tree)
    before_lite_js = run_js_benchmark(BENCH / "optimization-comparison-lite.mjs", "before", release_tree)
    before_full_py = before_full_js = None
    if RUN_FULL:
        before_full_py = run_py_benchmark(BENCH / "optimization-comparison.py", "before", release_tree)
        before_full_js = run_js_benchmark(BENCH / "optimization-comparison.mjs", "before", release_tree)

    print("=== Running test suites (feat only; release pytest only) ===")
    release_tests = run_tests(release_tree, RELEASE_REF, js=False, parity=False)
    feat_tests = run_tests(ROOT, FEAT_REF, js=True, parity=True)

    print("=== Running shootout (glin only) ===")
    release_shootout = run_shootout_glin(release_tree)
    feat_shootout = run_shootout_glin(ROOT)

    payload = {
        "generated_at": datetime.now(UTC).isoformat(),
        "release_ref": RELEASE_REF,
        "feat_ref": FEAT_REF,
        "release_sha": release_sha,
        "feat_sha": feat_sha,
        "commits": commits,
        "benchmarks": {
            "lite": {
                "before_py": before_lite_py,
                "after_py": after_lite_py,
                "before_js": before_lite_js,
                "after_js": after_lite_js,
            },
            "full": {
                "before_py": before_full_py,
                "after_py": after_full_py,
                "before_js": before_full_js,
                "after_js": after_full_js,
            },
        },
        "tests": {"release": release_tests, "feat": feat_tests},
        "shootout_glin": {"release": release_shootout, "feat": feat_shootout},
    }

    names = {
        "before-lite-py.json": before_lite_py,
        "after-lite-py.json": after_lite_py,
        "before-lite-js.json": before_lite_js,
        "after-lite-js.json": after_lite_js,
        "branch-comparison.json": payload,
    }
    if before_full_py and after_full_py:
        names["before-py.json"] = before_full_py
        names["after-py.json"] = after_full_py
    if before_full_js and after_full_js:
        names["before-js.json"] = before_full_js
        names["after-js.json"] = after_full_js
    for name, data in names.items():
        (RESULTS / name).write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    print("=== Generating markdown report ===")
    run(["node", str(BENCH / "generate-comparison-report.mjs")])

    print(f"\nDone. Report: {BENCH / 'optimization-comparison-report.md'}")


if __name__ == "__main__":
    main()
