import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Disclaimer } from "@/components/disclaimer";
import { loadReport } from "@/lib/savia-api";
import { useI18n } from "@/lib/i18n";
import { formatDay } from "@/lib/cycle";
import { pick, phaseName, stageName, symptomLabel } from "@/lib/savia-content";
import type { Phase } from "@/lib/types";

export const Route = createFileRoute("/app/informe")({ component: Informe });

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border/70 py-2.5 text-sm">
      <span className="text-muted">{label}</span>
      <span className="max-w-[58%] text-right font-medium">{value}</span>
    </div>
  );
}

function Informe() {
  const { t, lang } = useI18n();
  const [data, setData] = useState<Awaited<ReturnType<typeof loadReport>> | null>(null);

  useEffect(() => {
    loadReport()
      .then(setData)
      .catch(() => setData({ ok: false, error: "pay" }));
  }, []);

  if (!data) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (!data.ok) {
    return (
      <>
        <h1 className="text-2xl font-semibold">{t.reportTitle}</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">{t.reportPay}</p>
        <Button className="mt-6" asChild>
          <Link to="/pagar">{t.payCta}</Link>
        </Button>
      </>
    );
  }

  const { profile, pattern, periodStarts, symptoms, sexMarks, nextPeriod, issued, age, meta, fertile, heavyDays, flowDays, logCount } =
    data;
  const kindLabel: Record<string, string> = {
    protected: t.sexProtected,
    unprotected: t.sexUnprotected,
    withdrawal: t.sexWithdrawal,
  };
  const intentLabel = { track: t.intentTrack, avoid: t.intentAvoid, ttc: t.intentTtc };
  const phase = meta.phase as Phase;
  const notes = [
    pattern.irregular ? t.reportIrregular : t.reportRegular,
    heavyDays >= 4 ? `${t.reportHeavy}: ${heavyDays}` : "",
    meta.pregnancyWeek ? `${t.pregnancy} ${meta.pregnancyWeek}` : "",
  ].filter(Boolean);

  const text = [
    `SAVIA — ${t.reportTitle.toUpperCase()}`,
    `${t.reportIssued}: ${formatDay(issued, lang)}`,
    "",
    t.reportPatient.toUpperCase(),
    `${t.profile}: ${profile.displayName || "—"}`,
    age ? `${t.reportAge}: ${age} ${t.reportYears}` : "",
    `${pick(stageName[profile.stage], lang)}`,
    intentLabel[profile.intention],
    "",
    t.reportCycleHist.toUpperCase(),
    `${t.reportFum}: ${profile.lastPeriodStart ? formatDay(profile.lastPeriodStart, lang) : "—"}`,
    `${t.predAvg}: ${pattern.avg} ${t.daysWord}` + (pattern.n ? ` (${pattern.min}–${pattern.max}, n=${pattern.n})` : ""),
    `${t.reportPeriodLen}: ${profile.periodLength} ${t.daysWord}`,
    pattern.irregular ? t.reportIrregular : t.reportRegular,
    meta.cycleDay ? `${t.dayOf} ${meta.cycleDay} · ${pick(phaseName[phase], lang)}` : "",
    nextPeriod ? `${t.nextPeriod}: ${formatDay(nextPeriod, lang)}` : "",
    fertile
      ? `${t.predFertile}: ${formatDay(fertile.start, lang)} – ${formatDay(fertile.end, lang)}`
      : "",
    `${t.legendPeriod}: ${periodStarts.slice(0, 8).map((d) => formatDay(d, lang)).join(", ") || "—"}`,
    `${t.reportFlowDays}: ${flowDays}`,
    `${t.reportHeavy}: ${heavyDays}`,
    "",
    t.reportPatterns.toUpperCase(),
    ...symptoms
      .filter((s) => s.top.length)
      .map(
        (s) =>
          `${pick(phaseName[s.phase as Phase], lang)}: ${s.top.map((x) => pick(symptomLabel[x.id] || [x.id, x.id], lang)).join(", ")}`,
      ),
    sexMarks.length
      ? `\n${t.reportSexHist.toUpperCase()}\n` +
        sexMarks
          .slice(0, 16)
          .map((s) => `${formatDay(s.day, lang)} — ${kindLabel[s.kind] || ""}`)
          .join("\n")
      : "",
    notes.length ? `\n${t.reportNotes.toUpperCase()}\n${notes.join("\n")}` : "",
    "",
    t.reportNotDx,
  ]
    .filter((line) => line !== "")
    .join("\n");

  return (
    <>
      <p className="text-xs font-medium tracking-wide text-muted uppercase">{t.brand}</p>
      <h1 className="mt-1 text-2xl font-semibold">{t.reportTitle}</h1>
      <p className="mt-2 text-sm text-muted">{t.reportSub}</p>

      <article className="mt-6 rounded-3xl bg-surface p-5">
        <Row label={t.reportIssued} value={formatDay(issued, lang)} />

        <p className="mt-5 text-xs font-semibold tracking-wide text-muted uppercase">{t.reportPatient}</p>
        <Row label={t.profile} value={profile.displayName || "—"} />
        <Row label={t.reportAge} value={age ? `${age} ${t.reportYears}` : "—"} />
        <Row label={t.reportStage} value={pick(stageName[profile.stage], lang)} />
        <Row label={t.intentTitle} value={intentLabel[profile.intention]} />

        <p className="mt-5 text-xs font-semibold tracking-wide text-muted uppercase">{t.reportCycleHist}</p>
        <Row
          label={t.reportFum}
          value={profile.lastPeriodStart ? formatDay(profile.lastPeriodStart, lang) : "—"}
        />
        <Row
          label={t.predAvg}
          value={
            pattern.n
              ? `${pattern.avg} ${t.daysWord} (${pattern.min}–${pattern.max})`
              : `${pattern.avg} ${t.daysWord}`
          }
        />
        <Row label={t.reportCyclesN} value={String(pattern.n)} />
        <Row label={t.reportPeriodLen} value={`${profile.periodLength} ${t.daysWord}`} />
        <Row label={t.reportCurrent} value={meta.cycleDay ? `${t.dayOf} ${meta.cycleDay} · ${pick(phaseName[phase], lang)}` : pick(stageName[profile.stage], lang)} />
        <Row label={t.nextPeriod} value={nextPeriod ? formatDay(nextPeriod, lang) : "—"} />
        <Row
          label={t.predFertile}
          value={fertile ? `${formatDay(fertile.start, lang)} – ${formatDay(fertile.end, lang)}` : "—"}
        />
        <Row
          label={t.legendPeriod}
          value={periodStarts.slice(0, 6).map((d) => formatDay(d, lang)).join(" · ") || "—"}
        />
        <Row label={t.reportFlowDays} value={String(flowDays)} />
        <Row label={t.reportHeavy} value={String(heavyDays)} />

        <p className="mt-5 text-xs font-semibold tracking-wide text-muted uppercase">{t.reportPatterns}</p>
        {symptoms.some((s) => s.top.length) ? (
          symptoms
            .filter((s) => s.top.length)
            .map((s) => (
              <Row
                key={s.phase}
                label={pick(phaseName[s.phase as Phase], lang)}
                value={s.top.map((x) => pick(symptomLabel[x.id] || [x.id, x.id], lang)).join(", ")}
              />
            ))
        ) : (
          <p className="py-2 text-sm text-muted">{t.reportNeedLogs}</p>
        )}

        <p className="mt-5 text-xs font-semibold tracking-wide text-muted uppercase">{t.reportSexHist}</p>
        {sexMarks.length ? (
          sexMarks.slice(0, 12).map((s) => (
            <Row key={s.day} label={formatDay(s.day, lang)} value={kindLabel[s.kind] || ""} />
          ))
        ) : (
          <p className="py-2 text-sm text-muted">—</p>
        )}

        <p className="mt-5 text-xs font-semibold tracking-wide text-muted uppercase">{t.reportNotes}</p>
        <ul className="mt-2 space-y-1 text-sm leading-relaxed">
          {notes.map((n) => (
            <li key={n}>· {n}</li>
          ))}
          <li>· {t.reportNotDx}</li>
        </ul>
        <p className="mt-4 text-xs text-muted">{logCount} {t.daysWord}</p>
      </article>

      <div className="mt-6 flex gap-2">
        <Button
          className="flex-1"
          onClick={() => {
            void navigator.clipboard.writeText(text).then(
              () => toast.success(t.zinliCopy),
              () => toast.error(t.errorGeneric),
            );
          }}
        >
          {t.reportCopy}
        </Button>
        <Button className="flex-1" variant="secondary" type="button" onClick={() => window.print()}>
          {t.reportPrint}
        </Button>
      </div>
      <div className="mt-8">
        <Disclaimer />
      </div>
    </>
  );
}
