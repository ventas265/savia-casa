import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { loadToday, writeProfile } from "@/lib/savia-api";
import { requestNotify } from "@/lib/notify";
import { useI18n } from "@/lib/i18n";
import { type Intention, type Stage } from "@/lib/types";
import { cn } from "@/lib/utils";
import { daysUntil, nextPeriodDate } from "@/lib/cycle";
import { haptic } from "@/lib/haptic";

export const Route = createFileRoute("/app/onboarding")({ component: Onboarding });

const STAGES: { id: Stage; es: string; feel: string; tone: string }[] = [
  { id: "cycle", es: "Tengo el ciclo", feel: "Quiero entender mi periodo", tone: "bg-primary text-primary-fg" },
  { id: "pregnancy", es: "Estoy esperando", feel: "Un bebé en camino", tone: "bg-sand text-ink" },
  { id: "postpartum", es: "Estoy en posparto", feel: "Después del nacimiento", tone: "bg-accent text-ink" },
  { id: "peri", es: "Ya no es el ciclo de antes", feel: "Perimenopausia", tone: "bg-plum text-primary-fg" },
  { id: "meno", es: "Ya no me viene", feel: "Menopausia", tone: "bg-ink text-primary-fg" },
];

function Onboarding() {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [displayName, setDisplayName] = useState("");
  const [stage, setStage] = useState<Stage>("cycle");
  const [cycleLength, setCycleLength] = useState(28);
  const [periodLength] = useState(5);
  const [lastPeriodStart, setLastPeriodStart] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [lastPeriodYear, setLastPeriodYear] = useState(new Date().getFullYear() - 2);
  const [intention] = useState<Intention>("track");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void loadToday().then((snap) => {
      const p = snap.profile;
      if (p.displayName) setDisplayName(p.displayName);
      if (p.stage) setStage(p.stage);
      if (p.cycleLength) setCycleLength(p.cycleLength);
      if (p.lastPeriodStart) setLastPeriodStart(p.lastPeriodStart);
      if (p.dueDate) setDueDate(p.dueDate);
    });
  }, []);

  const cycling = stage === "cycle" || stage === "peri" || stage === "postpartum";
  const next = useMemo(
    () => (lastPeriodStart ? nextPeriodDate(lastPeriodStart, cycleLength) : null),
    [lastPeriodStart, cycleLength],
  );
  const left = daysUntil(next);
  const total = cycling || stage === "pregnancy" || stage === "meno" ? 4 : 3;

  function go(n: number) {
    haptic();
    setStep(n);
  }

  async function save() {
    setBusy(true);
    try {
      const res = await writeProfile({
        displayName: displayName.trim() || "tú",
        stage,
        birthYear: null,
        cycleLength,
        periodLength,
        lastPeriodStart: stage === "meno" || stage === "pregnancy" ? null : lastPeriodStart || null,
        dueDate: stage === "pregnancy" ? dueDate || null : null,
        lastPeriodYear: stage === "meno" ? lastPeriodYear : null,
        onboardingDone: true,
        locale: lang,
        intention,
        country: "VE",
      });
      if (!res.ok) {
        toast.error(t.errorGeneric);
        return;
      }
      void requestNotify();
      void navigate({ to: "/app/hoy" });
    } catch {
      toast.error(t.errorGeneric);
    } finally {
      setBusy(false);
    }
  }

  const canNext =
    step === 0
      ? displayName.trim().length > 1
      : step === 1
        ? true
        : step === 2
          ? stage === "pregnancy"
            ? Boolean(dueDate)
            : stage === "meno"
              ? true
              : Boolean(lastPeriodStart)
          : true;

  return (
    <div className="flex min-h-[70vh] flex-col">
      <div className="flex gap-1.5">
        {Array.from({ length: total }).map((_, i) => (
          <span key={i} className={cn("h-1 flex-1 rounded-full", i <= step ? "bg-primary" : "bg-surface-2")} />
        ))}
      </div>

      {step === 0 ? (
        <div className="mt-10 flex flex-1 flex-col">
          <p className="font-display text-4xl font-semibold tracking-[-0.04em]">{t.askName}</p>
          <p className="mt-3 text-muted">{t.askNameHint}</p>
          <input
            autoFocus
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="mt-10 w-full border-0 border-b-2 border-primary bg-transparent py-3 font-display text-3xl font-semibold outline-none"
            placeholder={t.yourName}
          />
        </div>
      ) : null}

      {step === 1 ? (
        <div className="mt-10">
          <p className="font-display text-3xl font-semibold tracking-[-0.03em]">{t.askBody}</p>
          <p className="mt-2 text-sm text-muted">{displayName}, {t.askBodyHint}</p>
          <div className="mt-6 space-y-3">
            {STAGES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  haptic();
                  setStage(s.id);
                  go(2);
                }}
                className={cn("press w-full rounded-[1.5rem] p-5 text-left shadow-card", s.tone)}
              >
                <p className="font-display text-xl font-semibold">{s.es}</p>
                <p className="mt-1 text-sm opacity-80">{s.feel}</p>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {step === 2 && cycling ? (
        <div className="mt-10">
          <p className="font-display text-3xl font-semibold tracking-[-0.03em]">{t.askLastBleed}</p>
          <p className="mt-2 text-sm text-muted">{t.askLastBleedHint}</p>
          <input
            type="date"
            value={lastPeriodStart}
            onChange={(e) => setLastPeriodStart(e.target.value)}
            className="mt-8 h-16 w-full rounded-[1.5rem] bg-surface px-5 font-display text-xl font-semibold shadow-card outline-none"
          />
          <p className="mt-8 text-sm font-semibold">{t.askRhythm}</p>
          <div className="mt-4 flex items-center justify-center gap-8">
            <button
              type="button"
              className="press flex size-14 items-center justify-center rounded-full bg-surface text-2xl font-semibold shadow-card"
              onClick={() => {
                haptic();
                setCycleLength((n) => Math.max(21, n - 1));
              }}
            >
              −
            </button>
            <p className="font-display text-6xl font-semibold tabular-nums text-primary">{cycleLength}</p>
            <button
              type="button"
              className="press flex size-14 items-center justify-center rounded-full bg-surface text-2xl font-semibold shadow-card"
              onClick={() => {
                haptic();
                setCycleLength((n) => Math.min(45, n + 1));
              }}
            >
              +
            </button>
          </div>
          <p className="mt-2 text-center text-sm text-muted">{t.days} {t.askRhythmHint}</p>
        </div>
      ) : null}

      {step === 2 && stage === "pregnancy" ? (
        <div className="mt-10">
          <p className="font-display text-3xl font-semibold tracking-[-0.03em]">{t.dueDate}</p>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="mt-8 h-16 w-full rounded-[1.5rem] bg-surface px-5 font-display text-xl shadow-card outline-none"
          />
        </div>
      ) : null}

      {step === 2 && stage === "meno" ? (
        <div className="mt-10">
          <p className="font-display text-3xl font-semibold tracking-[-0.03em]">{t.lastPeriodYear}</p>
          <input
            type="number"
            value={lastPeriodYear}
            onChange={(e) => setLastPeriodYear(Number(e.target.value))}
            className="mt-8 h-16 w-full rounded-[1.5rem] bg-surface px-5 font-display text-3xl shadow-card outline-none"
          />
        </div>
      ) : null}

      {step === 3 ? (
        <div className="mt-10 text-center">
          <p className="font-display text-3xl font-semibold tracking-[-0.03em]">
            {t.goodMorning}, {displayName}
          </p>
          {left != null ? (
            <>
              <p className="mt-8 text-sm font-semibold text-muted">{t.periodIn}</p>
              <p className="mt-2 font-display text-6xl font-semibold text-primary">
                {left} {left === 1 ? t.dayLeft : t.daysLeft}
              </p>
            </>
          ) : (
            <p className="mt-8 text-lg text-muted">{t.notebookNote}</p>
          )}
        </div>
      ) : null}

      <div className="mt-auto flex gap-3 pt-10">
        {step > 0 ? (
          <button type="button" className="press h-14 flex-1 rounded-full bg-surface font-semibold shadow-card" onClick={() => go(step - 1)}>
            {t.back}
          </button>
        ) : null}
        {step < 3 && step !== 1 ? (
          <Button className="h-14 flex-[2]" disabled={!canNext} onClick={() => go(step + 1)}>
            {t.continue}
          </Button>
        ) : null}
        {step === 3 ? (
          <Button className="h-14 flex-1" disabled={busy} onClick={() => void save()}>
            {t.enterHoy}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
