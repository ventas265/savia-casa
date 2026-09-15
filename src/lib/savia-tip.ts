import type { Flow, Intention, Phase, SexKind } from "@/lib/types";

export type TipResult = {
  title: string;
  conclusion: string;
  /** 1 primary + optional secondary (max 2). */
  recommendations: string[];
};

type TipInput = {
  phase: Phase;
  flow: Flow;
  sexKind: SexKind;
  symptoms: string[];
  lang: "es" | "en";
  mood?: number | null;
  energy?: number | null;
  /** track | avoid | ttc — unset/track → default wellbeing; ttc → trying branch. */
  intention?: Intention | null;
};

const pick = (lang: "es" | "en", es: string, en: string) => (lang === "en" ? en : es);

function has(symptoms: string[], id: string) {
  return symptoms.includes(id);
}

function anyOf(symptoms: string[], ids: string[]) {
  return ids.some((id) => symptoms.includes(id));
}

/** Structured wrap-up after a successful log save (rules/templates, no xAI). */
export function tipAfterSave(input: TipInput): TipResult {
  const {
    phase,
    flow,
    sexKind,
    symptoms,
    lang,
    mood = null,
    energy = null,
    intention = null,
  } = input;

  const onPeriod =
    flow === "light" || flow === "medium" || flow === "heavy" || flow === "spotting" || phase === "menstrual";
  const risky = sexKind === "unprotected" || sexKind === "withdrawal";
  const hasSex = sexKind !== "none";
  const ttc = intention === "ttc";
  // Pregnancy / risk copy only with a clear signal (risky sex or TTC).
  const pregnancySignal = risky || ttc;
  const fertileish = phase === "ovulatory" || phase === "follicular";
  const lowMood = (mood !== null && mood <= 2) || anyOf(symptoms, ["low_mood", "anxiety", "irritable", "brain_fog"]);
  const lowEnergy = (energy !== null && energy <= 2) || has(symptoms, "fatigue");
  const cramps = has(symptoms, "cramps") || has(symptoms, "backache");
  const sleepish = has(symptoms, "insomnia") || has(symptoms, "night_sweat") || has(symptoms, "hot_flash");
  const hasBody = symptoms.length > 0 || onPeriod || lowMood || lowEnergy;

  const title = pick(lang, "Tu cierre", "Your wrap-up");

  // ——— TTC branch (intention = try only) ———
  if (ttc) {
    const conclusion = buildTtcConclusion({ lang, phase, onPeriod, hasBody, lowMood, fertileish, hasSex });
    const recommendations = buildTtcRecs({ lang, phase, fertileish, cramps, lowEnergy });
    return { title, conclusion, recommendations: recommendations.slice(0, 2) };
  }

  // ——— Pregnancy-risk signal (unprotected / withdrawal) ———
  if (pregnancySignal && risky) {
    const conclusion = buildRiskConclusion({ lang, phase, fertileish, onPeriod, lowMood, hasBody, sexKind });
    const recommendations = buildRiskRecs({ lang, fertileish, cramps, lowEnergy, sleepish });
    return { title, conclusion, recommendations: recommendations.slice(0, 2) };
  }

  // ——— Default: cycle + wellbeing ———
  const conclusion = buildWellbeingConclusion({
    lang,
    phase,
    onPeriod,
    flow,
    hasBody,
    lowMood,
    lowEnergy,
    cramps,
    hasSex,
    sexKind,
  });
  const recommendations = buildWellbeingRecs({
    lang,
    phase,
    onPeriod,
    cramps,
    lowEnergy,
    lowMood,
    sleepish,
    symptoms,
  });
  return { title, conclusion, recommendations: recommendations.slice(0, 2) };
}

function buildTtcConclusion(p: {
  lang: "es" | "en";
  phase: Phase;
  onPeriod: boolean;
  hasBody: boolean;
  lowMood: boolean;
  fertileish: boolean;
  hasSex: boolean;
}): string {
  const { lang, phase, onPeriod, hasBody, lowMood, fertileish, hasSex } = p;
  if (onPeriod) {
    return pick(
      lang,
      "Regla anotada. En búsqueda, estos días el cuerpo se reinicia: está bien ir más despacio. Lo que sigue es timing estimado cuando pase el sangrado — no magia.",
      "Period logged. While trying, these days the body resets — slowing down is fine. What follows is estimated timing after bleeding, not magic.",
    );
  }
  if (fertileish) {
    const base = pick(
      lang,
      "Ventana fértil estimada según tu ciclo. Si estás buscando, relaciones cada uno o dos días en esta franja suele bastar — sin obsesionarte con el reloj.",
      "Estimated fertile window from your cycle. If you’re trying, sex every day or two in this stretch is usually enough — no need to watch the clock obsessively.",
    );
    if (lowMood) {
      return (
        base +
        " " +
        pick(lang, "Si el ánimo pesa, eso también cuenta: no tienes que rendir emocionalmente para concebir.", "If mood is heavy, that counts too — you don’t owe emotional performance to conceive.")
      );
    }
    return base;
  }
  if (phase === "luteal") {
    return pick(
      lang,
        hasBody
        ? "Lútea: el cuerpo espera. Síntomas o ganas de cueva no dicen sí o no a un positivo — solo que la progesterona está en escena. Anotar ya es cuidarte."
        : "Lútea: fase de espera. El calendario estima; un test tiene más sentido cerca de cuando suele venir la regla, no ya.",
      hasBody
        ? "Luteal: the body waits. Symptoms or wanting to hide don’t mean pregnant or not — just progesterone on stage. Logging is already care."
        : "Luteal: waiting phase. The calendar estimates; a test makes more sense near when your period usually comes, not yet.",
    );
  }
  if (hasSex) {
    return pick(
      lang,
      "Quedó marcado. En búsqueda, la frecuencia en la ventana estimada importa más que una pose mágica. Tú decides el ritmo.",
      "Logged. While trying, frequency in the estimated window matters more than any magic position. You set the pace.",
    );
  }
  return pick(
    lang,
    "Guardado. En búsqueda, comida con folato, sueño y timing estimado del ciclo pesan más que rituales raros.",
    "Saved. While trying, folate-rich food, sleep, and estimated cycle timing beat odd rituals.",
  );
}

function buildTtcRecs(p: {
  lang: "es" | "en";
  phase: Phase;
  fertileish: boolean;
  cramps: boolean;
  lowEnergy: boolean;
}): string[] {
  const { lang, fertileish, cramps, lowEnergy } = p;
  const out: string[] = [];
  if (fertileish) {
    out.push(
      pick(
        lang,
        "Prioriza encuentros cada 1–2 días en esta ventana estimada; el resto del mes, sin presión de “rendir”.",
        "Aim for sex every 1–2 days in this estimated window; the rest of the month, no pressure to “perform.”",
      ),
    );
  } else {
    out.push(
      pick(
        lang,
        "Ácido fólico (o folato en comida: legumbres, verdura de hoja) es el hábito genérico que más se recomienda al buscar — pregunta en farmacia la dosis que te corresponde.",
        "Folic acid (or food folate: legumes, leafy greens) is the usual habit when trying — ask a pharmacist what dose fits you.",
      ),
    );
  }
  if (cramps) {
    out.push(
      pick(lang, "Cólico: calor local y bajar el ritmo. No demuestra nada sobre ovulación.", "Cramps: local heat and ease up. It doesn’t prove anything about ovulation."),
    );
  } else if (lowEnergy) {
    out.push(
      pick(lang, "Energía baja: comida caliente y dormir antes que “forzar el día fértil”.", "Low energy: warm food and sleep before “forcing” a fertile day."),
    );
  } else if (fertileish) {
    out.push(
      pick(
        lang,
        "Come con hierro y folato (lentejas, huevo, verdura oscura). Sin promesas: solo base.",
        "Eat iron and folate (lentils, eggs, dark greens). No promises — just a base.",
      ),
    );
  } else {
    out.push(
      pick(
        lang,
        "Cuando se acerque tu sangrado habitual, ahí tiene más sentido un test — no cada susto de la lútea.",
        "Near when your period usually comes is a better time for a test — not every luteal scare.",
      ),
    );
  }
  return out;
}

function buildRiskConclusion(p: {
  lang: "es" | "en";
  phase: Phase;
  fertileish: boolean;
  onPeriod: boolean;
  lowMood: boolean;
  hasBody: boolean;
  sexKind: SexKind;
}): string {
  const { lang, fertileish, onPeriod, lowMood, sexKind } = p;
  const kindBit =
    sexKind === "withdrawal"
      ? pick(lang, "coito interrumpido", "withdrawal")
      : pick(lang, "sin protección", "unprotected");

  if (fertileish) {
    const core = pick(
      lang,
      `Anotaste relaciones (${kindBit}) cerca de la ventana fértil estimada. El mes pinta probabilidades — no es anticonceptivo. Si no buscas embarazo, el método (o la anticoncepción de emergencia a tiempo) cuenta más que el color del calendario.`,
      `You logged sex (${kindBit}) near the estimated fertile window. The month paints odds — it isn’t birth control. If you don’t want pregnancy, your method (or timely emergency contraception) matters more than the calendar color.`,
    );
    if (lowMood) {
      return core + " " + pick(lang, "Si estás revuelta, es humano: un paso concreto basta.", "If you feel stirred up, that’s human — one concrete step is enough.");
    }
    return core;
  }
  if (onPeriod) {
    return pick(
      lang,
      `Relaciones en regla (${kindBit}): posible embarazo es menos probable, no imposible. Si te preocupa, farmacia/clínica orientan mejor que el calendario.`,
      `Period sex (${kindBit}): pregnancy is less likely, not impossible. If you’re worried, a pharmacy/clinic beats the calendar.`,
    );
  }
  return pick(
    lang,
    `Quedó marcado (${kindBit}). Sin “días seguros”: si la regla se atrasa, un test cerca de esa fecha suele bastar. Mientras, cuida el cuerpo que anotaste hoy.`,
    `Logged (${kindBit}). No “safe days”: if your period is late, a test near that date is usually enough. Meanwhile, look after the body you logged today.`,
  );
}

function buildRiskRecs(p: {
  lang: "es" | "en";
  fertileish: boolean;
  cramps: boolean;
  lowEnergy: boolean;
  sleepish: boolean;
}): string[] {
  const { lang, fertileish, cramps, lowEnergy, sleepish } = p;
  const out: string[] = [];
  if (fertileish) {
    out.push(
      pick(
        lang,
        "Anticoncepción de emergencia: cuanto antes, mejor (hay ventana de horas/días según el tipo). Pregunta en farmacia o clínica — esto es info general, no indicación.",
        "Emergency contraception: sooner is better (hours/days depend on the type). Ask a pharmacy or clinic — general info, not a prescription.",
      ),
    );
  } else {
    out.push(
      pick(
        lang,
        "Si la regla no llega a su tiempo habitual, un test de embarazo entonces. Antes, respira: un día raro no es veredicto.",
        "If your period misses its usual timing, take a pregnancy test then. Until then, breathe — one odd day isn’t a verdict.",
      ),
    );
  }
  if (cramps) {
    out.push(pick(lang, "Cólico: bolsa de calor y magnesio si te sienta; cero culpa por parar.", "Cramps: heat pack and magnesium if it suits you; no guilt for stopping."));
  } else if (lowEnergy || sleepish) {
    out.push(pick(lang, "Sueño y comida caliente antes que dar vueltas al “qué pasa si”.", "Sleep and warm food before spiraling on “what if.”"));
  } else {
    out.push(
      pick(
        lang,
        "Para la próxima: condón u otro método que tú elijas. El teal del mes no sustituye eso.",
        "Next time: a condom or another method you choose. Teal on the month doesn’t replace that.",
      ),
    );
  }
  return out;
}

function buildWellbeingConclusion(p: {
  lang: "es" | "en";
  phase: Phase;
  onPeriod: boolean;
  flow: Flow;
  hasBody: boolean;
  lowMood: boolean;
  lowEnergy: boolean;
  cramps: boolean;
  hasSex: boolean;
  sexKind: SexKind;
}): string {
  const { lang, phase, onPeriod, hasBody, lowMood, lowEnergy, cramps, hasSex, sexKind } = p;

  if (onPeriod) {
    const feel = lowMood || cramps || lowEnergy
      ? pick(lang, "Con lo que anotaste, tiene sentido que pidas calor y menos exigencia.", "With what you logged, wanting warmth and less demand makes sense.")
      : pick(lang, "Sangrado: el cuerpo está trabajando; no es flojera.", "Bleeding: your body is working — it isn’t laziness.");
    return pick(lang, `Día de regla anotado. ${feel}`, `Period day logged. ${feel}`);
  }

  if (phase === "luteal" && hasBody) {
    return pick(
      lang,
      lowMood
        ? "Lútea con el ánimo o el cuerpo raros: progesterona en escena. Validar eso no es drama — es leer el mes. Anotar ya es un gesto a tu favor."
        : "Lútea con síntomas: el cuerpo se prepara. No tienes que “aguantar” como si nada; comida caliente y sueño cuentan.",
      lowMood
        ? "Luteal with mood or body feeling off: progesterone on stage. Naming that isn’t drama — it’s reading the month. Logging already helps you."
        : "Luteal with symptoms: the body is preparing. You don’t have to tough it out; warm food and sleep count.",
    );
  }

  if (phase === "ovulatory" && !hasBody) {
    return pick(
      lang,
      "Fase ovulatoria estimada. Energía o deseo pueden subir; si no, también es válido. Hoy quedó en tu mes.",
      "Estimated ovulatory phase. Energy or desire may rise; if not, that’s valid too. It’s in your month.",
    );
  }

  if (phase === "follicular" && (lowMood || lowEnergy)) {
    return pick(
      lang,
      "Folicular suele traer más aire, pero hoy anotaste peso. No estás “fallando la fase”: el mes no es un guion.",
      "Follicular often brings more ease, but you logged heaviness today. You’re not “failing the phase” — the month isn’t a script.",
    );
  }

  if (hasSex && sexKind === "protected") {
    return pick(
      lang,
      hasBody
        ? "Marcaste con protección y cómo te sientes. Bien por cuidarte: el mes es guía, no un método."
        : "Quedó con protección. Bien por cuidarte — el calendario orienta; no anticonceptiva.",
      hasBody
        ? "Logged as protected plus how you feel. Good on you for looking after yourself — the month is a guide, not a method."
        : "Logged as protected. Good on you — the calendar orients; it isn’t birth control.",
    );
  }

  if (lowMood) {
    return pick(
      lang,
      "Ánimo bajo anotado. A veces el ciclo empuja; a veces es la vida. No tienes que disculparte por nombrarlo.",
      "Low mood logged. Sometimes the cycle pushes; sometimes it’s life. You don’t owe an apology for naming it.",
    );
  }

  if (hasBody) {
    return pick(
      lang,
      "Ya está en tu mes. Lo que marcaste encaja con escucharte — sin juicio ni lista eterna.",
      "It’s in your month. What you marked fits listening to yourself — no judgment, no endless list.",
    );
  }

  return pick(
    lang,
    "Guardado. Un toque al día basta para que el mes tenga sentido cuando lo necesites.",
    "Saved. One tap a day is enough for the month to make sense when you need it.",
  );
}

function buildWellbeingRecs(p: {
  lang: "es" | "en";
  phase: Phase;
  onPeriod: boolean;
  cramps: boolean;
  lowEnergy: boolean;
  lowMood: boolean;
  sleepish: boolean;
  symptoms: string[];
}): string[] {
  const { lang, phase, onPeriod, cramps, lowEnergy, lowMood, sleepish, symptoms } = p;
  const out: string[] = [];

  if (cramps || (onPeriod && has(symptoms, "backache"))) {
    out.push(
      pick(
        lang,
        "Cólico: calor en bajo vientre, magnesio si te sienta, y bajar el ritmo sin culpa.",
        "Cramps: heat on the lower belly, magnesium if it suits you, and ease the pace without guilt.",
      ),
    );
  } else if (onPeriod) {
    out.push(
      pick(
        lang,
        "Hierro con vitamina C (lentejas + limón, verdura oscura) y comida caliente hoy.",
        "Iron with vitamin C (lentils + lemon, dark greens) and warm food today.",
      ),
    );
  } else if (sleepish) {
    out.push(
      pick(lang, "Sueño roto o calor: dormitorio más fresco y cafeína solo mañana, si puedes.", "Broken sleep or heat: cooler bedroom and caffeine only in the morning if you can."),
    );
  } else if (lowEnergy || phase === "luteal") {
    out.push(
      pick(lang, "Fatiga o lútea: comida caliente, proteína simple, y dormir cuenta más que rendir.", "Fatigue or luteal: warm food, simple protein, and sleep beats pushing through."),
    );
  } else if (lowMood) {
    out.push(
      pick(lang, "Una caminata corta o decirle a alguien una frase basta; no tienes que “arreglarte” hoy.", "A short walk or one honest sentence to someone is enough — you don’t have to “fix yourself” today."),
    );
  } else if (has(symptoms, "bloating") || has(symptoms, "craving")) {
    out.push(
      pick(lang, "Hinchazón o antojo: agua, sal a raya si te hincha, y un gusto sin sermón.", "Bloat or craving: water, go easy on salt if it swells you, and one treat without a sermon."),
    );
  } else if (phase === "ovulatory") {
    out.push(
      pick(lang, "Si hay más ganas o claridad, úsalas en lo tuyo — sin obligación de rendir en todo.", "If desire or clarity is up, use it for what matters to you — no duty to excel at everything."),
    );
  } else {
    out.push(
      pick(lang, "Mantén el hábito suave: anotar ya te da mapa cuando algo se alargue.", "Keep the light habit: logging already gives you a map if something drags on."),
    );
  }

  // Secondary only when we have a clear second need.
  if (out.length < 2) {
    if (lowMood && !cramps) {
      out.push(
        pick(lang, "Si se alarga o asusta, pregúntame o ve a consulta — claridad, no juicio.", "If it drags on or scares you, ask me or see a clinician — clarity, not judgment."),
      );
    } else if (onPeriod && cramps) {
      out.push(
        pick(lang, "Hierro + vitamina C en la comida; no es el día de HIIT heroico.", "Iron + vitamin C with food; not the day for heroic HIIT."),
      );
    } else if (phase === "luteal" && (lowEnergy || sleepish)) {
      out.push(
        pick(lang, "Magnesio de noche si te sienta; prioriza dormir antes que la lista infinita.", "Evening magnesium if it suits you; sleep before the endless to-do list."),
      );
    }
  }

  return out;
}
