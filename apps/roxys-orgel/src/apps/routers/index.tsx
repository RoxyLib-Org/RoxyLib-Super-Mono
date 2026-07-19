import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const VinylGrid = lazy(() =>
  import("@/client/components/VinylGrid").then((m) => ({
    default: m.VinylGrid,
  })),
);

export const Route = createFileRoute("/")({
  component: IndexPage,
});

function IndexPage() {
  return (
    <Suspense fallback={null}>
      <VinylGrid />
    </Suspense>
  );
}
