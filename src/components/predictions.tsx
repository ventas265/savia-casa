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
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-2xl bg-[#ff6b9d] px-2 py-3 text-center text-white shadow-card">
          <p className="text-[10px] font-semibold uppercase tracking-wide opacity-80">{t.predNext}</p>
          <p className="mt-1 text-sm font-bold">{next ? formatDay(next, lang) : "—"}</p>
        </div>
        <div className="rounded-2xl bg-[#5ee4d6] px-2 py-3 text-center text-ink shadow-card">
          <p className="text-[10px] font-semibold uppercase tracking-wide opacity-70">{t.predFertile}</p>
          <p className="mt-1 text-sm font-bold">
            {win ? `${formatDay(win.start, lang)}–${formatDay(win.end, lang)}` : "—"}
          </p>
        </div>
        <div className="rounded-2xl bg-[#ffd56a] px-2 py-3 text-center text-ink shadow-card">
          <p className="text-[10px] font-semibold uppercase tracking-wide opacity-70">{t.predAvg}</p>
          <p className="mt-1 text-sm font-bold">
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
