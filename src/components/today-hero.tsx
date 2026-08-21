import type { ReactNode } from "react";
import { useEffect, useState } from "react";
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

export function TodayHero({
  stage,
  phase,
  nextPeriod,
  cycleLength = 28,
  name,
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
  name?: string;
  onCal: () => void;
  onLog: () => void;
  onGuia: () => void;
  onAsk: () => void;
  onCameToday?: () => void;
  onCycleChange?: (n: number) => void;
  notify?: boolean;
}) {
  const { t, lang } = useI18n();
  const [adjust, setAdjust] = useState(false);
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
      <p className="relative text-center text-sm font-semibold">{formatLong(today, lang)}</p>

      <div className="relative mt-4 grid grid-cols-7 text-center">
        {days.map((d) => {
          const isToday = d.iso === today;
          return (
            <div key={d.iso} className="flex flex-col items-center gap-2">
              <span className="text-xs font-semibold text-muted">{dow[d.dow]}</span>
              <span
                className={cn(
                  "flex size-10 items-center justify-center rounded-full text-base font-semibold",
                  isToday ? "bg-primary text-primary-fg shadow-card" : "bg-surface text-fg",
                )}
              >
                {d.date}
              </span>
            </div>
          );
        })}
      </div>

      <div className="hero-pop relative mt-12 text-center">
        {name ? <p className="mb-2 text-sm font-semibold text-muted">{t.hello}, {name}</p> : null}
        {hero.kicker ? <p className="text-lg font-semibold text-fg/80">{hero.kicker}</p> : null}
        <h1
          className={cn(
            "bg-gradient-to-br from-primary to-ink bg-clip-text font-extrabold tracking-tight text-transparent",
            hero.kicker ? "mt-1 text-6xl" : "text-5xl leading-[1.05]",
          )}
        >
          {hero.title}
        </h1>
        <p className="mt-4 text-base font-medium">{chance}</p>
        {!onPeriod && onCameToday ? (
          <button
            type="button"
            onClick={onCameToday}
            className="mt-5 min-h-12 rounded-full bg-primary px-6 text-sm font-semibold text-primary-fg shadow-card"
          >
            {t.cameToday}
          </button>
        ) : null}
        {onCycleChange ? (
          <div className="mt-6">
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

      <div className="relative mt-10 grid grid-cols-3 gap-3">
        <ActionCircle label={t.logPeriod} onClick={onLog} tone="pink">
          <Droplets className="size-7" />
        </ActionCircle>
        <ActionCircle label={t.symptoms} onClick={onLog} tone="mint">
          <Plus className="size-7" />
        </ActionCircle>
        <ActionCircle label={t.askMark} onClick={onAsk} tone="ink">
          <AskGlyph className="size-8" />
        </ActionCircle>
      </div>

      <div className="relative mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">{t.dailyTips}</h2>
          <button type="button" onClick={onCal} className="text-sm font-semibold text-primary">
            {t.navCal}
          </button>
        </div>
        <div className="-mx-4 mt-4 flex gap-3 overflow-x-auto px-4 pb-2">
          <TipCard tone="mint" title={pick(phaseName[phase], lang)} onClick={onGuia} />
          {food ? <TipCard tone="ink" title={pick(food.title, lang)} onClick={onGuia} /> : null}
          <TipCard tone="surface" title={pick(tea.name, lang)} onClick={onGuia} />
          <TipCard tone="primary" title={t.askMark} onClick={onAsk} />
        </div>
      </div>
    </div>
  );
}

function ActionCircle({
  label,
  onClick,
  tone,
  children,
}: {
  label: string;
  onClick: () => void;
  tone: "pink" | "mint" | "ink";
  children: ReactNode;
}) {
  return (
    <button type="button" onClick={onClick} className="flex flex-col items-center gap-2">
      <span
        className={cn(
          "float-slow flex size-[4.4rem] items-center justify-center rounded-full shadow-card",
          tone === "pink" && "bg-primary text-primary-fg",
          tone === "mint" && "bg-accent text-ink",
          tone === "ink" && "bg-ink text-primary-fg",
        )}
      >
        {children}
      </span>
      <span className="max-w-24 text-center text-xs font-semibold leading-snug">{label}</span>
    </button>
  );
}

function TipCard({
  title,
  tone,
  onClick,
}: {
  title: string;
  tone: "mint" | "ink" | "surface" | "primary";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative h-48 w-40 shrink-0 overflow-hidden rounded-[1.6rem] p-4 text-left shadow-card",
        tone === "mint" && "bg-accent text-ink",
        tone === "ink" && "bg-ink text-primary-fg",
        tone === "surface" && "bg-surface text-ink",
        tone === "primary" && "bg-primary text-primary-fg",
      )}
    >
      <span className="absolute -right-6 -top-6 size-24 rounded-full bg-white/25" />
      <span className="absolute -bottom-8 left-8 size-20 rounded-full bg-primary/20" />
      <p className="relative text-[17px] font-bold leading-snug">{title}</p>
    </button>
  );
}
