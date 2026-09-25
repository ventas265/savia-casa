/** Visual metadata for symptom chips. Keys stay the stored symptom ids. */
export const SYMPTOM_EMOJI: Record<string, string> = {
  cramps: "🌀",
  headache: "🤕",
  bloating: "🎈",
  breast: "👙",
  acne: "🔴",
  anxiety: "😰",
  low_mood: "🌧️",
  irritable: "😤",
  insomnia: "🌙",
  hot_flash: "🔥",
  night_sweat: "💦",
  libido_up: "💗",
  libido_down: "🩶",
  fatigue: "🥱",
  brain_fog: "🌫️",
  nausea: "🤢",
  spotting: "🩸",
  constipation: "🧱",
  craving: "🍫",
  discharge: "💧",
  dryness: "🏜️",
  pain_sex: "⚡",
  diarrhea: "🚽",
  backache: "🦴",
};

export type ChipTone = "rose" | "dust" | "sand" | "sage" | "plum";

/** Circle fill per tone: idle vs selected. */
export const TONE_CLS: Record<ChipTone, { idle: string; on: string; badge: string; icon: string }> = {
  rose: { idle: "bg-primary/10", on: "bg-primary/30", badge: "bg-primary text-primary-fg", icon: "bg-primary/12 text-primary" },
  dust: { idle: "bg-rose-dust-soft", on: "bg-rose-dust", badge: "bg-rose-dust text-ink", icon: "bg-rose-dust-soft text-plum" },
  sand: { idle: "bg-sand/35", on: "bg-sand", badge: "bg-sand text-ink", icon: "bg-sand/40 text-plum" },
  sage: { idle: "bg-sage-soft", on: "bg-sage", badge: "bg-sage-deep text-surface", icon: "bg-sage-soft text-sage-deep" },
  plum: { idle: "bg-plum/8", on: "bg-plum/25", badge: "bg-plum text-surface", icon: "bg-plum/10 text-plum" },
};

/** Frequent symptoms for the Hoy quick check (order matters). */
export const QUICK_SYMPTOMS = ["cramps", "headache", "bloating", "fatigue", "breast", "acne", "low_mood", "craving"];
