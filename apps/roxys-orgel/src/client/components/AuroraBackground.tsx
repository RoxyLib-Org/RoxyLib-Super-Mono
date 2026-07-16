import { animated, type SpringValue, to } from "@react-spring/web";

interface AuroraBackgroundProps {
  /** 0→1 zoom progress spring */
  progress: SpringValue<number>;
  /** 0→1 spring: whether audio is currently playing */
  playing: SpringValue<number>;
  /** Animated color string from the disc palette */
  color: SpringValue<string>;
}

/**
 * Aceternity-style aurora background.
 * Visible only when in player mode (progress ≈ 1) AND playing.
 * Both axes are spring-driven — no boolean closure hacks.
 */
export function AuroraBackground({
  progress,
  playing,
  color,
}: AuroraBackgroundProps) {
  return (
    <animated.div
      className="absolute inset-0 overflow-hidden"
      style={{
        // playerVis (from progress) × playing
        opacity: to([progress, playing], (p, pl) => {
          const playerVis = Math.min(1, Math.max(0, (p - 0.83) / 0.17));
          return playerVis * pl;
        }),
        pointerEvents: "none",
      }}
    >
      <animated.div
        className="aurora-effect"
        style={
          {
            "--aurora-color": color.to((c) => c),
          } as React.CSSProperties
        }
      />
    </animated.div>
  );
}
