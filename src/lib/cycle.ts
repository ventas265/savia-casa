import { differenceInCalendarDays } from "date-fns";
import type { DailyLog, Phase, SaviaProfile, Stage } from "@/lib/types";

/** Local calendar YYYY-MM-DD — never UTC (toISOString shifts the day). */
export function todayISO(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

/** Normalize any day-ish value to local-calendar YYYY-MM-DD (or null). */
export function asIsoDay(value: string | Date | null | undefined): string | null {
  if (value == null) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    // Prefer ISO date part when the instant is UTC midnight (DB date drivers);
    // otherwise use local Y-M-D so wall-clock dates stay sticky.
    const iso = value.toISOString();
    if (iso.endsWith("T00:00:00.000Z")) return iso.slice(0, 10);
    return todayISO(value);
  }
  const raw = String(value).trim();
  const sliced = raw.slice(0, 10);
  return ISO_DAY.test(sliced) ? sliced : null;
}

/** Parse YYYY-MM-DD as a local calendar date (not UTC midnight). */
export function fromISO(iso: string) {
  const day = String(iso).slice(0, 10);
  const [y, m, d] = day.split("-").map(Number);
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

export type DayMarkOpts = {
  lastStart: string | null;
  cycleLength: number;
  periodLength: number;
  periodStarts?: string[];
  periodDays?: string[];
  /** Local "today" (defaults to the device day). Past vs projected depends on it. */
  today?: string;
};

export function markForDate(iso: string, opts: DayMarkOpts): DayMark | null {
  return dayInfo(iso, opts).mark;
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

export function snapshotMeta(
  profile: SaviaProfile,
  day = todayISO(),
  extra: { starts?: string[]; periodDays?: string[] } = {},
) {
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
  const info = dayInfo(day, {
    lastStart: profile.lastPeriodStart,
    cycleLength: effectiveCycle(extra.starts ?? [], profile.cycleLength, profile.lastPeriodStart),
    periodLength: profile.periodLength,
    periodStarts: extra.starts,
    periodDays: extra.periodDays,
    today: day,
  });
  return {
    cycleDay: info.cycleDay,
    phase: info.phase,
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
  return predictRange(lastStart, starts, fallback, stage);
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


/** True when this day is covered by a logged/confirmed period start (not Ogino estimate alone). */
export function isConfirmedPeriodDay(
  iso: string,
  opts: {
    lastStart: string | null;
    periodLength: number;
    periodStarts?: string[];
    periodDays?: string[];
    log?: { periodStarted?: boolean; flow?: string } | null;
  },
) {
  const log = opts.log;
  if (log && (log.periodStarted || (log.flow && log.flow !== "none" && log.flow !== "spotting"))) {
    return true;
  }
  if (opts.periodDays?.includes(iso)) return true;
  const plen = Math.max(opts.periodLength, 2);
  const starts = [...(opts.periodStarts || [])];
  if (opts.lastStart && !starts.includes(opts.lastStart)) starts.push(opts.lastStart);
  for (const start of starts) {
    const diff = differenceInCalendarDays(fromISO(iso), fromISO(start));
    if (diff >= 0 && diff < plen) return true;
  }
  return false;
}

/** Inclusive local-calendar range check (ISO YYYY-MM-DD compares lexicographically). */
export function inDayRange(iso: string, from: string | null, to: string | null) {
  if (!from || !to) return false;
  return iso >= from && iso <= to;
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

export type DayStatus = "period" | "predicted" | "peak" | "fertile" | "quiet";

/**
 * One status per day for the calendar chip / day sheet: confirmed period wins,
 * then an Ogino period estimate (predicted), then the fertile estimate.
 */
export function dayStatus(mark: DayMark | null, confirmed: boolean): DayStatus | null {
  if (confirmed) return "period";
  if (!mark) return null;
  if (mark === "period") return "predicted";
  return mark;
}

/** Fertile-window read for a sex log chip: higher vs lower chance (never "safe"). */
export function sexChanceForMark(mark: DayMark | null): "peak" | "fertile" | "quiet" | null {
  if (!mark) return null;
  if (mark === "peak") return "peak";
  if (mark === "fertile") return "fertile";
  return "quiet";
}


// ---------------------------------------------------------------------------
// One source of truth for day number / phase / marks (Hoy, calendar, orb, push)
// ---------------------------------------------------------------------------

function clampInt(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, Math.round(Number.isFinite(n) ? n : lo)));
}

function daysBetween(a: string, b: string) {
  return differenceInCalendarDays(fromISO(b), fromISO(a));
}

/** Every known period start (logged starts + the profile's last start), oldest first. */
export function knownStarts(lastStart: string | null, starts: string[] = []) {
  const all = new Set<string>();
  for (const s of starts) {
    const d = asIsoDay(s);
    if (d) all.add(d);
  }
  const last = asIsoDay(lastStart);
  if (last) all.add(last);
  return [...all].sort();
}

export type DayInfo = {
  /** Day of the cycle that contains this date (never wraps for today / the past). */
  cycleDay: number | null;
  phase: Phase;
  mark: DayMark | null;
  /** Bleeding backed by data (a logged start or logged flow), not an estimate. */
  confirmed: boolean;
  /** Future estimate — drawn dotted. */
  projected: boolean;
  /** Past the expected period with no new start logged. */
  late: boolean;
};

const NO_INFO: DayInfo = { cycleDay: null, phase: "none", mark: null, confirmed: false, projected: false, late: false };

function classifyDay(
  n: number,
  len: number,
  plen: number,
  confirmedPeriod: boolean,
  projected: boolean,
): DayInfo {
  const base = { cycleDay: n, projected, late: false };
  if (confirmedPeriod) return { ...base, phase: "menstrual", mark: "period", confirmed: true };
  if (n <= plen) {
    // Only reachable for projected cycles: an estimate, never "on your period".
    return { ...base, phase: "menstrual", mark: "period", confirmed: false };
  }
  const ov = ovulationDayNum(plen, len);
  const phase: Phase =
    n >= ov - 1 && n <= ov + 1 ? "ovulatory" : n < ov ? "follicular" : "luteal";
  if (ov < len && n === ov) return { ...base, phase, mark: "peak", confirmed: false };
  if (ov < len && n >= ov - 5 && n <= ov + 1) return { ...base, phase, mark: "fertile", confirmed: false };
  return { ...base, phase, mark: "quiet", confirmed: false };
}

/**
 * Day number, phase and calendar mark for one date — the same answer on every
 * screen. Rules:
 * - Menstruation only with data (a known start + period length, or logged flow).
 *   A predicted period never turns "today" into menstruation.
 * - The current cycle keeps counting past the expected date (Día 30, late)
 *   until she confirms a new start.
 * - No marks before her first known start (no fertile days in the past without data).
 * - Future days are estimates (projected → dotted).
 */
export function dayInfo(iso: string, opts: DayMarkOpts): DayInfo {
  const day = asIsoDay(iso);
  if (!day) return NO_INFO;
  const starts = knownStarts(opts.lastStart, opts.periodStarts);
  if (!starts.length) return NO_INFO;
  const today = asIsoDay(opts.today ?? null) ?? todayISO();
  const plen = clampInt(opts.periodLength || 5, 2, 10);
  const len = clampInt(opts.cycleLength || 28, 21, 60);
  const bleeding = Boolean(opts.periodDays?.includes(day));

  if (day < starts[0]!) {
    return bleeding ? { ...NO_INFO, phase: "menstrual", mark: "period", confirmed: true } : NO_INFO;
  }
  let start = starts[0]!;
  let next: string | null = null;
  for (const s of starts) {
    if (s <= day) start = s;
    else {
      next = s;
      break;
    }
  }
  const diff = daysBetween(start, day);

  if (next) {
    // A finished cycle between two real starts: its own length, not the average.
    return classifyDay(diff + 1, daysBetween(start, next), plen, diff < plen || bleeding, false);
  }

  if (day <= today) {
    const n = diff + 1;
    if (n > len && !(diff < plen)) {
      return {
        cycleDay: n,
        phase: bleeding ? "menstrual" : "luteal",
        mark: bleeding ? "period" : null,
        confirmed: bleeding,
        projected: false,
        late: !bleeding,
      };
    }
    return classifyDay(n, len, plen, diff < plen || bleeding, false);
  }

  // Future: rest of the current cycle, then projected cycles from the next expected start.
  let nextStart = addDaysISO(start, len);
  if (nextStart <= today) nextStart = addDaysISO(today, 1);
  if (day < nextStart) return classifyDay(diff + 1, len, plen, diff < plen || bleeding, diff >= plen);
  const k = Math.floor(daysBetween(nextStart, day) / len);
  const cs = addDaysISO(nextStart, k * len);
  return classifyDay(daysBetween(cs, day) + 1, len, plen, bleeding, true);
}

/** Cycle length to use everywhere: average of her logged cycles, else what she told us. */
export function effectiveCycle(starts: string[], fallback: number, lastStart: string | null = null) {
  const gaps = cycleGaps(knownStarts(lastStart, starts));
  if (!gaps.length) return clampInt(fallback || 28, 21, 45);
  return Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length);
}

export type Confidence = "low" | "medium" | "high";

export type PredictionRange = {
  next: string | null;
  from: string | null;
  to: string | null;
  pad: number;
  /** Complete logged cycles (gaps between two starts). */
  n: number;
  /** Periods she has logged (data points). */
  cycles: number;
  len: number;
  sd: number;
  confidence: Confidence;
  irregular: boolean;
};

/**
 * Next period as a range + confidence, learnt from her real logged cycles:
 * average gap = centre; confidence from number of cycles and their spread.
 */
export function predictRange(
  lastStart: string | null,
  starts: string[],
  fallback: number,
  stage: Stage = "cycle",
): PredictionRange {
  const all = knownStarts(lastStart, starts);
  const gaps = cycleGaps(all);
  const n = gaps.length;
  const len = n ? Math.round(gaps.reduce((a, b) => a + b, 0) / n) : clampInt(fallback || 28, 21, 45);
  const mean = n ? gaps.reduce((a, b) => a + b, 0) / n : len;
  const sd = n > 1 ? Math.sqrt(gaps.reduce((a, g) => a + (g - mean) ** 2, 0) / (n - 1)) : 0;
  let confidence: Confidence = n <= 1 ? "low" : n <= 3 ? (sd <= 3 ? "medium" : "low") : sd <= 2 ? "high" : sd <= 4 ? "medium" : "low";
  const irregular = n > 0 && (Math.max(...gaps) - Math.min(...gaps) >= 8 || Math.min(...gaps) < 21 || Math.max(...gaps) > 35);
  if ((stage === "peri" || irregular) && confidence === "high") confidence = "medium";
  let pad = confidence === "high" ? 1 : confidence === "medium" ? 2 : 3;
  pad = Math.min(7, Math.max(pad, Math.ceil(sd)));
  if (stage === "peri" || irregular) pad = Math.max(pad, 4);
  const latest = all.length ? all[all.length - 1]! : null;
  const next = latest ? addDaysISO(latest, len) : null;
  return {
    next,
    from: next ? addDaysISO(next, -pad) : null,
    to: next ? addDaysISO(next, pad) : null,
    pad,
    n,
    cycles: all.length,
    len,
    sd: Math.round(sd * 10) / 10,
    confidence,
    irregular,
  };
}

const MONTH_SHORT = {
  es: ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"],
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
} as const;

/** «15–21 oct» / «28 oct – 3 nov». */
export function formatRange(from: string, to: string, lang: "es" | "en" = "es") {
  const a = fromISO(from);
  const b = fromISO(to);
  const m = MONTH_SHORT[lang];
  if (a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()) {
    return `${a.getDate()}–${b.getDate()} ${m[b.getMonth()]}`;
  }
  return `${a.getDate()} ${m[a.getMonth()]} – ${b.getDate()} ${m[b.getMonth()]}`;
}

/** «confianza baja, 1 ciclo» — same words in onboarding, Hoy and calendar. */
export function confidenceLabel(p: Pick<PredictionRange, "confidence" | "cycles">, lang: "es" | "en" = "es") {
  const c = Math.max(1, p.cycles);
  if (lang === "en") {
    const w = { low: "low", medium: "medium", high: "high" }[p.confidence];
    return `${w} confidence, ${c} ${c === 1 ? "cycle" : "cycles"}`;
  }
  const w = { low: "baja", medium: "media", high: "alta" }[p.confidence];
  return `confianza ${w}, ${c} ${c === 1 ? "ciclo" : "ciclos"}`;
}

/** «15–21 oct · confianza baja, 1 ciclo» */
export function predictionLabel(p: PredictionRange, lang: "es" | "en" = "es") {
  if (!p.from || !p.to) return "";
  return `${formatRange(p.from, p.to, lang)} · ${confidenceLabel(p, lang)}`;
}

/** Days between the new start and the closest earlier known start (null if none). */
export function cycleLengthIfStarted(day: string, starts: string[]) {
  const earlier = starts.filter((s) => s < day).sort();
  const prev = earlier[earlier.length - 1];
  return prev ? daysBetween(prev, day) : null;
}

/** A new bleeding day counts as a new period start unless a start sits right before it. */
export function isNewPeriodStart(day: string, starts: string[], periodLength: number) {
  const plen = clampInt(periodLength || 5, 2, 10);
  return !starts.some((s) => {
    const d = daysBetween(s, day);
    return d >= -2 && d <= plen + 2;
  });
}

/** Upcoming (or current) fertile window from a day on — never a past one. */
export function upcomingFertile(opts: DayMarkOpts, from?: string) {
  const today = asIsoDay(from ?? opts.today ?? null) ?? todayISO();
  let start: string | null = null;
  let end: string | null = null;
  for (let i = 0; i < 70; i++) {
    const d = addDaysISO(today, i);
    const m = dayInfo(d, { ...opts, today }).mark;
    const hot = m === "fertile" || m === "peak";
    if (hot && !start) start = d;
    if (start && hot) end = d;
    if (start && !hot) break;
  }
  return start && end ? { start, end } : null;
}
