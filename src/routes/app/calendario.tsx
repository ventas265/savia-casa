import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { CycleCalendar } from "@/components/cycle-calendar";
import { DaySheet } from "@/components/day-sheet";
import { correctLastPeriod, loadToday, writeProfile } from "@/lib/savia-api";
import { BottomSheet } from "@/components/bottom-sheet";
import { SAVIA_BETA } from "@/lib/beta";
import { localToday } from "@/lib/savia-local";
import { getSelectedDay, setSelectedDay } from "@/lib/selected-day";
import { useI18n } from "@/lib/i18n";
import {
  addDaysISO,
  todayISO,
  dayInfo,
  isCycling,
  periodDaysFromLogs,
  formatDay,
  formatLong,
  formatRange,
  predictPeriod,
  predictionLabel,
  upcomingFertile,
} from "@/lib/cycle";
import { fill, useV4 } from "@/lib/i18n-v4";
import { SEASONS } from "@/lib/v4-content";
import { pick, symptomLabel } from "@/lib/savia-content";
import type { DailyLog, TodaySnapshot } from "@/lib/types";

export const Route = createFileRoute("/app/calendario")({ component: CalendarTab });

function CalendarTab() {
  const { t, lang } = useI18n();
  const { v } = useV4();
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

  // «Ver todo» from Hoy lands on the insights section once data is painted.
  useEffect(() => {
    if (!data || typeof window === "undefined" || window.location.hash !== "#aprendio") return;
    const id = window.setTimeout(() => document.getElementById("aprendio")?.scrollIntoView({ block: "start" }), 120);
    return () => window.clearTimeout(id);
  }, [data]);

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
      if (p.lastPeriodStart && SAVIA_BETA) {
        // Correction: move the latest start, keep older history, clean the old start's log.
        const snap = await correctLastPeriod(fumDraft);
        setData(snap);
        setEditingFum(false);
        setFumDraft("");
        toast.success(t.regSaved.replace("{date}", formatLong(fumDraft, lang)));
        return;
      }
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
  const learned = predictPeriod(data.profile.lastPeriodStart, data.periodStarts, data.profile.cycleLength, data.profile.stage).len;
  const periodDays = periodDaysFromLogs(data.recentLogs);
  const sheetInfo = sheetDay
    ? dayInfo(sheetDay, {
        lastStart: data.profile.lastPeriodStart,
        cycleLength: learned,
        periodLength: data.profile.periodLength,
        periodStarts: data.periodStarts,
        periodDays,
        today: todayISO(),
      })
    : null;
  const sheetLog = sheetDay ? (data.recentLogs.find((l) => l.day === sheetDay) ?? null) : null;
  const cycling = isCycling(data.profile.stage);
  const needsFum = cycling && !data.profile.lastPeriodStart;
  const showFumForm = needsFum;

  const todayIso = todayISO();
  const pred = predictPeriod(data.profile.lastPeriodStart, data.periodStarts, data.profile.cycleLength, data.profile.stage);
  const markOpts = {
    lastStart: data.profile.lastPeriodStart,
    cycleLength: learned,
    periodLength: data.profile.periodLength,
    periodStarts: data.periodStarts,
    periodDays,
    today: todayIso,
  };
  const todayInfo = dayInfo(todayIso, markOpts);
  const fert = upcomingFertile(markOpts, addDaysISO(todayIso, -(todayInfo.cycleDay ?? 1) + 1));
  const fertState = fert ? (fert.end < todayIso ? v.fertilePast : fert.start <= todayIso ? v.fertileNow : v.fertileNext) : "";
  const todayLog = data.recentLogs.find((l) => l.day === todayIso) ?? null;
  const season = todayInfo.phase !== "none" ? SEASONS[todayInfo.phase] : null;
  const todaySyms = todayLog
    ? todayLog.symptoms.map((id) => pick(symptomLabel[id] ?? { es: id, en: id }, lang).toLowerCase())
    : [];
  const todaySummary = todaySyms.length
    ? todaySyms.slice(0, 3).join(", ").replace(/^./, (c) => c.toUpperCase())
    : v.nothingLogged;

  return (
    <div>
      {cycling ? (
        <>
          {showFumForm ? (
            <div className="v4-card mb-4 mt-2 p-4">
              <p className="v4-h2 !text-[24px]">{needsFum ? t.needLastPeriod : t.calChangeLastPeriod}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted">{t.calLastPeriodHint}</p>
              <p className="mt-3 text-sm font-semibold">{t.calSetLastPeriod}</p>
              <input
                type="date"
                value={fumDraft}
                onChange={(e) => setFumDraft(e.target.value)}
                className="mt-2 min-h-12 w-full rounded-[18px] border border-line bg-bg px-4 text-base font-semibold outline-none"
              />
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="v4-cta flex-1"
                  disabled={!fumDraft || savingFum}
                  onClick={() => void saveLastPeriod()}
                >
                  {t.calSaveLastPeriod}
                </button>
              </div>
              {needsFum ? <p className="mt-3 text-xs text-muted">{t.calEmpty}</p> : null}
            </div>
          ) : null}

          {!needsFum ? (
            <>
              <CycleCalendar
                lastStart={data.profile.lastPeriodStart}
                cycleLength={learned}
                periodLength={data.profile.periodLength}
                periodStarts={data.periodStarts}
                periodDays={periodDays}
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
              <div className="v4-sum" data-testid="cal-summary">
                <div data-testid="pred-card">
                  <small>{v.nextPeriod}</small>
                  <b>{pred.next ? formatDay(pred.next, lang).replace(/\.$/, "") : "—"}</b>
                  <span title={predictionLabel(pred, lang)}>{pred.next ? `±${pred.pad} ${lang === "es" ? "días" : "days"}` : ""}</span>
                </div>
                <div data-testid="fert-card">
                  <small>{v.fertileWin}</small>
                  <b>{fert ? formatRange(fert.start, fert.end, lang) : "—"}</b>
                  <span>{fertState}</span>
                </div>
                <div>
                  <small>{v.yourCycle}</small>
                  <b>{fill(v.cycleDays, { n: learned })}</b>
                  <span>{pred.n >= 2 ? (pred.irregular ? v.irregular : v.regular) : v.learning}</span>
                </div>
              </div>
              <button
                type="button"
                className="v4-dcard"
                data-testid="cal-today-card"
                onClick={() => {
                  setSelectedDay(todayIso);
                  setSheetDay(todayIso);
                }}
              >
                <img src={(season ?? SEASONS.follicular).thumb} alt="" width={64} height={64} />
                <span className="flex min-w-0 flex-1 flex-col gap-[5px]">
                  <span className="text-[13px] font-semibold leading-tight text-muted">
                    {todayInfo.cycleDay ? fill(v.todayDay, { n: todayInfo.cycleDay }) : t.calStatusToday}
                    {season ? ` · ${pick(season.short, lang)}` : ""}
                  </span>
                  <span className="text-[15px] font-semibold leading-tight">{todaySummary}</span>
                  <span className="text-[13px] font-medium leading-tight text-muted">{v.tapToEdit}</span>
                </span>
                <span className="v4-edit">{v.edit}</span>
              </button>
              <p className="mt-3 px-2 text-[12px] leading-snug text-muted" data-testid="cal-contra">
                {v.notContra} {predictionLabel(pred, lang) ? `${t.predNextRange}: ${predictionLabel(pred, lang)}.` : ""}
              </p>
              <div className="mt-1 flex flex-wrap items-center justify-between gap-x-3 px-2">
                <button
                  type="button"
                  data-testid="change-last-period"
                  className="inline-flex min-h-11 items-center text-sm font-semibold text-accent"
                  onClick={() => {
                    setEditingFum(true);
                    setFumDraft(data.profile.lastPeriodStart ?? "");
                  }}
                >
                  {t.calChangeLastPeriod}
                </button>
                <Link
                  to="/app/sexo"
                  data-testid="cal-sexo"
                  className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-ink-2"
                >
                  {t.tuSexGuide}
                  <ChevronRight className="size-4" aria-hidden />
                </Link>
              </div>
              {data.periodStarts.length ? (
                <details className="v4-card mt-3 px-4 py-1">
                  <summary className="flex min-h-11 cursor-pointer items-center text-sm font-semibold">{t.history}</summary>
                  <ul className="space-y-1.5 pb-3">
                    {[...data.periodStarts]
                      .sort((a, b) => b.localeCompare(a))
                      .slice(0, 8)
                      .map((d) => (
                        <li key={d} className="flex justify-between text-sm">
                          <span>{formatDay(d, lang)}</span>
                          <span className="size-2.5 self-center rounded-full bg-regla" />
                        </li>
                      ))}
                  </ul>
                </details>
              ) : null}
            </>
          ) : null}
        </>
      ) : (
        <div className="px-2 pt-2.5">
          <h1 className="v4-h1">{t.navCal}</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">{t.calNote}</p>
        </div>
      )}
      {editingFum && !needsFum ? (
        <BottomSheet
          title={t.lastPeriodSheetTitle}
          onClose={() => {
            setEditingFum(false);
            setFumDraft("");
          }}
          testId="last-period-sheet"
          labelledBy="last-period-title"
        >
          <p className="text-sm leading-relaxed text-muted">{t.lastPeriodSheetSub}</p>
          <label htmlFor="fum-edit" className="mt-4 block text-sm font-semibold">
            {t.calSetLastPeriod}
          </label>
          <input
            id="fum-edit"
            type="date"
            value={fumDraft}
            max={todayISO()}
            onChange={(e) => setFumDraft(e.target.value)}
            className="mt-2 min-h-14 w-full rounded-[22px] border border-line bg-white px-5 font-display text-xl outline-none"
          />
          <button
            type="button"
            className="v4-cta mt-4"
            disabled={!fumDraft || savingFum}
            onClick={() => void saveLastPeriod()}
          >
            {t.calSaveLastPeriod}
          </button>
        </BottomSheet>
      ) : null}
      {sheetDay && !needsFum ? (
        <DaySheet
          day={sheetDay}
          log={sheetLog}
          wrapUpPaid={wrapUpPaid}
          dayMark={sheetInfo?.mark ?? null}
          confirmedPeriod={sheetInfo?.confirmed ?? false}
          cycleDayNum={sheetInfo?.cycleDay ?? null}
          phase={sheetInfo?.phase ?? "none"}
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
