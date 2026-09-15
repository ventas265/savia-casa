import type { Flow, Phase, SexKind } from "@/lib/types";

type TipInput = {
  phase: Phase;
  flow: Flow;
  sexKind: SexKind;
  symptoms: string[];
  lang: "es" | "en";
};

/** Short warm tip after a successful log save (rules/templates, no xAI). */
export function tipAfterSave(input: TipInput): string {
  const { phase, flow, sexKind, symptoms, lang } = input;
  const onPeriod = flow === "light" || flow === "medium" || flow === "heavy" || flow === "spotting";
  const hasSex = sexKind !== "none";
  const risky = sexKind === "unprotected" || sexKind === "withdrawal";
  const hasBody = symptoms.length > 0;

  const pick = (es: string, en: string) => (lang === "en" ? en : es);

  if (hasSex && risky && (phase === "ovulatory" || phase === "follicular")) {
    return pick(
      "Anotaste relaciones sin protección cerca de días fértiles. Si no buscas embarazo, el condón (o tu método) cuenta más que el calendario. 💛",
      "You logged unprotected sex near fertile days. If you don’t want pregnancy, your method matters more than the painted month. 💛",
    );
  }
  if (hasSex && sexKind === "protected") {
    return pick(
      "Quedó marcado con protección. Bien por cuidarte: el mes es una guía, no un anticonceptivo.",
      "Logged as protected. Good on you for looking after yourself — the month is a guide, not birth control.",
    );
  }
  if (hasSex && phase === "menstrual") {
    return pick(
      "Relaciones en regla: normal si te sienta bien. Usa protección si la necesitas, y escucha si hay dolor.",
      "Sex on your period is fine if it feels good. Use protection if you need it, and listen if there’s pain.",
    );
  }
  if (onPeriod || phase === "menstrual") {
    return pick(
      "Día de sangrado: calor, hierro con vitamina C, y cero culpa si bajas el ritmo. Tu cuerpo está trabajando.",
      "Bleeding day: warmth, iron with vitamin C, and no guilt if you slow down. Your body is working.",
    );
  }
  if (phase === "luteal" && hasBody) {
    return pick(
      "Lútea con síntomas: magnesio, comida caliente y sueño cuentan más que “aguantar”. Anotar ya es cuidarte.",
      "Luteal with symptoms: magnesium, warm food, and sleep beat “toughing it out.” Logging is already care.",
    );
  }
  if (phase === "ovulatory") {
    return pick(
      "Ventana fértil estimada: si no quieres sorpresas, hoy es día de método. El teal del calendario no es condón.",
      "Estimated fertile window: if you don’t want surprises, today is a method day. Teal on the calendar isn’t a condom.",
    );
  }
  if (hasBody) {
    return pick(
      "Ya quedó en tu mes. Si algo se siente raro o se alarga, pregúntame: estamos para claridad, no para juicio.",
      "It’s in your month. If something feels off or drags on, ask me — clarity, not judgment.",
    );
  }
  return pick(
    "Guardado. Un toque al día basta para que el mes tenga sentido cuando lo necesites.",
    "Saved. One tap a day is enough for the month to make sense when you need it.",
  );
}
