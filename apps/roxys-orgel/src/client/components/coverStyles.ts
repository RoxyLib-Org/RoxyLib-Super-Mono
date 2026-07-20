/**
 * 50 Near-white warm-tinted palettes + 12 ornamental SVG patterns.
 *
 * Design: backgrounds are all near-white with a warm color cast (泛暖色).
 * Red, yellow, orange, amber, peach, apricot, cream — like old parchment
 * under golden lamplight. Patterns are ghostly watermarks.
 *
 * Selection logic:
 * - Album name → warm-tinted background + accent color
 * - Song title → decorative pattern
 */

// Each: [background (near-white warm tint), accent (for pattern stroke), text (dark warm)]
export const COVER_PALETTES: [bg: string, accent: string, text: string][] = [
  // ── Golden / Honey (0-9) — 明显偏黄的暖白 ──
  ["#f5e8c8", "#8a6020", "#3a2808"], // honey cream
  ["#f8eccf", "#9a7030", "#2c1c06"], // golden parchment
  ["#f2e4c0", "#7a5018", "#342008"], // amber linen
  ["#f6e9ca", "#b08030", "#2e1e06"], // marigold cream
  ["#f0e2bb", "#6a4810", "#382408"], // old gold
  ["#f4e6c4", "#a07028", "#301c04"], // saffron white
  ["#f8ecd0", "#8a6020", "#2a1a06"], // buttercup
  ["#f3e5c2", "#b88830", "#341e06"], // sunlight parchment
  ["#f7eacc", "#9a7828", "#2c1a04"], // wheat
  ["#f1e3be", "#7a5818", "#362206"], // flax

  // ── Peach / Apricot (10-19) — 明显偏橙的暖白 ──
  ["#f8e0c8", "#c06020", "#3a1c08"], // peach
  ["#f5dcc2", "#a85018", "#2c1608"], // apricot
  ["#fae4cc", "#d07030", "#38200a"], // cantaloupe
  ["#f3d8bc", "#b05818", "#2a1406"], // papaya
  ["#f7e0c6", "#c86828", "#341a08"], // tangerine cream
  ["#f2d8be", "#a04810", "#2e1606"], // burnt peach
  ["#f6dcc4", "#b86020", "#301808"], // melon
  ["#fae2ca", "#d08038", "#2c1406"], // coral cream
  ["#f4dac0", "#a85820", "#361c0a"], // salmon parchment
  ["#f8e0c6", "#c07028", "#2a1408"], // apricot gold

  // ── Rose / Warm Pink (20-29) — 明显偏红粉的暖白 ──
  ["#f8d8d0", "#b03820", "#3a1410"], // rose cream
  ["#f5d4ca", "#982c18", "#2c100a"], // blush
  ["#fadcce", "#c04830", "#381816"], // coral blush
  ["#f3d0c4", "#a03420", "#2a100c"], // warm rose
  ["#f6d6c8", "#b84028", "#341210"], // dusty rose
  ["#f2cec0", "#8a2818", "#2e0e0a"], // terracotta pink
  ["#f7d4c8", "#a83420", "#30100c"], // petal
  ["#fad8cc", "#c05038", "#2c1208"], // shell pink
  ["#f4d0c2", "#a03828", "#361410"], // rosewood cream
  ["#f8d6c8", "#b84430", "#2a100a"], // vintage rose

  // ── Amber / Caramel (30-39) — 明显偏深黄/焦糖的暖白 ──
  ["#f0dcc0", "#906020", "#342008"], // caramel cream
  ["#edd8b8", "#7a5018", "#2c1806"], // butterscotch
  ["#f2dfc4", "#a87028", "#38220a"], // toffee
  ["#eed9ba", "#886018", "#301c08"], // maple
  ["#f1dcc0", "#9a6820", "#2e1a06"], // dulce
  ["#edd6b4", "#785018", "#342006"], // camel
  ["#f0d9bc", "#a07028", "#2c1a08"], // fawn
  ["#ecd4b0", "#886020", "#381e06"], // tan
  ["#f1dabe", "#9a7028", "#301c04"], // khaki cream
  ["#edd6b6", "#7a5818", "#34200a"], // sand

  // ── Cinnamon / Russet (40-49) — 明显偏红棕的暖白 ──
  ["#f0d4c0", "#804020", "#2c1208"], // cinnamon cream
  ["#ecd0ba", "#6a3018", "#241006"], // nutmeg
  ["#f2d6c2", "#904828", "#2e1408"], // spice
  ["#edd0b8", "#784020", "#281008"], // clove
  ["#f0d4be", "#8a4828", "#301208"], // ginger
  ["#eaceb4", "#683018", "#221006"], // cocoa cream
  ["#eed2ba", "#7a3820", "#2a1008"], // mocha
  ["#f2d6c0", "#985028", "#2c1208"], // sienna cream
  ["#ecd0b6", "#703820", "#28100a"], // umber cream
  ["#f0d4bc", "#884020", "#261008"], // russet
];

// ── Ornamental SVG Pattern Generators ────────────────────────────────────────
// Mid-opacity (0.15-0.25): subtle but clearly visible ornamental watermarks.

function svgBg(svg: string): string {
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

/** Damask floral motif */
function patDamask(c: string): string {
  return svgBg(
    `<svg xmlns='http://www.w3.org/2000/svg' width='60' height='60'><path d='M30 5c4 8 12 12 12 20s-8 12-12 20c-4-8-12-12-12-20s8-12 12-20z' fill='none' stroke='${c}' stroke-opacity='.22'/><circle cx='30' cy='30' r='4' fill='${c}' fill-opacity='.14'/></svg>`,
  );
}

/** Fleur-de-lis repeating */
function patFleurDeLis(c: string): string {
  return svgBg(
    `<svg xmlns='http://www.w3.org/2000/svg' width='50' height='50'><path d='M25 8c0 6-4 10-4 14s4 6 4 10c0-4 4-6 4-10s-4-8-4-14z' fill='${c}' fill-opacity='.12' stroke='${c}' stroke-opacity='.22'/><path d='M25 32c-2 3-6 4-8 3 2 1 6 2 8 7 2-5 6-6 8-7-2 1-6 0-8-3z' fill='${c}' fill-opacity='.1' stroke='${c}' stroke-opacity='.2'/></svg>`,
  );
}

/** Art nouveau vine scrollwork */
function patVineScroll(c: string): string {
  return svgBg(
    `<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'><path d='M10 40c10-10 20-5 30 0s20 10 30 0' fill='none' stroke='${c}' stroke-opacity='.22' stroke-width='1.2'/><path d='M10 60c10-10 20-5 30 0s20 10 30 0' fill='none' stroke='${c}' stroke-opacity='.16' stroke-width='.8'/><circle cx='25' cy='35' r='3' fill='${c}' fill-opacity='.14'/><circle cx='55' cy='55' r='3' fill='${c}' fill-opacity='.12'/></svg>`,
  );
}

/** Greek key / meander border */
function patMeander(c: string): string {
  return svgBg(
    `<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40'><path d='M0 20h10v-10h10v10h10v-10h10M0 40h10v-10h10v10h10v-10h10' fill='none' stroke='${c}' stroke-opacity='.22' stroke-width='1'/></svg>`,
  );
}

/** Arabesque geometric star */
function patArabesque(c: string): string {
  return svgBg(
    `<svg xmlns='http://www.w3.org/2000/svg' width='60' height='60'><polygon points='30,5 35,20 50,20 38,30 42,45 30,36 18,45 22,30 10,20 25,20' fill='${c}' fill-opacity='.1' stroke='${c}' stroke-opacity='.22'/></svg>`,
  );
}

/** Ogee / onion dome lattice */
function patOgee(c: string): string {
  return svgBg(
    `<svg xmlns='http://www.w3.org/2000/svg' width='50' height='80'><path d='M25 0c12 15 12 25 0 40c-12-15-12-25 0-40z' fill='none' stroke='${c}' stroke-opacity='.2' stroke-width='1'/><path d='M0 40c12 15 12 25 0 40M50 40c-12 15-12 25 0 40' fill='none' stroke='${c}' stroke-opacity='.16' stroke-width='.8'/></svg>`,
  );
}

/** Waves / seigaiha */
function patWaves(c: string): string {
  return svgBg(
    `<svg xmlns='http://www.w3.org/2000/svg' width='60' height='30'><path d='M0 15c10-10 20-10 30 0s20 10 30 0' fill='none' stroke='${c}' stroke-opacity='.22' stroke-width='1.1'/><path d='M0 25c10-10 20-10 30 0s20 10 30 0' fill='none' stroke='${c}' stroke-opacity='.14' stroke-width='.7'/></svg>`,
  );
}

/** Trefoil / clover */
function patTrefoil(c: string): string {
  return svgBg(
    `<svg xmlns='http://www.w3.org/2000/svg' width='50' height='50'><circle cx='25' cy='18' r='7' fill='none' stroke='${c}' stroke-opacity='.2'/><circle cx='18' cy='30' r='7' fill='none' stroke='${c}' stroke-opacity='.2'/><circle cx='32' cy='30' r='7' fill='none' stroke='${c}' stroke-opacity='.2'/><line x1='25' y1='25' x2='25' y2='42' stroke='${c}' stroke-opacity='.18' stroke-width='1.2'/></svg>`,
  );
}

/** Diamond lattice */
function patDiamondLattice(c: string): string {
  return svgBg(
    `<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40'><path d='M20 0L40 20L20 40L0 20Z' fill='none' stroke='${c}' stroke-opacity='.22' stroke-width='.9'/><circle cx='20' cy='20' r='2.5' fill='${c}' fill-opacity='.14'/></svg>`,
  );
}

/** Filigree corner scrolls */
function patFiligree(c: string): string {
  return svgBg(
    `<svg xmlns='http://www.w3.org/2000/svg' width='60' height='60'><path d='M5 5c15 0 15 15 0 15M55 5c-15 0-15 15 0 15M5 55c15 0 15-15 0-15M55 55c-15 0-15-15 0-15' fill='none' stroke='${c}' stroke-opacity='.22' stroke-width='1'/><circle cx='30' cy='30' r='2' fill='${c}' fill-opacity='.16'/></svg>`,
  );
}

/** Baroque acanthus leaf */
function patAcanthus(c: string): string {
  return svgBg(
    `<svg xmlns='http://www.w3.org/2000/svg' width='70' height='70'><path d='M35 10c-5 10 0 20-10 25c10-2 15 5 10 15c5-10 15-10 20-5c-5-10-10-15 0-20c-10 2-15-5-20-15z' fill='${c}' fill-opacity='.1' stroke='${c}' stroke-opacity='.2'/></svg>`,
  );
}

/** Celtic knot interlace */
function patCelticKnot(c: string): string {
  return svgBg(
    `<svg xmlns='http://www.w3.org/2000/svg' width='50' height='50'><path d='M10 10c10 0 10 10 0 10s-10 10 0 10c10 0 10 10 0 10' fill='none' stroke='${c}' stroke-opacity='.2' stroke-width='1.2'/><path d='M30 10c10 0 10 10 0 10s-10 10 0 10c10 0 10 10 0 10' fill='none' stroke='${c}' stroke-opacity='.2' stroke-width='1.2'/></svg>`,
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
 * Get cover style based on title (background tint) and album (pattern).
 * Each song gets a distinct warm-tinted background; same-album songs share pattern style.
 */
export function getCoverStyle(
  album: string | null | undefined,
  title: string | null | undefined,
): {
  backgroundColor: string;
  backgroundPattern: string;
  accentColor: string;
  textColor: string;
} {
  const titleHash = hashStr(title || "default-title");
  const palette = COVER_PALETTES[titleHash % COVER_PALETTES.length];

  const albumHash = hashStr(album || "default-album");
  const patternFn = PATTERN_FNS[albumHash % PATTERN_FNS.length];
  const pattern = patternFn(palette[1]);

  return {
    backgroundColor: palette[0],
    backgroundPattern: pattern,
    accentColor: palette[1],
    textColor: palette[2],
  };
}
