import { animated, type SpringValue, to } from "@react-spring/web";

interface ModeButtonsProps {
  /** 0-1 zoom progress spring (single source of truth) */
  progress: SpringValue<number>;
  /** Go to level 1 (browse) */
  onMinimize: () => void;
  /** Go to level 4 (player controls) */
  onMaximize: () => void;
  /** Exit player mode → level 1 */
  onClosePlayer: () => void;
}

/**
 * Top-left mode buttons:
 * - Player mode (progress ≈ 1): ghost X to close → level 1
 * - Level 2/3 (progress 0.17–0.83): minimize (→1) + maximize (→4)
 * - Level 1 (progress ≈ 0): hidden
 */
export function ModeButtons({
  progress,
  onMinimize,
  onMaximize,
  onClosePlayer,
}: ModeButtonsProps) {
  // Derive player mode interpolation: 0.83→1 maps to 0→1
  const playerVis = progress.to((p) =>
    Math.min(1, Math.max(0, (p - 0.83) / 0.17)),
  );

  return (
    <div
      className="absolute top-3 left-3 sm:top-6 sm:left-6 z-50 pointer-events-none"
      onPointerUp={(e) => e.stopPropagation()}
    >
      {/* Level 2/3: minimize + maximize buttons */}
      <animated.div
        className="absolute top-0 left-0 flex items-center gap-2 sm:gap-4"
        style={{
          // Visible when progress > 0 AND NOT in player mode
          opacity: to([progress, playerVis], (p, pm) =>
            Math.min(Math.min(p, 1 - pm) * 3, 1),
          ),
          pointerEvents: progress.to((p) =>
            p > 0.1 && p < 0.9 ? "auto" : "none",
          ),
        }}
      >
        {/* Minimize → level 1 */}
        <button
          type="button"
          onClick={onMinimize}
          aria-label="Minimize"
          data-cursor-snap="minimize"
          className="w-10 h-10 sm:w-20 sm:h-20 rounded-full bg-white/90 hover:bg-white flex items-center justify-center text-black/70 hover:text-black transition-colors cursor-none shadow-md"
        >
          <svg
            width="16"
            height="16"
            className="sm:w-7 sm:h-7"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M3 8h10" />
          </svg>
        </button>

        {/* Maximize → level 4 (player) */}
        <button
          type="button"
          onClick={onMaximize}
          aria-label="Maximize"
          data-cursor-snap="maximize"
          className="w-10 h-10 sm:w-20 sm:h-20 rounded-full bg-white/90 hover:bg-white flex items-center justify-center text-black/70 hover:text-black transition-colors cursor-none shadow-md"
        >
          <svg
            width="14"
            height="14"
            className="sm:w-6 sm:h-6"
            viewBox="0 0 14 14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M2 2h10v10H2z" />
          </svg>
        </button>
      </animated.div>

      {/* Player mode: ghost X button — AFTER minimize so it stacks on top */}
      <animated.button
        type="button"
        onClick={onClosePlayer}
        aria-label="Close player"
        data-cursor-snap="close"
        className="absolute top-0 left-0 w-10 h-10 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-white/60 hover:text-white transition-colors cursor-none"
        style={{
          opacity: playerVis,
          pointerEvents: progress.to((p) => (p > 0.9 ? "auto" : "none")),
        }}
      >
        <svg
          width="20"
          height="20"
          className="sm:w-8 sm:h-8"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        >
          <path d="M4 4l8 8M12 4l-8 8" />
        </svg>
      </animated.button>
    </div>
  );
}
