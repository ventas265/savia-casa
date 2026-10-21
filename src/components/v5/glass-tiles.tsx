import { Baby, CalendarBlank, ChartLine, ChatCircle, GearSix, ShieldCheck, Stethoscope, type Icon } from "@phosphor-icons/react";

type T = { k: string; img: string; label: string; to: string; I: Icon };
export const TILES: T[] = [
  { k: "sintomas", img: "/photos/te.jpg", label: "Revisar síntomas", to: "/app/hoy?anotar=1", I: Stethoscope },
  { k: "proteccion", img: "/photos/manos.jpg", label: "Sexo y protección", to: "/app/proteccion", I: ShieldCheck },
  { k: "embarazo", img: "/v4/serena.webp", label: "Embarazo", to: "/app/embarazo", I: Baby },
  { k: "calendario", img: "/photos/cama.jpg", label: "Calendario", to: "/app/calendario", I: CalendarBlank },
  { k: "patrones", img: "/photos/inicio.jpg", label: "Patrones", to: "/app/patrones", I: ChartLine },
  { k: "ia", img: "/photos/savia-ia.jpg", label: "Savia IA", to: "/app/preguntar", I: ChatCircle },
  { k: "ajustes", img: "/v4/lutea-sm.webp", label: "Ajustes", to: "/app/tu", I: GearSix },
];

/** Baldosas cuadradas de vidrio con icono lineal + texto: patrón de navegación v7. */
export function GlassTiles({ title = "Elegido para ti", exclude = [], onTile }: { title?: string; exclude?: string[]; onTile?: (k: string) => boolean | void }) {
  return (
    <section className="glass mt-5 rounded-[24px] p-4">
      <p className="mb-3 text-[16px] font-semibold">{title}</p>
      <div className="grid grid-cols-3 gap-3">
        {TILES.filter((t) => !exclude.includes(t.k)).map(({ k, label, to, img }) => (
          <a key={k} href={to} className="glass flex flex-col overflow-hidden rounded-[20px] text-[12.5px] font-medium leading-tight" onClick={(e) => { if (onTile?.(k)) e.preventDefault(); }}>
            <img src={img} alt="" loading="lazy" className="m-1.5 mb-0 aspect-[4/3] w-[calc(100%-12px)] rounded-[14px] object-cover saturate-[.9] sepia-[.12] hue-rotate-[-8deg]" />
            <span className="px-2 py-2 text-center">
            {label}</span>
          </a>
        ))}
      </div>
    </section>
  );
}
