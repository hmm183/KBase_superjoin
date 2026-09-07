# Starter Datasets — Overview & Sector Breakdown

This directory contains the primary evaluation datasets for Evidence Galaxy, totaling **6 PDF filings and 508 pages** across two distinct economic and disclosure domains:

```
data/starter-datasets/
├── README.md                      # This overview document
├── delhivery/                     # Corporate Logistics Sector (3 Filings, 227 Pages)
│   ├── 01-delhivery-prospectus-2022-excerpt.pdf
│   ├── 02-delhivery-annual-report-fy24-excerpt.pdf
│   ├── 03-delhivery-q4-fy24-earnings-presentation.pdf
│   └── README.md                  # Provenance, retained pages, and key financial metrics
└── india-macroeconomy/            # Macroeconomic Reports Sector (3 Reports, 284 Pages)
    ├── 01-india-economic-survey-2024-25-excerpt.pdf
    ├── 02-rbi-annual-report-2024-25-excerpt.pdf
    ├── 03-imf-india-2025-article-iv-excerpt.pdf
    └── README.md                  # Institutional sources, macroeconomic indicators, and forecast overlaps
```

---

## 🎯 Purpose & Design Rationale

These two starter sectors were deliberately chosen to test the core failure modes of traditional RAG pipelines:

### 1. Corporate Logistics Sector (`delhivery/`)
- **Diverse Disclosure Formats**: Combines a statutory IPO prospectus, a comprehensive audited annual report, and an investor earnings presentation.
- **Reporting Unit Disparities**: Directly tests scale and unit reconciliation between **₹ Millions** (used in the statutory Annual Report) and **₹ Crores** (used in executive presentation slides), verifying that ₹126.6 Cr equals ₹1,266 Mn, and ₹81,415 Mn equals ₹8,142 Cr ($1\text{ Cr} = 10\text{ M}$).
- **Non-GAAP vs. GAAP Metrics**: Contains both statutory GAAP measures (Profit After Tax, Standalone Revenue) and management operating metrics (Adjusted EBITDA, Service EBITDA, Part-Truckload Tonnage).
- **Temporal Gaps**: Contains historical metrics from FY2019–FY2022 in the Prospectus alongside audited FY2023–FY2024 figures in the Annual Report, testing temporal horizon tracking and restatement detection.

### 2. Macroeconomic Reports Sector (`india-macroeconomy/`)
- **Multi-Agency Consensus & Divergence**: Combines primary reports from three major economic bodies:
  - **Ministry of Finance (Government of India)**: *Economic Survey 2024-25*
  - **Reserve Bank of India (Central Bank)**: *Annual Report 2024-25*
  - **International Monetary Fund (Multilateral Surveillance)**: *India 2025 Article IV Consultation*
- **Macroeconomic Indicator Overlaps**: Tests corroboration and divergence across real GDP growth projections (6.5% vs. 7.2%), headline CPI inflation, food price pressures, current account deficit (CAD), and public debt trajectories.
- **Complex Statistical Tables**: Features multi-tier hierarchical column headers and footnote superscripts that challenge layout parsers.

---

## 🔒 Ingestion & Protection Guardrails

1. **Automatic Discovery & Indexing**: Upon startup, `DocumentIngestor` automatically scans both directories, extracts text and layout bounding boxes, and warms up the in-memory cache for high-traffic pages.
2. **Deletion Protection**: To preserve benchmark reproducibility and evaluation integrity, the 6 starter documents are **read-only and protected against deletion** via the API and UI (`DELETE /api/documents/{doc_id}` returns a 403 error if a starter document ID is requested). User-uploaded documents in `data/uploads/` can be deleted at any time.
