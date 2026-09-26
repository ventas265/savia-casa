/**
 * «Anotar mi día» v2 (4 pasos + guardado). Pure helpers, no React:
 * every control maps onto an EXISTING DailyLog field/value — no new fields, no new symptom ids.
 *   Paso 1 Ánimo  → mood (1–5), energy (1–5), symptoms anxiety / irritable / low_mood / brain_fog
 *   Paso 2 Cuerpo → symptoms (all remaining stored ids)
 *   Paso 3 Regla  → flow (none/spotting/light/medium/heavy), mucus (sticky/creamy/eggwhite/watery)
 *   Paso 4 Íntimo → sexKind (none/protected/unprotected/withdrawal), libido_up / libido_down,
 *                   sleepHours (30-min steps), insomnia, notes (≤ 500)
 * Saving sends only the fields she changed; mergeLog keeps everything else as it was.
 */
import { SYMPTOMS, type DailyLog, type Flow, type Mucus, type Phase, type SexKind } from "./types.ts";
import type { LogPatch } from "./log-merge.ts";

export type Draft = {
  flow: Flow;
  mood: number | null;
  energy: number | null;
  sleepHours: number | null;
  notes: string;
  symptoms: string[];
  mucus: Mucus;
  sexKind: SexKind;
};

export function draftFrom(log: DailyLog | null): Draft {
  return {
    flow: log?.flow || "none",
    mood: log?.mood ?? null,
    energy: log?.energy ?? null,
    sleepHours: log?.sleepHours ?? null,
    notes: log?.notes || "",
    symptoms: [...(log?.symptoms || [])],
    mucus: log?.mucus || "none",
    sexKind: log?.sexKind && log.sexKind !== "none" ? log.sexKind : log?.sex ? "unprotected" : "none",
  };
}

const sameSet = (a: string[], b: string[]) => a.length === b.length && a.every((x) => b.includes(x));

/** Only what changed (undefined = keep). Symptoms go as the full list (initial ± her taps). */
export function buildPatch(initial: Draft, draft: Draft): LogPatch {
  const p: LogPatch = {};
  if (draft.flow !== initial.flow) p.flow = draft.flow;
  if (draft.mood !== initial.mood) p.mood = draft.mood;
  if (draft.energy !== initial.energy) p.energy = draft.energy;
  if (draft.sleepHours !== initial.sleepHours) p.sleepHours = draft.sleepHours;
  if (draft.notes !== initial.notes) p.notes = draft.notes.slice(0, 500);
  if (!sameSet(draft.symptoms, initial.symptoms)) p.symptoms = draft.symptoms.slice(0, 24);
  if (draft.mucus !== initial.mucus) p.mucus = draft.mucus;
  if (draft.sexKind !== initial.sexKind) {
    p.sexKind = draft.sexKind;
    p.sex = draft.sexKind !== "none";
  }
  return p;
}

export function toggle(list: string[], id: string): string[] {
  return list.includes(id) ? list.filter((s) => s !== id) : [...list, id].slice(0, 24);
}

/** Mood flower: 5 stops (stored mood 1–5). */
export const MOODS = [
  { value: 1, es: "Mal", en: "Bad", c1: "#8E7F86", c2: "#C9BCC1", open: 0.3, petals: 8 },
  { value: 2, es: "Baja", en: "Low", c1: "#8C79B0", c2: "#D2C4E6", open: 0.48, petals: 9 },
  { value: 3, es: "Normal", en: "Okay", c1: "#C98E76", c2: "#F2CDB8", open: 0.66, petals: 10 },
  { value: 4, es: "Bien", en: "Good", c1: "#C8587A", c2: "#F5B8C6", open: 0.84, petals: 11 },
  { value: 5, es: "Radiante", en: "Radiant", c1: "#B8404F", c2: "#F6B27E", open: 1, petals: 12 },
] as const;

export const ENERGY = [
  { value: 1, es: "Sin pila", en: "Drained" },
  { value: 2, es: "Poca", en: "Low" },
  { value: 3, es: "Normal", en: "Okay" },
  { value: 4, es: "Buena", en: "Good" },
  { value: 5, es: "Mucha", en: "High" },
] as const;

/** Paso 1 chips — stored symptom ids that describe how she feels. */
export const EMOTIONS = [
  { id: "anxiety", es: "Ansiosa", en: "Anxious" },
  { id: "irritable", es: "Irritable", en: "Irritable" },
  { id: "low_mood", es: "Triste", en: "Sad" },
  { id: "brain_fog", es: "Con niebla", en: "Foggy" },
] as const;

/** Paso 4 ids (desire + sleep). */
export const STEP4_IDS = ["libido_up", "libido_down", "insomnia"] as const;
const STEP1_IDS = EMOTIONS.map((e) => e.id as string);

/** What usually shows up in each phase (suggestion order). */
export const PHASE_COMMON: Record<Phase, string[]> = {
  menstrual: ["cramps", "fatigue", "backache", "bloating"],
  follicular: ["acne", "headache", "bloating", "fatigue"],
  ovulatory: ["breast", "bloating", "acne", "headache"],
  luteal: ["headache", "fatigue", "craving", "bloating"],
  none: ["headache", "fatigue", "cramps", "bloating"],
};

export type Suggestion = { id: string; why: "cycle" | "phase" };

/** 4 cards for «Para tu día N»: her own repeat symptom first, then what is common in the phase. */
export function suggestedSymptoms(phase: Phase, repeatSymptom: string | null): Suggestion[] {
  const out: Suggestion[] = [];
  if (repeatSymptom && !STEP1_IDS.includes(repeatSymptom) && !(STEP4_IDS as readonly string[]).includes(repeatSymptom)) {
    out.push({ id: repeatSymptom, why: "cycle" });
  }
  for (const id of PHASE_COMMON[phase]) {
    if (out.length >= 4) break;
    if (!out.some((s) => s.id === id)) out.push({ id, why: "phase" });
  }
  return out.slice(0, 4);
}

/** «Otros»: every other stored id so nothing the old form captured becomes unreachable. */
export function otherSymptoms(suggested: string[], extra: string[] = []): string[] {
  const skip = new Set([...suggested, ...STEP1_IDS, ...STEP4_IDS]);
  const ids = [...SYMPTOMS.filter((s) => !skip.has(s))] as string[];
  // Ids already on the log that are not in SYMPTOMS (older data) stay visible and removable.
  for (const e of extra) if (!skip.has(e) && !ids.includes(e)) ids.push(e);
  return ids;
}

export const FLOWS_V2: { id: Flow; es: string; en: string; level: number }[] = [
  { id: "none", es: "No", en: "No", level: 0 },
  { id: "spotting", es: "Manchado", en: "Spotting", level: 1 },
  { id: "light", es: "Poco", en: "Light", level: 2 },
  { id: "medium", es: "Medio", en: "Medium", level: 3 },
  { id: "heavy", es: "Mucho", en: "Heavy", level: 4 },
];

export const MUCUS_V2: { id: Exclude<Mucus, "none">; es: string; en: string; hintEs?: string; hintEn?: string; color: string }[] = [
  { id: "sticky", es: "Pegajoso", en: "Sticky", color: "#E6DCD2" },
  { id: "creamy", es: "Cremoso", en: "Creamy", color: "#F4E8D8" },
  { id: "eggwhite", es: "Elástico", en: "Stretchy", hintEs: "Como clara de huevo", hintEn: "Like egg white", color: "#E9EEF5" },
  { id: "watery", es: "Acuoso", en: "Watery", color: "#E3EEF1" },
];

/** Likely mucus for the phase («Común hoy»). */
export const MUCUS_COMMON: Record<Phase, Mucus | null> = {
  menstrual: null,
  follicular: "sticky",
  ovulatory: "eggwhite",
  luteal: "creamy",
  none: null,
};

export const SEX_V2: { id: SexKind; es: string; en: string }[] = [
  { id: "none", es: "No", en: "No" },
  { id: "protected", es: "Con protección", en: "Protected" },
  { id: "unprotected", es: "Sin protección", en: "Unprotected" },
  { id: "withdrawal", es: "Marcha atrás", en: "Withdrawal" },
];

export type Desire = "low" | "normal" | "high" | null;
export function desireOf(symptoms: string[]): Desire {
  if (symptoms.includes("libido_up")) return "high";
  if (symptoms.includes("libido_down")) return "low";
  return null;
}
export function withDesire(symptoms: string[], d: Desire): string[] {
  const rest = symptoms.filter((s) => s !== "libido_up" && s !== "libido_down");
  return d === "high" ? [...rest, "libido_up"] : d === "low" ? [...rest, "libido_down"] : rest;
}

/** Sleep in 30-minute steps, 0–14 h. */
export function stepSleep(h: number | null, dir: 1 | -1): number {
  const base = h ?? 7;
  return Math.min(14, Math.max(0, Math.round((base + dir * 0.5) * 2) / 2));
}
export function sleepParts(h: number): { h: number; m: string } {
  const whole = Math.floor(h);
  const mins = Math.round((h - whole) * 60);
  return { h: whole, m: String(mins).padStart(2, "0") };
}

/**
 * Same payload the old LogForm `persist` sends: the full row, periodStarted omitted
 * (the store decides period starts). The draft starts from the saved log, so every
 * field she did not touch goes back exactly as it was.
 */
export function toSaveInput(day: string, d: Draft) {
  return {
    day,
    flow: d.flow,
    mood: d.mood,
    energy: d.energy,
    sleepHours: d.sleepHours,
    notes: d.notes.slice(0, 500),
    symptoms: d.symptoms.slice(0, 24),
    mucus: d.mucus,
    sex: d.sexKind !== "none",
    sexKind: d.sexKind,
  };
}
