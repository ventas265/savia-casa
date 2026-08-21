import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Droplets, Plus } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { CYCLE_CHOICES, daysUntil, formatLong, todayISO, weekStrip } from "@/lib/cycle";
import { foodsFor, pick, teaFor, phaseName } from "@/lib/savia-content";
import type { Phase, Stage } from "@/lib/types";
import { cn } from "@/lib/utils";
import { AskGlyph } from "@/components/ask-fab";
import { maybeNotify, periodAlert } from "@/lib/notify";

const DOW_ES = ["D", "L", "M", "X", "J", "V", "S"];
const DOW_EN = ["S", "M", "T", "W", "T", "F", "S"];

export function TodayHero({
  stage,
  phase,
  nextPeriod,
  cycleLength = 28,
  name,
  onCal,
  onLog,
  onGuia,
  onAsk,
  onCameToday,
  onCycleChange,
  notify = false,
}: {
  stage: Stage;
  phase: Phase;
  nextPeriod?: string | null;
  cycleLength?: number;
  name?: string;
  onCal: () => void;
  onLog: () => void;
  onGuia: () => void;
  onAsk: () => void;
  onCameToday?: () => void;
  onCycleChange?: (n: number) => void;
  notify?: boolean;
}) {
  const { t, lang } = useI18n();
  const [adjust, setAdjust] = useState(false);
  const today = todayISO();
  const days = weekStrip(today);
  const left = daysUntil(nextPeriod ?? null);
  const onPeriod = phase === "menstrual";
  const fertile = phase === "ovulatory";
  const food = foodsFor(stage, phase)[0];
  const tea = teaFor(stage, phase);
  const dow = lang === "es" ? DOW_ES : DOW_EN;
  const kind = periodAlert(left, onPeriod);

  const hero =
    kind === "period"
      ? { kicker: null as string | null, title: t.periodToday }
      : kind === "today"
        ? { kicker: null, title: t.periodComesToday }
        : kind === "tomorrow"
          ? { kicker: null, title: t.periodComesTomorrow }
          : kind === "soon"
            ? { kicker: null, title: t.periodComesSoon }
            : kind === "late"
              ? { kicker: t.periodLate, title: `${Math.abs(left ?? 0)} ${t.daysLeft}` }
              : { kicker: t.periodIn, title: left == null ? "—" : `${left} ${left === 1 ? t.dayLeft : t.daysLeft}` };

  const chance = onPeriod ? t.chanceLow : fertile ? t.ovToday : t.chanceLow;

  const notifyTitle =
    kind === "period"
      ? t.periodToday
      : kind === "today"
        ? t.periodComesToday
        : kind === "tomorrow"
          ? t.periodComesTomorrow
          : kind === "soon"
            ? t.periodComesSoon
            : kind === "late"
              ? t.periodLate
              : fertile
                ? t.fertileToday
                : "";
  const notifyBody =
    kind === "period"
      ? t.notifyBodyPeriod
      : kind === "today"
        ? t.notifyBodyToday
        : kind === "tomorrow"
          ? t.notifyBodyTomorrow
          : kind === "soon"
            ? t.notifyBodySoon
            : kind === "late"
              ? t.notifyBodyLate
              : t.notifyBodyFertile;

  useEffect(() => {
    if (!notify) return;
    maybeNotify({ kind: kind ?? (fertile ? "fertile" : null), fertile, title: notifyTitle, body: notifyBody });
  }, [notify, kind, fertile, notifyTitle, notifyBody]);

  return (
    <div className="relative -mx-4 overflow-hidden px-4 pb-4">
      <p className="relative text-center text-sm font-semibold">{formatLong(today, lang)}</p>

      <div className="relative mt-4 grid grid-cols-7 text-center">
        {days.map((d) => {
          const isToday = d.iso === today;
          return (
            <div key={d.iso} className="flex flex-col items-center gap-2">
              <span className="text-xs font-semibold text-muted">{dow[d.dow]}</span>
              <span
                className={cn(
                  "flex size-10 items-center justify-center rounded-full text-base font-semibold",
                  isToday ? "bg-primary text-primary-fg shadow-card" : "bg-surface text-fg",
                )}
              >
                {d.date}
              </span>
            </div>
          );
        })}
      </div>

      <div className="hero-pop relative mt-12 text-center">
        {name ? <p className="mb-2 text-sm font-semibold text-muted">{t.hello}, {name}</p> : null}
        {hero.kicker ? <p className="text-lg font-semibold text-fg/80">{hero.kicker}</p> : null}
        <h1
          className={cn(
            "bg-gradient-to-br from-primary to-ink bg-clip-text font-extrabold tracking-tight text-transparent",
            hero.kicker ? "mt-1 text-6xl" : "text-5xl leading-[1.05]",
          )}
        >
          {hero.title}
        </h1>
        <p className="mt-4 text-base font-medium">{chance}</p>
        {!onPeriod && onCameToday ? (
          <button
            type="button"
            onClick={onCameToday}
            className="mt-5 min-h-12 rounded-full bg-primary px-6 text-sm font-semibold text-primary-fg shadow-card"
          >
            {t.cameToday}
          </button>
        ) : null}
        {onCycleChange ? (
          <div className="mt-6">
            <button
              type="button"
              onClick={() => setAdjust((v) => !v)}
              className="text-xs font-semibold text-muted underline-offset-4 hover:underline"
            >
              {adjust ? t.hideAdjust : t.adjustCycle}
            </button>
            {adjust ? (
              <div className="mt-2 flex flex-wrap justify-center gap-1.5">
                {CYCLE_CHOICES.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => onCycleChange(n)}
                    className={cn(
                      "h-10 min-w-10 rounded-full px-2 text-sm font-semibold",
                      cycleLength === n ? "bg-primary text-primary-fg shadow-card" : "bg-surface text-fg",
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="relative mt-10 grid grid-cols-3 gap-3">
        <ActionCircle label={t.logPeriod} onClick={onLog} tone="pink">
          <Droplets className="size-7" />
        </ActionCircle>
        <ActionCircle label={t.symptoms} onClick={onLog} tone="white">
          <Plus className="size-7" />
        </ActionCircle>
        <ActionCircle label={t.askMark} onClick={onAsk} tone="white">
          <AskGlyph className="size-8 text-primary" />
        </ActionCircle>
      </div>

      <div className="relative mt-10">
        <h2 className="text-lg font-bold">{t.dailyTips}</h2>
        <div className="-mx-4 mt-4 flex gap-3 overflow-x-auto px-4 pb-3">
          {cardsFor(stage, phase, lang, pick(food?.title ?? { es: "Comida del día", en: "Today’s plate" }, lang), pick(tea.name, lang)).map(
            (c) => (
              <TipCard
                key={c.title}
                kicker={c.kicker}
                title={c.title}
                wide={c.wide}
                tone={c.tone}
                onClick={c.go === "ask" ? onAsk : onGuia}
              >
                {c.art}
              </TipCard>
            ),
          )}
        </div>
      </div>
    </div>
  );
}

function ActionCircle({
  label,
  onClick,
  tone,
  children,
}: {
  label: string;
  onClick: () => void;
  tone: "pink" | "white";
  children: ReactNode;
}) {
  return (
    <button type="button" onClick={onClick} className="flex flex-col items-center gap-2">
      <span
        className={cn(
          "flex size-[4.4rem] items-center justify-center rounded-full shadow-card",
          tone === "pink" && "bg-primary text-primary-fg",
          tone === "white" && "bg-surface text-fg",
        )}
      >
        {children}
      </span>
      <span className="max-w-24 text-center text-xs font-semibold leading-snug">{label}</span>
    </button>
  );
}

function TipCard({
  kicker,
  title,
  wide,
  tone,
  onClick,
  children,
}: {
  kicker: string;
  title: string;
  wide?: boolean;
  tone: "cream" | "rose" | "wine" | "sand";
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative h-56 shrink-0 overflow-hidden rounded-[1.75rem] p-4 text-left shadow-card",
        wide ? "w-48" : "w-[9.5rem]",
        tone === "cream" && "bg-[#fbf6f2] text-ink",
        tone === "rose" && "bg-[#ead0ce] text-ink",
        tone === "wine" && "bg-[#6b2d3c] text-white",
        tone === "sand" && "bg-[#efe4d6] text-ink",
      )}
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] opacity-70">{kicker}</p>
      <p className="relative z-10 mt-1 text-[16px] font-extrabold leading-snug">{title}</p>
      <div className="absolute inset-x-2 bottom-0 h-28">{children}</div>
    </button>
  );
}

function cardsFor(stage: Stage, phase: Phase, lang: "es" | "en", food: string, tea: string) {
  const es = lang === "es";
  const phaseLine =
    stage === "peri"
      ? es
        ? "Ciclos que ya no miden igual"
        : "Cycles that no longer measure the same"
      : stage === "meno"
        ? es
          ? "El cuerpo después de la regla"
          : "The body after periods"
        : stage === "pregnancy"
          ? es
            ? "Esta semana, con calma"
            : "This week, slowly"
          : stage === "postpartum"
            ? es
              ? "Reparar no es rendirse"
              : "Repair is not giving up"
            : pick(phaseName[phase === "none" ? "luteal" : phase], lang);

  return [
    {
      kicker: es ? "Hoy" : "Today",
      title: phaseLine,
      wide: true,
      tone: "cream" as const,
      go: "guia" as const,
      art: <ArtDrop />,
    },
    {
      kicker: es ? "Té" : "Tea",
      title: es ? `${tea}. Y cuándo no` : `${tea}. And when not`,
      tone: "rose" as const,
      go: "guia" as const,
      art: <ArtLeaf />,
    },
    {
      kicker: es ? "Plato" : "Plate",
      title: food,
      tone: "sand" as const,
      go: "guia" as const,
      art: <ArtSteam />,
    },
    {
      kicker: es ? "Consulta" : "Clinic",
      title: es ? "Si esto, no esperes" : "If this, don’t wait",
      tone: "wine" as const,
      go: "guia" as const,
      art: <ArtPulse />,
    },
    {
      kicker: es ? "Savia" : "Savia",
      title: es ? "Dímelo, no lo googlees" : "Tell me, don’t google it",
      tone: "rose" as const,
      go: "ask" as const,
      art: <ArtDrop />,
    },
  ];
}

function ArtDrop() {
  return (
    <svg viewBox="0 0 160 120" className="h-full w-full" aria-hidden>
      <path d="M80 18c-22 32-38 50-38 68a38 38 0 0 0 76 0c0-18-16-36-38-68Z" fill="#c94b6a" />
      <path d="M72 44c8 10 12 18 12 28" stroke="#fff" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}

function ArtLeaf() {
  return (
    <svg viewBox="0 0 160 120" className="h-full w-full" aria-hidden>
      <path d="M30 88c28-52 78-62 108-52-18 40-62 62-108 52Z" fill="#c94b6a" />
      <path d="M42 84c32-8 62-28 86-52" stroke="#fff" strokeWidth="3" fill="none" opacity="0.6" />
    </svg>
  );
}

function ArtSteam() {
  return (
    <svg viewBox="0 0 160 120" className="h-full w-full" aria-hidden>
      <path d="M40 70h80l-8 28H48Z" fill="#c94b6a" />
      <ellipse cx="80" cy="70" rx="42" ry="9" fill="#fbf6f2" />
      <path d="M64 48c0-12 10-16 10-24" stroke="#c94b6a" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M80 46c0-14 10-18 10-26" stroke="#c94b6a" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M96 50c0-10 8-14 8-22" stroke="#c94b6a" strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function ArtPulse() {
  return (
    <svg viewBox="0 0 160 120" className="h-full w-full" aria-hidden>
      <path
        d="M18 72h28l10-28 16 52 14-36 8 12h48"
        fill="none"
        stroke="#fbf6f2"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

