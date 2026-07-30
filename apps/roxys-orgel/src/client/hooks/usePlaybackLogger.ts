/**
 * Playback debug logger.
 * All playback-related events are logged with context for diagnosing state issues.
 * Enable/disable via `window.__ORGEL_DEBUG = true/false` in console.
 */

const COLORS = {
  switchDisc: "#ff6b6b",
  playTrack: "#51cf66",
  togglePlay: "#ffd43b",
  click: "#74c0fc",
  drag: "#b197fc",
  snap: "#ff922b",
  prev: "#20c997",
  next: "#20c997",
  audio: "#e599f7",
  seek: "#a9e34b",
  coldStart: "#f783ac",
} as const;

type Category = keyof typeof COLORS;

function isEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return (window as unknown as Record<string, unknown>).__ORGEL_DEBUG === true;
}

export function playbackLog(
  category: Category,
  message: string,
  data?: Record<string, unknown>,
) {
  if (!isEnabled()) return;
  const color = COLORS[category];
  const timestamp = new Date().toISOString().slice(11, 23);
  const prefix = `%c[${timestamp}] %c[${category}]`;
  const styles = [`color: #888`, `color: ${color}; font-weight: bold`];
  if (data) {
    console.log(prefix, ...styles, message, data);
  } else {
    console.log(prefix, ...styles, message);
  }
}

/** Call once to enable logging from console: window.__ORGEL_DEBUG = true */
export function enablePlaybackDebug() {
  if (typeof window !== "undefined") {
    (window as unknown as Record<string, unknown>).__ORGEL_DEBUG = true;
    console.log(
      "%c[orgel] Playback debug enabled. Set window.__ORGEL_DEBUG = false to disable.",
      "color: #51cf66; font-weight: bold",
    );
  }
}
