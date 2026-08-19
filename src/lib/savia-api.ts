import { SAVIA_BETA } from "@/lib/beta";
import {
  localAskFile,
  localReport,
  localSaveLog,
  localSaveProfile,
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
