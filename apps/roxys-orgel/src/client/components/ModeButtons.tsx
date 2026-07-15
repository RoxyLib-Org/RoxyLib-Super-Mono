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
        className="absolute top-0 left-0 w-20 h-20 rounded-full flex items-center justify-center text-white/60 hover:text-white transition-colors cursor-pointer"
        style={{
          opacity: playerMode.to((pm) => pm),
          pointerEvents: playerMode.to((pm) => (pm > 0.5 ? "auto" : "none")),
        }}
      >
        <svg
          width="32"
          height="32"
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
        className="absolute top-0 left-0 flex items-center gap-4"
        style={{
          opacity: to([progress, playerMode], (p, pm) =>
            Math.min(Math.min(p, 1 - pm) * 3, 1),
          ),
          pointerEvents: to([progress, playerMode], (p, pm) =>
            p > 0.1 && pm < 0.5 ? "auto" : "none",
          ),
        }}
      >
        {/* Minimize → level 1 (red, dash icon in 7x7 dot matrix) */}
        <button
          type="button"
          onClick={onMinimize}
          aria-label="Minimize"
          className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-400 flex items-center justify-center cursor-pointer transition-colors"
          style={{
            boxShadow:
              "inset 0 1px 2px rgba(255,255,255,0.4), 0 2px 8px rgba(0,0,0,0.4)",
            border: "1.5px solid rgba(255,255,255,0.3)",
          }}
        >
          {/* 7x7 dot matrix: horizontal dash (row 4, cols 2-6) */}
          <svg width="21" height="21" viewBox="0 0 7 7">
            <circle cx="1.5" cy="3.5" r="0.45" fill="white" />
            <circle cx="2.5" cy="3.5" r="0.45" fill="white" />
            <circle cx="3.5" cy="3.5" r="0.45" fill="white" />
            <circle cx="4.5" cy="3.5" r="0.45" fill="white" />
            <circle cx="5.5" cy="3.5" r="0.45" fill="white" />
          </svg>
        </button>

        {/* Maximize → level 4 (white, square icon in 7x7 dot matrix) */}
        <button
          type="button"
          onClick={onMaximize}
          aria-label="Maximize"
          className="w-20 h-20 rounded-full bg-white/90 hover:bg-white flex items-center justify-center cursor-pointer transition-colors"
          style={{
            boxShadow:
              "inset 0 1px 2px rgba(255,255,255,0.5), 0 2px 8px rgba(0,0,0,0.4)",
            border: "1.5px solid rgba(255,255,255,0.3)",
          }}
        >
          {/* 7x7 dot matrix: square outline (rows 1&7 full, rows 2-6 edges) */}
          <svg width="21" height="21" viewBox="0 0 7 7">
            {/* Top row */}
            <circle cx="1.5" cy="1.5" r="0.45" fill="black" />
            <circle cx="2.5" cy="1.5" r="0.45" fill="black" />
            <circle cx="3.5" cy="1.5" r="0.45" fill="black" />
            <circle cx="4.5" cy="1.5" r="0.45" fill="black" />
            <circle cx="5.5" cy="1.5" r="0.45" fill="black" />
            {/* Left edge */}
            <circle cx="1.5" cy="2.5" r="0.45" fill="black" />
            <circle cx="1.5" cy="3.5" r="0.45" fill="black" />
            <circle cx="1.5" cy="4.5" r="0.45" fill="black" />
            {/* Right edge */}
            <circle cx="5.5" cy="2.5" r="0.45" fill="black" />
            <circle cx="5.5" cy="3.5" r="0.45" fill="black" />
            <circle cx="5.5" cy="4.5" r="0.45" fill="black" />
            {/* Bottom row */}
            <circle cx="1.5" cy="5.5" r="0.45" fill="black" />
            <circle cx="2.5" cy="5.5" r="0.45" fill="black" />
            <circle cx="3.5" cy="5.5" r="0.45" fill="black" />
            <circle cx="4.5" cy="5.5" r="0.45" fill="black" />
            <circle cx="5.5" cy="5.5" r="0.45" fill="black" />
          </svg>
        </button>
      </animated.div>
    </div>
  );
}
