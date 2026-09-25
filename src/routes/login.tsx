import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { GROK_PROVIDERS, authEnabled, authClient, signIn } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SiteHeader } from "@/components/site-header";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { user, isPending } = useCurrentUserState();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function withEmail(mode: "in" | "up") {
    const mail = email.trim().toLowerCase();
    if (!mail.includes("@") || password.length < 8) {
      toast.error(t.loginFail);
      return;
    }
    setBusy(true);
    try {
      const res =
        mode === "up"
          ? await authClient.signUp.email({
              email: mail,
              password,
              name: mail.split("@")[0] || "Savia",
            })
          : await authClient.signIn.email({ email: mail, password });
      if (res.error) {
        toast.error(res.error.message || t.loginFail);
        return;
      }
      await authClient.getSession();
      void navigate({ to: "/app/hoy" });
    } catch {
      toast.error(t.loginFail);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-dvh">
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
          <div className="mt-8 space-y-3 rounded-3xl bg-surface p-5 shadow-sm">
            <div>
              <Label htmlFor="mail">{t.emailLabel}</Label>
              <Input
                id="mail"
                className="mt-1"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="pass">{t.passwordLabel}</Label>
              <Input
                id="pass"
                className="mt-1"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="button" className="w-full" disabled={busy} onClick={() => void withEmail("in")}>
              {t.loginEmail}
            </Button>
            <Button type="button" variant="secondary" className="w-full" disabled={busy} onClick={() => void withEmail("up")}>
              {t.createAccount}
            </Button>
            <p className="pt-2 text-center text-xs text-muted">{t.loginOr}</p>
            {GROK_PROVIDERS.map((p) => (
              <Button
                key={p.providerId}
                type="button"
                className="w-full"
                variant="secondary"
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
