import { animated, useSpring, useSpringValue } from "@react-spring/web";
import { useEffect, useRef, useState } from "react";

const SMALL_SIZE = 40;
const LARGE_SIZE = 133;

interface CustomCursorProps {
  /** Global playing state */
  isPlaying: boolean;
  /** The disc index currently hovered, or -1 */
  hoveredDiscIndex: number;
  /** The disc index currently at the center (playing) */
  centerDiscIndex: number;
  /** Whether at level 1 (compact browse mode) */
  compact?: boolean;
}

/** One full rotation every N milliseconds */
const ROTATION_PERIOD = 4000;

export function CustomCursor({
  isPlaying,
  hoveredDiscIndex,
  centerDiscIndex,
  compact = false,
}: CustomCursorProps) {
  const posRef = useRef({ x: 0, y: 0 });
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const rafRef = useRef(0);
  const [mouseInPage, setMouseInPage] = useState(true);

  useEffect(() => {
    const onLeave = () => setMouseInPage(false);
    const onEnter = () => setMouseInPage(true);
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("mouseenter", onEnter);
    return () => {
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mouseenter", onEnter);
    };
  }, []);

  const isHoveringDisc = hoveredDiscIndex >= 0;
  const showPause =
    isPlaying && isHoveringDisc && hoveredDiscIndex === centerDiscIndex;
  const _label = showPause ? "PAUSE" : "PLAY";
  // Cursor text spins when showing PLAY, stops for PAUSE
  const shouldSpin = !showPause;

  // Size + text opacity spring
  const visible = mouseInPage;
  const smallSize = compact ? 16 : SMALL_SIZE;
  const largeSize = compact ? 60 : LARGE_SIZE;
  const spring = useSpring({
    size: !visible ? 0 : isHoveringDisc ? largeSize : smallSize,
    textOpacity: !visible ? 0 : isHoveringDisc ? 1 : 0,
    opacity: visible ? 1 : 0,
    config: { mass: 1, tension: 320, friction: 22 },
  });

  // Rotation driven by play time — spring value for smooth interpolation
  const rotationRef = useRef(0);
  const playStartRef = useRef(0);
  const animFrameRef = useRef(0);
  const rotateSpring = useSpringValue(0, {
    config: { mass: 1, tension: 180, friction: 26 },
  });

  useEffect(() => {
    if (shouldSpin && isHoveringDisc) {
      // Spin the PLAY text
      playStartRef.current =
        performance.now() - rotationRef.current * (ROTATION_PERIOD / 360);

      const tick = () => {
        const elapsed = performance.now() - playStartRef.current;
        const degrees = (elapsed / ROTATION_PERIOD) * 360;
        rotationRef.current = degrees % 360;
        rotateSpring.set(rotationRef.current);
        animFrameRef.current = requestAnimationFrame(tick);
      };
      animFrameRef.current = requestAnimationFrame(tick);

      return () => {
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      };
    }
    // Not spinning (PAUSE or not hovering): spring back to 0
    const current = rotationRef.current % 360;
    if (current > 180) {
      rotateSpring.start(360, {
        config: { mass: 1, tension: 180, friction: 26 },
      });
    } else {
      rotateSpring.start(0, {
        config: { mass: 1, tension: 180, friction: 26 },
      });
    }
    rotationRef.current = 0;
  }, [shouldSpin, isHoveringDisc, rotateSpring]);

  // Track mouse position via RAF
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      posRef.current = { x: e.clientX, y: e.clientY };
      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(() => {
          setPos(posRef.current);
          rafRef.current = 0;
        });
      }
    };
    document.addEventListener("mousemove", onMove);
    return () => {
      document.removeEventListener("mousemove", onMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Hide system cursor
  useEffect(() => {
    document.body.style.cursor = "none";
    return () => {
      document.body.style.cursor = "";
    };
  }, []);

  // Flip spring: 0 = PLAY face, 180 = PAUSE face
  const flipSpring = useSpring({
    rotateY: showPause ? 180 : 0,
    config: { mass: 1, tension: 280, friction: 24 },
  });

  return (
    <animated.div
      className="fixed top-0 left-0 pointer-events-none z-[9999]"
      style={{
        transform: `translate(${pos.x}px, ${pos.y}px) translate(-50%, -50%)`,
        width: spring.size.to((s) => `${s}px`),
        height: spring.size.to((s) => `${s}px`),
        opacity: spring.opacity,
        perspective: "300px",
      }}
    >
      {/* 3D flip container */}
      <animated.div
        className="relative w-full h-full"
        style={{
          transformStyle: "preserve-3d",
          transform: flipSpring.rotateY.to(
            (r) => `rotateZ(45deg) rotateY(${r}deg)`,
          ),
        }}
      >
        {/* PLAY face (front) */}
        <animated.div
          className="absolute inset-0 rounded-full bg-white flex items-center justify-center"
          style={{
            backfaceVisibility: "hidden",
          }}
        >
          <animated.span
            className="text-black font-bold text-base tracking-wider select-none"
            style={{
              opacity: spring.textOpacity,
              transform: rotateSpring.to((r) => `rotate(${-45 + r}deg)`),
            }}
          >
            PLAY
          </animated.span>
        </animated.div>

        {/* PAUSE face (back, pre-rotated 180deg) */}
        <animated.div
          className="absolute inset-0 rounded-full flex items-center justify-center"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            background: "oklch(0.5 0.25 25)",
          }}
        >
          <animated.span
            className="text-white font-bold text-base tracking-wider select-none"
            style={{ opacity: spring.textOpacity, transform: "rotate(-45deg)" }}
          >
            PAUSE
          </animated.span>
        </animated.div>
      </animated.div>
    </animated.div>
  );
}
