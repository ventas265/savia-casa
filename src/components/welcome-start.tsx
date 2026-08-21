import { Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/brand-mark";

export function WelcomeStart() {
  const { t } = useI18n();
  return (
    <div className="flex min-h-[70vh] flex-col">
      <BrandMark className="size-16 rounded-2xl" />
      <p className="mt-8 font-display text-4xl font-semibold leading-tight tracking-[-0.04em]">
        {t.welcomeTitle}
      </p>
      <p className="mt-4 text-lg leading-relaxed">{t.welcomeShort}</p>
      <div className="mt-auto pt-10">
        <Button className="h-14 w-full text-base" asChild>
          <Link to="/app/onboarding">{t.welcomeCta}</Link>
        </Button>
        <p className="mt-3 text-center text-xs text-muted">{t.welcomeNote}</p>
      </div>
    </div>
  );
}
