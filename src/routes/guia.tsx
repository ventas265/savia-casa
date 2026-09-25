import { createFileRoute, Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";
import { LibraryBody } from "@/components/library-body";

export const Route = createFileRoute("/guia")({ component: GuidePage });

function GuidePage() {
  const { t } = useI18n();
  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="mx-auto max-w-lg px-4 py-12">
        <h1 className="text-2xl font-semibold">{t.library}</h1>
        <div className="mt-6">
          <LibraryBody />
        </div>
        <Button className="mt-10 w-full" asChild>
          <Link to="/">{t.today}</Link>
        </Button>
      </main>
    </div>
  );
}
