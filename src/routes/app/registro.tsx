import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { LogForm } from "@/components/log-form";
import { Skeleton } from "@/components/ui/skeleton";
import { getToday } from "@/lib/savia-server";
import { useI18n } from "@/lib/i18n";
import type { TodaySnapshot } from "@/lib/types";

export const Route = createFileRoute("/app/registro")({ component: Registro });

function Registro() {
  const { t } = useI18n();
  const [data, setData] = useState<TodaySnapshot | null>(null);

  useEffect(() => {
    getToday().then(setData).catch(() => setData(null));
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
      <h1 className="text-2xl font-semibold">{t.logToday}</h1>
      <p className="mt-1 text-sm text-muted">{data.day}</p>
      <div className="mt-6">
        <LogForm day={data.day} initial={data.log} onSaved={(log) => setData({ ...data, log })} />
      </div>
    </AppShell>
  );
}
