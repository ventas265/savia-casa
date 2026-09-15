import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageTitle } from "@/components/color-blobs";
import { LogForm } from "@/components/log-form";
import { Skeleton } from "@/components/ui/skeleton";
import { loadToday, betaPaid } from "@/lib/savia-api";
import { SAVIA_BETA } from "@/lib/beta";
import { localToday } from "@/lib/savia-local";
import { useI18n } from "@/lib/i18n";
import type { TodaySnapshot } from "@/lib/types";

export const Route = createFileRoute("/app/registro")({ component: Registro });

function RegistroSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <Skeleton className="h-4 w-28 rounded-full" />
      <Skeleton className="h-9 w-48 rounded-lg" />
      <Skeleton className="mt-4 h-24 w-full rounded-[1.5rem]" />
      <Skeleton className="h-16 w-full rounded-[1.25rem]" />
      <Skeleton className="h-16 w-full rounded-[1.25rem]" />
      <Skeleton className="h-40 w-full rounded-[1.5rem]" />
    </div>
  );
}

function RegistroEmpty() {
  const { t } = useI18n();
  return (
    <div className="pb-8 pt-2">
      <p className="font-display text-3xl font-semibold tracking-[-0.03em]">{t.logToday}</p>
      <p className="mt-4 text-base leading-relaxed text-muted">{t.emptyLog}</p>
      <Link
        to="/app/hoy"
        className="mt-8 flex h-14 w-full items-center justify-center rounded-full bg-primary text-base font-semibold text-primary-fg shadow-card"
      >
        {t.today}
      </Link>
    </div>
  );
}

function Registro() {
  const { t } = useI18n();
  const [data, setData] = useState<TodaySnapshot | null>(() => (SAVIA_BETA ? localToday() : null));
  const [ready, setReady] = useState(() => Boolean(SAVIA_BETA));

  useEffect(() => {
    let alive = true;
    loadToday()
      .then((snap) => {
        if (alive) setData(snap);
      })
      .catch(() => {
        if (alive && !SAVIA_BETA) setData(null);
      })
      .finally(() => {
        if (alive) setReady(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  if (!ready) return <RegistroSkeleton />;
  if (!data) return <RegistroEmpty />;

  return (
    <>
      <PageTitle kicker={data.day} title={t.logToday} />
      <div className="mt-6">
        <LogForm
          day={data.day}
          initial={data.log}
          paid={betaPaid() || data.profile.plan === "serena" || data.profile.plan === "year"}
          onSaved={(log) =>
            setData({
              ...data,
              log,
              recentLogs: [log, ...data.recentLogs.filter((l) => l.day !== log.day)].slice(0, 90),
              sexDays: log.sex
                ? Array.from(new Set([log.day, ...data.sexDays]))
                : data.sexDays.filter((d) => d !== log.day),
              sexMarks: log.sex
                ? [...data.sexMarks.filter((s) => s.day !== log.day), { day: log.day, kind: log.sexKind }]
                : data.sexMarks.filter((s) => s.day !== log.day),
            })
          }
        />
      </div>
    </>
  );
}
