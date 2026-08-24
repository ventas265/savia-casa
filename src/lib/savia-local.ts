import { averageCycle, cyclePattern, daysUntil, fertileWindow, learnedCycle, nextPeriodDate, periodDaysFromLogs, snapshotMeta, symptomByPhase, todayISO, weightedCycle } from "@/lib/cycle";
import { callName } from "@/lib/names";
import { songToday } from "@/lib/songs";
import { dailyLetters, pickDailyLetter, yesterdayISO } from "@/lib/carta";
import { pick } from "@/lib/savia-content";
import type { DailyLog, Flow, Intention, Mucus, Phase, SaviaProfile, SexKind, Stage, TodaySnapshot } from "@/lib/types";

const KEY = "savia.beta.v1";

type Feeling = "suave" | "bien" | "pesada" | "dolor";

type Store = {
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
    return {
      profile: { ...emptyProfile(), ...parsed.profile, plan: "serena", userId: "beta" },
      logs: parsed.logs || [],
      starts: parsed.starts || [],
      checkins: parsed.checkins || {},
      notes: parsed.notes || {},
    };
  } catch {
    return { profile: emptyProfile(), logs: [], starts: [], checkins: {}, notes: {} };
  }
}

function write(store: Store) {
  localStorage.setItem(KEY, JSON.stringify(store));
}

export function localToday(): TodaySnapshot {
  const store = read();
  const day = todayISO();
  const log = store.logs.find((l) => l.day === day) || null;
  const recent = [...store.logs].sort((a, b) => b.day.localeCompare(a.day)).slice(0, 90);
  const sexMarks = store.logs.filter((l) => l.sex).map((l) => ({ day: l.day, kind: l.sexKind }));
  const meta = snapshotMeta(store.profile, day);
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
  store.profile = { ...store.profile, ...snap.profile };
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
  const last = data.lastPeriodStart;
  store.starts = last ? [last] : [];
  store.profile = {
    ...store.profile,
    ...data,
    cycleLength: Math.min(45, Math.max(21, data.cycleLength)),
    periodLength: Math.min(10, Math.max(2, data.periodLength)),
    plan: "serena",
    onboardingDone: true,
  };
  write(store);
  return { ok: true as const, profile: store.profile };
}

export function localSaveLog(data: {
  day: string;
  flow: Flow;
  mood: number | null;
  energy: number | null;
  sleepHours: number | null;
  notes: string;
  symptoms: string[];
  periodStarted: boolean;
  mucus?: Mucus;
}) {
  const store = read();
  const existing = store.logs.find((l) => l.day === data.day);
  const log: DailyLog = {
    id: existing?.id || Date.now(),
    userId: "beta",
    day: data.day,
    flow: data.flow,
    mood: data.mood,
    energy: data.energy,
    sleepHours: data.sleepHours,
    notes: data.notes.slice(0, 500),
    symptoms: data.symptoms.slice(0, 12),
    periodStarted: data.periodStarted,
    mucus: data.mucus || "none",
    sex: existing?.sex || false,
    sexKind: existing?.sexKind || "none",
  };
  store.logs = [log, ...store.logs.filter((l) => l.day !== data.day)].slice(0, 180);
  if (data.periodStarted) {
    const prev = store.profile.lastPeriodStart;
    store.profile.cycleLength = learnedCycle(prev, data.day, store.profile.cycleLength);
    store.starts = Array.from(new Set([data.day, ...store.starts])).sort().reverse().slice(0, 12);
    store.profile.lastPeriodStart = data.day;
  }
  write(store);
  return { ok: true as const, log };
}

export function localSetSex(day: string, kind: SexKind) {
  const store = read();
  const existing = store.logs.find((l) => l.day === day);
  const current = existing?.sexKind || "none";
  const next: SexKind = kind === current ? "none" : kind;
  const on = next !== "none";
  const log: DailyLog = existing
    ? { ...existing, sex: on, sexKind: next }
    : {
        id: Date.now(),
        userId: "beta",
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
  write(store);
  return { ok: true as const, log, sex: on, kind: next };
}

export function localAskFile() {
  const snap = localToday();
  const p = snap.profile;
  const note = localNoteToday(p.stage, snap.phase, p.locale === "en" ? "en" : "es");
  const song = songToday(p.stage, snap.phase);
  const next = nextPeriodDate(p.lastPeriodStart, weightedCycle(snap.periodStarts, p.cycleLength));
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
  const meta = snapshotMeta(p);
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
  write(store);
  return localToday();
}

export function localCameToday() {
  return localSaveLog({
    day: todayISO(),
    flow: "medium",
    mood: null,
    energy: null,
    sleepHours: null,
    notes: "",
    symptoms: [],
    periodStarted: true,
  });
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


