import { Hono } from "hono";
import type { HonoCtxEnv } from "@/shared/types";
import { decodeId } from "@/server/utils/r2-scanner";

export const audioRoute = new Hono<HonoCtxEnv>().get(
  "/api/audio/:encodedKey",
  async (c) => {
    const r2Key = decodeId(c.req.param("encodedKey"));

    const headObject = await c.env.R2.head(r2Key);
    if (!headObject) {
      return c.json({ error: "Audio file not found" }, 404);
    }

    const headers = new Headers();
    if (headObject.httpMetadata?.contentType) {
      headers.set("Content-Type", headObject.httpMetadata.contentType);
    }
    headers.set("Accept-Ranges", "bytes");

    const rangeHeader = c.req.header("Range");
    if (rangeHeader) {
      const match = rangeHeader.match(/bytes=(\d+)-(\d*)/);
      if (!match) {
        return c.json({ error: "Invalid Range header" }, 400);
      }

      const start = Number.parseInt(match[1], 10);
      const end = match[2]
        ? Number.parseInt(match[2], 10)
        : headObject.size - 1;

      if (start >= headObject.size || end >= headObject.size || start > end) {
        headers.set("Content-Range", `bytes */${headObject.size}`);
        return c.json({ error: "Range Not Satisfiable" }, 416);
      }

      const length = end - start + 1;
      const object = await c.env.R2.get(r2Key, {
        range: { offset: start, length },
      });

      if (!object) {
        return c.json({ error: "Audio file not found" }, 404);
      }

      headers.set("Content-Range", `bytes ${start}-${end}/${headObject.size}`);
      headers.set("Content-Length", String(length));

      return new Response(object.body, { status: 206, headers });
    }

    headers.set("Content-Length", String(headObject.size));
    const object = await c.env.R2.get(r2Key);
    if (!object) {
      return c.json({ error: "Audio file not found" }, 404);
    }
    return new Response(object.body, { status: 200, headers });
  },
);
