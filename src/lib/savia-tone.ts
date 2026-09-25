import type { DayMark } from "@/lib/cycle";
import type { Phase } from "@/lib/types";

/** Savia's orb colour follows the cycle: one presence, tinted by where she is. */
export type SaviaTone = "menstrual" | "follicular" | "fertile" | "luteal" | "none";

export const TONE_COLORS: Record<SaviaTone, { tint: string; core: string; deep: string; glow: string }> = {
  // Raspberry — period
  menstrual: { tint: "#FFC6DA", core: "#FF4D84", deep: "#9B3CE0", glow: "255 77 132" },
  // Orchid — follicular
  follicular: { tint: "#EED6FF", core: "#B65CFF", deep: "#6A3FE0", glow: "182 92 255" },
  // Aqua — fertile window / ovulation
  fertile: { tint: "#D8FBF6", core: "#6FE0D2", deep: "#3F7FD0", glow: "111 224 210" },
  // Warm amber — luteal
  luteal: { tint: "#FFE6CC", core: "#FFB36B", deep: "#D9487E", glow: "255 179 107" },
  // Default Baya pearl
  none: { tint: "#FFC6E0", core: "#F2427E", deep: "#9B5CFF", glow: "242 66 126" },
};

/** Fertile estimate wins over the textbook phase (aqua = more chance). */
export function toneFor(phase: Phase, mark: DayMark | null, onPeriod = false): SaviaTone {
  if (onPeriod || phase === "menstrual") return "menstrual";
  if (mark === "fertile" || mark === "peak" || phase === "ovulatory") return "fertile";
  if (phase === "follicular") return "follicular";
  if (phase === "luteal") return "luteal";
  return "none";
}

export function toneStyle(tone: SaviaTone): Record<string, string> {
  const c = TONE_COLORS[tone];
  return {
    "--orb-tint": c.tint,
    "--orb-core": c.core,
    "--orb-deep": c.deep,
    "--orb-glow": `rgb(${c.glow} / 0.55)`,
  };
}
