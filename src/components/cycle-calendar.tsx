import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
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

export function CycleCalendar({
  lastStart,
  cycleLength = 28,
  periodLength = 5,
  periodStarts = [],
  periodDays = [],
  onSelect,
}: {
  lastStart: string | null;
  cycleLength?: number;
  periodLength?: number;
  periodStarts?: string[];
  periodDays?: string[];
  onSelect?: (iso: string) => void;
}) {
  const { t, lang } = useI18n();
  const today = todayISO();
  const now = fromISO(today);
  const [cursor, setCursor] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const [picked, setPicked] = useState(today);
  const weekdays = lang === "es" ? ["L", "M", "X", "J", "V", "S", "D"] : ["M", "T", "W", "T", "F", "S", "S"];
  const months = lang === "es" ? MONTHS_ES : MONTHS_EN;
  const cells = useMemo(() => monthCells(cursor.y, cursor.m), [cursor.y, cursor.m]);

  function mark(iso: string): DayMark | null {
    return markForDate(iso, { lastStart, cycleLength, periodLength, periodStarts, periodDays });
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

  const marks = cells.map((c) => mark(c.iso));

  function shape(i: number, m: DayMark | null) {
    const run = m === "period" || m === "fertile" || m === "peak";
    if (!run) return "rounded-md";
    const kind = m === "peak" ? "fertile" : m;
    const col = i % 7;
    const prev = col > 0 && (marks[i - 1] === kind || (kind === "fertile" && marks[i - 1] === "peak"));
    const next = col < 6 && (marks[i + 1] === kind || (kind === "fertile" && marks[i + 1] === "peak"));
    if (!prev && !next) return "rounded-lg";
    if (!prev && next) return "rounded-l-lg rounded-r-sm";
    if (prev && !next) return "rounded-r-lg rounded-l-sm";
    return "rounded-sm";
  }

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
        <p className="text-base font-medium">{months[cursor.m]} {cursor.y}</p>
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
          const fill =
            m === "period"
              ? "bg-cal-period text-primary-fg"
              : m === "peak" || m === "fertile"
                ? "bg-cal-fertile text-ink"
                : "text-fg";
          return (
            <button
              key={cell.iso}
              type="button"
              onClick={() => choose(cell.iso)}
              className={cn(
                "relative mx-0.5 flex aspect-square min-h-10 items-center justify-center text-sm tabular-nums",
                shape(i, m),
                !cell.inMonth && "opacity-30",
                fill,
                isPicked && "ring-2 ring-primary ring-offset-1 ring-offset-surface",
                isToday && "font-semibold",
              )}
            >
              {cell.date}
              {m === "peak" ? (
                <span className="absolute bottom-1 size-1.5 rounded-full bg-cal-peak" />
              ) : null}
            </button>
          );
        })}
      </div>
      <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted">
        <li className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-4 rounded-sm bg-cal-period" /> {t.legendPeriod}
        </li>
        <li className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-4 rounded-sm bg-cal-fertile" /> {t.legendFertile}
        </li>
        <li className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-cal-peak" /> {t.legendPeak}
        </li>
      </ul>
      <div className="mt-4 border-t border-border pt-3">
        <p className="font-medium">
          {formatDay(picked, lang)}
          {dayNum ? ` · ${t.dayOf} ${dayNum}` : ""}
          {phase !== "none" ? ` · ${pick(phaseName[phase], lang)}` : ""}
        </p>
        <p className="mt-1 text-sm text-muted">{caption}</p>
      </div>
    </div>
  );
}
