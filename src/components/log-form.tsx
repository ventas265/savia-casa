import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ChevronDown, Droplet, Droplets, Ellipsis, Heart, Lock, Salad, Smile, Sparkles, Zap } from "lucide-react";
import { toast } from "sonner";
import { CircleChip } from "@/components/circle-chip";
import { useI18n } from "@/lib/i18n";
import { writeLog } from "@/lib/savia-api";
import { haptic } from "@/lib/haptic";
import { pick, symptomLabel } from "@/lib/savia-content";
import { asIsoDay, formatDay } from "@/lib/cycle";
import { tipAfterSave, tipVisibleRecs, type TipResult } from "@/lib/savia-tip";
import { setSelectedDay } from "@/lib/selected-day";
import { MUCUS, SEX_KINDS, type DailyLog, type Flow, type Intention, type Mucus, type Phase, type SexKind } from "@/lib/types";
import { cn } from "@/lib/utils";
import { SYMPTOM_EMOJI, TONE_CLS, type ChipTone } from "@/lib/symptom-meta";

const FLOW_DOT: { id: Flow; cls: string; drops: number }[] = [
  { id: "spotting", cls: "bg-primary/25 text-primary", drops: 1 },
  { id: "light", cls: "bg-primary/50 text-surface", drops: 1 },
  { id: "medium", cls: "bg-primary text-surface", drops: 2 },
  { id: "heavy", cls: "bg-plum text-surface", drops: 3 },
];

type CatKey = "flow" | "pain" | "mood" | "gut" | "skin" | "sex" | "other";

/** Existing stored symptom ids, regrouped Flo-style. Keys unchanged for data compat. */
const CAT_SYMPTOMS: Record<CatKey, string[]> = {
  flow: [],
  pain: ["cramps", "headache", "backache", "breast"],
  mood: ["low_mood", "anxiety", "irritable", "brain_fog"],
  gut: ["bloating", "nausea", "constipation", "diarrhea", "craving"],
  skin: ["acne", "dryness", "fatigue", "hot_flash", "night_sweat"],
  sex: ["libido_up", "libido_down", "pain_sex"],
  other: ["insomnia", "spotting"],
};

const CAT_TONE: Record<CatKey, ChipTone> = {
  flow: "rose",
  pain: "dust",
  mood: "sand",
  gut: "sage",
  skin: "plum",
  sex: "rose",
  other: "sage",
};

const MOOD_EMOJI = ["😣", "😕", "😐", "🙂", "😊"];
const ENERGY_EMOJI = ["🪫", "🥀", "🌿", "🌸", "⚡"];
const MUCUS_EMOJI: Record<Exclude<Mucus, "none">, string> = {
  sticky: "🫧",
  creamy: "🥛",
  eggwhite: "🥚",
  watery: "💧",
};
const SEX_EMOJI: Record<Exclude<SexKind, "none">, ReactNode> = {
  protected: <Heart className="size-6" />,
  unprotected: <Heart className="size-6 fill-current" />,
  withdrawal: <Heart className="size-6 fill-current opacity-60" />,
};

type LiveFields = {
  flow: Flow;
  mood: number | null;
  energy: number | null;
  sleepHours: number | null;
  notes: string;
  symptoms: string[];
  mucus: Mucus;
  sexKind: SexKind;
};

export function LogForm({
  day,
  initial,
  wrapUpPaid = false,
  phase = "none",
  intention = null,
  variant = "page",
  onSaved,
}: {
  day: string;
  initial: DailyLog | null;
  /** Full wrap-up only for real Serena/year plan — not betaPaid. */
  wrapUpPaid?: boolean;
  phase?: Phase;
  intention?: Intention | null;
  /** page = above the tab bar; sheet = inside a modal scroller. */
  variant?: "page" | "sheet";
  onSaved?: (log: DailyLog) => void;
}) {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const depth = wrapUpPaid ? "full" : "teaser";
  const dayIso = asIsoDay(day) || day.slice(0, 10);

  const [flow, setFlow] = useState<Flow>(initial?.flow || "none");
  const [mood, setMood] = useState<number | null>(initial?.mood ?? null);
  const [energy, setEnergy] = useState<number | null>(initial?.energy ?? null);
  const [sleepHours, setSleepHours] = useState<number | null>(initial?.sleepHours ?? null);
  const [notes, setNotes] = useState(initial?.notes || "");
  const [symptoms, setSymptoms] = useState<string[]>(initial?.symptoms || []);
  const [mucus, setMucus] = useState<Mucus>(initial?.mucus || "none");
  const [sexKind, setSexKind] = useState<SexKind>(initial?.sexKind || (initial?.sex ? "unprotected" : "none"));
  const [busy, setBusy] = useState(false);
  const [tip, setTip] = useState<TipResult | null>(null);
  const [openCat, setOpenCat] = useState<CatKey | null>("flow");
  const tipRef = useRef<HTMLDivElement>(null);
  const scrollTipOnSave = useRef(false);

  const live = useRef<LiveFields>({
    flow: initial?.flow || "none",
    mood: initial?.mood ?? null,
    energy: initial?.energy ?? null,
    sleepHours: initial?.sleepHours ?? null,
    notes: initial?.notes || "",
    symptoms: initial?.symptoms || [],
    mucus: initial?.mucus || "none",
    sexKind: initial?.sexKind || (initial?.sex ? "unprotected" : "none"),
  });
  const writeChain = useRef(Promise.resolve());
  const saveGen = useRef(0);

  useEffect(() => {
    live.current = { flow, mood, energy, sleepHours, notes, symptoms, mucus, sexKind };
  }, [flow, mood, energy, sleepHours, notes, symptoms, mucus, sexKind]);

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

  function toastSaved() {
    const msg = t.savedInMonth.replace("{date}", formatDay(dayIso, lang));
    toast.success(msg, {
      action: {
        label: t.viewInCalendar,
        onClick: () => {
          setSelectedDay(dayIso);
          void navigate({ to: "/app/calendario" });
        },
      },
    });
  }

  function persist(patch: Partial<LiveFields>) {
    live.current = { ...live.current, ...patch };
    const gen = ++saveGen.current;
    setBusy(true);
    haptic(12);

    writeChain.current = writeChain.current
      .catch(() => undefined)
      .then(async () => {
        const next = live.current;
        const sex = next.sexKind !== "none";
        try {
          const res = await writeLog({
            day: dayIso,
            flow: next.flow,
            mood: next.mood,
            energy: next.energy,
            sleepHours: next.sleepHours,
            notes: next.notes,
            symptoms: next.symptoms,
            mucus: next.mucus,
            periodStarted: next.flow === "light" || next.flow === "medium" || next.flow === "heavy",
            // Always send live sexKind (ref+queue) so a later flow/symptom tap cannot
            // wipe a heart with a stale React closure from an earlier render.
            sex,
            sexKind: next.sexKind,
          });
          if (res.ok) {
            if (gen === saveGen.current) {
              applyLog(res.log);
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
            }
            onSaved?.(res.log);
            if (gen === saveGen.current) {
              toastSaved();
              if (scrollTipOnSave.current) {
                scrollTipOnSave.current = false;
                requestAnimationFrame(() =>
                  tipRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }),
                );
              }
            }
          }
        } catch {
          if (gen === saveGen.current) toast.error(t.errorGeneric);
        } finally {
          if (gen === saveGen.current) setBusy(false);
        }
      });
  }

  function toggleSymptom(id: string) {
    const next = symptoms.includes(id) ? symptoms.filter((s) => s !== id) : [...symptoms, id].slice(0, 24);
    setSymptoms(next);
    persist({ symptoms: next });
  }

  const mucusLabel: Record<Exclude<Mucus, "none">, string> = {
    sticky: t.mucusSticky,
    creamy: t.mucusCreamy,
    eggwhite: t.mucusEgg,
    watery: t.mucusWatery,
  };
  const moodLabels = [t.moodScale1, t.moodScale2, t.moodScale3, t.moodScale4, t.moodScale5];
  const energyLabels = [t.energyScale1, t.energyScale2, t.energyScale3, t.energyScale4, t.energyScale5];

  const symCount = (cat: CatKey) => CAT_SYMPTOMS[cat].filter((id) => symptoms.includes(id)).length;
  const counts: Record<CatKey, number> = {
    flow: (flow !== "none" ? 1 : 0) + (mucus !== "none" ? 1 : 0),
    pain: symCount("pain"),
    mood: symCount("mood") + (mood != null && mood > 0 ? 1 : 0) + (energy != null && energy > 0 ? 1 : 0),
    gut: symCount("gut"),
    skin: symCount("skin"),
    sex: symCount("sex") + (sexKind !== "none" ? 1 : 0),
    other: symCount("other") + (sleepHours != null ? 1 : 0) + (notes.trim() ? 1 : 0),
  };

  const cats: { key: CatKey; label: string; icon: ReactNode }[] = [
    { key: "flow", label: t.logCatFlow, icon: <Droplets className="size-5" /> },
    { key: "pain", label: t.logCatPain, icon: <Zap className="size-5" /> },
    { key: "mood", label: t.logCatMood, icon: <Smile className="size-5" /> },
    { key: "gut", label: t.logCatGut, icon: <Salad className="size-5" /> },
    { key: "skin", label: t.logCatSkin, icon: <Sparkles className="size-5" /> },
    { key: "sex", label: t.logCatSex, icon: <Heart className="size-5" /> },
    { key: "other", label: t.logCatOther, icon: <Ellipsis className="size-5" /> },
  ];

  function symptomChips(cat: CatKey) {
    return (
      <ChipGrid>
        {CAT_SYMPTOMS[cat].map((id) => (
          <CircleChip
            key={id}
            label={pick(symptomLabel[id]!, lang)}
            icon={SYMPTOM_EMOJI[id] ?? "•"}
            tone={CAT_TONE[cat]}
            on={symptoms.includes(id)}
            onClick={() => toggleSymptom(id)}
          />
        ))}
      </ChipGrid>
    );
  }

  function body(cat: CatKey) {
    switch (cat) {
      case "flow":
        return (
          <>
            <SubLabel>{t.logSubFlow}</SubLabel>
            <ChipGrid>
              {FLOW_DOT.map((f) => (
                <CircleChip
                  key={f.id}
                  label={flowLabel[f.id]}
                  tone="rose"
                  circleClassName={f.cls}
                  icon={
                    <span className="flex items-end gap-px">
                      {Array.from({ length: f.drops }).map((_, i) => (
                        <Droplet key={i} className={cn("fill-current", f.drops === 1 ? "size-5" : "size-3.5")} />
                      ))}
                    </span>
                  }
                  on={flow === f.id}
                  onClick={() => {
                    const next = flow === f.id ? "none" : f.id;
                    setFlow(next);
                    persist({ flow: next });
                  }}
                />
              ))}
            </ChipGrid>
            <SubLabel className="mt-5">{t.logSubMucus}</SubLabel>
            <ChipGrid>
              {MUCUS.filter((m): m is Exclude<Mucus, "none"> => m !== "none").map((m) => (
                <CircleChip
                  key={m}
                  label={mucusLabel[m]}
                  icon={MUCUS_EMOJI[m]}
                  tone="sage"
                  on={mucus === m}
                  onClick={() => {
                    const next: Mucus = mucus === m ? "none" : m;
                    setMucus(next);
                    persist({ mucus: next });
                  }}
                />
              ))}
            </ChipGrid>
          </>
        );
      case "mood":
        return (
          <>
            <SubLabel>{t.logSubMoodScale}</SubLabel>
            <ChipRow>
              {[1, 2, 3, 4, 5].map((n) => (
                <CircleChip
                  key={n}
                  size="sm"
                  label={moodLabels[n - 1]!}
                  icon={MOOD_EMOJI[n - 1]}
                  tone="sand"
                  on={mood === n}
                  onClick={() => {
                    const next = mood === n ? null : n;
                    setMood(next);
                    persist({ mood: next });
                  }}
                />
              ))}
            </ChipRow>
            <SubLabel className="mt-5">{t.logSubEnergy}</SubLabel>
            <ChipRow>
              {[1, 2, 3, 4, 5].map((n) => (
                <CircleChip
                  key={n}
                  size="sm"
                  label={energyLabels[n - 1]!}
                  icon={ENERGY_EMOJI[n - 1]}
                  tone="sage"
                  on={energy === n}
                  onClick={() => {
                    const next = energy === n ? null : n;
                    setEnergy(next);
                    persist({ energy: next });
                  }}
                />
              ))}
            </ChipRow>
            <SubLabel className="mt-5">{t.logSubFeel}</SubLabel>
            {symptomChips("mood")}
          </>
        );
      case "sex":
        return (
          <>
            <SubLabel>{sexKind !== "none" ? t.sexOn : t.sexOff}</SubLabel>
            <ChipGrid>
              {SEX_KINDS.map((kind) => {
                const k = kind as Exclude<SexKind, "none">;
                const on = sexKind === kind;
                return (
                  <CircleChip
                    key={kind}
                    label={sexLabels[k]}
                    icon={<span className="text-primary">{SEX_EMOJI[k]}</span>}
                    tone="rose"
                    on={on}
                    onClick={() => {
                      const next: SexKind = on ? "none" : kind;
                      setSexKind(next);
                      persist({ sexKind: next });
                    }}
                  />
                );
              })}
            </ChipGrid>
            <SubLabel className="mt-5">{t.logSubDesire}</SubLabel>
            {symptomChips("sex")}
          </>
        );
      case "other":
        return (
          <>
            {symptomChips("other")}
            <SubLabel className="mt-5">{t.logSubSleep}</SubLabel>
            <div className="flex flex-wrap gap-2">
              {[5, 6, 7, 8, 9].map((h) => (
                <button
                  key={h}
                  type="button"
                  aria-pressed={sleepHours === h}
                  onClick={() => {
                    const next = sleepHours === h ? null : h;
                    setSleepHours(next);
                    persist({ sleepHours: next });
                  }}
                  className={cn(
                    "press h-11 min-w-12 rounded-full px-3 text-sm font-semibold transition-colors",
                    sleepHours === h
                      ? "bg-select text-select-fg ring-2 ring-select-ring ring-offset-2 ring-offset-surface"
                      : "bg-sage-soft text-fg",
                  )}
                >
                  {h} h
                </button>
              ))}
            </div>
            <SubLabel className="mt-5">{t.notes}</SubLabel>
            <textarea
              className="min-h-24 w-full resize-none rounded-2xl border border-border bg-bg/60 px-4 py-3 text-sm outline-none transition-colors focus:border-sage-deep/50"
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                live.current = { ...live.current, notes: e.target.value };
              }}
              onBlur={() => persist({ notes: live.current.notes })}
            />
          </>
        );
      default:
        return symptomChips(cat);
    }
  }

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <p className="font-display text-[1.35rem] font-semibold leading-tight tracking-[-0.02em]">{t.logSheetTitle}</p>
        <p className="text-sm leading-relaxed text-muted">{!initial ? t.emptyLog : t.logSheetSub}</p>
      </header>

      <div className="space-y-2.5">
        {cats.map((c) => {
          const open = openCat === c.key;
          const n = counts[c.key];
          const tone = TONE_CLS[CAT_TONE[c.key]];
          return (
            <section
              key={c.key}
              data-cat={c.key}
              className={cn(
                "overflow-hidden rounded-[1.4rem] border bg-surface transition-shadow duration-300",
                open ? "border-rose-dust/60 shadow-card" : "border-border/70 shadow-soft",
              )}
            >
              <button
                type="button"
                aria-expanded={open}
                aria-controls={`logcat-${c.key}`}
                onClick={() => setOpenCat(open ? null : c.key)}
                className="flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left"
              >
                <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-full", tone.icon)}>
                  {c.icon}
                </span>
                <span className="flex-1 text-[15px] font-semibold tracking-[-0.01em]">{c.label}</span>
                {n > 0 ? (
                  <span
                    className={cn("min-w-6 rounded-full px-2 py-0.5 text-center text-xs font-bold tabular-nums", tone.badge)}
                    aria-label={t.logSelectedCount.replace("{n}", String(n))}
                  >
                    {n}
                  </span>
                ) : null}
                <ChevronDown
                  className={cn("size-5 shrink-0 text-muted transition-transform duration-300", open && "rotate-180")}
                  aria-hidden
                />
              </button>
              <div
                id={`logcat-${c.key}`}
                className={cn(
                  "grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                  open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
                )}
                aria-hidden={!open}
                inert={!open}
              >
                <div className="min-h-0 overflow-hidden">
                  <div className="border-t border-border/60 px-4 pb-5 pt-4">{body(c.key)}</div>
                </div>
              </div>
            </section>
          );
        })}
      </div>

      {tip ? (
        <div ref={tipRef} className="pt-2">
          <WrapUpCard tip={tip} wrapUpPaid={wrapUpPaid} depth={depth} />
        </div>
      ) : null}

      {variant === "page" ? <div className="h-20" aria-hidden /> : null}
      <div
        className={cn(
          "z-30",
          // Page: fixed above the tab bar (+ its raised plus button) and safe-area.
          // Sheet: sticky to the bottom of the modal scroller (no tab bar there).
          variant === "page"
            ? "fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] left-1/2 w-full max-w-lg -translate-x-1/2 px-4 md:max-w-[28rem]"
            : "sticky bottom-0 -mx-1 pb-3 pt-3",
        )}
      >
        <button
          type="button"
          data-testid="log-save"
          className="press flex h-14 w-full items-center justify-center gap-2 rounded-full bg-primary text-base font-semibold text-primary-fg shadow-bar ring-4 ring-bg/80 transition-opacity disabled:opacity-70"
          onClick={() => {
            scrollTipOnSave.current = true;
            persist({ notes: live.current.notes });
          }}
          disabled={busy}
          aria-busy={busy}
        >
          {t.logSaveDay}
        </button>
      </div>
    </div>
  );
}

function SubLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn("mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted", className)}>{children}</p>
  );
}

function ChipGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-4 justify-items-center gap-x-1 gap-y-3">{children}</div>;
}

function ChipRow({ children }: { children: ReactNode }) {
  return <div className="flex justify-between gap-1">{children}</div>;
}

export function WrapUpCard({
  tip,
  wrapUpPaid,
  depth,
}: {
  tip: TipResult;
  wrapUpPaid: boolean;
  depth: "full" | "teaser";
}) {
  const { t } = useI18n();
  const { visible, locked } = tipVisibleRecs(tip, depth);

  return (
    <section
      className="rounded-[1.25rem] bg-primary/12 p-4 shadow-card ring-1 ring-primary/15"
      aria-live="polite"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t.saviaTipLabel}</p>
      <p className="mt-2 text-sm leading-relaxed text-fg">{tip.conclusion}</p>

      {visible.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {visible.map((rec) => (
            <li key={rec} className="flex gap-2 text-sm leading-snug text-fg">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
              <span>{rec}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {!wrapUpPaid && locked.length > 0 ? (
        <div className="relative mt-3 overflow-hidden rounded-2xl bg-surface/60 px-3 py-3">
          <ul className="space-y-2 blur-[3px] select-none" aria-hidden>
            {locked.map((rec) => (
              <li key={rec} className="flex gap-2 text-sm leading-snug text-fg">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                <span>{rec}</span>
              </li>
            ))}
          </ul>
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-primary/20 via-primary/10 to-transparent px-3">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 text-xs font-semibold text-fg shadow-card">
              <Lock className="size-3.5 shrink-0" aria-hidden />
              {t.saviaTipSerenaLock}
            </p>
          </div>
        </div>
      ) : null}

      {!wrapUpPaid ? (
        <div className="mt-4 rounded-2xl bg-ink/5 px-3 py-3">
          <p className="text-sm leading-snug text-fg">{t.saviaTipSerenaTeaser}</p>
          <Link
            to="/pagar"
            className="press mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-ink px-4 text-sm font-semibold text-primary-fg"
          >
            {t.saviaTipSerenaCta}
          </Link>
        </div>
      ) : null}

      <p className="mt-3 text-[11px] leading-relaxed text-muted">{t.saviaTipDisclaimer}</p>

      <Link
        to="/app/preguntar"
        className="press mt-3 inline-flex min-h-11 items-center justify-center rounded-full bg-surface px-4 text-sm font-semibold shadow-card"
      >
        {t.saviaTipAsk}
      </Link>
    </section>
  );
}
