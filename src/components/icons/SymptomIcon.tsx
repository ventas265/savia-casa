import {
  ArrowsIn, ArrowsOut, BatteryLow, Brain, CircleDashed, CloudRain, Cookie, DotOutline, Drop, DropHalf, DropSimple,
  Feather, Flame, Flask, Heart, HeartBreak, Heartbeat, Leaf, Lightning, Moon, MoonStars, Person, Pill, ShieldCheck,
  Sparkle, Spiral, Sun, SunHorizon, TestTube, Thermometer, Waveform, Wind, type Icon,
} from "@phosphor-icons/react";

/** Mapa §2 spec premium: iconos lineales Phosphor, peso light, sin fondo. */
export const SYMPTOM_ICONS: Record<string, Icon> = {
  flow_light: Drop, flow_medium: DropHalf, flow_heavy: DropSimple, spotting: DotOutline,
  cramps: Waveform, headache: Brain, fatigue: BatteryLow, bloating: CircleDashed, breast: Heartbeat, acne: Sparkle,
  craving: Cookie, nausea: Spiral, hot_flash: Thermometer, night_sweat: MoonStars, constipation: ArrowsIn,
  diarrhea: ArrowsOut, backache: Person, discharge: Drop, dryness: Sun, pain_sex: HeartBreak,
  calm: Leaf, sensitive: Feather, irritable: Lightning, anxiety: Wind, low_mood: CloudRain, energy: SunHorizon,
  unprotected: Heart, protected: ShieldCheck, emergency: Pill, lh_test: TestTube, preg_test: Flask,
  temp: Thermometer, sleep: Moon, insomnia: Moon, libido_up: Flame, libido_down: Flame,
};

export function SymptomIcon({ id, selected = false, size = 22, color }: { id: string; selected?: boolean; size?: number; color?: string }) {
  const I = SYMPTOM_ICONS[id] ?? DotOutline;
  return <I size={size} weight={selected ? "fill" : "light"} color={color ?? (selected ? "var(--granada)" : "var(--cacao)")} aria-hidden />;
}
