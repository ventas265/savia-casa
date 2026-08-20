import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { PageTitle, CHIP_TONES } from "@/components/color-blobs";
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
      <PageTitle title={t.more} />
      <ul className="mt-6 space-y-2">
        {links.map((l, i) => (
          <li key={l.to}>
            <Link
              to={l.to}
              className={`flex min-h-14 items-center justify-between rounded-[1.25rem] px-4 text-sm font-semibold shadow-card ${CHIP_TONES[i % CHIP_TONES.length]}`}
            >
              {l.label}
              <ChevronRight className="size-4 opacity-70" />
            </Link>
          </li>
        ))}
        <li>
          <button
            type="button"
            className="flex min-h-14 w-full items-center justify-between rounded-[1.25rem] bg-surface px-4 text-left text-sm font-semibold shadow-card"
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
          <a
            href="/?install=1"
            className="flex min-h-14 items-center justify-between rounded-[1.25rem] bg-[#ffd56a] px-4 text-sm font-semibold text-ink shadow-card"
          >
            {t.installCta}
            <ChevronRight className="size-4 opacity-70" />
          </a>
        </li>
      </ul>
      <p className="mt-6 text-sm leading-relaxed text-muted">{t.privacyNote}</p>
      <div className="mt-3 flex gap-4 text-sm font-semibold text-primary">
        <Link to="/privacidad">{t.navPrivacy}</Link>
        <Link to="/terminos">{t.navTerms}</Link>
      </div>
      <div className="mt-8">
        <Disclaimer compact />
      </div>
    </AppShell>
  );
}
