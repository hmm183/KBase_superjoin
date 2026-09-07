import React from 'react';
import { 
  Orbit, 
  Layers, 
  GitCompare, 
  FileSearch, 
  FlaskConical, 
  ShieldCheck, 
  ShieldAlert, 
  Activity,
  Sparkles
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  privacyMode: boolean;
  onTogglePrivacy: () => void;
  onSelectDemo?: (demoId: string) => void;
  providerStatus: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  privacyMode,
  onTogglePrivacy,
  providerStatus
}) => {
  return (
    <header className="top-navbar">
      {/* Brand Identity */}
      <div className="brand-section">
        <div className="brand-logo-glow">
          <div className="brand-logo-inner">
            <Orbit size={20} className="spin-slow" />
          </div>
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span className="brand-title">EVIDENCE GALAXY</span>
            <span className="brand-badge">Graph Intelligence</span>
          </div>
          <p className="brand-subtitle">Multimodal Temporal Knowledge & Verification Layer</p>
        </div>
      </div>

      {/* View Switcher Pills */}
      <nav className="nav-pills-container">
        <button
          onClick={() => setActiveTab('galaxy')}
          className={`nav-pill-btn ${activeTab === 'galaxy' ? 'active' : ''}`}
        >
          <Orbit size={15} />
          <span>Universe</span>
        </button>

        <button
          onClick={() => setActiveTab('investigator')}
          className={`nav-pill-btn ${activeTab === 'investigator' ? 'active' : ''}`}
        >
          <GitCompare size={15} />
          <span>Investigator</span>
        </button>

        <button
          onClick={() => setActiveTab('lens')}
          className={`nav-pill-btn ${activeTab === 'lens' ? 'active' : ''}`}
        >
          <FileSearch size={15} />
          <span>Document Lens</span>
        </button>

        <button
          onClick={() => setActiveTab('query')}
          className={`nav-pill-btn ${activeTab === 'query' ? 'active' : ''}`}
        >
          <Sparkles size={15} style={{ color: activeTab === 'query' ? '#FFFFFF' : '#818CF8' }} />
          <span>Query & Demos</span>
        </button>

        <button
          onClick={() => setActiveTab('hub')}
          className={`nav-pill-btn ${activeTab === 'hub' ? 'active' : ''}`}
        >
          <Layers size={15} style={{ color: activeTab === 'hub' ? '#FFFFFF' : '#38BDF8' }} />
          <span>Document Hub</span>
        </button>

        <button
          onClick={() => setActiveTab('extraction')}
          className={`nav-pill-btn ${activeTab === 'extraction' ? 'active' : ''}`}
        >
          <Layers size={15} />
          <span>Parser Arena</span>
        </button>

        <button
          onClick={() => setActiveTab('evaluation')}
          className={`nav-pill-btn ${activeTab === 'evaluation' ? 'active' : ''}`}
        >
          <FlaskConical size={15} />
          <span>ML & Active Lab</span>
        </button>
      </nav>

      {/* Right Action Tools */}
      <div className="right-actions">
        {/* Privacy Mode Toggle */}
        <button
          onClick={onTogglePrivacy}
          className={`privacy-toggle-btn ${privacyMode ? 'local' : 'cloud'}`}
          title="Toggle air-gapped local mode"
        >
          {privacyMode ? (
            <>
              <ShieldCheck size={14} style={{ color: '#34D399' }} />
              <span>Air-Gapped: Local</span>
            </>
          ) : (
            <>
              <ShieldAlert size={14} style={{ color: '#F59E0B' }} />
              <span>Cloud Gateway</span>
            </>
          )}
        </button>

        {/* Health Status */}
        <div className="health-status-badge">
          <Activity size={13} style={{ color: '#10B981' }} />
          <span>{providerStatus}</span>
        </div>
      </div>
    </header>
  );
};
