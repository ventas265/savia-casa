import { useI18n } from "@/lib/i18n";
import { localNoteToday } from "@/lib/savia-local";
import { phases, pick } from "@/lib/savia-content";
import type { Phase, Stage } from "@/lib/types";

export function ConsejosHoy({
  stage,
  phase,
  onAsk,
  onGuia,
}: {
  stage: Stage;
  phase: Phase;
  onAsk: () => void;
  onGuia: () => void;
}) {
  const { t, lang } = useI18n();
  const note = localNoteToday(stage, phase, lang);
  const body = phase !== "none" ? pick(phases[phase].do, lang) : note.body;

  return (
    <section className="relative mt-8">
      <p className="kicker">{t.tipsToday}</p>
      <button
        type="button"
        onClick={onAsk}
        className="press card-hot mt-3 w-full rounded-[22px] p-5 text-left"
      >
        <p className="font-display text-xl font-semibold leading-tight tracking-[-0.03em]">{note.title}</p>
        <p className="mt-2 text-sm leading-relaxed text-fg/90 line-clamp-3">{body}</p>
      </button>
      <div className="mt-3 flex gap-3">
        <button
          type="button"
          onClick={onGuia}
          className="press glass min-h-11 flex-1 rounded-full px-4 text-sm font-semibold text-fg"
        >
          {t.library}
        </button>
        <button
          type="button"
          onClick={onAsk}
          className="press glass min-h-11 flex-1 rounded-full px-4 text-sm font-semibold text-fg"
        >
          {t.askTitle}
        </button>
      </div>
    </section>
  );
}
