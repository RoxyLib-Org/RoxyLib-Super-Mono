import { animated, type SpringValue, to } from "@react-spring/web";

interface ModeButtonsProps {
  /** 0-1 zoom progress spring */
  progress: SpringValue<number>;
  /** 0-1 player mode spring */
  playerMode: SpringValue<number>;
  /** Go to level 1 (browse) */
  onMinimize: () => void;
  /** Go to level 4 (player controls) */
  onMaximize: () => void;
  /** Exit player mode → level 3 */
  onClosePlayer: () => void;
}

/**
 * Top-left mode buttons:
 * - Player mode (level 4): ghost X to close → level 3
 * - Level 2/3: minimize (→1) + maximize (→4) circular white buttons
 * - Level 1: hidden
 */
export function ModeButtons({
  progress,
  playerMode,
  onMinimize,
  onMaximize,
  onClosePlayer,
}: ModeButtonsProps) {
  return (
    <div className="absolute top-6 left-6 z-50">
      {/* Player mode: ghost X button */}
      <animated.button
        type="button"
        onClick={onClosePlayer}
        aria-label="Close player"
        className="absolute top-0 left-0 w-10 h-10 rounded-full flex items-center justify-center text-white/60 hover:text-white transition-colors cursor-pointer backdrop-blur-sm border border-white/20"
        style={{
          opacity: playerMode.to((pm) => pm),
          pointerEvents: playerMode.to((pm) => (pm > 0.5 ? "auto" : "none")),
          transform: playerMode.to((pm) => `scale(${0.6 + pm * 0.4})`),
        }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        >
          <path d="M4 4l8 8M12 4l-8 8" />
        </svg>
      </animated.button>

      {/* Level 2/3: minimize + maximize buttons (same position, overlaps X) */}
      <animated.div
        className="absolute top-0 left-0 flex items-center gap-3"
        style={{
          opacity: to([progress, playerMode], (p, pm) =>
            Math.min(Math.min(p, 1 - pm) * 3, 1),
          ),
          pointerEvents: to([progress, playerMode], (p, pm) =>
            p > 0.1 && pm < 0.5 ? "auto" : "none",
          ),
          transform: to(
            [progress, playerMode],
            (p, pm) => `scale(${0.6 + Math.min(p * 3, 1) * 0.4 * (1 - pm)})`,
          ),
        }}
      >
        {/* Minimize → level 1 */}
        <button
          type="button"
          onClick={onMinimize}
          aria-label="Minimize"
          className="w-10 h-10 rounded-full bg-white/90 hover:bg-white flex items-center justify-center text-black/70 hover:text-black transition-colors cursor-pointer shadow-md"
        >
          <svg
            width="16"
            height="16"
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
          className="w-10 h-10 rounded-full bg-white/90 hover:bg-white flex items-center justify-center text-black/70 hover:text-black transition-colors cursor-pointer shadow-md"
        >
          <svg
            width="14"
            height="14"
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
    </div>
  );
}
