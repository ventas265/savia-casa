import { useState } from "react";
import { Baby, ChartLine, ChatCircle, Thermometer, X } from "@phosphor-icons/react";
import { WHOP_MONTH, WHOP_YEAR } from "@/lib/pay-links";

const BADGE = ["v6-b-rosa", "v6-b-ciruela", "v6-b-salvia", "v6-b-ambar"];
const BENEFICIOS = [
  { I: ChartLine, t: "Informe de patrones completo", d: "Con PDF para tu ginecóloga." },
  { I: Baby, t: "Modo embarazo semana a semana", d: "Con fuentes ACOG, NHS y Mayo Clinic." },
  { I: ChatCircle, t: "Savia IA sin límite", d: "Pregunta lo que necesites, cuando lo necesites." },
  { I: Thermometer, t: "Temperatura y test LH avanzados", d: "Predicciones a 6–12 meses." },
];

/** Paywall Serena: solo se muestra al tocar una función Serena. Sin contadores ni urgencia. */
export function Paywall({ onClose }: { onClose: () => void }) {
  const [plan, setPlan] = useState<"year" | "month">("year");
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-[rgb(42_30_26/0.4)]" role="dialog" aria-modal="true" aria-labelledby="pw-t">
      <div className="v5 max-h-[92dvh] w-full max-w-[480px] overflow-y-auto rounded-t-[28px] px-5 pb-8 pt-4">
        <div className="flex justify-end">
          <button type="button" onClick={onClose} aria-label="Cerrar" className="grid size-11 place-items-center"><X size={22} weight="light" /></button>
        </div>
        <div className="v6-grad-serena -mx-1 rounded-[24px] px-5 py-6">
          <p className="v5-kicker !text-white/80">Savia Serena</p>
          <h2 id="pw-t" className="v5-h1 mt-2">Serena: entiende tu ciclo a fondo</h2>
        </div>
        <ul className="mt-6 space-y-4">
          {BENEFICIOS.map(({ I, t, d }, i) => (
            <li key={t} className="flex gap-3">
              <span className={`v6-badge ${BADGE[i]}`}><I size={22} weight="light" aria-hidden /></span>
              <div><p className="text-[16px] font-semibold">{t}</p><p className="text-[14px] v5-muted">{d}</p></div>
            </li>
          ))}
        </ul>
        <div className="mt-7 grid gap-3" role="radiogroup" aria-label="Plan">
          {([
            ["year", "Anual · $39", "equivale a $3.25/mes"],
            ["month", "Mensual · $4.99", "se renueva cada mes"],
          ] as const).map(([k, t, d]) => (
            <button key={k} type="button" role="radio" aria-checked={plan === k} onClick={() => setPlan(k)}
              className="flex min-h-[64px] items-center justify-between rounded-[14px] border px-4 text-left"
              style={{ borderColor: plan === k ? "var(--granada)" : "var(--linea)", background: plan === k ? "var(--granada-suave)" : "var(--superficie)" }}>
              <span><span className="block text-[16px] font-semibold">{t}</span><span className="text-[13px] v5-muted">{d}</span></span>
              <span className="size-5 rounded-full border" style={{ borderColor: "var(--granada)", borderWidth: plan === k ? 6 : 1 }} aria-hidden />
            </button>
          ))}
        </div>
        <a href={plan === "year" ? WHOP_YEAR : WHOP_MONTH} className="mt-6 flex h-[52px] w-full items-center justify-center rounded-[14px] bg-[linear-gradient(135deg,#6E3B5C,#8E2C3E,#C9566A)] shadow-[0_12px_28px_-12px_rgb(142_44_62/.7)] text-[16px] font-semibold text-white">
          Continuar con Whop
        </a>
        <p className="mt-3 text-center text-[13px] v5-muted">Cancela cuando quieras desde Ajustes, en 2 toques.</p>
      </div>
    </div>
  );
}
