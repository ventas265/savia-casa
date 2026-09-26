import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageTitle } from "@/components/color-blobs";
import { LogForm } from "@/components/log-form";
import { Skeleton } from "@/components/ui/skeleton";
import { loadToday } from "@/lib/savia-api";
import { SAVIA_BETA } from "@/lib/beta";
import { localToday } from "@/lib/savia-local";
import { useI18n } from "@/lib/i18n";
import { isCycling, todayISO, dayInfo, formatDay, periodDaysFromLogs, predictPeriod } from "@/lib/cycle";
import { isIsoDay, resolveRegistroDay, setSelectedDay } from "@/lib/selected-day";
import type { TodaySnapshot } from "@/lib/types";

export const Route = createFileRoute("/app/registro")({
  validateSearch: (search: Record<string, unknown>): { day?: string } => {
    const raw = search.day;
    if (typeof raw === "string" && isIsoDay(raw)) return { day: raw };
    return {};
  },
  component: Registro,
});

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
        className="mt-8 flex h-14 w-full items-center justify-center rounded-full bg-grad text-base font-semibold text-primary-fg shadow-card"
      >
        {t.today}
      </Link>
    </div>
  );
}

function Registro() {
  const { t, lang } = useI18n();
  const { day: searchDay } = Route.useSearch();
  const [data, setData] = useState<TodaySnapshot | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    if (SAVIA_BETA) {
      const local = localToday();
      if (alive) {
        setData(local);
        setReady(true);
      }
    }
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

  const focusDay = useMemo(() => {
    if (!data) return searchDay ?? null;
    // Prefer browser-local today — snapshot.day may be server UTC.
    return resolveRegistroDay(searchDay, todayISO());
  }, [data, searchDay]);

  useEffect(() => {
    if (focusDay) setSelectedDay(focusDay);
  }, [focusDay]);

  if (!ready) return <RegistroSkeleton />;
  if (!data || !focusDay) return <RegistroEmpty />;
  const focusInfo = dayInfo(focusDay, {
    lastStart: data.profile.lastPeriodStart,
    cycleLength: predictPeriod(data.profile.lastPeriodStart, data.periodStarts, data.profile.cycleLength, data.profile.stage).len,
    periodLength: data.profile.periodLength,
    periodStarts: data.periodStarts,
    periodDays: periodDaysFromLogs(data.recentLogs),
    today: todayISO(),
  });

  const initial =
    data.recentLogs.find((l) => l.day === focusDay) ?? (data.log?.day === focusDay ? data.log : null);

  return (
    <>
      <div className="flex flex-col gap-2">
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-sage-soft px-3 py-1 text-xs font-semibold text-sage-deep">
          <span className="size-1.5 rounded-full bg-sage-deep" aria-hidden />
          {formatDay(focusDay, lang)}
        </span>
        <PageTitle title={t.logToday} />
      </div>
      <div className="mt-5">
        <LogForm
          key={focusDay}
          day={focusDay}
          initial={initial}
          wrapUpPaid={data.profile.plan === "serena" || data.profile.plan === "year"}
          phase={focusInfo.phase}
          intention={data.profile.intention}
          dayMark={isCycling(data.profile.stage) ? focusInfo.mark : null}
          onSaved={(log) =>
            setData({
              ...data,
              log: log.day === todayISO() ? log : data.log,
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
