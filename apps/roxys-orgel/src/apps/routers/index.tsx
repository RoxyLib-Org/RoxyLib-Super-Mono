import { createFileRoute } from "@tanstack/react-router";
import { VinylGrid } from "@/client/components/VinylGrid";

export const Route = createFileRoute("/")({
  component: IndexPage,
});

function IndexPage() {
  return <VinylGrid />;
}
