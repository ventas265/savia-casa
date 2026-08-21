import { Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/brand-mark";

export function WelcomeStart() {
  const { t } = useI18n();
  const steps = [
    { t: t.welcome1t, d: t.welcome1d },
    { t: t.welcome2t, d: t.welcome2d },
    { t: t.welcome3t, d: t.welcome3d },
  ];
  return (
    <div>
      <div className="flex items-center gap-3 text-primary">
        <BrandMark className="size-14 rounded-2xl" />
        <span className="font-display text-4xl font-semibold tracking-[-0.04em]">Savia</span>
      </div>
      <p className="mt-5 text-sm font-semibold tracking-wide text-muted">{t.tagline}</p>
      <h1 className="mt-2 font-display text-3xl font-semibold tracking-[-0.03em]">{t.welcomeTitle}</h1>
      <p className="mt-3 text-base leading-relaxed text-fg">{t.welcomeBody}</p>
      <ol className="mt-6 space-y-3">
        {steps.map((s, i) => (
          <li key={s.t} className="flex gap-3 rounded-[1.25rem] bg-surface p-4 shadow-card">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-sm font-extrabold text-primary-fg">
              {i + 1}
            </span>
            <div>
              <p className="font-bold">{s.t}</p>
              <p className="mt-0.5 text-sm leading-relaxed text-muted">{s.d}</p>
            </div>
          </li>
        ))}
      </ol>
      <Button className="mt-8 w-full" asChild>
        <Link to="/app/onboarding">{t.welcomeCta}</Link>
      </Button>
      <p className="mt-3 text-center text-xs leading-relaxed text-muted">{t.welcomeNote}</p>
      <p className="mt-2 text-center text-xs leading-relaxed text-muted">{t.privacyNote}</p>
    </div>
  );
}
