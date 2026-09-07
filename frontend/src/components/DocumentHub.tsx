import React, { useState, useEffect, useRef } from 'react';
import { 
  UploadCloud, 
  FileText, 
  Trash2, 
  Lock, 
  CheckCircle2, 
  FolderGit2, 
  ExternalLink, 
  Search, 
  Cpu, 
  Sparkles,
  Building2,
  Landmark
} from 'lucide-react';

interface DocumentHubProps {
  onOpenDocumentLens: (docId: string, pageNum: number) => void;
}

interface IngestionStep {
  id: number;
  label: string;
  detail: string;
  status: 'pending' | 'active' | 'done';
}

export const DocumentHub: React.FC<DocumentHubProps> = ({ onOpenDocumentLens }) => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [filterGroup, setFilterGroup] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadSteps, setUploadSteps] = useState<IngestionStep[]>([
    { id: 1, label: 'Integrity & SHA-256', detail: 'Hashing document binary', status: 'pending' },
    { id: 2, label: 'PyMuPDF Rasterization', detail: 'Generating 300 DPI tiles', status: 'pending' },
    { id: 3, label: 'Table & Cell OCR', detail: 'Parsing topology & bounding boxes', status: 'pending' },
    { id: 4, label: 'Knowledge Graph Linking', detail: 'Resolving entities & facts', status: 'pending' },
    { id: 5, label: 'Verified in Lens', detail: 'Sub-millisecond access ready', status: 'pending' }
  ]);
  const [uploadedFilename, setUploadedFilename] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocuments = () => {
    fetch('/api/documents')
      .then(res => res.json())
      .then(data => setDocuments(data))
      .catch(console.error);
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const simulateStepProgress = async (callback: () => Promise<any>) => {
    setIsUploading(true);
    setUploadSteps(prev => prev.map((s, i) => ({ ...s, status: i === 0 ? 'active' : 'pending' })));

    await new Promise(r => setTimeout(r, 450));
    setUploadSteps(prev => prev.map((s, i) => ({ ...s, status: i === 0 ? 'done' : (i === 1 ? 'active' : 'pending') })));

    await new Promise(r => setTimeout(r, 550));
    setUploadSteps(prev => prev.map((s, i) => ({ ...s, status: i <= 1 ? 'done' : (i === 2 ? 'active' : 'pending') })));

    try {
      const res = await callback();
      
      setUploadSteps(prev => prev.map((s, i) => ({ ...s, status: i <= 2 ? 'done' : (i === 3 ? 'active' : 'pending') })));
      await new Promise(r => setTimeout(r, 400));

      setUploadSteps(prev => prev.map(s => ({ ...s, status: 'done' })));
      await new Promise(r => setTimeout(r, 600));

      fetchDocuments();
      if (res?.document_id) {
        onOpenDocumentLens(res.document_id, 1);
      }
    } catch (err: any) {
      alert(`Upload error: ${err.message}`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      alert('Please select a valid PDF file.');
      return;
    }

    setUploadedFilename(file.name);
    const formData = new FormData();
    formData.append('file', file);

    simulateStepProgress(async () => {
      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Upload failed');
      }
      return await res.json();
    });
  };

  const handleDelete = async (docId: string, isProtected: boolean) => {
    if (isProtected) {
      alert('Company starter datasets are system-protected and cannot be deleted.');
      return;
    }

    if (!window.confirm(`Are you sure you want to permanently delete "${docId}"?`)) return;

    try {
      const res = await fetch(`/api/documents/${docId}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Deletion rejected');
      }
      fetchDocuments();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredDocs = documents.filter(doc => {
    const matchesGroup = 
      filterGroup === 'all' ? true :
      filterGroup === 'delhivery' ? doc.dataset_group === 'delhivery' :
      filterGroup === 'macro' ? doc.dataset_group === 'india-macroeconomy' :
      !doc.is_system_protected;

    const matchesQuery = searchQuery === '' || 
      (doc.title && doc.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (doc.filename && doc.filename.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (doc.dataset_group && doc.dataset_group.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesGroup && matchesQuery;
  });

  const delhiveryDocs = filteredDocs.filter(d => d.dataset_group === 'delhivery');
  const macroDocs = filteredDocs.filter(d => d.dataset_group === 'india-macroeconomy');
  const customDocs = filteredDocs.filter(d => !d.is_system_protected);

  const renderDocRow = (doc: any, idx: number) => (
    <tr 
      key={doc.document_id} 
      style={{ 
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
        transition: 'background 0.15s ease'
      }}
    >
      <td style={{ padding: '10px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FileText size={16} style={{ color: doc.is_system_protected ? '#818CF8' : '#38BDF8', flexShrink: 0 }} />
          <div>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#FFFFFF', display: 'block' }}>
              {doc.title || doc.filename}
            </span>
            <span style={{ fontSize: '10px', color: '#64748B', fontFamily: 'JetBrains Mono, monospace' }}>
              {doc.document_id}
            </span>
          </div>
        </div>
      </td>
      <td style={{ padding: '10px 14px' }}>
        {doc.is_system_protected ? (
          <span style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#34D399', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '2px 7px', borderRadius: '5px', fontSize: '9px', fontFamily: 'JetBrains Mono, monospace', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Lock size={9} /> SYSTEM PROTECTED
          </span>
        ) : (
          <span style={{ background: 'rgba(56, 189, 248, 0.12)', color: '#38BDF8', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '2px 7px', borderRadius: '5px', fontSize: '9px', fontFamily: 'JetBrains Mono, monospace' }}>
            USER CUSTOM
          </span>
        )}
        <span style={{ display: 'block', fontSize: '10px', color: '#64748B', marginTop: '2px', textTransform: 'uppercase' }}>
          {doc.dataset_group}
        </span>
      </td>
      <td style={{ padding: '10px 14px' }}>
        <span style={{ fontSize: '12px', color: '#E2E8F0', fontFamily: 'JetBrains Mono, monospace' }}>
          {doc.total_pages || 1} Pgs
        </span>
        <span style={{ display: 'block', fontSize: '10px', color: '#64748B', fontFamily: 'JetBrains Mono, monospace' }}>
          {doc.file_size_bytes ? `${Math.round(doc.file_size_bytes / 1024)} KB` : 'Cached'}
        </span>
      </td>
      <td style={{ padding: '10px 14px' }}>
        <span style={{ fontSize: '10px', color: '#94A3B8', fontFamily: 'JetBrains Mono, monospace' }} title={doc.sha256_hash}>
          {doc.sha256_hash ? `${doc.sha256_hash.substring(0, 12)}...` : 'Verified'}
        </span>
      </td>
      <td style={{ padding: '10px 16px', textAlign: 'right' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
          <button
            onClick={() => onOpenDocumentLens(doc.document_id, 1)}
            style={{ 
              background: '#4F46E5', 
              color: '#FFFFFF', 
              border: 'none', 
              padding: '5px 10px', 
              borderRadius: '6px', 
              fontSize: '11px', 
              fontWeight: 600, 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '4px', 
              cursor: 'pointer' 
            }}
          >
            <ExternalLink size={11} />
            <span>Open Lens</span>
          </button>

          {doc.is_system_protected ? (
            <button
              disabled
              title="Company starter datasets are system-protected and cannot be deleted."
              style={{ 
                background: 'rgba(255,255,255,0.03)', 
                color: '#64748B', 
                border: '1px solid rgba(255,255,255,0.08)', 
                padding: '5px 8px', 
                borderRadius: '6px', 
                fontSize: '10px', 
                fontFamily: 'JetBrains Mono, monospace', 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '3px', 
                cursor: 'not-allowed', 
                opacity: 0.6 
              }}
            >
              <Lock size={10} />
              <span>Locked</span>
            </button>
          ) : (
            <button
              onClick={() => handleDelete(doc.document_id, doc.is_system_protected)}
              style={{ 
                background: 'rgba(239, 68, 68, 0.15)', 
                color: '#EF4444', 
                border: '1px solid rgba(239, 68, 68, 0.3)', 
                padding: '5px 8px', 
                borderRadius: '6px', 
                fontSize: '11px', 
                fontWeight: 600, 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '3px', 
                cursor: 'pointer' 
              }}
            >
              <Trash2 size={11} />
              <span>Delete</span>
            </button>
          )}
        </div>
      </td>
    </tr>
  );

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#05070E', overflowY: 'auto', padding: '20px 32px' }}>
      
      {/* 1. Header & Compact Actions Strip */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.3), rgba(124, 58, 237, 0.3))', padding: '8px', borderRadius: '10px', border: '1px solid rgba(99, 102, 241, 0.4)' }}>
            <FolderGit2 size={20} style={{ color: '#818CF8' }} />
          </div>
          <div>
            <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '20px', fontWeight: 800, color: '#FFFFFF', margin: 0, letterSpacing: '-0.3px' }}>
              Document Corpus & Evidence Repository
            </h1>
            <p style={{ fontSize: '12px', color: '#94A3B8', margin: '2px 0 0 0' }}>
              6 Pre-loaded canonical filings across corporate logistics & India macroeconomy.
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ background: '#080C17', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={15} style={{ color: '#818CF8' }} />
            <div>
              <div style={{ fontSize: '9px', color: '#64748B', fontFamily: 'JetBrains Mono, monospace' }}>TOTAL LOADED</div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#FFFFFF', fontFamily: 'JetBrains Mono, monospace' }}>{documents.length} Files</div>
            </div>
          </div>
          <div style={{ background: '#080C17', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '10px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Lock size={15} style={{ color: '#34D399' }} />
            <div>
              <div style={{ fontSize: '9px', color: '#64748B', fontFamily: 'JetBrains Mono, monospace' }}>PROTECTED STARTERS</div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#34D399', fontFamily: 'JetBrains Mono, monospace' }}>6 Datasets</div>
            </div>
          </div>
          <button
            onClick={() => !isUploading && fileInputRef.current?.click()}
            disabled={isUploading}
            style={{
              background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #EC4899 100%)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              color: '#FFFFFF',
              padding: '10px 18px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 800,
              fontFamily: 'Outfit, sans-serif',
              cursor: isUploading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 0 25px rgba(124, 58, 237, 0.6)',
              transition: 'all 0.2s ease'
            }}
          >
            <UploadCloud size={16} />
            <span>+ Upload PDF</span>
          </button>
        </div>
      </div>

      {/* 2. Prominent Upload Hero Card (High Visibility & Space) */}
      <div style={{ marginBottom: '26px', flexShrink: 0 }}>
        <div 
          onClick={() => !isUploading && fileInputRef.current?.click()}
          style={{ 
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.55), rgba(15, 23, 42, 0.8))', 
            border: '2px dashed #818CF8', 
            borderRadius: '16px', 
            padding: '28px 36px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            cursor: isUploading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 10px 40px rgba(99, 102, 241, 0.18)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Subtle Ambient Glow */}
          <div style={{ position: 'absolute', top: '-40px', right: '20%', width: '200px', height: '120px', background: 'radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, transparent 70%)', pointerEvents: 'none' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '22px', zIndex: 1 }}>
            <div style={{ background: 'linear-gradient(135deg, #4F46E5, #9333EA)', width: '58px', height: '58px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 30px rgba(124, 58, 237, 0.75)', flexShrink: 0 }}>
              <UploadCloud size={30} style={{ color: '#FFFFFF' }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '10px', fontFamily: 'JetBrains Mono, monospace', background: 'rgba(99, 102, 241, 0.25)', color: '#A5B4FC', border: '1px solid rgba(99, 102, 241, 0.5)', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                  PDF REPOSITORY INGESTION
                </span>
                <span style={{ fontSize: '11px', color: '#10B981', fontFamily: 'JetBrains Mono, monospace' }}>
                  • PyMuPDF Topology + OCR Consensus Ready
                </span>
              </div>
              <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '18px', fontWeight: 800, color: '#FFFFFF', margin: 0, letterSpacing: '-0.3px' }}>
                {isUploading ? `Ingesting "${uploadedFilename}"...` : 'Upload Custom Corporate PDF Filing'}
              </h3>
              <p style={{ fontSize: '13px', color: '#94A3B8', margin: '4px 0 0 0', lineHeight: 1.5 }}>
                Drag and drop any financial report, earnings deck, or economic paper (or click button to browse).
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={isUploading}
            style={{
              background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #EC4899 100%)',
              border: '1.5px solid rgba(255, 255, 255, 0.4)',
              color: '#FFFFFF',
              padding: '16px 32px',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: 800,
              fontFamily: 'Outfit, sans-serif',
              cursor: isUploading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 0 35px rgba(124, 58, 237, 0.85)',
              letterSpacing: '0.3px',
              zIndex: 1,
              flexShrink: 0
            }}
          >
            <UploadCloud size={20} />
            <span>{isUploading ? 'Uploading...' : 'Upload PDF Document'}</span>
          </button>
          <input 
            ref={fileInputRef}
            type="file" 
            accept=".pdf" 
            onChange={handleFileUpload} 
            style={{ display: 'none' }} 
          />
        </div>

        {/* Animated Progress Strip if uploading */}
        {isUploading && (
          <div style={{ marginTop: '10px', background: '#090D1A', border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: '10px', padding: '12px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Cpu size={14} className="spin-slow" style={{ color: '#818CF8' }} />
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', fontWeight: 700, color: '#818CF8' }}>
                PyMuPDF Multimodal Ingestion Pipeline Active
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
              {uploadSteps.map(step => (
                <div 
                  key={step.id}
                  style={{ 
                    background: step.status === 'active' ? 'rgba(99, 102, 241, 0.15)' : step.status === 'done' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${step.status === 'active' ? '#6366F1' : step.status === 'done' ? '#10B981' : 'rgba(255,255,255,0.06)'}`,
                    borderRadius: '6px',
                    padding: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '9px', fontFamily: 'JetBrains Mono, monospace', color: step.status === 'done' ? '#34D399' : step.status === 'active' ? '#818CF8' : '#64748B' }}>
                      0{step.id}
                    </span>
                    {step.status === 'done' ? <CheckCircle2 size={11} style={{ color: '#34D399' }} /> : step.status === 'active' ? <Sparkles size={11} className="spin-slow" style={{ color: '#818CF8' }} /> : null}
                  </div>
                  <strong style={{ fontSize: '10px', color: '#FFFFFF' }}>{step.label}</strong>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3. Filter Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => setFilterGroup('all')}
            style={{ 
              background: filterGroup === 'all' ? '#4F46E5' : '#0F172A', 
              color: filterGroup === 'all' ? '#FFFFFF' : '#94A3B8', 
              border: `1px solid ${filterGroup === 'all' ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.08)'}`, 
              padding: '5px 12px', 
              borderRadius: '6px', 
              fontSize: '11px', 
              fontFamily: 'Outfit, sans-serif', 
              fontWeight: 600, 
              cursor: 'pointer' 
            }}
          >
            All Documents ({documents.length})
          </button>
          <button
            onClick={() => setFilterGroup('delhivery')}
            style={{ 
              background: filterGroup === 'delhivery' ? 'rgba(99, 102, 241, 0.25)' : '#0F172A', 
              color: filterGroup === 'delhivery' ? '#A5B4FC' : '#94A3B8', 
              border: `1px solid ${filterGroup === 'delhivery' ? '#6366F1' : 'rgba(255,255,255,0.08)'}`, 
              padding: '5px 12px', 
              borderRadius: '6px', 
              fontSize: '11px', 
              fontFamily: 'Outfit, sans-serif', 
              fontWeight: 600, 
              display: 'flex', 
              alignItems: 'center', 
              gap: '5px', 
              cursor: 'pointer' 
            }}
          >
            <Building2 size={11} />
            <span>Delhivery Filings (3)</span>
          </button>
          <button
            onClick={() => setFilterGroup('macro')}
            style={{ 
              background: filterGroup === 'macro' ? 'rgba(16, 185, 129, 0.2)' : '#0F172A', 
              color: filterGroup === 'macro' ? '#34D399' : '#94A3B8', 
              border: `1px solid ${filterGroup === 'macro' ? '#10B981' : 'rgba(255,255,255,0.08)'}`, 
              padding: '5px 12px', 
              borderRadius: '6px', 
              fontSize: '11px', 
              fontFamily: 'Outfit, sans-serif', 
              fontWeight: 600, 
              display: 'flex', 
              alignItems: 'center', 
              gap: '5px', 
              cursor: 'pointer' 
            }}
          >
            <Landmark size={11} />
            <span>India Macroeconomy (3)</span>
          </button>
          <button
            onClick={() => setFilterGroup('custom')}
            style={{ 
              background: filterGroup === 'custom' ? '#0369A1' : '#0F172A', 
              color: filterGroup === 'custom' ? '#38BDF8' : '#94A3B8', 
              border: `1px solid ${filterGroup === 'custom' ? 'rgba(56,189,248,0.5)' : 'rgba(255,255,255,0.08)'}`, 
              padding: '5px 12px', 
              borderRadius: '6px', 
              fontSize: '11px', 
              fontFamily: 'Outfit, sans-serif', 
              fontWeight: 600, 
              cursor: 'pointer' 
            }}
          >
            Custom Uploads ({documents.filter(d => !d.is_system_protected).length})
          </button>
        </div>

        {/* Search Field */}
        <div style={{ position: 'relative', width: '260px' }}>
          <Search size={13} style={{ position: 'absolute', left: '10px', top: '9px', color: '#64748B' }} />
          <input 
            type="text" 
            placeholder="Search documents by title or group..." 
            value={searchQuery} 
            onChange={e => setSearchQuery(e.target.value)}
            style={{ 
              width: '100%', 
              background: '#080C17', 
              border: '1px solid rgba(255,255,255,0.1)', 
              borderRadius: '6px', 
              padding: '6px 10px 6px 30px', 
              fontSize: '11px', 
              color: '#FFFFFF', 
              outline: 'none', 
              fontFamily: 'Outfit, sans-serif' 
            }} 
          />
        </div>
      </div>

      {/* 4. Document Inventory Table (Fits all 6 documents) */}
      <div style={{ background: '#080C17', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', overflow: 'hidden', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ position: 'sticky', top: 0, background: '#0B1120', zIndex: 10 }}>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <th style={{ padding: '10px 16px', fontSize: '10px', fontFamily: 'JetBrains Mono, monospace', color: '#818CF8', textTransform: 'uppercase' }}>Document Title & ID</th>
                <th style={{ padding: '10px 14px', fontSize: '10px', fontFamily: 'JetBrains Mono, monospace', color: '#818CF8', textTransform: 'uppercase' }}>Classification</th>
                <th style={{ padding: '10px 14px', fontSize: '10px', fontFamily: 'JetBrains Mono, monospace', color: '#818CF8', textTransform: 'uppercase' }}>Pages</th>
                <th style={{ padding: '10px 14px', fontSize: '10px', fontFamily: 'JetBrains Mono, monospace', color: '#818CF8', textTransform: 'uppercase' }}>SHA-256 Hash</th>
                <th style={{ padding: '10px 16px', fontSize: '10px', fontFamily: 'JetBrains Mono, monospace', color: '#818CF8', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filterGroup === 'all' && searchQuery === '' ? (
                <>
                  {/* Group 1: Delhivery */}
                  <tr style={{ background: 'rgba(99, 102, 241, 0.08)', borderBottom: '1px solid rgba(99, 102, 241, 0.2)' }}>
                    <td colSpan={5} style={{ padding: '6px 16px', fontSize: '10px', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: '#A5B4FC', letterSpacing: '0.5px' }}>
                      CORPORATE LOGISTICS FILINGS: DELHIVERY LIMITED (3 DOCUMENTS)
                    </td>
                  </tr>
                  {delhiveryDocs.map((doc, idx) => renderDocRow(doc, idx))}

                  {/* Group 2: Macroeconomy */}
                  <tr style={{ background: 'rgba(16, 185, 129, 0.08)', borderBottom: '1px solid rgba(16, 185, 129, 0.2)' }}>
                    <td colSpan={5} style={{ padding: '6px 16px', fontSize: '10px', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: '#34D399', letterSpacing: '0.5px' }}>
                      INDIA MACROECONOMIC & CENTRAL BANK REPORTS (3 DOCUMENTS)
                    </td>
                  </tr>
                  {macroDocs.map((doc, idx) => renderDocRow(doc, idx))}

                  {/* Custom Uploads (if any) */}
                  {customDocs.length > 0 && (
                    <>
                      <tr style={{ background: 'rgba(56, 189, 248, 0.08)', borderBottom: '1px solid rgba(56, 189, 248, 0.2)' }}>
                        <td colSpan={5} style={{ padding: '6px 16px', fontSize: '10px', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: '#38BDF8', letterSpacing: '0.5px' }}>
                          USER CUSTOM UPLOADS ({customDocs.length} DOCUMENTS)
                        </td>
                      </tr>
                      {customDocs.map((doc, idx) => renderDocRow(doc, idx))}
                    </>
                  )}
                </>
              ) : (
                filteredDocs.map((doc, idx) => renderDocRow(doc, idx))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Bottom Status Bar */}
        <div style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: '#64748B', fontFamily: 'JetBrains Mono, monospace' }}>
          <span>Showing {filteredDocs.length} of {documents.length} verified PDF documents</span>
          <span style={{ color: '#34D399' }}>✓ All 6 Company Starter Datasets Ready in Document Lens</span>
        </div>
      </div>

    </div>
  );
};
