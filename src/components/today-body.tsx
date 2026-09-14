import { Card } from "@/components/ui/card";
import { Disclaimer } from "@/components/disclaimer";
import { useI18n } from "@/lib/i18n";
import { foodsFor, phaseName, phases, pick, stageName, teaFor, weekCard, symptomLabel } from "@/lib/savia-content";
import { daysUntil } from "@/lib/cycle";
import type { DailyLog, Phase, Stage } from "@/lib/types";

export function TodayBody({
  stage,
  phase,
  cycleDay,
  pregnancyWeek,
  name,
  log,
  recentLogs,
  nextPeriod,
}: {
  stage: Stage;
  phase: Phase;
  cycleDay: number | null;
  pregnancyWeek: number | null;
  name?: string;
  log?: DailyLog | null;
  recentLogs?: DailyLog[];
  nextPeriod?: string | null;
}) {
  const { t, lang } = useI18n();
  const phaseCopy = phase !== "none" ? phases[phase as Exclude<Phase, "none">] : null;
  const tea = teaFor(stage, phase);
  const food = foodsFor(stage, phase);
  const preg = weekCard(pregnancyWeek);
  const counts = new Map<string, number>();
  for (const l of recentLogs || []) {
    for (const s of l.symptoms) counts.set(s, (counts.get(s) || 0) + 1);
  }
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
  const left = daysUntil(nextPeriod ?? null);
  const onPeriod = phase === "menstrual";

  return (
    <div className="space-y-1">
      <p className="text-xs font-medium tracking-[0.16em] text-muted uppercase">{pick(stageName[stage], lang)}</p>
      {stage === "pregnancy" && pregnancyWeek ? (
        <h1 className="mt-3 font-display text-4xl font-medium">
          {t.weekOf} {pregnancyWeek}
        </h1>
      ) : onPeriod ? (
        <h1 className="mt-3 font-display text-4xl font-medium">{t.periodToday}</h1>
      ) : left != null && left >= 0 ? (
        <h1 className="mt-3 font-display text-4xl font-medium">
          {t.periodIn} {left} {left === 1 ? t.dayLeft : t.daysLeft}
        </h1>
      ) : (
        <h1 className="mt-3 font-display text-4xl font-medium">{name || t.today}</h1>
      )}
      <p className="mt-3 text-sm text-muted">
        {onPeriod ? pick(phaseName.menstrual, lang) : t.chanceLow}
        {cycleDay ? ` · ${t.dayOf} ${cycleDay}` : ""}
        {!onPeriod ? ` · ${t.periodEstimate}` : ""}
      </p>
      {!log ? <p className="mt-4 text-sm text-primary">{t.logNudge}</p> : null}
      {top.length ? (
        <p className="mt-3 text-sm text-muted">
          {t.insightTop}: {top.map(([id, n]) => `${pick(symptomLabel[id] || { es: id, en: id }, lang)} (${n})`).join(" · ")}
        </p>
      ) : null}
      {phaseCopy ? (
        <Card className="mt-8">
          <p className="text-xs tracking-wide text-muted uppercase">{t.hormoneToday}</p>
          <h2 className="mt-1 font-display text-2xl font-medium">{pick(phaseName[phase], lang)}</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">{pick(phaseCopy.do, lang)}</p>
        </Card>
      ) : null}
      {stage === "pregnancy" ? (
        <Card className="mt-5">
          <p className="text-xs tracking-wide text-muted uppercase">
            {t.weekOf} {preg.week}
          </p>
          <h2 className="mt-1 font-display text-2xl font-medium">{pick(preg.title, lang)}</h2>
          <p className="mt-3 text-sm leading-relaxed">{pick(preg.body, lang)}</p>
        </Card>
      ) : null}
      <div className="mt-5 grid gap-4">
        <Card>
          <p className="text-xs tracking-wide text-muted uppercase">{t.foodToday}</p>
          <p className="mt-2 font-medium">{pick(food[0]!.title, lang)}</p>
          <p className="mt-1 text-sm text-muted">{pick(food[0]!.plate, lang)}</p>
        </Card>
        <Card>
          <p className="text-xs tracking-wide text-muted uppercase">{t.teaToday}</p>
          <p className="mt-2 font-medium">{pick(tea.name, lang)}</p>
          <p className="mt-1 text-sm text-muted">{pick(tea.for, lang)}</p>
          <p className="mt-1 text-sm text-danger">
            {t.avoid}: {pick(tea.avoid, lang)}
          </p>
        </Card>
      </div>
      <div className="mt-10">
        <Disclaimer compact />
      </div>
    </div>
  );
}
