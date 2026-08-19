import { Outlet, createFileRoute } from "@tanstack/react-router";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Skeleton } from "@/components/ui/skeleton";
import { SAVIA_BETA } from "@/lib/beta";

export const Route = createFileRoute("/app")({ component: AppLayout });

function AppLayout() {
  const { user, isPending } = useCurrentUserState();
  if (SAVIA_BETA) return <Outlet />;
  if (isPending) {
    return (
      <div className="min-h-dvh bg-bg p-6">
        <Skeleton className="h-14 w-full" />
        <Skeleton className="mt-8 h-40 w-full" />
      </div>
    );
  }
  if (!user) return <RedirectToSignIn />;
  return <Outlet />;
}