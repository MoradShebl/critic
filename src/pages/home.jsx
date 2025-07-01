import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Header from "../components/HomePage/Header";
import "../styles/home.css";

gsap.registerPlugin(ScrollTrigger);

async function fetchDataJson() {
  const response = await fetch("/data.json");
  if (!response.ok) throw new Error("Failed to fetch data.json");
  return response.json();
}

function Home() {
  const [features, setFeatures] = useState([]);
  const [videoId, setVideoId] = useState("EaH0fMakP48");

  useEffect(() => {
    fetchDataJson()
      .then((data) => {
        if (Array.isArray(data) && data[0]?.features) {
          setFeatures(data[0].features);
        }
      })
      .catch((e) => {
        setFeatures([]);
      });
  }, []);

  useEffect(() => {
    const selectors = [
      ".hero-section",
      ".features-section",
      ".pricing-section",
      "footer",
    ];
    const elements = selectors
      .map((selector) => Array.from(document.querySelectorAll(selector)))
      .flat()
      .filter(Boolean);

    if (elements.length) {
      elements.forEach((el, i) => {
        gsap.set(el, { filter: "blur(12px)", opacity: 0, scale: 1.05, y: 24 });
        gsap.to(el, {
          filter: "blur(0px)",
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 1.1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: el,
            start: "top 85%",
            toggleActions: "play none none none",
          },
          delay: i * 0.1,
        });
      });
    }

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  const changeVideoId = (videoId) => {
    setVideoId(videoId);
    const featureVideo = document.getElementById("feature-video");
    if (featureVideo) {
      featureVideo.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  return (
    <>
      <Header />

      <section className="hero-section" id="hero">
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
      <section className="features-section" id="features">
        <h2>
          A better way to critique starts with understanding <br />
          before judging.
        </h2>
        <div className="feature-video" id="feature-video">
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&loop=1&disablekb=1&playsinline=1&rel=0&vq=small&playlist=${videoId}`}
            title=""
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen={false}
          />
        </div>
        <div className="feature-list">
          {features.length > 0 ? (
            features.map((feature) => (
              <div
                className={`feature-item${
                  videoId === feature.video ? " checked" : ""
                }`}
                key={feature.id}
                onClick={() => changeVideoId(feature.video)}
              >
                <h3>{feature.name}</h3>
                <p>{feature.desciption}</p>
              </div>
            ))
          ) : (
            <div>Loading features...</div>
          )}
        </div>
      </section>
      <section className="pricing-section" id="pricing">
        <div
          style={{
            position: "absolute",
            top: 0,
            zIndex: -10,
            height: "100%",
            width: "100%",
          }}
        >
          <div
            style={{
              position: "absolute",
              bottom: "auto",
              left: "auto",
              right: 0,
              top: 0,
              height: "500px",
              width: "500px",
              transform: "translateX(-30%) translateY(20%)",
              borderRadius: "50%",
              backgroundColor: "rgba(123, 123, 123, 0.5)",
              opacity: 0.5,
              filter: "blur(80px)",
            }}
          ></div>
        </div>
        <h2>Pricing</h2>
        <div className="pricing-content">
          <div className="princing-card king">
            <h3>Free</h3>
            <p>All features for all users</p>
            <div className="price-and-button">
              <span>0$ Unlimited members</span>
              <Link to="/3d" className="button reversed">
                Give it a try (Beta)
              </Link>
            </div>
            <span>What's included:</span>
            <ul>
              <li>Walk mode</li>
              <li>Camera points</li>
              <li>Virtual tour</li>
              <li>Toggle between 2D and 3D</li>
              <li>Shadow customization</li>
              <li>Project saving</li>
              <li>And So many!</li>
            </ul>
          </div>
        </div>
      </section>
      <footer></footer>
    </>
  );
}

export default Home;
