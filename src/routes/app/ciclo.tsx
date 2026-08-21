import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/app/ciclo")({
  beforeLoad: () => {
    throw redirect({ to: "/app/calendario" });
  },
  component: () => null,
});
