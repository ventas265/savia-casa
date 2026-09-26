import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { SaviaOrb } from "@/components/savia-orb";
import { EmergencyCard } from "@/components/emergency-card";
import { toneFor } from "@/lib/savia-tone";
import { ArrowUpRight, ChevronDown, X } from "lucide-react";
import { LogForm } from "@/components/log-form";
import { SexHeart } from "@/components/cycle-calendar";
import { useI18n } from "@/lib/i18n";
import { dayStatus, formatLong, type DayMark } from "@/lib/cycle";
import { phaseName, pick, symptomLabel } from "@/lib/savia-content";
import { cn } from "@/lib/utils";
import { setSelectedDay } from "@/lib/selected-day";
import type { DailyLog, Intention, Phase } from "@/lib/types";

export function DaySheet({
  day,
  log,
  wrapUpPaid = false,
  dayMark = null,
  confirmedPeriod = false,
  cycleDayNum = null,
  phase = "none",
  intention = null,
  onClose,
  onSaved,
}: {
  day: string;
  log: DailyLog | null;
  /** Full wrap-up only for real Serena/year plan — not betaPaid. */
  wrapUpPaid?: boolean;
  dayMark?: DayMark | null;
  /** Logged/confirmed bleeding (vs Ogino estimate). */
  confirmedPeriod?: boolean;
  cycleDayNum?: number | null;
  phase?: Phase;
  intention?: Intention | null;
  onClose: () => void;
  onSaved?: (log: DailyLog) => void;
}) {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const [activeLog, setActiveLog] = useState(log);

  useEffect(() => {
    setActiveLog(log);
  }, [log, day]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const hasSex = Boolean(activeLog?.sex);
  const kind = activeLog?.sexKind || "none";
  const risky = kind === "unprotected" || kind === "withdrawal";
  const highWindow = dayMark === "fertile" || dayMark === "peak";
  const lowWindow = dayMark === "quiet" || dayMark === "period";

  let chance: string | null = null;
  if (highWindow && hasSex && risky) {
    chance = t.daySheetChanceHighSex;
  } else if (highWindow && hasSex) {
    chance = t.daySheetChanceHighSexProtected;
  } else if (highWindow) {
    chance = t.daySheetChanceHigh;
  } else if (lowWindow && hasSex && risky) {
    chance = t.daySheetChanceLowSex;
  } else if (lowWindow) {
    chance = t.daySheetChanceLow;
  }

  const status = dayStatus(dayMark, confirmedPeriod || Boolean(activeLog && activeLog.flow !== "none" && activeLog.flow !== "spotting"));
  const hot = status === "fertile" || status === "peak";
  const statusLabel =
    status === "period"
      ? t.calStatusPeriod
      : status === "predicted"
        ? t.calStatusPredicted
        : status === "peak"
          ? t.calStatusPeak
          : status === "fertile"
            ? t.calStatusFertile
            : status === "quiet"
              ? t.calStatusQuiet
              : t.calStatusNone;
  const flowLabel = (() => {
    const f = activeLog?.flow;
    if (!f || f === "none") return null;
    return f === "spotting" ? t.flowSpot : f === "light" ? t.flowLight : f === "medium" ? t.flowMed : t.flowHeavy;
  })();
  const sexLabel = hasSex
    ? kind === "protected"
      ? t.relationsProtected
      : kind === "withdrawal"
        ? t.relationsWithdrawal
        : t.relationsUnprotected
    : null;
  const symptomsText = (activeLog?.symptoms || [])
    .map((id) => (symptomLabel[id] ? pick(symptomLabel[id]!, lang) : id))
    .join(", ");

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label={t.daySheet}>
      <button type="button" className="absolute inset-0 bg-[rgb(43_33_36/0.45)]" aria-label={t.close} onClick={onClose} />
      <div className="relative z-10 flex max-h-[88vh] w-full max-w-lg flex-col rounded-t-[1.75rem] bg-elevated shadow-card sm:rounded-[1.75rem]">
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 pb-3 pt-4">
          <div>
            <p className="kicker">{t.daySheet}</p>
            <p className="mt-1 font-display text-xl font-semibold tracking-[-0.03em]">{formatLong(day, lang)}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="press inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-white ring-1 ring-line"
            aria-label={t.close}
          >
            <X className="size-5" strokeWidth={1.5} />
          </button>
        </div>
        <div className="overflow-y-auto overscroll-contain px-5 py-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          <section
            data-testid="day-summary"
            data-status={status ?? "none"}
            className={cn(
              "rounded-[22px] border p-4",
              hot
                ? "card-fert"
                : status === "period" || status === "predicted"
                  ? "border-regla-50 bg-regla-50"
                  : "glass",
            )}
          >
            <p className={cn("kicker", hot ? "!text-ovu-ink" : "!text-label")}>
              {cycleDayNum ? `${t.dayOf} ${cycleDayNum}` : t.dsChance}
            </p>
            <p className="mt-1 font-display text-[19px] font-semibold leading-tight tracking-[-0.02em]">{statusLabel}</p>
            {hasSex && chance ? <p className="mt-1 text-[13px] leading-snug text-soft">{chance}</p> : null}
            <details data-testid="day-summary-details" className="group mt-3 border-t border-line pt-2">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between text-sm font-semibold text-soft [&::-webkit-details-marker]:hidden">
                {t.dsSummary}
                <ChevronDown className="size-4 transition-transform group-open:rotate-180" aria-hidden />
              </summary>
            <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 pb-1 text-sm">
              <dt className="text-muted">{t.dsPhase}</dt>
              <dd className="text-right font-medium">{phase !== "none" ? pick(phaseName[phase], lang) : "—"}</dd>
              <dt className="text-muted">{t.dsSex}</dt>
              <dd className="flex items-center justify-end gap-1.5 text-right font-medium">
                {sexLabel ? (
                  <>
                    <SexHeart kind={kind} />
                    {sexLabel}
                  </>
                ) : (
                  <span className="font-normal text-muted">{t.dsNothing}</span>
                )}
              </dd>
              <dt className="text-muted">{t.dsFlow}</dt>
              <dd className="text-right font-medium">{flowLabel ?? <span className="font-normal text-muted">{t.dsNothing}</span>}</dd>
              <dt className="text-muted">{t.dsSymptoms}</dt>
              <dd className="text-right font-medium">
                {symptomsText || <span className="font-normal text-muted">{t.dsNothing}</span>}
              </dd>
            </dl>
            </details>
            {hot ? <p className="mt-2 text-[11px] leading-relaxed text-muted">{t.daySheetCalDisclaimer}</p> : null}
            <Link
              to="/app/registro"
              search={{ day }}
              onClick={() => {
                setSelectedDay(day);
                onClose();
              }}
              data-testid="day-edit"
              className="press mt-3 flex min-h-12 items-center justify-center gap-2 rounded-full bg-grad text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgb(142_42_63/0.45)]"
            >
              {t.dsEditDay}
              <ArrowUpRight className="size-4" strokeWidth={1.8} />
            </Link>
            <button
              type="button"
              data-testid="day-ask"
              onClick={() => {
                const info = [
                  cycleDayNum ? `${t.dayOf} ${cycleDayNum}` : null,
                  phase !== "none" ? pick(phaseName[phase], lang) : null,
                  statusLabel,
                ]
                  .filter(Boolean)
                  .join(", ");
                const logs = [sexLabel, flowLabel, symptomsText].filter(Boolean).join(", ") || t.askDayNothing;
                onClose();
                void navigate({
                  to: "/app/preguntar",
                  search: {
                    q: t.askDayPrefill.replace("{date}", formatLong(day, lang)).replace("{info}", info).replace("{logs}", logs),
                    ctx: "day",
                  },
                });
              }}
              className="press mt-2 flex min-h-12 w-full items-center justify-center gap-2.5 rounded-full bg-white text-sm font-semibold ring-1 ring-line"
            >
              <SaviaOrb tone={toneFor(phase, dayMark, status === "period")} className="size-6" />
              {t.askAboutDay}
            </button>
          </section>
          {hasSex && risky && highWindow ? <EmergencyCard day={day} onNavigate={onClose} /> : null}
          <p className="kicker mb-3 mt-6">{t.dsQuickEdit}</p>
          <LogForm
            key={day}
            day={day}
            initial={activeLog}
            wrapUpPaid={wrapUpPaid}
            phase={phase}
            intention={intention}
            dayMark={dayMark}
            hideEmergency
            variant="sheet"
            onDone={onClose}
            onSaved={(saved) => {
              setActiveLog(saved);
              onSaved?.(saved);
            }}
          />
        </div>
      </div>
    </div>
  );
}
