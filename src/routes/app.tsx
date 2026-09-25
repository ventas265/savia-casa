import { Outlet, createFileRoute, useRouterState } from "@tanstack/react-router";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Skeleton } from "@/components/ui/skeleton";
import { AppShell } from "@/components/app-shell";
import { SAVIA_BETA } from "@/lib/beta";
import type { TabKey } from "@/components/tab-bar";

export const Route = createFileRoute("/app")({ component: AppLayout });

function tabFromPath(path: string): TabKey {
  if (path.startsWith("/app/hoy")) return "hoy";
  if (path.startsWith("/app/calendario") || path.startsWith("/app/ciclo")) return "cal";
  if (path.startsWith("/app/registro")) return "log";
  if (path.startsWith("/app/sexo")) return "sexo";
  return "mas";
}

function AppLayout() {
  const { user, isPending } = useCurrentUserState();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const current =
    path.startsWith("/app/onboarding") || path.startsWith("/app/preguntar")
      ? "other"
      : tabFromPath(path);

  if (!SAVIA_BETA) {
    if (isPending) {
      return (
        <div className="min-h-dvh p-6">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="mt-8 h-40 w-full" />
        </div>
      );
    }
    if (!user) return <RedirectToSignIn />;
  }

  return (
    <AppShell current={current}>
      <Outlet />
    </AppShell>
  );
}
