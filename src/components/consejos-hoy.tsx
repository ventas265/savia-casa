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
  const body = phase !== "none" ? pick(phases[phase].do, lang) : t.periSub;

  return (
    <section className="relative mt-8">
      <p className="text-sm font-semibold">{t.tipsToday}</p>
      <div className="-mx-4 mt-3 flex gap-3 overflow-x-auto px-4 pb-1">
        <TipCard title={note.title} body={note.body} onClick={onAsk} tone="rose" />
        <TipCard title={t.hormoneToday} body={body} onClick={onGuia} tone="sage" />
        <TipCard title={t.askTitle} body={t.askEmpty} onClick={onAsk} tone="plum" />
      </div>
    </section>
  );
}

function TipCard({
  title,
  body,
  onClick,
  tone,
}: {
  title: string;
  body: string;
  onClick: () => void;
  tone: "rose" | "sage" | "plum";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`press min-h-36 w-[15.5rem] shrink-0 rounded-[1.5rem] p-4 text-left shadow-card ${
        tone === "rose" ? "bg-primary/12" : tone === "sage" ? "bg-accent/40" : "bg-plum/15"
      }`}
    >
      <p className="font-display text-lg font-semibold leading-tight tracking-[-0.03em]">{title}</p>
      <p className="mt-2 line-clamp-4 text-sm leading-relaxed">{body}</p>
    </button>
  );
}
