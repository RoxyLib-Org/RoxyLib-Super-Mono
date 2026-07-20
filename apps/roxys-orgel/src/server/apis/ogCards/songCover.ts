import { Hono } from "hono";
import { decodeId, encodeId } from "@/server/utils/r2-scanner";
import type { HonoCtxEnv } from "@/shared/types";

/**
 * Song cover compositor — SVG-based, no Browser Run needed.
 * Merges album cover art with song title in a decorative layout.
 *
 * Theme: Mushoku Tensei — warm, bright, vintage, anime aesthetic.
 * Colors: ivory, gold, warm white, soft amber accents.
 *
 * GET /api/og/song-cover?title=...&coverKey=...
 *
 * Layout variants (5, selected by title hash):
 *   0 - Bottom banner: cover full bleed, title in ornate bottom banner
 *   1 - Top banner: cover full bleed, title in ornate top banner
 *   2 - Left panel: cover right 65%, decorative left panel with title
 *   3 - Right panel: cover left 65%, decorative right panel with title
 *   4 - Circular frame: cover in center circle, title arched around top
 */
export const songCoverRoute = new Hono<HonoCtxEnv>().get(
  "/api/og/song-cover",
  async (c) => {
    const title = c.req.query("title") || "Untitled";
    const coverKeyEncoded = c.req.query("coverKey") || "";

    if (!coverKeyEncoded) {
      return c.json({ error: "coverKey is required" }, 400);
    }

    const coverKey = decodeId(coverKeyEncoded);
    const cacheKey = `og/song-cover/${coverKeyEncoded}-${hashStr(title)}.png`;

    // Check R2 cache
    const cached = await c.env.R2.head(cacheKey);
    if (cached?.uploaded) {
      const age = Date.now() - cached.uploaded.getTime();
      if (age < 7200_000) {
        const obj = await c.env.R2.get(cacheKey);
        if (obj) {
          return new Response(obj.body, {
            headers: {
              "content-type": "image/svg+xml",
              "cache-control": "public, max-age=3600",
            },
          });
        }
      }
    }

    // Build cover data URL from R2
    let coverDataUrl = "";
    const coverObj = await c.env.R2.get(coverKey);
    if (coverObj) {
      const ct = coverObj.httpMetadata?.contentType || "image/jpeg";
      const buf = await coverObj.arrayBuffer();
      const b64 = uint8ToBase64(new Uint8Array(buf));
      coverDataUrl = `data:${ct};base64,${b64}`;
    }

    // Fallback: use the raw cover endpoint URL (browser will fetch it)
    if (!coverDataUrl) {
      coverDataUrl = `/api/cover/${encodeId(coverKey)}`;
    }

    const variant = hashStr(title) % 5;
    const svg = buildSvg(title, coverDataUrl, variant);

    // Cache to R2
    const svgBytes = new TextEncoder().encode(svg);
    await c.env.R2.put(cacheKey, svgBytes, {
      httpMetadata: { contentType: "image/svg+xml" },
    });

    return new Response(svg, {
      headers: {
        "content-type": "image/svg+xml",
        "cache-control": "public, max-age=3600",
      },
    });
  },
);

// ── Helpers ─────────────────────────────────────────────────────────────────

function hashStr(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ── Decorative patterns (Mushoku Tensei inspired) ───────────────────────────

/** Ornate border flourish pattern — golden arabesques */
const ORNAMENT_DEFS = `
<defs>
  <pattern id="lace" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
    <circle cx="20" cy="20" r="8" fill="none" stroke="#c9a84c" stroke-width="0.8" opacity="0.6"/>
    <circle cx="0" cy="0" r="5" fill="none" stroke="#c9a84c" stroke-width="0.5" opacity="0.4"/>
    <circle cx="40" cy="0" r="5" fill="none" stroke="#c9a84c" stroke-width="0.5" opacity="0.4"/>
    <circle cx="0" cy="40" r="5" fill="none" stroke="#c9a84c" stroke-width="0.5" opacity="0.4"/>
    <circle cx="40" cy="40" r="5" fill="none" stroke="#c9a84c" stroke-width="0.5" opacity="0.4"/>
    <path d="M10 20 Q20 10 30 20 Q20 30 10 20Z" fill="none" stroke="#daa520" stroke-width="0.6" opacity="0.5"/>
  </pattern>
  <linearGradient id="bannerGrad" x1="0%" y1="0%" x2="0%" y2="100%">
    <stop offset="0%" stop-color="#fffef5" stop-opacity="0.95"/>
    <stop offset="100%" stop-color="#fdf6e3" stop-opacity="0.97"/>
  </linearGradient>
  <linearGradient id="panelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" stop-color="#fffdf7"/>
    <stop offset="50%" stop-color="#fef9e7"/>
    <stop offset="100%" stop-color="#fdf5dc"/>
  </linearGradient>
  <filter id="softShadow" x="-5%" y="-5%" width="110%" height="110%">
    <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#8b7355" flood-opacity="0.3"/>
  </filter>
  <filter id="textGlow" x="-10%" y="-10%" width="120%" height="120%">
    <feDropShadow dx="0" dy="1" stdDeviation="1" flood-color="#c9a84c" flood-opacity="0.4"/>
  </filter>
</defs>`;

/** Decorative corner flourish SVG path */
function cornerFlourish(
  x: number,
  y: number,
  scale: number,
  rotate: number,
): string {
  return `<g transform="translate(${x},${y}) rotate(${rotate}) scale(${scale})">
    <path d="M0,0 C5,-15 20,-20 35,-15 C25,-5 15,5 0,0Z" fill="#c9a84c" opacity="0.7"/>
    <path d="M0,0 C-5,-15 -20,-20 -35,-15 C-25,-5 -15,5 0,0Z" fill="#c9a84c" opacity="0.7"/>
    <circle cx="0" cy="-18" r="3" fill="#daa520" opacity="0.8"/>
  </g>`;
}

/** Horizontal decorative divider */
function divider(x: number, y: number, width: number): string {
  const cx = x + width / 2;
  return `<g>
    <line x1="${x + 20}" y1="${y}" x2="${cx - 15}" y2="${y}" stroke="#c9a84c" stroke-width="1.2" opacity="0.6"/>
    <line x1="${cx + 15}" y1="${y}" x2="${x + width - 20}" y2="${y}" stroke="#c9a84c" stroke-width="1.2" opacity="0.6"/>
    <circle cx="${cx}" cy="${y}" r="4" fill="none" stroke="#daa520" stroke-width="1.2"/>
    <circle cx="${cx}" cy="${y}" r="1.5" fill="#daa520"/>
  </g>`;
}

// ── SVG builders ────────────────────────────────────────────────────────────

function buildSvg(title: string, coverUrl: string, variant: number): string {
  switch (variant) {
    case 0:
      return bottomBanner(title, coverUrl);
    case 1:
      return topBanner(title, coverUrl);
    case 2:
      return leftPanel(title, coverUrl);
    case 3:
      return rightPanel(title, coverUrl);
    case 4:
      return circularFrame(title, coverUrl);
    default:
      return bottomBanner(title, coverUrl);
  }
}

/** Calculates appropriate font size for title text */
function titleFontSize(title: string, maxWidth: number): number {
  const len = title.length;
  if (len <= 4) return Math.min(42, maxWidth / 3);
  if (len <= 8) return Math.min(36, maxWidth / 4);
  if (len <= 16) return Math.min(28, maxWidth / 6);
  return Math.min(22, maxWidth / 8);
}

// ── Variant 0: Bottom banner ────────────────────────────────────────────────

function bottomBanner(title: string, coverUrl: string): string {
  const fontSize = titleFontSize(title, 500);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
${ORNAMENT_DEFS}
<!-- Album cover full bleed -->
<image href="${esc(coverUrl)}" x="0" y="0" width="600" height="600" preserveAspectRatio="xMidYMid slice"/>
<!-- Bottom banner -->
<rect x="0" y="430" width="600" height="170" fill="url(#bannerGrad)" filter="url(#softShadow)"/>
<rect x="0" y="430" width="600" height="170" fill="url(#lace)" opacity="0.3"/>
<!-- Border lines -->
<line x1="30" y1="445" x2="570" y2="445" stroke="#c9a84c" stroke-width="1.5" opacity="0.8"/>
<line x1="30" y1="585" x2="570" y2="585" stroke="#c9a84c" stroke-width="1.5" opacity="0.8"/>
<!-- Corner flourishes -->
${cornerFlourish(60, 455, 0.7, 0)}
${cornerFlourish(540, 455, 0.7, 0)}
${cornerFlourish(60, 575, 0.7, 180)}
${cornerFlourish(540, 575, 0.7, 180)}
<!-- Title text -->
<text x="300" y="${515 + fontSize * 0.15}" text-anchor="middle" font-family="'Georgia', 'Noto Serif SC', serif"
  font-size="${fontSize}" font-weight="bold" fill="#4a3728" filter="url(#textGlow)">${esc(title)}</text>
<!-- Divider above title -->
${divider(100, 470, 400)}
</svg>`;
}

// ── Variant 1: Top banner ───────────────────────────────────────────────────

function topBanner(title: string, coverUrl: string): string {
  const fontSize = titleFontSize(title, 500);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
${ORNAMENT_DEFS}
<!-- Album cover full bleed -->
<image href="${esc(coverUrl)}" x="0" y="0" width="600" height="600" preserveAspectRatio="xMidYMid slice"/>
<!-- Top banner -->
<rect x="0" y="0" width="600" height="160" fill="url(#bannerGrad)" filter="url(#softShadow)"/>
<rect x="0" y="0" width="600" height="160" fill="url(#lace)" opacity="0.3"/>
<!-- Border lines -->
<line x1="30" y1="15" x2="570" y2="15" stroke="#c9a84c" stroke-width="1.5" opacity="0.8"/>
<line x1="30" y1="145" x2="570" y2="145" stroke="#c9a84c" stroke-width="1.5" opacity="0.8"/>
<!-- Corner flourishes -->
${cornerFlourish(60, 25, 0.7, 0)}
${cornerFlourish(540, 25, 0.7, 0)}
${cornerFlourish(60, 135, 0.7, 180)}
${cornerFlourish(540, 135, 0.7, 180)}
<!-- Title -->
<text x="300" y="${85 + fontSize * 0.15}" text-anchor="middle" font-family="'Georgia', 'Noto Serif SC', serif"
  font-size="${fontSize}" font-weight="bold" fill="#4a3728" filter="url(#textGlow)">${esc(title)}</text>
<!-- Divider below title -->
${divider(100, 120, 400)}
</svg>`;
}

// ── Variant 2: Left panel ───────────────────────────────────────────────────

function leftPanel(title: string, coverUrl: string): string {
  const fontSize = titleFontSize(title, 180);
  const textHeight = title.length * (fontSize + 6);
  const startY = Math.max(80, (600 - textHeight) / 2 + fontSize);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
${ORNAMENT_DEFS}
<!-- Album cover on right -->
<image href="${esc(coverUrl)}" x="210" y="0" width="390" height="600" preserveAspectRatio="xMidYMid slice"/>
<!-- Left decorative panel -->
<rect x="0" y="0" width="210" height="600" fill="url(#panelGrad)"/>
<rect x="0" y="0" width="210" height="600" fill="url(#lace)" opacity="0.25"/>
<!-- Panel border -->
<line x1="195" y1="30" x2="195" y2="570" stroke="#c9a84c" stroke-width="2" opacity="0.7"/>
<line x1="15" y1="30" x2="15" y2="570" stroke="#c9a84c" stroke-width="1" opacity="0.5"/>
<!-- Corner decorations -->
${cornerFlourish(105, 50, 0.6, 90)}
${cornerFlourish(105, 550, 0.6, -90)}
<!-- Title (vertical centered) -->
<text x="105" y="${startY}" text-anchor="middle"
  font-family="'Georgia', 'Noto Serif SC', serif" font-size="${fontSize}"
  font-weight="bold" fill="#4a3728" filter="url(#textGlow)"
  writing-mode="vertical-rl" letter-spacing="6">${esc(title)}</text>
${divider(25, 200, 160)}
${divider(25, 400, 160)}
</svg>`;
}

// ── Variant 3: Right panel ──────────────────────────────────────────────────

function rightPanel(title: string, coverUrl: string): string {
  const fontSize = titleFontSize(title, 180);
  const textHeight = title.length * (fontSize + 6);
  const startY = Math.max(80, (600 - textHeight) / 2 + fontSize);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
${ORNAMENT_DEFS}
<!-- Album cover on left -->
<image href="${esc(coverUrl)}" x="0" y="0" width="390" height="600" preserveAspectRatio="xMidYMid slice"/>
<!-- Right decorative panel -->
<rect x="390" y="0" width="210" height="600" fill="url(#panelGrad)"/>
<rect x="390" y="0" width="210" height="600" fill="url(#lace)" opacity="0.25"/>
<!-- Panel border -->
<line x1="405" y1="30" x2="405" y2="570" stroke="#c9a84c" stroke-width="2" opacity="0.7"/>
<line x1="585" y1="30" x2="585" y2="570" stroke="#c9a84c" stroke-width="1" opacity="0.5"/>
<!-- Corner decorations -->
${cornerFlourish(495, 50, 0.6, 90)}
${cornerFlourish(495, 550, 0.6, -90)}
<!-- Title (vertical centered) -->
<text x="495" y="${startY}" text-anchor="middle"
  font-family="'Georgia', 'Noto Serif SC', serif" font-size="${fontSize}"
  font-weight="bold" fill="#4a3728" filter="url(#textGlow)"
  writing-mode="vertical-rl" letter-spacing="6">${esc(title)}</text>
${divider(405, 200, 160)}
${divider(405, 400, 160)}
</svg>`;
}

// ── Variant 4: Circular frame ───────────────────────────────────────────────

function circularFrame(title: string, coverUrl: string): string {
  // Repeat title to fill the arc
  const repeated = `${title} ✦ `.repeat(
    Math.max(3, Math.ceil(60 / title.length)),
  );
  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
${ORNAMENT_DEFS}
<!-- Background -->
<rect width="600" height="600" fill="#fdf8ef"/>
<rect width="600" height="600" fill="url(#lace)" opacity="0.15"/>
<!-- Outer decorative ring -->
<circle cx="300" cy="300" r="270" fill="none" stroke="#c9a84c" stroke-width="2" opacity="0.7"/>
<circle cx="300" cy="300" r="260" fill="none" stroke="#daa520" stroke-width="0.8" opacity="0.5"/>
<!-- Album cover in center circle -->
<clipPath id="coverClip"><circle cx="300" cy="300" r="200"/></clipPath>
<image href="${esc(coverUrl)}" x="100" y="100" width="400" height="400"
  preserveAspectRatio="xMidYMid slice" clip-path="url(#coverClip)"/>
<!-- Inner ring border -->
<circle cx="300" cy="300" r="200" fill="none" stroke="#c9a84c" stroke-width="2.5"/>
<circle cx="300" cy="300" r="195" fill="none" stroke="#daa520" stroke-width="0.8" opacity="0.6"/>
<!-- Text on circular path -->
<path id="textArc" d="M 300,300 m -240,0 a 240,240 0 1,1 480,0 a 240,240 0 1,1 -480,0" fill="none"/>
<text font-family="'Georgia', 'Noto Serif SC', serif" font-size="18" fill="#6b5438" letter-spacing="2">
  <textPath href="#textArc">${esc(repeated)}</textPath>
</text>
<!-- Corner flourishes in the square corners -->
${cornerFlourish(70, 70, 0.8, 45)}
${cornerFlourish(530, 70, 0.8, 135)}
${cornerFlourish(70, 530, 0.8, -45)}
${cornerFlourish(530, 530, 0.8, -135)}
</svg>`;
}
