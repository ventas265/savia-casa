import { Link } from "@tanstack/react-router";
import { SignedIn, SignedOut } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { AuthSlot } from "@/components/auth-slot";
import { LangToggle } from "@/components/lang-toggle";

export function SiteHeader() {
  const { t } = useI18n();
  const { isPending } = useCurrentUserState();
  return (
    <header className="sticky top-0 z-20 bg-bg/90 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-lg items-center justify-between gap-3 px-4">
        <Link to="/" className="text-lg font-semibold tracking-tight text-fg">
          {t.brand}
        </Link>
        <div className="flex items-center gap-2">
          <LangToggle />
          {isPending ? (
            <div className="h-11 w-20 animate-pulse rounded-full bg-surface-2" />
          ) : (
            <>
              <SignedOut>
                <Button size="sm" asChild>
                  <Link to="/login">{t.start}</Link>
                </Button>
              </SignedOut>
              <SignedIn>
                <Button size="sm" asChild>
                  <Link to="/app/hoy">{t.goApp}</Link>
                </Button>
                <AuthSlot compact />
              </SignedIn>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
