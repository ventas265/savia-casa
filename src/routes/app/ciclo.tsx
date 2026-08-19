import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/app/ciclo")({
  beforeLoad: () => {
    throw redirect({ to: "/app" });
  },
  component: () => null,
});
