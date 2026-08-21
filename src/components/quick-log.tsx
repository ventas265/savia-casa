import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { writeLog } from "@/lib/savia-api";
import { todayISO } from "@/lib/cycle";
import type { DailyLog, Flow } from "@/lib/types";
import { cn } from "@/lib/utils";
import { haptic } from "@/lib/haptic";
import { pick, symptomLabel } from "@/lib/savia-content";

const FLOWS: { id: Flow; ring: string }[] = [
  { id: "spotting", ring: "bg-primary/25" },
  { id: "light", ring: "bg-primary/50" },
  { id: "medium", ring: "bg-primary" },
  { id: "heavy", ring: "bg-plum" },
];

const QUICK: { id: string; dot: string }[] = [
  { id: "cramps", dot: "bg-accent" },
  { id: "bloating", dot: "bg-sand" },
  { id: "headache", dot: "bg-plum" },
  { id: "low_mood", dot: "bg-primary/70" },
];

export function QuickLog({
  initial,
  onSaved,
}: {
  initial: DailyLog | null;
  onSaved?: () => void;
}) {
  const { t, lang } = useI18n();
  const [flow, setFlow] = useState<Flow>(initial?.flow && initial.flow !== "none" ? initial.flow : "none");
  const [symptoms, setSymptoms] = useState<string[]>(initial?.symptoms ?? []);
  const [busy, setBusy] = useState(false);

  async function persist(nextFlow: Flow, nextSym: string[]) {
    setBusy(true);
    try {
      await writeLog({
        day: todayISO(),
        flow: nextFlow,
        mood: initial?.mood ?? null,
        energy: initial?.energy ?? null,
        sleepHours: initial?.sleepHours ?? null,
        notes: initial?.notes ?? "",
        symptoms: nextSym,
        periodStarted: nextFlow === "light" || nextFlow === "medium" || nextFlow === "heavy",
        mucus: initial?.mucus,
      });
      onSaved?.();
    } finally {
      setBusy(false);
    }
  }

  function tapFlow(id: Flow) {
    haptic(14);
    const next = flow === id ? "none" : id;
    setFlow(next);
    void persist(next, symptoms);
  }

  function tapSym(id: string) {
    haptic(14);
    const next = symptoms.includes(id) ? symptoms.filter((s) => s !== id) : [...symptoms, id].slice(0, 12);
    setSymptoms(next);
    void persist(flow, next);
  }

  const flowLabel: Record<Flow, string> = {
    none: t.flowNone,
    spotting: t.flowSpot,
    light: t.flowLight,
    medium: t.flowMed,
    heavy: t.flowHeavy,
  };

  return (
    <section className="relative mt-8">
      <p className="text-sm font-semibold">{t.quickLog}</p>
      <div className="mt-4 flex justify-between">
        {FLOWS.map((f) => (
          <button
            key={f.id}
            type="button"
            disabled={busy}
            onClick={() => tapFlow(f.id)}
            className="press flex w-[4.4rem] flex-col items-center gap-2"
          >
            <span
              className={cn(
                "flex size-14 items-center justify-center rounded-full",
                f.ring,
                flow === f.id ? "ring-4 ring-ink/20" : "opacity-80",
              )}
            />
            <span className="text-[11px] font-semibold">{flowLabel[f.id]}</span>
          </button>
        ))}
      </div>
      <div className="mt-6 flex justify-between">
        {QUICK.map((s) => (
          <button
            key={s.id}
            type="button"
            disabled={busy}
            onClick={() => tapSym(s.id)}
            className="press flex w-[4.4rem] flex-col items-center gap-2"
          >
            <span
              className={cn(
                "flex size-14 items-center justify-center rounded-full",
                s.dot,
                symptoms.includes(s.id) ? "ring-4 ring-ink/20" : "opacity-80",
              )}
            />
            <span className="text-[11px] font-semibold leading-tight">{pick(symptomLabel[s.id]!, lang)}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
