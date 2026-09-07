# Evidence Galaxy — Backend Service (FastAPI + Python)

The backend for Evidence Galaxy is a high-performance, asynchronous Python service built with FastAPI, PyMuPDF, Scikit-learn, LightGBM, and NetworkX. It is responsible for document ingestion, coordinate-level layout geometry extraction, mathematical scale and unit harmonization, knowledge graph construction, pairwise fact-relationship classification, and resilient multi-provider LLM synthesis.

---

## 🏛️ System Architecture & Data Pipeline

```
                               ┌────────────────────────┐
                               │  Raw PDF Documents     │
                               │ (Annual Reports, etc.) │
                               └───────────┬────────────┘
                                           │
                                           ▼
                              ┌──────────────────────────┐
                              │  PyMuPDF (fitz) Ingestor │
                              │ • Vector block parsing   │
                              │ • Word-level coordinates │
                              │ • 150 DPI page rendering │
                              └────────────┬─────────────┘
                                           │
                   ┌───────────────────────┴───────────────────────┐
                   ▼                                               ▼
       ┌───────────────────────┐                       ┌───────────────────────┐
       │ Entity & Scale Normal │                       │ Feature Vectorizer    │
       │ • 1 Cr = 10 M = 10^7  │                       │ • Value ratios & logs │
       │ • Alias resolution    │                       │ • Temporal distance   │
       └───────────┬───────────┘                       └───────────┬───────────┘
                   │                                               │
                   └───────────────────────┬───────────────────────┘
                                           ▼
                              ┌──────────────────────────┐
                              │ In-Memory Knowledge Graph│
                              │ (NetworkX MultiDiGraph)  │
                              │ • Documents, Pages, Facts│
                              │ • Corroborates / Clashes │
                              └────────────┬─────────────┘
                                           │
                   ┌───────────────────────┴───────────────────────┐
                   ▼                                               ▼
       ┌───────────────────────┐                       ┌───────────────────────┐
       │ LightGBM Classifier   │                       │ Grounded QA Service   │
       │ • 12-class taxonomy   │                       │ • Groq/Gemini/Cerebras│
       │ • Uncertainty sampling│                       │ • Bounding box quotes │
       └───────────────────────┘                       └───────────┬───────────┘
                                                                   │
                                                                   ▼
                                                       ┌───────────────────────┐
                                                       │Hallucination Firewall │
                                                       │• Claim verification   │
                                                       │• Grounding index (GCI)│
                                                       └───────────────────────┘
```

---

## 🔬 Core Engineering Modules

### 1. Document Ingestor (`backend/app/services/document_ingestor.py`)
- **Native Vector Parsing**: Uses PyMuPDF (`fitz`) to extract text blocks and word-level bounding boxes `(x0, y0, x1, y1)` normalized to the document viewport dimensions.
- **Page Preview Rasterization**: Renders PDF pages to 150 DPI RGB PNG artifacts into `data/page_previews/` for instantaneous serving (< 2ms) to the frontend inspection canvas.
- **In-Memory Block Caching**: High-traffic pages (e.g. key tables in the Delhivery Annual Report and Economic Survey) are pre-warmed into an in-memory OCR cache (`_ocr_cache`) so repeated page inspections execute in sub-millisecond time.

### 2. Entity Resolution & Scale Harmonization (`backend/app/ml/entity_resolver.py` & `feature_extractor.py`)
- **Canonical Entity Matching**: Resolves varied entity surface forms (e.g. `"Delhivery Limited"`, `"Delhivery Pvt. Ltd."`, `"DLHV"`, `"The Company"`) into canonical IDs using token overlap and Levenshtein distance metrics.
- **Deterministic Scale Multiplier**: Reconciles Indian financial numbering conventions with Western conventions:
  - $\text{Crore} = 10,000,000$ ($10^7$)
  - $\text{Million} = 1,000,000$ ($10^6$)
  - $\text{Billion} = 1,000,000,000$ ($10^9$)
  - $\text{Lakh} = 100,000$ ($10^5$)
- **Ratio Parity Evaluation**: Evaluates whether two reported numbers represent identical underlying economic figures:
  $$\text{Scale Ratio} = \frac{\min(V_A \times M_A, V_B \times M_B)}{\max(V_A \times M_A, V_B \times M_B)}$$
  For ₹126.6 Cr vs ₹1,266 Mn:
  $$\frac{126.6 \times 10^7}{1266 \times 10^6} = \frac{1,266,000,000}{1,266,000,000} = 1.0000 \quad (0\%\text{ delta})$$

### 3. In-Memory Knowledge Graph Engine (`backend/app/services/graph_service.py`)
- Maintains an in-memory directed multi-graph using `networkx.MultiDiGraph`:
  - **Nodes**: `DocumentNode` (hash, sector, page count), `PageNode` (preview URI, dimensions), `EntityNode` (canonical ID, aliases), `FactNode` (claim, predicate, value, unit, period, coordinates).
  - **Edges**: `EXTRACTED_FROM`, `MENTIONS`, `CORROBORATES`, `CONTRADICTS`, `SUPERSEDES`, `DERIVED_FROM`.
- Supports multi-hop graph traversal to discover indirect relationships and contradictions across documents.
- Optional live synchronization to **Neo4j AuraDB** via `NEO4J_URI` for persistent cloud graph querying.

### 4. Fact Relationship Classifier & Active Learning (`backend/app/ml/classifier.py` & `active_learning.py`)
- **Multi-Modal Feature Vector**: Evaluates pairs of facts across 6 pairwise dimensions:
  1. `value_ratio`: $\min(V_A, V_B) / \max(V_A, V_B)$
  2. `log_diff`: $|\log_{10}(V_A + \epsilon) - \log_{10}(V_B + \epsilon)|$
  3. `unit_scale_match`: Boolean indicating whether normalized base units are equivalent.
  4. `temporal_distance_months`: Absolute delta between reporting period endpoints.
  5. `entity_overlap_jaccard`: Jaccard similarity between entity surface forms.
  6. `text_similarity`: Lexical and semantic similarity of surrounding text excerpts.
- **Model**: Trained LightGBM multi-class model (`lgb.LGBMClassifier`) outputting calibrated probabilities across the 12-class contradiction taxonomy (`CORROBORATES`, `GENUINE_CONTRADICTION`, `DEFINITION_MISMATCH`, `FORECAST_ACTUAL_MISMATCH`, etc.).
- **Active Learning**: Uses entropy sampling to identify uncertain fact comparisons on the decision boundary and surface them for human-in-the-loop review.

### 5. Multi-Provider LLM Gateway (`backend/app/services/model_gateway.py`)
- **Direct REST Architecture**: Executes direct asynchronous HTTP calls over `httpx` to **Groq**, **Google Gemini**, and **Cerebras** without heavy third-party vendor SDKs.
- **Round-Robin Multi-Key Pool**: Rotates through up to 5 API keys per provider to seamlessly absorb rate limits (`429`) and quota throttling.
- **Fallback Hierarchy**: Routes requests via: Cerebras (ultra-low latency ~18ms) $\rightarrow$ Groq (Llama-3.3-70b ~65ms) $\rightarrow$ Google Gemini (Gemini Flash ~140ms).
- **Privacy Mode**: When `PRIVACY_MODE=true`, all cloud LLM routing is disabled, and requests are directed to a local air-gapped Ollama instance (`http://localhost:11434/v1`).

### 6. Hallucination Firewall (`backend/app/services/hallucination_firewall.py`)
- Intercepts generated answers from the LLM gateway.
- Extracts asserted numerical figures and entity claims using regular expression pattern matching.
- Validates each claim against indexed knowledge graph nodes, assigning verification badges (`VERIFIED_BY_GRAPH`, `UNRESOLVED_CLAIM`) and calculating the Grounding Confidence Index (GCI).

---

## 📡 Complete REST API Specification

| Method | Path | Request Body / Params | Response | Description |
|---|---|---|---|---|
| `GET` | `/api/documents` | None | `List[DocumentRecord]` | Returns all indexed documents with page counts and metadata |
| `POST` | `/api/documents/upload` | `file: UploadFile` | `DocumentRecord` | Uploads and indexes a new PDF in the background |
| `DELETE` | `/api/documents/{doc_id}` | Path: `doc_id` | `{ "status": "deleted" }` | Deletes a custom uploaded PDF (rejects starter documents) |
| `GET` | `/api/documents/{doc_id}/pages/{page}/preview` | Path: `doc_id`, `page` | Image PNG stream | Returns 150 DPI rendered PNG preview of the specified page |
| `GET` | `/api/documents/{doc_id}/pages/{page}/ocr` | Path: `doc_id`, `page` | `Dict[str, Any]` | Returns word-level and table-level bounding box coordinates |
| `POST` | `/api/documents/{doc_id}/pages/{page}/query` | `{ "query": str }` | `{ "answer": str, "citations": list }` | Contextual Q&A targeted exclusively to the specified page |
| `GET` | `/api/facts` | Query: `doc_id`, `entity_id` | `List[CanonicalFact]` | Returns all indexed facts with optional entity/document filters |
| `POST` | `/api/facts/compare` | `{ "fact_a_id": str, "fact_b_id": str }` | `FactRelationResponse` | Evaluates two facts, returning classification and hypothesis tournament |
| `POST` | `/api/query/grounded` | `{ "query": str }` | `GroundedQueryResponse` | Full corpus RAG with structured citations and firewall metrics |
| `GET` | `/api/graph` | None | `{ "nodes": list, "edges": list }` | Returns complete knowledge graph in node-link format |
| `GET` | `/api/ml/uncertain_pairs` | None | `List[TrainingInstance]` | Returns fact pairs with highest prediction entropy for active learning |
| `POST` | `/api/ml/label` | `{ "instance_id": str, "label": str }` | `{ "status": "updated" }` | Submits human label for an uncertain pair and retrains classifier |
| `POST` | `/api/eval/run_benchmark` | None | `Dict[str, Any]` | Executes automated benchmark evaluation harness |
| `GET` | `/api/health` | None | `{ "status": "healthy" }` | Health check endpoint reporting provider latency and database status |

---

## 🧪 Testing & Benchmark Reproducibility

### 1. Offline Automated Benchmark Evaluation
The benchmark suite runs 100% offline without requiring external network access or LLM API keys:
```bash
python -m backend.app.eval.benchmark_runner
```
- **Held-Out Gold Test Set**: Evaluates against 8 hand-adjudicated ground-truth pairs ([`data/gold/gold_test_pairs.json`](file:///c:/Users/vrish/Desktop/superjoin/data/gold/gold_test_pairs.json)) extracted directly from the primary PDF filings. The LightGBM classifier is trained strictly on synthetic weak supervision (`include_gold = False`, 0% data leakage).
- **Reproducible Scores**:
  - Overall Pair Classification Accuracy: **62.5%**
  - Macro F1: **0.622** | Weighted F1: **0.633**
  - Entity Resolution F1: **0.800** | Fact Matching F1: **0.945**
  - Scale Normalization Accuracy: **98.5%**
  - Per-class: `TIME_MISMATCH`: 1.000, `SCOPE_MISMATCH`: 1.000, `CORROBORATES`: 0.667, `GENUINE_CONTRADICTION`: 0.667, `DEFINITION_MISMATCH`: 0.400, `FORECAST_ACTUAL_MISMATCH`: 0.000
- Saves timestamped evaluation reports to `data/eval_reports/benchmark_report_v1.1.json`.

### 2. Unit Testing with Pytest
```bash
pytest
```
Executes test fixtures validating coordinate search, unit scale math, and API endpoint schemas.

---

## ⚙️ Environment Variables Reference

| Variable Name | Required? | Default | Description |
|---|---|---|---|
| `GROQ_API_KEY_1` .. `_5` | Recommended | `""` | Pool of Groq API keys for fast Llama-3.3 inference |
| `GEMINI_API_KEY_1` .. `_5` | Recommended | `""` | Pool of Google Gemini API keys for multimodal synthesis |
| `CEREBRAS_API_KEY_1` .. `_5` | Optional | `""` | Pool of Cerebras keys for ultra-fast wafer-scale inference |
| `PRIVACY_MODE` | Optional | `false` | When true, disables cloud LLMs and routes to local Ollama |
| `LOCAL_MODEL_ENDPOINT` | Optional | `http://localhost:11434/v1` | Local Ollama endpoint for air-gapped execution |
| `NEO4J_URI` | Optional | `""` | Neo4j AuraDB instance URI |
| `NEO4J_USERNAME` | Optional | `""` | Neo4j database username |
| `NEO4J_PASSWORD` | Optional | `""` | Neo4j database password |
| `MONGO_URI` | Optional | `""` | MongoDB connection URI for persistent audit logging |
| `CLOUDINARY_CLOUD_NAME` | Optional | `""` | Cloudinary storage account for remote asset hosting |
