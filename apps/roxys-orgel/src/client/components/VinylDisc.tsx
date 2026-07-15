import { animated, type SpringValue, to, useSpring } from "@react-spring/web";
import { useCallback, useMemo, useRef } from "react";
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
  ["oklch(0.55 0.25 25)", "oklch(0.45 0.22 25)"],   // red
  ["oklch(0.85 0.2 90)", "oklch(0.75 0.17 90)"],    // yellow (brighter)
  ["oklch(0.22 0.01 260)", "oklch(0.15 0.005 260)"], // black (deeper)
];

/** Pick vinyl color based on index, evenly distributed */
function getVinylColors(index: number): [string, string] {
  return VINYL_PALETTES[index % 3];
}

interface VinylDiscProps {
  coord: [number, number];
  offset: [SpringValue<number>, SpringValue<number>];
  index: number;
  onCenter: (index: number) => void;
}

/**
 * Vinyl disc with liquid glass outer ring:
 * - Outer ring: SVG displacement + backdrop-blur frosted glass (reveals distorted background)
 * - Inner area: full circular cover art image
 */
export function VinylDisc({ coord, offset, index, onCenter }: VinylDiscProps) {
  const [x, y] = useMemo(
    () => [
      offset[0].to((v) => v + coord[0]),
      offset[1].to((v) => v + coord[1]),
    ],
    [offset, coord],
  );

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
      className="absolute cursor-pointer select-none"
      onClick={() => onCenter(index)}
      style={{
        left: x.to((v) => `calc(50% + ${v}px)`),
        top: y.to((v) => `calc(50% + ${v}px)`),
        transform: "translate(-50%, -50%)",
        pointerEvents: distanceFromCenter.to((d) =>
          d > maxVisibleDist ? "none" : "auto",
        ),
      }}
    >
      {/* Outer clip container — carries all 3D effects + clips content */}
      <animated.div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="rounded-full overflow-hidden flex items-center justify-center relative"
        style={{
          width: distanceFromCenter.to((d) => {
            const t = min(d / maxVisibleDist, 1);
            const s = 0.25 + 1.15 * Math.exp(-5 * t * t);
            return `${max(s, 0.2) * DISC_SIZE}px`;
          }),
          height: distanceFromCenter.to((d) => {
            const t = min(d / maxVisibleDist, 1);
            const s = 0.25 + 1.15 * Math.exp(-5 * t * t);
            return `${max(s, 0.2) * DISC_SIZE}px`;
          }),
          background: vinylBase,
          boxShadow:
            "0 8px 32px rgba(0,0,0,0.5), inset 0 3px 5px rgba(255,255,255,0.3), inset 0 -3px 6px rgba(0,0,0,0.5)",
          transform: to(
            [distanceFromCenter, tiltSpring.rx, tiltSpring.ry],
            (d, rx, ry) => {
              const t = min(d / maxVisibleDist, 1);
              const strength = max(0, 1 - t / 0.3);
              return `perspective(400px) rotateX(${rx * strength}deg) rotateY(${ry * strength}deg)`;
            },
          ),
        }}
      >
        {/* Inner disc content at fixed size — clipped by parent */}
        <div
          className="relative rounded-full shrink-0"
          style={{ width: DISC_SIZE, height: DISC_SIZE }}
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
          <div
            className="absolute rounded-full overflow-hidden bg-cover bg-center"
            style={{
              inset: "8%",
              backgroundImage: `url(${coverUrl})`,
              boxShadow: "inset 0 0 3px 2px rgba(0,0,0,0.9)",
            }}
          />
        </div>

        {/* Top highlight arc — rendered above content, still inside clip */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 60% 40% at 35% 25%, rgba(255,255,255,0.18) 0%, transparent 70%)",
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
