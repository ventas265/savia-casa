import { useState } from "react";
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
import { cn } from "@/lib/utils";

type Tab = "hormonas" | "tes" | "comida" | "embarazo" | "posparto" | "peri" | "meno";

export function LibraryBody({ start = "hormonas" }: { start?: Tab }) {
  const { t, lang } = useI18n();
  const [tab, setTab] = useState<Tab>(start);
  const jumps: { id: Tab; label: string }[] = [
    { id: "hormonas", label: t.hormones },
    { id: "tes", label: t.teas },
    { id: "comida", label: t.food },
    { id: "embarazo", label: t.pregnancy },
    { id: "posparto", label: t.postpartum },
    { id: "peri", label: t.peri },
    { id: "meno", label: t.meno },
  ];

  return (
    <div>
      <nav className="-mx-4 overflow-x-auto px-4">
        <div className="flex gap-2 pb-1">
          {jumps.map((j) => (
            <button
              key={j.id}
              type="button"
              onClick={() => setTab(j.id)}
              className={cn(
                "press h-11 shrink-0 rounded-full px-4 text-sm font-semibold",
                tab === j.id ? "bg-primary text-primary-fg" : "bg-surface text-fg shadow-card",
              )}
            >
              {j.label}
            </button>
          ))}
        </div>
      </nav>

      <div className="mt-5 space-y-3">
        {tab === "hormonas"
          ? hormones.map((h) => (
              <Card key={h.id}>
                <h3 className="font-display text-xl font-semibold">{pick(h.name, lang)}</h3>
                <p className="mt-2 text-sm leading-relaxed">{pick(h.what, lang)}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted">{pick(h.when, lang)}</p>
              </Card>
            ))
          : null}
        {tab === "tes"
          ? teas.map((tea) => (
              <Card key={tea.id}>
                <h3 className="font-display text-xl font-semibold">{pick(tea.name, lang)}</h3>
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
            ))
          : null}
        {tab === "comida"
          ? foods.map((f) => (
              <Card key={f.id}>
                <h3 className="font-display text-xl font-semibold">{pick(f.title, lang)}</h3>
                <p className="mt-2 text-sm leading-relaxed">{pick(f.why, lang)}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted">{pick(f.plate, lang)}</p>
              </Card>
            ))
          : null}
        {tab === "embarazo" ? (
          <>
            {trimester.map((tr) => (
              <Card key={tr.n}>
                <h3 className="font-display text-xl font-semibold">{pick(tr.title, lang)}</h3>
                <p className="mt-2 text-sm leading-relaxed">{pick(tr.body, lang)}</p>
              </Card>
            ))}
            {pregnancyWeeks.map((w) => (
              <Card key={w.week}>
                <p className="text-xs tracking-wide text-muted uppercase">
                  {t.weekOf} {w.week}
                </p>
                <h3 className="mt-1 font-display text-xl font-semibold">{pick(w.title, lang)}</h3>
                <p className="mt-2 text-sm leading-relaxed">{pick(w.body, lang)}</p>
              </Card>
            ))}
          </>
        ) : null}
        {tab === "posparto"
          ? postpartumGuide.map((g) => (
              <Card key={pick(g.title, "es")}>
                <h3 className="font-display text-xl font-semibold">{pick(g.title, lang)}</h3>
                <p className="mt-2 text-sm leading-relaxed">{pick(g.body, lang)}</p>
              </Card>
            ))
          : null}
        {tab === "peri"
          ? periGuide.map((g) => (
              <Card key={pick(g.title, "es")}>
                <h3 className="font-display text-xl font-semibold">{pick(g.title, lang)}</h3>
                <p className="mt-2 text-sm leading-relaxed">{pick(g.body, lang)}</p>
              </Card>
            ))
          : null}
        {tab === "meno"
          ? menoGuide.map((g) => (
              <Card key={pick(g.title, "es")}>
                <h3 className="font-display text-xl font-semibold">{pick(g.title, lang)}</h3>
                <p className="mt-2 text-sm leading-relaxed">{pick(g.body, lang)}</p>
              </Card>
            ))
          : null}
      </div>
    </div>
  );
}
