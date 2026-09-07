# Evidence Galaxy — Frontend Client (React + TypeScript + Vite)

The frontend client for Evidence Galaxy is an enterprise-grade, high-performance single-page application (SPA) built with React 18, TypeScript, and Vite. It serves as the primary forensic workspace for cross-document fact verification, knowledge graph exploration, coordinate-level OCR bounding box inspection, hypothesis adjudication, and interactive data visualization.

---

## 🧭 System Architecture & Design Philosophy

The client interface is designed around three architectural principles:
1. **Zero-Friction Forensic Context**: The user should never lose their visual or reading position in a document when cross-examining facts or querying claims.
2. **Deterministic Citation Verification**: Every claim or metric synthesized by the system must provide a 1-click jump link directly to the underlying PDF canvas with visual coordinate bounding boxes.
3. **State Persistence Across Navigation**: Complex investigative state (active queries, synthesized answers, firewall claim verification badges, custom metric graphs, and document zoom levels) must persist across page changes and browser refreshes.

```
                               ┌────────────────────────┐
                               │   Vite + React Root    │
                               │      (App.tsx)         │
                               └───────────┬────────────┘
                                           │
          ┌────────────────────────────────┼────────────────────────────────┐
          ▼                                ▼                                ▼
┌──────────────────┐             ┌──────────────────┐             ┌──────────────────┐
│  Document Hub    │             │  Document Lens   │             │   Query Studio   │
│ (Multi-Filing    │             │ (3-Pane Forensic │             │ (Corpus RAG,     │
│  Management)     │             │  Coordinate View)│             │  Firewall & Vis) │
└──────────────────┘             └──────────────────┘             └─────────┬────────┘
                                                                            │
          ┌────────────────────────────────┬────────────────────────────────┘
          ▼                                ▼                                ▼
┌──────────────────┐             ┌──────────────────┐             ┌──────────────────┐
│Fact Investigator │             │ Evidence Galaxy  │             │ Evaluation Lab   │
│(Hypothesis Tourn)│             │(2D/3D Force Graph│             │(Active Learning  │
│                  │             │  Visualization)  │             │ & Metrics Suite) │
└──────────────────┘             └──────────────────┘             └──────────────────┘
```

---

## 🗂️ Detailed Component Breakdown

### 1. Document Hub (`src/components/DocumentHub.tsx`)
The central management portal for all indexed and uploaded documents.
- **High-Density Single-Screen Table**: Displays all 6 company starter documents simultaneously without vertical clipping or awkward page scrolling:
  - Corporate Logistics: *Delhivery Prospectus (2022)*, *Annual Report (FY24)*, *Q4 Earnings Presentation (FY24)*.
  - India Macroeconomy: *Economic Survey (2024-25)*, *RBI Annual Report (2024-25)*, *IMF Article IV Consultation (2025)*.
- **Metadata Badges**: Shows page counts, document file sizes, publication vintages, and processing status (`INDEXED & CACHED`).
- **Compact Upload Ribbon**: Drag-and-drop or browse custom PDF files for background layout parsing and knowledge graph extraction.
- **Protection Guardrails**: Pre-loaded starter documents are protected against accidental deletion, while user-uploaded documents can be deleted dynamically.

### 2. Document Lens — 3-Pane Forensic Inspector (`src/components/DocumentLens.tsx`)
The primary tool for deep, page-level visual verification.
- **Pane 1: High-Resolution PDF Canvas**:
  - Displays rendered 150 DPI page previews with zero client-side PDF decoding latency.
  - Interactive bounding-box coordinate overlay toggle highlighting words, numerical figures, and tables.
  - Hover tooltips display raw OCR/vector extraction confidence and token values.
- **Pane 2: Extracted Text & Tabular Flow**:
  - Displays formatted reading-order layout stream (headings, paragraphs, footnotes).
  - Highlights detected financial tables with matrix grid borders.
- **Pane 3: Contextual Page Q&A Engine**:
  - Allows users to submit targeted natural language questions specific to the active page (e.g. *"What is the reported Adjusted EBITDA on this page?"*).
  - Queries are processed with page-bounded context without navigating away from the visual inspection canvas.

### 3. Fact Investigator & Hypothesis Tournament (`src/components/FactInvestigator.tsx`)
Side-by-side reconciliation interface for analyzing conflicting or corroborating claims.
- **Dual Fact Comparison Cards**:
  - Displays Fact A and Fact B with document title, page badge, exact value, unit, and fiscal reference period.
  - Computes raw numerical delta and ratio parity in real time.
- **Hypothesis Tournament Engine**:
  - Evaluates competing explanations for discrepancies across documents:
    1. *Scale Parity Hypothesis*: Explains apparent $10\times$ discrepancies via unit conversion ($1\text{ Crore} = 10\text{ Million}$).
    2. *Accounting Scope Hypothesis*: Tests whether differences stem from Standalone vs. Consolidated reporting boundaries.
    3. *Temporal Drift Hypothesis*: Flags differences caused by differing historical vintages or subsequent financial restatements.
    4. *Definition Variance*: Flags differences between non-GAAP operational metrics (Adjusted EBITDA) and statutory GAAP figures (Profit After Tax).
- **Falsifiability Criteria ("What Would Change My Mind")**:
  - Provides a checklist of document disclosures that would falsify the active hypothesis.

### 4. Query Studio & Visualization Studio (`src/components/QueryStudio.tsx`)
Enterprise search, grounded synthesis, and interactive charting interface.
- **Corpus-Wide Natural Language RAG**:
  - Submits queries across all 508 pages of the indexed corpus.
  - Real-time streaming response synthesis with automatic fallback across Groq, Gemini, and Cerebras.
- **Hallucination Firewall Claim Badges**:
  - Deconstructs synthesized answers into asserted claims and verifies them against indexed graph nodes.
  - Emits verification badges (`VERIFIED_BY_GRAPH`, `UNRESOLVED_ASSERTION`).
- **Structured Grounded Citation Cards**:
  - Clickable citation cards displaying document name, sector badge, page pill, confidence score, verbatim quoted excerpt, and a 1-click **Inspect in Document Lens** jump button.
- **Visualization Studio (4 Interactive Modes)**:
  1. *Bar Graph*: Animated comparative bars with dynamic scale computation and value tags.
  2. *Line Trend*: Multi-period SVG trajectory across FY21–FY25 with area gradient fill and hover data tooltips.
  3. *Scale Gauge*: Radial dial evaluating unit scale parity ($1.0\times$ baseline vs anomaly detection).
  4. *+ Add Metric Tool*: Interactive builder allowing users to plot custom numbers alongside document facts with 1-click presets (*Express Parcel Vol*, *FY23 Revenue*, *MoSPI GDP Baseline*, *Statutory EBITDA*), color pickers, and unit selector.
- **LocalStorage Query History**:
  - Auto-saves query runs with timestamps, grounded confidence ratings, and 1-click instant reload.
  - Includes a dedicated tab toggle between **Curated Benchmarks (4)** and **Query History (N)**.

### 5. Evidence Galaxy — Knowledge Graph Canvas (`src/components/EvidenceGalaxy.tsx`)
Force-directed graph visualizer rendering the multi-document knowledge graph.
- **Node Classification**: Documents (blue), Pages (cyan), Entities (violet), Facts (emerald), and Contradictions (amber/red).
- **Interactive Physics**: D3-based force simulation supporting zoom, pan, drag, node search, and neighborhood expansion.
- **Node Inspection Drawer**: Clicking any node opens a detail panel showing exact provenance, entity aliases, and connected relationship edges.

### 6. Evaluation Lab & Active Learning (`src/components/EvaluationLab.tsx`)
Machine learning model performance and human-in-the-loop review interface.
- **Classification Performance**: Real-time display of precision, recall, macro F1, and confusion matrix across the 12-class contradiction taxonomy.
- **Active Learning Queue**: Surfaces fact pairs with highest prediction entropy (uncertainty boundary) for user annotation and model retraining.

---

## 💾 State Persistence & Session Management

To ensure an uninterrupted investigative workflow, the frontend implements a dual-layer persistence strategy:

1. **Persistent Component Mounting in `App.tsx`**:
   - The `<QueryStudio>` component remains mounted at all times using CSS `display: activeTab === 'query' ? 'flex' : 'none'`.
   - Navigating between Document Lens, Universe, or Hub does not destroy the in-memory React component tree. Active queries, streaming answers, citation cards, and active chart tool selections are preserved.
2. **`localStorage` Synchronization in `QueryStudio.tsx`**:
   - `eg_active_query`: Stores the current input query string.
   - `eg_active_result`: Serializes the synthesized response object, citations, and firewall metrics.
   - `eg_query_history`: Array of historical query runs with timestamps and confidence scores.
   - Hard browser refreshes (`F5` or `Ctrl+R`) automatically rehydrate the active workspace.

---

## 🛠️ Development & Build Commands

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies (React 18, Vite, Lucide-react, TypeScript)
npm install

# Start development server with Hot Module Replacement (HMR)
npm run dev
# Server starts on http://localhost:5173

# Run TypeScript compilation and Vite production build
npm run build
# Outputs optimized production bundle to frontend/dist/

# Preview production build locally
npm run preview
```

---

## 🎨 Design System & CSS Architecture

The interface utilizes a custom Vanilla CSS design system defined in `src/index.css` and `src/App.css`:
- **Color Tokens**: Dark mode palette based on deep slate voids (`#0A0F1D`, `#0D1424`), high-contrast text (`#F8FAFC`, `#94A3B8`), emerald grounding accents (`#10B981`), and violet/indigo action gradients (`linear-gradient(135deg, #4F46E5, #7C3AED)`).
- **Typography**: Clean, monospace-accented typography with high numerical readability for financial matrices.
- **Performance**: Zero heavy external CSS framework overhead (no Tailwind, Bootstrap, or Material UI). All styles compile instantaneously with minimal bundle weight.
