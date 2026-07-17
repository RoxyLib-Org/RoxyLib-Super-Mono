/** Minimal R2 bucket interface with list support (wrangler-generated types omit list) */
interface R2ScannerBucket {
  head(key: string): Promise<{
    size: number;
    httpMetadata?: { contentType?: string };
  } | null>;
  get(
    key: string,
    options?: { range?: { offset: number; length: number } },
  ): Promise<{ body: ReadableStream } | null>;
  list(options?: {
    prefix?: string;
    cursor?: string;
    limit?: number;
    delimiter?: string;
  }): Promise<{
    objects: { key: string }[];
    truncated: boolean;
    cursor?: string;
  }>;
}

/** Minimal KV namespace interface for cache */
interface KVScannerBinding {
  get(key: string): Promise<string | null>;
  put(
    key: string,
    value: string,
    options?: { expirationTtl?: number },
  ): Promise<void>;
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface R2Song {
  id: string;
  title: string;
  trackNumber: number;
  r2Key: string;
}

export interface R2Album {
  id: string;
  title: string;
  artistName: string;
  coverKey: string | null;
  songs: R2Song[];
}

export interface R2Artist {
  id: string;
  name: string;
  albumCount: number;
}

// ── ID encoding ──────────────────────────────────────────────────────────────

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

// ── Constants ────────────────────────────────────────────────────────────────

const ALBUM_PREFIX = "S1/";
const AUDIO_EXTENSIONS = [".flac", ".mp3", ".wav", ".aac", ".ogg", ".m4a"];
const COVER_PATTERN = /^cover/i;

/** Track title pattern: "01. Song Title.flac" or "01 Song Title.flac" */
const TRACK_PATTERN = /^(\d+)[.\s]\s*(.+)$/;

// ── Helpers ──────────────────────────────────────────────────────────────────

function isAudioFile(key: string): boolean {
  const lower = key.toLowerCase();
  return AUDIO_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

function isCoverFile(name: string): boolean {
  return COVER_PATTERN.test(name);
}

function stripExtension(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot > 0 ? name.slice(0, dot) : name;
}

function parseTrackInfo(filename: string): {
  trackNumber: number;
  title: string;
} {
  const name = stripExtension(filename);
  const match = TRACK_PATTERN.exec(name);
  if (match) {
    return {
      trackNumber: Number.parseInt(match[1], 10),
      title: match[2],
    };
  }
  return { trackNumber: 0, title: name };
}

/** Parse "Album Title - Artist Name" into parts */
function parseAlbumFolderName(
  folderName: string,
): { title: string; artistName: string } {
  const idx = folderName.lastIndexOf(" - ");
  if (idx > 0) {
    return {
      title: folderName.slice(0, idx),
      artistName: folderName.slice(idx + 3),
    };
  }
  return { title: folderName, artistName: "Unknown Artist" };
}

// ── Scanner ──────────────────────────────────────────────────────────────────

interface ScanCache {
  albums: R2Album[];
  artists: R2Artist[];
  timestamp: number;
}

const CACHE_KEY = "r2:scan:v2";
const CACHE_TTL = 600; // 10 minutes in seconds

/**
 * List all objects under a prefix, handling pagination.
 */
async function listAll(
  bucket: R2ScannerBucket,
  prefix: string,
): Promise<{ key: string }[]> {
  const all: { key: string }[] = [];
  let cursor: string | undefined;

  do {
    const result = await bucket.list({ prefix, cursor, limit: 1000 });
    all.push(...result.objects);
    cursor = result.truncated ? result.cursor : undefined;
  } while (cursor);

  return all;
}

/**
 * Scan the R2 bucket and return structured album/artist data with songs.
 * Results are cached in KV for CACHE_TTL seconds.
 */
export async function scanR2(
  bucket: R2ScannerBucket,
  kv: KVScannerBinding | null,
): Promise<{ albums: R2Album[]; artists: R2Artist[] }> {
  // ── KV cache ──
  if (kv) {
    try {
      const cached = await kv.get(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as ScanCache;
        if (Date.now() - parsed.timestamp < CACHE_TTL * 1000) {
          return { albums: parsed.albums, artists: parsed.artists };
        }
      }
    } catch {
      // stale, continue to re-scan
    }
  }

  // ── List all objects ──
  const allObjects = await listAll(bucket, ALBUM_PREFIX);

  // Group by album folder (first path component after prefix)
  const albumGroups = new Map<string, string[]>();
  for (const obj of allObjects) {
    const relative = obj.key.slice(ALBUM_PREFIX.length);
    const slashIdx = relative.indexOf("/");
    if (slashIdx <= 0) continue;
    const albumDir = relative.slice(0, slashIdx);
    const list = albumGroups.get(albumDir);
    if (list) {
      list.push(obj.key);
    } else {
      albumGroups.set(albumDir, [obj.key]);
    }
  }

  // ── Parse albums ──
  const albums: R2Album[] = [];
  const artistMap = new Map<string, { name: string; albumCount: number }>();

  for (const [albumDir, objectKeys] of albumGroups) {
    const { title, artistName } = parseAlbumFolderName(albumDir);

    let coverKey: string | null = null;
    const songMap = new Map<
      string,
      { title: string; trackNumber: number; r2Key: string }
    >();

    for (const key of objectKeys) {
      const filename = key.slice(key.lastIndexOf("/") + 1);
      // Check depth: root level = after albumDir, no extra "/"
      const afterAlbum = key.slice(
        ALBUM_PREFIX.length + albumDir.length + 1,
      );
      const isRootLevel = afterAlbum.indexOf("/") === -1;

      if (isRootLevel && !coverKey && isCoverFile(filename)) {
        coverKey = key;
        continue;
      }

      if (isAudioFile(filename)) {
        // Use filename as key to deduplicate
        if (!songMap.has(filename)) {
          const info = parseTrackInfo(filename);
          songMap.set(filename, {
            title: info.title,
            trackNumber: info.trackNumber,
            r2Key: key,
          });
        }
      }
    }

    const songs: R2Song[] = Array.from(songMap.values())
      .sort((a, b) => a.trackNumber - b.trackNumber)
      .map((s) => ({
        ...s,
        id: encodeId(s.r2Key),
      }));

    const albumId = encodeId(albumDir);
    albums.push({
      id: albumId,
      title,
      artistName,
      coverKey,
      songs,
    });

    const existing = artistMap.get(artistName);
    if (existing) {
      existing.albumCount++;
    } else {
      artistMap.set(artistName, { name: artistName, albumCount: 1 });
    }
  }

  const artists: R2Artist[] = Array.from(artistMap.values()).map((a) => ({
    id: encodeId(a.name),
    ...a,
  }));

  // ── Store cache ──
  if (kv) {
    const cacheData: ScanCache = { albums, artists, timestamp: Date.now() };
    try {
      await kv.put(CACHE_KEY, JSON.stringify(cacheData), {
        expirationTtl: CACHE_TTL,
      });
    } catch {
      // best effort
    }
  }

  return { albums, artists };
}
