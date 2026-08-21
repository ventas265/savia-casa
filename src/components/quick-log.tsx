import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { writeLog } from "@/lib/savia-api";
import { todayISO } from "@/lib/cycle";
import type { DailyLog, Flow } from "@/lib/types";
import { cn } from "@/lib/utils";
import { symptomLabel, pick } from "@/lib/savia-content";

const FLOWS: { id: Flow; cls: string }[] = [
  { id: "spotting", cls: "bg-primary/25 text-ink" },
  { id: "light", cls: "bg-primary/50 text-primary-fg" },
  { id: "medium", cls: "bg-primary/80 text-primary-fg" },
  { id: "heavy", cls: "bg-primary text-primary-fg" },
];

const QUICK = ["cramps", "bloating", "headache", "low_mood"] as const;

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
    const next = flow === id ? "none" : id;
    setFlow(next);
    void persist(next, symptoms);
  }

  function tapSym(id: string) {
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
    <section className="relative mt-6">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted">{t.quickLog}</p>
      <div className="mt-3 flex justify-between gap-2">
        {FLOWS.map((f) => (
          <button
            key={f.id}
            type="button"
            disabled={busy}
            onClick={() => tapFlow(f.id)}
            className={cn(
              "flex h-16 flex-1 flex-col items-center justify-center rounded-2xl text-[11px] font-semibold",
              flow === f.id ? f.cls : "bg-surface text-fg shadow-card",
            )}
          >
            <span className={cn("mb-1 size-3 rounded-full", flow === f.id ? "bg-white/80" : "bg-primary/40")} />
            {flowLabel[f.id]}
          </button>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {QUICK.map((id) => (
            <button
              key={id}
              type="button"
              disabled={busy}
              onClick={() => tapSym(id)}
              className={cn(
                "h-11 rounded-full px-4 text-sm font-semibold",
                symptoms.includes(id) ? "bg-ink text-primary-fg" : "bg-surface text-fg shadow-card",
              )}
            >
              {pick(symptomLabel[id]!, lang)}
            </button>
          ))}
      </div>
    </section>
  );
}
