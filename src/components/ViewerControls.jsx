import React from 'react';

const ViewerControls = ({ 
  firstPerson, 
  onToggleFirstPerson, 
  onResetCamera, 
  onScreenshot,
  onSavePosition,
  onTogglePoints,
  hasModel,
  savedPointsCount
}) => {
  return (
    <div className="viewer-controls">
      <button
        className="control-btn new-btn"
        onClick={() => window.location.reload()}
        title="New Project"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
          <polyline points="14,2 14,8 20,8"/>
          <line x1="12" y1="18" x2="12" y2="12"/>
          <line x1="9" y1="15" x2="15" y2="15"/>
        </svg>
        New
      </button>

      {hasModel && !firstPerson && (
        <button
          className="control-btn save-position-btn"
          onClick={onSavePosition}
          title="Save Current Camera Position"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          Save Position
        </button>
      )}

      {hasModel && savedPointsCount > 0 && (
        <button
          className="control-btn points-btn"
          onClick={onTogglePoints}
          title="View Saved Points"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          Points ({savedPointsCount})
        </button>
      )}

      <button
        className={`control-btn ${firstPerson ? 'active' : ''}`}
        onClick={onToggleFirstPerson}
        title={firstPerson ? "Exit Walk Mode" : "Enter Walk Mode"}
      >
        {firstPerson ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16,17 21,12 16,7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
        {firstPerson ? 'Exit Walk' : 'Walk Mode'}
      </button>
      
      <button
        className="control-btn"
        onClick={onResetCamera}
        title="Reset Camera"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="23,4 23,10 17,10" />
          <polyline points="1,20 1,14 7,14" />
          <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
        </svg>
        Reset
      </button>
      
      <button
        className="control-btn screenshot-btn"
        onClick={onScreenshot}
        title="Take High-Quality Screenshot"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
          <circle cx="12" cy="13" r="4" />
        </svg>
        Screenshot
      </button>

      {/* Full Screen Button with SVG icon instead of Font Awesome */}
      <button
        className="control-btn fullscreen-btn"
        onClick={() => {
          if (document.fullscreenElement) {
            document.exitFullscreen();
          } else {
            document.documentElement.requestFullscreen();
          }
        }}
        title="Toggle Full Screen"
      >
        {/* SVG expand icon */}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="4 8 4 4 8 4" />
          <polyline points="20 8 20 4 16 4" />
          <polyline points="4 16 4 20 8 20" />
          <polyline points="20 16 20 20 16 20" />
        </svg>
      </button>
    </div>
  );
};

export default ViewerControls;