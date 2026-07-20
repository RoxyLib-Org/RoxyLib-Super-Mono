/**
 * 50 Retro European tri-color palettes + 12 ornamental SVG patterns.
 *
 * Selection logic:
 * - Album name → background palette (background color + accent)
 * - Song title → decorative pattern (SVG overlay)
 */

// ── 50 Retro European Tri-Color Palettes ─────────────────────────────────────
// Each: [background, accent, detail/text]
export const COVER_PALETTES: [bg: string, accent: string, detail: string][] = [
  ["#f5e6d3", "#8b4513", "#2c1810"],
  ["#faf0e6", "#b8860b", "#3d2b1f"],
  ["#fff8dc", "#cd853f", "#4a2c2a"],
  ["#f5deb3", "#a0522d", "#1a1a2e"],
  ["#ffe4c4", "#d2691e", "#2f1b14"],
  ["#f2e6e9", "#722f37", "#1c1019"],
  ["#fce4ec", "#880e4f", "#1a0a10"],
  ["#f8e8e0", "#8b0000", "#2d1f1f"],
  ["#f5e6ea", "#6b2d5b", "#1a0f1a"],
  ["#ede0d4", "#9b2335", "#1b1016"],
  ["#e8f0e4", "#2e5339", "#0d1b0f"],
  ["#f0f4e8", "#556b2f", "#1a2310"],
  ["#e6ede0", "#3a5a40", "#0f1a0f"],
  ["#eaf2e4", "#4a7c59", "#152015"],
  ["#e0ebe0", "#2d5a27", "#0a1408"],
  ["#e8eef5", "#1a3a6b", "#0a0f1a"],
  ["#e6eef8", "#2c4875", "#0d1520"],
  ["#eaf0fa", "#1e3a5f", "#080d14"],
  ["#e4ecf4", "#34547a", "#0f1926"],
  ["#dfe8f0", "#1b365d", "#060b14"],
  ["#fdf6e3", "#b8860b", "#3d2b1f"],
  ["#fef9ef", "#c49102", "#2e1f09"],
  ["#fff8e7", "#996515", "#1f1408"],
  ["#fcf4e0", "#a67b5b", "#261a10"],
  ["#fdf5e6", "#b87333", "#1e0f06"],
  ["#f5e6f0", "#8b5e83", "#2a1a28"],
  ["#f8e8f4", "#9c5088", "#1f0d1a"],
  ["#f0e0ea", "#7b4b6e", "#1a0f18"],
  ["#f4e4ee", "#a05080", "#200f1c"],
  ["#efe0e8", "#6d3b5e", "#150c14"],
  ["#e0f0f0", "#1a6b6b", "#0a1a1a"],
  ["#e4f2f0", "#2d7a72", "#0d1f1d"],
  ["#e8f4f2", "#1f5f5b", "#081614"],
  ["#dceeed", "#3a8a7a", "#0f2420"],
  ["#e2f0ee", "#2a6b65", "#0a1815"],
  ["#ecedf0", "#4a5568", "#1a1c20"],
  ["#e8eaee", "#374151", "#0f1114"],
  ["#f0f1f4", "#5a6578", "#1e2028"],
  ["#e6e8ec", "#3d4a5c", "#10141a"],
  ["#eaecf0", "#475569", "#161820"],
  ["#f8ece0", "#c55a11", "#2d1408"],
  ["#f5e8da", "#a0522d", "#1e0f08"],
  ["#fae8d8", "#b5651d", "#241206"],
  ["#f2e4d6", "#cc7722", "#201008"],
  ["#f8ead8", "#9e4a1a", "#1a0b05"],
  ["#ece4f4", "#5b2d8e", "#150a24"],
  ["#f0e6f8", "#6a1b9a", "#120820"],
  ["#e8e0f2", "#4a1a7a", "#0e0618"],
  ["#eee4f6", "#7b2d8b", "#180a22"],
  ["#e6dff0", "#5c247a", "#0c0616"],
];

// ── Ornamental SVG Pattern Generators ────────────────────────────────────────
// Each takes a stroke color and returns a CSS background-image data URI.

function svgBg(svg: string): string {
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

/** Damask floral motif */
function patDamask(c: string): string {
  return svgBg(
    `<svg xmlns='http://www.w3.org/2000/svg' width='60' height='60'><path d='M30 5c4 8 12 12 12 20s-8 12-12 20c-4-8-12-12-12-20s8-12 12-20z' fill='none' stroke='${c}' stroke-opacity='.15'/><circle cx='30' cy='30' r='4' fill='none' stroke='${c}' stroke-opacity='.12'/></svg>`,
  );
}

/** Fleur-de-lis repeating */
function patFleurDeLis(c: string): string {
  return svgBg(
    `<svg xmlns='http://www.w3.org/2000/svg' width='50' height='50'><path d='M25 8c0 6-4 10-4 14s4 6 4 10c0-4 4-6 4-10s-4-8-4-14z' fill='none' stroke='${c}' stroke-opacity='.14'/><path d='M25 32c-2 3-6 4-8 3 2 1 6 2 8 7 2-5 6-6 8-7-2 1-6 0-8-3z' fill='none' stroke='${c}' stroke-opacity='.14'/></svg>`,
  );
}

/** Art nouveau vine scrollwork */
function patVineScroll(c: string): string {
  return svgBg(
    `<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'><path d='M10 40c10-10 20-5 30 0s20 10 30 0' fill='none' stroke='${c}' stroke-opacity='.12'/><path d='M10 60c10-10 20-5 30 0s20 10 30 0' fill='none' stroke='${c}' stroke-opacity='.1'/><circle cx='25' cy='35' r='3' fill='none' stroke='${c}' stroke-opacity='.1'/><circle cx='55' cy='55' r='3' fill='none' stroke='${c}' stroke-opacity='.1'/></svg>`,
  );
}

/** Greek key / meander border */
function patMeander(c: string): string {
  return svgBg(
    `<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40'><path d='M0 20h10v-10h10v10h10v-10h10M0 40h10v-10h10v10h10v-10h10' fill='none' stroke='${c}' stroke-opacity='.12' stroke-width='.8'/></svg>`,
  );
}

/** Arabesque geometric star */
function patArabesque(c: string): string {
  return svgBg(
    `<svg xmlns='http://www.w3.org/2000/svg' width='60' height='60'><polygon points='30,5 35,20 50,20 38,30 42,45 30,36 18,45 22,30 10,20 25,20' fill='none' stroke='${c}' stroke-opacity='.13'/></svg>`,
  );
}

/** Ogee / onion dome lattice */
function patOgee(c: string): string {
  return svgBg(
    `<svg xmlns='http://www.w3.org/2000/svg' width='60' height='80'><path d='M0 40c15-20 15-40 30-40s15 20 30 40c-15 20-15 40-30 40s-15-20-30-40z' fill='none' stroke='${c}' stroke-opacity='.12'/></svg>`,
  );
}

/** Waves / seigaiha */
function patWaves(c: string): string {
  return svgBg(
    `<svg xmlns='http://www.w3.org/2000/svg' width='56' height='28'><path d='M0 14c7-14 21-14 28 0s21 14 28 0M0 28c7-14 21-14 28 0s21 14 28 0' fill='none' stroke='${c}' stroke-opacity='.12'/></svg>`,
  );
}

/** Trefoil / clover */
function patTrefoil(c: string): string {
  return svgBg(
    `<svg xmlns='http://www.w3.org/2000/svg' width='50' height='50'><circle cx='25' cy='18' r='8' fill='none' stroke='${c}' stroke-opacity='.12'/><circle cx='18' cy='32' r='8' fill='none' stroke='${c}' stroke-opacity='.12'/><circle cx='32' cy='32' r='8' fill='none' stroke='${c}' stroke-opacity='.12'/></svg>`,
  );
}

/** Diamond lattice */
function patDiamondLattice(c: string): string {
  return svgBg(
    `<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40'><path d='M20 0L40 20L20 40L0 20Z' fill='none' stroke='${c}' stroke-opacity='.11'/><circle cx='20' cy='20' r='3' fill='none' stroke='${c}' stroke-opacity='.09'/></svg>`,
  );
}

/** Filigree corners */
function patFiligree(c: string): string {
  return svgBg(
    `<svg xmlns='http://www.w3.org/2000/svg' width='60' height='60'><path d='M5 5c10 0 15 5 15 15M55 5c-10 0-15 5-15 15M5 55c10 0 15-5 15-15M55 55c-10 0-15-5-15-15' fill='none' stroke='${c}' stroke-opacity='.14' stroke-width='.8'/><circle cx='30' cy='30' r='5' fill='none' stroke='${c}' stroke-opacity='.1'/></svg>`,
  );
}

/** Baroque acanthus leaf */
function patAcanthus(c: string): string {
  return svgBg(
    `<svg xmlns='http://www.w3.org/2000/svg' width='70' height='70'><path d='M35 10c-5 10-15 15-10 25s15 5 10 20' fill='none' stroke='${c}' stroke-opacity='.13'/><path d='M35 10c5 10 15 15 10 25s-15 5-10 20' fill='none' stroke='${c}' stroke-opacity='.13'/><circle cx='35' cy='10' r='2' fill='${c}' fill-opacity='.1'/></svg>`,
  );
}

/** Celtic knot interlace */
function patCelticKnot(c: string): string {
  return svgBg(
    `<svg xmlns='http://www.w3.org/2000/svg' width='50' height='50'><path d='M10 25c5-10 15-10 15 0s10 10 15 0' fill='none' stroke='${c}' stroke-opacity='.12'/><path d='M10 25c5 10 15 10 15 0s10-10 15 0' fill='none' stroke='${c}' stroke-opacity='.12'/></svg>`,
  );
}

// All pattern generators indexed for selection
const PATTERN_FNS: ((color: string) => string)[] = [
  patDamask,
  patFleurDeLis,
  patVineScroll,
  patMeander,
  patArabesque,
  patOgee,
  patWaves,
  patTrefoil,
  patDiamondLattice,
  patFiligree,
  patAcanthus,
  patCelticKnot,
];

// ── Hash + Selection Logic ───────────────────────────────────────────────────

/** Simple string hash (djb2) → stable positive integer */
function hashStr(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/**
 * Get cover style based on album (background) and title (pattern).
 * Returns { backgroundColor, backgroundPattern, accentColor, detailColor }
 */
export function getCoverStyle(
  album: string | null | undefined,
  title: string | null | undefined,
): {
  backgroundColor: string;
  backgroundPattern: string;
  accentColor: string;
  detailColor: string;
} {
  // Album → palette selection
  const albumHash = hashStr(album || "default-album");
  const palette = COVER_PALETTES[albumHash % COVER_PALETTES.length];

  // Title → pattern selection, using accent color for stroke
  const titleHash = hashStr(title || "default-title");
  const patternFn = PATTERN_FNS[titleHash % PATTERN_FNS.length];
  const pattern = patternFn(palette[1]); // use accent color for pattern stroke

  return {
    backgroundColor: palette[0],
    backgroundPattern: pattern,
    accentColor: palette[1],
    detailColor: palette[2],
  };
}
