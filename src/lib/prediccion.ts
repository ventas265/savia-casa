/** §4 spec premium: próxima regla como rango + nivel de confianza (umbrales = decisión de producto, no clínicos). */
import { predictRange, formatRange } from "./cycle.ts";
import type { Stage } from "./types.ts";

export type Nivel = "baja" | "media" | "alta";

export function nivelConfianza(ciclos: number, de: number, tieneTempOLH = false): Nivel {
  if (ciclos < 3 || de > 4) return "baja";
  if (ciclos >= 6 && de <= 2 && tieneTempOLH) return "alta";
  return "media";
}

export function prediccion(lastStart: string | null, starts: string[], fallback: number, stage: Stage = "cycle", tieneTempOLH = false) {
  const r = predictRange(lastStart, starts, fallback, stage);
  const ciclos = r.n;
  const nivel = nivelConfianza(ciclos, r.sd, tieneTempOLH);
  const rango = r.from && r.to ? formatRange(r.from, r.to) : null;
  const base = `Confianza ${nivel} · basada en ${ciclos} ${ciclos === 1 ? "ciclo" : "ciclos"}`;
  const texto = nivel === "alta" ? base : `${base} · Mejora anotando tu temperatura`;
  return { ...r, nivel, rango, texto };
}
