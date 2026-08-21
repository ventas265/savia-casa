import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { TodayHero } from "@/components/today-hero";
import { WelcomeStart } from "@/components/welcome-start";
import { loadToday, markCameToday, setCycleLength } from "@/lib/savia-api";
import { SAVIA_BETA } from "@/lib/beta";
import { localToday } from "@/lib/savia-local";
import { averageCycle, isCycling, nextPeriodDate } from "@/lib/cycle";
import type { TodaySnapshot } from "@/lib/types";

export const Route = createFileRoute("/app/hoy")({ component: HoyTab });

function HoyTab() {
  const navigate = useNavigate();
  const [data, setData] = useState<TodaySnapshot | null>(() => (SAVIA_BETA ? localToday() : null));

  useEffect(() => {
    loadToday()
      .then(setData)
      .catch(() => {
        if (!SAVIA_BETA) setData(null);
      });
  }, []);

  if (!data) {
    return <Skeleton className="h-64 w-full" />;
  }

  const needsNotebook =
    !data.profile.onboardingDone || (isCycling(data.profile.stage) && !data.profile.lastPeriodStart);

  if (needsNotebook) {
    return <WelcomeStart />;
  }

  return (
    <TodayHero
      name={data.profile.displayName}
      stage={data.profile.stage}
      phase={data.phase}
      cycleLength={data.profile.cycleLength}
      nextPeriod={nextPeriodDate(
        data.profile.lastPeriodStart,
        averageCycle(data.periodStarts, data.profile.cycleLength),
      )}
      onCal={() => void navigate({ to: "/app" })}
      onLog={() => void navigate({ to: "/app/registro" })}
      onGuia={() => void navigate({ to: "/app/guia" })}
      onAsk={() => void navigate({ to: "/app/preguntar" })}
      onCameToday={() => {
        void markCameToday().then(setData);
      }}
      onCycleChange={(n) => {
        void setCycleLength(n).then(setData);
      }}
      notify
    />
  );
}
