from __future__ import annotations
from enum import Enum
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class RegionType(str, Enum):
    TABLE = "table"
    PARAGRAPH = "paragraph"
    FIGURE = "figure"
    HEADER = "header"
    FOOTNOTE = "footnote"
    KEY_VALUE = "key_value"

class BoundingBox(BaseModel):
    x1: float
    y1: float
    x2: float
    y2: float
    page_width: float = 612.0
    page_height: float = 792.0

class EvidenceSpan(BaseModel):
    evidence_id: str
    document_id: str
    page_number: int
    region_type: RegionType
    bounding_box: BoundingBox
    cell_coordinate: Optional[str] = None # e.g. "Row 3, Col 2" or "C4"
    text_content: str
    ocr_confidence: float = 0.98
    crop_image_url: Optional[str] = None
    surrounding_context: Optional[str] = None
    footnotes_referenced: List[str] = Field(default_factory=list)

class LayoutRegion(BaseModel):
    region_id: str
    page_number: int
    region_type: RegionType
    bounding_box: BoundingBox
    raw_text: str
    table_matrix: Optional[List[List[str]]] = None
    column_headers: Optional[List[str]] = None

class DisagreementType(str, Enum):
    NUMERIC_VALUE = "numeric_value"
    UNIT_INTERPRETATION = "unit_interpretation"
    CELL_BOUNDARY = "cell_boundary"
    ROW_COLUMN_SWAP = "row_column_swap"
    OCR_CHARACTER_TYPO = "ocr_character_typo"

class ParserDisagreement(BaseModel):
    conflict_id: str
    document_id: str
    page_number: int
    cell_or_region: str
    parser_a_name: str
    parser_a_value: str
    parser_a_bbox: Optional[List[float]] = None
    parser_b_name: str
    parser_b_value: str
    parser_b_bbox: Optional[List[float]] = None
    disagreement_type: DisagreementType
    adjudicated_value: Optional[str] = None
    adjudicated_by: Optional[str] = None # "vision_llm", "human", "heuristic"
    adjudication_confidence: float = 0.0
    adjudication_explanation: Optional[str] = None
    visual_crop_url: Optional[str] = None

class DocumentRecord(BaseModel):
    document_id: str
    filename: str
    title: str
    dataset_group: str # "delhivery" or "india-macroeconomy" or "custom"
    sha256_hash: str
    total_pages: int
    file_size_bytes: int
    cloudinary_pdf_url: Optional[str] = None
    page_thumbnail_urls: Dict[int, str] = Field(default_factory=dict)
    ingestion_status: str = "COMPLETED" # PENDING, PROCESSING, COMPLETED, FAILED
    extracted_facts_count: int = 0
    is_system_protected: bool = False
    created_at: Optional[str] = None
