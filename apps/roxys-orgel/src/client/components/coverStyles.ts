/**
 * 50 Retro European tri-color palettes + 12 ornamental SVG patterns.
 *
 * Selection logic:
 * - Album name → background palette (background color + accent)
 * - Song title → decorative pattern (symbol/water/floral)
 */

// ── 50 Retro European Tri-Color Palettes ─────────────────────────────────────
// Each: [background, accent, detail/text]
// These are BOLD vintage colors — not pastels. Think: old book covers,
// Art Deco posters, Victorian packaging, Bauhaus prints.
export const COVER_PALETTES: [bg: string, accent: string, detail: string][] = [
  // ── Warm Earth & Terracotta (0-9) ──
  ["#c9a96e", "#5c2018", "#1a0d08"], // aged gold / ox blood
  ["#d4a574", "#7b2d26", "#fdf5e6"], // tan leather / brick red
  ["#bf8040", "#2c1810", "#f5e6d3"], // amber / dark mahogany
  ["#a67b5b", "#3d1c11", "#faebd7"], // cocoa / espresso
  ["#c8956c", "#6b1b1b", "#fff8dc"], // terracotta / deep crimson
  ["#b07843", "#1e3a2a", "#f5deb3"], // burnt sienna / forest
  ["#d4a06a", "#4a1528", "#fef9ef"], // butterscotch / plum
  ["#9c6b3a", "#2b1f14", "#e8d5b7"], // walnut / charcoal brown
  ["#c49060", "#541e1e", "#fdf6e3"], // caramel / burgundy
  ["#a8845c", "#1a2e1a", "#f0e6d0"], // toffee / hunter green

  // ── Deep Blues & Navy (10-19) ──
  ["#2c4a6e", "#c9a96e", "#f0e6d0"], // navy / gold
  ["#1e3a5f", "#d4a06a", "#fdf5e6"], // midnight / amber
  ["#3a5a8a", "#b87333", "#fff8dc"], // steel blue / copper
  ["#1a3050", "#c8956c", "#f5e6d3"], // dark navy / terracotta
  ["#2a4070", "#a67b5b", "#faebd7"], // indigo / tan
  ["#344e6e", "#cd853f", "#f5deb3"], // slate / peru
  ["#1b365d", "#d2691e", "#ffe4c4"], // prussian / chocolate
  ["#253d5a", "#bf8040", "#fef9ef"], // deep teal-navy / amber
  ["#2f4f6f", "#9c6b3a", "#f0e6d0"], // ocean / walnut
  ["#1a2e4e", "#b8860b", "#fdf6e3"], // abyss / dark gold

  // ── Rich Greens (20-29) ──
  ["#2e5339", "#c9a96e", "#fdf5e6"], // evergreen / gold
  ["#3a5a40", "#d4a574", "#fff8dc"], // moss / tan
  ["#1e4030", "#b87333", "#f5e6d3"], // dark emerald / copper
  ["#4a6b4a", "#a67b5b", "#faebd7"], // olive green / cocoa
  ["#2d5a27", "#c49060", "#f5deb3"], // forest / caramel
  ["#3d6b3d", "#8b4513", "#fef9ef"], // sage-deep / saddle
  ["#1a3a2a", "#cd853f", "#ffe4c4"], // deep pine / peru
  ["#4a7c59", "#bf8040", "#f0e6d0"], // jade / amber
  ["#355e3b", "#a0522d", "#fdf6e3"], // celtic green / sienna
  ["#2a4a30", "#d2691e", "#f5deb3"], // bottle green / chocolate

  // ── Burgundy & Wine (30-39) ──
  ["#5c1a2a", "#c9a96e", "#fdf5e6"], // burgundy / gold
  ["#6b2d3a", "#d4a06a", "#fff8dc"], // wine / butterscotch
  ["#4a1528", "#b87333", "#f5e6d3"], // plum-dark / copper
  ["#7b2040", "#a67b5b", "#faebd7"], // raspberry / cocoa
  ["#5a1e30", "#c49060", "#f5deb3"], // claret / caramel
  ["#3d1020", "#cd853f", "#fef9ef"], // oxblood / peru
  ["#6a2040", "#bf8040", "#ffe4c4"], // magenta-dark / amber
  ["#4b1225", "#d2691e", "#f0e6d0"], // maroon / chocolate
  ["#5c2040", "#9c6b3a", "#fdf6e3"], // mulberry / walnut
  ["#3a0e1a", "#b8860b", "#f5deb3"], // port wine / dark gold

  // ── Royal Purple & Violet (40-44) ──
  ["#3a1a5c", "#c9a96e", "#fdf5e6"], // royal purple / gold
  ["#4a2070", "#d4a06a", "#fff8dc"], // dark violet / butterscotch
  ["#2d1050", "#b87333", "#f5e6d3"], // indigo-purple / copper
  ["#5a2d7a", "#a67b5b", "#faebd7"], // amethyst-dark / cocoa
  ["#3d1860", "#c49060", "#f5deb3"], // grape / caramel

  // ── Charcoal & Graphite (45-49) ──
  ["#2a2a2a", "#c9a96e", "#f0e6d0"], // near black / gold
  ["#3a3a3a", "#d4a574", "#fdf5e6"], // charcoal / tan
  ["#1e1e2e", "#b87333", "#fff8dc"], // ink / copper
  ["#2d2d3d", "#cd853f", "#f5deb3"], // dark graphite / peru
  ["#3a3040", "#bf8040", "#fef9ef"], // plum-grey / amber
];

// ── Ornamental SVG Pattern Generators ────────────────────────────────────────
// Higher opacity (0.3-0.5) so patterns are CLEARLY visible.

function svgBg(svg: string): string {
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

/** Damask floral motif */
function patDamask(c: string): string {
  return svgBg(
    `<svg xmlns='http://www.w3.org/2000/svg' width='60' height='60'><path d='M30 5c4 8 12 12 12 20s-8 12-12 20c-4-8-12-12-12-20s8-12 12-20z' fill='none' stroke='${c}' stroke-opacity='.35' stroke-width='1.2'/><circle cx='30' cy='30' r='4' fill='${c}' fill-opacity='.15'/></svg>`,
  );
}

/** Fleur-de-lis repeating */
function patFleurDeLis(c: string): string {
  return svgBg(
    `<svg xmlns='http://www.w3.org/2000/svg' width='50' height='50'><path d='M25 8c0 6-4 10-4 14s4 6 4 10c0-4 4-6 4-10s-4-8-4-14z' fill='${c}' fill-opacity='.2' stroke='${c}' stroke-opacity='.4'/><path d='M25 32c-2 3-6 4-8 3 2 1 6 2 8 7 2-5 6-6 8-7-2 1-6 0-8-3z' fill='${c}' fill-opacity='.15' stroke='${c}' stroke-opacity='.35'/></svg>`,
  );
}

/** Art nouveau vine scrollwork */
function patVineScroll(c: string): string {
  return svgBg(
    `<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'><path d='M10 40c10-10 20-5 30 0s20 10 30 0' fill='none' stroke='${c}' stroke-opacity='.35' stroke-width='1.5'/><path d='M10 60c10-10 20-5 30 0s20 10 30 0' fill='none' stroke='${c}' stroke-opacity='.3' stroke-width='1'/><circle cx='25' cy='35' r='3' fill='${c}' fill-opacity='.25'/><circle cx='55' cy='55' r='3' fill='${c}' fill-opacity='.2'/></svg>`,
  );
}

/** Greek key / meander border */
function patMeander(c: string): string {
  return svgBg(
    `<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40'><path d='M0 20h10v-10h10v10h10v-10h10M0 40h10v-10h10v10h10v-10h10' fill='none' stroke='${c}' stroke-opacity='.4' stroke-width='1.2'/></svg>`,
  );
}

/** Arabesque geometric star */
function patArabesque(c: string): string {
  return svgBg(
    `<svg xmlns='http://www.w3.org/2000/svg' width='60' height='60'><polygon points='30,5 35,20 50,20 38,30 42,45 30,36 18,45 22,30 10,20 25,20' fill='${c}' fill-opacity='.12' stroke='${c}' stroke-opacity='.4' stroke-width='1'/></svg>`,
  );
}

/** Ogee / onion dome lattice */
function patOgee(c: string): string {
  return svgBg(
    `<svg xmlns='http://www.w3.org/2000/svg' width='50' height='80'><path d='M25 0c12 15 12 25 0 40c-12-15-12-25 0-40z' fill='none' stroke='${c}' stroke-opacity='.35' stroke-width='1.2'/><path d='M0 40c12 15 12 25 0 40M50 40c-12 15-12 25 0 40' fill='none' stroke='${c}' stroke-opacity='.3' stroke-width='1'/></svg>`,
  );
}

/** Waves / seigaiha */
function patWaves(c: string): string {
  return svgBg(
    `<svg xmlns='http://www.w3.org/2000/svg' width='60' height='30'><path d='M0 15c10-10 20-10 30 0s20 10 30 0' fill='none' stroke='${c}' stroke-opacity='.4' stroke-width='1.3'/><path d='M0 25c10-10 20-10 30 0s20 10 30 0' fill='none' stroke='${c}' stroke-opacity='.25' stroke-width='.8'/></svg>`,
  );
}

/** Trefoil / clover */
function patTrefoil(c: string): string {
  return svgBg(
    `<svg xmlns='http://www.w3.org/2000/svg' width='50' height='50'><circle cx='25' cy='18' r='7' fill='none' stroke='${c}' stroke-opacity='.35' stroke-width='1.2'/><circle cx='18' cy='30' r='7' fill='none' stroke='${c}' stroke-opacity='.35' stroke-width='1.2'/><circle cx='32' cy='30' r='7' fill='none' stroke='${c}' stroke-opacity='.35' stroke-width='1.2'/><line x1='25' y1='25' x2='25' y2='42' stroke='${c}' stroke-opacity='.3' stroke-width='1.5'/></svg>`,
  );
}

/** Diamond lattice */
function patDiamondLattice(c: string): string {
  return svgBg(
    `<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40'><path d='M20 0L40 20L20 40L0 20Z' fill='none' stroke='${c}' stroke-opacity='.4' stroke-width='1.2'/><circle cx='20' cy='20' r='3' fill='${c}' fill-opacity='.2'/></svg>`,
  );
}

/** Filigree corners */
function patFiligree(c: string): string {
  return svgBg(
    `<svg xmlns='http://www.w3.org/2000/svg' width='60' height='60'><path d='M5 5c15 0 15 15 0 15M55 5c-15 0-15 15 0 15M5 55c15 0 15-15 0-15M55 55c-15 0-15-15 0-15' fill='none' stroke='${c}' stroke-opacity='.4' stroke-width='1.2'/><circle cx='30' cy='30' r='2' fill='${c}' fill-opacity='.3'/></svg>`,
  );
}

/** Baroque acanthus leaf */
function patAcanthus(c: string): string {
  return svgBg(
    `<svg xmlns='http://www.w3.org/2000/svg' width='70' height='70'><path d='M35 10c-5 10 0 20-10 25c10-2 15 5 10 15c5-10 15-10 20-5c-5-10-10-15 0-20c-10 2-15-5-20-15z' fill='${c}' fill-opacity='.12' stroke='${c}' stroke-opacity='.35' stroke-width='1'/></svg>`,
  );
}

/** Celtic knot interlace */
function patCelticKnot(c: string): string {
  return svgBg(
    `<svg xmlns='http://www.w3.org/2000/svg' width='50' height='50'><path d='M10 10c10 0 10 10 0 10s-10 10 0 10c10 0 10 10 0 10' fill='none' stroke='${c}' stroke-opacity='.35' stroke-width='1.5'/><path d='M30 10c10 0 10 10 0 10s-10 10 0 10c10 0 10 10 0 10' fill='none' stroke='${c}' stroke-opacity='.35' stroke-width='1.5'/></svg>`,
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
    h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  }
  return h;
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
