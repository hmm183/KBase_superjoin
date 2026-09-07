from __future__ import annotations
import hashlib
from enum import Enum
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class ObservationType(str, Enum):
    ACTUAL = "actual"
    ESTIMATE = "estimate"
    REVISION = "revision"
    PROJECTION = "projection"
    TARGET = "target"
    HISTORICAL = "historical"

class UnitType(str, Enum):
    PERCENTAGE = "percentage"
    CURRENCY_INR_CRORE = "inr_crore"
    CURRENCY_INR_LAKH = "inr_lakh"
    CURRENCY_USD_MILLION = "usd_million"
    CURRENCY_USD_BILLION = "usd_billion"
    METRIC_TONNES = "metric_tonnes"
    COUNT = "count"
    RATIO = "ratio"
    BASIS_POINTS = "basis_points"
    INDEX_POINTS = "index_points"
    UNKNOWN = "unknown"

class FactSubject(BaseModel):
    entity_id: str
    canonical_name: str
    aliases: List[str] = Field(default_factory=list)
    entity_type: str = "ORGANIZATION" # ORGANIZATION, GEOGRAPHY, REGULATOR, SECTOR

class FactPredicate(BaseModel):
    metric_id: str
    name: str # e.g. "EBITDA", "Real GDP Growth", "Revenue from Operations"
    category: str = "FINANCIAL" # FINANCIAL, MACROECONOMIC, OPERATIONAL
    standard_definition: Optional[str] = None

class FactValue(BaseModel):
    raw_text: str # e.g. "₹126.6 Cr"
    normalized_value: float # e.g. 126.6
    unit: UnitType = UnitType.UNKNOWN
    scale_multiplier: float = 1.0 # Multiplier to base unit (e.g. 1e7 for Crore)
    currency: Optional[str] = None # "INR", "USD"

class TemporalScope(BaseModel):
    reference_period: str # e.g. "FY2023-24", "Q4 FY24", "CY2024"
    period_start: Optional[str] = None # ISO date
    period_end: Optional[str] = None # ISO date
    publication_time: Optional[str] = None # Publication date of source
    data_vintage: str = "v1" # Vintage stamp (e.g. "2024-Q4-Prelim")
    observation_type: ObservationType = ObservationType.ACTUAL

class FactProvenance(BaseModel):
    document_id: str
    document_title: str
    document_hash: str
    page_number: int
    bounding_box: Optional[List[float]] = None # [x1, y1, x2, y2]
    table_cell: Optional[str] = None # e.g. "Row 4, Col 2" or "C7"
    raw_snippet: str
    parser_engine: str = "docling_v2" # "docling_v2", "pymupdf", "pp_structure"
    parser_confidence: float = 0.95
    evidence_id: Optional[str] = None

class CanonicalFact(BaseModel):
    fact_id: str
    fingerprint: str
    subject: FactSubject
    predicate: FactPredicate
    value: FactValue
    temporal: TemporalScope
    scope_accounting: str = "CONSOLIDATED" # CONSOLIDATED, STANDALONE, NATIONAL, URBAN
    provenance: FactProvenance
    confidence_score: float = 1.0
    independent_source_count: int = 1
    citations: List[str] = Field(default_factory=list)
    created_at: Optional[str] = None

    @classmethod
    def generate_fingerprint(
        cls,
        entity_name: str,
        metric_name: str,
        period: str,
        scope: str = "CONSOLIDATED",
        obs_type: str = "ACTUAL"
    ) -> str:
        """
        Deterministic conceptual fingerprint hashing.
        Allows exact conceptual matching across varied phrasing.
        """
        clean_entity = "".join(e for e in entity_name.upper() if e.isalnum())
        clean_metric = "".join(m for m in metric_name.upper() if m.isalnum())
        clean_period = "".join(p for p in period.upper() if p.isalnum())
        clean_scope = "".join(s for s in scope.upper() if s.isalnum())
        clean_obs = obs_type.upper()
        
        raw_key = f"{clean_entity}|{clean_metric}|{clean_period}|{clean_scope}|{clean_obs}"
        hash_val = hashlib.sha256(raw_key.encode("utf-8")).hexdigest()[:12]
        return f"FP_{clean_entity}_{clean_metric}_{clean_period}_{hash_val}"
