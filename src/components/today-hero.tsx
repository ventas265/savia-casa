import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { differenceInCalendarDays } from "date-fns";
import {
  addDaysISO,
  CYCLE_CHOICES,
  daysUntil,
  formatDay,
  formatLong,
  fromISO,
  inDayRange,
  isConfirmedPeriodDay,
  isCycling,
  markForDate,
  predictPeriod,
  todayISO,
} from "@/lib/cycle";
import { useClientTodayISO } from "@/lib/use-today";
import type { DailyLog, Intention, Phase, Stage } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Activity, ArrowRight, ArrowUpRight, Bell, Droplet } from "lucide-react";
import { SegmentRing } from "@/components/cycle-ring";
import { SaviaOrb } from "@/components/savia-orb";
import { DailyNoteCard } from "@/components/daily-note-card";
import { InsightsCompact } from "@/components/insights-card";
import { buildNoteContext } from "@/lib/daily-note";
import { computeInsights } from "@/lib/insights";
import { toneFor, type SaviaTone } from "@/lib/savia-tone";
import { phaseName, pick } from "@/lib/savia-content";
import { CartaHoy } from "@/components/carta-hoy";
import { ConsejosHoy } from "@/components/consejos-hoy";
import { QuickLog } from "@/components/quick-log";
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
  onCycleChange,
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
  onCycleChange?: (n: number) => void;
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
  const [savingPeriod, setSavingPeriod] = useState(false);
  const today = useClientTodayISO() ?? todayISO();
  const pred = predictPeriod(lastStart, periodStarts, cycleLength, stage);
  const next = pred.next ?? nextPeriod ?? null;
  const left = daysUntil(next);
  // Confirmed bleeding only — Ogino wrap must not look like she already logged period.
  const onPeriod = isConfirmedPeriodDay(today, {
    lastStart: lastStart ?? null,
    periodLength,
    periodStarts,
    log,
  });
  void showFertile;
  const fertile = phase === "ovulatory";
  const estimatedBleed =
    !onPeriod &&
    markForDate(today, {
      lastStart: lastStart ?? null,
      cycleLength,
      periodLength,
      periodStarts,
    }) === "period";
  const inWindow = !onPeriod && (inDayRange(today, pred.from, pred.to) || estimatedBleed);
  const kind = periodAlert(left, onPeriod, phase, inWindow);

  const heroTitle = (() => {
    if (onPeriod && cycleDay != null) {
      return t.heroDayMenstrual.replace("{n}", String(cycleDay));
    }
    if (onPeriod) return t.periodToday;
    if (inWindow || left === 0) return t.periodComesToday;
    if (left != null && left > 0) {
      return left === 1 ? t.periodInOneDay : t.periodInDays.replace("{n}", String(left));
    }
    if (cycleDay != null) return t.heroDayCycle.replace("{n}", String(cycleDay));
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

  async function registerPeriodToday() {
    if (!onCameToday || onPeriod || savingPeriod) {
      if (onPeriod) onLog();
      return;
    }
    setSavingPeriod(true);
    haptic(14);
    try {
      await onCameToday();
      toast.success(t.savedInMonth.replace("{date}", formatDay(today, lang)));
    } finally {
      setSavingPeriod(false);
    }
  }

  const initial = (name || "").trim().charAt(0).toUpperCase() || "S";
  const cycling = isCycling(stage) && Boolean(lastStart);
  const todayMark = cycling
    ? markForDate(today, { lastStart: lastStart ?? null, cycleLength, periodLength, periodStarts })
    : null;
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
  const tone = toneFor(cycling ? phase : "none", todayMark, cycling && onPeriod);
  const noteCtx = buildNoteContext({
    today,
    phase: cycling ? phase : "none",
    cycleDay: cycling ? cycleDay : null,
    mark: todayMark,
    onPeriod: cycling && onPeriod,
    nextPeriod: cycling ? next : null,
    intention: intention ?? "track",
    logs: log ? [log, ...recentLogs.filter((l) => l.day !== log.day)] : recentLogs,
    markFor: (iso) =>
      cycling ? markForDate(iso, { lastStart: lastStart ?? null, cycleLength, periodLength, periodStarts }) : null,
  });
  const insights = computeInsights({
    starts: periodStarts,
    logs: recentLogs,
    periodLength,
    cycleLength,
    today,
  });
  const ringSex =
    cycling && cycleDay != null
      ? (() => {
          const start = addDaysISO(today, -(cycleDay - 1));
          return sexMarks
            .filter((m) => m.day >= start && m.day <= today)
            .map((m) => ({ n: differenceInCalendarDays(fromISO(m.day), fromISO(start)) + 1, kind: m.kind }));
        })()
      : [];

  // Big-number ring center: number when there is one, text otherwise.
  const center = (() => {
    if (onPeriod && cycleDay != null) {
      return { kicker: t.ringOnPeriod, num: String(cycleDay), sub: t.ringOnPeriodSub };
    }
    if (!inWindow && left != null && left > 0) {
      return {
        kicker: t.ringPeriodIn,
        num: String(left),
        sub: left === 1 ? t.ringDay : t.ringDays,
        date: nextShort ? `~${nextShort}` : null,
      };
    }
    if (!inWindow && left != null && left < 0 && cycleDay != null) {
      return { kicker: t.ringCycleDay, num: String(cycleDay), sub: t.ringOfCycle };
    }
    return { kicker: null, num: null, sub: heroTitle };
  })();

  return (
    <div className="relative pb-6">
      <header className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            aria-hidden
            className="size-[2.4rem] shrink-0 rounded-full p-[1.5px]"
            style={{ background: "conic-gradient(from 200deg,#f2427e,#b65cff,#9b5cff,#f2427e)" }}
          >
            <span className="grid size-full place-items-center rounded-full bg-[#1b131e] text-[15px] font-semibold">
              {initial}
            </span>
          </span>
          <div className="min-w-0">
            <p className="truncate font-display text-lg font-medium tracking-[-0.02em]">
              {name ? `${t.goodMorning}, ${name}` : t.goodMorning}
            </p>
            <p className="text-[12.5px] text-muted first-letter:uppercase">{formatLong(today, lang)}</p>
          </div>
        </div>
        <Link
          to="/app/mas"
          aria-label={t.more}
          className="press glass grid size-10 shrink-0 place-items-center rounded-full text-fg"
        >
          <Bell className="size-[18px]" strokeWidth={1.5} />
        </Link>
      </header>

      <div className="mt-3">
        <SegmentRing
          cycleLength={cycleLength}
          periodLength={periodLength}
          cycleDay={cycling ? cycleDay : null}
          label={heroTitle}
          onClick={onCal}
          sexDays={ringSex}
        >
          {center.kicker ? <span className="kicker !text-[#ffb0cc]">{center.kicker}</span> : null}
          {center.num ? (
            <span
              className="mt-2 font-display text-[6.5rem] font-semibold leading-[0.82] tracking-[-0.06em] text-transparent"
              style={{ backgroundImage: "linear-gradient(180deg,#fff 30%,#ffc4df 100%)", WebkitBackgroundClip: "text", backgroundClip: "text" }}
            >
              {center.num}
            </span>
          ) : null}
          {center.num ? (
            <span className="mt-2.5 text-sm text-muted">
              <b className="font-medium text-fg">{center.sub}</b>
              {center.date ? ` · ${center.date}` : null}
            </span>
          ) : (
            <span className="font-display text-[2rem] font-semibold leading-[1.05] tracking-[-0.04em] text-fg">
              {center.sub}
            </span>
          )}
        </SegmentRing>
      </div>

      <DailyNoteCard ctx={noteCtx} day={today} tone={tone} log={log} paid={wrapUpPaid} onSaved={onLogSaved} />

      {cycling ? (
        <div className="mt-2 grid grid-cols-3 gap-2">
          <StatTile label={t.statDay}>
            {cycleDay ?? "–"}
            <small className="text-[13px] font-normal text-muted"> /{cycleLength}</small>
          </StatTile>
          <StatTile label={t.statPhase} small={pick(phaseName[phase], lang).length > 9}>
            {pick(phaseName[phase], lang)}
          </StatTile>
          <StatTile label={t.statCycle} onClick={onCycleChange ? () => setAdjust((v) => !v) : undefined}>
            {cycleLength}
            <small className="text-[13px] font-normal text-muted"> {t.ringDays}</small>
          </StatTile>
        </div>
      ) : null}

      {cycling ? (
        <button
          type="button"
          onClick={onCal}
          className={cn(
            "press mt-2 flex w-full items-center gap-3.5 rounded-[22px] border px-4 py-3.5 text-left",
            fertHot ? "card-fert" : "glass",
          )}
        >
          <span className="flex h-[38px] shrink-0 items-end gap-1" aria-hidden>
            {[12, 19, 26, 32, 38].map((h, i) => (
              <i
                key={h}
                className={cn("w-[7px] rounded-[3px]", i < meterOn
                    ? fertHot
                      ? "bg-[linear-gradient(180deg,#6FE0D2,#3FBDB0)]"
                      : "bg-[linear-gradient(180deg,#B65CFF,#F2427E)]"
                    : "bg-white/15")}
                style={{ height: h }}
              />
            ))}
          </span>
          <span className="min-w-0">
            <span className={cn("kicker block", fertHot && "!text-[#6FE0D2]")}>
              {fertHot ? t.fertKickerOn : t.fertKickerOff}
            </span>
            <span className="mt-0.5 block font-display text-[19px] font-semibold leading-tight tracking-[-0.02em]">
              {fertTitle}
            </span>
            <span className="mt-1 block text-[12.5px] leading-snug text-[#dccbdb]">{fertBody}</span>
          </span>
        </button>
      ) : null}

      <div className="mt-2 grid grid-cols-[1.15fr_1fr] gap-2">
        <button
          type="button"
          disabled={savingPeriod}
          onClick={() => {
            haptic(14);
            void registerPeriodToday();
          }}
          className="press bg-grad flex h-[54px] items-center gap-2.5 whitespace-nowrap rounded-[18px] px-3 text-[13.5px] font-semibold text-primary-fg shadow-[0_8px_24px_-8px_rgb(242_66_126/0.6)] disabled:opacity-60"
        >
          <span className="grid size-[30px] place-items-center rounded-full bg-black/15">
            <Droplet className="size-4" strokeWidth={1.8} />
          </span>
          {t.actBleed}
        </button>
        <button
          type="button"
          onClick={() => {
            haptic(14);
            document.getElementById("anotar")?.scrollIntoView({ behavior: "smooth" });
          }}
          className="press glass flex h-[54px] items-center gap-2.5 whitespace-nowrap rounded-[18px] px-3 text-[13.5px] font-medium text-fg"
        >
          <span className="grid size-[30px] place-items-center rounded-full bg-white/10">
            <Activity className="size-4" strokeWidth={1.8} />
          </span>
          {t.actBody}
        </button>
      </div>

      {cycling ? <InsightsCompact result={insights} paid={wrapUpPaid} /> : null}

      <TalkSaviaCard onAsk={onAsk} wrapUpPaid={wrapUpPaid} tone={tone} />

      {onCycleChange && adjust ? (
        <div className="glass mt-2 rounded-[22px] p-3">
          <p className="kicker px-1">{t.adjustCycle}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {CYCLE_CHOICES.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => onCycleChange(n)}
                className={cn(
                  "h-10 min-w-10 rounded-full px-2 text-sm font-semibold",
                  cycleLength === n ? "bg-grad text-primary-fg" : "bg-white/5 text-fg ring-1 ring-white/10",
                )}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <ConsejosHoy stage={stage} phase={phase} onAsk={onAsk} onGuia={onGuia} />

      <QuickLog initial={log} onSaved={onLogSaved} />

      <CartaHoy name={name} stage={stage} phase={phase} onAsk={onAsk} />

      {onCycleChange ? (
        <div className="relative mt-4 text-center">
          <button
            type="button"
            onClick={() => setAdjust((v) => !v)}
            className="text-xs font-semibold text-muted underline-offset-4 hover:underline"
          >
            {adjust ? t.hideAdjust : t.adjustCycle}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function StatTile({
  label,
  children,
  small,
  onClick,
}: {
  label: string;
  children: ReactNode;
  small?: boolean;
  onClick?: () => void;
}) {
  const body = (
    <>
      <span className="kicker block">{label}</span>
      <span
        className={cn(
          "mt-1.5 block truncate font-display font-medium tracking-[-0.03em]",
          small ? "text-[16px] leading-[1.6rem]" : "text-[21px] leading-[1.6rem]",
        )}
      >
        {children}
      </span>
    </>
  );
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="press glass rounded-[18px] px-3 py-2.5 text-left">
        {body}
      </button>
    );
  }
  return <div className="glass rounded-[18px] px-3 py-2.5">{body}</div>;
}

function TalkSaviaCard({ onAsk, wrapUpPaid, tone }: { onAsk: () => void; wrapUpPaid: boolean; tone: SaviaTone }) {
  const { t } = useI18n();
  return (
    <section className="glass mt-2 rounded-[22px] px-3.5 py-3.5" aria-label={t.talkSaviaTitle}>
      <button
        type="button"
        onClick={() => {
          haptic(14);
          onAsk();
        }}
        className="press flex w-full items-center gap-3.5 text-left"
      >
        <SaviaOrb tone={tone} className="size-[46px]" />
        <span className="min-w-0 flex-1">
          <span className="block font-display text-[17px] font-semibold tracking-[-0.02em] text-fg">
            {t.talkSaviaTitle}
          </span>
          <span className="mt-0.5 block text-[12.5px] leading-snug text-muted">{t.talkSaviaSub}</span>
        </span>
        <span aria-hidden className="grid size-[34px] shrink-0 place-items-center rounded-full bg-white text-[#130d12]">
          <ArrowUpRight className="size-4" strokeWidth={2} />
        </span>
      </button>
      <div className="mt-3 flex items-center justify-between gap-2 border-t border-white/[0.07] pt-3">
        <Link
          to="/app/pareja"
          className="inline-flex min-h-9 items-center gap-1 text-xs font-medium text-muted hover:text-fg"
        >
          {t.partnerTitle}
          <ArrowRight className="size-3.5" strokeWidth={1.8} aria-hidden />
        </Link>
        <button
          type="button"
          onClick={() => {
            haptic(14);
            onAsk();
          }}
          className="press bg-grad inline-flex h-9 items-center rounded-full px-4 text-xs font-semibold text-primary-fg"
        >
          {t.talkSaviaCta}
        </button>
      </div>
      {!wrapUpPaid ? (
        <p className="mt-2 text-[11px] font-medium leading-snug text-muted">{t.talkSaviaSerenaHint}</p>
      ) : null}
    </section>
  );
}
