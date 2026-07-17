import { trpcServer } from "@hono/trpc-server";
import type { Context } from "hono";
import { Hono } from "hono";
import { audioRoute } from "@/server/apis/audio";
import { coverRoute } from "@/server/apis/cover";
import fileRoute from "@/server/apis/fileRoute";
import { createTRPCContext } from "@/server/trpc/context";
import { appRouter } from "@/server/trpc/router";
import type { HonoCtxEnv } from "@/shared/types";

export const app = new Hono<HonoCtxEnv>();

// Audio streaming + Cover images (must be before tRPC and SSR)
app.route("/", audioRoute);
app.route("/", coverRoute);

// tRPC handler
app.use(
  "/api/trpc/*",
  trpcServer({
    router: appRouter,
    createContext: (opts, c: Context<HonoCtxEnv>) => createTRPCContext(opts, c),
  }),
);

// SSR catch-all
app.get("/*", fileRoute);

export default app;
