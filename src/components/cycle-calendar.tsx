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

export function CycleCalendar({
  lastStart,
  cycleLength = 28,
  periodLength = 5,
  periodStarts = [],
  periodDays = [],
  sexDays = [],
  sexMarks = [],
  logs = [],
  paid = false,
  onSelect,
  onSetSex,
}: {
  lastStart: string | null;
  cycleLength?: number;
  periodLength?: number;
  periodStarts?: string[];
  periodDays?: string[];
  sexDays?: string[];
  sexMarks?: { day: string; kind: string }[];
  logs?: { day: string; flow: string; symptoms: string[] }[];
  paid?: boolean;
  onSelect?: (iso: string) => void;
  onSetSex?: (iso: string, kind: "protected" | "unprotected" | "withdrawal") => void;
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

  const sexSet = useMemo(() => new Set(sexDays.length ? sexDays : sexMarks.map((s) => s.day)), [sexDays, sexMarks]);
  const kindByDay = useMemo(() => Object.fromEntries(sexMarks.map((s) => [s.day, s.kind])), [sexMarks]);
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
        <p className="text-lg font-extrabold">{months[cursor.m]} {cursor.y}</p>
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
          const hasSex = sexSet.has(cell.iso);
          const hasDot = Boolean(logged && (logged.symptoms.length || flow && flow !== "none"));
          return (
            <button
              key={cell.iso}
              type="button"
              onClick={() => choose(cell.iso)}
              className={cn(
                "flex aspect-square items-center justify-center",
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
                {hasSex ? (
                  <Heart
                    className={cn(
                      "absolute bottom-0.5 size-2.5 fill-current",
                      m === "period" || flow === "heavy" || flow === "medium" ? "text-primary-fg" : "text-primary",
                    )}
                  />
                ) : hasDot ? (
                  <span className="absolute bottom-1 size-1.5 rounded-full bg-ink/70" />
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
        <li className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-cal-fertile" /> {t.legendFertile}
        </li>
        <li className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-cal-peak" /> {t.legendPeak}
        </li>
        <li className="inline-flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-ink/70" /> {t.calDot}
        </li>
      </ul>
      <div className="mt-4 border-t border-border pt-3">
        <p className="font-medium">
          {formatDay(picked, lang)}
          {dayNum ? ` · ${t.dayOf} ${dayNum}` : ""}
          {phase !== "none" ? ` · ${pick(phaseName[phase], lang)}` : ""}
        </p>
        <p className="mt-1 text-sm text-muted">{caption}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {(
            [
              ["protected", t.sexProtected],
              ["unprotected", t.sexUnprotected],
              ["withdrawal", t.sexWithdrawal],
            ] as const
          ).map(([kind, label]) => {
            const on = kindByDay[picked] === kind;
            return (
              <button
                key={kind}
                type="button"
                onClick={() => onSetSex?.(picked, kind)}
                className={cn(
                  "inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-xs font-medium",
                  on ? "bg-primary text-primary-fg" : "bg-bg text-fg",
                )}
              >
                <Heart className={cn("size-3.5", on && "fill-current")} />
                {label}
              </button>
            );
          })}
        </div>
        {paid ? null : <p className="mt-2 text-xs text-muted">{t.sexPay}</p>}
      </div>
    </div>
  );
}
