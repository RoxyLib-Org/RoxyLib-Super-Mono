import { Hono } from "hono";
import { decodeId } from "@/server/utils/r2-scanner";
import type { HonoCtxEnv } from "@/shared/types";

export const coverRoute = new Hono<HonoCtxEnv>().get(
  "/api/cover/:encodedKey",
  async (c) => {
    const decoded = decodeId(c.req.param("encodedKey"));
    // If the decoded key is an external URL, proxy it
    if (decoded.startsWith("http://") || decoded.startsWith("https://")) {
      try {
        const upstream = await fetch(decoded, {
          headers: { "User-Agent": "RoxysOrgel/1.0" },
          redirect: "follow",
        });
        if (!upstream.ok) {
          return c.json(
            { error: "upstream_failed", status: upstream.status, url: decoded },
            502,
          );
        }
        const headers = new Headers();
        const ct = upstream.headers.get("content-type");
        if (ct) headers.set("Content-Type", ct);
        headers.set("Cache-Control", "public, max-age=604800, immutable");
        headers.set("Access-Control-Allow-Origin", "*");
        return new Response(upstream.body, { status: 200, headers });
      } catch (err) {
        return c.json(
          { error: "fetch_exception", message: String(err), url: decoded },
          502,
        );
      }
    }

    // Otherwise treat as R2 key
    const object = await c.env.R2.get(decoded);
    if (!object) {
      return c.json({ error: "Cover not found" }, 404);
    }
    const headers = new Headers();
    if (object.httpMetadata?.contentType) {
      headers.set("Content-Type", object.httpMetadata.contentType);
    }
    headers.set("Cache-Control", "public, max-age=86400");
    headers.set("Access-Control-Allow-Origin", "*");
    return new Response(object.body, { status: 200, headers });
  },
);
