import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FloToday } from "@/components/flo-today";
import { loadToday, markCameToday, setCycleLength } from "@/lib/savia-api";
import { useI18n } from "@/lib/i18n";
import { averageCycle, nextPeriodDate } from "@/lib/cycle";
import type { TodaySnapshot } from "@/lib/types";

export const Route = createFileRoute("/app/hoy")({ component: HoyTab });

function HoyTab() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [data, setData] = useState<TodaySnapshot | null>(null);

  useEffect(() => {
    loadToday()
      .then(setData)
      .catch(() => setData(null));
  }, []);

  if (!data) {
    return (
      <AppShell current="hoy">
        <Skeleton className="h-64 w-full" />
      </AppShell>
    );
  }

  if (!data.profile.onboardingDone) {
    return (
      <AppShell current="hoy">
        <Button asChild>
          <Link to="/app/onboarding">{t.start}</Link>
        </Button>
      </AppShell>
    );
  }

  return (
    <AppShell current="hoy">
      <FloToday
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
    </AppShell>
  );
}
