import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { PageTitle } from "@/components/color-blobs";
import { CycleCalendar } from "@/components/cycle-calendar";
import { DaySheet } from "@/components/day-sheet";
import { Predictions } from "@/components/predictions";
import { loadToday, betaPaid } from "@/lib/savia-api";
import { SAVIA_BETA } from "@/lib/beta";
import { localToday } from "@/lib/savia-local";
import { useI18n } from "@/lib/i18n";
import { isCycling, periodDaysFromLogs, formatDay, weightedCycle } from "@/lib/cycle";
import type { DailyLog, TodaySnapshot } from "@/lib/types";

export const Route = createFileRoute("/app/calendario")({ component: CalendarTab });

function CalendarTab() {
  const { t, lang } = useI18n();
  const [data, setData] = useState<TodaySnapshot | null>(() => (SAVIA_BETA ? localToday() : null));
  const [err, setErr] = useState(false);
  const [sheetDay, setSheetDay] = useState<string | null>(null);

  useEffect(() => {
    loadToday()
      .then((snap) => {
        setData(snap);
      })
      .catch(() => {
        if (!SAVIA_BETA) setErr(true);
      });
  }, []);

  function applyLog(log: DailyLog) {
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        log: prev.day === log.day ? log : prev.log,
        recentLogs: [log, ...prev.recentLogs.filter((l) => l.day !== log.day)].slice(0, 90),
        sexDays: log.sex
          ? Array.from(new Set([log.day, ...prev.sexDays]))
          : prev.sexDays.filter((d) => d !== log.day),
        sexMarks: log.sex
          ? [...prev.sexMarks.filter((s) => s.day !== log.day), { day: log.day, kind: log.sexKind }]
          : prev.sexMarks.filter((s) => s.day !== log.day),
      };
    });
  }

  if (!data && !err) {
    return (
      <div className="space-y-4" aria-busy="true" aria-live="polite">
        <Skeleton className="h-9 w-40 rounded-lg" />
        <Skeleton className="h-24 w-full rounded-[1.5rem]" />
        <Skeleton className="h-72 w-full rounded-[1.5rem]" />
      </div>
    );
  }
  if (!data) {
    return (
      <div className="pb-8 pt-2">
        <p className="font-display text-3xl font-semibold tracking-[-0.03em]">{t.navCal}</p>
        <p className="mt-4 text-base leading-relaxed text-muted">{t.emptyLog}</p>
      </div>
    );
  }

  const paid = betaPaid() || data.profile.plan === "serena" || data.profile.plan === "year";
  const learned = weightedCycle(data.periodStarts, data.profile.cycleLength);
  const sheetLog = sheetDay ? (data.recentLogs.find((l) => l.day === sheetDay) ?? null) : null;

  return (
    <div>
      <PageTitle title={t.navCal} />
      <div className="mt-4 rounded-[1.6rem] bg-surface p-4 shadow-card">
        {isCycling(data.profile.stage) ? (
          <>
            <Predictions
              lastStart={data.profile.lastPeriodStart}
              cycleLength={learned}
              periodLength={data.profile.periodLength}
              starts={data.periodStarts}
              intention={data.profile.intention}
              stage={data.profile.stage}
            />
            <CycleCalendar
              lastStart={data.profile.lastPeriodStart}
              cycleLength={learned}
              periodLength={data.profile.periodLength}
              periodStarts={data.periodStarts}
              periodDays={periodDaysFromLogs(data.recentLogs)}
              logs={data.recentLogs.map((l) => ({
                day: l.day,
                flow: l.flow,
                symptoms: l.symptoms,
                mood: l.mood,
                sex: l.sex,
              }))}
              sexDays={data.sexMarks.map((s) => s.day)}
              sexMarks={data.sexMarks}
              paid={paid}
              showFertile={data.profile.intention !== "track"}
              onSelect={(iso) => setSheetDay(iso)}
            />
            {data.periodStarts.length ? (
              <div className="mt-6">
                <p className="text-sm font-semibold">{t.history}</p>
                <ul className="mt-2 space-y-1.5">
                  {[...data.periodStarts]
                    .sort((a, b) => b.localeCompare(a))
                    .slice(0, 8)
                    .map((d) => (
                      <li key={d} className="flex justify-between text-sm">
                        <span>{formatDay(d, lang)}</span>
                        <span className="size-2.5 self-center rounded-full bg-cal-period" />
                      </li>
                    ))}
                </ul>
              </div>
            ) : null}
          </>
        ) : (
          <p className="text-sm leading-relaxed text-muted">{t.calNote}</p>
        )}
      </div>
      {sheetDay ? (
        <DaySheet
          day={sheetDay}
          log={sheetLog}
          paid={paid}
          onClose={() => setSheetDay(null)}
          onSaved={(log) => applyLog(log)}
        />
      ) : null}
    </div>
  );
}
