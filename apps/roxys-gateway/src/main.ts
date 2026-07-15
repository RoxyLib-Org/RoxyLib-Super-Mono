import { getCookie } from "hono/cookie";
import { Hono } from "hono";

interface Env {
  Bindings: GatewayBindings;
}

const app = new Hono<Env>();

/**
 * Forward requests through VPC to private services on adabana.
 * - pan.roxylib.com → localhost:5244
 * - book.roxylib.com → localhost:15244
 * - Default: pan, unless cookie isRoxylibBook=true → book
 */
app.all("/*", async (c) => {
  const url = new URL(c.req.url);
  const host = url.hostname;

  let upstream: string;
  if (host === "book.roxylib.com") {
    upstream = "http://localhost:15244";
  } else if (host === "pan.roxylib.com") {
    upstream = "http://localhost:5244";
  } else {
    // Default: check cookie
    const isBook = getCookie(c, "isRoxylibBook") === "true";
    upstream = isBook ? "http://localhost:15244" : "http://localhost:5244";
  }

  const target = `${upstream}${url.pathname}${url.search}`;

  const headers = new Headers(c.req.raw.headers);
  headers.set("X-Forwarded-Host", host);
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

export default { fetch: app.fetch };
