import type { SpringValue } from "@react-spring/web";
import { animated } from "@react-spring/web";

interface HeroSectionProps {
  /** 0→1 hero reveal progress */
  progress: SpringValue<number>;
}

const HERO_BG_URL = "/api/static/hero-bg.jpg";
const LOGO_URL = "/api/static/hero-logo.png";

/**
 * Full-screen hero section shown above the player (scroll up past progress=1).
 * - Background artwork with subtle parallax
 * - Logo + typographic title with multi-line layout
 * - White etched circular ornamental patterns
 */
export function HeroSection({ progress }: HeroSectionProps) {
  return (
    <animated.div
      className="absolute inset-0 z-0 flex flex-col items-center justify-center overflow-hidden"
      style={{
        opacity: progress.to((p) => Math.min(1, p * 1.5)),
        pointerEvents: progress.to((p) => (p > 0.1 ? "auto" : "none")),
      }}
    >
      {/* Background image with parallax */}
      <animated.div
        className="absolute inset-0"
        style={{
          transform: progress.to(
            (p) => `scale(${1.05 + (1 - p) * 0.1}) translateY(${(1 - p) * 5}%)`,
          ),
        }}
      >
        <img
          src={HERO_BG_URL}
          alt=""
          className="w-full h-full object-cover"
          loading="eager"
        />
        {/* Subtle dark overlay for text readability — not too heavy */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-black/30" />
      </animated.div>

      {/* Etched circular ornament ring — SVG behind content */}
      <animated.div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{
          opacity: progress.to((p) => Math.max(0, (p - 0.4) / 0.6)),
          mixBlendMode: "lighten",
        }}
      >
        <svg
          viewBox="0 0 600 600"
          className="w-[70vmin] h-[70vmin] max-w-[500px] max-h-[500px]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Outer ring */}
          <circle
            cx="300"
            cy="300"
            r="280"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="1"
          />
          {/* Second ring */}
          <circle
            cx="300"
            cy="300"
            r="270"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="0.5"
          />
          {/* Decorative arcs — vine-like curves */}
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (i * 30 * Math.PI) / 180;
            const r = 275;
            const x1 = 300 + Math.cos(angle) * r;
            const y1 = 300 + Math.sin(angle) * r;
            const x2 = 300 + Math.cos(angle + 0.2) * (r - 20);
            const y2 = 300 + Math.sin(angle + 0.2) * (r - 20);
            return (
              <path
                key={i}
                d={`M${x1},${y1} Q${300 + Math.cos(angle + 0.1) * (r + 10)},${300 + Math.sin(angle + 0.1) * (r + 10)} ${x2},${y2}`}
                stroke="rgba(255,255,255,0.12)"
                strokeWidth="0.8"
              />
            );
          })}
          {/* Inner decorative ring with filigree dots */}
          <circle
            cx="300"
            cy="300"
            r="240"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="0.5"
            strokeDasharray="4 8"
          />
          {/* Small diamond accents at cardinal points */}
          {[0, 90, 180, 270].map((deg) => {
            const rad = (deg * Math.PI) / 180;
            const cx = 300 + Math.cos(rad) * 258;
            const cy = 300 + Math.sin(rad) * 258;
            return (
              <g key={deg} transform={`translate(${cx},${cy}) rotate(${deg})`}>
                <path
                  d="M0,-5 L3,0 L0,5 L-3,0 Z"
                  fill="rgba(255,255,255,0.15)"
                />
              </g>
            );
          })}
          {/* Tiny circles along the ring */}
          {Array.from({ length: 24 }).map((_, i) => {
            const angle = (i * 15 * Math.PI) / 180;
            const cx = 300 + Math.cos(angle) * 258;
            const cy = 300 + Math.sin(angle) * 258;
            return (
              <circle
                key={i}
                cx={cx}
                cy={cy}
                r="1.5"
                fill="rgba(255,255,255,0.1)"
              />
            );
          })}
        </svg>
      </animated.div>

      {/* Logo — top-left corner */}
      <animated.div
        className="absolute top-6 left-6 md:top-10 md:left-10 z-10"
        style={{
          opacity: progress.to((p) => Math.max(0, (p - 0.3) / 0.7)),
          transform: progress.to(
            (p) =>
              `translateY(${(1 - Math.min(1, (p - 0.2) / 0.8)) * -20 - 12}px)`,
          ),
        }}
      >
        <img
          src={LOGO_URL}
          alt="洛琪希的八音盒"
          className="w-24 h-24 md:w-32 md:h-32 object-contain drop-shadow-2xl"
          loading="eager"
        />
      </animated.div>

      <animated.div
        className="relative z-10 flex flex-col items-center"
        style={{
          opacity: progress.to((p) => Math.max(0, (p - 0.3) / 0.7)),
          transform: progress.to(
            (p) => `translateY(${(1 - Math.min(1, (p - 0.2) / 0.8)) * 40}px)`,
          ),
          mixBlendMode: "lighten",
        }}
      >
        {/* Title typography — multi-line with varied sizes */}
        <div
          className="flex flex-col items-center select-none"
          style={{
            fontFamily:
              '"Noto Serif SC", "Source Han Serif SC", "STSong", serif',
            textShadow: "0 2px 20px rgba(0,0,0,0.6)",
          }}
        >
          {/* 洛琪希 — largest, full white */}
          <span
            className="font-light tracking-[0.2em]"
            style={{
              fontSize: "clamp(3.5rem, 10vw, 7rem)",
              lineHeight: 1.1,
              color: "rgba(255,255,255,1)",
            }}
          >
            洛琪希
          </span>

          {/* 的 — smallest, alpha */}
          <span
            className="font-extralight tracking-[0.5em]"
            style={{
              fontSize: "clamp(1rem, 2.5vw, 1.8rem)",
              lineHeight: 2,
              color: "rgba(255,255,255,0.55)",
            }}
          >
            的
          </span>

          {/* 八音盒 — medium, alpha */}
          <span
            className="font-light tracking-[0.3em]"
            style={{
              fontSize: "clamp(2rem, 5vw, 3.5rem)",
              lineHeight: 1.2,
              color: "rgba(255,255,255,0.8)",
            }}
          >
            八音盒
          </span>
        </div>

        {/* Subtitle — alpha */}
        <div
          className="mt-6 text-sm md:text-base tracking-[0.3em] uppercase select-none"
          style={{
            fontFamily: '"Inter", "Noto Sans SC", sans-serif',
            color: "rgba(255,255,255,0.4)",
          }}
        >
          Roxy's Orgel
        </div>
      </animated.div>

      {/* Scroll hint at bottom */}
      <animated.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 select-none"
        style={{
          opacity: progress.to((p) => (p > 0.8 ? 0.5 : 0)),
          mixBlendMode: "lighten",
          color: "rgba(255,255,255,0.9)",
          letterSpacing: "0.2em",
        }}
      >
        SCROLL DOWN
      </animated.div>
    </animated.div>
  );
}
