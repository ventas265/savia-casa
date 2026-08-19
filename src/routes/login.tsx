import { createFileRoute, Link } from "@tanstack/react-router";
import { GROK_PROVIDERS, authEnabled, signIn } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const { t } = useI18n();
  const { user, isPending } = useCurrentUserState();

  return (
    <div className="min-h-dvh bg-bg">
      <SiteHeader />
      <main className="mx-auto grid max-w-lg px-4 pt-12 pb-20">
        <h1 className="text-4xl font-bold tracking-tight">{t.loginTitle}</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">{t.loginBody}</p>
        <p className="mt-2 text-sm leading-relaxed">{t.loginAfter}</p>
        {isPending ? (
          <div className="mt-8 h-24 animate-pulse rounded-xl bg-surface-2" />
        ) : user ? (
          <Button className="mt-8" asChild>
            <Link to="/app/hoy">{t.goApp}</Link>
          </Button>
        ) : authEnabled ? (
          <div className="mt-8 space-y-3">
            {GROK_PROVIDERS.map((p) => (
              <Button
                key={p.providerId}
                type="button"
                className="w-full"
                variant="default"
                onClick={() => void signIn(p.providerId, { callbackURL: "/app/hoy", errorCallbackURL: "/login" })}
              >
                {t.continueWith} {p.label}
              </Button>
            ))}
          </div>
        ) : (
          <p className="mt-8 text-sm text-muted">Sign-in is disabled.</p>
        )}
      </main>
    </div>
  );
}
