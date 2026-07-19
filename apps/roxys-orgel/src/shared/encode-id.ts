/** Encode an R2 key to a URL-safe base64 ID (for audio/cover URLs) */
export function encodeId(key: string): string {
  return btoa(unescape(encodeURIComponent(key)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}
