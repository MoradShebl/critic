import React from "react";

const SideMenu = ({
  isOpen,
  onClose,
  bgColor,
  setBgColor,
  lightIntensity,
  setLightIntensity,
  lightColor,
  setLightColor,
  ambientIntensity,
  setAmbientIntensity,
  dirLight2Color,
  setDirLight2Color,
  dirLight2Pos,
  setDirLight2Pos,
  animations,
  animationIndex,
  setAnimationIndex,
  modelInfo,
  file,
  firstPerson,
  projects,
  onSaveProject,
  onLoadProject,
  onDeleteProject,
  quality,
  setQuality,
  enableShaders,
  setEnableShaders,
  enableEffects,
  setEnableEffects,
  showGround,
  setShowGround,
  groundOpacity,
  setGroundOpacity,
  shadowQuality,
  setShadowQuality,
  antialiasing,
  setAntialiasing,
  onResetSettings,
  enableLightBox,
  setEnableLightBox,
  // Sun lighting props
  timeOfDay,
  setTimeOfDay
}) => {
  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getQualityDescription = (quality) => {
    const descriptions = {
      low: 'Optimized for performance',
      medium: 'Balanced quality and performance',
      high: 'High quality rendering',
      ultra: 'Maximum quality with all effects'
    };
    return descriptions[quality] || '';
  };

  const getTimeDescription = (hour) => {
    if (hour < 6) return 'Night';
    if (hour < 8) return 'Dawn';
    if (hour < 12) return 'Morning';
    if (hour < 16) return 'Afternoon';
    if (hour < 18) return 'Evening';
    return 'Night';
  };

  return (
    <>
      {isOpen && <div className="menu-overlay" onClick={onClose} />}
      <div className={`side-menu ${isOpen ? "open" : ""}`}>
        <div className="menu-header">
          <div className="menu-title">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            <h2>Control Panel</h2>
          </div>
          <button className="close-btn" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="menu-content">
          {/* Sun Lighting Section */}
          <div className="menu-section">
            <h3 className="section-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
              Sun Lighting
            </h3>

            <div className="form-group">
              <label className="form-label">
                Time of Day
                <span className="range-value">{timeOfDay}:00 ({getTimeDescription(timeOfDay)})</span>
              </label>
              <input
                type="range"
                className="form-input"
                min="0"
                max="24"
                step="0.5"
                value={timeOfDay}
                onChange={(e) => setTimeOfDay(Number(e.target.value))}
              />
              <div className="form-hint">Drag to simulate different times of day</div>
            </div>

            <div className="form-group">
              <label className="form-label">
                Sun Intensity
                <span className="range-value">{lightIntensity.toFixed(2)}</span>
              </label>
              <input
                type="range"
                className="form-input"
                min="0.1"
                max="5"
                step="0.1"
                value={lightIntensity}
                onChange={(e) => setLightIntensity(Number(e.target.value))}
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Ambient Light
                <span className="range-value">{ambientIntensity.toFixed(2)}</span>
              </label>
              <input
                type="range"
                className="form-input"
                min="0"
                max="2"
                step="0.01"
                value={ambientIntensity}
                onChange={(e) => setAmbientIntensity(Number(e.target.value))}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Sun Color</label>
              <input
                type="color"
                className="form-input color-input"
                value={lightColor}
                onChange={(e) => setLightColor(e.target.value)}
              />
            </div>
          </div>

          {/* Project Management */}
          <div className="menu-section">
            <h3 className="section-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
              Project Management
            </h3>

            {file ? (
              <div className="project-actions">
                <button className="menu-btn primary" onClick={onSaveProject}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                    <polyline points="17,21 17,13 7,13 7,21" />
                    <polyline points="7,3 7,8 15,8" />
                  </svg>
                  Save Current Project
                </button>
              </div>
            ) : (
              <div className="empty-state">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                  <polyline points="14,2 14,8 20,8"/>
                </svg>
                <p>No project loaded</p>
              </div>
            )}

            {projects.length > 0 && (
              <div className="projects-list">
                <h4 className="subsection-title">Saved Projects ({projects.length})</h4>
                <div className="projects-grid">
                  {projects.map((project) => (
                    <div key={project.id} className="project-card">
                      <div className="project-thumbnail">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                          <path d="M2 17l10 5 10-5"/>
                          <path d="M2 12l10 5 10-5"/>
                        </svg>
                      </div>
                      <div className="project-info">
                        <span className="project-name">{project.name}</span>
                        <span className="project-date">
                          {new Date(project.savedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="project-actions">
                        <button
                          className="action-btn load"
                          onClick={() => onLoadProject(project)}
                          title="Load project"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 3h18v18H3zM12 8l4 4-4 4M8 12h8" />
                          </svg>
                        </button>
                        <button
                          className="action-btn delete"
                          onClick={() => onDeleteProject(project.id)}
                          title="Delete project"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3,6 5,6 21,6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Render Quality Settings */}
          <div className="menu-section">
            <h3 className="section-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                <line x1="8" y1="21" x2="16" y2="21"/>
                <line x1="12" y1="17" x2="12" y2="21"/>
              </svg>
              Render Quality
            </h3>

            <div className="form-group">
              <label className="form-label">Quality Preset</label>
              <select
                className="form-input"
                value={quality}
                onChange={(e) => setQuality(e.target.value)}
              >
                <option value="low">Low - Performance</option>
                <option value="medium">Medium - Balanced</option>
                <option value="high">High - Quality</option>
                <option value="ultra">Ultra - Maximum</option>
              </select>
              <div className="form-hint">{getQualityDescription(quality)}</div>
            </div>

            <div className="form-group">
              <label className="form-label">Shadow Quality</label>
              <select
                className="form-input"
                value={shadowQuality}
                onChange={(e) => setShadowQuality(e.target.value)}
              >
                <option value="low">Low (1024px)</option>
                <option value="medium">Medium (2048px)</option>
                <option value="high">High (4096px)</option>
                <option value="ultra">Ultra (8192px)</option>
              </select>
            </div>

            <div className="toggle-group">
              <div className="toggle-item">
                <input
                  type="checkbox"
                  id="enableShaders"
                  className="toggle-input"
                  checked={enableShaders}
                  onChange={(e) => setEnableShaders(e.target.checked)}
                />
                <label htmlFor="enableShaders" className="toggle-label">
                  <span className="toggle-switch"></span>
                  Advanced Shadows & Lighting
                </label>
              </div>

              <div className="toggle-item">
                <input
                  type="checkbox"
                  id="enableEffects"
                  className="toggle-input"
                  checked={enableEffects}
                  onChange={(e) => setEnableEffects(e.target.checked)}
                />
                <label htmlFor="enableEffects" className="toggle-label">
                  <span className="toggle-switch"></span>
                  Post-Processing Effects
                </label>
              </div>

              <div className="toggle-item">
                <input
                  type="checkbox"
                  id="antialiasing"
                  className="toggle-input"
                  checked={antialiasing}
                  onChange={(e) => setAntialiasing(e.target.checked)}
                />
                <label htmlFor="antialiasing" className="toggle-label">
                  <span className="toggle-switch"></span>
                  Anti-Aliasing
                </label>
              </div>
            </div>
          </div>

          {/* Scene Settings */}
          <div className="menu-section">
            <h3 className="section-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                <polyline points="3.27,6.96 12,12.01 20.73,6.96"/>
                <line x1="12" y1="22.08" x2="12" y2="12"/>
              </svg>
              Scene Settings
            </h3>

            <div className="form-group">
              <label className="form-label">Environment</label>
              <select
                className="form-input"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
              >
                <option value="sky">Dynamic Sky</option>
                <option value="#111111">Night</option>
                <option value="#e0e7ef">Studio</option>
              </select>
            </div>

            <div className="toggle-group">
              <div className="toggle-item">
                <input
                  type="checkbox"
                  id="showGround"
                  className="toggle-input"
                  checked={showGround}
                  onChange={(e) => setShowGround(e.target.checked)}
                />
                <label htmlFor="showGround" className="toggle-label">
                  <span className="toggle-switch"></span>
                  Ground Plane
                </label>
              </div>

              <div className="toggle-item">
                <input
                  type="checkbox"
                  id="enableLightBox"
                  className="toggle-input"
                  checked={enableLightBox}
                  onChange={(e) => setEnableLightBox(e.target.checked)}
                />
                <label htmlFor="enableLightBox" className="toggle-label">
                  <span className="toggle-switch"></span>
                  Studio Lighting
                </label>
              </div>
            </div>

            {showGround && (
              <div className="form-group">
                <label className="form-label">
                  Ground Opacity
                  <span className="range-value">{groundOpacity.toFixed(2)}</span>
                </label>
                <input
                  type="range"
                  className="form-input"
                  min="0"
                  max="1"
                  step="0.01"
                  value={groundOpacity}
                  onChange={(e) => setGroundOpacity(Number(e.target.value))}
                />
              </div>
            )}
          </div>

          {/* Animation Controls */}
          {animations.length > 0 && (
            <div className="menu-section">
              <h3 className="section-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="5,3 19,12 5,21 5,3" />
                </svg>
                Animations ({animations.length})
              </h3>

              <div className="form-group">
                <label className="form-label">Select Animation</label>
                <select
                  className="form-input"
                  value={animationIndex}
                  onChange={(e) => setAnimationIndex(Number(e.target.value))}
                >
                  {animations.map((animation, index) => (
                    <option key={index} value={index}>
                      {animation.name || `Animation ${index + 1}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Model Information */}
          <div className="menu-section">
            <h3 className="section-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              Model Information
            </h3>

            {modelInfo.error ? (
              <div className="error-panel">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
                <p>{modelInfo.error}</p>
              </div>
            ) : (
              <div className="info-panel">
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">File</span>
                    <span className="info-value">{file?.name || "No file loaded"}</span>
                  </div>
                  {file && (
                    <div className="info-item">
                      <span className="info-label">Size</span>
                      <span className="info-value">{formatFileSize(file.size)}</span>
                    </div>
                  )}
                  <div className="info-item">
                    <span className="info-label">Meshes</span>
                    <span className="info-value">{modelInfo.meshCount ?? "-"}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Vertices</span>
                    <span className="info-value">
                      {modelInfo.vertexCount?.toLocaleString() ?? "-"}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Triangles</span>
                    <span className="info-value">
                      {Math.floor(modelInfo.triangleCount || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Animations</span>
                    <span className="info-value">{animations.length}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Reset Settings */}
          <div className="menu-section">
            <button className="menu-btn danger" onClick={onResetSettings}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
              </svg>
              Reset All Settings
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default SideMenu;