import { measureNaturalWidth, prepareWithSegments } from "@chenglou/pretext";
import { animated, type SpringValue } from "@react-spring/web";
import { useEffect, useMemo, useRef, useState } from "react";
import type { LyricLine } from "../data/songs";

interface LyricsProps {
  /** Lyric lines for current song */
  lyrics: LyricLine[];
  /** Current playback time in seconds */
  currentTime: number;
  /** Whether audio is playing */
  isPlaying: boolean;
  /** 0-1 zoom progress spring — lyrics visible when progress ≈ 1 */
  progress: SpringValue<number>;
}

/** Find the index of the active lyric line at a given time */
function getActiveLine(lyrics: LyricLine[], time: number): number {
  for (let i = lyrics.length - 1; i >= 0; i--) {
    if (time >= lyrics[i].time) return i;
  }
  return 0;
}

/**
 * Measure text widths for all lyric lines using Pretext (no DOM reflow).
 * Returns pixel width for each line at the active (larger) font size.
 * Safe to call only in browser (requires Canvas).
 */
function measureLines(lyrics: LyricLine[]): number[] {
  if (typeof document === "undefined") return lyrics.map(() => 0);
  const font = '500 18px "Inter", system-ui, sans-serif';
  return lyrics.map((line) => {
    const handle = prepareWithSegments(line.text, font);
    return measureNaturalWidth(handle);
  });
}

/**
 * Synced lyrics display below the disc in player mode.
 * Features:
 * - Short lines are centered; long lines are left-aligned and scroll
 * - Vertical scrolling following the active line
 * - Gradient masks on all four sides
 */
export function Lyrics({
  lyrics,
  currentTime,
  isPlaying,
  progress,
}: LyricsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(320);

  // Measure container width on mount and resize
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      // Usable text width = container width minus horizontal padding (px-8 = 32px each side)
      setContainerWidth(el.clientWidth - 64);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Precompute text pixel widths for all lines (no DOM needed after first prepare)
  const lineWidths = useMemo(() => measureLines(lyrics), [lyrics]);

  const activeIndex = useMemo(
    () => getActiveLine(lyrics, currentTime),
    [lyrics, currentTime],
  );

  // Compute horizontal scroll progress within the active line's time window
  const lineProgress = useMemo(() => {
    const line = lyrics[activeIndex];
    const nextLine = lyrics[activeIndex + 1];
    if (!nextLine) return 1;
    const lineDuration = nextLine.time - line.time;
    if (lineDuration <= 0) return 1;
    const elapsed = currentTime - line.time;
    return Math.min(1, Math.max(0, elapsed / lineDuration));
  }, [lyrics, activeIndex, currentTime]);

  // Scroll to keep active line centered vertically
  // biome-ignore lint/correctness/useExhaustiveDependencies: activeIndex triggers scroll when active line changes
  useEffect(() => {
    const el = activeLineRef.current;
    const container = containerRef.current;
    if (!el || !container) return;

    const containerHeight = container.clientHeight;
    const lineTop = el.offsetTop;
    const lineHeight = el.offsetHeight;
    const targetScroll = lineTop - containerHeight / 2 + lineHeight / 2;

    container.scrollTo({
      top: targetScroll,
      behavior: isPlaying ? "smooth" : "instant",
    });
  }, [activeIndex, isPlaying]);

  return (
    <animated.div
      className="absolute left-1/2 w-[85vw] sm:w-[420px] max-w-[500px] h-[140px] sm:h-[180px] z-20 pointer-events-none"
      style={{
        // Vertically centered between disc (50%) and bottom (100%) → 75%
        top: "75%",
        opacity: progress.to((p) =>
          Math.min(1, Math.max(0, (p - 0.83) / 0.17)),
        ),
        transform: progress.to((p) => {
          const v = Math.min(1, Math.max(0, (p - 0.83) / 0.17));
          return `translate(-50%, calc(-50% + ${(1 - v) * 20}px))`;
        }),
      }}
    >
      {/* Scrollable lyrics container - masked with gradient fade on all edges */}
      <div
        ref={containerRef}
        className="h-full overflow-hidden px-8 py-6 lyrics-fade-mask"
      >
        {/* Spacer to allow first line to be centered */}
        <div className="h-[60px] sm:h-[75px]" />

        {lyrics.map((line, idx) => {
          const isActive = idx === activeIndex;
          const textWidth = lineWidths[idx] ?? 0;
          const isShort = textWidth <= containerWidth;
          // How much the text overflows the container
          const overflowPx = isShort ? 0 : textWidth - containerWidth;

          const baseClass =
            "whitespace-nowrap py-1 transition-all duration-300 ease-out";
          const sizeClass = isActive
            ? "text-white text-base sm:text-lg font-medium lyric-active"
            : "text-white/40 text-sm sm:text-base";
          const alignClass = isShort ? "text-center" : "text-left";

          return (
            <div
              key={`${line.time}-${idx}`}
              ref={isActive ? activeLineRef : undefined}
              className={`${baseClass} ${sizeClass} ${alignClass}`}
              style={
                isActive && !isShort
                  ? {
                      transform: `translateX(${-lineProgress * overflowPx}px)`,
                      transition: "transform 0.3s linear",
                    }
                  : undefined
              }
            >
              {line.text}
            </div>
          );
        })}

        {/* Spacer to allow last line to be centered */}
        <div className="h-[60px] sm:h-[75px]" />
      </div>
    </animated.div>
  );
}
