import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Heart } from "lucide-react";
import { useV4 } from "@/lib/i18n-v4";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  addDaysISO,
  dayInfo,
  dayStatus,
  formatDay,
  fromISO,
  monthCells,
  todayISO,
  type DayInfo,
} from "@/lib/cycle";
import { useClientTodayISO } from "@/lib/use-today";

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
  focusDay = null,
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
  focusDay?: string | null;
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
  const months = lang === "es" ? MONTHS_ES : MONTHS_EN;
  const cells = useMemo(() => monthCells(cursor.y, cursor.m), [cursor.y, cursor.m]);

  // After mount, snap to browser-local today (SSR may have used UTC).
  // Prefer focusDay (toast / handoff) when present.
  useEffect(() => {
    const target = focusDay || clientToday;
    if (!target) return;
    const n = fromISO(target);
    setCursor({ y: n.getFullYear(), m: n.getMonth() });
    setPicked(target);
  }, [clientToday, focusDay]);

  void showFertile; // always-on; prop kept for callers
  // Same rules as Hoy (dayInfo): one day number / phase / mark per date.
  function info(iso: string): DayInfo {
    return dayInfo(iso, { lastStart, cycleLength, periodLength, periodStarts, periodDays, today });
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


  // Prefer union so a mark never depends on which prop arrived first.
  const sexSet = useMemo(() => {
    const s = new Set<string>(sexDays);
    for (const m of sexMarks) s.add(m.day);
    return s;
  }, [sexDays, sexMarks]);
  const sexKindByDay = useMemo(
    () => Object.fromEntries(sexMarks.map((s) => [s.day, s.kind])),
    [sexMarks],
  );
  const logByDay = useMemo(() => Object.fromEntries(logs.map((l) => [l.day, l])), [logs]);
  const infos = cells.map((c) => info(c.iso));

  const { v } = useV4();
  // Extra week after the grid (next month's first days) so the predicted period stays visible.
  const lastCell = cells[cells.length - 1]!;
  const extra = Array.from({ length: 7 }, (_, k) => {
    const iso = addDaysISO(lastCell.iso, k + 1);
    const d = fromISO(iso);
    return { iso, date: d.getDate(), inMonth: false, month: d.getMonth() };
  });
  const extraInfos = extra.map((c) => info(c.iso));
  const weekLetters = lang === "es" ? ["L", "M", "M", "J", "V", "S", "D"] : ["M", "T", "W", "T", "F", "S", "S"];
  type C = { iso: string; date: number; inMonth: boolean };
  const kindOf = (ci: DayInfo) => {
    const m = ci.mark;
    if (ci.confirmed) return "regla" as const;
    if (m === "period") return "pred" as const;
    if (m === "peak") return "ovu" as const;
    if (m === "fertile") return "fert" as const;
    return null;
  };
  function renderRow(row: C[], rowInfos: DayInfo[], key: string) {
    return row.map((cell, col) => {
      const ci = rowInfos[col]!;
      const k = kindOf(ci);
      const band = k === "regla" ? "regla" : k === "fert" || k === "ovu" ? "fert" : null;
      const prevK = col > 0 ? kindOf(rowInfos[col - 1]!) : null;
      const nextK = col < 6 ? kindOf(rowInfos[col + 1]!) : null;
      const same = (x: ReturnType<typeof kindOf>) =>
        band === "regla" ? x === "regla" : band === "fert" ? x === "fert" || x === "ovu" : false;
      const isToday = cell.iso === today;
      const isPicked = cell.iso === picked;
      const logged = logByDay[cell.iso];
      const flow = logged?.flow;
      const hasLoggedFlow = flow === "heavy" || flow === "medium" || flow === "light" || flow === "spotting";
      const hasEntry = Boolean(
        logged && ((logged.mood != null && logged.mood > 0) || logged.symptoms.length > 0 || (hasLoggedFlow && !ci.confirmed)),
      );
      const hasSex = sexSet.has(cell.iso) || Boolean(logged?.sex);
      const sexKind = sexKindByDay[cell.iso] || (logged?.sex ? "unprotected" : "none");
      const st = dayStatus(ci.mark, ci.confirmed);
      return (
        <button
          key={`${key}-${cell.iso}`}
          type="button"
          onClick={() => choose(cell.iso)}
          aria-label={`${formatDay(cell.iso, lang)}${statusWord(st, t) ? ` · ${statusWord(st, t)}` : ""}${hasSex ? ` · ${t.legendSexUnprotected.split(" ")[0]}` : ""}`}
          data-day={cell.iso}
          aria-current={isToday ? "date" : undefined}
          aria-pressed={isPicked}
          data-status={st ?? "none"}
          data-sex={hasSex ? sexKind : undefined}
          className={cn(
            "v4-day press",
            band,
            band && !same(prevK) && "cs",
            band && !same(nextK) && "ce",
            k === "ovu" && "ovu",
            k === "pred" && "pred",
            !cell.inMonth && "out",
            cell.iso > today && "fut",
            isToday && "today",
          )}
        >
          <span className="n">{cell.date}</span>
          <span className="marks" aria-hidden>
            {hasSex ? <SexHeart kind={sexKind} className="size-[9px]" /> : null}
            {hasEntry ? <i className="v4-ld" title={t.calMarkMood} /> : null}
          </span>
        </button>
      );
    });
  }
  const gridRows: { row: C[]; infos: DayInfo[] }[] = [];
  for (let r = 0; r < cells.length; r += 7) gridRows.push({ row: cells.slice(r, r + 7), infos: infos.slice(r, r + 7) });
  const extraMonth = extra[0]!.month !== cursor.m ? extra[0]!.month : extra[6]!.month;
  const showExtraLabel = extra.some((c) => c.month !== cursor.m);
  // Leading days of the previous month are greyed; trailing next-month days read normally.

  return (
    <div data-testid="cal-v4">
      <div className="flex items-end justify-between px-2 pt-2.5">
        <h1 className="v4-h1 !text-[40px]" aria-live="polite">
          {months[cursor.m]}
          {cursor.y !== now.getFullYear() ? ` ${cursor.y}` : ""}
        </h1>
        <div className="flex gap-2">
          <button type="button" className="v4-ib press" onClick={() => moveMonth(-1)} aria-label={v.prevMonth}>
            <ChevronLeft className="size-5" strokeWidth={1.8} />
          </button>
          <button type="button" className="v4-ib press" onClick={() => moveMonth(1)} aria-label={v.nextMonth}>
            <ChevronRight className="size-5" strokeWidth={1.8} />
          </button>
        </div>
      </div>
      <div className="v4-key" data-testid="cal-legend">
        <span>
          <i className="v4-k regla" />
          {v.legendPeriod}
        </span>
        <span>
          <i className="v4-k fert" />
          {v.legendFertile}
        </span>
        <span>
          <i className="v4-k pred" />
          {v.legendPredicted}
        </span>
      </div>
      <div className="v4-wk" aria-hidden>
        {weekLetters.map((w, i) => (
          <span key={`${w}-${i}`}>{w}</span>
        ))}
      </div>
      <div className="v4-cg">
        {gridRows.map((r, ri) =>
          renderRow(
            r.row.map((c) => ({ ...c, inMonth: c.inMonth || (ri > 0 && !c.inMonth) })),
            r.infos,
            `r${ri}`,
          ),
        )}
      </div>
      {showExtraLabel ? <p className="v4-mo">{months[extraMonth]}</p> : null}
      <div className="v4-cg">{renderRow(extra, extraInfos, "x")}</div>
    </div>
  );
}

function statusWord(st: ReturnType<typeof dayStatus>, t: { legendPeriod: string; legendPeriodPredicted: string; legendPeak: string; legendFertileShort: string }): string {
  if (st === "period") return t.legendPeriod;
  if (st === "predicted") return t.legendPeriodPredicted;
  if (st === "peak") return t.legendPeak;
  if (st === "fertile") return t.legendFertileShort;
  return "";
}

/** Fine-line heart: filled = unprotected (or withdrawal, softer), outline = protected. */
export function SexHeart({ kind, className }: { kind: string; className?: string }) {
  const filled = kind !== "protected";
  return (
    <Heart
      className={cn(
        "size-3 shrink-0 text-regla",
        filled ? "fill-current" : "fill-none",
        kind === "withdrawal" && "opacity-75",
        className,
      )}
      strokeWidth={1.6}
      aria-hidden
    />
  );
}
