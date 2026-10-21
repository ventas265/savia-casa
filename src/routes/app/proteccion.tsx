import { createFileRoute } from "@tanstack/react-router";
import { Pill, Question, ShieldCheck, Stethoscope, Warning, type Icon } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { GlassTiles } from "@/components/v5/glass-tiles";
import { DisclaimerV5 } from "@/components/v5/disclaimer-v5";

export const Route = createFileRoute("/app/proteccion")({ component: Proteccion });

const CDC = "https://www.cdc.gov/contraception/about/index.html";
const WHO_FP = "https://www.who.int/news-room/fact-sheets/detail/family-planning-contraception";
const WHO_EC = "https://www.who.int/news-room/fact-sheets/detail/emergency-contraception";
const PP_EC = "https://www.plannedparenthood.org/learn/morning-after-pill-emergency-contraception";
const PP_CONDOM = "https://www.plannedparenthood.org/learn/birth-control/condom";
const CDC_STI = "https://www.cdc.gov/sti/testing/index.html";
const WHO_STI = "https://www.who.int/news-room/fact-sheets/detail/sexually-transmitted-infections-(stis)";

/** Uso típico: tabla de eficacia CDC (embarazos en el primer año de uso típico). */
const METODOS: [string, string][] = [
  ["Implante", "0,1 %"], ["DIU hormonal", "0,1–0,4 %"], ["DIU de cobre", "0,8 %"], ["Inyección", "4 %"],
  ["Píldora, parche o anillo", "7 %"], ["Condón externo", "13 %"], ["Marcha atrás", "20 %"], ["Métodos basados en el calendario", "2–23 %"],
];

function Src({ items }: { items: [string, string][] }) {
  return (
    <p className="v5-src mt-3">
      Fuente:{" "}
      {items.map(([l, u], i) => (
        <span key={u}>{i ? " · " : ""}<a href={u} target="_blank" rel="noreferrer">{l}</a></span>
      ))}
    </p>
  );
}

const T = { "01": ["salvia", ShieldCheck], "02": ["rosa", ShieldCheck], "03": ["ciruela", Pill], "04": ["ambar", Stethoscope], "05": ["rosa", Question] } as Record<string, [string, Icon]>;

function Sec({ id, n, title, children }: { id?: string; n: string; title: string; children: ReactNode }) {
  const [tone, I] = T[n] ?? ["rosa", ShieldCheck];
  return (
    <section id={id} className={`v5-card v6-t-${tone} mt-4 scroll-mt-24`}>
      <div className="flex items-center gap-3"><span className={`v6-badge v6-b-${tone}`}><I size={22} weight="light" aria-hidden /></span><p className="v5-kicker">{n}</p></div>
      <h2 className="v5-h2 mt-1">{title}</h2>
      <div className="mt-3 space-y-2 text-[15px] leading-relaxed">{children}</div>
    </section>
  );
}

function Proteccion() {
  return (
    <div className="v5 pb-28 pt-2">
      <div className="v6-hero"><h1 className="v5-h1">Sexo y protección</h1>
      <p className="mt-2 text-[15px] v5-muted">Información de salud pública, clara y sin rodeos. Gratis, siempre.</p></div>

      <div className="sticky top-0 z-10 mt-4 flex gap-2 rounded-[14px] border px-4 py-3 text-[14px] font-semibold" style={{ background: "var(--granada-suave)", borderColor: "var(--granada)", color: "var(--granada)" }} role="note">
        <Warning size={18} weight="light" className="mt-0.5 shrink-0" aria-hidden />
        El calendario de Savia no evita embarazos. Usa un método anticonceptivo.
      </div>

      <Sec n="01" title="Métodos y eficacia">
        <p>Porcentaje de personas que quedan embarazadas durante el primer año con <b>uso típico</b> (como se usa en la vida real). Con uso perfecto, las cifras de píldora y condón bajan mucho.</p>
        <table className="mt-2 w-full text-[14px]">
          <tbody>
            {METODOS.map(([m, v]) => (
              <tr key={m} className="border-b border-[var(--linea)] last:border-0"><td className="py-2.5">{m}</td><td className="py-2.5 text-right font-semibold">{v}</td></tr>
            ))}
          </tbody>
        </table>
        <p>Solo el condón protege también de las infecciones de transmisión sexual.</p>
        <Src items={[["CDC · Contraception", CDC], ["OMS · Planificación familiar", WHO_FP]]} />
      </Sec>

      <Sec n="02" title="Condón: bien usado">
        <p>Revisa la fecha de caducidad y que el envoltorio no esté dañado. Póntelo antes de cualquier contacto genital, deja espacio en la punta y usa lubricante a base de agua o silicona (los aceites dañan el látex). Uno nuevo cada vez.</p>
        <p><b>Si se rompe o se sale:</b> considera la anticoncepción de emergencia lo antes posible y una prueba de ITS si no conoces el estado de tu pareja.</p>
        <Src items={[["Planned Parenthood · Condoms", PP_CONDOM]]} />
      </Sec>

      <Sec id="emergencia" n="03" title="Anticoncepción de emergencia">
        <p><b>DIU de cobre:</b> el método de emergencia más eficaz si se coloca dentro de los 5 días posteriores.</p>
        <p><b>Píldora de ulipristal:</b> hasta 5 días (120 h) después.</p>
        <p><b>Píldora de levonorgestrel:</b> idealmente en las primeras 72 h; cuanto antes, más eficaz.</p>
        <p>No es un aborto y no afecta un embarazo ya establecido. Se consigue en farmacias (en muchos países sin receta), centros de salud y servicios de planificación familiar.</p>
        <Src items={[["OMS · Emergency contraception", WHO_EC], ["Planned Parenthood · Morning-after pill", PP_EC]]} />
      </Sec>

      <Sec n="04" title="Infecciones de transmisión sexual">
        <p>Las más comunes: clamidia, gonorrea, sífilis, tricomoniasis, VPH, herpes y VIH. Muchas no dan síntomas.</p>
        <p>Consulta si notas flujo diferente, ardor al orinar, llagas, verrugas o dolor pélvico.</p>
        <p><b>Pruebas:</b> el CDC recomienda la prueba de VIH al menos una vez entre los 13 y 64 años, y clamidia y gonorrea cada año si tienes vida sexual activa y menos de 25 años, o más si cambias de pareja.</p>
        <Src items={[["CDC · STI testing", CDC_STI], ["OMS · ITS", WHO_STI]]} />
      </Sec>

      <Sec n="05" title="¿Puedo quedar embarazada si…?">
        <p><b>…estoy con la regla?</b> Sí, es menos probable pero posible: los espermatozoides pueden vivir hasta 5 días.</p>
        <p><b>…usamos marcha atrás?</b> Sí. Con uso típico, 1 de cada 5 personas queda embarazada en un año.</p>
        <p><b>…Savia dice «fertilidad baja»?</b> Sí. Es una estimación, no una protección.</p>
        <p><b>…es la primera vez?</b> Sí.</p>
        <Src items={[["CDC · Contraception", CDC], ["Planned Parenthood", PP_EC]]} />
      </Sec>

      <GlassTiles title="Explorar" exclude={["proteccion"]} />
      <DisclaimerV5 />
    </div>
  );
}
