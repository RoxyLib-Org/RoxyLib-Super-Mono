import { animated, useSpring, useSpringValue } from "@react-spring/web";
import { useCallback, useMemo, useRef, useState } from "react";
import { CustomCursor } from "./CustomCursor";
import { TransportControls } from "./TransportControls";
import { HEX_RADIUS, LiquidGlassFilter, VinylDisc } from "./VinylDisc";

const { sqrt, pow } = Math;

const DIRECTIONS: [number, number][] = [
  [1, 0],
  [0.5, sqrt(3) / 2],
  [-0.5, sqrt(3) / 2],
  [-1, 0],
  [-0.5, -sqrt(3) / 2],
  [0.5, -sqrt(3) / 2],
];

/**
 * Generate hexagonal grid positions (honeycomb packing).
 * Center is [0,0], then rings expand outward.
 */
function generateHexPositions(
  spacing: number,
  count: number,
): Array<[number, number]> {
  const positions: Array<[number, number]> = [[0, 0]];
  let ring = 1;

  while (positions.length < count) {
    for (let side = 0; side < 6; side++) {
      for (let step = 0; step < ring; step++) {
        if (positions.length >= count) break;

        const x =
          ring * spacing * 2 * DIRECTIONS[side][0] -
          step *
            spacing *
            2 *
            (DIRECTIONS[side][0] - DIRECTIONS[(side + 1) % 6][0]);
        const y =
          ring * spacing * 2 * DIRECTIONS[side][1] -
          step *
            spacing *
            2 *
            (DIRECTIONS[side][1] - DIRECTIONS[(side + 1) % 6][1]);

        positions.push([x, y]);
      }
    }
    ring += 1;
  }
  return positions;
}

/** Total vinyl discs — 4 full rings = 1+6+12+18+24 = 61 */
const DISC_COUNT = 61;

/**
 * Find the index of the disc whose coord is closest to the negated offset
 * (i.e. the disc currently nearest the viewport center).
 */
function findNearestDisc(
  coords: Array<[number, number]>,
  offsetX: number,
  offsetY: number,
): number {
  let minDist = Number.POSITIVE_INFINITY;
  let nearest = 0;
  for (let i = 0; i < coords.length; i++) {
    const [cx, cy] = coords[i];
    const dist = pow(cx + offsetX, 2) + pow(cy + offsetY, 2);
    if (dist < minDist) {
      minDist = dist;
      nearest = i;
    }
  }
  return nearest;
}

/** Vinyl color palettes */
const VINYL_PALETTES: [string, string][] = [
  ["oklch(0.55 0.25 25)", "oklch(0.45 0.22 25)"],
  ["oklch(0.85 0.2 90)", "oklch(0.75 0.17 90)"],
  ["oklch(0.22 0.01 260)", "oklch(0.15 0.005 260)"],
];

function getVinylColor(index: number): string {
  return VINYL_PALETTES[index % 3][0];
}

export function VinylGrid() {
  const coords = useMemo(
    () => generateHexPositions(HEX_RADIUS, DISC_COUNT),
    [],
  );

  const [isHold, setIsHold] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hoveredDiscIndex, setHoveredDiscIndex] = useState(-1);
  const [centerDiscIndex, setCenterDiscIndex] = useState(0);
  const offsetRef = useRef([0, 0]);
  const zoomRef = useRef(0);

  const springConfig = { tension: 170, friction: 24 };
  const offsetX = useSpringValue(0, { config: springConfig });
  const offsetY = useSpringValue(0, { config: springConfig });
  const zoom = useSpringValue(0, { config: { tension: 200, friction: 26 } });

  // Background color spring
  const [bgSpring, bgApi] = useSpring(() => ({
    color: "rgb(0,0,0)",
    config: { tension: 200, friction: 26 },
  }));

  const updateCenter = useCallback(() => {
    const nearest = findNearestDisc(
      coords,
      offsetRef.current[0],
      offsetRef.current[1],
    );
    setCenterDiscIndex(nearest);
  }, [coords]);

  const snapToNearest = useCallback(() => {
    const nearest = findNearestDisc(
      coords,
      offsetRef.current[0],
      offsetRef.current[1],
    );
    const [cx, cy] = coords[nearest];
    offsetRef.current = [-cx, -cy];
    offsetX.start(-cx);
    offsetY.start(-cy);
    setCenterDiscIndex(nearest);
  }, [coords, offsetX, offsetY]);

  const handleCenter = useCallback(
    (index: number) => {
      if (index === centerDiscIndex) {
        setIsPlaying((p) => !p);
        return;
      }
      const [cx, cy] = coords[index];
      offsetRef.current = [-cx, -cy];
      offsetX.start(-cx);
      offsetY.start(-cy);
      setCenterDiscIndex(index);
      setIsPlaying(true);
      // Update background color for new center
      if (zoomRef.current > 0.5) {
        bgApi.start({ color: getVinylColor(index) });
      }
    },
    [coords, offsetX, offsetY, centerDiscIndex, bgApi],
  );

  const handlePrev = useCallback(() => {
    const prev = (centerDiscIndex - 1 + coords.length) % coords.length;
    handleCenter(prev);
  }, [centerDiscIndex, coords.length, handleCenter]);

  const handleNext = useCallback(() => {
    const next = (centerDiscIndex + 1) % coords.length;
    handleCenter(next);
  }, [centerDiscIndex, coords.length, handleCenter]);

  const handlePointerDown = useCallback(() => {
    setIsHold(true);
  }, []);

  const handlePointerUp = useCallback(() => {
    setIsHold(false);
    snapToNearest();
  }, [snapToNearest]);

  const handlePointerMove = useCallback(
    (evt: React.PointerEvent) => {
      if (!isHold) return;

      offsetRef.current[0] += evt.movementX;
      offsetRef.current[1] += evt.movementY;

      offsetX.start(offsetRef.current[0]);
      offsetY.start(offsetRef.current[1]);
      updateCenter();
    },
    [isHold, offsetX, offsetY, updateCenter],
  );

  const handleWheel = useCallback(
    (evt: React.WheelEvent) => {
      evt.preventDefault();
      const delta = evt.deltaY > 0 ? 0.05 : -0.05;
      const next = Math.max(0, Math.min(1, zoomRef.current + delta));
      zoomRef.current = next;
      zoom.start(next);

      // Background: lerp to vinyl color when zoomed in
      if (next > 0.5) {
        bgApi.start({ color: getVinylColor(centerDiscIndex) });
      } else {
        bgApi.start({ color: "rgb(0,0,0)" });
      }
    },
    [zoom, bgApi, centerDiscIndex],
  );

  return (
    <div
      className="relative w-full h-screen overflow-hidden touch-none select-none cursor-none"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onPointerMove={handlePointerMove}
      onWheel={handleWheel}
    >
      {/* SVG filter definition for liquid glass distortion */}
      <LiquidGlassFilter />

      {/* Animated background */}
      <animated.div
        className="absolute inset-0"
        style={{ backgroundColor: bgSpring.color }}
      />

      {/* Disc grid layer */}
      <div className="relative w-full h-full">
        {coords.map((coord, idx) => (
          <VinylDisc
            key={idx}
            coord={coord}
            offset={[offsetX, offsetY]}
            zoom={zoom}
            index={idx}
            isPlaying={isPlaying}
            isCenterDisc={idx === centerDiscIndex}
            onCenter={handleCenter}
            onHover={setHoveredDiscIndex}
          />
        ))}
      </div>

      {/* Transport controls — visible when zoomed in */}
      <TransportControls
        zoom={zoom}
        isPlaying={isPlaying}
        onPlayPause={() => setIsPlaying((p) => !p)}
        onPrev={handlePrev}
        onNext={handleNext}
      />

      <CustomCursor
        isPlaying={isPlaying}
        hoveredDiscIndex={hoveredDiscIndex}
        centerDiscIndex={centerDiscIndex}
      />
    </div>
  );
}
