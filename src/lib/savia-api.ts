import { todayISO } from "@/lib/cycle";
import { SAVIA_BETA } from "@/lib/beta";
import {
  localAskFile,
  localCameToday,
  localReport,
  localSaveLog,
  localSaveProfile,
  localSetCycle,
  localSetSex,
  localToday,
} from "@/lib/savia-local";
import { askSavia, askSaviaOpen, getReport, getToday, saveLog, saveProfile, toggleSex } from "@/lib/savia-server";
import type { Flow, Intention, Mucus, SexKind, Stage } from "@/lib/types";

export async function loadToday() {
  if (SAVIA_BETA) return localToday();
  return getToday();
}

export async function writeProfile(data: {
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
  if (SAVIA_BETA) return localSaveProfile(data);
  return saveProfile({ data });
}

export async function writeLog(data: {
  day: string;
  flow: Flow;
  mood: number | null;
  energy: number | null;
  sleepHours: number | null;
  notes: string;
  symptoms: string[];
  periodStarted: boolean;
  mucus?: Mucus;
  sex?: boolean;
}) {
  if (SAVIA_BETA) return localSaveLog(data);
  return saveLog({ data });
}

export async function writeSex(day: string, kind: SexKind) {
  if (SAVIA_BETA) return localSetSex(day, kind);
  return toggleSex({ data: { day, kind } });
}

export async function loadReport() {
  if (SAVIA_BETA) return localReport();
  return getReport();
}

export async function askGuide(input: {
  question: string;
  locale: string;
  history?: { role: "user" | "assistant"; content: string }[];
}) {
  if (SAVIA_BETA) {
    return askSaviaOpen({ data: { ...input, file: localAskFile() } });
  }
  return askSavia({ data: input });
}

export function betaPaid() {
  return SAVIA_BETA;
}

export async function setCycleLength(n: number) {
  if (SAVIA_BETA) return localSetCycle(n);
  const snap = await loadToday();
  return writeProfile({
    displayName: snap.profile.displayName,
    stage: snap.profile.stage,
    birthYear: snap.profile.birthYear,
    cycleLength: n,
    periodLength: snap.profile.periodLength,
    lastPeriodStart: snap.profile.lastPeriodStart,
    dueDate: snap.profile.dueDate,
    lastPeriodYear: snap.profile.lastPeriodYear,
    onboardingDone: true,
    locale: snap.profile.locale,
    intention: snap.profile.intention,
  }).then(() => loadToday());
}

export async function markCameToday() {
  if (SAVIA_BETA) {
    localCameToday();
    return localToday();
  }
  await writeLog({
    day: todayISO(),
    flow: "medium",
    mood: null,
    energy: null,
    sleepHours: null,
    notes: "",
    symptoms: [],
    periodStarted: true,
  });
  return loadToday();
}
