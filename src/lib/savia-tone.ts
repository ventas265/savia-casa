import type { DayMark } from "@/lib/cycle";
import type { Phase } from "@/lib/types";

/** Savia's orb colour follows the fixed phase colours: period pink, fertile lilac, rest sage. */
export type SaviaTone = "menstrual" | "follicular" | "fertile" | "luteal" | "none";

export const TONE_COLORS: Record<SaviaTone, { tint: string; core: string; deep: string; glow: string }> = {
  // Raspberry — period
  menstrual: { tint: "#FFC6DA", core: "#FF4D84", deep: "#9B3CE0", glow: "255 77 132" },
  // Sage — rest of the cycle (follicular)
  follicular: { tint: "#EEF6EA", core: "#A8C5A0", deep: "#5E8C7A", glow: "168 197 160" },
  // Lilac — fertile window / ovulation
  fertile: { tint: "#F1E6FF", core: "#C9A2FF", deep: "#7A4FE0", glow: "201 162 255" },
  // Sage — rest of the cycle (luteal)
  luteal: { tint: "#EEF6EA", core: "#A8C5A0", deep: "#6E7F9E", glow: "168 197 160" },
  // Default Baya pearl
  none: { tint: "#FFC6E0", core: "#F2427E", deep: "#9B5CFF", glow: "242 66 126" },
};

/** Fertile estimate wins over the textbook phase (lilac = more chance). */
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
