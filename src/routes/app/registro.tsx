import { createFileRoute } from "@tanstack/react-router";
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

function Registro() {
  const { t } = useI18n();
  const [data, setData] = useState<TodaySnapshot | null>(() => (SAVIA_BETA ? localToday() : null));

  useEffect(() => {
    loadToday()
      .then(setData)
      .catch(() => {
        if (!SAVIA_BETA) setData(null);
      });
  }, []);

  if (!data) return <Skeleton className="h-96 w-full" />;

  return (
    <>
      <PageTitle kicker={data.day} title={t.logToday} />
      <div className="mt-6">
        <LogForm
          day={data.day}
          initial={data.log}
          paid={betaPaid() || data.profile.plan === "serena" || data.profile.plan === "year"}
          onSaved={(log) => setData({ ...data, log })}
        />
      </div>
    </>
  );
}
