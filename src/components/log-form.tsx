import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/lib/i18n";
import { saveLog } from "@/lib/savia-server";
import { pick, symptomLabel } from "@/lib/savia-content";
import { FLOWS, MUCUS, SYMPTOMS, type DailyLog, type Flow, type Mucus } from "@/lib/types";
import { cn } from "@/lib/utils";

export function LogForm({
  day,
  initial,
  onSaved,
}: {
  day: string;
  initial: DailyLog | null;
  onSaved?: (log: DailyLog) => void;
}) {
  const { t, lang } = useI18n();
  const [flow, setFlow] = useState<Flow>(initial?.flow || "none");
  const [mood, setMood] = useState(initial?.mood ?? 3);
  const [energy, setEnergy] = useState(initial?.energy ?? 3);
  const [sleepHours, setSleepHours] = useState(initial?.sleepHours ?? 7);
  const [notes, setNotes] = useState(initial?.notes || "");
  const [symptoms, setSymptoms] = useState<string[]>(initial?.symptoms || []);
  const [periodStarted, setPeriodStarted] = useState(initial?.periodStarted || false);
  const [mucus, setMucus] = useState<Mucus>(initial?.mucus || "none");
  const [busy, setBusy] = useState(false);

  const flowLabel: Record<Flow, string> = {
    none: t.flowNone,
    spotting: t.flowSpot,
    light: t.flowLight,
    medium: t.flowMed,
    heavy: t.flowHeavy,
  };

  function toggle(id: string) {
    setSymptoms((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  }

  async function save() {
    setBusy(true);
    try {
      const res = await saveLog({
        data: {
          day,
          flow,
          mood,
          energy,
          sleepHours,
          notes,
          symptoms,
          periodStarted,
          mucus,
        },
      });
      if (res.ok) {
        toast.success(t.saved);
        onSaved?.(res.log);
      } else toast.error(t.errorGeneric);
    } catch {
      toast.error(t.errorGeneric);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-3xl bg-surface p-5">
        <p className="text-sm font-semibold">{t.flow}</p>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {FLOWS.filter((f) => f !== "none").map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFlow(f)}
              className={cn(
                "rounded-2xl border py-4 text-xs font-medium",
                flow === f ? "border-primary bg-primary text-primary-fg" : "border-border bg-bg text-fg",
              )}
            >
              {flowLabel[f]}
            </button>
          ))}
        </div>
        <label className="mt-4 flex min-h-11 items-center gap-3 text-sm">
          <input
            type="checkbox"
            className="size-5 accent-primary"
            checked={periodStarted}
            onChange={(e) => {
              setPeriodStarted(e.target.checked);
              if (e.target.checked && flow === "none") setFlow("medium");
            }}
          />
          {t.periodStarted}
        </label>
      </div>

      <div className="rounded-3xl bg-surface p-5">
        <p className="text-sm font-semibold">{t.mucus}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {MUCUS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMucus(m)}
              className={cn(
                "h-11 rounded-full px-4 text-sm",
                mucus === m ? "bg-primary text-primary-fg" : "bg-bg text-fg",
              )}
            >
              {m === "none" ? t.mucusNone : m === "sticky" ? t.mucusSticky : m === "creamy" ? t.mucusCreamy : m === "eggwhite" ? t.mucusEgg : t.mucusWatery}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-3xl bg-surface p-5">
        <p className="text-sm font-semibold">{t.symptoms}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {SYMPTOMS.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => toggle(id)}
              className={cn(
                "h-11 rounded-full px-3 text-sm",
                symptoms.includes(id) ? "bg-primary text-primary-fg" : "bg-bg text-fg",
              )}
            >
              {pick(symptomLabel[id]!, lang)}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-3xl bg-surface p-5">
        <div className="space-y-4">
          <div>
            <Label>
              {t.mood}: {mood}
            </Label>
            <input type="range" min={1} max={5} value={mood} onChange={(e) => setMood(Number(e.target.value))} className="mt-2 w-full accent-primary" />
          </div>
          <div>
            <Label>
              {t.energy}: {energy}
            </Label>
            <input type="range" min={1} max={5} value={energy} onChange={(e) => setEnergy(Number(e.target.value))} className="mt-2 w-full accent-primary" />
          </div>
          <div>
            <Label>
              {t.sleep}: {sleepHours}
            </Label>
            <input type="range" min={0} max={12} step={0.5} value={sleepHours} onChange={(e) => setSleepHours(Number(e.target.value))} className="mt-2 w-full accent-primary" />
          </div>
        </div>
      </div>

      <div className="rounded-3xl bg-surface p-5">
        <Label htmlFor="notes">{t.notes}</Label>
        <Textarea id="notes" className="mt-2" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      <Button type="button" className="w-full" onClick={() => void save()} disabled={busy}>
        {t.save}
      </Button>
    </div>
  );
}
