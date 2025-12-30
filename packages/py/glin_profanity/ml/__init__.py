"""
ML-based profanity and toxicity detection module.

This module provides optional ML-based detection using:
- detoxify (transformer-based, more accurate)
- profanity-check (SVM-based, faster)

Install dependencies:
    # For transformer-based detection (slower, more accurate)
    pip install detoxify torch

    # For lightweight detection (faster, simpler)
    pip install profanity-check

    # Or install with extras
    pip install glin-profanity[ml]  # Both
    pip install glin-profanity[ml-transformer]  # Just transformer
    pip install glin-profanity[ml-lightweight]  # Just lightweight

Example:
    >>> # Standalone lightweight detector (fast)
    >>> from glin_profanity.ml import LightweightDetector
    >>>
    >>> detector = LightweightDetector()
    >>> result = detector.analyze("some text")
    >>> print(result["is_toxic"])
    >>>
    >>> # Standalone transformer detector (accurate)
    >>> from glin_profanity.ml import ToxicityDetector
    >>>
    >>> detector = ToxicityDetector({"model_type": "original"})
    >>> result = detector.analyze("some text")
    >>>
    >>> # Hybrid filter (combines rules + ML)
    >>> from glin_profanity.ml import HybridFilter
    >>>
    >>> filter = HybridFilter({
    ...     "languages": ["english"],
    ...     "detect_leetspeak": True,
    ...     "enable_ml": True,
    ...     "ml_type": "lightweight",
    ... })
    >>> result = filter.check_profanity_hybrid("some text")
"""

from .hybrid import HybridFilter, HybridFilterConfig
from .lightweight import LightweightDetector
from .toxicity import ToxicityDetector
from .types import (
    CombinationMode,
    HybridAnalysisResult,
    MLAnalysisResult,
    MLDetectorConfig,
    ToxicityLabel,
    ToxicityPrediction,
)

__all__ = [
    # Detectors
    "ToxicityDetector",
    "LightweightDetector",
    "HybridFilter",
    # Config types
    "HybridFilterConfig",
    "MLDetectorConfig",
    # Result types
    "MLAnalysisResult",
    "HybridAnalysisResult",
    "ToxicityLabel",
    "ToxicityPrediction",
    "CombinationMode",
]
