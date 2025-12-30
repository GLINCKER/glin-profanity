"""Type definitions for ML-based profanity detection."""

from __future__ import annotations

from enum import Enum
from typing import Literal, TypedDict


class ToxicityLabel(str, Enum):
    """Toxicity categories detected by ML models."""

    TOXIC = "toxic"
    SEVERE_TOXIC = "severe_toxic"
    OBSCENE = "obscene"
    THREAT = "threat"
    INSULT = "insult"
    IDENTITY_ATTACK = "identity_attack"
    SEXUAL_EXPLICIT = "sexual_explicit"


class ToxicityPrediction(TypedDict, total=False):
    """Result from a single toxicity prediction."""

    label: str
    score: float
    match: bool


class MLAnalysisResult(TypedDict, total=False):
    """Result from ML-based toxicity analysis."""

    is_toxic: bool
    overall_score: float
    predictions: dict[str, float]
    matched_categories: list[str]
    processing_time_ms: float
    model_type: str


class MLDetectorConfig(TypedDict, total=False):
    """Configuration for ML toxicity detectors."""

    threshold: float
    """Minimum confidence threshold for predictions. Default: 0.5"""

    model_type: Literal["original", "unbiased", "multilingual"]
    """Model type for detoxify. Default: 'original'"""

    device: Literal["cpu", "cuda", "mps"]
    """Device for inference. Default: 'cpu'"""

    preload_model: bool
    """Whether to load model immediately. Default: False"""


class HybridAnalysisResult(TypedDict, total=False):
    """Combined result from both rule-based and ML detection."""

    rule_based_result: dict[str, object]
    ml_result: MLAnalysisResult | None
    is_toxic: bool
    confidence: float
    reason: str


CombinationMode = Literal["or", "and", "ml-override", "rules-first"]
"""How to combine rule-based and ML results."""
