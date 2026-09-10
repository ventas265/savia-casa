import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageTitle } from "@/components/color-blobs";
import { LibraryBody } from "@/components/library-body";
import { loadToday } from "@/lib/savia-api";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/app/guia")({ component: AppGuide });

function AppGuide() {
  const { t } = useI18n();
  const [start, setStart] = useState<"hormonas" | "tes" | "comida" | "embarazo" | "posparto" | "peri" | "meno">(
    "hormonas",
  );
  useEffect(() => {
    loadToday()
      .then((s) => {
        const st = s.profile.stage;
        if (st === "peri") setStart("peri");
        else if (st === "meno") setStart("meno");
        else if (st === "pregnancy") setStart("embarazo");
        else if (st === "postpartum") setStart("posparto");
      })
      .catch(() => {});
  }, []);
  return (
    <>
      <PageTitle title={t.library} />
      <div className="mt-6">
        <LibraryBody key={start} start={start} />
      </div>
    </>
  );
}