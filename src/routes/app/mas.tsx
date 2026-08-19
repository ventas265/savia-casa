import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { useI18n } from "@/lib/i18n";
import { Disclaimer } from "@/components/disclaimer";

export const Route = createFileRoute("/app/mas")({ component: MasTab });

function MasTab() {
  const { t } = useI18n();
  const links = [
    { to: "/app/preguntar" as const, label: t.ask },
    { to: "/app/cuaderno" as const, label: t.settings },
    { to: "/app/onboarding" as const, label: t.onboardingTitle },
    { to: "/pagar" as const, label: t.payCta },
    { to: "/pricing" as const, label: t.navPricing },
  ];
  return (
    <AppShell current="mas">
      <h1 className="text-2xl font-semibold">{t.more}</h1>
      <ul className="mt-6 divide-y divide-border overflow-hidden rounded-3xl bg-surface">
        {links.map((l) => (
          <li key={l.to}>
            <Link to={l.to} className="flex min-h-14 items-center justify-between px-4 text-sm">
              {l.label}
              <ChevronRight className="size-4 text-muted" />
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-8">
        <Disclaimer compact />
      </div>
    </AppShell>
  );
}
