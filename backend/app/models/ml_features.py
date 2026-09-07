from __future__ import annotations
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from backend.app.models.contradiction import ContradictionClass

class PairwiseFeatureVector(BaseModel):
    entity_similarity: float = 0.0 # [0, 1] Jaro-Winkler string similarity
    entity_embedding_cosine: float = 0.0 # [0, 1] Semantic similarity
    metric_similarity: float = 0.0 # [0, 1] Levenshtein/token distance
    metric_definition_cosine: float = 0.0 # [0, 1] Metric definition similarity
    numeric_relative_diff: float = 0.0 # |v1 - v2| / max(|v1|, |v2|)
    numeric_log_ratio: float = 0.0 # log10(v1 / v2) to catch 10x/1000x unit jumps
    unit_compatibility: float = 1.0 # 1.0 = identical, 0.5 = convertible, 0.0 = incompatible
    temporal_period_overlap_iou: float = 0.0 # [0, 1] IoU of start/end dates
    temporal_vintage_delta_days: float = 0.0 # Normalized day delta between publications
    forecast_status_match: float = 1.0 # 1.0 = both actual/forecast, 0.0 = mixed
    scope_overlap_score: float = 1.0 # 1.0 = both consolidated, 0.5 = sub-segment
    source_independence_score: float = 1.0 # 1.0 = independent, 0.0 = cites other

    def to_list(self) -> List[float]:
        return [
            self.entity_similarity,
            self.entity_embedding_cosine,
            self.metric_similarity,
            self.metric_definition_cosine,
            self.numeric_relative_diff,
            self.numeric_log_ratio,
            self.unit_compatibility,
            self.temporal_period_overlap_iou,
            self.temporal_vintage_delta_days,
            self.forecast_status_match,
            self.scope_overlap_score,
            self.source_independence_score,
        ]

    @classmethod
    def feature_names(cls) -> List[str]:
        return [
            "entity_similarity",
            "entity_embedding_cosine",
            "metric_similarity",
            "metric_definition_cosine",
            "numeric_relative_diff",
            "numeric_log_ratio",
            "unit_compatibility",
            "temporal_period_overlap_iou",
            "temporal_vintage_delta_days",
            "forecast_status_match",
            "scope_overlap_score",
            "source_independence_score",
        ]

class TrainingInstance(BaseModel):
    instance_id: str
    fact_a_id: str
    fact_b_id: str
    features: PairwiseFeatureVector
    label: ContradictionClass
    source_type: str = "synthetic" # "synthetic" or "gold_human"
    metadata: Dict[str, Any] = Field(default_factory=dict)

class EvaluationMetrics(BaseModel):
    total_test_samples: int
    accuracy: float
    macro_f1: float
    weighted_f1: float
    evidence_grounding_rate: float
    hallucination_rate: float
    per_class_f1: Dict[str, float] = Field(default_factory=dict)
    confusion_matrix: Dict[str, Dict[str, int]] = Field(default_factory=dict)
    failure_taxonomy_counts: Dict[str, int] = Field(default_factory=dict)
    model_version: str = "v1.0"
    timestamp: Optional[str] = None

class ActiveLearningQueueItem(BaseModel):
    queue_id: str
    fact_a_id: str
    fact_b_id: str
    fact_a_label: str
    fact_b_label: str
    predicted_class: ContradictionClass
    confidence: float
    uncertainty_score: float # Entropy or margin
    alternative_class: Optional[ContradictionClass] = None
    created_at: Optional[str] = None
    status: str = "PENDING" # "PENDING", "ADJUDICATED", "SKIPPED"
