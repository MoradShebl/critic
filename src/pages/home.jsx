import { Link } from "react-router-dom";
import { useRef, useState, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "../styles/home.css";

gsap.registerPlugin(ScrollTrigger);

function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const asideRef = useRef(null);

  // Animate aside in/out
  const toggleMenu = () => {
    setMenuOpen((open) => {
      const next = !open;
      const aside = asideRef.current;
      const children = aside ? Array.from(aside.children) : [];
      if (next) {
        gsap.set(aside, { autoAlpha: 0 });
        gsap.to(aside, {
          autoAlpha: 1,
          duration: 0.4,
          ease: "power3.out",
          onComplete: () => {
            gsap.fromTo(
              children,
              { filter: "blur(16px)", opacity: 0, y: 30 },
              {
                filter: "blur(0px)",
                opacity: 1,
                y: 0,
                duration: 0.5,
                stagger: 0.09,
                ease: "power2.out",
              }
            );
          },
        });
      } else {
        gsap.to(children, {
          filter: "blur(16px)",
          opacity: 0,
          y: 30,
          duration: 0.2,
          stagger: 0.04,
          ease: "power2.in",
        });
        gsap.to(aside, {
          autoAlpha: 0,
          duration: 0.3,
          ease: "power3.in",
          delay: 0.12,
        });
      }
      return next;
    });
  };

  useEffect(() => {
    const selectors = [".hero-section", ".features", ".pricing", "footer"];
    const elements = selectors
      .map((selector) => document.querySelector(selector))
      .filter(Boolean);

    if (elements.length) {
      const tl = gsap.timeline({
        defaults: {
          filter: "blur(0px)",
          opacity: 1,
          y: 0,
          duration: 1,
          ease: "power1.out",
        },
      });

      elements.forEach((el, i) => {
        gsap.set(el, { filter: "blur(6px)", opacity: 0, y: 16 });
        tl.to(
          el,
          {
            filter: "blur(0px)",
            opacity: 1,
            y: 0,
            scrollTrigger: {
              trigger: el,
              start: "top 85%",
              toggleActions: "play none none none",
            },
          },
          i * 0.08
        );
      });
    }

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  return (
    <>
      <div className="notice-board">
        Don't forget to join the Waitlist!{" "}
        <a className="button reversed">Join The Waitlist</a>
      </div>
      <header>
        <div className="main-header">
          <div className="right">
            <button
              className="hamburger-menu"
              aria-label="Open menu"
              onClick={toggleMenu}
              aria-expanded={menuOpen}
              style={{ zIndex: 1102 }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="30"
                height="30"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
            <div className="logo">
              <img src="public/favicon.png" alt="Logo" />
              <span>Critic</span>
            </div>
            <nav>
              <a>Features</a>
              <a>Pricing</a>
              <a>How it works</a>
            </nav>
          </div>
          <div className="header-btns">
            <a className="button">Join The Waitlist</a>
            <Link to="/3d" className="button reversed">
              Give it a try (Beta)
            </Link>
          </div>
        </div>
        <aside
          ref={asideRef}
          style={{
            opacity: 0,
            pointerEvents: "none",
            zIndex: 1100,
          }}
        >
          <nav>
            <a>Features</a>
            <a>Pricing</a>
            <a>How it works</a>
          </nav>
          <div className="header-btns">
            <a className="button">Join The Waitlist</a>
            <Link to="/3d" className="button reversed">
              Give it a try (Beta)
            </Link>
          </div>
        </aside>
      </header>

      <section className="hero-section">
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            zIndex: -10,
            height: "100%",
            width: "100%",
            backgroundImage: "radial-gradient(#b4b4b4 1px, transparent 1px)",
            backgroundSize: "16px 16px",
          }}
        />

        <div className="hero-content">
          <h1>Sell Smarter, Show Smarter</h1>
          <p>
            Turn CAD files into interactive 3D walkthroughs clients love no tech
            skills needed.
          </p>
        </div>
        <div className="hero-btns">
          <a className="button">Join The Waitlist</a>
          <Link to="/3d" className="button reversed">
            Give it a try (Beta)
          </Link>
        </div>
        <div className="main-video-div">
          <iframe
            src="https://www.youtube.com/embed/rVu_WghPUvg?autoplay=1&mute=1&controls=1&loop=1"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
          ></iframe>
        </div>
      </section>
      <section className="features" id="features"></section>
      <section className="pricing" id="pricing">
        <h2>Pricing</h2>
        <div></div>
      </section>
      <footer></footer>
    </>
  );
}

export default Home;
