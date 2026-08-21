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
  {
    title: t("Agua y calor, nada heroico", "Water and warmth, nothing heroic"),
    body: t(
      "Hoy basta con no exigir. Un vaso más de agua. Si el cólico aprieta, paracetamol o ibuprofeno según te haya dicho tu médica — no te tomes el doble “porque sí”.",
      "Today it’s enough not to demand. One extra glass of water. If cramps bite, paracetamol or ibuprofen as your clinician said — don’t double it “just because.”",
    ),
    ask: t("¿El cólico ya bajó un poco?", "Has the cramp eased a little?"),
  },
  {
    title: t("El segundo o tercer día suele ser el más rojo", "Day two or three is often the reddest"),
    body: t(
      "Si hoy empapa más, no es que “empeoraste el ciclo”. Es el desprendimiento. Cambia con calma. Si mareo al levantarte: siéntate, hierro, avisa a alguien.",
      "If today soaks more, you didn’t “worsen the cycle”. It’s the shed. Change calmly. If you dizzy on standing: sit, iron, tell someone.",
    ),
    ask: t("¿Hoy el sangrado es más, igual o menos que ayer?", "Is today’s bleed more, the same, or less than yesterday?"),
  },
  {
    title: t("Hacia el final, el cuerpo afloja", "Toward the end, the body loosens"),
    body: t(
      "El flujo se oscurece, el vientre suelta. Un paseo corto ayuda más que quedarte enroscada todo el día — si las piernas quieren.",
      "Flow darkens, the belly lets go. A short walk helps more than curling up all day — if the legs want it.",
    ),
    ask: t("¿Ya sientes que está pasando, o todavía no?", "Do you feel it’s passing, or not yet?"),
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
  {
    title: t("Ganas de empezar no son obligación", "The itch to start is not an order"),
    body: t(
      "El estrógeno empuja proyectos. Elige uno. El resto puede esperar. Dormir sigue contando como trabajo.",
      "Estrogen pushes projects. Pick one. The rest can wait. Sleep still counts as work.",
    ),
    ask: t("¿Hoy tienes más ganas o más prisa?", "Do you have more want, or more hurry, today?"),
  },
  {
    title: t("La piel y el ánimo suelen ir juntos aquí", "Skin and mood often travel together here"),
    body: t(
      "Si el cutis mejora, el humor también. No es magia: es estrógeno. Guarda el día para comparar el mes que viene.",
      "If skin improves, mood often does. Not magic: estrogen. Keep the day to compare next month.",
    ),
    ask: t("¿La cara de hoy se parece a la de hace una semana?", "Does today’s face look like a week ago?"),
  },
  {
    title: t("Moco más claro: el cuerpo avisa", "Clearer mucus: the body is signaling"),
    body: t(
      "Se pone cremoso y luego más filante cerca de ovular. No hace falta obsesionarse. Un toque en el calendario basta.",
      "It turns creamy, then stretchier near ovulation. No need to obsess. One tap on the calendar is enough.",
    ),
    ask: t("¿Hoy lo notaste, o no hay nada que anotar?", "Did you notice it today, or is there nothing to log?"),
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
  {
    title: t("Tres días, no toda la semana", "Three days, not the whole week"),
    body: t(
      "La ventana fértil es corta. Fuera de ella, el cuerpo no está “fallando”. Si no buscas, cuídate estos días. Si buscas, aquí vale la pena el intento.",
      "The fertile window is short. Outside it, the body isn’t “failing”. If you’re not trying, be careful these days. If you are, this is worth the try.",
    ),
    ask: t("¿Estos días te cuadran con lo que buscas?", "Do these days match what you want?"),
  },
  {
    title: t("Un pinchazo a un lado no es urgente por sí solo", "A one-sided twinge is not an emergency on its own"),
    body: t(
      "Mittelschmerz: un lado, unas horas. Si el dolor es fuerte, con mareo o sangrado raro, eso sí es consulta. Lo demás, anótalo.",
      "Mittelschmerz: one side, a few hours. If pain is strong, with dizziness or odd bleeding, that is a visit. The rest, log it.",
    ),
    ask: t("¿El pinchazo de hoy es leve o no te deja hacer nada?", "Is today’s twinge mild, or does it stop you?"),
  },
  {
    title: t("Después del pico, un hueco es normal", "After the peak, a hollow is normal"),
    body: t(
      "Baja el estrógeno. Puede haber un día raro de ánimo. No decidas dejar un trabajo hoy si puedes esperarte tres días.",
      "Estrogen drops. There can be an odd mood day. Don’t quit a job today if you can wait three days.",
    ),
    ask: t("¿Hoy el ánimo bajó de golpe?", "Did mood drop suddenly today?"),
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
  {
    title: t("Hambre no es falta de voluntad", "Hunger is not a lack of will"),
    body: t(
      "La progesterona pide carbohidrato. Un plátano, avena, pan de verdad. El ayuno extremo estos días suele salir caro.",
      "Progesterone asks for carbohydrate. A banana, oats, real bread. Extreme fasting these days usually costs you.",
    ),
    ask: t("¿Hoy el hambre es de comida o de todo?", "Is today’s hunger for food, or for everything?"),
  },
  {
    title: t("Piel y pecho: también es este tramo", "Skin and breasts: this stretch too"),
    body: t(
      "Granos y pecho tenso unos días antes. Baja la sal si hincha. Un sostenedor que no apriete. No es “te descuidaste”.",
      "Spots and tender breasts a few days before. Lower salt if you swell. A bra that doesn’t clamp. You didn’t “let yourself go.”",
    ),
    ask: t("¿Hoy hincha más el pecho, la cara, o nada?", "Does it swell more in the breasts, the face, or not at all today?"),
  },
  {
    title: t("Si puedes, acuéstate más temprano", "If you can, go to bed earlier"),
    body: t(
      "La lútea duerme peor. Corta pantallas un rato. Magnesio en la comida, no en un milagro de TikTok.",
      "The luteal sleeps worse. Cut screens a while. Magnesium in food, not in a TikTok miracle.",
    ),
    ask: t("¿Anoche dormiste o solo te acostaste?", "Last night did you sleep, or just lie down?"),
  },
  {
    title: t("Mañana o pasado puede ser el primer día", "Tomorrow or the next day may be day one"),
    body: t(
      "Si ya conoces tu cuerpo, a veces el cólico avisa. Ten toallas o copa a mano. Si se atrasa más de lo tuyo, anótalo y espera unos días antes de alarmarte.",
      "If you know your body, cramps sometimes warn. Have pads or a cup ready. If it’s later than yours, log it and wait a few days before alarming.",
    ),
    ask: t("¿Sientes que ya viene, o todavía no?", "Do you feel it’s coming, or not yet?"),
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
  {
    title: t("Sofoco no es “ponerte nerviosa”", "A flush is not you “getting nervous”"),
    body: t(
      "Ola de calor, sudor, a veces palpitación. Ventila, capas de ropa, menos alcohol de noche. Si te despierta todas las noches, hay de qué hablar en consulta.",
      "Heat, sweat, sometimes a pounding heart. Air, layers, less alcohol at night. If it wakes you every night, that’s a visit conversation.",
    ),
    ask: t("¿Anoche el sofoco te despertó?", "Did a flush wake you last night?"),
  },
  {
    title: t("Niebla: anota, no te insultes", "Fog: log it, don’t insult yourself"),
    body: t(
      "Olvidas una palabra, pierdes el hilo. Es hormona, no que “ya no sirves”. Lista corta. Una cosa a la vez.",
      "You lose a word, lose the thread. Hormone, not “you’re useless now.” Short list. One thing at a time.",
    ),
    ask: t("¿Hoy la niebla es leve o te trabó el día?", "Is today’s fog light, or did it stall the day?"),
  },
  {
    title: t("Sangrado raro: fechas, no adivinanza", "Odd bleeding: dates, not a guess"),
    body: t(
      "Manchado entre reglas, o un mes sí y otro no. Eso es peri. Llévalo escrito. Un sangrado muy abundante de golpe sí es pronto a consulta.",
      "Spotting between periods, or one month yes and one no. That’s peri. Take it written. A sudden very heavy bleed is a prompt visit.",
    ),
    ask: t("¿Este sangrado se parece a tu regla de antes?", "Does this bleed look like your old period?"),
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
  {
    title: t("Sequedad tiene nombre y tiene trato", "Dryness has a name and a treatment"),
    body: t(
      "No es “así es la edad” en silencio. Lubricante, hidratante vaginal, a veces estrógeno local. Pregunta. No tienes que aguantar dolor en el sexo.",
      "It’s not “age” in silence. Lubricant, vaginal moisturizer, sometimes local estrogen. Ask. You don’t have to bear pain with sex.",
    ),
    ask: t("¿Hoy hay molestia o hoy está calma?", "Is there discomfort today, or is it calm?"),
  },
  {
    title: t("Hueso y músculo: un poco, casi todos los días", "Bone and muscle: a little, almost every day"),
    body: t(
      "Sentadillas a la silla, caminar, bolsa de arroz. El calcio en pastilla no reemplaza el movimiento. Si te mareas, siéntate.",
      "Chair squats, walking, a rice bag. Pill calcium doesn’t replace movement. If you dizzy, sit.",
    ),
    ask: t("¿Hoy te moviste aunque fuera diez minutos?", "Did you move today, even ten minutes?"),
  },
  {
    title: t("El sueño se puede pelear con horario, no con milagro", "Sleep is fought with a schedule, not a miracle"),
    body: t(
      "Misma hora de cama. Fresco. Menos vino de noche. Si el sofoco corta el sueño, eso es el tema a tratar, no tu “mala costumbre”.",
      "Same bedtime. Cool. Less wine at night. If flushes cut sleep, that’s the issue to treat, not your “bad habit.”",
    ),
    ask: t("¿A qué hora te acostaste anoche, más o menos?", "About what time did you go to bed last night?"),
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
  {
    title: t("Come aunque no tengas ganas", "Eat even if you don’t feel like it"),
    body: t(
      "Galleta salada, plátano, jengibre. Poco y seguido. Si no retienes nada y orinas muy poco, consulta. El café, suave.",
      "Salty cracker, banana, ginger. Little and often. If nothing stays down and you barely pee, get seen. Coffee, mild.",
    ),
    ask: t("¿Hoy pudiste desayunar algo?", "Did you manage any breakfast today?"),
  },
  {
    title: t("Miedo y pecho tenso pueden convivir", "Fear and tender breasts can coexist"),
    body: t(
      "No tienes que estar feliz todo el rato. Un paseo, agua, la próxima cita en el calendario. Sangrado o dolor fuerte de un lado: no esperes.",
      "You don’t have to be happy the whole time. A walk, water, the next appointment on the calendar. Bleeding or strong one-sided pain: don’t wait.",
    ),
    ask: t("¿Hoy el miedo es ruido, o es una señal rara?", "Is today’s fear noise, or an odd signal?"),
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
  {
    title: t("Dormir a ratos también es dormir", "Sleeping in snatches is still sleep"),
    body: t(
      "No compares tu noche con la de antes. Un vaso de agua, un cuerpo que se apoya. Si el ánimo está negro más de dos semanas, pide ayuda — no es “ser mamá”.",
      "Don’t compare tonight to before. A glass of water, a body that leans. If mood is black more than two weeks, get help — that’s not “being a mum.”",
    ),
    ask: t("¿Hoy alguien te puede cubrir una hora?", "Can someone cover you for an hour today?"),
  },
  {
    title: t("El sangrado de ahora no es la regla de antes", "This bleed is not your old period"),
    body: t(
      "Loquios: de rojo a rosado a crema. Si de pronto vuelve rojo vivo con coágulos grandes o fiebre, consulta. El resto, cambia y anota.",
      "Lochia: red to pink to cream. If it suddenly goes bright red with large clots or fever, get seen. The rest, change and log.",
    ),
    ask: t("¿Hoy el sangrado cambió de color?", "Did the bleed change color today?"),
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

function poolKey(stage: Stage, phase: Phase) {
  if (stage === "peri" || stage === "meno" || stage === "pregnancy" || stage === "postpartum") return stage;
  return phase === "none" ? "luteal" : phase;
}

export function dailyLetters(stage: Stage, phase: Phase) {
  const key = poolKey(stage, phase);
  return pool(stage, phase).map((letter, i) => ({
    id: `${key}-${i}`,
    ...letter,
  }));
}

/** Same calendar day → same note. Next day → next note, never yesterday’s if there’s another. */
export function pickDailyLetter(
  day: string,
  stage: Stage,
  phase: Phase,
  avoidId?: string | null,
) {
  const letters = dailyLetters(stage, phase);
  const seed = Number(day.replaceAll("-", "")) || 0;
  let i = seed % letters.length;
  if (letters.length > 1 && avoidId && letters[i]!.id === avoidId) {
    i = (i + 1) % letters.length;
  }
  return letters[i]!;
}

export function cartaDeHoy(
  day: string,
  stage: Stage,
  phase: Phase,
  lang: "es" | "en",
  avoidId?: string | null,
) {
  const letter = pickDailyLetter(day, stage, phase, avoidId);
  return {
    id: letter.id,
    title: pick(letter.title, lang),
    body: pick(letter.body, lang),
    ask: pick(letter.ask, lang),
  };
}

export function yesterdayISO(day: string) {
  const [y, m, d] = day.split("-").map(Number);
  const dt = new Date(y!, (m ?? 1) - 1, d ?? 1);
  dt.setDate(dt.getDate() - 1);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

