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
  is2D,
  onToggle2D,
  hasModel,
  onSavePosition,
  onTogglePoints,
  savedPointsCount
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
            <svg
              version="1.1"
              xmlns="http://www.w3.org/2000/svg"
              xmlnsXlink="http://www.w3.org/1999/xlink"
              width="396.3px"
              height="411.4px"
              viewBox="0 0 396.3 411.4"
              style={{ enableBackground: "new 0 0 396.3 411.4" }}
              xmlSpace="preserve"
            >
              <style type="text/css">
                {`
          .st0{fill:#FFFFFF;}
          .st1{fill:url(#SVGID_1_);}
          .st2{fill:url(#SVGID_2_);}
        `}
              </style>
              <defs>
                <linearGradient
                  id="SVGID_1_"
                  gradientUnits="userSpaceOnUse"
                  x1="148.6643"
                  y1="334.2465"
                  x2="147.1253"
                  y2="419.6609"
                >
                  <stop offset="0" stopColor="#FFFFFF" />
                  <stop offset="1" stopColor="#000000" />
                </linearGradient>
                <linearGradient
                  id="SVGID_2_"
                  gradientUnits="userSpaceOnUse"
                  x1="284.4213"
                  y1="121.228"
                  x2="335.9778"
                  y2="81.2141"
                >
                  <stop offset="0" stopColor="#FFFFFF" />
                  <stop offset="1" stopColor="#000000" />
                </linearGradient>
              </defs>
              <g>
                <path
                  className="st0"
                  d="M283.3,136.1c12.2-6.8,24.3-13.4,36.2-20.1L283.3,136.1z M132.6,192.9v126.8l31.6,4.1V206.5
            c33.1-22.1,69.8-43,106.1-63.2l-14.9-21.6L132.6,192.9z M197.4,0L0,128.1V327l153.7,84.4L396.3,333V128.1L197.4,0z M33.2,308.9
            V149.2l164.3-110c36.1,23.1,76.5,47.7,95.7,59.8l0.8,0.5l-38.4,22.2l-122.8,71.2v165.8L33.2,308.9z M361.7,310.4l-195.9,64.8
            l-0.5-0.3l-1-0.5v-168c33.1-22.1,69.8-43,106.1-63.2l12.9-7.2c12.2-6.8,24.3-13.4,36.2-20.1c22.2,14,29.9,19.4,42.2,27.1V310.4z"
                />
                <polygon
                  className="st1"
                  points="164.3,323.8 164.3,374.5 132.6,358.7 132.6,319.7"
                />
                <polygon
                  className="st2"
                  points="319.5,116 283.3,136.1 270.3,143.3 255.5,121.7 293.8,99.5"
                />
              </g>
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
          is2D={is2D}
          onToggle2D={onToggle2D}
          hasModel={hasModel}
          onSavePosition={onSavePosition}
          onTogglePoints={onTogglePoints}
          savedPointsCount={savedPointsCount}
        />
      </div>
    </header>
  );
};

export default Header;