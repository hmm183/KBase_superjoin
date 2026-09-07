from __future__ import annotations
from enum import Enum
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class ContradictionClass(str, Enum):
    CORROBORATES = "CORROBORATES"
    CONTEXTUAL_DIFFERENCE = "CONTEXTUAL_DIFFERENCE"
    UNIT_MISMATCH = "UNIT_MISMATCH"
    SCOPE_MISMATCH = "SCOPE_MISMATCH"
    TIME_MISMATCH = "TIME_MISMATCH"
    DEFINITION_MISMATCH = "DEFINITION_MISMATCH"
    FORECAST_ACTUAL_MISMATCH = "FORECAST_ACTUAL_MISMATCH"
    REVISION = "REVISION"
    PARTIAL_CONTRADICTION = "PARTIAL_CONTRADICTION"
    LIKELY_CONTRADICTION = "LIKELY_CONTRADICTION"
    GENUINE_CONTRADICTION = "GENUINE_CONTRADICTION"
    UNRESOLVED = "UNRESOLVED"

class HypothesisCard(BaseModel):
    hypothesis_id: str
    code: str # e.g. "H1", "H2"
    title: str # e.g. "Calendar Year vs Fiscal Year Offset"
    description: str
    probability: float
    is_primary: bool = False
    supporting_factors: List[str] = Field(default_factory=list)
    counter_factors: List[str] = Field(default_factory=list)

class WhatWouldChangeMyMind(BaseModel):
    criterion_id: str
    condition_description: str # e.g. "Provide statutory standalone financial statements for Delhivery FY24"
    status: str = "PENDING" # "PENDING", "VERIFIED", "NOT_AVAILABLE"
    impact_direction: str # e.g. "Flips GENUINE_CONTRADICTION to SCOPE_MISMATCH"

class PairwiseRelation(BaseModel):
    relation_id: str
    fact_a_id: str
    fact_b_id: str
    fact_a_summary: str
    fact_b_summary: str
    classification: ContradictionClass
    confidence: float
    feature_contributions: Dict[str, float] = Field(default_factory=dict)
    hypotheses: List[HypothesisCard] = Field(default_factory=list)
    what_would_change_my_mind: List[WhatWouldChangeMyMind] = Field(default_factory=list)
    symbolic_rule_triggered: Optional[str] = None
    ml_probabilities: Dict[str, float] = Field(default_factory=dict)
    human_adjudicated: bool = False
    adjudicated_label: Optional[ContradictionClass] = None
    reviewer_notes: Optional[str] = None
    created_at: Optional[str] = None
