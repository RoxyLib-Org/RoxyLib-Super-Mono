import { animated, type SpringValue } from "@react-spring/web";
import { useCallback, useEffect, useRef, useState } from "react";

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
  /** Seek to a specific time in seconds */
  onSeek: (time: number) => void;
  /** Scrub state: { x, y } viewport coords of cursor-knob, null when idle */
  onScrubChange: (knobPos: { x: number; y: number } | null) => void;
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
  onSeek,
  onScrubChange,
}: TransportControlsProps) {
  const totalDuration =
    duration != null && Number.isFinite(duration) && duration > 0
      ? duration
      : DEFAULT_DURATION;
  const trackRef = useRef<HTMLDivElement>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubFraction, setScrubFraction] = useState(0);
  const [isHoveringTrack, setIsHoveringTrack] = useState(false);
  const hoverRafRef = useRef(0);

  /** Convert pointer X to fraction [0,1] within the track */
  const xToFraction = useCallback((clientX: number) => {
    const track = trackRef.current;
    if (!track) return 0;
    const rect = track.getBoundingClientRect();
    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  }, []);

  /** Compute viewport coords for a given fraction along the track */
  const getKnobPos = useCallback((fraction: number) => {
    const track = trackRef.current;
    if (!track) return null;
    const rect = track.getBoundingClientRect();
    return {
      x: rect.left + fraction * rect.width,
      y: rect.top + rect.height / 2,
    };
  }, []);

  // When hovering (not dragging), continuously report the current elapsed knob pos
  useEffect(() => {
    if (!isHoveringTrack || isScrubbing) {
      cancelAnimationFrame(hoverRafRef.current);
      return;
    }
    let lastX = -1;
    const tick = () => {
      const frac = (elapsed.get() % totalDuration) / totalDuration;
      const pos = getKnobPos(frac);
      // Only update when position moved >= 0.5px to avoid thrashing renders
      if (pos && Math.abs(pos.x - lastX) >= 0.5) {
        lastX = pos.x;
        onScrubChange(pos);
      }
      hoverRafRef.current = requestAnimationFrame(tick);
    };
    hoverRafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(hoverRafRef.current);
  }, [
    isHoveringTrack,
    isScrubbing,
    elapsed,
    totalDuration,
    getKnobPos,
    onScrubChange,
  ]);

  const handleTrackEnter = useCallback(() => {
    setIsHoveringTrack(true);
  }, []);

  const handleTrackLeave = useCallback(() => {
    if (!isScrubbing) {
      setIsHoveringTrack(false);
      onScrubChange(null);
    }
  }, [isScrubbing, onScrubChange]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      const frac = xToFraction(e.clientX);
      setScrubFraction(frac);
      setIsScrubbing(true);
      onScrubChange(getKnobPos(frac));
      // Immediate seek so disc + lyrics sync on click
      onSeek(frac * totalDuration);
    },
    [xToFraction, getKnobPos, onScrubChange, onSeek, totalDuration],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isScrubbing) return;
      const frac = xToFraction(e.clientX);
      setScrubFraction(frac);
      onScrubChange(getKnobPos(frac));
      // Real-time seek — updates elapsed spring, disc rotation, and lyrics
      onSeek(frac * totalDuration);
    },
    [isScrubbing, xToFraction, getKnobPos, onScrubChange, onSeek, totalDuration],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!isScrubbing) return;
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      const frac = xToFraction(e.clientX);
      onSeek(frac * totalDuration);
      setIsScrubbing(false);
      // Clear immediately so cursor springs back to mouse position
      setIsHoveringTrack(false);
      onScrubChange(null);
      // Re-engage hover snap after spring has time to animate back (~200ms)
      const track = trackRef.current;
      const cx = e.clientX;
      const cy = e.clientY;
      setTimeout(() => {
        if (!track) return;
        const rect = track.getBoundingClientRect();
        if (
          cx >= rect.left &&
          cx <= rect.right &&
          cy >= rect.top &&
          cy <= rect.bottom
        ) {
          setIsHoveringTrack(true);
        }
      }, 220);
    },
    [isScrubbing, xToFraction, totalDuration, onSeek, onScrubChange],
  );

  return (
    <animated.div
      className="absolute bottom-0 left-0 right-0 flex flex-col items-center gap-1.5 pb-4 sm:gap-3 sm:pb-10"
      onPointerUp={(e) => e.stopPropagation()}
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
      {/* Progress bar — cursor IS the knob */}
      <div className="w-48 sm:w-80 max-w-[85vw] flex items-center gap-1.5 sm:gap-3">
        <animated.span className="text-white/60 text-xs font-mono w-10 text-right">
          {isScrubbing
            ? formatTime(scrubFraction * totalDuration)
            : elapsed.to((v) => formatTime(v % totalDuration))}
        </animated.span>
        <div
          ref={trackRef}
          className="flex-1 h-5 flex items-center cursor-none"
          data-cursor-snap="scrub"
          onMouseEnter={handleTrackEnter}
          onMouseLeave={handleTrackLeave}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          <div className="relative w-full h-1 bg-white/20 rounded-full">
            {/* Filled portion — no knob; cursor itself is the knob */}
            {isScrubbing ? (
              <div
                className="absolute inset-y-0 left-0 bg-white/80 rounded-full"
                style={{ width: `${scrubFraction * 100}%` }}
              />
            ) : (
              <animated.div
                className="absolute inset-y-0 left-0 bg-white/80 rounded-full"
                style={{
                  width: elapsed.to(
                    (v) => `${((v % totalDuration) / totalDuration) * 100}%`,
                  ),
                }}
              />
            )}
          </div>
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
          data-cursor-snap="prev"
          className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-white/70 hover:text-white transition-colors cursor-none"
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
          data-cursor-snap={isPlaying ? "pause" : "play"}
          className="w-8 h-8 sm:w-12 sm:h-12 rounded-full border-2 border-white/40 flex items-center justify-center text-white hover:border-white/80 transition-colors cursor-none"
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
          data-cursor-snap="next"
          className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-white/70 hover:text-white transition-colors cursor-none"
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
