import { getCookie } from "hono/cookie";
import { Hono } from "hono";

interface Env {
  Bindings: GatewayBindings;
  Variables: { binding: "VPC_PAN" | "VPC_BOOK" };
}

const app = new Hono<Env>();

/**
 * Resolve which VPC binding to use based on host or cookie.
 */
app.use("*", async (c, next) => {
  const host = c.req.header("host") ?? "";

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
  await next();
});

/**
 * Proxy all requests through VPC to adabana.
 * VPC Service controls the actual host:port routing.
 * The URL here only sets the path and Host header.
 */
app.all("*", async (c) => {
  const bindingName = c.get("binding");
  const url = new URL(c.req.url);
  // VPC Services ignore host/port in the URL — only path matters
  const target = `http://vpc-service${url.pathname}${url.search}`;

  console.log(`[gateway] ${c.req.method} ${c.req.url} → ${bindingName} ${url.pathname}`);

  const method = c.req.method;
  const hasBody = method !== "GET" && method !== "HEAD";

  try {
    const fetcher = c.env[bindingName];
    const res = await fetcher.fetch(target, {
      method,
      headers: c.req.raw.headers,
      body: hasBody ? c.req.raw.body : undefined,
      redirect: "manual",
    });
    console.log(`[gateway] ← ${res.status}`);
    return res;
  } catch (err) {
    console.error(`[gateway] VPC fetch error:`, err);
    return c.text(`Gateway error: ${err}`, 502);
  }
});

export default app;
