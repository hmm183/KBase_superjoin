from __future__ import annotations
from enum import Enum
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class NodeType(str, Enum):
    DOCUMENT = "DOCUMENT"
    ENTITY = "ENTITY"
    FACT = "FACT"
    METRIC = "METRIC"
    EVIDENCE = "EVIDENCE"

class LinkType(str, Enum):
    CONTAINS_PAGE = "CONTAINS_PAGE"
    HAS_EVIDENCE = "HAS_EVIDENCE"
    SUPPORTS = "SUPPORTS"
    CORROBORATES = "CORROBORATES"
    CONTRADICTS = "CONTRADICTS"
    CONTEXTUAL_DIFF = "CONTEXTUAL_DIFF"
    REVISES = "REVISES"
    CITES = "CITES"
    DEFINES = "DEFINES"
    ALIAS_OF = "ALIAS_OF"

class GalaxyNode(BaseModel):
    id: str
    node_type: NodeType
    label: str
    secondary_label: Optional[str] = None
    value: Optional[float] = None
    unit: Optional[str] = None
    color: str # Hex color for 3D/Canvas rendering
    size: float = 1.0 # Visual node radius
    period: Optional[str] = None
    year: Optional[int] = None
    vintage: Optional[str] = None
    status: str = "NORMAL" # "NORMAL", "CORROBORATED", "CONTRADICTION", "FORECAST", "REVISION"
    pulse_intensity: float = 0.0 # [0, 1] for pulsating contradiction/tension glow
    document_id: Optional[str] = None
    page_number: Optional[int] = None
    bounding_box: Optional[List[float]] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)

class GalaxyLink(BaseModel):
    id: str
    source: str
    target: str
    link_type: LinkType
    weight: float = 1.0
    color: str = "#4B5563"
    is_tension_laser: bool = False # Renders as vibrating red energy beam if contradiction
    delta_value: Optional[str] = None # e.g. "Δ +1000%" or "FY24 vs FY25"
    metadata: Dict[str, Any] = Field(default_factory=dict)

class EvidenceGalaxyGraph(BaseModel):
    nodes: List[GalaxyNode] = Field(default_factory=list)
    links: List[GalaxyLink] = Field(default_factory=list)
    available_years: List[int] = Field(default_factory=list)
    total_facts: int = 0
    corroboration_count: int = 0
    contradiction_count: int = 0
    unresolved_count: int = 0
