import React, { useState, useEffect } from 'react';
import type { ParserDisagreement } from '../types';
import { Layers, CheckCircle, Eye } from 'lucide-react';

interface ExtractionLabProps {
  onOpenInLens: (docId: string, pageNum: number, query: string) => void;
}

export const ExtractionLab: React.FC<ExtractionLabProps> = ({ onOpenInLens }) => {
  const [disagreements, setDisagreements] = useState<ParserDisagreement[]>([]);
  const [selectedDisagreement, setSelectedDisagreement] = useState<ParserDisagreement | null>(null);

  useEffect(() => {
    fetch('/api/disagreements')
      .then(res => res.json())
      .then(data => {
        setDisagreements(data);
        if (data.length > 0) setSelectedDisagreement(data[0]);
      })
      .catch(console.error);
  }, []);

  return (
    <div className="investigator-page">
      {/* Header */}
      <div className="section-header-row">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="brand-badge" style={{ margin: 0 }}>
              Case 4 Benchmark
            </span>
          </div>
          <h2 className="section-title">
            <Layers size={18} />
            <span>Parser Arena</span>
          </h2>
          <p className="section-subtitle">
            Detect disagreements across PDF parsers to catch extraction errors.
          </p>
        </div>
      </div>

      {/* Parser Explanation */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px',
        marginBottom: '4px'
      }}>
        <div style={{ color: 'var(--text-muted)', marginTop: '2px' }}>
          <Layers size={16} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
            Why multi-parser consensus?
          </span>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Financial filings contain multi-tier tables and merged cells. Single parsers regularly produce errors—for instance, OCR can drop decimal marks (reading <strong style={{ color: '#FB7185' }}>₹1,266 Cr</strong> instead of <strong style={{ color: '#34D399' }}>₹126.6 Cr</strong>, a 10x distortion). The Parser Arena runs an ensemble in parallel and flags disagreements as forensic artifacts.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '24px' }}>
        {/* Conflict List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <span style={{ fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', color: '#94A3B8' }}>
            Detected Discrepancies ({disagreements.length})
          </span>
          {disagreements.map(d => (
            <div
              key={d.conflict_id}
              onClick={() => setSelectedDisagreement(d)}
              className="forensic-card"
              style={{
                cursor: 'pointer',
                padding: '16px',
                borderColor: selectedDisagreement?.conflict_id === d.conflict_id ? '#3B82F6' : 'var(--border-subtle)',
                background: selectedDisagreement?.conflict_id === d.conflict_id ? 'rgba(59, 130, 246, 0.12)' : 'var(--bg-card)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span className="brand-badge" style={{ margin: 0, background: 'rgba(244, 63, 94, 0.15)', color: '#FB7185', borderColor: 'rgba(244, 63, 94, 0.3)' }}>
                  {d.disagreement_type}
                </span>
                <span style={{ fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', color: '#94A3B8' }}>Page {d.page_number}</span>
              </div>
              <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#FFFFFF', marginBottom: '8px' }}>{d.cell_or_region}</h4>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#090E1A', padding: '8px 12px', borderRadius: '8px', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px' }}>
                <span style={{ color: '#34D399', fontWeight: 700 }}>{d.parser_a_value}</span>
                <span style={{ color: '#64748B', fontWeight: 800 }}>≠</span>
                <span style={{ color: '#FB7185', fontWeight: 700 }}>{d.parser_b_value}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Selected Conflict Detail & Adjudication View */}
        {selectedDisagreement && (
          <div className="verdict-full-card">
            <div className="verdict-header-row">
              <div>
                <span style={{ fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', color: '#38BDF8', display: 'block', marginBottom: '4px' }}>
                  CONFLICT ID: {selectedDisagreement.conflict_id}
                </span>
                <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '18px', color: '#FFFFFF' }}>{selectedDisagreement.cell_or_region}</h3>
                <p style={{ fontSize: '12px', fontFamily: 'JetBrains Mono, monospace', color: '#64748B', marginTop: '2px' }}>
                  Doc: {selectedDisagreement.document_id} • Page {selectedDisagreement.page_number}
                </p>
              </div>

              <button
                onClick={() => onOpenInLens(selectedDisagreement.document_id, selectedDisagreement.page_number, selectedDisagreement.parser_a_value)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#2563EB',
                  border: '1px solid #1D4ED8',
                  color: '#FFFFFF',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <Eye size={14} />
                <span>View Coordinates in Lens</span>
              </button>
            </div>

            {/* Parser A vs Parser B Display */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ background: '#070B16', padding: '16px 20px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', color: '#10B981', textTransform: 'uppercase' }}>
                  Parser A: {selectedDisagreement.parser_a_name}
                </span>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '24px', fontWeight: 800, color: '#34D399', margin: '6px 0' }}>
                  {selectedDisagreement.parser_a_value}
                </div>
                <span style={{ fontSize: '10px', color: '#64748B', fontFamily: 'JetBrains Mono, monospace' }}>
                  Bounding Box: {JSON.stringify(selectedDisagreement.parser_a_bbox)}
                </span>
              </div>

              <div style={{ background: '#070B16', padding: '16px 20px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', color: '#F43F5E', textTransform: 'uppercase' }}>
                  Parser B: {selectedDisagreement.parser_b_name}
                </span>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '24px', fontWeight: 800, color: '#FB7185', margin: '6px 0' }}>
                  {selectedDisagreement.parser_b_value}
                </div>
                <span style={{ fontSize: '10px', color: '#64748B', fontFamily: 'JetBrains Mono, monospace' }}>
                  Bounding Box: {JSON.stringify(selectedDisagreement.parser_b_bbox)}
                </span>
              </div>
            </div>

            {/* Vision Adjudication Card */}
            <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '14px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle size={18} style={{ color: '#10B981' }} />
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', fontWeight: 800, color: '#34D399', textTransform: 'uppercase' }}>
                    Adjudicated Resolution: {selectedDisagreement.adjudicated_value}
                  </span>
                </div>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: '#34D399', fontWeight: 700 }}>
                  {(selectedDisagreement.adjudication_confidence * 100).toFixed(0)}% Confidence
                </span>
              </div>

              <p style={{ fontSize: '13px', color: '#CBD5E1', lineHeight: '1.6' }}>
                {selectedDisagreement.adjudication_explanation}
              </p>

              <div style={{ fontSize: '11px', color: '#94A3B8', fontFamily: 'JetBrains Mono, monospace', borderTop: '1px solid rgba(16, 185, 129, 0.15)', paddingTop: '10px' }}>
                Adjudication Engine: <span style={{ color: '#FFFFFF' }}>{selectedDisagreement.adjudicated_by}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
