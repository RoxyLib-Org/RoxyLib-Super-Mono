import { getCookie } from "hono/cookie";
import { Hono } from "hono";

interface Env {
  Bindings: GatewayBindings;
  Variables: {
    binding: "VPC_PAN" | "VPC_BOOK";
    originHost: string;
  };
}

const BINDING_HOST: Record<string, string> = {
  VPC_PAN: "pan.roxylib.com",
  VPC_BOOK: "book.roxylib.com",
};

const app = new Hono<Env>();

/**
 * Resolve which VPC binding to use and the canonical origin host.
 */
app.use("*", async (c, next) => {
  const host = new URL(c.req.url).hostname;

  let binding: "VPC_PAN" | "VPC_BOOK";
  if (host === "book.roxylib.com") {
    binding = "VPC_BOOK";
  } else if (host === "pan.roxylib.com") {
    binding = "VPC_PAN";
  } else {
    const isBook = getCookie(c, "isRoxylibBook") === "true";
    binding = isBook ? "VPC_BOOK" : "VPC_PAN";
  }

  c.set("binding", binding);
  c.set("originHost", BINDING_HOST[binding]);
  await next();
});

/**
 * Proxy all requests through VPC to adabana.
 * - Sets Host header to what the upstream service expects
 * - Rewrites Location headers in redirects to preserve the public origin
 */
app.all("*", async (c) => {
  const bindingName = c.get("binding");
  const originHost = c.get("originHost");
  const reqUrl = new URL(c.req.url);

  // Build target URL — VPC routes by service config, not by URL host
  const target = new URL(reqUrl.pathname, `http://${originHost}`);
  target.search = reqUrl.search;

  const method = c.req.method;
  const hasBody = method !== "GET" && method !== "HEAD";

  const headers = new Headers(c.req.raw.headers);
  headers.set("Host", originHost);
  headers.set("X-Forwarded-Host", reqUrl.hostname);
  headers.set("X-Forwarded-Proto", "https");
  headers.set("X-Real-IP", c.req.header("cf-connecting-ip") ?? "");

  try {
    const fetcher = c.env[bindingName];
    const res = await fetcher.fetch(target.href, {
      method,
      headers,
      body: hasBody ? c.req.raw.body : undefined,
      redirect: "manual",
    });

    // Rewrite Location header in redirects to use the public origin
    const location = res.headers.get("Location");
    if (location) {
      const rewritten = rewriteLocation(location, originHost, reqUrl.hostname);
      if (rewritten !== location) {
        const newHeaders = new Headers(res.headers);
        newHeaders.set("Location", rewritten);
        return new Response(res.body, {
          status: res.status,
          statusText: res.statusText,
          headers: newHeaders,
        });
      }
    }

    return res;
  } catch (err) {
    console.error(`[gateway] VPC fetch error:`, err);
    return c.text(`Gateway error: ${err}`, 502);
  }
});

/**
 * Rewrite upstream Location header so redirects point to the public host.
 */
function rewriteLocation(
  location: string,
  upstreamHost: string,
  publicHost: string,
): string {
  if (upstreamHost === publicHost) return location;

  try {
    const loc = new URL(location);
    if (loc.hostname === upstreamHost) {
      loc.hostname = publicHost;
      loc.protocol = "https:";
      return loc.href;
    }
  } catch {
    // Relative URL — pass through as-is
  }
  return location;
}

export default app;
