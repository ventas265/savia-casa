import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import {
  CYCLE_CHOICES,
  daysUntil,
  formatDay,
  formatLong,
  inDayRange,
  markForDate,
  predictPeriod,
  todayISO,
  weekStrip,
} from "@/lib/cycle";
import { useClientTodayISO } from "@/lib/use-today";
import type { DailyLog, Phase, Stage } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Droplets, MessageCircle, Plus } from "lucide-react";
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
  onCameToday?: () => void | Promise<unknown>;
  onCycleChange?: (n: number) => void;
  notify?: boolean;
  showFertile?: boolean;
  log?: DailyLog | null;
  onLogSaved?: () => void;
}) {
  const { t, lang } = useI18n();
  const [adjust, setAdjust] = useState(false);
  const [savingPeriod, setSavingPeriod] = useState(false);
  const today = useClientTodayISO() ?? todayISO();
  const days = weekStrip(today);
  const pred = predictPeriod(lastStart, periodStarts, cycleLength, stage);
  const next = pred.next ?? nextPeriod ?? null;
  const left = daysUntil(next);
  const loggedBleed = Boolean(
    log && (log.periodStarted || (log.flow !== "none" && log.flow !== "spotting")),
  );
  const onPeriod = phase === "menstrual" || loggedBleed;
  void showFertile;
  const fertile = phase === "ovulatory";
  const dow = lang === "es" ? DOW_ES : DOW_EN;
  const inWindow = !onPeriod && inDayRange(today, pred.from, pred.to);
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
          const estHint = inDayRange(d.iso, pred.from, pred.to) && mark !== "period";
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
                  estHint && "border-2 border-dashed border-cal-period bg-transparent text-cal-period",
                  (mark === "fertile" || mark === "peak") && !estHint && "bg-cal-fertile text-ink",
                  (!mark || mark === "quiet") && !estHint ? "bg-surface text-fg" : "",
                  isToday && "pulse-today ring-2 ring-ink/30",
                )}
              >
                {d.date}
              </span>
              {estHint ? (
                <span className="size-1 rounded-full bg-cal-period/80" aria-hidden />
              ) : (
                <span className="size-1" aria-hidden />
              )}
            </button>
          );
        })}
      </div>

      <div className="relative mt-10 text-center">
        <p className="font-display text-[2.85rem] font-semibold leading-[1.05] tracking-[-0.05em] text-primary">
          {heroTitle}
        </p>
        <p className="mt-3 text-xs font-medium text-muted">{t.heroDisclaimer}</p>
      </div>

      <div className="relative mt-10 grid grid-cols-3 gap-4">
        <HeroAct
          label={t.actBleed}
          onClick={() => void registerPeriodToday()}
          tone="rose"
          disabled={savingPeriod}
        />
        <HeroAct
          label={t.actBody}
          onClick={() => document.getElementById("anotar")?.scrollIntoView({ behavior: "smooth" })}
          tone="sand"
        />
        <HeroAct label={t.actAskSavia} onClick={onAsk} tone="plum" />
      </div>

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
          {adjust ? (
            <div className="mt-2 flex flex-wrap justify-center gap-1.5">
              {CYCLE_CHOICES.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => onCycleChange(n)}
                  className={cn(
                    "h-10 min-w-10 rounded-full px-2 text-sm font-semibold",
                    cycleLength === n ? "bg-select text-select-fg shadow-card" : "bg-surface text-fg",
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
  disabled,
}: {
  label: string;
  onClick: () => void;
  tone: "rose" | "sand" | "plum";
  disabled?: boolean;
}) {
  const Icon = tone === "rose" ? Droplets : tone === "sand" ? Plus : MessageCircle;
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        haptic(14);
        onClick();
      }}
      className="press flex min-h-11 flex-col items-center gap-2.5 py-1 disabled:opacity-60"
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
