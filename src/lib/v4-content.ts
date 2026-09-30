/**
 * v4 «Tus cuatro estaciones»: each cycle phase is a season with its own flower photo,
 * a one-line explanation (≤ ~60 letters), two small tips and the «Por qué pasa» copy.
 * Fertile days are always framed as a higher/lower chance ESTIMATE, never contraception.
 */
import type { Phase } from "./types.ts";

type L = { es: string; en: string };
const t = (es: string, en: string): L => ({ es, en });

export type SeasonPhase = Exclude<Phase, "none">;
export const SEASON_ORDER: SeasonPhase[] = ["menstrual", "follicular", "ovulatory", "luteal"];

export type TipIcon = "moon" | "cup" | "drop" | "walk" | "leaf" | "heart" | "sun" | "shield";

export const SEASONS: Record<
  SeasonPhase,
  {
    key: "regla" | "foli" | "ovu" | "lut";
    photo: string;
    thumb: string;
    alt: L;
    short: L;
    label: L;
    season: L;
    seasonOf: L;
    youAreIn: L;
    line: L;
    tips: { icon: TipIcon; text: L }[];
    why: { strong: L; rest: L }[];
    whyTips: { icon: TipIcon; text: L }[];
  }
> = {
  menstrual: {
    key: "regla",
    photo: "/v4/regla.webp",
    thumb: "/v4/regla-sm.webp",
    alt: t("Ranúnculo rojo: tu periodo", "Red ranunculus: your period"),
    short: t("Periodo", "Period"),
    label: t("Tu periodo", "Your period"),
    season: t("Invierno", "Winter"),
    seasonOf: t("Invierno de tu ciclo", "Winter of your cycle"),
    youAreIn: t("Estás en tu invierno", "You’re in your winter"),
    line: t("Tus hormonas están bajas: pide calor y descanso.", "Your hormones are low: ask for warmth and rest."),
    tips: [
      { icon: "cup", text: t("Algo caliente", "Something warm") },
      { icon: "walk", text: t("Camina suave", "Walk gently") },
    ],
    why: [
      { strong: t("Bajan estrógeno y progesterona.", "Estrogen and progesterone drop."), rest: t("El útero suelta su capa y llegan los cólicos.", "The uterus sheds its lining and cramps show up.") },
      { strong: t("Es inflamación, no flojera.", "It’s inflammation, not laziness."), rest: t("El cansancio suele bajar en 2 o 3 días.", "Tiredness usually eases in 2–3 days.") },
    ],
    whyTips: [
      { icon: "cup", text: t("Calor en la panza", "Warmth on your belly") },
      { icon: "leaf", text: t("Hierro y verdura", "Iron and greens") },
    ],
  },
  follicular: {
    key: "foli",
    photo: "/v4/folicular.webp",
    thumb: "/v4/folicular-sm.webp",
    alt: t("Flor de durazno: tu fase folicular", "Peach blossom: your follicular phase"),
    short: t("Folicular", "Follicular"),
    label: t("Fase folicular", "Follicular phase"),
    season: t("Primavera", "Spring"),
    seasonOf: t("Primavera de tu ciclo", "Spring of your cycle"),
    youAreIn: t("Estás en tu primavera", "You’re in your spring"),
    line: t("Tu estrógeno sube: vuelve la energía y la claridad.", "Your estrogen rises: energy and focus come back."),
    tips: [
      { icon: "walk", text: t("Muévete más", "Move more") },
      { icon: "leaf", text: t("Come fresco", "Eat fresh") },
    ],
    why: [
      { strong: t("Sube el estrógeno.", "Estrogen rises."), rest: t("Da energía, buena piel y ganas de empezar cosas.", "It brings energy, good skin and the urge to start things.") },
      { strong: t("El cuerpo prepara un óvulo.", "Your body gets an egg ready."), rest: t("Si tu ciclo varía, esta fase es la que se alarga.", "If your cycle varies, this is the phase that stretches.") },
    ],
    whyTips: [
      { icon: "walk", text: t("Entrena con ganas", "Train with energy") },
      { icon: "leaf", text: t("Fermentados y fruta", "Ferments and fruit") },
    ],
  },
  ovulatory: {
    key: "ovu",
    photo: "/v4/ovulacion.webp",
    thumb: "/v4/ovulacion-sm.webp",
    alt: t("Peonías rosadas: tu ovulación", "Pink peonies: your ovulation"),
    short: t("Ovulación", "Ovulation"),
    label: t("Ovulación", "Ovulation"),
    season: t("Verano", "Summer"),
    seasonOf: t("Verano de tu ciclo", "Summer of your cycle"),
    youAreIn: t("Estás en tu verano", "You’re in your summer"),
    line: t("Estrógeno en su pico: días con más chance de embarazo.", "Estrogen peaks: days with a higher pregnancy chance."),
    tips: [
      { icon: "drop", text: t("Toma agua", "Drink water") },
      { icon: "shield", text: t("Cuídate", "Protect yourself") },
    ],
    why: [
      { strong: t("Pico de estrógeno y luego de LH.", "Estrogen peaks, then LH."), rest: t("Sale el óvulo; a veces hay un pinchazo a un lado.", "The egg is released; sometimes there’s a one-sided twinge.") },
      { strong: t("Es una estimación, no un anticonceptivo.", "It’s an estimate, not birth control."), rest: t("Si no buscas embarazo, usa el método que elijas.", "If you don’t want a pregnancy, use the method you choose.") },
    ],
    whyTips: [
      { icon: "drop", text: t("Agua y fibra", "Water and fiber") },
      { icon: "shield", text: t("Condón u otro método", "Condom or your method") },
    ],
  },
  luteal: {
    key: "lut",
    photo: "/v4/lutea.webp",
    thumb: "/v4/lutea-sm.webp",
    alt: t("Rosa seca: tu fase lútea", "Dried rose: your luteal phase"),
    short: t("Lútea", "Luteal"),
    label: t("Fase lútea", "Luteal phase"),
    season: t("Otoño", "Autumn"),
    seasonOf: t("Otoño de tu ciclo", "Autumn of your cycle"),
    youAreIn: t("Estás en tu otoño", "You’re in your autumn"),
    line: t("Tu progesterona sube: es normal sentirte más cansada.", "Your progesterone rises: feeling more tired is normal."),
    tips: [
      { icon: "moon", text: t("Duerme 8 h", "Sleep 8 h") },
      { icon: "cup", text: t("Menos café", "Less coffee") },
    ],
    why: [
      { strong: t("Sube la progesterona.", "Progesterone rises."), rest: t("Da sueño y sensibilidad.", "It brings sleepiness and sensitivity.") },
      { strong: t("Al final bajan las dos.", "At the end, both drop."), rest: t("Ahí llegan el dolor de cabeza y los antojos.", "That’s when headaches and cravings arrive.") },
    ],
    whyTips: [
      { icon: "moon", text: t("Duerme 8 h", "Sleep 8 h") },
      { icon: "cup", text: t("Menos café y sal", "Less coffee and salt") },
    ],
  },
};

/** Phase for each day of a cycle — same split as cycle.ts phaseForDay. */
export function phaseSegments(len: number, periodLength: number): SeasonPhase[] {
  const ov = Math.max(periodLength + 2, len - 14);
  const out: SeasonPhase[] = [];
  for (let n = 1; n <= len; n++) {
    out.push(n <= periodLength ? "menstrual" : n >= ov - 1 && n <= ov + 1 ? "ovulatory" : n < ov ? "follicular" : "luteal");
  }
  return out;
}

/** «días 1–5» ranges for the four seasons strip. */
export function seasonRanges(len: number, periodLength: number): Record<SeasonPhase, [number, number]> {
  const segs = phaseSegments(len, periodLength);
  const r = {} as Record<SeasonPhase, [number, number]>;
  segs.forEach((p, i) => {
    const n = i + 1;
    if (!r[p]) r[p] = [n, n];
    else r[p][1] = n;
  });
  return r;
}

export const PRICES = { month: "$4.99", year: "$39", yearPerMonth: "$3.25", save: "−35%" } as const;

/** «…te duele la cabeza» phrasing for the Patrones headline (falls back to the symptom label). */
export const SYMPTOM_PHRASE: Record<string, L> = {
  headache: t("te duele la cabeza.", "you get a headache."),
  cramps: t("te dan cólicos.", "you get cramps."),
  backache: t("te duele la espalda.", "your back hurts."),
  bloating: t("te sientes hinchada.", "you feel bloated."),
  breast: t("te duelen los senos.", "your breasts feel tender."),
  acne: t("te salen granitos.", "you break out."),
  anxiety: t("te sientes ansiosa.", "you feel anxious."),
  low_mood: t("te sientes triste.", "you feel low."),
  irritable: t("te sientes irritable.", "you feel irritable."),
  fatigue: t("te sientes cansada.", "you feel tired."),
  craving: t("te dan antojos.", "you get cravings."),
  insomnia: t("te cuesta dormir.", "you sleep badly."),
  nausea: t("te dan náuseas.", "you feel nauseous."),
  libido_up: t("tienes más deseo.", "you feel more desire."),
  libido_down: t("tienes menos deseo.", "you feel less desire."),
};

/** Example shown (labelled «Ejemplo») until her own data can prove a pattern. */
export const EXAMPLE_PATTERN = {
  symptom: "headache",
  days: 2,
  cycles: 3,
  rows: [
    { m: t("Jun", "Jun"), hits: [2] },
    { m: t("Jul", "Jul"), hits: [3, 2] },
    { m: t("Ago", "Aug"), hits: [2] },
  ],
};
