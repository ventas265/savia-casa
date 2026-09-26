/**
 * One short, safe care line per symptom — the symptom popup's tip covers every
 * symptom she marked (Phase 1b), not just the first one.
 */
type L = { es: string; en: string };

const CARE: Record<string, L> = {
  cramps: { es: "Calor en el vientre y movimiento suave alivian los cólicos.", en: "Warmth on the belly and gentle movement ease cramps." },
  backache: { es: "Calor en la zona lumbar y estirar suave ayuda a la espalda.", en: "Heat on the lower back and gentle stretching help." },
  headache: { es: "Agua, pausa de pantallas y comer a tiempo suelen bajar el dolor de cabeza.", en: "Water, a screen break and eating on time often ease a headache." },
  bloating: { es: "Menos sal y bebidas con gas, más agua y caminar un rato.", en: "Less salt and fizzy drinks, more water and a short walk." },
  breast: { es: "Un sostén cómodo y menos cafeína alivian la sensibilidad del pecho.", en: "A comfy bra and less caffeine ease breast tenderness." },
  acne: { es: "Limpieza suave y no tocar los granitos; es hormonal y pasa.", en: "Gentle cleansing and no picking; it’s hormonal and passes." },
  anxiety: { es: "Respira lento 4-6 unos minutos; nombrar lo que sientes ya ayuda.", en: "Breathe slowly 4-6 for a few minutes; naming it helps." },
  low_mood: { es: "Sal a la luz un rato y habla con alguien de confianza.", en: "Get some daylight and talk to someone you trust." },
  irritable: { es: "Date espacio y baja el ritmo; no es exageración, es hormonal.", en: "Give yourself space and slow down; it’s hormonal, not drama." },
  insomnia: { es: "Pantallas fuera una hora antes y cuarto fresco para dormir mejor.", en: "Screens off an hour before and a cool room for better sleep." },
  hot_flash: { es: "Capas de ropa y agua fresca a mano ayudan con los calores.", en: "Layers and cool water at hand help with hot flashes." },
  night_sweat: { es: "Ropa de cama ligera y cuarto fresco.", en: "Light bedding and a cool room." },
  fatigue: { es: "Comida caliente con proteína y dormir cuenta más que rendir.", en: "Warm food with protein; sleep counts more than output." },
  brain_fog: { es: "Una tarea a la vez y pausas cortas; mañana suele aclarar.", en: "One task at a time and short breaks; it usually clears." },
  nausea: { es: "Comidas pequeñas y jengibre; si sigue varios días, consulta.", en: "Small meals and ginger; if it lasts days, get checked." },
  spotting: { es: "Anota cuándo aparece; si se repite fuera de la regla, coméntalo con un médico.", en: "Note when it shows up; if it repeats off-period, mention it to a doctor." },
  constipation: { es: "Agua, fibra y moverte un poco.", en: "Water, fiber and some movement." },
  diarrhea: { es: "Hidrátate bien y comidas simples.", en: "Hydrate well and keep meals simple." },
  craving: { es: "Antojo normal: combina dulce con algo de proteína.", en: "Normal craving: pair sweet with some protein." },
  discharge: { es: "El flujo cambia en el ciclo; si huele fuerte o pica, consulta.", en: "Discharge changes through the cycle; if it smells strong or itches, get checked." },
  dryness: { es: "Un lubricante a base de agua ayuda con la sequedad.", en: "A water-based lubricant helps with dryness." },
  pain_sex: { es: "El dolor en el sexo no es normal de aguantar: coméntalo con un médico.", en: "Pain during sex isn’t something to endure: tell a doctor." },
  libido_up: { es: "Deseo alto es normal; si no buscas embarazo, ten a mano condón u otro método.", en: "High desire is normal; if you don’t want pregnancy, keep a condom or method at hand." },
  libido_down: { es: "Menos deseo también es normal; no tienes que forzarte.", en: "Lower desire is normal too; no need to force it." },
};

export function symptomCare(ids: string[], lang: "es" | "en"): { id: string; text: string }[] {
  const seen = new Set<string>();
  const out: { id: string; text: string }[] = [];
  for (const id of ids) {
    if (seen.has(id)) continue;
    seen.add(id);
    const c = CARE[id];
    out.push({ id, text: c ? c[lang] : lang === "es" ? "Anotado; si te preocupa o dura, consulta." : "Noted; if it worries you or lasts, get checked." });
  }
  return out;
}
