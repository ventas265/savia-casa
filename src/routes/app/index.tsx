import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { PageTitle } from "@/components/color-blobs";
import { CycleCalendar } from "@/components/cycle-calendar";
import { Predictions } from "@/components/predictions";
import { WelcomeStart } from "@/components/welcome-start";
import { loadToday, writeSex, betaPaid } from "@/lib/savia-api";
import { SAVIA_BETA } from "@/lib/beta";
import { localToday } from "@/lib/savia-local";
import { useI18n } from "@/lib/i18n";
import { isCycling, periodDaysFromLogs } from "@/lib/cycle";
import type { SexKind, TodaySnapshot } from "@/lib/types";

export const Route = createFileRoute("/app/")({ component: CalendarTab });

function CalendarTab() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [data, setData] = useState<TodaySnapshot | null>(() => (SAVIA_BETA ? localToday() : null));
  const [err, setErr] = useState(false);
  const [sexMarks, setSexMarks] = useState<{ day: string; kind: SexKind }[]>(() =>
    SAVIA_BETA ? localToday().sexMarks : [],
  );

  useEffect(() => {
    loadToday()
      .then((snap) => {
        setData(snap);
        setSexMarks(snap.sexMarks);
      })
      .catch(() => {
        if (!SAVIA_BETA) setErr(true);
      });
  }, []);

  async function onHeart(iso: string, kind: SexKind) {
    const paid = betaPaid() || data?.profile.plan === "serena" || data?.profile.plan === "year";
    if (!paid) {
      toast.error(t.sexPay);
      void navigate({ to: "/pagar" });
      return;
    }
    const res = await writeSex(iso, kind);
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

  if (!data && !err) return <Skeleton className="h-96 w-full" />;
  if (!data) return <p className="text-muted">{t.errorGeneric}</p>;

  if (!data.profile.onboardingDone || (isCycling(data.profile.stage) && !data.profile.lastPeriodStart)) {
    return <WelcomeStart />;
  }

  const paid = betaPaid() || data.profile.plan === "serena" || data.profile.plan === "year";

  return isCycling(data.profile.stage) ? (
    <div>
      <PageTitle title={t.navCal} />
      <div className="mt-4 rounded-[1.6rem] bg-surface p-4 shadow-card">
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
    </div>
  ) : (
    <p className="text-muted">{t.calNote}</p>
  );
}
