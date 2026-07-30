import { animated, to, useSpring, useSpringValue } from "@react-spring/web";
import { useEffect, useRef, useState } from "react";

// ─── Types ──────────────────────────────────────────────────────────────────

type Face = "white" | "red";
type Icon = "prev" | "play" | "pause" | "next" | "minimize" | "maximize" | "close" | null;

interface CursorStyle {
  size: number;
  face: Face;
  icon: Icon;
  /** If set, cursor snaps to this position instead of following the mouse */
  snapTo?: { x: number; y: number };
  /** If true, snap position is applied immediately (no spring) */
  immediate?: boolean;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const IDLE_SIZE = 16;
const DISC_SIZE: [number, number] = [100, 133];
const DISC_SIZE_COMPACT: [number, number] = [48, 60];
const SCRUB_SIZE = 12;

const SNAP_SIZE: Record<string, [number, number]> = {
  prev: [36, 48],
  play: [48, 64],
  pause: [48, 64],
  next: [36, 48],
  minimize: [44, 80],
  maximize: [44, 80],
  close: [44, 80],
};

const ICON_SIZE: Record<string, [number, number]> = {
  prev: [16, 22],
  play: [20, 28],
  pause: [20, 28],
  next: [16, 22],
  minimize: [20, 30],
  maximize: [20, 30],
  close: [18, 28],
};

function pick(pair: [number, number], desktop: boolean): number {
  return desktop ? pair[1] : pair[0];
}

// ─── Props ──────────────────────────────────────────────────────────────────

interface CustomCursorProps {
  isPlaying: boolean;
  hoveredDiscIndex: number;
  centerDiscIndex: number;
  compact?: boolean;
  /** Scrub knob position (from TransportControls) */
  scrubPos: { x: number; y: number } | null;
}

// ─── Style registry: target name → CursorStyle ─────────────────────────────

function resolveStyle(
  target: string | null,
  ctx: {
    isPlaying: boolean;
    isActiveDisc: boolean;
    compact: boolean;
    desktop: boolean;
    scrubPos: { x: number; y: number } | null;
  },
): CursorStyle {
  // Priority 1: scrub (progress bar hover/drag)
  if (target === "scrub" && ctx.scrubPos) {
    return {
      size: SCRUB_SIZE,
      face: "white",
      icon: null,
      snapTo: ctx.scrubPos,
      immediate: true,
    };
  }

  // Priority 2: button snaps
  if (target && target !== "scrub" && target !== "disc") {
    const resolved =
      target === "play" || target === "pause"
        ? ctx.isPlaying
          ? "pause"
          : "play"
        : target;

    const size = pick(SNAP_SIZE[resolved] ?? [40, 40], ctx.desktop);
    const face: Face = resolved === "close" || resolved === "pause" ? "red" : "white";
    // snapTo is computed from element rect in the effect — passed via a ref
    return { size, face, icon: resolved as Icon };
  }

  // Priority 3: disc hover
  if (target === "disc") {
    const sizePair = ctx.compact ? DISC_SIZE_COMPACT : DISC_SIZE;
    const size = pick(sizePair, ctx.desktop);
    if (ctx.isActiveDisc && ctx.isPlaying) {
      return { size, face: "red", icon: null };
    }
    return { size, face: "white", icon: null };
  }

  // Priority 4: idle
  return { size: IDLE_SIZE, face: "white", icon: null };
}

// ─── Icon renderer ──────────────────────────────────────────────────────────

function CursorIcon({ icon, desktop }: { icon: Icon; desktop: boolean }) {
  if (!icon) return null;
  const s = pick(ICON_SIZE[icon] ?? [20, 20], desktop);
  switch (icon) {
    case "play":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7z" />
        </svg>
      );
    case "pause":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
        </svg>
      );
    case "prev":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" />
        </svg>
      );
    case "next":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
        </svg>
      );
    case "minimize":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M5 12h14" />
        </svg>
      );
    case "maximize":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 3 21 3 21 9" />
          <polyline points="9 21 3 21 3 15" />
          <line x1="21" y1="3" x2="14" y2="10" />
          <line x1="3" y1="21" x2="10" y2="14" />
        </svg>
      );
    case "close":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      );
    default:
      return null;
  }
}

// ─── Component ──────────────────────────────────────────────────────────────

const ROTATION_PERIOD = 4000;
const MIN_SIZE = 12;

export function CustomCursor({
  isPlaying,
  hoveredDiscIndex,
  centerDiscIndex,
  compact = false,
  scrubPos,
}: CustomCursorProps) {
  // ── Single mutable pos (mouse position) ───────────────────────────────────
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const posRef = useRef({ x: 0, y: 0 });
  const rafId = useRef(0);

  // ── Hovered target: the `data-cursor` value under the pointer ─────────────
  const [target, setTarget] = useState<string | null>(null);
  // Element ref for snap positioning (buttons)
  const targetElRef = useRef<HTMLElement | null>(null);

  // ── Visibility: hidden only on touch devices ──────────────────────────────
  const [isTouch, setIsTouch] = useState(false);
  const [visible, setVisible] = useState(true);

  // ── Desktop breakpoint ────────────────────────────────────────────────────
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 640px)");
    setIsDesktop(mq.matches);
    const h = () => setIsDesktop(mq.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);

  // ── Pointer tracking + target detection (ONE event handler) ───────────────
  useEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return; // ignore touch
      posRef.current = { x: e.clientX, y: e.clientY };
      if (!rafId.current) {
        rafId.current = requestAnimationFrame(() => {
          setPos(posRef.current);
          rafId.current = 0;
        });
      }
      if (!visible) setVisible(true);

      // Find the closest [data-cursor] ancestor of the event target
      const el = (e.target as Element)?.closest?.("[data-cursor]") as HTMLElement | null;
      const newTarget = el?.dataset.cursor ?? null;
      targetElRef.current = el;
      setTarget(newTarget);
    };

    const onPointerLeave = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      // Only hide when pointer actually leaves the document
      if (!e.relatedTarget && e.target === document.documentElement) {
        setVisible(false);
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      setIsTouch(e.pointerType === "touch");
    };

    window.addEventListener("pointermove", onPointerMove);
    document.documentElement.addEventListener("pointerleave", onPointerLeave);
    window.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      document.documentElement.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("pointerdown", onPointerDown);
      cancelAnimationFrame(rafId.current);
    };
  }, [visible]);

  // ── Hide system cursor ────────────────────────────────────────────────────
  useEffect(() => {
    document.body.style.cursor = "none";
    return () => { document.body.style.cursor = ""; };
  }, []);

  // ── Derive cursor style via pattern matching ──────────────────────────────
  const isActiveDisc = hoveredDiscIndex >= 0 && hoveredDiscIndex === centerDiscIndex;

  // Map hoveredDiscIndex to target (disc hover comes from VinylDisc mouseenter)
  const effectiveTarget = hoveredDiscIndex >= 0 && target === null ? "disc" : target;

  const style = resolveStyle(effectiveTarget, {
    isPlaying,
    isActiveDisc,
    compact,
    desktop: isDesktop,
    scrubPos,
  });

  // Compute snap position for button targets
  let snapPos: { x: number; y: number } | undefined = style.snapTo;
  if (!snapPos && targetElRef.current && effectiveTarget && effectiveTarget !== "disc" && effectiveTarget !== "scrub") {
    const rect = targetElRef.current.getBoundingClientRect();
    snapPos = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  }

  const isSnapped = !!snapPos;
  const targetX = snapPos?.x ?? pos.x;
  const targetY = snapPos?.y ?? pos.y;
  const targetSize = isTouch ? 0 : Math.max(style.size, MIN_SIZE);
  const targetOpacity = isTouch || !visible ? 0 : 1;

  // ── Springs ───────────────────────────────────────────────────────────────
  const spring = useSpring({
    size: targetSize,
    opacity: targetOpacity,
    posX: targetX,
    posY: targetY,
    config: { mass: 1, tension: 320, friction: 22 },
    immediate: (key: string) =>
      style.immediate ? key === "posX" || key === "posY" : false,
  });

  const flipSpring = useSpring({
    rotateY: style.face === "red" ? 180 : 0,
    config: { mass: 1, tension: 280, friction: 24 },
  });

  // ── PLAY text rotation ────────────────────────────────────────────────────
  const showText = effectiveTarget === "disc" && !isSnapped && style.icon === null;
  const shouldSpin = showText && style.face === "white";
  const rotationRef = useRef(0);
  const playStartRef = useRef(0);
  const animFrameRef = useRef(0);
  const rotateSpring = useSpringValue(0, {
    config: { mass: 1, tension: 180, friction: 26 },
  });

  useEffect(() => {
    if (!shouldSpin) {
      cancelAnimationFrame(animFrameRef.current);
      return;
    }
    playStartRef.current = performance.now();
    const base = rotationRef.current;
    const tick = () => {
      const elapsed = performance.now() - playStartRef.current;
      const r = base + (elapsed / ROTATION_PERIOD) * 360;
      rotationRef.current = r;
      rotateSpring.set(r);
      animFrameRef.current = requestAnimationFrame(tick);
    };
    animFrameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [shouldSpin, rotateSpring]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <animated.div
      className="fixed top-0 left-0 pointer-events-none z-[9999]"
      style={{
        transform: to(
          [spring.posX, spring.posY],
          (x, y) => `translate(${x}px, ${y}px) translate(-50%, -50%)`,
        ),
        width: spring.size.to((s) => `${s}px`),
        height: spring.size.to((s) => `${s}px`),
        opacity: spring.opacity,
        perspective: "300px",
      }}
    >
      <animated.div
        className="relative w-full h-full"
        style={{
          transformStyle: "preserve-3d",
          transform: flipSpring.rotateY.to(
            (r) => `rotateZ(45deg) rotateY(${r}deg)`,
          ),
        }}
      >
        {/* Front face (white) */}
        <animated.div
          className="absolute inset-0 rounded-full bg-white flex items-center justify-center text-black"
          style={{ backfaceVisibility: "hidden" }}
        >
          {style.face === "white" && style.icon ? (
            <div
              className="flex items-center justify-center w-full h-full"
              style={{ transform: "rotate(-45deg)" }}
            >
              <CursorIcon icon={style.icon} desktop={isDesktop} />
            </div>
          ) : (
            <animated.span
              className="font-bold text-base tracking-wider select-none"
              style={{
                opacity: showText ? 1 : 0,
                transform: rotateSpring.to((r) => `rotate(${-45 + r}deg)`),
              }}
            >
              PLAY
            </animated.span>
          )}
        </animated.div>

        {/* Back face (red) */}
        <animated.div
          className="absolute inset-0 rounded-full flex items-center justify-center text-white"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            background: "oklch(0.5 0.25 25)",
          }}
        >
          {style.face === "red" && style.icon ? (
            <div
              className="flex items-center justify-center w-full h-full"
              style={{ transform: "rotate(-45deg)" }}
            >
              <CursorIcon icon={style.icon} desktop={isDesktop} />
            </div>
          ) : (
            <animated.span
              className="font-bold text-base tracking-wider select-none"
              style={{
                opacity: showText ? 1 : 0,
                transform: "rotate(-45deg)",
              }}
            >
              PAUSE
            </animated.span>
          )}
        </animated.div>
      </animated.div>
    </animated.div>
  );
}
