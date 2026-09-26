import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageTitle } from "@/components/color-blobs";
import { loadToday, betaPaid } from "@/lib/savia-api";
import { SAVIA_BETA } from "@/lib/beta";
import { localToday } from "@/lib/savia-local";
import { parejaCard } from "@/lib/pareja";
import { useI18n } from "@/lib/i18n";
import type { TodaySnapshot } from "@/lib/types";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/app/pareja")({ component: Pareja });

function Pareja() {
  const { t, lang } = useI18n();
  const [data, setData] = useState<TodaySnapshot | null>(null);
  useEffect(() => {
    if (SAVIA_BETA) setData(localToday());
    loadToday()
      .then(setData)
      .catch(() => {});
  }, []);
  const paid = betaPaid() || data?.profile.plan === "serena" || data?.profile.plan === "year";
  const card = data ? parejaCard(data.profile.stage, data.phase, lang) : null;

  return (
    <div>
      <PageTitle kicker={t.paidLabel} title={t.partnerTitle} />
      <p className="mt-2 text-sm leading-relaxed text-muted">{t.partnerHint}</p>
      {!paid ? (
        <div className="card-hot mt-6 rounded-[22px] p-5">
          <p className="font-display text-xl font-semibold">{t.partnerPay}</p>
          <Button className="mt-4 w-full" asChild>
            <Link to="/pagar">{t.payCta} · {t.proPrice}</Link>
          </Button>
        </div>
      ) : null}
      {paid && card ? (
        <div className="mt-6 space-y-3">
          <article className="card-hot rounded-[22px] p-5">
            <p className="font-display text-2xl font-semibold">{card.title}</p>
            <p className="mt-3 text-sm leading-relaxed opacity-95">{card.need}</p>
          </article>
          <article className="rounded-[1.5rem] bg-surface p-5 shadow-card">
            <p className="text-[10px] font-bold uppercase tracking-wide text-muted">{t.partnerAsk}</p>
            <p className="mt-2 font-display text-xl font-semibold leading-snug">{card.ask}</p>
          </article>
          <article className="glass rounded-[22px] p-5">
            <p className="text-[10px] font-bold uppercase tracking-wide opacity-80">{t.partnerSkip}</p>
            <p className="mt-2 text-sm leading-relaxed">{card.skip}</p>
          </article>
        </div>
      ) : null}
    </div>
  );
}
