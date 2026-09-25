import { cycleGaps, fromISO, phaseForDay } from "./cycle.ts";
import type { DailyLog, Phase } from "./types.ts";

/**
 * «Lo que Savia aprendió de ti» — computed on-device from her own logs.
 * Every insight has a data threshold; below it we say what's still missing.
 */

export const MIN_GAPS_LENGTH = 2; // 3 period starts
export const MIN_GAPS_REGULARITY = 3; // 4 period starts
export const MIN_PERIODS_MEASURED = 2;
export const MIN_SYMPTOM_CYCLES = 2;
export const MIN_MOOD_PER_PHASE = 2;
export const MIN_DESIRE_LOGS = 3;
export const LEARN_DAYS = 20;
export const LEARN_PERIODS = 3;

export type Insight =
  | { id: "cycleLength"; avg: number; n: number }
  | { id: "regularity"; regular: boolean; min: number; max: number; variation: number; atypical: boolean }
  | { id: "periodLength"; avg: number; n: number }
  | { id: "symptomBefore"; symptom: string; days: number; cycles: number }
  | { id: "symptomDuring"; symptom: string; days: number; cycles: number }
  | { id: "moodByPhase"; low: Phase; high: Phase }
  | { id: "desireByPhase"; phase: Phase; share: number };

export type InsightResult = {
  items: Insight[];
  learning: { periodsMore: number; daysMore: number } | null;
  loggedDays: number;
};

const DAY = 86400000;
const diffDays = (a: string, b: string) => Math.round((fromISO(a).getTime() - fromISO(b).getTime()) / DAY);

function median(xs: number[]) {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m]! : Math.round((s[m - 1]! + s[m]!) / 2);
}

function hasContent(l: DailyLog) {
  return (
    (l.flow && l.flow !== "none") ||
    l.symptoms.length > 0 ||
    (l.mood != null && l.mood > 0) ||
    l.sex ||
    (l.sexKind && l.sexKind !== "none") ||
    (l.mucus && l.mucus !== "none")
  );
}

const BLEED = new Set(["light", "medium", "heavy"]);

/** Phase of a past day relative to the real start that preceded it. */
export function phaseOfDay(day: string, starts: string[], periodLength: number, fallbackLen: number): Phase {
  let prev: string | null = null;
  let next: string | null = null;
  for (const s of starts) {
    if (s <= day) prev = s;
    else if (!next) next = s;
  }
  if (!prev) return "none";
  const len = next ? diffDays(next, prev) : fallbackLen;
  const n = diffDays(day, prev) + 1;
  if (n > len + 7) return "none";
  return phaseForDay(n, periodLength, len);
}

export function computeInsights(opts: {
  starts: string[];
  logs: DailyLog[];
  periodLength: number;
  cycleLength: number;
  today: string;
}): InsightResult {
  const starts = Array.from(new Set(opts.starts.map((s) => s.slice(0, 10)))).sort();
  const logs = opts.logs.filter((l) => l.day <= opts.today);
  const byDay = new Map(logs.map((l) => [l.day, l]));
  const items: Insight[] = [];
  const gaps = cycleGaps(starts);

  if (gaps.length >= MIN_GAPS_LENGTH) {
    items.push({ id: "cycleLength", avg: Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length), n: gaps.length });
  }
  if (gaps.length >= MIN_GAPS_REGULARITY) {
    const min = Math.min(...gaps);
    const max = Math.max(...gaps);
    items.push({
      id: "regularity",
      regular: max - min <= 4,
      min,
      max,
      variation: max - min,
      atypical: min < 21 || max > 35,
    });
  }

  // Period length: consecutive bleeding days from each start (spotting ends it).
  const lengths: number[] = [];
  for (const s of starts) {
    let n = 0;
    for (let i = 0; i < 12; i++) {
      const d = new Date(fromISO(s).getTime() + i * DAY + 12 * 3600000);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      if (iso > opts.today) break;
      const l = byDay.get(iso);
      if (l && (BLEED.has(l.flow) || (i === 0 && l.periodStarted))) n++;
      else break;
    }
    if (n >= 2) lengths.push(n);
  }
  if (lengths.length >= MIN_PERIODS_MEASURED) {
    items.push({ id: "periodLength", avg: median(lengths), n: lengths.length });
  }

  // Symptoms relative to period start.
  const before = new Map<string, Map<string, number>>(); // symptom -> start -> days before
  const during = new Map<string, Map<string, number>>(); // symptom -> start -> max day index
  for (const l of logs) {
    for (const s of starts) {
      const d = diffDays(s, l.day); // >0: log is before start
      if (d >= 1 && d <= 7) {
        for (const sym of l.symptoms) {
          if (sym === "spotting") continue;
          const m = before.get(sym) ?? new Map<string, number>();
          m.set(s, Math.max(m.get(s) ?? 0, d));
          before.set(sym, m);
        }
      }
      const into = -d; // 0 = first day
      if (into >= 0 && into < Math.max(opts.periodLength, 3)) {
        for (const sym of l.symptoms) {
          const m = during.get(sym) ?? new Map<string, number>();
          m.set(s, Math.max(m.get(s) ?? 0, into + 1));
          during.set(sym, m);
        }
      }
    }
  }
  const bestOf = (m: Map<string, Map<string, number>>) =>
    [...m.entries()]
      .map(([sym, per]) => ({ sym, cycles: per.size, days: median([...per.values()]) }))
      .filter((x) => x.cycles >= MIN_SYMPTOM_CYCLES)
      .sort((a, b) => b.cycles - a.cycles || a.sym.localeCompare(b.sym))[0];
  const b = bestOf(before);
  if (b) items.push({ id: "symptomBefore", symptom: b.sym, days: b.days, cycles: b.cycles });
  const du = bestOf(during);
  if (du && (!b || du.sym !== b.sym)) items.push({ id: "symptomDuring", symptom: du.sym, days: du.days, cycles: du.cycles });

  // Mood by phase.
  const moodBy: Partial<Record<Phase, number[]>> = {};
  const desireBy: Partial<Record<Phase, number>> = {};
  let desireTotal = 0;
  for (const l of logs) {
    const ph = phaseOfDay(l.day, starts, opts.periodLength, opts.cycleLength);
    if (ph === "none") continue;
    if (l.mood != null && l.mood > 0) (moodBy[ph] ??= []).push(l.mood);
    if (l.symptoms.includes("libido_up")) {
      desireBy[ph] = (desireBy[ph] ?? 0) + 1;
      desireTotal++;
    }
  }
  const phases = (Object.entries(moodBy) as [Phase, number[]][])
    .filter(([, v]) => v.length >= MIN_MOOD_PER_PHASE)
    .map(([p, v]) => ({ p, avg: v.reduce((a, c) => a + c, 0) / v.length }))
    .sort((a, b2) => a.avg - b2.avg);
  if (phases.length >= 2 && phases[phases.length - 1]!.avg - phases[0]!.avg >= 1) {
    items.push({ id: "moodByPhase", low: phases[0]!.p, high: phases[phases.length - 1]!.p });
  }
  if (desireTotal >= MIN_DESIRE_LOGS) {
    const [top, count] = (Object.entries(desireBy) as [Phase, number][]).sort((a, c) => c[1] - a[1])[0]!;
    const share = count / desireTotal;
    if (share >= 0.6) items.push({ id: "desireByPhase", phase: top, share: Math.round(share * 100) / 100 });
  }

  const loggedDays = logs.filter(hasContent).length;
  const periodsMore = Math.max(0, LEARN_PERIODS - starts.length);
  const daysMore = Math.max(0, LEARN_DAYS - loggedDays);
  return { items, learning: periodsMore || daysMore ? { periodsMore, daysMore } : null, loggedDays };
}

type L = "es" | "en";

const SYM: Record<string, [string, string]> = {
  cramps: ["Los cólicos", "Cramps"],
  headache: ["El dolor de cabeza", "Headaches"],
  backache: ["El dolor de espalda", "Back pain"],
  bloating: ["La hinchazón", "Bloating"],
  breast: ["La sensibilidad en el pecho", "Breast tenderness"],
  acne: ["El acné", "Acne"],
  anxiety: ["La ansiedad", "Anxiety"],
  low_mood: ["El ánimo bajo", "Low mood"],
  irritable: ["La irritabilidad", "Irritability"],
  fatigue: ["El cansancio", "Tiredness"],
  craving: ["Los antojos", "Cravings"],
  insomnia: ["El insomnio", "Insomnia"],
  nausea: ["Las náuseas", "Nausea"],
  libido_up: ["Más deseo", "More desire"],
  libido_down: ["Menos deseo", "Less desire"],
};

/** Grammatical plural subjects (ES "Los cólicos suelen…", EN "Cramps tend…"). */
const PLURAL_ES = new Set(["cramps", "craving", "nausea"]);
const PLURAL_EN = new Set(["cramps", "headache", "craving"]);

const PHASE: Record<Phase, [string, string]> = {
  menstrual: ["menstrual", "menstrual"],
  follicular: ["folicular", "follicular"],
  ovulatory: ["ovulatoria", "ovulatory"],
  luteal: ["lútea", "luteal"],
  none: ["", ""],
};

export function insightText(ins: Insight, lang: L): { title: string; detail: string } {
  const es = lang === "es";
  const i = es ? 0 : 1;
  switch (ins.id) {
    case "cycleLength":
      return es
        ? {
            title: `Tus ciclos duran unos ${ins.avg} días`,
            detail:
              ins.avg === 28
                ? "Justo el promedio de libro. Tus predicciones ya usan tu dato."
                : `No 28 como dicen los libros: ajusté tus predicciones a tus ${ins.avg} días.`,
          }
        : {
            title: `Your cycles last about ${ins.avg} days`,
            detail:
              ins.avg === 28
                ? "Right on the textbook average. Your predictions already use your data."
                : `Not the textbook 28: I tuned your predictions to your ${ins.avg} days.`,
          };
    case "regularity":
      if (ins.regular)
        return es
          ? { title: "Tu ciclo es regular", detail: `Varía como mucho ${ins.variation} ${ins.variation === 1 ? "día" : "días"} entre un mes y otro.` }
          : { title: "Your cycle is regular", detail: `It varies by at most ${ins.variation} ${ins.variation === 1 ? "day" : "days"} month to month.` };
      return es
        ? {
            title: "Tu ciclo varía bastante",
            detail: `Entre ${ins.min} y ${ins.max} días. Por eso tu predicción lleva margen${ins.atypical ? "; si pasa seguido, coméntalo con tu médica" : ""}.`,
          }
        : {
            title: "Your cycle varies quite a bit",
            detail: `Between ${ins.min} and ${ins.max} days. That's why your prediction has a margin${ins.atypical ? "; if it keeps happening, mention it to your doctor" : ""}.`,
          };
    case "periodLength":
      return es
        ? { title: `Tu regla dura unos ${ins.avg} días`, detail: `Medido en tus últimas ${ins.n} reglas anotadas.` }
        : { title: `Your period lasts about ${ins.avg} days`, detail: `Measured over your last ${ins.n} logged periods.` };
    case "symptomBefore": {
      const s = SYM[ins.symptom]?.[i] ?? (es ? "Ese síntoma" : "That symptom");
      const pl = (es ? PLURAL_ES : PLURAL_EN).has(ins.symptom);
      return es
        ? {
            title: `${s} ${pl ? "suelen" : "suele"} llegar ~${ins.days} ${ins.days === 1 ? "día" : "días"} antes de tu regla`,
            detail: `Pasó en ${ins.cycles} ciclos. Tenerlo a mano esos días ayuda.`,
          }
        : {
            title: `${s} ${pl ? "tend" : "tends"} to show up ~${ins.days} ${ins.days === 1 ? "day" : "days"} before your period`,
            detail: `It happened in ${ins.cycles} cycles. Being ready those days helps.`,
          };
    }
    case "symptomDuring": {
      const s = SYM[ins.symptom]?.[i] ?? (es ? "Ese síntoma" : "That symptom");
      const pl = (es ? PLURAL_ES : PLURAL_EN).has(ins.symptom);
      return es
        ? {
            title: `${s} ${pl ? "se concentran" : "se concentra"} ${ins.days === 1 ? "en el primer día" : `en los primeros ${ins.days} días`} de tu regla`,
            detail: `Visto en ${ins.cycles} reglas.`,
          }
        : {
            title: `${s} ${pl ? "concentrate" : "concentrates"} ${ins.days === 1 ? "on the first day" : `in the first ${ins.days} days`} of your period`,
            detail: `Seen in ${ins.cycles} periods.`,
          };
    }
    case "moodByPhase":
      return es
        ? {
            title: `Tu ánimo suele bajar en fase ${PHASE[ins.low][0]}`,
            detail: `Y está mejor en fase ${PHASE[ins.high][0]}. No eres tú: son tus hormonas.`,
          }
        : {
            title: `Your mood tends to dip in the ${PHASE[ins.low][1]} phase`,
            detail: `And it's better in the ${PHASE[ins.high][1]} phase. It's not you: it's hormones.`,
          };
    case "desireByPhase":
      return es
        ? {
            title: `Tu deseo sube en fase ${PHASE[ins.phase][0]}`,
            detail: `${Math.round(ins.share * 100)}% de las veces que anotaste más deseo. Si no buscas embarazo, ojo con los días fértiles.`,
          }
        : {
            title: `Your desire rises in the ${PHASE[ins.phase][1]} phase`,
            detail: `${Math.round(ins.share * 100)}% of the times you logged more desire. If you're not trying, mind your fertile days.`,
          };
  }
}

export function learningText(l: { periodsMore: number; daysMore: number }, lang: L) {
  const es = lang === "es";
  const parts: string[] = [];
  if (l.periodsMore)
    parts.push(es ? `${l.periodsMore} ${l.periodsMore === 1 ? "regla" : "reglas"}` : `${l.periodsMore} ${l.periodsMore === 1 ? "period" : "periods"}`);
  if (l.daysMore) parts.push(es ? `${l.daysMore} días` : `${l.daysMore} days`);
  const what = parts.join(es ? " y " : " and ");
  return es ? `Savia está aprendiendo: anota ${what} más.` : `Savia is learning: log ${what} more.`;
}
