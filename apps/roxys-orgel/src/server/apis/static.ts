import { Hono } from "hono";
import type { HonoCtxEnv } from "@/shared/types";

/**
 * Serves static assets from R2's `static/` prefix.
 * Route: /api/static/:path — path is the filename under `static/`.
 */
export const staticRoute = new Hono<HonoCtxEnv>().get(
  "/api/static/:path{.+}",
  async (c) => {
    const path = c.req.param("path");
    const r2Key = `static/${path}`;

    const object = await c.env.R2.get(r2Key);
    if (!object) {
      return c.json({ error: "Not found" }, 404);
    }

    const headers = new Headers();
    if (object.httpMetadata?.contentType) {
      headers.set("Content-Type", object.httpMetadata.contentType);
    }
    headers.set("Cache-Control", "public, max-age=604800, immutable");
    headers.set("Access-Control-Allow-Origin", "*");
    return new Response(object.body, { status: 200, headers });
  },
);
