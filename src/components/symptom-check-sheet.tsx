import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { X } from "lucide-react";
import { toast } from "sonner";
import { CircleChip } from "@/components/circle-chip";
import { WrapUpCard } from "@/components/log-form";
import { useI18n } from "@/lib/i18n";
import { writeLog } from "@/lib/savia-api";
import { haptic } from "@/lib/haptic";
import { asIsoDay, formatDay, todayISO } from "@/lib/cycle";
import { pick, symptomLabel } from "@/lib/savia-content";
import { tipAfterSave, type TipResult } from "@/lib/savia-tip";
import { setSelectedDay } from "@/lib/selected-day";
import { QUICK_SYMPTOMS, SYMPTOM_EMOJI } from "@/lib/symptom-meta";
import type { DailyLog, Intention, Phase } from "@/lib/types";
import { cn } from "@/lib/utils";

const ASK_KEY = "savia.symptomAsk.";

function askedToday(day: string) {
  try {
    return window.localStorage.getItem(ASK_KEY + day) != null;
  } catch {
    return true;
  }
}

function markAsked(day: string, value: string) {
  try {
    window.localStorage.setItem(ASK_KEY + day, value);
  } catch {
    /* private mode — just skip */
  }
}

/** Decide once per mount whether today's quick symptom check should open. */
export function useSymptomAsk(ready: boolean, onboarded: boolean, todayLog: DailyLog | null) {
  const [open, setOpen] = useState(false);
  const decided = useRef(false);
  useEffect(() => {
    if (decided.current || !ready) return;
    decided.current = true;
    const day = todayISO();
    if (!onboarded) return;
    if (todayLog && todayLog.symptoms.length > 0) return;
    if (askedToday(day)) return;
    // Not cleared on re-render: the decision is made once per mount.
    window.setTimeout(() => {
      markAsked(day, "shown");
      setOpen(true);
    }, 700);
  }, [ready, onboarded, todayLog]);
  const close = useCallback(() => setOpen(false), []);
  return { open, close };
}

export function SymptomCheckSheet({
  log,
  phase,
  intention,
  wrapUpPaid,
  onClose,
  onSaved,
}: {
  log: DailyLog | null;
  phase: Phase;
  intention: Intention | null;
  wrapUpPaid: boolean;
  onClose: () => void;
  onSaved?: (log: DailyLog) => void;
}) {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const day = asIsoDay(todayISO()) || todayISO();
  const [picked, setPicked] = useState<string[]>([]);
  const [none, setNone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [tip, setTip] = useState<TipResult | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setShown(true));
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(raf);
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  function toggle(id: string) {
    haptic(10);
    setNone(false);
    setPicked((p) => (p.includes(id) ? p.filter((s) => s !== id) : [...p, id]));
  }

  async function apply() {
    if (none || picked.length === 0) {
      markAsked(day, "none");
      onClose();
      return;
    }
    setBusy(true);
    try {
      // Same write path as LogForm; merge with today's log. sex/sexKind omitted on
      // purpose — local + server saveLog keep the existing heart when not sent.
      const symptoms = Array.from(new Set([...(log?.symptoms ?? []), ...picked])).slice(0, 24);
      const flow = log?.flow ?? "none";
      const res = await writeLog({
        day,
        flow,
        mood: log?.mood ?? null,
        energy: log?.energy ?? null,
        sleepHours: log?.sleepHours ?? null,
        notes: log?.notes ?? "",
        symptoms,
        mucus: log?.mucus ?? "none",
        periodStarted: flow === "light" || flow === "medium" || flow === "heavy",
      });
      if (res.ok) {
        markAsked(day, "applied");
        haptic(14);
        toast.success(t.savedInMonth.replace("{date}", formatDay(day, lang)), {
          action: {
            label: t.viewInCalendar,
            onClick: () => {
              setSelectedDay(day);
              void navigate({ to: "/app/calendario" });
            },
          },
        });
        setTip(
          tipAfterSave({
            phase,
            flow: res.log.flow,
            sexKind: res.log.sexKind || (res.log.sex ? "unprotected" : "none"),
            symptoms: res.log.symptoms,
            mood: res.log.mood,
            energy: res.log.energy,
            intention,
            lang,
          }),
        );
        onSaved?.(res.log);
      }
    } catch {
      toast.error(t.errorGeneric);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sym-ask-title"
      data-testid="symptom-ask"
    >
      <button
        type="button"
        className={cn("absolute inset-0 bg-ink/40 transition-opacity duration-300", shown ? "opacity-100" : "opacity-0")}
        aria-label={t.close}
        onClick={onClose}
      />
      <div
        className={cn(
          "relative z-10 flex max-h-[88vh] w-full max-w-lg flex-col rounded-t-[1.75rem] bg-surface shadow-bar transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          shown ? "translate-y-0" : "translate-y-full",
        )}
      >
        <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-border" aria-hidden />
        <div className="flex items-start justify-between gap-3 px-5 pt-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-sage-deep">
              {formatDay(day, lang)}
            </p>
            <h2 id="sym-ask-title" className="mt-1 font-display text-[1.4rem] font-semibold leading-tight tracking-[-0.02em]">
              {t.symAskTitle}
            </h2>
            {!tip ? <p className="mt-1.5 text-sm leading-relaxed text-muted">{t.symAskSub}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="press inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-bg text-muted"
            aria-label={t.close}
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
          {!tip ? (
            <>
              <div data-testid="symptom-carousel" className="-mx-5 mt-5 flex snap-x scroll-px-5 gap-2 overflow-x-auto px-5 pb-2 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <div className="snap-start">
                  <CircleChip
                    size="sm"
                    label={t.symAskNone}
                    icon="🌿"
                    tone="sage"
                    on={none}
                    onClick={() => {
                      haptic(10);
                      setNone((v) => !v);
                      setPicked([]);
                    }}
                  />
                </div>
                {QUICK_SYMPTOMS.map((id) => (
                  <div key={id} className="snap-start">
                    <CircleChip
                      size="sm"
                      label={pick(symptomLabel[id]!, lang)}
                      icon={SYMPTOM_EMOJI[id] ?? "•"}
                      tone="dust"
                      on={picked.includes(id)}
                      onClick={() => toggle(id)}
                    />
                  </div>
                ))}
              </div>
              <button
                type="button"
                data-testid="symptom-apply"
                disabled={busy || (!none && picked.length === 0)}
                onClick={() => void apply()}
                className="press mt-4 flex h-14 w-full items-center justify-center rounded-full bg-primary text-base font-semibold text-primary-fg shadow-card transition-opacity disabled:opacity-45"
              >
                {t.symAskApply}
              </button>
              <Link
                to="/app/registro"
                onClick={() => {
                  markAsked(day, "more");
                  onClose();
                }}
                className="mt-2 flex min-h-11 items-center justify-center text-sm font-semibold text-sage-deep"
              >
                {t.symAskMore}
              </Link>
            </>
          ) : (
            <div className="mt-4 space-y-3">
              <WrapUpCard tip={tip} wrapUpPaid={wrapUpPaid} depth={wrapUpPaid ? "full" : "teaser"} />
              <button
                type="button"
                onClick={onClose}
                className="press flex h-12 w-full items-center justify-center rounded-full bg-surface text-sm font-semibold shadow-card ring-1 ring-border"
              >
                {t.symAskDone}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
