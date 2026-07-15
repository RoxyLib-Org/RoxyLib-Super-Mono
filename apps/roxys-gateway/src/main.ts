import { Hono } from "hono";
import type { Context } from "hono";

interface Env {
  ASSETS: R2Bucket;
}

const ORIGINS = {
  pan: "https://pan.roxylib.com",
  book: "https://book.roxylib.com",
} as const;

const MIME_TYPES: Record<string, string> = {
  html: "text/html",
  css: "text/css",
  js: "application/javascript",
  json: "application/json",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  avif: "image/avif",
  svg: "image/svg+xml",
  ico: "image/x-icon",
  woff2: "font/woff2",
  woff: "font/woff",
  ttf: "font/ttf",
  mp4: "video/mp4",
  webm: "video/webm",
  pdf: "application/pdf",
  zip: "application/zip",
};

const app = new Hono<{ Bindings: Env }>();

app.all("*", async (c) => {
  const host = new URL(c.req.url).hostname;

  if (host === "pan.roxylib.com") return proxy(c, "pan");
  if (host === "book.roxylib.com") return proxy(c, "book");
  if (host === "assets.roxylib.com") return serveAssets(c);

  return c.html(
    `<!doctype html>
<html lang="zh">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>404</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{min-height:100vh;display:flex;align-items:center;justify-content:center;
  background:url(https://s2.loli.net/2023/03/01/zspEADwxS9eTQjL.jpg) center/cover no-repeat fixed;
  font-family:system-ui,sans-serif;color:#fff}
.card{background:rgba(0,0,0,.45);backdrop-filter:blur(8px);
  padding:3rem 4rem;border-radius:1rem;text-align:center}
h1{font-size:5rem;font-weight:200;letter-spacing:.3rem}
p{margin-top:.8rem;font-size:1.1rem;opacity:.8}
</style>
</head>
<body><div class="card"><h1>404</h1><p>没有找到你要的页面</p></div></body>
</html>`,
    404,
  );
});

async function serveAssets(c: Context<{ Bindings: Env }>): Promise<Response> {
  const key = decodeURIComponent(new URL(c.req.url).pathname.slice(1));

  if (!key) {
    return c.text("assets.roxylib.com", 200);
  }

  const object = await c.env.ASSETS.get(key);
  if (!object) {
    return c.text("Not Found", 404);
  }

  const ext = key.split(".").pop()?.toLowerCase() || "";
  const contentType = MIME_TYPES[ext] || "application/octet-stream";

  const headers = new Headers();
  headers.set("Content-Type", contentType);
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  headers.set("ETag", object.httpEtag);

  return new Response(object.body, { headers });
}

async function proxy(c: Context<{ Bindings: Env }>, service: keyof typeof ORIGINS): Promise<Response> {
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

export default app;
