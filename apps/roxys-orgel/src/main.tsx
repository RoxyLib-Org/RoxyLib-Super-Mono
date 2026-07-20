import { trpcServer } from "@hono/trpc-server";
import type { Context } from "hono";
import { Hono } from "hono";
import { audioRoute } from "@/server/apis/audio";
import { coverRoute } from "@/server/apis/cover";
import { debugRoute } from "@/server/apis/debug";
import fileRoute from "@/server/apis/fileRoute";
import { ogCardRoute } from "@/server/apis/ogCards";
import { staticRoute } from "@/server/apis/static";
import { createTRPCContext } from "@/server/trpc/context";
import { appRouter } from "@/server/trpc/router";
import type { HonoCtxEnv } from "@/shared/types";

export const app = new Hono<HonoCtxEnv>();

// Audio streaming + Cover images (must be before tRPC and SSR)
app.route("/", audioRoute);
app.route("/", coverRoute);
app.route("/", debugRoute);
app.route("/", ogCardRoute);
app.route("/", staticRoute);

// tRPC handler — match /api/trpc (batch) and /api/trpc/* (single)
const trpcHandler = trpcServer({
  router: appRouter,
  endpoint: "/api/trpc",
  createContext: (opts, c: Context<HonoCtxEnv>) => createTRPCContext(opts, c),
});
app.use("/api/trpc", trpcHandler);
app.use("/api/trpc/*", trpcHandler);

// SSR catch-all
app.get("/*", fileRoute);

export default app;
