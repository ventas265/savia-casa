import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { LibraryBody } from "@/components/library-body";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/app/guia")({ component: AppGuide });

function AppGuide() {
  const { t } = useI18n();
  return (
    <AppShell current="guia">
      <h1 className="text-2xl font-semibold">{t.library}</h1>
      <div className="mt-6">
        <LibraryBody />
      </div>
    </AppShell>
  );
}
