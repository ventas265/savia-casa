import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { differenceInCalendarDays } from "date-fns";
import {
  addDaysISO,
  CYCLE_CHOICES,
  formatDay,
  dayInfo,
  daysUntil,
  formatLong,
  fromISO,
  isCycling,
  markForDate,
  periodDaysFromLogs,
  predictPeriod,
  predictionLabel,
  todayISO,
} from "@/lib/cycle";
import { useClientTodayISO } from "@/lib/use-today";
import type { DailyLog, Intention, Phase, Stage, TodaySnapshot } from "@/lib/types";
import { RegisterPeriodSheet } from "@/components/register-period-sheet";
import { cn } from "@/lib/utils";
import { Activity, ArrowRight, Bell, Droplet } from "lucide-react";
import { SegmentRing } from "@/components/cycle-ring";
import { DailyNoteCard, useLocalHour } from "@/components/daily-note-card";
import { PushSoftPrompt } from "@/components/push-reminders";
import { companionName } from "@/lib/companion-messages";
import { InsightsCompact } from "@/components/insights-card";
import { buildNoteContext } from "@/lib/daily-note";
import { computeInsights } from "@/lib/insights";
import { toneFor } from "@/lib/savia-tone";
import { phaseName, phases, pick } from "@/lib/savia-content";
import { haptic } from "@/lib/haptic";
import { maybeNotify, periodAlert } from "@/lib/notify";
import { armReminders, remindPlan } from "@/lib/reminders";

export function TodayHero({
  stage,
  phase,
  nextPeriod,
  cycleLength = 28,
  cycleDay = null,
  lastStart = null,
  periodLength = 5,
  periodStarts = [],
  name,
  onCal,
  onLog,
  onGuia,
  onAsk,
  onCameToday,
  onPeriodChange,
  onCycleChange,
  onSymptoms,
  notify = false,
  showFertile = true,
  log = null,
  onLogSaved,
  wrapUpPaid = false,
  intention = null,
  sexMarks = [],
  recentLogs = [],
}: {
  stage: Stage;
  phase: Phase;
  nextPeriod?: string | null;
  cycleLength?: number;
  cycleDay?: number | null;
  lastStart?: string | null;
  periodLength?: number;
  periodStarts?: string[];
  name?: string;
  onCal: () => void;
  onLog: () => void;
  onGuia: () => void;
  onAsk: () => void;
  onCameToday?: () => void | Promise<unknown>;
  /** After registering / undoing a period from the sheet. */
  onPeriodChange?: (snap: TodaySnapshot) => void;
  onCycleChange?: (n: number) => void;
  /** Opens the symptom sheet. */
  onSymptoms?: () => void;
  notify?: boolean;
  showFertile?: boolean;
  log?: DailyLog | null;
  onLogSaved?: () => void;
  /** Soft Serena hint only when not on serena/year. */
  wrapUpPaid?: boolean;
  intention?: Intention | null;
  /** Logged sex days (any cycle) — hearts on the ring for this cycle. */
  sexMarks?: { day: string; kind: string }[];
  /** Recent logs — daily note context + on-device insights. */
  recentLogs?: DailyLog[];
}) {
  const { t, lang } = useI18n();
  const [adjust, setAdjust] = useState(false);
  const hour = useLocalHour();
  const today = useClientTodayISO() ?? todayISO();
  const pred = predictPeriod(lastStart, periodStarts, cycleLength, stage);
  const next = pred.next ?? nextPeriod ?? null;
  const left = daysUntil(next, today);
  const allLogs = log ? [log, ...recentLogs.filter((l) => l.day !== log.day)] : recentLogs;
  const markOpts = {
    lastStart: lastStart ?? null,
    cycleLength: pred.len,
    periodLength,
    periodStarts,
    periodDays: periodDaysFromLogs(allLogs),
    today,
  };
  // One answer for day / phase / period (same as calendar): menstruation only with data.
  const info = dayInfo(today, markOpts);
  const onPeriod = info.confirmed;
  const dayNum = info.cycleDay ?? cycleDay;
  const livePhase: Phase = isCycling(stage) && lastStart ? info.phase : phase;
  void showFertile;
  const fertile = livePhase === "ovulatory";
  // From the start of the predicted range on (or late), ask instead of assuming.
  const inWindow = !onPeriod && Boolean(pred.from && today >= pred.from);
  const [askDismissed, setAskDismissed] = useState(false);
  const [regOpen, setRegOpen] = useState(false);
  useEffect(() => {
    try {
      setAskDismissed(localStorage.getItem(`savia.periodAsk.${today}`) === "no");
    } catch {
      /* private mode */
    }
  }, [today]);
  const asking = inWindow && !askDismissed && isCycling(stage) && Boolean(lastStart);
  const lateDays = next && today > next ? daysUntil(today, next) ?? 0 : 0;
  const kind = periodAlert(left, onPeriod, livePhase, inWindow);

  const heroTitle = (() => {
    if (onPeriod && dayNum != null) {
      return t.heroDayMenstrual.replace("{n}", String(dayNum));
    }
    if (onPeriod) return t.periodToday;
    if (inWindow || left === 0) return t.periodComesToday;
    if (left != null && left > 0) {
      return left === 1 ? t.periodInOneDay : t.periodInDays.replace("{n}", String(left));
    }
    if (dayNum != null) return t.heroDayCycle.replace("{n}", String(dayNum));
    return t.periodComesToday;
  })();

  const notifyTitle =
    kind === "period"
      ? t.periodToday
      : kind === "today"
        ? t.periodComesToday
        : kind === "tomorrow"
          ? t.periodComesTomorrow
          : kind === "soon"
            ? t.periodComesSoon
            : kind === "late"
              ? t.periodLate
              : fertile
                ? t.fertileToday
                : kind === "pms"
                  ? t.notifyPms
                  : "";
  const notifyBody =
    kind === "period"
      ? t.notifyBodyPeriod
      : kind === "today"
        ? t.notifyBodyToday
        : kind === "tomorrow"
          ? t.notifyBodyTomorrow
          : kind === "soon"
            ? t.notifyBodySoon
            : kind === "late"
              ? t.notifyBodyLate
              : kind === "pms"
                ? t.notifyBodyPms
                : t.notifyBodyFertile;

  useEffect(() => {
    if (!notify) return;
    maybeNotify({ kind: kind ?? (fertile ? "fertile" : null), fertile, title: notifyTitle, body: notifyBody });
    void armReminders(
      remindPlan({
        nextPeriod: next,
        onPeriod,
        kind,
        titles: {
          period: { title: t.periodToday, body: t.notifyBodyPeriod },
          today: { title: t.periodComesToday, body: t.notifyBodyToday },
          tomorrow: { title: t.periodComesTomorrow, body: t.notifyBodyTomorrow },
          soon: { title: t.periodComesSoon, body: t.notifyBodySoon },
          pms: { title: t.notifyPms, body: t.notifyBodyPms },
        },
      }),
    );
  }, [notify, kind, fertile, notifyTitle, notifyBody, next, onPeriod, t]);

  function openRegister() {
    if (onPeriod) {
      onLog();
      return;
    }
    setRegOpen(true);
  }

  const headerName = companionName(name);
  const initial = headerName.charAt(0).toUpperCase() || "S";
  const cycling = isCycling(stage) && Boolean(lastStart);
  const todayMark = cycling ? info.mark : null;
  const fertHot = todayMark === "fertile" || todayMark === "peak";
  const meterOn = todayMark === "peak" ? 5 : todayMark === "fertile" ? 4 : onPeriod ? 1 : 2;
  const fertTitle =
    todayMark === "peak" ? t.fertChancePeak : todayMark === "fertile" ? t.fertChanceHigh : t.fertChanceLow;
  const fertBody = fertHot
    ? intention === "ttc"
      ? t.fertileTry
      : t.fertBodyAvoid
    : t.daySheetChanceLowSex;
  const nextShort = next ? formatDay(next, lang) : null;
  const tone = toneFor(cycling ? livePhase : "none", todayMark, cycling && onPeriod);
  const noteCtx = buildNoteContext({
    today,
    phase: cycling ? livePhase : "none",
    cycleDay: cycling ? dayNum : null,
    mark: todayMark,
    onPeriod: cycling && onPeriod,
    nextPeriod: cycling ? next : null,
    intention: intention ?? "track",
    logs: log ? [log, ...recentLogs.filter((l) => l.day !== log.day)] : recentLogs,
    markFor: (iso) => (cycling ? markForDate(iso, markOpts) : null),
  });
  const insights = computeInsights({
    starts: periodStarts,
    logs: recentLogs,
    periodLength,
    cycleLength,
    today,
  });
  const ringSex =
    cycling && dayNum != null
      ? (() => {
          const start = addDaysISO(today, -(dayNum - 1));
          return sexMarks
            .filter((m) => m.day >= start && m.day <= today)
            .map((m) => ({ n: differenceInCalendarDays(fromISO(m.day), fromISO(start)) + 1, kind: m.kind }));
        })()
      : [];

  const phaseLabel = livePhase !== "none" ? pick(phaseName[livePhase], lang) : "";
  const countdown =
    onPeriod || left == null
      ? null
      : left > 1
        ? t.ringNextIn.replace("{n}", String(left))
        : left === 1
          ? t.ringNextInOne
          : null;

  const predLine = cycling ? predictionLabel(pred, lang) : "";
  const tipBody = livePhase !== "none" ? pick(phases[livePhase].do, lang) : "";
  const chipTone = onPeriod ? "period" : fertHot ? "fertile" : "rest";

  return (
    <div className="relative pb-4" data-testid="hoy">
      <header className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            aria-hidden
            className="size-9 shrink-0 rounded-full p-[1.5px]"
            style={{ background: "conic-gradient(from 200deg,#f2427e,#b65cff,#9b5cff,#f2427e)" }}
          >
            <span className="grid size-full place-items-center rounded-full bg-[#1b131e] text-[14px] font-semibold">
              {initial}
            </span>
          </span>
          <div className="min-w-0">
            <p className="kicker !text-label">{t.today}</p>
            <p className="truncate font-display text-[15px] font-medium tracking-[-0.01em] first-letter:uppercase">
              {formatLong(today, lang)}
            </p>
          </div>
        </div>
        <Link
          to="/app/tu"
          hash="recordatorios"
          aria-label={t.hoyBellAria}
          className="press glass grid size-11 shrink-0 place-items-center rounded-full text-fg"
        >
          <Bell className="size-[18px]" strokeWidth={1.5} />
        </Link>
      </header>

      <div className="relative mt-1">
        <SegmentRing
          cycleLength={pred.len}
          periodLength={periodLength}
          cycleDay={cycling ? dayNum : null}
          sizeClass="size-[14.5rem]"
          label={asking ? t.ringAskTitle : dayNum != null ? t.ringDayPhase.replace("{n}", String(dayNum)).replace("{phase}", phaseLabel) : heroTitle}
          onClick={onCal}
          sexDays={ringSex}
          decorative={asking}
        >
          {asking ? (
            <span className="flex flex-col items-center" data-testid="ring-ask">
              <span className="kicker !text-label">
                {lateDays > 0
                  ? lateDays === 1
                    ? t.ringLateOne
                    : t.ringLate.replace("{n}", String(lateDays))
                  : t.ringExpected}
              </span>
              <span className="mt-1.5 max-w-[10rem] font-display text-[1.6rem] font-semibold leading-[1.05] tracking-[-0.04em] text-fg">
                {t.ringAskTitle}
              </span>
              {dayNum != null ? (
                <span className="mt-1 text-[12.5px] text-muted">
                  {t.ringDayPhase.replace("{n}", String(dayNum)).replace("{phase}", phaseLabel)}
                </span>
              ) : null}
            </span>
          ) : dayNum != null && cycling ? (
            <span className="flex flex-col items-center" data-testid="ring-day">
              <span
                data-testid="fert-chip"
                data-tone={chipTone}
                className={cn(
                  "whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                  chipTone === "period" && "bg-[rgb(255_77_132/0.2)] text-[#ffc4df]",
                  chipTone === "fertile" && "bg-[rgb(201_162_255/0.2)] text-[#e6d6ff]",
                  chipTone === "rest" && "bg-[rgb(168_197_160/0.16)] text-[#d6e6d0]",
                )}
              >
                {onPeriod ? t.chipPeriod : todayMark === "peak" ? t.chipPeak : todayMark === "fertile" ? t.chipFertile : t.chipLow}
              </span>
              <span
                className="mt-1 font-display text-[3.4rem] font-semibold leading-[0.95] tracking-[-0.05em] text-transparent"
                style={{ backgroundImage: "linear-gradient(180deg,#fff 30%,#ffc4df 100%)", WebkitBackgroundClip: "text", backgroundClip: "text" }}
              >
                {t.ringDayPhase.replace("{n}", String(dayNum)).split(" · ")[0]}
              </span>
              <span className="mt-0.5 font-display text-[17px] font-semibold tracking-[-0.02em] text-fg" data-testid="ring-phase">
                {phaseLabel}
              </span>
              {countdown ? <span className="mt-0.5 text-[12.5px] text-muted">{countdown}</span> : null}
            </span>
          ) : (
            <span className="font-display text-[1.8rem] font-semibold leading-[1.05] tracking-[-0.04em] text-fg">
              {heroTitle}
            </span>
          )}
        </SegmentRing>
        {asking ? (
          <div className="relative -mt-14 flex justify-center gap-2.5">
            <button
              type="button"
              data-testid="ring-ask-yes"
              onClick={() => {
                haptic(14);
                setRegOpen(true);
              }}
              className="press bg-grad h-11 min-w-24 rounded-full px-5 text-sm font-semibold text-primary-fg"
            >
              {t.ringAskYes}
            </button>
            <button
              type="button"
              data-testid="ring-ask-no"
              onClick={() => {
                haptic(10);
                try {
                  localStorage.setItem(`savia.periodAsk.${today}`, "no");
                } catch {
                  /* private mode */
                }
                setAskDismissed(true);
                toast(t.ringNoThanks);
              }}
              className="press glass h-11 min-w-24 rounded-full px-5 text-sm font-semibold"
            >
              {t.ringAskNo}
            </button>
          </div>
        ) : null}
        {predLine ? (
          <p className="mt-1 text-center text-[12px] leading-snug text-soft" data-testid="pred-line">
            {t.predNextRange}: <span className="font-semibold text-fg">{predLine}</span>
          </p>
        ) : null}
      </div>

      <DailyNoteCard
        ctx={noteCtx}
        day={today}
        tone={tone}
        log={log}
        paid={wrapUpPaid}
        onSaved={onLogSaved}
        name={name}
        compact
      />

      <div className="mt-2 grid grid-cols-2 gap-2">
        <button
          type="button"
          data-testid="register-period-btn"
          onClick={() => {
            haptic(14);
            openRegister();
          }}
          className="press bg-grad flex h-[50px] items-center justify-center gap-2 whitespace-nowrap rounded-[18px] px-3 text-[13.5px] font-semibold text-primary-fg shadow-[0_8px_24px_-8px_rgb(242_66_126/0.6)] disabled:opacity-60"
        >
          <Droplet className="size-4" strokeWidth={1.8} aria-hidden />
          {onPeriod ? t.actBleedDay : t.actBleed}
        </button>
        <button
          type="button"
          data-testid="symptoms-btn"
          onClick={() => {
            haptic(14);
            onSymptoms?.();
          }}
          className="press glass flex h-[50px] items-center justify-center gap-2 whitespace-nowrap rounded-[18px] px-3 text-[13.5px] font-medium text-fg"
        >
          <Activity className="size-4" strokeWidth={1.8} aria-hidden />
          {t.actBody}
        </button>
      </div>

      {tipBody ? (
        <button
          type="button"
          data-testid="hoy-tip"
          onClick={onGuia}
          className={cn(
            "press mt-2 flex w-full items-start gap-3 rounded-[20px] border px-4 py-3 text-left",
            chipTone === "fertile" ? "card-fert" : "glass",
          )}
        >
          <span className="min-w-0 flex-1">
            <span className="kicker block">{t.tipsToday} · {phaseLabel}</span>
            <span className="mt-1 text-[13px] leading-snug text-fg/90 line-clamp-2">{tipBody}</span>
          </span>
          <ArrowRight className="mt-4 size-4 shrink-0 text-muted" strokeWidth={1.8} aria-hidden />
        </button>
      ) : null}

      {/* Below the fold: compact extras */}
      <div className="mt-6 space-y-2">
        <PushSoftPrompt />
        {cycling ? <InsightsCompact result={insights} paid={wrapUpPaid} /> : null}
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 pt-1">
          <button type="button" onClick={onLog} className="inline-flex min-h-11 items-center text-[13px] font-semibold text-rose-dust">
            {t.hoyFullDay}
          </button>
          {onCycleChange ? (
            <button
              type="button"
              onClick={() => setAdjust((v) => !v)}
              className="inline-flex min-h-11 items-center text-[13px] font-semibold text-muted"
            >
              {adjust ? t.hideAdjust : t.adjustCycle}
            </button>
          ) : null}
        </div>
        {onCycleChange && adjust ? (
          <div className="glass rounded-[22px] p-3">
            <p className="kicker px-1">{t.adjustCycle}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {CYCLE_CHOICES.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => onCycleChange(n)}
                  className={cn(
                    "h-11 min-w-11 rounded-full px-2 text-sm font-semibold",
                    cycleLength === n ? "bg-grad text-primary-fg" : "bg-white/5 text-fg ring-1 ring-white/10",
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        ) : null}
        <p className="px-2 text-center text-[11px] leading-snug text-muted" data-testid="contra-notice">
          {t.notContraOnce}
        </p>
      </div>
      {regOpen ? (
        <RegisterPeriodSheet
          lastStart={lastStart ?? null}
          starts={periodStarts}
          onClose={() => setRegOpen(false)}
          onChange={(snap) => onPeriodChange?.(snap)}
        />
      ) : null}
    </div>
  );
}
