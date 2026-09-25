import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { BatteryLow, Droplet, Droplets, SmilePlus, Sparkles } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { writeLog } from "@/lib/savia-api";
import { todayISO } from "@/lib/cycle";
import type { DailyLog, Flow, Mucus } from "@/lib/types";
import { MUCUS } from "@/lib/types";
import { cn } from "@/lib/utils";
import { haptic } from "@/lib/haptic";
import { pick, symptomLabel } from "@/lib/savia-content";

const FLOWS: { id: Flow; tint: string; drops: number }[] = [
  { id: "spotting", tint: "text-[#ffb3c4]", drops: 1 },
  { id: "light", tint: "text-[#ff8fa8]", drops: 1 },
  { id: "medium", tint: "text-[#ff6b8f]", drops: 2 },
  { id: "heavy", tint: "text-[#ff4f7b]", drops: 3 },
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
      // Omit sex: localSaveLog keeps existing sex/sexKind when updating feelings.
    }).then((res) => {
      if (res.ok) {
        setSymptoms(res.log.symptoms);
        setFlow(res.log.flow && res.log.flow !== "none" ? res.log.flow : "none");
        setMucus(res.log.mucus || "none");
        onSaved?.();
      }
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
    const next = symptoms.includes(id) ? symptoms.filter((s) => s !== id) : [...symptoms, id].slice(0, 24);
    setSymptoms(next);
    persist(flow, next, mucus);
  }

  return (
    <div id="anotar" className="relative mt-6 space-y-3">
      <Card tone="rose" icon={<Droplets className="size-4" strokeWidth={1.6} />} title={t.quickLog}>
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
                  "flex size-12 items-center justify-center gap-px rounded-full transition-colors",
                  flow === f.id
                    ? "bg-grad text-primary-fg shadow-[0_6px_22px_-4px_rgb(255_79_123/0.65)]"
                    : cn("bg-white/[0.055] ring-1 ring-white/10", f.tint),
                )}
              >
                {Array.from({ length: f.drops }).map((_, i) => (
                  <Droplet key={i} strokeWidth={1.6} className={f.drops === 1 ? "size-5" : "size-3.5"} />
                ))}
              </span>
              <span className={cn("text-[11px]", flow === f.id ? "font-semibold text-fg" : "font-medium text-muted")}>
                {flowLabel[f.id]}
              </span>
            </button>
          ))}
        </div>
      </Card>

      <Card tone="sand" icon={<BatteryLow className="size-4" strokeWidth={1.6} />} title={t.howMorning}>
        <Chips ids={FEEL} selected={symptoms} onTap={tapSym} lang={lang} />
      </Card>

      <Card tone="plum" icon={<SmilePlus className="size-4" strokeWidth={1.6} />} title={t.logBody}>
        <Chips ids={BODY} selected={symptoms} onTap={tapSym} lang={lang} />
      </Card>

      <Card tone="sage" icon={<Sparkles className="size-4" strokeWidth={1.6} />} title={t.mucus}>
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
                mucus === m ? "bg-select text-select-fg" : "bg-white/[0.06] text-fg ring-1 ring-white/10",
              )}
            >
              {mucusLabel[m]}
            </button>
          ))}
        </div>
        <p className="kicker mt-5">{t.logGut}</p>
        <div className="mt-3">
          <Chips ids={GUT} selected={symptoms} onTap={tapSym} lang={lang} />
        </div>
      </Card>

      <Link
        to="/app/registro"
        className="press glass flex min-h-12 items-center justify-center rounded-full text-sm font-semibold"
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
      className="glass rounded-[22px] p-4"
    >
      <p className="mb-4 flex items-center gap-2.5 font-display text-[16px] font-semibold tracking-[-0.02em]">
        <span
          className={cn(
            "flex size-8 items-center justify-center rounded-full bg-white/[0.06] ring-1 ring-white/10",
            tone === "rose" && "text-[#ff8fa8]",
            tone === "sand" && "text-[#ffb892]",
            tone === "plum" && "text-[#b9a6ff]",
            tone === "sage" && "text-[#7fe3c8]",
          )}
        >
          {icon}
        </span>
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
            selected.includes(id) ? "bg-select text-select-fg" : "bg-white/[0.06] text-fg ring-1 ring-white/10",
          )}
        >
          {pick(symptomLabel[id]!, lang)}
        </button>
      ))}
    </div>
  );
}
