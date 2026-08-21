import { createFileRoute } from "@tanstack/react-router";
import { PageTitle } from "@/components/color-blobs";
import { LibraryBody } from "@/components/library-body";
import { Photo } from "@/components/photo";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/app/guia")({ component: AppGuide });

function AppGuide() {
  const { t } = useI18n();
  return (
    <>
      <PageTitle title={t.library} />
      <Photo src="/photos/te.jpg" alt="" className="mt-4 h-36 w-full rounded-[1.5rem] object-cover shadow-card" />
      <div className="mt-6">
        <LibraryBody />
      </div>
    </>
  );
}
