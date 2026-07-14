import { Hono } from "hono";

interface Env {
  Bindings: GatewayBindings;
}

const app = new Hono<Env>();

/**
 * Forward all requests to the upstream (local) server.
 * This worker acts as a public proxy to a local machine.
 */
app.all("/*", async (c) => {
  const upstream = c.env.UPSTREAM_URL;
  const url = new URL(c.req.url);
  const target = `${upstream}${url.pathname}${url.search}`;

  const headers = new Headers(c.req.raw.headers);
  headers.set("X-Forwarded-Host", url.hostname);
  headers.set("X-Forwarded-Proto", url.protocol.replace(":", ""));

  const res = await fetch(target, {
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
