import { useCallback, useEffect, useRef, useState } from "react";
import { encodeId } from "@/shared/encode-id";

export interface AudioTrack {
  r2Key: string;
  title: string;
  artistName: string;
  albumTitle: string;
}

export interface AudioPlayer {
  /** Whether audio is currently playing */
  isPlaying: boolean;
  /** Current playback position in seconds (state — triggers re-render) */
  currentTime: number;
  /** Total duration in seconds (0 until loaded) */
  duration: number;
  /** Whether the audio element has a source loaded */
  hasSrc: boolean;
  /** Read current time imperatively without triggering re-render */
  getTime: () => number;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  seek: (time: number) => void;
  load: (track: AudioTrack) => void;
  /** Load a track and auto-play once ready */
  loadAndPlay: (track: AudioTrack) => void;
}

/**
 * Manages an HTML5 Audio element for streaming from R2.
 * Returns reactive state + imperative controls.
 */
export function useAudioPlayer(): AudioPlayer {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hasSrc, setHasSrc] = useState(false);
  const playOnLoadRef = useRef(false);
  const rafRef = useRef(0);

  // Create audio element once
  useEffect(() => {
    const audio = new Audio();
    audio.preload = "metadata";
    audioRef.current = audio;

    audio.addEventListener("loadedmetadata", () => {
      setDuration(audio.duration);
    });

    audio.addEventListener("ended", () => {
      setIsPlaying(false);
      setCurrentTime(0);
    });

    audio.addEventListener("canplay", () => {
      if (playOnLoadRef.current) {
        playOnLoadRef.current = false;
        audio.play().then(
          () => setIsPlaying(true),
          () => {}, // autoplay blocked
        );
      }
    });

    return () => {
      cancelAnimationFrame(rafRef.current);
      audio.pause();
      audio.src = "";
    };
  }, []);

  // RAF loop for smooth currentTime updates while playing
  useEffect(() => {
    if (isPlaying) {
      const tick = () => {
        const audio = audioRef.current;
        if (audio) setCurrentTime(audio.currentTime);
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(rafRef.current);
    }
  }, [isPlaying]);

  const getTime = useCallback(() => audioRef.current?.currentTime ?? 0, []);

  const play = useCallback(() => {
    const audio = audioRef.current;
    if (!audio?.src) return;
    audio.play().then(
      () => setIsPlaying(true),
      () => {}, // autoplay blocked — ignore
    );
  }, []);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setIsPlaying(false);
  }, []);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      play();
    } else {
      pause();
    }
  }, [play, pause]);

  const seek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const load = useCallback((track: AudioTrack) => {
    const audio = audioRef.current;
    if (!audio) return;
    const url = `/api/audio/${encodeId(track.r2Key)}`;
    // Only reload if different track
    if (!audio.src.endsWith(url)) {
      audio.src = url;
      audio.load();
      setHasSrc(true);
      setCurrentTime(0);
      setDuration(0);
    }
  }, []);

  const loadAndPlay = useCallback((track: AudioTrack) => {
    const audio = audioRef.current;
    if (!audio) return;
    const url = `/api/audio/${encodeId(track.r2Key)}`;
    const isSameTrack = audio.src.endsWith(url);

    if (!isSameTrack) {
      audio.src = url;
      audio.load();
      setHasSrc(true);
    }

    // All track switches start from zero — unconditionally
    audio.currentTime = 0;
    setCurrentTime(0);
    setDuration(isSameTrack ? audio.duration || 0 : 0);

    audio.play().then(
      () => setIsPlaying(true),
      () => {
        if (!isSameTrack) playOnLoadRef.current = true;
      },
    );
  }, []);

  return {
    isPlaying,
    currentTime,
    duration,
    hasSrc,
    getTime,
    play,
    pause,
    toggle,
    seek,
    load,
    loadAndPlay,
  };
}
