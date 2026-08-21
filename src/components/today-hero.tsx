import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Droplets, Plus } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { CYCLE_CHOICES, daysUntil, formatLong, todayISO, weekStrip } from "@/lib/cycle";
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
        <div className="-mx-4 mt-4 flex gap-3 overflow-x-auto px-4 pb-2">
          {cardsFor(stage, phase, lang).map((c) => (
            <TipCard
              key={c.title}
              title={c.title}
              tone={c.tone}
              onClick={c.go === "log" ? onLog : c.go === "ask" ? onAsk : onGuia}
            >
              {c.art}
            </TipCard>
          ))}
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
  title,
  tone,
  onClick,
  children,
}: {
  title: string;
  tone: "sky" | "blush" | "night" | "peach";
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative h-52 w-36 shrink-0 overflow-hidden rounded-[1.5rem] p-3.5 text-left shadow-card",
        tone === "sky" && "bg-[#e7eef4] text-ink",
        tone === "blush" && "bg-[#f3c9d6] text-ink",
        tone === "night" && "bg-[#2b2438] text-white",
        tone === "peach" && "bg-[#f6ddd4] text-ink",
      )}
    >
      <p className="relative z-10 text-[15px] font-bold leading-snug">{title}</p>
      <div className="absolute inset-x-0 bottom-0 h-[7.2rem]">{children}</div>
    </button>
  );
}

function cardsFor(stage: Stage, phase: Phase, lang: "es" | "en") {
  const es = lang === "es";
  const symptoms = { title: es ? "Síntomas" : "Symptoms", tone: "sky" as const, go: "log" as const, art: <ArtHeart /> };
  if (stage === "peri") {
    return [
      symptoms,
      {
        title: es ? "SOP y peri: lo que debes saber" : "PCOS and peri: what to know",
        tone: "blush" as const,
        go: "guia" as const,
        art: <ArtLook />,
      },
      {
        title: es ? "Síntomas de la perimenopausia" : "Perimenopause symptoms",
        tone: "night" as const,
        go: "guia" as const,
        art: <ArtMoon />,
      },
      {
        title: es ? "Pregúntale a Savia" : "Ask Savia",
        tone: "peach" as const,
        go: "ask" as const,
        art: <ArtChat />,
      },
    ];
  }
  if (stage === "meno") {
    return [
      symptoms,
      {
        title: es ? "Sofocos, sueño y huesos" : "Flashes, sleep and bone",
        tone: "blush" as const,
        go: "guia" as const,
        art: <ArtMoon />,
      },
      {
        title: es ? "Qué sí ayuda en meno" : "What actually helps in meno",
        tone: "night" as const,
        go: "guia" as const,
        art: <ArtLook />,
      },
      {
        title: es ? "Pregúntale a Savia" : "Ask Savia",
        tone: "peach" as const,
        go: "ask" as const,
        art: <ArtChat />,
      },
    ];
  }
  if (stage === "pregnancy") {
    return [
      symptoms,
      {
        title: es ? "Comida y tés en el embarazo" : "Food and teas in pregnancy",
        tone: "blush" as const,
        go: "guia" as const,
        art: <ArtBowl />,
      },
      {
        title: es ? "Señales para ir a urgencias" : "When to go in",
        tone: "night" as const,
        go: "guia" as const,
        art: <ArtLook />,
      },
      {
        title: es ? "Pregúntale a Savia" : "Ask Savia",
        tone: "peach" as const,
        go: "ask" as const,
        art: <ArtChat />,
      },
    ];
  }
  if (stage === "postpartum") {
    return [
      symptoms,
      {
        title: es ? "Posparto: cuerpo y ánimo" : "Postpartum: body and mood",
        tone: "blush" as const,
        go: "guia" as const,
        art: <ArtHeart />,
      },
      {
        title: es ? "Cuándo vuelve la regla" : "When the period returns",
        tone: "night" as const,
        go: "guia" as const,
        art: <ArtMoon />,
      },
      {
        title: es ? "Pregúntale a Savia" : "Ask Savia",
        tone: "peach" as const,
        go: "ask" as const,
        art: <ArtChat />,
      },
    ];
  }
  const byPhase: Record<Exclude<Phase, "none">, { title: string; tone: "blush" | "night" }> = {
    menstrual: {
      title: es ? "Cólicos, hierro y calor" : "Cramps, iron and warmth",
      tone: "blush",
    },
    follicular: {
      title: es ? "Energía que vuelve" : "Energy coming back",
      tone: "blush",
    },
    ovulatory: {
      title: es ? "Ventana fértil, en claro" : "The fertile window, plainly",
      tone: "blush",
    },
    luteal: {
      title: es ? "Los días previos al periodo" : "The days before your period",
      tone: "blush",
    },
  };
  const extra = phase === "none" ? byPhase.luteal : byPhase[phase];
  return [
    symptoms,
    { ...extra, go: "guia" as const, art: <ArtLook /> },
    {
      title: es ? "Qué comer hoy" : "What to eat today",
      tone: "night" as const,
      go: "guia" as const,
      art: <ArtBowl />,
    },
    {
      title: es ? "Pregúntale a Savia" : "Ask Savia",
      tone: "peach" as const,
      go: "ask" as const,
      art: <ArtChat />,
    },
  ];
}

function ArtHeart() {
  return (
    <svg viewBox="0 0 144 120" className="h-full w-full" aria-hidden>
      <ellipse cx="72" cy="118" rx="70" ry="28" fill="#fff" opacity="0.9" />
      <circle cx="72" cy="64" r="32" fill="#f4c9c8" />
      <path
        d="M72 80c-10-9-22-4-22 6 0 12 22 22 22 22s22-10 22-22c0-10-12-15-22-6Z"
        fill="#c94b6a"
      />
    </svg>
  );
}

function ArtLook() {
  return (
    <svg viewBox="0 0 144 120" className="h-full w-full" aria-hidden>
      <ellipse cx="58" cy="70" rx="28" ry="36" fill="#fff" opacity="0.55" />
      <ellipse cx="58" cy="62" rx="18" ry="24" fill="#c94b6a" opacity="0.85" />
      <circle cx="96" cy="48" r="22" fill="none" stroke="#3a2428" strokeWidth="6" />
      <path d="M112 64 132 92" stroke="#3a2428" strokeWidth="8" strokeLinecap="round" />
    </svg>
  );
}

function ArtMoon() {
  return (
    <svg viewBox="0 0 144 120" className="h-full w-full" aria-hidden>
      <circle cx="74" cy="62" r="34" fill="#f4e4c4" />
      <circle cx="88" cy="52" r="28" fill="#2b2438" />
      <circle cx="62" cy="58" r="3" fill="#2b2438" />
      <path d="M56 74c6 6 16 6 22 0" stroke="#2b2438" strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function ArtBowl() {
  return (
    <svg viewBox="0 0 144 120" className="h-full w-full" aria-hidden>
      <path d="M32 58h80c-4 28-20 42-40 42S36 86 32 58Z" fill="#c94b6a" />
      <ellipse cx="72" cy="58" rx="40" ry="10" fill="#f6ddd4" />
      <path d="M60 40c0-10 8-16 8-16" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M78 36c0-8 6-14 6-14" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function ArtChat() {
  return (
    <svg viewBox="0 0 144 120" className="h-full w-full" aria-hidden>
      <path
        d="M28 38h70c10 0 18 8 18 18v22c0 10-8 18-18 18H58l-18 16v-16H28c-10 0-18-8-18-18V56c0-10 8-18 18-18Z"
        fill="#c94b6a"
      />
      <circle cx="48" cy="68" r="5" fill="#fff" />
      <circle cx="64" cy="68" r="5" fill="#fff" />
      <circle cx="80" cy="68" r="5" fill="#fff" />
    </svg>
  );
}

