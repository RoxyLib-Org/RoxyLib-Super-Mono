import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterClient } from "@tanstack/react-router/ssr/client";
import { StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { trpc, trpcClient } from "@/client/trpc";
import { createRouter } from "./router";

// After a deploy, old chunk hashes disappear from the CDN. When the browser
// tries to lazy-load a route chunk that no longer exists, Vite fires this event.
// Force a clean page reload so the new HTML (with fresh chunk URLs) is fetched.
window.addEventListener("vite:preloadError", (e) => {
  e.preventDefault();
  window.location.reload();
});

const queryClient = new QueryClient();
const root = document.getElementById("root")!;
const router = createRouter();

hydrateRoot(
  root,
  <StrictMode>
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <RouterClient router={router} />
      </QueryClientProvider>
    </trpc.Provider>
  </StrictMode>,
);
