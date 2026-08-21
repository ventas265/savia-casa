import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { writeLog } from "@/lib/savia-api";
import { haptic } from "@/lib/haptic";
import { pick, symptomLabel } from "@/lib/savia-content";
import { MUCUS, SYMPTOMS, type DailyLog, type Flow, type Mucus } from "@/lib/types";
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
  const [mood, setMood] = useState(initial?.mood ?? 3);
  const [energy, setEnergy] = useState(initial?.energy ?? 3);
  const [sleepHours, setSleepHours] = useState(initial?.sleepHours ?? 7);
  const [notes, setNotes] = useState(initial?.notes || "");
  const [symptoms, setSymptoms] = useState<string[]>(initial?.symptoms || []);
  const [mucus, setMucus] = useState<Mucus>(initial?.mucus || "none");
  const [sex, setSex] = useState(Boolean(initial?.sex));
  const [busy, setBusy] = useState(false);

  const flowLabel: Record<Flow, string> = {
    none: t.flowNone,
    spotting: t.flowSpot,
    light: t.flowLight,
    medium: t.flowMed,
    heavy: t.flowHeavy,
  };

  async function persist(patch: Partial<{
    flow: Flow;
    mood: number;
    energy: number;
    sleepHours: number;
    notes: string;
    symptoms: string[];
    mucus: Mucus;
    sex: boolean;
  }>) {
    const next = {
      flow: patch.flow ?? flow,
      mood: patch.mood ?? mood,
      energy: patch.energy ?? energy,
      sleepHours: patch.sleepHours ?? sleepHours,
      notes: patch.notes ?? notes,
      symptoms: patch.symptoms ?? symptoms,
      mucus: patch.mucus ?? mucus,
      sex: patch.sex ?? sex,
    };
    haptic(12);
    setBusy(true);
    try {
      const res = await writeLog({
        day,
        ...next,
        periodStarted: next.flow === "light" || next.flow === "medium" || next.flow === "heavy",
        sex: paid ? next.sex : undefined,
      });
      if (res.ok) onSaved?.(res.log);
    } catch {
      toast.error(t.errorGeneric);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
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
        <p className="text-sm font-semibold">{t.symptoms}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {SYMPTOMS.map((id) => (
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
        {paid ? (
          <button
            type="button"
            onClick={() => {
              const next = !sex;
              setSex(next);
              void persist({ sex: next });
            }}
            className={cn(
              "press mt-4 inline-flex min-h-12 items-center rounded-full px-5 text-sm font-semibold",
              sex ? "bg-primary text-primary-fg" : "bg-surface text-fg shadow-card",
            )}
          >
            {sex ? t.sexOn : t.sexOff}
          </button>
        ) : (
          <p className="mt-3 text-xs text-muted">{t.sexPay}</p>
        )}
      </section>

      <Button type="button" className="w-full" onClick={() => void persist({ notes })} disabled={busy}>
        {t.save}
      </Button>
    </div>
  );
}
