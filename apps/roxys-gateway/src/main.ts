import { getCookie } from "hono/cookie";
import { Hono } from "hono";

interface Env {
  Bindings: GatewayBindings;
  Variables: { upstream: string };
}

const app = new Hono<Env>();

/**
 * Resolve upstream origin based on host or cookie.
 */
app.use("*", async (c, next) => {
  const host = c.req.header("host") ?? "";

  let upstream: string;
  if (host === "book.roxylib.com") {
    upstream = "http://localhost:15244";
  } else if (host === "pan.roxylib.com") {
    upstream = "http://localhost:5244";
  } else {
    const isBook = getCookie(c, "isRoxylibBook") === "true";
    upstream = isBook ? "http://localhost:15244" : "http://localhost:5244";
  }

  c.set("upstream", upstream);
  await next();
});

/**
 * Proxy all requests through VPC to adabana.
 */
app.all("*", async (c) => {
  const upstream = c.get("upstream");
  const url = new URL(c.req.url);
  const target = `${upstream}${url.pathname}${url.search}`;

  const headers = new Headers(c.req.raw.headers);
  headers.set("X-Forwarded-Host", url.hostname);
  headers.set("X-Forwarded-Proto", "https");

  const method = c.req.method;
  const hasBody = method !== "GET" && method !== "HEAD";

  return c.env.VPC.fetch(target, {
    method,
    headers,
    body: hasBody ? c.req.raw.body : undefined,
    redirect: "manual",
  });
});

export default app;
