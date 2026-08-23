import { todayISO } from "@/lib/cycle";
import { SAVIA_BETA } from "@/lib/beta";
import {
  localAskFile,
  localCameToday,
  localHydrate,
  localReport,
  localSaveLog,
  localSaveProfile,
  localSetCycle,
  localSetSex,
  localToday,
} from "@/lib/savia-local";
import { askSavia, askSaviaOpen, getReport, getToday, saveLog, saveProfile, toggleSex } from "@/lib/savia-server";
import { getTodayDevice, saveLogDevice, saveProfileDevice, saveSexDevice } from "@/lib/savia-device";
import { deviceId } from "@/lib/device";
import { registerTester } from "@/lib/testers";
import type { Flow, Intention, Mucus, SexKind, Stage } from "@/lib/types";

export async function loadToday() {
  if (!SAVIA_BETA) return getToday();
  const id = deviceId();
  const local = localToday();
  if (id) {
    try {
      const remote = await getTodayDevice({ data: { deviceId: id } });
      if (remote?.profile.onboardingDone) {
        localHydrate(remote);
        return remote;
      }
      if (local.profile.onboardingDone) {
        void saveProfileDevice({
          data: {
            deviceId: id,
            displayName: local.profile.displayName,
            stage: local.profile.stage,
            birthYear: local.profile.birthYear,
            cycleLength: local.profile.cycleLength,
            periodLength: local.profile.periodLength,
            lastPeriodStart: local.profile.lastPeriodStart,
            dueDate: local.profile.dueDate,
            lastPeriodYear: local.profile.lastPeriodYear,
            onboardingDone: true,
            locale: local.profile.locale,
            intention: local.profile.intention,
          },
        });
      }
    } catch {
      /* offline: local */
    }
  }
  return local;
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
  country?: string;
}) {
  if (!SAVIA_BETA) {
    const saved = await saveProfile({ data });
    void pulseTester();
    return saved;
  }
  const saved = localSaveProfile(data);
  const id = deviceId();
  if (id) {
    void saveProfileDevice({
      data: {
        deviceId: id,
        displayName: data.displayName,
        stage: data.stage,
        birthYear: data.birthYear,
        cycleLength: data.cycleLength,
        periodLength: data.periodLength,
        lastPeriodStart: data.lastPeriodStart,
        dueDate: data.dueDate,
        lastPeriodYear: data.lastPeriodYear,
        onboardingDone: true,
        locale: data.locale,
        intention: data.intention,
      },
    }).catch(() => {});
  }
  void pulseTester();
  return saved;
}

export async function pulseTester() {
  const id = deviceId();
  if (!id) return;
  const p = localToday().profile;
  if (!p.onboardingDone || !p.displayName.trim()) return;
  await registerTester({
    data: {
      deviceId: id,
      displayName: p.displayName,
      stage: p.stage,
      country: p.country,
    },
  }).catch(() => {});
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
  if (!SAVIA_BETA) return saveLog({ data });
  const saved = localSaveLog(data);
  const id = deviceId();
  if (id) {
    void saveLogDevice({ data: { deviceId: id, ...data } }).catch(() => {});
  }
  return saved;
}

export async function writeSex(day: string, kind: SexKind) {
  if (!SAVIA_BETA) return toggleSex({ data: { day, kind } });
  const saved = localSetSex(day, kind);
  const id = deviceId();
  if (id) void saveSexDevice({ data: { deviceId: id, day, kind } }).catch(() => {});
  return saved;
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
  if (SAVIA_BETA) {
    const snap = localSetCycle(n);
    const id = deviceId();
    const p = snap.profile;
    if (id && p.onboardingDone) {
      void saveProfileDevice({
        data: {
          deviceId: id,
          displayName: p.displayName,
          stage: p.stage,
          birthYear: p.birthYear,
          cycleLength: p.cycleLength,
          periodLength: p.periodLength,
          lastPeriodStart: p.lastPeriodStart,
          dueDate: p.dueDate,
          lastPeriodYear: p.lastPeriodYear,
          onboardingDone: true,
          locale: p.locale,
          intention: p.intention,
        },
      }).catch(() => {});
    }
    return snap;
  }
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
    const id = deviceId();
    if (id) {
      void saveLogDevice({
        data: {
          deviceId: id,
          day: todayISO(),
          flow: "medium",
          mood: null,
          energy: null,
          sleepHours: null,
          notes: "",
          symptoms: [],
          periodStarted: true,
        },
      }).catch(() => {});
    }
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
