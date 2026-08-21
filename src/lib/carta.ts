import { pick, type Copy } from "@/lib/savia-content";
import type { Phase, Stage } from "@/lib/types";

const t = (es: string, en: string): Copy => ({ es, en });

type Letter = { title: Copy; body: Copy; ask: Copy };

const menstrual: Letter[] = [
  {
    title: t("Hoy el cuerpo pide cueva", "Today the body asks to hide"),
    body: t(
      "La regla no es flojera. Es inflamación y un descenso hormonal. Come caliente, hierro con limón, bolsa en el vientre. Si empapas una toalla en una hora, eso no se espera: ve a urgencias.",
      "A period is not laziness. It’s inflammation and a hormone drop. Eat warm food, iron with lemon, a bottle on the belly. If you soak a pad in an hour, don’t wait: go in.",
    ),
    ask: t("¿El dolor de hoy es el de siempre, o es otro?", "Is today’s pain the usual one, or another?"),
  },
  {
    title: t("Hierro, no un récord", "Iron, not a personal best"),
    body: t(
      "Cada sangrado gasta sangre. Sin hierro el cerebro niebla y el pelo se queja. Lentejas con limón. Un huevo. Camina suave. El HIIT puede esperar.",
      "Each bleed spends blood. Without iron the brain fogs and hair complains. Lentils with lemon. An egg. Walk gently. HIIT can wait.",
    ),
    ask: t("¿Quieres que te arme un plato para hoy?", "Want me to build you a plate for today?"),
  },
];

const follicular: Letter[] = [
  {
    title: t("Estás en primavera", "You’re in spring"),
    body: t(
      "El estrógeno sube despacio. Vuelve la claridad, la piel, las ganas de empezar. Si el ciclo se alarga, casi siempre es aquí — no en la lútea. Aprovecha la energía sin gastar de más.",
      "Estrogen rises slowly. Clarity, skin, the itch to start. If the cycle stretches, it’s almost always here — not in the luteal. Use the energy without overspending.",
    ),
    ask: t("¿Hoy te sientes más tú, o todavía no?", "Do you feel more like yourself today, or not yet?"),
  },
  {
    title: t("Buena ventana para lo que pide presencia", "A good window for what needs you present"),
    body: t(
      "Ensalada, fermentado, huevo, un poco de carga si el cuerpo dice sí. El moco se aclara. Anótalo: mañana Savia lo usa para acertar, no para juzgarte.",
      "Salad, ferments, egg, a little load if the body says yes. Mucus clears. Log it: tomorrow Savia uses it to get you right, not to judge you.",
    ),
    ask: t("¿Quieres anotar cómo está el moco hoy?", "Want to log cervical mucus today?"),
  },
];

const ovulatory: Letter[] = [
  {
    title: t("Aquí está el centro", "This is the center"),
    body: t(
      "Pico de estrógeno, sale el óvulo, a veces un pinchazo a un lado. Si no buscas embarazo, estos días piden más cuidado. Si lo buscas, aquí está la diana. Ningún calendario es anticonceptivo.",
      "Estrogen peaks, the egg releases, sometimes a one-sided twinge. If you’re not trying, these days ask for more care. If you are, this is the bullseye. No calendar is birth control.",
    ),
    ask: t("¿Quieres que te diga qué significa tu moco ahora?", "Want me to tell you what your mucus means now?"),
  },
  {
    title: t("El cuerpo de fiesta, y el bajón que viene", "Party clothes, and the dip that follows"),
    body: t(
      "Libido, piel, moco elástico. Unos días después cae el estrógeno y puede haber un hueco en el ánimo. No es que “se te dañó la semana”: es química. Guárdalo para reconocerlo la próxima.",
      "Libido, skin, stretchy mucus. A few days later estrogen dips and mood can hollow. It’s not that the week “broke”: it’s chemistry. Keep it to recognize it next time.",
    ),
    ask: t("¿El deseo de hoy es alto, bajo, o ni idea?", "Is desire high, low, or no idea today?"),
  },
];

const luteal: Letter[] = [
  {
    title: t("Los días previos no son un defecto", "The days before are not a defect"),
    body: t(
      "La progesterona pide cueva, hambre, sueño, paciencia corta. Magnesio (cacao, semilla de calabaza). Corta cafeína si te pone ansiosa. Si el ánimo se cae más de lo que conoces — o hay ideas de hacerte daño — eso no se aguanta sola: busca ayuda ahora.",
      "Progesterone asks to hide, hunger, sleep, a short fuse. Magnesium (cacao, pumpkin seed). Cut caffeine if it makes you anxious. If mood falls further than you know — or there are thoughts of harming yourself — don’t hold it alone: get help now.",
    ),
    ask: t("¿El ánimo de hoy es el de siempre en estos días?", "Is today’s mood the usual one for these days?"),
  },
  {
    title: t("PMS es un cerebro, no un carácter", "PMS is a brain, not a character"),
    body: t(
      "Menos serotonina, más sensibilidad. Duerme como si fuera trabajo. Carbohidrato complejo. Si hinchazón y pecho y rabia llegan juntos cada mes, anótalo: el informe de control se lo puedes llevar a la consulta.",
      "Less serotonin, more sensitivity. Treat sleep like a job. Complex carbs. If bloat and breasts and rage arrive together each month, log it: you can take the report to a visit.",
    ),
    ask: t("¿Quieres que te recuerde qué te sentó bien el mes pasado?", "Want me to remember what helped last month?"),
  },
];

const peri: Letter[] = [
  {
    title: t("El ciclo ya no mide igual. Tú sí cuentas.", "The cycle no longer measures the same. You still count."),
    body: t(
      "Reglas que se adelantan, se atrasan, se van y vuelven. Sofoco, niebla, sueño roto. No es “ya estás vieja”: es peri. Anota lo raro. La consulta necesita fechas, no un “me siento mal”.",
      "Periods that come early, late, leave and return. Flush, fog, broken sleep. You’re not “old”: it’s peri. Log the odd. The visit needs dates, not “I feel bad.”",
    ),
    ask: t("¿Este mes se pareció al anterior, o no?", "Did this month look like the last, or not?"),
  },
];

const meno: Letter[] = [
  {
    title: t("Después de la regla, el cuerpo sigue hablando", "After periods, the body still talks"),
    body: t(
      "Sofoco, sequedad, hueso, sueño. Fuerza (aunque sea silla y bolsa de arroz). Calcio no basta solo. Si el sofoco no te deja vivir, hay tratamiento: no tienes que “aguantar como tu mamá”.",
      "Flush, dryness, bone, sleep. Strength (even a chair and a rice bag). Calcium alone isn’t enough. If flushes steal your life, there is treatment: you don’t have to “tough it out like your mum.”",
    ),
    ask: t("¿El sofoco de esta semana te deja dormir?", "Do this week’s flushes let you sleep?"),
  },
];

const pregnancy: Letter[] = [
  {
    title: t("Esta semana, con calma", "This week, slowly"),
    body: t(
      "Náusea, pecho, ganas de orinar, miedo. Café bajo. Té: jengibre suave, no litros de hierbas “milagro”. Sangrado, dolor fuerte de un lado, desmayo: urgencias. Savia acompaña; no sustituye a tu médica.",
      "Nausea, breasts, peeing, fear. Coffee low. Tea: mild ginger, not litres of miracle herbs. Bleeding, strong one-sided pain, fainting: emergency. Savia walks with you; she doesn’t replace your clinician.",
    ),
    ask: t("¿Qué es lo que más te preocupa de esta semana?", "What’s worrying you most this week?"),
  },
];

const postpartum: Letter[] = [
  {
    title: t("Reparar no es rendirse", "Repair is not giving up"),
    body: t(
      "Loquios, caída hormonal, sueño roto, suelo pélvico. La regla puede tardar meses si das pecho — o volver a las seis semanas. Ninguna de las dos es un examen que apruebas. Si el ánimo se pone negro y no sale, pide ayuda ya.",
      "Lochia, hormone drop, broken sleep, pelvic floor. The period may wait months if you nurse — or return at six weeks. Neither is a test you pass. If mood goes black and doesn’t lift, get help now.",
    ),
    ask: t("¿Hoy aguantas, o necesitas que alguien te cargue un rato?", "Are you holding today, or do you need someone to carry you a while?"),
  },
];

function pool(stage: Stage, phase: Phase): Letter[] {
  if (stage === "peri") return peri;
  if (stage === "meno") return meno;
  if (stage === "pregnancy") return pregnancy;
  if (stage === "postpartum") return postpartum;
  if (phase === "menstrual") return menstrual;
  if (phase === "follicular") return follicular;
  if (phase === "ovulatory") return ovulatory;
  return luteal;
}

function hash(s: string) {
  let n = 0;
  for (let i = 0; i < s.length; i++) n = (n * 33 + s.charCodeAt(i)) >>> 0;
  return n;
}

export function cartaDeHoy(day: string, stage: Stage, phase: Phase, lang: "es" | "en") {
  const letters = pool(stage, phase);
  const letter = letters[hash(day + stage + phase) % letters.length]!;
  return {
    title: pick(letter.title, lang),
    body: pick(letter.body, lang),
    ask: pick(letter.ask, lang),
  };
}
