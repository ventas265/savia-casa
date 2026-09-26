import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CalendarDays, Minus, Plus, Sparkle, UserRound } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/brand-mark";
import { loadToday, writeProfile } from "@/lib/savia-api";
import { requestNotify } from "@/lib/notify";
import { useI18n } from "@/lib/i18n";
import { type Intention, type Stage } from "@/lib/types";
import { cn } from "@/lib/utils";
import { addDaysISO, daysUntil, formatLong, predictRange, predictionLabel, todayISO } from "@/lib/cycle";
import { haptic } from "@/lib/haptic";
import { companionName, greetingLine } from "@/lib/companion-messages";
import { useLocalHour } from "@/components/daily-note-card";

/** «Toca…» → «toca…» after a name and a comma. */
function lowerFirst(s: string) {
  return s ? s.charAt(0).toLocaleLowerCase("es") + s.slice(1) : s;
}

export const Route = createFileRoute("/app/onboarding")({ component: Onboarding });

const PRIMARY: Stage = "cycle";
const OTHER_STAGES: Stage[] = ["pregnancy", "postpartum", "peri", "meno"];

function StepIcon({ step }: { step: number }) {
  const wrap = "glass flex size-12 items-center justify-center rounded-full text-regla";
  if (step === 0) {
    return (
      <div className={wrap} aria-hidden>
        <UserRound className="size-5" strokeWidth={1.5} />
      </div>
    );
  }
  if (step === 1) {
    return <BrandMark className="size-12 rounded-2xl" />;
  }
  if (step === 2) {
    return (
      <div className={wrap} aria-hidden>
        <CalendarDays className="size-5" strokeWidth={1.5} />
      </div>
    );
  }
  return (
    <div className={wrap} aria-hidden>
      <Sparkle className="size-5" strokeWidth={1.5} />
    </div>
  );
}

function StepHeader({
  step,
  total,
  title,
  hint,
  progressLabel,
}: {
  step: number;
  total: number;
  title: string;
  hint?: ReactNode;
  progressLabel: string;
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-1 gap-1.5">
          {Array.from({ length: total }).map((_, i) => (
            <span
              key={i}
              className={cn("h-1.5 flex-1 rounded-full transition-colors", i <= step ? "bg-grad" : "bg-surface-2")}
            />
          ))}
        </div>
        <p className="kicker shrink-0 tabular-nums">{progressLabel}</p>
      </div>
      <StepIcon step={step} />
      <div>
        <h1 className="font-display text-[2rem] font-semibold leading-[1.05] tracking-[-0.045em] sm:text-[2.2rem]">
          {title}
        </h1>
        {hint ? <p className="mt-2 text-sm leading-relaxed text-muted">{hint}</p> : null}
      </div>
    </div>
  );
}

function Stepper({
  label,
  hint,
  value,
  unit,
  min,
  max,
  onChange,
  testId,
}: {
  label: string;
  hint: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  onChange: (n: number) => void;
  testId: string;
}) {
  return (
    <div className="glass flex items-center gap-3 rounded-[18px] px-4 py-2.5" data-testid={testId}>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-[12px] leading-snug text-muted">{hint}</p>
      </div>
      <button
        type="button"
        aria-label={`${label}: menos`}
        className="press grid size-11 place-items-center rounded-full bg-white ring-1 ring-line disabled:opacity-40"
        disabled={value <= min}
        onClick={() => {
          haptic();
          onChange(Math.max(min, value - 1));
        }}
      >
        <Minus className="size-4" strokeWidth={1.6} />
      </button>
      <p className="w-14 text-center font-display text-2xl font-semibold tabular-nums" aria-live="polite">
        {value}
        <span className="sr-only"> {unit}</span>
      </p>
      <button
        type="button"
        aria-label={`${label}: más`}
        className="press grid size-11 place-items-center rounded-full bg-white ring-1 ring-line disabled:opacity-40"
        disabled={value >= max}
        onClick={() => {
          haptic();
          onChange(Math.min(max, value + 1));
        }}
      >
        <Plus className="size-4" strokeWidth={1.6} />
      </button>
    </div>
  );
}

function Onboarding() {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const hour = useLocalHour();
  const [step, setStep] = useState(0);
  const [displayName, setDisplayName] = useState("");
  const [stage, setStage] = useState<Stage>("cycle");
  const [showOtherStages, setShowOtherStages] = useState(false);
  const [cycleLength, setCycleLength] = useState(28);
  const [periodLength, setPeriodLength] = useState(5);
  const [approx, setApprox] = useState(false);
  const [lastPeriodStart, setLastPeriodStart] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [lastPeriodYear, setLastPeriodYear] = useState(new Date().getFullYear() - 2);
  const [intention] = useState<Intention>("track");
  const [busy, setBusy] = useState(false);

  const stageCopy: Record<Stage, { title: string; feel: string; tone: string }> = {
    cycle: { title: t.stageCycle, feel: t.stageCycleFeel, tone: "card-hot" },
    pregnancy: { title: t.stagePregnancy, feel: t.stagePregnancyFeel, tone: "glass" },
    postpartum: { title: t.stagePostpartum, feel: t.stagePostpartumFeel, tone: "glass" },
    peri: { title: t.stagePeri, feel: t.stagePeriFeel, tone: "glass" },
    meno: { title: t.stageMeno, feel: t.stageMenoFeel, tone: "glass" },
  };

  useEffect(() => {
    void loadToday().then((snap) => {
      const p = snap.profile;
      if (p.displayName) setDisplayName(p.displayName);
      if (p.stage) {
        setStage(p.stage);
        if (p.stage !== "cycle") setShowOtherStages(true);
      }
      if (p.cycleLength) setCycleLength(p.cycleLength);
      if (p.periodLength) setPeriodLength(p.periodLength);
      if (p.lastPeriodStart) setLastPeriodStart(p.lastPeriodStart);
      if (p.dueDate) setDueDate(p.dueDate);
    });
  }, []);

  const cycling = stage === "cycle" || stage === "peri" || stage === "postpartum";
  // Same range + confidence words as Hoy and the calendar.
  const pred = useMemo(
    () => predictRange(lastPeriodStart || null, [], cycleLength, stage),
    [lastPeriodStart, cycleLength, stage],
  );
  const next = pred.next;
  const left = daysUntil(next);
  const total = cycling || stage === "pregnancy" || stage === "meno" ? 4 : 3;

  function go(n: number) {
    haptic();
    setStep(n);
  }

  function pickStage(id: Stage) {
    haptic();
    setStage(id);
    go(2);
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

  const progressLabel = t.stepOf.replace("{current}", String(step + 1)).replace("{total}", String(total));

  function StageButton({ id }: { id: Stage }) {
    const s = stageCopy[id];
    return (
      <button
        type="button"
        onClick={() => pickStage(id)}
        className={cn(
          "press min-h-[3.25rem] w-full rounded-[22px] p-5 text-left",
          s.tone,
        )}
      >
        <p className="font-display text-xl font-semibold">{s.title}</p>
        <p className="mt-1 text-sm text-muted">{s.feel}</p>
      </button>
    );
  }

  return (
    <div className="flex min-h-[75vh] flex-col px-1 pb-2 pt-2">
      {step === 0 ? (
        <div className="flex flex-1 flex-col">
          <StepHeader step={0} total={total} title={t.askName} hint={t.askNameHint} progressLabel={progressLabel} />
          <input
            autoFocus
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="mt-10 w-full border-0 border-b-2 border-accent bg-transparent py-4 font-display text-3xl font-semibold outline-none placeholder:text-muted/50"
            placeholder={t.yourName}
          />
        </div>
      ) : null}

      {step === 1 ? (
        <div className="flex flex-1 flex-col">
          <StepHeader
            step={1}
            total={total}
            title={t.askBody}
            hint={
              <>
                {companionName(displayName) ? `${companionName(displayName)}, ${lowerFirst(t.askBodyHint)}` : t.askBodyHint}
              </>
            }
            progressLabel={progressLabel}
          />
          <div className="mt-8 space-y-3">
            <StageButton id={PRIMARY} />
            {!showOtherStages ? (
              <button
                type="button"
                className="press mx-auto mt-2 block min-h-11 px-3 py-2 text-center text-xs font-medium text-muted underline-offset-2 hover:underline"
                onClick={() => {
                  haptic();
                  setShowOtherStages(true);
                }}
              >
                {t.stageOther}
              </button>
            ) : (
              <div className="space-y-3 pt-2">
                {OTHER_STAGES.map((id) => (
                  <StageButton key={id} id={id} />
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}

      {step === 2 && cycling ? (
        <div className="flex flex-1 flex-col">
          <StepHeader
            step={2}
            total={total}
            title={t.askLastBleed}
            hint={t.askLastBleedHint}
            progressLabel={progressLabel}
          />
          <div className="mt-6 grid grid-cols-2 gap-2" role="group" aria-label={t.askLastBleed} data-testid="onb-shortcuts">
            {[
              { id: "today", label: t.onbToday, day: todayISO(), approx: false },
              { id: "w1", label: t.onbWeek1, day: addDaysISO(todayISO(), -7), approx: false },
              { id: "w2", label: t.onbWeek2, day: addDaysISO(todayISO(), -14), approx: false },
              { id: "unsure", label: t.onbUnsure, day: addDaysISO(todayISO(), -14), approx: true },
            ].map((o) => {
              const on = lastPeriodStart === o.day && approx === o.approx;
              return (
                <button
                  key={o.id}
                  type="button"
                  data-shortcut={o.id}
                  aria-pressed={on}
                  onClick={() => {
                    haptic();
                    setLastPeriodStart(o.day);
                    setApprox(o.approx);
                  }}
                  className={cn(
                    "press min-h-12 rounded-[18px] px-3 text-sm font-semibold",
                    on ? "bg-grad text-primary-fg" : "glass text-fg",
                  )}
                >
                  {o.label}
                </button>
              );
            })}
          </div>
          <label htmlFor="onb-date" className="kicker mt-4 block">
            {t.onbOtherDate}
          </label>
          <input
            id="onb-date"
            type="date"
            value={lastPeriodStart}
            max={todayISO()}
            onChange={(e) => {
              setLastPeriodStart(e.target.value);
              setApprox(false);
            }}
            className="glass mt-2 min-h-12 w-full rounded-[18px] px-4 font-display text-lg font-semibold outline-none [color-scheme:dark]"
          />
          {lastPeriodStart ? (
            <p className="mt-2 text-sm text-muted" data-testid="onb-date-text">
              {approx ? t.onbUnsureHint : formatLong(lastPeriodStart, lang)}
            </p>
          ) : null}
          <div className="mt-6 space-y-2">
            <Stepper
              label={t.onbCycleLen}
              hint={t.onbCycleHint}
              value={cycleLength}
              unit={t.days}
              min={21}
              max={45}
              onChange={setCycleLength}
              testId="onb-cycle"
            />
            <Stepper
              label={t.onbPeriodLen}
              hint={t.onbPeriodLenHint}
              value={periodLength}
              unit={t.days}
              min={2}
              max={10}
              onChange={setPeriodLength}
              testId="onb-period"
            />
          </div>
        </div>
      ) : null}

      {step === 2 && stage === "pregnancy" ? (
        <div className="flex flex-1 flex-col">
          <StepHeader step={2} total={total} title={t.dueDate} progressLabel={progressLabel} />
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="glass mt-8 min-h-14 w-full rounded-[22px] px-5 font-display text-xl outline-none [color-scheme:dark]"
          />
          {dueDate ? <p className="mt-3 text-sm text-muted">{formatLong(dueDate, lang)}</p> : null}
        </div>
      ) : null}

      {step === 2 && stage === "meno" ? (
        <div className="flex flex-1 flex-col">
          <StepHeader step={2} total={total} title={t.lastPeriodYear} progressLabel={progressLabel} />
          <input
            type="number"
            value={lastPeriodYear}
            onChange={(e) => setLastPeriodYear(Number(e.target.value))}
            className="glass mt-8 min-h-14 w-full rounded-[22px] px-5 font-display text-3xl outline-none"
          />
        </div>
      ) : null}

      {step === 3 ? (
        <div className="flex flex-1 flex-col text-center">
          <StepHeader
            step={3}
            total={total}
            title={greetingLine(hour, displayName, lang)}
            progressLabel={progressLabel}
          />
          {left != null ? (
            <div className="mt-10">
              <p className="kicker !text-accent">{t.predNextRange}</p>
              <p className="mt-2 font-display text-4xl font-semibold tracking-[-0.04em] text-fg" data-testid="onb-pred">
                {pred.from && pred.to ? predictionLabel(pred, lang).split(" · ")[0] : ""}
              </p>
              <p className="mt-2 text-sm text-soft">{predictionLabel(pred, lang).split(" · ")[1]}</p>
              <p className="mt-4 text-sm text-muted">
                {left > 0 ? t.periodInDays.replace("{n}", String(left)) : t.periodComesToday}
              </p>
            </div>
          ) : (
            <p className="mt-10 text-lg text-muted">{t.notebookNote}</p>
          )}
        </div>
      ) : null}

      <div className="mt-auto flex w-full flex-col gap-3 pt-12">
        {step > 0 ? (
          <button
            type="button"
            className="press glass min-h-11 w-full rounded-full text-sm font-semibold text-muted"
            onClick={() => {
              if (step === 1 && showOtherStages) {
                haptic();
                setShowOtherStages(false);
                setStage(PRIMARY);
                return;
              }
              go(step - 1);
            }}
          >
            {t.back}
          </button>
        ) : null}
        {step < 3 && step !== 1 ? (
          <Button
            className="h-14 min-h-11 w-full text-base disabled:bg-surface-2 disabled:[background-image:none] disabled:text-muted disabled:opacity-100"
            disabled={!canNext}
            onClick={() => go(step + 1)}
          >
            {t.continue}
          </Button>
        ) : null}
        {step === 3 ? (
          <Button
            className="h-14 min-h-11 w-full text-base disabled:bg-surface-2 disabled:[background-image:none] disabled:text-muted disabled:opacity-100"
            disabled={busy}
            onClick={() => void save()}
          >
            {t.enterHoy}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
