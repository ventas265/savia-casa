import { averageCycle, cyclePattern, fertileWindow, learnedCycle, nextPeriodDate, periodDaysFromLogs, snapshotMeta, symptomByPhase, todayISO } from "@/lib/cycle";
import type { DailyLog, Flow, Intention, Mucus, SaviaProfile, SexKind, Stage, TodaySnapshot } from "@/lib/types";

const KEY = "savia.beta.v1";

type Store = {
  profile: SaviaProfile;
  logs: DailyLog[];
  starts: string[];
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
    askCount: 0,
  };
}

function read(): Store {
  if (typeof window === "undefined") {
    return { profile: emptyProfile(), logs: [], starts: [] };
  }
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { profile: emptyProfile(), logs: [], starts: [] };
    const parsed = JSON.parse(raw) as Store;
    return {
      profile: { ...emptyProfile(), ...parsed.profile, plan: "serena", userId: "beta" },
      logs: parsed.logs || [],
      starts: parsed.starts || [],
    };
  } catch {
    return { profile: emptyProfile(), logs: [], starts: [] };
  }
}

function write(store: Store) {
  localStorage.setItem(KEY, JSON.stringify(store));
}

export function localToday(): TodaySnapshot {
  const store = read();
  const day = todayISO();
  const log = store.logs.find((l) => l.day === day) || null;
  const recent = [...store.logs].sort((a, b) => b.day.localeCompare(a.day)).slice(0, 14);
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
}) {
  const store = read();
  const last = data.lastPeriodStart;
  const starts = last
    ? Array.from(new Set([last, ...store.starts])).sort().reverse().slice(0, 12)
    : store.starts;
  store.profile = {
    ...store.profile,
    ...data,
    cycleLength: Math.min(45, Math.max(21, data.cycleLength)),
    periodLength: Math.min(10, Math.max(2, data.periodLength)),
    plan: "serena",
    onboardingDone: true,
  };
  store.starts = starts;
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
  return {
    displayName: p.displayName,
    birthYear: p.birthYear,
    stage: p.stage,
    intention: p.intention,
    cycleLength: p.cycleLength,
    periodLength: p.periodLength,
    lastPeriodStart: p.lastPeriodStart,
    dueDate: p.dueDate,
    cycleDay: snap.cycleDay,
    phase: snap.phase,
    pregnancyWeek: snap.pregnancyWeek,
    nextPeriod: nextPeriodDate(p.lastPeriodStart, averageCycle(snap.periodStarts, p.cycleLength)),
    flow: snap.log?.flow ?? "none",
    mucus: snap.log?.mucus ?? "none",
    symptoms: snap.log?.symptoms ?? [],
    mood: snap.log?.mood ?? null,
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
