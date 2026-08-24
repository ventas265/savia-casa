import { Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { WelcomeHero } from "@/components/welcome-hero";

export function WelcomeStart() {
  const { t } = useI18n();
  return (
    <div className="pb-8">
      <p className="font-display text-4xl font-semibold leading-tight tracking-[-0.04em]">
        {t.welcomeTitle}
      </p>
      <p className="mt-3 text-base leading-relaxed">{t.welcomeShort}</p>
      <Button className="mt-8 h-14 w-full text-base" asChild>
        <Link to="/app/onboarding">{t.welcomeCta}</Link>
      </Button>
      <p className="mt-3 text-center text-xs text-muted">{t.welcomeNote}</p>
      <WelcomeHero />
    </div>
  );
}
