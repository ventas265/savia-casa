import { Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { WelcomeHero } from "@/components/welcome-hero";

export function WelcomeStart() {
  const { t } = useI18n();
  return (
    <div className="pb-8">
      <p className="font-display text-[2.75rem] font-semibold leading-[1] tracking-[-0.05em]">
        {t.welcomeTitle}
      </p>
      <p className="mt-4 text-base leading-relaxed text-muted">{t.welcomeShort}</p>
      <Button className="mt-8 h-14 w-full text-base font-semibold shadow-[0_10px_30px_-8px_rgb(255_79_123/0.6)]" asChild>
        <Link to="/app/onboarding">{t.welcomeCta}</Link>
      </Button>
      <p className="mt-3 text-center text-xs text-muted">{t.welcomeNote}</p>
      <WelcomeHero />
    </div>
  );
}
