import { Hono } from "hono";
import type { HonoCtxEnv } from "@/shared/types";
import { renderCardResponse } from "./shared";
import { songCoverRoute } from "./songCover";

/**
 * Demo OG card endpoint:
 * GET /api/og/demo?title=...&artist=...
 *
 * Renders a simple album cover card with title and artist text,
 * screenshotted via Browser Run and cached in R2.
 */
const ogCards = new Hono<HonoCtxEnv>().get("/api/og/demo", async (c) => {
  const title = c.req.query("title") || "Unknown Album";
  const artist = c.req.query("artist") || "Unknown Artist";
  const r2Key = `og/demo-${encodeURIComponent(title)}-${encodeURIComponent(artist)}.png`;
  return renderCardResponse(c, r2Key, () => buildDemoHtml(title, artist));
});

ogCards.route("/", songCoverRoute);

export const ogCardRoute = ogCards;

function buildDemoHtml(title: string, artist: string): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  width: 1200px;
  height: 630px;
  font-family: -apple-system, "Noto Sans SC", "Helvetica Neue", sans-serif;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  text-align: center;
  padding: 60px;
}
.vinyl {
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: radial-gradient(circle at 50% 50%,
    #111 0%, #111 20%,
    #333 21%, #222 40%,
    #111 41%, #111 42%,
    #333 43%, #222 60%,
    #111 61%, #111 100%
  );
  box-shadow: 0 0 40px rgba(0, 0, 0, 0.5);
  position: relative;
}
.vinyl::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: #e94560;
}
.title {
  font-size: 48px;
  font-weight: 800;
  letter-spacing: -1px;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
}
.artist {
  font-size: 28px;
  font-weight: 400;
  color: #e94560;
  opacity: 0.9;
}
.brand {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.4);
  letter-spacing: 2px;
  text-transform: uppercase;
  margin-top: 20px;
}
</style></head><body>
<div class="card">
  <div class="vinyl"></div>
  <div class="title">${escapeHtml(title)}</div>
  <div class="artist">${escapeHtml(artist)}</div>
  <div class="brand">Roxy's Orgel</div>
</div>
<script>window.__ready = true;</script>
</body></html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
