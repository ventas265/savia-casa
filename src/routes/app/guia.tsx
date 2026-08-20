import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { PageTitle } from "@/components/color-blobs";
import { LibraryBody } from "@/components/library-body";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/app/guia")({ component: AppGuide });

function AppGuide() {
  const { t } = useI18n();
  return (
    <AppShell current="guia">
      <PageTitle title={t.library} />
      <div className="mt-6">
        <LibraryBody />
      </div>
    </AppShell>
  );
}
