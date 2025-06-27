import React from 'react';

const SavedPointsPanel = ({ 
  points, 
  onPointClick, 
  onDeletePoint, 
  onClose, 
  activePointId 
}) => {
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content saved-points-panel">
        <div className="modal-header">
          <h3>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            Saved Camera Positions ({points.length})
          </h3>
          <button className="close-btn" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        
        <div className="points-list">
          {points.length === 0 ? (
            <div className="empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              <p>No saved positions yet</p>
              <span>Save camera positions to quickly navigate between different views</span>
            </div>
          ) : (
            points.map((point) => (
              <div 
                key={point.id} 
                className={`point-item ${activePointId === point.id ? 'active' : ''}`}
              >
                <div className="point-info">
                  <div className="point-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                  </div>
                  <div className="point-details">
                    <span className="point-name">{point.name}</span>
                    <span className="point-date">{formatDate(point.savedAt)}</span>
                    <span className="point-coords">
                      Position: ({point.position[0].toFixed(1)}, {point.position[1].toFixed(1)}, {point.position[2].toFixed(1)})
                    </span>
                  </div>
                </div>
                
                <div className="point-actions">
                  <button
                    className="action-btn goto"
                    onClick={() => onPointClick(point)}
                    title="Go to this position"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14"/>
                      <path d="M12 5l7 7-7 7"/>
                    </svg>
                  </button>
                  <button
                    className="action-btn delete"
                    onClick={() => onDeletePoint(point.id)}
                    title="Delete this position"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3,6 5,6 21,6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        
        {points.length > 0 && (
          <div className="panel-footer">
            <div className="footer-hint">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 16v-4"/>
                <path d="M12 8h.01"/>
              </svg>
              Click on a position to smoothly navigate to that view
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedPointsPanel;