import type { ReactNode } from "react";
import { useEffect } from "react";
import { Droplets, Plus } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { CYCLE_CHOICES, daysUntil, formatLong, todayISO, weekStrip } from "@/lib/cycle";
import { foodsFor, phaseName, pick, teaFor } from "@/lib/savia-content";
import type { Phase, Stage } from "@/lib/types";
import { cn } from "@/lib/utils";
import { AskGlyph } from "@/components/ask-fab";
import { maybeNotify, periodAlert } from "@/lib/notify";

const DOW_ES = ["D", "L", "M", "X", "J", "V", "S"];
const DOW_EN = ["S", "M", "T", "W", "T", "F", "S"];

export function FloToday({
  stage,
  phase,
  nextPeriod,
  cycleLength = 28,
  onCal,
  onLog,
  onGuia,
  onAsk,
  onCameToday,
  onCycleChange,
  notify = false,
}: {
  stage: Stage;
  phase: Phase;
  nextPeriod?: string | null;
  cycleLength?: number;
  onCal: () => void;
  onLog: () => void;
  onGuia: () => void;
  onAsk: () => void;
  onCameToday?: () => void;
  onCycleChange?: (n: number) => void;
  notify?: boolean;
}) {
  const { t, lang } = useI18n();
  const today = todayISO();
  const days = weekStrip(today);
  const left = daysUntil(nextPeriod ?? null);
  const onPeriod = phase === "menstrual";
  const fertile = phase === "ovulatory";
  const food = foodsFor(stage, phase)[0];
  const tea = teaFor(stage, phase);
  const dow = lang === "es" ? DOW_ES : DOW_EN;
  const kind = periodAlert(left, onPeriod);

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

  const chance = onPeriod ? t.chanceLow : fertile ? t.ovToday : t.chanceLow;

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
              : t.notifyBodyFertile;

  useEffect(() => {
    if (!notify) return;
    maybeNotify({ kind: kind ?? (fertile ? "fertile" : null), fertile, title: notifyTitle, body: notifyBody });
  }, [notify, kind, fertile, notifyTitle, notifyBody]);

  return (
    <div className="relative -mx-4 overflow-hidden px-4 pb-4">
      <div className="pointer-events-none absolute -top-24 right-[-30%] h-80 w-80 rounded-full bg-[#e8b4ae]/70 blur-2xl" />
      <div className="pointer-events-none absolute top-48 left-[-40%] h-72 w-72 rounded-full bg-[#f7e6c8]/80 blur-2xl" />

      <p className="relative text-center text-[11px] font-medium uppercase tracking-[0.28em] text-muted">
        {formatLong(today, lang)}
      </p>

      <div className="relative mt-5 grid grid-cols-7 text-center">
        {days.map((d) => {
          const isToday = d.iso === today;
          return (
            <div key={d.iso} className="flex flex-col items-center gap-2">
              <span className="text-[10px] font-medium tracking-[0.16em] text-muted">{dow[d.dow]}</span>
              <span
                className={cn(
                  "flex size-10 items-center justify-center rounded-full text-[15px]",
                  isToday ? "bg-ink text-primary-fg" : "text-fg",
                )}
              >
                {d.date}
              </span>
            </div>
          );
        })}
      </div>

      <div className="relative mt-14 text-center">
        {hero.kicker ? (
          <p className="font-display text-xl italic tracking-tight text-muted">{hero.kicker}</p>
        ) : null}
        <h1
          className={cn(
            "font-display font-medium tracking-tight text-ink",
            hero.kicker ? "mt-1 text-7xl" : "text-6xl leading-[0.95]",
          )}
        >
          {hero.title}
        </h1>
        <p className="mt-5 text-sm tracking-wide text-muted">{chance}</p>
        {!onPeriod && onCameToday ? (
          <button
            type="button"
            onClick={onCameToday}
            className="mt-6 min-h-11 rounded-full border border-ink/20 bg-transparent px-6 text-xs font-medium uppercase tracking-[0.18em] text-fg"
          >
            {t.cameToday}
          </button>
        ) : null}
        {onCycleChange ? (
          <div className="mt-8">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted">{t.cycleAsk}</p>
            <div className="mt-3 flex flex-wrap justify-center gap-1.5">
              {CYCLE_CHOICES.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => onCycleChange(n)}
                  className={cn(
                    "h-9 min-w-10 rounded-full px-2 text-xs",
                    cycleLength === n ? "bg-ink text-primary-fg" : "bg-surface/80 text-fg",
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="relative mt-12 grid grid-cols-3 gap-3">
        <ActionCircle label={t.logPeriod} onClick={onLog}>
          <Droplets className="size-6" strokeWidth={1.6} />
        </ActionCircle>
        <ActionCircle label={t.symptoms} onClick={onLog}>
          <Plus className="size-6" strokeWidth={1.6} />
        </ActionCircle>
        <ActionCircle label={t.askMark} onClick={onAsk} filled>
          <AskGlyph className="text-2xl" />
        </ActionCircle>
      </div>

      <div className="relative mt-12">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl italic tracking-tight">{t.dailyTips}</h2>
          <button type="button" onClick={onCal} className="text-[11px] uppercase tracking-[0.16em] text-muted">
            {t.navCal}
          </button>
        </div>
        <div className="-mx-4 mt-4 flex gap-3 overflow-x-auto px-4 pb-2">
          <TipCard tone="blush" title={pick(phaseName[phase], lang)} onClick={onGuia} />
          {food ? <TipCard tone="ink" title={pick(food.title, lang)} onClick={onGuia} /> : null}
          <TipCard tone="rose" title={pick(tea.name, lang)} onClick={onGuia} />
        </div>
      </div>
    </div>
  );
}

function ActionCircle({
  label,
  onClick,
  filled,
  children,
}: {
  label: string;
  onClick: () => void;
  filled?: boolean;
  children: ReactNode;
}) {
  return (
    <button type="button" onClick={onClick} className="flex flex-col items-center gap-2">
      <span
        className={cn(
          "flex size-[4.25rem] items-center justify-center rounded-full",
          filled ? "bg-ink text-primary-fg" : "border border-ink/15 bg-surface text-fg",
        )}
      >
        {children}
      </span>
      <span className="max-w-24 text-center text-[11px] leading-snug tracking-wide">{label}</span>
    </button>
  );
}

function TipCard({
  title,
  tone,
  onClick,
}: {
  title: string;
  tone: "blush" | "ink" | "rose";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-48 w-40 shrink-0 rounded-[1.75rem] p-5 text-left",
        tone === "blush" && "bg-[#ead0c8] text-ink",
        tone === "ink" && "bg-ink text-primary-fg",
        tone === "rose" && "bg-primary text-primary-fg",
      )}
    >
      <p className="font-display text-2xl font-medium leading-tight tracking-tight">{title}</p>
    </button>
  );
}
