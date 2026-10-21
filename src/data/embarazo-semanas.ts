/**
 * Modo embarazo — contenido semana a semana (4–40).
 * `bebe` traducido de ACOG FAQ156 «How Your Fetus Grows During Pregnancy» (bloques de 4 semanas, revisado mar-2026).
 * `tamano`: null a propósito — no se inventan medidas; completar copiando de NHS/Mayo Clinic tras revisión médica.
 * REVISIÓN POR PROFESIONAL DE SALUD PENDIENTE antes de publicar.
 */
export const ACOG = "https://www.acog.org/womens-health/faqs/how-your-fetus-grows-during-pregnancy";
export const NHS = "https://www.nhs.uk/pregnancy/week-by-week/";
export const MAYO = "https://www.mayoclinic.org/healthy-lifestyle/pregnancy-week-by-week/in-depth/prenatal-care/art-20045302";

export type Semana = { semana: number; tamano: string | null; cuerpo: string; bebe: string[]; controles: string; fuente_url: string };

const BLOQUES: { hasta: number; bebe: string[] }[] = [
  { hasta: 8, bebe: ["Empiezan a formarse el cerebro y la columna.", "Se desarrolla el tejido del corazón.", "Se forman los músculos de ojos, nariz y boca.", "Los pulmones empiezan a formar sus tubos.", "Comienza a desarrollarse el oído interno."] },
  { hasta: 12, bebe: ["Se forma el cartílago de brazos, manos y pies.", "Se forman los párpados (siguen cerrados).", "Empiezan a formarse los genitales y el hígado.", "Los riñones empiezan a producir orina; el páncreas, insulina.", "Se forman las uñas de las manos."] },
  { hasta: 16, bebe: ["Los huesos se endurecen, sobre todo los largos.", "La piel es fina y transparente.", "Se forman las uñas de los pies.", "Empieza a desarrollarse la audición."] },
  { hasta: 20, bebe: ["Se completa la parte del cerebro que controla el movimiento.", "El sistema digestivo funciona.", "Orejas, nariz y labios se reconocen en la ecografía.", "Aparece el lanugo, un vello suave."] },
  { hasta: 24, bebe: ["Las patadas y giros son más fuertes.", "Se desarrolla el reflejo de succión.", "Se forma grasa bajo la piel.", "Aparecen las crestas de las huellas dactilares."] },
  { hasta: 28, bebe: ["Los pulmones están formados pero aún no listos para funcionar fuera.", "Puede reaccionar a ruidos fuertes con un sobresalto.", "Los párpados se abren y cierran.", "Los pulmones empiezan a producir surfactante."] },
  { hasta: 32, bebe: ["Se estira, patea y hace movimientos de agarre.", "Los ojos perciben cambios de luz.", "La médula ósea produce glóbulos rojos.", "El lanugo empieza a desaparecer."] },
  { hasta: 36, bebe: ["Los huesos se endurecen; el cráneo sigue blando y flexible.", "Las uñas llegan a la punta de los dedos.", "Puede colocarse cabeza abajo para el parto."] },
  { hasta: 40, bebe: ["Se completan el sistema circulatorio y el musculoesquelético.", "Pulmones, cerebro y sistema nervioso terminan de madurar.", "Sigue acumulando grasa para mantener el calor al nacer."] },
];

const trimestre = (s: number) => (s <= 13 ? 1 : s <= 27 ? 2 : 3);
const CUERPO = {
  1: "Primer trimestre (hasta la semana 13 + 6 días): es cuando se forman los órganos principales. Náuseas, cansancio y pecho sensible son frecuentes.",
  2: "Segundo trimestre (semanas 14 a 27 + 6 días): etapa de crecimiento rápido. El útero se expande para dar espacio.",
  3: "Tercer trimestre (semanas 28 a 40 + 6 días): aumenta el peso del bebé y maduran sus órganos para funcionar al nacer.",
} as const;

export const SEMANAS: Semana[] = Array.from({ length: 37 }, (_, i) => {
  const semana = i + 4;
  const b = BLOQUES.find((x) => semana <= x.hasta)!;
  return {
    semana,
    tamano: null,
    cuerpo: CUERPO[trimestre(semana)],
    bebe: b.bebe,
    controles: "Pregunta a tu profesional qué controles y pruebas tocan en esta etapa.",
    fuente_url: ACOG,
  };
});

export const ALARMAS = [
  "Sangrado vaginal",
  "Dolor abdominal intenso",
  "Pérdida de líquido por la vagina",
  "Dolor de cabeza fuerte, visión borrosa o hinchazón repentina",
  "Fiebre alta",
  "Notas que el bebé se mueve menos de lo habitual (a partir del segundo trimestre)",
];

/** Regla de Naegele: FPP = FUM + 280 días. */
export function fechaProbableParto(fum: string) {
  const d = new Date(`${fum}T12:00:00`);
  d.setDate(d.getDate() + 280);
  return d.toISOString().slice(0, 10);
}
