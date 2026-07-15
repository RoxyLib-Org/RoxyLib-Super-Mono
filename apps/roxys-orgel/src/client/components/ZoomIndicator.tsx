import type { SpringValue } from "@react-spring/web";
import { animated, useSpring } from "@react-spring/web";
import { useEffect, useRef, useState } from "react";

interface ZoomIndicatorProps {
  progress: SpringValue<number>;
}

/**
 * Zoom level indicator: shows "x0.00" with scrolling tick marks behind.
 * - Fades in when progress changes, fades out after idle
 * - Between progress 0.66→1.0 also fades to 0 (avoid player controls conflict)
 */
export function ZoomIndicator({ progress }: ZoomIndicatorProps) {
  const [value, setValue] = useState(0.66);
  const [visible, setVisible] = useState(false);
  const hideTimerRef = useRef(0);
  const prevValueRef = useRef(0.66);

  // Poll spring value via rAF
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const v = progress.get();
      if (Math.abs(v - prevValueRef.current) > 0.001) {
        setValue(v);
        setVisible(true);
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = window.setTimeout(() => {
          setVisible(false);
        }, 1200);
        prevValueRef.current = v;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(hideTimerRef.current);
    };
  }, [progress]);

  // Opacity: base fade + level 3→4 fade
  // At progress 0.66→1.0: map to 1→0
  const levelFade = value > 0.66 ? 1 - (value - 0.66) / 0.34 : 1;
  const targetOpacity = visible ? Math.max(0, levelFade) : 0;

  const spring = useSpring({
    opacity: targetOpacity,
    config: { tension: 300, friction: 26 },
  });

  // Display value: map progress 0-1 to a "zoom" display (e.g. x1.00 to x4.00)
  const displayZoom = (1 + value * 3).toFixed(2);

  // Tick marks: scrolling based on value
  // Each 0.5 unit = one tick, each 1.0 = red tick
  // Total range 0-1 mapped to 0-4 in display
  const displayValue = 1 + value * 3; // 1.0 to 4.0
  const TICK_HEIGHT = 8; // px per 0.1 unit
  const RANGE = 2.0; // visible range in display units
  const tickOffset = displayValue * TICK_HEIGHT * 10; // scroll position

  // Generate tick marks for the visible range
  const ticks: Array<{ pos: number; isHalf: boolean; isFull: boolean }> = [];
  const startUnit = Math.floor((displayValue - RANGE / 2) * 10) / 10;
  const endUnit = Math.ceil((displayValue + RANGE / 2) * 10) / 10;
  for (let u = startUnit; u <= endUnit; u += 0.1) {
    const roundedU = Math.round(u * 10) / 10;
    const isHalf = Math.abs(roundedU % 0.5) < 0.01;
    const isFull = Math.abs(roundedU % 1.0) < 0.01;
    const pos = (roundedU - displayValue) * TICK_HEIGHT * 10;
    ticks.push({ pos, isHalf, isFull });
  }

  return (
    <animated.div
      className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
      style={{
        bottom: "15%",
        opacity: spring.opacity,
      }}
    >
      <div
        className="relative flex items-center justify-center"
        style={{ width: "80px", height: "60px" }}
      >
        {/* Tick ruler — full width behind text */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{
            maskImage:
              "linear-gradient(to bottom, transparent, white 25%, white 75%, transparent)",
            WebkitMaskImage:
              "linear-gradient(to bottom, transparent, white 25%, white 75%, transparent)",
          }}
        >
          <div
            className="absolute inset-x-0"
            style={{
              top: "50%",
              transform: `translateY(-${tickOffset % (TICK_HEIGHT * 10)}px)`,
            }}
          >
            {ticks.map((tick, i) => (
              <div
                key={i}
                className="absolute"
                style={{
                  top: `${tick.pos}px`,
                  left: "50%",
                  transform: "translateX(-50%)",
                  height: tick.isFull ? "2px" : "1px",
                  width: tick.isFull || tick.isHalf ? "100%" : "30%",
                  backgroundColor: tick.isFull
                    ? "rgba(239, 68, 68, 0.5)"
                    : tick.isHalf
                      ? "rgba(255, 255, 255, 0.3)"
                      : "rgba(255, 255, 255, 0.15)",
                }}
              />
            ))}
          </div>
        </div>

        {/* Zoom number — on top */}
        <div className="relative text-white/90 text-sm font-mono tracking-wider tabular-nums">
          x{displayZoom}
        </div>
      </div>
    </animated.div>
  );
}
