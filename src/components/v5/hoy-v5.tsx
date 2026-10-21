import { Link } from "@tanstack/react-router";
import { ArrowRight, Baby, BookOpen, DropHalf, Lock, ShieldCheck } from "@phosphor-icons/react";
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
    { k: "Regla", n: periodLength, c: "linear-gradient(90deg,#7A2133,#B03A4E)", d: "#8E2C3E" },
    { k: "Folicular", n: fStart - periodLength - 1, c: "linear-gradient(90deg,#5E8C7D,#3F6B5E)", d: "#3F6B5E" },
    { k: "Fértil", n: fEnd - fStart + 1, c: "linear-gradient(90deg,#E07A6B,#C9566A)", d: "#E07A6B" },
    { k: "Lútea", n: len - fEnd, c: "linear-gradient(90deg,#B07A3C,#6E3B5C)", d: "#B07A3C" },
  ];
  const pos = Math.min(100, Math.max(0, ((day - 0.5) / len) * 100));
  return (
    <div className="mt-6" aria-label={`Día ${day} de ${len}`}>
      <div className="relative">
        <div className="flex h-3.5 gap-[3px] overflow-hidden rounded-full bg-white/30 p-[2px]">
          {segs.map((s) => <span key={s.k} className="rounded-full" style={{ flex: Math.max(1, s.n), background: s.c }} />)}
        </div>
        <span className="absolute -top-[5px] size-6 -translate-x-1/2 rounded-full border-[3px] border-white bg-[#2A1E1A] shadow-[0_4px_10px_rgb(0_0_0/.3)]" style={{ left: `${pos}%` }} aria-hidden />
      </div>
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-[12px] font-medium">
        {segs.map((s) => (
          <span key={s.k} className="flex items-center gap-1.5"><span className="size-2.5 rounded-full ring-2 ring-white/70" style={{ background: s.d }} />{s.k}</span>
        ))}
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

      <section className="v6-hero mt-5">
        <p className="v5-kicker">Tu ciclo hoy</p>
        <p className="v5-num mt-1">Día {day}</p>
        <div className="mt-3 [&>span]:!bg-white [&>span]:!text-[#8E2C3E]">{chip}</div>
        <CycleBar day={day} len={pr.len} periodLength={p.periodLength} />
      </section>

      <section className="v5-card v6-t-rosa mt-5 flex gap-3">
        <span className="v6-badge v6-b-rosa"><DropHalf size={22} weight="light" /></span>
        <div>
        <p className="v5-kicker">Próxima regla</p>
        <p className="v5-h2 mt-1">{pr.rango ?? "Anota tu regla para estimarla"}</p>
        <p className="mt-2 text-[14px] v5-muted">{pr.texto}</p>
        </div>
      </section>

      {p.intention === "avoid" || p.intention === "track" ? (
        <section className="v5-card v6-t-salvia mt-4">
          <div className="flex items-center gap-3">
            <span className="v6-badge v6-b-salvia"><ShieldCheck size={22} weight="light" aria-hidden /></span>
            <p className="text-[16px] font-semibold">Protección hoy</p>
          </div>
          <p className="mt-2 text-[15px] leading-relaxed">
            Si tienes sexo hoy sin condón, hay riesgo de embarazo. Savia no es un anticonceptivo.
          </p>
          <Link to="/app/proteccion" className="mt-3 inline-flex min-h-11 items-center gap-1 text-[15px] font-semibold text-[#2F5649]">
            Qué opciones tengo <ArrowRight size={16} weight="light" />
          </Link>
        </section>
      ) : null}

      <Link to="/app/guia" className="v5-card v6-t-ambar mt-4 flex gap-3">
        <span className="v6-badge v6-b-ambar"><BookOpen size={22} weight="light" /></span>
        <div>
        <p className="v5-kicker">Para tu fase</p>
        <p className="v5-h2 mt-1">{art.t}</p>
        <p className="mt-1 text-[14px] v5-muted">{art.d}</p>
        </div>
      </Link>

      <button type="button" onClick={onPremium} data-premium="embarazo" className="v6-grad-serena mt-4 flex w-full items-center justify-between rounded-[20px] p-5 text-left">
        <span className="flex items-center gap-3"><span className="v6-badge v6-b-blanco"><Baby size={22} weight="light" aria-hidden /></span><span><span className="block text-[16px] font-semibold">Modo embarazo</span><span className="text-[13px] text-white/85">Semana a semana, con fuentes</span></span></span>
        <span className="flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-[12px] font-semibold"><Lock size={14} weight="light" />Serena</span>
      </button>

      <DisclaimerV5 />

      <div className="fixed inset-x-0 bottom-[84px] z-40 mx-auto max-w-[480px] px-5">
        <button type="button" onClick={onLog} className="h-[52px] w-full rounded-[14px] bg-[linear-gradient(135deg,#8E2C3E,#C9566A)] text-[16px] font-semibold text-white shadow-[0_12px_28px_-12px_rgb(142_44_62/.7)]">Anotar mi día</button>
      </div>
    </div>
  );
}
