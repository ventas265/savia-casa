import { asIsoDay, todayISO } from "@/lib/cycle";
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
import { deviceId, deviceToken, setDeviceToken, claimRecovery } from "@/lib/device";
import { registerTester } from "@/lib/testers";
import type { Flow, Intention, Mucus, SexKind, Stage } from "@/lib/types";

export async function pulseTester() {
  const id = deviceId();
  if (!id) return;
  const p = localToday().profile;
  if (!p.onboardingDone || !p.displayName.trim()) return;
  const res = await registerTester({
    data: {
      deviceId: id,
      displayName: p.displayName,
      stage: p.stage,
      country: p.country,
    },
  }).catch(() => null);
  if (res?.ok && res.token) setDeviceToken(res.token);
  if (res?.ok && res.recovery) claimRecovery(res.recovery);
}

async function creds() {
  const id = deviceId();
  if (!id) return null;
  if (!deviceToken()) await pulseTester();
  const token = deviceToken();
  if (!token) return null;
  return { deviceId: id, token };
}

export async function loadToday() {
  if (!SAVIA_BETA) return getToday();
  const local = localToday();
  if (local.profile.onboardingDone) {
    void pullRemote();
    return local;
  }
  await pullRemote();
  return localToday();
}

async function pullRemote() {
  const c = await creds();
  if (!c) return;
  try {
    const remote = await getTodayDevice({ data: c });
    if (remote?.profile.onboardingDone) localHydrate(remote);
  } catch {
    /* offline */
  }
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
  await pulseTester();
  const c = await creds();
  if (c) {
    void saveProfileDevice({
      data: {
        ...c,
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
  return saved;
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
  sexKind?: SexKind;
}) {
  const day = asIsoDay(data.day) || data.day.slice(0, 10);
  const payload = { ...data, day };
  if (!SAVIA_BETA) return saveLog({ data: payload });
  const saved = localSaveLog(payload);
  void pushLog(payload);
  return saved;
}

async function pushLog(data: {
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
  sexKind?: SexKind;
}) {
  const c = await creds();
  if (c) void saveLogDevice({ data: { ...c, ...data } }).catch(() => {});
}

export async function writeSex(dayRaw: string, kind: SexKind) {
  const day = asIsoDay(dayRaw) || dayRaw.slice(0, 10);
  if (!SAVIA_BETA) return toggleSex({ data: { day, kind } });
  const saved = localSetSex(day, kind);
  const c = await creds();
  if (c) void saveSexDevice({ data: { ...c, day, kind } }).catch(() => {});
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
    const c = await creds();
    const p = snap.profile;
    if (c && p.onboardingDone) {
      void saveProfileDevice({
        data: {
          ...c,
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
    const c = await creds();
    if (c) {
      void saveLogDevice({
        data: {
          ...c,
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
