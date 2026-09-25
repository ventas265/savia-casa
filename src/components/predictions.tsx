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
  // Fertile window always shown — young users avoiding unplanned pregnancy.
  const win = fertileWindow(lastStart, pred.len, periodLength);
  void intention;
  if (!lastStart) return null;
  return (
    <div className="mb-4">
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-[18px] border border-[rgb(242_66_126/0.35)] bg-[rgb(242_66_126/0.14)] px-2.5 py-3 backdrop-blur-xl">
          <p className="kicker !text-[9px] !tracking-[0.08em] !text-[#ffb0cc]">{t.predNext}</p>
          <p className="mt-1.5 font-display text-[15px] font-semibold leading-tight tracking-[-0.02em]">
            {pred.from && pred.to ? `${formatDay(pred.from, lang)}–${formatDay(pred.to, lang)}` : "—"}
          </p>
        </div>
        <div className="rounded-[18px] border border-[rgb(111_224_210/0.35)] bg-[rgb(111_224_210/0.12)] px-2.5 py-3 backdrop-blur-xl">
          <p className="kicker !text-[9px] !tracking-[0.08em] !text-[#9ff0e6]">{t.predFertile}</p>
          <p className="mt-1.5 font-display text-[15px] font-semibold leading-tight tracking-[-0.02em]">
            {win ? `${formatDay(win.start, lang)}–${formatDay(win.end, lang)}` : "—"}
          </p>
        </div>
        <div className="glass rounded-[18px] px-2.5 py-3">
          <p className="kicker !text-[9px] !tracking-[0.08em]">{t.predAvg}</p>
          <p className="mt-1.5 font-display text-[15px] font-semibold leading-tight tracking-[-0.02em]">
            {pred.len} {t.daysWord}
          </p>
        </div>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-muted">
        {pred.n < 2 ? t.predFew : pred.irregular ? t.predWide : t.predHow} {t.fertileCare} {t.periodEstimate}
      </p>
    </div>
  );
}
