import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CycleCalendar } from "@/components/cycle-calendar";
import { Predictions } from "@/components/predictions";
import { getToday } from "@/lib/savia-server";
import { useI18n } from "@/lib/i18n";
import { isCycling, periodDaysFromLogs } from "@/lib/cycle";
import type { TodaySnapshot } from "@/lib/types";

export const Route = createFileRoute("/app/")({ component: CalendarTab });

function CalendarTab() {
  const { t } = useI18n();
  const [data, setData] = useState<TodaySnapshot | null>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    getToday()
      .then(setData)
      .catch(() => setErr(true));
  }, []);

  if (!data && !err) {
    return (
      <AppShell current="cal">
        <Skeleton className="h-96 w-full" />
      </AppShell>
    );
  }
  if (!data) {
    return (
      <AppShell current="cal">
        <p className="text-muted">{t.errorGeneric}</p>
      </AppShell>
    );
  }

  if (!data.profile.onboardingDone) {
    return (
      <AppShell current="cal">
        <div className="py-16 text-center">
          <h1 className="text-2xl font-semibold">{t.onboardingTitle}</h1>
          <p className="mt-3 text-muted">{t.onboardingBody}</p>
          <Button className="mt-6" asChild>
            <Link to="/app/onboarding">{t.start}</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell current="cal">
      {isCycling(data.profile.stage) ? (
        <div className="rounded-3xl bg-surface p-4">
          <Predictions
            lastStart={data.profile.lastPeriodStart}
            cycleLength={data.profile.cycleLength}
            periodLength={data.profile.periodLength}
            starts={data.periodStarts}
            intention={data.profile.intention}
          />
          <CycleCalendar
            lastStart={data.profile.lastPeriodStart}
            cycleLength={data.profile.cycleLength}
            periodLength={data.profile.periodLength}
            periodStarts={data.periodStarts}
            periodDays={periodDaysFromLogs(data.recentLogs)}
          />
        </div>
      ) : (
        <p className="text-muted">{t.calNote}</p>
      )}
    </AppShell>
  );
}
