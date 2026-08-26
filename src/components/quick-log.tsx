import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { BatteryLow, Droplets, SmilePlus, Sparkles } from "lucide-react";
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
const BODY = ["cramps", "headache", "breast", "backache", "acne"];
const GUT = ["bloating", "nausea", "constipation", "diarrhea"];

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
    persist(flow, next, mucus);
  }

  return (
    <div id="anotar" className="relative mt-6 space-y-3">
      <Card tone="rose" icon={<Droplets className="size-4" />} title={t.quickLog}>
        <div className="flex justify-between">
          {FLOWS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => {
                haptic(14);
                const next = flow === f.id ? "none" : f.id;
                setFlow(next);
                persist(next, symptoms, mucus);
              }}
              className="press flex w-[4.2rem] flex-col items-center gap-2"
            >
              <span
                className={cn(
                  "flex size-12 items-center justify-center rounded-full",
                  f.ring,
                  flow === f.id ? "ring-4 ring-ink/20" : "opacity-80",
                )}
              />
              <span className="text-[11px] font-semibold">{flowLabel[f.id]}</span>
            </button>
          ))}
        </div>
      </Card>

      <Card tone="sand" icon={<BatteryLow className="size-4" />} title={t.howMorning}>
        <Chips ids={FEEL} selected={symptoms} onTap={tapSym} lang={lang} />
      </Card>

      <Card tone="plum" icon={<SmilePlus className="size-4" />} title={t.logBody}>
        <Chips ids={BODY} selected={symptoms} onTap={tapSym} lang={lang} />
      </Card>

      <Card tone="sage" icon={<Sparkles className="size-4" />} title={t.mucus}>
        <div className="flex flex-wrap gap-2">
          {MUCUS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                haptic(14);
                setMucus(m);
                persist(flow, symptoms, m);
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
        <p className="mt-5 text-sm font-semibold">{t.logGut}</p>
        <div className="mt-3">
          <Chips ids={GUT} selected={symptoms} onTap={tapSym} lang={lang} />
        </div>
      </Card>

      <Link
        to="/app/registro"
        className="press flex min-h-12 items-center justify-center rounded-full bg-surface text-sm font-semibold shadow-card"
      >
        {t.logMore}
      </Link>
    </div>
  );
}

function Card({
  tone,
  icon,
  title,
  children,
}: {
  tone: "rose" | "sand" | "plum" | "sage";
  icon: ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "rounded-[1.6rem] p-5 shadow-card",
        tone === "rose" && "bg-primary/10",
        tone === "sand" && "bg-sand/50",
        tone === "plum" && "bg-plum/10",
        tone === "sage" && "bg-accent/35",
      )}
    >
      <p className="mb-4 flex items-center gap-2 text-sm font-semibold">
        <span className="text-primary">{icon}</span>
        {title}
      </p>
      {children}
    </section>
  );
}

function Chips({
  ids,
  selected,
  onTap,
  lang,
}: {
  ids: string[];
  selected: string[];
  onTap: (id: string) => void;
  lang: "es" | "en";
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {ids.map((id) => (
        <button
          key={id}
          type="button"
          onClick={() => onTap(id)}
          className={cn(
            "press h-11 rounded-full px-4 text-sm font-semibold",
            selected.includes(id) ? "bg-primary text-primary-fg" : "bg-surface text-fg",
          )}
        >
          {pick(symptomLabel[id]!, lang)}
        </button>
      ))}
    </div>
  );
}
