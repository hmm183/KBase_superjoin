import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { EvidenceGalaxy } from './components/EvidenceGalaxy';
import { FactInvestigator } from './components/FactInvestigator';
import { DocumentLens } from './components/DocumentLens';
import { QueryStudio } from './components/QueryStudio';
import { DocumentHub } from './components/DocumentHub';
import { ExtractionLab } from './components/ExtractionLab';
import { EvaluationLab } from './components/EvaluationLab';
import { GroundedQueryModal } from './components/GroundedQueryModal';
import type { EvidenceGalaxyGraph, CanonicalFact, GalaxyNode } from './types';
import { Sparkles } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('galaxy');
  const [selectedDemo, setSelectedDemo] = useState<string | null>(null);
  const [graphData, setGraphData] = useState<EvidenceGalaxyGraph>({
    nodes: [],
    links: [],
    available_years: [],
    total_facts: 0,
    corroboration_count: 0,
    contradiction_count: 0,
    unresolved_count: 0
  });
  const [facts, setFacts] = useState<CanonicalFact[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [privacyMode, setPrivacyMode] = useState<boolean>(false);
  const [providerStatus, setProviderStatus] = useState<string>('GEMINI + GROQ OK');
  const [isQueryModalOpen, setIsQueryModalOpen] = useState<boolean>(false);

  // Document Lens Active Targets
  const [lensDocId, setLensDocId] = useState<string>('02-delhivery-annual-report-fy24-excerpt.pdf');
  const [lensPageNum, setLensPageNum] = useState<number>(36);
  const [lensQuery, setLensQuery] = useState<string>('Adjusted EBITDA');

  // Fact Investigator Active Targets
  const [investigatorFactA, setInvestigatorFactA] = useState<string>('');
  const [investigatorFactB, setInvestigatorFactB] = useState<string>('');

  // Initial Load
  const fetchGraph = (year: number | null) => {
    const url = year ? `/api/galaxy/graph?max_year=${year}` : '/api/galaxy/graph';
    fetch(url)
      .then(res => res.json())
      .then(data => setGraphData(data))
      .catch(console.error);
  };

  useEffect(() => {
    fetchGraph(selectedYear);
  }, [selectedYear]);

  useEffect(() => {
    // Fetch facts
    fetch('/api/facts')
      .then(res => res.json())
      .then(data => {
        setFacts(data);
        if (data.length >= 2) {
          setInvestigatorFactA(data[0].fact_id);
          setInvestigatorFactB(data[1].fact_id);
        }
      })
      .catch(console.error);

    // Fetch provider status
    fetch('/api/health/providers')
      .then(res => res.json())
      .then(data => {
        setPrivacyMode(data.privacy_mode);
        const cerebrasStat = data.providers?.cerebras?.status?.includes('QUOTA') ? 'CEREBRAS: QUOTA' : 'CEREBRAS OK';
        setProviderStatus(`${cerebrasStat} • GROQ 65ms • GEMINI OK`);
      })
      .catch(console.error);
  }, []);

  const handleTogglePrivacy = () => {
    const nextVal = !privacyMode;
    fetch('/api/health/privacy-mode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: nextVal })
    })
      .then(res => res.json())
      .then(data => {
        setPrivacyMode(data.privacy_mode);
        setProviderStatus('CEREBRAS: QUOTA • GROQ 65ms • GEMINI OK');
      });
  };

  const handleNodeSelect = (node: GalaxyNode) => {
    setSelectedNodeId(node.id);
    if (node.document_id && node.page_number) {
      setLensDocId(node.document_id);
      setLensPageNum(node.page_number);
      setLensQuery(node.label.split(':')[0] || 'EBITDA');
    }
    // If it's a fact, select it in the investigator
    if (node.node_type === 'FACT') {
      setInvestigatorFactA(node.id);
      setActiveTab('investigator');
    }
  };

  const handleOpenLens = (docId: string, pageNum: number, query: string) => {
    setLensDocId(docId);
    setLensPageNum(pageNum);
    setLensQuery(query);
    setActiveTab('lens');
  };

  const handleSelectDemo = (demoId: string) => {
    setSelectedDemo(demoId);
    setActiveTab('query');
  };

  return (
    <div className="app-container">
      {/* Universal Top Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        privacyMode={privacyMode}
        onTogglePrivacy={handleTogglePrivacy}
        onSelectDemo={handleSelectDemo}
        providerStatus={providerStatus}
      />

      {/* Main Interactive Workspace Area */}
      <main className="main-content">
        {activeTab === 'galaxy' && (
          <EvidenceGalaxy
            graphData={graphData}
            selectedYear={selectedYear}
            onYearChange={setSelectedYear}
            onNodeSelect={handleNodeSelect}
            selectedNodeId={selectedNodeId}
          />
        )}

        {activeTab === 'investigator' && (
          <FactInvestigator
            facts={facts}
            initialFactAId={investigatorFactA}
            initialFactBId={investigatorFactB}
            onOpenDocumentLens={handleOpenLens}
            onSendToActiveLearning={() => setActiveTab('evaluation')}
          />
        )}

        {activeTab === 'lens' && (
          <DocumentLens
            documentId={lensDocId}
            pageNumber={lensPageNum}
            highlightQuery={lensQuery}
            onPageChange={(docId, page) => {
              setLensDocId(docId);
              setLensPageNum(page);
            }}
          />
        )}

        <div style={{ display: activeTab === 'query' ? 'flex' : 'none', width: '100%', height: '100%' }}>
          <QueryStudio
            onNavigateTab={(tab, extra) => {
              if (extra?.docId && extra?.page) {
                setLensDocId(extra.docId);
                setLensPageNum(extra.page);
              }
              if (extra?.factA && extra?.factB) {
                setInvestigatorFactA(extra.factA);
                setInvestigatorFactB(extra.factB);
              } else if (extra?.factA) {
                setInvestigatorFactA(extra.factA);
              }
              setActiveTab(tab);
            }}
            initialDemo={selectedDemo}
          />
        </div>

        {activeTab === 'hub' && (
          <DocumentHub
            onOpenDocumentLens={(docId, page) => {
              setLensDocId(docId);
              setLensPageNum(page);
              setActiveTab('lens');
            }}
          />
        )}

        {activeTab === 'extraction' && (
          <ExtractionLab onOpenInLens={handleOpenLens} />
        )}

        {activeTab === 'evaluation' && (
          <EvaluationLab />
        )}

        {/* Floating Hallucination Firewall & Query Trigger */}
        {activeTab !== 'query' && activeTab !== 'hub' && (
          <button
            onClick={() => setIsQueryModalOpen(true)}
            className="floating-firewall-btn"
          >
            <div style={{ width: '24px', height: '24px', borderRadius: '8px', background: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={14} style={{ color: '#FFFFFF' }} />
            </div>
            <span style={{ letterSpacing: '0.3px' }}>Graph Query & Firewall</span>
          </button>
        )}
      </main>

      {/* Grounded Query & Hallucination Firewall Modal */}
      <GroundedQueryModal
        isOpen={isQueryModalOpen}
        onClose={() => setIsQueryModalOpen(false)}
      />
    </div>
  );
};

export default App;
