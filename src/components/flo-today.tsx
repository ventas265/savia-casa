import type { ReactNode } from "react";
import { Droplets, Plus, BookOpen } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { daysUntil, formatLong, todayISO, weekStrip } from "@/lib/cycle";
import { foodsFor, phaseName, pick, teaFor } from "@/lib/savia-content";
import type { Phase, Stage } from "@/lib/types";
import { cn } from "@/lib/utils";

const DOW_ES = ["D", "L", "M", "X", "J", "V", "S"];
const DOW_EN = ["S", "M", "T", "W", "T", "F", "S"];

export function FloToday({
  stage,
  phase,
  nextPeriod,
  onCal,
  onLog,
  onGuia,
}: {
  stage: Stage;
  phase: Phase;
  nextPeriod?: string | null;
  onCal: () => void;
  onLog: () => void;
  onGuia: () => void;
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

  return (
    <div className="relative -mx-4 overflow-hidden px-4 pb-4">
      <div className="pointer-events-none absolute -top-8 right-[-40%] h-64 w-64 rounded-full bg-surface-2 opacity-80" />
      <div className="pointer-events-none absolute top-40 left-[-30%] h-72 w-72 rounded-full bg-surface-2 opacity-70" />

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
                  isToday ? "bg-fg/15 text-fg" : "text-fg",
                )}
              >
                {d.date}
              </span>
            </div>
          );
        })}
      </div>

      <div className="relative mt-16 text-center">
        {onPeriod ? (
          <h1 className="text-5xl font-bold tracking-tight">{t.periodToday}</h1>
        ) : (
          <>
            <p className="text-lg">{t.periodIn}</p>
            <p className="mt-1 text-6xl font-bold tracking-tight">
              {left == null ? "—" : left} {left === 1 ? t.dayLeft : t.daysLeft}
            </p>
          </>
        )}
        <p className="mt-5 text-base">{fertile ? t.chanceHigh : t.chanceLow}</p>
      </div>

      <div className="relative mt-12 grid grid-cols-3 gap-3">
        <ActionCircle label={t.logPeriod} onClick={onLog} filled>
          <Droplets className="size-7" />
        </ActionCircle>
        <ActionCircle label={t.symptoms} onClick={onLog}>
          <Plus className="size-7" />
        </ActionCircle>
        <ActionCircle label={t.library} onClick={onGuia}>
          <BookOpen className="size-7" />
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
          <TipCard tone="blue" title={pick(phaseName[phase], lang)} onClick={onGuia} />
          {food ? <TipCard tone="dark" title={pick(food.title, lang)} onClick={onGuia} /> : null}
          <TipCard tone="cream" title={pick(tea.name, lang)} onClick={onGuia} />
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
          "flex size-16 items-center justify-center rounded-full shadow-sm",
          filled ? "bg-primary text-primary-fg" : "bg-surface text-fg",
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
  onClick,
}: {
  title: string;
  tone: "blue" | "dark" | "cream";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-44 w-36 shrink-0 rounded-2xl border-2 border-primary/40 p-4 text-left",
        tone === "blue" && "bg-cal-fertile/30 text-fg",
        tone === "dark" && "bg-ink text-primary-fg",
        tone === "cream" && "bg-surface text-fg",
      )}
    >
      <p className="text-sm font-semibold leading-snug">{title}</p>
    </button>
  );
}
