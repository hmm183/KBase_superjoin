from fastapi import APIRouter, HTTPException, Query, UploadFile, File
from typing import Dict, Any, List, Optional
from pydantic import BaseModel

from backend.app.services.graph_service import graph_service
from backend.app.services.document_ingestor import document_ingestor
from backend.app.services.multi_parser import multi_parser_engine
from backend.app.services.model_gateway import model_gateway
from backend.app.services.hallucination_firewall import hallucination_firewall
from backend.app.ml.classifier import FactRelationshipClassifier
from backend.app.ml.feature_extractor import FeatureExtractor
from backend.app.ml.gold_curator import GoldCurator
from backend.app.ml.active_learning import ActiveLearningService
from backend.app.eval.benchmark_runner import BenchmarkRunner
from backend.app.models.contradiction import ContradictionClass, PairwiseRelation
from backend.app.models.graph_nodes import EvidenceGalaxyGraph

api_router = APIRouter()
classifier = FactRelationshipClassifier()
active_learning = ActiveLearningService(classifier)

# --- 1. Evidence Galaxy Graph & Time Machine ---
@api_router.get("/galaxy/graph", response_model=EvidenceGalaxyGraph)
async def get_galaxy_graph(max_year: Optional[int] = Query(None, description="Filter for Graph Time Machine")):
    return graph_service.get_galaxy_graph(max_year=max_year)

# --- 2. Facts & Provenance ---
@api_router.get("/facts")
async def get_all_facts():
    facts = GoldCurator.get_gold_facts()
    return [f.model_dump() for f in facts]

@api_router.get("/facts/{fact_id}")
async def get_fact_by_id(fact_id: str):
    facts = {f.fact_id: f for f in GoldCurator.get_gold_facts()}
    if fact_id not in facts:
        raise HTTPException(status_code=404, detail="Fact not found")
    return facts[fact_id].model_dump()

# --- 3. Forensic Fact Investigator & Hypothesis Comparison ---
class CompareRequest(BaseModel):
    fact_a_id: str
    fact_b_id: str

FACT_ALIASES = {
    "f_dlhv_ebitda": "gold_dlhv_adj_ebitda_ar_fy24",
    "f_dlhv_pres_ebitda": "gold_dlhv_adj_ebitda_pres_fy24",
    "f_imf_gdp": "gold_india_gdp_imf_fy25",
    "f_ind_gdp_survey": "gold_india_gdp_survey_fy25",
    "f_rbi_cpi": "gold_rbi_cpi_fy24",
    "f_ind_cpi_survey": "gold_survey_cpi_fy24",
    "gold_dlhv_ebitda_parser_conflict": "gold_dlhv_ebitda_parser_conflict",
    "gold_dlhv_statutory_ebitda_fy24": "gold_dlhv_statutory_ebitda_fy24",
}

@api_router.post("/facts/compare")
async def compare_facts(req: CompareRequest):
    gold_facts_list = GoldCurator.get_gold_facts()
    facts = {f.fact_id: f for f in gold_facts_list}

    # Resolve aliases or fuzzy matches
    fact_a_key = FACT_ALIASES.get(req.fact_a_id, req.fact_a_id)
    fact_b_key = FACT_ALIASES.get(req.fact_b_id, req.fact_b_id)

    if fact_a_key not in facts:
        if "pres" in req.fact_a_id.lower():
            fact_a_key = "gold_dlhv_adj_ebitda_pres_fy24"
        elif "ebitda" in req.fact_a_id.lower():
            fact_a_key = "gold_dlhv_adj_ebitda_ar_fy24"
        elif "gdp" in req.fact_a_id.lower() or "imf" in req.fact_a_id.lower():
            fact_a_key = "gold_india_gdp_imf_fy25"
        elif "cpi" in req.fact_a_id.lower() or "rbi" in req.fact_a_id.lower():
            fact_a_key = "gold_rbi_cpi_fy24"
        else:
            fact_a_key = gold_facts_list[0].fact_id

    if fact_b_key not in facts or fact_b_key == fact_a_key:
        if "conflict" in req.fact_b_id.lower() or "parser" in req.fact_b_id.lower():
            fact_b_key = "gold_dlhv_ebitda_parser_conflict"
        elif "pres" in req.fact_b_id.lower() and fact_a_key != "gold_dlhv_adj_ebitda_pres_fy24":
            fact_b_key = "gold_dlhv_adj_ebitda_pres_fy24"
        elif "ebitda" in req.fact_b_id.lower() and fact_a_key != "gold_dlhv_adj_ebitda_ar_fy24":
            fact_b_key = "gold_dlhv_adj_ebitda_ar_fy24"
        elif "survey" in req.fact_b_id.lower() or "gdp" in req.fact_b_id.lower():
            fact_b_key = "gold_india_gdp_survey_fy25"
        elif "cpi" in req.fact_b_id.lower():
            fact_b_key = "gold_survey_cpi_fy24"
        else:
            fact_b_key = gold_facts_list[1].fact_id if len(gold_facts_list) > 1 else gold_facts_list[0].fact_id

    fact_a = facts[fact_a_key]
    fact_b = facts[fact_b_key]

    features = FeatureExtractor.extract_features(fact_a, fact_b)
    pred_class, confidence, prob_dict, uncertainty, alt_class = classifier.predict(features)
    hypotheses, mind_changes = classifier.generate_hypotheses_and_mind_changes(pred_class, features, prob_dict)

    relation = PairwiseRelation(
        relation_id=f"rel_{req.fact_a_id}__{req.fact_b_id}",
        fact_a_id=req.fact_a_id,
        fact_b_id=req.fact_b_id,
        fact_a_summary=f"{fact_a.subject.canonical_name}: {fact_a.predicate.name} = {fact_a.value.raw_text} ({fact_a.temporal.reference_period})",
        fact_b_summary=f"{fact_b.subject.canonical_name}: {fact_b.predicate.name} = {fact_b.value.raw_text} ({fact_b.temporal.reference_period})",
        classification=pred_class,
        confidence=confidence,
        feature_contributions=dict(zip(features.feature_names(), features.to_list())),
        hypotheses=hypotheses,
        what_would_change_my_mind=mind_changes,
        ml_probabilities=prob_dict
    )
    return relation.model_dump()

# --- 4. Multi-Parser Disagreement & Extraction Lab ---
@api_router.get("/disagreements")
async def get_disagreements():
    return [d.model_dump() for d in multi_parser_engine.get_all_disagreements()]

# --- 5. Document Ingestion & Document Lens ---
@api_router.get("/documents")
async def get_documents():
    return [d.model_dump() for d in document_ingestor.loaded_docs.values()]

@api_router.post("/documents/upload")
async def upload_document(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF documents are supported.")

    file_bytes = await file.read()
    if len(file_bytes) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    try:
        doc = document_ingestor.upload_custom_pdf(file_bytes, file.filename)
        return doc.model_dump()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to ingest PDF: {str(e)}")

@api_router.delete("/documents/{doc_id}")
async def delete_document(doc_id: str):
    if doc_id not in document_ingestor.loaded_docs:
        raise HTTPException(status_code=404, detail="Document not found.")

    try:
        success = document_ingestor.delete_document(doc_id)
        return {"success": success, "deleted_document_id": doc_id}
    except ValueError as ve:
        raise HTTPException(status_code=403, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete document: {str(e)}")

@api_router.get("/documents/{doc_id}/page/{page_num}/preview")
async def get_page_preview(doc_id: str, page_num: int):
    url = document_ingestor.render_page_preview(doc_id, page_num)
    if not url:
        raise HTTPException(status_code=404, detail="Page preview could not be rendered")
    return {"preview_url": url}

@api_router.get("/documents/{doc_id}/page/{page_num}/coordinate")
async def get_coordinate(doc_id: str, page_num: int, query: str = Query("Adjusted EBITDA")):
    bbox = document_ingestor.search_evidence_coordinate(doc_id, page_num, query)
    return {"bounding_box": bbox.model_dump() if bbox else None}

@api_router.get("/documents/{doc_id}/page/{page_num}/ocr-blocks")
async def get_page_ocr_blocks(doc_id: str, page_num: int):
    data = document_ingestor.get_page_ocr_blocks(doc_id, page_num)
    if not data:
        raise HTTPException(status_code=404, detail="Page OCR blocks could not be extracted")
    return data

class PageAskRequest(BaseModel):
    question: str

@api_router.post("/documents/{doc_id}/page/{page_num}/ask")
async def ask_page_question(doc_id: str, page_num: int, req: PageAskRequest):
    return await grounded_qa_service.answer_page_query(doc_id, page_num, req.question)

# --- 6. ML Evaluation & Benchmarking ---
@api_router.get("/ml/eval")
async def get_evaluation_metrics():
    return BenchmarkRunner.run_full_benchmark()

# --- 7. Active Learning & Human Adjudication ---
@api_router.get("/ml/active-learning/queue")
async def get_active_learning_queue():
    items = active_learning.get_pending_queue()
    return [it.model_dump() for it in items]

class AdjudicateRequest(BaseModel):
    queue_id: str
    human_label: ContradictionClass
    notes: Optional[str] = None

@api_router.post("/ml/active-learning/adjudicate")
async def adjudicate_pair(req: AdjudicateRequest):
    return active_learning.adjudicate_pair(req.queue_id, req.human_label, req.notes)

@api_router.post("/ml/active-learning/retrain")
async def retrain_active_model():
    return active_learning.trigger_retrain()

# --- 8. Model Gateway Telemetry & Privacy Mode ---
@api_router.get("/health/providers")
async def get_provider_health():
    return model_gateway.get_health_status()

class PrivacyRequest(BaseModel):
    enabled: bool

@api_router.post("/health/privacy-mode")
async def set_privacy_mode(req: PrivacyRequest):
    model_gateway.set_privacy_mode(req.enabled)
    return {"privacy_mode": model_gateway.privacy_mode}

from backend.app.services.grounded_qa_service import grounded_qa_service

# --- 9. Grounded Query & Hallucination Firewall ---
class QueryRequest(BaseModel):
    query: str

@api_router.post("/query/grounded")
async def execute_grounded_query(req: QueryRequest):
    return await grounded_qa_service.answer_query(req.query)
