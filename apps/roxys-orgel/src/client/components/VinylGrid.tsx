import { animated, type SpringValue, useSpringValue } from "@react-spring/web";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAudioPlayer } from "../hooks/useAudioPlayer";
import { trpc } from "../trpc";
import { AuroraBackground } from "./AuroraBackground";
import { CustomCursor } from "./CustomCursor";
import { FooterSection } from "./FooterSection";
import { HeroSection } from "./HeroSection";
import { LoadingOverlay } from "./LoadingOverlay";
import { Lyrics } from "./Lyrics";
import { ModeButtons } from "./ModeButtons";
import { SongInfo } from "./SongInfo";
import { TransportControls } from "./TransportControls";
import { HEX_RADIUS, LiquidGlassFilter, VinylDisc } from "./VinylDisc";
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

function snapToLevel(value: number): number {
  // For hero/footer boundaries: only snap to -1/2 if already past the threshold
  // Otherwise snap within 0-1 range
  if (value > 1.3) return 2;
  if (value < -0.3) return -1;
  // Within normal zoom range, snap to 0/0.33/0.66/1
  const zoomLevels = [0, 0.33, 0.66, 1];
  let closest = 0;
  let minDist = Math.abs(value - zoomLevels[0]);
  for (let i = 1; i < zoomLevels.length; i++) {
    const d = Math.abs(value - zoomLevels[i]);
    if (d < minDist) {
      minDist = d;
      closest = i;
    }
  }
  return zoomLevels[closest];
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
  const [scale, setScale] = useState(1);
  useEffect(() => {
    setScale(computeScale(window.innerWidth));
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
  const [activeDisc, setActiveDisc] = useState(-1); // -1 = none
  const [hoveredDiscIndex, setHoveredDiscIndex] = useState(-1);
  const [centerDiscIndex, setCenterDiscIndex] = useState(0);
  const [scrubPos, setScrubPos] = useState<{ x: number; y: number } | null>(
    null,
  );

  // ── Audio player (real playback via HTML5 Audio) ──────────────────────────
  const audio = useAudioPlayer();
  const { isPlaying, currentTime, duration } = audio;

  // ── Fetch real songs from R2 via tRPC ─────────────────────────────────────
  const songsQuery = trpc.song.list.useQuery({});

  /** Flat list of playable tracks mapped from tRPC */
  const tracks = useMemo(() => {
    if (!songsQuery.data) return [];
    return songsQuery.data.map((s) => ({
      id: s.id,
      title: s.title,
      artist: s.artistName,
      album: s.albumTitle,
      r2Key: s.r2Key,
      coverUrl: s.coverUrl,
      durationMs: s.durationMs,
    }));
  }, [songsQuery.data]);

  // ── Cover preloading (loading overlay) ────────────────────────────────────
  const [coversLoaded, setCoversLoaded] = useState(false);
  const coverUrls = useMemo(() => {
    if (tracks.length === 0) return [];
    // Deduplicate and collect unique cover URLs
    const seen = new Set<string>();
    for (const t of tracks) {
      if (t.coverUrl) seen.add(t.coverUrl);
    }
    return [...seen];
  }, [tracks]);

  // ── Fetch lyrics for active track ─────────────────────────────────────────
  const activeTrackId =
    activeDisc >= 0 && tracks.length > 0
      ? tracks[activeDisc % tracks.length].id
      : null;
  const lyricsQuery = trpc.song.lyrics.useQuery(
    { songId: activeTrackId! },
    { enabled: activeTrackId != null },
  );

  /** Current song info for UI components */
  const currentSong = useMemo(() => {
    if (activeDisc < 0 || tracks.length === 0) return null;
    const track = tracks[activeDisc % tracks.length];
    const rawDuration =
      track.durationMs != null ? track.durationMs / 1000 : duration;
    const trackDuration =
      Number.isFinite(rawDuration) && rawDuration > 0 ? rawDuration : 0;
    return {
      id: activeDisc,
      title: track.title,
      artist: track.artist,
      album: track.album,
      duration: trackDuration,
      audioUrl: "",
      color: "",
      lyrics: lyricsQuery.data ?? [],
    };
  }, [activeDisc, tracks, duration, lyricsQuery.data]);

  // ── Play track synchronously (must be called from user gesture context) ───
  const playTrack = useCallback(
    (index: number) => {
      if (index < 0 || tracks.length === 0) return;
      const track = tracks[index % tracks.length];
      audio.loadAndPlay({
        r2Key: track.r2Key,
        title: track.title,
        artistName: track.artist,
        albumTitle: track.album,
      });
    },
    [tracks, audio.loadAndPlay],
  );

  const offsetRef = useRef([0, 0]);
  const progressRef = useRef(2);
  const savedProgressRef = useRef(2);
  const snapTimerRef = useRef(0);
  const gridRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // ── Springs ────────────────────────────────────────────────────────────────
  // Single progress spring: [-1, 2]. Range: -1=footer, 0..1=zoom, 2=hero
  const springConfig = { tension: 170, friction: 24 };
  const offsetX = useSpringValue(0, { config: springConfig });
  const offsetY = useSpringValue(0, { config: springConfig });
  const progress = useSpringValue(2, {
    config: { tension: 200, friction: 26 },
  });
  /** Elapsed spring synced from audio player currentTime */
  const elapsedSpring = useSpringValue(0);

  // ── Derived progress values ───────────────────────────────────────────────
  // zoomProgress: clamp(progress, 0, 1) — what child components see as "zoom level"
  // Cast as SpringValue<number> since children only use .to() which Interpolation supports
  const zoomProgress = useMemo(
    () =>
      progress.to((p) =>
        Math.max(0, Math.min(1, p)),
      ) as unknown as SpringValue<number>,
    [progress],
  );
  // heroProgress: 0 when progress<=1, ramps to 1 at progress=2
  const heroProgress = useMemo(
    () =>
      progress.to((p) =>
        Math.max(0, Math.min(1, p - 1)),
      ) as unknown as SpringValue<number>,
    [progress],
  );
  // footerProgress: 0 when progress>=0, ramps to 1 at progress=-1
  const footerProgress = useMemo(
    () =>
      progress.to((p) =>
        Math.max(0, Math.min(1, -p)),
      ) as unknown as SpringValue<number>,
    [progress],
  );

  // Keep ref in sync so callbacks always see current activeDisc
  const activeDiscRef = useRef(-1);
  activeDiscRef.current = activeDisc;

  // ── Sync elapsed spring from audio player ─────────────────────────────────
  useEffect(() => {
    if (!isPlaying) return;
    let raf = 0;
    const tick = () => {
      elapsedSpring.set(audio.getTime());
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isPlaying, elapsedSpring, audio.getTime]);

  // ── Playback controls (delegate to audio player) ──────────────────────────
  const play = useCallback(() => audio.play(), [audio.play]);
  const togglePlay = useCallback(() => {
    if (!audio.hasSrc && tracks.length > 0) {
      // Cold start: no track loaded — load the active disc and play
      const idx = activeDiscRef.current;
      const track = tracks[idx >= 0 ? idx % tracks.length : 0];
      audio.loadAndPlay({
        r2Key: track.r2Key,
        title: track.title,
        artistName: track.artist,
        albumTitle: track.album,
      });
      return;
    }
    audio.toggle();
  }, [audio.toggle, audio.loadAndPlay, audio.hasSrc, tracks]);

  const resetElapsed = useCallback(() => {
    audio.seek(0);
    elapsedSpring.set(0);
  }, [audio.seek, elapsedSpring]);

  const seek = useCallback(
    (time: number) => {
      audio.seek(time);
      elapsedSpring.set(time);
    },
    [audio.seek, elapsedSpring],
  );

  // Switch to a new disc: if it's different from current, reset and play from 0
  const switchDisc = useCallback(
    (index: number) => {
      if (index === activeDiscRef.current) return;
      setActiveDisc(index);
      resetElapsed();
      playTrack(index);
    },
    [resetElapsed, playTrack],
  );

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
    },
    [progress],
  );

  /** Exit player mode: progress → 0.66, reset bg. Playback continues. */
  const exitPlayerMode = useCallback(() => {
    progressRef.current = 0.66;
    savedProgressRef.current = 0.66;
    progress.start(0.66);
  }, [progress]);

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
    // If same disc is already active, just resume; otherwise effect handles it
    if (target === activeDisc) play();
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

      if (snapped === 1) {
        const target =
          activeDiscRef.current >= 0
            ? activeDiscRef.current
            : findNearestDisc(
                coords,
                offsetRef.current[0],
                offsetRef.current[1],
              );
        panToDisc(target);
        switchDisc(target);
      }
    }, 150);
  }, [progress, coords, panToDisc, switchDisc]);

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
        playTrack(index);
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
      playTrack(index);
    },
    [panToDisc, progress, togglePlay, resetElapsed, playTrack],
  );

  // ── Prev / Next ────────────────────────────────────────────────────────────
  const handlePrev = useCallback(() => {
    const prev = (activeDisc - 1 + coords.length) % coords.length;
    panToDisc(prev);
    setActiveDisc(prev);
    resetElapsed();
    playTrack(prev);
  }, [activeDisc, coords, panToDisc, resetElapsed, playTrack]);

  const handleNext = useCallback(() => {
    const next = (activeDisc + 1) % coords.length;
    panToDisc(next);
    setActiveDisc(next);
    resetElapsed();
    playTrack(next);
  }, [activeDisc, coords, panToDisc, resetElapsed, playTrack]);

  // Auto-advance: when track ends, play next (loops back to first)
  useEffect(() => {
    audio.onEnded(handleNext);
    return () => audio.onEnded(null);
  }, [audio.onEnded, handleNext]);

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
    [isHold, offsetX, offsetY, updateCenter, progress, viewportScale],
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
        switchDisc(snapped);
        progressRef.current = savedProgressRef.current;
        progress.start(savedProgressRef.current);
      }
    },
    [
      snapToNearest,
      clampOffset,
      updateCenter,
      progress,
      hoveredDiscIndex,
      handleDiscClick,
      switchDisc,
    ],
  );

  // ── Wheel handler ──────────────────────────────────────────────────────────
  const handleWheel = useCallback(
    (evt: WheelEvent) => {
      evt.preventDefault();

      const scrollUp = evt.deltaY < 0;
      const prev = progressRef.current;

      // Speed varies by region: hero/footer zones scroll much faster
      let speed = 0.08;
      if (prev > 1 || prev < 0) speed = 0.3;

      const delta = scrollUp ? speed : -speed;
      const next = Math.max(-1, Math.min(2, prev + delta));
      progressRef.current = next;
      savedProgressRef.current = next;
      progress.start(next);

      // Transition from level 0 → higher: center on active disc or nearest
      if (prev <= 0 && next > 0) {
        if (activeDisc >= 0) {
          panToDisc(activeDisc);
        } else {
          const nearest = snapToNearest();
          switchDisc(nearest);
        }
      }

      scheduleSnap();
    },
    [progress, scheduleSnap, activeDisc, panToDisc, snapToNearest, switchDisc],
  );

  // Register wheel as non-passive to allow preventDefault
  // Register wheel on the outermost container (not grid) so it works during hero/footer
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

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
            switchDisc(nearest);
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
        switchDisc(snapped);
        progressRef.current = savedProgressRef.current;
        progress.start(savedProgressRef.current);
      }
    },
    [
      scheduleSnap,
      snapToNearest,
      clampOffset,
      updateCenter,
      progress,
      handleDiscClick,
      switchDisc,
    ],
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  // Grid translateY: derived from unified progress
  // progress > 1 → grid slides down (hero behind)
  // progress < 0 → grid content slides UP within the black bg, footer fades in
  const gridTranslateY = progress.to((p) => {
    if (p > 1) return `translateY(${(p - 1) * 100}%)`;
    if (p < 0) {
      const t = Math.min(1, -p);
      const scale = 1 - t * 0.925; // 1 → 0.075
      return `translateY(${t * 40}%) scale(${scale})`;
    }
    return "translateY(0%)";
  });

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[100dvh] overflow-hidden touch-none select-none cursor-none bg-black"
    >
      <LiquidGlassFilter />

      {/* Hero section — positioned behind, revealed when grid slides down */}
      <HeroSection progress={heroProgress} />

      {/* Main content wrapper — slides up/down based on hero/footer */}
      <animated.div
        className="absolute inset-0 z-10 origin-top"
        style={{
          transform: gridTranslateY,
          filter: progress.to((p) => {
            if (p >= 0) return "none";
            const t = Math.min(1, -p); // 0→1
            // Desaturate + brighten → white dots
            return `saturate(${1 - t}) brightness(${1 + t * 2}) contrast(${1 - t * 0.6})`;
          }),
          opacity: progress.to((p) => {
            if (p >= 0) return 1;
            // Fade slightly so dots are semi-transparent
            return Math.max(0.3, 1 + p * 0.5);
          }),
        }}
      >
        {/* Aurora — visible when zoomProgress ≈ 1 AND playing */}
        <AuroraBackground
          progress={zoomProgress}
          isPlaying={isPlaying}
          color="oklch(0 0 0)"
        />

        {/* Grid layer */}
        <div
          ref={gridRef}
          className="relative w-full h-full origin-center"
          style={{ transform: `scale(${viewportScale})` }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {coords.map((coord, idx) => (
            <VinylDisc
              key={idx}
              coord={coord}
              offset={[offsetX, offsetY]}
              progress={zoomProgress}
              elapsed={elapsedSpring}
              index={idx}
              isCenterDisc={idx === centerDiscIndex}
              isActiveDisc={idx === activeDisc}
              isPlaying={isPlaying}
              onHover={setHoveredDiscIndex}
              coverUrl={tracks[idx % (tracks.length || 1)]?.coverUrl ?? null}
              title={tracks[idx % (tracks.length || 1)]?.title ?? null}
              artist={tracks[idx % (tracks.length || 1)]?.artist ?? null}
              album={tracks[idx % (tracks.length || 1)]?.album ?? null}
            />
          ))}
        </div>

        {/* UI overlays — hidden when entering footer zone */}
        <animated.div
          className="absolute inset-0 z-30 pointer-events-auto"
          style={{
            opacity: progress.to((p) => (p < 0 ? Math.max(0, 1 + p * 4) : 1)),
            pointerEvents: progress.to((p) => (p < -0.2 ? "none" : "auto")),
          }}
        >
        <ModeButtons
          progress={zoomProgress}
          onMinimize={handleMinimize}
          onMaximize={handleMaximize}
          onClosePlayer={handleClosePlayer}
        />

        <TransportControls
          progress={zoomProgress}
          elapsed={elapsedSpring}
          duration={currentSong?.duration}
          isPlaying={isPlaying}
          onPlayPause={togglePlay}
          onPrev={handlePrev}
          onNext={handleNext}
          onSeek={seek}
          onScrubChange={setScrubPos}
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
            progress={zoomProgress}
          />
        )}

        <ZoomIndicator progress={zoomProgress} />
        </animated.div>
      </animated.div>

      {/* Footer — above grid, fades in when grid slides up */}
      <FooterSection progress={footerProgress} />

      <CustomCursor
        isPlaying={isPlaying}
        hoveredDiscIndex={hoveredDiscIndex}
        centerDiscIndex={centerDiscIndex}
        compact={progressRef.current === 0}
        scrubPos={scrubPos}
      />

      {/* Loading overlay — preloads cover images */}
      <LoadingOverlay
        urls={coverUrls}
        titles={tracks.map((t) => t.title)}
        ready={songsQuery.isSuccess}
        onComplete={() => setCoversLoaded(true)}
        visible={!coversLoaded}
      />
    </div>
  );
}
