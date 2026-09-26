import type { ReactNode } from "react";
import {
  Angry,
  BatteryLow,
  Bone,
  Brain,
  CloudFog,
  CloudRain,
  Cookie,
  Droplet,
  Droplets,
  Flame,
  Heart,
  HeartCrack,
  HeartOff,
  HeartPulse,
  Hourglass,
  MoonStar,
  ScanFace,
  Shirt,
  Sun,
  Timer,
  Waves,
  Wind,
  Zap,
  type LucideIcon,
} from "lucide-react";

/** Thin line icon per stored symptom id (keys stay the stored ids). No emoji. */
export const SYMPTOM_ICON: Record<string, LucideIcon> = {
  cramps: Zap,
  headache: Brain,
  bloating: Wind,
  breast: Shirt,
  acne: ScanFace,
  anxiety: HeartPulse,
  low_mood: CloudRain,
  irritable: Angry,
  insomnia: MoonStar,
  hot_flash: Flame,
  night_sweat: Droplets,
  libido_up: Heart,
  libido_down: HeartOff,
  fatigue: BatteryLow,
  brain_fog: CloudFog,
  nausea: Waves,
  spotting: Droplet,
  constipation: Hourglass,
  craving: Cookie,
  discharge: Droplets,
  dryness: Sun,
  pain_sex: HeartCrack,
  diarrhea: Timer,
  backache: Bone,
};

export function symptomIcon(id: string, className = "size-[22px]"): ReactNode {
  const Icon = SYMPTOM_ICON[id] ?? Droplet;
  return <Icon className={className} strokeWidth={1.5} />;
}

export type ChipTone = "rose" | "dust" | "sand" | "sage" | "plum";

/** v4: soft category tiles; tone tints the tile (ánimo = orquídea, cuerpo = durazno). */
export const TONE_CLS: Record<ChipTone, { idle: string; on: string; badge: string; icon: string }> = {
  rose: { idle: "", on: "", badge: "bg-accent text-white", icon: "bg-regla-50 text-[#7a1f33]" },
  dust: { idle: "", on: "", badge: "bg-accent text-white", icon: "bg-foli-50 text-[#7a3f1e]" },
  sand: { idle: "", on: "", badge: "bg-accent text-white", icon: "bg-lut-50 text-lut-ink" },
  sage: { idle: "", on: "", badge: "bg-accent text-white", icon: "bg-sand text-ink-2" },
  plum: { idle: "", on: "", badge: "bg-accent text-white", icon: "bg-ovu-50 text-ovu-ink" },
};

/** Frequent symptoms for the Hoy quick check (order matters). */
export const QUICK_SYMPTOMS = ["cramps", "headache", "bloating", "fatigue", "breast", "acne", "low_mood", "craving"];
