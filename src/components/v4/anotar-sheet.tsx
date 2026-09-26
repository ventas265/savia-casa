import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Check, ChevronLeft, ChevronRight, Info, Lock, Minus, Moon, Plus, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { writeLog } from "@/lib/savia-api";
import { haptic } from "@/lib/haptic";
import { useI18n } from "@/lib/i18n";
import { pick, symptomLabel } from "@/lib/savia-content";
import { fromISO, type DayMark } from "@/lib/cycle";
import { tipAfterSave, tipVisibleRecs } from "@/lib/savia-tip";
import { SEASONS } from "@/lib/v4-content";
import { symptomIcon } from "@/lib/symptom-meta";
import { DuoIcon, DUO_FOR_SYMPTOM, hasDuo } from "@/components/v4/duo-icons";
import { EmergencyCard } from "@/components/emergency-card";
import { SexChanceChip } from "@/components/log-form";
import {
  EMOTIONS,
  ENERGY,
  FLOWS_V2,
  MOODS,
  MUCUS_COMMON,
  MUCUS_V2,
  SEX_V2,
  buildPatch,
  desireOf,
  draftFrom,
  otherSymptoms,
  sleepParts,
  stepSleep,
  suggestedSymptoms,
  toSaveInput,
  toggle,
  withDesire,
  type Desire,
  type Draft,
} from "@/lib/anotar";
import type { DailyLog, Intention, Phase } from "@/lib/types";

type Lang = "es" | "en";
const L = (lang: Lang, es: string, en: string) => (lang === "es" ? es : en);

/** Mood flower (port of blossom() in anotar-v2/src/build.py). i = 0..4, null = closed bud. */
export function Blossom({ i, size = 200, uid }: { i: number | null; size?: number; uid: string }) {
  const m = MOODS[i ?? 2]!;
  const open = i == null ? 0.2 : m.open;
  const c1 = i == null ? "#C9BCC1" : m.c1;
  const c2 = i == null ? "#EFE7EA" : m.c2;
  const n = m.petals;
  const cx = size / 2;
  const R = size * 0.46 * open + size * 0.08;
  const petals: ReactNode[] = [];
  [
    [1, 0, 0.92],
    [0.68, 180 / n, 1],
  ].forEach(([scale, rot0, op], layer) => {
    const rr = R * scale!;
    const w = rr * (0.34 + 0.22 * open);
    for (let k = 0; k < n; k++) {
      const a = (k * 360) / n + rot0!;
      petals.push(
        <ellipse
          key={`${layer}-${k}`}
          cx={cx}
          cy={cx - rr / 2}
          rx={w / 2}
          ry={rr / 2}
          transform={`rotate(${a.toFixed(1)} ${cx} ${cx})`}
          fill={`url(#${uid}g)`}
          fillOpacity={op}
          stroke="#FFFFFF"
          strokeOpacity={0.55}
          strokeWidth={Math.max(1, size / 160)}
        />,
      );
    }
  });
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <defs>
        <radialGradient id={`${uid}g`} cx="50%" cy="50%" r="60%">
          <stop offset="0" stopColor={c2} />
          <stop offset="1" stopColor={c1} />
        </radialGradient>
        <radialGradient id={`${uid}c`} cx="50%" cy="45%" r="55%">
          <stop offset="0" stopColor="#FFF6EC" />
          <stop offset="1" stopColor={c2} />
        </radialGradient>
      </defs>
      {petals}
      <circle cx={cx} cy={cx} r={size * 0.09} fill={`url(#${uid}c)`} />
    </svg>
  );
}

function Drop({ level, on }: { level: number; on: boolean }) {
  const fill = [0, 0.25, 0.5, 0.75, 1][level] ?? 0;
  const y = 30 - 24 * fill;
  const d = "M15 2c5 7 11 13 11 19a11 11 0 0 1-22 0c0-6 6-12 11-19z";
  const id = `an-drop-${level}-${on ? 1 : 0}`;
  return (
    <svg width="30" height="34" viewBox="0 0 30 34" aria-hidden="true">
      <defs>
        <clipPath id={id}>
          <path d={d} />
        </clipPath>
      </defs>
      <path d={d} fill={on ? "#FFFFFF55" : "#F3DADD"} />
      {level > 0 ? <rect x="0" y={y} width="30" height="34" fill={on ? "#FFFFFF" : "#AB3549"} clipPath={`url(#${id})`} /> : null}
      <path d={d} fill="none" stroke={on ? "#fff" : "#AB3549"} strokeWidth="1.6" />
    </svg>
  );
}

function SymIcon({ id, size = 24, on = false }: { id: string; size?: number; on?: boolean }) {
  const duo = DUO_FOR_SYMPTOM[id];
  if (duo && hasDuo(duo)) return <DuoIcon name={duo} size={size} fill={on ? "#FFFFFF" : "#E3A07A55"} />;
  return <>{symptomIcon(id, size > 24 ? "size-7" : "size-5")}</>;
}

const symName = (id: string, lang: Lang) => pick(symptomLabel[id] ?? { es: id, en: id }, lang);

export type AnotarProps = {
  day: string;
  log: DailyLog | null;
  name: string;
  phase: Phase;
  cycleDay: number | null;
  dayMark: DayMark | null;
  nextPeriod: string | null;
  repeatSymptom: string | null;
  intention: Intention | null;
  wrapUpPaid: boolean;
  onClose: () => void;
  onSaved: (log: DailyLog) => void;
};

/** «Anotar mi día» v2: 4 optional steps + saved summary, over Hoy. Saves into the same DailyLog row as the old form. */
export function AnotarSheet(props: AnotarProps) {
  const { day, log, name, phase, cycleDay, dayMark, nextPeriod, repeatSymptom, intention, wrapUpPaid, onClose, onSaved } = props;
  const { lang } = useI18n();
  const navigate = useNavigate();
  const initial = useMemo(() => draftFrom(log), [log]);
  const [d, setD] = useState<Draft>(initial);
  const [step, setStep] = useState(0); // 0..3 steps, 4 = saved
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState<DailyLog | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const season = phase !== "none" ? SEASONS[phase] : null;

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0 });
  }, [step]);

  const set = (patch: Partial<Draft>) => {
    haptic(8);
    setD((cur) => ({ ...cur, ...patch }));
  };
  const toggleSym = (id: string) => set({ symptoms: toggle(d.symptoms, id) });

  const dt = fromISO(day);
  const dateLbl = dt.toLocaleDateString(lang === "es" ? "es-VE" : "en-US", { weekday: "short", day: "numeric", month: "short" }).replace(/\./g, "").replace(",", "");
  const eyebrow = [
    dateLbl.charAt(0).toUpperCase() + dateLbl.slice(1),
    cycleDay ? `${L(lang, "Día", "Day")} ${cycleDay}` : null,
    season ? pick(season.short, lang) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const sugg = suggestedSymptoms(phase, repeatSymptom);
  const others = otherSymptoms(
    sugg.map((s) => s.id),
    d.symptoms,
  );
  const phaseWord = season ? pick(season.short, lang).toLowerCase() : "";

  async function save() {
    if (busy) return;
    const changed = Object.keys(buildPatch(initial, d)).length > 0;
    if (!changed && log) {
      setSaved(log);
      setStep(4);
      return;
    }
    setBusy(true);
    try {
      const res = await writeLog(toSaveInput(day, d));
      if (res.ok) {
        haptic(16);
        setSaved(res.log);
        onSaved(res.log);
        setStep(4);
      } else toast.error(L(lang, "No se pudo guardar. Intenta de nuevo.", "Couldn’t save. Try again."));
    } catch {
      toast.error(L(lang, "No se pudo guardar. Intenta de nuevo.", "Couldn’t save. Try again."));
    } finally {
      setBusy(false);
    }
  }

  const moodIdx = d.mood != null && d.mood >= 1 ? Math.min(5, Math.round(d.mood)) - 1 : null;
  // «Normal» desire has no stored id: it means neither libido_up nor libido_down.
  const [desireUi, setDesireUi] = useState<Desire | "normal">(desireOf(initial.symptoms));
  const sleepOn = d.sleepHours != null;
  const sp = sleepParts(d.sleepHours ?? 7);
  const nextLbl = nextPeriod
    ? fromISO(nextPeriod).toLocaleDateString(lang === "es" ? "es-VE" : "en-US", { day: "numeric", month: "short" }).replace(/\./g, "")
    : null;
  const commonMucus = MUCUS_COMMON[phase];

  const titles = [
    L(lang, "¿Cómo te sientes?", "How do you feel?"),
    L(lang, "¿Y tu cuerpo?", "And your body?"),
    L(lang, "¿Te llegó la regla?", "Did your period come?"),
    L(lang, "Lo íntimo", "Intimate"),
  ];
  const subs = [
    "",
    L(lang, "Lo primero es lo que suele pasarte en esta fase.", "First, what usually shows up in this phase."),
    nextLbl && phase !== "menstrual" ? L(lang, `Tu regla se espera hacia el ${nextLbl}.`, `Your period is expected around ${nextLbl}.`) : "",
    L(lang, "Opcional. Solo tú lo ves.", "Optional. Only you see it."),
  ];

  return (
    <div className="an-wrap" role="dialog" aria-modal="true" aria-label={step < 4 ? L(lang, `Anotar mi día, paso ${step + 1} de 4`, `Log my day, step ${step + 1} of 4`) : L(lang, "Tu día quedó guardado", "Your day is saved")} data-testid="anotar-sheet" data-step={step}>
      {season ? <div className="an-bgphoto" style={{ backgroundImage: `url(${season.photo})` }} aria-hidden /> : null}
      <section className="an-sheet">
        <div className="an-grab" aria-hidden />
        {step < 4 ? (
          <>
            <div className="an-head">
              <div className="an-lh">
                <div className="an-prog" aria-hidden>
                  {[0, 1, 2, 3].map((k) => (
                    <i key={k} className={k <= step ? "on" : ""} />
                  ))}
                </div>
                <span className="an-pct">{L(lang, `${step + 1} de 4`, `${step + 1} of 4`)}</span>
                <button ref={closeRef} type="button" className="an-x" aria-label={L(lang, "Cerrar", "Close")} onClick={onClose} data-testid="anotar-close">
                  <X className="size-5" />
                </button>
              </div>
              <p className="an-eyebrow">{eyebrow}</p>
              <h2 className="an-q">{titles[step]}</h2>
              {subs[step] ? <p className="an-qs">{subs[step]}</p> : null}
            </div>
            <div className="an-body" ref={bodyRef}>
              {step === 0 ? (
                <>
                  <div className="an-bloom">
                    <Blossom i={moodIdx} size={200} uid="anbig" />
                    <p className={moodIdx == null ? "an-mood empty" : "an-mood"} aria-live="polite">
                      {moodIdx == null ? L(lang, "Toca cómo estás", "Tap how you are") : pick({ es: MOODS[moodIdx]!.es, en: MOODS[moodIdx]!.en }, lang)}
                    </p>
                  </div>
                  <div className="an-stops" role="radiogroup" aria-label={L(lang, "Ánimo", "Mood")}>
                    {MOODS.map((m, i) => (
                      <button
                        key={m.value}
                        type="button"
                        role="radio"
                        aria-checked={d.mood === m.value}
                        className="an-ms"
                        data-testid={`anotar-mood-${m.value}`}
                        onClick={() => set({ mood: d.mood === m.value ? null : m.value })}
                      >
                        <Blossom i={i} size={40} uid={`ans${i}`} />
                        <span>{lang === "es" ? m.es : m.en}</span>
                      </button>
                    ))}
                  </div>
                  <p className="an-sec">
                    {L(lang, "¿Algo más?", "Anything else?")} <span>{L(lang, "Toca las que quieras", "Tap any")}</span>
                  </p>
                  <div className="an-chips">
                    {EMOTIONS.map((e) => {
                      const on = d.symptoms.includes(e.id);
                      return (
                        <button key={e.id} type="button" className="an-pc" aria-pressed={on} onClick={() => toggleSym(e.id)}>
                          {on ? <Check className="size-3.5" strokeWidth={2.6} /> : null}
                          {lang === "es" ? e.es : e.en}
                        </button>
                      );
                    })}
                  </div>
                  <div className="an-row">
                    <span>{L(lang, "Energía", "Energy")}</span>
                    <div className="an-seg" role="radiogroup" aria-label={L(lang, "Energía", "Energy")}>
                      {ENERGY.map((e) => (
                        <button
                          key={e.value}
                          type="button"
                          role="radio"
                          aria-checked={d.energy === e.value}
                          aria-label={lang === "es" ? e.es : e.en}
                          title={lang === "es" ? e.es : e.en}
                          onClick={() => set({ energy: d.energy === e.value ? null : e.value })}
                        >
                          {e.value}
                        </button>
                      ))}
                    </div>
                  </div>
                  <p className="mt-2 text-right text-[12.5px] font-medium text-muted" aria-hidden>
                    {d.energy ? (lang === "es" ? ENERGY[d.energy - 1]!.es : ENERGY[d.energy - 1]!.en) : L(lang, "1 sin pila · 5 mucha", "1 drained · 5 high")}
                  </p>
                </>
              ) : null}

              {step === 1 ? (
                <>
                  <p className="an-sec acc">
                    <Sparkles className="size-4" />
                    {cycleDay ? L(lang, `Para tu día ${cycleDay}`, `For your day ${cycleDay}`) : L(lang, "Para hoy", "For today")}
                  </p>
                  <div className="an-sgs">
                    {sugg.map((s) => {
                      const on = d.symptoms.includes(s.id);
                      return (
                        <button key={s.id} type="button" className="an-sg" aria-pressed={on} onClick={() => toggleSym(s.id)} data-testid={`anotar-sug-${s.id}`}>
                          <span className="an-sgi">
                            <SymIcon id={s.id} size={30} on={on} />
                          </span>
                          <span className="an-sgt">
                            <b>{symName(s.id, lang)}</b>
                            <small>
                              {s.why === "cycle"
                                ? L(lang, "Te pasa cada ciclo", "Happens every cycle")
                                : phaseWord
                                  ? L(lang, `Común en ${phaseWord}`, `Common in ${phaseWord}`)
                                  : L(lang, "Frecuente", "Common")}
                            </small>
                          </span>
                          {on ? (
                            <i className="an-ck">
                              <Check className="size-3" strokeWidth={3} />
                            </i>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                  <p className="an-sec">{L(lang, "Otros", "Others")}</p>
                  <div className="an-chips">
                    {others.map((id) => {
                      const on = d.symptoms.includes(id);
                      return (
                        <button key={id} type="button" className="an-pc ico" aria-pressed={on} onClick={() => toggleSym(id)}>
                          {on ? <Check className="size-3.5" strokeWidth={2.6} /> : <SymIcon id={id} size={20} />}
                          {symName(id, lang)}
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : null}

              {step === 2 ? (
                <>
                  <div className="an-fbs" role="radiogroup" aria-label={L(lang, "Regla", "Period")}>
                    {FLOWS_V2.map((f) => {
                      const on = d.flow === f.id;
                      return (
                        <button key={f.id} type="button" role="radio" aria-checked={on} className="an-fb" onClick={() => set({ flow: f.id })} data-testid={`anotar-flow-${f.id}`}>
                          <Drop level={f.level} on={on} />
                          <span>{lang === "es" ? f.es : f.en}</span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="an-sec">
                    {L(lang, "Flujo vaginal", "Discharge")} <span>{L(lang, "opcional", "optional")}</span>
                  </p>
                  <div className="an-mcs" role="radiogroup" aria-label={L(lang, "Flujo vaginal", "Discharge")}>
                    {MUCUS_V2.map((m) => {
                      const on = d.mucus === m.id;
                      const common = commonMucus === m.id;
                      const hint = common ? L(lang, "Común hoy", "Common today") : lang === "es" ? m.hintEs : m.hintEn;
                      return (
                        <button key={m.id} type="button" role="radio" aria-checked={on} className="an-mc" onClick={() => set({ mucus: on ? "none" : m.id })}>
                          <i style={{ background: m.color }} />
                          <span>
                            <b>{lang === "es" ? m.es : m.en}</b>
                            {hint ? <small className={common ? "common" : ""}>{hint}</small> : null}
                          </span>
                          {on ? (
                            <em className="an-ck">
                              <Check className="size-3" strokeWidth={3} />
                            </em>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                  <p className="an-hint">
                    <Info className="mt-px size-4 flex-none" />
                    {L(lang, "El flujo cambia con tu ciclo. Anotarlo afina tus predicciones. Toca de nuevo para quitarlo.", "Discharge changes with your cycle. Logging it sharpens your estimates. Tap again to clear it.")}
                  </p>
                </>
              ) : null}

              {step === 3 ? (
                <>
                  <div className="an-card">
                    <p className="an-mt">
                      <DuoIcon name="libido" size={22} fill="#F3DADD" />
                      {L(lang, "Sexo", "Sex")}
                    </p>
                    <div className="an-chips" role="radiogroup" aria-label={L(lang, "Sexo", "Sex")}>
                      {SEX_V2.map((s) => {
                        const on = d.sexKind === s.id;
                        return (
                          <button key={s.id} type="button" role="radio" aria-checked={on} aria-pressed={on} className="an-pc" onClick={() => set({ sexKind: s.id })} data-testid={`anotar-sex-${s.id}`}>
                            {on ? <Check className="size-3.5" strokeWidth={2.6} /> : null}
                            {lang === "es" ? s.es : s.en}
                          </button>
                        );
                      })}
                    </div>
                    {d.sexKind !== "none" ? <SexChanceChip mark={dayMark} /> : null}
                    {(d.sexKind === "unprotected" || d.sexKind === "withdrawal") && (dayMark === "fertile" || dayMark === "peak") ? (
                      <div className="mt-3">
                        <EmergencyCard day={day} onNavigate={onClose} />
                      </div>
                    ) : null}
                    <div className="an-row in">
                      <span>{L(lang, "Deseo", "Desire")}</span>
                      <div className="an-seg" role="radiogroup" aria-label={L(lang, "Deseo", "Desire")}>
                        {(
                          [
                            ["low", L(lang, "Bajo", "Low")],
                            ["normal", L(lang, "Normal", "Normal")],
                            ["high", L(lang, "Alto", "High")],
                          ] as const
                        ).map(([k, lbl]) => {
                          const on = desireUi === k;
                          return (
                            <button
                              key={k}
                              type="button"
                              role="radio"
                              aria-checked={on}
                              onClick={() => {
                                const next = on ? null : k;
                                setDesireUi(next);
                                set({ symptoms: withDesire(d.symptoms, next === "normal" ? null : (next as Desire)) });
                              }}
                            >
                              {lbl}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="an-card">
                    <p className="an-mt">
                      <Moon className="size-5" />
                      {L(lang, "Sueño", "Sleep")}
                    </p>
                    <div className="an-sleep">
                      <button type="button" className="an-pm" aria-label={L(lang, "Menos sueño (30 min)", "Less sleep (30 min)")} onClick={() => set({ sleepHours: stepSleep(d.sleepHours, -1) })}>
                        <Minus className="size-5" />
                      </button>
                      <div className="an-sv" aria-live="polite" data-testid="anotar-sleep">
                        {sleepOn ? (
                          <>
                            <span className="an-big">{sp.h}</span>
                            <span className="an-u">h</span>
                            <span className="an-big">{sp.m}</span>
                          </>
                        ) : (
                          <span className="font-display text-[20px] italic text-muted">{L(lang, "Sin anotar", "Not logged")}</span>
                        )}
                      </div>
                      <button type="button" className="an-pm" aria-label={L(lang, "Más sueño (30 min)", "More sleep (30 min)")} onClick={() => set({ sleepHours: stepSleep(d.sleepHours, 1) })}>
                        <Plus className="size-5" />
                      </button>
                    </div>
                    <div className="an-chips">
                      <button type="button" className="an-pc" aria-pressed={d.symptoms.includes("insomnia")} onClick={() => toggleSym("insomnia")}>
                        {d.symptoms.includes("insomnia") ? <Check className="size-3.5" strokeWidth={2.6} /> : null}
                        {L(lang, "Dormí mal", "Slept badly")}
                      </button>
                      {sleepOn ? (
                        <button type="button" className="an-pc" aria-pressed={false} onClick={() => set({ sleepHours: null })}>
                          {L(lang, "Quitar horas", "Clear hours")}
                        </button>
                      ) : null}
                    </div>
                  </div>
                  <div className="an-note">
                    <textarea
                      aria-label={L(lang, "Nota privada", "Private note")}
                      placeholder={L(lang, "Escribe algo solo para ti…", "Write something just for you…")}
                      maxLength={500}
                      value={d.notes}
                      onChange={(e) => setD((cur) => ({ ...cur, notes: e.target.value.slice(0, 500) }))}
                    />
                    <span className="v4-lock an-priv">
                      <Lock className="size-3" />
                      {L(lang, "Privada", "Private")}
                    </span>
                  </div>
                </>
              ) : null}
            </div>
            <div className="an-foot">
              {step > 0 ? (
                <button type="button" className="an-bk" aria-label={L(lang, "Atrás", "Back")} onClick={() => setStep(step - 1)}>
                  <ChevronLeft className="size-5" />
                </button>
              ) : null}
              {step < 3 ? (
                <button type="button" className="an-txt" onClick={() => void save()} disabled={busy} data-testid="anotar-save-now">
                  <Check className="size-4" />
                  {L(lang, "Guardar ya", "Save now")}
                </button>
              ) : null}
              {step < 3 ? (
                <button type="button" className="an-next" onClick={() => setStep(step + 1)} data-testid="anotar-next">
                  {L(lang, "Siguiente", "Next")}
                  <ChevronRight className="size-[18px]" strokeWidth={2.2} />
                </button>
              ) : (
                <button type="button" className="an-next" onClick={() => void save()} disabled={busy} data-testid="anotar-save">
                  {L(lang, "Guardar mi día", "Save my day")}
                  <ChevronRight className="size-[18px]" strokeWidth={2.2} />
                </button>
              )}
            </div>
          </>
        ) : (
          <Saved
            lang={lang}
            d={d}
            log={saved}
            name={name}
            phase={phase}
            cycleDay={cycleDay}
            intention={intention}
            wrapUpPaid={wrapUpPaid}
            day={day}
            closeRef={closeRef}
            onEdit={(s) => setStep(s)}
            onClose={onClose}
            onChat={() => {
              onClose();
              void navigate({ to: "/app/preguntar" });
            }}
          />
        )}
      </section>
    </div>
  );
}

function Saved({
  lang,
  d,
  log,
  name,
  phase,
  cycleDay,
  intention,
  wrapUpPaid,
  day,
  closeRef,
  onEdit,
  onClose,
  onChat,
}: {
  lang: Lang;
  d: Draft;
  log: DailyLog | null;
  name: string;
  phase: Phase;
  cycleDay: number | null;
  intention: Intention | null;
  wrapUpPaid: boolean;
  day: string;
  closeRef: React.RefObject<HTMLButtonElement | null>;
  onEdit: (step: number) => void;
  onClose: () => void;
  onChat: () => void;
}) {
  const doneRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    doneRef.current?.focus();
  }, []);
  void closeRef;
  const src: Draft = log ? draftFrom(log) : d;
  const season = phase !== "none" ? SEASONS[phase] : null;
  const moodIdx = src.mood ? Math.min(5, Math.round(src.mood)) - 1 : null;
  const emo = EMOTIONS.filter((e) => src.symptoms.includes(e.id)).map((e) => (lang === "es" ? e.es : e.en).toLowerCase());
  const body = src.symptoms.filter((s) => !EMOTIONS.some((e) => e.id === s) && !["libido_up", "libido_down", "insomnia"].includes(s));
  const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
  const none = L(lang, "Sin anotar", "Not logged");
  const flowL = FLOWS_V2.find((f) => f.id === src.flow)!;
  const mucL = MUCUS_V2.find((m) => m.id === src.mucus);
  const sexL = SEX_V2.find((s) => s.id === src.sexKind)!;
  const desire = desireOf(src.symptoms);
  const sp = src.sleepHours != null ? sleepParts(src.sleepHours) : null;

  const rows: { k: string; label: string; value: string; step: number }[] = [
    {
      k: "animo",
      label: L(lang, "Ánimo", "Mood"),
      value:
        [
          moodIdx != null ? (lang === "es" ? MOODS[moodIdx]!.es : MOODS[moodIdx]!.en) : null,
          ...emo,
          src.energy ? `${L(lang, "energía", "energy")} ${(lang === "es" ? ENERGY[src.energy - 1]!.es : ENERGY[src.energy - 1]!.en).toLowerCase()}` : null,
        ]
          .filter(Boolean)
          .join(" · ") || none,
      step: 0,
    },
    {
      k: "cuerpo",
      label: L(lang, "Cuerpo", "Body"),
      value: cap(body.map((s, i) => (i === 0 ? symName(s, lang) : symName(s, lang).toLowerCase())).join(", ")) || L(lang, "Nada que anotar", "Nothing to note"),
      step: 1,
    },
    {
      k: "regla",
      label: L(lang, "Regla", "Period"),
      value: [lang === "es" ? flowL.es : flowL.en, mucL ? `${L(lang, "flujo", "discharge")} ${(lang === "es" ? mucL.es : mucL.en).toLowerCase()}` : null].filter(Boolean).join(" · "),
      step: 2,
    },
    {
      k: "intimo",
      label: L(lang, "Íntimo", "Intimate"),
      value:
        [
          src.sexKind === "none" ? L(lang, "Sin sexo", "No sex") : `${L(lang, "Sexo", "Sex")} ${(lang === "es" ? sexL.es : sexL.en).toLowerCase()}`,
          desire ? `${L(lang, "deseo", "desire")} ${desire === "high" ? L(lang, "alto", "high") : L(lang, "bajo", "low")}` : null,
          sp ? `${sp.h}\u00a0h\u00a0${sp.m} ${L(lang, "de sueño", "of sleep")}` : null,
          src.symptoms.includes("insomnia") ? L(lang, "dormí mal", "slept badly") : null,
          src.notes.trim() ? L(lang, "nota", "note") : null,
        ]
          .filter(Boolean)
          .join(" · "),
      step: 3,
    },
  ];

  const tip = tipAfterSave({ phase, flow: src.flow, sexKind: src.sexKind, symptoms: src.symptoms, mood: src.mood, energy: src.energy, intention, lang });
  const rec = tipVisibleRecs(tip, wrapUpPaid ? "full" : "teaser").visible[0] ?? null;
  const first = name.trim().split(/\s+/)[0] || "";
  const bodyNames = body.slice(0, 2).map((s) => symName(s, lang).toLowerCase());
  const fit = season
    ? bodyNames.length
      ? L(
          lang,
          `${cap(bodyNames.join(" y "))} ${cycleDay ? `en tu día ${cycleDay} ` : ""}${bodyNames.length > 1 ? "encajan" : "encaja"} con tu ${pick(season.season, "es").toLowerCase()}. ${pick(season.line, "es")}`,
          `${cap(bodyNames.join(" and "))} ${cycleDay ? `on day ${cycleDay} ` : ""}${bodyNames.length > 1 ? "fit" : "fits"} your ${pick(season.season, "en").toLowerCase()}. ${pick(season.line, "en")}`,
        )
      : pick(season.line, lang)
    : tip.conclusion;

  const dt = fromISO(day);
  const head = dt.toLocaleDateString(lang === "es" ? "es-VE" : "en-US", { weekday: "long", day: "numeric" }).replace(",", "");

  return (
    <>
      <div className="an-body pt-1" data-testid="anotar-saved">
        <div className="an-dhero">
          <Blossom i={moodIdx ?? 3} size={112} uid="andone" />
          <div>
            <p className="an-eyebrow">
              {cap(head)}
              {cycleDay ? ` · ${L(lang, "Día", "Day")} ${cycleDay}` : ""}
            </p>
            <h2 className="an-q !text-[30px]" role="status">
              {L(lang, "Tu día quedó guardado", "Your day is saved")}
            </h2>
          </div>
        </div>
        <div className="an-recap">
          {rows.map((r) => (
            <div key={r.k} className="an-rr">
              <div>
                <small>{r.label}</small>
                <b>{r.value}</b>
              </div>
              <button type="button" className="an-ed" onClick={() => onEdit(r.step)} aria-label={`${L(lang, "Editar", "Edit")} ${r.label.toLowerCase()}`}>
                {L(lang, "Editar", "Edit")}
              </button>
            </div>
          ))}
        </div>
        <div className="an-msg">
          <img src="/v4/savia-avatar.webp" alt="" className="an-av" width={40} height={40} />
          <div className="an-bub">
            <span className="who">Savia</span>
            <p>{first ? L(lang, `Gracias por contarme, ${first}.`, `Thanks for telling me, ${first}.`) : L(lang, "Gracias por contarme.", "Thanks for telling me.")}</p>
            <p>{fit}</p>
            {rec ? (
              <p>
                <b>{L(lang, "Para hoy:", "For today:")}</b> {rec}
              </p>
            ) : null}
          </div>
        </div>
        <p className="an-plus">
          <Sparkles className="size-4 text-accent" />
          <span>
            {L(lang, "Sumé esto a ", "Added this to ")}
            <Link to="/app/patrones" onClick={onClose} className="font-bold text-ink underline-offset-2 hover:underline">
              {L(lang, "Tus patrones", "Your patterns")}
            </Link>
            .
          </span>
        </p>
      </div>
      <div className="an-foot col">
        <button ref={doneRef} type="button" className="an-next wide" onClick={onClose} data-testid="anotar-done">
          {L(lang, "Listo", "Done")}
        </button>
        <button type="button" className="an-second" onClick={onChat}>
          {L(lang, "Seguir hablando con Savia", "Keep talking with Savia")}
        </button>
      </div>
    </>
  );
}
