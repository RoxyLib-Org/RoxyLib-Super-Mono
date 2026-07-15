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
    <div className="absolute top-5 left-5 z-50 flex items-center gap-3">
      {/* Player mode: ghost X button */}
      <animated.button
        type="button"
        onClick={onClosePlayer}
        aria-label="Close player"
        className="w-8 h-8 rounded-full flex items-center justify-center text-white/50 hover:text-white/80 transition-colors cursor-pointer backdrop-blur-sm"
        style={{
          opacity: playerMode.to((pm) => pm),
          pointerEvents: playerMode.to((pm) => (pm > 0.5 ? "auto" : "none")),
          transform: playerMode.to((pm) => `scale(${0.5 + pm * 0.5})`),
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        >
          <path d="M4 4l8 8M12 4l-8 8" />
        </svg>
      </animated.button>

      {/* Level 2/3: minimize + maximize buttons */}
      <animated.div
        className="flex items-center gap-2"
        style={{
          // Visible when progress > 0 (not level 1) AND not in player mode
          opacity: to(
            [progress, playerMode],
            (p, pm) => Math.min(Math.min(p, 1 - pm) * 3, 1), // fade in quickly after p>0
          ),
          pointerEvents: to([progress, playerMode], (p, pm) =>
            p > 0.1 && pm < 0.5 ? "auto" : "none",
          ),
          transform: to(
            [progress, playerMode],
            (p, pm) => `scale(${0.5 + Math.min(p * 3, 1) * 0.5 * (1 - pm)})`,
          ),
        }}
      >
        {/* Minimize → level 1 */}
        <button
          type="button"
          onClick={onMinimize}
          aria-label="Minimize"
          className="w-7 h-7 rounded-full bg-white/90 hover:bg-white flex items-center justify-center text-black/70 hover:text-black transition-colors cursor-pointer shadow-sm"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          >
            <path d="M2 6h8" />
          </svg>
        </button>

        {/* Maximize → level 4 (player) */}
        <button
          type="button"
          onClick={onMaximize}
          aria-label="Maximize"
          className="w-7 h-7 rounded-full bg-white/90 hover:bg-white flex items-center justify-center text-black/70 hover:text-black transition-colors cursor-pointer shadow-sm"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          >
            <path d="M2 2h8v8H2z" />
          </svg>
        </button>
      </animated.div>
    </div>
  );
}
