import { asIsoDay, todayISO } from "@/lib/cycle";
import { SAVIA_BETA } from "@/lib/beta";
import {
  localAskFile,
  localCorrectLastPeriod,
  localRegisterPeriod,
  localUndoPeriod,
  type PeriodUndo,
  type SaveLogInput,
  localHydrate,
  localReport,
  localSaveLog,
  localSaveProfile,
  localSetCycle,
  localSetSex,
  localToday,
} from "@/lib/savia-local";
import { askSavia, askSaviaOpen, getReport, getToday, saveLog, saveProfile, toggleSex } from "@/lib/savia-server";
import { getTodayDevice, removePeriodStartDevice, saveLogDevice, saveProfileDevice, saveSexDevice } from "@/lib/savia-device";
import type { DailyLog } from "@/lib/types";
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
      token: deviceToken() || undefined,
    },
  }).catch(() => null);
  if (res?.ok && res.token) setDeviceToken(res.token);
  if (res?.ok && res.recovery) claimRecovery(res.recovery);
}

/** Beta device credentials (registers the tester on first use). */
export async function deviceCreds() {
  return creds();
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

/**
 * Save a day. Fields left out keep their stored value (merge, never overwrite),
 * so a symptom popup can't wipe flow and registering a period can't wipe symptoms.
 */
export async function writeLog(data: SaveLogInput) {
  const day = asIsoDay(data.day) || data.day.slice(0, 10);
  const payload = { ...data, day };
  if (!SAVIA_BETA) {
    return saveLog({
      data: {
        day,
        flow: payload.flow ?? "none",
        mood: payload.mood ?? null,
        energy: payload.energy ?? null,
        sleepHours: payload.sleepHours ?? null,
        notes: payload.notes ?? "",
        symptoms: Array.from(new Set([...(payload.symptoms ?? []), ...(payload.addSymptoms ?? [])])),
        periodStarted: payload.periodStarted ?? false,
        mucus: payload.mucus,
        sex: payload.sex,
        sexKind: payload.sexKind,
      },
    });
  }
  const saved = localSaveLog(payload);
  if (saved.removedStart) void pushRemoval(saved.log.day, saved.log, saved.lastPeriodStart);
  else void pushLog(saved.log);
  return saved;
}

/** Server writes run one after another, so an «undo» can never land before the write it undoes. */
let pushChain: Promise<unknown> = Promise.resolve();
function enqueue(job: () => Promise<unknown>) {
  pushChain = pushChain.catch(() => undefined).then(job).catch(() => undefined);
  return pushChain;
}

/** Server copy of the merged log (full row, so the server never sees partial data). */
function pushLog(log: DailyLog) {
  return enqueue(() => pushLogNow(log));
}

async function pushLogNow(log: DailyLog) {
  const c = await creds();
  if (!c) return;
  await saveLogDevice({
    data: {
      ...c,
      day: log.day,
      flow: log.flow,
      mood: log.mood,
      energy: log.energy,
      sleepHours: log.sleepHours,
      notes: log.notes,
      symptoms: log.symptoms,
      periodStarted: log.periodStarted,
      mucus: log.mucus,
      sex: log.sex,
      sexKind: log.sexKind,
    },
  }).catch(() => {});
}

function logRow(log: DailyLog | null) {
  if (!log) return null;
  return {
    flow: log.flow,
    mood: log.mood,
    energy: log.energy,
    sleepHours: log.sleepHours,
    notes: log.notes,
    symptoms: log.symptoms,
    periodStarted: log.periodStarted,
    mucus: log.mucus || "none",
    sex: Boolean(log.sex),
    sexKind: log.sexKind || "none",
  };
}

function pushRemoval(day: string, log: DailyLog | null, lastPeriodStart: string | null, cycleLength?: number) {
  return enqueue(() => pushRemovalNow(day, log, lastPeriodStart, cycleLength));
}

async function pushRemovalNow(day: string, log: DailyLog | null, lastPeriodStart: string | null, cycleLength?: number) {
  const c = await creds();
  if (!c) return;
  await removePeriodStartDevice({
    data: { ...c, day, lastPeriodStart, cycleLength: cycleLength ?? null, log: logRow(log) },
  }).catch(() => {});
}

/** «Registrar periodo»: start on `day` (today or another day), merged into that day's log. */
export async function registerPeriod(day: string) {
  const res = localRegisterPeriod(day);
  void pushLog(res.log);
  return { snap: localToday(), undo: res.undo };
}

/** «Deshacer» after registering: restore exactly what was there. */
export async function undoPeriod(undo: PeriodUndo) {
  const snap = localUndoPeriod(undo);
  void pushRemoval(undo.day, undo.log, undo.lastPeriodStart, undo.cycleLength);
  return snap;
}

/** «Cambiar última regla». */
export async function correctLastPeriod(newDay: string) {
  const res = localCorrectLastPeriod(newDay);
  const c = await creds();
  const p = res.snap.profile;
  if (c) await enqueue(async () => {
    if (res.oldStart && res.oldStart !== newDay) {
      const oldLog = res.touched.find((l) => l.day === res.oldStart);
      await removePeriodStartDevice({
        data: {
          ...c,
          day: res.oldStart,
          lastPeriodStart: p.lastPeriodStart,
          cycleLength: null,
          ...(oldLog ? { log: logRow(oldLog) } : {}),
        },
      }).catch(() => {});
      for (const l of res.touched) if (l.day !== res.oldStart) await pushLogNow(l);
    }
    await saveProfileDevice({
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
  });
  return res.snap;
}

export type { PeriodUndo };

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
    const c = await creds();
    if (!c) return { ok: false as const, error: "ai" as const };
    return askSaviaOpen({ data: { ...input, ...c, file: localAskFile() } });
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
  return (await registerPeriod(todayISO())).snap;
}
