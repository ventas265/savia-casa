import { createFileRoute, Link } from "@tanstack/react-router";
import { PageTitle } from "@/components/color-blobs";
import { Disclaimer } from "@/components/disclaimer";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/app/sexo")({ component: SexoTab });

function SexBlob() {
  return (
    <svg viewBox="0 0 120 80" className="h-16 w-24 text-primary/40" aria-hidden>
      <ellipse cx="48" cy="40" rx="36" ry="28" fill="currentColor" opacity="0.55" />
      <ellipse cx="78" cy="36" rx="26" ry="22" fill="currentColor" opacity="0.35" />
      <circle cx="62" cy="34" r="10" fill="currentColor" opacity="0.25" />
    </svg>
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
        {tips.map((tip) => (
          <li
            key={tip.title}
            className="rounded-[1.5rem] bg-primary/10 p-5 shadow-card ring-1 ring-primary/15"
          >
            <p className="font-display text-lg font-semibold tracking-[-0.02em] text-ink">{tip.title}</p>
            <p className="mt-2 text-sm leading-relaxed text-fg/90">{tip.body}</p>
          </li>
        ))}
      </ul>

      <div className="mt-6 space-y-3">
        <Link
          to="/app/preguntar"
          className="press flex min-h-14 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-fg shadow-card"
        >
          {t.sexAskCta}
        </Link>
        <Link
          to="/pagar"
          className="press flex min-h-12 items-center justify-center rounded-full bg-plum/15 px-5 text-sm font-semibold text-ink"
        >
          {t.sexSerenaCta}
        </Link>
        <Link
          to="/app/guia"
          className="press flex min-h-12 items-center justify-center rounded-full bg-surface px-5 text-sm font-semibold text-primary shadow-card"
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
