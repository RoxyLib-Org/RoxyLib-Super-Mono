import { Hono } from "hono";

interface Env {
  Bindings: GatewayBindings;
}

/** Map public hostnames to private upstream origins behind the tunnel. */
const ROUTES: Record<string, string> = {
  "pan.roxylib.com": "http://localhost:5244",
  "book.roxylib.com": "http://localhost:15244",
};

const app = new Hono<Env>();

/**
 * Forward requests through the VPC tunnel to private services.
 * Routes by Host header → internal origin on adabana.
 */
app.all("/*", async (c) => {
  const url = new URL(c.req.url);
  const host = url.hostname;

  // Resolve upstream: domain-specific route or fallback to UPSTREAM_URL
  const upstream = ROUTES[host] ?? c.env.UPSTREAM_URL;
  const target = `${upstream}${url.pathname}${url.search}`;

  const headers = new Headers(c.req.raw.headers);
  headers.set("X-Forwarded-Host", host);
  headers.set("X-Forwarded-Proto", url.protocol.replace(":", ""));

  // Use VPC binding to reach private network through the tunnel
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

export default {
  fetch: app.fetch,
};
