import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createRequestHandler,
  RouterServer,
  renderRouterToStream,
} from "@tanstack/react-router/ssr/server";
import type { Context } from "hono";
import {
  Link,
  ReactRefresh,
  Script,
  ViteClient,
} from "vite-ssr-components/react";
import { createRouter } from "@/apps/router";
import { trpc, trpcClient } from "@/client/trpc";
import type { HonoCtxEnv } from "@/shared/types";

export default async function fileRoute(
  c: Context<HonoCtxEnv>,
): Promise<Response> {
  const handler = createRequestHandler({ createRouter, request: c.req.raw });

  c.header("Content-Type", "text/html");

  const res = handler(({ request, responseHeaders, router }) => {
    router.history.replace(c.req.url);

    const queryClient = new QueryClient();

    return renderRouterToStream({
      request,
      responseHeaders,
      router,
      children: (
        <html lang="en" className="antialiased">
          <head>
            <meta charSet="utf-8" />
            <meta
              name="viewport"
              content="width=device-width, initial-scale=1, viewport-fit=cover"
            />
            <title>Roxy's Orgel</title>

            {/* Google Fonts — multilingual typography */}
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link
              rel="preconnect"
              href="https://fonts.gstatic.com"
              crossOrigin=""
            />
            <link
              href="https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Inter:wght@300;400;500;600&family=Noto+Serif+JP:wght@300;400;500;600&family=Noto+Serif+SC:wght@300;400;500;600&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&display=swap"
              rel="stylesheet"
            />

            <ViteClient />
            <ReactRefresh />

            <Script src="/src/apps/client.tsx" />
            <Link href="/src/apps/style.css" rel="stylesheet" />
          </head>

          <body>
            <div id="root">
              <trpc.Provider client={trpcClient} queryClient={queryClient}>
                <QueryClientProvider client={queryClient}>
                  <RouterServer router={router} />
                </QueryClientProvider>
              </trpc.Provider>
            </div>
          </body>
        </html>
      ),
    });
  });

  return res;
}
