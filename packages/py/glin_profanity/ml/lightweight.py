"""
Lightweight ML-based profanity detection using profanity-check.

This module provides a fast, lightweight ML-based profanity detection
using the profanity-check library built on scikit-learn.

IMPORTANT: This requires an optional dependency:
- profanity-check

Install with: pip install profanity-check

Example:
    >>> from glin_profanity.ml import LightweightDetector
    >>>
    >>> detector = LightweightDetector()
    >>> result = detector.analyze("some text to check")
    >>> print(result["is_toxic"])

Performance:
    - Model size: ~2MB (vs ~500MB+ for transformer models)
    - Inference: ~0.1ms per prediction (300-4000x faster than transformers)
    - Accuracy: 95% (slightly lower than transformer models)
"""

from __future__ import annotations

import time

from .types import MLAnalysisResult


class LightweightDetector:
    """
    Lightweight ML-based profanity detector using profanity-check.

    This class provides a fast SVM-based profanity detection using
    a model trained on 200k human-labeled samples.

    Compared to transformer-based models:
    - Much faster inference (~0.1ms vs ~30ms+)
    - Smaller memory footprint (~2MB vs ~500MB+)
    - Slightly lower accuracy (95% vs 97%+)

    Example:
        >>> detector = LightweightDetector()
        >>> result = detector.analyze("you are terrible")
        >>> print(result["is_toxic"])  # True
        >>> print(result["overall_score"])  # 0.85
    """

    def __init__(self, threshold: float = 0.5) -> None:
        """
        Initialize the lightweight detector.

        Args:
            threshold: Minimum confidence threshold for flagging (0-1)
        """
        self.threshold = threshold
        self._is_available: bool | None = None

    def check_availability(self) -> bool:
        """
        Check if profanity-check is available.

        Returns:
            True if the dependency is available
        """
        if self._is_available is not None:
            return self._is_available

        try:
            from profanity_check import predict, predict_prob  # noqa: F401

            self._is_available = True
        except ImportError:
            self._is_available = False

        return self._is_available

    def analyze(self, text: str) -> MLAnalysisResult:
        """
        Analyze text for profanity using the lightweight model.

        Args:
            text: Text to analyze

        Returns:
            Analysis result with predictions and scores

        Example:
            >>> detector = LightweightDetector()
            >>> result = detector.analyze("you are stupid")
            >>> print(result["is_toxic"])  # True
            >>> print(result["overall_score"])  # 0.87
        """
        start_time = time.perf_counter()

        try:
            from profanity_check import predict_prob
        except ImportError as e:
            raise ImportError(
                "profanity-check not installed. Install with: pip install profanity-check"
            ) from e

        # Get probability score
        scores = predict_prob([text])
        score = float(scores[0])

        processing_time_ms = (time.perf_counter() - start_time) * 1000

        is_toxic = score >= self.threshold

        return {
            "is_toxic": is_toxic,
            "overall_score": score,
            "predictions": {"profanity": score},
            "matched_categories": ["profanity"] if is_toxic else [],
            "processing_time_ms": processing_time_ms,
            "model_type": "profanity-check-svm",
        }

    def analyze_batch(self, texts: list[str]) -> list[MLAnalysisResult]:
        """
        Analyze multiple texts in a batch.

        Args:
            texts: List of texts to analyze

        Returns:
            List of analysis results

        Example:
            >>> detector = LightweightDetector()
            >>> results = detector.analyze_batch(["hello", "damn you", "great!"])
            >>> for r in results:
            ...     print(r["is_toxic"])
        """
        if not texts:
            return []

        start_time = time.perf_counter()

        try:
            from profanity_check import predict_prob
        except ImportError as e:
            raise ImportError(
                "profanity-check not installed. Install with: pip install profanity-check"
            ) from e

        # Batch prediction
        scores = predict_prob(texts)

        total_time_ms = (time.perf_counter() - start_time) * 1000
        per_text_time_ms = total_time_ms / len(texts)

        results: list[MLAnalysisResult] = []

        for score in scores:
            score_float = float(score)
            is_toxic = score_float >= self.threshold

            results.append(
                {
                    "is_toxic": is_toxic,
                    "overall_score": score_float,
                    "predictions": {"profanity": score_float},
                    "matched_categories": ["profanity"] if is_toxic else [],
                    "processing_time_ms": per_text_time_ms,
                    "model_type": "profanity-check-svm",
                }
            )

        return results

    def is_toxic(self, text: str) -> bool:
        """
        Simple boolean check for profanity.

        Args:
            text: Text to check

        Returns:
            True if text is detected as profane
        """
        result = self.analyze(text)
        return result["is_toxic"]

    def get_score(self, text: str) -> float:
        """
        Get the profanity score for text (0-1).

        Args:
            text: Text to score

        Returns:
            Profanity score from 0 (clean) to 1 (profane)
        """
        result = self.analyze(text)
        return result["overall_score"]
