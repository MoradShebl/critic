import { Link } from "react-router-dom";
import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Header from "../components/HomePage/Header";
import "../styles/home.css";

gsap.registerPlugin(ScrollTrigger);

function Home() {

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
      <Header />

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
