import { Link } from "@tanstack/react-router";
import { ArrowRight, Lock, Sparkles } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { insightText, learningText, type InsightResult } from "@/lib/insights";

/** Compact «Lo que Savia aprendió de ti» for Hoy: 1 insight free. */
export function InsightsCompact({ result, paid }: { result: InsightResult; paid: boolean }) {
  const { t, lang } = useI18n();
  const first = result.items[0];
  const rest = result.items.length - 1;
  return (
    <section data-testid="insights-compact" className="glass mt-2 rounded-[22px] px-4 py-3.5" aria-label={t.insightsTitle}>
      <p className="kicker flex items-center gap-1.5 !text-label">
        <Sparkles className="size-3.5" strokeWidth={1.8} aria-hidden />
        {t.insightsTitle}
      </p>
      {first ? (
        <>
          <p className="mt-1.5 font-display text-[17px] font-semibold leading-snug tracking-[-0.02em]">
            {insightText(first, lang).title}
          </p>
          <p className="mt-0.5 text-[12.5px] leading-snug text-soft">{insightText(first, lang).detail}</p>
        </>
      ) : (
        <p className="mt-1.5 text-[13px] leading-snug text-soft">{t.insightsEmpty}</p>
      )}
      {result.learning ? (
        <p className="mt-2 text-[12px] text-muted">{learningText(result.learning, lang)}</p>
      ) : null}
      {rest > 0 ? (
        paid ? (
          <Link
            to="/app/calendario"
            hash="aprendio"
            className="mt-2.5 inline-flex min-h-9 items-center gap-1 text-xs font-semibold text-rose-dust"
          >
            {t.insightsAll} ({rest + 1})
            <ArrowRight className="size-3.5" strokeWidth={1.8} aria-hidden />
          </Link>
        ) : (
          <Link to="/pagar" className="mt-2.5 flex min-h-9 items-center gap-1.5 text-xs font-semibold text-rose-dust">
            <Lock className="size-3.5" strokeWidth={1.8} aria-hidden />
            {t.insightsLocked.replace("{n}", String(rest))}
          </Link>
        )
      ) : null}
    </section>
  );
}

/** Full view (Ciclo). Free: first insight readable, the rest softly locked. */
export function InsightsPanel({ result, paid }: { result: InsightResult; paid: boolean }) {
  const { t, lang } = useI18n();
  return (
    <section id="aprendio" data-testid="insights-panel" className="mt-6 scroll-mt-20" aria-label={t.insightsTitle}>
      <h2 className="flex items-center gap-2 font-display text-[1.4rem] font-semibold tracking-[-0.03em]">
        <Sparkles className="size-5 text-label" strokeWidth={1.6} aria-hidden />
        {t.insightsTitle}
      </h2>
      <p className="mt-1 text-xs text-muted">{t.insightsLocal}</p>
      {result.items.length === 0 ? (
        <p className="glass mt-3 rounded-[20px] p-4 text-sm leading-relaxed text-soft">{t.insightsEmpty}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {result.items.map((ins, i) => {
            const locked = !paid && i > 0;
            const txt = insightText(ins, lang);
            return (
              <li
                key={ins.id}
                data-insight={ins.id}
                data-locked={locked || undefined}
                className={cn("glass relative overflow-hidden rounded-[20px] px-4 py-3.5", i === 0 && "card-hot")}
              >
                <div className={cn(locked && "select-none blur-[5px]")} aria-hidden={locked || undefined}>
                  <p className="font-display text-[16px] font-semibold leading-snug tracking-[-0.02em]">{txt.title}</p>
                  <p className="mt-0.5 text-[12.5px] leading-snug text-soft">{txt.detail}</p>
                </div>
                {locked ? (
                  <span className="absolute inset-0 grid place-items-center">
                    <Lock className="size-4 text-fg/80" strokeWidth={1.8} aria-hidden />
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
      {!paid && result.items.length > 1 ? (
        <Link
          to="/pagar"
          className="press mt-3 flex min-h-11 items-center justify-center rounded-full bg-grad text-sm font-semibold text-white"
        >
          {t.insightsUnlock}
        </Link>
      ) : null}
      {result.learning ? <p className="mt-3 text-xs text-muted">{learningText(result.learning, lang)}</p> : null}
    </section>
  );
}
