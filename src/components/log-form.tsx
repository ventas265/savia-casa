import { Heart } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/lib/i18n";
import { writeLog } from "@/lib/savia-api";
import { pick, symptomLabel } from "@/lib/savia-content";
import { FLOWS, MUCUS, SYMPTOMS, type DailyLog, type Flow, type Mucus } from "@/lib/types";
import { cn } from "@/lib/utils";

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
  const [periodStarted, setPeriodStarted] = useState(initial?.periodStarted || false);
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

  function toggle(id: string) {
    setSymptoms((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  }

  async function save() {
    setBusy(true);
    try {
      const res = await writeLog({
          day,
          flow,
          mood,
          energy,
          sleepHours,
          notes,
          symptoms,
          periodStarted,
          mucus,
          sex: paid ? sex : undefined,
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
      <div className="relative overflow-hidden rounded-[1.6rem] bg-[#ffd6e0] p-5 shadow-card">
        <span className="absolute -right-6 -top-6 size-24 rounded-full bg-white/30" />
        <p className="relative text-sm font-bold">{t.flow}</p>
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
        <button
          type="button"
          onClick={() => {
            if (!paid) {
              toast.error(t.sexPay);
              return;
            }
            setSex((s) => !s);
          }}
          className={cn(
            "mt-3 inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm",
            sex && paid ? "bg-primary text-primary-fg" : "bg-bg text-fg",
          )}
        >
          <Heart className={cn("size-4", sex && paid && "fill-current")} />
          {sex && paid ? t.sexOn : t.sexOff}
        </button>
        {paid ? null : <p className="mt-2 text-xs text-muted">{t.sexPay}</p>}
      </div>

      <div className="relative overflow-hidden rounded-[1.6rem] bg-[#d4f7f1] p-5 shadow-card">
        <span className="absolute -right-8 -bottom-8 size-24 rounded-full bg-white/40" />
        <p className="relative text-sm font-bold">{t.mucus}</p>
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

      <div className="relative overflow-hidden rounded-[1.6rem] bg-[#e8dcff] p-5 shadow-card">
        <p className="text-sm font-bold">{t.symptoms}</p>
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

      <div className="relative overflow-hidden rounded-[1.6rem] bg-[#ffe9b8] p-5 shadow-card">
        <p className="text-sm font-bold">{t.moodAsk}</p>
        <p className="mt-1 text-xs text-muted">{t.moodHint}</p>
        <div className="mt-3 grid grid-cols-5 gap-1.5">
          {(
            [
              [1, "😣", t.mood1],
              [2, "😕", t.mood2],
              [3, "🙂", t.mood3],
              [4, "😊", t.mood4],
              [5, "🤩", t.mood5],
            ] as const
          ).map(([n, face, label]) => (
            <button
              key={n}
              type="button"
              onClick={() => setMood(n)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-2xl py-3 text-[11px] leading-tight",
                mood === n ? "bg-primary text-primary-fg" : "bg-bg text-fg",
              )}
            >
              <span className="text-xl">{face}</span>
              {label}
            </button>
          ))}
        </div>

        <p className="mt-6 text-sm font-semibold">{t.energyAsk}</p>
        <p className="mt-1 text-xs text-muted">{t.energyHint}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {(
            [
              [1, t.energy1],
              [2, t.energy2],
              [3, t.energy3],
              [4, t.energy4],
              [5, t.energy5],
            ] as const
          ).map(([n, label]) => (
            <button
              key={n}
              type="button"
              onClick={() => setEnergy(n)}
              className={cn(
                "h-11 rounded-full px-4 text-sm",
                energy === n ? "bg-primary text-primary-fg" : "bg-bg text-fg",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <p className="mt-6 text-sm font-semibold">{t.sleepAsk}</p>
        <p className="mt-1 text-xs text-muted">{t.sleepHint}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {[4, 5, 6, 7, 8, 9, 10].map((h) => (
            <button
              key={h}
              type="button"
              onClick={() => setSleepHours(h)}
              className={cn(
                "h-11 min-w-12 rounded-full px-3 text-sm",
                sleepHours === h ? "bg-primary text-primary-fg" : "bg-bg text-fg",
              )}
            >
              {h === 10 ? "10+" : `${h} h`}
            </button>
          ))}
        </div>
      </div>

      <div className="relative overflow-hidden rounded-[1.6rem] bg-surface p-5 shadow-card">
        <Label htmlFor="notes">{t.notes}</Label>
        <Textarea id="notes" className="mt-2" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      <Button type="button" className="w-full" onClick={() => void save()} disabled={busy}>
        {t.save}
      </Button>
    </div>
  );
}
