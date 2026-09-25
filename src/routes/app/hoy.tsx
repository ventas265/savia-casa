import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { TodayHero } from "@/components/today-hero";
import { RecoveryCard } from "@/components/recovery-card";
import { WelcomeStart } from "@/components/welcome-start";
import { SymptomCheckSheet, useSymptomAsk } from "@/components/symptom-check-sheet";
import { loadToday, markCameToday, setCycleLength } from "@/lib/savia-api";
import { SAVIA_BETA } from "@/lib/beta";
import { localToday } from "@/lib/savia-local";
import { isCycling, predictPeriod } from "@/lib/cycle";
import { useI18n } from "@/lib/i18n";
import type { TodaySnapshot } from "@/lib/types";

export const Route = createFileRoute("/app/hoy")({ component: HoyTab });

function HoySkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <Skeleton className="h-9 w-52 rounded-lg" />
      <Skeleton className="mx-auto h-4 w-36 rounded-full" />
      <div className="grid grid-cols-7 gap-2 pt-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <Skeleton className="h-3 w-6 rounded" />
            <Skeleton className="size-10 rounded-full" />
          </div>
        ))}
      </div>
      <div className="space-y-3 pt-4 text-center">
        <Skeleton className="mx-auto h-12 w-56 rounded-lg" />
        <Skeleton className="mx-auto h-4 w-40 rounded-full" />
      </div>
      <div className="grid grid-cols-2 gap-4 pt-4">
        <Skeleton className="mx-auto size-[4.25rem] rounded-full" />
        <Skeleton className="mx-auto size-[4.25rem] rounded-full" />
      </div>
      <Skeleton className="mt-5 h-36 w-full rounded-[1.6rem]" />
      <Skeleton className="mt-4 h-28 w-full rounded-[1.5rem]" />
    </div>
  );
}

function HoyEmpty() {
  const { t } = useI18n();
  return (
    <div className="pb-8 pt-4">
      <p className="font-display text-3xl font-semibold tracking-[-0.03em]">{t.today}</p>
      <p className="mt-4 text-base leading-relaxed text-muted">{t.emptyLog}</p>
      <Link
        to="/app/onboarding"
        className="mt-8 flex h-14 w-full items-center justify-center rounded-full bg-grad text-base font-semibold text-primary-fg shadow-card"
      >
        {t.welcomeCta}
      </Link>
    </div>
  );
}

function HoyTab() {
  const navigate = useNavigate();
  // Never read localStorage during SSR — that yields empty profile and paints "Registrarme".
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

  const onboarded = Boolean(
    data?.profile.onboardingDone && (!isCycling(data.profile.stage) || data.profile.lastPeriodStart),
  );
  const symAsk = useSymptomAsk(ready && Boolean(data), onboarded, data?.log ?? null);

  useEffect(() => {
    if (!ready || !data) return;
    // Onboarded but missing FUM — finish notebook, never show marketing Registrarme.
    if (data.profile.onboardingDone && isCycling(data.profile.stage) && !data.profile.lastPeriodStart) {
      void navigate({ to: "/app/onboarding" });
    }
  }, [ready, data, navigate]);

  if (!ready) {
    return <HoySkeleton />;
  }

  if (!data) {
    return <HoyEmpty />;
  }

  if (!data.profile.onboardingDone) {
    return <WelcomeStart />;
  }

  if (isCycling(data.profile.stage) && !data.profile.lastPeriodStart) {
    return <HoySkeleton />;
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
        nextPeriod={
          predictPeriod(
            data.profile.lastPeriodStart,
            data.periodStarts,
            data.profile.cycleLength,
            data.profile.stage,
          ).next
        }
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
        showFertile
        log={data.log}
        onLogSaved={() => {
          void loadToday().then(setData);
        }}
        wrapUpPaid={data.profile.plan === "serena" || data.profile.plan === "year"}
        intention={data.profile.intention}
      />
      {symAsk.open ? (
        <SymptomCheckSheet
          log={data.log}
          phase={data.phase}
          intention={data.profile.intention}
          wrapUpPaid={data.profile.plan === "serena" || data.profile.plan === "year"}
          onClose={symAsk.close}
          onSaved={() => {
            void loadToday().then(setData);
          }}
        />
      ) : null}
    </>
  );
}
