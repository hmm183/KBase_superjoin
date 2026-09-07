# Evidence Galaxy (KBase_superjoin)
### Automated Cross-Document Fact Verification, Grounded RAG & Forensic Contradiction Analysis

Evidence Galaxy is an enterprise-grade document intelligence platform designed to ingest complex multi-page financial filings, macroeconomic surveys, and corporate reports, construct an interconnected knowledge graph of claims, reconcile unit/definition discrepancies, and provide verifiably grounded answers with exact coordinate citations.

---

## 🌟 Core System Architecture

```
                                  ┌────────────────────────┐
                                  │   Document Ingestion   │
                                  │ (PyMuPDF, pdfplumber)  │
                                  └───────────┬────────────┘
                                              │
                      ┌───────────────────────┴──────────────────────┐
                      ▼                                              ▼
          ┌──────────────────────┐                       ┌──────────────────────┐
          │ High-Speed Extraction│                       │ Multi-Layer OCR      │
          │ (Vector / Text Flow) │                       │ (Table & Word BBoxes)│
          └───────────┬──────────┘                       └───────────┬──────────┘
                      │                                              │
                      └───────────────────────┬──────────────────────┘
                                              ▼
                                  ┌────────────────────────┐
                                  │  Entity Resolution &   │
                                  │  Harmonization Engine  │
                                  └───────────┬────────────┘
                                              │
                      ┌───────────────────────┴──────────────────────┐
                      ▼                                              ▼
          ┌──────────────────────┐                       ┌──────────────────────┐
          │ Corpus RAG & Grounded│                       │ Active Learning Lab  │
          │ Multi-Provider LLMs  │                       │ & ML Classifier      │
          └───────────┬──────────┘                       └───────────┬──────────┘
                      │                                              │
                      └───────────────────────┬──────────────────────┘
                                              ▼
                                  ┌────────────────────────┐
                                  │   Frontend Workspace   │
                                  │ (Lens, Galaxy, Studio) │
                                  └────────────────────────┘
```

---

## 🚀 Key Modules & Capabilities

### 1. Document Hub & Multi-Parser Arena
- **Zero-Loss Document Parsing**: Leverages an ensemble parser strategy combining high-precision PyMuPDF text/layout streams with pdfplumber tabular grid extraction.
- **Enterprise Starter Corpus**: Includes 508 pages across two multi-document sectors:
  - **Corporate Logistics**: Delhivery IPO Prospectus (2022), Delhivery Annual Report (FY24), Delhivery Q4 FY24 Presentation.
  - **Macroeconomics**: India Economic Survey (2024-25), RBI Annual Report (2024-25), IMF Article IV Consultation (2025).
- **Interactive Document Upload**: Allows dragging and dropping arbitrary PDF files for live indexing, text extraction, and cross-document fact linking.

### 2. Document Lens (3-Pane Forensic View)
- **Side-by-Side Visual Verification**: Displays high-fidelity rendered PDF canvas alongside raw extracted text blocks and structured tables.
- **Dynamic Bounding Box Overlays**: Highlights word-level and table-level bounding boxes directly on top of the document page.
- **Contextual Page Q&A**: Submit targeted natural language questions directly about the currently viewed page without losing document context.

### 3. Forensic Contradiction Engine & Hypothesis Tournament
- **Scale & Unit Harmonization**: Automatically identifies and proves parity across different reporting formats (e.g. proving ₹126.6 Crore in an Annual Report equals ₹1,266 Million in an Earnings Presentation via $1\text{ Cr} = 10\text{ M}$ scaling).
- **Hypothesis Tournament**: Evaluates candidate explanations for differences across documents:
  - Temporal drift (differing fiscal horizons)
  - Scope variance (Restated standalone vs Consolidated statements)
  - Methodology divergence (Statutory EBITDA vs Adjusted Operational EBITDA)
  - Unit scaling disparities

### 4. Query Studio & Corpus RAG
- **Multi-Provider LLM Gateway**: High-speed, fault-tolerant inference with automatic failover across **Groq** (`llama-3.3-70b` / `gpt-oss-120b`), **Google Gemini** (`gemini-flash-latest`), and **Cerebras** (`llama3.1-70b` / `llama3.3-70b`).
- **Grounded Structured Citations**: Every answer includes document source names, page badges, verbatim quoted excerpts, and one-click jump buttons to inspect bounding boxes in Document Lens.
- **Hallucination Firewall**: Evaluates facts against indexed claim nodes to output claim verification badges and confidence ratings.
- **Visualization Studio**: Interactive charting toolbar with:
  - Comparative Bar Graphs
  - Multi-period SVG Line Trend trajectories with area shading and hover tooltips
  - Unit Scale Parity Gauges ($1.0\times$ baseline vs anomaly detection)
  - Interactive Custom Metric Plotting Tool with presets and color selectors
- **Query History & State Persistence**: LocalStorage-backed query history with 1-click restore, query re-runs, and zero-loss navigation across tabs.

### 5. Machine Learning & Active Learning Lab
- **Fact Relationship Classifier**: Scikit-Learn classifier scoring whether pairs of facts corroborate, contradict, supersede, or are neutral.
- **Synthetic Contradiction Generator**: Augments training data by synthetically injecting numerical shifts, entity mutations, and scale inversions.
- **Interactive Active Learning Loop**: Review uncertain edge classifications, label hard examples, and retrain the classifier on the fly.

---

## 🛠️ Tech Stack

- **Backend**: Python 3.10+, FastAPI, Uvicorn, PyMuPDF (fitz), pdfplumber, Scikit-Learn, NetworkX, NumPy, Pandas, Pydantic v2
- **Frontend**: React 18, TypeScript, Vite, Lucide Icons, Custom High-Performance Vanilla CSS Design System
- **Databases & Cloud**: MongoDB Atlas, Neo4j Graph DB, Cloudinary

---

## 📦 Getting Started

### 1. Prerequisites
- Python 3.10 or higher
- Node.js 18+ and npm
- Git

### 2. Clone the Repository
```bash
git clone https://github.com/hmm183/KBase_superjoin.git
cd KBase_superjoin
```

### 3. Backend Setup
```bash
# Install Python dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env and supply your LLM API keys (Groq, Gemini, or Cerebras)
```

### 4. Run the Backend Server
```bash
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8001 --reload
```
The FastAPI documentation will be available at `http://127.0.0.1:8001/docs`.

### 5. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173/` in your browser.

---

## 🧪 Benchmark & Quality Verification

Run the built-in forensic verification benchmark suite:
```bash
python -m backend.app.eval.benchmark_runner
```
Outputs validation accuracy, claim extraction precision, scale resolution consistency, and hallucination firewall pass rates to `data/eval_reports/`.

---

## 📄 License
MIT License
