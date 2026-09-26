import { useI18n } from "@/lib/i18n";
import { confidenceLabel, formatRange, predictPeriod, todayISO, upcomingFertile } from "@/lib/cycle";
import type { Intention, Stage } from "@/lib/types";

/**
 * Calendar header: next period as a range + confidence (same words as Hoy and
 * onboarding), the upcoming fertile window (never a past one), usual cycle,
 * and the screen's single «no es anticonceptivo» notice.
 */
export function Predictions({
  lastStart,
  cycleLength,
  periodLength,
  starts,
  periodDays = [],
  intention = "track",
  stage = "cycle",
}: {
  lastStart: string | null;
  cycleLength: number;
  periodLength: number;
  starts?: string[];
  periodDays?: string[];
  intention?: Intention;
  stage?: Stage;
}) {
  const { t, lang } = useI18n();
  const pred = predictPeriod(lastStart, starts || [], cycleLength, stage);
  const win = upcomingFertile({
    lastStart,
    cycleLength: pred.len,
    periodLength,
    periodStarts: starts || [],
    periodDays,
    today: todayISO(),
  });
  void intention;
  if (!lastStart) return null;
  return (
    <div className="mb-4" data-testid="predictions">
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-[18px] border border-regla-50 bg-regla-50 px-2.5 py-3 backdrop-blur-xl">
          <p className="kicker !text-[9px] !tracking-[0.08em] !text-accent">{t.predNext}</p>
          <p className="mt-1.5 font-display text-[15px] font-semibold leading-tight tracking-[-0.02em]" data-testid="pred-range">
            {pred.from && pred.to ? formatRange(pred.from, pred.to, lang) : "—"}
          </p>
          <p className="mt-1 text-[10.5px] leading-tight text-soft">{confidenceLabel(pred, lang)}</p>
        </div>
        <div className="rounded-[18px] border border-ovu-300 bg-ovu-50 px-2.5 py-3 backdrop-blur-xl">
          <p className="kicker !text-[9px] !tracking-[0.08em] !text-ovu-ink">{t.predFertile}</p>
          <p className="mt-1.5 font-display text-[15px] font-semibold leading-tight tracking-[-0.02em]">
            {win ? formatRange(win.start, win.end, lang) : "—"}
          </p>
        </div>
        <div className="rounded-[18px] border border-[rgb(168_197_160/0.3)] bg-[rgb(168_197_160/0.08)] px-2.5 py-3 backdrop-blur-xl">
          <p className="kicker !text-[9px] !tracking-[0.08em] !text-lut-ink">{t.predAvg}</p>
          <p className="mt-1.5 font-display text-[15px] font-semibold leading-tight tracking-[-0.02em]">
            {pred.len} {t.daysWord}
          </p>
        </div>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-muted" data-testid="contra-notice">
        {pred.n < 2 ? t.predFew1b : pred.irregular ? t.predWide : t.predHow1b} {t.notContraOnce}
      </p>
    </div>
  );
}
