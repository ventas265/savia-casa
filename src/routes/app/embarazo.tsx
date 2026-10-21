import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { loadToday } from "@/lib/savia-api";
import { localToday } from "@/lib/savia-local";
import { SAVIA_BETA } from "@/lib/beta";
import { Paywall } from "@/components/v5/paywall";
import { DisclaimerV5 } from "@/components/v5/disclaimer-v5";
import { ACOG, ALARMAS, MAYO, NHS, SEMANAS } from "@/data/embarazo-semanas";
import type { TodaySnapshot } from "@/lib/types";

export const Route = createFileRoute("/app/embarazo")({ component: Embarazo });

/** Modo embarazo (Serena). Contenido pendiente de revisión médica antes de activar en producción. */
function Embarazo() {
  const navigate = useNavigate();
  const [data, setData] = useState<TodaySnapshot | null>(null);
  const [q, setQ] = useState<URLSearchParams | null>(null);
  useEffect(() => {
    setQ(new URLSearchParams(window.location.search));
    if (SAVIA_BETA) setData(localToday());
    void loadToday().then(setData).catch(() => {});
  }, []);
  const plan = data?.profile.plan;
  const paid = plan === "serena" || plan === "year";
  const preview = q?.get("preview") === "1";
  const semanaQ = Number(q?.get("semana")) || null;
  const semana = Math.min(40, Math.max(4, semanaQ ?? data?.pregnancyWeek ?? 12));
  const dia = new Date().getDay();
  const s = SEMANAS.find((x) => x.semana === semana)!;
  const locked = q !== null && !paid && !preview;

  return (
    <div className="v5 pb-28 pt-2">
      <div className="v6-grad-serena rounded-[24px] px-5 py-6">
        <p className="v5-kicker !text-white/80">Modo embarazo · Serena</p>
        <p className="v5-num mt-2">Semana {semana}</p>
        <p className="mt-1 text-[15px] text-white/85">día {dia}</p>
      </div>

      <div className={locked ? "pointer-events-none select-none blur-[3px]" : ""} aria-hidden={locked}>
        <section className="v5-card v6-t-rosa mt-6">
          <p className="v5-kicker">Tu bebé</p>
          <p className="mt-1 text-[15px]">{s.tamano ?? "Tamaño aproximado: dato pendiente de revisión médica."}</p>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[15px] leading-relaxed">{s.bebe.map((b) => <li key={b}>{b}</li>)}</ul>
          <p className="v5-src mt-3">Fuente: <a href={ACOG} target="_blank" rel="noreferrer">ACOG · How your fetus grows</a></p>
        </section>
        <section className="v5-card v6-t-ambar mt-4">
          <p className="v5-kicker">Cambios en tu cuerpo</p>
          <p className="mt-2 text-[15px] leading-relaxed">{s.cuerpo}</p>
        </section>
        <section className="v5-card v6-t-salvia mt-4">
          <p className="v5-kicker">Controles prenatales</p>
          <p className="mt-2 text-[15px] leading-relaxed">{s.controles}</p>
          <p className="v5-src mt-3"><a href={MAYO} target="_blank" rel="noreferrer">Mayo Clinic · Prenatal care</a> · <a href={NHS} target="_blank" rel="noreferrer">NHS · Pregnancy week by week</a></p>
        </section>
        <section className="v5-card mt-4" style={{ borderColor: "var(--aviso)" }}>
          <p className="v5-kicker" style={{ color: "var(--aviso)" }}>Llama a tu médico si…</p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-[15px]">{ALARMAS.map((a) => <li key={a}>{a}</li>)}</ul>
          <p className="v5-src mt-3">Fuente: <a href={NHS} target="_blank" rel="noreferrer">NHS</a></p>
        </section>
        <p className="mt-4 text-[13px] v5-muted">Fecha probable de parto: FUM + 280 días (regla de Naegele) o según ecografía. Contenido en revisión por profesional de salud.</p>
      </div>
      <DisclaimerV5 />
      {locked ? <Paywall onClose={() => void navigate({ to: "/app/hoy" })} /> : null}
    </div>
  );
}
