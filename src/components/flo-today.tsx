import type { ReactNode } from "react";
import { useEffect } from "react";
import { Droplets, Plus } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { CYCLE_CHOICES, daysUntil, formatLong, todayISO, weekStrip } from "@/lib/cycle";
import { foodsFor, phaseName, pick, teaFor } from "@/lib/savia-content";
import type { Phase, Stage } from "@/lib/types";
import { cn } from "@/lib/utils";
import { AskGlyph } from "@/components/ask-fab";
import { Flor, HeartLeaf, Periquito } from "@/components/periquito";
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
      <div className="pointer-events-none absolute -top-10 right-[-28%] h-56 w-56 rounded-full bg-[#ffb3c7] opacity-80" />
      <div className="pointer-events-none absolute top-28 left-[-35%] h-64 w-64 rounded-full bg-[#c9b6ff] opacity-55" />
      <div className="pointer-events-none absolute top-72 right-[-20%] h-48 w-48 rounded-full bg-[#7ee0c8] opacity-50" />
      <div className="pointer-events-none absolute top-8 left-3 rotate-[-18deg]">
        <Flor className="size-9 opacity-90" />
      </div>
      <div className="pointer-events-none absolute top-20 right-8">
        <HeartLeaf className="size-7 opacity-80" />
      </div>

      <p className="relative text-center text-sm font-medium">{formatLong(today, lang)}</p>

      <div className="relative mt-4 grid grid-cols-7 text-center">
        {days.map((d) => {
          const isToday = d.iso === today;
          return (
            <div key={d.iso} className="flex flex-col items-center gap-2">
              <span className="text-xs font-medium tracking-wide text-muted">{dow[d.dow]}</span>
              <span
                className={cn(
                  "flex size-10 items-center justify-center rounded-full text-base font-medium",
                  isToday ? "bg-primary text-primary-fg shadow-sm" : "text-fg",
                )}
              >
                {d.date}
              </span>
            </div>
          );
        })}
      </div>

      <div className="relative mt-12 text-center">
        <div className="mx-auto mb-2 flex justify-center">
          <Periquito className="size-20" />
        </div>
        {hero.kicker ? <p className="text-lg">{hero.kicker}</p> : null}
        <h1 className={cn("font-bold tracking-tight", hero.kicker ? "mt-1 text-6xl" : "text-5xl")}>{hero.title}</h1>
        <p className="mt-5 text-base">{chance}</p>
        {!onPeriod && onCameToday ? (
          <button
            type="button"
            onClick={onCameToday}
            className="mt-4 min-h-11 rounded-full bg-primary px-5 text-sm font-medium text-primary-fg shadow-sm"
          >
            {t.cameToday}
          </button>
        ) : null}
        {onCycleChange ? (
          <div className="mt-5">
            <p className="text-xs text-muted">{t.cycleAsk}</p>
            <div className="mt-2 flex flex-wrap justify-center gap-1.5">
              {CYCLE_CHOICES.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => onCycleChange(n)}
                  className={cn(
                    "h-9 min-w-10 rounded-full px-2 text-xs font-medium",
                    cycleLength === n ? "bg-ink text-primary-fg" : "bg-surface text-fg",
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
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
        <ActionCircle label={t.askMark} onClick={onAsk} tone="coral">
          <AskGlyph className="text-3xl" />
        </ActionCircle>
      </div>

      <div className="relative mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t.dailyTips}</h2>
          <button type="button" onClick={onCal} className="text-sm text-muted">
            {t.navCal}
          </button>
        </div>
        <div className="-mx-4 mt-4 flex gap-3 overflow-x-auto px-4 pb-2">
          <TipCard tone="lilac" title={pick(phaseName[phase], lang)} onClick={onGuia} doodle="flor" />
          {food ? <TipCard tone="coral" title={pick(food.title, lang)} onClick={onGuia} doodle="heart" /> : null}
          <TipCard tone="mint" title={pick(tea.name, lang)} onClick={onGuia} doodle="bird" />
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
  tone: "pink" | "mint" | "coral";
  children: ReactNode;
}) {
  return (
    <button type="button" onClick={onClick} className="flex flex-col items-center gap-2">
      <span
        className={cn(
          "flex size-16 items-center justify-center rounded-full shadow-sm",
          tone === "pink" && "bg-[#ffb3c7] text-fg",
          tone === "mint" && "bg-[#7ee0c8] text-fg",
          tone === "coral" && "bg-primary text-primary-fg",
        )}
      >
        {children}
      </span>
      <span className="max-w-24 text-center text-xs leading-snug">{label}</span>
    </button>
  );
}

function TipCard({
  title,
  tone,
  doodle,
  onClick,
}: {
  title: string;
  tone: "lilac" | "coral" | "mint";
  doodle: "flor" | "heart" | "bird";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative h-44 w-36 shrink-0 overflow-hidden rounded-2xl p-4 text-left shadow-sm",
        tone === "lilac" && "bg-[#c9b6ff] text-fg",
        tone === "coral" && "bg-primary text-primary-fg",
        tone === "mint" && "bg-[#7ee0c8] text-fg",
      )}
    >
      <p className="relative z-10 text-sm font-semibold leading-snug">{title}</p>
      <span className="absolute -bottom-2 -right-2 opacity-70">
        {doodle === "flor" ? <Flor className="size-16" /> : doodle === "heart" ? <HeartLeaf className="size-14" /> : <Periquito className="size-16" />}
      </span>
    </button>
  );
}
