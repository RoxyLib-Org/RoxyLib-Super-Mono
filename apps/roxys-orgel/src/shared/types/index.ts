import type { Hono } from "hono";

export interface HonoCtxEnv {
  Bindings: CloudflareBindings;
  Variables: Record<string, unknown>;
}

// Re-export for convenience
export type AppType = Hono<HonoCtxEnv>;
