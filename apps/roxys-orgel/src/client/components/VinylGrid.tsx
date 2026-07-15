import { animated, useSpring, useSpringValue } from "@react-spring/web";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CustomCursor } from "./CustomCursor";
import { ModeButtons } from "./ModeButtons";
import { TransportControls } from "./TransportControls";
import {
  getVinylColor,
  HEX_RADIUS,
  LiquidGlassFilter,
  VinylDisc,
} from "./VinylDisc";
import { ZoomIndicator } from "./ZoomIndicator";

const { sqrt, pow, max } = Math;

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

function computeBounds(
  coords: Array<[number, number]>,
  padding: number,
): number {
  let maxDist = 0;
  for (const [cx, cy] of coords) {
    const d = sqrt(cx * cx + cy * cy);
    if (d > maxDist) maxDist = d;
  }
  return max(0, maxDist - padding);
}

// ──────────────────────────────────────────────────────────────────────────────
// STATE MODEL:
//
// 1. `activeDisc` — the disc currently selected/playing. Only changes on
//    explicit user action (click, prev, next). This is the SINGLE source of
//    truth for "which disc is rotating" and "which disc is the interaction
//    target". -1 means nothing selected.
//
// 2. `isPlaying` — whether audio is playing. Only `activeDisc` rotates.
//
// 3. `progress` (spring, 0-1) — zoom/compression level.
//    Snap levels: 0 = browse, 0.33 = slightly zoomed, 0.66 = focused, 1 = player
//
// 4. `playerMode` (boolean) + `playerSpring` — controls overlay visible.
//    Triggered when progress snaps to 1.
//
// 5. `centerDiscIndex` — purely visual, the disc nearest screen center.
//    Used ONLY for size gaussian (distanceFromCenter). NOT used for playback.
// ──────────────────────────────────────────────────────────────────────────────

/** Scale the whole grid down on narrow screens */
function useViewportScale(): number {
  const [scale, setScale] = useState(() =>
    typeof window !== "undefined" ? computeScale(window.innerWidth) : 1,
  );
  useEffect(() => {
    const onResize = () => setScale(computeScale(window.innerWidth));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return scale;
}

function computeScale(vw: number): number {
  // Full size at 1024px+, scales down linearly to 0.5 at 320px
  if (vw >= 1024) return 1;
  if (vw <= 320) return 0.5;
  return 0.5 + ((vw - 320) / (1024 - 320)) * 0.5;
}

export function VinylGrid() {
  const coords = useMemo(
    () => generateHexPositions(HEX_RADIUS, DISC_COUNT),
    [],
  );
  const maxOffset = useMemo(
    () => computeBounds(coords, HEX_RADIUS * 2),
    [coords],
  );
  const viewportScale = useViewportScale();

  // ── State ──────────────────────────────────────────────────────────────────
  const [isHold, setIsHold] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeDisc, setActiveDisc] = useState(-1); // -1 = none
  const [playerMode, setPlayerMode] = useState(false);
  const [atLevel1, setAtLevel1] = useState(false);
  const [hoveredDiscIndex, setHoveredDiscIndex] = useState(-1);
  const [centerDiscIndex, setCenterDiscIndex] = useState(0);

  const offsetRef = useRef([0, 0]);
  const progressRef = useRef(0.66);
  const savedProgressRef = useRef(0.66);
  const snapTimerRef = useRef(0);

  // ── Springs ────────────────────────────────────────────────────────────────
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

  // ── Helpers ────────────────────────────────────────────────────────────────
  const updateCenter = useCallback(() => {
    const nearest = findNearestDisc(
      coords,
      offsetRef.current[0],
      offsetRef.current[1],
    );
    setCenterDiscIndex(nearest);
  }, [coords]);

  const panToDisc = useCallback(
    (index: number) => {
      const [cx, cy] = coords[index];
      offsetRef.current = [-cx, -cy];
      offsetX.start(-cx);
      offsetY.start(-cy);
      setCenterDiscIndex(index);
    },
    [coords, offsetX, offsetY],
  );

  const snapToNearest = useCallback((): number => {
    const nearest = findNearestDisc(
      coords,
      offsetRef.current[0],
      offsetRef.current[1],
    );
    panToDisc(nearest);
    return nearest;
  }, [coords, panToDisc]);

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
      setActiveDisc(discIndex);
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

  const handleMinimize = useCallback(() => {
    progressRef.current = 0;
    savedProgressRef.current = 0;
    progress.start(0);
    setAtLevel1(true);
  }, [progress]);

  const handleMaximize = useCallback(() => {
    const target =
      activeDisc >= 0
        ? activeDisc
        : findNearestDisc(coords, offsetRef.current[0], offsetRef.current[1]);
    panToDisc(target);
    progressRef.current = 1;
    savedProgressRef.current = 1;
    progress.start(1);
    enterPlayerMode(target);
    setAtLevel1(false);
  }, [activeDisc, coords, panToDisc, progress, enterPlayerMode]);

  const handleClosePlayer = useCallback(() => {
    exitPlayerMode();
    progressRef.current = 0.66;
    savedProgressRef.current = 0.66;
    progress.start(0.66);
    setAtLevel1(false);
  }, [exitPlayerMode, progress]);

  // ── Snap timer ─────────────────────────────────────────────────────────────
  const scheduleSnap = useCallback(() => {
    clearTimeout(snapTimerRef.current);
    snapTimerRef.current = window.setTimeout(() => {
      const snapped = snapToLevel(progressRef.current);
      progressRef.current = snapped;
      progress.start(snapped);

      if (snapped >= 1) {
        // Enter player mode with the active disc (or nearest if none)
        const target =
          activeDisc >= 0
            ? activeDisc
            : findNearestDisc(
                coords,
                offsetRef.current[0],
                offsetRef.current[1],
              );
        panToDisc(target);
        enterPlayerMode(target);
      }
      setAtLevel1(snapped === 0);
    }, 150);
  }, [progress, enterPlayerMode, activeDisc, coords, panToDisc]);

  // ── Click handler ──────────────────────────────────────────────────────────
  const handleDiscClick = useCallback(
    (index: number) => {
      const isLevel1 = progressRef.current === 0;

      if (isLevel1) {
        // Level 1 browse: click → select disc, start playing, jump to level 3
        panToDisc(index);
        setActiveDisc(index);
        setIsPlaying(true);
        progressRef.current = 0.66;
        savedProgressRef.current = 0.66;
        progress.start(0.66);
        setAtLevel1(false);
        return;
      }

      if (index === activeDisc) {
        // Click the active disc → toggle play/pause
        setIsPlaying((p) => !p);
        return;
      }

      // Click a different disc → switch to it, start playing
      panToDisc(index);
      setActiveDisc(index);
      setIsPlaying(true);
      if (playerMode) {
        bgApi.start({ color: getVinylColor(index) });
      }
    },
    [activeDisc, panToDisc, progress, playerMode, bgApi],
  );

  // ── Prev / Next ────────────────────────────────────────────────────────────
  const handlePrev = useCallback(() => {
    const prev = (activeDisc - 1 + coords.length) % coords.length;
    panToDisc(prev);
    setActiveDisc(prev);
    setIsPlaying(true);
    bgApi.start({ color: getVinylColor(prev) });
  }, [activeDisc, coords, panToDisc, bgApi]);

  const handleNext = useCallback(() => {
    const next = (activeDisc + 1) % coords.length;
    panToDisc(next);
    setActiveDisc(next);
    setIsPlaying(true);
    bgApi.start({ color: getVinylColor(next) });
  }, [activeDisc, coords, panToDisc, bgApi]);

  // ── Pointer handlers (drag vs click by distance threshold) ────────────────
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const isDraggingRef = useRef(false);
  const DRAG_THRESHOLD = 5;

  const handlePointerDown = useCallback(
    (evt: React.PointerEvent) => {
      setIsHold(true);
      isDraggingRef.current = false;
      pointerStartRef.current = { x: evt.clientX, y: evt.clientY };
      (evt.currentTarget as HTMLElement).setPointerCapture(evt.pointerId);

      if (progressRef.current > 0) {
        savedProgressRef.current = progressRef.current;
        if (progressRef.current !== 0.66) {
          progress.start(0.66);
        }
        if (playerMode) {
          playerSpring.start(0);
          bgApi.start({ color: "rgb(0,0,0)" });
        }
      }
    },
    [progress, playerMode, playerSpring, bgApi],
  );

  const handlePointerMove = useCallback(
    (evt: React.PointerEvent) => {
      if (!isHold) return;

      if (!isDraggingRef.current && pointerStartRef.current) {
        const dx = evt.clientX - pointerStartRef.current.x;
        const dy = evt.clientY - pointerStartRef.current.y;
        if (Math.sqrt(dx * dx + dy * dy) >= DRAG_THRESHOLD) {
          isDraggingRef.current = true;
        }
      }

      if (isDraggingRef.current) {
        offsetRef.current[0] += evt.movementX;
        offsetRef.current[1] += evt.movementY;
        offsetX.start(offsetRef.current[0]);
        offsetY.start(offsetRef.current[1]);
        updateCenter();
      }
    },
    [isHold, offsetX, offsetY, updateCenter],
  );

  const handlePointerUp = useCallback(
    (evt: React.PointerEvent) => {
      setIsHold(false);

      if (!isDraggingRef.current) {
        // Click — compute which disc was clicked via coordinates
        const container = evt.currentTarget as HTMLElement;
        const rect = container.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        // Pointer position relative to viewport center, adjusted for scale
        const scale = viewportScale || 1;
        const clickX = (evt.clientX - centerX) / scale - offsetRef.current[0];
        const clickY = (evt.clientY - centerY) / scale - offsetRef.current[1];
        // Find the nearest disc to click point
        const hitRadius = HEX_RADIUS * 0.9; // generous hit area
        let hitIdx = -1;
        let minDist = hitRadius;
        for (let i = 0; i < coords.length; i++) {
          const dx = clickX - coords[i][0];
          const dy = clickY - coords[i][1];
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < minDist) {
            minDist = d;
            hitIdx = i;
          }
        }
        if (hitIdx >= 0) {
          handleDiscClick(hitIdx);
        }
        // Restore progress if changed on pointerDown
        if (
          progressRef.current !== savedProgressRef.current &&
          savedProgressRef.current > 0
        ) {
          progressRef.current = savedProgressRef.current;
          progress.start(savedProgressRef.current);
          if (savedProgressRef.current >= 1 && activeDisc >= 0) {
            enterPlayerMode(activeDisc);
          }
        }
        return;
      }

      // Drag end — snap/clamp
      const isLevel1 =
        savedProgressRef.current === 0 || progressRef.current === 0;

      if (isLevel1) {
        clampOffset();
        updateCenter();
      } else {
        const snapped = snapToNearest();
        setActiveDisc(snapped);
        progressRef.current = savedProgressRef.current;
        progress.start(savedProgressRef.current);
        if (savedProgressRef.current >= 1) {
          enterPlayerMode(snapped);
        }
      }
    },
    [
      snapToNearest,
      clampOffset,
      updateCenter,
      progress,
      enterPlayerMode,
      activeDisc,
      viewportScale,
      handleDiscClick,
      coords.length,
      coords,
    ],
  );

  // Suppress click events that were actually drags
  const handleClickCapture = useCallback((evt: React.MouseEvent) => {
    if (isDraggingRef.current) {
      evt.stopPropagation();
      evt.preventDefault();
    }
  }, []);

  // ── Wheel handler ──────────────────────────────────────────────────────────
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
      const delta = evt.deltaY > 0 ? -0.08 : 0.08;
      const next = Math.max(0, Math.min(1, prev + delta));
      progressRef.current = next;
      savedProgressRef.current = next;
      progress.start(next);

      // Transition from level 1 → higher: center on active disc or nearest
      if (prev === 0 && next > 0) {
        if (activeDisc >= 0) {
          panToDisc(activeDisc);
        } else {
          const nearest = snapToNearest();
          setActiveDisc(nearest);
        }
      }

      scheduleSnap();
    },
    [
      progress,
      playerMode,
      exitPlayerMode,
      scheduleSnap,
      activeDisc,
      panToDisc,
      snapToNearest,
    ],
  );

  // ── Pinch zoom (touch) ─────────────────────────────────────────────────────
  const pinchRef = useRef<{ startDist: number; startProgress: number } | null>(
    null,
  );

  const handleTouchStart = useCallback((evt: React.TouchEvent) => {
    if (evt.touches.length === 2) {
      const dx = evt.touches[1].clientX - evt.touches[0].clientX;
      const dy = evt.touches[1].clientY - evt.touches[0].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      pinchRef.current = {
        startDist: dist,
        startProgress: progressRef.current,
      };
    }
  }, []);

  const handleTouchMove = useCallback(
    (evt: React.TouchEvent) => {
      if (evt.touches.length !== 2 || !pinchRef.current) return;
      evt.preventDefault();

      const dx = evt.touches[1].clientX - evt.touches[0].clientX;
      const dy = evt.touches[1].clientY - evt.touches[0].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const ratio = dist / pinchRef.current.startDist;
      // Map pinch ratio to progress: spread = zoom in, pinch = zoom out
      const newProgress = Math.max(
        0,
        Math.min(1, pinchRef.current.startProgress + (ratio - 1) * 0.5),
      );

      const prev = progressRef.current;
      progressRef.current = newProgress;
      savedProgressRef.current = newProgress;
      progress.start(newProgress);

      // Transition from level 1 → higher
      if (prev === 0 && newProgress > 0) {
        if (activeDisc >= 0) {
          panToDisc(activeDisc);
        } else {
          const nearest = snapToNearest();
          setActiveDisc(nearest);
        }
      }
    },
    [progress, activeDisc, panToDisc, snapToNearest],
  );

  const handleTouchEnd = useCallback(() => {
    if (pinchRef.current) {
      pinchRef.current = null;
      scheduleSnap();
    }
  }, [scheduleSnap]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      className="relative w-full h-[100dvh] overflow-hidden touch-none select-none cursor-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onLostPointerCapture={handlePointerUp}
      onClickCapture={handleClickCapture}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <LiquidGlassFilter />

      <animated.div
        className="absolute inset-0"
        style={{ backgroundColor: bgSpring.color }}
      />

      <div
        className="relative w-full h-full origin-center"
        style={{ transform: `scale(${viewportScale})` }}
      >
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
            isPlayingDisc={idx === activeDisc}
            onHover={setHoveredDiscIndex}
            onClick={handleDiscClick}
          />
        ))}
      </div>

      <ModeButtons
        progress={progress}
        playerMode={playerSpring}
        onMinimize={handleMinimize}
        onMaximize={handleMaximize}
        onClosePlayer={handleClosePlayer}
      />

      <TransportControls
        visible={playerSpring}
        isPlaying={isPlaying}
        onPlayPause={() => setIsPlaying((p) => !p)}
        onPrev={handlePrev}
        onNext={handleNext}
      />

      <ZoomIndicator progress={progress} />

      <CustomCursor
        isPlaying={isPlaying}
        hoveredDiscIndex={hoveredDiscIndex}
        centerDiscIndex={centerDiscIndex}
        compact={atLevel1}
      />
    </div>
  );
}
