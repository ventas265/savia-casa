import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Heart } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  cycleDay,
  formatDay,
  fromISO,
  markForDate,
  monthCells,
  phaseForDay,
  todayISO,
  type DayMark,
} from "@/lib/cycle";
import { phaseName, pick } from "@/lib/savia-content";

const MONTHS_ES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];
const MONTHS_EN = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

type CellLog = {
  day: string;
  flow: string;
  symptoms: string[];
  mood?: number | null;
  sex?: boolean;
};

export function CycleCalendar({
  lastStart,
  cycleLength = 28,
  periodLength = 5,
  periodStarts = [],
  periodDays = [],
  sexDays = [],
  sexMarks = [],
  logs = [],
  showFertile = false,
  onSelect,
}: {
  lastStart: string | null;
  cycleLength?: number;
  periodLength?: number;
  periodStarts?: string[];
  periodDays?: string[];
  sexDays?: string[];
  sexMarks?: { day: string; kind: string }[];
  logs?: CellLog[];
  paid?: boolean;
  showFertile?: boolean;
  onSelect?: (iso: string) => void;
  onSetSex?: (iso: string, kind: "protected" | "unprotected" | "withdrawal") => void;
}) {
  const { t, lang } = useI18n();
  const today = todayISO();
  const now = fromISO(today);
  const [cursor, setCursor] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const [picked, setPicked] = useState(today);
  const weekdays = lang === "es" ? ["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"] : ["M", "T", "W", "T", "F", "S", "S"];
  const months = lang === "es" ? MONTHS_ES : MONTHS_EN;
  const cells = useMemo(() => monthCells(cursor.y, cursor.m), [cursor.y, cursor.m]);

  function mark(iso: string): DayMark | null {
    const m = markForDate(iso, { lastStart, cycleLength, periodLength, periodStarts, periodDays });
    if (!showFertile && (m === "fertile" || m === "peak")) return "quiet";
    return m;
  }

  function choose(iso: string) {
    setPicked(iso);
    onSelect?.(iso);
  }

  const selectedMark = mark(picked);
  const dayNum = cycleDay(lastStart, cycleLength, picked);
  const phase = phaseForDay(dayNum, periodLength, cycleLength);

  const caption =
    selectedMark === "period"
      ? t.legendPeriod
      : selectedMark === "peak"
        ? t.legendPeak
        : selectedMark === "fertile"
          ? t.legendFertile
          : selectedMark === "quiet"
            ? t.legendQuiet
            : t.calEmpty;

  const sexSet = useMemo(() => new Set(sexDays.length ? sexDays : sexMarks.map((s) => s.day)), [sexDays, sexMarks]);
  const logByDay = useMemo(() => Object.fromEntries(logs.map((l) => [l.day, l])), [logs]);
  const marks = cells.map((c) => mark(c.iso));

  return (
    <div>
      <div className="flex items-center justify-between">
        <button
          type="button"
          className="inline-flex size-11 items-center justify-center rounded-full hover:bg-surface-2"
          onClick={() =>
            setCursor((c) => (c.m === 0 ? { y: c.y - 1, m: 11 } : { y: c.y, m: c.m - 1 }))
          }
          aria-label="prev"
        >
          <ChevronLeft className="size-5" />
        </button>
        <p className="font-display text-2xl font-semibold tracking-[-0.03em]">{months[cursor.m]} {cursor.y}</p>
        <button
          type="button"
          className="inline-flex size-11 items-center justify-center rounded-full hover:bg-surface-2"
          onClick={() =>
            setCursor((c) => (c.m === 11 ? { y: c.y + 1, m: 0 } : { y: c.y, m: c.m + 1 }))
          }
          aria-label="next"
        >
          <ChevronRight className="size-5" />
        </button>
      </div>
      <div className="mt-2 grid grid-cols-7 text-center text-xs tracking-wide text-muted">
        {weekdays.map((w, i) => (
          <div key={`${w}-${i}`} className="py-2">
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((cell, i) => {
          const m = marks[i] ?? null;
          const isToday = cell.iso === today;
          const isPicked = cell.iso === picked;
          const logged = logByDay[cell.iso];
          const flow = logged?.flow;
          const fill =
            flow === "heavy"
              ? "bg-cal-period text-primary-fg"
              : flow === "medium"
                ? "bg-primary/80 text-primary-fg"
                : flow === "light"
                  ? "bg-primary/50 text-ink"
                  : flow === "spotting"
                    ? "bg-primary/25 text-ink"
                    : m === "period"
                      ? "bg-cal-period/70 text-primary-fg"
                      : m === "peak" || m === "fertile"
                        ? "bg-cal-fertile text-ink"
                        : "text-fg";
          const hasFlow = Boolean(flow && flow !== "none");
          const hasMood = Boolean(logged && ((logged.mood != null && logged.mood > 0) || logged.symptoms.length > 0));
          const hasSex = sexSet.has(cell.iso) || Boolean(logged?.sex);
          const onDark = m === "period" || flow === "heavy" || flow === "medium";
          return (
            <button
              key={cell.iso}
              type="button"
              onClick={() => choose(cell.iso)}
              className={cn(
                "press flex aspect-square items-center justify-center",
                !cell.inMonth && "opacity-30",
              )}
            >
              <span
                className={cn(
                  "relative flex size-11 items-center justify-center rounded-full text-sm tabular-nums",
                  fill,
                  isToday && "font-semibold ring-2 ring-ink/20",
                  isPicked && m !== "period" && "ring-2 ring-primary",
                )}
              >
                {cell.date}
                {hasFlow || hasMood || hasSex ? (
                  <span className="absolute bottom-0.5 flex items-center gap-0.5">
                    {hasFlow ? (
                      <span
                        className={cn("size-1.5 rounded-full", onDark ? "bg-primary-fg" : "bg-primary")}
                        title={t.calMarkFlow}
                      />
                    ) : null}
                    {hasMood ? (
                      <span
                        className={cn("size-1.5 rounded-full", onDark ? "bg-sand" : "bg-ink/70")}
                        title={t.calMarkMood}
                      />
                    ) : null}
                    {hasSex ? (
                      <Heart
                        className={cn(
                          "size-2.5 fill-current",
                          onDark ? "text-primary-fg" : "text-primary",
                        )}
                      />
                    ) : null}
                  </span>
                ) : null}
              </span>
            </button>
          );
        })}
      </div>
      <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted">
        <li className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-cal-period" /> {t.legendPeriod}
        </li>
        {showFertile ? (
          <>
            <li className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-cal-fertile" /> {t.legendFertile}
            </li>
            <li className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-cal-peak" /> {t.legendPeak}
            </li>
          </>
        ) : null}
        <li className="inline-flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-primary" /> {t.calMarkFlow}
        </li>
        <li className="inline-flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-ink/70" /> {t.calMarkMood}
        </li>
        <li className="inline-flex items-center gap-1.5">
          <Heart className="size-3 fill-current text-primary" /> {t.legendSex}
        </li>
      </ul>
      <div className="mt-4 border-t border-border pt-3">
        <p className="font-medium">
          {formatDay(picked, lang)}
          {dayNum ? ` · ${t.dayOf} ${dayNum}` : ""}
          {phase !== "none" ? ` · ${pick(phaseName[phase], lang)}` : ""}
        </p>
        <p className="mt-1 text-sm text-muted">{caption}</p>
        <p className="mt-2 text-xs text-muted">{t.daySheet}</p>
      </div>
    </div>
  );
}
