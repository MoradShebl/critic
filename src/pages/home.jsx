import { Link } from "react-router-dom";
import "../styles/home.css";

function Home() {
  return (
    <>
      <header>
        <div className="notice-board">Don't forget to join the Waitlist!</div>
        <div className="main-header">
          <div className="logo">
            <img src="public\favicon.png" alt="Logo" />
            <span className="logo-text">Critic</span>
          </div>
          <nav>
            <a>Features</a>
            <a>Pricing</a>
            <a>How it works</a>
          </nav>
          <div className="header-btns">
            <button>Join The Waitlist</button>
            <Link to="/3d">Give it a try (Beta)</Link>
          </div>
        </div>
      </header>
      <section className="hero-section">
        <div>
          <h1>Sell Smarter, Show Smarter</h1>
          <p>
            Turn CAD files into interactive 3D walkthroughs clients love no tech
            skills needed.
          </p>
        </div>
        <div>
          <button>Join The Waitlist</button>
          <Link to="/3d">Give it a try (Beta)</Link>
        </div>
        <embed src="" type="" />
      </section>
      <section className="features" id="features">

      </section>
      <section className="pricing" id="pricing">
        <h2>Pricing</h2>
        <div>
          
        </div>
      </section>
      <footer>
        
      </footer>
    </>
  );
}

export default Home;
