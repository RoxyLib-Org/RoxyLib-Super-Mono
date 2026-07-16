import { animated, type SpringValue } from "@react-spring/web";

interface AuroraBackgroundProps {
  /** 0→1 spring: player mode visibility */
  visible: SpringValue<number>;
  /** Whether audio is currently playing */
  isPlaying: boolean;
  /** Animated color string from the disc palette */
  color: SpringValue<string>;
}

/**
 * Aceternity-style aurora background.
 * Visible only when in player mode (visible=1) AND playing.
 * Uses CSS transition for the isPlaying toggle fade.
 */
export function AuroraBackground({
  visible,
  isPlaying,
  color,
}: AuroraBackgroundProps) {
  return (
    <animated.div
      className="absolute inset-0 overflow-hidden"
      style={{
        opacity: visible.to((v) => v * (isPlaying ? 1 : 0)),
        transition: "opacity 0.4s ease",
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
