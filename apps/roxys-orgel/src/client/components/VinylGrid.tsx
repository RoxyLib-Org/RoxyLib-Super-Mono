import { animated, useSpring, useSpringValue } from "@react-spring/web";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getSong } from "../data/songs";
import { AuroraBackground } from "./AuroraBackground";
import { CustomCursor } from "./CustomCursor";
import { Lyrics } from "./Lyrics";
import { ModeButtons } from "./ModeButtons";
import { SongInfo } from "./SongInfo";
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
  // Full size at 1024px+, scales down linearly to 0.25 at 320px
  if (vw >= 1024) return 1;
  if (vw <= 320) return 0.25;
  return 0.25 + ((vw - 320) / (1024 - 320)) * 0.75;
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
  // progress (spring 0→1) is the SINGLE zoom source of truth.
  // Derived: isPlayer = progress ≈ 1, isLevel1 = progress ≈ 0
  // No separate playerMode/atLevel1/playerSpring — everything reads progress.
  const [isHold, setIsHold] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeDisc, setActiveDisc] = useState(-1); // -1 = none
  const [hoveredDiscIndex, setHoveredDiscIndex] = useState(-1);
  const [centerDiscIndex, setCenterDiscIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  // Current song data derived from active disc
  const currentSong = useMemo(
    () => (activeDisc >= 0 ? getSong(activeDisc) : null),
    [activeDisc],
  );

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
  /** Aurora visibility — driven by play state */
  const auroraSpring = useSpringValue(0, {
    config: { tension: 140, friction: 20 },
  });
  /** Playback elapsed time (seconds). RAF-driven when playing. */
  const elapsedSpring = useSpringValue(0);
  const elapsedRef = useRef(0);
  const playRafRef = useRef(0);
  const playStartRef = useRef(0);
  const lastTimeUpdateRef = useRef(0);
  const [bgSpring, bgApi] = useSpring(() => ({
    color: "rgb(0,0,0)",
    config: { tension: 200, friction: 26 },
  }));

  // Keep ref in sync so callbacks always see current activeDisc
  const activeDiscRef = useRef(-1);
  activeDiscRef.current = activeDisc;

  // ── Elapsed time driver (RAF) ─────────────────────────────────────────────
  useEffect(() => {
    if (isPlaying) {
      playStartRef.current = performance.now();
      const tick = () => {
        const now = performance.now();
        const dt = (now - playStartRef.current) / 1000;
        playStartRef.current = now;
        elapsedRef.current += dt;
        elapsedSpring.set(elapsedRef.current);
        if (now - lastTimeUpdateRef.current > 250) {
          lastTimeUpdateRef.current = now;
          setCurrentTime(elapsedRef.current);
        }
        playRafRef.current = requestAnimationFrame(tick);
      };
      playRafRef.current = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(playRafRef.current);
    }
  }, [isPlaying, elapsedSpring]);

  // ── Unified play/pause ─────────────────────────────────────────────────────
  const play = useCallback(() => {
    setIsPlaying(true);
    auroraSpring.start(1);
  }, [auroraSpring]);

  const pause = useCallback(() => {
    setIsPlaying(false);
    auroraSpring.start(0);
  }, [auroraSpring]);

  const togglePlay = useCallback(() => {
    setIsPlaying((prev) => {
      const next = !prev;
      auroraSpring.start(next ? 1 : 0);
      return next;
    });
  }, [auroraSpring]);

  const resetElapsed = useCallback(() => {
    elapsedRef.current = 0;
    elapsedSpring.set(0);
    setCurrentTime(0);
  }, [elapsedSpring]);

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

  /** Enter player mode: set progress to 1, update bg. Does NOT start playback. */
  const enterPlayerMode = useCallback(
    (discIndex: number) => {
      setActiveDisc(discIndex);
      progressRef.current = 1;
      savedProgressRef.current = 1;
      progress.start(1);
      bgApi.start({ color: getVinylColor(discIndex) });
    },
    [progress, bgApi],
  );

  /** Exit player mode: progress → 0.66, pause, reset bg. */
  const exitPlayerMode = useCallback(() => {
    pause();
    progressRef.current = 0.66;
    savedProgressRef.current = 0.66;
    progress.start(0.66);
    bgApi.start({ color: "rgb(0,0,0)" });
  }, [progress, bgApi, pause]);

  const handleMinimize = useCallback(() => {
    progressRef.current = 0;
    savedProgressRef.current = 0;
    progress.start(0);
  }, [progress]);

  const handleMaximize = useCallback(() => {
    const target =
      activeDisc >= 0
        ? activeDisc
        : findNearestDisc(coords, offsetRef.current[0], offsetRef.current[1]);
    panToDisc(target);
    enterPlayerMode(target);
    play();
  }, [activeDisc, coords, panToDisc, enterPlayerMode, play]);

  const handleClosePlayer = useCallback(() => {
    exitPlayerMode();
  }, [exitPlayerMode]);

  // ── Snap timer ─────────────────────────────────────────────────────────────
  const scheduleSnap = useCallback(() => {
    clearTimeout(snapTimerRef.current);
    snapTimerRef.current = window.setTimeout(() => {
      const snapped = snapToLevel(progressRef.current);
      progressRef.current = snapped;
      savedProgressRef.current = snapped;
      progress.start(snapped);

      if (snapped >= 1) {
        const target =
          activeDiscRef.current >= 0
            ? activeDiscRef.current
            : findNearestDisc(
                coords,
                offsetRef.current[0],
                offsetRef.current[1],
              );
        panToDisc(target);
        setActiveDisc(target);
        bgApi.start({ color: getVinylColor(target) });
        play();
      }
    }, 150);
  }, [progress, coords, panToDisc, bgApi, play]);

  // ── Click handler ──────────────────────────────────────────────────────────
  const handleDiscClick = useCallback(
    (index: number) => {
      const currentActive = activeDiscRef.current;
      const isLevel1 = progressRef.current === 0;

      if (isLevel1) {
        // Level 1 browse: click → select disc, start playing, jump to level 3
        panToDisc(index);
        setActiveDisc(index);
        resetElapsed();
        play();
        progressRef.current = 0.66;
        savedProgressRef.current = 0.66;
        progress.start(0.66);
        return;
      }

      if (index === currentActive) {
        // Click the active disc → toggle play/pause
        togglePlay();
        return;
      }

      // Click a different disc → switch to it, start playing from 0
      panToDisc(index);
      setActiveDisc(index);
      resetElapsed();
      play();
      // If in player mode (progress ≈ 1), update bg color
      if (progressRef.current >= 1) {
        bgApi.start({ color: getVinylColor(index) });
      }
    },
    [panToDisc, progress, bgApi, play, togglePlay, resetElapsed],
  );

  // ── Prev / Next ────────────────────────────────────────────────────────────
  const handlePrev = useCallback(() => {
    const prev = (activeDisc - 1 + coords.length) % coords.length;
    panToDisc(prev);
    setActiveDisc(prev);
    resetElapsed();
    play();
    bgApi.start({ color: getVinylColor(prev) });
  }, [activeDisc, coords, panToDisc, bgApi, play, resetElapsed]);

  const handleNext = useCallback(() => {
    const next = (activeDisc + 1) % coords.length;
    panToDisc(next);
    setActiveDisc(next);
    resetElapsed();
    play();
    bgApi.start({ color: getVinylColor(next) });
  }, [activeDisc, coords, panToDisc, bgApi, play, resetElapsed]);

  // ── Mouse handlers (desktop: drag + click via hoveredDiscIndex) ────────────
  const mouseStartRef = useRef<{ x: number; y: number } | null>(null);
  const isDraggingRef = useRef(false);
  const DRAG_THRESHOLD = 5;

  const handleMouseDown = useCallback((evt: React.MouseEvent) => {
    setIsHold(true);
    isDraggingRef.current = false;
    mouseStartRef.current = { x: evt.clientX, y: evt.clientY };

    if (progressRef.current > 0) {
      savedProgressRef.current = progressRef.current;
    }
  }, []);

  const handleMouseMove = useCallback(
    (evt: React.MouseEvent) => {
      if (!isHold) return;

      if (!isDraggingRef.current && mouseStartRef.current) {
        const dx = evt.clientX - mouseStartRef.current.x;
        const dy = evt.clientY - mouseStartRef.current.y;
        if (Math.sqrt(dx * dx + dy * dy) >= DRAG_THRESHOLD) {
          isDraggingRef.current = true;
          // Dragging in player mode → shrink to 0.66
          if (savedProgressRef.current >= 1) {
            progress.start(0.66);
            bgApi.start({ color: "rgb(0,0,0)" });
          }
        }
      }

      if (isDraggingRef.current) {
        const speedMult = progressRef.current === 0 ? 2.5 : 1;
        offsetRef.current[0] += (evt.movementX * speedMult) / viewportScale;
        offsetRef.current[1] += (evt.movementY * speedMult) / viewportScale;
        offsetX.start(offsetRef.current[0]);
        offsetY.start(offsetRef.current[1]);
        updateCenter();
      }
    },
    [isHold, offsetX, offsetY, updateCenter, progress, bgApi, viewportScale],
  );

  const handleMouseUp = useCallback(
    (_evt: React.MouseEvent) => {
      setIsHold(false);

      if (!isDraggingRef.current) {
        // Click — use hovered disc from mouseenter/leave
        if (hoveredDiscIndex >= 0) {
          handleDiscClick(hoveredDiscIndex);
        }
        // Restore progress if changed on mouseDown
        if (
          progressRef.current !== savedProgressRef.current &&
          savedProgressRef.current > 0
        ) {
          progressRef.current = savedProgressRef.current;
          progress.start(savedProgressRef.current);
          if (savedProgressRef.current >= 1 && activeDisc >= 0) {
            bgApi.start({ color: getVinylColor(activeDisc) });
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
          bgApi.start({ color: getVinylColor(snapped) });
        }
      }
    },
    [
      snapToNearest,
      clampOffset,
      updateCenter,
      progress,
      bgApi,
      activeDisc,
      hoveredDiscIndex,
      handleDiscClick,
    ],
  );

  // ── Wheel handler ──────────────────────────────────────────────────────────
  const handleWheel = useCallback(
    (evt: React.WheelEvent) => {
      evt.preventDefault();

      // In player mode (progress=1), scroll down exits
      if (progressRef.current >= 1) {
        if (evt.deltaY > 0) {
          exitPlayerMode();
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
      exitPlayerMode,
      scheduleSnap,
      activeDisc,
      panToDisc,
      snapToNearest,
    ],
  );

  // ── Touch handlers (mobile: drag + tap via touch target) ──────────────────
  const pinchRef = useRef<{ startDist: number; startProgress: number } | null>(
    null,
  );
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const isTouchDraggingRef = useRef(false);
  const touchedDiscRef = useRef(-1);

  const handleTouchStart = useCallback((evt: React.TouchEvent) => {
    if (evt.touches.length === 2) {
      // Pinch start
      const dx = evt.touches[1].clientX - evt.touches[0].clientX;
      const dy = evt.touches[1].clientY - evt.touches[0].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      pinchRef.current = {
        startDist: dist,
        startProgress: progressRef.current,
      };
      return;
    }

    // Single touch — record start for drag threshold
    const touch = evt.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    isTouchDraggingRef.current = false;
    setIsHold(true);

    // Identify tapped disc via target DOM
    const el = (evt.target as HTMLElement).closest("[data-disc-index]");
    touchedDiscRef.current = el
      ? Number.parseInt(el.getAttribute("data-disc-index") ?? "-1", 10)
      : -1;

    // Save progress but DON'T shrink yet — wait for drag confirmation
    if (progressRef.current > 0) {
      savedProgressRef.current = progressRef.current;
    }
  }, []);

  const handleTouchMove = useCallback(
    (evt: React.TouchEvent) => {
      // Pinch zoom
      if (evt.touches.length === 2 && pinchRef.current) {
        evt.preventDefault();
        const dx = evt.touches[1].clientX - evt.touches[0].clientX;
        const dy = evt.touches[1].clientY - evt.touches[0].clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const ratio = dist / pinchRef.current.startDist;
        const newProgress = Math.max(
          0,
          Math.min(1, pinchRef.current.startProgress + (ratio - 1) * 0.5),
        );

        const prev = progressRef.current;
        progressRef.current = newProgress;
        savedProgressRef.current = newProgress;
        progress.start(newProgress);

        if (prev === 0 && newProgress > 0) {
          if (activeDisc >= 0) {
            panToDisc(activeDisc);
          } else {
            const nearest = snapToNearest();
            setActiveDisc(nearest);
          }
        }
        return;
      }

      // Single finger drag
      if (evt.touches.length !== 1 || !touchStartRef.current) return;
      const touch = evt.touches[0];

      if (!isTouchDraggingRef.current) {
        const dx = touch.clientX - touchStartRef.current.x;
        const dy = touch.clientY - touchStartRef.current.y;
        if (Math.sqrt(dx * dx + dy * dy) >= DRAG_THRESHOLD) {
          isTouchDraggingRef.current = true;
          // Dragging from player mode → shrink to 0.66
          if (savedProgressRef.current >= 1) {
            progress.start(0.66);
            bgApi.start({ color: "rgb(0,0,0)" });
          }
        }
      }

      if (isTouchDraggingRef.current) {
        const prevX = touchStartRef.current.x;
        const prevY = touchStartRef.current.y;
        touchStartRef.current = { x: touch.clientX, y: touch.clientY };
        const speedMult = progressRef.current === 0 ? 2.5 : 1;
        offsetRef.current[0] +=
          ((touch.clientX - prevX) * speedMult) / viewportScale;
        offsetRef.current[1] +=
          ((touch.clientY - prevY) * speedMult) / viewportScale;
        offsetX.start(offsetRef.current[0]);
        offsetY.start(offsetRef.current[1]);
        updateCenter();
      }
    },
    [
      progress,
      activeDisc,
      panToDisc,
      snapToNearest,
      offsetX,
      offsetY,
      updateCenter,
      viewportScale,
      bgApi,
    ],
  );

  const handleTouchEnd = useCallback(
    (_evt: React.TouchEvent) => {
      // Pinch end
      if (pinchRef.current) {
        pinchRef.current = null;
        scheduleSnap();
        return;
      }

      setIsHold(false);

      if (!isTouchDraggingRef.current) {
        // Tap — use disc identified at touchStart
        if (touchedDiscRef.current >= 0) {
          handleDiscClick(touchedDiscRef.current);
        }
        // Restore progress
        if (
          progressRef.current !== savedProgressRef.current &&
          savedProgressRef.current > 0
        ) {
          progressRef.current = savedProgressRef.current;
          progress.start(savedProgressRef.current);
          if (savedProgressRef.current >= 1 && activeDisc >= 0) {
            bgApi.start({ color: getVinylColor(activeDisc) });
          }
        }
        return;
      }

      // Drag end
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
          bgApi.start({ color: getVinylColor(snapped) });
        }
      }
    },
    [
      scheduleSnap,
      snapToNearest,
      clampOffset,
      updateCenter,
      progress,
      bgApi,
      activeDisc,
      handleDiscClick,
    ],
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="relative w-full h-[100dvh] overflow-hidden touch-none select-none cursor-none">
      <LiquidGlassFilter />

      <animated.div
        className="absolute inset-0"
        style={{ backgroundColor: bgSpring.color }}
      />

      {/* Aurora — visible when progress ≈ 1 AND playing */}
      <AuroraBackground
        progress={progress}
        playing={auroraSpring}
        color={bgSpring.color}
      />

      {/* Grid layer */}
      <div
        className="relative w-full h-full origin-center"
        style={{ transform: `scale(${viewportScale})` }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {coords.map((coord, idx) => (
          <VinylDisc
            key={idx}
            coord={coord}
            offset={[offsetX, offsetY]}
            progress={progress}
            index={idx}
            isCenterDisc={idx === centerDiscIndex}
            isActiveDisc={idx === activeDisc}
            isPlaying={isPlaying}
            onHover={setHoveredDiscIndex}
          />
        ))}
      </div>

      <ModeButtons
        progress={progress}
        onMinimize={handleMinimize}
        onMaximize={handleMaximize}
        onClosePlayer={handleClosePlayer}
      />

      <TransportControls
        progress={progress}
        elapsed={elapsedSpring}
        duration={currentSong?.duration}
        isPlaying={isPlaying}
        onPlayPause={togglePlay}
        onPrev={handlePrev}
        onNext={handleNext}
      />

      {/* Song info */}
      {currentSong && (
        <SongInfo
          song={currentSong}
          isPlayerMode={progressRef.current >= 0.9}
        />
      )}

      {/* Synced lyrics */}
      {currentSong && (
        <Lyrics
          lyrics={currentSong.lyrics}
          currentTime={currentTime}
          isPlaying={isPlaying}
          progress={progress}
        />
      )}

      <ZoomIndicator progress={progress} />

      <CustomCursor
        isPlaying={isPlaying}
        hoveredDiscIndex={hoveredDiscIndex}
        centerDiscIndex={centerDiscIndex}
        compact={progressRef.current === 0}
      />
    </div>
  );
}
