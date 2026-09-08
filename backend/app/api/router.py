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
def _get_operational_facts_dict() -> Dict[str, Any]:
    """Reads active canonical facts strictly from the operational knowledge graph."""
    from backend.app.models.graph_nodes import NodeType
    from backend.app.models.fact import CanonicalFact
    facts: Dict[str, Any] = {}
    for node_id, node_data in graph_service.nx_graph.nodes(data=True):
        if node_data.get("node_type") == NodeType.FACT and "metadata" in node_data:
            try:
                facts[node_id] = CanonicalFact.model_validate(node_data["metadata"])
            except Exception:
                pass
    return facts

@api_router.get("/facts")
async def get_all_facts():
    facts_dict = _get_operational_facts_dict()
    return [f.model_dump() for f in facts_dict.values()]

@api_router.get("/facts/{fact_id}")
async def get_fact_by_id(fact_id: str):
    facts_dict = _get_operational_facts_dict()
    if fact_id not in facts_dict:
        raise HTTPException(status_code=404, detail=f"Fact '{fact_id}' not found in active knowledge graph")
    return facts_dict[fact_id].model_dump()

# --- 3. Forensic Fact Investigator & Hypothesis Comparison ---
class CompareRequest(BaseModel):
    fact_a_id: str
    fact_b_id: str

@api_router.post("/facts/compare")
async def compare_facts(req: CompareRequest):
    facts = _get_operational_facts_dict()

    if req.fact_a_id not in facts:
        raise HTTPException(
            status_code=404,
            detail=f"Fact A '{req.fact_a_id}' not found in active knowledge graph"
        )
    if req.fact_b_id not in facts:
        raise HTTPException(
            status_code=404,
            detail=f"Fact B '{req.fact_b_id}' not found in active knowledge graph"
        )

    fact_a = facts[req.fact_a_id]
    fact_b = facts[req.fact_b_id]

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
