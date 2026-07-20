import type { SpringValue } from "@react-spring/web";
import { animated } from "@react-spring/web";

interface FooterSectionProps {
  /** 0→1 footer reveal progress */
  progress: SpringValue<number>;
}

/**
 * Full-screen footer section shown below the browse grid (scroll down past progress=0).
 * daisyUI footer style with navigation links and social media.
 */
export function FooterSection({ progress }: FooterSectionProps) {
  return (
    <animated.div
      className="absolute inset-0 z-20 flex items-end overflow-hidden"
      style={{
        opacity: progress.to((p) => Math.min(1, p * 2)),
        pointerEvents: progress.to((p) => (p > 0.1 ? "auto" : "none")),
      }}
    >
      {/* Footer content */}
      <animated.div
        className="relative z-10 w-full"
        style={{
          opacity: progress.to((p) => Math.max(0, (p - 0.3) / 0.7)),
          transform: progress.to(
            (p) => `translateY(${(1 - Math.min(1, (p - 0.2) / 0.8)) * 30}px)`,
          ),
        }}
      >
        <footer className="footer sm:footer-horizontal text-white/70 p-10 max-w-6xl mx-auto">
          {/* Brand */}
          <aside>
            <img
              src="/api/static/hero-logo.png"
              alt="洛琪希的八音盒"
              className="w-12 h-12 object-contain"
            />
            <p>
              洛琪希的八音盒
              <br />
              <span className="text-white/40">Roxy's Orgel</span>
            </p>
          </aside>

          {/* 资源站 */}
          <nav>
            <h6 className="footer-title text-white/50">资源</h6>
            <a
              className="link link-hover"
              href="https://pan.roxylib.com/"
              target="_blank"
              rel="noreferrer"
            >
              洛琪希图书馆 - 借书柜台
            </a>
            <a
              className="link link-hover"
              href="https://book.roxylib.com/"
              target="_blank"
              rel="noreferrer"
            >
              洛琪希图书馆 - 在线阅读
            </a>
          </nav>

          {/* 官方 */}
          <nav>
            <h6 className="footer-title text-white/50">官方</h6>
            <a
              className="link link-hover"
              href="https://mushokutensei.jp/"
              target="_blank"
              rel="noreferrer"
            >
              無職転生 公式サイト
            </a>
            <a
              className="link link-hover"
              href="https://www.eggfirm.com/"
              target="_blank"
              rel="noreferrer"
            >
              EGG FIRM
            </a>
          </nav>

          {/* 社交媒体 */}
          <nav>
            <h6 className="footer-title text-white/50">社交</h6>
            <a
              className="link link-hover inline-flex items-center gap-1.5"
              href="https://x.com/mushokutensei_A"
              target="_blank"
              rel="noreferrer"
            >
              <XIcon />
              無職転生 公式
            </a>
            <a
              className="link link-hover inline-flex items-center gap-1.5"
              href="https://x.com/egg_firm"
              target="_blank"
              rel="noreferrer"
            >
              <XIcon />
              EGG FIRM
            </a>
            <a
              className="link link-hover inline-flex items-center gap-1.5"
              href="https://www.youtube.com/@mushokutensei_anime"
              target="_blank"
              rel="noreferrer"
            >
              <YouTubeIcon />
              無職転生
            </a>
          </nav>
        </footer>

        {/* Bottom copyright bar */}
        <div className="border-t border-white/10 px-10 py-4 max-w-6xl mx-auto">
          <p className="text-white/30 text-xs">Powered by Cloudflare</p>
        </div>
      </animated.div>
    </animated.div>
  );
}

function XIcon() {
  return (
    <svg
      className="w-4 h-4 fill-current"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function YouTubeIcon() {
  return (
    <svg
      className="w-4 h-4 fill-current"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}
