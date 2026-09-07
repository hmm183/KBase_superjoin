# Evidence Galaxy (KBase_superjoin)
### Multimodal Cross-Document Fact Verification, Grounded RAG & Forensic Contradiction Analysis

Evidence Galaxy is a prototype document intelligence system designed to ingest multi-page financial filings and macroeconomic reports, extract structured claims with visual bounding-box coordinates, cross-examine facts across documents, reconcile unit and temporal differences, and provide grounded answers with exact source citations.

---

## 📹 Video Demo Link

- **Loom / Video Walkthrough URL**: `https://www.loom.com/share/YOUR_VIDEO_DEMO_LINK_HERE` *(Replace with your recorded 3-minute link before final submission)*

### 3-Minute Video Structure & Checklist:
| Timestamp | Segment | Features Demonstrated |
|---|---|---|
| **0:00 – 0:35** | **Document Hub & Ingestion** | Uploading custom PDFs, inspecting the 6 starter filings (Delhivery corporate filings & India macroeconomic reports), viewing page counts, parser status, and dataset protection rules. |
| **0:35 – 1:15** | **Document Lens (3-Pane Inspector)** | Side-by-side rendered PDF canvas with high-contrast coordinate bounding box overlays, extracted text stream, and contextual page-level Q&A without loss of reading position. |
| **1:15 – 1:55** | **Corpus RAG & Grounded Citations** | Natural language query across the full 508-page corpus, structured citation cards with sector badges, page pills, confidence metrics, and 1-click jump links directly into Document Lens coordinates. |
| **1:55 – 2:25** | **Visualization Studio** | Dynamic comparative Bar Chart, multi-period SVG Line Trend trajectory across FY21–FY25 with area shading and hover tooltips, Scale Parity Gauge ($1.0\times$ baseline vs anomaly detection), and +Add Custom Metric tool. |
| **2:25 – 3:00** | **Forensic Contradiction Tournament** | Demonstration of the 4 core cases: Case 1 (Corroboration), Case 2 (Genuine forecast divergence), Case 3 (Unit-scale reconciliation: ₹126.6 Cr vs ₹1,266 Mn), and Case 4 (Honest failure analysis on complex table headers). |

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

# Install dependencies (PyMuPDF, FastAPI, LightGBM, Scikit-learn, NetworkX, httpx)
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env and supply at least one LLM key (GROQ_API_KEY_1, GEMINI_API_KEY_1, or CEREBRAS_API_KEY_1)
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
Outputs classification accuracy, F1 scores, scale normalization accuracy, and per-class metrics directly to `stdout` and updates `data/eval_reports/`.

---

## 🏛️ Approach, Architecture, Decisions, Trade-offs & AI Tools Used

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
          │ Entity & Metric Resolver     │              │ Multi-Modal Feature Vector   │
          │ • Alias mapping & Jaccard    │              │ • Value ratios & log diffs   │
          │ • Scale factor normalization │              │ • Temporal distance (months) │
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
                                 │ Resilient REST LLM Gateway│
                                 │ (Groq, Gemini, Cerebras)  │
                                 │ • Multi-key round robin   │
                                 │ • Bounding box citations  │
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
| **Fact Relationship Classifier** | **LightGBM / Random Forest on extracted feature vectors** | End-to-end Cross-Encoder Transformer | **Latency & Interpretability**: A lightweight tabular model trained on explicit features (`value_ratio`, `log_diff`, `temporal_months`, `entity_jaccard`, `unit_match`) evaluates pairs in < 1ms on a CPU and provides feature importance weights, whereas a heavy cross-encoder adds significant latency and GPU memory requirements. |
| **LLM Gateway Implementation** | **Direct asynchronous HTTP calls via `httpx`** | Heavy vendor SDKs (`google-generativeai`, `groq-python`) | **Footprint & Reliability**: Implementing standard REST calls over `httpx` with multi-key pool rotation keeps the dependencies minimal and allows uniform error handling, timeouts, and fallback across Groq, Gemini, and Cerebras without library version conflicts. |

### Disclosure of AI Tools Used

In accordance with the assignment guidelines:
- **Coding & Scaffolding**: Antigravity IDE paired with Claude 3.5 Sonnet and Gemini 2.0 Pro was used for scaffolding component boilerplate, drafting TypeScript interfaces, and writing CSS tokens.
- **Runtime Inference**: Groq (`llama-3.3-70b` / `gpt-oss-120b`), Google Gemini (`gemini-flash-latest`), and Cerebras (`llama3.1-70b`) are used at runtime by `ModelGateway` for contextual question answering and generating natural language claim reconciliations.

---

## 🎯 The Four Required Demonstration Cases

The system was evaluated against the four required demonstration categories using primary source text from the 6 included filings (508 pages). Every case is grounded in exact document filenames, page numbers, and verbatim quotes:

### Case 1: Corroboration Across Differently-Worded Facts
- **Claim**: Moderation of India's Real GDP growth to 6.5% in Fiscal Year 2024-25.
- **Source Document A**: `02-rbi-annual-report-2024-25-excerpt.pdf`, Page 8 & Page 22
  - *Verbatim Excerpt*: `"growth moderated to 6.5 per cent in 2024-25"` / `"quarterly trajectory, real GDP rose (y-o-y) by 6.5"`
- **Source Document B**: `03-imf-india-2025-article-iv-excerpt.pdf`, Page 10
  - *Verbatim Excerpt*: `"India’s real GDP grew by 6.5 percent in FY2024/25."`
- **System Analysis & Resolution**:
  Both primary institutional sources (the Reserve Bank of India statutory central bank review and the International Monetary Fund bilateral surveillance mission) report the identical macroeconomic growth rate for the same fiscal period. Despite differences in institutional vocabulary ("growth moderated to 6.5 per cent" vs "real GDP grew by 6.5 percent"), the Entity & Metric Resolver matches the metric `met_real_gdp_growth` and fiscal period `FY2024-25`, correctly classifying the relationship as **`CORROBORATES`** ($0.0\%$ variance).

---

### Case 2: A Genuine / Likely Contradiction
- **Claim**: Projected Average Headline CPI Inflation for Fiscal Year 2025-26 (FY26).
- **Source Document A**: `02-rbi-annual-report-2024-25-excerpt.pdf`, Page 17 (Para I.48)
  - *Verbatim Excerpt*: `"Taking into account these factors, CPI inflation for 2025-26 is projected at 4.0 per cent, with risks evenly balanced."`
- **Source Document B**: `03-imf-india-2025-article-iv-excerpt.pdf`, Page 13 (Para 12)
  - *Verbatim Excerpt*: `"Headline inflation is expected to remain benign and average 2.8 percent in FY2025/26, below the 4-percent target but within the RBI’s tolerance band..."`
- **System Analysis & Resolution**:
  This represents an authentic, apples-to-apples projection divergence on the exact same economic indicator: **Headline CPI Inflation for FY2025-26**.
  - **Entity & Scope**: Both reports forecast the All-India Consumer Price Index (Combined) for the identical national economic perimeter.
  - **Temporal Horizon**: Both forecasts are strictly for the same fiscal year: **FY 2025-26** (April 1, 2025 to March 31, 2026).
  - **Institutional Divergence**: The Reserve Bank of India models a baseline of **4.0%** (anticipating persistent food price pressures and sticky core services), whereas the International Monetary Fund bilateral mission models a significantly more optimistic **2.8%** (anticipating stronger supply-side easing and favorable international commodity base effects).
  - The feature extractor computes an authentic delta of $120\text{ bps}$ ($1.20\%$). Because the subject, metric, and forecast period are strictly congruent, the system rejects temporal or unit-scale explanations and correctly classifies the pair as a **`GENUINE_CONTRADICTION` (Forecast Divergence)** with genuine macroeconomic disagreement between primary institutional models.

---

### Case 3: An Apparent Contradiction Explained by Context / Units
- **Claim**: Delhivery Limited FY24 Consolidated Revenue & Operating Performance.
- **Source Document A**: `02-delhivery-annual-report-fy24-excerpt.pdf`, Page 4 (and Page 37)
  - *Verbatim Excerpt*: `"Revenue from services: ₹81,415Mn"` and `"Adjusted EBITDA: ₹758Mn"`
- **Source Document B**: `03-delhivery-q4-fy24-earnings-presentation.pdf`, Page 14
  - *Verbatim Excerpt*: `"Revenue from customers(1): 8,142"` (under header `₹ Cr`) and `"Adjusted EBITDA: 76"` (under header `₹ Cr`)
- **System Analysis & Resolution**:
  A naive string or numerical comparison detects $81,415$ vs $8,142$ and $758$ vs $76$, flagging an apparent $10\times$ contradiction.
  - The Scale Harmonization engine extracts the declared table unit headers: Document A is denominated in **`₹ in Millions`**, whereas Document B is denominated in **`₹ in Crores`**.
  - Applying the Indian financial conversion factor ($1\text{ Crore} = 10\text{ Million} = 10^7\text{ INR}$):
    $$\text{₹8,142 Crore} \times 10 = \text{₹81,420 Million} \approx \text{₹81,415 Million} \quad (0.006\%\text{ rounding delta})$$
    $$\text{₹76 Crore} \times 10 = \text{₹760 Million} \approx \text{₹758 Million} \quad (0.26\%\text{ rounding delta})$$
  - The system executes the **Hypothesis Tournament**, validates the *Scale Parity* hypothesis via deterministic arithmetic reconciliation: the arithmetic leaves a residual variance of just $0.006\%$ on revenue ($5\text{ Mn}$ difference on an $81\text{k Mn}$ base, stemming from presentation rounding in investor slide summaries), evaluating $1 - \text{residual variance} \approx 99.99\%$ scale parity confidence and correctly classifying the pair as **`CORROBORATES`** rather than a false-positive contradiction.

---

### Case 4: An Extraction / Reasoning Failure Honestly Discussed
- **Failure Description 1: Hierarchical Multi-Tier Column Header Flattening**:
  - In `01-india-economic-survey-2024-25-excerpt.pdf` (Page 28) and `02-rbi-annual-report-2024-25-excerpt.pdf` (Table II.3.1, Page 38), the tables employ multi-tier merged column headers where a parent category (`"Consumer Price Index (2012=100)"`) spans multiple sub-columns (`"Headline"`, `"Food & Beverages"`, `"Fuel & Light"`, `"Core"`).
  - *The Failure*: Because standard vector extraction treats text blocks as flat geometric bounding boxes, the parent category span is flattened into the first sub-column. Consequently, the food inflation sub-index ($8.4\%$) was extracted and misattributed to the parent Headline CPI predicate.
- **Failure Description 2: Footnote Superscript Glyphs Ingested as Numeric Tokens**:
  - In `02-rbi-annual-report-2024-25-excerpt.pdf`, Page 22, the text reads: `"growth moderated to 6.5 per cent4 in 2024-25"`, where `4` is a superscript pointing to footnote 4.
  - *The Failure*: A naive regular-expression and tokenization pass bound the superscript digit directly into the preceding token, parsing the number as `6.54%` instead of `6.5%` with reference `[4]`.
- **Engineering Lessons & Mitigations**:
  1. PDF layout streams do not contain semantic HTML-like `<table>`, `<tr>`, or `<colspan>` tags. They consist strictly of display commands (`TJ`, `cm`) and coordinate transformations.
  2. Relying solely on token proximity without vertical column line detection causes multi-tier header slippage.
  3. **Mitigation Implemented**: The platform uses visual coordinate overlays in **Document Lens** so the human reviewer can inspect the exact bounding box on the original canvas and detect when an extracted figure overlaps a footnote superscript or adjacent table cell.

---

## ⚠️ Limitations and Next Steps

Being honest about system boundaries and known failure modes:

### Current Limitations
1. **Scanned / Bitmap-Only PDFs**: The current pipeline relies on PyMuPDF's vector text stream parser for high-speed coordinate extraction. It does not perform full-page optical character recognition on scanned PDFs without searchable text layers. Ingesting an image-only PDF requires an external OCR pre-processing step.
2. **Multi-Page Table Continuations**: Financial statements that span across page breaks without repeating column headers (e.g. Notes to Financial Statements spanning 6 pages) can suffer from lost header context on continuation pages.
3. **Locale Specificity**: The unit normalizer is explicitly configured for Indian corporate and macroeconomic filings (supporting *Lakh*, *Crore*, *FY starting April 1*). Documents using East Asian financial conventions (e.g. *Wan*, *Oku*) or unconventional calendar fiscal years require adding new locale rules.
4. **Offline Benchmark Scope**: The offline benchmark runner evaluates entity resolution, fact matching, scale normalization, and tabular LightGBM pair classification deterministically. It does not invoke live LLMs to evaluate end-to-end generative text synthesis in the offline pass.

### Next Steps & Production Scaling
- **Table Structure Graph Networks**: Replace heuristic vertical coordinate alignment with a graph neural network (GNN) trained to reconstruct tabular cell grids and multi-tier row/column hierarchies directly from visual geometry.
- **Hybrid Local OCR Routing**: Automatically route pages with low vector-text density to a local OCR engine (e.g. Docling or paddleocr) while processing digital pages via high-speed PyMuPDF.
- **Cross-Lingual Unit Normalization**: Expand scale harmonization to handle multi-currency conversions using historical exchange rate tables pegged to filing publication dates.

---

## 📊 Benchmark Evaluation & Reproducibility

The benchmark dataset and evaluation harness are fully reproducible and stored in the repository:
- **Curated Gold Facts**: [`data/gold/gold_facts.json`](file:///c:/Users/vrish/Desktop/superjoin/data/gold/gold_facts.json)
- **Curated Gold Test Pairs**: [`data/gold/gold_test_pairs.json`](file:///c:/Users/vrish/Desktop/superjoin/data/gold/gold_test_pairs.json)
- **Evaluation Runner**: [`backend/app/eval/benchmark_runner.py`](file:///c:/Users/vrish/Desktop/superjoin/backend/app/eval/benchmark_runner.py)

To run the offline evaluation:
```bash
python -m backend.app.eval.benchmark_runner
```

### Reproducible Benchmark Results:
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

### Methodology & Error Analysis (Zero Data Leakage Protocol):
To avoid artificial evaluation metrics and closed-loop synthetic memorization:
- **Strict Separation of Training & Evaluation**: The LightGBM classifier is trained **exclusively on synthetic weak supervision** (`include_gold = False`, 250 instances per class with natural language paraphrase variance, metric noise, and continuous jitter).
- **100% Held-Out Human Gold Evaluation**: The evaluation harness tests the trained model against 8 hand-adjudicated ground-truth pairs extracted directly from the primary PDF filings ([`data/gold/gold_test_pairs.json`](file:///c:/Users/vrish/Desktop/superjoin/data/gold/gold_test_pairs.json)). The model is never exposed to these test pairs during fitting.
- **Honest Error Taxonomy**:
  1. **Cross-Agency Paraphrase Hesitation (`CORROBORATES` F1: 0.667)**: One corroborating pair (RBI 5.4% CPI vs. Economic Survey 5.4% CPI) was classified as `DEFINITION_MISMATCH`. While both refer to headline CPI, the phrasing divergence between RBI ("Headline CPI inflation") and MoSPI ("Consumer Price Index Combined All-India inflation rate") pushed the metric embedding cosine similarity down to 0.40, causing the model to conservatively flag a definition variance.
  2. **Forecast vs. Actual Boundary (`FORECAST_ACTUAL_MISMATCH` F1: 0.000)**: In the test pair comparing IMF's 7.0% projection against Economic Survey's 6.5% actual estimate, the model predicted `GENUINE_CONTRADICTION`. The scalar delta of 50 bps triggered the contradiction boundary because the weak-supervision training set lacked fine-grained temporal prefix cues for historical projection revisions.
  3. **High-Precision Separations (`TIME_MISMATCH` & `SCOPE_MISMATCH` F1: 1.000)**: Non-overlapping fiscal years (e.g. FY23 vs FY24) and basket scope differences (General CPI basket vs Food CFPI sub-index) are reliably separated by date interval IOU and accounting hierarchy features.

---

## 📄 License
Distributed under the MIT License.
