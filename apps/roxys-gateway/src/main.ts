import { Hono } from "hono";
import type { Context } from "hono";

const ORIGINS: Record<string, string> = {
  pan: "https://pan.roxylib.com",
  book: "https://book.roxylib.com",
};

const COOKIE_NAME = "gw_service";

const app = new Hono();

// /pan or /book → set cookie + redirect to root
app.get("/pan", (c) => switchTo(c, "pan", "/"));
app.get("/book", (c) => switchTo(c, "book", "/"));
app.get("/pan/:path{.*}", (c) => switchTo(c, "pan", `/${c.req.param("path")}`));
app.get("/book/:path{.*}", (c) => switchTo(c, "book", `/${c.req.param("path")}`));

// Everything else — read cookie and proxy
app.all("*", async (c) => {
  const cookie = parseCookie(c.req.header("Cookie") || "");
  const service = cookie[COOKIE_NAME];

  if (!service || !ORIGINS[service]) {
    return c.html(`<h2>RoxyLib Gateway</h2><ul>
      <li><a href="/pan">pan (AList)</a></li>
      <li><a href="/book">book (Talebook)</a></li>
    </ul>`);
  }

  return proxy(c, service);
});

async function proxy(c: Context, service: string): Promise<Response> {
  const origin = ORIGINS[service];
  const reqUrl = new URL(c.req.url);
  const target = new URL(reqUrl.pathname + reqUrl.search, origin);

  const headers = new Headers();
  headers.set("Accept", c.req.header("Accept") || "*/*");
  headers.set("Accept-Encoding", c.req.header("Accept-Encoding") || "gzip");
  const fwdCookie = c.req.header("Cookie");
  if (fwdCookie) headers.set("Cookie", fwdCookie);
  const ct = c.req.header("Content-Type");
  if (ct) headers.set("Content-Type", ct);

  const method = c.req.method;
  const res = await fetch(target.href, {
    method,
    headers,
    body: method !== "GET" && method !== "HEAD" ? c.req.raw.body : undefined,
    redirect: "manual",
  });

  return new Response(res.body, { status: res.status, headers: res.headers });
}

function switchTo(c: Context, service: string, path: string): Response {
  return new Response(null, {
    status: 302,
    headers: {
      Location: path,
      "Set-Cookie": `${COOKIE_NAME}=${service}; Path=/; SameSite=Lax; Max-Age=86400`,
    },
  });
}

function parseCookie(header: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const pair of header.split(";")) {
    const idx = pair.indexOf("=");
    if (idx > 0) {
      result[pair.slice(0, idx).trim()] = pair.slice(idx + 1).trim();
    }
  }
  return result;
}

export default app;
