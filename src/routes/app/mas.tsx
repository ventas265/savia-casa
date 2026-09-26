import { createFileRoute, redirect } from "@tanstack/react-router";

// «Más» became «Tú» (Phase 1b). Old links and installed shortcuts keep working.
export const Route = createFileRoute("/app/mas")({
  beforeLoad: ({ location }) => {
    throw redirect({ to: "/app/tu", hash: location.hash || undefined, replace: true });
  },
});
