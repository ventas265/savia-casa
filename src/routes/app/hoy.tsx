import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageTitle } from "@/components/color-blobs";
import { FloToday } from "@/components/flo-today";
import { loadToday, markCameToday, setCycleLength } from "@/lib/savia-api";
import { SAVIA_BETA } from "@/lib/beta";
import { localToday } from "@/lib/savia-local";
import { useI18n } from "@/lib/i18n";
import { averageCycle, nextPeriodDate } from "@/lib/cycle";
import type { TodaySnapshot } from "@/lib/types";

export const Route = createFileRoute("/app/hoy")({ component: HoyTab });

function HoyTab() {
  const { t } = useI18n();
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

  if (!data.profile.onboardingDone) {
    return (
      <>
        <PageTitle kicker={t.notebookNote} title={t.onboardingTitle} />
        <Button className="mt-6" asChild>
          <Link to="/app/onboarding">{t.start}</Link>
        </Button>
      </>
    );
  }

  return (
    <FloToday
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
