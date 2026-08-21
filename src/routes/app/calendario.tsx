import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { PageTitle } from "@/components/color-blobs";
import { CycleCalendar } from "@/components/cycle-calendar";
import { Predictions } from "@/components/predictions";
import { loadToday, writeSex, betaPaid } from "@/lib/savia-api";
import { SAVIA_BETA } from "@/lib/beta";
import { localToday } from "@/lib/savia-local";
import { useI18n } from "@/lib/i18n";
import { isCycling, periodDaysFromLogs, formatDay, weightedCycle } from "@/lib/cycle";
import type { SexKind, TodaySnapshot } from "@/lib/types";

export const Route = createFileRoute("/app/calendario")({ component: CalendarTab });

function CalendarTab() {
  const { t, lang } = useI18n();
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

  const paid = betaPaid() || data.profile.plan === "serena" || data.profile.plan === "year";
  const learned = weightedCycle(data.periodStarts, data.profile.cycleLength);

  return (
    <div>
      <PageTitle title={t.navCal} />
      <div className="mt-4 rounded-[1.6rem] bg-surface p-4 shadow-card">
        {isCycling(data.profile.stage) ? (
          <>
            <Predictions
              lastStart={data.profile.lastPeriodStart}
              cycleLength={learned}
              periodLength={data.profile.periodLength}
              starts={data.periodStarts}
              intention={data.profile.intention}
              stage={data.profile.stage}
            />
            <CycleCalendar
              lastStart={data.profile.lastPeriodStart}
              cycleLength={learned}
              periodLength={data.profile.periodLength}
              periodStarts={data.periodStarts}
              periodDays={periodDaysFromLogs(data.recentLogs)}
              logs={data.recentLogs.map((l) => ({ day: l.day, flow: l.flow, symptoms: l.symptoms }))}
              sexDays={sexMarks.map((s) => s.day)}
              sexMarks={sexMarks}
              paid={paid}
              onSetSex={(iso, kind) => void onHeart(iso, kind)}
            />
            {data.periodStarts.length ? (
              <div className="mt-6">
                <p className="text-sm font-semibold">{t.history}</p>
                <ul className="mt-2 space-y-1.5">
                  {[...data.periodStarts]
                    .sort((a, b) => b.localeCompare(a))
                    .slice(0, 8)
                    .map((d) => (
                      <li key={d} className="flex justify-between text-sm">
                        <span>{formatDay(d, lang)}</span>
                        <span className="size-2.5 self-center rounded-full bg-cal-period" />
                      </li>
                    ))}
                </ul>
              </div>
            ) : null}
          </>
        ) : (
          <p className="text-sm leading-relaxed text-muted">{t.calNote}</p>
        )}
      </div>
    </div>
  );
}
