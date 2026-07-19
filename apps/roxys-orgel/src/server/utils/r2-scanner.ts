/**
 * R2 key encoding/decoding utilities.
 * URL-safe base64 for use in audio/cover API endpoints.
 */

/** Encode an R2 key to a URL-safe ID */
export function encodeId(key: string): string {
  return btoa(unescape(encodeURIComponent(key)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/** Decode a URL-safe ID back to an R2 key */
export function decodeId(id: string): string {
  return decodeURIComponent(
    escape(atob(id.replace(/-/g, "+").replace(/_/g, "/"))),
  );
}
