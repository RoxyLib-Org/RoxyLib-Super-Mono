import { trpcServer } from "@hono/trpc-server";
import { getCookie } from "hono/cookie";
import type { Context } from "hono";
import { Hono } from "hono";
import fileRoute from "@/server/apis/fileRoute";
import { createTRPCContext } from "@/server/trpc/context";
import { appRouter } from "@/server/trpc/router";
import type { HonoCtxEnv } from "@/shared/types";

export const app = new Hono<HonoCtxEnv>();

// tRPC handler
app.use(
  "/api/trpc/*",
  trpcServer({
    router: appRouter,
    createContext: (opts, c: Context<HonoCtxEnv>) => createTRPCContext(opts, c),
  }),
);

// VPC proxy: pan (default) or book (cookie isRoxylibBook=true)
app.all("/*", async (c, next) => {
  const isBook = getCookie(c, "isRoxylibBook") === "true";
  const upstream = isBook
    ? "http://localhost:15244"
    : "http://localhost:5244";

  const url = new URL(c.req.url);
  const target = `${upstream}${url.pathname}${url.search}`;

  const headers = new Headers(c.req.raw.headers);
  headers.set("X-Forwarded-Host", url.hostname);
  headers.set("X-Forwarded-Proto", "https");

  const res = await c.env.VPC.fetch(target, {
    method: c.req.method,
    headers,
    body: c.req.raw.body,
  });

  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers: res.headers,
  });
});

export default app;
