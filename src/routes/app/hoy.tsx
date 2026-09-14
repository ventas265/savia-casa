import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { TodayHero } from "@/components/today-hero";
import { RecoveryCard } from "@/components/recovery-card";
import { WelcomeStart } from "@/components/welcome-start";
import { loadToday, markCameToday, setCycleLength } from "@/lib/savia-api";
import { SAVIA_BETA } from "@/lib/beta";
import { localToday } from "@/lib/savia-local";
import { isCycling, nextPeriodDate, weightedCycle } from "@/lib/cycle";
import type { TodaySnapshot } from "@/lib/types";

export const Route = createFileRoute("/app/hoy")({ component: HoyTab });

function HoyTab() {
  const navigate = useNavigate();
  const [data, setData] = useState<TodaySnapshot | null>(() => (SAVIA_BETA ? localToday() : null));

  useEffect(() => {
    loadToday()
      .then((snap) => {
        setData(snap);
      })
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
    <>
      <RecoveryCard />
      <TodayHero
      name={data.profile.displayName}
      stage={data.profile.stage}
      phase={data.phase}
      cycleLength={data.profile.cycleLength}
      cycleDay={data.cycleDay}
      lastStart={data.profile.lastPeriodStart}
      periodLength={data.profile.periodLength}
      periodStarts={data.periodStarts}
      nextPeriod={nextPeriodDate(
        data.profile.lastPeriodStart,
        weightedCycle(data.periodStarts, data.profile.cycleLength),
      )}
      onCal={() => void navigate({ to: "/app/calendario" })}
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
      showFertile={data.profile.intention !== "track"}
      log={data.log}
      onLogSaved={() => {
        void loadToday().then(setData);
      }}
    />
    </>
  );
}
