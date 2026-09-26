import { addDaysISO, daysUntil, type DayMark } from "./cycle.ts";
import type { DailyLog, Intention, Phase } from "./types.ts";
import {
  companionOpener,
  FERTILE_LINE,
  fillCycle,
  moodReplyText,
  NOTE_CYCLE_LINES,
  NOTE_EXTRA,
  periodDueLine,
  seedIndex,
  type BodyKey,
  type Lang,
  type MoodReply,
  type Opener,
  type Situation,
} from "./companion-messages.ts";

export { seedIndex };
export type { Lang, MoodReply, Situation };

/**
 * Savia's daily note: deterministic templates (always available) that the AI
 * may replace when it responds. Warm friend-doctor, cycle-first, never
 * "safe days", never a pregnancy promise. Opens with a companion check-in.
 */


export type NoteCtx = {
  phase: Phase;
  cycleDay: number | null;
  mark: DayMark | null;
  onPeriod: boolean;
  daysToPeriod: number | null;
  intention: Intention;
  /** Symptoms logged today + yesterday. */
  symptoms: string[];
  /** Lowest mood (1-5) logged today/yesterday. */
  lowMood: boolean;
  goodMood: boolean;
  pain: boolean;
  desireUp: boolean;
  desireDown: boolean;
  /** Unprotected / withdrawal sex on a fertile day within the last 5 days. */
  riskySexRecent: boolean;
  /** Any sex logged today/yesterday. */
  sexRecent: boolean;
};

const PAIN = new Set(["cramps", "backache", "headache", "breast", "pain_sex"]);
const LOW = new Set(["low_mood", "anxiety", "irritable"]);

export function buildNoteContext(opts: {
  today: string;
  phase: Phase;
  cycleDay: number | null;
  mark: DayMark | null;
  onPeriod: boolean;
  nextPeriod: string | null;
  intention: Intention;
  logs: DailyLog[];
  /** Fertility mark for an arbitrary day (for the risky-sex check). */
  markFor?: (iso: string) => DayMark | null;
}): NoteCtx {
  const y = addDaysISO(opts.today, -1);
  const near = opts.logs.filter((l) => l.day === opts.today || l.day === y);
  const symptoms = Array.from(new Set(near.flatMap((l) => l.symptoms)));
  const moods = near.map((l) => l.mood).filter((m): m is number => m != null && m > 0);
  const since5 = addDaysISO(opts.today, -5);
  const riskySexRecent = opts.logs.some((l) => {
    if (l.day < since5 || l.day > opts.today) return false;
    const kind = l.sexKind || (l.sex ? "unprotected" : "none");
    if (kind !== "unprotected" && kind !== "withdrawal") return false;
    const m = opts.markFor ? opts.markFor(l.day) : null;
    return m === "fertile" || m === "peak";
  });
  return {
    phase: opts.phase,
    cycleDay: opts.cycleDay,
    mark: opts.mark,
    onPeriod: opts.onPeriod,
    daysToPeriod: daysUntil(opts.nextPeriod, opts.today),
    intention: opts.intention,
    symptoms,
    lowMood: moods.some((m) => m <= 2) || symptoms.some((s) => LOW.has(s)),
    goodMood: moods.length > 0 && moods.every((m) => m >= 4),
    pain: symptoms.some((s) => PAIN.has(s)),
    desireUp: symptoms.includes("libido_up"),
    desireDown: symptoms.includes("libido_down"),
    riskySexRecent,
    sexRecent: near.some((l) => l.sex || (l.sexKind && l.sexKind !== "none")),
  };
}

export function situationFor(c: NoteCtx): Situation {
  const period = c.onPeriod || c.phase === "menstrual";
  if (period && c.pain) return "periodPain";
  if (period) return "period";
  if (c.lowMood) return "lowMood";
  if (c.mark === "peak") return "peak";
  if (c.mark === "fertile") return "fertile";
  if (c.daysToPeriod != null && c.daysToPeriod >= 0 && c.daysToPeriod <= 3) return "prePeriod";
  if (c.phase === "luteal") return "luteal";
  if (c.phase === "follicular" || c.phase === "ovulatory") return "follicular";
  return "none";
}

type BuildOpts = {
  /** Registered name (profile.displayName); missing / «tú» → «Hola, ¿cómo estás?». */
  name?: string | null;
  /** Local wall-clock hour (0–23) in her time zone; defaults to the device clock. */
  hour?: number;
};

export function bodyKeyFor(c: NoteCtx, sit: Situation = situationFor(c)): BodyKey {
  if (c.cycleDay == null) return "none";
  if (c.onPeriod || c.phase === "menstrual") return "menstrual";
  if (c.mark === "fertile" || c.mark === "peak") return "fertile";
  if (sit === "prePeriod") return "prePeriod";
  if (c.phase === "luteal") return "luteal";
  if (c.phase === "follicular" || c.phase === "ovulatory") return "follicular";
  return "none";
}

export type DailyNote = { situation: Situation; checkIn: string; lines: string[]; text: string; opener: Opener };

/**
 * Template note (always ready; the AI may replace it):
 * «Claudia, buenas tardes. ¿Cómo va tu día? ¿Cómo te sientes?» + cycle line (+ one extra).
 */
export function buildDailyNote(c: NoteCtx, lang: Lang, seed: string, opts: BuildOpts = {}): DailyNote {
  const sit = situationFor(c);
  const hour = opts.hour ?? new Date().getHours();
  const opener = companionOpener({ name: opts.name, hour, lang, situation: sit, seed });
  const checkIn = opener.line;
  const key = bodyKeyFor(c, sit);
  const bodies = NOTE_CYCLE_LINES[lang][key];
  const due = key === "prePeriod" ? periodDueLine(lang, c.daysToPeriod) : null;
  const body = due ?? fillCycle(bodies[seedIndex(`${seed}:b`, bodies.length)]!, c.cycleDay, c.daysToPeriod);
  const lines = [checkIn, body];
  const hot = c.mark === "fertile" || c.mark === "peak";
  const ex = NOTE_EXTRA[lang];
  if (c.riskySexRecent && c.intention !== "ttc") lines.push(ex.riskySex);
  else if (hot) {
    const f = FERTILE_LINE[lang];
    lines.push(c.intention === "ttc" ? f.ttc : c.mark === "peak" ? f.peak : f.fertile);
  } else if (c.pain && sit !== "periodPain") lines.push(ex.pain);
  else if (c.lowMood && sit !== "lowMood") lines.push(ex.lowMood);
  else if (c.desireUp) lines.push(ex.desireUp);
  else if (c.desireDown) lines.push(ex.desireDown);
  else if (c.goodMood) lines.push(ex.goodMood);
  return { situation: sit, checkIn, lines, text: lines.join(" "), opener };
}

export const MOOD_VALUE: Record<MoodReply, number> = { good: 4, meh: 3, bad: 1 };

export function moodReply(mood: MoodReply, sit: Situation, lang: Lang, seed: string, name?: string | null) {
  return moodReplyText(mood, sit, lang, seed, name);
}

/** Plain facts for the AI prompt (no names, no free text). */
export function noteFacts(c: NoteCtx) {
  return [
    `phase: ${c.phase}`,
    `cycle day: ${c.cycleDay ?? "n/a"}`,
    `fertility estimate today: ${c.mark ?? "n/a"}`,
    `on period: ${c.onPeriod}`,
    `days to next period: ${c.daysToPeriod ?? "n/a"}`,
    `intention: ${c.intention}`,
    `symptoms today/yesterday: ${c.symptoms.join(", ") || "none"}`,
    `low mood: ${c.lowMood}`,
    `desire up: ${c.desireUp}, desire down: ${c.desireDown}`,
    `sex logged today/yesterday: ${c.sexRecent}`,
    `unprotected sex on a fertile day in last 5 days: ${c.riskySexRecent}`,
  ].join("\n");
}

function fold(s: string) {
  return s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

/**
 * Reject AI text that breaks our rules; the template is used instead.
 * `greeting` (e.g. «Claudia, buenas tardes.» or «Hola, ¿cómo estás?») must
 * open the note — the model is told to start with it.
 */
export function acceptAiNote(text: string | null | undefined, greeting?: string): string | null {
  if (!text) return null;
  const clean = text.replace(/\s+/g, " ").replace(/^["«]|["»]$/g, "").trim();
  if (clean.length < 30 || clean.length > 460) return null;
  if (/\b(segur[oa]s?|safe)\b/i.test(clean)) return null;
  if (/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(clean)) return null;
  if (greeting) {
    const want = fold(greeting);
    if (!fold(clean).startsWith(want)) return null;
  }
  return clean;
}
