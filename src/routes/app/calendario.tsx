import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { PageTitle } from "@/components/color-blobs";
import { CycleCalendar } from "@/components/cycle-calendar";
import { DaySheet } from "@/components/day-sheet";
import { Predictions } from "@/components/predictions";
import { loadToday, writeProfile } from "@/lib/savia-api";
import { SAVIA_BETA } from "@/lib/beta";
import { localToday } from "@/lib/savia-local";
import { getSelectedDay, setSelectedDay } from "@/lib/selected-day";
import { useI18n } from "@/lib/i18n";
import { isCycling, markForDate, periodDaysFromLogs, formatDay, weightedCycle, cycleDay, phaseForDay } from "@/lib/cycle";
import type { DailyLog, TodaySnapshot } from "@/lib/types";

export const Route = createFileRoute("/app/calendario")({ component: CalendarTab });

function CalendarTab() {
  const { t, lang } = useI18n();
  const [data, setData] = useState<TodaySnapshot | null>(null);
  const [err, setErr] = useState(false);
  const [sheetDay, setSheetDay] = useState<string | null>(null);
  const [fumDraft, setFumDraft] = useState("");
  const [editingFum, setEditingFum] = useState(false);
  const [savingFum, setSavingFum] = useState(false);

  function reload() {
    if (SAVIA_BETA) {
      setData(localToday());
    }
    return loadToday()
      .then((snap) => setData(snap))
      .catch(() => {
        if (!SAVIA_BETA) setErr(true);
      });
  }

  useEffect(() => {
    let alive = true;
    if (SAVIA_BETA) {
      const local = localToday();
      if (alive) setData(local);
    }
    loadToday()
      .then((snap) => {
        if (alive) setData(snap);
      })
      .catch(() => {
        if (alive && !SAVIA_BETA) setErr(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  // Toast / registro handoff: open day sheet once for the selected ISO day.
  useEffect(() => {
    const focus = getSelectedDay();
    if (focus) setSheetDay(focus);
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

  async function saveLastPeriod() {
    if (!data || !fumDraft) return;
    setSavingFum(true);
    try {
      const p = data.profile;
      const res = await writeProfile({
        displayName: p.displayName,
        stage: p.stage,
        birthYear: p.birthYear,
        cycleLength: p.cycleLength,
        periodLength: p.periodLength,
        lastPeriodStart: fumDraft,
        dueDate: p.dueDate,
        lastPeriodYear: p.lastPeriodYear,
        onboardingDone: true,
        locale: p.locale || lang,
        intention: p.intention,
        country: p.country,
      });
      if (!res.ok) {
        toast.error(t.errorGeneric);
        return;
      }
      setEditingFum(false);
      setFumDraft("");
      await reload();
    } catch {
      toast.error(t.errorGeneric);
    } finally {
      setSavingFum(false);
    }
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

  const wrapUpPaid = data.profile.plan === "serena" || data.profile.plan === "year";
  const learned = weightedCycle(data.periodStarts, data.profile.cycleLength);
  const sheetLog = sheetDay ? (data.recentLogs.find((l) => l.day === sheetDay) ?? null) : null;
  const cycling = isCycling(data.profile.stage);
  const needsFum = cycling && !data.profile.lastPeriodStart;
  const showFumForm = needsFum || editingFum;

  return (
    <div>
      <PageTitle title={t.navCal} />
      <div className="mt-4 rounded-[1.6rem] bg-surface p-4 shadow-card">
        {cycling ? (
          <>
            {showFumForm ? (
              <div className="mb-4 rounded-[1.4rem] bg-primary/12 p-4 ring-1 ring-primary/20">
                <p className="font-display text-xl font-semibold tracking-[-0.03em]">
                  {needsFum ? t.needLastPeriod : t.calChangeLastPeriod}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-muted">{t.calLastPeriodHint}</p>
                <p className="mt-3 text-sm font-semibold">{t.calSetLastPeriod}</p>
                <input
                  type="date"
                  value={fumDraft}
                  onChange={(e) => setFumDraft(e.target.value)}
                  className="mt-2 min-h-12 w-full rounded-[1.25rem] bg-surface px-4 text-base font-semibold shadow-card outline-none"
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    className="min-h-12 flex-1 rounded-full bg-grad text-primary-fg"
                    disabled={!fumDraft || savingFum}
                    onClick={() => void saveLastPeriod()}
                  >
                    {t.calSaveLastPeriod}
                  </Button>
                  {editingFum && !needsFum ? (
                    <Button
                      variant="ghost"
                      className="min-h-12 rounded-full"
                      type="button"
                      onClick={() => {
                        setEditingFum(false);
                        setFumDraft("");
                      }}
                    >
                      {t.back}
                    </Button>
                  ) : null}
                </div>
                {needsFum ? (
                  <p className="mt-3 text-xs text-muted">{t.calEmpty}</p>
                ) : null}
              </div>
            ) : null}

            {!needsFum ? (
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
                  showFertile
                  focusDay={sheetDay}
                  onSelect={(iso) => {
                    setSelectedDay(iso);
                    setSheetDay(iso);
                  }}
                  onMonthChange={() => setSheetDay(null)}
                />
                <div className="mt-4 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    className="text-sm font-semibold text-primary"
                    onClick={() => {
                      setEditingFum(true);
                      setFumDraft(data.profile.lastPeriodStart ?? "");
                    }}
                  >
                    {t.calChangeLastPeriod}
                  </button>
                </div>
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
            ) : null}
          </>
        ) : (
          <p className="text-sm leading-relaxed text-muted">{t.calNote}</p>
        )}
      </div>
      {sheetDay && !needsFum ? (
        <DaySheet
          day={sheetDay}
          log={sheetLog}
          wrapUpPaid={wrapUpPaid}
          dayMark={markForDate(sheetDay, {
            lastStart: data.profile.lastPeriodStart,
            cycleLength: learned,
            periodLength: data.profile.periodLength,
            periodStarts: data.periodStarts,
            periodDays: periodDaysFromLogs(data.recentLogs),
          })}
          phase={phaseForDay(
            cycleDay(data.profile.lastPeriodStart, learned, sheetDay),
            data.profile.periodLength,
            learned,
          )}
          intention={data.profile.intention}
          onClose={() => {
            setSheetDay(null);
          }}
          onSaved={(log) => applyLog(log)}
        />
      ) : null}
    </div>
  );
}
