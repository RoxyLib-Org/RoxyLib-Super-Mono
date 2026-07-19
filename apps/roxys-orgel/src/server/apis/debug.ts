
import { Hono } from "hono";
import type { HonoCtxEnv } from "@/shared/types";

export const debugRoute = new Hono<HonoCtxEnv>().get(
  "/api/debug/r2-list",
  async (c) => {
    const prefix = c.req.query("prefix") || "S1/";
    const all: string[] = [];
    let cursor: string | undefined;
    
    do {
      const result = await c.env.R2.list({ prefix, cursor, limit: 1000 });
      for (const obj of result.objects) {
        // Only include non-audio files (covers, lyrics, etc.)
        const key = obj.key;
        if (!key.match(/\.(flac|mp3|wav|aac|ogg|m4a)$/i)) {
          all.push(key);
        }
      }
      cursor = result.truncated ? result.cursor : undefined;
    } while (cursor);

    return c.json({ count: all.length, files: all });
  },
);
