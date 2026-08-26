import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { writeLog } from "@/lib/savia-api";
import { todayISO } from "@/lib/cycle";
import type { DailyLog, Flow, Mucus } from "@/lib/types";
import { MUCUS } from "@/lib/types";
import { cn } from "@/lib/utils";
import { haptic } from "@/lib/haptic";
import { pick, symptomLabel } from "@/lib/savia-content";

const FLOWS: { id: Flow; ring: string }[] = [
  { id: "spotting", ring: "bg-primary/25" },
  { id: "light", ring: "bg-primary/50" },
  { id: "medium", ring: "bg-primary" },
  { id: "heavy", ring: "bg-plum" },
];

const FEEL = ["fatigue", "low_mood", "craving", "acne", "irritable"];
const BODY = ["cramps", "bloating", "headache", "breast", "backache", "nausea", "constipation"];

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
  const [mucus, setMucus] = useState<Mucus>(initial?.mucus || "none");

  function persist(nextFlow: Flow, nextSym: string[], nextMucus: Mucus) {
    void writeLog({
      day: todayISO(),
      flow: nextFlow,
      mood: initial?.mood ?? null,
      energy: initial?.energy ?? null,
      sleepHours: initial?.sleepHours ?? null,
      notes: initial?.notes ?? "",
      symptoms: nextSym,
      periodStarted: nextFlow === "light" || nextFlow === "medium" || nextFlow === "heavy",
      mucus: nextMucus,
    });
  }

  const flowLabel: Record<Flow, string> = {
    none: t.flowNone,
    spotting: t.flowSpot,
    light: t.flowLight,
    medium: t.flowMed,
    heavy: t.flowHeavy,
  };

  const mucusLabel: Record<Mucus, string> = {
    none: t.mucusNone,
    sticky: t.mucusSticky,
    creamy: t.mucusCreamy,
    eggwhite: t.mucusEgg,
    watery: t.mucusWatery,
  };

  function tapSym(id: string) {
    haptic(14);
    const next = symptoms.includes(id) ? symptoms.filter((s) => s !== id) : [...symptoms, id].slice(0, 16);
    setSymptoms(next);
    void persist(flow, next, mucus);
  }

  return (
    <section className="relative mt-6 rounded-[1.75rem] bg-surface p-5 shadow-card">
      <p className="font-display text-xl font-semibold">{t.quickLog}</p>
      <div className="mt-4 flex justify-between">
        {FLOWS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => {
              haptic(14);
              const next = flow === f.id ? "none" : f.id;
              setFlow(next);
              void persist(next, symptoms, mucus);
            }}
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

      <p className="mt-6 text-sm font-semibold">{t.howMorning}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {FEEL.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => tapSym(id)}
            className={cn(
              "press h-11 rounded-full px-4 text-sm font-semibold",
              symptoms.includes(id) ? "bg-primary text-primary-fg" : "bg-bg text-fg",
            )}
          >
            {pick(symptomLabel[id]!, lang)}
          </button>
        ))}
      </div>

      <p className="mt-6 text-sm font-semibold">{t.logBody}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {BODY.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => tapSym(id)}
            className={cn(
              "press h-11 rounded-full px-4 text-sm font-semibold",
              symptoms.includes(id) ? "bg-primary text-primary-fg" : "bg-bg text-fg",
            )}
          >
            {pick(symptomLabel[id]!, lang)}
          </button>
        ))}
      </div>

      <p className="mt-6 text-sm font-semibold">{t.mucus}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {MUCUS.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              haptic(14);
              setMucus(m);
              void persist(flow, symptoms, m);
            }}
            className={cn(
              "press h-11 rounded-full px-4 text-sm font-semibold",
              mucus === m ? "bg-accent text-ink" : "bg-bg text-fg",
            )}
          >
            {mucusLabel[m]}
          </button>
        ))}
      </div>

      <Link
        to="/app/registro"
        className="press mt-6 flex min-h-12 items-center justify-center rounded-full bg-bg text-sm font-semibold"
      >
        {t.logMore}
      </Link>
    </section>
  );
}
