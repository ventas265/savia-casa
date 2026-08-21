import { Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/brand-mark";
import { PlanSplit } from "@/components/plan-split";
import { WelcomeHero } from "@/components/welcome-hero";

export function WelcomeStart() {
  const { t } = useI18n();
  return (
    <div className="pb-8">
      <BrandMark className="size-14 rounded-2xl" />
      <WelcomeHero />
      <p className="mt-6 text-center font-display text-4xl font-semibold leading-tight tracking-[-0.04em]">
        {t.welcomeTitle}
      </p>
      <p className="mt-3 text-center text-base leading-relaxed">{t.welcomeShort}</p>
      <p className="mt-2 text-center text-sm font-semibold text-primary">{t.welcomePeri}</p>
      <PlanSplit />
      <Button className="mt-6 h-14 w-full text-base" asChild>
        <Link to="/app/onboarding">{t.welcomeCta}</Link>
      </Button>
      <p className="mt-3 text-center text-xs text-muted">{t.welcomeNote}</p>
    </div>
  );
}
