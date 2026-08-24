import { differenceInCalendarDays } from "date-fns";
import type { DailyLog, Phase, SaviaProfile, Stage } from "@/lib/types";

export function todayISO(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function fromISO(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y!, (m || 1) - 1, d || 1);
}

export function addDaysISO(iso: string, n: number) {
  const dt = fromISO(iso);
  dt.setDate(dt.getDate() + n);
  return todayISO(dt);
}

export function cycleDay(lastStart: string | null, cycleLength: number, day = todayISO()): number | null {
  if (!lastStart) return null;
  const len = Math.max(cycleLength, 21);
  const diff = differenceInCalendarDays(fromISO(day), fromISO(lastStart));
  return ((diff % len) + len) % len + 1;
}

export function ovulationDayNum(periodLength: number, cycleLength: number) {
  const luteal = 14;
  return Math.max(periodLength + 2, cycleLength - luteal);
}

export function phaseForDay(dayNum: number | null, periodLength: number, cycleLength: number): Phase {
  if (!dayNum) return "none";
  const ovulation = ovulationDayNum(periodLength, cycleLength);
  if (dayNum <= periodLength) return "menstrual";
  if (dayNum >= ovulation - 1 && dayNum <= ovulation + 1) return "ovulatory";
  if (dayNum < ovulation) return "follicular";
  return "luteal";
}

export function pregnancyWeek(dueDate: string | null, day = todayISO()): number | null {
  if (!dueDate) return null;
  const conception = addDaysISO(dueDate, -280);
  const w = Math.floor(differenceInCalendarDays(fromISO(day), fromISO(conception)) / 7) + 1;
  if (w < 1) return 1;
  if (w > 42) return 42;
  return w;
}

export function nextPeriodDate(lastStart: string | null, cycleLength: number): string | null {
  if (!lastStart) return null;
  return addDaysISO(lastStart, cycleLength);
}

export function isCycling(stage: Stage) {
  return stage === "cycle" || stage === "peri" || stage === "postpartum";
}

export type DayMark = "period" | "fertile" | "peak" | "quiet";

export function markForDate(
  iso: string,
  opts: {
    lastStart: string | null;
    cycleLength: number;
    periodLength: number;
    periodStarts?: string[];
    periodDays?: string[];
  },
): DayMark | null {
  if (!opts.lastStart) return null;
  if (opts.periodDays?.includes(iso)) return "period";
  const plen = Math.max(opts.periodLength, 2);
  for (const start of opts.periodStarts || []) {
    const diff = differenceInCalendarDays(fromISO(iso), fromISO(start));
    if (diff >= 0 && diff < plen) return "period";
  }
  const n = cycleDay(opts.lastStart, opts.cycleLength, iso);
  if (!n) return null;
  if (n <= plen) return "period";
  const ov = ovulationDayNum(plen, opts.cycleLength);
  if (n === ov) return "peak";
  if (n >= ov - 5 && n <= ov + 1) return "fertile";
  return "quiet";
}

export function monthCells(year: number, month0: number) {
  const first = new Date(year, month0, 1);
  const mondayFirst = (first.getDay() + 6) % 7;
  const cells: { iso: string; inMonth: boolean; date: number }[] = [];
  for (let i = 0; i < mondayFirst; i++) {
    const dt = new Date(year, month0, 1 - (mondayFirst - i));
    cells.push({ iso: todayISO(dt), inMonth: false, date: dt.getDate() });
  }
  const days = new Date(year, month0 + 1, 0).getDate();
  for (let d = 1; d <= days; d++) {
    const dt = new Date(year, month0, d);
    cells.push({ iso: todayISO(dt), inMonth: true, date: d });
  }
  while (cells.length % 7 !== 0) {
    const last = fromISO(cells[cells.length - 1]!.iso);
    last.setDate(last.getDate() + 1);
    cells.push({ iso: todayISO(last), inMonth: false, date: last.getDate() });
  }
  return cells;
}

export function snapshotMeta(profile: SaviaProfile, day = todayISO()) {
  if (profile.stage === "pregnancy") {
    return {
      cycleDay: null as number | null,
      phase: "none" as Phase,
      pregnancyWeek: pregnancyWeek(profile.dueDate, day),
    };
  }
  if (profile.stage === "meno") {
    return { cycleDay: null as number | null, phase: "none" as Phase, pregnancyWeek: null as number | null };
  }
  const dayNum = cycleDay(profile.lastPeriodStart, profile.cycleLength, day);
  return {
    cycleDay: dayNum,
    phase: phaseForDay(dayNum, profile.periodLength, profile.cycleLength),
    pregnancyWeek: null as number | null,
  };
}

export function periodDaysFromLogs(logs: DailyLog[]) {
  return logs.filter((l) => l.periodStarted || (l.flow !== "none" && l.flow !== "spotting")).map((l) => l.day);
}

export function fertileWindow(lastStart: string | null, cycleLength: number, periodLength: number) {
  if (!lastStart) return null;
  const ov = ovulationDayNum(periodLength, cycleLength);
  return {
    start: addDaysISO(lastStart, ov - 5 - 1),
    peak: addDaysISO(lastStart, ov - 1),
    end: addDaysISO(lastStart, ov),
    ovDay: ov,
  };
}

export function cycleGaps(starts: string[]) {
  const ordered = [...starts].map((s) => s.slice(0, 10)).sort();
  const gaps: number[] = [];
  for (let i = 1; i < ordered.length; i++) {
    const n = differenceInCalendarDays(fromISO(ordered[i]!), fromISO(ordered[i - 1]!));
    if (n >= 18 && n <= 60) gaps.push(n);
  }
  return gaps;
}

export function learnedCycle(prevStart: string | null, newStart: string, fallback: number) {
  if (!prevStart || prevStart === newStart) return fallback;
  const gap = differenceInCalendarDays(fromISO(newStart), fromISO(prevStart));
  if (gap < 18 || gap > 45) return fallback;
  return gap;
}

export const CYCLE_CHOICES = [21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 32, 35];

export function averageCycle(starts: string[], fallback: number) {
  const gaps = cycleGaps(starts);
  if (!gaps.length) return fallback;
  return Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length);
}

/** Recent cycles weigh more. Not ML: Ogino + her own gaps. */
export function weightedCycle(starts: string[], fallback: number) {
  const gaps = cycleGaps(starts);
  if (!gaps.length) return fallback;
  let sum = 0;
  let w = 0;
  gaps.forEach((g, i) => {
    const weight = i === gaps.length - 1 ? 3 : i === gaps.length - 2 ? 2 : 1;
    sum += g * weight;
    w += weight;
  });
  return Math.round(sum / w);
}

export function predictPeriod(
  lastStart: string | null,
  starts: string[],
  fallback: number,
  stage: Stage = "cycle",
) {
  const p = cyclePattern(starts, fallback);
  const len = weightedCycle(starts, fallback);
  const next = nextPeriodDate(lastStart, len);
  if (!next) return { next: null, from: null, to: null, pad: 0, n: p.n, len, irregular: p.irregular };
  let pad = p.n < 1 ? 3 : p.n < 3 ? Math.max(2, Math.ceil(p.variation / 2) || 2) : Math.max(1, Math.ceil(p.variation / 2));
  if (stage === "peri" || p.irregular) pad = Math.max(pad, 4);
  return {
    next,
    from: addDaysISO(next, -pad),
    to: addDaysISO(next, pad),
    pad,
    n: p.n,
    len,
    irregular: p.irregular,
  };
}

export function cyclePattern(starts: string[], fallback: number) {
  const gaps = cycleGaps(starts);
  if (!gaps.length) {
    return { avg: fallback, min: fallback, max: fallback, variation: 0, n: 0, irregular: false };
  }
  const min = Math.min(...gaps);
  const max = Math.max(...gaps);
  const avg = Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length);
  return {
    avg,
    min,
    max,
    variation: max - min,
    n: gaps.length,
    irregular: max - min >= 8 || min < 21 || max > 35,
  };
}

export function symptomByPhase(logs: DailyLog[], lastStart: string | null, cycleLength: number, periodLength: number) {
  const buckets: Record<string, Record<string, number>> = {
    menstrual: {},
    follicular: {},
    ovulatory: {},
    luteal: {},
  };
  for (const log of logs) {
    const n = cycleDay(lastStart, cycleLength, log.day);
    const phase = phaseForDay(n, periodLength, cycleLength);
    if (phase === "none") continue;
    for (const s of log.symptoms) {
      buckets[phase]![s] = (buckets[phase]![s] || 0) + 1;
    }
  }
  return (Object.keys(buckets) as Array<keyof typeof buckets>).map((phase) => {
    const entries = Object.entries(buckets[phase] || {}).sort((a, b) => b[1] - a[1]);
    return { phase, top: entries.slice(0, 3).map(([id, count]) => ({ id, count })) };
  });
}

export function sampleLastStart(cycleDayWanted = 24) {
  return addDaysISO(todayISO(), -(cycleDayWanted - 1));
}

export function formatDay(iso: string, lang: "es" | "en" = "es") {
  return fromISO(iso).toLocaleDateString(lang === "es" ? "es-VE" : "en-US", {
    day: "numeric",
    month: "short",
  });
}

export function formatLong(iso: string, lang: "es" | "en" = "es") {
  return fromISO(iso).toLocaleDateString(lang === "es" ? "es-VE" : "en-US", {
    day: "numeric",
    month: "long",
  });
}

export function daysUntil(iso: string | null, from = todayISO()) {
  if (!iso) return null;
  return differenceInCalendarDays(fromISO(iso), fromISO(from));
}

export function weekStrip(iso = todayISO()) {
  const d = fromISO(iso);
  const js = d.getDay();
  const fromMon = js === 0 ? 6 : js - 1;
  const mon = new Date(d);
  mon.setDate(d.getDate() - fromMon);
  return Array.from({ length: 7 }, (_, i) => {
    const x = new Date(mon);
    x.setDate(mon.getDate() + i);
    return { iso: todayISO(x), date: x.getDate(), dow: i };
  });
}
