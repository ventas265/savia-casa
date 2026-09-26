import type { DailyLog, Flow, Mucus, SexKind } from "./types.ts";

/** Fields a caller may change on a day. Anything left undefined keeps what was there. */
export type LogPatch = {
  flow?: Flow;
  mood?: number | null;
  energy?: number | null;
  sleepHours?: number | null;
  notes?: string;
  /** Replaces the symptom list (the full editor sends the whole list). */
  symptoms?: string[];
  /** Adds to the symptom list without removing anything (quick popups). */
  addSymptoms?: string[];
  periodStarted?: boolean;
  mucus?: Mucus;
  sex?: boolean;
  sexKind?: SexKind;
};

export function isBleeding(flow: Flow | string | null | undefined) {
  return flow === "light" || flow === "medium" || flow === "heavy";
}

/**
 * Merge a patch into the day's log — never overwrite what the patch does not
 * mention. Registering a period keeps her symptoms; a symptom popup keeps her
 * flow and hearts; the owner id (device UUID) is never replaced by a placeholder.
 */
export function mergeLog(existing: DailyLog | null, day: string, patch: LogPatch, ownerId: string): DailyLog {
  const keep = <K extends keyof DailyLog>(k: K, fallback: DailyLog[K]): DailyLog[K] => {
    const v = (patch as Record<string, unknown>)[k as string];
    if (v !== undefined) return v as DailyLog[K];
    return existing ? existing[k] : fallback;
  };
  let sex = existing?.sex || false;
  let sexKind: SexKind = existing?.sexKind || (existing?.sex ? "unprotected" : "none");
  if (patch.sexKind !== undefined) {
    sexKind = patch.sexKind;
    sex = sexKind !== "none";
  } else if (patch.sex !== undefined) {
    sex = Boolean(patch.sex);
    if (!sex) sexKind = "none";
    else if (sexKind === "none") sexKind = "unprotected";
  }
  const base = patch.symptoms !== undefined ? patch.symptoms : (existing?.symptoms ?? []);
  const symptoms = Array.from(new Set([...base, ...(patch.addSymptoms ?? [])])).slice(0, 24);
  const owner = existing?.userId && existing.userId !== "beta" ? existing.userId : ownerId || existing?.userId || "beta";
  return {
    id: existing?.id || Date.now(),
    userId: owner,
    day,
    flow: keep("flow", "none"),
    mood: keep("mood", null),
    energy: keep("energy", null),
    sleepHours: keep("sleepHours", null),
    notes: String(keep("notes", "")).slice(0, 500),
    symptoms,
    periodStarted: keep("periodStarted", false),
    mucus: keep("mucus", "none"),
    sex,
    sexKind,
  };
}
