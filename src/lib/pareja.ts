import { pick, type Copy } from "@/lib/savia-content";
import type { Phase, Stage } from "@/lib/types";

const t = (es: string, en: string): Copy => ({ es, en });

type Card = { title: Copy; need: Copy; ask: Copy; skip: Copy };

const byPhase: Record<Exclude<Phase, "none">, Card> = {
  menstrual: {
    title: t("Hoy el cuerpo pide calma", "Today the body wants quiet"),
    need: t("Calor, comida hecha, poco plan. No es drama: es el útero trabajando.", "Heat, cooked food, few plans. Not drama: the uterus is working."),
    ask: t("Si quieres compañía: “Quédate cerca, sin hablar tanto.” Si quieres el cuarto: “Hoy necesito el espacio.” Las dos valen.", "If you want company: “Stay close, not much talk.” If you want the room: “I need the space today.” Both count."),
    skip: t("No tienes que explicar el cólico. No es un examen de pareja.", "You don’t have to explain the cramp. It’s not a couple’s test."),
  },
  follicular: {
    title: t("Vuelve un poco de aire", "A little air comes back"),
    need: t("Ganas de salir o de hablar. Tú eliges el ritmo, no el calendario.", "Wanting to go out or talk. You set the pace, not the calendar."),
    ask: t("Si te nace: “Esta semana sí quiero planes, los elijo yo.”", "If it comes: “This week I do want plans — I pick them.”"),
    skip: t("Energía no es obligación de estar disponible para todos.", "Energy isn’t a duty to be available to everyone."),
  },
  ovulatory: {
    title: t("Días fértiles", "Fertile days"),
    need: t("Puede haber más deseo o más piel. Cuidarse es de los dos si no buscan bebé. Deseo no es un sí.", "There may be more desire. Care is both of yours if you’re not trying. Desire isn’t a yes."),
    ask: t("Lo tuyo, en voz tuya: “Esto quiero” o “Esto no.” Sin discurso.", "Yours, in your voice: “This I want” or “This I don’t.” No speech."),
    skip: t("El calendario no es anticonceptivo ni una cita obligatoria.", "The calendar is not contraception and not a mandatory date."),
  },
  luteal: {
    title: t("Antes del periodo", "Before the period"),
    need: t("Sueño, menos pelea a deshora, un plato caliente. El ánimo puede bajar: no es “máscaras”.", "Sleep, fewer late fights, a warm plate. Mood can drop: that’s not “an act.”"),
    ask: t("Si te cabe: “Hoy no discutamos esto. Mañana sí.”", "If it fits: “Let’s not fight this tonight. Tomorrow yes.”"),
    skip: t("No tienes que estar simpática para que el día cuente.", "You don’t have to be sweet for the day to count."),
  },
};

const peri: Card = {
  title: t("El cuerpo ya no mide igual", "The body no longer measures the same"),
  need: t("Sofoco, niebla, sueño a ratos. No es “ya estás vieja”. Es hormona y calor.", "Flushes, fog, broken sleep. Not “you’re old now”. Hormone and heat."),
  ask: t("Si quieres ayuda: “Abre la ventana” o “Ven conmigo a la cita.” Lo concreto sirve más que consuelo.", "If you want help: “Open the window” or “Come to the visit with me.” Concrete beats pep talks."),
  skip: t("No tragues “es la edad”. No es un cumplido ni un diagnóstico de pareja.", "Don’t swallow “it’s your age”. Not a compliment and not a couple’s diagnosis."),
};

const pregnancy: Card = {
  title: t("Hay alguien más en el cuerpo", "Someone else is in the body"),
  need: t("Náusea, miedo, cansancio. Sangrado o dolor fuerte: urgencias.", "Nausea, fear, fatigue. Bleeding or strong pain: emergency."),
  ask: t("“Hoy el práctico lo cargas tú. Yo digo cómo está el cuerpo.”", "“You take the practical today. I say how the body is.”"),
  skip: t("No compares tu embarazo con el de otra. No es un concurso.", "Don’t compare your pregnancy with someone else’s. Not a contest."),
};

const postpartum: Card = {
  title: t("Reparar no es un examen", "Repair is not a test"),
  need: t("Sueño a ratos, loquios, ánimo. Una hora tuya cuenta. Si el ánimo se pone negro, ayuda profesional.", "Sleep in snatches, lochia, mood. An hour that’s yours counts. If mood goes black, professional help."),
  ask: t("“Quédate con el bebé una hora. Ahora.”", "“Stay with the baby for an hour. Now.”"),
  skip: t("Visitas sin preguntar, comentarios del pecho o del peso: fuera.", "Unasked visitors, comments on chest or weight: out."),
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
    need: pick(raw.need, lang),
    ask: pick(raw.ask, lang),
    skip: pick(raw.skip, lang),
  };
}
