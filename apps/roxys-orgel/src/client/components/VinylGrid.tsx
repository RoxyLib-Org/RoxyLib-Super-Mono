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
 * 4 zoom levels (snap targets):
 * 0 = minimum compression + solid border
 * 1 = mild compression
 * 2 = near-original (no compression feel)
 * 3 = max — triggers player mode
 */
const ZOOM_LEVELS = [0, 0.33, 0.66, 1] as const;

function snapToLevel(value: number): number {
  let closest = 0;
  let minDist = Math.abs(value - ZOOM_LEVELS[0]);
  for (let i = 1; i < ZOOM_LEVELS.length; i++) {
    const d = Math.abs(value - ZOOM_LEVELS[i]);
    if (d < minDist) {
      minDist = d;
      closest = i;
    }
  }
  return ZOOM_LEVELS[closest];
}

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
  const [playerMode, setPlayerMode] = useState(false);
  const [hoveredDiscIndex, setHoveredDiscIndex] = useState(-1);
  const [centerDiscIndex, setCenterDiscIndex] = useState(0);
  const offsetRef = useRef([0, 0]);
  const zoomRef = useRef(0);
  const snapTimerRef = useRef(0);

  const springConfig = { tension: 170, friction: 24 };
  const offsetX = useSpringValue(0, { config: springConfig });
  const offsetY = useSpringValue(0, { config: springConfig });
  const zoom = useSpringValue(0, { config: { tension: 200, friction: 26 } });

  // Player mode spring (0 = grid, 1 = player)
  const playerSpring = useSpringValue(0, {
    config: { tension: 160, friction: 22 },
  });

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

  const enterPlayerMode = useCallback(
    (discIndex: number) => {
      setPlayerMode(true);
      setIsPlaying(true);
      playerSpring.start(1);
      bgApi.start({ color: getVinylColor(discIndex) });
    },
    [playerSpring, bgApi],
  );

  const exitPlayerMode = useCallback(() => {
    setPlayerMode(false);
    playerSpring.start(0);
    bgApi.start({ color: "rgb(0,0,0)" });
  }, [playerSpring, bgApi]);

  const scheduleSnap = useCallback(() => {
    clearTimeout(snapTimerRef.current);
    snapTimerRef.current = window.setTimeout(() => {
      const snapped = snapToLevel(zoomRef.current);
      zoomRef.current = snapped;
      zoom.start(snapped);

      // Level 3 (max) triggers player mode
      if (snapped >= 1) {
        enterPlayerMode(centerDiscIndex);
      }
    }, 150);
  }, [zoom, enterPlayerMode, centerDiscIndex]);

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
      if (playerMode) {
        bgApi.start({ color: getVinylColor(index) });
      }
    },
    [coords, offsetX, offsetY, centerDiscIndex, playerMode, bgApi],
  );

  const handlePrev = useCallback(() => {
    const prev = (centerDiscIndex - 1 + coords.length) % coords.length;
    const [cx, cy] = coords[prev];
    offsetRef.current = [-cx, -cy];
    offsetX.start(-cx);
    offsetY.start(-cy);
    setCenterDiscIndex(prev);
    setIsPlaying(true);
    bgApi.start({ color: getVinylColor(prev) });
  }, [centerDiscIndex, coords, offsetX, offsetY, bgApi]);

  const handleNext = useCallback(() => {
    const next = (centerDiscIndex + 1) % coords.length;
    const [cx, cy] = coords[next];
    offsetRef.current = [-cx, -cy];
    offsetX.start(-cx);
    offsetY.start(-cy);
    setCenterDiscIndex(next);
    setIsPlaying(true);
    bgApi.start({ color: getVinylColor(next) });
  }, [centerDiscIndex, coords, offsetX, offsetY, bgApi]);

  const handlePointerDown = useCallback(() => {
    if (!playerMode) setIsHold(true);
  }, [playerMode]);

  const handlePointerUp = useCallback(() => {
    if (!playerMode) {
      setIsHold(false);
      snapToNearest();
    }
  }, [playerMode, snapToNearest]);

  const handlePointerMove = useCallback(
    (evt: React.PointerEvent) => {
      if (!isHold || playerMode) return;

      offsetRef.current[0] += evt.movementX;
      offsetRef.current[1] += evt.movementY;

      offsetX.start(offsetRef.current[0]);
      offsetY.start(offsetRef.current[1]);
      updateCenter();
    },
    [isHold, playerMode, offsetX, offsetY, updateCenter],
  );

  const handleWheel = useCallback(
    (evt: React.WheelEvent) => {
      evt.preventDefault();

      if (playerMode) {
        // In player mode, scroll down exits
        if (evt.deltaY > 0) {
          exitPlayerMode();
          // Snap to level 2 (one below max)
          zoomRef.current = ZOOM_LEVELS[2];
          zoom.start(ZOOM_LEVELS[2]);
        }
        return;
      }

      // Scroll up → increase zoom, scroll down → decrease
      const delta = evt.deltaY > 0 ? -0.04 : 0.04;
      const next = Math.max(0, Math.min(1, zoomRef.current + delta));
      zoomRef.current = next;
      zoom.start(next);

      // Schedule snap to nearest level after scrolling stops
      scheduleSnap();
    },
    [zoom, playerMode, exitPlayerMode, scheduleSnap],
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
            playerMode={playerSpring}
            index={idx}
            isPlaying={isPlaying}
            isCenterDisc={idx === centerDiscIndex}
            onCenter={handleCenter}
            onHover={setHoveredDiscIndex}
          />
        ))}
      </div>

      {/* Transport controls — visible in player mode */}
      <TransportControls
        visible={playerSpring}
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
