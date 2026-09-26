/**
 * Savia's companion voice — the ONE place where the friend-style strings live.
 *
 * Every message reads like a friend texting:
 *   «Claudia, buenas tardes. ¿Cómo va tu día? ¿Cómo te sientes?» + a short cycle line.
 * Without a name: «Hola, ¿cómo estás?» + a question + the cycle line.
 *
 * Used by the Hoy daily note templates (src/lib/daily-note.ts), the mood-button
 * replies, the «Quiero hablar» chat opener, the AI note prompt, and Web Push
 * (src/lib/push-server.ts). Pure module: no aliases, no DOM, no server imports,
 * so `node --test --experimental-strip-types` can run it directly.
 *
 * Voice rules (see design-research/mensajes-acompanamiento.md): tú, neutral
 * Latin American Spanish, no voseo, no emoji, never "seguro"/"días seguros",
 * never pregnancy as a goal; fertile lines are an estimate, not contraception.
 */

export type Lang = "es" | "en";
export type Moment = "morning" | "afternoon" | "night";

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

/** Cycle-line bank keys (phase-first, independent from mood). */
export type BodyKey = "menstrual" | "follicular" | "fertile" | "luteal" | "prePeriod" | "none";

export const DEFAULT_TIME_ZONE = "America/Caracas";

// ---------------------------------------------------------------------------
// Time of day
// ---------------------------------------------------------------------------

/** «buenos días» before 12:00, «buenas tardes» 12:00–18:59, «buenas noches» from 19:00. */
export function momentForHour(hour: number): Moment {
  const h = ((Math.floor(hour) % 24) + 24) % 24;
  if (h < 12) return "morning";
  if (h < 19) return "afternoon";
  return "night";
}

/** A valid IANA zone or the default (Caracas) — never throws. */
export function safeTimeZone(tz: string | null | undefined): string {
  const z = (tz || "").trim();
  if (!z || z.length > 64) return DEFAULT_TIME_ZONE;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: z });
    return z;
  } catch {
    return DEFAULT_TIME_ZONE;
  }
}

function zoneParts(date: Date, tz: string | null | undefined) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: safeTimeZone(tz),
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return { y: get("year"), m: get("month"), d: get("day"), h: Number(get("hour")) % 24 };
}

/** Wall-clock hour (0–23) of `date` in the user's time zone. */
export function hourInTimeZone(date: Date, tz: string | null | undefined): number {
  return zoneParts(date, tz).h;
}

/** Wall-clock calendar day (YYYY-MM-DD) of `date` in the user's time zone. */
export function dayInTimeZone(date: Date, tz: string | null | undefined): string {
  const p = zoneParts(date, tz);
  return `${p.y}-${p.m}-${p.d}`;
}

const GREETING: Record<Lang, Record<Moment, string>> = {
  es: { morning: "buenos días", afternoon: "buenas tardes", night: "buenas noches" },
  en: { morning: "good morning", afternoon: "good afternoon", night: "good evening" },
};

export function greetingFor(hour: number, lang: Lang = "es") {
  return GREETING[lang][momentForHour(hour)];
}

/** «Buenas tardes, QA» — the one greeting line every screen uses (header, onboarding, note). */
export function greetingLine(hour: number, name: string | null | undefined, lang: Lang = "es") {
  const g = capitalize(greetingFor(hour, lang));
  const who = companionName(name);
  return who ? `${g}, ${who}` : g;
}

export function capitalize(s: string) {
  return s ? s.charAt(0).toLocaleUpperCase("es") + s.slice(1) : s;
}

// ---------------------------------------------------------------------------
// Name
// ---------------------------------------------------------------------------

/** Placeholder values that mean "she did not give a name" (onboarding stores «tú» when empty). */
const NO_NAME = new Set(["tu", "tú", "you", "yo", "-", "—", "anonima", "anónima", "x"]);

/**
 * The registered name as a friend would write it: first word, max 24 chars,
 * her own capitalisation kept (only all-lowercase or SHOUTED names get a
 * normal capital; short initials like «QA» stay). "" when missing / placeholder.
 */
export function companionName(raw: string | null | undefined): string {
  const first = (raw || "").trim().split(/\s+/)[0] || "";
  const clean = first.replace(/[^\p{L}\p{M}'-]/gu, "").slice(0, 24);
  if (clean.length < 2) return "";
  if (NO_NAME.has(clean.toLocaleLowerCase("es"))) return "";
  const lower = clean.toLocaleLowerCase("es");
  const upper = clean.toLocaleUpperCase("es");
  // Short all-caps words are initials (QA, MJ): keep them as typed.
  if (upper === clean && clean.length <= 3) return clean;
  // Shouted names (CLAUDIA) and all-lowercase (maría) get a normal capital; mixed case stays as typed.
  return capitalize(lower === clean || upper === clean ? lower : clean);
}

// ---------------------------------------------------------------------------
// Deterministic variety
// ---------------------------------------------------------------------------

/** Stable small hash so the same day always shows the same variant. */
export function seedIndex(seed: string, n: number) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h) % Math.max(1, n);
}

function pickFrom<T>(list: readonly T[], seed: string): T {
  return list[seedIndex(seed, list.length)]!;
}

// ---------------------------------------------------------------------------
// Questions: one for the moment of the day + one for how she is (phase/mood)
// ---------------------------------------------------------------------------

export const MOMENT_QUESTIONS: Record<Lang, Record<Moment, string[]>> = {
  es: {
    morning: ["¿Cómo amaneciste?", "¿Qué tal dormiste?", "¿Cómo empieza tu día?"],
    afternoon: ["¿Cómo va tu día?", "¿Qué tal va tu tarde?", "¿Cómo va todo por allá?"],
    night: ["¿Cómo te fue hoy?", "¿Qué tal estuvo tu día?", "¿Cómo cierras el día?"],
  },
  en: {
    morning: ["How did you wake up?", "Did you sleep well?", "How is your day starting?"],
    afternoon: ["How's your day going?", "How's your afternoon?", "How's everything going?"],
    night: ["How did today go?", "How was your day?", "How are you ending the day?"],
  },
};

export const FEELING_QUESTIONS: Record<Lang, Record<Situation, string[]>> = {
  es: {
    periodPain: ["¿Cómo va ese dolor?", "¿Pudiste descansar un poco?", "¿Cómo lo llevas?"],
    period: ["¿Cómo te sientes?", "¿Cómo llevas la regla?", "¿Cómo está tu cuerpo hoy?"],
    lowMood: ["¿Cómo te sientes hoy?", "¿Cómo está tu ánimo?", "¿Quieres contarme cómo vas?"],
    peak: ["¿Cómo te sientes?", "¿Cómo va tu energía?", "¿Qué tal tu ánimo hoy?"],
    fertile: ["¿Cómo te sientes?", "¿Cómo va tu energía?", "¿Qué tal tu ánimo hoy?"],
    prePeriod: ["¿Cómo va tu cuerpo?", "¿Cómo te sientes estos días?", "¿Algo te está pesando?"],
    luteal: ["¿Cómo te sientes?", "¿Cómo vas de energía?", "¿Algo te pesa hoy?"],
    follicular: ["¿Cómo te sientes?", "¿Cómo va tu energía?", "¿Qué tienes en mente hoy?"],
    none: ["¿Cómo te sientes?", "¿Qué tal tu ánimo?", "¿Cómo va tu cuerpo hoy?"],
  },
  en: {
    periodPain: ["How's the pain?", "Did you get some rest?", "How are you holding up?"],
    period: ["How do you feel?", "How's your period going?", "How's your body today?"],
    lowMood: ["How do you feel today?", "How's your mood?", "Want to tell me how you're doing?"],
    peak: ["How do you feel?", "How's your energy?", "How's your mood today?"],
    fertile: ["How do you feel?", "How's your energy?", "How's your mood today?"],
    prePeriod: ["How's your body?", "How are these days feeling?", "Is anything weighing on you?"],
    luteal: ["How do you feel?", "How's your energy?", "Anything feeling heavy today?"],
    follicular: ["How do you feel?", "How's your energy?", "What's on your mind today?"],
    none: ["How do you feel?", "How's your mood?", "How's your body today?"],
  },
};

const NO_NAME_OPENER: Record<Lang, string> = { es: "Hola, ¿cómo estás?", en: "Hi, how are you?" };

export type Opener = {
  /** «Claudia, buenas tardes» / «Hola» — notification title. */
  title: string;
  /** «Claudia, buenas tardes.» / «Hola, ¿cómo estás?» — first words of the note. */
  greeting: string;
  /** Friend-style question(s) after the greeting. */
  question: string;
  /** greeting + question: the full check-in line. */
  line: string;
};

/**
 * Name + time-of-day greeting + friend question, e.g.
 * «Claudia, buenas tardes. ¿Cómo va tu día? ¿Cómo te sientes?».
 * No name: «Hola, ¿cómo estás? ¿Cómo llevas la regla?».
 * `seed` should be the local date so the wording rotates day to day.
 */
export function companionOpener(opts: {
  name?: string | null;
  hour: number;
  lang?: Lang;
  situation?: Situation;
  seed: string;
}): Opener {
  const lang = opts.lang ?? "es";
  const sit = opts.situation ?? "none";
  const moment = momentForHour(opts.hour);
  const name = companionName(opts.name);
  const feel = pickFrom(FEELING_QUESTIONS[lang][sit], `${opts.seed}:f:${sit}`);
  if (!name) {
    const base = NO_NAME_OPENER[lang];
    const bank = FEELING_QUESTIONS[lang][sit].filter((q) => !/cómo te sientes\?$|how do you feel\?$/i.test(q));
    const q = pickFrom(bank.length ? bank : [feel], `${opts.seed}:f:${sit}`);
    return { title: lang === "es" ? "Hola" : "Hi", greeting: base, question: q, line: `${base} ${q}` };
  }
  const greeting = `${name}, ${GREETING[lang][moment]}.`;
  const momentQ = pickFrom(MOMENT_QUESTIONS[lang][moment], `${opts.seed}:m:${moment}`);
  // Never «hoy … hoy» / «today … today» twice in a row.
  const feelQ = /\b(hoy|today)\?$/.test(momentQ) ? feel.replace(/ (hoy|today)\?$/, "?") : feel;
  const question = `${momentQ} ${feelQ}`;
  return { title: `${name}, ${GREETING[lang][moment]}`, greeting, question, line: `${greeting} ${question}` };
}

// ---------------------------------------------------------------------------
// Cycle lines
// ---------------------------------------------------------------------------

/** Longer cycle lines for the Hoy note ({n} = cycle day, {d} = days to period). */
export const NOTE_CYCLE_LINES: Record<Lang, Record<BodyKey, string[]>> = {
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

/**
 * Short, lock-screen-discreet cycle lines for push (≤ 90 chars). No mention of
 * sex, pain or emergency contraception — a notification can be read by anyone
 * holding the phone.
 */
export const PUSH_CYCLE_LINES: Record<Lang, Record<BodyKey | "peak", string[]>> = {
  es: {
    menstrual: [
      "Día {n} de tu regla: hoy vamos despacio.",
      "Día {n}: calor en el vientre y agua cuentan como autocuidado.",
      "Día {n} de tu regla: si el cuerpo pide descanso, dáselo sin culpa.",
    ],
    follicular: [
      "Día {n}: tu energía suele ir subiendo estos días.",
      "Día {n}: buen momento para moverte, crear o empezar algo.",
      "Día {n}: después de la regla, el cuerpo va ganando ganas.",
    ],
    fertile: [
      "Día {n}: días fértiles (estimación). El calendario no es anticonceptivo.",
      "Día {n}: ventana fértil estimada, más chance de embarazo. Si no lo buscas, cuídate más.",
    ],
    peak: [
      "Día {n}: ovulación estimada, la chance más alta del mes. No es anticonceptivo.",
      "Hoy sería tu ovulación (estimación). Si no buscas embarazo, cuídate más.",
    ],
    luteal: [
      "Día {n}: tu cuerpo va bajando el ritmo; date permiso de hacer menos.",
      "Día {n}: si notas antojos o hinchazón, es muy de esta fase.",
      "Día {n}: dormir bien y comer a tus horas ayuda mucho ahora.",
    ],
    prePeriod: [
      "Tu regla llegaría en unos {d} días. Ten a mano lo que necesitas.",
      "Faltan unos {d} días para la regla. Sé amable contigo.",
    ],
    none: ["Estoy para ti.", "Cuéntame en un toque cómo vas.", "Aquí estoy si quieres contarme algo."],
  },
  en: {
    menstrual: [
      "Period day {n}: let's go slow today.",
      "Day {n}: warmth and water count as self-care.",
      "Period day {n}: if your body asks for rest, give it without guilt.",
    ],
    follicular: [
      "Day {n}: your energy tends to rise these days.",
      "Day {n}: a good moment to move, create or start something.",
      "Day {n}: after your period, your body gains momentum.",
    ],
    fertile: [
      "Day {n}: fertile days (estimate). The calendar is not contraception.",
      "Day {n}: estimated fertile window, higher chance of pregnancy. If you're not trying, protect yourself.",
    ],
    peak: [
      "Day {n}: estimated ovulation, the highest chance of the month. Not contraception.",
      "Today would be ovulation (estimate). If you're not trying, protect yourself more.",
    ],
    luteal: [
      "Day {n}: your body is slowing down; it's fine to do less.",
      "Day {n}: cravings or bloating are very typical of this phase.",
      "Day {n}: good sleep and regular meals help a lot now.",
    ],
    prePeriod: [
      "Your period would arrive in about {d} days. Keep what you need nearby.",
      "About {d} days to your period. Be kind to yourself.",
    ],
    none: ["I'm here for you.", "Tell me how you're doing in one tap.", "I'm here if you want to talk."],
  },
};

export const FERTILE_LINE: Record<Lang, { fertile: string; peak: string; ttc: string }> = {
  es: {
    fertile: "Estás en días fértiles (estimación): más chance de embarazo. Si no lo buscas, cuídate más; el calendario no es anticonceptivo.",
    peak: "Hoy es tu ovulación estimada, la chance más alta del mes. Si no buscas embarazo, cuídate más.",
    ttc: "Si buscas embarazo, estos son tus días con más chance. Sin presión: es una estimación.",
  },
  en: {
    fertile: "You're in your fertile days (estimate): higher chance of pregnancy. If you're not trying, protect yourself more; the calendar is not contraception.",
    peak: "Today is your estimated ovulation, the highest chance of the month. If you're not trying, protect yourself more.",
    ttc: "If you're trying, these are your highest-chance days. No pressure: it's an estimate.",
  },
};

export const NOTE_EXTRA: Record<Lang, Record<"riskySex" | "pain" | "lowMood" | "desireUp" | "desireDown" | "goodMood", string>> = {
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

/** «unos 1 días» never: dedicated lines when the period is due tomorrow / today. */
export const PERIOD_DUE_LINES: Record<Lang, { tomorrow: string; today: string }> = {
  es: {
    tomorrow: "Tu regla podría llegar mañana. Deja lista una toalla o tu copa.",
    today: "Tu regla podría llegar hoy. Ten a mano lo que necesitas.",
  },
  en: {
    tomorrow: "Your period could arrive tomorrow. Keep a pad or your cup ready.",
    today: "Your period could arrive today. Keep what you need nearby.",
  },
};

export function periodDueLine(lang: Lang, daysToPeriod: number | null) {
  if (daysToPeriod === 1) return PERIOD_DUE_LINES[lang].tomorrow;
  if (daysToPeriod === 0) return PERIOD_DUE_LINES[lang].today;
  return null;
}

export function fillCycle(s: string, cycleDay: number | null, daysToPeriod: number | null) {
  return s.replace("{n}", String(cycleDay ?? "")).replace("{d}", String(daysToPeriod ?? ""));
}

// ---------------------------------------------------------------------------
// Mood buttons (Bien / Regular / Mal / Quiero hablar)
// ---------------------------------------------------------------------------

export type MoodReply = "good" | "meh" | "bad";

/** `{,nombre}` → «, Claudia» (or nothing); `{Nombre, }` → «Claudia, » (or nothing). */
export function withName(template: string, name: string | null | undefined) {
  const n = companionName(name);
  return template
    .replace("{,nombre}", n ? `, ${n}` : "")
    .replace("{Nombre, }", n ? `${n}, ` : "")
    .replace(/^\s+/, "")
    .replace(/^./, (c) => c.toLocaleUpperCase("es"));
}

export const MOOD_REPLIES: Record<Lang, Record<MoodReply, Partial<Record<Situation, string[]>> & { any: string[] }>> = {
  es: {
    good: {
      any: [
        "Qué alegría leerte así{,nombre}. Lo anoto para que veamos tu patrón.",
        "Me encanta{,nombre}. Guardado: días así también cuentan.",
        "Bien por ti{,nombre}. Lo dejo anotado en tu día.",
      ],
      periodPain: ["Qué bueno que, aun con regla, vas bien{,nombre}. Lo anoto."],
    },
    meh: {
      any: [
        "Regular también vale{,nombre}. Lo anoto; si quieres, hablamos.",
        "Gracias por contarme{,nombre}. Vamos con calma hoy.",
        "Anotado{,nombre}. A veces el día solo pide ir paso a paso.",
      ],
      prePeriod: ["Anotado{,nombre}. Antes de la regla es común sentirse así; no es tu culpa."],
      luteal: ["Anotado{,nombre}. En esta fase es común sentirse más apagada; ve suave."],
    },
    bad: {
      any: [
        "Lo siento{,nombre}. Lo anoto; no tienes que poder con todo hoy. Aquí estoy.",
        "Gracias por decírmelo{,nombre}. Estoy para ti si quieres contarme más.",
        "Anotado{,nombre}. Sé amable contigo hoy; puedes escribirme cuando quieras.",
      ],
      periodPain: ["Lo siento{,nombre}, la regla con dolor cansa. Calor, agua y descanso; aquí estoy."],
      prePeriod: ["Lo siento{,nombre}. Antes de la regla todo pesa más; no es tu culpa. Aquí estoy."],
    },
  },
  en: {
    good: {
      any: [
        "So glad to hear that{,nombre}. I'll log it so we can see your pattern.",
        "Love that{,nombre}. Saved: days like this count too.",
        "Good for you{,nombre}. I've noted it on your day.",
      ],
      periodPain: ["Glad you're doing well even on your period{,nombre}. Noted."],
    },
    meh: {
      any: [
        "So-so counts too{,nombre}. Noted; we can talk if you want.",
        "Thanks for telling me{,nombre}. Let's take today slowly.",
        "Noted{,nombre}. Some days just ask to go step by step.",
      ],
      prePeriod: ["Noted{,nombre}. Feeling like this before your period is common; it's not your fault."],
      luteal: ["Noted{,nombre}. Feeling flatter in this phase is common; go gently."],
    },
    bad: {
      any: [
        "I'm sorry{,nombre}. Noted; you don't have to carry everything today. I'm here.",
        "Thanks for telling me{,nombre}. I'm here if you want to say more.",
        "Noted{,nombre}. Be kind to yourself today; write to me anytime.",
      ],
      periodPain: ["I'm sorry{,nombre}, a painful period is exhausting. Warmth, water, rest; I'm here."],
      prePeriod: ["I'm sorry{,nombre}. Everything weighs more before your period; it's not your fault. I'm here."],
    },
  },
};

export function moodReplyText(mood: MoodReply, sit: Situation, lang: Lang, seed: string, name?: string | null) {
  const bank = MOOD_REPLIES[lang][mood];
  const list = bank[sit] ?? bank.any;
  return withName(list[seedIndex(`${seed}:${mood}`, list.length)]!, name);
}

/** «Quiero hablar»: Savia's first line in the chat. */
export const TALK_OPENERS: Record<Lang, string[]> = {
  es: [
    "{Nombre, }aquí estoy. Cuéntame lo que quieras, sin prisa.",
    "{Nombre, }te leo. ¿Qué tienes en mente?",
    "Claro que sí{,nombre}. Estoy para ti: ¿qué pasó?",
  ],
  en: [
    "{Nombre, }I'm here. Tell me whatever you want, no rush.",
    "{Nombre, }I'm listening. What's on your mind?",
    "Of course{,nombre}. I'm here for you: what happened?",
  ],
};

export function talkOpener(lang: Lang, seed: string, name?: string | null) {
  return withName(pickFrom(TALK_OPENERS[lang], `${seed}:talk`), name);
}

// ---------------------------------------------------------------------------
// Push message (the same voice, short)
// ---------------------------------------------------------------------------

export type PushCtx = {
  situation: Situation;
  bodyKey: BodyKey;
  mark: "period" | "fertile" | "peak" | "quiet" | null;
  cycleDay: number | null;
  daysToPeriod: number | null;
  intention: "track" | "avoid" | "ttc";
};

export type PushMessage = { title: string; body: string; text: string };

/**
 * Notification copy: title «Claudia, buenas tardes», body «¿Cómo va tu día?
 * ¿Cómo te sientes? Día 3 de tu regla: hoy vamos despacio.»
 */
export function pushMessage(c: PushCtx, opts: { name?: string | null; hour: number; lang?: Lang; seed: string }): PushMessage {
  const lang = opts.lang ?? "es";
  const o = companionOpener({ name: opts.name, hour: opts.hour, lang, situation: c.situation, seed: opts.seed });
  let key: BodyKey | "peak" = c.bodyKey;
  if (c.mark === "peak") key = "peak";
  if (key === "prePeriod" && c.daysToPeriod == null) key = "luteal";
  let bank = PUSH_CYCLE_LINES[lang][key];
  if (c.cycleDay == null && key !== "prePeriod") bank = PUSH_CYCLE_LINES[lang].none;
  let cycle = fillCycle(pickFrom(bank, `${opts.seed}:p:${key}`), c.cycleDay, c.daysToPeriod);
  if (key === "prePeriod") cycle = periodDueLine(lang, c.daysToPeriod) ?? cycle;
  if ((key === "fertile" || key === "peak") && c.intention === "ttc") {
    cycle = lang === "es" ? "Días con más chance (estimación). Sin presión." : "Higher-chance days (estimate). No pressure.";
  }
  const anonymous = !companionName(opts.name);
  const lead = anonymous ? (lang === "es" ? "¿Cómo estás?" : "How are you?") : "";
  const body = [lead, o.question, cycle].filter(Boolean).join(" ");
  return { title: o.title, body, text: `${o.line} ${cycle}` };
}
