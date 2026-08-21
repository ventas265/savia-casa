import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { BrandLockup } from "@/components/brand-mark";
import { LangToggle } from "@/components/lang-toggle";
import { Shell } from "@/components/shell";
import { WelcomeStart } from "@/components/welcome-start";
import { isCycling } from "@/lib/cycle";
import { localToday } from "@/lib/savia-local";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
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
        <div className="flex h-14 items-center justify-between gap-3 px-4">
          <BrandLockup to="/" />
          <LangToggle />
        </div>
      }
    >
      <WelcomeStart />
    </Shell>
  );
}
