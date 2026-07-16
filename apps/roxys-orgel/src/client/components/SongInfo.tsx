import { animated, useSpring } from "@react-spring/web";
import { useEffect, useRef, useState } from "react";
import type { Song } from "../data/songs";

interface SongInfoProps {
  /** Current song metadata */
  song: Song;
  /** Whether we're in player mode (progress ≈ 1) */
  isPlayerMode: boolean;
}

/**
 * Displays song title, artist, album in the top-right corner.
 * - In non-player mode: briefly flashes on disc switch then fades out
 * - In player mode: stays visible persistently
 */
export function SongInfo({ song, isPlayerMode }: SongInfoProps) {
  const [displaySong, setDisplaySong] = useState<Song | null>(null);
  const fadeTimerRef = useRef(0);

  const [flashSpring, flashApi] = useSpring(() => ({
    opacity: 0,
    config: { tension: 260, friction: 20 },
  }));

  // When song changes, show briefly (flash) in non-player mode
  useEffect(() => {
    setDisplaySong(song);

    if (isPlayerMode) {
      clearTimeout(fadeTimerRef.current);
      flashApi.start({ opacity: 1 });
    } else {
      flashApi.start({ opacity: 1 });
      clearTimeout(fadeTimerRef.current);
      fadeTimerRef.current = window.setTimeout(() => {
        flashApi.start({ opacity: 0 });
      }, 2500);
    }

    return () => clearTimeout(fadeTimerRef.current);
  }, [song, isPlayerMode, flashApi]);

  if (!displaySong) return null;

  return (
    <animated.div
      className="absolute top-4 right-4 sm:top-8 sm:right-8 text-right z-20 pointer-events-none max-w-[60vw]"
      style={{
        opacity: flashSpring.opacity,
        transform: flashSpring.opacity.to(
          (v) => `translateX(${(1 - v) * 12}px)`,
        ),
      }}
    >
      <div className="text-white text-lg sm:text-2xl font-bold leading-tight truncate">
        {displaySong.title}
      </div>
      <div className="text-white/70 text-sm sm:text-base mt-0.5 truncate">
        {displaySong.artist}
      </div>
      <div className="text-white/50 text-xs sm:text-sm mt-0.5 truncate">
        {displaySong.album}
      </div>
    </animated.div>
  );
}
