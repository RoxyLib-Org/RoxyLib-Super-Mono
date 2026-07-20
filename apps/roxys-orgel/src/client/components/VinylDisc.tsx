import {
  animated,
  type SpringValue,
  to,
  useSpring,
  useSpringValue,
} from "@react-spring/web";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getCoverStyle } from "./coverStyles";

const { sqrt, min, max, pow } = Math;

/** Diameter of each disc in px (base size) */
export const DISC_SIZE = 300;

/** Gap between discs (center-to-center = DISC_SIZE + GAP) */
export const DISC_GAP = 60;

/** Hex grid spacing radius (half the center-to-center distance) */
export const HEX_RADIUS = (DISC_SIZE + DISC_GAP) / 2;

/** Placeholder cover art images */
const PLACEHOLDER_COVERS = [
  "https://picsum.photos/seed/vinyl0/400/400",
  "https://picsum.photos/seed/vinyl1/400/400",
  "https://picsum.photos/seed/vinyl2/400/400",
  "https://picsum.photos/seed/vinyl3/400/400",
  "https://picsum.photos/seed/vinyl4/400/400",
  "https://picsum.photos/seed/vinyl5/400/400",
  "https://picsum.photos/seed/vinyl6/400/400",
  "https://picsum.photos/seed/vinyl7/400/400",
  "https://picsum.photos/seed/vinyl8/400/400",
  "https://picsum.photos/seed/vinyl9/400/400",
  "https://picsum.photos/seed/vinyl10/400/400",
  "https://picsum.photos/seed/vinyl11/400/400",
  "https://picsum.photos/seed/vinyl12/400/400",
  "https://picsum.photos/seed/vinyl13/400/400",
  "https://picsum.photos/seed/vinyl14/400/400",
  "https://picsum.photos/seed/vinyl15/400/400",
  "https://picsum.photos/seed/vinyl16/400/400",
  "https://picsum.photos/seed/vinyl17/400/400",
  "https://picsum.photos/seed/vinyl18/400/400",
  "https://picsum.photos/seed/vinyl19/400/400",
];

/**
 * Manual vertical column-break map for song titles.
 * Each entry: title → columns rendered right-to-left in vertical-rl.
 * Breaks at semantically natural boundaries.
 */
const TITLE_BREAKS: Record<string, string[]> = {
  魔術の授業: ["魔術の", "授業"],
  魔法が存在する世界で: ["魔法が", "存在する", "世界で"],
  詠唱: ["詠唱"],
  ルディの失態: ["ルディの", "失態"],
  小さい家庭教師ロキシー: ["小さい", "家庭教師", "ロキシー"],
  ロキシーの訓練: ["ロキシーの", "訓練"],
  無職転生: ["無職", "転生"],
  "5歳のお祝い": ["5歳の", "お祝い"],
  ルディのナイスガイスキル: ["ルディの", "ナイスガイ", "スキル"],
  まだ見ぬ世界: ["まだ見ぬ", "世界"],
  ロキシーからの贈り物: ["ロキシー", "からの", "贈り物"],
  外には絶望: ["外には", "絶望"],
  ロキシー最後の授業: ["ロキシー", "最後の授業"],
  師匠のお守り: ["師匠の", "お守り"],
  グレイラット家の日々: ["グレイラット", "家の日々"],
  友達: ["友達"],
  思わぬ現実: ["思わぬ", "現実"],
  シルフに教える魔術: ["シルフに", "教える魔術"],
  シルフィの涙: ["シルフィの", "涙"],
  ロキシーからの手紙: ["ロキシー", "からの手紙"],
  "オンリー(アコースティックVer.)": ["オンリー", "(アコースティック", "Ver.)"],
  ギレーヌ登場: ["ギレーヌ", "登場"],
  "パウロ VS ルディ": ["パウロ", "VS", "ルディ"],
  ボレアス家: ["ボレアス", "家"],
  エリス怒る: ["エリス", "怒る"],
  金でデレは買えない: ["金でデレは", "買えない"],
  サウロス登場: ["サウロス", "登場"],
  ギレーヌの誘導: ["ギレーヌの", "誘導"],
  剣術指導: ["剣術", "指導"],
  ボレアス邸の一日: ["ボレアス邸の", "一日"],
  "10歳の宴": ["10歳の", "宴"],
  魔法を使わないダンス: ["魔法を", "使わない", "ダンス"],
  "5年後の約束!": ["5年後の", "約束!"],
  ヒトガミの助言: ["ヒトガミの", "助言"],
  ルイジェルド: ["ルイ", "ジェルド"],
  ノコパラの陰謀: ["ノコパラの", "陰謀"],
  "旅人の唄(アコースティックVer.)": ["旅人の唄", "(アコースティック", "Ver.)"],
  ギレーヌと二人きり: ["ギレーヌと", "二人きり"],
  エリスの笑顔: ["エリスの", "笑顔"],
  お願いにゃん: ["お願い", "にゃん"],
  大切な仲間: ["大切な", "仲間"],
  冒険: ["冒険"],
  思考: ["思考"],
  駆け引き: ["駆け引き"],
  いたずら: ["いたずら"],
  まずい状況: ["まずい", "状況"],
  魔力が集まる場所: ["魔力が", "集まる場所"],
  ルイジェルドの怒り: ["ルイジェルド", "の怒り"],
  掌の上: ["掌の上"],
  トーナとエリスの別れ: ["トーナと", "エリスの", "別れ"],
  ミリス神聖国: ["ミリス", "神聖国"],
  初めての海: ["初めての", "海"],
  "魔界大帝キシリカ・キシリス!?": ["魔界大帝", "キシリカ", "キシリス!?"],
  ギレーヌのこと: ["ギレーヌの", "こと"],
  信頼を得る為に: ["信頼を", "得る為に"],
  ウェンポート: ["ウェン", "ポート"],
  密輸組織: ["密輸", "組織"],
  作戦会議: ["作戦", "会議"],
  笑顔の力: ["笑顔の", "力"],
  快適な牢屋: ["快適な", "牢屋"],
  先輩と新入: ["先輩と", "新入"],
  ドルディア族: ["ドルディア", "族"],
  共闘: ["共闘"],
  再会: ["再会"],
  冒険者: ["冒険者"],
  慰め: ["慰め"],
  待ってる: ["待ってる"],
  神聖な世界: ["神聖な", "世界"],
  シーローン王宮: ["シーローン", "王宮"],
  秘密の作戦: ["秘密の", "作戦"],
  "まさか!?": ["まさか!?"],
  "旅人の唄 -EP17 Inst Ver.-": ["旅人の唄", "EP17", "Inst Ver."],
  ロキシーへの想い: ["ロキシーへの", "想い"],
  ザノバの力: ["ザノバの", "力"],
  圧倒的力との遭遇: ["圧倒的力", "との遭遇"],
  旅人の唄: ["旅人の", "唄"],
  目覚めの唄: ["目覚めの", "唄"],
  継承の唄: ["継承の", "唄"],
  祈りの唄: ["祈りの", "唄"],
  遠くの子守の唄: ["遠くの", "子守の唄"],
  "旅人の唄～帰郷～": ["旅人の唄", "～帰郷～"],
  オンリー: ["オンリー"],
  風と行く道: ["風と", "行く道"],
};

/**
 * Wrap runs of 1-4 ASCII digits/Latin in tate-chū-yoko spans.
 * This makes "5歳" render the "5" horizontally within the vertical flow,
 * matching proper Japanese typesetting conventions (縦中横).
 */
const TATECHU_RE = /([A-Za-z0-9]{1,4})/g;
const TATECHU_TEST = /^[A-Za-z0-9]{1,4}$/;

function TateChuYoko({ text }: { text: string }) {
  const parts = text.split(TATECHU_RE);
  return (
    <>
      {parts.map((part, i) =>
        TATECHU_TEST.test(part) ? (
          <span
            key={i}
            style={{ textCombineUpright: "all" } as React.CSSProperties}
          >
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

/**
 * Vertical title typesetter — pure CSS writing-mode: vertical-rl.
 *
 * - Manual column breaks via TITLE_BREAKS map (semantic boundaries)
 * - text-orientation: mixed — CJK upright, Latin/digits sideways
 * - tate-chū-yoko (text-combine-upright) for short digit/Latin runs (≤4 chars)
 * - Auto font-size scaling when columns are long
 */
function TitleTypography({ title, color }: { title: string; color: string }) {
  const raw = TITLE_BREAKS[title] ?? [title];
  // Cap to max 2 columns: keep first, merge the rest into second
  const columns = raw.length <= 2 ? raw : [raw[0], raw.slice(1).join("")];

  // Scale font down for long columns (max ~120px panel height, ~16px per CJK char)
  const maxColLen = max(...columns.map((c) => c.length));
  const baseFontSize = 14;
  const maxChars = 8; // 8 chars * 14px ≈ 112px fits panel
  const fontSize =
    maxColLen > maxChars ? baseFontSize * (maxChars / maxColLen) : baseFontSize;

  return (
    <div
      className="pointer-events-none select-none"
      style={{
        writingMode: "vertical-rl",
        textOrientation: "mixed",
        fontFamily: '"Georgia", "Noto Serif JP", "Noto Serif SC", serif',
        fontWeight: 700,
        fontSize: `${fontSize}px`,
        color,
        padding: "20px 16px",
        overflow: "hidden",
        letterSpacing: "0.05em",
        lineHeight: 1.5,
      }}
    >
      {columns.map((col, i) => (
        <span key={i} style={{ display: "block", whiteSpace: "nowrap" }}>
          <TateChuYoko text={col} />
        </span>
      ))}
    </div>
  );
}

/**
 * Artistic vertical title for the typographic cover (mode 2).
 * More line breaks, centered alignment, emphasis enlargement, mixed fonts.
 */
function TypographicCoverTitle({ title }: { title: string }) {
  const columns = TITLE_BREAKS[title] ?? [title];

  // Pick emphasis indices: first and last segments get enlarged
  const emphasisIdx = new Set<number>();
  if (columns.length >= 2) {
    emphasisIdx.add(0);
    emphasisIdx.add(columns.length - 1);
  } else {
    emphasisIdx.add(0);
  }

  // Scale base size to fit — allow more columns
  const maxColLen = max(...columns.map((c) => c.length));
  const baseFontSize = 13;
  const maxChars = 6;
  const fontSize =
    maxColLen > maxChars ? baseFontSize * (maxChars / maxColLen) : baseFontSize;
  const emphasisSize = fontSize * 1.5;

  return (
    <div
      className="pointer-events-none select-none"
      style={{
        writingMode: "vertical-rl",
        textOrientation: "mixed",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "2px",
        maxHeight: "75%",
        overflow: "hidden",
      }}
    >
      {columns.map((col, i) => {
        const isEmphasis = emphasisIdx.has(i);
        return (
          <span
            key={i}
            style={{
              display: "block",
              whiteSpace: "nowrap",
              fontSize: isEmphasis ? `${emphasisSize}px` : `${fontSize}px`,
              fontFamily: isEmphasis
                ? '"Georgia", "Noto Serif JP", "Noto Serif SC", serif'
                : '"Hiragino Sans", "Noto Sans JP", "Noto Sans SC", sans-serif',
              fontWeight: isEmphasis ? 900 : 700,
              color: "#111",
              letterSpacing: isEmphasis ? "0.12em" : "0.04em",
              lineHeight: 1.4,
            }}
          >
            <TateChuYoko text={col} />
          </span>
        );
      })}
    </div>
  );
}

export function getCoverUrl(index: number): string {
  return PLACEHOLDER_COVERS[index % PLACEHOLDER_COVERS.length];
}

/** Three vinyl color palettes: red, yellow, black-grey */
const VINYL_PALETTES: [string, string][] = [
  ["oklch(0.55 0.25 25)", "oklch(0.45 0.22 25)"], // red
  ["oklch(0.85 0.2 90)", "oklch(0.75 0.17 90)"], // yellow (brighter)
  ["oklch(0.22 0.01 260)", "oklch(0.15 0.005 260)"], // black (deeper)
];

export function getVinylColor(index: number): string {
  return VINYL_PALETTES[index % 3][0];
}

/** Pick vinyl color based on index, evenly distributed */
function getVinylColors(index: number): [string, string] {
  return VINYL_PALETTES[index % 3];
}

interface VinylDiscProps {
  coord: [number, number];
  offset: [SpringValue<number>, SpringValue<number>];
  progress: SpringValue<number>;
  /** Global elapsed playback time in seconds */
  elapsed: SpringValue<number>;
  index: number;
  isCenterDisc: boolean;
  /** This disc is the globally selected disc */
  isActiveDisc: boolean;
  /** Global playback state */
  isPlaying: boolean;
  onHover: (index: number) => void;
  /** Real cover art URL; falls back to placeholder when null */
  coverUrl?: string | null;
  /** Song title for decorative overlay */
  title?: string | null;
  /** Artist name */
  artist?: string | null;
  /** Album title */
  album?: string | null;
}

/** One full disc rotation every 8 seconds of playback */
const DISC_ROTATION_PERIOD = 8;

export function VinylDisc({
  coord,
  offset,
  progress,
  elapsed,
  index,
  isCenterDisc,
  isActiveDisc,
  isPlaying,
  onHover,
  coverUrl: coverUrlProp,
  title,
  artist,
  album,
}: VinylDiscProps) {
  // ── Rotation derived from elapsed time ────────────────────────────────────
  // Active disc: rotation = (elapsed / period) * 360, continuously synced.
  // Inactive disc: smoothly animate back to 0.
  const rotationSpring = useSpringValue(0, {
    config: { mass: 0.8, tension: 120, friction: 20 },
  });

  // Track last known visual angle so we can spin-down from it when deactivated.
  // elapsed might already be reset to 0 by the time React re-renders.
  const lastAngleRef = useRef(0);

  useEffect(() => {
    if (isActiveDisc) {
      // While active, continuously track the visual angle via RAF
      let raf = 0;
      const sync = () => {
        lastAngleRef.current =
          ((elapsed.get() / DISC_ROTATION_PERIOD) * 360) % 360;
        raf = requestAnimationFrame(sync);
      };
      raf = requestAnimationFrame(sync);
      return () => cancelAnimationFrame(raf);
    }
    // Deactivated — spin down from last known angle to 0
    rotationSpring.set(lastAngleRef.current);
    rotationSpring.start(0);
  }, [isActiveDisc, rotationSpring, elapsed]);

  // Active disc reads elapsed directly; inactive uses spring-to-zero
  const rotation = isActiveDisc
    ? elapsed.to((t) => (t / DISC_ROTATION_PERIOD) * 360)
    : rotationSpring;

  // Derive player mode visibility: progress 0.83→1 maps to 0→1
  const playerMode = useMemo(
    () => progress.to((p) => Math.min(1, Math.max(0, (p - 0.83) / 0.17))),
    [progress],
  );

  // Position: progress controls spacing and radial compression
  // Spacing: p=0 → tight (0.7x), p=1 → wide (1.5x)
  // Compression: p=0 → none, p=1 → outer discs pulled toward center
  const [x, y] = useMemo(() => {
    const rawX = offset[0].to((v) => v + coord[0]);
    const rawY = offset[1].to((v) => v + coord[1]);
    const SPACING_MIN = 0.3;
    const SPACING_MAX = 2.0;
    // Compression: 1/(1 + k*sqrt(dist)) — sublinear, strong in mid-range, gentle at extremes
    const COMPRESS_K = 0.015;
    return [
      to([rawX, rawY, progress], (xv, yv, p) => {
        const spacing = SPACING_MIN + (SPACING_MAX - SPACING_MIN) * p;
        const sx = xv * spacing;
        const sy = yv * spacing;
        const dist = sqrt(sx * sx + sy * sy);
        const scale = 1 / (1 + COMPRESS_K * p * sqrt(dist));
        return sx * scale;
      }),
      to([rawX, rawY, progress], (xv, yv, p) => {
        const spacing = SPACING_MIN + (SPACING_MAX - SPACING_MIN) * p;
        const sx = xv * spacing;
        const sy = yv * spacing;
        const dist = sqrt(sx * sx + sy * sy);
        const scale = 1 / (1 + COMPRESS_K * p * sqrt(dist));
        return sy * scale;
      }),
    ];
  }, [offset, coord, progress]);

  const distanceFromCenter = useMemo(
    () => to([x, y], (xv, yv) => sqrt(pow(xv, 2) + pow(yv, 2))),
    [x, y],
  );

  // Cover layers are driven by `progress` spring directly via .to() interpolation.
  // Zoomed out (p≈0): typographic overlay visible. Zoomed in (p≈1): full cover.

  const coverUrl = coverUrlProp ?? getCoverUrl(index);
  const [vinylBase, vinylDark] = getVinylColors(index);
  const coverStyle = useMemo(() => getCoverStyle(album, title), [album, title]);
  const maxVisibleDist = 800;

  // Mouse-follow 3D tilt via spring (only active when near center)
  const [tiltSpring, tiltApi] = useSpring(() => ({
    rx: 0,
    ry: 0,
    config: { mass: 1, tension: 280, friction: 20 },
  }));
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const nx = (e.clientX - cx) / (rect.width / 2);
      const ny = (e.clientY - cy) / (rect.height / 2);
      tiltApi.start({ rx: -ny * 2, ry: nx * 2 });
    },
    [tiltApi],
  );

  const handleMouseLeave = useCallback(() => {
    tiltApi.start({ rx: 0, ry: 0 });
  }, [tiltApi]);

  return (
    <animated.div
      data-vinyl-disc
      data-disc-index={index}
      className="absolute cursor-none select-none"
      onMouseEnter={() => onHover(index)}
      onMouseLeave={() => onHover(-1)}
      style={{
        // In player mode: center disc moves up, others stay
        left: to([x, playerMode], (xv, pm) => {
          if (isCenterDisc && pm > 0) {
            const interp = xv * (1 - pm);
            return `calc(50% + ${interp}px)`;
          }
          return `calc(50% + ${xv}px)`;
        }),
        top: to([y, playerMode], (yv, pm) => {
          if (isCenterDisc && pm > 0) {
            const targetOffset = -window.innerHeight * 0.15;
            const interp = yv * (1 - pm) + targetOffset * pm;
            return `calc(50% + ${interp}px)`;
          }
          return `calc(50% + ${yv}px)`;
        }),
        transform: "translate(-50%, -50%)",
        pointerEvents: distanceFromCenter.to((d) =>
          d > maxVisibleDist ? "none" : "auto",
        ),
        // In player mode, non-center discs fade out
        opacity: playerMode.to((pm) => {
          if (isCenterDisc) return 1;
          return max(0, 1 - pm * 3);
        }),
      }}
    >
      {/* Outer clip container */}
      <animated.div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="rounded-full overflow-hidden flex items-center justify-center relative"
        style={{
          // Size: continuous function of distance and progress
          // p=0: all uniform (0.55x compact), p=1: center=1x, far=0
          // Smooth transition based on distance, no discrete jumps
          width: to([distanceFromCenter, progress, playerMode], (d, p) => {
            const t = min(d / maxVisibleDist, 1);
            // Steep gaussian: center = 1.4, drops off quickly
            const gaussian = 0.35 + 1.45 * Math.exp(-3 * t * t);
            const uniform = 0.28;
            const size = uniform + (gaussian - uniform) * p;
            return `${max(size, 0) * DISC_SIZE}px`;
          }),
          height: to([distanceFromCenter, progress, playerMode], (d, p) => {
            const t = min(d / maxVisibleDist, 1);
            const gaussian = 0.35 + 1.45 * Math.exp(-3 * t * t);
            const uniform = 0.28;
            const size = uniform + (gaussian - uniform) * p;
            return `${max(size, 0) * DISC_SIZE}px`;
          }),
          background: vinylBase,
          border: "none",
          boxShadow: progress.to((p) => {
            const o = min(p * 2, 1);
            return `0 8px 32px rgba(0,0,0,${0.5 * o}), inset 0 3px 5px rgba(255,255,255,${0.3 * o}), inset 0 -3px 6px rgba(0,0,0,${0.5 * o})`;
          }),
          transform: to(
            [tiltSpring.rx, tiltSpring.ry],
            (rx, ry) =>
              `perspective(400px) rotateX(${rx}deg) rotateY(${ry}deg)`,
          ),
        }}
      >
        {/* Inner disc content at fixed size — clipped by parent */}
        <animated.div
          className="relative rounded-full shrink-0"
          style={{
            width: DISC_SIZE,
            height: DISC_SIZE,
            transform: progress.to((p) => {
              const contentScale =
                p < 0.33 ? 0.28 + (1 - 0.28) * (p / 0.33) : 1;
              return `scale(${contentScale})`;
            }),
          }}
        >
          {/* Rotation wrapper — synced to elapsed time */}
          <animated.div
            className="w-full h-full rounded-full"
            style={{
              transform: rotation.to((rot) => `rotate(${rot}deg)`),
            }}
          >
            {/* Vinyl grooves — visible only when progress > 0.3 */}
            <animated.div
              className="absolute inset-0 rounded-full"
              style={{
                background: `repeating-radial-gradient(
                circle at center,
                ${vinylBase} 0px,
                ${vinylDark} 1.5px,
                ${vinylBase} 3px
              )`,
                opacity: progress.to((p) => max(0, (p - 0.3) / 0.7) * 0.85),
              }}
            />

            {/* Subtle groove sheen overlay */}
            <animated.div
              className="absolute inset-0 rounded-full"
              style={{
                background: `repeating-radial-gradient(
                circle at center,
                transparent 0px,
                rgba(255,255,255,0.04) 2px,
                transparent 4px
              )`,
                opacity: progress.to((p) => max(0, (p - 0.3) / 0.7)),
              }}
            />

            {/* Cover art - 3 stacked layers; progress drives clip-path animation */}
            <animated.div
              className="absolute rounded-full overflow-hidden"
              style={{
                inset: progress.to((p) =>
                  p < 0.33 ? `${(p / 0.33) * 4}%` : "4%",
                ),
                boxShadow:
                  "inset 0 0 4px 2px rgba(0,0,0,0.7), 0 0 6px 1px rgba(0,0,0,0.4)",
              }}
            >
              {/* Layer 0 (bottom): Full cover image - always visible */}
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `url(${coverUrl})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />

              {/* Layer 1 (middle): Half cover panel — snapped: visible at 0/0.33/0.66, gone at 1 */}
              <animated.div
                className="absolute inset-0"
                style={{
                  maskImage: progress.to((p) => {
                    // Transition between snap 0.66 and 1
                    const r =
                      p <= 0.66
                        ? 71
                        : p >= 1
                          ? 0
                          : 71 * (1 - (p - 0.66) / 0.34);
                    if (r <= 0)
                      return "radial-gradient(circle at center, transparent 0%, transparent 100%)";
                    const inner = r;
                    return `radial-gradient(circle at center, black 0%, black ${inner}%, transparent ${r}%)`;
                  }),
                  WebkitMaskImage: progress.to((p) => {
                    const r =
                      p <= 0.66
                        ? 71
                        : p >= 1
                          ? 0
                          : 71 * (1 - (p - 0.66) / 0.34);
                    if (r <= 0)
                      return "radial-gradient(circle at center, transparent 0%, transparent 100%)";
                    const inner = r;
                    return `radial-gradient(circle at center, black 0%, black ${inner}%, transparent ${r}%)`;
                  }),
                }}
              >
                {/* Right half: cover image */}
                <div
                  className="absolute top-0 right-0 w-1/2 h-full"
                  style={{
                    backgroundImage: `url(${coverUrl})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />
                {/* Left half: warm panel with heropattern + title vertically centered */}
                <div
                  className="absolute top-0 left-0 w-1/2 h-full grid place-items-center pointer-events-none"
                  style={{
                    backgroundColor: coverStyle.backgroundColor,
                    backgroundImage: coverStyle.backgroundPattern,
                  }}
                >
                  <div
                    className="absolute top-0 right-0 bottom-0"
                    style={{
                      width: "2px",
                      backgroundColor: coverStyle.accentColor,
                    }}
                  />
                  {title && (
                    <TitleTypography
                      title={title}
                      color={coverStyle.textColor}
                    />
                  )}
                </div>
              </animated.div>

              {/* Layer 2 (top): Typographic overlay — snapped: visible at 0, gone at 0.33+ */}
              <animated.div
                className="absolute inset-0"
                style={{
                  maskImage: progress.to((p) => {
                    // Transition between snap 0 and 0.33
                    const r = p <= 0 ? 71 : p >= 0.33 ? 0 : 71 * (1 - p / 0.33);
                    if (r <= 0)
                      return "radial-gradient(circle at center, transparent 0%, transparent 100%)";
                    const inner = r;
                    return `radial-gradient(circle at center, black 0%, black ${inner}%, transparent ${r}%)`;
                  }),
                  WebkitMaskImage: progress.to((p) => {
                    const r = p <= 0 ? 71 : p >= 0.33 ? 0 : 71 * (1 - p / 0.33);
                    if (r <= 0)
                      return "radial-gradient(circle at center, transparent 0%, transparent 100%)";
                    const inner = r;
                    return `radial-gradient(circle at center, black 0%, black ${inner}%, transparent ${r}%)`;
                  }),
                }}
              >
                {/* Album cover behind */}
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `url(${coverUrl})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />
                {/* Warm tinted overlay with heropattern topography */}
                <div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${coverStyle.backgroundColor} 92%, transparent)`,
                    backgroundImage: coverStyle.backgroundPattern,
                  }}
                >
                  {(artist || album) && (
                    <svg
                      className="absolute inset-0 w-full h-full pointer-events-none"
                      viewBox="0 0 200 200"
                    >
                      <defs>
                        <path
                          id={`ring-${index}`}
                          d="M 100,100 m -68,0 a 68,68 0 1,1 136,0 a 68,68 0 1,1 -136,0"
                          fill="none"
                        />
                      </defs>
                      <text
                        fontSize="8"
                        fontFamily="'Hiragino Sans', 'Noto Sans JP', sans-serif"
                        fontWeight="700"
                        fill="#222"
                        letterSpacing="3"
                      >
                        <textPath href={`#ring-${index}`} startOffset="0%">
                          {[artist, album].filter(Boolean).join(" · ")}
                          {"   ·   "}
                          {[artist, album].filter(Boolean).join(" · ")}
                        </textPath>
                      </text>
                    </svg>
                  )}
                  {title && <TypographicCoverTitle title={title} />}
                </div>
              </animated.div>
            </animated.div>
          </animated.div>

          {/* Top highlight arc */}
          <animated.div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 60% 40% at 35% 25%, rgba(255,255,255,0.18) 0%, transparent 70%)",
              opacity: progress.to((p) => min(p * 2, 1)),
            }}
          />
        </animated.div>
      </animated.div>
    </animated.div>
  );
}

/**
 * SVG filter replicating the CodePen liquid glass:
 * - Very slight blur on source (stdDeviation 0.003 in objectBoundingBox units)
 * - feTurbulence as displacement map (replacing the codepen's feImage PNG)
 * - feDisplacementMap for refraction
 */
export function LiquidGlassFilter() {
  return (
    <svg
      style={{ position: "absolute", width: 0, height: 0 }}
      aria-hidden="true"
    >
      <defs>
        <filter id="liquid-glass" primitiveUnits="objectBoundingBox">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.02"
            numOctaves="2"
            seed="5"
            result="map"
          />
          <feGaussianBlur
            in="SourceGraphic"
            stdDeviation="0.003"
            result="src"
          />
          <feDisplacementMap
            in="src"
            in2="map"
            scale="20"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
    </svg>
  );
}
