import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { PageTitle } from "@/components/color-blobs";
import { LogForm } from "@/components/log-form";
import { Skeleton } from "@/components/ui/skeleton";
import { loadToday, betaPaid } from "@/lib/savia-api";
import { useI18n } from "@/lib/i18n";
import type { TodaySnapshot } from "@/lib/types";

export const Route = createFileRoute("/app/registro")({ component: Registro });

function Registro() {
  const { t } = useI18n();
  const [data, setData] = useState<TodaySnapshot | null>(null);

  useEffect(() => {
    loadToday().then(setData).catch(() => setData(null));
  }, []);

  if (!data) {
    return (
      <AppShell current="log">
        <Skeleton className="h-96 w-full" />
      </AppShell>
    );
  }

  return (
    <AppShell current="log">
      <PageTitle kicker={data.day} title={t.logToday} />
      <div className="mt-6">
        <LogForm
          day={data.day}
          initial={data.log}
          paid={betaPaid() || data.profile.plan === "serena" || data.profile.plan === "year"}
          onSaved={(log) => setData({ ...data, log })}
        />
      </div>
    </AppShell>
  );
}
