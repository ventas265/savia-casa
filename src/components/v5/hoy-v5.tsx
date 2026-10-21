import { Link } from "@tanstack/react-router";
import { ArrowRight, Baby, Lock, ShieldCheck } from "@phosphor-icons/react";
import { StatusChip } from "@/components/Chip";
import { DisclaimerV5 } from "@/components/v5/disclaimer-v5";
import { ovulationDayNum } from "@/lib/cycle";
import { prediccion } from "@/lib/prediccion";
import type { TodaySnapshot } from "@/lib/types";

const fechaHoy = () => {
  const s = new Intl.DateTimeFormat("es", { weekday: "long", day: "numeric", month: "short" }).format(new Date()).replace(",", "").replace(".", "");
  return s.charAt(0).toUpperCase() + s.slice(1);
};

const ARTICULO: Record<string, { t: string; d: string }> = {
  menstrual: { t: "Cólicos: qué es normal y cuándo consultar", d: "Lo que dice la evidencia sobre el dolor menstrual." },
  follicular: { t: "Tu fase folicular, sin mitos", d: "Por qué muchas personas notan más energía estos días." },
  ovulatory: { t: "Ventana fértil: qué significa de verdad", d: "Por qué una estimación no protege de un embarazo." },
  luteal: { t: "Síndrome premenstrual: señales y alivio", d: "Qué ayuda según la evidencia y cuándo pedir ayuda." },
  none: { t: "Conoce tu cuerpo", d: "Guías claras, con fuentes." },
};

/** Barra de ciclo horizontal: regla · folicular · fértil · lútea + marcador «hoy». */
export function CycleBar({ day, len, periodLength }: { day: number; len: number; periodLength: number }) {
  const ov = ovulationDayNum(periodLength, len);
  const fStart = Math.max(periodLength + 1, ov - 5);
  const fEnd = Math.min(len, ov + 1);
  const segs = [
    { k: "Regla", n: periodLength, c: "var(--granada)" },
    { k: "Folicular", n: fStart - periodLength - 1, c: "var(--linea)" },
    { k: "Fértil", n: fEnd - fStart + 1, c: "var(--fertil)" },
    { k: "Lútea", n: len - fEnd, c: "var(--lutea)" },
  ];
  const pos = Math.min(100, Math.max(0, ((day - 0.5) / len) * 100));
  return (
    <div className="mt-6" aria-label={`Día ${day} de ${len}`}>
      <div className="relative">
        <div className="flex h-2.5 gap-[3px] overflow-hidden rounded-full">
          {segs.map((s) => <span key={s.k} style={{ flex: Math.max(1, s.n), background: s.c }} />)}
        </div>
        <span className="absolute -top-1.5 h-[22px] w-[3px] -translate-x-1/2 rounded-full bg-[var(--cacao)]" style={{ left: `${pos}%` }} aria-hidden />
      </div>
      <div className="mt-2 flex text-[12px] v5-muted">
        {segs.map((s) => <span key={s.k} style={{ flex: Math.max(1, s.n) }} className="truncate">{s.k}</span>)}
      </div>
    </div>
  );
}

export function HoyV5({ data, onLog, onPremium }: { data: TodaySnapshot; onLog: () => void; onPremium: () => void }) {
  const p = data.profile;
  const pr = prediccion(p.lastPeriodStart, data.periodStarts, p.cycleLength, p.stage);
  const day = data.cycleDay ?? 1;
  const ov = ovulationDayNum(p.periodLength, pr.len);
  const fertil = day >= ov - 5 && day <= ov + 1;
  const pico = day >= ov - 2 && day <= ov;
  const chip = fertil
    ? <StatusChip tone="fertil">Ventana fértil · probabilidad {pico ? "alta" : "media"}</StatusChip>
    : day <= p.periodLength
      ? <StatusChip tone="granada">Regla · día {day}</StatusChip>
      : <StatusChip tone="lutea">Fertilidad baja estimada</StatusChip>;
  const art = ARTICULO[data.phase] ?? ARTICULO.none!;
  const initial = (p.displayName || "S").charAt(0).toUpperCase();
  return (
    <div className="v5 pb-36 pt-2">
      <header className="flex items-center justify-between">
        <p className="text-[14px] v5-muted">{fechaHoy()}</p>
        <Link to="/app/tu" aria-label="Tu perfil" className="grid size-11 place-items-center rounded-full border border-[var(--linea)] bg-white text-[15px] font-semibold">{initial}</Link>
      </header>

      <section className="mt-6">
        <p className="v5-num">Día {day}</p>
        <div className="mt-3">{chip}</div>
        <CycleBar day={day} len={pr.len} periodLength={p.periodLength} />
      </section>

      <section className="v5-card mt-6">
        <p className="v5-kicker">Próxima regla</p>
        <p className="v5-h2 mt-1">{pr.rango ?? "Anota tu regla para estimarla"}</p>
        <p className="mt-2 text-[14px] v5-muted">{pr.texto}</p>
      </section>

      {p.intention === "avoid" || p.intention === "track" ? (
        <section className="v5-card mt-4">
          <div className="flex items-center gap-2">
            <ShieldCheck size={22} weight="light" aria-hidden />
            <p className="text-[16px] font-semibold">Protección hoy</p>
          </div>
          <p className="mt-2 text-[15px] leading-relaxed">
            Si tienes sexo hoy sin condón, hay riesgo de embarazo. Savia no es un anticonceptivo.
          </p>
          <Link to="/app/proteccion" className="mt-3 inline-flex min-h-11 items-center gap-1 text-[15px] font-semibold text-[var(--granada)]">
            Qué opciones tengo <ArrowRight size={16} weight="light" />
          </Link>
        </section>
      ) : null}

      <Link to="/app/guia" className="v5-card mt-4 block">
        <p className="v5-kicker">Para tu fase</p>
        <p className="v5-h2 mt-1">{art.t}</p>
        <p className="mt-1 text-[14px] v5-muted">{art.d}</p>
      </Link>

      <button type="button" onClick={onPremium} data-premium="embarazo" className="v5-card mt-4 flex w-full items-center justify-between text-left">
        <span className="flex items-center gap-3"><Baby size={22} weight="light" aria-hidden /><span><span className="block text-[16px] font-semibold">Modo embarazo</span><span className="text-[13px] v5-muted">Semana a semana, con fuentes</span></span></span>
        <span className="flex items-center gap-1 text-[12px] font-semibold v5-muted"><Lock size={14} weight="light" />Serena</span>
      </button>

      <DisclaimerV5 />

      <div className="fixed inset-x-0 bottom-[84px] z-40 mx-auto max-w-[480px] px-5">
        <button type="button" onClick={onLog} className="h-[52px] w-full rounded-[14px] bg-[var(--granada)] text-[16px] font-semibold text-white">Anotar mi día</button>
      </div>
    </div>
  );
}
