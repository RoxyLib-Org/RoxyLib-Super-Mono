import { httpBatchLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import superjson from "superjson";
import type { AppRouter } from "@/server/trpc/router";

export const trpc = createTRPCReact<AppRouter>();

const isServer = typeof window === "undefined";

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: isServer ? "http://localhost/api/trpc" : "/api/trpc",
      transformer: superjson,
      fetch: isServer ? () => Promise.resolve(new Response("[]")) : undefined,
    }),
  ],
});
