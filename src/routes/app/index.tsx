import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CycleCalendar } from "@/components/cycle-calendar";
import { Predictions } from "@/components/predictions";
import { getToday, toggleSex } from "@/lib/savia-server";
import { useI18n } from "@/lib/i18n";
import { isCycling, periodDaysFromLogs } from "@/lib/cycle";
import type { SexKind, TodaySnapshot } from "@/lib/types";

export const Route = createFileRoute("/app/")({ component: CalendarTab });

function CalendarTab() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [data, setData] = useState<TodaySnapshot | null>(null);
  const [err, setErr] = useState(false);
  const [sexMarks, setSexMarks] = useState<{ day: string; kind: SexKind }[]>([]);

  useEffect(() => {
    getToday()
      .then((snap) => {
        setData(snap);
        setSexMarks(snap.sexMarks);
      })
      .catch(() => setErr(true));
  }, []);

  async function onHeart(iso: string, kind: SexKind) {
    const paid = data?.profile.plan === "serena" || data?.profile.plan === "year";
    if (!paid) {
      toast.error(t.sexPay);
      void navigate({ to: "/pagar" });
      return;
    }
    const res = await toggleSex({ data: { day: iso, kind } });
    if (!res.ok) {
      toast.error(t.sexPay);
      void navigate({ to: "/pagar" });
      return;
    }
    setSexMarks((prev) => {
      const rest = prev.filter((s) => s.day !== iso);
      return res.sex ? [...rest, { day: iso, kind: res.kind }] : rest;
    });
  }

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

  const paid = data.profile.plan === "serena" || data.profile.plan === "year";

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
            sexDays={sexMarks.map((s) => s.day)}
            sexMarks={sexMarks}
            paid={paid}
            onSetSex={(iso, kind) => void onHeart(iso, kind)}
          />
        </div>
      ) : (
        <p className="text-muted">{t.calNote}</p>
      )}
    </AppShell>
  );
}
