import React, { useState, useEffect } from 'react';
import type { 
  CanonicalFact, 
  PairwiseRelation 
} from '../types';
import { 
  GitCompare, 
  HelpCircle, 
  Compass, 
  Send,
  Eye,
  AlertTriangle
} from 'lucide-react';

interface FactInvestigatorProps {
  facts: CanonicalFact[];
  initialFactAId?: string;
  initialFactBId?: string;
  onOpenDocumentLens: (docId: string, pageNum: number, query: string) => void;
  onSendToActiveLearning: (factAId: string, factBId: string) => void;
}

export const FactInvestigator: React.FC<FactInvestigatorProps> = ({
  facts,
  initialFactAId,
  initialFactBId,
  onOpenDocumentLens,
  onSendToActiveLearning
}) => {
  const [factAId, setFactAId] = useState<string>(initialFactAId || (facts[0]?.fact_id || ''));
  const [factBId, setFactBId] = useState<string>(initialFactBId || (facts[1]?.fact_id || ''));
  const [relation, setRelation] = useState<PairwiseRelation | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initialFactAId) setFactAId(initialFactAId);
    if (initialFactBId) setFactBId(initialFactBId);
  }, [initialFactAId, initialFactBId]);

  useEffect(() => {
    if (!factAId || !factBId || factAId === factBId) {
      setRelation(null);
      setErrorMsg(null);
      return;
    }

    fetch('/api/facts/compare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fact_a_id: factAId, fact_b_id: factBId })
    })
      .then(async res => {
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.detail || `Comparison API returned HTTP ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        if (data && Array.isArray(data.hypotheses)) {
          setRelation(data);
          setErrorMsg(null);
        }
      })
      .catch(err => {
        console.error('Comparison failed:', err);
        setRelation(null);
        setErrorMsg(err.message || 'Fact comparison failed. Please verify that both facts exist in the active graph.');
      });
  }, [factAId, factBId]);

  const factA = facts.find(f => f.fact_id === factAId) || facts[0];
  const factB = facts.find(f => f.fact_id === factBId) || facts[1];

  const getClassificationBadge = (cls: string) => {
    switch (cls) {
      case 'CORROBORATES':
        return <span className="classification-badge corroborates">CORROBORATES (100% FACTUAL MATCH)</span>;
      case 'GENUINE_CONTRADICTION':
      case 'LIKELY_CONTRADICTION':
        return <span className="classification-badge contradiction">GENUINE CONTRADICTION (CLASH)</span>;
      case 'DEFINITION_MISMATCH':
        return <span className="classification-badge definition">DEFINITION MISMATCH</span>;
      case 'FORECAST_ACTUAL_MISMATCH':
        return <span className="classification-badge forecast">FORECAST VS ACTUAL</span>;
      default:
        return <span className="classification-badge definition">{cls}</span>;
    }
  };

  return (
    <div className="investigator-page">
      {/* Top Header & Selectors */}
      <div className="section-header-row">
        <div>
          <h2 className="section-title">
            <GitCompare size={18} />
            <span>Fact Comparison</span>
          </h2>
          <p className="section-subtitle">
            Compare two extracted facts and see how they relate.
          </p>
        </div>

        {/* Fact Selector Dropdowns */}
        <div className="fact-selectors-bar">
          <select
            value={factAId}
            onChange={e => setFactAId(e.target.value)}
            className="fact-select"
          >
            {facts.map(f => (
              <option key={f.fact_id} value={f.fact_id}>
                Fact A: {f.subject.canonical_name} - {f.predicate.name} ({f.value.raw_text})
              </option>
            ))}
          </select>

          <span style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '12px' }}>vs</span>

          <select
            value={factBId}
            onChange={e => setFactBId(e.target.value)}
            className="fact-select"
          >
            {facts.map(f => (
              <option key={f.fact_id} value={f.fact_id}>
                Fact B: {f.subject.canonical_name} - {f.predicate.name} ({f.value.raw_text})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Error Alert Banner */}
      {errorMsg && (
        <div style={{
          padding: '12px 16px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '8px',
          color: '#F87171',
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <AlertTriangle size={16} />
          <span><strong>Investigation Error:</strong> {errorMsg}</span>
        </div>
      )}

      {/* Case Presets */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        flexWrap: 'wrap'
      }}>
        {[
          { 
            label: 'Case 1 — CPI Corroboration', 
            resolve: () => {
              const cpiFacts = facts.filter(f => f.fact_id.includes('cpi') || f.predicate.name.toLowerCase().includes('cpi'));
              return [cpiFacts[0]?.fact_id || facts[0]?.fact_id || '', cpiFacts[1]?.fact_id || facts[1]?.fact_id || ''];
            },
            color: '#10B981' 
          },
          { 
            label: 'Case 2 — Forecast / Target Divergence', 
            resolve: () => {
              const proj = facts.find(f => f.temporal.observation_type === 'projection' || f.fact_id.includes('proj')) || facts[0];
              const other = facts.find(f => f.fact_id !== proj?.fact_id) || facts[1];
              return [proj?.fact_id || '', other?.fact_id || ''];
            },
            color: '#EF4444' 
          },
          { 
            label: 'Case 3 — Revenue Temporal Period', 
            resolve: () => {
              const revFacts = facts.filter(f => f.predicate.name.toLowerCase().includes('revenue') || f.fact_id.includes('rev'));
              return [revFacts[0]?.fact_id || facts[0]?.fact_id || '', revFacts[1]?.fact_id || facts[1]?.fact_id || ''];
            },
            color: '#3B82F6' 
          },
          { 
            label: 'Case 4 — Definition / Metric Variance', 
            resolve: () => {
              const ebitda = facts.find(f => f.predicate.name.toLowerCase().includes('ebitda') || f.fact_id.includes('ebitda')) || facts[0];
              const diff = facts.find(f => f.fact_id !== ebitda?.fact_id && (f.predicate.name.toLowerCase().includes('profit') || f.predicate.name.toLowerCase().includes('ebitda'))) || facts[1];
              return [ebitda?.fact_id || '', diff?.fact_id || ''];
            },
            color: '#F59E0B' 
          }
        ].map((c, i) => {
          const [targetA, targetB] = c.resolve();
          const isSelected = factAId === targetA && factBId === targetB;
          return (
            <button
              key={i}
              onClick={() => {
                if (targetA && targetB) {
                  setFactAId(targetA);
                  setFactBId(targetB);
                }
              }}
              style={{
                background: isSelected ? 'var(--bg-surface-elevated)' : 'var(--bg-card)',
                border: `1px solid ${isSelected ? c.color : 'var(--border-subtle)'}`,
                color: isSelected ? '#FAFAFA' : 'var(--text-secondary)',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: isSelected ? 600 : 500,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.15s ease'
              }}
            >
              <span style={{ 
                width: '7px', 
                height: '7px', 
                borderRadius: '50%', 
                background: c.color
              }} />
              <span>{c.label}</span>
            </button>
          );
        })}
      </div>

      {/* Dual-Pane Forensic Comparison Cards */}
      <div className="forensic-split-grid">
        {/* Fact A Pane */}
        {factA && (
          <div className="forensic-card">
            <div className="forensic-card-top">
              <span className="brand-badge" style={{ margin: 0 }}>
                Fact A
              </span>
              <button
                onClick={() => onOpenDocumentLens(factA.provenance.document_id, factA.provenance.page_number, factA.predicate.name)}
                className="lens-inspect-btn"
              >
                <Eye size={14} />
                <span>Inspect in Lens</span>
              </button>
            </div>

            <div>
              <span style={{ fontSize: '11px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Entity & Metric
              </span>
              <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '18px', color: '#FFFFFF', marginTop: '2px' }}>
                {factA.subject.canonical_name}
              </h3>
              <p style={{ fontSize: '13px', color: '#818CF8', fontWeight: 600 }}>{factA.predicate.name}</p>
            </div>

            <div className="value-highlight-box">
              <div>
                <span style={{ fontSize: '11px', color: '#94A3B8' }}>Raw Recorded Value</span>
                <div className="value-raw-large emerald">{factA.value.raw_text}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '11px', color: '#94A3B8' }}>Normalized Metric</span>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', color: '#CBD5E1' }}>
                  {factA.value.normalized_value} ({factA.value.unit})
                </div>
              </div>
            </div>

            <div className="metadata-2x2-grid">
              <div className="metadata-tile">
                <span className="metadata-tile-label">Period / Vintage</span>
                <span className="metadata-tile-value">{factA.temporal.reference_period} ({factA.temporal.data_vintage})</span>
              </div>
              <div className="metadata-tile">
                <span className="metadata-tile-label">Observation Type</span>
                <span className="metadata-tile-value" style={{ textTransform: 'uppercase' }}>{factA.temporal.observation_type}</span>
              </div>
              <div className="metadata-tile">
                <span className="metadata-tile-label">Accounting Scope</span>
                <span className="metadata-tile-value">{factA.scope_accounting}</span>
              </div>
              <div className="metadata-tile">
                <span className="metadata-tile-label">Document & Page</span>
                <span className="metadata-tile-value">Page {factA.provenance.page_number}</span>
              </div>
            </div>

            <div className="snippet-quote-box">
              "{factA.provenance.raw_snippet}"
            </div>
          </div>
        )}

        {/* Fact B Pane */}
        {factB && (
          <div className="forensic-card">
            <div className="forensic-card-top">
              <span className="brand-badge" style={{ margin: 0 }}>
                Fact B
              </span>
              <button
                onClick={() => onOpenDocumentLens(factB.provenance.document_id, factB.provenance.page_number, factB.predicate.name)}
                className="lens-inspect-btn"
                style={{ color: '#C084FC' }}
              >
                <Eye size={14} />
                <span>Inspect in Lens</span>
              </button>
            </div>

            <div>
              <span style={{ fontSize: '11px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Entity & Metric
              </span>
              <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '18px', color: '#FFFFFF', marginTop: '2px' }}>
                {factB.subject.canonical_name}
              </h3>
              <p style={{ fontSize: '13px', color: '#C084FC', fontWeight: 600 }}>{factB.predicate.name}</p>
            </div>

            <div className="value-highlight-box">
              <div>
                <span style={{ fontSize: '11px', color: '#94A3B8' }}>Raw Recorded Value</span>
                <div className={`value-raw-large ${factB.value.normalized_value === factA?.value.normalized_value ? 'emerald' : 'red'}`}>
                  {factB.value.raw_text}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '11px', color: '#94A3B8' }}>Normalized Metric</span>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', color: '#CBD5E1' }}>
                  {factB.value.normalized_value} ({factB.value.unit})
                </div>
              </div>
            </div>

            <div className="metadata-2x2-grid">
              <div className="metadata-tile">
                <span className="metadata-tile-label">Period / Vintage</span>
                <span className="metadata-tile-value">{factB.temporal.reference_period} ({factB.temporal.data_vintage})</span>
              </div>
              <div className="metadata-tile">
                <span className="metadata-tile-label">Observation Type</span>
                <span className="metadata-tile-value" style={{ textTransform: 'uppercase' }}>{factB.temporal.observation_type}</span>
              </div>
              <div className="metadata-tile">
                <span className="metadata-tile-label">Accounting Scope</span>
                <span className="metadata-tile-value">{factB.scope_accounting}</span>
              </div>
              <div className="metadata-tile">
                <span className="metadata-tile-label">Document & Page</span>
                <span className="metadata-tile-value">Page {factB.provenance.page_number}</span>
              </div>
            </div>

            <div className="snippet-quote-box" style={{ borderLeftColor: '#A855F7', background: 'rgba(168, 85, 247, 0.06)' }}>
              "{factB.provenance.raw_snippet}"
            </div>
          </div>
        )}
      </div>

      {/* Adjudication Verdict & Hypothesis Tournament */}
      {relation && (
        <div className="verdict-full-card">
          <div className="verdict-header-row">
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                Classification Result
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px' }}>
                {getClassificationBadge(relation.classification)}
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Confidence: <strong style={{ color: 'var(--text-primary)' }}>{(relation.confidence * 100).toFixed(1)}%</strong>
                </span>
              </div>
            </div>

            <button
              onClick={() => onSendToActiveLearning(factAId, factBId)}
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
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
                transition: 'all 0.15s ease'
              }}
            >
              <Send size={13} />
              <span>Send to Active Learning Queue</span>
            </button>
          </div>

          {/* Hypothesis Tournament */}
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Compass size={15} />
              <span>Ranked Explanations</span>
            </h4>
            <div className="hypotheses-grid">
              {(relation.hypotheses || []).map(hyp => (
                <div key={hyp.hypothesis_id} className={`hypothesis-tile ${hyp.is_primary ? 'primary' : ''}`}>
                  <div className="hypothesis-header">
                    <span className="brand-badge" style={{ margin: 0, background: 'rgba(255, 255, 255, 0.08)' }}>
                      {hyp.code}: {hyp.title}
                    </span>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>
                      {(hyp.probability * 100).toFixed(1)}%
                    </span>
                  </div>
                  <p style={{ fontSize: '12px', color: '#CBD5E1', lineHeight: '1.4' }}>{hyp.description}</p>
                  {hyp.supporting_factors && hyp.supporting_factors.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '6px' }}>
                      {hyp.supporting_factors.map((f, i) => (
                        <div key={i} style={{ fontSize: '11px', color: '#94A3B8', fontFamily: 'JetBrains Mono, monospace' }}>
                          <span style={{ color: '#10B981', marginRight: '4px' }}>✓</span> {f}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* What Would Change My Mind Panel */}
          {relation.what_would_change_my_mind && relation.what_would_change_my_mind.length > 0 && (
            <div className="mind-change-panel">
              <h4 style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '0.3px' }}>
                <HelpCircle size={14} />
                <span>Ambiguity Conditions</span>
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(relation.what_would_change_my_mind || []).map(crit => (
                  <div key={crit.criterion_id} style={{ fontSize: '12px', background: 'rgba(0,0,0,0.25)', padding: '10px 14px', borderRadius: '8px' }}>
                    <span style={{ color: '#FFFFFF', fontWeight: 600 }}>{crit.condition_description}</span>
                    <p style={{ fontSize: '11px', color: '#FCD34D', marginTop: '2px' }}>{crit.impact_direction}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
