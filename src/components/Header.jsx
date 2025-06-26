import ViewerControls from "./ViewerControls";

const Header = ({
  menuOpen,
  setMenuOpen,
  currentProject,
  firstPerson,
  onToggleFirstPerson,
  onResetCamera,
  onScreenshot,
  onNewProject,
}) => {
  return (
    <header className="header">
      <div className="header-content">
        <button
          className={`hamburger-btn ${menuOpen ? "active" : ""}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <div className="logo">
          <div className="logo-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div>
            <div className="logo-text">
              Critic
              <span className="logo-subtitle">Sell smarter, Show smarter.</span>
            </div>
          </div>
        </div>

        <div className="header-info">
          {currentProject && (
            <div className="current-project">
              <div className="project-indicator"></div>
              <div className="project-details">
                <span className="project-name">{currentProject.name}</span>
                <span className="project-status">Active Project</span>
              </div>
            </div>
          )}
        </div>

        <ViewerControls
          firstPerson={firstPerson}
          onToggleFirstPerson={onToggleFirstPerson}
          onResetCamera={onResetCamera}
          onScreenshot={onScreenshot}
          onNewProject={onNewProject}
        />
      </div>
    </header>
  );
};

export default Header;