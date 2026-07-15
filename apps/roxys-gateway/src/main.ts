import { Hono } from "hono";
import type { Context } from "hono";

const ORIGINS = {
  pan: "https://pan.roxylib.com",
  book: "https://book.roxylib.com",
} as const;

const app = new Hono();

app.all("*", async (c) => {
  const cookies = parseCookie(c.req.header("Cookie") || "");
  const service = cookies["isRoxyBook"] === "true" ? "book" : "pan";
  return proxy(c, service);
});

async function proxy(c: Context, service: keyof typeof ORIGINS): Promise<Response> {
  const origin = ORIGINS[service];
  const reqUrl = new URL(c.req.url);
  const target = new URL(reqUrl.pathname + reqUrl.search, origin);

  const headers = new Headers();
  headers.set("Accept", c.req.header("Accept") || "*/*");
  headers.set("Accept-Encoding", c.req.header("Accept-Encoding") || "gzip");
  const cookie = c.req.header("Cookie");
  if (cookie) headers.set("Cookie", cookie);
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
