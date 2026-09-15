import { useState } from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { writeLog } from "@/lib/savia-api";
import { haptic } from "@/lib/haptic";
import { pick, symptomLabel } from "@/lib/savia-content";
import { MUCUS, SEX_KINDS, type DailyLog, type Flow, type Mucus, type SexKind } from "@/lib/types";
import { cn } from "@/lib/utils";

const FLOW_DOT: { id: Flow; cls: string }[] = [
  { id: "spotting", cls: "bg-primary/25" },
  { id: "light", cls: "bg-primary/50" },
  { id: "medium", cls: "bg-primary" },
  { id: "heavy", cls: "bg-plum" },
];

export function LogForm({
  day,
  initial,
  paid = false,
  onSaved,
}: {
  day: string;
  initial: DailyLog | null;
  paid?: boolean;
  onSaved?: (log: DailyLog) => void;
}) {
  const { t, lang } = useI18n();
  const [flow, setFlow] = useState<Flow>(initial?.flow || "none");
  const [mood, setMood] = useState<number | null>(initial?.mood ?? null);
  const [energy, setEnergy] = useState<number | null>(initial?.energy ?? null);
  const [sleepHours, setSleepHours] = useState<number | null>(initial?.sleepHours ?? null);
  const [notes, setNotes] = useState(initial?.notes || "");
  const [symptoms, setSymptoms] = useState<string[]>(initial?.symptoms || []);
  const [mucus, setMucus] = useState<Mucus>(initial?.mucus || "none");
  const [sexKind, setSexKind] = useState<SexKind>(initial?.sexKind || (initial?.sex ? "unprotected" : "none"));
  const [busy, setBusy] = useState(false);

  const flowLabel: Record<Flow, string> = {
    none: t.flowNone,
    spotting: t.flowSpot,
    light: t.flowLight,
    medium: t.flowMed,
    heavy: t.flowHeavy,
  };

  const sexLabels: Record<Exclude<SexKind, "none">, string> = {
    protected: t.sexProtected,
    unprotected: t.sexUnprotected,
    withdrawal: t.sexWithdrawal,
  };

  function applyLog(log: DailyLog) {
    setFlow(log.flow);
    setMood(log.mood);
    setEnergy(log.energy);
    setSleepHours(log.sleepHours);
    setNotes(log.notes);
    setSymptoms(log.symptoms);
    setMucus(log.mucus);
    setSexKind(log.sexKind || (log.sex ? "unprotected" : "none"));
  }

  async function persist(patch: Partial<{
    flow: Flow;
    mood: number;
    energy: number;
    sleepHours: number;
    notes: string;
    symptoms: string[];
    mucus: Mucus;
    sexKind: SexKind;
  }>) {
    const next = {
      flow: patch.flow ?? flow,
      mood: patch.mood ?? mood,
      energy: patch.energy ?? energy,
      sleepHours: patch.sleepHours ?? sleepHours,
      notes: patch.notes ?? notes,
      symptoms: patch.symptoms ?? symptoms,
      mucus: patch.mucus ?? mucus,
      sexKind: patch.sexKind ?? sexKind,
    };
    const sex = next.sexKind !== "none";
    haptic(12);
    setBusy(true);
    try {
      const res = await writeLog({
        day,
        flow: next.flow,
        mood: next.mood,
        energy: next.energy,
        sleepHours: next.sleepHours,
        notes: next.notes,
        symptoms: next.symptoms,
        mucus: next.mucus,
        periodStarted: next.flow === "light" || next.flow === "medium" || next.flow === "heavy",
        // Notebook persistence: unlock sex marks when paid/beta; omit when gated so server keep existing.
        ...(paid ? { sex, sexKind: next.sexKind } : {}),
      });
      if (res.ok) {
        applyLog(res.log);
        onSaved?.(res.log);
      }
    } catch {
      toast.error(t.errorGeneric);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      {!initial ? (
        <p className="text-sm leading-relaxed text-muted">{t.emptyLog}</p>
      ) : null}
      {busy ? (
        <p className="text-xs font-medium text-muted" aria-live="polite">
          {t.loading}
        </p>
      ) : null}
      <section>
        <p className="text-sm font-semibold">{t.flow}</p>
        <div className="mt-4 flex justify-between">
          {FLOW_DOT.map((f) => (
            <button
              key={f.id}
              type="button"
              className="press flex w-[4.4rem] flex-col items-center gap-2"
              onClick={() => {
                const next = flow === f.id ? "none" : f.id;
                setFlow(next);
                void persist({ flow: next });
              }}
            >
              <span className={cn("size-14 rounded-full", f.cls, flow === f.id && "ring-4 ring-ink/20")} />
              <span className="text-[11px] font-semibold">{flowLabel[f.id]}</span>
            </button>
          ))}
        </div>
      </section>

      <section>
        <p className="text-sm font-semibold">{t.mucus}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {MUCUS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMucus(m);
                void persist({ mucus: m });
              }}
              className={cn(
                "press h-11 rounded-full px-4 text-sm font-semibold",
                mucus === m ? "bg-accent text-ink" : "bg-surface text-fg shadow-card",
              )}
            >
              {m === "none" ? t.mucusNone : m === "sticky" ? t.mucusSticky : m === "creamy" ? t.mucusCreamy : m === "eggwhite" ? t.mucusEgg : t.mucusWatery}
            </button>
          ))}
        </div>
      </section>

      <section>
        <p className="text-sm font-semibold">{t.logBody}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {["cramps", "headache", "bloating", "breast", "acne", "fatigue", "nausea", "constipation", "craving", "spotting", "dryness", "diarrhea", "backache", "hot_flash", "night_sweat"].map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                const next = symptoms.includes(id) ? symptoms.filter((s) => s !== id) : [...symptoms, id];
                setSymptoms(next);
                void persist({ symptoms: next });
              }}
              className={cn(
                "press h-11 rounded-full px-3 text-sm font-semibold",
                symptoms.includes(id) ? "bg-primary text-primary-fg" : "bg-surface text-fg shadow-card",
              )}
            >
              {pick(symptomLabel[id]!, lang)}
            </button>
          ))}
        </div>
        <p className="mt-6 text-sm font-semibold">{t.logMood}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {["low_mood", "anxiety", "irritable", "insomnia", "brain_fog", "libido_up", "libido_down", "pain_sex"].map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                const next = symptoms.includes(id) ? symptoms.filter((s) => s !== id) : [...symptoms, id];
                setSymptoms(next);
                void persist({ symptoms: next });
              }}
              className={cn(
                "press h-11 rounded-full px-3 text-sm font-semibold",
                symptoms.includes(id) ? "bg-primary text-primary-fg" : "bg-surface text-fg shadow-card",
              )}
            >
              {pick(symptomLabel[id]!, lang)}
            </button>
          ))}
        </div>
      </section>

      <section>
        <p className="text-sm font-semibold">{t.mood}</p>
        <div className="mt-3 flex justify-between">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              className="press flex size-12 items-center justify-center rounded-full"
              onClick={() => {
                setMood(n);
                void persist({ mood: n });
              }}
            >
              <span
                className={cn(
                  "size-10 rounded-full bg-sand",
                  mood === n ? "ring-4 ring-ink/20" : "opacity-50",
                )}
                style={{ transform: `scale(${0.7 + n * 0.08})` }}
              />
            </button>
          ))}
        </div>
        <p className="mt-5 text-sm font-semibold">{t.energy}</p>
        <div className="mt-3 flex justify-between">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              className="press flex size-12 items-center justify-center rounded-full"
              onClick={() => {
                setEnergy(n);
                void persist({ energy: n });
              }}
            >
              <span
                className={cn(
                  "size-10 rounded-full bg-accent",
                  energy === n ? "ring-4 ring-ink/20" : "opacity-50",
                )}
                style={{ transform: `scale(${0.7 + n * 0.08})` }}
              />
            </button>
          ))}
        </div>
        <p className="mt-5 text-sm font-semibold">{t.sleep}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {[5, 6, 7, 8, 9].map((h) => (
            <button
              key={h}
              type="button"
              onClick={() => {
                setSleepHours(h);
                void persist({ sleepHours: h });
              }}
              className={cn(
                "press h-11 min-w-12 rounded-full px-3 text-sm font-semibold",
                sleepHours === h ? "bg-plum text-primary-fg" : "bg-surface text-fg shadow-card",
              )}
            >
              {h} h
            </button>
          ))}
        </div>
      </section>

      <section>
        <p className="text-sm font-semibold">{t.notes}</p>
        <textarea
          className="mt-2 min-h-24 w-full resize-none rounded-[1.25rem] bg-surface px-4 py-3 text-sm shadow-card outline-none"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => void persist({ notes })}
        />
        <p className="mt-4 text-sm font-semibold">{sexKind !== "none" ? t.sexOn : t.sexOff}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {SEX_KINDS.map((kind) => {
            const on = sexKind === kind;
            return (
              <button
                key={kind}
                type="button"
                onClick={() => {
                  if (!paid) {
                    toast.error(t.sexPay);
                    return;
                  }
                  const next: SexKind = on ? "none" : kind;
                  setSexKind(next);
                  void persist({ sexKind: next });
                }}
                className={cn(
                  "press inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-xs font-semibold",
                  on ? "bg-primary text-primary-fg" : "bg-surface text-fg shadow-card",
                )}
              >
                <Heart className={cn("size-3.5", on && "fill-current")} />
                {sexLabels[kind as Exclude<SexKind, "none">]}
              </button>
            );
          })}
        </div>
        {paid ? null : <p className="mt-2 text-xs text-muted">{t.sexPay}</p>}
      </section>

      <Button type="button" className="w-full" onClick={() => void persist({ notes })} disabled={busy}>
        {t.save}
      </Button>
    </div>
  );
}
