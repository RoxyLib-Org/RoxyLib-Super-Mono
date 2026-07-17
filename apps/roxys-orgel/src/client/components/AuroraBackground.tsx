import { animated, type SpringValue } from "@react-spring/web";

interface AuroraBackgroundProps {
  /** 0→1 zoom progress spring */
  progress: SpringValue<number>;
  /** Whether audio is currently playing (drives CSS transition) */
  isPlaying: boolean;
  /** Animated color string from the disc palette */
  color: SpringValue<string>;
}

/**
 * Aceternity-style aurora background.
 * Visible only when in player mode (progress ≈ 1) AND playing.
 * Progress visibility is spring-driven; play/pause uses CSS transition — no useEffect sync.
 */
export function AuroraBackground({
  progress,
  isPlaying,
  color,
}: AuroraBackgroundProps) {
  return (
    <animated.div
      className="absolute inset-0 overflow-hidden"
      style={{
        // Spring-driven: fade in when progress > 0.83 (player mode)
        opacity: progress.to((p) =>
          Math.min(1, Math.max(0, (p - 0.83) / 0.17)),
        ),
        pointerEvents: "none",
      }}
    >
      <animated.div
        className="aurora-effect"
        style={
          {
            // CSS transition handles play/pause fade — no spring/effect needed
            opacity: isPlaying ? 1 : 0,
            transition: "opacity 0.4s ease",
            "--aurora-color": color.to((c) => c),
          } as React.CSSProperties
        }
      />
    </animated.div>
  );
}
