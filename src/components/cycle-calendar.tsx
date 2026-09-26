import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, Heart } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  dayInfo,
  dayStatus,
  formatDay,
  fromISO,
  monthCells,
  todayISO,
  type DayInfo,
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
  const [legendOpen, setLegendOpen] = useState(false);
  const weekdays = lang === "es" ? ["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"] : ["M", "T", "W", "T", "F", "S", "S"];
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

  const pickedInfo = info(picked);
  const selectedMark = pickedInfo.mark;
  const dayNum = pickedInfo.cycleDay;
  const phase = pickedInfo.phase;

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

  const pickedLog = logByDay[picked];
  const pickedConfirmed = pickedInfo.confirmed;

  const status = dayStatus(selectedMark, pickedConfirmed);
  const pickedSex = sexSet.has(picked) || Boolean(pickedLog?.sex);
  const pickedSexKind = sexKindByDay[picked] || (pickedLog?.sex ? "unprotected" : "none");

  const statusTitle =
    status === "period"
      ? t.calStatusPeriod
      : status === "predicted"
        ? t.calStatusPredicted
        : status === "peak"
          ? t.calStatusPeak
          : status === "fertile"
            ? t.calStatusFertile
            : status === "quiet"
              ? t.calStatusQuiet
              : t.calStatusNone;
  const statusSub =
    status === "period"
      ? t.calStatusPeriodSub
      : status === "predicted"
        ? t.calStatusPredictedSub
        : status === "quiet"
          ? t.calStatusQuietSub
          : null;
  const hot = status === "peak" || status === "fertile";

  return (
    <div>
      <div
        data-testid="cal-status"
        data-status={status ?? "none"}
        className={cn(
          "mb-4 flex items-start gap-3 rounded-[22px] border px-4 py-3.5",
          hot
            ? "card-fert"
            : status === "period" || status === "predicted"
              ? "border-[rgb(255_77_132/0.3)] bg-[linear-gradient(135deg,rgb(255_77_132/0.16),rgb(155_92_255/0.08))]"
              : "glass",
        )}
        aria-live="polite"
      >
        <StatusDot status={status} />
        <div className="min-w-0 flex-1">
          <p className={cn("kicker", hot ? "!text-[#6FE0D2]" : status === "period" || status === "predicted" ? "!text-label" : "")}>
            {picked === today ? `${t.calStatusToday} · ` : ""}
            {formatDay(picked, lang)}
            {dayNum ? ` · ${t.dayOf} ${dayNum}` : ""}
          </p>
          <p className="mt-1 font-display text-[17px] font-semibold leading-tight tracking-[-0.02em]">{statusTitle}</p>
          {statusSub || phase !== "none" ? (
            <p className="mt-0.5 text-[12.5px] leading-snug text-soft">
              {phase !== "none" ? pick(phaseName[phase], lang) : null}
              {phase !== "none" && statusSub ? " · " : null}
              {statusSub}
            </p>
          ) : null}
          {pickedSex ? (
            <p className="mt-1.5 inline-flex items-center gap-1.5 text-[12.5px] text-soft">
              <SexHeart kind={pickedSexKind} />
              {pickedSexKind === "protected"
                ? t.relationsProtected
                : pickedSexKind === "withdrawal"
                  ? t.relationsWithdrawal
                  : t.relationsUnprotected}
            </p>
          ) : null}
          <p className="mt-1.5 text-[11px] leading-snug text-muted">{t.calShortDisclaimer}</p>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <button
          type="button"
          className="inline-flex size-11 items-center justify-center rounded-full ring-1 ring-white/10 hover:bg-surface-2"
          onClick={() => moveMonth(-1)}
          aria-label="prev"
        >
          <ChevronLeft className="size-5" strokeWidth={1.5} />
        </button>
        <p className="font-display text-2xl font-semibold tracking-[-0.035em]">
          {months[cursor.m]} {cursor.y}
        </p>
        <button
          type="button"
          className="inline-flex size-11 items-center justify-center rounded-full ring-1 ring-white/10 hover:bg-surface-2"
          onClick={() => moveMonth(1)}
          aria-label="next"
        >
          <ChevronRight className="size-5" strokeWidth={1.5} />
        </button>
      </div>
      <div className="mt-2 grid grid-cols-7 text-center font-mono text-[10.5px] uppercase tracking-[0.1em] text-muted">
        {weekdays.map((w, i) => (
          <div key={`${w}-${i}`} className="py-2">
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((cell, i) => {
          const ci = infos[i]!;
          const m = ci.mark;
          const isToday = cell.iso === today;
          const isPicked = cell.iso === picked;
          const logged = logByDay[cell.iso];
          const flow = logged?.flow;
          const hasLoggedFlow =
            flow === "heavy" || flow === "medium" || flow === "light" || flow === "spotting";
          const isConfirmed = ci.confirmed;
          const isPredicted = m === "period" && !isConfirmed;
          const isPeak = m === "peak" && !isConfirmed;
          const isFertile = m === "fertile" && !isConfirmed;
          // Period fill already says "flow": only show the dot for spotting / off-period flow.
          const hasFlowMark = hasLoggedFlow && !isConfirmed;
          const hasMood = Boolean(
            logged && ((logged.mood != null && logged.mood > 0) || logged.symptoms.length > 0),
          );
          const hasSex = sexSet.has(cell.iso) || Boolean(logged?.sex);
          const sexKind = sexKindByDay[cell.iso] || (logged?.sex ? "unprotected" : "none");

          return (
            <button
              key={cell.iso}
              type="button"
              onClick={() => choose(cell.iso)}
              aria-label={cell.iso}
              aria-current={isToday ? "date" : undefined}
              aria-pressed={isPicked}
              data-status={dayStatus(m, isConfirmed) ?? "none"}
              data-sex={hasSex ? sexKind : undefined}
              className={cn(
                "press flex min-h-11 flex-col items-center justify-center gap-0.5 py-0.5",
                !cell.inMonth && "opacity-30",
              )}
            >
              <span
                className={cn(
                  "relative flex size-10 items-center justify-center rounded-full text-sm tabular-nums transition-shadow sm:size-11",
                  // Confirmed period — filled berry with a soft glow
                  isConfirmed &&
                    "bg-cal-period font-semibold text-white shadow-[0_0_16px_-4px_rgb(255_77_132/0.7)]",
                  // Predicted period — dotted outline, never filled
                  isPredicted && "border-2 border-dotted border-cal-period bg-transparent font-medium text-rose-dust",
                  // Fertile window — aqua tint; ovulation stronger (solid ring + marker)
                  isFertile && "bg-cal-fertile font-semibold text-[#8ff0e4] ring-1 ring-inset ring-cal-peak/35",
                  isPeak &&
                    "bg-cal-peak/30 font-semibold text-white ring-2 ring-cal-peak shadow-[0_0_16px_-4px_rgb(111_224_210/0.75)]",
                  // Non-fertile / quiet days stay neutral
                  !isConfirmed && !isPredicted && !isFertile && !isPeak && "text-fg/80",
                  isToday && !isConfirmed && !isPredicted && !isFertile && !isPeak && "bg-white/[0.1] font-semibold text-white",
                  isToday && "font-semibold",
                  // Selected — pearl outline (always)
                  isPicked && "outline-2 outline-offset-2 outline-white/90",
                )}
              >
                {cell.date}
                {isToday ? (
                  <span className="absolute top-0.5 size-1 rounded-full bg-white/90" aria-hidden />
                ) : null}
                {isPeak ? (
                  <span
                    className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-cal-peak ring-2 ring-bg"
                    aria-hidden
                  />
                ) : null}
              </span>
              <span className="flex h-3 min-h-[12px] items-center justify-center gap-[3px]" aria-hidden>
                {hasSex ? <SexHeart kind={sexKind} /> : null}
                {hasFlowMark ? (
                  <span
                    className={cn("size-1 rounded-full", flow === "spotting" ? "bg-cal-period/60" : "bg-cal-period")}
                    title={t.calMarkFlow}
                  />
                ) : null}
                {hasMood && !hasSex ? (
                  <span className="size-1 rounded-full bg-white/55" title={t.calMarkMood} />
                ) : null}
              </span>
            </button>
          );
        })}
      </div>
      <div className="mt-3 rounded-[18px] bg-white/[0.03] px-3 py-2.5 ring-1 ring-white/[0.06]" data-testid="cal-legend">
        <div className="flex items-center justify-between gap-2">
          <ul className="flex flex-wrap gap-x-3.5 gap-y-1.5 text-xs text-soft">
            <li className="inline-flex items-center gap-1.5">
              <span className="size-3 rounded-full bg-cal-period" /> {t.legendPeriod}
            </li>
            <li className="inline-flex items-center gap-1.5">
              <span className="size-3 rounded-full bg-cal-fertile ring-1 ring-cal-peak/50" /> {t.legendFertileShort}
            </li>
            <li className="inline-flex items-center gap-1.5">
              <SexHeart kind="unprotected" /> {t.legendSexUnprotected}
            </li>
          </ul>
          <button
            type="button"
            className="inline-flex min-h-9 shrink-0 items-center gap-1 text-xs font-semibold text-rose-dust"
            aria-expanded={legendOpen}
            onClick={() => setLegendOpen((v) => !v)}
          >
            {legendOpen ? t.hideSymbols : t.showSymbols}
            <ChevronDown className={cn("size-3.5 transition-transform", legendOpen && "rotate-180")} strokeWidth={1.8} />
          </button>
        </div>
        {legendOpen ? (
          <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-white/[0.06] pt-2.5 text-xs text-soft">
            <li className="inline-flex items-center gap-1.5">
              <span className="size-3 rounded-full border-2 border-dotted border-cal-period bg-transparent" />
              {t.legendPeriodPredicted}
            </li>
            <li className="inline-flex items-center gap-1.5">
              <span className="relative size-3 rounded-full bg-cal-peak/30 ring-2 ring-cal-peak">
                <span className="absolute -right-1 -top-1 size-1.5 rounded-full bg-cal-peak" />
              </span>
              {t.legendPeak}
            </li>
            <li className="inline-flex items-center gap-1.5">
              <SexHeart kind="protected" /> {t.legendSexProtectedFull}
            </li>
            <li className="inline-flex items-center gap-1.5">
              <span className="relative flex size-3 items-center justify-center rounded-full bg-white/[0.1]">
                <span className="absolute top-0 size-1 rounded-full bg-white/90" />
              </span>
              {t.legendToday}
            </li>
            <li className="inline-flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-cal-period" /> {t.calMarkFlow}
            </li>
            <li className="inline-flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-white/55" /> {t.calMarkMood}
            </li>
          </ul>
        ) : null}
      </div>
      <button
        type="button"
        className="press glass mt-3 flex min-h-11 w-full items-center justify-center rounded-full text-sm font-semibold"
        onClick={() => onSelect?.(picked)}
      >
        {t.editDayCta}
      </button>
    </div>
  );
}

/** Fine-line heart: filled = unprotected (or withdrawal, softer), outline = protected. */
export function SexHeart({ kind, className }: { kind: string; className?: string }) {
  const filled = kind !== "protected";
  return (
    <Heart
      className={cn(
        "size-3 shrink-0 text-cal-period",
        filled ? "fill-current" : "fill-none text-rose-dust",
        kind === "withdrawal" && "opacity-75",
        className,
      )}
      strokeWidth={1.6}
      aria-hidden
    />
  );
}

function StatusDot({ status }: { status: ReturnType<typeof dayStatus> }) {
  return (
    <span aria-hidden className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full bg-white/[0.05] ring-1 ring-white/10">
      <span
        className={cn(
          "relative size-4 rounded-full",
          status === "period" && "bg-cal-period shadow-[0_0_12px_rgb(255_77_132/0.7)]",
          status === "predicted" && "border-2 border-dotted border-cal-period",
          status === "fertile" && "bg-cal-peak/55 ring-1 ring-cal-peak",
          status === "peak" && "bg-cal-peak shadow-[0_0_12px_rgb(111_224_210/0.8)]",
          (status === "quiet" || !status) && "bg-white/20",
        )}
      />
    </span>
  );
}
