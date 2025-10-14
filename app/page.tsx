"use client";
import dynamic from "next/dynamic";
import { WildWorld, CondeSans } from "./fonts";
const ParallaxImage = dynamic(() => import("../components/parallaxImg"), {
  ssr: false,
});

export default function Page() {
  return (
    <main style={{ height: "100vh", background: "#000" }}>
      <section
        style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          overflow: "hidden",
          display: "grid",
          placeItems: "center",
        }}
      >
        {/* Parallax layer (client-only render) */}
        <ParallaxImage
          src="/poses/jump.webp"
          alt="Jumping figure on black background"
        />

        <h1
          className={CondeSans.className}
          style={{
            position: "absolute",
            bottom: "50vh",
            left: "5vw",
            color: "#eaeaea",
            letterSpacing: 0.5,
            fontWeight: 600,
            fontSize: "10vw"
          }}
        >
          JEAN  DARRY . PAULETTE
        </h1>
        <h2
          className={WildWorld.className}
          style={{
            position: "absolute",
            bottom: "6vh",
            color: "#eaeaea",
            left: "5vw",
            letterSpacing: 0.5,
            fontWeight: 600,
            fontSize: "6vw"
          }}
        >
          Developpeur Full-Stack JS/TS
        </h2>
        <div
          style={{
            // position: "absolute",
            // bottom: "50vh",
            // right: "5vw",
            position:'relative',
            display: "flex",
            flexDirection:'column',
            gap: "1rem",
          }}
        >
          <button>
            <a
              className="glass-button"
              href="https://www.linkedin.com/in/darry-paulette/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Hire Me
            </a>
          </button>
          <button>
            <a className="glass-button" href="">
              Curriculum Vitae
            </a>
          </button>
          <button>
            <a className="glass-button" href="">
              Contact Me
            </a>
          </button>
          <button>
            <a className="glass-button" href="">
              Current Project
            </a>
          </button>
        </div>
      </section>
    </main>
  );
}
