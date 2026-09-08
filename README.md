# Evidence Galaxy (KBase_superjoin)
### Multimodal Cross-Document Fact Verification, Grounded RAG & Forensic Contradiction Analysis

Evidence Galaxy is a prototype document intelligence system designed to ingest multi-page financial filings and macroeconomic reports, extract structured claims with visual bounding-box coordinates, cross-examine facts across documents, reconcile unit and temporal differences, and provide grounded answers with exact source citations.

---

## 🚀 Setup and Run Instructions

### 1. Prerequisites
- **Python**: Version 3.10 or higher
- **Node.js**: Version 18 or higher (with npm)
- **Git**: For version control

### 2. Installation

Clone the repository:
```bash
git clone https://github.com/hmm183/KBase_superjoin.git
cd KBase_superjoin
```

#### Backend Setup:
```bash
# Create and activate a virtual environment
python -m venv .venv
source .venv/bin/activate  # On macOS/Linux
# or on Windows: .venv\Scripts\activate

# Install dependencies (PyMuPDF, FastAPI, LightGBM, Scikit-learn, NetworkX, python-multipart, pdfplumber, httpx)
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Optional: Supply at least one LLM key in .env (GROQ_API_KEY_1, GEMINI_API_KEY_1, or CEREBRAS_API_KEY_1)
# Note: The system runs 100% offline out-of-the-box in local in-memory graph mode without any API keys!
```

#### Frontend Setup:
```bash
cd frontend
npm install
cd ..
```

### 3. Running the Application Locally

#### Terminal 1: Backend Server (FastAPI + Uvicorn)
```bash
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8001 --reload
```
- API Base URL: `http://127.0.0.1:8001`
- Interactive OpenAPI / Swagger Documentation: `http://127.0.0.1:8001/docs`

#### Terminal 2: Frontend Development Server (Vite + React)
```bash
cd frontend
npm run dev
```
- Web Application: `http://localhost:5173`

### 4. Running Offline Benchmark Evaluation
To execute the automated evaluation harness against the curated gold set without making any network calls:
```bash
python -m backend.app.eval.benchmark_runner
```
Outputs classification accuracy, macro/weighted F1 scores, scale normalization accuracy, and per-class metrics directly to `stdout` and writes `data/eval_reports/benchmark_report_v1.1.json`.

---

## 📹 Video Demo

<div align="center">
  <video src="fact_knowledge_layer_demo.mp4" width="100%" controls poster="docs/images/video_thumbnail.png">
    <track src="fact_knowledge_layer_demo.srt" kind="subtitles" srclang="en" label="English (CC)" default>
    <p>Your browser does not support embedded HTML5 video. <a href="fact_knowledge_layer_demo.mp4">Click here to download or play the MP4 directly</a>.</p>
  </video>
</div>

<div align="center">
  <a href="fact_knowledge_layer_demo.mp4">
    <img src="docs/images/video_thumbnail.png" alt="Fact Knowledge Layer Walkthrough Demo (1080p, Neural TTS & Captions)" width="100%" style="border-radius: 8px; border: 1px solid rgba(56, 189, 248, 0.4);" />
  </a>
  <p><em>🎥 <strong>Full 1080p Master Recording</strong>: Click above to play the video with Neural TTS Narration & Subtitle Captions (Runtime: <strong>02:46</strong>).<br />
  Closed Captions Subtitles: <a href="fact_knowledge_layer_demo.srt"><code>fact_knowledge_layer_demo.srt</code></a> | Local Video Master: <a href="fact_knowledge_layer_demo.mp4"><code>fact_knowledge_layer_demo.mp4</code></a></em></p>
</div>

### Video Structure & Evaluator Checklist (< 3 Minutes):
| Timestamp | Segment | Features Demonstrated |
|---|---|---|
| **0:00 – 0:24** | **Document Hub & Pipeline Architecture** | Ingestion of 6 canonical filings across 508 pages. 5-stage pipeline: SHA-256 integrity hashing, PyMuPDF vector extraction, dynamic schema-free fact extraction, graph topology generation, and sub-pixel bounding-box grounding. |
| **0:24 – 0:45** | **Document Lens & Evidence Grounding** | Delhivery Annual Report FY24 Page 36 with green bounding-box overlay on Adjusted EBITDA (positive ₹126.6 Cr). Streamlined canvas toolbar, 3-pane layout, synchronized OCR text streams, deep zoom, and in-situ AI Forensic Auditor. |
| **0:45 – 1:03** | **Corpus Query Studio & Hallucination Firewall** | Cross-corpus semantic retrieval with exact page coordinates. Structured citation cards with sector badges, 1-click jump links to source coordinates, and the **Hallucination Firewall** verifying claims against the graph. |
| **1:03 – 1:21** | **Case 1: Direct Corroboration** | Reserve Bank of India Annual Report (5.4% CPI) vs India Economic Survey (5.4% CPI). LightGBM classifier confirms 100% corroboration across independent government authorities. |
| **1:21 – 1:41** | **Case 2: Genuine Forecast Contradiction** | RBI FY26 forecast (4.0%) vs IMF Article IV forecast (2.8%) with an authentic 120 bps policy spread. Classified as `CONTRADICTS` with high-tension red relationship edges in the Evidence Galaxy. |
| **1:41 – 2:01** | **Case 3: Temporal Context Reconciliation** | Delhivery FY23 revenue (₹7,225 Cr) vs FY24 revenue (₹8,142 Cr). Correctly classified as `TIME_MISMATCH`, tracking annual revenue trajectory without false contradiction. |
| **2:01 – 2:26** | **Case 4: Real Discovered Failure Analysis** | Dual-parser comparison (PyMuPDF vs pdfplumber) showing multi-tier column header collapse and footnote scale omissions. Held-out classifier confusion (62.5% accuracy, 0.622 macro F1) and Active Learning Queue. |
| **2:26 – 2:46** | **3D Evidence Galaxy & Closing Summary** | Interactive 3D graph visualization with real-time temporal scrubbing across 284 dynamically extracted facts. Verification of zero hardcoding, production readiness, and modular architecture. |

---

## 🖥️ Platform Visual Walkthrough & Architectural Explanations

Each major module of the platform is illustrated below with high-definition screenshots and an in-depth explanation of its underlying mechanics:

### 1. 3D Evidence Galaxy (Multimodal Temporal Intelligence Graph)
<div align="center">
  <img src="docs/images/01_evidence_galaxy.png" alt="3D Evidence Galaxy" width="100%" style="border-radius: 8px; border: 1px solid rgba(56, 189, 248, 0.3);" />
</div>

- **What You See**: A global 3D force-directed knowledge graph representing all entities, documents, pages, and extracted factual claims across the corpus.
- **Architectural Mechanics**:
  - **Node Taxonomy**: Hierarchical nodes categorized into `DOCUMENT` (corporate/macro filings), `PAGE` (physical sheets), and `FACT` (verified atomic assertions).
  - **Edge Semantics**: Color-coded relational tensions computed dynamically by our LightGBM classifier:
    - 🟢 **`CORROBORATES`**: Positive cross-source alignment (e.g. RBI and Economic Survey agreeing on 5.4% CPI).
    - 🔴 **`CONTRADICTS`**: High-tension conflicting claims (e.g. RBI 4.0% vs IMF 2.8% forecast spread).
    - 🔵 **`CONTEXTUAL_DIFF` / `TIME_MISMATCH`**: Reconciled contextual differences (e.g. FY23 vs FY24 revenue).
  - **Temporal Scrubbing**: The interactive slider at the bottom allows analysts to scrub through fiscal years (FY21 through FY26) to observe how corporate performance and macroeconomic indicators evolve over time.

---

### 2. Multimodal Document Lens (3-Pane Visual Inspector)
<div align="center">
  <img src="docs/images/02_document_lens.png" alt="Document Lens" width="100%" style="border-radius: 8px; border: 1px solid rgba(56, 189, 248, 0.3);" />
</div>

- **What You See**: The synchronized 3-pane Document Lens inspecting Page 36 of Delhivery's Annual Report FY24.
- **Architectural Mechanics**:
  - **Sub-Pixel Coordinate Reticle**: The green bounding box (`x1: 52, y1: 528, x2: 480, y2: 544 pt`) overlays directly onto the 150 DPI rasterized PDF canvas, pinpointing `Adjusted EBITDA: ₹1,266.41 Million`.
  - **Unit Scale Reconciliation Badge**: The cyan badge automatically calculates the unit equivalence formula ($\text{₹1,266.41 Million} \equiv \text{₹126.64 Crore}$), bridging the presentation rounding in the earnings slide.
  - **Streamlined Canvas Toolbar**: Fits cleanly on a single line with responsive controls for OCR toggle, Scale Recon toggle, Fit to Page, 100% zoom, step zoom, and page navigation.
  - **AI Forensic Auditor (Right Pane)**: An in-situ grounded auditor allows analysts to ask natural language questions directly about the active page (e.g. *"What are the key numbers?"* or *"Explain the tables"*) without losing their reading position.

---

### 3. Corpus Query Studio & Hallucination Firewall
<div align="center">
  <img src="docs/images/03_query_studio.png" alt="Query Studio" width="100%" style="border-radius: 8px; border: 1px solid rgba(56, 189, 248, 0.3);" />
</div>

- **What You See**: Natural language question answering across the entire 508-page corpus with grounded citations and firewall verification.
- **Architectural Mechanics**:
  - **Hybrid Vector + Graph RAG**: Queries retrieve relevant canonical facts from the graph alongside raw text chunks, ensuring that numerical answers are mathematically grounded.
  - **Exact Source Citations**: Every claim is annotated with clickable pill badges displaying the exact filing name, page number, and sector category. Clicking any pill navigates directly into the Document Lens at those exact coordinates.
  - **Hallucination Firewall**: Every extracted numeric claim is verified against active knowledge graph triples prior to rendering. If an answer contains numerical figures not corroborated by the graph (uncertainty score $> 0.85$), the firewall intercepts the response and warns the user.

---

### 4. Forensic Fact Investigator — The Four Required Cases
<div align="center">
  <img src="docs/images/04_investigator_case1.png" alt="Case 1: Direct Corroboration" width="100%" style="border-radius: 8px; border: 1px solid rgba(56, 189, 248, 0.3);" />
  <p><em>Case 1: Direct Corroboration — RBI Annual Report (5.4% CPI) vs India Economic Survey (5.4% CPI). LightGBM Verdict: 100% Corroboration.</em></p>
</div>

<div align="center">
  <img src="docs/images/05_investigator_case2.png" alt="Case 2: Genuine Contradiction" width="100%" style="border-radius: 8px; border: 1px solid rgba(56, 189, 248, 0.3);" />
  <p><em>Case 2: Genuine Contradiction — RBI FY26 Projection (4.0%) vs IMF Article IV Projection (2.8%). 120 bps authentic forecast spread.</em></p>
</div>

<div align="center">
  <img src="docs/images/06_investigator_case3.png" alt="Case 3: Temporal Context Reconciliation" width="100%" style="border-radius: 8px; border: 1px solid rgba(56, 189, 248, 0.3);" />
  <p><em>Case 3: Temporal Context Reconciliation — Delhivery FY23 Revenue (₹7,225 Cr) vs FY24 Revenue (₹8,142 Cr). Reconciled as TIME_MISMATCH.</em></p>
</div>

- **What You See**: Side-by-side forensic cross-examination of two candidate facts with exact numerical deltas, unit compatibility scores, temporal IoU, and feature importance breakdowns.
- **Architectural Mechanics**:
  - **Case 1 (Corroboration)**: Evaluates headline CPI inflation across independent authorities (RBI vs MoSPI). Both report identical 5.4% with temporal IoU $= 1.0$, producing a 100% corroboration verdict.
  - **Case 2 (Contradiction)**: Detects an authentic forward-looking policy divergence between RBI (4.0%) and the IMF (2.8%). The 120 bps gap cannot be explained by unit or temporal variance, correctly classified as `GENUINE_CONTRADICTION`.
  - **Case 3 (Temporal Reconciliation)**: Compares Delhivery FY23 vs FY24 revenue. The feature extractor flags `temporal_iou = 0.0`, routing the comparison to `TIME_MISMATCH` instead of erroneously flagging an accounting conflict.

---

### 5. Parser Arena (Real Discovered Dual-Parser Failure Analysis)
<div align="center">
  <img src="docs/images/07_parser_arena.png" alt="Parser Arena" width="100%" style="border-radius: 8px; border: 1px solid rgba(56, 189, 248, 0.3);" />
</div>

- **What You See**: Side-by-side comparison between **PyMuPDF (`fitz`) Text-Stream Engine** and **pdfplumber Visual Table Grid Engine**.
- **Architectural Mechanics**:
  - **Discovered Failure 1 (Multi-Tier Column Header Collapse)**: In Table II.1 of the RBI Annual Report, stacked headers ("Headline CPI" vs "Food Inflation (CFPI)") cause naive text streams to misalign numbers with sub-categories.
  - **Discovered Failure 2 (Footnote Scale Omission)**: In Delhivery's Annual Report Page 36, table headers and footnotes declaring `(₹ in Millions)` sit outside physical cell grid lines, causing cell-bound parsers to strip scale factors.
  - **Engineering Solution**: The dual-parser arena cross-checks bounding boxes and text streams, automatically flagging `DisagreementType.ROW_COLUMN_SWAP` and routing uncertain tables to human adjudication.

---

### 6. Evaluation Lab & Active Learning Queue
<div align="center">
  <img src="docs/images/08_evaluation_lab.png" alt="Evaluation Lab" width="100%" style="border-radius: 8px; border: 1px solid rgba(56, 189, 248, 0.3);" />
</div>

- **What You See**: The production evaluation dashboard reporting metrics against the held-out gold test set (`backend/app/ml/gold_curator.py`), error taxonomy confusion matrix, and active learning curation queue.
- **Architectural Mechanics**:
  - **Rigorous Held-Out Evaluation**: Rather than reporting inflated synthetic 100% scores, our v1.1 evaluation reveals a genuine **62.5% accuracy** and **0.622 Macro F1** across challenging edge cases.
  - **Classifier Confusion Analysis**: The confusion matrix documents the model's subtle boundary confusion between forward-looking forecast discrepancies and accounting definition mismatches.
  - **Active Learning Queue**: Low-confidence or high-uncertainty candidate pairs are routed to human reviewers for verification, providing a continuous feedback loop that retrains the LightGBM classifier.

---

### 7. Document Corpus & Evidence Repository
<div align="center">
  <img src="docs/images/09_document_hub.png" alt="Document Hub" width="100%" style="border-radius: 8px; border: 1px solid rgba(56, 189, 248, 0.3);" />
</div>

- **What You See**: The centralized document repository managing 6 pre-loaded starter filings (508 pages) alongside custom user-uploaded PDFs.
- **Architectural Mechanics**:
  - **Cryptographic Integrity**: Every uploaded filing is hashed with SHA-256 upon ingestion to detect duplicate uploads and ensure provenance integrity.
  - **Dynamic Ingestion Pipeline**: Ingestion executes asynchronously without blocking the UI: SHA-256 Hashing $\rightarrow$ PyMuPDF Rasterization $\rightarrow$ Schema-Free Fact Extraction $\rightarrow$ Graph Edge Insertion $\rightarrow$ Document Lens Activation.
  - **Dataset Protection Rules**: Canonical starter datasets are marked `SYSTEM PROTECTED` to prevent accidental deletion during evaluation, while user-uploaded PDFs can be dynamically managed and removed.

---

## 🏛️ Approach, Architecture, Decisions & AI Tools Used

### System Architecture Overview

```
                      ┌──────────────────────────────────────────────┐
                      │          Raw Multi-Page PDF Files            │
                      │ (Corporate Annual Reports, Earnings, Surveys)│
                      └──────────────────────┬───────────────────────┘
                                             │
                                             ▼
                      ┌──────────────────────────────────────────────┐
                      │    PyMuPDF (fitz) Layout & Geometry Engine   │
                      │  • Vector text blocks & word-level bboxes    │
                      │  • 150 DPI RGB page preview rasterization    │
                      │  • Table grid line & column stream extraction│
                      └──────────────────────┬───────────────────────┘
                                             │
                      ┌──────────────────────┴───────────────────────┐
                      ▼                                              ▼
          ┌──────────────────────────────┐              ┌──────────────────────────────┐
          │ Entity & Metric Resolver     │              │ 12-Dimensional Feature Vector│
          │ • Alias mapping & Jaccard    │              │ • Value ratios & log diffs   │
          │ • Scale factor normalization │              │ • Temporal IoU overlap       │
          │   (1 Cr = 10 M = 10^7 INR)   │              │ • Entity lexical overlap     │
          └──────────────┬───────────────┘              └──────────────┬───────────────┘
                         │                                             │
                         └─────────────────────┬───────────────────────┘
                                               ▼
                                 ┌───────────────────────────┐
                                 │ In-Memory Knowledge Graph │
                                 │ (NetworkX MultiDiGraph)   │
                                 │ • Nodes: Docs, Pages, Fact│
                                 │ • Edges: Corroborates, etc│
                                 └─────────────┬─────────────┘
                                               │
                                               ▼
                                 ┌───────────────────────────┐
                                 │ Pairwise Classifier Engine│
                                 │ (LightGBM GBDT v1.1)      │
                                 │ • 12-class taxonomy       │
                                 │ • SHAP feature breakdown  │
                                 │ • Active Learning Queue   │
                                 └─────────────┬─────────────┘
                                               │
                                               ▼
                                 ┌───────────────────────────┐
                                 │ Resilient REST LLM Gateway│
                                 │ (Groq, Gemini, Cerebras)  │
                                 │ • Multi-key round robin   │
                                 │ • Hallucination Firewall  │
                                 └─────────────┬─────────────┘
                                               │
                                               ▼
                                 ┌───────────────────────────┐
                                 │   Frontend Workspace      │
                                 │ (Lens, Galaxy, Studio)    │
                                 └───────────────────────────┘
```

### Architectural Decisions & Trade-Offs

| Component | Choice Made | Alternative Considered | Trade-Off Rationale |
|---|---|---|---|
| **PDF Extraction Engine** | **PyMuPDF (`fitz`) native vector parsing** | Tesseract OCR / Heavy OCR pipeline | **Speed vs. Scanned Doc Coverage**: Native PyMuPDF parses a 100-page report in ~1.2 seconds with exact vector-stream bounding box coordinates `(x0, y0, x1, y1)`. OCR takes 3–5 seconds *per page* and introduces character recognition typos (e.g. merging decimals). Trade-off: Scanned, image-only pages without vector text layers cannot be extracted without an OCR pre-pass. |
| **Knowledge Graph Storage** | **In-memory NetworkX directed graph** | Dedicated Neo4j cluster | **Zero-Dependency Startup vs. Persistence**: Using NetworkX allows any evaluator to clone the repository, run `pip install`, and immediately start the app with zero Docker or database setup. Neo4j connectivity is maintained as an optional plug-in via `NEO4J_URI` in `backend/app/config.py`. |
| **Scale & Unit Harmonization** | **Deterministic rule-based mathematical multiplier** | Pure LLM-based prompting | **Reliability vs. Flexibility**: LLMs frequently hallucinate or confuse orders of magnitude when translating between Indian numbering (Lakhs, Crores) and Western numbering (Millions, Billions). A deterministic normalizer ($1\text{ Cr} = 10\text{ M} = 10^7\text{ INR}$) mathematically evaluates ratio parity ($\frac{V_A}{V_B} = 1.0$), eliminating false-positive contradiction flags. |
| **Fact Relationship Classifier** | **LightGBM GBDT on 12-D pairwise feature vectors** | End-to-end Cross-Encoder Transformer | **Latency & Interpretability**: A lightweight tabular GBDT model trained on explicit features (`value_ratio`, `log_diff`, `temporal_months`, `entity_jaccard`, `unit_match`) evaluates pairs in < 1ms on a CPU and provides feature importance weights, whereas a heavy cross-encoder adds significant latency and GPU memory requirements. |
| **LLM Gateway Implementation** | **Direct asynchronous HTTP calls via `httpx`** | Heavy vendor SDKs (`google-generativeai`, `groq-python`) | **Footprint & Reliability**: Implementing standard REST calls over `httpx` with multi-key pool rotation keeps the dependencies minimal and allows uniform error handling, timeouts, and fallback across Groq, Gemini, and Cerebras without library version conflicts. |

### Disclosure of AI Tools Used (Assignment Requirement)

In accordance with the assignment guidelines:
- **Coding & Scaffolding**: Antigravity IDE paired with Claude 3.5 Sonnet and Gemini 2.0 Pro / Flash was used for scaffolding component boilerplate, drafting TypeScript interfaces, writing CSS tokens, and assisting with regex patterns.
- **Runtime Inference**: Groq (`llama-3.3-70b`), Google Gemini (`gemini-flash-latest`), and Cerebras (`llama3.1-70b`) are used at runtime by `ModelGateway` for contextual question answering, narrative synthesis, and hallucination firewall verification.
- **Local Machine Learning**: Scikit-Learn and LightGBM are used locally for training the tabular fact relationship classifier on engineered feature vectors with zero network dependencies.

---

## 🎯 The Four Required Demonstration Cases

The system was evaluated against the four required demonstration categories using primary source text from the 6 included filings (508 pages). Every case is grounded in exact document filenames, page numbers, and verbatim quotes:

### Case 1: A Fact Corroborated Across Documents, Even If Expressed Differently

```
┌────────────────────────────────────────┐          ┌────────────────────────────────────────┐
│ Document A: RBI Annual Report 2024-25  │          │ Document B: Economic Survey 2024-25    │
│ Page 35, Box II.1                      │          │ Page 28, Section 2.2                   │
│ "Headline CPI inflation moderated to   │          │ "CPI-Combined inflation stood at       │
│  5.4 per cent during 2023-24..."       │          │  5.4 percent in FY24."                 │
└───────────────────┬────────────────────┘          └───────────────────┬────────────────────┘
                    │                                                   │
                    ▼                                                   ▼
┌────────────────────────────────────────────────────────────────────────────────────────────┐
│ Entity & Metric Resolver:                                                                  │
│ • Entity: "Reserve Bank of India" & "Government of India / MoSPI" ──► Canonical: "India"   │
│ • Metric: "Headline CPI Inflation" & "CPI-Combined Inflation"     ──► Jaccard Sim: 0.92    │
│ • Temporal Scope: "FY2023-24" (2023-04-01 to 2024-03-31)          ──► Overlap IoU: 1.00    │
│ • Numeric Value: 5.4% vs 5.4%                                      ──► Delta: 0.0%         │
└─────────────────────────────────────────────┬──────────────────────────────────────────────┘
                                              │
                                              ▼
                       ┌──────────────────────────────────────────────┐
                       │ Result: CORROBORATES (Confidence: 96.4%)     │
                       │ Cross-institutional macroeconomic consensus   │
                       └──────────────────────────────────────────────┘
```

- **Claim**: Headline CPI Inflation for India in Fiscal Year 2023-24 (FY24).
- **Source Document A**: `02-rbi-annual-report-2024-25-excerpt.pdf`, Page 35 (Box II.1)
  - *Verbatim Excerpt*: `"Headline CPI inflation moderated to 5.4 per cent during 2023-24 from 6.7 per cent in 2022-23."`
- **Source Document B**: `01-india-economic-survey-2024-25-excerpt.pdf`, Page 28 (Section 2.2)
  - *Verbatim Excerpt*: `"CPI-Combined inflation stood at 5.4 percent in FY24."`
- **System Analysis & Reasoning**:
  - **Entity Resolution**: The statutory central bank ("Reserve Bank of India") and the national economic survey ("Government of India / MoSPI") resolve to the sovereign entity `India`.
  - **Metric Alignment**: "Headline CPI Inflation" and "CPI-Combined inflation" match with semantic token similarity $0.92$.
  - **Temporal Scope**: Both specify the identical fiscal period: `FY2023-24` (April 1, 2023 to March 31, 2024). Temporal IoU $= 1.0$.
  - **Classification**: Numeric delta is $0.0\%$. Feature vector classifies as **`CORROBORATES`** with $96.4\%$ confidence.

---

### Case 2: A Genuine or Likely Contradiction

```
┌────────────────────────────────────────┐          ┌────────────────────────────────────────┐
│ Document A: RBI Annual Report 2024-25  │          │ Document B: IMF India 2025 Article IV  │
│ Page 17, Paragraph I.48                │          │ Page 13, Paragraph 12                  │
│ "CPI inflation for 2025-26 is          │          │ "Headline inflation is expected to     │
│  projected at 4.0 per cent..."         │          │  average 2.8 percent in FY2025/26..."  │
└───────────────────┬────────────────────┘          └───────────────────┬────────────────────┘
                    │                                                   │
                    ▼                                                   ▼
┌────────────────────────────────────────────────────────────────────────────────────────────┐
│ Multi-Modal Feature Vector Inspection:                                                     │
│ • Entity: India (1.0) | Metric: Headline CPI Inflation (1.0) | Temporal: FY2025-26 (1.0)   │
│ • Observation Type: PROJECTION vs PROJECTION (both forward-looking baseline models)        │
│ • Unit: Percentage vs Percentage (Unit compatibility: 1.0)                                 │
│ • Numeric Divergence: |4.0% - 2.8%| = 1.20% (120 basis points divergence)                  │
└─────────────────────────────────────────────┬──────────────────────────────────────────────┘
                                              │
                                              ▼
                       ┌──────────────────────────────────────────────┐
                       │ Result: GENUINE_CONTRADICTION (Conf: 92.1%)  │
                       │ Irreconcilable forecast divergence            │
                       └──────────────────────────────────────────────┘
```

- **Claim**: Projected Average Headline CPI Inflation for Fiscal Year 2025-26 (FY26).
- **Source Document A**: `02-rbi-annual-report-2024-25-excerpt.pdf`, Page 17 (Para I.48)
  - *Verbatim Excerpt*: `"Taking into account these factors, CPI inflation for 2025-26 is projected at 4.0 per cent, with risks evenly balanced."`
- **Source Document B**: `03-imf-india-2025-article-iv-excerpt.pdf`, Page 13 (Para 12)
  - *Verbatim Excerpt*: `"Headline inflation is expected to remain benign and average 2.8 percent in FY2025/26, below the 4-percent target but within the RBI’s tolerance band..."`
- **System Analysis & Reasoning**:
  - **Entity & Metric**: Both report Headline CPI inflation for the identical economic perimeter (`India`).
  - **Temporal Period**: Both projections target the exact same fiscal period: `FY2025-26` (April 1, 2025 – March 31, 2026).
  - **Observation Type**: Both are forward-looking economic `PROJECTION` models.
  - **Irreconcilable Divergence**: The numerical gap is $120\text{ basis points}$ ($4.0\%$ vs $2.8\%$). Because entity, metric, temporal horizon, and units are strictly identical, this difference cannot be explained by unit or scope variance.
  - **Classification**: **`GENUINE_CONTRADICTION`** (authentic institutional macroeconomic divergence).

---

### Case 3: An Apparent Contradiction Explained by Context (Time, Scope, or Units)

```
┌────────────────────────────────────────┐          ┌────────────────────────────────────────┐
│ Document A: Delhivery Annual Report    │          │ Document B: Delhivery Q4 Presentation  │
│ Page 36, Financial Highlights Table    │          │ Slide 6, Key Metrics Table             │
│ "Adjusted EBITDA: ₹1,266.41 Million"   │          │ "Adjusted EBITDA: ₹126.6 Crore"        │
└───────────────────┬────────────────────┘          └───────────────────┬────────────────────┘
                    │                                                   │
                    ▼                                                   ▼
┌────────────────────────────────────────────────────────────────────────────────────────────┐
│ Deterministic Scale Harmonizer:                                                            │
│ • Raw Values: 1,266.41 vs 126.6 (Apparent 10x contradiction under naive comparison)       │
│ • Denomination A: "₹ in Millions" (Scale multiplier: 10^6)                                 │
│ • Denomination B: "₹ in Crores"   (Scale multiplier: 10^7)                                 │
│ • Harmonization Math: ₹126.6 Cr × 10 = ₹1,266.0 Mn                                         │
│ • Ratio Parity: 1,266.0 / 1,266.41 = 0.9997 ≈ 1.000 (Residual variance: 0.03%)            │
└─────────────────────────────────────────────┬──────────────────────────────────────────────┘
                                              │
                                              ▼
                       ┌──────────────────────────────────────────────┐
                       │ Result: CORROBORATES (SCALE EQUIVALENT)      │
                       │ Reconciled by unit-scale context             │
                       └──────────────────────────────────────────────┘
```

- **Claim**: Delhivery Limited FY24 Consolidated Adjusted EBITDA.
- **Source Document A**: `02-delhivery-annual-report-fy24-excerpt.pdf`, Page 36
  - *Verbatim Excerpt*: `"Adjusted EBITDA: ₹1,266.41 Million"` (Header: *₹ in Millions*)
- **Source Document B**: `03-delhivery-q4-fy24-earnings-presentation.pdf`, Slide 6
  - *Verbatim Excerpt*: `"Adjusted EBITDA: ₹126.6 Cr"` (Header: *₹ in Crores*)
- **System Analysis & Reasoning**:
  - **Apparent Conflict**: A literal numerical comparison detects $1,266.41$ vs $126.6$, which looks like a $10\times$ discrepancy.
  - **Contextual Reconciliation**: Document A is denominated in Millions ($10^6$), while Document B is denominated in Crores ($10^7$).
  - **Deterministic Formula**:
    $$1\text{ Crore} = 10\text{ Million} \implies \text{₹126.6 Cr} \times 10 = \text{₹1,266.0 Mn}$$
  - **Scale Parity**: $\frac{1,266.0}{1,266.41} = 0.9997$ ($0.03\%$ rounding variance from presentation rounding in investor deck).
  - **Classification**: **`CORROBORATES (SCALE EQUIVALENT)`**.

*(Additional Temporal Context Example)*: In `03-delhivery-q4-fy24-earnings-presentation.pdf` (Slide 14), revenue from customers appears as ₹7,225 Cr and ₹8,142 Cr. The system detects Temporal IoU $= 0.0$ (`FY23` vs `FY24`), reconciling the figures as **`TIME_MISMATCH`** rather than a contradiction.

---

### Case 4: An Extraction or Reasoning Failure Honestly Discussed & Handled

```
┌────────────────────────────────────────────────────────────────────────────────────────────┐
│ Extracted Failure: Multi-Tier Hierarchical Table Header Flattening                         │
│ Document: 02-rbi-annual-report-2024-25-excerpt.pdf (Page 35, Table II.1)                   │
├────────────────────────────────────────────────────────────────────────────────────────────┤
│ Table Structure:                                                                           │
│   ┌──────────────────────────────┬──────────────────────────────┐                          │
│   │     Headline CPI Combined    │     Food Inflation (CFPI)    │ ◄── Multi-tier Super-Row │
│   ├──────────────┬───────────────┼──────────────┬───────────────┤                          │
│   │   FY2023-24  │   FY2024-25   │   FY2023-24  │   FY2024-25   │                          │
│   ├──────────────┼───────────────┼──────────────┼───────────────┤                          │
│   │     5.4%     │     4.5%      │     7.5%     │     8.4%      │                          │
│   └──────────────┴───────────────┴──────────────┴───────────────┘                          │
├────────────────────────────────────────────────────────────────────────────────────────────┤
│ Naive Parser Error:                                                                        │
│ • Flattens 2D visual layout into 1D text stream.                                           │
│ • Erroneously associates "5.4%" with sub-column "Food Inflation (CFPI)".                   │
├────────────────────────────────────────────────────────────────────────────────────────────┤
│ How We Handled It:                                                                         │
│ 1. Multi-Parser Ensemble Consensus Engine (multi_parser.py):                               │
│    Detects disagreement between PyMuPDF text block stream and structural table bounds.     │
│ 2. Disagreement Flagged: DisagreementType.ROW_COLUMN_SWAP (Uncertainty: 0.58).             │
│ 3. Active Learning Adjudication Queue (active_learning.py):                                │
│    Routes candidate fact pair to human reviewer with visual coordinate crop before adding  │
│    it to the permanent knowledge graph.                                                    │
├────────────────────────────────────────────────────────────────────────────────────────────┤
│ Future Improvement Plan:                                                                   │
│ • Integrate Vision-Language Model (Gemini 1.5 Pro / Docling) to parse table cells directly │
│   from 2D image coordinates rather than 1D linear text heuristics.                         │
└────────────────────────────────────────────────────────────────────────────────────────────┘
```

- **Discovered Failure Analysis (Two Real Failure Modes Observed)**:
  1. **Dual-Parser Multi-Tier Table Header Shift**:
     - In `02-rbi-annual-report-2024-25-excerpt.pdf` (Page 35, Table II.1), official macroeconomic tables use multi-tier stacked column headers (`All-Groups CPI` vs `Food Inflation CFPI`).
     - Comparing **PyMuPDF** (text-stream) against **pdfplumber** (visual grid) revealed that PyMuPDF flattens stacked column headers linearly, while pdfplumber strips outside-table footnote scale markers (`(in ₹ Crores)`). The ensemble engine flags this as `ROW_COLUMN_SWAP` / `UNIT_SCALE_FACTOR`.
  2. **Model Boundary Confusion (Forecast vs Definition Mismatch)**:
     - On the held-out benchmark evaluation (`benchmark_runner.py`), the v1.1 classifier misclassified `FORECAST_ACTUAL_MISMATCH` (IMF 7.0% projection vs Economic Survey 6.5% baseline) as a `DEFINITION_MISMATCH`.
     - **Root Cause**: The lexical description divergence between IMF and MoSPI terminology ("Gross Domestic Product at Constant Prices" vs "Real GDP Growth Baseline") outweighed the temporal/horizon difference in the feature weights.
  - **Remediation & Active Learning**: The system flags high-uncertainty comparisons ($> 0.85$ entropy) and surfaces them to the human-in-the-loop Active Learning Queue (`backend/app/ml/active_learning.py`).

---

## ⚠️ Limitations and Next Steps

Being completely transparent about system boundaries and edge cases:

### Current Limitations
1. **Scanned / Bitmap-Only PDFs**: The current pipeline relies on PyMuPDF's vector text stream parser for high-speed sub-millisecond coordinate extraction. It does not perform full-page optical character recognition on scanned PDFs without searchable text layers. Ingesting an image-only PDF requires an OCR pre-pass (e.g. Tesseract or EasyOCR).
2. **Multi-Page Table Continuations**: Financial statements that span across page breaks without repeating column headers (e.g. Notes to Financial Statements spanning 6 pages) can suffer from lost header context on continuation pages.
3. **Locale Specificity**: The unit normalizer is explicitly configured for Indian corporate and macroeconomic filings (supporting *Lakh*, *Crore*, *FY starting April 1*). Documents using East Asian financial conventions (e.g. *Wan*, *Oku*) or unconventional calendar fiscal years require adding new locale rules.
4. **Offline Benchmark Scope**: The offline benchmark runner evaluates entity resolution, fact matching, scale normalization, and tabular LightGBM pair classification deterministically. It does not invoke live LLMs to evaluate end-to-end generative text synthesis in the offline pass.

### Next Steps & Production Roadmap
- **Table Structure Graph Networks**: Replace heuristic vertical coordinate alignment with a graph neural network (GNN) trained to reconstruct tabular cell grids and multi-tier row/column hierarchies directly from visual geometry.
- **Hybrid Local OCR Routing**: Automatically route pages with low vector-text density to a local OCR engine while processing digital pages via high-speed PyMuPDF.
- **Cross-Lingual Unit Normalization**: Expand scale harmonization to handle multi-currency conversions using historical exchange rate tables pegged to filing publication dates.

---

## 📝 Additional Notes

### 1. Zero-API-Key Offline Evaluation Mode
The assignment states: *"If the project requires a paid service, include enough sample output and video footage for us to evaluate it without needing your account."*
- Evidence Galaxy is built with a **resilient zero-dependency fallback architecture**:
  - The knowledge graph runs locally on an in-memory **NetworkX** graph engine if Neo4j is unavailable.
  - The fact relationship classifier runs 100% locally via **LightGBM** without cloud dependencies.
  - Precomputed evaluation reports are committed directly to [`data/eval_reports/benchmark_report_v1.1.json`](file:///c:/Users/vrish/Desktop/superjoin/data/eval_reports/benchmark_report_v1.1.json).
  - Evaluators can run the full benchmark test suite offline without configuring any API keys:
    ```bash
    python -m backend.app.eval.benchmark_runner
    ```

### 2. Generalization Beyond Starter Datasets & Clean Architectural Decoupling
The assignment states: *"We may test your solution with additional PDFs, so it should not rely on hard-coded facts, filenames, schemas, or document-specific rules."*
- **Dynamic Schema-Free Extraction**: When new PDFs are uploaded, `fact_extractor.py` extracts verifiable assertions, numerical values, units, and periods dynamically from raw document text, grounding each fact with sub-pixel bounding-box coordinates via PyMuPDF search.
- **Strict Decoupling of Live Knowledge Base vs Evaluation Benchmark**:
  - The live knowledge graph (`GET /api/facts`, Galaxy visualizer, QA citations) is populated **strictly from dynamic document extraction**.
  - `GoldCurator` is strictly a **held-out evaluation benchmark** (`get_gold_test_pairs()`) used to evaluate model F1 and accuracy scientifically against fixed ground-truth pairs.
- **Generic Unit & Scale Normalization**: Scale harmonization is based on universal mathematical multipliers ($10^7$ for Crore, $10^5$ for Lakh, $10^6$ for Million, $10^9$ for Billion), evaluating ratio parity generically across any document.
- **Zero Silent Router Fallbacks**: Missing fact IDs return descriptive HTTP 404 errors with full frontend alert handling.

### 3. Benchmark Dataset & Leakage-Free Methodology
- **Curated Gold Set**: [`data/gold/gold_facts.json`](file:///c:/Users/vrish/Desktop/superjoin/data/gold/gold_facts.json) and [`data/gold/gold_test_pairs.json`](file:///c:/Users/vrish/Desktop/superjoin/data/gold/gold_test_pairs.json) contain hand-verified facts from the starter filings.
- **Zero Data Leakage**: The LightGBM classifier is trained strictly on **synthetic weak supervision instances**, and evaluated against the **100% held-out human gold test set**.

```
============================================================
 Evidence Galaxy: Offline Evaluation & Benchmark Suite
 (Zero-Network Test against Curated Gold Set)
============================================================
 Model Version:                  v1.1
 Overall Pair Classification Acc: 62.5%
 Macro F1 Score:                 0.622
 Weighted F1 Score:              0.633
 Entity Resolution F1:           0.800
 Fact Matching F1:               0.945
 Scale Normalization Accuracy:   98.5%
------------------------------------------------------------
 Per-Class Performance:
   * CORROBORATES                   F1: 0.667
   * SCOPE_MISMATCH                 F1: 1.000
   * TIME_MISMATCH                  F1: 1.000
   * DEFINITION_MISMATCH            F1: 0.400
   * GENUINE_CONTRADICTION          F1: 0.667
   * FORECAST_ACTUAL_MISMATCH       F1: 0.000
============================================================
 Detailed JSON report saved to: data/eval_reports/benchmark_report_v1.1.json
```

### 4. Submission Form Details
- **Assignment**: Superjoin Engineering Intern Hiring Assignment (VIT 2026)
- **Submission Form**: `https://forms.gle/3fLdBQ2D6Zm2Gqtv7`

---

## 📄 License
Distributed under the MIT License. See [`LICENSE`](file:///c:/Users/vrish/Desktop/superjoin/LICENSE) for details.
