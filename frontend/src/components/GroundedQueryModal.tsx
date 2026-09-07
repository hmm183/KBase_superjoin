import React, { useState } from 'react';
import { Search, ShieldCheck, ShieldAlert, X, Sparkles, CheckCircle2, AlertTriangle } from 'lucide-react';

interface GroundedQueryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GroundedQueryModal: React.FC<GroundedQueryModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    fetch('/api/query/grounded', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    })
      .then(res => res.json())
      .then(data => {
        setResult(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-container">
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'transparent',
            border: 'none',
            color: '#94A3B8',
            cursor: 'pointer',
            padding: '6px'
          }}
        >
          <X size={20} />
        </button>

        <div>
          <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '18px', fontWeight: 700, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={20} style={{ color: '#818CF8' }} />
            <span>Graph-Grounded Query & Hallucination Firewall</span>
          </h3>
          <p style={{ fontSize: '12px', color: '#94A3B8', marginTop: '4px' }}>
            Questions are answered strictly from Neo4j evidence nodes. The Hallucination Firewall inspects every sentence claim.
          </p>
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="e.g. What was Delhivery EBITDA in FY24 compared to projections?"
            style={{
              flex: 1,
              background: '#070B16',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '12px',
              padding: '12px 16px',
              fontSize: '13px',
              fontFamily: 'JetBrains Mono, monospace',
              color: '#FFFFFF',
              outline: 'none'
            }}
          />
          <button
            type="submit"
            disabled={loading}
            className="play-timeline-btn"
            style={{
              background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
              border: 'none',
              padding: '0 20px',
              fontSize: '13px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Search size={15} />
            <span>{loading ? 'Synthesizing...' : 'Query Graph'}</span>
          </button>
        </form>

        {/* Results with Hallucination Firewall Breakdown */}
        {result && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '420px', overflowY: 'auto', paddingRight: '6px' }}>
            {/* Grounding Meter Banner */}
            <div style={{
              background: result.firewall.firewall_pass ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
              border: `1px solid ${result.firewall.firewall_pass ? 'rgba(16, 185, 129, 0.35)' : 'rgba(245, 158, 11, 0.35)'}`,
              borderRadius: '12px',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {result.firewall.firewall_pass ? (
                  <ShieldCheck size={28} style={{ color: '#10B981' }} />
                ) : (
                  <ShieldAlert size={28} style={{ color: '#F59E0B' }} />
                )}
                <div>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', fontWeight: 800, color: result.firewall.firewall_pass ? '#34D399' : '#FCD34D' }}>
                    Hallucination Firewall: {result.firewall.firewall_pass ? 'PASSED (STRICT EVIDENCE)' : 'FLAGGED (PARTIAL GROUNDING)'}
                  </span>
                  <p style={{ fontSize: '11px', color: '#CBD5E1', marginTop: '2px' }}>
                    {result.firewall.verified_claims} of {result.firewall.total_claims} claims verified against coordinate evidence.
                  </p>
                </div>
              </div>
              <div style={{ textAlign: 'right', fontFamily: 'JetBrains Mono, monospace' }}>
                <span style={{ fontSize: '24px', fontWeight: 900, color: '#FFFFFF' }}>
                  {(result.firewall.grounding_score * 100).toFixed(1)}%
                </span>
                <span style={{ display: 'block', fontSize: '10px', color: '#94A3B8' }}>GROUNDING SCORE</span>
              </div>
            </div>

            {/* Generated Raw Answer */}
            <div style={{ background: '#070B16', padding: '16px 20px', borderRadius: '12px', border: '1px solid var(--border-subtle)', fontSize: '13px', lineHeight: '1.6', color: '#E2E8F0' }}>
              {result.raw_answer}
            </div>

            {/* Sentence by Sentence Verification Trace */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', color: '#94A3B8' }}>
                Sentence Claim Verification Breakdown
              </span>
              {result.firewall.claims_breakdown.map((claim: any) => (
                <div
                  key={claim.claim_index}
                  style={{
                    background: claim.status === 'VERIFIED_GROUNDED' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(244, 63, 94, 0.1)',
                    border: `1px solid ${claim.status === 'VERIFIED_GROUNDED' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.3)'}`,
                    borderRadius: '8px',
                    padding: '10px 14px',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px'
                  }}
                >
                  {claim.status === 'VERIFIED_GROUNDED' ? (
                    <CheckCircle2 size={16} style={{ color: '#10B981', marginTop: '2px', flexShrink: 0 }} />
                  ) : (
                    <AlertTriangle size={16} style={{ color: '#F43F5E', marginTop: '2px', flexShrink: 0 }} />
                  )}
                  <div style={{ flex: 1 }}>
                    <span style={{ color: '#F8FAFC' }}>{claim.text}</span>
                    {claim.citation && (
                      <span className="brand-badge" style={{ marginLeft: '8px', color: '#818CF8', borderColor: 'rgba(99, 102, 241, 0.4)' }}>
                        {claim.citation}
                      </span>
                    )}
                    {claim.flag_reason && (
                      <p style={{ fontSize: '10px', color: '#FB7185', marginTop: '4px', fontFamily: 'JetBrains Mono, monospace' }}>
                        ⚠️ {claim.flag_reason}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
