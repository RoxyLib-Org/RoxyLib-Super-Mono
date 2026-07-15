import { animated, type SpringValue } from "@react-spring/web";

interface AuroraBackgroundProps {
  /** 0→1 spring controlling visibility (player mode) */
  visible: SpringValue<number>;
  /** Animated color string from the disc palette */
  color: SpringValue<string>;
}

/**
 * Aceternity-style aurora background using repeating-linear-gradient stripes,
 * blur, invert filter, and ::after mix-blend-difference.
 * Adapted for dark-only context with dynamic disc color influence.
 */
export function AuroraBackground({ visible, color }: AuroraBackgroundProps) {
  return (
    <animated.div
      className="absolute inset-0 overflow-hidden"
      style={{
        opacity: visible.to((v) => v),
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
