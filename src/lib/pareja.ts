import { pick, type Copy } from "@/lib/savia-content";
import type { Phase, Stage } from "@/lib/types";

const t = (es: string, en: string): Copy => ({ es, en });

type Card = { title: Copy; do: Copy; say: Copy; dont: Copy };

const byPhase: Record<Exclude<Phase, "none">, Card> = {
  menstrual: {
    title: t("Esta semana duele", "This week hurts"),
    do: t("Calor, comida hecha, no planes heroicos. Pregunta qué necesita, no asumas que “quiere estar sola”.", "Heat, cooked food, no heroic plans. Ask what she needs; don’t assume she “wants to be alone.”"),
    say: t("“¿Quieres que te deje el cuarto o que me quede cerca?”", "“Do you want the room, or me nearby?”"),
    dont: t("No bromas de “está de malas”. El cólico no es un carácter.", "No jokes about “being moody”. Cramps aren’t a personality."),
  },
  follicular: {
    title: t("Vuelve la energía", "Energy comes back"),
    do: t("Buen momento para planes, caminar, hablar de lo que importa. Ella suele estar más presente.", "Good window for plans, walking, talking about what matters. She’s often more present."),
    say: t("“Si quieres, esta semana la elegimos juntas.”", "“If you want, we pick this week together.”"),
    dont: t("No llenes el calendario sin preguntar: la energía no es una obligación.", "Don’t fill the calendar without asking: energy isn’t an order."),
  },
  ovulatory: {
    title: t("Días fértiles", "Fertile days"),
    do: t("Si buscan bebé, aquí está la ventana. Si no, cuidarse es de los dos. Deseo alto no es un sí automático.", "If you’re trying, this is the window. If not, care is both of yours. High desire isn’t an automatic yes."),
    say: t("“¿Qué quieres tú estos días?”", "“What do you want these days?”"),
    dont: t("No presiones. Ningún calendario es anticonceptivo ni un deber.", "Don’t push. No calendar is birth control or a duty."),
  },
  luteal: {
    title: t("Antes del periodo", "Before the period"),
    do: t("Paciencia, sueño, menos debates a las once de la noche. Un plato caliente cuenta más que un discurso.", "Patience, sleep, fewer debates at 11 p.m. A warm plate counts more than a speech."),
    say: t("“Dime si quieres silencio o compañía. Las dos valen.”", "“Tell me if you want quiet or company. Both count.”"),
    dont: t("No le expliques cómo “debería” sentirse. No minimices el ánimo.", "Don’t explain how she “should” feel. Don’t shrink the mood."),
  },
};

const peri: Card = {
  title: t("El cuerpo ya no mide igual", "The body no longer measures the same"),
  do: t("Sofoco, niebla, sueño roto: no es “drama”. Ventila, capas de ropa, cita médica si ella quiere compañía.", "Flush, fog, broken sleep: not “drama”. Air, layers, go to the visit if she wants company."),
  say: t("“¿Qué te alivia hoy? Lo hago.”", "“What would ease today? I’ll do it.”"),
  dont: t("No digas “ya estás en esa edad”. Duele y no ayuda.", "Don’t say “you’re that age now”. It hurts and it doesn’t help."),
};

const pregnancy: Card = {
  title: t("Alguien más está en el cuerpo", "Someone else is in the body"),
  do: t("Náusea, miedo, cansancio. Café bajo, comida simple, no minimices el vómito. Sangrado o dolor fuerte: urgencias, contigo.", "Nausea, fear, fatigue. Coffee low, simple food, don’t shrink the vomiting. Bleeding or strong pain: emergency, with you."),
  say: t("“Hoy yo cargo lo práctico. Tú dime el cuerpo.”", "“I’ll take the practical today. You tell me the body.”"),
  dont: t("No compares con “otras embarazadas que sí podían”.", "Don’t compare with “other pregnant people who could.”"),
};

const postpartum: Card = {
  title: t("Reparar no es un examen", "Repair is not a test"),
  do: t("Sueño a ratos, loquios, ánimo. Carga el bebé un rato. Si el ánimo se pone negro, ayuda profesional — no “ánimo, mamá”.", "Sleep in snatches, lochia, mood. Hold the baby a while. If mood goes black, professional help — not “cheer up, mum.”"),
  say: t("“¿Una hora tuya, ahora?”", "“An hour that’s yours, now?”"),
  dont: t("No lleves visitas sin preguntar. No midas su pecho ni su peso.", "Don’t bring visitors unasked. Don’t measure her chest or her weight."),
};

export function parejaCard(stage: Stage, phase: Phase, lang: "es" | "en") {
  const raw =
    stage === "peri" || stage === "meno"
      ? peri
      : stage === "pregnancy"
        ? pregnancy
        : stage === "postpartum"
          ? postpartum
          : phase === "none"
            ? byPhase.luteal
            : byPhase[phase];
  return {
    title: pick(raw.title, lang),
    do: pick(raw.do, lang),
    say: pick(raw.say, lang),
    dont: pick(raw.dont, lang),
  };
}
