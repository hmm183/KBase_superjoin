import React, { useState, useEffect } from 'react';
import type { 
  EvaluationReport, 
  ActiveLearningItem 
} from '../types';
import { 
  FlaskConical, 
  CheckCircle2, 
  RefreshCw, 
  BarChart3
} from 'lucide-react';

export const EvaluationLab: React.FC = () => {
  const [report, setReport] = useState<EvaluationReport | null>(null);
  const [queue, setQueue] = useState<ActiveLearningItem[]>([]);
  const [retraining, setRetraining] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'metrics' | 'active_learning' | 'error_taxonomy'>('metrics');

  const fetchEval = () => {
    fetch('/api/ml/eval')
      .then(res => res.json())
      .then(data => setReport(data))
      .catch(console.error);

    fetch('/api/ml/active-learning/queue')
      .then(res => res.json())
      .then(data => setQueue(data))
      .catch(console.error);
  };

  useEffect(() => {
    fetchEval();
  }, []);

  const handleAdjudicate = (queueId: string, label: string) => {
    fetch('/api/ml/active-learning/adjudicate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        queue_id: queueId,
        human_label: label,
        notes: `Human labeled as ${label} in Evaluation Lab UI`
      })
    })
      .then(res => res.json())
      .then(() => {
        setQueue(prev => prev.filter(item => item.queue_id !== queueId));
      })
      .catch(console.error);
  };

  const handleRetrain = () => {
    setRetraining(true);
    fetch('/api/ml/active-learning/retrain', { method: 'POST' })
      .then(res => res.json())
      .then(() => {
        setRetraining(false);
        fetchEval();
      })
      .catch(() => setRetraining(false));
  };

  return (
    <div className="investigator-page">
      {/* Top Header */}
      <div className="section-header-row">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <FlaskConical size={24} style={{ color: '#818CF8' }} />
            <h2 className="section-title">ML Lifecycle, Evaluation & Active Learning Lab</h2>
            <span className="brand-badge">
              Model: {report?.model_version || 'v1.0'}
            </span>
          </div>
          <p className="section-subtitle">
            Rigorous evaluation suite, hand-adjudicated gold benchmarks, uncertainty triage, and honest failure analysis.
          </p>
        </div>

        {/* Retrain Action */}
        <button
          onClick={handleRetrain}
          disabled={retraining}
          className="play-timeline-btn"
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            background: 'linear-gradient(135deg, #059669, #0D9488)', 
            border: 'none', 
            padding: '10px 18px',
            boxShadow: '0 4px 16px rgba(16, 185, 129, 0.3)'
          }}
        >
          <RefreshCw size={14} className={retraining ? 'spin-slow' : ''} />
          <span>{retraining ? 'Retraining LightGBM...' : 'Trigger Incremental Retraining'}</span>
        </button>
      </div>

      {/* Sub-Tabs */}
      <div className="nav-pills-container" style={{ width: 'fit-content' }}>
        <button
          onClick={() => setActiveTab('metrics')}
          className={`nav-pill-btn ${activeTab === 'metrics' ? 'active' : ''}`}
        >
          Benchmarks & Metrics
        </button>
        <button
          onClick={() => setActiveTab('active_learning')}
          className={`nav-pill-btn ${activeTab === 'active_learning' ? 'active' : ''}`}
        >
          <span>Active Learning Queue</span>
          {queue.length > 0 && (
            <span style={{ background: '#F59E0B', color: '#000', borderRadius: '50%', width: '16px', height: '16px', fontSize: '10px', fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              {queue.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('error_taxonomy')}
          className={`nav-pill-btn ${activeTab === 'error_taxonomy' ? 'active' : ''}`}
        >
          Error Taxonomy & Mitigations
        </button>
      </div>

      {/* 1. Metrics & Confusion Matrix */}
      {activeTab === 'metrics' && report && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Key Stat Cards */}
          <div className="metrics-summary-grid">
            <div className="metric-stat-card">
              <span className="metric-stat-title">Overall Accuracy</span>
              <div className="metric-stat-number" style={{ color: '#FFFFFF' }}>
                {(report.overall_accuracy * 100).toFixed(1)}%
              </div>
            </div>
            <div className="metric-stat-card">
              <span className="metric-stat-title">Macro F1 Score</span>
              <div className="metric-stat-number" style={{ color: '#818CF8' }}>
                {(report.macro_f1 * 100).toFixed(1)}%
              </div>
            </div>
            <div className="metric-stat-card">
              <span className="metric-stat-title">Entity Resolution F1</span>
              <div className="metric-stat-number" style={{ color: '#C084FC' }}>
                {(report.entity_resolution_f1 * 100).toFixed(1)}%
              </div>
            </div>
            <div className="metric-stat-card">
              <span className="metric-stat-title">Evidence Grounding</span>
              <div className="metric-stat-number" style={{ color: '#34D399' }}>
                {(report.evidence_grounding_rate * 100).toFixed(1)}%
              </div>
            </div>
            <div className="metric-stat-card">
              <span className="metric-stat-title">Hallucination Rate</span>
              <div className="metric-stat-number" style={{ color: '#F59E0B' }}>
                {(report.hallucination_rate * 100).toFixed(1)}%
              </div>
            </div>
            <div className="metric-stat-card">
              <span className="metric-stat-title">Gold Test Set</span>
              <div className="metric-stat-number" style={{ color: '#22D3EE' }}>
                5 Verified
              </div>
            </div>
          </div>

          {/* Per-Class F1 Breakdown */}
          <div className="verdict-full-card">
            <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '15px', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <BarChart3 size={16} style={{ color: '#818CF8' }} />
              <span>12-Class Taxonomy Performance Breakdown</span>
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              {Object.entries(report.per_class_f1).map(([className, score]) => (
                <div key={className} style={{ background: '#090E1A', padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', color: '#CBD5E1', maxWidth: '170px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {className}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '60px', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${score * 100}%`, height: '100%', background: 'linear-gradient(90deg, #6366F1, #10B981)', borderRadius: '3px' }} />
                    </div>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', fontWeight: 700, color: '#FFFFFF', width: '36px', textAlign: 'right' }}>
                      {(score * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. Active Learning Triage Queue */}
      {activeTab === 'active_learning' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ fontSize: '12px', color: '#94A3B8' }}>
            Low-margin / high-entropy fact pairs flagged for human dispute adjudication. Labeling pairs feeds the retraining set.
          </p>

          {queue.length === 0 ? (
            <div className="forensic-card" style={{ textAlign: 'center', padding: '48px', alignItems: 'center' }}>
              <CheckCircle2 size={40} style={{ color: '#10B981', marginBottom: '12px' }} />
              <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '18px', color: '#FFFFFF' }}>
                Active Learning Queue Clear
              </h3>
              <p style={{ fontSize: '13px', color: '#94A3B8', maxWidth: '440px', marginTop: '4px' }}>
                All candidate edge cases have been resolved. Click "Trigger Incremental Retraining" above to incorporate fresh labels into model version v1.1.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {queue.map(item => (
                <div key={item.queue_id} className="forensic-card">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span className="brand-badge" style={{ margin: 0, background: 'rgba(245, 158, 11, 0.15)', color: '#FCD34D', borderColor: 'rgba(245, 158, 11, 0.3)' }}>
                        Uncertainty: {(item.uncertainty_score * 100).toFixed(0)}%
                      </span>
                      <span style={{ fontSize: '12px', color: '#94A3B8' }}>
                        Model Prediction: <strong style={{ color: '#FFFFFF' }}>{item.predicted_class}</strong> ({(item.confidence * 100).toFixed(0)}% conf)
                      </span>
                    </div>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: '#64748B' }}>{item.queue_id}</span>
                  </div>

                  {/* Fact Pair Display */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', background: '#090E1A', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                    <div>
                      <span style={{ fontSize: '10px', color: '#818CF8', fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase' }}>Fact A</span>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: '#FFFFFF', marginTop: '4px' }}>{item.fact_a_label}</p>
                    </div>
                    <div>
                      <span style={{ fontSize: '10px', color: '#C084FC', fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase' }}>Fact B</span>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: '#FFFFFF', marginTop: '4px' }}>{item.fact_b_label}</p>
                    </div>
                  </div>

                  {/* Adjudication Action Buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', paddingTop: '6px' }}>
                    <span style={{ fontSize: '12px', color: '#94A3B8', fontFamily: 'JetBrains Mono, monospace', marginRight: '8px' }}>
                      Adjudicate as:
                    </span>
                    <button
                      onClick={() => handleAdjudicate(item.queue_id, 'CORROBORATES')}
                      className="demo-chip-btn"
                      style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.35)', color: '#34D399', padding: '6px 12px', borderRadius: '8px' }}
                    >
                      Corroborates
                    </button>
                    <button
                      onClick={() => handleAdjudicate(item.queue_id, 'CONTEXTUAL_DIFFERENCE')}
                      className="demo-chip-btn"
                      style={{ background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.35)', color: '#A5B4FC', padding: '6px 12px', borderRadius: '8px' }}
                    >
                      Contextual Difference
                    </button>
                    <button
                      onClick={() => handleAdjudicate(item.queue_id, 'SCOPE_MISMATCH')}
                      className="demo-chip-btn"
                      style={{ background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.35)', color: '#FCD34D', padding: '6px 12px', borderRadius: '8px' }}
                    >
                      Scope Mismatch
                    </button>
                    <button
                      onClick={() => handleAdjudicate(item.queue_id, 'GENUINE_CONTRADICTION')}
                      className="demo-chip-btn"
                      style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.35)', color: '#FB7185', padding: '6px 12px', borderRadius: '8px' }}
                    >
                      Genuine Contradiction
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. Error Taxonomy & Mitigations */}
      {activeTab === 'error_taxonomy' && report && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {Object.entries(report.error_taxonomy).map(([errKey, errData]) => (
            <div key={errKey} className="forensic-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h4 style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', fontWeight: 700, color: '#FFFFFF', textTransform: 'uppercase' }}>
                  {errKey.replace(/_/g, ' ')}
                </h4>
                <span className="brand-badge" style={{ margin: 0, background: 'rgba(244, 63, 94, 0.15)', color: '#FB7185' }}>
                  Incidence: {errData.count}
                </span>
              </div>
              <p style={{ fontSize: '13px', color: '#CBD5E1', lineHeight: '1.5' }}>{errData.description}</p>
              <div style={{ background: '#090E1A', padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
                <span style={{ color: '#10B981', fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, display: 'block', marginBottom: '2px' }}>
                  Architectural Mitigation:
                </span>
                <span style={{ color: '#94A3B8', fontSize: '12px' }}>{errData.mitigation}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
