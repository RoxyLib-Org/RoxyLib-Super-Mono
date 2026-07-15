import { animated, type SpringValue } from "@react-spring/web";
import { useEffect, useRef, useState } from "react";

interface TransportControlsProps {
  zoom: SpringValue<number>;
  isPlaying: boolean;
  onPlayPause: () => void;
  onPrev: () => void;
  onNext: () => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** Placeholder total duration */
const TOTAL_DURATION = 240;

export function TransportControls({
  zoom,
  isPlaying,
  onPlayPause,
  onPrev,
  onNext,
}: TransportControlsProps) {
  const [elapsed, setElapsed] = useState(0);
  const rafRef = useRef(0);
  const startRef = useRef(0);
  const accumulatedRef = useRef(0);

  useEffect(() => {
    if (isPlaying) {
      startRef.current = performance.now();
      const tick = () => {
        const now = performance.now();
        const total = accumulatedRef.current + (now - startRef.current) / 1000;
        setElapsed(total % TOTAL_DURATION);
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
      return () => {
        accumulatedRef.current += (performance.now() - startRef.current) / 1000;
        cancelAnimationFrame(rafRef.current);
      };
    }
  }, [isPlaying]);

  const progress = elapsed / TOTAL_DURATION;

  return (
    <animated.div
      className="absolute bottom-0 left-0 right-0 flex flex-col items-center gap-3 pb-10 pointer-events-none"
      style={{
        opacity: zoom.to((z) => Math.max(0, (z - 0.6) * 2.5)),
        transform: zoom.to((z) => {
          const t = Math.max(0, (z - 0.6) * 2.5);
          return `translateY(${(1 - t) * 30}px)`;
        }),
      }}
    >
      {/* Progress bar */}
      <div className="w-80 max-w-[80vw] flex items-center gap-3 pointer-events-auto">
        <span className="text-white/60 text-xs font-mono w-10 text-right">
          {formatTime(elapsed)}
        </span>
        <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white/80 rounded-full transition-[width] duration-200"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <span className="text-white/60 text-xs font-mono w-10">
          {formatTime(TOTAL_DURATION)}
        </span>
      </div>

      {/* Transport buttons */}
      <div className="flex items-center gap-8 pointer-events-auto">
        <button
          type="button"
          onClick={onPrev}
          className="text-white/70 hover:text-white transition-colors cursor-pointer"
          aria-label="Previous track"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 6h2v12H6V6zm3.5 6l8.5 6V6l-8.5 6z" />
          </svg>
        </button>

        <button
          type="button"
          onClick={onPlayPause}
          className="w-12 h-12 rounded-full border-2 border-white/40 flex items-center justify-center text-white hover:border-white/80 transition-colors cursor-pointer"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        <button
          type="button"
          onClick={onNext}
          className="text-white/70 hover:text-white transition-colors cursor-pointer"
          aria-label="Next track"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
          </svg>
        </button>
      </div>
    </animated.div>
  );
}
