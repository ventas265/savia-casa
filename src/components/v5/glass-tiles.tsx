import { Baby, CalendarBlank, ChartLine, ChatCircle, GearSix, ShieldCheck, Stethoscope, type Icon } from "@phosphor-icons/react";

type T = { k: string; label: string; to: string; I: Icon };
export const TILES: T[] = [
  { k: "sintomas", label: "Revisar síntomas", to: "/app/hoy?anotar=1", I: Stethoscope },
  { k: "proteccion", label: "Sexo y protección", to: "/app/proteccion", I: ShieldCheck },
  { k: "embarazo", label: "Embarazo", to: "/app/embarazo", I: Baby },
  { k: "calendario", label: "Calendario", to: "/app/calendario", I: CalendarBlank },
  { k: "patrones", label: "Patrones", to: "/app/patrones", I: ChartLine },
  { k: "ia", label: "Savia IA", to: "/app/preguntar", I: ChatCircle },
  { k: "ajustes", label: "Ajustes", to: "/app/tu", I: GearSix },
];

/** Baldosas cuadradas de vidrio con icono lineal + texto: patrón de navegación v7. */
export function GlassTiles({ title = "Elegido para ti", exclude = [], onTile }: { title?: string; exclude?: string[]; onTile?: (k: string) => boolean | void }) {
  return (
    <section className="glass mt-5 rounded-[24px] p-4">
      <p className="mb-3 text-[16px] font-semibold">{title}</p>
      <div className="grid grid-cols-3 gap-3">
        {TILES.filter((t) => !exclude.includes(t.k)).map(({ k, label, to, I }) => (
          <a key={k} href={to} className="v7-tile glass" onClick={(e) => { if (onTile?.(k)) e.preventDefault(); }}>
            <span className="ic"><I size={22} weight="light" color="#2A1E1A" aria-hidden /></span>
            {label}
          </a>
        ))}
      </div>
    </section>
  );
}
