import { Hono } from "hono";
import type { HonoCtxEnv } from "@/shared/types";
import { decodeId } from "@/server/utils/r2-scanner";

export const coverRoute = new Hono<HonoCtxEnv>().get(
  "/api/cover/:encodedKey",
  async (c) => {
    const r2Key = decodeId(c.req.param("encodedKey"));

    const headObject = await c.env.R2.head(r2Key);
    if (!headObject) {
      return c.json({ error: "Cover not found" }, 404);
    }

    const headers = new Headers();
    if (headObject.httpMetadata?.contentType) {
      headers.set("Content-Type", headObject.httpMetadata.contentType);
    }
    headers.set("Cache-Control", "public, max-age=86400");
    headers.set("Content-Length", String(headObject.size));

    const object = await c.env.R2.get(r2Key);
    if (!object) {
      return c.json({ error: "Cover not found" }, 404);
    }
    return new Response(object.body, { status: 200, headers });
  },
);
