import { animated, to, useSpring, useSpringValue } from "@react-spring/web";
import { useEffect, useRef, useState } from "react";

// ─── Debug Logger ───────────────────────────────────────────────────────────
const DEBUG_CURSOR = true;
function cursorLog(tag: string, data?: Record<string, unknown>) {
  if (!DEBUG_CURSOR) return;
  const ts = performance.now().toFixed(1);
  console.log(`[Cursor ${ts}ms] ${tag}`, data ?? "");
}

// ─── Cursor Mode (discriminated union) ──────────────────────────────────────

/** Face shown on the coin cursor */
type Face = "white" | "red";

/** Icon identifier — null means show text label instead */
type Icon =
  | "prev"
  | "play"
  | "pause"
  | "next"
  | "minimize"
  | "maximize"
  | "close"
  | null;

interface ModeBase {
  face: Face;
  /** Size in px */
  size: number;
  icon: Icon;
}

/** Free-floating: follows mouse position */
interface ModeFree extends ModeBase {
  kind: "free";
}

/** Snapped: locked to a fixed viewport coordinate */
interface ModeSnap extends ModeBase {
  kind: "snap";
  x: number;
  y: number;
  /** Position updates instantly (no spring lag), e.g. during drag */
  immediate?: boolean;
}

type CursorMode = ModeFree | ModeSnap;

// ─── Size constants ─────────────────────────────────────────────────────────
// Each responsive entry is [mobile, sm+] in px, matching Tailwind sm: (640px)

/** Default idle cursor size */
const IDLE_SIZE = 16;
/** Disc hover cursor size [mobile, desktop] */
const DISC_SIZE: [number, number] = [100, 133];
/** Disc hover cursor size in compact (level 1) [mobile, desktop] */
const DISC_SIZE_COMPACT: [number, number] = [48, 60];
/** Scrub knob size */
const SCRUB_SIZE = 12;

/** Button snap cursor sizes [mobile, desktop] */
const SNAP_SIZE: Record<string, [number, number]> = {
  prev: [32, 40],
  play: [32, 48],
  pause: [32, 48],
  next: [32, 40],
  minimize: [40, 80],
  maximize: [40, 80],
  close: [40, 80],
};

/** Icon sizes inside the cursor [mobile, desktop] */
const ICON_SIZE: Record<string, [number, number]> = {
  prev: [18, 24],
  play: [14, 20],
  pause: [14, 20],
  next: [18, 24],
  minimize: [16, 28],
  maximize: [14, 24],
  close: [20, 32],
};

/** Pick responsive value based on viewport width */
function pick(pair: [number, number], desktop: boolean): number {
  return desktop ? pair[1] : pair[0];
}

// ─── Props ──────────────────────────────────────────────────────────────────

interface CustomCursorProps {
  /** Global playing state */
  isPlaying: boolean;
  /** The disc index currently hovered, or -1 */
  hoveredDiscIndex: number;
  /** The disc index currently at the center (playing) */
  centerDiscIndex: number;
  /** Whether at level 1 (compact browse mode) */
  compact?: boolean;
  /** Progress bar scrub position — null when not hovering/scrubbing track */
  scrubPos: { x: number; y: number } | null;
}

// ─── Icon renderer ──────────────────────────────────────────────────────────

function CursorIcon({ icon, desktop }: { icon: Icon; desktop: boolean }) {
  if (!icon) return null;
  const pair = ICON_SIZE[icon] ?? ([16, 16] as [number, number]);
  const px = pick(pair, desktop);
  const style = { width: `${px}px`, height: `${px}px` };
  switch (icon) {
    case "prev":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" style={style}>
          <path d="M6 6h2v12H6V6zm3.5 6l8.5 6V6l-8.5 6z" />
        </svg>
      );
    case "play":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" style={style}>
          <path d="M8 5v14l11-7z" />
        </svg>
      );
    case "pause":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" style={style}>
          <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
        </svg>
      );
    case "next":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" style={style}>
          <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
        </svg>
      );
    case "minimize":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          style={style}
        >
          <path d="M5 12h14" />
        </svg>
      );
    case "maximize":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          style={style}
        >
          <rect x="4" y="4" width="16" height="16" rx="2" />
        </svg>
      );
    case "close":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          style={style}
        >
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      );
  }
}

// ─── Component ──────────────────────────────────────────────────────────────

/** One full rotation every N milliseconds */
const ROTATION_PERIOD = 4000;

export function CustomCursor({
  isPlaying,
  hoveredDiscIndex,
  centerDiscIndex,
  compact = false,
  scrubPos,
}: CustomCursorProps) {
  // ── Raw inputs ────────────────────────────────────────────────────────────
  const posRef = useRef({ x: 0, y: 0 });
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const rafRef = useRef(0);
  const [mouseInPage, setMouseInPage] = useState(true);
  const mouseInPageRef = useRef(true);
  const [isTouch, setIsTouch] = useState(false);
  const [snapEl, setSnapEl] = useState<HTMLElement | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);

  // ── Responsive breakpoint ─────────────────────────────────────────────────
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 640px)");
    setIsDesktop(mq.matches);
    const onChange = () => setIsDesktop(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // ── Mouse tracking + page visibility ────────────────────────────────────
  useEffect(() => {
    // We track mouse presence via mousemove. If no move arrives for a while
    // after a genuine document-exit event, we hide. This avoids false positives
    // from layout reflows and spring animations that fire spurious mouseleave.
    let hideTimer: ReturnType<typeof setTimeout> | null = null;
    const clearHide = () => {
      if (hideTimer !== null) {
        clearTimeout(hideTimer);
        hideTimer = null;
      }
    };

    const onMove = (e: MouseEvent) => {
      posRef.current = { x: e.clientX, y: e.clientY };
      clearHide();
      if (!mouseInPageRef.current) {
        mouseInPageRef.current = true;
        setMouseInPage(true);
        cursorLog("mouseInPage → TRUE (mousemove)");
      }
      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(() => {
          setPos(posRef.current);
          rafRef.current = 0;
        });
      }
    };

    // When the pointer exits the document, schedule a hide after a short
    // grace period. If a mousemove arrives before the timer (common during
    // layout reflows), the hide is cancelled.
    const onOut = (e: MouseEvent) => {
      // mouseout with relatedTarget===null means pointer left the document
      if (e.relatedTarget !== null) return;
      // Extra guard: only consider it a real exit if the coordinate is
      // actually outside or at the edge of the viewport. Layout reflows
      // from spring animations can fire mouseout with null relatedTarget
      // while the pointer is still well within the page.
      const { clientX: x, clientY: y } = e;
      const margin = 5;
      const isOutside =
        x <= margin ||
        y <= margin ||
        x >= window.innerWidth - margin ||
        y >= window.innerHeight - margin;
      if (!isOutside) {
        cursorLog("mouseout SUPPRESSED (inside viewport)", { x, y });
        return;
      }
      clearHide();
      hideTimer = setTimeout(() => {
        hideTimer = null;
        mouseInPageRef.current = false;
        setMouseInPage(false);
        cursorLog("mouseInPage → FALSE (confirmed exit)", { x, y });
      }, 200);
    };

    const onVisChange = () => {
      if (document.hidden) {
        clearHide();
        mouseInPageRef.current = false;
        setMouseInPage(false);
        cursorLog("mouseInPage → FALSE (page hidden)");
      }
    };

    window.addEventListener("mousemove", onMove);
    document.addEventListener("mouseout", onOut);
    document.addEventListener("visibilitychange", onVisChange);
    return () => {
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseout", onOut);
      document.removeEventListener("visibilitychange", onVisChange);
      cancelAnimationFrame(rafRef.current);
      clearHide();
    };
  }, []);

  // ── Touch detection ──────────────────────────────────────────────────────
  useEffect(() => {
    const onTouch = () => {
      cursorLog("isTouch → TRUE (touchstart)");
      setIsTouch(true);
    };
    const onMouse = () => {
      cursorLog("isTouch → FALSE (mousemove once)");
      setIsTouch(false);
    };
    window.addEventListener("touchstart", onTouch, { once: true });
    window.addEventListener("mousemove", onMouse, { once: true });
    const onPointerDown = (e: PointerEvent) => {
      const touch = e.pointerType === "touch";
      cursorLog(`isTouch → ${touch} (pointerdown: ${e.pointerType})`);
      setIsTouch(touch);
    };
    window.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("touchstart", onTouch);
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("pointerdown", onPointerDown);
    };
  }, []);

  // ── Snap target detection (data-cursor-snap elements) ─────────────────────
  useEffect(() => {
    let pendingLeave: number | null = null;
    let pendingClick: number | null = null;
    // After a click clears a snap target, suppress new snap captures briefly
    // to prevent the underlying element (e.g. minimize) from re-capturing.
    let snapCooldown = false;
    let cooldownTimer: ReturnType<typeof setTimeout> | null = null;
    const startCooldown = () => {
      snapCooldown = true;
      if (cooldownTimer) clearTimeout(cooldownTimer);
      cooldownTimer = setTimeout(() => {
        snapCooldown = false;
        cooldownTimer = null;
        cursorLog("snap cooldown ENDED");
      }, 400);
    };

    const onEnter = (e: MouseEvent) => {
      if (snapCooldown) return;
      const target = e.target;
      if (!(target instanceof Element)) return;
      const el = target.closest<HTMLElement>("[data-cursor-snap]");
      if (!el) return;
      if (pendingLeave !== null) {
        cancelAnimationFrame(pendingLeave);
        pendingLeave = null;
      }
      cursorLog("snapEl SET (mouseenter)", {
        attr: el.dataset.cursorSnap,
        tag: el.tagName,
      });
      setSnapEl(el);
    };
    const onLeave = (e: MouseEvent) => {
      const target = e.target;
      if (!(target instanceof Element)) return;
      const el = target.closest<HTMLElement>("[data-cursor-snap]");
      if (!el) return;
      const related = e.relatedTarget as HTMLElement | null;
      if (related && el.contains(related)) return;
      cursorLog("snapEl mouseleave fired", {
        attr: el.dataset.cursorSnap,
        relatedTag: related?.tagName ?? null,
      });
      pendingLeave = requestAnimationFrame(() => {
        pendingLeave = null;
        if (el.isConnected) {
          const rect = el.getBoundingClientRect();
          const { x, y } = posRef.current;
          if (
            x >= rect.left &&
            x <= rect.right &&
            y >= rect.top &&
            y <= rect.bottom
          ) {
            cursorLog("snapEl leave CANCELLED (still inside rect)");
            return;
          }
        }
        cursorLog("snapEl CLEARED (mouseleave)", {
          attr: el.dataset.cursorSnap,
        });
        setSnapEl(null);
      });
    };
    const onClick = (e: MouseEvent) => {
      const target = e.target;
      if (!(target instanceof Element)) return;
      const el = target.closest<HTMLElement>("[data-cursor-snap]");
      if (!el) return;
      cursorLog("snapEl CLICK detected", {
        attr: el.dataset.cursorSnap,
      });
      let polls = 0;
      const poll = () => {
        polls++;
        if (!el.isConnected) {
          cursorLog("snapEl CLEARED (click poll: disconnected)", { polls });
          setSnapEl(null);
          startCooldown();
          return;
        }
        const style = getComputedStyle(el);
        if (
          style.pointerEvents === "none" ||
          style.visibility === "hidden" ||
          style.display === "none" ||
          Number.parseFloat(style.opacity) < 0.1
        ) {
          cursorLog("snapEl CLEARED (click poll: inactive)", {
            polls,
            pointerEvents: style.pointerEvents,
            opacity: style.opacity,
            visibility: style.visibility,
            display: style.display,
          });
          setSnapEl(null);
          startCooldown();
          return;
        }
        if (polls < 18) {
          pendingClick = requestAnimationFrame(poll);
        } else {
          cursorLog("snapEl click poll EXHAUSTED (18 frames)", {
            pointerEvents: style.pointerEvents,
            opacity: style.opacity,
          });
        }
      };
      pendingClick = requestAnimationFrame(poll);
    };
    document.addEventListener("mouseenter", onEnter, true);
    document.addEventListener("mouseleave", onLeave, true);
    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("mouseenter", onEnter, true);
      document.removeEventListener("mouseleave", onLeave, true);
      document.removeEventListener("click", onClick, true);
      if (pendingLeave !== null) cancelAnimationFrame(pendingLeave);
      if (pendingClick !== null) cancelAnimationFrame(pendingClick);
      if (cooldownTimer) clearTimeout(cooldownTimer);
    };
  }, []);

  // ── Hide system cursor ────────────────────────────────────────────────────
  useEffect(() => {
    document.body.style.cursor = "none";
    return () => {
      document.body.style.cursor = "";
    };
  }, []);

  // ── Derive CursorMode ─────────────────────────────────────────────────────
  // Auto-clear snapEl if the element is no longer visible/interactive
  // (e.g. close button fades out after click via pointer-events:none + opacity:0)
  const effectiveSnapEl = (() => {
    if (!snapEl) return null;
    if (!snapEl.isConnected) {
      cursorLog("effectiveSnapEl: CLEARED (disconnected)", {
        attr: snapEl.dataset.cursorSnap,
      });
      setSnapEl(null);
      return null;
    }
    const style = getComputedStyle(snapEl);
    if (
      style.pointerEvents === "none" ||
      style.visibility === "hidden" ||
      style.display === "none" ||
      Number.parseFloat(style.opacity) < 0.1
    ) {
      cursorLog("effectiveSnapEl: CLEARED (style check)", {
        attr: snapEl.dataset.cursorSnap,
        pointerEvents: style.pointerEvents,
        opacity: style.opacity,
        visibility: style.visibility,
        display: style.display,
      });
      setSnapEl(null);
      return null;
    }
    return snapEl;
  })();

  const visible = mouseInPage && !isTouch;
  const isHoveringDisc = hoveredDiscIndex >= 0;
  const isHoveringActiveDisc =
    isHoveringDisc && hoveredDiscIndex === centerDiscIndex;
  const mode: CursorMode = deriveMode({
    isPlaying,
    isHoveringDisc,
    isHoveringActiveDisc,
    compact,
    isDesktop,
    snapEl: effectiveSnapEl,
    scrubPos,
  });

  // DEBUG: log every render's final state
  const prevStateRef = useRef({ visible, modeKind: mode.kind, modeSize: mode.size, mouseInPage, isTouch, snapAttr: "" as string | undefined });
  const currentSnapAttr = effectiveSnapEl?.dataset.cursorSnap;
  if (
    prevStateRef.current.visible !== visible ||
    prevStateRef.current.modeKind !== mode.kind ||
    prevStateRef.current.modeSize !== mode.size ||
    prevStateRef.current.mouseInPage !== mouseInPage ||
    prevStateRef.current.isTouch !== isTouch ||
    prevStateRef.current.snapAttr !== currentSnapAttr
  ) {
    cursorLog("STATE CHANGE", {
      visible,
      mouseInPage,
      isTouch,
      "mode.kind": mode.kind,
      "mode.size": mode.size,
      "mode.face": mode.face,
      "mode.icon": mode.icon,
      snapAttr: currentSnapAttr ?? null,
      hoveredDiscIndex,
      centerDiscIndex,
    });
    prevStateRef.current = { visible, modeKind: mode.kind, modeSize: mode.size, mouseInPage, isTouch, snapAttr: currentSnapAttr };
  }


  // ── Springs ───────────────────────────────────────────────────────────────
  const isSnapped = mode.kind === "snap";
  const targetX = isSnapped ? mode.x : pos.x;
  const targetY = isSnapped ? mode.y : pos.y;
  const immediatePos = isSnapped && mode.immediate;

  // Always show at least a minimum dot (12px). The mouseInPage detection is
  // too unreliable (spurious mouseout during layout reflows) to hide entirely.
  // The cursor is only hidden for touch devices (isTouch).
  const MIN_DOT = 12;
  const targetSize = isTouch ? 0 : Math.max(mode.size, MIN_DOT);
  const targetOpacity = isTouch ? 0 : 1;

  const spring = useSpring({
    size: targetSize,
    opacity: targetOpacity,
    posX: targetX,
    posY: targetY,
    config: { mass: 1, tension: 320, friction: 22 },
    immediate: (key: string) =>
      immediatePos ? key === "posX" || key === "posY" : false,
  });

  // Flip spring: 180 = red face, 0 = white face
  const flipSpring = useSpring({
    rotateY: mode.face === "red" ? 180 : 0,
    config: { mass: 1, tension: 280, friction: 24 },
  });

  // Text rotation (spinning PLAY text on disc hover)
  const showText = isHoveringDisc && !isSnapped && mode.icon === null;
  const shouldSpin = showText && mode.face === "white";
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
          {mode.face === "white" && mode.icon ? (
            <div
              className="flex items-center justify-center w-full h-full"
              style={{ transform: "rotate(-45deg)" }}
            >
              <CursorIcon icon={mode.icon} desktop={isDesktop} />
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
          {mode.face === "red" && mode.icon ? (
            <div
              className="flex items-center justify-center w-full h-full"
              style={{ transform: "rotate(-45deg)" }}
            >
              <CursorIcon icon={mode.icon} desktop={isDesktop} />
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

// ─── Mode derivation (pure) ─────────────────────────────────────────────────

interface DeriveInput {
  isPlaying: boolean;
  isHoveringDisc: boolean;
  isHoveringActiveDisc: boolean;
  compact: boolean;
  isDesktop: boolean;
  snapEl: HTMLElement | null;
  scrubPos: { x: number; y: number } | null;
}

function deriveMode(input: DeriveInput): CursorMode {
  const {
    isPlaying,
    isHoveringDisc,
    isHoveringActiveDisc,
    compact,
    isDesktop,
    snapEl,
    scrubPos,
  } = input;

  // Priority 1: progress bar scrub/hover — tiny dot locked to knob position
  if (scrubPos) {
    return {
      kind: "snap",
      face: "white",
      size: SCRUB_SIZE,
      icon: null,
      x: scrubPos.x,
      y: scrubPos.y,
      immediate: true,
    };
  }

  // Priority 2: snapped to a button
  if (snapEl) {
    const attr = snapEl.dataset.cursorSnap;
    // "scrub" attr without active scrubPos means not hovering track — fall through
    if (attr === "scrub") {
      // fall through to disc/idle
    } else {
      const resolved =
        attr === "play" || attr === "pause"
          ? isPlaying
            ? "pause"
            : "play"
          : attr;

      const rect = snapEl.getBoundingClientRect();
      const size = pick(SNAP_SIZE[resolved as string] ?? [40, 40], isDesktop);
      const face: Face =
        resolved === "close" || resolved === "pause" ? "red" : "white";

      return {
        kind: "snap",
        face,
        size,
        icon: resolved as Icon,
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
    }
  }

  // Priority 3: hovering a disc — large circle with PLAY/PAUSE text
  if (isHoveringDisc) {
    const sizePair = compact ? DISC_SIZE_COMPACT : DISC_SIZE;
    const size = pick(sizePair, isDesktop);
    if (isHoveringActiveDisc && isPlaying) {
      return { kind: "free", face: "red", size, icon: null };
    }
    return { kind: "free", face: "white", size, icon: null };
  }

  // Priority 4: default idle — small white dot
  return { kind: "free", face: "white", size: IDLE_SIZE, icon: null };
}
