import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import type { Context } from "hono";
import type { HonoCtxEnv } from "@/shared/types";

export interface TRPCContext {
  env: CloudflareBindings;
  req: Request;
}

export function createTRPCContext(
  opts: FetchCreateContextFnOptions,
  c: Context<HonoCtxEnv>,
): TRPCContext {
  return {
    env: c.env,
    req: opts.req,
  };
}
