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
export const DISC_GAP = 60;

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

export function getVinylColor(index: number): string {
  return VINYL_PALETTES[index % 3][0];
}

/** Pick vinyl color based on index, evenly distributed */
function getVinylColors(index: number): [string, string] {
  return VINYL_PALETTES[index % 3];
}

interface VinylDiscProps {
  coord: [number, number];
  offset: [SpringValue<number>, SpringValue<number>];
  progress: SpringValue<number>;
  /** Global elapsed playback time in seconds */
  elapsed: SpringValue<number>;
  index: number;
  isCenterDisc: boolean;
  /** This disc is the globally selected disc */
  isActiveDisc: boolean;
  /** Global playback state */
  isPlaying: boolean;
  onHover: (index: number) => void;
}

/** One full disc rotation every 8 seconds of playback */
const DISC_ROTATION_PERIOD = 8;

export function VinylDisc({
  coord,
  offset,
  progress,
  elapsed,
  index,
  isCenterDisc,
  isActiveDisc,
  isPlaying,
  onHover,
}: VinylDiscProps) {
  // ── Rotation derived from elapsed time ────────────────────────────────────
  // Active disc: rotation = (elapsed / period) * 360, continuously synced.
  // Inactive disc: smoothly animate back to 0.
  const rotationSpring = useSpringValue(0, {
    config: { mass: 0.8, tension: 120, friction: 20 },
  });

  useEffect(() => {
    if (!isActiveDisc) {
      // Spin down to 0 when deactivated
      rotationSpring.start(0);
    }
  }, [isActiveDisc, rotationSpring]);

  // Active disc reads elapsed directly; inactive uses spring-to-zero
  const rotation = isActiveDisc
    ? elapsed.to((t) => (t / DISC_ROTATION_PERIOD) * 360)
    : rotationSpring;

  // Derive player mode visibility: progress 0.83→1 maps to 0→1
  const playerMode = useMemo(
    () => progress.to((p) => Math.min(1, Math.max(0, (p - 0.83) / 0.17))),
    [progress],
  );

  // Position: progress controls spacing and radial compression
  // Spacing: p=0 → tight (0.7x), p=1 → wide (1.5x)
  // Compression: p=0 → none, p=1 → outer discs pulled toward center
  const [x, y] = useMemo(() => {
    const rawX = offset[0].to((v) => v + coord[0]);
    const rawY = offset[1].to((v) => v + coord[1]);
    const SPACING_MIN = 0.3;
    const SPACING_MAX = 2.0;
    // Compression: 1/(1 + k*sqrt(dist)) — sublinear, strong in mid-range, gentle at extremes
    const COMPRESS_K = 0.015;
    return [
      to([rawX, rawY, progress], (xv, yv, p) => {
        const spacing = SPACING_MIN + (SPACING_MAX - SPACING_MIN) * p;
        const sx = xv * spacing;
        const sy = yv * spacing;
        const dist = sqrt(sx * sx + sy * sy);
        const scale = 1 / (1 + COMPRESS_K * p * sqrt(dist));
        return sx * scale;
      }),
      to([rawX, rawY, progress], (xv, yv, p) => {
        const spacing = SPACING_MIN + (SPACING_MAX - SPACING_MIN) * p;
        const sx = xv * spacing;
        const sy = yv * spacing;
        const dist = sqrt(sx * sx + sy * sy);
        const scale = 1 / (1 + COMPRESS_K * p * sqrt(dist));
        return sy * scale;
      }),
    ];
  }, [offset, coord, progress]);

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

  return (
    <animated.div
      data-vinyl-disc
      data-disc-index={index}
      className="absolute cursor-none select-none"
      onMouseEnter={() => onHover(index)}
      onMouseLeave={() => onHover(-1)}
      style={{
        // In player mode: center disc moves up, others stay
        left: to([x, playerMode], (xv, pm) => {
          if (isCenterDisc && pm > 0) {
            const interp = xv * (1 - pm);
            return `calc(50% + ${interp}px)`;
          }
          return `calc(50% + ${xv}px)`;
        }),
        top: to([y, playerMode], (yv, pm) => {
          if (isCenterDisc && pm > 0) {
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
          return max(0, 1 - pm * 3);
        }),
      }}
    >
      {/* Outer clip container */}
      <animated.div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="rounded-full overflow-hidden flex items-center justify-center relative"
        style={{
          // Size: continuous function of distance and progress
          // p=0: all uniform (0.55x compact), p=1: center=1x, far=0
          // Smooth transition based on distance, no discrete jumps
          width: to([distanceFromCenter, progress, playerMode], (d, p) => {
            const t = min(d / maxVisibleDist, 1);
            // Steep gaussian: center = 1.4, drops off quickly
            const gaussian = 0.35 + 1.45 * Math.exp(-3 * t * t);
            const uniform = 0.28;
            const size = uniform + (gaussian - uniform) * p;
            return `${max(size, 0) * DISC_SIZE}px`;
          }),
          height: to([distanceFromCenter, progress, playerMode], (d, p) => {
            const t = min(d / maxVisibleDist, 1);
            const gaussian = 0.35 + 1.45 * Math.exp(-3 * t * t);
            const uniform = 0.28;
            const size = uniform + (gaussian - uniform) * p;
            return `${max(size, 0) * DISC_SIZE}px`;
          }),
          background: vinylBase,
          border: "none",
          boxShadow: progress.to((p) => {
            const o = min(p * 2, 1);
            return `0 8px 32px rgba(0,0,0,${0.5 * o}), inset 0 3px 5px rgba(255,255,255,${0.3 * o}), inset 0 -3px 6px rgba(0,0,0,${0.5 * o})`;
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
            transform: progress.to((p) => {
              const contentScale =
                p < 0.33 ? 0.28 + (1 - 0.28) * (p / 0.33) : 1;
              return `scale(${contentScale})`;
            }),
          }}
        >
          {/* Rotation wrapper — synced to elapsed time */}
          <animated.div
            className="w-full h-full rounded-full"
            style={{
              transform: rotation.to((rot) => `rotate(${rot}deg)`),
            }}
          >
            {/* Vinyl grooves — visible only when progress > 0.3 */}
            <animated.div
              className="absolute inset-0 rounded-full"
              style={{
                background: `repeating-radial-gradient(
                circle at center,
                ${vinylBase} 0px,
                ${vinylDark} 1.5px,
                ${vinylBase} 3px
              )`,
                opacity: progress.to((p) => max(0, (p - 0.3) / 0.7) * 0.85),
              }}
            />

            {/* Subtle groove sheen overlay */}
            <animated.div
              className="absolute inset-0 rounded-full"
              style={{
                background: `repeating-radial-gradient(
                circle at center,
                transparent 0px,
                rgba(255,255,255,0.04) 2px,
                transparent 4px
              )`,
                opacity: progress.to((p) => max(0, (p - 0.3) / 0.7)),
              }}
            />

            {/* Cover art — always visible */}
            <animated.div
              className="absolute rounded-full overflow-hidden bg-cover bg-center"
              style={{
                inset: progress.to((p) =>
                  p < 0.33 ? `${(p / 0.33) * 8}%` : "8%",
                ),
                backgroundImage: `url(${coverUrl})`,
                boxShadow: "inset 0 0 3px 2px rgba(0,0,0,0.9)",
              }}
            />
          </animated.div>

          {/* Top highlight arc */}
          <animated.div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 60% 40% at 35% 25%, rgba(255,255,255,0.18) 0%, transparent 70%)",
              opacity: progress.to((p) => min(p * 2, 1)),
            }}
          />
        </animated.div>
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
