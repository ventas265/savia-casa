import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Heart } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  addDaysISO,
  cycleDay,
  formatDay,
  fromISO,
  markForDate,
  monthCells,
  phaseForDay,
  todayISO,
  type DayMark,
} from "@/lib/cycle";
import { useClientTodayISO } from "@/lib/use-today";
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
  showFertile = true,
  onSelect,
  onMonthChange,
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
  onMonthChange?: () => void;
  onSetSex?: (iso: string, kind: "protected" | "unprotected" | "withdrawal") => void;
}) {
  const { t, lang } = useI18n();
  const clientToday = useClientTodayISO();
  const today = clientToday ?? todayISO();
  const now = fromISO(today);
  const [cursor, setCursor] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const [picked, setPicked] = useState(today);
  const weekdays = lang === "es" ? ["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"] : ["M", "T", "W", "T", "F", "S", "S"];
  const months = lang === "es" ? MONTHS_ES : MONTHS_EN;
  const cells = useMemo(() => monthCells(cursor.y, cursor.m), [cursor.y, cursor.m]);

  // After mount, snap to browser-local today (SSR may have used UTC).
  useEffect(() => {
    if (!clientToday) return;
    const n = fromISO(clientToday);
    setCursor({ y: n.getFullYear(), m: n.getMonth() });
    setPicked(clientToday);
  }, [clientToday]);

  void showFertile; // always-on; prop kept for callers
  function mark(iso: string): DayMark | null {
    // Fertile window always visible (avoid accidental pregnancy) — not opt-in.
    return markForDate(iso, { lastStart, cycleLength, periodLength, periodStarts, periodDays });
  }

  function choose(iso: string) {
    setPicked(iso);
    onSelect?.(iso);
  }

  function moveMonth(delta: -1 | 1) {
    const nm = cursor.m + delta;
    const next =
      nm < 0 ? { y: cursor.y - 1, m: 11 } : nm > 11 ? { y: cursor.y + 1, m: 0 } : { y: cursor.y, m: nm };
    const td = fromISO(today);
    const inMonth = td.getFullYear() === next.y && td.getMonth() === next.m;
    const nextPick = inMonth ? today : todayISO(new Date(next.y, next.m, 1));
    setCursor(next);
    setPicked(nextPick);
    onMonthChange?.();
  }

  const selectedMark = mark(picked);
  const dayNum = cycleDay(lastStart, cycleLength, picked);
  const phase = phaseForDay(dayNum, periodLength, cycleLength);

  const confirmedPeriod = useMemo(() => {
    const set = new Set(periodDays);
    const plen = Math.max(periodLength, 2);
    const starts = [...periodStarts];
    // Last start she told us counts as confirmed (filled), not a dotted estimate.
    if (lastStart && !starts.includes(lastStart)) starts.push(lastStart);
    for (const start of starts) {
      for (let i = 0; i < plen; i++) set.add(addDaysISO(start, i));
    }
    return set;
  }, [periodDays, periodStarts, periodLength, lastStart]);

  const sexSet = useMemo(() => new Set(sexDays.length ? sexDays : sexMarks.map((s) => s.day)), [sexDays, sexMarks]);
  const logByDay = useMemo(() => Object.fromEntries(logs.map((l) => [l.day, l])), [logs]);
  const marks = cells.map((c) => mark(c.iso));

  const pickedLog = logByDay[picked];
  const pickedFlow = pickedLog?.flow;
  const pickedConfirmed =
    confirmedPeriod.has(picked) ||
    pickedFlow === "heavy" ||
    pickedFlow === "medium" ||
    pickedFlow === "light";
  const pickedPredicted = selectedMark === "period" && !pickedConfirmed;

  const caption = pickedConfirmed
    ? t.legendPeriod
    : pickedPredicted
      ? t.legendPredicted
      : selectedMark === "peak"
        ? t.legendPeak
        : selectedMark === "fertile"
          ? t.legendFertile
          : selectedMark === "quiet"
            ? t.legendQuiet
            : selectedMark === "period"
              ? t.legendPeriod
              : t.calEmpty;

  return (
    <div>
      <div className="flex items-center justify-between">
        <button
          type="button"
          className="inline-flex size-11 items-center justify-center rounded-full hover:bg-surface-2"
          onClick={() => moveMonth(-1)}
          aria-label="prev"
        >
          <ChevronLeft className="size-5" />
        </button>
        <p className="font-display text-2xl font-semibold tracking-[-0.03em]">
          {months[cursor.m]} {cursor.y}
        </p>
        <button
          type="button"
          className="inline-flex size-11 items-center justify-center rounded-full hover:bg-surface-2"
          onClick={() => moveMonth(1)}
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
          const hasLoggedFlow =
            flow === "heavy" || flow === "medium" || flow === "light" || flow === "spotting";
          const isConfirmed =
            confirmedPeriod.has(cell.iso) ||
            flow === "heavy" ||
            flow === "medium" ||
            flow === "light";
          const isPredicted = m === "period" && !isConfirmed;
          const isFertile = (m === "peak" || m === "fertile") && !isConfirmed && !isPredicted;
          const hasFlowMark = hasLoggedFlow;
          const hasMood = Boolean(
            logged && ((logged.mood != null && logged.mood > 0) || logged.symptoms.length > 0),
          );
          const hasSex = sexSet.has(cell.iso) || Boolean(logged?.sex);
          const onDark =
            flow === "heavy" ||
            flow === "medium" ||
            (isConfirmed && flow !== "light" && flow !== "spotting");

          return (
            <button
              key={cell.iso}
              type="button"
              onClick={() => choose(cell.iso)}
              aria-label={cell.iso}
              aria-current={isToday ? "date" : undefined}
              aria-pressed={isPicked}
              className={cn(
                "press flex min-h-11 flex-col items-center justify-center gap-0.5 py-0.5",
                !cell.inMonth && "opacity-30",
              )}
            >
              <span
                className={cn(
                  "relative flex size-10 items-center justify-center rounded-full text-sm tabular-nums sm:size-11",
                  // Confirmed period — filled rose (flow intensity when logged)
                  flow === "heavy" && "bg-cal-period font-medium text-primary-fg",
                  flow === "medium" && "bg-primary/85 font-medium text-primary-fg",
                  flow === "light" && "bg-primary/45 font-medium text-ink",
                  isConfirmed &&
                    !hasLoggedFlow &&
                    "bg-cal-period font-medium text-primary-fg",
                  isConfirmed &&
                    flow === "spotting" &&
                    "bg-cal-period font-medium text-primary-fg",
                  // Predicted period — dotted ring, never filled
                  isPredicted &&
                    "border-2 border-dashed border-cal-period bg-transparent font-medium text-cal-period",
                  // Fertile (opt-in only)
                  isFertile && m === "peak" && "bg-cal-peak/25 font-medium text-ink",
                  isFertile && m === "fertile" && "bg-cal-fertile text-ink",
                  // Today — soft sand wash, not rose
                  isToday &&
                    !isConfirmed &&
                    !isPredicted &&
                    !isFertile &&
                    "bg-sand/55 font-semibold text-ink",
                  isToday && (isConfirmed || isPredicted || isFertile) && "font-semibold",
                  // Selected — strong outline (always)
                  isPicked && "ring-[3px] ring-primary ring-offset-2 ring-offset-surface",
                  !isConfirmed &&
                    !isPredicted &&
                    !isFertile &&
                    !isToday &&
                    "text-fg",
                )}
              >
                {cell.date}
                {isToday ? (
                  <span
                    className={cn(
                      "absolute top-0.5 size-1 rounded-full",
                      onDark ? "bg-primary-fg/90" : "bg-ink/55",
                    )}
                    aria-hidden
                  />
                ) : null}
              </span>
              <span className="flex h-3 min-h-[12px] items-center justify-center gap-0.5" aria-hidden>
                {hasFlowMark ? (
                  <span
                    className={cn(
                      "size-1.5 rounded-full",
                      flow === "spotting" ? "bg-primary/60" : "bg-cal-period",
                    )}
                    title={t.calMarkFlow}
                  />
                ) : null}
                {hasMood ? (
                  <span className="size-1.5 rounded-full bg-ink/65" title={t.calMarkMood} />
                ) : null}
                {hasSex ? <Heart className="size-2.5 fill-current text-primary" aria-label={t.legendSex} /> : null}
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
          <span className="size-2.5 rounded-full border-2 border-dashed border-cal-period bg-transparent" />{" "}
          {t.legendPredicted}
        </li>
        <li className="inline-flex items-center gap-1.5">
          <span className="relative flex size-2.5 items-center justify-center rounded-full bg-sand/80">
            <span className="absolute top-0 size-1 rounded-full bg-ink/55" />
          </span>{" "}
          {t.legendToday}
        </li>
        <li className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-cal-fertile" /> {t.legendFertile}
        </li>
        <li className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-cal-peak" /> {t.legendPeak}
        </li>
        <li className="inline-flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-cal-period" /> {t.calMarkFlow}
        </li>
        <li className="inline-flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-ink/65" /> {t.calMarkMood}
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
