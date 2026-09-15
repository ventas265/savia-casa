import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { CYCLE_CHOICES, daysUntil, formatLong, markForDate, todayISO, weekStrip } from "@/lib/cycle";
import { useClientTodayISO } from "@/lib/use-today";
import type { DailyLog, Phase, Stage } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Droplets, Heart, Plus } from "lucide-react";
import { CartaHoy } from "@/components/carta-hoy";
import { ConsejosHoy } from "@/components/consejos-hoy";
import { QuickLog } from "@/components/quick-log";
import { haptic } from "@/lib/haptic";
import { maybeNotify, periodAlert } from "@/lib/notify";
import { armReminders, remindPlan } from "@/lib/reminders";

const DOW_ES = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"];
const DOW_EN = ["M", "T", "W", "T", "F", "S", "S"];

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
  onCameToday?: () => void;
  onCycleChange?: (n: number) => void;
  notify?: boolean;
  showFertile?: boolean;
  log?: DailyLog | null;
  onLogSaved?: () => void;
}) {
  const { t, lang } = useI18n();
  const [adjust, setAdjust] = useState(false);
  const today = useClientTodayISO() ?? todayISO();
  const days = weekStrip(today);
  const left = daysUntil(nextPeriod ?? null);
  const onPeriod = phase === "menstrual";
  void showFertile; // always-on for week strip / chance copy
  const fertile = phase === "ovulatory";
  const dow = lang === "es" ? DOW_ES : DOW_EN;
  const kind = periodAlert(left, onPeriod, phase);

  const hero =
    kind === "period"
      ? { kicker: null as string | null, title: t.periodToday }
      : kind === "today"
        ? { kicker: null, title: t.periodComesToday }
        : kind === "tomorrow"
          ? { kicker: null, title: t.periodComesTomorrow }
          : kind === "soon"
            ? { kicker: null, title: t.periodComesSoon }
            : kind === "late"
              ? { kicker: t.periodLate, title: `${Math.abs(left ?? 0)} ${t.daysLeft}` }
              : { kicker: t.periodIn, title: left == null ? "—" : `${left} ${left === 1 ? t.dayLeft : t.daysLeft}` };

  const chance = stage === "peri" ? t.periSub : onPeriod ? t.periodSub : fertile ? t.ovToday : t.chanceLow;

  const periHero =
    stage === "peri"
      ? { kicker: t.periKicker, title: hero.title }
      : hero;

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
        nextPeriod: nextPeriod ?? null,
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
  }, [notify, kind, fertile, notifyTitle, notifyBody, nextPeriod, onPeriod, t]);

  return (
    <div className="relative -mx-4 overflow-hidden px-4 pb-6">
      {name ? (
        <p className="relative font-display text-3xl font-semibold tracking-[-0.03em]">
          {t.goodMorning}, {name}
        </p>
      ) : (
        <p className="relative font-display text-3xl font-semibold tracking-[-0.03em]">{t.goodMorning}</p>
      )}
      <p className="relative mt-1 text-center text-sm font-semibold text-muted">{formatLong(today, lang)}</p>

      <div className="relative mt-6 grid grid-cols-7 text-center">
        {days.map((d) => {
          const isToday = d.iso === today;
          const mark = markForDate(d.iso, {
            lastStart: lastStart ?? null,
            cycleLength,
            periodLength,
            periodStarts,
          });
          return (
            <button
              key={d.iso}
              type="button"
              onClick={() => {
                haptic();
                onCal();
              }}
              className="press flex flex-col items-center gap-2"
            >
              <span className="text-xs font-semibold text-muted">{dow[d.dow]}</span>
              <span
                className={cn(
                  "flex size-10 items-center justify-center rounded-full text-base font-semibold",
                  mark === "period" && "bg-cal-period text-primary-fg",
                  (mark === "fertile" || mark === "peak") && "bg-cal-fertile text-ink",
                  !mark || mark === "quiet" ? "bg-surface text-fg" : "",
                  isToday && "pulse-today ring-2 ring-ink/30",
                )}
              >
                {d.date}
              </span>
            </button>
          );
        })}
      </div>

      <div className="relative mt-10 text-center">
        {periHero.kicker ? <p className="text-sm font-semibold text-muted">{periHero.kicker}</p> : null}
        <p className="font-display text-[2.85rem] font-semibold leading-none tracking-[-0.05em] text-primary">
          {periHero.title}
        </p>
        <p className="mt-3 text-sm font-semibold">{chance}</p>
        {!onPeriod ? (
          <p className="mt-2 text-xs font-medium text-muted">{t.periodEstimate}</p>
        ) : null}
      </div>

      <div className="relative mt-10 grid grid-cols-3 gap-4">
        <HeroAct label={t.actBleed} onClick={() => (onCameToday && !onPeriod ? onCameToday() : onLog())} tone="rose" />
        <HeroAct label={t.actBody} onClick={() => document.getElementById("anotar")?.scrollIntoView({ behavior: "smooth" })} tone="sand" />
        <HeroAct label={t.actSex} onClick={onLog} tone="plum" />
      </div>

      <ConsejosHoy stage={stage} phase={phase} onAsk={onAsk} onGuia={onGuia} />

      <QuickLog initial={log} onSaved={onLogSaved} />

      <CartaHoy name={name} stage={stage} phase={phase} onAsk={onAsk} />

      {!onPeriod && onCameToday ? (
        <button
          type="button"
          onClick={onCameToday}
          className="relative mt-6 w-full min-h-12 rounded-full bg-primary text-sm font-semibold text-primary-fg shadow-card"
        >
          {t.cameToday}
        </button>
      ) : null}
      {onCycleChange ? (
        <div className="relative mt-4 text-center">
          <button
            type="button"
            onClick={() => setAdjust((v) => !v)}
            className="text-xs font-semibold text-muted underline-offset-4 hover:underline"
          >
            {adjust ? t.hideAdjust : t.adjustCycle}
          </button>
          {adjust ? (
            <div className="mt-2 flex flex-wrap justify-center gap-1.5">
              {CYCLE_CHOICES.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => onCycleChange(n)}
                  className={cn(
                    "h-10 min-w-10 rounded-full px-2 text-sm font-semibold",
                    cycleLength === n ? "bg-primary text-primary-fg shadow-card" : "bg-surface text-fg",
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function HeroAct({
  label,
  onClick,
  tone,
}: {
  label: string;
  onClick: () => void;
  tone: "rose" | "sand" | "plum";
}) {
  const Icon = tone === "rose" ? Droplets : tone === "sand" ? Plus : Heart;
  return (
    <button
      type="button"
      onClick={() => {
        haptic(14);
        onClick();
      }}
      className="press flex min-h-11 flex-col items-center gap-2.5 py-1"
    >
      <span
        className={cn(
          "flex size-[4.25rem] min-h-11 min-w-11 items-center justify-center rounded-full shadow-card",
          tone === "rose" && "bg-primary text-primary-fg",
          tone === "sand" && "bg-surface text-ink",
          tone === "plum" && "bg-plum text-primary-fg",
        )}
      >
        <Icon className="size-7" strokeWidth={2.2} />
      </span>
      <span className="text-center text-[11px] font-semibold leading-tight">{label}</span>
    </button>
  );
}
