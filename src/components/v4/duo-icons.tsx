/**
 * Duotone symptom icons from redesign-v2/iconos-svg (static, first-party SVG paths).
 * Fill = category tint (ánimo orquídea, cuerpo durazno), stroke = cacao.
 */
import type { CSSProperties } from "react";

const PATHS: Record<string, string> = {
 "acne": "<circle cx=\"12\" cy=\"12\" r=\"8.5\" fill=\"var(--duo-fill)\"/><circle cx=\"9\" cy=\"9.5\" r=\"1.05\" fill=\"#34472F\" stroke=\"none\"/><circle cx=\"15\" cy=\"10.5\" r=\"1.05\" fill=\"#34472F\" stroke=\"none\"/><circle cx=\"11.5\" cy=\"15\" r=\"1.05\" fill=\"#34472F\" stroke=\"none\"/><circle cx=\"14.6\" cy=\"14.2\" r=\"1.05\" fill=\"#34472F\" stroke=\"none\"/>",
 "ansiedad": "<circle cx=\"12\" cy=\"12\" r=\"8.5\" fill=\"var(--duo-fill)\"/><path d=\"M7.2 12.8c1.2-3.6 3-.9 2.6.9-.5 2.1 2.6 1.4 2.5-1.5-.1-2.4 2.5-2.2 2.6.6.1 2 1.6 1.6 1.9.1\" fill=\"none\"/>",
 "antojos": "<path d=\"M19.8 12.6A8 8 0 1 1 11.4 4a2.6 2.6 0 0 0 3.4 3.4 2.6 2.6 0 0 0 5 5.2z\" fill=\"var(--duo-fill)\"/><circle cx=\"8.5\" cy=\"11\" r=\"1.05\" fill=\"#34472F\" stroke=\"none\"/><circle cx=\"12\" cy=\"15.5\" r=\"1.05\" fill=\"#34472F\" stroke=\"none\"/><circle cx=\"15.5\" cy=\"13.5\" r=\"1.05\" fill=\"#34472F\" stroke=\"none\"/>",
 "cabeza": "<path d=\"M8.2 20.5v-3.1a6.6 6.6 0 1 1 9.9-5.9l1.5 2.9h-1.9V17a1.8 1.8 0 0 1-1.8 1.8h-1.6v1.7\" fill=\"var(--duo-fill)\"/><path d=\"M9.4 10.6l1.4 1.1 1.2-1.7 1.4 1.4\" fill=\"none\"/><path d=\"M4 5.2l1.4 1M12 2.6v1.7M19.8 5.2l-1.4 1\" fill=\"none\"/>",
 "cansancio": "<rect x=\"3\" y=\"8\" width=\"16\" height=\"8\" rx=\"2.5\" fill=\"var(--duo-fill)\"/><path d=\"M21.5 11v2\" fill=\"none\"/><path d=\"M6 11v2\" fill=\"none\"/>",
 "colicos": "<path d=\"M7.4 9.6c0-1.5 2-2.3 4.6-2.3s4.6.8 4.6 2.3c0 3.7-1.9 6.6-4.6 6.6S7.4 13.3 7.4 9.6z\" fill=\"var(--duo-fill)\"/><path d=\"M7.6 9C6.4 7.3 5 6.6 3.4 7.2M16.4 9c1.2-1.7 2.6-2.4 4.2-1.8\" fill=\"none\"/><path d=\"M12 16.2v3.6\" fill=\"none\"/><path d=\"M9.8 11l1.1 1 1.1-1 1.1 1 1.1-1\" fill=\"none\"/>",
 "energia": "<path d=\"M13.2 2.8 5.5 13.4h6l-.9 7.8 7.9-10.8h-6.1z\" fill=\"var(--duo-fill)\"/>",
 "espalda": "<rect x=\"9\" y=\"3\" width=\"6\" height=\"3.6\" rx=\"1.4\" fill=\"var(--duo-fill)\"/><rect x=\"8.6\" y=\"8.2\" width=\"6.8\" height=\"3.6\" rx=\"1.4\" fill=\"var(--duo-fill)\"/><rect x=\"8.6\" y=\"13.4\" width=\"6.8\" height=\"3.6\" rx=\"1.4\" fill=\"var(--duo-fill)\"/><path d=\"M11 18.6l1 2 1-2\" fill=\"none\"/>",
 "feliz": "<circle cx=\"12\" cy=\"12\" r=\"8.5\" fill=\"var(--duo-fill)\"/><circle cx=\"9\" cy=\"10\" r=\"1.05\" fill=\"#34472F\" stroke=\"none\"/><circle cx=\"15\" cy=\"10\" r=\"1.05\" fill=\"#34472F\" stroke=\"none\"/><path d=\"M8.5 13.8c1.9 2.3 5.1 2.3 7 0\" fill=\"none\"/>",
 "flujo": "<path d=\"M12 3.2c2.9 3.8 5.8 7.3 5.8 10.6a5.8 5.8 0 0 1-11.6 0c0-3.3 2.9-6.8 5.8-10.6z\" fill=\"var(--duo-fill)\"/><path d=\"M9.2 14.6c.9.7 1.9.7 2.8 0s1.9-.7 2.8 0\" fill=\"none\"/>",
 "hinchazon": "<circle cx=\"12\" cy=\"12\" r=\"5.5\" fill=\"var(--duo-fill)\"/><path d=\"M2.8 12h2.4M4 10.6 2.6 12 4 13.4M21.2 12h-2.4M20 10.6l1.4 1.4-1.4 1.4\" fill=\"none\"/>",
 "insomnio": "<path d=\"M17 16.2A7.2 7.2 0 1 1 9.4 5.3a5.6 5.6 0 0 0 7.6 10.9z\" fill=\"var(--duo-fill)\"/><path d=\"M13.6 6.8c1.3-1.5 4.1-1.5 5.4 0-1.3 1.5-4.1 1.5-5.4 0z\" fill=\"none\"/><circle cx=\"16.3\" cy=\"6.8\" r=\"1.05\" fill=\"#34472F\" stroke=\"none\"/>",
 "irritable": "<circle cx=\"12\" cy=\"12\" r=\"8.5\" fill=\"var(--duo-fill)\"/><path d=\"M7.6 8.6l2.8 1.2M16.4 8.6l-2.8 1.2\" fill=\"none\"/><circle cx=\"9.4\" cy=\"11.6\" r=\"1.05\" fill=\"#34472F\" stroke=\"none\"/><circle cx=\"14.6\" cy=\"11.6\" r=\"1.05\" fill=\"#34472F\" stroke=\"none\"/><path d=\"M9 16h6\" fill=\"none\"/>",
 "libido": "<path d=\"M12 21a6 6 0 0 0 6-6c0-4-3-6-4.2-10.2C12.3 6.8 11.8 8.4 11.8 10c-1-.9-1.6-2-1.6-3.4C7.8 8.6 6 11.6 6 15a6 6 0 0 0 6 6z\" fill=\"var(--duo-fill)\"/>",
 "nauseas": "<circle cx=\"12\" cy=\"12\" r=\"8.5\" fill=\"var(--duo-fill)\"/><path d=\"M8.5 10h1.6M13.9 10h1.6\" fill=\"none\"/><path d=\"M8 15c1.1-.9 2.2-.9 3.3 0s2.2.9 3.3 0 1.4-.6 1.4-.6\" fill=\"none\"/>",
 "protegido": "<path d=\"M12 3l7 2.8v5.3c0 4.4-3 8-7 9.9-4-1.9-7-5.5-7-9.9V5.8z\" fill=\"var(--duo-fill)\"/><path d=\"M12 15.6s-3.1-1.8-3.1-4.1a1.6 1.6 0 0 1 3.1-.8 1.6 1.6 0 0 1 3.1.8c0 2.3-3.1 4.1-3.1 4.1z\" fill=\"none\"/>",
 "regla": "<path d=\"M10.5 3.5c2.7 3.5 5.4 6.8 5.4 9.8a5.4 5.4 0 0 1-10.8 0c0-3 2.7-6.3 5.4-9.8z\" fill=\"var(--duo-fill)\"/><path d=\"M18.5 5.5c1 1.3 1.6 2.3 1.6 3a1.6 1.6 0 0 1-3.2 0c0-.7.6-1.7 1.6-3z\" fill=\"none\"/>",
 "senos": "<path d=\"M3.5 9.5c.3 4.3 2.7 7.5 5.6 7.5 1.8 0 2.9-1.2 2.9-3\" fill=\"var(--duo-fill)\"/><path d=\"M20.5 9.5c-.3 4.3-2.7 7.5-5.6 7.5-1.8 0-2.9-1.2-2.9-3\" fill=\"var(--duo-fill)\"/><circle cx=\"8.6\" cy=\"13.4\" r=\"1.05\" fill=\"#34472F\" stroke=\"none\"/><circle cx=\"15.4\" cy=\"13.4\" r=\"1.05\" fill=\"#34472F\" stroke=\"none\"/><path d=\"M7 5.5l.9 1.4M12 4.5v1.7M17 5.5l-.9 1.4\" fill=\"none\"/>",
 "sinproteccion": "<path d=\"M11 19.5S3.8 15.3 3.8 9.9A3.9 3.9 0 0 1 11 7.6a3.9 3.9 0 0 1 7.2 2.3\" fill=\"var(--duo-fill)\"/><circle cx=\"17.5\" cy=\"17\" r=\"3.2\" fill=\"none\"/><path d=\"M15.8 17h3.4\" fill=\"none\"/>",
 "triste": "<circle cx=\"12\" cy=\"12\" r=\"8.5\" fill=\"var(--duo-fill)\"/><circle cx=\"9\" cy=\"10\" r=\"1.05\" fill=\"#34472F\" stroke=\"none\"/><circle cx=\"14.6\" cy=\"10\" r=\"1.05\" fill=\"#34472F\" stroke=\"none\"/><path d=\"M8.8 16.2c1.8-1.9 4.6-1.9 6.4 0\" fill=\"none\"/><path d=\"M17.3 11.2c.7.9 1 1.5 1 2a1 1 0 0 1-2 0c0-.5.3-1.1 1-2z\" fill=\"none\"/>"
};

/** Stored symptom id → icon name. Ids without a duotone icon fall back to lucide (symptom-meta). */
export const DUO_FOR_SYMPTOM: Record<string, string> = {
  headache: "cabeza",
  fatigue: "cansancio",
  craving: "antojos",
  bloating: "hinchazon",
  cramps: "colicos",
  breast: "senos",
  acne: "acne",
  backache: "espalda",
  nausea: "nauseas",
  insomnia: "insomnio",
  anxiety: "ansiedad",
  irritable: "irritable",
  low_mood: "triste",
  libido_up: "libido",
  libido_down: "libido",
};

export function hasDuo(name: string) {
  return name in PATHS;
}

export function DuoIcon({ name, size = 24, fill = "#FAE6DA", stroke = "#2B2124" }: { name: string; size?: number; fill?: string; stroke?: string }) {
  const inner = PATHS[name];
  if (!inner) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ "--duo-fill": fill } as CSSProperties}
      // Static first-party paths (no user input).
      dangerouslySetInnerHTML={{ __html: inner.replace(/stroke="#34472F"/g, "") }}
    />
  );
}
