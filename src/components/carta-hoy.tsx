import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { cartaDeHoy } from "@/lib/carta";
import { localFeelingToday, localSetFeeling, localStreak, type Feeling } from "@/lib/savia-local";
import { todayISO } from "@/lib/cycle";
import type { Phase, Stage } from "@/lib/types";
import { cn } from "@/lib/utils";

export function CartaHoy({
  name,
  stage,
  phase,
  onAsk,
}: {
  name?: string;
  stage: Stage;
  phase: Phase;
  onAsk: () => void;
}) {
  const { t, lang } = useI18n();
  const letter = cartaDeHoy(todayISO(), stage, phase, lang);
  const [feeling, setFeeling] = useState<Feeling | null>(() => localFeelingToday());
  const [streak, setStreak] = useState(() => localStreak());

  const chips: { id: Feeling; label: string }[] = [
    { id: "bien", label: t.feelOk },
    { id: "suave", label: t.feelSoft },
    { id: "pesada", label: t.feelHeavy },
    { id: "dolor", label: t.feelPain },
  ];

  function pickFeel(id: Feeling) {
    localSetFeeling(id);
    setFeeling(id);
    setStreak(localStreak());
  }

  return (
    <section className="relative mt-6 rounded-[1.75rem] bg-surface p-5 shadow-card">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">{t.cartaKicker}</p>
      {name ? (
        <p className="mt-2 font-display text-xl font-semibold tracking-[-0.02em]">
          {t.hello}, {name}
        </p>
      ) : null}
      <h2 className="mt-1 font-display text-2xl font-semibold tracking-[-0.03em]">{letter.title}</h2>
      <p className="mt-3 text-sm leading-relaxed text-fg">{letter.body}</p>
      <button type="button" onClick={onAsk} className="mt-4 text-left text-sm font-semibold text-primary">
        {letter.ask}
      </button>

      <p className="mt-6 text-sm font-semibold">{t.howMorning}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {chips.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => pickFeel(c.id)}
            className={cn(
              "h-11 rounded-full px-4 text-sm font-semibold",
              feeling === c.id ? "bg-primary text-primary-fg" : "bg-bg text-fg",
            )}
          >
            {c.label}
          </button>
        ))}
      </div>
      {streak > 0 ? (
        <p className="mt-3 text-xs text-muted">
          {streak === 1 ? t.streak1 : `${streak} ${t.streakN}`}
        </p>
      ) : (
        <p className="mt-3 text-xs text-muted">{t.streakHint}</p>
      )}
    </section>
  );
}
