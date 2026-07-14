import { createFileRoute } from "@tanstack/react-router";
import { trpc } from "@/client/trpc";

export const Route = createFileRoute("/")({
  component: IndexPage,
});

function IndexPage() {
  const hello = trpc.hello.useQuery({ name: "Orgel" });

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="card bg-base-200 shadow-xl p-8">
        <h1 className="text-3xl font-bold text-primary">
          {hello.data?.greeting ?? "Loading..."}
        </h1>
        <p className="text-base-content/70 mt-2">
          Hono + tRPC + TanStack Router + Vite SSR + Jotai + Tailwind + DaisyUI
        </p>
      </div>
    </div>
  );
}
