import { useI18n } from "@/lib/i18n";
import { Card } from "@/components/ui/card";
import {
  foods,
  hormones,
  menoGuide,
  periGuide,
  pick,
  postpartumGuide,
  pregnancyWeeks,
  teas,
  trimester,
} from "@/lib/savia-content";

export function LibraryBody() {
  const { t, lang } = useI18n();
  const jumps = [
    ["hormonas", t.hormones],
    ["tes", t.teas],
    ["comida", t.food],
    ["embarazo", t.pregnancy],
    ["posparto", t.postpartum],
    ["peri", t.peri],
    ["meno", t.meno],
  ] as const;
  return (
    <div className="space-y-12">
      <nav className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {jumps.map(([id, label]) => (
          <a
            key={id}
            href={`#${id}`}
            className="shrink-0 rounded-full bg-surface px-4 py-2 text-xs font-medium"
          >
            {label}
          </a>
        ))}
      </nav>
      <section id="hormonas">
        <h2 className="font-display text-2xl font-medium">{t.hormones}</h2>
        <div className="mt-5 grid gap-4">
          {hormones.map((h) => (
            <Card key={h.id}>
              <h3 className="font-display text-xl font-medium">{pick(h.name, lang)}</h3>
              <p className="mt-2 text-sm leading-relaxed">{pick(h.what, lang)}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted">{pick(h.when, lang)}</p>
            </Card>
          ))}
        </div>
      </section>

      <section id="tes">
        <h2 className="font-display text-2xl font-medium">{t.teas}</h2>
        <div className="mt-5 grid gap-4">
          {teas.map((tea) => (
            <Card key={tea.id}>
              <h3 className="font-display text-xl font-medium">{pick(tea.name, lang)}</h3>
              <p className="mt-1 text-sm text-muted">{pick(tea.taste, lang)}</p>
              <p className="mt-2 text-sm leading-relaxed">
                <span className="font-medium">{t.for}: </span>
                {pick(tea.for, lang)}
              </p>
              <p className="mt-1 text-sm leading-relaxed">
                <span className="font-medium">{t.brew}: </span>
                {pick(tea.brew, lang)}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-primary">
                <span className="font-medium">{t.avoid}: </span>
                {pick(tea.avoid, lang)}
              </p>
            </Card>
          ))}
        </div>
      </section>

      <section id="comida">
        <h2 className="font-display text-2xl font-medium">{t.food}</h2>
        <div className="mt-5 grid gap-4">
          {foods.map((f) => (
            <Card key={f.id}>
              <h3 className="font-display text-xl font-medium">{pick(f.title, lang)}</h3>
              <p className="mt-2 text-sm leading-relaxed">{pick(f.why, lang)}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted">{pick(f.plate, lang)}</p>
            </Card>
          ))}
        </div>
      </section>

      <section id="embarazo">
        <h2 className="font-display text-2xl font-medium">{t.pregnancy}</h2>
        <div className="mt-5 grid gap-4">
          {trimester.map((tr) => (
            <Card key={tr.n}>
              <h3 className="font-display text-xl font-medium">{pick(tr.title, lang)}</h3>
              <p className="mt-2 text-sm leading-relaxed">{pick(tr.body, lang)}</p>
            </Card>
          ))}
          {pregnancyWeeks.map((w) => (
            <Card key={w.week}>
              <p className="text-xs tracking-wide text-muted uppercase">
                {t.weekOf} {w.week}
              </p>
              <h3 className="mt-1 font-display text-xl font-medium">{pick(w.title, lang)}</h3>
              <p className="mt-2 text-sm leading-relaxed">{pick(w.body, lang)}</p>
            </Card>
          ))}
        </div>
      </section>

      <section id="posparto">
        <h2 className="font-display text-2xl font-medium">{t.postpartum}</h2>
        <div className="mt-5 grid gap-4">
          {postpartumGuide.map((g) => (
            <Card key={pick(g.title, "es")}>
              <h3 className="font-display text-xl font-medium">{pick(g.title, lang)}</h3>
              <p className="mt-2 text-sm leading-relaxed">{pick(g.body, lang)}</p>
            </Card>
          ))}
        </div>
      </section>

      <section id="peri">
        <h2 className="font-display text-2xl font-medium">{t.peri}</h2>
        <div className="mt-5 grid gap-4">
          {periGuide.map((g) => (
            <Card key={pick(g.title, "es")}>
              <h3 className="font-display text-xl font-medium">{pick(g.title, lang)}</h3>
              <p className="mt-2 text-sm leading-relaxed">{pick(g.body, lang)}</p>
            </Card>
          ))}
        </div>
      </section>

      <section id="meno">
        <h2 className="font-display text-2xl font-medium">{t.meno}</h2>
        <div className="mt-5 grid gap-4">
          {menoGuide.map((g) => (
            <Card key={pick(g.title, "es")}>
              <h3 className="font-display text-xl font-medium">{pick(g.title, lang)}</h3>
              <p className="mt-2 text-sm leading-relaxed">{pick(g.body, lang)}</p>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
