import { foods, phases, pick, teas } from "@/lib/savia-content";
import type { Phase, Stage } from "@/lib/types";
import { useI18n } from "@/lib/i18n";

export function PhaseForYou({
  stage,
  phase,
  onGuia,
}: {
  stage: Stage;
  phase: Phase;
  onGuia: () => void;
}) {
  const { t, lang } = useI18n();
  const tea =
    teas.find((x) => x.stages.includes(stage) && x.phases.includes(phase)) ||
    teas.find((x) => x.stages.includes(stage));
  const food =
    foods.find((x) => x.stages.includes(stage) && x.phases.includes(phase)) ||
    foods.find((x) => x.stages.includes(stage));
  const hormone = phase !== "none" ? pick(phases[phase].hormone, lang) : "";

  const items = [
    { k: t.hormones, v: hormone.slice(0, 90) + (hormone.length > 90 ? "…" : "") },
    tea ? { k: t.teas, v: pick(tea.name, lang) } : null,
    food ? { k: t.food, v: pick(food.title, lang) } : null,
  ].filter(Boolean) as { k: string; v: string }[];

  if (!items.length) return null;

  return (
    <section className="relative mt-6 overflow-hidden rounded-[1.6rem] bg-plum p-5 text-primary-fg shadow-card">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] opacity-80">{t.forYou}</p>
      <div className="mt-3 space-y-3">
        {items.map((it) => (
          <button key={it.k} type="button" onClick={onGuia} className="press block w-full text-left">
            <p className="text-[10px] font-bold uppercase tracking-wide opacity-70">{it.k}</p>
            <p className="mt-0.5 font-display text-xl font-semibold leading-snug">{it.v}</p>
          </button>
        ))}
      </div>
    </section>
  );
}
