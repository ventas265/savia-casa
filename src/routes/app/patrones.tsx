import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, FileText, Leaf, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { InsightsPanel } from "@/components/insights-card";
import { useTodaySnap } from "@/lib/use-today-snap";
import { fill, useV4 } from "@/lib/i18n-v4";
import { EXAMPLE_PATTERN, SEASONS, SYMPTOM_PHRASE, seasonRanges } from "@/lib/v4-content";
import { computeInsights, type Insight } from "@/lib/insights";
import { addDaysISO, formatDay, fromISO, isCycling, knownStarts, predictPeriod, todayISO } from "@/lib/cycle";
import { SAVIA_BETA } from "@/lib/beta";
import { localAllLogs } from "@/lib/savia-local";
import { pick, symptomLabel } from "@/lib/savia-content";
import { useSerenaSheet } from "@/lib/serena-sheet";
import { SYMPTOM_ICON } from "@/lib/symptom-meta";
import { Droplet } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DailyLog } from "@/lib/types";

/** 04 · Patrones — lo que Savia aprendió de tus ciclos (en el teléfono). */
export const Route = createFileRoute("/app/patrones")({ component: Patrones });

const MONTHS = {
  es: ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"],
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
};

function Patrones() {
  const { v, lang } = useV4();
  const showSerena = useSerenaSheet((s) => s.show);
  const { data } = useTodaySnap();
  if (!data) {
    return (
      <div className="space-y-4 px-2 pt-4" aria-busy="true">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-80 w-full rounded-[34px]" />
      </div>
    );
  }
  const p = data.profile;
  const paid = p.plan === "serena" || p.plan === "year";
  const today = todayISO();
  const logs: DailyLog[] = SAVIA_BETA ? localAllLogs() : data.recentLogs;
  const pred = predictPeriod(p.lastPeriodStart, data.periodStarts, p.cycleLength, p.stage);
  const result = computeInsights({ starts: data.periodStarts, logs, periodLength: p.periodLength, cycleLength: pred.len, today });
  const sym = result.items.find((i): i is Extract<Insight, { id: "symptomBefore" }> => i.id === "symptomBefore");
  const starts = knownStarts(p.lastPeriodStart, data.periodStarts).filter((s) => s <= today);
  const example = !sym;
  const symptom = sym?.symptom ?? EXAMPLE_PATTERN.symptom;
  const days = sym?.days ?? EXAMPLE_PATTERN.days;
  const cycles = sym?.cycles ?? EXAMPLE_PATTERN.cycles;
  const byDay = new Map(logs.map((l) => [l.day, l]));
  // Chart rows: last 3 real starts × the 6 days before (+ the period day).
  const rows = example
    ? EXAMPLE_PATTERN.rows.map((r) => ({ m: pick(r.m, lang), hits: r.hits }))
    : starts.slice(-3).map((s) => ({
        m: MONTHS[lang][fromISO(s).getMonth()]!,
        hits: [1, 2, 3, 4, 5, 6].filter((d) => byDay.get(addDaysISO(s, -d))?.symptoms.includes(symptom)),
      }));
  const phrase = SYMPTOM_PHRASE[symptom] ? pick(SYMPTOM_PHRASE[symptom], lang) : `${pick(symptomLabel[symptom] ?? { es: symptom, en: symptom }, lang).toLowerCase()}.`;
  const tipDay = pred.next ? addDaysISO(pred.next, -days) : null;
  const Icon = SYMPTOM_ICON[symptom] ?? Droplet;
  const ranges = seasonRanges(pred.len, p.periodLength);
  const periodIns = result.items.find((i) => i.id === "periodLength") as Extract<Insight, { id: "periodLength" }> | undefined;
  const reg = result.items.find((i) => i.id === "regularity") as Extract<Insight, { id: "regularity" }> | undefined;
  const cyc = result.items.find((i) => i.id === "cycleLength") as Extract<Insight, { id: "cycleLength" }> | undefined;
  const cycling = isCycling(p.stage) && Boolean(p.lastPeriodStart);

  return (
    <div className="px-0 pb-4">
      <div className="flex items-end justify-between px-2 pt-2.5">
        <div>
          <p className="v4-eyebrow mb-2">{v.patEyebrow}</p>
          <h1 className="v4-h1">{v.patTitle}</h1>
        </div>
        {example ? (
          <span className="v4-demo mb-1.5" aria-label={v.exampleAria} data-testid="pat-example">
            {v.example}
          </span>
        ) : null}
      </div>

      <section className="v4-card mt-4 rounded-[34px] px-4 pb-3.5 pt-[18px]" data-testid="pat-insight">
        <p className="v4-eyebrow acc">
          <Sparkles className="size-4" strokeWidth={1.8} aria-hidden />
          {v.noticed}
        </p>
        <div className="v4-pbig mb-3.5 mt-2 flex items-center gap-3.5">
          <span className="v4-pn" aria-hidden>
            {days}
          </span>
          <div>
            <p>
              <span className="sr-only">{days} </span>
              {fill(days === 1 ? v.patBeforeOne : v.patBefore, { verb: phrase })}
            </p>
            <small className="mt-1.5 block text-[13px] font-medium leading-tight text-muted">{fill(v.patCycles, { n: cycles })}</small>
          </div>
        </div>
        <div className="v4-chart" aria-hidden>
          {rows.map((r) => (
            <div className="v4-cr" key={r.m}>
              <span className="v4-cn">{r.m}</span>
              {[6, 5, 4, 3, 2, 1].map((d) => (
                <span key={d} className={cn("v4-c", r.hits.includes(d) && "hit")}>
                  {r.hits.includes(d) ? <Icon className="size-3.5 text-ink" strokeWidth={1.8} /> : null}
                </span>
              ))}
              <span className="v4-c rr" />
            </div>
          ))}
          <div className="v4-cr lab">
            <span />
            {["-6", "-5", "-4", "-3", "-2", "-1"].map((d) => (
              <span key={d}>{d}</span>
            ))}
            <span>{v.legendPeriod}</span>
          </div>
        </div>
        {tipDay && cycling ? (
          <div className="v4-tipbar">
            <Leaf className="size-[18px] shrink-0 text-lut-ink" strokeWidth={1.8} aria-hidden />
            <p>
              <b>{lang === "es" ? "El " : "On "}{formatDay(tipDay, lang).replace(/\.$/, "")}</b>
              {lang === "es" ? ": agua y 8 h de sueño." : ": water and 8 h of sleep."}
            </p>
            <Link to="/app/tu" hash="recordatorios" className="v4-mini-btn grid place-items-center" data-testid="pat-remind">
              {v.remindMe}
            </Link>
          </div>
        ) : null}
      </section>

      <div className="mt-3 flex gap-2" data-testid="pat-stats">
        <div className="v4-st">
          <img src={SEASONS.menstrual.thumb} alt="" width={160} height={64} loading="lazy" />
          <div>
            <b>{fill(v.cycleDays, { n: periodIns?.avg ?? p.periodLength })}</b>
            <small>{v.patPeriod}</small>
          </div>
        </div>
        <div className="v4-st">
          <img src={SEASONS.follicular.thumb} alt="" width={160} height={64} loading="lazy" />
          <div>
            <b>{reg ? (reg.min === reg.max ? reg.min : `${reg.min}–${reg.max}`) : cyc?.avg ?? pred.len}</b>
            <small>
              {v.patCycle} · {reg ? (reg.regular ? v.regular : v.irregular) : v.learning}
            </small>
          </div>
        </div>
        <div className="v4-st">
          <img src={SEASONS.ovulatory.thumb} alt="" width={160} height={64} loading="lazy" />
          <div>
            <b>
              {fill(v.dayN, { n: `${ranges.follicular[0] + 2}–${ranges.ovulatory[1]}` })}
            </b>
            <small>{v.patEnergy}</small>
          </div>
        </div>
      </div>

      {paid ? (
        <Link to="/app/informe" className="v4-rl" data-testid="pat-report">
          <FileText className="size-5 shrink-0 text-accent" strokeWidth={1.8} aria-hidden />
          <span className="flex flex-1 flex-col gap-[3px]">
            <b className="text-[14.5px] font-semibold leading-tight">{v.report}</b>
            <small className="text-[12.5px] font-medium leading-tight text-muted">{v.reportSub}</small>
          </span>
          <ChevronRight className="size-5 text-ink-2" strokeWidth={1.8} aria-hidden />
        </Link>
      ) : (
        <button type="button" className="v4-rl" onClick={showSerena} data-testid="pat-report">
          <FileText className="size-5 shrink-0 text-accent" strokeWidth={1.8} aria-hidden />
          <span className="flex flex-1 flex-col gap-[3px]">
            <b className="text-[14.5px] font-semibold leading-tight">{v.report}</b>
            <small className="text-[12.5px] font-medium leading-tight text-muted">{v.reportSub}</small>
          </span>
          <ChevronRight className="size-5 text-ink-2" strokeWidth={1.8} aria-hidden />
        </button>
      )}

      {cycling ? (
        <div className="px-1">
          <InsightsPanel result={result} paid={paid} />
        </div>
      ) : null}
    </div>
  );
}
