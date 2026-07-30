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

      {/* Top-right action icons */}
      <animated.div
        className="absolute top-6 right-6 md:top-10 md:right-10 z-10 flex items-center gap-4"
        style={{
          opacity: progress.to((p) => Math.max(0, (p - 0.5) / 0.5)),
        }}
      >
        {/* Download link */}
        <a
          href="https://pan.roxylib.com/%E6%B4%9B%E7%90%AA%E5%B8%8C%E5%9B%BE%E4%B9%A6%E9%A6%86%20-%20%E5%80%9F%E4%B9%A6%E6%9F%9C%E5%8F%B0/%E9%9F%B3%E4%B9%90"
          target="_blank"
          rel="noopener noreferrer"
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors"
          title="下载音乐"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            className="w-5 h-5 text-white/80"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
            />
          </svg>
        </a>
        {/* Language toggle (placeholder) */}
        <button
          type="button"
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors"
          title="语言"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            className="w-5 h-5 text-white/80"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495A18.023 18.023 0 0115.75 7.5"
            />
          </svg>
        </button>
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
