import {
  animated,
  type SpringValue,
  to,
  useSpring,
  useSpringValue,
} from "@react-spring/web";
import { useCallback, useEffect, useMemo, useRef } from "react";

const { sqrt, min, max, pow } = Math;

/** Diameter of each disc in px (base size) */
export const DISC_SIZE = 300;

/** Gap between discs (center-to-center = DISC_SIZE + GAP) */
export const DISC_GAP = 100;

/** Hex grid spacing radius (half the center-to-center distance) */
export const HEX_RADIUS = (DISC_SIZE + DISC_GAP) / 2;

/** Placeholder cover art images */
const PLACEHOLDER_COVERS = [
  "https://picsum.photos/seed/vinyl0/400/400",
  "https://picsum.photos/seed/vinyl1/400/400",
  "https://picsum.photos/seed/vinyl2/400/400",
  "https://picsum.photos/seed/vinyl3/400/400",
  "https://picsum.photos/seed/vinyl4/400/400",
  "https://picsum.photos/seed/vinyl5/400/400",
  "https://picsum.photos/seed/vinyl6/400/400",
  "https://picsum.photos/seed/vinyl7/400/400",
  "https://picsum.photos/seed/vinyl8/400/400",
  "https://picsum.photos/seed/vinyl9/400/400",
  "https://picsum.photos/seed/vinyl10/400/400",
  "https://picsum.photos/seed/vinyl11/400/400",
  "https://picsum.photos/seed/vinyl12/400/400",
  "https://picsum.photos/seed/vinyl13/400/400",
  "https://picsum.photos/seed/vinyl14/400/400",
  "https://picsum.photos/seed/vinyl15/400/400",
  "https://picsum.photos/seed/vinyl16/400/400",
  "https://picsum.photos/seed/vinyl17/400/400",
  "https://picsum.photos/seed/vinyl18/400/400",
  "https://picsum.photos/seed/vinyl19/400/400",
];

export function getCoverUrl(index: number): string {
  return PLACEHOLDER_COVERS[index % PLACEHOLDER_COVERS.length];
}

/** Three vinyl color palettes: red, yellow, black-grey */
const VINYL_PALETTES: [string, string][] = [
  ["oklch(0.55 0.25 25)", "oklch(0.45 0.22 25)"], // red
  ["oklch(0.85 0.2 90)", "oklch(0.75 0.17 90)"], // yellow (brighter)
  ["oklch(0.22 0.01 260)", "oklch(0.15 0.005 260)"], // black (deeper)
];

/** Pick vinyl color based on index, evenly distributed */
function getVinylColors(index: number): [string, string] {
  return VINYL_PALETTES[index % 3];
}

interface VinylDiscProps {
  coord: [number, number];
  offset: [SpringValue<number>, SpringValue<number>];
  zoom: SpringValue<number>;
  /** 0 = grid mode, 1 = player mode (single disc centered upper) */
  playerMode: SpringValue<number>;
  index: number;
  isPlaying: boolean;
  isCenterDisc: boolean;
  onCenter: (index: number) => void;
  onHover: (index: number) => void;
}

/** One full rotation period for playing disc (ms) */
const DISC_ROTATION_PERIOD = 8000;

export function VinylDisc({
  coord,
  offset,
  zoom,
  playerMode,
  index,
  isPlaying,
  isCenterDisc,
  onCenter,
  onHover,
}: VinylDiscProps) {
  const [x, y] = useMemo(() => {
    // Raw position relative to viewport center
    const rawX = offset[0].to((v) => v + coord[0]);
    const rawY = offset[1].to((v) => v + coord[1]);
    // Radial compression modulated by zoom: zoom=0 → no compression, zoom=1 → max compression
    const COMPRESS_K = 0.0003;
    return [
      to([rawX, rawY, zoom], (xv, yv, z) => {
        const dist = sqrt(xv * xv + yv * yv);
        const scale = max(0.4, 1 - COMPRESS_K * z * dist);
        return xv * scale;
      }),
      to([rawX, rawY, zoom], (xv, yv, z) => {
        const dist = sqrt(xv * xv + yv * yv);
        const scale = max(0.4, 1 - COMPRESS_K * z * dist);
        return yv * scale;
      }),
    ];
  }, [offset, coord, zoom]);

  const distanceFromCenter = useMemo(
    () => to([x, y], (xv, yv) => sqrt(pow(xv, 2) + pow(yv, 2))),
    [x, y],
  );

  const coverUrl = getCoverUrl(index);
  const [vinylBase, vinylDark] = getVinylColors(index);
  const maxVisibleDist = 800;

  // Mouse-follow 3D tilt via spring (only active when near center)
  const [tiltSpring, tiltApi] = useSpring(() => ({
    rx: 0,
    ry: 0,
    config: { mass: 1, tension: 280, friction: 20 },
  }));
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const nx = (e.clientX - cx) / (rect.width / 2);
      const ny = (e.clientY - cy) / (rect.height / 2);
      tiltApi.start({ rx: -ny * 2, ry: nx * 2 });
    },
    [tiltApi],
  );

  const handleMouseLeave = useCallback(() => {
    tiltApi.start({ rx: 0, ry: 0 });
  }, [tiltApi]);

  // Disc rotation — spring-driven for smooth return to 0
  const shouldSpin = isPlaying && isCenterDisc;
  const discRotateSpring = useSpringValue(0, {
    config: { mass: 1, tension: 120, friction: 20 },
  });
  const spinStartRef = useRef(0);
  const spinAccumRef = useRef(0);
  const spinRafRef = useRef(0);

  // When no longer center disc: reset progress, spring back to 0
  useEffect(() => {
    if (!isCenterDisc) {
      const current = spinAccumRef.current % 360;
      if (current > 0) {
        const target = current > 180 ? 360 : 0;
        discRotateSpring.start(target);
      }
      spinAccumRef.current = 0;
    }
  }, [isCenterDisc, discRotateSpring]);

  // Spin when playing + center
  useEffect(() => {
    if (shouldSpin) {
      spinStartRef.current = performance.now();
      const tick = () => {
        const elapsed = performance.now() - spinStartRef.current;
        const deg =
          spinAccumRef.current + (elapsed / DISC_ROTATION_PERIOD) * 360;
        discRotateSpring.set(deg % 360);
        spinRafRef.current = requestAnimationFrame(tick);
      };
      spinRafRef.current = requestAnimationFrame(tick);
      return () => {
        const elapsed = performance.now() - spinStartRef.current;
        spinAccumRef.current += (elapsed / DISC_ROTATION_PERIOD) * 360;
        cancelAnimationFrame(spinRafRef.current);
      };
    }
  }, [shouldSpin, discRotateSpring]);

  return (
    <animated.div
      data-vinyl-disc
      className="absolute cursor-none select-none"
      onClick={() => onCenter(index)}
      onMouseEnter={() => onHover(index)}
      onMouseLeave={() => onHover(-1)}
      style={{
        // In player mode: center disc moves to center-upper, others fade away
        left: to([x, playerMode], (xv, pm) => {
          if (pm <= 0) return `calc(50% + ${xv}px)`;
          // Center disc → viewport center, others stay
          if (isCenterDisc) {
            const target = 0; // viewport center
            const interp = xv * (1 - pm) + target * pm;
            return `calc(50% + ${interp}px)`;
          }
          return `calc(50% + ${xv}px)`;
        }),
        top: to([y, playerMode], (yv, pm) => {
          if (pm <= 0) return `calc(50% + ${yv}px)`;
          if (isCenterDisc) {
            // Move to 35% from top (centered-upper)
            const targetOffset = -window.innerHeight * 0.15;
            const interp = yv * (1 - pm) + targetOffset * pm;
            return `calc(50% + ${interp}px)`;
          }
          return `calc(50% + ${yv}px)`;
        }),
        transform: "translate(-50%, -50%)",
        pointerEvents: distanceFromCenter.to((d) =>
          d > maxVisibleDist ? "none" : "auto",
        ),
        // In player mode, non-center discs fade out
        opacity: playerMode.to((pm) => {
          if (isCenterDisc) return 1;
          return max(0, 1 - pm * 2); // fade quickly
        }),
      }}
    >
      {/* Outer clip container — carries all 3D effects + clips content */}
      <animated.div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="rounded-full overflow-hidden flex items-center justify-center relative"
        style={{
          // Size: slightly smaller at zoom=0 (compact border mode), slightly larger at zoom=1
          width: to([distanceFromCenter, zoom, playerMode], (_d, z, pm) => {
            const baseSize = 0.85 + 0.15 * z; // 0.85 → 1.0
            if (isCenterDisc && pm > 0) {
              // In player mode, center disc grows a bit
              const playerSize = 1.2;
              const s = baseSize * (1 - pm) + playerSize * pm;
              return `${s * DISC_SIZE}px`;
            }
            return `${baseSize * DISC_SIZE}px`;
          }),
          height: to([distanceFromCenter, zoom, playerMode], (_d, z, pm) => {
            const baseSize = 0.85 + 0.15 * z;
            if (isCenterDisc && pm > 0) {
              const playerSize = 1.2;
              const s = baseSize * (1 - pm) + playerSize * pm;
              return `${s * DISC_SIZE}px`;
            }
            return `${baseSize * DISC_SIZE}px`;
          }),
          background: vinylBase,
          // Border: 4px solid at zoom=0, fades out at zoom=1
          border: zoom.to((z) => {
            const borderWidth = 4 * (1 - z);
            return borderWidth > 0.5
              ? `${borderWidth}px solid ${vinylBase}`
              : "none";
          }),
          boxShadow: zoom.to((z) => {
            return `0 8px 32px rgba(0,0,0,${0.5 * z}), inset 0 3px 5px rgba(255,255,255,${0.3 * z}), inset 0 -3px 6px rgba(0,0,0,${0.5 * z})`;
          }),
          transform: to(
            [tiltSpring.rx, tiltSpring.ry],
            (rx, ry) =>
              `perspective(400px) rotateX(${rx}deg) rotateY(${ry}deg)`,
          ),
        }}
      >
        {/* Inner disc content at fixed size — clipped by parent */}
        <animated.div
          className="relative rounded-full shrink-0"
          style={{
            width: DISC_SIZE,
            height: DISC_SIZE,
            transform: discRotateSpring.to((r) => `rotate(${r}deg)`),
            // zoom controls vinyl texture visibility: 0=hidden (just border color), 1=full vinyl
            opacity: zoom.to((z) => z),
          }}
        >
          {/* Vinyl grooves — repeating radial rings with extracted color */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: `repeating-radial-gradient(
                circle at center,
                ${vinylBase} 0px,
                ${vinylDark} 1.5px,
                ${vinylBase} 3px
              )`,
              opacity: 0.85,
            }}
          />

          {/* Subtle groove sheen overlay */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: `repeating-radial-gradient(
                circle at center,
                transparent 0px,
                rgba(255,255,255,0.04) 2px,
                transparent 4px
              )`,
            }}
          />

          {/* Cover art */}
          <animated.div
            className="absolute rounded-full overflow-hidden bg-cover bg-center"
            style={{
              inset: "8%",
              backgroundImage: `url(${coverUrl})`,
              boxShadow: "inset 0 0 3px 2px rgba(0,0,0,0.9)",
            }}
          />
        </animated.div>

        {/* Top highlight arc — rendered above content, still inside clip */}
        <animated.div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 60% 40% at 35% 25%, rgba(255,255,255,0.18) 0%, transparent 70%)",
            opacity: zoom.to((z) => z),
          }}
        />
      </animated.div>
    </animated.div>
  );
}

/**
 * SVG filter replicating the CodePen liquid glass:
 * - Very slight blur on source (stdDeviation 0.003 in objectBoundingBox units)
 * - feTurbulence as displacement map (replacing the codepen's feImage PNG)
 * - feDisplacementMap for refraction
 */
export function LiquidGlassFilter() {
  return (
    <svg
      style={{ position: "absolute", width: 0, height: 0 }}
      aria-hidden="true"
    >
      <defs>
        <filter id="liquid-glass" primitiveUnits="objectBoundingBox">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.02"
            numOctaves="2"
            seed="5"
            result="map"
          />
          <feGaussianBlur
            in="SourceGraphic"
            stdDeviation="0.003"
            result="src"
          />
          <feDisplacementMap
            in="src"
            in2="map"
            scale="20"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
    </svg>
  );
}
