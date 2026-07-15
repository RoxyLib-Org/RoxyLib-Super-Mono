import { animated, useSpring, useSpringValue } from "@react-spring/web";
import { useCallback, useMemo, useRef, useState } from "react";
import { CustomCursor } from "./CustomCursor";
import { TransportControls } from "./TransportControls";
import {
  getVinylColor,
  HEX_RADIUS,
  LiquidGlassFilter,
  VinylDisc,
} from "./VinylDisc";

const { sqrt, pow, max, min } = Math;

const DIRECTIONS: [number, number][] = [
  [1, 0],
  [0.5, sqrt(3) / 2],
  [-0.5, sqrt(3) / 2],
  [-1, 0],
  [-0.5, -sqrt(3) / 2],
  [0.5, -sqrt(3) / 2],
];

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

const DISC_COUNT = 61;

const SNAP_LEVELS = [0, 0.33, 0.66, 1];

function snapToLevel(value: number): number {
  let closest = 0;
  let minDist = Math.abs(value - SNAP_LEVELS[0]);
  for (let i = 1; i < SNAP_LEVELS.length; i++) {
    const d = Math.abs(value - SNAP_LEVELS[i]);
    if (d < minDist) {
      minDist = d;
      closest = i;
    }
  }
  return SNAP_LEVELS[closest];
}

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

/**
 * Compute bounding box of hex grid coords with some padding.
 * Returns max distance from center we allow offset to reach.
 */
function computeBounds(
  coords: Array<[number, number]>,
  padding: number,
): number {
  let maxDist = 0;
  for (const [cx, cy] of coords) {
    const d = sqrt(cx * cx + cy * cy);
    if (d > maxDist) maxDist = d;
  }
  // Allow panning up to the outermost disc minus padding (keep edges visible)
  return max(0, maxDist - padding);
}

export function VinylGrid() {
  const coords = useMemo(
    () => generateHexPositions(HEX_RADIUS, DISC_COUNT),
    [],
  );

  // Max offset allowed so edges don't disappear (tight safe area)
  const maxOffset = useMemo(
    () => computeBounds(coords, HEX_RADIUS * 2),
    [coords],
  );

  const [isHold, setIsHold] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playerMode, setPlayerMode] = useState(false);
  const [hoveredDiscIndex, setHoveredDiscIndex] = useState(-1);
  const [centerDiscIndex, setCenterDiscIndex] = useState(0);
  const [playingDiscIndex, setPlayingDiscIndex] = useState(-1); // Track which disc is playing
  const offsetRef = useRef([0, 0]);
  const progressRef = useRef(0.66);
  const savedProgressRef = useRef(0.66);
  const snapTimerRef = useRef(0);

  const springConfig = { tension: 170, friction: 24 };
  const offsetX = useSpringValue(0, { config: springConfig });
  const offsetY = useSpringValue(0, { config: springConfig });
  const progress = useSpringValue(0.66, {
    config: { tension: 200, friction: 26 },
  });
  const playerSpring = useSpringValue(0, {
    config: { tension: 160, friction: 22 },
  });

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

  /** Clamp offset to safe bounds and spring back */
  const clampOffset = useCallback(() => {
    const [ox, oy] = offsetRef.current;
    const dist = sqrt(ox * ox + oy * oy);
    if (dist > maxOffset) {
      const scale = maxOffset / dist;
      offsetRef.current = [ox * scale, oy * scale];
      offsetX.start(offsetRef.current[0]);
      offsetY.start(offsetRef.current[1]);
    }
  }, [maxOffset, offsetX, offsetY]);

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
      const snapped = snapToLevel(progressRef.current);
      progressRef.current = snapped;
      progress.start(snapped);

      if (snapped >= 1) {
        enterPlayerMode(centerDiscIndex);
      }
      // Level 1: stop playback
      if (snapped === 0) {
        setIsPlaying(false);
      }
    }, 150);
  }, [progress, enterPlayerMode, centerDiscIndex]);

  const handleCenter = useCallback(
    (index: number) => {
      const isLevel1 = progressRef.current === 0;

      if (isLevel1) {
        // Level 1: click any disc → start playing it, center it, jump to level 3
        const [cx, cy] = coords[index];
        offsetRef.current = [-cx, -cy];
        offsetX.start(-cx);
        offsetY.start(-cy);
        setCenterDiscIndex(index);
        setPlayingDiscIndex(index);
        setIsPlaying(true);
        progressRef.current = 0.66;
        savedProgressRef.current = 0.66;
        progress.start(0.66);
        return;
      }

      if (index === centerDiscIndex) {
        // Toggle play/pause on current center
        setIsPlaying((p) => {
          const next = !p;
          setPlayingDiscIndex(next ? index : -1);
          return next;
        });
        return;
      }

      // Switch to different disc
      const [cx, cy] = coords[index];
      offsetRef.current = [-cx, -cy];
      offsetX.start(-cx);
      offsetY.start(-cy);
      setCenterDiscIndex(index);
      setPlayingDiscIndex(index);
      setIsPlaying(true);
      if (playerMode) {
        bgApi.start({ color: getVinylColor(index) });
      }
    },
    [coords, offsetX, offsetY, centerDiscIndex, playerMode, bgApi, progress],
  );

  const handlePrev = useCallback(() => {
    const prev = (centerDiscIndex - 1 + coords.length) % coords.length;
    const [cx, cy] = coords[prev];
    offsetRef.current = [-cx, -cy];
    offsetX.start(-cx);
    offsetY.start(-cy);
    setCenterDiscIndex(prev);
    setPlayingDiscIndex(prev);
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
    setPlayingDiscIndex(next);
    setIsPlaying(true);
    bgApi.start({ color: getVinylColor(next) });
  }, [centerDiscIndex, coords, offsetX, offsetY, bgApi]);

  const handlePointerDown = useCallback(() => {
    setIsHold(true);
    // At level 2/3/4 (progress > 0): temporarily zoom to level 3 during drag
    if (progressRef.current > 0) {
      savedProgressRef.current = progressRef.current;
      if (progressRef.current !== 0.66) {
        progress.start(0.66);
      }
      // Temporarily exit player mode visuals during drag
      if (playerMode) {
        playerSpring.start(0);
        bgApi.start({ color: "rgb(0,0,0)" });
      }
    }
  }, [progress, playerMode, playerSpring, bgApi]);

  const handlePointerUp = useCallback(() => {
    setIsHold(false);

    const isLevel1 =
      savedProgressRef.current === 0 || progressRef.current === 0;

    if (isLevel1) {
      // Level 1: free drag, no snap-to-center, just clamp bounds
      clampOffset();
      updateCenter();
    } else {
      // Level 2/3/4: snap to nearest disc and restore saved progress
      snapToNearest();
      progressRef.current = savedProgressRef.current;
      progress.start(savedProgressRef.current);
      // Re-trigger player mode if was at level 4
      if (savedProgressRef.current >= 1) {
        enterPlayerMode(centerDiscIndex);
      }
    }
  }, [
    snapToNearest,
    clampOffset,
    updateCenter,
    progress,
    enterPlayerMode,
    centerDiscIndex,
  ]);

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

      if (playerMode) {
        if (evt.deltaY > 0) {
          exitPlayerMode();
          progressRef.current = 0.66;
          savedProgressRef.current = 0.66;
          progress.start(0.66);
        }
        return;
      }

      const prev = progressRef.current;
      const delta = evt.deltaY > 0 ? -0.04 : 0.04;
      const next = Math.max(0, Math.min(1, prev + delta));
      progressRef.current = next;
      savedProgressRef.current = next;
      progress.start(next);

      // Transition from level 1 → higher: auto-center on playing disc
      if (prev === 0 && next > 0) {
        const target =
          playingDiscIndex >= 0 ? playingDiscIndex : centerDiscIndex;
        const [cx, cy] = coords[target];
        offsetRef.current = [-cx, -cy];
        offsetX.start(-cx);
        offsetY.start(-cy);
        setCenterDiscIndex(target);
      }

      scheduleSnap();
    },
    [
      progress,
      playerMode,
      exitPlayerMode,
      scheduleSnap,
      playingDiscIndex,
      centerDiscIndex,
      coords,
      offsetX,
      offsetY,
    ],
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
      <LiquidGlassFilter />

      <animated.div
        className="absolute inset-0"
        style={{ backgroundColor: bgSpring.color }}
      />

      <div className="relative w-full h-full">
        {coords.map((coord, idx) => (
          <VinylDisc
            key={idx}
            coord={coord}
            offset={[offsetX, offsetY]}
            progress={progress}
            playerMode={playerSpring}
            index={idx}
            isPlaying={isPlaying}
            isCenterDisc={idx === centerDiscIndex}
            onCenter={handleCenter}
            onHover={setHoveredDiscIndex}
          />
        ))}
      </div>

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
