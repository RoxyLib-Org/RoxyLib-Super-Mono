import puppeteer from "@cloudflare/puppeteer";
import type { Context } from "hono";
import type { HonoCtxEnv } from "@/shared/types";

const CACHE_TTL_MS = 2 * 60 * 60 * 1000;

/** Fetch a URL and return it as a base64 data URL */
export async function fetchAsDataUrl(url: string): Promise<string> {
  if (!url) return "";
  try {
    const resp = await fetch(url);
    if (!resp.ok) return "";
    const contentType = resp.headers.get("content-type") || "image/jpeg";
    const buf = await resp.arrayBuffer();
    const base64 = btoa(
      Array.from(new Uint8Array(buf))
        .map((b) => String.fromCharCode(b))
        .join(""),
    );
    return `data:${contentType};base64,${base64}`;
  } catch {
    return "";
  }
}

/**
 * Render an HTML page to a PNG screenshot via Browser Run,
 * cache the result in R2, and return it as a Response.
 */
export interface RenderOptions {
  width?: number;
  height?: number;
}

export async function renderCardResponse(
  c: Context<HonoCtxEnv>,
  r2Key: string,
  buildHtml: () => Promise<string> | string,
  opts?: RenderOptions,
): Promise<Response> {
  // Check R2 cache first
  const cached = await c.env.R2.head(r2Key);
  if (cached?.uploaded) {
    const age = Date.now() - cached.uploaded.getTime();
    if (age < CACHE_TTL_MS) {
      const obj = await c.env.R2.get(r2Key);
      if (obj) {
        return new Response(obj.body, {
          headers: {
            "content-type": "image/png",
            "cache-control": "public, max-age=3600",
          },
        });
      }
    }
  }

  const html = await buildHtml();

  const browser = await puppeteer.launch(c.env.BROWSER);
  try {
    const page = await browser.newPage();
    await page.setViewport({
      width: opts?.width ?? 1200,
      height: opts?.height ?? 630,
    });
    await page.setContent(html, { waitUntil: "networkidle0" });

    // Wait for the page to signal readiness
    await page.waitForFunction(
      () => {
        if ("__ready" in window) {
          return (window as Record<string, unknown>).__ready === true;
        }
        return false;
      },
      { timeout: 10000 },
    );

    const buffer = (await page.screenshot({ type: "png" })) as Buffer;
    const bytes = new Uint8Array(buffer);

    // Cache to R2
    await c.env.R2.put(r2Key, bytes, {
      httpMetadata: { contentType: "image/png" },
    });

    return new Response(bytes, {
      headers: {
        "content-type": "image/png",
        "cache-control": "public, max-age=3600",
      },
    });
  } finally {
    await browser.close();
  }
}
