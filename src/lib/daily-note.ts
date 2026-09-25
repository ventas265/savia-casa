import { addDaysISO, daysUntil, type DayMark } from "./cycle.ts";
import type { DailyLog, Intention, Phase } from "./types.ts";

/**
 * Savia's daily note: deterministic templates (always available) that the AI
 * may replace when it responds. Warm friend-doctor, cycle-first, never
 * "safe days", never a pregnancy promise. Opens with a companion check-in.
 */

export type Lang = "es" | "en";

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

export type Situation =
  | "periodPain"
  | "period"
  | "lowMood"
  | "peak"
  | "fertile"
  | "prePeriod"
  | "luteal"
  | "follicular"
  | "none";

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

/** Stable small hash so the same day always shows the same variant. */
export function seedIndex(seed: string, n: number) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h) % Math.max(1, n);
}

type Bank = Record<Situation, string[]>;

const CHECKIN: Record<Lang, Bank> = {
  es: {
    periodPain: [
      "Hoy puede pesar un poco más. ¿Cómo vas? Aquí estoy.",
      "Sé que el cuerpo duele estos días. ¿Cómo te sientes? Estoy para ti.",
      "Día de regla y molestias: vamos despacio. ¿Qué tal vas?",
    ],
    period: [
      "¿Cómo te sientes hoy? Estoy para ti.",
      "Días de regla: sin exigencias. ¿Qué tal amaneciste?",
      "Hola, aquí estoy. ¿Cómo va tu cuerpo hoy?",
    ],
    lowMood: [
      "Ayer no fue fácil. ¿Cómo amaneciste hoy? Estoy para ti.",
      "No tienes que poder con todo. ¿Cómo te sientes hoy?",
      "Aquí sigo contigo. ¿Qué tal va tu día?",
    ],
    peak: [
      "¿Qué tal tu día? Tu cuerpo está en su punto más fértil.",
      "Hola. ¿Cómo te sientes hoy? Es tu día estimado de ovulación.",
      "¿Cómo vas? Hoy tu cuerpo está en modo ovulación.",
    ],
    fertile: [
      "¿Qué tal tu día? Estás en tu ventana fértil.",
      "¿Cómo te sientes hoy? Estos días son de energía alta.",
      "Hola, ¿cómo vas? Tu cuerpo está en días fértiles.",
    ],
    prePeriod: [
      "Se acerca la regla. ¿Cómo va tu cuerpo hoy?",
      "¿Cómo te sientes? Estos días antes de la regla pueden pesar.",
      "Aquí estoy. ¿Qué tal llevas estos días antes de la regla?",
    ],
    luteal: [
      "¿Cómo te sientes hoy? Estoy para ti.",
      "¿Qué tal tu día? Tu cuerpo va bajando el ritmo.",
      "Hola. ¿Cómo amaneciste? Cuéntame si algo pesa.",
    ],
    follicular: [
      "¿Qué tal tu día? Tu energía suele ir subiendo.",
      "Hola, ¿cómo te sientes hoy? Estos días suelen sentirse más livianos.",
      "¿Cómo vas? Buen momento para lo que tenías pendiente.",
    ],
    none: [
      "¿Qué tal tu día? Estoy para ti.",
      "¿Cómo te sientes hoy?",
      "Hola, aquí estoy. ¿Cómo vas?",
    ],
  },
  en: {
    periodPain: [
      "Today might weigh a bit more. How are you doing? I'm here.",
      "I know your body hurts these days. How do you feel? I'm here for you.",
      "Period day with discomfort: let's go slow. How are you?",
    ],
    period: [
      "How are you feeling today? I'm here for you.",
      "Period days: no pressure. How did you wake up?",
      "Hi, I'm here. How is your body today?",
    ],
    lowMood: [
      "Yesterday wasn't easy. How did you wake up today? I'm here for you.",
      "You don't have to carry everything. How do you feel today?",
      "Still here with you. How is your day going?",
    ],
    peak: [
      "How's your day? Your body is at its most fertile.",
      "Hi. How do you feel today? It's your estimated ovulation day.",
      "How are you? Today your body is in ovulation mode.",
    ],
    fertile: [
      "How's your day? You're in your fertile window.",
      "How do you feel today? These tend to be high-energy days.",
      "Hi, how are you? Your body is in its fertile days.",
    ],
    prePeriod: [
      "Your period is close. How is your body today?",
      "How are you feeling? The days before your period can weigh more.",
      "I'm here. How are these pre-period days going?",
    ],
    luteal: [
      "How are you feeling today? I'm here for you.",
      "How's your day? Your body is slowing down a little.",
      "Hi. How did you wake up? Tell me if something feels heavy.",
    ],
    follicular: [
      "How's your day? Your energy tends to rise now.",
      "Hi, how do you feel today? These days often feel lighter.",
      "How are you? Good moment for what you had pending.",
    ],
    none: ["How's your day? I'm here for you.", "How are you feeling today?", "Hi, I'm here. How are you?"],
  },
};

const BODY: Record<Lang, Record<"menstrual" | "follicular" | "fertile" | "luteal" | "prePeriod" | "none", string[]>> = {
  es: {
    menstrual: [
      "Día {n} de tu ciclo: calor en el vientre, agua y descanso cuentan como autocuidado.",
      "Día {n}: tu cuerpo se está renovando. Comer algo caliente y moverte suave puede aliviar.",
      "Día {n} de tu ciclo: si el cansancio pesa, bajar el ritmo también es cuidarte.",
    ],
    follicular: [
      "Día {n}: el estrógeno sube y con él suelen venir ganas y claridad.",
      "Día {n} de tu ciclo: buen momento para moverte, crear o empezar algo.",
      "Día {n}: tu cuerpo va ganando energía después de la regla.",
    ],
    fertile: [
      "Día {n} de tu ciclo: más energía y, muchas veces, más deseo.",
      "Día {n}: tu cuerpo se prepara para ovular; es normal notar flujo más elástico.",
      "Día {n} de tu ciclo: estás en tu pico de energía del mes.",
    ],
    luteal: [
      "Día {n}: la progesterona sube y a veces pide más calma y más comida.",
      "Día {n} de tu ciclo: si notas hinchazón o antojos, es muy de esta fase.",
      "Día {n}: dormir bien y comer a tus horas ayuda mucho estos días.",
    ],
    prePeriod: [
      "Día {n}: tu regla llegaría en {d} días; puede haber más sensibilidad.",
      "Día {n} de tu ciclo: faltan unos {d} días para la regla. Tenlo todo a mano.",
      "Día {n}: la regla se acerca (unos {d} días). Sé amable contigo.",
    ],
    none: [
      "Anota cómo te sientes y te iré conociendo mejor.",
      "Cada cosa que anotas me ayuda a acompañarte mejor.",
      "Aquí tienes tu espacio para contarme cómo vas.",
    ],
  },
  en: {
    menstrual: [
      "Cycle day {n}: warmth on your belly, water and rest all count as self-care.",
      "Day {n}: your body is renewing. Something warm to eat and gentle movement can help.",
      "Cycle day {n}: if you're tired, slowing down is also taking care of yourself.",
    ],
    follicular: [
      "Day {n}: estrogen rises and often brings drive and clarity.",
      "Cycle day {n}: a good moment to move, create or start something.",
      "Day {n}: your body is gaining energy after your period.",
    ],
    fertile: [
      "Cycle day {n}: more energy and, often, more desire.",
      "Day {n}: your body is getting ready to ovulate; stretchier discharge is normal.",
      "Cycle day {n}: you're at your energy peak of the month.",
    ],
    luteal: [
      "Day {n}: progesterone rises and can ask for more calm and more food.",
      "Cycle day {n}: bloating or cravings are very typical of this phase.",
      "Day {n}: good sleep and regular meals help a lot these days.",
    ],
    prePeriod: [
      "Day {n}: your period would arrive in {d} days; you may feel more sensitive.",
      "Cycle day {n}: about {d} days to your period. Keep what you need nearby.",
      "Day {n}: your period is close (about {d} days). Be kind to yourself.",
    ],
    none: [
      "Log how you feel and I'll get to know you better.",
      "Everything you log helps me walk with you better.",
      "This is your space to tell me how you're doing.",
    ],
  },
};

const FERTILE_LINE: Record<Lang, { fertile: string; peak: string; ttc: string }> = {
  es: {
    fertile: "Estás en días fértiles: más chance de embarazo. Si no lo buscas, cuídate más.",
    peak: "Hoy es tu ovulación estimada, la chance más alta del mes. Si no buscas embarazo, cuídate más.",
    ttc: "Si buscas embarazo, estos son tus días con más chance. Sin presión: es una estimación.",
  },
  en: {
    fertile: "You're in your fertile days: higher chance of pregnancy. If you're not trying, protect yourself more.",
    peak: "Today is your estimated ovulation, the highest chance of the month. If you're not trying, protect yourself more.",
    ttc: "If you're trying, these are your highest-chance days. No pressure: it's an estimate.",
  },
};

const EXTRA: Record<Lang, Record<"riskySex" | "pain" | "lowMood" | "desireUp" | "desireDown" | "goodMood", string>> = {
  es: {
    riskySex:
      "Anotaste relaciones sin protección en días fértiles: si no buscas embarazo, la anticoncepción de emergencia funciona mejor cuanto antes.",
    pain: "Anotaste molestias: si el dolor no te deja hacer tu día, vale la pena consultarlo.",
    lowMood: "Si el ánimo sigue bajo, hablarlo ayuda; aquí puedes contarme.",
    desireUp: "Si notas más deseo, es muy de esta fase de tu ciclo.",
    desireDown: "Tener menos deseo algunos días es normal; tu cuerpo va por fases.",
    goodMood: "Qué bueno que te sientas bien; aprovecha esa energía a tu manera.",
  },
  en: {
    riskySex:
      "You logged unprotected sex on fertile days: if you're not trying, emergency contraception works best the sooner it's taken.",
    pain: "You logged discomfort: if pain stops you from doing your day, it's worth checking.",
    lowMood: "If your mood stays low, talking helps; you can tell me here.",
    desireUp: "If you notice more desire, that's very typical of this phase.",
    desireDown: "Less desire on some days is normal; your body moves in phases.",
    goodMood: "Glad you're feeling good; use that energy your way.",
  },
};

function fill(s: string, c: NoteCtx) {
  return s.replace("{n}", String(c.cycleDay ?? "")).replace("{d}", String(c.daysToPeriod ?? ""));
}

export type DailyNote = { situation: Situation; checkIn: string; lines: string[]; text: string };

export function buildDailyNote(c: NoteCtx, lang: Lang, seed: string): DailyNote {
  const sit = situationFor(c);
  const checkIns = CHECKIN[lang][sit];
  const checkIn = checkIns[seedIndex(`${seed}:c`, checkIns.length)]!;
  const bodyKey: keyof (typeof BODY)["es"] =
    c.cycleDay == null
      ? "none"
      : c.onPeriod || c.phase === "menstrual"
        ? "menstrual"
        : c.mark === "fertile" || c.mark === "peak"
          ? "fertile"
          : sit === "prePeriod"
            ? "prePeriod"
            : c.phase === "luteal"
              ? "luteal"
              : c.phase === "follicular" || c.phase === "ovulatory"
                ? "follicular"
                : "none";
  const bodies = BODY[lang][bodyKey];
  const body = fill(bodies[seedIndex(`${seed}:b`, bodies.length)]!, c);
  const lines = [checkIn, body];
  const hot = c.mark === "fertile" || c.mark === "peak";
  const ex = EXTRA[lang];
  if (c.riskySexRecent && c.intention !== "ttc") lines.push(ex.riskySex);
  else if (hot) {
    const f = FERTILE_LINE[lang];
    lines.push(c.intention === "ttc" ? f.ttc : c.mark === "peak" ? f.peak : f.fertile);
  } else if (c.pain && sit !== "periodPain") lines.push(ex.pain);
  else if (c.lowMood && sit !== "lowMood") lines.push(ex.lowMood);
  else if (c.desireUp) lines.push(ex.desireUp);
  else if (c.desireDown) lines.push(ex.desireDown);
  else if (c.goodMood) lines.push(ex.goodMood);
  return { situation: sit, checkIn, lines, text: lines.join(" ") };
}

export type MoodReply = "good" | "meh" | "bad";

const MOOD_REPLY: Record<Lang, Record<MoodReply, Partial<Record<Situation, string[]>> & { any: string[] }>> = {
  es: {
    good: {
      any: [
        "Qué alegría leerte así. Lo anoto para que veamos tu patrón.",
        "Me encanta. Guardado: días así también cuentan.",
        "Bien por ti. Lo dejo anotado en tu día.",
      ],
      periodPain: ["Qué bueno que, aun con regla, vas bien. Lo anoto."],
    },
    meh: {
      any: [
        "Regular también vale. Lo anoto; si quieres, hablamos.",
        "Gracias por contarme. Vamos con calma hoy.",
        "Anotado. A veces el día solo pide ir paso a paso.",
      ],
      prePeriod: ["Anotado. Antes de la regla es común sentirse así; no es tu culpa."],
      luteal: ["Anotado. En esta fase es común sentirse más apagada; ve suave."],
    },
    bad: {
      any: [
        "Lo siento. Lo anoto; no tienes que poder con todo hoy. Aquí estoy.",
        "Gracias por decírmelo. Estoy para ti si quieres contarme más.",
        "Anotado. Sé amable contigo hoy; puedes escribirme cuando quieras.",
      ],
      periodPain: ["Lo siento, la regla con dolor cansa. Calor, agua y descanso; aquí estoy."],
      prePeriod: ["Lo siento. Antes de la regla todo pesa más; no es tu culpa. Aquí estoy."],
    },
  },
  en: {
    good: {
      any: [
        "So glad to hear that. I'll log it so we can see your pattern.",
        "Love that. Saved: days like this count too.",
        "Good for you. I've noted it on your day.",
      ],
      periodPain: ["Glad you're doing well even on your period. Noted."],
    },
    meh: {
      any: [
        "So-so counts too. Noted; we can talk if you want.",
        "Thanks for telling me. Let's take today slowly.",
        "Noted. Some days just ask to go step by step.",
      ],
      prePeriod: ["Noted. Feeling like this before your period is common; it's not your fault."],
      luteal: ["Noted. Feeling flatter in this phase is common; go gently."],
    },
    bad: {
      any: [
        "I'm sorry. Noted; you don't have to carry everything today. I'm here.",
        "Thanks for telling me. I'm here if you want to say more.",
        "Noted. Be kind to yourself today; write to me anytime.",
      ],
      periodPain: ["I'm sorry, a painful period is exhausting. Warmth, water, rest; I'm here."],
      prePeriod: ["I'm sorry. Everything weighs more before your period; it's not your fault. I'm here."],
    },
  },
};

export const MOOD_VALUE: Record<MoodReply, number> = { good: 4, meh: 3, bad: 1 };

export function moodReply(mood: MoodReply, sit: Situation, lang: Lang, seed: string) {
  const bank = MOOD_REPLY[lang][mood];
  const list = bank[sit] ?? bank.any;
  return list[seedIndex(`${seed}:${mood}`, list.length)]!;
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

/** Reject AI text that breaks our rules; the template is used instead. */
export function acceptAiNote(text: string | null | undefined): string | null {
  if (!text) return null;
  const clean = text.replace(/\s+/g, " ").replace(/^["«]|["»]$/g, "").trim();
  if (clean.length < 30 || clean.length > 420) return null;
  if (/\b(segur[oa]s?|safe)\b/i.test(clean)) return null;
  if (/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(clean)) return null;
  return clean;
}
