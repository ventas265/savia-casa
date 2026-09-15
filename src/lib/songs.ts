import type { Phase, Stage } from "@/lib/types";
import { todayISO } from "@/lib/cycle";

export type Song = { artist: string; title: string; why: string };

const menstrual: Song[] = [
  { artist: "Mon Laferte", title: "Tu falta de querer", why: "Para el día que duele el cuerpo y un poco el pecho." },
  { artist: "Natalia Lafourcade", title: "Hasta la raíz", why: "Lenta, de casa, sin pedirte que sonrías." },
  { artist: "Lila Downs", title: "La Llorona", why: "Si quieres llorar, que sea con alguien que ya lo hizo." },
];

const follicular: Song[] = [
  { artist: "Carla Morrison", title: "Eres tú", why: "Cuando el ánimo vuelve y da miedo creerlo." },
  { artist: "Rosalía", title: "Beso", why: "Corta, viva, para salir aunque sea al mercado." },
  { artist: "Shakira", title: "Las de la intuición", why: "Para acordarte de que sabes más de lo que te dejaron creer." },
];

const ovulatory: Song[] = [
  { artist: "Bad Bunny", title: "La Noche de Anoche", why: "Deseo sin disculpa. Tú decides si la pones en voz alta." },
  { artist: "Shakira", title: "Hips Don't Lie", why: "Si el cuerpo pide moverse, no lo negocies con la cabeza." },
  { artist: "Julieta Venegas", title: "Me voy", why: "O la pones para irte, o para quedarte más dueña." },
];

const luteal: Song[] = [
  { artist: "Natalia Lafourcade", title: "Nunca es suficiente", why: "Cuando todo pica y nada alcanza." },
  { artist: "Mon Laferte", title: "Amárrame", why: "Rabia dulce. Mejor en la cocina que en el chat." },
  { artist: "Julieta Venegas", title: "Andar conmigo", why: "Compañía quieta, no un discurso." },
];

const peri: Song[] = [
  { artist: "Selena", title: "Como la flor", why: "El cuerpo cambia y sigue siendo tuyo." },
  { artist: "Chavela Vargas", title: "Paloma negra", why: "Para la noche que no pega el ojo." },
  { artist: "Mercedes Sosa", title: "Gracias a la vida", why: "Cuando estás harta y aún así sigues aquí." },
];

const pregnancy: Song[] = [
  { artist: "Natalia Lafourcade", title: "Soledad y el mar", why: "Lenta, para el estómago y el miedo." },
  { artist: "Violeta Parra", title: "Volver a los 17", why: "El cuerpo hace a alguien. Tú también estás naciendo." },
];

const postpartum: Song[] = [
  { artist: "Silvio Rodríguez", title: "Ojalá", why: "Cinco minutos solo para ti, aunque el bebé llore después." },
  { artist: "Natalia Lafourcade", title: "Mi tierra veracruzana", why: "Cuna, no escenario." },
];

const heart: Song[] = [
  { artist: "Shakira", title: "Inevitable", why: "Si se fue, o si te quedaste a medias." },
  { artist: "Mon Laferte", title: "Antes de ti", why: "Para no escribirle a las dos de la mañana." },
  { artist: "Laura Pausini", title: "En cambio no", why: "Cuando la cabeza ya sabe y el pecho no." },
];

function pool(stage: Stage, phase: Phase): Song[] {
  if (stage === "peri" || stage === "meno") return peri;
  if (stage === "pregnancy") return pregnancy;
  if (stage === "postpartum") return postpartum;
  if (phase === "menstrual") return menstrual;
  if (phase === "follicular") return follicular;
  if (phase === "ovulatory") return ovulatory;
  if (phase === "luteal") return luteal;
  return follicular;
}

export function songToday(stage: Stage, phase: Phase, day = todayISO()): Song {
  const list = pool(stage, phase);
  const n = [...day].reduce((a, c) => a + c.charCodeAt(0), 0);
  return list[n % list.length]!;
}

export function songListenUrl(s: Song) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${s.artist} ${s.title}`)}`;
}
