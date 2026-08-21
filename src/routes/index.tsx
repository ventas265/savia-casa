import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import { LangToggle } from "@/components/lang-toggle";
import { Shell } from "@/components/shell";
import { WelcomeStart } from "@/components/welcome-start";
import { isCycling } from "@/lib/cycle";
import { localToday } from "@/lib/savia-local";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const { t } = useI18n();
  const navigate = useNavigate();

  useEffect(() => {
    const p = localToday().profile;
    if (p.onboardingDone && (p.lastPeriodStart || !isCycling(p.stage))) {
      void navigate({ to: "/app/hoy" });
    }
  }, [navigate]);

  return (
    <Shell
      header={
        <div className="flex h-12 items-center justify-between gap-3 px-4">
          <p className="text-lg font-extrabold tracking-tight text-primary">{t.brand}</p>
          <LangToggle />
        </div>
      }
    >
      <WelcomeStart />
    </Shell>
  );
}
