import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { useI18n } from "@/lib/i18n";
import { Disclaimer } from "@/components/disclaimer";
import { notifyPermission, requestNotify } from "@/lib/notify";

export const Route = createFileRoute("/app/mas")({ component: MasTab });

function MasTab() {
  const { t } = useI18n();
  const [perm, setPerm] = useState(notifyPermission);
  const links = [
    { to: "/app/onboarding" as const, label: t.profile },
    { to: "/app/preguntar" as const, label: t.askTalk },
    { to: "/app/informe" as const, label: t.reportTitle },
    { to: "/app/cuaderno" as const, label: t.settings },
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
        <li>
          <button
            type="button"
            className="flex min-h-14 w-full items-center justify-between px-4 text-left text-sm"
            onClick={() => {
              void requestNotify().then((p) => {
                setPerm(p);
                if (p === "granted") toast.success(t.notifyOn);
              });
            }}
          >
            {perm === "granted" ? t.notifyOn : t.notifyCta}
            <ChevronRight className="size-4 text-muted" />
          </button>
        </li>
        <li>
          <a href="/?install=1" className="flex min-h-14 items-center justify-between px-4 text-sm">
            {t.installCta}
            <ChevronRight className="size-4 text-muted" />
          </a>
        </li>
      </ul>
      <p className="mt-6 text-sm leading-relaxed text-muted">{t.privacyNote}</p>
      <div className="mt-8">
        <Disclaimer compact />
      </div>
    </AppShell>
  );
}