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
import { Activity, ChevronRight, Coffee, Droplet, Footprints, Heart, Leaf, Lock, Moon, Plus, ShieldCheck, Sun } from "lucide-react";
import { SEASONS, phaseSegments } from "@/lib/v4-content";
import { fill, useV4 } from "@/lib/i18n-v4";
import { DailyNoteCard, useLocalHour } from "@/components/daily-note-card";
import { PushSoftPrompt } from "@/components/push-reminders";
import { companionName } from "@/lib/companion-messages";
import { buildNoteContext } from "@/lib/daily-note";
import { computeInsights } from "@/lib/insights";
import { toneFor } from "@/lib/savia-tone";
import { phaseName, phases, pick } from "@/lib/savia-content";
import { haptic } from "@/lib/haptic";
import { maybeNotify, periodAlert } from "@/lib/notify";
import { armReminders, remindPlan } from "@/lib/reminders";

function longWithWeekday(iso: string, lang: "es" | "en") {
  try {
    return new Intl.DateTimeFormat(lang === "es" ? "es" : "en", { weekday: "long", day: "numeric", month: "long" }).format(fromISO(iso));
  } catch {
    return formatLong(iso, lang);
  }
}

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
  const { v } = useV4();
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
  // Only ONE «no es anticonceptivo» per screen: skip the footnote when the note already says it.
  const [noteSaysContra, setNoteSaysContra] = useState(false);
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

  const phaseLabel = livePhase !== "none" ? pick(phaseName[livePhase], lang) : "";

  const predLine = cycling ? predictionLabel(pred, lang) : "";

  const season = cycling && livePhase !== "none" ? SEASONS[livePhase] : null;
  const segs = cycling ? phaseSegments(pred.len, periodLength) : [];
  const segNow = cycling && dayNum != null ? Math.min(dayNum, segs.length) : 0;
  const firstName = (name ?? "").trim().split(/\s+/)[0] ?? "";
  const nextLine = (() => {
    if (!cycling) return null;
    if (onPeriod && dayNum != null) return <>{fill(v.periodNow, { n: dayNum })}</>;
    if (lateDays > 0) return <>{lateDays === 1 ? v.periodLateOne : fill(v.periodLate, { n: lateDays })}</>;
    if (left === 0 || inWindow) return <>{v.periodTodayMaybe}</>;
    if (left != null && left > 0)
      return (
        <>
          {v.periodIn} <b>{left === 1 ? v.periodInDay : fill(v.periodInDays, { n: left })}</b>
        </>
      );
    return null;
  })();
  const TIP_ICON = { moon: Moon, cup: Coffee, drop: Droplet, walk: Footprints, leaf: Leaf, heart: Heart, sun: Sun, shield: ShieldCheck };

  return (
    <div className="relative pb-4" data-testid="hoy">
      <header className="v4-hd">
        <div className="v4-hd-t">
          <span className="v4-date">{longWithWeekday(today, lang)}</span>
          <b className="truncate">{firstName ? fill(v.hello, { name: firstName }) : v.helloAnon}</b>
        </div>
        <span className="v4-lock" aria-label={v.onlyYouAria}>
          <Lock className="size-[15px]" strokeWidth={1.8} aria-hidden />
          {v.onlyYou}
        </span>
        <Link to="/app/tu" aria-label={v.profileAria} className="v4-meav" data-testid="hoy-avatar">
          {initial}
        </Link>
      </header>

      <div className="v4-hero" data-testid="hoy-hero" data-phase={season?.key ?? "none"}>
        <button type="button" onClick={onCal} aria-label={v.heroAria} className="absolute inset-0 z-0">
          <img
            key={season?.photo ?? "none"}
            src={season?.photo ?? SEASONS.follicular.photo}
            alt={season ? pick(season.alt, lang) : ""}
            width={800}
            height={860}
            decoding="async"
            fetchPriority="high"
          />
        </button>
        {season ? <span className="v4-season pointer-events-none">{pick(season.seasonOf, lang)}</span> : null}
        <div className="v4-glass pointer-events-none">
          {asking ? (
            <div data-testid="ring-ask" className="pointer-events-auto">
              <p className={cn("v4-ph-n v4-ph-ink", season?.key)}>
                <i className={cn("v4-pdot", season?.key)} aria-hidden />
                {lateDays > 0
                  ? lateDays === 1
                    ? t.ringLateOne
                    : t.ringLate.replace("{n}", String(lateDays))
                  : t.ringExpected}
              </p>
              <p className="mt-2 font-display text-[32px] leading-[1.05] tracking-[-0.01em]">{t.ringAskTitle}</p>
              {dayNum != null ? (
                <p className="v4-nxt mt-1">{fill(v.dayN, { n: dayNum })}</p>
              ) : null}
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  data-testid="ring-ask-yes"
                  onClick={() => {
                    haptic(14);
                    setRegOpen(true);
                  }}
                  className="press h-11 min-w-24 rounded-full bg-accent px-5 text-sm font-semibold text-white"
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
                  className="press h-11 min-w-24 rounded-full bg-white px-5 text-sm font-semibold text-ink ring-1 ring-line"
                >
                  {t.ringAskNo}
                </button>
              </div>
            </div>
          ) : dayNum != null && cycling ? (
            <div data-testid="ring-day">
              <p className={cn("v4-ph-n v4-ph-ink", season?.key)} data-testid="ring-phase">
                <i className={cn("v4-pdot", season?.key)} aria-hidden />
                {season ? pick(season.label, lang) : phaseLabel}
              </p>
              <p className="v4-big" aria-label={`${v.day} ${dayNum}`}>
                <span className="v4-bd">{v.day}</span>
                {dayNum}
              </p>
              {nextLine ? (
                <p className="v4-nxt" data-testid="hoy-next">
                  {nextLine}
                </p>
              ) : null}
              <div className="v4-cdots" aria-hidden>
                {segs.map((p, i) => (
                  <i
                    key={i}
                    className={cn("v4-cd", `v4-bg-${SEASONS[p].key}`, i + 1 < segNow && "past", i + 1 === segNow && "now")}
                    style={{ animationDelay: `${i * 12}ms` }}
                  />
                ))}
              </div>
            </div>
          ) : (
            <p className="font-display text-[30px] leading-[1.1]">{heroTitle}</p>
          )}
        </div>
      </div>

      <p className="v4-line" data-testid="hoy-line">
        {season ? pick(season.line, lang) : v.noCycleLine}
      </p>
      {season ? (
        <Link to="/app/estaciones" className="v4-why" data-testid="why-link">
          {v.whyLink}
          <ChevronRight className="size-4" strokeWidth={2} aria-hidden />
        </Link>
      ) : null}
      {season ? (
        <div className="v4-todo" aria-label={v.forToday} role="list">
          {season.tips.map((tip) => {
            const Icon = TIP_ICON[tip.icon];
            return (
              <span key={tip.icon} role="listitem" className={cn("v4-chip", season.key)} data-testid="hoy-tip">
                <Icon className="size-[18px]" strokeWidth={1.8} aria-hidden />
                {pick(tip.text, lang)}
              </span>
            );
          })}
        </div>
      ) : null}
      <div className="px-2 pt-5">
        <button
          type="button"
          className="v4-cta"
          data-testid="hoy-log"
          onClick={() => {
            haptic(14);
            onLog();
          }}
        >
          <Plus className="size-5" strokeWidth={2.2} aria-hidden />
          {log && (log.symptoms.length || log.mood != null || (log.flow && log.flow !== "none")) ? v.logDayDone : v.logDay}
        </button>
      </div>

      {/* Below the fold: period + cycle tools, Savia's note of the day, reminders */}
      <div className="mt-6 space-y-3 px-2">
        <div className="flex flex-wrap justify-center gap-x-5 gap-y-1">
          {cycling || isCycling(stage) ? (
            <button
              type="button"
              data-testid="register-period-btn"
              onClick={() => {
                haptic(14);
                openRegister();
              }}
              className="inline-flex min-h-11 items-center gap-1.5 text-[14px] font-semibold text-accent"
            >
              <Droplet className="size-4" strokeWidth={1.8} aria-hidden />
              {onPeriod ? t.actBleedDay : t.actBleed}
            </button>
          ) : null}
          <button
            type="button"
            data-testid="symptoms-btn"
            onClick={() => {
              haptic(14);
              onSymptoms?.();
            }}
            className="inline-flex min-h-11 items-center gap-1.5 text-[14px] font-semibold text-ink-2"
          >
            <Activity className="size-4" strokeWidth={1.8} aria-hidden />
            {t.actBody}
          </button>
          {onCycleChange ? (
            <button
              type="button"
              onClick={() => setAdjust((x) => !x)}
              className="inline-flex min-h-11 items-center text-[14px] font-semibold text-muted"
            >
              {adjust ? t.hideAdjust : t.adjustCycle}
            </button>
          ) : null}
        </div>
        {onCycleChange && adjust ? (
          <div className="v4-card p-3">
            <p className="kicker px-1">{t.adjustCycle}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {CYCLE_CHOICES.map((n) => (
                <button
                  key={n}
                  type="button"
                  aria-pressed={cycleLength === n}
                  onClick={() => onCycleChange(n)}
                  className={cn(
                    "h-11 min-w-11 rounded-full px-2 text-sm font-semibold",
                    cycleLength === n ? "bg-ink text-white" : "bg-sand text-ink",
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        ) : null}
        {predLine ? (
          <p className="text-center text-[12.5px] leading-snug text-muted" data-testid="pred-line">
            {t.predNextRange}: <span className="font-semibold text-ink">{predLine}</span>
          </p>
        ) : null}
        <DailyNoteCard
          ctx={noteCtx}
          day={today}
          tone={tone}
          log={log}
          paid={wrapUpPaid}
          onSaved={onLogSaved}
          name={name}
          compact
          onNoteText={(txt) => setNoteSaysContra(/anticonceptiv|birth control|contracepti/i.test(txt))}
        />
        <PushSoftPrompt />
        {noteSaysContra ? null : (
          <p className="px-2 text-center text-[12px] leading-snug text-muted" data-testid="contra-notice">
            {t.notContraOnce}
          </p>
        )}
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
