import { Hono } from "hono";

const ORIGINS: Record<string, string> = {
  pan: "https://pan.roxylib.com",
  book: "https://book.roxylib.com",
};

const app = new Hono();

app.all("*", async (c) => {
  const reqUrl = new URL(c.req.url);
  const host = reqUrl.hostname;

  let service: string | undefined;
  let path = c.req.path;

  if (host.includes("workers.dev")) {
    const match = c.req.path.match(/^\/(pan|book)(\/.*)?$/);
    if (!match) return c.text("Usage: /pan/... or /book/...", 404);
    service = match[1];
    path = match[2] || "/";
  } else {
    for (const svc of Object.keys(ORIGINS)) {
      if (host === `${svc}.roxylib.com`) {
        service = svc;
        break;
      }
    }
  }

  if (!service || !ORIGINS[service]) return c.text("Unknown service", 404);

  const origin = ORIGINS[service];
  const target = new URL(path + reqUrl.search, origin);

  const headers = new Headers();
  headers.set("Accept", c.req.header("Accept") || "*/*");
  headers.set("Accept-Encoding", c.req.header("Accept-Encoding") || "gzip");
  const cookie = c.req.header("Cookie");
  if (cookie) headers.set("Cookie", cookie);
  const contentType = c.req.header("Content-Type");
  if (contentType) headers.set("Content-Type", contentType);

  const method = c.req.method;
  const res = await fetch(target.href, {
    method,
    headers,
    body: method !== "GET" && method !== "HEAD" ? c.req.raw.body : undefined,
    redirect: "manual",
  });

  // Rewrite Location header on redirects
  const location = res.headers.get("Location");
  if (location) {
    try {
      const loc = new URL(location);
      if (loc.hostname === `${service}.roxylib.com`) {
        loc.hostname = host;
        loc.protocol = "https:";
        const h = new Headers(res.headers);
        h.set("Location", loc.href);
        return new Response(res.body, { status: res.status, headers: h });
      }
    } catch {
      // relative — pass through
    }
  }

  return new Response(res.body, { status: res.status, headers: res.headers });
});

export default app;
