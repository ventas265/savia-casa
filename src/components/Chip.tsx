import type { ReactNode } from "react";
import { SymptomIcon } from "@/components/icons/SymptomIcon";

/** Chip 44px, radio 999, icono + texto. Seleccionado = granada-suave + borde granada + icono fill. */
export function Chip({ id, label, selected, onClick, icon }: { id?: string; label: ReactNode; selected?: boolean; onClick?: () => void; icon?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className="inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-[14px] font-medium transition-colors"
      style={{
        background: selected ? "var(--granada-suave)" : "var(--superficie)",
        borderColor: selected ? "var(--granada)" : "var(--linea)",
        color: "var(--cacao)",
      }}
    >
      {id && icon !== false ? <SymptomIcon id={id} selected={selected} size={20} /> : null}
      {label}
    </button>
  );
}

export function StatusChip({ children, tone = "fertil" }: { children: ReactNode; tone?: "fertil" | "granada" | "lutea" }) {
  const map = { fertil: ["var(--fertil-suave)", "var(--fertil)"], granada: ["var(--granada-suave)", "var(--granada)"], lutea: ["#F4EADD", "#7A5226"] } as const;
  const [bg, fg] = map[tone];
  return <span className="inline-flex h-8 items-center rounded-full px-3 text-[13px] font-semibold" style={{ background: bg, color: fg }}>{children}</span>;
}
