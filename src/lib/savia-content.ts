import type { Phase, Stage } from "@/lib/types";

export type Copy = { es: string; en: string };
const t = (es: string, en: string): Copy => ({ es, en });
export const pick = (c: Copy, lang: "es" | "en") => c[lang];

export const phaseName: Record<Phase, Copy> = {
  menstrual: t("Menstruación", "Menstrual"),
  follicular: t("Folicular", "Follicular"),
  ovulatory: t("Ovuladora", "Ovulatory"),
  luteal: t("Lútea", "Luteal"),
  none: t("Sin ciclo ahora", "No cycle right now"),
};

export const stageName: Record<Stage, Copy> = {
  cycle: t("Ciclo menstrual", "Menstrual cycle"),
  pregnancy: t("Embarazo", "Pregnancy"),
  postpartum: t("Posparto", "Postpartum"),
  peri: t("Perimenopausia", "Perimenopause"),
  meno: t("Menopausia", "Menopause"),
};

export const phases: Record<Exclude<Phase, "none">, { hormone: Copy; body: Copy; do: Copy }> = {
  menstrual: {
    hormone: t(
      "Estrógeno y progesterona están en su punto más bajo. El útero suelta el endometrio. El cuerpo pide calor, hierro y descanso, no un récord personal.",
      "Estrogen and progesterone are at their lowest. The uterus sheds the endometrium. The body asks for warmth, iron, and rest — not a personal best.",
    ),
    body: t(
      "Cólicos, fatiga, ganas de cueva. Es inflamación y un descenso hormonal, no flojera. El flujo puede ser rojo vivo al inicio y más oscuro al final.",
      "Cramps, fatigue, the wish to hide. That’s inflammation and a hormone drop, not laziness. Flow is often bright at first and darker later.",
    ),
    do: t(
      "Come caliente. Hierro (lentejas, hígado de vez en cuando, verdura oscura) con vitamina C. Camina suave. Bolsa de agua. No es el día de ayuno extremo ni de HIIT.",
      "Eat warm food. Iron (lentils, occasional liver, dark greens) with vitamin C. Gentle walking. A hot bottle. Not the day for extreme fasting or HIIT.",
    ),
  },
  follicular: {
    hormone: t(
      "El FSH empuja a los folículos. El estrógeno sube, despacio. Más claridad, más piel, más ganas de empezar cosas. Es la primavera del ciclo.",
      "FSH nudges follicles. Estrogen rises, slowly. More clarity, better skin, the itch to start things. This is the spring of the cycle.",
    ),
    body: t(
      "Energía que vuelve, moco más claro, menos hinchazón. Si el ciclo es irregular, esta fase puede alargarse — la lútea casi nunca; la folicular sí.",
      "Energy returns, clearer cervical mucus, less bloat. If the cycle is irregular, this phase stretches — the luteal almost never does; the follicular does.",
    ),
    do: t(
      "Ensaladas, fermentados, pescado, huevo. Entrena con más carga si te sienta bien. Es buen momento para proyectos y citas que piden presencia.",
      "Salads, ferments, fish, eggs. Lift heavier if it feels good. A good window for projects and meetings that need you present.",
    ),
  },
  ovulatory: {
    hormone: t(
      "Pico de estrógeno, luego LH, sale el óvulo. Un poco de testosterona. Ventana fértil: unos tres días alrededor. El cuerpo está en su traje de fiesta.",
      "Estrogen peaks, then LH, the egg releases. A little testosterone. Fertile window: about three days around it. The body is in party clothes.",
    ),
    body: t(
      "Moco elástico, pecho un poco sensible, a veces un pinchazo a un lado (mittelschmerz). Libido suele subir. Unos días después baja el estrógeno y puede haber un bajón.",
      "Stretchy mucus, slightly tender breasts, sometimes a one-sided twinge (mittelschmerz). Libido often rises. A few days later estrogen dips and mood can drop.",
    ),
    do: t(
      "Fibra, colores, agua. Si no buscas embarazo, este es el rato de ser más cuidadosa. Si lo buscas, aquí está el centro de la diana.",
      "Fiber, color, water. If you’re not trying, this is when to be more careful. If you are, this is the bullseye.",
    ),
  },
  luteal: {
    hormone: t(
      "El cuerpo lúteo fabrica progesterona. Si no hay embarazo, a los ~14 días cae y llega la regla. Si hay, la progesterona se sostiene. El PMS vive aquí.",
      "The corpus luteum makes progesterone. If there’s no pregnancy, it falls after ~14 days and the period arrives. If there is, progesterone holds. PMS lives here.",
    ),
    body: t(
      "Hinchazón, hambre, sueño, piel, paciencia corta. No es “todo en tu cabeza”: es un cerebro con menos serotonina y más sensibilidad a la progesterona.",
      "Bloat, hunger, sleep, skin, a shorter fuse. Not “all in your head”: a brain with less serotonin and more sensitivity to progesterone.",
    ),
    do: t(
      "Magnesio (calabaza, cacao, verdura), carbohidrato complejo, sal si te da mareo. Corta cafeína si te pone ansiosa. Duerme como si fuera trabajo.",
      "Magnesium (pumpkin seeds, cacao, greens), complex carbs, salt if you get dizzy. Cut caffeine if it makes you anxious. Treat sleep like a job.",
    ),
  },
};

export type Tea = {
  id: string;
  name: Copy;
  taste: Copy;
  for: Copy;
  brew: Copy;
  avoid: Copy;
  stages: Stage[];
  phases: Phase[];
};

export const teas: Tea[] = [
  {
    id: "ginger",
    name: t("Jengibre", "Ginger"),
    taste: t("Picante, cálido.", "Sharp, warm."),
    for: t("Náusea, cólico suave, manos frías.", "Nausea, mild cramps, cold hands."),
    brew: t("Rodaja fresca 10 min. Miel si quieres.", "Fresh slice, 10 min. Honey if you like."),
    avoid: t("Dosis altas de concentrado en el primer trimestre: habla con tu médica. Gastritis.", "High-dose extracts in the first trimester: ask your clinician. Gastritis."),
    stages: ["cycle", "pregnancy", "postpartum", "peri", "meno"],
    phases: ["menstrual", "luteal"],
  },
  {
    id: "chamomile",
    name: t("Manzanilla", "Chamomile"),
    taste: t("Floral, suave.", "Floral, soft."),
    for: t("Dormir, vientre tenso, ansiedad de la lútea.", "Sleep, tight belly, luteal anxiety."),
    brew: t("Una cucharada, tapada, 7 min.", "A spoonful, covered, 7 min."),
    avoid: t("Alergia a margaritas. Embarazo: infusión suave, no litros. Anticoagulantes.", "Ragweed allergy. Pregnancy: a mild cup, not litres. Blood thinners."),
    stages: ["cycle", "postpartum", "peri", "meno"],
    phases: ["menstrual", "luteal"],
  },
  {
    id: "spearmint",
    name: t("Menta verde", "Spearmint"),
    taste: t("Dulce, fresca.", "Sweet, fresh."),
    for: t("Andrógenos altos, acné cíclico, SOP (apoyo, no milagro).", "High androgens, cyclic acne, PCOS (support, not a miracle)."),
    brew: t("Dos veces al día, 2–3 semanas para notar algo.", "Twice a day, 2–3 weeks before you notice much."),
    avoid: t("Reflujo fuerte. No sustituye tratamiento de SOP.", "Bad reflux. Does not replace PCOS care."),
    stages: ["cycle", "peri"],
    phases: ["follicular", "ovulatory"],
  },
  {
    id: "raspberry",
    name: t("Hoja de frambuesa", "Red raspberry leaf"),
    taste: t("A té negro suave, astringente.", "Like a mild black tea, astringent."),
    for: t("Tono uterino. Tradición en el tercer trimestre.", "Uterine tone. A third-trimester tradition."),
    brew: t("1 cucharada, 10 min. Diario solo si tu matrona está de acuerdo.", "1 spoon, 10 min. Daily only if your midwife agrees."),
    avoid: t("No en el primer trimestre. Historia de parto pretérmino: no. No es “té para adelantar el parto”.", "Not in the first trimester. History of preterm labor: skip. It is not a labor-starting tea."),
    stages: ["pregnancy", "cycle"],
    phases: ["menstrual"],
  },
  {
    id: "nettle",
    name: t("Ortiga", "Nettle"),
    taste: t("Verde, a tierra.", "Green, earthy."),
    for: t("Minerales, hierro de apoyo, hinchazón, posparto.", "Minerals, iron support, bloat, postpartum."),
    brew: t("Larga: 20–30 min. Sabe mejor con limón.", "Long brew: 20–30 min. Better with lemon."),
    avoid: t("Embarazo temprano: consulta. Diuréticos, riñón, anticoagulantes.", "Early pregnancy: ask. Diuretics, kidney issues, blood thinners."),
    stages: ["cycle", "postpartum", "peri", "meno"],
    phases: ["menstrual", "follicular"],
  },
  {
    id: "sage",
    name: t("Salvia", "Sage"),
    taste: t("Resina, cocina.", "Resin, kitchen."),
    for: t("Sudores de la peri y la meno. Seca un poco la leche.", "Peri and meno sweats. Dries milk a little."),
    brew: t("Media cucharadita, 5 min. Una taza, no un termo.", "Half a teaspoon, 5 min. One cup, not a thermos."),
    avoid: t("Lactancia si quieres mantener oferta. Embarazo. Epilepsia (tuyona). No diario eterno.", "Nursing if you want supply. Pregnancy. Epilepsy (thujone). Not forever-daily."),
    stages: ["peri", "meno"],
    phases: ["none"],
  },
  {
    id: "redclover",
    name: t("Trébol rojo", "Red clover"),
    taste: t("Dulce, heno.", "Sweet, hay."),
    for: t("Isoflavonas. Sofocos leves. Piel seca de la meno.", "Isoflavones. Mild flashes. Dry meno skin."),
    brew: t("Infusión 10 min. Ciclos de 8 semanas, no eterno.", "10 min steep. 8-week courses, not forever."),
    avoid: t("Cáncer sensible a estrógeno, terapia hormonal, anticoagulantes, embarazo.", "Estrogen-sensitive cancer, HRT, blood thinners, pregnancy."),
    stages: ["peri", "meno"],
    phases: ["none"],
  },
  {
    id: "lemonbalm",
    name: t("Melisa", "Lemon balm"),
    taste: t("Limón de jardín.", "Garden lemon."),
    for: t("Nervios, palpitaciones de ansiedad, insomnio de la lútea y la peri.", "Nerves, anxious palpitations, luteal and peri insomnia."),
    brew: t("Fresca si puedes, 8 min tapada.", "Fresh if you can, 8 min covered."),
    avoid: t("Hipotiroidismo: con ojo. Sedantes. Cirugía próxima (alerta a anestesia).", "Hypothyroid: go gently. Sedatives. Upcoming surgery (tell anesthesia)."),
    stages: ["cycle", "pregnancy", "postpartum", "peri", "meno"],
    phases: ["luteal", "menstrual"],
  },
  {
    id: "rooibos",
    name: t("Rooibos", "Rooibos"),
    taste: t("Dulce, rojo, sin teína.", "Sweet, red, no caffeine."),
    for: t("Sustituto de café de noche. Embarazo. Hierro de apoyo suave.", "Night coffee stand-in. Pregnancy. Gentle iron support."),
    brew: t("Puede hervir 5 min, no se amarga igual.", "Can boil 5 min; it doesn’t bitter the same way."),
    avoid: t("Muy rara alergia. Si tomas quimio, pregunta.", "Rare allergy. If on chemo, ask."),
    stages: ["cycle", "pregnancy", "postpartum", "peri", "meno"],
    phases: ["menstrual", "follicular", "ovulatory", "luteal"],
  },
  {
    id: "vitex",
    name: t("Vitex (sauzgatillo)", "Vitex (chasteberry)"),
    taste: t("Picante, no es un té rico. Mejor tintura o cápsula con guía clínica.", "Peppery, not a tasty tea. Tincture or capsule with clinical guidance is wiser."),
    for: t("Ciclos cortos, tensión premenstrual, prolactina un poco alta.", "Short cycles, premenstrual tension, mildly high prolactin."),
    brew: t("No improvises dosis. 3 meses para ver patrón.", "Don’t improvise the dose. 3 months to see a pattern."),
    avoid: t("Embarazo, lactancia, Parkinson, antipsicóticos, FIV. No es anticonceptivo.", "Pregnancy, nursing, Parkinson’s, antipsychotics, IVF. Not birth control."),
    stages: ["cycle", "peri"],
    phases: ["luteal"],
  },
  {
    id: "linden",
    name: t("Tilo", "Linden"),
    taste: t("Miel de árbol.", "Tree honey."),
    for: t("Tensión, sueño, corazón acelerado de la peri.", "Tension, sleep, a racing peri heart."),
    brew: t("Flores, 8 min tapado.", "Blossoms, 8 min covered."),
    avoid: t("Alergia a tilo. Cardiopatía: infusión, no milagro.", "Linden allergy. Heart disease: a cup, not a miracle."),
    stages: ["cycle", "peri", "meno", "postpartum"],
    phases: ["luteal"],
  },
  {
    id: "peppermint",
    name: t("Hierbabuena / menta piperita", "Peppermint"),
    taste: t("Mentol claro.", "Clear menthol."),
    for: t("Hinchazón, colon irritable, dolor de cabeza tensional.", "Bloat, IBS, tension headache."),
    brew: t("5 min. Demasiado tiempo amarga.", "5 min. Too long and it turns bitter."),
    avoid: t("Reflujo. Lactancia: puede bajar un poco la leche. Bebés: no aceites mentolados cerca.", "Reflux. Nursing: may lower supply a little. Babies: no menthol oils nearby."),
    stages: ["cycle", "peri", "meno"],
    phases: ["luteal", "menstrual"],
  },
];

export type FoodCard = { id: string; title: Copy; why: Copy; plate: Copy; stages: Stage[]; phases: Phase[] };

export const foods: FoodCard[] = [
  {
    id: "iron",
    title: t("Hierro que se puede comer", "Iron you can actually eat"),
    why: t("Cada regla se lleva sangre. Sin hierro el cerebro niebla y el pelo se queja.", "Each period spends blood. Without iron the brain fogs and hair complains."),
    plate: t("Lentejas + limón. Huevo. Carne roja 1–2 veces. Espinaca no basta sola; súmale C.", "Lentils + lemon. Eggs. Red meat 1–2 times. Spinach alone isn’t enough; add vitamin C."),
    stages: ["cycle", "pregnancy", "postpartum", "peri"],
    phases: ["menstrual"],
  },
  {
    id: "warm",
    title: t("Caliente, no heroico", "Warm, not heroic"),
    why: t("El útero trabaja. Un gazpacho helado no es un fallo moral, pero un caldo ayuda al cólico.", "The uterus is working. A cold gazpacho isn’t a moral failure, but broth helps cramps."),
    plate: t("Caldo de huesos o verdura, arroz, jengibre, canela. Cacao sin azúcar de más.", "Bone or veg broth, rice, ginger, cinnamon. Cacao without extra sugar."),
    stages: ["cycle", "postpartum"],
    phases: ["menstrual"],
  },
  {
    id: "fresh",
    title: t("Fresco y vivo", "Fresh and alive"),
    why: t("El estrógeno sube: el intestino tiene que deshacerse del sobrante. Fibra y bichos buenos.", "Estrogen is rising: the gut has to clear the spare. Fiber and good bugs."),
    plate: t("Ensalada, kiwi, yogur o kéfir, avena, semillas de lino molidas.", "Salad, kiwi, yogurt or kefir, oats, ground flax."),
    stages: ["cycle"],
    phases: ["follicular"],
  },
  {
    id: "color",
    title: t("Plato de colores", "A plate of color"),
    why: t("Ovulación pide antioxidantes. El hígado también.", "Ovulation wants antioxidants. So does the liver."),
    plate: t("Bayas, pimiento, salmón o sardina, aceite de oliva, hierbas a puñados.", "Berries, pepper, salmon or sardines, olive oil, herbs by the handful."),
    stages: ["cycle"],
    phases: ["ovulatory"],
  },
  {
    id: "magnesium",
    title: t("Magnesio de la lútea", "Luteal magnesium"),
    why: t("Cólico futuro, chocolate, insomnio: el magnesio está en esa película.", "Coming cramps, chocolate, insomnia: magnesium is in that movie."),
    plate: t("Semilla de calabaza, cacao 80%, alubias, plátano, verdura de hoja. Cena con carbohidrato.", "Pumpkin seeds, 80% cacao, beans, banana, greens. Dinner with a carb."),
    stages: ["cycle", "peri"],
    phases: ["luteal"],
  },
  {
    id: "preg",
    title: t("Cuna del bebé, no dieta de revista", "A nest, not a magazine diet"),
    why: t("Folato, colina, yodo, hierro, DHA. El café se corta a 200 mg. El hígado, de vez en cuando, no diario.", "Folate, choline, iodine, iron, DHA. Coffee under 200 mg. Liver now and then, not daily."),
    plate: t("Huevo (yema), lentejas, naranja, sardina, lácteo o alternativa yodada, verdura oscura.", "Egg (yolk), lentils, orange, sardines, dairy or iodized alternative, dark greens."),
    stages: ["pregnancy"],
    phases: ["none"],
  },
  {
    id: "post",
    title: t("Reparar, no rebotar", "Repair, don’t rebound"),
    why: t("Sangraste, duermes a trozos, quizás das leche. Calorías y proteína no son vanidad.", "You bled, you sleep in pieces, you may be making milk. Calories and protein are not vanity."),
    plate: t("Avena, huevo, caldo, dátil, almendra, estofado. Agua como si fueras planta.", "Oats, eggs, broth, dates, almonds, stew. Water as if you were a plant."),
    stages: ["postpartum"],
    phases: ["none"],
  },
  {
    id: "protein",
    title: t("Proteína en cada plato", "Protein on every plate"),
    why: t("En peri y meno baja el estrógeno: se va músculo y se va hueso si no los pides.", "In peri and meno estrogen falls: muscle and bone leave if you don’t ask them to stay."),
    plate: t("1 palma de proteína por comida. Yogur griego, pescado, tofu, huevo, lenteja.", "A palm of protein each meal. Greek yogurt, fish, tofu, eggs, lentils."),
    stages: ["peri", "meno"],
    phases: ["none"],
  },
  {
    id: "bone",
    title: t("Hueso y noche", "Bone and night"),
    why: t("Calcio, D, K2, menos alcohol si te despiertan los sudores.", "Calcium, D, K2, less alcohol if sweats wake you."),
    plate: t("Lácteo o col rizada + tahini. Setas. Paseo al sol. Cena temprana.", "Dairy or kale + tahini. Mushrooms. A walk in daylight. Earlier dinner."),
    stages: ["peri", "meno"],
    phases: ["none"],
  },
  {
    id: "blood",
    title: t("Azúcar sin montaña rusa", "Blood sugar without the rollercoaster"),
    why: t("SOP, peri, insomnio: el pico de pan solo empeora el calor y el humor.", "PCOS, peri, insomnia: a bread spike makes heat and mood worse."),
    plate: t("Primero proteína y fibra, después el arroz. Vinagre en la ensalada. Paseo de 10 min.", "Protein and fiber first, rice after. Vinegar on the salad. A 10-minute walk."),
    stages: ["cycle", "pregnancy", "peri", "meno", "postpartum"],
    phases: ["luteal", "follicular"],
  },
];

export const hormones: { id: string; name: Copy; what: Copy; when: Copy }[] = [
  {
    id: "estrogen",
    name: t("Estrógeno", "Estrogen"),
    what: t("Construye endometrio, humedece, afila el cerebro verbal, protege hueso y vaso. No es “la hormona mala”.", "Builds endometrium, moistens, sharpens verbal brain, protects bone and vessel. Not “the bad hormone.”"),
    when: t("Sube en folicular, pico en ovulación, segundo pico menor en lútea. En peri baila. En meno, casi se apaga (queda un poco de estrona).", "Rises in follicular, peaks at ovulation, a smaller second peak in luteal. In peri it dances. In meno it nearly goes quiet (some estrone remains)."),
  },
  {
    id: "progesterone",
    name: t("Progesterona", "Progesterone"),
    what: t("Hija del óvulo que salió. Calma, sube la temperatura, prepara el útero. Sin ovulación, casi no hay.", "Daughter of the egg that left. Calms, raises temperature, readies the uterus. No ovulation, almost none."),
    when: t("Solo en lútea (o embarazo). En peri a menudo falta antes que el estrógeno — de ahí reglas locas y sueño roto.", "Only in luteal (or pregnancy). In peri it often leaves before estrogen — hence wild bleeding and broken sleep."),
  },
  {
    id: "fsh",
    name: t("FSH", "FSH"),
    what: t("La hipófisis grita a los ovarios: maduren un folículo.", "The pituitary shouts at the ovaries: ripen a follicle."),
    when: t("Alta al inicio del ciclo. Muy alta en meno (los ovarios ya no contestan). Un análisis suelto no es un destino.", "High at cycle start. Very high in meno (the ovaries stopped answering). One lab draw is not a destiny."),
  },
  {
    id: "lh",
    name: t("LH", "LH"),
    what: t("El empujón que suelta el óvulo. Los test de ovulación la cazan.", "The shove that releases the egg. Ovulation tests hunt it."),
    when: t("Pico 24–36 h antes de ovular. En SOP puede estar alta de base y liar el test.", "Peaks 24–36 h before ovulation. In PCOS it can sit high and confuse the test."),
  },
  {
    id: "testosterone",
    name: t("Testosterona", "Testosterone"),
    what: t("También es vuestra. Músculo, deseo, empuje. De los ovarios y de las adrenales.", "Yours too. Muscle, desire, drive. From ovaries and adrenals."),
    when: t("Un poco más cerca de ovular. En SOP puede sobrar (acné, vello). En meno baja y el deseo a veces se esconde.", "A little more near ovulation. In PCOS it can overflow (acne, hair). In meno it falls and desire sometimes hides."),
  },
  {
    id: "cortisol",
    name: t("Cortisol", "Cortisol"),
    what: t("El que te saca de la cama y te presta glucosa. Crónico, te roba progesterona y sueño.", "Gets you out of bed and lends you glucose. Chronic, it steals progesterone and sleep."),
    when: t("Debe bajar de noche. Café a las 7 am, no a las 4 pm. La peri lo pone nervioso.", "Should fall at night. Coffee at 7 am, not 4 pm. Peri makes it jumpy."),
  },
  {
    id: "insulin",
    name: t("Insulina", "Insulin"),
    what: t("Guarda el azúcar. Si grita mucho, los ovarios hacen más andrógenos (SOP) y la peri se pone caliente.", "Stores sugar. If it shouts, ovaries make more androgens (PCOS) and peri gets hotter."),
    when: t("Cada comida. Proteína primero, paseo después. No es una dieta, es una palanca hormonal.", "Every meal. Protein first, walk after. Not a diet — a hormone lever."),
  },
  {
    id: "prolactin",
    name: t("Prolactina", "Prolactin"),
    what: t("Leche. También sube con pezón, estrés, falta de sueño, algunos antipsicóticos.", "Milk. Also rises with nipple, stress, no sleep, some antipsychotics."),
    when: t("Alta en lactancia (y a veces anovulación). Fuera de eso, un valor alto merece análisis, no un té milagroso.", "High in lactation (and sometimes anovulation). Otherwise a high value deserves labs, not a miracle tea."),
  },
  {
    id: "amh",
    name: t("AMH", "AMH"),
    what: t("Retrato de la reserva folicular. No es tu fertilidad de este mes ni tu valor.", "A portrait of follicular reserve. Not this month’s fertility, and not your worth."),
    when: t("Baja con la edad. Útil en clínica de fertilidad. Inútil para diagnosticar meno sola.", "Falls with age. Useful in a fertility clinic. Useless alone for diagnosing meno."),
  },
  {
    id: "oxytocin",
    name: t("Oxitocina", "Oxytocin"),
    what: t("Parto, leche, orgasmo, abrazo. Baja el cortisol un rato.", "Labor, milk, orgasm, a hug. Lowers cortisol for a while."),
    when: t("Picos en vínculo. En posparto, el cuerpo la usa como herramienta, no como adorno.", "Peaks in bonding. Postpartum, the body uses it as a tool, not an ornament."),
  },
];

export const periGuide: { title: Copy; body: Copy }[] = [
  {
    title: t("Qué es, de verdad", "What it actually is"),
    body: t(
      "No es “un día sin regla”. Es la década (a veces más) en la que los ovarios se vuelven imprevisibles: un mes ovulas, al otro no; el estrógeno pega latigazos; la progesterona falta. Puede empezar a los 40, a veces a los 35. La menopausia es un punto: 12 meses sin regla. La peri es el camino.",
      "It is not “a day without a period.” It is the decade (sometimes more) when ovaries turn unpredictable: you ovulate one month, not the next; estrogen lashes out; progesterone goes missing. It can start at 40, sometimes 35. Menopause is a point: 12 months without a period. Peri is the road.",
    ),
  },
  {
    title: t("Señales que no son “estrés”", "Signs that are not “just stress”"),
    body: t(
      "Reglas más juntas o más largas, manchado, corazón a mil a las 3 am, calor de la nada, niebla para encontrar una palabra, rabia que no te reconoces, deseo que aparece o se esconde, hombro congelado, migrana nueva. Puedes tener peri con reglas todavía “normales”.",
      "Periods closer together or longer, spotting, a racing heart at 3 am, heat from nowhere, fog for a word, rage you don’t recognize, desire that shows up or hides, frozen shoulder, a new migraine. You can be in peri with still-“normal” periods.",
    ),
  },
  {
    title: t("Qué pedir en consulta", "What to ask for in clinic"),
    body: t(
      "No hace falta FSH para empezar a tratar síntomas. Pide: historia, tensión, TSH, hierro/ferritina, y hablar de terapia hormonal si no hay contraindicación. La terapia de la peri no es “un parche de abuela”: estrógeno con progesterona si tienes útero.",
      "You don’t need FSH to start treating symptoms. Ask for: history, blood pressure, TSH, iron/ferritin, and a talk about hormone therapy if there’s no contraindication. Peri therapy is not “grandma’s patch”: estrogen with progesterone if you have a uterus.",
    ),
  },
  {
    title: t("Lo que puedes hacer esta semana", "What you can do this week"),
    body: t(
      "Proteína en cada comida, fuerza 2 veces, alcohol a raya si sudas, cafeína solo mañana, dormitorio fresco, magnesio de noche. Anota sofocos y sueño: es el papel que una médica toma en serio.",
      "Protein each meal, strength twice, alcohol down if you sweat, caffeine only in the morning, a cool bedroom, magnesium at night. Log flashes and sleep: that’s the paper a clinician takes seriously.",
    ),
  },
];

export const menoGuide: { title: Copy; body: Copy }[] = [
  {
    title: t("El punto, no el abismo", "A point, not a cliff"),
    body: t(
      "Menopausia: 12 meses seguidos sin regla (si no te operaron los ovarios). Después eres posmenopáusica el resto de la vida. El estrógeno bajo cambia hueso, vaso, vagina, cerebro. No es un fallo; es otra estación. Se acompaña.",
      "Menopause: 12 months in a row without a period (if your ovaries weren’t removed). After that you are postmenopausal for life. Low estrogen changes bone, vessel, vagina, brain. Not a failure — another season. It can be accompanied.",
    ),
  },
  {
    title: t("Sofocos, sueño, piel", "Flashes, sleep, skin"),
    body: t(
      "Los sofocos pueden durar años. Terapia hormonal, no hormonal (fezolinant, ISRS a dosis bajas, gabapentina) y lo básico: alcohol, picante, ropa por capas, sábana que se pueda tirar. La sequedad vaginal no “se pasa”: estrógeno local es de lo más seguro y eficaz.",
      "Flashes can last years. Hormone therapy, non-hormonal (fezolinant, low-dose SSRI, gabapentin) and the basics: alcohol, spice, layers, a sheet you can throw off. Vaginal dryness does not “pass”: local estrogen is among the safest and most effective tools.",
    ),
  },
  {
    title: t("Hueso y corazón", "Bone and heart"),
    body: t(
      "Los cinco años después de la menopausia se pierde hueso deprisa. Fuerza, impacto suave, calcio + D, no fumar. El corazón deja de tener el escudo del estrógeno: tensión, lípidos, movimiento. Esto no es estética; es independencia a los 80.",
      "The five years after menopause spend bone quickly. Strength, gentle impact, calcium + D, no smoking. The heart loses estrogen’s shield: blood pressure, lipids, movement. This is not aesthetics; it is independence at 80.",
    ),
  },
];

export const postpartumGuide: { title: Copy; body: Copy }[] = [
  {
    title: t("El cuarto trimestre", "The fourth trimester"),
    body: t(
      "Sangrado (loquios), hormonas en caída libre, leche o no, suelo pélvico, sueño roto. La regla puede tardar meses si das pecho — o volver a las 6 semanas. Ninguna de las dos es un examen.",
      "Bleeding (lochia), hormones in free fall, milk or not, pelvic floor, broken sleep. The period may wait months if you nurse — or return at 6 weeks. Neither is a test you pass.",
    ),
  },
  {
    title: t("Ánimo", "Mood"),
    body: t(
      "Baby blues hasta ~2 semanas es común. Si a las 3 semanas no puedes dormir ni cuando el bebé duerme, te asusta hacer daño, o no sientes nada, es urgente: depresión/ansiedad posparto se tratan. No es falta de gratitud.",
      "Baby blues up to ~2 weeks is common. If at 3 weeks you cannot sleep even when the baby does, you’re afraid of harm, or you feel nothing, it is urgent: postpartum depression/anxiety are treated. It is not a lack of gratitude.",
    ),
  },
];

export const pregnancyWeeks: { week: number; title: Copy; body: Copy }[] = [
  { week: 4, title: t("Un retraso, un test", "A late period, a test"), body: t("El saco apenas se ve. Folato ya, no mañana. Náusea puede empezar o no.", "The sac is barely visible. Folate now, not tomorrow. Nausea may start or not.") },
  { week: 5, title: t("Corazón de semilla", "A seed of a heart"), body: t("Latido temprano. Pecho tenso, olfato de superheroína. Come lo que puedas.", "An early beat. Tight breasts, superhero smell. Eat what you can.") },
  { week: 6, title: t("Mareo de verdad", "Real queasiness"), body: t("hCG alta. Galletas en la mesita. Si no retienes líquidos 24 h, urgencias.", "hCG high. Crackers on the nightstand. If you can’t keep fluids 24 h, ER.") },
  { week: 8, title: t("Todo es órgano", "Everything is an organ"), body: t("El embrión pasa a feto pronto. Evita alcohol, tabaco, medicinas sin preguntar.", "Embryo becomes fetus soon. Skip alcohol, tobacco, meds without asking.") },
  { week: 10, title: t("Casi primer trimestre cumplido", "Almost through the first"), body: t("Riesgo de pérdida baja un poco. Ropa que no oprima. TSH si tienes tiroides.", "Miscarriage risk eases a little. Clothes that don’t clamp. TSH if you have thyroid.") },
  { week: 12, title: t("La nuca, el alivio", "Nuchal, and relief"), body: t("Muchas cuentan ahora. Energía puede volver. El útero sale de la pelvis.", "Many people share now. Energy may return. The uterus leaves the pelvis.") },
  { week: 16, title: t("Movimientos de pez", "Fish-like movement"), body: t("Si ya tuviste un bebé, los sientes antes. Hierro. Caminar.", "If you’ve had a baby, you feel it earlier. Iron. Walk.") },
  { week: 20, title: t("La mitad, la anatomía", "Halfway, anatomy"), body: t("Ecografía larga. Sientes golpes. Acidez. Duerme de lado cuando puedas.", "The long scan. Kicks. Heartburn. Sleep on your side when you can.") },
  { week: 24, title: t("Viabilidad y glucosa", "Viability and glucose"), body: t("El pulmón aún inmaduro. Curva de azúcar se acerca. Contracciones de Braxton: normales si son cortas.", "Lungs still immature. Glucose test is coming. Braxton Hicks: normal if short.") },
  { week: 28, title: t("Tercer trimestre", "Third trimester"), body: t("Vacuna, RhoGAM si lo necesitas. Sueño a trozos. Cuenta movimientos.", "Vaccines, RhoGAM if you need it. Sleep in pieces. Count movements.") },
  { week: 32, title: t("Cabeza abajo, o no", "Head down, or not"), body: t("El bebé gana grasa. Ardor, cadera, ganas de orinar. Fisioterapia de suelo si puedes.", "The baby gains fat. Burn, hips, peeing. Pelvic floor PT if you can.") },
  { week: 36, title: t("A término pronto", "Term, soon"), body: t("Semanas 37–42 es el rango. Maleta. Signos de alarma: sangre, líquido, dolor de cabeza fuerte, destellos.", "37–42 is the range. Bag packed. Red flags: blood, fluid, a vicious headache, sparks in vision.") },
  { week: 39, title: t("Esperar también es trabajo", "Waiting is also labor"), body: t("El bebé termina pulmón y cerebro. Inducción tiene indicaciones; no es un capricho ni un fracaso.", "The baby finishes lungs and brain. Induction has indications; it is neither a whim nor a failure.") },
  { week: 40, title: t("La fecha es un promedio", "The date is an average"), body: t("Solo ~5% nace el día. Pregunta el plan si pasas de 41. Tú no estás “retrasada”: el calendario sí.", "Only ~5% arrive on the day. Ask the plan past 41. You are not “late”: the calendar is.") },
];

export function weekCard(week: number | null) {
  if (!week) return pregnancyWeeks[0];
  let best = pregnancyWeeks[0]!;
  for (const w of pregnancyWeeks) {
    if (w.week <= week) best = w;
  }
  return best;
}

export const trimester: { n: 1 | 2 | 3; title: Copy; body: Copy }[] = [
  {
    n: 1,
    title: t("Primer trimestre (1–12)", "First trimester (1–12)"),
    body: t("Cansancio y náusea son el trabajo. Folato 400–800 mcg, yodo, no alcohol. El riesgo de pérdida es más alto aquí; no es culpa tuya.", "Tiredness and nausea are the job. Folate 400–800 mcg, iodine, no alcohol. Loss risk is highest here; it is not your fault."),
  },
  {
    n: 2,
    title: t("Segundo (13–27)", "Second (13–27)"),
    body: t("Suele ser el más habitable. Anatomía, movimientos, hierro, DHA. Cuidado con tumbarte boca arriba mucho rato al final de esta etapa.", "Often the most livable. Anatomy scan, movement, iron, DHA. Careful lying flat on your back for long stretches late in this stage."),
  },
  {
    n: 3,
    title: t("Tercer (28–nacimiento)", "Third (28–birth)"),
    body: t("Sueño, acidez, preparación. Movimientos diarios. Signos de preeclampsia: cabeza, luces, hinchazón súbita, dolor bajo las costillas.", "Sleep, heartburn, getting ready. Daily movements. Preeclampsia signs: headache, lights, sudden swelling, pain under the ribs."),
  },
];

export const disclaimer = t(
  "Savia acompaña y enseña. No diagnostica, no receta, no sustituye a tu médica, matrona o farmacéutica. Los tés y comidas son tradición y nutrición, no tratamiento. Si hay sangre abundante, dolor nuevo, tristeza que no te deja cuidar, fiebre, o un test de embarazo y dudas, busca atención.",
  "Savia accompanies and teaches. It does not diagnose, prescribe, or replace your clinician, midwife, or pharmacist. Teas and food are tradition and nutrition, not treatment. Heavy bleeding, new pain, sadness that stops you caring, fever, or a pregnancy test and doubt — get care.",
);

export function teaFor(stage: Stage, phase: Phase): Tea {
  const scored = teas
    .filter((tea) => tea.stages.includes(stage))
    .map((tea) => ({ tea, n: tea.phases.includes(phase) || tea.phases.includes("none") ? 2 : 1 }))
    .sort((a, b) => b.n - a.n);
  return scored[0]?.tea ?? teas[8]!;
}

export function foodsFor(stage: Stage, phase: Phase): FoodCard[] {
  const exact = foods.filter((f) => f.stages.includes(stage) && f.phases.includes(phase));
  const byStage = foods.filter((f) => f.stages.includes(stage) && (f.phases.includes("none") || phase === "none"));
  const merged = [...exact];
  for (const f of byStage) {
    if (!merged.includes(f)) merged.push(f);
  }
  if (merged.length) return merged.slice(0, 3);
  return foods.filter((f) => f.stages.includes(stage)).slice(0, 3);
}

export const symptomLabel: Record<string, Copy> = {
  cramps: t("Cólicos", "Cramps"),
  headache: t("Cabeza", "Headache"),
  bloating: t("Hinchazón", "Bloat"),
  breast: t("Pecho", "Breasts"),
  acne: t("Acné", "Acne"),
  anxiety: t("Ansiedad", "Anxiety"),
  low_mood: t("Ánimo bajo", "Low mood"),
  irritable: t("Irritable", "Irritable"),
  insomnia: t("Insomnio", "Insomnia"),
  hot_flash: t("Sofoco", "Hot flash"),
  night_sweat: t("Sudor de noche", "Night sweat"),
  libido_up: t("Deseo alto", "Desire up"),
  libido_down: t("Deseo bajo", "Desire down"),
  fatigue: t("Cansancio", "Fatigue"),
  brain_fog: t("Niebla", "Brain fog"),
  nausea: t("Náusea", "Nausea"),
  spotting: t("Manchado", "Spotting"),
  constipation: t("Estreñimiento", "Constipation"),
  craving: t("Antojo", "Craving"),
  discharge: t("Flujo", "Discharge"),
  dryness: t("Sequedad", "Dryness"),
  pain_sex: t("Dolor en el sexo", "Pain with sex"),
};
