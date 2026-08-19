import { useI18n } from "@/lib/i18n";
import { averageCycle, fertileWindow, formatDay, nextPeriodDate } from "@/lib/cycle";
import type { Intention } from "@/lib/types";

export function Predictions({
  lastStart,
  cycleLength,
  periodLength,
  starts,
  intention = "track",
}: {
  lastStart: string | null;
  cycleLength: number;
  periodLength: number;
  starts?: string[];
  intention?: Intention;
}) {
  const { t, lang } = useI18n();
  const avg = averageCycle(starts || [], cycleLength);
  const next = nextPeriodDate(lastStart, avg);
  const win = fertileWindow(lastStart, avg, periodLength);
  if (!lastStart) return null;
  return (
    <div className="mb-4">
      <div className="grid grid-cols-3 divide-x divide-border text-center">
        <div className="px-1">
          <p className="text-xs text-muted">{t.predNext}</p>
          <p className="mt-1 text-sm font-semibold">{next ? formatDay(next, lang) : "—"}</p>
        </div>
        <div className="px-1">
          <p className="text-xs text-muted">{t.predFertile}</p>
          <p className="mt-1 text-sm font-semibold">
            {win ? `${formatDay(win.start, lang)}–${formatDay(win.end, lang)}` : "—"}
          </p>
        </div>
        <div className="px-1">
          <p className="text-xs text-muted">{t.predAvg}</p>
          <p className="mt-1 text-sm font-semibold">
            {avg} {t.daysWord}
          </p>
        </div>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-muted">
        {intention === "ttc" ? t.fertileTry : t.fertileCare}
      </p>
    </div>
  );
}
