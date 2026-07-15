import type { Context } from "hono";
import type { HonoCtxEnv } from "@/shared/types";

export interface TRPCContext {
  env: CloudflareBindings;
  req: Request;
  [key: string]: unknown;
}

export function createTRPCContext(c: Context<HonoCtxEnv>): TRPCContext {
  return {
    env: c.env,
    req: c.req.raw,
  };
}
