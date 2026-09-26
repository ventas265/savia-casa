import { asIsoDay, averageCycle, cyclePattern, daysUntil, effectiveCycle, fertileWindow, isNewPeriodStart, nextPeriodDate, periodDaysFromLogs, snapshotMeta, symptomByPhase, todayISO } from "@/lib/cycle";
import { isBleeding, mergeLog, type LogPatch } from "@/lib/log-merge";
import { deviceId } from "@/lib/device";
import { callName } from "@/lib/names";
import { songToday } from "@/lib/songs";
import { dailyLetters, pickDailyLetter, yesterdayISO } from "@/lib/carta";
import { pick } from "@/lib/savia-content";
import type { DailyLog, Flow, Intention, Mucus, Phase, SaviaProfile, SexKind, Stage, TodaySnapshot } from "@/lib/types";

const KEY = "savia.beta.v1";

type Feeling = "suave" | "bien" | "pesada" | "dolor";

type Store = {
  /** Local edits not yet confirmed by the server: a pull must not undo them. */
  dirtyUntil?: number;
  profile: SaviaProfile;
  logs: DailyLog[];
  starts: string[];
  checkins: Record<string, Feeling>;
  notes: Record<string, { letterId: string; userText: string }>;
};

function emptyProfile(): SaviaProfile {
  return {
    userId: "beta",
    displayName: "",
    stage: "cycle",
    birthYear: null,
    cycleLength: 28,
    periodLength: 5,
    lastPeriodStart: null,
    dueDate: null,
    lastPeriodYear: null,
    onboardingDone: false,
    locale: "es",
    plan: "serena",
    intention: "track",
    country: "VE",
    askCount: 0,
  };
}

function read(): Store {
  if (typeof window === "undefined") {
    return { profile: emptyProfile(), logs: [], starts: [], checkins: {}, notes: {} };
  }
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { profile: emptyProfile(), logs: [], starts: [], checkins: {}, notes: {} };
    const parsed = JSON.parse(raw) as Store;
    const owner = ownerId(parsed.profile?.userId);
    return {
      dirtyUntil: parsed.dirtyUntil,
      profile: { ...emptyProfile(), ...parsed.profile, plan: "serena", userId: owner },
      logs: parsed.logs || [],
      starts: parsed.starts || [],
      checkins: parsed.checkins || {},
      notes: parsed.notes || {},
    };
  } catch {
    return { profile: emptyProfile(), logs: [], starts: [], checkins: {}, notes: {} };
  }
}

/** The real owner id (device UUID) — never downgrade to the "beta" placeholder. */
function ownerId(current?: string | null) {
  if (current && current !== "beta") return current;
  return deviceId() || "beta";
}

function write(store: Store) {
  localStorage.setItem(KEY, JSON.stringify(store));
}

function markDirty(store: Store) {
  store.dirtyUntil = Date.now() + 45_000;
}

function latestStart(starts: string[]) {
  return [...starts].sort().reverse()[0] ?? null;
}

export function localToday(): TodaySnapshot {
  const store = read();
  const day = todayISO();
  const log = store.logs.find((l) => l.day === day) || null;
  const recent = [...store.logs].sort((a, b) => b.day.localeCompare(a.day)).slice(0, 90);
  const sexMarks = store.logs.filter((l) => l.sex).map((l) => ({ day: l.day, kind: l.sexKind }));
  const meta = snapshotMeta(store.profile, day, { starts: store.starts, periodDays: periodDaysFromLogs(store.logs) });
  return {
    profile: store.profile,
    day,
    ...meta,
    log,
    recentLogs: recent,
    periodStarts: store.starts,
    sexDays: sexMarks.map((s) => s.day),
    sexMarks,
  };
}

export function localHydrate(snap: TodaySnapshot) {
  if (!snap.profile.onboardingDone) return;
  const store = read();
  // A pull that started before a local edit must not bring back old data.
  if (store.dirtyUntil && store.dirtyUntil > Date.now()) return;
  store.profile = { ...store.profile, ...snap.profile, userId: ownerId(snap.profile.userId || store.profile.userId) };
  if (snap.periodStarts.length) store.starts = snap.periodStarts;
  const map = new Map(store.logs.map((l) => [l.day, l]));
  for (const l of snap.recentLogs) map.set(l.day, l);
  if (snap.log) map.set(snap.log.day, snap.log);
  store.logs = [...map.values()].sort((a, b) => b.day.localeCompare(a.day)).slice(0, 180);
  write(store);
}

export function localSaveProfile(data: {
  displayName: string;
  stage: Stage;
  birthYear: number | null;
  cycleLength: number;
  periodLength: number;
  lastPeriodStart: string | null;
  dueDate: string | null;
  lastPeriodYear: number | null;
  onboardingDone: boolean;
  locale: string;
  intention?: Intention;
  country?: string;
}) {
  const store = read();
  const last = asIsoDay(data.lastPeriodStart);
  const prevLast = store.profile.lastPeriodStart;
  if (!last) store.starts = [];
  else if (!store.starts.length) store.starts = [last];
  else if (!store.starts.includes(last)) {
    // Correcting the last period replaces it; older history stays.
    store.starts = [...store.starts.filter((s) => s !== prevLast), last].sort().reverse().slice(0, 12);
  }
  markDirty(store);
  store.profile = {
    ...store.profile,
    ...data,
    lastPeriodStart: last ? latestStart(store.starts) : null,
    cycleLength: Math.min(45, Math.max(21, data.cycleLength)),
    periodLength: Math.min(10, Math.max(2, data.periodLength)),
    plan: "serena",
    onboardingDone: true,
  };
  write(store);
  return { ok: true as const, profile: store.profile };
}

export type SaveLogInput = LogPatch & { day: string };

export function localSaveLog(data: SaveLogInput) {
  const store = read();
  const day = asIsoDay(data.day) || data.day.slice(0, 10);
  const existing = store.logs.find((l) => l.day === day) ?? null;
  const { day: _d, ...patch } = data;
  void _d;
  const log = mergeLog(existing, day, patch, ownerId(store.profile.userId));
  let removedStart = false;
  if (patch.periodStarted === undefined) {
    if (isBleeding(log.flow) && !log.periodStarted && isNewPeriodStart(day, store.starts, store.profile.periodLength)) {
      // First bleeding day after a gap = a new period start.
      log.periodStarted = true;
    } else if (log.periodStarted && patch.flow !== undefined && !isBleeding(log.flow)) {
      // She removed the bleeding from the day that started a period: that start goes too.
      log.periodStarted = false;
      removedStart = true;
    }
  } else if (!patch.periodStarted && existing?.periodStarted) {
    removedStart = true;
  }
  store.logs = [log, ...store.logs.filter((l) => l.day !== day)].slice(0, 180);
  if (log.periodStarted) {
    store.starts = Array.from(new Set([day, ...store.starts])).sort().reverse().slice(0, 12);
    store.profile.lastPeriodStart = latestStart(store.starts);
  } else if (removedStart) {
    store.starts = store.starts.filter((s) => s !== day);
    store.profile.lastPeriodStart = latestStart(store.starts);
  }
  markDirty(store);
  write(store);
  return { ok: true as const, log, removedStart, lastPeriodStart: store.profile.lastPeriodStart };
}

export type PeriodUndo = {
  day: string;
  starts: string[];
  lastPeriodStart: string | null;
  cycleLength: number;
  log: DailyLog | null;
};

/** Register a period start on `day`, merged into that day's log. Returns what undo needs. */
export function localRegisterPeriod(dayRaw: string) {
  const store = read();
  const day = asIsoDay(dayRaw) || dayRaw.slice(0, 10);
  const existing = store.logs.find((l) => l.day === day) ?? null;
  const undo: PeriodUndo = {
    day,
    starts: [...store.starts],
    lastPeriodStart: store.profile.lastPeriodStart,
    cycleLength: store.profile.cycleLength,
    log: existing ? { ...existing, symptoms: [...existing.symptoms] } : null,
  };
  const res = localSaveLog({
    day,
    periodStarted: true,
    flow: existing && isBleeding(existing.flow) ? existing.flow : "medium",
  });
  return { ...res, undo };
}

export function localUndoPeriod(undo: PeriodUndo) {
  const store = read();
  store.starts = [...undo.starts];
  store.profile.lastPeriodStart = undo.lastPeriodStart;
  store.profile.cycleLength = undo.cycleLength;
  store.logs = store.logs.filter((l) => l.day !== undo.day);
  if (undo.log) store.logs = [undo.log, ...store.logs];
  markDirty(store);
  write(store);
  return localToday();
}

/**
 * «Cambiar última regla»: move the latest start to `newDay`. The old start's
 * log stops being a start; if it now falls outside the period it loses the
 * automatic flow too, so day/phase stay consistent.
 */
export function localCorrectLastPeriod(newDayRaw: string) {
  const store = read();
  const newDay = asIsoDay(newDayRaw) || newDayRaw.slice(0, 10);
  const old = store.profile.lastPeriodStart;
  const plen = Math.max(2, store.profile.periodLength || 5);
  const touched: DailyLog[] = [];
  if (old && old !== newDay) {
    store.starts = store.starts.filter((s) => s !== old);
    store.logs = store.logs.map((l) => {
      if (l.day <= newDay || !l.periodStarted) return l;
      const inside = (new Date(l.day).getTime() - new Date(newDay).getTime()) / 86400000 < plen;
      const fixed: DailyLog = { ...l, periodStarted: false, flow: inside ? l.flow : "none" };
      touched.push(fixed);
      return fixed;
    });
    store.starts = store.starts.filter((s) => !touched.some((t) => t.day === s));
  }
  store.starts = Array.from(new Set([newDay, ...store.starts])).sort().reverse().slice(0, 12);
  store.profile.lastPeriodStart = latestStart(store.starts);
  markDirty(store);
  write(store);
  return { snap: localToday(), oldStart: old, touched };
}

export function localSetSex(dayRaw: string, kind: SexKind) {
  const store = read();
  const day = asIsoDay(dayRaw) || dayRaw.slice(0, 10);
  const existing = store.logs.find((l) => l.day === day);
  const current = existing?.sexKind || "none";
  const next: SexKind = kind === current ? "none" : kind;
  const on = next !== "none";
  const log: DailyLog = existing
    ? { ...existing, sex: on, sexKind: next }
    : {
        id: Date.now(),
        userId: ownerId(store.profile.userId),
        day,
        flow: "none",
        mood: null,
        energy: null,
        sleepHours: null,
        notes: "",
        symptoms: [],
        periodStarted: false,
        mucus: "none",
        sex: on,
        sexKind: next,
      };
  store.logs = [log, ...store.logs.filter((l) => l.day !== day)].slice(0, 180);
  markDirty(store);
  write(store);
  return { ok: true as const, log, sex: on, kind: next };
}

export function localAskFile() {
  const snap = localToday();
  const p = snap.profile;
  const note = localNoteToday(p.stage, snap.phase, p.locale === "en" ? "en" : "es");
  const song = songToday(p.stage, snap.phase);
  const next = nextPeriodDate(p.lastPeriodStart, effectiveCycle(snap.periodStarts, p.cycleLength, p.lastPeriodStart));
  return {
    displayName: p.displayName,
    callName: callName(p.displayName),
    birthYear: p.birthYear,
    stage: p.stage,
    intention: p.intention,
    country: p.country,
    todayISO: todayISO(),
    todayLabel: new Date().toLocaleDateString(p.locale === "en" ? "en-US" : "es-VE", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    cycleLength: p.cycleLength,
    periodLength: p.periodLength,
    lastPeriodStart: p.lastPeriodStart,
    dueDate: p.dueDate,
    cycleDay: snap.cycleDay,
    phase: snap.phase,
    pregnancyWeek: snap.pregnancyWeek,
    nextPeriod: next,
    daysUntilPeriod: daysUntil(next),
    flow: snap.log?.flow ?? "none",
    mucus: snap.log?.mucus ?? "none",
    symptoms: snap.log?.symptoms ?? [],
    mood: snap.log?.mood ?? null,
    energy: snap.log?.energy ?? null,
    sleepHours: snap.log?.sleepHours ?? null,
    feeling: localFeelingToday(),
    userNote: note.userText,
    letterTitle: note.title,
    song: `${song.artist} — ${song.title}`,
  };
}

export function localReport() {
  const store = read();
  const p = store.profile;
  const avg = averageCycle(store.starts, p.cycleLength);
  const pattern = cyclePattern(store.starts, p.cycleLength);
  const meta = snapshotMeta(p, todayISO(), { starts: store.starts, periodDays: periodDaysFromLogs(store.logs) });
  const symptoms = symptomByPhase(store.logs, p.lastPeriodStart, avg, p.periodLength);
  const sexMarks = store.logs.filter((l) => l.sex).map((l) => ({ day: l.day, kind: l.sexKind }));
  const heavyDays = store.logs.filter((l) => l.flow === "heavy").length;
  const flowDays = store.logs.filter((l) => l.flow !== "none").length;
  const age = p.birthYear ? new Date().getFullYear() - p.birthYear : null;
  return {
    ok: true as const,
    issued: todayISO(),
    profile: p,
    age,
    periodStarts: store.starts,
    pattern,
    meta,
    fertile: fertileWindow(p.lastPeriodStart, avg, p.periodLength),
    symptoms,
    sexMarks,
    nextPeriod: nextPeriodDate(p.lastPeriodStart, avg),
    heavyDays,
    flowDays,
    logCount: store.logs.length,
    periodDays: periodDaysFromLogs(store.logs),
  };
}

export function localSetCycle(n: number) {
  const store = read();
  store.profile.cycleLength = Math.min(45, Math.max(21, n));
  markDirty(store);
  write(store);
  return localToday();
}

export function localCameToday() {
  return localRegisterPeriod(todayISO());
}

export function localReset() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}

export function localFeelingToday(): Feeling | null {
  return read().checkins[todayISO()] || null;
}

export function localSetFeeling(feeling: Feeling) {
  const store = read();
  store.checkins[todayISO()] = feeling;
  write(store);
  return feeling;
}

export function localStreak() {
  const { checkins } = read();
  let n = 0;
  const d = new Date();
  for (let i = 0; i < 60; i++) {
    const iso = todayISO(d);
    if (!checkins[iso]) break;
    n += 1;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

export type { Feeling };

export function localNoteToday(stage: Stage, phase: Phase, lang: "es" | "en") {
  const day = todayISO();
  const store = read();
  const saved = store.notes[day];
  const yestId = store.notes[yesterdayISO(day)]?.letterId ?? null;
  const letters = dailyLetters(stage, phase);
  const locked = saved?.letterId ? letters.find((l) => l.id === saved.letterId) : null;
  const letter = locked ?? pickDailyLetter(day, stage, phase, yestId);
  if (!saved || saved.letterId !== letter.id) {
    store.notes[day] = { letterId: letter.id, userText: saved?.userText ?? "" };
    write(store);
  }
  return {
    id: letter.id,
    title: pick(letter.title, lang),
    body: pick(letter.body, lang),
    ask: pick(letter.ask, lang),
    userText: store.notes[day]?.userText ?? "",
    letterId: letter.id,
  };
}

export function localSetUserNote(text: string) {
  const store = read();
  const day = todayISO();
  const prev = store.notes[day] ?? { letterId: "", userText: "" };
  store.notes[day] = { letterId: prev.letterId, userText: text.slice(0, 400) };
  write(store);
}



/** Every on-device log (insights need more than the 90-log snapshot window). */
export function localAllLogs(): DailyLog[] {
  return [...read().logs].sort((a, b) => b.day.localeCompare(a.day));
}
