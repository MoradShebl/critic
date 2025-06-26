import React from 'react';

const LoadingScreen = ({ progress = 0, fileName = '' }) => {
  const getLoadingMessage = () => {
    if (progress < 20) return 'Initializing 3D engine...';
    if (progress < 40) return 'Loading model geometry...';
    if (progress < 60) return 'Processing materials...';
    if (progress < 80) return 'Optimizing for rendering...';
    if (progress < 95) return 'Finalizing setup...';
    return 'Almost ready...';
  };

  return (
    <div className="loading-screen">
      <div className="loading-container">
        {/* Animated 3D cube */}
        <div className="loading-cube">
          <div className="cube">
            <div className="face front"></div>
            <div className="face back"></div>
            <div className="face right"></div>
            <div className="face left"></div>
            <div className="face top"></div>
            <div className="face bottom"></div>
          </div>
        </div>

        {/* Loading content */}
        <div className="loading-content">
          <h2 className="loading-title">Loading 3D Model</h2>
          <p className="loading-filename">{fileName}</p>
          
          {/* Progress bar */}
          <div className="progress-container">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${Math.max(2, progress)}%` }}
              >
                <div className="progress-glow"></div>
              </div>
            </div>
            <div className="progress-text">{progress}%</div>
          </div>

          {/* Loading message */}
          <p className="loading-message">{getLoadingMessage()}</p>

          {/* Loading dots animation */}
          <div className="loading-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>

        {/* Particle effects */}
        <div className="particles">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="particle" style={{
              '--delay': `${i * 0.1}s`,
              '--x': `${Math.random() * 100}%`,
              '--y': `${Math.random() * 100}%`
            }}></div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;