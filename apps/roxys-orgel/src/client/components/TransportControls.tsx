import { animated, type SpringValue } from "@react-spring/web";

interface TransportControlsProps {
  /** 0→1 zoom progress spring — transport visible when progress ≈ 1 */
  progress: SpringValue<number>;
  /** Elapsed playback time in seconds (spring-driven) */
  elapsed: SpringValue<number>;
  /** Total duration in seconds (from song data) */
  duration?: number;
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

/** Fallback total duration when none provided */
const DEFAULT_DURATION = 240;

export function TransportControls({
  progress,
  elapsed,
  duration,
  isPlaying,
  onPlayPause,
  onPrev,
  onNext,
}: TransportControlsProps) {
  const totalDuration = duration ?? DEFAULT_DURATION;

  return (
    <animated.div
      className="absolute bottom-0 left-0 right-0 flex flex-col items-center gap-1.5 pb-4 sm:gap-3 sm:pb-10"
      style={{
        opacity: progress.to((p) =>
          Math.min(1, Math.max(0, (p - 0.83) / 0.17)),
        ),
        transform: progress.to((p) => {
          const v = Math.min(1, Math.max(0, (p - 0.83) / 0.17));
          return `translateY(${(1 - v) * 30}px)`;
        }),
        pointerEvents: progress.to((p) => (p > 0.9 ? "auto" : "none")),
      }}
    >
      {/* Progress bar */}
      <div className="w-48 sm:w-80 max-w-[85vw] flex items-center gap-1.5 sm:gap-3">
        <animated.span className="text-white/60 text-xs font-mono w-10 text-right">
          {elapsed.to((v) => formatTime(v % totalDuration))}
        </animated.span>
        <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
          <animated.div
            className="h-full bg-white/80 rounded-full"
            style={{
              width: elapsed.to(
                (v) => `${((v % totalDuration) / totalDuration) * 100}%`,
              ),
            }}
          />
        </div>
        <span className="text-white/60 text-xs font-mono w-10">
          {formatTime(totalDuration)}
        </span>
      </div>

      {/* Transport buttons */}
      <div className="flex items-center gap-3 sm:gap-8">
        <button
          type="button"
          onClick={onPrev}
          className="text-white/70 hover:text-white transition-colors cursor-pointer"
          aria-label="Previous track"
        >
          <svg
            width="18"
            height="18"
            className="sm:w-6 sm:h-6"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M6 6h2v12H6V6zm3.5 6l8.5 6V6l-8.5 6z" />
          </svg>
        </button>

        <button
          type="button"
          onClick={onPlayPause}
          className="w-8 h-8 sm:w-12 sm:h-12 rounded-full border-2 border-white/40 flex items-center justify-center text-white hover:border-white/80 transition-colors cursor-pointer"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <svg
              width="14"
              height="14"
              className="sm:w-5 sm:h-5"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          ) : (
            <svg
              width="14"
              height="14"
              className="sm:w-5 sm:h-5"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
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
          <svg
            width="18"
            height="18"
            className="sm:w-6 sm:h-6"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
          </svg>
        </button>
      </div>
    </animated.div>
  );
}
