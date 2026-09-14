import { useI18n } from "@/lib/i18n";
import { fertileWindow, formatDay, predictPeriod } from "@/lib/cycle";
import type { Intention, Stage } from "@/lib/types";

export function Predictions({
  lastStart,
  cycleLength,
  periodLength,
  starts,
  intention = "track",
  stage = "cycle",
}: {
  lastStart: string | null;
  cycleLength: number;
  periodLength: number;
  starts?: string[];
  intention?: Intention;
  stage?: Stage;
}) {
  const { t, lang } = useI18n();
  const pred = predictPeriod(lastStart, starts || [], cycleLength, stage);
  const showFertile = intention !== "track";
  const win = showFertile ? fertileWindow(lastStart, pred.len, periodLength) : null;
  if (!lastStart) return null;
  return (
    <div className="mb-4">
      <div className={showFertile ? "grid grid-cols-3 gap-2" : "grid grid-cols-2 gap-2"}>
        <div className="rounded-2xl bg-primary px-2 py-3 text-center text-primary-fg shadow-card">
          <p className="text-[10px] font-semibold uppercase tracking-wide opacity-80">{t.predNext}</p>
          <p className="mt-1 text-sm font-bold">
            {pred.from && pred.to ? `${formatDay(pred.from, lang)}–${formatDay(pred.to, lang)}` : "—"}
          </p>
        </div>
        {showFertile ? (
          <div className="rounded-2xl bg-accent px-2 py-3 text-center text-ink shadow-card">
            <p className="text-[10px] font-semibold uppercase tracking-wide opacity-70">{t.predFertile}</p>
            <p className="mt-1 text-sm font-bold">
              {win ? `${formatDay(win.start, lang)}–${formatDay(win.end, lang)}` : "—"}
            </p>
          </div>
        ) : null}
        <div className="rounded-2xl bg-surface px-2 py-3 text-center text-ink shadow-card ring-1 ring-ink/8">
          <p className="text-[10px] font-semibold uppercase tracking-wide opacity-70">{t.predAvg}</p>
          <p className="mt-1 text-sm font-bold">
            {pred.len} {t.daysWord}
          </p>
        </div>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-muted">
        {pred.n < 2 ? t.predFew : pred.irregular ? t.predWide : t.predHow}
        {showFertile ? ` ${intention === "ttc" ? t.fertileTry : t.fertileCare}` : ""}
      </p>
    </div>
  );
}
