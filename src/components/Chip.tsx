import type { ReactNode } from "react";
import { SymptomIcon } from "@/components/icons/SymptomIcon";

/** Chip 44px, radio 999, icono + texto. Seleccionado = granada-suave + borde granada + icono fill. */
const TONES = {
  rosa: ["#FBEDEF", "#8E2C3E", "#F3D9DE"], salvia: ["#EDF4F1", "#3F6B5E", "#D5E6DF"],
  ambar: ["#FBF2E6", "#B07A3C", "#F1DFC5"], ciruela: ["#F5ECF2", "#6E3B5C", "#E7D3E1"],
} as const;
export type Tone = keyof typeof TONES;

export function Chip({ id, label, selected, onClick, icon, tone = "rosa" }: { id?: string; label: ReactNode; selected?: boolean; onClick?: () => void; icon?: boolean; tone?: Tone }) {
  const [bg, fg, sel] = TONES[tone];
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className="inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-[14px] font-medium transition-colors"
      style={{
        background: selected ? "#FDE3E5" : "rgb(255 255 255 / .6)",
        borderColor: selected ? "#E8505B" : "rgb(255 255 255 / .9)",
        color: "var(--cacao)",
        boxShadow: selected ? `0 6px 16px -10px ${fg}` : undefined,
      }}
    >
      {id && icon !== false ? <SymptomIcon id={id} selected={selected} size={20} color={fg} /> : null}
      {label}
    </button>
  );
}

export function StatusChip({ children, tone = "fertil" }: { children: ReactNode; tone?: "fertil" | "granada" | "lutea" }) {
  const map = { fertil: ["var(--fertil-suave)", "var(--fertil)"], granada: ["var(--granada-suave)", "var(--granada)"], lutea: ["#F4EADD", "#7A5226"] } as const;
  const [bg, fg] = map[tone];
  return <span className="inline-flex h-8 items-center rounded-full px-3 text-[13px] font-semibold" style={{ background: bg, color: fg }}>{children}</span>;
}
