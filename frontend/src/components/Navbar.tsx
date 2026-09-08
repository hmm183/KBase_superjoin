import React from 'react';
import { 
  Orbit, 
  Layers, 
  GitCompare, 
  FileSearch, 
  FlaskConical, 
  Activity,
  Sparkles,
  FolderOpen
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  privacyMode?: boolean;
  onTogglePrivacy?: () => void;
  onSelectDemo?: (demoId: string) => void;
  providerStatus: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  providerStatus
}) => {
  return (
    <header className="top-navbar">
      {/* Brand Identity */}
      <div className="brand-section">
        <div className="brand-logo-glow">
          <div className="brand-logo-inner">
            <Orbit size={16} />
          </div>
        </div>
        <div>
          <span className="brand-title">Evidence Galaxy</span>
          <p className="brand-subtitle">Document Verification Platform</p>
        </div>
      </div>

      {/* View Switcher Pills */}
      <nav className="nav-pills-container">
        <button
          onClick={() => setActiveTab('galaxy')}
          className={`nav-pill-btn ${activeTab === 'galaxy' ? 'active' : ''}`}
        >
          <Orbit size={14} />
          <span>Universe</span>
        </button>

        <button
          onClick={() => setActiveTab('investigator')}
          className={`nav-pill-btn ${activeTab === 'investigator' ? 'active' : ''}`}
        >
          <GitCompare size={14} />
          <span>Investigator</span>
        </button>

        <button
          onClick={() => setActiveTab('lens')}
          className={`nav-pill-btn ${activeTab === 'lens' ? 'active' : ''}`}
        >
          <FileSearch size={14} />
          <span>Document Lens</span>
        </button>

        <button
          onClick={() => setActiveTab('query')}
          className={`nav-pill-btn ${activeTab === 'query' ? 'active' : ''}`}
        >
          <Sparkles size={14} />
          <span>Query Studio</span>
        </button>

        <button
          onClick={() => setActiveTab('hub')}
          className={`nav-pill-btn ${activeTab === 'hub' ? 'active' : ''}`}
        >
          <FolderOpen size={14} />
          <span>Document Hub</span>
        </button>

        <button
          onClick={() => setActiveTab('extraction')}
          className={`nav-pill-btn ${activeTab === 'extraction' ? 'active' : ''}`}
        >
          <Layers size={14} />
          <span>Parser Arena</span>
        </button>

        <button
          onClick={() => setActiveTab('evaluation')}
          className={`nav-pill-btn ${activeTab === 'evaluation' ? 'active' : ''}`}
        >
          <FlaskConical size={14} />
          <span>Evaluation</span>
        </button>
      </nav>

      {/* Right Action Tools */}
      <div className="right-actions">
        <div className="health-status-badge">
          <Activity size={12} />
          <span>{providerStatus}</span>
        </div>
      </div>
    </header>
  );
};
