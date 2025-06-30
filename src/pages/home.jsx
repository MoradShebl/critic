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
              <svg
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
                xmlnsXlink="http://www.w3.org/1999/xlink"
                width="396.3px"
                height="411.4px"
                viewBox="0 0 396.3 411.4"
                xmlSpace="preserve"
              >
                <defs>
                  <linearGradient
                    id="SVGID_1_"
                    gradientUnits="userSpaceOnUse"
                    x1="148.6643"
                    y1="334.2465"
                    x2="147.1253"
                    y2="419.6609"
                  >
                    <stop offset="0" stopColor="#FFFFFF"></stop>
                    <stop offset="1" stopColor="#000000"></stop>
                  </linearGradient>
                  <linearGradient
                    id="SVGID_2_"
                    gradientUnits="userSpaceOnUse"
                    x1="284.4213"
                    y1="121.228"
                    x2="335.9778"
                    y2="81.2141"
                  >
                    <stop offset="0" stopColor="#FFFFFF"></stop>
                    <stop offset="1" stopColor="#000000"></stop>
                  </linearGradient>
                </defs>
                <g>
                  <path
                    className="st0"
                    style={{ fill: "#FFFFFF" }}
                    d="M283.3,136.1c12.2-6.8,24.3-13.4,36.2-20.1L283.3,136.1z M132.6,192.9v126.8l31.6,4.1V206.5
                c33.1-22.1,69.8-43,106.1-63.2l-14.9-21.6L132.6,192.9z M197.4,0L0,128.1V327l153.7,84.4L396.3,333V128.1L197.4,0z M33.2,308.9
                V149.2l164.3-110c36.1,23.1,76.5,47.7,95.7,59.8l0.8,0.5l-38.4,22.2l-122.8,71.2v165.8L33.2,308.9z M361.7,310.4l-195.9,64.8
                l-0.5-0.3l-1-0.5v-168c33.1-22.1,69.8-43,106.1-63.2l12.9-7.2c12.2-6.8,24.3-13.4,36.2-20.1c22.2,14,29.9,19.4,42.2,27.1V310.4z"
                  ></path>
                  <polygon
                    className="st1"
                    style={{ fill: "url(#SVGID_1_)" }}
                    points="164.3,323.8 164.3,374.5 132.6,358.7 132.6,319.7"
                  ></polygon>
                  <polygon
                    className="st2"
                    style={{ fill: "url(#SVGID_2_)" }}
                    points="319.5,116 283.3,136.1 270.3,143.3 255.5,121.7 293.8,99.5"
                  ></polygon>
                </g>
              </svg>
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
            zIndex: 1100,
          }}
        >
          <nav>
            <a onClick={toggleMenu}>Features</a>
            <a onClick={toggleMenu}>Pricing</a>
            <a onClick={toggleMenu}>How it works</a>
          </nav>
          <div className="header-btns">
            <a onClick={toggleMenu} className="button">Join The Waitlist</a>
            <Link onClick={toggleMenu} to="/3d" className="button reversed">
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
            src="https://www.youtube.com/embed/rVu_WghPUvg?autoplay=1&mute=1&controls=1&loop=true&playlist=rVu_WghPUvg"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
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
