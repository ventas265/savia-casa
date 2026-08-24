import { Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/brand-mark";
import { WelcomeHero } from "@/components/welcome-hero";
import { InstallSavia } from "@/components/install-savia";

export function WelcomeStart() {
  const { t } = useI18n();
  return (
    <div className="pb-8">
      <BrandMark className="size-14 rounded-2xl" />
      <p className="mt-6 font-display text-4xl font-semibold leading-tight tracking-[-0.04em]">
        {t.welcomeTitle}
      </p>
      <p className="mt-3 text-base leading-relaxed">{t.welcomeShort}</p>
      <Button className="mt-8 h-14 w-full text-base" asChild>
        <Link to="/app/onboarding">{t.welcomeCta}</Link>
      </Button>
      <p className="mt-3 text-center text-xs text-muted">{t.welcomeNote}</p>
      <WelcomeHero />
      <p className="mt-4 text-center text-sm font-semibold text-primary">{t.welcomePeri}</p>
      <div className="mt-8">
        <InstallSavia />
      </div>
    </div>
  );
}
