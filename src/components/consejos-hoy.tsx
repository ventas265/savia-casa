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
    <section className="relative mt-10">
      <p className="text-sm font-semibold tracking-wide text-muted">{t.tipsToday}</p>
      <button
        type="button"
        onClick={onAsk}
        className="press mt-3 w-full rounded-[1.5rem] bg-primary/12 p-5 text-left shadow-card"
      >
        <p className="font-display text-xl font-semibold leading-tight tracking-[-0.03em]">{note.title}</p>
        <p className="mt-2 text-sm leading-relaxed text-fg/90 line-clamp-3">{body}</p>
      </button>
      <div className="mt-3 flex gap-3">
        <button
          type="button"
          onClick={onGuia}
          className="press min-h-11 flex-1 rounded-full bg-surface px-4 text-sm font-semibold text-fg shadow-card"
        >
          {t.library}
        </button>
        <button
          type="button"
          onClick={onAsk}
          className="press min-h-11 flex-1 rounded-full bg-plum/15 px-4 text-sm font-semibold text-fg"
        >
          {t.askTitle}
        </button>
      </div>
    </section>
  );
}
