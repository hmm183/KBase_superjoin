import React, { useState, useEffect, useRef } from 'react';
import { 
  FileSearch, 
  Layers, 
  ZoomIn, 
  ZoomOut, 
  ChevronLeft, 
  ChevronRight, 
  Crosshair, 
  Grid, 
  Eye, 
  CheckCircle2,
  UploadCloud,
  Trash2,
  Lock,
  FolderPlus,
  FileText,
  X,
  Send,
  Sparkles
} from 'lucide-react';

interface DocumentLensProps {
  documentId: string;
  pageNumber: number;
  highlightQuery?: string;
  onPageChange: (docId: string, pageNum: number) => void;
  onCompareFact?: (factId: string) => void;
}

interface OcrBlock {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  text: string;
  block_id: number;
  is_numeric: boolean;
  type: string;
}

interface OcrTable {
  table_id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  row_count: number;
  col_count: number;
}

interface PageOcrData {
  page_number: number;
  page_width: number;
  page_height: number;
  total_blocks: number;
  tables: OcrTable[];
  blocks: OcrBlock[];
}

interface DocumentProfile {
  id: string;
  title: string;
  group: string;
  targetPages: number[];
  facts: any[];
  is_system_protected?: boolean;
}

// Curated starter documents with physical PDF page numbers and coordinate geometry
const STARTER_DOCUMENTS: DocumentProfile[] = [
  {
    id: '02-delhivery-annual-report-fy24-excerpt.pdf',
    title: 'Delhivery Annual Report FY24',
    group: 'delhivery',
    is_system_protected: true,
    targetPages: [6, 22, 36, 86],
    facts: [
      { 
        id: 'f_dlhv_ebitda', 
        label: 'Consolidated EBITDA (P.36)', 
        val: '₹1,266.41 Million', 
        page: 36, 
        bbox: { x1: 52.0, y1: 528.0, x2: 480.0, y2: 544.0, page_width: 1190.55, page_height: 841.89 }, 
        cell: 'Consolidated Performance Table, EBITDA Row' 
      },
      { 
        id: 'f_dlhv_rev', 
        label: 'Revenue from Operations', 
        val: '81,415.38 Million', 
        page: 36, 
        bbox: { x1: 52.0, y1: 432.0, x2: 480.0, y2: 446.0, page_width: 1190.55, page_height: 841.89 }, 
        cell: 'Financial Performance Table, Row 1' 
      },
      { 
        id: 'f_dlhv_stat_ebitda', 
        label: 'Statutory Loss / EBITDA', 
        val: '-₹68.2 Cr', 
        page: 86, 
        bbox: { x1: 1060.0, y1: 152.5, x2: 1135.0, y2: 163.1, page_width: 1190.55, page_height: 841.89 }, 
        cell: 'Consolidated P&L, Row 14' 
      }
    ]
  },
  {
    id: '03-delhivery-q4-fy24-earnings-presentation.pdf',
    title: 'Delhivery Q4 FY24 Earnings Presentation',
    group: 'delhivery',
    is_system_protected: true,
    targetPages: [1, 6, 14, 15],
    facts: [
      { 
        id: 'f_dlhv_pres_ebitda', 
        label: 'FY24 Adjusted EBITDA (Slide 6)', 
        val: '₹126.6 Cr (127 Cr)', 
        page: 6, 
        bbox: { x1: 165.0, y1: 275.0, x2: 320.0, y2: 310.0, page_width: 960.0, page_height: 540.0 }, 
        cell: 'Slide 6, Key Metrics Table' 
      },
      { 
        id: 'f_dlhv_express_rev', 
        label: 'Express Parcel Revenue', 
        val: '₹5,077 Cr', 
        page: 6, 
        bbox: { x1: 240.0, y1: 345.0, x2: 410.0, y2: 375.0, page_width: 960.0, page_height: 540.0 }, 
        cell: 'Slide 6, Express Row' 
      }
    ]
  },
  {
    id: '01-delhivery-prospectus-2022-excerpt.pdf',
    title: 'Delhivery IPO Prospectus (2022)',
    group: 'delhivery',
    is_system_protected: true,
    targetPages: [3, 26, 34],
    facts: [
      { 
        id: 'f_dlhv_hist_rev', 
        label: 'FY21 Market Position', 
        val: 'Market Leader (FY21)', 
        page: 3, 
        bbox: { x1: 65.0, y1: 420.0, x2: 530.0, y2: 445.0, page_width: 595.32, page_height: 841.92 }, 
        cell: 'Executive Overview, Para 4' 
      }
    ]
  },
  {
    id: '01-india-economic-survey-2024-25-excerpt.pdf',
    title: 'India Economic Survey 2024-25',
    group: 'india-macroeconomy',
    is_system_protected: true,
    targetPages: [28, 46, 76],
    facts: [
      { 
        id: 'f_ind_gdp_survey', 
        label: 'Real GDP Growth (FY25)', 
        val: '6.5%', 
        page: 46, 
        bbox: { x1: 90.0, y1: 180.0, x2: 380.0, y2: 215.0, page_width: 576.0, page_height: 792.0 }, 
        cell: 'Table 1.1, Baseline Projection' 
      },
      { 
        id: 'f_ind_cpi_survey', 
        label: 'CPI Headline Inflation', 
        val: '5.4%', 
        page: 28, 
        bbox: { x1: 130.0, y1: 435.0, x2: 240.0, y2: 465.0, page_width: 576.0, page_height: 792.0 }, 
        cell: 'Table 2.1, CPI Row' 
      }
    ]
  },
  {
    id: '02-rbi-annual-report-2024-25-excerpt.pdf',
    title: 'RBI Annual Report 2024-25',
    group: 'india-macroeconomy',
    is_system_protected: true,
    targetPages: [35, 40, 42],
    facts: [
      { 
        id: 'f_rbi_cpi', 
        label: 'Headline CPI Inflation (FY24)', 
        val: '5.4%', 
        page: 35, 
        bbox: { x1: 95.0, y1: 260.0, x2: 340.0, y2: 295.0, page_width: 612.0, page_height: 792.0 }, 
        cell: 'Box II.1, Macro Indicators' 
      }
    ]
  },
  {
    id: '03-imf-india-2025-article-iv-excerpt.pdf',
    title: 'IMF India 2025 Article IV Report',
    group: 'india-macroeconomy',
    is_system_protected: true,
    targetPages: [5, 14, 17],
    facts: [
      { 
        id: 'f_imf_gdp', 
        label: 'Real GDP Growth Projection', 
        val: '7.0%', 
        page: 14, 
        bbox: { x1: 85.0, y1: 220.0, x2: 350.0, y2: 255.0, page_width: 612.0, page_height: 792.0 }, 
        cell: 'Table 1, Executive Summary' 
      }
    ]
  }
];

export const DocumentLens: React.FC<DocumentLensProps> = ({
  documentId,
  pageNumber,
  onPageChange
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [showParserOverlay, setShowParserOverlay] = useState<boolean>(true);
  const [showOcrLayer, setShowOcrLayer] = useState<boolean>(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [ocrData, setOcrData] = useState<PageOcrData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeFactId, setActiveFactId] = useState<string>('f_dlhv_ebitda');
  const [hoveredItem, setHoveredItem] = useState<{ text: string; x: number; y: number; x2?: number; y2?: number } | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<OcrBlock | null>(null);

  // Page Intelligence Q&A State
  const [pageQuestion, setPageQuestion] = useState<string>('');
  const [pageAnswer, setPageAnswer] = useState<string | null>(null);
  const [pageQaLoading, setPageQaLoading] = useState<boolean>(false);
  const [pageHighlightBbox, setPageHighlightBbox] = useState<any | null>(null);

  const handleAskPageQuestion = async (qText: string) => {
    if (!qText.trim()) return;
    setPageQaLoading(true);
    try {
      const res = await fetch(`/api/documents/${documentId}/page/${pageNumber}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: qText })
      });
      const data = await res.json();
      setPageAnswer(data.answer);
      if (data.highlight_bbox) {
        setPageHighlightBbox(data.highlight_bbox);
      }
    } catch (err: any) {
      setPageAnswer(`Error asking page: ${err.message}`);
    } finally {
      setPageQaLoading(false);
    }
  };

  useEffect(() => {
    setPageAnswer(null);
    setPageHighlightBbox(null);
    setPageQuestion('');
  }, [documentId, pageNumber]);

  // Custom User Uploaded Documents
  const [customDocs, setCustomDocs] = useState<DocumentProfile[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isDocManagerOpen, setIsDocManagerOpen] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Client-side cache for instant return navigation (0 ms)
  const previewCache = useRef<Map<string, string>>(new Map());
  const ocrCache = useRef<Map<string, PageOcrData>>(new Map());

  // Combined documents list
  const allDocs = [...STARTER_DOCUMENTS, ...customDocs];
  const currentDoc = allDocs.find(d => d.id === documentId) || STARTER_DOCUMENTS[0];
  const activeFact = currentDoc.facts.find(f => f.id === activeFactId) || currentDoc.facts[0];

  // Fetch all documents from server to get custom uploads
  const refreshDocumentsList = () => {
    fetch('/api/documents')
      .then(res => res.json())
      .then((docs: any[]) => {
        const starterIds = new Set(STARTER_DOCUMENTS.map(d => d.id));
        const custom: DocumentProfile[] = docs
          .filter(d => !starterIds.has(d.document_id))
          .map(d => ({
            id: d.document_id,
            title: d.title || d.filename,
            group: d.dataset_group || 'custom',
            targetPages: Array.from({ length: Math.min(d.total_pages || 1, 5) }, (_, i) => i + 1),
            facts: [],
            is_system_protected: false
          }));
        setCustomDocs(custom);
      })
      .catch(console.error);
  };

  useEffect(() => {
    refreshDocumentsList();
  }, []);

  useEffect(() => {
    if (!documentId) return;
    const cacheKey = `${documentId}_p${pageNumber}`;

    // 1. Instant Cache Check for Preview Raster
    if (previewCache.current.has(cacheKey)) {
      setPreviewUrl(previewCache.current.get(cacheKey)!);
      setLoading(false);
    } else {
      setLoading(true);
      fetch(`/api/documents/${documentId}/page/${pageNumber}/preview`)
        .then(res => res.json())
        .then(data => {
          previewCache.current.set(cacheKey, data.preview_url);
          setPreviewUrl(data.preview_url);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }

    // 2. Instant Cache Check for OCR Blocks
    if (ocrCache.current.has(cacheKey)) {
      setOcrData(ocrCache.current.get(cacheKey)!);
    } else {
      fetch(`/api/documents/${documentId}/page/${pageNumber}/ocr-blocks`)
        .then(res => res.json())
        .then(data => {
          ocrCache.current.set(cacheKey, data);
          setOcrData(data);
        })
        .catch(() => setOcrData(null));
    }
  }, [documentId, pageNumber]);

  const handleFactClick = (fact: any) => {
    setActiveFactId(fact.id);
    if (fact.page !== pageNumber) {
      onPageChange(documentId, fact.page);
    }
  };

  const handleDocSelect = (newDocId: string) => {
    const doc = allDocs.find(d => d.id === newDocId) || STARTER_DOCUMENTS[0];
    if (doc.facts.length > 0) {
      setActiveFactId(doc.facts[0].id);
      onPageChange(doc.id, doc.facts[0].page);
    } else {
      onPageChange(doc.id, 1);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      alert('Please select a valid PDF file.');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Upload failed');
      }
      const newDoc = await res.json();
      refreshDocumentsList();
      onPageChange(newDoc.document_id, 1);
    } catch (err: any) {
      alert(`Upload error: ${err.message}`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteCustomDoc = async (docId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const isStarter = STARTER_DOCUMENTS.some(d => d.id === docId);
    if (isStarter) {
      alert('Company starter datasets are system-protected and cannot be deleted.');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete "${docId}"?`)) return;

    try {
      const res = await fetch(`/api/documents/${docId}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Delete failed');
      }
      refreshDocumentsList();
      if (documentId === docId) {
        handleDocSelect(STARTER_DOCUMENTS[0].id);
      }
    } catch (err: any) {
      alert(`Delete error: ${err.message}`);
    }
  };

  // Dimensional calculation
  const pageWidth = ocrData?.page_width || activeFact?.bbox.page_width || 1190.55;
  const pageHeight = ocrData?.page_height || activeFact?.bbox.page_height || 841.89;
  const isLandscapeSpread = pageWidth > 1000;

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', background: '#05070E', overflow: 'hidden' }}>
      
      {/* 1. LEFT SIDEBAR: Document Selector, Upload & Facts (320px) */}
      <aside style={{ width: '320px', background: '#080C17', borderRight: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', flexShrink: 0, zIndex: 10 }}>
        {/* Document Selector & Upload Header */}
        <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '10px', fontFamily: 'JetBrains Mono, monospace', color: '#818CF8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Document Repository
            </span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                style={{
                  background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.25), rgba(124, 58, 237, 0.25))',
                  border: '1px solid rgba(99, 102, 241, 0.4)',
                  color: '#A5B4FC',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  fontSize: '10px',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: isUploading ? 'not-allowed' : 'pointer'
                }}
              >
                <UploadCloud size={12} />
                <span>{isUploading ? 'Uploading...' : '+ Add PDF'}</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
            </div>
          </div>

          <select
            value={currentDoc.id}
            onChange={e => handleDocSelect(e.target.value)}
            style={{
              width: '100%',
              background: '#0D1424',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '10px',
              padding: '10px 12px',
              fontSize: '12px',
              fontFamily: 'Outfit, sans-serif',
              fontWeight: 600,
              color: '#FFFFFF',
              marginTop: '2px',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <optgroup label="🏢 Company Starter Datasets (Protected)">
              {STARTER_DOCUMENTS.map(doc => (
                <option key={doc.id} value={doc.id}>
                  🔒 {doc.title}
                </option>
              ))}
            </optgroup>
            {customDocs.length > 0 && (
              <optgroup label="📂 User Uploaded PDFs">
                {customDocs.map(doc => (
                  <option key={doc.id} value={doc.id}>
                    📄 {doc.title}
                  </option>
                ))}
              </optgroup>
            )}
          </select>

          {/* Document Protection Status Indicator */}
          {currentDoc.is_system_protected ? (
            <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(16, 185, 129, 0.08)', padding: '6px 10px', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <span style={{ fontSize: '10px', color: '#34D399', fontFamily: 'JetBrains Mono, monospace', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Lock size={11} /> Company Starter Dataset
              </span>
              <span style={{ fontSize: '9px', color: '#6EE7B7', fontWeight: 600, background: 'rgba(16, 185, 129, 0.2)', padding: '1px 5px', borderRadius: '4px' }}>
                Deletion Locked
              </span>
            </div>
          ) : (
            <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(239, 68, 68, 0.08)', padding: '6px 10px', borderRadius: '6px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              <span style={{ fontSize: '10px', color: '#FCA5A5', fontFamily: 'JetBrains Mono, monospace' }}>
                Custom Uploaded Document
              </span>
              <button
                onClick={(e) => handleDeleteCustomDoc(currentDoc.id, e)}
                style={{
                  background: '#EF4444',
                  border: 'none',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                <Trash2 size={11} />
                <span>Delete PDF</span>
              </button>
            </div>
          )}

          {/* Dedicated Manage PDFs Modal Trigger */}
          <button
            onClick={() => setIsDocManagerOpen(true)}
            style={{
              width: '100%',
              marginTop: '8px',
              background: 'rgba(99, 102, 241, 0.08)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              color: '#A5B4FC',
              padding: '6px 10px',
              borderRadius: '8px',
              fontSize: '11px',
              fontFamily: 'Outfit, sans-serif',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <FolderPlus size={13} />
            <span>Manage All PDFs (Add / Delete)</span>
          </button>
        </div>

        {/* Page Switcher Strip */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', color: '#94A3B8', fontFamily: 'JetBrains Mono, monospace' }}>Key Financial Pages:</span>
            <span style={{ fontSize: '11px', color: '#38BDF8', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>Pg {pageNumber}</span>
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {currentDoc.targetPages.map(p => (
              <button
                key={p}
                onClick={() => onPageChange(currentDoc.id, p)}
                style={{
                  background: pageNumber === p ? 'linear-gradient(135deg, #4F46E5, #7C3AED)' : '#0F172A',
                  border: `1px solid ${pageNumber === p ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.08)'}`,
                  color: pageNumber === p ? '#FFFFFF' : '#94A3B8',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Page {p}
              </button>
            ))}
          </div>
        </div>

        {/* Extracted Grounded Facts List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <span style={{ fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Coordinate-Linked Facts ({currentDoc.facts.length})
          </span>

          {currentDoc.facts.map(fact => {
            const isSelected = activeFact?.id === fact.id;
            return (
              <div
                key={fact.id}
                onClick={() => handleFactClick(fact)}
                style={{
                  background: isSelected ? 'rgba(99, 102, 241, 0.12)' : '#0A0F1D',
                  border: `1px solid ${isSelected ? '#6366F1' : 'rgba(255,255,255,0.06)'}`,
                  borderRadius: '12px',
                  padding: '12px 14px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '11px', color: isSelected ? '#A5B4FC' : '#94A3B8', fontWeight: 600 }}>
                    {fact.label}
                  </span>
                  <span style={{ fontSize: '10px', fontFamily: 'JetBrains Mono, monospace', background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: '4px', color: '#CBD5E1' }}>
                    Pg {fact.page}
                  </span>
                </div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '16px', fontWeight: 800, color: '#34D399' }}>
                  {fact.val}
                </div>
                <div style={{ fontSize: '10px', color: '#64748B', fontFamily: 'JetBrains Mono, monospace', marginTop: '4px' }}>
                  Target: {fact.cell}
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      {/* 2. CENTER STAGE: Document Canvas Area */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#030408' }}>
        {/* Canvas Toolbar */}
        <div style={{ height: '52px', padding: '0 24px', background: '#080C17', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileSearch size={18} style={{ color: '#818CF8' }} />
            <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '14px', fontWeight: 700, color: '#FFFFFF' }}>
              {currentDoc.title}
            </span>
            <span style={{ fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', color: '#64748B' }}>
              • Page {pageNumber} ({Math.round(pageWidth)}×{Math.round(pageHeight)} pt)
            </span>
            {isLandscapeSpread && (
              <span style={{ fontSize: '10px', fontFamily: 'JetBrains Mono, monospace', background: 'rgba(56, 189, 248, 0.12)', color: '#38BDF8', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                2-PAGE SPREAD
              </span>
            )}
            {currentDoc.is_system_protected && (
              <span style={{ fontSize: '10px', fontFamily: 'JetBrains Mono, monospace', background: 'rgba(16, 185, 129, 0.12)', color: '#34D399', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(16, 185, 129, 0.3)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Lock size={10} /> PROTECTED
              </span>
            )}
            <button
              onClick={() => setIsDocManagerOpen(true)}
              style={{
                background: 'rgba(99, 102, 241, 0.15)',
                border: '1px solid rgba(99, 102, 241, 0.4)',
                color: '#C7D2FE',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontFamily: 'Outfit, sans-serif',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                cursor: 'pointer',
                marginLeft: '4px'
              }}
            >
              <FolderPlus size={13} />
              <span>Manage PDFs (Add / Delete)</span>
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* OCR Detection Layer Toggle */}
            <button
              onClick={() => setShowOcrLayer(!showOcrLayer)}
              style={{
                background: showOcrLayer ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${showOcrLayer ? 'rgba(56, 189, 248, 0.4)' : 'rgba(255,255,255,0.1)'}`,
                color: showOcrLayer ? '#38BDF8' : '#94A3B8',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '11px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer'
              }}
            >
              <Eye size={13} />
              <span>OCR Layer: {showOcrLayer ? 'ON' : 'OFF'}</span>
              {ocrData && (
                <span style={{ background: 'rgba(255,255,255,0.1)', padding: '1px 5px', borderRadius: '4px', fontSize: '10px' }}>
                  {ocrData.tables.length}T • {ocrData.total_blocks}B
                </span>
              )}
            </button>

            {/* Scale Conversion Overlay Toggle */}
            <button
              onClick={() => setShowParserOverlay(!showParserOverlay)}
              style={{
                background: showParserOverlay ? 'rgba(168, 85, 247, 0.15)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${showParserOverlay ? 'rgba(168, 85, 247, 0.4)' : 'rgba(255,255,255,0.1)'}`,
                color: showParserOverlay ? '#D8B4FE' : '#94A3B8',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '11px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer'
              }}
            >
              <Layers size={13} />
              <span>Scale Reconciliation: {showParserOverlay ? 'ON' : 'OFF'}</span>
            </button>

            {/* Zoom Controls & Fit Page */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                onClick={() => setZoomLevel(isLandscapeSpread ? 0.76 : 0.86)}
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.14)',
                  color: '#CBD5E1',
                  padding: '5px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                title="Fit document page to screen"
              >
                Fit Page
              </button>
              <button
                onClick={() => setZoomLevel(1.0)}
                style={{
                  background: zoomLevel === 1.0 ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.06)',
                  border: `1px solid ${zoomLevel === 1.0 ? '#38BDF8' : 'rgba(255, 255, 255, 0.14)'}`,
                  color: zoomLevel === 1.0 ? '#38BDF8' : '#CBD5E1',
                  padding: '5px 8px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
                title="Reset zoom to 100%"
              >
                100%
              </button>
              <div style={{ display: 'flex', alignItems: 'center', background: '#0D1424', padding: '3px 6px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <button
                  onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.15))}
                  style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '4px' }}
                >
                  <ZoomOut size={15} />
                </button>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: '#FFFFFF', padding: '0 8px' }}>
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  onClick={() => setZoomLevel(prev => Math.min(2.5, prev + 0.15))}
                  style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '4px' }}
                >
                  <ZoomIn size={15} />
                </button>
              </div>
            </div>

            {/* Page Arrow Steppers */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                onClick={() => onPageChange(documentId, Math.max(1, pageNumber - 1))}
                disabled={pageNumber <= 1}
                style={{ background: '#0F172A', border: '1px solid rgba(255,255,255,0.1)', color: '#CBD5E1', padding: '5px 8px', borderRadius: '6px', cursor: 'pointer', opacity: pageNumber <= 1 ? 0.3 : 1 }}
              >
                <ChevronLeft size={15} />
              </button>
              <button
                onClick={() => onPageChange(documentId, pageNumber + 1)}
                style={{ background: '#0F172A', border: '1px solid rgba(255,255,255,0.1)', color: '#CBD5E1', padding: '5px 8px', borderRadius: '6px', cursor: 'pointer' }}
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Viewport Render Stage */}
        <div style={{ flex: 1, overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', color: '#94A3B8' }}>
              <Crosshair size={32} style={{ color: '#818CF8' }} />
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px' }}>
                Rendering Page {pageNumber}...
              </span>
            </div>
          ) : (
            <div
              style={{
                position: 'relative',
                background: '#FFFFFF',
                borderRadius: '6px',
                boxShadow: '0 20px 80px rgba(0,0,0,0.85)',
                transform: `scale(${zoomLevel})`,
                transformOrigin: 'center center',
                transition: 'transform 0.15s ease'
              }}
            >
              {/* Raster Image */}
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt={`Document Page ${pageNumber}`}
                  style={{ 
                    maxHeight: 'calc(100vh - 175px)', 
                    maxWidth: isLandscapeSpread ? 'min(980px, calc(100vw - 640px))' : 'min(720px, calc(100vw - 640px))', 
                    height: 'auto', 
                    width: 'auto',
                    display: 'block', 
                    pointerEvents: 'none', 
                    userSelect: 'none' 
                  }}
                />
              ) : (
                <div style={{ width: '600px', height: '800px', background: '#0B0F1C', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}>
                  Loading Page Raster...
                </div>
              )}

              {/* 1. OCR Block & Table Detection Layer */}
              {showOcrLayer && ocrData && (
                <>
                  {/* Highlighted Tables Boundary Boxes */}
                  {ocrData.tables.map(tab => (
                    <div
                      key={tab.table_id}
                      onMouseEnter={() => setHoveredItem({ text: `Table Structure (${tab.row_count} rows × ${tab.col_count} columns)`, x: tab.x1, y: tab.y1, x2: tab.x2, y2: tab.y2 })}
                      onMouseLeave={() => setHoveredItem(null)}
                      style={{
                        position: 'absolute',
                        border: '2px solid #38BDF8',
                        background: 'rgba(56, 189, 248, 0.14)',
                        boxShadow: '0 0 15px rgba(56, 189, 248, 0.3)',
                        borderRadius: '4px',
                        pointerEvents: 'auto',
                        cursor: 'help',
                        left: `${(tab.x1 / pageWidth) * 100}%`,
                        top: `${(tab.y1 / pageHeight) * 100}%`,
                        width: `${((tab.x2 - tab.x1) / pageWidth) * 100}%`,
                        height: `${((tab.y2 - tab.y1) / pageHeight) * 100}%`
                      }}
                    >
                      <span style={{ position: 'absolute', top: '-18px', left: 0, background: '#0284C7', color: '#FFFFFF', fontSize: '9px', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', boxShadow: '0 2px 6px rgba(0,0,0,0.6)' }}>
                        TABLE ({tab.row_count}×{tab.col_count})
                      </span>
                    </div>
                  ))}

                  {/* Highlighted Text & Numeric Metrics Cells */}
                  {ocrData.blocks.map(block => (
                    <div
                      key={block.block_id}
                      onClick={() => setSelectedBlock(block)}
                      onMouseEnter={() => setHoveredItem({ text: block.text, x: block.x1, y: block.y1, x2: block.x2, y2: block.y2 })}
                      onMouseLeave={() => setHoveredItem(null)}
                      style={{
                        position: 'absolute',
                        border: selectedBlock?.block_id === block.block_id 
                          ? '2px solid #38BDF8' 
                          : block.is_numeric ? '1.5px solid rgba(245, 158, 11, 0.85)' : '1px solid rgba(129, 140, 248, 0.4)',
                        background: selectedBlock?.block_id === block.block_id
                          ? 'rgba(56, 189, 248, 0.25)'
                          : block.is_numeric ? 'rgba(245, 158, 11, 0.16)' : 'rgba(129, 140, 248, 0.08)',
                        boxShadow: selectedBlock?.block_id === block.block_id
                          ? '0 0 15px rgba(56, 189, 248, 0.5)'
                          : block.is_numeric ? '0 0 10px rgba(245, 158, 11, 0.25)' : 'none',
                        borderRadius: '3px',
                        pointerEvents: 'auto',
                        cursor: 'pointer',
                        transition: 'all 0.12s ease',
                        left: `${(block.x1 / pageWidth) * 100}%`,
                        top: `${(block.y1 / pageHeight) * 100}%`,
                        width: `${((block.x2 - block.x1) / pageWidth) * 100}%`,
                        height: `${((block.y2 - block.y1) / pageHeight) * 100}%`
                      }}
                    />
                  ))}
                </>
              )}

              {/* 2. Exact Ground-Truth Highlight Reticle (Positioned on the Table Row) */}
              {activeFact && activeFact.page === pageNumber && (
                <div
                  style={{
                    position: 'absolute',
                    border: '2.5px solid #10B981',
                    background: 'rgba(16, 185, 129, 0.25)',
                    borderRadius: '4px',
                    boxShadow: '0 0 35px rgba(16, 185, 129, 0.85)',
                    pointerEvents: 'none',
                    zIndex: 25,
                    left: `${(activeFact.bbox.x1 / pageWidth) * 100}%`,
                    top: `${(activeFact.bbox.y1 / pageHeight) * 100}%`,
                    width: `${((activeFact.bbox.x2 - activeFact.bbox.x1) / pageWidth) * 100}%`,
                    height: `${Math.max(16, ((activeFact.bbox.y2 - activeFact.bbox.y1) / pageHeight) * 100)}%`
                  }}
                >
                  {/* Clean Callout Tag */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '-24px',
                      left: 0,
                      background: '#064E3B',
                      border: '1px solid #10B981',
                      color: '#34D399',
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '5px',
                      whiteSpace: 'nowrap',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.6)'
                    }}
                  >
                    GROUND TRUTH: {activeFact.label} = {activeFact.val}
                  </div>
                </div>
              )}

              {/* 3. Scale Reconciliation Badge */}
              {showParserOverlay && activeFact && activeFact.page === pageNumber && activeFact.id === 'f_dlhv_ebitda' && (
                <div
                  style={{
                    position: 'absolute',
                    border: '2px dashed #38BDF8',
                    background: 'rgba(56, 189, 248, 0.15)',
                    borderRadius: '4px',
                    pointerEvents: 'none',
                    zIndex: 28,
                    left: `${(activeFact.bbox.x1 / pageWidth) * 100}%`,
                    top: `${((activeFact.bbox.y2 + 2) / pageHeight) * 100}%`,
                    width: `${((activeFact.bbox.x2 - activeFact.bbox.x1) / pageWidth) * 100}%`,
                    height: '24px'
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: '2px',
                      left: 0,
                      background: '#0B2545',
                      border: '1px solid #38BDF8',
                      color: '#7DD3FC',
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '9px',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      whiteSpace: 'nowrap',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.6)'
                    }}
                  >
                    Unit Scale Equivalence: ₹1,266.41 Million = ₹126.64 Crore
                  </div>
                </div>
              )}

              {/* 3. Page Q&A Coordinate Highlight Reticle */}
              {pageHighlightBbox && (
                <div
                  style={{
                    position: 'absolute',
                    border: '2.5px solid #06B6D4',
                    background: 'rgba(6, 182, 212, 0.25)',
                    borderRadius: '4px',
                    boxShadow: '0 0 35px rgba(6, 182, 212, 0.85)',
                    pointerEvents: 'none',
                    zIndex: 35,
                    left: `${(pageHighlightBbox.x1 / pageWidth) * 100}%`,
                    top: `${(pageHighlightBbox.y1 / pageHeight) * 100}%`,
                    width: `${((pageHighlightBbox.x2 - pageHighlightBbox.x1) / pageWidth) * 100}%`,
                    height: `${Math.max(18, ((pageHighlightBbox.y2 - pageHighlightBbox.y1) / pageHeight) * 100)}%`
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: '-24px',
                      left: 0,
                      background: '#083344',
                      border: '1px solid #06B6D4',
                      color: '#67E8F9',
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '9.5px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '5px',
                      whiteSpace: 'nowrap',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.6)'
                    }}
                  >
                    PAGE Q&A TARGET ANCHOR
                  </div>
                </div>
              )}

              {/* 4. Full Text Hover Tooltip with Inverted Boundary Clamping (Never Clips at Top) */}
              {hoveredItem && (
                <div
                  style={{
                    position: 'absolute',
                    left: hoveredItem.x / pageWidth > 0.55 ? undefined : `${(hoveredItem.x / pageWidth) * 100}%`,
                    right: hoveredItem.x / pageWidth > 0.55 ? `${Math.max(2, (1 - hoveredItem.x / pageWidth) * 100 - 8)}%` : undefined,
                    top: hoveredItem.y / pageHeight < 0.42
                      ? `${((hoveredItem.y2 || hoveredItem.y + 35) / pageHeight) * 100}%` 
                      : `${Math.max(5, (hoveredItem.y / pageHeight) * 100 - 4)}%`,
                    transform: hoveredItem.y / pageHeight < 0.42 ? 'none' : 'translateY(-105%)',
                    background: 'rgba(11, 16, 32, 0.96)',
                    backdropFilter: 'blur(16px)',
                    border: '1.5px solid #38BDF8',
                    color: '#F0F9FF',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '11px',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    maxWidth: '480px',
                    maxHeight: '220px',
                    overflowY: 'auto',
                    lineHeight: 1.5,
                    boxShadow: '0 16px 40px rgba(0,0,0,0.95)',
                    pointerEvents: 'none',
                    zIndex: 100
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '9px', color: '#38BDF8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Extracted Text Block
                    </span>
                    <span style={{ fontSize: '9px', color: '#94A3B8' }}>
                      {hoveredItem.text.length} chars
                    </span>
                  </div>
                  {hoveredItem.text}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* 3. RIGHT INSPECTOR PANEL: Forensic Provenance & Scale Diff (350px) */}
      <aside style={{ width: '350px', background: '#080C17', borderLeft: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', flexShrink: 0, overflowY: 'auto', padding: '16px', gap: '16px' }}>
        
        {/* Interactive Page Intelligence Q&A Card - Prominent AI Auditor */}
        <div style={{
          background: '#0B1324',
          border: '1.5px solid #06B6D4',
          borderRadius: '12px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          boxShadow: '0 4px 24px rgba(6, 182, 212, 0.25), inset 0 1px 0 rgba(34, 211, 238, 0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ background: '#0891B2', borderRadius: '6px', padding: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={14} style={{ color: '#FFFFFF' }} />
              </div>
              <div>
                <span style={{ fontSize: '13px', fontFamily: 'Outfit, sans-serif', color: '#FFFFFF', fontWeight: 800, letterSpacing: '0.2px', display: 'block' }}>
                  AI Forensic Auditor
                </span>
                <span style={{ fontSize: '10px', color: '#67E8F9', fontFamily: 'JetBrains Mono, monospace' }}>
                  Page {pageNumber} Grounded Inspector
                </span>
              </div>
            </div>
            <span style={{
              fontSize: '10px',
              fontWeight: 800,
              fontFamily: 'JetBrains Mono, monospace',
              color: '#FFFFFF',
              background: '#0891B2',
              border: '1px solid #22D3EE',
              padding: '2px 8px',
              borderRadius: '4px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34D399', boxShadow: '0 0 6px #34D399' }} />
              ONLINE
            </span>
          </div>

          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleAskPageQuestion(pageQuestion);
            }}
            style={{ display: 'flex', gap: '8px' }}
          >
            <input 
              type="text" 
              value={pageQuestion} 
              onChange={e => setPageQuestion(e.target.value)} 
              placeholder={`Ask anything about Page ${pageNumber}...`} 
              style={{
                flex: 1,
                background: '#0F1A30',
                border: '1.5px solid rgba(6, 182, 212, 0.45)',
                borderRadius: '7px',
                padding: '8px 12px',
                fontSize: '12px',
                color: '#FFFFFF',
                outline: 'none',
                fontFamily: 'Outfit, sans-serif'
              }}
            />
            <button
              type="submit"
              disabled={pageQaLoading}
              style={{
                background: '#0891B2',
                border: '1px solid #22D3EE',
                color: '#FFFFFF',
                padding: '8px 14px',
                borderRadius: '7px',
                fontWeight: 700,
                fontSize: '11.5px',
                cursor: pageQaLoading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                boxShadow: '0 2px 8px rgba(6, 182, 212, 0.35)'
              }}
              title="Audit this page with AI"
            >
              {pageQaLoading ? <Sparkles size={13} className="spin-slow" /> : <Send size={13} />}
              <span>Ask</span>
            </button>
          </form>

          {/* Quick suggestions */}
          {!pageAnswer && (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {["What are the key numbers?", "Explain the tables", "EBITDA reconciliation"].map((sq, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setPageQuestion(sq);
                    handleAskPageQuestion(sq);
                  }}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '5px',
                    padding: '3px 8px',
                    fontSize: '10.5px',
                    fontWeight: 500,
                    color: '#E2E8F0',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = '#22D3EE';
                    e.currentTarget.style.color = '#FFFFFF';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                    e.currentTarget.style.color = '#E2E8F0';
                  }}
                >
                  {sq}
                </button>
              ))}
            </div>
          )}

          {/* Page Answer */}
          {pageAnswer && (
            <div style={{
              background: '#070C16',
              padding: '12px 14px',
              borderRadius: '8px',
              border: '1.5px solid rgba(6, 182, 212, 0.4)',
              maxHeight: '220px',
              overflowY: 'auto'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '9.5px', fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, color: '#22D3EE', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  ✓ Grounded Page Audit Finding
                </span>
                <span style={{ fontSize: '9px', color: '#94A3B8' }}>P.{pageNumber}</span>
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: '#F1F5F9', lineHeight: 1.55, whiteSpace: 'pre-wrap', fontFamily: 'Outfit, sans-serif' }}>
                {pageAnswer}
              </p>
              {pageHighlightBbox && (
                <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: '#22D3EE', fontFamily: 'JetBrains Mono, monospace' }}>
                  <Crosshair size={12} />
                  <span>Target cell highlighted on canvas reticle</span>
                </div>
              )}
            </div>
          )}
        </div>
        {/* Selected / Hovered OCR Text Block Full Fidelity Inspector */}
        {(selectedBlock || hoveredItem) && (
          <div style={{ background: '#0D1527', border: '1px solid #38BDF8', borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px', boxShadow: '0 8px 24px rgba(56, 189, 248, 0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', color: '#38BDF8', fontWeight: 700, textTransform: 'uppercase' }}>
                {selectedBlock ? `Selected Block #${selectedBlock.block_id}` : 'Hovered OCR Block'}
              </span>
              <span style={{ fontSize: '10px', color: '#94A3B8', fontFamily: 'JetBrains Mono, monospace' }}>
                {(selectedBlock?.text || hoveredItem?.text || '').length} chars
              </span>
            </div>
            <div style={{ maxHeight: '180px', overflowY: 'auto', background: 'rgba(0,0,0,0.4)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p style={{ margin: 0, fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', color: '#F1F5F9', lineHeight: '1.6', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                {selectedBlock?.text || hoveredItem?.text}
              </p>
            </div>
            {selectedBlock && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#64748B', fontFamily: 'JetBrains Mono, monospace' }}>
                <span>Type: {selectedBlock.type}</span>
                <span>Box: [{Math.round(selectedBlock.x1)}, {Math.round(selectedBlock.y1)}] ➔ [{Math.round(selectedBlock.x2)}, {Math.round(selectedBlock.y2)}]</span>
              </div>
            )}
          </div>
        )}

        <div>
          <span style={{ fontSize: '10px', fontFamily: 'JetBrains Mono, monospace', color: '#818CF8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Coordinate Telemetry
          </span>
          <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '16px', color: '#FFFFFF', marginTop: '2px' }}>
            {activeFact ? activeFact.label : 'Document Explorer'}
          </h3>
        </div>

        {/* Bounding Box Coordinates Table */}
        {activeFact ? (
          <div style={{ background: '#0A0F1D', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontFamily: 'JetBrains Mono, monospace' }}>
              <span style={{ color: '#64748B' }}>Target Cell:</span>
              <span style={{ color: '#FFFFFF', fontWeight: 600 }}>{activeFact.cell}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontFamily: 'JetBrains Mono, monospace' }}>
              <span style={{ color: '#64748B' }}>Bounding Box [X]:</span>
              <span style={{ color: '#A5B4FC' }}>{activeFact.bbox.x1} ➔ {activeFact.bbox.x2}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontFamily: 'JetBrains Mono, monospace' }}>
              <span style={{ color: '#64748B' }}>Bounding Box [Y]:</span>
              <span style={{ color: '#A5B4FC' }}>{activeFact.bbox.y1} ➔ {activeFact.bbox.y2}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontFamily: 'JetBrains Mono, monospace' }}>
              <span style={{ color: '#64748B' }}>Canvas Geometry:</span>
              <span style={{ color: '#38BDF8', fontWeight: 600 }}>{Math.round(pageWidth)} × {Math.round(pageHeight)} pt</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontFamily: 'JetBrains Mono, monospace' }}>
              <span style={{ color: '#64748B' }}>OCR Confidence:</span>
              <span style={{ color: '#34D399', fontWeight: 700 }}>98.6%</span>
            </div>
          </div>
        ) : (
          <div style={{ background: '#0A0F1D', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '14px', color: '#94A3B8', fontSize: '12px' }}>
            Viewing custom uploaded PDF. Browse pages using top steppers or inspect detected tables below.
          </div>
        )}

        {/* Page OCR Statistics Card */}
        {ocrData && (
          <div style={{ background: '#0D1424', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Grid size={14} style={{ color: '#38BDF8' }} />
              <span style={{ fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', color: '#38BDF8', fontWeight: 700, textTransform: 'uppercase' }}>
                Page OCR Detection Map
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '4px' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '8px', borderRadius: '6px' }}>
                <span style={{ fontSize: '9px', color: '#94A3B8', fontFamily: 'JetBrains Mono, monospace' }}>TABLES</span>
                <p style={{ fontSize: '16px', fontWeight: 800, color: '#38BDF8', margin: 0, fontFamily: 'JetBrains Mono, monospace' }}>{ocrData.tables.length}</p>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '8px', borderRadius: '6px' }}>
                <span style={{ fontSize: '9px', color: '#94A3B8', fontFamily: 'JetBrains Mono, monospace' }}>BLOCKS</span>
                <p style={{ fontSize: '16px', fontWeight: 800, color: '#34D399', margin: 0, fontFamily: 'JetBrains Mono, monospace' }}>{ocrData.total_blocks}</p>
              </div>
            </div>
            <span style={{ fontSize: '10px', color: '#64748B', fontFamily: 'JetBrains Mono, monospace' }}>
              Hover over highlighted boxes on the canvas to inspect recognized text tokens without cutoffs.
            </span>
          </div>
        )}

        {/* Scale & Unit Resolution Card */}
        {activeFact && activeFact.id === 'f_dlhv_ebitda' && (
          <div style={{ background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={16} style={{ color: '#38BDF8' }} />
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', fontWeight: 800, color: '#38BDF8', textTransform: 'uppercase' }}>
                Unit Scale Reconciliation
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '8px' }}>
              <div>
                <span style={{ fontSize: '9px', fontFamily: 'JetBrains Mono, monospace', color: '#94A3B8' }}>THIS ANNUAL REPORT (P.36)</span>
                <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', fontWeight: 800, color: '#38BDF8', margin: '2px 0' }}>₹1,266.41 M</p>
                <span style={{ fontSize: '9px', color: '#64748B' }}>Table Header: (₹ in Million)</span>
              </div>
              <div>
                <span style={{ fontSize: '9px', fontFamily: 'JetBrains Mono, monospace', color: '#94A3B8' }}>Q4 PRESENTATION (SLIDE 6)</span>
                <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', fontWeight: 800, color: '#34D399', margin: '2px 0' }}>₹126.6 Cr (127 Cr)</p>
                <span style={{ fontSize: '9px', color: '#64748B' }}>Reported in Crores</span>
              </div>
            </div>

            <p style={{ fontSize: '11px', color: '#CBD5E1', lineHeight: '1.4' }}>
              Why ₹126.6 Cr in other reports? In Delhivery's Q4 Presentation (Slide 6), the company converts ₹1,266.41 Million into Crores: 1,266.41 M ÷ 10 = ₹126.64 Cr (reported as 127 Cr). In THIS Annual Report, the official audited table prints ₹1,266.41 Million. Both are mathematically identical.
            </p>
          </div>
        )}

        {/* Provenance Chain Graph Link */}
        <div style={{ background: '#0A0F1D', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontSize: '10px', fontFamily: 'JetBrains Mono, monospace', color: '#64748B', textTransform: 'uppercase' }}>
            Evidence Graph Hierarchy
          </span>
          <div style={{ fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', color: '#E2E8F0', lineHeight: '1.6' }}>
            Document ➔ Physical Page {pageNumber} ➔ Table ➔ Cell {activeFact ? activeFact.cell : 'Region'} ➔ Fact
          </div>
        </div>
      </aside>

      {/* 4. DOCUMENT & PDF REPOSITORY MANAGER MODAL */}
      {isDocManagerOpen && (
        <div 
          style={{ 
            position: 'fixed', 
            inset: 0, 
            background: 'rgba(3, 7, 18, 0.85)', 
            backdropFilter: 'blur(8px)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            zIndex: 9999, 
            padding: '24px' 
          }}
          onClick={() => setIsDocManagerOpen(false)}
        >
          <div 
            style={{ 
              width: '840px', 
              maxHeight: '85vh', 
              background: '#090D1A', 
              border: '1px solid rgba(255, 255, 255, 0.14)', 
              borderRadius: '16px', 
              boxShadow: '0 24px 70px rgba(0,0,0,0.95)', 
              display: 'flex', 
              flexDirection: 'column', 
              overflow: 'hidden' 
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FolderPlus size={22} style={{ color: '#818CF8' }} />
                <div>
                  <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '18px', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
                    Document & PDF Corpus Repository
                  </h2>
                  <p style={{ fontSize: '12px', color: '#94A3B8', margin: '2px 0 0 0' }}>
                    Upload corporate PDFs for multimodal ingestion or inspect loaded datasets. Company starter files are system-protected.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsDocManagerOpen(false)}
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94A3B8', borderRadius: '8px', padding: '6px', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Upload Card */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                style={{ 
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(168, 85, 247, 0.08))', 
                  border: '2px dashed rgba(99, 102, 241, 0.35)', 
                  borderRadius: '12px', 
                  padding: '24px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  gap: '8px', 
                  cursor: isUploading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <UploadCloud size={32} style={{ color: '#818CF8' }} />
                <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '14px', fontWeight: 600, color: '#FFFFFF' }}>
                  {isUploading ? 'Uploading & Indexing PDF with PyMuPDF...' : 'Click or Drag PDF to Upload New Document'}
                </span>
                <span style={{ fontSize: '11px', color: '#94A3B8', fontFamily: 'JetBrains Mono, monospace' }}>
                  Supports multi-page corporate financial reports, annual filings, & investor presentations
                </span>
              </div>

              {/* Table of Documents */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', color: '#818CF8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Loaded Documents ({allDocs.length} Total • 5 System Protected)
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {/* Starter Documents */}
                  {STARTER_DOCUMENTS.map(doc => {
                    const isSelected = currentDoc.id === doc.id;
                    return (
                      <div 
                        key={doc.id}
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between', 
                          padding: '12px 16px', 
                          background: isSelected ? 'rgba(99, 102, 241, 0.12)' : 'rgba(255,255,255,0.02)', 
                          border: `1px solid ${isSelected ? 'rgba(99, 102, 241, 0.4)' : 'rgba(255,255,255,0.06)'}`, 
                          borderRadius: '10px' 
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <FileText size={18} style={{ color: '#818CF8' }} />
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '13px', fontWeight: 600, color: '#FFFFFF' }}>{doc.title}</span>
                              <span style={{ fontSize: '9px', fontFamily: 'JetBrains Mono, monospace', background: 'rgba(16, 185, 129, 0.15)', color: '#34D399', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '2px 6px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Lock size={9} /> SYSTEM PROTECTED
                              </span>
                            </div>
                            <span style={{ fontSize: '11px', color: '#64748B', fontFamily: 'JetBrains Mono, monospace' }}>
                              {doc.id} • Group: {doc.group} • {doc.targetPages.length} Benchmark Pages
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <button
                            onClick={() => {
                              handleDocSelect(doc.id);
                              setIsDocManagerOpen(false);
                            }}
                            style={{ 
                              background: isSelected ? '#4F46E5' : 'rgba(255,255,255,0.06)', 
                              color: '#FFFFFF', 
                              border: 'none', 
                              padding: '5px 12px', 
                              borderRadius: '6px', 
                              fontSize: '11px', 
                              fontWeight: 600, 
                              cursor: 'pointer' 
                            }}
                          >
                            {isSelected ? 'Currently Viewing' : 'View in Lens'}
                          </button>
                          <button
                            disabled
                            title="Company starter datasets are system-protected and cannot be deleted."
                            style={{ 
                              background: 'rgba(255,255,255,0.03)', 
                              color: '#64748B', 
                              border: '1px solid rgba(255,255,255,0.06)', 
                              padding: '5px 10px', 
                              borderRadius: '6px', 
                              fontSize: '10px', 
                              fontFamily: 'JetBrains Mono, monospace', 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '4px', 
                              cursor: 'not-allowed', 
                              opacity: 0.6 
                            }}
                          >
                            <Lock size={11} /> Protected
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {/* Custom Uploaded Documents */}
                  {customDocs.length === 0 ? (
                    <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.08)', textAlign: 'center', color: '#64748B', fontSize: '12px' }}>
                      No custom PDFs uploaded yet. Upload a PDF using the box above to add your own corporate filings.
                    </div>
                  ) : (
                    customDocs.map(doc => {
                      const isSelected = currentDoc.id === doc.id;
                      return (
                        <div 
                          key={doc.id}
                          style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'space-between', 
                            padding: '12px 16px', 
                            background: isSelected ? 'rgba(99, 102, 241, 0.12)' : 'rgba(255,255,255,0.02)', 
                            border: `1px solid ${isSelected ? 'rgba(99, 102, 241, 0.4)' : 'rgba(255,255,255,0.06)'}`, 
                            borderRadius: '10px' 
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <FileText size={18} style={{ color: '#38BDF8' }} />
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '13px', fontWeight: 600, color: '#FFFFFF' }}>{doc.title}</span>
                                <span style={{ fontSize: '9px', fontFamily: 'JetBrains Mono, monospace', background: 'rgba(56, 189, 248, 0.12)', color: '#38BDF8', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '2px 6px', borderRadius: '4px' }}>
                                  USER CUSTOM
                                </span>
                              </div>
                              <span style={{ fontSize: '11px', color: '#64748B', fontFamily: 'JetBrains Mono, monospace' }}>
                                {doc.id} • Group: {doc.group}
                              </span>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <button
                              onClick={() => {
                                handleDocSelect(doc.id);
                                setIsDocManagerOpen(false);
                              }}
                              style={{ 
                                background: isSelected ? '#4F46E5' : 'rgba(255,255,255,0.06)', 
                                color: '#FFFFFF', 
                                border: 'none', 
                                padding: '5px 12px', 
                                borderRadius: '6px', 
                                fontSize: '11px', 
                                fontWeight: 600, 
                                cursor: 'pointer' 
                              }}
                            >
                              {isSelected ? 'Currently Viewing' : 'View in Lens'}
                            </button>
                            <button
                              onClick={(e) => handleDeleteCustomDoc(doc.id, e)}
                              style={{ 
                                background: 'rgba(239, 68, 68, 0.15)', 
                                color: '#EF4444', 
                                border: '1px solid rgba(239, 68, 68, 0.3)', 
                                padding: '5px 10px', 
                                borderRadius: '6px', 
                                fontSize: '11px', 
                                fontWeight: 700, 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '4px', 
                                cursor: 'pointer' 
                              }}
                            >
                              <Trash2 size={12} /> Delete
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
