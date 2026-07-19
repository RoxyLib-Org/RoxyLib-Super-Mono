/**
 * Types for song/lyric data used by UI components.
 * Actual data comes from tRPC backend (D1 + R2).
 */

export interface LyricLine {
  /** Start time in seconds */
  time: number;
  /** Lyric text for this line */
  text: string;
}

export interface Song {
  id: number;
  title: string;
  artist: string;
  album: string;
  /** Duration in seconds */
  duration: number;
  /** Direct audio URL (unused — audio loaded via R2 key) */
  audioUrl: string;
  /** Color theme (unused — derived from disc palette) */
  color: string;
  lyrics: LyricLine[];
}
