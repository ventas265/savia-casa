import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Heart } from "lucide-react";
import { PageTitle } from "@/components/color-blobs";
import { Disclaimer } from "@/components/disclaimer";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/app/sexo")({ component: SexoTab });

function SexBlob() {
  return (
    <span aria-hidden className="glass grid size-12 shrink-0 place-items-center rounded-full text-[#ff8cb8]">
      <Heart className="size-5" strokeWidth={1.5} />
    </span>
  );
}

function SexoTab() {
  const { t } = useI18n();
  const tips = [
    { title: t.sexTip1Title, body: t.sexTip1Body },
    { title: t.sexTip2Title, body: t.sexTip2Body },
    { title: t.sexTip3Title, body: t.sexTip3Body },
    { title: t.sexTip4Title, body: t.sexTip4Body },
    { title: t.sexTip5Title, body: t.sexTip5Body },
    { title: t.sexTip6Title, body: t.sexTip6Body },
  ] as const;

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <PageTitle title={t.sexTitle} />
        <SexBlob />
      </div>
      <p className="mt-2 text-base leading-relaxed text-muted">{t.sexLead}</p>

      <ul className="mt-6 space-y-3">
        {tips.map((tip, i) => (
          <li key={tip.title} className="glass rounded-[22px] p-5">
            <p className="kicker !text-[#ffb0cc]">{String(i + 1).padStart(2, "0")}</p>
            <p className="mt-1.5 font-display text-lg font-semibold tracking-[-0.02em] text-ink">{tip.title}</p>
            <p className="mt-2 text-sm leading-relaxed text-fg/90">{tip.body}</p>
          </li>
        ))}
      </ul>

      <div className="mt-6 space-y-3">
        <Link
          to="/app/preguntar"
          className="press flex min-h-14 items-center justify-center gap-2 rounded-full bg-grad px-5 text-sm font-semibold text-primary-fg shadow-[0_10px_30px_-8px_rgb(242_66_126/0.6)]"
        >
          {t.sexAskCta}
          <ArrowUpRight className="size-4" strokeWidth={2} aria-hidden />
        </Link>
        <Link
          to="/pagar"
          className="press glass flex min-h-12 items-center justify-center rounded-full px-5 text-sm font-semibold text-ink"
        >
          {t.sexSerenaCta}
        </Link>
        <Link
          to="/app/guia"
          className="press flex min-h-12 items-center justify-center rounded-full px-5 text-sm font-semibold text-[#ff8cb8]"
        >
          {t.sexGuideLink}
        </Link>
      </div>

      <p className="mt-6 text-xs leading-relaxed text-muted">{t.sexDisclaimer}</p>
      <div className="mt-4">
        <Disclaimer compact />
      </div>
    </div>
  );
}
