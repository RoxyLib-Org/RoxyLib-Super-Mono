import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Loading overlay with cross-scrolling song titles and a gold progress bar.
 * Shown while cover images are being preloaded.
 */

interface LoadingOverlayProps {
  /** URLs to preload (cover images) */
  urls: string[];
  /** Song titles to display in the marquee */
  titles: string[];
  /** Whether the data source is ready (urls are final). While false, overlay shows but does not start preloading. */
  ready: boolean;
  /** Called when all images have loaded AND min display time has elapsed */
  onComplete: () => void;
  /** Whether the overlay is visible (controls exit animation) */
  visible: boolean;
}

/** Minimum time the overlay stays visible (ms) — ensures the animation is seen */
const MIN_DISPLAY_MS = 1200;

// Fallback titles shown before real data arrives
const FALLBACK_TITLES = [
  "月光奏鸣曲",
  "夜想曲",
  "春之歌",
  "悲怆",
  "幻想即兴曲",
  "爱之梦",
  "致爱丽丝",
  "小夜曲",
  "天鹅湖",
  "四季",
];

function MarqueeRow({
  titles,
  direction,
  speed,
}: {
  titles: string[];
  direction: "left" | "right";
  speed: number;
}) {
  // Double the titles for seamless loop
  const doubled = [...titles, ...titles];
  const animClass =
    direction === "left" ? "animate-marquee-left" : "animate-marquee-right";

  return (
    <div className="flex whitespace-nowrap overflow-hidden">
      <div
        className={`flex shrink-0 gap-16 ${animClass}`}
        style={{ animationDuration: `${speed}s` }}
      >
        {doubled.map((t, i) => (
          <span
            key={`${t}-${i}`}
            className="text-white/[0.18] font-display text-3xl md:text-5xl font-medium select-none"
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

export function LoadingOverlay({
  urls,
  titles,
  ready,
  onComplete,
  visible,
}: LoadingOverlayProps) {
  const [progress, setProgress] = useState(0);
  const [exiting, setExiting] = useState(false);
  const loadedRef = useRef(0);
  const totalRef = useRef(0);
  const completedRef = useRef(false);
  const mountedAtRef = useRef(Date.now());
  const imagesLoadedRef = useRef(false);

  const triggerExit = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    setExiting(true);
    setTimeout(() => {
      onComplete();
    }, 1500);
  }, [onComplete]);

  // Attempt to finish: requires both min time elapsed AND images done
  const maybeFinish = useCallback(() => {
    if (!imagesLoadedRef.current) return;
    const elapsed = Date.now() - mountedAtRef.current;
    if (elapsed >= MIN_DISPLAY_MS) {
      triggerExit();
    } else {
      setTimeout(triggerExit, MIN_DISPLAY_MS - elapsed);
    }
  }, [triggerExit]);

  // Start preloading only when `ready` becomes true
  useEffect(() => {
    if (!ready) return;

    // If no images to load, mark done immediately
    if (urls.length === 0) {
      imagesLoadedRef.current = true;
      maybeFinish();
      return;
    }

    totalRef.current = urls.length;
    loadedRef.current = 0;

    const onLoad = () => {
      loadedRef.current++;
      setProgress(loadedRef.current / totalRef.current);
      if (loadedRef.current >= totalRef.current) {
        imagesLoadedRef.current = true;
        maybeFinish();
      }
    };

    for (const url of urls) {
      const img = new Image();
      img.onload = onLoad;
      img.onerror = onLoad;
      img.src = url;
    }
  }, [ready, urls, maybeFinish]);

  if (!visible) return null;

  // Use real song titles when available, otherwise fallback
  const displayTitles = titles.length > 0 ? titles : FALLBACK_TITLES;

  // Generate staggered rows with alternating directions
  const rows = Array.from({ length: 8 }, (_, i) => {
    const offset = i * 3;
    const sliced = [
      ...displayTitles.slice(offset % displayTitles.length),
      ...displayTitles.slice(0, offset % displayTitles.length),
    ];
    return {
      titles: sliced,
      direction: (i % 2 === 0 ? "left" : "right") as "left" | "right",
      speed: 300 + i * 30,
    };
  });

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col justify-center overflow-hidden bg-black transition-opacity duration-500 ${
        exiting ? "opacity-0 scale-105" : "opacity-100 scale-100"
      }`}
      style={{
        transition: "opacity 1.5s ease, transform 1.5s ease",
        transform: exiting ? "scale(1.02)" : "scale(1)",
      }}
    >
      {/* Marquee rows */}
      <div className="flex flex-col justify-center gap-12 h-full animate-fade-in" style={{ transform: "rotate(12deg)", transformOrigin: "center center" }}>
        {rows.map((row, i) => (
          <MarqueeRow
            key={i}
            titles={row.titles}
            direction={row.direction}
            speed={row.speed}
          />
        ))}
      </div>

      {/* Bottom gold progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-3 bg-white/5">
        <div
          className="h-full transition-all duration-300 ease-out"
          style={{
            width: `${progress * 100}%`,
            background:
              "linear-gradient(90deg, #5c4a1e, #7a6230, #8b7335, #7a6230)",
            boxShadow: "0 0 8px rgba(122, 98, 48, 0.4)",
          }}
        />
      </div>

      {/* Subtle center text */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className={`text-white/40 font-display text-sm tracking-[0.3em] uppercase transition-opacity duration-700 ${
            exiting ? "opacity-0" : "opacity-100"
          }`}
        >
          Loading
        </div>
      </div>
    </div>
  );
}
