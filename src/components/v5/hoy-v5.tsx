import { Link } from "@tanstack/react-router";
import { ArrowRight, CalendarBlank, Plus, ShieldCheck } from "@phosphor-icons/react";
import { GlassTiles } from "@/components/v5/glass-tiles";
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
    { k: "Regla", n: periodLength, c: "linear-gradient(90deg,#E8505B,#F07A7A)", d: "#E8505B" },
    { k: "Folicular", n: fStart - periodLength - 1, c: "linear-gradient(90deg,#5E8C7D,#3F6B5E)", d: "#3F6B5E" },
    { k: "Fértil", n: fEnd - fStart + 1, c: "linear-gradient(90deg,#F7B8BC,#F59AA0)", d: "#F59AA0" },
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
          <span key={s.k} className="flex items-center gap-1.5"><span className="size-2.5 rounded-full ring-2 ring-white" style={{ background: s.d }} />{s.k}</span>
        ))}
      </div>
    </div>
  );
}

const PARA_TI = [
  { img: "/v4/regla-sm.webp", t: "Cólicos: qué es normal", to: "/app/guia" },
  { img: "/photos/manos.jpg", t: "Sexo y protección", to: "/app/proteccion" },
  { img: "/photos/te.jpg", t: "Alivio premenstrual", to: "/app/guia" },
  { img: "/v4/ovulacion-sm.webp", t: "Ventana fértil, sin mitos", to: "/app/guia" },
];

function WeekStrip() {
  const t = new Date();
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(t); d.setDate(t.getDate() - t.getDay() + i); return d; });
  const W = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
  return (
    <div className="mt-4 flex justify-between" aria-label="Esta semana">
      {days.map((d) => {
        const today = d.toDateString() === t.toDateString();
        return (
          <div key={d.toISOString()} className={`flex w-[44px] flex-col items-center gap-1.5 rounded-full pb-1 pt-2 ${today ? "bg-[var(--coral)] text-white shadow-[0_8px_18px_-8px_rgb(232_80_91/.8)]" : ""}`}>
            <span className={`text-[12px] ${today ? "font-semibold" : "v5-muted"}`}>{W[d.getDay()]}</span>
            <span className={`grid size-9 place-items-center rounded-full text-[15px] font-medium ${today ? "bg-white text-[var(--cacao)]" : "glass"}`}>{d.getDate()}</span>
          </div>
        );
      })}
    </div>
  );
}

export function HoyV5({ data, onLog, onPremium }: { data: TodaySnapshot; onLog: () => void; onPremium: () => void }) {
  const p = data.profile;
  const pr = prediccion(p.lastPeriodStart, data.periodStarts, p.cycleLength, p.stage);
  const day = data.cycleDay ?? 1;
  const ov = ovulationDayNum(p.periodLength, pr.len);
  const fertil = day >= ov - 5 && day <= ov + 1;
  const toFertil = ov - 5 - day;
  const toRegla = Math.max(0, pr.len - day + 1);
  const big = fertil
    ? { pre: "Estás en tu ventana fértil estimada", n: `Día ${day}`, post: ov - day > 0 ? `Ovulación estimada en ${ov - day} ${ov - day === 1 ? "día" : "días"}` : "Ovulación estimada: hoy" }
    : toFertil > 0
      ? { pre: "Tu ventana fértil empieza en", n: `${toFertil} ${toFertil === 1 ? "día" : "días"}`, post: `Próxima regla: ${pr.rango ?? "—"}` }
      : { pre: "Tu próxima regla llega en", n: `${toRegla} ${toRegla === 1 ? "día" : "días"}`, post: pr.rango ?? "" };
  const initial = (p.displayName || "S").charAt(0).toUpperCase();
  return (
    <div className="v5 pb-36 pt-2">
      <header className="flex items-center gap-3">
        <Link to="/app/tu" aria-label="Tu perfil" className="v7-ib glass text-[16px] font-semibold">{initial}</Link>
        <div className="flex-1"><p className="text-[13px] v5-muted">{fechaHoy().split(" ")[0]}</p><p className="text-[17px] font-semibold">{fechaHoy().split(" ").slice(1).join(" ")} · Día {day}</p></div>
        <Link to="/app/calendario" aria-label="Calendario" className="v7-ib glass"><CalendarBlank size={22} weight="light" /></Link>
      </header>
      <WeekStrip />

      <section className="v6-hero mt-5 text-center">
        <p className="text-[15px] v5-muted">{big.pre}</p>
        <p className="v5-num mt-2 v7-coral !text-[52px] !font-medium">{big.n}</p>
        <p className="mt-2 text-[14px] v5-muted">{big.post}</p>
        <button type="button" onClick={onLog} className="v7-pill mt-4">Anotar regla</button>
        <div className="text-left"><CycleBar day={day} len={pr.len} periodLength={p.periodLength} /></div>
        <p className="mt-3 text-[12px] v5-muted">{pr.texto}</p>
      </section>

      <div className="mt-6 flex items-baseline justify-between"><p className="text-[17px] font-semibold">Para ti</p><Link to="/app/guia" className="text-[13px] v5-muted">Ver todo</Link></div>
      <div className="-mx-5 mt-3 flex gap-3 overflow-x-auto px-5 pb-2">
        <button type="button" onClick={onLog} aria-label="Anotar mi día" className="glass grid h-[150px] w-[110px] shrink-0 place-items-center rounded-[20px]">
          <span className="grid size-14 place-items-center rounded-full bg-[var(--coral-2)] text-white shadow-[0_8px_18px_-8px_rgb(232_80_91/.9)]"><Plus size={26} weight="bold" /></span>
        </button>
        {PARA_TI.map((c) => (
          <a key={c.t} href={c.to} className="glass relative h-[150px] w-[120px] shrink-0 overflow-hidden rounded-[20px]">
            <img src={c.img} alt="" className="h-full w-full object-cover" loading="lazy" />
            <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2.5 pt-8 text-[12.5px] font-semibold leading-tight text-white">{c.t}</span>
          </a>
        ))}
      </div>

      {p.intention === "avoid" || p.intention === "track" ? (
        <section className="v5-card mt-4">
          <div className="flex items-center gap-3">
            <span className="v6-badge"><ShieldCheck size={22} weight="light" aria-hidden /></span>
            <p className="text-[16px] font-semibold">Protección hoy</p>
          </div>
          <p className="mt-2 text-[15px] leading-relaxed">Si tienes sexo hoy sin condón, hay riesgo de embarazo. Savia no es un anticonceptivo.</p>
          <Link to="/app/proteccion" className="mt-2 inline-flex min-h-11 items-center gap-1 text-[15px] font-semibold v7-coral">Qué opciones tengo <ArrowRight size={16} weight="light" /></Link>
        </section>
      ) : null}

      <GlassTiles onTile={(k) => { if (k === "embarazo") { onPremium(); return true; } if (k === "sintomas") { onLog(); return true; } }} />

      <DisclaimerV5 />
    </div>
  );
}
